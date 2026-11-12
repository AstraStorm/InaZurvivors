/**
 * 2.3 (author: «que sea más chulo y más responsivo, teniendo en cuenta el móvil»): short vibrations at the key moments of
 * a run on phones that support them (Android browsers; iOS Safari has no vibration and ignores the call). Only touch
 * screens buzz, and the player can turn it off in Ajustes (settings.vibration, absent = on).
 */
let on = true;
let last = 0;

const touchScreen = () => typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;

export function setHaptics(enabled: boolean) { on = enabled; }

/** one vibration; `gap` ms keeps frequent ones (hits) from turning into a constant buzz */
export function buzz(pattern: number | number[], gap = 0) {
  if (!on || typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function' || !touchScreen()) return;
  const now = performance.now();
  if (now - last < gap) return;
  last = now;
  try { navigator.vibrate(pattern); } catch { /* blocked by the browser (no user gesture yet) */ }
}

/** the moments of a run */
export const HAPTIC = {
  hurt: () => buzz(22, 220),
  levelUp: () => buzz(35),
  ult: () => buzz([30, 30, 60]),
  boss: () => buzz([70, 50, 110]),
  win: () => buzz([40, 40, 40, 40, 90]),
  lose: () => buzz([140, 70, 140]),
  legend: () => buzz([50, 40, 50, 40, 140]),
};
