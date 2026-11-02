import { describe, expect, it } from 'vitest';
import { exportSave, importSave, migrate, newSave, remapTechSlots, SCHEMA_VERSION } from '../src/systems/save';
import { canStartGuardedMove, GUARD_LOCKOUT_SEC } from '../src/systems/combat';
import { addCopy, pull, pullOne, rollRarity, starBonus, COPIES_PER_STAR, DUPLICATE_REFUND_BY, MAX_STARS, MULTI_COST, PULL_COST, RARITY_WEIGHTS } from '../src/systems/gacha';
import { techStats, statChanges, MAX_TECH_LEVEL } from '../src/systems/techniques';
import { evolutionLabel, evolvesAt } from '../src/systems/evolution';
import { PASSIVES, STAT_CARDS } from '../src/systems/runmods';
import { rollDrop, rollXpTier, XP_TIERS } from '../src/systems/items';
import { applyCard, cardPool, drawCards, MAX_TEAM, newMemberState, type CardContext, type TeamMemberState } from '../src/systems/cards';
import { applyRun, computeRewards, isMapUnlocked, tokenRewards, WELCOME_TOKENS } from '../src/systems/economy';
import { directionFromVector, frameAt, flipsFor, animIndex } from '../src/game/rig';
import type { RosterEntry, Technique } from '../src/data/manifest';
import { effectiveOdds, eligibleTeams, onboardingPull, recordHistory } from '../src/systems/gacha';
import { MISSIONS, claimAllMissions, claimMission, isClaimable, recordCollection, recordRun, rollPeriods, weekKey } from '../src/systems/missions';
import { buyTechBoost, buyTechUnlock, MAX_TECH_BOOST } from '../src/systems/shop';
import { applyGear, buildGear, buyGear, equipGear } from '../src/systems/gear';
import { COMPOSITIONS, PLAYLISTS, nextTrack, renderBars } from '../src/systems/compositions';
import { canClaim, claimTeamReward, teamProgress } from '../src/systems/teamRewards';
import { buyOffer, dailyOffers, msToNextDay, rollDaily } from '../src/systems/dailyShop';
import { RANKS, RANK_ORDER, waveIntensity } from '../src/systems/difficulty';
import { COMBOS, comboDamage, comboReady } from '../src/systems/combos';
import { claimAllTeamRewards } from '../src/systems/teamRewards';
import { localBoard, positionOf, recordBest } from '../src/systems/leaderboard';
import { ASC_COSTS, ascMultipliers, ascend, effectiveRarity, isHero, nextStep, sparesOf } from '../src/systems/ascension';
import { SQUAD_SIZE, fillSquad, makeCaptain, placeInSquad, removeFromSquad, setSquad, squadOf } from '../src/systems/squad';
import { createAltar, stepAltar } from '../src/systems/altars';
import { mergeIe3 } from '../tools/ie3-merge';
import { FORMATIONS, slotPositions, headingFromVector } from '../src/systems/formations';
import { drawDraft, pickCaptain } from '../src/systems/draft';
import { buyPerk, perkEffects, perkLevel, perkValue, refundPerks, PERKS } from '../src/systems/perks';
import { masteryLevel, masteryProgress, recordMastery, resonanceBonus } from '../src/systems/mastery';

const seq = (vals: number[]) => { let i = 0; return () => vals[i++ % vals.length]; };
const P = (id: number, rarity: RosterEntry['rarity']) => ({ id, name: `P${id}`, rarity } as unknown as RosterEntry);

describe('save', () => {
  it('creates a current-version save with starters', () => {
    const s = newSave([10, 1], 10);
    expect(s.schemaVersion).toBe(SCHEMA_VERSION);
    expect(Object.keys(s.owned).sort()).toEqual(['1', '10']);
  });
  it('migrates a v1 save (unlocked list) up to the current version', () => {
    const s = migrate({ schemaVersion: 1, coins: 55, unlocked: [10, 3], stars: { 3: 2 }, stats: { runs: 4 } }, [10], 10);
    expect(s.schemaVersion).toBe(SCHEMA_VERSION);
    expect(s.coins).toBe(55);
    expect(s.owned['3'].stars).toBe(2);
    expect(s.stats.runs).toBe(4);
    expect(s.stats.pulls).toBe(0);
  });
  it('treats a save without version as v1 and garbage as new', () => {
    expect(migrate({ unlocked: [7] }, [10], 10).owned['7']).toBeDefined();
    expect(migrate(null, [10], 10).owned['10']).toBeDefined();
  });
});

describe('gacha', () => {
  const pool = [P(1, 'comun'), P(2, 'raro'), P(3, 'mitico')];
  it('rolls rarities by weight', () => {
    const total = Object.values(RARITY_WEIGHTS).reduce((a, b) => a + b, 0);
    expect(rollRarity(() => 0)).toBe('comun');
    expect(rollRarity(() => (total - 0.5) / total)).toBe('mitico');
  });
  it('unlocks new players and turns duplicates into stars by rarity; coins only when nothing can use the copy (Fix 1.23)', () => {
    const s = newSave([], null);
    s.coins = 0;
    const r1 = pullOne(pool, s, () => 0);
    expect(r1.isNew).toBe(true);
    const per = COPIES_PER_STAR[r1.player.rarity];
    const r2 = pullOne(pool, s, () => 0);
    if (per > 1) expect(r2.toStar).toEqual([1, per]);
    for (let i = 1; i < MAX_STARS * per; i++) pullOne(pool, s, () => 0);
    expect(s.owned['1'].stars).toBe(MAX_STARS);
    const spare = pullOne(pool, s, () => 0);
    expect([spare.refund, spare.forAscension, s.coins]).toEqual([0, true, 0]); // waits for the ascension
    s.owned['1'].hero = true;
    expect(pullOne(pool, s, () => 0).forAscension).toBe(true); // Fix 1.31: a HÉROE still needs copies for its hero stars
    s.owned['1'].heroStars = 3;
    const r = pullOne(pool, s, () => 0);
    expect(r.refund).toBe(DUPLICATE_REFUND_BY[r1.player.rarity]);
    expect(s.coins).toBe(r.refund);
  });
  it('a Común needs more copies per star than a Legendario, and old stars are never taken away', () => {
    const s = newSave([], null);
    const com = { id: 50, rarity: 'comun' } as RosterEntry, leg = { id: 51, rarity: 'legendario' } as RosterEntry;
    addCopy(s, com); addCopy(s, leg);
    for (let i = 0; i < 3; i++) { addCopy(s, com); addCopy(s, leg); }
    expect([s.owned['50'].stars, s.owned['51'].stars]).toEqual([1, 3]);
    s.owned['50'].stars = 4; // an older save that gave one star per copy
    addCopy(s, com);
    expect(s.owned['50'].stars).toBe(4);
  });
  it('falls back to lower rarity when a rarity has no players', () => {
    const s = newSave([], null);
    const r = pullOne([P(1, 'comun')], s, seq([0.99, 0]));
    expect(r.player.id).toBe(1);
  });
  it('charges tokens and refuses when poor', () => {
    const s = newSave([], null);
    s.tokens = PULL_COST - 1;
    expect(pull(pool, s, 1)).toBeNull();
    s.tokens = 100;
    const big = Array.from({ length: 30 }, (_, i) => P(100 + i, 'comun'));
    expect(pull(big, s, 10, seq([0.1, 0.05, 0.1, 0.4, 0.2, 0.7, 0.3, 0.9]))?.length).toBe(10);
    expect(s.tokens).toBe(100 - MULTI_COST);
  });
  it('stars add permanent power', () => {
    expect(starBonus(0).damage).toBe(1);
    expect(starBonus(5).damage).toBeCloseTo(1.4);
  });
});

describe('techniques', () => {
  it('scale with level and cap at 10', () => {
    const t = { type: 'tiro' as const, power: 57 };
    expect(techStats(t, 2).damage).toBeGreaterThan(techStats(t, 1).damage);
    expect(techStats(t, MAX_TECH_LEVEL).count).toBe(4);
    expect(techStats(t, 99)).toEqual(techStats(t, MAX_TECH_LEVEL));
    expect(techStats(t, 10).cooldownMs).toBeLessThan(techStats(t, 1).cooldownMs);
  });
  it('lists stat changes for every type at every level', () => {
    for (const type of ['tiro', 'regate', 'defensa', 'parada'] as const) {
      for (let lv = 1; lv < MAX_TECH_LEVEL; lv++) expect(statChanges({ type, power: 40 }, lv).length).toBeGreaterThan(0);
    }
  });
  it('shows the real effect of every talent when it levels up (Fix 1.22)', async () => {
    const { TALENTS, talentChanges } = await import('../src/systems/talents');
    for (const id of Object.keys(TALENTS).map(Number)) {
      for (let lv = 1; lv < MAX_TECH_LEVEL; lv++) expect(talentChanges(id, lv).length, `${TALENTS[id].name} nv ${lv}`).toBeGreaterThan(0);
    }
  });
  it('separates evolution names from internal levels by family', () => {
    expect(evolutionLabel({ id: 1, growth: 101 }, 1)).toBe('');
    expect(evolutionLabel({ id: 1, growth: 101 }, 4)).toBe('+3');
    expect(evolutionLabel({ id: 1, growth: 102 }, 5)).toBe('Lv 5');
    expect(evolutionLabel({ id: 1, growth: null, source: 'Moveset oficial (wiki, Galaxy): X' }, 10)).toBe('G5');
    expect(evolutionLabel({ id: 1, growth: null, source: 'Moveset oficial (wiki, GO, Chrono Stone): X' }, 2)).toBe('Lv 2');
    expect(evolutionLabel({ id: 1, growth: null, type: 'talento' }, 10)).toBe('');
    expect(evolvesAt({ id: 1, growth: 102 }, 6)).toBe('Lv 7');
    expect(evolvesAt({ id: 1, growth: 102 }, 7)).toBeNull();
  });
});

