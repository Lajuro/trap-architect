"use client";

import { useState, useEffect, useCallback } from "react";
import { gameEvents } from "@/game/events";
import { EDITOR_EVENTS } from "@/game/scenes/EditorScene";
import { PALETTE_ITEMS } from "@/game/constants";
import type { LevelData, TrollTrigger } from "@/game/types";

const CATEGORY_LABELS: Record<string, string> = {
  terrain: "Terreno",
  danger: "Perigo",
  interactive: "Interativo",
  entities: "Entidades",
};

export function EditorSidebar() {
  const [selectedId, setSelectedId] = useState(1);
  const [levelName, setLevelName] = useState("Meu Nível");
  const [bgColor, setBgColor] = useState("#5c94fc");
  const [gridW, setGridW] = useState(100);
  const [gridH, setGridH] = useState(15);
  const [trolls, setTrolls] = useState<TrollTrigger[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const onReady = () => setReady(true);
    const onDataChanged = (data: unknown) => {
      const d = data as LevelData;
      setLevelName(d.name);
      setBgColor(d.bgColor);
      setGridW(d.gridW);
      setGridH(d.gridH);
      setTrolls(d.trolls);
    };

    gameEvents.on(EDITOR_EVENTS.READY, onReady);
    gameEvents.on(EDITOR_EVENTS.LEVEL_DATA_CHANGED, onDataChanged);

    return () => {
      gameEvents.off(EDITOR_EVENTS.READY, onReady);
      gameEvents.off(EDITOR_EVENTS.LEVEL_DATA_CHANGED, onDataChanged);
    };
  }, []);

  const selectPalette = useCallback((id: number) => {
    setSelectedId(id);
    gameEvents.emit(EDITOR_EVENTS.SET_PALETTE_ITEM, id);
  }, []);

  const handleExport = useCallback(() => {
    const handler = (data: unknown) => {
      gameEvents.off(EDITOR_EVENTS.EXPORT_REQUEST, handler);
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${levelName || "level"}.json`;
      a.click();
      URL.revokeObjectURL(url);
    };
    gameEvents.on(EDITOR_EVENTS.EXPORT_REQUEST, handler);
    gameEvents.emit(EDITOR_EVENTS.EXPORT_LEVEL);
  }, [levelName]);

  const handleImport = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      const text = await file.text();
      try {
        const data = JSON.parse(text) as LevelData;
        gameEvents.emit(EDITOR_EVENTS.IMPORT_LEVEL, data);
      } catch {
        alert("Arquivo JSON inválido");
      }
    };
    input.click();
  }, []);

  const handleTestPlay = useCallback(() => {
    const handler = (data: unknown) => {
      gameEvents.off(EDITOR_EVENTS.TEST_REQUEST, handler);
      // Navigate to test play — emit the level data to GameScene
      gameEvents.emit("editor:start_test", data);
    };
    gameEvents.on(EDITOR_EVENTS.TEST_REQUEST, handler);
    gameEvents.emit(EDITOR_EVENTS.TEST_PLAY);
  }, []);

  // Group palette items by category
  const categories = PALETTE_ITEMS.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, typeof PALETTE_ITEMS>);

  if (!ready) {
    return (
      <div className="w-64 bg-card border-l border-border p-4 flex items-center justify-center">
        <p className="text-muted-foreground text-sm">Carregando editor...</p>
      </div>
    );
  }

  return (
    <div className="w-64 bg-card border-l border-border flex flex-col overflow-y-auto">
      {/* Level metadata */}
      <div className="p-3 border-b border-border">
        <h3 className="text-xs font-bold text-muted-foreground uppercase mb-2">Nível</h3>
        <input
          type="text"
          value={levelName}
          onChange={(e) => {
            setLevelName(e.target.value);
            gameEvents.emit(EDITOR_EVENTS.SET_LEVEL_META, { name: e.target.value });
          }}
          className="w-full bg-muted border border-border rounded px-2 py-1 text-sm mb-2"
          placeholder="Nome do nível"
        />
        <div className="flex items-center gap-2 mb-2">
          <label className="text-xs text-muted-foreground">Cor:</label>
          <input
            type="color"
            value={bgColor}
            onChange={(e) => {
              setBgColor(e.target.value);
              gameEvents.emit(EDITOR_EVENTS.SET_LEVEL_META, { bgColor: e.target.value });
            }}
            className="w-8 h-6 rounded cursor-pointer"
          />
        </div>
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="text-xs text-muted-foreground">L:</label>
            <input
              type="number"
              value={gridW}
              min={25}
              max={300}
              onChange={(e) => {
                const w = parseInt(e.target.value) || 100;
                setGridW(w);
                gameEvents.emit(EDITOR_EVENTS.RESIZE_LEVEL, { w, h: gridH });
              }}
              className="w-full bg-muted border border-border rounded px-2 py-1 text-xs"
            />
          </div>
          <div className="flex-1">
            <label className="text-xs text-muted-foreground">A:</label>
            <input
              type="number"
              value={gridH}
              min={10}
              max={30}
              onChange={(e) => {
                const h = parseInt(e.target.value) || 15;
                setGridH(h);
                gameEvents.emit(EDITOR_EVENTS.RESIZE_LEVEL, { w: gridW, h });
              }}
              className="w-full bg-muted border border-border rounded px-2 py-1 text-xs"
            />
          </div>
        </div>
      </div>

      {/* Palette */}
      <div className="p-3 border-b border-border flex-1 overflow-y-auto">
        <h3 className="text-xs font-bold text-muted-foreground uppercase mb-2">Paleta</h3>
        {Object.entries(categories).map(([cat, items]) => (
          <div key={cat} className="mb-3">
            <p className="text-xs text-muted-foreground mb-1">{CATEGORY_LABELS[cat] || cat}</p>
            <div className="grid grid-cols-4 gap-1">
              {items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => selectPalette(item.id)}
                  className={`p-1 rounded text-xs truncate border ${
                    selectedId === item.id
                      ? "border-primary bg-primary/20 text-primary"
                      : "border-border hover:border-muted-foreground text-muted-foreground"
                  }`}
                  title={item.name}
                >
                  {item.name.slice(0, 4)}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Troll triggers */}
      <div className="p-3 border-b border-border">
        <h3 className="text-xs font-bold text-muted-foreground uppercase mb-2">
          Trolls ({trolls.length})
        </h3>
        {trolls.map((t, i) => (
          <div key={i} className="text-xs text-muted-foreground flex justify-between mb-1">
            <span>x:{t.triggerX} {t.action}</span>
            <button
              onClick={() => gameEvents.emit(EDITOR_EVENTS.REMOVE_TROLL, i)}
              className="text-red-400 hover:text-red-300"
            >
              ✕
            </button>
          </div>
        ))}
        <button
          onClick={() => {
            gameEvents.emit(EDITOR_EVENTS.ADD_TROLL, {
              triggerX: 320,
              action: "message",
              text: "Cuidado!",
              duration: 90,
              triggered: false,
            } satisfies TrollTrigger);
          }}
          className="w-full text-xs bg-muted rounded px-2 py-1 hover:bg-muted/80 mt-1"
        >
          + Adicionar Troll
        </button>
      </div>

      {/* Actions */}
      <div className="p-3 space-y-2">
        <div className="flex gap-2">
          <button
            onClick={() => gameEvents.emit(EDITOR_EVENTS.UNDO)}
            className="flex-1 text-xs bg-muted rounded px-2 py-1.5 hover:bg-muted/80"
          >
            ↩ Desfazer
          </button>
          <button
            onClick={() => gameEvents.emit(EDITOR_EVENTS.REDO)}
            className="flex-1 text-xs bg-muted rounded px-2 py-1.5 hover:bg-muted/80"
          >
            ↪ Refazer
          </button>
        </div>
        <button
          onClick={handleTestPlay}
          className="w-full text-xs bg-green-700 text-white rounded px-2 py-1.5 hover:bg-green-600"
        >
          ▶ Testar
        </button>
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="flex-1 text-xs bg-blue-700 text-white rounded px-2 py-1.5 hover:bg-blue-600"
          >
            Exportar
          </button>
          <button
            onClick={handleImport}
            className="flex-1 text-xs bg-blue-700 text-white rounded px-2 py-1.5 hover:bg-blue-600"
          >
            Importar
          </button>
        </div>
      </div>
    </div>
  );
}
