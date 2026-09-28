// Ligne .env pour le hash bcrypt de l'admin.
//
// `npm run dev` lit .env DEUX fois : d'abord `node --env-file=.env` (pour
// PORT), puis Next (@next/env), dont la valeur REMPLACE la première. Next
// applique dotenv-expand : un `$` non échappé (`$2a`, `$10`…) y est pris pour
// une variable et le hash est vidé — même entre apostrophes. D'où `\$`, sans
// apostrophes : Next le rend en `$`. (Node, lui, garderait l'antislash, mais
// sa valeur est écrasée par celle de Next.)
export function formatHashLine(hash) {
  return "ADMIN_PASSWORD_HASH=" + hash.replace(/\$/g, "\\$");
}
