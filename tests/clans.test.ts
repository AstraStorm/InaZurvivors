import { describe, expect, it } from 'vitest';
import { PENNANT_BY_ID } from '../src/data/pennants';
import { addBag, boughtThisWeek, canPay, CLAN_ITEMS, CLAN_PRIZES, CLAN_SHOP_DEFAULT, clanShopPennants, clanDrops, clanNameProblem, clanShop, clanWeekKey, clanWeekLeftMs, payBag, recordBuy, tierOfPos } from '../src/systems/clans';
import { newSave } from '../src/systems/save';

describe('clans (1.93)', () => {
  it('prizes per tier as the author asked, and the position decides the tier', () => {
    expect(CLAN_PRIZES.top1).toMatchObject({ coins: 100000, tokens: 500 }); // 5 ×10
    expect(CLAN_PRIZES.top3).toMatchObject({ coins: 50000, tokens: 300 });
    expect(CLAN_PRIZES.top8).toMatchObject({ coins: 25000, tokens: 300 });
    expect(CLAN_PRIZES.resto).toMatchObject({ coins: 10000, tokens: 100 });
    expect(CLAN_PRIZES.top1.players).toEqual([expect.objectContaining({ n: 2 })]);
    expect(CLAN_PRIZES.top8.players.map((g) => g.n)).toEqual([1, 2]);
    expect([1, 2, 3, 4, 8, 9, 40].map(tierOfPos)).toEqual(['top1', 'top3', 'top3', 'top8', 'top8', 'resto', 'resto']);
  });
  it('five ROM items; drops grow with rivals, victory and rank, at most 20', () => {
    expect(CLAN_ITEMS.map((x) => x.icon)).toEqual([305, 1110, 1217, 1121, 1213]);
    const n = (b: Record<string, number | undefined>) => Object.values(b).reduce((a: number, x) => a + (x ?? 0), 0);
    expect(n(clanDrops({ kills: 0, victory: false, rank: 'C' }, Math.random))).toBe(0);
    expect(n(clanDrops({ kills: 600, victory: true, rank: 'S' }, Math.random))).toBe(16);
    expect(n(clanDrops({ kills: 99999, victory: true, rank: 'X' }, Math.random))).toBe(20);
  });
  it('the shop: same offers all week, new ones the next; stock per week; items paid', () => {
    const w = clanWeekKey(new Date('2026-11-11T12:00:00+01:00'));
    expect(w).toBe('2026-11-09');
    expect(clanWeekKey(new Date('2026-11-15T23:59:00+01:00'))).toBe(w);
    expect(clanWeekKey(new Date('2026-11-16T00:01:00+01:00'))).toBe('2026-11-16');
    expect(clanWeekLeftMs(new Date('2026-11-15T23:00:00+01:00'))).toBe(3_600_000);
    expect(clanShop(w)).toEqual(clanShop(w));
    const offers = clanShop(w);
    // 1.94 (author): the banners and frames on sale are the ones the author names for each week
    expect(offers.filter((o) => o.kind === 'pennant').map((o) => o.kind === 'pennant' && o.pennant)).toEqual(clanShopPennants(w));
    expect(clanShopPennants('2026-11-02')).toEqual(['marco-cerezo']);
    expect(clanShopPennants('2099-01-05')).toEqual(CLAN_SHOP_DEFAULT);
    expect([...CLAN_SHOP_DEFAULT, ...clanShopPennants('2026-11-02')].every((id) => PENNANT_BY_ID.get(id)?.source === 'clan')).toBe(true);
    const s = newSave([], null);
    expect(canPay(s, { pinchito: 1 })).toBe(false);
    addBag(s, { pinchito: 6, chapa: 1 });
    expect(canPay(s, { pinchito: 6 })).toBe(true);
    payBag(s, { pinchito: 6 });
    expect(s.clanItems).toEqual({ pinchito: 0, chapa: 1 });
    recordBuy(s, w, 'monedas-s');
    expect(boughtThisWeek(s, w, 'monedas-s')).toBe(1);
    expect(boughtThisWeek(s, '2026-11-16', 'monedas-s')).toBe(0);
  });
  it('names: the obvious problems are caught before asking the server', () => {
    expect(clanNameProblem('Rayos Del Sur')).toBeNull();
    expect(clanNameProblem('ab')).not.toBeNull();
    expect(clanNameProblem('123')).not.toBeNull();
    expect(clanNameProblem('Hola<script>')).not.toBeNull();
  });
});
