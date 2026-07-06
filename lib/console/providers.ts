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

// HTML -> texte lisible (suppression scripts/styles/balises + entités).
function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

// Récupère le contenu texte réel d'une page (les extraits SearXNG ne
// contiennent que des méta-descriptions, pas le texte des prompts).
async function fetchPageText(url: string, maxChars = 3500): Promise<string> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const r = await fetch(url, {
      signal: controller.signal,
      headers: {
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });
    clearTimeout(timer);
    if (!r.ok) return "";
    const ct = r.headers.get("content-type") || "";
    if (!ct.includes("text/html") && !ct.includes("text/plain")) return "";
    return htmlToText(await r.text()).slice(0, maxChars);
  } catch {
    return "";
  }
}

// Recherche web (SearXNG) → lecture du contenu réel des pages → synthèse
// (Ollama). Équivalent local du web_search d'Anthropic. `query` = requête web.
export async function hybridSearchGenerate(
  prompt: string,
  model: string,
  query: string,
): Promise<string> {
  const results = await searxngSearch(query, 6);
  // On lit le vrai contenu des 4 premières pages (en parallèle), avec repli
  // sur l'extrait SearXNG si la page est inaccessible.
  const pages = await Promise.all(
    results.slice(0, 4).map(async (r) => {
      const text = await fetchPageText(r.url);
      return { ...r, body: text || r.content };
    }),
  );
  const context = pages
    .map((p, i) => `[${i + 1}] ${p.title}\n${p.url}\n${p.body}`)
    .join("\n\n");
  const augmented = `${prompt}

--- Contenu réel de pages web récentes ---
EXTRAIS les prompts RÉELS présents dans ce contenu (recopie leur texte, adapte-le au format demandé). N'INVENTE PAS de prompts génériques. Mets l'URL de la source dans "source_url" quand le champ existe.

${context}`;
  return ollamaGenerate(augmented, model);
}
