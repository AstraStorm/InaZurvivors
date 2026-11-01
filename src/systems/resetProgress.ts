/**
 * «Reiniciar progreso»: everything earned starts again, the identity stays. Different from «Eliminar cuenta», which
 * removes the account and frees the name. Pure helpers; the backup, the server call and the screen live in app.ts.
 */
import { newSave, type SaveData } from './save';

/** What the confirmation screen lists, read from the save that is about to be replaced. */
export interface ResetSummary {
  players: number; duplicates: number; ascended: number; coins: number; tokens: number; upgrades: number;
  kits: number; missionsClaimed: number; runs: number; wins: number; bests: number; hall: number; gear: number;
}

export function resetSummary(s: SaveData): ResetSummary {
  const owned = Object.values(s.owned ?? {});
  return {
    players: owned.length,
    duplicates: owned.reduce((n, o) => n + Math.max(0, o.copies - 1), 0),
    ascended: owned.filter((o) => o.ascMitico || o.hero).length,
    coins: s.coins, tokens: s.tokens,
    upgrades: Object.values(s.upgrades ?? {}).reduce((n, v) => n + v, 0),
    kits: Object.values(s.teamRewards ?? {}).filter((r) => r.kit).length,
    missionsClaimed: s.missions?.claimed?.length ?? 0,
    runs: s.stats?.runs ?? 0, wins: s.stats?.wins ?? 0,
    bests: Object.keys(s.bests ?? {}).length, hall: s.hall?.length ?? 0, gear: s.gear?.owned?.length ?? 0,
  };
}

/**
 * The save of a brand-new player, keeping only who you are and how you like to play: the global name (an online
 * account keeps it, locked), the settings and the devlog already read. The intro, the profile creation with its
 * favourite team and the 5-footballer welcome draft, and the tutorial all come back. `progressEpoch` goes up so any
 * older copy (another browser, the cloud before the reset) is recognised as stale.
 */
export function freshProgress(old: SaveData): SaveData {
  const s = newSave([], null);
  s.settings = { ...old.settings };
  s.devlogSeen = old.devlogSeen;
  s.progressEpoch = (old.progressEpoch ?? 0) + 1;
  s.cloudVersion = old.cloudVersion;
  if (old.onlineName) {
    s.onlineName = old.onlineName;
    s.profile.name = old.onlineName;
    s.nameLocked = true;
  } else {
    s.profile.name = old.profile?.name ?? s.profile.name; // a guest picks a name again; the old one is only suggested
  }
  return s;
}

/** Epoch of any save-like value (0 before the first reset). */
export const epochOf = (s: unknown) => {
  const e = (s as { progressEpoch?: unknown } | null)?.progressEpoch;
  return typeof e === 'number' && Number.isFinite(e) ? e : 0;
};
