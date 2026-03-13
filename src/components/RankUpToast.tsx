"use client";

import { useState, useEffect, useCallback } from "react";
import { CREATOR_RANKS } from "@/game/constants";

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
  const newRankDef = CREATOR_RANKS.find((r) => r.level === rankUp.newRank) ?? CREATOR_RANKS[0];

  useEffect(() => {
    const timer = setTimeout(onDismiss, 8000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 fade-in duration-500">
      <div
        className="bg-card border-2 rounded-xl p-6 shadow-2xl max-w-sm"
        style={{ borderColor: newRankDef.color }}
      >
        <div className="flex items-start gap-4">
          <div
            className="text-4xl flex items-center justify-center w-14 h-14 rounded-full"
            style={{ backgroundColor: newRankDef.color + "20" }}
          >
            🎉
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-muted-foreground mb-1">Rank Up!</p>
            <p className="text-lg font-bold">
              Parabéns! Você subiu para{" "}
              <span style={{ color: newRankDef.color }}>
                {newRankDef.title}
              </span>{" "}
              🎉
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Continue criando e compartilhando níveis incríveis!
            </p>
          </div>
          <button
            onClick={onDismiss}
            className="text-muted-foreground hover:text-foreground text-lg"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
