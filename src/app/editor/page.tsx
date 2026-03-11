"use client";

import Link from "next/link";
import dynamic from "next/dynamic";

const EditorCanvas = dynamic(() => import("@/components/EditorCanvas").then((m) => m.EditorCanvas), { ssr: false });
const EditorSidebar = dynamic(() => import("@/components/EditorSidebar").then((m) => m.EditorSidebar), { ssr: false });

export default function EditorPage() {
  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border px-4 py-2 shrink-0">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-lg font-bold text-primary">
            🐱 Trap Architect
          </Link>
          <span className="text-sm text-muted-foreground">
            Editor de Níveis
          </span>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>WASD: mover câmera</span>
            <span>Scroll: zoom</span>
            <span>Click: pintar</span>
            <span>Right-click: apagar</span>
            <span>Ctrl+Z/Y: desfazer/refazer</span>
          </div>
        </div>
      </header>

      {/* Main */}
      <div className="flex-1 flex overflow-hidden">
        {/* Canvas area */}
        <main className="flex-1 flex items-center justify-center p-4 bg-muted/30">
          <EditorCanvas />
        </main>

        {/* Sidebar */}
        <EditorSidebar />
      </div>
    </div>
  );
}
