import { TileType, type ParsedLevel } from "../types";
import { TILE_SIZE } from "../constants";

/**
 * Demo level — "Parece Fácil, Né?"
 * A small introductory level to test the engine.
 */
const W = 50;
const H = 15;

function createTiles(): number[][] {
  const tiles: number[][] = [];
  for (let y = 0; y < H; y++) {
    tiles[y] = [];
    for (let x = 0; x < W; x++) {
      tiles[y][x] = TileType.AIR;
    }
  }

  // Ground floor (row 13-14)
  for (let x = 0; x < W; x++) {
    // Gaps
    if (x >= 15 && x <= 17) continue; // Gap 1
    if (x >= 30 && x <= 31) continue; // Gap 2

    tiles[13][x] = TileType.GROUND_TOP;
    tiles[14][x] = TileType.GROUND;
  }

  // Some platforms
  tiles[10][8] = TileType.BRICK;
  tiles[10][9] = TileType.BRICK;
  tiles[10][10] = TileType.QUESTION;
  tiles[10][11] = TileType.BRICK;

  // Pipes at x=20
  tiles[11][20] = TileType.PIPE_TL;
  tiles[11][21] = TileType.PIPE_TR;
  tiles[12][20] = TileType.PIPE_BL;
  tiles[12][21] = TileType.PIPE_BR;

  // Spikes before gap 2
  tiles[12][28] = TileType.SPIKE;
  tiles[12][29] = TileType.SPIKE;

  // Platform over gap 2
  tiles[11][30] = TileType.PLATFORM;
  tiles[11][31] = TileType.PLATFORM;

  // Some fake ground (troll!)
  tiles[13][35] = TileType.FAKE_GROUND;
  tiles[13][36] = TileType.FAKE_GROUND;

  // Spring
  tiles[12][40] = TileType.SPRING;

  // High platform to reach with spring
  tiles[8][42] = TileType.GROUND_TOP;
  tiles[8][43] = TileType.GROUND_TOP;
  tiles[8][44] = TileType.GROUND_TOP;

  // Checkpoint
  tiles[12][25] = TileType.CHECKPOINT;

  return tiles;
}

export const DEMO_LEVEL: ParsedLevel = {
  name: "Fase 1 — Parece Fácil, Né?",
  subtitle: "Introdução",
  bgColor: "#5c94fc",
  music: "level1",
  width: W,
  height: H,
  tiles: createTiles(),
  entities: [
    // Coins
    { type: "coin", x: 10 * TILE_SIZE + 16, y: 9 * TILE_SIZE + 16, alive: true },
    { type: "coin", x: 25 * TILE_SIZE + 16, y: 11 * TILE_SIZE + 16, alive: true },
    { type: "coin", x: 42 * TILE_SIZE + 16, y: 7 * TILE_SIZE + 16, alive: true },
    { type: "coin", x: 43 * TILE_SIZE + 16, y: 7 * TILE_SIZE + 16, alive: true },
    // Enemies
    { type: "goomba", x: 12 * TILE_SIZE, y: 12 * TILE_SIZE + 8, vx: -1.5, vy: 0, dir: -1, alive: true },
    { type: "spiny", x: 33 * TILE_SIZE, y: 12 * TILE_SIZE + 8, vx: -1.5, vy: 0, dir: -1, alive: true },
    { type: "flying", x: 38 * TILE_SIZE, y: 10 * TILE_SIZE, vx: -1.5, vy: 0, dir: -1, alive: true, baseY: 10 * TILE_SIZE, frame: 0 },
    // Flag at the end
    { type: "flag", x: 47 * TILE_SIZE + 16, y: 11 * TILE_SIZE, alive: true },
    // Fake flag (troll!)
    { type: "fake_flag", x: 45 * TILE_SIZE + 16, y: 11 * TILE_SIZE, alive: true },
  ],
  trolls: [
    {
      triggerX: 22 * TILE_SIZE,
      action: "message",
      text: "Cuidado com os espinhos! 😈",
      duration: 90,
      triggered: false,
    },
    {
      triggerX: 34 * TILE_SIZE,
      action: "shake",
      duration: 400,
      triggered: false,
    },
    {
      triggerX: 44 * TILE_SIZE,
      action: "spawn",
      entityType: "goomba",
      spawnX: 46 * TILE_SIZE,
      spawnY: 12 * TILE_SIZE,
      triggered: false,
    },
  ],
  playerStart: { x: 3 * TILE_SIZE, y: 12 * TILE_SIZE },
};
