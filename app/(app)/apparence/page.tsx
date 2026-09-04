"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Check } from "lucide-react";

// Templates de design proposés. Les couleurs listées ici sont des DONNÉES
// d'aperçu (échantillons du template correspondant, défini dans globals.css),
// pas du style de l'interface courante — d'où les valeurs littérales.
const TEMPLATES = [
  {
    id: null, // défaut : aucun attribut data-template
    key: "indigo",
    font: "Plus Jakarta Sans",
    swatches: ["oklch(0.52 0.21 277)", "oklch(0.955 0.02 277)", "oklch(0.965 0.008 274)"],
    radius: "1rem",
  },
  {
    id: "emeraude",
    key: "emeraude",
    font: "Inter",
    swatches: ["oklch(0.5 0.12 165)", "oklch(0.95 0.03 165)", "oklch(0.965 0.008 165)"],
    radius: "0.5rem",
  },
  {
    id: "ambre",
    key: "ambre",
    font: "Nunito",
    swatches: ["oklch(0.58 0.13 60)", "oklch(0.95 0.035 80)", "oklch(0.97 0.012 85)"],
    radius: "1.25rem",
  },
  {
    id: "ardoise",
    key: "ardoise",
    font: "Space Grotesk",
    swatches: ["oklch(0.3 0.012 250)", "oklch(0.94 0.005 250)", "oklch(0.97 0.002 250)"],
    radius: "0.25rem",
  },
] as const;

type TemplateId = (typeof TEMPLATES)[number]["id"];

export default function ApparencePage() {
  const t = useTranslations("apparence");
  const [current, setCurrent] = useState<TemplateId>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("template");
      if (TEMPLATES.some((tpl) => tpl.id === saved)) {
        setCurrent(saved as TemplateId);
      }
    } catch {
      /* storage indisponible */
    }
  }, []);

  function apply(id: TemplateId) {
    setCurrent(id);
    if (id) {
      document.documentElement.setAttribute("data-template", id);
    } else {
      document.documentElement.removeAttribute("data-template");
    }
    try {
      if (id) {
        localStorage.setItem("template", id);
      } else {
        localStorage.removeItem("template");
      }
    } catch {
      /* storage indisponible */
    }
  }

  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-xl font-extrabold tracking-tight">{t("title")}</h2>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          {t("hint")}
        </p>
      </section>

      <div
        role="radiogroup"
        aria-label={t("title")}
        className="grid gap-4 sm:grid-cols-2"
      >
        {TEMPLATES.map((tpl) => {
          const selected = current === tpl.id;
          return (
            <button
              key={tpl.key}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => apply(tpl.id)}
              className={`rounded-2xl border bg-card p-5 text-left transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                selected ? "border-2 border-ring" : ""
              }`}
            >
              <span className="flex items-center justify-between gap-2">
                <span className="text-base font-bold tracking-tight">
                  {t(`${tpl.key}Name`)}
                </span>
                {selected && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-success">
                    <Check aria-hidden="true" className="h-4 w-4" />
                    {t("active")}
                  </span>
                )}
              </span>
              <span className="mt-1 block text-sm text-muted-foreground">
                {t(`${tpl.key}Desc`)}
              </span>
              <span className="mt-4 flex items-center gap-3">
                <span className="flex gap-1.5">
                  {tpl.swatches.map((color) => (
                    <span
                      key={color}
                      aria-hidden="true"
                      className="h-6 w-6 rounded-full border"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </span>
                <span className="text-xs text-muted-foreground">
                  {tpl.font} · {t("radiusLabel", { radius: tpl.radius })}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground">{t("note")}</p>
    </div>
  );
}
