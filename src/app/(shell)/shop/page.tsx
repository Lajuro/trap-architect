"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { SKINS, TRAILS, DEATH_EFFECTS, FRAMES } from "@/game/constants";
import HudPanel from "@/components/ui/HudPanel";
import HudButton from "@/components/ui/HudButton";
import { PixelIcon, type PixelIconName } from "@/components/ui/PixelIcon";

const LS_EQUIPPED_SKIN = "trap_equipped_skin";
const LS_EQUIPPED_TRAIL = "trap_equipped_trail";
const LS_EQUIPPED_DEATH = "trap_equipped_death_effect";
const LS_EQUIPPED_FRAME = "trap_equipped_frame";
const LS_UNLOCKED = "trap_unlocked_cosmetics";

function syncToLocalStorage(data: {
  equipped_skin: string;
  equipped_trail: string;
  equipped_death_effect: string;
  equipped_frame: string;
  unlocked_cosmetics: string[];
}) {
  localStorage.setItem(LS_EQUIPPED_SKIN, data.equipped_skin || "default");
  localStorage.setItem(LS_EQUIPPED_TRAIL, data.equipped_trail || "trail_none");
  localStorage.setItem(LS_EQUIPPED_DEATH, data.equipped_death_effect || "death_default");
  localStorage.setItem(LS_EQUIPPED_FRAME, data.equipped_frame || "frame_none");
  localStorage.setItem(LS_UNLOCKED, JSON.stringify(data.unlocked_cosmetics || []));
}

