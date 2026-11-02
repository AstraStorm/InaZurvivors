/**
 * Fix 1.23: the stats a footballer really has in the game, rebuilt from the raw ones so rarity means something, plus the
 * training points the player hands out.
 * Fix 1.31: bands raised at the top (Legendario 81-85, Mítico 88-92, Leyenda 94-98).
 *
 * Raw stats (ROM, Great Road, derived) overlapped across rarities: Épicos with a mean of 83, Legendarios of 59, every
 * Mítico at 70-72. Each rarity now has its own band of means that never overlaps the next one; inside it a footballer
 * keeps his own profile (what he is good and bad at) and a little of his raw strength. An ascension moves him to the band
 * of the rarity he reaches (+2 when the rarity doesn't change), HÉROE adds 3 more, and training adds up to 20 points
 * spread by hand, paid with Fichas de entrenamiento (runs, missions, achievements).
 */
import type { Rarity, RosterEntry } from '../data/manifest';
import type { SaveData } from './save';

export const STAT_KEYS = ['kick', 'control', 'guard', 'body', 'speed', 'guts', 'stamina'] as const;
export type StatKey = (typeof STAT_KEYS)[number];
/** centre of the band of means of each rarity; a footballer lands within ±BAND of it */
// Fix 1.31 (author's request): Legendarios in the 80s, Míticos around 90; the band narrows to ±2 so rarities still never overlap
export const RARITY_STAT_MEAN: Record<Rarity, number> = { comun: 50, raro: 59, epico: 70, legendario: 83, mitico: 89, leyenda: 94 };
export const BAND = 2;
export const TRAIN_MAX = 20;
export const STAT_MAX = 99;
/** Fix 1.31: no stat goes over 95 on its own; 96-99 are earned with ascension, HÉROE, hero stars and training */
export const BASE_STAT_MAX = 95;
const RAW_CENTER = 62;

const mean = (s: Partial<Record<string, number>>) => { const v = STAT_KEYS.map((k) => s[k] ?? RAW_CENTER); return v.reduce((a, b) => a + b, 0) / v.length; };

/**
 * Fix 1.31 (author's request): each position has its own shape, so a forward doesn't defend like a defender. The offsets
 * add up to zero, so the mean of the rarity band is kept; the footballer's own profile goes on top.
 */
export const POSITION_PROFILE: Record<string, Record<StatKey, number>> = {
  // what doesn't fit the position goes clearly down (author: «bájales stats que no vayan con ellos»)
  FW: { kick: 10, control: 4, guard: -16, body: -1, speed: 6, guts: 3, stamina: -6 },
  MF: { kick: 0, control: 9, guard: -7, body: -5, speed: 3, guts: -3, stamina: 3 },
  DF: { kick: -12, control: -5, guard: 11, body: 7, speed: -2, guts: 2, stamina: -1 },
  GK: { kick: -14, control: -9, guard: 12, body: 7, speed: -8, guts: 7, stamina: 5 },
};

/** The stats of a footballer at a rarity, from his raw ones: band of the rarity, his position, his profile, a little of his raw level. */
export function rebuildStats(raw: Partial<Record<string, number>> | null | undefined, rarity: Rarity, bonus = 0, position?: string): Record<StatKey, number> {
  const r = raw ?? {}, m = mean(r);
  const target = RARITY_STAT_MEAN[rarity] + Math.max(-BAND, Math.min(BAND, (m - RAW_CENTER) * 0.25)) + bonus;
  const out = {} as Record<StatKey, number>;
  const cap = Math.min(STAT_MAX, BASE_STAT_MAX + bonus);
  const pos = POSITION_PROFILE[position ?? ''];
  for (const k of STAT_KEYS) out[k] = Math.max(25, Math.min(cap, Math.round(target + (pos?.[k] ?? 0) + ((r[k] ?? m) - m) * 0.6)));
  return out;
}

export const trainingOf = (save: SaveData, id: number): Partial<Record<StatKey, number>> => save.owned[String(id)]?.train ?? {};
export const trainingUsed = (save: SaveData, id: number) => Object.values(trainingOf(save, id)).reduce((a, b) => a + (b ?? 0), 0);

/**
 * What the game uses: rebuilt stats at the player's effective rarity (ascension included), HÉROE bonus and training.
 * `effective` and `hero` come from ascension.ts (passed in to keep this module free of cycles).
 */
export function playerStats(save: SaveData, p: Pick<RosterEntry, 'id' | 'stats' | 'rarity'> & { position?: string }, effective: Rarity, hero: boolean): Record<StatKey, number> {
  const o = save.owned[String(p.id)];
  const sameRarityAscended = !!o?.ascMitico && effective === p.rarity;
  // Fix 1.31: each hero star adds 1 to every stat
  const out = rebuildStats(p.stats, effective, (sameRarityAscended ? 2 : 0) + (hero ? 3 + Math.min(3, o?.heroStars ?? 0) : 0), p.position);
  const t = trainingOf(save, p.id);
  for (const k of STAT_KEYS) out[k] = Math.min(STAT_MAX, out[k] + (t[k] ?? 0));
  return out;
}

/** Spends one Ficha de entrenamiento on a stat of an owned footballer; false when it isn't possible. */
export function trainStat(save: SaveData, id: number, key: StatKey): boolean {
  const o = save.owned[String(id)];
  if (!o || (save.trainTokens ?? 0) < 1 || trainingUsed(save, id) >= TRAIN_MAX || !STAT_KEYS.includes(key)) return false;
  o.train = { ...(o.train ?? {}), [key]: (o.train?.[key] ?? 0) + 1 };
  save.trainTokens = (save.trainTokens ?? 0) - 1;
  return true;
}

/** Takes back every training point of a footballer and returns the fichas (free: training is a choice, not a trap). */
export function resetTraining(save: SaveData, id: number): number {
  const o = save.owned[String(id)];
  if (!o?.train) return 0;
  const n = trainingUsed(save, id);
  delete o.train;
  save.trainTokens = (save.trainTokens ?? 0) + n;
  return n;
}
