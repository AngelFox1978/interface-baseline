#!/usr/bin/env node
/**
 * Génère le hash bcrypt d'un mot de passe admin pour cette interface.
 * Usage :
 *   node scripts/seed-admin.mjs "MotDePasse"      -> imprime le hash
 *   node scripts/seed-admin.mjs                    -> génère un mot de passe fort + son hash
 *
 * La ligne imprimée est "paste-safe" : les `$` du hash bcrypt sont échappés
 * (`\$`) car Next fait passer le .env dans dotenv-expand, qui interpréterait
 * `$2a`, `$10`… comme des variables et viderait le hash → login cassé.
 */
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";

function strongPassword() {
  return randomBytes(12).toString("base64url");
}

const provided = process.argv[2];
const password = provided || strongPassword();
const hash = bcrypt.hashSync(password, 10);
const escaped = hash.replace(/\$/g, "\\$");

if (!provided) {
  console.log("Mot de passe généré :", password);
}
console.log("\nÀ coller tel quel dans .env (les $ sont déjà échappés) :");
console.log("ADMIN_PASSWORD_HASH=" + escaped);
