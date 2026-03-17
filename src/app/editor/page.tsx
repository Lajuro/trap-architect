"use client";

import Link from "next/link";
import dynamic from "next/dynamic";

const EditorCanvas = dynamic(() => import("@/components/EditorCanvas").then((m) => m.EditorCanvas), { ssr: false });
const EditorSidebar = dynamic(() => import("@/components/EditorSidebar").then((m) => m.EditorSidebar), { ssr: false });
const EditorToolbar = dynamic(() => import("@/components/EditorToolbar").then((m) => m.EditorToolbar), { ssr: false });

export default function EditorPage() {
  return (
    <div className="h-screen w-screen flex flex-col bg-[#0a0a0f] overflow-hidden select-none">
      {/* Top navbar with integrated toolbar */}
      <header className="h-11 border-b border-border/50 px-3 shrink-0 flex items-center bg-gradient-to-r from-[#111118] via-[#0f0f16] to-[#111118]">
        <Link
          href="/"
          className="text-sm font-bold text-primary hover:text-primary/80 transition-colors flex items-center gap-1.5 mr-2 shrink-0"
        >
          Trap Architect
        </Link>
        <EditorToolbar />
      </header>

      {/* Main editor area */}
      <div className="flex-1 flex min-h-0">
        <main className="flex-1 min-w-0 relative bg-[#08080e]">
          <EditorCanvas />
        </main>
        <EditorSidebar />
      </div>
    </div>
  );
}
