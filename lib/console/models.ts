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
