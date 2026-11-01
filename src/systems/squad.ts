/**
 * "Mi Equipo": the seven candidates a player brings to a run. The captain starts alone; level-up recruit cards only
 * offer the other six, and the pitch still holds five at most (cards.ts MAX_TEAM). Only owned players, no repeats.
 */
import { RARITY_ORDER, type RosterEntry } from '../data/manifest';
import type { SaveData } from './save';

export const SQUAD_SIZE = 7;
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
    squad.push(p);
  }
  setSquad(save, squad.map((p) => p.id));
}

/** Stores a squad; the first id becomes the captain. Unknown, unowned and repeated ids are dropped. */
export function setSquad(save: SaveData, ids: number[]) {
  const clean = [...new Set(ids)].filter((id) => save.owned[String(id)]).slice(0, SQUAD_SIZE);
  save.squad = clean;
  if (clean.length) save.captainId = clean[0];
}

/** Puts a player in a slot (0 = captain). If they were already in the squad, the two slots swap. */
export function placeInSquad(save: SaveData, byId: Map<number, RosterEntry>, slot: number, id: number) {
  if (!save.owned[String(id)]) return;
  const ids = squadOf(save, byId).map((p) => p.id);
  const from = ids.indexOf(id);
  if (from >= 0) {
    if (slot < ids.length) [ids[from], ids[slot]] = [ids[slot], ids[from]];
  } else if (slot < ids.length) ids[slot] = id;
  else ids.push(id);
  setSquad(save, ids);
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
