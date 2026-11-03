/** v1.5: Auras — rules, formula, 120 cap, inherited techniques, combined techniques through an Aura, save validation. */
import { describe, expect, it } from 'vitest';
import type { RosterEntry, Technique } from '../src/data/manifest';
import { newSave, migrate } from '../src/systems/save';
import { AURA_PCT, BOND_PCT, EFFECTIVE_STAT_MAX, auraBonus, auraProblem, carrierForRun, carrierOf, equipAura, inheritedTechs, removeAura, sanitizeAuras, topStats, withAura } from '../src/systems/auras';
import { AURA_BONDS } from '../src/data/auraBonds';
import { COMBOS, comboCast, comboReady } from '../src/systems/combos';
import { STAT_MAX, playerStats } from '../src/systems/training';
import { statDamage } from '../src/systems/playerStats';
import { placeInSquad } from '../src/systems/squad';

const tech = (id: number, name: string, type: Technique['type'], power: number, element = 'Fuego'): Technique =>
  ({ id, name, description: '', type, element, power, cost: 10, unlockLevel: 1, growth: null });
const P = (id: number, name: string, rarity: RosterEntry['rarity'], techniques: Technique[], stats: Record<string, number> | null = null, element = 'Fuego'): RosterEntry => ({
  id, name, nickname: name, position: 'FW', element, teams: ['Raimon'], rarity, body: 'field', head: { texture: '', frameW: 32, frameH: 32, originX: 16, originY: 31, columns: 16, cells: 72 } as RosterEntry['head'],
  stats: stats ?? { kick: 80, control: 70, guard: 40, body: 60, speed: 75, guts: 65, stamina: 55 }, fpMax: null, techniques, starter: false, startUnlocked: false,
});
const axel = P(10, 'Axel Blaze', 'legendario', [tech(1, 'Tornado de fuego', 'tiro', 60), tech(2, 'Tormenta de fuego', 'tiro', 90)]);
const shawn = P(1513, 'Shawn Froste', 'legendario', [tech(3, 'Ventisca eterna', 'tiro', 70, 'Aire'), tech(4, 'Patinaje', 'regate', 40, 'Aire'), tech(5, 'Lobo legendario', 'tiro', 95, 'Aire'), tech(6, 'Talento', 'talento', 0)], undefined, 'Aire');
const mark = P(1, 'Mark Evans', 'legendario', [tech(7, 'Mano celestial', 'parada', 60, 'Montaña')], undefined, 'Montaña');
const comun = P(500, 'Novato', 'comun', [tech(8, 'Tiro', 'tiro', 20)]);
const epico = P(501, 'Épico', 'epico', [tech(9, 'Otro', 'tiro', 40)]);
const mitico = P(502, 'Mítico', 'mitico', [tech(10, 'Mítica', 'tiro', 80)]);
const leyenda = P(503, 'Leyenda', 'leyenda', [tech(11, 'Legendaria', 'tiro', 99)]);
const all = [axel, shawn, mark, comun, epico, mitico, leyenda];
const byId = new Map(all.map((p) => [p.id, p]));
const fresh = () => { const s = newSave(all.map((p) => p.id), 10); s.squad = [10, 1, 500]; s.captainId = 10; return s; };

describe('equipping', () => {
  it('Legendario, Mítico and Leyenda can be Auras; Común, Raro and Épico cannot — but anyone can carry one', () => {
    const s = fresh();
    expect(equipAura(s, comun, shawn).ok).toBe(true); // a Común carries a Legendario
    expect(equipAura(s, axel, mitico).ok).toBe(true);
    expect(equipAura(s, mark, leyenda).ok).toBe(true);
    const bad = equipAura(s, axel, epico);
    expect(bad.ok).toBe(false);
    expect(auraProblem(s, axel, comun)).toMatch(/Legendarios/);
  });
  it('one per carrier, one carrier per Aura, never oneself, no chains, and it costs nothing', () => {
    const s = fresh();
    const copies = JSON.stringify(s.owned);
    expect(equipAura(s, axel, shawn).ok).toBe(true);
    expect(auraProblem(s, axel, axel)).toMatch(/propia/);
    // moving Shawn to Mark takes him off Axel
    const r = equipAura(s, mark, shawn);
    expect(r.ok && r.movedFrom).toBe(10);
    expect(carrierOf(s, shawn.id)).toBe(1);
    expect(s.auras?.['10']).toBeUndefined();
    // Mark carries an Aura: he can't be one; Shawn is an Aura: he can't carry one
    expect(auraProblem(s, axel, mark)).toMatch(/encadenan/);
    expect(auraProblem(s, shawn, mitico)).toMatch(/ya es el Aura/);
    expect(JSON.stringify(s.owned)).toBe(copies); // the collection is untouched
    removeAura(s, 1);
    expect(s.auras).toEqual({});
  });
  it('one copy, one place: an Aura in the squad leaves it, and going back into the squad releases it', () => {
    const s = fresh();
    expect(equipAura(s, axel, mark).ok).toBe(true);
    expect(s.squad).not.toContain(1);
    placeInSquad(s, byId, 1, 1);
    expect(s.squad).toContain(1);
    expect(s.auras?.['10']).toBeUndefined();
    expect(auraProblem(s, mark, axel, [10, 1])).toMatch(/capitán/);
  });
});

