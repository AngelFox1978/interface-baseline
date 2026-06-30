import type { RisqueNiveau } from "@/lib/console/types";
import { cn } from "@/lib/utils";

// Badge de risque coloré. Couleurs via tokens dédiés (--risk-*), jamais en dur.
const STYLES: Record<RisqueNiveau, string> = {
  faible: "border-risk-low text-risk-low",
  moyen: "border-risk-medium text-risk-medium",
  eleve: "border-risk-high text-risk-high",
};

export function RiskBadge({
  level,
  label,
}: {
  level: RisqueNiveau;
  label: string;
}) {
  const style = STYLES[level] ?? STYLES.moyen;
  return (
    <span
      className={cn(
        "shrink-0 whitespace-nowrap rounded-md border px-2 py-0.5 text-xs font-semibold",
        style,
      )}
    >
      {label}
    </span>
  );
}
