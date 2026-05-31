import { getTranslations } from "next-intl/server";
import { MoreHorizontal } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart } from "@/components/charts/bar-chart";

export async function SampleChartCard() {
  const t = await getTranslations("sampleChart");
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <BarChart
          labels={["Jan", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]}
          series={[{ data: [150, 105, 140, 110, 170, 145, 100] }]}
          max={200}
        />
      </CardContent>
    </Card>
  );
}