export default function ShopPage() {
  const [coins, setCoins] = useState(0);
  const [unlocked, setUnlocked] = useState<string[]>([]);
  const [equippedSkin, setEquippedSkin] = useState("default");
  const [equippedTrail, setEquippedTrail] = useState("trail_none");
  const [equippedDeath, setEquippedDeath] = useState("death_default");
  const [equippedFrame, setEquippedFrame] = useState("frame_none");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [tab, setTab] = useState<"skins" | "trails" | "deaths" | "frames">("skins");
  const router = useRouter();
  const supabase = createClient();

  const loadInventory = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }

    const res = await fetch("/api/shop/inventory");
    if (res.ok) {
      const data = await res.json();
      setCoins(data.creator_coins);
      setUnlocked(data.unlocked_cosmetics || []);
      setEquippedSkin(data.equipped_skin || "default");
      setEquippedTrail(data.equipped_trail || "trail_none");
      setEquippedDeath(data.equipped_death_effect || "death_default");
      setEquippedFrame(data.equipped_frame || "frame_none");
      syncToLocalStorage(data);
    }
    setLoading(false);
  }, [router, supabase.auth]);

  useEffect(() => {
    loadInventory();
  }, [loadInventory]);

  async function purchaseItem(itemId: string) {
    setMessage(null);
    const res = await fetch("/api/shop/purchase", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ item_id: itemId }),
    });
    const data = await res.json();
    if (res.ok) {
      setCoins(data.remaining_coins);
      setUnlocked((prev) => {
        const updated = [...prev, itemId];
        localStorage.setItem(LS_UNLOCKED, JSON.stringify(updated));
        return updated;
      });
      setMessage("Item comprado!");
    } else {
      setMessage(data.error || "Erro ao comprar");
    }
  }

  async function equipItem(field: string, value: string) {
    if (field === "equipped_skin") { setEquippedSkin(value); localStorage.setItem(LS_EQUIPPED_SKIN, value); }
    if (field === "equipped_trail") { setEquippedTrail(value); localStorage.setItem(LS_EQUIPPED_TRAIL, value); }
    if (field === "equipped_death_effect") { setEquippedDeath(value); localStorage.setItem(LS_EQUIPPED_DEATH, value); }
    if (field === "equipped_frame") { setEquippedFrame(value); localStorage.setItem(LS_EQUIPPED_FRAME, value); }
    await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value }),
    });
    setMessage("Equipado!");
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground text-[9px] uppercase tracking-wider">Carregando...</p>
      </div>
    );
  }

  const tabs: { id: typeof tab; label: string; icon: PixelIconName }[] = [
    { id: "skins", label: "Skins", icon: "paint" },
    { id: "trails", label: "Trilhas", icon: "sparkle" },
    { id: "deaths", label: "Efeitos", icon: "skull" },
    { id: "frames", label: "Molduras", icon: "crown" },
  ];

  function renderCosmeticCard(
    id: string,
    name: string,
    cost: number,
    owned: boolean,
    equipped: boolean,
    onEquip: () => void,
    preview: React.ReactNode,
  ) {
    return (
      <HudPanel
        key={id}
        variant={equipped ? "highlight" : "default"}
        className="text-center"
      >
        <div className="mb-3">{preview}</div>
        <h3 className="text-[9px] font-bold mb-2 uppercase">{name}</h3>
        {equipped ? (
          <span className="text-[8px] text-primary font-medium uppercase tracking-wider">Equipado</span>
        ) : owned ? (
          <HudButton onClick={onEquip} variant="secondary" size="small">Equipar</HudButton>
        ) : (
          <HudButton onClick={() => purchaseItem(id)} disabled={coins < cost} variant="gold" size="small">
            <PixelIcon name="coin" size={10} color="#FFD700" /> {cost}
          </HudButton>
        )}
      </HudPanel>
    );
  }

  return (
    <main className="flex-1 max-w-5xl mx-auto px-4 py-6 w-full overflow-y-auto">
        <HudPanel variant="gold" className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-2">
                <PixelIcon name="shop" size={16} color="#FFD700" /> Loja
              </h1>
              <p className="text-[8px] text-muted-foreground mt-1">
                Ganhe moedas quando outros jogam seus niveis.
              </p>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-bold text-yellow-400">
              <PixelIcon name="coin" size={14} color="#FFD700" /> {coins}
            </div>
          </div>
        </HudPanel>

        {message && (
          <HudPanel variant="highlight" className="mb-4">
            <p className="text-[9px]">{message}</p>
          </HudPanel>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b-2 border-border">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-3 py-2 text-[8px] font-bold uppercase tracking-wider transition-colors border-b-2 -mb-[2px] flex items-center gap-1 ${
                tab === t.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <PixelIcon name={t.icon} size={10} /> {t.label}
            </button>
          ))}
        </div>

        {tab === "skins" && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {SKINS.map((skin) => {
              const owned = skin.id === "default" || unlocked.includes(skin.id);
              const equipped = equippedSkin === skin.id;
              return renderCosmeticCard(
                skin.id, skin.name, skin.cost, owned, equipped,
                () => equipItem("equipped_skin", skin.id),
                <div className="w-14 h-14 mx-auto border-2 border-border" style={{ backgroundColor: skin.color }} />,
              );
            })}
          </div>
        )}

        {tab === "trails" && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {TRAILS.map((trail) => {
              const owned = trail.id === "trail_none" || unlocked.includes(trail.id);
              const equipped = equippedTrail === trail.id;
              return renderCosmeticCard(
                trail.id, trail.name, trail.cost, owned, equipped,
                () => equipItem("equipped_trail", trail.id),
                <div
                  className="w-14 h-14 mx-auto border-2 border-border flex items-center justify-center"
                  style={{ background: trail.colors.length >= 2 ? `linear-gradient(135deg, ${trail.colors.join(", ")})` : "#333" }}
                >
                  {trail.colors.length === 0 && <PixelIcon name="close" size={16} color="#555" />}
                </div>,
              );
            })}
          </div>
        )}

        {tab === "deaths" && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {DEATH_EFFECTS.map((effect) => {
              const owned = effect.id === "death_default" || unlocked.includes(effect.id);
              const equipped = equippedDeath === effect.id;
              const icons: Record<string, PixelIconName> = {
                death_default: "fire",
                death_pixelate: "diff-hard",
                death_ghost: "ghost",
                death_confetti: "confetti",
                death_shatter: "sparkle",
              };
              return renderCosmeticCard(
                effect.id, effect.name, effect.cost, owned, equipped,
                () => equipItem("equipped_death_effect", effect.id),
                <div className="w-14 h-14 mx-auto border-2 border-border bg-card flex items-center justify-center">
                  <PixelIcon name={icons[effect.id] || "skull"} size={24} />
                </div>,
              );
            })}
          </div>
        )}

        {tab === "frames" && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {FRAMES.map((frame) => {
              const owned = frame.id === "frame_none" || unlocked.includes(frame.id);
              const equipped = equippedFrame === frame.id;
              const frameColors: Record<string, string> = {
                frame_none: "#333",
                frame_gold: "#EAB308",
                frame_diamond: "#06B6D4",
                frame_troll: "#A855F7",
                frame_fire: "#F97316",
              };
              return renderCosmeticCard(
                frame.id, frame.name, frame.cost, owned, equipped,
                () => equipItem("equipped_frame", frame.id),
                <div
                  className="w-14 h-14 mx-auto border-4 bg-card flex items-center justify-center"
                  style={{ borderColor: frameColors[frame.id] || "#333" }}
                >
                  <PixelIcon name="cat" size={20} />
                </div>,
              );
            })}
          </div>
        )}
      </main>
  );
}
