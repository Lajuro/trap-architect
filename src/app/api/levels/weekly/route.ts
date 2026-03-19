import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** GET /api/levels/weekly — get the current weekly challenge level */
export async function GET() {
  const supabase = await createClient();

  // Get the most recent weekly challenge
  const { data, error } = await supabase
    .from("levels")
    .select("*, profiles!inner(nickname, photo_url, creator_rank)")
    .not("weekly_challenge_date", "is", null)
    .eq("published", true)
    .order("weekly_challenge_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ weekly: null });
  }

  // Check if the weekly challenge is still active (within current week)
  const challengeDate = new Date(data.weekly_challenge_date);
  const now = new Date();
  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  const isActive = now.getTime() - challengeDate.getTime() < msPerWeek;

  return NextResponse.json({
    weekly: isActive ? data : null,
    expired: !isActive,
  });
}
