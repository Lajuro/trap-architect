"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import HudBar from "@/components/ui/HudBar";
import HudPanel from "@/components/ui/HudPanel";
import HudButton from "@/components/ui/HudButton";
import LevelCard from "@/components/LevelCard";

interface CollectionLevel {
  id: string;
  title: string;
  creator_id: string;
  difficulty: number;
  likes: number;
  plays: number;
  avg_rating: number;
  rating_count: number;
  created_at: string;
  profiles: { nickname: string };
}

interface CollectionDetail {
  id: string;
  name: string;
  description: string | null;
  user_id: string;
  created_at: string;
  profiles: { nickname: string };
  levels: CollectionLevel[];
}

export default function CollectionDetailPage() {
  const params = useParams();
  const collectionId = params.id as string;
  const [collection, setCollection] = useState<CollectionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCollection = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/collections/${collectionId}`);
      if (!res.ok) {
        setError("Coleção não encontrada");
        setLoading(false);
        return;
      }
      const data = await res.json();
      setCollection(data.collection);
    } catch {
      setError("Erro ao carregar coleção");
    }
    setLoading(false);
  }, [collectionId]);

  useEffect(() => {
    fetchCollection();
  }, [fetchCollection]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <HudBar />
        <div className="flex-1 flex items-center justify-center text-muted-foreground text-[9px] uppercase">
          Carregando...
        </div>
      </div>
    );
  }

  if (error || !collection) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <HudBar />
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <p className="text-[10px] text-muted-foreground">{error || "Não encontrada"}</p>
          <Link href="/collections">
            <HudButton variant="ghost" size="small">Voltar</HudButton>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <HudBar />

      <main className="flex-1 max-w-7xl mx-auto px-4 py-6 w-full">
        <Link href="/collections" className="text-[8px] text-muted-foreground hover:text-foreground mb-4 inline-block">
          ← Voltar para Coleções
        </Link>

        <HudPanel className="mb-6">
          <h1 className="text-[12px] font-bold uppercase tracking-wider">{collection.name}</h1>
          {collection.description && (
            <p className="text-[9px] text-muted-foreground mt-2">{collection.description}</p>
          )}
          <div className="flex items-center gap-3 mt-3 text-[8px] text-muted-foreground">
            <span>por {collection.profiles?.nickname || "Anônimo"}</span>
            <span>{collection.levels?.length || 0} níveis</span>
            <span>{new Date(collection.created_at).toLocaleDateString("pt-BR")}</span>
          </div>
        </HudPanel>

        {!collection.levels || collection.levels.length === 0 ? (
          <HudPanel className="text-center py-16">
            <p className="text-[10px]">Nenhum nível nesta coleção ainda</p>
            <p className="text-[8px] text-muted-foreground mt-2">
              Adicione níveis pelo botão nas páginas de nível
            </p>
          </HudPanel>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {collection.levels.map((level) => (
              <LevelCard
                key={level.id}
                id={level.id}
                name={level.title}
                authorName={level.profiles?.nickname || "Anônimo"}
                difficulty={level.difficulty}
                likes={level.likes}
                plays={level.plays}
                avgRating={level.avg_rating}
                ratingCount={level.rating_count}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
