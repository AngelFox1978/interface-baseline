import { getTranslations } from "next-intl/server";
import { MoreHorizontal } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const activities = [
  { name: "Admin User", initials: "AU", time: "1 week" },
  { name: "Admin User", initials: "AU", time: "3 hours" },
  { name: "Aaisan Soliin", initials: "AS", time: "4 hours" },
];

export async function RecentActivitiesCard() {
  const t = await getTranslations();
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("activities.title")}</CardTitle>
        <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="space-y-4">
        {activities.map((a, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-xs font-bold text-secondary-foreground">
              {a.initials}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{a.name}</p>
              <p className="truncate text-xs text-muted-foreground">
                {t("activities.ago", { time: a.time })}
              </p>
            </div>
          </div>
        ))}
        <Button variant="outline" className="w-full">
          {t("common.viewMore")}
        </Button>
      </CardContent>
    </Card>
  );
}
