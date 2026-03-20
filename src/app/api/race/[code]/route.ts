import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** GET /api/race/[code] — get race room details by invite code */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const cleanCode = code.trim().toUpperCase().slice(0, 6);

  const { data: room, error } = await supabase
    .from("race_rooms")
    .select(
      `*, 
       host:profiles!race_rooms_host_id_fkey(id, nickname, photo_url, equipped_frame),
       guest:profiles!race_rooms_guest_id_fkey(id, nickname, photo_url, equipped_frame)`,
    )
    .eq("code", cleanCode)
    .single();

  if (!room || error) {
    return NextResponse.json(
      { error: "Sala não encontrada" },
      { status: 404 },
    );
  }

  // Only room participants can view
  if (room.host_id !== user.id && room.guest_id !== user.id) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  // Fetch level data for the game
  const { data: level } = await supabase
    .from("levels")
    .select(
      "id, name, subtitle, bg_color, music, grid_w, grid_h, tiles, entities, trolls, player_start, theme, background_tiles",
    )
    .eq("id", room.level_id)
    .single();

  return NextResponse.json({ room, level, userId: user.id });
}
