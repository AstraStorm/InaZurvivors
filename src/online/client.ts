/**
 * Online client (Supabase Auth with Google as the only provider + Postgres through its REST API, plain fetch, no SDK). It is OFF unless the build has
 * VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY: the anon key is public by design; no secret ever goes in the browser.
 * Everything that writes goes through the SQL functions in supabase/schema.sql, which check the caller's identity.
 */
import type { Rarity } from '../data/manifest';

const URL_ = (import.meta.env?.VITE_SUPABASE_URL as string | undefined) ?? '';
const KEY = (import.meta.env?.VITE_SUPABASE_ANON_KEY as string | undefined) ?? '';
const SESSION = 'inazurivors-session';

export const onlineConfigured = () => !!URL_ && !!KEY;

interface Session { access_token: string; refresh_token: string; expires_at: number; user: { id: string; email?: string } }

function readSession(): Session | null {
  try { return JSON.parse(localStorage.getItem(SESSION) ?? 'null'); } catch { return null; }
}
function writeSession(s: Session | null) {
  try { if (s) localStorage.setItem(SESSION, JSON.stringify(s)); else localStorage.removeItem(SESSION); } catch { /* storage blocked */ }
}

/** Spanish text for the Supabase Auth / database errors a player can actually hit. Codes the UI matches on (taken,
 * version_conflict, too_fast) stay raw on purpose: the UI words those itself. */
const ERRORS: Record<string, string> = {
  over_request_rate_limit: 'Demasiados intentos seguidos. Espera un momento.',
  flow_state_not_found: 'El inicio de sesión caducó. Vuelve a pulsar «Continuar con Google».',
  flow_state_expired: 'El inicio de sesión caducó. Vuelve a pulsar «Continuar con Google».',
  bad_code_verifier: 'El inicio de sesión empezó en otra pestaña o navegador. Vuelve a pulsar «Continuar con Google».',
  provider_disabled: 'El inicio de sesión con Google no está disponible ahora mismo.',
  signup_disabled: 'Ahora mismo no se admiten cuentas nuevas.',
  session_not_found: 'Tu sesión ha caducado. Vuelve a entrar con Google.',
  invalid_username: 'Nombre no válido: 3-20 letras, números o _.',
  already_has_username: 'Tu cuenta ya tiene un nombre global.',
  room_not_found: 'No hay ninguna sala abierta con ese código (o ya caducó).',
  room_full: 'Esa sala ya tiene dos jugadores.',
  own_room: 'Esa sala es tuya: pásale el código a tu compañero.',
  coop_daily_limit: 'Has creado demasiadas salas hoy. Vuelve mañana.',
  friend_not_found: 'No hay ningún jugador con ese nombre global.',
  friend_self: 'Ese eres tú.',
  friend_daily_limit: 'Has enviado muchas solicitudes hoy. Vuelve mañana.',
  friend_full: 'Tienes 100 amigos: quita alguno para añadir otro.',
  not_friends: 'Solo puedes invitar a tus amigos.',
  invite_limit: 'Has enviado muchas invitaciones esta hora.',
};

/** Fix 1.32: no call may hang the game: after this many ms it fails with a clear message (the server was saturated) */
export const HTTP_TIMEOUT_MS = 10000;
async function http(path: string, body: unknown, token?: string) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), HTTP_TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(`${URL_}${path}`, {
      method: 'POST',
      headers: { apikey: KEY, 'Content-Type': 'application/json', Authorization: `Bearer ${token ?? KEY}` },
      body: JSON.stringify(body),
      signal: ctl.signal,
    });
  } catch (e) {
    throw new Error((e as Error).name === 'AbortError' ? 'El servidor no responde ahora mismo; inténtalo en un rato' : 'Sin conexión con el servidor');
  } finally { clearTimeout(timer); }
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const raw: string = data?.message ?? data?.msg ?? data?.error_description ?? `HTTP ${res.status}`;
    throw new Error(ERRORS[data?.error_code ?? ''] ?? ERRORS[raw] ?? raw);
  }
  return data;
}

