"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { gameEvents, GAME_EVENTS } from "@/game/events";
import { useGameShell } from "@/components/GameShellContext";

const CampaignCanvas = dynamic(
  () => import("@/components/CampaignCanvas").then((m) => m.CampaignCanvas),
  { ssr: false },
);

export default function PlayPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { setGameFullscreen } = useGameShell();
  const isDemo = searchParams.get("demo") === "1";

  // Listen for game scene lifecycle events
  useEffect(() => {
    const handleEnter = () => setGameFullscreen(true);
    const handleExit = () => setGameFullscreen(false);
    const handleReturn = () => {
      setGameFullscreen(false);
      router.push("/");
    };

    gameEvents.on(GAME_EVENTS.ENTER_GAME_SCENE, handleEnter);
    gameEvents.on(GAME_EVENTS.EXIT_GAME_SCENE, handleExit);
    gameEvents.on(GAME_EVENTS.RETURN_TO_LOBBY, handleReturn);

    // Demo starts directly in GameScene → fullscreen immediately
    if (isDemo) {
      setGameFullscreen(true);
    }

    return () => {
      gameEvents.off(GAME_EVENTS.ENTER_GAME_SCENE, handleEnter);
      gameEvents.off(GAME_EVENTS.EXIT_GAME_SCENE, handleExit);
      gameEvents.off(GAME_EVENTS.RETURN_TO_LOBBY, handleReturn);
      setGameFullscreen(false);
    };
  }, [setGameFullscreen, router, isDemo]);

  return (
    <div className="w-full h-full bg-black">
      <CampaignCanvas startScene={isDemo ? "GameScene" : "LevelSelectScene"} />
    </div>
  );
}