describe('cards', () => {
  const tech = (id: number, type: Technique['type'] = 'tiro', unlockLevel = 1) => ({ id, name: `T${id}`, description: '', type, element: null, power: 40, cost: 0, unlockLevel, growth: 101 });
  const player = (id: number, techniques = [tech(1), tech(2), tech(3), tech(4)]) => ({ ...P(id, 'comun'), techniques });
  const ctx = (team: TeamMemberState[], unlocked: RosterEntry[], over: Partial<CardContext> = {}): CardContext =>
    ({ team, unlocked, runLevel: 50, bought: () => [], taken: {}, ...over });
  const maxedMods = Object.fromEntries([...STAT_CARDS, ...PASSIVES].map((d) => [d.id, d.max]));

  it('starts with one active technique, never a passive talent, and a free slot', () => {
    const s = newMemberState(player(1, [tech(9, 'talento'), tech(2)]));
    expect(s.slots).toEqual([1, null]);
    expect(s.levels).toEqual({ 1: 1 });
  });
  it('never offers recruits when the team is full', () => {
    const roster = [1, 2, 3, 4, 5, 6].map((i) => player(i));
    const team = roster.slice(0, MAX_TEAM).map((p) => newMemberState(p));
    expect(cardPool(ctx(team, roster)).some((c) => c.kind === 'recruit')).toBe(false);
  });
  it('only recruits unlocked players', () => {
    const pool = cardPool(ctx([newMemberState(player(1))], [player(1), player(2)]));
    expect(pool.filter((c) => c.kind === 'recruit').map((c) => (c as { playerId: number }).playerId)).toEqual([2]);
  });
  it('keeps at most two active techniques', () => {
    const p = player(1);
    let team = [newMemberState(p)];
    team = applyCard({ kind: 'learn', playerId: 1, tech: 2 }, team);
    expect(team[0].slots).toEqual([0, 2]);
    team = applyCard({ kind: 'learn', playerId: 1, tech: 3 }, team);
    expect(team[0].slots).toEqual([0, 2]);
    expect(cardPool(ctx(team, [p])).some((c) => c.kind === 'learn')).toBe(false);
  });
  it('does not offer maxed techniques and falls back to heal', () => {
    const p = player(1, [tech(1)]);
    const team: TeamMemberState[] = [{ playerId: 1, slots: [0, null], levels: { 0: MAX_TECH_LEVEL } }];
    expect(drawCards(ctx(team, [p], { taken: maxedMods })).every((c) => c.kind === 'heal')).toBe(true);
  });
  it('gates level-100 techniques behind the shop', () => {
    const p = player(1, [tech(1), tech(2, 'tiro', 100)]);
    const team = [newMemberState(p)];
    expect(cardPool(ctx(team, [p])).some((c) => c.kind === 'learn')).toBe(false);
    expect(cardPool(ctx(team, [p], { bought: () => [1] })).some((c) => c.kind === 'learn')).toBe(true);
  });
  it('upgrades up to level 10 only', () => {
    let team = [newMemberState(player(1))];
    for (let i = 0; i < 15; i++) team = applyCard({ kind: 'upgrade', playerId: 1, tech: 0, toLevel: 2 }, team);
    expect(team[0].levels[0]).toBe(MAX_TECH_LEVEL);
  });
});

describe('combat items', () => {
  it('rolls each experience tier and respects luck', () => {
    expect(rollXpTier(() => 0.999).value).toBe(1);
    expect(rollXpTier(() => 0).value).toBe(20);
    expect(XP_TIERS.map((t) => t.value)).toEqual([1, 5, 20]);
  });
  it('rolls no drop on a high roll and the first drop on a low one', () => {
    expect(rollDrop(() => 0.99)).toBeNull();
    expect(rollDrop(() => 0)?.id).toBe('arroz');
  });
});

describe('economy', () => {
  it('keeps coins on defeat and unlocks next map on victory', () => {
    const s = newSave([10], 10);
    const before = s.coins;
    applyRun(s, { mapId: 'raimon', victory: false, timeSec: 100, kills: 20, minibosses: 0, bossDefeated: false, reachedBoss: false });
    expect(s.coins).toBeGreaterThan(before);
    expect(isMapUnlocked('clear:raimon', s)).toBe(false);
    applyRun(s, { mapId: 'raimon', victory: true, timeSec: 300, kills: 200, minibosses: 2, bossDefeated: true, reachedBoss: true });
    expect(isMapUnlocked('clear:raimon', s)).toBe(true);
    expect(computeRewards({ mapId: 'x', victory: true, timeSec: 0, kills: 0, minibosses: 0, bossDefeated: true, reachedBoss: true })
      .map((r) => r.label)).toContain('Jefe derrotado');
  });
});

describe('rig', () => {
  it('maps vectors to the 8 verified directions', () => {
    expect(directionFromVector(0, -1)).toBe(0);
    expect(directionFromVector(1, 0)).toBe(2);
    expect(directionFromVector(0, 1)).toBe(4);
    expect(directionFromVector(-1, 0)).toBe(6);
    expect(directionFromVector(1, 1)).toBe(3);
    expect(directionFromVector(0, 0, 5)).toBe(5);
    expect(animIndex(2, true)).toBe(10);
  });
  it('steps frames using tick durations and loops', () => {
    const frames = [{ d: 6 }, { d: 6 }];
    expect(frameAt(frames, 0).i).toBe(0);
    expect(frameAt(frames, 110).i).toBe(1);
    expect(frameAt(frames, 210).i).toBe(0);
  });
  it('mirrors the head independently when requested', () => {
    expect(flipsFor({ mirror: true }, { b: 1, h: 1, hf: false, d: 1 })).toEqual({ body: true, head: true });
    expect(flipsFor({ mirror: false }, { b: 1, h: 1, hf: true, d: 1 })).toEqual({ body: false, head: true });
  });
});

describe('save v2 -> v3', () => {
  it('keeps owned players, coins and cleared maps and adds settings/upgrades', () => {
    const v2 = { schemaVersion: 2, coins: 777, owned: { '10': { stars: 3, copies: 4, obtainedAt: 'x' } }, captainId: 10,
      clearedMaps: ['raimon'], stats: { runs: 9, wins: 2, kills: 300, bestTimeSec: 200, pulls: 12 }, settings: { volume: 0.2 } };
    const s = migrate(v2, [1], 1);
    expect(s.schemaVersion).toBe(SCHEMA_VERSION);
    expect(s.coins).toBe(777);
    expect(s.owned['10'].stars).toBe(3);
    expect(s.owned['1']).toBeUndefined();
    expect(s.clearedMaps).toEqual(['raimon']);
    expect(s.settings.volume).toBe(0.2);
    expect(s.settings.particles).toBe('completo');
    expect(s.upgrades).toEqual({});
    expect(s.stats.bestKills).toBe(0);
  });
});

describe('formations', () => {
  it('has three formations with four slots and the requested bonuses', () => {
    expect(FORMATIONS.ofensiva.damageMult).toBeGreaterThan(1);
    expect(FORMATIONS.ofensiva.damageTakenMult).toBeGreaterThan(1);
    expect(FORMATIONS.ofensiva.cooldownMult).toBeLessThan(1);
    expect(FORMATIONS.equilibrada.comboMult).toBeGreaterThan(1);
    expect(FORMATIONS.defensiva.damageTakenMult).toBeLessThan(1);
    expect(FORMATIONS.defensiva.damageMult).toBe(1); // Fix 1.11: defence attacks as usual, only defensive extras
    expect(FORMATIONS.defensiva.damageTakenMult).toBeLessThan(FORMATIONS.equilibrada.damageTakenMult);
    for (const f of Object.values(FORMATIONS)) expect(f.slots).toHaveLength(4);
  });
  it('rotates slots with the captain heading (offensive slots go forward)', () => {
    const down = slotPositions('ofensiva', 0, 0, headingFromVector(0, 1));
    const up = slotPositions('ofensiva', 0, 0, headingFromVector(0, -1));
    const right = slotPositions('ofensiva', 0, 0, headingFromVector(1, 0));
    expect(down.every((p) => p.y > 0)).toBe(true);
    expect(up.every((p) => p.y < 0)).toBe(true);
    expect(right.every((p) => p.x > 0)).toBe(true);
  });
  it('defensive slots stay closer than offensive ones', () => {
    const avg = (id: 'ofensiva' | 'defensiva') => FORMATIONS[id].slots.reduce((a, [x, y]) => a + Math.hypot(x, y), 0) / 4;
    expect(avg('defensiva')).toBeLessThan(avg('ofensiva'));
  });
});

describe('draft', () => {
  const owned = [1, 2, 3, 4, 5, 6, 7].map((id) => ({ id }));
  it('draws five distinct players from the collection', () => {
    for (let i = 0; i < 20; i++) {
      const d = drawDraft(owned);
      expect(d).toHaveLength(5);
      expect(new Set(d.map((p) => p.id)).size).toBe(5);
    }
  });
  it('uses what is available when fewer than five are owned, ignoring duplicates', () => {
    expect(drawDraft([{ id: 1 }, { id: 1 }, { id: 2 }])).toHaveLength(2);
  });
  it('captain defaults to the first drafted player, manual choice supported', () => {
    const d = [{ id: 9 }, { id: 3 }];
    expect(pickCaptain(d)?.id).toBe(9);
    expect(pickCaptain(d, 3)?.id).toBe(3);
  });
});

describe('perks', () => {
  it('cost coins, cap at max level and apply effects', () => {
    const s = newSave([], null);
    s.coins = 100000;
    const p = PERKS.find((x) => x.id === 'cambios')!;
    for (let i = 0; i < p.max + 2; i++) buyPerk(s, 'cambios');
    expect(s.upgrades.cambios).toBe(p.max);
    expect(perkEffects(s).extraRerolls).toBe(p.max);
    const poor = newSave([], null);
    poor.coins = 0;
    expect(buyPerk(poor, 'vida')).toBe(false);
  });
});

describe('onboarding and team cap', () => {
  const pool = Array.from({ length: 30 }, (_, i) => ({ id: i + 1, rarity: 'comun' })) as never as import('../src/data/manifest').RosterEntry[];
  it('team cap is 5', () => expect(MAX_TEAM).toBe(5));
  it('gives 5 distinct players once and never again', () => {
    const s = newSave([], null);
    expect(s.onboardingDone).toBe(false);
    expect(new Set(onboardingPull(pool, s).map((p) => p.id)).size).toBe(5);
    expect(Object.keys(s.owned)).toHaveLength(5);
    expect(s.onboardingDone).toBe(true);
    expect(onboardingPull(pool, s)).toHaveLength(0);
    expect(Object.keys(s.owned)).toHaveLength(5);
  });
  it('v3 saves keep their collection and skip onboarding', () => {
    const s = migrate({ schemaVersion: 3, coins: 270, owned: { '10': { stars: 1, copies: 2, obtainedAt: 'x' } }, captainId: 10, settings: { volume: 0.6, shake: 0.7 } }, [], null);
    expect(s.onboardingDone).toBe(true);
    expect(s.coins).toBe(270);
    expect(s.owned['10'].stars).toBe(1);
    expect(s.settings.shake).toBeLessThanOrEqual(0.35);
  });
});

