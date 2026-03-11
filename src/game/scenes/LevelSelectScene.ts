import * as Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT } from "../constants";
import { gameEvents, GAME_EVENTS } from "../events";
import { CAMPAIGN_LEVELS } from "../levels/campaign";

const SAVE_KEY = "trap_architect_progress";

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

export class LevelSelectScene extends Phaser.Scene {
  private progress: Record<number, LevelProgress> = {};
  private selectedIndex = 0;
  private cards: Phaser.GameObjects.Container[] = [];

  constructor() {
    super({ key: "LevelSelectScene" });
  }

  create(): void {
    this.progress = loadProgress();
    this.cameras.main.setBackgroundColor("#0a0a0a");

    // Title
    this.add
      .text(GAME_WIDTH / 2, 40, "SELECIONE A FASE", {
        fontFamily: "monospace",
        fontSize: "24px",
        color: "#ff8c00",
      })
      .setOrigin(0.5);

    // Level cards
    const startX = 60;
    const cardW = 160;
    const cardH = 200;
    const gap = 20;

    CAMPAIGN_LEVELS.forEach((level, i) => {
      const x = startX + i * (cardW + gap);
      const y = 120;

      const isUnlocked = i === 0 || this.progress[i - 1]?.completed;
      const isCompleted = this.progress[i]?.completed;

      const container = this.add.container(x, y);

      // Card background
      const bg = this.add
        .rectangle(0, 0, cardW, cardH, isUnlocked ? 0x222222 : 0x111111)
        .setOrigin(0)
        .setStrokeStyle(2, isCompleted ? 0x44ff44 : isUnlocked ? 0xff8c00 : 0x333333);
      container.add(bg);

      // Level number
      container.add(
        this.add
          .text(cardW / 2, 20, `${i + 1}`, {
            fontFamily: "monospace",
            fontSize: "32px",
            color: isUnlocked ? "#ffffff" : "#555555",
          })
          .setOrigin(0.5)
      );

      // Level name
      container.add(
        this.add
          .text(cardW / 2, 65, level.name, {
            fontFamily: "monospace",
            fontSize: "12px",
            color: isUnlocked ? "#ffffff" : "#555555",
            wordWrap: { width: cardW - 16 },
            align: "center",
          })
          .setOrigin(0.5)
      );

      // Subtitle
      if (level.subtitle) {
        container.add(
          this.add
            .text(cardW / 2, 85, level.subtitle, {
              fontFamily: "monospace",
              fontSize: "10px",
              color: "#a3a3a3",
              wordWrap: { width: cardW - 16 },
              align: "center",
            })
            .setOrigin(0.5)
        );
      }

      // Stats
      if (isCompleted) {
        const prog = this.progress[i]!;
        container.add(
          this.add
            .text(cardW / 2, 120, `💀 ${prog.bestDeaths}  🪙 ${prog.bestCoins}`, {
              fontFamily: "monospace",
              fontSize: "11px",
              color: "#44ff44",
            })
            .setOrigin(0.5)
        );

        container.add(
          this.add
            .text(cardW / 2, 140, "✅ COMPLETA", {
              fontFamily: "monospace",
              fontSize: "11px",
              color: "#44ff44",
            })
            .setOrigin(0.5)
        );
      } else if (!isUnlocked) {
        container.add(
          this.add
            .text(cardW / 2, 120, "🔒", {
              fontFamily: "monospace",
              fontSize: "24px",
            })
            .setOrigin(0.5)
        );
      }

      // Interactive
      if (isUnlocked) {
        bg.setInteractive({ useHandCursor: true });
        bg.on("pointerover", () => bg.setFillStyle(0x333333));
        bg.on("pointerout", () => bg.setFillStyle(0x222222));
        bg.on("pointerdown", () => {
          this.startLevel(i);
        });
      }

      this.cards.push(container);
    });

    // Helper text
    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 60, "Clique em uma fase para jogar", {
        fontFamily: "monospace",
        fontSize: "12px",
        color: "#555555",
      })
      .setOrigin(0.5);

    // Back button
    const backBtn = this.add
      .text(40, GAME_HEIGHT - 40, "← Menu", {
        fontFamily: "monospace",
        fontSize: "14px",
        color: "#a3a3a3",
      })
      .setInteractive({ useHandCursor: true });

    backBtn.on("pointerover", () => backBtn.setColor("#ffffff"));
    backBtn.on("pointerout", () => backBtn.setColor("#a3a3a3"));
    backBtn.on("pointerdown", () => this.scene.start("MenuScene"));

    // Listen for level completion to update progress
    gameEvents.on(GAME_EVENTS.LEVEL_COMPLETE, (data: unknown) => {
      const d = data as { levelIndex: number; deaths: number; coins: number };
      this.recordCompletion(d.levelIndex, d.deaths, d.coins);
    });

    // ESC to go back
    if (this.input.keyboard) {
      this.input.keyboard.on("keydown-ESC", () => {
        this.scene.start("MenuScene");
      });
    }
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
  }
}
