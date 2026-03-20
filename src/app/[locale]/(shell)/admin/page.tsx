"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import HudPanel from "@/components/ui/HudPanel";
import { PixelIcon, type PixelIconName } from "@/components/ui/PixelIcon";
import { playUIClick } from "@/game/audio";

interface Stats {
  totalUsers: number;
  totalLevels: number;
  publishedLevels: number;
  totalPlays: number;
  totalReports: number;
  pendingReports: number;
  totalLikes: number;
  newUsersToday: number;
  newLevelsToday: number;
  newPlaysToday: number;
}

interface StatCardProps {
  icon: PixelIconName;
  color: string;
  label: string;
  value: number;
  href?: string;
}

function StatCard({ icon, color, label, value, href }: StatCardProps) {
  const content = (
    <HudPanel className="flex items-center gap-3 hover:bg-white/5 transition-colors cursor-pointer">
      <div className="w-10 h-10 flex items-center justify-center bg-black/30 rounded-sm border border-white/10">
        <PixelIcon name={icon} size={20} color={color} />
      </div>
      <div>
        <p className="text-[16px] font-bold" style={{ color }}>{value.toLocaleString("pt-BR")}</p>
        <p className="text-[8px] text-muted-foreground uppercase tracking-wider">{label}</p>
      </div>
    </HudPanel>
  );

  if (href) {
    return <Link href={href} onClick={() => playUIClick()}>{content}</Link>;
  }
  return content;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const t = useTranslations("admin");

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((res) => res.json())
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground text-[9px] uppercase tracking-wider animate-pulse">
          {t("loading")}
        </p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-red-400 text-[9px] uppercase tracking-wider">
          {t("loadError")}
        </p>
      </div>
    );
  }

  return (
    <main className="max-w-6xl mx-auto px-4 py-6 w-full">
      {/* Header */}
      <HudPanel variant="danger" className="mb-6">
        <h1 className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-2">
          <PixelIcon name="crown" size={16} color="#EF4444" /> {t("dashboard.title")}
        </h1>
        <p className="text-[8px] text-muted-foreground mt-1">
          {t("dashboard.subtitle")}
        </p>
      </HudPanel>

      {/* Main stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard
          icon="profile"
          color="#60a5fa"
          label={t("dashboard.totalUsers")}
          value={stats.totalUsers}
          href="/admin/users"
        />
        <StatCard
          icon="browse"
          color="#a78bfa"
          label={t("dashboard.totalLevels")}
          value={stats.totalLevels}
          href="/admin/levels"
        />
        <StatCard
          icon="play"
          color="#34d399"
          label={t("dashboard.totalPlays")}
          value={stats.totalPlays}
        />
        <StatCard
          icon="flag"
          color={stats.pendingReports > 0 ? "#EF4444" : "#9ca3af"}
          label={t("dashboard.pendingReports")}
          value={stats.pendingReports}
          href="/admin/reports"
        />
      </div>

      {/* Secondary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard
          icon="check"
          color="#34d399"
          label={t("dashboard.publishedLevels")}
          value={stats.publishedLevels}
        />
        <StatCard
          icon="heart"
          color="#f472b6"
          label={t("dashboard.totalLikes")}
          value={stats.totalLikes}
        />
        <StatCard
          icon="report"
          color="#fbbf24"
          label={t("dashboard.totalReports")}
          value={stats.totalReports}
        />
        <StatCard
          icon="trophy"
          color="#fbbf24"
          label={t("dashboard.weeklyChallenge")}
          value={0}
          href="/admin/weekly"
        />
      </div>

      {/* Today's stats */}
      <HudPanel className="mb-6">
        <h2 className="text-[10px] font-bold uppercase tracking-wider mb-3 flex items-center gap-2">
          <PixelIcon name="sparkle" size={12} color="#fbbf24" /> {t("dashboard.today")}
        </h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-[14px] font-bold text-blue-400">{stats.newUsersToday}</p>
            <p className="text-[7px] text-muted-foreground uppercase tracking-wider">{t("dashboard.newUsers")}</p>
          </div>
          <div className="text-center">
            <p className="text-[14px] font-bold text-purple-400">{stats.newLevelsToday}</p>
            <p className="text-[7px] text-muted-foreground uppercase tracking-wider">{t("dashboard.newLevels")}</p>
          </div>
          <div className="text-center">
            <p className="text-[14px] font-bold text-green-400">{stats.newPlaysToday}</p>
            <p className="text-[7px] text-muted-foreground uppercase tracking-wider">{t("dashboard.newPlays")}</p>
          </div>
        </div>
      </HudPanel>

      {/* Quick links */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <Link href="/admin/users" onClick={() => playUIClick()}>
          <HudPanel className="text-center py-4 hover:bg-white/5 transition-colors cursor-pointer">
            <PixelIcon name="profile" size={20} color="#60a5fa" />
            <p className="text-[9px] font-bold mt-2">{t("sidebar.users")}</p>
          </HudPanel>
        </Link>
        <Link href="/admin/levels" onClick={() => playUIClick()}>
          <HudPanel className="text-center py-4 hover:bg-white/5 transition-colors cursor-pointer">
            <PixelIcon name="browse" size={20} color="#a78bfa" />
            <p className="text-[9px] font-bold mt-2">{t("sidebar.levels")}</p>
          </HudPanel>
        </Link>
        <Link href="/admin/reports" onClick={() => playUIClick()}>
          <HudPanel className="text-center py-4 hover:bg-white/5 transition-colors cursor-pointer">
            <PixelIcon name="flag" size={20} color="#EF4444" />
            <p className="text-[9px] font-bold mt-2">{t("sidebar.reports")}</p>
          </HudPanel>
        </Link>
        <Link href="/admin/weekly" onClick={() => playUIClick()}>
          <HudPanel className="text-center py-4 hover:bg-white/5 transition-colors cursor-pointer">
            <PixelIcon name="trophy" size={20} color="#fbbf24" />
            <p className="text-[9px] font-bold mt-2">{t("sidebar.weekly")}</p>
          </HudPanel>
        </Link>
        <Link href="/admin/activity" onClick={() => playUIClick()}>
          <HudPanel className="text-center py-4 hover:bg-white/5 transition-colors cursor-pointer">
            <PixelIcon name="clock" size={20} color="#34d399" />
            <p className="text-[9px] font-bold mt-2">{t("sidebar.activity")}</p>
          </HudPanel>
        </Link>
      </div>
    </main>
  );
}
