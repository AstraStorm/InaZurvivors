/**
 * pre-2.0 (author): Road to Fútbol Frontier — a gauntlet in the manner of an odyssey. Five footballers of Raimon or
 * Inazuma Japan (no Auras; the coach on the bench does count) play 3, 4 or 5 arenas in a row, one after another, up to
 * the final at the Zeus stadium. Losing a match ends the road. Clearing it pays by difficulty; the maximum one also
 * guarantees a Legendario or better (never an event footballer). 2.02 (author): 3 clears on the maximum difficulty give
 * Jaden Evans, then every 5 more a copy of him (it was one every 10). 2.3 (author): a copy every 3, like the first one.
 */
import type { RosterEntry } from '../data/manifest';
import type { Rank, SaveData } from './save';
import { addCopy } from './gacha';
import { tr } from '../i18n/i18n';

export type RoadDiff = 'facil' | 'normal' | 'maxima';
export interface RoadDiffDef { id: RoadDiff; label: string; rank: Rank; maps: string[]; coins: number; tokens: number; legendary: boolean }
export const ROAD_DIFFS: RoadDiffDef[] = [
  { id: 'facil', label: tr('Fácil'), rank: 'B', maps: ['raimon', 'royal', 'zeus'], coins: 1000, tokens: 20, legendary: false },
  { id: 'normal', label: 'Normal', rank: 'A', maps: ['raimon', 'ribera', 'royal', 'zeus'], coins: 2000, tokens: 40, legendary: false },
  { id: 'maxima', label: tr('Máxima'), rank: 'S', maps: ['raimon', 'ribera', 'royal', 'nara', 'zeus'], coins: 4000, tokens: 60, legendary: true },
];
export const ROAD_BY_ID = new Map(ROAD_DIFFS.map((d) => [d.id, d]));
export const ROAD_SQUAD = 5;
/** 1.91 (author: the arena's full length was too much): match 1 lasts 1 minute, match 2 two... up to 5 in the final */
export const roadMatchSec = (level: number) => (level + 1) * 60;
/** the teams of the road: the original Raimon and Inazuma Japan */
export const ROAD_TEAMS = new Set(['Raimon', 'First_Raimon', 'Raimon_Soccer_Club', 'Inazuma_Japan_A']);
export const roadEligible = (p: RosterEntry) => p.teams.some((t) => ROAD_TEAMS.has(t)) && !p.exclusive;
/** Jaden Evans: the reward of 3 clears on the maximum difficulty, then a copy every 3 more (2.3; every 5 in 2.02) */
export const JADEN_ID = 900100;
export const JADEN_FIRST = 3;
export const JADEN_EVERY = 3;
/** how many Jadens (him + copies) a number of clears on Máxima has earned */
export const jadensFor = (clears: number) => clears < JADEN_FIRST ? 0 : 1 + Math.floor((clears - JADEN_FIRST) / JADEN_EVERY);
/** clears left to the next Jaden and how far along the current stretch is (0..1) */
export function jadenProgress(clears: number) {
  if (clears < JADEN_FIRST) return { left: JADEN_FIRST - clears, frac: clears / JADEN_FIRST };
  const done = (clears - JADEN_FIRST) % JADEN_EVERY;
  return { left: JADEN_EVERY - done, frac: done / JADEN_EVERY };
}

export interface RoadSave { active?: { diff: RoadDiff; level: number; squad: number[] }; clears: Partial<Record<RoadDiff, number>> }
export const roadOf = (s: SaveData): RoadSave => (s.road ??= { clears: {} });

/** a cleared road: counts it and says whether this clear brings Jaden (the first time) or a copy of him */
export function clearRoad(s: SaveData, diff: RoadDiff): { jaden: 'new' | 'copy' | null; clears: number } {
  const r = roadOf(s);
  const clears = (r.clears[diff] ?? 0) + 1;
  r.clears[diff] = clears;
  delete r.active;
  const jaden = diff === 'maxima' && jadensFor(clears) > jadensFor(clears - 1) ? (s.owned[String(JADEN_ID)] ? 'copy' : 'new') : null;
  return { jaden, clears };
}

/**
 * 2.02 (author: «dale a los que hayan hecho más partidas los dupes necesarios»), once per save: whoever already had
 * clears on Máxima gets the Jadens the new rule gives for them and the old one (one every 10) did not. Returns how many.
 */
export function compensateJaden202(s: SaveData, jaden: Pick<RosterEntry, 'id' | 'rarity'> | undefined): number {
  if (s.jaden202 || !jaden) return 0;
  s.jaden202 = true;
  s.jaden3 = true; // jadensFor is already the 2.3 rule: nothing left for compensateJaden3
  const clears = s.road?.clears.maxima ?? 0;
  const owed = Math.max(0, jadensFor(clears) - Math.floor(clears / 10));
  for (let i = 0; i < owed; i++) addCopy(s, jaden);
  return owed;
}

/**
 * 2.3 (author: «haz que jaden sea 3 partidas siempre, para dupes 5 no, 3 tmb»), once per save: whoever was already
 * paid under the 2.02 rule (a copy every 5) gets the Jadens a copy every 3 gives for the same clears. Returns how many.
 */
export function compensateJaden3(s: SaveData, jaden: Pick<RosterEntry, 'id' | 'rarity'> | undefined): number {
  if (s.jaden3 || !jaden) return 0;
  s.jaden3 = true;
  const clears = s.road?.clears.maxima ?? 0;
  const every5 = clears < JADEN_FIRST ? 0 : 1 + Math.floor((clears - JADEN_FIRST) / 5);
  const owed = Math.max(0, jadensFor(clears) - every5);
  for (let i = 0; i < owed; i++) addCopy(s, jaden);
  return owed;
}
