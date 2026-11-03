/** v1.65: profile banners — shop, achievements, the limited-time event, and save validation. */
import { describe, expect, it } from 'vitest';
import { EVENT_POOL, PENNANTS, PENNANT_EVENT } from '../src/data/pennants';
import { buyPennant, equipPennant, equippedPennant, eventActive, eventEnd, eventOdds, eventStart, grantAchievementPennants, pullEvent } from '../src/systems/pennants';
import { exportSave, importSave, newSave } from '../src/systems/save';

describe('banners', () => {
  it('fifteen: 3 shop (común, raro, épico), 2 achievements (legendario, leyenda), 10 event with one Mítico only there', () => {
    expect(PENNANTS).toHaveLength(15);
    expect(new Set(PENNANTS.map((p) => p.id)).size).toBe(15);
    expect(PENNANTS.filter((p) => p.source === 'tienda').map((p) => p.rarity)).toEqual(['comun', 'raro', 'epico']);
    expect(PENNANTS.filter((p) => p.source === 'logro').map((p) => p.rarity)).toEqual(['legendario', 'leyenda']);
    expect(EVENT_POOL).toHaveLength(10);
    const myth = PENNANTS.filter((p) => p.rarity === 'mitico');
    expect(myth).toHaveLength(1);
    expect(myth[0].source).toBe('evento');
    const odds = eventOdds();
    expect(odds.reduce((a, o) => a + o.pct, 0)).toBeCloseTo(100);
    expect(odds.find((o) => o.def.rarity === 'mitico')!.pct).toBe(3);
  });
  it('shop: buys once with coins, equips only what is owned', () => {
    const s = newSave([], null);
    s.coins = 3000;
    expect(buyPennant(s, 'relampago')).toBe(false); // 8000
    expect(buyPennant(s, 'supernova')).toBe(false); // not for sale
    expect(buyPennant(s, 'raimon')).toBe(true);
    expect(s.coins).toBe(500);
    expect(buyPennant(s, 'raimon')).toBe(false);
    expect(equipPennant(s, 'supernova')).toBe(false);
    expect(equipPennant(s, 'raimon')).toBe(true);
    expect(equippedPennant(s)?.id).toBe('raimon');
  });
  it('achievements: 200 footballers and a Leyenda', () => {
    const s = newSave([], null);
    const roster = Array.from({ length: 210 }, (_, i) => ({ id: i + 1, rarity: i === 0 ? 'leyenda' as const : 'comun' as const }));
    for (let i = 2; i <= 200; i++) s.owned[String(i)] = { stars: 0, copies: 1, obtainedAt: '' };
    expect(grantAchievementPennants(s, roster).map((p) => p.id)).toEqual([]); // 199
    s.owned['201'] = { stars: 0, copies: 1, obtainedAt: '' };
    expect(grantAchievementPennants(s, roster).map((p) => p.id)).toEqual(['caravana']);
    s.owned['1'] = { stars: 0, copies: 1, obtainedAt: '' };
    expect(grantAchievementPennants(s, roster).map((p) => p.id)).toEqual(['once-leyenda']);
    expect(grantAchievementPennants(s, roster)).toEqual([]);
  });
  it('event: 3 days, 1500 / 10000 coins, duplicates refund coins', () => {
    const s = newSave([], null);
    const mid = eventStart() + 1000;
    expect(eventEnd() - eventStart()).toBe(3 * 86_400_000);
    expect(eventActive(eventStart() - 1)).toBe(false);
    expect(eventActive(eventEnd())).toBe(false);
    s.coins = 1499;
    expect(pullEvent(s, 1, mid)).toBeNull();
    s.coins = PENNANT_EVENT.multiCost + PENNANT_EVENT.cost;
    expect(pullEvent(s, 1, eventEnd() + 1)).toBeNull();
    const one = pullEvent(s, 1, mid, () => 0)!; // first in the pool, a común
    expect(one[0]).toMatchObject({ isNew: true, refund: 0 });
    expect(s.coins).toBe(PENNANT_EVENT.multiCost);
    const ten = pullEvent(s, 10, mid, () => 0)!;
    expect(ten.every((r) => !r.isNew && r.refund === 150)).toBe(true);
    expect(s.coins).toBe(1500);
    const myth = pullEvent({ ...s, coins: 1500 }, 1, mid, () => 0.995)!;
    expect(myth[0].def.id).toBe('supernova');
  });
  it('save keeps known, owned banners only', () => {
    const s = newSave([], null);
    s.pennants = { owned: ['raimon', 'raimon', 'falso', 'supernova'], equipped: 'la-tierra' };
    const back = importSave(exportSave(s));
    expect(back.pennants).toEqual({ owned: ['raimon', 'supernova'] });
  });
});
