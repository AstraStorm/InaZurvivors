/**
 * 2026-11-10 (author): the game moved from astrastorm.github.io/InaZurvivors/ to inazurvivors.com, and a guest's save
 * lives in the browser under the old address. For 3 days a page in another repository on the same github.io origin
 * (MUDANZA_PAGE) reads that save and opens https://inazurvivors.com/#mudanza=<payload>. The payload is the save JSON,
 * gzipped and in base64url ('g' prefix) or plain base64url ('j') when the browser has no CompressionStream; it travels
 * in the fragment, which never reaches any server.
 *
 * Nothing is overwritten: when this browser already has progress the player chooses, and the copy not chosen stays as a
 * backup (`ie-survivors-save.backup-…`, the same keys cloudSync.backup uses).
 */
import { importSave, type SaveData } from './save';
import { summarize, type SaveSummary } from '../online/cloudSync';

/** the notice on inazurvivors.com shows until then (3 days after the 2.0); a link opened later still imports */
export const MUDANZA_UNTIL = Date.parse('2026-11-13T12:00:00+01:00');
export const MUDANZA_PAGE = 'https://astrastorm.github.io/inazurvivors-mudanza/';
const KEY = 'ie-survivors-save'; // save.ts KEY
const DONE = 'iz-mudanza-hecha';
const SEEN = 'iz-mudanza-aviso';

const fromB64url = (s: string) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));

export async function decodePayload(p: string): Promise<string> {
  const bytes = fromB64url(p.slice(1));
  if (p[0] === 'j') return new TextDecoder().decode(bytes);
  if (p[0] !== 'g') throw new Error('Enlace de mudanza no válido.');
  if (typeof DecompressionStream === 'undefined') throw new Error('Este navegador no puede abrir el enlace de mudanza; actualízalo o usa otro.');
  const out = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
  return new Response(out).text();
}

/** progress worth asking about: a finished onboarding or at least one run */
export const hasProgress = (s: Pick<SaveData, 'onboardingDone' | 'stats'> | null) => !!s && (s.onboardingDone || (s.stats?.runs ?? 0) > 0);

/** what to do with a moved save: take it straight away, or ask because this browser has its own progress */
export const mudanzaPlan = (here: SaveData | null): 'tomar' | 'elegir' => (hasProgress(here) ? 'elegir' : 'tomar');

function readHere(): SaveData | null {
  try {
    const txt = localStorage.getItem(KEY);
    return txt ? importSave(txt) : null;
  } catch { return null; }
}

const keep = (kind: string, data: unknown) => { try { localStorage.setItem(`${KEY}.backup-${kind}-${Date.now()}`, JSON.stringify(data)); } catch { /* storage full */ } };

function choose(here: SaveSummary, moved: SaveSummary): Promise<'antigua' | 'esta'> {
  return new Promise((resolve) => {
    const row = (t: string, s: SaveSummary, c: string) => `<button data-c="${c}" style="display:block;width:100%;text-align:left;margin:8px 0;padding:12px;border-radius:10px;border:2px solid #5ad8ff;background:#0d1b3a;color:#fff;font:inherit;cursor:pointer">
      <b style="color:#ffe24a">${t}</b><br>${s.name ? `${s.name.replace(/[<>&]/g, '')} · ` : ''}${s.players} futbolistas · ${s.wins} victorias · ${s.runs} partidas · ${s.coins} monedas</button>`;
    const box = document.createElement('div');
    box.style.cssText = 'position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;background:rgba(3,8,24,.86);padding:16px;font:14px/1.4 system-ui,sans-serif;color:#fff';
    box.innerHTML = `<div style="max-width:520px;width:100%;background:#13254f;border:2px solid #5ad8ff;border-radius:14px;padding:18px">
      <h2 style="margin:0 0 8px;color:#ffe24a;font-size:18px">¿Qué partida quieres usar?</h2>
      <p style="margin:0 0 6px">Has traído tu partida de la dirección antigua, pero este navegador ya tiene otra en inazurvivors.com. La que no elijas se guarda como respaldo: nada se pierde.</p>
      ${row('La de la dirección antigua', moved, 'antigua')}${row('La que ya tengo aquí', here, 'esta')}</div>`;
    document.body.appendChild(box);
    box.querySelectorAll<HTMLElement>('[data-c]').forEach((b) => b.addEventListener('click', () => { box.remove(); resolve(b.dataset.c as 'antigua' | 'esta'); }));
  });
}

