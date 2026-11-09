/**
 * Sound effects synthesised with WebAudio (PROVISIONAL: no audio has been extracted from the ROM yet).
 * Volume comes from the settings; everything fails silently if audio is unavailable.
 */
let ctx: AudioContext | null = null;
let out: AudioNode | null = null;
let volume = 0.5;
const lastPlayed = new Map<string, number>();

export function setVolume(v: number) { volume = Math.max(0, Math.min(1, v)); }

function ac(): AudioContext | null {
  try {
    if (!ctx) ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    if (!out) {
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 2400;
      const limiter = ctx.createDynamicsCompressor();
      limiter.threshold.value = -20;
      limiter.ratio.value = 12;
      lp.connect(limiter).connect(ctx.destination);
      out = lp;
    }
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tone(type: OscillatorType, f0: number, f1: number, dur: number, gain: number, delay = 0) {
  const a = ac();
  if (!a || volume <= 0) return;
  const t = a.currentTime + delay;
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = type === 'square' || type === 'sawtooth' ? 'triangle' : type;
  o.frequency.setValueAtTime(f0, t);
  o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
  g.gain.setValueAtTime(gain * volume * 0.6, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(out!);
  o.start(t);
  o.stop(t + dur + 0.02);
}

function noise(dur: number, gain: number, lp = 1200) {
  const a = ac();
  if (!a || volume <= 0) return;
  const buf = a.createBuffer(1, Math.floor(a.sampleRate * dur), a.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
  const s = a.createBufferSource();
  s.buffer = buf;
  const f = a.createBiquadFilter();
  f.type = 'lowpass';
  f.frequency.value = lp;
  const g = a.createGain();
  g.gain.value = gain * volume * 0.5;
  s.connect(f).connect(g).connect(out!);
  s.start();
}

/** Rate-limited so dozens of hits per frame don't stack into noise. */
export function sfx(name: 'kick' | 'hit' | 'crit' | 'sweep' | 'boom' | 'pickup' | 'levelup' | 'hurt' | 'reveal' | 'legend' | 'myth' | 'leyenda' | 'click' | 'whoosh' | 'magnet' | 'powerup' | 'evolve' | 'hover' | 'buy' | 'error' | 'alarm' | 'bossdrop', pitch = 1) {
  const now = performance.now();
  if (name === 'hover') return;
  const gap = name === 'hit' ? 110 : name === 'crit' ? 140 : name === 'sweep' ? 600 : name === 'pickup' ? 90 : name === 'boom' ? 160 : 30;
  if (now - (lastPlayed.get(name) ?? 0) < gap) return;
  lastPlayed.set(name, now);
  switch (name) {
    case 'kick': tone('triangle', 180, 60, 0.12, 0.35); noise(0.06, 0.15, 2000); break;
    case 'hit': { const v = 0.85 + Math.random() * 0.3; tone('square', 420 * v, 160 * v, 0.06, 0.08); break; } // Fix 1.12: a little variation
    case 'crit': tone('square', 900, 300, 0.09, 0.1); noise(0.05, 0.12, 4000); break;
    case 'sweep': [392, 523, 659].forEach((f, i) => tone('triangle', f, f * 1.5, 0.1, 0.09, i * 0.04)); noise(0.12, 0.12, 1800); break;
    case 'boom': noise(0.35, 0.35, 700); tone('sine', 110, 40, 0.3, 0.3); break;
    case 'pickup': tone('triangle', 660 * pitch, 990 * pitch, 0.07, 0.09); break;
    case 'levelup': [523, 659, 784, 1046].forEach((f, i) => tone('square', f, f, 0.12, 0.08, i * 0.07)); break;
    case 'hurt': tone('sawtooth', 220, 90, 0.15, 0.1); break;
    case 'reveal': tone('triangle', 300, 900, 0.35, 0.14); break;
    case 'legend': [392, 523, 659, 784, 1046, 1318].forEach((f, i) => tone('square', f, f * 1.01, 0.25, 0.07, i * 0.08)); break;
    case 'myth': [330, 440, 554, 659, 880, 1109, 1318, 1760].forEach((f, i) => tone('square', f, f * 1.01, 0.3, 0.07, i * 0.09)); break;
    case 'leyenda': [262, 392, 523, 659, 784, 1046, 1318, 1568, 2093].forEach((f, i) => { tone('square', f, f * 1.01, 0.4, 0.07, i * 0.11); tone('triangle', f / 2, f / 2, 0.5, 0.08, i * 0.11); }); break;
    case 'click': tone('square', 660, 660, 0.03, 0.05); break;
    case 'whoosh': noise(0.18, 0.12, 3000); break;
    case 'magnet': tone('sine', 220, 1400, 0.4, 0.14); tone('triangle', 110, 700, 0.4, 0.08); break;
    case 'powerup': [660, 880, 1175].forEach((f, i) => tone('triangle', f, f, 0.1, 0.09, i * 0.05)); break;
    case 'evolve': [523, 784, 1046, 1568].forEach((f, i) => tone('square', f, f * 1.01, 0.2, 0.07, i * 0.09)); noise(0.3, 0.05, 5000); break;
    case 'buy': [880, 1320].forEach((f, i) => tone('square', f, f, 0.07, 0.07, i * 0.06)); break;
    case 'error': tone('square', 180, 150, 0.14, 0.07); break;
    // 1.82: the boss alarm (a two-tone siren, three times) and its heavy landing
    case 'alarm': for (let k = 0; k < 3; k++) { tone('sawtooth', 520, 880, 0.32, 0.07, k * 0.7); tone('sawtooth', 880, 520, 0.3, 0.06, k * 0.7 + 0.34); } break;
    case 'bossdrop': noise(0.7, 0.45, 500); tone('sine', 90, 28, 0.9, 0.4); tone('square', 60, 40, 0.5, 0.08, 0.05); break;
  }
}

// ---------------------------------------------------------------------------------------------------------------
// 2.1 (author: «más épico», and by affinity): the awakening of a warrior spirit. Four beats: a rising drone with a noise
// riser, a deep impact, a sustained fanfare chord with bells, and the element's own texture — Fuego crackles on a
// powerful major chord, Aire gusts with high chimes on a floating lydian one, Montaña rumbles with war drums on a deep
// minor one, Bosque rings with chimes and bird chirps on a warm one. Levelling up is shorter; Ω is longer and an octave higher.

/** a sustained note: attack, hold, release; two slightly detuned voices for width */
function pad(f: number, dur: number, gain: number, delay = 0, type: OscillatorType = 'triangle', attack = 0.08) {
  const a = ac();
  if (!a || volume <= 0) return;
  const t = a.currentTime + delay;
  for (const det of [-4, 4]) {
    const o = a.createOscillator(), g = a.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t); o.detune.setValueAtTime(det, t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain * volume * 0.4, t + attack);
    g.gain.setValueAtTime(gain * volume * 0.4, t + dur * 0.6);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(out!);
    o.start(t); o.stop(t + dur + 0.05);
  }
}

/** filtered noise whose band sweeps from f0 to f1 (a riser, a gust, a rumble) */
function sweepNoise(dur: number, gain: number, f0: number, f1: number, delay = 0, q = 1.2, swell = true) {
  const a = ac();
  if (!a || volume <= 0) return;
  const t = a.currentTime + delay;
  const buf = a.createBuffer(1, Math.floor(a.sampleRate * dur), a.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  const s = a.createBufferSource(); s.buffer = buf;
  const f = a.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = q;
  f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(Math.max(30, f1), t + dur);
  const g = a.createGain();
  g.gain.setValueAtTime(swell ? 0.0001 : gain * volume * 0.5, t);
  if (swell) g.gain.exponentialRampToValueAtTime(gain * volume * 0.5, t + dur * 0.85);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(f).connect(g).connect(out!);
  s.start(t); s.stop(t + dur + 0.02);
}

export type EgElement = 'Fuego' | 'Aire' | 'Montaña' | 'Bosque';
/** the chord of each affinity (Hz, low to high) */
const EG_CHORD: Record<EgElement, number[]> = {
  Fuego: [146.8, 220, 293.7, 370, 440, 587.3], // D major, open fifths: power
  Aire: [261.6, 329.6, 370, 493.9, 659.3, 740], // C lydian (C E F# B): floating, bright
  'Montaña': [110, 164.8, 220, 261.6, 329.6, 440], // A minor, low: heavy
  Bosque: [196, 246.9, 293.7, 440, 493.9, 587.3], // G add9: warm
};

let lastAwaken = 0;
/** the awakening sound of a spirit: `first` unlocking it, `up` a new level, `omega` reaching Ω */
export function egAwaken(element: EgElement, kind: 'first' | 'up' | 'omega') {
  const now = performance.now();
  if (now - lastAwaken < 400) return;
  lastAwaken = now;
  const chord = EG_CHORD[element] ?? EG_CHORD.Fuego, oct = kind === 'omega' ? 2 : 1, build = kind === 'up' ? 0.35 : 0.9;
  // 1. the build: a low drone rising and a noise riser
  tone('sine', chord[0] / 2, chord[0], build, 0.22);
  sweepNoise(build, 0.35, 300, 4000, 0, 1.4);
  // 2. the impact
  const hit = build;
  sweepNoise(0.5, 0.45, 900, 150, hit, 0.6, false);
  tone('sine', 90, 32, 0.7, 0.45, hit);
  sweepNoise(0.6, 0.35, 5000, 800, hit, 0.6, false);
  // 3. the fanfare: the chord held, then the bells climbing it
  const hold = kind === 'up' ? 1.0 : kind === 'omega' ? 2.4 : 1.8;
  chord.forEach((f, i) => pad(f * oct, hold, i < 2 ? 0.16 : 0.1, hit + 0.02 + i * 0.025, i < 2 ? 'sawtooth' : 'triangle', 0.05));
  chord.slice(2).concat([chord[2] * 2, chord[3] * 2]).forEach((f, i) => tone('sine', f * oct, f * oct * 1.005, 0.6, 0.12, hit + 0.15 + i * 0.09));
  if (kind === 'omega') [1, 1.5, 2].forEach((m, i) => pad(chord[0] * 4 * m, 1.6, 0.06, hit + 0.9 + i * 0.15, 'sine'));
  // 4. the element's own texture
  const tx = hit + 0.1;
  if (element === 'Fuego') {
    for (let i = 0; i < 14; i++) sweepNoise(0.05, 0.25, 2500 + Math.random() * 2000, 1500, tx + Math.random() * hold * 0.8, 3, false); // crackles
    sweepNoise(hold, 0.2, 200, 1200, tx, 0.8); // the roar of the flames
  } else if (element === 'Aire') {
    sweepNoise(hold * 0.9, 0.3, 600, 3200, tx, 2.5); // a gust
    [1318.5, 1760, 1975.5, 2637].forEach((f, i) => tone('sine', f, f, 0.35, 0.07, tx + 0.2 + i * 0.12)); // high chimes
  } else if (element === 'Montaña') {
    sweepNoise(hold, 0.4, 120, 60, tx, 0.7, false); // the rumble of the earth
    for (let i = 0; i < 4; i++) tone('sine', 75, 38, 0.4, 0.4, tx + i * 0.22); // war drums
  } else {
    [587.3, 740, 880, 1174.7, 987.8].forEach((f, i) => tone('sine', f, f, 0.5, 0.08, tx + 0.15 + i * 0.13)); // chimes
    for (let i = 0; i < 3; i++) { tone('triangle', 2200, 3000, 0.06, 0.05, tx + 0.5 + i * 0.25); tone('triangle', 2600, 3400, 0.05, 0.04, tx + 0.58 + i * 0.25); } // birds
  }
}
