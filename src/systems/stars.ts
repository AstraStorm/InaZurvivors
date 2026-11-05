/**
 * 1.84 (author): stars are bought, and each one is worth something you choose.
 *   - The 5 stars are bought with coins only (author: no duplicates): the n-th star costs n × 10.000 (10.000 … 50.000).
 *     Duplicates are only for ascending (or coins when there is nothing left to ascend, gacha.ts).
 *   - Each star raises the limit of ONE stat by STAR_CAP_STEP (+5), the one the player picks; picks can repeat.
 *   - A HÉROE or a Campeón can add 3 extra stars once the 5 are full: 100.000, 110.000 and 120.000 coins, no duplicates.
 *     They are stored in `extraStars` (1.88), apart from the HÉROE ★/★★/★★★ hero stars, which are still paid with
 *     duplicates in the ascension; each one gives a limit pick and counts as a star (damage and HP) in a run.
 * Stars earned before 1.84 keep their bonus and get their limit picks for free (pendingPicks).
 */
import type { RosterEntry } from '../data/manifest';
import { ASC_COSTS, HERO_STARS_MAX, championOf, isHero, rarityUp } from './ascension';
import type { Rarity } from '../data/manifest';
import { MAX_STARS } from './gacha';
import type { SaveData } from './save';
import { STAT_KEYS, STAR_CAP_STEP, type StatKey } from './training';

export { STAR_CAP_STEP };
export const EXTRA_STARS_MAX = 3;
/** coins for the n-th star (1..5) */
export const starCost = (n: number) => 10000 * n;
/** coins for the m-th extra star (1..3) */
export const extraStarCost = (m: number) => 100000 + 10000 * (m - 1);

type P = Pick<RosterEntry, 'id' | 'rarity'>;

/** a HÉROE or a Campeón can have the extra stars */
export const hasExtraStars = (save: SaveData, p: P) => isHero(save, p.id) || championOf(save, p.id) > 0;
export const extraStarsOf = (save: SaveData, id: number) => Math.min(EXTRA_STARS_MAX, save.owned[String(id)]?.extraStars ?? 0);

export interface NextStar { kind: 'star' | 'extra'; n: number; cost: number; copiesOk: boolean; copiesNeed: number; coinsOk: boolean }

/** The next star this footballer can buy, or null when there is none (all bought, or extra stars not unlocked). */
export function nextStar(save: SaveData, p: P): NextStar | null {
  const o = save.owned[String(p.id)];
  if (!o) return null;
  if (o.stars < MAX_STARS) {
    const n = o.stars + 1;
    return { kind: 'star', n, cost: starCost(n), copiesOk: true, copiesNeed: 0, coinsOk: save.coins >= starCost(n) };
  }
  const x = extraStarsOf(save, p.id);
  if (!hasExtraStars(save, p) || x >= EXTRA_STARS_MAX) return null;
  return { kind: 'extra', n: x + 1, cost: extraStarCost(x + 1), copiesOk: true, copiesNeed: 0, coinsOk: save.coins >= extraStarCost(x + 1) };
}

/** limit picks already given to stats */
export const picksUsed = (save: SaveData, id: number) => Object.values(save.owned[String(id)]?.starCaps ?? {}).reduce<number>((a, b) => a + (b ?? 0), 0);
/** stars whose limit pick is still to choose (stars from before 1.84, or a pick left for later) */
export function pendingPicks(save: SaveData, id: number): number {
  const o = save.owned[String(id)];
  if (!o) return 0;
  return Math.max(0, Math.min(MAX_STARS, o.stars) + extraStarsOf(save, id) - picksUsed(save, id));
}

/** Gives one pending pick to `stat`. */
export function assignPick(save: SaveData, id: number, stat: StatKey): boolean {
  const o = save.owned[String(id)];
  if (!o || !STAT_KEYS.includes(stat) || pendingPicks(save, id) <= 0) return false;
  const caps = o.starCaps ?? {};
  o.starCaps = { ...caps, [stat]: (caps[stat] ?? 0) + 1 };
  return true;
}

/** Buys the next star (coins, and duplicates for the first 5) and gives its +5 to `stat`. False when it isn't possible. */
export function buyStar(save: SaveData, p: P, stat: StatKey): NextStar['kind'] | false {
  const next = nextStar(save, p);
  if (!next || !next.copiesOk || !next.coinsOk || !STAT_KEYS.includes(stat)) return false;
  const o = save.owned[String(p.id)];
  save.coins -= next.cost;
  if (next.kind === 'star') o.stars = next.n; else o.extraStars = next.n;
  assignPick(save, p.id, stat);
  return next.kind;
}

