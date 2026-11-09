/**
 * The loading screen of a run (author: «que no quede mal una pantalla de carga, y que los típicos puntos de carga o la
 * ruedita sean los jugadores corriendo»). The footballers of the team run across the screen as the spinner, each drawn
 * from his own sprites exactly as on the pitch (Raimon body or the team's kit, his original head, the same rig: the run
 * to the right is the run to the left mirrored), one dribbling the ball ahead; under them, the share of the files loaded.
 * It only shows up if the load takes a moment (no flash on quick loads) and fades out once the pitch is drawn.
 */
import type { Manifest, RosterEntry } from '../data/manifest';

const esc = (s: unknown) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));

const RUN_RIGHT = 10; // rig animation 10: moving right (mirrored), Footballer.ts
const SCALE = 3;
const TIPS = [
  'Con la R lanzas la definitiva de tu Espíritu Guerrero.',
  'Las Auras suman sus estadísticas a quien las lleva.',
  'Las técnicas combinadas salen solas si tienes a todos sus jugadores en el campo.',
  'Grito de guerra y Gatas salvajes cuentan también a las Auras.',
  'Las teclas 1, 2 y 3 cambian de formación en plena partida.',
  'Las Fichas EG se ganan venciendo arenas en rango A, S y X.',
];

const img = (src: string) => new Promise<HTMLImageElement | null>((res) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = src; });

/** warms the browser cache with what the loading screen draws (bodies, the kit, the squad's heads), so the runners are
 *  there from the first frame */
export function prefetchRunArt(m: Manifest, heads: string[], kitField: string | null) {
  for (const src of [m.bodies.field?.texture, m.bodies.gk?.texture, kitField, ...heads]) if (src) void img(src);
}

export interface RunLoader { progress(p: number): void; done(): void }

export function showRunLoader(m: Manifest, team: RosterEntry[], mapName: string, kitField: string | null): RunLoader {
  document.querySelector('.rl')?.remove();
  const box = document.createElement('div');
  box.className = 'rl';
  const tip = TIPS[Math.floor(Math.random() * TIPS.length)];
  box.innerHTML = `<i class="rl-lines"></i>
    <div class="rl-in"><small>SALTANDO AL CAMPO</small><b>${esc(mapName)}</b>
      <div class="rl-track"><i class="rl-turf"></i></div>
      <div class="rl-bar"><i></i></div><span class="rl-pct">0%</span>
      <p class="rl-tip">💡 ${esc(tip)}</p></div>`;
  document.body.appendChild(box);
  const track = box.querySelector<HTMLElement>('.rl-track')!, bar = box.querySelector<HTMLElement>('.rl-bar i')!, pct = box.querySelector<HTMLElement>('.rl-pct')!;
  const body = m.bodies.field!;
  const anim = body.rig?.animations.find((a) => a.index === RUN_RIGHT);
  const runners: { cv: HTMLCanvasElement; head: HTMLImageElement | null; offset: number; speed: number; gk: boolean }[] = [];
  let bodyImg: HTMLImageElement | null = null, gkImg: HTMLImageElement | null = null, alive = true, raf = 0, shownAt = 0, target = 0, shown = 0;
  const players = team.slice(0, 5);
  const fw = body.frameW, fh = body.frameH;
  players.forEach((p, i) => {
    const cv = document.createElement('canvas');
    cv.width = fw; cv.height = fh;
    cv.className = 'rl-runner';
    cv.style.width = `${fw * SCALE}px`; cv.style.height = `${fh * SCALE}px`;
    track.appendChild(cv);
    const r = { cv, head: null as HTMLImageElement | null, offset: i / Math.max(1, players.length), speed: 0.9 + ((i * 37) % 10) / 40, gk: p.body === 'gk' };
    runners.push(r);
    void img(p.head.texture).then((h) => { r.head = h; });
  });
  const ball = document.createElement('i');
  ball.className = 'rl-ball';
  track.appendChild(ball);
  void img(kitField ?? body.texture).then((b) => { bodyImg = b; });
  if (m.bodies.gk) void img(m.bodies.gk.texture).then((b) => { gkImg = b; });
  const cell = (_sheet: HTMLImageElement, c: number, cols: number) => [(c % cols) * fw, Math.floor(c / cols) * fh] as const;
  const t0 = performance.now();
  const ticks = anim ? anim.frames.reduce((n, f) => n + f.d, 0) : 1;
  const tick = () => {
    if (!alive) return;
    const ms = performance.now() - t0, w = track.clientWidth;
    // the current rig frame (durations in 1/60 s ticks)
    let tk = Math.floor(ms / (1000 / 60) * 1.4) % ticks, f = anim?.frames[0];
    if (anim) for (const fr of anim.frames) { if (tk < fr.d) { f = fr; break; } tk -= fr.d; }
    runners.forEach((r, i) => {
      // each runs across the track and comes back round, staggered, at his own pace
      const u = ((ms / 1000) * 0.22 * r.speed + r.offset) % 1;
      r.cv.style.transform = `translateX(${(u * (w + fw * SCALE * 2) - fw * SCALE * 1.5).toFixed(0)}px) translateY(${(Math.sin(ms / 90 + i) * 1.5).toFixed(1)}px)`;
      const c = r.cv.getContext('2d')!, sheet = r.gk && gkImg ? gkImg : bodyImg;
      c.clearRect(0, 0, fw, fh);
      if (!f) return;
      c.save();
      if (anim?.mirror) { c.translate(fw, 0); c.scale(-1, 1); } // the run to the right is the left one mirrored
      if (sheet && f.b !== null) { const [sx, sy] = cell(sheet, f.b, body.columns); c.drawImage(sheet, sx, sy, fw, fh, 0, 0, fw, fh); }
      if (r.head && f.h !== null) {
        const hp = players[i].head, [hx, hy] = cell(r.head, f.h, hp.columns);
        if (f.hf) { c.translate(fw, 0); c.scale(-1, 1); }
        c.drawImage(r.head, hx, hy, hp.frameW, hp.frameH, body.originX - hp.originX, body.originY - hp.originY, hp.frameW, hp.frameH);
      }
      c.restore();
      if (i === 0) ball.style.transform = `translateX(${(u * (w + fw * SCALE * 2) - fw * SCALE * 1.5 + fw * SCALE * 0.95).toFixed(0)}px) translateY(${(-Math.abs(Math.sin(ms / 140)) * 10).toFixed(1)}px) rotate(${(ms / 2) % 360}deg)`;
    });
    // the bar eases towards the real share
    shown += (target - shown) * 0.15;
    bar.style.width = `${(shown * 100).toFixed(1)}%`;
    pct.textContent = `${Math.round(shown * 100)}%`;
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);
  // only show it if the load takes a moment (a quick load never flashes it)
  const reveal = window.setTimeout(() => { box.classList.add('on'); shownAt = performance.now(); }, 180);
  return {
    progress(p: number) { target = Math.max(target, Math.min(1, p)); },
    done() {
      window.clearTimeout(reveal);
      target = 1;
      const close = () => { alive = false; cancelAnimationFrame(raf); box.remove(); };
      if (!shownAt) { close(); return; }
      // once shown, it stays long enough to be seen, then fades out
      const wait = Math.max(0, 450 - (performance.now() - shownAt));
      window.setTimeout(() => { box.classList.add('out'); window.setTimeout(close, 300); }, wait);
    },
  };
}
