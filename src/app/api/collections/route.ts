import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** GET /api/collections — list all public collections (or user's own) */
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("user_id");
  const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit")) || 20));

  let query = supabase
    .from("collections")
    .select("*, profiles!inner(nickname)")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (userId) {
    query = query.eq("user_id", userId);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ collections: data ?? [] });
}

/** POST /api/collections — create a new collection */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await request.json();
  const name = String(body.name || "").trim().slice(0, 60);
  const description = String(body.description || "").trim().slice(0, 300);

  if (!name || name.length < 2) {
    return NextResponse.json({ error: "Nome deve ter pelo menos 2 caracteres" }, { status: 400 });
  }

  // Check collection limit (10 per user)
  const { count } = await supabase
    .from("collections")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  if ((count ?? 0) >= 10) {
    return NextResponse.json({ error: "Limite de 10 coleções atingido" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("collections")
    .insert({ user_id: user.id, name, description })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ collection: data });
}
