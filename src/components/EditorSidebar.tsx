"use client";

import { useState, useEffect, useCallback } from "react";
import { gameEvents } from "@/game/events";
import { EDITOR_EVENTS } from "@/game/scenes/EditorScene";
import { PALETTE_ITEMS } from "@/game/constants";
import { textureCache, PALETTE_TEXTURE_KEY } from "@/game/texture-cache";
import { loadPrefabs, deletePrefab, type Prefab } from "@/lib/prefabs";
import { Layers, Skull, Zap, Users, ChevronDown, Loader2, Flower2, PackagePlus, Trash2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const CATEGORY_META: Record<string, { label: string; Icon: LucideIcon; color: string }> = {
  terrain: { label: "Terreno", Icon: Layers, color: "#4CAF50" },
  danger: { label: "Perigo", Icon: Skull, color: "#F44336" },
  interactive: { label: "Interativo", Icon: Zap, color: "#FF9800" },
  decoration: { label: "Decoração", Icon: Flower2, color: "#AB47BC" },
  entities: { label: "Entidades", Icon: Users, color: "#2196F3" },
};

function CollapsibleSection({
  title,
  Icon,
  color,
  count,
  defaultOpen = true,
  children,
}: {
  title: string;
  Icon: LucideIcon;
  color: string;
  count: number;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="mb-1">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-3 py-1.5 text-xs font-bold uppercase tracking-wider hover:bg-white/5 transition-colors rounded-md group"
        style={{ color }}
      >
        <Icon
          size={14}
          className="group-hover:scale-110 transition-transform duration-200"
        />
        <span>{title}</span>
        <span className="text-[10px] font-normal opacity-50">({count})</span>
        <ChevronDown
          size={12}
          className="ml-auto transition-transform duration-300"
          style={{ transform: open ? "rotate(0deg)" : "rotate(-90deg)" }}
        />
      </button>
      <div
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{ maxHeight: open ? "1000px" : "0px", opacity: open ? 1 : 0 }}
      >
        <div className="px-2 pb-1">{children}</div>
      </div>
    </div>
  );
}

/** Mini tile swatch that shows the actual game texture */
function TileSwatch({
  item,
  selected,
}: {
  item: (typeof PALETTE_ITEMS)[number];
  selected: boolean;
}) {
  const c = item.color;
  const texKey = PALETTE_TEXTURE_KEY[item.id];
  const dataUrl = texKey ? textureCache[texKey] : null;

  return (
    <div
      className={`w-8 h-8 rounded-md shrink-0 transition-all duration-200 relative overflow-hidden ${
        selected ? "scale-110 shadow-md" : "group-hover:scale-105"
      }`}
      style={{
        backgroundColor: c + "33",
        border: `2px solid ${c}88`,
        boxShadow: selected ? `0 0 12px ${c}44` : undefined,
      }}
    >
      {dataUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={dataUrl}
          alt={item.name}
          className="absolute inset-0 w-full h-full object-contain"
          style={{ imageRendering: "pixelated" }}
          draggable={false}
        />
      ) : (
        /* Fallback for eraser (id 0) and invisible block (id 18) */
        <div
          className="absolute inset-[3px] rounded-sm"
          style={{ backgroundColor: c + "aa" }}
        >
          {item.id === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-3 h-px bg-white/50 rotate-45 absolute" />
              <div className="w-3 h-px bg-white/50 -rotate-45 absolute" />
            </div>
          )}
          {item.id === 18 && (
            <div className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-white/40">?</div>
          )}
        </div>
      )}
    </div>
  );
}

