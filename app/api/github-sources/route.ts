import { NextResponse } from "next/server";
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { getSession } from "@/lib/session";
import { installBodySchema, sourceAddSchema } from "@/lib/validation";
import { logActivity } from "@/lib/audit";
import { gitClone, readManifest, writeManifest } from "@/lib/install-sources";
import { DEFAULT_OLLAMA_MODEL, ollamaGenerate } from "@/lib/ollama";

// Système de fichiers + git : runtime Node requis (pas Edge).
export const runtime = "nodejs";

type CatalogSource = {
  id: string;
  label: string;
  url: string;
  category: string;
  mode: string;
  target?: string;
  default?: boolean;
};

function loadCatalog(): CatalogSource[] {
  const raw = readFileSync(
    path.join(process.cwd(), "catalogs", "github-sources.json"),
    "utf8",
  );
  return (JSON.parse(raw) as { sources?: CatalogSource[] }).sources ?? [];
}

// Une source est « installée » selon son mode d'installation
// (voir scripts/install-source.sh) :
// - skills : ses dossiers (manifeste) sont présents dans la cible ; à défaut
//   (installation faite hors interface), un dossier au nom du repo existe
// - clone-subdir / submodule : vendor/<nom du repo> existe
function isInstalled(source: CatalogSource): boolean {
  const root = process.cwd();
  if (source.mode === "skills") {
    const dir = path.join(root, source.target ?? ".claude/skills");
    const folders = readManifest()[source.id];
    if (folders?.length) {
      return folders.some((f) => existsSync(path.join(dir, f)));
    }
    return existsSync(path.join(dir, path.basename(source.url, ".git")));
  }
  if (source.mode === "clone-subdir" || source.mode === "submodule") {
    const name = path.basename(source.url, ".git");
    return existsSync(path.join(root, "vendor", name));
  }
  return false;
}

// Nombre de skills actives issues d'une source de type « skills » : les
// dossiers enregistrés au manifeste et encore présents sur disque (repli sur
// le dossier au nom du repo pour une installation faite hors interface).
function activeSkillCount(source: CatalogSource): number | null {
  if (source.mode !== "skills") return null;
  const dir = path.join(process.cwd(), source.target ?? ".claude/skills");
  const folders = readManifest()[source.id];
  if (folders?.length) {
    return folders.filter((f) => existsSync(path.join(dir, f))).length;
  }
  return existsSync(path.join(dir, path.basename(source.url, ".git"))) ? 1 : 0;
}

// Métadonnées GitHub (description, date de création) par dépôt, en cache
// mémoire : l'API non authentifiée est limitée à 60 requêtes/heure.
type RepoMeta = { description: string | null; createdAt: string | null };
const metaCache = new Map<string, { at: number; meta: RepoMeta }>();
const META_TTL = 60 * 60 * 1000;
const META_FAIL_TTL = 5 * 60 * 1000;

async function repoMeta(url: string): Promise<RepoMeta> {
  const hit = metaCache.get(url);
  if (
    hit &&
    Date.now() - hit.at < (hit.meta.createdAt ? META_TTL : META_FAIL_TTL)
  ) {
    return hit.meta;
  }
  let meta: RepoMeta = { description: null, createdAt: null };
  const m = /^https:\/\/github\.com\/([\w.-]+\/[\w.-]+)$/.exec(
    url.replace(/\.git$/, ""),
  );
  if (m) {
    try {
      const r = await fetch(`https://api.github.com/repos/${m[1]}`, {
        headers: {
          Accept: "application/vnd.github+json",
          "User-Agent": "interface-baseline",
        },
        signal: AbortSignal.timeout(5000),
      });
      if (r.ok) {
        const j = (await r.json()) as {
          description?: string | null;
          created_at?: string;
        };
        meta = {
          description: j.description ?? null,
          createdAt: j.created_at ?? null,
        };
      }
    } catch {
      // API injoignable : champs null, retenté après META_FAIL_TTL
    }
  }
  metaCache.set(url, { at: Date.now(), meta });
  return meta;
}

// Traductions françaises des descriptions GitHub via Ollama (local, gratuit —
// jamais l'API Anthropic payante pour ça), en cache mémoire par texte source :
// chaque description n'est traduite qu'une seule fois par processus.
const frCache = new Map<string, string>();

async function translateToFr(texts: string[]): Promise<void> {
  const missing = [...new Set(texts.filter((t) => t && !frCache.has(t)))];
  if (missing.length === 0) return;
  try {
    const text = await ollamaGenerate(
      "Traduis en français chaque description de dépôt GitHub du tableau JSON suivant (garde les noms propres et termes techniques). Réponds avec un tableau JSON de chaînes, même ordre et même longueur.\n" +
        JSON.stringify(missing),
      DEFAULT_OLLAMA_MODEL,
    );
    const arr = JSON.parse(text.replace(/^```(?:json)?\s*|\s*```$/g, ""));
    if (Array.isArray(arr) && arr.length === missing.length) {
      missing.forEach((src, i) => {
        if (typeof arr[i] === "string") frCache.set(src, arr[i]);
      });
    }
  } catch {
    // Ollama éteint ou réponse invalide : les descriptions restent en anglais.
  }
}

