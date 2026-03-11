// ============================================================
// TRAP ARCHITECT - LEVEL EDITOR (Supreme Edition)
// Visual editor for creating and testing custom levels
// ============================================================

// ===== EDITOR LAYOUT CONSTANTS =====
const EDITOR_TOP_BAR = 40;      // Top bar height
const EDITOR_BOTTOM_BAR = 80;   // Bottom palette height
const EDITOR_TOOLBAR_H = 80;    // Same as EDITOR_BOTTOM_BAR (compat)
const EDITOR_DEFAULT_W = 100;
const EDITOR_DEFAULT_H = 15;
const EDITOR_SCROLL_SPEED = 8;
const EDITOR_MAX_UNDO = 80;
const EDITOR_VIEWPORT_Y = 40;   // Viewport starts below top bar
const EDITOR_VIEWPORT_H = 480;  // Viewport height = game canvas height

// Categorized palette
const EDITOR_CATEGORIES = [
  {
    name: 'Terreno', color: '#4CAF50',
    items: [
      { id: 'eraser', tile: T.AIR, label: 'Apagar', key: '0' },
      { id: 'ground_top', tile: T.GROUND_TOP, label: 'Grama', key: '1' },
      { id: 'ground', tile: T.GROUND, label: 'Terra', key: '2' },
      { id: 'brick', tile: T.BRICK, label: 'Tijolo', key: '3' },
      { id: 'castle', tile: T.CASTLE, label: 'Castelo' },
      { id: 'used', tile: T.USED, label: 'Usado' },
      { id: 'pipe', tile: 'pipe', label: 'Cano' },
      { id: 'ice', tile: T.ICE, label: 'Gelo' },
      { id: 'cloud', tile: T.CLOUD, label: 'Nuvem' },
    ]
  },
  {
    name: 'Perigo', color: '#F44336',
    items: [
      { id: 'spike', tile: T.SPIKE, label: 'Espinho', key: '6' },
      { id: 'hidden_spike', tile: T.HIDDEN_SPIKE, label: 'Esp.Oculto', key: '7' },
      { id: 'lava', tile: T.LAVA, label: 'Lava' },
      { id: 'fake_ground', tile: T.FAKE_GROUND, label: 'Falso', key: '8' },
    ]
  },
  {
    name: 'Interativo', color: '#FF9800',
    items: [
      { id: 'question', tile: T.QUESTION, label: '? Bloco', key: '4' },
      { id: 'troll_q', tile: T.TROLL_Q, label: '! Troll', key: '5' },
      { id: 'invisible', tile: T.INVISIBLE, label: 'Invisível', key: '9' },
      { id: 'spring', tile: T.SPRING, label: 'Mola' },
      { id: 'trampoline', tile: T.TRAMPOLINE, label: 'Trampolim' },
      { id: 'platform', tile: T.PLATFORM, label: 'Plataforma' },
      { id: 'conveyor_l', tile: T.CONVEYOR_L, label: 'Esteira ←' },
      { id: 'conveyor_r', tile: T.CONVEYOR_R, label: 'Esteira →' },
      { id: 'checkpoint', tile: T.CHECKPOINT, label: 'Checkpoint' },
    ]
  },
  {
    name: 'Entidades', color: '#2196F3',
    items: [
      { id: 'player', type: 'player', label: 'Jogador', key: 'P' },
      { id: 'coin', type: 'coin', label: 'Moeda', key: 'C' },
      { id: 'goomba', type: 'goomba', label: 'Goomba', key: 'G' },
      { id: 'fast_goomba', type: 'fast_goomba', label: 'Goomba+', key: 'H' },
      { id: 'spiny', type: 'spiny', label: 'Spiny', key: 'K' },
      { id: 'flying', type: 'flying', label: 'Voador', key: 'R' },
      { id: 'flag', type: 'flag', label: 'Bandeira', key: 'F' },
      { id: 'fake_flag', type: 'fake_flag', label: 'Band.Falsa', key: 'X' },
    ]
  },
];

// Build flat lookup arrays from categories
const EDITOR_ALL_ITEMS = [];
const EDITOR_CAT_OFFSETS = []; // { catIndex, startIndex }
for (let ci = 0; ci < EDITOR_CATEGORIES.length; ci++) {
  EDITOR_CAT_OFFSETS.push({ catIndex: ci, startIndex: EDITOR_ALL_ITEMS.length });
  for (const item of EDITOR_CATEGORIES[ci].items) {
    EDITOR_ALL_ITEMS.push(item);
  }
}

// Legacy compat
const EDITOR_TILES = EDITOR_ALL_ITEMS.filter(i => i.tile !== undefined);
const EDITOR_ENTITIES = EDITOR_ALL_ITEMS.filter(i => i.type !== undefined);

// Editor tools
const EDITOR_TOOLS = {
  PAINT: 'paint',
  ERASE: 'erase',
  FILL: 'fill',
  EYEDROPPER: 'eyedropper',
};

// Sub-states for the editor
const EDITOR_MODES = {
  EDIT: 'edit',
  SAVE_MENU: 'save_menu',
  LOAD_MENU: 'load_menu',
  TROLL_EDIT: 'troll_edit',
  TROLL_FORM: 'troll_form',
  NAME_INPUT: 'name_input',
  EXPORT: 'export',
  IMPORT: 'import',
};

// ===== EDITOR MIXIN =====
// These methods are added to the Game prototype

