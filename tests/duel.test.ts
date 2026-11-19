import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { DUEL_BY_ID, DUEL_COMBOS, DUEL_PLAYERS, duelStats } from '../src/systems/duel/cards';

const manifest = JSON.parse(fs.readFileSync(path.resolve(__dirname, '..', 'public', 'generated', 'manifest.json'), 'utf-8')) as {
  roster: { id: number; name: string; rarity: string; position: string; exclusive?: string; stats: Record<string, number>; techniques: { name: string; type: string; power?: number }[] }[];
};
const byId = new Map(manifest.roster.map((p) => [p.id, p]));
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9áéíóúüñ]/g, '');

describe('Modo Duelo: the 50 footballers', () => {
  it('50 different, Legendario or higher, none exclusive to an event', () => {
    expect(DUEL_PLAYERS).toHaveLength(50);
    expect(new Set(DUEL_PLAYERS.map((p) => p.id)).size).toBe(50);
    for (const d of DUEL_PLAYERS) {
      const p = byId.get(d.id);
      expect(p, String(d.id)).toBeTruthy();
      expect(['legendario', 'mitico', 'leyenda'], p!.name).toContain(p!.rarity);
      expect(p!.exclusive, p!.name).toBeFalsy();
    }
  });
  it('every card is a technique that footballer really has', () => {
    for (const d of DUEL_PLAYERS) {
      const own = new Set(byId.get(d.id)!.techniques.map((t) => norm(t.name)));
      for (const t of [...d.cards.map((c) => c.tech), d.ulti.tech]) expect(own.has(norm(t)), `${byId.get(d.id)!.name}: ${t}`).toBe(true);
    }
  });
  it('combined techniques only name footballers of the list', () => {
    for (const c of DUEL_COMBOS) for (const id of c.players) expect(DUEL_BY_ID.has(id), `${c.name}: ${id}`).toBe(true);
  });
  it('stats as the doc says (Axel Blaze: 1723 PV, 459 ATQ, 207 DEF)', () => {
    expect(duelStats(byId.get(10)! as never)).toMatchObject({ hp: 1723, atk: 459, def: 207 });
    expect(duelStats(byId.get(100773)! as never)).toMatchObject({ hp: 3125, atk: 338, def: 453 });
  });
});
