"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import HudPanel from "@/components/ui/HudPanel";
import HudButton from "@/components/ui/HudButton";
import { PixelIcon } from "@/components/ui/PixelIcon";

export default function JoinRaceClient() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState("");

  const handleJoin = useCallback(async () => {
    const clean = code.trim().toUpperCase();
    if (clean.length !== 6) {
      setError("Código deve ter 6 caracteres");
      return;
    }
    setJoining(true);
    setError("");
    try {
      const res = await fetch("/api/race/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: clean }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Erro ao entrar na sala");
        return;
      }
      // Successfully joined — navigate to race room
      router.push(`/race/${clean}`);
    } catch {
      setError("Falha ao conectar com o servidor");
    } finally {
      setJoining(false);
    }
  }, [code, router]);

  return (
    <div className="flex h-full items-center justify-center">
      <HudPanel className="max-w-sm p-6 text-center space-y-4">
        <h2 className="text-xl text-yellow-300 pixel-text">
          <PixelIcon name="flag" size={20} className="inline mr-2" />
          Entrar em Corrida
        </h2>
        <p className="text-gray-400 text-xs">
          Digite o código de 6 caracteres compartilhado pelo anfitrião
        </p>
        <input
          type="text"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z2-9]/g, ""))}
          placeholder="EX: A3B7K9"
          className="w-full text-center text-2xl tracking-widest pixel-text bg-black/40 border border-white/20 rounded px-4 py-3 text-white placeholder-gray-600 focus:border-yellow-300 focus:outline-none"
        />
        {error && <p className="text-red-400 text-xs">{error}</p>}
        <div className="flex gap-3 justify-center">
          <HudButton onClick={() => router.back()} variant="ghost">
            Voltar
          </HudButton>
          <HudButton
            onClick={handleJoin}
            variant="primary"
            disabled={joining || code.length !== 6}
          >
            {joining ? "Entrando..." : "Entrar"}
          </HudButton>
        </div>
      </HudPanel>
    </div>
  );
}
