import { describe, expect, it } from 'vitest';
import { newSave } from '../src/systems/save';
import type { RosterEntry } from '../src/data/manifest';
import { claimPass, passStatus, PASS } from '../src/systems/weeklyPass';
import { dailyOffers, OFFERS, buyOffer, rollDaily } from '../src/systems/dailyShop';
import { describeFx, emptyFx, TALENTS, talentScale, talentText } from '../src/systems/talents';
import { DROPS, MAX_REVIVES, rollDrop } from '../src/systems/items';
import { PERKS, perkCost, perkEffects } from '../src/systems/perks';
import { computeRewards } from '../src/systems/economy';
import { pickupRadius, CAPS } from '../src/systems/balance';

const RAR = ['comun', 'raro', 'epico', 'legendario', 'mitico', 'leyenda'] as const;
const mk = (id: number, rarity: string, teams = ['Raimon']) => ({ id, rarity, teams, techniques: [], position: 'FW', element: 'Fuego', name: `P${id}` }) as unknown as RosterEntry;
const roster = Array.from({ length: 120 }, (_, i) => mk(i + 1, RAR[i % 6], [i % 2 ? 'Raimon' : 'Royal']));
const day = (d: number) => new Date(2026, 10, d, 12);

describe('weekly pass', () => {
  it('one claim per day, skipped days lose nothing, cycle of 7', () => {
    const s = newSave([], null);
    const t0 = s.tokens;
    expect(claimPass(s, roster, day(2))!.reward).toBe(PASS[0]);
    expect(s.tokens).toBe(t0 + (PASS[0] as { amount: number }).amount);
    expect(claimPass(s, roster, day(2))).toBeNull(); // same day: no double claim
    expect(passStatus(s, day(9)).index).toBe(1); // a week away: still waits on day 2
    let rng = 0.5;
    for (let d = 9; d < 15; d++) expect(claimPass(s, roster, day(d), () => (rng = (rng * 9301 + 49297) % 233280 / 233280))).not.toBeNull();
    expect(passStatus(s, day(15)).index).toBe(0);
  });
  it('player rewards are Épico or better; team reward comes from the chosen team', () => {
    for (let i = 0; i < 50; i++) {
      const s = newSave([], null);
      s.weeklyPass = { claimed: 6, lastDay: '' };
      const team = roster.filter((p) => p.teams.includes('Royal'));
      const r = claimPass(s, roster, day(3), Math.random, team)!;
      expect(RAR.indexOf(r.player!.rarity as never)).toBeGreaterThanOrEqual(2);
      expect(r.player!.teams).toContain('Royal');
    }
  });
});

describe('daily shop', () => {
  it('ten distinct offers with a favourite-team slot', () => {
    const o = dailyOffers(roster, '2026-11-01', 7, 'Royal');
    expect(o.length).toBe(OFFERS - 1); // the weekly special is rolled apart
    expect(new Set(o.map((x) => x.playerId)).size).toBe(o.length);
    const fav = o.find((x) => x.tag === 'favorito')!;
    expect(roster.find((p) => p.id === fav.playerId)!.teams).toContain('Royal');
  });
  it('the same offer cannot be bought twice', () => {
    const s = newSave([], null); s.coins = 10 ** 7;
    const [o] = rollDaily(s, roster, day(1));
    expect(buyOffer(s, roster, o.playerId, day(1))).toBe(true);
    expect(buyOffer(s, roster, o.playerId, day(1))).toBe(false);
  });
});

describe('talents', () => {
  it('the text comes from the applied values', () => {
    for (const [id, t] of Object.entries(TALENTS)) {
      const f = emptyFx(); t.apply(f, talentScale(1));
      expect(describeFx(f).length, `talent ${id}`).toBeGreaterThan(0);
      expect(talentText(Number(id), 1)).toContain('Nv 10');
    }
    expect(talentText(53, 1)).toContain('+10% daño de tiros');
  });
  it('no two talents do exactly the same', () => {
    const seen = new Map<string, string>();
    for (const [id, t] of Object.entries(TALENTS)) {
      const f = emptyFx(); t.apply(f, 1); const k = describeFx(f);
      if (seen.has(k) && !['58', '62', '68'].includes(id)) expect.soft(seen.get(k), `${id} duplicates`).toBeUndefined();
      seen.set(k, id);
    }
  });
});

