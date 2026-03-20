// ============================================================
// Trap Architect — Game Types
// Ported from legacy vanilla JS to typed TypeScript
// ============================================================

/** Tile type enum — all placeable tile types in the game */
export enum TileType {
  AIR = 0,
  GROUND_TOP = 1,
  GROUND = 2,
  BRICK = 3,
  QUESTION = 4,
  SPIKE = 5,
  HIDDEN_SPIKE = 6,
  FAKE_GROUND = 7,
  INVISIBLE = 8,
  PIPE_TL = 9,
  PIPE_TR = 10,
  PIPE_BL = 11,
  PIPE_BR = 12,
  LAVA = 13,
  TROLL_Q = 14,
  USED = 15,
  CASTLE = 16,
  SPRING = 17,
  CLOUD = 18,
  PLATFORM = 19,
  ICE = 20,
  CONVEYOR_L = 21,
  CONVEYOR_R = 22,
  CHECKPOINT = 23,
  TRAMPOLINE = 24,
  POWERUP_BLOCK = 25,
  SLIDE_BLOCK = 26,
  TIMED_BLOCK = 27,
  GRAVITY_ZONE = 28,
  MOVING_PLATFORM = 29,
  // Decorative & new terrain (v0.6+)
  SAND = 30,
  SNOW = 31,
  WOOD = 32,
  MOSSY_STONE = 33,
  FENCE = 34,
  TORCH = 35,
  CHAIN = 36,
  SIGN = 37,
  METAL = 38,
  GRATE = 39,
  WATER = 40,
  CRYSTAL = 41,
  MUSHROOM_BLOCK = 42,
  GRAVITY_NORMAL = 43,
  // New gameplay mechanics (feature-ideas)
  TELEPORTER_A = 44,
  TELEPORTER_B = 45,
  CANNON_LEFT = 46,
  CANNON_RIGHT = 47,
  CANNON_UP = 48,
  CANNON_DOWN = 49,
  STICKY_BLOCK = 50,
  KEY_RED = 51,
  KEY_BLUE = 52,
  KEY_GREEN = 53,
  LOCK_RED = 54,
  LOCK_BLUE = 55,
  LOCK_GREEN = 56,
  ICE_BREAKABLE = 57,
  WIND_UP = 58,
  WIND_DOWN = 59,
  WIND_LEFT = 60,
  WIND_RIGHT = 61,
  MIRROR = 62,
  SIGN_CUSTOM = 63,
}

/** Entity types that can be placed on the map */
export type EntityType =
  | "player"
  | "coin"
  | "goomba"
  | "fast_goomba"
  | "spiny"
  | "flying"
  | "flag"
  | "fake_flag"
  | "mushroom"
  | "star"
  | "fire_flower"
  | "ghost"
  | "shooter"
  | "giant_goomba"
  | "saw_blade"
  | "slowmo"
  | "cannon_bullet"
  | "shooter_bullet";

/** Power-up types that can be spawned from blocks or triggers */
export type PowerUpType = "mushroom" | "star" | "fire_flower";

/** A spawned entity in the game world */
export interface GameEntity {
  type: EntityType;
  x: number;
  y: number;
  vx?: number;
  vy?: number;
  dir?: number;
  baseY?: number;
  alive?: boolean;
  frame?: number;
  timer?: number;
  dying?: boolean;
  deathType?: "lava" | "spike";
  deathTimer?: number;
  // Giant goomba HP
  hp?: number;
  invFrames?: number;
  // Saw blade path
  waypoints?: { x: number; y: number }[];
  waypointIndex?: number;
  // Custom sign text
  text?: string;
}

/** Troll trigger actions */
export type TrollAction = "spawn" | "shake" | "message" | "fall_blocks" | "spawn_powerup" | "slide_block" | "gravity_flip" | "sound";

/** Available troll SFX types */
export type TrollSfxType = "sfx_laugh" | "sfx_scream" | "sfx_boom" | "sfx_horn" | "sfx_sad" | "sfx_fart" | "sfx_drama" | "sfx_bruh";

/** A troll trigger definition */
export interface TrollTrigger {
  triggerX: number;
  action: TrollAction;
  triggered: boolean;
  // spawn
  entityType?: EntityType;
  spawnX?: number;
  spawnY?: number;
  // shake & message
  duration?: number;
  // message
  text?: string;
  // fall_blocks
  startX?: number;
  count?: number;
  // spawn_powerup
  powerUpType?: PowerUpType;
  // slide_block
  slideFromX?: number;
  slideFromY?: number;
  slideToX?: number;
  slideToY?: number;
  // gravity_flip
  flipDuration?: number;
  // sound
  sfx?: TrollSfxType;
}

/** Player state */
export interface Player {
  x: number;
  y: number;
  vx: number;
  vy: number;
  w: number;
  h: number;
  dir: 1 | -1;
  grounded: boolean;
  alive: boolean;
  frame: number;
  invincible: boolean;
  invTimer: number;
  jumpHeld: boolean;
  // Power-up state
  powered: boolean;
  powerType: PowerUpType | null;
  powerTimer: number;
  // Wall jump
  wallSliding: boolean;
  wallDir: 1 | -1 | 0;
  // Dash
  canDash: boolean;
  dashing: boolean;
  dashTimer: number;
  // Gravity flip
  gravityFlipped: boolean;
  gravityFlipTimer: number;
}

/** Slide block configuration in level data */
export interface SlideBlockConfig {
  id: string;
  fromGx: number;
  fromGy: number;
  toGx: number;
  toGy: number;
  triggered: boolean;
}

/** Moving platform configuration */
export interface MovingPlatformConfig {
  gx: number;
  gy: number;
  axis: "x" | "y";
  range: number;
  speed: number;
}

