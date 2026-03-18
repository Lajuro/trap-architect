import * as Phaser from "phaser";
import {
  TILE_SIZE,
  GAME_WIDTH,
  GAME_HEIGHT,
  GRAVITY,
  JUMP_FORCE,
  PLAYER_SPEED,
  MAX_FALL,
  PLAYER_W,
  PLAYER_H,
  ICE_FRICTION,
  CONVEYOR_SPEED,
  SPRING_MULTIPLIER,
  TRAMPOLINE_MULTIPLIER,
  FAKE_GROUND_TIMER,
  HIDDEN_SPIKE_RUMBLE,
  HIDDEN_SPIKE_EMERGE,
  HIDDEN_SPIKE_HOLD,
  HIDDEN_SPIKE_RETRACT,
  SOLID_TILES,
  ONEWAY_TILES,
  LETHAL_TILES,
  FIXED_STEP,
  MAX_ACCUMULATED,
  STAR_DURATION,
  FIRE_FLOWER_DURATION,
  MUSHROOM_SPEED_BOOST,
  POWERUP_MOVE_SPEED,
  POWERUP_GRAVITY,
  WALL_JUMP_FORCE_X,
  WALL_JUMP_FORCE_Y,
  WALL_SLIDE_SPEED,
  DASH_SPEED,
  DASH_DURATION,
  GRAVITY_FLIP_DEFAULT_DURATION,
  TIMED_BLOCK_ON,
  TIMED_BLOCK_OFF,
  SLIDE_BLOCK_SPEED,
  MOVING_PLATFORM_DEFAULT_SPEED,
  MOVING_PLATFORM_DEFAULT_RANGE,
} from "../constants";
import { TileType, type ParsedLevel, type GameEntity, type SlideBlockConfig, type MovingPlatformConfig, type PowerUpType } from "../types";
import { gameEvents, GAME_EVENTS } from "../events";
import { DEMO_LEVEL } from "../levels/demo";
import { getCampaignLevel, CAMPAIGN_LEVELS } from "../levels/campaign";
import { playJump, playDeath, playCoin, playComplete, playSpring, playStomp, playBGM, isSoundEnabled, isMusicEnabled, setMusicEnabled, setSoundEnabled, stopBGM, playPowerUp, playWallJump, playDash, playGravityFlip, playSlideBlock, playFireball } from "../audio";

interface PlayerSprite extends Phaser.GameObjects.Image {
  vx: number;
  vy: number;
  grounded: boolean;
  jumpHeld: boolean;
  alive: boolean;
  dir: 1 | -1;
}

interface CrumblingTile {
  gx: number;
  gy: number;
  timer: number;
}

interface SpikeAnimation {
  gx: number;
  gy: number;
  phase: "rumble" | "emerge" | "hold" | "retract";
  timer: number;
  spikeSprite: Phaser.GameObjects.Image | null;
  killed: boolean;
}

interface SlideBlockAnim {
  config: SlideBlockConfig;
  currentX: number;
  currentY: number;
  targetX: number;
  targetY: number;
  sprite: Phaser.GameObjects.Image | null;
  done: boolean;
}

interface MovingPlatformState {
  config: MovingPlatformConfig;
  x: number;
  y: number;
  dir: number;
  sprite: Phaser.GameObjects.Image;
}

interface Fireball {
  x: number;
  y: number;
  vx: number;
  vy: number;
  bounces: number;
  sprite: Phaser.GameObjects.Image;
  alive: boolean;
}

interface StateSnapshot {
  tiles: number[][];
  entities: GameEntity[];
  coins: number;
  trollTriggered: boolean[];
  slideBlocks: SlideBlockConfig[];
}

