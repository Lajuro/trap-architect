"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import type { DbLevel } from "@/lib/database.types";
import type { ParsedLevel, TrollTrigger, GameEntity, EntityType } from "@/game/types";
import { TILE_SIZE } from "@/game/constants";
import { getDifficultyLabel } from "@/lib/difficulty";
import { PixelIcon } from "@/components/ui/PixelIcon";
import HudPanel from "@/components/ui/HudPanel";
import HudButton from "@/components/ui/HudButton";

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

export default function CommunityLevelClient() {
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
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportDesc, setReportDesc] = useState("");
  const [reportMsg, setReportMsg] = useState<string | null>(null);
  const [reporting, setReporting] = useState(false);

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
    fetch(`/api/levels/${levelId}/play`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deaths: 0, time_seconds: 0 }),
    }).catch(() => {});
    setPlaying(true);
  }, [levelId]);

  const handleReport = useCallback(async () => {
    if (!reportReason) return;
    setReporting(true);
    setReportMsg(null);
    try {
      const res = await fetch(`/api/levels/${levelId}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reportReason, description: reportDesc }),
      });
      if (res.ok) {
        setReportMsg("Denúncia enviada!");
        setTimeout(() => setShowReport(false), 1500);
      } else if (res.status === 409) {
        setReportMsg("Você já denunciou este nível.");
      } else if (res.status === 401) {
        setReportMsg("Faça login para denunciar.");
      } else {
        const data = await res.json();
        setReportMsg(data.error || "Erro ao enviar denúncia.");
      }
    } catch {
      setReportMsg("Erro de conexão.");
    }
    setReporting(false);
  }, [levelId, reportReason, reportDesc]);

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
      <header className="border-b-2 border-border px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-primary">
            <PixelIcon name="cat" size={20} />
            <span className="text-[10px] font-bold uppercase tracking-wider">Trap Architect</span>
          </Link>
          <HudButton href="/browse" variant="ghost" size="small">
            <PixelIcon name="arrow-left" size={10} />
            Explorar
          </HudButton>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-4 py-6 w-full">
        {/* Level Info */}
        <HudPanel className="mb-6">
          <h1 className="text-sm font-bold mb-1 uppercase">{level.name}</h1>
          {level.subtitle && (
            <p className="text-muted-foreground text-[9px] mb-2">{level.subtitle}</p>
          )}
          <div className="flex items-center gap-4 text-[9px] text-muted-foreground">
            <Link
              href={`/creator/${authorId}`}
              className="hover:text-foreground"
            >
              por {authorName}
            </Link>
            <span className="flex items-center gap-1">
              <PixelIcon name="play" size={10} color="#ff8c00" /> {level.plays}
            </span>
            {(() => {
              const d = getDifficultyLabel(level.difficulty, level.plays);
              return (
                <span className="flex items-center gap-1" style={{ color: d.color }}>
                  <PixelIcon name={d.icon} size={10} color={d.color} /> {d.label}
                </span>
              );
            })()}
          </div>
        </HudPanel>

        {/* Game area */}
        {playing ? (
          <div className="mb-6">
            <CommunityGameCanvas level={parsedLevel} />
            <div className="text-center mt-3">
              <p className="text-muted-foreground text-[8px] uppercase tracking-wider">
                <kbd className="px-2 py-1 bg-muted border border-border text-[7px]">A/D</kbd>{" "}
                Mover{" / "}
                <kbd className="px-2 py-1 bg-muted border border-border text-[7px]">W</kbd>{" "}
                Pular{" / "}
                <kbd className="px-2 py-1 bg-muted border border-border text-[7px]">ESC</kbd>{" "}
                Menu
              </p>
            </div>
          </div>
        ) : (
          <div
            className="h-64 mb-6 flex items-center justify-center relative overflow-hidden border-2 border-border"
            style={{ backgroundColor: level.bg_color || "#1a1a2e" }}
          >
            {level.thumbnail && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={level.thumbnail}
                alt={level.name}
                className="absolute inset-0 w-full h-full object-cover opacity-40"
                style={{ imageRendering: "pixelated" }}
              />
            )}
            <HudButton onClick={handlePlay} variant="primary">
              <PixelIcon name="play" size={14} /> Jogar
            </HudButton>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3 mb-6">
          <HudButton
            onClick={handleLike}
            variant={liked ? "primary" : "secondary"}
            size="small"
          >
            <PixelIcon name="heart" size={12} color={liked ? "#ff8c00" : "#888"} /> {likeCount}
          </HudButton>
          <HudButton
            onClick={() => { setShowReport(true); setReportMsg(null); }}
            variant="ghost"
            size="small"
          >
            <PixelIcon name="flag" size={12} color="#888" /> Denunciar
          </HudButton>
        </div>

        {/* Report Modal */}
        {showReport && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center" onClick={() => setShowReport(false)}>
            <div className="max-w-md w-full mx-4" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
            <HudPanel variant="danger">
              <h3 className="text-[11px] font-bold mb-4 flex items-center gap-2">
                <PixelIcon name="flag" size={14} color="#EF4444" /> Denunciar Nivel
              </h3>
              <div className="space-y-2 mb-4">
                {[
                  { value: "offensive", label: "Conteudo ofensivo", icon: "ban" as const },
                  { value: "impossible", label: "Impossivel de completar", icon: "skull" as const },
                  { value: "spam", label: "Spam / Nivel vazio", icon: "warning" as const },
                  { value: "bug", label: "Bug / Nivel quebrado", icon: "bug" as const },
                  { value: "other", label: "Outro", icon: "info" as const },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setReportReason(opt.value)}
                    className={`w-full text-left px-3 py-2 border-2 text-[9px] transition-colors flex items-center gap-2 ${
                      reportReason === opt.value
                        ? "border-red-500 bg-red-500/10 text-foreground"
                        : "border-border hover:border-red-500/30"
                    }`}
                  >
                    <PixelIcon name={opt.icon} size={12} /> {opt.label}
                  </button>
                ))}
              </div>
              <textarea
                placeholder="Detalhes adicionais (opcional)"
                value={reportDesc}
                onChange={(e) => setReportDesc(e.target.value)}
                maxLength={500}
                className="w-full bg-muted border-2 border-border px-3 py-2 text-[9px] mb-4 resize-none h-20 focus:outline-none focus:ring-2 focus:ring-primary"
              />
              {reportMsg && (
                <p className="text-[9px] text-muted-foreground mb-3">{reportMsg}</p>
              )}
              <div className="flex gap-3">
                <HudButton
                  onClick={() => setShowReport(false)}
                  variant="secondary"
                  className="flex-1"
                >
                  Cancelar
                </HudButton>
                <HudButton
                  onClick={handleReport}
                  disabled={!reportReason || reporting}
                  variant="danger"
                  className="flex-1"
                >
                  {reporting ? "Enviando..." : "Enviar"}
                </HudButton>
              </div>
            </HudPanel>
          </div>
          </div>
        )}

        {/* Leaderboard */}
        {leaderboard.length > 0 && (
          <HudPanel>
            <h2 className="text-[11px] font-bold mb-4 flex items-center gap-2 uppercase">
              <PixelIcon name="trophy" size={14} color="#FFD700" /> Melhores Jogadas
            </h2>
            <div className="overflow-hidden">
              <table className="w-full text-[9px]">
                <thead>
                  <tr className="border-b-2 border-border text-left text-muted-foreground uppercase tracking-wider">
                    <th className="px-3 py-2">#</th>
                    <th className="px-3 py-2">Jogador</th>
                    <th className="px-3 py-2">Mortes</th>
                    <th className="px-3 py-2">Tempo</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.slice(0, 10).map((entry, i) => (
                    <tr
                      key={i}
                      className="border-b border-border/50 last:border-0"
                    >
                      <td className="px-3 py-2 font-bold text-primary">{i + 1}</td>
                      <td className="px-3 py-2">
                        {entry.profiles?.nickname || "Anonimo"}
                      </td>
                      <td className="px-3 py-2 flex items-center gap-1">
                        <PixelIcon name="skull" size={10} color="#EF4444" /> {entry.deaths}
                      </td>
                      <td className="px-3 py-2">
                        {(entry.time_ms / 1000).toFixed(1)}s
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </HudPanel>
        )}
      </main>
    </div>
  );
}
