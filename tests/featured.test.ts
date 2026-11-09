/** (author) today's featured saga machine has better odds for good rarities; the rest stays the same. */
import { describe, expect, it } from 'vitest';
import type { RosterEntry } from '../src/data/manifest';
import { FEATURED_BOOST, FEATURED_MACHINES, featuredMachine, rarityOdds } from '../src/systems/banners';

const pool = (['comun', 'raro', 'epico', 'legendario', 'mitico', 'leyenda'] as const).flatMap((r, i) =>
  Array.from({ length: [40, 30, 20, 12, 6, 1][i] }, (_, k) => ({ id: i * 100 + k, rarity: r }) as unknown as RosterEntry));

describe('featured machine of the day', () => {
  it('raises Épico ×1.25 and Legendario/Mítico/Leyenda ×1.6, the total still 100%', () => {
    const base = rarityOdds(pool, 'ff'), hot = rarityOdds(pool, 'ff', true);
    for (const r of ['epico', 'legendario', 'mitico', 'leyenda'] as const) expect(hot[r]).toBeCloseTo(base[r] * FEATURED_BOOST[r]!, 6);
    expect(hot.comun).toBeLessThan(base.comun);
    expect(Object.values(hot).reduce((a, b) => a + b, 0)).toBeCloseTo(100, 6);
  });
  it('changes every day through the saga machines', () => {
    const day = Date.parse('2026-11-10T00:00:00Z');
    const seen = new Set(Array.from({ length: FEATURED_MACHINES.length }, (_, d) => featuredMachine(day + d * 86_400_000)));
    expect(seen.size).toBe(FEATURED_MACHINES.length);
    expect(featuredMachine(day)).toBe(featuredMachine(day + 86_399_000));
  });
});
