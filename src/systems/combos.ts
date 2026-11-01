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
  /** what the special slot does when it fires (each one has its own animation in the scene) */
  effect: 'tiro-doble' | 'tiro-dragon' | 'tiro-rayo' | 'fenix' | 'tierra' | 'caos' | 'ventisca' | 'tierra-inf';
  /** Fix 1.12: when several are learnable at once, the higher one is offered first */
  priority: number;
  source: string;
}

export const COMBOS: ComboDef[] = [
  {
    id: 'fuego-cruzado', name: 'Fuego cruzado', jp: 'クロスファイア', en: 'Crossfire', element: 'Fuego', power: 120,
    needs: [{ player: 'Axel Blaze', tech: 'Tornado de fuego', level: 10 }, { player: 'Shawn Froste', tech: 'Ventisca eterna', level: 10 }],
    cooldownMs: 6500, effect: 'tiro-doble', priority: 8,
    source: 'Wiki de Inazuma Eleven (fandom), «Crossfire»: Gouenji (Axel) y Fubuki (Shawn) la crean y la usan en el anime. Condición de niveles: diseño de InaZurvivors.',
  },
  {
    id: 'tornado-dragon', name: 'Tornado dragón', jp: 'ドラゴントルネード', en: 'Dragon Tornado', element: 'Fuego', power: 79,
    needs: [{ player: 'Kevin Dragonfly', tech: 'Remate dragón', level: 5 }, { player: 'Axel Blaze', tech: 'Tornado de fuego', level: 5 }],
    cooldownMs: 5000, effect: 'tiro-dragon', priority: 5,
    source: 'Wiki de Inazuma Eleven (fandom), «Dragon Tornado»: Someoka (Kevin) pasa con Dragon Crash al Fire Tornado de Gouenji (Axel). Condición de niveles: diseño de InaZurvivors.',
  },
  {
    id: 'ruptura-relampago', name: 'Ruptura relámpago', jp: 'イナズマブレイク', en: 'Inazuma Break', element: 'Aire', power: 99,
    needs: [{ player: 'Jude Sharp', level: 4 }, { player: 'Mark Evans', level: 4 }, { player: 'Axel Blaze', level: 4 }],
    cooldownMs: 7000, effect: 'tiro-rayo', priority: 7,
    source: 'Wiki de Inazuma Eleven (fandom), «Inazuma Break»: Kidou (Jude), Endou (Mark) y Gouenji (Axel) la usan contra Senbayama (episodio 018). Condición de niveles: diseño de InaZurvivors.',
  },
  // Fix 1.12
  {
    id: 'el-fenix', name: 'El Fénix', jp: 'ザ・フェニックス', en: 'The Phoenix', element: 'Fuego', power: 125,
    needs: [{ player: 'Erik Eagle', level: 5 }, { player: 'Bobby Shearer', level: 5 }, { player: 'Mark Evans', level: 5 }],
    cooldownMs: 7500, effect: 'fenix', priority: 8,
    source: 'MyAnimeList, Ichinose Kazuya (Erik Eagle): «The Phoenix», con Endou (Mark) y Domon (Bobby). Condición de niveles: diseño de InaZurvivors.',
  },
  {
    id: 'la-tierra', name: 'La Tierra', jp: 'ジ・アース', en: 'The Earth', element: 'Montaña', power: 160,
    needs: [{ player: 'Mark Evans', level: 7 }, { player: 'Axel Blaze', level: 7 }, { player: 'Shawn Froste', level: 7 }],
    cooldownMs: 11000, effect: 'tierra', priority: 10,
    source: 'Wiki de Inazuma Eleven (fandom), «The Earth»: tiro combinado de Gouenji (Axel) que en IE2 hacen Endou (Mark), Gouenji y Fubuki (Shawn) (o Gran). Técnica de máxima categoría: condición de niveles alta, diseño de InaZurvivors.',
  },
  {
    id: 'remate-caotico', name: 'Remate caótico', jp: 'カオスブレイク', en: 'Chaos Break', element: 'Fuego', power: 140,
    needs: [{ player: 'Byron Love', level: 5 }, { player: 'Claude Beacons', level: 5 }, { player: 'Bryce Whitingale', level: 5 }],
    cooldownMs: 8500, effect: 'caos', priority: 9,
    source: 'Wiki de Inazuma Eleven (fandom), «Chaos Break»: Afuro (Byron), Nagumo (Claude) y Suzuno (Bryce) en Fire Dragon. Condición de niveles: diseño de InaZurvivors.',
  },
  {
    id: 'ventisca-de-fuego', name: 'Ventisca de fuego', jp: 'ファイアブリザード', en: 'Fire Blizzard', element: 'Fuego', power: 105,
    needs: [{ player: 'Claude Beacons', tech: 'Ventisca de fuego', level: 3 }, { player: 'Bryce Whitingale', tech: 'Ventisca de fuego', level: 3 }],
    cooldownMs: 6000, effect: 'ventisca', priority: 6,
    source: 'ROM IE2 en español (tabla de técnicas): «Ventisca de fuego» en el repertorio de Torch (Claude) y Gazelle (Bryce). Condición de niveles: diseño de InaZurvivors.',
  },
  {
    id: 'la-tierra-inf', name: 'La Tierra ∞', jp: 'ジ・アース∞', en: 'The Earth ∞', element: 'Montaña', power: 165,
    needs: [{ player: 'Arion Sherwind', level: 7 }, { player: 'Riccardo Di Rigo', level: 7 }, { player: 'Victor Blade', level: 7 }],
    cooldownMs: 11000, effect: 'tierra-inf', priority: 10,
    source: 'Wiki de Inazuma Eleven (fandom), «The Earth ∞»: Matsukaze Tenma (Arion), Shindou Takuto (Riccardo) y Tsurugi Kyousuke (Victor) en GO Galaxy, episodio 43. Condición de niveles: diseño de InaZurvivors.',
  },
];
/** Highest priority first: the order in which learnable combinations are offered. */
export const COMBOS_BY_PRIORITY = [...COMBOS].sort((a, b) => b.priority - a.priority);

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
