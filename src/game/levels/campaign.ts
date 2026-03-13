import { TileType, type ParsedLevel, type EntityType, type TrollTrigger, type GameEntity } from "../types";
import { TILE_SIZE, CHAR_TO_TILE } from "../constants";

// ============================================================
// Campaign Levels — ported from legacy/js/levels.js
// ============================================================

interface RawLevelConfig {
  name: string;
  subtitle?: string;
  bgColor: string;
  music: string;
  map: string[];
  entities?: { type: EntityType; x: number; y: number }[];
  trolls: TrollTrigger[];
}

/** Parse a character-map level into a ParsedLevel ready for gameplay */
function parseLevel(config: RawLevelConfig): ParsedLevel {
  const map = config.map;
  const entities: GameEntity[] = config.entities
    ? config.entities.map((e) => ({ ...e, alive: true }))
    : [];
  let playerStart = { x: 96, y: 384 };

  const height = map.length;
  const width = Math.max(...map.map((r) => r.length));

  const tiles: number[][] = [];
  for (let y = 0; y < height; y++) {
    tiles[y] = [];
    for (let x = 0; x < width; x++) {
      const ch = map[y]?.[x] ?? ".";

      if (ch === "P") {
        tiles[y][x] = TileType.AIR;
        playerStart = { x: x * TILE_SIZE, y: y * TILE_SIZE };
      } else if (ch === "C") {
        tiles[y][x] = TileType.AIR;
        entities.push({ type: "coin", x: x * TILE_SIZE + 8, y: y * TILE_SIZE + 4, alive: true });
      } else if (ch === "F") {
        tiles[y][x] = TileType.AIR;
        entities.push({ type: "flag", x: x * TILE_SIZE, y: y * TILE_SIZE, alive: true });
      } else if (ch === "X") {
        tiles[y][x] = TileType.AIR;
        entities.push({ type: "fake_flag", x: x * TILE_SIZE, y: y * TILE_SIZE, alive: true });
      } else if (ch === "E") {
        tiles[y][x] = TileType.AIR;
        entities.push({
          type: "goomba", x: x * TILE_SIZE, y: y * TILE_SIZE,
          vx: -1.5, vy: 0, dir: -1, alive: true,
        });
      } else if (ch === "K") {
        tiles[y][x] = TileType.AIR;
        entities.push({
          type: "spiny", x: x * TILE_SIZE, y: y * TILE_SIZE,
          vx: -1.5, vy: 0, dir: -1, alive: true,
        });
      } else if (ch === "R") {
        tiles[y][x] = TileType.AIR;
        entities.push({
          type: "flying", x: x * TILE_SIZE, y: y * TILE_SIZE,
          vx: -1.5, vy: 0, dir: -1, alive: true, baseY: y * TILE_SIZE, frame: 0,
        });
      } else {
        tiles[y][x] = CHAR_TO_TILE[ch] ?? TileType.AIR;
      }
    }
  }

  return {
    name: config.name,
    subtitle: config.subtitle,
    bgColor: config.bgColor,
    music: config.music,
    width,
    height,
    tiles,
    entities,
    trolls: config.trolls.map((t) => ({ ...t, triggered: false })),
    playerStart,
  };
}

