import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import crypto from "crypto";

function generateCode(): string {
  // 6-char alphanumeric code (uppercase letters + digits, no ambiguous chars)
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.randomBytes(6);
  return Array.from(bytes)
    .map((b) => chars[b % chars.length])
    .join("");
}

/** POST /api/race/create — create a race room (requires auth) */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await request.json();
  const { levelId } = body as { levelId?: string };

  if (!levelId) {
    return NextResponse.json(
      { error: "levelId é obrigatório" },
      { status: 400 },
    );
  }

  // Verify the level exists and is published
  const { data: level } = await supabase
    .from("levels")
    .select("id")
    .eq("id", levelId)
    .eq("published", true)
    .single();

  if (!level) {
    return NextResponse.json(
      { error: "Nível não encontrado" },
      { status: 404 },
    );
  }

  // Generate a unique invite code (retry on collision)
  let code = generateCode();
  let attempts = 0;
  while (attempts < 5) {
    const { data, error } = await supabase
      .from("race_rooms")
      .insert({
        code,
        level_id: levelId,
        host_id: user.id,
        status: "waiting",
      })
      .select("id, code")
      .single();

    if (data) {
      return NextResponse.json(
        { roomId: data.id, code: data.code },
        { status: 201 },
      );
    }

    // Unique violation on code — retry with a new one
    if (error?.code === "23505") {
      code = generateCode();
      attempts++;
      continue;
    }

    return NextResponse.json({ error: error?.message }, { status: 500 });
  }

  return NextResponse.json(
    { error: "Falha ao gerar código único" },
    { status: 500 },
  );
}