describe('stats', () => {
  it('the three best stats of the Aura, ties in a fixed order', () => {
    expect(topStats({ kick: 90, control: 90, guard: 10, body: 10, speed: 90, guts: 90, stamina: 10 })).toEqual(['kick', 'control', 'speed']);
  });
  it('15% normal, 20% compatible, from the Aura\'s own stat; rounded half up', () => {
    const s = fresh();
    const own = playerStats(s, shawn, 'legendario', false);
    const top = topStats(own);
    const normal = auraBonus(s, mark.id + 1000, shawn); // no bond with an unknown carrier
    const bond = auraBonus(s, axel.id, shawn); // Axel + Shawn: bond
    expect(normal.pct).toBe(AURA_PCT);
    expect(bond.pct).toBe(BOND_PCT);
    expect(bond.bond?.kind).toBe('tecnica');
    for (const k of top) {
      expect(normal.add[k]).toBe(Math.round(own[k] * 0.15));
      expect(bond.add[k]).toBe(Math.round(own[k] * 0.2));
    }
    expect(Object.keys(bond.add)).toHaveLength(3);
    // the example of the design: 90 + 95 × 0.15 = 104.25 → 104; × 0.2 = 109
    expect(90 + Math.round(95 * 0.15)).toBe(104);
    expect(90 + Math.round(95 * 0.2)).toBe(109);
  });
  it('own stats stay at 99 at most; with the Aura the effective stat stops at 120', () => {
    const base = { kick: 99, control: 90, guard: 50, body: 50, speed: 50, guts: 50, stamina: 50 };
    const b = { auraId: 1, pct: 0.2, bond: null, keys: ['kick', 'control', 'guard'] as const, add: { kick: 25, control: 19, guard: 5 }, from: {} };
    const eff = withAura(base, { ...b, keys: [...b.keys] });
    expect(eff.kick).toBe(EFFECTIVE_STAT_MAX);
    expect(eff.control).toBe(109);
    expect(base.kick).toBe(STAT_MAX); // nothing written back
    // and combat reads it: 120 of kick hits harder than 99
    expect(statDamage({ stats: { kick: 120 } }, 'tiro')).toBeGreaterThan(statDamage({ stats: { kick: 99 } }, 'tiro'));
  });
  it('the Aura\'s stats never include another Aura (no recursion)', () => {
    const s = fresh();
    equipAura(s, axel, shawn);
    const a = auraBonus(s, comun.id, axel).add; // Axel's own stats, even though he carries Shawn (no bond with the Común: 15%)
    const own = playerStats(s, axel, 'legendario', false);
    for (const [k, v] of Object.entries(a)) expect(v).toBe(Math.round(own[k as keyof typeof own] * 0.15));
  });
});

describe('techniques and combined techniques', () => {
  it('two inherited techniques: the one a combination needs first, then the strongest; no talents, no repeats', () => {
    const t = inheritedTechs(axel, shawn).map((x) => x.name);
    expect(t).toEqual(['Ventisca eterna', 'Lobo legendario']);
    expect(inheritedTechs(P(20, 'X', 'comun', [tech(3, 'Ventisca eterna', 'tiro', 70)]), shawn).map((x) => x.name)).not.toContain('Ventisca eterna');
  });
  it('the run copy appends them (marked, learnable) without touching the own repertoire', () => {
    const s = fresh();
    equipAura(s, axel, shawn);
    const run = carrierForRun(s, axel, playerStats(s, axel, 'legendario', false), shawn);
    expect(run.techniques.slice(0, 2)).toEqual(axel.techniques);
    expect(run.techniques.slice(2).every((x) => x.aura === shawn.id && x.unlockLevel === 1)).toBe(true);
    expect(run.aura?.name).toBe('Shawn Froste');
    expect(axel.techniques).toHaveLength(2);
  });
  it('Fuego cruzado with Shawn as Axel\'s Aura: needs Ventisca eterna active on Axel at level 5 (Fix 1.51)', () => {
    const fc = COMBOS.find((c) => c.id === 'fuego-cruzado')!;
    const s = fresh();
    const run = carrierForRun(s, axel, playerStats(s, axel, 'legendario', false), shawn);
    const vent = run.techniques.findIndex((t) => t.name === 'Ventisca eterna');
    const at = (lv: number) => [{ entry: run, state: { playerId: 10, slots: [0, vent], levels: { 0: 10, [vent]: lv } } }];
    expect(comboReady(fc, at(4))).toBe(false);
    expect(comboReady(fc, at(5))).toBe(true);
    expect(comboCast(fc, at(5)).map((c) => c.viaAura)).toEqual([false, true]);
  });
  it('La Tierra is NOT ready with Axel + Shawn-as-Aura alone: Mark has to be on the pitch', () => {
    const lt = COMBOS.find((c) => c.id === 'la-tierra')!;
    expect(lt.needs.map((n) => n.player).sort()).toEqual(['Axel Blaze', 'Mark Evans', 'Shawn Froste']);
    const s = fresh();
    const run = carrierForRun(s, axel, playerStats(s, axel, 'legendario', false), shawn);
    const axelOn = { entry: run, state: { playerId: 10, slots: [0, 2], levels: { 0: 7, 2: 7 } } };
    expect(comboReady(lt, [axelOn])).toBe(false);
    expect(comboReady(lt, [axelOn, { entry: mark, state: { playerId: 1, slots: [0], levels: { 0: 7 } } }])).toBe(true);
  });
});

