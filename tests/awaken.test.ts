/** 2.8: the Moneda de Despertar turns a HÉROE (not a Leyenda) into Campeón, his hero stars into levels; one gift per save. */
import { describe, expect, it } from 'vitest';
import type { RosterEntry } from '../src/data/manifest';
import { newSave, migrate } from '../src/systems/save';
import { ASC_COSTS, awaken, awakenCoins, canAwaken, championOf, giveAwakenGift, isHero, nextStep } from '../src/systems/ascension';
import { playerStats, statCapOf, trainMaxOf } from '../src/systems/training';

const P = (id: number, rarity: RosterEntry['rarity']): RosterEntry => ({ id, name: `P${id}`, nickname: `P${id}`, position: 'FW', element: 'Fuego', teams: [], rarity, body: 'field',
  head: {} as RosterEntry['head'], stats: { kick: 90, control: 85, guard: 60, body: 80, speed: 88, guts: 80, stamina: 75 }, fpMax: null, techniques: [], starter: false, startUnlocked: false });
const mit = P(1, 'mitico'), com = P(2, 'comun'), ley = P(3, 'leyenda');

describe('Moneda de Despertar (2.8)', () => {
  it('the gift arrives once per save and survives a reload', () => {
    const s = newSave([1], 1);
    expect(giveAwakenGift(s)).toBe(true);
    expect(giveAwakenGift(s)).toBe(false);
    expect(awakenCoins(s)).toBe(1);
    const back = migrate(JSON.parse(JSON.stringify(s)), [1], 1);
    expect(awakenCoins(back)).toBe(1);
    expect(giveAwakenGift(back)).toBe(false);
  });
  it('HÉROE » Campeón, HÉROE ★ » Campeón+, HÉROE ★★/★★★ » Campeón++; he stays HÉROE', () => {
    for (const [stars, lvl] of [[0, 1], [1, 2], [2, 3], [3, 3]]) {
      const s = newSave([1], 1);
      Object.assign(s.owned['1'], { hero: true, heroStars: stars || undefined });
      s.awakenCoins = 1;
      expect(awaken(s, mit)).toBe(lvl);
      expect(championOf(s, 1)).toBe(lvl);
      expect(isHero(s, 1)).toBe(true);
      expect(awakenCoins(s)).toBe(0);
    }
  });
  it('needs a coin, a HÉROE and not a Leyenda; one coin per footballer', () => {
    const s = newSave([1, 2, 3], 1);
    s.awakenCoins = 3;
    expect(canAwaken(s, com)).toBe(false); // not HÉROE
    expect(awaken(s, com)).toBe(0);
    Object.assign(s.owned['3'], { hero: true });
    expect(canAwaken(s, ley)).toBe(false); // Leyendas have their own path
    Object.assign(s.owned['2'], { hero: true });
    expect(awaken(s, com)).toBe(1);
    expect(awaken(s, com)).toBe(0); // already Campeón
    expect(awakenCoins(s)).toBe(2);
    s.awakenCoins = 0;
    Object.assign(s.owned['1'], { hero: true });
    expect(awaken(s, mit)).toBe(0);
  });
  it('an awakened HÉROE gets the Campeón limits and goes on along the Campeón path with duplicates', () => {
    const s = newSave([1], 1);
    Object.assign(s.owned['1'], { hero: true, heroStars: 1 });
    const before = playerStats(s, mit, 'mitico', true);
    s.awakenCoins = 1;
    awaken(s, mit);
    expect(statCapOf(s, mit)).toBe(119);
    expect(trainMaxOf(s, 1)).toBe(30);
    expect(playerStats(s, mit, 'mitico', true).kick).toBeGreaterThan(before.kick);
    expect(nextStep(s, mit)).toEqual({ step: 'campeon', cost: ASC_COSTS.mitico.estrella });
    s.owned['1'].champion = 3;
    expect(nextStep(s, mit)).toBeNull();
  });
});
