/**
 * Combined supertechniques. Only combinations whose participants were checked against a documented source are listed;
 * the unlock conditions (technique levels) are InaZurvivors design, not canon. Fix 1.51 (author): two participants need
 * levels 3 and 5, three participants 3, 3 and 5. Names and power come from the IE2 Spanish
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
  effect: 'tiro-doble' | 'tiro-dragon' | 'tiro-rayo' | 'fenix' | 'tierra' | 'caos' | 'ventisca' | 'tierra-inf' | 'aurora' | 'bigbang' | 'fuego-total';
  /** Fix 1.12: when several are learnable at once, the higher one is offered first */
  priority: number;
  source: string;
}

export const COMBOS: ComboDef[] = [
  {
    id: 'fuego-cruzado', name: 'Fuego cruzado', jp: 'クロスファイア', en: 'Crossfire', element: 'Fuego', power: 120,
    needs: [{ player: 'Axel Blaze', tech: 'Tornado de fuego', level: 3 }, { player: 'Shawn Froste', tech: 'Ventisca eterna', level: 5 }],
    cooldownMs: 6500, effect: 'tiro-doble', priority: 8,
    source: 'Wiki de Inazuma Eleven (fandom), «Crossfire»: Gouenji (Axel) y Fubuki (Shawn) la crean y la usan en el anime. Condición de niveles: diseño de InaZurvivors.',
  },
  {
    id: 'tornado-dragon', name: 'Tornado dragón', jp: 'ドラゴントルネード', en: 'Dragon Tornado', element: 'Fuego', power: 79,
    needs: [{ player: 'Kevin Dragonfly', tech: 'Remate dragón', level: 3 }, { player: 'Axel Blaze', tech: 'Tornado de fuego', level: 5 }],
    cooldownMs: 5000, effect: 'tiro-dragon', priority: 5,
    source: 'Wiki de Inazuma Eleven (fandom), «Dragon Tornado»: Someoka (Kevin) pasa con Dragon Crash al Fire Tornado de Gouenji (Axel). Condición de niveles: diseño de InaZurvivors.',
  },
  {
    id: 'ruptura-relampago', name: 'Ruptura relámpago', jp: 'イナズマブレイク', en: 'Inazuma Break', element: 'Aire', power: 99,
    needs: [{ player: 'Jude Sharp', level: 3 }, { player: 'Mark Evans', level: 3 }, { player: 'Axel Blaze', level: 5 }],
    cooldownMs: 7000, effect: 'tiro-rayo', priority: 7,
    source: 'Wiki de Inazuma Eleven (fandom), «Inazuma Break»: Kidou (Jude), Endou (Mark) y Gouenji (Axel) la usan contra Senbayama (episodio 018). Condición de niveles: diseño de InaZurvivors.',
  },
  // Fix 1.12
  {
    id: 'el-fenix', name: 'El Fénix', jp: 'ザ・フェニックス', en: 'The Phoenix', element: 'Fuego', power: 125,
    needs: [{ player: 'Erik Eagle', level: 3 }, { player: 'Bobby Shearer', level: 3 }, { player: 'Mark Evans', level: 5 }],
    cooldownMs: 7500, effect: 'fenix', priority: 8,
    source: 'MyAnimeList, Ichinose Kazuya (Erik Eagle): «The Phoenix», con Endou (Mark) y Domon (Bobby). Condición de niveles: diseño de InaZurvivors.',
  },
  {
    id: 'la-tierra', name: 'La Tierra', jp: 'ジ・アース', en: 'The Earth', element: 'Montaña', power: 160,
    needs: [{ player: 'Mark Evans', level: 3 }, { player: 'Axel Blaze', level: 3 }, { player: 'Shawn Froste', level: 5 }],
    cooldownMs: 11000, effect: 'tierra', priority: 10,
    source: 'Wiki de Inazuma Eleven (fandom), «The Earth»: tiro combinado de Gouenji (Axel) que en IE2 hacen Endou (Mark), Gouenji y Fubuki (Shawn) (o Gran). Técnica de máxima categoría: condición de niveles alta, diseño de InaZurvivors.',
  },
  {
    id: 'remate-caotico', name: 'Remate caótico', jp: 'カオスブレイク', en: 'Chaos Break', element: 'Fuego', power: 140,
    needs: [{ player: 'Byron Love', tech: 'Disparo sagrado', level: 3 }, { player: 'Claude Beacons', level: 3 }, { player: 'Bryce Whitingale', level: 5 }], // Fix 1.53 (author): Byron with Disparo sagrado, not his strongest
    cooldownMs: 8500, effect: 'caos', priority: 9,
    source: 'Wiki de Inazuma Eleven (fandom), «Chaos Break»: Afuro (Byron), Nagumo (Claude) y Suzuno (Bryce) en Fire Dragon. Condición de niveles: diseño de InaZurvivors.',
  },
  {
    id: 'ventisca-de-fuego', name: 'Ventisca de fuego', jp: 'ファイアブリザード', en: 'Fire Blizzard', element: 'Fuego', power: 105,
    // Fix 1.51: each one needs his own signature shot (Claude no longer had «Ventisca de fuego», so it could never fire)
    needs: [{ player: 'Claude Beacons', tech: 'Llamarada atómica', level: 3 }, { player: 'Bryce Whitingale', tech: 'Balón Iceberg', level: 5 }],
    cooldownMs: 6000, effect: 'ventisca', priority: 6,
    source: 'ROM IE2 en español (tabla de técnicas): «Ventisca de fuego» en el repertorio de Torch (Claude) y Gazelle (Bryce). Condición de niveles: diseño de InaZurvivors.',
  },
  // Fix 1.51 (author's request)
  {
    id: 'big-bang', name: 'Big Bang', jp: 'ビッグバン', en: 'Big Bang', element: 'Fuego', power: 120,
    needs: [{ player: 'Xavier Foster', level: 3 }, { player: 'Jude Sharp', level: 3 }, { player: 'Shawn Froste', level: 5 }],
    cooldownMs: 10000, effect: 'bigbang', priority: 9,
    source: 'ROM IE3 (tabla de técnicas): «Big Bang» (ビッグバン), tiro de Fuego, poder 120, nombre español verificado. Tiro combinado de Hiroto (Xavier), Kidou (Jude) y Fubuki (Shawn), indicado por el autor con su escena. Condición de niveles: regla del Fix 1.51.',
  },
  // (author) collab: Eren, Mikasa and Armin (data/special_players.json)
  {
    id: 'big-bang-snk', name: 'Big Bang', jp: 'ビッグバン', en: 'Big Bang', element: 'Fuego', power: 120,
    needs: [{ player: 'Mikasa Ackerman', level: 3 }, { player: 'Armin Arlert', level: 3 }, { player: 'Eren Jaeger', level: 5 }],
    cooldownMs: 10000, effect: 'bigbang', priority: 9,
    source: 'ROM IE3 (tabla de técnicas): «Big Bang» (ビッグバン), como la de Xavier, Jude y Shawn. Colaboración (data/special_players.json): Mikasa, Armin y Eren, indicados por el autor. Condición de niveles: regla del Fix 1.51.',
  },
  // (author) collab: Meliodas, Escanor and Ban (data/special_players.json)
  {
    id: 'la-tierra-7ds', name: 'La Tierra', jp: 'ジ・アース', en: 'The Earth', element: 'Montaña', power: 160,
    needs: [{ player: 'Escanor', level: 3 }, { player: 'Ban', level: 3 }, { player: 'Meliodas', level: 5 }],
    cooldownMs: 11000, effect: 'tierra', priority: 10,
    source: 'Wiki de Inazuma Eleven (fandom), «The Earth», como la de Mark, Axel y Shawn. Colaboración (data/special_players.json): Escanor, Ban y Meliodas, indicados por el autor. Condición de niveles: regla del Fix 1.51.',
  },
  // v1.5 (author's request)
  {
    id: 'la-aurora', name: 'La Aurora', jp: 'ザ・バース', en: 'The Birth', element: 'Neutro', power: 110,
    needs: [{ player: 'Xavier Foster', level: 3 }, { player: 'Shawn Froste', level: 5 }],
    cooldownMs: 7000, effect: 'aurora', priority: 8,
    source: 'ROM IE3 (tabla de técnicas): «The Birth» (ザ・バース), tiro, poder 110, sin elemento propio; nombre español «La Aurora» en inazumo.es. Tiro combinado de Hiroto (Xavier) y Fubuki (Shawn), añadido a petición del autor. Condición de niveles: diseño de InaZurvivors.',
  },
  // (author) Fuego total: the hooded Axel (data/special_players.json) also does it alone, as his own technique
  {
    id: 'fuego-total', name: 'Fuego total', jp: 'グランドファイア', en: 'Grand Fire', element: 'Fuego', power: 105,
    needs: [{ player: 'Xavier Foster', level: 3 }, { player: 'Austin Hobbes', level: 3 }, { player: 'Axel Blaze', level: 5 }],
    cooldownMs: 9000, effect: 'fuego-total', priority: 9,
    source: 'ROM IE3 (tabla de técnicas): «Grand Fire» (グランドファイア), tiro de Fuego, poder 105; nombre español «Fuego total» (wiki en español). Tiro combinado de Hiroto (Xavier), Toramaru (Austin) y Gouenji (Axel), indicado por el autor con su escena. Condición de niveles: regla del Fix 1.51.',
  },
  {
    id: 'la-tierra-inf', name: 'La Tierra ∞', jp: 'ジ・アース∞', en: 'The Earth ∞', element: 'Montaña', power: 165,
    needs: [{ player: 'Arion Sherwind', level: 3 }, { player: 'Riccardo Di Rigo', level: 3 }, { player: 'Victor Blade', level: 5 }],
    cooldownMs: 11000, effect: 'tierra-inf', priority: 10,
    source: 'Wiki de Inazuma Eleven (fandom), «The Earth ∞»: Matsukaze Tenma (Arion), Shindou Takuto (Riccardo) y Tsurugi Kyousuke (Victor) en GO Galaxy, episodio 43. Condición de niveles: diseño de InaZurvivors.',
  },
];
/**
 * Fix 1.51 (author): other versions of a footballer can stand in for him in every combined technique — his alias in
 * another arc, his alternate-universe self and his Miximax fusions. Roster names; checked against the roster in
 * tests/aura_roster.test.ts.
 */
