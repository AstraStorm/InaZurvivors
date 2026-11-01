/**
 * Talents as real passives. The talent itself comes from the games (technique ids 51-81 are the same in IE2 and IE3);
 * what it does here is an adaptation to a survivors game, not the game's number. A footballer whose documented moves have
 * no talent gets a passive of InaZurivors chosen from its position, always shown as such. Totals go through balance.ts.
 */
import type { RosterEntry, TechType } from '../data/manifest';

export interface TalentFx {
  speed: number; regen: number; crit: number; luck: number; xp: number; cooldown: number; shield: number; elemental: number;
  /** extra damage of everyone's techniques by type, by element, and for the whole team */
  type: Partial<Record<TechType, number>>; element: Record<string, number>; team: number;
  /** extra damage below 30% health */
  lastStand: number; revive: boolean; taken: number;
}
export const emptyFx = (): TalentFx => ({ speed: 0, regen: 0, crit: 0, luck: 0, xp: 0, cooldown: 0, shield: 0, elemental: 0, type: {}, element: {}, team: 0, lastStand: 0, revive: false, taken: 0 });

type Effect = { name: string; text: string; apply(f: TalentFx, k: number): void };
const addType = (f: TalentFx, t: TechType, v: number) => { f.type[t] = (f.type[t] ?? 0) + v; };
const addElem = (f: TalentFx, e: string, v: number) => { f.element[e] = (f.element[e] ?? 0) + v; };

/** Keyed by technique id. `name` fills the ROM records that have no Spanish name in the tables. */
export const TALENTS: Record<number, Effect> = {
  51: { name: 'Portero+', text: '+4% de reducción de daño del equipo', apply: (f, k) => { f.shield += 0.04 * k; } },
  52: { name: 'Rapidez+', text: '+4% velocidad', apply: (f, k) => { f.speed += 0.04 * k; } },
  53: { name: 'Tiro+', text: '+10% daño de tiros', apply: (f, k) => addType(f, 'tiro', 0.1 * k) },
  54: { name: 'Defensa+', text: '+10% daño de técnicas de defensa', apply: (f, k) => addType(f, 'defensa', 0.1 * k) },
  55: { name: 'Ataque+', text: '+10% daño de regates', apply: (f, k) => addType(f, 'regate', 0.1 * k) },
  56: { name: 'Recuperación', text: '+0,15% de vida por segundo', apply: (f, k) => { f.regen += 0.0015 * k; } },
  57: { name: '¡Trampa!', text: '+3% crítico', apply: (f, k) => { f.crit += 0.03 * k; } },
  58: { name: '¡Encanto +!', text: '+3% efecto elemental', apply: (f, k) => { f.elemental += 0.03 * k; } },
  59: { name: '¡Guapo +!', text: '+3% efecto elemental', apply: (f, k) => { f.elemental += 0.03 * k; } },
  60: { name: 'Ahorro', text: '-5% recarga', apply: (f, k) => { f.cooldown += 0.05 * k; } },
  61: { name: '¡Súper técnica!', text: '+6% daño de todas las técnicas', apply: (f, k) => { f.team += 0.06 * k; } },
  62: { name: 'Refuerzo elemental', text: '+5% efecto elemental', apply: (f, k) => { f.elemental += 0.05 * k; } },
  63: { name: 'Aprendizaje', text: '+8% experiencia', apply: (f, k) => { f.xp += 0.08 * k; } },
  64: { name: 'Pereza', text: '+0,1% de vida por segundo, -3% daño', apply: (f, k) => { f.regen += 0.001 * k; f.team -= 0.03; } },
  65: { name: '¡Crítico!', text: '+5% crítico', apply: (f, k) => { f.crit += 0.05 * k; } },
  66: { name: 'Sin elemento', text: '+2% de reducción de daño', apply: (f, k) => { f.shield += 0.02 * k; } },
  67: { name: '¡Suerte!', text: '+8% suerte', apply: (f, k) => { f.luck += 0.08 * k; } },
  68: { name: 'Gafe', text: '+4% efecto elemental', apply: (f, k) => { f.elemental += 0.04 * k; } },
  69: { name: 'Fuerza de velocidad', text: '+6% velocidad', apply: (f, k) => { f.speed += 0.06 * k; } },
  70: { name: 'Fuerza de tiro', text: '+14% daño de tiros', apply: (f, k) => addType(f, 'tiro', 0.14 * k) },
  71: { name: 'Fuerza defensiva', text: '+14% daño de técnicas de defensa', apply: (f, k) => addType(f, 'defensa', 0.14 * k) },
  72: { name: 'Fuerza de ataque', text: '+14% daño de regates', apply: (f, k) => addType(f, 'regate', 0.14 * k) },
  73: { name: 'Nunca te rindas', text: '+20% daño con menos del 30% de vida', apply: (f, k) => { f.lastStand += 0.2 * k; } },
  74: { name: '¡Vamos!', text: '+4% daño del equipo', apply: (f, k) => { f.team += 0.04 * k; } },
  75: { name: '¡Vamos todos!', text: '+6% daño del equipo', apply: (f, k) => { f.team += 0.06 * k; } },
  76: { name: '¡Resurgir!', text: 'Una vez por partida recupera un 20% de vida al quedar por debajo del 20%', apply: (f) => { f.revive = true; } },
  77: { name: '¡Todo o nada!', text: '+10% daño, +5% daño recibido', apply: (f, k) => { f.team += 0.1 * k; f.taken += 0.05; } },
  78: { name: '¡Como el viento!', text: '+12% daño de técnicas de Aire', apply: (f, k) => addElem(f, 'Aire', 0.12 * k) },
  79: { name: '¡Como el bosque!', text: '+12% daño de técnicas de Bosque', apply: (f, k) => addElem(f, 'Bosque', 0.12 * k) },
  80: { name: '¡Como el fuego!', text: '+12% daño de técnicas de Fuego', apply: (f, k) => addElem(f, 'Fuego', 0.12 * k) },
  81: { name: '¡Como la montaña!', text: '+12% daño de técnicas de Montaña', apply: (f, k) => addElem(f, 'Montaña', 0.12 * k) },
};

