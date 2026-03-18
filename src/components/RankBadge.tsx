import { getRankByLevel } from "@/lib/ranks";

export default function RankBadge({ rankLevel }: { rankLevel: number }) {
  const rank = getRankByLevel(rankLevel);
  return (
    <span
      className="text-[8px] font-bold px-2 py-0.5 border-2 uppercase tracking-wider"
      style={{ borderColor: rank.color, color: rank.color, backgroundColor: rank.color + "15" }}
    >
      {rank.title}
    </span>
  );
}
