import { NextResponse } from "next/server";
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { getSession } from "@/lib/session";
import { githubUrlRegex, installBodySchema } from "@/lib/validation";
import { logActivity } from "@/lib/audit";
import { gitClone, readManifest, writeManifest } from "@/lib/install-sources";

// Système de fichiers + git : runtime Node requis (pas Edge).
export const runtime = "nodejs";

type LibrarySkill = {
  id: string;
  label: string;
  category: string;
  method: string;
  command?: string;
  url?: string;
  subdir?: string;
  default?: boolean;
};

const SKILLS_DIR = path.join(process.cwd(), ".claude", "skills");

function loadLibrary(): LibrarySkill[] {
  const raw = readFileSync(
    path.join(process.cwd(), "catalogs", "skills-library.json"),
    "utf8",
  );
  return (JSON.parse(raw) as { skills?: LibrarySkill[] }).skills ?? [];
}

// Installée si le manifeste connaît la skill (dossiers présents), sinon repli
// sur le dossier attendu (basename du subdir pour method=copy, id sinon).
function isInstalled(skill: LibrarySkill): boolean {
  const folders = readManifest()[skill.id];
  if (folders?.length) {
    return folders.some((f) => existsSync(path.join(SKILLS_DIR, f)));
  }
  const fallback =
    skill.method === "copy" && skill.subdir
      ? path.basename(skill.subdir)
      : skill.id;
  return existsSync(path.join(SKILLS_DIR, fallback));
}

// Skills réellement présentes dans .claude/skills : chaque sous-dossier avec
// un SKILL.md, nom et description lus dans son frontmatter.
function activeSkills(): { id: string; label: string; description: string }[] {
  try {
    return readdirSync(SKILLS_DIR).flatMap((folder) => {
      const skillMd = path.join(SKILLS_DIR, folder, "SKILL.md");
      if (!existsSync(skillMd)) return [];
      let label = folder;
      let description = "";
      try {
        const head = readFileSync(skillMd, "utf8").slice(0, 2000);
        label = /^name:\s*(.+)$/m.exec(head)?.[1]?.trim() || folder;
        description =
          /^description:\s*(.+)$/m.exec(head)?.[1]?.trim().slice(0, 160) ?? "";
      } catch {
        // SKILL.md illisible : on garde le nom du dossier
      }
      return [{ id: folder, label, description }];
    });
  } catch {
    return [];
  }
}

// GET : skills actives (présentes sur disque) + bibliothèque restante.
export async function GET() {
  if (!(await getSession())) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }
  try {
    const library = loadLibrary()
      .filter((s) => !isInstalled(s))
      .map((s) => ({
        id: s.id,
        label: s.label,
        category: s.category,
        method: s.method,
        command: s.command ?? null,
        url: s.url ?? null,
        default: s.default === true,
      }));
    return NextResponse.json({ active: activeSkills(), library });
  } catch {
    return NextResponse.json(
      { error: "Bibliothèque illisible." },
      { status: 500 },
    );
  }
}

// POST : installe une skill de la bibliothèque. Seule la méthode « copy »
// (clone GitHub + copie d'un sous-dossier) est installable depuis l'interface ;
// les méthodes CLI restent des commandes à lancer en terminal.
export async function POST(req: Request) {
  if (!(await getSession())) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }
  const parsed = installBodySchema.safeParse(
    await req.json().catch(() => null),
  );
  if (!parsed.success) {
    return NextResponse.json({ error: "Corps invalide." }, { status: 400 });
  }

  let skill: LibrarySkill | undefined;
  try {
    skill = loadLibrary().find((s) => s.id === parsed.data.id);
  } catch {
    return NextResponse.json({ error: "Bibliothèque illisible." }, { status: 500 });
  }
  if (!skill) {
    return NextResponse.json({ error: "Skill inconnue." }, { status: 404 });
  }
  if (skill.method !== "copy" || !skill.url || !skill.subdir) {
    return NextResponse.json(
      { error: "Installable uniquement en terminal.", command: skill.command ?? null },
      { status: 400 },
    );
  }
  if (!githubUrlRegex.test(skill.url)) {
    return NextResponse.json({ error: "URL non GitHub refusée." }, { status: 400 });
  }
  if (isInstalled(skill)) {
    return NextResponse.json({ error: "Déjà installée." }, { status: 409 });
  }

  const folder = path.basename(skill.subdir);
  const tmp = mkdtempSync(path.join(os.tmpdir(), "skill-lib-"));
  try {
    await gitClone(skill.url, tmp);
    const src = path.join(tmp, skill.subdir);
    if (!existsSync(src)) {
      return NextResponse.json(
        { error: "Sous-dossier introuvable dans le dépôt." },
        { status: 500 },
      );
    }
    mkdirSync(path.join(SKILLS_DIR, folder), { recursive: true });
    cpSync(src, path.join(SKILLS_DIR, folder), { recursive: true });
  } catch (e) {
    console.error(`Installation skill ${skill.id} en échec :`, (e as Error).message);
    return NextResponse.json(
      { error: "L'installation a échoué (voir logs serveur)." },
      { status: 500 },
    );
  } finally {
    try {
      rmSync(tmp, { recursive: true, force: true, maxRetries: 3 });
    } catch (e) {
      console.warn("Nettoyage temp en échec :", (e as Error).message);
    }
  }

  const manifest = readManifest();
  manifest[skill.id] = [folder];
  writeManifest(manifest);
  await logActivity("skill_install", { id: skill.id, url: skill.url });
  return NextResponse.json({ ok: true });
}
