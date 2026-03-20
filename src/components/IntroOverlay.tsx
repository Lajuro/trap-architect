"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { PixelIcon } from "@/components/ui/PixelIcon";

export default function IntroOverlay({ onComplete }: { onComplete: () => void }) {
  const tc = useTranslations("common");
  const [phase, setPhase] = useState<"dark" | "title" | "cat" | "done">("dark");

  const skip = useCallback(() => {
    setPhase("done");
    onComplete();
  }, [onComplete]);

  useEffect(() => {
    // Check if already seen this session
    if (sessionStorage.getItem("trap_intro_seen") === "1") {
      skip();
      return;
    }

    const t1 = setTimeout(() => setPhase("title"), 400);
    const t2 = setTimeout(() => setPhase("cat"), 1800);
    const t3 = setTimeout(() => {
      sessionStorage.setItem("trap_intro_seen", "1");
      setPhase("done");
      onComplete();
    }, 3200);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [onComplete, skip]);

  useEffect(() => {
    if (phase === "done") return;

    const handler = () => {
      sessionStorage.setItem("trap_intro_seen", "1");
      skip();
    };

    window.addEventListener("click", handler);
    window.addEventListener("keydown", handler);
    return () => {
      window.removeEventListener("click", handler);
      window.removeEventListener("keydown", handler);
    };
  }, [phase, skip]);

  if (phase === "done") return null;

  return (
    <div className="fixed inset-0 z-[60] bg-black flex flex-col items-center justify-center select-none cursor-pointer" role="presentation" aria-label={tc("introAriaLabel")}>
      {/* Title */}
      <div
        className={`transition-all duration-700 ${
          phase === "dark"
            ? "opacity-0 scale-75"
            : "opacity-100 scale-100"
        }`}
      >
        <h1
          className="text-primary text-xl md:text-3xl font-bold tracking-widest uppercase"
          style={{
            textShadow: "0 0 20px rgba(255,140,0,0.6), 0 0 40px rgba(255,140,0,0.3)",
          }}
        >
          TRAP ARCHITECT
        </h1>
      </div>

      {/* Cat mascot */}
      <div
        className={`mt-8 transition-all duration-500 ${
          phase === "cat"
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-4"
        }`}
      >
        <PixelIcon name="cat" size={48} color="#ff8c00" />
      </div>

      {/* Skip hint */}
      <p className="absolute bottom-8 text-[8px] text-muted-foreground/50 uppercase tracking-wider animate-pulse">
        {tc("clickToSkip")}
      </p>
    </div>
  );
}
