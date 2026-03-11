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
  SOLID_TILES,
  ONEWAY_TILES,
  LETHAL_TILES,
} from "../constants";
import { TileType, type ParsedLevel, type GameEntity } from "../types";
import { gameEvents, GAME_EVENTS } from "../events";
import { DEMO_LEVEL } from "../levels/demo";
import { getCampaignLevel, CAMPAIGN_LEVELS } from "../levels/campaign";
import { playJump, playDeath, playCoin, playComplete, playSpring, playStomp } from "../audio";

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

export class GameScene extends Phaser.Scene {
  private player!: PlayerSprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private level!: ParsedLevel;
  private levelIndex = -1;
  private tileSprites: (Phaser.GameObjects.Image | null)[][] = [];
  private entitySprites: Phaser.GameObjects.Image[] = [];
  private entities: GameEntity[] = [];
  private coins = 0;
  private deaths = 0;
  private crumbling: CrumblingTile[] = [];
  private hudCoins!: Phaser.GameObjects.Text;
  private hudDeaths!: Phaser.GameObjects.Text;
  private levelNameText!: Phaser.GameObjects.Text;
  private levelNameTimer = 0;
  // Particles
  private deathEmitter!: Phaser.GameObjects.Particles.ParticleEmitter;
  private jumpEmitter!: Phaser.GameObjects.Particles.ParticleEmitter;
  private coinEmitter!: Phaser.GameObjects.Particles.ParticleEmitter;
  // Pause
  private paused = false;
  private pauseOverlay: Phaser.GameObjects.GameObject[] = [];

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

    this.cameras.main.setBackgroundColor(this.level.bgColor);

    // Build tile map
    this.buildTileMap();

    // Spawn entities
    this.spawnEntities();

    // Create player
    this.createPlayer();

    // Camera follow
    this.cameras.main.setBounds(0, 0, this.level.width * TILE_SIZE, this.level.height * TILE_SIZE);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

