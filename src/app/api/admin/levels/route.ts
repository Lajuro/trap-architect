import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/ranks";

/** GET /api/admin/levels — list ALL levels with pagination/search/filters (admin only) */
export async function GET(request: NextRequest) {
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

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20")));
  const search = searchParams.get("search")?.trim() ?? "";
  const sort = searchParams.get("sort") ?? "created_at";
  const order = searchParams.get("order") ?? "desc";
  const published = searchParams.get("published"); // "true", "false", or null (all)
  const featured = searchParams.get("featured");   // "true", "false", or null (all)
  const author = searchParams.get("author");

  const allowedSorts = ["created_at", "name", "plays", "likes", "difficulty", "avg_rating"];
  const sortCol = allowedSorts.includes(sort) ? sort : "created_at";
  const ascending = order === "asc";
  const offset = (page - 1) * limit;

  let query = supabase
    .from("levels")
    .select("id, name, author_id, plays, likes, featured, featured_category, published, created_at, difficulty, avg_rating, rating_count, tags, theme, weekly_challenge_date, profiles!inner(nickname)", { count: "exact" });

  if (search) {
    query = query.ilike("name", `%${search}%`);
  }

  if (published === "true") query = query.eq("published", true);
  else if (published === "false") query = query.eq("published", false);

  if (featured === "true") query = query.eq("featured", true);
  else if (featured === "false") query = query.eq("featured", false);

  if (author) query = query.eq("author_id", author);

  query = query.order(sortCol, { ascending }).range(offset, offset + limit - 1);

  const { data, count, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    levels: data ?? [],
    total: count ?? 0,
    page,
    limit,
  });
}
