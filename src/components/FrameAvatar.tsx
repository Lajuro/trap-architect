"use client";

interface FrameAvatarProps {
  frameId?: string;
  size?: number;
  children: React.ReactNode;
  className?: string;
}

const FRAME_STYLES: Record<string, { border: string; shadow: string; animate?: boolean }> = {
  frame_none: { border: "border-transparent", shadow: "" },
  frame_gold: {
    border: "border-yellow-500",
    shadow: "shadow-[0_0_10px_rgba(234,179,8,0.4)]",
  },
  frame_diamond: {
    border: "border-cyan-300",
    shadow: "shadow-[0_0_12px_rgba(6,182,212,0.5)]",
  },
  frame_troll: {
    border: "border-purple-500",
    shadow: "shadow-[0_0_10px_rgba(168,85,247,0.4)]",
  },
  frame_fire: {
    border: "border-orange-500",
    shadow: "shadow-[0_0_12px_rgba(249,115,22,0.5)]",
    animate: true,
  },
};

export default function FrameAvatar({ frameId, size = 40, children, className = "" }: FrameAvatarProps) {
  const id = frameId || "frame_none";
  const style = FRAME_STYLES[id] || FRAME_STYLES.frame_none;

  if (id === "frame_none" || !style) {
    return (
      <div
        className={`rounded-full overflow-hidden flex items-center justify-center ${className}`}
        style={{ width: size, height: size }}
      >
        {children}
      </div>
    );
  }

  return (
    <div
      className={`rounded-full overflow-hidden flex items-center justify-center border-3 ${style.border} ${style.shadow} ${style.animate ? "animate-pulse" : ""} ${className}`}
      style={{ width: size + 6, height: size + 6 }}
    >
      <div
        className="rounded-full overflow-hidden flex items-center justify-center"
        style={{ width: size, height: size }}
      >
        {children}
      </div>
    </div>
  );
}
