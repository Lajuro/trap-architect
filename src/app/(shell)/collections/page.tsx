"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import HudPanel from "@/components/ui/HudPanel";
import HudButton from "@/components/ui/HudButton";
import { PixelIcon } from "@/components/ui/PixelIcon";

interface Collection {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  profiles: { nickname: string };
}

export default function CollectionsPage() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const fetchCollections = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/collections?limit=50");
      const data = await res.json();
      setCollections(data.collections ?? []);
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  async function handleCreate() {
    if (!newName.trim() || newName.trim().length < 2) return;
    setCreating(true);
    setMessage(null);
    try {
      const res = await fetch("/api/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim(), description: newDesc.trim() }),
      });
      if (res.ok) {
        setNewName("");
        setNewDesc("");
        setShowCreate(false);
        fetchCollections();
      } else {
        const data = await res.json();
        setMessage(data.error || "Erro ao criar coleção");
      }
    } catch {
      setMessage("Erro de conexão");
    }
    setCreating(false);
  }

  return (
    <main className="flex-1 max-w-7xl mx-auto px-4 py-6 w-full overflow-y-auto">
        {/* Navigation tabs */}
        <div className="flex gap-1 mb-4 border-b-2 border-border">
          <Link
            href="/browse"
            className="px-3 py-2 text-[8px] font-bold uppercase tracking-wider border-b-2 border-transparent text-muted-foreground hover:text-foreground -mb-[2px]"
          >
            Niveis
          </Link>
          <span className="px-3 py-2 text-[8px] font-bold uppercase tracking-wider border-b-2 border-primary text-primary -mb-[2px]">
            Colecoes
          </span>
        </div>

        <HudPanel className="mb-6">
          <div className="flex items-center justify-between">
            <h1 className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-2">
              <PixelIcon name="star" size={14} /> Coleções
            </h1>
            <HudButton onClick={() => setShowCreate(!showCreate)} variant="primary" size="small">
              <PixelIcon name="create" size={10} /> Nova Coleção
            </HudButton>
          </div>
        </HudPanel>

        {showCreate && (
          <HudPanel className="mb-6">
            <h2 className="text-[10px] font-bold mb-3 uppercase">Criar Coleção</h2>
            {message && <p className="text-[9px] text-red-400 mb-2">{message}</p>}
            <input
              type="text"
              placeholder="Nome da coleção"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              maxLength={60}
              className="w-full bg-muted border-2 border-border px-3 py-2 text-[9px] mb-2 focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <textarea
              placeholder="Descrição (opcional)"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              maxLength={300}
              className="w-full bg-muted border-2 border-border px-3 py-2 text-[9px] mb-3 resize-none h-16 focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <div className="flex gap-2">
              <HudButton onClick={handleCreate} disabled={creating || !newName.trim()} variant="primary" size="small">
                {creating ? "Criando..." : "Criar"}
              </HudButton>
              <HudButton onClick={() => setShowCreate(false)} variant="ghost" size="small">
                Cancelar
              </HudButton>
            </div>
          </HudPanel>
        )}

        {loading ? (
          <div className="text-center py-20 text-muted-foreground text-[9px] uppercase tracking-wider">
            Carregando coleções...
          </div>
        ) : collections.length === 0 ? (
          <HudPanel className="text-center py-16">
            <PixelIcon name="star" size={32} color="#888" />
            <p className="text-[10px] mt-4 mb-2">Nenhuma coleção ainda</p>
            <p className="text-[8px] text-muted-foreground">
              Crie uma coleção para organizar seus níveis favoritos!
            </p>
          </HudPanel>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {collections.map((col) => (
              <Link key={col.id} href={`/collections/${col.id}`}>
                <HudPanel className="hover:border-primary/50 transition-colors cursor-pointer">
                  <h3 className="text-[10px] font-bold uppercase truncate">{col.name}</h3>
                  {col.description && (
                    <p className="text-[8px] text-muted-foreground truncate mt-1">{col.description}</p>
                  )}
                  <div className="flex items-center gap-3 mt-3 text-[8px] text-muted-foreground">
                    <span>por {col.profiles?.nickname || "Anônimo"}</span>
                    <span>{new Date(col.created_at).toLocaleDateString("pt-BR")}</span>
                  </div>
                </HudPanel>
              </Link>
            ))}
          </div>
        )}
      </main>
  );
}
