/**
 * Permanent technique growth, separate from the 1-10 level earned inside a run: using a technique raises its mastery for
 * good. Resonance rewards squads whose active techniques share an element.
 */
import type { SaveData } from './save';

export const MASTERY_USES = [30, 120, 300, 700, 1500];
export const MASTERY_BONUS = 0.03;

export function masteryLevel(uses: number) {
  return MASTERY_USES.filter((u) => uses >= u).length;
}

/** Progress within the current mastery level, 0..1 (1 when maxed). */
export function masteryProgress(uses: number) {
  const lv = masteryLevel(uses);
  if (lv >= MASTERY_USES.length) return 1;
  const from = lv ? MASTERY_USES[lv - 1] : 0;
  return (uses - from) / (MASTERY_USES[lv] - from);
}

export const masteryDamage = (uses: number) => 1 + masteryLevel(uses) * MASTERY_BONUS;

export function recordMastery(s: SaveData, uses: Record<string, number>) {
  for (const [id, n] of Object.entries(uses)) s.mastery[id] = (s.mastery[id] ?? 0) + n;
}

/** Damage bonus for a technique whose element is shared by this many active techniques in the squad. */
export const resonanceBonus = (count: number) => (count >= 5 ? 0.15 : count >= 3 ? 0.08 : 0);
