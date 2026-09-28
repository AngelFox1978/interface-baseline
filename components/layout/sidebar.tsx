"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  FileText,
  Home,
  Library,
  Palette,
  ScrollText,
  Settings,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

// adminOnly : entrée masquée hors rôle admin (l'URL est aussi bloquée
// côté serveur par app/(app)/parametres/layout.tsx).
const items = [
  { key: "accueil", href: "/accueil", icon: Home },
  { key: "page1", href: "/page-1", icon: FileText },
  { key: "page2", href: "/page-2", icon: FileText },
  { key: "page3", href: "/page-3", icon: FileText },
  { key: "prompts", href: "/prompts", icon: Library },
  { key: "journal", href: "/journal", icon: ScrollText },
  { key: "apparence", href: "/apparence", icon: Palette },
  { key: "parametres", href: "/parametres", icon: Settings, adminOnly: true },
] as const;

export function Sidebar({
  userEmail,
  isAdmin = false,
}: {
  userEmail: string;
  isAdmin?: boolean;
}) {
  const t = useTranslations("nav");
  const tc = useTranslations("common");
  const pathname = usePathname();

  return (
    <aside className="flex w-[252px] shrink-0 flex-col rounded-3xl border bg-card p-4 shadow-sm">
      <Link href="/accueil" className="flex items-center gap-2 px-2 py-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <Sparkles className="h-5 w-5" />
        </div>
        <span className="text-sm font-extrabold tracking-tight">
          {tc("appName")}
        </span>
      </Link>

      <nav className="mt-4 flex flex-1 flex-col gap-1">
        {items
          .filter((item) => !("adminOnly" in item && item.adminOnly) || isAdmin)
          .map(({ key, href, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={key}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              {t(key)}
            </Link>
          );
        })}
      </nav>

      <div className="mt-4 flex items-center gap-3 border-t pt-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-xs font-bold text-secondary-foreground">
          {userEmail.slice(0, 2).toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">Admin</p>
          <p className="truncate text-xs text-muted-foreground">{userEmail}</p>
        </div>
      </div>
    </aside>
  );
}
