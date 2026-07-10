import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getSession } from "@/lib/session";

// pg nécessite le runtime Node (pas Edge).
export const runtime = "nodejs";

// GET : les 100 dernières entrées du journal d'activité (lecture seule).
export async function GET() {
  if (!(await getSession())) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }
  const { rows } = await pool.query(
    "SELECT id, created_at, email, action, details FROM audit_log ORDER BY created_at DESC LIMIT 100",
  );
  return NextResponse.json(rows);
}
