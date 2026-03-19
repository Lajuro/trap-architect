"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import LevelCard from "@/components/LevelCard";
import HudBar from "@/components/ui/HudBar";
import HudPanel from "@/components/ui/HudPanel";
import HudButton from "@/components/ui/HudButton";
import { PixelIcon } from "@/components/ui/PixelIcon";
import { LEVEL_TAGS, TAG_CONFIG, type LevelTag } from "@/game/types";

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

const SORT_OPTIONS = [
  { value: "created_at", label: "Recentes" },
  { value: "plays", label: "Mais Jogados" },
  { value: "likes", label: "Mais Curtidos" },
  { value: "difficulty", label: "Mais Dificeis" },
] as const;

const DIFFICULTY_FILTERS = [
  { value: "", label: "Todas", color: "#888" },
  { value: "easy", label: "Facil", color: "#22C55E" },
  { value: "medium", label: "Medio", color: "#EAB308" },
  { value: "hard", label: "Dificil", color: "#F97316" },
  { value: "extreme", label: "Extremo", color: "#EF4444" },
] as const;

const PAGE_SIZE = 12;

export default function BrowsePage() {
  const [levels, setLevels] = useState<LevelSummary[]>([]);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("created_at");
  const [difficultyFilter, setDifficultyFilter] = useState("");
  const [tagFilter, setTagFilter] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchLevels = useCallback(
    async (pageNum: number, append: boolean) => {
      setLoading(true);
      const params = new URLSearchParams({
        sort,
        page: String(pageNum),
        limit: String(PAGE_SIZE),
      });
      if (search.trim()) params.set("search", search.trim());
      if (difficultyFilter) params.set("difficulty", difficultyFilter);
      if (tagFilter) params.set("tag", tagFilter);

      try {
        const res = await fetch(`/api/levels?${params}`);
        const data = await res.json();
        const fetched: LevelSummary[] = data.levels || [];
        setLevels((prev) => (append ? [...prev, ...fetched] : fetched));
        setTotal(data.total ?? 0);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    },
    [sort, search, difficultyFilter, tagFilter],
  );

  useEffect(() => {
    setPage(1);
    fetchLevels(1, false);
  }, [fetchLevels]);

  function loadMore() {
    const next = page + 1;
    setPage(next);
    fetchLevels(next, true);
  }

  const hasMore = levels.length < total;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <HudBar />

      <main className="flex-1 max-w-7xl mx-auto px-4 py-6 w-full">
        {/* Navigation tabs */}
        <div className="flex gap-1 mb-4 border-b-2 border-border">
          <span className="px-3 py-2 text-[8px] font-bold uppercase tracking-wider border-b-2 border-primary text-primary -mb-[2px]">
            Niveis
          </span>
          <Link
            href="/collections"
            className="px-3 py-2 text-[8px] font-bold uppercase tracking-wider border-b-2 border-transparent text-muted-foreground hover:text-foreground -mb-[2px]"
          >
            Colecoes
          </Link>
        </div>

        {/* Filters */}
        <HudPanel className="mb-6">
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="flex-1 relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2">
                <PixelIcon name="search" size={12} color="#888" />
              </span>
              <input
                type="text"
                placeholder="Buscar niveis..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-muted border-2 border-border px-8 py-2 text-[9px] placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2">
                <PixelIcon name="sort" size={12} color="#888" />
              </span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="bg-muted border-2 border-border px-8 py-2 text-[9px] focus:outline-none focus:ring-2 focus:ring-primary appearance-none"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Difficulty filter */}
          <div className="flex gap-2 flex-wrap">
            {DIFFICULTY_FILTERS.map((df) => (
              <button
                key={df.value}
                onClick={() => setDifficultyFilter(df.value)}
                className={`text-[8px] px-3 py-1.5 border-2 transition-colors uppercase tracking-wider ${
                  difficultyFilter === df.value
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border text-muted-foreground hover:border-primary/50"
                }`}
                style={difficultyFilter === df.value ? { borderColor: df.color } : {}}
              >
                {df.label}
              </button>
            ))}
          </div>

          {/* Tag filter */}
          <div className="flex gap-1.5 flex-wrap mt-3">
            <button
              onClick={() => setTagFilter("")}
              className={`text-[7px] px-2 py-1 border transition-colors uppercase tracking-wider ${
                tagFilter === ""
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border text-muted-foreground hover:border-primary/50"
              }`}
            >
              Todas Tags
            </button>
            {LEVEL_TAGS.map((tag) => {
              const cfg = TAG_CONFIG[tag as LevelTag];
              return (
                <button
                  key={tag}
                  onClick={() => setTagFilter(tag === tagFilter ? "" : tag)}
                  className={`text-[7px] px-2 py-1 border transition-colors uppercase tracking-wider ${
                    tagFilter === tag
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  style={{
                    borderColor: tagFilter === tag ? cfg.color : undefined,
                    backgroundColor: tagFilter === tag ? cfg.color + "15" : undefined,
                    color: tagFilter === tag ? cfg.color : undefined,
                  }}
                >
                  {cfg.label}
                </button>
              );
            })}
          </div>
        </HudPanel>

        {/* Results */}
        {loading && levels.length === 0 ? (
          <div className="text-center text-muted-foreground py-20 text-[9px] uppercase tracking-wider">
            Carregando niveis...
          </div>
        ) : levels.length === 0 ? (
          <HudPanel className="text-center py-16">
            <PixelIcon name="search" size={32} color="#888" />
            <p className="text-[10px] mt-4 mb-2">Nenhum nivel encontrado</p>
            <p className="text-[8px] text-muted-foreground">
              Seja o primeiro a{" "}
              <Link href="/editor" className="text-primary hover:underline">
                criar um nivel
              </Link>
              !
            </p>
          </HudPanel>
        ) : (
          <>
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
                  thumbnail={level.thumbnail}
                  authorName={level.profiles?.nickname}
                  authorId={level.author_id}
                  featured={level.featured}
                  featuredCategory={level.featured_category}
                  tags={level.tags}
                  avgRating={level.avg_rating}
                  ratingCount={level.rating_count}
                />
              ))}
            </div>

            {hasMore && (
              <div className="text-center mt-6">
                <HudButton
                  onClick={loadMore}
                  disabled={loading}
                  variant="secondary"
                >
                  {loading ? "Carregando..." : "Carregar Mais"}
                </HudButton>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
