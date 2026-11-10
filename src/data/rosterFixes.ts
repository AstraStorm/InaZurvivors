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
  /** 1.83: lowest value of a stat (training.ts baseStats), whatever the rarity band gives */
  statFloor?: Partial<Record<string, number>>;
  /** the footballer's corrected name (a typo in the generated data); `name` stays the one in the data */
  nombre?: string;
}

export const ROSTER_FIXES: Record<number, RosterFix> = {
  // Fix 1.53 (author): La Tierra is not Mark's own technique (only the combined one with Axel and Shawn); he gets Puño de
  // Furia in its place, usable in a run from level 5
  1: { name: 'Mark Evans', cambiar: { 'La Tierra': 'Puño de Furia' }, nivel: { 'Puño de Furia': 30 } },
  // 1.83 (author): Nae of Hakuren, the third of the Ventisca triple, goes up to Épico with speed 95
  100417: { name: 'Shiratoya Nae', rarity: 'epico', statFloor: { speed: 95 } },
  // 1.88 (author): Austin's Remate del tigre from level 1; Gran lobo is a combined technique now, its owners get a talent
  101719: { name: 'Austin Hobbes', nivel: { 'Remate del tigre': 1 } },
  101357: { name: 'Dilshod Sobirov', cambiar: { 'Gran lobo': 'Ataque+' } },
  101524: { name: 'Fubuki Yukio', cambiar: { 'Gran lobo': 'Ataque+' } },
  // author: Petronio (his name had a typo) has no Último recurso D of his own any more — the Dragón is a combined technique
  // that needs a Último recurso in the run; Fuerza de tiro takes its place
  101595: { name: 'Petrionio Patti', nombre: 'Petronio Patti', cambiar: { 'Último recurso D': 'Fuerza de tiro' } },
  // author: adult Mark goes by his English name
  100234: { name: 'Endou Mamoru', nombre: 'Mark Evans Adulto' },
};

/** Applies ROSTER_FIXES in place; returns the problems found (unknown id, name mismatch, technique not found). */
export function applyRosterFixes(m: Manifest, fixes: Record<number, RosterFix> = ROSTER_FIXES): string[] {
  const problems: string[] = [];
  const byId = new Map(m.roster.map((p) => [p.id, p]));
  const techByName = (n: string) => m.roster.flatMap((p) => p.techniques).find((t) => t.name === n);
  for (const [key, fix] of Object.entries(fixes)) {
    const p = byId.get(Number(key));
    if (!p || p.name !== fix.name) { problems.push(`${key}: no es ${fix.name}`); continue; }
    if (fix.nombre) p.name = fix.nombre;
    if (fix.rarity) p.rarity = fix.rarity;
    if (fix.element) p.element = fix.element;
    if (fix.position) p.position = fix.position;
    if (fix.statFloor) p.statFloor = { ...fix.statFloor };
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
