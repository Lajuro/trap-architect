"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { hydrateFromProfile } from "@/lib/cosmetics-sync";
import PixelIcon from "@/components/ui/PixelIcon";
import HudButton from "@/components/ui/HudButton";
import { playUIClick } from "@/game/audio";

export default function HudBar() {
  const [user, setUser] = useState<{ email?: string } | null>(null);
  const [coins, setCoins] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const supabase = createClient();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      setUser(user);
      setLoading(false);

      if (user) {
        try {
          const res = await fetch("/api/shop/inventory");
          if (res.ok) {
            const data = await res.json();
            setCoins(data.creator_coins ?? 0);
            const profileRes = await fetch("/api/profile");
            const profileData = profileRes.ok ? await profileRes.json() : null;
            hydrateFromProfile({
              equipped_skin: data.equipped_skin,
              equipped_trail: data.equipped_trail,
              equipped_death_effect: data.equipped_death_effect,
              equipped_frame: data.equipped_frame,
              unlocked_cosmetics: data.unlocked_cosmetics,
              campaign_progress: profileData?.profile?.campaign_progress || {},
              campaign_completed: profileData?.profile?.campaign_completed || false,
            });
          }
        } catch {
          // Offline fallback
        }
      }
    });
  }, [supabase.auth]);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const isActive = (href: string) => pathname === href;

  const navItems = [
    { href: "/play", label: "JOGAR", icon: "play" as const },
    { href: "/editor", label: "CRIAR", icon: "create" as const },
    { href: "/browse", label: "EXPLORAR", icon: "browse" as const },
    { href: "/shop", label: "LOJA", icon: "shop" as const },
  ];

  return (
    <>
      <header className="border-b-2 border-border bg-card/95 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-3 py-2">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            onClick={() => playUIClick()}
          >
            <PixelIcon name="cat" size={24} />
            <span className="text-primary text-[10px] font-bold tracking-wider hidden sm:inline">
              TRAP ARCHITECT
            </span>
          </Link>

          {/* Center nav — desktop */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <HudButton
                key={item.href}
                href={item.href}
                variant={isActive(item.href) ? "primary" : "ghost"}
                icon={<PixelIcon name={item.icon} size={14} />}
                small
              >
                {item.label}
              </HudButton>
            ))}
          </nav>

          {/* Right section */}
          <div className="flex items-center gap-2">
            {!loading && user && coins !== null && (
              <Link href="/shop" className="flex items-center gap-1.5 text-hud-gold text-[9px] font-bold hover:opacity-80 transition-opacity">
                <PixelIcon name="coin" size={14} />
                <span>{coins}</span>
              </Link>
            )}

            {!loading && user && (
              <>
                <HudButton
                  href="/profile"
                  variant={isActive("/profile") ? "primary" : "ghost"}
                  icon={<PixelIcon name="profile" size={14} />}
                  small
                  className="hidden md:inline-flex"
                >
                  PERFIL
                </HudButton>
                <button
                  onClick={async () => {
                    playUIClick();
                    await supabase.auth.signOut();
                    router.refresh();
                  }}
                  className="hidden md:flex items-center gap-1 text-[8px] text-muted-foreground hover:text-destructive transition-colors px-2 py-1 uppercase tracking-wider font-bold cursor-pointer"
                >
                  <PixelIcon name="logout" size={12} />
                  SAIR
                </button>
              </>
            )}

            {!loading && !user && (
              <HudButton href="/login" variant="primary" small className="hidden md:inline-flex">
                ENTRAR
              </HudButton>
            )}

            {/* Mobile hamburger */}
            <button
              onClick={() => {
                playUIClick();
                setMobileOpen(!mobileOpen);
              }}
              className="md:hidden p-1 cursor-pointer"
              aria-label="Menu"
            >
              <PixelIcon name={mobileOpen ? "close" : "menu"} size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 bg-background/98 md:hidden">
          <div className="flex flex-col items-center justify-center h-full gap-4">
            {/* Close button */}
            <button
              onClick={() => { playUIClick(); setMobileOpen(false); }}
              className="absolute top-4 right-4 p-2 cursor-pointer"
              aria-label="Fechar menu"
            >
              <PixelIcon name="close" size={24} />
            </button>

            {/* Logo */}
            <div className="flex items-center gap-3 mb-8">
              <PixelIcon name="cat" size={36} />
              <span className="text-primary text-[12px] font-bold tracking-wider">
                TRAP ARCHITECT
              </span>
            </div>

            {/* Nav items */}
            {navItems.map((item) => (
              <HudButton
                key={item.href}
                href={item.href}
                variant={isActive(item.href) ? "primary" : "secondary"}
                icon={<PixelIcon name={item.icon} size={16} />}
              >
                {item.label}
              </HudButton>
            ))}

            {user && (
              <>
                <HudButton
                  href="/profile"
                  variant={isActive("/profile") ? "primary" : "secondary"}
                  icon={<PixelIcon name="profile" size={16} />}
                >
                  PERFIL
                </HudButton>
                <HudButton
                  variant="danger"
                  icon={<PixelIcon name="logout" size={16} />}
                  onClick={async () => {
                    await supabase.auth.signOut();
                    router.refresh();
                  }}
                >
                  SAIR
                </HudButton>
              </>
            )}

            {!user && (
              <HudButton href="/login" variant="primary" icon={<PixelIcon name="play" size={16} />}>
                ENTRAR
              </HudButton>
            )}
          </div>
        </div>
      )}
    </>
  );
}
