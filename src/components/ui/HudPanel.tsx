import { type ReactNode } from "react";

type HudPanelVariant = "default" | "highlight" | "danger" | "gold";

interface HudPanelProps {
  children: ReactNode;
  variant?: HudPanelVariant;
  className?: string;
  noPadding?: boolean;
}

const variantStyles: Record<HudPanelVariant, string> = {
  default: "border-border bg-card",
  highlight: "border-primary bg-card shadow-[0_0_8px_rgba(255,140,0,0.2)]",
  danger: "border-destructive bg-card shadow-[0_0_8px_rgba(239,68,68,0.2)]",
  gold: "border-hud-gold bg-card shadow-[0_0_8px_rgba(255,215,0,0.2)]",
};

export default function HudPanel({
  children,
  variant = "default",
  className = "",
  noPadding = false,
}: HudPanelProps) {
  return (
    <div
      className={`border-2 ${variantStyles[variant]} ${noPadding ? "" : "p-4"} ${className}`}
    >
      {children}
    </div>
  );
}
