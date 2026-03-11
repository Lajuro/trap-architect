// ============================================================
// CAT MARIO - LEVEL DATA
// 3 levels with troll traps, enemies, and secrets
// ============================================================

// Tile type constants
const T = {
  AIR: 0,
  GROUND_TOP: 1,    // Green grass top
  GROUND: 2,        // Brown dirt
  BRICK: 3,         // Breakable brick
  QUESTION: 4,      // ? block (gives coin)
  SPIKE: 5,         // Visible spike
  HIDDEN_SPIKE: 6,  // Looks like ground, has lethal spike
  FAKE_GROUND: 7,   // Crumbles when stepped on
  INVISIBLE: 8,     // Invisible solid block
  PIPE_TL: 9,
  PIPE_TR: 10,
  PIPE_BL: 11,
  PIPE_BR: 12,
  LAVA: 13,
  TROLL_Q: 14,      // ? block that spawns enemy
  USED: 15,         // Used ? block
  CASTLE: 16,
  SPRING: 17,
  CLOUD: 18,        // Decorative cloud (non-solid)
  PLATFORM: 19,     // One-way platform (solid from above)
  ICE: 20,          // Slippery surface
  CONVEYOR_L: 21,   // Conveyor belt left
  CONVEYOR_R: 22,   // Conveyor belt right
  CHECKPOINT: 23,   // Respawn point
  TRAMPOLINE: 24,   // Super bounce
};

// Solid tiles (block movement)
const SOLID_TILES = new Set([
  T.GROUND_TOP, T.GROUND, T.BRICK, T.QUESTION, T.INVISIBLE,
  T.PIPE_TL, T.PIPE_TR, T.PIPE_BL, T.PIPE_BR,
  T.TROLL_Q, T.USED, T.CASTLE, T.ICE,
  T.CONVEYOR_L, T.CONVEYOR_R, T.SPRING, T.TRAMPOLINE
]);

// One-way platform tiles (solid only from above)
const ONEWAY_TILES = new Set([T.PLATFORM]);

// Lethal tiles
const LETHAL_TILES = new Set([T.SPIKE, T.LAVA, T.HIDDEN_SPIKE]);

// Character to tile mapping for level parsing
const CHAR_MAP = {
  '.': T.AIR,
  'G': T.GROUND_TOP,
  '#': T.GROUND,
  'B': T.BRICK,
  '?': T.QUESTION,
  '!': T.TROLL_Q,
  '^': T.SPIKE,
  'v': T.HIDDEN_SPIKE,
  '~': T.FAKE_GROUND,
  '=': T.INVISIBLE,
  '[': T.PIPE_TL,
  ']': T.PIPE_TR,
  '{': T.PIPE_BL,
  '}': T.PIPE_BR,
  'L': T.LAVA,
  'S': T.SPRING,
  'W': T.CASTLE,
  'U': T.USED,
  'c': T.CLOUD,
  '-': T.PLATFORM,
  'I': T.ICE,
  '<': T.CONVEYOR_L,
  '>': T.CONVEYOR_R,
  'H': T.CHECKPOINT,
  'J': T.TRAMPOLINE,
};

// Reverse map: tile constant -> character (for export)
const REVERSE_CHAR_MAP = {};
for (const [ch, tileId] of Object.entries(CHAR_MAP)) {
  REVERSE_CHAR_MAP[tileId] = ch;
}

