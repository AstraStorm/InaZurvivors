/**
 * On-screen level of a technique, separate from the internal 1-10 level. Every technique except talents shows how far it
 * has grown, in the style of its saga: «+X» for the original games (growth byte 101/103 of command.dat), «Lv X» for GO and
 * Chrono Stone (and growth 102), «G X» for Galaxy. The evolution ribbon is kept for the big steps (milestones), so not
 * every level-up is announced as an evolution. `OVERRIDES` can change one technique by id.
 */
export type EvolutionStyle = 'plus' | 'nivel' | 'grado' | 'ninguna';
export interface EvolutionFamily { id: EvolutionStyle; label: (level: number) => string; milestones: number[] }

export const FAMILIES: Record<EvolutionStyle, EvolutionFamily> = {
  plus: { id: 'plus', label: (lv) => (lv > 1 ? `+${lv - 1}` : ''), milestones: [4, 7, 10] },
  nivel: { id: 'nivel', label: (lv) => `Lv ${lv}`, milestones: [4, 7, 10] },
  grado: { id: 'grado', label: (lv) => `G${Math.ceil(lv / 2)}`, milestones: [3, 5, 7, 9] },
  ninguna: { id: 'ninguna', label: () => '', milestones: [] },
};

const BY_GROWTH: Record<number, EvolutionStyle> = { 101: 'plus', 102: 'nivel', 103: 'plus' };
export const OVERRIDES: Record<number, EvolutionStyle> = {};

type Tech = { id: number; growth?: number | null; type?: string; source?: string };

export function familyOf(t: Tech): EvolutionFamily {
  if (t.type === 'talento') return FAMILIES.ninguna;
  const style = OVERRIDES[t.id] ?? BY_GROWTH[t.growth ?? 0]
    ?? (/wiki, [^)]*(GX|Galaxy)/.test(t.source ?? '') ? 'grado' : /wiki, [^)]*(GO|CS|Chrono)/.test(t.source ?? '') ? 'nivel' : 'plus');
  return FAMILIES[style];
}

/** Suffix shown for a level ('' for a talent, or a «+» technique still at its base level). */
export function evolutionLabel(t: Tech, level: number): string {
  return familyOf(t).label(Math.max(1, level));
}

/** The label reached by going from `level` to `level + 1` when that is one of the family's big steps, else null. */
export function evolvesAt(t: Tech, level: number): string | null {
  const f = familyOf(t);
  return f.milestones.includes(level + 1) ? f.label(level + 1) : null;
}
