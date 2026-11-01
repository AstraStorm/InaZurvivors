/**
 * On-screen evolution names, separate from the internal 1-10 level. The family comes from the technique's growth byte
 * (command.dat offset 16: 101, 102, 103). Which suffix each code uses is a design table, not read from the ROM; thresholds
 * are configurable per family, and `OVERRIDES` can change one technique by id.
 */
export interface EvolutionFamily { id: string; stages: [level: number, label: string][] }

export const FAMILIES: Record<string, EvolutionFamily> = {
  plus: { id: 'plus', stages: [[4, '+1'], [7, '+2'], [10, '+3']] },
  velocidad: { id: 'velocidad', stages: [[4, 'V2'], [7, 'V3'], [10, 'V4']] },
  grado: { id: 'grado', stages: [[3, 'G2'], [5, 'G3'], [8, 'G4'], [10, 'G5']] },
  ninguna: { id: 'ninguna', stages: [] },
};

const BY_GROWTH: Record<number, string> = { 101: 'plus', 102: 'velocidad', 103: 'grado' };
export const OVERRIDES: Record<number, string> = {};

export function familyOf(t: { id: number; growth?: number | null }): EvolutionFamily {
  return FAMILIES[OVERRIDES[t.id] ?? BY_GROWTH[t.growth ?? 0] ?? 'ninguna'];
}

/** Suffix shown for a level ('' while still the base technique). */
export function evolutionLabel(t: { id: number; growth?: number | null }, level: number): string {
  let label = '';
  for (const [at, l] of familyOf(t).stages) if (level >= at) label = l;
  return label;
}

/** Stage reached by going from `level` to `level + 1`, if any. */
export function evolvesAt(t: { id: number; growth?: number | null }, level: number): string | null {
  const a = evolutionLabel(t, level), b = evolutionLabel(t, level + 1);
  return a !== b ? b : null;
}
