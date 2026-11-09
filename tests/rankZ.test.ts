import { describe, expect, it } from 'vitest';
import maps from '../data/maps.json';
import { MAP_TIER, mapMult, RANK_MULT, scoreOf } from '../src/systems/leaderboard';
import { RANK_ORDER, RANKS, rankZDaysLeft, rankZOpen } from '../src/systems/difficulty';
import { egRewards } from '../src/systems/economy';

describe('Rango Z and arena points', () => {
  it('the arena table matches data/maps.json (ranked arenas only)', () => {
    const fromData = Object.fromEntries((maps as { maps: { id: string; tier: number; clanOnly?: boolean }[] }).maps.filter((m) => !m.clanOnly).map((m) => [m.id, m.tier]));
    expect(MAP_TIER).toEqual(fromData);
    expect(mapMult('raimon')).toBe(1);
    expect(mapMult('ruinas')).toBeCloseTo(1.7);
    expect(mapMult('torre')).toBeCloseTo(1.85);
    expect(mapMult('desconocido')).toBe(1);
  });
  it('Z is the last and hardest rank, pays and scores the most', () => {
    expect(RANK_ORDER.at(-1)).toBe('Z');
    const X = RANKS.X, Z = RANKS.Z;
    for (const k of ['hp', 'damage', 'speed', 'burst', 'elite', 'extraMinibosses', 'reward', 'firstClearTokens'] as const) expect(Z[k]).toBeGreaterThan(X[k]);
    for (const k of ['spawnInterval', 'hazardEvery', 'bossTempo', 'surroundEvery'] as const) expect(Z[k]).toBeLessThan(X[k]);
    expect(RANK_MULT.Z).toBeGreaterThan(RANK_MULT.X);
    expect(scoreOf({ map: 'raimon', rank: 'Z', time: 300, damage: 0 })).toBeGreaterThan(scoreOf({ map: 'raimon', rank: 'X', time: 300, damage: 0 }));
    const win = { victory: true, bossDefeated: true } as Parameters<typeof egRewards>[0];
    expect(egRewards({ ...win, rank: 'Z' }, false)[0].coins).toBeGreaterThan(egRewards({ ...win, rank: 'X' }, false)[0].coins);
  });
  it('opens on Tuesday 10 at 12:00 Madrid, with the days left before', () => {
    const at = (iso: string) => new Date(iso);
    expect(rankZOpen(at('2026-11-10T11:59:59+01:00'))).toBe(false);
    expect(rankZOpen(at('2026-11-10T12:00:00+01:00'))).toBe(true);
    expect(rankZDaysLeft(at('2026-11-08T19:00:00+01:00'))).toBe(2);
    expect(rankZDaysLeft(at('2026-11-09T19:00:00+01:00'))).toBe(1);
    expect(rankZDaysLeft(at('2026-11-10T12:00:00+01:00'))).toBe(0);
  });
});
