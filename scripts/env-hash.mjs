// Ligne .env pour le hash bcrypt de l'admin.
//
// Next (@next/env) applique dotenv-expand à .env : tout `$mot` non échappé
// (`$2a`, `$10`, `$abc…`) est pris pour une variable et le hash est vidé —
// MÊME entre apostrophes. Seule la forme `\$` sans apostrophes donne le hash
// exact, dans tous les modes (vérifié par tests/seed-admin.test.ts) :
// - `npm run dev` : node --env-file lit d'abord la valeur (antislashs gardés),
//   puis Next repart de cette valeur et rend `\$` en `$` ;
// - `npm run start` (next start, sans --env-file) : Next lit le fichier
//   directement et rend `\$` en `$`.
export function formatHashLine(hash) {
  return "ADMIN_PASSWORD_HASH=" + hash.replace(/\$/g, "\\$");
}
