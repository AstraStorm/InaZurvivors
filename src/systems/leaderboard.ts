/**
 * Ranking rules shared by the online board and this device's personal bests: one best mark per board (arena + rank).
 * Fix 1.31: boards go by POINTS by default, where the rank matters most; they can still be ordered by time survived,
 * damage or rank. Same formula as private.score_of in supabase/migrations/20261102000300_ranking_score.sql.
 */
import type { SaveData } from './save';

export interface Mark { map: string; rank: string; time: number; damage: number; captainId: number; at: string }
export type Order = 'score' | 'time' | 'damage' | 'rank';

export const RANK_TIERS = ['C', 'B', 'A', 'S', 'X', 'Z'] as const;
/** points multiplier of each rank: an average X run beats the best C run, and Z is above everything */
export const RANK_MULT: Record<string, number> = { C: 1, B: 1.6, A: 2.4, S: 3.4, X: 4.8, Z: 7 };

/** (author) the arena counts too: its step on the path (data/maps.json `tier`), +5% per step, so the last arena is ×1.85.
 *  Same table as private.map_mult in supabase/migrations/20261110000200_new_arenas.sql (tests/leaderboard.test.ts checks it). */
export const MAP_TIER: Record<string, number> = { raimon: 1, ribera: 2, royal: 3, nara: 4, zeus: 5, alpino: 6, nevada: 7, claustro: 8, naniwa: 9, yokato: 10, marytimes: 11, fuji: 12, ehime: 13, alius: 14, ruinas: 15, barrio: 16, plazanieve: 17, torre: 18 };
export const mapMult = (map: string | undefined) => 1 + ((MAP_TIER[map ?? ''] ?? 1) - 1) * 0.05;

/** points = (seconds × 10 + √damage × 2) × rank multiplier × arena multiplier; the root keeps endless-mode damage from burying the rest */
export function scoreOf(m: Pick<Mark, 'rank' | 'time' | 'damage'> & { map?: string }) {
  return Math.round((Math.max(0, Math.floor(m.time)) * 10 + Math.sqrt(Math.max(0, m.damage)) * 2) * (RANK_MULT[m.rank] ?? 1) * mapMult(m.map));
}

export const boardKey = (map: string, rank: string) => `${map}|${rank}`;

const tier = (r: string) => RANK_TIERS.indexOf(r as never);
type Cmp = Pick<Mark, 'time' | 'damage'> & { rank?: string; map?: string };

/** > 0 when `a` goes above `b` in this order; points break every tie */
export function better(a: Cmp, b: Cmp, order: Order = 'score') {
  const pa = scoreOf({ ...a, rank: a.rank ?? 'C' }), pb = scoreOf({ ...b, rank: b.rank ?? 'C' });
  if (order === 'time') return a.time - b.time || a.damage - b.damage;
  if (order === 'damage') return a.damage - b.damage || a.time - b.time;
  if (order === 'rank') return tier(a.rank ?? 'C') - tier(b.rank ?? 'C') || pa - pb;
  return pa - pb || a.time - b.time || a.damage - b.damage;
}

/** Keeps the best mark (by points) of each board on this device. A run id is remembered so a reload can't count it twice. */
export function recordBest(save: SaveData, runId: string, m: Mark): boolean {
  save.bests ??= {};
  save.seenRuns ??= [];
  if (save.seenRuns.includes(runId)) return false;
  save.seenRuns = [runId, ...save.seenRuns].slice(0, 60);
  const k = boardKey(m.map, m.rank);
  const cur = save.bests[k];
  if (cur && better(m, cur) <= 0) return false;
  save.bests[k] = m;
  return true;
}

/** Personal bests filtered like the online board; each entry gets its position and points. */
export function localBoard(save: SaveData, map: string | null, rank: string | null, order: Order) {
  return Object.values(save.bests ?? {}).filter((m) => (!map || m.map === map) && (!rank || m.rank === rank))
    .sort((a, b) => better(b, a, order)).map((m, i) => ({ ...m, pos: i + 1, score: scoreOf(m) }));
}

/** Position of `mine` inside an ordered list of marks, 1-based; length + 1 when it is last. */
export function positionOf(list: Cmp[], mine: Cmp, order: Order = 'score') {
  return list.filter((m) => better(m, mine, order) > 0).length + 1;
}
