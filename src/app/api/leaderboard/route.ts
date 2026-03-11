import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** GET /api/leaderboard — global or per-level leaderboard */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const levelId = searchParams.get("level_id");
  const supabase = await createClient();

  if (levelId) {
    // Per-level leaderboard: fewest deaths, fastest time
    const { data } = await supabase
      .from("level_plays")
      .select(
        "deaths, time_ms, created_at, profiles!inner(nickname)",
      )
      .eq("level_id", levelId)
      .eq("completed", true)
      .order("deaths", { ascending: true })
      .order("time_ms", { ascending: true })
      .limit(20);

    return NextResponse.json({ leaderboard: data || [] });
  }

  // Global leaderboard: top creators by total likes
  const { data } = await supabase
    .from("profiles")
    .select(
      "id, nickname, photo_url, creator_rank, total_likes, total_plays, levels_published",
    )
    .order("total_likes", { ascending: false })
    .limit(20);

  return NextResponse.json({ leaderboard: data || [] });
}