// Parse a string-based level map into structured level data
function parseLevel(config) {
  const map = config.map;
  const tiles = [];
  const entities = config.entities ? [...config.entities] : [];
  let playerStart = { x: 96, y: 384 };

  const height = map.length;
  const width = Math.max(...map.map(r => r.length));

  for (let y = 0; y < height; y++) {
    tiles[y] = [];
    for (let x = 0; x < width; x++) {
      const ch = (map[y] && map[y][x]) || '.';

      if (ch === 'P') {
        tiles[y][x] = T.AIR;
        playerStart = { x: x * 32, y: y * 32 };
      } else if (ch === 'C') {
        tiles[y][x] = T.AIR;
        entities.push({ type: 'coin', x: x * 32 + 8, y: y * 32 + 4 });
      } else if (ch === 'F') {
        tiles[y][x] = T.AIR;
        entities.push({ type: 'flag', x: x * 32, y: y * 32 });
      } else if (ch === 'X') {
        tiles[y][x] = T.AIR;
        entities.push({ type: 'fake_flag', x: x * 32, y: y * 32 });
      } else if (ch === 'E') {
        tiles[y][x] = T.AIR;
        entities.push({ type: 'goomba', x: x * 32, y: y * 32 });
      } else if (ch === 'K') {
        tiles[y][x] = T.AIR;
        entities.push({ type: 'spiny', x: x * 32, y: y * 32 });
      } else if (ch === 'R') {
        tiles[y][x] = T.AIR;
        entities.push({ type: 'flying', x: x * 32, y: y * 32 });
      } else {
        tiles[y][x] = CHAR_MAP[ch] !== undefined ? CHAR_MAP[ch] : T.AIR;
      }
    }
  }

  return {
    name: config.name,
    subtitle: config.subtitle,
    tiles,
    width,
    height,
    entities,
    trolls: config.trolls || [],
    playerStart,
    bgColor: config.bgColor || '#5c94fc',
    music: config.music || 'level1',
  };
}

