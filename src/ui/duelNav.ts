/**
 * Modo Duelo: how its menu screens (hub, team editor, tier list, ranking) fit the screen and pass from one to another.
 * `fit` scales a screen up on big monitors (author: «que en el menú no se vea tan encogido»): designed for about
 * 1700×950, it grows with the window up to 1.4 times (more was too big). `go` is the passage between two screens (author: «al haber
 * cambios de modo que haya un desplazamiento como de menú»): the old one slides away and fades, a band of light sweeps
 * the screen and the new one comes in from the other side; `dir` 1 goes deeper (in from the right), -1 goes back.
 */
const reduce = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/** scales the `sel` box of `root` (and `also`, e.g. a tooltip of it) to the window while `root` is on the page; its
 *  `--z` is the zoom (lengths in viewport units inside are zoomed too: divide them by it). Returns the function that
 *  applies it again (call it after re-rendering the box). */
export function fit(root: HTMLElement, sel: string, w = 1700, h = 950, also: HTMLElement[] = []) {
  const apply = () => {
    if (!root.isConnected) { window.removeEventListener('resize', apply); return; }
    const z = Math.max(1, Math.min(1.4, window.innerWidth / w, window.innerHeight / h));
    for (const e of [root.querySelector<HTMLElement>(sel), ...also]) {
      if (!e) continue;
      e.style.zoom = z === 1 ? '' : z.toFixed(3);
      e.style.setProperty('--z', z.toFixed(3));
    }
  };
  apply();
  window.addEventListener('resize', apply);
  return apply;
}

/** the zoom `fit` gave an element (1 when none) */
export const zoomOf = (e: HTMLElement) => Number(e.style.zoom) || 1;

/** the passage: `from` (the whole old screen, or null) slides away and is removed; `inner` (the new screen's box)
 *  comes in from the side */
export function go(from: HTMLElement | null, inner: HTMLElement | null, dir: 1 | -1 = 1) {
  if (reduce()) { from?.remove(); return; }
  if (from) {
    from.style.pointerEvents = 'none';
    from.classList.add('dn-out');
    from.animate([{ opacity: 1, transform: 'none', filter: 'none' }, { opacity: 0, transform: `translateX(${-dir * 9}%) scale(.96)`, filter: 'blur(3px)' }],
      { duration: 320, easing: 'cubic-bezier(.5,0,.75,0)', fill: 'forwards' }).finished.then(() => from.remove(), () => from.remove());
  }
  if (inner) {
    inner.animate([{ opacity: 0, transform: `translateX(${dir * 14}%) scale(.94)`, filter: 'blur(4px)' }, { opacity: 1, transform: 'none', filter: 'none' }],
      { duration: 460, delay: from ? 120 : 0, easing: 'cubic-bezier(.2,1.25,.4,1)', fill: 'backwards' });
  }
  // the sweep: a slanted band of light crossing the screen in the direction of travel
  const wipe = document.createElement('div');
  wipe.className = 'dn-wipe';
  wipe.style.cssText = 'position:fixed;inset:0;z-index:9200;pointer-events:none;overflow:hidden';
  wipe.innerHTML = '<i style="position:absolute;top:-20%;bottom:-20%;width:38%;left:0;transform:skewX(-18deg);background:linear-gradient(90deg,#0000,#ffd76a33 30%,#fff8 50%,#4fb3ff33 70%,#0000);mix-blend-mode:screen;filter:blur(2px)"></i>';
  document.body.appendChild(wipe);
  const band = wipe.firstElementChild as HTMLElement;
  band.animate([{ transform: `translateX(${dir > 0 ? 300 : -120}%) skewX(-18deg)` }, { transform: `translateX(${dir > 0 ? -120 : 300}%) skewX(-18deg)` }],
    { duration: 520, easing: 'cubic-bezier(.4,0,.2,1)' }).finished.then(() => wipe.remove(), () => wipe.remove());
}

/** the passage from the game's menu into the Modo Duelo and back (author: «un desplazamiento entre menús animado del
 *  modo normal y el modo duelo»): the menu under the duel slides away to the left while the duel comes in from the
 *  right; coming back, the duel leaves to the right and the menu returns */
// once hidden, the menu stops painting and its hundreds of looping animations (frames, pennants, tiles) are paused:
// they kept running under the duel and made it lag (author: «corrige que no haya tanto lag»)
const HID_CSS = '.dn-hid{visibility:hidden!important}.dn-hid,.dn-hid *,.dn-hid *::before,.dn-hid *::after{animation-play-state:paused!important}';
function hide(under: HTMLElement) {
  if (!document.getElementById('dn-css')) { const st = document.createElement('style'); st.id = 'dn-css'; st.textContent = HID_CSS; document.head.appendChild(st); }
  under.classList.add('dn-hid');
}
export function leaveMenu(under: HTMLElement | null | undefined) {
  if (!under) return;
  for (const a of under.getAnimations()) if (a.id === 'duel-under') a.cancel();
  if (reduce()) { hide(under); return; }
  const a = under.animate([{ transform: 'none', opacity: 1, filter: 'none' }, { transform: 'translateX(-14%) scale(.94)', opacity: 0, filter: 'blur(4px)' }],
    { duration: 380, easing: 'cubic-bezier(.5,0,.75,0)', fill: 'forwards' });
  a.id = 'duel-under';
  a.finished.then(() => { if (a.playState === 'finished') hide(under); }, () => {});
}
export function backToMenu(duel: HTMLElement, under: HTMLElement | null | undefined) {
  under?.classList.remove('dn-hid');
  go(duel, null, -1);
  if (!under || reduce()) { for (const a of under?.getAnimations() ?? []) if (a.id === 'duel-under') a.cancel(); return; }
  for (const a of under.getAnimations()) if (a.id === 'duel-under') a.cancel();
  under.animate([{ transform: 'translateX(-14%) scale(.94)', opacity: 0, filter: 'blur(4px)' }, { transform: 'none', opacity: 1, filter: 'none' }],
    { duration: 460, delay: 120, easing: 'cubic-bezier(.2,1.25,.4,1)', fill: 'backwards' });
}
