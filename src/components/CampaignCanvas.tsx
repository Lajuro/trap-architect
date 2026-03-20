"use client";

import { useEffect, useRef } from "react";
import { useLocale } from "next-intl";
import { setGameLocale } from "@/i18n/game";
import { ErrorBoundary, GameErrorFallback } from "./ErrorBoundary";

interface CampaignCanvasInnerProps {
  startScene: "LevelSelectScene" | "GameScene";
}

function CampaignCanvasInner({ startScene }: CampaignCanvasInnerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const locale = useLocale();

  useEffect(() => {
    setGameLocale(locale);
    let mounted = true;

    async function initGame() {
      if (!containerRef.current || gameRef.current) return;

      const { createPhaserGame } = await import("@/game/PhaserGame");

      if (!mounted || !containerRef.current) return;

      gameRef.current = createPhaserGame(containerRef.current, { startScene });
    }

    initGame();

    return () => {
      mounted = false;
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, [startScene]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full overflow-hidden"
    />
  );
}

export function CampaignCanvas({ startScene }: CampaignCanvasInnerProps) {
  return (
    <ErrorBoundary fallback={<GameErrorFallback />}>
      <CampaignCanvasInner startScene={startScene} />
    </ErrorBoundary>
  );
}
