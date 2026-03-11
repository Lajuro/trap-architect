import * as Phaser from "phaser";
import {
  TILE_SIZE,
  EDITOR_DEFAULT_WIDTH,
  EDITOR_DEFAULT_HEIGHT,
  EDITOR_MIN_WIDTH,
  EDITOR_MAX_WIDTH,
  EDITOR_MIN_HEIGHT,
  EDITOR_MAX_HEIGHT,
  EDITOR_MAX_UNDO,
  EDITOR_SCROLL_SPEED,
  PALETTE_ITEMS,
} from "../constants";
import { TileType, type EntityType, type LevelData, type TrollTrigger } from "../types";
import { gameEvents } from "../events";

// ============================================================
// Editor Events
// ============================================================
export const EDITOR_EVENTS = {
  // EditorScene → React
  LEVEL_DATA_CHANGED: "editor:data_changed",
  SELECTION_CHANGED: "editor:selection",
  READY: "editor:ready",
  TEST_REQUEST: "editor:test_request",
  EXPORT_REQUEST: "editor:export",

  // React → EditorScene
  SET_TOOL: "editor:set_tool",
  SET_PALETTE_ITEM: "editor:set_palette",
  SET_LEVEL_META: "editor:set_meta",
  RESIZE_LEVEL: "editor:resize",
  UNDO: "editor:undo",
  REDO: "editor:redo",
  TEST_PLAY: "editor:test_play",
  STOP_TEST: "editor:stop_test",
  IMPORT_LEVEL: "editor:import",
  EXPORT_LEVEL: "editor:export_level",
  ADD_TROLL: "editor:add_troll",
  REMOVE_TROLL: "editor:remove_troll",
  UPDATE_TROLL: "editor:update_troll",
} as const;

// ============================================================
// Types
// ============================================================
interface EditorEntity {
  type: EntityType;
  gx: number;
  gy: number;
  sprite: Phaser.GameObjects.Image;
}

interface UndoAction {
  type: "tile" | "entity_add" | "entity_remove" | "entity_move";
  // tile
  gx?: number;
  gy?: number;
  oldTile?: number;
  newTile?: number;
  // entity
  entity?: { type: EntityType; gx: number; gy: number };
  oldPos?: { gx: number; gy: number };
  newPos?: { gx: number; gy: number };
}

// ============================================================
// EditorScene
// ============================================================
export class EditorScene extends Phaser.Scene {
  // Grid data
  private gridW = EDITOR_DEFAULT_WIDTH;
  private gridH = EDITOR_DEFAULT_HEIGHT;
  private tiles: number[][] = [];

  // Entities
  private entities: EditorEntity[] = [];
  private playerStart = { gx: 3, gy: 12 };

  // Trolls
  private trolls: TrollTrigger[] = [];
  private trollMarkers: Phaser.GameObjects.Graphics[] = [];

  // Rendering
  private tileSprites: (Phaser.GameObjects.Image | null)[][] = [];
  private gridGraphics!: Phaser.GameObjects.Graphics;
  private hoverGraphics!: Phaser.GameObjects.Graphics;
  private boundsGraphics!: Phaser.GameObjects.Graphics;

  // Tool state
  private selectedPaletteId = 1; // Ground Top by default
  private isDrawing = false;
  private lastDrawGx = -1;
  private lastDrawGy = -1;

  // Undo/Redo
  private undoStack: UndoAction[] = [];
  private redoStack: UndoAction[] = [];

  // Camera/scroll
  private scrollSpeed = EDITOR_SCROLL_SPEED;

  // Level metadata
  private levelName = "Meu Nível";
  private bgColor = "#5c94fc";
  private music = "level1";

  // Keys
  private wasd!: {
    W: Phaser.Input.Keyboard.Key;
    A: Phaser.Input.Keyboard.Key;
    S: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
  };
  private ctrlKey!: Phaser.Input.Keyboard.Key;
  private zKey!: Phaser.Input.Keyboard.Key;
  private yKey!: Phaser.Input.Keyboard.Key;
  private shiftKey!: Phaser.Input.Keyboard.Key;

