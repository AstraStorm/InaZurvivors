/** 1.84 (author): stars bought with coins, each one +5 to the limit of a chosen stat; 3 extra for HÉROE and Campeón. */
import { describe, expect, it } from 'vitest';
import type { RosterEntry } from '../src/data/manifest';
import { addCopy } from '../src/systems/gacha';
import { importSave, exportSave, newSave } from '../src/systems/save';
import { assignPick, buyStar, extraStarCost, nextStar, pendingPicks, starCost } from '../src/systems/stars';
import { statCapOf, trainRoom } from '../src/systems/training';

const leg = { id: 10, rarity: 'legendario', stats: { kick: 80, control: 70, guard: 40, body: 60, speed: 75, guts: 65, stamina: 55 } } as unknown as RosterEntry;
const fresh = (copies: number) => { const s = newSave([], null); for (let i = 0; i < copies; i++) addCopy(s, leg); return s; };

describe('stars (1.84)', () => {
  it('stars are bought with coins only: n × 10.000, no duplicates needed', () => {
    const s = fresh(1); s.coins = 25000;
    expect(nextStar(s, leg)).toMatchObject({ kind: 'star', n: 1, cost: 10000, copiesOk: true, coinsOk: true });
    expect(buyStar(s, leg, 'kick')).toBe('star');
    expect(nextStar(s, leg)).toMatchObject({ n: 2, cost: 20000, coinsOk: false });
    expect(buyStar(s, leg, 'kick')).toBe(false); // 15.000 left
    s.coins += 5000;
    expect(buyStar(s, leg, 'kick')).toBe('star');
    expect(s.coins).toBe(0);
    expect([starCost(1), starCost(5), extraStarCost(1), extraStarCost(3)]).toEqual([10000, 50000, 100000, 120000]);
  });
  it('each star raises the limit of the chosen stat by 5, and stacks', () => {
    const s = fresh(6); s.coins = 1e6;
    buyStar(s, leg, 'kick'); buyStar(s, leg, 'kick'); buyStar(s, leg, 'speed');
    expect(statCapOf(s, leg, 'kick')).toBe(109);
    expect(statCapOf(s, leg, 'speed')).toBe(104);
    expect(statCapOf(s, leg, 'guard')).toBe(99);
    expect(trainRoom(s, leg, 'legendario', false).kick).toBeGreaterThan(trainRoom(fresh(1), leg, 'legendario', false).kick);
    expect(importSave(exportSave(s)).owned['10'].starCaps).toEqual({ kick: 2, speed: 1 });
  });
  it('extra stars only for a HÉROE or Campeón with the 5 stars; old stars get their picks free', () => {
    const s = fresh(6); s.coins = 1e7;
    for (let i = 0; i < 5; i++) buyStar(s, leg, 'body');
    expect(nextStar(s, leg)).toBeNull();
    s.owned['10'].hero = true;
    expect(nextStar(s, leg)).toMatchObject({ kind: 'extra', n: 1, cost: 100000 });
    const old = fresh(1); old.owned['10'].stars = 3; old.owned['10'].hero = true; old.owned['10'].heroStars = 2; // before 1.84
    expect(pendingPicks(old, 10)).toBe(5);
    expect(assignPick(old, 10, 'guts')).toBe(true);
    expect(pendingPicks(old, 10)).toBe(4);
    expect(statCapOf(old, leg, 'guts')).toBe(104);
  });
});

describe('limits stack (author)', () => {
  it("a Campeón's +10 per level and the stars' +5 add up", () => {
    const ley = { id: 20, rarity: 'leyenda' } as RosterEntry;
    const s = newSave([], null); addCopy(s, ley);
    Object.assign(s.owned['20'], { champion: 3, stars: 5, heroStars: 0, starCaps: { kick: 3 } });
    expect(statCapOf(s, ley, 'kick')).toBe(99 + 30 + 15);
    expect(statCapOf(s, ley, 'speed')).toBe(129);
  });
});

describe('star reset (1.85)', () => {
  it('everyone starts again from 0 once, nothing given back', async () => {
    const { resetStars185 } = await import('../src/systems/stars');
    const s = fresh(10);
    Object.assign(s.owned['10'], { stars: 5, hero: true, heroStars: 2, spent: 8, starCaps: { kick: 3 } });
    expect(resetStars185(s, [leg])).toBe(true);
    expect(s.owned['10']).toMatchObject({ stars: 0, hero: true, spent: 8 });
    expect(s.owned['10'].heroStars).toBeUndefined();
    expect(s.owned['10'].starCaps).toBeUndefined();
    s.owned['10'].stars = 2;
    expect(resetStars185(s, [leg])).toBe(false); // only once
    expect(importSave(exportSave(s)).stars185).toBe(true);
    expect(s.owned['10'].stars).toBe(2);
  });
});

describe('all at once (1.85)', () => {
  it('several stars in one go, one stat each, as far as the coins go', async () => {
    const { buyStars, affordableStars } = await import('../src/systems/stars');
    const s = fresh(1); s.coins = 60000; // 10k + 20k + 30k
    expect(affordableStars(s, leg)).toEqual({ n: 3, costs: [10000, 20000, 30000] });
    expect(buyStars(s, leg, ['kick', 'kick', 'speed', 'guts'])).toBe(3); // the 4th is not affordable
    expect(s.owned['10'].starCaps).toEqual({ kick: 2, speed: 1 });
    expect(s.coins).toBe(0);
  });
  it('every footballer with enough duplicates ascends in one go', async () => {
    const { ascendAll, ascendableCount, ASC_COSTS } = await import('../src/systems/ascension');
    const epic = { id: 30, rarity: 'epico' } as RosterEntry, com = { id: 31, rarity: 'comun' } as RosterEntry;
    const s = newSave([], null);
    for (let i = 0; i <= ASC_COSTS.epico.ascenso * 2; i++) addCopy(s, epic);
    addCopy(s, com);
    expect(ascendableCount(s, [epic, com])).toBe(1);
    const done = ascendAll(s, [epic, com]);
    expect(done).toEqual([{ id: 30, steps: ['ascenso', 'ascenso'].slice(0, done[0].steps.length) }]);
    expect(done[0].steps.length).toBeGreaterThanOrEqual(1);
    expect(ascendableCount(s, [epic, com])).toBe(0);
  });
});
