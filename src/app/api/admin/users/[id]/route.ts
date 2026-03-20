import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/ranks";

/** GET /api/admin/users/[id] — detailed user info (admin only) */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: userId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { data: adminProfile } = await supabase
    .from("profiles")
    .select("creator_rank")
    .eq("id", user.id)
    .single();

  if (!adminProfile || !isAdmin(adminProfile.creator_rank)) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  // Fetch profile, levels, and achievements in parallel
  const [profileRes, levelsRes, achievementsRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single(),
    supabase
      .from("levels")
      .select("id, name, published, plays, likes, featured, created_at, difficulty, avg_rating, rating_count, tags, theme, weekly_challenge_date")
      .eq("author_id", userId)
      .order("created_at", { ascending: false }),
    supabase
      .from("user_achievements")
      .select("achievement_id, unlocked_at")
      .eq("user_id", userId)
      .order("unlocked_at", { ascending: false }),
  ]);

  if (profileRes.error || !profileRes.data) {
    return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
  }

  return NextResponse.json({
    profile: profileRes.data,
    levels: levelsRes.data ?? [],
    achievements: achievementsRes.data ?? [],
  });
}
