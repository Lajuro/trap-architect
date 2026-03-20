"use client";

import { useEffect, useRef } from "react";

interface NotFoundGameProps {
  readonly title?: string;
  readonly description?: string;
  readonly browseText?: string;
  readonly homeText?: string;
  readonly browseHref?: string;
  readonly homeHref?: string;
}

export default function NotFoundGame({
  title,
  description,
  browseText,
  homeText,
  browseHref,
  homeHref,
}: NotFoundGameProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<unknown>(null);

  useEffect(() => {
    let mounted = true;

    async function initGame() {
      if (!containerRef.current || gameRef.current) return;

      const { createNotFoundGame } = await import("@/game/PhaserGame");

      if (!mounted || !containerRef.current) return;

      gameRef.current = createNotFoundGame(containerRef.current);
    }

    initGame();

    return () => {
      mounted = false;
      if (gameRef.current) {
        (gameRef.current as { destroy(removeCanvas: boolean): void }).destroy(true);
        gameRef.current = null;
      }
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background px-4 py-6 gap-4">
      <h1
        className="text-[10px] sm:text-[14px] font-bold text-primary tracking-wider text-center"
        style={{ fontFamily: '"Press Start 2P", monospace' }}
      >
        {title ?? "LEVEL 404 — PAGE NOT FOUND"}
      </h1>

      <div className="relative w-full max-w-200 aspect-5/3">
        <div
          ref={containerRef}
          className="w-full h-full overflow-hidden border-2 border-border"
          style={{ imageRendering: "pixelated" }}
        />
      </div>

      <p
        className="text-[7px] sm:text-[9px] text-muted-foreground text-center max-w-md"
        style={{ fontFamily: '"Press Start 2P", monospace' }}
      >
        {description ??
          "This page fell into a trap! Every path leads to death... just like in the game."}
      </p>

      <div className="flex gap-3 mt-2">
        <a
          href={browseHref ?? "/browse"}
          className="px-4 py-2 bg-primary text-background border-2 border-primary text-[9px] font-bold uppercase tracking-wider hover:opacity-90"
          style={{ fontFamily: '"Press Start 2P", monospace' }}
        >
          {browseText ?? "Browse Levels"}
        </a>
        <a
          href={homeHref ?? "/"}
          className="px-4 py-2 border-2 border-border text-foreground text-[9px] font-bold uppercase tracking-wider hover:bg-muted"
          style={{ fontFamily: '"Press Start 2P", monospace' }}
        >
          {homeText ?? "Home"}
        </a>
      </div>
    </div>
  );
}
