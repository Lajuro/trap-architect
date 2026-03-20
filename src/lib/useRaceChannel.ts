"use client";

import { useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

export interface RacePosition {
  x: number;
  y: number;
  alive: boolean;
  frame: number;
}

export type RaceEventType =
  | { type: "position"; payload: RacePosition }
  | { type: "died" }
  | { type: "complete"; payload: { timeMs: number; deaths: number } }
  | { type: "heartbeat" }
  | { type: "start"; payload: { timestamp: number } }
  | { type: "countdown"; payload: { count: number } }
  | { type: "disconnected" };

interface UseRaceChannelOptions {
  roomId: string;
  userId: string;
  onOpponentEvent: (event: RaceEventType) => void;
}

const HEARTBEAT_INTERVAL = 5000; // 5s
const DISCONNECT_TIMEOUT = 30000; // 30s

export function useRaceChannel({
  roomId,
  userId,
  onOpponentEvent,
}: UseRaceChannelOptions) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const disconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastOpponentHeartbeatRef = useRef<number>(Date.now());
  const onOpponentEventRef = useRef(onOpponentEvent);
  onOpponentEventRef.current = onOpponentEvent;

  useEffect(() => {
    const supabase = createClient();
    const channelName = `race:${roomId}`;

    const channel = supabase.channel(channelName, {
      config: { broadcast: { self: false } },
    });

    channel
      .on("broadcast", { event: "race_event" }, ({ payload }) => {
        const msg = payload as { senderId: string; event: RaceEventType };
        // Only process events from the opponent
        if (msg.senderId === userId) return;

        // Reset disconnect timer on any opponent message
        lastOpponentHeartbeatRef.current = Date.now();
        if (disconnectTimerRef.current) {
          clearTimeout(disconnectTimerRef.current);
        }
        disconnectTimerRef.current = setTimeout(() => {
          onOpponentEventRef.current({ type: "disconnected" });
        }, DISCONNECT_TIMEOUT);

        onOpponentEventRef.current(msg.event);
      })
      .subscribe();

    channelRef.current = channel;

    // Start heartbeat
    heartbeatRef.current = setInterval(() => {
      channel.send({
        type: "broadcast",
        event: "race_event",
        payload: { senderId: userId, event: { type: "heartbeat" } },
      });
    }, HEARTBEAT_INTERVAL);

    // Start initial disconnect timer
    disconnectTimerRef.current = setTimeout(() => {
      onOpponentEventRef.current({ type: "disconnected" });
    }, DISCONNECT_TIMEOUT);

    return () => {
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      if (disconnectTimerRef.current) clearTimeout(disconnectTimerRef.current);
      channel.unsubscribe();
      channelRef.current = null;
    };
  }, [roomId, userId]);

  const broadcast = useCallback(
    (event: RaceEventType) => {
      channelRef.current?.send({
        type: "broadcast",
        event: "race_event",
        payload: { senderId: userId, event },
      });
    },
    [userId],
  );

  return { broadcast };
}
