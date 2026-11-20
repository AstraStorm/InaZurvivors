import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { DUEL_PASSIVE, DUEL_PLAYERS, familyOf } from '../src/systems/duel/cards';
import { act, createDuel, teamOf, type Card, type DuelState } from '../src/systems/duel/rules';

const manifest = JSON.parse(fs.readFileSync(path.resolve(__dirname, '..', 'public', 'generated', 'manifest.json'), 'utf-8'));
const byId = new Map((manifest.roster as { id: number }[]).map((p) => [p.id, p])) as Parameters<typeof teamOf>[0];
const duel = (a: number[], b: number[], seed = 3) => createDuel([teamOf(byId, a, null), teamOf(byId, b, null)], seed);
function hand(s: DuelState, side: 0 | 1, cards: [number, 0 | 1 | 'u', 1 | 2 | 3][]) {
  const ss = s.sides[side];
  ss.hand = cards.map(([pid, idx, rank]) => ({ id: s.nextId++, owner: ss.units.find((u) => u.pid === pid)!.uid, idx, rank }) as Card);
  ss.actions = 5;
  return ss.hand;
}

describe('Modo Duelo: passives', () => {
  it('every footballer of the mode has one', () => {
    for (const d of DUEL_PLAYERS) expect(DUEL_PASSIVE[d.id]?.length, String(d.id)).toBeGreaterThan(0);
  });
  it('no two characters share one (only the forms of the same character may)', () => {
    const seen = new Map<string, number>();
    for (const d of DUEL_PLAYERS) {
      const key = JSON.stringify(DUEL_PASSIVE[d.id]);
      const other = seen.get(key);
      if (other !== undefined) expect(familyOf(other), `${d.id} = ${other}`).toBe(familyOf(d.id));
      else seen.set(key, d.id);
    }
  });
  it("Mark's last stand keeps him up once with 1 PV, and only once", () => {
    const s = duel([10, 1513, 2, 3], [1, 29, 1541, 1532]);
    const mark = s.sides[1].units.find((u) => u.pid === 1)!;
    mark.hp = 5; mark.shield = 0;
    const [a, b] = hand(s, 0, [[10, 0, 3], [10, 1, 3]]);
    act(s, 0, { do: 'use', card: a.id, target: mark.uid });
    expect(mark.hp).toBe(1);
    expect(s.log.some((e) => e.t === 'passive' && e.uid === mark.uid && e.what === 'lastStand')).toBe(true);
    act(s, 0, { do: 'use', card: b.id, target: mark.uid });
    expect(mark.hp).toBeLessThanOrEqual(0);
  });
  it("Byron starts with 2 orbs; Gabi heals at the start of his side's turn", () => {
    const s = duel([100405, 157, 2, 3], [10, 1513, 1541, 1532]);
    expect(s.sides[0].units.find((u) => u.pid === 157)!.gauge).toBe(2);
    const gabi = s.sides[0].units.find((u) => u.pid === 100405)!;
    gabi.hp = Math.round(gabi.maxHp / 2);
    const before = gabi.hp;
    act(s, 0, { do: 'end' }); act(s, 1, { do: 'end' });
    expect(gabi.hp).toBeGreaterThan(before);
  });
  it("Erik's second wind: the first time under half PV he heals and gets a shield, once", () => {
    const s = duel([10, 1513, 2, 3], [1024, 29, 1541, 1532]);
    const erik = s.sides[1].units.find((u) => u.pid === 1024)!;
    erik.shield = 0; erik.hp = erik.maxHp; // full: the blow takes him under half without knocking him out
    const [a] = hand(s, 0, [[10, 0, 2]]);
    act(s, 0, { do: 'use', card: a.id, target: erik.uid });
    expect(s.log.some((e) => e.t === 'passive' && e.uid === erik.uid && e.what === 'secondWind')).toBe(true);
    expect(erik.winded).toBe(true);
  });
  it("Nathan's every third card is a sure critical", () => {
    const s = duel([2, 1513, 10, 3], [29, 1541, 1532, 1]);
    const nathanU = s.sides[0].units.find((u) => u.pid === 2)!;
    nathanU.base.crit = 0;
    const cards = hand(s, 0, [[2, 0, 1], [1513, 1, 1], [2, 0, 1], [10, 0, 1], [2, 0, 1]]);
    const target = s.sides[1].units[0];
    for (const c of [cards[0], cards[2], cards[4]]) act(s, 0, { do: 'use', card: c.id, target: target.uid });
    const hits = s.log.filter((e): e is Extract<typeof e, { t: 'hit' }> => e.t === 'hit' && e.from === nathanU.uid && e.to === target.uid);
    expect(hits.length).toBeGreaterThanOrEqual(3);
    expect(hits[hits.length - 1].crit).toBe(true);
  });
  it("Arion's ATK grows with every card he uses, up to its cap", () => {
    const s = duel([100538, 1513, 10, 3], [29, 1541, 1532, 1]);
    const arion = s.sides[0].units.find((u) => u.pid === 100538)!;
    const cards = hand(s, 0, [[100538, 0, 1], [1513, 0, 1], [100538, 0, 1], [1513, 0, 1], [100538, 0, 1], [1513, 0, 1], [100538, 0, 1], [1513, 0, 1], [100538, 0, 1], [1513, 0, 1], [100538, 0, 1]]);
    s.sides[0].actions = 20;
    for (const c of cards.filter((x) => s.sides[0].units.find((u) => u.uid === x.owner)!.pid === 100538)) act(s, 0, { do: 'use', card: c.id });
    expect(arion.pstack).toBe(5);
  });
  it('David covers the team mate with the fewest PV (not himself)', () => {
    const hitOn = (team: number[]) => {
      const s = duel([10, 1513, 2, 3], team, 11);
      const t = s.sides[1].units[1]; t.shield = 0; t.hp = Math.round(t.maxHp * 0.3); // the weakest
      s.sides[0].units[0].base.crit = 0;
      const [a] = hand(s, 0, [[10, 0, 1]]);
      const hp = t.hp;
      act(s, 0, { do: 'use', card: a.id, target: t.uid });
      return hp - t.hp;
    };
    // the same target (Jack) with David in goal, and with another goalkeeper of no aura
    expect(hitOn([100773, 3, 2, 1513])).toBeLessThan(hitOn([1548, 3, 2, 1513]));
  });
  it('two ★ always make a ★★, with the coach Travis too (his first fusion of the turn gives an orb instead)', () => {
    for (const coach of [null, 'travis'] as const) {
      const s = createDuel([teamOf(byId, [10, 1, 1513, 2], coach), teamOf(byId, [29, 1541, 1532, 1542], null)], 4, 0);
      const ss = s.sides[0], axel = ss.units[0];
      ss.mergedThisTurn = false; axel.gauge = 0;
      const [, , c] = hand(s, 0, [[10, 0, 1], [1, 0, 1], [10, 0, 1]]);
      act(s, 0, { do: 'move', card: c.id, to: 1 });
      expect(ss.hand.find((x) => x.owner === axel.uid)!.rank, String(coach)).toBe(2);
      // the move and the fusion give an orb each; Travis 2 more here (four of his Inazuma Japan: his passive +50 %)
      expect(axel.gauge, String(coach)).toBe(coach ? 4 : 2);
    }
  });
  it('a full Garra gains nothing more until the ulti is used, and then it empties', () => {
    const s = duel([10, 1, 1513, 2], [29, 1541, 1532, 1542]);
    const axel = s.sides[0].units.find((u) => u.pid === 10)!;
    axel.gauge = 5;
    const [a, , c, ult] = hand(s, 0, [[10, 0, 2], [1, 1, 1], [10, 1, 1], [10, 'u', 1]]);
    act(s, 0, { do: 'use', card: a.id });
    act(s, 0, { do: 'move', card: c.id, to: 0 });
    expect(axel.gauge).toBe(5);
    act(s, 0, { do: 'use', card: ult.id });
    expect(axel.gauge).toBe(0);
  });
  it('Gazelle is immune to being frozen', () => {
    const s = duel([1513, 10, 2, 3], [1370, 29, 1541, 1532]);
    const gazelle = s.sides[1].units.find((u) => u.pid === 1370)!;
    s.sides[0].units.find((u) => u.pid === 1513)!.gauge = 5;
    const [u] = hand(s, 0, [[1513, 'u', 1]]);
    act(s, 0, { do: 'use', card: u.id, target: gazelle.uid });
    expect(gazelle.status.congelado).toBeFalsy();
  });
});