// ============================================================
// LEVEL 1: "Parece Fácil"
// ============================================================
const LEVEL_1 = parseLevel({
  name: "Fase 1",
  subtitle: "Parece Fácil, Né?",
  bgColor: "#5c94fc",
  music: "level1",
  map: [
    "......................................................................................................",
    "......................................................................................................",
    "......................................................................................................",
    "......................................................................................................",
    "......................................................................................................",
    "..........C.C.C...........C..................................................C.C.C....................",
    "......................................................................................................",
    "..........?...............!.......................BB?BB...............................X.........W.WW..",
    "........................................................................................W...W.WWWWW..",
    "..............................................BBB.......................[]............W..WW.WWWWWWW..",
    "..................................................................[].{}............WWWWWWWWWWWWWW..",
    "..............................=.......[]...........................[].{}....F......WWWWWWWWWWWWWWW..",
    "..P.........C...............=......[].{}...[].....~~GGG.....E....[].{}..E........WWWWWWWWWWWWWWWW..",
    "GGGGGGGGGGGGGGGGGGG...GGGvGGGGG..GGG{}GGGGG{}GGG..^^GGGG..GGGGGG{}GGGGGGG...GGGGGGGGGGGGGGGGGGGGG",
    "###################...####^####..###{}#####{}###..^^####..######{}#######...#######################",
  ],
  trolls: [
    { triggerX: 540, action: "spawn", entityType: "goomba", spawnX: 800, spawnY: 32, triggered: false },
    { triggerX: 1700, action: "shake", duration: 15, triggered: false },
    { triggerX: 2200, action: "message", text: "Hmm... aquela bandeira parece estranha...", duration: 120, triggered: false },
    { triggerX: 2500, action: "spawn", entityType: "fast_goomba", spawnX: 2700, spawnY: 352, triggered: false },
  ],
});

// ============================================================
// LEVEL 2: "Nem Tudo é o que Parece" — Checkpoints & Hidden Spikes
// ============================================================
const LEVEL_2 = parseLevel({
  name: "Fase 2",
  subtitle: "Nem Tudo é o que Parece",
  bgColor: "#5c94fc",
  music: "easy",
  map: [
    ".........................................................",
    ".........................................................",
    ".........................................................",
    ".........................................................",
    "..........C.C.C............................C.C.C.........",
    ".........................................................",
    "..........???..........!.................B?B.............",
    ".........................................................",
    ".........................................................",
    "...........................C.C.C...........C.C.C.........",
    ".........................................................",
    "..........................GGG.....H......GGG.GGG.........",
    "..P.......C.C.C...E...C.........E...C..........H.....F.",
    "GGGGGGGGGGGGGGGGGGGGvvGGGGGGGGGGGGGvvGGGGGGGGGGGGGGGG",
    "####################^^#############^^##################",
  ],
  trolls: [
    { triggerX: 200, action: "message", text: "Cuidado com o chão... nem tudo é seguro!", duration: 120, triggered: false },
    { triggerX: 700, action: "message", text: "Checkpoint! Agora sim está seguro... será?", duration: 90, triggered: false },
    { triggerX: 1100, action: "spawn", entityType: "goomba", spawnX: 1300, spawnY: 352, triggered: false },
    { triggerX: 1400, action: "message", text: "Quase lá! Olha onde pisa...", duration: 90, triggered: false },
  ],
});

// ============================================================
// LEVEL 3: "Pula Mais Alto" — Springs & Trampolines
// ============================================================
const LEVEL_3 = parseLevel({
  name: "Fase 3",
  subtitle: "Pula Mais Alto",
  bgColor: "#87CEEB",
  music: "easy",
  map: [
    "...................................................",
    "...................................................",
    "...................................................",
    ".....................................C.C...........",
    "....................................GGG....C.......",
    "...................................................",
    "...........C.C.C.........C.C...........GGGG........",
    "...................................................",
    ".........BBB..B?B.........BB...........................",
    "...................................................",
    ".............................GGG.........GGG.......",
    ".................GGG...............................",
    "..P.....C.C.E.........C....E.C.C..........C....F.",
    "GGGGGGSGGGGGGGGG..GGJGGGGGGGGGGGG..GGJGGGGSGGGGGG",
    "################..##################..###########",
  ],
  trolls: [
    { triggerX: 160, action: "message", text: "Use as molas e trampolins para pular mais alto!", duration: 120, triggered: false },
    { triggerX: 600, action: "spawn", entityType: "fast_goomba", spawnX: 800, spawnY: 352, triggered: false },
    { triggerX: 1000, action: "message", text: "Quase lá! Dê um super pulo!", duration: 90, triggered: false },
  ],
});

