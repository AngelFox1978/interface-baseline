import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import bcrypt from "bcryptjs";
import { describe, expect, it } from "vitest";
import { formatHashLine } from "../scripts/env-hash.mjs";

// Reproduit le chargement RÉEL du .env, dans un processus neuf par cas
// (@next/env garde un état global entre deux appels d'un même processus) :
// - dev  (`npm run dev`)   : node --env-file=.env, PUIS loadEnvConfig de Next ;
// - prod (`npm run start`) : next start, sans --env-file → loadEnvConfig seul.
// loadEnvConfig est la fonction qu'appelle Next au démarrage (next-server).
// Motivation : un hash mal formaté ne se voit ni au lint ni au build — le
// login échoue en silence.

const PASSWORD = "mot-de-passe-de-test";
const HASH = bcrypt.hashSync(PASSWORD, 4);

const CHILD = `
const { loadEnvConfig } = require("@next/env");
loadEnvConfig(process.argv[1], process.argv[2] === "dev", { info() {}, error() {} });
process.stdout.write(process.env.ADMIN_PASSWORD_HASH ?? "");
`;

type Mode = "dev" | "prod";

// Valeur finale de process.env.ADMIN_PASSWORD_HASH après le chargement complet.
function finalHash(line: string, mode: Mode): string {
  const dir = mkdtempSync(path.join(tmpdir(), "seed-admin-"));
  try {
    const envFile = path.join(dir, ".env");
    writeFileSync(envFile, line + "\n");
    const nodeArgs = mode === "dev" ? [`--env-file=${envFile}`] : [];
    return execFileSync(
      process.execPath,
      [...nodeArgs, "-e", CHILD, dir, mode],
      { cwd: process.cwd(), env: { PATH: process.env.PATH } },
    ).toString();
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

const FORMS = {
  "\\$ sans apostrophes (seed-admin)": formatHashLine(HASH),
  "apostrophes simples": `ADMIN_PASSWORD_HASH='${HASH}'`,
};

describe("seed-admin — ligne .env du hash", () => {
  it("seed-admin échappe chaque $ et n'ajoute pas d'apostrophes", () => {
    const line = formatHashLine(HASH);
    expect(line).toBe("ADMIN_PASSWORD_HASH=" + HASH.replaceAll("$", "\\$"));
    expect(line).not.toMatch(/['"]/);
  });

  for (const mode of ["dev", "prod"] as const) {
    it(`${mode} : la forme \\$ redonne le hash exact (bcrypt OK)`, () => {
      const value = finalHash(FORMS["\\$ sans apostrophes (seed-admin)"], mode);
      expect(value).toBe(HASH);
      expect(bcrypt.compareSync(PASSWORD, value)).toBe(true);
    });

    it(`${mode} : la forme entre apostrophes est cassée par Next`, () => {
      const value = finalHash(FORMS["apostrophes simples"], mode);
      expect(value).not.toBe(HASH);
      expect(bcrypt.compareSync(PASSWORD, value)).toBe(false);
    });
  }
});
