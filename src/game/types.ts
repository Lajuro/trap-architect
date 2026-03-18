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
  | "fire_flower";

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
}

/** Troll trigger actions */
export type TrollAction = "spawn" | "shake" | "message" | "fall_blocks" | "spawn_powerup" | "slide_block" | "gravity_flip";

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
  entities: { type: EntityType; gx: number; gy: number }[];
  trolls: TrollTrigger[];
  slideBlocks?: SlideBlockConfig[];
  movingPlatforms?: MovingPlatformConfig[];
  playerStart: { x: number; y: number };
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
  entities: GameEntity[];
  trolls: TrollTrigger[];
  slideBlocks?: SlideBlockConfig[];
  movingPlatforms?: MovingPlatformConfig[];
  playerStart: { x: number; y: number };
  _checkpointX?: number;
  _checkpointY?: number;
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

export type PaletteCategory = "terrain" | "danger" | "interactive" | "entities";

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
