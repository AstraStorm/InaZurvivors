/**
 * 1.76 (author): a technique's element fixed by its name, for everyone who has it (the GO tables leave many without one
 * and the game gave them the footballer's element). Applied at load, right after rosterFixes.ts.
 */
import type { Manifest } from './manifest';

export const TECH_ELEMENT: Record<string, string> = {
  'Lanza de Odín': 'Bosque',
  'Espada real': 'Montaña',
  'El ojo del huracán': 'Bosque',
};

/** Sets the fixed elements; returns how many techniques changed. */
export function applyTechFixes(m: Manifest, fixes: Record<string, string> = TECH_ELEMENT) {
  let changed = 0;
  for (const p of m.roster) for (const t of [...p.techniques, ...(p.heroTech ? [p.heroTech] : [])]) {
    const el = fixes[t.name];
    if (el && t.element !== el) { t.element = el; changed++; }
  }
  return changed;
}
