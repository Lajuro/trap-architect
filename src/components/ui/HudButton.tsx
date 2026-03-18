"use client";

import { type ReactNode, type ButtonHTMLAttributes } from "react";
import Link from "next/link";
import { playUIClick, playUIHover } from "@/game/audio";

type HudButtonVariant = "primary" | "secondary" | "danger" | "gold" | "ghost";

interface HudButtonBaseProps {
  variant?: HudButtonVariant;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
  small?: boolean;
  size?: "small" | "default";
}

interface HudButtonAsButton extends HudButtonBaseProps, Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children"> {
  href?: never;
}

interface HudButtonAsLink extends HudButtonBaseProps {
  href: string;
  onClick?: () => void;
  disabled?: boolean;
  type?: never;
}

type HudButtonProps = HudButtonAsButton | HudButtonAsLink;

const variantBase: Record<HudButtonVariant, string> = {
  primary:
    "bg-primary text-primary-foreground border-2 border-[#cc7000] hover:bg-[#ffaa33] active:translate-y-[1px]",
  secondary:
    "bg-muted text-foreground border-2 border-border hover:bg-[#333] active:translate-y-[1px]",
  danger:
    "bg-destructive/20 text-destructive border-2 border-destructive/50 hover:bg-destructive/30 active:translate-y-[1px]",
  gold:
    "bg-hud-gold/20 text-hud-gold border-2 border-hud-gold/50 hover:bg-hud-gold/30 active:translate-y-[1px]",
  ghost:
    "bg-transparent text-muted-foreground border-2 border-transparent hover:text-foreground hover:border-border active:translate-y-[1px]",
};

export default function HudButton({
  variant = "primary",
  icon,
  children,
  className = "",
  small = false,
  size,
  ...rest
}: HudButtonProps) {
  const isSmall = small || size === "small";
  const baseClass = `inline-flex items-center gap-2 font-bold uppercase tracking-wider transition-all cursor-pointer select-none disabled:opacity-40 disabled:cursor-not-allowed ${
    isSmall ? "px-3 py-1.5 text-[8px]" : "px-5 py-2.5 text-[10px]"
  } ${variantBase[variant]} ${className}`;

  const handleHover = () => {
    playUIHover();
  };

  const handleClick = () => {
    playUIClick();
  };

  if ("href" in rest && rest.href) {
    const { href, disabled, onClick: userClick } = rest;
    if (disabled) {
      return (
        <span className={`${baseClass} opacity-40 cursor-not-allowed`}>
          {icon}
          <span>{children}</span>
        </span>
      );
    }
    return (
      <Link
        href={href}
        className={baseClass}
        onMouseEnter={handleHover}
        onClick={(e) => {
          handleClick();
          userClick?.();
          // stop propagation if needed
          e.stopPropagation?.();
        }}
      >
        {icon}
        <span>{children}</span>
      </Link>
    );
  }

  const { onClick: btnClick, disabled, type, ...buttonRest } = rest as HudButtonAsButton;

  return (
    <button
      type={type || "button"}
      className={baseClass}
      disabled={disabled}
      onMouseEnter={handleHover}
      onClick={(e) => {
        handleClick();
        btnClick?.(e);
      }}
      {...buttonRest}
    >
      {icon}
      <span>{children}</span>
    </button>
  );
}
