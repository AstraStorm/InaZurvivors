/**
 * Original chiptune compositions written for this project (no third-party music). Each one is a seeded, repeatable
 * score: mode, harmony, tempo and motif differ per track, so it is the same piece every time it plays.
 */
export type MusicContext = 'menu' | 'map' | 'gacha' | 'collection' | 'run' | 'run2' | 'boss';
export type Part = 'lead' | 'harmony' | 'bass' | 'kick' | 'snare' | 'hat';
export interface NoteEvent { step: number; len: number; part: Part; freq: number }

export interface Composition {
  id: string; title: string; bpm: number; root: number; scale: number[]; chords: number[]; seed: number;
  leadWave: OscillatorType; drive: number; // 0 calm .. 2 relentless
}

const MAJOR = [0, 2, 4, 5, 7, 9, 11];
const MINOR = [0, 2, 3, 5, 7, 8, 10];
const DORIAN = [0, 2, 3, 5, 7, 9, 10];
const MIXOLYDIAN = [0, 2, 4, 5, 7, 9, 10];

const C = (id: string, title: string, bpm: number, root: number, scale: number[], chords: number[], seed: number, leadWave: OscillatorType, drive: number): Composition =>
  ({ id, title, bpm, root, scale, chords, seed, leadWave, drive });

export const COMPOSITIONS: Composition[] = [
  C('saque', 'Saque inicial', 132, 62, MAJOR, [0, 4, 5, 3], 11, 'square', 1),
  C('vestuario', 'Vestuario', 108, 60, MIXOLYDIAN, [0, 6, 3, 0], 23, 'triangle', 0),
  C('pizarra', 'La pizarra', 116, 57, DORIAN, [0, 3, 0, 4], 37, 'triangle', 0),
  C('capsulas', 'Capsulas de la suerte', 124, 65, MAJOR, [0, 3, 4, 3], 41, 'square', 1),
  C('album', 'Album de cromos', 96, 67, MAJOR, [0, 5, 3, 4], 53, 'sine', 0),
  C('banda', 'Por la banda', 144, 64, MIXOLYDIAN, [0, 3, 6, 0], 61, 'square', 1),
  C('contra', 'Contraataque', 150, 57, MINOR, [0, 5, 6, 4], 71, 'sawtooth', 1),
  C('tiki', 'Toque y pase', 138, 62, DORIAN, [0, 3, 4, 3], 83, 'square', 1),
  C('remontada', 'Remontada', 164, 60, MINOR, [0, 6, 5, 4], 97, 'sawtooth', 2),
  C('prorroga', 'Prorroga', 170, 55, DORIAN, [0, 5, 3, 6], 101, 'square', 2),
  C('rival', 'El rival final', 176, 52, MINOR, [0, 1, 5, 4], 113, 'sawtooth', 2),
  C('penaltis', 'Tanda de penaltis', 168, 59, MINOR, [0, 5, 1, 4], 127, 'square', 2),
];

export const PLAYLISTS: Record<MusicContext, string[]> = {
  menu: ['saque', 'vestuario'], map: ['pizarra'], gacha: ['capsulas'], collection: ['album'],
  run: ['banda', 'contra', 'tiki'], run2: ['remontada', 'prorroga'], boss: ['rival', 'penaltis'],
};

/** Random track of a pool, never the one that just played (unless it is the only one). */
export function nextTrack(pool: string[], last: string | null, rng: () => number): string | null {
  if (!pool.length) return null;
  const options = pool.length > 1 ? pool.filter((t) => t !== last) : pool;
  return options[Math.floor(rng() * options.length)];
}

const midiToHz = (m: number) => 440 * 2 ** ((m - 69) / 12);

function lfsr(seed: number) {
  let s = seed * 2654435761 >>> 0;
  return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
}

const degree = (c: Composition, d: number) => {
  const n = c.scale.length;
  return c.root + c.scale[((d % n) + n) % n] + 12 * Math.floor(d / n);
};

/** Two-bar motif the lead keeps returning to; changing it per section gives an A A B A form. */
function motif(c: Composition, rng: () => number) {
  const out: { step: number; len: number; d: number }[] = [];
  const lens = c.drive >= 2 ? [1, 1, 2, 2] : c.drive === 1 ? [2, 2, 1, 3] : [2, 4, 4, 3];
  let step = 0, d = 2 * Math.floor(rng() * 3);
  while (step < 32) {
    const len = lens[Math.floor(rng() * lens.length)];
    if (rng() > 0.12) out.push({ step, len, d });
    d = Math.max(-2, Math.min(9, d + [-2, -1, -1, 1, 1, 2, 3][Math.floor(rng() * 7)]));
    step += len;
  }
  return out;
}

export function renderBars(c: Composition, bars: number): NoteEvent[] {
  const rng = lfsr(c.seed);
  const a = motif(c, rng), b = motif(c, rng);
  const ev: NoteEvent[] = [];
  for (let bar = 0; bar < bars; bar++) {
    const at = bar * 16;
    const chord = c.chords[bar % c.chords.length];
    const section = Math.floor(bar / 8) % 4; // A A B A
    const theme = section === 2 ? b : a;
    const inMotif = bar % 2 ? 16 : 0;
    for (const n of theme) {
      if (n.step < inMotif || n.step >= inMotif + 16) continue;
      ev.push({ step: at + n.step - inMotif, len: n.len, part: 'lead', freq: midiToHz(degree(c, n.d + chord) + 12) });
    }
    ev.push({ step: at, len: 16, part: 'harmony', freq: midiToHz(degree(c, chord + 2)) });
    ev.push({ step: at, len: 16, part: 'harmony', freq: midiToHz(degree(c, chord + 4)) });
    const bassStep = c.drive === 0 ? 8 : c.drive === 1 ? 4 : 2;
    for (let s = 0; s < 16; s += bassStep) {
      const up = (s / bassStep) % 2 === 1 && c.drive > 0;
      ev.push({ step: at + s, len: bassStep, part: 'bass', freq: midiToHz(degree(c, chord) - 12 + (up ? 12 : 0)) });
    }
    for (let s = 0; s < 16; s += 2) {
      if (s % 8 === 0 || (c.drive === 2 && s % 4 === 0)) ev.push({ step: at + s, len: 1, part: 'kick', freq: 0 });
      if (c.drive > 0 && s % 8 === 4) ev.push({ step: at + s, len: 1, part: 'snare', freq: 0 });
      if (c.drive > 0 || s % 4 === 0) ev.push({ step: at + s, len: 1, part: 'hat', freq: 0 });
    }
  }
  return ev.sort((x, y) => x.step - y.step);
}
