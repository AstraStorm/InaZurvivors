import { expect, it } from 'vitest';
import fs from 'node:fs';
import { setTeamSagas } from '../src/data/sagas';
import { bannerPool, bannerPrice, machineOf, perPlayerOdds, rarityOdds, teamChoices, BANNER_ORDER, type BannerId } from '../src/systems/banners';
import { RARITY_ORDER } from '../src/data/manifest';

const file = 'public/generated/manifest.json';
it.skipIf(!fs.existsSync(file))('banner odds: every pool sums to 100 and a rarer player is always less likely', () => {
  const m = JSON.parse(fs.readFileSync(file, 'utf8'));
  setTeamSagas(m.teamSagas);
  const rows: string[] = [];
  const pools: [string, ReturnType<typeof bannerPool>][] = BANNER_ORDER.filter((b) => b !== 'equipo').map((b) => [b, bannerPool(m.roster, b)]);
  for (const t of ['Raimon', 'Royal_Academy', 'Emperadores_Oscuros']) pools.push([`equipo:${t}`, bannerPool(m.roster, 'equipo', t)]);
  for (const [name, pool] of pools) {
    const b = name.startsWith('equipo') ? 'equipo' : (name as BannerId);
    const odds = rarityOdds(pool, b), per = perPlayerOdds(pool, b);
    expect(Object.values(odds).reduce((a, x) => a + x, 0)).toBeCloseTo(100, 6);
    const present = RARITY_ORDER.filter((r) => per[r] > 0);
    for (let i = 1; i < present.length; i++) if (RARITY_ORDER.indexOf(present[i]) >= RARITY_ORDER.indexOf('mitico')) expect(per[present[i]]).toBeLessThan(per[present[i - 1]]);
    if (b !== 'equipo' && b !== 'chrono') expect([5, 10, 15, 20]).toContain(bannerPrice(pool, b).cost); // Fix 1.31: round prices
    if (b === 'chrono') expect(bannerPrice(pool, b)).toMatchObject({ cost: 100, multiCost: 1000 }); // Fix 1.53 (author)
    rows.push(`${name} (${pool.length}, ${bannerPrice(pool, b).cost} fichas): ` + present.map((r) => `${r} ${odds[r].toFixed(3)}% total / ${per[r].toFixed(4)}% c.u. (${pool.filter((p: { rarity: string }) => p.rarity === r).length})`).join(' · '));
  }
  // Fix 1.31: each character in exactly one saga machine, and every machine has players
  const total = BANNER_ORDER.filter((b) => b !== 'equipo' && b !== 'evento' && b !== 'bluelock').reduce((a, b) => a + bannerPool(m.roster, b).length, 0);
  expect(total).toBe(m.roster.filter((p: { exclusive?: string }) => !p.exclusive).length); // special footballers only in their banner
  expect(new Set(m.roster.filter((p: { exclusive?: string }) => !p.exclusive).map((p: never) => machineOf(p))).size).toBe(BANNER_ORDER.length - 3);
  // the special banner: every exclusive footballer (pre-2.0: except the road's, Jaden Evans), and below them only Común, Raro and Épico
  const ev = bannerPool(m.roster, 'evento');
  expect(ev.filter((p) => p.exclusive).length).toBe(m.roster.filter((p: { exclusive?: string }) => p.exclusive && p.exclusive !== 'road' && p.exclusive !== 'bluelock' && p.exclusive !== 'proximamente' && p.exclusive !== 'pase').length);
  expect(ev.some((p) => p.exclusive === 'road' || p.exclusive === 'proximamente' || p.exclusive === 'pase')).toBe(false); // 2.02: the secret one is in no banner
  expect(ev.every((p) => p.exclusive || ['comun', 'raro', 'epico'].includes(p.rarity))).toBe(true);
  for (const r of ['comun', 'raro', 'epico']) { const n = ev.filter((p) => !p.exclusive && p.rarity === r).length; expect(n).toBeGreaterThanOrEqual(15); expect(n).toBeLessThanOrEqual(20); }
  expect(bannerPrice(ev, 'evento')).toMatchObject({ cost: 15, multiCost: 150 });
  // the more Míticos, the dearer
  expect(bannerPrice(bannerPool(m.roster, 'chrono'), 'chrono').cost).toBeGreaterThan(bannerPrice(bannerPool(m.roster, 'go'), 'go').cost);
  rows.push(`equipos elegibles: ${teamChoices(m.roster, m.mainTeams).length}`);
  fs.mkdirSync('data', { recursive: true });
  fs.writeFileSync('data/odds_report.txt', rows.join('\n') + '\n');
});
