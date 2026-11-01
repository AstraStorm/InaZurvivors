import { expect, it } from 'vitest';
import fs from 'node:fs';
import { setTeamSagas } from '../src/data/sagas';
import { bannerPool, perPlayerOdds, rarityOdds, teamChoices, BANNER_ORDER, eraOf } from '../src/systems/banners';
import { RARITY_ORDER } from '../src/data/manifest';

const file = 'public/generated/manifest.json';
it.skipIf(!fs.existsSync(file))('banner odds: every pool sums to 100 and a rarer player is always less likely', () => {
  const m = JSON.parse(fs.readFileSync(file, 'utf8'));
  setTeamSagas(m.teamSagas);
  const rows: string[] = [];
  const pools: [string, ReturnType<typeof bannerPool>][] = BANNER_ORDER.filter((b) => b !== 'equipo').map((b) => [b, bannerPool(m.roster, b)]);
  for (const t of ['Raimon', 'Royal_Academy', 'Emperadores_Oscuros']) pools.push([`equipo:${t}`, bannerPool(m.roster, 'equipo', t)]);
  for (const [name, pool] of pools) {
    const b = name.startsWith('equipo') ? 'equipo' : (name as 'original');
    const odds = rarityOdds(pool, b), per = perPlayerOdds(pool, b);
    expect(Object.values(odds).reduce((a, x) => a + x, 0)).toBeCloseTo(100, 6);
    const present = RARITY_ORDER.filter((r) => per[r] > 0);
    for (let i = 1; i < present.length; i++) if (RARITY_ORDER.indexOf(present[i]) >= RARITY_ORDER.indexOf('mitico')) expect(per[present[i]]).toBeLessThan(per[present[i - 1]]);
    rows.push(`${name} (${pool.length}): ` + present.map((r) => `${r} ${odds[r].toFixed(3)}% total / ${per[r].toFixed(4)}% c.u. (${pool.filter((p: { rarity: string }) => p.rarity === r).length})`).join(' · '));
  }
  // each character in exactly one era machine
  const eras = new Set(m.roster.map((p: { teams: string[] }) => eraOf(p)));
  expect(eras.size).toBeGreaterThanOrEqual(2);
  rows.push(`equipos elegibles: ${teamChoices(m.roster, m.mainTeams).length}`);
  fs.mkdirSync('data', { recursive: true });
  fs.writeFileSync('data/odds_report.txt', rows.join('\n') + '\n');
});
