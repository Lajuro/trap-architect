import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/ranks";

/** GET /api/admin/activity — recent activity feed (admin only) */
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("creator_rank")
    .eq("id", user.id)
    .single();

  if (!profile || !isAdmin(profile.creator_rank)) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") ?? "all";
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "50")));

  interface Activity {
    type: string;
    timestamp: string;
    details: Record<string, unknown>;
  }

  const activities: Activity[] = [];

  // Fetch recent activities based on type filter
  const fetchPlays = type === "all" || type === "plays";
  const fetchLevels = type === "all" || type === "levels";
  const fetchReports = type === "all" || type === "reports";
  const fetchUsers = type === "all" || type === "users";

  const queries = [];

  if (fetchPlays) {
    queries.push(
      supabase
        .from("level_plays")
        .select("id, user_id, level_id, completed, deaths, time_ms, created_at, levels!inner(name), profiles!level_plays_user_id_fkey(nickname)")
        .order("created_at", { ascending: false })
        .limit(limit)
        .then(({ data }) => {
          for (const play of data ?? []) {
            activities.push({
              type: "play",
              timestamp: play.created_at,
              details: {
                userId: play.user_id,
                levelId: play.level_id,
                levelName: (play.levels as unknown as { name: string })?.name,
                playerName: (play.profiles as unknown as { nickname: string })?.nickname ?? "Anônimo",
                completed: play.completed,
                deaths: play.deaths,
                timeMs: play.time_ms,
              },
            });
          }
        })
    );
  }

  if (fetchLevels) {
    queries.push(
      supabase
        .from("levels")
        .select("id, name, author_id, published, created_at, profiles!inner(nickname)")
        .order("created_at", { ascending: false })
        .limit(limit)
        .then(({ data }) => {
          for (const level of data ?? []) {
            activities.push({
              type: level.published ? "level_published" : "level_draft",
              timestamp: level.created_at,
              details: {
                levelId: level.id,
                levelName: level.name,
                authorId: level.author_id,
                authorName: (level.profiles as unknown as { nickname: string })?.nickname,
              },
            });
          }
        })
    );
  }

  if (fetchReports) {
    queries.push(
      supabase
        .from("level_reports")
        .select("id, reason, status, created_at, profiles!level_reports_user_id_fkey(nickname), levels!level_reports_level_id_fkey(name)")
        .order("created_at", { ascending: false })
        .limit(limit)
        .then(({ data }) => {
          for (const report of data ?? []) {
            activities.push({
              type: "report",
              timestamp: report.created_at,
              details: {
                reportId: report.id,
                reason: report.reason,
                status: report.status,
                reporterName: (report.profiles as unknown as { nickname: string })?.nickname,
                levelName: (report.levels as unknown as { name: string })?.name,
              },
            });
          }
        })
    );
  }

  if (fetchUsers) {
    queries.push(
      supabase
        .from("profiles")
        .select("id, nickname, created_at")
        .order("created_at", { ascending: false })
        .limit(limit)
        .then(({ data }) => {
          for (const u of data ?? []) {
            activities.push({
              type: "user_joined",
              timestamp: u.created_at,
              details: {
                userId: u.id,
                nickname: u.nickname,
              },
            });
          }
        })
    );
  }

  await Promise.all(queries);

  // Sort all activities by timestamp descending, take top N
  activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return NextResponse.json({
    activities: activities.slice(0, limit),
  });
}
