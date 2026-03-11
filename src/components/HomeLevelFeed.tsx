"use client";

import { useEffect, useState } from "react";
import LevelCard from "./LevelCard";

interface LevelSummary {
  id: string;
  name: string;
  subtitle: string | null;
  plays: number;
  likes: number;
  difficulty: number;
  bg_color: string;
  profiles: { nickname: string; photo_url: string | null };
  author_id: string;
}

export default function HomeLevelFeed({
  title,
  apiUrl,
}: {
  title: string;
  apiUrl: string;
}) {
  const [levels, setLevels] = useState<LevelSummary[]>([]);

  useEffect(() => {
    fetch(apiUrl)
      .then((r) => r.json())
      .then((data) => setLevels(data.levels || []))
      .catch(() => {});
  }, [apiUrl]);

  return (
    <section className="max-w-7xl mx-auto px-6 py-12">
      <h3 className="text-2xl font-bold mb-6">{title}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {levels.length === 0
          ? [1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-card border border-border rounded-lg p-6"
              >
                <div className="h-40 bg-muted rounded-md mb-4 flex items-center justify-center text-muted-foreground">
                  Preview do Nível
                </div>
                <h4 className="font-bold mb-1">Nível em Breve</h4>
                <p className="text-sm text-muted-foreground">
                  Níveis da comunidade aparecerão aqui
                </p>
              </div>
            ))
          : levels.map((level) => (
              <LevelCard
                key={level.id}
                id={level.id}
                name={level.name}
                subtitle={level.subtitle}
                plays={level.plays}
                likes={level.likes}
                difficulty={level.difficulty}
                bgColor={level.bg_color}
                authorName={level.profiles?.nickname}
                authorId={level.author_id}
              />
            ))}
      </div>
    </section>
  );
}
