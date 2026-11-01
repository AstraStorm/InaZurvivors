import { describe, expect, it } from 'vitest';
import { GROUND_MAX, GROUND_MIN, orphans } from '../src/systems/groundSweep';

describe('ground marks never stay behind (Fix 1.12)', () => {
  it('removes only unowned, finished marks of the telegraph layer', () => {
    const pitch = { depth: -9990 }, aim = { depth: -9750 }, lost = { depth: -9800 }, fading = { depth: -9700 }, player = { depth: 500 };
    const out = orphans([pitch, aim, lost, fading, player], new Set([aim]), (o) => o === fading);
    expect(out).toEqual([lost]);
  });
  it('the pitch is drawn below the telegraph layer', () => {
    expect(GROUND_MIN).toBeGreaterThan(-9960); // MapBuilder draws at -9960 and below
    expect(GROUND_MAX).toBeLessThan(0);
  });
});

describe('promotional codes, guest side', async () => {
  const { newSave } = await import('../src/systems/save');
  const { redeemLocal, hasRedeemed } = await import('../src/systems/promo');
  const roster = [1, 2, 3].map((id) => ({ id, rarity: id === 2 ? 'legendario' : 'comun', teams: [], techniques: [] })) as never;
  it('ASTRA17 gives 72 fichas, 500 coins and a Legendario once; it waits to be linked to an account', () => {
    const s = newSave([], null);
    const t0 = s.tokens, c0 = s.coins;
    const r = redeemLocal(s, ' astra17 ', roster);
    expect(r.status).toBe('ok');
    expect(s.tokens - t0).toBe(72);
    expect(s.coins - c0).toBe(500);
    expect(s.owned['2']).toBeDefined();
    expect(hasRedeemed(s, 'ASTRA17')).toBe(true);
    expect(s.guestCodes).toEqual(['ASTRA17']);
    expect(redeemLocal(s, 'ASTRA17', roster).status).toBe('used');
    expect(redeemLocal(s, 'OTRO', roster).status).toBe('invalid');
  });
});

describe('combined techniques (Fix 1.12)', async () => {
  const { COMBOS, COMBOS_BY_PRIORITY, comboReady } = await import('../src/systems/combos');
  const member = (name: string, level: number) => ({ entry: { name, techniques: [{ name: 'X', type: 'tiro' }] }, state: { playerId: 0, slots: [0, null], levels: { 0: level } } }) as never;
  it('El Fénix, La Tierra, Remate caótico, Ventisca de fuego and La Tierra ∞ exist with sources and their own animation', () => {
    for (const id of ['el-fenix', 'la-tierra', 'remate-caotico', 'ventisca-de-fuego', 'la-tierra-inf']) {
      const c = COMBOS.find((x) => x.id === id)!;
      expect(c.source.length).toBeGreaterThan(20);
      expect(c.needs.length).toBeGreaterThanOrEqual(2);
    }
    expect(new Set(COMBOS.map((c) => c.effect)).size).toBe(COMBOS.length); // no two share an animation
    expect(COMBOS_BY_PRIORITY[0].priority).toBe(Math.max(...COMBOS.map((c) => c.priority)));
  });
  it('only with every participant on the pitch at the required level (owning them is not enough)', () => {
    const fenix = COMBOS.find((x) => x.id === 'el-fenix')!;
    expect(comboReady(fenix, [member('Erik Eagle', 5), member('Bobby Shearer', 5)])).toBe(false);
    expect(comboReady(fenix, [member('Erik Eagle', 5), member('Bobby Shearer', 5), member('Mark Evans', 4)])).toBe(false);
    expect(comboReady(fenix, [member('Erik Eagle', 5), member('Bobby Shearer', 5), member('Mark Evans', 5)])).toBe(true);
  });
});

describe('squad caps (Fix 1.12)', async () => {
  const { newSave } = await import('../src/systems/save');
  const { placeInSquad, squadOf, fillSquad } = await import('../src/systems/squad');
  const mk = (id: number, rarity: string) => ({ id, rarity, teams: [], techniques: [] }) as never;
  const roster = [1, 2, 3, 4].map((i) => mk(i, 'legendario')).concat([5, 6, 7].map((i) => mk(i, 'mitico')), [8, 9].map((i) => mk(i, 'leyenda')), [10, 11, 12].map((i) => mk(i, 'comun')));
  const byId = new Map(roster.map((p: { id: number }) => [p.id, p])) as never;
  const own = () => { const s = newSave([], null); for (const p of roster as { id: number }[]) s.owned[String(p.id)] = { copies: 1, stars: 0 } as never; return s; };
  it('at most 3 Legendarios, 2 Míticos and 1 Leyenda', () => {
    const s = own();
    [1, 2, 3].forEach((id, i) => expect(placeInSquad(s, byId, i, id)).toBe(true));
    expect(placeInSquad(s, byId, 3, 4)).toBe(false);
    expect(placeInSquad(s, byId, 0, 4)).toBe(true); // swapping one for another is fine
    expect(placeInSquad(s, byId, 3, 8)).toBe(true);
    expect(placeInSquad(s, byId, 4, 9)).toBe(false);
  });
  it('filling and old squads respect the caps', () => {
    const s = own();
    fillSquad(s, roster as never);
    const count = (r: string) => squadOf(s, byId).filter((p: { rarity: string }) => p.rarity === r).length;
    expect([count('legendario'), count('mitico'), count('leyenda')]).toEqual([3, 2, 1]);
    const old = own(); old.captainId = 1; old.squad = [1, 2, 3, 4, 5, 6, 7];
    expect(squadOf(old, byId).map((p: { id: number }) => p.id)).toEqual([1, 2, 3, 5, 6]);
  });
});