// ============================================================
// LEVEL 4: "Gelo Fino" — Ice & Conveyors
// ============================================================
const LEVEL_4 = parseLevel({
  name: "Fase 4",
  subtitle: "Gelo Fino",
  bgColor: "#4a7ab5",
  music: "easy",
  map: [
    "...............................................................",
    "...............................................................",
    "...............................................................",
    "...............................................................",
    "...........C.C.C.........................C.C.C.................",
    "...............................................................",
    "...........B?B..........!.................B?B..................",
    "...............................................................",
    "...............................................................",
    "..........................C.C.C........C.C....C.C..............",
    "...............................................................",
    "..................GGGG...H..........GGGG.GGGG.....H............",
    "..P....C.C.C..E...........C.C.E..........C...........E....F..",
    "GGGGGGIIIIIIIIIIII>>GGGG<<IIIIIIII>>GGGG<<IIIIIGGGGGGGGGGGGG",
    "######IIIIIIIIIIII>>####<<IIIIIIII>>####<<IIIII#############",
  ],
  trolls: [
    { triggerX: 200, action: "message", text: "Gelo! Vai escorregaaaar!", duration: 120, triggered: false },
    { triggerX: 600, action: "spawn", entityType: "goomba", spawnX: 750, spawnY: 352, triggered: false },
    { triggerX: 900, action: "message", text: "Esteiras + Gelo = Diversão... ou não!", duration: 90, triggered: false },
    { triggerX: 1300, action: "spawn", entityType: "spiny", spawnX: 1500, spawnY: 352, triggered: false },
  ],
});

// ============================================================
// LEVEL 5: "Voando Alto" — Flying Enemies & Aerial Platforms
// ============================================================
const LEVEL_5 = parseLevel({
  name: "Fase 5",
  subtitle: "Voando Alto",
  bgColor: "#5c94fc",
  music: "medium",
  map: [
    "................................................................",
    "................................................................",
    "...........C..............C.C..........................C.........",
    "..........GGG............GGG.........C................GGG.......",
    ".............................R......GGG...R.....................",
    "...................R............................................",
    "........C.C.C..........C.C.C........C.C.C........C.C.C........",
    "........--.--..........--.--.........--.--.........---...........",
    "................................................................",
    "......................................................GGG.......",
    "..........................GGG...H.....GGGG.....................",
    "...............GGG.............................................",
    "..P.....C.C.......E....C........K...C.C.........E.C.....H..F.",
    "GGGGGGGGGGGGGG..GGGGGGGGGGGG..GGGGGGGGGGGG..GGGGGGGGGGGGGGGG",
    "##############..############..############..################",
  ],
  trolls: [
    { triggerX: 200, action: "message", text: "Cuidado com o céu! Tem coisa voando...", duration: 120, triggered: false },
    { triggerX: 500, action: "spawn", entityType: "flying", spawnX: 700, spawnY: 128, triggered: false },
    { triggerX: 900, action: "spawn", entityType: "flying", spawnX: 1100, spawnY: 96, triggered: false },
    { triggerX: 1200, action: "spawn", entityType: "spiny", spawnX: 1400, spawnY: 352, triggered: false },
    { triggerX: 1500, action: "message", text: "Passou pelos voadores? Impressionante!", duration: 90, triggered: false },
  ],
});

