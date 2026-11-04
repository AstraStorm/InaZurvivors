/**
 * "Mi Equipo": the seven candidates a player brings to a run. The captain starts alone; level-up recruit cards only
 * offer the other six, and the pitch still holds five at most (cards.ts MAX_TEAM). Only owned players, no repeats.
 */
import { RARITY_ORDER, type RosterEntry } from '../data/manifest';
import { SQUAD_SLOTS, type SaveData, type SquadPreset } from './save';
import { carrierOf, releaseAsAura, removeAura } from './auras';

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
  const extra = roster.filter((p) => save.owned[String(p.id)] && !inSquad.has(p.id) && carrierOf(save, p.id) === null) // v1.5: Auras stay Auras
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
  releaseAsAura(save, id); // v1.5: one copy, one place: an Aura that goes into the squad stops being an Aura
  const ids = squadOf(save, byId).map((p) => p.id);
  const from = ids.indexOf(id);
  if (from >= 0) {
    if (slot < ids.length) [ids[from], ids[slot]] = [ids[slot], ids[from]];
  } else if (slot < ids.length) { removeAura(save, ids[slot]); ids[slot] = id; } // 1.76: whoever leaves takes his Aura off
  else ids.push(id);
  setSquad(save, ids);
}

/** 1.76 (author): a footballer who leaves the squad also takes his Aura off. */
export function removeFromSquad(save: SaveData, byId: Map<number, RosterEntry>, id: number) {
  const ids = squadOf(save, byId).map((p) => p.id).filter((x) => x !== id);
  removeAura(save, id);
  save.squad = ids;
  save.captainId = ids[0] ?? save.captainId;
}

/** «Vaciar»: everyone but the captain leaves, with their Auras. */
export function clearSquad(save: SaveData, byId: Map<number, RosterEntry>) {
  const ids = squadOf(save, byId).map((p) => p.id);
  for (const id of ids.slice(1)) removeAura(save, id);
  setSquad(save, ids.slice(0, 1));
}

// ---------------------------------------------------------------- 1.76: five saved teams
/** The five saved teams; the first time, the current team becomes team 1 and the others start empty. */
export function savedSquads(save: SaveData): SquadPreset[] {
  if (!save.squads?.length) {
    save.squads = Array.from({ length: SQUAD_SLOTS }, (_, i) => ({ name: `Equipo ${i + 1}`, squad: [] as number[] }));
    save.activeSquad = 0;
    storeActive(save);
  }
  return save.squads;
}

/** Copies the live team (squad, its Auras, formation) into its slot. */
function storeActive(save: SaveData) {
  const list = save.squads!, i = save.activeSquad ?? 0;
  const ids = [save.captainId, ...save.squad].filter((x, k, a): x is number => x !== null && x !== undefined && a.indexOf(x) === k).slice(0, SQUAD_SIZE);
  const auras = Object.fromEntries(Object.entries(save.auras ?? {}).filter(([c]) => ids.includes(Number(c))));
  list[i] = { ...list[i], squad: ids, auras, formation: save.formation };
}

/** Saves the live team in its slot and loads team `i`; its Auras replace the live ones. */
export function switchSquad(save: SaveData, i: number) {
  const list = savedSquads(save);
  if (i < 0 || i >= list.length || i === (save.activeSquad ?? 0)) return false;
  storeActive(save);
  const next = list[i];
  save.activeSquad = i;
  const ids = next.squad.filter((id) => save.owned[String(id)]);
  save.squad = ids;
  save.captainId = ids[0] ?? null; // an empty team has no captain yet
  // one copy, one place: an Aura of this team that is also in it is dropped (squad wins)
  save.auras = Object.fromEntries(Object.entries(next.auras ?? {}).filter(([c, a]) => ids.includes(Number(c)) && !ids.includes(a) && save.owned[String(a)]));
  if (next.formation) save.formation = next.formation;
  return true;
}

export function renameSquad(save: SaveData, i: number, name: string) {
  const list = savedSquads(save);
  if (!list[i]) return;
  list[i] = { ...list[i], name: name.trim().slice(0, 16) || `Equipo ${i + 1}` };
}

/** Keeps the slot of the live team up to date (called whenever the team is saved). */
export function syncActiveSquad(save: SaveData) { if (save.squads?.length) storeActive(save); }

export function makeCaptain(save: SaveData, byId: Map<number, RosterEntry>, id: number) {
  const ids = squadOf(save, byId).map((p) => p.id);
  if (!ids.includes(id)) return;
  setSquad(save, [id, ...ids.filter((x) => x !== id)]);
}
