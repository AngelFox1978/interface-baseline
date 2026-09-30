import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import os from "node:os";
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

// Champ `detect` des catalogues : chemin (relatif au projet) dont la présence
// prouve l'installation, quand le mode seul ne permet pas de la voir
// (package, docker, CLI qui nomme son dossier autrement que le dépôt).
export function isDetected(root: string, detect?: string): boolean {
  return Boolean(detect) && existsSync(path.join(root, detect as string));
}

// Plugins Claude Code installés : registre de la CLI claude
// (~/.claude/plugins/installed_plugins.json, format { plugins: { "<nom>@<marketplace>": [installations] } }).
export const PLUGINS_FILE = path.join(
  os.homedir(),
  ".claude",
  "plugins",
  "installed_plugins.json",
);

export function readInstalledPlugins(): unknown {
  try {
    return JSON.parse(readFileSync(PLUGINS_FILE, "utf8"));
  } catch {
    return {};
  }
}

const samePath = (a: string, b: string) =>
  path.resolve(a).toLowerCase() === path.resolve(b).toLowerCase();

// Installé pour CE projet : en scope user (partout), ou en scope
// project/local sur ce dossier.
export function isPluginInstalled(
  registry: unknown,
  pluginId: string,
  projectDir: string,
): boolean {
  const entries = (registry as { plugins?: Record<string, unknown> })?.plugins?.[
    pluginId
  ];
  if (!Array.isArray(entries)) return false;
  return entries.some((e: { scope?: string; projectPath?: string }) =>
    e?.scope === "user"
      ? true
      : typeof e?.projectPath === "string" && samePath(e.projectPath, projectDir),
  );
}

export async function gitClone(url: string, dest: string): Promise<void> {
  await run("git", ["clone", "--depth", "1", url, dest], {
    timeout: GIT_TIMEOUT_MS,
    windowsHide: true,
  });
}
