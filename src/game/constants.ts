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

// Power-up durations (in fixed-step frames)
export const STAR_DURATION = 480; // ~8 seconds
export const FIRE_FLOWER_DURATION = 600; // ~10 seconds
export const MUSHROOM_SPEED_BOOST = 1.3;
export const POWERUP_MOVE_SPEED = 2;
export const POWERUP_GRAVITY = 0.3;

// Wall jump
export const WALL_JUMP_FORCE_X = 5;
export const WALL_JUMP_FORCE_Y = -9;
export const WALL_SLIDE_SPEED = 1.5;

// Dash
export const DASH_SPEED = 8;
export const DASH_DURATION = 8; // frames
export const DASH_COOLDOWN = 30; // frames until can dash again on ground

// Gravity flip
export const GRAVITY_FLIP_DEFAULT_DURATION = 300; // ~5 seconds

// Timed blocks
export const TIMED_BLOCK_ON = 90; // frames visible
export const TIMED_BLOCK_OFF = 60; // frames invisible

// Slide block
export const SLIDE_BLOCK_SPEED = 3; // pixels per frame

// Moving platform
export const MOVING_PLATFORM_DEFAULT_SPEED = 1;
export const MOVING_PLATFORM_DEFAULT_RANGE = 4; // tiles

// Water
export const WATER_SPEED_FACTOR = 0.6; // horizontal speed multiplier in water

// Wind
export const WIND_FORCE = 2; // pixels/frame push

// Cannon
export const CANNON_FIRE_RATE = 120; // frames between shots (~2 seconds)
export const CANNON_BULLET_SPEED = 3; // pixels/frame

// Teleporter
export const TELEPORTER_COOLDOWN = 30; // frames cooldown after teleport

// Ghost enemy
export const GHOST_SPEED = 1.5; // pixels/frame when moving

// Shooter enemy
export const SHOOTER_FIRE_RATE = 90; // frames between shots (~1.5 seconds)
export const SHOOTER_BULLET_SPEED = 3; // pixels/frame

// Giant Goomba boss
export const GIANT_GOOMBA_SPEED = 1.0;
export const GIANT_GOOMBA_HP = 3;
export const GIANT_GOOMBA_INV_FRAMES = 60;

// Saw blade
export const SAW_BLADE_SPEED = 2; // pixels/frame along path

// Slow motion power-up
export const SLOWMO_DURATION = 180; // frames (~3 seconds)
export const SLOWMO_FACTOR = 0.5; // time scale

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
  TileType.POWERUP_BLOCK,
  TileType.SLIDE_BLOCK,
  TileType.TIMED_BLOCK,
  TileType.MOVING_PLATFORM,
  TileType.SAND,
  TileType.SNOW,
  TileType.WOOD,
  TileType.MOSSY_STONE,
  TileType.METAL,
  TileType.CRYSTAL,
  TileType.MUSHROOM_BLOCK,
  TileType.STICKY_BLOCK,
  TileType.LOCK_RED,
  TileType.LOCK_BLUE,
  TileType.LOCK_GREEN,
  TileType.ICE_BREAKABLE,
  TileType.MIRROR,
  TileType.CANNON_LEFT,
  TileType.CANNON_RIGHT,
  TileType.CANNON_UP,
  TileType.CANNON_DOWN,
]);

export const ONEWAY_TILES = new Set([TileType.PLATFORM, TileType.GRATE]);

export const LETHAL_TILES = new Set([
  TileType.SPIKE,
  TileType.LAVA,
]);

export const DECORATIVE_TILES = new Set([
  TileType.FENCE,
  TileType.TORCH,
  TileType.CHAIN,
  TileType.SIGN,
  TileType.SIGN_CUSTOM,
]);

export const WATER_TILES = new Set([TileType.WATER]);

export const WIND_TILES = new Set([
  TileType.WIND_UP,
  TileType.WIND_DOWN,
  TileType.WIND_LEFT,
  TileType.WIND_RIGHT,
]);

// ============================================================
// Auto-Tile Families
// ============================================================

