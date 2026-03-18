"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { isAdmin } from "@/lib/ranks";
import HudBar from "@/components/ui/HudBar";
import HudPanel from "@/components/ui/HudPanel";
import HudButton from "@/components/ui/HudButton";
import { PixelIcon, type PixelIconName } from "@/components/ui/PixelIcon";

interface LevelRow {
  id: string;
  name: string;
  author_id: string;
  plays: number;
  likes: number;
  featured: boolean;
  featured_category: string | null;
  published: boolean;
  profiles: { nickname: string };
}

interface ReportRow {
  id: string;
  reason: string;
  description: string | null;
  status: string;
  created_at: string;
  profiles: { nickname: string };
  levels: { name: string; author_id: string };
}

const CATEGORIES = [
  "Nivel da Semana",
  "Classicos",
  "Mais Troll",
  "Design Criativo",
] as const;

export default function AdminPage() {
  const [levels, setLevels] = useState<LevelRow[]>([]);
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const loadLevels = useCallback(async () => {
    const { data } = await supabase
      .from("levels")
      .select("id, name, author_id, plays, likes, featured, featured_category, published, profiles!inner(nickname)")
      .eq("published", true)
      .order("created_at", { ascending: false });

    setLevels((data as unknown as LevelRow[]) ?? []);
  }, [supabase]);

  useEffect(() => {
    async function init() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("creator_rank")
        .eq("id", user.id)
        .single();

      if (!profile || !isAdmin(profile.creator_rank)) {
        router.push("/");
        return;
      }

      setAuthorized(true);
      await loadLevels();
      await loadReports();
      setLoading(false);
    }
    init();
  }, [router, supabase, loadLevels]);

  async function loadReports() {
    try {
      const res = await fetch("/api/admin/reports");
      if (res.ok) {
        const data = await res.json();
        setReports(data.reports || []);
      }
    } catch {
      // ignore
    }
  }

  async function handleReport(reportId: string, action: string) {
    setUpdating(reportId);
    await fetch("/api/admin/reports", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reportId, action }),
    });
    await loadReports();
    await loadLevels();
    setUpdating(null);
  }

  async function toggleFeatured(levelId: string, currentFeatured: boolean) {
    setUpdating(levelId);
    await fetch("/api/admin/featured", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        level_id: levelId,
        featured: !currentFeatured,
        featured_category: !currentFeatured ? "Nivel da Semana" : null,
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
      body: JSON.stringify({
        level_id: levelId,
        featured_category: category,
      }),
    });
    await loadLevels();
    setUpdating(null);
  }

  if (loading || !authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground text-[9px] uppercase tracking-wider">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <HudBar />

      <main className="max-w-7xl mx-auto px-4 py-6 w-full">
        <HudPanel variant="danger" className="mb-6">
          <h1 className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-2">
            <PixelIcon name="crown" size={16} color="#EF4444" /> Curadoria de Niveis
          </h1>
          <p className="text-[8px] text-muted-foreground mt-1">
            Destaque niveis e defina categorias do Developer&apos;s Choice.
          </p>
        </HudPanel>

        <div className="space-y-2">
          {levels.map((level) => (
            <HudPanel
              key={level.id}
              variant={level.featured ? "gold" : "default"}
              className="flex items-center gap-3"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Link
                    href={`/play/${level.id}`}
                    className="text-[9px] font-bold hover:text-primary truncate"
                  >
                    {level.name}
                  </Link>
                  {level.featured && (
                    <span className="flex items-center gap-1 text-[7px] text-yellow-400 uppercase tracking-wider">
                      <PixelIcon name="star" size={10} color="#FFD700" /> Destaque
                    </span>
                  )}
                </div>
                <p className="text-[8px] text-muted-foreground flex items-center gap-2">
                  por {level.profiles.nickname}
                  <span className="flex items-center gap-0.5"><PixelIcon name="play" size={8} color="#888" /> {level.plays}</span>
                  <span className="flex items-center gap-0.5"><PixelIcon name="heart" size={8} color="#888" /> {level.likes}</span>
                </p>
              </div>

              {level.featured && (
                <select
                  value={level.featured_category || ""}
                  onChange={(e) =>
                    setCategory(level.id, e.target.value || null)
                  }
                  className="text-[8px] bg-background border-2 border-border px-2 py-1"
                  disabled={updating === level.id}
                >
                  <option value="">Sem categoria</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              )}

              <HudButton
                onClick={() => toggleFeatured(level.id, level.featured)}
                disabled={updating === level.id}
                variant={level.featured ? "danger" : "gold"}
                size="small"
              >
                {updating === level.id
                  ? "..."
                  : level.featured
                    ? "Remover"
                    : "Destacar"}
              </HudButton>
            </HudPanel>
          ))}

          {levels.length === 0 && (
            <HudPanel className="text-center py-12">
              <p className="text-[9px] text-muted-foreground">Nenhum nivel publicado encontrado.</p>
            </HudPanel>
          )}
        </div>

        {/* Reports section */}
        <HudPanel variant="danger" className="mt-8 mb-4">
          <h2 className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-2">
            <PixelIcon name="flag" size={14} color="#EF4444" /> Denuncias Pendentes
          </h2>
        </HudPanel>
        {reports.length === 0 ? (
          <HudPanel className="text-center py-8">
            <p className="text-[9px] text-muted-foreground">Nenhuma denuncia pendente.</p>
          </HudPanel>
        ) : (
          <div className="space-y-2">
            {reports.map((report) => {
              const reasonIcons: Record<string, PixelIconName> = {
                offensive: "ban",
                impossible: "skull",
                spam: "warning",
                bug: "bug",
                other: "info",
              };
              const reasonLabels: Record<string, string> = {
                offensive: "Conteudo ofensivo",
                impossible: "Impossivel",
                spam: "Spam",
                bug: "Bug",
                other: "Outro",
              };
              return (
                <HudPanel key={report.id}>
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-[9px] font-bold mb-1">
                        {report.levels?.name || "Nivel removido"}
                      </p>
                      <p className="text-[8px] text-muted-foreground mb-1 flex items-center gap-1">
                        Reportado por {report.profiles?.nickname || "?"}
                        <PixelIcon name={reasonIcons[report.reason] || "info"} size={10} />
                        {reasonLabels[report.reason] || report.reason}
                      </p>
                      {report.description && (
                        <p className="text-[8px] text-muted-foreground italic">
                          &ldquo;{report.description}&rdquo;
                        </p>
                      )}
                      <p className="text-[7px] text-muted-foreground mt-1">
                        {new Date(report.created_at).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <HudButton
                        onClick={() => handleReport(report.id, "dismissed")}
                        disabled={updating === report.id}
                        variant="secondary"
                        size="small"
                      >
                        Dispensar
                      </HudButton>
                      <HudButton
                        onClick={() => handleReport(report.id, "actioned")}
                        disabled={updating === report.id}
                        variant="danger"
                        size="small"
                      >
                        <PixelIcon name="lock" size={10} /> Ocultar
                      </HudButton>
                    </div>
                  </div>
                </HudPanel>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
