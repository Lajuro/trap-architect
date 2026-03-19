// ============================================================
// Texture Cache — bridges Phaser procedural textures to React UI
// ============================================================

/** Map of Phaser texture key → base64 data URL */
export const textureCache: Record<string, string> = {};

/** Palette item ID → texture key to show as thumbnail */
export const PALETTE_TEXTURE_KEY: Record<number, string> = {
  // Terrain
  1: "tile_ground_top",
  3: "tile_brick_top",
  4: "tile_castle",
  5: "tile_used",
  6: "tile_pipe_tl",
  10: "tile_ice",
  11: "tile_cloud",
  41: "tile_sand_top",
  42: "tile_snow_top",
  43: "tile_wood",
  44: "tile_mossy_stone",
  45: "tile_metal",
  // Danger
  12: "tile_spike",
  13: "tile_ground_top",
  14: "tile_lava",
  15: "tile_ground_top",
  39: "tile_gravity_zone",
  54: "tile_gravity_normal",
  // Interactive
  16: "tile_question",
  17: "tile_question",
  19: "tile_spring",
  20: "tile_trampoline",
  21: "tile_platform",
  22: "tile_conveyor",
  23: "tile_conveyor",
  24: "tile_checkpoint",
  33: "tile_powerup_block",
  37: "tile_slide_block",
  38: "tile_timed_block",
  40: "tile_moving_platform",
  46: "tile_grate",
  47: "tile_water",
  // Decoration
  48: "tile_fence",
  49: "tile_torch",
  50: "tile_chain",
  51: "tile_sign",
  52: "tile_crystal",
  53: "tile_mushroom",
  // Keys & Locks
  58: "tile_key_red",
  59: "tile_key_blue",
  60: "tile_key_green",
  61: "tile_lock_red",
  62: "tile_lock_blue",
  63: "tile_lock_green",
  // Entities
  25: "player",
  26: "entity_coin",
  27: "entity_goomba",
  28: "entity_fast_goomba",
  29: "entity_spiny",
  30: "entity_flying",
  31: "entity_flag",
  32: "entity_fake_flag",
  34: "entity_mushroom",
  35: "entity_star",
  36: "entity_fire_flower",
};

/**
 * Extract palette-relevant textures from Phaser and cache as data URLs.
 * Called once at the end of BootScene.generateTextures().
 */
export function populateTextureCache(
  textures: { get(key: string): { getSourceImage(): unknown } },
): void {
  const needed = new Set(Object.values(PALETTE_TEXTURE_KEY));
  // Also cache conveyor animation frames
  needed.add("tile_conveyor_f1");
  needed.add("tile_conveyor_f2");
  needed.add("tile_conveyor_f3");
  for (const key of needed) {
    try {
      const source = textures.get(key).getSourceImage();
      if (source && typeof (source as HTMLCanvasElement).toDataURL === "function") {
        textureCache[key] = (source as HTMLCanvasElement).toDataURL();
      }
    } catch {
      // texture not found — skip
    }
  }
}
