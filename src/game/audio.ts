// ============================================================
// Procedural Sound Effects — Web Audio API synthesized sounds
// No external assets needed
// ============================================================

let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!audioCtx) audioCtx = new AudioContext();
  return audioCtx;
}

export function isSoundEnabled(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem("trap_sound_enabled") !== "false";
}

export function playJump(): void {
  if (!isSoundEnabled()) return;
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.frequency.setValueAtTime(300, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.1);
  gain.gain.setValueAtTime(0.15, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.15);
}

export function playDeath(): void {
  if (!isSoundEnabled()) return;
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sawtooth";
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.frequency.setValueAtTime(400, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.5);
  gain.gain.setValueAtTime(0.15, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.5);
}

export function playCoin(): void {
  if (!isSoundEnabled()) return;
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.frequency.setValueAtTime(800, ctx.currentTime);
  osc.frequency.setValueAtTime(1000, ctx.currentTime + 0.05);
  gain.gain.setValueAtTime(0.12, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.15);
}

export function playComplete(): void {
  if (!isSoundEnabled()) return;
  const ctx = getCtx();
  const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.12);
    gain.gain.setValueAtTime(0.12, ctx.currentTime + i * 0.12);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.12 + 0.3);
    osc.start(ctx.currentTime + i * 0.12);
    osc.stop(ctx.currentTime + i * 0.12 + 0.3);
  });
}

export function playSpring(): void {
  if (!isSoundEnabled()) return;
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.frequency.setValueAtTime(200, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.15);
  gain.gain.setValueAtTime(0.12, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.2);
}

export function playStomp(): void {
  if (!isSoundEnabled()) return;
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "square";
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.frequency.setValueAtTime(200, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + 0.12);
  gain.gain.setValueAtTime(0.1, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.12);
}

// ============================================================
// Procedural Background Music — Web Audio API synthesized 8-bit BGM
// ============================================================

type BGMTheme = "menu" | "easy" | "medium" | "hard" | "editor";

interface NoteSequence {
  notes: number[];
  durations: number[];
  waveform: OscillatorType;
  volume: number;
}

interface ThemeDef {
  bpm: number;
  bass: NoteSequence;
  melody: NoteSequence;
}

// Note frequencies (C major / minor scale, various octaves)
const N = {
  C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, G3: 196.00, A3: 220.00, B3: 246.94,
  C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.00, A4: 440.00, B4: 493.88,
  C5: 523.25, D5: 587.33, E5: 659.25, G5: 783.99,
  R: 0, // rest
};

const BGM_THEMES: Record<BGMTheme, ThemeDef> = {
  menu: {
    bpm: 100,
    bass: {
      notes:     [N.C3, N.R, N.G3, N.R, N.A3, N.R, N.G3, N.R, N.F3, N.R, N.E3, N.R, N.F3, N.R, N.G3, N.R],
      durations: [1,    1,   1,    1,   1,    1,   1,    1,   1,    1,   1,    1,   1,    1,   1,    1],
      waveform: "triangle",
      volume: 0.06,
    },
    melody: {
      notes:     [N.E4, N.G4, N.C5, N.R, N.B4, N.G4, N.E4, N.R, N.F4, N.A4, N.G4, N.R, N.E4, N.D4, N.C4, N.R],
      durations: [1,    1,    2,    1,   1,    1,    2,    1,   1,    1,    2,    1,   1,    1,    2,    1],
      waveform: "square",
      volume: 0.04,
    },
  },
  easy: {
    bpm: 130,
    bass: {
      notes:     [N.C3, N.C3, N.G3, N.G3, N.A3, N.A3, N.G3, N.R, N.F3, N.F3, N.E3, N.E3, N.F3, N.G3, N.C3, N.R],
      durations: [1,    1,    1,    1,    1,    1,    1,    1,   1,    1,    1,    1,    1,    1,    1,    1],
      waveform: "triangle",
      volume: 0.06,
    },
    melody: {
      notes:     [N.C5, N.E5, N.G5, N.E5, N.D5, N.C5, N.R, N.R, N.G4, N.A4, N.B4, N.C5, N.D5, N.E5, N.C5, N.R],
      durations: [1,    1,    1,    1,    1,    1,    1,   1,   1,    1,    1,    1,    1,    1,    2,    1],
      waveform: "square",
      volume: 0.04,
    },
  },
  medium: {
    bpm: 145,
    bass: {
      notes:     [N.A3, N.R, N.A3, N.E3, N.F3, N.R, N.F3, N.G3, N.A3, N.R, N.A3, N.E3, N.D3, N.R, N.E3, N.R],
      durations: [1,    1,   1,    1,    1,    1,   1,    1,    1,    1,   1,    1,    1,    1,   1,    1],
      waveform: "triangle",
      volume: 0.07,
    },
    melody: {
      notes:     [N.A4, N.C5, N.E5, N.R, N.D5, N.C5, N.A4, N.R, N.G4, N.A4, N.B4, N.C5, N.B4, N.A4, N.G4, N.R],
      durations: [1,    1,    1,    1,   1,    1,    1,    1,   1,    1,    1,    1,    1,    1,    2,    1],
      waveform: "square",
      volume: 0.05,
    },
  },
  hard: {
    bpm: 160,
    bass: {
      notes:     [N.E3, N.E3, N.R, N.E3, N.G3, N.A3, N.R, N.A3, N.G3, N.F3, N.R, N.F3, N.E3, N.D3, N.E3, N.R],
      durations: [1,    1,    1,   1,    1,    1,    1,   1,    1,    1,    1,   1,    1,    1,    1,    1],
      waveform: "sawtooth",
      volume: 0.05,
    },
    melody: {
      notes:     [N.E5, N.R, N.E5, N.D5, N.C5, N.R, N.B4, N.A4, N.G4, N.R, N.A4, N.B4, N.C5, N.D5, N.E5, N.R],
      durations: [1,    1,   1,    1,    1,    1,   1,    1,    1,    1,   1,    1,    1,    1,    2,    1],
      waveform: "square",
      volume: 0.05,
    },
  },
  editor: {
    bpm: 85,
    bass: {
      notes:     [N.C3, N.R, N.R, N.G3, N.R, N.R, N.F3, N.R, N.R, N.E3, N.R, N.R, N.F3, N.R, N.G3, N.R],
      durations: [2,    1,   1,   2,    1,   1,   2,    1,   1,   2,    1,   1,   2,    1,   2,    1],
      waveform: "triangle",
      volume: 0.04,
    },
    melody: {
      notes:     [N.E4, N.R, N.G4, N.R, N.C5, N.R, N.R, N.R, N.B4, N.R, N.A4, N.R, N.G4, N.R, N.R, N.R],
      durations: [2,    1,   2,    1,   2,    2,   1,   1,   2,    1,   2,    1,   2,    2,   1,   1],
      waveform: "sine",
      volume: 0.03,
    },
  },
};