/** Set of TileType values belonging to the same auto-tile family */
export const PIPE_FAMILY = new Set([
  TileType.PIPE_TL, TileType.PIPE_TR, TileType.PIPE_BL, TileType.PIPE_BR,
]);

export const GROUND_FAMILY = new Set([
  TileType.GROUND_TOP, TileType.GROUND,
]);

/**
 * Resolve the correct texture key for auto-tile blocks.
 * Checks neighbors from `getTile(gx, gy)` callback and returns the final texture key.
 */
export function resolveAutoTileTexture(
  tile: TileType,
  gx: number,
  gy: number,
  getTile: (gx: number, gy: number) => TileType,
): string | null {
  // --- Ground family: grass surface vs dirt interior ---
  if (GROUND_FAMILY.has(tile)) {
    const above = getTile(gx, gy - 1);
    return GROUND_FAMILY.has(above) ? "tile_ground" : "tile_ground_top";
  }
  // --- Lava: surface vs deep ---
  if (tile === TileType.LAVA) {
    const above = getTile(gx, gy - 1);
    return above === TileType.LAVA ? "tile_lava_deep" : "tile_lava";
  }
  // --- Ice: frost surface vs deep ice ---
  if (tile === TileType.ICE) {
    const above = getTile(gx, gy - 1);
    return above === TileType.ICE ? "tile_ice_deep" : "tile_ice";
  }
  // --- Castle: battlements vs interior stone ---
  if (tile === TileType.CASTLE) {
    const above = getTile(gx, gy - 1);
    return above === TileType.CASTLE ? "tile_castle_interior" : "tile_castle";
  }
  // --- Brick: top highlight vs standard ---
  if (tile === TileType.BRICK) {
    const above = getTile(gx, gy - 1);
    return above === TileType.BRICK ? "tile_brick" : "tile_brick_top";
  }
  // --- Sand: surface vs deep ---
  if (tile === TileType.SAND) {
    const above = getTile(gx, gy - 1);
    return above === TileType.SAND ? "tile_sand" : "tile_sand_top";
  }
  // --- Snow: surface vs deep ---
  if (tile === TileType.SNOW) {
    const above = getTile(gx, gy - 1);
    return above === TileType.SNOW ? "tile_snow" : "tile_snow_top";
  }
  // --- Water: surface vs deep ---
  if (tile === TileType.WATER) {
    const above = getTile(gx, gy - 1);
    return above === TileType.WATER ? "tile_water_deep" : "tile_water";
  }
  // --- Pipe family: 4-directional auto-tile ---
  if (PIPE_FAMILY.has(tile)) {
    const above = getTile(gx, gy - 1);
    const left = getTile(gx - 1, gy);
    const right = getTile(gx + 1, gy);
    const hasPipeAbove = PIPE_FAMILY.has(above);
    const hasPipeLeft = PIPE_FAMILY.has(left);
    const hasPipeRight = PIPE_FAMILY.has(right);

    if (!hasPipeAbove) {
      // Top row
      if (hasPipeRight && !hasPipeLeft) return "tile_pipe_tl";
      if (hasPipeLeft && !hasPipeRight) return "tile_pipe_tr";
      // Single column or both sides → default TL+TR look
      return "tile_pipe_tl";
    } else {
      // Body row
      if (hasPipeRight && !hasPipeLeft) return "tile_pipe_bl";
      if (hasPipeLeft && !hasPipeRight) return "tile_pipe_br";
      return "tile_pipe_bl";
    }
  }
  return null;
}

