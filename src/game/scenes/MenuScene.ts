import * as Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT } from "../constants";
import { gameEvents, GAME_EVENTS } from "../events";
import { playBGM } from "../audio";

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: "MenuScene" });
  }

  create(): void {
    this.cameras.main.setBackgroundColor("#0a0a0a");
    playBGM("menu");

    // Title
    this.add
      .text(GAME_WIDTH / 2, 100, "🐱 Trap Architect", {
        fontFamily: "monospace",
        fontSize: "36px",
        color: "#ff8c00",
      })
      .setOrigin(0.5);

    // Subtitle
    this.add
      .text(GAME_WIDTH / 2, 150, "Plataformas impossíveis feitas pela comunidade", {
        fontFamily: "monospace",
        fontSize: "14px",
        color: "#a3a3a3",
      })
      .setOrigin(0.5);

    // Animated cat
    const cat = this.add.image(GAME_WIDTH / 2, 230, "player").setScale(4);
    this.tweens.add({
      targets: cat,
      y: 220,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    // Play button — goes to Level Select
    const playBtn = this.add
      .text(GAME_WIDTH / 2, 310, "▶  JOGAR", {
        fontFamily: "monospace",
        fontSize: "20px",
        color: "#ffffff",
        backgroundColor: "#ff8c00",
        padding: { x: 24, y: 12 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    playBtn.on("pointerover", () => playBtn.setAlpha(0.8));
    playBtn.on("pointerout", () => playBtn.setAlpha(1));
    playBtn.on("pointerdown", () => {
      this.scene.start("LevelSelectScene");
    });

    // Quick play (demo level)
    const quickBtn = this.add
      .text(GAME_WIDTH / 2, 370, "⚡ Demo Rápida", {
        fontFamily: "monospace",
        fontSize: "16px",
        color: "#a3a3a3",
        padding: { x: 16, y: 8 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    quickBtn.on("pointerover", () => quickBtn.setColor("#ffffff"));
    quickBtn.on("pointerout", () => quickBtn.setColor("#a3a3a3"));
    quickBtn.on("pointerdown", () => {
      this.scene.start("GameScene");
    });

    // Version
    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 30, "v0.2.0", {
        fontFamily: "monospace",
        fontSize: "12px",
        color: "#555555",
      })
      .setOrigin(0.5);

    gameEvents.emit(GAME_EVENTS.GAME_READY);
  }
}