async function token(): Promise<string | undefined> {
  let s = readSession();
  if (!s) return undefined;
  if (s.expires_at * 1000 < Date.now() + 30000) {
    try {
      const r = await http('/auth/v1/token?grant_type=refresh_token', { refresh_token: s.refresh_token });
      s = { ...r, expires_at: Math.floor(Date.now() / 1000) + r.expires_in } as Session;
      writeSession(s);
    } catch { writeSession(null); return undefined; }
  }
  return s.access_token;
}

export const signedIn = () => !!readSession();
export const signedEmail = () => readSession()?.user.email ?? '';

/** Where Supabase sends people back after Google (the game's own URL; it must be in the project's Redirect URLs). */
const back = () => `${location.origin}${location.pathname}`;
const PKCE = 'inazurivors-pkce';

const b64url = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

/**
 * «Continuar con Google»: the only online sign-in. PKCE flow: a one-time secret stays in this browser, Google and
 * Supabase send back a short code, and only this browser can trade it for a session (consumeAuthRedirect).
 */
export async function signInWithGoogle() {
  const verifier = b64url(crypto.getRandomValues(new Uint8Array(48)));
  const challenge = b64url(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier))));
  try { localStorage.setItem(PKCE, verifier); } catch { /* storage blocked: the exchange will fail and say so */ }
  const q = new URLSearchParams({ provider: 'google', redirect_to: back(), code_challenge: challenge, code_challenge_method: 's256' });
  location.assign(`${URL_}/auth/v1/authorize?${q}`);
}

export interface AuthReturn { signedIn: boolean; error?: string }

/**
 * Coming back from Google: ?code=… (PKCE) opens the session; ?error=… explains why not. The address bar is cleaned
 * either way, so a reload never repeats it. Returns null when the page was not opened by a sign-in.
 */
export async function consumeAuthRedirect(): Promise<AuthReturn | null> {
  const q = new URLSearchParams(location.search);
  const h = new URLSearchParams(location.hash.slice(1));
  const code = q.get('code');
  const error = q.get('error_description') ?? q.get('error') ?? h.get('error_description') ?? h.get('error');
  if (!code && !error && !h.get('access_token')) return null;
  history.replaceState(null, '', location.pathname);
  if (error) return { signedIn: false, error: error.replace(/\+/g, ' ') };
  try {
    if (code) {
      let verifier: string | null = null;
      try { verifier = localStorage.getItem(PKCE); localStorage.removeItem(PKCE); } catch { /* blocked */ }
      if (!verifier) return { signedIn: false, error: 'El inicio de sesión empezó en otra pestaña o navegador. Vuelve a pulsar «Continuar con Google».' };
      const r = await http('/auth/v1/token?grant_type=pkce', { auth_code: code, code_verifier: verifier });
      writeSession({ ...r, expires_at: Math.floor(Date.now() / 1000) + r.expires_in });
    } else {
      writeSession({ access_token: h.get('access_token')!, refresh_token: h.get('refresh_token') ?? '', expires_at: Math.floor(Date.now() / 1000) + Number(h.get('expires_in') ?? 3600), user: { id: '' } });
    }
    return { signedIn: true };
  } catch (e) { return { signedIn: false, error: (e as Error).message }; }
}

/** Ends the session on this device (and revokes its refresh token on the server when possible). */
export function signOut() {
  const s = readSession();
  writeSession(null);
  if (s) void fetch(`${URL_}/auth/v1/logout?scope=local`, { method: 'POST', headers: { apikey: KEY, Authorization: `Bearer ${s.access_token}` } }).catch(() => undefined);
}


async function rpc<T>(fn: string, args: Record<string, unknown>, auth = true): Promise<T> {
  return http(`/rest/v1/rpc/${fn}`, args, auth ? await token() : undefined) as Promise<T>;
}

