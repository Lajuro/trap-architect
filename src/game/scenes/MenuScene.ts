import * as Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT } from "../constants";
import { gameEvents, GAME_EVENTS } from "../events";

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: "MenuScene" });
  }

  create(): void {
    this.cameras.main.setBackgroundColor("#0a0a0a");

    // Title
    this.add
      .text(GAME_WIDTH / 2, 120, "🐱 Trap Architect", {
        fontFamily: "monospace",
        fontSize: "36px",
        color: "#ff8c00",
      })
      .setOrigin(0.5);

    // Subtitle
    this.add
      .text(GAME_WIDTH / 2, 170, "Plataformas impossíveis feitas pela comunidade", {
        fontFamily: "monospace",
        fontSize: "14px",
        color: "#a3a3a3",
      })
      .setOrigin(0.5);

    // Animated cat
    const cat = this.add.image(GAME_WIDTH / 2, 260, "player").setScale(4);
    this.tweens.add({
      targets: cat,
      y: 250,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    // Play button
    const playBtn = this.add
      .text(GAME_WIDTH / 2, 340, "▶  JOGAR", {
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
      this.scene.start("GameScene");
    });

    // Version
    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 30, "v0.1.1", {
        fontFamily: "monospace",
        fontSize: "12px",
        color: "#555555",
      })
      .setOrigin(0.5);

    gameEvents.emit(GAME_EVENTS.GAME_READY);
  }
}
