/** 2.2 Sector Quinto (systems/sector.ts): weeks, decrees and the weekly prize. The server side is in online.test.ts. */
import { describe, expect, it } from 'vitest';
import { MATCH_DECREES, matchDecree, paySectorPrize, REBEL_ENEMY_HP, SECTOR_END, SECTOR_START, sectorOpen, sectorRun, sectorWeek, sectorWeekEnd, SEED_CHANCE, SEED_CHANCE_REBEL, SIDES, weeklyDecree } from '../src/systems/sector';
import { newSave } from '../src/systems/save';
import type { RosterEntry } from '../src/data/manifest';
import fs from 'node:fs';
import path from 'node:path';

const at = (iso: string) => Date.parse(iso);

describe('Sector Quinto', () => {
  it('opens on 13 November at 12:00 and ends with the Temporada 1; four weeks, the last one to the end', () => {
    expect(sectorOpen(at('2026-11-13T11:59:00+01:00'))).toBe(false);
    expect(sectorWeek(at(SECTOR_START))).toBe(0);
    expect(sectorWeek(at('2026-11-20T11:59:00+01:00'))).toBe(0);
    expect(sectorWeek(at('2026-11-20T12:00:00+01:00'))).toBe(1);
    expect(sectorWeek(at('2026-12-11T12:00:00+01:00'))).toBe(3);
    expect(sectorWeekEnd(3)).toBe(at(SECTOR_END));
    expect(sectorWeek(at(SECTOR_END))).toBeNull();
    // the same dates as the server
    const sql = fs.readFileSync(path.resolve(__dirname, '..', 'supabase', 'migrations', '20261112000200_sector_quinto.sql'), 'utf-8');
    expect(sql).toContain("'2026-11-13 12:00+01'");
    expect(sql).toContain("'2026-12-12 15:00+01'");
    expect(at('2026-12-12T15:00:00+01:00')).toBe(at(SECTOR_END));
  });
  it('the weekly decree lifts one element for everyone; an accepted decree adds its restriction, a rebel skips it for tougher rivals', () => {
    const now = at('2026-11-14T10:00:00+01:00');
    expect(weeklyDecree(now)).toMatchObject({ week: 0, element: 'Aire', bonus: 0.2 });
    const fire = MATCH_DECREES.find((d) => d.element === 'Fuego')!;
    expect(sectorRun(now, fire, false)).toMatchObject({ elementMult: { Aire: 1.2, Fuego: 0.6 }, enemyHp: 1, seedChance: SEED_CHANCE, rebel: false });
    expect(sectorRun(now, fire, true)).toMatchObject({ elementMult: { Aire: 1.2 }, enemyHp: REBEL_ENEMY_HP, seedChance: SEED_CHANCE_REBEL, rebel: true });
    const air = MATCH_DECREES.find((d) => d.element === 'Aire')!;
    expect(sectorRun(now, air, false)!.elementMult.Aire).toBeCloseTo(0.72); // the week's +20 % and the decree's −40 %
    expect(sectorRun(at('2026-11-12T10:00:00+01:00'), fire, false)).toBeNull();
    expect(matchDecree(12345)).toBe(matchDecree(12345));
  });
  it("a week is paid once; winners get their side's frame the first time and a copy of its three footballers", () => {
    const s = newSave([], null);
    const roster = new Map<number, RosterEntry>([...SIDES.sector.players, ...SIDES.resistencia.players].map((id) => [id, { id, rarity: 'legendario' } as RosterEntry]));
    const t0 = s.tokens, c0 = s.coins;
    const a = paySectorPrize(s, { week: 0, side: 'resistencia', won: true, tokens: 300, coins: 15000 }, roster);
    expect(a).toMatchObject({ paid: true, frame: true });
    expect(a.players.map((x) => x.player.id)).toEqual(SIDES.resistencia.players);
    expect([s.tokens - t0, s.coins - c0]).toEqual([300, 15000]);
    expect(paySectorPrize(s, { week: 0, side: 'resistencia', won: true, tokens: 300, coins: 15000 }, roster).paid).toBe(false);
    const b = paySectorPrize(s, { week: 1, side: 'resistencia', won: true, tokens: 300, coins: 15000 }, roster);
    expect(b.frame).toBe(false); // already had it
    const lost = paySectorPrize(s, { week: 2, side: 'resistencia', won: false, tokens: 100, coins: 5000 }, roster);
    expect(lost).toEqual({ paid: true, frame: false, players: [] });
  });
  it('the two sides are evenly matched in rarity value as the author chose', () => {
    expect(SIDES.sector.players).toEqual([100562, 100944, 100303]);
    expect(SIDES.resistencia.players).toEqual([100538, 100544, 100405]);
  });
});
