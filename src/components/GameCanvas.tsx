"use client";

import { useEffect, useRef } from "react";

export function GameCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    let mounted = true;

    async function initGame() {
      if (!containerRef.current || gameRef.current) return;

      // Dynamic import — Phaser must only load on client
      const { createPhaserGame } = await import("@/game/PhaserGame");

      if (!mounted || !containerRef.current) return;

      gameRef.current = createPhaserGame(containerRef.current);
    }

    initGame();

    return () => {
      mounted = false;
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-full max-w-[800px] aspect-[800/480] mx-auto rounded-lg overflow-hidden border-2 border-border"
    />
  );
}