function initEditorMixin(Game) {

  // ---------- INITIALIZATION ----------
  Game.prototype.initEditor = function() {
    this.editor = {
      mode: EDITOR_MODES.EDIT,
      tiles: [],
      entities: [],
      trolls: [],
      playerStart: { x: 3, y: 12 }, // grid coords
      gridW: EDITOR_DEFAULT_W,
      gridH: EDITOR_DEFAULT_H,
      camera: { x: 0 },
      selectedIndex: 1, // default to GROUND_TOP
      levelName: 'Meu Nível',
      bgColor: '#5c94fc',
      music: 'level1',

      // Mouse state
      mouseX: 0,
      mouseY: 0,
      mouseDown: false,
      mouseButton: 0, // 0=left, 2=right
      mouseGridX: -1,
      mouseGridY: -1,
      lastPaintX: -1,
      lastPaintY: -1,

      // Palette
      paletteScroll: 0,
      activeCategory: 0,

      // Tools
      activeTool: EDITOR_TOOLS.PAINT,

      // Undo/Redo
      undoStack: [],
      redoStack: [],

      // Grid display
      showGrid: true,
      showMinimap: false,

      // Save/Load menu
      saveSlots: [],
      saveLoadSelection: 0,

      // Troll editing
      trollSelection: 0,
      trollForm: null,
      trollFormField: 0,

      // Name input
      nameBuffer: '',
      nameCursorBlink: 0,

      // Custom levels list (for play menu)
      customLevelSelection: 0,

      // Testing state
      testing: false,

      // Tooltip
      tooltip: '',
      tooltipTimer: 0,

      // Export
      exportText: '',

      // Import
      importSelection: 0,
    };

    // Create blank level
    this.editorNewLevel();

    // Setup mouse listeners
    this._editorMouseBound = false;
    this.setupEditorMouse();
  };

  Game.prototype.setupEditorMouse = function() {
    if (this._editorMouseBound) return;
    this._editorMouseBound = true;
    const canvas = this.canvas;

    canvas.addEventListener('mousemove', (e) => {
      if (this.state !== STATES.EDITOR && this.state !== STATES.CUSTOM_LEVELS) return;
      const rect = canvas.getBoundingClientRect();
      const scaleX = CW / rect.width;
      const scaleY = canvas.height / rect.height;
      this.editor.mouseX = (e.clientX - rect.left) * scaleX;
      this.editor.mouseY = (e.clientY - rect.top) * scaleY;
    });

    canvas.addEventListener('mousedown', (e) => {
      if (this.state !== STATES.EDITOR) return;
      e.preventDefault();
      this.editor.mouseDown = true;
      this.editor.mouseButton = e.button;
      this.editor.lastPaintX = -1;
      this.editor.lastPaintY = -1;
      if (e.button === 2) {
        // Right-click: eyedropper
        this.editorEyedropper();
      } else {
        this.editorHandleClick();
      }
    });

    canvas.addEventListener('mouseup', (e) => {
      this.editor.mouseDown = false;
    });

    canvas.addEventListener('wheel', (e) => {
      if (this.state !== STATES.EDITOR) return;
      e.preventDefault();
      // Horizontal scroll
      this.editor.camera.x += e.deltaY > 0 ? 96 : -96;
      this.editor.camera.x = Math.max(0, Math.min(
        this.editor.camera.x,
        this.editor.gridW * TILE - CW
      ));
    }, { passive: false });

    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  };

  Game.prototype.editorNewLevel = function() {
    const ed = this.editor;
    ed.tiles = [];
    for (let y = 0; y < ed.gridH; y++) {
      ed.tiles[y] = [];
      for (let x = 0; x < ed.gridW; x++) {
        ed.tiles[y][x] = T.AIR;
      }
    }
    ed.entities = [];
    ed.trolls = [];
    ed.playerStart = { x: 3, y: 12 };
    ed.camera.x = 0;
    ed.undoStack = [];
    ed.levelName = 'Meu Nível';
  };

  // ---------- UNDO ----------
  // ---------- UNDO / REDO ----------
  Game.prototype.editorPushUndo = function() {
    const ed = this.editor;
    ed.undoStack.push({
      tiles: ed.tiles.map(r => [...r]),
      entities: JSON.parse(JSON.stringify(ed.entities)),
      trolls: JSON.parse(JSON.stringify(ed.trolls)),
      playerStart: { ...ed.playerStart },
    });
    if (ed.undoStack.length > EDITOR_MAX_UNDO) ed.undoStack.shift();
    ed.redoStack = []; // Clear redo on new action
  };

  Game.prototype.editorUndo = function() {
    const ed = this.editor;
    if (ed.undoStack.length === 0) return;
    // Save current state to redo
    ed.redoStack.push({
      tiles: ed.tiles.map(r => [...r]),
      entities: JSON.parse(JSON.stringify(ed.entities)),
      trolls: JSON.parse(JSON.stringify(ed.trolls)),
      playerStart: { ...ed.playerStart },
    });
    const state = ed.undoStack.pop();
    ed.tiles = state.tiles;
    ed.entities = state.entities;
    ed.trolls = state.trolls;
    ed.playerStart = state.playerStart;
  };

  Game.prototype.editorRedo = function() {
    const ed = this.editor;
    if (ed.redoStack.length === 0) return;
    ed.undoStack.push({
      tiles: ed.tiles.map(r => [...r]),
      entities: JSON.parse(JSON.stringify(ed.entities)),
      trolls: JSON.parse(JSON.stringify(ed.trolls)),
      playerStart: { ...ed.playerStart },
    });
    const state = ed.redoStack.pop();
    ed.tiles = state.tiles;
    ed.entities = state.entities;
    ed.trolls = state.trolls;
    ed.playerStart = state.playerStart;
  };

  // ---------- PAINTING ----------
  Game.prototype.editorHandleClick = function() {
    const ed = this.editor;
    const mx = ed.mouseX;
    const my = ed.mouseY;

    // Check bottom palette click
    if (my >= EDITOR_CANVAS_H - EDITOR_BOTTOM_BAR) {
      this.editorHandlePaletteClick(mx, my);
      return;
    }

    // Check top bar buttons
    if (my < EDITOR_TOP_BAR) {
      this.editorHandleTopBarClick(mx, my);
      return;
    }

    // Paint on grid (viewport area)
    if (ed.mode === EDITOR_MODES.EDIT) {
      this.editorPaint();
    } else if (ed.mode === EDITOR_MODES.TROLL_EDIT) {
      this.editorPlaceTroll();
    }
  };

  Game.prototype.editorEyedropper = function() {
    const ed = this.editor;
    const my = ed.mouseY;
    if (my < EDITOR_TOP_BAR || my >= EDITOR_CANVAS_H - EDITOR_BOTTOM_BAR) return;

    const worldX = ed.mouseX + ed.camera.x;
    const viewY = my - EDITOR_TOP_BAR;
    const gx = Math.floor(worldX / TILE);
    const gy = Math.floor(viewY / TILE);

    if (gx < 0 || gx >= ed.gridW || gy < 0 || gy >= ed.gridH) return;

    // Check for entity first
    const ent = ed.entities.find(e => e.gx === gx && e.gy === gy);
    if (ent) {
      const idx = EDITOR_ALL_ITEMS.findIndex(it => it.type === ent.type);
      if (idx >= 0) {
        ed.selectedIndex = idx;
        this._editorSelectCategoryForIndex(idx);
        ed.tooltip = 'Selecionado: ' + EDITOR_ALL_ITEMS[idx].label;
        ed.tooltipTimer = 60;
        return;
      }
    }
    // Check player
    if (ed.playerStart.x === gx && ed.playerStart.y === gy) {
      const idx = EDITOR_ALL_ITEMS.findIndex(it => it.type === 'player');
      if (idx >= 0) {
        ed.selectedIndex = idx;
        this._editorSelectCategoryForIndex(idx);
        ed.tooltip = 'Selecionado: Jogador';
        ed.tooltipTimer = 60;
        return;
      }
    }

    // Pick tile
    const tile = ed.tiles[gy] && ed.tiles[gy][gx];
    if (tile !== undefined) {
      const idx = EDITOR_ALL_ITEMS.findIndex(it => it.tile === tile);
      if (idx >= 0) {
        ed.selectedIndex = idx;
        this._editorSelectCategoryForIndex(idx);
        ed.tooltip = 'Selecionado: ' + EDITOR_ALL_ITEMS[idx].label;
        ed.tooltipTimer = 60;
      }
    }
  };

  Game.prototype._editorSelectCategoryForIndex = function(flatIdx) {
    for (let ci = EDITOR_CAT_OFFSETS.length - 1; ci >= 0; ci--) {
      if (flatIdx >= EDITOR_CAT_OFFSETS[ci].startIndex) {
        this.editor.activeCategory = ci;
        return;
      }
    }
  };

  Game.prototype.editorPaint = function() {
    const ed = this.editor;
    const worldX = ed.mouseX + ed.camera.x;
    const viewY = ed.mouseY - EDITOR_TOP_BAR;
    const gx = Math.floor(worldX / TILE);
    const gy = Math.floor(viewY / TILE);

    if (gx < 0 || gx >= ed.gridW || gy < 0 || gy >= ed.gridH) return;
    if (gx === ed.lastPaintX && gy === ed.lastPaintY) return;
    ed.lastPaintX = gx;
    ed.lastPaintY = gy;

    const item = EDITOR_ALL_ITEMS[ed.selectedIndex];
    if (!item) return;

    this.editorPushUndo();

    if (item.tile !== undefined) {
      // Tile placement
      if (item.tile === 'pipe') {
        ed.tiles[gy][gx] = T.PIPE_TL;
      } else {
        ed.tiles[gy][gx] = item.tile;
      }
      // Remove any entity at this position when placing a tile
      if (item.tile !== T.AIR) {
        ed.entities = ed.entities.filter(e =>
          !(e.gx === gx && e.gy === gy)
        );
      }
    } else if (item.type) {
      // Entity placement
      if (item.type === 'player') {
        ed.playerStart = { x: gx, y: gy };
        ed.tiles[gy][gx] = T.AIR;
      } else {
        // Remove existing entity at same position
        ed.entities = ed.entities.filter(e =>
          !(e.gx === gx && e.gy === gy)
        );
        ed.entities.push({ type: item.type, gx, gy });
        ed.tiles[gy][gx] = T.AIR;
      }
    }
  };

  Game.prototype.editorHandlePaletteClick = function(mx, my) {
    const ed = this.editor;
    const palY = EDITOR_CANVAS_H - EDITOR_BOTTOM_BAR;

    // Category tabs at top of palette
    const tabH = 20;
    if (my < palY + tabH + 4) {
      // Tab click
      const tabW = CW / EDITOR_CATEGORIES.length;
      const ci = Math.floor(mx / tabW);
      if (ci >= 0 && ci < EDITOR_CATEGORIES.length) {
        ed.activeCategory = ci;
        ed.paletteScroll = 0;
      }
      return;
    }

    // Item click
    const cat = EDITOR_CATEGORIES[ed.activeCategory];
    if (!cat) return;
    const itemW = 40;
    const startX = 4 - ed.paletteScroll;
    const idx = Math.floor((mx - startX) / itemW);
    if (idx >= 0 && idx < cat.items.length) {
      // Find flat index
      const offset = EDITOR_CAT_OFFSETS[ed.activeCategory].startIndex;
      ed.selectedIndex = offset + idx;
    }
  };

  Game.prototype.editorHandleTopBarClick = function(mx, my) {
    const ed = this.editor;
    const buttons = this.getEditorTopButtons();
    for (const btn of buttons) {
      if (mx >= btn.x && mx < btn.x + btn.w && my >= btn.y && my < btn.y + btn.h) {
        btn.action();
        return;
      }
    }
  };

  Game.prototype.getEditorTopButtons = function() {
    const ed = this.editor;
    const bh = 26, gap = 3, y = 7;
    let x = 4;
    const btns = [];
    const add = (label, action, w) => {
      const bw = w || (label.length * 7 + 16);
      btns.push({ x, y, w: bw, h: bh, label, action });
      x += bw + gap;
    };
    add('Salvar', () => { ed.mode = EDITOR_MODES.SAVE_MENU; this.editorLoadSlots(); ed.saveLoadSelection = 0; });
    add('Carregar', () => { ed.mode = EDITOR_MODES.LOAD_MENU; this.editorLoadSlots(); ed.saveLoadSelection = 0; });
    add('Testar', () => this.editorTestLevel());
    add('Trolls', () => {
      ed.mode = ed.mode === EDITOR_MODES.TROLL_EDIT ? EDITOR_MODES.EDIT : EDITOR_MODES.TROLL_EDIT;
    });
    add('Exportar', () => this.editorExport());
    add('Importar', () => { ed.mode = EDITOR_MODES.IMPORT; ed.importSelection = 0; });
    add('Limpar', () => { this.editorPushUndo(); this.editorNewLevel(); });
    add('Menu', () => {
      this.canvas.height = CH;
      this.state = STATES.MENU;
      this.updateMenuItems();
      this.audio.stopMusic();
      this.audio.playMusic('menu');
    });

    // Right side info and controls
    const rx = CW - 220;
    x = rx;
    // Grid toggle
    btns.push({ x: rx, y, w: 26, h: bh, label: ed.showGrid ? '▦' : '▢', action: () => { ed.showGrid = !ed.showGrid; } });
    // Minimap toggle
    btns.push({ x: rx + 30, y, w: 26, h: bh, label: '🗺', action: () => { ed.showMinimap = !ed.showMinimap; } });
    // Resize
    btns.push({ x: rx + 64, y, w: 24, h: bh, label: 'W-', action: () => this.editorResize(-1, 0) });
    btns.push({ x: rx + 92, y, w: 24, h: bh, label: 'W+', action: () => this.editorResize(1, 0) });
    btns.push({ x: rx + 120, y, w: 24, h: bh, label: 'H-', action: () => this.editorResize(0, -1) });
    btns.push({ x: rx + 148, y, w: 24, h: bh, label: 'H+', action: () => this.editorResize(0, 1) });
    // Dimension display
    btns.push({ x: rx + 178, y, w: 42, h: bh, label: `${ed.gridW}×${ed.gridH}`, action: () => {} });

    return btns;
  };

  // ---------- RESIZE ----------
  Game.prototype.editorResize = function(dw, dh) {
    const ed = this.editor;
    this.editorPushUndo();
    const newW = Math.max(25, Math.min(300, ed.gridW + dw * 5));
    const newH = Math.max(10, Math.min(30, ed.gridH + dh));

    const newTiles = [];
    for (let y = 0; y < newH; y++) {
      newTiles[y] = [];
      for (let x = 0; x < newW; x++) {
        newTiles[y][x] = (y < ed.gridH && x < ed.gridW) ? ed.tiles[y][x] : T.AIR;
      }
    }
    ed.tiles = newTiles;
    ed.gridW = newW;
    ed.gridH = newH;

    // Clamp entities and player
    ed.entities = ed.entities.filter(e => e.gx < newW && e.gy < newH);
    if (ed.playerStart.x >= newW) ed.playerStart.x = newW - 1;
    if (ed.playerStart.y >= newH) ed.playerStart.y = newH - 1;
  };

  // ---------- TROLL TRIGGERS ----------
  Game.prototype.editorPlaceTroll = function() {
    const ed = this.editor;
    const worldX = ed.mouseX + ed.camera.x;
    const pixelX = Math.floor(worldX / TILE) * TILE;

    ed.trollForm = {
      triggerX: pixelX,
      action: 'spawn',
      entityType: 'goomba',
      spawnX: pixelX + 200,
      spawnY: 32,
      text: 'Mensagem troll!',
      duration: 90,
      count: 4,
    };
    ed.trollFormField = 0;
    ed.mode = EDITOR_MODES.TROLL_FORM;
  };

  Game.prototype.editorSaveTroll = function() {
    const ed = this.editor;
    const f = ed.trollForm;
    const troll = {
      triggerX: f.triggerX,
      action: f.action,
      triggered: false,
    };
    if (f.action === 'spawn') {
      troll.entityType = f.entityType;
      troll.spawnX = f.spawnX;
      troll.spawnY = f.spawnY;
    } else if (f.action === 'shake') {
      troll.duration = f.duration;
    } else if (f.action === 'message') {
      troll.text = f.text;
      troll.duration = f.duration;
    } else if (f.action === 'fall_blocks') {
      troll.startX = f.triggerX;
      troll.count = f.count;
    }
    this.editorPushUndo();
    ed.trolls.push(troll);
    ed.mode = EDITOR_MODES.TROLL_EDIT;
  };

  // ---------- TEST LEVEL ----------
  Game.prototype.editorTestLevel = function() {
    const ed = this.editor;
    // Build level from editor data
    const level = buildLevelFromEditor(ed);
    if (!level) {
      ed.tooltip = 'Coloque o jogador e a bandeira!';
      ed.tooltipTimer = 120;
      return;
    }

    ed.testing = true;
    // Store as temp level
    this._editorTestLevel = level;
    this._editorPrevState = STATES.EDITOR;

    // Restore game canvas height for playing
    this.canvas.height = CH;

    // Load and play
    this.levelData = level;
    this.tiles = level.tiles.map(row => [...row]);
    this.levelTime = 0;
    this.entities = level.entities.map(e => ({
      ...e,
      vx: e.type === 'goomba' || e.type === 'fast_goomba' || e.type === 'spiny' ? -1.5 : 0,
      vy: 0,
      w: e.type === 'coin' ? 16 : e.type === 'flag' || e.type === 'fake_flag' ? 32 : 28,
      h: e.type === 'coin' ? 16 : e.type === 'flag' || e.type === 'fake_flag' ? 32 * 5 : 28,
      alive: true,
      frame: 0,
      baseY: e.y,
    }));
    this.trolls = level.trolls.map(t => ({ ...t, triggered: false }));
    this.player = this.createPlayer(level.playerStart.x, level.playerStart.y);
    this.camera.x = Math.max(0, this.player.x - CW / 3);
    this.particles = [];
    this.fallingBlocks = [];
    this.crumblingTiles = new Map();
    this.activatedCheckpoints = new Set();
    this.screenShake = 0;
    this.message = null;
    this.messageTimer = 0;
    this.coins = 0;
    this.hudCoinsDisplay = 0;
    this.levelNameTimer = 180;
    // Clear checkpoint data
    delete level._checkpointX;
    delete level._checkpointY;

    this.state = STATES.PLAYING;
    this.audio.stopMusic();
    this.audio.playMusic(level.music);
  };

  // Return to editor from test
  Game.prototype.editorReturnFromTest = function() {
    this.editor.testing = false;
    this.state = STATES.EDITOR;
    this.audio.stopMusic();
    this._editorTestLevel = null;
    this.canvas.height = EDITOR_CANVAS_H;
    this.canvas.style.cursor = 'crosshair';
  };

  // ---------- SAVE / LOAD ----------
  Game.prototype.editorLoadSlots = function() {
    try {
      const raw = localStorage.getItem('catmario_custom_levels');
      this.editor.saveSlots = raw ? JSON.parse(raw) : [];
    } catch (e) {
      this.editor.saveSlots = [];
    }
  };

  Game.prototype.editorSaveToSlot = function(slotIndex) {
    const ed = this.editor;
    const data = {
      name: ed.levelName,
      gridW: ed.gridW,
      gridH: ed.gridH,
      tiles: ed.tiles,
      entities: ed.entities,
      trolls: ed.trolls,
      playerStart: ed.playerStart,
      bgColor: ed.bgColor,
      music: ed.music,
      savedAt: Date.now(),
    };

    this.editorLoadSlots();
    if (slotIndex >= 0 && slotIndex < ed.saveSlots.length) {
      ed.saveSlots[slotIndex] = data;
    } else {
      ed.saveSlots.push(data);
    }

    try {
      localStorage.setItem('catmario_custom_levels', JSON.stringify(ed.saveSlots));
      ed.tooltip = 'Nível salvo!';
      ed.tooltipTimer = 90;
    } catch (e) {
      ed.tooltip = 'Erro ao salvar!';
      ed.tooltipTimer = 90;
    }
    ed.mode = EDITOR_MODES.EDIT;
  };

  Game.prototype.editorLoadFromSlot = function(slotIndex) {
    const ed = this.editor;
    const data = ed.saveSlots[slotIndex];
    if (!data) return;

    ed.gridW = data.gridW;
    ed.gridH = data.gridH;
    ed.tiles = data.tiles.map(r => [...r]);
    ed.entities = data.entities ? JSON.parse(JSON.stringify(data.entities)) : [];
    ed.trolls = data.trolls ? JSON.parse(JSON.stringify(data.trolls)) : [];
    ed.playerStart = { ...data.playerStart };
    ed.levelName = data.name || 'Sem Nome';
    ed.bgColor = data.bgColor || '#5c94fc';
    ed.music = data.music || 'level1';
    ed.camera.x = 0;
    ed.undoStack = [];
    ed.mode = EDITOR_MODES.EDIT;
  };

  Game.prototype.editorDeleteSlot = function(slotIndex) {
    const ed = this.editor;
    ed.saveSlots.splice(slotIndex, 1);
    try {
      localStorage.setItem('catmario_custom_levels', JSON.stringify(ed.saveSlots));
    } catch (e) {}
    if (ed.saveLoadSelection >= ed.saveSlots.length) {
      ed.saveLoadSelection = Math.max(0, ed.saveSlots.length - 1);
    }
  };

  // ---------- EXPORT / IMPORT ----------
  Game.prototype.editorExport = function() {
    const ed = this.editor;
    let output = '// Level: ' + ed.levelName + '\n';
    output += '// bgColor: ' + ed.bgColor + ', music: ' + ed.music + '\n';
    output += 'const EXPORTED_LEVEL = parseLevel({\n';
    output += "  name: '" + ed.levelName.replace(/'/g, "\\'") + "',\n";
    output += "  subtitle: 'Custom',\n";
    output += "  bgColor: '" + ed.bgColor + "',\n";
    output += "  music: '" + ed.music + "',\n";
    output += '  map: [\n';

    for (let y = 0; y < ed.gridH; y++) {
      let row = "    '";
      for (let x = 0; x < ed.gridW; x++) {
        // Check for entities at this position
        const ent = ed.entities.find(e => e.gx === x && e.gy === y);
        if (ed.playerStart.x === x && ed.playerStart.y === y) {
          row += 'P';
        } else if (ent) {
          if (ent.type === 'coin') row += 'C';
          else if (ent.type === 'flag') row += 'F';
          else if (ent.type === 'fake_flag') row += 'X';
          else if (ent.type === 'goomba') row += 'E';
          else if (ent.type === 'fast_goomba') row += 'E';
          else if (ent.type === 'spiny') row += 'K';
          else if (ent.type === 'flying') row += 'R';
          else row += '.';
        } else {
          const tile = ed.tiles[y][x];
          row += REVERSE_CHAR_MAP[tile] !== undefined ? REVERSE_CHAR_MAP[tile] : '.';
        }
      }
      row += "',";
      if (y < 10) row += '  // ' + y;
      else row += ' // ' + y;
      output += row + '\n';
    }

    output += '  ],\n';
    output += '  entities: [],\n';

    // Export trolls
    if (ed.trolls.length > 0) {
      output += '  trolls: [\n';
      for (const t of ed.trolls) {
        output += '    ' + JSON.stringify(t) + ',\n';
      }
      output += '  ],\n';
    } else {
      output += '  trolls: [],\n';
    }

    output += '});\n';

    ed.exportText = output;
    ed.mode = EDITOR_MODES.EXPORT;
  };

  Game.prototype.editorImportLevel = function(levelIndex) {
    const ed = this.editor;
    if (levelIndex < 0 || levelIndex >= LEVELS.length) return;

    const level = LEVELS[levelIndex];
    this.editorPushUndo();

    ed.gridW = level.width;
    ed.gridH = level.height;
    ed.tiles = level.tiles.map(r => [...r]);
    ed.entities = [];
    ed.trolls = level.trolls ? level.trolls.map(t => ({ ...t, triggered: false })) : [];
    ed.levelName = level.name || 'Importado';
    ed.bgColor = level.bgColor || '#5c94fc';
    ed.music = level.music || 'level1';

    // Convert pixel entities to grid coords
    ed.playerStart = {
      x: Math.floor(level.playerStart.x / TILE),
      y: Math.floor(level.playerStart.y / TILE),
    };

    for (const e of level.entities) {
      if (e.type === 'flag' || e.type === 'fake_flag') {
        // Flag entities have Y at pole top; convert back to base position
        ed.entities.push({
          type: e.type,
          gx: Math.floor(e.x / TILE),
          gy: Math.floor(e.y / TILE) + 4,
        });
      } else if (e.type === 'coin') {
        ed.entities.push({
          type: e.type,
          gx: Math.floor((e.x - 8) / TILE),
          gy: Math.floor((e.y - 4) / TILE),
        });
      } else {
        ed.entities.push({
          type: e.type,
          gx: Math.floor(e.x / TILE),
          gy: Math.floor(e.y / TILE),
        });
      }
    }

    ed.camera.x = 0;
    ed.undoStack = [];
    ed.redoStack = [];
    ed.mode = EDITOR_MODES.EDIT;
    ed.tooltip = 'Nível importado!';
    ed.tooltipTimer = 90;
  };

  Game.prototype.updateEditorExport = function() {
    if (consumeKey('Escape') || consumeKey('Enter')) {
      this.editor.mode = EDITOR_MODES.EDIT;
    }
    // Copy to clipboard on C
    if (consumeKey('KeyC') && (keys['ControlLeft'] || keys['ControlRight'])) {
      try {
        navigator.clipboard.writeText(this.editor.exportText);
        this.editor.tooltip = 'Copiado!';
        this.editor.tooltipTimer = 60;
      } catch(e) {}
    }
  };

  Game.prototype.updateEditorImport = function() {
    const ed = this.editor;
    if (consumeKey('Escape')) {
      ed.mode = EDITOR_MODES.EDIT;
      return;
    }
    if (consumeKey('ArrowUp') || consumeKey('KeyW')) {
      ed.importSelection = (ed.importSelection - 1 + LEVELS.length) % LEVELS.length;
    }
    if (consumeKey('ArrowDown') || consumeKey('KeyS')) {
      ed.importSelection = (ed.importSelection + 1) % LEVELS.length;
    }
    if (consumeKey('Enter') || consumeKey('Space')) {
      this.editorImportLevel(ed.importSelection);
    }
  };

  // ---------- UPDATE ----------
  Game.prototype.updateEditor = function() {
    const ed = this.editor;

    // Tooltip timer
    if (ed.tooltipTimer > 0) ed.tooltipTimer--;

    // Sub-mode dispatch
    switch (ed.mode) {
      case EDITOR_MODES.EDIT:
      case EDITOR_MODES.TROLL_EDIT:
        this.updateEditorEdit();
        break;
      case EDITOR_MODES.SAVE_MENU:
        this.updateEditorSaveMenu();
        break;
      case EDITOR_MODES.LOAD_MENU:
        this.updateEditorLoadMenu();
        break;
      case EDITOR_MODES.TROLL_FORM:
        this.updateEditorTrollForm();
        break;
      case EDITOR_MODES.NAME_INPUT:
        this.updateEditorNameInput();
        break;
      case EDITOR_MODES.EXPORT:
        this.updateEditorExport();
        break;
      case EDITOR_MODES.IMPORT:
        this.updateEditorImport();
        break;
    }
  };

  Game.prototype.updateEditorEdit = function() {
    const ed = this.editor;

    // Camera scrolling with arrow keys
    if (keys['ArrowLeft'] || keys['KeyA']) {
      ed.camera.x = Math.max(0, ed.camera.x - EDITOR_SCROLL_SPEED);
    }
    if (keys['ArrowRight'] || keys['KeyD']) {
      ed.camera.x = Math.min(
        Math.max(0, ed.gridW * TILE - CW),
        ed.camera.x + EDITOR_SCROLL_SPEED
      );
    }

    // Undo / Redo
    if (keys['ControlLeft'] || keys['ControlRight']) {
      if (consumeKey('KeyZ')) this.editorUndo();
      if (consumeKey('KeyY')) this.editorRedo();
    }

    // Tool shortcuts
    for (let i = 0; i < EDITOR_ALL_ITEMS.length; i++) {
      const item = EDITOR_ALL_ITEMS[i];
      if (item.key && consumeKey('Key' + item.key.toUpperCase())) {
        ed.selectedIndex = i;
        this._editorSelectCategoryForIndex(i);
      }
      if (item.key && consumeKey('Digit' + item.key)) {
        ed.selectedIndex = i;
        this._editorSelectCategoryForIndex(i);
      }
    }

    // Category switching with Tab
    if (consumeKey('Tab')) {
      ed.activeCategory = (ed.activeCategory + 1) % EDITOR_CATEGORIES.length;
      ed.paletteScroll = 0;
      // Select first item in new category
      ed.selectedIndex = EDITOR_CAT_OFFSETS[ed.activeCategory].startIndex;
    }

    // Quick test
    if (consumeKey('KeyT') && !(keys['ControlLeft'] || keys['ControlRight'])) {
      if (ed.mode === EDITOR_MODES.EDIT) {
        this.editorTestLevel();
        return;
      }
    }

    // Name edit
    if (consumeKey('KeyN') && !(keys['ControlLeft'] || keys['ControlRight'])) {
      ed.nameBuffer = ed.levelName;
      ed.mode = EDITOR_MODES.NAME_INPUT;
      return;
    }

    // Grid toggle
    if (consumeKey('KeyG') && !(keys['ControlLeft'] || keys['ControlRight'])) {
      ed.showGrid = !ed.showGrid;
    }

    // Minimap toggle
    if (consumeKey('KeyM') && !(keys['ControlLeft'] || keys['ControlRight'])) {
      ed.showMinimap = !ed.showMinimap;
    }

    // Escape to menu
    if (consumeKey('Escape')) {
      if (ed.mode === EDITOR_MODES.TROLL_EDIT) {
        ed.mode = EDITOR_MODES.EDIT;
      } else {
        this.canvas.height = CH;
        this.state = STATES.MENU;
        this.updateMenuItems();
        this.audio.stopMusic();
        this.audio.playMusic('menu');
      }
      return;
    }

    // Continuous painting while mouse held (left button only)
    if (ed.mouseDown && ed.mouseButton === 0 && ed.mouseY >= EDITOR_TOP_BAR && ed.mouseY < EDITOR_CANVAS_H - EDITOR_BOTTOM_BAR) {
      if (ed.mode === EDITOR_MODES.EDIT) {
        this.editorPaint();
      }
    }

    // Update grid cursor position (accounting for top bar offset)
    const worldX = ed.mouseX + ed.camera.x;
    const viewY = ed.mouseY - EDITOR_TOP_BAR;
    ed.mouseGridX = Math.floor(worldX / TILE);
    ed.mouseGridY = Math.floor(viewY / TILE);
  };

  Game.prototype.updateEditorSaveMenu = function() {
    const ed = this.editor;
    const count = ed.saveSlots.length + 1; // +1 for "Novo Slot"

    if (consumeKey('ArrowUp') || consumeKey('KeyW')) {
      ed.saveLoadSelection = (ed.saveLoadSelection - 1 + count) % count;
    }
    if (consumeKey('ArrowDown') || consumeKey('KeyS')) {
      ed.saveLoadSelection = (ed.saveLoadSelection + 1) % count;
    }
    if (consumeKey('Enter') || consumeKey('Space')) {
      if (ed.saveLoadSelection < ed.saveSlots.length) {
        this.editorSaveToSlot(ed.saveLoadSelection);
      } else {
        this.editorSaveToSlot(-1); // New slot
      }
    }
    if (consumeKey('Escape')) {
      ed.mode = EDITOR_MODES.EDIT;
    }
  };

  Game.prototype.updateEditorLoadMenu = function() {
    const ed = this.editor;
    const count = ed.saveSlots.length;
    if (count === 0) {
      if (consumeKey('Escape') || consumeKey('Enter')) {
        ed.mode = EDITOR_MODES.EDIT;
      }
      return;
    }

    if (consumeKey('ArrowUp') || consumeKey('KeyW')) {
      ed.saveLoadSelection = (ed.saveLoadSelection - 1 + count) % count;
    }
    if (consumeKey('ArrowDown') || consumeKey('KeyS')) {
      ed.saveLoadSelection = (ed.saveLoadSelection + 1) % count;
    }
    if (consumeKey('Enter') || consumeKey('Space')) {
      this.editorLoadFromSlot(ed.saveLoadSelection);
    }
    if (consumeKey('Delete') || consumeKey('Backspace')) {
      this.editorDeleteSlot(ed.saveLoadSelection);
    }
    if (consumeKey('Escape')) {
      ed.mode = EDITOR_MODES.EDIT;
    }
  };

  Game.prototype.updateEditorTrollForm = function() {
    const ed = this.editor;
    const f = ed.trollForm;
    const actions = ['spawn', 'shake', 'message', 'fall_blocks'];
    const entityTypes = ['goomba', 'fast_goomba', 'spiny', 'flying'];

    if (consumeKey('Escape')) {
      ed.mode = EDITOR_MODES.TROLL_EDIT;
      return;
    }

    if (consumeKey('Enter') || consumeKey('Space')) {
      if (ed.trollFormField === 0) {
        // Cycle action
        const idx = actions.indexOf(f.action);
        f.action = actions[(idx + 1) % actions.length];
      } else if (ed.trollFormField === 1 && f.action === 'spawn') {
        const idx = entityTypes.indexOf(f.entityType);
        f.entityType = entityTypes[(idx + 1) % entityTypes.length];
      } else {
        // Save troll
        this.editorSaveTroll();
        return;
      }
    }

    if (consumeKey('ArrowUp') || consumeKey('KeyW')) {
      ed.trollFormField = Math.max(0, ed.trollFormField - 1);
    }
    if (consumeKey('ArrowDown') || consumeKey('KeyS')) {
      const maxField = f.action === 'spawn' ? 2 : f.action === 'message' ? 2 : 1;
      ed.trollFormField = Math.min(maxField, ed.trollFormField + 1);
    }

    // Adjust numeric values with left/right
    if (keys['ArrowLeft']) {
      if (ed.trollFormField === 1) {
        if (f.action === 'shake') f.duration = Math.max(5, f.duration - 1);
        if (f.action === 'fall_blocks') f.count = Math.max(1, f.count - 1);
        if (f.action === 'message') f.duration = Math.max(30, f.duration - 5);
      }
    }
    if (keys['ArrowRight']) {
      if (ed.trollFormField === 1) {
        if (f.action === 'shake') f.duration = Math.min(120, f.duration + 1);
        if (f.action === 'fall_blocks') f.count = Math.min(20, f.count + 1);
        if (f.action === 'message') f.duration = Math.min(300, f.duration + 5);
      }
    }
  };

  Game.prototype.updateEditorNameInput = function() {
    const ed = this.editor;
    ed.nameCursorBlink++;

    if (consumeKey('Escape')) {
      ed.mode = EDITOR_MODES.EDIT;
      return;
    }
    if (consumeKey('Enter')) {
      ed.levelName = ed.nameBuffer || 'Sem Nome';
      ed.mode = EDITOR_MODES.EDIT;
      return;
    }
    if (consumeKey('Backspace')) {
      ed.nameBuffer = ed.nameBuffer.slice(0, -1);
      return;
    }
  };

  // ---------- RENDER ----------
  Game.prototype.renderEditor = function(ctx) {
    const ed = this.editor;
    const camX = Math.floor(ed.camera.x);
    const FULL_H = EDITOR_CANVAS_H;
    const vpY = EDITOR_TOP_BAR;
    const vpH = EDITOR_VIEWPORT_H;
    const palTop = vpY + vpH; // Where palette starts

    // === BACKGROUND (full canvas) ===
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, CW, FULL_H);

    // === VIEWPORT (clipped) ===
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, vpY, CW, vpH);
    ctx.clip();

    // Level background
    ctx.fillStyle = ed.bgColor;
    ctx.fillRect(0, vpY, CW, vpH);

    const startTX = Math.floor(camX / TILE);
    const endTX = Math.ceil((camX + CW) / TILE);

    // Grid lines
    if (ed.showGrid) {
      ctx.strokeStyle = 'rgba(255,255,255,0.06)';
      ctx.lineWidth = 1;
      for (let tx = startTX; tx <= endTX; tx++) {
        const sx = tx * TILE - camX;
        ctx.beginPath();
        ctx.moveTo(sx, vpY);
        ctx.lineTo(sx, vpY + vpH);
        ctx.stroke();
      }
      for (let ty = 0; ty < ed.gridH; ty++) {
        const sy = ty * TILE + vpY;
        ctx.beginPath();
        ctx.moveTo(0, sy);
        ctx.lineTo(CW, sy);
        ctx.stroke();
      }
    }

    // Level boundaries
    const levelRight = ed.gridW * TILE - camX;
    const levelBottom = ed.gridH * TILE + vpY;
    if (levelRight < CW) {
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.fillRect(levelRight, vpY, CW - levelRight, vpH);
    }
    if (levelBottom < vpY + vpH) {
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.fillRect(0, levelBottom, CW, vpY + vpH - levelBottom);
    }

    // Draw tiles
    for (let ty = 0; ty < ed.gridH; ty++) {
      for (let tx = startTX; tx <= Math.min(endTX, ed.gridW - 1); tx++) {
        const tile = ed.tiles[ty] && ed.tiles[ty][tx];
        if (tile && tile !== T.AIR) {
          const dx = tx * TILE - camX;
          const dy = ty * TILE + vpY;
          drawTile(ctx, tile, dx, dy, this.frame);
          // Invisible block indicator in editor
          if (tile === T.INVISIBLE) {
            ctx.save();
            ctx.strokeStyle = 'rgba(0, 200, 255, 0.6)';
            ctx.lineWidth = 2;
            ctx.setLineDash([4, 4]);
            ctx.strokeRect(dx + 1, dy + 1, TILE - 2, TILE - 2);
            ctx.setLineDash([]);
            ctx.fillStyle = 'rgba(0, 200, 255, 0.15)';
            ctx.fillRect(dx, dy, TILE, TILE);
            ctx.fillStyle = 'rgba(0, 200, 255, 0.7)';
            ctx.font = 'bold 10px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('INV', dx + TILE / 2, dy + TILE / 2);
            ctx.restore();
          }
        }
      }
    }

    // Draw entities
    for (const e of ed.entities) {
      const ex = e.gx * TILE - camX;
      const ey = e.gy * TILE + vpY;
      if (ex < -TILE || ex > CW + TILE) continue;

      switch (e.type) {
        case 'goomba':
        case 'fast_goomba':
          drawGoomba(ctx, ex + 2, ey + 4, e.type, this.frame);
          break;
        case 'spiny':
          drawSpiny(ctx, ex + 2, ey + 4, this.frame);
          break;
        case 'flying':
          drawFlying(ctx, ex + 2, ey + 4, this.frame);
          break;
        case 'coin':
          drawCoin(ctx, ex + 8, ey + 4, this.frame);
          break;
        case 'flag':
          drawFlag(ctx, ex, ey - TILE * 4, false, this.frame);
          break;
        case 'fake_flag':
          drawFlag(ctx, ex, ey - TILE * 4, true, this.frame);
          break;
      }
    }

    // Draw player spawn
    const ppx = ed.playerStart.x * TILE - camX;
    const ppy = ed.playerStart.y * TILE + vpY;
    drawCat(ctx, ppx + 5, ppy + 2, 1, this.frame, true, false, 0, true, 0);
    ctx.fillStyle = 'rgba(0, 200, 0, 0.6)';
    ctx.fillRect(ppx, ppy - 10, 16, 10);
    drawText(ctx, 'P', ppx + 8, ppy - 5, 9, '#fff', 'center');

    // Draw troll triggers
    for (let i = 0; i < ed.trolls.length; i++) {
      const t = ed.trolls[i];
      const ttx = t.triggerX - camX;
      if (ttx < -20 || ttx > CW + 20) continue;

      ctx.save();
      ctx.strokeStyle = '#FF4444';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(ttx, vpY);
      ctx.lineTo(ttx, vpY + vpH);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();

      ctx.fillStyle = 'rgba(255, 68, 68, 0.8)';
      ctx.fillRect(ttx - 2, vpY + 2, 50, 14);
      drawText(ctx, `T${i + 1}:${t.action}`, ttx + 23, vpY + 9, 8, '#fff', 'center');
    }

    // Hover highlight
    if (ed.mouseY >= vpY && ed.mouseY < palTop) {
      const hgx = ed.mouseGridX;
      const hgy = ed.mouseGridY;
      if (hgx >= 0 && hgx < ed.gridW && hgy >= 0 && hgy < ed.gridH) {
        const hx = hgx * TILE - camX;
        const hy = hgy * TILE + vpY;
        ctx.strokeStyle = ed.mode === EDITOR_MODES.TROLL_EDIT ? 'rgba(255,68,68,0.8)' : 'rgba(255,255,0,0.6)';
        ctx.lineWidth = 2;
        ctx.strokeRect(hx, hy, TILE, TILE);

        if (ed.mode === EDITOR_MODES.EDIT) {
          const item = EDITOR_ALL_ITEMS[ed.selectedIndex];
          if (item && item.tile !== undefined && item.tile !== T.AIR) {
            ctx.globalAlpha = 0.4;
            drawTile(ctx, item.tile === 'pipe' ? T.PIPE_TL : item.tile, hx, hy, this.frame);
            ctx.globalAlpha = 1;
          }
        }
      }
    }

    ctx.restore(); // End viewport clip

    // === TOP BAR ===
    // Background gradient
    const topGrad = ctx.createLinearGradient(0, 0, 0, EDITOR_TOP_BAR);
    topGrad.addColorStop(0, 'rgba(20,20,40,0.97)');
    topGrad.addColorStop(1, 'rgba(20,20,40,0.90)');
    ctx.fillStyle = topGrad;
    ctx.fillRect(0, 0, CW, EDITOR_TOP_BAR);
    // Bottom border
    ctx.strokeStyle = 'rgba(255,200,0,0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, EDITOR_TOP_BAR);
    ctx.lineTo(CW, EDITOR_TOP_BAR);
    ctx.stroke();

    // Buttons
    const buttons = this.getEditorTopButtons();
    for (const btn of buttons) {
      const hover = ed.mouseX >= btn.x && ed.mouseX < btn.x + btn.w && ed.mouseY >= btn.y && ed.mouseY < btn.y + btn.h;
      const isActive = (btn.label === 'Trolls' && ed.mode === EDITOR_MODES.TROLL_EDIT) ||
                       (btn.label === (ed.showGrid ? '▦' : '▢') && ed.showGrid);
      ctx.fillStyle = isActive ? 'rgba(255,68,68,0.5)' : hover ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.07)';
      drawRoundedRect(ctx, btn.x, btn.y, btn.w, btn.h, 5);
      ctx.fill();
      ctx.strokeStyle = hover ? 'rgba(255,200,0,0.5)' : 'rgba(255,255,255,0.1)';
      ctx.lineWidth = 1;
      ctx.stroke();
      drawText(ctx, btn.label, btn.x + btn.w / 2, btn.y + btn.h / 2, 10, hover || isActive ? '#FFD700' : '#bbb', 'center');
    }

    // Coordinates display (mouse grid pos)
    if (ed.mouseGridX >= 0 && ed.mouseGridY >= 0) {
      drawText(ctx, `X:${ed.mouseGridX} Y:${ed.mouseGridY}`, CW - 4, EDITOR_TOP_BAR - 4, 9, 'rgba(255,255,255,0.35)', 'right');
    }

    // Mode indicator in top bar
    if (ed.mode === EDITOR_MODES.TROLL_EDIT) {
      drawText(ctx, '🎯 MODO TROLL', CW / 2, EDITOR_TOP_BAR - 4, 10, '#FF4444', 'center', true);
    }

    // === BOTTOM PALETTE ===
    const palBgGrad = ctx.createLinearGradient(0, palTop, 0, FULL_H);
    palBgGrad.addColorStop(0, 'rgba(15,15,30,0.97)');
    palBgGrad.addColorStop(1, 'rgba(10,10,25,0.99)');
    ctx.fillStyle = palBgGrad;
    ctx.fillRect(0, palTop, CW, EDITOR_BOTTOM_BAR);
    // Top border
    ctx.strokeStyle = 'rgba(255,200,0,0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, palTop);
    ctx.lineTo(CW, palTop);
    ctx.stroke();

    // Category tabs
    const tabH = 20;
    const tabW = CW / EDITOR_CATEGORIES.length;
    for (let ci = 0; ci < EDITOR_CATEGORIES.length; ci++) {
      const cat = EDITOR_CATEGORIES[ci];
      const tx = ci * tabW;
      const active = ci === ed.activeCategory;
      const hover = ed.mouseX >= tx && ed.mouseX < tx + tabW && ed.mouseY >= palTop && ed.mouseY < palTop + tabH + 2;

      if (active) {
        ctx.fillStyle = cat.color + '30';
        ctx.fillRect(tx, palTop + 2, tabW, tabH);
        ctx.fillStyle = cat.color;
        ctx.fillRect(tx, palTop, tabW, 2);
      } else if (hover) {
        ctx.fillStyle = 'rgba(255,255,255,0.05)';
        ctx.fillRect(tx, palTop + 2, tabW, tabH);
      }
      drawText(ctx, cat.name, tx + tabW / 2, palTop + tabH / 2 + 3, 10, active ? cat.color : '#777', 'center', active);
    }

    // Items in active category
    const activeCat = EDITOR_CATEGORIES[ed.activeCategory];
    const catOffset = EDITOR_CAT_OFFSETS[ed.activeCategory].startIndex;
    const itemW = 42;
    const itemH = 40;
    const itemsY = palTop + tabH + 4;

    for (let i = 0; i < activeCat.items.length; i++) {
      const x = 6 + i * itemW - ed.paletteScroll;
      if (x < -itemW || x > CW) continue;

      const item = activeCat.items[i];
      const flatIdx = catOffset + i;
      const selected = flatIdx === ed.selectedIndex;

      // Selection highlight
      if (selected) {
        ctx.fillStyle = activeCat.color + '25';
        drawRoundedRect(ctx, x, itemsY, itemW - 4, itemH, 4);
        ctx.fill();
        ctx.strokeStyle = activeCat.color;
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Draw item preview
      this._editorDrawPaletteItem(ctx, item, x, itemsY, itemW - 4, itemH);

      // Shortcut key
      if (item.key) {
        drawText(ctx, item.key, x + (itemW - 4) / 2, itemsY + itemH - 2, 7, selected ? '#FFD700' : '#555', 'center');
      }
    }

    // Selected item info
    const selItem = EDITOR_ALL_ITEMS[ed.selectedIndex];
    if (selItem) {
      drawText(ctx, selItem.label, CW - 8, palTop + tabH + 14, 12, '#FFD700', 'right', true);
    }

    // Help hints
    drawText(ctx, 'Tab:Categoria  T:Testar  N:Nome  G:Grid  M:Mapa  Ctrl+Z/Y:Desfazer/Refazer  RClick:Conta-gotas  ESC:Menu', CW / 2, FULL_H - 3, 8, 'rgba(255,255,255,0.3)', 'center');

    // === MINIMAP ===
    if (ed.showMinimap) {
      this._editorDrawMinimap(ctx, ed, camX);
    }

    // === OVERLAYS ===
    if (ed.mode === EDITOR_MODES.SAVE_MENU) {
      this.renderEditorSaveLoadMenu(ctx, 'Salvar Nível', true);
    }
    if (ed.mode === EDITOR_MODES.LOAD_MENU) {
      this.renderEditorSaveLoadMenu(ctx, 'Carregar Nível', false);
    }
    if (ed.mode === EDITOR_MODES.TROLL_FORM) {
      this.renderEditorTrollForm(ctx);
    }
    if (ed.mode === EDITOR_MODES.NAME_INPUT) {
      this.renderEditorNameInput(ctx);
    }
    if (ed.mode === EDITOR_MODES.EXPORT) {
      this.renderEditorExport(ctx);
    }
    if (ed.mode === EDITOR_MODES.IMPORT) {
      this.renderEditorImport(ctx);
    }

    // Tooltip
    if (ed.tooltipTimer > 0) {
      const alpha = Math.min(1, ed.tooltipTimer / 20);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = 'rgba(0,0,0,0.85)';
      const tw = ctx.measureText(ed.tooltip).width + 20;
      const tooltipCY = EDITOR_CANVAS_H / 2;
      drawRoundedRect(ctx, CW / 2 - tw / 2 - 10, tooltipCY - 20, tw + 20, 36, 8);
      ctx.fill();
      drawText(ctx, ed.tooltip, CW / 2, tooltipCY, 14, '#FFD700', 'center');
      ctx.restore();
    }
  };

  // Helper: draw a palette item preview
  Game.prototype._editorDrawPaletteItem = function(ctx, item, x, y, w, h) {
    if (item.tile !== undefined) {
      if (item.tile === T.AIR) {
        drawText(ctx, '✕', x + w / 2, y + h / 2 - 3, 18, '#FF4444', 'center');
      } else if (item.tile === 'pipe') {
        ctx.save();
        ctx.beginPath();
        ctx.rect(x + 3, y + 3, w - 6, h - 10);
        ctx.clip();
        const scale = (w - 6) / TILE;
        ctx.translate(x + 3, y + 3);
        ctx.scale(scale, scale);
        drawTile(ctx, T.PIPE_TL, 0, 0, this.frame);
        ctx.restore();
      } else {
        ctx.save();
        ctx.beginPath();
        ctx.rect(x + 3, y + 3, w - 6, h - 10);
        ctx.clip();
        const scale = (w - 6) / TILE;
        ctx.translate(x + 3, y + 3);
        ctx.scale(scale, scale);
        drawTile(ctx, item.tile, 0, 0, this.frame);
        ctx.restore();
      }
    } else if (item.type) {
      const cx = x + w / 2;
      const cy = y + h / 2 - 3;
      switch (item.type) {
        case 'player':
          ctx.save();
          ctx.translate(cx - 5, cy - 7);
          ctx.scale(0.5, 0.5);
          drawCat(ctx, 0, 0, 1, this.frame, true, false, 0, true, 0);
          ctx.restore();
          break;
        case 'coin':
          drawCoin(ctx, cx - 4, cy - 4, this.frame);
          break;
        case 'goomba':
        case 'fast_goomba':
          ctx.save();
          ctx.translate(cx - 7, cy - 7);
          ctx.scale(0.5, 0.5);
          drawGoomba(ctx, 0, 0, item.type, this.frame);
          ctx.restore();
          break;
        case 'spiny':
          ctx.save();
          ctx.translate(cx - 7, cy - 7);
          ctx.scale(0.5, 0.5);
          drawSpiny(ctx, 0, 0, this.frame);
          ctx.restore();
          break;
        case 'flying':
          ctx.save();
          ctx.translate(cx - 7, cy - 7);
          ctx.scale(0.5, 0.5);
          drawFlying(ctx, 0, 0, this.frame);
          ctx.restore();
          break;
        case 'flag':
          drawText(ctx, '⚑', cx, cy, 18, '#00CC00', 'center');
          break;
        case 'fake_flag':
          drawText(ctx, '⚑', cx, cy, 18, '#FF4444', 'center');
          break;
      }
    }
  };

  // Helper: draw minimap
  Game.prototype._editorDrawMinimap = function(ctx, ed, camX) {
    const mmW = 160;
    const mmH = 40;
    const mmX = CW - mmW - 8;
    const mmY = EDITOR_TOP_BAR + 6;
    const scaleX = mmW / (ed.gridW * TILE);
    const scaleY = mmH / (ed.gridH * TILE);

    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    drawRoundedRect(ctx, mmX - 2, mmY - 2, mmW + 4, mmH + 4, 4);
    ctx.fill();
    ctx.fillStyle = ed.bgColor;
    ctx.fillRect(mmX, mmY, mmW, mmH);

    // Tiles (simplified - just solid colors)
    for (let ty = 0; ty < ed.gridH; ty++) {
      for (let tx = 0; tx < ed.gridW; tx++) {
        const tile = ed.tiles[ty] && ed.tiles[ty][tx];
        if (!tile || tile === T.AIR) continue;
        const px = mmX + tx * TILE * scaleX;
        const py = mmY + ty * TILE * scaleY;
        const pw = Math.max(1, TILE * scaleX);
        const ph = Math.max(1, TILE * scaleY);
        if (SOLID_TILES.has(tile)) ctx.fillStyle = '#6a6';
        else if (LETHAL_TILES.has(tile)) ctx.fillStyle = '#f44';
        else if (tile === T.FAKE_GROUND) ctx.fillStyle = '#a84';
        else ctx.fillStyle = '#888';
        ctx.fillRect(px, py, pw, ph);
      }
    }

    // Camera viewport indicator
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 1;
    ctx.strokeRect(
      mmX + camX * scaleX,
      mmY,
      CW * scaleX,
      mmH
    );

    // Player position
    const ppx = mmX + ed.playerStart.x * TILE * scaleX;
    const ppy = mmY + ed.playerStart.y * TILE * scaleY;
    ctx.fillStyle = '#0f0';
    ctx.fillRect(ppx - 1, ppy - 1, 3, 3);
  };

  Game.prototype.renderEditorSaveLoadMenu = function(ctx, title, isSave) {
    const ed = this.editor;
    // Overlay
    ctx.fillStyle = 'rgba(0,0,0,0.75)';
    ctx.fillRect(0, 0, CW, EDITOR_CANVAS_H);

    const boxW = 400, boxH = 300;
    const bx = CW / 2 - boxW / 2;
    const by = EDITOR_CANVAS_H / 2 - boxH / 2;

    ctx.fillStyle = 'rgba(30,30,50,0.95)';
    drawRoundedRect(ctx, bx, by, boxW, boxH, 12);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,200,0,0.4)';
    ctx.lineWidth = 2;
    ctx.stroke();

    drawText(ctx, title, CW / 2, by + 28, 20, '#FFD700', 'center', true);

    const slots = ed.saveSlots;
    const itemH = 32;
    const startY = by + 60;

    if (slots.length === 0 && !isSave) {
      drawText(ctx, 'Nenhum nível salvo!', CW / 2, EDITOR_CANVAS_H / 2, 16, '#888', 'center');
      drawText(ctx, 'ESC para voltar', CW / 2, EDITOR_CANVAS_H / 2 + 30, 12, '#666', 'center');
      return;
    }

    for (let i = 0; i < slots.length; i++) {
      const y = startY + i * itemH;
      if (y > by + boxH - 50) break;
      const selected = i === ed.saveLoadSelection;

      if (selected) {
        ctx.fillStyle = 'rgba(255,200,0,0.15)';
        drawRoundedRect(ctx, bx + 10, y - 4, boxW - 20, itemH - 4, 6);
        ctx.fill();
      }

      const slot = slots[i];
      const date = new Date(slot.savedAt);
      const dateStr = date.toLocaleDateString('pt-BR') + ' ' + date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      drawText(ctx, slot.name, bx + 20, y + 10, 14, selected ? '#FFD700' : '#ccc', 'left');
      drawText(ctx, `${slot.gridW}×${slot.gridH}  ${dateStr}`, bx + boxW - 20, y + 10, 10, '#888', 'right');
    }

    if (isSave) {
      const newY = startY + slots.length * itemH;
      const selected = ed.saveLoadSelection === slots.length;
      if (selected) {
        ctx.fillStyle = 'rgba(0,200,0,0.15)';
        drawRoundedRect(ctx, bx + 10, newY - 4, boxW - 20, itemH - 4, 6);
        ctx.fill();
      }
      drawText(ctx, '+ Novo Slot', bx + 20, newY + 10, 14, selected ? '#00CC00' : '#888', 'left');
    }

    drawText(ctx, '↑↓ Navegar   ENTER Confirmar   ESC Voltar' + (!isSave ? '   DEL Excluir' : ''), CW / 2, by + boxH - 16, 10, 'rgba(255,255,255,0.4)', 'center');
  };

  Game.prototype.renderEditorTrollForm = function(ctx) {
    const ed = this.editor;
    const f = ed.trollForm;

    ctx.fillStyle = 'rgba(0,0,0,0.75)';
    ctx.fillRect(0, 0, CW, EDITOR_CANVAS_H);

    const boxW = 380, boxH = 240;
    const bx = CW / 2 - boxW / 2;
    const by = EDITOR_CANVAS_H / 2 - boxH / 2;

    ctx.fillStyle = 'rgba(50,20,20,0.95)';
    drawRoundedRect(ctx, bx, by, boxW, boxH, 12);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,68,68,0.4)';
    ctx.lineWidth = 2;
    ctx.stroke();

    drawText(ctx, 'Novo Troll Trigger', CW / 2, by + 24, 18, '#FF4444', 'center', true);
    drawText(ctx, `Posição: X=${f.triggerX}px`, CW / 2, by + 48, 11, '#888', 'center');

    const fields = [];
    fields.push({ label: 'Ação', value: f.action, hint: 'ENTER para trocar' });

    if (f.action === 'spawn') {
      fields.push({ label: 'Inimigo', value: f.entityType, hint: 'ENTER para trocar' });
      fields.push({ label: 'Salvar', value: '✓ Confirmar', hint: '' });
    } else if (f.action === 'shake') {
      fields.push({ label: 'Duração', value: `${f.duration} frames`, hint: '←→ ajustar' });
    } else if (f.action === 'message') {
      fields.push({ label: 'Duração', value: `${f.duration} frames`, hint: '←→ ajustar' });
      fields.push({ label: 'Salvar', value: '✓ Confirmar', hint: '' });
    } else if (f.action === 'fall_blocks') {
      fields.push({ label: 'Blocos', value: `${f.count}`, hint: '←→ ajustar' });
    }

    // Last field for non-spawn simple actions
    if (f.action === 'shake' || f.action === 'fall_blocks') {
      fields.push({ label: 'Salvar', value: '✓ Confirmar', hint: '' });
    }

    const startY = by + 72;
    for (let i = 0; i < fields.length; i++) {
      const y = startY + i * 36;
      const selected = i === ed.trollFormField;

      if (selected) {
        ctx.fillStyle = 'rgba(255,68,68,0.15)';
        drawRoundedRect(ctx, bx + 10, y - 6, boxW - 20, 28, 4);
        ctx.fill();
      }

      drawText(ctx, fields[i].label + ':', bx + 20, y + 8, 12, selected ? '#FF8888' : '#888', 'left');
      drawText(ctx, fields[i].value, bx + 160, y + 8, 13, selected ? '#FFD700' : '#ccc', 'left');
      if (fields[i].hint) {
        drawText(ctx, fields[i].hint, bx + boxW - 20, y + 8, 9, '#666', 'right');
      }
    }

    drawText(ctx, '↑↓ Navegar   ENTER Confirmar/Trocar   ESC Cancelar', CW / 2, by + boxH - 16, 10, 'rgba(255,255,255,0.4)', 'center');
  };

  Game.prototype.renderEditorNameInput = function(ctx) {
    const ed = this.editor;

    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, CW, EDITOR_CANVAS_H);

    const boxW = 350, boxH = 100;
    const bx = CW / 2 - boxW / 2;
    const by = EDITOR_CANVAS_H / 2 - boxH / 2;

    ctx.fillStyle = 'rgba(30,30,50,0.95)';
    drawRoundedRect(ctx, bx, by, boxW, boxH, 10);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,200,0,0.4)';
    ctx.lineWidth = 2;
    ctx.stroke();

    drawText(ctx, 'Nome do Nível', CW / 2, by + 22, 16, '#FFD700', 'center', true);

    // Input field
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    drawRoundedRect(ctx, bx + 20, by + 40, boxW - 40, 28, 6);
    ctx.fill();

    const cursor = (Math.floor(ed.nameCursorBlink / 30) % 2 === 0) ? '|' : '';
    drawText(ctx, ed.nameBuffer + cursor, bx + 30, by + 54, 14, '#fff', 'left');
    drawText(ctx, 'ENTER para confirmar   ESC para cancelar', CW / 2, by + boxH - 12, 9, 'rgba(255,255,255,0.4)', 'center');
  };

  // ---------- EXPORT OVERLAY ----------
  Game.prototype.renderEditorExport = function(ctx) {
    const ed = this.editor;

    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.fillRect(0, 0, CW, EDITOR_CANVAS_H);

    const boxW = 600, boxH = 420;
    const bx = CW / 2 - boxW / 2;
    const by = EDITOR_CANVAS_H / 2 - boxH / 2;

    ctx.fillStyle = 'rgba(20,30,50,0.97)';
    drawRoundedRect(ctx, bx, by, boxW, boxH, 12);
    ctx.fill();
    ctx.strokeStyle = 'rgba(100,200,255,0.4)';
    ctx.lineWidth = 2;
    ctx.stroke();

    drawText(ctx, 'Exportar Nível (Código)', CW / 2, by + 24, 18, '#64C8FF', 'center', true);
    drawText(ctx, 'Ctrl+C para copiar   ESC/ENTER para fechar', CW / 2, by + 44, 10, '#888', 'center');

    // Code preview (truncated lines)
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    drawRoundedRect(ctx, bx + 10, by + 56, boxW - 20, boxH - 80, 6);
    ctx.fill();

    const lines = ed.exportText.split('\n');
    const maxLines = Math.floor((boxH - 100) / 14);
    for (let i = 0; i < Math.min(lines.length, maxLines); i++) {
      const line = lines[i].length > 80 ? lines[i].substring(0, 77) + '...' : lines[i];
      drawText(ctx, line, bx + 18, by + 72 + i * 14, 9, '#aaddff', 'left');
    }
    if (lines.length > maxLines) {
      drawText(ctx, `... (+${lines.length - maxLines} linhas)`, bx + 18, by + 72 + maxLines * 14, 9, '#666', 'left');
    }
  };

  // ---------- IMPORT OVERLAY ----------
  Game.prototype.renderEditorImport = function(ctx) {
    const ed = this.editor;

    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.fillRect(0, 0, CW, EDITOR_CANVAS_H);

    const boxW = 420, boxH = 260;
    const bx = CW / 2 - boxW / 2;
    const by = EDITOR_CANVAS_H / 2 - boxH / 2;

    ctx.fillStyle = 'rgba(30,30,50,0.97)';
    drawRoundedRect(ctx, bx, by, boxW, boxH, 12);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,200,0,0.4)';
    ctx.lineWidth = 2;
    ctx.stroke();

    drawText(ctx, 'Importar Nível do Jogo', CW / 2, by + 28, 18, '#FFD700', 'center', true);
    drawText(ctx, 'Selecione um nível para editar', CW / 2, by + 48, 11, '#888', 'center');

    const startY = by + 70;
    const itemH = 40;
    for (let i = 0; i < LEVELS.length; i++) {
      const y = startY + i * itemH;
      const selected = i === ed.importSelection;

      if (selected) {
        ctx.fillStyle = 'rgba(255,200,0,0.15)';
        drawRoundedRect(ctx, bx + 10, y - 4, boxW - 20, itemH - 4, 6);
        ctx.fill();
      }

      const level = LEVELS[i];
      drawText(ctx, `${i + 1}. ${level.name}`, bx + 24, y + 12, 14, selected ? '#FFD700' : '#ccc', 'left', selected);
      drawText(ctx, level.subtitle || '', bx + 24, y + 26, 10, '#888', 'left');
      drawText(ctx, `${level.width}×${level.height}`, bx + boxW - 24, y + 16, 11, '#777', 'right');
    }

    drawText(ctx, '↑↓ Navegar   ENTER Importar   ESC Voltar', CW / 2, by + boxH - 16, 10, 'rgba(255,255,255,0.4)', 'center');
  };

  // ---------- CUSTOM LEVELS MENU ----------
  Game.prototype.updateCustomLevels = function() {
    const ed = this.editor;
    const slots = ed.saveSlots;

    if (slots.length === 0) {
      if (consumeKey('Escape') || consumeKey('Enter')) {
        this.state = STATES.MENU;
        this.updateMenuItems();
      }
      return;
    }

    if (consumeKey('ArrowUp') || consumeKey('KeyW')) {
      ed.customLevelSelection = (ed.customLevelSelection - 1 + slots.length) % slots.length;
      this.audio.playSFX('select');
    }
    if (consumeKey('ArrowDown') || consumeKey('KeyS')) {
      ed.customLevelSelection = (ed.customLevelSelection + 1) % slots.length;
      this.audio.playSFX('select');
    }
    if (consumeKey('Enter') || consumeKey('Space')) {
      this.audio.playSFX('confirm');
      this.playCustomLevel(ed.customLevelSelection);
    }
    if (consumeKey('Escape')) {
      this.state = STATES.MENU;
      this.updateMenuItems();
    }
  };

  Game.prototype.playCustomLevel = function(slotIndex) {
    const ed = this.editor;
    const data = ed.saveSlots[slotIndex];
    if (!data) return;

    // Build a temporary editor state to convert
    const tempEd = {
      tiles: data.tiles,
      entities: data.entities || [],
      trolls: data.trolls || [],
      playerStart: data.playerStart,
      gridW: data.gridW,
      gridH: data.gridH,
      levelName: data.name,
      bgColor: data.bgColor || '#5c94fc',
      music: data.music || 'level1',
    };

    const level = buildLevelFromEditor(tempEd);
    if (!level) return;

    ed.testing = true;
    this._editorTestLevel = level;
    this._editorPrevState = STATES.CUSTOM_LEVELS;

    this.levelData = level;
    this.tiles = level.tiles.map(row => [...row]);
    this.levelTime = 0;
    this.entities = level.entities.map(e => ({
      ...e,
      vx: e.type === 'goomba' || e.type === 'fast_goomba' || e.type === 'spiny' ? -1.5 : 0,
      vy: 0,
      w: e.type === 'coin' ? 16 : e.type === 'flag' || e.type === 'fake_flag' ? 32 : 28,
      h: e.type === 'coin' ? 16 : e.type === 'flag' || e.type === 'fake_flag' ? 32 * 5 : 28,
      alive: true,
      frame: 0,
      baseY: e.y,
    }));
    this.trolls = level.trolls.map(t => ({ ...t, triggered: false }));
    this.player = this.createPlayer(level.playerStart.x, level.playerStart.y);
    this.camera.x = Math.max(0, this.player.x - CW / 3);
    this.particles = [];
    this.fallingBlocks = [];
    this.crumblingTiles = new Map();
    this.activatedCheckpoints = new Set();
    this.screenShake = 0;
    this.message = null;
    this.messageTimer = 0;
    this.coins = 0;
    this.hudCoinsDisplay = 0;
    this.levelNameTimer = 180;
    // Clear checkpoint data
    delete level._checkpointX;
    delete level._checkpointY;

    this.state = STATES.PLAYING;
    this.audio.stopMusic();
    this.audio.playMusic(level.music);
  };

  Game.prototype.renderCustomLevels = function(ctx) {
    const ed = this.editor;

    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, CW, CH);

    drawText(ctx, 'Fases Customizadas', CW / 2, 40, 28, '#FFD700', 'center', true);

    const slots = ed.saveSlots;
    if (slots.length === 0) {
      drawText(ctx, 'Nenhum nível salvo!', CW / 2, CH / 2 - 20, 18, '#888', 'center');
      drawText(ctx, 'Crie níveis no Editor primeiro.', CW / 2, CH / 2 + 10, 14, '#666', 'center');
      drawText(ctx, 'ENTER ou ESC para voltar', CW / 2, CH - 40, 12, '#555', 'center');
      return;
    }

    const itemH = 44;
    const startY = 90;
    for (let i = 0; i < slots.length; i++) {
      const y = startY + i * itemH;
      if (y > CH - 60) break;
      const selected = i === ed.customLevelSelection;

      if (selected) {
        const pulse = Math.sin(this.frame * 0.08) * 0.1 + 0.9;
        ctx.fillStyle = `rgba(255,140,0,${0.15 * pulse})`;
        drawRoundedRect(ctx, CW / 2 - 200, y - 6, 400, itemH - 4, 8);
        ctx.fill();
        ctx.strokeStyle = `rgba(255,140,0,${0.5 * pulse})`;
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      drawText(ctx, slots[i].name, CW / 2 - 160, y + 14, selected ? 16 : 14, selected ? '#FFD700' : '#aaa', 'left', selected);
      drawText(ctx, `${slots[i].gridW}×${slots[i].gridH}`, CW / 2 + 160, y + 14, 11, '#777', 'right');
    }

    drawText(ctx, '↑↓ Navegar   ENTER Jogar   ESC Voltar', CW / 2, CH - 30, 12, '#555', 'center');
  };
}

// ===== KEYBOARD INPUT FOR NAME EDITOR =====
// Intercept keyboard for text input in editor name mode
const _origKeyDown = document.onkeydown;
document.addEventListener('keydown', (e) => {
  if (typeof game !== 'undefined' && game.state === STATES.EDITOR &&
      game.editor && game.editor.mode === EDITOR_MODES.NAME_INPUT) {
    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
      game.editor.nameBuffer += e.key;
      if (game.editor.nameBuffer.length > 30) {
        game.editor.nameBuffer = game.editor.nameBuffer.slice(0, 30);
      }
    }
  }
});
