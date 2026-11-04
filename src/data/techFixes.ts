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

/**
 * 1.8 (author): teams a footballer also plays for, put first (his machine is the saga of his earliest story team):
 * Aiden Froste joins Alpino, his brother Shawn's team.
 */
export const TEAM_ADD: Record<number, { name: string; teams: string[] }> = {
  100797: { name: 'Aiden Froste', teams: ['Alpino'] },
};

/** Sets the fixed elements and the extra teams; returns how many techniques changed. */
export function applyTechFixes(m: Manifest, fixes: Record<string, string> = TECH_ELEMENT, teams: typeof TEAM_ADD = TEAM_ADD) {
  for (const p of m.roster) { const t = teams[p.id]; if (t && t.name === p.name) p.teams = [...new Set([...t.teams, ...p.teams])]; }
  let changed = 0;
  for (const p of m.roster) for (const t of [...p.techniques, ...(p.heroTech ? [p.heroTech] : [])]) {
    const el = fixes[t.name];
    if (el && t.element !== el) { t.element = el; changed++; }
  }
  return changed;
}