export const COUNTERPARTS: Record<string, string[]> = {
  'Shawn Froste': ['Shawn + Axel'],
  'Xavier Foster': ['Xene', 'Kira Hiroto', 'Jordan + Xavier'],
  // special footballer (data/special_players.json): Axel in his Okinawa hoodie
  'Axel Blaze': ['Axel Blaze Encapuchado'],
};
/** True when a roster name can play the part of a participant (himself or one of his counterparts). */
export const playsAs = (name: string | undefined, player: string) => !!name && (name === player || !!COUNTERPARTS[player]?.includes(name));

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

/**
 * v1.5: who covers each participant: the footballer himself on the pitch, or — when he isn't — a teammate carrying him as
 * Aura (auras.ts). Through an Aura the requirement is checked on the carrier: the needed technique must be active on him
 * (inherited from the Aura) at the needed level; without a named technique, the carrier's best active level counts.
 * A carrier can stand for himself and for his Aura in the same combination; nothing else is shared.
 */
export function comboCast<T extends OnPitch>(c: ComboDef, team: T[]): { member: T; viaAura: boolean; player: string }[] {
  const out: { member: T; viaAura: boolean; player: string }[] = [];
  for (const n of c.needs) {
    const self = team.find((x) => playsAs(x.entry.name, n.player) && activeLevel(x, n.tech) >= n.level);
    const carrier = self ? undefined : team.find((x) => playsAs(x.entry.aura?.name, n.player) && activeLevel(x, n.tech) >= n.level);
    const m = self ?? carrier;
    if (!m) return [];
    out.push({ member: m, viaAura: !self, player: n.player });
  }
  return out;
}

