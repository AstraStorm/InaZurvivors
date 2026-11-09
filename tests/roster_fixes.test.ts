/** Quick footballer corrections applied over the manifest at load (src/data/rosterFixes.ts). */
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import type { Manifest } from '../src/data/manifest';
import { applyRosterFixes, ROSTER_FIXES } from '../src/data/rosterFixes';

const tech = (name: string, unlockLevel = 5) => ({ id: 1, name, description: '', type: 'tiro' as const, element: 'Fuego', power: 50, cost: 10, unlockLevel, growth: null });
const fake = () => ({ roster: [
  { id: 1, name: 'A', rarity: 'raro', element: 'Montaña', position: 'FW', techniques: [tech('X')] },
  { id: 2, name: 'B', rarity: 'comun', element: 'Fuego', position: 'DF', techniques: [tech('Y')] },
] } as unknown as Manifest);

describe('roster fixes', () => {
  it('changes rarity, element and techniques', () => {
    const m = fake();
    expect(applyRosterFixes(m, { 1: { name: 'A', rarity: 'mitico', element: 'Aire', quitar: ['X'], poner: ['Y'] } })).toEqual([]);
    expect(m.roster[0]).toMatchObject({ rarity: 'mitico', element: 'Aire' });
    expect(m.roster[0].techniques.map((t) => [t.name, t.unlockLevel])).toEqual([['Y', 1]]);
    expect(m.roster[1].techniques[0].unlockLevel).toBe(5);
  });
  it('reports a wrong id or a missing technique and leaves the rest alone', () => {
    const m = fake();
    expect(applyRosterFixes(m, { 1: { name: 'B', rarity: 'mitico' }, 2: { name: 'B', poner: ['Z'] } })).toHaveLength(2);
    expect(m.roster[0].rarity).toBe('raro');
  });
  const file = path.resolve(__dirname, '..', 'public', 'generated', 'manifest.json');
  it.skipIf(!fs.existsSync(file))('every real fix matches the roster', () => {
    const m = JSON.parse(fs.readFileSync(file, 'utf-8')) as Manifest;
    expect(applyRosterFixes(m, ROSTER_FIXES)).toEqual([]);
  });
  it.skipIf(!fs.existsSync(file))('author: Petronio is spelled right and has Fuerza de tiro instead of Último recurso D', () => {
    const m = JSON.parse(fs.readFileSync(file, 'utf-8')) as Manifest;
    applyRosterFixes(m, ROSTER_FIXES);
    const p = m.roster.find((x) => x.id === 101595)!;
    expect(p.name).toBe('Petronio Patti');
    expect(p.techniques.map((t) => t.name)).not.toContain('Último recurso D');
    expect(p.techniques[0]).toMatchObject({ name: 'Fuerza de tiro', type: 'talento' });
  });
});
