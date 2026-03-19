import * as Phaser from "phaser";
import { gameEvents, GAME_EVENTS } from "../events";
import { GAME_WIDTH, GAME_HEIGHT } from "../constants";

// ============================================================
// Animation states for the lobby mascot
// ============================================================
type LobbyAnimState =
  | "idle"
  | "blink"
  | "yawn"
  | "wave"
  | "shiver"
  | "laugh"
  | "jump"
  | "eat"
  | "drink"
  | "walk_out"
  | "walk_in"
  | "show_item";

// Items the cat can fetch when walking off-screen
const FETCH_ITEMS = ["coin", "star", "mushroom", "flag", "fire_flower"] as const;
type FetchItem = (typeof FETCH_ITEMS)[number];

// Animations the cat can randomly pick (excluding walk/show_item which chain)
const RANDOM_ANIMS: LobbyAnimState[] = [
  "wave",
  "shiver",
  "laugh",
  "jump",
  "eat",
  "drink",
  "walk_out",
];

const CAT_SCALE = 3;
const CAT_W = 22;
const CAT_H = 28;
const CAT_HOME_X = GAME_WIDTH / 2;
const CAT_BASE_Y = GAME_HEIGHT - 36;

// ============================================================
// Lobby Scene — animated background with expressive mascot
// ============================================================
export class LobbyScene extends Phaser.Scene {
  // Floating particles
  private particles: {
    x: number;
    y: number;
    size: number;
    speed: number;
    rotation: number;
    rotSpeed: number;
    alpha: number;
    graphics: Phaser.GameObjects.Graphics;
  }[] = [];

  // Character sprites
  private cat!: Phaser.GameObjects.Image;
  private shadow!: Phaser.GameObjects.Graphics;
  private heldItem!: Phaser.GameObjects.Image;
  private reactionGfx!: Phaser.GameObjects.Graphics;

  // Animation state machine
  private animState: LobbyAnimState = "idle";
  private animTimer = 0;
  private animFrame = 0;
  private idleTimer = 0;
  private idleCooldown = 0; // frames until next random anim
  private lastAnim: LobbyAnimState = "idle";
  private fetchedItem: FetchItem = "coin";
  private frame = 0;
  private stopped = false;

  // Fixed timestep accumulator (targets 30 logical fps)
  private readonly TICK_RATE = 1000 / 30; // ~33.33ms per tick
  private accumulator = 0;

  constructor() {
    super({ key: "LobbyScene" });
  }

  // ============================================================
  // TEXTURE GENERATION — Procedural player cat + items
  // ============================================================

