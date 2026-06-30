"use client";

import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RiskBadge } from "@/components/console/radar/risk-badge";
import type { Niche, RisqueNiveau } from "@/lib/console/types";

const RISK_LEVELS: RisqueNiveau[] = ["faible", "moyen", "eleve"];

export function NicheCard({
  niche,
  index,
  onWork,
}: {
  niche: Niche;
  index: number;
  onWork: (niche: Niche) => void;
}) {
  const t = useTranslations("radar");
  const riskKey = RISK_LEVELS.includes(niche.risque) ? niche.risque : "moyen";

  return (
    <Card>
      <CardContent className="pt-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-semibold tabular-nums text-muted-foreground">
              {String(index + 1).padStart(2, "0")}
            </span>
            <h3 className="text-lg font-bold tracking-tight">{niche.nom}</h3>
          </div>
          <RiskBadge level={niche.risque} label={t(`risk.${riskKey}`)} />
        </div>

        {niche.categorie && (
          <span className="mt-2 inline-block rounded-md border px-2 py-0.5 text-xs font-medium text-muted-foreground">
            {niche.categorie}
          </span>
        )}

        <p className="mt-2.5 text-sm leading-relaxed text-foreground">
          {niche.pourquoi}
        </p>

        <dl className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-semibold text-muted-foreground">
              {t("metaFormat")}
            </dt>
            <dd className="mt-0.5 text-sm">{niche.format}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold text-muted-foreground">
              {t("metaMonetisation")}
            </dt>
            <dd className="mt-0.5 text-sm">{niche.monetisation_fr}</dd>
          </div>
        </dl>

        <p className="mt-3 text-sm italic text-muted-foreground">
          ↳ {niche.angle}
        </p>

        <Button
          variant="ink"
          size="sm"
          className="mt-4"
          onClick={() => onWork(niche)}
        >
          {t("workThisNiche")}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
}
