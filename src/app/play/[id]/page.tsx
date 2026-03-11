"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import type { DbLevel } from "@/lib/database.types";
import type { ParsedLevel, TrollTrigger, GameEntity, EntityType } from "@/game/types";
import { TILE_SIZE } from "@/game/constants";

const CommunityGameCanvas = dynamic(
  () =>
    import("@/components/CommunityGameCanvas").then(
      (m) => m.CommunityGameCanvas,
    ),
  { ssr: false },
);

/** Convert DB entities to GameEntity[] with pixel positions */
function dbEntitiesToGameEntities(
  entities: { type: string; gx: number; gy: number }[],
): GameEntity[] {
  return entities.map((e) => ({
    type: e.type as EntityType,
    x: e.gx * TILE_SIZE,
    y: e.gy * TILE_SIZE,
    alive: true,
    ...(["goomba", "fast_goomba", "spiny"].includes(e.type)
      ? { vx: -1.5, vy: 0, dir: -1 }
      : {}),
    ...(e.type === "flying" ? { vx: -1.5, vy: 0, dir: -1, baseY: e.gy * TILE_SIZE } : {}),
  }));
}

/** Convert DB troll triggers to typed TrollTrigger[] */
function dbTrollsToTrollTriggers(
  trolls: DbLevel["trolls"],
): TrollTrigger[] {
  return trolls.map((t) => ({
    triggerX: t.triggerX,
    action: t.action as TrollTrigger["action"],
    triggered: false,
    ...("entityType" in t ? { entityType: t.entityType as EntityType } : {}),
    ...("spawnX" in t ? { spawnX: t.spawnX } : {}),
    ...("spawnY" in t ? { spawnY: t.spawnY } : {}),
    ...("duration" in t ? { duration: t.duration } : {}),
    ...("text" in t ? { text: t.text } : {}),
    ...("startX" in t ? { startX: t.startX } : {}),
    ...("count" in t ? { count: t.count } : {}),
  }));
}

/** Convert a DB level to a ParsedLevel ready for the game engine */
function dbLevelToParsedLevel(db: DbLevel): ParsedLevel {
  return {
    name: db.name,
    subtitle: db.subtitle ?? undefined,
    bgColor: db.bg_color,
    music: db.music,
    width: db.grid_w,
    height: db.grid_h,
    tiles: db.tiles,
    entities: dbEntitiesToGameEntities(db.entities),
    trolls: dbTrollsToTrollTriggers(db.trolls),
    playerStart: db.player_start,
  };
}

interface LeaderboardEntry {
  deaths: number;
  time_ms: number;
  created_at: string;
  profiles: { nickname: string };
}

export default function CommunityLevelPage() {
  const params = useParams<{ id: string }>();
  const levelId = params.id;

  const [level, setLevel] = useState<DbLevel | null>(null);
  const [authorName, setAuthorName] = useState("");
  const [authorId, setAuthorId] = useState("");
  const [parsedLevel, setParsedLevel] = useState<ParsedLevel | null>(null);
  const [playing, setPlaying] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch level data
  useEffect(() => {
    async function fetchLevel() {
      try {
        const res = await fetch(`/api/levels/${levelId}`);
        if (!res.ok) {
          setError("Nível não encontrado");
          return;
        }
        const data = await res.json();
        const lvl: DbLevel = data.level;
        setLevel(lvl);
        setLikeCount(lvl.likes);
        setAuthorName(data.level.profiles?.nickname || "Anônimo");
        setAuthorId(lvl.author_id);
        setParsedLevel(dbLevelToParsedLevel(lvl));
      } catch {
        setError("Erro ao carregar nível");
      } finally {
        setLoading(false);
      }
    }

    fetchLevel();
  }, [levelId]);

  // Fetch leaderboard
  useEffect(() => {
    fetch(`/api/leaderboard?level_id=${levelId}`)
      .then((r) => r.json())
      .then((data) => setLeaderboard(data.leaderboard || []))
      .catch(() => {});
  }, [levelId]);

  const handleLike = useCallback(async () => {
    try {
      const res = await fetch(`/api/levels/${levelId}/like`, {
        method: "POST",
      });
      if (res.status === 401) {
        // Not logged in — redirect or ignore
        return;
      }
      const data = await res.json();
      setLiked(data.liked);
      setLikeCount((c) => (data.liked ? c + 1 : Math.max(0, c - 1)));
    } catch {
      // ignore
    }
  }, [levelId]);

  const handlePlay = useCallback(() => {
    // Record play start
    fetch(`/api/levels/${levelId}/play`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deaths: 0, time_seconds: 0 }),
    }).catch(() => {});
    setPlaying(true);
  }, [levelId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Carregando nível...</p>
      </div>
    );
  }

  if (error || !level || !parsedLevel) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <p className="text-destructive text-lg">{error || "Nível não encontrado"}</p>
        <Link href="/browse" className="text-primary hover:underline">
          ← Voltar para Explorar
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-primary">
            🐱 Trap Architect
          </Link>
          <Link
            href="/browse"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Explorar
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-6 py-8 w-full">
        {/* Level Info */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-1">{level.name}</h1>
          {level.subtitle && (
            <p className="text-muted-foreground mb-2">{level.subtitle}</p>
          )}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <Link
              href={`/creator/${authorId}`}
              className="hover:text-foreground"
            >
              por {authorName}
            </Link>
            <span>▶ {level.plays} plays</span>
            <span>💀 {level.difficulty.toFixed(1)} dificuldade</span>
          </div>
        </div>

        {/* Game area */}
        {playing ? (
          <div className="mb-8">
            <CommunityGameCanvas level={parsedLevel} />
            <div className="text-center mt-4">
              <p className="text-muted-foreground text-sm">
                <kbd className="px-2 py-1 bg-muted rounded text-xs">←→</kbd>{" "}
                Mover ·{" "}
                <kbd className="px-2 py-1 bg-muted rounded text-xs">↑</kbd>{" "}
                Pular ·{" "}
                <kbd className="px-2 py-1 bg-muted rounded text-xs">ESC</kbd>{" "}
                Menu
              </p>
            </div>
          </div>
        ) : (
          <div
            className="h-64 rounded-lg mb-8 flex items-center justify-center"
            style={{ backgroundColor: level.bg_color || "#1a1a2e" }}
          >
            <button
              onClick={handlePlay}
              className="bg-primary text-primary-foreground px-8 py-3 rounded-lg text-lg font-bold hover:opacity-90 transition-opacity"
            >
              ▶ Jogar
            </button>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={handleLike}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
              liked
                ? "bg-primary/20 border-primary text-primary"
                : "border-border hover:border-primary/50"
            }`}
          >
            ♥ {likeCount}
          </button>
        </div>

        {/* Leaderboard */}
        {leaderboard.length > 0 && (
          <section>
            <h2 className="text-xl font-bold mb-4">🏆 Melhores Jogadas</h2>
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground">
                    <th className="px-4 py-2">#</th>
                    <th className="px-4 py-2">Jogador</th>
                    <th className="px-4 py-2">Mortes</th>
                    <th className="px-4 py-2">Tempo</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.slice(0, 10).map((entry, i) => (
                    <tr
                      key={i}
                      className="border-b border-border/50 last:border-0"
                    >
                      <td className="px-4 py-2 font-bold">{i + 1}</td>
                      <td className="px-4 py-2">
                        {entry.profiles?.nickname || "Anônimo"}
                      </td>
                      <td className="px-4 py-2">💀 {entry.deaths}</td>
                      <td className="px-4 py-2">
                        {(entry.time_ms / 1000).toFixed(1)}s
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
