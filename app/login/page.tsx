import { getTranslations } from "next-intl/server";
import { Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { LangSwitch } from "@/components/layout/lang-switch";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  const t = await getTranslations("login");
  const tc = await getTranslations("common");

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Sparkles className="h-5 w-5" />
            </div>
            <span className="text-sm font-extrabold tracking-tight">
              {tc("appName")}
            </span>
          </div>
          <LangSwitch />
        </div>

        <Card>
          <CardContent className="space-y-5 pt-6">
            <div>
              <h1 className="text-xl font-extrabold tracking-tight">
                {t("title")}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("subtitle")}
              </p>
            </div>
            <LoginForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
