/**
 * Cloud save rules: never overwrite progress by accident. Before replacing anything the replaced copy is kept in
 * localStorage (recoverable), a summary shows what each copy contains, and writes carry the version they were based
 * on (put_save refuses stale ones). Pure helpers here; the network calls live in client.ts.
 */
import type { SaveData } from '../systems/save';

export interface SaveSummary { players: number; coins: number; tokens: number; runs: number; wins: number; heroes: number; name: string }

export function summarize(s: Pick<SaveData, 'owned' | 'coins' | 'tokens' | 'stats' | 'profile'>): SaveSummary {
  const owned = Object.values(s.owned ?? {});
  return { players: owned.length, coins: s.coins, tokens: s.tokens, runs: s.stats?.runs ?? 0, wins: s.stats?.wins ?? 0, heroes: owned.filter((o) => o.hero).length, name: s.profile?.name ?? '' };
}

/** Progress score to suggest which copy is further ahead (the player always decides). */
export const progressOf = (x: SaveSummary) => x.players * 10 + x.wins * 25 + x.runs * 3 + x.heroes * 200;

/** What to do when an account is opened on this device. */
export function linkPlan(local: SaveSummary | null, cloud: SaveSummary | null): 'subir-local' | 'bajar-nube' | 'elegir' | 'nada' {
  if (!cloud && local && local.players > 0) return 'subir-local';
  if (cloud && (!local || local.players === 0)) return 'bajar-nube';
  if (cloud && local) return 'elegir';
  return 'nada';
}

/** Keeps a copy that is about to be replaced; the key carries the time so several can coexist. */
export function backup(kind: 'local' | 'nube', data: unknown, now = Date.now()) {
  try { localStorage.setItem(`ie-survivors-save.backup-${kind}-${now}`, JSON.stringify(data)); return true; } catch { return false; }
}
