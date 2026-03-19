"use client";

import { useEffect, useRef } from "react";

export default function LobbyBackground({ onReady }: { onReady?: () => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    if (!containerRef.current || gameRef.current) return;

    let destroyed = false;

    import("@/game/PhaserGame").then(({ createLobbyGame }) => {
      if (destroyed || !containerRef.current) return;
      const game = createLobbyGame(containerRef.current);
      gameRef.current = game;
      onReady?.();
    });

    return () => {
      destroyed = true;
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, [onReady]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 z-0 pointer-events-none"
      aria-hidden="true"
    />
  );
}
