// ============================================================
// TRAP ARCHITECT - GAME ENGINE
// Complete game: rendering, physics, UI, HUD, entities, trolls
// ============================================================

// ===== CONSTANTS =====
const TILE = 32;
const CW = 800;  // Canvas width
const CH = 480;  // Canvas height
const EDITOR_CANVAS_H = 600; // Expanded canvas height for editor
const GRAVITY = 0.45;
const JUMP_FORCE = -10;
const PLAYER_SPEED = 3.2;
const MAX_FALL = 11;
const PLAYER_W = 22;
const PLAYER_H = 28;

const STATES = {
  INTRO: 'intro',
  MENU: 'menu',
  PLAYING: 'playing',
  DEATH: 'death',
  LEVEL_COMPLETE: 'levelComplete',
  GAME_OVER: 'gameOver',
  STATS: 'stats',
  CONFIG: 'config',
  VICTORY: 'victory',
  PAUSED: 'paused',
  EDITOR: 'editor',
  CUSTOM_LEVELS: 'customLevels',
  LOGIN: 'login',
  NICKNAME_SETUP: 'nicknameSetup',
  PROFILE: 'profile',
};

// ===== INPUT =====
const keys = {};
const justPressed = {};
let anyKeyPressed = false;

document.addEventListener('keydown', (e) => {
  if (!keys[e.code]) justPressed[e.code] = true;
  keys[e.code] = true;
  anyKeyPressed = true;
  e.preventDefault();
});
document.addEventListener('keyup', (e) => {
  keys[e.code] = false;
  e.preventDefault();
});

function consumeKey(code) {
  if (justPressed[code]) { justPressed[code] = false; return true; }
  return false;
}
function clearJustPressed() {
  for (const k in justPressed) justPressed[k] = false;
  anyKeyPressed = false;
}

// ===== PARTICLES =====
class Particle {
  constructor(x, y, vx, vy, color, life, size) {
    this.x = x; this.y = y;
    this.vx = vx; this.vy = vy;
    this.color = color;
    this.life = life; this.maxLife = life;
    this.size = size || 3;
  }
  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += 0.15;
    this.life--;
  }
  draw(ctx, camX) {
    const alpha = this.life / this.maxLife;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x - camX, this.y, this.size, this.size);
    ctx.globalAlpha = 1;
  }
}

// ===== DRAWING HELPERS =====
function drawText(ctx, text, x, y, size, color, align, stroke) {
  ctx.font = `bold ${size}px monospace`;
  ctx.textAlign = align || 'center';
  ctx.textBaseline = 'middle';
  if (stroke) {
    ctx.strokeStyle = '#000';
    ctx.lineWidth = size > 20 ? 4 : 2;
    ctx.strokeText(text, x, y);
  }
  ctx.fillStyle = color || '#fff';
  ctx.fillText(text, x, y);
}

function drawRoundedRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawCat(ctx, x, y, dir, frame, alive, invincible, invTimer, grounded, vy) {
  if (grounded === undefined) grounded = true;
  if (vy === undefined) vy = 0;
  if (invincible && Math.floor(invTimer / 3) % 2 === 0) return;
  ctx.save();
  ctx.translate(x, y);
  if (dir < 0) { ctx.scale(-1, 1); ctx.translate(-PLAYER_W, 0); }

  // Determine animation state
  const isMoving = alive && grounded && (frame % 2 !== 0 || frame > 2);
  const legFrame = alive ? Math.floor(frame / 5) % 4 : 0;
  const isJumping = alive && !grounded && vy < 0;
  const isFalling = alive && !grounded && vy >= 0;
  const bodyBob = (alive && grounded && isMoving && (legFrame === 1 || legFrame === 3)) ? -1 : 0;
  const isBlinking = alive && (frame % 120 < 4);

  // Breathing idle: subtle body scale when standing still
  const isIdle = alive && grounded && legFrame === 0;
  const breatheOff = isIdle ? Math.round(Math.sin(frame * 0.06) * 0.8) : 0;

  // --- Tail (animated wave) ---
  ctx.fillStyle = '#FF8C00';
  const tailWave = Math.sin(frame * 0.15);
  const t1x = 18 + tailWave * 1;
  const t2x = 20 + tailWave * 2;
  const t3x = 21 + tailWave * 3;
  ctx.fillRect(t1x, 11 + bodyBob, 3, 3);
  ctx.fillRect(t2x, 9 + bodyBob, 3, 2);
  ctx.fillRect(t3x, 7 + bodyBob, 2, 2);
  // Tail tip highlight
  ctx.fillStyle = '#FFB040';
  ctx.fillRect(t3x, 7 + bodyBob, 1, 1);

  // --- Body outline (dark border for depth) ---
  ctx.fillStyle = '#8B4500';
  ctx.fillRect(2, 7 + bodyBob + breatheOff, 18, 1);   // top edge
  ctx.fillRect(2, 7 + bodyBob + breatheOff, 1, 15);   // left edge
  ctx.fillRect(19, 7 + bodyBob + breatheOff, 1, 15);  // right edge
  ctx.fillRect(2, 22 + bodyBob, 18, 1);  // bottom edge

  // --- Body ---
  ctx.fillStyle = '#FF8C00';
  ctx.fillRect(3, 8 + bodyBob + breatheOff, 16, 14 - breatheOff);

  // Body shading - highlight top-left
  ctx.fillStyle = '#FFB040';
  ctx.fillRect(3, 8 + bodyBob + breatheOff, 8, 2);
  // Body shading - shadow bottom-right
  ctx.fillStyle = '#D07800';
  ctx.fillRect(15, 14 + bodyBob, 4, 8);
  ctx.fillRect(3, 20 + bodyBob, 16, 2);

  // --- Stripes ---
  ctx.fillStyle = '#E07000';
  ctx.fillRect(5, 10 + bodyBob + breatheOff, 3, 2);
  ctx.fillRect(13, 10 + bodyBob + breatheOff, 3, 2);
  ctx.fillRect(7, 14 + bodyBob, 3, 2);
  ctx.fillRect(11, 14 + bodyBob, 3, 2);
  // Extra stripe detail
  ctx.fillRect(9, 12 + bodyBob, 2, 2);

  // --- White belly ---
  ctx.fillStyle = '#FFF';
  ctx.fillRect(7, 17 + bodyBob, 8, 4);
  // Belly shading
  ctx.fillStyle = '#EEE';
  ctx.fillRect(7, 20 + bodyBob, 8, 1);

  // --- Head outline ---
  ctx.fillStyle = '#8B4500';
  ctx.fillRect(1, -1, 20, 1);   // top outline
  ctx.fillRect(1, -1, 1, 12);   // left outline
  ctx.fillRect(20, -1, 1, 12);  // right outline

  // --- Head ---
  ctx.fillStyle = '#FF8C00';
  ctx.fillRect(2, 0, 18, 10);
  // Head highlight
  ctx.fillStyle = '#FFB040';
  ctx.fillRect(2, 0, 10, 2);

  // --- Ears ---
  ctx.fillStyle = '#FF8C00';
  ctx.fillRect(2, -4, 5, 5);
  ctx.fillRect(15, -4, 5, 5);
  // Ear outline
  ctx.fillStyle = '#8B4500';
  ctx.fillRect(2, -5, 5, 1);
  ctx.fillRect(1, -4, 1, 5);
  ctx.fillRect(15, -5, 5, 1);
  ctx.fillRect(20, -4, 1, 5);
  // Ear inner pink
  ctx.fillStyle = '#FFB6C1';
  ctx.fillRect(4, -2, 2, 3);
  ctx.fillRect(17, -2, 2, 3);
  // Ear inner shadow
  ctx.fillStyle = '#E89EAB';
  ctx.fillRect(4, 0, 2, 1);
  ctx.fillRect(17, 0, 2, 1);

  // --- Eyes ---
  if (alive) {
    if (isBlinking) {
      // Blink: thin closed eyes
      ctx.fillStyle = '#000';
      ctx.fillRect(5, 4, 4, 1);
      ctx.fillRect(13, 4, 4, 1);
    } else {
      // Eye sockets
      ctx.fillStyle = '#000';
      ctx.fillRect(5, 2, 4, 5);
      ctx.fillRect(13, 2, 4, 5);
      // Pupils (white highlight)
      ctx.fillStyle = '#FFF';
      ctx.fillRect(7, 2, 2, 2);
      ctx.fillRect(15, 2, 2, 2);
      // Small catchlight
      ctx.fillStyle = '#FFF';
      ctx.fillRect(6, 3, 1, 1);
      ctx.fillRect(14, 3, 1, 1);
    }
  } else {
    // X eyes for death
    ctx.fillStyle = '#C00';
    ctx.fillRect(5, 3, 2, 2); ctx.fillRect(9, 3, 2, 2);
    ctx.fillRect(7, 5, 2, 2); ctx.fillRect(7, 1, 2, 2);
    ctx.fillRect(13, 3, 2, 2); ctx.fillRect(17, 3, 2, 2);
    ctx.fillRect(15, 5, 2, 2); ctx.fillRect(15, 1, 2, 2);
  }

  // --- Whiskers ---
  ctx.fillStyle = '#C06000';
  // Left whiskers
  ctx.fillRect(0, 5, 3, 1);
  ctx.fillRect(0, 7, 4, 1);
  ctx.fillRect(1, 9, 3, 1);
  // Right whiskers
  ctx.fillRect(19, 5, 3, 1);
  ctx.fillRect(18, 7, 4, 1);
  ctx.fillRect(18, 9, 3, 1);

  // --- Nose ---
  ctx.fillStyle = '#FF8FA0';
  ctx.fillRect(9, 6, 4, 2);
  // Nose highlight
  ctx.fillStyle = '#FFB6C1';
  ctx.fillRect(10, 6, 2, 1);

  // --- Mouth ---
  ctx.fillStyle = alive ? '#C44' : '#888';
  ctx.fillRect(9, 8, 4, 1);
  if (alive) {
    // Smile corners
    ctx.fillRect(8, 8, 1, 1);
    ctx.fillRect(13, 8, 1, 1);
  }

  // --- Legs & Shoes ---
  if (isJumping) {
    // Jump pose: legs stretched down, slightly spread
    ctx.fillStyle = '#FF8C00';
    ctx.fillRect(3, 22, 5, 5);
    ctx.fillRect(14, 22, 5, 5);
    // Shoes
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(2, 26, 7, 2);
    ctx.fillRect(13, 26, 7, 2);
    ctx.fillStyle = '#5C2D06';
    ctx.fillRect(2, 27, 7, 1);
    ctx.fillRect(13, 27, 7, 1);
  } else if (isFalling) {
    // Falling pose: legs tucked up
    ctx.fillStyle = '#FF8C00';
    ctx.fillRect(4, 21, 5, 4);
    ctx.fillRect(13, 21, 5, 4);
    // Shoes tucked
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(4, 24, 6, 2);
    ctx.fillRect(13, 24, 6, 2);
    ctx.fillStyle = '#5C2D06';
    ctx.fillRect(4, 25, 6, 1);
    ctx.fillRect(13, 25, 6, 1);
  } else {
    // Grounded: 4-frame walk cycle
    ctx.fillStyle = '#FF8C00';
    const lx1 = [4, 2, 4, 6][legFrame];
    const lx2 = [13, 15, 13, 11][legFrame];
    ctx.fillRect(lx1, 22 + bodyBob, 5, 6);
    ctx.fillRect(lx2, 22 + bodyBob, 5, 6);

    // Shoes with sole detail
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(lx1 - 1, 26 + bodyBob, 7, 2);
    ctx.fillRect(lx2 - 1, 26 + bodyBob, 7, 2);
    // Dark sole
    ctx.fillStyle = '#5C2D06';
    ctx.fillRect(lx1 - 1, 27 + bodyBob, 7, 1);
    ctx.fillRect(lx2 - 1, 27 + bodyBob, 7, 1);
    // Lace dot
    ctx.fillStyle = '#FFF';
    ctx.fillRect(lx1 + 2, 26 + bodyBob, 1, 1);
    ctx.fillRect(lx2 + 2, 26 + bodyBob, 1, 1);
  }

  ctx.restore();
}

function drawGoomba(ctx, x, y, type, frame) {
  const fast = type === 'fast_goomba';
  ctx.save();
  ctx.translate(x, y);

  const walkFrame = Math.floor(frame / 7) % 3;
  const squash = walkFrame === 1 ? 1 : 0;

  // Body outline
  ctx.fillStyle = fast ? '#5A0A0A' : '#3D1A00';
  ctx.beginPath();
  ctx.arc(14, 12 + squash, 13, Math.PI, 0);
  ctx.fill();
  ctx.fillRect(1, 12 + squash, 26, 13 - squash);

  // Body fill
  ctx.fillStyle = fast ? '#b02020' : '#8B4513';
  ctx.beginPath();
  ctx.arc(14, 12 + squash, 12, Math.PI, 0);
  ctx.fill();
  ctx.fillRect(2, 12 + squash, 24, 12 - squash);

  // Body highlight (top dome)
  ctx.fillStyle = fast ? '#CC3030' : '#A0642B';
  ctx.beginPath();
  ctx.arc(14, 10 + squash, 8, Math.PI, 0);
  ctx.fill();

  // Body shadow (bottom)
  ctx.fillStyle = fast ? '#8B1515' : '#6B3A0F';
  ctx.fillRect(2, 20 + squash, 24, 4 - squash);

  // Eyes
  ctx.fillStyle = '#FFF';
  ctx.fillRect(6, 6 + squash, 6, 6);
  ctx.fillRect(16, 6 + squash, 6, 6);
  // Eye outline
  ctx.fillStyle = '#000';
  ctx.fillRect(5, 5 + squash, 8, 1);
  ctx.fillRect(15, 5 + squash, 8, 1);
  ctx.fillRect(5, 12 + squash, 8, 1);
  ctx.fillRect(15, 12 + squash, 8, 1);
  // Pupils
  ctx.fillStyle = '#000';
  ctx.fillRect(8, 8 + squash, 3, 4);
  ctx.fillRect(18, 8 + squash, 3, 4);
  // Pupil highlight
  ctx.fillStyle = '#FFF';
  ctx.fillRect(8, 8 + squash, 1, 1);
  ctx.fillRect(18, 8 + squash, 1, 1);

  // Angry eyebrows (angled)
  ctx.fillStyle = '#000';
  // Left brow: high outside, low inside
  ctx.fillRect(5, 3 + squash, 2, 2);
  ctx.fillRect(7, 4 + squash, 2, 2);
  ctx.fillRect(9, 5 + squash, 2, 1);
  // Right brow: low inside, high outside
  ctx.fillRect(17, 5 + squash, 2, 1);
  ctx.fillRect(19, 4 + squash, 2, 2);
  ctx.fillRect(21, 3 + squash, 2, 2);

  // Mouth with teeth
  ctx.fillStyle = fast ? '#5A0A0A' : '#3D1A00';
  ctx.fillRect(8, 16 + squash, 12, 5);
  // Fangs
  ctx.fillStyle = '#FFF';
  ctx.fillRect(9, 16 + squash, 2, 2);
  ctx.fillRect(17, 16 + squash, 2, 2);
  // Bottom teeth
  ctx.fillRect(12, 19 + squash, 2, 2);
  ctx.fillRect(14, 19 + squash, 2, 2);

  // Feet with shoe shape
  ctx.fillStyle = fast ? '#5A0A0A' : '#4A2800';
  const f = walkFrame;
  const lf = [3, 1, 3][f];
  const rf = [17, 19, 17][f];
  // Left foot
  ctx.fillRect(lf, 24, 9, 4);
  ctx.fillStyle = fast ? '#700' : '#3D1A00';
  ctx.fillRect(lf, 27, 9, 1); // sole
  // Right foot
  ctx.fillStyle = fast ? '#5A0A0A' : '#4A2800';
  ctx.fillRect(rf, 24, 9, 4);
  ctx.fillStyle = fast ? '#700' : '#3D1A00';
  ctx.fillRect(rf, 27, 9, 1); // sole

  ctx.restore();
}

