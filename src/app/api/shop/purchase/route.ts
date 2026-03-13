import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { SKINS, TRAILS, DEATH_EFFECTS, FRAMES } from "@/game/constants";

// All purchasable items with their costs
function getItemCost(itemId: string): number | null {
  const all = [
    ...SKINS.map((s) => ({ id: s.id, cost: s.cost })),
    ...TRAILS.map((t) => ({ id: t.id, cost: t.cost })),
    ...DEATH_EFFECTS.map((d) => ({ id: d.id, cost: d.cost })),
    ...FRAMES.map((f) => ({ id: f.id, cost: f.cost })),
  ];
  const item = all.find((i) => i.id === itemId);
  return item ? item.cost : null;
}

function getItemType(itemId: string): string | null {
  if (SKINS.some((s) => s.id === itemId)) return "skin";
  if (TRAILS.some((t) => t.id === itemId)) return "trail";
  if (DEATH_EFFECTS.some((d) => d.id === itemId)) return "death_effect";
  if (FRAMES.some((f) => f.id === itemId)) return "frame";
  return null;
}

/** POST /api/shop/purchase — purchase a cosmetic item */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await request.json();
  const itemId = body.item_id;

  if (!itemId || typeof itemId !== "string") {
    return NextResponse.json({ error: "item_id é obrigatório" }, { status: 400 });
  }

  const cost = getItemCost(itemId);
  if (cost === null) {
    return NextResponse.json({ error: "Item não encontrado" }, { status: 404 });
  }

  const itemType = getItemType(itemId);

  // Get current profile
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("creator_coins, unlocked_cosmetics")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return NextResponse.json({ error: "Perfil não encontrado" }, { status: 404 });
  }

  // Check if already owned
  const unlocked: string[] = profile.unlocked_cosmetics || [];
  if (unlocked.includes(itemId)) {
    return NextResponse.json({ error: "Item já adquirido" }, { status: 400 });
  }

  // Free items (cost 0) like defaults don't need coin check
  if (cost > 0 && profile.creator_coins < cost) {
    return NextResponse.json({ error: "Moedas de criador insuficientes" }, { status: 400 });
  }

  // Deduct coins and add to unlocked_cosmetics
  const { data: updated, error: updateError } = await supabase
    .from("profiles")
    .update({
      creator_coins: profile.creator_coins - cost,
      unlocked_cosmetics: [...unlocked, itemId],
    })
    .eq("id", user.id)
    .select("creator_coins, unlocked_cosmetics")
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    remaining_coins: updated.creator_coins,
    item: { id: itemId, type: itemType },
  });
}
