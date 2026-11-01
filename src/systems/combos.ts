/**
 * Combined supertechniques. Only combinations whose participants were checked against a documented source are listed;
 * the unlock conditions (technique levels) are InaZurvivors design, not canon. Names and power come from the IE2 Spanish
 * ROM table (data/extracted/ie2_gamedata.json): Fuego cruzado 298/311, Tornado dragón 204, Ruptura relámpago 207.
 *
 * Activation: a SPECIAL slot, separate from each player's technique slots. Once learned (a level-up card that appears
 * when the conditions are met) it fires on its own cooldown while every participant is on the pitch, and never
 * replaces anyone's own techniques. It can be upgraded with later cards up to COMBO_MAX_LEVEL.
 */
import type { RosterEntry, Technique } from '../data/manifest';
import type { TeamMemberState } from './cards';

export const COMBO_MAX_LEVEL = 5;

export interface ComboDef {
  id: string;
  name: string;
  /** original and English names, for reference */
  jp: string;
  en: string;
  element: string;
  power: number;
  /** each participant by roster name, with the technique and run level they need */
  needs: { player: string; tech?: string; level: number }[];
  cooldownMs: number;
  /** what the special slot does when it fires */
  effect: 'tiro-doble' | 'tiro-dragon' | 'tiro-rayo';
  source: string;
}

export const COMBOS: ComboDef[] = [
  {
    id: 'fuego-cruzado', name: 'Fuego cruzado', jp: 'クロスファイア', en: 'Crossfire', element: 'Fuego', power: 120,
    needs: [{ player: 'Axel Blaze', tech: 'Tornado de fuego', level: 10 }, { player: 'Shawn Froste', tech: 'Ventisca eterna', level: 10 }],
    cooldownMs: 6500, effect: 'tiro-doble',
    source: 'Wiki de Inazuma Eleven (fandom), «Crossfire»: Gouenji (Axel) y Fubuki (Shawn) la crean y la usan en el anime. Condición de niveles: diseño de InaZurvivors.',
  },
  {
    id: 'tornado-dragon', name: 'Tornado dragón', jp: 'ドラゴントルネード', en: 'Dragon Tornado', element: 'Fuego', power: 79,
    needs: [{ player: 'Kevin Dragonfly', tech: 'Remate dragón', level: 5 }, { player: 'Axel Blaze', tech: 'Tornado de fuego', level: 5 }],
    cooldownMs: 5000, effect: 'tiro-dragon',
    source: 'Wiki de Inazuma Eleven (fandom), «Dragon Tornado»: Someoka (Kevin) pasa con Dragon Crash al Fire Tornado de Gouenji (Axel). Condición de niveles: diseño de InaZurvivors.',
  },
  {
    id: 'ruptura-relampago', name: 'Ruptura relámpago', jp: 'イナズマブレイク', en: 'Inazuma Break', element: 'Aire', power: 99,
    needs: [{ player: 'Jude Sharp', level: 4 }, { player: 'Mark Evans', level: 4 }, { player: 'Axel Blaze', level: 4 }],
    cooldownMs: 7000, effect: 'tiro-rayo',
    source: 'Wiki de Inazuma Eleven (fandom), «Inazuma Break»: Kidou (Jude), Endou (Mark) y Gouenji (Axel) la usan contra Senbayama (episodio 018). Condición de niveles: diseño de InaZurvivors.',
  },
];

export interface OnPitch { entry: RosterEntry; state: TeamMemberState }

/** Run level of a named technique in a player's active slots (0 if not active); without a name, their best active one. */
function activeLevel(m: OnPitch, tech?: string) {
  let best = 0;
  for (const idx of m.state.slots) {
    if (idx === null || idx === undefined) continue;
    const t: Technique | undefined = m.entry.techniques[idx];
    if (!t || (tech && t.name.toLowerCase() !== tech.toLowerCase())) continue;
    best = Math.max(best, m.state.levels[idx] ?? 1);
  }
  return best;
}

/** True when every participant is on the pitch with the required technique active at the required level. */
export function comboReady(c: ComboDef, team: OnPitch[]) {
  return c.needs.every((n) => {
    const m = team.find((x) => x.entry.name === n.player);
    return !!m && activeLevel(m, n.tech) >= n.level;
  });
}

/** Members taking part, in the order of the definition (only when all are present). */
export function comboMembers<T extends OnPitch>(c: ComboDef, team: T[]): T[] {
  const out = c.needs.map((n) => team.find((x) => x.entry.name === n.player));
  return out.every(Boolean) ? out as T[] : [];
}

/** Damage per hit of the combined shot: stronger than either solo shot, +20% per combo level. */
export const comboDamage = (c: ComboDef, level: number, mult = 1) => Math.round(c.power * 0.75 * (1 + 0.2 * (level - 1)) * mult);
