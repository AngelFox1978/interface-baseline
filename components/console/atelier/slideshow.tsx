"use client";

import { useTranslations } from "next-intl";
import { Plus, Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/console/atelier/copy-button";
import { cn } from "@/lib/utils";
import type { Slideshow } from "@/lib/console/types";

export function SlideshowView({
  show,
  onAddPipeline,
  onToggleFav,
  isFav = false,
}: {
  show: Slideshow;
  onAddPipeline: () => void;
  onToggleFav: () => void;
  isFav?: boolean;
}) {
  const t = useTranslations("atelier");
  const slides = show.slides ?? [];
  const hashtags = show.hashtags ?? [];

  function slideTag(i: number) {
    if (i === 0) return t("result.slideHook");
    if (i === slides.length - 1) return t("result.slideCta");
    return t("result.slide", { n: i + 1 });
  }

  // Texte « prêt à coller ».
  const lines: string[] = [];
  lines.push(show.titre, "");
  slides.forEach((s, i) => {
    lines.push(`[${slideTag(i)}] ${s.texte}`);
    if (s.visuel) lines.push(`${t("result.visual")}: ${s.visuel}`);
    lines.push("");
  });
  lines.push(`${t("result.humanAngle")}: ${show.angle_humain}`, "");
  lines.push(`${t("result.caption")}`, show.description);
  if (hashtags.length) lines.push("", hashtags.map((h) => `#${h}`).join(" "));
  const copyText = lines.join("\n");

  return (
    <Card>
      <CardContent className="space-y-4 pt-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t("result.slideshowCount", { count: slides.length })}
            </p>
            <h3 className="mt-1 text-xl font-extrabold tracking-tight">
              {show.titre}
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

        <div className="grid gap-2">
          {slides.map((s, i) => {
            const isFirst = i === 0;
            const isLast = i === slides.length - 1;
            const accent = isFirst
              ? "border-l-format-video text-format-video"
              : isLast
                ? "border-l-format-slideshow text-format-slideshow"
                : "border-l-border text-muted-foreground";
            return (
              <div
                key={i}
                className={cn("rounded-lg border border-l-2 p-3", accent)}
              >
                <span className="text-xs font-semibold uppercase tracking-wide">
                  {slideTag(i)}
                </span>
                <p className="mt-1 font-semibold text-foreground">{s.texte}</p>
                {s.visuel && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    <span className="font-semibold">{t("result.visual")} —</span>{" "}
                    {s.visuel}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        <div>
          <p className="text-xs font-semibold text-muted-foreground">
            {t("result.humanAngle")}
          </p>
          <p className="mt-0.5 text-sm">{show.angle_humain}</p>
        </div>

        <div>
          <p className="text-xs font-semibold text-muted-foreground">
            {t("result.caption")}
          </p>
          <p className="mt-0.5 text-sm">{show.description}</p>
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

        <Button variant="outline" onClick={onAddPipeline}>
          <Plus className="h-4 w-4" />
          {t("result.addPipeline")}
        </Button>
      </CardContent>
    </Card>
  );
}
