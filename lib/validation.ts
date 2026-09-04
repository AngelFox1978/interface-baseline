import { z } from "zod";

// Schémas Zod partagés des routes /api/prompts (POST) et /api/prompts/[id]
// (PATCH). Ils remplacent les vérifications manuelles, à comportement
// identique : mêmes champs, mêmes défauts.

// Champ texte optionnel : toute valeur absente ou mal formée retombe sur null.
const texteOptionnel = z.string().nullish().catch(null);

// POST /api/prompts — un prompt importé : seul prompt_text (non vide) est
// obligatoire ; les entrées invalides sont ignorées par la route, pas rejetées.
export const promptImportSchema = z.object({
  prompt_text: z.string().refine((s) => s.trim().length > 0),
  titre: texteOptionnel,
  cible: texteOptionnel,
  categorie: texteOptionnel,
  cas_usage: texteOptionnel,
  source_url: texteOptionnel,
  tags: z.array(z.string()).nullish().catch(null),
});
export type PromptImport = z.infer<typeof promptImportSchema>;

// PATCH /api/prompts/[id] — titre et prompt_text requis (trimés), le reste
// optionnel ; tags retombe sur [] comme le faisait la vérification manuelle.
export const promptUpdateSchema = z.object({
  titre: z.string().trim().min(1),
  prompt_text: z.string().trim().min(1),
  cible: texteOptionnel,
  categorie: texteOptionnel,
  cas_usage: texteOptionnel,
  source_url: texteOptionnel,
  tags: z.array(z.string()).catch([]),
});
export type PromptUpdate = z.infer<typeof promptUpdateSchema>;

// POST /api/github-sources et /api/skills-library — installation par id.
export const installBodySchema = z.object({ id: z.string().min(1) });

// URL de dépôt GitHub acceptée par le template : https://github.com/<owner>/<repo>
// strictement (pas de sous-chemin, pas d'autre hôte, pas de http).
export const githubUrlRegex = /^https:\/\/github\.com\/[\w.-]+\/[\w.-]+$/;

// PUT /api/github-sources — proposition d'un nouveau dépôt.
export const sourceAddSchema = z.object({
  url: z.string().trim().regex(githubUrlRegex, "URL GitHub invalide"),
  mode: z.enum(["skills", "clone-subdir"]),
});