// GET : catalogue des sources GitHub + statut d'installation sur cette
// interface + métadonnées du dépôt (description, date de création).
// ?locale=fr : descriptions traduites en français (cache serveur).
export async function GET(req: Request) {
  if (!(await getSession())) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }
  try {
    let sources = await Promise.all(
      loadCatalog().map(async (s) => ({
        id: s.id,
        label: s.label,
        url: s.url,
        category: s.category,
        mode: s.mode,
        default: s.default === true,
        installed: isInstalled(s),
        activeSkills: activeSkillCount(s),
        ...(await repoMeta(s.url)),
      })),
    );
    if (new URL(req.url).searchParams.get("locale") === "fr") {
      await translateToFr(
        sources.flatMap((s) => (s.description ? [s.description] : [])),
      );
      sources = sources.map((s) =>
        s.description
          ? { ...s, description: frCache.get(s.description) ?? s.description }
          : s,
      );
    }
    return NextResponse.json(sources);
  } catch {
    return NextResponse.json(
      { error: "Catalogue illisible." },
      { status: 500 },
    );
  }
}

// POST : installe une source DU CATALOGUE (jamais une URL arbitraire),
// en reproduisant les modes de scripts/install-source.sh côté Node.
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

  let source: CatalogSource | undefined;
  try {
    source = loadCatalog().find((s) => s.id === parsed.data.id);
  } catch {
    return NextResponse.json({ error: "Catalogue illisible." }, { status: 500 });
  }
  if (!source) {
    return NextResponse.json({ error: "Source inconnue." }, { status: 404 });
  }
  if (isInstalled(source)) {
    return NextResponse.json({ error: "Déjà installée." }, { status: 409 });
  }

  const root = process.cwd();
  try {
    if (source.mode === "clone-subdir") {
      const name = path.basename(source.url, ".git");
      mkdirSync(path.join(root, "vendor"), { recursive: true });
      await gitClone(source.url, path.join(root, "vendor", name));
    } else if (source.mode === "skills") {
      const dest = path.join(root, source.target ?? ".claude/skills");
      const tmp = mkdtempSync(path.join(os.tmpdir(), "gh-source-"));
      const copied: string[] = [];
      try {
        await gitClone(source.url, tmp);
        mkdirSync(dest, { recursive: true });
        for (const sub of [".claude/skills", "skills", "agents"]) {
          const from = path.join(tmp, sub);
          if (existsSync(from)) {
            copied.push(...readdirSync(from));
            cpSync(from, dest, { recursive: true });
          }
        }
      } finally {
        // Nettoyage best-effort : les objets git en lecture seule peuvent
        // résister à la suppression sous Windows.
        try {
          rmSync(tmp, { recursive: true, force: true, maxRetries: 3 });
        } catch (e) {
          console.warn("Nettoyage temp en échec :", (e as Error).message);
        }
      }
      if (copied.length === 0) {
        return NextResponse.json(
          { error: "Le dépôt ne contient aucune skill reconnue." },
          { status: 500 },
        );
      }
      const manifest = readManifest();
      manifest[source.id] = [...new Set(copied)];
      writeManifest(manifest);
    } else {
      return NextResponse.json(
        { error: `Mode non installable depuis l'interface : ${source.mode}.` },
        { status: 400 },
      );
    }
  } catch (e) {
    console.error(`Installation ${source.id} en échec :`, (e as Error).message);
    return NextResponse.json(
      { error: "L'installation a échoué (voir logs serveur)." },
      { status: 500 },
    );
  }

  await logActivity("github_source_install", {
    id: source.id,
    url: source.url,
    mode: source.mode,
  });
  return NextResponse.json({ ok: true });
}

// PUT : propose un nouveau dépôt GitHub — ajouté au catalogue (non installé).
// Seules les URLs https://github.com/<owner>/<repo> sont acceptées.
export async function PUT(req: Request) {
  if (!(await getSession())) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }
  const parsed = sourceAddSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Corps invalide." }, { status: 400 });
  }

  const url = parsed.data.url.replace(/\.git$/, "");
  const id = path.basename(url).toLowerCase();
  const catalogPath = path.join(process.cwd(), "catalogs", "github-sources.json");
  try {
    const catalog = JSON.parse(readFileSync(catalogPath, "utf8")) as {
      sources?: CatalogSource[];
    };
    const sources = catalog.sources ?? [];
    if (sources.some((s) => s.id === id || s.url === url)) {
      return NextResponse.json({ error: "Déjà au catalogue." }, { status: 409 });
    }
    sources.push({
      id,
      label: path.basename(url),
      url,
      category: "custom",
      mode: parsed.data.mode,
      default: false,
    });
    catalog.sources = sources;
    writeFileSync(catalogPath, JSON.stringify(catalog, null, 2) + "\n");
  } catch {
    return NextResponse.json({ error: "Catalogue illisible." }, { status: 500 });
  }

  await logActivity("github_source_add", { id, url, mode: parsed.data.mode });
  return NextResponse.json({ ok: true, id });
}