function drawSpiny(ctx, x, y, frame) {
  ctx.save();
  ctx.translate(x, y);

  const rockOff = Math.sin(frame * 0.12) * 1;

  // Shell outline
  ctx.fillStyle = '#600';
  ctx.beginPath();
  ctx.arc(14, 16 + rockOff, 13, Math.PI, 0);
  ctx.fill();
  ctx.fillRect(1, 16 + rockOff, 26, 8);

  // Shell fill
  ctx.fillStyle = '#B22222';
  ctx.beginPath();
  ctx.arc(14, 16 + rockOff, 12, Math.PI, 0);
  ctx.fill();
  ctx.fillRect(2, 16 + rockOff, 24, 7);

  // Shell highlight
  ctx.fillStyle = '#D44';
  ctx.beginPath();
  ctx.arc(10, 14 + rockOff, 6, Math.PI, 0);
  ctx.fill();

  // Shell shadow
  ctx.fillStyle = '#811';
  ctx.fillRect(16, 18 + rockOff, 10, 5);

  // Shell detail lines
  ctx.fillStyle = '#8B1515';
  ctx.fillRect(4, 17 + rockOff, 20, 1);
  ctx.fillRect(4, 20 + rockOff, 20, 1);

  // Triangular spikes with varied heights
  const spikeHeights = [10, 13, 11, 14, 10];
  for (let i = 0; i < 5; i++) {
    const sx = 2 + i * 5;
    const sh = spikeHeights[i];
    // Spike body
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.moveTo(sx, 10 + rockOff);
    ctx.lineTo(sx + 3, 10 - sh + rockOff);
    ctx.lineTo(sx + 6, 10 + rockOff);
    ctx.fill();
    // Spike tip highlight
    ctx.fillStyle = '#FFF';
    ctx.fillRect(sx + 2, 10 - sh + rockOff, 2, 2);
    // Spike base shadow
    ctx.fillStyle = '#B8860B';
    ctx.fillRect(sx, 8 + rockOff, 6, 2);
  }

  // Eyes
  ctx.fillStyle = '#FFF';
  ctx.fillRect(7, 13 + rockOff, 5, 5);
  ctx.fillRect(16, 13 + rockOff, 5, 5);
  // Pupils
  ctx.fillStyle = '#000';
  ctx.fillRect(9, 14 + rockOff, 3, 4);
  ctx.fillRect(18, 14 + rockOff, 3, 4);
  // Pupil highlight
  ctx.fillStyle = '#FFF';
  ctx.fillRect(9, 14 + rockOff, 1, 1);
  ctx.fillRect(18, 14 + rockOff, 1, 1);
  // Angry eyebrows (angled)
  ctx.fillStyle = '#400';
  ctx.fillRect(6, 11 + rockOff, 2, 2);
  ctx.fillRect(8, 12 + rockOff, 2, 1);
  ctx.fillRect(18, 12 + rockOff, 2, 1);
  ctx.fillRect(20, 11 + rockOff, 2, 2);

  // Frown mouth
  ctx.fillStyle = '#600';
  ctx.fillRect(10, 20 + rockOff, 8, 2);
  ctx.fillRect(9, 19 + rockOff, 2, 1);
  ctx.fillRect(17, 19 + rockOff, 2, 1);

  // Feet
  ctx.fillStyle = '#333';
  ctx.fillRect(4, 24, 7, 4);
  ctx.fillRect(17, 24, 7, 4);
  // Sole
  ctx.fillStyle = '#111';
  ctx.fillRect(4, 27, 7, 1);
  ctx.fillRect(17, 27, 7, 1);

  ctx.restore();
}

function drawFlying(ctx, x, y, frame) {
  // Body bob synchronized with wing flaps
  const wingPhase = Math.floor(frame / 5) % 3;
  const bodyBob = [0, -2, 1][wingPhase];

  // Body like goomba
  drawGoomba(ctx, x, y + 4 + bodyBob, 'goomba', frame);

  // Wings with proper shape
  ctx.save();
  ctx.translate(x, y + bodyBob);

  if (wingPhase === 0) {
    // Wings up
    // Left wing
    ctx.fillStyle = '#F8F8FF';
    ctx.beginPath();
    ctx.moveTo(2, 10);
    ctx.lineTo(-6, 0);
    ctx.lineTo(-2, -2);
    ctx.lineTo(2, 4);
    ctx.fill();
    ctx.fillStyle = '#DDD';
    ctx.beginPath();
    ctx.moveTo(2, 10);
    ctx.lineTo(-6, 0);
    ctx.lineTo(-4, 2);
    ctx.lineTo(2, 8);
    ctx.fill();
    // Right wing
    ctx.fillStyle = '#F8F8FF';
    ctx.beginPath();
    ctx.moveTo(26, 10);
    ctx.lineTo(34, 0);
    ctx.lineTo(30, -2);
    ctx.lineTo(26, 4);
    ctx.fill();
    ctx.fillStyle = '#DDD';
    ctx.beginPath();
    ctx.moveTo(26, 10);
    ctx.lineTo(34, 0);
    ctx.lineTo(32, 2);
    ctx.lineTo(26, 8);
    ctx.fill();
  } else if (wingPhase === 1) {
    // Wings middle (folded)
    ctx.fillStyle = '#F8F8FF';
    ctx.beginPath();
    ctx.moveTo(2, 8);
    ctx.lineTo(-4, 6);
    ctx.lineTo(-2, 4);
    ctx.lineTo(2, 5);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(26, 8);
    ctx.lineTo(32, 6);
    ctx.lineTo(30, 4);
    ctx.lineTo(26, 5);
    ctx.fill();
  } else {
    // Wings down
    ctx.fillStyle = '#F8F8FF';
    ctx.beginPath();
    ctx.moveTo(2, 8);
    ctx.lineTo(-6, 14);
    ctx.lineTo(-2, 16);
    ctx.lineTo(2, 12);
    ctx.fill();
    ctx.fillStyle = '#DDD';
    ctx.beginPath();
    ctx.moveTo(2, 8);
    ctx.lineTo(-6, 14);
    ctx.lineTo(-4, 12);
    ctx.lineTo(2, 9);
    ctx.fill();
    ctx.beginPath();
    ctx.fillStyle = '#F8F8FF';
    ctx.moveTo(26, 8);
    ctx.lineTo(34, 14);
    ctx.lineTo(30, 16);
    ctx.lineTo(26, 12);
    ctx.fill();
    ctx.fillStyle = '#DDD';
    ctx.beginPath();
    ctx.moveTo(26, 8);
    ctx.lineTo(34, 14);
    ctx.lineTo(32, 12);
    ctx.lineTo(26, 9);
    ctx.fill();
  }

  ctx.restore();
}

