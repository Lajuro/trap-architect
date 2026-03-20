import { Link } from "@/i18n/navigation";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { getDifficultyLabel } from "@/lib/difficulty";
import PixelIcon from "@/components/ui/PixelIcon";
import DevPickRibbon from "@/components/ui/DevPickRibbon";
import { TAG_CONFIG, type LevelTag } from "@/game/types";

interface LevelCardProps {
  id: string;
  name: string;
  subtitle?: string | null;
  authorName?: string;
  authorId?: string;
  authorFrame?: string;
  plays: number;
  likes: number;
  difficulty: number;
  bgColor?: string;
  thumbnail?: string | null;
  featured?: boolean;
  featuredCategory?: string | null;
  tags?: string[] | null;
  avgRating?: number | null;
  ratingCount?: number | null;
}

export default function LevelCard({
  id,
  name,
  subtitle,
  authorName,
  authorId,
  plays,
  likes,
  difficulty,
  bgColor,
  thumbnail,
  featured,
  featuredCategory,
  tags,
  avgRating,
  ratingCount,
}: LevelCardProps) {
  const d = getDifficultyLabel(difficulty, plays);
  const td = useTranslations("difficulty");
  const tt = useTranslations("tags");

  return (
    <div
      className="relative bg-card border-2 border-border hover:border-primary/60 transition-all block group overflow-hidden hover:scale-[1.02]"
    >
      {featured && <DevPickRibbon category={featuredCategory} />}

      {thumbnail ? (
        <Image
          src={thumbnail}
          alt={name}
          width={300}
          height={120}
          className="w-full h-36 object-cover"
          style={{ imageRendering: "pixelated" }}
          unoptimized
        />
      ) : (
        <div
          className="h-36 flex items-center justify-center text-white/40 text-[8px] font-bold uppercase tracking-wider"
          style={{ backgroundColor: bgColor || "#1a1a2e" }}
        >
          {name}
        </div>
      )}

      {/* Info section */}
      <div className="p-3 border-t-2 border-border">
        <h4 className="text-[9px] font-bold mb-1 truncate group-hover:text-primary transition-colors">
          <Link href={`/play/${id}`} className="after:absolute after:inset-0">
            {name}
          </Link>
        </h4>
        {subtitle && (
          <p className="text-[7px] text-muted-foreground mb-2 truncate">{subtitle}</p>
        )}

        {/* Tags */}
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {tags.slice(0, 3).map((tag) => {
              const cfg = TAG_CONFIG[tag as LevelTag];
              if (!cfg) return null;
              return (
                <span
                  key={tag}
                  className="px-1.5 py-0.5 text-[6px] font-bold uppercase tracking-wider border"
                  style={{ color: cfg.color, borderColor: cfg.color + "44", backgroundColor: cfg.color + "15" }}
                >
                  {tt(cfg.labelKey)}
                </span>
              );
            })}
          </div>
        )}

        {/* Stats bar */}
        <div className="flex items-center justify-between text-[7px] text-muted-foreground">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <PixelIcon name="play-count" size={10} />
              {plays}
            </span>
            <span className="flex items-center gap-1">
              <PixelIcon name="heart" size={10} />
              {likes}
            </span>
            <span className="flex items-center gap-1" style={{ color: d.color }}>
              <PixelIcon name={d.icon} size={10} />
              {td(d.labelKey)}
            </span>
            {avgRating != null && ratingCount != null && ratingCount >= 5 && (
              <span className="flex items-center gap-0.5 text-yellow-400">
                ★ {avgRating.toFixed(1)}
              </span>
            )}
          </div>
          {authorName && authorId && (
            <Link
              href={`/creator/${authorId}`}
              className="relative z-10 hover:text-foreground transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              {authorName}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
