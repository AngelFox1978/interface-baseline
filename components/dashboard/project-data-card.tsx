import { getTranslations } from "next-intl/server";
import { ChevronLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart } from "@/components/charts/bar-chart";

export async function ProjectDataCard() {
  const t = await getTranslations("projectData");
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
      </CardHeader>
      <CardContent>
        <BarChart
          labels={["Jan", "Feb", "Mar", "Apr", "May"]}
          series={[
            { data: [110, 160, 230, 250, 140] },
            { data: [40, 60, 60, 90, 50] },
          ]}
          stacked
          max={400}
        />
        <div className="mt-3 inline-flex items-center gap-2 rounded-xl border bg-card px-3 py-1.5 text-xs font-semibold text-muted-foreground">
          <ChevronLeft className="h-3.5 w-3.5" />
          {t("range", { count: 0 })}
        </div>
      </CardContent>
    </Card>
  );
}
