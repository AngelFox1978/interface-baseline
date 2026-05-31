import { getTranslations } from "next-intl/server";
import { Card, CardContent } from "@/components/ui/card";

export async function PagePlaceholder({ titleKey }: { titleKey: string }) {
  const t = await getTranslations();
  return (
    <Card>
      <CardContent className="flex min-h-[320px] flex-col items-center justify-center gap-2 text-center">
        <p className="text-lg font-bold">{t(titleKey)}</p>
        <p className="text-sm text-muted-foreground">
          {t("pages.comingSoon")} · {t("pages.comingSoonHint")}
        </p>
      </CardContent>
    </Card>
  );
}
