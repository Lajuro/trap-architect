"use client";

import { useState, useRef, useEffect } from "react";
import { useLocale } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { playUIClick } from "@/game/audio";

const LOCALE_META: Record<string, { country: string; label: string }> = {
  "pt-BR": { country: "br", label: "Português" },
  "en-US": { country: "us", label: "English" },
  "es-ES": { country: "es", label: "Español" },
  "fr-FR": { country: "fr", label: "Français" },
  "it-IT": { country: "it", label: "Italiano" },
  "ja-JP": { country: "jp", label: "日本語" },
  "zh-CN": { country: "cn", label: "中文" },
};

export default function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function handleSelect(next: string) {
    playUIClick();
    setOpen(false);
    if (next !== locale) {
      router.replace(pathname, { locale: next });
    }
  }

  const current = LOCALE_META[locale];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => { playUIClick(); setOpen((o) => !o); }}
        className="flex items-center gap-1 text-[8px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors px-1.5 py-1 border border-border/40 hover:border-primary/50"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={`fi fi-${current?.country} fis`} style={{ fontSize: '12px' }} />
        {current?.label ?? locale}
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute right-0 top-full mt-1 z-50 min-w-[140px] border border-border/60 bg-background/95 backdrop-blur-sm shadow-lg"
        >
          {routing.locales.map((l) => {
            const meta = LOCALE_META[l];
            const isActive = l === locale;
            return (
              <li key={l} role="option" aria-selected={isActive}>
                <button
                  onClick={() => handleSelect(l)}
                  className={`w-full flex items-center gap-2 px-3 py-1.5 text-[10px] font-medium transition-colors hover:bg-primary/10 ${
                    isActive ? "text-primary" : "text-foreground"
                  }`}
                >
                  <span className={`fi fi-${meta?.country} fis`} style={{ fontSize: '14px' }} />
                  {meta?.label ?? l}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
