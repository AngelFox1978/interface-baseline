import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { pool } from "@/lib/db";
import { getSession } from "@/lib/session";

// pg + crypto nécessitent le runtime Node (pas Edge).
export const runtime = "nodejs";

// GET : renvoie les 200 prompts les plus récents.
export async function GET() {
  // Route protégée : nécessite une session valide (le middleware exclut /api).
  if (!(await getSession())) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }
  const { rows } = await pool.query(
    "SELECT * FROM prompts ORDER BY created_at DESC LIMIT 200",
  );
  return NextResponse.json(rows);
}

// POST : reçoit un tableau d'objets prompt et les insère en dédoublonnant
// par content_hash (md5 du texte normalisé). Renvoie { recus, inserts }.
export async function POST(req) {
  if (!(await getSession())) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps JSON invalide." }, { status: 400 });
  }

  const items = Array.isArray(body) ? body : [];
  let inserts = 0;

  for (const it of items) {
    const promptText = typeof it?.prompt_text === "string" ? it.prompt_text : "";
    // Ignorer les entrées sans texte de prompt.
    if (!promptText.trim()) continue;

    // Empreinte de dédoublonnage : md5 du texte normalisé (trim + minuscules).
    const contentHash = crypto
      .createHash("md5")
      .update(promptText.trim().toLowerCase())
      .digest("hex");

    const result = await pool.query(
      `INSERT INTO prompts
         (titre, cible, categorie, prompt_text, cas_usage, source_url, tags, content_hash)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (content_hash) DO NOTHING`,
      [
        it.titre ?? null,
        it.cible ?? null,
        it.categorie ?? null,
        promptText,
        it.cas_usage ?? null,
        it.source_url ?? null,
        it.tags ?? null,
        contentHash,
      ],
    );
    // rowCount = 1 si inséré, 0 si déjà présent (conflit ignoré).
    inserts += result.rowCount;
  }

  return NextResponse.json({ recus: items.length, inserts });
}
