"use client";

import { useEffect, useRef } from "react";
import type { ParsedLevel } from "@/game/types";

interface CommunityGameCanvasProps {
  level: ParsedLevel;
}

export function CommunityGameCanvas({ level }: CommunityGameCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    let mounted = true;

    async function initGame() {
      if (!containerRef.current || gameRef.current) return;

      const { createPhaserGame } = await import("@/game/PhaserGame");

      if (!mounted || !containerRef.current) return;

      const game = createPhaserGame(containerRef.current);
      gameRef.current = game;

      // Wait for the boot scene to finish, then start GameScene with custom level
      game.events.once("ready", () => {
        if (!mounted) return;
        game.scene.start("GameScene", { customLevel: level });
      });

      // Fallback: if "ready" isn't emitted, start after a short delay
      setTimeout(() => {
        if (!mounted || !gameRef.current) return;
        const gameScene = gameRef.current.scene.getScene("GameScene");
        if (gameScene && !gameScene.scene.isActive()) {
          gameRef.current.scene.start("GameScene", { customLevel: level });
        }
      }, 2000);
    }

    initGame();

    return () => {
      mounted = false;
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, [level]);

  return (
    <div
      ref={containerRef}
      className="w-full max-w-[800px] aspect-[800/480] mx-auto rounded-lg overflow-hidden border-2 border-border"
    />
  );
}
