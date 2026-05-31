"use client";

import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { cn } from "@/lib/utils";

export function LangSwitch() {
  const locale = useLocale();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function set(next: "fr" | "en") {
    if (next === locale) return;
    document.cookie = `locale=${next}; path=/; max-age=31536000; samesite=lax`;
    startTransition(() => router.refresh());
  }

  return (
    <div className="flex items-center rounded-xl border bg-card p-0.5 text-xs font-semibold">
      {(["fr", "en"] as const).map((l) => (
        <button
          key={l}
          onClick={() => set(l)}
          disabled={pending}
          className={cn(
            "rounded-lg px-2.5 py-1.5 uppercase transition-colors",
            locale === l
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
