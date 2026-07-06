"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown, Wand2 } from "lucide-react";
import { CopyButton } from "@/components/console/atelier/copy-button";
import { cn } from "@/lib/utils";

// Détecte les {variables} d'un prompt et permet de les remplir avant de copier.
// N'affiche rien si le prompt n'a pas de variable.
export function PromptVars({ text }: { text: string }) {
  const t = useTranslations("prompts");
  const vars = useMemo(
    () => [
      ...new Set([...text.matchAll(/\{([^}]+)\}/g)].map((m) => m[1].trim())),
    ],
    [text],
  );
  const [open, setOpen] = useState(false);
  const [vals, setVals] = useState<Record<string, string>>({});

  if (vars.length === 0) return null;

  // Remplace chaque {v} par sa valeur ; laisse le placeholder si vide.
  const filled = vars.reduce(
    (acc, v) => acc.split(`{${v}}`).join(vals[v]?.trim() || `{${v}}`),
    text,
  );

  return (
    <div className="mt-2 rounded-lg border border-dashed p-2.5">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full cursor-pointer items-center gap-2 text-xs font-semibold text-muted-foreground"
      >
        <Wand2 className="h-3.5 w-3.5" />
        {t("fillVars", { count: vars.length })}
        <ChevronDown
          className={cn(
            "ml-auto h-3.5 w-3.5 transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div className="mt-2 space-y-2">
          <div className="grid gap-2 sm:grid-cols-2">
            {vars.map((v) => (
              <label key={v} className="block">
                <span className="text-xs font-semibold text-muted-foreground">
                  {v}
                </span>
                <input
                  value={vals[v] ?? ""}
                  onChange={(e) =>
                    setVals((s) => ({ ...s, [v]: e.target.value }))
                  }
                  className="mt-0.5 h-9 w-full rounded-lg border bg-card px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </label>
            ))}
          </div>
          <CopyButton
            text={filled}
            label={t("fillCopy")}
            copiedLabel={t("copied")}
          />
        </div>
      )}
    </div>
  );
}
