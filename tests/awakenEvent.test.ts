import { describe, expect, it } from 'vitest';
import { AWAKEN_EVENT, awakenEventActive, recordAwakenWin } from '../src/systems/awakenEvent';
import { migrate, newSave } from '../src/systems/save';

const open = Date.parse(AWAKEN_EVENT.from) + 3_600_000;

describe('3.0 Desafío del Despertar', () => {
  it('open only the first week of 3.0', () => {
    expect(awakenEventActive(Date.parse(AWAKEN_EVENT.from) - 1)).toBe(false);
    expect(awakenEventActive(open)).toBe(true);
    expect(awakenEventActive(Date.parse(AWAKEN_EVENT.to))).toBe(false);
  });
  it('5 wins on rank A or higher pay one Moneda de Despertar, once; lower ranks and closed weeks do not count', () => {
    const s = newSave([1], 1);
    expect(recordAwakenWin(s, 'B', open)).toBe(false);
    expect(s.awakenEv30).toBeUndefined();
    expect(recordAwakenWin(s, 'A', Date.parse(AWAKEN_EVENT.to) + 1)).toBe(false);
    for (let i = 0; i < 4; i++) expect(recordAwakenWin(s, i % 2 ? 'Z' : 'A', open)).toBe(false);
    expect(s.awakenCoins ?? 0).toBe(0);
    expect(recordAwakenWin(s, 'S', open)).toBe(true);
    expect(s.awakenCoins).toBe(1);
    expect(recordAwakenWin(s, 'X', open)).toBe(false);
    expect(s.awakenCoins).toBe(1);
  });
  it('the save keeps the progress through a reload and drops junk', () => {
    const s = migrate({ ...newSave([1], 1), awakenEv30: { wins: 3.7, done: 'si' } }, [1], 1);
    expect(s.awakenEv30).toEqual({ wins: 3 });
    expect(migrate({ ...newSave([1], 1), awakenEv30: 'x' }, [1], 1).awakenEv30).toBeUndefined();
  });
});
