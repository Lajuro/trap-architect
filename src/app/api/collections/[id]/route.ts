import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** GET /api/collections/[id] — get collection with its levels */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: collection, error } = await supabase
    .from("collections")
    .select("*, profiles!inner(nickname)")
    .eq("id", id)
    .single();

  if (error || !collection) {
    return NextResponse.json({ error: "Coleção não encontrada" }, { status: 404 });
  }

  // Get levels in collection
  const { data: collectionLevels } = await supabase
    .from("collection_levels")
    .select("position, levels!inner(id, name, subtitle, plays, likes, difficulty, bg_color, thumbnail, author_id, profiles:profiles!inner(nickname, photo_url))")
    .eq("collection_id", id)
    .order("position", { ascending: true });

  return NextResponse.json({
    collection,
    levels: (collectionLevels ?? []).map((cl) => ({ ...cl.levels, position: cl.position })),
  });
}

/** POST /api/collections/[id] — add a level to collection */
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

  // Verify ownership
  const { data: collection } = await supabase
    .from("collections")
    .select("user_id")
    .eq("id", id)
    .single();

  if (!collection || collection.user_id !== user.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  const body = await request.json();
  const levelId = String(body.level_id || "");

  if (!levelId) {
    return NextResponse.json({ error: "level_id obrigatório" }, { status: 400 });
  }

  // Check level limit (50 per collection)
  const { count } = await supabase
    .from("collection_levels")
    .select("level_id", { count: "exact", head: true })
    .eq("collection_id", id);

  if ((count ?? 0) >= 50) {
    return NextResponse.json({ error: "Limite de 50 níveis por coleção" }, { status: 400 });
  }

  const position = (count ?? 0) + 1;

  const { error } = await supabase
    .from("collection_levels")
    .insert({ collection_id: id, level_id: levelId, position });

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Nível já está na coleção" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

/** DELETE /api/collections/[id] — delete collection (owner only) */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { error } = await supabase
    .from("collections")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
