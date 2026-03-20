"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import HudPanel from "@/components/ui/HudPanel";
import HudButton from "@/components/ui/HudButton";
import { PixelIcon, type PixelIconName } from "@/components/ui/PixelIcon";

interface ReportRow {
  id: string;
  reason: string;
  description: string | null;
  status: string;
  created_at: string;
  profiles: { nickname: string };
  levels: { name: string; author_id: string };
}

const STATUS_FILTERS = ["pending", "dismissed", "actioned", "all"] as const;

export default function AdminReportsPage() {
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("pending");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const t = useTranslations("admin");
  const tc = useTranslations("common");

  const loadReports = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/reports");
      if (res.ok) {
        const data = await res.json();
        setReports(data.reports || []);
      }
    } catch {
      // ignore
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadReports(); }, [loadReports]);

  async function handleReport(reportId: string, action: string) {
    if (action === "actioned" && !window.confirm(t("confirmHide"))) return;
    setUpdating(reportId);
    await fetch("/api/admin/reports", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reportId, action }),
    });
    await loadReports();
    setUpdating(null);
  }

  const filteredReports = statusFilter === "all"
    ? reports
    : reports.filter((r) => r.status === statusFilter);

  const reasonIcons: Record<string, PixelIconName> = {
    offensive: "ban",
    impossible: "skull",
    spam: "warning",
    bug: "bug",
    other: "info",
  };

  return (
    <main className="max-w-6xl mx-auto px-4 py-6 w-full">
      <HudPanel variant="danger" className="mb-6">
        <h1 className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-2">
          <PixelIcon name="flag" size={16} color="#EF4444" /> {t("reports")}
        </h1>
        <p className="text-[8px] text-muted-foreground mt-1">
          {t("reportsMgmt.subtitle", { count: reports.filter((r) => r.status === "pending").length })}
        </p>
      </HudPanel>

      {/* Status filter */}
      <div className="flex items-center gap-2 mb-4">
        {STATUS_FILTERS.map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`text-[8px] font-bold uppercase tracking-wider px-3 py-1.5 transition-all border-2 ${
              statusFilter === status
                ? "border-red-500 text-red-400 bg-red-500/10"
                : "border-border text-muted-foreground hover:text-foreground hover:bg-white/5"
            }`}
          >
            {t(`reportsMgmt.status.${status}`)}
            {status === "pending" && (
              <span className="ml-1.5 bg-red-500/20 text-red-400 px-1">
                {reports.filter((r) => r.status === "pending").length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Reports list */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground text-[9px] uppercase tracking-wider animate-pulse">
            {tc("loadingEllipsis")}
          </p>
        </div>
      ) : filteredReports.length === 0 ? (
        <HudPanel className="text-center py-8">
          <p className="text-[9px] text-muted-foreground">{t("noReports")}</p>
        </HudPanel>
      ) : (
        <div className="space-y-2">
          {filteredReports.map((report) => (
            <HudPanel key={report.id} variant={report.status === "pending" ? "default" : "default"}>
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-[9px] font-bold mb-1">
                    {report.levels?.name || t("levelRemoved")}
                  </p>
                  <p className="text-[8px] text-muted-foreground mb-1 flex items-center gap-1">
                    {t("reportedBy")} {report.profiles?.nickname || "?"}
                    <PixelIcon name={reasonIcons[report.reason] || "info"} size={10} />
                    {t(`reasons.${report.reason}`)}
                  </p>
                  {report.description && (
                    <p className="text-[8px] text-muted-foreground italic">
                      &ldquo;{report.description}&rdquo;
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-[7px] text-muted-foreground">
                      {new Date(report.created_at).toLocaleDateString("pt-BR")}
                    </p>
                    {report.status !== "pending" && (
                      <span className={`text-[7px] uppercase tracking-wider px-1 ${
                        report.status === "actioned" ? "text-red-400 bg-red-500/10" : "text-green-400 bg-green-500/10"
                      }`}>
                        {t(`reportsMgmt.status.${report.status}`)}
                      </span>
                    )}
                  </div>
                </div>
                {report.status === "pending" && (
                  <div className="flex gap-2 shrink-0">
                    <HudButton
                      onClick={() => handleReport(report.id, "dismissed")}
                      disabled={updating === report.id}
                      variant="secondary"
                      size="small"
                    >
                      {t("dismiss")}
                    </HudButton>
                    <HudButton
                      onClick={() => handleReport(report.id, "actioned")}
                      disabled={updating === report.id}
                      variant="danger"
                      size="small"
                    >
                      <PixelIcon name="lock" size={10} /> {t("hide")}
                    </HudButton>
                  </div>
                )}
              </div>
            </HudPanel>
          ))}
        </div>
      )}
    </main>
  );
}
