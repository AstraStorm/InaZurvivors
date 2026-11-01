/**
 * Ranking rules shared by the online board and this device's personal bests: order by time survived, ties by damage
 * (or the other way round), one best mark per board (arena + rank).
 */
import type { SaveData } from './save';

export interface Mark { map: string; rank: string; time: number; damage: number; captainId: number; at: string }
export type Order = 'time' | 'damage';

export const boardKey = (map: string, rank: string) => `${map}|${rank}`;

export function better(a: Pick<Mark, 'time' | 'damage'>, b: Pick<Mark, 'time' | 'damage'>, order: Order = 'time') {
  return order === 'time' ? a.time - b.time || a.damage - b.damage : a.damage - b.damage || a.time - b.time;
}

/** Keeps the best mark of each board on this device. A run id is remembered so a reload can't count it twice. */
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

/** Personal bests filtered like the online board; each entry gets its position. */
export function localBoard(save: SaveData, map: string | null, rank: string | null, order: Order) {
  return Object.values(save.bests ?? {}).filter((m) => (!map || m.map === map) && (!rank || m.rank === rank))
    .sort((a, b) => better(b, a, order)).map((m, i) => ({ ...m, pos: i + 1 }));
}

/** Position of `mine` inside an ordered list of (time, damage) marks, 1-based; length + 1 when it is last. */
export function positionOf(list: Pick<Mark, 'time' | 'damage'>[], mine: Pick<Mark, 'time' | 'damage'>, order: Order = 'time') {
  return list.filter((m) => better(m, mine, order) > 0).length + 1;
}
