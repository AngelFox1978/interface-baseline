"use client";

import { useTranslations } from "next-intl";
import { AlertTriangle, Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { Tool } from "@/lib/console/types";

// Carte d'outil (veille). Les données viennent du modèle (déjà en français) ;
// seul le libellé « Pertinence » est traduit. La note d'alerte utilise le token
// --risk-medium (amber = mise en garde).
export function ToolCard({ tool }: { tool: Tool }) {
  const t = useTranslations("radar.tools");
  return (
    <Card>
      <CardContent className="pt-5">
        <div className="flex flex-wrap items-center gap-2.5">
          {tool.categorie && (
            <span className="rounded-md border px-2 py-0.5 text-xs font-semibold text-muted-foreground">
              {tool.categorie}
            </span>
          )}
          <h4 className="text-base font-bold tracking-tight">{tool.outil}</h4>
          {Number.isFinite(tool.pertinence) && (
            <span className="inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium text-muted-foreground">
              <Star className="h-3 w-3" />
              {t("relevance", { score: tool.pertinence })}
            </span>
          )}
          {tool.prix && (
            <span className="ml-auto text-xs tabular-nums text-muted-foreground">
              {tool.prix}
            </span>
          )}
        </div>

        <p className="mt-2 text-sm leading-relaxed text-foreground">
          {tool.pour_quoi}
        </p>

        {tool.note && (
          <p className="mt-2 flex items-start gap-1.5 text-xs leading-relaxed text-risk-medium">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>{tool.note}</span>
          </p>
        )}
      </CardContent>
    </Card>
  );
}
