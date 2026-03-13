import { TileType } from "@/game/types";

/** Map tiles to category colors for thumbnail rendering */
const TILE_COLORS: Record<number, string> = {
  [TileType.GROUND_TOP]: "#22C55E",
  [TileType.GROUND]: "#166534",
  [TileType.BRICK]: "#92400E",
  [TileType.QUESTION]: "#EAB308",
  [TileType.SPIKE]: "#EF4444",
  [TileType.HIDDEN_SPIKE]: "#EF4444",
  [TileType.FAKE_GROUND]: "#22C55E", // Looks like ground
  [TileType.INVISIBLE]: "#334155",
  [TileType.PIPE_TL]: "#16A34A",
  [TileType.PIPE_TR]: "#16A34A",
  [TileType.PIPE_BL]: "#15803D",
  [TileType.PIPE_BR]: "#15803D",
  [TileType.LAVA]: "#DC2626",
  [TileType.TROLL_Q]: "#F59E0B",
  [TileType.USED]: "#6B7280",
  [TileType.CASTLE]: "#9CA3AF",
  [TileType.SPRING]: "#3B82F6",
  [TileType.CLOUD]: "#E0E7FF",
  [TileType.PLATFORM]: "#8B5CF6",
  [TileType.ICE]: "#67E8F9",
  [TileType.CONVEYOR_L]: "#A78BFA",
  [TileType.CONVEYOR_R]: "#A78BFA",
  [TileType.CHECKPOINT]: "#FBBF24",
  [TileType.TRAMPOLINE]: "#F97316",
};

const ENTITY_COLORS: Record<string, string> = {
  coin: "#FFD700",
  flag: "#00FF00",
  fake_flag: "#00FF00",
  goomba: "#8B4513",
  fast_goomba: "#A0522D",
  spiny: "#FF6347",
  flying: "#FF69B4",
  player: "#FF8C00",
};

/** Pixel scale per tile in thumbnail */
const PX = 3;

/**
 * Generate a base64 PNG thumbnail from level tile data.
 * Each tile = PXxPX pixels, entities rendered as dots.
 */
export function generateThumbnail(
  tiles: number[][],
  gridW: number,
  gridH: number,
  entities: { type: string; gx: number; gy: number }[],
  playerStart: { x: number; y: number },
  bgColor: string,
): string {
  const w = gridW * PX;
  const h = gridH * PX;

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;

  // Fill background
  ctx.fillStyle = bgColor || "#1a1a2e";
  ctx.fillRect(0, 0, w, h);

  // Draw tiles
  for (let gy = 0; gy < gridH; gy++) {
    for (let gx = 0; gx < gridW; gx++) {
      const tile = tiles[gy]?.[gx] ?? TileType.AIR;
      if (tile === TileType.AIR) continue;
      const color = TILE_COLORS[tile];
      if (!color) continue;
      ctx.fillStyle = color;
      ctx.fillRect(gx * PX, gy * PX, PX, PX);
    }
  }

  // Draw entities
  for (const e of entities) {
    const color = ENTITY_COLORS[e.type];
    if (!color) continue;
    ctx.fillStyle = color;
    ctx.fillRect(e.gx * PX, e.gy * PX, PX, PX);
  }

  // Draw player start
  ctx.fillStyle = ENTITY_COLORS.player;
  ctx.fillRect(playerStart.x * PX, playerStart.y * PX, PX, PX);

  return canvas.toDataURL("image/png");
}
