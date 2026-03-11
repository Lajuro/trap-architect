// ============================================================
// TRAP ARCHITECT - AUDIO ENGINE
// Procedural chiptune music & sound effects using Web Audio API
// ============================================================

class AudioManager {
  constructor() {
    this.ctx = null;
    this.musicVolume = 0.5;
    this.sfxVolume = 0.7;
    this.currentMusic = null;
    this.musicTimeout = null;
    this.musicGain = null;
    this.initialized = false;
    this.muted = false;
  }

  init() {
    if (this.initialized) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      if (this.ctx.state === 'suspended') this.ctx.resume();
      this.initialized = true;
    } catch (e) {
      console.warn('Web Audio not supported');
    }
  }

  playNote(freq, duration, type, volume, startTime) {
    if (!this.ctx || freq <= 0 || volume <= 0 || this.muted) return;
    const t = startTime || this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type || 'square';
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(Math.min(volume, 0.5), t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + duration + 0.01);
  }

  playNoise(duration, volume, startTime) {
    if (!this.ctx || this.muted) return;
    const t = startTime || this.ctx.currentTime;
    const bufSize = Math.max(1, Math.floor(this.ctx.sampleRate * duration));
    const buffer = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(Math.min(volume, 0.3), t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
    src.connect(gain);
    gain.connect(this.ctx.destination);
    src.start(t);
    src.stop(t + duration + 0.01);
  }

  // ===== SOUND EFFECTS =====
  playSFX(name) {
    if (!this.ctx || this.muted) return;
    const v = this.sfxVolume;
    const t = this.ctx.currentTime;
    switch (name) {
      case 'jump':
        this.playNote(350, 0.08, 'square', 0.15 * v, t);
        this.playNote(500, 0.1, 'square', 0.12 * v, t + 0.04);
        break;
      case 'coin':
        this.playNote(988, 0.06, 'square', 0.15 * v, t);
        this.playNote(1319, 0.12, 'square', 0.15 * v, t + 0.06);
        break;
      case 'death':
        this.playNote(494, 0.12, 'sawtooth', 0.2 * v, t);
        this.playNote(370, 0.12, 'sawtooth', 0.2 * v, t + 0.12);
        this.playNote(294, 0.12, 'sawtooth', 0.2 * v, t + 0.24);
        this.playNote(220, 0.3, 'sawtooth', 0.25 * v, t + 0.36);
        break;
      case 'stomp':
        this.playNote(180, 0.08, 'square', 0.2 * v, t);
        this.playNoise(0.04, 0.1 * v, t);
        break;
      case 'spring':
        for (let i = 0; i < 6; i++)
          this.playNote(250 + i * 120, 0.04, 'triangle', 0.15 * v, t + i * 0.025);
        break;
      case 'brick':
        this.playNoise(0.06, 0.15 * v, t);
        this.playNote(120, 0.06, 'square', 0.1 * v, t);
        break;
      case 'powerup':
        for (let i = 0; i < 7; i++)
          this.playNote(262 + i * 70, 0.07, 'square', 0.12 * v, t + i * 0.05);
        break;
      case 'flag':
        [523, 659, 784, 1047, 1319].forEach((f, i) =>
          this.playNote(f, 0.18, 'square', 0.15 * v, t + i * 0.1));
        break;
      case 'troll':
        this.playNote(180, 0.2, 'sawtooth', 0.2 * v, t);
        this.playNote(120, 0.3, 'sawtooth', 0.2 * v, t + 0.1);
        break;
      case 'select':
        this.playNote(660, 0.04, 'square', 0.1 * v, t);
        break;
      case 'confirm':
        this.playNote(523, 0.06, 'square', 0.12 * v, t);
        this.playNote(784, 0.1, 'square', 0.12 * v, t + 0.06);
        break;
      case 'crumble':
        this.playNoise(0.15, 0.12 * v, t);
        this.playNote(80, 0.12, 'triangle', 0.08 * v, t);
        break;
      case 'gameover':
        [392, 330, 262, 220, 165].forEach((f, i) =>
          this.playNote(f, 0.25, 'sawtooth', 0.18 * v, t + i * 0.2));
        break;
      case 'levelclear':
        [262, 330, 392, 523, 659, 784, 1047].forEach((f, i) =>
          this.playNote(f, 0.15, 'square', 0.15 * v, t + i * 0.08));
        break;
    }
  }

  // ===== MUSIC SYSTEM =====
  playMusic(name) {
    this.stopMusic();
    if (!this.ctx || this.musicVolume <= 0 || this.muted) return;

    // Create a dedicated gain node for this music session
    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.setValueAtTime(1, this.ctx.currentTime);
    this.musicGain.connect(this.ctx.destination);

    const songs = {
      // ---- MENU THEME: Upbeat, catchy (C Major, 120 BPM) ----
      menu: {
        bpm: 120,
        melody: [
          [523,2],[659,2],[784,2],[659,2],[523,4],[784,4],
          [440,2],[523,2],[659,2],[523,2],[440,4],[659,4],
          [392,2],[494,2],[587,2],[494,2],[392,2],[494,2],[587,2],[784,2],
          [659,2],[523,2],[392,2],[523,2],[659,4],[0,4],
        ],
        bass: [
          [131,4],[196,4],[262,4],[196,4],
          [110,4],[165,4],[220,4],[165,4],
          [98,4],[147,4],[196,4],[147,4],
          [131,4],[196,4],[131,8],
        ],
        drums: [
          ['k',2],['h',2],['s',2],['h',2],['k',2],['h',2],['s',2],['h',2],
          ['k',2],['h',2],['s',2],['h',2],['k',2],['h',2],['s',2],['h',2],
          ['k',2],['h',2],['s',2],['h',2],['k',2],['h',2],['s',2],['h',2],
          ['k',2],['h',2],['s',2],['h',2],['k',2],['k',2],['s',4],
        ]
      },
      // ---- LEVEL 1: Adventurous (G Major, 130 BPM) ----
      level1: {
        bpm: 130,
        melody: [
          [392,2],[494,2],[587,2],[494,2],[392,2],[587,2],[784,4],
          [659,2],[587,2],[494,2],[392,2],[440,4],[392,4],
          [523,2],[587,2],[659,2],[587,2],[523,2],[494,2],[440,2],[392,2],
          [494,2],[523,2],[587,4],[392,4],[0,4],
        ],
        bass: [
          [98,4],[147,4],[196,4],[147,4],
          [131,4],[165,4],[110,4],[98,4],
          [131,4],[147,4],[165,4],[131,4],
          [98,4],[147,4],[98,8],
        ],
        drums: [
          ['k',2],['h',2],['s',2],['h',2],['k',1],['k',1],['h',2],['s',2],['h',2],
          ['k',2],['h',2],['s',2],['h',2],['k',2],['h',2],['s',4],
          ['k',2],['h',2],['s',2],['h',2],['k',2],['h',1],['h',1],['s',2],['h',2],
          ['k',2],['h',2],['s',2],['h',2],['k',2],['s',2],['k',2],['s',2],
        ]
      },
      // ---- LEVEL 2: Mysterious (D Minor, 115 BPM) ----
      level2: {
        bpm: 115,
        melody: [
          [294,2],[349,2],[440,2],[349,2],[294,4],[0,2],[440,2],
          [523,2],[494,2],[440,2],[349,2],[330,4],[294,4],
          [233,2],[262,2],[294,2],[349,2],[392,2],[349,2],[294,2],[262,2],
          [294,2],[349,2],[440,4],[294,4],[0,4],
        ],
        bass: [
          [73,4],[110,4],[147,4],[110,4],
          [87,4],[131,4],[110,4],[73,4],
          [58,4],[87,4],[110,4],[87,4],
          [73,4],[110,4],[73,8],
        ],
        drums: [
          ['k',4],['s',2],['h',2],['k',2],['h',2],['s',4],
          ['k',4],['h',2],['s',2],['k',2],['h',2],['s',4],
          ['k',2],['h',2],['s',2],['h',2],['k',4],['s',4],
          ['k',2],['h',2],['k',2],['h',2],['s',2],['s',2],['k',4],
        ]
      },
      // ---- LEVEL 3: Intense (A Minor, 145 BPM) ----
      level3: {
        bpm: 145,
        melody: [
          [440,1],[523,1],[659,1],[523,1],[440,1],[523,1],[659,1],[880,1],
          [784,1],[659,1],[523,1],[440,1],[392,1],[440,1],[523,2],
          [587,1],[659,1],[784,1],[659,1],[587,1],[523,1],[440,1],[392,1],
          [440,1],[523,1],[659,2],[440,2],[0,2],
        ],
        bass: [
          [110,2],[165,2],[220,2],[165,2],
          [131,2],[196,2],[165,2],[110,2],
          [147,2],[196,2],[165,2],[131,2],
          [110,2],[165,2],[110,4],
        ],
        drums: [
          ['k',1],['h',1],['s',1],['h',1],['k',1],['h',1],['s',1],['h',1],
          ['k',1],['h',1],['s',1],['h',1],['k',1],['k',1],['s',2],
          ['k',1],['h',1],['s',1],['h',1],['k',1],['h',1],['s',1],['h',1],
          ['k',1],['s',1],['k',1],['s',1],['k',1],['s',1],['k',1],['s',1],
        ]
      }
    };

    const song = songs[name];
    if (!song) return;

    const bpm = song.bpm;
    const sixteenth = 60 / bpm / 4;

    // Calculate total duration of melody (longest track)
    const melodyDur = song.melody.reduce((s, n) => s + n[1], 0);
    const bassDur = song.bass.reduce((s, n) => s + n[1], 0);
    const totalSteps = Math.max(melodyDur, bassDur);
    const loopDuration = totalSteps * sixteenth;

    const musicDest = this.musicGain;

    const scheduleLoop = () => {
      if (!this.ctx || this.musicVolume <= 0 || !this.musicGain) return;
      const now = this.ctx.currentTime + 0.05;
      const mv = this.musicVolume;

      // Melody
      let mt = 0;
      for (const [freq, dur] of song.melody) {
        if (freq > 0) {
          this._playMusicNote(freq, dur * sixteenth * 0.85, 'square', 0.12 * mv, now + mt * sixteenth, musicDest);
        }
        mt += dur;
      }

      // Bass
      let bt = 0;
      for (const [freq, dur] of song.bass) {
        if (freq > 0) {
          this._playMusicNote(freq, dur * sixteenth * 0.9, 'triangle', 0.1 * mv, now + bt * sixteenth, musicDest);
        }
        bt += dur;
      }

      // Drums
      if (song.drums) {
        let dt = 0;
        for (const [type, dur] of song.drums) {
          const time = now + dt * sixteenth;
          if (type === 'k') {
            this._playMusicNote(55, 0.08, 'sine', 0.12 * mv, time, musicDest);
          } else if (type === 'h') {
            this._playMusicNoise(0.03, 0.05 * mv, time, musicDest);
          } else if (type === 's') {
            this._playMusicNoise(0.08, 0.08 * mv, time, musicDest);
            this._playMusicNote(180, 0.04, 'triangle', 0.05 * mv, time, musicDest);
          }
          dt += dur;
        }
      }

      this.musicTimeout = setTimeout(scheduleLoop, loopDuration * 1000 - 100);
    };

    scheduleLoop();
    this.currentMusic = name;
  }

  _playMusicNote(freq, duration, type, volume, startTime, dest) {
    if (!this.ctx || freq <= 0 || volume <= 0 || this.muted) return;
    const t = startTime || this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type || 'square';
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(Math.min(volume, 0.5), t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
    osc.connect(gain);
    gain.connect(dest);
    osc.start(t);
    osc.stop(t + duration + 0.01);
  }

  _playMusicNoise(duration, volume, startTime, dest) {
    if (!this.ctx || this.muted) return;
    const t = startTime || this.ctx.currentTime;
    const bufSize = Math.max(1, Math.floor(this.ctx.sampleRate * duration));
    const buffer = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(Math.min(volume, 0.3), t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
    src.connect(gain);
    gain.connect(dest);
    src.start(t);
    src.stop(t + duration + 0.01);
  }

  stopMusic() {
    if (this.musicTimeout) {
      clearTimeout(this.musicTimeout);
      this.musicTimeout = null;
    }
    // Instantly silence all scheduled music notes
    if (this.musicGain) {
      try {
        this.musicGain.gain.setValueAtTime(0, this.ctx.currentTime);
        this.musicGain.disconnect();
      } catch (e) {}
      this.musicGain = null;
    }
    this.currentMusic = null;
  }

  setMusicVolume(v) {
    this.musicVolume = Math.max(0, Math.min(1, v));
    if (this.currentMusic && this.musicVolume > 0) {
      const m = this.currentMusic;
      this.stopMusic();
      this.playMusic(m);
    } else if (this.musicVolume <= 0) {
      this.stopMusic();
    }
  }

  setSFXVolume(v) {
    this.sfxVolume = Math.max(0, Math.min(1, v));
  }
}
