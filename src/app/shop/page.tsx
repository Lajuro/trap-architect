"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

const SKINS = [
  { id: "default", name: "Clássico", color: "#22c55e", cost: 0 },
  { id: "fire", name: "Fogo", color: "#ef4444", cost: 10 },
  { id: "ice", name: "Gelo", color: "#38bdf8", cost: 10 },
  { id: "gold", name: "Dourado", color: "#fbbf24", cost: 25 },
  { id: "shadow", name: "Sombra", color: "#6366f1", cost: 25 },
  { id: "neon", name: "Neon", color: "#a3e635", cost: 50 },
  { id: "royal", name: "Real", color: "#c084fc", cost: 50 },
  { id: "inferno", name: "Inferno", color: "#f97316", cost: 100 },
] as const;

function getOwnedSkins(): string[] {
  if (typeof window === "undefined") return ["default"];
  const stored = localStorage.getItem("trap_owned_skins");
  if (stored) {
    try {
      return JSON.parse(stored) as string[];
    } catch {
      return ["default"];
    }
  }
  return ["default"];
}

function getEquippedSkin(): string {
  if (typeof window === "undefined") return "default";
  return localStorage.getItem("trap_equipped_skin") || "default";
}

export default function ShopPage() {
  const [coins, setCoins] = useState(0);
  const [ownedSkins, setOwnedSkins] = useState<string[]>(["default"]);
  const [equippedSkin, setEquippedSkin] = useState("default");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      // Creator coins = total_plays from profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("total_plays")
        .eq("id", user.id)
        .single();

      setCoins(profile?.total_plays ?? 0);
      setOwnedSkins(getOwnedSkins());
      setEquippedSkin(getEquippedSkin());
      setLoading(false);
    }
    load();
  }, [router, supabase]);

  function buySkin(skinId: string, cost: number) {
    if (coins < cost) {
      setMessage("Moedas insuficientes!");
      return;
    }

    const updated = [...ownedSkins, skinId];
    setOwnedSkins(updated);
    localStorage.setItem("trap_owned_skins", JSON.stringify(updated));
    setCoins((c) => c - cost);
    setMessage(`Skin "${SKINS.find((s) => s.id === skinId)?.name}" comprada!`);
  }

  function equipSkin(skinId: string) {
    setEquippedSkin(skinId);
    localStorage.setItem("trap_equipped_skin", skinId);
    setMessage(`Skin equipada!`);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-border px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-primary">
            🐱 Trap Architect
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm font-bold text-yellow-400">
              🪙 {coins} moedas
            </span>
            <Link
              href="/profile"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Perfil
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <h1 className="text-3xl font-bold mb-2">Loja de Cosméticos</h1>
        <p className="text-muted-foreground mb-8">
          Ganhe moedas quando outros jogadores jogam seus níveis (1 play = 1
          moeda).
        </p>

        {message && (
          <div className="bg-primary/10 border border-primary/30 rounded-lg px-4 py-3 mb-6 text-sm">
            {message}
          </div>
        )}

        <h2 className="text-xl font-bold mb-4">🎨 Skins do Gato</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {SKINS.map((skin) => {
            const owned = ownedSkins.includes(skin.id);
            const equipped = equippedSkin === skin.id;

            return (
              <div
                key={skin.id}
                className={`bg-card border rounded-lg p-4 text-center transition-colors ${
                  equipped
                    ? "border-primary"
                    : "border-border hover:border-border/80"
                }`}
              >
                {/* Skin preview - colored circle */}
                <div
                  className="w-16 h-16 rounded-full mx-auto mb-3 border-2 border-white/10"
                  style={{ backgroundColor: skin.color }}
                />
                <h3 className="font-bold text-sm mb-1">{skin.name}</h3>

                {equipped ? (
                  <span className="text-xs text-primary font-medium">
                    ✓ Equipada
                  </span>
                ) : owned ? (
                  <button
                    onClick={() => equipSkin(skin.id)}
                    className="text-xs bg-primary/20 text-primary px-3 py-1 rounded font-medium hover:bg-primary/30 transition-colors"
                  >
                    Equipar
                  </button>
                ) : (
                  <button
                    onClick={() => buySkin(skin.id, skin.cost)}
                    disabled={coins < skin.cost}
                    className="text-xs bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded font-medium hover:bg-yellow-500/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    🪙 {skin.cost}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
