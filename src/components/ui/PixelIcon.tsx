"use client";

import { useEffect, useRef } from "react";

export type PixelIconName =
  // Navigation
  | "play"
  | "create"
  | "browse"
  | "shop"
  | "profile"
  | "settings"
  | "back"
  | "home"
  | "menu"
  // Stats
  | "heart"
  | "heart-filled"
  | "play-count"
  | "skull"
  | "coin"
  | "clock"
  // Difficulty
  | "diff-new"
  | "diff-easy"
  | "diff-medium"
  | "diff-hard"
  | "diff-extreme"
  // Actions
  | "search"
  | "sort"
  | "filter"
  | "report"
  | "close"
  | "check"
  | "equip"
  | "delete"
  | "dismiss"
  // Featured
  | "star"
  | "star-filled"
  | "dev-pick"
  | "ribbon"
  // Misc
  | "lock"
  | "sound-on"
  | "sound-off"
  | "logout"
  | "arrow-up"
  | "arrow-down"
  | "arrow-left"
  | "arrow-right"
  | "cat"
  | "flag"
  | "trophy"
  | "crown"
  | "paint"
  | "sparkle"
  | "frame"
  | "fire"
  | "ghost"
  | "confetti"
  | "shatter"
  | "bug"
  | "ban"
  | "warning"
  | "info";

interface PixelIconProps {
  name: PixelIconName;
  size?: number;
  color?: string;
  className?: string;
}

// ============================================================
// Drawing functions — procedural pixel art (Canvas2D),
// matching BootScene.ts style. Each icon is drawn on a 16x16 grid.
// ============================================================

type DrawFn = (ctx: CanvasRenderingContext2D, s: number, color?: string) => void;