  private generateTextures(): void {
    const makeCanvas = (key: string, w: number, h: number): CanvasRenderingContext2D => {
      const tex = this.textures.createCanvas(key, w, h);
      return tex!.getContext();
    };
    const refreshTex = (key: string) => {
      (this.textures.get(key) as Phaser.Textures.CanvasTexture).refresh();
    };

    // Shared: draw cat upper body (head + torso) — matches BootScene exactly
    const drawCatBody = (ctx: CanvasRenderingContext2D, eyesClosed = false) => {
      // Body outline
      ctx.fillStyle = "#8B4500";
      ctx.fillRect(2, 7, 18, 1);
      ctx.fillRect(2, 7, 1, 15);
      ctx.fillRect(19, 7, 1, 15);
      ctx.fillRect(2, 22, 18, 1);
      // Body
      ctx.fillStyle = "#FF8C00";
      ctx.fillRect(3, 8, 16, 14);
      ctx.fillStyle = "#FFB040";
      ctx.fillRect(3, 8, 8, 2);
      ctx.fillStyle = "#D07800";
      ctx.fillRect(15, 14, 4, 8);
      ctx.fillRect(3, 20, 16, 2);
      // Stripes
      ctx.fillStyle = "#E07000";
      ctx.fillRect(5, 10, 3, 2);
      ctx.fillRect(13, 10, 3, 2);
      ctx.fillRect(7, 14, 3, 2);
      ctx.fillRect(11, 14, 3, 2);
      ctx.fillRect(9, 12, 2, 2);
      // Belly
      ctx.fillStyle = "#FFF";
      ctx.fillRect(7, 17, 8, 4);
      ctx.fillStyle = "#EEE";
      ctx.fillRect(7, 20, 8, 1);
      // Head outline
      ctx.fillStyle = "#8B4500";
      ctx.fillRect(1, 0, 20, 1);
      ctx.fillRect(1, 0, 1, 11);
      ctx.fillRect(20, 0, 1, 11);
      // Head
      ctx.fillStyle = "#FF8C00";
      ctx.fillRect(2, 0, 18, 10);
      ctx.fillStyle = "#FFB040";
      ctx.fillRect(2, 0, 10, 2);
      // Ears (pink inner)
      ctx.fillStyle = "#FFB6C1";
      ctx.fillRect(4, 1, 2, 3);
      ctx.fillRect(17, 1, 2, 3);
      ctx.fillStyle = "#E89EAB";
      ctx.fillRect(4, 3, 2, 1);
      ctx.fillRect(17, 3, 2, 1);
      // Eyes
      ctx.fillStyle = "#000";
      ctx.fillRect(5, 2, 4, 5);
      ctx.fillRect(13, 2, 4, 5);
      if (eyesClosed) {
        ctx.fillStyle = "#FF8C00";
        ctx.fillRect(5, 2, 4, 4);
        ctx.fillRect(13, 2, 4, 4);
        ctx.fillStyle = "#000";
        ctx.fillRect(5, 5, 4, 1);
        ctx.fillRect(13, 5, 4, 1);
      } else {
        ctx.fillStyle = "#FFF";
        ctx.fillRect(7, 2, 2, 2);
        ctx.fillRect(15, 2, 2, 2);
        ctx.fillStyle = "#FFF";
        ctx.fillRect(6, 3, 1, 1);
        ctx.fillRect(14, 3, 1, 1);
      }
      // Whiskers
      ctx.fillStyle = "#C06000";
      ctx.fillRect(0, 5, 3, 1);
      ctx.fillRect(0, 7, 4, 1);
      ctx.fillRect(1, 9, 3, 1);
      ctx.fillRect(19, 5, 3, 1);
      ctx.fillRect(18, 7, 4, 1);
      ctx.fillRect(18, 9, 3, 1);
      // Nose
      ctx.fillStyle = "#FF8FA0";
      ctx.fillRect(9, 6, 4, 2);
      ctx.fillStyle = "#FFB6C1";
      ctx.fillRect(10, 6, 2, 1);
      // Mouth
      ctx.fillStyle = "#C44";
      ctx.fillRect(9, 8, 4, 1);
      ctx.fillRect(8, 8, 1, 1);
      ctx.fillRect(13, 8, 1, 1);
    };

    // Shared: draw happy eyes (^_^) — used for laugh/wave
    const drawHappyEyes = (ctx: CanvasRenderingContext2D) => {
      // Cover normal eyes with head color, then draw "^" shapes
      ctx.fillStyle = "#FF8C00";
      ctx.fillRect(5, 2, 4, 5);
      ctx.fillRect(13, 2, 4, 5);
      // Left "^"
      ctx.fillStyle = "#000";
      ctx.fillRect(5, 5, 1, 1);
      ctx.fillRect(6, 4, 1, 1);
      ctx.fillRect(7, 3, 1, 1);
      ctx.fillRect(8, 4, 1, 1);
      // Right "^"
      ctx.fillRect(13, 5, 1, 1);
      ctx.fillRect(14, 4, 1, 1);
      ctx.fillRect(15, 3, 1, 1);
      ctx.fillRect(16, 4, 1, 1);
    };

    // Shared: draw wide smile
    const drawSmile = (ctx: CanvasRenderingContext2D) => {
      ctx.fillStyle = "#FF8C00";
      ctx.fillRect(8, 8, 6, 1); // cover original mouth
      ctx.fillStyle = "#C44";
      ctx.fillRect(7, 8, 8, 1);
      ctx.fillRect(8, 9, 6, 1);
      ctx.fillStyle = "#FFB6C1";
      ctx.fillRect(9, 9, 4, 1); // tongue
    };

    // Shared: draw standard legs + shoes
    const drawLegs = (ctx: CanvasRenderingContext2D) => {
      ctx.fillStyle = "#FF8C00";
      ctx.fillRect(4, 22, 5, 4);
      ctx.fillRect(13, 22, 5, 4);
      drawShoes(ctx, 4, 26, 13, 26);
    };

    const drawShoes = (ctx: CanvasRenderingContext2D, lx1: number, ly1: number, lx2: number, ly2: number) => {
      ctx.fillStyle = "#8B4513";
      ctx.fillRect(lx1 - 1, ly1, 7, 2);
      ctx.fillRect(lx2 - 1, ly2, 7, 2);
      ctx.fillStyle = "#5C2D06";
      ctx.fillRect(lx1 - 1, ly1 + 1, 7, 1);
      ctx.fillRect(lx2 - 1, ly2 + 1, 7, 1);
      ctx.fillStyle = "#FFF";
      ctx.fillRect(lx1 + 2, ly1, 1, 1);
      ctx.fillRect(lx2 + 2, ly2, 1, 1);
    };

    // Shared: draw a waving right arm at given height offset
    const drawWaveArm = (ctx: CanvasRenderingContext2D, up: boolean) => {
      ctx.fillStyle = "#FF8C00";
      // Arm extending from right side of body, raised
      const armY = up ? 3 : 5;
      ctx.fillRect(18, armY, 3, 4);
      ctx.fillRect(20, armY - 2, 2, 3);
      // Paw
      ctx.fillStyle = "#FFB040";
      ctx.fillRect(20, armY - 2, 2, 2);
    };

    // ---- lobby_idle ----
    {
      const ctx = makeCanvas("lobby_idle", CAT_W, CAT_H);
      drawCatBody(ctx);
      drawLegs(ctx);
      refreshTex("lobby_idle");
    }

    // ---- lobby_blink ----
    {
      const ctx = makeCanvas("lobby_blink", CAT_W, CAT_H);
      drawCatBody(ctx, true);
      drawLegs(ctx);
      refreshTex("lobby_blink");
    }

    // ---- lobby_yawn ----
    {
      const ctx = makeCanvas("lobby_yawn", CAT_W, CAT_H);
      drawCatBody(ctx);
      ctx.fillStyle = "#FF8C00";
      ctx.fillRect(8, 8, 6, 1);
      ctx.fillStyle = "#880000";
      ctx.fillRect(8, 7, 6, 4);
      ctx.fillStyle = "#CC2222";
      ctx.fillRect(9, 8, 4, 2);
      ctx.fillStyle = "#FFB6C1";
      ctx.fillRect(10, 9, 2, 1);
      drawLegs(ctx);
      refreshTex("lobby_yawn");
    }

    // ---- lobby_wave1 (arm up) ----
    {
      const ctx = makeCanvas("lobby_wave1", CAT_W, CAT_H);
      drawCatBody(ctx);
      drawHappyEyes(ctx);
      drawSmile(ctx);
      drawWaveArm(ctx, true);
      drawLegs(ctx);
      refreshTex("lobby_wave1");
    }

    // ---- lobby_wave2 (arm lower) ----
    {
      const ctx = makeCanvas("lobby_wave2", CAT_W, CAT_H);
      drawCatBody(ctx);
      drawHappyEyes(ctx);
      drawSmile(ctx);
      drawWaveArm(ctx, false);
      drawLegs(ctx);
      refreshTex("lobby_wave2");
    }

    // ---- lobby_shiver1 (body offset left) ----
    {
      const ctx = makeCanvas("lobby_shiver1", CAT_W + 2, CAT_H);
      ctx.save();
      ctx.translate(-1, 0);
      drawCatBody(ctx, true);
      drawLegs(ctx);
      ctx.restore();
      // Chattering teeth lines
      ctx.fillStyle = "#AADDFF";
      ctx.fillRect(8, 9, 1, 1);
      ctx.fillRect(10, 9, 1, 1);
      ctx.fillRect(12, 9, 1, 1);
      refreshTex("lobby_shiver1");
    }

    // ---- lobby_shiver2 (body offset right) ----
    {
      const ctx = makeCanvas("lobby_shiver2", CAT_W + 2, CAT_H);
      ctx.save();
      ctx.translate(1, 0);
      drawCatBody(ctx, true);
      drawLegs(ctx);
      ctx.restore();
      ctx.fillStyle = "#AADDFF";
      ctx.fillRect(9, 9, 1, 1);
      ctx.fillRect(11, 9, 1, 1);
      ctx.fillRect(13, 9, 1, 1);
      refreshTex("lobby_shiver2");
    }

    // ---- lobby_laugh1 (squished) ----
    {
      const ctx = makeCanvas("lobby_laugh1", CAT_W, CAT_H);
      drawCatBody(ctx);
      drawHappyEyes(ctx);
      drawSmile(ctx);
      drawLegs(ctx);
      refreshTex("lobby_laugh1");
    }

    // ---- lobby_laugh2 (stretched, mouth wider) ----
    {
      const ctx = makeCanvas("lobby_laugh2", CAT_W, CAT_H);
      drawCatBody(ctx);
      drawHappyEyes(ctx);
      // Extra wide mouth
      ctx.fillStyle = "#FF8C00";
      ctx.fillRect(7, 8, 8, 2);
      ctx.fillStyle = "#880000";
      ctx.fillRect(7, 8, 8, 2);
      ctx.fillStyle = "#CC2222";
      ctx.fillRect(8, 8, 6, 2);
      ctx.fillStyle = "#FFB6C1";
      ctx.fillRect(9, 9, 4, 1);
      drawLegs(ctx);
      refreshTex("lobby_laugh2");
    }

    // ---- lobby_jump ----
    {
      const ctx = makeCanvas("lobby_jump", CAT_W, CAT_H);
      drawCatBody(ctx);
      drawHappyEyes(ctx);
      ctx.fillStyle = "#FF8C00";
      ctx.fillRect(3, 22, 5, 5);
      ctx.fillRect(14, 22, 5, 5);
      ctx.fillStyle = "#8B4513";
      ctx.fillRect(2, 27, 7, 1);
      ctx.fillRect(13, 27, 7, 1);
      refreshTex("lobby_jump");
    }

    // ---- lobby_land (squash) ----
    {
      const ctx = makeCanvas("lobby_land", CAT_W, CAT_H);
      drawCatBody(ctx);
      drawHappyEyes(ctx);
      // Squashed legs (wider, shorter)
      ctx.fillStyle = "#FF8C00";
      ctx.fillRect(3, 22, 6, 3);
      ctx.fillRect(13, 22, 6, 3);
      drawShoes(ctx, 3, 25, 13, 25);
      refreshTex("lobby_land");
    }

    // ---- lobby_eat1 (mouth near food) ----
    {
      const ctx = makeCanvas("lobby_eat1", CAT_W, CAT_H);
      drawCatBody(ctx);
      // Open mouth
      ctx.fillStyle = "#FF8C00";
      ctx.fillRect(8, 8, 6, 1);
      ctx.fillStyle = "#880000";
      ctx.fillRect(8, 7, 6, 3);
      ctx.fillStyle = "#CC2222";
      ctx.fillRect(9, 8, 4, 1);
      drawLegs(ctx);
      refreshTex("lobby_eat1");
    }

    // ---- lobby_eat2 (chewing — eyes closed, cheeks puffed) ----
    {
      const ctx = makeCanvas("lobby_eat2", CAT_W, CAT_H);
      drawCatBody(ctx, true);
      // Puffed cheeks
      ctx.fillStyle = "#FFB040";
      ctx.fillRect(3, 6, 2, 3);
      ctx.fillRect(17, 6, 2, 3);
      // Small closed mouth
      ctx.fillStyle = "#FF8C00";
      ctx.fillRect(8, 8, 6, 1);
      ctx.fillStyle = "#C44";
      ctx.fillRect(9, 8, 4, 1);
      drawLegs(ctx);
      refreshTex("lobby_eat2");
    }

    // ---- lobby_eat3 (happy munch) ----
    {
      const ctx = makeCanvas("lobby_eat3", CAT_W, CAT_H);
      drawCatBody(ctx);
      drawHappyEyes(ctx);
      ctx.fillStyle = "#FFB040";
      ctx.fillRect(3, 6, 2, 3);
      ctx.fillRect(17, 6, 2, 3);
      drawSmile(ctx);
      drawLegs(ctx);
      refreshTex("lobby_eat3");
    }

    // ---- lobby_drink1 (holding cup) ----
    {
      const ctx = makeCanvas("lobby_drink1", CAT_W + 6, CAT_H);
      drawCatBody(ctx);
      drawLegs(ctx);
      // Arm holding cup
      ctx.fillStyle = "#FF8C00";
      ctx.fillRect(18, 10, 3, 4);
      // Cup
      ctx.fillStyle = "#DDDDDD";
      ctx.fillRect(20, 8, 5, 6);
      ctx.fillStyle = "#BBBBBB";
      ctx.fillRect(20, 8, 5, 1);
      ctx.fillRect(20, 13, 5, 1);
      // Liquid
      ctx.fillStyle = "#8B4513";
      ctx.fillRect(21, 10, 3, 3);
      refreshTex("lobby_drink1");
    }

    // ---- lobby_drink2 (tilting cup, drinking) ----
    {
      const ctx = makeCanvas("lobby_drink2", CAT_W + 6, CAT_H);
      drawCatBody(ctx, true);
      // Satisfied expression
      ctx.fillStyle = "#FF8C00";
      ctx.fillRect(8, 8, 6, 1);
      ctx.fillStyle = "#C44";
      ctx.fillRect(9, 8, 4, 1);
      drawLegs(ctx);
      // Arm tilted with cup near mouth
      ctx.fillStyle = "#FF8C00";
      ctx.fillRect(17, 7, 3, 4);
      // Tilted cup
      ctx.fillStyle = "#DDDDDD";
      ctx.fillRect(19, 4, 5, 5);
      ctx.fillStyle = "#BBBBBB";
      ctx.fillRect(19, 4, 5, 1);
      ctx.fillRect(19, 8, 5, 1);
      ctx.fillStyle = "#8B4513";
      ctx.fillRect(20, 5, 3, 3);
      refreshTex("lobby_drink2");
    }

    // ---- Walk frames (same as in-game) ----
    for (let i = 0; i < 4; i++) {
      const ctx = makeCanvas(`lobby_walk${i}`, CAT_W, CAT_H);
      drawCatBody(ctx);
      ctx.fillStyle = "#FF8C00";
      const offsets = [
        [4, 13],  // walk0: legs together
        [2, 14],  // walk1: left forward
        [6, 11],  // walk2: passing
        [3, 15],  // walk3: right forward
      ];
      const [l1, l2] = offsets[i];
      ctx.fillRect(l1, 22, 5, 4);
      ctx.fillRect(l2, 22, 5, 4);
      drawShoes(ctx, l1, 26, l2, 26);
      refreshTex(`lobby_walk${i}`);
    }

    // ---- lobby_hold (standing, holding item above head) ----
    {
      const ctx = makeCanvas("lobby_hold", CAT_W, CAT_H);
      drawCatBody(ctx);
      drawHappyEyes(ctx);
      drawSmile(ctx);
      drawLegs(ctx);
      refreshTex("lobby_hold");
    }

    // ============================================================
    // ITEM TEXTURES (12×12 pixel items the cat fetches)
    // ============================================================
    const ITEM_SIZE = 12;

    // Coin
    {
      const ctx = makeCanvas("lobby_item_coin", ITEM_SIZE, ITEM_SIZE);
      ctx.fillStyle = "#FFD700";
      ctx.fillRect(3, 1, 6, 10);
      ctx.fillRect(1, 3, 10, 6);
      ctx.fillStyle = "#FFC000";
      ctx.fillRect(4, 2, 4, 8);
      ctx.fillStyle = "#FFEE88";
      ctx.fillRect(4, 3, 2, 2);
      // $ symbol
      ctx.fillStyle = "#B8860B";
      ctx.fillRect(5, 3, 2, 1);
      ctx.fillRect(4, 4, 2, 1);
      ctx.fillRect(5, 5, 2, 1);
      ctx.fillRect(6, 6, 2, 1);
      ctx.fillRect(5, 7, 2, 1);
      refreshTex("lobby_item_coin");
    }

    // Star
    {
      const ctx = makeCanvas("lobby_item_star", ITEM_SIZE, ITEM_SIZE);
      ctx.fillStyle = "#FFD700";
      ctx.fillRect(5, 0, 2, 3);
      ctx.fillRect(3, 3, 6, 2);
      ctx.fillRect(1, 5, 10, 2);
      ctx.fillRect(2, 7, 3, 2);
      ctx.fillRect(7, 7, 3, 2);
      ctx.fillRect(1, 9, 2, 2);
      ctx.fillRect(9, 9, 2, 2);
      ctx.fillStyle = "#FFEE88";
      ctx.fillRect(5, 3, 2, 4);
      refreshTex("lobby_item_star");
    }

    // Mushroom
    {
      const ctx = makeCanvas("lobby_item_mushroom", ITEM_SIZE, ITEM_SIZE);
      // Cap
      ctx.fillStyle = "#CC0000";
      ctx.fillRect(2, 1, 8, 5);
      ctx.fillRect(1, 2, 10, 3);
      // White spots
      ctx.fillStyle = "#FFF";
      ctx.fillRect(3, 2, 2, 2);
      ctx.fillRect(7, 2, 2, 2);
      ctx.fillRect(5, 1, 2, 2);
      // Stem
      ctx.fillStyle = "#F5DEB3";
      ctx.fillRect(4, 6, 4, 4);
      ctx.fillStyle = "#DEB887";
      ctx.fillRect(4, 9, 4, 1);
      // Eyes
      ctx.fillStyle = "#000";
      ctx.fillRect(4, 7, 1, 1);
      ctx.fillRect(7, 7, 1, 1);
      refreshTex("lobby_item_mushroom");
    }

    // Flag
    {
      const ctx = makeCanvas("lobby_item_flag", ITEM_SIZE, ITEM_SIZE);
      // Pole
      ctx.fillStyle = "#888";
      ctx.fillRect(2, 0, 2, 12);
      ctx.fillStyle = "#AAA";
      ctx.fillRect(2, 0, 1, 12);
      // Flag cloth
      ctx.fillStyle = "#FF4444";
      ctx.fillRect(4, 1, 6, 5);
      ctx.fillStyle = "#FF6666";
      ctx.fillRect(4, 1, 6, 2);
      // Skull (tiny)
      ctx.fillStyle = "#FFF";
      ctx.fillRect(6, 2, 2, 2);
      ctx.fillStyle = "#000";
      ctx.fillRect(6, 2, 1, 1);
      ctx.fillRect(7, 2, 1, 1);
      refreshTex("lobby_item_flag");
    }

    // Fire Flower
    {
      const ctx = makeCanvas("lobby_item_fire_flower", ITEM_SIZE, ITEM_SIZE);
      // Stem
      ctx.fillStyle = "#228B22";
      ctx.fillRect(5, 6, 2, 5);
      // Leaf
      ctx.fillStyle = "#32CD32";
      ctx.fillRect(7, 7, 3, 2);
      // Petals
      ctx.fillStyle = "#FF4500";
      ctx.fillRect(4, 0, 4, 2);
      ctx.fillRect(2, 2, 8, 2);
      ctx.fillRect(4, 4, 4, 2);
      // Center
      ctx.fillStyle = "#FFD700";
      ctx.fillRect(5, 2, 2, 2);
      refreshTex("lobby_item_fire_flower");
    }
  }

