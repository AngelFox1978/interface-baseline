import { getTranslations } from "next-intl/server";
import { ChevronDown, MoreHorizontal } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const rows = [
  { name: "Faim Project", price: "$400,000", date: "08/03/2023", status: "Advanced" },
  { name: "Recent Handle", price: "$340,000", date: "08/03/2023", status: "Coining" },
  { name: "Omena Data", price: "$300,000", date: "07/03/2023", status: "Restored" },
];

export async function DataTableCard() {
  const t = await getTranslations("dataTable");

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <button className="flex items-center gap-2 rounded-xl border bg-card px-3 py-1.5 text-xs font-semibold text-muted-foreground">
          {t("filter", { count: 31 })}
          <ChevronDown className="h-3.5 w-3.5" />
        </button>
      </CardHeader>
      <CardContent>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs font-semibold text-muted-foreground">
              <th className="pb-2 font-semibold">{t("name")}</th>
              <th className="pb-2 font-semibold">{t("price")}</th>
              <th className="pb-2 font-semibold">{t("date")}</th>
              <th className="pb-2 font-semibold">{t("status")}</th>
              <th className="pb-2" />
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.name} className="border-t">
                <td className="py-3 font-medium">{r.name}</td>
                <td className="py-3 text-muted-foreground">{r.price}</td>
                <td className="py-3 text-muted-foreground">{r.date}</td>
                <td className="py-3 text-muted-foreground">{r.status}</td>
                <td className="py-3 text-right">
                  <MoreHorizontal className="ml-auto h-4 w-4 text-muted-foreground" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