describe('save safety (v5)', () => {
  it('migrates a v4 save keeping progress and skipping the intro', () => {
    const v4 = { schemaVersion: 4, coins: 17, owned: { '3': { stars: 1, copies: 2, obtainedAt: 'x' } }, captainId: 3, clearedMaps: ['raimon'], onboardingDone: true,
      upgrades: { dano: 1 }, settings: { volume: 0.6 }, stats: { runs: 5 } };
    const s = migrate(v4, [], null);
    expect(s.schemaVersion).toBe(SCHEMA_VERSION);
    expect([s.coins, s.owned['3'].stars, s.upgrades.dano, s.clearedMaps[0]]).toEqual([17, 1, 1, 'raimon']);
    expect(s.introSeen).toBe(true);
    expect(s.missions.claimed).toEqual([]);
  });
  it('repairs bad field types without dropping valid players', () => {
    const s = migrate({ schemaVersion: 5, coins: 'x', owned: { '7': { stars: 2 }, bad: 1 }, clearedMaps: 3 }, [], null);
    expect(s.coins).toBe(0);
    expect(Object.keys(s.owned)).toEqual(['7']);
    expect(s.clearedMaps).toEqual([]);
  });
  it('round-trips export/import and rejects foreign files', () => {
    const s = newSave([1], 1);
    s.coins = 321;
    expect(importSave(exportSave(s)).coins).toBe(321);
    expect(() => importSave('nope')).toThrow();
    expect(() => importSave('{"a":1}')).toThrow();
  });
  it('throws (never silently resets) when a migration is missing', () => {
    expect(() => migrate({ schemaVersion: 0 }, [], null)).toThrow();
  });
});

describe('dribble immunity', () => {
  it('cannot be chained during the lockout', () => {
    expect(canStartGuardedMove(5, 5.9)).toBe(false);
    expect(canStartGuardedMove(5.9, 5.9)).toBe(true);
    expect(GUARD_LOCKOUT_SEC).toBeGreaterThan(0.5);
  });
});

describe('favourite team guarantee', () => {
  const pool = Array.from({ length: 40 }, (_, i) => ({ id: i + 1, rarity: i < 3 ? 'epico' : 'comun', teams: i % 2 ? ['A'] : ['B'] })) as never as RosterEntry[];
  it('only lists teams with an epic or better candidate', () => {
    const extra = [...pool, { id: 99, rarity: 'comun', teams: ['C'] } as never as RosterEntry];
    expect(eligibleTeams(extra)).toEqual(['A', 'B']);
  });
  it('always includes an epic+ of the team, in 5 distinct players', () => {
    for (let i = 0; i < 200; i++) {
      const s = newSave([], null);
      const got = onboardingPull(pool, s, Math.random, 'A');
      expect(new Set(got.map((p) => p.id)).size).toBe(5);
      expect(got.some((p) => p.teams.includes('A') && p.rarity !== 'comun')).toBe(true);
    }
  });
});

describe('missions', () => {
  const run = { mapId: 'raimon', victory: true, timeSec: 700, kills: 600, minibosses: 0, bossDefeated: true, reachedBoss: true, level: 12, formation: 'ofensiva', techUses: { Fuego: 40 }, maxTechLevel: 10 };
  const now = new Date(2026, 10, 4, 12); // a Wednesday
  it('pays each mission once', () => {
    const s = newSave([], null);
    recordRun(s, run, now);
    expect(claimMission(s, 'l_500')).toBe(120);
    const coins = s.coins;
    expect(claimMission(s, 'l_500')).toBe(0);
    expect(s.coins).toBe(coins);
  });
  it('refuses unfinished missions', () => {
    const s = newSave([], null);
    expect(claimMission(s, 'l_500')).toBe(0);
  });
  it('resets daily counters and allows the next day claim, keeping lifetime ones', () => {
    const s = newSave([], null);
    recordRun(s, run, now);
    expect(claimMission(s, 'd_kills')).toBe(50);
    recordRun(s, run, new Date(2026, 10, 5, 9));
    expect(claimMission(s, 'd_kills')).toBe(50);
    expect(s.missions.counters.kills).toBe(1200);
  });
  it('weeks start on Monday', () => {
    expect(weekKey(new Date(2026, 10, 8))).toBe(weekKey(new Date(2026, 10, 2)));
    expect(weekKey(new Date(2026, 10, 9))).not.toBe(weekKey(new Date(2026, 10, 8)));
  });
});

describe('shop and gear', () => {
  const t = { id: 5, name: 'X', description: '', type: 'tiro', element: null, power: 50, cost: 0, unlockLevel: 100, growth: 101 } as Technique;
  const p = { id: 1, techniques: [t] } as never as RosterEntry;
  it('only unlocks repertoire techniques of owned players, once', () => {
    const s = newSave([1], 1);
    s.coins = 5000;
    expect(buyTechUnlock(s, p, 3)).toBe(false);
    expect(buyTechUnlock(s, p, 0)).toBe(true);
    const coins = s.coins;
    expect(buyTechUnlock(s, p, 0)).toBe(false);
    expect(s.coins).toBe(coins);
    expect(buyTechUnlock(newSave([], null), p, 0)).toBe(false);
  });
  it('caps technique boosts', () => {
    const s = newSave([1], 1);
    s.coins = 1e6;
    for (let i = 0; i < 9; i++) buyTechBoost(s, p, 0);
    expect(s.shop.techBoosts['5']).toBe(MAX_TECH_BOOST);
  });
  it('gear must be bought, equips per slot and applies its bonus', () => {
    const items = [{ id: 1, name: 'Botas A', folder: 'Botas', icon: 1, description: 'd', price: 10 }, { id: 2, name: 'Botas B', folder: 'Botas', icon: 1, description: 'd', price: 20 }];
    const gear = buildGear(items);
    const s = newSave([1], 1);
    s.coins = 1e5;
    expect(equipGear(s, gear[0])).toBe(false);
    buyGear(s, gear[0]); buyGear(s, gear[1]);
    equipGear(s, gear[0]); equipGear(s, gear[1]);
    expect(Object.keys(s.gear.equipped)).toEqual(['botas']);
    expect(applyGear(perkEffects(s), s, gear).speedMult).toBeGreaterThan(1);
    expect(buyGear(s, gear[0])).toBe(false);
  });
  it('every permanent upgrade is capped', () => {
    const s = newSave([], null);
    s.coins = 1e9;
    for (const d of PERKS) { for (let i = 0; i < 50; i++) buyPerk(s, d.id); expect(perkLevel(s, d.id)).toBe(d.max); }
  });
});

describe('music playlists', () => {
  it('never repeats a track twice in a row when there is a choice', () => {
    for (const pool of Object.values(PLAYLISTS)) {
      let last: string | null = null;
      for (let i = 0; i < 100; i++) {
        const t = nextTrack(pool, last, Math.random);
        if (pool.length > 1) expect(t).not.toBe(last);
        last = t;
      }
    }
  });
  it('every playlist has its own compositions, all of them renderable', () => {
    const lists = Object.values(PLAYLISTS).flat();
    expect(new Set(lists).size).toBe(lists.length);
    for (const c of COMPOSITIONS) expect(renderBars(c, 8).filter((e) => e.part === 'lead').length).toBeGreaterThan(8);
  });
  it('the same score plays the same every time', () => {
    expect(renderBars(COMPOSITIONS[0], 4)).toEqual(renderBars(COMPOSITIONS[0], 4));
  });
});

