import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** GET /api/levels — list published levels with sorting/pagination */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const sort = searchParams.get("sort") || "created_at";
  const order = searchParams.get("order") === "asc" ? true : false;
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20")));
  const featured = searchParams.get("featured") === "true";
  const authorId = searchParams.get("author");
  const search = searchParams.get("search");
  const offset = (page - 1) * limit;

  const allowedSorts = ["created_at", "plays", "likes", "difficulty", "name"];
  const sortCol = allowedSorts.includes(sort) ? sort : "created_at";

  const supabase = await createClient();

  let query = supabase
    .from("levels")
    .select("*, profiles!inner(nickname, photo_url, creator_rank)", { count: "exact" })
    .eq("published", true)
    .order(sortCol, { ascending: order })
    .range(offset, offset + limit - 1);

  if (featured) {
    query = query.eq("featured", true);
  }

  if (authorId) {
    query = query.eq("author_id", authorId);
  }

  if (search) {
    query = query.ilike("name", `%${search}%`);
  }

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    levels: data,
    total: count,
    page,
    limit,
  });
}

/** POST /api/levels — create/save a level (requires auth) */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await request.json();
  const { name, subtitle, bgColor, music, gridW, gridH, tiles, entities, trolls, playerStart, published } = body;

  if (!name || !tiles || !gridW || !gridH) {
    return NextResponse.json({ error: "Dados do nível incompletos" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("levels")
    .insert({
      author_id: user.id,
      name,
      subtitle: subtitle || null,
      bg_color: bgColor || "#5c94fc",
      music: music || "level1",
      grid_w: gridW,
      grid_h: gridH,
      tiles,
      entities: entities || [],
      trolls: trolls || [],
      player_start: playerStart || { x: 3, y: 12 },
      published: published ?? false,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Update author's levels_published count if publishing
  if (published) {
    await supabase
      .from("profiles")
      .update({
        levels_published: (await supabase
          .from("levels")
          .select("id", { count: "exact" })
          .eq("author_id", user.id)
          .eq("published", true)
          .then((r) => r.count)) ?? 0,
      })
      .eq("id", user.id);
  }

  return NextResponse.json({ level: data }, { status: 201 });
}
