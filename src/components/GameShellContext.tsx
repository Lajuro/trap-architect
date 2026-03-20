"use client";

import { createContext, useContext } from "react";
import type { User } from "@supabase/supabase-js";

export type ShellScreen = "intro" | "loading" | "auth" | "lobby";

export interface GameShellContextValue {
  screen: ShellScreen;
  user: User | null;
  coins: number;
  setCoins: (c: number) => void;
  creatorRank: number;
  isGameFullscreen: boolean;
  setGameFullscreen: (v: boolean) => void;
}

export const GameShellContext = createContext<GameShellContextValue>({
  screen: "intro",
  user: null,
  coins: 0,
  setCoins: () => {},
  creatorRank: 0,
  isGameFullscreen: false,
  setGameFullscreen: () => {},
});

export function useGameShell() {
  return useContext(GameShellContext);
}
