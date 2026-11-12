/**
 * pre-2.0 (author): coaches. One sits on the bench of Mi Equipo and gives passives for the whole run: a formation of
 * his, more rare items, affinity with an element, damage, defence or combined techniques. They come from the capsule
 * machine of their saga (a small chance per pull, only the ones not owned yet). Portraits: IE3 (Great Road of Heroes),
 * exported by InazumaExtractor/coaches_ie3.py; the manifest's `coaches` lists them by id.
 */
import { tr } from '../i18n/i18n';
import { tEl } from '../i18n/data';
import type { FormationId } from '../systems/formations';
import type { BannerId } from '../systems/banners';
import type { Rarity } from './manifest';

export type CoachPassive =
  | { kind: 'formacion'; formation: FormationId; damage: number; taken: number }
  | { kind: 'objetos'; luck: number }
  | { kind: 'afinidad'; element: string; damage: number }
  | { kind: 'dano'; damage: number }
  | { kind: 'defensa'; taken: number }
  | { kind: 'combinadas'; damage: number };

export interface CoachDef {
  id: string; name: string; team: string; rarity: Rarity; machine: BannerId;
  /** one line in his voice (or about him), shown on his card */
  quote: string;
  passives: CoachPassive[];
}

export const COACHES: CoachDef[] = [
  { id: 'hillman', name: 'Seymour Hillman', team: 'Raimon', rarity: 'legendario', machine: 'ff',
    quote: tr('El viejo del puesto de ramen que entrenó al Inazuma Eleven original.'),
    passives: [{ kind: 'formacion', formation: 'equilibrada', damage: 0.12, taken: 0.08 }, { kind: 'combinadas', damage: 0.15 }] },
  { id: 'veterano', name: 'Mr Veteran', team: 'Veteranos', rarity: 'epico', machine: 'ff',
    quote: tr('Años de partidos: sabe aguantar y sabe dónde buscar.'),
    passives: [{ kind: 'defensa', taken: 0.1 }, { kind: 'objetos', luck: 0.25 }] },
  { id: 'alpino', name: 'Entrenador del Alpino', team: 'Alpino', rarity: 'raro', machine: 'alius',
    quote: tr('Entrena entre la nieve, donde sopla el viento más frío.'),
    passives: [{ kind: 'afinidad', element: 'Aire', damage: 0.1 }] },
  { id: 'claustro', name: 'Entrenador del Claustro Sagrado', team: 'Claustro Sagrado', rarity: 'raro', machine: 'alius',
    quote: tr('Disciplina de monasterio, paciencia de árbol centenario.'),
    passives: [{ kind: 'afinidad', element: 'Bosque', damage: 0.1 }] },
  { id: 'fauxshore', name: 'Entrenador del Fauxshore', team: 'Fauxshore', rarity: 'raro', machine: 'alius',
    quote: tr('Siempre encuentra algo bueno entre la arena.'),
    passives: [{ kind: 'objetos', luck: 0.3 }] },
  { id: 'mary-times', name: 'Entrenador del Mary Times', team: 'Mary Times', rarity: 'raro', machine: 'alius',
    quote: tr('Juego de equipo: las combinadas, como las olas, en serie.'),
    passives: [{ kind: 'dano', damage: 0.05 }, { kind: 'combinadas', damage: 0.08 }] },
  { id: 'david-evans', name: 'David Evans', team: 'Little Gigant', rarity: 'legendario', machine: 'ffi',
    quote: tr('El abuelo de Mark: el que escribió los cuadernos de entrenamiento.'),
    passives: [{ kind: 'afinidad', element: 'Montaña', damage: 0.15 }, { kind: 'defensa', taken: 0.08 }] },
  { id: 'travis', name: 'Percy Travis', team: 'Inazuma Japan', rarity: 'mitico', machine: 'ffi',
    quote: tr('El seleccionador de Inazuma Japan: al ataque, siempre.'),
    passives: [{ kind: 'formacion', formation: 'ofensiva', damage: 0.15, taken: 0 }, { kind: 'dano', damage: 0.06 }] },
  { id: 'ray-dark', name: 'Ray Dark', team: 'Royal Academy', rarity: 'mitico', machine: 'ffi',
    quote: tr('Mister K: el estratega que lo calcula todo.'),
    passives: [{ kind: 'formacion', formation: 'defensiva', damage: 0.08, taken: 0.12 }, { kind: 'combinadas', damage: 0.2 }] },
  // FFI coaches with a portrait of their own in the ROM (team from the official database, zukan.inazuma.jp)
  { id: 'mister-d', name: 'Mister D', team: 'Orpheus (Team D)', rarity: 'legendario', machine: 'ffi',
    quote: tr('El misterioso entrenador del Team D. Debajo de la melena… alguien que ya conoces.'),
    passives: [{ kind: 'afinidad', element: 'Aire', damage: 0.15 }, { kind: 'dano', damage: 0.05 }] },
  { id: 'zoolan', name: 'Zoolan Rice', team: 'The Kingdom', rarity: 'epico', machine: 'ffi',
    quote: tr('Entrenador de The Kingdom: siempre sabe qué hay que buscar.'),
    passives: [{ kind: 'objetos', luck: 0.2 }, { kind: 'combinadas', damage: 0.1 }] },
];
export const COACH_BY_ID = new Map(COACHES.map((c) => [c.id, c]));