/** Informative only: the reservation is what really decides. */
export const usernameAvailable = (name: string) => rpc<boolean>('username_available', { name }, false);
export const reserveUsername = (name: string, avatar = '', crest = '') => rpc<string>('reserve_username', { name, avatar, crest });
/** The signed-in account's global profile; null on its first connection (no name reserved yet). */
export interface OnlineProfile { username: string; avatar: string; crest: string }
export const myProfile = async () => (await rpc<OnlineProfile[]>('my_profile', {}))[0] ?? null;

export interface BoardRow { pos: number; username: string; avatar: string; crest: string; map: string; rank: string; time_sec: number; damage: number; captain_id: number; score?: number }
/** Fix 1.31: order 'score' (points, the default), 'rank', 'time' or 'damage'; map and rank are the categories */
export interface BoardQuery { map: string | null; rank: string | null; order: 'score' | 'rank' | 'time' | 'damage' }

export const leaderboard = (q: BoardQuery) => rpc<BoardRow[]>('leaderboard', { p_map: q.map, p_rank: q.rank, p_order: q.order, p_limit: 15 }, false);
/** v1.6: another player's public club (public_profile.sql); null when nobody has that name */
export interface PublicSquadMember { id: number; stars: number; hero: boolean; heroStars: number; ascRarity: string | null; asc: boolean; aura: string | null }
export interface PublicProfile {
  username: string; avatar: string; crest: string; joined: string; favorite: string; kit: string; captain: number | null;
  icon: { kind: 'emblem' | 'player' | 'coach'; id: number } | null;
  stats: { runs: number; wins: number; kills: number; bestTimeSec: number; bestEndless: number; /** 1.76 */ pulls?: number };
  owned: number; heroes: number; squad: PublicSquadMember[];
  /** 1.76: the collection (stars, ascension, HÉROE, training) and the achievements claimed, for the same card as the own Perfil */
  collection?: Record<string, { stars?: number; hero?: boolean; heroStars?: number; ascMitico?: boolean; ascRarity?: Rarity; train?: Partial<Record<string, number>> }>;
  achievements?: string[];
  /** v1.65: the banner they show (an id; unknown ids are ignored) */
  banner?: string | null;
  /** v1.65: avatar frame worn */
  frame?: string | null;
  marks: { map: string; rank: string; time_sec: number; damage: number; captain_id: number }[];
}
// ---- 1.8: GTS (migration 20261106000000_gts)
export interface GtsOffer { id: number; username: string; give_id: number; want_id: number; created_at: string }
export interface GtsFeedRow { id: number; username: string; give_id: number; want_id: number; status: 'open' | 'traded'; at: string }
export const gtsDeposit = (give: number, want: number) => rpc<number>('gts_deposit', { p_give: give, p_want: want });
export const gtsWithdraw = (id: number) => rpc<boolean>('gts_withdraw', { p_id: id });
export const gtsTake = (id: number) => rpc<{ id: number; give: number; get: number }>('gts_take', { p_id: id });
export const gtsMine = () => rpc<import('../systems/gts').GtsRow[]>('gts_mine', {});
export const gtsSearch = (get: number | null, give: number | null) => rpc<GtsOffer[]>('gts_search', { p_get: get, p_give: give }, false);
export const gtsFeed = () => rpc<GtsFeedRow[]>('gts_feed', {}, false);
export const publicProfile = (username: string) => rpc<PublicProfile | null>('public_profile', { p_username: username }, false);
/** v1.65: the banners shown by these names (profile_banners.sql); names without one are left out */
export const profileBanners = (usernames: string[]) => rpc<{ username: string; banner: string }[]>('profile_banners', { p_usernames: usernames.slice(0, 60) }, false);
export const profileFrames = (usernames: string[]) => rpc<{ username: string; frame: string }[]>('profile_frames', { p_usernames: usernames.slice(0, 60) }, false);
export const myPosition = async (q: BoardQuery) => (await rpc<BoardRow[]>('my_position', { p_map: q.map, p_rank: q.rank, p_order: q.order }))[0] ?? null;

