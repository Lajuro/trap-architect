"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import HudPanel from "@/components/ui/HudPanel";
import HudButton from "@/components/ui/HudButton";
import { PixelIcon } from "@/components/ui/PixelIcon";
import { playUIClick } from "@/game/audio";

interface LevelRow {
  id: string;
  name: string;
  author_id: string;
  plays: number;
  likes: number;
  featured: boolean;
  featured_category: string | null;
  published: boolean;
  created_at: string;
  difficulty: number;
  avg_rating: number;
  rating_count: number;
  tags: string[] | null;
  theme: string | null;
  weekly_challenge_date: string | null;
  profiles: { nickname: string };
}

const CATEGORY_KEYS = [
  "weekLevel",
  "classics",
  "mostTroll",
  "creativeDesign",
] as const;

const SORT_OPTIONS = [
  { value: "created_at", label: "sortDate" },
  { value: "plays", label: "sortPlays" },
  { value: "likes", label: "sortLikes" },
  { value: "difficulty", label: "sortDifficulty" },
  { value: "avg_rating", label: "sortRating" },
];

export default function AdminLevelsPage() {
  const [levels, setLevels] = useState<LevelRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("created_at");
  const [order, setOrder] = useState("desc");
  const [publishedFilter, setPublishedFilter] = useState<string>("all");
  const [featuredFilter, setFeaturedFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const limit = 20;
  const t = useTranslations("admin");
  const tc = useTranslations("common");

  const loadLevels = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      sort,
      order,
    });
    if (search) params.set("search", search);
    if (publishedFilter !== "all") params.set("published", publishedFilter);
    if (featuredFilter !== "all") params.set("featured", featuredFilter);

    try {
      const res = await fetch(`/api/admin/levels?${params}`);
      if (res.ok) {
        const data = await res.json();
        setLevels(data.levels);
        setTotal(data.total);
      }
    } catch {
      // ignore
    }
    setLoading(false);
  }, [page, search, sort, order, publishedFilter, featuredFilter]);

  useEffect(() => { loadLevels(); }, [loadLevels]);

  async function toggleFeatured(levelId: string, currentFeatured: boolean) {
    setUpdating(levelId);
    await fetch("/api/admin/featured", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        level_id: levelId,
        featured: !currentFeatured,
        featured_category: !currentFeatured ? "weekLevel" : null,
      }),
    });
    await loadLevels();
    setUpdating(null);
  }

  async function setCategory(levelId: string, category: string | null) {
    setUpdating(levelId);
    await fetch("/api/admin/featured", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ level_id: levelId, featured_category: category }),
    });
    await loadLevels();
    setUpdating(null);
  }

  async function handleLevelAction(levelId: string, action: string) {
    if (action === "hide" && !window.confirm(t("levels.confirmHide"))) return;
    setUpdating(levelId);
    await fetch(`/api/admin/levels/${levelId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    await loadLevels();
    setUpdating(null);
  }

  const totalPages = Math.ceil(total / limit);

  function getDiffLabel(d: number) {
    if (d < 0) return { label: t("levels.diffNew"), color: "#9ca3af" };
    if (d < 0.3) return { label: t("levels.diffEasy"), color: "#34d399" };
    if (d < 0.6) return { label: t("levels.diffMedium"), color: "#fbbf24" };
    if (d < 0.8) return { label: t("levels.diffHard"), color: "#f97316" };
    return { label: t("levels.diffExtreme"), color: "#EF4444" };
  }

  return (
    <main className="max-w-6xl mx-auto px-4 py-6 w-full">
      <HudPanel variant="danger" className="mb-6">
        <h1 className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-2">
          <PixelIcon name="browse" size={16} color="#a78bfa" /> {t("levels.title")}
        </h1>
        <p className="text-[8px] text-muted-foreground mt-1">
          {t("levels.subtitle", { count: total })}
        </p>
      </HudPanel>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <input
          type="text"
          placeholder={t("levels.searchPlaceholder")}
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="text-[9px] bg-black/40 border-2 border-border px-3 py-1.5 flex-1 min-w-[150px] placeholder:text-muted-foreground"
        />
        <select
          value={publishedFilter}
          onChange={(e) => { setPublishedFilter(e.target.value); setPage(1); }}
          className="text-[8px] bg-black/40 border-2 border-border px-2 py-1.5"
        >
          <option value="all">{t("levels.filterAll")}</option>
          <option value="true">{t("levels.filterPublished")}</option>
          <option value="false">{t("levels.filterDrafts")}</option>
        </select>
        <select
          value={featuredFilter}
          onChange={(e) => { setFeaturedFilter(e.target.value); setPage(1); }}
          className="text-[8px] bg-black/40 border-2 border-border px-2 py-1.5"
        >
          <option value="all">{t("levels.filterAllFeatured")}</option>
          <option value="true">{t("levels.filterFeatured")}</option>
          <option value="false">{t("levels.filterNotFeatured")}</option>
        </select>
        <select
          value={sort}
          onChange={(e) => { setSort(e.target.value); setPage(1); }}
          className="text-[8px] bg-black/40 border-2 border-border px-2 py-1.5"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{t(`levels.${opt.label}`)}</option>
          ))}
        </select>
        <button
          onClick={() => { setOrder(order === "desc" ? "asc" : "desc"); setPage(1); }}
          className="text-[8px] bg-black/40 border-2 border-border px-2 py-1.5 hover:bg-white/5 transition-colors"
        >
          {order === "desc" ? "↓" : "↑"}
        </button>
      </div>

      {/* Levels list */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground text-[9px] uppercase tracking-wider animate-pulse">
            {tc("loadingEllipsis")}
          </p>
        </div>
      ) : levels.length === 0 ? (
        <HudPanel className="text-center py-8">
          <p className="text-[9px] text-muted-foreground">{t("levels.noLevels")}</p>
        </HudPanel>
      ) : (
        <div className="space-y-2">
          {levels.map((level) => {
            const diff = getDiffLabel(level.difficulty);
            return (
              <HudPanel
                key={level.id}
                variant={level.featured ? "gold" : !level.published ? "default" : "default"}
                className="flex flex-wrap items-center gap-3"
              >
                {/* Level info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
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
                      <span className="flex items-center gap-0.5 text-[6px] text-yellow-400 uppercase">
                        <PixelIcon name="star" size={8} color="#FFD700" /> {t("featured")}
                      </span>
                    )}
                    {level.weekly_challenge_date && (
                      <span className="text-[6px] bg-purple-500/20 text-purple-400 px-1 uppercase">Weekly</span>
                    )}
                    <span className="text-[6px] px-1 uppercase" style={{ color: diff.color, backgroundColor: diff.color + "15" }}>
                      {diff.label}
                    </span>
                  </div>
                  <p className="text-[7px] text-muted-foreground flex items-center gap-2 flex-wrap">
                    <Link
                      href={`/admin/users/${level.author_id}`}
                      className="hover:text-primary"
                      onClick={() => playUIClick()}
                    >
                      {tc("by")} {level.profiles?.nickname}
                    </Link>
                    <span className="flex items-center gap-0.5"><PixelIcon name="play" size={7} color="#888" /> {level.plays}</span>
                    <span className="flex items-center gap-0.5"><PixelIcon name="heart" size={7} color="#888" /> {level.likes}</span>
                    {level.avg_rating > 0 && <span>★{level.avg_rating.toFixed(1)} ({level.rating_count})</span>}
                    {level.tags && level.tags.length > 0 && (
                      <span className="text-[6px]">{level.tags.join(", ")}</span>
                    )}
                    <span>{new Date(level.created_at).toLocaleDateString("pt-BR")}</span>
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-wrap">
                  {level.featured && (
                    <select
                      value={level.featured_category || ""}
                      onChange={(e) => setCategory(level.id, e.target.value || null)}
                      className="text-[7px] bg-black/40 border-2 border-border px-1 py-0.5"
                      disabled={updating === level.id}
                    >
                      <option value="">{t("noCategory")}</option>
                      {CATEGORY_KEYS.map((key) => (
                        <option key={key} value={key}>{t(`categories.${key}`)}</option>
                      ))}
                    </select>
                  )}
                  <HudButton
                    onClick={() => toggleFeatured(level.id, level.featured)}
                    disabled={updating === level.id}
                    variant={level.featured ? "danger" : "gold"}
                    size="small"
                  >
                    {updating === level.id ? "..." : level.featured ? t("unfeatured") : t("highlight")}
                  </HudButton>
                  <HudButton
                    onClick={() => handleLevelAction(level.id, level.published ? "hide" : "unhide")}
                    disabled={updating === level.id}
                    variant={level.published ? "danger" : "secondary"}
                    size="small"
                  >
                    {level.published ? t("levels.hide") : t("levels.unhide")}
                  </HudButton>
                  {!level.weekly_challenge_date ? (
                    <HudButton
                      onClick={() => handleLevelAction(level.id, "setWeekly")}
                      disabled={updating === level.id}
                      variant="secondary"
                      size="small"
                    >
                      {t("levels.setWeekly")}
                    </HudButton>
                  ) : (
                    <HudButton
                      onClick={() => handleLevelAction(level.id, "removeWeekly")}
                      disabled={updating === level.id}
                      variant="danger"
                      size="small"
                    >
                      {t("levels.removeWeekly")}
                    </HudButton>
                  )}
                </div>
              </HudPanel>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <HudButton
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            variant="secondary"
            size="small"
          >
            ←
          </HudButton>
          <span className="text-[8px] text-muted-foreground">
            {page} / {totalPages}
          </span>
          <HudButton
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            variant="secondary"
            size="small"
          >
            →
          </HudButton>
        </div>
      )}
    </main>
  );
}
