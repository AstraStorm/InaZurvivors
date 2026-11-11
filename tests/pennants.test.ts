/** v1.65: profile banners — shop, achievements, the limited-time event, and save validation. */
import { describe, expect, it } from 'vitest';
import { EVENT_POOL, FRAMES as ALL_FRAMES, PENNANTS as ALL_PENNANTS, PENNANT_EVENT } from '../src/data/pennants';

// 1.81: the code banners/frames (INA483) are counted apart, in tests/ina483.test.ts; the BlueLock ones, at the end of this file
const PENNANTS = ALL_PENNANTS.filter((p) => p.source !== 'codigo' && p.source !== 'colab' && p.source !== 'pase' && p.source !== 'temporada'), FRAMES = ALL_FRAMES.filter((p) => p.source !== 'codigo' && p.source !== 'colab' && p.source !== 'pase' && p.source !== 'temporada'); // 2.1: the season pass ones are counted in seasonPass.test.ts
import { buyPennant, equipFrame, equippedFrame, equipPennant, equippedPennant, eventActive, eventEnd, eventOdds, eventStart, grantAchievementPennants, pullEvent } from '../src/systems/pennants';
import { exportSave, importSave, newSave, validate } from '../src/systems/save';
import { BLUELOCK_EVENT, recordBluelockWin } from '../src/systems/collabEvent';

describe('banners', () => {
  it('fifteen: 3 shop (común, raro, épico), 2 achievements (legendario, leyenda), 10 event with one Mítico only there', () => {
    expect(PENNANTS).toHaveLength(16); // 1.93: + 1 for the clan shop
    expect(new Set(PENNANTS.map((p) => p.id)).size).toBe(16);
    expect(PENNANTS.filter((p) => p.source === 'clan').map((p) => p.id)).toEqual(['clan-cerezo']);
    expect(PENNANTS.filter((p) => p.source === 'tienda').map((p) => p.rarity)).toEqual(['comun', 'raro', 'epico']);
    expect(PENNANTS.filter((p) => p.source === 'logro').map((p) => p.rarity)).toEqual(['legendario', 'leyenda']);
    expect(EVENT_POOL).toHaveLength(20); // ten banners + ten frames
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
    expect(grantAchievementPennants(s, roster).map((p) => p.id)).toEqual(['caravana', 'marco-caravana']);
    s.owned['1'] = { stars: 0, copies: 1, obtainedAt: '' };
    expect(grantAchievementPennants(s, roster).map((p) => p.id)).toEqual(['once-leyenda', 'marco-leyenda']);
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
    expect(myth[0].def.id).toBe('marco-supernova'); // the pool lists the banners, then the frames
    expect(pullEvent({ ...s, coins: 1500 }, 1, mid, () => 0.48)![0].def.id).toBe('supernova');
  });
  it('frames: fifteen like the banners, worn apart from the banner, each Mítico at 3%', () => {
    expect(FRAMES).toHaveLength(16);
    expect(FRAMES.filter((p) => p.source === 'clan').map((p) => p.id)).toEqual(['marco-cerezo']);
    expect(FRAMES.every((f) => f.kind === 'marco')).toBe(true);
    expect(FRAMES.filter((p) => p.source === 'tienda').map((p) => p.rarity)).toEqual(['comun', 'raro', 'epico']);
    const odds = eventOdds();
    expect(odds.filter((o) => o.def.rarity === 'mitico').map((o) => [o.def.id, o.pct])).toEqual([['supernova', 3], ['marco-supernova', 3]]);
    const s = newSave([], null);
    s.coins = 2000;
    expect(buyPennant(s, 'marco-raimon')).toBe(true);
    expect(equipPennant(s, 'marco-raimon')).toBe(false); // a frame is not a banner
    expect(equipFrame(s, 'marco-raimon')).toBe(true);
    expect(equippedFrame(s)?.id).toBe('marco-raimon');
    expect(equippedPennant(s)).toBeUndefined();
    s.pennants!.equipped = 'marco-raimon'; // a frame in the banner slot is dropped on load
    expect(importSave(exportSave(s)).pennants).toEqual({ owned: ['marco-raimon'], frame: 'marco-raimon' });
  });
  it('save keeps known, owned banners only', () => {
    const s = newSave([], null);
    s.pennants = { owned: ['raimon', 'raimon', 'falso', 'supernova'], equipped: 'la-tierra' };
    const back = importSave(exportSave(s));
    expect(back.pennants).toEqual({ owned: ['raimon', 'supernova'] });
  });
});

describe('1.94 clan pennants', () => {
  it('the removed clan banner and frame become the cherry ones in old saves', () => {
    const s = newSave([], null);
    (s as unknown as { pennants: unknown }).pennants = { owned: ['clan-estandarte', 'marco-clan', 'raimon'], equipped: 'clan-estandarte', frame: 'marco-clan' };
    validate(s);
    expect(s.pennants).toEqual({ owned: ['clan-cerezo', 'marco-cerezo', 'raimon'], equipped: 'clan-cerezo', frame: 'marco-cerezo' });
  });
});

describe('InaZurvivors x BlueLock celebration', () => {
  const open = Date.parse(BLUELOCK_EVENT.start) + 3_600_000;
  it('the banner needs 3 wins while the collab is open; the frame, Nagi and Isagi', () => {
    const s = newSave([], null);
    recordBluelockWin(s, Date.parse(BLUELOCK_EVENT.start) - 1); // before it opens: does not count
    recordBluelockWin(s, open); recordBluelockWin(s, open);
    expect(grantAchievementPennants(s, [])).toEqual([]);
    recordBluelockWin(s, open);
    expect(grantAchievementPennants(s, []).map((p) => p.id)).toEqual(['colab-bluelock']);
    s.owned['900200'] = { stars: 0, copies: 1, obtainedAt: '' };
    expect(grantAchievementPennants(s, [])).toEqual([]);
    s.owned['900201'] = { stars: 0, copies: 1, obtainedAt: '' };
    expect(grantAchievementPennants(s, []).map((p) => p.id)).toEqual(['marco-bluelock']);
    expect(equipFrame(s, 'marco-bluelock') && equipPennant(s, 'colab-bluelock')).toBe(true);
  });
  it('the wins counter survives validation and bad values are cleared', () => {
    const s = newSave([], null);
    s.blWins = 2.7;
    expect(validate(s).blWins).toBe(2);
    (s as unknown as { blWins: unknown }).blWins = -4;
    expect('blWins' in validate(s)).toBe(false);
  });
});
