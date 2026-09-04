import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { pool } from "@/lib/db";
import { getSession } from "@/lib/session";
import { promptImportSchema } from "@/lib/validation";
import { logActivity } from "@/lib/audit";

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
export async function POST(req: NextRequest) {
  if (!(await getSession())) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps JSON invalide." }, { status: 400 });
  }

  const items = Array.isArray(body) ? body : [];
  let inserts = 0;

  for (const it of items) {
    // Entrée sans texte de prompt (ou mal formée) : ignorée, pas rejetée.
    const parsed = promptImportSchema.safeParse(it);
    if (!parsed.success) continue;
    const p = parsed.data;

    // Empreinte de dédoublonnage : md5 du texte normalisé (trim + minuscules).
    const contentHash = crypto
      .createHash("md5")
      .update(p.prompt_text.trim().toLowerCase())
      .digest("hex");

    const result = await pool.query(
      `INSERT INTO prompts
         (titre, cible, categorie, prompt_text, cas_usage, source_url, tags, content_hash)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (content_hash) DO NOTHING`,
      [
        p.titre ?? null,
        p.cible ?? null,
        p.categorie ?? null,
        p.prompt_text,
        p.cas_usage ?? null,
        p.source_url ?? null,
        p.tags ?? null,
        contentHash,
      ],
    );
    // rowCount = 1 si inséré, 0 si déjà présent (conflit ignoré).
    inserts += result.rowCount ?? 0;
  }

  // Journal : import de prompts (best-effort).
  await logActivity("prompts.import", { recus: items.length, inserts });

  return NextResponse.json({ recus: items.length, inserts });
}
