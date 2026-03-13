import Link from "next/link";
import Image from "next/image";
import { getDifficultyLabel } from "@/lib/difficulty";

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
}: LevelCardProps) {
  return (
    <Link
      href={`/play/${id}`}
      className="bg-card border border-border rounded-lg p-6 hover:border-primary/50 transition-colors block"
    >
      {thumbnail ? (
        <Image
          src={thumbnail}
          alt={name}
          width={300}
          height={120}
          className="w-full h-40 rounded-md mb-4 object-cover"
          style={{ imageRendering: "pixelated" }}
          unoptimized
        />
      ) : (
        <div
          className="h-40 rounded-md mb-4 flex items-center justify-center text-white/60 text-sm font-bold"
          style={{ backgroundColor: bgColor || "#1a1a2e" }}
        >
          {name}
        </div>
      )}
      <h4 className="font-bold mb-1">{name}</h4>
      {subtitle && (
        <p className="text-sm text-muted-foreground mb-2">{subtitle}</p>
      )}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex gap-3">
          <span>▶ {plays}</span>
          <span>♥ {likes}</span>
          {(() => {
            const d = getDifficultyLabel(difficulty, plays);
            return (
              <span style={{ color: d.color }}>{d.emoji} {d.label}</span>
            );
          })()}
        </div>
        {authorName && authorId && (
          <Link
            href={`/creator/${authorId}`}
            className="hover:text-foreground"
            onClick={(e) => e.stopPropagation()}
          >
            por {authorName}
          </Link>
        )}
      </div>
    </Link>
  );
}
