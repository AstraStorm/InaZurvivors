import type { RunResult } from './economy';

/**
 * BUG-1BDD9F9B: the run in progress, saved every few seconds. iOS reloads a tab that runs short of memory (or one left
 * in the background) and the whole run was lost; the next load pays this instead (app.recoverRun).
 */
const KEY = 'iz-run-checkpoint';
/** a checkpoint younger than this may still belong to a run going on in another tab (they are written every 10 s) */
export const RUN_CP_QUIET = 25_000;
/** older ones are dropped unpaid */
export const RUN_CP_MAX_AGE = 7 * 86_400_000;

export interface RunCheckpoint { at: number; r: RunResult & { level: number } }

export function saveRunCheckpoint(r: RunResult & { level: number }) {
  try { localStorage.setItem(KEY, JSON.stringify({ at: Date.now(), r })); } catch { /* full or blocked storage: nothing to keep */ }
}

export function readRunCheckpoint(): RunCheckpoint | null {
  try {
    const cp = JSON.parse(localStorage.getItem(KEY) || 'null') as RunCheckpoint | null;
    return cp && typeof cp.at === 'number' && cp.r?.mapId ? cp : null;
  } catch { return null; }
}

export function clearRunCheckpoint() {
  try { localStorage.removeItem(KEY); } catch { /* nothing */ }
}
