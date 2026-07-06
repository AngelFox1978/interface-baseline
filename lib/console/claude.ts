// Client de la console : remplace l'appel direct à l'API Anthropic (qui ne
// marchait que dans les artefacts). On passe par la route serveur /api/claude,
// qui détient la clé. Même signature que le callClaude d'origine.

// Suivi de consommation : le provider enregistre un « sink » qui reçoit l'usage
// de chaque appel Anthropic (le mode hybride ne renvoie pas d'usage → non compté).
export type UsageRecord = {
  model: string;
  input_tokens?: number;
  output_tokens?: number;
  web_search_requests?: number;
};
let usageSink: ((u: UsageRecord) => void) | null = null;
export function setUsageSink(fn: ((u: UsageRecord) => void) | null) {
  usageSink = fn;
}

export type CallClaudeOptions = {
  search?: boolean;
  // Id de modèle (liste blanche). La route revalide et retombe sur le défaut
  // si absent/hors liste — le client ne peut pas forcer un modèle non autorisé.
  model?: string;
  // Mode hybride (Ollama + SearXNG local) :
  provider?: string;
  ollamaModel?: string;
  // Requête web explicite (utilisée par SearXNG en mode hybride + search).
  searchQuery?: string;
};

export async function callClaude(
  prompt: string,
  {
    search = false,
    model,
    provider,
    ollamaModel,
    searchQuery,
  }: CallClaudeOptions = {},
): Promise<string> {
  const r = await fetch("/api/claude", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      prompt,
      search,
      model,
      provider,
      ollamaModel,
      searchQuery,
    }),
  });
  if (!r.ok) {
    // Remonte le détail renvoyé par la route (ex. solde de crédits Anthropic)
    // pour que l'appelant puisse afficher un message clair.
    let detail = "";
    try {
      const body = (await r.json()) as { error?: unknown };
      detail =
        typeof body?.error === "string"
          ? body.error
          : JSON.stringify(body?.error ?? "");
    } catch {
      /* corps non-JSON */
    }
    throw new Error(detail || "HTTP " + r.status);
  }
  const json = (await r.json()) as {
    text: string;
    model?: string;
    usage?: {
      input_tokens?: number;
      output_tokens?: number;
      server_tool_use?: { web_search_requests?: number };
    };
  };
  if (usageSink && json.usage && json.model) {
    usageSink({
      model: json.model,
      input_tokens: json.usage.input_tokens,
      output_tokens: json.usage.output_tokens,
      web_search_requests: json.usage.server_tool_use?.web_search_requests,
    });
  }
  return json.text;
}

// Extrait le premier bloc JSON ([] ou {}) d'une réponse modèle, en tolérant
// les backticks et le texte parasite. Renvoie null si rien d'exploitable —
// l'appelant décide quoi faire (afficher une erreur claire).
export function extractJSON(text: string): unknown {
  const t = text.replace(/```json/gi, "").replace(/```/g, "").trim();
  const a = t.indexOf("[");
  const b = t.lastIndexOf("]");
  const o = t.indexOf("{");
  const p = t.lastIndexOf("}");
  let slice: string | null = null;
  if (a !== -1 && b !== -1 && (a < o || o === -1)) slice = t.slice(a, b + 1);
  else if (o !== -1 && p !== -1) slice = t.slice(o, p + 1);
  if (!slice) return null;
  try {
    return JSON.parse(slice);
  } catch {
    return null;
  }
}

// Variante pour les listes d'idées : si la réponse a été tronquée (gros lot),
// on récupère en coupant au dernier objet complet et en refermant le tableau.
export function parseIdeas(text: string): unknown {
  const t = text.replace(/```json/gi, "").replace(/```/g, "").trim();
  const a = t.indexOf("[");
  if (a === -1) return null;
  const slice = t.slice(a);
  try {
    return JSON.parse(slice);
  } catch {
    const lastObj = slice.lastIndexOf("}");
    if (lastObj !== -1) {
      try {
        return JSON.parse(slice.slice(0, lastObj + 1) + "]");
      } catch {
        return null;
      }
    }
    return null;
  }
}
