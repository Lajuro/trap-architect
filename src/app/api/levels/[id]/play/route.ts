import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkAndUnlockAchievements } from "@/lib/achievements";

/** POST /api/levels/[id]/play — record a completed play */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await request.json();
  const deaths = Math.max(0, Math.floor(Number(body.deaths) || 0));
  const time_seconds = Math.max(0, Number(body.time_seconds) || 0);
  const completed = body.completed !== false;

  const { error } = await supabase.rpc("record_play", {
    p_level_id: id,
    p_user_id: user.id,
    p_deaths: deaths,
    p_time_seconds: time_seconds,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Check for new achievements
  const newAchievements = await checkAndUnlockAchievements(supabase, user.id, {
    completed,
    deaths,
    time_ms: time_seconds * 1000,
  });

  return NextResponse.json({ success: true, newAchievements });
}