// ============================================================
// LEVEL 6: "Falsa Esperança" — Fake Flags & Fake Ground
// ============================================================
const LEVEL_6 = parseLevel({
  name: "Fase 6",
  subtitle: "Falsa Esperança",
  bgColor: "#1a1a2e",
  music: "medium",
  map: [
    ".....................................................................",
    ".....................................................................",
    ".....................................................................",
    ".....................................................................",
    "...........C.C.C..............C.C..............C.C.C.................",
    ".....................................................................",
    "...........???........!.........B?B...........B!B....................",
    ".....................................................................",
    ".....................................................................",
    "..........................C.C.C...........C.C.C...........C.C.C.....",
    ".....................................................................",
    ".....................................................................",
    "..P.......C.C.C..E....X....E..C..H...X...E...C.C.C...H........F...",
    "GGGGGGGGGGGGGGGG~~GGGGGGGG~~GGGGGGGGGG~~GGGGGGGGGGGGGGGGGGGGGGGGGGG",
    "################..########..##########..###########################",
  ],
  trolls: [
    { triggerX: 300, action: "message", text: "A bandeira! Finalmente!", duration: 90, triggered: false },
    { triggerX: 550, action: "message", text: "Hahaha! Era falsa! Continua andando...", duration: 120, triggered: false },
    { triggerX: 800, action: "spawn", entityType: "goomba", spawnX: 950, spawnY: 352, triggered: false },
    { triggerX: 1000, action: "message", text: "Será que essa é de verdade?", duration: 90, triggered: false },
    { triggerX: 1200, action: "spawn", entityType: "fast_goomba", spawnX: 1350, spawnY: 352, triggered: false },
    { triggerX: 1400, action: "message", text: "Calma... nem tudo que brilha é ouro!", duration: 90, triggered: false },
    { triggerX: 1650, action: "spawn", entityType: "goomba", spawnX: 1800, spawnY: 352, triggered: false },
  ],
});

// ============================================================
// LEVEL 7: "Terremoto" — Fall Blocks & Screen Shake
// ============================================================
const LEVEL_7 = parseLevel({
  name: "Fase 7",
  subtitle: "Terremoto",
  bgColor: "#3d1f00",
  music: "medium",
  map: [
    ".............................................................",
    ".............................................................",
    "BBBBB.......BBBBB........BBBBB........BBBBB........BBBBB....",
    ".............................................................",
    "..........C.C.C...............C.C.C...........................",
    ".............................................................",
    "..........B?B..............B!B..............B?B...............",
    ".............................................................",
    ".............................................................",
    ".......................C.C.C...........C.C.C.................",
    ".............................................................",
    "....................GGGG...H.........GGGG.GGGG...H...........",
    "..P.....C.C.C..E.............E..C.C..........E.K........F...",
    "GGGGGGGGGGGGGGGGGGG..GGGGGGGGGGGGGGG..GGGGGGGGGGGGGGGGGGGGG",
    "###################..###############..#####################",
  ],
  trolls: [
    { triggerX: 200, action: "message", text: "O chão está tremendo...", duration: 90, triggered: false },
    { triggerX: 350, action: "fall_blocks", startX: 320, count: 5, triggered: false },
    { triggerX: 350, action: "shake", duration: 20, triggered: false },
    { triggerX: 700, action: "fall_blocks", startX: 672, count: 5, triggered: false },
    { triggerX: 700, action: "shake", duration: 25, triggered: false },
    { triggerX: 1000, action: "spawn", entityType: "goomba", spawnX: 1100, spawnY: 32, triggered: false },
    { triggerX: 1100, action: "fall_blocks", startX: 1056, count: 5, triggered: false },
    { triggerX: 1100, action: "shake", duration: 20, triggered: false },
    { triggerX: 1400, action: "fall_blocks", startX: 1376, count: 5, triggered: false },
    { triggerX: 1400, action: "shake", duration: 30, triggered: false },
    { triggerX: 1400, action: "message", text: "TERREMOTO FINAL!!!", duration: 60, triggered: false },
  ],
});

