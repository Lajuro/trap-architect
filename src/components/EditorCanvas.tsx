"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { ErrorBoundary, GameErrorFallback } from "./ErrorBoundary";
import { gameEvents, GAME_EVENTS } from "@/game/events";
import { EDITOR_EVENTS } from "@/game/scenes/EditorScene";
import type { LevelData, ParsedLevel, GameEntity, EntityType, TrollTrigger } from "@/game/types";
import { TILE_SIZE } from "@/game/constants";
import { Square } from "lucide-react";
import { stopBGM } from "@/game/audio";

/** Convert editor LevelData to ParsedLevel for GameScene */
function levelDataToParsedLevel(data: LevelData): ParsedLevel {
  const entities: GameEntity[] = data.entities.map((e) => ({
    type: e.type as EntityType,
    x: e.gx * TILE_SIZE + TILE_SIZE / 2,
    y: e.gy * TILE_SIZE + TILE_SIZE / 2,
    alive: true,
    vx: ["goomba", "fast_goomba", "spiny", "flying"].includes(e.type) ? -1.5 : 0,
    vy: 0,
    dir: -1 as const,
    ...(e.type === "flying" ? { baseY: e.gy * TILE_SIZE + TILE_SIZE / 2, frame: 0 } : {}),
  }));

  const trolls: TrollTrigger[] = data.trolls.map((t) => ({ ...t, triggered: false }));

  return {
    name: data.name,
    bgColor: data.bgColor,
    music: data.music,
    width: data.gridW,
    height: data.gridH,
    tiles: data.tiles.map((row) => [...row]),
    entities,
    trolls,
    slideBlocks: data.slideBlocks ? [...data.slideBlocks] : [],
    movingPlatforms: data.movingPlatforms ? [...data.movingPlatforms] : [],
    playerStart: {
      x: data.playerStart.x * TILE_SIZE + TILE_SIZE / 2,
      y: data.playerStart.y * TILE_SIZE + TILE_SIZE / 2,
    },
  };
}

function EditorCanvasInner() {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const [testing, setTesting] = useState(false);
  const levelDataRef = useRef<LevelData | null>(null);

  const stopTest = useCallback(() => {
    const game = gameRef.current;
    if (!game) return;
    setTesting(false);
    stopBGM();
    // Go back to editor with preserved level data
    const scene = game.scene.getScene("GameScene");
    if (scene && scene.scene.isActive()) {
      scene.scene.stop("GameScene");
    }
    const editorScene = game.scene.getScene("EditorScene");
    if (editorScene) {
      game.scene.start("EditorScene", { levelData: levelDataRef.current ?? undefined });
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    async function initEditor() {
      if (!containerRef.current || gameRef.current) return;

      const { createEditorGame } = await import("@/game/PhaserGame");

      if (!mounted || !containerRef.current) return;

      gameRef.current = createEditorGame(containerRef.current);
    }

    initEditor();

    // Listen for test start
    const onStartTest = (data: unknown) => {
      const game = gameRef.current;
      if (!game) return;
      const levelData = data as LevelData;
      levelDataRef.current = levelData;
      const parsed = levelDataToParsedLevel(levelData);
      // Switch to GameScene
      const editorScene = game.scene.getScene("EditorScene");
      if (editorScene && editorScene.scene.isActive()) {
        editorScene.scene.stop("EditorScene");
      }
      game.scene.start("GameScene", { customLevel: parsed });
      setTesting(true);
    };

    const onLevelComplete = () => {
      // Mark test as complete, then return to editor
      setTimeout(() => {
        if (mounted) stopTest();
      }, 3500);
    };

    const onPlayerDied = () => {
      // No action needed — player respawns in GameScene
    };

    gameEvents.on("editor:start_test", onStartTest);
    gameEvents.on(GAME_EVENTS.LEVEL_COMPLETE, onLevelComplete);
    gameEvents.on(GAME_EVENTS.PLAYER_DIED, onPlayerDied);

    return () => {
      mounted = false;
      gameEvents.off("editor:start_test", onStartTest);
      gameEvents.off(GAME_EVENTS.LEVEL_COMPLETE, onLevelComplete);
      gameEvents.off(GAME_EVENTS.PLAYER_DIED, onPlayerDied);
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, [stopTest]);

  return (
    <div className="relative w-full h-full">
      <div
        ref={containerRef}
        className="w-full h-full"
      />
      {testing && (
        <div className="absolute top-3 right-3 z-50">
          <button
            onClick={stopTest}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-red-600 hover:bg-red-500 text-white text-xs font-medium transition-colors shadow-lg"
          >
            <Square size={12} />
            Parar Teste
          </button>
        </div>
      )}
    </div>
  );
}

export function EditorCanvas() {
  return (
    <ErrorBoundary fallback={<GameErrorFallback />}>
      <EditorCanvasInner />
    </ErrorBoundary>
  );
}