    // Input
    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
    }

    // HUD (fixed to camera)
    this.hudCoins = this.add
      .text(16, 16, "🪙 0", {
        fontFamily: "monospace",
        fontSize: "16px",
        color: "#ffd700",
      })
      .setScrollFactor(0)
      .setDepth(100);

    this.hudDeaths = this.add
      .text(16, 40, "💀 0", {
        fontFamily: "monospace",
        fontSize: "16px",
        color: "#ff4444",
      })
      .setScrollFactor(0)
      .setDepth(100);

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

    // ESC to toggle pause
    if (this.input.keyboard) {
      this.input.keyboard.on("keydown-ESC", () => {
        if (this.paused) {
          this.resumeGame();
        } else {
          this.pauseGame();
        }
      });
    }
  }

  update(): void {
    if (this.paused) return;
    if (!this.player.alive) return;

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

    // Crumbling tiles
    this.updateCrumbling();

    // Entity updates
    this.updateEntities();

    // Check death by falling
    if (this.player.y > this.level.height * TILE_SIZE + 64) {
      this.playerDie();
    }

    // Troll triggers
    this.checkTrolls();

    // Update HUD
    this.hudCoins.setText(`🪙 ${this.coins}`);
    this.hudDeaths.setText(`💀 ${this.deaths}`);
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
      [TileType.PIPE_TL]: "tile_pipe",
      [TileType.PIPE_TR]: "tile_pipe",
      [TileType.PIPE_BL]: "tile_pipe",
      [TileType.PIPE_BR]: "tile_pipe",
      [TileType.LAVA]: "tile_lava",
      [TileType.TROLL_Q]: "tile_question",
      [TileType.USED]: "tile_ground",
      [TileType.CASTLE]: "tile_castle",
      [TileType.SPRING]: "tile_spring",
      [TileType.CLOUD]: "tile_cloud",
      [TileType.PLATFORM]: "tile_platform",
      [TileType.ICE]: "tile_ice",
      [TileType.CONVEYOR_L]: "tile_conveyor",
      [TileType.CONVEYOR_R]: "tile_conveyor",
      [TileType.CHECKPOINT]: "tile_checkpoint",
      [TileType.TRAMPOLINE]: "tile_trampoline",
    };

    const key = textureMap[tile];
    if (!key) return null;

    const sprite = this.add.image(gx * TILE_SIZE + TILE_SIZE / 2, gy * TILE_SIZE + TILE_SIZE / 2, key);

    // Invisible tiles start hidden
    if (tile === TileType.INVISIBLE) {
      sprite.setAlpha(0);
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
        fast_goomba: "entity_goomba",
        spiny: "entity_spiny",
        flying: "entity_flying",
      };

      const key = textureMap[ent.type];
      if (!key) continue;

      const sprite = this.add.image(ent.x, ent.y, key);
      ent.alive = true;
      ent.vx = ent.vx ?? (ent.type === "coin" || ent.type === "flag" || ent.type === "fake_flag" ? 0 : -1.5);
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

    const onIce = this.isOnTile(TileType.ICE);

    // Horizontal movement
    if (this.cursors.left.isDown) {
      if (onIce) {
        this.player.vx -= 0.15;
      } else {
        this.player.vx = -PLAYER_SPEED;
      }
      this.player.dir = -1;
    } else if (this.cursors.right.isDown) {
      if (onIce) {
        this.player.vx += 0.15;
      } else {
        this.player.vx = PLAYER_SPEED;
      }
      this.player.dir = 1;
    } else if (onIce) {
      this.player.vx *= ICE_FRICTION;
    } else {
      this.player.vx = 0;
    }

    // Clamp ice speed
    if (onIce) {
      this.player.vx = Phaser.Math.Clamp(this.player.vx, -4.16, 4.16);
    }

    // Jump
    if (this.cursors.up.isDown && this.player.grounded && !this.player.jumpHeld) {
      this.player.vy = JUMP_FORCE;
      this.player.grounded = false;
      this.player.jumpHeld = true;
      playJump();
      this.emitJumpParticles();
    }

    // Variable jump height
    if (!this.cursors.up.isDown && this.player.vy < -4) {
      this.player.vy = -4;
      this.player.jumpHeld = false;
    }

    if (this.cursors.up.isUp) {
      this.player.jumpHeld = false;
    }
  }

  private applyPhysics(): void {
    // Gravity
    this.player.vy += GRAVITY;
    if (this.player.vy > MAX_FALL) this.player.vy = MAX_FALL;

    // Conveyor push
    if (this.isOnTile(TileType.CONVEYOR_L)) this.player.vx -= CONVEYOR_SPEED;
    if (this.isOnTile(TileType.CONVEYOR_R)) this.player.vx += CONVEYOR_SPEED;

    // Move X
    this.player.x += this.player.vx;
    this.resolveCollisionX();

    // Move Y
    this.player.y += this.player.vy;
    this.resolveCollisionY();

    // Flip sprite
    this.player.setFlipX(this.player.dir === -1);
  }

  private getTile(gx: number, gy: number): TileType {
    if (gy < 0 || gy >= this.level.height || gx < 0 || gx >= this.level.width) {
      return TileType.AIR;
    }
    return this.level.tiles[gy]?.[gx] ?? TileType.AIR;
  }

  private isSolid(gx: number, gy: number): boolean {
    const t = this.getTile(gx, gy);
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
            // One-way: only if feet were above
            const prevBottom = this.player.y + halfH - this.player.vy;
            if (prevBottom > gyBottom * TILE_SIZE) continue;
          }

          this.player.y = gyBottom * TILE_SIZE - halfH;
          this.player.vy = 0;
          this.player.grounded = true;

          // Special landing effects
          if (tile === TileType.SPRING) {
            this.player.vy = JUMP_FORCE * SPRING_MULTIPLIER;
            this.player.grounded = false;
            playSpring();
          } else if (tile === TileType.TRAMPOLINE) {
            this.player.vy = JUMP_FORCE * TRAMPOLINE_MULTIPLIER;
            this.player.grounded = false;
            playSpring();
          } else if (tile === TileType.FAKE_GROUND) {
            this.startCrumbling(gx, gyBottom);
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
        this.playerDie();
        return;
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
    gameEvents.emit(GAME_EVENTS.COINS_CHANGED, this.coins);
  }

  private breakBrick(gx: number, gy: number): void {
    this.level.tiles[gy][gx] = TileType.AIR;
    this.updateTileSprite(gx, gy, TileType.AIR);
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
        // Reverse at walls
        const gx = Math.floor(ent.x / TILE_SIZE);
        const gy = Math.floor(ent.y / TILE_SIZE);
        if (this.isSolid(gx + (ent.dir === 1 ? 1 : -1), gy)) {
          ent.dir = ((ent.dir ?? -1) * -1) as 1 | -1;
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

      // Player collision with entity
      const dx = Math.abs(this.player.x - ent.x);
      const dy = Math.abs(this.player.y - ent.y);

      if (dx < halfW + 8 && dy < halfH + 8) {
        if (ent.type === "coin") {
          ent.alive = false;
          sprite.setVisible(false);
          this.coins++;
          playCoin();
          this.emitCoinParticles(ent.x, ent.y);
          gameEvents.emit(GAME_EVENTS.COINS_CHANGED, this.coins);
        } else if (ent.type === "flag") {
          gameEvents.emit(GAME_EVENTS.LEVEL_COMPLETE);
          this.showLevelComplete();
        } else if (ent.type === "fake_flag") {
          this.playerDie();
        } else if (ent.type === "spiny") {
          this.playerDie();
        } else if (ent.type === "goomba" || ent.type === "fast_goomba" || ent.type === "flying") {
          // Stomp from above
          if (this.player.vy > 0 && this.player.y < ent.y - 4) {
            ent.alive = false;
            sprite.setVisible(false);
            this.player.vy = JUMP_FORCE * 0.6;
            playStomp();
          } else {
            this.playerDie();
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
                fast_goomba: "entity_goomba",
                spiny: "entity_spiny",
                flying: "entity_flying",
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

  private respawn(): void {
    const spawnX = this.level._checkpointX ?? this.level.playerStart.x;
    const spawnY = this.level._checkpointY ?? this.level.playerStart.y;
    this.player.setPosition(spawnX, spawnY);
    this.player.vx = 0;
    this.player.vy = 0;
    this.player.setAlpha(1);
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
    }

    const overlay = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2, "🎉 NÍVEL COMPLETO!", {
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
      } else if (this.levelIndex >= 0) {
        // All levels complete — back to level select
        this.scene.start("LevelSelectScene");
      } else {
        this.scene.start("MenuScene");
      }
    });
  }

  private restartLevel(): void {
    this.scene.restart();
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
  }

  private emitDeathParticles(): void {
    this.deathEmitter.emitParticleAt(this.player.x, this.player.y);
  }

  private emitJumpParticles(): void {
    this.jumpEmitter.emitParticleAt(this.player.x, this.player.y + PLAYER_H / 2);
  }

  private emitCoinParticles(x: number, y: number): void {
    this.coinEmitter.emitParticleAt(x, y);
  }

  // ===========================================================
  // Pause Menu
  // ===========================================================
  private pauseGame(): void {
    if (this.paused) return;
    this.paused = true;
    gameEvents.emit(GAME_EVENTS.GAME_PAUSED);

    const bg = this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.65)
      .setScrollFactor(0)
      .setDepth(300);

    const title = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 50, "⏸ PAUSADO", {
        fontFamily: "monospace",
        fontSize: "28px",
        color: "#ffffff",
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(301);

    const btnContinue = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 10, "▶ Continuar", {
        fontFamily: "monospace",
        fontSize: "18px",
        color: "#44ff44",
        backgroundColor: "rgba(0,0,0,0.5)",
        padding: { x: 16, y: 8 },
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(301)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => this.resumeGame());

    const btnQuit = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 60, "✕ Sair", {
        fontFamily: "monospace",
        fontSize: "18px",
        color: "#ff4444",
        backgroundColor: "rgba(0,0,0,0.5)",
        padding: { x: 16, y: 8 },
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(301)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => {
        this.resumeGame();
        if (this.levelIndex >= 0) {
          this.scene.start("LevelSelectScene");
        } else {
          this.scene.start("MenuScene");
        }
      });

    this.pauseOverlay = [bg, title, btnContinue, btnQuit];
  }

  private resumeGame(): void {
    if (!this.paused) return;
    this.paused = false;
    gameEvents.emit(GAME_EVENTS.GAME_RESUMED);
    this.pauseOverlay.forEach((obj) => obj.destroy());
    this.pauseOverlay = [];
  }
}