export const submitScore = (runId: string, map: string, rank: string, timeSec: number, damage: number, captainId: number) =>
  rpc<string>('submit_score', { p_run_id: runId, p_map: map, p_rank: rank, p_time_sec: Math.floor(timeSec), p_damage: Math.floor(damage), p_captain_id: captainId });

export const putCloudSave = (data: unknown, expected: number) => rpc<number>('put_save', { p_data: data, p_expected: expected });
export interface CloudSave { data: unknown; version: number; updated_at: string }
export const getCloudSave = async () => (await rpc<CloudSave[]>('get_save', {}))[0] ?? null;
/** «Reiniciar progreso» on the server: backup, fresh save with a higher epoch, own ranking marks removed. Account and name stay. */
export const resetMyProgress = async (fresh: unknown) => (await rpc<{ version: number; epoch: number }[]>('reset_my_progress', { p_data: fresh }))[0];
// ---- bug reports (see systems/bugReport.ts); screenshots go to a private Storage bucket, in the sender's own folder
const BUCKET = 'bug-screenshots';
export interface BugRow { id?: string; code: string; category: string; severity: string; title: string; status: string; created_at: string; has_screenshot?: boolean;
  description?: string; steps?: string; username?: string | null; game_version?: string; build?: string; browser?: string; os?: string; screen?: string; map?: string;
  difficulty?: string; run_time_sec?: number | null; screenshot_path?: string | null; admin_notes?: string; updated_at?: string;
  /** 1.88: the answer the reporter sees */ reply?: string }
export interface BugFilter { category: string | null; severity: string | null; status: string | null; from: string | null; to: string | null; order: 'fecha' | 'prioridad' }

/** The account id, read from the session token itself (it names the screenshot folder). */
export function accountId() {
  const t = readSession()?.access_token;
  if (!t) return '';
  try { return JSON.parse(atob(t.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))).sub as string; } catch { return ''; }
}
export async function uploadShot(path: string, blob: Blob) {
  const r = await fetch(`${URL_}/storage/v1/object/${BUCKET}/${path}`, { method: 'POST', headers: { apikey: KEY, Authorization: `Bearer ${await token()}`, 'Content-Type': blob.type }, body: blob });
  if (r.status === 400 || r.status === 409) { const d = await r.json().catch(() => null); if (/exists|duplicate/i.test(`${d?.error} ${d?.message}`)) return; throw new Error('La captura no se pudo subir.'); }
  if (!r.ok) throw new Error('La captura no se pudo subir.');
}
/** A private screenshot as a local URL: only its owner and the admin get the file. */
export async function shotUrl(path: string) {
  const r = await fetch(`${URL_}/storage/v1/object/authenticated/${BUCKET}/${path}`, { headers: { apikey: KEY, Authorization: `Bearer ${await token()}` } });
  if (!r.ok) throw new Error('No se pudo abrir la captura.');
  return URL.createObjectURL(await r.blob());
}
export const deleteShot = async (path: string) => { await fetch(`${URL_}/storage/v1/object/${BUCKET}/${path}`, { method: 'DELETE', headers: { apikey: KEY, Authorization: `Bearer ${await token()}` } }); };
export const submitBugReport = (a: { clientId: string; category: string; severity: string; title: string; description: string; steps: string; meta: unknown; screenshot: string | null }) =>
  rpc<string>('submit_bug_report', { p_client_id: a.clientId, p_category: a.category, p_severity: a.severity, p_title: a.title, p_description: a.description, p_steps: a.steps, p_meta: a.meta, p_screenshot: a.screenshot });
