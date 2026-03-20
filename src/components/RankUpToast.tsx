"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { CREATOR_RANKS } from "@/game/constants";
import HudPanel from "@/components/ui/HudPanel";
import { PixelIcon } from "@/components/ui/PixelIcon";

interface RankUpData {
  oldRank: number;
  newRank: number;
}

export function useRankUpToast() {
  const [rankUp, setRankUp] = useState<RankUpData | null>(null);

  const checkRankUp = useCallback((oldRank: number, newRank: number) => {
    if (newRank > oldRank) {
      setRankUp({ oldRank, newRank });
    }
  }, []);

  const dismiss = useCallback(() => setRankUp(null), []);

  return { rankUp, checkRankUp, dismiss };
}

export function RankUpToast({
  rankUp,
  onDismiss,
}: {
  rankUp: RankUpData;
  onDismiss: () => void;
}) {
  const t = useTranslations("rankUp");
  const newRankDef = CREATOR_RANKS.find((r) => r.level === rankUp.newRank) ?? CREATOR_RANKS[0];

  useEffect(() => {
    const timer = setTimeout(onDismiss, 8000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 fade-in duration-500" role="alert" aria-live="assertive">
      <HudPanel
        variant="gold"
        className="max-w-sm"
      >
        <div className="flex items-start gap-3">
          <div
            className="flex items-center justify-center w-12 h-12 border-2"
            style={{ borderColor: newRankDef.color, backgroundColor: newRankDef.color + "20" }}
          >
            <PixelIcon name="crown" size={24} color={newRankDef.color} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[8px] text-muted-foreground mb-1 uppercase tracking-wider">{t("title")}</p>
            <p className="text-[10px] font-bold">
              {t.rich("message", { rank: () => <span style={{ color: newRankDef.color }}>{newRankDef.title}</span> })}
            </p>
            <p className="text-[7px] text-muted-foreground mt-1">
              {t("cta")}
            </p>
          </div>
          <button
            onClick={onDismiss}
            className="text-muted-foreground hover:text-foreground"
            aria-label={t("closeLabel")}
          >
            <PixelIcon name="close" size={12} />
          </button>
        </div>
      </HudPanel>
    </div>
  );
}
