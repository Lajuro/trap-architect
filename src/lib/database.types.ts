/** Database types mirroring Supabase schema */

export interface DbProfile {
  id: string;
  nickname: string;
  photo_url: string | null;
  created_at: string;
  last_seen: string;
  levels_published: number;
  total_plays: number;
  total_likes: number;
  creator_coins: number;
  creator_rank: number;
  devs_choice_count: number;
  levels_completed: number;
  total_deaths: number;
  total_coins: number;
  time_played: number;
  equipped_skin: string;
  equipped_trail: string;
  equipped_death_effect: string;
  equipped_frame: string;
  unlocked_cosmetics: string[];
}

export interface DbLevel {
  id: string;
  author_id: string;
  name: string;
  subtitle: string | null;
  bg_color: string;
  music: string;
  grid_w: number;
  grid_h: number;
  tiles: number[][];
  entities: { type: string; gx: number; gy: number }[];
  trolls: DbTrollTrigger[];
  player_start: { x: number; y: number };
  created_at: string;
  updated_at: string;
  published: boolean;
  plays: number;
  likes: number;
  difficulty: number;
  featured: boolean;
  featured_category: string | null;
  thumbnail: string | null;
}

export interface DbTrollTrigger {
  triggerX: number;
  action: string;
  triggered: boolean;
  entityType?: string;
  spawnX?: number;
  spawnY?: number;
  duration?: number;
  text?: string;
  startX?: number;
  count?: number;
}

export interface DbLevelLike {
  user_id: string;
  level_id: string;
  created_at: string;
}

export interface DbLevelPlay {
  id: string;
  user_id: string | null;
  level_id: string;
  completed: boolean;
  deaths: number;
  coins: number;
  time_ms: number;
  created_at: string;
}

/** Level with author info joined */
export interface DbLevelWithAuthor extends DbLevel {
  profiles: Pick<DbProfile, "nickname" | "photo_url" | "creator_rank">;
}
