/**
 * Difficulty ranks C-B-A-S-X. Each rank changes the pace and makeup of the waves, elite rivals, pitch hazards and how
 * often the boss uses its patterns, not only enemy health. Every hazard is telegraphed before it hits, so X stays
 * hard but fair. All numbers are balance values for InaZurvivors, tuned here.
 */
import type { Rank } from './save';
import { tr } from '../i18n/i18n';

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

export const RANK_ORDER: Rank[] = ['C', 'B', 'A', 'S', 'X', 'Z'];

/** (author) Rango Z opens with the Tuesday update, at 12:00 Madrid (the server's clock decides; submit_score checks it too) */
export const RANK_Z_OPENS = '2026-11-10T12:00:00+01:00';
const DAY_MS = 86_400_000;
export const rankZOpen = (now: number | Date) => +now >= Date.parse(RANK_Z_OPENS);
export const rankZLeftMs = (now: number | Date) => Math.max(0, Date.parse(RANK_Z_OPENS) - +now);
/** whole days until it opens (1 on its eve, 0 once open) */
export const rankZDaysLeft = (now: number | Date) => Math.max(0, Math.ceil(rankZLeftMs(now) / DAY_MS));

export const RANKS: Record<Rank, RankDef> = {
  C: { id: 'C', label: tr('Rango C'), blurb: tr('Para aprender: accesible, pero hay que moverse.'), hp: 0.9, damage: 0.85, speed: 0.96, spawnInterval: 1.05, burst: 0,
    elite: 0.015, runner: 0.06, shooter: 0.03, flanker: 0.03, bomber: 0, tank: 0.01, surroundEvery: 150, hazardEvery: 24, bossTempo: 1.25, extraMinibosses: 0, reward: 1, firstClearTokens: 5 },
  B: { id: 'B', label: tr('Rango B'), blurb: tr('Dificultad normal: más rivales y algún élite.'), hp: 1.15, damage: 1.1, speed: 1.04, spawnInterval: 0.9, burst: 0,
    elite: 0.05, runner: 0.1, shooter: 0.06, flanker: 0.06, bomber: 0.03, tank: 0.03, surroundEvery: 110, hazardEvery: 16, bossTempo: 1, extraMinibosses: 0, reward: 1.2, firstClearTokens: 8 },
  A: { id: 'A', label: tr('Rango A'), blurb: tr('Más presión: balones que caen del cielo y jefes más agresivos.'), hp: 1.45, damage: 1.35, speed: 1.1, spawnInterval: 0.78, burst: 1,
    elite: 0.09, runner: 0.14, shooter: 0.09, flanker: 0.09, bomber: 0.05, tank: 0.05, surroundEvery: 85, hazardEvery: 11, bossTempo: 0.82, extraMinibosses: 1, reward: 1.45, firstClearTokens: 12 },
  S: { id: 'S', label: tr('Rango S'), blurb: tr('Difícil: oleadas densas, muchos élites y peligros frecuentes.'), hp: 1.85, damage: 1.6, speed: 1.16, spawnInterval: 0.68, burst: 2,
    elite: 0.14, runner: 0.18, shooter: 0.12, flanker: 0.12, bomber: 0.07, tank: 0.07, surroundEvery: 65, hazardEvery: 8, bossTempo: 0.68, extraMinibosses: 1, reward: 1.75, firstClearTokens: 18 },
  X: { id: 'X', label: tr('Rango X'), blurb: tr('Extremo: para equipos al máximo. Todo avisa antes de golpear.'), hp: 2.4, damage: 1.9, speed: 1.22, spawnInterval: 0.58, burst: 3,
    elite: 0.2, runner: 0.22, shooter: 0.15, flanker: 0.15, bomber: 0.09, tank: 0.09, surroundEvery: 50, hazardEvery: 5.5, bossTempo: 0.52, extraMinibosses: 2, reward: 2.2, firstClearTokens: 30 },
  // (author) Rango Z: far beyond X, for the very best teams; it pays the most and counts the most on the ranking
  Z: { id: 'Z', label: tr('Rango Z'), blurb: tr('Imposible: más allá del X. Solo para los mejores equipos del mundo.'), hp: 3.3, damage: 2.4, speed: 1.3, spawnInterval: 0.48, burst: 4,
    elite: 0.3, runner: 0.26, shooter: 0.19, flanker: 0.19, bomber: 0.12, tank: 0.12, surroundEvery: 38, hazardEvery: 3.8, bossTempo: 0.4, extraMinibosses: 3, reward: 3.2, firstClearTokens: 60 },
};

