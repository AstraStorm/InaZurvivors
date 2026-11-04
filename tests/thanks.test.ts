import { describe, expect, it } from 'vitest';
import { THANKS_EVENT, thanksActive, thanksTokens, addThanksTokens } from '../src/systems/thanksEvent';
import { pull } from '../src/systems/gacha';
import { redeemLocal } from '../src/systems/promo';
import { newSave } from '../src/systems/save';
import type { RosterEntry } from '../src/data/manifest';

const at = (iso: string) => Date.parse(iso);
describe('Banner de agradecimiento (1.75)', () => {
  it('opens on 4 Nov at 15:00 Madrid and lasts 7 days', () => {
    expect(thanksActive(at('2026-11-04T14:59:00+01:00'))).toBe(false);
    expect(thanksActive(at('2026-11-04T15:00:00+01:00'))).toBe(true);
    expect(thanksActive(at('2026-11-11T14:59:00+01:00'))).toBe(true);
    expect(thanksActive(at('2026-11-11T15:00:00+01:00'))).toBe(false);
    expect(THANKS_EVENT).toMatchObject({ cost: 15, multiCost: 150, days: 7 });
  });
  it('Fichas de evento: as many as the normal fichas, only on Rango S or X while open', () => {
    const open = at('2026-11-05T12:00:00+01:00');
    expect(thanksTokens('S', 37, open)).toBe(37);
    expect(thanksTokens('X', 12, open)).toBe(12);
    expect(thanksTokens('A', 37, open)).toBe(0);
    expect(thanksTokens('S', 37, at('2026-11-20T12:00:00+01:00'))).toBe(0);
  });
  it('the event pull spends Fichas de evento, never the normal fichas', () => {
    const s = newSave([10], 10);
    s.tokens = 500; s.eventTokens = 0;
    const pool = [{ id: 900001, rarity: 'legendario' }, { id: 6, rarity: 'epico' }] as RosterEntry[];
    expect(pull(pool, s, 1, Math.random, { cost: 15, multiCost: 150, currency: 'eventTokens' })).toBeNull();
    addThanksTokens(s, 150);
    expect(pull(pool, s, 10, Math.random, { cost: 15, multiCost: 150, currency: 'eventTokens' })).toHaveLength(10);
    expect(s.eventTokens).toBe(0);
    expect(s.tokens).toBe(500);
  });
  it('GRACIAS (guest): a ×10 of the banner in Fichas de evento and 10.000 coins, once', () => {
    const s = newSave([10], 10);
    const coins = s.coins;
    const r = redeemLocal(s, 'gracias', []);
    expect(r.status).toBe('ok');
    expect(s.eventTokens).toBe(150);
    expect(s.coins).toBe(coins + 10000);
    expect(redeemLocal(s, 'GRACIAS', []).status).toBe('used');
  });
});