describe('items, upgrades and coins', () => {
  it('Revivir is rare, capped and boosted only by special luck', () => {
    const rev = DROPS.find((d) => d.id === 'revivir')!;
    expect(rev.chance).toBeLessThan(0.001);
    expect(MAX_REVIVES).toBe(2);
    let n0 = 0, n1 = 0, x = 1;
    const r = () => (x = (x * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < 400000; i++) { if (rollDrop(r, 0, true, 0)?.id === 'revivir') n0++; if (rollDrop(r, 0, true, 0.16)?.id === 'revivir') n1++; }
    expect(n1).toBeGreaterThan(n0);
  });
  it('new upgrades are capped and cost more than before', () => {
    for (const id of ['jefes', 'botiquin', 'inicio', 'raros', 'tactica']) expect(PERKS.find((p) => p.id === id)!.max).toBeLessThanOrEqual(5);
    expect(perkCost(PERKS.find((p) => p.id === 'vida')!, 0)).toBe(180);
    const s = newSave([], null);
    for (const p of PERKS) s.upgrades[p.id] = p.max;
    const e = perkEffects(s);
    expect(e.bossTakenMult).toBeCloseTo(0.85);
    expect(e.startXpFrac).toBeCloseTo(0.8);
  });
  it('a 5-minute boss win pays about half of 1.1 (400+150+60+40+150+100 = 900 then)', () => {
    const total = computeRewards({ mapId: 'raimon', victory: true, timeSec: 300, kills: 400, minibosses: 2, bossDefeated: true, reachedBoss: true }).reduce((a, r) => a + r.coins, 0);
    expect(total).toBeLessThan(900 * 0.6);
    expect(total).toBeGreaterThan(250);
  });
  it('pickup bonuses add up and stop at the cap', () => {
    expect(pickupRadius(5, [5, 5])).toBeLessThanOrEqual(CAPS.pickupMaxPx);
  });
});

describe('saves from 1.1', () => {
  it('a 1.1 save keeps coins and players, its old six offers are replaced by the new layout; the pass starts at day 1', async () => {
    const { migrate } = await import('../src/systems/save');
    const old = newSave([], null) as unknown as Record<string, unknown>;
    delete old.weeklyPass;
    const s = migrate(JSON.parse(JSON.stringify({ ...old, coins: 12345, owned: { '1': { copies: 2, stars: 1 } },
      daily: { key: '2026-11-01', bought: [], offers: [1, 2, 3, 4, 5, 6].map((id) => ({ playerId: id, price: 150, discount: 0 })) } })), [], null);
    expect(s.coins).toBe(12345);
    expect(s.owned['1'].copies).toBe(2);
    expect(rollDaily(s, roster, day(1)).length).toBe(OFFERS); // Fix 1.12: at once, keeping the day's purchases
    expect(passStatus(s, day(2)).index).toBe(0);
  });
});

describe('formations only change stats', () => {
  it('no blocking or slowing fields; defence attacks as usual', async () => {
    const { FORMATIONS } = await import('../src/systems/formations');
    for (const f of Object.values(FORMATIONS)) for (const k of ['block', 'shotBlock', 'slowAura']) expect(f).not.toHaveProperty(k);
    expect(FORMATIONS.defensiva.damageMult).toBe(1);
    expect(FORMATIONS.defensiva.cooldownMult).toBe(1);
  });
});

describe('daily shop per player', () => {
  it('two players see different offers on the same day', () => {
    const a = newSave([], null), b = newSave([], null);
    a.shopSeed = 11; b.shopSeed = 987654;
    const ids = (s: typeof a) => rollDaily(s, roster, day(1)).map((o) => o.playerId).join(',');
    expect(ids(a)).not.toBe(ids(b));
    expect(ids(a)).toBe(ids(a)); // stable for the same player
  });
});

describe('talents as in the games', () => {
  it('each talent family does its own thing', async () => {
    const { TALENTS, emptyFx, talentText } = await import('../src/systems/talents');
    const fx = (id: number) => { const f = emptyFx(); TALENTS[id].apply(f, 1); return f; };
    expect(fx(51).keeper).toBeGreaterThan(0); // Portero+: goalkeeper techniques
    expect(fx(58).vsMale).toBeGreaterThan(0); // Femme fatale
    expect(fx(59).vsFemale).toBeGreaterThan(0); // Casanova
    expect(fx(57).stun).toBeGreaterThan(0); // ¡Trampa!
    expect(fx(68).curse).toBeGreaterThan(0); // Gafe
    expect(fx(64).idleRegen).toBeGreaterThan(0); // Pereza
    expect(fx(65).critDamage).toBeGreaterThan(0); // ¡Crítico!
    expect(talentText(58, 1)).toContain('rivales masculinos');
  });
});