// ============================================================
// LEVEL 0: "Meu Nível"
// Dark castle level - the first gauntlet
// ============================================================
const LEVEL_0 = parseLevel({
  name: 'Meu Nível',
  subtitle: 'O Castelo Sombrio',
  bgColor: '#2d0a31',
  music: 'level3',
  map: [
    '###############WW.........WWW....WWWWWWWWWWWWWWWWWWWW...................WWW......WWWWWWWWWWWWWWWWWWWWWWWWWWW...C.......W......',  // 0
    '.............CCW-.........WW-....WWWWW--------WWWWWWC..R..C..C..........---......--WWWWWWWWWWWWWWWWWWWWWWWWW...-..C....W......',  // 1
    '..........C..CCW...WWWWWWWWWC....WWWW-.C.R.C..--WWWWC.....-GG-....C................WWWWWWWWWWWWWWWWWWWWWWWWW...===-....W......',  // 2
    '.......R.C...GGW...WWW--WWWWW....WW--...C.C.....--WWGv-....##.....C......H...CCC...--WWWWWWWWWWWW--------WWW...W====.C=W......',  // 3
    '........C....##W..BWW-..--WW-....CC...............-W##...C.##.....[....-WWW-----.....---WWWWWW---.......C-WW...W===..--W......',  // 4
    '.P.CC..CC....##W.B.--..R..--....................[..-.....-G##...C.[..K..WWW...=.........------......R...CCWW...W==.C..=W......',  // 5
    'GGGGG.GGC....##WJ..........CC..J.......H.......E[....E.[..###...-~~GGGBBWWWC..=.....CCCCCCCCCCCCCCC....---WW.F.W==.-R..W......',  // 6
    '#####.##J....##WW..CC.....---..--WW---WWWWWGG~~GGWWGGGG[..###.....####..WWWCC.=.R..>>>>>><<>>>>>>>>.......WWWWWW==..-..W......',  // 7
    '####..C#GG~BB#WWBBBWWBBW.........CCCCCCCWWW##..##WWW###[..###.....####K.WWWCC.=....W##############W.......WWWWWWBB....CW......',  // 8
    '###....C##....W-.................CCCCCCCWWWW#..#WWWWWW#[..###.....####-.WWWCC.=...CW##############W....W..---WWW...=..-W......',  // 9
    '#CCC.......C......CCC..K........WWWWWWCCWWWWW..WWWWWWW#[...##......###..WWWCC.J...CWWW##########WWW.E.^W.....-WW...=..KW......',  // 10
    '#CCC...H...GGWWWWWWWWG~W>>>>.......CCCCC-----..-----WWW[...##....CCCCC.-#WWGGGG...CWWWWWWWWWWWWWWWWWWWWWCC....-WWBBBBBBW......',  // 11
    '#CCC..vG--.##WWWWWWWW..WWWWW.......CCCCC............-WW[...##...CCCCCC..#WW####....WWWWWWWWWWWWWWWWWWWWWWW.....--.....WW......',  // 12
    '#GGG..##LLL#WWWWWWWWWLLWWW.........--WWWWWWWWWLLLLLLLWW[...##...GGGGGGGG##W####^^^^WWWWWWWWWWWWWWWWWWWWW....E.E......WWW......',  // 13
    '####..######WWWWWWWWWWWWWLLLLLLLLLLLLWWWWWWWWWWLLLLLLWW[...##.....########W########WWWWWWWWWWWWWWWWWWWWWWWWWW-WWWWWWWWWW......',  // 14
  ],
  entities: [],
  trolls: [
    // Welcome message
    { triggerX: 64, action: 'message', text: 'Bem-vindo ao Castelo Sombrio... cuidado!', duration: 120, triggered: false },
    // Goomba drops from the sky near first coins
    { triggerX: 416, action: 'spawn', entityType: 'goomba', spawnX: 616, spawnY: 32, triggered: false },
    // Falling blocks at castle entrance
    { triggerX: 640, action: 'fall_blocks', startX: 640, count: 9, triggered: false },
    // Screen shake entering castle
    { triggerX: 640, action: 'shake', duration: 20, triggered: false },
    // Goomba ambush inside first castle corridor
    { triggerX: 800, action: 'spawn', entityType: 'goomba', spawnX: 1000, spawnY: 32, triggered: false },
    // Troll message at first checkpoint
    { triggerX: 1248, action: 'message', text: 'Checkpoint? Não se anime tanto...', duration: 90, triggered: false },
    // Fast goomba surprise mid-level
    { triggerX: 1500, action: 'spawn', entityType: 'fast_goomba', spawnX: 1700, spawnY: 32, triggered: false },
    // Falling blocks in lava section
    { triggerX: 1800, action: 'fall_blocks', startX: 1850, count: 6, triggered: false },
    // Screen shake + enemy combo
    { triggerX: 2100, action: 'shake', duration: 25, triggered: false },
    { triggerX: 2100, action: 'spawn', entityType: 'spiny', spawnX: 2300, spawnY: 320, triggered: false },
    { triggerX: 2100, action: 'spawn', entityType: 'flying', spawnX: 2400, spawnY: 128, triggered: false },
    // Mid-level troll
    { triggerX: 2400, action: 'message', text: 'Você ainda está vivo? Impressionante!', duration: 90, triggered: false },
    // Conveyor section chaos
    { triggerX: 2600, action: 'spawn', entityType: 'fast_goomba', spawnX: 2800, spawnY: 128, triggered: false },
    { triggerX: 2600, action: 'spawn', entityType: 'fast_goomba', spawnX: 2850, spawnY: 320, triggered: false },
    // Approaching flag chaos
    { triggerX: 3000, action: 'fall_blocks', startX: 3050, count: 5, triggered: false },
    { triggerX: 3000, action: 'shake', duration: 15, triggered: false },
    // Final troll near flag
    { triggerX: 3300, action: 'message', text: 'A bandeira! Será que é de verdade?', duration: 90, triggered: false },
    // Last ambush right before flag
    { triggerX: 3400, action: 'spawn', entityType: 'flying', spawnX: 3500, spawnY: 160, triggered: false },
    { triggerX: 3400, action: 'spawn', entityType: 'spiny', spawnX: 3500, spawnY: 320, triggered: false },
  ]
});