/**
 * Wave rhythm in every rank: a calm start that still has rivals within 2 s, then minute-long cycles of build-up,
 * a short pressure wave and a breather. Returns a multiplier on the spawn rate.
 */
export function waveIntensity(t: number): { rate: number; phase: 'inicio' | 'normal' | 'presion' | 'respiro' } {
  if (t < 30) return { rate: 1.15, phase: 'inicio' }; // the first 30 s are busy on purpose: early levels, early choices
  const c = (t - 30) % 60;
  // Fix 1.12: the waves grow with the run (×1.5 the first one, ×2.4 from the fourth minute) instead of starting at the top
  if (c >= 38 && c < 52) return { rate: 1.5 + 0.9 * Math.min(1, Math.max(0, t - 60) / 180), phase: 'presion' };
  if (c >= 52) return { rate: 0.45, phase: 'respiro' };
  return { rate: 1, phase: 'normal' };
}

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const smooth = (a: number, b: number, x: number) => { const k = clamp01((x - a) / (b - a)); return k * k * (3 - 2 * k); };

/**
 * Fix 1.12: rivals per spawn as a continuous value (it used to jump in whole steps at fixed moments of the run). The
 * fraction is the chance of one more, `roll` in 0..1.
 */
export function burstSize(frac: number, fullTeam: boolean, rankBurst: number, roll: number) {
  const v = 1 + 2.8 * frac ** 2 + (fullTeam ? 1 : 0) + rankBurst * smooth(0.2, 0.6, frac);
  return Math.floor(v) + (roll < v - Math.floor(v) ? 1 : 0);
}

/**
 * Fix 1.13: the last stretch of the run before the boss. From 70% of the time the rivals come faster and hit harder,
 * growing smoothly to the top at the end of the clock. `frac` is the share of the run played.
 */
export const FINAL_STRETCH_FROM = 0.62; // Fix 1.24: starts a little earlier, so the harder end climbs gradually
export function finalStretch(frac: number) {
  const k = smooth(FINAL_STRETCH_FROM, 1, frac);
  return { rate: 1 + 0.45 * k, hp: 1 + 0.5 * k, damage: 1 + 0.4 * k }; // Fix 1.24: tougher and harder-hitting final stretch
}

/** Fix 1.12: how far the special rivals have arrived: none for 20 s, all of them by 2:30 (it was all by 1:00). */
export const variantRamp = (t: number) => smooth(20, 150, t);

export const rankDef = (r: Rank | undefined) => RANKS[r ?? 'C'] ?? RANKS.C;

/** Ranks cleared per arena, kept sorted. */
export function recordRankClear(cleared: Record<string, Rank[]>, mapId: string, rank: Rank): boolean {
  const list = cleared[mapId] ?? [];
  if (list.includes(rank)) return false;
  cleared[mapId] = [...list, rank].sort((a, b) => RANK_ORDER.indexOf(a) - RANK_ORDER.indexOf(b));
  return true;
}

/** Fix 1.23: experience for the next level: quadratic up to level 40 (fewer level-ups late in a run), linear after it. */
export function xpForLevel(level: number) {
  const q = Math.min(level, 40);
  return Math.round(5 + level * 6 + q * q * 0.25 + Math.max(0, level - 40) * 20);
}