  // ============================================================
  // SCENE LIFECYCLE
  // ============================================================

  create(): void {
    this.stopped = false;
    this.frame = 0;

    // Dark background
    const bg = this.add.graphics();
    bg.fillStyle(0x0a0a0a, 1);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Subtle grid lines
    const grid = this.add.graphics();
    grid.lineStyle(1, 0x1a1a2e, 0.15);
    for (let x = 0; x < GAME_WIDTH; x += 32) {
      grid.lineBetween(x, 0, x, GAME_HEIGHT);
    }
    for (let y = 0; y < GAME_HEIGHT; y += 32) {
      grid.lineBetween(0, y, GAME_WIDTH, y);
    }

    // Floating particles
    for (let i = 0; i < 20; i++) {
      this.spawnParticle();
    }

    // Generate procedural textures
    this.generateTextures();

    // Shadow under character
    this.shadow = this.add.graphics();
    this.shadow.setDepth(4);

    // Main character sprite (3× scale, anchor at feet)
    this.cat = this.add.image(CAT_HOME_X, CAT_BASE_Y, "lobby_idle");
    this.cat.setOrigin(0.5, 1);
    this.cat.setScale(CAT_SCALE);
    this.cat.setDepth(5);

    // Draw shadow now that cat exists
    this.drawShadow(1);

    // Held item sprite (hidden by default)
    this.heldItem = this.add.image(CAT_HOME_X, CAT_BASE_Y - CAT_H * CAT_SCALE - 8, "lobby_item_coin");
    this.heldItem.setOrigin(0.5, 1);
    this.heldItem.setScale(CAT_SCALE);
    this.heldItem.setDepth(6);
    this.heldItem.setVisible(false);

    // Reaction particle layer
    this.reactionGfx = this.add.graphics();
    this.reactionGfx.setDepth(7);

    // Init state
    this.animState = "idle";
    this.idleCooldown = Phaser.Math.Between(90, 180);

    // Auto-pause when tab not visible
    this.game.events.on("hidden", () => {
      this.scene.pause();
    });
    this.game.events.on("visible", () => {
      if (!this.stopped) this.scene.resume();
    });

    gameEvents.emit(GAME_EVENTS.LOBBY_READY);
  }

