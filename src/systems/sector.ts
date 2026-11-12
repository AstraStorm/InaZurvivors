/**
 * 2.2 (author): «Sector Quinto». From 13 November 12:00 to the end of the Temporada 1 every account takes a side for
 * good, Sector Quinto or Resistencia, and its runs add points to the side's week (server: migration sector_quinto, same
 * dates). Every Thursday at 12:00 the week closes: the higher average per active member wins. Zabel, the Holy Emperor,
 * speaks for the Sector: a decree for everyone each week and one before each match, which the player accepts or rebels
 * against (no restriction, but the Sector sends its SEED and the rivals are tougher; ×1.5 points). Nothing ever says
 * who he really is.
 */
import type { RosterEntry } from '../data/manifest';
import type { SaveData } from './save';
import { addCopy } from './gacha';
import { givePennant, hasPennant } from './pennants';
import { tr } from '../i18n/i18n';
import { tEl } from '../i18n/data';

export const SECTOR_START = '2026-11-12T12:00:00+01:00'; // author: opens with the 2.2 on Thursday 12 November (was 13-11)
export const SECTOR_END = '2026-12-12T15:00:00+01:00';
export const SECTOR_WEEKS = 4;
const WEEK_MS = 7 * 86400_000;

export type SideId = 'sector' | 'resistencia';
export interface SideDef { id: SideId; name: string; short: string; color: string; frame: string; players: number[]; motto: string }
/** the three footballers of each side (author: «equilibrado por rareza»): a copy of each to the winners every week */
export const SIDES: Record<SideId, SideDef> = {
  sector: { id: 'sector', name: tr('Sector Quinto'), short: 'Sector', color: '#3f6bff', frame: 'marco-sector-quinto', players: [100562, 100944, 100303],
    motto: tr('El fútbol bajo control: cada partido, como el Sector decide.') },
  // author: the Resistencia's prize are its Mixi Max (Arion + Arthur, Riccardo + Nobunaga, Victor + Okita)
  resistencia: { id: 'resistencia', name: 'Resistencia', short: 'Resistencia', color: '#ffb020', frame: 'marco-resistencia', players: [101520, 100805, 101004],
    motto: tr('El fútbol es libre: el viento de la revolución sopla en cada partido.') },
};
export const WIN_PRIZE = { tokens: 300, coins: 15000 };
export const LOSE_PRIZE = { tokens: 100, coins: 5000 };
export const REBEL_POINTS = 1.5;

const t0 = () => Date.parse(SECTOR_START), t1 = () => Date.parse(SECTOR_END);
export const sectorOpen = (now: number | Date) => +now >= t0() && +now < t1();
/** the week (0..3) of a moment, null outside the event; the last one runs to the end of the season */
export function sectorWeek(now: number | Date): number | null {
  if (!sectorOpen(now)) return null;
  return Math.min(SECTOR_WEEKS - 1, Math.floor((+now - t0()) / WEEK_MS));
}
export const sectorWeekEnd = (w: number) => (w >= SECTOR_WEEKS - 1 ? t1() : t0() + (w + 1) * WEEK_MS);

/** the elements of the game as the techniques name them */
export type Elem = 'Fuego' | 'Aire' | 'Bosque' | 'Montaña';
const ELEMS: Elem[] = ['Fuego', 'Aire', 'Bosque', 'Montaña'];

/** the weekly decree: one element gets +20 % for everyone (author: «decreto semanal») */
export interface WeeklyDecree { week: number; element: Elem; bonus: number; title: string; line: string }
const WEEKLY: [Elem, string][] = [
  ['Aire', tr('El viento sopla a favor del Sector. Esta semana, quien domine el Aire dominará el campo.')],
  ['Fuego', tr('El Sector quiere goles de fuego. Esta semana, las técnicas de Fuego arden con más fuerza.')],
  ['Bosque', tr('Raíces firmes, disciplina firme. Esta semana el Bosque crece bajo la mirada del Sector.')],
  ['Montaña', tr('Nadie mueve una montaña sin permiso. Esta semana la Montaña es la ley.')],
];
export function weeklyDecree(now: number | Date): WeeklyDecree | null {
  const w = sectorWeek(now);
  if (w === null) return null;
  const [element, line] = WEEKLY[w % WEEKLY.length];
  return { week: w, element, bonus: 0.2, title: `Decreto semanal: ${element} +20 %`, line };
}

