// pre-2.0: short-lived TURN credentials for a co-op room (Cloudflare Realtime TURN). The game calls it with the player's
// own session and the room code; coop_turn_claim decides (the player must be in a paired room, 20 a day each, a monthly
// cap for everyone) and only then Cloudflare is asked for ICE servers valid for a few hours. Secrets live only here, as
// Edge Function secrets: CF_TURN_KEY_ID and CF_TURN_API_TOKEN. Without them, or over a cap, the answer has no servers
// and the game tries a direct connection ({ iceServers: [], reason }).
const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
const TTL_SEC = 4 * 3600; // longer than any run, endless included

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'method' }, 405);
  const auth = req.headers.get('Authorization') ?? '';
  const { code } = await req.json().catch(() => ({ code: '' }));
  if (!/^[A-Za-z2-9]{6}$/.test(String(code))) return json({ error: 'code' }, 400);

  const url = Deno.env.get('SUPABASE_URL')!;
  const anon = Deno.env.get('SUPABASE_ANON_KEY')!;
  const r = await fetch(`${url}/rest/v1/rpc/coop_turn_claim`, {
    method: 'POST', headers: { apikey: anon, Authorization: auth, 'Content-Type': 'application/json' }, body: JSON.stringify({ p_code: code }),
  });
  if (!r.ok) return json({ iceServers: [], reason: 'no autorizado' }, r.status === 401 ? 401 : 403);
  if (!(await r.json())) return json({ iceServers: [], reason: 'límite de servidor de paso alcanzado' });

  const keyId = Deno.env.get('CF_TURN_KEY_ID'), token = Deno.env.get('CF_TURN_API_TOKEN');
  if (!keyId || !token) return json({ iceServers: [], reason: 'servidor de paso sin configurar' });
  const call = (path: string) => fetch(`https://rtc.live.cloudflare.com/v1/turn/keys/${keyId}/credentials/${path}`, {
    method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ ttl: TTL_SEC }),
  });
  let cf = await call('generate-ice-servers');
  if (cf.status === 404) cf = await call('generate'); // older endpoint: one iceServers object instead of a list
  if (!cf.ok) return json({ iceServers: [], reason: `Cloudflare respondió ${cf.status}` });
  const body = await cf.json();
  const list = Array.isArray(body.iceServers) ? body.iceServers : body.iceServers ? [body.iceServers] : [];
  return json({ iceServers: list, ttl: TTL_SEC });
});
