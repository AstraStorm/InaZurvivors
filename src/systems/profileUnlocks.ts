/**
 * What the profile may show. Crests: the default one plus every crest earned (team reward or favourite team).
 * Players: only owned ones. Coaches: unlocked by design goals of InaZurvivors (arenas, collection, ranks).
 */
import type { RosterEntry } from '../data/manifest';
import { teamNames } from '../data/sagas';
import type { SaveData } from './save';

/** The crest everybody has (Raimon, the first one exported). */
export const DEFAULT_EMBLEM = 1;

export function emblemUnlocked(save: SaveData, emblem: { teamId?: number; name: string }) {
  if (emblem.teamId === DEFAULT_EMBLEM) return true;
  return Object.entries(save.teamRewards).some(([team, r]) => r.crest && teamNames(team).includes(emblem.name));
}

const ownedIn = (save: SaveData, roster: RosterEntry[], rx: RegExp) =>
  roster.filter((p) => save.owned[String(p.id)] && p.teams.some((t) => rx.test(t))).length;

/** Requirement of the coach at position `index` of the exported list (not its unit id); `ok` says whether it is met. */
export function coachRequirement(save: SaveData, roster: RosterEntry[], index: number): { ok: boolean; label: string } {
  const wins = (map: string) => save.clearedMaps.includes(map);
  const anyRank = (r: string) => Object.values(save.clearedRanks ?? {}).some((l) => l.includes(r as never));
  switch (index) {
    case 0: return { ok: true, label: 'Disponible desde el principio' };
    case 1: return { ok: wins('raimon'), label: 'Supera el Instituto Raimon' };
    case 2: return { ok: wins('royal'), label: 'Supera la Royal Academy' };
    case 3: return { ok: ownedIn(save, roster, /alpino/i) >= 3, label: 'Ten 3 futbolistas del Alpino' };
    case 4: return { ok: ownedIn(save, roster, /claustro/i) >= 3, label: 'Ten 3 futbolistas del Claustro Sagrado' };
    case 5: return { ok: ownedIn(save, roster, /fauxshore/i) >= 3, label: 'Ten 3 futbolistas del Fauxshore' };
    case 6: return { ok: ownedIn(save, roster, /mary/i) >= 3, label: 'Ten 3 futbolistas del Mary Times' };
    default: return { ok: anyRank('A') || anyRank('S') || anyRank('X') || anyRank('Z'), label: 'Gana una arena en rango A o superior' };
  }
}

/** True when the icon currently set is still allowed; a save edited by hand can't keep a locked one. */
export function iconAllowed(save: SaveData, roster: RosterEntry[], emblems: { teamId?: number; name: string }[], coaches: { index?: number }[]) {
  const ic = save.profile.icon;
  if (ic.kind === 'player') return !!save.owned[String(ic.id)];
  if (ic.kind === 'coach') { const k = coaches.findIndex((c) => c.index === ic.id); return k >= 0 && coachRequirement(save, roster, k).ok; }
  const e = emblems.find((x) => x.teamId === ic.id);
  return !!e && emblemUnlocked(save, e);
}
