// Pool de connexions Postgres (singleton).
// On le mémorise sur globalThis pour éviter d'ouvrir plusieurs pools à chaque
// rechargement à chaud (hot-reload) de Next en développement.
import { Pool } from "pg";

const globalForDb = globalThis;

export const pool =
  globalForDb._pgPool ??
  new Pool({ connectionString: process.env.DATABASE_URL });

if (!globalForDb._pgPool) {
  globalForDb._pgPool = pool;
}
