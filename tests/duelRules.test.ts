import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { act, createDuel, onPitch, teamOf, unit, type Card, type DuelState } from '../src/systems/duel/rules';
import { cpuTurn } from '../src/systems/duel/cpu';

const manifest = JSON.parse(fs.readFileSync(path.resolve(__dirname, '..', 'public', 'generated', 'manifest.json'), 'utf-8'));
const byId = new Map((manifest.roster as { id: number }[]).map((p) => [p.id, p])) as Parameters<typeof teamOf>[0];
const RAIMON = [1, 10, 1513, 29]; // Mark, Axel, Shawn + Jude on the bench
const ROYAL = [1532, 1542, 1541, 2]; // King, Samford, Caleb + Nathan on the bench
const duel = (seed = 7, a = RAIMON, b = ROYAL) => createDuel([teamOf(byId, a, 'hillman'), teamOf(byId, b, 'ray-dark')], seed);
/** puts these cards (owner pid, technique 0/1, rank) as the hand of a side */
function hand(s: DuelState, side: 0 | 1, cards: [number, 0 | 1 | 'u', 1 | 2 | 3][]) {
  const ss = s.sides[side];
  ss.hand = cards.map(([pid, idx, rank]) => ({ id: s.nextId++, owner: ss.units.find((u) => u.pid === pid)!.uid, idx, rank }) as Card);
  return ss.hand;
}
const pidOf = (s: DuelState, uid: number) => unit(s, uid).pid;

