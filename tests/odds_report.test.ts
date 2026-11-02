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
    if (b !== 'equipo') expect([5, 10, 15, 20]).toContain(bannerPrice(pool, b).cost); // Fix 1.31: round prices
    rows.push(`${name} (${pool.length}, ${bannerPrice(pool, b).cost} fichas): ` + present.map((r) => `${r} ${odds[r].toFixed(3)}% total / ${per[r].toFixed(4)}% c.u. (${pool.filter((p: { rarity: string }) => p.rarity === r).length})`).join(' · '));
  }
  // Fix 1.31: each character in exactly one saga machine, and every machine has players
  const total = BANNER_ORDER.filter((b) => b !== 'equipo').reduce((a, b) => a + bannerPool(m.roster, b).length, 0);
  expect(total).toBe(m.roster.length);
  expect(new Set(m.roster.map((p: never) => machineOf(p))).size).toBe(BANNER_ORDER.length - 1);
  // the more Míticos, the dearer
  expect(bannerPrice(bannerPool(m.roster, 'chrono'), 'chrono').cost).toBeGreaterThan(bannerPrice(bannerPool(m.roster, 'go'), 'go').cost);
  rows.push(`equipos elegibles: ${teamChoices(m.roster, m.mainTeams).length}`);
  fs.mkdirSync('data', { recursive: true });
  fs.writeFileSync('data/odds_report.txt', rows.join('\n') + '\n');
});
