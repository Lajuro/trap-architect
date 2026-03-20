import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/ranks";

/** GET /api/admin/users — list all users with pagination/search (admin only) */
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

  const allowedSorts = ["created_at", "nickname", "levels_published", "total_plays", "total_likes", "creator_rank", "creator_coins"];
  const sortCol = allowedSorts.includes(sort) ? sort : "created_at";
  const ascending = order === "asc";
  const offset = (page - 1) * limit;

  let query = supabase
    .from("profiles")
    .select("id, nickname, photo_url, creator_rank, levels_published, total_plays, total_likes, creator_coins, created_at, banned_at, levels_completed, total_deaths", { count: "exact" });

  if (search) {
    query = query.ilike("nickname", `%${search}%`);
  }

  query = query.order(sortCol, { ascending }).range(offset, offset + limit - 1);

  const { data, count, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    users: data ?? [],
    total: count ?? 0,
    page,
    limit,
  });
}

/** PATCH /api/admin/users — update user rank or ban status (admin only) */
export async function PATCH(request: NextRequest) {
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

  const body = await request.json();
  const { userId, action, value } = body;

  if (!userId || !action) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  // Prevent self-modification
  if (userId === user.id) {
    return NextResponse.json({ error: "Não é possível modificar o próprio perfil" }, { status: 400 });
  }

  switch (action) {
    case "setRank": {
      const rank = parseInt(value);
      if (isNaN(rank) || rank < 0 || rank > 99) {
        return NextResponse.json({ error: "Rank inválido" }, { status: 400 });
      }
      const { error } = await supabase
        .from("profiles")
        .update({ creator_rank: rank })
        .eq("id", userId);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true });
    }
    case "ban": {
      const { error } = await supabase
        .from("profiles")
        .update({ banned_at: new Date().toISOString() })
        .eq("id", userId);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true });
    }
    case "unban": {
      const { error } = await supabase
        .from("profiles")
        .update({ banned_at: null })
        .eq("id", userId);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true });
    }
    default:
      return NextResponse.json({ error: "Ação inválida" }, { status: 400 });
  }
}
