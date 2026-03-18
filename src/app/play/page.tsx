"use client";

import dynamic from "next/dynamic";
import HudBar from "@/components/ui/HudBar";

const GameCanvas = dynamic(
  () => import("@/components/GameCanvas").then((m) => m.GameCanvas),
  { ssr: false },
);

export default function PlayPage() {
  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <HudBar />

      {/* Game */}
      <main className="flex-1 min-h-0">
        <GameCanvas />
      </main>

      {/* Controls */}
      <footer className="border-t-2 border-border px-4 py-2">
        <div className="max-w-7xl mx-auto text-center text-muted-foreground text-[8px] uppercase tracking-wider">
          <p>
            <kbd className="px-2 py-1 bg-muted border border-border text-[7px]">A/D</kbd> Mover
            {" / "}
            <kbd className="px-2 py-1 bg-muted border border-border text-[7px]">W</kbd> Pular
            {" / "}
            <kbd className="px-2 py-1 bg-muted border border-border text-[7px]">ESC</kbd> Menu
          </p>
        </div>
      </footer>
    </div>
  );
}
