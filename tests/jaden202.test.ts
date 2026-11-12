import { describe, expect, it } from 'vitest';
import { clearRoad, compensateJaden202, compensateJaden3, jadenProgress, jadensFor, JADEN_ID } from '../src/systems/road';
import type { SaveData } from '../src/systems/save';

const jaden = { id: JADEN_ID, rarity: 'leyenda' as const };
const save = (clears: number, owned = false) => ({ owned: owned ? { [String(JADEN_ID)]: { stars: 0, copies: 1 } } : {}, coins: 0, road: { clears: { maxima: clears } } }) as unknown as SaveData;

describe('Jaden: 3 clears on Máxima, then a copy every 3 (2.3; every 5 in 2.02)', () => {
  it('counts and progress', () => {
    expect([0, 2, 3, 5, 6, 8, 9, 12].map(jadensFor)).toEqual([0, 0, 1, 1, 2, 2, 3, 4]);
    expect(jadenProgress(0)).toEqual({ left: 3, frac: 0 });
    expect(jadenProgress(3)).toEqual({ left: 3, frac: 0 });
    expect(jadenProgress(4)).toEqual({ left: 2, frac: 1 / 3 });
  });

  it('clearRoad gives him on the 3rd clear and a copy on the 6th', () => {
    const s = save(0);
    const got = [];
    for (let i = 0; i < 6; i++) { const r = clearRoad(s, 'maxima'); got.push(r.jaden); if (r.jaden === 'new') s.owned[String(JADEN_ID)] = { stars: 0, copies: 1 } as never; }
    expect(got).toEqual([null, null, 'new', null, null, 'copy']);
    expect(clearRoad(s, 'normal').jaden).toBeNull();
  });

  it('old clears are made up once: what the new rule gives minus one every 10', () => {
    const a = save(4); // nothing under the old rule: Jaden now
    expect(compensateJaden202(a, jaden)).toBe(1);
    expect(a.owned[String(JADEN_ID)]?.copies).toBe(1);
    expect(compensateJaden202(a, jaden)).toBe(0); // only once
    const b = save(23, true); // old: 2 · new: 1 + 6 = 7
    expect(compensateJaden202(b, jaden)).toBe(5);
    expect(b.owned[String(JADEN_ID)]?.copies).toBe(6);
    expect(compensateJaden3(b, jaden)).toBe(0); // the 2.02 make-up already used the 2.3 rule
    expect(compensateJaden202(save(0), jaden)).toBe(0);
  });

  it('2.3: whoever was paid one every 5 gets the difference to one every 3, once', () => {
    const c = save(23, true);
    c.jaden202 = true; // paid in 2.02: 1 + 4 = 5 · now: 1 + 6 = 7
    expect(compensateJaden3(c, jaden)).toBe(2);
    expect(c.owned[String(JADEN_ID)]?.copies).toBe(3);
    expect(compensateJaden3(c, jaden)).toBe(0);
    const d = save(5, true);
    d.jaden202 = true; // 1 under both rules
    expect(compensateJaden3(d, jaden)).toBe(0);
  });
});
