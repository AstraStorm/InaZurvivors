/** 2.3 (author): the code INA303 for content creators. */
import { describe, expect, it } from 'vitest';
import { applyReward, LOCAL_CODES, redeemLocal } from '../src/systems/promo';
import { newSave } from '../src/systems/save';
import { hasPennant, visiblePennant } from '../src/systems/pennants';
import { PENNANT_BY_ID } from '../src/data/pennants';
import type { RosterEntry } from '../src/data/manifest';

const SEVEN = [1085, 900003, 900002, 900004, 900007, 900006, 900008];
const roster = [...SEVEN.map((id) => ({ id, rarity: 'leyenda', exclusive: 'gracias' }) as RosterEntry), { id: 3, rarity: 'legendario' } as RosterEntry];

describe('INA303', () => {
  it('gives 3.000 fichas, 1.500 fichas de evento, 300.000 coins, 9 Fichas EG, the seven and its banner and frame, once', () => {
    const s = newSave([10], 10);
    const before = { t: s.tokens, c: s.coins, e: s.eventTokens ?? 0, eg: s.egTokens ?? 0 };
    const r = redeemLocal(s, ' ina303 ', roster);
    expect(r.status).toBe('ok');
    expect(s.tokens - before.t).toBe(3000);
    expect(s.coins - before.c).toBe(300000);
    expect((s.eventTokens ?? 0) - before.e).toBe(1500);
    expect((s.egTokens ?? 0) - before.eg).toBe(9);
    for (const id of SEVEN) expect(s.owned[String(id)]?.copies).toBe(1);
    expect(r.reward!.player).toBeNull();
    expect(hasPennant(s, 'creador') && hasPennant(s, 'marco-creador')).toBe(true);
    expect(redeemLocal(s, 'INA303', roster).status).toBe('used');
  });
  it('opens the premium row of the season open now', () => {
    const s = newSave([10], 10), d = LOCAL_CODES.INA303;
    applyReward(s, 'INA303', { tokens: d.tokens, coins: d.coins, player: null, goldKey: true }, undefined, Date.parse('2026-11-20T12:00:00+01:00'));
    expect(s.season?.id).toBe('T1');
    expect(s.season?.gold).toBe(true);
    expect(s.season?.goldSeen).toBe(false);
  });
  it('its banner and frame are hidden to anyone who has not redeemed it', () => {
    const s = newSave([10], 10);
    const banner = PENNANT_BY_ID.get('creador')!, frame = PENNANT_BY_ID.get('marco-creador')!;
    expect(frame.kind).toBe('marco');
    expect(visiblePennant(s, banner) || visiblePennant(s, frame)).toBe(false);
    redeemLocal(s, 'INA303', roster);
    expect(visiblePennant(s, banner) && visiblePennant(s, frame)).toBe(true);
  });
});
