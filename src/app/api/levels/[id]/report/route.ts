import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const VALID_REASONS = ["offensive", "impossible", "spam", "bug", "other"];

/** POST /api/levels/[id]/report — report a level */
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

  const body = await request.json();
  const reason = String(body.reason || "").trim();
  const description = String(body.description || "").trim().slice(0, 500);

  if (!VALID_REASONS.includes(reason)) {
    return NextResponse.json({ error: "Motivo inválido" }, { status: 400 });
  }

  // Check duplicate
  const { data: existing } = await supabase
    .from("level_reports")
    .select("id")
    .eq("user_id", user.id)
    .eq("level_id", id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: "Você já denunciou este nível" }, { status: 409 });
  }

  const { error } = await supabase
    .from("level_reports")
    .insert({
      user_id: user.id,
      level_id: id,
      reason,
      description: description || null,
    });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true }, { status: 201 });
}
