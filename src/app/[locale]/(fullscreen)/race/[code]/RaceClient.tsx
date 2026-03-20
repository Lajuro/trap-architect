"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import type { DbLevel, DbRaceRoom } from "@/lib/database.types";
import type { ParsedLevel } from "@/game/types";
import type { RaceEventType, RacePosition } from "@/lib/useRaceChannel";
import { useRaceChannel } from "@/lib/useRaceChannel";
import { dbLevelToParsedLevel } from "@/lib/level-utils";
import HudPanel from "@/components/ui/HudPanel";
import HudButton from "@/components/ui/HudButton";
import { PixelIcon } from "@/components/ui/PixelIcon";

const RaceCanvas = dynamic(
  () => import("@/components/RaceCanvas").then((m) => m.RaceCanvas),
  { ssr: false },
);

type RacePhase = "loading" | "waiting" | "countdown" | "racing" | "finished";

interface RoomProfile {
  id: string;
  nickname: string;
  photo_url: string | null;
  equipped_frame: string | null;
}

interface RoomWithProfiles extends DbRaceRoom {
  host: RoomProfile;
  guest: RoomProfile | null;
}

interface RaceResult {
  winnerId: string | null;
  hostTime: number | null;
  guestTime: number | null;
  hostDeaths: number | null;
  guestDeaths: number | null;
  disconnected?: boolean;
}

