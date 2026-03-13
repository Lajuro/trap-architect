import { TileType, type CreatorRank, type CosmeticSkin, type CosmeticTrail, type CosmeticDeathEffect, type CosmeticFrame, type PaletteItem } from "./types";

// ============================================================
// Physics
// ============================================================
export const TILE_SIZE = 32;
export const GRAVITY = 0.45;
export const JUMP_FORCE = -10;
export const PLAYER_SPEED = 3.2;
export const MAX_FALL = 11;
export const PLAYER_W = 22;
export const PLAYER_H = 28;
export const ICE_FRICTION = 0.98;
export const CONVEYOR_SPEED = 2;
export const GOOMBA_SPEED = 1.5;
export const FAST_GOOMBA_SPEED = 3;
export const SPINY_SPEED = 1.5;
export const FLYING_SPEED = 1.5;
export const FLYING_BOB_AMPLITUDE = 40;
export const SPRING_MULTIPLIER = 1.5;
export const TRAMPOLINE_MULTIPLIER = 2;
export const FAKE_GROUND_TIMER = 20;

// ============================================================
// Display
// ============================================================
export const GAME_WIDTH = 800;
export const GAME_HEIGHT = 480;
export const EDITOR_CANVAS_HEIGHT = 600;

// ============================================================
// Editor
// ============================================================
export const EDITOR_DEFAULT_WIDTH = 100;
export const EDITOR_DEFAULT_HEIGHT = 15;
export const EDITOR_MIN_WIDTH = 25;
export const EDITOR_MAX_WIDTH = 300;
export const EDITOR_MIN_HEIGHT = 10;
export const EDITOR_MAX_HEIGHT = 30;
export const EDITOR_MAX_UNDO = 80;
export const EDITOR_SCROLL_SPEED = 8;

// ============================================================
// Tile Categories
// ============================================================
export const SOLID_TILES = new Set([
  TileType.GROUND_TOP,
  TileType.GROUND,
  TileType.BRICK,
  TileType.QUESTION,
  TileType.INVISIBLE,
  TileType.PIPE_TL,
  TileType.PIPE_TR,
  TileType.PIPE_BL,
  TileType.PIPE_BR,
  TileType.TROLL_Q,
  TileType.USED,
  TileType.CASTLE,
  TileType.SPRING,
  TileType.ICE,
  TileType.CONVEYOR_L,
  TileType.CONVEYOR_R,
  TileType.CHECKPOINT,
  TileType.TRAMPOLINE,
]);

export const ONEWAY_TILES = new Set([TileType.PLATFORM]);

export const LETHAL_TILES = new Set([
  TileType.SPIKE,
  TileType.HIDDEN_SPIKE,
  TileType.LAVA,
]);

// ============================================================
// Creator Ranks
// ============================================================
export const CREATOR_RANKS: CreatorRank[] = [
  { level: 0, title: "Jogador", color: "#888888", minLevels: 0, minPlays: 0, minLikes: 0, needsDevsChoice: false },
  { level: 1, title: "Criador Novato", color: "#4CAF50", minLevels: 1, minPlays: 0, minLikes: 0, needsDevsChoice: false },
  { level: 2, title: "Construtor", color: "#2196F3", minLevels: 5, minPlays: 50, minLikes: 0, needsDevsChoice: false },
  { level: 3, title: "Arquiteto", color: "#9C27B0", minLevels: 15, minPlays: 500, minLikes: 100, needsDevsChoice: false },
  { level: 4, title: "Mestre Troll", color: "#FF9800", minLevels: 30, minPlays: 2000, minLikes: 500, needsDevsChoice: false },
  { level: 5, title: "Lenda", color: "#FFD700", minLevels: 50, minPlays: 10000, minLikes: 1000, needsDevsChoice: true },
];

// ============================================================
// Cosmetic Skins
// ============================================================
export const SKINS: CosmeticSkin[] = [
  { id: "default", name: "Gato Clássico", cost: 0, color: "#FF8C00" },
  { id: "ninja", name: "Gato Ninja", cost: 100, color: "#333333" },
  { id: "pixel", name: "Gato Pixel", cost: 150, color: "#00FF00" },
  { id: "ghost", name: "Gato Fantasma", cost: 200, color: "#AACCFF" },
  { id: "golden", name: "Gato Dourado", cost: 500, color: "#FFD700" },
  { id: "troll", name: "Gato Troll", cost: 300, color: "#FF4444" },
  { id: "ice", name: "Gato Gelo", cost: 250, color: "#88DDFF" },
  { id: "lava", name: "Gato Lava", cost: 400, color: "#FF4400" },
];

// ============================================================
// Cosmetic Trails
// ============================================================
export const TRAILS: CosmeticTrail[] = [
  { id: "trail_none", name: "Nenhum", cost: 0, colors: [] },
  { id: "trail_fire", name: "Fogo", cost: 15, colors: ["#FF4500", "#FF8C00"] },
  { id: "trail_ice", name: "Gelo", cost: 15, colors: ["#00BFFF", "#87CEEB"] },
  { id: "trail_stars", name: "Estrelas", cost: 25, colors: ["#FFD700", "#FFFFFF"] },
  { id: "trail_rainbow", name: "Arco-Íris", cost: 50, colors: ["#FF0000", "#FF7F00", "#FFFF00", "#00FF00", "#0000FF", "#8B00FF"] },
];

