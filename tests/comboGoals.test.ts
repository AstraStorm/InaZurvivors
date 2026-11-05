/** v1.7: marks for the combined techniques — which participant still needs which technique at which level. */
import { describe, expect, it } from 'vitest';
import type { RosterEntry, Technique } from '../src/data/manifest';
import { comboGoals, comboHints, comboReady } from '../src/systems/combos';

const tech = (id: number, name: string): Technique => ({ id, name, description: '', type: 'tiro', element: 'Fuego', power: 50, cost: 10, unlockLevel: 1, growth: null });
const P = (id: number, name: string, techniques: Technique[]): RosterEntry => ({
  id, name, nickname: name, position: 'FW', element: 'Fuego', teams: ['Raimon'], rarity: 'legendario', body: 'field', head: {} as RosterEntry['head'],
  stats: { kick: 80, control: 70, guard: 40, body: 60, speed: 75, guts: 65, stamina: 55 }, fpMax: null, techniques, starter: false, startUnlocked: false,
});
const axel = P(10, 'Axel Blaze', [tech(1, 'Tornado de fuego'), tech(2, 'Tormenta de fuego')]);
const shawn = P(1513, 'Shawn Froste', [tech(3, 'Ventisca eterna'), tech(4, 'Patinaje')]);
const on = (entry: RosterEntry, levels: Record<number, number>) => ({ entry, state: { playerId: entry.id, slots: Object.keys(levels).map(Number), levels } });

describe('combined technique goals', () => {
  it('Fuego cruzado: Axel needs Tornado de fuego 3, Shawn Ventisca eterna 5', () => {
    const goals = comboGoals([on(axel, { 0: 2 }), on(shawn, { 0: 4 })]);
    const fc = goals.find((g) => g.combo.id === 'fuego-cruzado')!;
    expect(fc.complete).toBe(true);
    expect(fc.ready).toBe(false);
    expect(fc.parts.map((p) => [p.player, p.have, p.need])).toEqual([['Axel Blaze', 2, 3], ['Shawn Froste', 4, 5]]);
  });
  it('marks only the technique the combination asks for, and says when the card completes it', () => {
    const goals = comboGoals([on(axel, { 0: 2, 1: 2 }), on(shawn, { 0: 4 })]);
    expect(comboHints(goals, 10, 'Tornado de fuego', 3).find((h) => h.name === 'Fuego cruzado')).toEqual({ name: 'Fuego cruzado', need: 3, reaches: true });
    expect(comboHints(goals, 10, 'Tormenta de fuego', 3).some((h) => h.name === 'Fuego cruzado')).toBe(false);
    expect(comboHints(goals, 1513, 'Ventisca eterna', 5)[0]).toEqual({ name: 'Fuego cruzado', need: 5, reaches: true });
  });
  it('no marks once the level is reached, once the combination is learned, or while a participant is missing', () => {
    const ready = comboGoals([on(axel, { 0: 3 }), on(shawn, { 0: 5 })]);
    expect(ready.find((g) => g.combo.id === 'fuego-cruzado')!.ready).toBe(true);
    expect(comboHints(ready, 10, 'Tornado de fuego', 4).some((h) => h.name === 'Fuego cruzado')).toBe(false);
    expect(comboGoals([on(axel, { 0: 1 }), on(shawn, { 0: 1 })], ['fuego-cruzado']).some((g) => g.combo.id === 'fuego-cruzado')).toBe(false);
    const alone = comboGoals([on(axel, { 0: 1 })]);
    const fc = alone.find((g) => g.combo.id === 'fuego-cruzado')!;
    expect(fc.complete).toBe(false);
    expect(fc.parts.find((p) => p.player === 'Shawn Froste')!.memberId).toBeNull();
    expect(comboHints(alone, 10, 'Tornado de fuego', 2).some((h) => h.name === 'Fuego cruzado')).toBe(false);
  });
  it('1.81: the hooded Axel (no Tornado de fuego) raises his best technique for Fuego cruzado and Tornado dragón', () => {
    const hooded = P(1085, 'Axel Blaze Encapuchado', [tech(5, 'Tormenta de fuego'), tech(6, 'Fuego supremo')]);
    const kevin = P(11, 'Kevin Dragonfly', [tech(7, 'Remate dragón')]);
    const goals = comboGoals([on(hooded, { 0: 2, 1: 1 }), on(shawn, { 0: 5 })]);
    const fc = goals.find((g) => g.combo.id === 'fuego-cruzado')!;
    expect(fc.parts[0]).toMatchObject({ player: 'Axel Blaze', have: 2, need: 3, anyTech: true });
    expect(comboHints(goals, 1085, 'Tormenta de fuego', 3).find((h) => h.name === 'Fuego cruzado')).toEqual({ name: 'Fuego cruzado', need: 3, reaches: true });
    expect(comboReady(fc.combo, [on(hooded, { 0: 3 }), on(shawn, { 0: 5 })])).toBe(true);
    const td = comboGoals([on(hooded, { 1: 5 }), on(kevin, { 0: 3 })]).find((g) => g.combo.name === 'Tornado dragón')!;
    expect(td.ready).toBe(true);
  });
  it('the real Axel still needs his Tornado de fuego', () => {
    expect(comboReady(comboGoals([on(axel, { 1: 5 }), on(shawn, { 0: 5 })]).find((g) => g.combo.id === 'fuego-cruzado')!.combo, [on(axel, { 1: 5 }), on(shawn, { 0: 5 })])).toBe(false);
  });
});