// ============================================================
// LEVEL 8: "Labirinto Troll" — Pipe Mazes & Invisible Blocks
// ============================================================
const LEVEL_8 = parseLevel({
  name: "Fase 8",
  subtitle: "Labirinto Troll",
  bgColor: "#1a0a2e",
  music: "hard",
  map: [
    "[].[]...........[].[].........[].[].........[].[]..........=....",
    "{}C{}...........{}.{}...C.....{}.{}...C.....{}.{}..........=....",
    "{}C{}..C........{}.{}...C.....[].[]...........[].[]........=....",
    "[].[]..C........[].[]........C{}.{}..........C{}.{}.C......=....",
    ".......C..............C......C[].[]..........C[].[]........=....",
    "..==............==............{}.{}..........H.............GGG..",
    "...........C..........C......{}.{}.....C.......................",
    "....=.C.C.=.....=.C.C.=.....[].[].........H..................",
    "......................................................GGG.....",
    "...GGG......GGG.......GGG.....GGG.....GGG...................",
    "............................C.C..........................GGG..",
    "............................................E.......K.........",
    "..P....C.E.........C..E..........C..E.........C.C.C......F..",
    "GGGGGGGGGGG..GGGGGGGGGGG..GGGGGGGGGGG..GGGGGGGGGGGGGGGGGGGG",
    "###########..###########..###########..####################",
  ],
  trolls: [
    { triggerX: 100, action: "message", text: "Encontre a saída... se conseguir!", duration: 120, triggered: false },
    { triggerX: 400, action: "spawn", entityType: "goomba", spawnX: 550, spawnY: 352, triggered: false },
    { triggerX: 600, action: "message", text: "Blocos invisíveis podem te ajudar... ou não!", duration: 120, triggered: false },
    { triggerX: 900, action: "spawn", entityType: "flying", spawnX: 1000, spawnY: 128, triggered: false },
    { triggerX: 1200, action: "fall_blocks", startX: 1250, count: 3, triggered: false },
    { triggerX: 1500, action: "spawn", entityType: "spiny", spawnX: 1650, spawnY: 352, triggered: false },
    { triggerX: 1700, action: "message", text: "A saída está perto... confia!", duration: 90, triggered: false },
  ],
});

// ============================================================
// LEVEL 9: "Sem Piedade" — Extreme Combo
// ============================================================
const LEVEL_9 = parseLevel({
  name: "Fase 9",
  subtitle: "Sem Piedade",
  bgColor: "#0a0a1a",
  music: "hard",
  map: [
    "...................................................................",
    "...................................................................",
    "...................................................................",
    "..............C.................C.............C.....................",
    ".............GGG...............GGG...........GGG...................",
    "...................................................................",
    ".......C.C..........C.C.C...........C.C.C..........C.C.C..........",
    "........--.............--..............--............---............",
    "...................................................................",
    "...................................................................",
    "........................GGG..H...........GGG..H....................",
    "...................................................................",
    "..P...C.C..E...C.......K...C.C..R...C......C.C.K.E.....C.....F..",
    "GGGGGIIIII>>GG<<IIIIII~~GGGSGGGG~~IIIIII>>GG<<IIIIIGGGGGGGGGGGGG",
    "#####IIIII>>##<<IIIIII..###S####..IIIIII>>##<<IIIII#############",
  ],
  trolls: [
    { triggerX: 100, action: "message", text: "Sem piedade. Boa sorte.", duration: 90, triggered: false },
    { triggerX: 400, action: "spawn", entityType: "flying", spawnX: 600, spawnY: 96, triggered: false },
    { triggerX: 400, action: "shake", duration: 15, triggered: false },
    { triggerX: 700, action: "fall_blocks", startX: 700, count: 4, triggered: false },
    { triggerX: 900, action: "spawn", entityType: "fast_goomba", spawnX: 1050, spawnY: 352, triggered: false },
    { triggerX: 1100, action: "spawn", entityType: "flying", spawnX: 1250, spawnY: 64, triggered: false },
    { triggerX: 1100, action: "shake", duration: 20, triggered: false },
    { triggerX: 1400, action: "fall_blocks", startX: 1400, count: 5, triggered: false },
    { triggerX: 1400, action: "spawn", entityType: "spiny", spawnX: 1550, spawnY: 352, triggered: false },
    { triggerX: 1700, action: "message", text: "Você ainda está vivo?!", duration: 60, triggered: false },
  ],
});

