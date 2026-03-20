import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** POST /api/race/join — join a race room by invite code (requires auth) */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await request.json();
  const { code } = body as { code?: string };

  if (!code || typeof code !== "string") {
    return NextResponse.json(
      { error: "Código é obrigatório" },
      { status: 400 },
    );
  }

  // Sanitize code: uppercase, trim, max 6 chars
  const cleanCode = code.trim().toUpperCase().slice(0, 6);

  // Find a waiting room with this code
  const { data: room, error: findError } = await supabase
    .from("race_rooms")
    .select("id, level_id, host_id, guest_id, status, expires_at")
    .eq("code", cleanCode)
    .single();

  if (!room || findError) {
    return NextResponse.json(
      { error: "Sala não encontrada" },
      { status: 404 },
    );
  }

  // Validate room state
  if (new Date(room.expires_at) < new Date()) {
    return NextResponse.json({ error: "Sala expirada" }, { status: 410 });
  }

  if (room.status !== "waiting") {
    return NextResponse.json(
      { error: "Sala não está disponível" },
      { status: 409 },
    );
  }

  if (room.guest_id) {
    return NextResponse.json({ error: "Sala já está cheia" }, { status: 409 });
  }

  if (room.host_id === user.id) {
    return NextResponse.json(
      { error: "Você não pode entrar na sua própria sala" },
      { status: 400 },
    );
  }

  // Join the room
  const { error: updateError } = await supabase
    .from("race_rooms")
    .update({ guest_id: user.id, status: "ready" })
    .eq("id", room.id)
    .eq("status", "waiting"); // Optimistic lock

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json(
    { roomId: room.id, levelId: room.level_id },
    { status: 200 },
  );
}
