"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import HudPanel from "@/components/ui/HudPanel";
import HudButton from "@/components/ui/HudButton";
import { PixelIcon } from "@/components/ui/PixelIcon";
import { RANKS, ADMIN_RANK } from "@/lib/ranks";
import { playUIClick } from "@/game/audio";

interface UserProfile {
  id: string;
  nickname: string;
  photo_url: string | null;
  creator_rank: number;
  levels_published: number;
  total_plays: number;
  total_likes: number;
  creator_coins: number;
  created_at: string;
  last_seen: string;
  banned_at: string | null;
  levels_completed: number;
  total_deaths: number;
  total_coins: number;
  time_played: number;
  equipped_skin: string;
  equipped_trail: string;
  equipped_death_effect: string;
  equipped_frame: string;
  equipped_title: string;
  unlocked_cosmetics: string[];
}

interface UserLevel {
  id: string;
  name: string;
  published: boolean;
  plays: number;
  likes: number;
  featured: boolean;
  created_at: string;
  difficulty: number;
  avg_rating: number;
  rating_count: number;
  tags: string[] | null;
  theme: string | null;
  weekly_challenge_date: string | null;
}

interface Achievement {
  achievement_id: string;
  unlocked_at: string;
}

const ALL_RANKS = [...RANKS, ADMIN_RANK];