describe('counterparts (Fix 1.51)', () => {
  it('Xene plays Xavier and Shawn + Axel plays Shawn in combined techniques, on the pitch or as an Aura', () => {
    const aurora = COMBOS.find((c) => c.id === 'la-aurora')!;
    const xene = P(1406, 'Xene', 'mitico', [tech(20, 'Tiro', 'tiro', 60)]);
    const shaxel = P(101321, 'Shawn + Axel', 'mitico', [tech(21, 'Tiro', 'tiro', 60)]);
    const on = (e: RosterEntry, lv: number) => ({ entry: e, state: { playerId: e.id, slots: [0], levels: { 0: lv } } });
    expect(comboReady(aurora, [on(xene, 3), on(shaxel, 5)])).toBe(true);
    expect(comboReady(aurora, [on(xene, 3)])).toBe(false);
    const s = newSave([1406, 1513], 1406);
    const run = carrierForRun(s, xene, playerStats(s, xene, 'mitico', false), shawn);
    expect(comboReady(aurora, [{ entry: run, state: { playerId: 1406, slots: [0], levels: { 0: 5 } } }])).toBe(true);
  });
});

describe('save', () => {
  it('validation keeps legal links and drops forged ones (not owned, self, duplicate, chain)', () => {
    const s = fresh();
    // keys are read in numeric order: 1→1513 wins, 10→1513 is a duplicate; 500→500 self; 502→9999 not owned;
    // 1513→503 is a chain (1513 is already an Aura) and 503 carrying it would make 503 a carrier too, so both go
    const raw = { ...s, auras: { '10': 1513, '1': 1513, '500': 500, '502': 9999, '1513': 503 } };
    const m = migrate(JSON.parse(JSON.stringify(raw)), [], null);
    expect(m.auras).toEqual({ '1': 1513 });
  });
  it('sanitize drops Auras below Legendario (e.g. a forged Épico) and takes Auras out of the squad', () => {
    const s = fresh();
    s.auras = { '10': 501, '1': 1513 };
    s.squad = [10, 1, 1513];
    expect(sanitizeAuras(s, byId)).toBe(1);
    expect(s.auras).toEqual({ '1': 1513 });
    expect(s.squad).toEqual([10, 1]);
  });
  it('old saves without Auras load as before', () => {
    const s = fresh();
    delete (s as { auras?: unknown }).auras;
    expect(migrate(JSON.parse(JSON.stringify(s)), [], null).auras).toBeUndefined();
  });
});

describe('bond table', () => {
  it('pairs are unique, never a player with himself, and every combo id exists', () => {
    const keys = AURA_BONDS.map((b) => [b.a, b.b].sort((x, y) => x - y).join('-'));
    expect(new Set(keys).size).toBe(keys.length);
    for (const b of AURA_BONDS) {
      expect(b.a).not.toBe(b.b);
      expect(b.reason.length).toBeGreaterThan(10);
      expect(b.source.length).toBeGreaterThan(10);
      for (const c of b.combos ?? []) expect(COMBOS.some((x) => x.id === c)).toBe(true);
    }
  });
  it('every combined technique pair is a bond (its participants are compatible)', () => {
    for (const c of COMBOS) for (const a of c.needs) for (const b of c.needs) {
      if (a.player >= b.player) continue;
      const bond = AURA_BONDS.find((x) => (x.aName === a.player && x.bName === b.player) || (x.aName === b.player && x.bName === a.player));
      expect(bond, `${c.name}: ${a.player} + ${b.player}`).toBeTruthy();
    }
  });
});