  constructor() {
    super({ key: "EditorScene" });
  }

  init(data?: { levelData?: LevelData }): void {
    if (data?.levelData) {
      this.importLevelData(data.levelData);
    } else {
      this.initEmptyGrid();
    }
  }

  create(): void {
    // Background
    this.cameras.main.setBackgroundColor(this.bgColor);

    // Set world bounds
    const worldW = this.gridW * TILE_SIZE;
    const worldH = this.gridH * TILE_SIZE;
    this.cameras.main.setBounds(0, 0, worldW, worldH);

    // Grid graphics (drawn once)
    this.gridGraphics = this.add.graphics().setDepth(1);
    this.drawGrid();

    // Bounds indicator
    this.boundsGraphics = this.add.graphics().setDepth(0);
    this.drawBounds();

    // Hover preview
    this.hoverGraphics = this.add.graphics().setDepth(50);

    // Build initial tile sprites
    this.buildAllTileSprites();

    // Build entity sprites
    this.buildAllEntitySprites();

    // Build troll markers
    this.buildTrollMarkers();

    // Input: keyboard
    if (this.input.keyboard) {
      this.wasd = {
        W: this.input.keyboard.addKey("W"),
        A: this.input.keyboard.addKey("A"),
        S: this.input.keyboard.addKey("S"),
        D: this.input.keyboard.addKey("D"),
      };
      this.ctrlKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.CTRL);
      this.zKey = this.input.keyboard.addKey("Z");
      this.yKey = this.input.keyboard.addKey("Y");
      this.shiftKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
    }

    // Mouse zoom
    this.input.on("wheel", (_pointer: Phaser.Input.Pointer, _gos: unknown[], _dx: number, dy: number) => {
      const cam = this.cameras.main;
      const newZoom = Phaser.Math.Clamp(cam.zoom + (dy > 0 ? -0.1 : 0.1), 0.25, 3);
      cam.setZoom(newZoom);
    });