/** +limit of each stat from the stars (for the screens) */
export const capBonusOf = (save: SaveData, id: number): Partial<Record<StatKey, number>> =>
  Object.fromEntries(Object.entries(save.owned[String(id)]?.starCaps ?? {}).map(([k, v]) => [k, (v ?? 0) * STAR_CAP_STEP])) as Partial<Record<StatKey, number>>;

/**
 * 1.85 (author): once per save, the stars start again from 0 under the coin rules: the 5 stars, the coin extra stars and
 * their limit picks. The HÉROE hero stars (★/★★/★★★, paid with duplicates) are NOT touched (1.88: the first version of this
 * reset deleted them by mistake; restoreHeroStars188 gives them back). Returns true when it ran.
 */
export function resetStars185(save: SaveData, roster: Pick<RosterEntry, 'id' | 'rarity'>[]): boolean {
  if (save.stars185) return false;
  void roster;
  for (const o of Object.values(save.owned)) {
    o.stars = 0;
    delete o.extraStars;
    delete o.starCaps;
  }
  save.stars185 = true;
  return true;
}

/** duplicates a HÉROE spent before his hero stars: the ascensions up to Mítico and the HÉROE itself */
function spentBeforeHeroStars(rarity: Rarity): number {
  let n = 0, r: Rarity = rarity;
  while (r !== 'mitico' && r !== 'leyenda') { n += ASC_COSTS[r]?.ascenso ?? 0; r = rarityUp(r); }
  return n + (ASC_COSTS[rarity]?.heroe ?? 0);
}

/**
 * 1.88 (author: «devuelve a la gente sus HÉROES ★★»), once per save: the 1.84/1.85 change stored the coin extra stars in
 * `heroStars` and the 1.85 reset then deleted every hero star. Here: whatever is in `heroStars` after that reset was bought
 * with coins, so it moves to `extraStars`; then each HÉROE gets his hero stars back from the duplicates he spent on them
 * (spent beyond the ascensions and the HÉROE, at the hero-star price of his rarity, 3 at most). A Campeón never had hero
 * stars. Returns true when it ran.
 */
export function restoreHeroStars188(save: SaveData, roster: Pick<RosterEntry, 'id' | 'rarity'>[]): boolean {
  if (save.heroes188) return false;
  const byId = new Map(roster.map((p) => [String(p.id), p]));
  for (const [id, o] of Object.entries(save.owned)) {
    if (save.stars185 && o.heroStars) o.extraStars = Math.min(EXTRA_STARS_MAX, Math.max(o.extraStars ?? 0, o.heroStars));
    delete o.heroStars;
    const p = byId.get(id);
    if (!o.hero || !p || p.rarity === 'leyenda') continue;
    const per = ASC_COSTS[p.rarity]?.estrella ?? 0;
    const hs = per ? Math.floor(((o.spent ?? 0) - spentBeforeHeroStars(p.rarity)) / per) : 0;
    if (hs > 0) o.heroStars = Math.min(HERO_STARS_MAX, hs);
  }
  save.heroes188 = true;
  return true;
}

/** 1.85 (author): several stars at once, one stat each (in order); stops at the first that can't be bought. Returns how many. */
export function buyStars(save: SaveData, p: P, stats: StatKey[]): number {
  let n = 0;
  for (const k of stats) { if (!buyStar(save, p, k)) break; n++; }
  return n;
}

/** how many of the next stars the player can pay right now, and what they cost together */
export function affordableStars(save: SaveData, p: P): { n: number; costs: number[] } {
  const o = save.owned[String(p.id)];
  if (!o) return { n: 0, costs: [] };
  const costs: number[] = [];
  let coins = save.coins, stars = o.stars, x = extraStarsOf(save, p.id);
  for (;;) {
    let c: number;
    if (stars < MAX_STARS) c = starCost(stars + 1);
    else if (hasExtraStars(save, p) && x < EXTRA_STARS_MAX) c = extraStarCost(x + 1);
    else break;
    if (coins < c) break;
    coins -= c; costs.push(c);
    if (stars < MAX_STARS) stars++; else x++;
  }
  return { n: costs.length, costs };
}
