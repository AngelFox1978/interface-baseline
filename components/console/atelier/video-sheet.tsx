"use client";

import { useTranslations } from "next-intl";
import { Plus, Star, TriangleAlert } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/console/atelier/copy-button";
import { cn } from "@/lib/utils";
import type { VideoSheet } from "@/lib/console/types";

export function VideoSheetView({
  sheet,
  onAddPipeline,
  onToggleFav,
  isFav = false,
}: {
  sheet: VideoSheet;
  onAddPipeline: () => void;
  onToggleFav: () => void;
  isFav?: boolean;
}) {
  const t = useTranslations("atelier");
  const hooksAlt = sheet.hooks_alt ?? [];
  const script = sheet.script ?? [];
  const hashtags = sheet.hashtags ?? [];

  // Texte « prêt à coller » assemblé pour le bouton Copier.
  const lines: string[] = [];
  lines.push(sheet.titre, "");
  lines.push(`${t("result.hook")}`, sheet.hook, "");
  if (hooksAlt.length) {
    lines.push(`${t("result.hooksAlt")}`);
    hooksAlt.forEach((h, i) => lines.push(`${String.fromCharCode(66 + i)}. ${h}`));
    lines.push("");
  }
  lines.push(`${t("result.scriptTimed")}`);
  script.forEach((s) => {
    lines.push(`[${s.temps}]`);
    lines.push(`${t("result.voice")}: ${s.voix}`);
    lines.push(`${t("result.visual")}: ${s.visuel}`);
    if (s.texte_ecran) lines.push(`${t("result.screen")}: ${s.texte_ecran}`);
    lines.push("");
  });
  lines.push(`${t("result.cta")}: ${sheet.cta}`, "");
  lines.push(`${t("result.caption")}`, sheet.description, "");
  if (hashtags.length) lines.push(hashtags.map((h) => `#${h}`).join(" "), "");
  lines.push(`${t("result.humanAngle")}: ${sheet.angle_humain}`);
  lines.push(`${t("result.disclosure")}: ${sheet.divulgation}`);
  const copyText = lines.join("\n");

  return (
    <Card>
      <CardContent className="space-y-4 pt-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t("result.title")}
            </p>
            <h3 className="mt-1 text-xl font-extrabold tracking-tight">
              {sheet.titre}
            </h3>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              aria-label={t("favorites.save")}
              onClick={onToggleFav}
            >
              <Star className={cn("h-4 w-4", isFav && "fill-current")} />
            </Button>
            <CopyButton text={copyText} label={t("copy")} copiedLabel={t("copied")} />
          </div>
        </div>

        <div className="rounded-xl border border-l-2 border-l-format-video bg-muted px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t("result.hook")}
          </p>
          <p className="mt-1 font-semibold">{sheet.hook}</p>
        </div>

        {hooksAlt.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t("result.hooksAlt")}
            </p>
            <div className="mt-2 grid gap-2">
              {hooksAlt.map((h, i) => (
                <div
                  key={i}
                  className="flex items-baseline gap-2 rounded-lg border px-3 py-2"
                >
                  <span className="text-xs font-semibold text-format-video">
                    {String.fromCharCode(66 + i)}
                  </span>
                  <span className="text-sm">{h}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t("result.scriptTimed")}
          </p>
          <div className="mt-2 grid gap-2">
            {script.map((s, i) => (
              <div key={i} className="rounded-lg border p-3">
                <span className="text-xs font-semibold text-format-video">
                  {s.temps}
                </span>
                <p className="mt-1 text-sm">
                  <span className="font-semibold">{t("result.voice")} —</span>{" "}
                  {s.voix}
                </p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  <span className="font-semibold">{t("result.visual")} —</span>{" "}
                  {s.visuel}
                </p>
                {s.texte_ecran && (
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    <span className="font-semibold">{t("result.screen")} —</span>{" "}
                    {s.texte_ecran}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        <dl className="grid gap-3 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-semibold text-muted-foreground">
              {t("result.cta")}
            </dt>
            <dd className="mt-0.5 text-sm">{sheet.cta}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold text-muted-foreground">
              {t("result.humanAngle")}
            </dt>
            <dd className="mt-0.5 text-sm">{sheet.angle_humain}</dd>
          </div>
        </dl>

        <div>
          <p className="text-xs font-semibold text-muted-foreground">
            {t("result.caption")}
          </p>
          <p className="mt-0.5 text-sm">{sheet.description}</p>
        </div>

        {hashtags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {hashtags.map((h, i) => (
              <span
                key={i}
                className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground"
              >
                #{h}
              </span>
            ))}
          </div>
        )}

        <p className="flex items-start gap-1.5 text-xs text-risk-medium">
          <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>
            <span className="font-semibold">{t("result.disclosure")} :</span>{" "}
            {sheet.divulgation}
          </span>
        </p>

        <Button variant="outline" onClick={onAddPipeline}>
          <Plus className="h-4 w-4" />
          {t("result.addPipeline")}
        </Button>
      </CardContent>
    </Card>
  );
}
