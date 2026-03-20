"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import LevelCard from "./LevelCard";
import HudPanel from "./ui/HudPanel";

interface LevelSummary {
  id: string;
  name: string;
  subtitle: string | null;
  plays: number;
  likes: number;
  difficulty: number;
  bg_color: string;
  thumbnail: string | null;
  profiles: { nickname: string; photo_url: string | null };
  author_id: string;
  featured?: boolean;
  featured_category?: string | null;
  tags?: string[] | null;
  avg_rating?: number | null;
  rating_count?: number | null;
}

export default function HomeLevelFeed({
  title,
  apiUrl,
  icon,
}: {
  title: string;
  apiUrl: string;
  icon?: ReactNode;
}) {
  const [levels, setLevels] = useState<LevelSummary[]>([]);
  const [error, setError] = useState(false);
  const tc = useTranslations("common");

  useEffect(() => {
    setError(false);
    fetch(apiUrl)
      .then((r) => r.json())
      .then((data) => setLevels(data.levels || []))
      .catch(() => setError(true));
  }, [apiUrl]);

  return (
    <section className="max-w-7xl mx-auto px-4 py-8" aria-label={title}>
      <HudPanel>
        <div className="flex items-center gap-2 mb-4">
          {icon}
          <h3 className="text-[11px] font-bold uppercase tracking-wider">{title}</h3>
        </div>
        {error ? (
          <div className="text-center py-8">
            <p className="text-[9px] text-muted-foreground mb-3">{tc("failedToLoadLevels")}</p>
            <button
              onClick={() => {
                setError(false);
                fetch(apiUrl)
                  .then((r) => r.json())
                  .then((data) => setLevels(data.levels || []))
                  .catch(() => setError(true));
              }}
              className="text-[8px] text-primary hover:underline uppercase tracking-wider"
            >
              {tc("tryAgain")}
            </button>
          </div>
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {levels.length === 0
            ? [1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-muted/30 border-2 border-border"
                >
                  <div className="h-36 bg-muted/50 flex items-center justify-center text-muted-foreground text-[8px] uppercase tracking-wider">
                    ...
                  </div>
                  <div className="p-3 border-t-2 border-border">
                    <div className="h-3 bg-muted/40 w-2/3 mb-2" />
                    <div className="h-2 bg-muted/30 w-1/3" />
                  </div>
                </div>
              ))
            : levels.map((level) => (
                <LevelCard
                  key={level.id}
                  id={level.id}
                  name={level.name}
                  subtitle={level.subtitle}
                  authorName={level.profiles?.nickname}
                  authorId={level.author_id}
                  plays={level.plays}
                  likes={level.likes}
                  difficulty={level.difficulty}
                  bgColor={level.bg_color}
                  thumbnail={level.thumbnail}
                  featured={level.featured}
                  featuredCategory={level.featured_category}
                  tags={(level.tags ?? []) as import("@/game/types").LevelTag[]}
                  avgRating={level.avg_rating ?? undefined}
                  ratingCount={level.rating_count ?? undefined}
                />
              ))}
        </div>
        )}
      </HudPanel>
    </section>
  );
}
