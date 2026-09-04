import { NextResponse } from "next/server";
import { readFileSync } from "node:fs";
import path from "node:path";
import { getSession } from "@/lib/session";

export const runtime = "nodejs";

type Suggestion = {
  fullName: string;
  url: string;
  description: string | null;
  stars: number;
};

// Cache mémoire 10 min par topic : la recherche GitHub non authentifiée est
// limitée à 10 requêtes/min, on ne la frappe pas à chaque affichage.
const cache = new Map<string, { at: number; data: Suggestion[] }>();
const CACHE_MS = 10 * 60 * 1000;
const TOPICS = ["claude-skills", "claude-code"] as const;

// GET : dépôts les mieux étoilés d'un topic GitHub (liste blanche), hors
// dépôts déjà présents au catalogue local. ?topic=claude-skills par défaut.
export async function GET(req: Request) {
  if (!(await getSession())) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }
  const topicParam = new URL(req.url).searchParams.get("topic") ?? "claude-skills";
  const topic = (TOPICS as readonly string[]).includes(topicParam)
    ? topicParam
    : "claude-skills";

  const hit = cache.get(topic);
  let data = hit && Date.now() - hit.at < CACHE_MS ? hit.data : null;
  if (!data) {
    try {
      const r = await fetch(
        `https://api.github.com/search/repositories?q=topic:${topic}&sort=stars&order=desc&per_page=10`,
        {
          headers: {
            Accept: "application/vnd.github+json",
            "User-Agent": "interface-baseline",
          },
          signal: AbortSignal.timeout(10_000),
        },
      );
      if (!r.ok) throw new Error(`GitHub ${r.status}`);
      const json = (await r.json()) as {
        items?: { full_name: string; html_url: string; description: string | null; stargazers_count: number }[];
      };
      data = (json.items ?? []).map((i) => ({
        fullName: i.full_name,
        url: i.html_url,
        description: i.description,
        stars: i.stargazers_count,
      }));
      cache.set(topic, { at: Date.now(), data });
    } catch (e) {
      console.warn("Suggestions GitHub indisponibles :", (e as Error).message);
      return NextResponse.json(
        { error: "Suggestions indisponibles pour le moment." },
        { status: 502 },
      );
    }
  }

  // Exclut ce qui est déjà au catalogue (comparaison par URL).
  let known = new Set<string>();
  try {
    const catalog = JSON.parse(
      readFileSync(path.join(process.cwd(), "catalogs", "github-sources.json"), "utf8"),
    ) as { sources?: { url: string }[] };
    known = new Set((catalog.sources ?? []).map((s) => s.url.toLowerCase()));
  } catch {
    // catalogue illisible : on renvoie tout
  }
  return NextResponse.json(data.filter((s) => !known.has(s.url.toLowerCase())));
}
