"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import LevelCard from "@/components/LevelCard";

interface CreatorProfile {
  id: string;
  nickname: string;
  photo_url: string | null;
  creator_rank: number;
  levels_published: number;
  total_plays: number;
  total_likes: number;
  created_at: string;
}

interface CreatorLevel {
  id: string;
  name: string;
  subtitle: string | null;
  bg_color: string;
  plays: number;
  likes: number;
  difficulty: number;
  created_at: string;
}

const RANK_TITLES: Record<number, string> = {
  0: "Jogador",
  1: "Criador Novato",
  2: "Construtor",
  3: "Arquiteto",
  4: "Mestre Troll",
  5: "Lenda",
};

export default function CreatorPage() {
  const params = useParams<{ id: string }>();
  const creatorId = params.id;

  const [profile, setProfile] = useState<CreatorProfile | null>(null);
  const [levels, setLevels] = useState<CreatorLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchCreator() {
      try {
        const res = await fetch(`/api/creators/${creatorId}`);
        if (!res.ok) {
          setError("Criador não encontrado");
          return;
        }
        const data = await res.json();
        setProfile(data.profile);
        setLevels(data.levels || []);
      } catch {
        setError("Erro ao carregar perfil");
      } finally {
        setLoading(false);
      }
    }

    fetchCreator();
  }, [creatorId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Carregando perfil...</p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <p className="text-destructive text-lg">
          {error || "Criador não encontrado"}
        </p>
        <Link href="/browse" className="text-primary hover:underline">
          ← Voltar para Explorar
        </Link>
      </div>
    );
  }

  const joinDate = new Date(profile.created_at).toLocaleDateString("pt-BR", {
    year: "numeric",
    month: "long",
  });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-primary">
            🐱 Trap Architect
          </Link>
          <Link
            href="/browse"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Explorar
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-6 py-8 w-full">
        {/* Profile card */}
        <div className="bg-card border border-border rounded-lg p-8 mb-8">
          <div className="flex items-start gap-6">
            {/* Avatar placeholder */}
            <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center text-3xl shrink-0">
              🐱
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-1">{profile.nickname}</h1>
              <p className="text-primary font-medium mb-2">
                {RANK_TITLES[profile.creator_rank] || "Jogador"}
              </p>
              <p className="text-sm text-muted-foreground">
                Membro desde {joinDate}
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="bg-muted rounded-lg p-4 text-center">
              <p className="text-2xl font-bold">{profile.levels_published}</p>
              <p className="text-sm text-muted-foreground">Níveis Criados</p>
            </div>
            <div className="bg-muted rounded-lg p-4 text-center">
              <p className="text-2xl font-bold">{profile.total_plays}</p>
              <p className="text-sm text-muted-foreground">Plays Totais</p>
            </div>
            <div className="bg-muted rounded-lg p-4 text-center">
              <p className="text-2xl font-bold">{profile.total_likes}</p>
              <p className="text-sm text-muted-foreground">Likes Totais</p>
            </div>
          </div>
        </div>

        {/* Levels */}
        <h2 className="text-2xl font-bold mb-6">
          Níveis de {profile.nickname}
        </h2>
        {levels.length === 0 ? (
          <p className="text-muted-foreground">
            Este criador ainda não publicou nenhum nível.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {levels.map((level) => (
              <LevelCard
                key={level.id}
                id={level.id}
                name={level.name}
                subtitle={level.subtitle}
                plays={level.plays}
                likes={level.likes}
                difficulty={level.difficulty}
                bgColor={level.bg_color}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
