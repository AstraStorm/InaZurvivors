/**
 * Fix 1.12 difficulty curve: rivals, total health and damage per 30 s of a 5-minute run, 1.11 against 1.12, with the real
 * spawn functions (the old ones are kept here as the reference). Writes data/difficulty_sim.txt.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { burstSize, RANKS, waveIntensity } from '../src/systems/difficulty';

const DUR = 300;
const oldWave = (t: number) => { if (t < 30) return 1.35; const c = (t - 30) % 60; return c >= 38 && c < 52 ? 2.4 : c >= 52 ? 0.45 : 1; };
const oldBurst = (frac: number, rb: number) => 1 + Math.floor(frac * 2.6) + (frac > 0.3 ? rb : 0);

function windows(rank: 'C' | 'B' | 'A', legacy: boolean) {
  const R = RANKS[rank], out: { spawned: number; threat: number }[] = [];
  let acc = 0, seed = 0.137;
  for (let w = 0; w < 10; w++) {
    let spawned = 0, threat = 0;
    for (let t = w * 30; t < (w + 1) * 30; t += 1 / 30) {
      const frac = t / DUR, minutes = t / 60;
      const interval = Math.max(0.15, 1.3 - frac * 1.1) * R.spawnInterval / (legacy ? oldWave(t) : waveIntensity(t).rate);
      acc += 1 / 30;
      while (acc > interval) {
        acc -= interval;
        seed = (seed + 0.618034) % 1; // evenly spread, so rounding is not biased
        const n = legacy ? oldBurst(frac, R.burst) : burstSize(frac, false, R.burst, seed);
        spawned += n;
        threat += n * (1 + minutes * 0.6) * (2 + minutes * 1.15);
      }
    }
    out.push({ spawned, threat });
  }
  return out;
}

describe('difficulty curve', () => {
  it('climbs without the big jumps of 1.11 and ends at a similar height', () => {
    const lines = ['Curva de dificultad Fix 1.12 (generado por tests/difficulty_sim.test.ts). Por tramos de 30 s de una partida de 5:00.', ''];
    for (const rank of ['C', 'B', 'A'] as const) {
      const a = windows(rank, true), b = windows(rank, false);
      lines.push(`Rango ${rank}: tramo | rivales 1.11 → 1.12 | amenaza 1.11 → 1.12`);
      a.forEach((x, i) => lines.push(`  ${i * 30}-${i * 30 + 30} s | ${x.spawned} → ${b[i].spawned} | ${Math.round(x.threat)} → ${Math.round(b[i].threat)}`));
      const jump = (l: typeof a) => Math.max(...l.slice(1).map((x, i) => x.threat / Math.max(1, l[i].threat)));
      lines.push(`  mayor salto entre tramos: ×${jump(a).toFixed(2)} → ×${jump(b).toFixed(2)}`, '');
      expect(jump(b)).toBeLessThan(jump(a));
      expect(b[2].threat).toBeLessThan(a[2].threat); // the first wave was the brusque one
      expect(b[9].threat).toBeGreaterThan(a[9].threat * 0.8);
    }
    mkdirSync('data', { recursive: true });
    writeFileSync('data/difficulty_sim.txt', lines.join('\n'));
  });
});
