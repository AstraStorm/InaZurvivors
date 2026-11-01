/** Permanent gacha (main menu only). In-game currency only; no real money. */
import type { Rarity, RosterEntry } from '../data/manifest';
import { RARITY_ORDER } from '../data/manifest';
import type { SaveData } from './save';

/** Prices in Fichas de Fichaje. */
export const PULL_COST = 10;
export const MULTI_COST = 90; // 10 pulls
export const MAX_STARS = 5;
export const DUPLICATE_REFUND = 25; // coins when already at max stars

/** Percent chance per pull; rarities must add up to 100. Leyenda is deliberately exceptional. */
export const RARITY_WEIGHTS: Record<Rarity, number> = { comun: 50, raro: 29, epico: 14.5, legendario: 5, mitico: 1.3, leyenda: 0.2 };

export type Rng = () => number;

export function rollRarity(rng: Rng): Rarity {
  const total = RARITY_ORDER.reduce((a, r) => a + RARITY_WEIGHTS[r], 0);
  let x = rng() * total;
  for (const r of RARITY_ORDER) {
    x -= RARITY_WEIGHTS[r];
    if (x < 0) return r;
  }
  return 'comun';
}

export interface PullResult { player: RosterEntry; isNew: boolean; stars: number; refund: number }

/** One pull: rarity first, then a player of that rarity (falls back to lower rarities if empty). */
export function pullOne(pool: RosterEntry[], save: SaveData, rng: Rng): PullResult {
  let rarity = rollRarity(rng);
  let candidates = pool.filter((p) => p.rarity === rarity);
  while (!candidates.length) {
    const i = RARITY_ORDER.indexOf(rarity);
    rarity = RARITY_ORDER[(i + RARITY_ORDER.length - 1) % RARITY_ORDER.length];
    candidates = pool.filter((p) => p.rarity === rarity);
  }
  const player = candidates[Math.floor(rng() * candidates.length)];
  const key = String(player.id);
  const owned = save.owned[key];
  if (!owned) {
    save.owned[key] = { stars: 0, copies: 1, obtainedAt: new Date().toISOString() };
    return { player, isNew: true, stars: 0, refund: 0 };
  }
  owned.copies += 1;
  if (owned.stars < MAX_STARS) {
    owned.stars += 1;
    return { player, isNew: false, stars: owned.stars, refund: 0 };
  }
  save.coins += DUPLICATE_REFUND;
  return { player, isNew: false, stars: owned.stars, refund: DUPLICATE_REFUND };
}

export const HISTORY_SIZE = 30;

/** Keeps the latest pulls (newest first) so the machine can show a recent history. */
export function recordHistory(save: SaveData, res: PullResult[], now = new Date()) {
  const at = now.toISOString();
  save.gachaHistory = [...res.map((r) => ({ id: r.player.id, rarity: r.player.rarity, isNew: r.isNew, at })).reverse(), ...(save.gachaHistory ?? [])].slice(0, HISTORY_SIZE);
}

/** Real chance of each rarity: a rarity with nobody in it passes its share down, exactly like pullOne does. */
export function effectiveOdds(pool: RosterEntry[]): Record<Rarity, number> {
  const out = Object.fromEntries(RARITY_ORDER.map((r) => [r, 0])) as Record<Rarity, number>;
  for (const r of RARITY_ORDER) {
    let to = r;
    for (let k = 0; k < RARITY_ORDER.length && !pool.some((p) => p.rarity === to); k++) to = RARITY_ORDER[(RARITY_ORDER.indexOf(to) + RARITY_ORDER.length - 1) % RARITY_ORDER.length];
    out[to] += RARITY_WEIGHTS[r];
  }
  return out;
}

export function pull(pool: RosterEntry[], save: SaveData, count: 1 | 10, rng: Rng = Math.random): PullResult[] | null {
  const cost = count === 10 ? MULTI_COST : PULL_COST;
  if (save.tokens < cost || !pool.length) return null;
  save.tokens -= cost;
  save.stats.pulls += count;
  return Array.from({ length: count }, () => pullOne(pool, save, rng));
}

/** Adds a copy of an owned or new player through the same star rules as a pull. */
export function grantCopy(save: SaveData, id: number) {
  const o = save.owned[String(id)];
  if (!o) { save.owned[String(id)] = { stars: 0, copies: 1, obtainedAt: new Date().toISOString() }; return; }
  o.copies += 1;
  if (o.stars < MAX_STARS) o.stars += 1;
  else save.coins += DUPLICATE_REFUND;
}

/** Permanent power from duplicates: +8% damage and +4% team HP per star. */
export function starBonus(stars: number) {
  return { damage: 1 + 0.08 * stars, hp: 1 + 0.04 * stars };
}

export const ONBOARDING_SIZE = 5;

const HIGH_RARITY: Rarity[] = ['epico', 'legendario']; // the welcome guarantee never hands out a Mítico or a Leyenda: those stay a real event
const highFrom = (pool: RosterEntry[], team: string) => pool.filter((p) => p.teams.includes(team) && HIGH_RARITY.includes(p.rarity));

/** Teams that can be picked as favourite: only those with a guaranteed-pull candidate. */
export const eligibleTeams = (pool: RosterEntry[]) => [...new Set(pool.flatMap((p) => p.teams))].filter((t) => highFrom(pool, t).length > 0).sort();

/**
 * One-time free welcome draft: 5 distinct footballers added to the collection. With a favourite team, the first one is
 * guaranteed from that team at Epic or above; the rest use the normal odds.
 */
export function onboardingPull(pool: RosterEntry[], save: SaveData, rng: Rng = Math.random, favoriteTeam: string | null = null): RosterEntry[] {
  if (save.onboardingDone) return [];
  const got: RosterEntry[] = [];
  const fav = favoriteTeam ? highFrom(pool, favoriteTeam) : [];
  if (fav.length) got.push(fav[Math.floor(rng() * fav.length)]);
  for (let guard = 0; got.length < ONBOARDING_SIZE && guard < 200; guard++) {
    let rarity = rollRarity(rng);
    let candidates = pool.filter((p) => p.rarity === rarity && !got.includes(p));
    while (!candidates.length && rarity !== 'comun') {
      rarity = RARITY_ORDER[RARITY_ORDER.indexOf(rarity) - 1];
      candidates = pool.filter((p) => p.rarity === rarity && !got.includes(p));
    }
    if (!candidates.length) candidates = pool.filter((p) => !got.includes(p));
    if (!candidates.length) break;
    got.push(candidates[Math.floor(rng() * candidates.length)]);
  }
  for (const p of got) save.owned[String(p.id)] ??= { stars: 0, copies: 1, obtainedAt: new Date().toISOString() };
  save.onboardingDone = true;
  return got;
}
