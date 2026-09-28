import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { parseEnv } from "node:util";
import bcrypt from "bcryptjs";
import { describe, expect, it } from "vitest";
import { formatHashLine } from "../scripts/env-hash.mjs";

// Rejoue la chaîne réelle de `npm run dev` : `node --env-file=.env` (parseur
// .env de Node) puis Next (@next/env), dont la valeur l'emporte. Chaque cas
// tourne dans un processus neuf : @next/env garde un état global entre deux
// appels dans le même processus, ce qui fausserait le résultat.
// Motivation : un hash mal formaté ne se voit ni au lint ni au build — le
// login échoue en silence.

const PASSWORD = "mot-de-passe-de-test";
const HASH = bcrypt.hashSync(PASSWORD, 4);

const CHILD = `
const { loadEnvConfig } = require("@next/env");
const node = process.env.ADMIN_PASSWORD_HASH;
loadEnvConfig(process.argv[1], true, { info() {}, error() {} });
process.stdout.write(JSON.stringify({ node, next: process.env.ADMIN_PASSWORD_HASH }));
`;

function loadLikeNpmRunDev(line: string): { node?: string; next?: string } {
  const dir = mkdtempSync(path.join(tmpdir(), "seed-admin-"));
  try {
    const envFile = path.join(dir, ".env");
    writeFileSync(envFile, line + "\n");
    const out = execFileSync(
      process.execPath,
      [`--env-file=${envFile}`, "-e", CHILD, dir],
      { cwd: process.cwd(), env: { PATH: process.env.PATH } },
    );
    return JSON.parse(out.toString());
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

describe("seed-admin — ligne .env du hash", () => {
  it("échappe chaque $ et n'ajoute pas d'apostrophes", () => {
    const line = formatHashLine(HASH);
    expect(line).toBe("ADMIN_PASSWORD_HASH=" + HASH.replaceAll("$", "\\$"));
    expect(line).not.toMatch(/['"]/);
  });

  it("est lue par le parseur .env de Node (antislashs conservés)", () => {
    const value = parseEnv(formatHashLine(HASH) + "\n").ADMIN_PASSWORD_HASH;
    expect(value).toBe(HASH.replaceAll("$", "\\$"));
  });

  it("donne le hash exact après node --env-file + Next", () => {
    const { next } = loadLikeNpmRunDev(formatHashLine(HASH));
    expect(next).toBe(HASH);
    expect(bcrypt.compareSync(PASSWORD, next ?? "")).toBe(true);
  });

  it("la forme entre apostrophes est cassée par Next (régression à éviter)", () => {
    const { node, next } = loadLikeNpmRunDev(`ADMIN_PASSWORD_HASH='${HASH}'`);
    expect(node).toBe(HASH);
    expect(next).not.toBe(HASH);
  });
});
