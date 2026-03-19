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
  EDITOR_MAX_FILL,
  PALETTE_ITEMS,
  FIXED_STEP,
  MAX_ACCUMULATED,
  resolveAutoTileTexture,
  AUTOTILE_TILES,
  DECORATIVE_TILES,
  THEME_PALETTES,
} from "../constants";
import type { EditorTool } from "../constants";
import { TileType, type EntityType, type LevelData, type TrollTrigger, type LevelTheme } from "../types";
import { gameEvents } from "../events";
import { playBGM } from "../audio";

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
  VALIDATION: "editor:validation",

  // React → EditorScene
  SET_TOOL: "editor:set_tool",
  SET_BRUSH_SIZE: "editor:set_brush_size",
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
  SET_LAYER: "editor:set_layer",
  COPY: "editor:copy",
  PASTE: "editor:paste",
  CUT: "editor:cut",
  PASTE_PREFAB: "editor:paste_prefab",
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
  type: "tile" | "entity_add" | "entity_remove" | "entity_move" | "batch";
  // tile
  gx?: number;
  gy?: number;
  oldTile?: number;
  newTile?: number;
  // entity
  entity?: { type: EntityType; gx: number; gy: number };
  oldPos?: { gx: number; gy: number };
  newPos?: { gx: number; gy: number };
  // batch (for fill/line/rect)
  actions?: UndoAction[];
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

  // UI overlays
  private zoomText!: Phaser.GameObjects.Text;
  private resetZoomText!: Phaser.GameObjects.Text;
  private minimapGraphics!: Phaser.GameObjects.Graphics;

  // Tool state
  private selectedPaletteId = 1; // Ground Top by default
  private isDrawing = false;
  private lastDrawGx = -1;
  private lastDrawGy = -1;
  private currentTool: EditorTool = "paint";
  private brushSize = 1;

  // Line/Rect tool state
  private toolStartPoint: { gx: number; gy: number } | null = null;
  private toolPreviewGraphics!: Phaser.GameObjects.Graphics;

  // Undo/Redo
  private undoStack: UndoAction[] = [];
  private redoStack: UndoAction[] = [];

  // Camera/scroll
  private scrollSpeed = EDITOR_SCROLL_SPEED;

  // Level metadata
  private levelName = "Meu Nível";
  private bgColor = "#5c94fc";
  private music = "level1";

  // Sign texts map for custom signs
  private signTextsMap: Record<string, string> = {};

  // Theme
  private theme: LevelTheme = "default";

  // Background layer
  private backgroundTiles: number[][] = [];
  private bgTileSprites: (Phaser.GameObjects.Image | null)[][] = [];
  private activeLayer: "foreground" | "background" = "foreground";

  // Copy/paste clipboard
  private clipboard: { tiles: number[][]; w: number; h: number } | null = null;
  private selectionStart: { gx: number; gy: number } | null = null;
  private selectionEnd: { gx: number; gy: number } | null = null;
  private selectionGraphics!: Phaser.GameObjects.Graphics;

  // Keys
  private wasd!: {
    W: Phaser.Input.Keyboard.Key;
    A: Phaser.Input.Keyboard.Key;
    S: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
  };
  private arrowKeys!: Phaser.Types.Input.Keyboard.CursorKeys;
  private ctrlKey!: Phaser.Input.Keyboard.Key;
  private zKey!: Phaser.Input.Keyboard.Key;
  private yKey!: Phaser.Input.Keyboard.Key;
  private shiftKey!: Phaser.Input.Keyboard.Key;
  private accumulator = 0;

  // Stored event handler references for proper cleanup
  private eventHandlers: Array<{ event: string; handler: (...args: unknown[]) => void }> = [];
  private listenersRegistered = false;

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
    playBGM("editor");

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

    // Tool preview graphics (for line/rect ghost tiles)
    this.toolPreviewGraphics = this.add.graphics().setDepth(49);

    // Build initial tile sprites
    this.buildAllTileSprites();

    // Build background tile sprites
    this.buildAllBgTileSprites();

    // Build entity sprites
    this.buildAllEntitySprites();

    // Build troll markers
    this.buildTrollMarkers();

    // Selection overlay graphics
    this.selectionGraphics = this.add.graphics().setDepth(55);

    // Input: keyboard
    if (this.input.keyboard) {
      this.wasd = {
        W: this.input.keyboard.addKey("W"),
        A: this.input.keyboard.addKey("A"),
        S: this.input.keyboard.addKey("S"),
        D: this.input.keyboard.addKey("D"),
      };
      this.arrowKeys = this.input.keyboard.createCursorKeys();
      this.ctrlKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.CTRL);
      this.zKey = this.input.keyboard.addKey("Z");
      this.yKey = this.input.keyboard.addKey("Y");
      this.shiftKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);

      // Number keys 0-9 for quick tile selection
      for (let n = 0; n <= 9; n++) {
        const key = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ZERO + n);
        key.on("down", () => {
          if (!this.ctrlKey.isDown) {
            this.selectPaletteById(n);
          }
        });
      }

      // T = test level
      const tKey = this.input.keyboard.addKey("T");
      tKey.on("down", () => {
        if (!this.ctrlKey.isDown) {
          gameEvents.emit(EDITOR_EVENTS.TEST_PLAY);
        }
      });

      // G = toggle grid
      const gKey = this.input.keyboard.addKey("G");
      gKey.on("down", () => {
        if (!this.ctrlKey.isDown) {
          this.gridGraphics.setVisible(!this.gridGraphics.visible);
        }
      });

      // C = copy selection (Ctrl+C)
      const cKey = this.input.keyboard.addKey("C");
      cKey.on("down", () => {
        if (this.ctrlKey.isDown) this.copySelection();
      });

      // V = paste clipboard (Ctrl+V)
      const vKey = this.input.keyboard.addKey("V");
      vKey.on("down", () => {
        if (this.ctrlKey.isDown) this.pasteClipboard();
      });

      // X = cut selection (Ctrl+X)
      const xKey = this.input.keyboard.addKey("X");
      xKey.on("down", () => {
        if (this.ctrlKey.isDown) this.cutSelection();
      });

      // L = toggle layer
      const lKey = this.input.keyboard.addKey("L");
      lKey.on("down", () => {
        if (!this.ctrlKey.isDown) {
          this.activeLayer = this.activeLayer === "foreground" ? "background" : "foreground";
          this.updateLayerVisuals();
          gameEvents.emit(EDITOR_EVENTS.SELECTION_CHANGED, { layer: this.activeLayer });
        }
      });

      // TAB = cycle palette categories
      const tabKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TAB);
      tabKey.on("down", () => {
        this.cyclePaletteCategory();
      });

      // F = flood fill tool
      const fKey = this.input.keyboard.addKey("F");
      fKey.on("down", () => {
        if (!this.ctrlKey.isDown) this.setTool("fill");
      });

      // I = line tool
      const iKey = this.input.keyboard.addKey("I");
      iKey.on("down", () => {
        if (!this.ctrlKey.isDown) this.setTool("line");
      });

      // R = rectangle tool
      const rKey = this.input.keyboard.addKey("R");
      rKey.on("down", () => {
        if (!this.ctrlKey.isDown) this.setTool("rect");
      });

      // P = eyedropper (picker) tool
      const pKey = this.input.keyboard.addKey("P");
      pKey.on("down", () => {
        if (!this.ctrlKey.isDown) this.setTool("eyedropper");
      });

      // B = paint (brush) tool
      const bKey = this.input.keyboard.addKey("B");
      bKey.on("down", () => {
        if (!this.ctrlKey.isDown) this.setTool("paint");
      });

      // [ ] = brush size
      const bracketLeft = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.OPEN_BRACKET);
      bracketLeft.on("down", () => {
        this.setBrushSize(Math.max(1, this.brushSize - 1));
      });
      const bracketRight = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.CLOSED_BRACKET);
      bracketRight.on("down", () => {
        this.setBrushSize(Math.min(3, this.brushSize + 1));
      });
    }

    // Reset accumulator
    this.accumulator = 0;

    // Mouse scroll: pan level horizontally (like legacy), Ctrl+scroll = zoom
    this.input.on("wheel", (_pointer: Phaser.Input.Pointer, _gos: unknown[], _dx: number, dy: number) => {
      const cam = this.cameras.main;
      if (this.ctrlKey?.isDown) {
        // Zoom with Ctrl+scroll
        const step = dy > 0 ? -0.15 : 0.15;
        const newZoom = Phaser.Math.Clamp(cam.zoom + step, 0.5, 3);
        cam.setZoom(newZoom);
      } else if (this.shiftKey?.isDown) {
        // Vertical scroll with Shift+scroll
        cam.scrollY += dy > 0 ? 96 : -96;
      } else {
        // Horizontal scroll (default, like legacy)
        cam.scrollX += dy > 0 ? 96 : -96;
      }
    });

    // Mouse draw
    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      // Check if clicking on reset zoom button (hit-test via getBounds in world coords)
      if (this.resetZoomText.visible) {
        const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
        const bounds = this.resetZoomText.getBounds();
        if (bounds.contains(worldPoint.x, worldPoint.y)) {
          this.cameras.main.setZoom(1);
          return;
        }
      }

      if (pointer.rightButtonDown()) {
        // Right-click = erase (always, regardless of tool)
        const { gx, gy } = this.pointerToGrid(pointer);
        this.eraseTile(gx, gy);
        return;
      }

      const { gx, gy } = this.pointerToGrid(pointer);
      if (gx < 0 || gx >= this.gridW || gy < 0 || gy >= this.gridH) return;

      switch (this.currentTool) {
        case "fill":
          this.handleFloodFill(gx, gy);
          break;
        case "eyedropper":
          this.handleEyedropper(gx, gy);
          break;
        case "line":
        case "rect":
          this.toolStartPoint = { gx, gy };
          this.isDrawing = true;
          break;
        default: // "paint"
          this.isDrawing = true;
          this.handleDraw(pointer);
          break;
      }
    });

    this.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
      if (!this.isDrawing || !pointer.isDown) return;

      if (this.currentTool === "line" || this.currentTool === "rect") {
        this.updateToolPreview(pointer);
      } else {
        // paint tool — continuous draw
        this.handleDraw(pointer);
      }
    });

    this.input.on("pointerup", (pointer: Phaser.Input.Pointer) => {
      if (this.isDrawing && this.toolStartPoint) {
        const { gx, gy } = this.pointerToGrid(pointer);

        if (this.currentTool === "line") {
          this.commitLineTool(this.toolStartPoint.gx, this.toolStartPoint.gy, gx, gy);
        } else if (this.currentTool === "rect") {
          this.commitRectTool(this.toolStartPoint.gx, this.toolStartPoint.gy, gx, gy);
        }
        this.toolStartPoint = null;
        this.toolPreviewGraphics.clear();
      }

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

    // Zoom indicator (positioned in world coords each frame)
    this.zoomText = this.add.text(10, 10, "100%", {
      fontSize: "14px",
      color: "#ffffff",
      backgroundColor: "#00000088",
      padding: { x: 6, y: 3 },
    }).setDepth(100);

    // Reset zoom button (positioned in world coords each frame, hidden by default)
    this.resetZoomText = this.add.text(0, 10, "↺ Resetar", {
      fontSize: "13px",
      color: "#ff8c00",
      backgroundColor: "#00000088",
      padding: { x: 6, y: 3 },
    }).setDepth(100).setVisible(false);

    // Mini-map graphics (positioned in world coords each frame)
    this.minimapGraphics = this.add.graphics()
      .setDepth(100);

    // Signal ready
    gameEvents.emit(EDITOR_EVENTS.READY);
    this.emitLevelData(false);
  }

  update(_time: number, delta: number): void {
    // Fixed timestep for camera scroll
    this.accumulator += Math.min(delta, MAX_ACCUMULATED);

    while (this.accumulator >= FIXED_STEP) {
      this.accumulator -= FIXED_STEP;

      // Camera scroll with WASD + arrow keys
      if (this.wasd || this.arrowKeys) {
        const cam = this.cameras.main;
        const speed = this.scrollSpeed / cam.zoom;
        const left = this.wasd?.A.isDown || this.arrowKeys?.left.isDown;
        const right = this.wasd?.D.isDown || this.arrowKeys?.right.isDown;
        const up = this.wasd?.W.isDown || this.arrowKeys?.up.isDown;
        const down = this.wasd?.S.isDown || this.arrowKeys?.down.isDown;
        if (left) cam.scrollX -= speed;
        if (right) cam.scrollX += speed;
        if (up) cam.scrollY -= speed;
        if (down) cam.scrollY += speed;
      }
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

    // HUD positioning — place in world coords so they appear fixed on screen
    const cam = this.cameras.main;
    const zoomPct = Math.round(cam.zoom * 100);
    const pxScale = 1 / cam.zoom;
    const wx = cam.worldView.x;
    const wy = cam.worldView.y;

    this.zoomText.setScale(pxScale);
    this.zoomText.setPosition(wx + 10 * pxScale, wy + 10 * pxScale);
    this.zoomText.setText(`${zoomPct}%`);

    // Reset zoom button — show only when zoom ≠ 100%
    if (zoomPct !== 100) {
      this.resetZoomText.setVisible(true);
      this.resetZoomText.setScale(pxScale);
      this.resetZoomText.setPosition(
        wx + (10 + this.zoomText.width + 8) * pxScale,
        wy + 10 * pxScale,
      );

      // Hover color effect
      const ptr = this.input.activePointer;
      const worldPtr = cam.getWorldPoint(ptr.x, ptr.y);
      const bounds = this.resetZoomText.getBounds();
      const hovering = bounds.contains(worldPtr.x, worldPtr.y);
      this.resetZoomText.setColor(hovering ? "#ffcc66" : "#ff8c00");
    } else {
      this.resetZoomText.setVisible(false);
    }

    // Mini-map
    this.drawMinimap();
  }

  // ============================================================
  // Grid initialization
  // ============================================================
  private initEmptyGrid(): void {
    this.tiles = [];
    this.backgroundTiles = [];
    for (let y = 0; y < this.gridH; y++) {
      this.tiles[y] = [];
      this.backgroundTiles[y] = [];
      for (let x = 0; x < this.gridW; x++) {
        // Default: ground at bottom 2 rows
        if (y === this.gridH - 2) {
          this.tiles[y][x] = TileType.GROUND_TOP;
        } else if (y === this.gridH - 1) {
          this.tiles[y][x] = TileType.GROUND;
        } else {
          this.tiles[y][x] = TileType.AIR;
        }
        this.backgroundTiles[y][x] = TileType.AIR;
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
    this.theme = (data.theme as LevelTheme) || "default";
    this.playerStart = { gx: data.playerStart.x, gy: data.playerStart.y };

    // Copy tiles
    this.tiles = [];
    this.backgroundTiles = [];
    for (let y = 0; y < this.gridH; y++) {
      this.tiles[y] = [];
      this.backgroundTiles[y] = [];
      for (let x = 0; x < this.gridW; x++) {
        this.tiles[y][x] = data.tiles[y]?.[x] ?? TileType.AIR;
        this.backgroundTiles[y][x] = data.backgroundTiles?.[y]?.[x] ?? TileType.AIR;
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
    return this.createTileSpriteAt(gx, gy, tile, 10, 1);
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
      [TileType.GRAVITY_NORMAL]: "tile_gravity_normal",
      [TileType.MOVING_PLATFORM]: "tile_moving_platform",
      [TileType.SAND]: "tile_sand",
      [TileType.SNOW]: "tile_snow",
      [TileType.WOOD]: "tile_wood",
      [TileType.MOSSY_STONE]: "tile_mossy_stone",
      [TileType.FENCE]: "tile_fence",
      [TileType.TORCH]: "tile_torch",
      [TileType.CHAIN]: "tile_chain",
      [TileType.SIGN]: "tile_sign",
      [TileType.METAL]: "tile_metal",
      [TileType.GRATE]: "tile_grate",
      [TileType.WATER]: "tile_water",
      [TileType.CRYSTAL]: "tile_crystal",
      [TileType.MUSHROOM_BLOCK]: "tile_mushroom",
      [TileType.TELEPORTER_A]: "tile_teleporter_a",
      [TileType.TELEPORTER_B]: "tile_teleporter_b",
      [TileType.CANNON_LEFT]: "tile_cannon_left",
      [TileType.CANNON_RIGHT]: "tile_cannon_right",
      [TileType.CANNON_UP]: "tile_cannon_up",
      [TileType.CANNON_DOWN]: "tile_cannon_down",
      [TileType.STICKY_BLOCK]: "tile_sticky_block",
      [TileType.KEY_RED]: "tile_key_red",
      [TileType.KEY_BLUE]: "tile_key_blue",
      [TileType.KEY_GREEN]: "tile_key_green",
      [TileType.LOCK_RED]: "tile_lock_red",
      [TileType.LOCK_BLUE]: "tile_lock_blue",
      [TileType.LOCK_GREEN]: "tile_lock_green",
      [TileType.ICE_BREAKABLE]: "tile_ice_breakable",
      [TileType.WIND_UP]: "tile_wind_up",
      [TileType.WIND_DOWN]: "tile_wind_down",
      [TileType.WIND_LEFT]: "tile_wind_left",
      [TileType.WIND_RIGHT]: "tile_wind_right",
      [TileType.MIRROR]: "tile_mirror",
      [TileType.SIGN_CUSTOM]: "tile_sign_custom",
    };
    return map[tile] ?? null;
  }

  private refreshAutoTile(gx: number, gy: number): void {
    if (gy < 0 || gy >= this.gridH || gx < 0 || gx >= this.gridW) return;
    if (!AUTOTILE_TILES.has(this.tiles[gy][gx] as TileType)) return;
    const old = this.tileSprites[gy]?.[gx];
    if (old) old.destroy();
    this.tileSprites[gy][gx] = this.createTileSprite(gx, gy, this.tiles[gy][gx]);
  }

  private getEntityTexture(type: EntityType): string {
    const map: Record<string, string> = {
      player: "player",
      coin: "entity_coin",
      goomba: "entity_goomba",
      fast_goomba: "entity_fast_goomba",
      spiny: "entity_spiny",
      flying: "entity_flying",
      flag: "entity_flag",
      fake_flag: "entity_fake_flag",
      mushroom: "entity_mushroom",
      star: "entity_star",
      fire_flower: "entity_fire_flower",
      ghost: "entity_ghost",
      shooter: "entity_shooter",
      giant_goomba: "entity_giant_goomba",
      saw_blade: "entity_saw_blade",
      slowmo: "entity_slowmo",
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

    // When shift is held, update selection rectangle
    if (this.shiftKey?.isDown) {
      if (!this.selectionStart) {
        this.selectionStart = { gx, gy };
      }
      this.selectionEnd = { gx, gy };
      this.drawSelection();
      return;
    }

    const item = PALETTE_ITEMS.find((p) => p.id === this.selectedPaletteId);
    if (!item) return;

    // Eraser: remove entity first, then tile
    if (item.tileType === TileType.AIR) {
      this.applyBrush(gx, gy, (tx, ty) => this.eraseTile(tx, ty));
      return;
    }

    if (item.entityType) {
      this.placeEntity(item.entityType, gx, gy);
    } else if (item.tileType !== undefined) {
      this.applyBrush(gx, gy, (tx, ty) => this.placeTile(item.tileType!, tx, ty));
    }
  }

  private placeTile(tileType: TileType, gx: number, gy: number): void {
    const targetTiles = this.activeLayer === "background" ? this.backgroundTiles : this.tiles;
    const targetSprites = this.activeLayer === "background" ? this.bgTileSprites : this.tileSprites;
    const oldTile = targetTiles[gy][gx];
    if (oldTile === tileType) return;

    // Record undo
    this.pushUndo({ type: "tile", gx, gy, oldTile, newTile: tileType });

    // Update data
    targetTiles[gy][gx] = tileType;

    // Update sprite
    const old = targetSprites[gy]?.[gx];
    if (old) old.destroy();
    const depth = this.activeLayer === "background" ? 5 : 10;
    const alpha = this.activeLayer === "background" ? 0.4 : 1;
    targetSprites[gy][gx] = this.createTileSpriteAt(gx, gy, tileType, depth, alpha);

    // Refresh adjacent neighbors so auto-tile visuals update (foreground only)
    if (this.activeLayer === "foreground") {
      this.refreshAutoTile(gx, gy - 1);
      this.refreshAutoTile(gx, gy + 1);
      this.refreshAutoTile(gx - 1, gy);
      this.refreshAutoTile(gx + 1, gy);
    }

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

    // Tool-specific hover colors
    const hoverColors: Record<EditorTool, number> = {
      paint: 0xffff00,
      fill: 0x00aaff,
      line: 0xff8800,
      rect: 0x88ff00,
      eyedropper: 0xff00ff,
    };
    const color = hoverColors[this.currentTool];

    // Draw brush-sized highlight
    const half = Math.floor(this.brushSize / 2);
    for (let dy = -half; dy < this.brushSize - half; dy++) {
      for (let dx = -half; dx < this.brushSize - half; dx++) {
        const tx = gx + dx;
        const ty = gy + dy;
        if (tx < 0 || tx >= this.gridW || ty < 0 || ty >= this.gridH) continue;
        this.hoverGraphics.lineStyle(2, color, 0.6);
        this.hoverGraphics.strokeRect(tx * TILE_SIZE, ty * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        this.hoverGraphics.fillStyle(color, 0.15);
        this.hoverGraphics.fillRect(tx * TILE_SIZE, ty * TILE_SIZE, TILE_SIZE, TILE_SIZE);
      }
    }
  }

  // ============================================================
  // Mini-map
  // ============================================================
  private drawMinimap(): void {
    const cam = this.cameras.main;
    const pxScale = 1 / cam.zoom;
    const screenW = this.scale.width;
    const MW = 200;
    const MH = 60;

    // Position minimap at top-right of screen in world coords
    this.minimapGraphics.setScale(pxScale);
    this.minimapGraphics.setPosition(
      cam.worldView.x + (screenW - MW - 10) * pxScale,
      cam.worldView.y + 10 * pxScale,
    );

    // Draw everything at local coordinates (0,0 based)
    this.minimapGraphics.clear();

    // Background
    this.minimapGraphics.fillStyle(0x000000, 0.6);
    this.minimapGraphics.fillRoundedRect(0, 0, MW, MH, 4);
    this.minimapGraphics.lineStyle(1, 0x666666, 1);
    this.minimapGraphics.strokeRoundedRect(0, 0, MW, MH, 4);

    // Scale factors
    const sx = MW / (this.gridW * TILE_SIZE);
    const sy = MH / (this.gridH * TILE_SIZE);

    // Draw tiles as tiny pixels
    for (let gy = 0; gy < this.gridH; gy++) {
      for (let gx = 0; gx < this.gridW; gx++) {
        const t = this.tiles[gy]?.[gx];
        if (t && t !== TileType.AIR) {
          const color = this.getMinimapTileColor(t);
          this.minimapGraphics.fillStyle(color, 0.9);
          this.minimapGraphics.fillRect(
            gx * TILE_SIZE * sx,
            gy * TILE_SIZE * sy,
            Math.max(1, TILE_SIZE * sx),
            Math.max(1, TILE_SIZE * sy),
          );
        }
      }
    }

    // Draw entities as small colored dots
    for (const e of this.entities) {
      const ecolor = e.type === "player" ? 0xff8c00 : e.type === "flag" ? 0x00ff00 : 0xff4444;
      this.minimapGraphics.fillStyle(ecolor, 1);
      this.minimapGraphics.fillRect(
        e.gx * TILE_SIZE * sx - 1,
        e.gy * TILE_SIZE * sy - 1,
        Math.max(2, TILE_SIZE * sx + 1),
        Math.max(2, TILE_SIZE * sy + 1),
      );
    }

    // Viewport rectangle — map camera worldView onto minimap coords
    const vpL = cam.worldView.x * sx;
    const vpT = cam.worldView.y * sy;
    const vpR = (cam.worldView.x + cam.worldView.width) * sx;
    const vpB = (cam.worldView.y + cam.worldView.height) * sy;

    // Clamp all 4 edges so the rect never overflows the minimap
    const rx = Phaser.Math.Clamp(vpL, 0, MW);
    const ry = Phaser.Math.Clamp(vpT, 0, MH);
    const rw = Phaser.Math.Clamp(vpR, 0, MW) - rx;
    const rh = Phaser.Math.Clamp(vpB, 0, MH) - ry;

    if (rw > 0 && rh > 0) {
      this.minimapGraphics.lineStyle(2, 0xffff00, 0.9);
      this.minimapGraphics.strokeRect(rx, ry, rw, rh);
    }
  }

  private getMinimapTileColor(t: number): number {
    if (t === TileType.GROUND_TOP) return 0x228b22;
    if (t === TileType.GROUND) return 0x8b5a2b;
    if (t === TileType.BRICK) return 0xcd853f;
    if (t === TileType.QUESTION || t === TileType.TROLL_Q) return 0xffcc00;
    if (t === TileType.SPIKE || t === TileType.HIDDEN_SPIKE) return 0xaaaaaa;
    if (t === TileType.LAVA) return 0xff3300;
    if (t === TileType.PIPE_TL || t === TileType.PIPE_TR || t === TileType.PIPE_BL || t === TileType.PIPE_BR) return 0x00aa00;
    if (t === TileType.CASTLE) return 0x888888;
    if (t === TileType.ICE) return 0xa0d8ef;
    if (t === TileType.CLOUD) return 0xffffff;
    if (t === TileType.SPRING) return 0xff4444;
    if (t === TileType.TRAMPOLINE) return 0x8844cc;
    if (t === TileType.PLATFORM) return 0xb0804a;
    if (t === TileType.CONVEYOR_L || t === TileType.CONVEYOR_R) return 0x555555;
    if (t === TileType.CHECKPOINT) return 0x44aaff;
    if (t === TileType.FAKE_GROUND) return 0x228b22;
    if (t === TileType.INVISIBLE) return 0x4444ff;
    if (t === TileType.GRAVITY_ZONE) return 0xcc3388;
    if (t === TileType.GRAVITY_NORMAL) return 0xbb2288;
    if (t === TileType.TELEPORTER_A || t === TileType.TELEPORTER_B) return 0x8800ff;
    if (t === TileType.CANNON_LEFT || t === TileType.CANNON_RIGHT || t === TileType.CANNON_UP || t === TileType.CANNON_DOWN) return 0x333333;
    if (t === TileType.STICKY_BLOCK) return 0xffaa00;
    if (t === TileType.KEY_RED || t === TileType.LOCK_RED) return 0xff2222;
    if (t === TileType.KEY_BLUE || t === TileType.LOCK_BLUE) return 0x2266ff;
    if (t === TileType.KEY_GREEN || t === TileType.LOCK_GREEN) return 0x22cc44;
    if (t === TileType.ICE_BREAKABLE) return 0xcceeFF;
    if (t === TileType.WIND_UP || t === TileType.WIND_DOWN || t === TileType.WIND_LEFT || t === TileType.WIND_RIGHT) return 0xaaddff;
    if (t === TileType.MIRROR) return 0xccccff;
    if (t === TileType.SIGN_CUSTOM) return 0x886622;
    return 0x44aa44;
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
        this.refreshAutoTile(action.gx!, action.gy! - 1);
        this.refreshAutoTile(action.gx!, action.gy! + 1);
        this.refreshAutoTile(action.gx! - 1, action.gy!);
        this.refreshAutoTile(action.gx! + 1, action.gy!);
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
      case "batch": {
        const items = action.actions ?? [];
        // Undo in reverse order, redo in original order
        const ordered = isRedo ? items : [...items].reverse();
        for (const child of ordered) {
          this.applyUndoAction(child, isRedo);
        }
        break;
      }
    }
  }

  // ============================================================
  // Level data export
  // ============================================================
  private emitLevelData(userEdit = true): void {
    const data = this.exportLevelData();
    gameEvents.emit(EDITOR_EVENTS.LEVEL_DATA_CHANGED, data, userEdit);
    this.emitValidation(data);
  }

  private emitValidation(data: LevelData): void {
    const warnings: string[] = [];
    const hasTiles = data.tiles.some((row) =>
      row.some((t) => t !== TileType.AIR)
    );
    if (!hasTiles) warnings.push("Nível vazio — adicione tiles");

    const hasFlag = data.entities.some((e) => e.type === "flag");
    if (!hasFlag) warnings.push("Sem bandeira — adicione uma flag");

    if (!data.playerStart) warnings.push("Sem posição inicial do jogador");

    gameEvents.emit(EDITOR_EVENTS.VALIDATION, warnings);
  }

  exportLevelData(): LevelData {
    // Build teleporter pairs by scanning for A/B tiles
    const teleporterPairs: Array<{ ax: number; ay: number; bx: number; by: number }> = [];
    const teleA: Array<{ x: number; y: number }> = [];
    const teleB: Array<{ x: number; y: number }> = [];
    for (let gy = 0; gy < this.gridH; gy++) {
      for (let gx = 0; gx < this.gridW; gx++) {
        if (this.tiles[gy][gx] === TileType.TELEPORTER_A) teleA.push({ x: gx, y: gy });
        if (this.tiles[gy][gx] === TileType.TELEPORTER_B) teleB.push({ x: gx, y: gy });
      }
    }
    const pairCount = Math.min(teleA.length, teleB.length);
    for (let i = 0; i < pairCount; i++) {
      teleporterPairs.push({ ax: teleA[i].x, ay: teleA[i].y, bx: teleB[i].x, by: teleB[i].y });
    }

    // Build sign texts map
    const signTexts: Record<string, string> = {};
    for (let gy = 0; gy < this.gridH; gy++) {
      for (let gx = 0; gx < this.gridW; gx++) {
        if (this.tiles[gy][gx] === TileType.SIGN_CUSTOM) {
          const key = `${gx},${gy}`;
          signTexts[key] = (this.signTextsMap?.[key]) ?? "...";
        }
      }
    }

    return {
      name: this.levelName,
      bgColor: this.bgColor,
      music: this.music,
      theme: this.theme,
      gridW: this.gridW,
      gridH: this.gridH,
      tiles: this.tiles.map((row) => [...row]),
      backgroundTiles: this.backgroundTiles.some((row) => row.some((t) => t !== TileType.AIR))
        ? this.backgroundTiles.map((row) => [...row])
        : undefined,
      entities: this.entities
        .filter((e) => e.type !== "player")
        .map((e) => ({ type: e.type, gx: e.gx, gy: e.gy })),
      trolls: this.trolls.map((t) => ({ ...t })),
      slideBlocks: [],
      movingPlatforms: [],
      playerStart: { x: this.playerStart.gx, y: this.playerStart.gy },
      teleporterPairs,
      signTexts,
    };
  }

  // ============================================================
  // Event listeners from React
  // ============================================================
  private registerEventListeners(): void {
    // Skip if already registered — prevents duplicate listeners after scene restart
    if (this.listenersRegistered) return;
    this.listenersRegistered = true;

    const register = (event: string, handler: (...args: unknown[]) => void) => {
      gameEvents.on(event, handler);
      this.eventHandlers.push({ event, handler });
    };

    register(EDITOR_EVENTS.SET_PALETTE_ITEM, (id: unknown) => {
      this.selectedPaletteId = id as number;
    });

    register(EDITOR_EVENTS.SET_LEVEL_META, (meta: unknown) => {
      const m = meta as { name?: string; bgColor?: string; music?: string; theme?: LevelTheme };
      if (m.name !== undefined) this.levelName = m.name;
      if (m.bgColor !== undefined) {
        this.bgColor = m.bgColor;
        if (this.scene.isActive()) this.cameras.main.setBackgroundColor(m.bgColor);
      }
      if (m.music !== undefined) this.music = m.music;
      if (m.theme !== undefined) {
        this.theme = m.theme;
        // Apply theme background color
        const palette = THEME_PALETTES[m.theme];
        if (palette) {
          this.bgColor = palette.bgColor;
          if (this.scene.isActive()) this.cameras.main.setBackgroundColor(palette.bgColor);
        }
      }
      this.emitLevelData();
    });

    register(EDITOR_EVENTS.RESIZE_LEVEL, (size: unknown) => {
      const s = size as { w: number; h: number };
      this.resizeLevel(
        Phaser.Math.Clamp(s.w, EDITOR_MIN_WIDTH, EDITOR_MAX_WIDTH),
        Phaser.Math.Clamp(s.h, EDITOR_MIN_HEIGHT, EDITOR_MAX_HEIGHT)
      );
    });

    register(EDITOR_EVENTS.UNDO, () => this.undo());
    register(EDITOR_EVENTS.REDO, () => this.redo());

    register(EDITOR_EVENTS.EXPORT_LEVEL, () => {
      const data = this.exportLevelData();
      gameEvents.emit(EDITOR_EVENTS.EXPORT_REQUEST, data);
    });

    register(EDITOR_EVENTS.IMPORT_LEVEL, (data: unknown) => {
      this.importLevelData(data as LevelData);
      this.scene.restart({ levelData: data as LevelData });
    });

    register(EDITOR_EVENTS.TEST_PLAY, () => {
      const data = this.exportLevelData();
      gameEvents.emit(EDITOR_EVENTS.TEST_REQUEST, data);
    });

    register(EDITOR_EVENTS.ADD_TROLL, (troll: unknown) => {
      this.trolls.push(troll as TrollTrigger);
      this.buildTrollMarkers();
      this.emitLevelData();
    });

    register(EDITOR_EVENTS.REMOVE_TROLL, (index: unknown) => {
      this.trolls.splice(index as number, 1);
      this.buildTrollMarkers();
      this.emitLevelData();
    });

    register(EDITOR_EVENTS.UPDATE_TROLL, (payload: unknown) => {
      const p = payload as { index: number; troll: TrollTrigger };
      this.trolls[p.index] = p.troll;
      this.buildTrollMarkers();
      this.emitLevelData();
    });

    register(EDITOR_EVENTS.SET_LAYER, (layer: unknown) => {
      this.activeLayer = layer as "foreground" | "background";
      this.updateLayerVisuals();
    });

    register(EDITOR_EVENTS.COPY, () => this.copySelection());
    register(EDITOR_EVENTS.PASTE, () => this.pasteClipboard());
    register(EDITOR_EVENTS.CUT, () => this.cutSelection());

    register(EDITOR_EVENTS.PASTE_PREFAB, (data: unknown) => {
      const prefab = data as { tiles: number[][]; width: number; height: number };
      // Set clipboard to prefab data and trigger paste at camera center
      this.clipboard = { tiles: prefab.tiles, w: prefab.width, h: prefab.height };
      this.pasteClipboard();
    });

    register(EDITOR_EVENTS.SET_TOOL, (tool: unknown) => {
      this.setTool(tool as EditorTool);
    });

    register(EDITOR_EVENTS.SET_BRUSH_SIZE, (size: unknown) => {
      this.setBrushSize(size as number);
    });
  }

  // ============================================================
  // Resize
  // ============================================================
  private resizeLevel(newW: number, newH: number): void {
    const oldTiles = this.tiles;
    const oldBg = this.backgroundTiles;
    const oldW = this.gridW;
    const oldH = this.gridH;

    this.gridW = newW;
    this.gridH = newH;

    // Resize tiles array (preserve existing)
    this.tiles = [];
    this.backgroundTiles = [];
    for (let y = 0; y < newH; y++) {
      this.tiles[y] = [];
      this.backgroundTiles[y] = [];
      for (let x = 0; x < newW; x++) {
        if (y < oldH && x < oldW) {
          this.tiles[y][x] = oldTiles[y][x];
          this.backgroundTiles[y][x] = oldBg[y]?.[x] ?? TileType.AIR;
        } else {
          this.tiles[y][x] = TileType.AIR;
          this.backgroundTiles[y][x] = TileType.AIR;
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
    this.buildAllBgTileSprites();

    this.emitLevelData();
  }

  // ============================================================
  // Keyboard shortcuts helpers
  // ============================================================
  private selectPaletteById(id: number): void {
    if (id >= 0 && id < PALETTE_ITEMS.length) {
      this.selectedPaletteId = id;
      gameEvents.emit(EDITOR_EVENTS.SELECTION_CHANGED, { paletteId: id });
    }
  }

  private cyclePaletteCategory(): void {
    const categories = ["terrain", "danger", "interactive", "entities"];
    const currentItem = PALETTE_ITEMS.find((p) => p.id === this.selectedPaletteId);
    const currentCat = currentItem?.category ?? "terrain";
    const currentIdx = categories.indexOf(currentCat);
    const nextCat = categories[(currentIdx + 1) % categories.length];
    const firstItem = PALETTE_ITEMS.find((p) => p.category === nextCat);
    if (firstItem) {
      this.selectedPaletteId = firstItem.id;
      gameEvents.emit(EDITOR_EVENTS.SELECTION_CHANGED, { paletteId: firstItem.id });
    }
  }

  // ============================================================
  // Background tile sprites
  // ============================================================
  private buildAllBgTileSprites(): void {
    for (const row of this.bgTileSprites) {
      if (!row) continue;
      for (const s of row) {
        if (s) s.destroy();
      }
    }
    this.bgTileSprites = [];
    for (let y = 0; y < this.gridH; y++) {
      this.bgTileSprites[y] = [];
      for (let x = 0; x < this.gridW; x++) {
        this.bgTileSprites[y][x] = this.createTileSpriteAt(x, y, this.backgroundTiles[y]?.[x] ?? 0, 5, 0.4);
      }
    }
  }

  private createTileSpriteAt(gx: number, gy: number, tile: number, depth: number, alpha: number): Phaser.GameObjects.Image | null {
    if (tile === TileType.AIR) return null;
    const getTile = (tx: number, ty: number): TileType => {
      if (ty < 0 || ty >= this.gridH || tx < 0 || tx >= this.gridW) return TileType.AIR;
      return this.tiles[ty][tx] as TileType;
    };
    const key = resolveAutoTileTexture(tile as TileType, gx, gy, getTile) ?? this.getTileTexture(tile);
    if (!key) return null;
    const sprite = this.add.image(gx * TILE_SIZE + TILE_SIZE / 2, gy * TILE_SIZE + TILE_SIZE / 2, key).setDepth(depth).setAlpha(alpha);
    if (tile === TileType.INVISIBLE) sprite.setAlpha(alpha * 0.3);
    if (DECORATIVE_TILES.has(tile as TileType)) sprite.setAlpha(alpha * 0.8);
    if (tile === TileType.CONVEYOR_L) sprite.setFlipX(true);
    return sprite;
  }

  private updateLayerVisuals(): void {
    const fgAlpha = this.activeLayer === "foreground" ? 1 : 0.3;
    const bgAlpha = this.activeLayer === "background" ? 0.7 : 0.4;
    for (const row of this.tileSprites) {
      if (!row) continue;
      for (const s of row) {
        if (s) s.setAlpha(fgAlpha);
      }
    }
    for (const row of this.bgTileSprites) {
      if (!row) continue;
      for (const s of row) {
        if (s) s.setAlpha(bgAlpha);
      }
    }
  }

  // ============================================================
  // Selection & Copy/Paste
  // ============================================================
  private drawSelection(): void {
    this.selectionGraphics.clear();
    if (!this.selectionStart || !this.selectionEnd) return;
    const x1 = Math.min(this.selectionStart.gx, this.selectionEnd.gx);
    const y1 = Math.min(this.selectionStart.gy, this.selectionEnd.gy);
    const x2 = Math.max(this.selectionStart.gx, this.selectionEnd.gx);
    const y2 = Math.max(this.selectionStart.gy, this.selectionEnd.gy);
    this.selectionGraphics.lineStyle(2, 0x00ffff, 0.8);
    this.selectionGraphics.fillStyle(0x00ffff, 0.1);
    this.selectionGraphics.strokeRect(x1 * TILE_SIZE, y1 * TILE_SIZE, (x2 - x1 + 1) * TILE_SIZE, (y2 - y1 + 1) * TILE_SIZE);
    this.selectionGraphics.fillRect(x1 * TILE_SIZE, y1 * TILE_SIZE, (x2 - x1 + 1) * TILE_SIZE, (y2 - y1 + 1) * TILE_SIZE);
  }

  private getSelectionBounds(): { x1: number; y1: number; x2: number; y2: number } | null {
    if (!this.selectionStart || !this.selectionEnd) return null;
    return {
      x1: Math.min(this.selectionStart.gx, this.selectionEnd.gx),
      y1: Math.min(this.selectionStart.gy, this.selectionEnd.gy),
      x2: Math.max(this.selectionStart.gx, this.selectionEnd.gx),
      y2: Math.max(this.selectionStart.gy, this.selectionEnd.gy),
    };
  }

  private copySelection(): void {
    const bounds = this.getSelectionBounds();
    if (!bounds) return;
    const { x1, y1, x2, y2 } = bounds;
    const w = x2 - x1 + 1;
    const h = y2 - y1 + 1;
    const tiles: number[][] = [];
    const src = this.activeLayer === "background" ? this.backgroundTiles : this.tiles;
    for (let y = 0; y < h; y++) {
      tiles[y] = [];
      for (let x = 0; x < w; x++) {
        tiles[y][x] = src[y1 + y]?.[x1 + x] ?? TileType.AIR;
      }
    }
    this.clipboard = { tiles, w, h };
  }

  private pasteClipboard(): void {
    if (!this.clipboard) return;
    const pointer = this.input.activePointer;
    const { gx, gy } = this.pointerToGrid(pointer);
    const target = this.activeLayer === "background" ? this.backgroundTiles : this.tiles;
    const sprites = this.activeLayer === "background" ? this.bgTileSprites : this.tileSprites;
    const depth = this.activeLayer === "background" ? 5 : 10;
    const alpha = this.activeLayer === "background" ? 0.4 : 1;
    for (let y = 0; y < this.clipboard.h; y++) {
      for (let x = 0; x < this.clipboard.w; x++) {
        const tx = gx + x;
        const ty = gy + y;
        if (tx >= this.gridW || ty >= this.gridH || tx < 0 || ty < 0) continue;
        const tile = this.clipboard.tiles[y][x];
        if (tile === TileType.AIR) continue;
        this.pushUndo({ type: "tile", gx: tx, gy: ty, oldTile: target[ty][tx], newTile: tile });
        target[ty][tx] = tile;
        const old = sprites[ty]?.[tx];
        if (old) old.destroy();
        sprites[ty][tx] = this.createTileSpriteAt(tx, ty, tile, depth, alpha);
      }
    }
    this.emitLevelData();
  }

  private cutSelection(): void {
    this.copySelection();
    const bounds = this.getSelectionBounds();
    if (!bounds) return;
    const { x1, y1, x2, y2 } = bounds;
    const target = this.activeLayer === "background" ? this.backgroundTiles : this.tiles;
    const sprites = this.activeLayer === "background" ? this.bgTileSprites : this.tileSprites;
    for (let y = y1; y <= y2; y++) {
      for (let x = x1; x <= x2; x++) {
        if (target[y][x] !== TileType.AIR) {
          this.pushUndo({ type: "tile", gx: x, gy: y, oldTile: target[y][x], newTile: TileType.AIR });
          target[y][x] = TileType.AIR;
          const old = sprites[y]?.[x];
          if (old) old.destroy();
          sprites[y][x] = null;
        }
      }
    }
    this.selectionStart = null;
    this.selectionEnd = null;
    this.selectionGraphics.clear();
    this.emitLevelData();
  }

  // ============================================================
  // Tool helpers
  // ============================================================
  private setTool(tool: EditorTool): void {
    this.currentTool = tool;
    this.toolStartPoint = null;
    this.toolPreviewGraphics.clear();
    gameEvents.emit(EDITOR_EVENTS.SELECTION_CHANGED, { tool });
  }

  private setBrushSize(size: number): void {
    this.brushSize = Phaser.Math.Clamp(size, 1, 3);
    gameEvents.emit(EDITOR_EVENTS.SELECTION_CHANGED, { brushSize: this.brushSize });
  }

  /** Apply a callback over the brush footprint centered at (gx,gy) */
  private applyBrush(gx: number, gy: number, fn: (tx: number, ty: number) => void): void {
    const half = Math.floor(this.brushSize / 2);
    for (let dy = -half; dy < this.brushSize - half; dy++) {
      for (let dx = -half; dx < this.brushSize - half; dx++) {
        const tx = gx + dx;
        const ty = gy + dy;
        if (tx >= 0 && tx < this.gridW && ty >= 0 && ty < this.gridH) {
          fn(tx, ty);
        }
      }
    }
  }

  /** Place a tile without emitting data change or pushing undo (for batch ops) */
  private placeTileRaw(tileType: TileType, gx: number, gy: number): UndoAction | null {
    const targetTiles = this.activeLayer === "background" ? this.backgroundTiles : this.tiles;
    const targetSprites = this.activeLayer === "background" ? this.bgTileSprites : this.tileSprites;
    const oldTile = targetTiles[gy][gx];
    if (oldTile === tileType) return null;

    targetTiles[gy][gx] = tileType;

    const old = targetSprites[gy]?.[gx];
    if (old) old.destroy();
    const depth = this.activeLayer === "background" ? 5 : 10;
    const alpha = this.activeLayer === "background" ? 0.4 : 1;
    targetSprites[gy][gx] = this.createTileSpriteAt(gx, gy, tileType, depth, alpha);

    return { type: "tile", gx, gy, oldTile, newTile: tileType };
  }

  /** Refresh auto-tiles for a set of changed positions */
  private refreshAutoTilesForBatch(positions: Array<{ gx: number; gy: number }>): void {
    if (this.activeLayer !== "foreground") return;
    const refreshed = new Set<string>();
    for (const { gx, gy } of positions) {
      const neighbors = [
        { gx, gy: gy - 1 }, { gx, gy: gy + 1 },
        { gx: gx - 1, gy }, { gx: gx + 1, gy },
        { gx, gy }, // self
      ];
      for (const n of neighbors) {
        const key = `${n.gx},${n.gy}`;
        if (!refreshed.has(key)) {
          refreshed.add(key);
          this.refreshAutoTile(n.gx, n.gy);
        }
      }
    }
  }

  // ============================================================
  // Flood Fill Tool
  // ============================================================
  private handleFloodFill(gx: number, gy: number): void {
    const item = PALETTE_ITEMS.find((p) => p.id === this.selectedPaletteId);
    if (!item || item.tileType === undefined || item.entityType) return;

    const targetTiles = this.activeLayer === "background" ? this.backgroundTiles : this.tiles;
    const targetType = targetTiles[gy][gx];

    // Don't fill if target is same as selected
    if (targetType === item.tileType) return;

    // BFS flood fill
    const visited = new Set<string>();
    const queue: Array<{ gx: number; gy: number }> = [{ gx, gy }];
    const actions: UndoAction[] = [];
    const filled: Array<{ gx: number; gy: number }> = [];

    while (queue.length > 0 && filled.length < EDITOR_MAX_FILL) {
      const pos = queue.shift()!;
      const key = `${pos.gx},${pos.gy}`;
      if (visited.has(key)) continue;
      visited.add(key);

      if (pos.gx < 0 || pos.gx >= this.gridW || pos.gy < 0 || pos.gy >= this.gridH) continue;
      if (targetTiles[pos.gy][pos.gx] !== targetType) continue;

      const action = this.placeTileRaw(item.tileType!, pos.gx, pos.gy);
      if (action) {
        actions.push(action);
        filled.push({ gx: pos.gx, gy: pos.gy });
      }

      // Add 4-directional neighbors
      queue.push({ gx: pos.gx + 1, gy: pos.gy });
      queue.push({ gx: pos.gx - 1, gy: pos.gy });
      queue.push({ gx: pos.gx, gy: pos.gy + 1 });
      queue.push({ gx: pos.gx, gy: pos.gy - 1 });
    }

    if (actions.length > 0) {
      this.pushUndo({ type: "batch", actions });
      this.refreshAutoTilesForBatch(filled);
      this.emitLevelData();
    }
  }

  // ============================================================
  // Line Draw Tool (Bresenham)
  // ============================================================
  private getLinePoints(x0: number, y0: number, x1: number, y1: number): Array<{ gx: number; gy: number }> {
    const points: Array<{ gx: number; gy: number }> = [];
    const dx = Math.abs(x1 - x0);
    const dy = -Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    let cx = x0;
    let cy = y0;

    for (;;) {
      points.push({ gx: cx, gy: cy });
      if (cx === x1 && cy === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) {
        err += dy;
        cx += sx;
      }
      if (e2 <= dx) {
        err += dx;
        cy += sy;
      }
    }
    return points;
  }

  private commitLineTool(x0: number, y0: number, x1: number, y1: number): void {
    const item = PALETTE_ITEMS.find((p) => p.id === this.selectedPaletteId);
    if (!item || item.tileType === undefined || item.entityType) return;

    const points = this.getLinePoints(x0, y0, x1, y1);
    const actions: UndoAction[] = [];
    const changed: Array<{ gx: number; gy: number }> = [];
    const half = Math.floor(this.brushSize / 2);

    for (const p of points) {
      for (let dy = -half; dy < this.brushSize - half; dy++) {
        for (let dx = -half; dx < this.brushSize - half; dx++) {
          const tx = p.gx + dx;
          const ty = p.gy + dy;
          if (tx < 0 || tx >= this.gridW || ty < 0 || ty >= this.gridH) continue;
          const action = this.placeTileRaw(item.tileType!, tx, ty);
          if (action) {
            actions.push(action);
            changed.push({ gx: tx, gy: ty });
          }
        }
      }
    }

    if (actions.length > 0) {
      this.pushUndo({ type: "batch", actions });
      this.refreshAutoTilesForBatch(changed);
      this.emitLevelData();
    }
  }

  // ============================================================
  // Rectangle Draw Tool
  // ============================================================
  private commitRectTool(x0: number, y0: number, x1: number, y1: number): void {
    const item = PALETTE_ITEMS.find((p) => p.id === this.selectedPaletteId);
    if (!item || item.tileType === undefined || item.entityType) return;

    const minX = Math.max(0, Math.min(x0, x1));
    const maxX = Math.min(this.gridW - 1, Math.max(x0, x1));
    const minY = Math.max(0, Math.min(y0, y1));
    const maxY = Math.min(this.gridH - 1, Math.max(y0, y1));

    const actions: UndoAction[] = [];
    const changed: Array<{ gx: number; gy: number }> = [];
    const outlineOnly = this.shiftKey?.isDown;

    for (let gy = minY; gy <= maxY; gy++) {
      for (let gx = minX; gx <= maxX; gx++) {
        // In outline mode, only place border tiles
        if (outlineOnly && gx > minX && gx < maxX && gy > minY && gy < maxY) continue;

        const action = this.placeTileRaw(item.tileType!, gx, gy);
        if (action) {
          actions.push(action);
          changed.push({ gx, gy });
        }
      }
    }

    if (actions.length > 0) {
      this.pushUndo({ type: "batch", actions });
      this.refreshAutoTilesForBatch(changed);
      this.emitLevelData();
    }
  }

  // ============================================================
  // Eyedropper Tool
  // ============================================================
  private handleEyedropper(gx: number, gy: number): void {
    const targetTiles = this.activeLayer === "background" ? this.backgroundTiles : this.tiles;
    const tileType = targetTiles[gy][gx];

    // Find matching palette item
    const item = PALETTE_ITEMS.find((p) => p.tileType === tileType && !p.entityType);
    if (item) {
      this.selectedPaletteId = item.id;
      gameEvents.emit(EDITOR_EVENTS.SELECTION_CHANGED, { paletteId: item.id, pickedTileName: item.name });
    } else {
      // Check for entity at this position
      const ent = this.entities.find((e) => e.gx === gx && e.gy === gy);
      if (ent) {
        const entItem = PALETTE_ITEMS.find((p) => p.entityType === ent.type);
        if (entItem) {
          this.selectedPaletteId = entItem.id;
          gameEvents.emit(EDITOR_EVENTS.SELECTION_CHANGED, { paletteId: entItem.id, pickedTileName: entItem.name });
        }
      }
    }

    // Auto-switch back to paint tool
    this.setTool("paint");
  }

  // ============================================================
  // Tool Preview (line/rect ghost while dragging)
  // ============================================================
  private updateToolPreview(pointer: Phaser.Input.Pointer): void {
    this.toolPreviewGraphics.clear();
    if (!this.toolStartPoint) return;

    const { gx, gy } = this.pointerToGrid(pointer);
    const color = this.currentTool === "line" ? 0xff8800 : 0x88ff00;

    if (this.currentTool === "line") {
      const points = this.getLinePoints(this.toolStartPoint.gx, this.toolStartPoint.gy, gx, gy);
      this.toolPreviewGraphics.fillStyle(color, 0.3);
      const half = Math.floor(this.brushSize / 2);
      for (const p of points) {
        for (let dy = -half; dy < this.brushSize - half; dy++) {
          for (let dx = -half; dx < this.brushSize - half; dx++) {
            const tx = p.gx + dx;
            const ty = p.gy + dy;
            if (tx < 0 || tx >= this.gridW || ty < 0 || ty >= this.gridH) continue;
            this.toolPreviewGraphics.fillRect(tx * TILE_SIZE, ty * TILE_SIZE, TILE_SIZE, TILE_SIZE);
          }
        }
      }
    } else if (this.currentTool === "rect") {
      const minX = Math.max(0, Math.min(this.toolStartPoint.gx, gx));
      const maxX = Math.min(this.gridW - 1, Math.max(this.toolStartPoint.gx, gx));
      const minY = Math.max(0, Math.min(this.toolStartPoint.gy, gy));
      const maxY = Math.min(this.gridH - 1, Math.max(this.toolStartPoint.gy, gy));
      const outlineOnly = this.shiftKey?.isDown;

      this.toolPreviewGraphics.fillStyle(color, 0.3);
      for (let py = minY; py <= maxY; py++) {
        for (let px = minX; px <= maxX; px++) {
          if (outlineOnly && px > minX && px < maxX && py > minY && py < maxY) continue;
          this.toolPreviewGraphics.fillRect(px * TILE_SIZE, py * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        }
      }
      // Outline border
      this.toolPreviewGraphics.lineStyle(2, color, 0.8);
      this.toolPreviewGraphics.strokeRect(
        minX * TILE_SIZE, minY * TILE_SIZE,
        (maxX - minX + 1) * TILE_SIZE, (maxY - minY + 1) * TILE_SIZE,
      );
    }
  }

  // ============================================================
  // Cleanup
  // ============================================================
  shutdown(): void {
    // Properly remove all registered event listeners by reference
    for (const { event, handler } of this.eventHandlers) {
      gameEvents.off(event, handler);
    }
    this.eventHandlers = [];
    this.listenersRegistered = false;
  }
}
