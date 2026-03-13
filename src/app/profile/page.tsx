"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import RankBadge from "@/components/RankBadge";
import { RankUpToast, useRankUpToast } from "@/components/RankUpToast";
import type { User } from "@supabase/supabase-js";

interface Profile {
  id: string;
  nickname: string;
  photo_url: string | null;
  creator_rank: number;
  levels_created: number;
  total_plays_received: number;
  total_likes_received: number;
  created_at: string;
}

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [nickname, setNickname] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
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
        const { profile, rankUp: ru } = await res.json();
        setProfile(profile);
        setNickname(profile.nickname || "");
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
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-border px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-primary">
            🐱 Trap Architect
          </Link>
          <button
            onClick={handleLogout}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Sair
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-8">Meu Perfil</h1>

        {profile && (
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-card border border-border rounded-lg p-4 text-center">
              <p className="text-2xl font-bold">{profile.levels_created}</p>
              <p className="text-sm text-muted-foreground">Níveis Criados</p>
            </div>
            <div className="bg-card border border-border rounded-lg p-4 text-center">
              <p className="text-2xl font-bold">{profile.total_plays_received}</p>
              <p className="text-sm text-muted-foreground">Plays Totais</p>
            </div>
            <div className="bg-card border border-border rounded-lg p-4 text-center">
              <p className="text-2xl font-bold">{profile.total_likes_received}</p>
              <p className="text-sm text-muted-foreground">Likes Totais</p>
            </div>
          </div>
        )}

        <div className="bg-card border border-border rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">Informações</h2>

          {message && (
            <div className="bg-primary/10 border border-primary/30 rounded-lg px-4 py-3 mb-4 text-sm">
              {message}
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label htmlFor="email-display" className="block text-sm font-medium mb-1">E-mail</label>
              <input
                id="email-display"
                type="email"
                value={user.email || ""}
                disabled
                className="w-full rounded-md border border-border bg-muted px-3 py-2 text-sm opacity-60"
              />
            </div>
            <div>
              <label htmlFor="nickname-input" className="block text-sm font-medium mb-1">Nickname</label>
              <input
                id="nickname-input"
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                minLength={2}
                maxLength={30}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            {profile && (
              <div>
                <label className="block text-sm font-medium mb-1">Rank</label>
                <RankBadge rankLevel={profile.creator_rank} />
              </div>
            )}
            <button
              type="submit"
              disabled={saving}
              className="bg-primary text-primary-foreground px-6 py-2 rounded-md font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {saving ? "Salvando..." : "Salvar"}
            </button>
          </form>
        </div>

        <div className="flex gap-4">
          <Link
            href="/editor"
            className="bg-primary text-primary-foreground px-6 py-2 rounded-md font-medium hover:opacity-90 transition-opacity"
          >
            Criar Novo Nível
          </Link>
          <Link
            href="/play"
            className="border border-border px-6 py-2 rounded-md font-medium hover:bg-muted transition-colors"
          >
            Jogar Campanha
          </Link>
          <Link
            href="/shop"
            className="border border-border px-6 py-2 rounded-md font-medium hover:bg-muted transition-colors"
          >
            🛒 Loja
          </Link>
          <Link
            href="/settings"
            className="border border-border px-6 py-2 rounded-md font-medium hover:bg-muted transition-colors"
          >
            ⚙ Configurações
          </Link>
        </div>
      </main>

      {rankUp && <RankUpToast rankUp={rankUp} onDismiss={dismiss} />}
    </div>
  );
}
