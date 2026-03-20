import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/ranks";

/** GET /api/admin/stats — aggregate dashboard statistics (admin only) */
export async function GET() {
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

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayISO = today.toISOString();

  // Run all count queries in parallel
  const [
    usersResult,
    levelsResult,
    publishedResult,
    playsResult,
    reportsResult,
    pendingReportsResult,
    newUsersTodayResult,
    newLevelsTodayResult,
    newPlaysTodayResult,
    likesResult,
  ] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("levels").select("id", { count: "exact", head: true }),
    supabase.from("levels").select("id", { count: "exact", head: true }).eq("published", true),
    supabase.from("level_plays").select("id", { count: "exact", head: true }),
    supabase.from("level_reports").select("id", { count: "exact", head: true }),
    supabase.from("level_reports").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", todayISO),
    supabase.from("levels").select("id", { count: "exact", head: true }).gte("created_at", todayISO),
    supabase.from("level_plays").select("id", { count: "exact", head: true }).gte("created_at", todayISO),
    supabase.from("level_likes").select("user_id", { count: "exact", head: true }),
  ]);

  return NextResponse.json({
    totalUsers: usersResult.count ?? 0,
    totalLevels: levelsResult.count ?? 0,
    publishedLevels: publishedResult.count ?? 0,
    totalPlays: playsResult.count ?? 0,
    totalReports: reportsResult.count ?? 0,
    pendingReports: pendingReportsResult.count ?? 0,
    totalLikes: likesResult.count ?? 0,
    newUsersToday: newUsersTodayResult.count ?? 0,
    newLevelsToday: newLevelsTodayResult.count ?? 0,
    newPlaysToday: newPlaysTodayResult.count ?? 0,
  });
}
