"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import HudPanel from "./ui/HudPanel";
import HudButton from "./ui/HudButton";
import { PixelIcon } from "./ui/PixelIcon";
import { getDifficultyLabel } from "@/lib/difficulty";

interface WeeklyLevel {
  id: string;
  name: string;
  subtitle: string | null;
  plays: number;
  likes: number;
  difficulty: number;
  bg_color: string;
  thumbnail: string | null;
  profiles: { nickname: string };
  weekly_challenge_date: string;
}

export default function WeeklyChallenge() {
  const [level, setLevel] = useState<WeeklyLevel | null>(null);

  useEffect(() => {
    fetch("/api/levels/weekly")
      .then((r) => r.json())
      .then((data) => {
        if (data.weekly) setLevel(data.weekly);
      })
      .catch(() => {});
  }, []);

  if (!level) return null;

  const diff = getDifficultyLabel(level.difficulty, level.plays);

  // Calculate days remaining in the week
  const challengeDate = new Date(level.weekly_challenge_date);
  const endDate = new Date(challengeDate.getTime() + 7 * 24 * 60 * 60 * 1000);
  const now = new Date();
  const daysLeft = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)));

  return (
    <section className="max-w-7xl mx-auto px-4 py-8">
      <HudPanel variant="highlight">
        <div className="flex items-center gap-2 mb-4">
          <PixelIcon name="trophy" size={14} color="#FFD700" />
          <h3 className="text-[11px] font-bold uppercase tracking-wider">
            Desafio da Semana
          </h3>
          <span className="ml-auto text-[8px] text-muted-foreground">
            {daysLeft} {daysLeft === 1 ? "dia" : "dias"} restantes
          </span>
        </div>

        <div className="flex gap-4 items-center">
          <Link
            href={`/play/${level.id}`}
            className="relative w-48 h-28 overflow-hidden border-2 border-border shrink-0 block"
            style={{ backgroundColor: level.bg_color || "#1a1a2e" }}
          >
            {level.thumbnail && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={level.thumbnail}
                alt={level.name}
                className="absolute inset-0 w-full h-full object-cover"
                style={{ imageRendering: "pixelated" }}
              />
            )}
            <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-yellow-500/90 text-[7px] font-bold uppercase text-black">
              2× Moedas
            </div>
          </Link>

          <div className="flex-1 min-w-0">
            <Link href={`/play/${level.id}`}>
              <h4 className="text-[10px] font-bold uppercase truncate hover:text-primary transition-colors">
                {level.name}
              </h4>
            </Link>
            {level.subtitle && (
              <p className="text-[8px] text-muted-foreground truncate">{level.subtitle}</p>
            )}
            <div className="flex items-center gap-3 mt-2 text-[8px] text-muted-foreground">
              <span>por {level.profiles?.nickname || "Anônimo"}</span>
              <span className="flex items-center gap-1">
                <PixelIcon name="play" size={8} color="#ff8c00" /> {level.plays}
              </span>
              <span className="flex items-center gap-1" style={{ color: diff.color }}>
                <PixelIcon name={diff.icon} size={8} color={diff.color} /> {diff.label}
              </span>
            </div>
            <div className="mt-3">
              <HudButton href={`/play/${level.id}`} variant="gold" size="small">
                <PixelIcon name="play" size={10} /> Jogar Desafio
              </HudButton>
            </div>
          </div>
        </div>
      </HudPanel>
    </section>
  );
}
