"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { playUIClick, playUIHover } from "@/game/audio";
import WeeklyChallenge from "@/components/WeeklyChallenge";
import { PixelIcon, type PixelIconName } from "@/components/ui/PixelIcon";

interface MenuOption {
  labelKey: string;
  sublabelKey: string;
  icon: PixelIconName;
  href: string;
  color: string;
  glow: string;
}

const MENU_OPTIONS: MenuOption[] = [
  {
    labelKey: "campaign",
    sublabelKey: "campaignSub",
    icon: "play",
    href: "/play",
    color: "#22C55E",
    glow: "0 0 20px rgba(34,197,94,0.4)",
  },
  {
    labelKey: "quickDemo",
    sublabelKey: "quickDemoSub",
    icon: "sparkle",
    href: "/play?demo=1",
    color: "#38BDF8",
    glow: "0 0 20px rgba(56,189,248,0.4)",
  },
  {
    labelKey: "editor",
    sublabelKey: "editorSub",
    icon: "create",
    href: "/editor",
    color: "#F97316",
    glow: "0 0 20px rgba(249,115,22,0.4)",
  },
  {
    labelKey: "communityLevels",
    sublabelKey: "communityLevelsSub",
    icon: "browse",
    href: "/browse",
    color: "#A78BFA",
    glow: "0 0 20px rgba(167,139,250,0.4)",
  },
];

export default function MainMenuPage() {
  const t = useTranslations("menu");
  const [visible, setVisible] = useState(false);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    if (mq.matches) {
      setVisible(true);
    } else {
      const t = setTimeout(() => setVisible(true), 100);
      return () => clearTimeout(t);
    }
  }, []);

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-8 overflow-y-auto">
      {/* Title */}
      <div
        className={`text-center mb-8 ${reducedMotion ? "" : "transition-all duration-700"}`}
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(-20px)",
        }}
      >
        <h1 className="text-lg sm:text-xl font-bold tracking-wider uppercase text-primary drop-shadow-[0_0_10px_rgba(249,115,22,0.5)]">
          Trap Architect
        </h1>
        <p className="text-[8px] text-muted-foreground mt-1 uppercase tracking-widest">
          {t("tagline")}
        </p>
      </div>

      {/* Menu options */}
      <div className="flex flex-col gap-3 w-full max-w-sm">
        {MENU_OPTIONS.map((opt, i) => (
          <Link
            key={opt.labelKey}
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
              transitionDelay: reducedMotion ? "0ms" : `${200 + i * 100}ms`,
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
                {t(opt.labelKey)}
              </span>
              <span className="text-[7px] text-muted-foreground uppercase tracking-wider">
                {t(opt.sublabelKey)}
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