  // ============================================================
  // PARTICLES
  // ============================================================

  private spawnParticle(): void {
    const size = Phaser.Math.Between(4, 12);
    const g = this.add.graphics();
    g.setDepth(1);
    const alpha = Phaser.Math.FloatBetween(0.03, 0.1);
    g.fillStyle(0xff8c00, alpha);
    g.fillRect(-size / 2, -size / 2, size, size);

    const particle = {
      x: Phaser.Math.Between(0, GAME_WIDTH),
      y: Phaser.Math.Between(GAME_HEIGHT, GAME_HEIGHT + 200),
      size,
      speed: Phaser.Math.FloatBetween(0.2, 0.8),
      rotation: Phaser.Math.FloatBetween(0, Math.PI * 2),
      rotSpeed: Phaser.Math.FloatBetween(-0.005, 0.005),
      alpha,
      graphics: g,
    };
    g.x = particle.x;
    g.y = particle.y;
    g.rotation = particle.rotation;

    this.particles.push(particle);
  }

  // ============================================================
  // SHADOW HELPER
  // ============================================================

  private drawShadow(scaleY: number): void {
    this.shadow.clear();
    this.shadow.fillStyle(0x000000, 0.25);
    const sw = 24 * CAT_SCALE;
    const sh = 4 * CAT_SCALE * scaleY;
    this.shadow.fillEllipse(this.cat.x, CAT_BASE_Y + 2, sw, sh);
  }

