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
// LEVEL 2: "Confia no Pai"
// ============================================================
const LEVEL_2 = parseLevel({
  name: "Fase 2",
  subtitle: "Confia no Pai",
  bgColor: "#1a1a2e",
  music: "level2",
  map: [
    "...............................................................................................................",
    "...............................................................................................................",
    "...............................................................................................................",
    "...............................................................................................................",
    "...........C.C.C.C.....C.C.C..................................................................................",
    "..................................................?............................................................",
    "..........BBBB...........!...BBB.........................................X.................................",
    "....................................BB...................BB..................................................",
    ".............................................BB......[]...............[]...................................",
    "..........................BBB........BB...........BB.{}............BB.{}...................................",
    "......................................BB........BB...{}..........BB...{}...................................",
    "...........C.C.C.C.....C.C.C..........E........E.....{}......E........{}..E....F.WWWW.WWWWWWWWWWWWW.........",
    "..P....GGG..GGG..~~GG..GGG..GGG..GG..GGG..GGGGGGGGGGG{}GGG..GGGGG..GGG{}GGGGGGGGG..GWWWWWWWWWWWWWWWWWW....",
    "GGGGG^^###..###..^^##..###..###..##..###..###########{}###..#####..###{}#########..GWWWWWWWWWWWWWWWWWWW...",
    "#####^^###..###..^^##..###..###..##..###..###########{}###..#####..###{}#########..#WWWWWWWWWWWWWWWWWWWW..",
  ],
  trolls: [
    { triggerX: 300, action: "message", text: "Pega as moedas! Ou será que não...", duration: 90, triggered: false },
    { triggerX: 700, action: "spawn", entityType: "flying", spawnX: 900, spawnY: 128, triggered: false },
    { triggerX: 1000, action: "fall_blocks", startX: 1050, count: 4, triggered: false },
    { triggerX: 1800, action: "message", text: "Quase lá! Ou não...", duration: 90, triggered: false },
    { triggerX: 2100, action: "spawn", entityType: "fast_goomba", spawnX: 2200, spawnY: 352, triggered: false },
    { triggerX: 2100, action: "spawn", entityType: "fast_goomba", spawnX: 2250, spawnY: 352, triggered: false },
  ],
});

