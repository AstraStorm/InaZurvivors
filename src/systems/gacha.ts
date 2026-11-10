/** Permanent gacha (main menu only). In-game currency only; no real money. */
import type { Rarity, RosterEntry } from '../data/manifest';
import { RARITY_ORDER } from '../data/manifest';
import type { SaveData } from './save';
import { rollWith } from './banners';
import { nextStep } from './ascension';

/** Prices in Fichas de Fichaje. */
// Fix 1.23 (player feedback): round prices, easy to count; the ×10 keeps its guaranteed Épico or better
export const PULL_COST = 10;
export const MULTI_COST = 100;
export const MAX_STARS = 5;
/**
 * Fix 1.23: duplicates balanced by rarity. A given Común comes out about ten times as often as a given Mítico (banners.ts
 * keeps each rarity at most half as likely per player as the one below), so a star costs more copies the commoner the
 * footballer is and every rarity fills its five stars at a similar pace. Copies are also what ascension spends
 * (ascension.ts); only when nothing is left to spend them on (five stars and HÉROE) a copy turns into coins.
 */
export const COPIES_PER_STAR: Record<Rarity, number> = { comun: 3, raro: 2, epico: 2, legendario: 1, mitico: 1, leyenda: 1 };
export const DUPLICATE_REFUND_BY: Record<Rarity, number> = { comun: 10, raro: 20, epico: 40, legendario: 80, mitico: 150, leyenda: 250 };
export const DUPLICATE_REFUND = DUPLICATE_REFUND_BY.comun; // the smallest, for texts

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

/** `toStar`: copies towards the next star when this copy didn't complete one ([have, need]); `forAscension`: five
 *  stars already, the copy waits for the ascension */
export interface PullResult { player: RosterEntry; isNew: boolean; stars: number; refund: number; toStar?: [number, number]; forAscension?: boolean;
  /** 1.84: this copy completed the duplicates of the n-th star: it can be bought now (stars.ts) */ starReady?: number }

/**
 * Adds one copy of a footballer (pull, shop, pass, rewards): new, a star when its copies complete one, or coins when the
 * player has five stars and is HÉROE. Stars already earned are never taken away (older saves gave one per copy).
 */
export function addCopy(save: SaveData, p: Pick<RosterEntry, 'id' | 'rarity'>): Omit<PullResult, 'player'> {
  const key = String(p.id);
  const owned = save.owned[key];
  if (!owned) {
    save.owned[key] = { stars: 0, copies: 1, obtainedAt: new Date().toISOString() };
    return { isNew: true, stars: 0, refund: 0 };
  }
  owned.copies += 1;
  // 1.84 (author): stars are bought with coins only (stars.ts); a duplicate is for ascending, or coins
  if (!nextStep(save, p)) { // nothing left to ascend: the copy turns into coins
    const refund = DUPLICATE_REFUND_BY[p.rarity] ?? DUPLICATE_REFUND;
    save.coins += refund;
    return { isNew: false, stars: owned.stars, refund };
  }
  return { isNew: false, stars: owned.stars, refund: 0, forAscension: true };
}

/** Fix 1.53 (author): footballers that come out less than the rest of their rarity (weight 1 = normal) */
export const PULL_WEIGHT: Record<number, number> = { 101678: 0.25 }; // Mecha-Mark

/** One pull: rarity first (the banner's own odds when given), then a player of that rarity (lower rarities if empty). */
export function pullOne(pool: RosterEntry[], save: SaveData, rng: Rng, rarityRoll?: () => Rarity): PullResult {
  let rarity = rarityRoll ? rarityRoll() : rollRarity(rng);
  let candidates = pool.filter((p) => p.rarity === rarity);
  while (!candidates.length) {
    const i = RARITY_ORDER.indexOf(rarity);
    rarity = RARITY_ORDER[(i + RARITY_ORDER.length - 1) % RARITY_ORDER.length];
    candidates = pool.filter((p) => p.rarity === rarity);
  }
  const w = (p: RosterEntry) => PULL_WEIGHT[p.id] ?? 1;
  let x = rng() * candidates.reduce((a, p) => a + w(p), 0);
  const player = candidates.find((p) => (x -= w(p)) < 0) ?? candidates[candidates.length - 1];
  return { player, ...addCopy(save, player) };
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

/** currency: what pays the pull (the Banner de agradecimiento takes Fichas de evento) */
export interface PullOptions { cost?: number; multiCost?: number; hundredCost?: number; odds?: Record<Rarity, number>; currency?: 'tokens' | 'eventTokens' }

/**
 * Charges and resolves a whole pull BEFORE any animation (the animation only shows it). With banner odds, a ×10 always
 * holds at least one Épico or better: the last capsule is rolled again among Épico+ when the first nine had none.
 * 2.01 (author): ×100 = ten ×10 at once (price ×10, the same guarantee in each block of ten).
 */
export function pull(pool: RosterEntry[], save: SaveData, count: 1 | 10 | 100, rng: Rng = Math.random, opt: PullOptions = {}): PullResult[] | null {
  const cost = count === 100 ? opt.hundredCost ?? (opt.multiCost ?? MULTI_COST) * 10 : count === 10 ? opt.multiCost ?? MULTI_COST : opt.cost ?? PULL_COST;
  const wallet = opt.currency ?? 'tokens';
  if ((save[wallet] ?? 0) < cost || !pool.length) return null;
  save[wallet] = (save[wallet] ?? 0) - cost;
  save.stats.pulls += count;
  const odds = opt.odds;
  const roll = odds ? (min?: Rarity) => () => rollWith(odds, rng, min) : () => undefined;
  const out: PullResult[] = [];
  for (let i = 0; i < count; i++) {
    const guarantee = odds && count >= 10 && i % 10 === 9 && !out.slice(i - 9).some((r) => RARITY_ORDER.indexOf(r.player.rarity) >= RARITY_ORDER.indexOf('epico'))
      && pool.some((p) => RARITY_ORDER.indexOf(p.rarity) >= RARITY_ORDER.indexOf('epico'));
    out.push(pullOne(pool, save, rng, roll(guarantee ? 'epico' : undefined)));
  }
  return out;
}

/** Adds a copy of an owned or new player through the same rules as a pull (rarity unknown: one copy per star). */
export function grantCopy(save: SaveData, id: number, rarity: Rarity = 'legendario') {
  addCopy(save, { id, rarity });
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
