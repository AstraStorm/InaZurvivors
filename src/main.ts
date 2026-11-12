import Phaser from 'phaser';
import '@fontsource/press-start-2p';
import './style.css';
import './style14.css';
import './styleMapPath.css';
import './styleThanks.css';
import './styleGts.css';
import './styleCoop.css';
import './styleCoaches.css';
import './styleRoad.css';
import './styleBoss.css';
import './styleCards.css';
import './styleMenu19.css';
import './styleClans.css';
import './styleKeshin.css';
import './styleEgFrames.css';
import './styleLaunch20.css';
import './styleMobile20.css';
import './styleHud20.css';
import './stylePass20.css';
import './stylePass21.css';
import './styleLobby.css';
import './styleReplay.css';
import './styleSeason.css';
import './styleUiSaga.css'; // 2.11: the saga's digits and badges
import './styleSector.css'; // 2.2 Sector Quinto
import type { Manifest } from './data/manifest';
import { applyRosterFixes } from './data/rosterFixes';
import { applyTechFixes } from './data/techFixes';
import { ArenaScene } from './game/ArenaScene';
import { LobbyScene } from './game/LobbyScene';
import { ReplayScene } from './game/ReplayScene';
import { MenuScene } from './game/MenuScene';
import { loadSave, storeSave } from './systems/save';
import { mudanzaNotice, mudanzaToast, takeMudanza } from './systems/mudanza';
import { App } from './ui/app';
import { tr } from './i18n/i18n';

// keeps the last crash so a run that stops unexpectedly can be diagnosed
const remember = (m: unknown) => { try { localStorage.setItem('ie-survivors-last-error', `${new Date().toISOString()} ${String(m)}`); } catch { /* storage full */ } };
window.addEventListener('error', (e) => remember(e.error?.stack ?? e.message));
// 2.3: iOS Safari only applies :active (the pressed look of buttons and tiles) when the page listens to touches
document.addEventListener('touchstart', () => undefined, { passive: true });
window.addEventListener('unhandledrejection', (e) => remember(e.reason?.stack ?? e.reason));

const bar = document.getElementById('boot-bar');
const msg = document.getElementById('boot-msg');
const progress = (k: number, text: string) => {
  if (bar) bar.style.width = `${Math.round(k * 100)}%`;
  if (msg) msg.textContent = text;
  const pct = document.getElementById('boot-pct');
  if (pct) pct.textContent = `${Math.round(k * 100)}%`;
};

/** JSON with a progress callback; servers that compress the reply give no length, so the size is then estimated. */
async function fetchJson<T>(url: string, onProgress: (k: number) => void, guessBytes: number): Promise<T> {
  const res = await fetch(url);
  if (!res.ok || !res.body) throw new Error(`${url}: ${res.status}`);
  const total = Number(res.headers.get('content-length')) || guessBytes;
  const reader = res.body.getReader();
  const parts: Uint8Array[] = [];
  let got = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    parts.push(value);
    got += value.length;
    onProgress(Math.min(0.98, got / total));
  }
  const all = new Uint8Array(got);
  let at = 0;
  for (const p of parts) { all.set(p, at); at += p.length; }
  return JSON.parse(new TextDecoder().decode(all)) as T;
}

// hashed resources never change, so the worker can keep them; music stays out because Audio asks for byte ranges
if (import.meta.env.PROD && 'serviceWorker' in navigator) void navigator.serviceWorker.register('sw.js').catch(() => undefined);
// pre-2.0: the test build (served from /pruebas/) says so at all times, so nobody mistakes it for the real game
if (import.meta.env.BASE_URL.includes('/pruebas/')) {
  document.title = `[PRUEBAS] ${document.title}`;
  document.body.insertAdjacentHTML('beforeend', `<div class="test-build" title="${tr('Versión de pruebas del cooperativo: puede fallar. Tu partida es la misma que en la web normal.')}">${tr('PRUEBAS · pre-2.0')}</div>`);
}

