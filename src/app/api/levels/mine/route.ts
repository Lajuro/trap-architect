import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** GET /api/levels/mine — list current user's levels (drafts + published) */
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const filter = searchParams.get("filter"); // "draft" | "published" | null (all)
  const sort = searchParams.get("sort") || "updated_at";
  const allowedSorts = ["updated_at", "created_at", "name"];
  const sortCol = allowedSorts.includes(sort) ? sort : "updated_at";

  let query = supabase
    .from("levels")
    .select("id, name, subtitle, published, thumbnail, bg_color, grid_w, grid_h, plays, likes, difficulty, tags, theme, created_at, updated_at")
    .eq("author_id", user.id)
    .order(sortCol, { ascending: false });

  if (filter === "draft") {
    query = query.eq("published", false);
  } else if (filter === "published") {
    query = query.eq("published", true);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ levels: data });
}
