import { NextRequest, NextResponse } from "next/server";

// La clé ne vit que côté serveur (process.env). Elle n'arrive jamais dans le
// bundle client : ce fichier ne s'exécute que sur le serveur Next.
export const runtime = "nodejs";

type ClaudeRequest = {
  prompt?: unknown;
  search?: unknown;
};

type ClaudeBody = {
  model: string;
  max_tokens: number;
  messages: { role: "user"; content: string }[];
  tools?: { type: string; name: string }[];
};

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY manquante côté serveur." },
      { status: 500 },
    );
  }

  let payload: ClaudeRequest;
  try {
    payload = (await req.json()) as ClaudeRequest;
  } catch {
    return NextResponse.json({ error: "Corps JSON invalide." }, { status: 400 });
  }

  const prompt = typeof payload.prompt === "string" ? payload.prompt.trim() : "";
  const search = payload.search === true;
  if (!prompt) {
    return NextResponse.json({ error: "Champ « prompt » requis." }, { status: 400 });
  }

  const body: ClaudeBody = {
    // Modèle choisi par le brief ; valide et courant sur docs.claude.com.
    model: "claude-sonnet-4-6",
    // 1024 était trop juste : avec la recherche web, un scan (10 niches ou
    // 8-10 outils) épuisait le budget avant le bloc texte JSON → réponse vide.
    max_tokens: 4096,
    messages: [{ role: "user", content: prompt }],
  };
  if (search) {
    // Version courante de l'outil de recherche web (filtrage dynamique),
    // supportée par Sonnet 4.6.
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
  };
  const text = (data.content ?? [])
    .filter((b) => b.type === "text")
    .map((b) => b.text ?? "")
    .join("\n")
    .trim();

  return NextResponse.json({ text });
}
