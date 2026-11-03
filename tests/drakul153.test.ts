/** Fix 1.53: 3 copies of Drakul, once, for whoever ascended him while he was Raro. */
import { describe, expect, it } from 'vitest';
import { compensateDrakul153, DRAKUL_ID } from '../src/systems/ascension';
import { importSave, exportSave, newSave } from '../src/systems/save';

const k = String(DRAKUL_ID);
describe('Drakul compensation', () => {
  it('gives 3 copies once to an ascended Drakul and survives a save round trip', () => {
    const s = newSave([], null);
    s.owned[k] = { stars: 0, copies: 2, obtainedAt: '2026-11-01', spent: 1, ascMitico: true, ascRarity: 'epico' };
    expect(compensateDrakul153(s)).toBe(true);
    expect(s.owned[k].copies).toBe(5);
    const back = importSave(exportSave(s));
    expect(back.drakul153).toBe(true);
    expect(compensateDrakul153(back)).toBe(false);
    expect(back.owned[k].copies).toBe(5);
  });
  it('leaves a Drakul that was never ascended alone', () => {
    const s = newSave([], null);
    s.owned[k] = { stars: 0, copies: 1, obtainedAt: '2026-11-01' };
    compensateDrakul153(s);
    expect(s.owned[k].copies).toBe(1);
  });
});
