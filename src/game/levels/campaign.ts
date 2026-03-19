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
// LEVEL 0: "Meu Nível" — O Castelo Sombrio
// ============================================================
const LEVEL_0 = parseLevel({
  name: "Meu Nível",
  subtitle: "O Castelo Sombrio",
  bgColor: "#2d0a31",
  music: "level3",
  map: [
    "###############WW.........WWW....WWWWWWWWWWWWWWWWWWWW...................WWW......WWWWWWWWWWWWWWWWWWWWWWWWWWW...C.......W......",
    ".............CCW-.........WW-....WWWWW--------WWWWWWC..R..C..C..........---......--WWWWWWWWWWWWWWWWWWWWWWWWW...-..C....W......",
    "..........C..CCW...WWWWWWWWWC....WWWW-.C.R.C..--WWWWC.....-GG-....C................WWWWWWWWWWWWWWWWWWWWWWWWW...===-....W......",
    ".......R.C...GGW...WWW--WWWWW....WW--...C.C.....--WWGv-....##.....C......H...CCC...--WWWWWWWWWWWW--------WWW...W====.C=W......",
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
  entities: [],
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
// LEVEL 1: "Parece Fácil, Né?" — Tutorial com Trollagens Escondidas
// ============================================================
const LEVEL_1 = parseLevel({
  name: "Fase 1",
  subtitle: "Parece Fácil, Né?",
  bgColor: "#5c94fc",
  music: "level1",
  map: [
    "..............................................................................................",
    "..............................................................................................",
    "..............................................................................................",
    "..............................................................................................",
    "..............................................................................................",
    "..........C.C.C.........................C.C.C..........C.C.C.C.C...........................",
    "..............................................................................................",
    "..........?.?.?........!..............B?B..B!B..............................WW...WW..........",
    "........................................................WW...............WWWWWWWWW..........",
    "..............................................GGG........WWWW...........WWWWWWWWWWWW.........",
    "....................................GGG...C.C..GGG..C.C..WWWWWWWW....WWWWWWWWWWWWWW.........",
    "..............H.............~~.CGGGvGGG...GGG....H.GGG..GWWWWWWWWWWWWWWWWWWWWWWWWWW........",
    "..P.......C.C.E......C.........E.C.C..C.CXC.CE.C.C.E.......F..WWWWWWWWWWWWWWWWWWWWW......",
    "GGGGGGGGGGGGGGGGv...GGGGGvGGGG~~GGGGGGGGGGGGGGGGGGG..GGGGGGGG.GWWWWWWWWWWWWWWWWWWWWW.....",
    "################^...#####^####..###################..########.#WWWWWWWWWWWWWWWWWWWWWWW....",
  ],
  entities: [],
  trolls: [
    { triggerX: 96, action: "message", text: "Parece fácil? Hmm... veremos!", duration: 120, triggered: false },
    { triggerX: 480, action: "sound", sfx: "sfx_laugh", triggered: false },
    { triggerX: 640, action: "spawn", entityType: "goomba", spawnX: 900, spawnY: 352, triggered: false },
    { triggerX: 960, action: "message", text: "O chão parece estranho aqui...", duration: 90, triggered: false },
    { triggerX: 1120, action: "spawn", entityType: "fast_goomba", spawnX: 1350, spawnY: 352, triggered: false },
    { triggerX: 1280, action: "message", text: "Olha! A bandeira! Finalmente!", duration: 90, triggered: false },
    { triggerX: 1344, action: "sound", sfx: "sfx_bruh", triggered: false },
    { triggerX: 1376, action: "message", text: "...era FALSA! Hahaha! Continua andando!", duration: 120, triggered: false },
    { triggerX: 1600, action: "spawn", entityType: "goomba", spawnX: 1780, spawnY: 352, triggered: false },
    { triggerX: 1760, action: "message", text: "Essa sim é de verdade... será?", duration: 90, triggered: false },
  ],
});

// ============================================================
// LEVEL 2: "Confia no Pai" — Ruínas Sombrias na Areia
// ============================================================
const LEVEL_2 = parseLevel({
  name: "Fase 2",
  subtitle: "Confia no Pai",
  bgColor: "#1a1a2e",
  music: "level1",
  map: [
    ".....................................................................................................",
    "..t.............................t................................t................................t...",
    ".....................................................................................................",
    ".........C.C.C.C.........................C.C.C..C.C..................C.C.C.C.......................",
    ".....................................................................................................",
    ".........mmmm..........!..............mmmm.mmm..............................mmm.mmm...............",
    ".....................................................................................................",
    ".........?.?.?.?......B!B...........mm.C.C.C.mm........B?B.B!B.......................WW.WW........",
    ".....................................................................................................",
    ".............................................mmm..C.C....mmm............mmm.........WW..WWWW......",
    "...................................mmm..C.C..mmm..C.C....mmm....mmm..C.C.mmm.....WWWWWWWWWWWW....",
    "..............H.............~~.C..vAA..AAA.......H..AAAA......AAA.C...AAA..H.GWWWWWWWWWWWWWWWWWW..",
    "..P......C.C.C.E.....C........E.C.C...E.C.C.C....E.C.C.E......E.C.C.E.......F.WWWWWWWWWWWWWWWW..",
    "AAAAAAAAAAAAAAAAAA...AAAAAvAAAA~~AAAAAAAAAAAAA..AAAAAAAAAA..AAAAAAAAAAAA..GGGGGGWWWWWWWWWWWWWWWWW.",
    "##################...#####^####..#############..##########..############..######WWWWWWWWWWWWWWWWWWW",
  ],
  entities: [],
  trolls: [
    { triggerX: 96, action: "message", text: "Confia no pai... tá tudo safe!", duration: 120, triggered: false },
    { triggerX: 96, action: "sound", sfx: "sfx_drama", triggered: false },
    { triggerX: 512, action: "spawn", entityType: "goomba", spawnX: 750, spawnY: 352, triggered: false },
    { triggerX: 800, action: "message", text: "Cuidado com a areia... nem tudo é sólido!", duration: 90, triggered: false },
    { triggerX: 800, action: "shake", duration: 15, triggered: false },
    { triggerX: 1100, action: "spawn", entityType: "spiny", spawnX: 1350, spawnY: 352, triggered: false },
    { triggerX: 1350, action: "fall_blocks", startX: 1400, count: 4, triggered: false },
    { triggerX: 1500, action: "message", text: "Tá suave... confia!", duration: 90, triggered: false },
    { triggerX: 1700, action: "spawn", entityType: "fast_goomba", spawnX: 1950, spawnY: 352, triggered: false },
    { triggerX: 1700, action: "sound", sfx: "sfx_laugh", triggered: false },
    { triggerX: 1950, action: "spawn", entityType: "flying", spawnX: 2100, spawnY: 192, triggered: false },
    { triggerX: 2100, action: "message", text: "Quase lá... confia mais um pouquinho!", duration: 90, triggered: false },
    { triggerX: 2300, action: "spawn", entityType: "fast_goomba", spawnX: 2450, spawnY: 352, triggered: false },
  ],
});

// ============================================================
// LEVEL 3: "Sobe e Desce" — Trampolins, Molas e Power-Ups
// ============================================================
const LEVEL_3 = parseLevel({
  name: "Fase 3",
  subtitle: "Sobe e Desce",
  bgColor: "#87CEEB",
  music: "easy",
  map: [
    "...............................................................................",
    "...............................................................................",
    "..C...............C.C.C.................C.C.C...............C....................",
    ".GGG...........GGGGGGG...............GGGGGGG.............GGG...................",
    "...............................................................................",
    "..........C.C.C..M.................C.C.C..M..............C.C.C.M...............",
    "..........GGG.GGG.................GGG.GGG.................GGG.GGG..............",
    "...............................................................................",
    "...............................................................................",
    "..........C..........C.C.C..........C..........C.C.C...........C...............",
    "...............................................................................",
    "..............H..........GGG..........H............GGG..........H..............",
    "..P.....C.C.C..E.......C...E..C.C.C..E.......C...E..C.C.C.E.C.C.C..........F.",
    "GGGGGSJGGGGGGGGGG..GGJGGGSJGGGGGGGGGGG..GGJGGGSJGGGGGGGGGGGG..GGJGGGGGGGGGGGGG",
    "####S################J####S###########..##J####S##############..#J#############",
  ],
  entities: [],
  trolls: [
    { triggerX: 96, action: "message", text: "Use as molas e trampolins! Sobe e desce!", duration: 120, triggered: false },
    { triggerX: 96, action: "sound", sfx: "sfx_horn", triggered: false },
    { triggerX: 480, action: "spawn", entityType: "flying", spawnX: 650, spawnY: 128, triggered: false },
    { triggerX: 800, action: "spawn_powerup", powerUpType: "mushroom", spawnX: 900, spawnY: 320, triggered: false },
    { triggerX: 800, action: "message", text: "Pegue o power-up! Vai precisar!", duration: 90, triggered: false },
    { triggerX: 1100, action: "spawn", entityType: "fast_goomba", spawnX: 1300, spawnY: 352, triggered: false },
    { triggerX: 1100, action: "shake", duration: 15, triggered: false },
    { triggerX: 1400, action: "spawn", entityType: "flying", spawnX: 1550, spawnY: 96, triggered: false },
    { triggerX: 1600, action: "message", text: "O segredo é pular no momento certo!", duration: 90, triggered: false },
    { triggerX: 1900, action: "spawn", entityType: "spiny", spawnX: 2100, spawnY: 352, triggered: false },
    { triggerX: 2100, action: "message", text: "Quase lá! Um último super pulo!", duration: 90, triggered: false },
  ],
});

// ============================================================
// LEVEL 4: "Gelo e Fogo" — Gelo Escorregadio com Lava e Água
// ============================================================
const LEVEL_4 = parseLevel({
  name: "Fase 4",
  subtitle: "Gelo e Fogo",
  bgColor: "#c8d8e8",
  music: "easy",
  map: [
    ".....................................................................................................",
    ".....................................................................................................",
    ".....................................................................................................",
    ".....................................................................................................",
    "..........C.C.C.C............................C.C.C.C...............C.C.C.C........................",
    ".....................................................................................................",
    "..........?...?.?........!...............B?B..B!B..........iii......................NNNN.NN.........",
    ".....................................................................................................",
    ".....................................................................................................",
    ".................................NNN..C.C...NNN.......NNN.C.C..NNN......NNN....NNNNNNNNN..........",
    ".....................................................................................................",
    ".............H..........NNN...C.NNNvNNN..NNN...H..wwwww..NNN.C.NNN...H.GNNNNNNNNNNNNNN..........",
    "..P......C.C..E.....C........E.C.C.C..E.C.C....E.wwwww.E.C.C.C..K.......F..NNNNNNNNNNN.........",
    "NNNNNNIIIIIIIIII>>NN<<IIIIIIIIIII~~NNNNNNNNNN..NNNNNNNN..NNNNNNNNNN..GGGGGGGGNNNNNNNNNNNN........",
    "######IIIIIIIIII>>##<<IIIIIIIIIII..##########..########..##########..########NNNNNNNNNNNNN.......",
  ],
  entities: [],
  trolls: [
    { triggerX: 96, action: "message", text: "Gelo! Vai escorregaaaar!", duration: 120, triggered: false },
    { triggerX: 96, action: "sound", sfx: "sfx_scream", triggered: false },
    { triggerX: 544, action: "spawn", entityType: "goomba", spawnX: 750, spawnY: 352, triggered: false },
    { triggerX: 750, action: "message", text: "Esteira + Gelo = Diversão... ou morte!", duration: 90, triggered: false },
    { triggerX: 1000, action: "fall_blocks", startX: 1050, count: 4, triggered: false },
    { triggerX: 1000, action: "shake", duration: 20, triggered: false },
    { triggerX: 1250, action: "spawn", entityType: "spiny", spawnX: 1400, spawnY: 352, triggered: false },
    { triggerX: 1400, action: "message", text: "Cuidado com a água... escorregou?", duration: 90, triggered: false },
    { triggerX: 1600, action: "spawn", entityType: "fast_goomba", spawnX: 1800, spawnY: 352, triggered: false },
    { triggerX: 1600, action: "sound", sfx: "sfx_laugh", triggered: false },
    { triggerX: 1900, action: "spawn", entityType: "flying", spawnX: 2050, spawnY: 128, triggered: false },
    { triggerX: 2050, action: "message", text: "Passando do gelo pro fogo? Boa sorte!", duration: 90, triggered: false },
    { triggerX: 2300, action: "spawn", entityType: "fast_goomba", spawnX: 2500, spawnY: 352, triggered: false },
  ],
});

// ============================================================
// LEVEL 5: "Gravidade Maluca" — Zonas de Gravidade e Blocos Temporais
// ============================================================
const LEVEL_5 = parseLevel({
  name: "Fase 5",
  subtitle: "Gravidade Maluca",
  bgColor: "#0a0a14",
  music: "medium",
  map: [
    "...........................................................................................",
    "...........................................................................................",
    "^^...........^^..........^^...........^^..........^^..........^^..........^^................",
    "##...........##..........##...........##..........##..........##..........##................",
    "...........................................................................................",
    "..........C.C.C..T.T.T.........C.C.C..T.T.T..........C.C.C..T.T.T...................C.C..",
    "...........................................................................................",
    "..........B?B...............B!B...........B?B...............M..............WW.WW............",
    "...........................................................................................",
    "..........GGG...............GGG..Z........GGG...........GGG...GGG.......WWWWWWWW...........",
    "...........................................................................................",
    "............H...........Y.GGG......GGG.....H..Y..GGG..........H...GGG.GWWWWWWWWWWWW.......",
    "..P.....C.C.E.....Z...........E.C.C.C.......E..C.C.C.Y..E.C.C.C..E.......F.WWWWWWWWWWWWWW.",
    "GGGGGGGGGGGGGGG..GGGGGGGGGGG..GGGGGGGGGGGGG..GGGGGGGGGGG..GGGGGGGGG..GGGGGGGWWWWWWWWWWWWWW",
    "###############..###########..#############..###########..#########..#######WWWWWWWWWWWWWWWW",
  ],
  entities: [],
  trolls: [
    { triggerX: 96, action: "message", text: "Para cima ou para baixo? Boa sorte!", duration: 120, triggered: false },
    { triggerX: 96, action: "sound", sfx: "sfx_drama", triggered: false },
    { triggerX: 500, action: "gravity_flip", flipDuration: 180, triggered: false },
    { triggerX: 500, action: "message", text: "GRAVIDADE INVERTIDA! Cuidado com o teto!", duration: 90, triggered: false },
    { triggerX: 800, action: "spawn", entityType: "flying", spawnX: 950, spawnY: 192, triggered: false },
    { triggerX: 1000, action: "spawn", entityType: "fast_goomba", spawnX: 1200, spawnY: 352, triggered: false },
    { triggerX: 1000, action: "shake", duration: 20, triggered: false },
    { triggerX: 1300, action: "gravity_flip", flipDuration: 150, triggered: false },
    { triggerX: 1300, action: "message", text: "De novo?! HAHAHA!", duration: 90, triggered: false },
    { triggerX: 1300, action: "sound", sfx: "sfx_laugh", triggered: false },
    { triggerX: 1600, action: "spawn", entityType: "spiny", spawnX: 1800, spawnY: 352, triggered: false },
    { triggerX: 1900, action: "fall_blocks", startX: 1950, count: 5, triggered: false },
    { triggerX: 2000, action: "message", text: "Os blocos temporais somem... e voltam!", duration: 90, triggered: false },
    { triggerX: 2300, action: "spawn", entityType: "flying", spawnX: 2450, spawnY: 128, triggered: false },
    { triggerX: 2500, action: "message", text: "Segue reto... se a gravidade deixar!", duration: 90, triggered: false },
  ],
});

// ============================================================
// LEVEL 6: "Falsa Esperança" — Máxima Decepção com Bandeiras Falsas
// ============================================================
const LEVEL_6 = parseLevel({
  name: "Fase 6",
  subtitle: "Falsa Esperança",
  bgColor: "#1a1a2e",
  music: "medium",
  map: [
    "............................................................................................................................",
    "............................................................................................................................",
    "............................................................................................................................",
    "............................................................................................................................",
    "......C.C.C.C.C..........C.C.C.C.C...........C.C.C.C.C..........C.C.C.C.C..........C.C.C.C.C..............C.C.C............",
    "............................................................................................................................",
    "......B?B.B!B.............B?B.B!B..............B?B.B!B.............B?B.B!B..............B?B...................WW.WW...........",
    "............................................................................................................................",
    "............................................................................................................................",
    ".........GGG..................GGG...................GGG..............GGG..................GGG.............WWWWWWWWWWW..........",
    "............................................................................................................................",
    "...H..GGG.....GGG....H..GGG.....GGG....H..GGG......GGG....H..GGG.....GGG....H..GGG.....GGG..GWWWWWWWWWWWWWWWWWWW.........",
    "..P.C.C.X.E.C.C..E.C.C.X.E.C.C...E.C.C.X..E.C.C.C..E.C.C.X.E.C.C....E.C.C.C.E.C.C..........F..WWWWWWWWWWWWWWWWWWW......",
    "GGGGGGGGGG~~GGGG..GGGGGGGG~~GGGG..GGGGGGGG~~GGGGGGG..GGGGGGGG~~GGGGG..GGGGGGGGGGGGGGG..GGGGGGGGG.GWWWWWWWWWWWWWWWWWWWW....",
    "##########..####..########..####..########..#######..########..#####..###############..#########.#WWWWWWWWWWWWWWWWWWWWWW...",
  ],
  entities: [],
  trolls: [
    { triggerX: 96, action: "message", text: "A bandeira está ali! Vai logo!", duration: 120, triggered: false },
    { triggerX: 288, action: "sound", sfx: "sfx_horn", triggered: false },
    { triggerX: 320, action: "message", text: "PARABÉNS! Você venc... espera, é falsa!", duration: 120, triggered: false },
    { triggerX: 320, action: "sound", sfx: "sfx_sad", triggered: false },
    { triggerX: 600, action: "spawn", entityType: "goomba", spawnX: 800, spawnY: 352, triggered: false },
    { triggerX: 700, action: "message", text: "A próxima é de verdade! Confia!", duration: 90, triggered: false },
    { triggerX: 900, action: "sound", sfx: "sfx_fart", triggered: false },
    { triggerX: 900, action: "message", text: "...falsa de novo! Hahaha!", duration: 120, triggered: false },
    { triggerX: 1200, action: "spawn", entityType: "fast_goomba", spawnX: 1400, spawnY: 352, triggered: false },
    { triggerX: 1300, action: "message", text: "Juroooo que essa é a verdadeira!", duration: 90, triggered: false },
    { triggerX: 1500, action: "sound", sfx: "sfx_bruh", triggered: false },
    { triggerX: 1550, action: "message", text: "...mentiiiii! Hahahahaha! 😈", duration: 120, triggered: false },
    { triggerX: 1800, action: "spawn", entityType: "spiny", spawnX: 2000, spawnY: 352, triggered: false },
    { triggerX: 1900, action: "message", text: "OK agora é sério... a quarta é real...", duration: 90, triggered: false },
    { triggerX: 2100, action: "sound", sfx: "sfx_laugh", triggered: false },
    { triggerX: 2100, action: "message", text: "QUATRO FALSAS! Desiste não!", duration: 120, triggered: false },
    { triggerX: 2500, action: "spawn", entityType: "flying", spawnX: 2700, spawnY: 128, triggered: false },
    { triggerX: 2700, action: "spawn", entityType: "fast_goomba", spawnX: 2900, spawnY: 352, triggered: false },
    { triggerX: 2900, action: "message", text: "Será que essa é real? Hmm...", duration: 90, triggered: false },
  ],
});

// ============================================================
// LEVEL 7: "A Fábrica" — Canhões, Esteiras, Vento e Blocos Pegajosos
// ============================================================
const LEVEL_7 = parseLevel({
  name: "Fase 7",
  subtitle: "A Fábrica",
  bgColor: "#3d1f00",
  music: "medium",
  map: [
    ".....................................................................................................",
    ".....................................................................................................",
    ".....................................................................................................",
    "..............................6.............6..............6.............6..........................",
    "..........C.C.C..................C.C.C..................C.C.C..................C.C.C................",
    ".....................................................................................................",
    "..........B?B..........!..........mmm.B!B......3........mmm.B?B......3.................WW.WW......",
    ".....................................................................................................",
    ".....................................................................................................",
    "..........................mmm.C.C.mmm.......mmm....C.C...mmm.......mmm...........WWWWWWWWWW.......",
    ".....................................................................................................",
    ".............H............mmm.vmmm...QQQH.mmm..mmm.....QQQH.mmm.mmm...H..GGG.GWWWWWWWWWWWWWWWWWW.",
    "..P.....C.C.E.....C.......E.CC.C..E.7770.C.CE...C.C.E.7770.C.C.E.C.C.C..E........F.WWWWWWWWWWWWW.",
    "GGGGG>>>>>>GGGG<<GGGGG>>>>>>GGGG~~GGGGG>>>>GGGG<<GGGGG>>>>GGGG~~GGGGGGGGGGGG..GGGGGGGWWWWWWWWWWWWW",
    "#####>>>>>>####<<#####>>>>>>####..#####>>>>####<<#####>>>>####..##############..#######WWWWWWWWWWWWWW",
  ],
  entities: [],
  trolls: [
    { triggerX: 96, action: "message", text: "Bem-vindo à Fábrica do Caos!", duration: 120, triggered: false },
    { triggerX: 96, action: "sound", sfx: "sfx_boom", triggered: false },
    { triggerX: 480, action: "spawn", entityType: "goomba", spawnX: 700, spawnY: 352, triggered: false },
    { triggerX: 700, action: "message", text: "Esteiras! Tenta andar contra elas!", duration: 90, triggered: false },
    { triggerX: 900, action: "shake", duration: 15, triggered: false },
    { triggerX: 900, action: "spawn", entityType: "fast_goomba", spawnX: 1100, spawnY: 352, triggered: false },
    { triggerX: 1100, action: "message", text: "Cuidado com os canhões! BOOM!", duration: 90, triggered: false },
    { triggerX: 1100, action: "sound", sfx: "sfx_boom", triggered: false },
    { triggerX: 1400, action: "fall_blocks", startX: 1450, count: 5, triggered: false },
    { triggerX: 1400, action: "shake", duration: 25, triggered: false },
    { triggerX: 1600, action: "spawn", entityType: "spiny", spawnX: 1800, spawnY: 352, triggered: false },
    { triggerX: 1800, action: "message", text: "Blocos pegajosos! Pula pra se soltar!", duration: 90, triggered: false },
    { triggerX: 2000, action: "spawn", entityType: "flying", spawnX: 2200, spawnY: 128, triggered: false },
    { triggerX: 2200, action: "spawn", entityType: "fast_goomba", spawnX: 2400, spawnY: 352, triggered: false },
    { triggerX: 2400, action: "message", text: "O vento empurra! Cuidado!", duration: 90, triggered: false },
    { triggerX: 2600, action: "sound", sfx: "sfx_boom", triggered: false },
    { triggerX: 2800, action: "message", text: "Tá quase! A fábrica vai explodir!", duration: 90, triggered: false },
    { triggerX: 2800, action: "shake", duration: 30, triggered: false },
  ],
});

// ============================================================
// LEVEL 8: "Castelo das Sombras" — Labirinto de Canos e Chaves
// ============================================================
const LEVEL_8 = parseLevel({
  name: "Fase 8",
  subtitle: "Castelo das Sombras",
  bgColor: "#2d0a31",
  music: "hard",
  map: [
    "WWWWWWWWWWW[]..........[]WWWWWWWWWWWW[].........[]WWWWWWWWWWWW[]..........[]WWWWWWWWWW[]....[]WWWWWWW.........WWWWWWWW",
    "WWWWW------{}.....C....{}------WWWWW{}.....C....{}.-----WWWWWW{}....C.....{}------WWW{}....{}WW--WWWW..C......WWWWWWWW",
    "WWW--......{}..........{}......--WWW{}..........{}......--WWWW.{}..........{}......-WW{}....{}WW..--WW.........WWWWWWWW",
    "WW-.C......{}..WWWW..b.{}....C..-WW{}..WWWW....{}..C..C.--WW.{}..WWWW.g..{}..C...WW{}CC..{}WW....WW...CCC..WWWWWWWW",
    "W--..E..x..{}..WW--....{}..E.....--{}..WW--..x.{}..E.....--.{}..WW--....{}..E...--{}.E..{}--....--...GGG.GWWWWWWWWW",
    "-.....GGG..{}..--......{}....GGG...[}..--......{}.....GGG....[}..--..z..{}....GGG..{}.GGG{}..........GGG..WWWWWWWWWW",
    "......###..{}..........{}....###...{}..........{}........###..{}..........{}....###..{}####{}...H............WWWWWWWWWW",
    "...........[].....C....[].........[].....C....[]...........[].....C.....[]...........[]..[]..........WWWW..WWWWWWWWWW",
    "...........{}..........[}..........{}..........[}.R.........{}.CCCCCC...[}.C.C.C.....{}.^{}...C....WWWWWWWWWWWWWWWWWWW",
    "##WWWWWW..{}.WWWWWWWW.{}..WWWWWW.{}.WWWWWWWW.{}..WWWWWW..{}.WWWWWW...{}.WWWWWWWW.{}.^{}..GGG..WWWWWWWWWWWWWWWWWWWWW",
    "#CCC.......{}---..===.{}CCC.......{}---..===..{}CCC........{}---..===..{}CCC........{}..{}.GGG.GWWWWWWWWWWWWWWWWWWWWWW",
    "#CCC..H..GG{}......GGG{}CCC.H..GG.{}......GGG{}CCC..H..GG.{}......GGG.{}CCC..H..GG{}..{}........WWWWWWWWWWWWF.WWWWWW",
    ".P.CC..CC..{}..E..C...{}..CC.CC...{}..K.C.C..{}..CC.CC....{}.E..C.....{}..CC.CC...{}..{}....E.....WWWWWWWWWWWW.WWWWWW",
    "GGGGG.GG...{}GGGGGGGGG{}GGGG.GG..{}GGGGGGGG..{}GGGGG.GG..{}GGGGGGGGG.{}GGGGG.GG.{}GG{}.GGGGGGGGGWWWWWWWWWWWWWWWWWWW",
    "#####.##...{}#########{}####.##..{}########..{}#####.##..{}#########.{}#####.##.{}##{}LLLL#######WWWWWWWWWWWWWWWWWWWW",
  ],
  entities: [],
  trolls: [
    { triggerX: 64, action: "message", text: "Bem-vindo ao Castelo das Sombras... encontre as chaves!", duration: 120, triggered: false },
    { triggerX: 416, action: "spawn", entityType: "goomba", spawnX: 616, spawnY: 32, triggered: false },
    { triggerX: 640, action: "fall_blocks", startX: 640, count: 6, triggered: false },
    { triggerX: 640, action: "shake", duration: 20, triggered: false },
    { triggerX: 900, action: "spawn", entityType: "fast_goomba", spawnX: 1100, spawnY: 320, triggered: false },
    { triggerX: 1200, action: "message", text: "As chaves abrem os caminhos... se achar!", duration: 90, triggered: false },
    { triggerX: 1500, action: "spawn", entityType: "spiny", spawnX: 1700, spawnY: 352, triggered: false },
    { triggerX: 1500, action: "shake", duration: 15, triggered: false },
    { triggerX: 1800, action: "spawn", entityType: "flying", spawnX: 2000, spawnY: 128, triggered: false },
    { triggerX: 2000, action: "message", text: "Blocos invisíveis podem ajudar... ou não!", duration: 90, triggered: false },
    { triggerX: 2000, action: "sound", sfx: "sfx_laugh", triggered: false },
    { triggerX: 2300, action: "fall_blocks", startX: 2350, count: 5, triggered: false },
    { triggerX: 2300, action: "shake", duration: 25, triggered: false },
    { triggerX: 2500, action: "spawn", entityType: "fast_goomba", spawnX: 2700, spawnY: 320, triggered: false },
    { triggerX: 2700, action: "message", text: "O castelo está tremendo...", duration: 60, triggered: false },
    { triggerX: 2700, action: "shake", duration: 30, triggered: false },
    { triggerX: 2900, action: "spawn", entityType: "spiny", spawnX: 3100, spawnY: 352, triggered: false },
    { triggerX: 3100, action: "message", text: "A saída está perto... confia!", duration: 90, triggered: false },
    { triggerX: 3300, action: "spawn", entityType: "flying", spawnX: 3400, spawnY: 160, triggered: false },
    { triggerX: 3300, action: "sound", sfx: "sfx_scream", triggered: false },
  ],
});

// ============================================================
// LEVEL 9: "Sem Piedade" — Todas as Mecânicas, Sem Misericórdia
// ============================================================
const LEVEL_9 = parseLevel({
  name: "Fase 9",
  subtitle: "Sem Piedade",
  bgColor: "#0a0a1a",
  music: "hard",
  map: [
    "...............................................................................................................",
    "^^.............^^...........^^................^^..............^^...........^^.............^^....................",
    "##.............##...........##................##..............##...........##.............##....................",
    "...............................................................................................................",
    "..........C.C.C..T.T...............C.C.C..T.T.T..........C.C.C..T.T..........C.C.C...........................",
    "...............................................................................................................",
    ".........B?B..........!.M......B!B.B?B..........3.......B?B.M..........!..............WW.WW..................",
    "...............................................................................................................",
    "...............................................................................................................",
    "........6....GGG...Z.........6...GGG.....Y.......6..GGG....Z........6...GGG.......WWWWWWWWWW................",
    "...............................................................................................................",
    "...........H...........GGGvGGG.....GGG...H...GGGvGGG..wwwwwGGG..H...GGG...GGG.GWWWWWWWWWWWWWWWW.............",
    "..P....CCC.E.....Z...........E.CC.C.E.......K.E.C.C.Y.wwwww.E.CC.C.E...K....C.C..F.WWWWWWWWWWWWWWWWW........",
    "GGGGIIIIII>>GG<<IIIIII~~GGGSJGGG~~IIIIII>>GG<<IIIvII..GGGSJGG~~IIIIII>>GG<<IIIGGGGGGWWWWWWWWWWWWWWWWW......",
    "####IIIIII>>##<<IIIIII..###S####..IIIIII>>##<<III^II..####S###..IIIIII>>##<<III######WWWWWWWWWWWWWWWWWWW.....",
  ],
  entities: [],
  trolls: [
    { triggerX: 96, action: "message", text: "Sem piedade. Boa sorte. Vai precisar.", duration: 120, triggered: false },
    { triggerX: 96, action: "sound", sfx: "sfx_drama", triggered: false },
    { triggerX: 400, action: "gravity_flip", flipDuration: 150, triggered: false },
    { triggerX: 400, action: "message", text: "GRAVIDADE! Cuidado com o teto!", duration: 60, triggered: false },
    { triggerX: 400, action: "spawn", entityType: "flying", spawnX: 600, spawnY: 128, triggered: false },
    { triggerX: 700, action: "fall_blocks", startX: 750, count: 5, triggered: false },
    { triggerX: 700, action: "shake", duration: 20, triggered: false },
    { triggerX: 900, action: "spawn", entityType: "fast_goomba", spawnX: 1100, spawnY: 352, triggered: false },
    { triggerX: 900, action: "sound", sfx: "sfx_laugh", triggered: false },
    { triggerX: 1100, action: "spawn", entityType: "spiny", spawnX: 1300, spawnY: 352, triggered: false },
    { triggerX: 1300, action: "gravity_flip", flipDuration: 120, triggered: false },
    { triggerX: 1300, action: "message", text: "DE NOVO?! HAHAHA!", duration: 60, triggered: false },
    { triggerX: 1300, action: "sound", sfx: "sfx_laugh", triggered: false },
    { triggerX: 1500, action: "fall_blocks", startX: 1550, count: 6, triggered: false },
    { triggerX: 1500, action: "shake", duration: 25, triggered: false },
    { triggerX: 1700, action: "spawn", entityType: "fast_goomba", spawnX: 1900, spawnY: 352, triggered: false },
    { triggerX: 1700, action: "spawn", entityType: "flying", spawnX: 1950, spawnY: 96, triggered: false },
    { triggerX: 2000, action: "message", text: "Você ainda tá vivo?! COMO?!", duration: 90, triggered: false },
    { triggerX: 2000, action: "sound", sfx: "sfx_scream", triggered: false },
    { triggerX: 2200, action: "spawn", entityType: "spiny", spawnX: 2400, spawnY: 352, triggered: false },
    { triggerX: 2200, action: "spawn", entityType: "fast_goomba", spawnX: 2450, spawnY: 352, triggered: false },
    { triggerX: 2500, action: "fall_blocks", startX: 2550, count: 4, triggered: false },
    { triggerX: 2500, action: "shake", duration: 20, triggered: false },
    { triggerX: 2700, action: "spawn", entityType: "flying", spawnX: 2850, spawnY: 128, triggered: false },
    { triggerX: 2800, action: "message", text: "Desiste. Sério. Desiste.", duration: 60, triggered: false },
  ],
});

// ============================================================
// LEVEL 10: "O Arquiteto Final" — A Provação Definitiva
// ============================================================
const LEVEL_10 = parseLevel({
  name: "Fase 10",
  subtitle: "O Arquiteto Final",
  bgColor: "#0d0d0d",
  music: "hard",
  map: [
    "WWWWWWWWWWWWWW[]...........[]WWWWWWWWWWWWWWWW[]..........[]WWWWWWWWWWWWW[]..........[]WWWWWWWWWWW[]..........[]WWWWWWWWWW..................",
    "WWWWWW--------{}.....C.....{}--------WWWWWWWW{}.....C....{}---------WWWWW{}.....C....{}--------WW{}.....C....{}----WWWWWW.C...C..C..........",
    "WWWW--........{}.C.....C...{}..........------{}.C......C..{}..........---..{}.C......C.{}.........{}C........C.{}......--WW..t..........t.....",
    "WW--....C.....{}.....E.....{}......C.........{}.....E....{}........C.....{}.....E....{}....C....{}.....E....{}........-WW.................CCC",
    "W-..E.......Z.{}..GWWWWWWWG{}..E.......Z.....{}.GWWWWWWG.{}..E......Z....{}.GWWWWWWG.{}..E..Z..{}.GWWWWWWG.{}..........WW.........GGG.CCC..",
    "...........GGG{}..GWW----WG.{}.........GGG....{}..GWW--WG.{}...H...GGG...{}..GWW--WG.{}...GGG..{}.GWW--WG..{}...H......--...GGG..GGG.CCC..",
    "...........###{}..GW-....WG.{}.........###....{}.GW-..WG..{}.......###....{}.GW-..WG..{}.v.###..{}.GW-..WG..{}...........WW.GGGGGGGGG.C.C..",
    "...............[].GW.C.C.WG.[]...............[].GW.C.C.WG.[]...............[].GW.C.C.WG.[].......[]GW.C.C.WG.[]...........WW................",
    "C........C....{}.GW..K..WG..{}.C...C..C.....{}.GW.....WG.{}.C...C..C....{}.GW..R..WG.{}.C.C.C..{}GW.....WG{}.....C...WWWW................",
    "..GGG.........{}.GWWWWWWWG..{}.........GGG...{}.GWWWWWWG..{}.........GGG..{}.GWWWWWWG..{}...GGG..{}GWWWWWWG.{}.GGG.....WWWWWW..............",
    "#CCC..E.....Y.{}----..====={}CCC..E....Y....{}---..====..{}CCC..E....Y...{}---..====.{}.....Y..{}---..===.{}.GGG..GWWWWWWWWWW..............",
    "#CCC..H..GGGGG{}......GGGGG{}CCC.H..GGGGG...{}.....GGGGG.{}CCC.H..GGGGG..{}.....GGGGG{}..H.GGG.{}......GGG{}..........WWWWWWWWWWF.WWWWWWW.",
    ".P.CC.CC.E..CC{}..K..C..CC.{}CC.CC.E..CC....{}K..C..CC..{}CC.CC.E..CC...{}.K..C.CC..{}.C.C.C.E{}..E.C....{}.....E.......WWWWWWWWWWW.WWWWW.",
    "GGGGG.GGJ..GGG{}GGGGGGGGGGG{}GGGG.GGJ..GG..{}GGGGGGGGGG{}GGGGG.GGJ..GG.{}GGGGGGGGGG{}GGGGGGG.{}GGGGGGG.{}.GGGGGGGGGGGGWWWWWWWWWWWWWWWWWWW",
    "####..##S..####{}###########{}####.##S..##..{}##########{}#####.##S..##.{}##########{}#######.{}#######.{}LLLL##########WWWWWWWWWWWWWWWWWWW",
  ],
  entities: [],
  trolls: [
    { triggerX: 64, action: "message", text: "A provação final. O Arquiteto te observa.", duration: 120, triggered: false },
    { triggerX: 64, action: "sound", sfx: "sfx_drama", triggered: false },
    { triggerX: 416, action: "spawn", entityType: "goomba", spawnX: 616, spawnY: 32, triggered: false },
    { triggerX: 640, action: "fall_blocks", startX: 640, count: 8, triggered: false },
    { triggerX: 640, action: "shake", duration: 25, triggered: false },
    { triggerX: 900, action: "spawn", entityType: "fast_goomba", spawnX: 1100, spawnY: 320, triggered: false },
    { triggerX: 1100, action: "message", text: "Checkpoint? Não se anime tanto...", duration: 90, triggered: false },
    { triggerX: 1300, action: "spawn", entityType: "flying", spawnX: 1500, spawnY: 128, triggered: false },
    { triggerX: 1300, action: "spawn", entityType: "spiny", spawnX: 1550, spawnY: 352, triggered: false },
    { triggerX: 1500, action: "gravity_flip", flipDuration: 180, triggered: false },
    { triggerX: 1500, action: "message", text: "GRAVIDADE! Cola no teto!", duration: 60, triggered: false },
    { triggerX: 1500, action: "sound", sfx: "sfx_laugh", triggered: false },
    { triggerX: 1800, action: "fall_blocks", startX: 1850, count: 6, triggered: false },
    { triggerX: 1800, action: "shake", duration: 20, triggered: false },
    { triggerX: 2000, action: "spawn", entityType: "fast_goomba", spawnX: 2200, spawnY: 128, triggered: false },
    { triggerX: 2000, action: "spawn", entityType: "fast_goomba", spawnX: 2250, spawnY: 352, triggered: false },
    { triggerX: 2200, action: "message", text: "Você ainda está vivo? Impressionante!", duration: 90, triggered: false },
    { triggerX: 2400, action: "spawn", entityType: "spiny", spawnX: 2600, spawnY: 352, triggered: false },
    { triggerX: 2400, action: "spawn", entityType: "flying", spawnX: 2650, spawnY: 128, triggered: false },
    { triggerX: 2600, action: "fall_blocks", startX: 2650, count: 5, triggered: false },
    { triggerX: 2600, action: "shake", duration: 15, triggered: false },
    { triggerX: 2800, action: "spawn", entityType: "fast_goomba", spawnX: 3000, spawnY: 320, triggered: false },
    { triggerX: 3000, action: "message", text: "A bandeira... será que é de verdade?", duration: 90, triggered: false },
    { triggerX: 3000, action: "sound", sfx: "sfx_scream", triggered: false },
    { triggerX: 3200, action: "spawn_powerup", powerUpType: "star", spawnX: 3300, spawnY: 288, triggered: false },
    { triggerX: 3200, action: "message", text: "Uma estrela! Corre! CORRE!", duration: 60, triggered: false },
    { triggerX: 3400, action: "spawn", entityType: "fast_goomba", spawnX: 3550, spawnY: 352, triggered: false },
    { triggerX: 3400, action: "spawn", entityType: "flying", spawnX: 3600, spawnY: 128, triggered: false },
    { triggerX: 3400, action: "spawn", entityType: "spiny", spawnX: 3650, spawnY: 352, triggered: false },
    { triggerX: 3600, action: "message", text: "O Arquiteto ri da sua dor... hahaha!", duration: 60, triggered: false },
    { triggerX: 3600, action: "sound", sfx: "sfx_laugh", triggered: false },
    { triggerX: 3800, action: "shake", duration: 30, triggered: false },
    { triggerX: 3800, action: "fall_blocks", startX: 3850, count: 6, triggered: false },
    { triggerX: 3800, action: "message", text: "Será que é a verdadeira dessa vez?!", duration: 90, triggered: false },
  ],
});

/** All campaign levels in order */
export const CAMPAIGN_LEVELS: ParsedLevel[] = [
  LEVEL_0, LEVEL_1, LEVEL_2, LEVEL_3, LEVEL_4, LEVEL_5,
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