// ============================================================
// LEVEL 1: "Parece Fácil"
// Introduces troll mechanics gently
// ============================================================
const LEVEL_1 = parseLevel({
  name: 'Fase 1',
  subtitle: 'Parece Fácil, Né?',
  bgColor: '#5c94fc',
  music: 'level1',
  map: [
    //0         1         2         3         4         5         6         7         8         9
    //0123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789
    '......................................................................................................',  // 0
    '......................................................................................................',  // 1
    '......................................................................................................',  // 2
    '......................................................................................................',  // 3
    '......................................................................................................',  // 4
    '..........C.C.C...........C..................................................C.C.C....................',  // 5
    '......................................................................................................',  // 6
    '..........?...............!.......................BB?BB...............................X.........W.WW..',  // 7
    '........................................................................................W...W.WWWWW..',  // 8
    '..............................................BBB.......................[]............W..WW.WWWWWWW..',  // 9
    '..................................................................[].{}............WWWWWWWWWWWWWW..',  // 10
    '..............................=.......[]...........................[].{}....F......WWWWWWWWWWWWWWW..',  // 11
    '..P.........C...............=......[].{}...[].....~~GGG.....E....[].{}..E........WWWWWWWWWWWWWWWW..',  // 12
    'GGGGGGGGGGGGGGGGGGG...GGGvGGGGG..GGG{}GGGGG{}GGG..^^GGGG..GGGGGG{}GGGGGGG...GGGGGGGGGGGGGGGGGGGGG',  // 13
    '###################...####^####..###{}#####{}###..^^####..######{}#######...#######################',  // 14
  ],
  entities: [],
  trolls: [
    // When player reaches X=540, a goomba falls from the sky near the ! block
    { triggerX: 540, action: 'spawn', entityType: 'goomba', spawnX: 800, spawnY: 32, triggered: false },
    // When player reaches the crumble section, screen shakes
    { triggerX: 1700, action: 'shake', duration: 15, triggered: false },
    // When near fake flag area, message appears
    { triggerX: 2200, action: 'message', text: 'Hmm... aquela bandeira parece estranha...', duration: 120, triggered: false },
    // Speed goomba near the end
    { triggerX: 2500, action: 'spawn', entityType: 'fast_goomba', spawnX: 2700, spawnY: 352, triggered: false },
  ]
});

// ============================================================
// LEVEL 2: "Confia no Pai"
// More devious traps, fake paths, crumbling everything
// ============================================================
const LEVEL_2 = parseLevel({
  name: 'Fase 2',
  subtitle: 'Confia no Pai',
  bgColor: '#1a1a2e',
  music: 'level2',
  map: [
    //0         1         2         3         4         5         6         7         8         9         10
    //0123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345
    '..............................................................................................................', // 0
    '..............................................................................................................', // 1
    '..............................................................................................................', // 2
    '..............................................................................................................', // 3
    '...........C.C.C.C.....C.C.C.................................................................................', // 4
    '..................................................?...........................................................', // 5
    '..........BBBB...........!...BBB.........................................X................................', // 6
    '....................................BB...................BB.................................................', // 7
    '.............................................BB......[]...............[]..................................', // 8
    '..........................BBB........BB...........BB.{}............BB.{}..................................', // 9
    '......................................BB........BB...{}..........BB...{}..................................', // 10
    '...........C.C.C.C.....C.C.C..........E........E.....{}......E........{}..E....F.WWWW.WWWWWWWWWWWWW........', // 11
    '..P....GGG..GGG..~~GG..GGG..GGG..GG..GGG..GGGGGGGGGGG{}GGG..GGGGG..GGG{}GGGGGGGGG..GWWWWWWWWWWWWWWWWWW....', // 12
    'GGGGG^^###..###..^^##..###..###..##..###..###########{}###..#####..###{}#########..GWWWWWWWWWWWWWWWWWWW...', // 13
    '#####^^###..###..^^##..###..###..##..###..###########{}###..#####..###{}#########..#WWWWWWWWWWWWWWWWWWWW..', // 14
  ],
  entities: [],
  trolls: [
    // Coins lead over fake ground trap
    { triggerX: 300, action: 'message', text: 'Pega as moedas! Ou será que não...', duration: 90, triggered: false },
    // Spawn flying enemy when mid-level
    { triggerX: 700, action: 'spawn', entityType: 'flying', spawnX: 900, spawnY: 128, triggered: false },
    // Blocks fall from ceiling
    { triggerX: 1000, action: 'fall_blocks', startX: 1050, count: 4, triggered: false },
    // Troll message before the end
    { triggerX: 1800, action: 'message', text: 'Quase lá! Ou não...', duration: 90, triggered: false },
    // Fast enemies chase near end
    { triggerX: 2100, action: 'spawn', entityType: 'fast_goomba', spawnX: 2200, spawnY: 352, triggered: false },
    { triggerX: 2100, action: 'spawn', entityType: 'fast_goomba', spawnX: 2250, spawnY: 352, triggered: false },
  ]
});

