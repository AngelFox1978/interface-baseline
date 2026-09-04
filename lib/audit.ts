import { pool } from "@/lib/db";
import { getSession } from "@/lib/session";

// Journalise une action métier dans la table audit_log — en best-effort.
// TOLÉRANT AUX PANNES : si DATABASE_URL est absent ou la base injoignable,
// on trace un console.warn et on continue. Un échec de log ne doit JAMAIS
// faire échouer l'action métier appelante : aucun throw ne sort d'ici.
export async function logActivity(
  action: string,
  details?: Record<string, unknown>,
): Promise<void> {
  try {
    if (!process.env.DATABASE_URL) {
      console.warn(`audit_log ignoré (DATABASE_URL absent) : ${action}`);
      return;
    }
    // L'email vient de la session courante (null si indisponible).
    const session = await getSession();
    await pool.query(
      "INSERT INTO audit_log (email, action, details) VALUES ($1, $2, $3)",
      [
        session?.email ?? null,
        action,
        details ? JSON.stringify(details) : null,
      ],
    );
  } catch (e) {
    console.warn(`audit_log en échec (${action}) :`, (e as Error).message);
  }
}
