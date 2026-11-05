/**
 * On-screen level of a technique, separate from the internal 1-10 level.
 *
 * 1.81 (author): every 2 level-ups the technique climbs one step, and the step is shown with its logo
 * (D:/Sprites Inazuma/Mejoras, copied by sync-assets to generated/mejoras). Level 1 has no logo; 2-3 is the 1st step,
 * 4-5 the 2nd, 6-7 the 3rd, 8-9 the 4th and 10 the 5th. The ladder depends on the technique's power:
 *   up to 70   «+»: +1 +2 +3 +4 +5
 *   71 to 100  «N»: N2 N3 N4 S ∞
 *   above 100  «G»: G2 G3 G4 G5 GO
 * Talents show nothing. Each new step is announced as an evolution.
 */
export type EvolutionStyle = 'plus' | 'n' | 'g' | 'ninguna';
export interface EvolutionFamily { id: EvolutionStyle; steps: string[] }

/** labels of the 5 steps; also the keys of manifest.evoIcons */
export const FAMILIES: Record<EvolutionStyle, EvolutionFamily> = {
  plus: { id: 'plus', steps: ['+1', '+2', '+3', '+4', '+5'] },
  n: { id: 'n', steps: ['N2', 'N3', 'N4', 'S', '∞'] },
  g: { id: 'g', steps: ['G2', 'G3', 'G4', 'G5', 'GO'] },
  ninguna: { id: 'ninguna', steps: [] },
};

/** the step a level is on: 0 at level 1, then one more every 2 levels (2-3 → 1 ... 10 → 5) */
export const stepOf = (level: number) => Math.max(0, Math.min(5, Math.floor(Math.max(1, level) / 2)));

type Tech = { id: number; type?: string; power?: number | null };

export function familyOf(t: Tech): EvolutionFamily {
  if (t.type === 'talento') return FAMILIES.ninguna;
  const p = t.power ?? 0;
  return FAMILIES[p <= 70 ? 'plus' : p <= 100 ? 'n' : 'g'];
}

/** Label shown for a level ('' for a talent, or a technique still at level 1). */
export function evolutionLabel(t: Tech, level: number): string {
  const s = stepOf(level);
  return s ? familyOf(t).steps[s - 1] ?? '' : '';
}

/** The label reached by going from `level` to `level + 1` when that climbs a step, else null. */
export function evolvesAt(t: Tech, level: number): string | null {
  if (stepOf(level + 1) === stepOf(level)) return null;
  return evolutionLabel(t, level + 1) || null;
}