function drawCoin(ctx, x, y, frame) {
  const stretch = Math.abs(Math.sin(frame * 0.1));
  const cx = x + 6;
  const cy = y + 7;
  const rx = Math.max(1, 6 * stretch);
  const ry = 7;

  // Outer rim
  ctx.fillStyle = '#B8860B';
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx + 1, ry + 1, 0, 0, Math.PI * 2);
  ctx.fill();

  // Coin body
  ctx.fillStyle = '#FFD700';
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();

  // Inner ring
  if (stretch > 0.3) {
    ctx.fillStyle = '#DAA520';
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx * 0.75, ry * 0.75, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx * 0.6, ry * 0.6, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // $ symbol on face
  if (stretch > 0.45) {
    ctx.fillStyle = '#B8860B';
    const sw = Math.max(1, Math.floor(rx * 0.4));
    // S shape approximation
    ctx.fillRect(cx - sw, cy - 4, sw * 2, 1);
    ctx.fillRect(cx - sw, cy - 4, 1, 4);
    ctx.fillRect(cx - sw, cy, sw * 2, 1);
    ctx.fillRect(cx + sw - 1, cy, 1, 4);
    ctx.fillRect(cx - sw, cy + 3, sw * 2, 1);
    // Vertical line through
    ctx.fillRect(cx, cy - 5, 1, 12);
  }

  // Highlight
  if (stretch > 0.4) {
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.beginPath();
    ctx.ellipse(cx - rx * 0.2, cy - ry * 0.25, rx * 0.25, ry * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Sparkle effect
  const sparklePhase = frame % 50;
  if (sparklePhase < 8) {
    const alpha = sparklePhase < 4 ? sparklePhase / 4 : (8 - sparklePhase) / 4;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#FFF';
    const spx = cx + rx + 2;
    const spy = cy - ry;
    ctx.fillRect(spx, spy - 2, 1, 5);
    ctx.fillRect(spx - 2, spy, 5, 1);
    ctx.fillRect(spx - 1, spy - 1, 3, 3);
    ctx.globalAlpha = 1;
  }
}

function drawFlag(ctx, x, y, fake, frame) {
  // Pole shadow
  ctx.fillStyle = '#444';
  ctx.fillRect(x + 17, y, 2, 5 * TILE);
  // Pole
  ctx.fillStyle = '#777';
  ctx.fillRect(x + 14, y, 4, 5 * TILE);
  // Pole highlight
  ctx.fillStyle = '#999';
  ctx.fillRect(x + 14, y, 1, 5 * TILE);
  // Pole rings
  ctx.fillStyle = '#AAA';
  for (let r = 0; r < 5; r++) {
    ctx.fillRect(x + 13, y + r * TILE, 6, 2);
  }
  // Pole base
  ctx.fillStyle = '#555';
  ctx.fillRect(x + 12, y + 5 * TILE - 4, 8, 4);

  // Ball on top (circle with 3D highlight)
  const ballColor = fake ? '#FF0000' : '#FFD700';
  ctx.fillStyle = ballColor;
  ctx.beginPath();
  ctx.arc(x + 16, y - 1, 5, 0, Math.PI * 2);
  ctx.fill();
  // Ball outline
  ctx.strokeStyle = fake ? '#A00' : '#B8860B';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(x + 16, y - 1, 5, 0, Math.PI * 2);
  ctx.stroke();
  // Ball highlight
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.fillRect(x + 14, y - 3, 2, 2);

  // Flag cloth with wave animation
  const clothX = x + 19;
  const clothY = y + 4;
  const clothW = 22;
  const clothH = 18;
  const strips = 5;
  const stripW = clothW / strips;

  for (let s = 0; s < strips; s++) {
    const waveOff = Math.sin(frame * 0.1 + s * 0.8) * (s * 0.6 + 0.5);
    const sx = clothX + s * stripW;
    const sy = clothY + waveOff;

    // Primary color
    ctx.fillStyle = fake ? '#FF4444' : '#00CC00';
    ctx.fillRect(sx, sy, stripW + 1, clothH * 0.45);
    // Secondary color (bottom half)
    ctx.fillStyle = fake ? '#CC0000' : '#009900';
    ctx.fillRect(sx, sy + clothH * 0.45, stripW + 1, clothH * 0.55);
    // Highlight on top edge
    ctx.fillStyle = fake ? '#FF7777' : '#33FF33';
    ctx.fillRect(sx, sy, stripW + 1, 2);
  }

  if (fake) {
    // Skull on fake flag (more detailed)
    const skx = clothX + 3;
    const sky = clothY + 2;
    // Skull shape (round)
    ctx.fillStyle = '#FFF';
    ctx.beginPath();
    ctx.arc(skx + 7, sky + 5, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(skx + 2, sky + 5, 10, 6);
    // Eye sockets
    ctx.fillStyle = '#000';
    ctx.fillRect(skx + 2, sky + 3, 3, 3);
    ctx.fillRect(skx + 8, sky + 3, 3, 3);
    // Nose
    ctx.fillRect(skx + 5, sky + 6, 2, 2);
    // Teeth row
    ctx.fillStyle = '#FFF';
    ctx.fillRect(skx + 2, sky + 9, 2, 2);
    ctx.fillRect(skx + 5, sky + 9, 2, 2);
    ctx.fillRect(skx + 8, sky + 9, 2, 2);
    ctx.fillStyle = '#000';
    ctx.fillRect(skx + 4, sky + 9, 1, 2);
    ctx.fillRect(skx + 7, sky + 9, 1, 2);
  } else {
    // Star on real flag (5-pointed)
    const starCx = clothX + clothW / 2;
    const starCy = clothY + clothH / 2;
    // Glow behind star
    ctx.fillStyle = 'rgba(255,215,0,0.3)';
    ctx.beginPath();
    ctx.arc(starCx, starCy, 8, 0, Math.PI * 2);
    ctx.fill();
    // Draw 5-pointed star
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const angle = -Math.PI / 2 + (i * 2 * Math.PI / 5);
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
    // Star outline
    ctx.strokeStyle = '#B8860B';
    ctx.lineWidth = 1;
    ctx.stroke();
    // Star center highlight
    ctx.fillStyle = '#FFE44D';
    ctx.fillRect(starCx - 1, starCy - 1, 2, 2);
  }
}

function drawTile(ctx, type, x, y, frame) {
  switch (type) {
    case T.GROUND_TOP:
      ctx.fillStyle = '#228B22';
      ctx.fillRect(x, y, TILE, TILE);
      ctx.fillStyle = '#2EA82E';
      ctx.fillRect(x, y, TILE, 6);
      // Grass blades
      ctx.fillStyle = '#32CD32';
      for (let i = 0; i < 5; i++) {
        ctx.fillRect(x + i * 7, y, 2, 3);
      }
      ctx.fillStyle = '#1A6B1A';
      ctx.fillRect(x, y + 6, TILE, 2);
      break;

    case T.GROUND:
      ctx.fillStyle = '#8B5A2B';
      ctx.fillRect(x, y, TILE, TILE);
      ctx.fillStyle = '#7A4E24';
      ctx.fillRect(x + 2, y + 2, 12, 12);
      ctx.fillRect(x + 18, y + 18, 12, 12);
      break;

    case T.BRICK:
      ctx.fillStyle = '#CD853F';
      ctx.fillRect(x, y, TILE, TILE);
      ctx.fillStyle = '#8B6914';
      ctx.fillRect(x, y, TILE, 1);
      ctx.fillRect(x, y + 15, TILE, 1);
      ctx.fillRect(x + 15, y, 1, 16);
      ctx.fillRect(x, y + 16, 16, 1);
      ctx.fillRect(x + 16, y + 16, 16, 1);
      ctx.fillRect(x + 7, y, 1, 16);
      ctx.fillRect(x + 23, y + 16, 1, 16);
      break;

    case T.QUESTION:
    case T.TROLL_Q:
      const pulse = Math.sin(frame * 0.08) * 0.15 + 0.85;
      ctx.fillStyle = `rgb(${Math.floor(255 * pulse)}, ${Math.floor(200 * pulse)}, 0)`;
      ctx.fillRect(x, y, TILE, TILE);
      ctx.fillStyle = '#B8860B';
      ctx.fillRect(x, y, TILE, 2);
      ctx.fillRect(x, y, 2, TILE);
      ctx.fillRect(x + 30, y, 2, TILE);
      ctx.fillRect(x, y + 30, TILE, 2);
      // Question mark
      ctx.fillStyle = '#FFF';
      ctx.fillRect(x + 11, y + 6, 10, 3);
      ctx.fillRect(x + 18, y + 9, 3, 6);
      ctx.fillRect(x + 11, y + 13, 10, 3);
      ctx.fillRect(x + 11, y + 13, 3, 5);
      ctx.fillRect(x + 11, y + 21, 5, 3);
      break;

    case T.USED:
      ctx.fillStyle = '#8B7355';
      ctx.fillRect(x, y, TILE, TILE);
      ctx.fillStyle = '#6B5535';
      ctx.fillRect(x + 2, y + 2, 28, 28);
      break;

    case T.SPIKE:
      ctx.fillStyle = '#AAA';
      for (let i = 0; i < 4; i++) {
        const sx = x + i * 8;
        ctx.beginPath();
        ctx.moveTo(sx, y + TILE);
        ctx.lineTo(sx + 4, y + 4);
        ctx.lineTo(sx + 8, y + TILE);
        ctx.fill();
      }
      ctx.fillStyle = '#DDD';
      for (let i = 0; i < 4; i++) {
        const sx = x + i * 8;
        ctx.beginPath();
        ctx.moveTo(sx + 2, y + TILE);
        ctx.lineTo(sx + 4, y + 8);
        ctx.lineTo(sx + 6, y + TILE);
        ctx.fill();
      }
      break;

    case T.HIDDEN_SPIKE:
      // Looks like ground top!
      drawTile(ctx, T.GROUND_TOP, x, y, frame);
      break;

    case T.FAKE_GROUND:
      // Looks like ground top but slightly different shade
      ctx.fillStyle = '#228B22';
      ctx.fillRect(x, y, TILE, TILE);
      ctx.fillStyle = '#2EB82E';
      ctx.fillRect(x, y, TILE, 6);
      ctx.fillStyle = '#33DD33';
      for (let i = 0; i < 4; i++) {
        ctx.fillRect(x + i * 8 + 1, y, 2, 3);
      }
      ctx.fillStyle = '#1A6B1A';
      ctx.fillRect(x, y + 6, TILE, 2);
      break;

    case T.INVISIBLE:
      // Don't draw in game - it's invisible!
      break;

    case T.PIPE_TL:
      ctx.fillStyle = '#00AA00';
      ctx.fillRect(x, y, TILE, TILE);
      ctx.fillStyle = '#00DD00';
      ctx.fillRect(x, y, TILE, 4);
      ctx.fillRect(x, y, 4, TILE);
      ctx.fillStyle = '#006600';
      ctx.fillRect(x + 28, y, 4, TILE);
      break;

    case T.PIPE_TR:
      ctx.fillStyle = '#00AA00';
      ctx.fillRect(x, y, TILE, TILE);
      ctx.fillStyle = '#00DD00';
      ctx.fillRect(x, y, TILE, 4);
      ctx.fillStyle = '#006600';
      ctx.fillRect(x + 28, y, 4, TILE);
      ctx.fillRect(x, y, 4, TILE);
      break;

    case T.PIPE_BL:
      ctx.fillStyle = '#008800';
      ctx.fillRect(x, y, TILE, TILE);
      ctx.fillStyle = '#00BB00';
      ctx.fillRect(x, y, 4, TILE);
      ctx.fillStyle = '#005500';
      ctx.fillRect(x + 28, y, 4, TILE);
      break;

    case T.PIPE_BR:
      ctx.fillStyle = '#008800';
      ctx.fillRect(x, y, TILE, TILE);
      ctx.fillStyle = '#005500';
      ctx.fillRect(x, y, 4, TILE);
      ctx.fillRect(x + 28, y, 4, TILE);
      break;

    case T.LAVA:
      const lavaR = Math.floor(200 + Math.sin(frame * 0.1 + x * 0.1) * 55);
      ctx.fillStyle = `rgb(${lavaR}, ${Math.floor(lavaR * 0.3)}, 0)`;
      ctx.fillRect(x, y, TILE, TILE);
      ctx.fillStyle = `rgba(255, 200, 0, ${0.3 + Math.sin(frame * 0.15 + x * 0.2) * 0.2})`;
      ctx.fillRect(x + 4, y + 2, TILE - 8, 6);
      break;

    case T.SPRING:
      ctx.fillStyle = '#FF4444';
      ctx.fillRect(x + 4, y + 16, 24, 16);
      ctx.fillStyle = '#FF8888';
      ctx.fillRect(x + 6, y + 18, 20, 4);
      // Spring coil
      ctx.fillStyle = '#FFFF00';
      const springOffset = Math.sin(frame * 0.1) * 2;
      ctx.fillRect(x + 8, y + 8 + springOffset, 16, 4);
      ctx.fillRect(x + 10, y + 4 + springOffset, 12, 4);
      ctx.fillRect(x + 12, y + springOffset, 8, 4);
      break;

    case T.CASTLE:
      ctx.fillStyle = '#888';
      ctx.fillRect(x, y, TILE, TILE);
      ctx.fillStyle = '#999';
      ctx.fillRect(x + 1, y + 1, 14, 14);
      ctx.fillRect(x + 17, y + 17, 14, 14);
      ctx.fillStyle = '#777';
      ctx.fillRect(x + 17, y + 1, 14, 14);
      ctx.fillRect(x + 1, y + 17, 14, 14);
      // Battlements
      ctx.fillStyle = '#AAA';
      ctx.fillRect(x, y, 6, 4);
      ctx.fillRect(x + 13, y, 6, 4);
      ctx.fillRect(x + 26, y, 6, 4);
      break;

    case T.CLOUD:
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.beginPath();
      ctx.arc(x + 10, y + 20, 10, 0, Math.PI * 2);
      ctx.arc(x + 22, y + 20, 10, 0, Math.PI * 2);
      ctx.arc(x + 16, y + 12, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.beginPath();
      ctx.arc(x + 12, y + 14, 5, 0, Math.PI * 2);
      ctx.fill();
      break;

    case T.PLATFORM:
      ctx.fillStyle = '#B0804A';
      ctx.fillRect(x, y, TILE, 10);
      ctx.fillStyle = '#D4A04A';
      ctx.fillRect(x, y, TILE, 4);
      ctx.fillStyle = '#8B6233';
      ctx.fillRect(x, y + 8, TILE, 2);
      // Wood grain lines
      ctx.fillStyle = '#C09045';
      ctx.fillRect(x + 4, y + 2, 8, 1);
      ctx.fillRect(x + 18, y + 3, 10, 1);
      break;

    case T.ICE:
      ctx.fillStyle = '#A0D8EF';
      ctx.fillRect(x, y, TILE, TILE);
      ctx.fillStyle = '#C0EEFF';
      ctx.fillRect(x, y, TILE, 6);
      ctx.fillStyle = '#80C0DD';
      ctx.fillRect(x, y + 6, TILE, 2);
      // Shine effects
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.fillRect(x + 4, y + 2, 6, 2);
      ctx.fillRect(x + 18, y + 10, 4, 3);
      ctx.fillRect(x + 8, y + 20, 3, 2);
      break;

    case T.CONVEYOR_L:
    case T.CONVEYOR_R: {
      const isLeft = type === T.CONVEYOR_L;
      ctx.fillStyle = '#555';
      ctx.fillRect(x, y, TILE, TILE);
      ctx.fillStyle = '#777';
      ctx.fillRect(x + 1, y + 2, 30, 28);
      // Animated arrows
      const convOff = (frame * (isLeft ? -2 : 2)) % 16;
      ctx.fillStyle = '#FFD700';
      for (let i = -1; i < 3; i++) {
        const ax = x + 4 + i * 12 + convOff;
        if (ax >= x && ax + 6 <= x + TILE) {
          if (isLeft) {
            ctx.beginPath();
            ctx.moveTo(ax + 6, y + 10); ctx.lineTo(ax, y + 16); ctx.lineTo(ax + 6, y + 22);
            ctx.fill();
          } else {
            ctx.beginPath();
            ctx.moveTo(ax, y + 10); ctx.lineTo(ax + 6, y + 16); ctx.lineTo(ax, y + 22);
            ctx.fill();
          }
        }
      }
      // Side rails
      ctx.fillStyle = '#444';
      ctx.fillRect(x, y, TILE, 2);
      ctx.fillRect(x, y + 30, TILE, 2);
      break;
    }

    case T.CHECKPOINT: {
      // Flag pole checkpoint
      ctx.fillStyle = '#888';
      ctx.fillRect(x + 14, y + 4, 4, 28);
      ctx.fillStyle = '#AAA';
      ctx.fillRect(x + 14, y + 4, 1, 28);
      // Flag triangle (color set by caller via _cpActivated)
      const cpWave = Math.sin(frame * 0.08) * 2;
      const cpActive = drawTile._cpActivated;
      ctx.fillStyle = cpActive ? '#44DD44' : '#44AAFF';
      ctx.beginPath();
      ctx.moveTo(x + 18, y + 4);
      ctx.lineTo(x + 30 + cpWave, y + 10);
      ctx.lineTo(x + 18, y + 16);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = cpActive ? '#22AA22' : '#2288DD';
      ctx.beginPath();
      ctx.moveTo(x + 18, y + 10);
      ctx.lineTo(x + 30 + cpWave, y + 10);
      ctx.lineTo(x + 18, y + 16);
      ctx.closePath();
      ctx.fill();
      // Glow when activated
      if (cpActive) {
        ctx.fillStyle = `rgba(68, 221, 68, ${0.15 + Math.sin(frame * 0.1) * 0.1})`;
        ctx.fillRect(x, y, TILE, TILE);
      }
      // Base
      ctx.fillStyle = '#666';
      ctx.fillRect(x + 10, y + 28, 12, 4);
      break;
    }

    case T.TRAMPOLINE:
      // Base
      ctx.fillStyle = '#8844CC';
      ctx.fillRect(x + 2, y + 18, 28, 14);
      ctx.fillStyle = '#AA66EE';
      ctx.fillRect(x + 4, y + 20, 24, 4);
      // Bouncy top
      const trampOff = Math.sin(frame * 0.12) * 2;
      ctx.fillStyle = '#FF44FF';
      ctx.fillRect(x + 2, y + 8 + trampOff, 28, 10);
      ctx.fillStyle = '#FF88FF';
      ctx.fillRect(x + 4, y + 8 + trampOff, 24, 3);
      // Spring coils underneath
      ctx.fillStyle = '#666';
      ctx.fillRect(x + 8, y + 14 + trampOff, 4, 6 - trampOff);
      ctx.fillRect(x + 20, y + 14 + trampOff, 4, 6 - trampOff);
      break;
  }
}

// ===== MAIN GAME CLASS =====
class Game {
  constructor() {
    this.canvas = document.getElementById('game');
    this.ctx = this.canvas.getContext('2d');
    this.audio = new AudioManager();
    this.frame = 0;
    this.state = STATES.INTRO;
    this.introTimer = 0;
    this.introPhase = 0;

    // Player
    this.player = this.createPlayer(96, 384);

    // Game state
    this.lives = Infinity;
    this.coins = 0;
    this.currentLevel = 0;
    this.levelTime = 0;
    this.tiles = [];
    this.entities = [];
    this.trolls = [];
    this.particles = [];
    this.camera = { x: 0 };
    this.levelData = null;
    this.screenShake = 0;
    this.message = null;
    this.messageTimer = 0;
    this.deathTimer = 0;
    this.levelCompleteTimer = 0;
    this.crumblingTiles = new Map();
    this.activatedCheckpoints = new Set();

    // HUD animation state
    this.hudCoinsDisplay = 0;
    this.hudCoinPulse = 0;
    this.hudDeathPulse = 0;
    this.levelNameTimer = 0;

    // Saved progress
    this.savedLevel = this.loadSavedLevel();

    // Menu
    this.menuSelection = 0;
    this.updateMenuItems();
    this.configSelection = 0;

    // Pause menu
    this.pauseSelection = 0;
    this.pauseItems = ['Continuar', 'Voltar ao Menu'];

    // Stats
    this.stats = {
      totalDeaths: 0,
      deathsPerLevel: [0, 0, 0, 0],
      coinsCollected: 0,
      timePlayed: 0,
      levelsCompleted: 0,
      attempts: 0,
    };

    // Config
    this.config = {
      musicVolume: 0.5,
      sfxVolume: 0.7,
    };

    // Falling blocks (troll action)
    this.fallingBlocks = [];

    // Auth
    this.loginSelection = 0;
    this.loginItems = ['Google', 'GitHub', 'Voltar'];
    this.nicknameInput = '';
    this.nicknameError = '';
    this.nicknameSaving = false;
    this.profileSelection = 0;

    // Initialize Firebase & Auth
    initFirebase();
    auth.init();
    auth.onAuthChange(() => this.updateMenuItems());

    this.lastTime = 0;
    this.accumulator = 0;
    this.fixedStep = 1 / 60; // 60 updates per second

    // Editor (initialized lazily)
    this.editor = null;
    this._editorTestLevel = null;
    this._editorPrevState = null;

    document.getElementById('loading').style.display = 'none';
    this.run = this.run.bind(this);
    requestAnimationFrame(this.run);
  }

  createPlayer(x, y) {
    return {
      x, y,
      vx: 0, vy: 0,
      w: PLAYER_W, h: PLAYER_H,
      dir: 1,
      grounded: false,
      alive: true,
      frame: 0,
      invincible: false,
      invTimer: 0,
      jumpHeld: false,
    };
  }

  // ===== GAME LOOP =====
  run(timestamp) {
    if (this.lastTime === 0) this.lastTime = timestamp;
    const elapsed = Math.min((timestamp - this.lastTime) / 1000, 0.1);
    this.lastTime = timestamp;
    this.accumulator += elapsed;

    // Fixed timestep updates (60fps logic regardless of monitor refresh rate)
    while (this.accumulator >= this.fixedStep) {
      this.frame++;
      this.update(this.fixedStep);
      clearJustPressed();
      this.accumulator -= this.fixedStep;
    }

    this.render();
    requestAnimationFrame(this.run);
  }

  // ===== UPDATE =====
  update(dt) {
    // Init audio on first interaction
    if (anyKeyPressed && !this.audio.initialized) {
      this.audio.init();
    }

    switch (this.state) {
      case STATES.INTRO: this.updateIntro(dt); break;
      case STATES.MENU: this.updateMenu(); break;
      case STATES.PLAYING: this.updatePlaying(dt); break;
      case STATES.DEATH: this.updateDeath(dt); break;
      case STATES.LEVEL_COMPLETE: this.updateLevelComplete(dt); break;
      case STATES.GAME_OVER: this.updateGameOver(); break;
      case STATES.STATS: this.updateStats(); break;
      case STATES.CONFIG: this.updateConfig(); break;
      case STATES.VICTORY: this.updateVictory(); break;
      case STATES.PAUSED: this.updatePaused(); break;
      case STATES.EDITOR: this.updateEditor(); break;
      case STATES.CUSTOM_LEVELS: this.updateCustomLevels(); break;
      case STATES.LOGIN: this.updateLogin(); break;
      case STATES.NICKNAME_SETUP: this.updateNicknameSetup(); break;
      case STATES.PROFILE: this.updateProfile(); break;
    }
  }

  // ----- INTRO -----
  updateIntro(dt) {
    this.introTimer += dt;
    if (this.introTimer > 0.5 && this.introPhase === 0) this.introPhase = 1;
    if (this.introTimer > 2 && this.introPhase === 1) this.introPhase = 2;
    if (this.introTimer > 4 && this.introPhase === 2) this.introPhase = 3;
    if (this.introTimer > 6 && this.introPhase === 3) this.introPhase = 4;

    if ((consumeKey('Enter') || consumeKey('Space')) && this.introTimer > 1) {
      this.state = STATES.MENU;
      this.audio.init();
      this.audio.playMusic('menu');
    }
    if (this.introTimer > 8) {
      this.state = STATES.MENU;
      this.audio.init();
      this.audio.playMusic('menu');
    }
  }

  // ----- MENU -----
  updateMenu() {
    if (consumeKey('ArrowUp') || consumeKey('KeyW')) {
      this.menuSelection = (this.menuSelection - 1 + this.menuItems.length) % this.menuItems.length;
      this.audio.playSFX('select');
    }
    if (consumeKey('ArrowDown') || consumeKey('KeyS')) {
      this.menuSelection = (this.menuSelection + 1) % this.menuItems.length;
      this.audio.playSFX('select');
    }
    if (consumeKey('Enter') || consumeKey('Space')) {
      this.audio.playSFX('confirm');
      const item = this.menuItems[this.menuSelection];
      switch (item) {
        case 'Continuar':
          this.startGame(this.savedLevel);
          break;
        case 'Jogar':
        case 'Novo Jogo':
          this.startGame(0);
          break;
        case 'Configurações':
          this.state = STATES.CONFIG;
          this.configSelection = 0;
          break;
        case 'Estatísticas':
          this.state = STATES.STATS;
          break;
        case 'Editor':
          if (!this.editor) this.initEditor();
          this.state = STATES.EDITOR;
          this.editor.mode = EDITOR_MODES.EDIT;
          // Expand canvas for editor HUD
          this.canvas.height = EDITOR_CANVAS_H;
          this.canvas.style.cursor = 'crosshair';
          this.audio.stopMusic();
          break;
        case 'Fases Customizadas':
          if (!this.editor) this.initEditor();
          this.editorLoadSlots();
          this.editor.customLevelSelection = 0;
          this.state = STATES.CUSTOM_LEVELS;
          break;
        case 'Entrar':
          this.loginSelection = 0;
          this.state = STATES.LOGIN;
          break;
        case 'Meu Perfil':
          this.profileSelection = 0;
          this.state = STATES.PROFILE;
          break;
      }
    }
  }

  // ----- PLAYING -----
  updatePlaying(dt) {
    if (consumeKey('Escape') || consumeKey('KeyP')) {
      // If testing from editor, return to editor
      if (this.editor && this.editor.testing) {
        this.editorReturnFromTest();
        return;
      }
      this.state = STATES.PAUSED;
      return;
    }

    this.levelTime += dt;
    if (!this.editor || !this.editor.testing) this.stats.timePlayed += dt;
    const p = this.player;

    // Check tile under player for ice/conveyor
    const footTX = Math.floor((p.x + p.w / 2) / TILE);
    const footTY = Math.floor((p.y + p.h + 1) / TILE);
    const footTile = this.getTile(footTX, footTY);
    const onIce = p.grounded && footTile === T.ICE;
    const conveyorSpeed = footTile === T.CONVEYOR_L ? -2 : footTile === T.CONVEYOR_R ? 2 : 0;

    // Player input
    if (onIce) {
      // Ice: momentum-based, slippery
      const accel = 0.25;
      const friction = 0.02;
      if (keys['ArrowLeft'] || keys['KeyA']) { p.vx -= accel; p.dir = -1; }
      else if (keys['ArrowRight'] || keys['KeyD']) { p.vx += accel; p.dir = 1; }
      else { p.vx *= (1 - friction); if (Math.abs(p.vx) < 0.1) p.vx = 0; }
      p.vx = Math.max(-PLAYER_SPEED * 1.3, Math.min(PLAYER_SPEED * 1.3, p.vx));
    } else {
      p.vx = 0;
      if (keys['ArrowLeft'] || keys['KeyA']) { p.vx = -PLAYER_SPEED; p.dir = -1; }
      if (keys['ArrowRight'] || keys['KeyD']) { p.vx = PLAYER_SPEED; p.dir = 1; }
    }
    // Conveyor belt push
    if (p.grounded && conveyorSpeed !== 0) { p.vx += conveyorSpeed; }

    if ((keys['ArrowUp'] || keys['KeyW'] || keys['Space']) && p.grounded && !p.jumpHeld) {
      p.vy = JUMP_FORCE;
      p.grounded = false;
      p.jumpHeld = true;
      this.audio.playSFX('jump');
    }
    if (!keys['ArrowUp'] && !keys['KeyW'] && !keys['Space']) {
      p.jumpHeld = false;
      // Short hop: cut jump velocity
      if (p.vy < JUMP_FORCE * 0.4) p.vy = Math.max(p.vy, JUMP_FORCE * 0.4);
    }

    // Gravity
    p.vy += GRAVITY;
    if (p.vy > MAX_FALL) p.vy = MAX_FALL;

    // Update frame
    if (p.vx !== 0 && p.grounded) {
      p.frame++;
    }

    // Move X
    p.x += p.vx;
    this.resolveCollisionX(p);

    // Move Y
    p.y += p.vy;
    p.grounded = false;
    this.resolveCollisionY(p);

    // World bounds
    if (p.x < 0) p.x = 0;
    const maxX = (this.levelData ? this.levelData.width * TILE : CW) - p.w;
    if (p.x > maxX) p.x = maxX;

    // Fell off screen
    if (p.y > CH + 64) {
      this.killPlayer();
      return;
    }

    // Check lethal tiles
    this.checkLethalTiles(p);

    // Check checkpoint overlap
    this.checkCheckpoint(p);

    // Invincibility timer
    if (p.invincible) {
      p.invTimer++;
      if (p.invTimer > 90) {
        p.invincible = false;
        p.invTimer = 0;
      }
    }

    // Update entities
    this.updateEntities();

    // Check troll triggers
    this.checkTrolls();

    // Update crumbling tiles
    this.updateCrumbling();

    // Update falling blocks
    this.updateFallingBlocks();

    // Update particles
    this.particles = this.particles.filter(pt => { pt.update(); return pt.life > 0; });

    // Update message
    if (this.messageTimer > 0) this.messageTimer--;

    // Screen shake
    if (this.screenShake > 0) this.screenShake--;

    // HUD animations
    if (this.hudCoinsDisplay < this.coins) {
      this.hudCoinsDisplay += Math.max(1, Math.ceil((this.coins - this.hudCoinsDisplay) * 0.2));
      if (this.hudCoinsDisplay > this.coins) this.hudCoinsDisplay = this.coins;
    }
    if (this.hudCoinPulse > 0) this.hudCoinPulse--;
    if (this.hudDeathPulse > 0) this.hudDeathPulse--;
    if (this.levelNameTimer > 0) this.levelNameTimer--;

    // Camera follow
    const targetCamX = p.x - CW / 3;
    const maxCamX = (this.levelData ? this.levelData.width * TILE : CW) - CW;
    this.camera.x += (targetCamX - this.camera.x) * 0.1;
    this.camera.x = Math.max(0, Math.min(this.camera.x, maxCamX));
  }

  // ----- DEATH -----
  updateDeath(dt) {
    this.deathTimer += dt;
    this.player.vy += GRAVITY * 0.5;
    this.player.y += this.player.vy;
    this.particles = this.particles.filter(pt => { pt.update(); return pt.life > 0; });

    // If testing from editor, ESC returns to editor
    if (this.editor && this.editor.testing && consumeKey('Escape')) {
      this.editorReturnFromTest();
      return;
    }

    // Wait for player input to respawn (no auto-timer)
    if (this.deathTimer > 1.5 && (consumeKey('Enter') || consumeKey('Space'))) {
      if (this.editor && this.editor.testing) {
        // Re-test the level from start
        this.editorTestLevel();
      } else {
        this.respawn();
      }
    }
  }

  // ----- LEVEL COMPLETE -----
  updateLevelComplete(dt) {
    this.levelCompleteTimer += dt;
    this.particles = this.particles.filter(pt => { pt.update(); return pt.life > 0; });

    // Wait for player input to advance (no auto-timer)
    if (this.levelCompleteTimer > 1.5 && (consumeKey('Enter') || consumeKey('Space'))) {
      if (this.editor && this.editor.testing) {
        // Return to editor after completing custom level
        this.editorReturnFromTest();
        return;
      }
      if (this.currentLevel < LEVELS.length - 1) {
        this.currentLevel++;
        this.loadLevel(this.currentLevel);
      } else {
        this.state = STATES.VICTORY;
        this.audio.stopMusic();
        this.audio.playSFX('flag');
      }
    }
  }

  // ----- GAME OVER -----
  updateGameOver() {
    if (consumeKey('Enter') || consumeKey('Space')) {
      this.state = STATES.MENU;
      this.updateMenuItems();
      this.audio.playMusic('menu');
    }
  }

  // ----- STATS -----
  updateStats() {
    if (consumeKey('Escape') || consumeKey('Enter') || consumeKey('Space')) {
      this.state = STATES.MENU;
      this.updateMenuItems();
    }
  }

  // ----- CONFIG -----
  updateConfig() {
    if (consumeKey('Escape')) {
      this.state = STATES.MENU;
      this.updateMenuItems();
      return;
    }
    if (consumeKey('ArrowUp') || consumeKey('KeyW')) {
      this.configSelection = (this.configSelection - 1 + 2) % 2;
      this.audio.playSFX('select');
    }
    if (consumeKey('ArrowDown') || consumeKey('KeyS')) {
      this.configSelection = (this.configSelection + 1) % 2;
      this.audio.playSFX('select');
    }
    if (keys['ArrowLeft'] || keys['KeyA']) {
      if (this.configSelection === 0) {
        this.config.musicVolume = Math.max(0, this.config.musicVolume - 0.02);
        this.audio.setMusicVolume(this.config.musicVolume);
      } else {
        this.config.sfxVolume = Math.max(0, this.config.sfxVolume - 0.02);
        this.audio.setSFXVolume(this.config.sfxVolume);
      }
    }
    if (keys['ArrowRight'] || keys['KeyD']) {
      if (this.configSelection === 0) {
        this.config.musicVolume = Math.min(1, this.config.musicVolume + 0.02);
        this.audio.setMusicVolume(this.config.musicVolume);
      } else {
        this.config.sfxVolume = Math.min(1, this.config.sfxVolume + 0.02);
        this.audio.setSFXVolume(this.config.sfxVolume);
      }
    }
    if (consumeKey('Enter') || consumeKey('Space')) {
      this.state = STATES.MENU;
      this.updateMenuItems();
    }
  }

  // ----- VICTORY -----
  updateVictory() {
    // Spawn celebration particles
    if (this.frame % 5 === 0) {
      for (let i = 0; i < 3; i++) {
        const colors = ['#FFD700', '#FF4444', '#44FF44', '#4444FF', '#FF44FF', '#44FFFF'];
        this.particles.push(new Particle(
          Math.random() * CW, CH + 10,
          (Math.random() - 0.5) * 4, -(Math.random() * 8 + 4),
          colors[Math.floor(Math.random() * colors.length)],
          60 + Math.random() * 30, 4
        ));
      }
    }
    this.particles = this.particles.filter(pt => { pt.update(); return pt.life > 0; });

    if (consumeKey('Enter') || consumeKey('Space')) {
      this.state = STATES.MENU;
      this.updateMenuItems();
      this.audio.playMusic('menu');
    }
  }

  // ----- PAUSED -----
  updatePaused() {
    if (consumeKey('ArrowUp') || consumeKey('KeyW')) {
      this.pauseSelection = (this.pauseSelection - 1 + this.pauseItems.length) % this.pauseItems.length;
      this.audio.playSFX('select');
    }
    if (consumeKey('ArrowDown') || consumeKey('KeyS')) {
      this.pauseSelection = (this.pauseSelection + 1) % this.pauseItems.length;
      this.audio.playSFX('select');
    }
    if (consumeKey('Escape') || consumeKey('KeyP')) {
      this.state = STATES.PLAYING;
      this.pauseSelection = 0;
    }
    if (consumeKey('Enter') || consumeKey('Space')) {
      this.audio.playSFX('confirm');
      if (this.pauseSelection === 0) {
        this.state = STATES.PLAYING;
        this.pauseSelection = 0;
      } else if (this.pauseSelection === 1) {
        if (this.editor && this.editor.testing) {
          this.editorReturnFromTest();
          this.pauseSelection = 0;
        } else {
          this.saveProgress();
          this.audio.stopMusic();
          this.audio.playMusic('menu');
          this.state = STATES.MENU;
          this.updateMenuItems();
          this.menuSelection = 0;
          this.pauseSelection = 0;
        }
      }
    }
  }

  // ===== GAME LOGIC =====
  startGame(fromLevel) {
    this.lives = Infinity;
    this.coins = 0;
    this.currentLevel = fromLevel || 0;
    this.stats.attempts++;
    this.loadLevel(this.currentLevel);
  }

  loadSavedLevel() {
    try {
      const saved = localStorage.getItem('catmario_level');
      return saved !== null ? parseInt(saved, 10) : 0;
    } catch (e) { return 0; }
  }

  saveProgress() {
    try {
      localStorage.setItem('catmario_level', String(this.currentLevel));
    } catch (e) {}
  }

  updateMenuItems() {
    this.savedLevel = this.loadSavedLevel();
    let hasSave = false;
    try { hasSave = localStorage.getItem('catmario_level') !== null; } catch (e) {}
    let hasCustom = false;
    try { hasCustom = localStorage.getItem('catmario_custom_levels') !== null; } catch (e) {}

    const baseItems = [];
    if (hasSave) {
      baseItems.push('Continuar', 'Novo Jogo');
    } else {
      baseItems.push('Jogar');
    }
    baseItems.push('Editor');
    if (hasCustom) baseItems.push('Fases Customizadas');
    baseItems.push('Configurações', 'Estatísticas');

    // Auth item: show profile if logged in, or Login
    if (auth.isLoggedIn) {
      baseItems.push('Meu Perfil');
    } else {
      baseItems.push('Entrar');
    }

    this.menuItems = baseItems;
  }

  loadLevel(n) {
    const level = LEVELS[n];
    if (!level) return;

    this.levelData = level;
    // Deep copy tiles so trolls can modify them
    this.tiles = level.tiles.map(row => [...row]);
    this.levelTime = 0;
    // Clear checkpoint data from previous plays
    delete level._checkpointX;
    delete level._checkpointY;

    // Instantiate entities
    this.entities = level.entities.map(e => ({
      ...e,
      vx: e.type === 'goomba' || e.type === 'fast_goomba' || e.type === 'spiny' ? -1.5 : 0,
      vy: e.type === 'flying' ? 0 : 0,
      w: e.type === 'coin' ? 16 : e.type === 'flag' || e.type === 'fake_flag' ? 32 : 28,
      h: e.type === 'coin' ? 16 : e.type === 'flag' || e.type === 'fake_flag' ? 32 * 5 : 28,
      alive: true,
      frame: 0,
      baseY: e.y,
    }));

    // Reset trolls
    this.trolls = level.trolls.map(t => ({ ...t, triggered: false }));

    // Player
    this.player = this.createPlayer(level.playerStart.x, level.playerStart.y);
    this.camera.x = Math.max(0, this.player.x - CW / 3);
    this.particles = [];
    this.fallingBlocks = [];
    this.crumblingTiles = new Map();
    this.activatedCheckpoints = new Set();
    this.screenShake = 0;
    this.message = null;
    this.messageTimer = 0;

    this.state = STATES.PLAYING;
    this.saveProgress();
    this.levelNameTimer = 180;
    this.hudCoinsDisplay = this.coins;
    this.audio.stopMusic();
    this.audio.playMusic(level.music);
  }

  respawn() {
    if (!this.levelData) return;
    // Use checkpoint if available
    const spawnX = this.levelData._checkpointX != null ? this.levelData._checkpointX : this.levelData.playerStart.x;
    const spawnY = this.levelData._checkpointY != null ? this.levelData._checkpointY : this.levelData.playerStart.y;
    this.player = this.createPlayer(spawnX, spawnY);
    // Reload tiles to restore crumbled/modified tiles
    this.tiles = this.levelData.tiles.map(row => [...row]);
    this.entities = this.levelData.entities.map(e => ({
      ...e,
      vx: e.type === 'goomba' || e.type === 'fast_goomba' || e.type === 'spiny' ? -1.5 : 0,
      vy: 0,
      w: e.type === 'coin' ? 16 : e.type === 'flag' || e.type === 'fake_flag' ? 32 : 28,
      h: e.type === 'coin' ? 16 : e.type === 'flag' || e.type === 'fake_flag' ? 32 * 5 : 28,
      alive: true,
      frame: 0,
      baseY: e.y,
    }));
    this.trolls = this.levelData.trolls.map(t => ({ ...t, triggered: false }));
    this.camera.x = Math.max(0, this.player.x - CW / 3);
    this.particles = [];
    this.fallingBlocks = [];
    this.crumblingTiles = new Map();
    this.screenShake = 0;
    this.message = null;
    this.messageTimer = 0;
    this.state = STATES.PLAYING;
  }

  killPlayer() {
    if (this.player.invincible || !this.player.alive) return;
    this.player.alive = false;
    this.player.vy = -8;
    this.hudDeathPulse = 20;
    this.stats.totalDeaths++;
    if (this.currentLevel < LEVELS.length) this.stats.deathsPerLevel[this.currentLevel]++;
    this.deathTimer = 0;
    this.state = STATES.DEATH;
    this.audio.stopMusic();
    this.audio.playSFX('death');

    // Death particles
    for (let i = 0; i < 12; i++) {
      this.particles.push(new Particle(
        this.player.x + PLAYER_W / 2, this.player.y + PLAYER_H / 2,
        (Math.random() - 0.5) * 6, -(Math.random() * 6 + 2),
        '#FF8C00', 30 + Math.random() * 20, 3
      ));
    }
  }

  // ===== COLLISION =====
  getTile(tx, ty) {
    if (ty < 0 || ty >= (this.levelData ? this.levelData.height : 15)) return T.AIR;
    if (tx < 0 || tx >= (this.levelData ? this.levelData.width : 25)) return T.AIR;
    return this.tiles[ty] && this.tiles[ty][tx] !== undefined ? this.tiles[ty][tx] : T.AIR;
  }

  isSolid(tx, ty) {
    const tile = this.getTile(tx, ty);
    if (tile === T.FAKE_GROUND) {
      const key = `${tx},${ty}`;
      if (!this.crumblingTiles.has(key)) return true;
      return this.crumblingTiles.get(key) > 0;
    }
    if (ONEWAY_TILES.has(tile)) return false; // handled separately
    return SOLID_TILES.has(tile);
  }

  resolveCollisionX(entity) {
    const left = Math.floor(entity.x / TILE);
    const right = Math.floor((entity.x + entity.w - 1) / TILE);
    const top = Math.floor(entity.y / TILE);
    const bottom = Math.floor((entity.y + entity.h - 1) / TILE);

    for (let ty = top; ty <= bottom; ty++) {
      for (let tx = left; tx <= right; tx++) {
        if (this.isSolid(tx, ty)) {
          if (entity.vx > 0) {
            entity.x = tx * TILE - entity.w;
          } else if (entity.vx < 0) {
            entity.x = (tx + 1) * TILE;
          }
          entity.vx = 0;
          return;
        }
      }
    }
  }

  resolveCollisionY(entity) {
    const left = Math.floor(entity.x / TILE);
    const right = Math.floor((entity.x + entity.w - 1) / TILE);
    const top = Math.floor(entity.y / TILE);
    const bottom = Math.floor((entity.y + entity.h - 1) / TILE);

    for (let ty = top; ty <= bottom; ty++) {
      for (let tx = left; tx <= right; tx++) {
        const tile = this.getTile(tx, ty);
        // One-way platform: only solid when falling from above
        if (ONEWAY_TILES.has(tile)) {
          if (entity.vy > 0) {
            const entityBottom = entity.y + entity.h;
            const tileTop = ty * TILE;
            // Only collide if player was above the tile in previous frame
            if (entityBottom - entity.vy <= tileTop + 2) {
              entity.y = tileTop - entity.h;
              entity.vy = 0;
              entity.grounded = true;
              return;
            }
          }
          continue;
        }
        if (this.isSolid(tx, ty)) {
          if (entity.vy > 0) {
            // Landing on tile
            entity.y = ty * TILE - entity.h;
            entity.vy = 0;
            entity.grounded = true;

            // Check special tile interactions on landing
            const tile = this.getTile(tx, ty);
            if (tile === T.FAKE_GROUND) {
              const key = `${tx},${ty}`;
              if (!this.crumblingTiles.has(key)) {
                this.crumblingTiles.set(key, 20); // 20 frames before crumble
                this.audio.playSFX('crumble');
              }
            }
            if (tile === T.SPRING) {
              entity.vy = JUMP_FORCE * 1.5;
              entity.grounded = false;
              this.audio.playSFX('spring');
            }
            if (tile === T.TRAMPOLINE) {
              entity.vy = JUMP_FORCE * 2;
              entity.grounded = false;
              this.audio.playSFX('spring');
            }
            // Conveyor push on landing
            if (tile === T.CONVEYOR_L) {
              entity.x -= 2;
            }
            if (tile === T.CONVEYOR_R) {
              entity.x += 2;
            }
            // Checkpoint is handled via overlap in checkCheckpoint()
          } else if (entity.vy < 0) {
            // Hit head on tile
            entity.y = (ty + 1) * TILE;
            entity.vy = 0;

            // Hit question block
            const tile = this.getTile(tx, ty);
            if (tile === T.QUESTION) {
              this.tiles[ty][tx] = T.USED;
              this.coins++;
              this.stats.coinsCollected++;
              this.hudCoinPulse = 15;
              this.audio.playSFX('coin');
              // Spawn coin particle above
              this.particles.push(new Particle(
                tx * TILE + 12, ty * TILE - 16,
                0, -4, '#FFD700', 20, 6
              ));
            }
            if (tile === T.TROLL_Q) {
              this.tiles[ty][tx] = T.USED;
              this.audio.playSFX('troll');
              // Spawn enemy from above!
              this.entities.push({
                type: 'goomba', x: tx * TILE, y: (ty - 3) * TILE,
                vx: this.player.dir * -1.5, vy: 0,
                w: 28, h: 28, alive: true, frame: 0, baseY: 0,
              });
            }
            if (tile === T.BRICK) {
              this.tiles[ty][tx] = T.AIR;
              this.audio.playSFX('brick');
              for (let i = 0; i < 6; i++) {
                this.particles.push(new Particle(
                  tx * TILE + 16, ty * TILE + 16,
                  (Math.random() - 0.5) * 6, -(Math.random() * 5 + 2),
                  '#CD853F', 25, 4
                ));
              }
            }
            if (tile === T.INVISIBLE) {
              // Reveal invisible block
              // Keep it solid (already is), visual feedback
              this.particles.push(new Particle(
                tx * TILE + 16, ty * TILE + 16,
                0, -1, '#AAA', 15, 8
              ));
            }
          }
          return;
        }
      }
    }
  }

  checkLethalTiles(p) {
    // Check all corners of the player for lethal tiles
    const positions = [
      [p.x + 2, p.y + 2],
      [p.x + p.w - 2, p.y + 2],
      [p.x + 2, p.y + p.h - 2],
      [p.x + p.w - 2, p.y + p.h - 2],
      [p.x + p.w / 2, p.y + p.h - 2], // bottom center
    ];

    for (const [px, py] of positions) {
      const tx = Math.floor(px / TILE);
      const ty = Math.floor(py / TILE);
      const tile = this.getTile(tx, ty);
      if (LETHAL_TILES.has(tile)) {
        this.killPlayer();
        return;
      }
    }
  }

  // ===== ENTITIES =====
  updateEntities() {
    const p = this.player;

    for (const e of this.entities) {
      if (!e.alive) continue;
      e.frame++;

      switch (e.type) {
        case 'goomba':
        case 'fast_goomba':
          {
            const speed = e.type === 'fast_goomba' ? 3 : 1.5;
            if (e.vx > 0) e.vx = speed; else e.vx = -speed;
            e.vy += GRAVITY;
            if (e.vy > MAX_FALL) e.vy = MAX_FALL;

            // Move Y first, then resolve
            e.y += e.vy;
            e.grounded = false;
            const newBottom = Math.floor((e.y + e.h - 1) / TILE);
            const newLeft = Math.floor(e.x / TILE);
            const newRight = Math.floor((e.x + e.w - 1) / TILE);
            for (let tx = newLeft; tx <= newRight; tx++) {
              if (SOLID_TILES.has(this.getTile(tx, newBottom)) || this.getTile(tx, newBottom) === T.FAKE_GROUND) {
                e.y = newBottom * TILE - e.h;
                e.vy = 0;
                e.grounded = true;
                break;
              }
            }

            // Move X, then resolve
            e.x += e.vx;
            const leftTx = Math.floor(e.x / TILE);
            const rightTx = Math.floor((e.x + e.w - 1) / TILE);
            const topTy = Math.floor(e.y / TILE);
            const bottomTy = Math.floor((e.y + e.h - 1) / TILE);
            for (let ty = topTy; ty <= bottomTy; ty++) {
              for (let tx = leftTx; tx <= rightTx; tx++) {
                if (SOLID_TILES.has(this.getTile(tx, ty))) {
                  e.vx = -e.vx;
                  e.x += e.vx * 2;
                  break;
                }
              }
            }

            // Fall off screen
            if (e.y > CH + 64) e.alive = false;

            // Player collision
            if (this.checkOverlap(p, e)) {
              if (p.vy > 0 && p.y + p.h - 8 < e.y + e.h / 2 && e.type !== 'spiny') {
                // Stomp!
                e.alive = false;
                p.vy = JUMP_FORCE * 0.6;
                this.audio.playSFX('stomp');
                for (let i = 0; i < 6; i++) {
                  this.particles.push(new Particle(
                    e.x + e.w / 2, e.y + e.h / 2,
                    (Math.random() - 0.5) * 4, -(Math.random() * 3),
                    '#8B4513', 15, 3
                  ));
                }
              } else {
                this.killPlayer();
              }
            }
          }
          break;

        case 'spiny':
          {
            if (e.vx === 0) e.vx = -1.5;
            e.vy += GRAVITY;
            if (e.vy > MAX_FALL) e.vy = MAX_FALL;

            // Move Y first, then resolve
            e.y += e.vy;
            const stx1 = Math.floor(e.x / TILE);
            const stx2 = Math.floor((e.x + e.w - 1) / TILE);
            const sty2 = Math.floor((e.y + e.h - 1) / TILE);
            for (let tx = stx1; tx <= stx2; tx++) {
              if (SOLID_TILES.has(this.getTile(tx, sty2))) {
                e.y = sty2 * TILE - e.h;
                e.vy = 0;
              }
            }

            // Move X, then wall collision
            e.x += e.vx;
            const swLeft = Math.floor(e.x / TILE);
            const swRight = Math.floor((e.x + e.w - 1) / TILE);
            const swTop = Math.floor(e.y / TILE);
            if (SOLID_TILES.has(this.getTile(swLeft, swTop)) || SOLID_TILES.has(this.getTile(swRight, swTop))) {
              e.vx = -e.vx;
              e.x += e.vx * 2;
            }

            if (e.y > CH + 64) e.alive = false;

            // Player collision - spiny always kills
            if (this.checkOverlap(p, e)) {
              this.killPlayer();
            }
          }
          break;

        case 'flying':
          {
            e.x += (e.vx || -1.5);
            e.y = (e.baseY || e.y) + Math.sin(e.frame * 0.05) * 40;

            // Reverse at screen edges relative to spawn
            if (e.frame % 120 === 0) e.vx = -(e.vx || -1.5);

            if (this.checkOverlap(p, e)) {
              if (p.vy > 0 && p.y + p.h - 8 < e.y + e.h / 2) {
                e.alive = false;
                p.vy = JUMP_FORCE * 0.7;
                this.audio.playSFX('stomp');
              } else {
                this.killPlayer();
              }
            }
          }
          break;

        case 'coin':
          // Floating animation
          if (this.checkOverlap(p, e)) {
            e.alive = false;
            this.coins++;
            this.stats.coinsCollected++;
            this.hudCoinPulse = 15;
            this.audio.playSFX('coin');
            this.particles.push(new Particle(
              e.x + 8, e.y, 0, -3, '#FFD700', 15, 5
            ));
          }
          break;

        case 'flag':
          // Real flag - level complete!
          if (this.checkOverlap(p, { x: e.x + 12, y: e.y, w: 8, h: 5 * TILE })) {
            this.levelCompleteTimer = 0;
            this.state = STATES.LEVEL_COMPLETE;
            this.stats.levelsCompleted = Math.max(this.stats.levelsCompleted, this.currentLevel + 1);
            this.audio.stopMusic();
            this.audio.playSFX('levelclear');

            // Celebration particles
            for (let i = 0; i < 20; i++) {
              this.particles.push(new Particle(
                e.x + 16, e.y,
                (Math.random() - 0.5) * 8, -(Math.random() * 8 + 2),
                ['#FFD700', '#00CC00', '#FF4444', '#4444FF'][Math.floor(Math.random() * 4)],
                40, 4
              ));
            }
          }
          break;

        case 'fake_flag':
          // Fake flag - kills player!
          if (this.checkOverlap(p, { x: e.x + 12, y: e.y, w: 8, h: 5 * TILE })) {
            this.audio.playSFX('troll');
            this.killPlayer();
          }
          break;
      }
    }

    // Remove dead entities (except flags)
    this.entities = this.entities.filter(e =>
      e.alive || e.type === 'flag' || e.type === 'fake_flag'
    );
  }

  checkCheckpoint(p) {
    if (!this.levelData) return;
    const cx = Math.floor((p.x + p.w / 2) / TILE);
    const cy = Math.floor((p.y + p.h / 2) / TILE);
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const tx = cx + dx;
        const ty = cy + dy;
        if (this.getTile(tx, ty) === T.CHECKPOINT) {
          const key = `${tx},${ty}`;
          if (!this.activatedCheckpoints.has(key)) {
            this.activatedCheckpoints.add(key);
            // Save spawn position: on top of the checkpoint tile
            this.levelData._checkpointX = tx * TILE + TILE / 2 - p.w / 2;
            this.levelData._checkpointY = ty * TILE - p.h;
            this.audio.playSFX('flag');
            this.message = 'Checkpoint!';
            this.messageTimer = 90;
            // Activation particles
            for (let i = 0; i < 16; i++) {
              this.particles.push(new Particle(
                tx * TILE + TILE / 2, ty * TILE + 8,
                (Math.random() - 0.5) * 6, -(Math.random() * 5 + 1),
                i % 2 === 0 ? '#44AAFF' : '#FFD700', 30 + Math.random() * 20, 3
              ));
            }
          }
          return;
        }
      }
    }
  }

  checkOverlap(a, b) {
    if (!a.alive && a.alive !== undefined) return false;
    return a.x < b.x + b.w && a.x + a.w > b.x &&
           a.y < b.y + b.h && a.y + a.h > b.y;
  }

  // ===== TROLLS =====
  checkTrolls() {
    const px = this.player.x;
    for (const troll of this.trolls) {
      if (troll.triggered) continue;
      if (px >= troll.triggerX) {
        troll.triggered = true;
        this.executeTroll(troll);
      }
    }
  }

  executeTroll(troll) {
    switch (troll.action) {
      case 'spawn':
        this.entities.push({
          type: troll.entityType || 'goomba',
          x: troll.spawnX,
          y: troll.spawnY,
          vx: troll.entityType === 'flying' ? -1.5 : (troll.spawnX > this.player.x ? -2 : 2),
          vy: troll.entityType === 'flying' ? 0 : 0,
          w: 28, h: 28,
          alive: true,
          frame: 0,
          baseY: troll.spawnY,
        });
        break;

      case 'shake':
        this.screenShake = troll.duration || 15;
        break;

      case 'message':
        this.message = troll.text;
        this.messageTimer = troll.duration || 90;
        break;

      case 'fall_blocks':
        for (let i = 0; i < (troll.count || 3); i++) {
          this.fallingBlocks.push({
            x: (troll.startX || troll.triggerX) + i * 40,
            y: -32 - i * 20,
            vy: 2 + Math.random(),
            w: TILE, h: TILE,
          });
        }
        this.audio.playSFX('troll');
        break;
    }
  }

  updateCrumbling() {
    for (const [key, timer] of this.crumblingTiles) {
      const newTimer = timer - 1;
      if (newTimer <= 0) {
        const [tx, ty] = key.split(',').map(Number);
        this.tiles[ty][tx] = T.AIR;
        this.crumblingTiles.delete(key);
        // Particles
        for (let i = 0; i < 6; i++) {
          this.particles.push(new Particle(
            tx * TILE + 16, ty * TILE + 16,
            (Math.random() - 0.5) * 4, -(Math.random() * 3),
            '#228B22', 20, 3
          ));
        }
      } else {
        this.crumblingTiles.set(key, newTimer);
      }
    }
  }

  updateFallingBlocks() {
    for (let i = this.fallingBlocks.length - 1; i >= 0; i--) {
      const b = this.fallingBlocks[i];
      b.y += b.vy;
      b.vy += 0.1;

      // Check if player is hit
      if (this.player.alive &&
          this.player.x < b.x + b.w && this.player.x + PLAYER_W > b.x &&
          this.player.y < b.y + b.h && this.player.y + PLAYER_H > b.y) {
        this.killPlayer();
      }

      if (b.y > CH + 64) {
        this.fallingBlocks.splice(i, 1);
      }
    }
  }

  // ===== RENDER =====
  render() {
    const ctx = this.ctx;
    ctx.save();

    // Screen shake
    if (this.screenShake > 0) {
      ctx.translate(
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 8
      );
    }

    switch (this.state) {
      case STATES.INTRO: this.renderIntro(ctx); break;
      case STATES.MENU: this.renderMenu(ctx); break;
      case STATES.PLAYING: this.renderPlaying(ctx); break;
      case STATES.DEATH: this.renderDeath(ctx); break;
      case STATES.LEVEL_COMPLETE: this.renderLevelComplete(ctx); break;
      case STATES.GAME_OVER: this.renderGameOver(ctx); break;
      case STATES.STATS: this.renderStats(ctx); break;
      case STATES.CONFIG: this.renderConfig(ctx); break;
      case STATES.VICTORY: this.renderVictory(ctx); break;
      case STATES.PAUSED: this.renderPaused(ctx); break;
      case STATES.EDITOR: this.renderEditor(ctx); break;
      case STATES.CUSTOM_LEVELS: this.renderCustomLevels(ctx); break;
      case STATES.LOGIN: this.renderLogin(ctx); break;
      case STATES.NICKNAME_SETUP: this.renderNicknameSetup(ctx); break;
      case STATES.PROFILE: this.renderProfile(ctx); break;
    }

    ctx.restore();
  }

  // ----- RENDER INTRO -----
  renderIntro(ctx) {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, CW, CH);

    const alpha = Math.min(1, this.introTimer);
    ctx.globalAlpha = alpha;

    if (this.introPhase >= 1) {
      drawText(ctx, '🐱', CW / 2, 120, 60, '#FF8C00', 'center', true);
    }
    if (this.introPhase >= 2) {
      drawText(ctx, 'TRAP ARCHITECT', CW / 2, 200, 48, '#FF8C00', 'center', true);
      drawText(ctx, 'O Jogo Troll', CW / 2, 250, 24, '#FFB347', 'center', true);
    }
    if (this.introPhase >= 3) {
      drawText(ctx, 'Um gato. Nove vidas.', CW / 2, 320, 18, '#AAA', 'center');
      drawText(ctx, 'Nenhuma piedade.', CW / 2, 345, 18, '#AAA', 'center');
    }
    if (this.introPhase >= 4) {
      const blink = Math.floor(this.introTimer * 2) % 2;
      if (blink) {
        drawText(ctx, 'Pressione ENTER para continuar', CW / 2, 430, 16, '#666', 'center');
      }
    }

    ctx.globalAlpha = 1;
  }

  // ----- RENDER MENU -----
  renderMenu(ctx) {
    // Background
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, CW, CH);

    // Animated background elements
    for (let i = 0; i < 20; i++) {
      const bx = ((this.frame * 0.3 + i * 50) % (CW + 100)) - 50;
      const by = 50 + Math.sin(this.frame * 0.02 + i) * 30 + i * 22;
      ctx.globalAlpha = 0.1;
      ctx.fillStyle = '#FF8C00';
      ctx.fillRect(bx, by, 8, 8);
      ctx.globalAlpha = 1;
    }

    // Compute vertical layout to center content above footer
    const headerH = 120; // title + subtitle + cat
    const itemGap = 44;
    const itemsH = this.menuItems.length * itemGap;
    const contentGap = 20; // gap between header and items
    const footerRegion = 60; // reserved for bottom hints
    const totalH = headerH + contentGap + itemsH;
    const topY = Math.max(30, (CH - footerRegion - totalH) / 2);

    // Title
    drawText(ctx, 'TRAP ARCHITECT', CW / 2, topY + 20, 56, '#FF8C00', 'center', true);
    drawText(ctx, 'O Jogo Troll', CW / 2, topY + 64, 22, '#FFB347', 'center', true);

    // Draw a cat
    drawCat(ctx, CW / 2 - 11, topY + 78, 1, this.frame, true, false, 0);

    // Menu items
    const startY = topY + headerH + contentGap;
    for (let i = 0; i < this.menuItems.length; i++) {
      const selected = i === this.menuSelection;
      const y = startY + i * itemGap;

      if (selected) {
        // Animated selection highlight
        const selPulse = Math.sin(this.frame * 0.08) * 0.1 + 0.9;
        ctx.fillStyle = `rgba(255, 140, 0, ${0.15 * selPulse})`;
        drawRoundedRect(ctx, CW / 2 - 130, y - 17, 260, 38, 10);
        ctx.fill();
        ctx.strokeStyle = `rgba(255, 140, 0, ${0.6 * selPulse})`;
        ctx.lineWidth = 2;
        ctx.stroke();
        drawText(ctx, '► ' + this.menuItems[i], CW / 2, y, 24, '#FFD700', 'center', true);
        // Show level hint for Continue
        if (this.menuItems[i] === 'Continuar') {
          drawText(ctx, `Fase ${this.savedLevel + 1}`, CW / 2, y + 20, 12, 'rgba(255,180,0,0.6)', 'center');
        }
      } else {
        drawText(ctx, this.menuItems[i], CW / 2, y, 22, '#888', 'center');
      }
    }

    // Controls hint
    drawText(ctx, '↑↓ Navegar    ENTER Selecionar', CW / 2, CH - 30, 13, '#555', 'center');
    drawText(ctx, '←→/AD Mover    ↑/W/ESPAÇO Pular    ESC Pausar', CW / 2, CH - 50, 11, '#444', 'center');

    // Logged-in indicator (top-right corner)
    if (auth.isLoggedIn && auth.profile) {
      const rank = auth.getCreatorRank();
      drawText(ctx, auth.profile.nickname, CW - 20, 20, 13, '#FFD700', 'right');
      drawText(ctx, rank.title, CW - 20, 36, 10, rank.color, 'right');
    }
  }

  // ----- RENDER PLAYING -----
  renderPlaying(ctx) {
    const camX = Math.floor(this.camera.x);

    // Sky
    ctx.fillStyle = this.levelData ? this.levelData.bgColor : '#5c94fc';
    ctx.fillRect(0, 0, CW, CH);

    // Background clouds
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    for (let i = 0; i < 8; i++) {
      const cx = ((i * 150 - camX * 0.2) % (CW + 200)) - 100;
      const cy = 40 + i * 30 + Math.sin(i * 2) * 20;
      ctx.beginPath();
      ctx.arc(cx, cy, 20, 0, Math.PI * 2);
      ctx.arc(cx + 25, cy - 5, 25, 0, Math.PI * 2);
      ctx.arc(cx + 50, cy, 20, 0, Math.PI * 2);
      ctx.fill();
    }

    // Background hills
    ctx.fillStyle = 'rgba(34, 139, 34, 0.2)';
    for (let i = 0; i < 6; i++) {
      const hx = ((i * 250 - camX * 0.3) % (CW + 400)) - 200;
      ctx.beginPath();
      ctx.arc(hx + 80, CH - 30, 100 + i * 10, 0, Math.PI, true);
      ctx.fill();
    }

    // Tiles
    const startTX = Math.floor(camX / TILE);
    const endTX = Math.ceil((camX + CW) / TILE);
    const height = this.levelData ? this.levelData.height : 15;

    for (let ty = 0; ty < height; ty++) {
      for (let tx = startTX; tx <= endTX; tx++) {
        const tile = this.getTile(tx, ty);
        if (tile !== T.AIR) {
          const drawX = tx * TILE - camX;
          const drawY = ty * TILE;

          // Crumbling effect
          const key = `${tx},${ty}`;
          if (this.crumblingTiles.has(key)) {
            const timer = this.crumblingTiles.get(key);
            ctx.save();
            ctx.globalAlpha = timer / 20;
            const shake = (20 - timer) * 0.5;
            ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
            drawTile(ctx, tile, drawX, drawY, this.frame);
            ctx.restore();
          } else {
            if (tile === T.CHECKPOINT) {
              drawTile._cpActivated = this.activatedCheckpoints.has(key);
            }
            drawTile(ctx, tile, drawX, drawY, this.frame);
          }
        }
      }
    }

    // Falling blocks
    for (const b of this.fallingBlocks) {
      drawTile(ctx, T.BRICK, b.x - camX, b.y, this.frame);
    }

    // Entities
    for (const e of this.entities) {
      if (!e.alive && e.type !== 'flag' && e.type !== 'fake_flag') continue;
      const ex = e.x - camX;
      const ey = e.type === 'coin' ? e.y + Math.sin(this.frame * 0.08) * 4 : e.y;

      switch (e.type) {
        case 'goomba':
        case 'fast_goomba':
          drawGoomba(ctx, ex, ey, e.type, e.frame);
          break;
        case 'spiny':
          drawSpiny(ctx, ex, ey, e.frame);
          break;
        case 'flying':
          drawFlying(ctx, ex, ey, e.frame);
          break;
        case 'coin':
          if (e.alive) drawCoin(ctx, ex, ey, this.frame);
          break;
        case 'flag':
          drawFlag(ctx, ex, ey, false, this.frame);
          break;
        case 'fake_flag':
          drawFlag(ctx, ex, ey, true, this.frame);
          break;
      }
    }

    // Player
    const p = this.player;
    if (p.alive) {
      drawCat(ctx, p.x - camX, p.y, p.dir, p.frame, true, p.invincible, p.invTimer, p.grounded, p.vy);
    }

    // Particles
    for (const pt of this.particles) pt.draw(ctx, camX);

    // Message overlay
    if (this.messageTimer > 0 && this.message) {
      const fadeIn = Math.min(1, this.messageTimer > 10 ? 1 : this.messageTimer / 10);
      ctx.save();
      ctx.globalAlpha = fadeIn;
      const mw = 500;
      const mh = 44;
      const mx = CW / 2 - mw / 2;
      const my = 56;
      ctx.fillStyle = 'rgba(0,0,0,0.8)';
      drawRoundedRect(ctx, mx, my, mw, mh, 10);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,200,0,0.4)';
      ctx.lineWidth = 1;
      ctx.stroke();
      drawText(ctx, this.message, CW / 2, my + mh / 2, 16, '#FFD700', 'center');
      ctx.restore();
    }

    // HUD
    this.renderHUD(ctx);
  }

  // ----- HUD -----
  renderHUD(ctx) {
    // Gradient bar background
    const grad = ctx.createLinearGradient(0, 0, 0, 44);
    grad.addColorStop(0, 'rgba(0,0,0,0.75)');
    grad.addColorStop(1, 'rgba(0,0,0,0.05)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, CW, 44);

    // Bottom accent line
    ctx.fillStyle = 'rgba(255,140,0,0.25)';
    ctx.fillRect(0, 42, CW, 2);

    // Cat icon + infinite lives with death pulse
    ctx.save();
    const deathScale = 1 + (this.hudDeathPulse / 20) * 0.3;
    ctx.translate(28, 20);
    ctx.scale(deathScale, deathScale);
    ctx.translate(-28, -20);
    drawCat(ctx, 8, 6, 1, this.frame, true, false, 0);
    drawText(ctx, '\u00d7 \u221e', 52, 20, 16, this.hudDeathPulse > 0 ? '#FF6666' : '#FFF', 'left', true);
    ctx.restore();

    // Coins with pulse animation
    ctx.save();
    const coinScale = 1 + (this.hudCoinPulse / 15) * 0.4;
    ctx.translate(136, 20);
    ctx.scale(coinScale, coinScale);
    ctx.translate(-136, -20);
    drawCoin(ctx, 110, 12, this.frame);
    drawText(ctx, `\u00d7 ${this.hudCoinsDisplay}`, 136, 20, 16, '#FFD700', 'left', true);
    ctx.restore();

    // Level name in HUD (small)
    if (this.levelData) {
      drawText(ctx, this.levelData.name, CW / 2, 20, 15, 'rgba(255,255,255,0.8)', 'center', true);
    }

    // Level name + subtitle overlay (animated fade on level start)
    if (this.levelData && this.levelNameTimer > 0) {
      let alpha;
      if (this.levelNameTimer > 150) alpha = (180 - this.levelNameTimer) / 30;
      else if (this.levelNameTimer > 30) alpha = 1;
      else alpha = this.levelNameTimer / 30;

      ctx.save();
      ctx.globalAlpha = alpha;
      const boxW = 340;
      const boxH = 70;
      const boxX = CW / 2 - boxW / 2;
      const boxY = CH / 2 - boxH / 2 - 40;
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      drawRoundedRect(ctx, boxX, boxY, boxW, boxH, 12);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,140,0,0.5)';
      ctx.lineWidth = 2;
      ctx.stroke();
      drawText(ctx, this.levelData.name, CW / 2, boxY + 24, 28, '#FF8C00', 'center', true);
      if (this.levelData.subtitle) {
        drawText(ctx, this.levelData.subtitle, CW / 2, boxY + 52, 16, '#FFB347', 'center');
      }
      ctx.restore();
    }

    // Time
    const mins = Math.floor(this.levelTime / 60);
    const secs = Math.floor(this.levelTime % 60);
    drawText(ctx, `${mins}:${secs.toString().padStart(2, '0')}`, CW - 24, 20, 15, 'rgba(255,255,255,0.8)', 'right', true);

    // Pause hint
    drawText(ctx, 'ESC', CW - 24, 36, 9, 'rgba(255,255,255,0.25)', 'right');
  }

  // ----- RENDER DEATH -----
  renderDeath(ctx) {
    // Render the level in background
    this.renderPlaying(ctx);

    // Draw dead cat flying up
    const p = this.player;
    const camX = Math.floor(this.camera.x);
    drawCat(ctx, p.x - camX, p.y, p.dir, 0, false, false, 0, false, p.vy);

    // Dark overlay
    const alpha = Math.min(0.6, this.deathTimer * 0.3);
    ctx.fillStyle = `rgba(0,0,0,${alpha})`;
    ctx.fillRect(0, 0, CW, CH);

    // Death text
    if (this.deathTimer > 0.5) {
      const scale = Math.min(1, (this.deathTimer - 0.5) * 2);
      ctx.save();
      ctx.translate(CW / 2, CH / 2 - 20);
      ctx.scale(scale, scale);
      drawText(ctx, 'VOCÊ MORREU!', 0, 0, 48, '#FF4444', 'center', true);
      ctx.restore();

      // Troll messages
      const messages = [
        'Não foi dessa vez...',
        'Tente de novo, vai!',
        'Isso é normal aqui.',
        'O gato tem mais vidas!',
        'Surpresa! 😈',
        'Confia no processo...',
        'Não era pra fazer isso.',
        'F no chat.',
        'Que pena... ou não.',
      ];
      const msg = messages[this.stats.totalDeaths % messages.length];

      if (this.deathTimer > 1) {
        drawText(ctx, msg, CW / 2, CH / 2 + 40, 20, '#AAA', 'center');
      }

      if (this.deathTimer > 1.5) {
        const blink = Math.floor(this.deathTimer * 2) % 2;
        if (blink) {
          drawText(ctx, 'Vidas: \u221e  \u2014  Pressione ENTER', CW / 2, CH / 2 + 80, 16, '#888', 'center');
        }
      }
    }
  }

  // ----- RENDER LEVEL COMPLETE -----
  renderLevelComplete(ctx) {
    this.renderPlaying(ctx);

    const overlayAlpha = Math.min(0.6, this.levelCompleteTimer * 0.4);
    ctx.fillStyle = `rgba(0,0,0,${overlayAlpha})`;
    ctx.fillRect(0, 0, CW, CH);

    // Animated scale with ease-out
    const t = Math.min(1, this.levelCompleteTimer);
    const bounce = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    // Box background
    const boxW = 380;
    const boxH = 200;
    const boxX = CW / 2 - boxW / 2;
    const boxY = CH / 2 - boxH / 2 - 10;
    ctx.save();
    ctx.globalAlpha = bounce;
    ctx.fillStyle = 'rgba(0,40,0,0.9)';
    drawRoundedRect(ctx, boxX, boxY, boxW, boxH, 14);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,255,0,0.5)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.translate(CW / 2, boxY + 40);
    ctx.scale(bounce, bounce);
    drawText(ctx, '\u2713 FASE COMPLETA!', 0, 0, 36, '#00FF00', 'center', true);
    ctx.restore();

    if (this.levelCompleteTimer > 0.8) {
      const statsAlpha = Math.min(1, (this.levelCompleteTimer - 0.8) * 3);
      ctx.globalAlpha = statsAlpha;
      drawText(ctx, `Moedas: ${this.coins}`, CW / 2, boxY + 80, 20, '#FFD700', 'center', true);
      const mins = Math.floor(this.levelTime / 60);
      const secs = Math.floor(this.levelTime % 60);
      drawText(ctx, `Tempo: ${mins}:${secs.toString().padStart(2, '0')}`, CW / 2, boxY + 110, 20, '#FFF', 'center', true);
      drawText(ctx, `Mortes nesta fase: ${this.stats.deathsPerLevel[this.currentLevel]}`, CW / 2, boxY + 140, 16, '#AAA', 'center');
      if (this.levelCompleteTimer > 1.5) {
        const blink = Math.floor(this.levelCompleteTimer * 2) % 2;
        if (blink) {
          drawText(ctx, 'Pressione ENTER para continuar', CW / 2, boxY + 175, 14, 'rgba(255,255,255,0.5)', 'center');
        }
      }
      ctx.globalAlpha = 1;
    }

    for (const pt of this.particles) pt.draw(ctx, 0);
  }

  // ----- RENDER GAME OVER -----
  renderGameOver(ctx) {
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, CW, CH);

    // Glitch effect
    for (let i = 0; i < 5; i++) {
      const gy = Math.random() * CH;
      ctx.fillStyle = `rgba(255,0,0,${Math.random() * 0.1})`;
      ctx.fillRect(0, gy, CW, 2);
    }

    drawText(ctx, 'GAME OVER', CW / 2, CH / 2 - 60, 56, '#FF0000', 'center', true);

    // Sad cat
    drawCat(ctx, CW / 2 - 11, CH / 2 - 20, 1, 0, false, false, 0);

    drawText(ctx, `Total de mortes: ${this.stats.totalDeaths}`, CW / 2, CH / 2 + 40, 20, '#888', 'center');
    drawText(ctx, `Moedas coletadas: ${this.stats.coinsCollected}`, CW / 2, CH / 2 + 70, 20, '#888', 'center');

    const blink = Math.floor(this.frame / 30) % 2;
    if (blink) {
      drawText(ctx, 'Pressione ENTER para voltar ao menu', CW / 2, CH / 2 + 130, 16, '#555', 'center');
    }
  }

  // ----- RENDER STATS -----
  renderStats(ctx) {
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, CW, CH);

    drawText(ctx, 'ESTATÍSTICAS', CW / 2, 50, 36, '#FF8C00', 'center', true);

    const stats = [
      ['Total de Mortes', this.stats.totalDeaths],
      ['Mortes - Meu N\u00edvel', this.stats.deathsPerLevel[0]],
      ['Mortes - Fase 1', this.stats.deathsPerLevel[1]],
      ['Mortes - Fase 2', this.stats.deathsPerLevel[2]],
      ['Mortes - Fase 3', this.stats.deathsPerLevel[3]],
      ['Moedas Coletadas', this.stats.coinsCollected],
      ['Fases Completadas', `${this.stats.levelsCompleted}/${LEVELS.length}`],
      ['Tentativas', this.stats.attempts],
      ['Tempo Total', this.formatTime(this.stats.timePlayed)],
    ];

    const startY = 120;
    for (let i = 0; i < stats.length; i++) {
      const y = startY + i * 40;
      ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.03)' : 'transparent';
      ctx.fillRect(150, y - 14, 500, 32);

      drawText(ctx, stats[i][0], 180, y, 18, '#AAA', 'left');
      drawText(ctx, String(stats[i][1]), 620, y, 18, '#FFD700', 'right');
    }

    drawText(ctx, 'Pressione ESC ou ENTER para voltar', CW / 2, CH - 40, 14, '#555', 'center');
  }

  // ----- RENDER CONFIG -----
  renderConfig(ctx) {
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, CW, CH);

    drawText(ctx, 'CONFIGURAÇÕES', CW / 2, 50, 36, '#FF8C00', 'center', true);

    // Music volume
    const musicY = 150;
    const sfxY = 230;
    const items = [
      { label: 'Volume da Música', value: this.config.musicVolume, y: musicY },
      { label: 'Volume dos Efeitos', value: this.config.sfxVolume, y: sfxY },
    ];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const selected = i === this.configSelection;
      const color = selected ? '#FFD700' : '#888';

      if (selected) {
        ctx.fillStyle = 'rgba(255,140,0,0.1)';
        ctx.fillRect(150, item.y - 30, 500, 60);
      }

      drawText(ctx, (selected ? '► ' : '  ') + item.label, 180, item.y - 10, 20, color, 'left');

      // Volume bar
      const barX = 200;
      const barW = 400;
      const barH = 16;
      const barY = item.y + 12;
      ctx.fillStyle = '#333';
      ctx.fillRect(barX, barY, barW, barH);
      ctx.fillStyle = selected ? '#FF8C00' : '#666';
      ctx.fillRect(barX, barY, barW * item.value, barH);
      ctx.strokeStyle = '#555';
      ctx.lineWidth = 1;
      ctx.strokeRect(barX, barY, barW, barH);

      drawText(ctx, Math.round(item.value * 100) + '%', barX + barW + 30, barY + 8, 16, color, 'left');
    }

    // Controls info
    drawText(ctx, 'CONTROLES', CW / 2, 320, 24, '#FF8C00', 'center', true);

    const controls = [
      ['←→ / A D', 'Mover'],
      ['↑ / W / ESPAÇO', 'Pular'],
      ['ESC / P', 'Pausar'],
    ];

    for (let i = 0; i < controls.length; i++) {
      const y = 358 + i * 26;
      drawText(ctx, controls[i][0], 280, y, 15, '#AAA', 'right');
      drawText(ctx, controls[i][1], 320, y, 15, '#FFD700', 'left');
    }

    drawText(ctx, '←→ Ajustar Volume    ↑↓ Navegar    ESC Voltar', CW / 2, CH - 25, 13, '#555', 'center');
  }

  // ----- RENDER VICTORY -----
  renderVictory(ctx) {
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, CW, CH);

    // Particles
    for (const pt of this.particles) pt.draw(ctx, 0);

    // Pulsing title
    const pulse = 1 + Math.sin(this.frame * 0.05) * 0.05;
    ctx.save();
    ctx.translate(CW / 2, 100);
    ctx.scale(pulse, pulse);
    drawText(ctx, '🎉 PARABÉNS! 🎉', 0, 0, 44, '#FFD700', 'center', true);
    ctx.restore();

    drawText(ctx, 'Você completou todas as fases!', CW / 2, 170, 22, '#FFF', 'center');

    // Victory cat
    drawCat(ctx, CW / 2 - 11, 200, 1, this.frame, true, false, 0);

    // Stats summary
    drawText(ctx, `Total de mortes: ${this.stats.totalDeaths}`, CW / 2, 270, 20, '#AAA', 'center');
    drawText(ctx, `Moedas coletadas: ${this.stats.coinsCollected}`, CW / 2, 300, 20, '#FFD700', 'center');
    drawText(ctx, `Tempo total: ${this.formatTime(this.stats.timePlayed)}`, CW / 2, 330, 20, '#AAA', 'center');

    // Rating
    const deaths = this.stats.totalDeaths;
    let rating, ratingColor;
    if (deaths === 0) { rating = 'IMPOSSÍVEL! Você hackeou?!'; ratingColor = '#FF00FF'; }
    else if (deaths <= 5) { rating = 'Mestre dos Trolls! S+'; ratingColor = '#FFD700'; }
    else if (deaths <= 15) { rating = 'Muito Bom! A'; ratingColor = '#00FF00'; }
    else if (deaths <= 30) { rating = 'Nada Mal! B'; ratingColor = '#44AAFF'; }
    else if (deaths <= 50) { rating = 'Persistente! C'; ratingColor = '#FFAA00'; }
    else { rating = 'Sofredor Profissional! D'; ratingColor = '#FF4444'; }

    drawText(ctx, rating, CW / 2, 380, 24, ratingColor, 'center', true);

    const blink = Math.floor(this.frame / 30) % 2;
    if (blink) {
      drawText(ctx, 'Pressione ENTER para voltar ao menu', CW / 2, CH - 40, 16, '#555', 'center');
    }
  }

  // ----- RENDER PAUSED -----
  renderPaused(ctx) {
    this.renderPlaying(ctx);

    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, CW, CH);

    // Pause box
    const boxW = 300;
    const pauseItemGap = 46;
    const pauseContentH = 50 + 10 + this.pauseItems.length * pauseItemGap + 30;
    const boxH = Math.max(180, pauseContentH);
    const boxX = CW / 2 - boxW / 2;
    const boxY = CH / 2 - boxH / 2;

    // Box shadow
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    drawRoundedRect(ctx, boxX + 4, boxY + 4, boxW, boxH, 16);
    ctx.fill();

    // Box background
    ctx.fillStyle = 'rgba(20,20,40,0.95)';
    drawRoundedRect(ctx, boxX, boxY, boxW, boxH, 16);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,140,0,0.6)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Title
    drawText(ctx, 'PAUSADO', CW / 2, boxY + 36, 36, '#FF8C00', 'center', true);

    // Divider
    ctx.fillStyle = 'rgba(255,140,0,0.3)';
    ctx.fillRect(boxX + 30, boxY + 58, boxW - 60, 1);

    // Menu items – vertically centered in remaining space
    const pauseItemsTop = boxY + 68;
    const pauseItemsArea = boxH - 68 - 30;
    const pauseItemsOffset = (pauseItemsArea - this.pauseItems.length * pauseItemGap) / 2;

    for (let i = 0; i < this.pauseItems.length; i++) {
      const sel = i === this.pauseSelection;
      const iy = pauseItemsTop + pauseItemsOffset + i * pauseItemGap + pauseItemGap / 2;

      if (sel) {
        ctx.fillStyle = 'rgba(255,140,0,0.15)';
        drawRoundedRect(ctx, boxX + 24, iy - 15, boxW - 48, 32, 8);
        ctx.fill();
        ctx.strokeStyle = '#FF8C00';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      const color = sel ? '#FFD700' : '#888';
      const prefix = sel ? '\u25ba ' : '  ';
      drawText(ctx, prefix + this.pauseItems[i], CW / 2, iy, 22, color, 'center', true);
    }

    // Hint
    drawText(ctx, '\u2191\u2193 Navegar    ENTER Selecionar    ESC Voltar', CW / 2, boxY + boxH - 14, 11, 'rgba(255,255,255,0.3)', 'center');
  }

  // ===== UTILS =====
  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  // ===== LOGIN SCREEN =====
  updateLogin() {
    if (consumeKey('Escape')) {
      this.state = STATES.MENU;
      this.updateMenuItems();
      return;
    }
    if (auth.isLoggingIn) return; // Wait for popup

    if (consumeKey('ArrowUp') || consumeKey('KeyW')) {
      this.loginSelection = (this.loginSelection - 1 + this.loginItems.length) % this.loginItems.length;
      this.audio.playSFX('select');
    }
    if (consumeKey('ArrowDown') || consumeKey('KeyS')) {
      this.loginSelection = (this.loginSelection + 1) % this.loginItems.length;
      this.audio.playSFX('select');
    }

    if (consumeKey('Enter') || consumeKey('Space')) {
      this.audio.playSFX('confirm');
      const item = this.loginItems[this.loginSelection];
      if (item === 'Google') {
        auth.loginWithGoogle().then(() => this._afterLogin());
      } else if (item === 'GitHub') {
        auth.loginWithGitHub().then(() => this._afterLogin());
      } else if (item === 'Voltar') {
        this.state = STATES.MENU;
        this.updateMenuItems();
      }
    }
  }

  _afterLogin() {
    if (auth.user && auth.needsNickname) {
      this.nicknameInput = '';
      this.nicknameError = '';
      this.state = STATES.NICKNAME_SETUP;
    } else if (auth.isLoggedIn) {
      this.state = STATES.MENU;
      this.updateMenuItems();
    }
    // If login failed, stay on login screen (error shown via auth.loginError)
  }

  renderLogin(ctx) {
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, CW, CH);

    drawText(ctx, 'ENTRAR', CW / 2, 60, 40, '#FF8C00', 'center', true);
    drawText(ctx, 'Conecte-se para publicar níveis,', CW / 2, 110, 16, '#AAA', 'center');
    drawText(ctx, 'ganhar recompensas e muito mais!', CW / 2, 132, 16, '#AAA', 'center');

    // Cat icon
    drawCat(ctx, CW / 2 - 11, 155, 1, this.frame, true, false, 0);

    // Login options
    const startY = 220;
    const gap = 56;
    const colors = { Google: '#4285F4', GitHub: '#FFF', Voltar: '#888' };

    for (let i = 0; i < this.loginItems.length; i++) {
      const sel = i === this.loginSelection;
      const y = startY + i * gap;
      const item = this.loginItems[i];

      if (sel) {
        ctx.fillStyle = 'rgba(255,140,0,0.12)';
        drawRoundedRect(ctx, CW / 2 - 140, y - 20, 280, 44, 10);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,140,0,0.5)';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      const label = item === 'Voltar' ? '← Voltar' : `Entrar com ${item}`;
      const c = sel ? '#FFD700' : colors[item] || '#888';
      const prefix = sel ? '► ' : '  ';
      drawText(ctx, prefix + label, CW / 2, y, 22, c, 'center', sel);
    }

    // Loading indicator
    if (auth.isLoggingIn) {
      const dots = '.'.repeat(Math.floor(this.frame / 20) % 4);
      drawText(ctx, 'Conectando' + dots, CW / 2, startY + this.loginItems.length * gap + 20, 16, '#FF8C00', 'center');
    }

    // Error
    if (auth.loginError) {
      drawText(ctx, auth.loginError, CW / 2, startY + this.loginItems.length * gap + 20, 16, '#FF4444', 'center');
    }

    drawText(ctx, '↑↓ Navegar    ENTER Selecionar    ESC Voltar', CW / 2, CH - 30, 13, '#555', 'center');
  }

  // ===== NICKNAME SETUP SCREEN =====
  updateNicknameSetup() {
    if (this.nicknameSaving) return;

    // Handle text input
    // We capture key events for typing
    if (consumeKey('Backspace')) {
      this.nicknameInput = this.nicknameInput.slice(0, -1);
      this.nicknameError = '';
    }

    if (consumeKey('Enter') || consumeKey('NumpadEnter')) {
      if (this.nicknameInput.length >= 3) {
        this.nicknameSaving = true;
        this.nicknameError = '';
        auth.createProfile(this.nicknameInput).then((result) => {
          this.nicknameSaving = false;
          if (result.ok) {
            this.audio.playSFX('flag');
            this.state = STATES.MENU;
            this.updateMenuItems();
          } else {
            this.nicknameError = result.error;
            this.audio.playSFX('death');
          }
        });
      } else {
        this.nicknameError = 'Mínimo 3 caracteres';
      }
    }

    if (consumeKey('Escape')) {
      // Can't skip nickname — log out and go back
      auth.logout();
      this.state = STATES.LOGIN;
      return;
    }
  }

  // Keyboard listener for nickname typing (attached once)
  _initNicknameInput() {
    if (this._nicknameInputReady) return;
    this._nicknameInputReady = true;
    document.addEventListener('keypress', (e) => {
      if (this.state !== STATES.NICKNAME_SETUP) return;
      if (this.nicknameSaving) return;
      if (e.key.length === 1 && this.nicknameInput.length < 16) {
        const ch = e.key;
        // Only allow valid nickname chars
        if (/^[a-zA-Z0-9_\-\u00C0-\u024F]$/.test(ch)) {
          this.nicknameInput += ch;
          this.nicknameError = '';
        }
      }
    });
  }

  renderNicknameSetup(ctx) {
    this._initNicknameInput();

    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, CW, CH);

    drawText(ctx, 'ESCOLHA SEU NICKNAME', CW / 2, 60, 32, '#FF8C00', 'center', true);
    drawText(ctx, 'Esse nome será visto por outros jogadores', CW / 2, 100, 15, '#AAA', 'center');

    // Cat
    drawCat(ctx, CW / 2 - 11, 125, 1, this.frame, true, false, 0);

    // Input box
    const boxW = 340;
    const boxH = 50;
    const boxX = CW / 2 - boxW / 2;
    const boxY = 190;

    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    drawRoundedRect(ctx, boxX, boxY, boxW, boxH, 10);
    ctx.fill();
    ctx.strokeStyle = this.nicknameError ? '#FF4444' : 'rgba(255,140,0,0.5)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Input text with cursor
    const cursor = Math.floor(this.frame / 30) % 2 === 0 ? '|' : '';
    const displayText = this.nicknameInput + cursor;
    drawText(ctx, displayText || cursor, CW / 2, boxY + boxH / 2, 26, '#FFF', 'center');

    // Character count
    const countColor = this.nicknameInput.length < 3 ? '#FF6666' : '#666';
    drawText(ctx, `${this.nicknameInput.length}/16`, boxX + boxW - 10, boxY + boxH + 16, 12, countColor, 'right');

    // Rules
    drawText(ctx, 'Letras, números, _ e - (3-16 caracteres)', CW / 2, boxY + boxH + 30, 13, '#666', 'center');

    // Error message
    if (this.nicknameError) {
      drawText(ctx, this.nicknameError, CW / 2, boxY + boxH + 55, 16, '#FF4444', 'center');
    }

    // Saving indicator
    if (this.nicknameSaving) {
      const dots = '.'.repeat(Math.floor(this.frame / 20) % 4);
      drawText(ctx, 'Salvando' + dots, CW / 2, boxY + boxH + 80, 16, '#FF8C00', 'center');
    }

    // Preview card
    if (this.nicknameInput.length >= 3) {
      const cardY = 320;
      ctx.fillStyle = 'rgba(255,255,255,0.04)';
      drawRoundedRect(ctx, CW / 2 - 150, cardY, 300, 80, 12);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,140,0,0.2)';
      ctx.lineWidth = 1;
      ctx.stroke();

      drawText(ctx, 'Preview do Perfil', CW / 2, cardY + 16, 11, '#666', 'center');
      drawCat(ctx, CW / 2 - 80, cardY + 28, 1, this.frame, true, false, 0);
      drawText(ctx, this.nicknameInput, CW / 2 - 40, cardY + 42, 20, '#FFD700', 'left', true);
      drawText(ctx, CREATOR_RANKS[0].title, CW / 2 - 40, cardY + 62, 13, CREATOR_RANKS[0].color, 'left');
    }

    drawText(ctx, 'ENTER Confirmar    ESC Voltar', CW / 2, CH - 30, 13, '#555', 'center');
  }

  // ===== PROFILE SCREEN =====
  updateProfile() {
    if (consumeKey('Escape')) {
      this.state = STATES.MENU;
      this.updateMenuItems();
      return;
    }

    const items = ['Voltar', 'Sair da Conta'];
    if (consumeKey('ArrowUp') || consumeKey('KeyW')) {
      this.profileSelection = (this.profileSelection - 1 + items.length) % items.length;
      this.audio.playSFX('select');
    }
    if (consumeKey('ArrowDown') || consumeKey('KeyS')) {
      this.profileSelection = (this.profileSelection + 1) % items.length;
      this.audio.playSFX('select');
    }

    if (consumeKey('Enter') || consumeKey('Space')) {
      this.audio.playSFX('confirm');
      if (this.profileSelection === 0) {
        this.state = STATES.MENU;
        this.updateMenuItems();
      } else if (this.profileSelection === 1) {
        auth.logout();
        this.state = STATES.MENU;
        this.updateMenuItems();
      }
    }
  }

  renderProfile(ctx) {
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, CW, CH);

    if (!auth.profile) {
      drawText(ctx, 'Carregando perfil...', CW / 2, CH / 2, 20, '#AAA', 'center');
      return;
    }

    const p = auth.profile;
    const rank = auth.getCreatorRank();

    // Header card
    ctx.fillStyle = 'rgba(255,255,255,0.04)';
    drawRoundedRect(ctx, 60, 30, CW - 120, 120, 14);
    ctx.fill();
    ctx.strokeStyle = rank.color;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Avatar (cat)
    drawCat(ctx, 90, 55, 1, this.frame, true, false, 0);

    // Name & rank
    drawText(ctx, p.nickname, 140, 65, 28, '#FFF', 'left', true);
    drawText(ctx, rank.title, 140, 95, 16, rank.color, 'left', true);

    // Creator coins
    drawText(ctx, `🪙 ${p.creatorCoins || 0}`, 140, 120, 14, '#FFD700', 'left');

    // Stats grid
    const statsY = 175;
    drawText(ctx, 'ESTATÍSTICAS DO CRIADOR', CW / 2, statsY, 20, '#FF8C00', 'center', true);

    const creatorStats = [
      ['Níveis Publicados', p.levelsPublished || 0],
      ['Plays Totais', p.totalPlays || 0],
      ['Curtidas Totais', p.totalLikes || 0],
      ['Moedas de Criador', p.creatorCoins || 0],
      ['Dev\'s Choice', p.devsChoiceCount || 0],
    ];

    for (let i = 0; i < creatorStats.length; i++) {
      const y = statsY + 30 + i * 32;
      ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.03)' : 'transparent';
      ctx.fillRect(120, y - 12, CW - 240, 28);
      drawText(ctx, creatorStats[i][0], 140, y, 16, '#AAA', 'left');
      drawText(ctx, String(creatorStats[i][1]), CW - 140, y, 16, '#FFD700', 'right');
    }

    // Rank progress
    const progY = statsY + 30 + creatorStats.length * 32 + 20;
    const nextRank = CREATOR_RANKS.find(r => r.level === rank.level + 1);
    if (nextRank) {
      drawText(ctx, `Próximo: ${nextRank.title}`, CW / 2, progY, 14, nextRank.color, 'center');
      const req = [];
      if (p.levelsPublished < nextRank.minLevels) req.push(`${nextRank.minLevels - p.levelsPublished} níveis`);
      if ((p.totalPlays || 0) < nextRank.minPlays) req.push(`${nextRank.minPlays - (p.totalPlays || 0)} plays`);
      if ((p.totalLikes || 0) < nextRank.minLikes) req.push(`${nextRank.minLikes - (p.totalLikes || 0)} likes`);
      if (nextRank.needsChoice && !p.devsChoiceCount) req.push("Dev's Choice");
      drawText(ctx, `Falta: ${req.join(', ')}`, CW / 2, progY + 22, 12, '#666', 'center');
    } else {
      drawText(ctx, '★ Rank Máximo Alcançado! ★', CW / 2, progY, 16, '#FFD700', 'center', true);
    }

    // Action buttons
    const items = ['Voltar', 'Sair da Conta'];
    const btnY = CH - 80;
    for (let i = 0; i < items.length; i++) {
      const sel = i === this.profileSelection;
      const x = CW / 2 - 100 + i * 200;
      const c = sel ? '#FFD700' : '#888';

      if (sel) {
        ctx.fillStyle = 'rgba(255,140,0,0.12)';
        drawRoundedRect(ctx, x - 70, btnY - 14, 140, 32, 8);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,140,0,0.4)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      const label = sel ? '► ' + items[i] : items[i];
      const itemColor = items[i] === 'Sair da Conta' && sel ? '#FF6666' : c;
      drawText(ctx, label, x, btnY, 18, itemColor, 'center', sel);
    }

    drawText(ctx, '←→ Navegar    ENTER Selecionar    ESC Voltar', CW / 2, CH - 25, 12, '#555', 'center');
  }
}

// ===== EDITOR MIXIN =====
initEditorMixin(Game);

// ===== INITIALIZE =====
let game;
window.addEventListener('load', () => {
  game = new Game();
});