describe('v2.5 economy and rewards', () => {
  const mk = (id: number, rarity: string, teams: string[]) => ({ id, name: `P${id}`, rarity, teams, techniques: [] }) as never as RosterEntry;
  const pool = [mk(1, 'epico', ['A']), mk(2, 'comun', ['A', 'B']), mk(3, 'comun', ['A']), mk(4, 'raro', ['A'])];
  const own = (s: ReturnType<typeof newSave>, ...ids: number[]) => ids.forEach((i) => { s.owned[String(i)] = { stars: 0, copies: 1, obtainedAt: 'x' }; });

  it('six rarities add up to 100 and Leyenda is exceptional', () => {
    expect(Object.keys(RARITY_WEIGHTS)).toHaveLength(6);
    expect(Object.values(RARITY_WEIGHTS).reduce((a, b) => a + b, 0)).toBeCloseTo(100);
    expect(RARITY_WEIGHTS.leyenda).toBeLessThan(0.5);
  });
  it('pulls spend tokens, not coins', () => {
    const s = newSave([], null);
    const c = s.coins, t = s.tokens;
    expect(pull([mk(9, 'comun', [])], s, 1)).toHaveLength(1);
    expect([s.coins, s.tokens]).toEqual([c, t - PULL_COST]);
  });
  it('team rewards count unique players, adapt to small teams and pay once', () => {
    const s = newSave([], null);
    own(s, 2, 2, 3);
    expect(canClaim(s, pool, 'A', 'crest')).toBe(false);
    own(s, 1);
    expect(claimTeamReward(s, pool, 'A', 'crest')).toBe(true);
    expect(claimTeamReward(s, pool, 'A', 'crest')).toBe(false);
    expect(teamProgress(s, pool, 'A').goal.kit).toBe(4); // team of 4: 7 becomes 4
    expect(canClaim(s, pool, 'B', 'captain')).toBe(true); // shared player counts for both
    own(s, 4);
    expect(claimTeamReward(s, pool, 'A', 'captain')).toBe(true);
    expect(s.owned['1'].copies).toBe(2);
    expect(claimTeamReward(s, pool, 'A', 'captain')).toBe(false);
    expect(s.owned['1'].copies).toBe(2);
  });
  it('daily shop is stable per date and profile, and sells each offer once', () => {
    const roster = Array.from({ length: 200 }, (_, i) => mk(i + 1, ['comun', 'raro', 'epico', 'legendario'][i % 4], []));
    const a = dailyOffers(roster, '2026-11-01', 7);
    expect(dailyOffers(roster, '2026-11-01', 7)).toEqual(a);
    expect(dailyOffers(roster, '2026-11-02', 7)).not.toEqual(a);
    expect(dailyOffers(roster, '2026-11-01', 8)).not.toEqual(a);
    const s = newSave([], null);
    s.coins = 1e6;
    const day = new Date(2026, 10, 1, 12);
    s.shopSeed = 7;
    expect(rollDaily(s, roster, day).slice(0, a.length).map((o) => o.playerId).filter((id) => a.some((x) => x.playerId === id)).length).toBeGreaterThan(5); // Fix 1.12: the weekly special joins them
    expect(buyOffer(s, roster, a[0].playerId, day)).toBe(true);
    const c = s.coins;
    expect(buyOffer(s, roster, a[0].playerId, day)).toBe(false);
    expect(s.coins).toBe(c);
    expect(buyOffer(s, roster, 99999, day)).toBe(false); // not on sale today
  });
  it('daily shop keeps the same offers all day, even if the roster changes, and rotates at midnight', () => {
    const roster = Array.from({ length: 200 }, (_, i) => mk(i + 1, ['comun', 'raro', 'epico', 'legendario'][i % 4], []));
    const s = newSave([], null);
    s.coins = 1e6;
    const morning = new Date(2026, 10, 1, 0, 5), night = new Date(2026, 10, 1, 23, 59, 59), next = new Date(2026, 10, 2, 0, 0, 1);
    const a = rollDaily(s, roster, morning);
    buyOffer(s, roster, a[1].playerId, morning);
    const reloaded = JSON.parse(JSON.stringify(s)); // same as reading the save back after a reload
    expect(rollDaily(reloaded, roster.slice(50), night)).toEqual(a);
    expect(reloaded.daily.bought).toEqual([a[1].playerId]);
    expect(buyOffer(reloaded, roster, a[1].playerId, night)).toBe(false); // stock doesn't come back
    const b = rollDaily(reloaded, roster, next);
    expect(b).not.toEqual(a);
    expect(reloaded.daily.bought).toEqual([]);
    expect(msToNextDay(new Date(2026, 10, 1, 23, 0))).toBe(3600000);
  });
  it('third and fourth technique slots are bought in order', () => {
    const s = newSave([], null);
    s.coins = 1e6;
    expect(perkEffects(s).techSlots).toBe(2);
    expect(buyPerk(s, 'ranura4')).toBe(false);
    expect(buyPerk(s, 'ranura3')).toBe(true);
    expect(buyPerk(s, 'ranura4')).toBe(true);
    expect(perkEffects(s).techSlots).toBe(4);
    const p = { id: 1, techniques: [1, 2, 3, 4].map((id) => ({ id, type: 'tiro', unlockLevel: 1 })) } as never as RosterEntry;
    expect(newMemberState(p, 4).slots).toEqual([0, null, null, null]);
  });
  it('altars need the captain, track progress and fail on time', () => {
    const a = createAltar('entrenamiento', 0, 0, 2);
    expect(stepAltar(a, 1, false, 5)).toBe('idle');
    expect(stepAltar(a, 1, true, a.goal)).toBe('done');
    const b = createAltar('resistencia', 0, 0, 0);
    stepAltar(b, 1, true, 0);
    expect(stepAltar(b, 99, false, 0)).toBe('failed');
  });
  it('token economy: an active defeat pays about a pull, a victory two, idle runs almost nothing', () => {
    const sum = (x: { coins: number }[]) => x.reduce((a, y) => a + y.coins, 0);
    const r = { mapId: 'raimon', victory: true, timeSec: 320, kills: 100, minibosses: 1, bossDefeated: true, reachedBoss: true };
    expect(sum(tokenRewards(r, false))).toBeGreaterThanOrEqual(2 * PULL_COST);
    const loss = { ...r, victory: false, bossDefeated: false, timeSec: 200 };
    expect(sum(tokenRewards(loss, false))).toBeGreaterThanOrEqual(PULL_COST);
    expect(sum(tokenRewards({ ...loss, kills: 3 }, false))).toBe(1); // idle: no welcome, no time bonus
    expect(sum(tokenRewards(loss, false, 0)) - sum(tokenRewards(loss, false))).toBe(WELCOME_TOKENS); // welcome bonus for the first runs
    // Fix 1.23 (feedback): a 13-minute win pays well over one ×10, a 5-minute one most of it
    const long = { ...r, timeSec: 780, kills: 1400 };
    expect(sum(tokenRewards(long, false))).toBeGreaterThan(MULTI_COST * 1.2);
    expect(sum(tokenRewards(r, false))).toBeGreaterThan(MULTI_COST * 0.6);
    expect(sum(tokenRewards(loss, false, 10))).toBe(sum(tokenRewards(loss, false)));
  });
});

describe('IE3 import rules', () => {
  it('skips IE2 duplicates, holds incomplete players and keeps ids apart', () => {
    const r = mergeIe3([{ name: 'Axel Blaze' }], [
      { id: 1, name: 'Axel Blaze(Adult)', complete: true, techniques: [1] }, { id: 2, name: 'Arion Sherwind', complete: true, techniques: [1] },
      { id: 3, name: 'Bailong', complete: true, techniques: [] }, { id: 4, name: 'Arion Sherwind', complete: true, techniques: [1] }]);
    expect(r.add.map((p) => p.gameId)).toEqual([100002]);
    expect(r.duplicates).toEqual(['Axel Blaze(Adult)', 'Arion Sherwind']);
    expect(r.pending).toEqual(['Bailong']);
  });
});

describe('techniques and upgrades v2.7', () => {
  it('mastery levels up from lifetime uses and survives runs', () => {
    expect(masteryLevel(29)).toBe(0);
    expect(masteryLevel(30)).toBe(1);
    expect(masteryLevel(99999)).toBe(5);
    expect(masteryProgress(99999)).toBe(1);
    const s = newSave([], null);
    recordMastery(s, { 5: 20 });
    recordMastery(s, { 5: 15 });
    expect(masteryLevel(s.mastery['5'])).toBe(1);
  });
  it('resonance needs three techniques of an element', () => {
    expect(resonanceBonus(2)).toBe(0);
    expect(resonanceBonus(3)).toBeGreaterThan(0);
    expect(resonanceBonus(5)).toBeGreaterThan(resonanceBonus(3));
  });
  it('a chosen starting technique is used, but never a passive', () => {
    const t = (id: number, type: string) => ({ id, type, unlockLevel: 1 });
    const p = { id: 1, techniques: [t(1, 'tiro'), t(2, 'regate'), t(3, 'talento')] } as never as RosterEntry;
    expect(newMemberState(p, 2, 1).slots[0]).toBe(1);
    expect(newMemberState(p, 2, 2).slots[0]).toBe(0);
  });
  it('category milestones and a full refund', () => {
    const s = newSave([], null);
    s.coins = 1e6;
    const base = perkEffects(s).hpMult;
    for (let i = 0; i < 10; i++) buyPerk(s, 'vida');
    expect(perkEffects(s).hpMult).toBeCloseTo((1 + 0.4) * 1.03);
    expect(base).toBe(1);
    const coins = s.coins;
    expect(refundPerks(s)).toBe(1e6 - coins);
    expect(s.coins).toBe(1e6);
    expect(s.upgrades).toEqual({});
  });
  it('perk values read from their description', () => {
    expect(perkValue(PERKS.find((p) => p.id === 'vida')!, 3)).toBe('+12%');
    expect(perkValue(PERKS.find((p) => p.id === 'regen')!, 2)).toBe('+0,1%');
  });
});

describe('Mi Equipo (squad of seven)', () => {
  const mk = (id: number, rarity: string) => ({ id, name: `P${id}`, rarity, teams: [], techniques: [] }) as never as RosterEntry;
  const roster = [mk(1, 'comun'), mk(2, 'legendario'), mk(3, 'raro'), mk(4, 'epico'), mk(5, 'comun'), mk(6, 'mitico'), mk(7, 'raro'), mk(8, 'comun'), mk(9, 'epico')];
  const byId = new Map(roster.map((p) => [p.id, p]));
  const owning = (...ids: number[]) => {
    const s = newSave([], null);
    for (const i of ids) s.owned[String(i)] = { stars: 0, copies: 1, obtainedAt: 'x' };
    return s;
  };

  it('fills up to seven owned players, best rarity first, captain kept first', () => {
    const s = owning(1, 2, 3, 4, 5, 6, 7, 8, 9);
    s.captainId = 1;
    fillSquad(s, roster);
    expect(s.squad).toHaveLength(SQUAD_SIZE);
    expect(s.squad[0]).toBe(1);
    expect(s.squad.slice(1, 3)).toEqual([6, 2]);
    expect(new Set(s.squad).size).toBe(SQUAD_SIZE);
  });
  it('with fewer than seven owned, keeps the free slots instead of inventing players', () => {
    const s = owning(3, 5);
    fillSquad(s, roster);
    expect(squadOf(s, byId).map((p) => p.id)).toEqual([3, 5]);
  });
  it('never takes locked or repeated players; placing a member again swaps slots', () => {
    const s = owning(1, 2, 3);
    setSquad(s, [1, 2, 2, 9]);
    expect(s.squad).toEqual([1, 2]);
    placeInSquad(s, byId, 2, 9); // not owned
    expect(s.squad).toEqual([1, 2]);
    placeInSquad(s, byId, 2, 3);
    expect(s.squad).toEqual([1, 2, 3]);
    placeInSquad(s, byId, 0, 3);
    expect(s.squad).toEqual([3, 2, 1]);
    expect(s.captainId).toBe(3);
    makeCaptain(s, byId, 2);
    expect(s.squad[0]).toBe(2);
    removeFromSquad(s, byId, 2);
    expect(s.squad).toEqual([3, 1]);
    expect(s.captainId).toBe(3);
  });
  it('recruit cards only offer the squad, and none once five are on the pitch', () => {
    const tech = { id: 1, name: 'T', description: '', type: 'tiro', element: null, power: 40, cost: 0, unlockLevel: 1, growth: 101 } as Technique;
    const squad = roster.slice(0, 7).map((p) => ({ ...p, techniques: [tech] }));
    const ctx = (n: number): CardContext => ({ team: squad.slice(0, n).map((p) => newMemberState(p)), unlocked: squad, runLevel: 5, bought: () => [], taken: {} });
    const ids = cardPool(ctx(1)).filter((c) => c.kind === 'recruit').map((c) => (c as { playerId: number }).playerId);
    expect(ids.sort()).toEqual([2, 3, 4, 5, 6, 7]);
    expect(cardPool(ctx(MAX_TEAM)).some((c) => c.kind === 'recruit')).toBe(false);
  });
});

