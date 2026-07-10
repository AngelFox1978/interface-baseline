import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { buttonVariants } from "@/components/ui/button";

// 404 global (hors groupe (app) : pas de sidebar — la page peut être vue
// par un visiteur non connecté, elle ne révèle rien des routes protégées).
export default async function NotFound() {
  const t = await getTranslations("notFound");

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md rounded-3xl border bg-card p-10 text-center shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t("kicker")}
        </p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight">
          {t("title")}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("subtitle")}</p>
        <Link href="/" className={`mt-6 ${buttonVariants({ size: "sm" })}`}>
          {t("back")}
        </Link>
      </div>
    </div>
  );
}
