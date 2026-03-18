import * as Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT } from "../constants";
import { gameEvents, GAME_EVENTS } from "../events";
import { playBGM } from "../audio";

export class MenuScene extends Phaser.Scene {
  private bgElements: { x: number; y: number; size: number; speed: number }[] = [];
  private bgGraphics!: Phaser.GameObjects.Graphics;
  private frame = 0;

  constructor() {
    super({ key: "MenuScene" });
  }

  create(): void {
    this.cameras.main.setBackgroundColor("#0a0a0a");
    this.frame = 0;
    playBGM("menu");

    // Animated background elements (floating squares)
    this.bgElements = [];
    for (let i = 0; i < 15; i++) {
      this.bgElements.push({
        x: Math.random() * GAME_WIDTH,
        y: Math.random() * GAME_HEIGHT,
        size: 4 + Math.random() * 12,
        speed: 0.2 + Math.random() * 0.5,
      });
    }
    this.bgGraphics = this.add.graphics().setDepth(0).setAlpha(0.1);

    // Title
    const title = this.add
      .text(GAME_WIDTH / 2, 100, "TRAP ARCHITECT", {
        fontFamily: "monospace",
        fontSize: "36px",
        color: "#ff8c00",
      })
      .setOrigin(0.5)
      .setDepth(1);

    // Title pulse
    this.tweens.add({
      targets: title,
      scaleX: 1.03,
      scaleY: 1.03,
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    // Subtitle
    this.add
      .text(GAME_WIDTH / 2, 150, "Plataformas impossíveis feitas pela comunidade", {
        fontFamily: "monospace",
        fontSize: "14px",
        color: "#a3a3a3",
      })
      .setOrigin(0.5)
      .setDepth(1);

    // Animated cat
    const cat = this.add.image(GAME_WIDTH / 2, 230, "player").setScale(4).setDepth(1);
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
      .text(GAME_WIDTH / 2, 310, ">  JOGAR", {
        fontFamily: "monospace",
        fontSize: "20px",
        color: "#ffffff",
        backgroundColor: "#ff8c00",
        padding: { x: 24, y: 12 },
      })
      .setOrigin(0.5)
      .setDepth(1)
      .setInteractive({ useHandCursor: true });

    playBtn.on("pointerover", () => playBtn.setAlpha(0.8));
    playBtn.on("pointerout", () => playBtn.setAlpha(1));
    playBtn.on("pointerdown", () => {
      this.scene.start("LevelSelectScene");
    });

    // Glow pulse on play button
    this.tweens.add({
      targets: playBtn,
      scaleX: 1.05,
      scaleY: 1.05,
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    // Quick play (demo level)
    const quickBtn = this.add
      .text(GAME_WIDTH / 2, 370, "* Demo Rapida", {
        fontFamily: "monospace",
        fontSize: "16px",
        color: "#a3a3a3",
        padding: { x: 16, y: 8 },
      })
      .setOrigin(0.5)
      .setDepth(1)
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
      .setOrigin(0.5)
      .setDepth(1);

    gameEvents.emit(GAME_EVENTS.GAME_READY);
  }

  update(): void {
    this.frame++;

    // Animate floating background elements
    const gfx = this.bgGraphics;
    gfx.clear();
    for (const el of this.bgElements) {
      el.y -= el.speed;
      if (el.y < -el.size) {
        el.y = GAME_HEIGHT + el.size;
        el.x = Math.random() * GAME_WIDTH;
      }
      const pulse = Math.sin(this.frame * 0.02 + el.x) * 0.3 + 0.7;
      gfx.fillStyle(0xff8c00, pulse);
      gfx.fillRect(el.x, el.y, el.size, el.size);
    }
  }
}
