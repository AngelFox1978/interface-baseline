"use client";

import { useCallback, useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Loader2, RefreshCw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// Ligne renvoyée par GET /api/journal (table audit_log).
type AuditRow = {
  id: number;
  created_at: string;
  email: string | null;
  action: string;
  details: Record<string, unknown> | null;
};

export default function JournalPage() {
  const t = useTranslations("journal");
  const locale = useLocale();

  const [rows, setRows] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);
  // true quand GET /api/journal échoue (DATABASE_URL absent, Postgres éteint…).
  const [dbError, setDbError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setDbError(false);
    try {
      const r = await fetch("/api/journal");
      if (!r.ok) throw new Error(String(r.status));
      setRows((await r.json()) as AuditRow[]);
    } catch {
      setDbError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-5">
      <section>
        <h2 className="text-xl font-extrabold tracking-tight">{t("title")}</h2>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          {t("subtitle")}
        </p>
      </section>

      {/* Base injoignable : message clair + bouton réessayer, pas de crash. */}
      {dbError ? (
        <Card>
          <CardContent className="pt-5">
            <div className="rounded-2xl border border-dashed p-8 text-center">
              <p className="text-sm font-semibold text-risk-high">
                {t("dbError")}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={load}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                {t("retry")}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-base font-bold tracking-tight">
                {t("listTitle", { count: rows.length })}
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={load}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                {t("refresh")}
              </Button>
            </div>

            {loading ? (
              <p className="mt-4 text-sm text-muted-foreground">
                {t("loading")}
              </p>
            ) : rows.length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">{t("empty")}</p>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      <th className="px-3 py-2">{t("colDate")}</th>
                      <th className="px-3 py-2">{t("colEmail")}</th>
                      <th className="px-3 py-2">{t("colAction")}</th>
                      <th className="px-3 py-2">{t("colDetails")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.id} className="border-b last:border-0">
                        <td className="whitespace-nowrap px-3 py-2 tabular-nums">
                          {new Date(r.created_at).toLocaleString(locale)}
                        </td>
                        <td className="px-3 py-2">{r.email ?? "—"}</td>
                        <td className="px-3 py-2 font-semibold">{r.action}</td>
                        <td className="px-3 py-2 text-muted-foreground">
                          {r.details ? JSON.stringify(r.details) : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
