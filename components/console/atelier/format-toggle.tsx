"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import type { FormatType } from "@/lib/console/types";

export type BatchFormat = FormatType | "mixte";

// Bascule de format (Vidéo / Diaporama / Mixte). Sélection = noir (token --ink).
// Défini au niveau module (pas dans le composant parent) pour ne pas casser le
// Fast Refresh et éviter des remontages parasites.
export function FormatToggle({
  options,
  value,
  onChange,
}: {
  options: BatchFormat[];
  value: BatchFormat;
  onChange: (v: BatchFormat) => void;
}) {
  const t = useTranslations("atelier");
  return (
    <div className="flex gap-2">
      {options.map((id) => (
        <button
          key={id}
          type="button"
          onClick={() => onChange(id)}
          className={cn(
            "flex-1 cursor-pointer rounded-xl border px-3 py-2 text-sm font-semibold transition-colors",
            value === id
              ? "border-ink bg-ink text-ink-foreground"
              : "bg-card text-muted-foreground hover:bg-muted",
          )}
        >
          {t(`format.${id}`)}
        </button>
      ))}
    </div>
  );
}
