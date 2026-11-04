/** 1.8: the GTS ledger applied to the save (gts.ts): each movement once, the travelling copy goes clean. */
import { describe, expect, it } from 'vitest';
import { newSave, migrate } from '../src/systems/save';
import { applyGtsLedger, canLeave, gtsSlots, type GtsRow } from '../src/systems/gts';

const row = (id: number, role: GtsRow['role'], give: number, want: number, status: GtsRow['status'], other = 'X'): GtsRow =>
  ({ id, role, give_id: give, want_id: want, status, created_at: `2026-11-06T10:00:0${id}Z`, closed_at: null, other });
const fresh = () => { const s = newSave([10, 20], 10); s.owned['10'].copies = 3; s.owned['10'].train = { kick: 5 }; return s; };

describe('GTS (1.8)', () => {
  it('only spare copies, never Leyenda, HÉROE or event footballers', () => {
    const s = fresh();
    expect(canLeave(s, { id: 10, rarity: 'raro' })).toBeNull();
    expect(canLeave(s, { id: 20, rarity: 'raro' })).toMatch(/repetidas/);
    expect(canLeave(s, { id: 10, rarity: 'leyenda' })).toMatch(/Leyenda/);
    expect(canLeave(s, { id: 10, rarity: 'raro', exclusive: 'evento' })).toMatch(/evento/);
    s.owned['10'].hero = true;
    expect(canLeave(s, { id: 10, rarity: 'raro' })).toMatch(/HÉROE/);
  });
  it('a deposit leaves one copy; withdrawn it comes back; traded the one asked for arrives; each only once', () => {
    const s = fresh();
    let ev = applyGtsLedger(s, [row(1, 'deposito', 10, 30, 'open')]);
    expect(ev.map((e) => e.kind)).toEqual(['dejado']);
    expect(s.owned['10'].copies).toBe(2);
    expect(s.owned['10'].train).toEqual({ kick: 5 }); // the footballer who stays keeps his training
    ev = applyGtsLedger(s, [row(1, 'deposito', 10, 30, 'traded', 'Ana')]);
    expect(ev).toEqual([{ kind: 'recibido', id: 1, left: 10, arrived: 30, other: 'Ana' }]);
    expect(s.owned['30'].copies).toBe(1);
    expect(applyGtsLedger(s, [row(1, 'deposito', 10, 30, 'traded')])).toEqual([]); // nothing twice
    applyGtsLedger(s, [row(2, 'deposito', 10, 31, 'withdrawn')]); // left and withdrawn while away: both at once
    expect(s.owned['10'].copies).toBe(2);
  });
  it('as taker: the copy asked for leaves and the deposited one arrives (new or as one more copy)', () => {
    const s = fresh();
    expect(applyGtsLedger(s, [row(5, 'tomado', 40, 10, 'traded')])).toEqual([{ kind: 'cambiado', id: 5, left: 10, arrived: 40, other: 'X' }]);
    expect(s.owned['10'].copies).toBe(2);
    expect(s.owned['40']).toMatchObject({ copies: 1, stars: 0 });
    expect(s.owned['40'].train).toBeUndefined(); // it arrives clean
  });
  it('slots: 1 plus the Ventanilla GTS upgrade, 5 at most; the marks survive a save round trip', () => {
    const s = fresh();
    expect(gtsSlots(s)).toBe(1);
    s.upgrades.gts = 4; expect(gtsSlots(s)).toBe(5);
    s.upgrades.gts = 9; expect(gtsSlots(s)).toBe(5);
    applyGtsLedger(s, [row(7, 'deposito', 10, 30, 'open')]);
    const back = migrate(JSON.parse(JSON.stringify({ ...s, gts: { applied: [...s.gts!.applied, 'x:1', 7] } })), [10, 20], 10);
    expect(back.gts).toEqual({ applied: ['d:7'] });
  });
});
