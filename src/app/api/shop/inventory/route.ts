import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** GET /api/shop/inventory — get user's owned cosmetics and coin balance */
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("creator_coins, unlocked_cosmetics, equipped_skin, equipped_trail, equipped_death_effect, equipped_frame")
    .eq("id", user.id)
    .single();

  if (error || !profile) {
    return NextResponse.json({ error: "Perfil não encontrado" }, { status: 404 });
  }

  return NextResponse.json({
    creator_coins: profile.creator_coins,
    unlocked_cosmetics: profile.unlocked_cosmetics || [],
    equipped_skin: profile.equipped_skin,
    equipped_trail: profile.equipped_trail,
    equipped_death_effect: profile.equipped_death_effect,
    equipped_frame: profile.equipped_frame,
  });
}
