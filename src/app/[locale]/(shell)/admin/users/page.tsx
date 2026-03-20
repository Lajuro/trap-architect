"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import HudPanel from "@/components/ui/HudPanel";
import HudButton from "@/components/ui/HudButton";
import { PixelIcon } from "@/components/ui/PixelIcon";
import { RANKS, ADMIN_RANK } from "@/lib/ranks";
import { playUIClick } from "@/game/audio";

interface UserRow {
  id: string;
  nickname: string;
  photo_url: string | null;
  creator_rank: number;
  levels_published: number;
  total_plays: number;
  total_likes: number;
  creator_coins: number;
  created_at: string;
  banned_at: string | null;
  levels_completed: number;
  total_deaths: number;
}

const SORT_OPTIONS = [
  { value: "created_at", label: "sortDate" },
  { value: "levels_published", label: "sortLevels" },
  { value: "total_plays", label: "sortPlays" },
  { value: "total_likes", label: "sortLikes" },
  { value: "creator_rank", label: "sortRank" },
];

const ALL_RANKS = [...RANKS, ADMIN_RANK];

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("created_at");
  const [order, setOrder] = useState("desc");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const limit = 20;
  const t = useTranslations("admin");
  const tc = useTranslations("common");

  const loadUsers = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      sort,
      order,
    });
    if (search) params.set("search", search);

    try {
      const res = await fetch(`/api/admin/users?${params}`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
        setTotal(data.total);
      }
    } catch {
      // ignore
    }
    setLoading(false);
  }, [page, search, sort, order]);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  async function handleSetRank(userId: string, rank: number) {
    setUpdating(userId);
    await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, action: "setRank", value: rank }),
    });
    await loadUsers();
    setUpdating(null);
  }

  async function handleBan(userId: string, isBanned: boolean) {
    if (!isBanned && !window.confirm(t("users.confirmBan"))) return;
    setUpdating(userId);
    await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, action: isBanned ? "unban" : "ban" }),
    });
    await loadUsers();
    setUpdating(null);
  }

  const totalPages = Math.ceil(total / limit);

  function getRankInfo(rank: number) {
    if (rank === 99) return ADMIN_RANK;
    return ALL_RANKS.find((r) => r.level === rank) || RANKS[0];
  }

  return (
    <main className="max-w-6xl mx-auto px-4 py-6 w-full">
      <HudPanel variant="danger" className="mb-6">
        <h1 className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-2">
          <PixelIcon name="profile" size={16} color="#60a5fa" /> {t("users.title")}
        </h1>
        <p className="text-[8px] text-muted-foreground mt-1">
          {t("users.subtitle", { count: total })}
        </p>
      </HudPanel>

      {/* Search & sort controls */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <input
          type="text"
          placeholder={t("users.searchPlaceholder")}
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="text-[9px] bg-black/40 border-2 border-border px-3 py-1.5 flex-1 min-w-[150px] placeholder:text-muted-foreground"
        />
        <select
          value={sort}
          onChange={(e) => { setSort(e.target.value); setPage(1); }}
          className="text-[8px] bg-black/40 border-2 border-border px-2 py-1.5"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{t(`users.${opt.label}`)}</option>
          ))}
        </select>
        <button
          onClick={() => { setOrder(order === "desc" ? "asc" : "desc"); setPage(1); }}
          className="text-[8px] bg-black/40 border-2 border-border px-2 py-1.5 hover:bg-white/5 transition-colors"
        >
          {order === "desc" ? "↓" : "↑"}
        </button>
      </div>

      {/* Users list */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground text-[9px] uppercase tracking-wider animate-pulse">
            {tc("loadingEllipsis")}
          </p>
        </div>
      ) : users.length === 0 ? (
        <HudPanel className="text-center py-8">
          <p className="text-[9px] text-muted-foreground">{t("users.noUsers")}</p>
        </HudPanel>
      ) : (
        <div className="space-y-2">
          {users.map((u) => {
            const rank = getRankInfo(u.creator_rank);
            const isBanned = !!u.banned_at;
            return (
              <HudPanel
                key={u.id}
                variant={isBanned ? "danger" : "default"}
                className="flex flex-wrap items-center gap-3"
              >
                {/* User info */}
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="w-8 h-8 border-2 flex items-center justify-center shrink-0"
                    style={{ borderColor: rank.color + "66", backgroundColor: rank.color + "11" }}
                  >
                    <PixelIcon name="cat" size={14} color={rank.color} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/users/${u.id}`}
                        className="text-[9px] font-bold hover:text-primary truncate"
                        onClick={() => playUIClick()}
                      >
                        {u.nickname}
                      </Link>
                      {isBanned && (
                        <span className="text-[7px] text-red-400 uppercase tracking-wider flex items-center gap-0.5">
                          <PixelIcon name="ban" size={8} color="#EF4444" /> {t("users.banned")}
                        </span>
                      )}
                      <span className="text-[7px] uppercase tracking-wider" style={{ color: rank.color }}>
                        {rank.title}
                      </span>
                    </div>
                    <p className="text-[7px] text-muted-foreground flex items-center gap-3">
                      <span className="flex items-center gap-0.5">
                        <PixelIcon name="browse" size={8} color="#888" /> {u.levels_published}
                      </span>
                      <span className="flex items-center gap-0.5">
                        <PixelIcon name="play" size={8} color="#888" /> {u.total_plays}
                      </span>
                      <span className="flex items-center gap-0.5">
                        <PixelIcon name="heart" size={8} color="#888" /> {u.total_likes}
                      </span>
                      <span className="flex items-center gap-0.5">
                        <PixelIcon name="coin" size={8} color="#888" /> {u.creator_coins}
                      </span>
                      <span>{new Date(u.created_at).toLocaleDateString("pt-BR")}</span>
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <select
                    value={u.creator_rank}
                    onChange={(e) => handleSetRank(u.id, parseInt(e.target.value))}
                    disabled={updating === u.id}
                    className="text-[8px] bg-black/40 border-2 border-border px-1 py-1"
                  >
                    {ALL_RANKS.map((r) => (
                      <option key={r.level} value={r.level}>{r.title} ({r.level})</option>
                    ))}
                  </select>
                  <HudButton
                    onClick={() => handleBan(u.id, isBanned)}
                    disabled={updating === u.id}
                    variant={isBanned ? "secondary" : "danger"}
                    size="small"
                  >
                    {updating === u.id ? "..." : isBanned ? t("users.unban") : t("users.ban")}
                  </HudButton>
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
