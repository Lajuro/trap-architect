import type { DbLevel } from "@/lib/database.types";
import type {
  ParsedLevel,
  TrollTrigger,
  GameEntity,
  EntityType,
} from "@/game/types";
import { TILE_SIZE } from "@/game/constants";

/** Convert DB entities to GameEntity[] with pixel positions */
export function dbEntitiesToGameEntities(
  entities: { type: string; gx: number; gy: number }[],
): GameEntity[] {
  return entities.map((e) => ({
    type: e.type as EntityType,
    x: e.gx * TILE_SIZE,
    y: e.gy * TILE_SIZE,
    alive: true,
    ...(["goomba", "fast_goomba", "spiny"].includes(e.type)
      ? { vx: -1.5, vy: 0, dir: -1 }
      : {}),
    ...(e.type === "flying"
      ? { vx: -1.5, vy: 0, dir: -1, baseY: e.gy * TILE_SIZE }
      : {}),
  }));
}

/** Convert DB troll triggers to typed TrollTrigger[] */
export function dbTrollsToTrollTriggers(
  trolls: DbLevel["trolls"],
): TrollTrigger[] {
  return trolls.map((t) => ({
    triggerX: t.triggerX,
    action: t.action as TrollTrigger["action"],
    triggered: false,
    ...("entityType" in t ? { entityType: t.entityType as EntityType } : {}),
    ...("spawnX" in t ? { spawnX: t.spawnX } : {}),
    ...("spawnY" in t ? { spawnY: t.spawnY } : {}),
    ...("duration" in t ? { duration: t.duration } : {}),
    ...("text" in t ? { text: t.text } : {}),
    ...("startX" in t ? { startX: t.startX } : {}),
    ...("count" in t ? { count: t.count } : {}),
  }));
}

/** Convert a DB level to a ParsedLevel ready for the game engine */
export function dbLevelToParsedLevel(db: DbLevel): ParsedLevel {
  return {
    name: db.name,
    subtitle: db.subtitle ?? undefined,
    bgColor: db.bg_color,
    music: db.music,
    width: db.grid_w,
    height: db.grid_h,
    tiles: db.tiles,
    entities: dbEntitiesToGameEntities(db.entities),
    trolls: dbTrollsToTrollTriggers(db.trolls),
    playerStart: db.player_start,
    backgroundTiles: db.background_tiles ?? undefined,
    theme: (db.theme as ParsedLevel["theme"]) ?? undefined,
  };
}