export default function RaceClient() {
  const params = useParams<{ code: string }>();
  const router = useRouter();
  const code = params.code;

  const [phase, setPhase] = useState<RacePhase>("loading");
  const [room, setRoom] = useState<RoomWithProfiles | null>(null);
  const [level, setLevel] = useState<ParsedLevel | null>(null);
  const [userId, setUserId] = useState("");
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(3);
  const [result, setResult] = useState<RaceResult | null>(null);
  const [opponentFinished, setOpponentFinished] = useState(false);

  // Opponent position for ghost overlay
  const opponentPosRef = useRef<RacePosition>({ x: 0, y: 0, alive: true, frame: 0 });
  const gameSceneRef = useRef<{ setOpponentPosition: (x: number, y: number, alive: boolean) => void } | null>(null);
  const localFinishedRef = useRef(false);

  // Determine roles
  const isHost = room ? room.host_id === userId : false;
  const opponentName = room
    ? isHost
      ? room.guest?.nickname ?? "???"
      : room.host.nickname
    : "???";
  const myName = room
    ? isHost
      ? room.host.nickname
      : room.guest?.nickname ?? "???"
    : "???";

  // Handle opponent events from realtime channel
  const handleOpponentEvent = useCallback(
    (event: RaceEventType) => {
      switch (event.type) {
        case "position":
          opponentPosRef.current = event.payload;
          gameSceneRef.current?.setOpponentPosition(
            event.payload.x,
            event.payload.y,
            event.payload.alive,
          );
          break;
        case "died":
          // Opponent died — hide ghost briefly
          gameSceneRef.current?.setOpponentPosition(0, 0, false);
          break;
        case "complete":
          setOpponentFinished(true);
          break;
        case "countdown":
          setCountdown(event.payload.count);
          if (event.payload.count === 0) {
            setPhase("racing");
          }
          break;
        case "start":
          setPhase("countdown");
          break;
        case "disconnected":
          // Opponent disconnected — auto-win
          setResult({
            winnerId: userId,
            hostTime: null,
            guestTime: null,
            hostDeaths: null,
            guestDeaths: null,
            disconnected: true,
          });
          setPhase("finished");
          break;
      }
    },
    [userId],
  );

  const { broadcast } = useRaceChannel({
    roomId: room?.id ?? "",
    userId,
    onOpponentEvent: handleOpponentEvent,
  });

  // Fetch room data on mount
  useEffect(() => {
    async function fetchRoom() {
      try {
        const res = await fetch(`/api/race/${encodeURIComponent(code)}`);
        if (!res.ok) {
          const data = await res.json();
          setError(data.error || "Erro ao carregar sala");
          return;
        }
        const data = await res.json();
        setRoom(data.room as RoomWithProfiles);
        setUserId(data.userId);
        if (data.level) {
          setLevel(dbLevelToParsedLevel(data.level as DbLevel));
        }

        const roomData = data.room as RoomWithProfiles;
        if (roomData.status === "waiting") {
          setPhase("waiting");
        } else if (roomData.status === "ready" || roomData.status === "racing") {
          setPhase("waiting"); // will transition on start event
        } else if (roomData.status === "finished") {
          setResult({
            winnerId: roomData.winner_id,
            hostTime: roomData.host_time_ms,
            guestTime: roomData.guest_time_ms,
            hostDeaths: roomData.host_deaths,
            guestDeaths: roomData.guest_deaths,
          });
          setPhase("finished");
        }
      } catch {
        setError("Falha ao conectar com o servidor");
      }
    }
    fetchRoom();
  }, [code]);

  // Poll room status while waiting (check if guest joined)
  useEffect(() => {
    if (phase !== "waiting") return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/race/${encodeURIComponent(code)}`);
        if (!res.ok) return;
        const data = await res.json();
        const updated = data.room as RoomWithProfiles;
        setRoom(updated);
        if (updated.guest_id && updated.status === "ready") {
          // Both players present — host starts countdown
          if (updated.host_id === userId) {
            startCountdown();
          }
        }
      } catch {
        // ignore polling errors
      }
    }, 2000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, code, userId]);

  // Countdown logic (host drives countdown)
  const startCountdown = useCallback(() => {
    setPhase("countdown");
    broadcast({ type: "start", payload: { timestamp: Date.now() } });

    let count = 3;
    setCountdown(3);
    const timer = setInterval(() => {
      count--;
      setCountdown(count);
      broadcast({ type: "countdown", payload: { count } });
      if (count <= 0) {
        clearInterval(timer);
        setPhase("racing");
      }
    }, 1000);
  }, [broadcast]);

  // Position broadcast callback from game scene
  const handlePositionBroadcast = useCallback(
    (x: number, y: number, alive: boolean, frame: number) => {
      broadcast({ type: "position", payload: { x, y, alive, frame } });
    },
    [broadcast],
  );

  // Race completion callback from game scene
  const handleRaceComplete = useCallback(
    async (timeMs: number, deaths: number) => {
      if (localFinishedRef.current) return;
      localFinishedRef.current = true;

      broadcast({ type: "complete", payload: { timeMs, deaths } });

      try {
        const res = await fetch("/api/race/finish", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roomId: room?.id, timeMs, deaths }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.room?.status === "finished") {
            setResult({
              winnerId: data.room.winner_id,
              hostTime: data.room.host_time_ms,
              guestTime: data.room.guest_time_ms,
              hostDeaths: data.room.host_deaths,
              guestDeaths: data.room.guest_deaths,
            });
            setPhase("finished");
          }
        }
      } catch {
        // Will be resolved when opponent finishes
      }

      // If opponent already finished, re-fetch the result
      if (opponentFinished) {
        try {
          const res = await fetch(`/api/race/${encodeURIComponent(code)}`);
          if (res.ok) {
            const data = await res.json();
            const updated = data.room as RoomWithProfiles;
            if (updated.status === "finished") {
              setResult({
                winnerId: updated.winner_id,
                hostTime: updated.host_time_ms,
                guestTime: updated.guest_time_ms,
                hostDeaths: updated.host_deaths,
                guestDeaths: updated.guest_deaths,
              });
              setPhase("finished");
            }
          }
        } catch {
          // ignore
        }
      }
    },
    [broadcast, room?.id, code, opponentFinished],
  );

  // When opponent finishes after us, re-check result
  useEffect(() => {
    if (!opponentFinished || !localFinishedRef.current || phase === "finished") return;
    async function checkResult() {
      try {
        const res = await fetch(`/api/race/${encodeURIComponent(code)}`);
        if (!res.ok) return;
        const data = await res.json();
        const updated = data.room as RoomWithProfiles;
        if (updated.status === "finished") {
          setResult({
            winnerId: updated.winner_id,
            hostTime: updated.host_time_ms,
            guestTime: updated.guest_time_ms,
            hostDeaths: updated.host_deaths,
            guestDeaths: updated.guest_deaths,
          });
          setPhase("finished");
        }
      } catch {
        // ignore
      }
    }
    checkResult();
  }, [opponentFinished, phase, code]);

  // Register GameScene ref for opponent ghost control
  const handleGameSceneReady = useCallback(
    (scene: { setOpponentPosition: (x: number, y: number, alive: boolean) => void }) => {
      gameSceneRef.current = scene;
    },
    [],
  );

  // --- RENDER ---

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <HudPanel className="max-w-md p-6 text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <HudButton onClick={() => router.push("/")}>Voltar</HudButton>
        </HudPanel>
      </div>
    );
  }

  if (phase === "loading") {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-white pixel-text animate-pulse">Carregando...</p>
      </div>
    );
  }

  if (phase === "waiting") {
    return (
      <div className="flex h-full items-center justify-center">
        <HudPanel className="max-w-md p-6 text-center space-y-4">
          <h2 className="text-xl text-yellow-300 pixel-text">
            <PixelIcon name="flag" size={20} className="inline mr-2" />
            Corrida Versus
          </h2>
          <p className="text-gray-300 text-sm">
            Código da sala:
          </p>
          <p className="text-3xl text-white pixel-text tracking-widest select-all">
            {code.toUpperCase()}
          </p>
          <div className="border-t border-white/10 pt-4 space-y-2">
            <p className="text-gray-400 text-xs">Jogadores:</p>
            <p className="text-green-400 pixel-text">
              {myName} {isHost ? "(anfitrião)" : "(convidado)"}
            </p>
            {room?.guest ? (
              <p className="text-blue-400 pixel-text">{opponentName}</p>
            ) : (
              <p className="text-gray-500 pixel-text animate-pulse">
                Aguardando oponente...
              </p>
            )}
          </div>
          <p className="text-gray-500 text-xs">
            Compartilhe o código acima para convidar um amigo
          </p>
        </HudPanel>
      </div>
    );
  }

  if (phase === "countdown") {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 pixel-text mb-2">vs {opponentName}</p>
          <p className="text-8xl text-yellow-300 pixel-text animate-bounce">
            {countdown > 0 ? countdown : "GO!"}
          </p>
        </div>
      </div>
    );
  }

  if (phase === "finished" && result) {
    const didWin = result.winnerId === userId;
    const myTime = isHost ? result.hostTime : result.guestTime;
    const oppTime = isHost ? result.guestTime : result.hostTime;
    const myDeaths = isHost ? result.hostDeaths : result.guestDeaths;
    const oppDeaths = isHost ? result.guestDeaths : result.hostDeaths;

    return (
      <div className="flex h-full items-center justify-center">
        <HudPanel className="max-w-lg p-6 text-center space-y-4">
          <h2
            className={`text-3xl pixel-text ${
              result.disconnected
                ? "text-yellow-300"
                : didWin
                  ? "text-green-400"
                  : "text-red-400"
            }`}
          >
            {result.disconnected
              ? "Oponente desconectou"
              : didWin
                ? "Vitória!"
                : "Derrota"}
          </h2>

          {!result.disconnected && (
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-1">
                <p className="text-green-400 pixel-text">{myName}</p>
                <p className="text-white">
                  {myTime != null ? `${(myTime / 1000).toFixed(2)}s` : "DNF"}
                </p>
                <p className="text-gray-400">
                  {myDeaths != null ? `${myDeaths} mortes` : "—"}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-blue-400 pixel-text">{opponentName}</p>
                <p className="text-white">
                  {oppTime != null ? `${(oppTime / 1000).toFixed(2)}s` : "DNF"}
                </p>
                <p className="text-gray-400">
                  {oppDeaths != null ? `${oppDeaths} mortes` : "—"}
                </p>
              </div>
            </div>
          )}

          <div className="flex gap-3 justify-center pt-2">
            <HudButton onClick={() => router.push("/")}>
              Menu
            </HudButton>
            {level && room && (
              <HudButton
                onClick={() => router.push(`/play/${room.level_id}`)}
              >
                Jogar Solo
              </HudButton>
            )}
          </div>
        </HudPanel>
      </div>
    );
  }

  // phase === "racing"
  if (!level) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-red-400 pixel-text">Nível não encontrado</p>
      </div>
    );
  }

  return (
    <div className="h-full w-full relative">
      {/* Opponent name tag top-right */}
      <div className="absolute top-2 right-2 z-10 bg-black/60 px-3 py-1 rounded">
        <span className="text-gray-400 text-xs pixel-text">vs </span>
        <span className="text-blue-400 text-xs pixel-text">{opponentName}</span>
      </div>

      <RaceCanvas
        level={level}
        onPositionBroadcast={handlePositionBroadcast}
        onRaceComplete={handleRaceComplete}
        onGameSceneReady={handleGameSceneReady}
      />
    </div>
  );
}
