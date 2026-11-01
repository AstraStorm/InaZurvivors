// Notice to the author when a player sends a bug report. The game calls it right after submit_bug_report, with the
// player's own session: the function claims that report once (claim_bug_notification only answers to its owner and only
// the first time) and, if a mail provider is configured, emails a summary. Secrets live only here, as Edge Function
// secrets: RESEND_API_KEY, NOTIFY_EMAIL (where to send) and optionally NOTIFY_FROM. Without them nothing is sent and the
// report is still saved and visible in the admin panel; the answer says so ({ sent: false, reason }).
const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'method' }, 405);
  const auth = req.headers.get('Authorization') ?? '';
  const { code } = await req.json().catch(() => ({ code: '' }));
  if (!/^BUG-[0-9A-F]{8}$/.test(String(code))) return json({ error: 'code' }, 400);

  const url = Deno.env.get('SUPABASE_URL')!;
  const anon = Deno.env.get('SUPABASE_ANON_KEY')!;
  const r = await fetch(`${url}/rest/v1/rpc/claim_bug_notification`, {
    method: 'POST', headers: { apikey: anon, Authorization: auth, 'Content-Type': 'application/json' }, body: JSON.stringify({ p_code: code }),
  });
  if (!r.ok) return json({ sent: false, reason: 'no autorizado' }, r.status === 401 ? 401 : 403);
  const rows = await r.json();
  if (!rows.length) return json({ sent: false, reason: 'ya avisado o no es tuyo' });
  const b = rows[0];

  const key = Deno.env.get('RESEND_API_KEY'), to = Deno.env.get('NOTIFY_EMAIL');
  if (!key || !to) return json({ sent: false, reason: 'sin proveedor de correo configurado' });
  const text = [`${b.code} · ${b.category} · gravedad ${b.severity}`, `Versión: ${b.game_version || '?'} · Jugador: ${b.username || '(sin nombre)'}`, '', b.title, '', b.description,
    '', 'Ábrelo en el panel de bugs del juego (Ajustes » Panel de bugs).'].join('\n');
  const mail = await fetch('https://api.resend.com/emails', {
    method: 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: Deno.env.get('NOTIFY_FROM') ?? 'InaZurivors <onboarding@resend.dev>', to: [to], subject: `[InaZurivors] ${b.code}: ${b.title}`, text }),
  });
  return json(mail.ok ? { sent: true } : { sent: false, reason: `el proveedor respondió ${mail.status}` });
});
