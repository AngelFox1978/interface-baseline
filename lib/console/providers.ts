// Fournisseurs alternatifs (mode hybride), 100 % local et gratuit :
//   - Ollama  → génération de texte (LLM local)
//   - SearXNG → recherche web (métamoteur local)
// Server-only : appelé uniquement depuis app/api/claude/route.ts.

const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434";
const SEARXNG_URL = process.env.SEARXNG_URL || "http://localhost:8888";

// Génération via Ollama. Renvoie le texte brut (JSON attendu selon le prompt) ;
// le parsing (extractJSON/parseIdeas) reste côté appelant.
export async function ollamaGenerate(prompt: string, model: string): Promise<string> {
  let r: Response;
  try {
    r = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        model,
        stream: false,
        messages: [
          {
            role: "system",
            content:
              "Tu réponds UNIQUEMENT avec le JSON demandé (tableau ou objet), sans aucun texte, sans balises de code, autour.",
          },
          { role: "user", content: prompt },
        ],
      }),
    });
  } catch {
    throw new Error(`Ollama injoignable (${OLLAMA_URL}). Ollama est-il lancé ?`);
  }
  if (!r.ok) throw new Error(`Ollama a répondu ${r.status}.`);
  const data = (await r.json()) as { message?: { content?: string } };
  return (data?.message?.content ?? "").trim();
}

// Recherche web via SearXNG (API JSON). Renvoie titre / url / extrait.
export async function searxngSearch(
  query: string,
  limit = 8,
): Promise<{ title: string; url: string; content: string }[]> {
  const url = `${SEARXNG_URL}/search?q=${encodeURIComponent(query)}&format=json&language=fr`;
  let r: Response;
  try {
    r = await fetch(url);
  } catch {
    throw new Error(`SearXNG injoignable (${SEARXNG_URL}). Le conteneur est-il lancé ?`);
  }
  if (!r.ok) throw new Error(`SearXNG a répondu ${r.status}.`);
  const data = (await r.json()) as {
    results?: { title?: string; url?: string; content?: string }[];
  };
  return (data?.results ?? []).slice(0, limit).map((x) => ({
    title: x.title ?? "",
    url: x.url ?? "",
    content: x.content ?? "",
  }));
}

// Recherche web (SearXNG) puis synthèse (Ollama) : équivalent local du
// web_search d'Anthropic. `query` est la requête web, `prompt` la consigne.
export async function hybridSearchGenerate(
  prompt: string,
  model: string,
  query: string,
): Promise<string> {
  const results = await searxngSearch(query);
  const context = results
    .map((r, i) => `[${i + 1}] ${r.title}\n${r.url}\n${r.content}`)
    .join("\n\n");
  const augmented = `${prompt}

--- Résultats de recherche web récents (utilise-les comme sources ; mets l'URL pertinente dans "source_url" quand le champ existe) ---
${context}`;
  return ollamaGenerate(augmented, model);
}
