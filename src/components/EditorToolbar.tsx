"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { gameEvents, GAME_EVENTS } from "@/game/events";
import { EDITOR_EVENTS } from "@/game/scenes/EditorScene";
import type { LevelData, TrollTrigger, LevelTag, LevelTheme } from "@/game/types";
import { LEVEL_TAGS, TAG_CONFIG, LEVEL_THEMES } from "@/game/types";
import { THEME_PALETTES } from "@/game/constants";
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
  Lock,
  Loader2,
  Save,
  Tag,
  Paintbrush,
  Layers,
  Copy,
  Clipboard,
  Scissors,
  PaintBucket,
  Minus,
  Square,
  Pipette,
  Search,
  ChevronDown,
} from "lucide-react";
import type { EditorTool } from "@/game/constants";

export function EditorToolbar() {
  const [levelName, setLevelName] = useState("Meu Nivel");
  const [bgColor, setBgColor] = useState("#5c94fc");
  const [music, setMusic] = useState("easy");
  const [gridW, setGridW] = useState(100);
  const [gridH, setGridH] = useState(15);
  const [trolls, setTrolls] = useState<TrollTrigger[]>([]);
  const [ready, setReady] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [publishMsg, setPublishMsg] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [tested, setTested] = useState(false);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [configOpen, setConfigOpen] = useState(false);
  const [selectedTags, setSelectedTags] = useState<LevelTag[]>([]);
  const [theme, setTheme] = useState<LevelTheme>("default");
  const [activeLayer, setActiveLayer] = useState<"foreground" | "background">("foreground");
  const [currentTool, setCurrentTool] = useState<EditorTool>("paint");
  const [brushSize, setBrushSize] = useState(1);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [fileMenuOpen, setFileMenuOpen] = useState(false);
  const [editMenuOpen, setEditMenuOpen] = useState(false);
  const { rankUp, checkRankUp, dismiss } = useRankUpToast();
  const configRef = useRef<HTMLDivElement>(null);
  const fileMenuRef = useRef<HTMLDivElement>(null);
  const editMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsLoggedIn(!!user);
    });
  }, []);

  useEffect(() => {
    const onReady = () => setReady(true);
    const onDataChanged = (data: unknown, userEdit?: unknown) => {
      const d = data as LevelData;
      setLevelName(d.name);
      setBgColor(d.bgColor);
      setMusic(d.music || "easy");
      setGridW(d.gridW);
      setGridH(d.gridH);
      setTrolls(d.trolls);
      if (d.tags) setSelectedTags(d.tags);
      if (d.theme) setTheme(d.theme);
      if (userEdit) setTested(false);
    };
    const onTestComplete = () => setTested(true);
    const onValidation = (w: unknown) => setWarnings(w as string[]);

    gameEvents.on(EDITOR_EVENTS.READY, onReady);
    gameEvents.on(EDITOR_EVENTS.LEVEL_DATA_CHANGED, onDataChanged);
    gameEvents.on(GAME_EVENTS.LEVEL_COMPLETE, onTestComplete);
    gameEvents.on(EDITOR_EVENTS.VALIDATION, onValidation);

    const onSelectionChanged = (info: unknown) => {
      const s = info as { tool?: EditorTool; brushSize?: number };
      if (s.tool) setCurrentTool(s.tool);
      if (s.brushSize !== undefined) setBrushSize(s.brushSize);
    };
    gameEvents.on(EDITOR_EVENTS.SELECTION_CHANGED, onSelectionChanged);

    return () => {
      gameEvents.off(EDITOR_EVENTS.READY, onReady);
      gameEvents.off(EDITOR_EVENTS.LEVEL_DATA_CHANGED, onDataChanged);
      gameEvents.off(GAME_EVENTS.LEVEL_COMPLETE, onTestComplete);
      gameEvents.off(EDITOR_EVENTS.VALIDATION, onValidation);
      gameEvents.off(EDITOR_EVENTS.SELECTION_CHANGED, onSelectionChanged);
    };
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (configRef.current && !configRef.current.contains(e.target as Node)) {
        setConfigOpen(false);
      }
      if (fileMenuRef.current && !fileMenuRef.current.contains(e.target as Node)) {
        setFileMenuOpen(false);
      }
      if (editMenuRef.current && !editMenuRef.current.contains(e.target as Node)) {
        setEditMenuOpen(false);
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
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
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
      let data: LevelData;
      try {
        data = JSON.parse(text) as LevelData;
      } catch {
        alert("Arquivo JSON invalido — nao foi possivel ler o arquivo.");
        return;
      }
      if (!data.tiles || !data.gridW || !data.gridH || !data.name) {
        alert("Formato invalido — o arquivo nao contem dados de nivel validos.");
        return;
      }
      try {
        gameEvents.emit(EDITOR_EVENTS.IMPORT_LEVEL, data);
      } catch (err) {
        console.error("Erro ao importar nivel:", err);
        alert("Erro ao importar o nivel no editor.");
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
            music: levelData.music,
            gridW: levelData.gridW,
            gridH: levelData.gridH,
            tiles: levelData.tiles,
            backgroundTiles: levelData.backgroundTiles,
            entities: levelData.entities,
            trolls: levelData.trolls,
            playerStart: levelData.playerStart,
            published: true,
            thumbnail,
            tags: selectedTags,
            theme,
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
  }, [checkRankUp, selectedTags, theme]);

  const handleSaveDraft = useCallback(() => {
    setPublishMsg(null);
    const handler = async (data: unknown) => {
      gameEvents.off(EDITOR_EVENTS.EXPORT_REQUEST, handler);
      setSaving(true);
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
            music: levelData.music,
            gridW: levelData.gridW,
            gridH: levelData.gridH,
            tiles: levelData.tiles,
            backgroundTiles: levelData.backgroundTiles,
            entities: levelData.entities,
            trolls: levelData.trolls,
            playerStart: levelData.playerStart,
            published: false,
            thumbnail,
            tags: selectedTags,
            theme,
          }),
        });
        if (res.ok) {
          setPublishMsg("Rascunho salvo com sucesso!");
        } else if (res.status === 401) {
          setPublishMsg("Faca login para salvar.");
        } else {
          const { error } = await res.json();
          setPublishMsg(error || "Erro ao salvar rascunho.");
        }
      } catch {
        setPublishMsg("Erro de conexao.");
      }
      setSaving(false);
    };
    gameEvents.on(EDITOR_EVENTS.EXPORT_REQUEST, handler);
    gameEvents.emit(EDITOR_EVENTS.EXPORT_LEVEL);
  }, []);

  const handleTestPlay = useCallback(() => {
    const handler = (data: unknown) => {
      gameEvents.off(EDITOR_EVENTS.TEST_REQUEST, handler);
      gameEvents.emit("editor:start_test", data);
    };
    gameEvents.on(EDITOR_EVENTS.TEST_REQUEST, handler);
    gameEvents.emit(EDITOR_EVENTS.TEST_PLAY);
  }, []);

  // Global keyboard shortcuts
  useEffect(() => {
    function handleGlobalKeys(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.ctrlKey || e.metaKey) {
        if (e.key === "s" || e.key === "S") {
          e.preventDefault();
          handleSaveDraft();
        }
        if (e.key === "e" || e.key === "E") {
          e.preventDefault();
          handleExport();
        }
        if (e.key === "k" || e.key === "K") {
          e.preventDefault();
          setCommandPaletteOpen((prev) => !prev);
        }
      }
    }
    document.addEventListener("keydown", handleGlobalKeys);
    return () => document.removeEventListener("keydown", handleGlobalKeys);
  }, [handleSaveDraft, handleExport]);

  if (!ready) return null;

  const closeAllMenus = () => {
    setFileMenuOpen(false);
    setEditMenuOpen(false);
    setConfigOpen(false);
  };

  const allCommands: CommandDef[] = [
    { id: "save", group: "Arquivo", label: "Salvar rascunho", shortcut: "Ctrl+S", icon: Save, action: handleSaveDraft },
    { id: "publish", group: "Arquivo", label: "Publicar nivel", shortcut: "Ctrl+Shift+P", icon: Rocket, action: handlePublish },
    { id: "export", group: "Arquivo", label: "Exportar JSON", shortcut: "Ctrl+E", icon: Download, action: handleExport },
    { id: "import", group: "Arquivo", label: "Importar JSON", icon: Upload, action: handleImport },
    { id: "undo", group: "Editar", label: "Desfazer", shortcut: "Ctrl+Z", icon: Undo2, action: () => gameEvents.emit(EDITOR_EVENTS.UNDO) },
    { id: "redo", group: "Editar", label: "Refazer", shortcut: "Ctrl+Y", icon: Redo2, action: () => gameEvents.emit(EDITOR_EVENTS.REDO) },
    { id: "copy", group: "Editar", label: "Copiar selecao", shortcut: "Ctrl+C", icon: Copy, action: () => gameEvents.emit(EDITOR_EVENTS.COPY) },
    { id: "cut", group: "Editar", label: "Recortar selecao", shortcut: "Ctrl+X", icon: Scissors, action: () => gameEvents.emit(EDITOR_EVENTS.CUT) },
    { id: "paste", group: "Editar", label: "Colar", shortcut: "Ctrl+V", icon: Clipboard, action: () => gameEvents.emit(EDITOR_EVENTS.PASTE) },
    { id: "paint", group: "Ferramenta", label: "Pincel", shortcut: "B", icon: Paintbrush, action: () => gameEvents.emit(EDITOR_EVENTS.SET_TOOL, "paint") },
    { id: "fill", group: "Ferramenta", label: "Preencher", shortcut: "F", icon: PaintBucket, action: () => gameEvents.emit(EDITOR_EVENTS.SET_TOOL, "fill") },
    { id: "line", group: "Ferramenta", label: "Linha", shortcut: "I", icon: Minus, action: () => gameEvents.emit(EDITOR_EVENTS.SET_TOOL, "line") },
    { id: "rect", group: "Ferramenta", label: "Retangulo", shortcut: "R", icon: Square, action: () => gameEvents.emit(EDITOR_EVENTS.SET_TOOL, "rect") },
    { id: "eyedropper", group: "Ferramenta", label: "Conta-gotas", shortcut: "P", icon: Pipette, action: () => gameEvents.emit(EDITOR_EVENTS.SET_TOOL, "eyedropper") },
    { id: "layer", group: "Visualizar", label: "Alternar camada (FG/BG)", shortcut: "L", icon: Layers, action: () => {
      const next = activeLayer === "foreground" ? "background" : "foreground";
      setActiveLayer(next);
      gameEvents.emit(EDITOR_EVENTS.SET_LAYER, next);
    }},
    { id: "test", group: "Acao", label: "Testar nivel", shortcut: "T", icon: Play, action: handleTestPlay },
    { id: "config", group: "Acao", label: "Configuracoes do nivel", icon: Settings, action: () => { closeAllMenus(); setConfigOpen(true); } },
  ];

  return (
    <>
      <div className="flex-1 flex items-center min-w-0">
        {/* Left: core tools */}
        <div className="flex items-center gap-0.5">
          {/* Undo / Redo */}
          <ToolbarIconBtn
            icon={Undo2}
            tooltip="Desfazer"
            shortcut="Ctrl+Z"
            onClick={() => gameEvents.emit(EDITOR_EVENTS.UNDO)}
          />
          <ToolbarIconBtn
            icon={Redo2}
            tooltip="Refazer"
            shortcut="Ctrl+Y"
            onClick={() => gameEvents.emit(EDITOR_EVENTS.REDO)}
          />

          <div className="w-px h-5 bg-border/30 mx-1" />

          {/* Dropdown menus */}
          <div ref={fileMenuRef} className="relative">
            <button
              onClick={() => { setFileMenuOpen(!fileMenuOpen); setEditMenuOpen(false); setConfigOpen(false); }}
              className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-all ${
                fileMenuOpen ? "bg-white/10 text-foreground" : "text-muted-foreground/60 hover:text-muted-foreground hover:bg-white/5"
              }`}
            >
              Arquivo <ChevronDown size={10} className={`transition-transform duration-200 ${fileMenuOpen ? "rotate-180" : ""}`} />
            </button>
            {fileMenuOpen && (
              <div className="absolute left-0 top-full mt-1 w-56 bg-[#12121a] border border-border/30 rounded-lg shadow-2xl py-1 z-50 animate-slide-up">
                <DropdownItem icon={saving ? Loader2 : Save} label={saving ? "Salvando..." : "Salvar rascunho"} shortcut="Ctrl+S" onClick={() => { handleSaveDraft(); setFileMenuOpen(false); }} disabled={saving || publishing || !isLoggedIn} iconClassName={saving ? "animate-spin" : undefined} />
                <DropdownItem icon={publishing ? Loader2 : Rocket} label={publishing ? "Publicando..." : "Publicar"} shortcut="Ctrl+Shift+P" onClick={() => { handlePublish(); setFileMenuOpen(false); }} disabled={publishing || saving || !tested || !isLoggedIn} iconClassName={publishing ? "animate-spin" : undefined} />
                <div className="border-t border-border/20 my-1 mx-2" />
                <DropdownItem icon={Download} label="Exportar JSON" shortcut="Ctrl+E" onClick={() => { handleExport(); setFileMenuOpen(false); }} />
                <DropdownItem icon={Upload} label="Importar JSON" onClick={() => { handleImport(); setFileMenuOpen(false); }} />
                {!isLoggedIn && (
                  <>
                    <div className="border-t border-border/20 my-1 mx-2" />
                    <DropdownItem icon={Lock} label="Login para publicar" onClick={() => { window.location.href = "/login"; }} />
                  </>
                )}
              </div>
            )}
          </div>

          <div ref={editMenuRef} className="relative">
            <button
              onClick={() => { setEditMenuOpen(!editMenuOpen); setFileMenuOpen(false); setConfigOpen(false); }}
              className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-all ${
                editMenuOpen ? "bg-white/10 text-foreground" : "text-muted-foreground/60 hover:text-muted-foreground hover:bg-white/5"
              }`}
            >
              Editar <ChevronDown size={10} className={`transition-transform duration-200 ${editMenuOpen ? "rotate-180" : ""}`} />
            </button>
            {editMenuOpen && (
              <div className="absolute left-0 top-full mt-1 w-52 bg-[#12121a] border border-border/30 rounded-lg shadow-2xl py-1 z-50 animate-slide-up">
                <DropdownItem icon={Undo2} label="Desfazer" shortcut="Ctrl+Z" onClick={() => { gameEvents.emit(EDITOR_EVENTS.UNDO); setEditMenuOpen(false); }} />
                <DropdownItem icon={Redo2} label="Refazer" shortcut="Ctrl+Y" onClick={() => { gameEvents.emit(EDITOR_EVENTS.REDO); setEditMenuOpen(false); }} />
                <div className="border-t border-border/20 my-1 mx-2" />
                <DropdownItem icon={Copy} label="Copiar" shortcut="Ctrl+C" onClick={() => { gameEvents.emit(EDITOR_EVENTS.COPY); setEditMenuOpen(false); }} />
                <DropdownItem icon={Scissors} label="Recortar" shortcut="Ctrl+X" onClick={() => { gameEvents.emit(EDITOR_EVENTS.CUT); setEditMenuOpen(false); }} />
                <DropdownItem icon={Clipboard} label="Colar" shortcut="Ctrl+V" onClick={() => { gameEvents.emit(EDITOR_EVENTS.PASTE); setEditMenuOpen(false); }} />
              </div>
            )}
          </div>

          <div className="w-px h-5 bg-border/30 mx-1" />

          {/* Drawing tools */}
          {([
            { tool: "paint" as EditorTool, icon: Paintbrush, label: "Pincel", shortcut: "B" },
            { tool: "fill" as EditorTool, icon: PaintBucket, label: "Preencher", shortcut: "F" },
            { tool: "line" as EditorTool, icon: Minus, label: "Linha", shortcut: "I" },
            { tool: "rect" as EditorTool, icon: Square, label: "Retangulo", shortcut: "R" },
            { tool: "eyedropper" as EditorTool, icon: Pipette, label: "Conta-gotas", shortcut: "P" },
          ]).map(({ tool, icon, label, shortcut }) => (
            <ToolbarIconBtn
              key={tool}
              icon={icon}
              tooltip={label}
              shortcut={shortcut}
              onClick={() => gameEvents.emit(EDITOR_EVENTS.SET_TOOL, tool)}
              active={currentTool === tool}
            />
          ))}

          {/* Brush size */}
          {(currentTool === "paint" || currentTool === "line") && (
            <div className="flex items-center gap-0.5 ml-0.5">
              {[1, 2, 3].map((s) => (
                <button
                  key={s}
                  onClick={() => gameEvents.emit(EDITOR_EVENTS.SET_BRUSH_SIZE, s)}
                  className={`w-5 h-5 rounded text-[9px] font-bold transition-all ${
                    brushSize === s
                      ? "bg-primary/20 text-primary border border-primary/50"
                      : "text-muted-foreground/40 hover:text-muted-foreground/60 border border-transparent"
                  }`}
                  title={`Tamanho ${s} ([ / ])`}
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          <div className="w-px h-5 bg-border/30 mx-1" />

          {/* Layer toggle */}
          <button
            onClick={() => {
              const next = activeLayer === "foreground" ? "background" : "foreground";
              setActiveLayer(next);
              gameEvents.emit(EDITOR_EVENTS.SET_LAYER, next);
            }}
            className={`flex items-center gap-1 px-2 py-1 rounded text-[9px] border transition-all ${
              activeLayer === "background"
                ? "border-purple-500 bg-purple-500/10 text-purple-400"
                : "border-border/30 text-muted-foreground/60 hover:border-primary/30"
            }`}
            title="Alternar camada (L)"
          >
            <Layers size={12} />
            {activeLayer === "foreground" ? "FG" : "BG"}
          </button>
        </div>

        {/* Center spacer + status messages */}
        <div className="flex-1 min-w-0 flex justify-center">
          {publishMsg && (
            <span className={`text-[10px] animate-pop-in ${
              publishMsg.includes("sucesso") ? "text-green-400" : "text-muted-foreground/60"
            }`}>
              {publishMsg}
            </span>
          )}
        </div>

        {/* Right: status + actions */}
        <div className="flex items-center gap-0.5 shrink-0">
          {/* Warnings */}
          {warnings.length > 0 && (
            <div className="flex items-center gap-1 px-1.5 text-yellow-400" title={warnings.join("\n")}>
              <AlertTriangle size={13} />
              <span className="text-[10px] font-medium">{warnings.length}</span>
            </div>
          )}

          {/* Tested badge */}
          <div
            className="flex items-center px-1"
            title={tested ? "Nivel testado — pronto para publicar" : "Teste o nivel antes de publicar"}
          >
            {tested ? (
              <CheckCircle size={13} className="text-green-500" />
            ) : (
              <XCircle size={13} className="text-red-400/50" />
            )}
          </div>

          <div className="w-px h-5 bg-border/30 mx-0.5" />

          {/* Test Play */}
          <ToolbarIconBtn
            icon={Play}
            tooltip="Testar"
            shortcut="T"
            onClick={handleTestPlay}
            variant="success"
          />

          <div className="w-px h-5 bg-border/30 mx-0.5" />

          {/* Config */}
          <div ref={configRef} className="relative">
            <ToolbarIconBtn
              icon={Settings}
              tooltip="Configuracoes"
              onClick={() => {
                setConfigOpen(!configOpen);
                setFileMenuOpen(false);
                setEditMenuOpen(false);
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

                  {/* Theme Selector */}
                  <div className="border-t border-border/20 pt-3">
                    <label className="text-[10px] font-medium text-muted-foreground/50 uppercase tracking-wider mb-1 flex items-center gap-1">
                      <Paintbrush size={10} /> Tema
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {LEVEL_THEMES.map((t) => {
                        const palette = THEME_PALETTES[t];
                        return (
                          <button
                            key={t}
                            onClick={() => {
                              setTheme(t);
                              gameEvents.emit(EDITOR_EVENTS.SET_LEVEL_META, { theme: t });
                            }}
                            className={`text-[9px] px-2 py-1.5 rounded border transition-all ${
                              theme === t
                                ? "border-primary bg-primary/10 text-foreground"
                                : "border-border/30 text-muted-foreground/60 hover:border-primary/30"
                            }`}
                          >
                            <span
                              className="inline-block w-2 h-2 rounded-full mr-1"
                              style={{ backgroundColor: palette.groundTop }}
                            />
                            {palette.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Tags Selector */}
                  <div className="border-t border-border/20 pt-3">
                    <label className="text-[10px] font-medium text-muted-foreground/50 uppercase tracking-wider mb-1 flex items-center gap-1">
                      <Tag size={10} /> Tags ({selectedTags.length}/3)
                    </label>
                    <div className="flex flex-wrap gap-1">
                      {LEVEL_TAGS.map((tag) => {
                        const cfg = TAG_CONFIG[tag];
                        const isSelected = selectedTags.includes(tag);
                        return (
                          <button
                            key={tag}
                            onClick={() => {
                              if (isSelected) {
                                setSelectedTags(selectedTags.filter((t) => t !== tag));
                              } else if (selectedTags.length < 3) {
                                setSelectedTags([...selectedTags, tag]);
                              }
                            }}
                            className={`text-[8px] px-1.5 py-0.5 border rounded transition-all ${
                              isSelected
                                ? "text-foreground font-bold"
                                : "text-muted-foreground/50 hover:text-muted-foreground"
                            }`}
                            style={{
                              borderColor: isSelected ? cfg.color : undefined,
                              backgroundColor: isSelected ? cfg.color + "20" : undefined,
                              color: isSelected ? cfg.color : undefined,
                            }}
                          >
                            {cfg.label}
                          </button>
                        );
                      })}
                    </div>
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

          {/* Command Palette trigger */}
          <button
            onClick={() => setCommandPaletteOpen(true)}
            title="Paleta de comandos (Ctrl+K)"
            className="flex items-center gap-1.5 px-1.5 py-1 rounded-md text-muted-foreground/40 hover:text-muted-foreground/60 hover:bg-white/5 transition-all"
          >
            <Search size={13} />
            <kbd className="text-[8px] font-mono bg-white/5 px-1 py-0.5 rounded border border-border/20 text-muted-foreground/40">
              Ctrl+K
            </kbd>
          </button>
        </div>
      </div>

      {/* Command Palette modal */}
      {commandPaletteOpen && (
        <CommandPalette
          commands={allCommands}
          onClose={() => setCommandPaletteOpen(false)}
        />
      )}

      {rankUp && <RankUpToast rankUp={rankUp} onDismiss={dismiss} />}
    </>
  );
}

// ============================================================
// Types
// ============================================================

interface CommandDef {
  id: string;
  group: string;
  label: string;
  shortcut?: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  action: () => void;
}

// ============================================================
// ToolbarIconBtn — compact icon-only button with tooltip
// ============================================================

function ToolbarIconBtn({
  icon: Icon,
  tooltip,
  shortcut,
  onClick,
  disabled,
  variant,
  active,
  iconClassName,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  tooltip: string;
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
      title={shortcut ? `${tooltip} (${shortcut})` : tooltip}
      className={`p-1.5 rounded-md transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed ${base} ${
        active ? "bg-white/10 text-foreground/90 ring-1 ring-primary/30" : ""
      }`}
    >
      <Icon size={15} className={iconClassName} />
    </button>
  );
}

// ============================================================
// DropdownItem — row inside a dropdown menu
// ============================================================

function DropdownItem({
  icon: Icon,
  label,
  shortcut,
  onClick,
  disabled,
  iconClassName,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  shortcut?: string;
  onClick: () => void;
  disabled?: boolean;
  iconClassName?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full flex items-center gap-2.5 px-3 py-1.5 text-[11px] text-muted-foreground/80 hover:bg-white/5 hover:text-foreground transition-all disabled:opacity-30 disabled:cursor-not-allowed"
    >
      <Icon size={13} className={iconClassName} />
      <span className="flex-1 text-left">{label}</span>
      {shortcut && (
        <kbd className="text-[9px] font-mono text-muted-foreground/40 bg-white/5 px-1.5 py-0.5 rounded">
          {shortcut}
        </kbd>
      )}
    </button>
  );
}

// ============================================================
// CommandPalette — Ctrl+K searchable command list
// ============================================================

function CommandPalette({
  commands,
  onClose,
}: {
  commands: CommandDef[];
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = commands.filter(
    (cmd) =>
      cmd.label.toLowerCase().includes(query.toLowerCase()) ||
      cmd.group.toLowerCase().includes(query.toLowerCase()),
  );

  // Reset selection when query changes
  useEffect(() => {
    setSelectedIdx(0);
  }, [query]);

  // Auto-focus
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIdx((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filtered[selectedIdx]) {
        filtered[selectedIdx].action();
        onClose();
      }
    }
  };

  // Group commands
  const groups = filtered.reduce<Record<string, CommandDef[]>>((acc, cmd) => {
    if (!acc[cmd.group]) acc[cmd.group] = [];
    acc[cmd.group].push(cmd);
    return acc;
  }, {});

  let flatIdx = 0;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Paleta de comandos"
      className="fixed inset-0 z-200 flex items-start justify-center pt-[15vh] bg-black/60 backdrop-blur-sm"
      onClick={onClose}
      onKeyDown={(e) => { if (e.key === "Escape") onClose(); }}
    >
      <div
        role="presentation"
        className="w-105 max-h-[60vh] bg-[#15151f] border border-border/40 rounded-xl shadow-2xl flex flex-col animate-slide-up overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border/20">
          <Search size={15} className="text-muted-foreground/40 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Buscar comando..."
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/30 focus:outline-none"
          />
          <kbd className="text-[9px] font-mono text-muted-foreground/30 bg-white/5 px-1.5 py-0.5 rounded border border-border/20">
            Esc
          </kbd>
        </div>

        {/* Results */}
        <div className="overflow-y-auto py-1">
          {Object.entries(groups).map(([group, cmds]) => (
            <div key={group}>
              <p className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-wider px-4 pt-2 pb-1">
                {group}
              </p>
              {cmds.map((cmd) => {
                const idx = flatIdx++;
                return (
                  <button
                    key={cmd.id}
                    onClick={() => {
                      cmd.action();
                      onClose();
                    }}
                    className={`w-full flex items-center gap-2.5 px-4 py-2 text-[12px] transition-all ${
                      idx === selectedIdx
                        ? "bg-primary/15 text-foreground"
                        : "text-muted-foreground/70 hover:bg-white/5 hover:text-foreground"
                    }`}
                  >
                    <cmd.icon size={14} className="shrink-0" />
                    <span className="flex-1 text-left">{cmd.label}</span>
                    {cmd.shortcut && (
                      <kbd className="text-[9px] font-mono text-muted-foreground/40 bg-white/5 px-1.5 py-0.5 rounded">
                        {cmd.shortcut}
                      </kbd>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
          {filtered.length === 0 && (
            <p className="text-[11px] text-muted-foreground/30 text-center py-6">
              Nenhum comando encontrado
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