async function boot() {
  let manifest: Manifest;
  try {
    const version = import.meta.env.VITE_RECURSOS_VERSION;
    manifest = await fetchJson<Manifest>(`generated/manifest.json${version ? `?v=${version}` : ''}`, (k) => progress(k * 0.7, tr('Cargando futbolistas…')), 4_500_000);
  } catch {
    progress(0, tr('No se pudieron cargar los datos del juego. Si el problema sigue, esta versión puede no incluir sus recursos.'));
    return;
  }
  // quick footballer corrections (rarity, element, techniques) that ship without repackaging resources
  for (const w of applyRosterFixes(manifest)) console.warn('[rosterFixes]', w);
  applyTechFixes(manifest); // 1.76: fixed elements of some techniques
  progress(0.75, tr('Preparando caras y objetos…'));
  const [mugs, icons] = await Promise.all([
    fetch(manifest.atlases.mugshots.json).then((r) => r.json()),
    fetch(manifest.atlases.items.json).then((r) => r.json()),
  ]);
  progress(0.92, tr('Abriendo el vestuario…'));
  // new profiles start empty: their first 5 footballers come from the one-time onboarding draft
  const moved = await takeMudanza(); // 2026-11-10: a guest's save brought from the old address (before it is loaded)
  const save = loadSave([], null);
  // 2.0 (dev only): ?qa=eg opens a QA club with every Espíritu Guerrero holder; never on localhost, where the author's save lives
  if (import.meta.env.DEV && new URLSearchParams(location.search).get('qa') === 'eg' && location.hostname !== 'localhost') {
    const { KESHINS } = await import('./systems/keshin');
    // author: plus the InaZurvivors x BlueLock pair (Nagi and Isagi) in the team, to see how they look
    const ids = [900200, 900201, ...KESHINS.flatMap((k) => k.holders.map((h) => h.id))].filter((id, i, a) => a.indexOf(id) === i && manifest.roster.some((p) => p.id === id));
    for (const id of ids) save.owned[String(id)] ??= { stars: 0, copies: 1, obtainedAt: new Date().toISOString() };
    Object.assign(save, { squad: ids.slice(0, 7), captainId: 100303, onboardingDone: true, introSeen: true, thanksSeen: true, roadIntroSeen: true, auraIntroSeen: true,
      tutorial: 'hecho', nameLocked: true, coins: 50000, tokens: 200, egTokens: 40, eventTokens: 300, keshin: { 10: 6, 1: 3, 100538: 2 } });
    save.profile.name = 'QA_EG';
    history.replaceState(null, '', location.pathname);
  }
  // (dev only) the QA_EG club keeps the BlueLock pair in its team even when opened without ?qa=eg (a club made before
  // the collab existed did not have them)
  if (import.meta.env.DEV && save.profile.name === 'QA_EG' && location.hostname !== 'localhost') {
    const bl = [900200, 900201].filter((id) => manifest.roster.some((p) => p.id === id));
    for (const id of bl) save.owned[String(id)] ??= { stars: 0, copies: 1, obtainedAt: new Date().toISOString() };
    if (bl.some((id) => !save.squad?.includes(id))) save.squad = [...bl, ...(save.squad ?? []).filter((id) => !bl.includes(id))].slice(0, 7);
    if (save.captainId !== null && !save.squad.includes(save.captainId)) save.captainId = save.squad[0];
    save.eventTokens = Math.max(save.eventTokens ?? 0, 300);
  }
  storeSave(save);

  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'game',
    pixelArt: true,
    roundPixels: true,
    backgroundColor: '#0d1b3a',
    scale: { mode: Phaser.Scale.RESIZE, width: window.innerWidth, height: window.innerHeight },
    scene: [],
  });
  game.scene.add('Arena', ArenaScene, false);
  game.scene.add('Menu', MenuScene, false);
  game.scene.add('Lobby', LobbyScene, false);
  game.scene.add('Replay', ReplayScene, false);
  const app = new App(game, manifest, save, mugs.frames, icons.frames);
  await app.start();
  progress(1, tr('¡Listo!'));
  const screen = document.getElementById('boot');
  screen?.classList.add('gone');
  window.setTimeout(() => screen?.remove(), 400);
  if (moved) mudanzaToast(moved);
  mudanzaNotice();
  // Fix 1.23: the QA hook only exists on the development server; in the published game it handed the console the save
  // (`__ies.app.save.tokens = …`), which is how fichas were made out of nothing
  if (import.meta.env.DEV) (window as unknown as Record<string, unknown>).__ies = { game, app, manifest, save };
}

boot();
