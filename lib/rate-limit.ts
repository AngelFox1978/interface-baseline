// Protection brute-force du login — limiteur EN MÉMOIRE.
//
// Par clé (email + IP) : fenêtre glissante de 15 minutes, maximum 5 échecs,
// puis verrou de 15 minutes. Le nettoyage des entrées expirées se fait au fil
// de l'eau (pas de setInterval : incompatible HMR/edge et inutile ici).
//
// LIMITES ASSUMÉES de l'approche mémoire : l'état est perdu au redémarrage du
// processus et n'est pas partagé entre plusieurs instances. Suffisant pour le
// déploiement mono-instance du template ; piste d'évolution si besoin : une
// table Postgres `login_attempts` (email, ip, tentées_à) interrogée dans
// l'action login, purgée par la même fenêtre glissante.

const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 5;
const LOCK_MS = 15 * 60 * 1000;
const CLEANUP_EVERY_MS = 60 * 1000;

type Entry = { failures: number[]; lockedUntil: number | null };

const attempts = new Map<string, Entry>();
let lastCleanup = 0;

// Purge périodique : évite que la Map ne grossisse indéfiniment avec des
// clés jamais revues (fuite mémoire sinon).
function cleanup(now: number): void {
  if (now - lastCleanup < CLEANUP_EVERY_MS) return;
  lastCleanup = now;
  for (const [key, entry] of attempts) {
    entry.failures = entry.failures.filter((t) => now - t < WINDOW_MS);
    const lockExpired = !entry.lockedUntil || entry.lockedUntil <= now;
    if (entry.failures.length === 0 && lockExpired) attempts.delete(key);
  }
}

// Le verrou est-il actif pour cette clé ? À vérifier AVANT bcrypt.compare.
export function isLocked(key: string, now: number = Date.now()): boolean {
  cleanup(now);
  const entry = attempts.get(key);
  if (!entry?.lockedUntil) return false;
  if (entry.lockedUntil <= now) {
    attempts.delete(key);
    return false;
  }
  return true;
}

// À appeler sur chaque échec d'authentification.
export function recordFailure(key: string, now: number = Date.now()): void {
  cleanup(now);
  const entry = attempts.get(key) ?? { failures: [], lockedUntil: null };
  entry.failures = entry.failures.filter((t) => now - t < WINDOW_MS);
  entry.failures.push(now);
  if (entry.failures.length >= MAX_FAILURES) {
    entry.lockedUntil = now + LOCK_MS;
    entry.failures = [];
  }
  attempts.set(key, entry);
}

// À appeler sur un login réussi : remet le compteur à zéro.
export function recordSuccess(key: string): void {
  attempts.delete(key);
}

// Réservé aux tests : repart d'un état vierge.
export function resetRateLimit(): void {
  attempts.clear();
  lastCleanup = 0;
}

export const RATE_LIMIT = { WINDOW_MS, MAX_FAILURES, LOCK_MS } as const;