function PaletteButton({
  item,
  selected,
  onSelect,
}: {
  item: (typeof PALETTE_ITEMS)[number];
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-all duration-200 group ${
        selected
          ? "bg-primary/20 ring-1 ring-primary/50 shadow-lg shadow-primary/10 animate-pop-in"
          : "hover:bg-white/5 active:scale-[0.97]"
      }`}
    >
      <TileSwatch item={item} selected={selected} />

      <div className="min-w-0 flex-1">
        <p
          className={`text-xs font-medium truncate transition-colors ${
            selected ? "text-primary" : "text-foreground/80"
          }`}
        >
          {item.name}
        </p>
        <p className="text-[10px] text-muted-foreground/60 truncate leading-tight">
          {item.description}
        </p>
      </div>

      {selected && <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shrink-0" />}
    </button>
  );
}

export function EditorSidebar() {
  const [selectedId, setSelectedId] = useState(1);
  const [ready, setReady] = useState(false);
  const [prefabs, setPrefabs] = useState<Prefab[]>([]);

  useEffect(() => {
    const onReady = () => {
      setReady(true);
      setPrefabs(loadPrefabs());
    };
    gameEvents.on(EDITOR_EVENTS.READY, onReady);
    return () => {
      gameEvents.off(EDITOR_EVENTS.READY, onReady);
    };
  }, []);

  const selectPalette = useCallback((id: number) => {
    setSelectedId(id);
    gameEvents.emit(EDITOR_EVENTS.SET_PALETTE_ITEM, id);
  }, []);

  const categories = PALETTE_ITEMS.reduce(
    (acc, item) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
      return acc;
    },
    {} as Record<string, typeof PALETTE_ITEMS>,
  );

  if (!ready) {
    return (
      <div className="w-72 bg-[#0d0d14] border-l border-border/30 flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={24} className="mx-auto mb-3 animate-spin text-primary" />
          <p className="text-muted-foreground text-sm animate-pulse">Preparando editor...</p>
        </div>
      </div>
    );
  }

  const selectedItem = PALETTE_ITEMS.find((p) => p.id === selectedId);

  return (
    <div className="w-72 bg-gradient-to-b from-[#0d0d14] to-[#0a0a10] border-l border-border/30 flex flex-col overflow-hidden">
      {/* Selected tool header */}
      {selectedItem && (
        <div key={selectedItem.id} className="px-3 py-2.5 border-b border-border/20 bg-white/[0.02] shrink-0 animate-slide-up">
          <div className="flex items-center gap-3">
            <TileSwatch item={selectedItem} selected />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-primary truncate">{selectedItem.name}</p>
              <p className="text-[10px] text-muted-foreground/70 leading-tight">
                {selectedItem.description}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Palette label */}
      <div className="px-3 py-2 border-b border-border/20 shrink-0">
        <p className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest">
          Paleta de blocos
        </p>
      </div>

      {/* Scrollable palette list */}
      <div className="flex-1 overflow-y-auto min-h-0 py-1">
        {Object.entries(categories).map(([cat, items]) => {
          const meta = CATEGORY_META[cat] || { label: cat, Icon: Layers, color: "#888" };
          return (
            <CollapsibleSection
              key={cat}
              title={meta.label}
              Icon={meta.Icon}
              color={meta.color}
              count={items.length}
            >
              <div className="space-y-0.5">
                {items.map((item) => (
                  <PaletteButton
                    key={item.id}
                    item={item}
                    selected={selectedId === item.id}
                    onSelect={() => selectPalette(item.id)}
                  />
                ))}
              </div>
            </CollapsibleSection>
          );
        })}

        {/* Prefabs section */}
        <CollapsibleSection
          title="Prefabs"
          Icon={PackagePlus}
          color="#10B981"
          count={prefabs.length}
          defaultOpen={false}
        >
          <div className="space-y-1">
            {prefabs.map((prefab) => (
              <div
                key={prefab.id}
                className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/5 group"
              >
                <button
                  onClick={() => {
                    gameEvents.emit(EDITOR_EVENTS.PASTE_PREFAB, {
                      tiles: prefab.tiles,
                      width: prefab.width,
                      height: prefab.height,
                    });
                  }}
                  className="flex-1 text-left min-w-0"
                >
                  <p className="text-xs font-medium truncate text-foreground/80">{prefab.name}</p>
                  <p className="text-[10px] text-muted-foreground/60">{prefab.width}×{prefab.height}</p>
                </button>
                {!prefab.id.startsWith("prefab_") && (
                  <button
                    onClick={() => {
                      deletePrefab(prefab.id);
                      setPrefabs(loadPrefabs());
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:text-red-400"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            ))}
            {prefabs.length === 0 && (
              <p className="text-[10px] text-muted-foreground/50 px-2 py-2">
                Nenhum prefab salvo
              </p>
            )}
          </div>
        </CollapsibleSection>
      </div>
    </div>
  );
}

