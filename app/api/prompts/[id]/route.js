import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { pool } from "@/lib/db";
import { getSession } from "@/lib/session";

export const runtime = "nodejs";

// DELETE : supprime un prompt.
export async function DELETE(_req, { params }) {
  if (!(await getSession())) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }
  const { id } = await params;
  await pool.query("DELETE FROM prompts WHERE id = $1", [Number(id)]);
  return NextResponse.json({ ok: true });
}

// PATCH : met à jour un prompt (recalcule content_hash si le texte change).
export async function PATCH(req, { params }) {
  if (!(await getSession())) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }
  const { id } = await params;
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps JSON invalide." }, { status: 400 });
  }
  const titre = typeof body.titre === "string" ? body.titre.trim() : "";
  const promptText =
    typeof body.prompt_text === "string" ? body.prompt_text.trim() : "";
  if (!titre || !promptText) {
    return NextResponse.json(
      { error: "Titre et texte du prompt requis." },
      { status: 400 },
    );
  }
  const contentHash = crypto
    .createHash("md5")
    .update(promptText.toLowerCase())
    .digest("hex");
  try {
    const r = await pool.query(
      `UPDATE prompts
         SET titre=$1, cible=$2, categorie=$3, prompt_text=$4,
             cas_usage=$5, source_url=$6, tags=$7, content_hash=$8
       WHERE id=$9`,
      [
        titre,
        body.cible || null,
        body.categorie || null,
        promptText,
        body.cas_usage || null,
        body.source_url || null,
        Array.isArray(body.tags) ? body.tags : [],
        contentHash,
        Number(id),
      ],
    );
    return NextResponse.json({ ok: r.rowCount > 0 });
  } catch {
    // content_hash unique : un autre prompt a déjà ce texte.
    return NextResponse.json({ error: "Doublon." }, { status: 409 });
  }
}
