"use client";

import { useEffect, useRef } from "react";
import { ErrorBoundary, GameErrorFallback } from "./ErrorBoundary";

function EditorCanvasInner() {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    let mounted = true;

    async function initEditor() {
      if (!containerRef.current || gameRef.current) return;

      const { createEditorGame } = await import("@/game/PhaserGame");

      if (!mounted || !containerRef.current) return;

      gameRef.current = createEditorGame(containerRef.current);
    }

    initEditor();

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
      className="w-full max-w-[800px] aspect-[800/600] mx-auto rounded-lg overflow-hidden border-2 border-border"
    />
  );
}

export function EditorCanvas() {
  return (
    <ErrorBoundary fallback={<GameErrorFallback />}>
      <EditorCanvasInner />
    </ErrorBoundary>
  );
}
