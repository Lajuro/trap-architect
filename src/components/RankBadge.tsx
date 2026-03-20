"use client";

import { useTranslations } from "next-intl";
import { getRankByLevel } from "@/lib/ranks";

export default function RankBadge({ rankLevel }: { rankLevel: number }) {
  const t = useTranslations("ranksLib");
  const rank = getRankByLevel(rankLevel);
  return (
    <span
      className="text-[8px] font-bold px-2 py-0.5 border-2 uppercase tracking-wider"
      style={{ borderColor: rank.color, color: rank.color, backgroundColor: rank.color + "15" }}
    >
      {t(`${rank.level}`)}
    </span>
  );
}