/** chance per pull of a coach of the machine (only coaches not owned yet; none once all of them are) */
export const COACH_PULL_CHANCE = 0.02;
export const coachesOfMachine = (m: BannerId) => COACHES.filter((c) => c.machine === m);

const pct = (v: number) => `${Math.round(v * 100)}%`;
const FORMATION_LABEL: Record<string, string> = { ofensiva: tr('ofensiva'), equilibrada: tr('equilibrada'), defensiva: tr('defensiva') };
export function passiveText(p: CoachPassive): string {
  switch (p.kind) {
    case 'formacion': return tr('Formación {x1}: +{pct} daño{x2} mientras la uses', { x1: FORMATION_LABEL[p.formation], pct: pct(p.damage), x2: p.taken ? tr(' y −{pct} daño recibido', { pct: pct(p.taken) }) : '' });
    case 'objetos': return tr('+{pct} probabilidad de objetos raros', { pct: pct(p.luck) });
    case 'afinidad': return tr('Afinidad {element}: +{pct} daño con técnicas de {element}', { element: tEl(p.element), pct: pct(p.damage) });
    case 'dano': return tr('+{pct} daño de todo el equipo', { pct: pct(p.damage) });
    case 'defensa': return tr('−{pct} daño recibido', { pct: pct(p.taken) });
    case 'combinadas': return tr('+{pct} daño de las técnicas combinadas', { pct: pct(p.damage) });
  }
}
export const PASSIVE_ICON: Record<CoachPassive['kind'], string> = { formacion: '▦', objetos: '✪', afinidad: '◆', dano: '⚔', defensa: '⛨', combinadas: '🔗' };

/** what the run needs from the equipped coach (ArenaScene: formation and element; the rest goes into the perks) */
export interface CoachRun { id: string; formation: { id: FormationId; damage: number; taken: number } | null; element: { element: string; damage: number } | null }
export function coachRun(def: CoachDef | undefined): CoachRun | undefined {
  if (!def) return undefined;
  const f = def.passives.find((p) => p.kind === 'formacion') as Extract<CoachPassive, { kind: 'formacion' }> | undefined;
  const e = def.passives.find((p) => p.kind === 'afinidad') as Extract<CoachPassive, { kind: 'afinidad' }> | undefined;
  return { id: def.id, formation: f ? { id: f.formation, damage: f.damage, taken: f.taken } : null, element: e ? { element: e.element, damage: e.damage } : null };
}
/** the passives that are plain perk changes (damage, defence, combos, rare items) */
export function applyCoachPerks(def: CoachDef | undefined, perks: { damageMult: number; damageTakenMult: number; comboMult: number; specialLuck: number }) {
  for (const p of def?.passives ?? []) {
    if (p.kind === 'dano') perks.damageMult *= 1 + p.damage;
    else if (p.kind === 'defensa') perks.damageTakenMult *= 1 - p.taken;
    else if (p.kind === 'combinadas') perks.comboMult *= 1 + p.damage;
    else if (p.kind === 'objetos') perks.specialLuck += p.luck; // the rare items' chance × (1 + luck + specialLuck), items.ts
  }
}
