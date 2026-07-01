import { getTranslations } from "next-intl/server";
import { Card, CardContent } from "@/components/ui/card";
import { REPERES } from "@/lib/console/reperes";

// Page statique : composant serveur (aucune interactivité).
export default async function ReperesPage() {
  const t = await getTranslations("reperes");

  return (
    <div className="space-y-5">
      <section>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t("eyebrow")}
        </p>
        <h2 className="mt-1 text-xl font-extrabold tracking-tight">{t("title")}</h2>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          {t("subtitle")}
        </p>
      </section>

      <div className="grid gap-4">
        {REPERES.map((block, i) => (
          <Card key={i}>
            <CardContent className="pt-5">
              <h3 className="text-base font-bold tracking-tight">{block.h}</h3>
              <dl className="mt-3 grid gap-3">
                {block.body.map(([term, desc], j) => (
                  <div
                    key={j}
                    className="grid gap-1 sm:grid-cols-[minmax(120px,180px)_1fr] sm:gap-4"
                  >
                    <dt className="text-xs font-semibold text-format-video">
                      {term}
                    </dt>
                    <dd className="text-sm leading-relaxed text-foreground">
                      {desc}
                    </dd>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