// ============================================================
// LEVEL 3: "Fase 3 Difícil"
// Maximum trolling - claustrophobic castle gauntlet
// ============================================================
const LEVEL_3 = parseLevel({
  name: 'Fase 3 Difícil',
  subtitle: 'Desista de Uma Vez!',
  bgColor: '#2d0a31',
  music: 'level3',
  map: [
    '###############[......[##############################[.......BBBB..........[#########[=.[###[.....[WWWWWWWWW[[[[[[[WWWWWWWWWWW',  // 0
    '##########[[[[[.......[[###[[[[[[[########[[[[[[#####[........BBB...........[########[=.[###[CC....[[WWW[[[[=[....[WWWW.W.WWWW',  // 1
    '########[[..............[[[..===..[####[[[......[####[..C.C....BB.CC...^.....[[[[####[=.[###[CC.....=[[[...==[.....[[WW.W.WWWW',  // 2
    '######[[.....................===...[[[[..........[[[[...C.C....CBJBB...[.........[###[=.[###[BB-....=..R...==[.......[W.W.WWWW',  // 3
    '#####[....C..................===.C..........C...........C.C....C.B.....[CCCCCCCC..[[[.=.[###[.......=......==[........WWWWWWWW',  // 4
    '###[[....!...................===...........C.C.........BB?BB...C....-..[>>>>>>>>......=.[###[C..-...=.C=C.C=..........WWWWWWWW',  // 5
    '[[[...........................=...........C...C...............C....^...[..............=.[###[C....^.=.-=-.-=C.........W.W.WWWW',  // 6
    '..............................=...!....BBB..^^.C...................B...[.......CCCCCCC=.[###[CC...[.B....C.=C.........W.W.WWWW',  // 7
    '..........CCC.....CCCC....CC................##.C..........[[[......B...[CHC....<<<<<<<=.[###[BB-..[.BB...C.=C^.-......W.W.WWWW',  // 8
    '..........GGG.....~~GG....GG..C..GGG........##.C.GGG.....[===[.....BBB-[GGG-.....BBBBB=C[[[[[.....[.!....C.=C[........WWWWWWWW',  // 9
    'C..........................#..[............C##.C.........CC.CC.....BBB.[...............C..........[....B....C[........WWWWWWWW',  // 10
    'C.........E.CC........C.E.C#..[..K^.C.E...CC##....E..CC..[C^[[.ECC.....[E......E.....K...E....>><<[....B....J[.....F..W.W.WWWW',  // 11
    '...P....GGGGGG........GGGGG#..GGGGGGGG...GGv##GGGGGGG~~GGGGGGGGG~~GGGGG[>>..<>>..<>>>>>>>>..<>####[GG....~GGGG..GGGGGGW.W.WWWW',  // 12
    '..GGGG..######........######..########^^^############..#########..#####[##..###..#########..######[#......####..######W.W.WWWW',  // 13
    '^^####..######^^^^^^^^######^^######################LLLL#######LLLL####[##^^###^^#########^^######[#^^^^^^####^^######WWWWWWWW',  // 14
  ],
  entities: [],
  trolls: [
    // Troll welcome
    { triggerX: 100, action: 'message', text: 'Última fase... boa sorte! Vai precisar.', duration: 120, triggered: false },
    // Early goomba drop to keep players on edge
    { triggerX: 300, action: 'spawn', entityType: 'goomba', spawnX: 450, spawnY: 32, triggered: false },
    // Falling blocks section
    { triggerX: 500, action: 'fall_blocks', startX: 550, count: 5, triggered: false },
    // Screen shake zone
    { triggerX: 800, action: 'shake', duration: 30, triggered: false },
    // Troll hint before spike trap
    { triggerX: 900, action: 'message', text: 'O chão parece seguro... parece.', duration: 90, triggered: false },
    // Spawn multiple enemies
    { triggerX: 1000, action: 'spawn', entityType: 'fast_goomba', spawnX: 1200, spawnY: 128, triggered: false },
    { triggerX: 1000, action: 'spawn', entityType: 'spiny', spawnX: 1250, spawnY: 352, triggered: false },
    // Mid-section falling bricks
    { triggerX: 1300, action: 'fall_blocks', startX: 1350, count: 4, triggered: false },
    { triggerX: 1300, action: 'shake', duration: 15, triggered: false },
    // Fake congratulations
    { triggerX: 1600, action: 'message', text: 'PARABÉNS! Você venc... brincadeira!', duration: 90, triggered: false },
    // Flying enemy ambush at conveyor section
    { triggerX: 1800, action: 'spawn', entityType: 'flying', spawnX: 2000, spawnY: 96, triggered: false },
    // More chaos
    { triggerX: 2000, action: 'fall_blocks', startX: 2050, count: 6, triggered: false },
    { triggerX: 2000, action: 'shake', duration: 20, triggered: false },
    // Troll at checkpoint
    { triggerX: 2200, action: 'message', text: 'Checkpoint! Ou será uma armadilha?', duration: 90, triggered: false },
    // Spawn chaos near invisible blocks section
    { triggerX: 2500, action: 'spawn', entityType: 'fast_goomba', spawnX: 2650, spawnY: 128, triggered: false },
    { triggerX: 2500, action: 'spawn', entityType: 'spiny', spawnX: 2700, spawnY: 320, triggered: false },
    // Final enemies approaching castle
    { triggerX: 2800, action: 'spawn', entityType: 'fast_goomba', spawnX: 3000, spawnY: 352, triggered: false },
    { triggerX: 2800, action: 'spawn', entityType: 'spiny', spawnX: 3050, spawnY: 352, triggered: false },
    { triggerX: 2800, action: 'spawn', entityType: 'flying', spawnX: 3100, spawnY: 192, triggered: false },
    // Screen shake entering final castle
    { triggerX: 3000, action: 'shake', duration: 20, triggered: false },
    // Troll ending message
    { triggerX: 3200, action: 'message', text: 'Será que é de verdade dessa vez?', duration: 90, triggered: false },
    // One last surprise before the flag
    { triggerX: 3500, action: 'spawn', entityType: 'fast_goomba', spawnX: 3600, spawnY: 320, triggered: false },
    { triggerX: 3500, action: 'spawn', entityType: 'flying', spawnX: 3650, spawnY: 128, triggered: false },
    { triggerX: 3500, action: 'message', text: 'Quase lá... ou não!', duration: 60, triggered: false },
  ]
});

