"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import LevelCard from "@/components/LevelCard";

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

const SORT_OPTIONS = [
  { value: "created_at", label: "Recentes" },
  { value: "plays", label: "Mais Jogados" },
  { value: "likes", label: "Mais Curtidos" },
  { value: "difficulty", label: "Mais Difíceis" },
] as const;

const PAGE_SIZE = 12;

export default function BrowsePage() {
  const [levels, setLevels] = useState<LevelSummary[]>([]);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("created_at");
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
    [sort, search],
  );

  // Reset and fetch when sort/search changes
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
      {/* Header */}
      <header className="border-b border-border px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-primary">
            🐱 Trap Architect
          </Link>
          <span className="text-muted-foreground font-medium">
            Explorar Níveis
          </span>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-6 py-8 w-full">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <input
            type="text"
            placeholder="Buscar níveis..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-muted border border-border rounded-lg px-4 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="bg-muted border border-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Results */}
        {loading && levels.length === 0 ? (
          <div className="text-center text-muted-foreground py-20">
            Carregando níveis...
          </div>
        ) : levels.length === 0 ? (
          <div className="text-center text-muted-foreground py-20">
            <p className="text-lg mb-2">Nenhum nível encontrado</p>
            <p className="text-sm">
              Seja o primeiro a{" "}
              <Link href="/editor" className="text-primary hover:underline">
                criar um nível
              </Link>
              !
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                  authorName={level.profiles?.nickname}
                  authorId={level.author_id}
                />
              ))}
            </div>

            {hasMore && (
              <div className="text-center mt-8">
                <button
                  onClick={loadMore}
                  disabled={loading}
                  className="bg-primary text-primary-foreground px-6 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {loading ? "Carregando..." : "Carregar Mais"}
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
