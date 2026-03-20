"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import type { DbLevel } from "@/lib/database.types";
import type { ParsedLevel } from "@/game/types";
import { getDifficultyLabel } from "@/lib/difficulty";
import { PixelIcon } from "@/components/ui/PixelIcon";
import HudPanel from "@/components/ui/HudPanel";
import HudButton from "@/components/ui/HudButton";
import {
  dbLevelToParsedLevel,
} from "@/lib/level-utils";

const CommunityGameCanvas = dynamic(
  () =>
    import("@/components/CommunityGameCanvas").then(
      (m) => m.CommunityGameCanvas,
    ),
  { ssr: false },
);

interface LeaderboardEntry {
  deaths: number;
  time_ms: number;
  created_at: string;
  profiles: { nickname: string };
}

export default function CommunityLevelClient() {
  const params = useParams<{ id: string }>();
  const levelId = params.id;
  const tc = useTranslations("common");
  const t = useTranslations("communityPlay");
  const td = useTranslations("difficulty");

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
  const [userRating, setUserRating] = useState(0);
  const [creatingRace, setCreatingRace] = useState(false);
  const raceRouter = useRouter();
  const [hoverRating, setHoverRating] = useState(0);
  const [avgRating, setAvgRating] = useState(0);
  const [ratingCount, setRatingCount] = useState(0);

  // Fetch level data
  useEffect(() => {
    async function fetchLevel() {
      try {
        const res = await fetch(`/api/levels/${levelId}`);
        if (!res.ok) {
          setError(t("notFound"));
          return;
        }
        const data = await res.json();
        const lvl: DbLevel = data.level;
        setLevel(lvl);
        setLikeCount(lvl.likes);
        setAuthorName(data.level.profiles?.nickname || tc("anonymous"));
        setAuthorId(lvl.author_id);
        setParsedLevel(dbLevelToParsedLevel(lvl));
        setAvgRating(data.level.avg_rating ?? 0);
        setRatingCount(data.level.rating_count ?? 0);
        if (data.userRating) setUserRating(data.userRating);
      } catch {
        setError(t("loadError"));
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

  const handleCreateRace = useCallback(async () => {
    if (creatingRace) return;
    setCreatingRace(true);
    try {
      const res = await fetch("/api/race/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ levelId }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Erro ao criar sala");
        return;
      }
      const { code } = await res.json();
      raceRouter.push(`/race/${code}`);
    } catch {
      alert("Falha ao criar sala de corrida");
    } finally {
      setCreatingRace(false);
    }
  }, [levelId, creatingRace, raceRouter]);

  const handlePlay = useCallback(() => {
    fetch(`/api/levels/${levelId}/play`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deaths: 0, time_seconds: 0 }),
    }).catch(() => {});
    setPlaying(true);
  }, [levelId]);

  const handleRate = useCallback(async (stars: number) => {
    setUserRating(stars);
    try {
      const res = await fetch(`/api/levels/${levelId}/rate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stars }),
      });
      if (res.ok) {
        const data = await res.json();
        setAvgRating(data.avg_rating ?? avgRating);
        setRatingCount(data.rating_count ?? ratingCount);
      }
    } catch { /* ignore */ }
  }, [levelId, avgRating, ratingCount]);

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
        setReportMsg(t("reportSent"));
        setTimeout(() => setShowReport(false), 1500);
      } else if (res.status === 409) {
        setReportMsg(t("alreadyReported"));
      } else if (res.status === 401) {
        setReportMsg(t("loginToReport"));
      } else {
        const data = await res.json();
        setReportMsg(data.error || t("reportError"));
      }
    } catch {
      setReportMsg(t("connectionError"));
    }
    setReporting(false);
  }, [levelId, reportReason, reportDesc]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">{t("loadingLevel")}</p>
      </div>
    );
  }

  if (error || !level || !parsedLevel) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <p className="text-destructive text-lg">{error || t("notFound")}</p>
        <Link href="/browse" className="text-primary hover:underline">
          {t("backToBrowse")}
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
            <span className="text-[10px] font-bold uppercase tracking-wider">{t("brandName")}</span>
          </Link>
          <HudButton href="/browse" variant="ghost" size="small">
            <PixelIcon name="arrow-left" size={10} />
            {t("browse")}
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
              {tc("by")} {authorName}
            </Link>
            <span className="flex items-center gap-1">
              <PixelIcon name="play" size={10} color="#ff8c00" /> {level.plays}
            </span>
            {(() => {
              const d = getDifficultyLabel(level.difficulty, level.plays);
              return (
                <span className="flex items-center gap-1" style={{ color: d.color }}>
                  <PixelIcon name={d.icon} size={10} color={d.color} /> {td(d.labelKey)}
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
                {t("controlMove")}{" / "}
                <kbd className="px-2 py-1 bg-muted border border-border text-[7px]">W</kbd>{" "}
                {t("controlJump")}{" / "}
                <kbd className="px-2 py-1 bg-muted border border-border text-[7px]">ESC</kbd>{" "}
                {t("controlMenu")}
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
                className="absolute inset-0 w-full h-full object-cover opacity-40 pointer-events-none"
                style={{ imageRendering: "pixelated" }}
              />
            )}
            <div className="relative z-10 flex gap-3">
              <HudButton onClick={handlePlay} variant="primary">
                <PixelIcon name="play" size={14} /> {t("play")}
              </HudButton>
              <HudButton
                onClick={handleCreateRace}
                variant="secondary"
                disabled={creatingRace}
              >
                <PixelIcon name="flag" size={14} />{" "}
                {creatingRace ? "Criando..." : "Race"}
              </HudButton>
            </div>
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
            <PixelIcon name="flag" size={12} color="#888" /> {t("report")}
          </HudButton>

          {/* Star Rating */}
          <div className="flex items-center gap-1 ml-auto">
            <span className="text-[9px] text-muted-foreground mr-1">
              {ratingCount > 0 ? `${avgRating.toFixed(1)} (${ratingCount})` : t("rate")}
            </span>
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => handleRate(star)}
                className="text-lg leading-none transition-transform hover:scale-125"
              >
                {star <= (hoverRating || userRating) ? "★" : "☆"}
              </button>
            ))}
          </div>
        </div>

        {/* Report Modal */}
        {showReport && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center" onClick={() => setShowReport(false)}>
            <div className="max-w-md w-full mx-4" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
            <HudPanel variant="danger">
              <h3 className="text-[11px] font-bold mb-4 flex items-center gap-2">
                <PixelIcon name="flag" size={14} color="#EF4444" /> {t("reportLevel")}
              </h3>
              <div className="space-y-2 mb-4">
                {[
                  { value: "offensive", label: t("reportReasons.offensive"), icon: "ban" as const },
                  { value: "impossible", label: t("reportReasons.impossible"), icon: "skull" as const },
                  { value: "spam", label: t("reportReasons.spam"), icon: "warning" as const },
                  { value: "bug", label: t("reportReasons.bug"), icon: "bug" as const },
                  { value: "other", label: t("reportReasons.other"), icon: "info" as const },
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
                placeholder={t("reportDescPlaceholder")}
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
                  {tc("cancel")}
                </HudButton>
                <HudButton
                  onClick={handleReport}
                  disabled={!reportReason || reporting}
                  variant="danger"
                  className="flex-1"
                >
                  {reporting ? t("submitting") : t("submit")}
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
              <PixelIcon name="trophy" size={14} color="#FFD700" /> {t("leaderboard")}
            </h2>
            <div className="overflow-hidden">
              <table className="w-full text-[9px]">
                <thead>
                  <tr className="border-b-2 border-border text-left text-muted-foreground uppercase tracking-wider">
                    <th className="px-3 py-2">#</th>
                    <th className="px-3 py-2">{t("player")}</th>
                    <th className="px-3 py-2">{tc("deaths")}</th>
                    <th className="px-3 py-2">{tc("time")}</th>
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
                        {entry.profiles?.nickname || tc("anonymous")}
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