export const myBugReports = () => rpc<BugRow[]>('my_bug_reports', {});
export const deleteMyBugReports = () => rpc<(string | null)[]>('delete_my_bug_reports', {});
export const amIAdmin = () => rpc<boolean>('am_i_admin', {});
/** Fix 1.12: promotional codes (one per account, decided on the server) */
export const redeemCode = (code: string, alreadyApplied = false) =>
  rpc<{ status: 'ok' | 'used' | 'invalid' | 'linked'; reward?: { tokens: number; coins: number; player: number | null; eventTokens?: number; egTokens?: number; pennants?: string[] } }>('redeem_code', { p_code: code, p_already_applied: alreadyApplied });
/** 1.85: bug bounty — rewards for the player's reports the admin marked «corregido», taken once (server marks them claimed) */
/** 1.88: replies to the player's reports, and reports fixed or discarded, not yet shown (taken once) */
/** 1.88: recommendations (migration 20261106000600_suggestions.sql) */
export interface SuggestionRow { id?: string; code: string; title: string; status: string; created_at: string; description?: string; username?: string | null; reply?: string }
export const submitSuggestion = (title: string, description: string) => rpc<string>('submit_suggestion', { p_title: title, p_description: description });
export const mySuggestions = () => rpc<SuggestionRow[]>('my_suggestions', {});
export const adminSuggestions = (status: string | null) => rpc<SuggestionRow[]>('admin_suggestions', { p_status: status });
export const adminUpdateSuggestion = (code: string, status: string | null, reply: string | null) => rpc<string>('admin_update_suggestion', { p_code: code, p_status: status, p_reply: reply });
export const claimSuggestionNotices = () => rpc<{ code: string; title: string; status: string; reply: string }[]>('claim_suggestion_notices', {});
export const claimBugNotices = () => rpc<{ code: string; title: string; status: string; reply: string }[]>('claim_bug_notices', {});
export const claimBugRewards = () => rpc<{ code: string; title: string; tokens: number }[]>('claim_bug_rewards', {});
export const adminBugReports = (f: BugFilter) => rpc<BugRow[]>('admin_bug_reports', { p_category: f.category, p_severity: f.severity, p_status: f.status, p_from: f.from, p_to: f.to, p_order: f.order, p_limit: 200 });
/** Fix 1.41: players panel (admins only; the server refuses everyone else). Guests play locally and are not counted. */
export interface AdminPlayerRow { username: string | null; created_at: string; last_seen: string | null; runs: number; kills: number; best_time: number; owned: number; ranked_runs: number }
export interface AdminPlayerStats { accounts: number; with_name: number; played: number; runs: number; kills: number; ranked_runs: number; active_24h: number; active_7d: number; new_7d: number; players: AdminPlayerRow[] }
export const adminPlayerStats = (limit = 200) => rpc<AdminPlayerStats>('admin_player_stats', { p_limit: limit });
/** Métricas tab of the players panel (admins only): Madrid days, peak hours, retention, maps/ranks/captains, social use. */
export interface AdminMetrics {
  days: number; daily: { day: string; new: number; players: number; runs: number }[]; hours: number[]; online_now: number; online_1h: number;
  retention: { d1: number; d1_base: number; d7: number; d7_base: number }; totals: { runs: number; wins: number; pulls: number };
  maps: { map: string; n: number }[]; ranks: { rank: string; n: number }[]; captains: { id: number; n: number }[];
  social: { friendships: number; clans: number; clan_members: number; coop_7d: number; tierlists: number; bugs_open: number; ideas_open: number };
}
export const adminMetrics = (days = 30) => rpc<AdminMetrics>('admin_metrics', { p_days: days });
export const adminUpdateBug =(code: string, status: string | null, notes: string | null, reply: string | null = null) => rpc<string>('admin_update_bug', { p_code: code, p_status: status, p_notes: notes, p_reply: reply });
/** Asks the server to tell the author. Best effort: the report is already saved whatever happens here. */
export async function notifyBug(code: string) {
  try {
    const r = await fetch(`${URL_}/functions/v1/notify-bug`, { method: 'POST', headers: { apikey: KEY, Authorization: `Bearer ${await token()}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ code }) });
    return await r.json() as { sent?: boolean; reason?: string };
  } catch { return { sent: false, reason: 'sin conexión' }; }
}

/** 1.9: tier lists (migration 20261107000400_tierlists.sql): one per account, everyone reads the latest */
export interface TierlistRow { username: string; topic: string; tiers: Record<string, number[]>; updated_at: string }
export const submitTierlist = (topic: string, tiers: Record<string, number[]>) => rpc<string>('submit_tierlist', { p_topic: topic, p_tiers: tiers });
export const tierlistFeed = (limit = 20) => rpc<TierlistRow[]>('tierlist_feed', { p_limit: limit }, false);
export const myTierlist = async () => (await rpc<(TierlistRow & { hidden: boolean })[]>('my_tierlist', {}))[0] ?? null;
export const deleteMyTierlist = () => rpc<boolean>('delete_my_tierlist', {});

/** 1.93: clans (migration 20261108000000_clans.sql) */
export interface ClanRow { id: number; name: string; crest: string; kit: string; members: number; week_points?: number; points?: number; pos?: number; mode?: 'abierto' | 'solicitud' }
export type ClanRole = 'lider' | 'oficial' | 'miembro';
export interface ClanMember { username: string; avatar: string; role: ClanRole; today: number; week: number }
export interface ClanMission { id: string; goal: number; coins: number; tokens: number; progress: number; claimed: boolean }
export interface MyClan { id: number; name: string; crest: string; kit: string; members: number; me: ClanRole; mode: 'abierto' | 'solicitud'; requests: number; runsToday: number; weekPoints: number;
  pos: number | null; clans: number; roster: ClanMember[]; missions: ClanMission[] }
export interface ClanPrize { week: string; clan: string; pos: number; tier: 'top1' | 'top3' | 'top8' | 'resto'; coins: number; tokens: number }
export const clanCreate = (name: string, crest: string, kit: string) => rpc<number>('clan_create', { p_name: name, p_crest: crest, p_kit: kit });
export const clanUpdate = (name: string | null, crest: string | null, kit: string | null, mode: 'abierto' | 'solicitud' | null = null) => rpc<boolean>('clan_update', { p_name: name, p_crest: crest, p_kit: kit, p_mode: mode });
/** joins an open clan at once ('joined') or leaves a request ('requested') */
export const clanRequest = (id: number) => rpc<'joined' | 'requested'>('clan_request', { p_clan: id });
export const clanCancelRequest = (id: number) => rpc<boolean>('clan_cancel_request', { p_clan: id });
export const myClanRequests = () => rpc<{ id: number; name: string; crest: string; created_at: string }[]>('my_clan_requests', {});
export const clanRequests = () => rpc<{ username: string; avatar: string; created_at: string }[]>('clan_requests', {});
export const clanAnswer = (username: string, accept: boolean) => rpc<boolean>('clan_answer', { p_username: username, p_accept: accept });
export const clanSetRole = (username: string, role: ClanRole) => rpc<boolean>('clan_set_role', { p_username: username, p_role: role });
export const clanLeave = () => rpc<boolean>('clan_leave', {});
export const clanKick = (username: string) => rpc<boolean>('clan_kick', { p_username: username });
export const clanSearch = (q: string) => rpc<ClanRow[]>('clan_search', { p_query: q }, false);
export const clanRanking = () => rpc<ClanRow[]>('clan_ranking', {}, false);
export const clanLastWeek = () => rpc<{ pos: number; name: string; points: number; tier: string }[]>('clan_last_week', {}, false);
export const myClan = () => rpc<MyClan | null>('my_clan', {});
export const clanSubmitRun = (runId: string, kills: number, timeSec: number, damage: number, rank: string, victory: boolean) =>
  rpc<{ points: number; left: number; weekPoints: number }>('clan_submit_run', { p_run_id: runId, p_kills: Math.floor(kills), p_time_sec: Math.floor(timeSec), p_damage: Math.floor(damage), p_rank: rank, p_victory: victory });
export const clanClaimPrizes = () => rpc<ClanPrize[]>('clan_claim_prizes', {});
/** the clan of each of these players (left out: those without a clan) */
/** 2.0: the Camino del Campeón level of each ranking row's captain in that player's save (champion_of.sql) */
export const championOfRows = (rows: { username: string; captain: number }[]) => rpc<{ username: string; captain_id: number; champion: number }[]>('champion_of', { p_usernames: rows.slice(0, 60).map((r) => r.username), p_captains: rows.slice(0, 60).map((r) => r.captain) }, false);
export const clanOf = (usernames: string[]) => rpc<{ username: string; clan: string; crest: string }[]>('clan_of', { p_usernames: usernames.slice(0, 60) }, false);
export const clanClaimMission = (id: string) => rpc<{ coins: number; tokens: number }>('clan_claim_mission', { p_id: id });

export const deleteAccount = async () => { await rpc('delete_my_account', {}); signOut(); };

/** pre-2.0: co-op rooms (only the two signalling messages go through the server; the match is peer to peer) */
export interface CoopPoll { status: 'abierta' | 'emparejada' | 'conectada' | 'cerrada'; host_name: string | null; guest_name: string | null; offer: string | null; answer: string | null; role: 'host' | 'guest' }
export const coopCreate = () => rpc<string>('coop_create', {});
export const coopJoin = (code: string) => rpc<string>('coop_join', { p_code: code });
export const coopSignal = (code: string, kind: 'offer' | 'answer', sdp: string) => rpc<null>('coop_signal', { p_code: code, p_kind: kind, p_sdp: sdp });
export const coopPoll = async (code: string) => (await rpc<CoopPoll[]>('coop_poll', { p_code: code }))[0] ?? null;
export const coopMark = (code: string, status: 'conectada' | 'cerrada') => rpc<null>('coop_mark', { p_code: code, p_status: status });
/** pre-2.0: TURN relay servers for a room (turn-credentials Edge Function); [] when unavailable: the game then tries direct */
export async function coopIceServers(code: string): Promise<RTCIceServer[]> {
  const ctl = new AbortController(), timer = setTimeout(() => ctl.abort(), 4000);
  try {
    const r = await fetch(`${URL_}/functions/v1/turn-credentials`, { method: 'POST', signal: ctl.signal,
      headers: { apikey: KEY, Authorization: `Bearer ${await token()}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ code }) });
    const j = await r.json() as { iceServers?: RTCIceServer[] };
    return Array.isArray(j.iceServers) ? j.iceServers : [];
  } catch { return []; } finally { clearTimeout(timer); }
}

/** pre-2.0: friends (for the co-op) and invitations to a room */
export interface FriendRow { username: string; avatar: string; crest: string; status: 'amigo' | 'enviada' | 'recibida'; online: boolean; since: string }
export const friendList = () => rpc<FriendRow[]>('friend_list', {});
export const friendRequest = (username: string) => rpc<'enviada' | 'aceptada' | 'ya_amigos'>('friend_request', { p_username: username });
export const friendRespond = (username: string, accept: boolean) => rpc<null>('friend_respond', { p_username: username, p_accept: accept });
export const friendRemove = (username: string) => rpc<null>('friend_remove', { p_username: username });
export const friendHeartbeat = () => rpc<null>('friend_heartbeat', {});
export const coopInvite = (username: string, code: string) => rpc<null>('coop_invite', { p_username: username, p_code: code });
export const coopInvitesClaim = () => rpc<{ from_name: string; code: string; created_at: string }[]>('coop_invites_claim', {});
