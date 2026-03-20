import { TileType, type ParsedLevel } from "../types";
import { TILE_SIZE } from "../constants";

const W = 25;
const H = 15;

// Pixel patterns for "4", "0", "4" (each 5×5)
const DIGIT_4 = [
  [1, 0, 0, 0, 1],
  [1, 0, 0, 0, 1],
  [1, 1, 1, 1, 1],
  [0, 0, 0, 0, 1],
  [0, 0, 0, 0, 1],
];

const DIGIT_0 = [
  [0, 1, 1, 1, 0],
  [1, 0, 0, 0, 1],
  [1, 0, 0, 0, 1],
  [1, 0, 0, 0, 1],
  [0, 1, 1, 1, 0],
];

function createTiles(): number[][] {
  const tiles: number[][] = [];
  for (let y = 0; y < H; y++) {
    tiles[y] = new Array(W).fill(TileType.AIR);
  }

  // ── "404" digits using bricks (rows 2–6) ──
  const digits: { pattern: number[][]; startX: number }[] = [
    { pattern: DIGIT_4, startX: 3 },
    { pattern: DIGIT_0, startX: 10 },
    { pattern: DIGIT_4, startX: 17 },
  ];
  for (const { pattern, startX } of digits) {
    for (let dy = 0; dy < 5; dy++) {
      for (let dx = 0; dx < 5; dx++) {
        if (pattern[dy][dx]) {
          tiles[2 + dy][startX + dx] = TileType.BRICK;
        }
      }
    }
  }

  // ── Ground floor (rows 13–14) ──
  for (let x = 0; x < W; x++) {
    tiles[13][x] = TileType.GROUND_TOP;
    tiles[14][x] = TileType.GROUND;
  }

  // ── Lava pit (gap at x 11–13) ──
  for (let x = 11; x <= 13; x++) {
    tiles[13][x] = TileType.LAVA;
    tiles[14][x] = TileType.LAVA;
  }

  // ── Fake ground trap (looks solid!) ──
  tiles[13][7] = TileType.FAKE_GROUND;
  tiles[13][8] = TileType.FAKE_GROUND;

  // ── Hidden spikes before the "end" ──
  tiles[13][18] = TileType.HIDDEN_SPIKE;
  tiles[13][19] = TileType.HIDDEN_SPIKE;

  // ── Spikes guarding the flag area ──
  tiles[12][21] = TileType.SPIKE;
  tiles[12][22] = TileType.SPIKE;

  // ── Platform over lava (one-way) ──
  tiles[11][11] = TileType.PLATFORM;
  tiles[11][12] = TileType.PLATFORM;
  tiles[11][13] = TileType.PLATFORM;

  // ── Question block (troll — spawns spike from above) ──
  tiles[10][5] = TileType.TROLL_Q;

  // ── Elevated bricks with coins as bait ──
  tiles[10][15] = TileType.BRICK;
  tiles[10][16] = TileType.BRICK;
  tiles[10][17] = TileType.QUESTION;

  // ── Checkpoint mid-level ──
  tiles[12][10] = TileType.CHECKPOINT;

  return tiles;
}

export const NOT_FOUND_LEVEL: ParsedLevel = {
  name: "NÍVEL 404",
  subtitle: "PÁGINA NÃO ENCONTRADA",
  bgColor: "#0a0a0a",
  music: "none",
  width: W,
  height: H,
  tiles: createTiles(),
  entities: [
    // Coins as bait on the fake ground
    { type: "coin", x: 7 * TILE_SIZE + 16, y: 12 * TILE_SIZE + 16, alive: true },
    { type: "coin", x: 8 * TILE_SIZE + 16, y: 12 * TILE_SIZE + 16, alive: true },
    // Coins on the elevated bricks
    { type: "coin", x: 15 * TILE_SIZE + 16, y: 9 * TILE_SIZE + 16, alive: true },
    { type: "coin", x: 16 * TILE_SIZE + 16, y: 9 * TILE_SIZE + 16, alive: true },
    // Goomba patrol
    { type: "goomba", x: 14 * TILE_SIZE, y: 12 * TILE_SIZE + 8, vx: -1.5, vy: 0, dir: -1, alive: true },
    // Spiny after checkpoint
    { type: "spiny", x: 20 * TILE_SIZE, y: 12 * TILE_SIZE + 8, vx: -1, vy: 0, dir: -1, alive: true },
    // FAKE flag (the ultimate troll — you "win" but die)
    { type: "fake_flag", x: 23 * TILE_SIZE + 16, y: 11 * TILE_SIZE, alive: true },
  ],
  trolls: [
    {
      triggerX: 6 * TILE_SIZE,
      action: "message",
      text: "Não confie no chão...",
      duration: 120,
      triggered: false,
    },
    {
      triggerX: 10 * TILE_SIZE,
      action: "spawn",
      entityType: "goomba",
      spawnX: 12,
      spawnY: 10,
      triggered: false,
    },
    {
      triggerX: 15 * TILE_SIZE,
      action: "shake",
      duration: 30,
      triggered: false,
    },
    {
      triggerX: 20 * TILE_SIZE,
      action: "message",
      text: "Quase lá... será?",
      duration: 90,
      triggered: false,
    },
    {
      triggerX: 22 * TILE_SIZE,
      action: "spawn",
      entityType: "fast_goomba",
      spawnX: 24,
      spawnY: 12,
      triggered: false,
    },
  ],
  playerStart: { x: 2, y: 12 },
};
