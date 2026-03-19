import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** POST /api/levels/[id]/rate — rate a level 1-5 stars */
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
  const stars = Number(body.stars);

  if (!Number.isInteger(stars) || stars < 1 || stars > 5) {
    return NextResponse.json({ error: "Avaliação inválida (1-5)" }, { status: 400 });
  }

  const { error } = await supabase.rpc("rate_level", {
    p_level_id: id,
    p_user_id: user.id,
    p_stars: stars,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Fetch updated averages
  const { data: level } = await supabase
    .from("levels")
    .select("avg_rating, rating_count")
    .eq("id", id)
    .single();

  return NextResponse.json({
    avg_rating: level?.avg_rating ?? 0,
    rating_count: level?.rating_count ?? 0,
  });
}
