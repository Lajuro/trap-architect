"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import RankBadge from "@/components/RankBadge";
import { RankUpToast, useRankUpToast } from "@/components/RankUpToast";
import { ACHIEVEMENTS } from "@/game/constants";
import type { User } from "@supabase/supabase-js";
import HudPanel from "@/components/ui/HudPanel";
import HudButton from "@/components/ui/HudButton";
import { PixelIcon } from "@/components/ui/PixelIcon";

interface Profile {
  id: string;
  nickname: string;
  photo_url: string | null;
  creator_rank: number;
  levels_created: number;
  total_plays_received: number;
  total_likes_received: number;
  equipped_title: string | null;
  created_at: string;
}

interface UserAchievement {
  achievement_id: string;
  unlocked_at: string;
}

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [nickname, setNickname] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [achievements, setAchievements] = useState<UserAchievement[]>([]);
  const [newAchievements, setNewAchievements] = useState<string[]>([]);
  const { rankUp, checkRankUp, dismiss } = useRankUpToast();
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      setUser(user);

      const res = await fetch("/api/profile");
      if (res.ok) {
        const { profile, rankUp: ru, achievements: ach, newAchievements: newAch } = await res.json();
        setProfile(profile);
        setNickname(profile.nickname || "");
        setAchievements(ach ?? []);
        setNewAchievements(newAch ?? []);
        if (ru) checkRankUp(ru.oldRank, ru.newRank);
      }
    }
    load();
  }, [router, supabase.auth, checkRankUp]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nickname: nickname.trim() }),
    });

    if (res.ok) {
      const { profile: updated } = await res.json();
      setProfile(updated);
      setMessage("Perfil atualizado!");
    } else {
      const { error } = await res.json();
      setMessage(error || "Erro ao salvar");
    }
    setSaving(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground text-[9px] uppercase tracking-wider">Carregando...</p>
      </div>
    );
  }

  return (
    <>
      <main className="flex-1 max-w-3xl mx-auto px-4 py-6 w-full overflow-y-auto">
        <HudPanel className="mb-6">
          <h1 className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-2 mb-1">
            <PixelIcon name="profile" size={16} /> Meu Perfil
          </h1>
        </HudPanel>

        {profile && (
          <div className="grid grid-cols-3 gap-3 mb-6">
            <HudPanel className="text-center">
              <p className="text-sm font-bold text-primary">{profile.levels_created}</p>
              <p className="text-[8px] text-muted-foreground uppercase tracking-wider">Niveis</p>
            </HudPanel>
            <HudPanel className="text-center">
              <p className="text-sm font-bold text-primary">{profile.total_plays_received}</p>
              <p className="text-[8px] text-muted-foreground uppercase tracking-wider">Plays</p>
            </HudPanel>
            <HudPanel className="text-center">
              <p className="text-sm font-bold text-primary">{profile.total_likes_received}</p>
              <p className="text-[8px] text-muted-foreground uppercase tracking-wider">Likes</p>
            </HudPanel>
          </div>
        )}

        <HudPanel className="mb-6">
          <h2 className="text-[10px] font-bold mb-4 uppercase tracking-wider">Informacoes</h2>

          {message && (
            <HudPanel variant="highlight" className="mb-4">
              <p className="text-[9px]">{message}</p>
            </HudPanel>
          )}

          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label htmlFor="email-display" className="block text-[8px] font-bold mb-1 uppercase tracking-wider">E-mail</label>
              <input
                id="email-display"
                type="email"
                value={user.email || ""}
                disabled
                className="w-full border-2 border-border bg-muted px-3 py-2 text-[9px] opacity-60"
              />
            </div>
            <div>
              <label htmlFor="nickname-input" className="block text-[8px] font-bold mb-1 uppercase tracking-wider">Nickname</label>
              <input
                id="nickname-input"
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                minLength={2}
                maxLength={30}
                className="w-full border-2 border-border bg-background px-3 py-2 text-[9px] focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            {profile && (
              <div>
                <label className="block text-[8px] font-bold mb-1 uppercase tracking-wider">Rank</label>
                <RankBadge rankLevel={profile.creator_rank} />
              </div>
            )}
            <HudButton type="submit" disabled={saving} variant="primary">
              {saving ? "Salvando..." : "Salvar"}
            </HudButton>
          </form>
        </HudPanel>

        <div className="flex flex-wrap gap-3">
          <HudButton href="/editor" variant="primary">
            <PixelIcon name="create" size={12} /> Criar Nivel
          </HudButton>
          <HudButton href="/play" variant="secondary">
            <PixelIcon name="play" size={12} /> Campanha
          </HudButton>
          <HudButton href="/shop" variant="gold">
            <PixelIcon name="shop" size={12} /> Loja
          </HudButton>
          <HudButton href="/settings" variant="ghost">
            <PixelIcon name="settings" size={12} /> Config
          </HudButton>
          <HudButton onClick={handleLogout} variant="ghost">
            <PixelIcon name="logout" size={12} /> Sair
          </HudButton>
        </div>

        {/* Achievements Section */}
        <HudPanel className="mt-6">
          <h2 className="text-[10px] font-bold mb-4 uppercase tracking-wider flex items-center gap-2">
            <PixelIcon name="trophy" size={14} color="#FFD700" /> Conquistas ({achievements.length}/{ACHIEVEMENTS.length})
          </h2>
          {newAchievements.length > 0 && (
            <HudPanel variant="highlight" className="mb-4">
              <p className="text-[9px] font-bold text-yellow-400 mb-1">Novas conquistas desbloqueadas!</p>
              {newAchievements.map((id) => {
                const def = ACHIEVEMENTS.find((a) => a.id === id);
                return def ? (
                  <p key={id} className="text-[8px]">
                    {def.icon} {def.name} — {def.description}
                  </p>
                ) : null;
              })}
            </HudPanel>
          )}
          <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
            {ACHIEVEMENTS.map((ach) => {
              const unlocked = achievements.some((a) => a.achievement_id === ach.id);
              return (
                <div
                  key={ach.id}
                  className={`text-center p-2 border-2 transition-colors ${
                    unlocked
                      ? "border-primary/50 bg-primary/10"
                      : "border-border/30 opacity-40 grayscale"
                  }`}
                  title={unlocked ? `${ach.name}: ${ach.description}` : `??? ${ach.description}`}
                >
                  <span className="text-lg block mb-1">{ach.icon}</span>
                  <span className="text-[7px] uppercase tracking-wider block truncate">
                    {unlocked ? ach.name : "???"}
                  </span>
                </div>
              );
            })}
          </div>
        </HudPanel>
      </main>

      {rankUp && <RankUpToast rankUp={rankUp} onDismiss={dismiss} />}
    </>
  );
}