/** True when every participant is on the pitch (or carried as Aura) with the required technique active at the required level. */
export const comboReady = (c: ComboDef, team: OnPitch[]) => comboCast(c, team).length > 0;

/**
 * Members taking part, in the order of the definition (only when all are present). Presence only, no level check: once
 * learned, a combination keeps firing while its participants (or their carriers) are on the pitch.
 */
export function comboMembers<T extends OnPitch>(c: ComboDef, team: T[]): T[] {
  const out = c.needs.map((n) => team.find((x) => playsAs(x.entry.name, n.player)) ?? team.find((x) => playsAs(x.entry.aura?.name, n.player)));
  if (!out.every(Boolean)) return [];
  return [...new Set(out as T[])];
}

/** Damage per hit of the combined shot: stronger than either solo shot, +20% per combo level. */
export const comboDamage = (c: ComboDef, level: number, mult = 1) => Math.round(c.power * 0.75 * (1 + 0.2 * (level - 1)) * mult);

/** v1.7: one participant of a combination still to learn, with the level he has now and the one he needs. */
export interface ComboPart { player: string; tech?: string; need: number; have: number; /** roster id of who covers him (himself or his Aura carrier); null when nobody on the pitch does */ memberId: number | null; viaAura: boolean }
export interface ComboGoal { combo: ComboDef; parts: ComboPart[]; /** every participant on the pitch (or carried as Aura) */ complete: boolean; /** every level reached: the card shows up at the next level-up */ ready: boolean }

