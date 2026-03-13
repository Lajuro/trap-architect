/** Cosmetics sync utility — hydrate localStorage from DB on login */

const LS_KEYS = {
  equippedSkin: "trap_equipped_skin",
  equippedTrail: "trap_equipped_trail",
  equippedDeathEffect: "trap_equipped_death_effect",
  equippedFrame: "trap_equipped_frame",
  unlocked: "trap_unlocked_cosmetics",
  campaignProgress: "trap_architect_progress",
} as const;

interface ProfileCosmetics {
  equipped_skin: string;
  equipped_trail: string;
  equipped_death_effect: string;
  equipped_frame: string;
  unlocked_cosmetics: string[];
  campaign_progress: Record<string, { completed: boolean; deaths: number; coins: number }>;
  campaign_completed: boolean;
}

/** Hydrate localStorage from DB profile data. Merges localStorage items not in DB. */
export function hydrateFromProfile(profile: ProfileCosmetics): void {
  if (typeof window === "undefined") return;

  // Cosmetics
  localStorage.setItem(LS_KEYS.equippedSkin, profile.equipped_skin || "default");
  localStorage.setItem(LS_KEYS.equippedTrail, profile.equipped_trail || "trail_none");
  localStorage.setItem(LS_KEYS.equippedDeathEffect, profile.equipped_death_effect || "death_default");
  localStorage.setItem(LS_KEYS.equippedFrame, profile.equipped_frame || "frame_none");

  // Merge unlocked cosmetics (union of local + DB)
  const localUnlocked = getLocalArray(LS_KEYS.unlocked);
  const dbUnlocked = profile.unlocked_cosmetics || [];
  const merged = [...new Set([...localUnlocked, ...dbUnlocked])];
  localStorage.setItem(LS_KEYS.unlocked, JSON.stringify(merged));

  // Campaign progress merge
  const localProgress = getLocalJson(LS_KEYS.campaignProgress) as Record<string, { completed: boolean; deaths: number; coins: number }>;
  const dbProgress = profile.campaign_progress || {};
  const mergedProgress = mergeCampaignProgress(localProgress, dbProgress);
  localStorage.setItem(LS_KEYS.campaignProgress, JSON.stringify(mergedProgress));

  // Return items needing sync back to DB
  return;
}

/** Merge campaign progress: completed=true wins, keep best stats */
export function mergeCampaignProgress(
  local: Record<string, { completed: boolean; deaths: number; coins: number }>,
  db: Record<string, { completed: boolean; deaths: number; coins: number }>
): Record<string, { completed: boolean; deaths: number; coins: number }> {
  const allKeys = new Set([...Object.keys(local), ...Object.keys(db)]);
  const merged: Record<string, { completed: boolean; deaths: number; coins: number }> = {};

  for (const key of allKeys) {
    const l = local[key];
    const d = db[key];
    if (l && d) {
      merged[key] = {
        completed: l.completed || d.completed,
        deaths: Math.min(l.deaths, d.deaths),
        coins: Math.max(l.coins, d.coins),
      };
    } else {
      merged[key] = l || d;
    }
  }

  return merged;
}

/** Get data needing to be pushed back to DB after merge */
export function getLocalCosmeticsForSync(): {
  unlocked: string[];
  campaignProgress: Record<string, { completed: boolean; deaths: number; coins: number }>;
} {
  return {
    unlocked: getLocalArray(LS_KEYS.unlocked),
    campaignProgress: getLocalJson(LS_KEYS.campaignProgress) as Record<string, { completed: boolean; deaths: number; coins: number }>,
  };
}

function getLocalArray(key: string): string[] {
  try {
    return JSON.parse(localStorage.getItem(key) || "[]") as string[];
  } catch {
    return [];
  }
}

function getLocalJson(key: string): unknown {
  try {
    return JSON.parse(localStorage.getItem(key) || "{}");
  } catch {
    return {};
  }
}
