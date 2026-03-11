import Link from "next/link";
import { GameCanvas } from "@/components/GameCanvas";

export default function PlayPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-primary">
            🐱 Trap Architect
          </Link>
          <span className="text-sm text-muted-foreground">Demo — Fase 1</span>
        </div>
      </header>

      {/* Game */}
      <main className="flex-1 flex items-center justify-center p-4">
        <GameCanvas />
      </main>

      {/* Controls */}
      <footer className="border-t border-border px-6 py-4">
        <div className="max-w-7xl mx-auto text-center text-muted-foreground text-sm">
          <p>
            <kbd className="px-2 py-1 bg-muted rounded text-xs">←→</kbd> Mover
            {" · "}
            <kbd className="px-2 py-1 bg-muted rounded text-xs">↑</kbd> Pular
            {" · "}
            <kbd className="px-2 py-1 bg-muted rounded text-xs">ESC</kbd> Menu
          </p>
        </div>
      </footer>
    </div>
  );
}
