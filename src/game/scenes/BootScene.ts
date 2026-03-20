import * as Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT, TILE_SIZE } from "../constants";
import { populateTextureCache } from "../texture-cache";
import { gt } from "@/i18n/game";

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

    const loadingText = this.add.text(width / 2, height / 2 - 40, gt("game.loading"), {
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
    // If a startScene was set via game.registry (e.g. from React), use it
    const target = this.registry.get("startScene") as string | undefined;
    const customLevel = this.registry.get("customLevel") as import("../types").ParsedLevel | undefined;
    if (target && this.scene.get(target)) {
      this.scene.start(target, customLevel ? { customLevel } : undefined);
    } else if (this.scene.get("MenuScene")) {
      this.scene.start("MenuScene");
    } else {
      this.scene.start("EditorScene");
    }
  }

  private generateTextures(): void {
    const S = TILE_SIZE;

    // ============================================================
    // Helper: create canvas texture with raw Canvas2D API
    // ============================================================
    const makeCanvas = (key: string, w: number, h: number): CanvasRenderingContext2D => {
      const tex = this.textures.createCanvas(key, w, h);
      return tex!.getContext();
    };
    const refreshTex = (key: string) => {
      (this.textures.get(key) as Phaser.Textures.CanvasTexture).refresh();
    };

    // ============================================================
    // TILES
    // ============================================================

    // Ground Top — rich green grass with 3D depth
    {
      const ctx = makeCanvas("tile_ground_top", S, S);
      // Dirt base
      ctx.fillStyle = "#5E3A1A";
      ctx.fillRect(0, 0, S, S);
      // Dirt texture noise
      ctx.fillStyle = "#6E4522";
      ctx.fillRect(3, 12, 8, 6);
      ctx.fillRect(18, 16, 10, 8);
      ctx.fillRect(8, 24, 12, 6);
      ctx.fillStyle = "#4E3010";
      ctx.fillRect(14, 10, 6, 5);
      ctx.fillRect(2, 22, 7, 4);
      // Green top section
      ctx.fillStyle = "#228B22";
      ctx.fillRect(0, 0, S, 10);
      // Lighter grass top
      ctx.fillStyle = "#2EAA2E";
      ctx.fillRect(0, 0, S, 5);
      // Brightest grass edge
      ctx.fillStyle = "#38CC38";
      ctx.fillRect(0, 0, S, 2);
      // Grass blades (varied heights)
      ctx.fillStyle = "#40DD40";
      const bladePositions = [1, 5, 8, 12, 15, 19, 22, 26, 29];
      const bladeHeights = [4, 6, 3, 7, 5, 4, 6, 3, 5];
      for (let i = 0; i < bladePositions.length; i++) {
        ctx.fillRect(bladePositions[i], 0, 2, bladeHeights[i]);
      }
      // Dark grass shadow
      ctx.fillStyle = "#1A6B1A";
      ctx.fillRect(0, 8, S, 2);
      // Transition dither
      ctx.fillStyle = "#3D7A20";
      for (let x = 0; x < S; x += 4) {
        ctx.fillRect(x, 10, 2, 2);
      }
      refreshTex("tile_ground_top");
    }

    // Ground — brown dirt with pebbles + cracks
    {
      const ctx = makeCanvas("tile_ground", S, S);
      ctx.fillStyle = "#8B5A2B";
      ctx.fillRect(0, 0, S, S);
      // Darker patches
      ctx.fillStyle = "#7A4E24";
      ctx.fillRect(2, 2, 12, 12);
      ctx.fillRect(18, 18, 12, 12);
      // Lighter patches
      ctx.fillStyle = "#9B6A35";
      ctx.fillRect(14, 4, 8, 6);
      ctx.fillRect(4, 20, 10, 6);
      // Pebble details
      ctx.fillStyle = "#6B4418";
      ctx.fillRect(6, 8, 3, 2);
      ctx.fillRect(20, 6, 2, 3);
      ctx.fillRect(10, 22, 3, 2);
      ctx.fillRect(24, 14, 2, 2);
      // Tiny highlights
      ctx.fillStyle = "#A07030";
      ctx.fillRect(8, 4, 1, 1);
      ctx.fillRect(22, 22, 1, 1);
      ctx.fillRect(16, 14, 1, 1);
      refreshTex("tile_ground");
    }

    // Brick — 3D brick pattern with depth, mortar, highlights and shadows
    {
      const ctx = makeCanvas("tile_brick", S, S);
      // Mortar lines (background)
      ctx.fillStyle = "#705A28";
      ctx.fillRect(0, 0, S, S);
      // Top row bricks
      ctx.fillStyle = "#C8763C";
      ctx.fillRect(1, 1, 14, 14);
      ctx.fillRect(17, 1, 14, 14);
      // Bottom row bricks (offset)
      ctx.fillRect(1, 17, 6, 14);
      ctx.fillRect(9, 17, 14, 14);
      ctx.fillRect(25, 17, 6, 14);
      // Brick highlights (top-left edges)
      ctx.fillStyle = "#DDA060";
      ctx.fillRect(1, 1, 14, 2);
      ctx.fillRect(1, 1, 2, 14);
      ctx.fillRect(17, 1, 14, 2);
      ctx.fillRect(17, 1, 2, 14);
      ctx.fillRect(1, 17, 6, 2);
      ctx.fillRect(1, 17, 2, 14);
      ctx.fillRect(9, 17, 14, 2);
      ctx.fillRect(9, 17, 2, 14);
      ctx.fillRect(25, 17, 6, 2);
      ctx.fillRect(25, 17, 2, 14);
      // Brick shadows (bottom-right edges)
      ctx.fillStyle = "#8B5520";
      ctx.fillRect(1, 13, 14, 2);
      ctx.fillRect(13, 1, 2, 14);
      ctx.fillRect(17, 13, 14, 2);
      ctx.fillRect(29, 1, 2, 14);
      ctx.fillRect(1, 29, 6, 2);
      ctx.fillRect(5, 17, 2, 14);
      ctx.fillRect(9, 29, 14, 2);
      ctx.fillRect(21, 17, 2, 14);
      ctx.fillRect(25, 29, 6, 2);
      ctx.fillRect(29, 17, 2, 14);
      refreshTex("tile_brick");
    }

    // Question Block — golden animated-looking with rivets and 3D bevel
    {
      const ctx = makeCanvas("tile_question", S, S);
      // Main gold fill
      ctx.fillStyle = "#FFB800";
      ctx.fillRect(0, 0, S, S);
      // Light bevel (top/left)
      ctx.fillStyle = "#FFD74C";
      ctx.fillRect(0, 0, S, 3);
      ctx.fillRect(0, 0, 3, S);
      // Dark bevel (bottom/right)
      ctx.fillStyle = "#B07800";
      ctx.fillRect(0, S - 3, S, 3);
      ctx.fillRect(S - 3, 0, 3, S);
      // Inner face
      ctx.fillStyle = "#FFCC00";
      ctx.fillRect(3, 3, S - 6, S - 6);
      // Rivet dots
      ctx.fillStyle = "#DAA520";
      ctx.fillRect(4, 4, 3, 3);
      ctx.fillRect(S - 7, 4, 3, 3);
      ctx.fillRect(4, S - 7, 3, 3);
      ctx.fillRect(S - 7, S - 7, 3, 3);
      // Rivet highlights
      ctx.fillStyle = "#FFE070";
      ctx.fillRect(4, 4, 1, 1);
      ctx.fillRect(S - 7, 4, 1, 1);
      ctx.fillRect(4, S - 7, 1, 1);
      ctx.fillRect(S - 7, S - 7, 1, 1);
      // ? mark (white with shadow)
      ctx.fillStyle = "rgba(0,0,0,0.2)";
      ctx.fillRect(12, 7, 10, 3);
      ctx.fillRect(19, 10, 3, 5);
      ctx.fillRect(12, 14, 10, 3);
      ctx.fillRect(12, 14, 3, 4);
      ctx.fillRect(12, 22, 5, 3);
      ctx.fillStyle = "#FFF";
      ctx.fillRect(11, 6, 10, 3);
      ctx.fillRect(18, 9, 3, 5);
      ctx.fillRect(11, 13, 10, 3);
      ctx.fillRect(11, 13, 3, 4);
      ctx.fillRect(11, 21, 5, 3);
      refreshTex("tile_question");
    }

    // Used block — dark spent block with inner 3D depth
    {
      const ctx = makeCanvas("tile_used", S, S);
      ctx.fillStyle = "#7B6545";
      ctx.fillRect(0, 0, S, S);
      // Dark bevel
      ctx.fillStyle = "#5B4525";
      ctx.fillRect(0, 0, S, 2);
      ctx.fillRect(0, 0, 2, S);
      // Light inner
      ctx.fillStyle = "#8B7555";
      ctx.fillRect(2, 2, S - 4, S - 4);
      // Depression shadow
      ctx.fillStyle = "#6B5535";
      ctx.fillRect(4, 4, S - 8, S - 8);
      // Subtle highlight
      ctx.fillStyle = "#9B8565";
      ctx.fillRect(S - 2, 0, 2, S);
      ctx.fillRect(0, S - 2, S, 2);
      refreshTex("tile_used");
    }

    // Spike — sharp metallic triangles with highlights + blood tips
    {
      const ctx = makeCanvas("tile_spike", S, S);
      // Base (transparent background)
      ctx.clearRect(0, 0, S, S);
      // Base platform
      ctx.fillStyle = "#666";
      ctx.fillRect(0, S - 4, S, 4);
      ctx.fillStyle = "#888";
      ctx.fillRect(0, S - 4, S, 1);
      for (let i = 0; i < 4; i++) {
        const sx = i * 8;
        // Spike body (dark side)
        ctx.fillStyle = "#888";
        ctx.beginPath();
        ctx.moveTo(sx, S - 4);
        ctx.lineTo(sx + 4, 2);
        ctx.lineTo(sx + 4, S - 4);
        ctx.fill();
        // Spike body (light side)
        ctx.fillStyle = "#CCC";
        ctx.beginPath();
        ctx.moveTo(sx + 4, 2);
        ctx.lineTo(sx + 8, S - 4);
        ctx.lineTo(sx + 4, S - 4);
        ctx.fill();
        // Bright edge highlight
        ctx.fillStyle = "#EEE";
        ctx.fillRect(sx + 3, 4, 2, 1);
        // Tip
        ctx.fillStyle = "#DDD";
        ctx.fillRect(sx + 3, 2, 2, 2);
        // Red tip accent
        ctx.fillStyle = "#CC4444";
        ctx.fillRect(sx + 3, 2, 2, 1);
      }
      refreshTex("tile_spike");
    }

    // Lava — deep fire gradient with bubble detail
    {
      const ctx = makeCanvas("tile_lava", S, S);
      // Deep red base
      ctx.fillStyle = "#991100";
      ctx.fillRect(0, 0, S, S);
      // Mid layer
      ctx.fillStyle = "#CC2200";
      ctx.fillRect(0, 0, S, S * 0.7);
      // Hot orange layer
      ctx.fillStyle = "#FF4400";
      ctx.fillRect(0, 0, S, S * 0.4);
      // Bright surface
      ctx.fillStyle = "#FF6600";
      ctx.fillRect(0, 0, S, 6);
      // Surface glow
      ctx.fillStyle = "rgba(255,220,0,0.5)";
      ctx.fillRect(2, 1, S - 4, 4);
      // White-hot spots
      ctx.fillStyle = "rgba(255,255,200,0.4)";
      ctx.fillRect(4, 2, 6, 2);
      ctx.fillRect(18, 1, 8, 2);
      // Bubble highlights
      ctx.fillStyle = "rgba(255,180,0,0.5)";
      ctx.beginPath();
      ctx.arc(8, 12, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(22, 20, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(14, 24, 2.5, 0, Math.PI * 2);
      ctx.fill();
      refreshTex("tile_lava");
    }

    // Lava Deep — submerged lava (used for stacked lava blocks below the surface)
    {
      const ctx = makeCanvas("tile_lava_deep", S, S);
      // Uniform deep red fill
      ctx.fillStyle = "#991100";
      ctx.fillRect(0, 0, S, S);
      // Subtle darker patches for variation
      ctx.fillStyle = "#880E00";
      ctx.fillRect(2, 4, 10, 8);
      ctx.fillRect(16, 14, 12, 10);
      ctx.fillRect(6, 20, 8, 6);
      // Very faint glow spots
      ctx.fillStyle = "rgba(204,34,0,0.3)";
      ctx.fillRect(8, 10, 6, 4);
      ctx.fillRect(20, 4, 8, 6);
      ctx.fillRect(4, 24, 10, 4);
      refreshTex("tile_lava_deep");
    }

    // Spring — detailed coiled spring with metallic base
    {
      const ctx = makeCanvas("tile_spring", S, S);
      // Red metallic base
      ctx.fillStyle = "#CC2222";
      ctx.fillRect(4, 20, 24, 12);
      ctx.fillStyle = "#EE4444";
      ctx.fillRect(6, 20, 20, 3);
      ctx.fillStyle = "#AA1111";
      ctx.fillRect(4, 29, 24, 3);
      // Base highlight
      ctx.fillStyle = "#FF6666";
      ctx.fillRect(6, 20, 10, 1);
      // Spring coils (yellow metallic)
      ctx.fillStyle = "#FFD700";
      ctx.fillRect(8, 16, 16, 4);
      ctx.fillStyle = "#FFC000";
      ctx.fillRect(10, 12, 12, 4);
      ctx.fillStyle = "#FFD700";
      ctx.fillRect(12, 8, 8, 4);
      // Coil highlights
      ctx.fillStyle = "#FFE860";
      ctx.fillRect(8, 16, 16, 1);
      ctx.fillRect(10, 12, 12, 1);
      ctx.fillRect(12, 8, 8, 1);
      // Coil shadows
      ctx.fillStyle = "#CC9900";
      ctx.fillRect(8, 19, 16, 1);
      ctx.fillRect(10, 15, 12, 1);
      ctx.fillRect(12, 11, 8, 1);
      // Top pad
      ctx.fillStyle = "#FFEE00";
      ctx.fillRect(10, 5, 12, 4);
      ctx.fillStyle = "#FFFF66";
      ctx.fillRect(10, 5, 12, 1);
      refreshTex("tile_spring");
    }

    // Platform — detailed wooden one-way platform with grain
    {
      const ctx = makeCanvas("tile_platform", S, S);
      // Main plank
      ctx.fillStyle = "#A07040";
      ctx.fillRect(0, 0, S, 12);
      // Top highlight
      ctx.fillStyle = "#C89860";
      ctx.fillRect(0, 0, S, 3);
      // Bottom shadow
      ctx.fillStyle = "#705028";
      ctx.fillRect(0, 10, S, 2);
      // Wood grain lines
      ctx.fillStyle = "#B88850";
      ctx.fillRect(3, 3, 10, 1);
      ctx.fillRect(20, 4, 8, 1);
      ctx.fillRect(6, 7, 14, 1);
      ctx.fillRect(22, 6, 6, 1);
      // End caps
      ctx.fillStyle = "#806030";
      ctx.fillRect(0, 0, 2, 12);
      ctx.fillRect(S - 2, 0, 2, 12);
      // Nail details
      ctx.fillStyle = "#555";
      ctx.fillRect(4, 2, 2, 2);
      ctx.fillRect(26, 2, 2, 2);
      ctx.fillStyle = "#888";
      ctx.fillRect(4, 2, 1, 1);
      ctx.fillRect(26, 2, 1, 1);
      refreshTex("tile_platform");
    }

    // Ice — frosty translucent blue with crystalline shine
    {
      const ctx = makeCanvas("tile_ice", S, S);
      ctx.fillStyle = "#8CC8E8";
      ctx.fillRect(0, 0, S, S);
      // Lighter top
      ctx.fillStyle = "#A8DCFF";
      ctx.fillRect(0, 0, S, 8);
      // Mid band
      ctx.fillStyle = "#78B8D8";
      ctx.fillRect(0, 8, S, 2);
      // Crack lines
      ctx.fillStyle = "#68A8C8";
      ctx.fillRect(8, 4, 1, 12);
      ctx.fillRect(20, 8, 1, 16);
      ctx.fillRect(8, 16, 12, 1);
      // Shine spots
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.fillRect(4, 2, 4, 3);
      ctx.fillRect(22, 4, 3, 2);
      ctx.fillRect(12, 18, 2, 2);
      // Sparkle pixels
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(5, 2, 1, 1);
      ctx.fillRect(23, 4, 1, 1);
      ctx.fillRect(14, 10, 1, 1);
      ctx.fillRect(28, 20, 1, 1);
      refreshTex("tile_ice");
    }

    // Checkpoint — detailed pole with waving flag
    {
      const ctx = makeCanvas("tile_checkpoint", S, S);
      // Pole
      ctx.fillStyle = "#777";
      ctx.fillRect(14, 2, 4, 28);
      // Pole highlight
      ctx.fillStyle = "#999";
      ctx.fillRect(14, 2, 1, 28);
      // Pole shadow
      ctx.fillStyle = "#555";
      ctx.fillRect(17, 2, 1, 28);
      // Flag (blue with wave shape)
      ctx.fillStyle = "#3388EE";
      ctx.beginPath();
      ctx.moveTo(18, 3);
      ctx.lineTo(30, 6);
      ctx.lineTo(29, 10);
      ctx.lineTo(18, 15);
      ctx.closePath();
      ctx.fill();
      // Flag highlight
      ctx.fillStyle = "#55AAFF";
      ctx.beginPath();
      ctx.moveTo(18, 3);
      ctx.lineTo(26, 5);
      ctx.lineTo(18, 8);
      ctx.closePath();
      ctx.fill();
      // Flag shadow
      ctx.fillStyle = "#2266CC";
      ctx.beginPath();
      ctx.moveTo(18, 10);
      ctx.lineTo(29, 10);
      ctx.lineTo(18, 15);
      ctx.closePath();
      ctx.fill();
      // Pole ball top
      ctx.fillStyle = "#FFD700";
      ctx.beginPath();
      ctx.arc(16, 3, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#FFE860";
      ctx.fillRect(15, 1, 1, 1);
      // Base
      ctx.fillStyle = "#555";
      ctx.fillRect(10, 28, 12, 4);
      ctx.fillStyle = "#666";
      ctx.fillRect(10, 28, 12, 1);
      refreshTex("tile_checkpoint");
    }

    // Castle — detailed stone blocks with battlements
    {
      const ctx = makeCanvas("tile_castle", S, S);
      // Base stone color
      ctx.fillStyle = "#808080";
      ctx.fillRect(0, 0, S, S);
      // Stone blocks pattern
      ctx.fillStyle = "#909090";
      ctx.fillRect(1, 1, 14, 14);
      ctx.fillRect(17, 17, 14, 14);
      ctx.fillStyle = "#707070";
      ctx.fillRect(17, 1, 14, 14);
      ctx.fillRect(1, 17, 14, 14);
      // Block highlights
      ctx.fillStyle = "#A0A0A0";
      ctx.fillRect(1, 1, 14, 1);
      ctx.fillRect(1, 1, 1, 14);
      ctx.fillRect(17, 17, 14, 1);
      ctx.fillRect(17, 17, 1, 14);
      // Block shadows
      ctx.fillStyle = "#606060";
      ctx.fillRect(1, 14, 14, 1);
      ctx.fillRect(14, 1, 1, 14);
      ctx.fillRect(17, 30, 14, 1);
      ctx.fillRect(30, 17, 1, 14);
      // Mortar lines
      ctx.fillStyle = "#585858";
      ctx.fillRect(0, 15, S, 2);
      ctx.fillRect(15, 0, 2, S);
      // Battlements
      ctx.fillStyle = "#999";
      ctx.fillRect(0, 0, 7, 4);
      ctx.fillRect(12, 0, 8, 4);
      ctx.fillRect(25, 0, 7, 4);
      ctx.fillStyle = "#B0B0B0";
      ctx.fillRect(0, 0, 7, 1);
      ctx.fillRect(12, 0, 8, 1);
      ctx.fillRect(25, 0, 7, 1);
      refreshTex("tile_castle");
    }

    // Castle Interior — plain stone blocks without battlements (auto-tile: castle above)
    {
      const ctx = makeCanvas("tile_castle_interior", S, S);
      ctx.fillStyle = "#808080";
      ctx.fillRect(0, 0, S, S);
      ctx.fillStyle = "#909090";
      ctx.fillRect(1, 1, 14, 14);
      ctx.fillRect(17, 17, 14, 14);
      ctx.fillStyle = "#707070";
      ctx.fillRect(17, 1, 14, 14);
      ctx.fillRect(1, 17, 14, 14);
      ctx.fillStyle = "#A0A0A0";
      ctx.fillRect(1, 1, 14, 1);
      ctx.fillRect(1, 1, 1, 14);
      ctx.fillRect(17, 17, 14, 1);
      ctx.fillRect(17, 17, 1, 14);
      ctx.fillStyle = "#606060";
      ctx.fillRect(1, 14, 14, 1);
      ctx.fillRect(14, 1, 1, 14);
      ctx.fillRect(17, 30, 14, 1);
      ctx.fillRect(30, 17, 1, 14);
      ctx.fillStyle = "#585858";
      ctx.fillRect(0, 15, S, 2);
      ctx.fillRect(15, 0, 2, S);
      refreshTex("tile_castle_interior");
    }

    // Brick Top — brick with subtle top edge highlight (auto-tile: no brick above)
    {
      const ctx = makeCanvas("tile_brick_top", S, S);
      ctx.fillStyle = "#705A28";
      ctx.fillRect(0, 0, S, S);
      ctx.fillStyle = "#C8763C";
      ctx.fillRect(1, 1, 14, 14);
      ctx.fillRect(17, 1, 14, 14);
      ctx.fillRect(1, 17, 6, 14);
      ctx.fillRect(9, 17, 14, 14);
      ctx.fillRect(25, 17, 6, 14);
      ctx.fillStyle = "#DDA060";
      ctx.fillRect(1, 1, 14, 2);
      ctx.fillRect(1, 1, 2, 14);
      ctx.fillRect(17, 1, 14, 2);
      ctx.fillRect(17, 1, 2, 14);
      ctx.fillRect(1, 17, 6, 2);
      ctx.fillRect(1, 17, 2, 14);
      ctx.fillRect(9, 17, 14, 2);
      ctx.fillRect(9, 17, 2, 14);
      ctx.fillRect(25, 17, 6, 2);
      ctx.fillRect(25, 17, 2, 14);
      ctx.fillStyle = "#8B5520";
      ctx.fillRect(1, 13, 14, 2);
      ctx.fillRect(13, 1, 2, 14);
      ctx.fillRect(17, 13, 14, 2);
      ctx.fillRect(29, 1, 2, 14);
      ctx.fillRect(1, 29, 6, 2);
      ctx.fillRect(5, 17, 2, 14);
      ctx.fillRect(9, 29, 14, 2);
      ctx.fillRect(21, 17, 2, 14);
      ctx.fillRect(25, 29, 6, 2);
      ctx.fillRect(29, 17, 2, 14);
      // Top edge cap — bright mortar line
      ctx.fillStyle = "#E8B870";
      ctx.fillRect(0, 0, S, 1);
      refreshTex("tile_brick_top");
    }

    // Ice Deep — solid interior ice (auto-tile: ice above)
    {
      const ctx = makeCanvas("tile_ice_deep", S, S);
      ctx.fillStyle = "#78B8D8";
      ctx.fillRect(0, 0, S, S);
      ctx.fillStyle = "#6AAAC8";
      ctx.fillRect(4, 4, 12, 10);
      ctx.fillRect(18, 16, 10, 12);
      ctx.fillStyle = "#88C8E0";
      ctx.fillRect(12, 14, 8, 8);
      // Crack lines
      ctx.fillStyle = "#5898B8";
      ctx.fillRect(10, 6, 1, 14);
      ctx.fillRect(22, 4, 1, 18);
      ctx.fillRect(10, 20, 12, 1);
      // Faint bubbles
      ctx.fillStyle = "rgba(255,255,255,0.2)";
      ctx.fillRect(6, 8, 2, 2);
      ctx.fillRect(20, 22, 2, 2);
      refreshTex("tile_ice_deep");
    }

    // Sand Top — golden surface with light crust
    {
      const ctx = makeCanvas("tile_sand_top", S, S);
      ctx.fillStyle = "#D4A843";
      ctx.fillRect(0, 0, S, S);
      // Surface crust
      ctx.fillStyle = "#E0BE60";
      ctx.fillRect(0, 0, S, 6);
      ctx.fillStyle = "#E8CC78";
      ctx.fillRect(0, 0, S, 2);
      // Sand ripples
      ctx.fillStyle = "#C89830";
      ctx.fillRect(4, 8, 10, 1);
      ctx.fillRect(18, 12, 8, 1);
      ctx.fillRect(6, 18, 12, 1);
      // Grain detail
      ctx.fillStyle = "#B08828";
      ctx.fillRect(8, 14, 2, 2);
      ctx.fillRect(22, 20, 3, 2);
      ctx.fillRect(3, 24, 2, 2);
      // Tiny sparkle
      ctx.fillStyle = "rgba(255,255,220,0.5)";
      ctx.fillRect(6, 1, 1, 1);
      ctx.fillRect(20, 2, 1, 1);
      refreshTex("tile_sand_top");
    }

    // Sand — deep packed sand
    {
      const ctx = makeCanvas("tile_sand", S, S);
      ctx.fillStyle = "#C09030";
      ctx.fillRect(0, 0, S, S);
      ctx.fillStyle = "#B08020";
      ctx.fillRect(2, 4, 12, 10);
      ctx.fillRect(18, 16, 10, 10);
      ctx.fillStyle = "#D0A040";
      ctx.fillRect(14, 6, 8, 6);
      ctx.fillRect(4, 20, 10, 8);
      ctx.fillStyle = "#A07018";
      ctx.fillRect(8, 10, 3, 2);
      ctx.fillRect(22, 8, 2, 3);
      ctx.fillRect(12, 24, 3, 2);
      refreshTex("tile_sand");
    }

    // Snow Top — fresh snow surface with sparkle
    {
      const ctx = makeCanvas("tile_snow_top", S, S);
      ctx.fillStyle = "#E0E8F0";
      ctx.fillRect(0, 0, S, S);
      // Fresh snow surface
      ctx.fillStyle = "#F0F4FF";
      ctx.fillRect(0, 0, S, 8);
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, S, 3);
      // Snow drift detail
      ctx.fillStyle = "#D0D8E8";
      ctx.fillRect(6, 10, 8, 1);
      ctx.fillRect(20, 14, 6, 1);
      // Ice patches
      ctx.fillStyle = "#C8D8F0";
      ctx.fillRect(4, 16, 6, 4);
      ctx.fillRect(20, 20, 8, 4);
      // Sparkle pixels
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(3, 1, 1, 1);
      ctx.fillRect(14, 2, 1, 1);
      ctx.fillRect(26, 0, 1, 1);
      ctx.fillRect(10, 6, 1, 1);
      refreshTex("tile_snow_top");
    }

    // Snow — packed deep snow
    {
      const ctx = makeCanvas("tile_snow", S, S);
      ctx.fillStyle = "#D0D8E8";
      ctx.fillRect(0, 0, S, S);
      ctx.fillStyle = "#C0C8D8";
      ctx.fillRect(4, 4, 12, 10);
      ctx.fillRect(16, 18, 10, 8);
      ctx.fillStyle = "#D8E0F0";
      ctx.fillRect(14, 8, 8, 6);
      ctx.fillRect(2, 20, 10, 6);
      ctx.fillStyle = "#B8C0D0";
      ctx.fillRect(10, 12, 3, 2);
      ctx.fillRect(24, 10, 2, 3);
      refreshTex("tile_snow");
    }

    // Wood — brown planks with grain
    {
      const ctx = makeCanvas("tile_wood", S, S);
      ctx.fillStyle = "#8B6340";
      ctx.fillRect(0, 0, S, S);
      // Plank divisions
      ctx.fillStyle = "#6B4320";
      ctx.fillRect(0, 15, S, 2);
      // Grain lines
      ctx.fillStyle = "#7B5330";
      ctx.fillRect(2, 2, 28, 1);
      ctx.fillRect(4, 6, 24, 1);
      ctx.fillRect(6, 10, 20, 1);
      ctx.fillRect(2, 20, 28, 1);
      ctx.fillRect(4, 24, 24, 1);
      ctx.fillRect(6, 28, 20, 1);
      // Highlight streaks
      ctx.fillStyle = "#9B7350";
      ctx.fillRect(8, 4, 10, 1);
      ctx.fillRect(12, 22, 8, 1);
      // Knot
      ctx.fillStyle = "#5B3310";
      ctx.beginPath();
      ctx.arc(22, 8, 2, 0, Math.PI * 2);
      ctx.fill();
      // Nail details
      ctx.fillStyle = "#555";
      ctx.fillRect(3, 3, 2, 2);
      ctx.fillRect(27, 3, 2, 2);
      ctx.fillRect(3, 19, 2, 2);
      ctx.fillRect(27, 19, 2, 2);
      refreshTex("tile_wood");
    }

    // Mossy Stone — gray stone with green moss patches
    {
      const ctx = makeCanvas("tile_mossy_stone", S, S);
      ctx.fillStyle = "#707070";
      ctx.fillRect(0, 0, S, S);
      // Stone blocks
      ctx.fillStyle = "#808080";
      ctx.fillRect(1, 1, 14, 14);
      ctx.fillRect(17, 17, 14, 14);
      ctx.fillStyle = "#606060";
      ctx.fillRect(17, 1, 14, 14);
      ctx.fillRect(1, 17, 14, 14);
      // Mortar
      ctx.fillStyle = "#505050";
      ctx.fillRect(0, 15, S, 2);
      ctx.fillRect(15, 0, 2, S);
      // Moss patches
      ctx.fillStyle = "#3A6B30";
      ctx.fillRect(2, 12, 8, 4);
      ctx.fillRect(20, 2, 6, 6);
      ctx.fillRect(4, 26, 10, 4);
      ctx.fillStyle = "#4A8B40";
      ctx.fillRect(2, 12, 6, 2);
      ctx.fillRect(20, 2, 4, 3);
      ctx.fillRect(4, 26, 8, 2);
      // Moss highlights
      ctx.fillStyle = "#5AAB50";
      ctx.fillRect(3, 12, 2, 1);
      ctx.fillRect(21, 2, 2, 1);
      refreshTex("tile_mossy_stone");
    }

    // Fence — wooden fence posts (decorative, non-solid)
    {
      const ctx = makeCanvas("tile_fence", S, S);
      ctx.clearRect(0, 0, S, S);
      // Vertical posts
      ctx.fillStyle = "#A08050";
      ctx.fillRect(4, 0, 4, S);
      ctx.fillRect(24, 0, 4, S);
      // Post highlights
      ctx.fillStyle = "#C0A070";
      ctx.fillRect(4, 0, 1, S);
      ctx.fillRect(24, 0, 1, S);
      // Post shadows
      ctx.fillStyle = "#806030";
      ctx.fillRect(7, 0, 1, S);
      ctx.fillRect(27, 0, 1, S);
      // Horizontal rail top
      ctx.fillStyle = "#B09060";
      ctx.fillRect(0, 6, S, 4);
      ctx.fillStyle = "#C8A878";
      ctx.fillRect(0, 6, S, 1);
      // Horizontal rail bottom
      ctx.fillStyle = "#B09060";
      ctx.fillRect(0, 20, S, 4);
      ctx.fillStyle = "#C8A878";
      ctx.fillRect(0, 20, S, 1);
      // Post caps (pointed tops)
      ctx.fillStyle = "#907040";
      ctx.fillRect(3, 0, 6, 2);
      ctx.fillRect(23, 0, 6, 2);
      ctx.fillStyle = "#C0A070";
      ctx.fillRect(5, 0, 2, 1);
      ctx.fillRect(25, 0, 2, 1);
      refreshTex("tile_fence");
    }

    // Torch — wooden handle with flame
    {
      const ctx = makeCanvas("tile_torch", S, S);
      ctx.clearRect(0, 0, S, S);
      // Wooden handle
      ctx.fillStyle = "#8B6340";
      ctx.fillRect(13, 14, 6, 18);
      ctx.fillStyle = "#6B4320";
      ctx.fillRect(18, 14, 1, 18);
      ctx.fillStyle = "#A07850";
      ctx.fillRect(13, 14, 1, 18);
      // Metal bracket
      ctx.fillStyle = "#888";
      ctx.fillRect(11, 13, 10, 2);
      ctx.fillStyle = "#AAA";
      ctx.fillRect(11, 13, 10, 1);
      // Flame base (orange)
      ctx.fillStyle = "#FF6600";
      ctx.fillRect(10, 4, 12, 10);
      // Flame inner (yellow)
      ctx.fillStyle = "#FFAA00";
      ctx.fillRect(12, 2, 8, 10);
      // Flame core (bright yellow)
      ctx.fillStyle = "#FFD700";
      ctx.fillRect(13, 4, 6, 6);
      // Flame tip (white-hot)
      ctx.fillStyle = "#FFEE88";
      ctx.fillRect(14, 1, 4, 4);
      // Glow effect
      ctx.fillStyle = "rgba(255,200,50,0.3)";
      ctx.beginPath();
      ctx.arc(16, 8, 8, 0, Math.PI * 2);
      ctx.fill();
      refreshTex("tile_torch");
    }

    // Chain — metal chain links (decorative)
    {
      const ctx = makeCanvas("tile_chain", S, S);
      ctx.clearRect(0, 0, S, S);
      // Chain links (vertical pattern)
      for (let ly = 0; ly < S; ly += 10) {
        const isEven = (ly / 10) % 2 === 0;
        const ox = isEven ? 12 : 14;
        // Link body
        ctx.fillStyle = "#888";
        ctx.fillRect(ox, ly, 8, 8);
        // Link hole
        ctx.fillStyle = "rgba(0,0,0,0)";
        ctx.clearRect(ox + 2, ly + 2, 4, 4);
        // Link highlight
        ctx.fillStyle = "#AAA";
        ctx.fillRect(ox, ly, 8, 1);
        ctx.fillRect(ox, ly, 1, 8);
        // Link shadow
        ctx.fillStyle = "#666";
        ctx.fillRect(ox, ly + 7, 8, 1);
        ctx.fillRect(ox + 7, ly, 1, 8);
      }
      refreshTex("tile_chain");
    }

    // Sign — wooden sign board (decorative)
    {
      const ctx = makeCanvas("tile_sign", S, S);
      ctx.clearRect(0, 0, S, S);
      // Post
      ctx.fillStyle = "#6B4320";
      ctx.fillRect(14, 20, 4, 12);
      ctx.fillStyle = "#8B5330";
      ctx.fillRect(14, 20, 1, 12);
      // Sign board
      ctx.fillStyle = "#B08840";
      ctx.fillRect(2, 4, 28, 16);
      // Board edges
      ctx.fillStyle = "#C8A858";
      ctx.fillRect(2, 4, 28, 2);
      ctx.fillRect(2, 4, 2, 16);
      ctx.fillStyle = "#907030";
      ctx.fillRect(2, 18, 28, 2);
      ctx.fillRect(28, 4, 2, 16);
      // Text lines (decorative)
      ctx.fillStyle = "#5B3310";
      ctx.fillRect(6, 8, 20, 2);
      ctx.fillRect(8, 12, 16, 2);
      refreshTex("tile_sign");
    }

    // Metal — industrial gray panels with rivets
    {
      const ctx = makeCanvas("tile_metal", S, S);
      ctx.fillStyle = "#708090";
      ctx.fillRect(0, 0, S, S);
      // Panel highlights
      ctx.fillStyle = "#8090A0";
      ctx.fillRect(0, 0, S, 2);
      ctx.fillRect(0, 0, 2, S);
      // Panel shadows
      ctx.fillStyle = "#506070";
      ctx.fillRect(0, S - 2, S, 2);
      ctx.fillRect(S - 2, 0, 2, S);
      // Panel seam
      ctx.fillStyle = "#607080";
      ctx.fillRect(0, 15, S, 2);
      // Rivets
      ctx.fillStyle = "#556";
      ctx.fillRect(4, 4, 3, 3);
      ctx.fillRect(S - 7, 4, 3, 3);
      ctx.fillRect(4, S - 7, 3, 3);
      ctx.fillRect(S - 7, S - 7, 3, 3);
      // Rivet highlights
      ctx.fillStyle = "#8899AA";
      ctx.fillRect(4, 4, 1, 1);
      ctx.fillRect(S - 7, 4, 1, 1);
      ctx.fillRect(4, S - 7, 1, 1);
      ctx.fillRect(S - 7, S - 7, 1, 1);
      // Scratch marks
      ctx.fillStyle = "#5A6A7A";
      ctx.fillRect(10, 8, 8, 1);
      ctx.fillRect(14, 22, 6, 1);
      refreshTex("tile_metal");
    }

    // Grate — metal mesh platform (one-way)
    {
      const ctx = makeCanvas("tile_grate", S, S);
      ctx.clearRect(0, 0, S, S);
      // Frame
      ctx.fillStyle = "#607080";
      ctx.fillRect(0, 0, S, 3);
      ctx.fillRect(0, S - 3, S, 3);
      ctx.fillRect(0, 0, 3, S);
      ctx.fillRect(S - 3, 0, 3, S);
      // Mesh pattern (grid)
      ctx.fillStyle = "#556070";
      for (let mx = 3; mx < S - 3; mx += 4) {
        ctx.fillRect(mx, 3, 1, S - 6);
      }
      for (let my = 3; my < S - 3; my += 4) {
        ctx.fillRect(3, my, S - 6, 1);
      }
      // Frame highlight
      ctx.fillStyle = "#8090A0";
      ctx.fillRect(0, 0, S, 1);
      ctx.fillRect(0, 0, 1, S);
      refreshTex("tile_grate");
    }

    // Water — blue surface with wave
    {
      const ctx = makeCanvas("tile_water", S, S);
      ctx.fillStyle = "#1A5588";
      ctx.fillRect(0, 0, S, S);
      // Mid layer
      ctx.fillStyle = "#2266AA";
      ctx.fillRect(0, 0, S, S * 0.7);
      // Surface
      ctx.fillStyle = "#2288CC";
      ctx.fillRect(0, 0, S, S * 0.4);
      // Bright surface
      ctx.fillStyle = "#33AADD";
      ctx.fillRect(0, 0, S, 6);
      // Surface foam
      ctx.fillStyle = "rgba(200,240,255,0.5)";
      ctx.fillRect(3, 1, 8, 3);
      ctx.fillRect(20, 2, 6, 2);
      // Wave highlights
      ctx.fillStyle = "rgba(255,255,255,0.3)";
      ctx.fillRect(6, 0, 4, 1);
      ctx.fillRect(22, 1, 3, 1);
      refreshTex("tile_water");
    }

    // Water Deep — submerged deep water
    {
      const ctx = makeCanvas("tile_water_deep", S, S);
      ctx.fillStyle = "#1A5588";
      ctx.fillRect(0, 0, S, S);
      ctx.fillStyle = "#154A78";
      ctx.fillRect(4, 6, 10, 8);
      ctx.fillRect(18, 16, 10, 8);
      ctx.fillRect(8, 22, 8, 6);
      // Faint current lines
      ctx.fillStyle = "rgba(50,120,180,0.3)";
      ctx.fillRect(6, 10, 12, 1);
      ctx.fillRect(16, 20, 10, 1);
      // Faint bubble
      ctx.fillStyle = "rgba(200,240,255,0.15)";
      ctx.beginPath();
      ctx.arc(10, 16, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(24, 8, 1.5, 0, Math.PI * 2);
      ctx.fill();
      refreshTex("tile_water_deep");
    }

    // Crystal — purple/blue gemstone with facets
    {
      const ctx = makeCanvas("tile_crystal", S, S);
      ctx.fillStyle = "#6622AA";
      ctx.fillRect(0, 0, S, S);
      // Faceted shape
      ctx.fillStyle = "#7733BB";
      ctx.fillRect(2, 2, S - 4, S - 4);
      // Light facet
      ctx.fillStyle = "#9955DD";
      ctx.beginPath();
      ctx.moveTo(2, 2);
      ctx.lineTo(S / 2, S / 2);
      ctx.lineTo(S - 2, 2);
      ctx.closePath();
      ctx.fill();
      // Dark facet
      ctx.fillStyle = "#5511AA";
      ctx.beginPath();
      ctx.moveTo(2, S - 2);
      ctx.lineTo(S / 2, S / 2);
      ctx.lineTo(S - 2, S - 2);
      ctx.closePath();
      ctx.fill();
      // Shine
      ctx.fillStyle = "rgba(255,255,255,0.4)";
      ctx.fillRect(4, 4, 6, 6);
      ctx.fillStyle = "rgba(255,255,255,0.2)";
      ctx.fillRect(8, 8, 4, 4);
      // Sparkle
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(6, 5, 2, 2);
      ctx.fillRect(10, 3, 1, 1);
      refreshTex("tile_crystal");
    }

    // Mushroom Block — red cap with white spots
    {
      const ctx = makeCanvas("tile_mushroom", S, S);
      // Red cap base
      ctx.fillStyle = "#CC2222";
      ctx.fillRect(0, 0, S, S);
      // Cap gradient
      ctx.fillStyle = "#DD3333";
      ctx.fillRect(0, 0, S, S * 0.6);
      ctx.fillStyle = "#EE4444";
      ctx.fillRect(0, 0, S, S * 0.3);
      // White spots
      ctx.fillStyle = "#FFFFFF";
      ctx.beginPath();
      ctx.arc(8, 10, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(22, 8, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(14, 22, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(26, 24, 2.5, 0, Math.PI * 2);
      ctx.fill();
      // Spot shadows
      ctx.fillStyle = "rgba(0,0,0,0.1)";
      ctx.beginPath();
      ctx.arc(9, 11, 4, 0, Math.PI * 2);
      ctx.fill();
      // Dark edge
      ctx.fillStyle = "#AA1111";
      ctx.fillRect(0, S - 2, S, 2);
      ctx.fillRect(0, 0, 2, S);
      ctx.fillRect(S - 2, 0, 2, S);
      refreshTex("tile_mushroom");
    }

    // Pipe helper: draw 3D cylindrical body
    const drawPipeBody = (ctx: CanvasRenderingContext2D) => {
      ctx.fillStyle = "#00AA00";
      ctx.fillRect(0, 0, S, S);
      ctx.fillStyle = "#00DD00";
      ctx.fillRect(0, 0, 6, S);
      ctx.fillStyle = "#00FF00";
      ctx.fillRect(0, 0, 2, S);
      ctx.fillStyle = "#00CC00";
      ctx.fillRect(12, 0, 4, S);
      ctx.fillStyle = "#007700";
      ctx.fillRect(S - 6, 0, 6, S);
      ctx.fillStyle = "#005500";
      ctx.fillRect(S - 2, 0, 2, S);
    };
    // Pipe Top-Left — lip on top + left
    {
      const ctx = makeCanvas("tile_pipe_tl", S, S);
      drawPipeBody(ctx);
      // Top lip
      ctx.fillStyle = "#00EE00";
      ctx.fillRect(0, 0, S, 4);
      ctx.fillStyle = "#00FF33";
      ctx.fillRect(0, 0, S, 2);
      ctx.fillStyle = "#008800";
      ctx.fillRect(0, 4, S, 1);
      // Left lip
      ctx.fillStyle = "#00EE00";
      ctx.fillRect(0, 0, 4, S);
      ctx.fillStyle = "#00FF33";
      ctx.fillRect(0, 0, 2, S);
      // Corner highlight
      ctx.fillStyle = "#44FF44";
      ctx.fillRect(0, 0, 3, 3);
      refreshTex("tile_pipe_tl");
    }
    // Pipe Top-Right — lip on top + right
    {
      const ctx = makeCanvas("tile_pipe_tr", S, S);
      drawPipeBody(ctx);
      ctx.fillStyle = "#00EE00";
      ctx.fillRect(0, 0, S, 4);
      ctx.fillStyle = "#00FF33";
      ctx.fillRect(0, 0, S, 2);
      ctx.fillStyle = "#008800";
      ctx.fillRect(0, 4, S, 1);
      ctx.fillStyle = "#006600";
      ctx.fillRect(S - 4, 0, 4, S);
      ctx.fillStyle = "#005500";
      ctx.fillRect(S - 2, 0, 2, S);
      ctx.fillStyle = "#007700";
      ctx.fillRect(S - 3, 0, 1, 3);
      refreshTex("tile_pipe_tr");
    }
    // Pipe Bottom-Left — body + left lip
    {
      const ctx = makeCanvas("tile_pipe_bl", S, S);
      drawPipeBody(ctx);
      ctx.fillStyle = "#00EE00";
      ctx.fillRect(0, 0, 4, S);
      ctx.fillStyle = "#00FF33";
      ctx.fillRect(0, 0, 2, S);
      refreshTex("tile_pipe_bl");
    }
    // Pipe Bottom-Right — body + right shadow
    {
      const ctx = makeCanvas("tile_pipe_br", S, S);
      drawPipeBody(ctx);
      ctx.fillStyle = "#006600";
      ctx.fillRect(S - 4, 0, 4, S);
      ctx.fillStyle = "#005500";
      ctx.fillRect(S - 2, 0, 2, S);
      refreshTex("tile_pipe_br");
    }
    // Fallback tile_pipe (used as generic)
    {
      const ctx = makeCanvas("tile_pipe", S, S);
      drawPipeBody(ctx);
      ctx.fillStyle = "#00EE00";
      ctx.fillRect(0, 0, S, 3);
      ctx.fillStyle = "#008800";
      ctx.fillRect(0, 3, S, 1);
      refreshTex("tile_pipe");
    }

    // Cloud — soft puffy cloud with depth
    {
      const ctx = makeCanvas("tile_cloud", S, S);
      // Shadow layer
      ctx.fillStyle = "rgba(200,220,255,0.3)";
      ctx.beginPath();
      ctx.arc(10, 22, 10, 0, Math.PI * 2);
      ctx.arc(22, 22, 10, 0, Math.PI * 2);
      ctx.arc(16, 14, 11, 0, Math.PI * 2);
      ctx.fill();
      // Main cloud
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.beginPath();
      ctx.arc(10, 20, 10, 0, Math.PI * 2);
      ctx.arc(22, 20, 10, 0, Math.PI * 2);
      ctx.arc(16, 12, 11, 0, Math.PI * 2);
      ctx.fill();
      // Highlight
      ctx.fillStyle = "rgba(255,255,255,0.5)";
      ctx.beginPath();
      ctx.arc(12, 10, 6, 0, Math.PI * 2);
      ctx.fill();
      // Bright spot
      ctx.fillStyle = "rgba(255,255,255,0.4)";
      ctx.beginPath();
      ctx.arc(10, 8, 3, 0, Math.PI * 2);
      ctx.fill();
      refreshTex("tile_cloud");
    }

    // Conveyor — industrial belt with directional arrows, rollers, and animation frames
    for (let frame = 0; frame < 4; frame++) {
      const texKey = frame === 0 ? "tile_conveyor" : `tile_conveyor_f${frame}`;
      const ctx = makeCanvas(texKey, S, S);
      // Side rails (dark metallic)
      ctx.fillStyle = "#3a3a3a";
      ctx.fillRect(0, 0, S, S);
      // Belt surface with segments that shift per frame
      const segOffset = frame * 4; // 4px shift per frame
      ctx.fillStyle = "#606060";
      ctx.fillRect(1, 3, 30, 26);
      // Roller segment lines (horizontal grooves that scroll)
      for (let sy = 0; sy < 7; sy++) {
        const baseY = 4 + sy * 4;
        const y = 3 + ((baseY - 3 + segOffset) % 26);
        if (y >= 3 && y < 28) {
          ctx.fillStyle = sy % 2 === 0 ? "#707070" : "#585858";
          ctx.fillRect(2, y, 28, 2);
          // Highlight line on top of each segment
          ctx.fillStyle = sy % 2 === 0 ? "#7a7a7a" : "#505050";
          ctx.fillRect(2, y, 28, 1);
        }
      }
      // Top and bottom rollers (cylindrical look)
      ctx.fillStyle = "#4a4a4a";
      ctx.fillRect(0, 0, S, 4);
      ctx.fillRect(0, 28, S, 4);
      ctx.fillStyle = "#888";
      ctx.fillRect(0, 0, S, 1);
      ctx.fillRect(0, 28, S, 1);
      ctx.fillStyle = "#333";
      ctx.fillRect(0, 3, S, 1);
      ctx.fillRect(0, 31, S, 1);
      // Arrows (golden, pointing right — left variant uses flipX)
      ctx.fillStyle = "#FFD700";
      for (let i = 0; i < 2; i++) {
        const ax = 4 + i * 14;
        ctx.beginPath();
        ctx.moveTo(ax, 11);
        ctx.lineTo(ax + 9, 16);
        ctx.lineTo(ax, 21);
        ctx.closePath();
        ctx.fill();
        // Arrow highlight
        ctx.fillStyle = "#FFE860";
        ctx.beginPath();
        ctx.moveTo(ax, 11);
        ctx.lineTo(ax + 9, 16);
        ctx.lineTo(ax, 16);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "#FFD700";
      }
      // Side bolts
      ctx.fillStyle = "#999";
      ctx.beginPath();
      ctx.arc(3, 16, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(29, 16, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#666";
      ctx.beginPath();
      ctx.arc(3, 16, 1, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(29, 16, 1, 0, Math.PI * 2);
      ctx.fill();
      refreshTex(texKey);
    }

    // Trampoline — bouncy purple pad with springs
    {
      const ctx = makeCanvas("tile_trampoline", S, S);
      // Metal base
      ctx.fillStyle = "#553388";
      ctx.fillRect(2, 22, 28, 10);
      ctx.fillStyle = "#6644AA";
      ctx.fillRect(4, 22, 24, 3);
      ctx.fillStyle = "#442266";
      ctx.fillRect(2, 29, 28, 3);
      // Spring coils
      ctx.fillStyle = "#777";
      ctx.fillRect(6, 16, 4, 6);
      ctx.fillRect(14, 16, 4, 6);
      ctx.fillRect(22, 16, 4, 6);
      ctx.fillStyle = "#999";
      ctx.fillRect(6, 16, 4, 2);
      ctx.fillRect(14, 16, 4, 2);
      ctx.fillRect(22, 16, 4, 2);
      // Bouncy surface (pink/magenta)
      ctx.fillStyle = "#DD44DD";
      ctx.fillRect(2, 6, 28, 10);
      // Surface highlight
      ctx.fillStyle = "#FF66FF";
      ctx.fillRect(2, 6, 28, 3);
      ctx.fillStyle = "#FF99FF";
      ctx.fillRect(4, 6, 24, 1);
      // Surface shadow
      ctx.fillStyle = "#AA22AA";
      ctx.fillRect(2, 14, 28, 2);
      // Side bolts
      ctx.fillStyle = "#888";
      ctx.fillRect(2, 10, 2, 2);
      ctx.fillRect(28, 10, 2, 2);
      refreshTex("tile_trampoline");
    }

    // ============================================================
    // PLAYER — detailed cat matching legacy (static best frame)
    // ============================================================
    {
      const ctx = makeCanvas("player", 22, 28);
      // --- Body outline (dark border for depth) ---
      ctx.fillStyle = "#8B4500";
      ctx.fillRect(2, 7, 18, 1);   // top edge
      ctx.fillRect(2, 7, 1, 15);   // left edge
      ctx.fillRect(19, 7, 1, 15);  // right edge
      ctx.fillRect(2, 22, 18, 1);  // bottom edge

      // --- Body ---
      ctx.fillStyle = "#FF8C00";
      ctx.fillRect(3, 8, 16, 14);
      // Body highlight top-left
      ctx.fillStyle = "#FFB040";
      ctx.fillRect(3, 8, 8, 2);
      // Body shadow bottom-right
      ctx.fillStyle = "#D07800";
      ctx.fillRect(15, 14, 4, 8);
      ctx.fillRect(3, 20, 16, 2);

      // --- Stripes ---
      ctx.fillStyle = "#E07000";
      ctx.fillRect(5, 10, 3, 2);
      ctx.fillRect(13, 10, 3, 2);
      ctx.fillRect(7, 14, 3, 2);
      ctx.fillRect(11, 14, 3, 2);
      ctx.fillRect(9, 12, 2, 2);

      // --- White belly ---
      ctx.fillStyle = "#FFF";
      ctx.fillRect(7, 17, 8, 4);
      ctx.fillStyle = "#EEE";
      ctx.fillRect(7, 20, 8, 1);

      // --- Head outline ---
      ctx.fillStyle = "#8B4500";
      ctx.fillRect(1, -1 + 1, 20, 1);  // top outline (shifted +1 since texture y=0)
      ctx.fillRect(1, 0, 1, 11);       // left outline
      ctx.fillRect(20, 0, 1, 11);      // right outline

      // --- Head ---
      ctx.fillStyle = "#FF8C00";
      ctx.fillRect(2, 0, 18, 10);
      // Head highlight
      ctx.fillStyle = "#FFB040";
      ctx.fillRect(2, 0, 10, 2);

      // --- Ears ---
      ctx.fillStyle = "#FF8C00";
      // We offset: legacy y=-4 → texture y starts at 0, so ears can't go negative.
      // Draw ears within top of head area
      // Left ear inner pink
      ctx.fillStyle = "#FFB6C1";
      ctx.fillRect(4, 1, 2, 3);
      // Right ear inner pink
      ctx.fillRect(17, 1, 2, 3);
      // Ear inner shadow
      ctx.fillStyle = "#E89EAB";
      ctx.fillRect(4, 3, 2, 1);
      ctx.fillRect(17, 3, 2, 1);

      // --- Eyes ---
      // Eye sockets
      ctx.fillStyle = "#000";
      ctx.fillRect(5, 2, 4, 5);
      ctx.fillRect(13, 2, 4, 5);
      // Pupils (white)
      ctx.fillStyle = "#FFF";
      ctx.fillRect(7, 2, 2, 2);
      ctx.fillRect(15, 2, 2, 2);
      // Catchlight
      ctx.fillStyle = "#FFF";
      ctx.fillRect(6, 3, 1, 1);
      ctx.fillRect(14, 3, 1, 1);

      // --- Whiskers ---
      ctx.fillStyle = "#C06000";
      ctx.fillRect(0, 5, 3, 1);
      ctx.fillRect(0, 7, 4, 1);
      ctx.fillRect(1, 9, 3, 1);
      ctx.fillRect(19, 5, 3, 1);
      ctx.fillRect(18, 7, 4, 1);
      ctx.fillRect(18, 9, 3, 1);

      // --- Nose ---
      ctx.fillStyle = "#FF8FA0";
      ctx.fillRect(9, 6, 4, 2);
      ctx.fillStyle = "#FFB6C1";
      ctx.fillRect(10, 6, 2, 1);

      // --- Mouth ---
      ctx.fillStyle = "#C44";
      ctx.fillRect(9, 8, 4, 1);
      ctx.fillRect(8, 8, 1, 1);
      ctx.fillRect(13, 8, 1, 1);

      // --- Legs ---
      ctx.fillStyle = "#FF8C00";
      ctx.fillRect(4, 22, 5, 6);
      ctx.fillRect(13, 22, 5, 6);

      // --- Shoes ---
      ctx.fillStyle = "#8B4513";
      ctx.fillRect(3, 26, 7, 2);
      ctx.fillRect(12, 26, 7, 2);
      // Dark sole
      ctx.fillStyle = "#5C2D06";
      ctx.fillRect(3, 27, 7, 1);
      ctx.fillRect(12, 27, 7, 1);
      // Lace dot
      ctx.fillStyle = "#FFF";
      ctx.fillRect(6, 26, 1, 1);
      ctx.fillRect(15, 26, 1, 1);

      refreshTex("player");
    }

    // ============================================================
    // PLAYER ANIMATION FRAMES (walk cycle, idle, jump, fall)
    // ============================================================
    {
      /** Helper: Draw the cat upper body (head + torso). Shared by all frames. */
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
          // Blink — fill over eye area
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

      /** Helper: Draw standard shoes at given leg positions */
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

      // Walk frame 0: legs together (standing)
      {
        const ctx = makeCanvas("player_walk0", 22, 28);
        drawCatBody(ctx);
        ctx.fillStyle = "#FF8C00";
        ctx.fillRect(4, 22, 5, 4);
        ctx.fillRect(13, 22, 5, 4);
        drawShoes(ctx, 4, 26, 13, 26);
        refreshTex("player_walk0");
      }
      // Walk frame 1: left leg forward
      {
        const ctx = makeCanvas("player_walk1", 22, 28);
        drawCatBody(ctx);
        ctx.fillStyle = "#FF8C00";
        ctx.fillRect(2, 22, 5, 4);   // left leg forward
        ctx.fillRect(14, 22, 5, 4);  // right leg back
        drawShoes(ctx, 2, 26, 14, 26);
        refreshTex("player_walk1");
      }
      // Walk frame 2: legs together (passing)
      {
        const ctx = makeCanvas("player_walk2", 22, 28);
        drawCatBody(ctx);
        ctx.fillStyle = "#FF8C00";
        ctx.fillRect(6, 22, 5, 4);
        ctx.fillRect(11, 22, 5, 4);
        drawShoes(ctx, 6, 26, 11, 26);
        refreshTex("player_walk2");
      }
      // Walk frame 3: right leg forward
      {
        const ctx = makeCanvas("player_walk3", 22, 28);
        drawCatBody(ctx);
        ctx.fillStyle = "#FF8C00";
        ctx.fillRect(3, 22, 5, 4);   // left leg back
        ctx.fillRect(15, 22, 5, 4);  // right leg forward
        drawShoes(ctx, 3, 26, 15, 26);
        refreshTex("player_walk3");
      }

      // Idle frame — same as walk0 (used for breathing animation via scale)
      {
        const ctx = makeCanvas("player_idle", 22, 28);
        drawCatBody(ctx);
        ctx.fillStyle = "#FF8C00";
        ctx.fillRect(4, 22, 5, 4);
        ctx.fillRect(13, 22, 5, 4);
        drawShoes(ctx, 4, 26, 13, 26);
        refreshTex("player_idle");
      }

      // Idle blink frame — eyes closed as thin lines
      {
        const ctx = makeCanvas("player_idle_blink", 22, 28);
        drawCatBody(ctx, true);
        ctx.fillStyle = "#FF8C00";
        ctx.fillRect(4, 22, 5, 4);
        ctx.fillRect(13, 22, 5, 4);
        drawShoes(ctx, 4, 26, 13, 26);
        refreshTex("player_idle_blink");
      }

      // Idle yawn frame — mouth open wide
      {
        const ctx = makeCanvas("player_idle_yawn", 22, 28);
        drawCatBody(ctx);
        // Draw open mouth over existing mouth area
        ctx.fillStyle = "#FF8C00";
        ctx.fillRect(8, 8, 6, 1); // cover original mouth
        ctx.fillStyle = "#880000";
        ctx.fillRect(8, 7, 6, 4); // wide open mouth oval
        ctx.fillStyle = "#CC2222";
        ctx.fillRect(9, 8, 4, 2); // inner mouth
        ctx.fillStyle = "#FFB6C1";
        ctx.fillRect(10, 9, 2, 1); // tongue hint
        // Legs
        ctx.fillStyle = "#FF8C00";
        ctx.fillRect(4, 22, 5, 4);
        ctx.fillRect(13, 22, 5, 4);
        drawShoes(ctx, 4, 26, 13, 26);
        refreshTex("player_idle_yawn");
      }

      // Jump frame — legs stretched down
      {
        const ctx = makeCanvas("player_jump", 22, 28);
        drawCatBody(ctx);
        ctx.fillStyle = "#FF8C00";
        ctx.fillRect(3, 22, 5, 5);   // left leg stretched
        ctx.fillRect(14, 22, 5, 5);  // right leg stretched
        ctx.fillStyle = "#8B4513";
        ctx.fillRect(2, 27, 7, 1);
        ctx.fillRect(13, 27, 7, 1);
        refreshTex("player_jump");
      }

      // Fall frame — legs tucked up
      {
        const ctx = makeCanvas("player_fall", 22, 28);
        drawCatBody(ctx);
        ctx.fillStyle = "#FF8C00";
        ctx.fillRect(4, 21, 6, 3);   // left leg tucked
        ctx.fillRect(12, 21, 6, 3);  // right leg tucked
        ctx.fillStyle = "#8B4513";
        ctx.fillRect(4, 23, 6, 2);   // shoes tucked
        ctx.fillRect(12, 23, 6, 2);
        refreshTex("player_fall");
      }
    }

    // ============================================================
    // ENEMIES — 28x28 detailed textures (legacy style)
    // ============================================================

    // Goomba — brown dome body, angry face, fangs
    {
      const ctx = makeCanvas("entity_goomba", 28, 28);
      // Body outline
      ctx.fillStyle = "#3D1A00";
      ctx.beginPath();
      ctx.arc(14, 12, 13, Math.PI, 0);
      ctx.fill();
      ctx.fillRect(1, 12, 26, 13);
      // Body fill
      ctx.fillStyle = "#8B4513";
      ctx.beginPath();
      ctx.arc(14, 12, 12, Math.PI, 0);
      ctx.fill();
      ctx.fillRect(2, 12, 24, 12);
      // Body highlight (top dome)
      ctx.fillStyle = "#A0642B";
      ctx.beginPath();
      ctx.arc(14, 10, 8, Math.PI, 0);
      ctx.fill();
      // Body shadow (bottom)
      ctx.fillStyle = "#6B3A0F";
      ctx.fillRect(2, 20, 24, 4);
      // Eyes
      ctx.fillStyle = "#FFF";
      ctx.fillRect(6, 6, 6, 6);
      ctx.fillRect(16, 6, 6, 6);
      // Eye outline
      ctx.fillStyle = "#000";
      ctx.fillRect(5, 5, 8, 1);
      ctx.fillRect(15, 5, 8, 1);
      ctx.fillRect(5, 12, 8, 1);
      ctx.fillRect(15, 12, 8, 1);
      // Pupils
      ctx.fillStyle = "#000";
      ctx.fillRect(8, 8, 3, 4);
      ctx.fillRect(18, 8, 3, 4);
      // Pupil highlight
      ctx.fillStyle = "#FFF";
      ctx.fillRect(8, 8, 1, 1);
      ctx.fillRect(18, 8, 1, 1);
      // Angry eyebrows
      ctx.fillStyle = "#000";
      ctx.fillRect(5, 3, 2, 2);
      ctx.fillRect(7, 4, 2, 2);
      ctx.fillRect(9, 5, 2, 1);
      ctx.fillRect(17, 5, 2, 1);
      ctx.fillRect(19, 4, 2, 2);
      ctx.fillRect(21, 3, 2, 2);
      // Mouth with teeth
      ctx.fillStyle = "#3D1A00";
      ctx.fillRect(8, 16, 12, 5);
      ctx.fillStyle = "#FFF";
      ctx.fillRect(9, 16, 2, 2);  // Left fang
      ctx.fillRect(17, 16, 2, 2); // Right fang
      ctx.fillRect(12, 19, 2, 2); // Bottom teeth
      ctx.fillRect(14, 19, 2, 2);
      // Feet
      ctx.fillStyle = "#4A2800";
      ctx.fillRect(3, 24, 9, 4);
      ctx.fillRect(17, 24, 9, 4);
      ctx.fillStyle = "#3D1A00";
      ctx.fillRect(3, 27, 9, 1);  // Sole
      ctx.fillRect(17, 27, 9, 1);
      refreshTex("entity_goomba");
    }

    // Fast Goomba — red variant
    {
      const ctx = makeCanvas("entity_fast_goomba", 28, 28);
      // Body outline
      ctx.fillStyle = "#5A0A0A";
      ctx.beginPath();
      ctx.arc(14, 12, 13, Math.PI, 0);
      ctx.fill();
      ctx.fillRect(1, 12, 26, 13);
      // Body fill
      ctx.fillStyle = "#B02020";
      ctx.beginPath();
      ctx.arc(14, 12, 12, Math.PI, 0);
      ctx.fill();
      ctx.fillRect(2, 12, 24, 12);
      // Body highlight
      ctx.fillStyle = "#CC3030";
      ctx.beginPath();
      ctx.arc(14, 10, 8, Math.PI, 0);
      ctx.fill();
      // Body shadow
      ctx.fillStyle = "#8B1515";
      ctx.fillRect(2, 20, 24, 4);
      // Eyes
      ctx.fillStyle = "#FFF";
      ctx.fillRect(6, 6, 6, 6);
      ctx.fillRect(16, 6, 6, 6);
      ctx.fillStyle = "#000";
      ctx.fillRect(5, 5, 8, 1);
      ctx.fillRect(15, 5, 8, 1);
      ctx.fillRect(5, 12, 8, 1);
      ctx.fillRect(15, 12, 8, 1);
      ctx.fillStyle = "#000";
      ctx.fillRect(8, 8, 3, 4);
      ctx.fillRect(18, 8, 3, 4);
      ctx.fillStyle = "#FFF";
      ctx.fillRect(8, 8, 1, 1);
      ctx.fillRect(18, 8, 1, 1);
      // Angry eyebrows
      ctx.fillStyle = "#000";
      ctx.fillRect(5, 3, 2, 2);
      ctx.fillRect(7, 4, 2, 2);
      ctx.fillRect(9, 5, 2, 1);
      ctx.fillRect(17, 5, 2, 1);
      ctx.fillRect(19, 4, 2, 2);
      ctx.fillRect(21, 3, 2, 2);
      // Mouth with teeth
      ctx.fillStyle = "#5A0A0A";
      ctx.fillRect(8, 16, 12, 5);
      ctx.fillStyle = "#FFF";
      ctx.fillRect(9, 16, 2, 2);
      ctx.fillRect(17, 16, 2, 2);
      ctx.fillRect(12, 19, 2, 2);
      ctx.fillRect(14, 19, 2, 2);
      // Feet
      ctx.fillStyle = "#5A0A0A";
      ctx.fillRect(3, 24, 9, 4);
      ctx.fillRect(17, 24, 9, 4);
      ctx.fillStyle = "#700";
      ctx.fillRect(3, 27, 9, 1);
      ctx.fillRect(17, 27, 9, 1);
      refreshTex("entity_fast_goomba");
    }

    // Spiny — red shell with golden triangular spikes (legacy style)
    {
      const ctx = makeCanvas("entity_spiny", 28, 28);
      // Shell outline
      ctx.fillStyle = "#600";
      ctx.beginPath();
      ctx.arc(14, 16, 13, Math.PI, 0);
      ctx.fill();
      ctx.fillRect(1, 16, 26, 8);
      // Shell fill
      ctx.fillStyle = "#B22222";
      ctx.beginPath();
      ctx.arc(14, 16, 12, Math.PI, 0);
      ctx.fill();
      ctx.fillRect(2, 16, 24, 7);
      // Shell highlight
      ctx.fillStyle = "#D44";
      ctx.beginPath();
      ctx.arc(10, 14, 6, Math.PI, 0);
      ctx.fill();
      // Shell shadow
      ctx.fillStyle = "#811";
      ctx.fillRect(16, 18, 10, 5);
      // Shell detail lines
      ctx.fillStyle = "#8B1515";
      ctx.fillRect(4, 17, 20, 1);
      ctx.fillRect(4, 20, 20, 1);
      // Triangular spikes
      const spikeHeights = [10, 13, 11, 14, 10];
      for (let i = 0; i < 5; i++) {
        const sx = 2 + i * 5;
        const sh = spikeHeights[i];
        ctx.fillStyle = "#FFD700";
        ctx.beginPath();
        ctx.moveTo(sx, 10);
        ctx.lineTo(sx + 3, 10 - sh);
        ctx.lineTo(sx + 6, 10);
        ctx.fill();
        // Spike tip highlight
        ctx.fillStyle = "#FFF";
        ctx.fillRect(sx + 2, 10 - sh, 2, 2);
        // Spike base shadow
        ctx.fillStyle = "#B8860B";
        ctx.fillRect(sx, 8, 6, 2);
      }
      // Eyes
      ctx.fillStyle = "#FFF";
      ctx.fillRect(7, 13, 5, 5);
      ctx.fillRect(16, 13, 5, 5);
      ctx.fillStyle = "#000";
      ctx.fillRect(9, 14, 3, 4);
      ctx.fillRect(18, 14, 3, 4);
      ctx.fillStyle = "#FFF";
      ctx.fillRect(9, 14, 1, 1);
      ctx.fillRect(18, 14, 1, 1);
      // Angry eyebrows
      ctx.fillStyle = "#400";
      ctx.fillRect(6, 11, 2, 2);
      ctx.fillRect(8, 12, 2, 1);
      ctx.fillRect(18, 12, 2, 1);
      ctx.fillRect(20, 11, 2, 2);
      // Frown mouth
      ctx.fillStyle = "#600";
      ctx.fillRect(10, 20, 8, 2);
      ctx.fillRect(9, 19, 2, 1);
      ctx.fillRect(17, 19, 2, 1);
      // Feet
      ctx.fillStyle = "#333";
      ctx.fillRect(4, 24, 7, 4);
      ctx.fillRect(17, 24, 7, 4);
      ctx.fillStyle = "#111";
      ctx.fillRect(4, 27, 7, 1);
      ctx.fillRect(17, 27, 7, 1);
      refreshTex("entity_spiny");
    }

    // Flying enemy — goomba body with triangular wings
    {
      const ctx = makeCanvas("entity_flying", 40, 32);
      const ox = 6; // offset for goomba body centered
      // Goomba body (reuse same drawing, shifted)
      ctx.fillStyle = "#3D1A00";
      ctx.beginPath();
      ctx.arc(ox + 14, 16, 13, Math.PI, 0);
      ctx.fill();
      ctx.fillRect(ox + 1, 16, 26, 13);
      ctx.fillStyle = "#8B4513";
      ctx.beginPath();
      ctx.arc(ox + 14, 16, 12, Math.PI, 0);
      ctx.fill();
      ctx.fillRect(ox + 2, 16, 24, 12);
      ctx.fillStyle = "#A0642B";
      ctx.beginPath();
      ctx.arc(ox + 14, 14, 8, Math.PI, 0);
      ctx.fill();
      ctx.fillStyle = "#6B3A0F";
      ctx.fillRect(ox + 2, 24, 24, 4);
      // Eyes
      ctx.fillStyle = "#FFF";
      ctx.fillRect(ox + 6, 10, 6, 6);
      ctx.fillRect(ox + 16, 10, 6, 6);
      ctx.fillStyle = "#000";
      ctx.fillRect(ox + 8, 12, 3, 4);
      ctx.fillRect(ox + 18, 12, 3, 4);
      ctx.fillStyle = "#FFF";
      ctx.fillRect(ox + 8, 12, 1, 1);
      ctx.fillRect(ox + 18, 12, 1, 1);
      // Eyebrows
      ctx.fillStyle = "#000";
      ctx.fillRect(ox + 5, 7, 2, 2);
      ctx.fillRect(ox + 7, 8, 2, 2);
      ctx.fillRect(ox + 9, 9, 2, 1);
      ctx.fillRect(ox + 17, 9, 2, 1);
      ctx.fillRect(ox + 19, 8, 2, 2);
      ctx.fillRect(ox + 21, 7, 2, 2);
      // Mouth
      ctx.fillStyle = "#3D1A00";
      ctx.fillRect(ox + 8, 20, 12, 4);
      ctx.fillStyle = "#FFF";
      ctx.fillRect(ox + 9, 20, 2, 2);
      ctx.fillRect(ox + 17, 20, 2, 2);
      // Feet
      ctx.fillStyle = "#4A2800";
      ctx.fillRect(ox + 3, 28, 9, 4);
      ctx.fillRect(ox + 17, 28, 9, 4);
      // Wings (triangular, raised)
      ctx.fillStyle = "#F8F8FF";
      // Left wing
      ctx.beginPath();
      ctx.moveTo(ox + 2, 14);
      ctx.lineTo(0, 4);
      ctx.lineTo(4, 2);
      ctx.lineTo(ox + 2, 8);
      ctx.fill();
      ctx.fillStyle = "#DDD";
      ctx.beginPath();
      ctx.moveTo(ox + 2, 14);
      ctx.lineTo(0, 4);
      ctx.lineTo(2, 6);
      ctx.lineTo(ox + 2, 12);
      ctx.fill();
      // Right wing
      ctx.fillStyle = "#F8F8FF";
      ctx.beginPath();
      ctx.moveTo(ox + 26, 14);
      ctx.lineTo(40, 4);
      ctx.lineTo(36, 2);
      ctx.lineTo(ox + 26, 8);
      ctx.fill();
      ctx.fillStyle = "#DDD";
      ctx.beginPath();
      ctx.moveTo(ox + 26, 14);
      ctx.lineTo(40, 4);
      ctx.lineTo(38, 6);
      ctx.lineTo(ox + 26, 12);
      ctx.fill();
      refreshTex("entity_flying");
    }

    // ============================================================
    // ENEMY WALK FRAMES — for texture-swap walk animation
    // ============================================================

    // Goomba walk helper: draws body + face (shared between frames)
    const drawGoombaBody = (
      ctx: CanvasRenderingContext2D,
      bodyColor: string,
      darkColor: string,
      highlightColor: string,
      shadowColor: string,
    ) => {
      ctx.fillStyle = darkColor;
      ctx.beginPath();
      ctx.arc(14, 12, 13, Math.PI, 0);
      ctx.fill();
      ctx.fillRect(1, 12, 26, 13);
      ctx.fillStyle = bodyColor;
      ctx.beginPath();
      ctx.arc(14, 12, 12, Math.PI, 0);
      ctx.fill();
      ctx.fillRect(2, 12, 24, 12);
      ctx.fillStyle = highlightColor;
      ctx.beginPath();
      ctx.arc(14, 10, 8, Math.PI, 0);
      ctx.fill();
      ctx.fillStyle = shadowColor;
      ctx.fillRect(2, 20, 24, 4);
      // Eyes
      ctx.fillStyle = "#FFF";
      ctx.fillRect(6, 6, 6, 6);
      ctx.fillRect(16, 6, 6, 6);
      ctx.fillStyle = "#000";
      ctx.fillRect(5, 5, 8, 1);
      ctx.fillRect(15, 5, 8, 1);
      ctx.fillRect(5, 12, 8, 1);
      ctx.fillRect(15, 12, 8, 1);
      ctx.fillStyle = "#000";
      ctx.fillRect(8, 8, 3, 4);
      ctx.fillRect(18, 8, 3, 4);
      ctx.fillStyle = "#FFF";
      ctx.fillRect(8, 8, 1, 1);
      ctx.fillRect(18, 8, 1, 1);
      // Eyebrows
      ctx.fillStyle = "#000";
      ctx.fillRect(5, 3, 2, 2);
      ctx.fillRect(7, 4, 2, 2);
      ctx.fillRect(9, 5, 2, 1);
      ctx.fillRect(17, 5, 2, 1);
      ctx.fillRect(19, 4, 2, 2);
      ctx.fillRect(21, 3, 2, 2);
      // Mouth with teeth
      ctx.fillStyle = darkColor;
      ctx.fillRect(8, 16, 12, 5);
      ctx.fillStyle = "#FFF";
      ctx.fillRect(9, 16, 2, 2);
      ctx.fillRect(17, 16, 2, 2);
      ctx.fillRect(12, 19, 2, 2);
      ctx.fillRect(14, 19, 2, 2);
    };

    // Goomba walk0 (left foot forward)
    {
      const ctx = makeCanvas("entity_goomba_walk0", 28, 28);
      drawGoombaBody(ctx, "#8B4513", "#3D1A00", "#A0642B", "#6B3A0F");
      ctx.fillStyle = "#4A2800";
      ctx.fillRect(1, 24, 9, 4);
      ctx.fillRect(18, 23, 9, 4);
      ctx.fillStyle = "#3D1A00";
      ctx.fillRect(1, 27, 9, 1);
      ctx.fillRect(18, 26, 9, 1);
      refreshTex("entity_goomba_walk0");
    }
    // Goomba walk1 (right foot forward)
    {
      const ctx = makeCanvas("entity_goomba_walk1", 28, 28);
      drawGoombaBody(ctx, "#8B4513", "#3D1A00", "#A0642B", "#6B3A0F");
      ctx.fillStyle = "#4A2800";
      ctx.fillRect(1, 23, 9, 4);
      ctx.fillRect(18, 24, 9, 4);
      ctx.fillStyle = "#3D1A00";
      ctx.fillRect(1, 26, 9, 1);
      ctx.fillRect(18, 27, 9, 1);
      refreshTex("entity_goomba_walk1");
    }

    // Fast Goomba walk0
    {
      const ctx = makeCanvas("entity_fast_goomba_walk0", 28, 28);
      drawGoombaBody(ctx, "#B02020", "#5A0A0A", "#CC3030", "#8B1515");
      ctx.fillStyle = "#5A0A0A";
      ctx.fillRect(1, 24, 9, 4);
      ctx.fillRect(18, 23, 9, 4);
      ctx.fillStyle = "#700";
      ctx.fillRect(1, 27, 9, 1);
      ctx.fillRect(18, 26, 9, 1);
      refreshTex("entity_fast_goomba_walk0");
    }
    // Fast Goomba walk1
    {
      const ctx = makeCanvas("entity_fast_goomba_walk1", 28, 28);
      drawGoombaBody(ctx, "#B02020", "#5A0A0A", "#CC3030", "#8B1515");
      ctx.fillStyle = "#5A0A0A";
      ctx.fillRect(1, 23, 9, 4);
      ctx.fillRect(18, 24, 9, 4);
      ctx.fillStyle = "#700";
      ctx.fillRect(1, 26, 9, 1);
      ctx.fillRect(18, 27, 9, 1);
      refreshTex("entity_fast_goomba_walk1");
    }

    // Spiny walk frames — shell shifts slightly + feet alternate
    // Spiny walk0
    {
      const ctx = makeCanvas("entity_spiny_walk0", 28, 28);
      // Shell (shifted slightly left)
      ctx.fillStyle = "#600";
      ctx.beginPath();
      ctx.arc(13, 16, 13, Math.PI, 0);
      ctx.fill();
      ctx.fillRect(0, 16, 26, 8);
      ctx.fillStyle = "#B22222";
      ctx.beginPath();
      ctx.arc(13, 16, 12, Math.PI, 0);
      ctx.fill();
      ctx.fillRect(1, 16, 24, 7);
      ctx.fillStyle = "#D44";
      ctx.beginPath();
      ctx.arc(9, 14, 6, Math.PI, 0);
      ctx.fill();
      ctx.fillStyle = "#811";
      ctx.fillRect(15, 18, 10, 5);
      ctx.fillStyle = "#8B1515";
      ctx.fillRect(3, 17, 20, 1);
      ctx.fillRect(3, 20, 20, 1);
      // Spikes
      const spikeH0 = [10, 13, 11, 14, 10];
      for (let i = 0; i < 5; i++) {
        const sx = 1 + i * 5;
        ctx.fillStyle = "#FFD700";
        ctx.beginPath();
        ctx.moveTo(sx, 10);
        ctx.lineTo(sx + 3, 10 - spikeH0[i]);
        ctx.lineTo(sx + 6, 10);
        ctx.fill();
        ctx.fillStyle = "#FFF";
        ctx.fillRect(sx + 2, 10 - spikeH0[i], 2, 2);
        ctx.fillStyle = "#B8860B";
        ctx.fillRect(sx, 8, 6, 2);
      }
      // Eyes
      ctx.fillStyle = "#FFF";
      ctx.fillRect(6, 13, 5, 5);
      ctx.fillRect(15, 13, 5, 5);
      ctx.fillStyle = "#000";
      ctx.fillRect(8, 14, 3, 4);
      ctx.fillRect(17, 14, 3, 4);
      ctx.fillStyle = "#FFF";
      ctx.fillRect(8, 14, 1, 1);
      ctx.fillRect(17, 14, 1, 1);
      ctx.fillStyle = "#400";
      ctx.fillRect(5, 11, 2, 2);
      ctx.fillRect(7, 12, 2, 1);
      ctx.fillRect(17, 12, 2, 1);
      ctx.fillRect(19, 11, 2, 2);
      ctx.fillStyle = "#600";
      ctx.fillRect(9, 20, 8, 2);
      ctx.fillRect(8, 19, 2, 1);
      ctx.fillRect(16, 19, 2, 1);
      // Feet (left forward)
      ctx.fillStyle = "#333";
      ctx.fillRect(2, 24, 7, 4);
      ctx.fillRect(18, 23, 7, 4);
      ctx.fillStyle = "#111";
      ctx.fillRect(2, 27, 7, 1);
      ctx.fillRect(18, 26, 7, 1);
      refreshTex("entity_spiny_walk0");
    }
    // Spiny walk1
    {
      const ctx = makeCanvas("entity_spiny_walk1", 28, 28);
      ctx.fillStyle = "#600";
      ctx.beginPath();
      ctx.arc(15, 16, 13, Math.PI, 0);
      ctx.fill();
      ctx.fillRect(2, 16, 26, 8);
      ctx.fillStyle = "#B22222";
      ctx.beginPath();
      ctx.arc(15, 16, 12, Math.PI, 0);
      ctx.fill();
      ctx.fillRect(3, 16, 24, 7);
      ctx.fillStyle = "#D44";
      ctx.beginPath();
      ctx.arc(11, 14, 6, Math.PI, 0);
      ctx.fill();
      ctx.fillStyle = "#811";
      ctx.fillRect(17, 18, 10, 5);
      ctx.fillStyle = "#8B1515";
      ctx.fillRect(5, 17, 20, 1);
      ctx.fillRect(5, 20, 20, 1);
      const spikeH1 = [10, 13, 11, 14, 10];
      for (let i = 0; i < 5; i++) {
        const sx = 3 + i * 5;
        ctx.fillStyle = "#FFD700";
        ctx.beginPath();
        ctx.moveTo(sx, 10);
        ctx.lineTo(sx + 3, 10 - spikeH1[i]);
        ctx.lineTo(sx + 6, 10);
        ctx.fill();
        ctx.fillStyle = "#FFF";
        ctx.fillRect(sx + 2, 10 - spikeH1[i], 2, 2);
        ctx.fillStyle = "#B8860B";
        ctx.fillRect(sx, 8, 6, 2);
      }
      ctx.fillStyle = "#FFF";
      ctx.fillRect(8, 13, 5, 5);
      ctx.fillRect(17, 13, 5, 5);
      ctx.fillStyle = "#000";
      ctx.fillRect(10, 14, 3, 4);
      ctx.fillRect(19, 14, 3, 4);
      ctx.fillStyle = "#FFF";
      ctx.fillRect(10, 14, 1, 1);
      ctx.fillRect(19, 14, 1, 1);
      ctx.fillStyle = "#400";
      ctx.fillRect(7, 11, 2, 2);
      ctx.fillRect(9, 12, 2, 1);
      ctx.fillRect(19, 12, 2, 1);
      ctx.fillRect(21, 11, 2, 2);
      ctx.fillStyle = "#600";
      ctx.fillRect(11, 20, 8, 2);
      ctx.fillRect(10, 19, 2, 1);
      ctx.fillRect(18, 19, 2, 1);
      // Feet (right forward)
      ctx.fillStyle = "#333";
      ctx.fillRect(3, 23, 7, 4);
      ctx.fillRect(19, 24, 7, 4);
      ctx.fillStyle = "#111";
      ctx.fillRect(3, 26, 7, 1);
      ctx.fillRect(19, 27, 7, 1);
      refreshTex("entity_spiny_walk1");
    }

    // Flying walk frames: wings up and wings down
    // Flying walk0 (wings up)
    {
      const ctx = makeCanvas("entity_flying_walk0", 40, 32);
      const ox = 6;
      // Goomba body
      ctx.fillStyle = "#3D1A00";
      ctx.beginPath();
      ctx.arc(ox + 14, 16, 13, Math.PI, 0);
      ctx.fill();
      ctx.fillRect(ox + 1, 16, 26, 13);
      ctx.fillStyle = "#8B4513";
      ctx.beginPath();
      ctx.arc(ox + 14, 16, 12, Math.PI, 0);
      ctx.fill();
      ctx.fillRect(ox + 2, 16, 24, 12);
      ctx.fillStyle = "#A0642B";
      ctx.beginPath();
      ctx.arc(ox + 14, 14, 8, Math.PI, 0);
      ctx.fill();
      ctx.fillStyle = "#6B3A0F";
      ctx.fillRect(ox + 2, 24, 24, 4);
      ctx.fillStyle = "#FFF";
      ctx.fillRect(ox + 6, 10, 6, 6);
      ctx.fillRect(ox + 16, 10, 6, 6);
      ctx.fillStyle = "#000";
      ctx.fillRect(ox + 8, 12, 3, 4);
      ctx.fillRect(ox + 18, 12, 3, 4);
      ctx.fillStyle = "#FFF";
      ctx.fillRect(ox + 8, 12, 1, 1);
      ctx.fillRect(ox + 18, 12, 1, 1);
      ctx.fillStyle = "#000";
      ctx.fillRect(ox + 5, 7, 2, 2);
      ctx.fillRect(ox + 7, 8, 2, 2);
      ctx.fillRect(ox + 9, 9, 2, 1);
      ctx.fillRect(ox + 17, 9, 2, 1);
      ctx.fillRect(ox + 19, 8, 2, 2);
      ctx.fillRect(ox + 21, 7, 2, 2);
      ctx.fillStyle = "#3D1A00";
      ctx.fillRect(ox + 8, 20, 12, 4);
      ctx.fillStyle = "#FFF";
      ctx.fillRect(ox + 9, 20, 2, 2);
      ctx.fillRect(ox + 17, 20, 2, 2);
      ctx.fillStyle = "#4A2800";
      ctx.fillRect(ox + 3, 28, 9, 4);
      ctx.fillRect(ox + 17, 28, 9, 4);
      // Wings UP: extended high
      ctx.fillStyle = "#F8F8FF";
      ctx.beginPath();
      ctx.moveTo(ox + 2, 14);
      ctx.lineTo(0, 0);
      ctx.lineTo(6, 0);
      ctx.lineTo(ox + 2, 8);
      ctx.fill();
      ctx.fillStyle = "#DDD";
      ctx.beginPath();
      ctx.moveTo(ox + 2, 14);
      ctx.lineTo(1, 2);
      ctx.lineTo(3, 3);
      ctx.lineTo(ox + 2, 12);
      ctx.fill();
      ctx.fillStyle = "#F8F8FF";
      ctx.beginPath();
      ctx.moveTo(ox + 26, 14);
      ctx.lineTo(40, 0);
      ctx.lineTo(34, 0);
      ctx.lineTo(ox + 26, 8);
      ctx.fill();
      ctx.fillStyle = "#DDD";
      ctx.beginPath();
      ctx.moveTo(ox + 26, 14);
      ctx.lineTo(39, 2);
      ctx.lineTo(37, 3);
      ctx.lineTo(ox + 26, 12);
      ctx.fill();
      refreshTex("entity_flying_walk0");
    }
    // Flying walk1 (wings down)
    {
      const ctx = makeCanvas("entity_flying_walk1", 40, 32);
      const ox = 6;
      ctx.fillStyle = "#3D1A00";
      ctx.beginPath();
      ctx.arc(ox + 14, 16, 13, Math.PI, 0);
      ctx.fill();
      ctx.fillRect(ox + 1, 16, 26, 13);
      ctx.fillStyle = "#8B4513";
      ctx.beginPath();
      ctx.arc(ox + 14, 16, 12, Math.PI, 0);
      ctx.fill();
      ctx.fillRect(ox + 2, 16, 24, 12);
      ctx.fillStyle = "#A0642B";
      ctx.beginPath();
      ctx.arc(ox + 14, 14, 8, Math.PI, 0);
      ctx.fill();
      ctx.fillStyle = "#6B3A0F";
      ctx.fillRect(ox + 2, 24, 24, 4);
      ctx.fillStyle = "#FFF";
      ctx.fillRect(ox + 6, 10, 6, 6);
      ctx.fillRect(ox + 16, 10, 6, 6);
      ctx.fillStyle = "#000";
      ctx.fillRect(ox + 8, 12, 3, 4);
      ctx.fillRect(ox + 18, 12, 3, 4);
      ctx.fillStyle = "#FFF";
      ctx.fillRect(ox + 8, 12, 1, 1);
      ctx.fillRect(ox + 18, 12, 1, 1);
      ctx.fillStyle = "#000";
      ctx.fillRect(ox + 5, 7, 2, 2);
      ctx.fillRect(ox + 7, 8, 2, 2);
      ctx.fillRect(ox + 9, 9, 2, 1);
      ctx.fillRect(ox + 17, 9, 2, 1);
      ctx.fillRect(ox + 19, 8, 2, 2);
      ctx.fillRect(ox + 21, 7, 2, 2);
      ctx.fillStyle = "#3D1A00";
      ctx.fillRect(ox + 8, 20, 12, 4);
      ctx.fillStyle = "#FFF";
      ctx.fillRect(ox + 9, 20, 2, 2);
      ctx.fillRect(ox + 17, 20, 2, 2);
      ctx.fillStyle = "#4A2800";
      ctx.fillRect(ox + 3, 28, 9, 4);
      ctx.fillRect(ox + 17, 28, 9, 4);
      // Wings DOWN: folded low
      ctx.fillStyle = "#F8F8FF";
      ctx.beginPath();
      ctx.moveTo(ox + 2, 14);
      ctx.lineTo(0, 20);
      ctx.lineTo(4, 22);
      ctx.lineTo(ox + 2, 18);
      ctx.fill();
      ctx.fillStyle = "#DDD";
      ctx.beginPath();
      ctx.moveTo(ox + 2, 14);
      ctx.lineTo(0, 18);
      ctx.lineTo(2, 19);
      ctx.lineTo(ox + 2, 16);
      ctx.fill();
      ctx.fillStyle = "#F8F8FF";
      ctx.beginPath();
      ctx.moveTo(ox + 26, 14);
      ctx.lineTo(40, 20);
      ctx.lineTo(36, 22);
      ctx.lineTo(ox + 26, 18);
      ctx.fill();
      ctx.fillStyle = "#DDD";
      ctx.beginPath();
      ctx.moveTo(ox + 26, 14);
      ctx.lineTo(40, 18);
      ctx.lineTo(38, 19);
      ctx.lineTo(ox + 26, 16);
      ctx.fill();
      refreshTex("entity_flying_walk1");
    }

    // Stomp poof particle (white cloud)
    {
      const ctx = makeCanvas("particle_stomp", 16, 16);
      ctx.fillStyle = "rgba(255,255,255,0.8)";
      ctx.beginPath();
      ctx.arc(8, 8, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.4)";
      ctx.beginPath();
      ctx.arc(4, 6, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(12, 10, 3, 0, Math.PI * 2);
      ctx.fill();
      refreshTex("particle_stomp");
    }

    // Brick debris particle (small brown chunk)
    {
      const ctx = makeCanvas("particle_brick", 6, 6);
      ctx.fillStyle = "#CD853F";
      ctx.fillRect(0, 0, 6, 6);
      ctx.fillStyle = "#DDA060";
      ctx.fillRect(0, 0, 6, 2);
      ctx.fillStyle = "#8B5520";
      ctx.fillRect(0, 4, 6, 2);
      refreshTex("particle_brick");
    }

    // Landing dust particle (tan puff)
    {
      const ctx = makeCanvas("particle_dust", 8, 8);
      ctx.fillStyle = "rgba(180,160,120,0.6)";
      ctx.beginPath();
      ctx.arc(4, 4, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(200,180,140,0.3)";
      ctx.beginPath();
      ctx.arc(4, 4, 2, 0, Math.PI * 2);
      ctx.fill();
      refreshTex("particle_dust");
    }

    // Lava bubble particle (orange glowing dot)
    {
      const ctx = makeCanvas("particle_lava", 6, 6);
      ctx.fillStyle = "#FF6600";
      ctx.beginPath();
      ctx.arc(3, 3, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#FFCC00";
      ctx.beginPath();
      ctx.arc(3, 2, 1.5, 0, Math.PI * 2);
      ctx.fill();
      refreshTex("particle_lava");
    }

    // Spring bounce particle (yellow star)
    {
      const ctx = makeCanvas("particle_spring", 8, 8);
      ctx.fillStyle = "#FFD700";
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
        ctx.lineTo(4 + Math.cos(a) * 4, 4 + Math.sin(a) * 4);
        const ia = a + Math.PI / 5;
        ctx.lineTo(4 + Math.cos(ia) * 1.5, 4 + Math.sin(ia) * 1.5);
      }
      ctx.closePath();
      ctx.fill();
      refreshTex("particle_spring");
    }

    // ============================================================
    // COLLECTIBLES
    // ============================================================

    // Coin — golden ellipse with inner ring and $ symbol (legacy style)
    {
      const ctx = makeCanvas("entity_coin", 16, 16);
      const cx = 7;
      const cy = 8;
      // Outer rim
      ctx.fillStyle = "#B8860B";
      ctx.beginPath();
      ctx.ellipse(cx, cy, 7, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      // Coin body
      ctx.fillStyle = "#FFD700";
      ctx.beginPath();
      ctx.ellipse(cx, cy, 6, 7, 0, 0, Math.PI * 2);
      ctx.fill();
      // Inner ring
      ctx.fillStyle = "#DAA520";
      ctx.beginPath();
      ctx.ellipse(cx, cy, 4.5, 5.25, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#FFD700";
      ctx.beginPath();
      ctx.ellipse(cx, cy, 3.6, 4.2, 0, 0, Math.PI * 2);
      ctx.fill();
      // $ symbol
      ctx.fillStyle = "#B8860B";
      const sw = 2;
      ctx.fillRect(cx - sw, cy - 4, sw * 2, 1);
      ctx.fillRect(cx - sw, cy - 4, 1, 4);
      ctx.fillRect(cx - sw, cy, sw * 2, 1);
      ctx.fillRect(cx + sw - 1, cy, 1, 4);
      ctx.fillRect(cx - sw, cy + 3, sw * 2, 1);
      ctx.fillRect(cx, cy - 5, 1, 12);
      // Highlight
      ctx.fillStyle = "rgba(255,255,255,0.5)";
      ctx.beginPath();
      ctx.ellipse(cx - 1, cy - 2, 1.5, 2, 0, 0, Math.PI * 2);
      ctx.fill();
      refreshTex("entity_coin");
    }

    // Flag (Goal) — detailed with pole, ball, waving cloth, star (legacy style)
    {
      const h = S * 2;
      const ctx = makeCanvas("entity_flag", 48, h);
      // Pole shadow
      ctx.fillStyle = "#444";
      ctx.fillRect(17, 0, 2, h);
      // Pole
      ctx.fillStyle = "#777";
      ctx.fillRect(14, 0, 4, h);
      // Pole highlight
      ctx.fillStyle = "#999";
      ctx.fillRect(14, 0, 1, h);
      // Pole rings
      ctx.fillStyle = "#AAA";
      for (let r = 0; r < 5; r++) {
        ctx.fillRect(13, r * S, 6, 2);
      }
      // Pole base
      ctx.fillStyle = "#555";
      ctx.fillRect(12, h - 4, 8, 4);
      // Ball on top
      ctx.fillStyle = "#FFD700";
      ctx.beginPath();
      ctx.arc(16, 4, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#B8860B";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(16, 4, 5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = "rgba(255,255,255,0.6)";
      ctx.fillRect(14, 2, 2, 2);
      // Green cloth flag with two-color halves
      const clothX = 19;
      const clothY = 8;
      const clothW = 22;
      const clothH = 18;
      // Top half
      ctx.fillStyle = "#00CC00";
      ctx.fillRect(clothX, clothY, clothW, clothH * 0.45);
      // Bottom half
      ctx.fillStyle = "#009900";
      ctx.fillRect(clothX, clothY + clothH * 0.45, clothW, clothH * 0.55);
      // Highlight on top edge
      ctx.fillStyle = "#33FF33";
      ctx.fillRect(clothX, clothY, clothW, 2);
      // Star on flag
      const starCx = clothX + clothW / 2;
      const starCy = clothY + clothH / 2;
      ctx.fillStyle = "rgba(255,215,0,0.3)";
      ctx.beginPath();
      ctx.arc(starCx, starCy, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#FFD700";
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const angle = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
        const outerX = starCx + Math.cos(angle) * 6;
        const outerY = starCy + Math.sin(angle) * 6;
        if (i === 0) ctx.moveTo(outerX, outerY);
        else ctx.lineTo(outerX, outerY);
        const innerAngle = angle + Math.PI / 5;
        const innerX = starCx + Math.cos(innerAngle) * 3;
        const innerY = starCy + Math.sin(innerAngle) * 3;
        ctx.lineTo(innerX, innerY);
      }
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "#B8860B";
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = "#FFE44D";
      ctx.fillRect(starCx - 1, starCy - 1, 2, 2);
      refreshTex("entity_flag");
    }

    // Fake Flag — same pole but red cloth with skull (legacy style)
    {
      const h = S * 2;
      const ctx = makeCanvas("entity_fake_flag", 48, h);
      // Pole shadow
      ctx.fillStyle = "#444";
      ctx.fillRect(17, 0, 2, h);
      // Pole
      ctx.fillStyle = "#777";
      ctx.fillRect(14, 0, 4, h);
      ctx.fillStyle = "#999";
      ctx.fillRect(14, 0, 1, h);
      // Pole rings
      ctx.fillStyle = "#AAA";
      for (let r = 0; r < 5; r++) {
        ctx.fillRect(13, r * S, 6, 2);
      }
      // Pole base
      ctx.fillStyle = "#555";
      ctx.fillRect(12, h - 4, 8, 4);
      // Red ball on top
      ctx.fillStyle = "#FF0000";
      ctx.beginPath();
      ctx.arc(16, 4, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#A00";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(16, 4, 5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = "rgba(255,255,255,0.6)";
      ctx.fillRect(14, 2, 2, 2);
      // Red cloth flag
      const clothX = 19;
      const clothY = 8;
      const clothW = 22;
      const clothH = 18;
      ctx.fillStyle = "#FF4444";
      ctx.fillRect(clothX, clothY, clothW, clothH * 0.45);
      ctx.fillStyle = "#CC0000";
      ctx.fillRect(clothX, clothY + clothH * 0.45, clothW, clothH * 0.55);
      ctx.fillStyle = "#FF7777";
      ctx.fillRect(clothX, clothY, clothW, 2);
      // Skull on flag
      const skx = clothX + 3;
      const sky = clothY + 2;
      ctx.fillStyle = "#FFF";
      ctx.beginPath();
      ctx.arc(skx + 7, sky + 5, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(skx + 2, sky + 5, 10, 6);
      // Eye sockets
      ctx.fillStyle = "#000";
      ctx.fillRect(skx + 2, sky + 3, 3, 3);
      ctx.fillRect(skx + 8, sky + 3, 3, 3);
      // Nose
      ctx.fillRect(skx + 5, sky + 6, 2, 2);
      // Teeth
      ctx.fillStyle = "#FFF";
      ctx.fillRect(skx + 2, sky + 9, 2, 2);
      ctx.fillRect(skx + 5, sky + 9, 2, 2);
      ctx.fillRect(skx + 8, sky + 9, 2, 2);
      ctx.fillStyle = "#000";
      ctx.fillRect(skx + 4, sky + 9, 1, 2);
      ctx.fillRect(skx + 7, sky + 9, 1, 2);
      refreshTex("entity_fake_flag");
    }

    // ============================================================
    // NEW ENTITIES — Power-ups
    // ============================================================

    // Mushroom — red cap with white spots (Mario-style)
    {
      const ctx = makeCanvas("entity_mushroom", 24, 24);
      // Stem
      ctx.fillStyle = "#EEDDCC";
      ctx.fillRect(8, 14, 8, 10);
      ctx.fillStyle = "#DDC8AA";
      ctx.fillRect(8, 22, 8, 2);
      // Stem face
      ctx.fillStyle = "#222";
      ctx.fillRect(10, 16, 2, 2);
      ctx.fillRect(14, 16, 2, 2);
      // Cap
      ctx.fillStyle = "#DD2222";
      ctx.beginPath();
      ctx.arc(12, 10, 10, Math.PI, 0);
      ctx.fill();
      ctx.fillRect(2, 10, 20, 4);
      // White spots
      ctx.fillStyle = "#FFF";
      ctx.beginPath();
      ctx.arc(8, 6, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(16, 6, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(12, 3, 2, 0, Math.PI * 2);
      ctx.fill();
      // Cap highlight
      ctx.fillStyle = "#FF5555";
      ctx.fillRect(4, 8, 4, 2);
      refreshTex("entity_mushroom");
    }

    // Star — golden spinning star
    {
      const ctx = makeCanvas("entity_star", 24, 24);
      ctx.fillStyle = "#FFD700";
      ctx.beginPath();
      const cx = 12, cy = 12, outerR = 10, innerR = 4;
      for (let i = 0; i < 5; i++) {
        const outerAngle = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
        const innerAngle = outerAngle + Math.PI / 5;
        ctx.lineTo(cx + Math.cos(outerAngle) * outerR, cy + Math.sin(outerAngle) * outerR);
        ctx.lineTo(cx + Math.cos(innerAngle) * innerR, cy + Math.sin(innerAngle) * innerR);
      }
      ctx.closePath();
      ctx.fill();
      // Highlight
      ctx.fillStyle = "#FFEE88";
      ctx.beginPath();
      ctx.arc(10, 9, 3, 0, Math.PI * 2);
      ctx.fill();
      // Eyes
      ctx.fillStyle = "#222";
      ctx.fillRect(9, 11, 2, 2);
      ctx.fillRect(13, 11, 2, 2);
      refreshTex("entity_star");
    }

    // Fire Flower — orange/red flower
    {
      const ctx = makeCanvas("entity_fire_flower", 24, 28);
      // Stem
      ctx.fillStyle = "#228B22";
      ctx.fillRect(10, 16, 4, 12);
      ctx.fillStyle = "#2EA02E";
      ctx.fillRect(10, 16, 2, 12);
      // Leaf
      ctx.fillStyle = "#33AA33";
      ctx.fillRect(14, 20, 6, 3);
      ctx.fillRect(14, 19, 3, 1);
      // Petals
      const petalColors = ["#FF4400", "#FF6600", "#FF4400", "#FF6600", "#FF4400"];
      const petalAngles = [0, 1, 2, 3, 4];
      for (let i = 0; i < 5; i++) {
        ctx.fillStyle = petalColors[i];
        const angle = (petalAngles[i] * 2 * Math.PI) / 5 - Math.PI / 2;
        const px = 12 + Math.cos(angle) * 7;
        const py = 10 + Math.sin(angle) * 7;
        ctx.beginPath();
        ctx.arc(px, py, 4, 0, Math.PI * 2);
        ctx.fill();
      }
      // Center
      ctx.fillStyle = "#FFD700";
      ctx.beginPath();
      ctx.arc(12, 10, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#FFF";
      ctx.fillRect(11, 9, 2, 2);
      refreshTex("entity_fire_flower");
    }

    // ============================================================
    // NEW TILES
    // ============================================================

    // Power-Up Block — pink/magenta ? block variant
    {
      const ctx = makeCanvas("tile_powerup_block", S, S);
      ctx.fillStyle = "#CC44CC";
      ctx.fillRect(0, 0, S, S);
      ctx.fillStyle = "#DD66DD";
      ctx.fillRect(0, 0, S, 3);
      ctx.fillRect(0, 0, 3, S);
      ctx.fillStyle = "#993399";
      ctx.fillRect(0, S - 3, S, 3);
      ctx.fillRect(S - 3, 0, 3, S);
      ctx.fillStyle = "#BB55BB";
      ctx.fillRect(3, 3, S - 6, S - 6);
      // Star symbol
      ctx.fillStyle = "#FFD700";
      const scx = S / 2, scy = S / 2;
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const oA = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
        const iA = oA + Math.PI / 5;
        ctx.lineTo(scx + Math.cos(oA) * 8, scy + Math.sin(oA) * 8);
        ctx.lineTo(scx + Math.cos(iA) * 3, scy + Math.sin(iA) * 3);
      }
      ctx.closePath();
      ctx.fill();
      // Rivets
      ctx.fillStyle = "#AA44AA";
      ctx.fillRect(4, 4, 3, 3);
      ctx.fillRect(S - 7, 4, 3, 3);
      ctx.fillRect(4, S - 7, 3, 3);
      ctx.fillRect(S - 7, S - 7, 3, 3);
      refreshTex("tile_powerup_block");
    }

    // Slide Block — blue brick with arrows
    {
      const ctx = makeCanvas("tile_slide_block", S, S);
      ctx.fillStyle = "#5566CC";
      ctx.fillRect(0, 0, S, S);
      ctx.fillStyle = "#6677DD";
      ctx.fillRect(0, 0, S, 3);
      ctx.fillRect(0, 0, 3, S);
      ctx.fillStyle = "#4455AA";
      ctx.fillRect(0, S - 3, S, 3);
      ctx.fillRect(S - 3, 0, 3, S);
      ctx.fillStyle = "#5F70CC";
      ctx.fillRect(3, 3, S - 6, S - 6);
      // Arrow (pointing right)
      ctx.fillStyle = "#AABBFF";
      ctx.beginPath();
      ctx.moveTo(8, 10);
      ctx.lineTo(24, 16);
      ctx.lineTo(8, 22);
      ctx.closePath();
      ctx.fill();
      refreshTex("tile_slide_block");
    }

    // Timed Block — pink/translucent block with clock symbol
    {
      const ctx = makeCanvas("tile_timed_block", S, S);
      ctx.fillStyle = "#DD5599";
      ctx.fillRect(0, 0, S, S);
      ctx.fillStyle = "#EE77AA";
      ctx.fillRect(0, 0, S, 3);
      ctx.fillRect(0, 0, 3, S);
      ctx.fillStyle = "#BB3377";
      ctx.fillRect(0, S - 3, S, 3);
      ctx.fillRect(S - 3, 0, 3, S);
      // Clock outline
      ctx.fillStyle = "#FFF";
      ctx.beginPath();
      ctx.arc(S / 2, S / 2, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#DD5599";
      ctx.beginPath();
      ctx.arc(S / 2, S / 2, 6, 0, Math.PI * 2);
      ctx.fill();
      // Clock hands
      ctx.fillStyle = "#FFF";
      ctx.fillRect(S / 2 - 1, S / 2 - 5, 2, 6);
      ctx.fillRect(S / 2, S / 2, 4, 2);
      refreshTex("tile_timed_block");
    }

    // Gravity Zone — pink recessed floor panel (particles show upward direction)
    {
      const ctx = makeCanvas("tile_gravity_zone", S, S);
      const pw = Math.floor(S * 0.75); // 24px
      const ph = Math.floor(S * 0.25); // 8px
      const px = Math.floor((S - pw) / 2); // 4px from each side
      const py = S - ph; // sits at bottom of tile
      // Recess shadow
      ctx.fillStyle = "rgba(60,0,30,0.5)";
      ctx.fillRect(px - 1, py - 1, pw + 2, ph + 2);
      // Main panel — magenta/pink
      ctx.fillStyle = "#CC3388";
      ctx.fillRect(px, py, pw, ph);
      // Top highlight
      ctx.fillStyle = "#FF66AA";
      ctx.fillRect(px + 1, py, pw - 2, 2);
      // Bottom shadow
      ctx.fillStyle = "#881155";
      ctx.fillRect(px + 1, py + ph - 2, pw - 2, 2);
      // Side bevels
      ctx.fillStyle = "#AA2266";
      ctx.fillRect(px, py + 1, 1, ph - 2);
      ctx.fillRect(px + pw - 1, py + 1, 1, ph - 2);
      // Inner glow strip
      ctx.fillStyle = "rgba(255,150,220,0.5)";
      ctx.fillRect(px + 3, py + 3, pw - 6, 1);
      // Small energy dots
      ctx.fillStyle = "rgba(255,180,230,0.7)";
      ctx.fillRect(px + 5, py + 3, 2, 2);
      ctx.fillRect(px + pw - 7, py + 3, 2, 2);
      refreshTex("tile_gravity_zone");
    }

    // Gravity Normal — pink recessed ceiling panel (stuck to block above)
    {
      const ctx = makeCanvas("tile_gravity_normal", S, S);
      const pw = Math.floor(S * 0.75);
      const ph = Math.floor(S * 0.25);
      const px = Math.floor((S - pw) / 2);
      const py = 0; // top of tile — flush with ceiling
      // Recess shadow
      ctx.fillStyle = "rgba(30,0,60,0.5)";
      ctx.fillRect(px - 1, py - 1, pw + 2, ph + 2);
      // Main panel — slightly cooler pink
      ctx.fillStyle = "#BB2288";
      ctx.fillRect(px, py, pw, ph);
      // Top highlight
      ctx.fillStyle = "#771155";
      ctx.fillRect(px + 1, py, pw - 2, 2);
      // Bottom highlight (light comes from below when on ceiling)
      ctx.fillStyle = "#EE55AA";
      ctx.fillRect(px + 1, py + ph - 2, pw - 2, 2);
      // Side bevels
      ctx.fillStyle = "#992266";
      ctx.fillRect(px, py + 1, 1, ph - 2);
      ctx.fillRect(px + pw - 1, py + 1, 1, ph - 2);
      // Inner glow strip
      ctx.fillStyle = "rgba(240,130,210,0.5)";
      ctx.fillRect(px + 3, py + ph - 4, pw - 6, 1);
      // Small energy dots
      ctx.fillStyle = "rgba(240,160,220,0.7)";
      ctx.fillRect(px + 5, py + ph - 5, 2, 2);
      ctx.fillRect(px + pw - 7, py + ph - 5, 2, 2);
      refreshTex("tile_gravity_normal");
    }

    // Moving Platform — metallic platform with gears
    {
      const ctx = makeCanvas("tile_moving_platform", S, S);
      ctx.fillStyle = "#448888";
      ctx.fillRect(0, 0, S, 12);
      // Top highlight
      ctx.fillStyle = "#55BBAA";
      ctx.fillRect(0, 0, S, 3);
      // Bottom shadow
      ctx.fillStyle = "#336666";
      ctx.fillRect(0, 10, S, 2);
      // Gear details
      ctx.fillStyle = "#66CCBB";
      ctx.fillRect(4, 4, 3, 3);
      ctx.fillRect(25, 4, 3, 3);
      // Rails indicator
      ctx.fillStyle = "#3A7A7A";
      ctx.fillRect(0, 12, S, 2);
      ctx.fillStyle = "#55AA99";
      ctx.fillRect(8, 12, 2, 2);
      ctx.fillRect(22, 12, 2, 2);
      refreshTex("tile_moving_platform");
    }

    // Fireball projectile
    {
      const ctx = makeCanvas("entity_fireball", 10, 10);
      ctx.fillStyle = "#FF4400";
      ctx.beginPath();
      ctx.arc(5, 5, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#FF8800";
      ctx.beginPath();
      ctx.arc(4, 4, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#FFCC00";
      ctx.beginPath();
      ctx.arc(3, 3, 1.5, 0, Math.PI * 2);
      ctx.fill();
      refreshTex("entity_fireball");
    }

    // ============================================================
    // NEW FEATURE TILES & ENTITIES
    // ============================================================

    // Teleporter A — blue swirling portal
    {
      const ctx = makeCanvas("tile_teleporter_a", S, S);
      ctx.fillStyle = "#111133";
      ctx.fillRect(0, 0, S, S);
      ctx.strokeStyle = "#4488FF";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(S / 2, S / 2, 12, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = "#88BBFF";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(S / 2, S / 2, 8, 0, Math.PI * 1.5);
      ctx.stroke();
      ctx.fillStyle = "#4488FF";
      ctx.beginPath();
      ctx.arc(S / 2, S / 2, 4, 0, Math.PI * 2);
      ctx.fill();
      refreshTex("tile_teleporter_a");
    }

    // Teleporter B — orange swirling portal
    {
      const ctx = makeCanvas("tile_teleporter_b", S, S);
      ctx.fillStyle = "#331111";
      ctx.fillRect(0, 0, S, S);
      ctx.strokeStyle = "#FF8844";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(S / 2, S / 2, 12, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = "#FFBB88";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(S / 2, S / 2, 8, 0, Math.PI * 1.5);
      ctx.stroke();
      ctx.fillStyle = "#FF8844";
      ctx.beginPath();
      ctx.arc(S / 2, S / 2, 4, 0, Math.PI * 2);
      ctx.fill();
      refreshTex("tile_teleporter_b");
    }

    // Cannon Left
    {
      const ctx = makeCanvas("tile_cannon_left", S, S);
      ctx.fillStyle = "#333333";
      ctx.fillRect(0, 0, S, S);
      ctx.fillStyle = "#555555";
      ctx.fillRect(2, 2, S - 4, S - 4);
      // Barrel pointing left
      ctx.fillStyle = "#222222";
      ctx.fillRect(0, 10, 16, 12);
      ctx.fillStyle = "#444444";
      ctx.fillRect(0, 12, 14, 8);
      // Muzzle
      ctx.fillStyle = "#111111";
      ctx.fillRect(0, 11, 4, 10);
      refreshTex("tile_cannon_left");
    }

    // Cannon Right
    {
      const ctx = makeCanvas("tile_cannon_right", S, S);
      ctx.fillStyle = "#333333";
      ctx.fillRect(0, 0, S, S);
      ctx.fillStyle = "#555555";
      ctx.fillRect(2, 2, S - 4, S - 4);
      ctx.fillStyle = "#222222";
      ctx.fillRect(16, 10, 16, 12);
      ctx.fillStyle = "#444444";
      ctx.fillRect(18, 12, 14, 8);
      ctx.fillStyle = "#111111";
      ctx.fillRect(28, 11, 4, 10);
      refreshTex("tile_cannon_right");
    }

    // Cannon Up
    {
      const ctx = makeCanvas("tile_cannon_up", S, S);
      ctx.fillStyle = "#333333";
      ctx.fillRect(0, 0, S, S);
      ctx.fillStyle = "#555555";
      ctx.fillRect(2, 2, S - 4, S - 4);
      ctx.fillStyle = "#222222";
      ctx.fillRect(10, 0, 12, 16);
      ctx.fillStyle = "#444444";
      ctx.fillRect(12, 0, 8, 14);
      ctx.fillStyle = "#111111";
      ctx.fillRect(11, 0, 10, 4);
      refreshTex("tile_cannon_up");
    }

    // Cannon Down
    {
      const ctx = makeCanvas("tile_cannon_down", S, S);
      ctx.fillStyle = "#333333";
      ctx.fillRect(0, 0, S, S);
      ctx.fillStyle = "#555555";
      ctx.fillRect(2, 2, S - 4, S - 4);
      ctx.fillStyle = "#222222";
      ctx.fillRect(10, 16, 12, 16);
      ctx.fillStyle = "#444444";
      ctx.fillRect(12, 18, 8, 14);
      ctx.fillStyle = "#111111";
      ctx.fillRect(11, 28, 10, 4);
      refreshTex("tile_cannon_down");
    }

    // Sticky Block — honey/amber gooey surface
    {
      const ctx = makeCanvas("tile_sticky_block", S, S);
      ctx.fillStyle = "#AA8822";
      ctx.fillRect(0, 0, S, S);
      ctx.fillStyle = "#CCAA33";
      ctx.fillRect(2, 2, S - 4, S - 4);
      // Drip effect
      ctx.fillStyle = "#DDBB44";
      ctx.fillRect(8, S - 6, 4, 6);
      ctx.fillRect(20, S - 4, 3, 4);
      // Gooey highlights
      ctx.fillStyle = "#EEDD66";
      ctx.fillRect(4, 4, 6, 3);
      ctx.fillRect(18, 8, 8, 3);
      refreshTex("tile_sticky_block");
    }

    // Key Red
    {
      const ctx = makeCanvas("tile_key_red", S, S);
      ctx.fillStyle = "#FF4444";
      ctx.beginPath();
      ctx.arc(S / 2, 10, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(S / 2 - 2, 14, 4, 14);
      ctx.fillRect(S / 2, 24, 6, 3);
      ctx.fillRect(S / 2, 20, 4, 3);
      refreshTex("tile_key_red");
    }

    // Key Blue
    {
      const ctx = makeCanvas("tile_key_blue", S, S);
      ctx.fillStyle = "#4444FF";
      ctx.beginPath();
      ctx.arc(S / 2, 10, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(S / 2 - 2, 14, 4, 14);
      ctx.fillRect(S / 2, 24, 6, 3);
      ctx.fillRect(S / 2, 20, 4, 3);
      refreshTex("tile_key_blue");
    }

    // Key Green
    {
      const ctx = makeCanvas("tile_key_green", S, S);
      ctx.fillStyle = "#44FF44";
      ctx.beginPath();
      ctx.arc(S / 2, 10, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(S / 2 - 2, 14, 4, 14);
      ctx.fillRect(S / 2, 24, 6, 3);
      ctx.fillRect(S / 2, 20, 4, 3);
      refreshTex("tile_key_green");
    }

    // Lock Red
    {
      const ctx = makeCanvas("tile_lock_red", S, S);
      ctx.fillStyle = "#CC3333";
      ctx.fillRect(0, 0, S, S);
      ctx.fillStyle = "#AA2222";
      ctx.fillRect(2, 2, S - 4, S - 4);
      // Keyhole
      ctx.fillStyle = "#FFD700";
      ctx.beginPath();
      ctx.arc(S / 2, S / 2 - 3, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(S / 2 - 2, S / 2, 4, 8);
      refreshTex("tile_lock_red");
    }

    // Lock Blue
    {
      const ctx = makeCanvas("tile_lock_blue", S, S);
      ctx.fillStyle = "#3333CC";
      ctx.fillRect(0, 0, S, S);
      ctx.fillStyle = "#2222AA";
      ctx.fillRect(2, 2, S - 4, S - 4);
      ctx.fillStyle = "#FFD700";
      ctx.beginPath();
      ctx.arc(S / 2, S / 2 - 3, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(S / 2 - 2, S / 2, 4, 8);
      refreshTex("tile_lock_blue");
    }

    // Lock Green
    {
      const ctx = makeCanvas("tile_lock_green", S, S);
      ctx.fillStyle = "#33CC33";
      ctx.fillRect(0, 0, S, S);
      ctx.fillStyle = "#22AA22";
      ctx.fillRect(2, 2, S - 4, S - 4);
      ctx.fillStyle = "#FFD700";
      ctx.beginPath();
      ctx.arc(S / 2, S / 2 - 3, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(S / 2 - 2, S / 2, 4, 8);
      refreshTex("tile_lock_green");
    }

    // Ice Breakable — cracked ice block
    {
      const ctx = makeCanvas("tile_ice_breakable", S, S);
      ctx.fillStyle = "#88DDFF";
      ctx.fillRect(0, 0, S, S);
      ctx.fillStyle = "#AAEEFF";
      ctx.fillRect(2, 2, S - 4, S - 4);
      // Cracks
      ctx.strokeStyle = "#4488AA";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(8, 0); ctx.lineTo(16, 16); ctx.lineTo(24, 4);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(4, 20); ctx.lineTo(16, 16); ctx.lineTo(28, 28);
      ctx.stroke();
      // Highlight
      ctx.fillStyle = "#CCFFFF";
      ctx.fillRect(4, 4, 8, 3);
      refreshTex("tile_ice_breakable");
    }

    // Wind Up
    {
      const ctx = makeCanvas("tile_wind_up", S, S);
      ctx.fillStyle = "rgba(170,238,255,0.2)";
      ctx.fillRect(0, 0, S, S);
      // Upward arrows
      ctx.strokeStyle = "rgba(170,238,255,0.6)";
      ctx.lineWidth = 2;
      for (let i = 0; i < 3; i++) {
        const x = 8 + i * 8;
        ctx.beginPath();
        ctx.moveTo(x, 24); ctx.lineTo(x, 8);
        ctx.moveTo(x - 3, 12); ctx.lineTo(x, 8); ctx.lineTo(x + 3, 12);
        ctx.stroke();
      }
      refreshTex("tile_wind_up");
    }

    // Wind Down
    {
      const ctx = makeCanvas("tile_wind_down", S, S);
      ctx.fillStyle = "rgba(170,238,255,0.2)";
      ctx.fillRect(0, 0, S, S);
      ctx.strokeStyle = "rgba(170,238,255,0.6)";
      ctx.lineWidth = 2;
      for (let i = 0; i < 3; i++) {
        const x = 8 + i * 8;
        ctx.beginPath();
        ctx.moveTo(x, 8); ctx.lineTo(x, 24);
        ctx.moveTo(x - 3, 20); ctx.lineTo(x, 24); ctx.lineTo(x + 3, 20);
        ctx.stroke();
      }
      refreshTex("tile_wind_down");
    }

    // Wind Left
    {
      const ctx = makeCanvas("tile_wind_left", S, S);
      ctx.fillStyle = "rgba(170,238,255,0.2)";
      ctx.fillRect(0, 0, S, S);
      ctx.strokeStyle = "rgba(170,238,255,0.6)";
      ctx.lineWidth = 2;
      for (let i = 0; i < 3; i++) {
        const y = 8 + i * 8;
        ctx.beginPath();
        ctx.moveTo(24, y); ctx.lineTo(8, y);
        ctx.moveTo(12, y - 3); ctx.lineTo(8, y); ctx.lineTo(12, y + 3);
        ctx.stroke();
      }
      refreshTex("tile_wind_left");
    }

    // Wind Right
    {
      const ctx = makeCanvas("tile_wind_right", S, S);
      ctx.fillStyle = "rgba(170,238,255,0.2)";
      ctx.fillRect(0, 0, S, S);
      ctx.strokeStyle = "rgba(170,238,255,0.6)";
      ctx.lineWidth = 2;
      for (let i = 0; i < 3; i++) {
        const y = 8 + i * 8;
        ctx.beginPath();
        ctx.moveTo(8, y); ctx.lineTo(24, y);
        ctx.moveTo(20, y - 3); ctx.lineTo(24, y); ctx.lineTo(20, y + 3);
        ctx.stroke();
      }
      refreshTex("tile_wind_right");
    }

    // Mirror block — reflective metallic surface
    {
      const ctx = makeCanvas("tile_mirror", S, S);
      ctx.fillStyle = "#A0A0A0";
      ctx.fillRect(0, 0, S, S);
      ctx.fillStyle = "#C0C0C0";
      ctx.fillRect(2, 2, S - 4, S - 4);
      // Specular highlight diagonal
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(4, 4, 3, 3);
      ctx.fillRect(8, 8, 3, 3);
      ctx.fillRect(12, 12, 3, 3);
      ctx.fillStyle = "#E0E0E0";
      ctx.fillRect(20, 4, 6, 2);
      ctx.fillRect(4, 22, 8, 2);
      // Border bevel
      ctx.fillStyle = "#888888";
      ctx.fillRect(0, 0, S, 2);
      ctx.fillRect(0, 0, 2, S);
      ctx.fillStyle = "#666666";
      ctx.fillRect(0, S - 2, S, 2);
      ctx.fillRect(S - 2, 0, 2, S);
      refreshTex("tile_mirror");
    }

    // Sign Custom — wooden sign with quill mark
    {
      const ctx = makeCanvas("tile_sign_custom", S, S);
      // Post
      ctx.fillStyle = "#6B4226";
      ctx.fillRect(14, 20, 4, 12);
      // Board
      ctx.fillStyle = "#C09840";
      ctx.fillRect(4, 4, 24, 18);
      ctx.fillStyle = "#D4A84A";
      ctx.fillRect(6, 6, 20, 14);
      // Text lines
      ctx.fillStyle = "#333333";
      ctx.fillRect(8, 8, 16, 2);
      ctx.fillRect(8, 12, 12, 2);
      ctx.fillRect(8, 16, 14, 2);
      refreshTex("tile_sign_custom");
    }

    // Ghost enemy — spooky translucent entity
    {
      const ctx = makeCanvas("entity_ghost", 24, 28);
      ctx.globalAlpha = 0.7;
      // Body
      ctx.fillStyle = "#AACCFF";
      ctx.fillRect(4, 4, 16, 16);
      ctx.fillRect(2, 8, 20, 10);
      // Head
      ctx.fillRect(6, 0, 12, 8);
      // Wavy bottom
      ctx.fillRect(2, 18, 4, 6);
      ctx.fillRect(10, 18, 4, 8);
      ctx.fillRect(18, 18, 4, 6);
      // Eyes
      ctx.globalAlpha = 1;
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(6, 6, 4, 5);
      ctx.fillRect(14, 6, 4, 5);
      ctx.fillStyle = "#000000";
      ctx.fillRect(8, 8, 2, 3);
      ctx.fillRect(16, 8, 2, 3);
      refreshTex("entity_ghost");
    }

    // Shooter enemy — turtle-like with cannon on back
    {
      const ctx = makeCanvas("entity_shooter", 24, 28);
      // Body
      ctx.fillStyle = "#558855";
      ctx.fillRect(4, 12, 16, 12);
      // Shell with cannon
      ctx.fillStyle = "#446644";
      ctx.fillRect(2, 6, 20, 10);
      // Cannon barrel
      ctx.fillStyle = "#333333";
      ctx.fillRect(18, 4, 8, 6);
      ctx.fillStyle = "#444444";
      ctx.fillRect(20, 5, 6, 4);
      // Head
      ctx.fillStyle = "#66AA66";
      ctx.fillRect(2, 8, 8, 8);
      // Eye
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(4, 10, 3, 3);
      ctx.fillStyle = "#000000";
      ctx.fillRect(5, 11, 2, 2);
      // Feet
      ctx.fillStyle = "#558855";
      ctx.fillRect(4, 24, 5, 4);
      ctx.fillRect(15, 24, 5, 4);
      refreshTex("entity_shooter");
    }

    // Giant Goomba — oversized angry goomba
    {
      const ctx = makeCanvas("entity_giant_goomba", 66, 84);
      // Body
      ctx.fillStyle = "#8B4513";
      ctx.fillRect(10, 20, 46, 44);
      // Head dome
      ctx.fillStyle = "#A0522D";
      ctx.beginPath();
      ctx.arc(33, 24, 28, Math.PI, 0);
      ctx.fill();
      // Angry eyes
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(14, 28, 14, 12);
      ctx.fillRect(38, 28, 14, 12);
      ctx.fillStyle = "#000000";
      ctx.fillRect(20, 30, 8, 8);
      ctx.fillRect(42, 30, 8, 8);
      // Angry eyebrows
      ctx.fillStyle = "#000000";
      ctx.fillRect(14, 24, 14, 3);
      ctx.fillRect(38, 24, 14, 3);
      // Mouth (frowning)
      ctx.fillStyle = "#000000";
      ctx.fillRect(20, 48, 26, 4);
      // Teeth
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(24, 44, 6, 4);
      ctx.fillRect(36, 44, 6, 4);
      // Feet
      ctx.fillStyle = "#4A3010";
      ctx.fillRect(10, 64, 18, 20);
      ctx.fillRect(38, 64, 18, 20);
      // Sole
      ctx.fillStyle = "#5A4020";
      ctx.fillRect(10, 76, 18, 8);
      ctx.fillRect(38, 76, 18, 8);
      refreshTex("entity_giant_goomba");
    }

    // Saw Blade — spinning metal disc
    {
      const ctx = makeCanvas("entity_saw_blade", S, S);
      ctx.fillStyle = "#888888";
      ctx.beginPath();
      ctx.arc(S / 2, S / 2, 14, 0, Math.PI * 2);
      ctx.fill();
      // Inner circle
      ctx.fillStyle = "#666666";
      ctx.beginPath();
      ctx.arc(S / 2, S / 2, 8, 0, Math.PI * 2);
      ctx.fill();
      // Center hole
      ctx.fillStyle = "#444444";
      ctx.beginPath();
      ctx.arc(S / 2, S / 2, 3, 0, Math.PI * 2);
      ctx.fill();
      // Teeth (8 around the edge)
      ctx.fillStyle = "#AAAAAA";
      for (let a = 0; a < 8; a++) {
        const angle = (a / 8) * Math.PI * 2;
        const tx = S / 2 + Math.cos(angle) * 13;
        const ty = S / 2 + Math.sin(angle) * 13;
        ctx.fillRect(tx - 2, ty - 2, 4, 4);
      }
      refreshTex("entity_saw_blade");
    }

    // Slow Motion power-up — blue clock
    {
      const ctx = makeCanvas("entity_slowmo", 20, 20);
      ctx.fillStyle = "#4488FF";
      ctx.beginPath();
      ctx.arc(10, 10, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#88BBFF";
      ctx.beginPath();
      ctx.arc(10, 10, 7, 0, Math.PI * 2);
      ctx.fill();
      // Clock hands
      ctx.strokeStyle = "#222244";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(10, 10); ctx.lineTo(10, 4);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(10, 10); ctx.lineTo(14, 10);
      ctx.stroke();
      // Center dot
      ctx.fillStyle = "#222244";
      ctx.beginPath();
      ctx.arc(10, 10, 1.5, 0, Math.PI * 2);
      ctx.fill();
      refreshTex("entity_slowmo");
    }

    // Cannon Bullet — small dark sphere
    {
      const ctx = makeCanvas("entity_cannon_bullet", 10, 10);
      ctx.fillStyle = "#222222";
      ctx.beginPath();
      ctx.arc(5, 5, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#444444";
      ctx.beginPath();
      ctx.arc(4, 4, 2, 0, Math.PI * 2);
      ctx.fill();
      refreshTex("entity_cannon_bullet");
    }

    // Shooter Bullet — small green energy ball
    {
      const ctx = makeCanvas("entity_shooter_bullet", 8, 8);
      ctx.fillStyle = "#44FF44";
      ctx.beginPath();
      ctx.arc(4, 4, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#88FF88";
      ctx.beginPath();
      ctx.arc(3, 3, 2, 0, Math.PI * 2);
      ctx.fill();
      refreshTex("entity_shooter_bullet");
    }

    // Wind particle (small arrow-like)
    {
      const ctx = makeCanvas("particle_wind", 4, 4);
      ctx.fillStyle = "rgba(170,238,255,0.5)";
      ctx.fillRect(0, 1, 4, 2);
      refreshTex("particle_wind");
    }

    // ============================================================
    // PARTICLES
    // ============================================================

    // Trail particle (small 3x3)
    {
      const ctx = makeCanvas("particle_trail", 3, 3);
      ctx.fillStyle = "#FFF";
      ctx.fillRect(0, 0, 3, 3);
      refreshTex("particle_trail");
    }

    // Death pixel block (6x6 for pixelate effect)
    {
      const ctx = makeCanvas("particle_pixel", 6, 6);
      ctx.fillStyle = "#FF8C00";
      ctx.fillRect(0, 0, 6, 6);
      refreshTex("particle_pixel");
    }

    // Ghost sprite (semi-transparent detailed cat silhouette)
    {
      const ctx = makeCanvas("particle_ghost", 22, 28);
      ctx.globalAlpha = 0.6;
      ctx.fillStyle = "#AACCFF";
      ctx.fillRect(3, 8, 16, 14);
      ctx.fillRect(2, 0, 18, 10);
      // Ears silhouette
      ctx.fillRect(2, 0, 5, 4);
      ctx.fillRect(15, 0, 5, 4);
      // Legs
      ctx.fillRect(4, 22, 5, 6);
      ctx.fillRect(13, 22, 5, 6);
      // Faint eyes
      ctx.globalAlpha = 0.8;
      ctx.fillStyle = "#DDEEFF";
      ctx.fillRect(5, 2, 4, 5);
      ctx.fillRect(13, 2, 4, 5);
      ctx.globalAlpha = 1;
      refreshTex("particle_ghost");
    }

    // Glass shard (angular fragment for shatter)
    {
      const ctx = makeCanvas("particle_shard", 8, 8);
      ctx.fillStyle = "#CCDDFF";
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(8, 3);
      ctx.lineTo(2, 8);
      ctx.closePath();
      ctx.fill();
      refreshTex("particle_shard");
    }

    // Extract palette textures as data URLs for React UI
    populateTextureCache(this.textures);
  }
}
