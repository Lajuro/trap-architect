import { ACHIEVEMENTS } from "@/game/constants";
import type { SupabaseClient } from "@supabase/supabase-js";

interface ProfileStats {
  total_deaths: number;
  levels_completed: number;
  levels_published: number;
  total_coins: number;
  campaign_completed: boolean;
  total_likes: number;
  devs_choice_count: number;
}

interface PlayResult {
  completed: boolean;
  deaths: number;
  time_ms: number;
}

/**
 * Return achievement IDs that should be unlocked given player stats.
 * Does NOT check which are already unlocked — caller should diff.
 */
export function getEligibleAchievements(
  stats: ProfileStats,
  playResult?: PlayResult,
): string[] {
  const eligible: string[] = [];

  // Death milestones
  if (stats.total_deaths >= 1) eligible.push("first_death");
  if (stats.total_deaths >= 100) eligible.push("100_deaths");
  if (stats.total_deaths >= 1000) eligible.push("1000_deaths");

  // Level completion milestones
  if (stats.levels_completed >= 1) eligible.push("first_clear");
  if (stats.levels_completed >= 10) eligible.push("10_clears");
  if (stats.levels_completed >= 50) eligible.push("50_clears");
  if (stats.levels_completed >= 100) eligible.push("100_clears");

  // Creator milestones
  if (stats.levels_published >= 1) eligible.push("first_publish");
  if (stats.levels_published >= 10) eligible.push("10_publish");

  // Coins
  if (stats.total_coins >= 1000) eligible.push("1000_coins");

  // Campaign
  if (stats.campaign_completed) eligible.push("campaign_done");

  // Social
  if (stats.total_likes >= 100) eligible.push("liked_100");
  if (stats.devs_choice_count >= 1) eligible.push("devs_choice");

  // Per-play achievements
  if (playResult?.completed) {
    if (playResult.time_ms <= 10_000) eligible.push("speedster");
    if (playResult.deaths === 0) eligible.push("no_death_run");
  }

  return eligible;
}

/**
 * Check and unlock new achievements for a user.
 * Returns array of newly unlocked achievement IDs.
 */
export async function checkAndUnlockAchievements(
  supabase: SupabaseClient,
  userId: string,
  playResult?: PlayResult,
): Promise<string[]> {
  // Fetch profile stats
  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "total_deaths, levels_completed, levels_published, total_coins, campaign_completed, total_likes, devs_choice_count"
    )
    .eq("id", userId)
    .single();

  if (!profile) return [];

  // total_likes is actually total_likes_received in some contexts; adapt to what's in the profile
  const stats: ProfileStats = {
    total_deaths: profile.total_deaths ?? 0,
    levels_completed: profile.levels_completed ?? 0,
    levels_published: profile.levels_published ?? 0,
    total_coins: profile.total_coins ?? 0,
    campaign_completed: profile.campaign_completed ?? false,
    total_likes: profile.total_likes ?? 0,
    devs_choice_count: profile.devs_choice_count ?? 0,
  };

  const eligible = getEligibleAchievements(stats, playResult);
  if (eligible.length === 0) return [];

  // Fetch already-unlocked achievements
  const { data: existing } = await supabase
    .from("user_achievements")
    .select("achievement_id")
    .eq("user_id", userId);

  const alreadyUnlocked = new Set(
    (existing ?? []).map((r: { achievement_id: string }) => r.achievement_id)
  );

  const newAchievements = eligible.filter((id) => !alreadyUnlocked.has(id));
  if (newAchievements.length === 0) return [];

  // Insert new achievements
  const rows = newAchievements.map((id) => ({
    user_id: userId,
    achievement_id: id,
  }));

  await supabase.from("user_achievements").insert(rows);

  return newAchievements;
}

/** Get achievement metadata by ID */
export function getAchievementById(id: string) {
  return ACHIEVEMENTS.find((a) => a.id === id);
}