/**
 * v1.7: combinations not learned yet that the team on the pitch takes part in (at least one participant), with what each
 * participant still needs. Same rules as comboCast: the footballer himself first, then a teammate carrying him as Aura.
 */
export function comboGoals(team: OnPitch[], learned: Iterable<string> = []): ComboGoal[] {
  const got = new Set(learned);
  const out: ComboGoal[] = [];
  for (const c of COMBOS_BY_PRIORITY) {
    if (got.has(c.id)) continue;
    const parts = c.needs.map((n): ComboPart => {
      const self = team.find((x) => playsAs(x.entry.name, n.player));
      const m = self ?? team.find((x) => playsAs(x.entry.aura?.name, n.player));
      return { player: n.player, tech: n.tech, need: n.level, have: m ? activeLevel(m, n.tech) : 0, memberId: m?.entry.id ?? null, viaAura: !self && !!m };
    });
    if (!parts.some((p) => p.memberId !== null)) continue;
    const complete = parts.every((p) => p.memberId !== null);
    out.push({ combo: c, parts, complete, ready: complete && parts.every((p) => p.have >= p.need) });
  }
  return out;
}

/**
 * v1.7: combinations a level-up card brings closer: raising technique `techName` of `memberId` to `toLevel` (1 = learning
 * it). Only for complete goals (everyone on the pitch) and parts still short of their level.
 */
export function comboHints(goals: ComboGoal[], memberId: number, techName: string, toLevel: number) {
  const out: { name: string; need: number; reaches: boolean }[] = [];
  for (const g of goals) {
    if (!g.complete || g.ready) continue;
    for (const p of g.parts) {
      if (p.memberId !== memberId || p.have >= p.need || toLevel <= p.have) continue;
      if (p.tech && p.tech.toLowerCase() !== techName.toLowerCase()) continue;
      out.push({ name: g.combo.name, need: p.need, reaches: toLevel >= p.need });
      break;
    }
  }
  return out;
}

/**
 * Fix 1.32: combined techniques of a squad (Mi Equipo), before the run: `ready` when every participant is among the
 * candidates, otherwise the names still missing. Only combos with at least one participant in the squad.
 */
export function squadCombos(squad: Pick<RosterEntry, 'name' | 'id'>[], auraNames: string[] = []) {
  // v1.5: an Aura counts as present (its carrier brings it)
  const names = new Set([...squad.map((p) => p.name), ...auraNames]);
  return COMBOS_BY_PRIORITY.map((c) => {
    const has = (player: string) => [...names].some((nm) => playsAs(nm, player));
    const present = c.needs.filter((n) => has(n.player)).map((n) => n.player);
    const missing = c.needs.filter((n) => !has(n.player)).map((n) => n.player);
    return { combo: c, present, missing, ready: !missing.length, viaAura: present.filter((n) => auraNames.some((a) => playsAs(a, n)) && !squad.some((p) => playsAs(p.name, n))) };
  }).filter((x) => x.present.length > 0);
}
