import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { DUEL_PASSIVE, DUEL_PLAYERS } from '../src/systems/duel/cards';
import { act, createDuel, teamOf, type Card, type DuelState } from '../src/systems/duel/rules';

const manifest = JSON.parse(fs.readFileSync(path.resolve(__dirname, '..', 'public', 'generated', 'manifest.json'), 'utf-8'));
const byId = new Map((manifest.roster as { id: number }[]).map((p) => [p.id, p])) as Parameters<typeof teamOf>[0];
const duel = (a: number[], b: number[], seed = 3) => createDuel([teamOf(byId, a, null), teamOf(byId, b, null)], seed);
function hand(s: DuelState, side: 0 | 1, cards: [number, 0 | 1 | 'u', 1 | 2 | 3][]) {
  const ss = s.sides[side];
  ss.hand = cards.map(([pid, idx, rank]) => ({ id: s.nextId++, owner: ss.units.find((u) => u.pid === pid)!.uid, idx, rank }) as Card);
  ss.actions = 3;
  return ss.hand;
}

describe('Modo Duelo: passives', () => {
  it('every footballer of the mode has one', () => {
    for (const d of DUEL_PLAYERS) expect(DUEL_PASSIVE[d.id], String(d.id)).toBeTruthy();
  });
  it("Mark's last stand keeps him up once with 1 PV, and only once", () => {
    const s = duel([10, 1513, 2, 3], [1, 29, 1541, 1532]);
    const mark = s.sides[1].units.find((u) => u.pid === 1)!;
    mark.hp = 5; mark.shield = 0;
    const [a, b] = hand(s, 0, [[10, 0, 3], [10, 1, 3]]);
    act(s, 0, { do: 'use', card: a.id, target: mark.uid });
    expect(mark.hp).toBe(1);
    expect(s.log.some((e) => e.t === 'passive' && e.uid === mark.uid)).toBe(true);
    act(s, 0, { do: 'use', card: b.id, target: mark.uid });
    expect(mark.hp).toBeLessThanOrEqual(0);
  });
  it("Byron starts with 2 orbs; Erik heals at the start of his side's turn", () => {
    const s = duel([1024, 157, 2, 3], [10, 1513, 1541, 1532]);
    expect(s.sides[0].units.find((u) => u.pid === 157)!.gauge).toBe(2);
    const erik = s.sides[0].units.find((u) => u.pid === 1024)!;
    erik.hp = Math.round(erik.maxHp / 2);
    const before = erik.hp;
    act(s, 0, { do: 'end' }); act(s, 1, { do: 'end' });
    expect(erik.hp).toBeGreaterThan(before);
  });
  it("David's aura makes his team mates take less damage (not him)", () => {
    const hitOn = (team: number[]) => {
      const s = duel([10, 1513, 2, 3], team, 11);
      const t = s.sides[1].units[1]; t.shield = 0;
      s.sides[0].units[0].base.crit = 0;
      const [a] = hand(s, 0, [[10, 0, 1]]);
      const hp = t.hp;
      act(s, 0, { do: 'use', card: a.id, target: t.uid });
      return hp - t.hp;
    };
    // the same target (Jack) with David in goal, and with another goalkeeper of no aura
    expect(hitOn([100773, 3, 2, 1513])).toBeLessThan(hitOn([1548, 3, 2, 1513]));
  });
});
