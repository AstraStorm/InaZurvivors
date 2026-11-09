/** 2.0 (author): where Fichas EG come from besides rank X/Z wins — the code EGu3rr3r0, the clan shop and the weekly clan prizes. */
import { describe, expect, it } from 'vitest';
import { newSave } from '../src/systems/save';
import { redeemLocal } from '../src/systems/promo';
import { CLAN_EG_STOCK, CLAN_PRIZES, clanShop } from '../src/systems/clans';

describe('Fichas EG', () => {
  it('the code EGu3rr3r0 gives 3, once (any case)', () => {
    const s = newSave([], null);
    const r = redeemLocal(s, 'EGu3rr3r0', []);
    expect(r.status).toBe('ok');
    expect(r.reward?.egTokens).toBe(3);
    expect(s.egTokens).toBe(3);
    expect(redeemLocal(s, 'egu3rr3r0', []).status).toBe('used');
    expect(s.egTokens).toBe(3);
  });
  it('the clan shop sells them one at a time, 6 a week at most, every week', () => {
    expect(CLAN_EG_STOCK).toBe(6);
    for (const week of ['2026-11-09', '2026-11-16', '2027-01-04']) {
      const eg = clanShop(week).find((o) => o.kind === 'eg');
      expect(eg).toMatchObject({ kind: 'eg', egTokens: 1, stock: 6 });
    }
  });
  it('the weekly clan prizes give 12 / 8 / 5 / 2', () => {
    expect([CLAN_PRIZES.top1.eg, CLAN_PRIZES.top3.eg, CLAN_PRIZES.top8.eg, CLAN_PRIZES.resto.eg]).toEqual([12, 8, 5, 2]);
  });
});
