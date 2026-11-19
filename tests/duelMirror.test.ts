import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { act, createDuel, teamOf, type Action, type DuelState } from '../src/systems/duel/rules';
import { cpuAction } from '../src/systems/duel/cpu';
import { mirrorAction } from '../src/systems/duel/pvp';

const manifest = JSON.parse(fs.readFileSync(path.resolve(__dirname, '..', 'public', 'generated', 'manifest.json'), 'utf-8'));
const byId = new Map((manifest.roster as { id: number }[]).map((p) => [p.id, p])) as Parameters<typeof teamOf>[0];

/** what both players must agree on, seen from side 0's point of view */
const view = (s: DuelState, flip: boolean) => {
  const sides = flip ? [s.sides[1], s.sides[0]] : s.sides;
  return JSON.stringify({ winner: s.winner < 0 ? -1 : flip ? 1 - s.winner : s.winner, turn: s.turn, sides: sides.map((ss) => ({ hand: ss.hand.map((c) => [c.id, c.idx, c.rank]), units: ss.units.map((u) => [u.pid, u.hp, u.slot, u.gauge, u.shield]) })) });
};

describe('Modo Duelo online: both players run the same match', () => {
  for (const seed of [1, 7, 42, 99, 1234]) it(`seen from either side it is the same match (seed ${seed})`, () => {
    const A = teamOf(byId, [10, 1513, 1, 29], 'hillman'), B = teamOf(byId, [1532, 1542, 1541, 2], 'ray-dark');
    const first = (seed % 2) as 0 | 1;
    // a: player A's own engine (A is side 0); b: player B's (B is side 0, so A is its side 1)
    const a = createDuel([A, B], seed, first), b = createDuel([B, A], seed, (1 - first) as 0 | 1);
    let roll = seed;
    const rnd = () => { roll = (roll * 1103515245 + 12345) & 0x7fffffff; return roll / 0x7fffffff; };
    for (let k = 0; k < 400 && a.winner < 0; k++) {
      const side = a.active;
      const x: Action = cpuAction(a, 'dificil', rnd);
      expect(act(a, side, x)).toBeNull();
      expect(act(b, (1 - side) as 0 | 1, mirrorAction(x))).toBeNull();
      expect(view(b, true)).toBe(view(a, false));
    }
  });
});
