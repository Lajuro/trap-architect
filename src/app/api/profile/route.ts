import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { recalcCreatorRank } from "@/lib/rank-check";
import { checkAndUnlockAchievements } from "@/lib/achievements";

/** GET /api/profile — get current user profile */
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Auto-recalculate rank and notify if changed
  const rankUp = await recalcCreatorRank(supabase, user.id);
  if (rankUp) {
    data.creator_rank = rankUp.newRank;
  }

  // Check for new achievements on profile load
  const newAchievements = await checkAndUnlockAchievements(supabase, user.id);

  // Fetch all user achievements
  const { data: achievements } = await supabase
    .from("user_achievements")
    .select("achievement_id, unlocked_at")
    .eq("user_id", user.id);

  return NextResponse.json({ profile: data, rankUp, achievements: achievements ?? [], newAchievements });
}

/** PATCH /api/profile — update current user profile */
export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await request.json();
  const allowed = ["nickname", "photo_url", "equipped_skin", "equipped_trail", "equipped_death_effect", "equipped_frame", "equipped_title", "campaign_progress", "campaign_completed"];
  const updates: Record<string, unknown> = {};
  for (const key of allowed) {
    if (body[key] !== undefined) {
      updates[key] = body[key];
    }
  }

  if (updates.nickname) {
    const nick = String(updates.nickname).trim();
    if (nick.length < 2 || nick.length > 30) {
      return NextResponse.json({ error: "Nickname deve ter entre 2 e 30 caracteres" }, { status: 400 });
    }
    updates.nickname = nick;
  }

  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", user.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ profile: data });
}
