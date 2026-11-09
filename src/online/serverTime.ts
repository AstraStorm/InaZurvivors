/**
 * Server time for anything that rotates by day or week (daily shop, weekly pass). Online players use the clock of the
 * Supabase server (RPC server_now, migration 20261101000200), so changing the device clock doesn't roll the shop or the pass;
 * guests and offline builds use the device clock. The offset is measured once per session.
 */
const URL_ = (import.meta.env?.VITE_SUPABASE_URL as string | undefined) ?? '';
const KEY = (import.meta.env?.VITE_SUPABASE_ANON_KEY as string | undefined) ?? '';

let offsetMs = 0;
let source: 'servidor' | 'dispositivo' = 'dispositivo';
/** Fix 1.23: once the server has answered, time runs on the monotonic clock (performance.now), which changing the
 *  device's date doesn't move; before, the offset was added to Date.now() and a new date on the PC moved it too */
let serverAt = 0, perfAt = 0;
/** (dev only, never on localhost where the author's save lives) ?qa_dias=N moves the game's clock N days forward, e.g. to
 *  preview an event before it opens; kept for the tab's session, ?qa_dias=0 turns it off */
const qaShiftMs = (() => {
  if (!import.meta.env?.DEV || typeof location === 'undefined' || location.hostname === 'localhost') return 0;
  try {
    const q = new URLSearchParams(location.search).get('qa_dias');
    if (q !== null) sessionStorage.setItem('qa-dias', q);
    return (Number(sessionStorage.getItem('qa-dias')) || 0) * 86_400_000;
  } catch { return 0; }
})();

/** Measures the server's clock once; never throws (falls back to the device clock). */
export async function syncServerTime(): Promise<void> {
  if (!URL_ || !KEY) return;
  try {
    const t0 = Date.now();
    // the Date response header is not readable cross-origin (CORS), so the server tells the time itself
    const res = await fetch(`${URL_}/rest/v1/rpc/server_now`, { method: 'POST', headers: { apikey: KEY, 'Content-Type': 'application/json' }, body: '{}', cache: 'no-store', signal: AbortSignal.timeout(8000) }); // Fix 1.32: never hangs
    if (!res.ok) return; // function not deployed yet: device clock
    const server = new Date(await res.json() as string).getTime();
    if (Number.isNaN(server)) return;
    offsetMs = server - (t0 + Date.now()) / 2;
    serverAt = server; perfAt = performance.now();
    source = 'servidor';
  } catch { /* offline: device clock */ }
}

export const serverNow = () => new Date((source === 'servidor' ? serverAt + (performance.now() - perfAt) : Date.now() + offsetMs) + qaShiftMs);
/** Rewards that come back each day or week (pass, daily and weekly missions) only move on the server's clock */
export const trustedClock = () => source === 'servidor';
export const timeSource = () => source;
