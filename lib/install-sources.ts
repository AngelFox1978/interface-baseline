import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

// Helpers partagés par les routes d'installation de sources GitHub et de
// skills (app/api/github-sources, app/api/skills-library). Côté serveur Node.

const run = promisify(execFile);
const GIT_TIMEOUT_MS = 5 * 60 * 1000;

// Manifeste des installations faites via l'interface :
// { <id source>: [<dossiers copiés dans .claude/skills>] }. Permet de savoir
// quelle source est installée quand plusieurs partagent le même dossier cible.
export const MANIFEST_PATH = path.join(
  process.cwd(),
  "catalogs",
  "skills-installed.json",
);

export function readManifest(): Record<string, string[]> {
  try {
    return JSON.parse(readFileSync(MANIFEST_PATH, "utf8"));
  } catch {
    return {};
  }
}

export function writeManifest(manifest: Record<string, string[]>): void {
  writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + "\n");
}

export async function gitClone(url: string, dest: string): Promise<void> {
  await run("git", ["clone", "--depth", "1", url, dest], {
    timeout: GIT_TIMEOUT_MS,
    windowsHide: true,
  });
}
