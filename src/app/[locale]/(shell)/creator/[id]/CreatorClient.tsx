"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import LevelCard from "@/components/LevelCard";
import RankBadge from "@/components/RankBadge";
import HudPanel from "@/components/ui/HudPanel";
import HudButton from "@/components/ui/HudButton";
import { PixelIcon } from "@/components/ui/PixelIcon";
import { useTranslations } from "next-intl";

interface CreatorProfile {
  id: string;
  nickname: string;
  photo_url: string | null;
  creator_rank: number;
  levels_published: number;
  total_plays: number;
  total_likes: number;
  created_at: string;
}

interface CreatorLevel {
  id: string;
  name: string;
  subtitle: string | null;
  bg_color: string;
  plays: number;
  likes: number;
  difficulty: number;
  created_at: string;
}

export default function CreatorClient() {
  const params = useParams<{ id: string }>();
  const creatorId = params.id;
  const t = useTranslations("creator");
  const tc = useTranslations("common");

  const [profile, setProfile] = useState<CreatorProfile | null>(null);
  const [levels, setLevels] = useState<CreatorLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchCreator() {
      try {
        const res = await fetch(`/api/creators/${creatorId}`);
        if (!res.ok) {
          setError(t("notFoundShort"));
          return;
        }
        const data = await res.json();
        setProfile(data.profile);
        setLevels(data.levels || []);
      } catch {
        setError(t("loadError"));
      } finally {
        setLoading(false);
      }
    }

    fetchCreator();
  }, [creatorId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground text-[9px] uppercase tracking-wider">{t("loadingProfile")}</p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <p className="text-destructive text-[10px]">
          {error || t("notFoundShort")}
        </p>
        <HudButton href="/browse" variant="secondary" size="small">
          {t("backToBrowse")}
        </HudButton>
      </div>
    );
  }

  const joinDate = new Date(profile.created_at).toLocaleDateString("pt-BR", {
    year: "numeric",
    month: "long",
  });

  return (
    <main className="flex-1 max-w-7xl mx-auto px-4 py-6 w-full overflow-y-auto">
        {/* Profile card */}
        <HudPanel variant="highlight" className="mb-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 border-2 border-primary bg-primary/10 flex items-center justify-center shrink-0">
              <PixelIcon name="cat" size={32} color="#ff8c00" />
            </div>
            <div className="flex-1">
              <h1 className="text-[12px] font-bold mb-1">{profile.nickname}</h1>
              <div className="mb-2">
                <RankBadge rankLevel={profile.creator_rank} />
              </div>
              <p className="text-[8px] text-muted-foreground">
                {t("memberSince", { date: joinDate })}
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mt-4">
            <HudPanel className="text-center !p-3">
              <p className="text-[14px] font-bold text-primary">{profile.levels_published}</p>
              <p className="text-[7px] text-muted-foreground uppercase tracking-wider flex items-center justify-center gap-1">
                <PixelIcon name="create" size={8} color="#888" /> {tc("levels")}
              </p>
            </HudPanel>
            <HudPanel className="text-center !p-3">
              <p className="text-[14px] font-bold text-primary">{profile.total_plays}</p>
              <p className="text-[7px] text-muted-foreground uppercase tracking-wider flex items-center justify-center gap-1">
                <PixelIcon name="play" size={8} color="#888" /> Plays
              </p>
            </HudPanel>
            <HudPanel className="text-center !p-3">
              <p className="text-[14px] font-bold text-primary">{profile.total_likes}</p>
              <p className="text-[7px] text-muted-foreground uppercase tracking-wider flex items-center justify-center gap-1">
                <PixelIcon name="heart" size={8} color="#888" /> Likes
              </p>
            </HudPanel>
          </div>
        </HudPanel>

        {/* Levels */}
        <h2 className="text-[10px] font-bold mb-4 uppercase tracking-wider flex items-center gap-2">
          <PixelIcon name="browse" size={14} color="#ff8c00" /> {t("levelsOf", { nickname: profile.nickname })}
        </h2>
        {levels.length === 0 ? (
          <HudPanel className="text-center py-8">
            <p className="text-[9px] text-muted-foreground">
              {t("noLevelsYet")}
            </p>
          </HudPanel>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {levels.map((level) => (
              <LevelCard
                key={level.id}
                id={level.id}
                name={level.name}
                subtitle={level.subtitle}
                plays={level.plays}
                likes={level.likes}
                difficulty={level.difficulty}
                bgColor={level.bg_color}
              />
            ))}
          </div>
        )}
    </main>
  );
}
