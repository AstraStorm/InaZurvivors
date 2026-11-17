/**
 * What the profile may show. Crests: the default one plus every crest earned (team reward or favourite team).
 * Players: only owned ones. Coaches: unlocked by design goals of InaZurvivors (arenas, collection, ranks), and the coaches
 * of the machines (Mi Equipo) only once they are owned.
 */
import type { RosterEntry } from '../data/manifest';
import { teamNames } from '../data/sagas';
import { COACHES, type CoachDef } from '../data/coaches';
import type { SaveData } from './save';
import { sendokaiStart } from './collabEvent';
import { tr } from '../i18n/i18n';

/** The crest everybody has (Raimon, the first one exported). */
export const DEFAULT_EMBLEM = 1;

export function emblemUnlocked(save: SaveData, emblem: { teamId?: number; name: string }) {
  if (emblem.teamId === DEFAULT_EMBLEM) return true;
  return Object.entries(save.teamRewards).some(([team, r]) => r.crest && teamNames(team).includes(emblem.name));
}

const ownedIn = (save: SaveData, roster: RosterEntry[], rx: RegExp) =>
  roster.filter((p) => save.owned[String(p.id)] && p.teams.some((t) => rx.test(t))).length;
const hasCoach = (save: SaveData, id: string) => !!save.coaches?.owned.includes(id);

/** IE2 portraits that are also a coach of the machines: owning that coach unlocks the portrait too */
const SAME_COACH: Record<number, string> = { 212: 'hillman', 1035: 'ray-dark', 1087: 'alpino', 1088: 'claustro', 1089: 'fauxshore', 1090: 'mary-times' };

/** Requirement of the IE2 coach portrait of unit `index` (manifest profile.coaches); `ok` says whether it is met. */
export function coachRequirement(save: SaveData, roster: RosterEntry[], index: number): { ok: boolean; label: string } {
  const wins = (map: string) => save.clearedMaps.includes(map);
  const anyRank = (r: string) => Object.values(save.clearedRanks ?? {}).some((l) => l.includes(r as never));
  const r = (() => {
    switch (index) {
      case 212: return { ok: true, label: tr('Disponible desde el principio') };
      case 1034: return { ok: wins('raimon'), label: tr('Supera el Instituto Raimon') };
      case 1035: return { ok: wins('royal'), label: tr('Supera la Royal Academy') };
      case 1087: return { ok: ownedIn(save, roster, /alpino/i) >= 3, label: tr('Ten 3 futbolistas del Alpino') };
      case 1088: return { ok: ownedIn(save, roster, /claustro/i) >= 3, label: tr('Ten 3 futbolistas del Claustro Sagrado') };
      case 1089: return { ok: ownedIn(save, roster, /fauxshore/i) >= 3, label: tr('Ten 3 futbolistas del Fauxshore') };
      case 1090: return { ok: ownedIn(save, roster, /mary/i) >= 3, label: tr('Ten 3 futbolistas del Mary Times') };
      default: return { ok: anyRank('A') || anyRank('S') || anyRank('X') || anyRank('Z'), label: tr('Gana una arena en rango A o superior') };
    }
  })();
  return SAME_COACH[index] && hasCoach(save, SAME_COACH[index]) ? { ...r, ok: true } : r;
}

/** Profile icon id of a machine coach: its own range, so it never meets an IE2 unit index; stable from the coach id */
export function machineCoachIcon(id: string) {
  let h = 0;
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) % 90000;
  return 300000 + h;
}

/** machines not out yet: their coaches stay hidden from the profile (unless someone already owns them) */
const UNRELEASED_MACHINES = new Set<string>(['vr']);
/** (author) a coach shows in the profile once he is out: the collab ones from the day their event opens */
function coachReleased(c: CoachDef, now: number) {
  if (UNRELEASED_MACHINES.has(c.machine)) return false;
  if (c.machine === 'sendokai') return now >= sendokaiStart();
  return true;
}

/** Machine coaches for the profile (the ones already shown by an IE2 portrait are left out): unlocked only when owned. */
export function machineCoachIcons(save: SaveData, now: number) {
  const shown = new Set(Object.values(SAME_COACH));
  return COACHES.filter((c) => !shown.has(c.id) && (hasCoach(save, c.id) || coachReleased(c, now)))
    .map((c) => ({ coach: c, icon: machineCoachIcon(c.id), ok: hasCoach(save, c.id),
      why: c.reward ? tr('Consigue a los cinco futbolistas del Desafío Sendokai') : c.altar ? tr('Desbloquéala en el Altar de la Piedra Alius') : tr('Consíguelo en las máquinas de fichajes') }));
}

/** True when the icon currently set is still allowed; a save edited by hand can't keep a locked one. */
export function iconAllowed(save: SaveData, roster: RosterEntry[], emblems: { teamId?: number; name: string }[], coaches: { index?: number }[]) {
  const ic = save.profile.icon;
  if (ic.kind === 'player') return !!save.owned[String(ic.id)];
  if (ic.kind === 'coach') {
    if (ic.id >= 300000) return COACHES.some((c) => machineCoachIcon(c.id) === ic.id && hasCoach(save, c.id));
    return coaches.some((c) => c.index === ic.id) && coachRequirement(save, roster, ic.id).ok;
  }
  const e = emblems.find((x) => x.teamId === ic.id);
  return !!e && emblemUnlocked(save, e);
}