describe('difficulty ranks', () => {
  it('five ranks, harder ones change pace, elites and hazards, not only health, and pay more', () => {
    expect(RANK_ORDER).toEqual(['C', 'B', 'A', 'S', 'X']);
    for (let i = 1; i < RANK_ORDER.length; i++) {
      const a = RANKS[RANK_ORDER[i - 1]], b = RANKS[RANK_ORDER[i]];
      expect(b.spawnInterval).toBeLessThanOrEqual(a.spawnInterval);
      expect(b.elite).toBeGreaterThanOrEqual(a.elite);
      expect(b.reward).toBeGreaterThan(a.reward);
    }
    expect(RANKS.C.hazardEvery).toBeGreaterThan(RANKS.X.hazardEvery);
    expect(RANKS.X.hazardEvery).toBeGreaterThan(0);
  });
  it('waves alternate pressure and breathers after a busy start', () => {
    expect(waveIntensity(5).phase).toBe('inicio');
    const phases = new Set(Array.from({ length: 120 }, (_, i) => waveIntensity(30 + i).phase));
    expect([...phases].sort()).toEqual(['normal', 'presion', 'respiro']);
  });
  it('rank rewards: multiplier on coins and a one-time token bonus per arena and rank', () => {
    const s = newSave([], null);
    const run = { mapId: 'raimon', victory: true, timeSec: 300, kills: 100, minibosses: 2, bossDefeated: true, reachedBoss: true };
    const c = applyRun(s, { ...run, rank: 'C' }).total;
    const x = applyRun(s, { ...run, rank: 'X' });
    expect(x.total).toBeGreaterThan(c * 1.8); // Fix 1.11: X pays ×2.2 (was ×3)
    expect(x.tokens.some((t) => t.label === 'Primera victoria en Rango X')).toBe(true);
    const again = applyRun(s, { ...run, rank: 'X' });
    expect(again.tokens.some((t) => t.label === 'Primera victoria en Rango X')).toBe(false);
    // Fix 1.3: the rank multiplies the fichas too
    const cTok = applyRun(s, { ...run, rank: 'C' }).tokenTotal;
    expect(again.tokenTotal).toBeGreaterThan(cTok * 2);
    expect(x.trainTotal).toBeGreaterThan(0); // a new rank and a victory give Fichas de entrenamiento
    expect(s.clearedRanks.raimon).toEqual(['C', 'X']);
  });
});

describe('combined techniques', () => {
  const tech = (name: string) => ({ id: 1, name, description: '', type: 'tiro', element: 'Fuego', power: 60, cost: 0, unlockLevel: 1, growth: 101 }) as Technique;
  const member = (name: string, techs: string[], level: number) => ({
    entry: { id: name.length, name, techniques: techs.map(tech) } as never as RosterEntry,
    state: { playerId: name.length, slots: [0, null], levels: { 0: level } },
  });
  const cross = COMBOS.find((c) => c.id === 'fuego-cruzado')!;

  it('every combo names its source and real participants, and at most a few exist', () => {
    expect(COMBOS.length).toBeLessThanOrEqual(12);
    for (const c of COMBOS) { expect(c.source).toMatch(/fandom|MyAnimeList|ROM/); expect(c.needs.length).toBeGreaterThanOrEqual(2); }
  });
  it('Fuego cruzado needs Axel and Shawn on the pitch with both techniques at max level', () => {
    const axel = member('Axel Blaze', ['Tornado de fuego'], 10), shawn = member('Shawn Froste', ['Ventisca eterna'], 10);
    expect(comboReady(cross, [axel, shawn])).toBe(true);
    expect(comboReady(cross, [axel])).toBe(false);
    expect(comboReady(cross, [axel, member('Shawn Froste', ['Ventisca eterna'], 9)])).toBe(false);
    expect(comboReady(cross, [axel, member('Shawn Froste', ['Entrada huracán'], 10)])).toBe(false);
  });
  it('upgrades make it stronger', () => {
    expect(comboDamage(cross, 5)).toBeGreaterThan(comboDamage(cross, 1));
  });
});

describe('claim all', () => {
  it('missions: pays every finished one once, never unfinished ones', () => {
    const s = newSave([], null);
    rollPeriods(s);
    s.missions.daily.counters.runs = 5; // d_partidas done
    s.missions.counters.kills = 600; // l_500 done, l_5000 not
    const coins = s.coins, tokens = s.tokens;
    const got = claimAllMissions(s);
    expect(got.count).toBe(2);
    expect(s.coins - coins).toBe(got.coins);
    expect(s.tokens - tokens).toBe(got.tokens);
    expect(claimAllMissions(s).count).toBe(0);
    expect(MISSIONS.filter((d) => isClaimable(s, d))).toHaveLength(0);
  });
  it('team rewards: claims ready ones only, skipping rewards without a resource', () => {
    const mk = (id: number, teams: string[]) => ({ id, name: `P${id}`, rarity: 'comun', teams, techniques: [] }) as never as RosterEntry;
    const pool = [1, 2, 3, 4].map((i) => mk(i, ['A'])).concat([mk(5, ['B']), mk(6, ['B']), mk(7, ['B']), mk(8, ['B'])]);
    const s = newSave([], null);
    for (const i of [1, 2, 3, 4, 5]) s.owned[String(i)] = { stars: 0, copies: 1, obtainedAt: 'x' };
    const got = claimAllTeamRewards(s, pool, (_t, k) => k !== 'kit');
    expect(got).toEqual([{ team: 'A', kind: 'crest' }, { team: 'A', kind: 'captain' }]);
    expect(claimAllTeamRewards(s, pool, () => true)).toEqual([{ team: 'A', kind: 'kit' }]);
  });
});

describe('gacha info', () => {
  it('real odds move an empty rarity down and still add up to 100', () => {
    const pool = [{ id: 1, rarity: 'comun' }, { id: 2, rarity: 'legendario' }] as never as RosterEntry[];
    const o = effectiveOdds(pool);
    expect(Object.values(o).reduce((a, b) => a + b, 0)).toBeCloseTo(100);
    expect(o.leyenda).toBe(0);
    expect(o.legendario).toBeCloseTo(5 + 1.3 + 0.2);
  });
  it('history keeps the newest pulls first, capped', () => {
    const s = newSave([], null);
    for (let i = 0; i < 40; i++) recordHistory(s, [{ player: { id: i, rarity: 'comun' } as never as RosterEntry, isNew: true, stars: 0, refund: 0 }]);
    expect(s.gachaHistory).toHaveLength(30);
    expect(s.gachaHistory[0].id).toBe(39);
  });
});

describe('ascension to HÉROE', () => {
  const leg = { id: 1, rarity: 'legendario' } as RosterEntry, myth = { id: 2, rarity: 'mitico' } as RosterEntry, epic = { id: 3, rarity: 'epico' } as RosterEntry;
  const com = { id: 4, rarity: 'comun' } as RosterEntry;
  const withCopies = (copies: Record<number, number>) => {
    const s = newSave([], null);
    for (const [id, c] of Object.entries(copies)) s.owned[id] = { stars: Math.min(5, c - 1), copies: c, obtainedAt: 'x' };
    return s;
  };
  it('Legendario -> Mítico costs its ascension copies, then Héroe more; each duplicate pays once', () => {
    const C = ASC_COSTS.legendario;
    const s = withCopies({ 1: 1 + C.ascenso });
    expect(nextStep(s, leg)).toEqual({ step: 'ascenso', cost: C.ascenso });
    expect(ascend(s, leg)).toBe('ascenso');
    expect(effectiveRarity(s, leg)).toBe('mitico');
    expect(sparesOf(s, 1)).toBe(0);
    expect(ascend(s, leg)).toBe(false); // the same copies can't pay for Héroe
    s.owned['1'].copies += C.heroe - 1;
    expect(ascend(s, leg)).toBe(false); // one short
    s.owned['1'].copies += 1;
    expect(ascend(s, leg)).toBe('heroe');
    expect(isHero(s, 1)).toBe(true);
    expect(sparesOf(s, 1)).toBe(0);
    expect(nextStep(s, leg)).toEqual({ step: 'estrella', cost: C.estrella }); // Fix 1.31: then the hero stars
    expect(s.owned['1'].stars).toBe(C.ascenso); // stars already earned are kept
  });
  it('every rarity can ascend (Fix 1.23), commoner footballers need more copies', () => {
    const s = withCopies({ 2: 7, 3: 20, 4: 40 });
    expect(nextStep(s, myth)).toEqual({ step: 'heroe', cost: ASC_COSTS.mitico.heroe }); // Fix 1.31: a Mítico goes straight to HÉROE
    expect(ascend(s, myth)).toBe('heroe');
    expect(effectiveRarity(s, myth)).toBe('mitico');
    expect(ascend(s, myth)).toBe('estrella');
    expect(s.owned['2'].heroStars).toBe(1);
    expect(ascend(s, epic)).toBe('ascenso');
    expect(effectiveRarity(s, epic)).toBe('legendario');
    expect(ascend(s, com)).toBe('ascenso');
    expect(effectiveRarity(s, com)).toBe('raro');
    expect(ascend(s, com)).toBe('heroe');
    expect(ASC_COSTS.comun.ascenso).toBeGreaterThan(ASC_COSTS.epico.ascenso);
    expect(ASC_COSTS.epico.ascenso).toBeGreaterThan(ASC_COSTS.legendario.ascenso);
    expect(ascend(s, { id: 99, rarity: 'legendario' } as RosterEntry)).toBe(false);
  });
  it('a HÉROE earns up to 3 hero stars, then has no step left', () => {
    const s = withCopies({ 2: 30 });
    s.owned['2'].hero = true; s.owned['2'].spent = 2;
    for (let i = 0; i < 3; i++) expect(ascend(s, myth)).toBe('estrella');
    expect(nextStep(s, myth)).toBeNull();
    expect(ascMultipliers(s, myth).damage).toBeCloseTo(1.18 * 1.05 ** 3);
  });
  it('Fix 1.31: Míticos ascended the old way become HÉROE once, and an old HÉROE gets its first hero star', async () => {
    const { migrateHeroes131 } = await import('../src/systems/ascension');
    const s = withCopies({ 2: 6, 5: 9, 1: 4 });
    const myth2 = { id: 5, rarity: 'mitico' } as RosterEntry;
    Object.assign(s.owned['2'], { ascMitico: true, spent: 2 });
    Object.assign(s.owned['5'], { ascMitico: true, hero: true, spent: 5 });
    Object.assign(s.owned['1'], { ascMitico: true, ascRarity: 'mitico', spent: 2 }); // a Legendario that became Mítico: untouched
    migrateHeroes131(s, [myth, myth2, leg]);
    expect(s.owned['2']).toMatchObject({ hero: true, spent: 2 });
    expect(s.owned['2'].ascMitico).toBeUndefined();
    expect(s.owned['5']).toMatchObject({ hero: true, heroStars: 1, spent: 5 });
    expect(s.owned['1']).toMatchObject({ ascMitico: true, spent: 2 });
    expect(s.owned['1'].hero).toBeUndefined();
    migrateHeroes131(s, [myth, myth2, leg]); // only once
    expect(s.owned['5'].heroStars).toBe(1);
    expect(importSave(exportSave(s)).owned['5'].heroStars).toBe(1);
  });
  it('survives save validation and a reload, and spent can never exceed the duplicates', () => {
    const total = ASC_COSTS.legendario.ascenso + ASC_COSTS.legendario.heroe;
    const s = withCopies({ 1: 1 + total });
    ascend(s, leg); ascend(s, leg);
    const back = importSave(exportSave(s));
    expect(back.owned['1']).toMatchObject({ ascMitico: true, hero: true, spent: total });
    const forged = JSON.parse(exportSave(s));
    forged.save.owned['1'].spent = 50;
    expect(importSave(JSON.stringify(forged)).owned['1'].spent).toBe(total);
  });
  it('a later rarity review keeps the progression', () => {
    const s = withCopies({ 1: 4 });
    ascend(s, leg);
    expect(effectiveRarity(s, { id: 1, rarity: 'mitico' })).toBe('mitico');
    expect(nextStep(s, { id: 1, rarity: 'mitico' })).toEqual({ step: 'heroe', cost: ASC_COSTS.mitico.heroe });
    expect(ascMultipliers(s, leg).damage).toBeCloseTo(1.12);
  });
});