// ============================================================
// LEVEL 3: "O Castelo Sombrio"
// ============================================================
const LEVEL_3 = parseLevel({
  name: "Fase 3",
  subtitle: "O Castelo Sombrio",
  bgColor: "#2d0a31",
  music: "level3",
  map: [
    "###############WW.........WWW....WWWWWWWWWWWWWWWWWWWW...................WWW......WWWWWWWWWWWWWWWWWWWWWWWWWWW...C.......W......",
    ".............CCW-.........WW-....WWWWW--------WWWWWWC..R..C..C..........---......--WWWWWWWWWWWWWWWWWWWWWWWWW...-..C....W......",
    "..........C..CCW...WWWWWWWWWC....WWWW-.C.R.C..--WWWWC.....-GG-....C................WWWWWWWWWWWWWWWWWWWWWWWWW...===-....W......",
    ".......R.C...GGW...WWW--WWWWW....WW--...C.C.....--WWGv-....##.....C......H...CCC...--WWWWWWWWWWWWW--------WWW...W====.C=W......",
    "........C....##W..BWW-..--WW-....CC...............-W##...C.##.....[....-WWW-----.....---WWWWWW---.......C-WW...W===..--W......",
    ".P.CC..CC....##W.B.--..R..--....................[..-.....-G##...C.[..K..WWW...=.........------......R...CCWW...W==.C..=W......",
    "GGGGG.GGC....##WJ..........CC..J.......H.......E[....E.[..###...-~~GGGBBWWWC..=.....CCCCCCCCCCCCCCC....---WW.F.W==.-R..W......",
    "#####.##J....##WW..CC.....---..--WW---WWWWWGG~~GGWWGGGG[..###.....####..WWWCC.=.R..>>>>>><<>>>>>>>>.......WWWWWW==..-..W......",
    "####..C#GG~BB#WWBBBWWBBW.........CCCCCCCWWW##..##WWW###[..###.....####K.WWWCC.=....W##############W.......WWWWWWBB....CW......",
    "###....C##....W-.................CCCCCCCWWWW#..#WWWWWW#[..###.....####-.WWWCC.=...CW##############W....W..---WWW...=..-W......",
    "#CCC.......C......CCC..K........WWWWWWCCWWWWW..WWWWWWW#[...##......###..WWWCC.J...CWWW##########WWW.E.^W.....-WW...=..KW......",
    "#CCC...H...GGWWWWWWWWG~W>>>>.......CCCCC-----..-----WWW[...##....CCCCC.-#WWGGGG...CWWWWWWWWWWWWWWWWWWWWWCC....-WWBBBBBBW......",
    "#CCC..vG--.##WWWWWWWW..WWWWW.......CCCCC............-WW[...##...CCCCCC..#WW####....WWWWWWWWWWWWWWWWWWWWWWW.....--.....WW......",
    "#GGG..##LLL#WWWWWWWWWLLWWW.........--WWWWWWWWWLLLLLLLWW[...##...GGGGGGGG##W####^^^^WWWWWWWWWWWWWWWWWWWWW....E.E......WWW......",
    "####..######WWWWWWWWWWWWWLLLLLLLLLLLLWWWWWWWWWWLLLLLLWW[...##.....########W########WWWWWWWWWWWWWWWWWWWWWWWWWW-WWWWWWWWWW......",
  ],
  trolls: [
    { triggerX: 64, action: "message", text: "Bem-vindo ao Castelo Sombrio... cuidado!", duration: 120, triggered: false },
    { triggerX: 416, action: "spawn", entityType: "goomba", spawnX: 616, spawnY: 32, triggered: false },
    { triggerX: 640, action: "fall_blocks", startX: 640, count: 9, triggered: false },
    { triggerX: 640, action: "shake", duration: 20, triggered: false },
    { triggerX: 800, action: "spawn", entityType: "goomba", spawnX: 1000, spawnY: 32, triggered: false },
    { triggerX: 1248, action: "message", text: "Checkpoint? Não se anime tanto...", duration: 90, triggered: false },
    { triggerX: 1500, action: "spawn", entityType: "fast_goomba", spawnX: 1700, spawnY: 32, triggered: false },
    { triggerX: 1800, action: "fall_blocks", startX: 1850, count: 6, triggered: false },
    { triggerX: 2100, action: "shake", duration: 25, triggered: false },
    { triggerX: 2100, action: "spawn", entityType: "spiny", spawnX: 2300, spawnY: 320, triggered: false },
    { triggerX: 2100, action: "spawn", entityType: "flying", spawnX: 2400, spawnY: 128, triggered: false },
    { triggerX: 2400, action: "message", text: "Você ainda está vivo? Impressionante!", duration: 90, triggered: false },
    { triggerX: 2600, action: "spawn", entityType: "fast_goomba", spawnX: 2800, spawnY: 128, triggered: false },
    { triggerX: 2600, action: "spawn", entityType: "fast_goomba", spawnX: 2850, spawnY: 320, triggered: false },
    { triggerX: 3000, action: "fall_blocks", startX: 3050, count: 5, triggered: false },
    { triggerX: 3000, action: "shake", duration: 15, triggered: false },
    { triggerX: 3300, action: "message", text: "A bandeira! Será que é de verdade?", duration: 90, triggered: false },
    { triggerX: 3400, action: "spawn", entityType: "flying", spawnX: 3500, spawnY: 160, triggered: false },
    { triggerX: 3400, action: "spawn", entityType: "spiny", spawnX: 3500, spawnY: 320, triggered: false },
  ],
});

