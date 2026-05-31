"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Eye, EyeOff } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ComponentsCard() {
  const t = useTranslations("componentsCard");
  const tc = useTranslations("common");
  const [show, setShow] = useState(false);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <Label>{t("username")}</Label>
          <Input placeholder={t("usernamePlaceholder")} />
        </div>
        <div className="space-y-1.5">
          <Label>{t("email")}</Label>
          <div className="relative">
            <Input
              type={show ? "text" : "password"}
              placeholder={t("passwordPlaceholder")}
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              aria-label="toggle"
            >
              {show ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
        <Button className="w-full">{tc("send")}</Button>
      </CardContent>
    </Card>
  );
}