/**
 * Before the save is loaded: takes a moved save from the address bar, if any. Returns the message to show once the game
 * is up, or null when the page was not opened by the move link.
 */
export async function takeMudanza(): Promise<string | null> {
  const p = new URLSearchParams(location.hash.slice(1)).get('mudanza');
  if (!p) return null;
  history.replaceState(null, '', location.pathname + location.search);
  let moved: SaveData;
  try { moved = importSave(await decodePayload(p)); } catch (e) { return `No se pudo traer la partida: ${(e as Error).message}`; }
  const here = readHere();
  let msg = 'Partida recuperada de la dirección antigua. ¡Bienvenido a inazurvivors.com!';
  if (mudanzaPlan(here) === 'elegir') {
    if ((await choose(summarize(here!), summarize(moved))) === 'esta') { keep('mudanza', moved); msg = 'Te quedas con la partida de aquí; la de la dirección antigua queda como respaldo.'; moved = here!; }
    else keep('local', here);
  } else if (here) keep('local', here);
  try {
    localStorage.setItem(KEY, JSON.stringify(moved));
    localStorage.setItem(DONE, '1');
  } catch { return 'No hay espacio en este navegador para guardar la partida traída.'; }
  return msg;
}

/** A short message over the game (the App is not up yet when the move happens). */
export function mudanzaToast(msg: string) {
  const t = document.createElement('div');
  t.textContent = msg;
  t.style.cssText = 'position:fixed;left:50%;top:18px;transform:translateX(-50%);z-index:99998;max-width:min(92vw,560px);padding:12px 16px;border-radius:10px;background:#13254f;border:2px solid #ffe24a;color:#fff;font:14px/1.4 system-ui,sans-serif;text-align:center;box-shadow:0 6px 24px rgba(0,0,0,.5)';
  document.body.appendChild(t);
  window.setTimeout(() => t.remove(), 7000);
}

/**
 * For guests during the 3 days: a dismissible strip with the move link. Not for accounts (their progress is in the
 * cloud), not after a move, never over a run (hidden while the HUD exists).
 */
export function mudanzaNotice(now = Date.now()) {
  try {
    if (now > MUDANZA_UNTIL || localStorage.getItem('inazurivors-session') || localStorage.getItem(DONE) || localStorage.getItem(SEEN)) return;
  } catch { return; }
  const bar = document.createElement('div');
  bar.style.cssText = 'position:fixed;left:50%;bottom:12px;transform:translateX(-50%);z-index:9000;display:flex;gap:10px;align-items:center;max-width:calc(100vw - 32px);padding:10px 12px 10px 14px;border-radius:12px;background:#13254f;border:2px solid #ffe24a;color:#fff;font:13px/1.35 system-ui,sans-serif;box-shadow:0 6px 24px rgba(0,0,0,.5)';
  bar.innerHTML = `<span>¿Jugabas como invitado en la dirección antigua (astrastorm.github.io)? <a href="${MUDANZA_PAGE}" style="color:#ffe24a;font-weight:700">Recupera tu partida</a> (hasta el 13 de noviembre)</span>
    <button aria-label="Cerrar" style="flex:none;border:0;background:transparent;color:#fff;font-size:18px;cursor:pointer">✕</button>`;
  bar.querySelector('button')!.addEventListener('click', () => { bar.remove(); try { localStorage.setItem(SEEN, '1'); } catch { /* blocked */ } });
  document.body.appendChild(bar);
  const t = window.setInterval(() => {
    if (!bar.isConnected) { window.clearInterval(t); return; }
    bar.style.display = document.getElementById('hud') || document.getElementById('rplay') ? 'none' : 'flex'; // never over a run or a replay
  }, 1000);
}
