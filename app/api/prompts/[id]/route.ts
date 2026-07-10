import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { pool } from "@/lib/db";
import { getSession } from "@/lib/session";
import { promptUpdateSchema } from "@/lib/validation";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

// DELETE : supprime un prompt.
export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  if (!(await getSession())) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }
  const { id } = await params;
  await pool.query("DELETE FROM prompts WHERE id = $1", [Number(id)]);
  return NextResponse.json({ ok: true });
}

// PATCH : met à jour un prompt (recalcule content_hash si le texte change).
export async function PATCH(req: NextRequest, { params }: RouteContext) {
  if (!(await getSession())) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }
  const { id } = await params;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps JSON invalide." }, { status: 400 });
  }
  const parsed = promptUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Titre et texte du prompt requis." },
      { status: 400 },
    );
  }
  const p = parsed.data;
  const contentHash = crypto
    .createHash("md5")
    .update(p.prompt_text.toLowerCase())
    .digest("hex");
  try {
    const r = await pool.query(
      `UPDATE prompts
         SET titre=$1, cible=$2, categorie=$3, prompt_text=$4,
             cas_usage=$5, source_url=$6, tags=$7, content_hash=$8
       WHERE id=$9`,
      [
        p.titre,
        p.cible || null,
        p.categorie || null,
        p.prompt_text,
        p.cas_usage || null,
        p.source_url || null,
        p.tags,
        contentHash,
        Number(id),
      ],
    );
    return NextResponse.json({ ok: (r.rowCount ?? 0) > 0 });
  } catch {
    // content_hash unique : un autre prompt a déjà ce texte.
    return NextResponse.json({ error: "Doublon." }, { status: 409 });
  }
}
