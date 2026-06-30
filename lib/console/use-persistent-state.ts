"use client";

import { Dispatch, SetStateAction, useEffect, useState } from "react";

// Phase 1 (pour shipper) : persistance client via localStorage.
// La valeur initiale est utilisée au 1er rendu (serveur ET client), puis
// remplacée après montage par ce qui est en localStorage — pas de mismatch
// d'hydratation. Phase 2 (propre) : persistance serveur par utilisateur.
export function usePersistentState<T>(
  key: string,
  initial: T,
): readonly [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(initial);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw !== null) setValue(JSON.parse(raw) as T);
    } catch {
      /* clé absente ou storage indisponible */
    }
    setReady(true);
  }, [key]);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* quota plein ou storage indisponible */
    }
  }, [key, value, ready]);

  return [value, setValue] as const;
}
