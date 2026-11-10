import { describe, expect, it } from 'vitest';
import { clearRoad, compensateJaden202, jadenProgress, jadensFor, JADEN_ID } from '../src/systems/road';
import type { SaveData } from '../src/systems/save';

const jaden = { id: JADEN_ID, rarity: 'leyenda' as const };
const save = (clears: number, owned = false) => ({ owned: owned ? { [String(JADEN_ID)]: { stars: 0, copies: 1 } } : {}, coins: 0, road: { clears: { maxima: clears } } }) as unknown as SaveData;

describe('2.02 Jaden: 3 clears on Máxima, then a copy every 5', () => {
  it('counts and progress', () => {
    expect([0, 2, 3, 7, 8, 12, 13].map(jadensFor)).toEqual([0, 0, 1, 1, 2, 2, 3]);
    expect(jadenProgress(0)).toEqual({ left: 3, frac: 0 });
    expect(jadenProgress(3)).toEqual({ left: 5, frac: 0 });
    expect(jadenProgress(6)).toEqual({ left: 2, frac: 0.6 });
  });

  it('clearRoad gives him on the 3rd clear and a copy on the 8th', () => {
    const s = save(0);
    const got = [];
    for (let i = 0; i < 8; i++) { const r = clearRoad(s, 'maxima'); got.push(r.jaden); if (r.jaden === 'new') s.owned[String(JADEN_ID)] = { stars: 0, copies: 1 } as never; }
    expect(got).toEqual([null, null, 'new', null, null, null, null, 'copy']);
    expect(clearRoad(s, 'normal').jaden).toBeNull();
  });

  it('old clears are made up once: what the new rule gives minus one every 10', () => {
    const a = save(4); // nothing under the old rule: Jaden now
    expect(compensateJaden202(a, jaden)).toBe(1);
    expect(a.owned[String(JADEN_ID)]?.copies).toBe(1);
    expect(compensateJaden202(a, jaden)).toBe(0); // only once
    const b = save(23, true); // old: 2 · new: 1 + 4 = 5
    expect(compensateJaden202(b, jaden)).toBe(3);
    expect(b.owned[String(JADEN_ID)]?.copies).toBe(4);
    expect(compensateJaden202(save(0), jaden)).toBe(0);
  });
});
