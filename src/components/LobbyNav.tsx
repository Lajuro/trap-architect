"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useGameShell } from "@/components/GameShellContext";
import PixelIcon from "@/components/ui/PixelIcon";
import type { PixelIconName } from "@/components/ui/PixelIcon";
import { playUIClick, playUIHover } from "@/game/audio";

interface NavTab {
  href: string;
  label: string;
  icon: PixelIconName;
  match?: string[];
}

const TABS: NavTab[] = [
  { href: "/", label: "JOGAR", icon: "play", match: ["/", "/play"] },
  { href: "/browse", label: "COMUNIDADE", icon: "browse", match: ["/browse", "/collections"] },
  { href: "/shop", label: "LOJA", icon: "shop", match: ["/shop"] },
  { href: "/profile", label: "PERFIL", icon: "profile", match: ["/profile", "/settings"] },
];

export default function LobbyNav() {
  const pathname = usePathname();
  const { coins, user } = useGameShell();

  const isActive = (tab: NavTab) =>
    tab.match?.some((m) => (m === "/" ? pathname === "/" : pathname.startsWith(m))) ?? false;

  return (
    <header className="relative z-30 shrink-0">
      {/* Main nav bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-black/60 backdrop-blur-sm border-b-2 border-primary/20">
        {/* Left: Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 hover:opacity-80 transition-opacity shrink-0"
          onClick={() => playUIClick()}
        >
          <PixelIcon name="cat" size={20} color="#ff8c00" />
          <span className="text-primary text-[9px] font-bold tracking-widest hidden sm:inline">
            TRAP ARCHITECT
          </span>
        </Link>

        {/* Center: Tabs */}
        <nav className="flex items-center gap-1">
          {TABS.map((tab) => {
            const active = isActive(tab);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                onClick={() => playUIClick()}
                onMouseEnter={() => playUIHover()}
                className={`
                  relative flex items-center gap-1.5 px-3 py-1.5
                  text-[8px] font-bold uppercase tracking-wider
                  transition-all duration-200 cursor-pointer
                  ${active
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                  }
                `}
              >
                <PixelIcon
                  name={tab.icon}
                  size={12}
                  color={active ? "#ff8c00" : undefined}
                />
                <span className="hidden md:inline">{tab.label}</span>

                {/* Active indicator */}
                {active && (
                  <span
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-[2px] bg-primary"
                    style={{
                      boxShadow: "0 0 8px rgba(255,140,0,0.6)",
                    }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right: Coins + Settings */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Coins */}
          <Link
            href="/shop"
            className="flex items-center gap-1.5 text-hud-gold text-[8px] font-bold hover:opacity-80 transition-opacity"
            onClick={() => playUIClick()}
          >
            <PixelIcon name="coin" size={12} />
            <span>{coins}</span>
          </Link>

          {/* Settings */}
          <Link
            href="/settings"
            className="text-muted-foreground hover:text-foreground transition-colors p-1"
            onClick={() => playUIClick()}
            onMouseEnter={() => playUIHover()}
          >
            <PixelIcon name="settings" size={14} />
          </Link>

          {/* User avatar placeholder */}
          {user && (
            <Link
              href="/profile"
              className="w-7 h-7 border-2 border-primary/40 bg-card flex items-center justify-center hover:border-primary transition-colors"
              onClick={() => playUIClick()}
            >
              <PixelIcon name="cat" size={14} color="#ff8c00" />
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