describe('endless survival', () => {
  it('records the best endless time and keeps the victory', () => {
    const s = newSave([], null);
    const r = applyRun(s, { mapId: 'raimon', victory: true, timeSec: 500, kills: 300, minibosses: 2, bossDefeated: true, reachedBoss: true, endlessSec: 200 });
    expect(r.records).toContain('infinito');
    expect(s.stats.bestEndless).toBe(200);
    applyRun(s, { mapId: 'raimon', victory: true, timeSec: 350, kills: 100, minibosses: 2, bossDefeated: true, reachedBoss: true, endlessSec: 50 });
    expect(s.stats.bestEndless).toBe(200);
    expect(s.clearedMaps).toContain('raimon');
  });
});

describe('missions 4.0', () => {
  it('collection, rank and boss counters; dupe rewards help an ascension and pay once', () => {
    const s = newSave([], null);
    s.owned['1'] = { stars: 0, copies: 1, obtainedAt: 'x' };
    s.owned['2'] = { stars: 0, copies: 1, obtainedAt: 'x', hero: true, ascMitico: true };
    recordCollection(s, [{ id: 1, teams: ['A'] }, { id: 2, teams: ['A'] }, { id: 3, teams: ['B'] }], ['A', 'B']);
    expect(s.missions.counters).toMatchObject({ col_owned: 2, col_heroes: 1, col_ascended: 1, col_teams: 1 });
    rollPeriods(s);
    recordRun(s, { mapId: 'raimon', rank: 'A', victory: true, timeSec: 300, kills: 10, minibosses: 0, bossDefeated: true, reachedBoss: true });
    recordRun(s, { mapId: 'raimon', rank: 'X', victory: true, timeSec: 300, kills: 10, minibosses: 0, bossDefeated: true, reachedBoss: true });
    expect(s.missions.weekly.counters.wins_hi).toBe(2);
    expect(s.missions.counters.wins_X).toBe(1);
    const roster = [{ id: 1, rarity: 'legendario' }, { id: 2, rarity: 'mitico' }];
    const before = s.owned['1'].copies + s.owned['2'].copies;
    expect(claimMission(s, 's_rango', 1, roster)).toBeGreaterThan(0);
    expect(s.owned['1'].copies + s.owned['2'].copies).toBe(before + 1);
    expect(claimMission(s, 's_rango', 1, roster)).toBe(0);
    expect(s.owned['1'].copies + s.owned['2'].copies).toBe(before + 1);
  });
});

describe('personal ranking', () => {
  it('keeps the best mark per board, never counts a run twice, orders by time then damage', () => {
    const s = newSave([], null);
    const m = (time: number, damage: number, map = 'raimon', rank = 'C') => ({ map, rank, time, damage, captainId: 1, at: 'x' });
    expect(recordBest(s, 'r1', m(100, 50))).toBe(true);
    expect(recordBest(s, 'r1', m(500, 50))).toBe(false); // same run again (reload)
    expect(recordBest(s, 'r2', m(100, 40))).toBe(false); // worse
    expect(recordBest(s, 'r3', m(100, 60))).toBe(true); // same time, more damage
    recordBest(s, 'r4', m(300, 10, 'royal', 'X'));
    expect(localBoard(s, null, null, 'time').map((x) => x.time)).toEqual([300, 100]);
    expect(localBoard(s, null, null, 'damage').map((x) => x.damage)).toEqual([60, 10]);
    expect(localBoard(s, 'royal', 'X', 'time')).toHaveLength(1);
    expect(positionOf([{ time: 500, damage: 1 }, { time: 400, damage: 9 }, { time: 400, damage: 3 }], { time: 400, damage: 5 })).toBe(3);
  });
  it('Fix 1.31: points put the rank first, then time and damage', async () => {
    const { scoreOf } = await import('../src/systems/leaderboard');
    expect(scoreOf({ rank: 'X', time: 600, damage: 1_000_000 })).toBe(Math.round((6000 + 2000) * 4.8));
    expect(scoreOf({ rank: 'X', time: 327, damage: 1_194_746 })).toBeGreaterThan(scoreOf({ rank: 'C', time: 1260, damage: 27_706_173 }));
    const s = newSave([], null);
    recordBest(s, 'a', { map: 'raimon', rank: 'C', time: 900, damage: 10_000, captainId: 1, at: 'x' });
    recordBest(s, 'b', { map: 'raimon', rank: 'X', time: 400, damage: 10_000, captainId: 1, at: 'x' });
    expect(localBoard(s, null, null, 'score').map((x) => x.rank)).toEqual(['X', 'C']);
    expect(localBoard(s, null, null, 'time').map((x) => x.rank)).toEqual(['C', 'X']);
    expect(localBoard(s, null, null, 'rank')[0].score).toBe(scoreOf({ rank: 'X', time: 400, damage: 10_000 }));
  });
});

describe('kit bonuses', () => {
  it('named bonus for main teams, element bonus otherwise, chemistry with 3+ of the club on the pitch', async () => {
    const { kitBonus, chemistry } = await import('../src/systems/kitBonus');
    const { perkEffects } = await import('../src/systems/perks');
    const e = perkEffects(newSave([], null));
    kitBonus('Zeus', []).apply(e);
    expect(e.damageMult).toBeCloseTo(1.07);
    const roster = [{ teams: ['X'], element: 'Aire' }, { teams: ['X'], element: 'Aire' }, { teams: ['X'], element: 'Fuego' }] as never as RosterEntry[];
    expect(kitBonus('X', roster).name).toBe('Viento a favor');
    expect(kitBonus('', roster).name).toBe('Espíritu Raimon');
    expect(chemistry('X', roster)).toBeCloseTo(1.06);
    expect(chemistry('X', roster.slice(0, 2))).toBe(1);
  });
});

describe('hall of fame', () => {
  it('records each victory once with its squad and ranks players by victories', async () => {
    const { recordTriumph, championsTable } = await import('../src/systems/hallOfFame');
    const s = newSave([], null);
    const t = (runId: string, team: number[], rank = 'C') => ({ runId, at: 'x', map: 'raimon', rank, team, time: 300, kills: 10, damage: 100, endless: 0 });
    expect(recordTriumph(s, t('a', [1, 2, 3]))).toBe(true);
    expect(recordTriumph(s, t('a', [1, 2, 3]))).toBe(false);
    recordTriumph(s, t('b', [2, 1], 'X'));
    const c = championsTable(s);
    expect(c.map((x) => [x.id, x.wins, x.captain])).toEqual([[1, 2, 1], [2, 2, 1], [3, 1, 0]]);
    expect(c[0].best).toBe('X');
  });
});

describe('id aliases', () => {
  it('a player owned under an old id moves to the new one, merging copies and ascension', async () => {
    const { remapIds } = await import('../src/systems/save');
    const s = newSave([], null);
    s.owned['100292'] = { stars: 2, copies: 4, obtainedAt: 'x', spent: 3, ascMitico: true };
    s.owned['101914'] = { stars: 1, copies: 2, obtainedAt: 'y' };
    s.squad = [100292, 5]; s.captainId = 100292;
    expect(remapIds(s, { 100292: 101914 })).toBe(1);
    expect(s.owned['100292']).toBeUndefined();
    expect(s.owned['101914']).toMatchObject({ copies: 6, stars: 2, spent: 3, ascMitico: true });
    expect(s.squad).toEqual([101914, 5]);
    expect(s.captainId).toBe(101914);
    expect(remapIds(s, { 100292: 101914 })).toBe(0);
  });
});

describe('cloud save linking', () => {
  it('suggests uploading a local profile, downloading a cloud one, and asks when both exist', async () => {
    const { linkPlan, summarize, progressOf } = await import('../src/online/cloudSync');
    const a = newSave([], null); a.owned['1'] = { stars: 0, copies: 1, obtainedAt: 'x' };
    const b = newSave([], null); b.owned['1'] = { stars: 0, copies: 1, obtainedAt: 'x' }; b.owned['2'] = { stars: 0, copies: 1, obtainedAt: 'x', hero: true }; b.stats.wins = 3;
    const empty = newSave([], null);
    expect(linkPlan(summarize(a), null)).toBe('subir-local');
    expect(linkPlan(summarize(empty), summarize(b))).toBe('bajar-nube');
    expect(linkPlan(summarize(a), summarize(b))).toBe('elegir');
    expect(progressOf(summarize(b))).toBeGreaterThan(progressOf(summarize(a)));
    expect(summarize(b)).toMatchObject({ players: 2, heroes: 1, wins: 3 });
  });
});