// ============================================================
// LEVEL 10: "O Arquiteto Final" — The Ultimate Gauntlet
// ============================================================
const LEVEL_10 = parseLevel({
  name: "Fase 10",
  subtitle: "O Arquiteto Final",
  bgColor: "#0d0d0d",
  music: "hard",
  map: [
    "...........................................................................................",
    "...........................................................................................",
    "BBBBB..........BBBBB..........BBBBB..........BBBBB..........BBBBB..........BBBBB..........",
    "...........................................................................................",
    ".......C.C.C.................C.C.C.................C.C.C.................C.C.C..............",
    "...........................................................................................",
    ".......B?B..........!.......B?B..........!.......B?B..........!.......B?B..................",
    "...........................................................................................",
    "...................................................C.C.C...........C.C.C...................",
    ".......GGG..............GGG..............GGG.....................................GGG.......",
    "...........................................................................................",
    ".......................H....................H....................H...........................",
    "..P..C.C.E...C..K..C.....E..C.R..C.C...K..C.....E..C.C.K..C.....E.C.R..C.C...K.....F...",
    "GGGGGGGGGGGGvvGGIIII>>GG<<~~GGGSJGGG~~II>>GG<<vvGGGGSJGGG~~II>>GG<<GGvvGGGGGGGGGGGGGGG",
    "############^^##IIII>>##<<..###S####..II>>##<<^^######S####..II>>##<<##^^################",
  ],
  trolls: [
    { triggerX: 100, action: "message", text: "A provação final. Tudo que você aprendeu.", duration: 120, triggered: false },
    { triggerX: 350, action: "fall_blocks", startX: 320, count: 5, triggered: false },
    { triggerX: 350, action: "shake", duration: 15, triggered: false },
    { triggerX: 600, action: "spawn", entityType: "flying", spawnX: 750, spawnY: 64, triggered: false },
    { triggerX: 800, action: "spawn", entityType: "fast_goomba", spawnX: 950, spawnY: 352, triggered: false },
    { triggerX: 800, action: "shake", duration: 20, triggered: false },
    { triggerX: 1050, action: "fall_blocks", startX: 1024, count: 5, triggered: false },
    { triggerX: 1050, action: "spawn", entityType: "spiny", spawnX: 1200, spawnY: 352, triggered: false },
    { triggerX: 1300, action: "spawn", entityType: "flying", spawnX: 1400, spawnY: 96, triggered: false },
    { triggerX: 1300, action: "shake", duration: 15, triggered: false },
    { triggerX: 1550, action: "fall_blocks", startX: 1536, count: 5, triggered: false },
    { triggerX: 1550, action: "spawn", entityType: "fast_goomba", spawnX: 1700, spawnY: 352, triggered: false },
    { triggerX: 1800, action: "fall_blocks", startX: 1792, count: 5, triggered: false },
    { triggerX: 1800, action: "shake", duration: 25, triggered: false },
    { triggerX: 2000, action: "spawn", entityType: "flying", spawnX: 2100, spawnY: 64, triggered: false },
    { triggerX: 2000, action: "spawn", entityType: "spiny", spawnX: 2150, spawnY: 352, triggered: false },
    { triggerX: 2200, action: "message", text: "Será que é de verdade dessa vez?!", duration: 90, triggered: false },
    { triggerX: 2400, action: "spawn", entityType: "fast_goomba", spawnX: 2500, spawnY: 320, triggered: false },
    { triggerX: 2400, action: "spawn", entityType: "flying", spawnX: 2550, spawnY: 128, triggered: false },
  ],
});

/** All campaign levels in order */
export const CAMPAIGN_LEVELS: ParsedLevel[] = [
  LEVEL_1, LEVEL_2, LEVEL_3, LEVEL_4, LEVEL_5,
  LEVEL_6, LEVEL_7, LEVEL_8, LEVEL_9, LEVEL_10,
];

/** Get a fresh copy of a campaign level (trolls reset) */
export function getCampaignLevel(index: number): ParsedLevel | null {
  const level = CAMPAIGN_LEVELS[index];
  if (!level) return null;
  return {
    ...level,
    entities: level.entities.map((e) => ({ ...e, alive: true })),
    trolls: level.trolls.map((t) => ({ ...t, triggered: false })),
    _checkpointX: undefined,
    _checkpointY: undefined,
  };
}