/** a decree for one match: what accepting it costs */
export interface MatchDecree { id: string; title: string; line: string; element?: Elem; elementMult?: number; allMult?: number; takenMult?: number }
export const MATCH_DECREES: MatchDecree[] = [
  ...ELEMS.map((e): MatchDecree => ({ id: `sin-${e.toLowerCase().replace('ñ', 'n')}`, title: tr('Técnicas de {e} −40 %', { e: tEl(e) }), element: e, elementMult: 0.6,
    line: tr('En este partido el {e} no está autorizado. Juega como el Sector dice.', { e: tEl(e) }) })),
  { id: 'muro', title: tr('Recibes +25 % de daño'), takenMult: 1.25, line: tr('Tu defensa no interesa al Sector. Aguanta los golpes en silencio.') },
  { id: 'gris', title: tr('Todas las técnicas −15 %'), allMult: 0.85, line: tr('Nada de lucirse: un partido gris, sin estrellas. Así lo quiere el Sector.') },
];
/** the decree of a match, from its seed (the same match always gets the same one) */
export const matchDecree = (seed: number) => MATCH_DECREES[Math.abs(Math.floor(seed)) % MATCH_DECREES.length];

/** SEED rivals: always some during the event, many more against a rebel */
export const SEED_CHANCE = 0.04;
export const SEED_CHANCE_REBEL = 0.12;
export const REBEL_ENEMY_HP = 1.3;

/** what a run of the event changes in the arena (ArenaInit.sector) */
export interface SectorRun {
  /** technique damage by element (weekly decree and an accepted decree multiply here) */
  elementMult: Partial<Record<Elem, number>>;
  allMult: number;
  takenMult: number;
  enemyHp: number;
  seedChance: number;
  rebel: boolean;
  decree: MatchDecree | null;
}
/**
 * The arena's changes for a run at `now`: the weekly decree for everyone; for a member of a side the match's decree,
 * accepted (its restriction) or defied (no restriction, tougher rivals and more SEED). Null outside the event.
 */
export function sectorRun(now: number | Date, decree: MatchDecree | null, rebel: boolean): SectorRun | null {
  const wk = weeklyDecree(now);
  if (!wk) return null;
  const elementMult: Partial<Record<Elem, number>> = { [wk.element]: 1 + wk.bonus };
  let allMult = 1, takenMult = 1;
  if (decree && !rebel) {
    if (decree.element) elementMult[decree.element] = (elementMult[decree.element] ?? 1) * (decree.elementMult ?? 1);
    allMult *= decree.allMult ?? 1;
    takenMult *= decree.takenMult ?? 1;
  }
  return { elementMult, allMult, takenMult, enemyHp: rebel ? REBEL_ENEMY_HP : 1, seedChance: rebel ? SEED_CHANCE_REBEL : SEED_CHANCE, rebel, decree };
}

/** the side kept in the save (the server has the real one; this one is for the menu before it answers) */
export type SectorSave = NonNullable<SaveData['sector']>;
export const sectorOf = (s: SaveData): SectorSave => (s.sector ??= {});

/** a closed week as the server hands it over (sector_claim) */
export interface SectorPrizeRow { week: number; side: SideId; won: boolean; tokens: number; coins: number }
/**
 * Pays one collected week: fichas and coins as the server says; the winners also get their side's frame (the first
 * time) and a copy of each of its three footballers. A week already paid in this save is skipped.
 */
export function paySectorPrize(s: SaveData, r: SectorPrizeRow, byId: Map<number, RosterEntry>): { paid: boolean; frame: boolean; players: { player: RosterEntry; isNew: boolean }[] } {
  const st = sectorOf(s);
  st.claimed ??= [];
  if (st.claimed.includes(r.week)) return { paid: false, frame: false, players: [] };
  st.claimed.push(r.week);
  s.tokens += Math.max(0, Math.floor(r.tokens));
  s.coins += Math.max(0, Math.floor(r.coins));
  if (!r.won) return { paid: true, frame: false, players: [] };
  const side = SIDES[r.side];
  const frame = !hasPennant(s, side.frame);
  if (frame) givePennant(s, side.frame);
  const players = side.players.map((id) => byId.get(id)).filter((p): p is RosterEntry => !!p).map((p) => ({ player: p, isNew: addCopy(s, p).isNew }));
  return { paid: true, frame, players };
}
