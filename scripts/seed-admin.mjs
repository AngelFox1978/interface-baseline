#!/usr/bin/env node
/**
 * Génère le hash bcrypt d'un mot de passe admin pour cette interface.
 * Usage :
 *   node scripts/seed-admin.mjs "MotDePasse"      -> imprime le hash
 *   node scripts/seed-admin.mjs                    -> génère un mot de passe fort + son hash
 */
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";

function strongPassword() {
  return randomBytes(12).toString("base64url");
}

const provided = process.argv[2];
const password = provided || strongPassword();
const hash = bcrypt.hashSync(password, 10);

if (!provided) {
  console.log("Mot de passe généré :", password);
}
console.log("ADMIN_PASSWORD_HASH=" + hash);
