"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import PixelIcon from "@/components/ui/PixelIcon";
import { playUIClick } from "@/game/audio";

const EditorCanvas = dynamic(() => import("@/components/EditorCanvas").then((m) => m.EditorCanvas), { ssr: false });
const EditorSidebar = dynamic(() => import("@/components/EditorSidebar").then((m) => m.EditorSidebar), { ssr: false });
const EditorToolbar = dynamic(() => import("@/components/EditorToolbar").then((m) => m.EditorToolbar), { ssr: false });

export default function EditorPage() {
  const t = useTranslations("editor");
  return (
    <div className="h-screen w-screen flex flex-col bg-editor-bg overflow-hidden select-none">
      {/* Top navbar with integrated toolbar */}
      <header className="h-11 border-b-2 border-border/50 px-3 shrink-0 flex items-center bg-editor-surface">
        <Link
          href="/"
          onClick={() => playUIClick()}
          className="text-[8px] font-bold text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5 mr-3 shrink-0 uppercase tracking-wider"
        >
          <PixelIcon name="back" size={12} />
          {t("lobby")}
        </Link>
        <div className="w-px h-6 bg-border/50 mr-2" />
        <PixelIcon name="cat" size={14} color="#ff8c00" />
        <span className="text-[8px] font-bold text-primary ml-1.5 mr-2 uppercase tracking-wider">{t("editorLabel")}</span>
        <EditorToolbar />
      </header>

      {/* Main editor area */}
      <div className="flex-1 flex min-h-0">
        <main className="flex-1 min-w-0 relative bg-editor-canvas">
          <EditorCanvas />
        </main>
        <EditorSidebar />
      </div>
    </div>
  );
}
