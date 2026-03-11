import * as Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT, TILE_SIZE } from "../constants";

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: "BootScene" });
  }

  preload(): void {
    // Show loading bar
    const width = GAME_WIDTH;
    const height = GAME_HEIGHT;

    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x222222, 0.8);
    progressBox.fillRect(width / 2 - 160, height / 2 - 15, 320, 30);

    const loadingText = this.add.text(width / 2, height / 2 - 40, "Carregando...", {
      fontFamily: "monospace",
      fontSize: "16px",
      color: "#ffffff",
    });
    loadingText.setOrigin(0.5, 0.5);

    this.load.on("progress", (value: number) => {
      progressBar.clear();
      progressBar.fillStyle(0xff8c00, 1);
      progressBar.fillRect(width / 2 - 155, height / 2 - 10, 310 * value, 20);
    });

    this.load.on("complete", () => {
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
    });

    // Generate placeholder textures programmatically
    this.generateTextures();
  }

  create(): void {
    this.scene.start("MenuScene");
  }

  private generateTextures(): void {
    const g = this.make.graphics({ x: 0, y: 0 });
    const S = TILE_SIZE;

    // Ground Top — green grass
    g.clear();
    g.fillStyle(0x4caf50);
    g.fillRect(0, 0, S, S);
    g.fillStyle(0x388e3c);
    g.fillRect(0, S - 6, S, 6);
    g.generateTexture("tile_ground_top", S, S);

    // Ground — brown dirt
    g.clear();
    g.fillStyle(0x8d6e4a);
    g.fillRect(0, 0, S, S);
    g.fillStyle(0x7a5c3a);
    g.fillRect(4, 4, 8, 8);
    g.fillRect(20, 16, 8, 8);
    g.generateTexture("tile_ground", S, S);

    // Brick
    g.clear();
    g.fillStyle(0xc68e5a);
    g.fillRect(0, 0, S, S);
    g.fillStyle(0x333333);
    g.fillRect(0, S / 2 - 1, S, 2);
    g.fillRect(S / 2 - 1, 0, 2, S / 2);
    g.fillRect(0, 0, 2, S);
    g.fillRect(S - 2, S / 2, 2, S / 2);
    g.generateTexture("tile_brick", S, S);

    // Question block
    g.clear();
    g.fillStyle(0xffcc00);
    g.fillRect(0, 0, S, S);
    g.fillStyle(0x333333);
    g.fillRect(0, 0, S, 2);
    g.fillRect(0, S - 2, S, 2);
    g.fillRect(0, 0, 2, S);
    g.fillRect(S - 2, 0, 2, S);
    g.generateTexture("tile_question", S, S);

    // Spike
    g.clear();
    g.fillStyle(0xcccccc);
    g.beginPath();
    g.moveTo(S / 2, 2);
    g.lineTo(S - 2, S - 2);
    g.lineTo(2, S - 2);
    g.closePath();
    g.fillPath();
    g.generateTexture("tile_spike", S, S);

    // Lava
    g.clear();
    g.fillStyle(0xff4400);
    g.fillRect(0, 0, S, S);
    g.fillStyle(0xff8800);
    g.fillRect(0, 0, S, S / 2);
    g.generateTexture("tile_lava", S, S);

    // Spring
    g.clear();
    g.fillStyle(0xff0000);
    g.fillRect(4, S / 2, S - 8, S / 2);
    g.fillStyle(0xcccccc);
    g.fillRect(2, S / 2 - 4, S - 4, 4);
    g.generateTexture("tile_spring", S, S);

    // Platform
    g.clear();
    g.fillStyle(0x888888);
    g.fillRect(0, 0, S, 8);
    g.generateTexture("tile_platform", S, S);

    // Ice
    g.clear();
    g.fillStyle(0x88ddff);
    g.fillRect(0, 0, S, S);
    g.fillStyle(0xaaeeff);
    g.fillRect(4, 4, 12, 4);
    g.fillRect(16, 20, 12, 4);
    g.generateTexture("tile_ice", S, S);

    // Checkpoint flag
    g.clear();
    g.fillStyle(0xffffff);
    g.fillRect(S / 2 - 1, 4, 3, S - 8);
    g.fillStyle(0xff8c00);
    g.fillRect(S / 2 + 2, 4, 12, 8);
    g.generateTexture("tile_checkpoint", S, S);

    // Castle
    g.clear();
    g.fillStyle(0x666666);
    g.fillRect(0, 0, S, S);
    g.fillStyle(0x555555);
    g.fillRect(2, 2, 12, 12);
    g.fillRect(18, 18, 12, 12);
    g.generateTexture("tile_castle", S, S);

    // Pipe pieces (green)
    g.clear();
    g.fillStyle(0x33aa33);
    g.fillRect(0, 0, S, S);
    g.fillStyle(0x228822);
    g.fillRect(0, 0, 4, S);
    g.generateTexture("tile_pipe", S, S);

    // Cloud (decorative)
    g.clear();
    g.fillStyle(0xffffff);
    g.fillRect(4, 8, S - 8, S - 16);
    g.fillRect(8, 4, S - 16, S - 8);
    g.generateTexture("tile_cloud", S, S);

    // Conveyor belt
    g.clear();
    g.fillStyle(0x777777);
    g.fillRect(0, 0, S, S);
    g.fillStyle(0xff8c00);
    g.fillRect(4, S / 2 - 2, S - 8, 4);
    g.generateTexture("tile_conveyor", S, S);

    // Trampoline
    g.clear();
    g.fillStyle(0x9933ff);
    g.fillRect(4, S / 2, S - 8, S / 2);
    g.fillStyle(0xcc66ff);
    g.fillRect(2, S / 2 - 4, S - 4, 4);
    g.generateTexture("tile_trampoline", S, S);

    // Player cat (orange rectangle with ears and eyes)
    g.clear();
    g.fillStyle(0xff8c00);
    g.fillRect(3, 6, 16, 22);
    // Ears
    g.fillRect(3, 0, 5, 8);
    g.fillRect(14, 0, 5, 8);
    // Eyes
    g.fillStyle(0xffffff);
    g.fillRect(6, 10, 4, 4);
    g.fillRect(12, 10, 4, 4);
    g.fillStyle(0x000000);
    g.fillRect(8, 11, 2, 3);
    g.fillRect(14, 11, 2, 3);
    g.generateTexture("player", 22, 28);

    // Coin
    g.clear();
    g.fillStyle(0xffd700);
    g.fillRect(4, 4, 8, 8);
    g.generateTexture("entity_coin", 16, 16);

    // Flag
    g.clear();
    g.fillStyle(0xffffff);
    g.fillRect(2, 0, 3, S * 2);
    g.fillStyle(0x44ff44);
    g.fillRect(5, 2, 16, 10);
    g.generateTexture("entity_flag", 24, S * 2);

    // Fake flag (red skull)
    g.clear();
    g.fillStyle(0xffffff);
    g.fillRect(2, 0, 3, S * 2);
    g.fillStyle(0xff4444);
    g.fillRect(5, 2, 16, 10);
    g.generateTexture("entity_fake_flag", 24, S * 2);

    // Goomba
    g.clear();
    g.fillStyle(0x8b4513);
    g.fillRect(2, 4, 12, 12);
    g.fillStyle(0xffffff);
    g.fillRect(4, 6, 3, 3);
    g.fillRect(9, 6, 3, 3);
    g.generateTexture("entity_goomba", 16, 16);

    // Spiny
    g.clear();
    g.fillStyle(0xcc0000);
    g.fillRect(2, 4, 12, 12);
    g.fillStyle(0xffcc00);
    g.fillRect(0, 0, 4, 4);
    g.fillRect(12, 0, 4, 4);
    g.fillRect(6, 0, 4, 4);
    g.generateTexture("entity_spiny", 16, 16);

    // Flying enemy
    g.clear();
    g.fillStyle(0x6666ff);
    g.fillRect(2, 4, 12, 12);
    g.fillStyle(0xffffff);
    g.fillRect(0, 2, 4, 6);
    g.fillRect(12, 2, 4, 6);
    g.generateTexture("entity_flying", 16, 16);

    g.destroy();
  }
}
