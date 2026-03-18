import Link from "next/link";
import Image from "next/image";
import { getDifficultyLabel } from "@/lib/difficulty";
import PixelIcon from "@/components/ui/PixelIcon";
import DevPickRibbon from "@/components/ui/DevPickRibbon";

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
}: LevelCardProps) {
  const d = getDifficultyLabel(difficulty, plays);

  return (
    <Link
      href={`/play/${id}`}
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
          {name}
        </h4>
        {subtitle && (
          <p className="text-[7px] text-muted-foreground mb-2 truncate">{subtitle}</p>
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
              {d.label}
            </span>
          </div>
          {authorName && authorId && (
            <Link
              href={`/creator/${authorId}`}
              className="hover:text-foreground transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              {authorName}
            </Link>
          )}
        </div>
      </div>
    </Link>
  );
}