  // ============================================================
  // UPDATE — main loop
  // ============================================================

  update(_time: number, delta: number): void {
    if (this.stopped) return;

    // Accumulate real elapsed time, process in fixed 30fps ticks
    this.accumulator += delta;
    if (this.accumulator < this.TICK_RATE) return;
    // Consume one tick (cap to avoid spiral of death on tab-switch)
    this.accumulator = Math.min(this.accumulator - this.TICK_RATE, this.TICK_RATE);

    this.frame++;

    // Update floating particles
    for (const p of this.particles) {
      p.y -= p.speed;
      p.rotation += p.rotSpeed;
      p.graphics.x = p.x;
      p.graphics.y = p.y;
      p.graphics.rotation = p.rotation;
      if (p.y < -20) {
        p.y = GAME_HEIGHT + Phaser.Math.Between(10, 100);
        p.x = Phaser.Math.Between(0, GAME_WIDTH);
      }
    }

    // Animate character based on current state
    this.updateAnimation();

    // Update held item position to follow cat
    if (this.heldItem.visible) {
      this.heldItem.x = this.cat.x;
      this.heldItem.y = this.cat.y - CAT_H * CAT_SCALE - 4;
    }

    // Update shadow position
    this.drawShadow(this.animState === "jump" ? 0.5 : 1);
  }

