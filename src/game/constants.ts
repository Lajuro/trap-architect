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
export const FAKE_GROUND_TIMER = 50;
export const HIDDEN_SPIKE_RUMBLE = 20;
export const HIDDEN_SPIKE_EMERGE = 8;
export const HIDDEN_SPIKE_HOLD = 60;
export const HIDDEN_SPIKE_RETRACT = 15;

// Fixed timestep for frame-rate independence (60 FPS physics)
export const FIXED_STEP = 1000 / 60; // ~16.667ms
export const MAX_ACCUMULATED = 100; // cap to prevent spiral of death

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
  TileType.TRAMPOLINE,
  TileType.FAKE_GROUND,
  TileType.HIDDEN_SPIKE,
]);

export const ONEWAY_TILES = new Set([TileType.PLATFORM]);

export const LETHAL_TILES = new Set([
  TileType.SPIKE,
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
  { id: 0, name: "Borracha", description: "Apaga qualquer tile ou entidade", category: "terrain", tileType: TileType.AIR, color: "#666666" },
  { id: 1, name: "Chão (Topo)", description: "Grama verde — superfície pisável", category: "terrain", tileType: TileType.GROUND_TOP, color: "#228B22" },
  { id: 2, name: "Chão (Interior)", description: "Terra marrom — preenchimento sólido", category: "terrain", tileType: TileType.GROUND, color: "#8B5A2B" },
  { id: 3, name: "Tijolo", description: "Bloco destrutível clássico", category: "terrain", tileType: TileType.BRICK, color: "#CD853F" },
  { id: 4, name: "Castelo", description: "Parede de pedra decorativa", category: "terrain", tileType: TileType.CASTLE, color: "#888888" },
  { id: 5, name: "Bloco Usado", description: "Bloco já ativado — decorativo", category: "terrain", tileType: TileType.USED, color: "#8B7355" },
  { id: 6, name: "Cano (↖)", description: "Cano verde — canto superior esquerdo", category: "terrain", tileType: TileType.PIPE_TL, color: "#00AA00" },
  { id: 7, name: "Cano (↗)", description: "Cano verde — canto superior direito", category: "terrain", tileType: TileType.PIPE_TR, color: "#00AA00" },
  { id: 8, name: "Cano (↙)", description: "Cano verde — canto inferior esquerdo", category: "terrain", tileType: TileType.PIPE_BL, color: "#00AA00" },
  { id: 9, name: "Cano (↘)", description: "Cano verde — canto inferior direito", category: "terrain", tileType: TileType.PIPE_BR, color: "#00AA00" },
  { id: 10, name: "Gelo", description: "Superfície escorregadia — cuidado!", category: "terrain", tileType: TileType.ICE, color: "#A0D8EF" },
  { id: 11, name: "Nuvem", description: "Plataforma de nuvem — só decoração", category: "terrain", tileType: TileType.CLOUD, color: "#FFFFFF" },
  // Danger
  { id: 12, name: "Espinho", description: "Morte instantânea ao toque!", category: "danger", tileType: TileType.SPIKE, color: "#AAAAAA" },
  { id: 13, name: "Espinho Oculto", description: "Parece grama, mas mata — troll!", category: "danger", tileType: TileType.HIDDEN_SPIKE, color: "#228B22" },
  { id: 14, name: "Lava", description: "Mar de fogo — derrete tudo!", category: "danger", tileType: TileType.LAVA, color: "#FF3300" },
  { id: 15, name: "Chão Falso", description: "Desmorona quando pisado — surpresa!", category: "danger", tileType: TileType.FAKE_GROUND, color: "#228B22" },
  // Interactive
  { id: 16, name: "Bloco ?", description: "Libera moedas ou surpresas ao bater", category: "interactive", tileType: TileType.QUESTION, color: "#FFCC00" },
  { id: 17, name: "Bloco Troll !", description: "Parece um ?, mas trolls o jogador!", category: "interactive", tileType: TileType.TROLL_Q, color: "#FF4444" },
  { id: 18, name: "Invisível", description: "Bloco invisível — só aparece ao bater", category: "interactive", tileType: TileType.INVISIBLE, color: "#4444FF" },
  { id: 19, name: "Mola", description: "Lança o jogador para cima!", category: "interactive", tileType: TileType.SPRING, color: "#FF4444" },
  { id: 20, name: "Trampolim", description: "Super pulo — alcance alturas extremas!", category: "interactive", tileType: TileType.TRAMPOLINE, color: "#8844CC" },
  { id: 21, name: "Plataforma", description: "Semi-sólida — pule de baixo pra cima", category: "interactive", tileType: TileType.PLATFORM, color: "#B0804A" },
  { id: 22, name: "Esteira ←", description: "Move o jogador para a esquerda", category: "interactive", tileType: TileType.CONVEYOR_L, color: "#555555" },
  { id: 23, name: "Esteira →", description: "Move o jogador para a direita", category: "interactive", tileType: TileType.CONVEYOR_R, color: "#555555" },
  { id: 24, name: "Checkpoint", description: "Ponto de respawn — salva o progresso", category: "interactive", tileType: TileType.CHECKPOINT, color: "#44AAFF" },
  // Entities
  { id: 25, name: "Jogador", description: "Posição inicial do gato herói", category: "entities", entityType: "player", color: "#FF8C00" },
  { id: 26, name: "Moeda", description: "Coletável brilhante — pontos extras!", category: "entities", entityType: "coin", color: "#FFD700" },
  { id: 27, name: "Goomba", description: "Inimigo patrulheiro — anda de um lado pro outro", category: "entities", entityType: "goomba", color: "#8B4513" },
  { id: 28, name: "Goomba Rápido", description: "Goomba turbo — muito mais veloz!", category: "entities", entityType: "fast_goomba", color: "#FF6600" },
  { id: 29, name: "Spiny", description: "Inimigo com espinhos — não pule em cima!", category: "entities", entityType: "spiny", color: "#CC0000" },
  { id: 30, name: "Voador", description: "Inimigo flutuante — sobe e desce", category: "entities", entityType: "flying", color: "#6644AA" },
  { id: 31, name: "Bandeira", description: "OBRIGATÓRIA — marca o objetivo do nível", category: "entities", entityType: "flag", color: "#00CC00" },
  { id: 32, name: "Bandeira Falsa", description: "Parece a vitória, mas é trollagem pura!", category: "entities", entityType: "fake_flag", color: "#FF0000" },
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