    // Mouse draw
    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      if (pointer.rightButtonDown()) {
        // Right-click = erase
        const { gx, gy } = this.pointerToGrid(pointer);
        this.eraseTile(gx, gy);
        return;
      }
      this.isDrawing = true;
      this.handleDraw(pointer);
    });

    this.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
      if (this.isDrawing && pointer.isDown) {
        this.handleDraw(pointer);
      }
    });

    this.input.on("pointerup", () => {
      this.isDrawing = false;
      this.lastDrawGx = -1;
      this.lastDrawGy = -1;
    });

    // Enable right-click
    if (this.game.canvas) {
      this.game.canvas.addEventListener("contextmenu", (e) => e.preventDefault());
    }

    // Register React event listeners
    this.registerEventListeners();

    // Signal ready
    gameEvents.emit(EDITOR_EVENTS.READY);
    this.emitLevelData();
  }

  update(): void {
    // Camera scroll with WASD
    if (this.wasd) {
      const cam = this.cameras.main;
      const speed = this.scrollSpeed / cam.zoom;
      if (this.wasd.A.isDown) cam.scrollX -= speed;
      if (this.wasd.D.isDown) cam.scrollX += speed;
      if (this.wasd.W.isDown) cam.scrollY -= speed;
      if (this.wasd.S.isDown) cam.scrollY += speed;
    }

    // Undo/Redo keyboard shortcuts
    if (this.ctrlKey?.isDown) {
      if (Phaser.Input.Keyboard.JustDown(this.zKey)) {
        if (this.shiftKey?.isDown) {
          this.redo();
        } else {
          this.undo();
        }
      }
      if (Phaser.Input.Keyboard.JustDown(this.yKey)) {
        this.redo();
      }
    }

    // Hover preview
    this.updateHoverPreview();
  }

  // ============================================================
  // Grid initialization
  // ============================================================
  private initEmptyGrid(): void {
    this.tiles = [];
    for (let y = 0; y < this.gridH; y++) {
      this.tiles[y] = [];
      for (let x = 0; x < this.gridW; x++) {
        // Default: ground at bottom 2 rows
        if (y === this.gridH - 2) {
          this.tiles[y][x] = TileType.GROUND_TOP;
        } else if (y === this.gridH - 1) {
          this.tiles[y][x] = TileType.GROUND;
        } else {
          this.tiles[y][x] = TileType.AIR;
        }
      }
    }
    this.entities = [];
    this.playerStart = { gx: 3, gy: this.gridH - 3 };
    this.trolls = [];
  }

  private importLevelData(data: LevelData): void {
    this.gridW = data.gridW;
    this.gridH = data.gridH;
    this.levelName = data.name;
    this.bgColor = data.bgColor;
    this.music = data.music;
    this.playerStart = { gx: data.playerStart.x, gy: data.playerStart.y };

    // Copy tiles
    this.tiles = [];
    for (let y = 0; y < this.gridH; y++) {
      this.tiles[y] = [];
      for (let x = 0; x < this.gridW; x++) {
        this.tiles[y][x] = data.tiles[y]?.[x] ?? TileType.AIR;
      }
    }

    // Import entities (sprites will be created in create())
    this.entities = data.entities.map((e) => ({
      type: e.type,
      gx: e.gx,
      gy: e.gy,
      sprite: null as unknown as Phaser.GameObjects.Image, // will be set later
    }));

    // Import trolls
    this.trolls = data.trolls.map((t) => ({ ...t, triggered: false }));
  }

  // ============================================================
  // Drawing
  // ============================================================
  private drawGrid(): void {
    this.gridGraphics.clear();
    this.gridGraphics.lineStyle(1, 0xffffff, 0.08);

    for (let y = 0; y <= this.gridH; y++) {
      this.gridGraphics.lineBetween(0, y * TILE_SIZE, this.gridW * TILE_SIZE, y * TILE_SIZE);
    }
    for (let x = 0; x <= this.gridW; x++) {
      this.gridGraphics.lineBetween(x * TILE_SIZE, 0, x * TILE_SIZE, this.gridH * TILE_SIZE);
    }
  }

  private drawBounds(): void {
    this.boundsGraphics.clear();
    this.boundsGraphics.lineStyle(2, 0xff4444, 0.5);
    this.boundsGraphics.strokeRect(0, 0, this.gridW * TILE_SIZE, this.gridH * TILE_SIZE);
  }

  private buildAllTileSprites(): void {
    // Destroy old
    for (const row of this.tileSprites) {
      if (!row) continue;
      for (const s of row) {
        if (s) s.destroy();
      }
    }

    this.tileSprites = [];
    for (let y = 0; y < this.gridH; y++) {
      this.tileSprites[y] = [];
      for (let x = 0; x < this.gridW; x++) {
        this.tileSprites[y][x] = this.createTileSprite(x, y, this.tiles[y][x]);
      }
    }
  }

  private buildAllEntitySprites(): void {
    // Destroy old
    for (const e of this.entities) {
      if (e.sprite) e.sprite.destroy();
    }

    // Create player marker
    const playerSprite = this.add
      .image(
        this.playerStart.gx * TILE_SIZE + TILE_SIZE / 2,
        this.playerStart.gy * TILE_SIZE + TILE_SIZE / 2,
        "player"
      )
      .setDepth(30);

    // Store as pseudo-entity for rendering
    this.entities = this.entities.filter((e) => e.type !== "player");

    // Rebuild entity sprites
    for (const e of this.entities) {
      const tex = this.getEntityTexture(e.type);
      e.sprite = this.add
        .image(e.gx * TILE_SIZE + TILE_SIZE / 2, e.gy * TILE_SIZE + TILE_SIZE / 2, tex)
        .setDepth(20);
    }

    // Add player as first entity (always present)
    this.entities.unshift({
      type: "player",
      gx: this.playerStart.gx,
      gy: this.playerStart.gy,
      sprite: playerSprite,
    });
  }

  private buildTrollMarkers(): void {
    for (const m of this.trollMarkers) m.destroy();
    this.trollMarkers = [];

    for (const troll of this.trolls) {
      const g = this.add.graphics().setDepth(40);
      const x = troll.triggerX;
      g.lineStyle(2, 0xff00ff, 0.8);
      g.lineBetween(x, 0, x, this.gridH * TILE_SIZE);

      // Label
      g.fillStyle(0xff00ff, 0.6);
      g.fillRect(x - 1, 0, 3, 12);

      this.trollMarkers.push(g);
    }
  }

  private createTileSprite(gx: number, gy: number, tile: number): Phaser.GameObjects.Image | null {
    if (tile === TileType.AIR) return null;

    const key = this.getTileTexture(tile);
    if (!key) return null;

    const sprite = this.add
      .image(gx * TILE_SIZE + TILE_SIZE / 2, gy * TILE_SIZE + TILE_SIZE / 2, key)
      .setDepth(10);

    // Show invisible tiles with transparency in editor
    if (tile === TileType.INVISIBLE) {
      sprite.setAlpha(0.3);
    }

    return sprite;
  }

  private getTileTexture(tile: number): string | null {
    const map: Partial<Record<number, string>> = {
      [TileType.GROUND_TOP]: "tile_ground_top",
      [TileType.GROUND]: "tile_ground",
      [TileType.BRICK]: "tile_brick",
      [TileType.QUESTION]: "tile_question",
      [TileType.SPIKE]: "tile_spike",
      [TileType.HIDDEN_SPIKE]: "tile_ground_top",
      [TileType.FAKE_GROUND]: "tile_ground_top",
      [TileType.INVISIBLE]: "tile_ground",
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
    return map[tile] ?? null;
  }

  private getEntityTexture(type: EntityType): string {
    const map: Record<string, string> = {
      player: "player",
      coin: "entity_coin",
      goomba: "entity_goomba",
      fast_goomba: "entity_goomba",
      spiny: "entity_spiny",
      flying: "entity_flying",
      flag: "entity_flag",
      fake_flag: "entity_fake_flag",
    };
    return map[type] ?? "entity_goomba";
  }

  // ============================================================
  // Input handling
  // ============================================================
  private pointerToGrid(pointer: Phaser.Input.Pointer): { gx: number; gy: number } {
    const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    return {
      gx: Math.floor(worldPoint.x / TILE_SIZE),
      gy: Math.floor(worldPoint.y / TILE_SIZE),
    };
  }

  private handleDraw(pointer: Phaser.Input.Pointer): void {
    const { gx, gy } = this.pointerToGrid(pointer);

    // Skip if same cell as last draw
    if (gx === this.lastDrawGx && gy === this.lastDrawGy) return;
    this.lastDrawGx = gx;
    this.lastDrawGy = gy;

    // Out of bounds
    if (gx < 0 || gx >= this.gridW || gy < 0 || gy >= this.gridH) return;

    const item = PALETTE_ITEMS[this.selectedPaletteId];
    if (!item) return;

    if (item.entityType) {
      this.placeEntity(item.entityType, gx, gy);
    } else if (item.tileType !== undefined) {
      this.placeTile(item.tileType, gx, gy);
    }
  }

  private placeTile(tileType: TileType, gx: number, gy: number): void {
    const oldTile = this.tiles[gy][gx];
    if (oldTile === tileType) return;

    // Record undo
    this.pushUndo({ type: "tile", gx, gy, oldTile, newTile: tileType });

    // Update data
    this.tiles[gy][gx] = tileType;

    // Update sprite
    const old = this.tileSprites[gy]?.[gx];
    if (old) old.destroy();
    this.tileSprites[gy][gx] = this.createTileSprite(gx, gy, tileType);

    this.emitLevelData();
  }

  private eraseTile(gx: number, gy: number): void {
    const { gx: gridX, gy: gridY } = gx === -1
      ? this.pointerToGrid(this.input.activePointer)
      : { gx, gy };

    if (gridX < 0 || gridX >= this.gridW || gridY < 0 || gridY >= this.gridH) return;

    // Check if there's an entity here (non-player)
    const entIdx = this.entities.findIndex(
      (e) => e.gx === gridX && e.gy === gridY && e.type !== "player"
    );
    if (entIdx !== -1) {
      this.removeEntity(entIdx);
      return;
    }

    // Otherwise erase tile
    this.placeTile(TileType.AIR, gridX, gridY);
  }

  private placeEntity(type: EntityType, gx: number, gy: number): void {
    if (type === "player") {
      // Move player start
      const playerEnt = this.entities.find((e) => e.type === "player");
      if (playerEnt) {
        const oldPos = { gx: playerEnt.gx, gy: playerEnt.gy };
        this.pushUndo({
          type: "entity_move",
          entity: { type: "player", gx, gy },
          oldPos,
          newPos: { gx, gy },
        });
        playerEnt.gx = gx;
        playerEnt.gy = gy;
        playerEnt.sprite.setPosition(
          gx * TILE_SIZE + TILE_SIZE / 2,
          gy * TILE_SIZE + TILE_SIZE / 2
        );
        this.playerStart = { gx, gy };
      }
    } else {
      // Check for existing entity at this position
      const existing = this.entities.find(
        (e) => e.gx === gx && e.gy === gy && e.type !== "player"
      );
      if (existing) return; // Don't stack entities

      const tex = this.getEntityTexture(type);
      const sprite = this.add
        .image(gx * TILE_SIZE + TILE_SIZE / 2, gy * TILE_SIZE + TILE_SIZE / 2, tex)
        .setDepth(20);

      const entity: EditorEntity = { type, gx, gy, sprite };
      this.entities.push(entity);

      this.pushUndo({
        type: "entity_add",
        entity: { type, gx, gy },
      });
    }

    this.emitLevelData();
  }

  private removeEntity(index: number): void {
    const entity = this.entities[index];
    if (!entity || entity.type === "player") return;

    this.pushUndo({
      type: "entity_remove",
      entity: { type: entity.type, gx: entity.gx, gy: entity.gy },
    });

    entity.sprite.destroy();
    this.entities.splice(index, 1);
    this.emitLevelData();
  }

  // ============================================================
  // Hover preview
  // ============================================================
  private updateHoverPreview(): void {
    this.hoverGraphics.clear();
    const pointer = this.input.activePointer;
    const { gx, gy } = this.pointerToGrid(pointer);

    if (gx < 0 || gx >= this.gridW || gy < 0 || gy >= this.gridH) return;

    this.hoverGraphics.lineStyle(2, 0xffff00, 0.6);
    this.hoverGraphics.strokeRect(
      gx * TILE_SIZE,
      gy * TILE_SIZE,
      TILE_SIZE,
      TILE_SIZE
    );
  }

  // ============================================================
  // Undo / Redo
  // ============================================================
  private pushUndo(action: UndoAction): void {
    this.undoStack.push(action);
    if (this.undoStack.length > EDITOR_MAX_UNDO) {
      this.undoStack.shift();
    }
    // Clear redo stack on new action
    this.redoStack = [];
  }

  private undo(): void {
    const action = this.undoStack.pop();
    if (!action) return;

    this.applyUndoAction(action, false);
    this.redoStack.push(action);
    this.emitLevelData();
  }

  private redo(): void {
    const action = this.redoStack.pop();
    if (!action) return;

    this.applyUndoAction(action, true);
    this.undoStack.push(action);
    this.emitLevelData();
  }

  private applyUndoAction(action: UndoAction, isRedo: boolean): void {
    switch (action.type) {
      case "tile": {
        const tile = isRedo ? action.newTile! : action.oldTile!;
        this.tiles[action.gy!][action.gx!] = tile;
        const old = this.tileSprites[action.gy!]?.[action.gx!];
        if (old) old.destroy();
        this.tileSprites[action.gy!][action.gx!] = this.createTileSprite(
          action.gx!,
          action.gy!,
          tile
        );
        break;
      }
      case "entity_add": {
        if (isRedo) {
          // Re-add
          const e = action.entity!;
          const tex = this.getEntityTexture(e.type);
          const sprite = this.add
            .image(e.gx * TILE_SIZE + TILE_SIZE / 2, e.gy * TILE_SIZE + TILE_SIZE / 2, tex)
            .setDepth(20);
          this.entities.push({ ...e, sprite });
        } else {
          // Remove
          const e = action.entity!;
          const idx = this.entities.findIndex(
            (ent) => ent.gx === e.gx && ent.gy === e.gy && ent.type === e.type
          );
          if (idx !== -1) {
            this.entities[idx].sprite.destroy();
            this.entities.splice(idx, 1);
          }
        }
        break;
      }
      case "entity_remove": {
        if (isRedo) {
          // Remove again
          const e = action.entity!;
          const idx = this.entities.findIndex(
            (ent) => ent.gx === e.gx && ent.gy === e.gy && ent.type === e.type
          );
          if (idx !== -1) {
            this.entities[idx].sprite.destroy();
            this.entities.splice(idx, 1);
          }
        } else {
          // Restore
          const e = action.entity!;
          const tex = this.getEntityTexture(e.type);
          const sprite = this.add
            .image(e.gx * TILE_SIZE + TILE_SIZE / 2, e.gy * TILE_SIZE + TILE_SIZE / 2, tex)
            .setDepth(20);
          this.entities.push({ ...e, sprite });
        }
        break;
      }
      case "entity_move": {
        const pos = isRedo ? action.newPos! : action.oldPos!;
        const ent = this.entities.find((e) => e.type === action.entity!.type);
        if (ent) {
          ent.gx = pos.gx;
          ent.gy = pos.gy;
          ent.sprite.setPosition(
            pos.gx * TILE_SIZE + TILE_SIZE / 2,
            pos.gy * TILE_SIZE + TILE_SIZE / 2
          );
          if (ent.type === "player") {
            this.playerStart = { gx: pos.gx, gy: pos.gy };
          }
        }
        break;
      }
    }
  }

  // ============================================================
  // Level data export
  // ============================================================
  private emitLevelData(): void {
    const data = this.exportLevelData();
    gameEvents.emit(EDITOR_EVENTS.LEVEL_DATA_CHANGED, data);
  }

  exportLevelData(): LevelData {
    return {
      name: this.levelName,
      bgColor: this.bgColor,
      music: this.music,
      gridW: this.gridW,
      gridH: this.gridH,
      tiles: this.tiles.map((row) => [...row]),
      entities: this.entities
        .filter((e) => e.type !== "player")
        .map((e) => ({ type: e.type, gx: e.gx, gy: e.gy })),
      trolls: this.trolls.map((t) => ({ ...t })),
      playerStart: { x: this.playerStart.gx, y: this.playerStart.gy },
    };
  }

  // ============================================================
  // Event listeners from React
  // ============================================================
  private registerEventListeners(): void {
    gameEvents.on(EDITOR_EVENTS.SET_PALETTE_ITEM, (id: unknown) => {
      this.selectedPaletteId = id as number;
    });

    gameEvents.on(EDITOR_EVENTS.SET_LEVEL_META, (meta: unknown) => {
      const m = meta as { name?: string; bgColor?: string; music?: string };
      if (m.name !== undefined) this.levelName = m.name;
      if (m.bgColor !== undefined) {
        this.bgColor = m.bgColor;
        this.cameras.main.setBackgroundColor(m.bgColor);
      }
      if (m.music !== undefined) this.music = m.music;
      this.emitLevelData();
    });

    gameEvents.on(EDITOR_EVENTS.RESIZE_LEVEL, (size: unknown) => {
      const s = size as { w: number; h: number };
      this.resizeLevel(
        Phaser.Math.Clamp(s.w, EDITOR_MIN_WIDTH, EDITOR_MAX_WIDTH),
        Phaser.Math.Clamp(s.h, EDITOR_MIN_HEIGHT, EDITOR_MAX_HEIGHT)
      );
    });

    gameEvents.on(EDITOR_EVENTS.UNDO, () => this.undo());
    gameEvents.on(EDITOR_EVENTS.REDO, () => this.redo());

    gameEvents.on(EDITOR_EVENTS.EXPORT_LEVEL, () => {
      const data = this.exportLevelData();
      gameEvents.emit(EDITOR_EVENTS.EXPORT_REQUEST, data);
    });

    gameEvents.on(EDITOR_EVENTS.IMPORT_LEVEL, (data: unknown) => {
      this.importLevelData(data as LevelData);
      this.scene.restart({ levelData: data as LevelData });
    });

    gameEvents.on(EDITOR_EVENTS.TEST_PLAY, () => {
      const data = this.exportLevelData();
      gameEvents.emit(EDITOR_EVENTS.TEST_REQUEST, data);
    });

    gameEvents.on(EDITOR_EVENTS.ADD_TROLL, (troll: unknown) => {
      this.trolls.push(troll as TrollTrigger);
      this.buildTrollMarkers();
      this.emitLevelData();
    });

    gameEvents.on(EDITOR_EVENTS.REMOVE_TROLL, (index: unknown) => {
      this.trolls.splice(index as number, 1);
      this.buildTrollMarkers();
      this.emitLevelData();
    });

    gameEvents.on(EDITOR_EVENTS.UPDATE_TROLL, (payload: unknown) => {
      const p = payload as { index: number; troll: TrollTrigger };
      this.trolls[p.index] = p.troll;
      this.buildTrollMarkers();
      this.emitLevelData();
    });
  }

  // ============================================================
  // Resize
  // ============================================================
  private resizeLevel(newW: number, newH: number): void {
    const oldTiles = this.tiles;
    const oldW = this.gridW;
    const oldH = this.gridH;

    this.gridW = newW;
    this.gridH = newH;

    // Resize tiles array (preserve existing)
    this.tiles = [];
    for (let y = 0; y < newH; y++) {
      this.tiles[y] = [];
      for (let x = 0; x < newW; x++) {
        if (y < oldH && x < oldW) {
          this.tiles[y][x] = oldTiles[y][x];
        } else {
          this.tiles[y][x] = TileType.AIR;
        }
      }
    }

    // Remove out-of-bounds entities
    this.entities = this.entities.filter((e) => {
      if (e.gx >= newW || e.gy >= newH) {
        e.sprite.destroy();
        return false;
      }
      return true;
    });

    // Clamp player start
    this.playerStart.gx = Math.min(this.playerStart.gx, newW - 1);
    this.playerStart.gy = Math.min(this.playerStart.gy, newH - 1);

    // Update camera bounds
    this.cameras.main.setBounds(0, 0, newW * TILE_SIZE, newH * TILE_SIZE);

    // Redraw everything
    this.gridGraphics.clear();
    this.drawGrid();
    this.drawBounds();
    this.buildAllTileSprites();

    this.emitLevelData();
  }

  // ============================================================
  // Cleanup
  // ============================================================
  shutdown(): void {
    // Remove all event listeners
    gameEvents.off(EDITOR_EVENTS.SET_PALETTE_ITEM, () => {});
    gameEvents.off(EDITOR_EVENTS.SET_LEVEL_META, () => {});
    gameEvents.off(EDITOR_EVENTS.RESIZE_LEVEL, () => {});
    gameEvents.off(EDITOR_EVENTS.UNDO, () => {});
    gameEvents.off(EDITOR_EVENTS.REDO, () => {});
    gameEvents.off(EDITOR_EVENTS.EXPORT_LEVEL, () => {});
    gameEvents.off(EDITOR_EVENTS.IMPORT_LEVEL, () => {});
    gameEvents.off(EDITOR_EVENTS.TEST_PLAY, () => {});
    gameEvents.off(EDITOR_EVENTS.ADD_TROLL, () => {});
    gameEvents.off(EDITOR_EVENTS.REMOVE_TROLL, () => {});
    gameEvents.off(EDITOR_EVENTS.UPDATE_TROLL, () => {});
  }
}
