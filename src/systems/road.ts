/**
 * pre-2.0 (author): Road to Fútbol Frontier — a gauntlet in the manner of an odyssey. Five footballers of Raimon or
 * Inazuma Japan (no Auras; the coach on the bench does count) play 3, 4 or 5 arenas in a row, one after another, up to
 * the final at the Zeus stadium. Losing a match ends the road. Clearing it pays by difficulty; the maximum one also
 * guarantees a Legendario or better (never an event footballer). Every 10 clears on the maximum difficulty give
 * Jaden Evans (the first time) and then a copy of him.
 */
import type { RosterEntry } from '../data/manifest';
import type { Rank, SaveData } from './save';

export type RoadDiff = 'facil' | 'normal' | 'maxima';
export interface RoadDiffDef { id: RoadDiff; label: string; rank: Rank; maps: string[]; coins: number; tokens: number; legendary: boolean }
export const ROAD_DIFFS: RoadDiffDef[] = [
  { id: 'facil', label: 'Fácil', rank: 'B', maps: ['raimon', 'royal', 'zeus'], coins: 1000, tokens: 20, legendary: false },
  { id: 'normal', label: 'Normal', rank: 'A', maps: ['raimon', 'ribera', 'royal', 'zeus'], coins: 2000, tokens: 40, legendary: false },
  { id: 'maxima', label: 'Máxima', rank: 'S', maps: ['raimon', 'ribera', 'royal', 'nara', 'zeus'], coins: 4000, tokens: 60, legendary: true },
];
export const ROAD_BY_ID = new Map(ROAD_DIFFS.map((d) => [d.id, d]));
export const ROAD_SQUAD = 5;
/** the teams of the road: the original Raimon and Inazuma Japan */
export const ROAD_TEAMS = new Set(['Raimon', 'First_Raimon', 'Raimon_Soccer_Club', 'Inazuma_Japan_A']);
export const roadEligible = (p: RosterEntry) => p.teams.some((t) => ROAD_TEAMS.has(t)) && !p.exclusive;
/** Jaden Evans: the reward of every 10 clears on the maximum difficulty */
export const JADEN_ID = 900100;
export const JADEN_EVERY = 10;

export interface RoadSave { active?: { diff: RoadDiff; level: number; squad: number[] }; clears: Partial<Record<RoadDiff, number>> }
export const roadOf = (s: SaveData): RoadSave => (s.road ??= { clears: {} });

/** a cleared road: counts it and says whether this clear brings Jaden (the first time) or a copy of him */
export function clearRoad(s: SaveData, diff: RoadDiff): { jaden: 'new' | 'copy' | null; clears: number } {
  const r = roadOf(s);
  const clears = (r.clears[diff] ?? 0) + 1;
  r.clears[diff] = clears;
  delete r.active;
  const jaden = diff === 'maxima' && clears % JADEN_EVERY === 0 ? (s.owned[String(JADEN_ID)] ? 'copy' : 'new') : null;
  return { jaden, clears };
}