describe('reiniciar progreso', () => {
  const played = () => {
    const s = newSave([1, 2, 3], 1);
    Object.assign(s, { coins: 999, tokens: 77, upgrades: { vida: 3 }, onboardingDone: true, introSeen: true, favoriteTeam: 'Raimon', tutorial: 'hecho',
      onlineName: '4stra', nameLocked: true, cloudVersion: 3, devlogSeen: '4.1', clearedMaps: ['raimon'], squad: [1, 2], kit: 'Raimon' });
    s.owned['1'] = { stars: 2, copies: 6, obtainedAt: 'x', spent: 3, ascMitico: true, hero: true };
    s.teamRewards = { Raimon: { kit: true, crest: true } };
    s.stats.runs = 8; s.stats.wins = 3;
    s.missions.claimed = ['m1', 'm2'];
    s.bests = { 'raimon:C': { map: 'raimon', rank: 'C', time: 300, damage: 10, captainId: 1, at: 'x' } };
    s.hall = [{ runId: 'r', at: 'x', map: 'raimon', rank: 'C', team: [1], time: 300, kills: 1, damage: 10, endless: 0 }];
    s.settings.volume = 0.1;
    s.profile.icon = { kind: 'player', id: 1 };
    return s;
  };
  it('lists exactly what will be wiped', async () => {
    const { resetSummary } = await import('../src/systems/resetProgress');
    expect(resetSummary(played())).toMatchObject({ players: 3, duplicates: 5, ascended: 1, coins: 999, tokens: 77, upgrades: 3, kits: 1, missionsClaimed: 2, runs: 8, wins: 3, bests: 1, hall: 1 });
  });
  it('a new player again, with the same global name, settings and a higher epoch', async () => {
    const { freshProgress, epochOf } = await import('../src/systems/resetProgress');
    const old = played();
    const f = freshProgress(old);
    expect(f).toMatchObject({ coins: newSave([], null).coins, tokens: newSave([], null).tokens, owned: {}, upgrades: {}, onboardingDone: false, introSeen: false,
      favoriteTeam: null, tutorial: 'pendiente', clearedMaps: [], squad: [], kit: '', teamRewards: {}, captainId: null });
    expect(f.stats.runs).toBe(0);
    expect(f.missions.claimed).toEqual([]);
    expect(f.bests).toBeUndefined();
    expect(f.hall).toBeUndefined();
    expect(f.profile).toEqual({ name: '4stra', icon: { kind: 'emblem', id: 1 } });
    expect(f).toMatchObject({ onlineName: '4stra', nameLocked: true, cloudVersion: 3, devlogSeen: '4.1', progressEpoch: 1 });
    expect(f.settings.volume).toBe(0.1);
    expect(epochOf(freshProgress(f))).toBe(2);
    expect(epochOf(old)).toBe(0);
    // the epoch survives saving and loading
    expect(importSave(exportSave(f)).progressEpoch).toBe(1);
  });
  it('a guest keeps nothing locked: the name is only suggested', async () => {
    const { freshProgress } = await import('../src/systems/resetProgress');
    const g = played(); g.onlineName = undefined; g.nameLocked = true; g.profile.name = 'Invitado1';
    const f = freshProgress(g);
    expect(f.nameLocked).toBeUndefined();
    expect(f.onlineName).toBeUndefined();
    expect(f.profile.name).toBe('Invitado1');
  });
});

