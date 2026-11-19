/**
 * Parche de rendimiento (author: «desde móvil el juego me va laggy»): phones and modest devices get light effects.
 * The menu's costliest decorations go (shines that move with `left`, backgrounds that animate their position or filter,
 * the drawn frames' SVG sparkles, wings and spins, all of which repaint every frame) and the living background behind
 * the menu is drawn at 30 fps. Everything else stays. `localStorage['iz-fx'] = 'alto' | 'bajo'` forces either way.
 */
import type Phaser from 'phaser';

function detect(): boolean {
  try {
    const forced = localStorage.getItem('iz-fx');
    if (forced === 'alto') return false;
    if (forced === 'bajo') return true;
  } catch { /* no storage: decide by the device */ }
  try {
    const coarse = window.matchMedia('(pointer: coarse)').matches;
    const cores = navigator.hardwareConcurrency || 8;
    const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8;
    return coarse || cores <= 4 || mem <= 4;
  } catch {
    return false;
  }
}

export const LOW_FX = detect();

/** marks the page so the CSS can drop the costly decorations (body.lowfx) */
export function applyLowFx() {
  if (LOW_FX) document.body.classList.add('lowfx');
}

/** caps (or frees, with 0) the game's frame rate; used while the menu's background is the only thing Phaser draws */
export function capFps(game: Phaser.Game, fps: number) {
  if (!LOW_FX) return;
  const loop = game.loop as Phaser.Core.TimeStep & { _limitRate: number };
  loop.fpsLimit = fps;
  loop.hasFpsLimit = fps > 0;
  loop._limitRate = fps > 0 ? 1000 / fps : 0;
  // the loop picks its step function (limited or not) when it starts: restart it so the change takes
  if (loop.running) { loop.sleep(); loop.wake(true); }
}
