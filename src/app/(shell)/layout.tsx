"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import { createClient } from "@/lib/supabase/client";
import { hydrateFromProfile } from "@/lib/cosmetics-sync";
import { GameShellContext, type ShellScreen } from "@/components/GameShellContext";
import LobbyNav from "@/components/LobbyNav";
import type { User } from "@supabase/supabase-js";

const IntroOverlay = dynamic(() => import("@/components/IntroOverlay"), { ssr: false });
const LoadingOverlay = dynamic(() => import("@/components/LoadingOverlay"), { ssr: false });
const LoginOverlay = dynamic(() => import("@/components/LoginOverlay"), { ssr: false });
const LobbyBackground = dynamic(() => import("@/components/LobbyBackground"), { ssr: false });

export default function ShellLayout({ children }: { children: React.ReactNode }) {
  const [screen, setScreen] = useState<ShellScreen>("intro");
  const [user, setUser] = useState<User | null>(null);
  const [coins, setCoins] = useState(0);
  const [lobbyReady, setLobbyReady] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [isGameFullscreen, setGameFullscreen] = useState(false);

  const supabase = useMemo(() => createClient(), []);

  // Check auth after intro
  useEffect(() => {
    if (screen !== "loading" && screen !== "auth" && screen !== "lobby") return;

    supabase.auth.getUser().then(async ({ data: { user } }) => {
      setUser(user);
      setAuthChecked(true);

      if (user) {
        // Load coins + cosmetics in parallel
        try {
          const [inventoryRes, profileRes] = await Promise.all([
            fetch("/api/shop/inventory"),
            fetch("/api/profile"),
          ]);

          if (inventoryRes.ok) {
            const data = await inventoryRes.json();
            setCoins(data.creator_coins ?? 0);
            const profileData = profileRes.ok ? await profileRes.json() : null;
            hydrateFromProfile({
              equipped_skin: data.equipped_skin,
              equipped_trail: data.equipped_trail,
              equipped_death_effect: data.equipped_death_effect,
              equipped_frame: data.equipped_frame,
              unlocked_cosmetics: data.unlocked_cosmetics,
              campaign_progress: profileData?.profile?.campaign_progress || {},
              campaign_completed: profileData?.profile?.campaign_completed || false,
            });
          }
        } catch {
          // Offline fallback
        }
      }
    });
  }, [screen, supabase]);

  // Advance screen state machine
  useEffect(() => {
    if (screen === "loading" && lobbyReady && authChecked) {
      setScreen(user ? "lobby" : "auth");
    }
  }, [screen, lobbyReady, authChecked, user]);

  const handleIntroComplete = useCallback(() => {
    setScreen("loading");
  }, []);

  const handleLobbyReady = useCallback(() => {
    setLobbyReady(true);
  }, []);

  const handleLoginSuccess = useCallback(() => {
    // Re-check auth to hydrate user
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      setUser(user);
      if (user) {
        try {
          const [inventoryRes, profileRes] = await Promise.all([
            fetch("/api/shop/inventory"),
            fetch("/api/profile"),
          ]);
          if (inventoryRes.ok) {
            const data = await inventoryRes.json();
            setCoins(data.creator_coins ?? 0);
            const profileData = profileRes.ok ? await profileRes.json() : null;
            hydrateFromProfile({
              equipped_skin: data.equipped_skin,
              equipped_trail: data.equipped_trail,
              equipped_death_effect: data.equipped_death_effect,
              equipped_frame: data.equipped_frame,
              unlocked_cosmetics: data.unlocked_cosmetics,
              campaign_progress: profileData?.profile?.campaign_progress || {},
              campaign_completed: profileData?.profile?.campaign_completed || false,
            });
          }
        } catch {
          // ignore
        }
      }
      setScreen("lobby");
    });
  }, [supabase]);

  const ctxValue = useMemo(
    () => ({ screen, user, coins, setCoins, isGameFullscreen, setGameFullscreen }),
    [screen, user, coins, isGameFullscreen],
  );

  return (
    <GameShellContext.Provider value={ctxValue}>
      <div className="h-screen w-screen overflow-hidden relative bg-black">
        {/* Phaser animated background — always mounted after intro */}
        {screen !== "intro" && (
          <LobbyBackground onReady={handleLobbyReady} />
        )}

        {/* Intro sequence overlay */}
        {screen === "intro" && (
          <IntroOverlay onComplete={handleIntroComplete} />
        )}

        {/* Loading overlay */}
        {screen === "loading" && (
          <LoadingOverlay onReady={lobbyReady && authChecked} />
        )}

        {/* Auth overlay */}
        {screen === "auth" && (
          <LoginOverlay onSuccess={handleLoginSuccess} />
        )}

        {/* Lobby UI */}
        {screen === "lobby" && (
          <div className="relative z-10 h-full flex flex-col">
            {!isGameFullscreen && <LobbyNav />}
            <main className="flex-1 min-h-0 overflow-y-auto">
              {children}
            </main>
          </div>
        )}
      </div>
    </GameShellContext.Provider>
  );
}
