import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";

type PagePlaceholderProps = {
  pageNumber?: number;
  title?: string;
  subtitle?: string;
};

export function PagePlaceholder({
  pageNumber,
  title,
  subtitle,
}: PagePlaceholderProps) {
  const t = useTranslations("placeholder");
  const pageTitle = title ?? t("pageTitle", { number: pageNumber ?? 0 });
  const pageSubtitle =
    subtitle ?? t("subtitle", { page: pageNumber ?? title ?? "" });

  return (
    <div className="space-y-5">
      <section>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t("kicker")}
        </p>
        <h2 className="mt-1 text-xl font-extrabold tracking-tight">{pageTitle}</h2>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{pageSubtitle}</p>
      </section>

      <Card>
        <CardContent className="pt-5">
          <div className="rounded-2xl border border-dashed p-8 text-center">
            <p className="text-lg font-bold tracking-tight">{pageTitle}</p>
            <p className="mt-2 text-sm text-muted-foreground">
              {t("replaces")}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
