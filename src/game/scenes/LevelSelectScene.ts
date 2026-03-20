import * as Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT } from "../constants";
import { gameEvents, GAME_EVENTS } from "../events";
import { CAMPAIGN_LEVELS } from "../levels/campaign";
import { playBGM } from "../audio";
import { gt } from "@/i18n/game";

const SAVE_KEY = "trap_architect_progress";

// --- Palette ---
const COL = {
  bg: 0x08080f,
  cardUnlocked: 0x161625,
  cardCompleted: 0x0d1f18,
  cardLocked: 0x0c0c14,
  borderCompleted: 0x22c55e,
  borderUnlocked: 0xff8c00,
  borderLocked: 0x222233,
  accent: 0xff8c00,
  accentHex: "#ff8c00",
  complete: 0x22c55e,
  completeHex: "#22c55e",
  textPrimary: "#e2e2e8",
  textDim: "#6b6b80",
  textMuted: "#3a3a4d",
  numberCircle: 0x1e1e32,
  numberCircleComplete: 0x143d24,
  numberCircleLocked: 0x111118,
  hoverFill: 0x1f1f36,
  progressBg: 0x111120,
  progressFill: 0x22c55e,
  skull: "#ef4444",
  coin: "#facc15",
};

interface LevelProgress {
  completed: boolean;
  bestDeaths: number;
  bestCoins: number;
}