// ============================================================
// Cosmetic Death Effects
// ============================================================
export const DEATH_EFFECTS: CosmeticDeathEffect[] = [
  { id: "death_default", name: "Padrão", cost: 0 },
  { id: "death_pixelate", name: "Pixelado", cost: 15 },
  { id: "death_ghost", name: "Fantasma", cost: 20 },
  { id: "death_confetti", name: "Confete", cost: 25 },
  { id: "death_shatter", name: "Estilhaçar", cost: 40 },
];

// ============================================================
// Cosmetic Profile Frames
// ============================================================
export const FRAMES: CosmeticFrame[] = [
  { id: "frame_none", name: "Nenhum", cost: 0, style: "none" },
  { id: "frame_gold", name: "Dourado", cost: 20, style: "solid" },
  { id: "frame_diamond", name: "Diamante", cost: 35, style: "gradient" },
  { id: "frame_troll", name: "Troll", cost: 30, style: "solid" },
  { id: "frame_fire", name: "Fogo", cost: 40, style: "animated" },
];

// ============================================================
// Editor Palette
// ============================================================
export const PALETTE_ITEMS: PaletteItem[] = [
  // Terrain
  { id: 0, name: "Borracha", category: "terrain", tileType: TileType.AIR },
  { id: 1, name: "Chão (Topo)", category: "terrain", tileType: TileType.GROUND_TOP },
  { id: 2, name: "Chão (Interior)", category: "terrain", tileType: TileType.GROUND },
  { id: 3, name: "Tijolo", category: "terrain", tileType: TileType.BRICK },
  { id: 4, name: "Castelo", category: "terrain", tileType: TileType.CASTLE },
  { id: 5, name: "Bloco Usado", category: "terrain", tileType: TileType.USED },
  { id: 6, name: "Cano (↖)", category: "terrain", tileType: TileType.PIPE_TL },
  { id: 7, name: "Cano (↗)", category: "terrain", tileType: TileType.PIPE_TR },
  { id: 8, name: "Cano (↙)", category: "terrain", tileType: TileType.PIPE_BL },
  { id: 9, name: "Cano (↘)", category: "terrain", tileType: TileType.PIPE_BR },
  { id: 10, name: "Gelo", category: "terrain", tileType: TileType.ICE },
  { id: 11, name: "Nuvem", category: "terrain", tileType: TileType.CLOUD },
  // Danger
  { id: 12, name: "Espinho", category: "danger", tileType: TileType.SPIKE },
  { id: 13, name: "Espinho Oculto", category: "danger", tileType: TileType.HIDDEN_SPIKE },
  { id: 14, name: "Lava", category: "danger", tileType: TileType.LAVA },
  { id: 15, name: "Chão Falso", category: "danger", tileType: TileType.FAKE_GROUND },
  // Interactive
  { id: 16, name: "Bloco ?", category: "interactive", tileType: TileType.QUESTION },
  { id: 17, name: "Bloco Troll !", category: "interactive", tileType: TileType.TROLL_Q },
  { id: 18, name: "Invisível", category: "interactive", tileType: TileType.INVISIBLE },
  { id: 19, name: "Mola", category: "interactive", tileType: TileType.SPRING },
  { id: 20, name: "Trampolim", category: "interactive", tileType: TileType.TRAMPOLINE },
  { id: 21, name: "Plataforma", category: "interactive", tileType: TileType.PLATFORM },
  { id: 22, name: "Esteira ←", category: "interactive", tileType: TileType.CONVEYOR_L },
  { id: 23, name: "Esteira →", category: "interactive", tileType: TileType.CONVEYOR_R },
  { id: 24, name: "Checkpoint", category: "interactive", tileType: TileType.CHECKPOINT },
  // Entities
  { id: 25, name: "Jogador", category: "entities", entityType: "player" },
  { id: 26, name: "Moeda", category: "entities", entityType: "coin" },
  { id: 27, name: "Goomba", category: "entities", entityType: "goomba" },
  { id: 28, name: "Goomba Rápido", category: "entities", entityType: "fast_goomba" },
  { id: 29, name: "Spiny", category: "entities", entityType: "spiny" },
  { id: 30, name: "Voador", category: "entities", entityType: "flying" },
  { id: 31, name: "Bandeira", category: "entities", entityType: "flag" },
  { id: 32, name: "Bandeira Falsa", category: "entities", entityType: "fake_flag" },
];

// ============================================================
// Tile char map (for level string parsing — legacy compat)
// ============================================================
export const CHAR_TO_TILE: Record<string, TileType> = {
  ".": TileType.AIR,
  G: TileType.GROUND_TOP,
  "#": TileType.GROUND,
  B: TileType.BRICK,
  "?": TileType.QUESTION,
  "!": TileType.TROLL_Q,
  "^": TileType.SPIKE,
  v: TileType.HIDDEN_SPIKE,
  "~": TileType.FAKE_GROUND,
  "=": TileType.INVISIBLE,
  "[": TileType.PIPE_TL,
  "]": TileType.PIPE_TR,
  "{": TileType.PIPE_BL,
  "}": TileType.PIPE_BR,
  L: TileType.LAVA,
  S: TileType.SPRING,
  W: TileType.CASTLE,
  U: TileType.USED,
  c: TileType.CLOUD,
  "-": TileType.PLATFORM,
  I: TileType.ICE,
  "<": TileType.CONVEYOR_L,
  ">": TileType.CONVEYOR_R,
  H: TileType.CHECKPOINT,
  J: TileType.TRAMPOLINE,
};
