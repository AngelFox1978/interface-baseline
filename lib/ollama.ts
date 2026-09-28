// Client Ollama minimal (LLM local). Server-only : appelé depuis les routes
// API (ex. traduction des descriptions dans app/api/github-sources).

const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434";

// Modèle Ollama par défaut.
export const DEFAULT_OLLAMA_MODEL = "qwen2.5:7b";

// Génération via Ollama. Renvoie le texte brut (JSON attendu selon le prompt) ;
// le parsing reste côté appelant.
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
