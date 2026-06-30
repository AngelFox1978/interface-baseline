import type { FormatType } from "@/lib/console/types";
import { cn } from "@/lib/utils";

// Badge de format. Couleurs via tokens dédiés (--format-*), jamais en dur.
const STYLES: Record<FormatType, string> = {
  video: "border-format-video text-format-video",
  diaporama: "border-format-slideshow text-format-slideshow",
};

export function FormatBadge({
  type,
  label,
  className,
}: {
  type: FormatType;
  label: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "shrink-0 whitespace-nowrap rounded-md border px-2 py-0.5 text-xs font-semibold",
        STYLES[type] ?? STYLES.video,
        className,
      )}
    >
      {label}
    </span>
  );
}
