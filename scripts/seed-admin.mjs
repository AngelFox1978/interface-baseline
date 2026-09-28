#!/usr/bin/env node
/**
 * Génère le hash bcrypt du mot de passe admin de cette interface.
 * Usage :
 *   npm run seed:admin                          -> saisie masquée (+ confirmation)
 *   printf '%s\n' "$MDP" | node scripts/seed-admin.mjs   -> lecture sur stdin (scripts)
 *
 * Le mot de passe n'est jamais passé en argument : il n'apparaît donc pas dans
 * l'historique du terminal. La ligne imprimée se colle telle quelle dans .env
 * (format expliqué dans scripts/env-hash.mjs).
 */
import bcrypt from "bcryptjs";
import { formatHashLine } from "./env-hash.mjs";

if (process.argv[2]) {
  console.error("Ne passe pas le mot de passe en argument (historique du terminal).");
  console.error("Lance `npm run seed:admin` et saisis-le quand il est demandé.");
  process.exit(1);
}

// Lecture sans écho (terminal interactif) ; Ctrl+C annule.
function askHidden(question) {
  return new Promise((resolve) => {
    const { stdin, stdout } = process;
    let value = "";
    stdout.write(question);
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding("utf8");
    const onData = (chunk) => {
      for (const ch of chunk) {
        if (ch === "\r" || ch === "\n") {
          stdin.setRawMode(false);
          stdin.pause();
          stdin.off("data", onData);
          stdout.write("\n");
          resolve(value);
          return;
        }
        if (ch === "\u0003") {
          stdin.setRawMode(false);
          stdout.write("\n");
          process.exit(130);
        }
        if (ch === "\u007f" || ch === "\b") value = value.slice(0, -1);
        else value += ch;
      }
    };
    stdin.on("data", onData);
  });
}

// Lecture de la première ligne de stdin (usage non interactif, ex. post-init.sh).
async function readStdinLine() {
  let data = "";
  for await (const chunk of process.stdin) data += chunk;
  return data.split(/\r?\n/)[0];
}

let password;
if (process.stdin.isTTY) {
  password = await askHidden("Mot de passe admin : ");
  const confirm = await askHidden("Confirmer : ");
  if (password !== confirm) {
    console.error("Les deux saisies diffèrent.");
    process.exit(1);
  }
} else {
  password = await readStdinLine();
}

if (!password) {
  console.error("Mot de passe vide.");
  process.exit(1);
}

console.log("\nÀ coller tel quel dans .env (sans apostrophes) :");
console.log(formatHashLine(bcrypt.hashSync(password, 10)));
