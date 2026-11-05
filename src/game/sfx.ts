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
