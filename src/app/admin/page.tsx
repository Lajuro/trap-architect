"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { isAdmin } from "@/lib/ranks";

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
  "Nível da Semana",
  "Clássicos",
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
        featured_category: !currentFeatured ? "Nível da Semana" : null,
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
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-border px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-primary">
            🐱 Trap Architect
          </Link>
          <span className="text-sm font-bold text-red-400">
            Painel Admin
          </span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <h1 className="text-3xl font-bold mb-2">Curadoria de Níveis</h1>
        <p className="text-muted-foreground mb-8">
          Destaque níveis e defina categorias do Developer&apos;s Choice.
        </p>

        <div className="space-y-3">
          {levels.map((level) => (
            <div
              key={level.id}
              className="bg-card border border-border rounded-lg p-4 flex items-center gap-4"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Link
                    href={`/play/${level.id}`}
                    className="font-bold hover:text-primary truncate"
                  >
                    {level.name}
                  </Link>
                  {level.featured && (
                    <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full">
                      ⭐ Destaque
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  por {level.profiles.nickname} · ▶ {level.plays} · ♥{" "}
                  {level.likes}
                </p>
              </div>

              {level.featured && (
                <select
                  value={level.featured_category || ""}
                  onChange={(e) =>
                    setCategory(level.id, e.target.value || null)
                  }
                  className="text-xs bg-background border border-border rounded px-2 py-1"
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

              <button
                onClick={() => toggleFeatured(level.id, level.featured)}
                disabled={updating === level.id}
                className={`text-xs px-3 py-1.5 rounded font-medium transition-colors disabled:opacity-50 ${
                  level.featured
                    ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                    : "bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30"
                }`}
              >
                {updating === level.id
                  ? "..."
                  : level.featured
                    ? "Remover Destaque"
                    : "⭐ Destacar"}
              </button>
            </div>
          ))}

          {levels.length === 0 && (
            <p className="text-muted-foreground text-center py-12">
              Nenhum nível publicado encontrado.
            </p>
          )}
        </div>

        {/* Reports section */}
        <h2 className="text-2xl font-bold mt-12 mb-4">🚩 Denúncias Pendentes</h2>
        {reports.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            Nenhuma denúncia pendente.
          </p>
        ) : (
          <div className="space-y-3">
            {reports.map((report) => {
              const reasonLabels: Record<string, string> = {
                offensive: "🚫 Conteúdo ofensivo",
                impossible: "❌ Impossível",
                spam: "📋 Spam",
                bug: "🐛 Bug",
                other: "🔄 Outro",
              };
              return (
                <div
                  key={report.id}
                  className="bg-card border border-border rounded-lg p-4"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium mb-1">
                        {report.levels?.name || "Nível removido"}
                      </p>
                      <p className="text-xs text-muted-foreground mb-1">
                        Reportado por {report.profiles?.nickname || "?"} ·{" "}
                        {reasonLabels[report.reason] || report.reason}
                      </p>
                      {report.description && (
                        <p className="text-sm text-muted-foreground italic">
                          &ldquo;{report.description}&rdquo;
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(report.created_at).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleReport(report.id, "dismissed")}
                        disabled={updating === report.id}
                        className="text-xs px-3 py-1.5 rounded bg-muted hover:bg-muted/80 disabled:opacity-50"
                      >
                        ✅ Dispensar
                      </button>
                      <button
                        onClick={() => handleReport(report.id, "actioned")}
                        disabled={updating === report.id}
                        className="text-xs px-3 py-1.5 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30 disabled:opacity-50"
                      >
                        🔒 Ocultar Nível
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
