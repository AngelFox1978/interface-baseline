// Client de la console : remplace l'appel direct à l'API Anthropic (qui ne
// marchait que dans les artefacts). On passe par la route serveur /api/claude,
// qui détient la clé. Même signature que le callClaude d'origine.

export type CallClaudeOptions = {
  search?: boolean;
};

export async function callClaude(
  prompt: string,
  { search = false }: CallClaudeOptions = {},
): Promise<string> {
  const r = await fetch("/api/claude", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ prompt, search }),
  });
  if (!r.ok) throw new Error("HTTP " + r.status);
  const { text } = (await r.json()) as { text: string };
  return text;
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