function loadProgress(): Record<number, LevelProgress> {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveProgress(progress: Record<number, LevelProgress>): void {
  localStorage.setItem(SAVE_KEY, JSON.stringify(progress));
}

/** Draw a rounded-rect on a Graphics object */
function roundRect(
  gfx: Phaser.GameObjects.Graphics,
  x: number, y: number, w: number, h: number, r: number,
  fill: number, strokeColor?: number, strokeWidth = 1.5,
): void {
  gfx.fillStyle(fill, 1);
  gfx.fillRoundedRect(x, y, w, h, r);
  if (strokeColor !== undefined) {
    gfx.lineStyle(strokeWidth, strokeColor, 0.9);
    gfx.strokeRoundedRect(x, y, w, h, r);
  }
}

// ── Scroll layout constants ──
const HEADER_H = 76; // title + progress bar
const FOOTER_H = 46; // back button + hint
const VIEWPORT_TOP = HEADER_H;
const VIEWPORT_H = GAME_HEIGHT - HEADER_H - FOOTER_H;
const SCROLL_SPEED = 30;
const SCROLL_EASE = 0.15; // lerp factor for smooth scrolling
const FADE_H = 28; // height of top/bottom fade overlays

export class LevelSelectScene extends Phaser.Scene {
  private progress: Record<number, LevelProgress> = {};
  private selectedIndex = 0;
  private cards: Phaser.GameObjects.Container[] = [];
  private cardGraphics: Phaser.GameObjects.Graphics[] = [];
  private scrollContainer!: Phaser.GameObjects.Container;
  private scrollY = 0; // target scroll
  private currentScrollY = 0; // smoothed
  private maxScroll = 0;
  private scrollThumbGfx!: Phaser.GameObjects.Graphics;
  private fadeTopGfx!: Phaser.GameObjects.Graphics;
  private fadeBotGfx!: Phaser.GameObjects.Graphics;
  private isDragging = false;
  private dragStartY = 0;
  private dragScrollStart = 0;

  constructor() {
    super({ key: "LevelSelectScene" });
  }

  create(): void {
    this.progress = loadProgress();
    this.cameras.main.setBackgroundColor(COL.bg);
    playBGM("menu");

    // ── Floating particles background ──
    this.createParticles();

    // ── Title ──
    const titleY = 26;
    this.add
      .text(GAME_WIDTH / 2, titleY, gt("game.selectLevel"), {
        fontFamily: "monospace",
        fontSize: "20px",
        color: COL.accentHex,
        shadow: { offsetX: 0, offsetY: 0, color: "#ff8c0066", blur: 12, fill: true },
      })
      .setOrigin(0.5);

    // Decorative line under title
    const lineGfx = this.add.graphics();
    const lineW = 240;
    lineGfx.fillStyle(COL.accent, 0.35);
    lineGfx.fillRect(GAME_WIDTH / 2 - lineW / 2, titleY + 14, lineW, 1);
    lineGfx.fillStyle(COL.accent, 0.7);
    lineGfx.fillRect(GAME_WIDTH / 2 - 40, titleY + 14, 80, 1);

    // ── Progress bar ──
    const completedCount = Object.values(this.progress).filter((p) => p.completed).length;
    const totalLevels = CAMPAIGN_LEVELS.length;
    this.createProgressBar(completedCount, totalLevels, titleY + 26);

    // ── Scrollable card area ──
    const cols = 5;
    const cardW = 120;
    const cardH = 130;
    const gapX = 18;
    const gapY = 16;
    const gridW = cols * cardW + (cols - 1) * gapX;
    const gridStartX = (GAME_WIDTH - gridW) / 2;

    const totalRows = Math.ceil(CAMPAIGN_LEVELS.length / cols);
    const contentH = totalRows * cardH + (totalRows - 1) * gapY + 12; // 12 = bottom padding
    this.maxScroll = Math.max(0, contentH - VIEWPORT_H);

    // Container that holds all cards — will be translated for scrolling
    this.scrollContainer = this.add.container(0, VIEWPORT_TOP);

    CAMPAIGN_LEVELS.forEach((level, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = gridStartX + col * (cardW + gapX);
      const y = row * (cardH + gapY);

      const isUnlocked = i === 0 || this.progress[i - 1]?.completed;
      const isCompleted = this.progress[i]?.completed;

      const container = this.add.container(x, y);

      // Card background (Graphics for rounded rect)
      const cardGfx = this.add.graphics();
      const fillColor = isCompleted ? COL.cardCompleted : isUnlocked ? COL.cardUnlocked : COL.cardLocked;
      const borderColor = isCompleted ? COL.borderCompleted : isUnlocked ? COL.borderUnlocked : COL.borderLocked;
      roundRect(cardGfx, 0, 0, cardW, cardH, 8, fillColor, borderColor);
      container.add(cardGfx);
      this.cardGraphics.push(cardGfx);

      // Number circle
      const circleGfx = this.add.graphics();
      const circleR = 15;
      const cx = cardW / 2;
      const cy = 20;
      const circleFill = isCompleted ? COL.numberCircleComplete : isUnlocked ? COL.numberCircle : COL.numberCircleLocked;
      circleGfx.fillStyle(circleFill, 1);
      circleGfx.fillCircle(cx, cy, circleR);
      if (isCompleted) {
        circleGfx.lineStyle(1.5, COL.borderCompleted, 0.6);
        circleGfx.strokeCircle(cx, cy, circleR);
      } else if (isUnlocked) {
        circleGfx.lineStyle(1.5, COL.accent, 0.4);
        circleGfx.strokeCircle(cx, cy, circleR);
      }
      container.add(circleGfx);

      // Level number text
      const numColor = isCompleted ? COL.completeHex : isUnlocked ? "#ffffff" : COL.textDim;
      container.add(
        this.add
          .text(cx, cy, `${i + 1}`, {
            fontFamily: "monospace",
            fontSize: "15px",
            color: numColor,
            fontStyle: "bold",
          })
          .setOrigin(0.5),
      );

      // Level name
      container.add(
        this.add
          .text(cx, 46, gt(`campaign.levels.${i}.name`), {
            fontFamily: "monospace",
            fontSize: "10px",
            color: isUnlocked ? COL.textPrimary : COL.textDim,
            wordWrap: { width: cardW - 16 },
            align: "center",
          })
          .setOrigin(0.5),
      );

      // Subtitle
      if (level.subtitle) {
        container.add(
          this.add
            .text(cx, 60, gt(`campaign.levels.${i}.subtitle`), {
              fontFamily: "monospace",
              fontSize: "8px",
              color: isUnlocked ? "#8888a0" : COL.textMuted,
              wordWrap: { width: cardW - 16 },
              align: "center",
            })
            .setOrigin(0.5),
        );
      }

      // Status area
      if (isCompleted) {
        const prog = this.progress[i]!;
        const deaths = prog.bestDeaths ?? 0;
        const coins = prog.bestCoins ?? 0;

        // Stats row (side by side)
        container.add(
          this.add
            .text(cx - 18, 82, `\u2620 ${deaths}`, {
              fontFamily: "monospace",
              fontSize: "9px",
              color: COL.skull,
            })
            .setOrigin(0.5),
        );
        container.add(
          this.add
            .text(cx + 18, 82, `\u25C9 ${coins}`, {
              fontFamily: "monospace",
              fontSize: "9px",
              color: COL.coin,
            })
            .setOrigin(0.5),
        );

        // Completed badge
        container.add(
          this.add
            .text(cx, 100, gt("game.levelSelect.completed"), {
              fontFamily: "monospace",
              fontSize: "8px",
              color: COL.completeHex,
            })
            .setOrigin(0.5),
        );
      } else if (!isUnlocked) {
        // Lock icon
        const lockGfx = this.add.graphics();
        const lx = cx;
        const ly = 86;
        lockGfx.fillStyle(0x333344, 0.8);
        lockGfx.fillRoundedRect(lx - 9, ly, 18, 14, 3);
        lockGfx.lineStyle(2.5, 0x333344, 0.8);
        lockGfx.beginPath();
        lockGfx.arc(lx, ly, 7, Math.PI, 0, false);
        lockGfx.strokePath();
        container.add(lockGfx);
      } else {
        // Unlocked but not completed
        container.add(
          this.add
            .text(cx, 92, gt("game.play"), {
              fontFamily: "monospace",
              fontSize: "9px",
              color: COL.accentHex,
            })
            .setOrigin(0.5)
            .setAlpha(0.6),
        );
      }

      // Interactive area
      if (isUnlocked) {
        const hitZone = this.add
          .rectangle(0, 0, cardW, cardH)
          .setOrigin(0)
          .setInteractive({ useHandCursor: true })
          .setAlpha(0.001);
        container.add(hitZone);

        hitZone.on("pointerover", () => {
          cardGfx.clear();
          roundRect(
            cardGfx, 0, 0, cardW, cardH, 8,
            COL.hoverFill,
            isCompleted ? COL.borderCompleted : COL.accent,
            2.5,
          );
          this.tweens.add({
            targets: container,
            scaleX: 1.06,
            scaleY: 1.06,
            duration: 120,
            ease: "Back.easeOut",
          });
        });
        hitZone.on("pointerout", () => {
          cardGfx.clear();
          roundRect(cardGfx, 0, 0, cardW, cardH, 8, fillColor, borderColor);
          this.tweens.add({
            targets: container,
            scaleX: 1,
            scaleY: 1,
            duration: 120,
            ease: "Quad.easeOut",
          });
        });
        hitZone.on("pointerdown", () => {
          this.tweens.add({
            targets: container,
            scaleX: 0.95,
            scaleY: 0.95,
            duration: 60,
            yoyo: true,
            ease: "Quad.easeIn",
            onComplete: () => this.startLevel(i),
          });
        });
      }

      // Entrance animation
      container.setAlpha(0);
      container.setScale(0.85);
      this.tweens.add({
        targets: container,
        alpha: 1,
        scaleX: 1,
        scaleY: 1,
        duration: 300,
        delay: i * 50,
        ease: "Back.easeOut",
      });

      this.scrollContainer.add(container);
      this.cards.push(container);
    });

    // ── Mask to clip scrollable area ──
    const maskShape = this.make.graphics({ x: 0, y: 0 });
    maskShape.fillStyle(0xffffff);
    maskShape.fillRect(0, VIEWPORT_TOP, GAME_WIDTH, VIEWPORT_H);
    const mask = maskShape.createGeometryMask();
    this.scrollContainer.setMask(mask);

    // ── Fade overlays (drawn on top to blend edges) ──
    this.fadeTopGfx = this.add.graphics().setDepth(10);
    this.fadeBotGfx = this.add.graphics().setDepth(10);
    this.drawFadeOverlays();

    // ── Scroll bar track + thumb ──
    if (this.maxScroll > 0) {
      const trackGfx = this.add.graphics().setDepth(10);
      const trackX = GAME_WIDTH - 14;
      const trackH = VIEWPORT_H - 16;
      const trackY = VIEWPORT_TOP + 8;
      trackGfx.fillStyle(0x111120, 0.5);
      trackGfx.fillRoundedRect(trackX, trackY, 4, trackH, 2);

      this.scrollThumbGfx = this.add.graphics().setDepth(10);
      this.updateScrollThumb();
    }

    // ── Scroll input (mouse wheel) ──
    this.input.on("wheel", (_pointer: Phaser.Input.Pointer, _go: unknown, _dx: number, dy: number) => {
      this.scrollY = Phaser.Math.Clamp(this.scrollY + dy * 0.5, 0, this.maxScroll);
    });

    // ── Drag-to-scroll ──
    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      if (pointer.y >= VIEWPORT_TOP && pointer.y <= VIEWPORT_TOP + VIEWPORT_H) {
        this.isDragging = true;
        this.dragStartY = pointer.y;
        this.dragScrollStart = this.scrollY;
      }
    });
    this.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
      if (this.isDragging && pointer.isDown) {
        const delta = this.dragStartY - pointer.y;
        this.scrollY = Phaser.Math.Clamp(this.dragScrollStart + delta, 0, this.maxScroll);
      }
    });
    this.input.on("pointerup", () => { this.isDragging = false; });

    // ── Header background (solid, covers scroll behind it) ──
    const headerBg = this.add.graphics().setDepth(9);
    headerBg.fillStyle(COL.bg, 1);
    headerBg.fillRect(0, 0, GAME_WIDTH, VIEWPORT_TOP);

    // ── Footer background (solid) ──
    const footerBg = this.add.graphics().setDepth(9);
    footerBg.fillStyle(COL.bg, 1);
    footerBg.fillRect(0, GAME_HEIGHT - FOOTER_H, GAME_WIDTH, FOOTER_H);

    // ── Back button (styled) ──
    const backContainer = this.add.container(36, GAME_HEIGHT - 38).setDepth(11);
    const backGfx = this.add.graphics();
    roundRect(backGfx, 0, 0, 90, 28, 6, 0x161625, 0x333344);
    backContainer.add(backGfx);
    const backText = this.add
      .text(45, 14, gt("game.levelSelect.backMenu"), {
        fontFamily: "monospace",
        fontSize: "11px",
        color: "#8888a0",
      })
      .setOrigin(0.5);
    backContainer.add(backText);
    const backHit = this.add
      .rectangle(0, 0, 90, 28)
      .setOrigin(0)
      .setInteractive({ useHandCursor: true })
      .setAlpha(0.001);
    backContainer.add(backHit);
    backHit.on("pointerover", () => {
      backGfx.clear();
      roundRect(backGfx, 0, 0, 90, 28, 6, COL.hoverFill, COL.accent);
      backText.setColor("#ffffff");
    });
    backHit.on("pointerout", () => {
      backGfx.clear();
      roundRect(backGfx, 0, 0, 90, 28, 6, 0x161625, 0x333344);
      backText.setColor("#8888a0");
    });
    backHit.on("pointerdown", () => {
      if (this.registry.get("startScene")) {
        gameEvents.emit(GAME_EVENTS.RETURN_TO_LOBBY);
      } else {
        this.scene.start("MenuScene");
      }
    });

    // ── Hint text (bottom center) ──
    const hintParts = this.maxScroll > 0
      ? gt("game.levelSelect.hintScroll")
      : gt("game.levelSelect.hintNoScroll");
    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 12, hintParts, {
        fontFamily: "monospace",
        fontSize: "8px",
        color: COL.textMuted,
      })
      .setOrigin(0.5)
      .setDepth(11);

    // ── Events ──
    gameEvents.on(GAME_EVENTS.LEVEL_COMPLETE, (data: unknown) => {
      const d = data as { levelIndex: number; deaths: number; coins: number };
      this.recordCompletion(d.levelIndex, d.deaths, d.coins);
    });

    if (this.input.keyboard) {
      this.input.keyboard.on("keydown-ESC", () => {
        if (this.registry.get("startScene")) {
          gameEvents.emit(GAME_EVENTS.RETURN_TO_LOBBY);
        } else {
          this.scene.start("MenuScene");
        }
      });
    }
  }

  update(): void {
    // Smooth scrolling via lerp
    if (this.maxScroll > 0) {
      this.currentScrollY += (this.scrollY - this.currentScrollY) * SCROLL_EASE;
      // Snap when close enough
      if (Math.abs(this.scrollY - this.currentScrollY) < 0.5) {
        this.currentScrollY = this.scrollY;
      }
      this.scrollContainer.y = VIEWPORT_TOP - this.currentScrollY;
      this.updateScrollThumb();
      this.drawFadeOverlays();
    }
  }

  /** Update scrollbar thumb position and size */
  private updateScrollThumb(): void {
    if (!this.scrollThumbGfx || this.maxScroll <= 0) return;
    this.scrollThumbGfx.clear();

    const trackX = GAME_WIDTH - 14;
    const trackH = VIEWPORT_H - 16;
    const trackY = VIEWPORT_TOP + 8;

    const viewRatio = VIEWPORT_H / (VIEWPORT_H + this.maxScroll);
    const thumbH = Math.max(20, trackH * viewRatio);
    const scrollRatio = this.maxScroll > 0 ? this.currentScrollY / this.maxScroll : 0;
    const thumbY = trackY + scrollRatio * (trackH - thumbH);

    this.scrollThumbGfx.fillStyle(COL.accent, 0.5);
    this.scrollThumbGfx.fillRoundedRect(trackX, thumbY, 4, thumbH, 2);
  }

  /** Draw fade gradients at top and bottom of scroll viewport */
  private drawFadeOverlays(): void {
    this.fadeTopGfx.clear();
    this.fadeBotGfx.clear();

    // Top fade (visible when scrolled down)
    const topAlpha = Math.min(this.currentScrollY / 40, 1);
    if (topAlpha > 0.01) {
      for (let i = 0; i < FADE_H; i++) {
        const a = topAlpha * (1 - i / FADE_H) * 0.9;
        this.fadeTopGfx.fillStyle(COL.bg, a);
        this.fadeTopGfx.fillRect(0, VIEWPORT_TOP + i, GAME_WIDTH, 1);
      }
    }

    // Bottom fade (visible when not at bottom)
    const remaining = this.maxScroll - this.currentScrollY;
    const botAlpha = Math.min(remaining / 40, 1);
    if (botAlpha > 0.01) {
      for (let i = 0; i < FADE_H; i++) {
        const a = botAlpha * (i / FADE_H) * 0.9;
        this.fadeBotGfx.fillStyle(COL.bg, a);
        this.fadeBotGfx.fillRect(0, VIEWPORT_TOP + VIEWPORT_H - FADE_H + i, GAME_WIDTH, 1);
      }
    }
  }

  /** Animated floating particles for atmosphere */
  private createParticles(): void {
    const count = 30;
    for (let i = 0; i < count; i++) {
      const px = Phaser.Math.Between(0, GAME_WIDTH);
      const py = Phaser.Math.Between(0, GAME_HEIGHT);
      const size = Phaser.Math.FloatBetween(1, 2.5);
      const alpha = Phaser.Math.FloatBetween(0.05, 0.15);

      const dot = this.add.circle(px, py, size, 0xff8c00, alpha);
      this.tweens.add({
        targets: dot,
        y: py - Phaser.Math.Between(30, 80),
        alpha: { from: alpha, to: 0 },
        duration: Phaser.Math.Between(4000, 8000),
        repeat: -1,
        delay: Phaser.Math.Between(0, 3000),
        onRepeat: () => {
          dot.setPosition(Phaser.Math.Between(0, GAME_WIDTH), GAME_HEIGHT + 10);
          dot.setAlpha(alpha);
        },
      });
    }
  }

  /** Campaign progress bar with percentage */
  private createProgressBar(completed: number, total: number, y: number): void {
    const barW = 200;
    const barH = 6;
    const bx = GAME_WIDTH / 2 - barW / 2;

    const gfx = this.add.graphics();
    gfx.fillStyle(COL.progressBg, 1);
    gfx.fillRoundedRect(bx, y, barW, barH, 3);
    const fillW = (completed / total) * barW;
    if (fillW > 0) {
      gfx.fillStyle(COL.progressFill, 0.85);
      gfx.fillRoundedRect(bx, y, Math.max(fillW, 6), barH, 3);
    }

    const pct = Math.round((completed / total) * 100);
    this.add
      .text(GAME_WIDTH / 2 + barW / 2 + 12, y + barH / 2, `${pct}%`, {
        fontFamily: "monospace",
        fontSize: "9px",
        color: completed === total ? COL.completeHex : "#6b6b80",
      })
      .setOrigin(0, 0.5);

    this.add
      .text(GAME_WIDTH / 2 - barW / 2 - 12, y + barH / 2, `${completed}/${total}`, {
        fontFamily: "monospace",
        fontSize: "9px",
        color: "#6b6b80",
      })
      .setOrigin(1, 0.5);
  }

  private startLevel(index: number): void {
    this.scene.start("GameScene", { levelIndex: index });
  }

  private recordCompletion(levelIndex: number, deaths: number, coins: number): void {
    const existing = this.progress[levelIndex];
    if (!existing || !existing.completed) {
      this.progress[levelIndex] = { completed: true, bestDeaths: deaths, bestCoins: coins };
    } else {
      if (deaths < existing.bestDeaths) existing.bestDeaths = deaths;
      if (coins > existing.bestCoins) existing.bestCoins = coins;
    }
    saveProgress(this.progress);

    // Fire-and-forget cloud sync
    syncProgressToCloud(this.progress);
  }
}

/** Push campaign progress to DB (async, non-blocking) */
function syncProgressToCloud(progress: Record<number, LevelProgress>): void {
  const dbProgress: Record<string, { completed: boolean; deaths: number; coins: number }> = {};
  let allCompleted = true;
  for (let i = 0; i < 10; i++) {
    const p = progress[i];
    if (p) {
      dbProgress[String(i)] = {
        completed: p.completed,
        deaths: p.bestDeaths ?? 0,
        coins: p.bestCoins ?? 0,
      };
      if (!p.completed) allCompleted = false;
    } else {
      allCompleted = false;
    }
  }

  fetch("/api/profile", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      campaign_progress: dbProgress,
      ...(allCompleted ? { campaign_completed: true } : {}),
    }),
  }).catch(() => { /* offline — will sync on next login */ });
}
