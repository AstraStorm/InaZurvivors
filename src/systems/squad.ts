/**
 * "Mi Equipo": the seven candidates a player brings to a run. The captain starts alone; level-up recruit cards only
 * offer the other six, and the pitch still holds five at most (cards.ts MAX_TEAM). Only owned players, no repeats.
 */
import { RARITY_ORDER, type Rarity, type RosterEntry } from '../data/manifest';
import { effectiveRarity } from './ascension';
import type { SaveData } from './save';

export const SQUAD_SIZE = 7;
/** Fix 1.12: most footballers of the top rarities in a squad (ascended players count as their current rarity) */
export const RARITY_CAP: Partial<Record<Rarity, number>> = { legendario: 3, mitico: 2, leyenda: 1 };
export const CAP_TEXT = 'Máximo en el equipo: 3 Legendarios, 2 Míticos y 1 Leyenda.';

/** The rarity whose cap this list of players breaks, or null. */
export function overCap(save: SaveData, players: RosterEntry[]): Rarity | null {
  const n: Partial<Record<Rarity, number>> = {};
  for (const p of players) {
    const r = effectiveRarity(save, p);
    n[r] = (n[r] ?? 0) + 1;
    if (n[r]! > (RARITY_CAP[r] ?? Infinity)) return r;
  }
  return null;
}

const rank = (p: RosterEntry) => RARITY_ORDER.indexOf(p.rarity);

/**
 * The saved squad, cleaned: owned, unique, at most seven, captain first. An empty or short squad is NOT padded here,
 * the screen shows the free slots; `fillSquad` is what tops it up.
 */
export function squadOf(save: SaveData, byId: Map<number, RosterEntry>): RosterEntry[] {
  const seen = new Set<number>();
  const ids = [save.captainId, ...(save.squad ?? [])].filter((id): id is number => id !== null && id !== undefined);
  const out: RosterEntry[] = [];
  for (const id of ids) {
    const p = byId.get(id);
    if (!p || seen.has(id) || !save.owned[String(id)]) continue;
    seen.add(id);
    if (overCap(save, [...out, p])) continue; // a squad saved before the caps keeps its first ones; the others wait out
    out.push(p);
    if (out.length === SQUAD_SIZE) break;
  }
  return out;
}

/** Tops the squad up to seven with the best owned players not in it yet (rarity, then stars). */
export function fillSquad(save: SaveData, roster: RosterEntry[]) {
  const byId = new Map(roster.map((p) => [p.id, p]));
  const squad = squadOf(save, byId);
  const inSquad = new Set(squad.map((p) => p.id));
  const extra = roster.filter((p) => save.owned[String(p.id)] && !inSquad.has(p.id))
    .sort((a, b) => rank(b) - rank(a) || (save.owned[String(b.id)].stars - save.owned[String(a.id)].stars) || a.id - b.id);
  for (const p of extra) {
    if (squad.length >= SQUAD_SIZE) break;
    if (!overCap(save, [...squad, p])) squad.push(p);
  }
  setSquad(save, squad.map((p) => p.id));
}

/** Stores a squad; the first id becomes the captain. Unknown, unowned and repeated ids are dropped. */
export function setSquad(save: SaveData, ids: number[]) {
  const clean = [...new Set(ids)].filter((id) => save.owned[String(id)]).slice(0, SQUAD_SIZE);
  save.squad = clean;
  if (clean.length) save.captainId = clean[0];
}

/** Puts a player in a slot (0 = captain). If they were already in the squad, the two slots swap. False if it breaks a cap. */
export function placeInSquad(save: SaveData, byId: Map<number, RosterEntry>, slot: number, id: number): boolean {
  if (!save.owned[String(id)]) return false;
  const ids = squadOf(save, byId).map((p) => p.id);
  const from = ids.indexOf(id);
  if (from >= 0) {
    if (slot < ids.length) [ids[from], ids[slot]] = [ids[slot], ids[from]];
  } else if (slot < ids.length) ids[slot] = id;
  else ids.push(id);
  if (overCap(save, ids.map((x) => byId.get(x)).filter((p): p is RosterEntry => !!p))) return false;
  setSquad(save, ids);
  return true;
}

export function removeFromSquad(save: SaveData, byId: Map<number, RosterEntry>, id: number) {
  const ids = squadOf(save, byId).map((p) => p.id).filter((x) => x !== id);
  save.squad = ids;
  save.captainId = ids[0] ?? save.captainId;
}

export function makeCaptain(save: SaveData, byId: Map<number, RosterEntry>, id: number) {
  const ids = squadOf(save, byId).map((p) => p.id);
  if (!ids.includes(id)) return;
  setSquad(save, [id, ...ids.filter((x) => x !== id)]);
}