export class GameScene extends Phaser.Scene {
  private player!: PlayerSprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keyW!: Phaser.Input.Keyboard.Key;
  private keyA!: Phaser.Input.Keyboard.Key;
  private keyD!: Phaser.Input.Keyboard.Key;
  private keySpace!: Phaser.Input.Keyboard.Key;
  private level!: ParsedLevel;
  private levelIndex = -1;
  private tileSprites: (Phaser.GameObjects.Image | null)[][] = [];
  private entitySprites: Phaser.GameObjects.Image[] = [];
  private entities: GameEntity[] = [];
  private coins = 0;
  private deaths = 0;
  private crumbling: CrumblingTile[] = [];
  private spikeAnims: SpikeAnimation[] = [];
  private hudCoins!: Phaser.GameObjects.Text;
  private hudDeaths!: Phaser.GameObjects.Text;
  private hudTime!: Phaser.GameObjects.Text;
  private levelNameText!: Phaser.GameObjects.Text;
  private levelNameTimer = 0;
  // Particles
  private deathEmitter!: Phaser.GameObjects.Particles.ParticleEmitter;
  private jumpEmitter!: Phaser.GameObjects.Particles.ParticleEmitter;
  private coinEmitter!: Phaser.GameObjects.Particles.ParticleEmitter;
  private trailEmitter: Phaser.GameObjects.Particles.ParticleEmitter | null = null;
  // Pause
  private paused = false;
  private pauseOverlay: Phaser.GameObjects.GameObject[] = [];
  // Time tracking
  private startTime = 0;
  private elapsedMs = 0;
  private pauseStartTime = 0;
  private totalPausedMs = 0;
  // Fixed timestep
  private accumulator = 0;
  private frame = 0;
  private wasGrounded = true;
  // Parallax
  private parallaxGfx!: Phaser.GameObjects.Graphics;
  // Activated checkpoints
  private activatedCheckpoints = new Set<string>();
  // State snapshot for respawn restoration
  private snapshot!: StateSnapshot;
  // Power-up state
  private powered = false;
  private powerType: PowerUpType | null = null;
  private powerTimer = 0;
  // Wall jump state
  private wallSliding = false;
  private wallDir: 1 | -1 | 0 = 0;
  // Dash state
  private canDash = true;
  private dashing = false;
  private dashTimer = 0;
  // Gravity flip state
  private gravityFlipped = false;
  private gravityFlipTimer = 0;
  // Slide blocks
  private slideBlockAnims: SlideBlockAnim[] = [];
  // Moving platforms
  private movingPlatforms: MovingPlatformState[] = [];
  // Timed blocks state
  private timedBlockTimer = 0;
  private timedBlockVisible = true;
  // Fireballs
  private fireballs: Fireball[] = [];
  // Power-up indicator HUD
  private hudPower!: Phaser.GameObjects.Text;
  // Dash indicator
  private hudDash!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: "GameScene" });
  }

  init(data?: { levelIndex?: number; customLevel?: ParsedLevel }): void {
    if (data?.customLevel) {
      this.level = data.customLevel;
      this.levelIndex = -1;
    } else if (data?.levelIndex !== undefined) {
      this.level = getCampaignLevel(data.levelIndex) ?? DEMO_LEVEL;
      this.levelIndex = data.levelIndex;
    } else {
      this.level = DEMO_LEVEL;
      this.levelIndex = -1;
    }
  }

  create(): void {
    this.coins = 0;
    this.deaths = 0;
    this.crumbling = [];
    this.spikeAnims.forEach((s) => s.spikeSprite?.destroy());
    this.spikeAnims = [];
    this.activatedCheckpoints.clear();
    this.startTime = Date.now();
    this.elapsedMs = 0;
    this.pauseStartTime = 0;
    this.totalPausedMs = 0;
    // Reset new mechanics
    this.powered = false;
    this.powerType = null;
    this.powerTimer = 0;
    this.wallSliding = false;
    this.wallDir = 0;
    this.canDash = true;
    this.dashing = false;
    this.dashTimer = 0;
    this.gravityFlipped = false;
    this.gravityFlipTimer = 0;
    this.slideBlockAnims = [];
    this.timedBlockTimer = 0;
    this.timedBlockVisible = true;
    this.fireballs.forEach(f => f.sprite.destroy());
    this.fireballs = [];

    this.cameras.main.setBackgroundColor(this.level.bgColor);

    // Play BGM based on level music field
    const music = this.level.music;
    if (music === "easy" || music === "medium" || music === "hard") {
      playBGM(music);
    } else if (music === "level1") {
      playBGM("easy");
    } else {
      playBGM("medium");
    }

    // Build tile map
    this.buildTileMap();

    // Spawn entities
    this.spawnEntities();

    // Initialize moving platforms
    this.initMovingPlatforms();

    // Initialize slide blocks
    this.initSlideBlocks();

    // Create player
    this.createPlayer();

    // Camera follow
    this.cameras.main.setBounds(0, 0, this.level.width * TILE_SIZE, this.level.height * TILE_SIZE);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

    // Input
    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
      this.keyW = this.input.keyboard.addKey("W");
      this.keyA = this.input.keyboard.addKey("A");
      this.keyD = this.input.keyboard.addKey("D");
      this.keySpace = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    }

    // Parallax background graphics (behind everything)
    this.parallaxGfx = this.add.graphics().setDepth(-10).setScrollFactor(0);

    // HUD (fixed to camera)
    this.hudCoins = this.add
      .text(16, 16, "$ 0", {
        fontFamily: "monospace",
        fontSize: "16px",
        color: "#ffd700",
      })
      .setScrollFactor(0)
      .setDepth(100);

    this.hudDeaths = this.add
      .text(16, 40, "x 0", {
        fontFamily: "monospace",
        fontSize: "16px",
        color: "#ff4444",
      })
      .setScrollFactor(0)
      .setDepth(100);

    this.hudTime = this.add
      .text(16, 64, "T 0s", {
        fontFamily: "monospace",
        fontSize: "16px",
        color: "#aaaaaa",
      })
      .setScrollFactor(0)
      .setDepth(100);

    this.hudPower = this.add
      .text(GAME_WIDTH - 16, 16, "", {
        fontFamily: "monospace",
        fontSize: "14px",
        color: "#ff88ff",
      })
      .setOrigin(1, 0)
      .setScrollFactor(0)
      .setDepth(100);

    this.hudDash = this.add
      .text(GAME_WIDTH - 16, 36, "[SHIFT] Dash", {
        fontFamily: "monospace",
        fontSize: "12px",
        color: "#88ccff",
      })
      .setOrigin(1, 0)
      .setScrollFactor(0)
      .setDepth(100)
      .setAlpha(0.6);

    // Level name overlay
    this.levelNameText = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2, this.level.name, {
        fontFamily: "monospace",
        fontSize: "28px",
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(200)
      .setAlpha(1);
    this.levelNameTimer = 120;

    // Create particle textures and emitters
    this.createParticles();

    // Listen for React events
    gameEvents.on(GAME_EVENTS.RESTART_LEVEL, () => this.restartLevel());

    // ESC / P to toggle pause
    if (this.input.keyboard) {
      this.input.keyboard.on("keydown-ESC", () => {
        if (this.paused) {
          this.resumeGame();
        } else {
          this.pauseGame();
        }
      });
      this.input.keyboard.on("keydown-P", () => {
        if (this.paused) {
          this.resumeGame();
        } else {
          this.pauseGame();
        }
      });
    }

    // Reset fixed timestep
    this.accumulator = 0;
    this.frame = 0;

    // Save initial state snapshot for respawn restoration
    this.saveSnapshot();
  }

  update(_time: number, delta: number): void {
    if (this.paused) return;
    if (!this.player.alive) return;

    // Fixed timestep accumulator — ensures consistent physics on any refresh rate
    this.accumulator += Math.min(delta, MAX_ACCUMULATED);

    while (this.accumulator >= FIXED_STEP) {
      this.accumulator -= FIXED_STEP;
      this.frame++;

      // Level name fade
      if (this.levelNameTimer > 0) {
        this.levelNameTimer--;
        if (this.levelNameTimer < 30) {
          this.levelNameText.setAlpha(this.levelNameTimer / 30);
        }
      }

      // Input
      this.handleInput();

      // Physics
      this.applyPhysics();

      // Landing dust particles
      if (this.player.grounded && !this.wasGrounded) {
        this.emitDustParticles(this.player.x, this.player.y + PLAYER_H / 2);
      }
      this.wasGrounded = this.player.grounded;
      // Crumbling tiles
      this.updateCrumbling();

      // Hidden spike animations
      this.updateHiddenSpikes();

      // Entity updates
      this.updateEntities();

      // Check death by falling
      if (this.player.y > this.level.height * TILE_SIZE + 64) {
        this.playerDie();
        break;
      }

      // Checkpoint activation
      this.checkCheckpoints();

      // Troll triggers
      this.checkTrolls();

      // Trail effect
      this.updateTrail();

      // Power-up timer
      this.updatePowerUpState();

      // Dash timer
      this.updateDashState();

      // Gravity flip timer
      this.updateGravityFlip();

      // Timed blocks
      this.updateTimedBlocks();

      // Slide blocks
      this.updateSlideBlocks();

      // Moving platforms
      this.updateMovingPlatforms();

      // Fireballs
      this.updateFireballs();
    }

    // Per-render updates (visual only, not physics)
    this.drawParallax();
    this.animateTiles();
    this.animatePlayer();

    // Update HUD
    this.hudCoins.setText(`$ ${this.coins}`);
    this.hudDeaths.setText(`x ${this.deaths}`);
    const elapsedSecs = Math.floor((Date.now() - this.startTime - this.totalPausedMs) / 1000);
    this.hudTime.setText(`T ${elapsedSecs}s`);

    // Power-up HUD
    if (this.powered && this.powerType) {
      const names: Record<string, string> = { mushroom: "Cogumelo", star: "Estrela", fire_flower: "Fogo" };
      const secs = Math.ceil(this.powerTimer / 60);
      this.hudPower.setText(`${names[this.powerType] ?? ""} ${secs}s`);
      this.hudPower.setAlpha(this.powerTimer < 120 ? (Math.sin(this.frame * 0.3) * 0.5 + 0.5) : 1);
    } else {
      this.hudPower.setText("");
    }

    // Dash HUD
    this.hudDash.setAlpha(this.canDash ? 0.6 : 0.15);
  }

  // ===========================================================
  // Parallax Background
  // ===========================================================
  private drawParallax(): void {
    const cam = this.cameras.main;
    const camX = cam.scrollX;
    const CW = GAME_WIDTH;
    const CH = GAME_HEIGHT;
    const gfx = this.parallaxGfx;
    gfx.clear();

    // Hills at 30% scroll speed
    gfx.fillStyle(0x22aa22, 0.15);
    for (let i = 0; i < 8; i++) {
      const hx = ((i * 220 - camX * 0.3) % (CW + 400) + CW + 400) % (CW + 400) - 200;
      gfx.fillCircle(hx + 80, CH - 25, 90 + (i % 3) * 15);
    }

    // Clouds at 20% scroll speed
    gfx.fillStyle(0xffffff, 0.2);
    for (let i = 0; i < 10; i++) {
      const cx = ((i * 150 - camX * 0.2) % (CW + 200) + CW + 200) % (CW + 200) - 100;
      const cy = 30 + (i % 4) * 35;
      gfx.fillCircle(cx, cy, 18);
      gfx.fillCircle(cx + 16, cy - 4, 14);
      gfx.fillCircle(cx + 28, cy + 2, 12);
    }
  }

  // ===========================================================
  // Tile Animations (per-render-frame)
  // ===========================================================
  private animateTiles(): void {
    const f = this.frame;
    for (let gy = 0; gy < this.level.height; gy++) {
      for (let gx = 0; gx < this.level.width; gx++) {
        const tile = this.level.tiles[gy]?.[gx] ?? 0;
        const sprite = this.tileSprites[gy]?.[gx];
        if (!sprite) continue;

        if (tile === TileType.QUESTION || tile === TileType.TROLL_Q) {
          // Pulsing question block glow
          const pulse = Math.sin(f * 0.08) * 0.15 + 0.85;
          const tint = Phaser.Display.Color.GetColor(
            Math.floor(255 * pulse),
            Math.floor(204 * pulse),
            0
          );
          sprite.setTint(tint);
        } else if (tile === TileType.LAVA) {
          // Lava ripple — slight y bob
          sprite.y = gy * TILE_SIZE + TILE_SIZE / 2 + Math.sin(f * 0.15 + gx * 0.4) * 1.5;
        } else if (tile === TileType.CONVEYOR_L || tile === TileType.CONVEYOR_R) {
          // Conveyor subtle brightness pulse
          const cPulse = Math.sin(f * 0.1 + gx * 0.3) * 0.1 + 0.9;
          const cTint = Phaser.Display.Color.GetColor(
            Math.floor(119 * cPulse),
            Math.floor(119 * cPulse),
            Math.floor(119 * cPulse)
          );
          sprite.setTint(cTint);
        } else if (tile === TileType.SPRING) {
          // Spring bounce idle
          sprite.y = gy * TILE_SIZE + TILE_SIZE / 2 + Math.sin(f * 0.12) * 1.5;
        } else if (tile === TileType.TRAMPOLINE) {
          // Trampoline bob
          sprite.y = gy * TILE_SIZE + TILE_SIZE / 2 + Math.sin(f * 0.12) * 2;
        } else if (tile === TileType.CHECKPOINT) {
          // Checkpoint flag anchored to bottom of tile, gentle bob
          sprite.y = (gy + 1) * TILE_SIZE - TILE_SIZE / 2 + Math.sin(f * 0.08) * 2;
        }
      }
    }

    // Coin entity animations (bob + stretch)
    for (let i = 0; i < this.entities.length; i++) {
      const ent = this.entities[i];
      const sprite = this.entitySprites[i];
      if (!ent.alive || !sprite) continue;

      if (ent.type === "coin") {
        // Floating bob
        sprite.y = ent.y + Math.sin(f * 0.08 + ent.x * 0.1) * 4;
        // Horizontal stretch
        const stretch = 0.7 + Math.abs(Math.sin(f * 0.1)) * 0.3;
        sprite.setScale(stretch, 1.0 / stretch);
      }
    }
  }

  // ===========================================================
  // HUD Pulse Animation
  // ===========================================================
  private pulseHud(target: Phaser.GameObjects.Text): void {
    this.tweens.add({
      targets: target,
      scaleX: 1.4,
      scaleY: 1.4,
      duration: 100,
      yoyo: true,
      ease: "Quad.easeOut",
    });
  }

  // ===========================================================
  // Player Animation (sprite swap based on state)
  // ===========================================================
  private animatePlayer(): void {
    if (!this.player.alive) return;

    const f = this.frame;
    const moving = Math.abs(this.player.vx) > 0.2;
    const grounded = this.player.grounded;

    // Texture swap based on state
    if (!grounded && this.player.vy < -1) {
      // Jumping up
      if (this.textures.exists("player_jump")) {
        this.player.setTexture("player_jump");
      }
    } else if (!grounded && this.player.vy > 1) {
      // Falling
      if (this.textures.exists("player_fall")) {
        this.player.setTexture("player_fall");
      }
    } else if (moving) {
      // Walk cycle (4 frames)
      const walkFrame = Math.floor(f / 5) % 4;
      const walkKey = `player_walk${walkFrame}`;
      if (this.textures.exists(walkKey)) {
        this.player.setTexture(walkKey);
      }
      // Body bob while walking
      this.player.y += (f % 2 === 0 ? 0.5 : -0.5) * 0.3;
    } else {
      // Idle — breathing animation
      if (this.textures.exists("player_idle")) {
        this.player.setTexture("player_idle");
      } else {
        this.player.setTexture("player");
      }
      // Subtle idle breathing
      const breathe = Math.sin(f * 0.06) * 0.5;
      this.player.y += breathe * 0.1;
    }

    // Flip sprite based on direction
    this.player.setFlipX(this.player.dir === -1);
  }

  private buildTileMap(): void {
    this.tileSprites = [];
    for (let gy = 0; gy < this.level.height; gy++) {
      this.tileSprites[gy] = [];
      for (let gx = 0; gx < this.level.width; gx++) {
        const tile = this.level.tiles[gy]?.[gx] ?? TileType.AIR;
        this.tileSprites[gy][gx] = this.createTileSprite(gx, gy, tile);
      }
    }
  }

  private createTileSprite(gx: number, gy: number, tile: TileType): Phaser.GameObjects.Image | null {
    if (tile === TileType.AIR) return null;

    const textureMap: Partial<Record<TileType, string>> = {
      [TileType.GROUND_TOP]: "tile_ground_top",
      [TileType.GROUND]: "tile_ground",
      [TileType.BRICK]: "tile_brick",
      [TileType.QUESTION]: "tile_question",
      [TileType.SPIKE]: "tile_spike",
      [TileType.HIDDEN_SPIKE]: "tile_ground_top", // Looks like ground!
      [TileType.FAKE_GROUND]: "tile_ground_top", // Looks like ground!
      [TileType.INVISIBLE]: "tile_ground", // Will be hidden
      [TileType.PIPE_TL]: "tile_pipe_tl",
      [TileType.PIPE_TR]: "tile_pipe_tr",
      [TileType.PIPE_BL]: "tile_pipe_bl",
      [TileType.PIPE_BR]: "tile_pipe_br",
      [TileType.LAVA]: "tile_lava",
      [TileType.TROLL_Q]: "tile_question",
      [TileType.USED]: "tile_used",
      [TileType.CASTLE]: "tile_castle",
      [TileType.SPRING]: "tile_spring",
      [TileType.CLOUD]: "tile_cloud",
      [TileType.PLATFORM]: "tile_platform",
      [TileType.ICE]: "tile_ice",
      [TileType.CONVEYOR_L]: "tile_conveyor",
      [TileType.CONVEYOR_R]: "tile_conveyor",
      [TileType.CHECKPOINT]: "tile_checkpoint",
      [TileType.TRAMPOLINE]: "tile_trampoline",
      [TileType.POWERUP_BLOCK]: "tile_powerup_block",
      [TileType.SLIDE_BLOCK]: "tile_slide_block",
      [TileType.TIMED_BLOCK]: "tile_timed_block",
      [TileType.GRAVITY_ZONE]: "tile_gravity_zone",
      [TileType.MOVING_PLATFORM]: "tile_moving_platform",
    };

    const key = textureMap[tile];
    if (!key) return null;

    const sprite = this.add.image(gx * TILE_SIZE + TILE_SIZE / 2, gy * TILE_SIZE + TILE_SIZE / 2, key);

    // Invisible tiles start hidden
    if (tile === TileType.INVISIBLE) {
      sprite.setAlpha(0);
    }

    // Gravity zone is semi-transparent
    if (tile === TileType.GRAVITY_ZONE) {
      sprite.setAlpha(0.6);
    }

    return sprite;
  }

  private spawnEntities(): void {
    this.entities = structuredClone(this.level.entities);
    this.entitySprites.forEach((s) => s.destroy());
    this.entitySprites = [];

    for (const ent of this.entities) {
      const textureMap: Record<string, string> = {
        coin: "entity_coin",
        flag: "entity_flag",
        fake_flag: "entity_fake_flag",
        goomba: "entity_goomba",
        fast_goomba: "entity_fast_goomba",
        spiny: "entity_spiny",
        flying: "entity_flying",
        mushroom: "entity_mushroom",
        star: "entity_star",
        fire_flower: "entity_fire_flower",
      };

      const key = textureMap[ent.type];
      if (!key) continue;

      const sprite = this.add.image(ent.x, ent.y, key);
      ent.alive = true;
      ent.vx = ent.vx ?? (ent.type === "coin" || ent.type === "flag" || ent.type === "fake_flag" || ent.type === "mushroom" || ent.type === "star" || ent.type === "fire_flower" ? 0 : -1.5);
      ent.vy = ent.vy ?? 0;
      ent.dir = ent.dir ?? -1;

      if (ent.type === "flying") {
        ent.baseY = ent.y;
        ent.frame = 0;
      }

      this.entitySprites.push(sprite);
    }
  }

  private createPlayer(): void {
    const start = this.level.playerStart;
    this.player = this.add.image(start.x, start.y, "player") as PlayerSprite;
    this.player.vx = 0;
    this.player.vy = 0;
    this.player.grounded = false;
    this.player.jumpHeld = false;
    this.player.alive = true;
    this.player.dir = 1;
    this.player.setDepth(50);
  }

  private handleInput(): void {
    if (!this.cursors) return;

    // Skip input during dash
    if (this.dashing) return;

    const onIce = this.isOnTile(TileType.ICE);

    const leftDown = this.cursors.left.isDown || this.keyA?.isDown;
    const rightDown = this.cursors.right.isDown || this.keyD?.isDown;
    const jumpDown = this.cursors.up.isDown || this.keyW?.isDown || this.keySpace?.isDown;
    const jumpUp = this.cursors.up.isUp && (!this.keyW || this.keyW.isUp) && (!this.keySpace || this.keySpace.isUp);

    // Speed modifier from mushroom power-up
    const speedMod = (this.powered && this.powerType === "mushroom") ? MUSHROOM_SPEED_BOOST : 1;

    // Horizontal movement
    if (leftDown) {
      if (onIce) {
        this.player.vx -= 0.15 * speedMod;
      } else {
        this.player.vx = -PLAYER_SPEED * speedMod;
      }
      this.player.dir = -1;
    } else if (rightDown) {
      if (onIce) {
        this.player.vx += 0.15 * speedMod;
      } else {
        this.player.vx = PLAYER_SPEED * speedMod;
      }
      this.player.dir = 1;
    } else if (onIce) {
      this.player.vx *= ICE_FRICTION;
    } else {
      this.player.vx = 0;
    }

    // Clamp ice speed
    if (onIce) {
      this.player.vx = Phaser.Math.Clamp(this.player.vx, -4.16 * speedMod, 4.16 * speedMod);
    }

    // Wall slide detection
    this.wallSliding = false;
    this.wallDir = 0;
    if (!this.player.grounded && this.player.vy > 0) {
      const halfW = PLAYER_W / 2;
      const midY = Math.floor(this.player.y / TILE_SIZE);
      const gxRight = Math.floor((this.player.x + halfW + 1) / TILE_SIZE);
      const gxLeft = Math.floor((this.player.x - halfW - 1) / TILE_SIZE);
      if (rightDown && this.isSolid(gxRight, midY)) {
        this.wallSliding = true;
        this.wallDir = 1;
        this.player.vy = Math.min(this.player.vy, WALL_SLIDE_SPEED);
      } else if (leftDown && this.isSolid(gxLeft, midY)) {
        this.wallSliding = true;
        this.wallDir = -1;
        this.player.vy = Math.min(this.player.vy, WALL_SLIDE_SPEED);
      }
    }

    // Jump (ground jump + wall jump)
    if (jumpDown && !this.player.jumpHeld) {
      if (this.player.grounded) {
        this.player.vy = this.gravityFlipped ? -JUMP_FORCE : JUMP_FORCE;
        this.player.grounded = false;
        this.player.jumpHeld = true;
        playJump();
        this.emitJumpParticles();
      } else if (this.wallSliding) {
        // Wall jump
        this.player.vx = -this.wallDir * WALL_JUMP_FORCE_X;
        this.player.vy = this.gravityFlipped ? -WALL_JUMP_FORCE_Y : WALL_JUMP_FORCE_Y;
        this.player.dir = (-this.wallDir) as 1 | -1;
        this.player.jumpHeld = true;
        this.wallSliding = false;
        playWallJump();
        this.emitJumpParticles();
      }
    }

    // Variable jump height
    const gravUp = this.gravityFlipped ? (this.player.vy > 4) : (this.player.vy < -4);
    if (!jumpDown && gravUp) {
      this.player.vy = this.gravityFlipped ? 4 : -4;
      this.player.jumpHeld = false;
    }

    if (jumpUp) {
      this.player.jumpHeld = false;
    }

    // Dash (Shift key)
    if (this.input.keyboard) {
      const shiftDown = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
      if (shiftDown.isDown && this.canDash && !this.player.grounded) {
        this.dashing = true;
        this.dashTimer = DASH_DURATION;
        this.canDash = false;
        this.player.vx = this.player.dir * DASH_SPEED;
        this.player.vy = 0;
        playDash();
      }
    }

    // Fireball (F key or X key) - only with fire_flower power-up
    if (this.powered && this.powerType === "fire_flower" && this.input.keyboard) {
      const fKey = this.input.keyboard.addKey("F");
      const xKey = this.input.keyboard.addKey("X");
      if (Phaser.Input.Keyboard.JustDown(fKey) || Phaser.Input.Keyboard.JustDown(xKey)) {
        this.shootFireball();
      }
    }

    // Reset dash on ground
    if (this.player.grounded) {
      this.canDash = true;
    }
  }

  private applyPhysics(): void {
    // Gravity (supports flipped gravity)
    if (this.gravityFlipped) {
      this.player.vy -= GRAVITY;
      if (this.player.vy < -MAX_FALL) this.player.vy = -MAX_FALL;
    } else {
      this.player.vy += GRAVITY;
      if (this.player.vy > MAX_FALL) this.player.vy = MAX_FALL;
    }

    // Conveyor push
    if (this.isOnTile(TileType.CONVEYOR_L)) this.player.vx -= CONVEYOR_SPEED;
    if (this.isOnTile(TileType.CONVEYOR_R)) this.player.vx += CONVEYOR_SPEED;

    // Fake ground crumble when walking on top
    if (this.player.grounded) {
      const halfW = PLAYER_W / 2;
      const gyBelow = Math.floor((this.player.y + PLAYER_H / 2 + 1) / TILE_SIZE);
      const gxL = Math.floor((this.player.x - halfW + 2) / TILE_SIZE);
      const gxR = Math.floor((this.player.x + halfW - 2) / TILE_SIZE);
      for (let gx = gxL; gx <= gxR; gx++) {
        if (this.getTile(gx, gyBelow) === TileType.FAKE_GROUND) {
          this.startCrumbling(gx, gyBelow);
        }
        if (this.getTile(gx, gyBelow) === TileType.HIDDEN_SPIKE) {
          this.triggerHiddenSpike(gx, gyBelow);
        }
      }
    }

    // Gravity zone contact
    this.checkGravityZoneContact();

    // Move X
    this.player.x += this.player.vx;
    this.resolveCollisionX();

    // Move Y
    this.player.y += this.player.vy;
    this.resolveCollisionY();
  }

  private getTile(gx: number, gy: number): TileType {
    if (gy < 0 || gy >= this.level.height || gx < 0 || gx >= this.level.width) {
      return TileType.AIR;
    }
    return this.level.tiles[gy]?.[gx] ?? TileType.AIR;
  }

  private isSolid(gx: number, gy: number): boolean {
    const t = this.getTile(gx, gy);
    if (t === TileType.TIMED_BLOCK && !this.timedBlockVisible) return false;
    return SOLID_TILES.has(t);
  }

  private resolveCollisionX(): void {
    const halfW = PLAYER_W / 2;
    const halfH = PLAYER_H / 2;
    const left = this.player.x - halfW;
    const right = this.player.x + halfW;
    const top = this.player.y - halfH + 2;
    const bottom = this.player.y + halfH - 2;

    const gxLeft = Math.floor(left / TILE_SIZE);
    const gxRight = Math.floor(right / TILE_SIZE);
    const gyTop = Math.floor(top / TILE_SIZE);
    const gyBottom = Math.floor(bottom / TILE_SIZE);

    for (let gy = gyTop; gy <= gyBottom; gy++) {
      // Moving right
      if (this.player.vx > 0 && this.isSolid(gxRight, gy)) {
        this.player.x = gxRight * TILE_SIZE - halfW;
        this.player.vx = 0;
        break;
      }
      // Moving left
      if (this.player.vx < 0 && this.isSolid(gxLeft, gy)) {
        this.player.x = (gxLeft + 1) * TILE_SIZE + halfW;
        this.player.vx = 0;
        break;
      }
    }

    // Check lethal tiles
    this.checkLethalContact();
  }

  private resolveCollisionY(): void {
    const halfW = PLAYER_W / 2;
    const halfH = PLAYER_H / 2;
    const left = this.player.x - halfW + 2;
    const right = this.player.x + halfW - 2;
    const top = this.player.y - halfH;
    const bottom = this.player.y + halfH;

    const gxLeft = Math.floor(left / TILE_SIZE);
    const gxRight = Math.floor(right / TILE_SIZE);
    const gyTop = Math.floor(top / TILE_SIZE);
    const gyBottom = Math.floor(bottom / TILE_SIZE);

    this.player.grounded = false;

    for (let gx = gxLeft; gx <= gxRight; gx++) {
      // Falling down
      if (this.player.vy > 0) {
        const tile = this.getTile(gx, gyBottom);
        const isSolid = SOLID_TILES.has(tile);
        const isOneway = ONEWAY_TILES.has(tile);

        if (isSolid || isOneway) {
          if (isOneway) {
            // One-way: only collide if feet were at or above the tile top (2px tolerance for float precision)
            const prevBottom = this.player.y + halfH - this.player.vy;
            if (prevBottom > gyBottom * TILE_SIZE + 2) continue;
          }

          this.player.y = gyBottom * TILE_SIZE - halfH;
          this.player.vy = 0;
          this.player.grounded = true;

          // Special landing effects
          if (tile === TileType.SPRING) {
            this.player.vy = JUMP_FORCE * SPRING_MULTIPLIER;
            this.player.grounded = false;
            playSpring();
            this.emitSpringParticles(this.player.x, this.player.y + PLAYER_H / 2);
          } else if (tile === TileType.TRAMPOLINE) {
            this.player.vy = JUMP_FORCE * TRAMPOLINE_MULTIPLIER;
            this.player.grounded = false;
            playSpring();
            this.emitSpringParticles(this.player.x, this.player.y + PLAYER_H / 2);
          } else if (tile === TileType.FAKE_GROUND) {
            this.startCrumbling(gx, gyBottom);
          } else if (tile === TileType.HIDDEN_SPIKE) {
            this.triggerHiddenSpike(gx, gyBottom);
          }
          break;
        }
      }
      // Moving up
      if (this.player.vy < 0 && this.isSolid(gx, gyTop)) {
        this.player.y = (gyTop + 1) * TILE_SIZE + halfH;
        this.player.vy = 0;

        // Hit ? block from below
        const tile = this.getTile(gx, gyTop);
        if (tile === TileType.QUESTION) {
          this.hitQuestionBlock(gx, gyTop);
        } else if (tile === TileType.BRICK) {
          this.breakBrick(gx, gyTop);
        } else if (tile === TileType.TROLL_Q) {
          this.hitTrollBlock(gx, gyTop);
        } else if (tile === TileType.INVISIBLE) {
          this.revealInvisible(gx, gyTop);
        } else if (tile === TileType.POWERUP_BLOCK) {
          this.hitPowerUpBlock(gx, gyTop);
        }
        break;
      }
    }

    this.checkLethalContact();
  }

  private checkLethalContact(): void {
    const halfW = PLAYER_W / 2;
    const halfH = PLAYER_H / 2;
    const points = [
      { x: this.player.x - halfW + 2, y: this.player.y + halfH - 2 },
      { x: this.player.x + halfW - 2, y: this.player.y + halfH - 2 },
      { x: this.player.x, y: this.player.y + halfH },
      { x: this.player.x - halfW + 2, y: this.player.y },
      { x: this.player.x + halfW - 2, y: this.player.y },
    ];

    for (const p of points) {
      const gx = Math.floor(p.x / TILE_SIZE);
      const gy = Math.floor(p.y / TILE_SIZE);
      const tile = this.getTile(gx, gy);
      if (LETHAL_TILES.has(tile)) {
        // Star invincibility protects from lethal tiles
        if (this.powered && this.powerType === "star") return;
        this.playerDie();
        return;
      }
    }
  }

  private checkCheckpoints(): void {
    const halfW = PLAYER_W / 2;
    const halfH = PLAYER_H / 2;
    const pLeft = this.player.x - halfW;
    const pRight = this.player.x + halfW;
    const pTop = this.player.y - halfH;
    const pBottom = this.player.y + halfH;

    const gxL = Math.floor(pLeft / TILE_SIZE);
    const gxR = Math.floor(pRight / TILE_SIZE);
    const gyT = Math.floor(pTop / TILE_SIZE);
    const gyB = Math.floor(pBottom / TILE_SIZE);

    for (let gy = gyT; gy <= gyB; gy++) {
      for (let gx = gxL; gx <= gxR; gx++) {
        if (this.getTile(gx, gy) !== TileType.CHECKPOINT) continue;

        const key = `${gx},${gy}`;
        if (this.activatedCheckpoints.has(key)) continue;

        this.activatedCheckpoints.add(key);
        this.level._checkpointX = gx * TILE_SIZE + TILE_SIZE / 2;
        this.level._checkpointY = gy * TILE_SIZE;

        // Save state snapshot at checkpoint for respawn restoration
        this.saveSnapshot();

        // Visual feedback: tint the checkpoint sprite green
        const sprite = this.tileSprites[gy]?.[gx];
        if (sprite) {
          sprite.setTint(0x44ff44);
        }
      }
    }
  }

  private isOnTile(tileType: TileType): boolean {
    const gx = Math.floor(this.player.x / TILE_SIZE);
    const gy = Math.floor((this.player.y + PLAYER_H / 2 + 1) / TILE_SIZE);
    return this.getTile(gx, gy) === tileType;
  }

  private hitQuestionBlock(gx: number, gy: number): void {
    this.level.tiles[gy][gx] = TileType.USED;
    this.updateTileSprite(gx, gy, TileType.USED);
    // Spawn coin
    this.coins++;
    this.pulseHud(this.hudCoins);
    gameEvents.emit(GAME_EVENTS.COINS_CHANGED, this.coins);
  }

  private breakBrick(gx: number, gy: number): void {
    const px = gx * TILE_SIZE + TILE_SIZE / 2;
    const py = gy * TILE_SIZE + TILE_SIZE / 2;
    this.level.tiles[gy][gx] = TileType.AIR;
    this.updateTileSprite(gx, gy, TileType.AIR);
    this.emitBrickParticles(px, py);
  }

  private hitTrollBlock(gx: number, gy: number): void {
    this.level.tiles[gy][gx] = TileType.USED;
    this.updateTileSprite(gx, gy, TileType.USED);
    // Spawn goomba above
    const ent: GameEntity = {
      type: "goomba",
      x: gx * TILE_SIZE + TILE_SIZE / 2,
      y: (gy - 1) * TILE_SIZE,
      vx: -1.5,
      vy: 0,
      dir: -1,
      alive: true,
    };
    this.entities.push(ent);
    const sprite = this.add.image(ent.x, ent.y, "entity_goomba");
    this.entitySprites.push(sprite);
  }

  private revealInvisible(gx: number, gy: number): void {
    this.level.tiles[gy][gx] = TileType.GROUND;
    this.updateTileSprite(gx, gy, TileType.GROUND);
  }

  private updateTileSprite(gx: number, gy: number, newTile: TileType): void {
    const old = this.tileSprites[gy]?.[gx];
    if (old) old.destroy();
    this.tileSprites[gy][gx] = this.createTileSprite(gx, gy, newTile);
  }

  private startCrumbling(gx: number, gy: number): void {
    if (this.crumbling.some((c) => c.gx === gx && c.gy === gy)) return;
    this.crumbling.push({ gx, gy, timer: FAKE_GROUND_TIMER });
  }

  private updateCrumbling(): void {
    for (let i = this.crumbling.length - 1; i >= 0; i--) {
      const c = this.crumbling[i];
      c.timer--;

      // Shake effect on sprite
      const sprite = this.tileSprites[c.gy]?.[c.gx];
      if (sprite) {
        sprite.setAlpha(c.timer / FAKE_GROUND_TIMER);
        sprite.x = c.gx * TILE_SIZE + TILE_SIZE / 2 + (Math.random() - 0.5) * 4;
      }

      if (c.timer <= 0) {
        this.level.tiles[c.gy][c.gx] = TileType.AIR;
        this.updateTileSprite(c.gx, c.gy, TileType.AIR);
        this.crumbling.splice(i, 1);
      }
    }
  }

  private triggerHiddenSpike(gx: number, gy: number): void {
    if (this.spikeAnims.some((s) => s.gx === gx && s.gy === gy)) return;
    this.spikeAnims.push({
      gx,
      gy,
      phase: "rumble",
      timer: HIDDEN_SPIKE_RUMBLE,
      spikeSprite: null,
      killed: false,
    });
  }

  private updateHiddenSpikes(): void {
    for (let i = this.spikeAnims.length - 1; i >= 0; i--) {
      const s = this.spikeAnims[i];
      s.timer--;

      const tileSprite = this.tileSprites[s.gy]?.[s.gx];
      const cx = s.gx * TILE_SIZE + TILE_SIZE / 2;
      const cy = s.gy * TILE_SIZE + TILE_SIZE / 2;
      const tileTop = s.gy * TILE_SIZE;
      // Spike final position: sitting just above the tile
      const spikeEndY = tileTop - TILE_SIZE / 2;

      if (s.phase === "rumble") {
        // Shake the ground tile as warning
        if (tileSprite) {
          tileSprite.x = cx + (Math.random() - 0.5) * 3;
          tileSprite.y = cy + (Math.random() - 0.5) * 2;
        }
        if (s.timer <= 0) {
          // Reset tile position and transition to emerge
          if (tileSprite) {
            tileSprite.x = cx;
            tileSprite.y = cy;
            // Ground tile covers the spike as it emerges from inside
            tileSprite.setDepth(2);
          }
          s.phase = "emerge";
          s.timer = HIDDEN_SPIKE_EMERGE;
          // Create spike sprite starting inside the tile (hidden behind ground)
          const spike = this.add.image(cx, cy, "tile_spike");
          spike.setDepth(1);
          s.spikeSprite = spike;
        }
      } else if (s.phase === "emerge") {
        // Spike rises from inside the tile to above it
        const progress = 1 - s.timer / HIDDEN_SPIKE_EMERGE;
        if (s.spikeSprite) {
          s.spikeSprite.y = cy + (spikeEndY - cy) * progress;
        }
        // Kill player when spike is 60% emerged
        if (progress >= 0.6 && !s.killed && this.player.alive) {
          this.checkSpikeHit(s, tileTop);
        }
        if (s.timer <= 0) {
          // Snap spike to final position
          if (s.spikeSprite) {
            s.spikeSprite.y = spikeEndY;
          }
          s.phase = "hold";
          s.timer = HIDDEN_SPIKE_HOLD;
        }
      } else if (s.phase === "hold") {
        // Spike stays out — still lethal during hold
        if (!s.killed && this.player.alive) {
          this.checkSpikeHit(s, tileTop);
        }
        if (s.timer <= 0) {
          s.phase = "retract";
          s.timer = HIDDEN_SPIKE_RETRACT;
        }
      } else if (s.phase === "retract") {
        // Spike retracts back down into the tile
        const progress = 1 - s.timer / HIDDEN_SPIKE_RETRACT;
        if (s.spikeSprite) {
          s.spikeSprite.y = spikeEndY + (cy - spikeEndY) * progress;
        }
        if (s.timer <= 0) {
          if (s.spikeSprite) {
            s.spikeSprite.destroy();
          }
          // Reset ground tile depth
          if (tileSprite) {
            tileSprite.setDepth(0);
          }
          this.spikeAnims.splice(i, 1);
        }
      }
    }
  }

  private checkSpikeHit(s: SpikeAnimation, tileTop: number): void {
    const halfW = PLAYER_W / 2;
    const halfH = PLAYER_H / 2;
    const pLeft = this.player.x - halfW;
    const pRight = this.player.x + halfW;
    const pBottom = this.player.y + halfH;
    const pTop = this.player.y - halfH;
    const tileLeft = s.gx * TILE_SIZE;
    const tileRight = tileLeft + TILE_SIZE;
    // Spike occupies the area just above the tile
    if (pRight > tileLeft + 2 && pLeft < tileRight - 2 && pBottom > tileTop - TILE_SIZE && pTop < tileTop) {
      s.killed = true;
      this.playerDie();
    }
  }

  private updateEntities(): void {
    const halfW = PLAYER_W / 2;
    const halfH = PLAYER_H / 2;

    for (let i = 0; i < this.entities.length; i++) {
      const ent = this.entities[i];
      const sprite = this.entitySprites[i];
      if (!ent.alive || !sprite) continue;

      // Update position for enemies
      if (ent.type === "goomba" || ent.type === "fast_goomba" || ent.type === "spiny") {
        const speed = ent.type === "fast_goomba" ? 3 : 1.5;
        ent.x += (ent.dir ?? -1) * speed;

        // Apply gravity
        ent.vy = (ent.vy ?? 0) + GRAVITY;
        if (ent.vy > MAX_FALL) ent.vy = MAX_FALL;
        ent.y += ent.vy;

        // Ground collision — snap to top of solid tile
        const footGy = Math.floor((ent.y + 12) / TILE_SIZE);
        const gx = Math.floor(ent.x / TILE_SIZE);
        if (this.isSolid(gx, footGy)) {
          ent.y = footGy * TILE_SIZE - 12;
          ent.vy = 0;
        }

        // Reverse at walls
        const gy = Math.floor(ent.y / TILE_SIZE);
        if (this.isSolid(gx + (ent.dir === 1 ? 1 : -1), gy)) {
          ent.dir = ((ent.dir ?? -1) * -1) as 1 | -1;
        }

        // Remove if fallen off the map
        if (ent.y > this.level.height * TILE_SIZE + 64) {
          ent.alive = false;
          sprite.setVisible(false);
        }
      }

      if (ent.type === "flying") {
        ent.frame = (ent.frame ?? 0) + 1;
        ent.x += (ent.dir ?? -1) * 1.5;
        ent.y = (ent.baseY ?? ent.y) + Math.sin(ent.frame * 0.05) * 40;
        if ((ent.frame % 120) === 0) {
          ent.dir = ((ent.dir ?? -1) * -1) as 1 | -1;
        }
      }

      sprite.setPosition(ent.x, ent.y);

      // Enemy animations — texture-swap walk cycles + direction
      if (ent.type === "goomba" || ent.type === "fast_goomba") {
        const prefix = ent.type === "goomba" ? "entity_goomba" : "entity_fast_goomba";
        const walkFrame = Math.floor(this.frame / 8) % 2;
        sprite.setTexture(`${prefix}_walk${walkFrame}`);
        sprite.setFlipX((ent.dir ?? -1) === 1);
      } else if (ent.type === "spiny") {
        const walkFrame = Math.floor(this.frame / 10) % 2;
        sprite.setTexture(`entity_spiny_walk${walkFrame}`);
        sprite.y += Math.sin(this.frame * 0.08) * 0.5;
        sprite.setFlipX((ent.dir ?? -1) === 1);
      } else if (ent.type === "flying") {
        const wingFrame = Math.floor(this.frame / 6) % 2;
        sprite.setTexture(`entity_flying_walk${wingFrame}`);
        const bodyBob = Math.sin(this.frame * 0.1) * 2;
        sprite.y += bodyBob;
        sprite.setFlipX((ent.dir ?? -1) === 1);
      }

      // Power-up entity movement (mushroom moves like a goomba, star bounces)
      if (ent.type === "mushroom") {
        ent.vx = ent.vx ?? POWERUP_MOVE_SPEED;
        ent.x += ent.vx;
        ent.vy = (ent.vy ?? 0) + POWERUP_GRAVITY;
        if (ent.vy > MAX_FALL) ent.vy = MAX_FALL;
        ent.y += ent.vy;
        const footGy = Math.floor((ent.y + 10) / TILE_SIZE);
        const gx = Math.floor(ent.x / TILE_SIZE);
        if (this.isSolid(gx, footGy)) {
          ent.y = footGy * TILE_SIZE - 10;
          ent.vy = 0;
        }
        const gy = Math.floor(ent.y / TILE_SIZE);
        if (this.isSolid(gx + (ent.vx > 0 ? 1 : -1), gy)) {
          ent.vx = -ent.vx;
        }
        if (ent.y > this.level.height * TILE_SIZE + 64) {
          ent.alive = false;
          sprite.setVisible(false);
        }
      }

      if (ent.type === "star") {
        ent.vx = ent.vx ?? POWERUP_MOVE_SPEED;
        ent.x += ent.vx;
        ent.vy = (ent.vy ?? 0) + POWERUP_GRAVITY;
        if (ent.vy > 6) ent.vy = 6;
        ent.y += ent.vy;
        const footGy = Math.floor((ent.y + 10) / TILE_SIZE);
        const gx = Math.floor(ent.x / TILE_SIZE);
        if (this.isSolid(gx, footGy)) {
          ent.y = footGy * TILE_SIZE - 10;
          ent.vy = -6; // Bounce!
        }
        const gy = Math.floor(ent.y / TILE_SIZE);
        if (this.isSolid(gx + (ent.vx > 0 ? 1 : -1), gy)) {
          ent.vx = -ent.vx;
        }
        // Star sparkle rotation
        sprite.setAngle((this.frame * 4) % 360);
        if (ent.y > this.level.height * TILE_SIZE + 64) {
          ent.alive = false;
          sprite.setVisible(false);
        }
      }

      // Fire flower stays still but bobs
      if (ent.type === "fire_flower") {
        sprite.y = ent.y + Math.sin(this.frame * 0.1) * 3;
      }

      // Player collision with entity
      const dx = Math.abs(this.player.x - ent.x);
      const dy = Math.abs(this.player.y - ent.y);

      if (dx < halfW + 8 && dy < halfH + 8) {
        if (ent.type === "coin") {
          ent.alive = false;
          sprite.setVisible(false);
          this.coins++;
          this.pulseHud(this.hudCoins);
          playCoin();
          this.emitCoinParticles(ent.x, ent.y);
          gameEvents.emit(GAME_EVENTS.COINS_CHANGED, this.coins);
        } else if (ent.type === "mushroom") {
          ent.alive = false;
          sprite.setVisible(false);
          this.activatePowerUp("mushroom");
        } else if (ent.type === "star") {
          ent.alive = false;
          sprite.setVisible(false);
          this.activatePowerUp("star");
        } else if (ent.type === "fire_flower") {
          ent.alive = false;
          sprite.setVisible(false);
          this.activatePowerUp("fire_flower");
        } else if (ent.type === "flag") {
          this.showLevelComplete();
        } else if (ent.type === "fake_flag") {
          this.handleEnemyHit();
        } else if (ent.type === "spiny") {
          // Star power kills spiny too
          if (this.powered && this.powerType === "star") {
            ent.alive = false;
            sprite.setVisible(false);
            playStomp();
            this.emitStompParticles(ent.x, ent.y);
          } else {
            this.handleEnemyHit();
          }
        } else if (ent.type === "goomba" || ent.type === "fast_goomba" || ent.type === "flying") {
          // Star power kills everything
          if (this.powered && this.powerType === "star") {
            ent.alive = false;
            sprite.setVisible(false);
            playStomp();
            this.emitStompParticles(ent.x, ent.y);
          } else if (this.player.vy > 0 && this.player.y < ent.y - 4) {
            // Stomp from above
            ent.alive = false;
            sprite.setVisible(false);
            this.player.vy = JUMP_FORCE * 0.6;
            playStomp();
            this.emitStompParticles(ent.x, ent.y);
          } else {
            this.handleEnemyHit();
          }
        }
      }
    }
  }

  private checkTrolls(): void {
    for (const troll of this.level.trolls) {
      if (troll.triggered) continue;
      if (this.player.x >= troll.triggerX) {
        troll.triggered = true;

        switch (troll.action) {
          case "spawn":
            if (troll.entityType && troll.spawnX !== undefined && troll.spawnY !== undefined) {
              const textureMap: Record<string, string> = {
                goomba: "entity_goomba",
                fast_goomba: "entity_fast_goomba",
                spiny: "entity_spiny",
                flying: "entity_flying",
                mushroom: "entity_mushroom",
                star: "entity_star",
                fire_flower: "entity_fire_flower",
              };
              const ent: GameEntity = {
                type: troll.entityType,
                x: troll.spawnX,
                y: troll.spawnY,
                vx: -1.5,
                vy: 0,
                dir: -1,
                alive: true,
                frame: 0,
                baseY: troll.spawnY,
              };
              this.entities.push(ent);
              const sprite = this.add.image(ent.x, ent.y, textureMap[troll.entityType] ?? "entity_goomba");
              this.entitySprites.push(sprite);
            }
            break;
          case "shake":
            this.cameras.main.shake(troll.duration ?? 300, 0.005);
            break;
          case "message":
            this.showMessage(troll.text ?? "");
            break;
          case "fall_blocks":
            if (troll.startX !== undefined) {
              const count = troll.count ?? 3;
              for (let b = 0; b < count; b++) {
                const bx = troll.startX + b * 40;
                const block = this.add.image(bx, -32, "tile_brick");
                this.tweens.add({
                  targets: block,
                  y: GAME_HEIGHT - 16,
                  duration: 1200,
                  ease: "Bounce.easeOut",
                  onComplete: () => block.destroy(),
                });
              }
            }
            break;
          case "spawn_powerup":
            if (troll.powerUpType && troll.spawnX !== undefined && troll.spawnY !== undefined) {
              const pTexMap: Record<string, string> = {
                mushroom: "entity_mushroom",
                star: "entity_star",
                fire_flower: "entity_fire_flower",
              };
              const pEnt: GameEntity = {
                type: troll.powerUpType,
                x: troll.spawnX,
                y: troll.spawnY,
                vx: POWERUP_MOVE_SPEED,
                vy: 0,
                dir: 1,
                alive: true,
              };
              this.entities.push(pEnt);
              const pSprite = this.add.image(pEnt.x, pEnt.y, pTexMap[troll.powerUpType] ?? "entity_mushroom");
              this.entitySprites.push(pSprite);
            }
            break;
          case "slide_block":
            if (troll.slideFromX !== undefined && troll.slideFromY !== undefined &&
                troll.slideToX !== undefined && troll.slideToY !== undefined) {
              this.triggerSlideBlock(troll.slideFromX, troll.slideFromY, troll.slideToX, troll.slideToY);
            }
            break;
          case "gravity_flip":
            this.gravityFlipped = !this.gravityFlipped;
            this.gravityFlipTimer = troll.flipDuration ?? GRAVITY_FLIP_DEFAULT_DURATION;
            playGravityFlip();
            this.showMessage("Gravidade invertida!");
            this.player.setFlipY(this.gravityFlipped);
            break;
        }
      }
    }
  }

  private showMessage(text: string): void {
    const msg = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 60, text, {
        fontFamily: "monospace",
        fontSize: "18px",
        color: "#ffffff",
        backgroundColor: "rgba(0,0,0,0.7)",
        padding: { x: 16, y: 8 },
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(150);

    this.time.delayedCall(2500, () => {
      this.tweens.add({
        targets: msg,
        alpha: 0,
        duration: 500,
        onComplete: () => msg.destroy(),
      });
    });
  }

  private playerDie(): void {
    if (!this.player.alive) return;
    this.player.alive = false;
    this.deaths++;
    this.pulseHud(this.hudDeaths);
    playDeath();
    this.emitDeathParticles();

    gameEvents.emit(GAME_EVENTS.PLAYER_DIED, this.deaths);

    // Death animation
    this.tweens.add({
      targets: this.player,
      y: this.player.y - 60,
      alpha: 0,
      duration: 600,
      ease: "Power2",
      onComplete: () => {
        this.time.delayedCall(400, () => this.respawn());
      },
    });
  }

  private saveSnapshot(): void {
    this.snapshot = {
      tiles: this.level.tiles.map((row) => [...row]),
      entities: structuredClone(this.entities),
      coins: this.coins,
      trollTriggered: this.level.trolls.map((t) => t.triggered),
      slideBlocks: structuredClone(this.level.slideBlocks ?? []),
    };
  }

  private restoreSnapshot(): void {
    // Restore tiles
    this.level.tiles = this.snapshot.tiles.map((row) => [...row]);

    // Rebuild tile sprites
    for (let gy = 0; gy < this.level.height; gy++) {
      for (let gx = 0; gx < this.level.width; gx++) {
        const old = this.tileSprites[gy]?.[gx];
        if (old) old.destroy();
        this.tileSprites[gy][gx] = this.createTileSprite(gx, gy, this.level.tiles[gy][gx]);
      }
    }

    // Re-tint activated checkpoints
    for (const key of this.activatedCheckpoints) {
      const [gxStr, gyStr] = key.split(",");
      const sprite = this.tileSprites[Number(gyStr)]?.[Number(gxStr)];
      if (sprite) sprite.setTint(0x44ff44);
    }

    // Restore entities
    this.entitySprites.forEach((s) => s.destroy());
    this.entitySprites = [];
    this.entities = structuredClone(this.snapshot.entities);
    for (const ent of this.entities) {
      const textureMap: Record<string, string> = {
        coin: "entity_coin",
        flag: "entity_flag",
        fake_flag: "entity_fake_flag",
        goomba: "entity_goomba",
        fast_goomba: "entity_fast_goomba",
        spiny: "entity_spiny",
        flying: "entity_flying",
        mushroom: "entity_mushroom",
        star: "entity_star",
        fire_flower: "entity_fire_flower",
      };
      const key = textureMap[ent.type];
      if (!key) continue;
      const sprite = this.add.image(ent.x, ent.y, key);
      if (!ent.alive) sprite.setVisible(false);
      this.entitySprites.push(sprite);
    }

    // Restore coins
    this.coins = this.snapshot.coins;
    gameEvents.emit(GAME_EVENTS.COINS_CHANGED, this.coins);

    // Restore troll triggers
    for (let i = 0; i < this.level.trolls.length; i++) {
      this.level.trolls[i].triggered = this.snapshot.trollTriggered[i] ?? false;
    }

    // Clear in-progress crumbling and spike animations
    this.crumbling = [];
    this.spikeAnims.forEach((s) => s.spikeSprite?.destroy());
    this.spikeAnims = [];

    // Restore slide blocks
    if (this.snapshot.slideBlocks) {
      this.level.slideBlocks = structuredClone(this.snapshot.slideBlocks);
    }
    this.slideBlockAnims.forEach((a) => a.sprite?.destroy());
    this.slideBlockAnims = [];

    // Clear fireballs
    this.fireballs.forEach((fb) => fb.sprite.destroy());
    this.fireballs = [];

    // Reset power-up state
    this.powered = false;
    this.powerType = null;
    this.powerTimer = 0;
    this.dashing = false;
    this.dashTimer = 0;
    this.canDash = true;
    this.gravityFlipped = false;
    this.gravityFlipTimer = 0;
    this.timedBlockTimer = 0;
    this.timedBlockVisible = true;
    this.wallSliding = false;

    // Re-initialize moving platforms
    this.movingPlatforms.forEach((mp) => mp.sprite.destroy());
    this.initMovingPlatforms();
  }

  private respawn(): void {
    this.restoreSnapshot();

    const spawnX = this.level._checkpointX ?? this.level.playerStart.x;
    const spawnY = this.level._checkpointY ?? this.level.playerStart.y;
    this.player.setPosition(spawnX, spawnY);
    this.player.vx = 0;
    this.player.vy = 0;
    this.player.setAlpha(1);
    this.player.setTint(0xffffff);
    this.player.setFlipY(false);
    this.player.alive = true;
    this.player.grounded = false;
  }

  private showLevelComplete(): void {
    this.player.alive = false;
    playComplete();

    // Emit completion data for LevelSelectScene progress tracking
    if (this.levelIndex >= 0) {
      gameEvents.emit(GAME_EVENTS.LEVEL_COMPLETE, {
        levelIndex: this.levelIndex,
        deaths: this.deaths,
        coins: this.coins,
      });
    } else {
      // Custom/editor test level — also emit so EditorCanvas can handle return
      gameEvents.emit(GAME_EVENTS.LEVEL_COMPLETE, {
        levelIndex: -1,
        deaths: this.deaths,
        coins: this.coins,
      });
    }

    const overlay = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2, "NIVEL COMPLETO!", {
        fontFamily: "monospace",
        fontSize: "28px",
        color: "#44ff44",
        stroke: "#000000",
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(200);

    const statsText = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 50, `Moedas: ${this.coins}  |  Mortes: ${this.deaths}`, {
        fontFamily: "monospace",
        fontSize: "16px",
        color: "#ffffff",
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(200)
      .setAlpha(0);

    this.tweens.add({
      targets: overlay,
      scaleX: 1.1,
      scaleY: 1.1,
      duration: 300,
      yoyo: true,
      repeat: 1,
    });

    this.time.delayedCall(800, () => {
      statsText.setAlpha(1);
    });

    // Navigate to next level or level select
    this.time.delayedCall(3000, () => {
      overlay.destroy();
      statsText.destroy();
      if (this.levelIndex >= 0 && this.levelIndex < CAMPAIGN_LEVELS.length - 1) {
        // Next level
        this.scene.start("GameScene", { levelIndex: this.levelIndex + 1 });
      } else if (this.levelIndex === CAMPAIGN_LEVELS.length - 1) {
        // Campaign complete — show victory screen
        this.showCampaignVictory();
      } else if (this.levelIndex >= 0) {
        this.scene.start("LevelSelectScene");
      } else {
        // Custom/test level — EditorCanvas handles return via LEVEL_COMPLETE event
        // For standalone play, go to MenuScene if available
        if (this.scene.get("MenuScene")) {
          this.scene.start("MenuScene");
        }
      }
    });
  }

  private showCampaignVictory(): void {
    // Collect campaign stats from localStorage
    let totalDeaths = 0;
    let totalCoins = 0;
    try {
      const raw = localStorage.getItem("trap_architect_progress");
      const progress = raw ? JSON.parse(raw) : {};
      for (let i = 0; i < CAMPAIGN_LEVELS.length; i++) {
        if (progress[i]) {
          totalDeaths += progress[i].bestDeaths || 0;
          totalCoins += progress[i].bestCoins || 0;
        }
      }
    } catch { /* ignore */ }

    // Unlock "Arquiteto" skin
    try {
      const unlocked = JSON.parse(localStorage.getItem("trap_unlocked_cosmetics") || "[]");
      if (!unlocked.includes("golden")) {
        unlocked.push("golden");
        localStorage.setItem("trap_unlocked_cosmetics", JSON.stringify(unlocked));
      }
      localStorage.setItem("trap_campaign_completed", "true");
    } catch { /* ignore */ }

    // Emit campaign complete event
    gameEvents.emit(GAME_EVENTS.CAMPAIGN_COMPLETE, { totalDeaths, totalCoins });

    // Dark overlay
    this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.85)
      .setScrollFactor(0)
      .setDepth(300);

    // Title
    const title = this.add
      .text(GAME_WIDTH / 2, 60, "CAMPANHA COMPLETA!", {
        fontFamily: "monospace",
        fontSize: "28px",
        color: "#FFD700",
        stroke: "#000000",
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(301);

    this.tweens.add({
      targets: title,
      scaleX: 1.05,
      scaleY: 1.05,
      duration: 500,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    // Stats
    this.add
      .text(GAME_WIDTH / 2, 140, `x${totalDeaths} Mortes`, {
        fontFamily: "monospace",
        fontSize: "16px",
        color: "#ffffff",
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(301);

    this.add
      .text(GAME_WIDTH / 2, 170, `$${totalCoins} Moedas`, {
        fontFamily: "monospace",
        fontSize: "16px",
        color: "#ffffff",
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(301);

    // Unlock message
    this.add
      .text(GAME_WIDTH / 2, 220, "[!] Skin desbloqueada: Gato Dourado!", {
        fontFamily: "monospace",
        fontSize: "14px",
        color: "#FFD700",
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(301);

    // CTA
    this.add
      .text(GAME_WIDTH / 2, 270, "Agora e sua vez de criar!", {
        fontFamily: "monospace",
        fontSize: "14px",
        color: "#a3a3a3",
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(301);

    // Confetti particles
    this.createVictoryParticles();

    // Buttons
    const menuBtn = this.add
      .text(GAME_WIDTH / 2 - 100, 340, "Menu", {
        fontFamily: "monospace",
        fontSize: "16px",
        color: "#ffffff",
        backgroundColor: "#333333",
        padding: { x: 16, y: 8 },
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(301)
      .setInteractive({ useHandCursor: true });

    menuBtn.on("pointerover", () => menuBtn.setAlpha(0.8));
    menuBtn.on("pointerout", () => menuBtn.setAlpha(1));
    menuBtn.on("pointerdown", () => this.scene.start("MenuScene"));

    const selectBtn = this.add
      .text(GAME_WIDTH / 2 + 100, 340, "Fases", {
        fontFamily: "monospace",
        fontSize: "16px",
        color: "#ffffff",
        backgroundColor: "#ff8c00",
        padding: { x: 16, y: 8 },
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(301)
      .setInteractive({ useHandCursor: true });

    selectBtn.on("pointerover", () => selectBtn.setAlpha(0.8));
    selectBtn.on("pointerout", () => selectBtn.setAlpha(1));
    selectBtn.on("pointerdown", () => this.scene.start("LevelSelectScene"));
  }

  private createVictoryParticles(): void {
    const colors = [0xff4444, 0x44ff44, 0x4488ff, 0xffdd44, 0xff88ff, 0x44ffff];
    colors.forEach((color) => {
      const key = `confetti_${color.toString(16)}`;
      if (!this.textures.exists(key)) {
        const tex = this.textures.createCanvas(key, 6, 6);
        const ctx = tex!.getContext();
        ctx.fillStyle = `#${color.toString(16).padStart(6, "0")}`;
        ctx.fillRect(0, 0, 6, 6);
        tex!.refresh();
      }

      this.add.particles(0, 0, key, {
        x: { min: 0, max: GAME_WIDTH },
        y: -10,
        speedX: { min: -50, max: 50 },
        speedY: { min: 50, max: 150 },
        gravityY: 80,
        lifespan: 4000,
        frequency: 200,
        quantity: 1,
        rotate: { min: 0, max: 360 },
        scale: { start: 1, end: 0.3 },
      }).setScrollFactor(0).setDepth(302);
    });
  }

  private restartLevel(): void {
    this.scene.restart();
  }

  // ===========================================================
  // Power-ups & New Mechanics
  // ===========================================================

  private handleEnemyHit(): void {
    if (this.powered) {
      // Lose power-up instead of dying
      this.powered = false;
      this.powerType = null;
      this.powerTimer = 0;
      this.player.setTint(0xffffff);
      this.player.setScale(1);
      playDeath();
      // Brief invincibility flash
      this.tweens.add({
        targets: this.player,
        alpha: 0.3,
        duration: 100,
        yoyo: true,
        repeat: 5,
        onComplete: () => this.player.setAlpha(1),
      });
    } else {
      this.playerDie();
    }
  }

  private activatePowerUp(type: PowerUpType): void {
    this.powered = true;
    this.powerType = type;
    playPowerUp();

    switch (type) {
      case "mushroom":
        this.powerTimer = 0; // Lasts until hit
        this.player.setTint(0xff8c00);
        break;
      case "star":
        this.powerTimer = STAR_DURATION;
        this.player.setTint(0xffd700);
        break;
      case "fire_flower":
        this.powerTimer = FIRE_FLOWER_DURATION;
        this.player.setTint(0xff4500);
        break;
    }
  }

  private hitPowerUpBlock(gx: number, gy: number): void {
    this.level.tiles[gy][gx] = TileType.USED;
    this.updateTileSprite(gx, gy, TileType.USED);

    // Spawn a random power-up above the block
    const types: PowerUpType[] = ["mushroom", "star", "fire_flower"];
    const chosen = types[Math.floor(Math.random() * types.length)];
    const texMap: Record<string, string> = {
      mushroom: "entity_mushroom",
      star: "entity_star",
      fire_flower: "entity_fire_flower",
    };

    const ent: GameEntity = {
      type: chosen,
      x: gx * TILE_SIZE + TILE_SIZE / 2,
      y: (gy - 1) * TILE_SIZE + TILE_SIZE / 2,
      vx: chosen === "fire_flower" ? 0 : POWERUP_MOVE_SPEED,
      vy: 0,
      dir: 1,
      alive: true,
    };
    this.entities.push(ent);
    const sprite = this.add.image(ent.x, ent.y, texMap[chosen]);
    this.entitySprites.push(sprite);
  }

  private shootFireball(): void {
    if (this.fireballs.length >= 2) return; // Max 2 active fireballs
    const fb: Fireball = {
      x: this.player.x + this.player.dir * 12,
      y: this.player.y,
      vx: this.player.dir * 6,
      vy: 0,
      bounces: 0,
      sprite: this.add.image(this.player.x, this.player.y, "entity_fireball").setDepth(55),
      alive: true,
    };
    this.fireballs.push(fb);
    playFireball();
  }

  private updateFireballs(): void {
    for (let i = this.fireballs.length - 1; i >= 0; i--) {
      const fb = this.fireballs[i];
      if (!fb.alive) {
        fb.sprite.destroy();
        this.fireballs.splice(i, 1);
        continue;
      }

      // Apply gravity
      fb.vy += 0.4;
      fb.x += fb.vx;
      fb.y += fb.vy;
      fb.sprite.setPosition(fb.x, fb.y);
      fb.sprite.rotation += 0.3;

      // Wall collision
      const gx = Math.floor(fb.x / TILE_SIZE);
      const gy = Math.floor(fb.y / TILE_SIZE);
      if (this.isSolid(gx, gy)) {
        fb.alive = false;
        continue;
      }

      // Floor bounce
      const gyBelow = Math.floor((fb.y + 5) / TILE_SIZE);
      if (fb.vy > 0 && this.isSolid(gx, gyBelow)) {
        fb.vy = -4;
        fb.bounces++;
        if (fb.bounces > 3) {
          fb.alive = false;
          continue;
        }
      }

      // Out of bounds
      if (fb.x < 0 || fb.x > this.level.width * TILE_SIZE || fb.y > this.level.height * TILE_SIZE) {
        fb.alive = false;
        continue;
      }

      // Hit enemies
      for (let e = 0; e < this.entities.length; e++) {
        const ent = this.entities[e];
        if (!ent.alive) continue;
        if (ent.type === "coin" || ent.type === "flag" || ent.type === "fake_flag" ||
            ent.type === "mushroom" || ent.type === "star" || ent.type === "fire_flower") continue;
        const dx = Math.abs(fb.x - ent.x);
        const dy = Math.abs(fb.y - ent.y);
        if (dx < 14 && dy < 14) {
          ent.alive = false;
          this.entitySprites[e]?.setVisible(false);
          fb.alive = false;
          playStomp();
          this.emitStompParticles(ent.x, ent.y);
          break;
        }
      }
    }
  }

  private updatePowerUpState(): void {
    if (!this.powered || this.powerType === "mushroom") return;
    if (this.powerTimer > 0) {
      this.powerTimer--;
      // Flash near end
      if (this.powerTimer < 60 && this.powerTimer % 4 < 2) {
        this.player.setAlpha(0.5);
      } else {
        this.player.setAlpha(1);
      }
      if (this.powerTimer <= 0) {
        this.powered = false;
        this.powerType = null;
        this.player.setTint(0xffffff);
        this.player.setAlpha(1);
      }
    }
  }

  private updateDashState(): void {
    if (!this.dashing) return;
    this.dashTimer--;
    if (this.dashTimer <= 0) {
      this.dashing = false;
      // Reduce speed to normal after dash
      this.player.vx = this.player.dir * PLAYER_SPEED;
    }
  }

  private updateGravityFlip(): void {
    if (!this.gravityFlipped) return;
    if (this.gravityFlipTimer > 0) {
      this.gravityFlipTimer--;
      if (this.gravityFlipTimer <= 0) {
        this.gravityFlipped = false;
        this.player.setFlipY(false);
        this.showMessage("Gravidade normalizada!");
      }
    }
  }

  private checkGravityZoneContact(): void {
    const cx = Math.floor(this.player.x / TILE_SIZE);
    const cy = Math.floor(this.player.y / TILE_SIZE);
    // Check tiles player overlaps
    for (let gy = cy - 1; gy <= cy; gy++) {
      for (let gx = cx - 1; gx <= cx; gx++) {
        if (this.getTile(gx, gy) === TileType.GRAVITY_ZONE && !this.gravityFlipped) {
          this.gravityFlipped = true;
          this.gravityFlipTimer = GRAVITY_FLIP_DEFAULT_DURATION;
          this.player.setFlipY(true);
          playGravityFlip();
          return;
        }
      }
    }
  }

  private updateTimedBlocks(): void {
    this.timedBlockTimer++;
    const totalCycle = TIMED_BLOCK_ON + TIMED_BLOCK_OFF;
    const inCycle = this.timedBlockTimer % totalCycle;
    const shouldBeVisible = inCycle < TIMED_BLOCK_ON;

    if (shouldBeVisible !== this.timedBlockVisible) {
      this.timedBlockVisible = shouldBeVisible;
      for (let gy = 0; gy < this.level.height; gy++) {
        for (let gx = 0; gx < this.level.width; gx++) {
          if (this.level.tiles[gy][gx] === TileType.TIMED_BLOCK) {
            const sprite = this.tileSprites[gy]?.[gx];
            if (sprite) {
              sprite.setAlpha(shouldBeVisible ? 1.0 : 0.2);
            }
          }
        }
      }
    }
  }

  private updateSlideBlocks(): void {
    for (const anim of this.slideBlockAnims) {
      if (anim.done) continue;

      // Move toward target
      const dx = anim.targetX - anim.currentX;
      const dy = anim.targetY - anim.currentY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < SLIDE_BLOCK_SPEED) {
        anim.currentX = anim.targetX;
        anim.currentY = anim.targetY;
        anim.done = true;
      } else {
        anim.currentX += (dx / dist) * SLIDE_BLOCK_SPEED;
        anim.currentY += (dy / dist) * SLIDE_BLOCK_SPEED;
      }

      if (anim.sprite) {
        anim.sprite.setPosition(
          anim.currentX * TILE_SIZE + TILE_SIZE / 2,
          anim.currentY * TILE_SIZE + TILE_SIZE / 2
        );
      }

      // When done, place tile at new grid position
      if (anim.done) {
        const newGx = Math.round(anim.targetX);
        const newGy = Math.round(anim.targetY);
        this.level.tiles[newGy][newGx] = TileType.SLIDE_BLOCK;
        this.updateTileSprite(newGx, newGy, TileType.SLIDE_BLOCK);
        if (anim.sprite) {
          anim.sprite.destroy();
          anim.sprite = null;
        }
      }
    }
  }

  private updateMovingPlatforms(): void {
    for (const mp of this.movingPlatforms) {
      const speed = mp.config.speed ?? MOVING_PLATFORM_DEFAULT_SPEED;
      const range = (mp.config.range ?? MOVING_PLATFORM_DEFAULT_RANGE) * TILE_SIZE;
      const axis = mp.config.axis ?? "x";
      const startX = mp.config.gx * TILE_SIZE + TILE_SIZE / 2;
      const startY = mp.config.gy * TILE_SIZE + TILE_SIZE / 2;

      if (axis === "x") {
        mp.x += speed * mp.dir;
        if (mp.x > startX + range) { mp.x = startX + range; mp.dir = -1; }
        else if (mp.x < startX - range) { mp.x = startX - range; mp.dir = 1; }
      } else {
        mp.y += speed * mp.dir;
        if (mp.y > startY + range) { mp.y = startY + range; mp.dir = -1; }
        else if (mp.y < startY - range) { mp.y = startY - range; mp.dir = 1; }
      }

      mp.sprite.setPosition(mp.x, mp.y);

      // Carry player if standing on platform
      const platTop = mp.y - TILE_SIZE / 2;
      const platLeft = mp.x - TILE_SIZE / 2;
      const platRight = mp.x + TILE_SIZE / 2;
      const playerBottom = this.player.y + PLAYER_H / 2;
      const playerLeft = this.player.x - PLAYER_W / 2;
      const playerRight = this.player.x + PLAYER_W / 2;

      if (
        this.player.alive &&
        this.player.vy >= 0 &&
        playerBottom >= platTop - 2 &&
        playerBottom <= platTop + 4 &&
        playerRight > platLeft &&
        playerLeft < platRight
      ) {
        this.player.y = platTop - PLAYER_H / 2;
        this.player.vy = 0;
        this.player.grounded = true;
        if (axis === "x") this.player.x += speed * mp.dir;
        if (axis === "y") this.player.y += speed * mp.dir;
      }
    }
  }

  private initMovingPlatforms(): void {
    this.movingPlatforms = [];
    for (let gy = 0; gy < this.level.height; gy++) {
      for (let gx = 0; gx < this.level.width; gx++) {
        if (this.level.tiles[gy][gx] === TileType.MOVING_PLATFORM) {
          // Remove the static tile — the platform moves as a sprite
          this.level.tiles[gy][gx] = TileType.AIR;
          this.updateTileSprite(gx, gy, TileType.AIR);

          const config: MovingPlatformConfig = {
            gx,
            gy,
            axis: "x",
            speed: MOVING_PLATFORM_DEFAULT_SPEED,
            range: MOVING_PLATFORM_DEFAULT_RANGE,
          };

          // Check if level data has custom config for this position
          if (this.level.movingPlatforms) {
            const custom = this.level.movingPlatforms.find((mp) => mp.gx === gx && mp.gy === gy);
            if (custom) {
              config.speed = custom.speed ?? config.speed;
              config.range = custom.range ?? config.range;
            }
          }

          const sprite = this.add.image(
            gx * TILE_SIZE + TILE_SIZE / 2,
            gy * TILE_SIZE + TILE_SIZE / 2,
            "tile_moving_platform"
          ).setDepth(20);

          this.movingPlatforms.push({
            config,
            x: gx * TILE_SIZE + TILE_SIZE / 2,
            y: gy * TILE_SIZE + TILE_SIZE / 2,
            dir: 1,
            sprite,
          });
        }
      }
    }
  }

  private initSlideBlocks(): void {
    this.slideBlockAnims = [];
    if (!this.level.slideBlocks) return;
    // Slide blocks are initialized from level data but only animate when triggered
  }

  private triggerSlideBlock(fromGx: number, fromGy: number, toGx: number, toGy: number): void {
    // Remove tile from original position
    if (fromGy >= 0 && fromGy < this.level.height && fromGx >= 0 && fromGx < this.level.width) {
      this.level.tiles[fromGy][fromGx] = TileType.AIR;
      this.updateTileSprite(fromGx, fromGy, TileType.AIR);
    }

    // Create a moving sprite
    const sprite = this.add.image(
      fromGx * TILE_SIZE + TILE_SIZE / 2,
      fromGy * TILE_SIZE + TILE_SIZE / 2,
      "tile_slide_block"
    ).setDepth(25);

    playSlideBlock();

    this.slideBlockAnims.push({
      config: { id: `slide_${fromGx}_${fromGy}`, fromGx, fromGy, toGx, toGy, triggered: true },
      currentX: fromGx,
      currentY: fromGy,
      targetX: toGx,
      targetY: toGy,
      sprite,
      done: false,
    });
  }

  // ===========================================================
  // Particles
  // ===========================================================
  private createParticles(): void {
    // White particle texture
    if (!this.textures.exists("particle_white")) {
      const tex = this.textures.createCanvas("particle_white", 4, 4);
      const pctx = tex!.getContext();
      pctx.fillStyle = "#ffffff";
      pctx.fillRect(0, 0, 4, 4);
      tex!.refresh();
    }
    // Red particle texture
    if (!this.textures.exists("particle_red")) {
      const tex = this.textures.createCanvas("particle_red", 4, 4);
      const pctx = tex!.getContext();
      pctx.fillStyle = "#ff4444";
      pctx.fillRect(0, 0, 4, 4);
      tex!.refresh();
    }
    // Yellow particle texture
    if (!this.textures.exists("particle_yellow")) {
      const tex = this.textures.createCanvas("particle_yellow", 4, 4);
      const pctx = tex!.getContext();
      pctx.fillStyle = "#ffd700";
      pctx.fillRect(0, 0, 4, 4);
      tex!.refresh();
    }

    this.deathEmitter = this.add.particles(0, 0, "particle_red", {
      speed: { min: 50, max: 150 },
      angle: { min: 0, max: 360 },
      lifespan: 600,
      gravityY: 200,
      quantity: 12,
      emitting: false,
    });
    this.deathEmitter.setDepth(60);

    this.jumpEmitter = this.add.particles(0, 0, "particle_white", {
      speed: { min: 20, max: 60 },
      angle: { min: 200, max: 340 },
      lifespan: 300,
      scale: { start: 1, end: 0 },
      quantity: 5,
      emitting: false,
    });
    this.jumpEmitter.setDepth(45);

    this.coinEmitter = this.add.particles(0, 0, "particle_yellow", {
      speed: { min: 30, max: 80 },
      angle: { min: 0, max: 360 },
      lifespan: 400,
      scale: { start: 1, end: 0 },
      quantity: 8,
      emitting: false,
    });
    this.coinEmitter.setDepth(60);

    // Trail emitter (configured based on equipped trail)
    this.setupTrailEmitter();
  }

  private setupTrailEmitter(): void {
    if (this.trailEmitter) {
      this.trailEmitter.destroy();
      this.trailEmitter = null;
    }

    if (typeof window === "undefined") return;
    const trailId = localStorage.getItem("trap_equipped_trail") || "trail_none";
    if (trailId === "trail_none") return;

    // Create colored trail texture
    const trailColors: Record<string, number> = {
      trail_fire: 0xff4500,
      trail_ice: 0x00bfff,
      trail_stars: 0xffd700,
      trail_rainbow: 0xff0000,
    };

    const color = trailColors[trailId] || 0xffffff;
    const texKey = `trail_tex_${trailId}`;
    if (!this.textures.exists(texKey)) {
      const tex = this.textures.createCanvas(texKey, 3, 3);
      const ctx = tex!.getContext();
      ctx.fillStyle = "#" + color.toString(16).padStart(6, "0");
      ctx.fillRect(0, 0, 3, 3);
      tex!.refresh();
    }

    this.trailEmitter = this.add.particles(0, 0, texKey, {
      speed: { min: 10, max: 40 },
      angle: { min: 160, max: 200 },
      lifespan: 500,
      scale: { start: 1.5, end: 0 },
      alpha: { start: 0.8, end: 0 },
      quantity: 1,
      frequency: 30,
      maxParticles: 50,
      emitting: false,
    });
    this.trailEmitter.setDepth(44);

    // Rainbow trail uses tint cycling
    if (trailId === "trail_rainbow") {
      const rainbowColors = [0xff0000, 0xff7f00, 0xffff00, 0x00ff00, 0x0000ff, 0x8b00ff];
      let colorIdx = 0;
      this.time.addEvent({
        delay: 100,
        loop: true,
        callback: () => {
          if (this.trailEmitter) {
            this.trailEmitter.setParticleTint(rainbowColors[colorIdx % rainbowColors.length]);
            colorIdx++;
          }
        },
      });
    }
  }

  private updateTrail(): void {
    if (!this.trailEmitter || !this.player.alive) {
      if (this.trailEmitter) this.trailEmitter.emitting = false;
      return;
    }
    const moving = this.player.vx !== 0 || this.player.vy !== 0;
    this.trailEmitter.emitting = moving;
    if (moving) {
      this.trailEmitter.setPosition(this.player.x, this.player.y);
    }
  }

  private emitDeathParticles(): void {
    const effectId = typeof window !== "undefined"
      ? (localStorage.getItem("trap_equipped_death_effect") || "death_default")
      : "death_default";

    const x = this.player.x;
    const y = this.player.y;

    switch (effectId) {
      case "death_pixelate":
        this.emitPixelateEffect(x, y);
        break;
      case "death_ghost":
        this.emitGhostEffect(x, y);
        break;
      case "death_confetti":
        this.emitConfettiEffect(x, y);
        break;
      case "death_shatter":
        this.emitShatterEffect(x, y);
        break;
      default:
        this.deathEmitter.emitParticleAt(x, y);
        break;
    }
  }

  private emitPixelateEffect(x: number, y: number): void {
    // Square particles that scatter in grid pattern
    for (let i = 0; i < 12; i++) {
      const px = x + (Math.random() - 0.5) * PLAYER_W;
      const py = y + (Math.random() - 0.5) * PLAYER_H;
      const block = this.add.rectangle(px, py, 6, 6, 0xff8c00).setDepth(60);
      this.tweens.add({
        targets: block,
        x: px + (Math.random() - 0.5) * 120,
        y: py + Math.random() * 80 + 30,
        alpha: 0,
        angle: Math.random() * 360,
        duration: 600,
        ease: "Power2",
        onComplete: () => block.destroy(),
      });
    }
  }

  private emitGhostEffect(x: number, y: number): void {
    const ghost = this.add.image(x, y, "particle_ghost").setDepth(60).setAlpha(0.7);
    this.tweens.add({
      targets: ghost,
      y: y - 80,
      alpha: 0,
      duration: 1200,
      ease: "Power1",
      onComplete: () => ghost.destroy(),
    });
  }

  private emitConfettiEffect(x: number, y: number): void {
    const colors = [0xff4444, 0x44ff44, 0x4444ff, 0xffff44, 0xff44ff, 0x44ffff];
    for (let i = 0; i < 16; i++) {
      const color = colors[i % colors.length];
      const piece = this.add.rectangle(x, y, 4, 4, color).setDepth(60);
      this.tweens.add({
        targets: piece,
        x: x + (Math.random() - 0.5) * 150,
        y: y + (Math.random() - 0.5) * 150,
        alpha: 0,
        angle: Math.random() * 720,
        duration: 800,
        ease: "Power2",
        onComplete: () => piece.destroy(),
      });
    }
  }

  private emitShatterEffect(x: number, y: number): void {
    for (let i = 0; i < 10; i++) {
      const shard = this.add.image(x, y, "particle_shard").setDepth(60);
      shard.setAngle(Math.random() * 360);
      this.tweens.add({
        targets: shard,
        x: x + (Math.random() - 0.5) * 160,
        y: y + Math.random() * 100,
        alpha: 0,
        angle: shard.angle + (Math.random() - 0.5) * 360,
        duration: 700,
        ease: "Power2",
        onComplete: () => shard.destroy(),
      });
    }
  }

  private emitJumpParticles(): void {
    this.jumpEmitter.emitParticleAt(this.player.x, this.player.y + PLAYER_H / 2);
  }

  private emitCoinParticles(x: number, y: number): void {
    this.coinEmitter.emitParticleAt(x, y);
  }

  private emitStompParticles(x: number, y: number): void {
    if (this.textures.exists("particle_stomp")) {
      for (let i = 0; i < 6; i++) {
        const p = this.add.image(x + (Math.random() - 0.5) * 20, y, "particle_stomp");
        p.setAlpha(0.8).setScale(0.5 + Math.random() * 0.5).setDepth(55);
        this.tweens.add({
          targets: p,
          y: y - 10 - Math.random() * 15,
          x: p.x + (Math.random() - 0.5) * 30,
          alpha: 0,
          scale: 0,
          duration: 300 + Math.random() * 200,
          onComplete: () => p.destroy(),
        });
      }
    }
  }

  private emitBrickParticles(x: number, y: number): void {
    if (this.textures.exists("particle_brick")) {
      for (let i = 0; i < 8; i++) {
        const p = this.add.image(x + (Math.random() - 0.5) * 16, y, "particle_brick");
        p.setDepth(55);
        this.tweens.add({
          targets: p,
          y: y - 20 - Math.random() * 40,
          x: p.x + (Math.random() - 0.5) * 50,
          angle: Math.random() * 360,
          alpha: 0,
          duration: 500 + Math.random() * 300,
          onComplete: () => p.destroy(),
        });
      }
    }
  }

  private emitDustParticles(x: number, y: number): void {
    if (this.textures.exists("particle_dust")) {
      for (let i = 0; i < 4; i++) {
        const p = this.add.image(x + (Math.random() - 0.5) * 12, y, "particle_dust");
        p.setAlpha(0.5).setScale(0.8).setDepth(40);
        this.tweens.add({
          targets: p,
          y: y - 5,
          x: p.x + (Math.random() - 0.5) * 16,
          alpha: 0,
          scale: 0.3,
          duration: 250,
          onComplete: () => p.destroy(),
        });
      }
    }
  }

  private emitSpringParticles(x: number, y: number): void {
    if (this.textures.exists("particle_spring")) {
      for (let i = 0; i < 5; i++) {
        const p = this.add.image(x + (Math.random() - 0.5) * 16, y, "particle_spring");
        p.setScale(0.5 + Math.random() * 0.5).setDepth(55);
        this.tweens.add({
          targets: p,
          y: y - 15 - Math.random() * 20,
          x: p.x + (Math.random() - 0.5) * 24,
          alpha: 0,
          angle: Math.random() * 180,
          duration: 400 + Math.random() * 200,
          onComplete: () => p.destroy(),
        });
      }
    }
  }

  // ===========================================================
  // Pause Menu
  // ===========================================================
  private pauseGame(): void {
    if (this.paused) return;
    this.paused = true;
    this.pauseStartTime = Date.now();
    gameEvents.emit(GAME_EVENTS.GAME_PAUSED);

    const cw = GAME_WIDTH;
    const ch = GAME_HEIGHT;

    // Dark overlay (click outside panel to resume)
    const bg = this.add
      .rectangle(cw / 2, ch / 2, cw, ch, 0x000000, 0.6)
      .setScrollFactor(0)
      .setDepth(300)
      .setInteractive({ useHandCursor: false })
      .on("pointerdown", (_p: Phaser.Input.Pointer, _lx: number, _ly: number, ev: Phaser.Types.Input.EventData) => {
        ev.stopPropagation();
        this.resumeGame();
      });

    // Panel background
    const panelW = 320;
    const panelH = 340;
    const panelX = cw / 2;
    const panelY = ch / 2;

    const panel = this.add
      .rectangle(panelX, panelY, panelW, panelH, 0x1a1a2e, 0.95)
      .setScrollFactor(0)
      .setDepth(301)
      .setStrokeStyle(2, 0x6366f1)
      .setInteractive()
      .on("pointerdown", (_p: Phaser.Input.Pointer, _lx: number, _ly: number, ev: Phaser.Types.Input.EventData) => {
        ev.stopPropagation();
      });

    // Title
    const title = this.add
      .text(panelX, panelY - 140, "|| Pausado", {
        fontFamily: "monospace",
        fontSize: "24px",
        color: "#ffffff",
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(302);

    // Stats
    const elapsed = Date.now() - this.startTime - this.totalPausedMs;
    const secs = Math.floor(elapsed / 1000);
    const statsText = `x${this.deaths}  |  $${this.coins}  |  T ${secs}s`;
    const stats = this.add
      .text(panelX, panelY - 105, statsText, {
        fontFamily: "monospace",
        fontSize: "13px",
        color: "#9ca3af",
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(302);

    // Helper: create button
    const makeBtn = (y: number, label: string, color: string, cb: () => void) => {
      const btn = this.add
        .text(panelX, y, label, {
          fontFamily: "monospace",
          fontSize: "16px",
          color,
          backgroundColor: "rgba(255,255,255,0.07)",
          padding: { x: 40, y: 10 },
        })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(302)
        .setInteractive({ useHandCursor: true })
        .on("pointerover", () => btn.setStyle({ backgroundColor: "rgba(255,255,255,0.15)" }))
        .on("pointerout", () => btn.setStyle({ backgroundColor: "rgba(255,255,255,0.07)" }))
        .on("pointerdown", (_p: Phaser.Input.Pointer, _lx: number, _ly: number, ev: Phaser.Types.Input.EventData) => {
          ev.stopPropagation();
          cb();
        });
      return btn;
    };

    const btnContinue = makeBtn(panelY - 60, ">  Continuar", "#4ade80", () => this.resumeGame());
    const btnRestart = makeBtn(panelY - 15, "R  Reiniciar", "#fbbf24", () => {
      this.resumeGame();
      this.restartLevel();
    });

    // Settings section
    const settingsLabel = this.add
      .text(panelX, panelY + 30, "*  Configuracoes", {
        fontFamily: "monospace",
        fontSize: "13px",
        color: "#6366f1",
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(302);

    // SFX toggle
    let sfxOn = isSoundEnabled();
    const sfxBtn = this.add
      .text(panelX, panelY + 60, `SFX: ${sfxOn ? "[ON] Ligado" : "[--] Desligado"}`, {
        fontFamily: "monospace",
        fontSize: "14px",
        color: sfxOn ? "#4ade80" : "#ef4444",
        backgroundColor: "rgba(255,255,255,0.05)",
        padding: { x: 24, y: 6 },
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(302)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", (_p: Phaser.Input.Pointer, _lx: number, _ly: number, ev: Phaser.Types.Input.EventData) => {
        ev.stopPropagation();
        sfxOn = !sfxOn;
        setSoundEnabled(sfxOn);
        sfxBtn.setText(`SFX: ${sfxOn ? "[ON] Ligado" : "[--] Desligado"}`);
        sfxBtn.setColor(sfxOn ? "#4ade80" : "#ef4444");
      });

    // Music toggle
    let musicOn = isMusicEnabled();
    const musicBtn = this.add
      .text(panelX, panelY + 95, `Musica: ${musicOn ? "[ON] Ligada" : "[--] Desligada"}`, {
        fontFamily: "monospace",
        fontSize: "14px",
        color: musicOn ? "#4ade80" : "#ef4444",
        backgroundColor: "rgba(255,255,255,0.05)",
        padding: { x: 12, y: 6 },
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(302)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", (_p: Phaser.Input.Pointer, _lx: number, _ly: number, ev: Phaser.Types.Input.EventData) => {
        ev.stopPropagation();
        musicOn = !musicOn;
        setMusicEnabled(musicOn);
        if (musicOn) {
          const m = this.level.music;
          playBGM((m === "easy" || m === "medium" || m === "hard") ? m : "medium");
        }
        musicBtn.setText(`Musica: ${musicOn ? "[ON] Ligada" : "[--] Desligada"}`);
        musicBtn.setColor(musicOn ? "#4ade80" : "#ef4444");
      });

    // Quit button
    const btnQuit = makeBtn(panelY + 140, "X  Sair", "#ef4444", () => {
      this.resumeGame();
      stopBGM();
      if (this.levelIndex >= 0) {
        this.scene.start("LevelSelectScene");
      } else if (this.scene.get("MenuScene")) {
        this.scene.start("MenuScene");
      } else {
        // Editor test mode — emit event so EditorCanvas can handle return
        gameEvents.emit(GAME_EVENTS.LEVEL_COMPLETE, {
          levelIndex: -1,
          deaths: this.deaths,
          coins: this.coins,
        });
      }
    });

    this.pauseOverlay = [bg, panel, title, stats, btnContinue, btnRestart, settingsLabel, sfxBtn, musicBtn, btnQuit];

    // R to restart while paused
    if (this.input.keyboard) {
      const rKey = this.input.keyboard.addKey("R");
      const rHandler = () => {
        if (this.paused) {
          rKey.off("down", rHandler);
          this.resumeGame();
          this.restartLevel();
        }
      };
      rKey.on("down", rHandler);
      // Store ref for cleanup
      (this as unknown as Record<string, unknown>)._pauseRKey = rKey;
      (this as unknown as Record<string, unknown>)._pauseRHandler = rHandler;
    }
  }

  private resumeGame(): void {
    if (!this.paused) return;
    this.paused = false;
    // Accumulate paused time so we don't count it
    this.totalPausedMs += Date.now() - this.pauseStartTime;
    gameEvents.emit(GAME_EVENTS.GAME_RESUMED);
    this.pauseOverlay.forEach((obj) => obj.destroy());
    this.pauseOverlay = [];

    // Cleanup R key listener
    const rKey = (this as unknown as Record<string, unknown>)._pauseRKey as Phaser.Input.Keyboard.Key | undefined;
    const rHandler = (this as unknown as Record<string, unknown>)._pauseRHandler as (() => void) | undefined;
    if (rKey && rHandler) {
      rKey.off("down", rHandler);
    }
  }
}