/** Available level tags */
export const LEVEL_TAGS = [
  "puzzle", "speedrun", "troll", "precision", "kaizo",
  "easy", "art", "story", "music", "impossible",
] as const;
export type LevelTag = (typeof LEVEL_TAGS)[number];

/** Tag display configuration */
export const TAG_CONFIG: Record<LevelTag, { labelKey: string; color: string }> = {
  puzzle: { labelKey: "puzzle", color: "#8b5cf6" },
  speedrun: { labelKey: "speedrun", color: "#f59e0b" },
  troll: { labelKey: "troll", color: "#ef4444" },
  precision: { labelKey: "precision", color: "#3b82f6" },
  kaizo: { labelKey: "kaizo", color: "#dc2626" },
  easy: { labelKey: "easy", color: "#22c55e" },
  art: { labelKey: "art", color: "#ec4899" },
  story: { labelKey: "story", color: "#6366f1" },
  music: { labelKey: "music", color: "#14b8a6" },
  impossible: { labelKey: "impossible", color: "#991b1b" },
};

/** Available level themes */
export const LEVEL_THEMES = [
  "default", "snow", "inferno", "neon", "retro", "underwater",
] as const;
export type LevelTheme = (typeof LEVEL_THEMES)[number];

/** Victory animation types */
export type VictoryAnimation =
  | "victory_default"
  | "victory_dance"
  | "victory_backflip"
  | "victory_fireworks"
  | "victory_dab"
  | "victory_troll_face";

/** Achievement definition */
export interface AchievementDef {
  id: string;
  name: string;
  description: string;
  icon: string;
}

/** Level configuration as stored/shared (JSON-serializable) */
export interface LevelData {
  id?: string;
  name: string;
  subtitle?: string;
  bgColor: string;
  music: string;
  gridW: number;
  gridH: number;
  tiles: number[][];
  backgroundTiles?: number[][];
  entities: { type: EntityType; gx: number; gy: number; text?: string; waypoints?: { gx: number; gy: number }[] }[];
  trolls: TrollTrigger[];
  slideBlocks?: SlideBlockConfig[];
  movingPlatforms?: MovingPlatformConfig[];
  playerStart: { x: number; y: number };
  // Teleporter pairs (A↔B linked by index)
  teleporterPairs?: { ax: number; ay: number; bx: number; by: number }[];
  // Teleporter channels keyed by "gx,gy" → channel number (1-8)
  teleporterChannels?: Record<string, number>;
  // Sign texts keyed by "gx,gy"
  signTexts?: Record<string, string>;
  // Tags (1-3 per level)
  tags?: LevelTag[];
  // Theme
  theme?: LevelTheme;
  // Community stats (read-only, from DB)
  communityDeaths?: number;
  completionRate?: number;
  avgRating?: number;
  ratingCount?: number;
  // Metadata (from database)
  authorId?: string;
  authorNickname?: string;
  createdAt?: string;
  updatedAt?: string;
  plays?: number;
  likes?: number;
  difficulty?: number;
  featured?: boolean;
  featuredCategory?: string;
}

/** Parsed level ready for gameplay */
export interface ParsedLevel {
  name: string;
  subtitle?: string;
  bgColor: string;
  music: string;
  width: number;
  height: number;
  tiles: number[][];
  backgroundTiles?: number[][];
  entities: GameEntity[];
  trolls: TrollTrigger[];
  slideBlocks?: SlideBlockConfig[];
  movingPlatforms?: MovingPlatformConfig[];
  playerStart: { x: number; y: number };
  _checkpointX?: number;
  _checkpointY?: number;
  // Teleporter pairs
  teleporterPairs?: { ax: number; ay: number; bx: number; by: number }[];
  // Teleporter channels keyed by "gx,gy" → channel number (1-8)
  teleporterChannels?: Record<string, number>;
  // Sign texts keyed by "gx,gy"
  signTexts?: Record<string, string>;
  // Theme
  theme?: LevelTheme;
  // Community stats
  communityDeaths?: number;
  completionRate?: number;
}

/** Editor palette item */
export interface PaletteItem {
  id: number;
  name: string;
  description: string;
  category: PaletteCategory;
  tileType?: TileType;
  entityType?: EntityType;
  color: string;
}

export type PaletteCategory = "terrain" | "danger" | "interactive" | "entities" | "decoration";

/** User profile from database */
export interface UserProfile {
  id: string;
  nickname: string;
  photoURL?: string;
  createdAt: string;
  lastSeen: string;
  // Creator stats
  levelsPublished: number;
  totalPlays: number;
  totalLikes: number;
  creatorCoins: number;
  creatorRank: number;
  devsChoiceCount: number;
  // Player stats
  levelsCompleted: number;
  totalDeaths: number;
  totalCoins: number;
  timePlayed: number;
  // Cosmetics
  equippedSkin: string;
  equippedTrail: string;
  equippedDeathEffect: string;
  equippedFrame: string;
  unlockedCosmetics: string[];
}

/** Creator rank tier definition */
export interface CreatorRank {
  level: number;
  title: string;
  color: string;
  minLevels: number;
  minPlays: number;
  minLikes: number;
  needsDevsChoice: boolean;
}

/** Cosmetic skin definition */
export interface CosmeticSkin {
  id: string;
  name: string;
  cost: number;
  color: string;
}

/** Cosmetic trail definition */
export interface CosmeticTrail {
  id: string;
  name: string;
  cost: number;
  colors: string[];
}

/** Cosmetic death effect definition */
export interface CosmeticDeathEffect {
  id: string;
  name: string;
  cost: number;
}

/** Cosmetic profile frame definition */
export interface CosmeticFrame {
  id: string;
  name: string;
  cost: number;
  style: "none" | "solid" | "gradient" | "animated";
}
