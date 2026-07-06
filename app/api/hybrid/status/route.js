import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

export const runtime = "nodejs";

// Vérifie que les briques du mode hybride répondent : Ollama et SearXNG.
export async function GET() {
  if (!(await getSession())) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }
  const OLLAMA = process.env.OLLAMA_URL || "http://localhost:11434";
  const SEARXNG = process.env.SEARXNG_URL || "http://localhost:8888";

  async function ping(url) {
    try {
      const r = await fetch(url, { signal: AbortSignal.timeout(4000) });
      return r.ok;
    } catch {
      return false;
    }
  }

  const [ollama, searxng] = await Promise.all([
    ping(`${OLLAMA}/api/tags`),
    ping(`${SEARXNG}/search?q=ping&format=json`),
  ]);

  return NextResponse.json({ ollama, searxng });
}
