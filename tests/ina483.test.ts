/** 1.81 (author): the code INA483 and its banner and frame, which nobody without the code sees. */
import { describe, expect, it } from 'vitest';
import { codePlayer, creatorGiftINA483, redeemLocal } from '../src/systems/promo';
import { newSave } from '../src/systems/save';
import { hasPennant, visiblePennant } from '../src/systems/pennants';
import { PENNANT_BY_ID } from '../src/data/pennants';
import type { RosterEntry } from '../src/data/manifest';

const P = (id: number, rarity: RosterEntry['rarity'], exclusive?: string) => ({ id, rarity, ...(exclusive ? { exclusive } : {}) }) as RosterEntry;
const roster = [P(1, 'comun'), P(2, 'epico'), P(3, 'legendario'), P(4, 'mitico'), P(5, 'leyenda'), P(6, 'legendario', 'gracias')];

describe('INA483', () => {
  it('gives 5+5 ×10 pulls, 20.000 coins, a Legendario or higher and its banner and frame, once', () => {
    const s = newSave([10], 10);
    const before = { t: s.tokens, c: s.coins, e: s.eventTokens ?? 0 };
    const r = redeemLocal(s, ' ina483 ', roster, () => 0.5);
    expect(r.status).toBe('ok');
    expect(s.tokens - before.t).toBe(500);
    expect(s.coins - before.c).toBe(20000);
    expect((s.eventTokens ?? 0) - before.e).toBe(750);
    expect([3, 4, 5]).toContain(r.reward!.player);
    expect(hasPennant(s, 'inazuma') && hasPennant(s, 'marco-inazuma')).toBe(true);
    expect(hasPennant(s, 'creador') && hasPennant(s, 'marco-creador')).toBe(true); // 2.3
    expect(redeemLocal(s, 'INA483', roster).status).toBe('used');
  });
  it('2.3: whoever redeemed it before gets the content creators\' banner and frame on load, once', () => {
    const s = newSave([10], 10);
    expect(creatorGiftINA483(s)).toBe(false);
    s.redeemedCodes = ['INA483'];
    expect(creatorGiftINA483(s)).toBe(true);
    expect(hasPennant(s, 'creador') && hasPennant(s, 'marco-creador')).toBe(true);
    expect(creatorGiftINA483(s)).toBe(false);
  });
  it('the footballer follows the odds and is never event-only', () => {
    const odds = { legendario: 80, mitico: 17, leyenda: 3 };
    expect(codePlayer(roster, odds, () => 0)).toBe(3);
    expect(codePlayer(roster, odds, () => 0.85)).toBe(4);
    expect(codePlayer(roster, odds, () => 0.99)).toBe(5);
    for (let i = 0; i < 200; i++) expect(codePlayer(roster, odds, Math.random)).not.toBe(6);
  });
  it('its banner and frame are hidden to anyone who has not redeemed it', () => {
    const s = newSave([10], 10);
    const banner = PENNANT_BY_ID.get('inazuma')!, frame = PENNANT_BY_ID.get('marco-inazuma')!;
    expect(frame.kind).toBe('marco');
    expect(visiblePennant(s, banner) || visiblePennant(s, frame)).toBe(false);
    expect(visiblePennant(s, PENNANT_BY_ID.get('raimon')!)).toBe(true);
    redeemLocal(s, 'INA483', roster);
    expect(visiblePennant(s, banner) && visiblePennant(s, frame)).toBe(true);
  });
  it('saves with the first names (ina483) keep their banner and frame', async () => {
    const { validate } = await import('../src/systems/save');
    const s = validate({ ...newSave([10], 10), pennants: { owned: ['ina483', 'marco-ina483'], equipped: 'ina483', frame: 'marco-ina483' } });
    expect(s.pennants).toEqual({ owned: ['inazuma', 'marco-inazuma'], equipped: 'inazuma', frame: 'marco-inazuma' });
  });
});
