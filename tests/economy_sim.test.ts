/**
 * Fix 1.11 economy simulation (docs/ECONOMIA_1.11.md). Three free-to-play profiles over the first session, 7 and 30 days,
 * using the real reward functions, missions, weekly pass and upgrade prices. Writes data/economy_sim.txt.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { computeRewards, tokenRewards } from '../src/systems/economy';
import { MISSIONS } from '../src/systems/missions';
import { PASS } from '../src/systems/weeklyPass';
import { PERKS, perkCost } from '../src/systems/perks';
import { RANKS } from '../src/systems/difficulty';
import { MULTI_COST } from '../src/systems/gacha';

type Profile = { name: string; runsDay: number; win: number; time: number; kpm: number; dailyShare: number; weeklyShare: number; rankMult: number; passDays: number };
const PROFILES: Profile[] = [
  { name: 'Casual (2 partidas/día, gana 25%)', runsDay: 2, win: 0.25, time: 240, kpm: 70, dailyShare: 0.4, weeklyShare: 0.2, rankMult: 1, passDays: 4 },
  { name: 'Habitual (5 partidas/día, gana 50%)', runsDay: 5, win: 0.5, time: 300, kpm: 85, dailyShare: 0.8, weeklyShare: 0.6, rankMult: 1.2, passDays: 6 },
  { name: 'Avanzado (10 partidas/día, gana 80%)', runsDay: 10, win: 0.8, time: 330, kpm: 100, dailyShare: 1, weeklyShare: 1, rankMult: 1.6, passDays: 7 },
];

const perkTotal = PERKS.reduce((a, p) => { let c = 0; for (let l = 0; l < p.max; l++) c += perkCost(p, l); return a + c; }, 0);
const oldPerkTotal = PERKS.filter((p) => !['jefes', 'botiquin', 'inicio', 'raros', 'tactica'].includes(p.id))
  .reduce((a, p) => { let c = 0; for (let l = 0; l < p.max; l++) c += p.baseCost + p.step * l; return a + c; }, 0);
const daily = MISSIONS.filter((m) => m.kind === 'diaria');
const weekly = MISSIONS.filter((m) => m.kind === 'semanal');
const passCoins = PASS.reduce((a, r) => a + r.monedas, 0);
const passTokens = PASS.reduce((a, r) => a + r.fichas, 0);

function runCoins(p: Profile, victory: boolean, legacy = false) {
  const r = { mapId: 'raimon', victory, timeSec: victory ? 300 : p.time * 0.7, kills: Math.round((victory ? 300 : p.time * 0.7) / 60 * p.kpm), minibosses: victory ? 2 : 1, reachedBoss: victory, bossDefeated: victory };
  if (legacy) return r.kills + Math.floor(r.timeSec / 2) + 30 * r.minibosses + (victory ? 40 + 150 * p.rankMult + 100 * p.rankMult : 0);
  const rew = computeRewards(r, p.rankMult);
  return rew.reduce((a, x) => a + x.coins, 0);
}
function runTokens(p: Profile, victory: boolean) {
  const r = { mapId: 'raimon', victory, timeSec: victory ? 300 : p.time * 0.7, kills: 200, minibosses: 1, reachedBoss: victory, bossDefeated: victory };
  return tokenRewards(r, false).reduce((a, x) => a + x.coins, 0);
}

function simulate(p: Profile, days: number, legacy = false) {
  let coins = 0, tokens = 0;
  const perRun = p.win * runCoins(p, true, legacy) + (1 - p.win) * runCoins(p, false, legacy);
  const perRunTok = p.win * runTokens(p, true) + (1 - p.win) * runTokens(p, false);
  coins += perRun * p.runsDay * days;
  tokens += perRunTok * p.runsDay * days;
  if (!legacy) {
    coins += days * p.dailyShare * daily.reduce((a, m) => a + m.coins, 0);
    tokens += days * p.dailyShare * daily.reduce((a, m) => a + m.tokens, 0);
    const weeks = days / 7;
    coins += weeks * p.weeklyShare * weekly.reduce((a, m) => a + m.coins, 0);
    tokens += weeks * p.weeklyShare * weekly.reduce((a, m) => a + m.tokens, 0);
    coins += weeks * passCoins * p.passDays / 7;
    tokens += weeks * passTokens * p.passDays / 7;
  }
  return { coins: Math.round(coins), tokens: Math.round(tokens), perRun: Math.round(perRun) };
}

describe('economy simulation', () => {
  it('writes the report and keeps upgrades a long goal', () => {
    const lines = [`Simulación económica Fix 1.11 (generado por tests/economy_sim.test.ts)`, '',
      `Coste total de todas las mejoras permanentes: ${perkTotal} monedas (1.1: ${oldPerkTotal} con las mejoras de entonces)`,
      `Misiones diarias: ${daily.length} (${daily.reduce((a, m) => a + m.coins, 0)} monedas, ${daily.reduce((a, m) => a + m.tokens, 0)} fichas al día si se completan todas)`,
      `Misiones semanales: ${weekly.length} (${weekly.reduce((a, m) => a + m.coins, 0)} monedas, ${weekly.reduce((a, m) => a + m.tokens, 0)} fichas)`,
      `Pase semanal: ${passCoins} monedas, ${passTokens} fichas (${passTokens / MULTI_COST} tiradas ×10) y 3 futbolistas (Épico+, Legendario+ y Legendario+ de tu equipo)`,
      `Multiplicadores de rango: ${Object.values(RANKS).map((r) => `${r.id} ×${r.reward}`).join(', ')}`, ''];
    const out: Record<string, number[]> = {};
    for (const p of PROFILES) {
      lines.push(`== ${p.name} ==`);
      const s1 = simulate(p, 1), s7 = simulate(p, 7), s30 = simulate(p, 30), o7 = simulate(p, 7, true);
      lines.push(`  monedas por partida: ${s1.perRun} (1.1: ${o7.perRun})`);
      lines.push(`  primera sesión (1 día): ${s1.coins} monedas, ${s1.tokens} fichas`);
      lines.push(`  7 días: ${s7.coins} monedas (1.1 solo partidas: ${o7.coins}), ${s7.tokens} fichas → ${Math.floor(s7.tokens / MULTI_COST)} tiradas ×10`);
      lines.push(`  30 días: ${s30.coins} monedas = ${Math.round(100 * s30.coins / perkTotal)}% de todas las mejoras (todas en ~${Math.round(perkTotal / (s30.coins / 30))} días), ${s30.tokens} fichas`);
      lines.push('');
      out[p.name] = [s7.coins, s30.coins, o7.coins];
    }
    mkdirSync('data', { recursive: true });
    writeFileSync('data/economy_sim.txt', lines.join('\n'));
    const adv = out[PROFILES[2].name];
    // 1.86 (author: coins easier): runs, missions and pass pay double; every upgrade still takes an advanced player 2+ weeks
    expect(perkTotal / (adv[1] / 30)).toBeGreaterThanOrEqual(9);
    for (const p of PROFILES) expect(out[p.name][0]).toBeLessThan(out[p.name][2] * 2.1 + 8000);
  });
});
