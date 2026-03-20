"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import HudPanel from "@/components/ui/HudPanel";
import HudButton from "@/components/ui/HudButton";
import { PixelIcon } from "@/components/ui/PixelIcon";

interface LevelRow {
  id: string;
  name: string;
  plays: number;
  likes: number;
  avg_rating: number;
  weekly_challenge_date: string | null;
  profiles: { nickname: string };
}

export default function AdminWeeklyPage() {
  const [currentWeekly, setCurrentWeekly] = useState<LevelRow | null>(null);
  const [searchResults, setSearchResults] = useState<LevelRow[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const t = useTranslations("admin");
  const tc = useTranslations("common");

  const loadCurrent = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/levels?sort=created_at&order=desc&limit=100&published=true");
      if (res.ok) {
        const data = await res.json();
        const levels = (data.levels as LevelRow[]) ?? [];
        const weekly = levels.find((l) => l.weekly_challenge_date != null) ?? null;
        setCurrentWeekly(weekly);
      }
    } catch {
      // ignore
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadCurrent(); }, [loadCurrent]);

  const searchLevels = useCallback(async () => {
    if (!search.trim()) { setSearchResults([]); return; }
    try {
      const params = new URLSearchParams({
        search,
        limit: "20",
        published: "true",
        sort: "likes",
        order: "desc",
      });
      const res = await fetch(`/api/admin/levels?${params}`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.levels ?? []);
      }
    } catch {
      // ignore
    }
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(searchLevels, 300);
    return () => clearTimeout(timer);
  }, [searchLevels]);

  async function setWeekly(levelId: string) {
    setUpdating(levelId);
    // Remove current weekly first if exists
    if (currentWeekly) {
      await fetch(`/api/admin/levels/${currentWeekly.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "removeWeekly" }),
      });
    }
    // Set new weekly
    await fetch(`/api/admin/levels/${levelId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "setWeekly" }),
    });
    await loadCurrent();
    setSearch("");
    setSearchResults([]);
    setUpdating(null);
  }

  async function removeWeekly() {
    if (!currentWeekly) return;
    setUpdating(currentWeekly.id);
    await fetch(`/api/admin/levels/${currentWeekly.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "removeWeekly" }),
    });
    await loadCurrent();
    setUpdating(null);
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-6 w-full">
      <HudPanel variant="danger" className="mb-6">
        <h1 className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-2">
          <PixelIcon name="trophy" size={16} color="#fbbf24" /> {t("weekly.title")}
        </h1>
        <p className="text-[8px] text-muted-foreground mt-1">
          {t("weekly.subtitle")}
        </p>
      </HudPanel>

      {/* Current weekly */}
      <HudPanel variant={currentWeekly ? "gold" : "default"} className="mb-6">
        <h2 className="text-[10px] font-bold uppercase tracking-wider mb-3 flex items-center gap-2">
          <PixelIcon name="star" size={12} color="#fbbf24" /> {t("weekly.current")}
        </h2>
        {loading ? (
          <p className="text-[8px] text-muted-foreground animate-pulse">{tc("loadingEllipsis")}</p>
        ) : currentWeekly ? (
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <p className="text-[10px] font-bold">{currentWeekly.name}</p>
              <p className="text-[8px] text-muted-foreground flex items-center gap-2">
                {tc("by")} {currentWeekly.profiles?.nickname}
                <span className="flex items-center gap-0.5">
                  <PixelIcon name="play" size={8} color="#888" /> {currentWeekly.plays}
                </span>
                <span className="flex items-center gap-0.5">
                  <PixelIcon name="heart" size={8} color="#888" /> {currentWeekly.likes}
                </span>
                {currentWeekly.avg_rating > 0 && <span>★{currentWeekly.avg_rating.toFixed(1)}</span>}
              </p>
              <p className="text-[7px] text-muted-foreground mt-1">
                {t("weekly.setOn")}: {currentWeekly.weekly_challenge_date}
              </p>
            </div>
            <HudButton
              onClick={removeWeekly}
              disabled={!!updating}
              variant="danger"
              size="small"
            >
              {updating === currentWeekly.id ? "..." : t("weekly.remove")}
            </HudButton>
          </div>
        ) : (
          <p className="text-[8px] text-muted-foreground">{t("weekly.noCurrent")}</p>
        )}
      </HudPanel>

      {/* Search to set new weekly */}
      <HudPanel className="mb-6">
        <h2 className="text-[10px] font-bold uppercase tracking-wider mb-3 flex items-center gap-2">
          <PixelIcon name="search" size={12} /> {t("weekly.setNew")}
        </h2>
        <input
          type="text"
          placeholder={t("weekly.searchPlaceholder")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="text-[9px] bg-black/40 border-2 border-border px-3 py-1.5 w-full mb-3 placeholder:text-muted-foreground"
        />
        {searchResults.length > 0 && (
          <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
            {searchResults.map((level) => (
              <div key={level.id} className="flex items-center gap-2 py-1.5 border-b border-border/30 last:border-0">
                <div className="flex-1 min-w-0">
                  <p className="text-[9px] font-bold truncate">{level.name}</p>
                  <p className="text-[7px] text-muted-foreground flex items-center gap-2">
                    {tc("by")} {level.profiles?.nickname}
                    <span className="flex items-center gap-0.5"><PixelIcon name="play" size={7} color="#888" /> {level.plays}</span>
                    <span className="flex items-center gap-0.5"><PixelIcon name="heart" size={7} color="#888" /> {level.likes}</span>
                  </p>
                </div>
                <HudButton
                  onClick={() => setWeekly(level.id)}
                  disabled={!!updating}
                  variant="gold"
                  size="small"
                >
                  {updating === level.id ? "..." : t("weekly.set")}
                </HudButton>
              </div>
            ))}
          </div>
        )}
      </HudPanel>
    </main>
  );
}