  // ============================================================
  // ANIMATION STATE MACHINE
  // ============================================================

  private updateAnimation(): void {
    this.animTimer++;
    this.reactionGfx.clear();

    switch (this.animState) {
      case "idle":
        this.updateIdle();
        break;
      case "blink":
        this.updateBlink();
        break;
      case "yawn":
        this.updateYawn();
        break;
      case "wave":
        this.updateWave();
        break;
      case "shiver":
        this.updateShiver();
        break;
      case "laugh":
        this.updateLaugh();
        break;
      case "jump":
        this.updateJump();
        break;
      case "eat":
        this.updateEat();
        break;
      case "drink":
        this.updateDrink();
        break;
      case "walk_out":
        this.updateWalkOut();
        break;
      case "walk_in":
        this.updateWalkIn();
        break;
      case "show_item":
        this.updateShowItem();
        break;
    }
  }

  private startAnim(state: LobbyAnimState): void {
    this.animState = state;
    this.animTimer = 0;
    this.animFrame = 0;
    this.lastAnim = state;
  }

  private returnToIdle(): void {
    this.animState = "idle";
    this.animTimer = 0;
    this.idleTimer = 0;
    this.idleCooldown = Phaser.Math.Between(90, 180); // 3-6s at 30fps
    this.cat.setScale(CAT_SCALE);
    this.cat.setFlipX(false);
    this.heldItem.setVisible(false);
    this.cat.setTexture("lobby_idle");
  }

  // ---- IDLE ----
  private updateIdle(): void {
    // Breathing via scale
    const breathe = 1.0 + Math.sin(this.frame * 0.04) * 0.015;
    const tailWag = 1.0 + Math.sin(this.frame * 0.15) * 0.02;
    this.cat.setScale(CAT_SCALE * tailWag, CAT_SCALE * breathe);

    this.cat.setTexture("lobby_idle");

    // Random blink
    if (this.frame % 90 === 0 && Math.random() < 0.6) {
      this.startAnim("blink");
      return;
    }

    // Yawn after long idle
    if (this.animTimer > 200 && this.animTimer % 200 === 0 && Math.random() < 0.3) {
      this.startAnim("yawn");
      return;
    }

    // Random fun animation after cooldown
    this.idleTimer++;
    if (this.idleTimer >= this.idleCooldown) {
      // Pick a random animation that isn't the last one
      let pick: LobbyAnimState;
      let attempts = 0;
      do {
        pick = RANDOM_ANIMS[Phaser.Math.Between(0, RANDOM_ANIMS.length - 1)];
        attempts++;
      } while (pick === this.lastAnim && attempts < 10);
      this.startAnim(pick);
    }
  }

