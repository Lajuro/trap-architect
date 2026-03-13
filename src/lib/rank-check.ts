import { CREATOR_RANKS } from "@/game/constants";
import { SupabaseClient } from "@supabase/supabase-js";

/** Compute the correct creator rank level from profile stats */
export function computeRankLevel(stats: {
  levels_published: number;
  total_plays: number;
  total_likes: number;
  has_devs_choice?: boolean;
}): number {
  let rank = 0;
  for (const r of CREATOR_RANKS) {
    if (
      stats.levels_published >= r.minLevels &&
      stats.total_plays >= r.minPlays &&
      stats.total_likes >= r.minLikes &&
      (!r.needsDevsChoice || stats.has_devs_choice)
    ) {
      rank = r.level;
    }
  }
  return rank;
}

/**
 * Recalculate and update creator_rank for a user.
 * Returns { oldRank, newRank } if rank changed, null otherwise.
 */
export async function recalcCreatorRank(
  supabase: SupabaseClient,
  userId: string
): Promise<{ oldRank: number; newRank: number } | null> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("creator_rank, levels_published, total_plays, total_likes")
    .eq("id", userId)
    .single();

  if (!profile) return null;

  // Check if user has any dev's choice level
  const { count } = await supabase
    .from("levels")
    .select("id", { count: "exact", head: true })
    .eq("author_id", userId)
    .eq("featured", true);

  const newRank = computeRankLevel({
    levels_published: profile.levels_published,
    total_plays: profile.total_plays,
    total_likes: profile.total_likes,
    has_devs_choice: (count ?? 0) > 0,
  });

  const oldRank = profile.creator_rank;

  // Admin rank (99) should never be overwritten
  if (oldRank === 99) return null;

  if (newRank !== oldRank) {
    await supabase
      .from("profiles")
      .update({ creator_rank: newRank })
      .eq("id", userId);

    return { oldRank, newRank };
  }

  return null;
}
