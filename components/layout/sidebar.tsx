"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  LayoutDashboard,
  PieChart,
  FolderKanban,
  Users,
  Settings,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { key: "dashboard", href: "/", icon: LayoutDashboard },
  { key: "analytics", href: "/analytics", icon: PieChart },
  { key: "projects", href: "/projects", icon: FolderKanban },
  { key: "team", href: "/team", icon: Users },
  { key: "settings", href: "/settings", icon: Settings },
] as const;

export function Sidebar({ userEmail }: { userEmail: string }) {
  const t = useTranslations("nav");
  const tc = useTranslations("common");
  const pathname = usePathname();

  return (
    <aside className="flex w-[252px] shrink-0 flex-col rounded-3xl border bg-card p-4 shadow-sm">
      <div className="flex items-center gap-2 px-2 py-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <Sparkles className="h-5 w-5" />
        </div>
        <span className="text-sm font-extrabold tracking-tight">
          {tc("appName")}
        </span>
      </div>

      <nav className="mt-4 flex flex-1 flex-col gap-1">
        {items.map(({ key, href, icon: Icon }) => {
          const active =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
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
