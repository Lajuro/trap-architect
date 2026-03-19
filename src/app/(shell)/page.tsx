"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { playUIClick, playUIHover } from "@/game/audio";
import WeeklyChallenge from "@/components/WeeklyChallenge";
import { PixelIcon, type PixelIconName } from "@/components/ui/PixelIcon";

interface MenuOption {
  label: string;
  sublabel: string;
  icon: PixelIconName;
  href: string;
  color: string;
  glow: string;
}

const MENU_OPTIONS: MenuOption[] = [
  {
    label: "Campanha",
    sublabel: "10 fases originais",
    icon: "play",
    href: "/play",
    color: "#22C55E",
    glow: "0 0 20px rgba(34,197,94,0.4)",
  },
  {
    label: "Demo Rapida",
    sublabel: "Testar o jogo",
    icon: "sparkle",
    href: "/play?demo=1",
    color: "#38BDF8",
    glow: "0 0 20px rgba(56,189,248,0.4)",
  },
  {
    label: "Editor",
    sublabel: "Criar niveis",
    icon: "create",
    href: "/editor",
    color: "#F97316",
    glow: "0 0 20px rgba(249,115,22,0.4)",
  },
  {
    label: "Comunidade",
    sublabel: "Explorar niveis",
    icon: "browse",
    href: "/browse",
    color: "#A78BFA",
    glow: "0 0 20px rgba(167,139,250,0.4)",
  },
];

export default function MainMenuPage() {
  const [visible, setVisible] = useState(false);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-8 overflow-y-auto">
      {/* Title */}
      <div
        className="text-center mb-8 transition-all duration-700"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(-20px)",
        }}
      >
        <h1 className="text-lg sm:text-xl font-bold tracking-wider uppercase text-primary drop-shadow-[0_0_10px_rgba(249,115,22,0.5)]">
          Trap Architect
        </h1>
        <p className="text-[8px] text-muted-foreground mt-1 uppercase tracking-widest">
          Crie. Compartilhe. Morra rindo.
        </p>
      </div>

      {/* Menu options */}
      <div className="flex flex-col gap-3 w-full max-w-sm">
        {MENU_OPTIONS.map((opt, i) => (
          <Link
            key={opt.label}
            href={opt.href}
            onClick={() => playUIClick()}
            onMouseEnter={() => {
              setHoveredIdx(i);
              playUIHover();
            }}
            onMouseLeave={() => setHoveredIdx(null)}
            className="group relative flex items-center gap-4 px-5 py-4 border-2 transition-all duration-200"
            style={{
              opacity: visible ? 1 : 0,
              transform: visible ? "translateX(0)" : "translateX(-30px)",
              transitionDelay: `${200 + i * 100}ms`,
              borderColor:
                hoveredIdx === i ? opt.color : "var(--color-border)",
              backgroundColor:
                hoveredIdx === i ? opt.color + "10" : "rgba(0,0,0,0.4)",
              boxShadow: hoveredIdx === i ? opt.glow : "none",
            }}
          >
            <div
              className="w-10 h-10 border-2 flex items-center justify-center shrink-0 transition-colors duration-200"
              style={{
                borderColor: hoveredIdx === i ? opt.color : "var(--color-border)",
              }}
            >
              <PixelIcon
                name={opt.icon}
                size={20}
                color={hoveredIdx === i ? opt.color : "#888"}
              />
            </div>
            <div className="flex-1">
              <span
                className="text-[11px] font-bold uppercase tracking-wider block transition-colors duration-200"
                style={{ color: hoveredIdx === i ? opt.color : "var(--color-foreground)" }}
              >
                {opt.label}
              </span>
              <span className="text-[7px] text-muted-foreground uppercase tracking-wider">
                {opt.sublabel}
              </span>
            </div>
            <span
              className="text-[10px] transition-transform duration-200"
              style={{
                color: opt.color,
                opacity: hoveredIdx === i ? 1 : 0.3,
                transform:
                  hoveredIdx === i ? "translateX(4px)" : "translateX(0)",
              }}
            >
              ▶
            </span>
          </Link>
        ))}
      </div>

      {/* Weekly challenge */}
      <div
        className="mt-8 w-full max-w-sm transition-all duration-700"
        style={{
          opacity: visible ? 1 : 0,
          transitionDelay: "800ms",
        }}
      >
        <WeeklyChallenge />
      </div>
    </div>
  );
}
