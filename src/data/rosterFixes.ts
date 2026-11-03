/**
 * Quick corrections to footballers, applied over generated/manifest.json when the game loads.
 * A rarity, element, position or technique fix only needs a build and a push of the public repo:
 * no assets:sync and no resources repackaging. Fold these into the data (data/*.json) now and then.
 * Keys are roster ids; each entry also names the footballer so a wrong id is caught by the tests.
 */
import type { Manifest, Rarity, RosterEntry } from './manifest';

export interface RosterFix {
  name: string;
  rarity?: Rarity;
  element?: string;
  position?: RosterEntry['position'];
  /** technique names to drop from the list */
  quitar?: string[];
  /** technique names to add (copied from any footballer who has it), unlocked at level 1 */
  poner?: string[];
  /** Fix 1.53: technique swapped for another in the same place of the list (saved choices and purchases keep pointing at it) */
  cambiar?: Record<string, string>;
  /** unlockLevel by technique name (the run level it appears at is unlockLevel / 6; 100 = only in the shop) */
  nivel?: Record<string, number>;
}

export const ROSTER_FIXES: Record<number, RosterFix> = {
  // Fix 1.53 (author): La Tierra is not Mark's own technique (only the combined one with Axel and Shawn); he gets Puño de
  // Furia in its place, usable in a run from level 5
  1: { name: 'Mark Evans', cambiar: { 'La Tierra': 'Puño de Furia' }, nivel: { 'Puño de Furia': 30 } },
};

/** Applies ROSTER_FIXES in place; returns the problems found (unknown id, name mismatch, technique not found). */
export function applyRosterFixes(m: Manifest, fixes: Record<number, RosterFix> = ROSTER_FIXES): string[] {
  const problems: string[] = [];
  const byId = new Map(m.roster.map((p) => [p.id, p]));
  const techByName = (n: string) => m.roster.flatMap((p) => p.techniques).find((t) => t.name === n);
  for (const [key, fix] of Object.entries(fixes)) {
    const p = byId.get(Number(key));
    if (!p || p.name !== fix.name) { problems.push(`${key}: no es ${fix.name}`); continue; }
    if (fix.rarity) p.rarity = fix.rarity;
    if (fix.element) p.element = fix.element;
    if (fix.position) p.position = fix.position;
    if (fix.quitar?.length) p.techniques = p.techniques.filter((t) => !fix.quitar!.includes(t.name));
    for (const [from, to] of Object.entries(fix.cambiar ?? {})) {
      const i = p.techniques.findIndex((t) => t.name === from), t = techByName(to);
      if (i < 0 || !t) problems.push(`${fix.name}: no se puede cambiar ${from} por ${to}`); else p.techniques[i] = { ...t };
    }
    for (const [n, lv] of Object.entries(fix.nivel ?? {})) {
      const i = p.techniques.findIndex((t) => t.name === n);
      if (i < 0) problems.push(`${fix.name}: no tiene ${n}`); else p.techniques[i] = { ...p.techniques[i], unlockLevel: lv };
    }
    for (const n of fix.poner ?? []) {
      if (p.techniques.some((t) => t.name === n)) continue;
      const t = techByName(n);
      if (t) p.techniques.unshift({ ...t, unlockLevel: 1 }); else problems.push(`${fix.name}: técnica ${n} no existe`);
    }
  }
  return problems;
}