/** Set of all tile types that participate in auto-tiling */
export const AUTOTILE_TILES = new Set([
  TileType.GROUND_TOP, TileType.GROUND,
  TileType.LAVA,
  TileType.ICE,
  TileType.CASTLE,
  TileType.BRICK,
  TileType.PIPE_TL, TileType.PIPE_TR, TileType.PIPE_BL, TileType.PIPE_BR,
  TileType.SAND, TileType.SNOW, TileType.WATER,
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
  { id: 1, name: "Chão", description: "Grama na superfície, terra no interior", category: "terrain", tileType: TileType.GROUND_TOP, color: "#228B22" },
  { id: 3, name: "Tijolo", description: "Bloco destrutível clássico", category: "terrain", tileType: TileType.BRICK, color: "#CD853F" },
  { id: 4, name: "Castelo", description: "Parede de pedra — ameias automáticas no topo", category: "terrain", tileType: TileType.CASTLE, color: "#888888" },
  { id: 5, name: "Bloco Usado", description: "Bloco já ativado — decorativo", category: "terrain", tileType: TileType.USED, color: "#8B7355" },
  { id: 6, name: "Cano", description: "Cano verde — detecta formato automático", category: "terrain", tileType: TileType.PIPE_TL, color: "#00AA00" },
  { id: 10, name: "Gelo", description: "Superfície escorregadia — auto-tile!", category: "terrain", tileType: TileType.ICE, color: "#A0D8EF" },
  { id: 11, name: "Nuvem", description: "Plataforma de nuvem — só decoração", category: "terrain", tileType: TileType.CLOUD, color: "#FFFFFF" },
  { id: 41, name: "Areia", description: "Terreno arenoso — auto-tile superfície/fundo", category: "terrain", tileType: TileType.SAND, color: "#D4A843" },
  { id: 42, name: "Neve", description: "Terreno gelado — auto-tile superfície/fundo", category: "terrain", tileType: TileType.SNOW, color: "#E8F0FF" },
  { id: 43, name: "Madeira", description: "Tábuas de madeira — sólido decorativo", category: "terrain", tileType: TileType.WOOD, color: "#8B6340" },
  { id: 44, name: "Pedra Musgosa", description: "Pedra antiga coberta de musgo", category: "terrain", tileType: TileType.MOSSY_STONE, color: "#5A7A52" },
  { id: 45, name: "Metal", description: "Painel industrial metálico com rebites", category: "terrain", tileType: TileType.METAL, color: "#708090" },
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
  { id: 33, name: "Bloco Power-Up", description: "Libera cogumelo, estrela ou flor ao bater", category: "interactive", tileType: TileType.POWERUP_BLOCK, color: "#FF88FF" },
  { id: 37, name: "Bloco Deslizante", description: "Desliza para nova posição ao ser ativado", category: "interactive", tileType: TileType.SLIDE_BLOCK, color: "#8888FF" },
  { id: 38, name: "Bloco Temporal", description: "Aparece e desaparece em ciclos", category: "interactive", tileType: TileType.TIMED_BLOCK, color: "#FF88CC" },
  { id: 39, name: "Zona de Gravidade", description: "Inverte a gravidade do jogador!", category: "danger", tileType: TileType.GRAVITY_ZONE, color: "#CC3388" },
  { id: 54, name: "Normalizar Gravidade", description: "Restaura a gravidade normal!", category: "danger", tileType: TileType.GRAVITY_NORMAL, color: "#BB2288" },
  { id: 40, name: "Plataforma Móvel", description: "Plataforma que se move automaticamente", category: "interactive", tileType: TileType.MOVING_PLATFORM, color: "#44BBAA" },
  { id: 46, name: "Grade", description: "Plataforma metálica semi-sólida", category: "interactive", tileType: TileType.GRATE, color: "#607080" },
  { id: 47, name: "Água", description: "Desacelera o jogador — auto-tile superfície", category: "interactive", tileType: TileType.WATER, color: "#2288CC" },
  // Decoration
  { id: 48, name: "Cerca", description: "Cerca de madeira — decorativa, sem colisão", category: "decoration", tileType: TileType.FENCE, color: "#A08050" },
  { id: 49, name: "Tocha", description: "Tocha flamejante — decorativa animada", category: "decoration", tileType: TileType.TORCH, color: "#FF8800" },
  { id: 50, name: "Corrente", description: "Corrente metálica pendente — decorativa", category: "decoration", tileType: TileType.CHAIN, color: "#999999" },
  { id: 51, name: "Placa", description: "Placa de madeira — decorativa", category: "decoration", tileType: TileType.SIGN, color: "#B08840" },
  { id: 52, name: "Cristal", description: "Gema brilhante — sólido com brilho", category: "decoration", tileType: TileType.CRYSTAL, color: "#AA44FF" },
  { id: 53, name: "Cogumelo", description: "Bloco de cogumelo vermelho com pintas", category: "decoration", tileType: TileType.MUSHROOM_BLOCK, color: "#DD3333" },
  // Entities
  { id: 25, name: "Jogador", description: "Posição inicial do gato herói", category: "entities", entityType: "player", color: "#FF8C00" },
  { id: 26, name: "Moeda", description: "Coletável brilhante — pontos extras!", category: "entities", entityType: "coin", color: "#FFD700" },
  { id: 27, name: "Goomba", description: "Inimigo patrulheiro — anda de um lado pro outro", category: "entities", entityType: "goomba", color: "#8B4513" },
  { id: 28, name: "Goomba Rápido", description: "Goomba turbo — muito mais veloz!", category: "entities", entityType: "fast_goomba", color: "#FF6600" },
  { id: 29, name: "Spiny", description: "Inimigo com espinhos — não pule em cima!", category: "entities", entityType: "spiny", color: "#CC0000" },
  { id: 30, name: "Voador", description: "Inimigo flutuante — sobe e desce", category: "entities", entityType: "flying", color: "#6644AA" },
  { id: 31, name: "Bandeira", description: "OBRIGATÓRIA — marca o objetivo do nível", category: "entities", entityType: "flag", color: "#00CC00" },
  { id: 32, name: "Bandeira Falsa", description: "Parece a vitória, mas é trollagem pura!", category: "entities", entityType: "fake_flag", color: "#FF0000" },
  // Power-ups
  { id: 34, name: "Cogumelo (item)", description: "Power-up: velocidade e resistência a 1 hit", category: "entities", entityType: "mushroom", color: "#FF4444" },
  { id: 35, name: "Estrela", description: "Power-up: invencibilidade temporária!", category: "entities", entityType: "star", color: "#FFD700" },
  { id: 36, name: "Flor de Fogo", description: "Power-up: atira bolas de fogo!", category: "entities", entityType: "fire_flower", color: "#FF6600" },
  // --- New gameplay mechanics ---
  // Interactive
  { id: 55, name: "Teleportador A", description: "Portal de entrada — par com Teleportador B", category: "interactive", tileType: TileType.TELEPORTER_A, color: "#4488FF" },
  { id: 56, name: "Teleportador B", description: "Portal de saída — par com Teleportador A", category: "interactive", tileType: TileType.TELEPORTER_B, color: "#FF8844" },
  { id: 57, name: "Bloco Pegajoso", description: "Gruda o jogador — pule para se soltar!", category: "interactive", tileType: TileType.STICKY_BLOCK, color: "#CCAA22" },
  { id: 58, name: "Chave Vermelha", description: "Abre fechaduras vermelhas", category: "entities", entityType: "coin", tileType: TileType.KEY_RED, color: "#FF4444" },
  { id: 59, name: "Chave Azul", description: "Abre fechaduras azuis", category: "entities", entityType: "coin", tileType: TileType.KEY_BLUE, color: "#4444FF" },
  { id: 60, name: "Chave Verde", description: "Abre fechaduras verdes", category: "entities", entityType: "coin", tileType: TileType.KEY_GREEN, color: "#44FF44" },
  { id: 61, name: "Fechadura Vermelha", description: "Bloco que abre com chave vermelha", category: "interactive", tileType: TileType.LOCK_RED, color: "#CC3333" },
  { id: 62, name: "Fechadura Azul", description: "Bloco que abre com chave azul", category: "interactive", tileType: TileType.LOCK_BLUE, color: "#3333CC" },
  { id: 63, name: "Fechadura Verde", description: "Bloco que abre com chave verde", category: "interactive", tileType: TileType.LOCK_GREEN, color: "#33CC33" },
  { id: 64, name: "Gelo Quebrável", description: "Quebra com bola de fogo ou 3 pulos", category: "interactive", tileType: TileType.ICE_BREAKABLE, color: "#88DDFF" },
  { id: 65, name: "Espelho", description: "Reflete bolas de fogo!", category: "interactive", tileType: TileType.MIRROR, color: "#C0C0C0" },
  // Wind
  { id: 66, name: "Vento ↑", description: "Corrente de ar para cima", category: "interactive", tileType: TileType.WIND_UP, color: "#AAEEFF" },
  { id: 67, name: "Vento ↓", description: "Corrente de ar para baixo", category: "interactive", tileType: TileType.WIND_DOWN, color: "#AAEEFF" },
  { id: 68, name: "Vento ←", description: "Corrente de ar para a esquerda", category: "interactive", tileType: TileType.WIND_LEFT, color: "#AAEEFF" },
  { id: 69, name: "Vento →", description: "Corrente de ar para a direita", category: "interactive", tileType: TileType.WIND_RIGHT, color: "#AAEEFF" },
  // Cannons
  { id: 70, name: "Canhão ←", description: "Dispara projéteis para a esquerda!", category: "danger", tileType: TileType.CANNON_LEFT, color: "#444444" },
  { id: 71, name: "Canhão →", description: "Dispara projéteis para a direita!", category: "danger", tileType: TileType.CANNON_RIGHT, color: "#444444" },
  { id: 72, name: "Canhão ↑", description: "Dispara projéteis para cima!", category: "danger", tileType: TileType.CANNON_UP, color: "#444444" },
  { id: 73, name: "Canhão ↓", description: "Dispara projéteis para baixo!", category: "danger", tileType: TileType.CANNON_DOWN, color: "#444444" },
  // New entities
  { id: 74, name: "Fantasma", description: "Move quando você não olha! Boo!", category: "entities", entityType: "ghost", color: "#AACCFF" },
  { id: 75, name: "Atirador", description: "Inimigo estacionário que dispara projéteis", category: "entities", entityType: "shooter", color: "#558855" },
  { id: 76, name: "Goomba Gigante", description: "Mini-boss! 3 pulos pra derrotar!", category: "entities", entityType: "giant_goomba", color: "#8B4513" },
  { id: 77, name: "Serra Circular", description: "Corta tudo no caminho! Indestrutível!", category: "danger", entityType: "saw_blade", color: "#888888" },
  { id: 78, name: "Slow Motion", description: "Power-up: câmera lenta por 3 segundos!", category: "entities", entityType: "slowmo", color: "#4488FF" },
  // Decoration
  { id: 79, name: "Placa Customizada", description: "Placa com texto do criador", category: "decoration", tileType: TileType.SIGN_CUSTOM, color: "#C09840" },
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
  M: TileType.POWERUP_BLOCK,
  D: TileType.SLIDE_BLOCK,
  T: TileType.TIMED_BLOCK,
  Z: TileType.GRAVITY_ZONE,
  O: TileType.MOVING_PLATFORM,
  A: TileType.SAND,
  N: TileType.SNOW,
  P: TileType.WOOD,
  m: TileType.MOSSY_STONE,
  F: TileType.FENCE,
  t: TileType.TORCH,
  h: TileType.CHAIN,
  s: TileType.SIGN,
  E: TileType.METAL,
  R: TileType.GRATE,
  w: TileType.WATER,
  C: TileType.CRYSTAL,
  K: TileType.MUSHROOM_BLOCK,
  Y: TileType.GRAVITY_NORMAL,
  // New tiles
  "1": TileType.TELEPORTER_A,
  "2": TileType.TELEPORTER_B,
  "3": TileType.CANNON_LEFT,
  "4": TileType.CANNON_RIGHT,
  "5": TileType.CANNON_UP,
  "6": TileType.CANNON_DOWN,
  Q: TileType.STICKY_BLOCK,
  r: TileType.KEY_RED,
  b: TileType.KEY_BLUE,
  g: TileType.KEY_GREEN,
  X: TileType.LOCK_RED,
  x: TileType.LOCK_BLUE,
  z: TileType.LOCK_GREEN,
  i: TileType.ICE_BREAKABLE,
  V: TileType.MIRROR,
  "7": TileType.WIND_UP,
  "8": TileType.WIND_DOWN,
  "9": TileType.WIND_LEFT,
  "0": TileType.WIND_RIGHT,
  p: TileType.SIGN_CUSTOM,
};
