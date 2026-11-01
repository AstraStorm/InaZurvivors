/**
 * Endless survival after the boss: five phases that end up beating any build through the fight itself. Nothing here
 * kills directly and every attack keeps its warning; health and damage just keep growing, faster after minute 15.
 * Rival count is limited by the scene (MAX_ENEMIES), so the late game gets tougher, not heavier on the frame rate.
 */
export interface EndlessPhase {
  id: number; name: string; from: number;
  /** added to the elite chance of each rival */
  elite: number;
  /** seconds between telegraphed falling balls; also adds to the rank's own hazards */
  hazardEvery: number;
  /** seconds between surround waves */
  surroundEvery: number;
  minibossEvery: number;
  bossEvery: number;
}

export const ENDLESS_PHASES: EndlessPhase[] = [
  { id: 0, name: 'Prórroga', from: 0, elite: 0.05, hazardEvery: 10, surroundEvery: 70, minibossEvery: 70, bossEvery: 150 },
  { id: 1, name: 'Asedio', from: 3, elite: 0.1, hazardEvery: 7, surroundEvery: 50, minibossEvery: 50, bossEvery: 120 },
  { id: 2, name: 'Caos', from: 6, elite: 0.16, hazardEvery: 5, surroundEvery: 38, minibossEvery: 32, bossEvery: 100 },
  { id: 3, name: 'Tormenta', from: 10, elite: 0.24, hazardEvery: 3.6, surroundEvery: 28, minibossEvery: 24, bossEvery: 75 },
  { id: 4, name: 'INFIERNO', from: 15, elite: 0.34, hazardEvery: 2.6, surroundEvery: 20, minibossEvery: 16, bossEvery: 55 },
];

export const endlessPhase = (min: number) => [...ENDLESS_PHASES].reverse().find((p) => min >= p.from) ?? ENDLESS_PHASES[0];

/** Health, damage and spawn multipliers `min` minutes after the boss. Past 15 they compound without limit. */
export function endlessScale(min: number) {
  const m = Math.max(0, min), base = Math.min(m, 15), over = Math.max(0, m - 15);
  return {
    hp: (1 + 0.32 * base + 0.03 * base * base) * 1.16 ** over,
    damage: (1 + 0.16 * base + 0.014 * base * base) * 1.12 ** over,
    spawn: Math.min(3.2, 1 + 0.15 * m),
    speed: Math.min(1.45, 1 + 0.02 * m),
  };
}

/** Coins of minute-reward number `tick` (1, 2, ...); a token every second tick. */
export const endlessCoins = (tick: number) => 30 + Math.min(tick, 30) * 8;
/** A minute pays only with real play: walking and beating rivals, so leaving the game idle earns nothing. */
export const endlessActive = (moved: number, kills: number) => moved >= 400 && kills >= 5;
