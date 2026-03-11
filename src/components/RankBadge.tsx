import { getRankByLevel } from "@/lib/ranks";

export default function RankBadge({ rankLevel }: { rankLevel: number }) {
  const rank = getRankByLevel(rankLevel);
  return (
    <span
      className="text-xs font-bold px-2 py-0.5 rounded-full"
      style={{ backgroundColor: rank.color + "20", color: rank.color }}
    >
      {rank.title}
    </span>
  );
}