describe('versión pública y reportes de bugs', () => {
  it('the public news start at v1.0 and no internal version leaks into them', async () => {
    const { PUBLIC_RELEASES, PUBLIC_VERSION, RELEASED, VERSION_LABEL, BUILD, TIKTOK_URL } = await import('../src/data/release');
    expect(PUBLIC_VERSION).toBe('1.32');
    expect(PUBLIC_RELEASES.map((r) => r.version)).toEqual(['1.32', '1.31', '1.3', '1.22', '1.21', '1.2', '1.12', '1.11', '1.1', '1.0']); // newest first, starting at v1.0
    expect(PUBLIC_RELEASES.at(-1)!.title).toBe('InaZurvivors v1.0 — ¡Comienza la aventura!');
    expect(JSON.stringify(PUBLIC_RELEASES)).not.toMatch(/\bv?[234]\.\d\b/);
    expect(BUILD).not.toBe('1.0');
    expect(RELEASED).toBe(false); // true only after a verified public deployment
    expect(VERSION_LABEL).toContain('pre-lanzamiento');
    expect(TIKTOK_URL).toBe('https://www.tiktok.com/@aastra.__');
  });
  it('form rules', async () => {
    const { validateBug, validateShot } = await import('../src/systems/bugReport');
    const ok = { category: 'gacha', severity: 'media', title: 'No sale nada', description: 'La máquina se queda parada.', steps: '' };
    expect(validateBug(ok)).toBe('');
    expect(validateBug({ ...ok, category: '' })).toMatch(/categoría/);
    expect(validateBug({ ...ok, severity: 'x' })).toMatch(/gravedad/);
    expect(validateBug({ ...ok, title: 'a' })).toMatch(/título/);
    expect(validateBug({ ...ok, description: 'corta' })).toMatch(/ocurrido|pasado/);
    expect(validateShot({ type: 'image/gif', size: 10 })).toMatch(/PNG/);
    expect(validateShot({ type: 'image/png', size: 16 * 1024 * 1024 })).toMatch(/grande/);
    expect(validateShot({ type: 'image/webp', size: 1000 })).toBe('');
  });
  it('technical data: only the listed fields, run data only during a run', async () => {
    const { buildMeta, describeAgent } = await import('../src/systems/bugReport');
    const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';
    expect(describeAgent(ua)).toEqual({ browser: 'Chrome 130', os: 'Windows 10/11' });
    expect(describeAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1')).toEqual({ browser: 'Safari 17', os: 'iOS' });
    const menu = buildMeta('1.0', '4.2', ua, { w: 1920, h: 1080, dpr: 1 }, null);
    expect(Object.keys(menu).sort()).toEqual(['browser', 'build', 'os', 'screen', 'version']);
    expect(menu.screen).toBe('1920x1080');
    expect(buildMeta('1.0', '4.2', ua, { w: 390, h: 844, dpr: 3 }, { map: 'Raimon', difficulty: 'B', runTimeSec: 75.6 })).toMatchObject({ screen: '390x844 @3x', map: 'Raimon', difficulty: 'B', runTimeSec: 76 });
  });
});

describe('rebalanceo 4.3', () => {
  it('magnets are rare, ignore luck and respect their gap', async () => {
    const { rollDrop, DROPS, MAGNET_GAP_SEC } = await import('../src/systems/items');
    expect(DROPS.find((d) => d.id === 'iman')!.chance).toBeLessThanOrEqual(0.0015);
    expect(MAGNET_GAP_SEC).toBeGreaterThanOrEqual(60);
    const count = (luck: number, ready: boolean) => { let n = 0, x = 0; for (let i = 0; i < 200000; i++) { x = (x * 16807 + 11) % 2147483647; const v = x / 2147483647; if (rollDrop(() => v, luck, ready)?.id === 'iman') n++; } return n; };
    expect(count(0, false)).toBe(0);
    expect(count(0.6, true)).toBeLessThan(count(0, true) * 2.2);
  });
  it('caps: a huge build is strong but limited', async () => {
    const { softCap, capCooldown, capTaken, CAPS } = await import('../src/systems/balance');
    expect(softCap(1.5)).toBe(1.5);
    expect(softCap(3)).toBeGreaterThan(CAPS.damageKnee);
    expect(softCap(100)).toBeLessThanOrEqual(CAPS.damageMax);
    expect(capCooldown(0.1)).toBe(CAPS.cooldown);
    expect(capTaken(0)).toBe(CAPS.damageTaken);
  });
  it('every rank is harder in several ways, C stays the easiest', async () => {
    const { RANK_ORDER, RANKS } = await import('../src/systems/difficulty');
    for (let i = 1; i < RANK_ORDER.length; i++) {
      const a = RANKS[RANK_ORDER[i - 1]], b = RANKS[RANK_ORDER[i]];
      expect(b.hp).toBeGreaterThan(a.hp);
      expect(b.spawnInterval).toBeLessThan(a.spawnInterval);
      expect(b.shooter + b.flanker + b.bomber + b.tank).toBeGreaterThan(a.shooter + a.flanker + a.bomber + a.tank);
      expect(b.hazardEvery).toBeLessThan(a.hazardEvery);
    }
  });
  it('endless: five phases, growth without limit after minute 15, idle play earns nothing', async () => {
    const { endlessPhase, endlessScale, endlessActive } = await import('../src/systems/endless');
    expect([0, 3, 6, 10, 15].map((m) => endlessPhase(m).id)).toEqual([0, 1, 2, 3, 4]);
    expect(endlessPhase(2.9).id).toBe(0);
    expect(endlessScale(30).hp).toBeGreaterThan(endlessScale(15).hp * 8);
    expect(endlessScale(60).damage).toBeGreaterThan(endlessScale(30).damage * 10);
    for (let m = 1; m < 40; m++) expect(endlessScale(m).hp).toBeGreaterThan(endlessScale(m - 1).hp);
    expect(endlessScale(100).spawn).toBeLessThanOrEqual(3.2); // the frame rate has its own limit
    expect(endlessActive(1000, 0)).toBe(false);
    expect(endlessActive(0, 100)).toBe(false);
    expect(endlessActive(500, 10)).toBe(true);
  });
  it('bosses are different from each other and change with their health', async () => {
    const { bossKit, bossPhase, rivalKit } = await import('../src/systems/bossKit');
    const names = ['David Samford', 'Xene', 'Byron Love'];
    expect(new Set(names.map((n) => JSON.stringify(bossKit(n).phases))).size).toBe(3);
    for (const n of names) {
      const k = bossKit(n);
      expect(k.phases[1].length).toBeGreaterThan(k.phases[0].length);
      expect(k.tempo[2]).toBeLessThan(k.tempo[0]);
      expect(k.phases[2].some((a) => !k.phases[0].includes(a))).toBe(true);
    }
    expect([100, 60, 20].map((hp) => bossPhase(hp, 100))).toEqual([0, 1, 2]);
    const r = rivalKit('GK', ['Mano Celestial'], 0xffffff);
    expect(Object.values(r.names)).toContain('Mano Celestial');
  });
  it('events explain themselves', async () => {
    const { ALTAR_TYPES, ALTAR_INFO, ALTAR_ICON, ALTAR_LABEL } = await import('../src/systems/altars');
    for (const t of ALTAR_TYPES) { expect(ALTAR_INFO[t].description.length).toBeGreaterThan(10); expect(ALTAR_INFO[t].fail).toBeTruthy(); expect(ALTAR_ICON[t]).toBeTruthy(); }
    expect(ALTAR_LABEL.duelo).toBe('Desafío de rival');
  });
});

describe('talentos y pasivas', () => {
  it('every ROM talent (51-81) has an effect, and level scales it', async () => {
    const { TALENTS, emptyFx, talentScale } = await import('../src/systems/talents');
    for (let id = 51; id <= 81; id++) { expect(TALENTS[id]?.text).toBeTruthy(); expect(TALENTS[id].name).toBeTruthy(); }
    const f = emptyFx(); TALENTS[73].apply(f, talentScale(1)); expect(f.lastStand).toBeCloseTo(0.15);
    const g = emptyFx(); TALENTS[78].apply(g, talentScale(3)); expect(g.element.Aire).toBeCloseTo(0.18);
  });
  it('a player without a talent gets a labelled passive that fits its position and rarity', async () => {
    const { adaptedPassive, emptyFx } = await import('../src/systems/talents');
    const p = (over: object) => ({ id: 3, position: 'GK', rarity: 'comun', element: 'Fuego', techniques: [{ type: 'parada' }], ...over }) as never;
    expect(adaptedPassive(p({ techniques: [{ type: 'talento' }] }))).toBeNull();
    const keepers = [0, 1, 2].map((id) => adaptedPassive(p({ id }))!.name);
    expect(new Set(keepers).size).toBe(3);
    const fx = (over: object) => { const f = emptyFx(); adaptedPassive(p({ id: 0, position: 'MF', ...over }))!.apply(f); return f.cooldown; };
    expect(fx({ rarity: 'legendario' })).toBeGreaterThan(fx({}));
  });
});

describe('auditoría de rarezas', () => {
  const p = (id: number, rarity: string) => ({ id, rarity }) as never;
  const saveWith = (o: object) => { const s = newSave([], null); s.owned['7'] = { stars: 3, copies: 9, obtainedAt: 'x', ...o }; return s; };
  it('an ascension survives any change of the base rarity', async () => {
    const { effectiveRarity, nextStep, ascMultipliers, sparesOf } = await import('../src/systems/ascension');
    const asc = saveWith({ ascMitico: true, spent: 3 });
    for (const r of ['epico', 'legendario', 'mitico']) {
      expect(effectiveRarity(asc, p(7, r))).toBe('mitico');
      expect(nextStep(asc, p(7, r))?.step).toBe('heroe');
      expect(ascMultipliers(asc, p(7, r)).damage).toBeGreaterThan(1);
    }
    expect(sparesOf(asc, 7)).toBe(5);
    const hero = saveWith({ ascMitico: true, hero: true, spent: 8 });
    expect(nextStep(hero, p(7, 'epico'))?.step).toBe('estrella'); // Fix 1.31: hero stars after HÉROE
    expect(ascMultipliers(hero, p(7, 'epico')).damage).toBeCloseTo(ascMultipliers(hero, p(7, 'mitico')).damage);
    expect(nextStep(saveWith({}), p(7, 'leyenda'))?.step).toBe('heroe'); // Fix 1.31: a Leyenda's ascension is the HÉROE
    expect(nextStep(saveWith({}), p(7, 'epico'))).toEqual({ step: 'ascenso', cost: ASC_COSTS.epico.ascenso }); // Fix 1.23: Épico can ascend too
  });
  it('the welcome guarantee and team rewards never give the rarest footballers', async () => {
    const { teamCaptain } = await import('../src/systems/teamRewards');
    const { onboardingPull } = await import('../src/systems/gacha');
    const m = (id: number, rarity: string) => ({ id, rarity, teams: ['T'], techniques: [] }) as never;
    expect((teamCaptain([m(1, 'leyenda'), m(2, 'mitico')]) as { id: number }).id).toBe(2);
    const pool = [m(1, 'mitico'), m(2, 'epico'), ...Array.from({ length: 30 }, (_, i) => ({ id: 100 + i, rarity: 'comun', teams: ['X'], techniques: [] }) as never)];
    for (let i = 0; i < 40; i++) expect(onboardingPull(pool, newSave([], null), Math.random, 'T')[0].id).toBe(2);
  });
});

describe('technique slot remaps', () => {
  it('moves purchases and the starting choice, refunds what left, and applies each step once', () => {
    const s = newSave([], null);
    s.coins = 0;
    s.shop.techUnlocks['7'] = [1, 2];
    s.loadout['7'] = 2;
    const steps = [{ rev: 1, players: { 7: { map: [0, -1, 3], refund: [0, 500, 0] } } }];
    expect(remapTechSlots(s, steps)).toBe(500);
    expect(s.shop.techUnlocks['7']).toEqual([3]);
    expect(s.loadout['7']).toBe(3);
    expect(s.coins).toBe(500);
    expect(remapTechSlots(s, steps)).toBe(-1); // already applied
    expect(s.coins).toBe(500);
  });
});

describe('Fix 1.23 anti-exploit and pacing', () => {
  it('experience per level has no spikes: smooth growth, linear after level 40', async () => {
    const { xpForLevel } = await import('../src/systems/difficulty');
    for (let l = 1; l < 400; l++) expect(xpForLevel(l + 1) - xpForLevel(l)).toBeLessThanOrEqual(26); // never a jump between levels
    expect(xpForLevel(41) - xpForLevel(40)).toBe(xpForLevel(101) - xpForLevel(100));
    expect(xpForLevel(300)).toBeLessThan(10000);
  });
  it('the era from the wiki decides the machine, not the teams of the IE3 Great Road ROM', async () => {
    const { eraOf } = await import('../src/systems/banners');
    expect(eraOf({ teams: ['Raimon_GO'], era: 'go' })).toBe('go');
    expect(eraOf({ teams: ['Earth_Eleven'], era: 'vr' })).toBe('vr');
    expect(eraOf({ teams: ['Raimon'] })).toBe('original');
  });
  it('mission days never change on an untrusted clock nor go back', async () => {
    const { setPeriodClock } = await import('../src/systems/missions');
    const s = newSave([], null);
    rollPeriods(s, new Date(2026, 10, 2, 12));
    const day = s.missions.daily.key;
    s.missions.daily.counters.x = 3;
    setPeriodClock(() => new Date(2026, 10, 9, 12), () => false); // the PC says a week later, the server hasn't answered
    rollPeriods(s);
    expect([s.missions.daily.key, s.missions.daily.counters.x]).toEqual([day, 3]);
    setPeriodClock(() => new Date(2026, 10, 1, 12), () => true); // back in time, even on a trusted clock
    rollPeriods(s);
    expect(s.missions.daily.key).toBe(day);
    setPeriodClock(() => new Date(2026, 10, 3, 12), () => true); // the real next day
    rollPeriods(s);
    expect(s.missions.daily.key).not.toBe(day);
    setPeriodClock(() => new Date(), () => true);
  });
});

describe('Fix 1.3 stats and training', () => {
  it('rebuilt stats never overlap between rarities, whatever the raw ones', async () => {
    const { rebuildStats } = await import('../src/systems/training');
    const avg = (s: Record<string, number>) => Object.values(s).reduce((a, b) => a + b, 0) / 7;
    const high = { kick: 90, control: 88, guard: 85, body: 86, speed: 90, guts: 84, stamina: 87 };
    const low = { kick: 40, control: 42, guard: 38, body: 45, speed: 41, guts: 39, stamina: 44 };
    const order = ['comun', 'raro', 'epico', 'legendario', 'mitico', 'leyenda'] as const;
    for (let i = 1; i < order.length; i++) expect(avg(rebuildStats(low, order[i]))).toBeGreaterThan(avg(rebuildStats(high, order[i - 1])));
    const shaped = rebuildStats({ kick: 90, control: 50, guard: 50, body: 50, speed: 50, guts: 50, stamina: 50 }, 'raro');
    expect(shaped.kick).toBeGreaterThan(shaped.guard + 20); // the profile is kept
  });
  it('Fix 1.31: a stat at 99 takes no more points, and points an upgrade makes useless come back', async () => {
    const { trainRoom, trainStat, trimTraining, playerStats } = await import('../src/systems/training');
    const s = newSave([], null);
    const p = { id: 9, rarity: 'mitico', position: 'FW', stats: { kick: 99, control: 90, guard: 60, body: 80, speed: 95, guts: 85, stamina: 70 } } as never as RosterEntry;
    s.owned['9'] = { stars: 0, copies: 1, obtainedAt: 'x' };
    s.trainTokens = 40;
    const room = trainRoom(s, p, 'mitico', false).kick;
    for (let i = 0; i < room; i++) expect(trainStat(s, 9, 'kick', trainRoom(s, p, 'mitico', false).kick)).toBe(true);
    expect(playerStats(s, p, 'mitico', false).kick).toBe(99);
    expect(trainStat(s, 9, 'kick', trainRoom(s, p, 'mitico', false).kick)).toBe(false); // maxed
    const before = s.trainTokens;
    s.owned['9'].hero = true; s.owned['9'].heroStars = 3; // the upgrade raises the base: those points are useless now
    const back = trimTraining(s, p, 'mitico', true);
    expect(back).toBeGreaterThan(0);
    expect(s.trainTokens).toBe(before + back);
    expect(playerStats(s, p, 'mitico', true).kick).toBe(99);
    expect(trimTraining(s, p, 'mitico', true)).toBe(0);
  });
  it('Fix 1.31: each position has its shape (a forward shoots, a defender defends) with the same mean', async () => {
    const { rebuildStats, STAT_KEYS } = await import('../src/systems/training');
    const raw = { kick: 70, control: 70, guard: 70, body: 70, speed: 70, guts: 70, stamina: 70 };
    const fw = rebuildStats(raw, 'legendario', 0, 'FW'), df = rebuildStats(raw, 'legendario', 0, 'DF'), gk = rebuildStats(raw, 'legendario', 0, 'GK');
    expect(fw.kick).toBeGreaterThan(df.kick + 10);
    expect(df.guard).toBeGreaterThan(fw.guard + 15);
    expect(gk.guard).toBeGreaterThan(fw.guard + 15);
    const mean = (x: Record<string, number>) => STAT_KEYS.reduce((a, k) => a + x[k], 0) / 7;
    expect(Math.abs(mean(fw) - mean(df))).toBeLessThan(1);
    expect(Math.max(...Object.values(rebuildStats({ kick: 99, control: 99, guard: 99, body: 99, speed: 99, guts: 99, stamina: 99 }, 'mitico', 0, 'FW')))).toBeLessThanOrEqual(95);
  });
  it('ascension and HÉROE raise the stats; training adds up to 20 points and can be returned', async () => {
    const { playerStats, trainStat, resetTraining, trainingUsed } = await import('../src/systems/training');
    const s = newSave([], null);
    const p = { id: 5, rarity: 'legendario', stats: { kick: 70, control: 70, guard: 70, body: 70, speed: 70, guts: 70, stamina: 70 } } as unknown as RosterEntry;
    s.owned['5'] = { stars: 0, copies: 1, obtainedAt: 'x' };
    const base = playerStats(s, p, 'legendario', false), asc = playerStats(s, p, 'mitico', false), hero = playerStats(s, p, 'mitico', true);
    expect(asc.kick).toBeGreaterThan(base.kick);
    expect(hero.kick).toBeGreaterThan(asc.kick);
    s.trainTokens = 30;
    for (let i = 0; i < 25; i++) trainStat(s, 5, 'kick');
    expect([trainingUsed(s, 5), s.trainTokens]).toEqual([20, 10]);
    expect(playerStats(s, p, 'legendario', false).kick).toBe(Math.min(99, base.kick + 20));
    expect(resetTraining(s, 5)).toBe(20);
    expect(s.trainTokens).toBe(30);
    s.owned['5'].train = { kick: 50, speed: 9 } as never; // forged
    expect(Object.values(importSave(exportSave(s)).owned['5'].train ?? {}).reduce((a: number, b) => a + (b ?? 0), 0)).toBeLessThanOrEqual(20);
  });
});
