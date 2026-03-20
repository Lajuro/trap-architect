"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

export default function LoadingOverlay({ onReady }: { onReady?: boolean }) {
  const tc = useTranslations("common");
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // Animate progress bar
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 90 && !onReady) return p; // Stall at 90% until ready
        if (p >= 100) return 100;
        return p + (onReady ? 10 : 2);
      });
    }, 50);

    return () => clearInterval(interval);
  }, [onReady]);

  useEffect(() => {
    if (progress >= 100) {
      const t = setTimeout(() => setVisible(false), 300);
      return () => clearTimeout(t);
    }
  }, [progress]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[55] bg-black flex flex-col items-center justify-center gap-6 select-none" aria-live="polite">
      {/* Logo */}
      <h2
        className="text-primary text-sm md:text-base font-bold tracking-widest uppercase"
        style={{
          textShadow: "0 0 12px rgba(255,140,0,0.4)",
        }}
      >
        TRAP ARCHITECT
      </h2>

      {/* Progress bar container */}
      <div className="w-64 md:w-80">
        <div className="border-2 border-border bg-card/50 p-1">
          <div
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={tc("loadingAriaLabel")}
            className="h-3 bg-primary transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-[8px] text-muted-foreground text-center mt-2 uppercase tracking-wider">
          {tc("loading")}
          <span className="animate-pulse">...</span>
        </p>
      </div>
    </div>
  );
}
