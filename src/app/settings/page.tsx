"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const SKINS = [
  { id: "default", name: "Clássico", color: "#22c55e" },
  { id: "fire", name: "Fogo", color: "#ef4444" },
  { id: "ice", name: "Gelo", color: "#38bdf8" },
  { id: "gold", name: "Dourado", color: "#fbbf24" },
  { id: "shadow", name: "Sombra", color: "#6366f1" },
  { id: "neon", name: "Neon", color: "#a3e635" },
  { id: "royal", name: "Real", color: "#c084fc" },
  { id: "inferno", name: "Inferno", color: "#f97316" },
] as const;

function getOwnedSkins(): string[] {
  if (typeof window === "undefined") return ["default"];
  try {
    const stored = localStorage.getItem("trap_owned_skins");
    return stored ? (JSON.parse(stored) as string[]) : ["default"];
  } catch {
    return ["default"];
  }
}

export default function SettingsPage() {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [equippedSkin, setEquippedSkin] = useState("default");
  const [ownedSkins, setOwnedSkins] = useState<string[]>(["default"]);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setSoundEnabled(localStorage.getItem("trap_sound_enabled") !== "false");
    setEquippedSkin(localStorage.getItem("trap_equipped_skin") || "default");
    setOwnedSkins(getOwnedSkins());
  }, []);

  function toggleSound() {
    const next = !soundEnabled;
    setSoundEnabled(next);
    localStorage.setItem("trap_sound_enabled", String(next));
  }

  function selectSkin(skinId: string) {
    setEquippedSkin(skinId);
    localStorage.setItem("trap_equipped_skin", skinId);
  }

  function resetProgress() {
    localStorage.removeItem("trap_campaign_progress");
    localStorage.removeItem("trap_campaign_unlocked");
    setMessage("Progresso da campanha resetado!");
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-border px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-primary">
            🐱 Trap Architect
          </Link>
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Voltar
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        <h1 className="text-3xl font-bold mb-8">Configurações</h1>

        {message && (
          <div className="bg-primary/10 border border-primary/30 rounded-lg px-4 py-3 mb-6 text-sm">
            {message}
          </div>
        )}

        {/* Sound */}
        <section className="bg-card border border-border rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">🔊 Áudio</h2>
          <div className="flex items-center justify-between">
            <span className="text-sm">Efeitos Sonoros</span>
            <button
              onClick={toggleSound}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                soundEnabled ? "bg-primary" : "bg-muted"
              }`}
            >
              <span
                className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                  soundEnabled ? "left-6.5" : "left-0.5"
                }`}
              />
            </button>
          </div>
        </section>

        {/* Skin selector */}
        <section className="bg-card border border-border rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">🎨 Skin Ativa</h2>
          <div className="grid grid-cols-4 gap-3">
            {SKINS.filter((s) => ownedSkins.includes(s.id)).map((skin) => (
              <button
                key={skin.id}
                onClick={() => selectSkin(skin.id)}
                className={`flex flex-col items-center gap-2 p-3 rounded-lg border transition-colors ${
                  equippedSkin === skin.id
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-border/80"
                }`}
              >
                <div
                  className="w-10 h-10 rounded-full border border-white/10"
                  style={{ backgroundColor: skin.color }}
                />
                <span className="text-xs">{skin.name}</span>
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Compre mais skins na{" "}
            <Link href="/shop" className="text-primary hover:underline">
              Loja
            </Link>
            .
          </p>
        </section>

        {/* Reset progress */}
        <section className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">🗑️ Dados</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Resetar o progresso da campanha irá apagar as fases desbloqueadas e
            seus tempos salvos localmente.
          </p>
          <button
            onClick={resetProgress}
            className="text-sm bg-red-500/20 text-red-400 px-4 py-2 rounded font-medium hover:bg-red-500/30 transition-colors"
          >
            Resetar Progresso da Campanha
          </button>
        </section>
      </main>
    </div>
  );
}
