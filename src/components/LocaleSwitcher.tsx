"use client";

import { useLocale } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { playUIClick } from "@/game/audio";

const LOCALE_LABELS: Record<string, string> = {
  "pt-BR": "PT",
  "en-US": "EN",
};

export default function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const nextLocale =
    routing.locales.find((l) => l !== locale) ?? routing.defaultLocale;

  function handleSwitch() {
    playUIClick();
    router.replace(pathname, { locale: nextLocale });
  }

  return (
    <button
      onClick={handleSwitch}
      className="text-[8px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors px-1.5 py-1 border border-border/40 hover:border-primary/50"
      title={nextLocale}
    >
      {LOCALE_LABELS[locale] ?? locale}
    </button>
  );
}
