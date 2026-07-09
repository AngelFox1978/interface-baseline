import Link from "next/link";
import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const shortcuts = [
  { key: "radar", href: "/page-1" },
  { key: "atelier", href: "/page-2" },
  { key: "pipeline", href: "/page-3" },
  { key: "parametres", href: "/parametres" },
] as const;

export default function AccueilPage() {
  const t = useTranslations("accueil");
  const tn = useTranslations("nav");
  const itemClass =
    "flex items-center justify-between rounded-xl border bg-card px-4 py-3 text-sm font-semibold transition-colors hover:bg-muted";

  return (
    <div className="space-y-5">
      <section>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t("kicker")}
        </p>
        <h2 className="mt-1 text-xl font-extrabold tracking-tight">
          {t("title")}
        </h2>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          {t("subtitle")}
        </p>
      </section>

      <Card>
        <CardContent className="pt-5">
          <div className="grid gap-2">
            {shortcuts.map(({ key, href }) => (
              <Link
                key={key}
                href={href}
                className={cn(itemClass, key === "parametres" && "mt-2")}
              >
                <span>{tn(key)}</span>
                <span className="text-xs text-muted-foreground">{href}</span>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
