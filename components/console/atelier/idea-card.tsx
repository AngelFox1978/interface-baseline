"use client";

import { useTranslations } from "next-intl";
import { CornerDownRight, FileText, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormatBadge } from "@/components/console/atelier/format-badge";
import type { Idea } from "@/lib/console/types";

export function IdeaCard({
  idea,
  index,
  onScript,
  onAddPipeline,
  busy = false,
  disabled = false,
}: {
  idea: Idea;
  index: number;
  onScript: (idea: Idea) => void;
  onAddPipeline: (idea: Idea) => void;
  // busy = cette idée est en cours de génération ; disabled = une autre l'est.
  busy?: boolean;
  disabled?: boolean;
}) {
  const t = useTranslations("atelier");
  const isSlide = idea.type === "diaporama";

  return (
    <div className="rounded-xl border p-3">
      <div className="flex items-baseline gap-2">
        <span className="text-xs tabular-nums text-muted-foreground">
          {String(index + 1).padStart(2, "0")}
        </span>
        <span className="text-sm font-semibold">{idea.titre}</span>
        <FormatBadge
          className="ml-auto"
          type={idea.type}
          label={t(`format.${isSlide ? "diaporama" : "video"}`)}
        />
      </div>

      {idea.hook && (
        <p className="mt-1.5 text-sm text-foreground">
          <span className="font-semibold">{t("idea.hook")} —</span> {idea.hook}
        </p>
      )}
      {idea.angle && (
        <p className="mt-1 flex items-start gap-1 text-xs italic text-muted-foreground">
          <CornerDownRight className="mt-0.5 h-3 w-3 shrink-0" />
          <span>{idea.angle}</span>
        </p>
      )}

      <div className="mt-2.5 flex flex-wrap gap-2">
        <Button
          variant="ink"
          size="sm"
          onClick={() => onScript(idea)}
          disabled={busy || disabled}
        >
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <FileText className="h-4 w-4" />
          )}
          {isSlide ? t("idea.scriptSlideshow") : t("idea.scriptVideo")}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onAddPipeline(idea)}
          disabled={disabled}
        >
          <Plus className="h-4 w-4" />
          {t("idea.addPipeline")}
        </Button>
      </div>
    </div>
  );
}
