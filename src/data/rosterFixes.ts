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
}

export const ROSTER_FIXES: Record<number, RosterFix> = {
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
    for (const n of fix.poner ?? []) {
      if (p.techniques.some((t) => t.name === n)) continue;
      const t = techByName(n);
      if (t) p.techniques.unshift({ ...t, unlockLevel: 1 }); else problems.push(`${fix.name}: técnica ${n} no existe`);
    }
  }
  return problems;
}