  // ---- BLINK ----
  private updateBlink(): void {
    this.cat.setTexture("lobby_blink");
    this.cat.setScale(CAT_SCALE);
    if (this.animTimer >= 7) {
      this.returnToIdle();
    }
  }

  // ---- YAWN ----
  private updateYawn(): void {
    this.cat.setTexture("lobby_yawn");
    this.cat.setScale(CAT_SCALE);
    if (this.animTimer >= 40) {
      this.returnToIdle();
    }
  }

  // ---- WAVE (saying "oi!") ----
  private updateWave(): void {
    // Alternate wave frames every 5 ticks, 6 cycles
    const cycle = Math.floor(this.animTimer / 5) % 2;
    this.cat.setTexture(cycle === 0 ? "lobby_wave1" : "lobby_wave2");
    // Little body bounce
    const bounce = Math.sin(this.animTimer * 0.4) * 2;
    this.cat.y = CAT_BASE_Y - bounce;
    this.cat.setScale(CAT_SCALE);

    if (this.animTimer >= 60) {
      this.cat.y = CAT_BASE_Y;
      this.returnToIdle();
    }
  }

  // ---- SHIVER (cold!) ----
  private updateShiver(): void {
    // Rapid alternation + random x offset for jitter
    const jitter = this.animTimer % 4 < 2 ? "lobby_shiver1" : "lobby_shiver2";
    this.cat.setTexture(jitter);
    this.cat.x = CAT_HOME_X + (this.animTimer % 2 === 0 ? 1 : -1) * 2;
    this.cat.setScale(CAT_SCALE);

    // Draw sweat/cold drops
    if (this.animTimer % 10 < 5) {
      const dx = this.cat.x;
      const dy = this.cat.y - CAT_H * CAT_SCALE;
      this.reactionGfx.fillStyle(0x88ccff, 0.8);
      this.reactionGfx.fillRect(dx - 20, dy + 5 + (this.animTimer % 10), 3, 4);
      this.reactionGfx.fillRect(dx + 18, dy + 10 + (this.animTimer % 10), 3, 4);
    }

    if (this.animTimer >= 75) {
      this.cat.x = CAT_HOME_X;
      this.returnToIdle();
    }
  }

  // ---- LAUGH ----
  private updateLaugh(): void {
    const cycle = Math.floor(this.animTimer / 4) % 2;
    this.cat.setTexture(cycle === 0 ? "lobby_laugh1" : "lobby_laugh2");
    // Squash/stretch oscillation
    const squash = cycle === 0 ? 0.95 : 1.05;
    const stretch = cycle === 0 ? 1.05 : 0.95;
    this.cat.setScale(CAT_SCALE * squash, CAT_SCALE * stretch);

    // Hearts!
    if (this.animTimer % 15 === 0) {
      const hx = this.cat.x + Phaser.Math.Between(-15, 15);
      const hy = this.cat.y - CAT_H * CAT_SCALE - 10;
      this.drawHeart(hx, hy);
    }
    // Keep previous hearts floating
    if (this.animTimer > 0 && this.animTimer % 15 < 8) {
      const hx = this.cat.x + (this.animTimer % 30 < 15 ? -10 : 10);
      const hy = this.cat.y - CAT_H * CAT_SCALE - 10 - (this.animTimer % 15) * 2;
      this.drawHeart(hx, hy);
    }

    if (this.animTimer >= 60) {
      this.cat.setScale(CAT_SCALE);
      this.returnToIdle();
    }
  }

  // ---- JUMP (excited hop) ----
  private updateJump(): void {
    const total = 30;
    const half = total / 2;

    if (this.animTimer <= half) {
      // Going up
      const t = this.animTimer / half;
      const jumpHeight = 40;
      this.cat.y = CAT_BASE_Y - Math.sin(t * Math.PI) * jumpHeight;
      this.cat.setTexture("lobby_jump");
      this.cat.setScale(CAT_SCALE * 0.95, CAT_SCALE * 1.08);
    } else {
      // Landing squash
      const t = (this.animTimer - half) / half;
      this.cat.y = CAT_BASE_Y;
      this.cat.setTexture("lobby_land");
      const squashAmount = Math.max(0, 1 - t) * 0.15;
      this.cat.setScale(CAT_SCALE * (1 + squashAmount), CAT_SCALE * (1 - squashAmount));
    }

    if (this.animTimer >= total) {
      this.cat.y = CAT_BASE_Y;
      this.cat.setScale(CAT_SCALE);
      this.returnToIdle();
    }
  }

