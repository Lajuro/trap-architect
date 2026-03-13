import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** GET /api/levels/[id] — get a single level with author info */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("levels")
    .select("*, profiles!inner(nickname, photo_url, creator_rank)")
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Nível não encontrado" }, { status: 404 });
  }

  // Check access: published or author
  const { data: { user } } = await supabase.auth.getUser();
  if (!data.published && data.author_id !== user?.id) {
    return NextResponse.json({ error: "Nível não encontrado" }, { status: 404 });
  }

  return NextResponse.json({ level: data });
}

/** PATCH /api/levels/[id] — update a level (author only) */
export async function PATCH(
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
  const { data: existing } = await supabase
    .from("levels")
    .select("author_id")
    .eq("id", id)
    .single();

  if (!existing || existing.author_id !== user.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  const body = await request.json();
  const allowed = ["name", "subtitle", "bg_color", "music", "grid_w", "grid_h", "tiles", "entities", "trolls", "player_start", "published", "thumbnail"];
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const key of allowed) {
    if (body[key] !== undefined) {
      updates[key] = body[key];
    }
  }

  const { data, error } = await supabase
    .from("levels")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ level: data });
}

/** DELETE /api/levels/[id] — delete a level (author only) */
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
    .from("levels")
    .delete()
    .eq("id", id)
    .eq("author_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
