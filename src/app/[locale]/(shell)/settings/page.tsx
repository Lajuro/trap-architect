"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import HudPanel from "@/components/ui/HudPanel";
import HudButton from "@/components/ui/HudButton";
import { PixelIcon } from "@/components/ui/PixelIcon";
import { TITLES } from "@/game/constants";

const SKINS = [
  { id: "default", nameKey: "default" as const, color: "#22c55e" },
  { id: "fire", nameKey: "fire" as const, color: "#ef4444" },
  { id: "ice", nameKey: "ice" as const, color: "#38bdf8" },
  { id: "gold", nameKey: "gold" as const, color: "#fbbf24" },
  { id: "shadow", nameKey: "shadow" as const, color: "#6366f1" },
  { id: "neon", nameKey: "neon" as const, color: "#a3e635" },
  { id: "royal", nameKey: "royal" as const, color: "#c084fc" },
  { id: "inferno", nameKey: "inferno" as const, color: "#f97316" },
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
  const [equippedTitle, setEquippedTitle] = useState("novato");
  const [ownedSkins, setOwnedSkins] = useState<string[]>(["default"]);
  const [message, setMessage] = useState<string | null>(null);
  const t = useTranslations("settings");
  const tsk = useTranslations("cosmetics.skins");
  const tTitles = useTranslations("titles");

  useEffect(() => {
    setSoundEnabled(localStorage.getItem("trap_sound_enabled") !== "false");
    setEquippedSkin(localStorage.getItem("trap_equipped_skin") || "default");
    setEquippedTitle(localStorage.getItem("trap_equipped_title") || "novato");
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

  function selectTitle(titleId: string) {
    setEquippedTitle(titleId);
    localStorage.setItem("trap_equipped_title", titleId);
    fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ equipped_title: titleId }),
    });
  }

  function resetProgress() {
    if (!window.confirm(t("resetConfirm"))) return;
    localStorage.removeItem("trap_campaign_progress");
    localStorage.removeItem("trap_campaign_unlocked");
    setMessage(t("resetDone"));
  }

  return (
    <main className="flex-1 max-w-3xl mx-auto px-4 py-6 w-full overflow-y-auto">
        <HudPanel className="mb-6">
          <h1 className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-2">
            <PixelIcon name="settings" size={16} /> {t("title")}
          </h1>
        </HudPanel>

        {message && (
          <HudPanel variant="highlight" className="mb-4">
            <p className="text-[9px]">{message}</p>
          </HudPanel>
        )}

        {/* Sound */}
        <HudPanel className="mb-4">
          <h2 className="text-[10px] font-bold mb-3 uppercase tracking-wider flex items-center gap-2">
            <PixelIcon name={soundEnabled ? "sound-on" : "sound-off"} size={14} /> {t("audio")}
          </h2>
          <div className="flex items-center justify-between">
            <span className="text-[9px]">{t("soundEffects")}</span>
            <button
              onClick={toggleSound}
              role="switch"
              aria-checked={soundEnabled}
              className={`relative w-10 h-5 transition-colors border-2 ${
                soundEnabled ? "bg-primary/30 border-primary" : "bg-muted border-border"
              }`}
            >
              <span
                className={`absolute top-0.5 w-3.5 h-3.5 bg-foreground transition-transform ${
                  soundEnabled ? "left-[18px]" : "left-0.5"
                }`}
              />
            </button>
          </div>
        </HudPanel>

        {/* Skin selector */}
        <HudPanel className="mb-4">
          <h2 className="text-[10px] font-bold mb-3 uppercase tracking-wider flex items-center gap-2">
            <PixelIcon name="paint" size={14} /> {t("activeSkin")}
          </h2>
          <div className="grid grid-cols-4 gap-2">
            {SKINS.filter((s) => ownedSkins.includes(s.id)).map((skin) => (
              <button
                key={skin.id}
                onClick={() => selectSkin(skin.id)}
                className={`flex flex-col items-center gap-2 p-2 border-2 transition-colors ${
                  equippedSkin === skin.id
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-border/80"
                }`}
              >
                <div
                  className="w-8 h-8 border-2 border-white/10"
                  style={{ backgroundColor: skin.color }}
                />
                <span className="text-[7px] uppercase">{tsk(skin.nameKey)}</span>
              </button>
            ))}
          </div>
          <p className="text-[8px] text-muted-foreground mt-3">
            {t("buySkins")}{" "}
            <Link href="/shop" className="text-primary hover:underline">
              {t("shop")}
            </Link>
            .
          </p>
        </HudPanel>

        {/* Title selector */}
        <HudPanel className="mb-4">
          <h2 className="text-[10px] font-bold mb-3 uppercase tracking-wider flex items-center gap-2">
            <PixelIcon name="crown" size={14} /> {t("activeTitle")}
          </h2>
          <div className="grid grid-cols-2 gap-2">
            {TITLES.filter((t) => t.cost === 0).map((title) => (
              <button
                key={title.id}
                onClick={() => selectTitle(title.id)}
                className={`text-left px-3 py-2 border-2 text-[8px] transition-colors ${
                  equippedTitle === title.id
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border hover:border-border/80"
                }`}
              >
                <span className="font-bold block">{tTitles(`${title.id}.name`)}</span>
                <span className="text-muted-foreground text-[7px]">{tTitles(`${title.id}.unlock`)}</span>
              </button>
            ))}
          </div>
          <p className="text-[8px] text-muted-foreground mt-3">
            {t("unlockTitles")}{" "}
            <Link href="/shop" className="text-primary hover:underline">
              {t("shop")}
            </Link>
            .
          </p>
        </HudPanel>

        {/* Reset progress */}
        <HudPanel variant="danger">
          <h2 className="text-[10px] font-bold mb-3 uppercase tracking-wider flex items-center gap-2">
            <PixelIcon name="warning" size={14} color="#EF4444" /> {t("data")}
          </h2>
          <p className="text-[8px] text-muted-foreground mb-3">
            {t("resetDescription")}
          </p>
          <HudButton onClick={resetProgress} variant="danger" size="small">
            {t("resetProgress")}
          </HudButton>
        </HudPanel>
      </main>
  );
}
