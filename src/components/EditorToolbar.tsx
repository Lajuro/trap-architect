"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { gameEvents, GAME_EVENTS } from "@/game/events";
import { EDITOR_EVENTS } from "@/game/scenes/EditorScene";
import type { LevelData, TrollTrigger } from "@/game/types";
import { generateThumbnail } from "@/lib/thumbnail";
import { RankUpToast, useRankUpToast } from "@/components/RankUpToast";
import {
  Undo2,
  Redo2,
  Play,
  Download,
  Upload,
  Rocket,
  Settings,
  X,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Music,
  Palette,
  Ruler,
  Keyboard,
  Lock,
  Loader2,
} from "lucide-react";

export function EditorToolbar() {
  const [levelName, setLevelName] = useState("Meu Nivel");
  const [bgColor, setBgColor] = useState("#5c94fc");
  const [music, setMusic] = useState("easy");
  const [gridW, setGridW] = useState(100);
  const [gridH, setGridH] = useState(15);
  const [trolls, setTrolls] = useState<TrollTrigger[]>([]);
  const [ready, setReady] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishMsg, setPublishMsg] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [tested, setTested] = useState(false);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [configOpen, setConfigOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const { rankUp, checkRankUp, dismiss } = useRankUpToast();
  const configRef = useRef<HTMLDivElement>(null);
  const shortcutsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsLoggedIn(!!user);
    });
  }, []);

  useEffect(() => {
    const onReady = () => setReady(true);
    const onDataChanged = (data: unknown) => {
      const d = data as LevelData;
      setLevelName(d.name);
      setBgColor(d.bgColor);
      setMusic(d.music || "easy");
      setGridW(d.gridW);
      setGridH(d.gridH);
      setTrolls(d.trolls);
      setTested(false);
    };
    const onTestComplete = () => setTested(true);
    const onValidation = (w: unknown) => setWarnings(w as string[]);

    gameEvents.on(EDITOR_EVENTS.READY, onReady);
    gameEvents.on(EDITOR_EVENTS.LEVEL_DATA_CHANGED, onDataChanged);
    gameEvents.on(GAME_EVENTS.LEVEL_COMPLETE, onTestComplete);
    gameEvents.on(EDITOR_EVENTS.VALIDATION, onValidation);

    return () => {
      gameEvents.off(EDITOR_EVENTS.READY, onReady);
      gameEvents.off(EDITOR_EVENTS.LEVEL_DATA_CHANGED, onDataChanged);
      gameEvents.off(GAME_EVENTS.LEVEL_COMPLETE, onTestComplete);
      gameEvents.off(EDITOR_EVENTS.VALIDATION, onValidation);
    };
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (configRef.current && !configRef.current.contains(e.target as Node)) {
        setConfigOpen(false);
      }
      if (shortcutsRef.current && !shortcutsRef.current.contains(e.target as Node)) {
        setShortcutsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
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
        alert("Arquivo JSON invalido");
      }
    };
    input.click();
  }, []);

  const handlePublish = useCallback(() => {
    setPublishMsg(null);
    const handler = async (data: unknown) => {
      gameEvents.off(EDITOR_EVENTS.EXPORT_REQUEST, handler);
      setPublishing(true);
      try {
        const levelData = data as LevelData;
        const thumbnail = generateThumbnail(
          levelData.tiles,
          levelData.gridW,
          levelData.gridH,
          levelData.entities,
          levelData.playerStart,
          levelData.bgColor,
        );
        const res = await fetch("/api/levels", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: levelData.name,
            bgColor: levelData.bgColor,
            gridW: levelData.gridW,
            gridH: levelData.gridH,
            tiles: levelData.tiles,
            entities: levelData.entities,
            trolls: levelData.trolls,
            playerStart: levelData.playerStart,
            published: true,
            thumbnail,
          }),
        });
        if (res.ok) {
          const { rankUp: ru } = await res.json();
          setPublishMsg("Nivel publicado com sucesso!");
          if (ru) checkRankUp(ru.oldRank, ru.newRank);
        } else if (res.status === 401) {
          setPublishMsg("Faca login para publicar.");
        } else {
          const { error } = await res.json();
          setPublishMsg(error || "Erro ao publicar.");
        }
      } catch {
        setPublishMsg("Erro de conexao.");
      }
      setPublishing(false);
    };
    gameEvents.on(EDITOR_EVENTS.EXPORT_REQUEST, handler);
    gameEvents.emit(EDITOR_EVENTS.EXPORT_LEVEL);
  }, [checkRankUp]);

  const handleTestPlay = useCallback(() => {
    const handler = (data: unknown) => {
      gameEvents.off(EDITOR_EVENTS.TEST_REQUEST, handler);
      gameEvents.emit("editor:start_test", data);
    };
    gameEvents.on(EDITOR_EVENTS.TEST_REQUEST, handler);
    gameEvents.emit(EDITOR_EVENTS.TEST_PLAY);
  }, []);

  if (!ready) return null;

  return (
    <>
      <div className="flex-1 flex items-center justify-between min-w-0">
        {/* Left: action buttons */}
        <div className="flex items-center gap-1">
        {/* Divider */}
        <div className="w-px h-5 bg-border/30 mx-1" />

        {/* Undo / Redo */}
        <ToolbarButton
          icon={Undo2}
          label="Desfazer"
          shortcut="Ctrl+Z"
          onClick={() => gameEvents.emit(EDITOR_EVENTS.UNDO)}
        />
        <ToolbarButton
          icon={Redo2}
          label="Refazer"
          shortcut="Ctrl+Y"
          onClick={() => gameEvents.emit(EDITOR_EVENTS.REDO)}
        />

        <div className="w-px h-5 bg-border/30 mx-1" />

        {/* Test Play */}
        <ToolbarButton
          icon={Play}
          label="Testar"
          shortcut="T"
          onClick={handleTestPlay}
          variant="success"
        />

        <div className="w-px h-5 bg-border/30 mx-1" />

        {/* Export / Import */}
        <ToolbarButton icon={Download} label="Exportar" onClick={handleExport} />
        <ToolbarButton icon={Upload} label="Importar" onClick={handleImport} />

        <div className="w-px h-5 bg-border/30 mx-1" />

        {/* Publish */}
        {isLoggedIn ? (
          <ToolbarButton
            icon={publishing ? Loader2 : Rocket}
            label={publishing ? "Publicando..." : "Publicar"}
            onClick={handlePublish}
            disabled={publishing || !tested}
            variant="publish"
            iconClassName={publishing ? "animate-spin" : undefined}
          />
        ) : (
          <ToolbarButton icon={Lock} label="Login para publicar" onClick={() => { window.location.href = "/login"; }} />
        )}

        {/* Test status indicator */}
        <div className="flex items-center gap-1 ml-1" title={tested ? "Nivel testado" : "Nivel nao testado — necessario para publicar"}>
          {tested ? (
            <CheckCircle size={14} className="text-green-500" />
          ) : (
            <XCircle size={14} className="text-red-400/60" />
          )}
        </div>

        {/* Warnings badge */}
        {warnings.length > 0 && (
          <div className="flex items-center gap-1 ml-1 text-yellow-400" title={warnings.join("\n")}>
            <AlertTriangle size={14} />
            <span className="text-[10px] font-medium">{warnings.length}</span>
          </div>
        )}

        {/* Publish message */}
        {publishMsg && (
          <span className={`text-[10px] ml-2 animate-pop-in ${
            publishMsg.includes("sucesso") ? "text-green-400" : "text-muted-foreground/60"
          }`}>
            {publishMsg}
          </span>
        )}
      </div>

        {/* Right side: Config + Shortcuts */}
        <div className="flex items-center gap-1 shrink-0">
        {/* Shortcuts */}
        <div ref={shortcutsRef} className="relative">
          <ToolbarButton
            icon={Keyboard}
            label="Atalhos"
            onClick={() => {
              setShortcutsOpen(!shortcutsOpen);
              setConfigOpen(false);
            }}
            active={shortcutsOpen}
          />
          {shortcutsOpen && (
            <div className="absolute right-0 top-full mt-1 w-64 bg-[#12121a] border border-border/30 rounded-lg shadow-2xl p-3 z-50 animate-slide-up">
              <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider mb-2">
                Atalhos do teclado
              </p>
              <div className="space-y-1.5 text-[10px] text-muted-foreground/60">
                <ShortcutRow keys="WASD / Setas" desc="Mover camera" />
                <ShortcutRow keys="Scroll" desc="Percorrer nivel" />
                <ShortcutRow keys="Ctrl+Scroll" desc="Zoom" />
                <ShortcutRow keys="Shift+Scroll" desc="Scroll vertical" />
                <ShortcutRow keys="Ctrl+Z" desc="Desfazer" />
                <ShortcutRow keys="Ctrl+Y" desc="Refazer" />
                <ShortcutRow keys="G" desc="Grade" />
                <ShortcutRow keys="T" desc="Testar" />
                <ShortcutRow keys="Tab" desc="Trocar categoria" />
                <ShortcutRow keys="0-9" desc="Selecao rapida" />
              </div>
            </div>
          )}
        </div>

        {/* Config gear */}
        <div ref={configRef} className="relative">
          <ToolbarButton
            icon={Settings}
            label="Configuracoes"
            onClick={() => {
              setConfigOpen(!configOpen);
              setShortcutsOpen(false);
            }}
            active={configOpen}
          />
          {configOpen && (
            <div className="absolute right-0 top-full mt-1 w-80 bg-[#12121a] border border-border/30 rounded-lg shadow-2xl p-4 z-50 animate-slide-up">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold text-foreground/80">Configuracoes do Nivel</p>
                <button onClick={() => setConfigOpen(false)} className="text-muted-foreground/40 hover:text-muted-foreground transition-colors">
                  <X size={14} />
                </button>
              </div>

              <div className="space-y-3">
                {/* Level Name */}
                <div>
                  <label className="text-[10px] font-medium text-muted-foreground/50 uppercase tracking-wider mb-1 block">
                    Nome
                  </label>
                  <input
                    type="text"
                    value={levelName}
                    onChange={(e) => {
                      setLevelName(e.target.value);
                      gameEvents.emit(EDITOR_EVENTS.SET_LEVEL_META, { name: e.target.value });
                    }}
                    className="w-full bg-white/5 border border-border/30 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-muted-foreground/30"
                    placeholder="Nome do nivel"
                  />
                </div>

                {/* Color + Music */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-medium text-muted-foreground/50 uppercase tracking-wider mb-1 flex items-center gap-1 ">
                      <Palette size={10} /> Cor de fundo
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={bgColor}
                        onChange={(e) => {
                          setBgColor(e.target.value);
                          gameEvents.emit(EDITOR_EVENTS.SET_LEVEL_META, { bgColor: e.target.value });
                        }}
                        className="w-8 h-7 rounded cursor-pointer border border-border/30"
                      />
                      <span className="text-[10px] text-muted-foreground/40 font-mono">{bgColor}</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-medium text-muted-foreground/50 uppercase tracking-wider mb-1 flex items-center gap-1">
                      <Music size={10} /> Musica
                    </label>
                    <select
                      value={music}
                      onChange={(e) => {
                        setMusic(e.target.value);
                        gameEvents.emit(EDITOR_EVENTS.SET_LEVEL_META, { music: e.target.value });
                      }}
                      className="w-full bg-white/5 border border-border/30 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary/50"
                    >
                      <option value="easy">Calmo</option>
                      <option value="medium">Padrao</option>
                      <option value="hard">Intenso</option>
                      <option value="none">Nenhuma</option>
                    </select>
                  </div>
                </div>

                {/* Grid Size */}
                <div>
                  <label className="text-[10px] font-medium text-muted-foreground/50 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Ruler size={10} /> Tamanho
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-muted-foreground/40 mb-0.5 block">Largura</label>
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
                        className="w-full bg-white/5 border border-border/30 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary/50"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground/40 mb-0.5 block">Altura</label>
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
                        className="w-full bg-white/5 border border-border/30 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary/50"
                      />
                    </div>
                  </div>
                  <p className="text-[9px] text-muted-foreground/30 mt-1">
                    {gridW * gridH} tiles ({gridW} x {gridH})
                  </p>
                </div>

                {/* Troll Triggers */}
                <div className="border-t border-border/20 pt-3">
                  <label className="text-[10px] font-medium text-muted-foreground/50 uppercase tracking-wider mb-1.5 block">
                    Trolls ({trolls.length})
                  </label>
                  {trolls.length > 0 && (
                    <div className="space-y-1 mb-2 max-h-32 overflow-y-auto">
                      {trolls.map((t, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between bg-white/[0.03] rounded px-2 py-1 text-[10px] group"
                        >
                          <span className="text-muted-foreground">
                            <span className="text-purple-400">x:{t.triggerX}</span>{" "}
                            <span className="text-muted-foreground/50">{t.action}</span>
                          </span>
                          <button
                            onClick={() => gameEvents.emit(EDITOR_EVENTS.REMOVE_TROLL, i)}
                            className="text-red-400/50 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 size={10} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
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
                    className="w-full flex items-center justify-center gap-1 text-[10px] bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-lg px-2 py-1.5 hover:bg-purple-500/20 transition-all"
                  >
                    <Plus size={10} /> Adicionar Troll
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      </div>

      {rankUp && <RankUpToast rankUp={rankUp} onDismiss={dismiss} />}
    </>
  );
}

/** Reusable toolbar button */
function ToolbarButton({
  icon: Icon,
  label,
  shortcut,
  onClick,
  disabled,
  variant,
  active,
  iconClassName,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  shortcut?: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: "success" | "publish";
  active?: boolean;
  iconClassName?: string;
}) {
  const variantClasses = {
    success: "text-green-400 hover:text-green-300 hover:bg-green-500/10",
    publish: "text-purple-400 hover:text-purple-300 hover:bg-purple-500/10",
  };
  const base = variant
    ? variantClasses[variant]
    : "text-muted-foreground/60 hover:text-muted-foreground hover:bg-white/5";

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={shortcut ? `${label} (${shortcut})` : label}
      className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md text-[11px] font-medium transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed ${base} ${
        active ? "bg-white/5 text-foreground/80" : ""
      }`}
    >
      <Icon size={14} className={iconClassName} />
      <span className="hidden xl:inline">{label}</span>
    </button>
  );
}

/** Shortcut display row */
function ShortcutRow({ keys, desc }: { keys: string; desc: string }) {
  return (
    <div className="flex items-center justify-between">
      <kbd className="font-mono bg-white/10 px-1.5 py-0.5 rounded text-[9px] text-muted-foreground/70">
        {keys}
      </kbd>
      <span>{desc}</span>
    </div>
  );
}