  // ---- EAT ----
  private updateEat(): void {
    // Phase 1: open mouth (0–15)
    // Phase 2: chewing cycle (15–55)
    // Phase 3: satisfied (55–75)
    if (this.animTimer < 15) {
      this.cat.setTexture("lobby_eat1");
    } else if (this.animTimer < 55) {
      const chewCycle = Math.floor((this.animTimer - 15) / 6) % 2;
      this.cat.setTexture(chewCycle === 0 ? "lobby_eat2" : "lobby_eat1");
      // Crumbs
      if (this.animTimer % 8 === 0) {
        const cx = this.cat.x + Phaser.Math.Between(-5, 5);
        const cy = this.cat.y - CAT_H * CAT_SCALE * 0.7;
        this.reactionGfx.fillStyle(0xdeb887, 0.8);
        this.reactionGfx.fillRect(cx, cy + (this.animTimer % 16), 2, 2);
        this.reactionGfx.fillRect(cx + 6, cy + (this.animTimer % 12), 2, 2);
      }
    } else {
      this.cat.setTexture("lobby_eat3");
    }

    this.cat.setScale(CAT_SCALE);
    if (this.animTimer >= 75) {
      this.returnToIdle();
    }
  }

  // ---- DRINK ----
  private updateDrink(): void {
    // Phase 1: holding cup (0–15)
    // Phase 2: drinking (tilted) (15–45)
    // Phase 3: satisfied (45–60)
    if (this.animTimer < 15) {
      this.cat.setTexture("lobby_drink1");
    } else if (this.animTimer < 45) {
      this.cat.setTexture("lobby_drink2");
      // Musical notes
      if (this.animTimer % 12 === 0) {
        const nx = this.cat.x + 20;
        const ny = this.cat.y - CAT_H * CAT_SCALE - (this.animTimer % 24) * 1.5;
        this.reactionGfx.fillStyle(0xffffff, 0.5);
        this.reactionGfx.fillRect(nx, ny, 3, 3);
        this.reactionGfx.fillRect(nx + 3, ny - 5, 1, 5);
      }
    } else {
      this.cat.setTexture("lobby_eat3"); // reuse satisfied face
    }

    this.cat.setScale(CAT_SCALE);
    if (this.animTimer >= 60) {
      this.returnToIdle();
    }
  }

  // ---- WALK OUT (exit screen left) ----
  private updateWalkOut(): void {
    this.cat.setFlipX(true); // face left
    const walkFrame = Math.floor(this.animTimer / 5) % 4;
    this.cat.setTexture(`lobby_walk${walkFrame}`);
    this.cat.x -= 2.5;
    this.cat.setScale(CAT_SCALE);

    // Once off-screen, switch to walk_in
    if (this.cat.x < -CAT_W * CAT_SCALE) {
      // Pick a random item to bring back
      this.fetchedItem = FETCH_ITEMS[Phaser.Math.Between(0, FETCH_ITEMS.length - 1)];
      this.startAnim("walk_in");
      this.cat.setFlipX(false); // face right to walk back
    }
  }

  // ---- WALK IN (return from left with item) ----
  private updateWalkIn(): void {
    this.cat.setFlipX(false); // face right
    const walkFrame = Math.floor(this.animTimer / 5) % 4;
    this.cat.setTexture(`lobby_walk${walkFrame}`);
    this.cat.x += 2.5;
    this.cat.setScale(CAT_SCALE);

    // Show held item while walking in
    this.heldItem.setTexture(`lobby_item_${this.fetchedItem}`);
    this.heldItem.setVisible(true);

    // Reached home position
    if (this.cat.x >= CAT_HOME_X) {
      this.cat.x = CAT_HOME_X;
      this.startAnim("show_item");
    }
  }

  // ---- SHOW ITEM (proud display + little hop) ----
  private updateShowItem(): void {
    this.heldItem.setTexture(`lobby_item_${this.fetchedItem}`);
    this.heldItem.setVisible(true);
    this.cat.setTexture("lobby_hold");
    this.cat.setScale(CAT_SCALE);

    if (this.animTimer < 15) {
      // Little hop up
      const t = this.animTimer / 15;
      this.cat.y = CAT_BASE_Y - Math.sin(t * Math.PI) * 20;
    } else if (this.animTimer < 25) {
      this.cat.y = CAT_BASE_Y;
      // Squash on land
      const t = (this.animTimer - 15) / 10;
      const squash = Math.max(0, 1 - t) * 0.1;
      this.cat.setScale(CAT_SCALE * (1 + squash), CAT_SCALE * (1 - squash));
    } else {
      // Stand proud displaying item
      this.cat.y = CAT_BASE_Y;
      this.cat.setScale(CAT_SCALE);
      // Item bobs slightly
      const bob = Math.sin(this.animTimer * 0.2) * 3;
      this.heldItem.y = this.cat.y - CAT_H * CAT_SCALE - 4 + bob;
    }

    if (this.animTimer >= 60) {
      this.heldItem.setVisible(false);
      this.returnToIdle();
    }
  }

  // ============================================================
  // DRAWING HELPERS
  // ============================================================

  private drawHeart(x: number, y: number): void {
    this.reactionGfx.fillStyle(0xff6688, 0.7);
    // Tiny pixel heart: 5x5
    this.reactionGfx.fillRect(x, y + 1, 1, 2);
    this.reactionGfx.fillRect(x + 1, y, 1, 3);
    this.reactionGfx.fillRect(x + 2, y + 1, 1, 3);
    this.reactionGfx.fillRect(x + 3, y, 1, 3);
    this.reactionGfx.fillRect(x + 4, y + 1, 1, 2);
  }

  // ============================================================
  // CLEANUP
  // ============================================================

  shutdown(): void {
    this.stopped = true;
    this.particles = [];
  }
}
