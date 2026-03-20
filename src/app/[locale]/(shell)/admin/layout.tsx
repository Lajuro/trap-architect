"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, Link } from "@/i18n/navigation";
import { usePathname } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { isAdmin } from "@/lib/ranks";
import { PixelIcon, type PixelIconName } from "@/components/ui/PixelIcon";
import { playUIClick, playUIHover } from "@/game/audio";

interface AdminNavItem {
  href: string;
  labelKey: string;
  icon: PixelIconName;
}

const NAV_ITEMS: AdminNavItem[] = [
  { href: "/admin", labelKey: "sidebar.dashboard", icon: "home" },
  { href: "/admin/users", labelKey: "sidebar.users", icon: "profile" },
  { href: "/admin/levels", labelKey: "sidebar.levels", icon: "browse" },
  { href: "/admin/reports", labelKey: "sidebar.reports", icon: "flag" },
  { href: "/admin/weekly", labelKey: "sidebar.weekly", icon: "trophy" },
  { href: "/admin/activity", labelKey: "sidebar.activity", icon: "clock" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("admin");
  const tc = useTranslations("common");

  useEffect(() => {
    async function checkAdmin() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const { data: profile } = await supabase
        .from("profiles")
        .select("creator_rank")
        .eq("id", user.id)
        .single();

      if (!profile || !isAdmin(profile.creator_rank)) {
        router.push("/");
        return;
      }

      setAuthorized(true);
      setLoading(false);
    }
    checkAdmin();
  }, [router]);

  if (loading || !authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground text-[9px] uppercase tracking-wider">
          {tc("loadingEllipsis")}
        </p>
      </div>
    );
  }

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  return (
    <div className="flex h-full min-h-0">
      {/* Sidebar — desktop */}
      <aside className="hidden md:flex flex-col w-48 shrink-0 bg-black/40 border-r-2 border-red-500/20 py-4 px-2 gap-1 overflow-y-auto">
        <div className="flex items-center gap-2 px-3 mb-4">
          <PixelIcon name="crown" size={16} color="#EF4444" />
          <span className="text-red-400 text-[10px] font-bold uppercase tracking-widest">
            Admin
          </span>
        </div>
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => playUIClick()}
              onMouseEnter={() => playUIHover()}
              className={`
                flex items-center gap-2 px-3 py-2 text-[9px] font-bold uppercase tracking-wider
                transition-all duration-200 rounded-sm
                ${active
                  ? "text-red-400 bg-red-500/10 border-l-2 border-red-500"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/5 border-l-2 border-transparent"
                }
              `}
            >
              <PixelIcon
                name={item.icon}
                size={12}
                color={active ? "#EF4444" : undefined}
              />
              {t(item.labelKey)}
            </Link>
          );
        })}
      </aside>

      {/* Mobile tab bar */}
      <div className="md:hidden flex items-center gap-1 px-2 py-2 bg-black/40 border-b-2 border-red-500/20 overflow-x-auto shrink-0 absolute top-0 left-0 right-0 z-20">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => playUIClick()}
              className={`
                flex items-center gap-1 px-2 py-1.5 text-[7px] font-bold uppercase tracking-wider
                whitespace-nowrap transition-all duration-200
                ${active
                  ? "text-red-400 border-b-2 border-red-500"
                  : "text-muted-foreground border-b-2 border-transparent"
                }
              `}
            >
              <PixelIcon
                name={item.icon}
                size={10}
                color={active ? "#EF4444" : undefined}
              />
              {t(item.labelKey)}
            </Link>
          );
        })}
      </div>

      {/* Content area */}
      <div className="flex-1 min-w-0 overflow-y-auto md:pt-0 pt-12">
        {children}
      </div>
    </div>
  );
}