/** Technique level adds a quarter of the base effect per level. */
export const talentScale = (level: number) => 1 + Math.max(0, level - 1) * 0.25;

const RARITY_K: Record<string, number> = { comun: 1, raro: 1.3, epico: 1.6, legendario: 2, mitico: 2.4 };

export interface Passive { name: string; text: string; apply(f: TalentFx): void }
type Tpl = (p: RosterEntry, k: number) => Passive;
const pct = (v: number) => `${Math.round(v * 100)}%`;
const ELEMENTALIST: Tpl = (p, k) => ({ name: `Especialista: ${p.element}`, text: `+${pct(0.04 * k)} daño de técnicas de ${p.element}`, apply: (f) => addElem(f, String(p.element), 0.04 * k) });
const SPIRIT: Tpl = (_p, k) => ({ name: 'Espíritu de equipo', text: `+${pct(0.015 * k)} daño del equipo`, apply: (f) => { f.team += 0.015 * k; } });
const LAST: Tpl = (_p, k) => ({ name: 'Último esfuerzo', text: `+${pct(0.08 * k)} daño con menos del 30% de vida`, apply: (f) => { f.lastStand += 0.08 * k; } });
const TECHNICIAN: Tpl = (_p, k) => ({ name: 'Técnico', text: `-${pct(0.025 * k)} recarga`, apply: (f) => { f.cooldown += 0.025 * k; } });
const LEADER: Tpl = (_p, k) => ({ name: 'Líder', text: `+${pct(0.02 * k)} daño del equipo`, apply: (f) => { f.team += 0.02 * k; } });
const DEFENDER: Tpl = (_p, k) => ({ name: 'Defensor', text: `+${pct(0.015 * k)} de reducción de daño`, apply: (f) => { f.shield += 0.015 * k; } });
const KEEPER: Tpl = (_p, k) => ({ name: 'Guardameta', text: `+${pct(0.02 * k)} de reducción de daño`, apply: (f) => { f.shield += 0.02 * k; } });
const RUNNER: Tpl = (_p, k) => ({ name: 'Incansable', text: `+${pct(0.02 * k)} velocidad`, apply: (f) => { f.speed += 0.02 * k; } });
const STRIKER: Tpl = (_p, k) => ({ name: 'Instinto goleador', text: `+${pct(0.04 * k)} daño de tiros`, apply: (f) => addType(f, 'tiro', 0.04 * k) });

const BY_POSITION: Record<string, Tpl[]> = {
  GK: [KEEPER, DEFENDER, SPIRIT], DF: [DEFENDER, LAST, SPIRIT, ELEMENTALIST], MF: [TECHNICIAN, LEADER, RUNNER, ELEMENTALIST], FW: [STRIKER, ELEMENTALIST, LAST, RUNNER],
};

/** Passive of InaZurivors for a footballer with no documented talent; null when it has one of its own. */
export function adaptedPassive(p: RosterEntry): Passive | null {
  if (p.techniques.some((t) => t.type === 'talento')) return null;
  const list = BY_POSITION[p.position] ?? BY_POSITION.MF;
  return list[p.id % list.length](p, RARITY_K[p.rarity] ?? 1);
}
