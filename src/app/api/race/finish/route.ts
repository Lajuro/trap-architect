import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** POST /api/race/finish — report race completion (requires auth) */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await request.json();
  const { roomId, timeMs, deaths } = body as {
    roomId?: string;
    timeMs?: number;
    deaths?: number;
  };

  if (!roomId || timeMs == null || deaths == null) {
    return NextResponse.json(
      { error: "roomId, timeMs e deaths são obrigatórios" },
      { status: 400 },
    );
  }

  // Fetch the room
  const { data: room, error: fetchError } = await supabase
    .from("race_rooms")
    .select("*")
    .eq("id", roomId)
    .single();

  if (!room || fetchError) {
    return NextResponse.json(
      { error: "Sala não encontrada" },
      { status: 404 },
    );
  }

  // Verify the user is in this room
  const isHost = room.host_id === user.id;
  const isGuest = room.guest_id === user.id;
  if (!isHost && !isGuest) {
    return NextResponse.json(
      { error: "Você não faz parte desta sala" },
      { status: 403 },
    );
  }

  // Build the update
  const update: Record<string, unknown> = {};

  if (isHost) {
    if (room.host_time_ms != null) {
      return NextResponse.json(
        { error: "Resultado já registrado" },
        { status: 409 },
      );
    }
    update.host_time_ms = timeMs;
    update.host_deaths = deaths;
  } else {
    if (room.guest_time_ms != null) {
      return NextResponse.json(
        { error: "Resultado já registrado" },
        { status: 409 },
      );
    }
    update.guest_time_ms = timeMs;
    update.guest_deaths = deaths;
  }

  // Check if both players have now finished
  const hostDone = isHost ? true : room.host_time_ms != null;
  const guestDone = isGuest ? true : room.guest_time_ms != null;

  if (hostDone && guestDone) {
    const finalHostTime = isHost ? timeMs : (room.host_time_ms as number);
    const finalGuestTime = isGuest ? timeMs : (room.guest_time_ms as number);

    // Lower time wins; on tie, fewer deaths wins; on double tie, host wins
    let winnerId: string;
    if (finalHostTime < finalGuestTime) {
      winnerId = room.host_id;
    } else if (finalGuestTime < finalHostTime) {
      winnerId = room.guest_id!;
    } else {
      const hostDeaths = isHost ? deaths : (room.host_deaths as number);
      const guestDeaths = isGuest ? deaths : (room.guest_deaths as number);
      winnerId = hostDeaths <= guestDeaths ? room.host_id : room.guest_id!;
    }

    update.winner_id = winnerId;
    update.status = "finished";
  } else {
    update.status = "racing";
  }

  const { error: updateError } = await supabase
    .from("race_rooms")
    .update(update)
    .eq("id", roomId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({
    finished: hostDone && guestDone,
    winnerId: update.winner_id ?? null,
  });
}
