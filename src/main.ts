import Phaser from 'phaser';
import '@fontsource/press-start-2p';
import './style.css';
import './style14.css';
import type { Manifest } from './data/manifest';
import { applyRosterFixes } from './data/rosterFixes';
import { ArenaScene } from './game/ArenaScene';
import { MenuScene } from './game/MenuScene';
import { loadSave, storeSave } from './systems/save';
import { App } from './ui/app';

// keeps the last crash so a run that stops unexpectedly can be diagnosed
const remember = (m: unknown) => { try { localStorage.setItem('ie-survivors-last-error', `${new Date().toISOString()} ${String(m)}`); } catch { /* storage full */ } };
window.addEventListener('error', (e) => remember(e.error?.stack ?? e.message));
window.addEventListener('unhandledrejection', (e) => remember(e.reason?.stack ?? e.reason));

const bar = document.getElementById('boot-bar');
const msg = document.getElementById('boot-msg');
const progress = (k: number, text: string) => {
  if (bar) bar.style.width = `${Math.round(k * 100)}%`;
  if (msg) msg.textContent = text;
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

async function boot() {
  let manifest: Manifest;
  try {
    const version = import.meta.env.VITE_RECURSOS_VERSION;
    manifest = await fetchJson<Manifest>(`generated/manifest.json${version ? `?v=${version}` : ''}`, (k) => progress(k * 0.7, 'Cargando futbolistas…'), 4_500_000);
  } catch {
    progress(0, 'No se pudieron cargar los datos del juego. Si el problema sigue, esta versión puede no incluir sus recursos.');
    return;
  }
  // quick footballer corrections (rarity, element, techniques) that ship without repackaging resources
  for (const w of applyRosterFixes(manifest)) console.warn('[rosterFixes]', w);
  progress(0.75, 'Preparando caras y objetos…');
  const [mugs, icons] = await Promise.all([
    fetch(manifest.atlases.mugshots.json).then((r) => r.json()),
    fetch(manifest.atlases.items.json).then((r) => r.json()),
  ]);
  progress(0.92, 'Abriendo el vestuario…');
  // new profiles start empty: their first 5 footballers come from the one-time onboarding draft
  const save = loadSave([], null);
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
  const app = new App(game, manifest, save, mugs.frames, icons.frames);
  await app.start();
  progress(1, '¡Listo!');
  const screen = document.getElementById('boot');
  screen?.classList.add('gone');
  window.setTimeout(() => screen?.remove(), 400);
  // Fix 1.23: the QA hook only exists on the development server; in the published game it handed the console the save
  // (`__ies.app.save.tokens = …`), which is how fichas were made out of nothing
  if (import.meta.env.DEV) (window as unknown as Record<string, unknown>).__ies = { game, app, manifest, save };
}

boot();
