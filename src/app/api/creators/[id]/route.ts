import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** GET /api/creators/[id] — public creator profile + their published levels */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "id, nickname, photo_url, creator_rank, levels_published, total_plays, total_likes, created_at",
    )
    .eq("id", id)
    .single();

  if (!profile) {
    return NextResponse.json(
      { error: "Criador não encontrado" },
      { status: 404 },
    );
  }

  const { data: levels } = await supabase
    .from("levels")
    .select("id, name, subtitle, bg_color, plays, likes, difficulty, created_at")
    .eq("author_id", id)
    .eq("published", true)
    .order("created_at", { ascending: false });

  return NextResponse.json({ profile, levels: levels || [] });
}
