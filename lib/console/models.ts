// Source UNIQUE des modèles autorisés (liste blanche). Importée par :
//  - app/api/claude/route.ts → enforcement côté serveur (le client ne peut
//    jamais imposer un modèle hors liste) ;
//  - app/(app)/parametres/page.tsx → libellés du sélecteur (pas de recopie).
// Données pures, sans import serveur : sûres côté serveur ET client.
export type ModelOption = { id: string; label: string };

export const MODELS: ModelOption[] = [
  { id: "claude-sonnet-4-6", label: "Sonnet 4.6 — équilibré" },
  { id: "claude-haiku-4-5-20251001", label: "Haiku 4.5 — rapide" },
];

export const DEFAULT_MODEL = "claude-sonnet-4-6";

export const ALLOWED_MODEL_IDS: string[] = MODELS.map((m) => m.id);

// Tarifs Anthropic (USD par million de tokens) — pour estimer la consommation.
export const PRICING: Record<string, { input: number; output: number }> = {
  "claude-sonnet-4-6": { input: 3, output: 15 },
  "claude-haiku-4-5-20251001": { input: 1, output: 5 },
};
// Coût recherche web (USD pour 1000 recherches) — estimation tarif standard.
export const WEB_SEARCH_PER_1K = 10;

// Fournisseurs d'IA (libellés via i18n : parametres.provider*).
export const PROVIDERS = ["anthropic", "hybrid"] as const;

// Modèle Ollama par défaut en mode hybride, + repli si l'API tags est injoignable.
export const DEFAULT_OLLAMA_MODEL = "qwen2.5:7b";
export const OLLAMA_FALLBACK_MODELS = ["qwen2.5:7b", "llama3.2:3b"];
