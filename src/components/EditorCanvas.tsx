"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useLocale } from "next-intl";
import { setGameLocale } from "@/i18n/game";
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
    teleporterPairs: data.teleporterPairs ?? [],
    teleporterChannels: data.teleporterChannels ?? undefined,
    signTexts: data.signTexts ?? undefined,
  };
}

// Channel colors matching EditorScene labels
const CHANNEL_COLORS = [
  "#ffffff", "#ff4444", "#44ff44", "#4488ff",
  "#ffff44", "#ff44ff", "#44ffff", "#ff8844",
];

interface TileConfigState {
  type: "teleporter";
  gx: number;
  gy: number;
  channel: number;
}

function EditorCanvasInner() {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const [testing, setTesting] = useState(false);
  const levelDataRef = useRef<LevelData | null>(null);
  const [tileConfig, setTileConfig] = useState<TileConfigState | null>(null);
  const locale = useLocale();

  useEffect(() => { setGameLocale(locale); }, [locale]);

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

    const onTileConfig = (data: unknown) => {
      setTileConfig(data as TileConfigState);
    };
    gameEvents.on(EDITOR_EVENTS.TILE_CONFIG, onTileConfig);

    return () => {
      mounted = false;
      gameEvents.off("editor:start_test", onStartTest);
      gameEvents.off(GAME_EVENTS.LEVEL_COMPLETE, onLevelComplete);
      gameEvents.off(GAME_EVENTS.PLAYER_DIED, onPlayerDied);
      gameEvents.off(EDITOR_EVENTS.TILE_CONFIG, onTileConfig);
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, [stopTest]);

  const handleSetChannel = useCallback((channel: number) => {
    if (!tileConfig) return;
    gameEvents.emit(EDITOR_EVENTS.SET_TELEPORTER_CHANNEL, {
      gx: tileConfig.gx,
      gy: tileConfig.gy,
      channel,
    });
    setTileConfig(null);
  }, [tileConfig]);

  return (
    <div className="relative w-full h-full" onContextMenu={(e) => e.preventDefault()}>
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
      {/* Teleporter channel config modal */}
      {tileConfig?.type === "teleporter" && (
        <div
          role="button"
          tabIndex={0}
          className="absolute inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setTileConfig(null)}
          onKeyDown={(e) => { if (e.key === "Escape") setTileConfig(null); }}
        >
          <div
            role="dialog"
            className="bg-zinc-900 border border-zinc-700 rounded-lg p-4 shadow-xl min-w-60"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <h3 className="text-sm font-bold text-white mb-1">Configurar Portal</h3>
            <p className="text-xs text-zinc-400 mb-3">
              Posição: ({tileConfig.gx}, {tileConfig.gy})
            </p>
            <p className="text-xs text-zinc-300 mb-2">Canal de conexão:</p>
            <div className="grid grid-cols-4 gap-2">
              {Array.from({ length: 8 }, (_, i) => i + 1).map((ch) => (
                <button
                  key={ch}
                  onClick={() => handleSetChannel(ch)}
                  className={`h-8 rounded text-xs font-bold border transition-colors ${
                    ch === tileConfig.channel
                      ? "ring-2 ring-white border-white"
                      : "border-zinc-600 hover:border-zinc-400"
                  }`}
                  style={{ backgroundColor: CHANNEL_COLORS[(ch - 1) % CHANNEL_COLORS.length] + "33", color: CHANNEL_COLORS[(ch - 1) % CHANNEL_COLORS.length] }}
                >
                  {ch}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-zinc-500 mt-3">
              Portais com o mesmo canal se conectam entre si.
            </p>
          </div>
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