// Final levels array
const LEVELS = [LEVEL_0, LEVEL_1, LEVEL_2, LEVEL_3];

// Build a playable level from editor data
function buildLevelFromEditor(ed) {
  const tiles = ed.tiles.map(r => [...r]);
  const entities = [];
  let hasFlag = false;

  for (const e of ed.entities) {
    const px = e.gx * 32;
    const py = e.gy * 32;
    if (e.type === 'coin') {
      entities.push({ type: 'coin', x: px + 8, y: py + 4 });
    } else if (e.type === 'flag') {
      entities.push({ type: 'flag', x: px, y: py - 4 * 32 });
      hasFlag = true;
    } else if (e.type === 'fake_flag') {
      entities.push({ type: 'fake_flag', x: px, y: py - 4 * 32 });
    } else {
      entities.push({ type: e.type, x: px, y: py });
    }
  }

  if (!hasFlag) return null;

  return {
    name: ed.levelName || 'Custom',
    subtitle: 'N\u00edvel Customizado',
    tiles,
    width: ed.gridW,
    height: ed.gridH,
    entities,
    trolls: ed.trolls ? ed.trolls.map(t => ({ ...t, triggered: false })) : [],
    playerStart: { x: ed.playerStart.x * 32, y: ed.playerStart.y * 32 },
    bgColor: ed.bgColor || '#5c94fc',
    music: ed.music || 'level1',
  };
}
