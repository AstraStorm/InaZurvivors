import { describe, expect, it } from 'vitest';
import { ZANARK_CAOCAO_COPY_LEVELS, ZANARK_CAOCAO_ID, ZANARK_COPY_LEVELS, ZANARK_ID } from '../src/systems/seasonPass';
import { CRONUS_COPY_LEVELS, activeSeason, addRunXp, buyNormalKey, claimable, claimLevel, giveGoldKey, goldKeyChance, LEVEL_MAX, LEVEL_XP, LEVELS, levelOf, MULTI_FICHAS, NORMAL_KEY_PRICE, runXp, SEASONS, seasonOf, upcomingSeason, GOLD_KEY_CHANCE, CRONUS_ID, SUPER_ZANARK_ID } from '../src/systems/seasonPass';
import { sanitizeSeason, type SaveData } from '../src/systems/save';
import { PENNANT_BY_ID } from '../src/data/pennants';

const T1 = SEASONS[0];
const before = new Date('2026-11-11T12:00:00+01:00'), during = new Date('2026-11-20T12:00:00+01:00'), after = new Date('2026-12-12T15:00:01+01:00');
const save = () => ({ coins: 0, tokens: 0, egTokens: 0, owned: {} } as unknown as SaveData);
const byId = new Map([CRONUS_ID, SUPER_ZANARK_ID, 100242, 100949, 100912, 100464, 100517, 100726, 101512, 100457, 100781, 100947, 101591, 102114, 102134, 100485, 100776, 102170]
  .map((id) => [id, { id, name: `#${id}`, rarity: 'comun' } as never]));

describe('2.1 season pass', () => {
  it('opens with the BlueLock collab and lasts a month; before it, only the teaser', () => {
    expect(activeSeason(before)).toBeNull();
    expect(upcomingSeason(before)?.id).toBe('T1');
    expect(activeSeason(during)?.id).toBe('T1');
    expect(activeSeason(after)).toBeNull();
    expect(addRunXp(save(), 600, 'Z', before)).toBeNull();
    expect(goldKeyChance(save(), before, false)).toBe(0);
  });

  it('maxing it takes at least 15-20 runs on the top ranks (a 12-minute run)', () => {
    const runsAt = (rank: 'Z' | 'X' | 'S' | 'C') => Math.ceil((LEVELS * LEVEL_XP) / runXp(12 * 60, rank));
    expect(runsAt('Z')).toBeGreaterThanOrEqual(15);
    expect(runsAt('Z')).toBeLessThanOrEqual(20);
    expect(runsAt('X')).toBeGreaterThan(runsAt('Z'));
    expect(runsAt('C')).toBeGreaterThan(runsAt('S'));
  });

  it('every level pays within what the server allows for one claimed level, and every reward exists', () => {
    for (const row of [T1.normal, T1.premium]) {
      expect(row).toHaveLength(LEVELS);
      for (const r of row) {
        const fichas = r.kind === 'fichas' ? r.n : r.kind === 'multi' ? MULTI_FICHAS : 0, coins = r.kind === 'monedas' ? r.n : 0;
        expect(fichas).toBeLessThanOrEqual(LEVEL_MAX.fichas);
        expect(coins).toBeLessThanOrEqual(LEVEL_MAX.monedas);
        if (r.kind === 'banner' || r.kind === 'marco') { expect(PENNANT_BY_ID.get(r.id)?.source).toBe('pase'); expect(!!PENNANT_BY_ID.get(r.id)?.kind).toBe(r.kind === 'marco'); }
      }
    }
    expect(T1.premium[0]).toEqual({ kind: 'jugador', id: CRONUS_ID });
    expect(T1.premium[99]).toEqual({ kind: 'jugador', id: SUPER_ZANARK_ID });
    // 2.1 (author): his copies every 5 levels after 100: CAMPEÓN+ (1 + 2) with two to spare, one short of ++ (3)
    expect(T1.premium.slice(100).filter((r) => r.kind === 'jugador' && r.id === SUPER_ZANARK_ID)).toHaveLength(5);
    expect(LEVELS).toBe(125);
    // Cronus: 18 copies take a Legendario to HÉROE ★★★ (2 + 4 + 3 × 4); the pass gives him and 17 more → one short
    expect(T1.premium.filter((r) => r.kind === 'jugador' && r.id === CRONUS_ID)).toHaveLength(18);
    expect(CRONUS_COPY_LEVELS.every((lv) => lv % 5 !== 0)).toBe(true);
    expect(T1.normal.filter((r) => r.kind === 'jugador')).toHaveLength(15); // the Zanark Domain
    expect(T1.normal.filter((r) => r.kind === 'banner')).toHaveLength(2);
    expect(T1.normal.filter((r) => r.kind === 'marco')).toHaveLength(1);
    expect(GOLD_KEY_CHANCE).toBe(0.00005);
  });

  it('EXP counts without keys; each key opens its row with everything reached; claims once', () => {
    const s = save();
    addRunXp(s, 30 * 60, 'S', during); // 30 min on S
    const st = seasonOf(s, T1);
    expect(levelOf(st.xp)).toBe(Math.floor(runXp(30 * 60, 'S') / LEVEL_XP));
    expect(claimable(st, 'normal')).toEqual([]);
    expect(buyNormalKey(s, during)).toBe(false); // no coins
    s.coins = NORMAL_KEY_PRICE;
    expect(buyNormalKey(s, during)).toBe(true);
    expect(s.coins).toBe(0);
    expect(claimable(st, 'normal')).toHaveLength(levelOf(st.xp));
    expect(claimLevel(s, T1, 'normal', 1, byId)).not.toBeNull();
    expect(claimLevel(s, T1, 'normal', 1, byId)).toBeNull();
    expect(claimLevel(s, T1, 'premium', 1, byId)).toBeNull(); // no golden key
    expect(goldKeyChance(s, during, true)).toBe(GOLD_KEY_CHANCE * 2);
    expect(giveGoldKey(s, during)).toBe(true);
    expect(goldKeyChance(s, during, false)).toBe(0);
    expect(claimLevel(s, T1, 'premium', 1, byId)?.player?.id).toBe(CRONUS_ID);
    expect(s.owned[String(CRONUS_ID)]).toBeTruthy();
    expect(claimLevel(s, T1, 'normal', levelOf(st.xp) + 1, byId)).toBeNull(); // not reached
  });

  it('a footballer not loaded yet is not spent', () => {
    const s = save();
    giveGoldKey(s, during);
    seasonOf(s, T1).xp = LEVEL_XP;
    expect(claimLevel(s, T1, 'premium', 1, new Map())).toBeNull();
    expect(seasonOf(s, T1).claimedPremium).toEqual([]);
  });

  it('the save keeps sane numbers', () => {
    expect(sanitizeSeason({ id: 'T1', xp: 1e9, normal: true, gold: 'x', claimedNormal: [3, 3, 0, 126, 2.5, '7'], claimedPremium: null }))
      .toEqual({ id: 'T1', xp: LEVELS * LEVEL_XP, normal: true, gold: false, claimedNormal: [3, 7], claimedPremium: [] });
    expect(sanitizeSeason({ id: 'otra' })).toBeUndefined();
  });
});