// ============================================================
// LEVEL 4: "Desista de Uma Vez!"
// ============================================================
const LEVEL_4 = parseLevel({
  name: "Fase 4",
  subtitle: "Desista de Uma Vez!",
  bgColor: "#2d0a31",
  music: "level3",
  map: [
    "###############[......[##############################[.......BBBB..........[#########[=.[###[.....[WWWWWWWWW[[[[[[[WWWWWWWWWWW",
    "##########[[[[[.......[[###[[[[[[[########[[[[[[#####[........BBB...........[########[=.[###[CC....[[WWW[[[[=[....[WWWW.W.WWWW",
    "########[[..............[[[..===..[####[[[......[####[..C.C....BB.CC...^.....[[[[####[=.[###[CC.....=[[[...==[.....[[WW.W.WWWW",
    "######[[.....................===...[[[[..........[[[[...C.C....CBJBB...[.........[###[=.[###[BB-....=..R...==[.......[W.W.WWWW",
    "#####[....C..................===.C..........C...........C.C....C.B.....[CCCCCCCC..[[[.=.[###[.......=......==[........WWWWWWWW",
    "###[[....!...................===...........C.C.........BB?BB...C....-..[>>>>>>>>......=.[###[C..-...=.C=C.C=..........WWWWWWWW",
    "[[[...........................=...........C...C...............C....^...[..............=.[###[C....^.=.-=-.-=C.........W.W.WWWW",
    "..............................=...!....BBB..^^.C...................B...[.......CCCCCCC=.[###[CC...[.B....C.=C.........W.W.WWWW",
    "..........CCC.....CCCC....CC................##.C..........[[[......B...[CHC....<<<<<<<=.[###[BB-..[.BB...C.=C^.-......W.W.WWWW",
    "..........GGG.....~~GG....GG..C..GGG........##.C.GGG.....[===[.....BBB-[GGG-.....BBBBB=C[[[[[.....[.!....C.=C[........WWWWWWWW",
    "C..........................#..[............C##.C.........CC.CC.....BBB.[...............C..........[....B....C[........WWWWWWWW",
    "C.........E.CC........C.E.C#..[..K^.C.E...CC##....E..CC..[C^[[.ECC.....[E......E.....K...E....>><<[....B....J[.....F..W.W.WWWW",
    "...P....GGGGGG........GGGGG#..GGGGGGGG...GGv##GGGGGGG~~GGGGGGGGG~~GGGGG[>>..<>>..<>>>>>>>>..<>####[GG....~GGGG..GGGGGGW.W.WWWW",
    "..GGGG..######........######..########^^^############..#########..#####[##..###..#########..######[#......####..######W.W.WWWW",
    "^^####..######^^^^^^^^######^^######################LLLL#######LLLL####[##^^###^^#########^^######[#^^^^^^####^^######WWWWWWWW",
  ],
  trolls: [
    { triggerX: 100, action: "message", text: "Última fase... boa sorte! Vai precisar.", duration: 120, triggered: false },
    { triggerX: 300, action: "spawn", entityType: "goomba", spawnX: 450, spawnY: 32, triggered: false },
    { triggerX: 500, action: "fall_blocks", startX: 550, count: 5, triggered: false },
    { triggerX: 800, action: "shake", duration: 30, triggered: false },
    { triggerX: 900, action: "message", text: "O chão parece seguro... parece.", duration: 90, triggered: false },
    { triggerX: 1000, action: "spawn", entityType: "fast_goomba", spawnX: 1200, spawnY: 128, triggered: false },
    { triggerX: 1000, action: "spawn", entityType: "spiny", spawnX: 1250, spawnY: 352, triggered: false },
    { triggerX: 1300, action: "fall_blocks", startX: 1350, count: 4, triggered: false },
    { triggerX: 1300, action: "shake", duration: 15, triggered: false },
    { triggerX: 1600, action: "message", text: "PARABÉNS! Você venc... brincadeira!", duration: 90, triggered: false },
    { triggerX: 1800, action: "spawn", entityType: "flying", spawnX: 2000, spawnY: 96, triggered: false },
    { triggerX: 2000, action: "fall_blocks", startX: 2050, count: 6, triggered: false },
    { triggerX: 2000, action: "shake", duration: 20, triggered: false },
    { triggerX: 2200, action: "message", text: "Checkpoint! Ou será uma armadilha?", duration: 90, triggered: false },
    { triggerX: 2500, action: "spawn", entityType: "fast_goomba", spawnX: 2650, spawnY: 128, triggered: false },
    { triggerX: 2500, action: "spawn", entityType: "spiny", spawnX: 2700, spawnY: 320, triggered: false },
    { triggerX: 2800, action: "spawn", entityType: "fast_goomba", spawnX: 3000, spawnY: 352, triggered: false },
    { triggerX: 2800, action: "spawn", entityType: "spiny", spawnX: 3050, spawnY: 352, triggered: false },
    { triggerX: 2800, action: "spawn", entityType: "flying", spawnX: 3100, spawnY: 192, triggered: false },
    { triggerX: 3000, action: "shake", duration: 20, triggered: false },
    { triggerX: 3200, action: "message", text: "Será que é de verdade dessa vez?", duration: 90, triggered: false },
    { triggerX: 3500, action: "spawn", entityType: "fast_goomba", spawnX: 3600, spawnY: 320, triggered: false },
    { triggerX: 3500, action: "spawn", entityType: "flying", spawnX: 3650, spawnY: 128, triggered: false },
    { triggerX: 3500, action: "message", text: "Quase lá... ou não!", duration: 60, triggered: false },
  ],
});

/** All campaign levels in order */
export const CAMPAIGN_LEVELS: ParsedLevel[] = [LEVEL_1, LEVEL_2, LEVEL_3, LEVEL_4];

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