const drawers: Record<PixelIconName, DrawFn> = {
  // --- Navigation ---
  play: (ctx, s) => {
    ctx.fillStyle = "#ff8c00";
    ctx.beginPath();
    ctx.moveTo(s * 0.25, s * 0.125);
    ctx.lineTo(s * 0.875, s * 0.5);
    ctx.lineTo(s * 0.25, s * 0.875);
    ctx.closePath();
    ctx.fill();
  },
  create: (ctx, s) => {
    const t = Math.max(1, Math.round(s * 0.15));
    const cx = s / 2;
    ctx.fillStyle = "#22C55E";
    ctx.fillRect(cx - t / 2, s * 0.15, t, s * 0.7);
    ctx.fillRect(s * 0.15, cx - t / 2, s * 0.7, t);
  },
  browse: (ctx, s) => {
    ctx.fillStyle = "#60a5fa";
    const bw = Math.round(s * 0.35);
    const bh = Math.round(s * 0.35);
    const gap = Math.round(s * 0.1);
    const off = Math.round(s * 0.1);
    ctx.fillRect(off, off, bw, bh);
    ctx.fillRect(off + bw + gap, off, bw, bh);
    ctx.fillRect(off, off + bh + gap, bw, bh);
    ctx.fillRect(off + bw + gap, off + bh + gap, bw, bh);
  },
  shop: (ctx, s) => {
    ctx.fillStyle = "#FFD700";
    // Coin shape
    const cx = s / 2, r = s * 0.35;
    ctx.beginPath();
    ctx.arc(cx, cx, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#B8960C";
    ctx.beginPath();
    ctx.arc(cx, cx, r * 0.55, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#FFD700";
    const t = Math.max(1, Math.round(s * 0.1));
    ctx.fillRect(cx - t / 2, cx - r * 0.35, t, r * 0.7);
    ctx.fillRect(cx - r * 0.2, cx - t / 2, r * 0.4, t);
  },
  profile: (ctx, s) => {
    ctx.fillStyle = "#a78bfa";
    // Head
    const cx = s / 2;
    ctx.beginPath();
    ctx.arc(cx, s * 0.3, s * 0.2, 0, Math.PI * 2);
    ctx.fill();
    // Body
    ctx.beginPath();
    ctx.arc(cx, s * 0.85, s * 0.32, Math.PI, 0);
    ctx.fill();
  },
  settings: (ctx, s) => {
    ctx.fillStyle = "#a3a3a3";
    const cx = s / 2;
    // Outer gear teeth
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const tx = cx + Math.cos(angle) * s * 0.35;
      const ty = cx + Math.sin(angle) * s * 0.35;
      const sz = s * 0.15;
      ctx.fillRect(tx - sz / 2, ty - sz / 2, sz, sz);
    }
    // Center
    ctx.beginPath();
    ctx.arc(cx, cx, s * 0.22, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#0a0a0a";
    ctx.beginPath();
    ctx.arc(cx, cx, s * 0.1, 0, Math.PI * 2);
    ctx.fill();
  },
  back: (ctx, s) => {
    ctx.fillStyle = "#a3a3a3";
    ctx.beginPath();
    ctx.moveTo(s * 0.7, s * 0.15);
    ctx.lineTo(s * 0.2, s * 0.5);
    ctx.lineTo(s * 0.7, s * 0.85);
    ctx.closePath();
    ctx.fill();
  },
  home: (ctx, s) => {
    ctx.fillStyle = "#ff8c00";
    // Roof
    ctx.beginPath();
    ctx.moveTo(s * 0.5, s * 0.1);
    ctx.lineTo(s * 0.9, s * 0.45);
    ctx.lineTo(s * 0.1, s * 0.45);
    ctx.closePath();
    ctx.fill();
    // Body
    ctx.fillRect(s * 0.2, s * 0.45, s * 0.6, s * 0.45);
    // Door
    ctx.fillStyle = "#0a0a0a";
    ctx.fillRect(s * 0.4, s * 0.55, s * 0.2, s * 0.35);
  },
  menu: (ctx, s) => {
    ctx.fillStyle = "#fafafa";
    const t = Math.max(1, Math.round(s * 0.12));
    const gap = s * 0.22;
    for (let i = 0; i < 3; i++) {
      ctx.fillRect(s * 0.15, s * 0.2 + i * gap, s * 0.7, t);
    }
  },

  // --- Stats ---
  heart: (ctx, s) => {
    ctx.fillStyle = "#EF4444";
    const cx = s / 2;
    // Simple pixel heart shape
    const p = Math.max(1, Math.round(s / 8));
    // Row by row heart
    ctx.fillRect(cx - 3 * p, cx - 2 * p, 2 * p, 2 * p);
    ctx.fillRect(cx + p, cx - 2 * p, 2 * p, 2 * p);
    ctx.fillRect(cx - 4 * p, cx - p, 2 * p, 2 * p);
    ctx.fillRect(cx - 2 * p, cx - p, 2 * p, 2 * p);
    ctx.fillRect(cx, cx - p, 2 * p, 2 * p);
    ctx.fillRect(cx + 2 * p, cx - p, 2 * p, 2 * p);
    ctx.fillRect(cx - 4 * p, cx, p * 8, 2 * p);
    ctx.fillRect(cx - 3 * p, cx + p, p * 6, 2 * p);
    ctx.fillRect(cx - 2 * p, cx + 2 * p, p * 4, p);
    ctx.fillRect(cx - p, cx + 3 * p, p * 2, p);
  },
  "heart-filled": (ctx, s, color) => {
    drawers.heart(ctx, s, color);
  },
  "play-count": (ctx, s) => {
    ctx.fillStyle = "#a3a3a3";
    ctx.beginPath();
    ctx.moveTo(s * 0.2, s * 0.15);
    ctx.lineTo(s * 0.8, s * 0.5);
    ctx.lineTo(s * 0.2, s * 0.85);
    ctx.closePath();
    ctx.fill();
  },
  skull: (ctx, s) => {
    ctx.fillStyle = "#fafafa";
    const cx = s / 2;
    // Skull top dome
    ctx.beginPath();
    ctx.arc(cx, cx * 0.85, s * 0.35, 0, Math.PI * 2);
    ctx.fill();
    // Jaw
    ctx.fillRect(cx - s * 0.22, cx * 0.85, s * 0.44, s * 0.3);
    // Eyes
    ctx.fillStyle = "#0a0a0a";
    ctx.fillRect(cx - s * 0.2, cx * 0.7, s * 0.14, s * 0.16);
    ctx.fillRect(cx + s * 0.06, cx * 0.7, s * 0.14, s * 0.16);
    // Teeth
    ctx.fillRect(cx - s * 0.12, cx + s * 0.1, s * 0.06, s * 0.12);
    ctx.fillRect(cx + s * 0.06, cx + s * 0.1, s * 0.06, s * 0.12);
    ctx.fillRect(cx - s * 0.03, cx + s * 0.1, s * 0.06, s * 0.12);
  },
  coin: (ctx, s) => {
    ctx.fillStyle = "#FFD700";
    const cx = s / 2;
    ctx.beginPath();
    ctx.arc(cx, cx, s * 0.38, 0, Math.PI * 2);
    ctx.fill();
    // Inner ring
    ctx.fillStyle = "#DAA520";
    ctx.beginPath();
    ctx.arc(cx, cx, s * 0.25, 0, Math.PI * 2);
    ctx.fill();
    // C symbol
    ctx.fillStyle = "#FFE860";
    const t = Math.max(1, Math.round(s * 0.08));
    ctx.fillRect(cx - t, cx - s * 0.15, t * 2, t);
    ctx.fillRect(cx - s * 0.12, cx - s * 0.12, t, s * 0.24);
    ctx.fillRect(cx - t, cx + s * 0.08, t * 2, t);
  },
  clock: (ctx, s) => {
    ctx.fillStyle = "#a3a3a3";
    const cx = s / 2;
    ctx.beginPath();
    ctx.arc(cx, cx, s * 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#0a0a0a";
    ctx.beginPath();
    ctx.arc(cx, cx, s * 0.32, 0, Math.PI * 2);
    ctx.fill();
    // Hands
    ctx.fillStyle = "#fafafa";
    const t = Math.max(1, Math.round(s * 0.08));
    ctx.fillRect(cx - t / 2, cx - s * 0.22, t, s * 0.24); // minute
    ctx.fillRect(cx, cx - t / 2, s * 0.18, t); // hour
    // Center dot
    ctx.fillRect(cx - t / 2, cx - t / 2, t, t);
  },

  // --- Difficulty ---
  "diff-new": (ctx, s) => {
    ctx.fillStyle = "#6B7280";
    const cx = s / 2;
    ctx.beginPath();
    ctx.arc(cx, cx, s * 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#0a0a0a";
    ctx.beginPath();
    ctx.arc(cx, cx, s * 0.15, 0, Math.PI * 2);
    ctx.fill();
  },
  "diff-easy": (ctx, s) => {
    drawDiffDiamond(ctx, s, "#22C55E");
  },
  "diff-medium": (ctx, s) => {
    drawDiffDiamond(ctx, s, "#EAB308");
  },
  "diff-hard": (ctx, s) => {
    drawDiffDiamond(ctx, s, "#F97316");
  },
  "diff-extreme": (ctx, s) => {
    drawDiffDiamond(ctx, s, "#EF4444");
    // Extra inner glow
    ctx.fillStyle = "#FF6666";
    drawDiffDiamond(ctx, s * 0.5, "#FF6666");
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  },

  // --- Actions ---
  search: (ctx, s) => {
    ctx.strokeStyle = "#a3a3a3";
    ctx.lineWidth = Math.max(1, s * 0.12);
    ctx.beginPath();
    ctx.arc(s * 0.4, s * 0.4, s * 0.25, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(s * 0.58, s * 0.58);
    ctx.lineTo(s * 0.82, s * 0.82);
    ctx.stroke();
  },
  sort: (ctx, s) => {
    ctx.fillStyle = "#a3a3a3";
    const t = Math.max(1, Math.round(s * 0.1));
    ctx.fillRect(s * 0.15, s * 0.2, s * 0.7, t);
    ctx.fillRect(s * 0.15, s * 0.42, s * 0.5, t);
    ctx.fillRect(s * 0.15, s * 0.64, s * 0.3, t);
  },
  filter: (ctx, s) => {
    ctx.fillStyle = "#a3a3a3";
    ctx.beginPath();
    ctx.moveTo(s * 0.1, s * 0.15);
    ctx.lineTo(s * 0.9, s * 0.15);
    ctx.lineTo(s * 0.6, s * 0.55);
    ctx.lineTo(s * 0.6, s * 0.85);
    ctx.lineTo(s * 0.4, s * 0.85);
    ctx.lineTo(s * 0.4, s * 0.55);
    ctx.closePath();
    ctx.fill();
  },
  report: (ctx, s) => {
    // Flag on pole
    ctx.fillStyle = "#EF4444";
    ctx.fillRect(s * 0.3, s * 0.1, s * 0.08, s * 0.8);
    ctx.beginPath();
    ctx.moveTo(s * 0.38, s * 0.1);
    ctx.lineTo(s * 0.8, s * 0.25);
    ctx.lineTo(s * 0.38, s * 0.45);
    ctx.closePath();
    ctx.fill();
  },
  close: (ctx, s) => {
    ctx.strokeStyle = "#EF4444";
    ctx.lineWidth = Math.max(1, s * 0.14);
    ctx.lineCap = "butt";
    ctx.beginPath();
    ctx.moveTo(s * 0.2, s * 0.2);
    ctx.lineTo(s * 0.8, s * 0.8);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(s * 0.8, s * 0.2);
    ctx.lineTo(s * 0.2, s * 0.8);
    ctx.stroke();
  },
  check: (ctx, s) => {
    ctx.strokeStyle = "#22C55E";
    ctx.lineWidth = Math.max(1, s * 0.14);
    ctx.lineCap = "butt";
    ctx.beginPath();
    ctx.moveTo(s * 0.15, s * 0.5);
    ctx.lineTo(s * 0.4, s * 0.78);
    ctx.lineTo(s * 0.85, s * 0.22);
    ctx.stroke();
  },
  equip: (ctx, s) => {
    drawers.check(ctx, s);
  },
  delete: (ctx, s) => {
    ctx.fillStyle = "#EF4444";
    // Trash can body
    ctx.fillRect(s * 0.22, s * 0.3, s * 0.56, s * 0.6);
    // Lid
    ctx.fillRect(s * 0.15, s * 0.2, s * 0.7, s * 0.1);
    // Handle
    ctx.fillRect(s * 0.38, s * 0.1, s * 0.24, s * 0.1);
    // Lines
    ctx.fillStyle = "#0a0a0a";
    ctx.fillRect(s * 0.35, s * 0.42, s * 0.06, s * 0.38);
    ctx.fillRect(s * 0.47, s * 0.42, s * 0.06, s * 0.38);
    ctx.fillRect(s * 0.59, s * 0.42, s * 0.06, s * 0.38);
  },
  dismiss: (ctx, s) => {
    drawers.check(ctx, s);
  },

  // --- Featured ---
  star: (ctx, s) => {
    drawStar(ctx, s, "#FFD700", false);
  },
  "star-filled": (ctx, s) => {
    drawStar(ctx, s, "#FFD700", true);
  },
  "dev-pick": (ctx, s) => {
    // Pink ribbon badge
    ctx.fillStyle = "#FF69B4";
    const cx = s / 2;
    // Shield shape
    ctx.beginPath();
    ctx.moveTo(cx, s * 0.05);
    ctx.lineTo(s * 0.85, s * 0.2);
    ctx.lineTo(s * 0.85, s * 0.6);
    ctx.lineTo(cx, s * 0.9);
    ctx.lineTo(s * 0.15, s * 0.6);
    ctx.lineTo(s * 0.15, s * 0.2);
    ctx.closePath();
    ctx.fill();
    // Inner star
    ctx.fillStyle = "#FFF";
    drawStar(ctx, s * 0.4, "#FFF", true);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  },
  ribbon: (ctx, s) => {
    ctx.fillStyle = "#FFD700";
    ctx.beginPath();
    ctx.moveTo(s * 0.25, s * 0.05);
    ctx.lineTo(s * 0.75, s * 0.05);
    ctx.lineTo(s * 0.75, s * 0.7);
    ctx.lineTo(s * 0.5, s * 0.55);
    ctx.lineTo(s * 0.25, s * 0.7);
    ctx.closePath();
    ctx.fill();
  },

  // --- Misc ---
  lock: (ctx, s) => {
    ctx.fillStyle = "#a3a3a3";
    // Shackle
    ctx.strokeStyle = "#a3a3a3";
    ctx.lineWidth = Math.max(1, s * 0.1);
    ctx.beginPath();
    ctx.arc(s / 2, s * 0.35, s * 0.18, Math.PI, 0);
    ctx.stroke();
    // Body
    ctx.fillRect(s * 0.22, s * 0.4, s * 0.56, s * 0.48);
    // Keyhole
    ctx.fillStyle = "#0a0a0a";
    ctx.beginPath();
    ctx.arc(s / 2, s * 0.56, s * 0.08, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(s * 0.46, s * 0.56, s * 0.08, s * 0.18);
  },
  "sound-on": (ctx, s) => {
    ctx.fillStyle = "#fafafa";
    // Speaker body
    ctx.fillRect(s * 0.15, s * 0.35, s * 0.2, s * 0.3);
    ctx.beginPath();
    ctx.moveTo(s * 0.35, s * 0.25);
    ctx.lineTo(s * 0.55, s * 0.15);
    ctx.lineTo(s * 0.55, s * 0.85);
    ctx.lineTo(s * 0.35, s * 0.75);
    ctx.closePath();
    ctx.fill();
    // Sound waves
    ctx.strokeStyle = "#fafafa";
    ctx.lineWidth = Math.max(1, s * 0.07);
    ctx.beginPath();
    ctx.arc(s * 0.6, s / 2, s * 0.12, -Math.PI / 3, Math.PI / 3);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(s * 0.6, s / 2, s * 0.24, -Math.PI / 3, Math.PI / 3);
    ctx.stroke();
  },
  "sound-off": (ctx, s) => {
    ctx.fillStyle = "#666";
    ctx.fillRect(s * 0.15, s * 0.35, s * 0.2, s * 0.3);
    ctx.beginPath();
    ctx.moveTo(s * 0.35, s * 0.25);
    ctx.lineTo(s * 0.55, s * 0.15);
    ctx.lineTo(s * 0.55, s * 0.85);
    ctx.lineTo(s * 0.35, s * 0.75);
    ctx.closePath();
    ctx.fill();
    // X mark
    ctx.strokeStyle = "#EF4444";
    ctx.lineWidth = Math.max(1, s * 0.08);
    ctx.beginPath();
    ctx.moveTo(s * 0.62, s * 0.3);
    ctx.lineTo(s * 0.88, s * 0.7);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(s * 0.88, s * 0.3);
    ctx.lineTo(s * 0.62, s * 0.7);
    ctx.stroke();
  },
  logout: (ctx, s) => {
    ctx.fillStyle = "#EF4444";
    // Door
    ctx.fillRect(s * 0.1, s * 0.15, s * 0.4, s * 0.7);
    ctx.fillStyle = "#0a0a0a";
    ctx.fillRect(s * 0.15, s * 0.2, s * 0.3, s * 0.6);
    // Arrow out
    ctx.fillStyle = "#EF4444";
    const t = Math.max(1, Math.round(s * 0.1));
    ctx.fillRect(s * 0.4, s / 2 - t / 2, s * 0.35, t);
    ctx.beginPath();
    ctx.moveTo(s * 0.7, s * 0.3);
    ctx.lineTo(s * 0.9, s * 0.5);
    ctx.lineTo(s * 0.7, s * 0.7);
    ctx.closePath();
    ctx.fill();
  },
  "arrow-up": (ctx, s) => {
    ctx.fillStyle = "#fafafa";
    ctx.beginPath();
    ctx.moveTo(s * 0.5, s * 0.15);
    ctx.lineTo(s * 0.82, s * 0.6);
    ctx.lineTo(s * 0.18, s * 0.6);
    ctx.closePath();
    ctx.fill();
    ctx.fillRect(s * 0.35, s * 0.6, s * 0.3, s * 0.25);
  },
  "arrow-down": (ctx, s) => {
    ctx.fillStyle = "#fafafa";
    ctx.fillRect(s * 0.35, s * 0.15, s * 0.3, s * 0.25);
    ctx.beginPath();
    ctx.moveTo(s * 0.5, s * 0.85);
    ctx.lineTo(s * 0.82, s * 0.4);
    ctx.lineTo(s * 0.18, s * 0.4);
    ctx.closePath();
    ctx.fill();
  },
  "arrow-left": (ctx, s) => {
    ctx.fillStyle = "#fafafa";
    ctx.beginPath();
    ctx.moveTo(s * 0.15, s * 0.5);
    ctx.lineTo(s * 0.6, s * 0.18);
    ctx.lineTo(s * 0.6, s * 0.82);
    ctx.closePath();
    ctx.fill();
    ctx.fillRect(s * 0.6, s * 0.35, s * 0.25, s * 0.3);
  },
  "arrow-right": (ctx, s) => {
    ctx.fillStyle = "#fafafa";
    ctx.fillRect(s * 0.15, s * 0.35, s * 0.25, s * 0.3);
    ctx.beginPath();
    ctx.moveTo(s * 0.85, s * 0.5);
    ctx.lineTo(s * 0.4, s * 0.18);
    ctx.lineTo(s * 0.4, s * 0.82);
    ctx.closePath();
    ctx.fill();
  },
  cat: (ctx, s) => {
    ctx.fillStyle = "#FF8C00";
    const cx = s / 2;
    // Head
    ctx.fillRect(cx - s * 0.28, s * 0.18, s * 0.56, s * 0.45);
    // Ears
    ctx.beginPath();
    ctx.moveTo(cx - s * 0.28, s * 0.35);
    ctx.lineTo(cx - s * 0.2, s * 0.05);
    ctx.lineTo(cx - s * 0.06, s * 0.18);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(cx + s * 0.28, s * 0.35);
    ctx.lineTo(cx + s * 0.2, s * 0.05);
    ctx.lineTo(cx + s * 0.06, s * 0.18);
    ctx.closePath();
    ctx.fill();
    // Ear inner
    ctx.fillStyle = "#FFB6C1";
    ctx.beginPath();
    ctx.moveTo(cx - s * 0.22, s * 0.32);
    ctx.lineTo(cx - s * 0.18, s * 0.12);
    ctx.lineTo(cx - s * 0.1, s * 0.22);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(cx + s * 0.22, s * 0.32);
    ctx.lineTo(cx + s * 0.18, s * 0.12);
    ctx.lineTo(cx + s * 0.1, s * 0.22);
    ctx.closePath();
    ctx.fill();
    // Eyes
    ctx.fillStyle = "#000";
    ctx.fillRect(cx - s * 0.18, s * 0.3, s * 0.1, s * 0.12);
    ctx.fillRect(cx + s * 0.08, s * 0.3, s * 0.1, s * 0.12);
    // Eye pupils
    ctx.fillStyle = "#FFF";
    ctx.fillRect(cx - s * 0.14, s * 0.32, s * 0.05, s * 0.06);
    ctx.fillRect(cx + s * 0.12, s * 0.32, s * 0.05, s * 0.06);
    // Nose
    ctx.fillStyle = "#FF8FA0";
    ctx.fillRect(cx - s * 0.04, s * 0.44, s * 0.08, s * 0.05);
    // Body
    ctx.fillStyle = "#FF8C00";
    ctx.fillRect(cx - s * 0.2, s * 0.6, s * 0.4, s * 0.32);
    // Belly
    ctx.fillStyle = "#FFF";
    ctx.fillRect(cx - s * 0.1, s * 0.65, s * 0.2, s * 0.2);
  },
  flag: (ctx, s) => {
    // Pole
    ctx.fillStyle = "#888";
    ctx.fillRect(s * 0.44, s * 0.05, s * 0.12, s * 0.9);
    // Flag
    ctx.fillStyle = "#22C55E";
    ctx.beginPath();
    ctx.moveTo(s * 0.56, s * 0.08);
    ctx.lineTo(s * 0.9, s * 0.2);
    ctx.lineTo(s * 0.56, s * 0.4);
    ctx.closePath();
    ctx.fill();
    // Highlight
    ctx.fillStyle = "#38CC38";
    ctx.beginPath();
    ctx.moveTo(s * 0.56, s * 0.08);
    ctx.lineTo(s * 0.76, s * 0.14);
    ctx.lineTo(s * 0.56, s * 0.24);
    ctx.closePath();
    ctx.fill();
  },
  trophy: (ctx, s) => {
    ctx.fillStyle = "#FFD700";
    // Cup body
    ctx.fillRect(s * 0.25, s * 0.1, s * 0.5, s * 0.4);
    // Handles
    ctx.fillRect(s * 0.12, s * 0.15, s * 0.13, s * 0.2);
    ctx.fillRect(s * 0.75, s * 0.15, s * 0.13, s * 0.2);
    ctx.fillStyle = "#0a0a0a";
    ctx.fillRect(s * 0.15, s * 0.2, s * 0.07, s * 0.1);
    ctx.fillRect(s * 0.78, s * 0.2, s * 0.07, s * 0.1);
    // Stem
    ctx.fillStyle = "#FFD700";
    ctx.fillRect(s * 0.42, s * 0.5, s * 0.16, s * 0.2);
    // Base
    ctx.fillRect(s * 0.28, s * 0.7, s * 0.44, s * 0.15);
    // Star
    ctx.fillStyle = "#FFF";
    ctx.fillRect(s * 0.45, s * 0.22, s * 0.1, s * 0.1);
  },
  crown: (ctx, s) => {
    ctx.fillStyle = "#FFD700";
    // Base
    ctx.fillRect(s * 0.12, s * 0.45, s * 0.76, s * 0.35);
    // Points
    ctx.beginPath();
    ctx.moveTo(s * 0.12, s * 0.45);
    ctx.lineTo(s * 0.12, s * 0.15);
    ctx.lineTo(s * 0.3, s * 0.35);
    ctx.lineTo(s * 0.5, s * 0.1);
    ctx.lineTo(s * 0.7, s * 0.35);
    ctx.lineTo(s * 0.88, s * 0.15);
    ctx.lineTo(s * 0.88, s * 0.45);
    ctx.closePath();
    ctx.fill();
    // Gems
    ctx.fillStyle = "#EF4444";
    ctx.fillRect(s * 0.25, s * 0.52, s * 0.1, s * 0.1);
    ctx.fillStyle = "#3B82F6";
    ctx.fillRect(s * 0.45, s * 0.52, s * 0.1, s * 0.1);
    ctx.fillStyle = "#22C55E";
    ctx.fillRect(s * 0.65, s * 0.52, s * 0.1, s * 0.1);
  },
  paint: (ctx, s) => {
    // Palette
    ctx.fillStyle = "#C8763C";
    ctx.beginPath();
    ctx.arc(s * 0.5, s * 0.5, s * 0.38, 0, Math.PI * 2);
    ctx.fill();
    // Color dabs
    ctx.fillStyle = "#EF4444";
    ctx.beginPath();
    ctx.arc(s * 0.35, s * 0.32, s * 0.08, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#3B82F6";
    ctx.beginPath();
    ctx.arc(s * 0.55, s * 0.28, s * 0.07, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#22C55E";
    ctx.beginPath();
    ctx.arc(s * 0.68, s * 0.4, s * 0.07, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#FFD700";
    ctx.beginPath();
    ctx.arc(s * 0.35, s * 0.58, s * 0.07, 0, Math.PI * 2);
    ctx.fill();
    // Thumb hole
    ctx.fillStyle = "#0a0a0a";
    ctx.beginPath();
    ctx.arc(s * 0.55, s * 0.6, s * 0.08, 0, Math.PI * 2);
    ctx.fill();
  },
  sparkle: (ctx, s) => {
    ctx.fillStyle = "#FFD700";
    const cx = s / 2;
    // 4-point star sparkle
    ctx.beginPath();
    ctx.moveTo(cx, s * 0.05);
    ctx.lineTo(cx + s * 0.1, cx - s * 0.1);
    ctx.lineTo(s * 0.95, cx);
    ctx.lineTo(cx + s * 0.1, cx + s * 0.1);
    ctx.lineTo(cx, s * 0.95);
    ctx.lineTo(cx - s * 0.1, cx + s * 0.1);
    ctx.lineTo(s * 0.05, cx);
    ctx.lineTo(cx - s * 0.1, cx - s * 0.1);
    ctx.closePath();
    ctx.fill();
  },
  frame: (ctx, s) => {
    ctx.strokeStyle = "#a78bfa";
    ctx.lineWidth = Math.max(1, s * 0.1);
    ctx.strokeRect(s * 0.12, s * 0.12, s * 0.76, s * 0.76);
    // Inner
    ctx.strokeStyle = "#7c3aed";
    ctx.lineWidth = Math.max(1, s * 0.06);
    ctx.strokeRect(s * 0.22, s * 0.22, s * 0.56, s * 0.56);
  },
  fire: (ctx, s) => {
    const cx = s / 2;
    // Outer flame
    ctx.fillStyle = "#FF4500";
    ctx.beginPath();
    ctx.moveTo(cx, s * 0.05);
    ctx.quadraticCurveTo(s * 0.85, s * 0.35, s * 0.75, s * 0.7);
    ctx.quadraticCurveTo(cx, s * 1.0, s * 0.25, s * 0.7);
    ctx.quadraticCurveTo(s * 0.15, s * 0.35, cx, s * 0.05);
    ctx.fill();
    // Inner flame
    ctx.fillStyle = "#FF8C00";
    ctx.beginPath();
    ctx.moveTo(cx, s * 0.25);
    ctx.quadraticCurveTo(s * 0.7, s * 0.45, s * 0.65, s * 0.7);
    ctx.quadraticCurveTo(cx, s * 0.9, s * 0.35, s * 0.7);
    ctx.quadraticCurveTo(s * 0.3, s * 0.45, cx, s * 0.25);
    ctx.fill();
    // Core
    ctx.fillStyle = "#FFD700";
    ctx.beginPath();
    ctx.moveTo(cx, s * 0.42);
    ctx.quadraticCurveTo(s * 0.6, s * 0.6, s * 0.58, s * 0.72);
    ctx.quadraticCurveTo(cx, s * 0.85, s * 0.42, s * 0.72);
    ctx.quadraticCurveTo(s * 0.4, s * 0.6, cx, s * 0.42);
    ctx.fill();
  },
  ghost: (ctx, s) => {
    ctx.fillStyle = "#AACCFF";
    const cx = s / 2;
    // Body top dome
    ctx.beginPath();
    ctx.arc(cx, s * 0.35, s * 0.3, Math.PI, 0);
    ctx.fill();
    ctx.fillRect(cx - s * 0.3, s * 0.35, s * 0.6, s * 0.4);
    // Wavy bottom
    ctx.beginPath();
    ctx.moveTo(cx - s * 0.3, s * 0.75);
    ctx.lineTo(cx - s * 0.3, s * 0.88);
    ctx.lineTo(cx - s * 0.1, s * 0.78);
    ctx.lineTo(cx + s * 0.1, s * 0.88);
    ctx.lineTo(cx + s * 0.3, s * 0.78);
    ctx.lineTo(cx + s * 0.3, s * 0.75);
    ctx.closePath();
    ctx.fill();
    // Eyes
    ctx.fillStyle = "#000";
    ctx.fillRect(cx - s * 0.16, s * 0.32, s * 0.1, s * 0.12);
    ctx.fillRect(cx + s * 0.06, s * 0.32, s * 0.1, s * 0.12);
  },
  confetti: (ctx, s) => {
    const colors = ["#EF4444", "#FFD700", "#22C55E", "#3B82F6", "#A855F7", "#FF8C00"];
    for (let i = 0; i < 12; i++) {
      ctx.fillStyle = colors[i % colors.length];
      const x = Math.random() * s * 0.8 + s * 0.1;
      const y = Math.random() * s * 0.8 + s * 0.1;
      const w = s * 0.08 + Math.random() * s * 0.06;
      const h = s * 0.06 + Math.random() * s * 0.04;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(Math.random() * Math.PI);
      ctx.fillRect(-w / 2, -h / 2, w, h);
      ctx.restore();
    }
  },
  shatter: (ctx, s) => {
    ctx.fillStyle = "#88DDFF";
    const cx = s / 2;
    // Diamond shards
    const offsets = [
      [0, -0.3], [0.25, -0.1], [0.2, 0.2], [-0.2, 0.2], [-0.25, -0.1],
      [0.1, -0.15], [-0.1, 0.1], [0.15, 0.05],
    ];
    offsets.forEach(([ox, oy]) => {
      ctx.save();
      ctx.translate(cx + ox * s, cx + oy * s);
      ctx.rotate(Math.random() * Math.PI);
      ctx.fillRect(-s * 0.06, -s * 0.08, s * 0.12, s * 0.16);
      ctx.restore();
    });
  },
  bug: (ctx, s) => {
    ctx.fillStyle = "#22C55E";
    const cx = s / 2;
    // Body
    ctx.beginPath();
    ctx.arc(cx, s * 0.55, s * 0.25, 0, Math.PI * 2);
    ctx.fill();
    // Head
    ctx.fillStyle = "#1a8a1a";
    ctx.beginPath();
    ctx.arc(cx, s * 0.25, s * 0.15, 0, Math.PI * 2);
    ctx.fill();
    // Antennae
    ctx.strokeStyle = "#22C55E";
    ctx.lineWidth = Math.max(1, s * 0.05);
    ctx.beginPath();
    ctx.moveTo(cx - s * 0.08, s * 0.15);
    ctx.lineTo(cx - s * 0.22, s * 0.02);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx + s * 0.08, s * 0.15);
    ctx.lineTo(cx + s * 0.22, s * 0.02);
    ctx.stroke();
    // Legs
    ctx.strokeStyle = "#1a8a1a";
    ctx.beginPath();
    ctx.moveTo(cx - s * 0.2, s * 0.45);
    ctx.lineTo(cx - s * 0.38, s * 0.35);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx + s * 0.2, s * 0.45);
    ctx.lineTo(cx + s * 0.38, s * 0.35);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - s * 0.22, s * 0.6);
    ctx.lineTo(cx - s * 0.4, s * 0.65);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx + s * 0.22, s * 0.6);
    ctx.lineTo(cx + s * 0.4, s * 0.65);
    ctx.stroke();
  },
  ban: (ctx, s) => {
    ctx.strokeStyle = "#EF4444";
    ctx.lineWidth = Math.max(1, s * 0.1);
    const cx = s / 2;
    ctx.beginPath();
    ctx.arc(cx, cx, s * 0.36, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(s * 0.24, s * 0.24);
    ctx.lineTo(s * 0.76, s * 0.76);
    ctx.stroke();
  },
  warning: (ctx, s) => {
    ctx.fillStyle = "#EAB308";
    // Triangle
    ctx.beginPath();
    ctx.moveTo(s * 0.5, s * 0.08);
    ctx.lineTo(s * 0.92, s * 0.88);
    ctx.lineTo(s * 0.08, s * 0.88);
    ctx.closePath();
    ctx.fill();
    // Exclamation
    ctx.fillStyle = "#0a0a0a";
    ctx.fillRect(s * 0.44, s * 0.32, s * 0.12, s * 0.3);
    ctx.fillRect(s * 0.44, s * 0.68, s * 0.12, s * 0.12);
  },
  info: (ctx, s) => {
    ctx.fillStyle = "#3B82F6";
    const cx = s / 2;
    ctx.beginPath();
    ctx.arc(cx, cx, s * 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#FFF";
    ctx.fillRect(s * 0.44, s * 0.28, s * 0.12, s * 0.1);
    ctx.fillRect(s * 0.44, s * 0.44, s * 0.12, s * 0.28);
  },
};

// --- Helpers ---
function drawDiffDiamond(ctx: CanvasRenderingContext2D, s: number, color: string) {
  ctx.fillStyle = color;
  const cx = s / 2;
  ctx.beginPath();
  ctx.moveTo(cx, s * 0.1);
  ctx.lineTo(s * 0.9, cx);
  ctx.lineTo(cx, s * 0.9);
  ctx.lineTo(s * 0.1, cx);
  ctx.closePath();
  ctx.fill();
  // Highlight
  ctx.fillStyle = "rgba(255,255,255,0.3)";
  ctx.beginPath();
  ctx.moveTo(cx, s * 0.1);
  ctx.lineTo(s * 0.9, cx);
  ctx.lineTo(cx, cx);
  ctx.lineTo(s * 0.1, cx);
  ctx.closePath();
  ctx.fill();
}

function drawStar(ctx: CanvasRenderingContext2D, s: number, color: string, filled: boolean) {
  const cx = s / 2;
  const outerR = s * 0.42;
  const innerR = s * 0.18;
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const outerAngle = (i * 72 - 90) * (Math.PI / 180);
    const innerAngle = ((i * 72 + 36) - 90) * (Math.PI / 180);
    const ox = cx + Math.cos(outerAngle) * outerR;
    const oy = cx + Math.sin(outerAngle) * outerR;
    const ix = cx + Math.cos(innerAngle) * innerR;
    const iy = cx + Math.sin(innerAngle) * innerR;
    if (i === 0) ctx.moveTo(ox, oy);
    else ctx.lineTo(ox, oy);
    ctx.lineTo(ix, iy);
  }
  ctx.closePath();
  if (filled) {
    ctx.fillStyle = color;
    ctx.fill();
  } else {
    ctx.strokeStyle = color;
    ctx.lineWidth = Math.max(1, s * 0.08);
    ctx.stroke();
  }
}

// ============================================================
// React component
// ============================================================

function PixelIcon({ name, size = 16, color, className }: PixelIconProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Support high-DPI
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, size, size);
    ctx.imageSmoothingEnabled = false;

    const drawFn = drawers[name];
    if (drawFn) {
      drawFn(ctx, size, color);
    }
  }, [name, size, color]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      style={{
        width: size,
        height: size,
        imageRendering: "pixelated",
      }}
      className={className}
      role="img"
      aria-label={name}
    />
  );
}

export { PixelIcon };
export default PixelIcon;
