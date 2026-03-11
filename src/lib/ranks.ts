export interface Rank {
  level: number;
  name: string;
  minLikes: number;
  color: string;
  title: string;
}

export const RANKS: Rank[] = [
  { level: 0, name: "novice", minLikes: 0, color: "#9ca3af", title: "Novato" },
  { level: 1, name: "builder", minLikes: 5, color: "#60a5fa", title: "Construtor" },
  { level: 2, name: "architect", minLikes: 20, color: "#a78bfa", title: "Arquiteto" },
  { level: 3, name: "master", minLikes: 50, color: "#fbbf24", title: "Mestre" },
  { level: 4, name: "legend", minLikes: 100, color: "#f472b6", title: "Lenda" },
];

/** Special rank level for admins (stored as creator_rank = 99 in DB) */
export const ADMIN_RANK: Rank = {
  level: 99,
  name: "admin",
  minLikes: 0,
  color: "#ef4444",
  title: "Admin",
};

export function getRankByLevel(level: number): Rank {
  if (level === 99) return ADMIN_RANK;
  return RANKS.find((r) => r.level === level) || RANKS[0];
}

export function getRankByLikes(likes: number): Rank {
  return [...RANKS].reverse().find((r) => likes >= r.minLikes) || RANKS[0];
}

export function isAdmin(creatorRank: number): boolean {
  return creatorRank === 99;
}
