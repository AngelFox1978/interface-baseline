import { beforeEach, describe, expect, it } from "vitest";
import {
  RATE_LIMIT,
  isLocked,
  recordFailure,
  recordSuccess,
  resetRateLimit,
} from "../lib/rate-limit";

// Le limiteur accepte un `now` injectable : les tests pilotent l'horloge
// sans attendre ni mocker les timers.

const KEY = "admin@interface.local|1.2.3.4";
const T0 = 1_000_000_000_000;

beforeEach(() => {
  resetRateLimit();
});

describe("rate-limit du login", () => {
  it("ne verrouille pas avant le seuil de 5 échecs", () => {
    for (let i = 0; i < RATE_LIMIT.MAX_FAILURES - 1; i++) {
      recordFailure(KEY, T0 + i);
      expect(isLocked(KEY, T0 + i)).toBe(false);
    }
  });

  it("verrouille au 5e échec dans la fenêtre", () => {
    for (let i = 0; i < RATE_LIMIT.MAX_FAILURES; i++) {
      recordFailure(KEY, T0 + i);
    }
    expect(isLocked(KEY, T0 + 10)).toBe(true);
  });

  it("le verrou expire LOCK_MS après le dernier échec", () => {
    for (let i = 0; i < RATE_LIMIT.MAX_FAILURES; i++) {
      recordFailure(KEY, T0 + i);
    }
    // Le verrou court à partir du 5e échec (T0 + 4).
    const lockEnd = T0 + 4 + RATE_LIMIT.LOCK_MS;
    expect(isLocked(KEY, lockEnd - 1)).toBe(true);
    expect(isLocked(KEY, lockEnd)).toBe(false);
    // Et après expiration, on repart d'un compteur vierge.
    recordFailure(KEY, lockEnd + 1);
    expect(isLocked(KEY, lockEnd + 2)).toBe(false);
  });

  it("fenêtre glissante : des échecs trop anciens ne comptent plus", () => {
    // 4 échecs, puis un 5e après la fenêtre : les 4 premiers sont sortis.
    for (let i = 0; i < 4; i++) {
      recordFailure(KEY, T0 + i);
    }
    recordFailure(KEY, T0 + RATE_LIMIT.WINDOW_MS + 10);
    expect(isLocked(KEY, T0 + RATE_LIMIT.WINDOW_MS + 11)).toBe(false);
  });

  it("un succès remet le compteur à zéro", () => {
    for (let i = 0; i < 4; i++) {
      recordFailure(KEY, T0 + i);
    }
    recordSuccess(KEY);
    for (let i = 0; i < 4; i++) {
      recordFailure(KEY, T0 + 10 + i);
    }
    expect(isLocked(KEY, T0 + 20)).toBe(false);
  });

  it("les clés sont indépendantes (email+IP)", () => {
    for (let i = 0; i < RATE_LIMIT.MAX_FAILURES; i++) {
      recordFailure(KEY, T0 + i);
    }
    expect(isLocked(KEY, T0 + 10)).toBe(true);
    expect(isLocked("autre@exemple.fr|1.2.3.4", T0 + 10)).toBe(false);
    expect(isLocked("admin@interface.local|5.6.7.8", T0 + 10)).toBe(false);
  });
});
