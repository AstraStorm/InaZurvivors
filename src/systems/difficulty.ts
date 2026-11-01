/**
 * Difficulty ranks C-B-A-S-X. Each rank changes the pace and makeup of the waves, elite rivals, pitch hazards and how
 * often the boss uses its patterns, not only enemy health. Every hazard is telegraphed before it hits, so X stays
 * hard but fair. All numbers are balance values for InaZurvivors, tuned here.
 */
import type { Rank } from './save';

export interface RankDef {
  id: Rank;
  label: string;
  blurb: string;
  /** enemy health and contact damage */
  hp: number;
  damage: number;
  speed: number;
  /** multiplier on the time between spawns (lower = more rivals) */
  spawnInterval: number;
  /** extra rivals per spawn burst */
  burst: number;
  /** chance that a rival is an elite (tougher, faster, better drop) */
  elite: number;
  /** chance that a rival is a runner (fast, fragile) */
  runner: number;
  /** seconds between telegraphed falling-ball hazards; 0 = none */
  hazardEvery: number;
  /** boss pattern cooldown multiplier (lower = more attacks) */
  bossTempo: number;
  extraMinibosses: number;
  /** chance of the rivals with their own behaviour: shooters keep away and fire, flankers cut the player off, bombers
   *  explode after a warning, tanks soak up damage and push */
  shooter: number; flanker: number; bomber: number; tank: number;
  /** seconds between surround waves; 0 = none */
  surroundEvery: number;
  /** coins and tokens at the end of the run */
  reward: number;
  /** tokens for the first victory at this rank in an arena */
  firstClearTokens: number;
}

export const RANK_ORDER: Rank[] = ['C', 'B', 'A', 'S', 'X'];

export const RANKS: Record<Rank, RankDef> = {
  C: { id: 'C', label: 'Rango C', blurb: 'Para aprender: accesible, pero hay que moverse.', hp: 0.9, damage: 0.85, speed: 0.96, spawnInterval: 1.05, burst: 0,
    elite: 0.015, runner: 0.06, shooter: 0.03, flanker: 0.03, bomber: 0, tank: 0.01, surroundEvery: 150, hazardEvery: 24, bossTempo: 1.25, extraMinibosses: 0, reward: 1, firstClearTokens: 5 },
  B: { id: 'B', label: 'Rango B', blurb: 'Dificultad normal: más rivales y algún élite.', hp: 1.15, damage: 1.1, speed: 1.04, spawnInterval: 0.9, burst: 0,
    elite: 0.05, runner: 0.1, shooter: 0.06, flanker: 0.06, bomber: 0.03, tank: 0.03, surroundEvery: 110, hazardEvery: 16, bossTempo: 1, extraMinibosses: 0, reward: 1.25, firstClearTokens: 8 },
  A: { id: 'A', label: 'Rango A', blurb: 'Más presión: balones que caen del cielo y jefes más agresivos.', hp: 1.45, damage: 1.35, speed: 1.1, spawnInterval: 0.78, burst: 1,
    elite: 0.09, runner: 0.14, shooter: 0.09, flanker: 0.09, bomber: 0.05, tank: 0.05, surroundEvery: 85, hazardEvery: 11, bossTempo: 0.82, extraMinibosses: 1, reward: 1.6, firstClearTokens: 12 },
  S: { id: 'S', label: 'Rango S', blurb: 'Difícil: oleadas densas, muchos élites y peligros frecuentes.', hp: 1.85, damage: 1.6, speed: 1.16, spawnInterval: 0.68, burst: 2,
    elite: 0.14, runner: 0.18, shooter: 0.12, flanker: 0.12, bomber: 0.07, tank: 0.07, surroundEvery: 65, hazardEvery: 8, bossTempo: 0.68, extraMinibosses: 1, reward: 2.1, firstClearTokens: 18 },
  X: { id: 'X', label: 'Rango X', blurb: 'Extremo: para equipos al máximo. Todo avisa antes de golpear.', hp: 2.4, damage: 1.9, speed: 1.22, spawnInterval: 0.58, burst: 3,
    elite: 0.2, runner: 0.22, shooter: 0.15, flanker: 0.15, bomber: 0.09, tank: 0.09, surroundEvery: 50, hazardEvery: 5.5, bossTempo: 0.52, extraMinibosses: 2, reward: 3, firstClearTokens: 30 },
};

/**
 * Wave rhythm in every rank: a calm start that still has rivals within 2 s, then minute-long cycles of build-up,
 * a short pressure wave and a breather. Returns a multiplier on the spawn rate.
 */
export function waveIntensity(t: number): { rate: number; phase: 'inicio' | 'normal' | 'presion' | 'respiro' } {
  if (t < 30) return { rate: 1.35, phase: 'inicio' }; // the first 30 s are busy on purpose: early levels, early choices
  const c = (t - 30) % 60;
  if (c >= 38 && c < 52) return { rate: 2.4, phase: 'presion' };
  if (c >= 52) return { rate: 0.45, phase: 'respiro' };
  return { rate: 1, phase: 'normal' };
}

export const rankDef = (r: Rank | undefined) => RANKS[r ?? 'C'] ?? RANKS.C;

/** Ranks cleared per arena, kept sorted. */
export function recordRankClear(cleared: Record<string, Rank[]>, mapId: string, rank: Rank): boolean {
  const list = cleared[mapId] ?? [];
  if (list.includes(rank)) return false;
  cleared[mapId] = [...list, rank].sort((a, b) => RANK_ORDER.indexOf(a) - RANK_ORDER.indexOf(b));
  return true;
}
