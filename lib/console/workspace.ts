// Export / import du workspace (données locales persistées par le provider).
// Sert de sauvegarde et de transfert entre machines / navigateurs.

export const WORKSPACE_KEYS = [
  "radar:niches",
  "radar:niches:at",
  "radar:tools",
  "radar:tools:at",
  "pipeline:items",
  "pipeline:settings",
  "atelier:favorites",
  "console:usage",
] as const;

export type WorkspaceExport = {
  version: number;
  exportedAt: string;
  data: Record<string, unknown>;
};

export function exportWorkspace(exportedAt: string): WorkspaceExport {
  const data: Record<string, unknown> = {};
  for (const k of WORKSPACE_KEYS) {
    const raw = localStorage.getItem(k);
    if (raw !== null) {
      try {
        data[k] = JSON.parse(raw);
      } catch {
        /* clé illisible ignorée */
      }
    }
  }
  return { version: 1, exportedAt, data };
}

// Écrit les clés du payload dans localStorage. Renvoie le nombre de clés
// importées. L'appelant recharge la page pour que le provider relise l'état.
export function importWorkspace(payload: unknown): number {
  const data =
    (payload as WorkspaceExport | null)?.data ?? ({} as Record<string, unknown>);
  let count = 0;
  for (const k of WORKSPACE_KEYS) {
    if (k in data) {
      localStorage.setItem(k, JSON.stringify(data[k]));
      count++;
    }
  }
  return count;
}
