import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

export const runtime = "nodejs";

// Liste les modèles Ollama installés localement (pour le sélecteur Paramètres).
// En cas d'échec (Ollama éteint), renvoie une liste vide sans erreur bloquante.
export async function GET() {
  if (!(await getSession())) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }
  const url = (process.env.OLLAMA_URL || "http://localhost:11434") + "/api/tags";
  try {
    const r = await fetch(url);
    if (!r.ok) throw new Error("HTTP " + r.status);
    const data = (await r.json()) as { models?: { name?: string }[] };
    const models = (data?.models ?? [])
      .map((m) => m.name)
      .filter((name): name is string => Boolean(name));
    return NextResponse.json({ models });
  } catch {
    return NextResponse.json({ models: [] });
  }
}
