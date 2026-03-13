"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { SKINS, TRAILS, DEATH_EFFECTS, FRAMES } from "@/game/constants";

// localStorage keys
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
      setMessage("Item comprado com sucesso!");
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
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  const tabs = [
    { id: "skins" as const, label: "🎨 Skins" },
    { id: "trails" as const, label: "✨ Trilhas" },
    { id: "deaths" as const, label: "💀 Efeitos" },
    { id: "frames" as const, label: "🖼 Molduras" },
  ];

  return (
    <div className="min-h-screen">
      <header className="border-b border-border px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-primary">
            🐱 Trap Architect
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm font-bold text-yellow-400">🪙 {coins} moedas</span>
            <Link href="/profile" className="text-sm text-muted-foreground hover:text-foreground">Perfil</Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <h1 className="text-3xl font-bold mb-2">Loja de Cosméticos</h1>
        <p className="text-muted-foreground mb-6">Ganhe moedas de criador quando outros jogam seus níveis.</p>

        {message && (
          <div className="bg-primary/10 border border-primary/30 rounded-lg px-4 py-3 mb-6 text-sm">{message}</div>
        )}

        <div className="flex gap-2 mb-6 border-b border-border">
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${tab === t.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
              {t.label}
            </button>
          ))}
        </div>

        {tab === "skins" && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {SKINS.map((skin) => {
              const owned = skin.id === "default" || unlocked.includes(skin.id);
              const equipped = equippedSkin === skin.id;
              return (
                <div key={skin.id} className={`bg-card border rounded-lg p-4 text-center transition-colors ${equipped ? "border-primary" : "border-border"}`}>
                  <div className="w-16 h-16 rounded-full mx-auto mb-3 border-2 border-white/10" style={{ backgroundColor: skin.color }} />
                  <h3 className="font-bold text-sm mb-1">{skin.name}</h3>
                  {equipped ? (
                    <span className="text-xs text-primary font-medium">✓ Equipada</span>
                  ) : owned ? (
                    <button onClick={() => equipItem("equipped_skin", skin.id)} className="text-xs bg-primary/20 text-primary px-3 py-1 rounded font-medium hover:bg-primary/30 transition-colors">Equipar</button>
                  ) : (
                    <button onClick={() => purchaseItem(skin.id)} disabled={coins < skin.cost} className="text-xs bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded font-medium hover:bg-yellow-500/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">🪙 {skin.cost}</button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {tab === "trails" && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {TRAILS.map((trail) => {
              const owned = trail.id === "trail_none" || unlocked.includes(trail.id);
              const equipped = equippedTrail === trail.id;
              return (
                <div key={trail.id} className={`bg-card border rounded-lg p-4 text-center transition-colors ${equipped ? "border-primary" : "border-border"}`}>
                  <div className="w-16 h-16 rounded-full mx-auto mb-3 border-2 border-white/10 flex items-center justify-center"
                    style={{ background: trail.colors.length >= 2 ? `linear-gradient(135deg, ${trail.colors.join(", ")})` : "#333" }}>
                    {trail.colors.length === 0 && <span className="text-2xl opacity-40">✕</span>}
                  </div>
                  <h3 className="font-bold text-sm mb-1">{trail.name}</h3>
                  {equipped ? (
                    <span className="text-xs text-primary font-medium">✓ Equipada</span>
                  ) : owned ? (
                    <button onClick={() => equipItem("equipped_trail", trail.id)} className="text-xs bg-primary/20 text-primary px-3 py-1 rounded font-medium hover:bg-primary/30 transition-colors">Equipar</button>
                  ) : (
                    <button onClick={() => purchaseItem(trail.id)} disabled={coins < trail.cost} className="text-xs bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded font-medium hover:bg-yellow-500/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">🪙 {trail.cost}</button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {tab === "deaths" && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {DEATH_EFFECTS.map((effect) => {
              const owned = effect.id === "death_default" || unlocked.includes(effect.id);
              const equipped = equippedDeath === effect.id;
              const icons: Record<string, string> = { death_default: "💥", death_pixelate: "🟥", death_ghost: "👻", death_confetti: "🎊", death_shatter: "💎" };
              return (
                <div key={effect.id} className={`bg-card border rounded-lg p-4 text-center transition-colors ${equipped ? "border-primary" : "border-border"}`}>
                  <div className="w-16 h-16 rounded-full mx-auto mb-3 border-2 border-white/10 bg-card flex items-center justify-center text-2xl">{icons[effect.id] || "💀"}</div>
                  <h3 className="font-bold text-sm mb-1">{effect.name}</h3>
                  {equipped ? (
                    <span className="text-xs text-primary font-medium">✓ Equipado</span>
                  ) : owned ? (
                    <button onClick={() => equipItem("equipped_death_effect", effect.id)} className="text-xs bg-primary/20 text-primary px-3 py-1 rounded font-medium hover:bg-primary/30 transition-colors">Equipar</button>
                  ) : (
                    <button onClick={() => purchaseItem(effect.id)} disabled={coins < effect.cost} className="text-xs bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded font-medium hover:bg-yellow-500/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">🪙 {effect.cost}</button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {tab === "frames" && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {FRAMES.map((frame) => {
              const owned = frame.id === "frame_none" || unlocked.includes(frame.id);
              const equipped = equippedFrame === frame.id;
              const frameStyles: Record<string, string> = {
                frame_none: "border-border",
                frame_gold: "border-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.3)]",
                frame_diamond: "border-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.4)]",
                frame_troll: "border-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.3)]",
                frame_fire: "border-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.4)]",
              };
              return (
                <div key={frame.id} className={`bg-card border rounded-lg p-4 text-center transition-colors ${equipped ? "border-primary" : "border-border"}`}>
                  <div className={`w-16 h-16 rounded-full mx-auto mb-3 border-4 bg-card flex items-center justify-center text-lg ${frameStyles[frame.id] || "border-border"}`}>🐱</div>
                  <h3 className="font-bold text-sm mb-1">{frame.name}</h3>
                  {equipped ? (
                    <span className="text-xs text-primary font-medium">✓ Equipada</span>
                  ) : owned ? (
                    <button onClick={() => equipItem("equipped_frame", frame.id)} className="text-xs bg-primary/20 text-primary px-3 py-1 rounded font-medium hover:bg-primary/30 transition-colors">Equipar</button>
                  ) : (
                    <button onClick={() => purchaseItem(frame.id)} disabled={coins < frame.cost} className="text-xs bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded font-medium hover:bg-yellow-500/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">🪙 {frame.cost}</button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
