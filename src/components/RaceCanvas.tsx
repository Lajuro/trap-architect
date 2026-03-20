"use client";

import { useEffect, useRef } from "react";
import { useLocale } from "next-intl";
import { setGameLocale } from "@/i18n/game";
import type { ParsedLevel } from "@/game/types";
import { createGameEventBus } from "@/game/events";
import { ErrorBoundary, GameErrorFallback } from "./ErrorBoundary";

interface RaceCanvasProps {
  level: ParsedLevel;
  onPositionBroadcast: (x: number, y: number, alive: boolean, frame: number) => void;
  onRaceComplete: (timeMs: number, deaths: number) => void;
  onGameSceneReady: (scene: {
    setOpponentPosition: (x: number, y: number, alive: boolean) => void;
  }) => void;
}

function RaceCanvasInner({
  level,
  onPositionBroadcast,
  onRaceComplete,
  onGameSceneReady,
}: RaceCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const locale = useLocale();

  // Keep callback refs stable
  const onPositionRef = useRef(onPositionBroadcast);
  onPositionRef.current = onPositionBroadcast;
  const onCompleteRef = useRef(onRaceComplete);
  onCompleteRef.current = onRaceComplete;
  const onReadyRef = useRef(onGameSceneReady);
  onReadyRef.current = onGameSceneReady;

  useEffect(() => {
    setGameLocale(locale);
    let mounted = true;
    const raceBus = createGameEventBus();

    async function initGame() {
      if (!containerRef.current || gameRef.current) return;

      const { createPhaserGame } = await import("@/game/PhaserGame");

      if (!mounted || !containerRef.current) return;

      const game = createPhaserGame(containerRef.current);
      gameRef.current = game;

      const startRaceScene = () => {
        if (!mounted || !gameRef.current) return;
        game.scene.start("GameScene", {
          customLevel: level,
          eventBus: raceBus,
          raceMode: true,
          muteAudio: false,
          onPositionBroadcast: (x: number, y: number, alive: boolean, frame: number) => {
            onPositionRef.current(x, y, alive, frame);
          },
          onRaceComplete: (timeMs: number, deaths: number) => {
            onCompleteRef.current(timeMs, deaths);
          },
        });

        // Expose GameScene ref for opponent ghost control
        setTimeout(() => {
          if (!mounted || !gameRef.current) return;
          const scene = gameRef.current.scene.getScene("GameScene");
          const gameScene = scene as unknown as
            | { setOpponentPosition: (x: number, y: number, alive: boolean) => void }
            | undefined;
          if (gameScene?.setOpponentPosition) {
            onReadyRef.current(gameScene);
          }
        }, 500);
      };

      game.events.once("ready", () => {
        if (!mounted) return;
        startRaceScene();
      });

      // Fallback
      setTimeout(() => {
        if (!mounted || !gameRef.current) return;
        const gameScene = gameRef.current.scene.getScene("GameScene");
        if (gameScene && !gameScene.scene.isActive()) {
          startRaceScene();
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
  }, [level, locale]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full overflow-hidden"
    />
  );
}

export function RaceCanvas(props: RaceCanvasProps) {
  return (
    <ErrorBoundary fallback={<GameErrorFallback />}>
      <RaceCanvasInner {...props} />
    </ErrorBoundary>
  );
}