export default function AdminUserDetailPage() {
  const params = useParams();
  const userId = params.id as string;
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [levels, setLevels] = useState<UserLevel[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const t = useTranslations("admin");
  const tc = useTranslations("common");

  useEffect(() => {
    fetch(`/api/admin/users/${userId}`)
      .then((res) => res.json())
      .then((data) => {
        setProfile(data.profile);
        setLevels(data.levels ?? []);
        setAchievements(data.achievements ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [userId]);

  async function handleSetRank(rank: number) {
    setUpdating(true);
    await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, action: "setRank", value: rank }),
    });
    const res = await fetch(`/api/admin/users/${userId}`);
    const data = await res.json();
    setProfile(data.profile);
    setUpdating(false);
  }

  async function handleBan() {
    if (!profile) return;
    const isBanned = !!profile.banned_at;
    if (!isBanned && !window.confirm(t("users.confirmBan"))) return;
    setUpdating(true);
    await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, action: isBanned ? "unban" : "ban" }),
    });
    const res = await fetch(`/api/admin/users/${userId}`);
    const data = await res.json();
    setProfile(data.profile);
    setUpdating(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground text-[9px] uppercase tracking-wider animate-pulse">
          {tc("loadingEllipsis")}
        </p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-red-400 text-[9px]">{t("users.notFound")}</p>
      </div>
    );
  }

  const rank = profile.creator_rank === 99 ? ADMIN_RANK : (ALL_RANKS.find((r) => r.level === profile.creator_rank) || RANKS[0]);
  const isBanned = !!profile.banned_at;

  function formatTime(ms: number) {
    const hours = Math.floor(ms / 3600000);
    const mins = Math.floor((ms % 3600000) / 60000);
    return `${hours}h ${mins}m`;
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-6 w-full">
      {/* Back link */}
      <Link
        href="/admin/users"
        onClick={() => playUIClick()}
        className="text-[8px] text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-1"
      >
        <PixelIcon name="arrow-left" size={10} /> {t("users.backToList")}
      </Link>

      {/* Profile header */}
      <HudPanel variant={isBanned ? "danger" : "default"} className="mb-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 border-2 flex items-center justify-center shrink-0"
            style={{ borderColor: rank.color + "66", backgroundColor: rank.color + "11" }}
          >
            <PixelIcon name="cat" size={28} color={rank.color} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-[13px] font-bold">{profile.nickname}</h1>
              {isBanned && (
                <span className="text-[7px] text-red-400 uppercase tracking-wider flex items-center gap-0.5 bg-red-500/10 px-1.5 py-0.5">
                  <PixelIcon name="ban" size={8} color="#EF4444" /> {t("users.banned")}
                </span>
              )}
              <span className="text-[8px] uppercase tracking-wider px-1.5 py-0.5"
                style={{ color: rank.color, backgroundColor: rank.color + "15" }}
              >
                {rank.title} (Lv.{rank.level})
              </span>
            </div>
            <p className="text-[7px] text-muted-foreground">
              ID: {profile.id}
            </p>
            <p className="text-[7px] text-muted-foreground">
              {t("users.joined")}: {new Date(profile.created_at).toLocaleDateString("pt-BR")}
              {" • "}
              {t("users.lastSeen")}: {new Date(profile.last_seen).toLocaleDateString("pt-BR")}
              {isBanned && profile.banned_at && (
                <> {" • "} {t("users.bannedAt")}: {new Date(profile.banned_at).toLocaleDateString("pt-BR")}</>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <select
              value={profile.creator_rank}
              onChange={(e) => handleSetRank(parseInt(e.target.value))}
              disabled={updating}
              className="text-[8px] bg-black/40 border-2 border-border px-1 py-1"
            >
              {ALL_RANKS.map((r) => (
                <option key={r.level} value={r.level}>{r.title} ({r.level})</option>
              ))}
            </select>
            <HudButton
              onClick={handleBan}
              disabled={updating}
              variant={isBanned ? "secondary" : "danger"}
              size="small"
            >
              {updating ? "..." : isBanned ? t("users.unban") : t("users.ban")}
            </HudButton>
          </div>
        </div>
      </HudPanel>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { icon: "browse" as const, color: "#a78bfa", label: t("users.statsLevels"), value: profile.levels_published },
          { icon: "play" as const, color: "#34d399", label: t("users.statsPlays"), value: profile.total_plays },
          { icon: "heart" as const, color: "#f472b6", label: t("users.statsLikes"), value: profile.total_likes },
          { icon: "coin" as const, color: "#fbbf24", label: tc("coins"), value: profile.creator_coins },
          { icon: "check" as const, color: "#60a5fa", label: t("users.statsCompleted"), value: profile.levels_completed },
          { icon: "skull" as const, color: "#EF4444", label: tc("deaths"), value: profile.total_deaths },
          { icon: "coin" as const, color: "#34d399", label: t("users.statsCoinsCollected"), value: profile.total_coins },
          { icon: "clock" as const, color: "#9ca3af", label: tc("time"), value: formatTime(profile.time_played) },
        ].map((stat, i) => (
          <HudPanel key={i} className="text-center py-3">
            <PixelIcon name={stat.icon} size={14} color={stat.color} />
            <p className="text-[12px] font-bold mt-1" style={{ color: stat.color }}>
              {typeof stat.value === "number" ? stat.value.toLocaleString("pt-BR") : stat.value}
            </p>
            <p className="text-[7px] text-muted-foreground uppercase tracking-wider">{stat.label}</p>
          </HudPanel>
        ))}
      </div>

      {/* Cosmetics */}
      <HudPanel className="mb-6">
        <h2 className="text-[10px] font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
          <PixelIcon name="paint" size={12} color="#fbbf24" /> {t("users.cosmetics")}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[8px] text-muted-foreground">
          <div>
            <span className="text-foreground font-bold">{t("users.skin")}:</span> {profile.equipped_skin}
          </div>
          <div>
            <span className="text-foreground font-bold">{t("users.trail")}:</span> {profile.equipped_trail || "—"}
          </div>
          <div>
            <span className="text-foreground font-bold">{t("users.deathEffect")}:</span> {profile.equipped_death_effect || "—"}
          </div>
          <div>
            <span className="text-foreground font-bold">{t("users.frame")}:</span> {profile.equipped_frame || "—"}
          </div>
        </div>
        <p className="text-[7px] text-muted-foreground mt-2">
          {t("users.unlockedCount", { count: profile.unlocked_cosmetics.length })}
        </p>
      </HudPanel>

      {/* Levels */}
      <HudPanel className="mb-6">
        <h2 className="text-[10px] font-bold uppercase tracking-wider mb-3 flex items-center gap-2">
          <PixelIcon name="browse" size={12} color="#a78bfa" /> {t("users.levelsTitle")} ({levels.length})
        </h2>
        {levels.length === 0 ? (
          <p className="text-[8px] text-muted-foreground">{t("users.noLevels")}</p>
        ) : (
          <div className="space-y-1.5">
            {levels.map((level) => (
              <div key={level.id} className="flex items-center gap-2 py-1 border-b border-border/30 last:border-0">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/play/${level.id}`}
                      className="text-[9px] font-bold hover:text-primary truncate"
                      onClick={() => playUIClick()}
                    >
                      {level.name}
                    </Link>
                    {!level.published && (
                      <span className="text-[6px] bg-yellow-500/20 text-yellow-400 px-1 uppercase">{t("levels.draft")}</span>
                    )}
                    {level.featured && (
                      <span className="text-[6px] bg-yellow-500/20 text-yellow-400 px-1 uppercase flex items-center gap-0.5">
                        <PixelIcon name="star" size={6} color="#fbbf24" /> {t("featured")}
                      </span>
                    )}
                    {level.weekly_challenge_date && (
                      <span className="text-[6px] bg-purple-500/20 text-purple-400 px-1 uppercase">Weekly</span>
                    )}
                  </div>
                  <p className="text-[7px] text-muted-foreground flex items-center gap-2">
                    <span className="flex items-center gap-0.5"><PixelIcon name="play" size={7} color="#888" /> {level.plays}</span>
                    <span className="flex items-center gap-0.5"><PixelIcon name="heart" size={7} color="#888" /> {level.likes}</span>
                    {level.avg_rating > 0 && <span>★{level.avg_rating.toFixed(1)}</span>}
                    <span>{new Date(level.created_at).toLocaleDateString("pt-BR")}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </HudPanel>

      {/* Achievements */}
      <HudPanel className="mb-6">
        <h2 className="text-[10px] font-bold uppercase tracking-wider mb-3 flex items-center gap-2">
          <PixelIcon name="trophy" size={12} color="#fbbf24" /> {t("users.achievementsTitle")} ({achievements.length})
        </h2>
        {achievements.length === 0 ? (
          <p className="text-[8px] text-muted-foreground">{t("users.noAchievements")}</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {achievements.map((a) => (
              <div key={a.achievement_id} className="flex items-center gap-2 text-[8px] p-2 bg-black/20 rounded-sm">
                <PixelIcon name="trophy" size={10} color="#fbbf24" />
                <div>
                  <p className="font-bold">{a.achievement_id}</p>
                  <p className="text-[7px] text-muted-foreground">
                    {new Date(a.unlocked_at).toLocaleDateString("pt-BR")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </HudPanel>
    </main>
  );
}