describe('2.1 ranking by seasons', () => {
  it('the prizes shown in the game are the ones the server stores (migration ranking_season)', async () => {
    const { RANK_PRIZES } = await import('../src/systems/seasonPass');
    const fs = await import('node:fs');
    const sql = fs.readFileSync('supabase/migrations/20261111000400_ranking_two_players.sql', 'utf8'); // the latest close_due_seasons
    const nums = [...sql.matchAll(/case when b\.pos = 1 then (\d+) when b\.pos <= 3 then (\d+) when b\.pos <= 8 then (\d+) when b\.pos <= 15 then (\d+) else (\d+) end/g)].map((m) => m.slice(1).map(Number));
    expect(nums).toEqual([RANK_PRIZES.map((p) => p.fichas), RANK_PRIZES.map((p) => p.monedas), RANK_PRIZES.map((p) => p.eg)]);
    for (const p of RANK_PRIZES) for (const id of p.pennants('T1')) expect(PENNANT_BY_ID.get(id)?.source, id).toBe('temporada');
    expect(RANK_PRIZES[0].players).toEqual([SUPER_ZANARK_ID, CRONUS_ID]);
    expect(RANK_PRIZES.slice(1).every((p) => !p.players.length)).toBe(true);
    expect(sql).toContain('case when b.pos = 1 then array[900401, 900400] else'); // only the top 1
  });
  it('a claimed prize pays fichas, coins, EG, its pennants and the footballer', async () => {
    const { payRankPrize } = await import('../src/systems/seasonPass');
    const s = save();
    const got = payRankPrize(s, { season: 'T1', pos: 1, score: 1, tier: 'top1', tokens: 2500, coins: 300000, eg: 15, pennants: ['t1-campeon', 'marco-t1-campeon'], players: [SUPER_ZANARK_ID, CRONUS_ID] }, byId);
    expect([s.tokens, s.coins, s.egTokens]).toEqual([2500, 300000, 15]);
    expect(s.pennants?.owned).toEqual(['t1-campeon', 'marco-t1-campeon']);
    expect(got.players.map((x) => x.player.id)).toEqual([SUPER_ZANARK_ID, CRONUS_ID]);
    expect(s.owned[String(SUPER_ZANARK_ID)] && s.owned[String(CRONUS_ID)]).toBeTruthy();
  });
});

describe('2.2 the two Zanarks along the premium row', () => {
  it('11 copies of each, one short of HÉROE ★★★, on levels that take nothing else away', () => {
    const prem = SEASONS[0].premium;
    const at = (id: number) => prem.flatMap((r, i) => (r.kind === 'jugador' && r.id === id ? [i + 1] : []));
    expect(at(ZANARK_ID)).toEqual(ZANARK_COPY_LEVELS);
    expect(at(ZANARK_CAOCAO_ID)).toEqual(ZANARK_CAOCAO_COPY_LEVELS);
    expect(ZANARK_COPY_LEVELS).toHaveLength(11);
    expect(ZANARK_CAOCAO_COPY_LEVELS).toHaveLength(11);
    // Cronus and Super Zanark keep all their copies; the multiples of 5 keep pulls, Fichas EG and the star prizes (but Zanark's old 50)
    expect(at(CRONUS_ID)).toHaveLength(1 + CRONUS_COPY_LEVELS.length);
    expect(at(SUPER_ZANARK_ID)).toEqual([100, 105, 110, 115, 120, 125]);
    expect([...ZANARK_COPY_LEVELS, ...ZANARK_CAOCAO_COPY_LEVELS].filter((lv) => lv % 5 === 0)).toEqual([50]);
  });
});