describe('Modo Duelo: the rules engine', () => {
  it('the opening side gets 7 cards (2 per starter + 1) and only 2 actions; Ray Dark takes one card from the other side', () => {
    const s = duel();
    expect(s.active).toBe(0);
    // 7 minus Ray Dark's «Juego sucio» (equal cards dealt side by side then fuse at once, as in Grand Cross)
    expect(s.log.find((e) => e.t === 'deal' && e.side === 0)).toMatchObject({ cards: 6 });
    expect(s.sides[0].actions).toBe(2);
    act(s, 0, { do: 'end' });
    expect(s.active).toBe(1);
    expect(s.log.filter((e) => e.t === 'deal' && e.side === 1).at(-1)).toMatchObject({ cards: 7 });
    expect(s.sides[1].actions).toBe(3);
  });
  it('the same seed and the same actions give the same match', () => {
    const run = () => { const s = duel(42); for (let k = 0; k < 10 && s.winner < 0; k++) cpuTurn(s, 'dificil', () => 0.5); return JSON.stringify(s.sides.map((x) => x.units.map((u) => u.hp))); };
    expect(run()).toBe(run());
  });
  it('two equal cards side by side fuse when one is moved next to the other, and the fusion fills the gauge', () => {
    const s = duel();
    const [a, , c] = hand(s, 0, [[1513, 0, 1], [1, 0, 1], [1513, 0, 1]]); // Shawn, Mark, Shawn (no combined technique between them)
    const shawn = unit(s, a.owner), g = shawn.gauge;
    expect(act(s, 0, { do: 'move', card: c.id, to: 1 })).toBeNull();
    expect(s.sides[0].hand.map((x) => [pidOf(s, x.owner), x.rank])).toEqual([[1513, 2], [1, 1]]);
    expect(shawn.gauge).toBe(g + 1);
  });
  it('using the card between two equal ones fuses them for free', () => {
    const s = duel();
    const [, mid] = hand(s, 0, [[10, 1, 1], [1, 0, 1], [10, 1, 1]]);
    act(s, 0, { do: 'use', card: mid.id });
    expect(s.sides[0].hand.map((x) => [pidOf(s, x.owner), x.idx, x.rank])).toEqual([[10, 1, 2]]);
    expect(s.sides[0].actions).toBe(1);
  });
  it('damage follows the formula: ATQ × card × 1000/(1000+DEF) × element, ±5 %', () => {
    const s = duel();
    const axel = s.sides[0].units[1], target = onPitch(s.sides[1]).find((u) => u.pid === 1542)!; // Samford
    axel.base.crit = 0;
    const [c] = hand(s, 0, [[10, 1, 1]]); // Trampolín relámpago ★ (Ataque ×1.5)
    act(s, 0, { do: 'use', card: c.id, target: target.uid });
    const hit = s.log.find((e) => e.t === 'hit' && e.to === target.uid) as { dmg: number; elem: number };
    const groupBonus = 1.08; // Mark, Axel and Shawn are 3 of Inazuma Japan
    const expected = axel.base.atk * groupBonus * 1.5 * 1000 / (1000 + target.base.def * (1 - axel.base.pierce / 100)) * hit.elem;
    expect(hit.dmg).toBeGreaterThan(expected * 0.94);
    expect(hit.dmg).toBeLessThan(expected * 1.06);
  });
  it('a starter knocked out leaves with his cards and the bench comes in', () => {
    const s = duel();
    const king = s.sides[1].units[0];
    hand(s, 1, [[1532, 0, 1], [1542, 0, 1]]);
    king.hp = 1;
    const [c] = hand(s, 0, [[10, 1, 3]]);
    act(s, 0, { do: 'use', card: c.id, target: king.uid });
    expect(king.slot).toBe(-1);
    expect(s.sides[1].hand.every((x) => x.owner !== king.uid)).toBe(true);
    expect(s.sides[1].units[3].slot).toBe(0); // Nathan enters
  });
  it('a full gauge brings the ulti first into the hand, and using it empties the gauge', () => {
    const s = duel();
    s.sides[1].units[1].gauge = 5;
    act(s, 0, { do: 'end' });
    const u = s.sides[1].hand[0];
    expect(u.idx).toBe('u');
    act(s, 1, { do: 'use', card: u.id });
    expect(s.sides[1].units[1].gauge).toBe(0);
  });
  it('frozen: no cards next turn; a blow on a frozen footballer breaks the ice (×2)', () => {
    const s = duel();
    const caleb = s.sides[1].units[2];
    caleb.status.congelado = 1;
    act(s, 0, { do: 'end' });
    expect(s.sides[1].hand.some((c) => c.owner === caleb.uid)).toBe(false);
    act(s, 1, { do: 'end' });
    caleb.status.congelado = 1;
    s.sides[0].units[1].base.crit = 0;
    const [c] = hand(s, 0, [[10, 1, 1]]);
    act(s, 0, { do: 'use', card: c.id, target: caleb.uid });
    const hit = s.log.filter((e) => e.t === 'hit').at(-1) as { broke?: boolean };
    expect(hit.broke).toBe(true);
    expect(caleb.status.congelado).toBeUndefined();
  });
  it('taunt pulls single-target attacks, area attacks hit everyone', () => {
    const s = duel();
    const [king, samford] = s.sides[1].units;
    king.status.provocar = 2;
    const [c] = hand(s, 0, [[10, 1, 1]]);
    act(s, 0, { do: 'use', card: c.id, target: samford.uid });
    expect((s.log.filter((e) => e.t === 'hit').at(-1) as { to: number }).to).toBe(king.uid);
  });
  it("cards of ★★ of a combined technique side by side fuse into it (Mark + Axel: Súper relámpago, ×6)", () => {
    const s = duel();
    const [x] = hand(s, 0, [[1, 0, 2], [1513, 1, 1], [10, 0, 2]]);
    expect(s.sides[0].hand.some((c) => c.idx === 'c')).toBe(false); // ★ cards never join one
    act(s, 0, { do: 'move', card: s.sides[0].hand[2].id, to: 1 }); // Axel next to Mark
    expect(s.log.some((e) => e.t === 'combo')).toBe(true);
    expect(s.sides[0].hand.some((c) => c.idx === 'c')).toBe(true);
    void x;
  });
  it('CPU against CPU: every match ends with a winner, many seeds, no errors', () => {
    for (let seed = 1; seed <= 12; seed++) {
      const s = duel(seed);
      for (let k = 0; k < 60 && s.winner < 0; k++) cpuTurn(s, 'normal', () => 0.5);
      expect(s.winner, `seed ${seed}`).toBeGreaterThanOrEqual(0);
    }
  });
  it('in the tutorial the player never falls', () => {
    const s = duel(3);
    s.tutorial = { deals: [], dealt: 0 };
    for (const u of s.sides[0].units) u.hp = 1;
    act(s, 0, { do: 'end' });
    cpuTurn(s, 'dificil', () => 0.5);
    expect(s.sides[0].units.every((u) => u.slot >= 0)).toBe(true);
  });
});
