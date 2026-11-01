/**
 * Server time for anything that rotates by day or week (daily shop, weekly pass). Online players use the clock of the
 * Supabase server (RPC server_now, migration 20261101000200), so changing the device clock doesn't roll the shop or the pass;
 * guests and offline builds use the device clock. The offset is measured once per session.
 */
const URL_ = (import.meta.env?.VITE_SUPABASE_URL as string | undefined) ?? '';
const KEY = (import.meta.env?.VITE_SUPABASE_ANON_KEY as string | undefined) ?? '';

let offsetMs = 0;
let source: 'servidor' | 'dispositivo' = 'dispositivo';

/** Measures the server's clock once; never throws (falls back to the device clock). */
export async function syncServerTime(): Promise<void> {
  if (!URL_ || !KEY) return;
  try {
    const t0 = Date.now();
    // the Date response header is not readable cross-origin (CORS), so the server tells the time itself
    const res = await fetch(`${URL_}/rest/v1/rpc/server_now`, { method: 'POST', headers: { apikey: KEY, 'Content-Type': 'application/json' }, body: '{}', cache: 'no-store' });
    if (!res.ok) return; // function not deployed yet: device clock
    const server = new Date(await res.json() as string).getTime();
    if (Number.isNaN(server)) return;
    offsetMs = server - (t0 + Date.now()) / 2;
    source = 'servidor';
  } catch { /* offline: device clock */ }
}

export const serverNow = () => new Date(Date.now() + offsetMs);
export const timeSource = () => source;
