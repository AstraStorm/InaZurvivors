/** 1.76 (author): five saved teams in Mi Equipo, and a footballer who leaves the squad takes his Aura off. */
import { describe, expect, it } from 'vitest';
import type { RosterEntry } from '../src/data/manifest';
import { newSave, migrate } from '../src/systems/save';
import { clearSquad, placeInSquad, removeFromSquad, renameSquad, savedSquads, squadOf, switchSquad, syncActiveSquad } from '../src/systems/squad';

const P = (id: number, rarity: RosterEntry['rarity'] = 'legendario'): RosterEntry => ({ id, name: `P${id}`, nickname: `P${id}`, position: 'FW', element: 'Fuego', teams: [],
  rarity, body: 'field', head: {} as RosterEntry['head'], stats: null, fpMax: null, techniques: [], starter: false, startUnlocked: false });
const all = [1, 2, 3, 4, 5, 6, 7, 8, 9].map((id) => P(id));
const byId = new Map(all.map((p) => [p.id, p]));
const fresh = () => { const s = newSave(all.map((p) => p.id), 1); s.squad = [1, 2, 3]; s.captainId = 1; s.auras = { 2: 8 }; return s; };

describe('Auras follow the squad (1.76)', () => {
  it('removing a footballer takes his Aura off; the others keep theirs', () => {
    const s = fresh(); s.auras = { 2: 8, 3: 9 };
    removeFromSquad(s, byId, 2);
    expect(s.auras).toEqual({ 3: 9 });
  });
  it('replacing someone in his slot takes the leaving one\'s Aura off', () => {
    const s = fresh();
    placeInSquad(s, byId, 1, 5);
    expect(squadOf(s, byId).map((p) => p.id)).toEqual([1, 5, 3]);
    expect(s.auras).toEqual({});
  });
  it('Vaciar keeps the captain and his Aura only', () => {
    const s = fresh(); s.auras = { 1: 9, 2: 8 };
    clearSquad(s, byId);
    expect(squadOf(s, byId).map((p) => p.id)).toEqual([1]);
    expect(s.auras).toEqual({ 1: 9 });
  });
});

describe('five saved teams (1.76)', () => {
  it('the current team becomes team 1; switching saves it and loads the other with its own Auras and formation', () => {
    const s = fresh();
    expect(savedSquads(s).map((q) => q.name)).toEqual(['Equipo 1', 'Equipo 2', 'Equipo 3', 'Equipo 4', 'Equipo 5']);
    expect(savedSquads(s)[0].squad).toEqual([1, 2, 3]);
    switchSquad(s, 1);
    expect(squadOf(s, byId)).toEqual([]); // a new team starts empty, without the old captain
    expect(s.auras).toEqual({});
    placeInSquad(s, byId, 0, 4); placeInSquad(s, byId, 1, 5); s.auras = { 5: 2 }; s.formation = 'ofensiva';
    syncActiveSquad(s);
    switchSquad(s, 0);
    expect(squadOf(s, byId).map((p) => p.id)).toEqual([1, 2, 3]);
    expect(s.auras).toEqual({ 2: 8 });
    switchSquad(s, 1);
    expect(squadOf(s, byId).map((p) => p.id)).toEqual([4, 5]);
    expect(s.auras).toEqual({ 5: 2 });
    expect(s.formation).toBe('ofensiva');
  });
  it('an Aura that is in the loaded squad is dropped (one copy, one place); names are trimmed', () => {
    const s = fresh(); savedSquads(s);
    s.squads![2] = { name: 'x', squad: [6, 8], auras: { 6: 8 } };
    switchSquad(s, 2);
    expect(s.auras).toEqual({});
    renameSquad(s, 2, '   Los de siempre del Raimon   ');
    expect(s.squads![2].name).toBe('Los de siempre d');
    renameSquad(s, 2, '  ');
    expect(s.squads![2].name).toBe('Equipo 3');
  });
  it('the save keeps five clean teams: unowned ids, bad Auras and junk are dropped', () => {
    const raw = { ...fresh(), squads: [{ name: 'A', squad: [1, 999, 1, 2], auras: { 1: 1, 2: 3 } }, 'basura', { squad: 'no' }], activeSquad: 9 };
    const s = migrate(JSON.parse(JSON.stringify(raw)), all.map((p) => p.id), 1);
    expect(s.squads).toHaveLength(5);
    expect(s.squads![0]).toEqual({ name: 'A', squad: [1, 2], auras: { 2: 3 } });
    expect(s.squads![1]).toEqual({ name: 'Equipo 2', squad: [] });
    expect(s.activeSquad).toBe(4);
  });
});
