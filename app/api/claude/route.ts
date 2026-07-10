import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ALLOWED_MODEL_IDS, DEFAULT_MODEL, DEFAULT_OLLAMA_MODEL } from "@/lib/console/models";
import {
  hybridSearchGenerate,
  ollamaGenerate,
} from "@/lib/console/providers";
import { getSession } from "@/lib/session";

// La clé ne vit que côté serveur (process.env). Elle n'arrive jamais dans le
// bundle client : ce fichier ne s'exécute que sur le serveur Next.
export const runtime = "nodejs";

// Corps accepté : seul « prompt » est réellement requis. Les autres champs
// mal formés retombent sur leur défaut (comportement historique conservé),
// via .catch() plutôt qu'un rejet.
const claudeRequestSchema = z.object({
  prompt: z.string().trim().min(1),
  search: z.unknown().transform((v) => v === true),
  // Mode hybride (Ollama + SearXNG) :
  provider: z.enum(["anthropic", "hybrid"]).catch("anthropic"),
  model: z.string().optional().catch(undefined),
  ollamaModel: z.string().min(1).catch(DEFAULT_OLLAMA_MODEL),
  searchQuery: z.string().catch(""),
});

type ClaudeBody = {
  model: string;
  max_tokens: number;
  messages: { role: "user"; content: string }[];
  tools?: { type: string; name: string }[];
};

export async function POST(req: NextRequest) {
  // Route protégée : nécessite une session valide (le middleware exclut /api).
  if (!(await getSession())) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps JSON invalide." }, { status: 400 });
  }

  // Seul « prompt » peut faire échouer le schéma (les autres champs ont un
  // défaut) : un échec équivaut donc à un prompt absent ou vide.
  const parsed = claudeRequestSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Champ « prompt » requis." }, { status: 400 });
  }
  const { prompt, search, provider, ollamaModel, searchQuery } = parsed.data;

  // Mode hybride : Ollama (+ SearXNG si recherche). Ne touche pas Anthropic.
  if (provider === "hybrid") {
    const query = searchQuery.trim() || prompt;
    try {
      const text = search
        ? await hybridSearchGenerate(prompt, ollamaModel, query)
        : await ollamaGenerate(prompt, ollamaModel);
      return NextResponse.json({ text });
    } catch (e) {
      return NextResponse.json(
        { error: (e as Error).message || "Échec du mode hybride." },
        { status: 502 },
      );
    }
  }

  // Mode Anthropic : nécessite la clé côté serveur.
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY manquante côté serveur." },
      { status: 500 },
    );
  }

  // Liste blanche : un modèle absent ou hors liste retombe sur le défaut.
  // Le client ne peut JAMAIS imposer un modèle non autorisé.
  const model =
    parsed.data.model && ALLOWED_MODEL_IDS.includes(parsed.data.model)
      ? parsed.data.model
      : DEFAULT_MODEL;

  const body: ClaudeBody = {
    model,
    // 1024 était trop juste : avec la recherche web, un scan (10 niches ou
    // 8-10 outils) épuisait le budget avant le bloc texte JSON → réponse vide.
    max_tokens: 4096,
    messages: [{ role: "user", content: prompt }],
  };
  if (search) {
    // Version courante de l'outil de recherche web (filtrage dynamique),
    // supportée par la famille Claude 4.x (Sonnet 4.6 / Haiku 4.5).
    body.tools = [{ type: "web_search_20260209", name: "web_search" }];
  }

  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify(body),
  });

  if (!r.ok) {
    return NextResponse.json({ error: await r.text() }, { status: r.status });
  }

  const data = (await r.json()) as {
    content?: { type: string; text?: string }[];
    usage?: unknown;
  };
  const text = (data.content ?? [])
    .filter((b) => b.type === "text")
    .map((b) => b.text ?? "")
    .join("\n")
    .trim();

  // usage + modèle renvoyés pour le suivi de consommation côté client.
  return NextResponse.json({ text, model, usage: data.usage });
}