let bgmPlaying = false;
let bgmTheme: BGMTheme | null = null;
let bgmTimeouts: ReturnType<typeof setTimeout>[] = [];
let bgmGainNode: GainNode | null = null;
let bgmStopping = false;

export function isMusicEnabled(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem("trap_music_enabled") !== "false";
}

export function setMusicEnabled(enabled: boolean): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("trap_music_enabled", enabled ? "true" : "false");
  if (!enabled) stopBGM();
}

export function setSoundEnabled(enabled: boolean): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("trap_sound_enabled", enabled ? "true" : "false");
}

export function getMusicVolume(): number {
  if (typeof window === "undefined") return 0.5;
  const v = localStorage.getItem("trap_music_volume");
  return v !== null ? parseFloat(v) : 0.5;
}

export function setBGMVolume(volume: number): void {
  if (typeof window === "undefined") return;
  const clamped = Math.max(0, Math.min(1, volume));
  localStorage.setItem("trap_music_volume", String(clamped));
  if (bgmGainNode) bgmGainNode.gain.value = clamped * 0.5;
}

function scheduleSequence(
  ctx: AudioContext,
  dest: AudioNode,
  seq: NoteSequence,
  startTime: number,
  beatLen: number,
): number {
  let t = startTime;
  for (let i = 0; i < seq.notes.length; i++) {
    const freq = seq.notes[i];
    const dur = seq.durations[i] * beatLen;
    if (freq > 0) {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = seq.waveform;
      osc.connect(g);
      g.connect(dest);
      osc.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(seq.volume, t);
      g.gain.setValueAtTime(seq.volume, t + dur * 0.8);
      g.gain.linearRampToValueAtTime(0, t + dur * 0.95);
      osc.start(t);
      osc.stop(t + dur);
    }
    t += dur;
  }
  return t;
}

function playLoop(theme: BGMTheme): void {
  if (!isMusicEnabled() || bgmStopping) return;

  const ctx = getCtx();
  if (!bgmGainNode) {
    bgmGainNode = ctx.createGain();
    bgmGainNode.gain.value = getMusicVolume() * 0.5;
    bgmGainNode.connect(ctx.destination);
  }

  const def = BGM_THEMES[theme];
  const beatLen = 60 / def.bpm;
  const now = ctx.currentTime + 0.05;

  const bassEnd = scheduleSequence(ctx, bgmGainNode, def.bass, now, beatLen);
  scheduleSequence(ctx, bgmGainNode, def.melody, now, beatLen);

  const loopDuration = (bassEnd - now) * 1000;
  const tid = setTimeout(() => {
    if (bgmPlaying && bgmTheme === theme && !bgmStopping) {
      playLoop(theme);
    }
  }, loopDuration - 100);
  bgmTimeouts.push(tid);
}

export function playBGM(theme: BGMTheme): void {
  if (!isMusicEnabled()) return;
  if (bgmPlaying && bgmTheme === theme) return; // same theme already playing

  stopBGM();
  bgmStopping = false;
  bgmPlaying = true;
  bgmTheme = theme;
  playLoop(theme);
}

export function stopBGM(): void {
  bgmStopping = true;
  bgmPlaying = false;
  bgmTheme = null;
  bgmTimeouts.forEach(clearTimeout);
  bgmTimeouts = [];
  if (bgmGainNode) {
    try {
      bgmGainNode.gain.linearRampToValueAtTime(0, getCtx().currentTime + 0.3);
    } catch {
      // ignore if context is closed
    }
    bgmGainNode = null;
  }
}
