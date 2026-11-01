/**
 * Hall of fame: every victory with the squad that won it (captain first), the arena, rank, time, damage and endless
 * survival. Kept on the save (newest first, capped), never counted twice for the same run.
 */
import type { SaveData } from './save';

export interface Triumph { runId: string; at: string; map: string; rank: string; team: number[]; time: number; kills: number; damage: number; endless: number }

export const HALL_SIZE = 200;

export function recordTriumph(save: SaveData, t: Triumph): boolean {
  save.hall ??= [];
  if (save.hall.some((x) => x.runId === t.runId)) return false;
  t = { ...t, team: [...new Set(t.team)] };
  save.hall = [t, ...save.hall].slice(0, HALL_SIZE);
  return true;
}

/** Players by victories they took part in (as captain or on the pitch), most first. */
export function championsTable(save: SaveData) {
  const wins = new Map<number, { id: number; wins: number; captain: number; best: string }>();
  for (const t of save.hall ?? []) {
    t.team.forEach((id, i) => {
      const w = wins.get(id) ?? { id, wins: 0, captain: 0, best: 'C' };
      w.wins++;
      if (i === 0) w.captain++;
      if ('CBASX'.indexOf(t.rank) > 'CBASX'.indexOf(w.best)) w.best = t.rank;
      wins.set(id, w);
    });
  }
  return [...wins.values()].sort((a, b) => b.wins - a.wins || b.captain - a.captain || a.id - b.id);
}
