"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import HudPanel from "@/components/ui/HudPanel";
import HudButton from "@/components/ui/HudButton";
import { PixelIcon, type PixelIconName } from "@/components/ui/PixelIcon";

interface Activity {
  type: string;
  timestamp: string;
  details: Record<string, unknown>;
}

const TYPE_FILTERS = ["all", "plays", "levels", "reports", "users"] as const;

function getActivityIcon(type: string): { icon: PixelIconName; color: string } {
  switch (type) {
    case "play": return { icon: "play", color: "#34d399" };
    case "level_published": return { icon: "check", color: "#a78bfa" };
    case "level_draft": return { icon: "create", color: "#9ca3af" };
    case "report": return { icon: "flag", color: "#EF4444" };
    case "user_joined": return { icon: "profile", color: "#60a5fa" };
    default: return { icon: "info", color: "#9ca3af" };
  }
}

function formatTimestamp(ts: string) {
  const date = new Date(ts);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return "agora";
  if (diffMin < 60) return `${diffMin}min`;
  if (diffHour < 24) return `${diffHour}h`;
  if (diffDay < 7) return `${diffDay}d`;
  return date.toLocaleDateString("pt-BR");
}

export default function AdminActivityPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const t = useTranslations("admin");
  const tc = useTranslations("common");

  const loadActivities = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "50" });
      if (typeFilter !== "all") params.set("type", typeFilter);

      const res = await fetch(`/api/admin/activity?${params}`);
      if (res.ok) {
        const data = await res.json();
        setActivities(data.activities ?? []);
      }
    } catch {
      // ignore
    }
    setLoading(false);
  }, [typeFilter]);

  useEffect(() => { loadActivities(); }, [loadActivities]);

  function getActivityDescription(activity: Activity): string {
    const d = activity.details;
    switch (activity.type) {
      case "play":
        return `${d.playerName} ${d.completed ? t("activity.completed") : t("activity.played")} "${d.levelName}" (${d.deaths} ${tc("deaths").toLowerCase()})`;
      case "level_published":
        return `${d.authorName} ${t("activity.published")} "${d.levelName}"`;
      case "level_draft":
        return `${d.authorName} ${t("activity.savedDraft")} "${d.levelName}"`;
      case "report":
        return `${d.reporterName} ${t("activity.reported")} "${d.levelName}" — ${d.reason}`;
      case "user_joined":
        return `${d.nickname} ${t("activity.joined")}`;
      default:
        return JSON.stringify(d);
    }
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-6 w-full">
      <HudPanel variant="danger" className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-2">
              <PixelIcon name="clock" size={16} color="#34d399" /> {t("activity.title")}
            </h1>
            <p className="text-[8px] text-muted-foreground mt-1">
              {t("activity.subtitle")}
            </p>
          </div>
          <HudButton onClick={loadActivities} variant="secondary" size="small">
            {t("activity.refresh")}
          </HudButton>
        </div>
      </HudPanel>

      {/* Type filter */}
      <div className="flex items-center gap-2 mb-4 overflow-x-auto">
        {TYPE_FILTERS.map((filter) => (
          <button
            key={filter}
            onClick={() => setTypeFilter(filter)}
            className={`text-[8px] font-bold uppercase tracking-wider px-3 py-1.5 whitespace-nowrap transition-all border-2 ${
              typeFilter === filter
                ? "border-red-500 text-red-400 bg-red-500/10"
                : "border-border text-muted-foreground hover:text-foreground hover:bg-white/5"
            }`}
          >
            {t(`activity.filter.${filter}`)}
          </button>
        ))}
      </div>

      {/* Activity feed */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground text-[9px] uppercase tracking-wider animate-pulse">
            {tc("loadingEllipsis")}
          </p>
        </div>
      ) : activities.length === 0 ? (
        <HudPanel className="text-center py-8">
          <p className="text-[9px] text-muted-foreground">{t("activity.noActivity")}</p>
        </HudPanel>
      ) : (
        <div className="space-y-1">
          {activities.map((activity, i) => {
            const { icon, color } = getActivityIcon(activity.type);
            return (
              <div
                key={`${activity.type}-${activity.timestamp}-${i}`}
                className="flex items-start gap-3 py-2 border-b border-border/20 last:border-0"
              >
                <div className="w-6 h-6 flex items-center justify-center shrink-0 mt-0.5"
                  style={{ backgroundColor: color + "15" }}
                >
                  <PixelIcon name={icon} size={12} color={color} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[8px] text-foreground leading-relaxed">
                    {getActivityDescription(activity)}
                  </p>
                </div>
                <span className="text-[7px] text-muted-foreground shrink-0 mt-0.5">
                  {formatTimestamp(activity.timestamp)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
