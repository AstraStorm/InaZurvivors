/** Menu navigation with a gamepad (spatial focus, A confirm, B back) and the on-screen touch stick. */
import { firstPad, padStick, touchStick } from '../game/controls';

const FOCUSABLE = 'button:not(:disabled), .pcard[data-id], select, input';
const REPEAT_MS = 190;

function scope(): ParentNode {
  const ui = document.getElementById('ui')!;
  return ui.querySelector('.reveal') ?? ui.querySelector('.levelup') ?? ui.querySelector('.modal') ?? ui;
}

const visible = (el: HTMLElement) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
const preferred = (list: HTMLElement[]) => list.find((el) => el.matches('.play, .btn.big, .lvcard')) ?? list[0];
const items = () => [...scope().querySelectorAll<HTMLElement>(FOCUSABLE)].filter(visible);

function current(list: HTMLElement[]) {
  const el = document.querySelector<HTMLElement>('.pad-focus');
  return el && list.includes(el) ? el : null;
}

function focus(el: HTMLElement) {
  document.querySelector('.pad-focus')?.classList.remove('pad-focus');
  el.classList.add('pad-focus');
  el.scrollIntoView({ block: 'nearest', inline: 'nearest' });
}

function move(dx: number, dy: number) {
  const list = items();
  if (!list.length) return;
  const cur = current(list);
  if (!cur) { focus(preferred(list)); return; }
  const a = cur.getBoundingClientRect();
  const ax = a.left + a.width / 2, ay = a.top + a.height / 2;
  let best: HTMLElement | null = null, bestScore = Infinity;
  for (const el of list) {
    if (el === cur) continue;
    const r = el.getBoundingClientRect();
    const vx = r.left + r.width / 2 - ax, vy = r.top + r.height / 2 - ay;
    const along = vx * dx + vy * dy;
    if (along <= 4) continue;
    const across = Math.abs(vx * dy) + Math.abs(vy * dx);
    const score = along + across * 2.5;
    if (score < bestScore) { bestScore = score; best = el; }
  }
  if (best) focus(best);
}

export function initGamepad(onPause: () => void) {
  const held: Record<number, boolean> = {};
  let nextMove = 0;
  let seen = '';
  const stuck = new Set<number>();
  const loop = () => {
    requestAnimationFrame(loop);
    const p = firstPad();
    if (!p) return;
    // a button already down when the pad appears counts as held: it has to be released before it can press anything
    const key = `${p.index}:${p.id}`;
    if (key !== seen) { seen = key; stuck.clear(); p.buttons.forEach((b, i) => { held[i] = b.pressed; if (b.pressed) stuck.add(i); }); }
    for (const i of [...stuck]) if (!p.buttons[i]?.pressed) stuck.delete(i);
    document.body.classList.add('pad');
    const edge = (i: number) => { const d = !!p.buttons[i]?.pressed; const hit = d && !held[i]; held[i] = d; return hit; };
    const inRun = !!document.getElementById('hud') && !document.querySelector('.levelup, .modal');
    if (edge(9)) onPause();
    if (inRun) return; // the scene owns movement during play
    const now = performance.now();
    const [ax, ay] = padStick(p);
    const dpad = (i: number) => !!p.buttons[i]?.pressed && !stuck.has(i);
    const dx = dpad(15) || ax > 0.5 ? 1 : dpad(14) || ax < -0.5 ? -1 : 0;
    const dy = dpad(13) || ay > 0.5 ? 1 : dpad(12) || ay < -0.5 ? -1 : 0;
    if (dx || dy) {
      if (now >= nextMove) { move(dx, dy); nextMove = now + REPEAT_MS; }
    } else nextMove = 0;
    if (edge(0)) {
      const list = items();
      const cur = current(list);
      if (cur) cur.click(); else if (list.length) focus(preferred(list));
    }
    if (edge(1)) (document.querySelector('[data-back]') as HTMLElement | null)?.click();
  };
  requestAnimationFrame(loop);
}

/** Touch stick: appears wherever the thumb lands in its zone. */
export function bindStick(zone: HTMLElement) {
  const knob = zone.querySelector<HTMLElement>('i')!;
  const base = zone.querySelector<HTMLElement>('b')!;
  const R = 46;
  let id: number | null = null, cx = 0, cy = 0;
  const set = (x: number, y: number) => {
    const d = Math.hypot(x, y) || 1, k = Math.min(1, d / R);
    touchStick.x = (x / d) * k;
    touchStick.y = (y / d) * k;
    knob.style.transform = `translate(${(x / d) * Math.min(d, R)}px, ${(y / d) * Math.min(d, R)}px)`;
  };
  const end = () => { id = null; touchStick.x = touchStick.y = 0; zone.classList.remove('on'); knob.style.transform = ''; };
  zone.addEventListener('pointerdown', (e) => {
    id = e.pointerId; cx = e.clientX; cy = e.clientY;
    try { zone.setPointerCapture(id); } catch { /* moves still arrive while the finger stays in the zone */ }
    const r = zone.getBoundingClientRect();
    base.style.left = `${cx - r.left}px`;
    base.style.top = `${cy - r.top}px`;
    zone.classList.add('on');
    e.preventDefault();
  });
  zone.addEventListener('pointermove', (e) => { if (e.pointerId === id) set(e.clientX - cx, e.clientY - cy); });
  zone.addEventListener('pointerup', end);
  zone.addEventListener('pointercancel', end);
}
