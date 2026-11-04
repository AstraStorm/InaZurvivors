/**
 * 1.76 (author): six shots redrawn from the anime scenes the author linked, watched frame by frame:
 *   Campo Umbrío (Black Field, SVG4RT-hmCU) — the stadium turns black and red, red cracks hang in the air, a red sun swells
 *     round the ball; it flies in red and black flames and shadow beasts with red outlines rise where it lands.
 *   Círculo de Espadas (Gladius Arch, 7FI7Sxaqdmc) — golden speed lines on black, a ring of swords (grey blades, brown hilts)
 *     turns round the shooter as he jumps; the ball goes in a golden glow with swords flying beside it, a yellow blast.
 *   Llamarada atómica (Atomic Flare, DvUw2G-Rw9I) — a ring with flames marks the ground, a sun with flaring loops appears,
 *     columns of fire rise in an orange sky; the ball itself is the sun.
 *   Ruptura relámpago (Inazuma Break, GToseb81arc) — a magenta flash, then a huge golden bolt outlined in purple strikes the
 *     ball; it flies as that bolt and bursts in golden and purple branches with a ring of dust.
 *   Súper relámpago (ZnmZGFITVtw) — yellow bolts burst up from the ball when it is kicked; it flies crackling in zigzags.
 *   Zero Magnum (IVyOcM1cvWI, combined: Bailong and Tezcat) — spirals of white light rise round each of them in a purple
 *     night; they kick together and the ball becomes a white and blue whirl with golden rays and a purple ring, then flies
 *     as a white and blue beam.
 *   Lanza de Odín (Gungnir, y-no8D1xSVo) — a starry blue vortex opens at his feet and he sinks into space; his kick turns the
 *     ball into a spear of pink and white light, and it bursts out of a black hole ringed in pink.
 *   Sabiduría divina (God Knows, fLzTp8ggVrw) — six white angel wings open on his back and he rises in light; the ball becomes
 *     a sphere of white and blue light crossed by electric veins.
 * Dribbles (movieDribble): Espada real (ZjEVeVIzEy8) a golden sword held high, then a dash in blue speed lines; El ojo del
 *   huracán (bOjcMVCzKkg) two walls of white wind in a V and a blue cross flash, then a sandy whirlwind with debris; Hora
 *   celestial (BJtlb_kJtzA) a finger to the sky, time stops (grey, rivals still) and he crosses as a pale afterimage.
 *   Ataque Omega (TssCtlpb8sM) — the three of Protocol Omega come in, each in a triangle of red, blue and green; a white
 *     crystal breaks, the ball arcs high in a streak of fire and lands in a burst of rainbow rays.
 */
import Phaser from 'phaser';

type S = Phaser.Scene;
type Img = Phaser.GameObjects.Image;
type G = Phaser.GameObjects.Graphics;
const AIR = 8900;
const ADD = Phaser.BlendModes.ADD;

export type MovieMove = 'umbrio' | 'espadas' | 'atomica' | 'ruptura' | 'superrayo' | 'omega' | 'odin' | 'sabiduria';
export function movieOf(name: string): MovieMove | null {
  const n = name.trim();
  if (/^campo umbr[ií]o$|black ?field/i.test(n)) return 'umbrio';
  if (/c[ií]rculo de espadas|gladius arch/i.test(n)) return 'espadas';
  if (/llamarada at[oó]mica|atomic flare/i.test(n)) return 'atomica';
  if (/ruptura rel[aá]mpago|inazuma break/i.test(n)) return 'ruptura';
  if (/^s[uú]per ?rel[aá]mpago$/i.test(n)) return 'superrayo';
  if (/^ataque omega$|omega attack/i.test(n)) return 'omega';
  if (/^lanza de od[ií]n$|gungnir/i.test(n)) return 'odin';
  if (/^sabidur[ií]a divina$|god knows/i.test(n)) return 'sabiduria';
  return null;
}

/** Draws `frame(g, k, t)` every frame for `ms` (k 0..1) on its own graphics, then removes it. */
function play(scene: S, x: number, y: number, depth: number, ms: number, frame: (g: G, k: number, t: number) => void, blend = false) {
  const g = scene.add.graphics({ x, y }).setDepth(depth);
  if (blend) g.setBlendMode(ADD);
  const t0 = scene.time.now;
  const tick = () => {
    const t = scene.time.now - t0;
    if (t > ms || !g.active) { scene.events.off('update', tick); g.destroy(); return; }
    g.clear();
    frame(g, t / ms, t / 1000);
  };
  scene.events.on('update', tick);
  scene.events.once('shutdown', () => scene.events.off('update', tick));
  tick();
}

/** Follows a flying ball; `end` runs once where it stopped. */
function ride(scene: S, ball: Img, frame: (g: G, bx: number, by: number, ang: number, t: number) => void, end: (x: number, y: number) => void) {
  const g = scene.add.graphics().setDepth(AIR);
  let px = ball.x, py = ball.y, ang = 0;
  const t0 = scene.time.now;
  const tick = () => {
    if (!ball.active) { scene.events.off('update', tick); g.destroy(); end(px, py); return; }
    if (Math.hypot(ball.x - px, ball.y - py) > 0.5) ang = Math.atan2(ball.y - py, ball.x - px);
    px = ball.x; py = ball.y;
    g.clear();
    frame(g, px, py, ang, (scene.time.now - t0) / 1000);
  };
  scene.events.on('update', tick);
  scene.events.once('shutdown', () => scene.events.off('update', tick));
}

/** A jagged bolt from (x0,y0) to (x1,y1); `seed` keeps its shape for a few frames instead of flickering every frame. */
function bolt(g: G, x0: number, y0: number, x1: number, y1: number, seed: number, w: number, color: number, edge: number | null, alpha = 1, steps = 7) {
  const pts: [number, number][] = [[x0, y0]];
  const dx = x1 - x0, dy = y1 - y0, len = Math.hypot(dx, dy) || 1, nx = -dy / len, ny = dx / len;
  for (let i = 1; i < steps; i++) {
    const u = i / steps, j = Math.sin(seed * 12.9898 + i * 78.233) * 43758.5453;
    const off = ((j - Math.floor(j)) - 0.5) * len * 0.28;
    pts.push([x0 + dx * u + nx * off, y0 + dy * u + ny * off]);
  }
  pts.push([x1, y1]);
  const stroke = (width: number, c: number, a: number) => { g.lineStyle(width, c, a).beginPath().moveTo(pts[0][0], pts[0][1]); for (const p of pts.slice(1)) g.lineTo(p[0], p[1]); g.strokePath(); };
  if (edge !== null) stroke(w + 4, edge, alpha * 0.9);
  stroke(w, color, alpha);
  stroke(Math.max(1, w * 0.35), 0xffffff, alpha);
}

/** Sparks flying out from a point and fading. */
function sparks(scene: S, x: number, y: number, n: number, dist: number, colors: number[], ms = 380) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, d = dist * (0.5 + Math.random() * 0.6);
    const s = scene.add.circle(x, y, 1.5 + Math.random() * 2, colors[i % colors.length], 1).setDepth(AIR + 2).setBlendMode(ADD);
    scene.tweens.add({ targets: s, x: x + Math.cos(a) * d, y: y + Math.sin(a) * d * 0.7, alpha: 0, duration: ms, onComplete: () => s.destroy() });
  }
}

// ------------------------------------------------------------------ Campo Umbrío
const UM_RED = 0xe0102a, UM_HOT = 0xff4a5a, UM_BLACK = 0x0a0208;
function crack(g: G, x: number, y: number, len: number, ang: number, alpha: number) {
  // a jagged red tear with a black core, like the cracks hanging over the stadium
  const pts = [0, 0.3, 0.55, 0.8, 1].map((u, i) => [x + Math.cos(ang) * len * u + (i % 2 ? 4 : -3), y + Math.sin(ang) * len * u + (i % 2 ? -3 : 3)]);
  g.lineStyle(5, UM_RED, 0.8 * alpha).beginPath().moveTo(pts[0][0], pts[0][1]); for (const p of pts.slice(1)) g.lineTo(p[0], p[1]); g.strokePath();
  g.lineStyle(2, UM_BLACK, alpha).beginPath().moveTo(pts[0][0], pts[0][1]); for (const p of pts.slice(1)) g.lineTo(p[0], p[1]); g.strokePath();
}
function umbrioCharge(scene: S, x: number, y: number, lv: number, ms: number) {
  const size = 30 + lv * 2;
  const cracks = Array.from({ length: 6 }, (_, i) => ({ a: i * 1.05 + 0.3, d: size * (1.3 + (i % 3) * 0.35), r: -0.6 + (i % 4) * 0.4 }));
  play(scene, x, y, AIR - 2, ms + 120, (g, k) => { // the pitch round the shooter goes black and red
    const a = Math.min(1, k * 3) * (1 - Math.max(0, k - 0.9) * 10);
    for (let i = 0; i < 4; i++) g.fillStyle(i % 2 ? UM_RED : UM_BLACK, (i % 2 ? 0.1 : 0.22) * a).fillEllipse(0, 2, size * (4.4 - i * 0.9), size * (2.2 - i * 0.45));
    for (const c of cracks) crack(g, Math.cos(c.a) * c.d, Math.sin(c.a) * c.d * 0.55 - 14, 16, c.r, a);
  });
  play(scene, x, y - 18, AIR + 1, ms, (g, k, t) => { // the red sun swelling round the ball
    const r = size * (0.25 + k * 0.55);
    g.fillStyle(UM_RED, 0.25).fillCircle(0, 0, r * 1.5);
    g.fillStyle(UM_RED, 0.55).fillCircle(0, 0, r);
    g.fillStyle(UM_HOT, 0.8).fillCircle(0, 0, r * 0.55);
    g.fillStyle(0xffffff, 0.9).fillCircle(0, 0, r * 0.22);
    for (let i = 0; i < 10; i++) { const a = t * 2 + i * 0.63; g.lineStyle(2, UM_RED, 0.6).lineBetween(Math.cos(a) * r * 1.1, Math.sin(a) * r * 1.1, Math.cos(a) * r * 1.7, Math.sin(a) * r * 1.7); }
  }, true);
}
function umbrioShot(scene: S, ball: Img, lv: number) {
  ride(scene, ball, (g, bx, by, ang, t) => {
    const r = 10 + lv * 0.6, bx2 = -Math.cos(ang), by2 = -Math.sin(ang), nx = -by2, ny = bx2;
    g.fillStyle(UM_RED, 0.35).fillCircle(bx, by, r * 1.6);
    for (let i = 0; i < 7; i++) { // black flames licking backwards, outlined in red
      const u = i / 6, w = Math.sin(t * 18 + i * 1.7) * r * 0.9 * (1 - u * 0.4), d = 8 + u * 46;
      const tx = bx + bx2 * d + nx * w, ty = by + by2 * d + ny * w;
      g.lineStyle(7 - u * 4, UM_RED, 0.75).lineBetween(bx, by, tx, ty);
      g.lineStyle(3 - u * 1.5, UM_BLACK, 0.95).lineBetween(bx, by, tx, ty);
    }
  }, (x, y) => umbrioBurst(scene, x, y, lv));
}
/** Shadow beasts with red outlines rising from the ground (the bat-winged shapes of the scene) */
function umbrioBurst(scene: S, x: number, y: number, lv: number) {
  const n = 3 + Math.floor(lv / 4);
  for (let i = 0; i < n; i++) {
    const ox = (i - (n - 1) / 2) * 26, s = 0.8 + (i % 2) * 0.35;
    play(scene, x + ox, y + 8, AIR + 1, 620, (g, k) => {
      const rise = k * 34, a = k < 0.7 ? 1 : (1 - k) / 0.3, flap = Math.sin(k * 14) * 0.25;
      const wing = (side: number) => [[0, -rise], [side * 20 * s, -rise - 18 * s - flap * 10], [side * 30 * s, -rise - 4 * s], [side * 18 * s, -rise + 2], [side * 8 * s, -rise + 6]];
      for (const side of [-1, 1]) {
        const pts = wing(side).map(([px, py]) => new Phaser.Math.Vector2(px, py));
        g.fillStyle(UM_BLACK, 0.9 * a).fillPoints(pts, true);
        g.lineStyle(2, UM_RED, a).strokePoints(pts, true);
      }
      g.fillStyle(UM_BLACK, a).fillEllipse(0, -rise + 4, 10 * s, 16 * s);
      g.fillStyle(UM_HOT, a).fillCircle(-2 * s, -rise - 2, 1.4).fillCircle(2 * s, -rise - 2, 1.4);
    });
  }
  play(scene, x, y, AIR, 420, (g, k) => { g.fillStyle(UM_RED, 0.5 * (1 - k)).fillEllipse(0, 6, 60 + k * 50, 20 + k * 16); });
  sparks(scene, x, y, 10, 40, [UM_RED, UM_HOT, UM_BLACK]);
}

// ------------------------------------------------------------------ Círculo de Espadas
const SW_GOLD = 0xffd84a, SW_GOLD2 = 0xfff4b0, SW_BLADE = 0xd8dde6, SW_EDGE = 0x5a6170, SW_HILT = 0x7a4a24;
/** A sword: grey blade with a dark edge, a guard and a brown hilt, pointing along `ang` */
function sword(g: G, x: number, y: number, ang: number, len: number, alpha: number) {
  const c = Math.cos(ang), s = Math.sin(ang), nx = -s, ny = c, w = len * 0.09;
  const tip = [x + c * len * 0.6, y + s * len * 0.6], base = [x - c * len * 0.15, y - s * len * 0.15];
  const blade = [new Phaser.Math.Vector2(tip[0], tip[1]), new Phaser.Math.Vector2(base[0] + nx * w, base[1] + ny * w), new Phaser.Math.Vector2(base[0] - nx * w, base[1] - ny * w)];
  g.fillStyle(SW_BLADE, alpha).fillPoints(blade, true);
  g.lineStyle(1, SW_EDGE, alpha).strokePoints(blade, true);
  g.lineStyle(3, SW_HILT, alpha).lineBetween(base[0] + nx * w * 2.2, base[1] + ny * w * 2.2, base[0] - nx * w * 2.2, base[1] - ny * w * 2.2);
  g.lineStyle(3, SW_HILT, alpha).lineBetween(base[0], base[1], x - c * len * 0.38, y - s * len * 0.38);
}
function espadasCharge(scene: S, x: number, y: number, lv: number, ms: number) {
  const n = 7 + Math.floor(lv / 3), size = 30 + lv * 1.5;
  play(scene, x, y - 12, AIR - 2, ms, (g, k, t) => { // golden speed lines on black, behind
    const a = Math.min(1, k * 3);
    g.fillStyle(0x08080c, 0.4 * a).fillEllipse(0, 4, size * 3.4, size * 1.9);
    for (let i = 0; i < 16; i++) { const an = i * 0.39 + t * 0.5, r0 = size * 0.4, r1 = size * (1.3 + (i % 3) * 0.2); g.lineStyle(1.5, SW_GOLD, 0.55 * a).lineBetween(Math.cos(an) * r0, Math.sin(an) * r0 * 0.6, Math.cos(an) * r1, Math.sin(an) * r1 * 0.6); }
  }, true);
  play(scene, x, y - 12, AIR + 1, ms, (g, k, t) => { // the ring of swords turning round him as he jumps
    const rise = k * 10, a = Math.min(1, k * 4);
    for (let i = 0; i < n; i++) {
      const an = t * 4 + (i / n) * Math.PI * 2, rx = size * 0.95, ry = size * 0.45;
      const sx = Math.cos(an) * rx, sy = Math.sin(an) * ry - rise;
      sword(g, sx, sy, an + Math.PI / 2, 22, a * (Math.sin(an) > 0 ? 1 : 0.6));
    }
    g.fillStyle(SW_GOLD, 0.35 * k).fillCircle(0, -rise + 4, 8 + k * 8);
  });
}
function espadasShot(scene: S, ball: Img, lv: number) {
  const n = 3 + Math.floor(lv / 4);
  ride(scene, ball, (g, bx, by, ang, t) => {
    g.fillStyle(SW_GOLD, 0.3).fillCircle(bx, by, 16 + lv);
    g.fillStyle(SW_GOLD2, 0.55).fillCircle(bx, by, 9 + lv * 0.4);
    for (let i = 0; i < 6; i++) { const d = 8 + i * 9; g.fillStyle(SW_GOLD, 0.5 - i * 0.07).fillCircle(bx - Math.cos(ang) * d, by - Math.sin(ang) * d, 8 - i); }
    for (let i = 0; i < n; i++) { // swords flying beside the ball, points forward
      const ph = t * 7 + (i / n) * Math.PI * 2, off = Math.sin(ph) * 16, back = 14 + (i % 2) * 10;
      sword(g, bx - Math.cos(ang) * back - Math.sin(ang) * off, by - Math.sin(ang) * back + Math.cos(ang) * off, ang, 20, 0.95);
    }
  }, (x, y) => {
    play(scene, x, y, AIR + 2, 360, (g, k) => {
      g.fillStyle(SW_GOLD2, 0.8 * (1 - k)).fillCircle(0, 0, 14 + k * 40);
      g.fillStyle(SW_GOLD, 0.4 * (1 - k)).fillCircle(0, 0, 24 + k * 56);
      for (let i = 0; i < 8; i++) { const a = i * 0.785; sword(g, Math.cos(a) * (10 + k * 46), Math.sin(a) * (10 + k * 46) * 0.7, a, 18, 1 - k); }
    }, false);
    sparks(scene, x, y, 10, 44, [SW_GOLD, SW_GOLD2, 0xffffff]);
  });
}

// ------------------------------------------------------------------ Llamarada atómica
const AF_SUN = 0xff8a1a, AF_SUN2 = 0xffd04a, AF_CORE = 0xfff4c0, AF_DEEP = 0xd8400a;
/** The sun of the scene: a hot disc with a bumpy rim of flaring loops */
function sun(g: G, x: number, y: number, r: number, t: number, alpha: number) {
  g.fillStyle(AF_DEEP, 0.3 * alpha).fillCircle(x, y, r * 1.45);
  g.fillStyle(AF_SUN, 0.9 * alpha).fillCircle(x, y, r);
  g.fillStyle(AF_SUN2, 0.85 * alpha).fillCircle(x - r * 0.12, y - r * 0.12, r * 0.7);
  g.fillStyle(AF_CORE, 0.8 * alpha).fillCircle(x - r * 0.2, y - r * 0.2, r * 0.3);
  for (let i = 0; i < 9; i++) { // prominences: little loops along the rim
    const a = t * 1.2 + i * 0.7, lr = r * (0.22 + 0.08 * Math.sin(t * 6 + i));
    g.lineStyle(2, AF_SUN2, 0.9 * alpha).strokeCircle(x + Math.cos(a) * r * 1.05, y + Math.sin(a) * r * 1.05, lr);
  }
}
function atomicaCharge(scene: S, x: number, y: number, lv: number, ms: number) {
  const size = 28 + lv * 2;
  play(scene, x, y, AIR - 2, ms, (g, k, t) => {
    const a = Math.min(1, k * 4);
    g.lineStyle(2.5, 0xffffff, 0.9 * a).strokeEllipse(0, 4, size * 2.2, size * 0.7); // the ring on the ground
    for (let i = 0; i < 6; i++) { // its flame marks
      const an = i * 1.047, fx = Math.cos(an) * size * 1.1, fy = 4 + Math.sin(an) * size * 0.35;
      g.fillStyle(AF_SUN2, 0.9 * a).fillTriangle(fx - 3, fy, fx + 3, fy, fx + Math.sin(t * 12 + i) * 2, fy - 9);
    }
    // the orange sky round him and columns of fire rising
    g.fillStyle(AF_SUN, 0.16 * Math.max(0, k - 0.3) * 1.4).fillEllipse(0, -size * 0.4, size * 4, size * 2.4);
    for (let i = 0; i < 4; i++) {
      const cx = (i - 1.5) * size * 0.9, h = Math.max(0, k - 0.35 - i * 0.05) * size * 3;
      if (h > 0) for (let j = 0; j < 5; j++) g.fillStyle(j % 2 ? AF_SUN2 : AF_SUN, 0.6).fillEllipse(cx + Math.sin(t * 9 + j + i) * 3, 6 - h * (j / 5), 8 - j, h / 4);
    }
  }, true);
  play(scene, x, y - size * 1.2, AIR + 1, ms, (g, k, t) => { const s = Math.max(0, k - 0.25) / 0.75; if (s > 0) sun(g, 0, 0, size * 0.45 * s, t, 1); });
}
function atomicaShot(scene: S, ball: Img, lv: number) {
  const r = 11 + lv * 0.7;
  ride(scene, ball, (g, bx, by, ang, t) => {
    for (let i = 0; i < 6; i++) { const d = 10 + i * 10; g.fillStyle(i % 2 ? AF_SUN2 : AF_SUN, 0.45 - i * 0.06).fillCircle(bx - Math.cos(ang) * d, by - Math.sin(ang) * d, r * (0.9 - i * 0.12)); }
    sun(g, bx, by, r, t, 1);
  }, (x, y) => {
    play(scene, x, y, AIR + 2, 420, (g, k, t) => {
      sun(g, 0, 0, r * (1 + k * 2.4), t, 1 - k);
      g.lineStyle(3, AF_SUN2, 1 - k).strokeEllipse(0, 6, 40 + k * 90, 14 + k * 30);
    });
    sparks(scene, x, y, 12, 48, [AF_SUN, AF_SUN2, AF_CORE]);
  });
}

// ------------------------------------------------------------------ Ruptura relámpago
const IB_GOLD = 0xffd23f, IB_GOLD2 = 0xfff2a0, IB_PURPLE = 0x6a2ad8, IB_MAGENTA = 0xff3ad8;
/** The windup: a magenta flash, then the huge golden bolt outlined in purple strikes the meeting point. */
export function rupturaCharge(scene: S, x: number, y: number, lv: number, ms: number) {
  const size = 32 + lv * 2;
  play(scene, x, y - 10, AIR - 1, ms * 0.5, (g, k) => { g.fillStyle(IB_MAGENTA, 0.35 * (1 - k)).fillCircle(0, 0, size * (0.8 + k * 1.6)); g.fillStyle(0xffffff, 0.5 * (1 - k)).fillCircle(0, 0, size * 0.5); }, true);
  play(scene, x, y, AIR + 1, ms + 160, (g, k, t) => {
    if (k < 0.45) return;
    const seed = Math.floor(t * 14), a = k > 0.9 ? (1 - k) * 10 : 1;
    bolt(g, -size * 0.3, -size * 3.2, 0, -12, seed, 7 + lv * 0.3, IB_GOLD, IB_PURPLE, a, 8);
    bolt(g, size * 0.6, -size * 2.6, 0, -12, seed + 3, 3, IB_GOLD2, IB_PURPLE, a * 0.8, 6);
    g.fillStyle(IB_GOLD2, 0.6 * a).fillCircle(0, -12, 10 + Math.sin(t * 40) * 2);
  });
}
export function rupturaShot(scene: S, ball: Img, lv: number) {
  ride(scene, ball, (g, bx, by, ang, t) => {
    const seed = Math.floor(t * 16), len = 50 + lv * 3;
    bolt(g, bx - Math.cos(ang) * len, by - Math.sin(ang) * len, bx, by, seed, 6 + lv * 0.25, IB_GOLD, IB_PURPLE, 1, 6);
    g.fillStyle(IB_GOLD2, 0.6).fillCircle(bx, by, 10 + lv * 0.4);
  }, (x, y) => {
    play(scene, x, y, AIR + 2, 380, (g, k, t) => {
      const seed = Math.floor(t * 18), a = 1 - k;
      for (let i = 0; i < 6; i++) { const an = i * 1.047 + 0.3, l = 20 + k * 40; bolt(g, 0, 0, Math.cos(an) * l, Math.sin(an) * l * 0.7, seed + i, 3, IB_GOLD, IB_PURPLE, a, 4); }
      g.lineStyle(3, 0xc8c0b0, 0.7 * a).strokeEllipse(0, 8, 40 + k * 80, 12 + k * 24); // the ring of dust
    });
    sparks(scene, x, y, 10, 40, [IB_GOLD, IB_GOLD2, IB_PURPLE]);
  });
}

// ------------------------------------------------------------------ Súper relámpago
const SR_Y = 0xffe83a, SR_Y2 = 0xfff8b0, SR_EDGE = 0xd89a10;
export function superrayoCharge(scene: S, x: number, y: number, lv: number, ms: number) {
  play(scene, x, y - 14, AIR + 1, ms + 120, (g, k, t) => {
    if (k < 0.55) { g.fillStyle(SR_Y, 0.25 * k).fillCircle(0, 0, 10 + k * 10); return; }
    const seed = Math.floor(t * 14), n = 3 + Math.floor(lv / 3), a = k > 0.92 ? (1 - k) * 12 : 1;
    for (let i = 0; i < n; i++) { const an = -Math.PI / 2 + (i - (n - 1) / 2) * 0.45; bolt(g, 0, 0, Math.cos(an) * (40 + lv * 2), Math.sin(an) * (46 + lv * 2), seed + i, 3, SR_Y, SR_EDGE, a, 5); }
    g.fillStyle(SR_Y2, 0.8 * a).fillCircle(0, 0, 9);
  });
}
export function superrayoShot(scene: S, ball: Img, lv: number) {
  ride(scene, ball, (g, bx, by, ang, t) => {
    const seed = Math.floor(t * 20);
    g.fillStyle(SR_Y, 0.3).fillCircle(bx, by, 14 + lv * 0.5);
    for (let i = 0; i < 4; i++) { // crackling zigzags round and behind the ball
      const an = ang + Math.PI + (i - 1.5) * 0.7, l = 18 + (i % 2) * 14;
      bolt(g, bx, by, bx + Math.cos(an) * l, by + Math.sin(an) * l, seed + i * 7, 2, SR_Y, SR_EDGE, 0.95, 4);
    }
  }, (x, y) => {
    play(scene, x, y, AIR + 2, 320, (g, k, t) => {
      const seed = Math.floor(t * 20);
      for (let i = 0; i < 8; i++) { const an = i * 0.785; bolt(g, 0, 0, Math.cos(an) * (14 + k * 36), Math.sin(an) * (14 + k * 36), seed + i, 2.5, SR_Y, SR_EDGE, 1 - k, 4); }
      g.fillStyle(SR_Y2, 0.8 * (1 - k)).fillCircle(0, 0, 10 + k * 14);
    });
  });
}

// ------------------------------------------------------------------ Ataque Omega
const OM_COLORS = [0xe8303a, 0x2a6aff, 0x2ad86a];
const RAINBOW = [0xff3030, 0xff9a20, 0xffe830, 0x40e040, 0x30c8ff, 0x4a50ff, 0xa040ff];
function omegaCharge(scene: S, x: number, y: number, lv: number, ms: number) {
  const size = 30 + lv * 2;
  // the three of Omega, each in a triangle of its colour, closing round the shooter; then a white crystal breaks
  play(scene, x, y - 14, AIR + 1, ms + 100, (g, k, t) => {
    const close = 1 - Math.min(1, k * 1.6) * 0.55, a = k > 0.85 ? (1 - k) / 0.15 : Math.min(1, k * 5);
    for (let i = 0; i < 3; i++) {
      const an = -Math.PI / 2 + i * 2.094 + t * 1.2, cx = Math.cos(an) * size * close, cy = Math.sin(an) * size * close * 0.7;
      const s = size * 0.42, pts = [0, 2.094, 4.189].map((o) => new Phaser.Math.Vector2(cx + Math.cos(an + Math.PI + o) * s, cy + Math.sin(an + Math.PI + o) * s));
      g.fillStyle(OM_COLORS[i], 0.55 * a).fillPoints(pts, true);
      g.lineStyle(2, 0xffffff, 0.9 * a).strokePoints(pts, true);
      g.fillStyle(0x1a1a28, 0.9 * a).fillCircle(cx, cy - 2, s * 0.22).fillRect(cx - s * 0.18, cy + 1, s * 0.36, s * 0.34); // a figure in it
    }
    if (k > 0.7) { // the white crystal
      const c = (k - 0.7) / 0.3, r = 6 + c * 16;
      const pts = [0, 1, 2, 3, 4, 5].map((i) => new Phaser.Math.Vector2(Math.cos(i * 1.047 + 0.3) * r * (i % 2 ? 0.6 : 1), Math.sin(i * 1.047 + 0.3) * r * (i % 2 ? 0.6 : 1)));
      g.fillStyle(0xffffff, 0.95 * (1 - c * 0.5)).fillPoints(pts, true);
      g.lineStyle(1.5, 0xbfe8ff, 1).strokePoints(pts, true);
    }
  });
}
function omegaShot(scene: S, ball: Img, lv: number) {
  const trail: [number, number][] = [];
  ride(scene, ball, (g, bx, by) => { // the streak of fire the ball draws in the sky
    trail.push([bx, by]);
    if (trail.length > 16) trail.shift();
    for (let i = 1; i < trail.length; i++) {
      const u = i / trail.length;
      g.lineStyle(8 * u + 2, 0xff5a1a, 0.7 * u).lineBetween(trail[i - 1][0], trail[i - 1][1], trail[i][0], trail[i][1]);
      g.lineStyle(3 * u + 1, 0xffd04a, u).lineBetween(trail[i - 1][0], trail[i - 1][1], trail[i][0], trail[i][1]);
    }
    g.fillStyle(0xffd04a, 0.5).fillCircle(bx, by, 9 + lv * 0.4);
  }, (x, y) => {
    play(scene, x, y, AIR + 2, 460, (g, k) => { // the rainbow rays
      const a = 1 - k, r = 20 + k * 80;
      for (let i = 0; i < 14; i++) {
        const an = i * 0.449, c = RAINBOW[i % RAINBOW.length];
        g.fillStyle(c, 0.6 * a).fillTriangle(0, 0, Math.cos(an - 0.15) * r, Math.sin(an - 0.15) * r * 0.75, Math.cos(an + 0.15) * r, Math.sin(an + 0.15) * r * 0.75);
      }
      g.fillStyle(0xffffff, 0.9 * a).fillCircle(0, 0, 10 + k * 10);
    }, true);
  });
}

export function movieCharge(scene: S, m: MovieMove, x: number, y: number, lv: number, ms: number) {
  if (m === 'odin') odinCharge(scene, x, y, lv, ms);
  else if (m === 'sabiduria') sabiduriaCharge(scene, x, y, lv, ms);
  else if (m === 'umbrio') umbrioCharge(scene, x, y, lv, ms);
  else if (m === 'espadas') espadasCharge(scene, x, y, lv, ms);
  else if (m === 'atomica') atomicaCharge(scene, x, y, lv, ms);
  else if (m === 'ruptura') rupturaCharge(scene, x, y, lv, ms);
  else if (m === 'superrayo') superrayoCharge(scene, x, y, lv, ms);
  else omegaCharge(scene, x, y, lv, ms);
}
export function movieShot(scene: S, m: MovieMove, ball: Img, lv: number) {
  if (m === 'odin') odinShot(scene, ball, lv);
  else if (m === 'sabiduria') sabiduriaShot(scene, ball, lv);
  else if (m === 'umbrio') umbrioShot(scene, ball, lv);
  else if (m === 'espadas') espadasShot(scene, ball, lv);
  else if (m === 'atomica') atomicaShot(scene, ball, lv);
  else if (m === 'ruptura') rupturaShot(scene, ball, lv);
  else if (m === 'superrayo') superrayoShot(scene, ball, lv);
  else omegaShot(scene, ball, lv);
}

// ------------------------------------------------------------------ Zero Magnum (combined)
const ZM_WHITE = 0xf4fbff, ZM_BLUE = 0x7fd8ff, ZM_GOLD = 0xffd84a, ZM_PURPLE = 0x7a2ad8, ZM_NIGHT = 0x14103a;
/** `who` are where Bailong and Tezcat stand; `x, y` where they meet and kick. */
export function zeroCharge(scene: S, who: { x: number; y: number }[], x: number, y: number, lv: number, ms: number) {
  const size = 30 + lv * 2;
  play(scene, x, y, AIR - 2, ms, (g, k) => { // the purple night round them
    const a = Math.min(1, k * 3);
    for (let i = 0; i < 4; i++) g.fillStyle(i % 2 ? ZM_PURPLE : ZM_NIGHT, (i % 2 ? 0.12 : 0.22) * a).fillEllipse(0, 0, size * (4.6 - i * 0.9), size * (2.6 - i * 0.5));
  });
  for (const p of who) play(scene, p.x, p.y, AIR + 1, ms * 0.75, (g, k, t) => { // spirals of white light rising round each one
    const a = Math.min(1, k * 4) * (1 - Math.max(0, k - 0.8) * 5);
    for (let i = 0; i < 5; i++) {
      const h = -6 - i * 8 - k * 10, w = 12 + i * 2.5, ph = t * 9 + i;
      g.lineStyle(3, ZM_WHITE, 0.85 * a).beginPath().arc(0, h, w, ph, ph + 2.6).strokePath();
      g.lineStyle(1.5, ZM_BLUE, 0.7 * a).beginPath().arc(0, h, w + 2, ph + 0.3, ph + 2.2).strokePath();
    }
  }, true);
  play(scene, x, y - 12, AIR + 2, ms, (g, k, t) => { // the whirl at the kick: white-blue core, golden rays, purple ring
    if (k < 0.55) return;
    const s2 = (k - 0.55) / 0.45, r = size * (0.3 + s2 * 0.45);
    for (let i = 0; i < 6; i++) { const an = i * 1.047 + t; g.lineStyle(4, ZM_GOLD, 0.75 * s2).lineBetween(Math.cos(an) * r, Math.sin(an) * r * 0.7, Math.cos(an) * r * 2.4, Math.sin(an) * r * 1.7); }
    g.lineStyle(5, ZM_PURPLE, 0.8 * s2).strokeCircle(0, 0, r * 1.25);
    g.fillStyle(ZM_BLUE, 0.6).fillCircle(0, 0, r);
    g.fillStyle(ZM_WHITE, 0.9).fillCircle(0, 0, r * 0.6);
    for (let i = 0; i < 2; i++) g.lineStyle(2, ZM_BLUE, 0.9).beginPath().arc(0, 0, r * (0.3 + i * 0.22), t * 8 + i * 3, t * 8 + i * 3 + 3.6).strokePath();
  }, true);
}
export function zeroShot(scene: S, ball: Img, lv: number) {
  const r = 10 + lv * 0.6;
  ride(scene, ball, (g, bx, by, ang, t) => { // a white and blue beam behind the ball
    const len = 70 + lv * 4, c = Math.cos(ang), sn = Math.sin(ang), nx = -sn, ny = c;
    for (const [w, col, a] of [[r * 2.2, ZM_BLUE, 0.35], [r * 1.3, ZM_WHITE, 0.7]] as const) {
      const pts = [[bx + nx * w * 0.5, by + ny * w * 0.5], [bx - c * len + nx * w * 0.15, by - sn * len + ny * w * 0.15], [bx - c * len - nx * w * 0.15, by - sn * len - ny * w * 0.15], [bx - nx * w * 0.5, by - ny * w * 0.5]].map(([px, py]) => new Phaser.Math.Vector2(px, py));
      g.fillStyle(col, a).fillPoints(pts, true);
    }
    g.lineStyle(3, ZM_PURPLE, 0.8).strokeCircle(bx, by, r * 1.3);
    g.fillStyle(ZM_WHITE, 0.9).fillCircle(bx, by, r);
    g.lineStyle(2, ZM_BLUE, 1).beginPath().arc(bx, by, r * 0.6, t * 12, t * 12 + 3.6).strokePath();
  }, (x, y) => {
    play(scene, x, y, AIR + 2, 420, (g, k) => {
      const a = 1 - k;
      g.fillStyle(ZM_BLUE, 0.5 * a).fillCircle(0, 0, 18 + k * 60);
      g.fillStyle(ZM_WHITE, 0.9 * a).fillCircle(0, 0, 10 + k * 26);
      g.lineStyle(4, ZM_PURPLE, a).strokeCircle(0, 0, 24 + k * 70);
      for (let i = 0; i < 8; i++) { const an = i * 0.785; g.lineStyle(3, ZM_GOLD, a).lineBetween(Math.cos(an) * (16 + k * 20), Math.sin(an) * (16 + k * 20), Math.cos(an) * (30 + k * 70), Math.sin(an) * (30 + k * 70)); }
    }, true);
    sparks(scene, x, y, 12, 50, [ZM_WHITE, ZM_BLUE, ZM_GOLD, ZM_PURPLE]);
  });
}


// ------------------------------------------------------------------ Lanza de Odín
const OD_BLUE = 0x2a3aa8, OD_STAR = 0xbfd8ff, OD_PINK = 0xff7ad8, OD_WHITE = 0xfff4ff, OD_VOID = 0x0a0a1e;
function odinCharge(scene: S, x: number, y: number, lv: number, ms: number) {
  const size = 30 + lv * 2;
  play(scene, x, y + 4, AIR - 2, ms, (g, k, t) => { // the starry vortex at his feet
    const a = Math.min(1, k * 3), r = size * (0.5 + Math.min(1, k * 2) * 0.7);
    g.fillStyle(OD_VOID, 0.75 * a).fillEllipse(0, 0, r * 2.2, r * 0.8);
    for (let i = 0; i < 3; i++) g.lineStyle(3 - i, i % 2 ? OD_STAR : OD_BLUE, 0.85 * a).beginPath().arc(0, 0, r * (1 - i * 0.25), t * (4 + i) + i, t * (4 + i) + i + 4.2).strokePath();
    for (let i = 0; i < 10; i++) { const an = t * 2 + i * 0.63, d = r * (0.2 + (i % 5) * 0.17); g.fillStyle(OD_STAR, a).fillCircle(Math.cos(an) * d, Math.sin(an) * d * 0.36, 1.2); }
  });
  play(scene, x, y - 12, AIR + 1, ms, (g, k) => { // the spear of light forming at the kick
    if (k < 0.6) return;
    const s2 = (k - 0.6) / 0.4, l = 14 + s2 * 26;
    g.fillStyle(OD_PINK, 0.5 * s2).fillCircle(0, 0, 8 + s2 * 6);
    g.fillStyle(OD_WHITE, 0.95).fillTriangle(l, 0, -l * 0.4, -4, -l * 0.4, 4);
  }, true);
}
function odinShot(scene: S, ball: Img, lv: number) {
  ride(scene, ball, (g, bx, by, ang) => { // the ball is the tip of a spear of pink and white light
    const c = Math.cos(ang), sn = Math.sin(ang), nx = -sn, ny = c, len = 60 + lv * 4, w = 6 + lv * 0.3;
    const tri = (wd: number, ln: number) => [new Phaser.Math.Vector2(bx + c * 10, by + sn * 10), new Phaser.Math.Vector2(bx - c * ln + nx * wd, by - sn * ln + ny * wd), new Phaser.Math.Vector2(bx - c * ln - nx * wd, by - sn * ln - ny * wd)];
    g.fillStyle(OD_PINK, 0.5).fillPoints(tri(w * 1.8, len), true);
    g.fillStyle(OD_WHITE, 0.95).fillPoints(tri(w * 0.7, len * 0.8), true);
    g.lineStyle(3, OD_PINK, 0.9).lineBetween(bx + nx * w * 1.6, by + ny * w * 1.6, bx - nx * w * 1.6, by - ny * w * 1.6); // the guard of the spear
  }, (x, y) => {
    play(scene, x, y, AIR + 2, 460, (g, k) => { // it bursts out of a black hole ringed in pink
      const r = 14 + Math.sin(Math.min(1, k * 1.4) * Math.PI) * 26, a = 1 - k * 0.6;
      g.fillStyle(OD_VOID, 0.9 * a).fillEllipse(0, 0, r * 2, r * 1.7);
      g.lineStyle(4, OD_PINK, a).strokeEllipse(0, 0, r * 2.1, r * 1.8);
      g.lineStyle(1.5, OD_WHITE, a).strokeEllipse(0, 0, r * 2.3, r * 2);
    });
    sparks(scene, x, y, 10, 44, [OD_PINK, OD_WHITE, OD_STAR]);
  });
}

// ------------------------------------------------------------------ Sabiduría divina
const GK_WHITE = 0xffffff, GK_BLUE = 0xa8e0ff, GK_SKY = 0x5aa8ff;
/** One white wing: a fan of long feathers, tilted by `ang` on its side */
function wing(g: G, x: number, y: number, side: number, ang: number, len: number, alpha: number) {
  for (let i = 0; i < 4; i++) {
    const a = ang + side * (i * 0.22), l = len * (1 - i * 0.14);
    const tip = new Phaser.Math.Vector2(x + side * Math.cos(a) * l, y - Math.sin(a) * l);
    const pts = [new Phaser.Math.Vector2(x, y), new Phaser.Math.Vector2(x + side * Math.cos(a - side * 0.12) * l * 0.55, y - Math.sin(a - side * 0.12) * l * 0.55 - 3), tip,
      new Phaser.Math.Vector2(x + side * Math.cos(a + side * 0.12) * l * 0.55, y - Math.sin(a + side * 0.12) * l * 0.55 + 3)];
    g.fillStyle(GK_WHITE, 0.9 * alpha).fillPoints(pts, true);
    g.lineStyle(1, GK_BLUE, 0.8 * alpha).strokePoints(pts, true);
  }
}
/** The sphere of light: white core, pale blue body, electric veins over it */
function lightOrb(g: G, x: number, y: number, r: number, t: number, alpha: number) {
  g.fillStyle(GK_SKY, 0.3 * alpha).fillCircle(x, y, r * 1.6);
  g.fillStyle(GK_BLUE, 0.6 * alpha).fillCircle(x, y, r);
  g.fillStyle(GK_WHITE, 0.95 * alpha).fillCircle(x, y, r * 0.5);
  const seed = Math.floor(t * 12);
  for (let i = 0; i < 4; i++) { const an = i * 1.57 + seed; bolt(g, x, y, x + Math.cos(an) * r * 1.2, y + Math.sin(an) * r * 1.2, seed + i, 1.2, GK_WHITE, null, 0.9 * alpha, 4); }
}
function sabiduriaCharge(scene: S, x: number, y: number, lv: number, ms: number) {
  const len = 20 + lv * 1.2;
  play(scene, x, y - 14, AIR - 1, ms + 100, (g, k, t) => { // six white wings opening on his back, a column of light
    const open = Math.min(1, k * 2.2), a = k > 0.9 ? (1 - k) * 10 : 1, rise = k * 8, flap = Math.sin(t * 10) * 0.08;
    g.fillStyle(GK_SKY, 0.18 * open).fillRect(-10, -60 - rise, 20, 70);
    for (const side of [-1, 1]) for (let j = 0; j < 3; j++) wing(g, side * 2, -rise - j * 5, side, 0.15 + j * 0.45 + flap, len * open * (1 - j * 0.12), a);
  }, true);
  play(scene, x, y - 20, AIR + 1, ms, (g, k, t) => { if (k > 0.55) { const s2 = (k - 0.55) / 0.45; lightOrb(g, 0, 0, 6 + s2 * 8, t, s2); } }, true);
}
function sabiduriaShot(scene: S, ball: Img, lv: number) {
  const r = 11 + lv * 0.6;
  ride(scene, ball, (g, bx, by, ang, t) => {
    for (let i = 1; i < 6; i++) g.fillStyle(GK_BLUE, 0.35 - i * 0.05).fillCircle(bx - Math.cos(ang) * i * 9, by - Math.sin(ang) * i * 9, r * (1 - i * 0.12));
    lightOrb(g, bx, by, r, t, 1);
  }, (x, y) => {
    play(scene, x, y, AIR + 2, 420, (g, k, t) => { lightOrb(g, 0, 0, r * (1 + k * 2.4), t, 1 - k); for (const side of [-1, 1]) wing(g, 0, 0, side, 0.4, 30 * (1 + k), 1 - k); });
    sparks(scene, x, y, 12, 46, [GK_WHITE, GK_BLUE, GK_SKY]);
  });
}

// ------------------------------------------------------------------ dribbles
export type MovieDribble = 'espadareal' | 'huracan' | 'hora';
export function dribbleOf(name: string): MovieDribble | null {
  const n = name.trim();
  if (/^espada real$|king'?s sword/i.test(n)) return 'espadareal';
  if (/ojo del hurac[aá]n|storm zone|eye of the storm/i.test(n)) return 'huracan';
  if (/^hora celestial$|heaven'?s time/i.test(n)) return 'hora';
  return null;
}
/** A dribble from (x,y) towards (tx,ty) over `ms`; Hora celestial greys the area round it (time stopped). */
export function movieDribble(scene: S, d: MovieDribble, x: number, y: number, tx: number, ty: number, lv: number, ms = 420) {
  const ang = Math.atan2(ty - y, tx - x), len = Math.max(30, Math.hypot(tx - x, ty - y));
  if (d === 'espadareal') {
    play(scene, x, y - 14, AIR + 1, ms * 0.55, (g, k) => { // the golden sword held high
      const h = 18 + k * 18, a = Math.min(1, k * 4);
      g.fillStyle(0xffd84a, 0.35 * a).fillEllipse(0, -h * 0.6, 14, h * 1.6);
      g.fillStyle(0xfff4b0, a).fillTriangle(-3, 0, 3, 0, 0, -h * 1.4);
      g.lineStyle(3, 0xc89018, a).lineBetween(-7, 0, 7, 0);
    }, true);
    scene.time.delayedCall(ms * 0.45, () => play(scene, x, y - 10, AIR, ms * 0.6, (g, k) => { // blue speed lines along the dash
      const a = 1 - k;
      for (let i = 0; i < 7; i++) {
        const off = (i - 3) * 5, u0 = Math.max(0, k - 0.3), u1 = Math.min(1, k + 0.15 + (i % 3) * 0.1);
        g.lineStyle(i % 2 ? 1.5 : 2.5, i % 2 ? 0xffffff : 0x3a8aff, 0.8 * a).lineBetween(Math.cos(ang) * len * u0 - Math.sin(ang) * off, Math.sin(ang) * len * u0 + Math.cos(ang) * off,
          Math.cos(ang) * len * u1 - Math.sin(ang) * off, Math.sin(ang) * len * u1 + Math.cos(ang) * off);
      }
    }, true));
  } else if (d === 'huracan') {
    const size = 24 + lv * 1.5;
    play(scene, x, y - 8, AIR + 1, ms, (g, k, t) => {
      const a = k > 0.85 ? (1 - k) / 0.15 : 1;
      if (k < 0.4) { // two walls of white wind in a V, then the blue cross flash
        for (const side of [-1, 1]) for (let i = 0; i < 4; i++) g.lineStyle(4 - i, 0xffffff, 0.7 * a).lineBetween(side * (4 + i * 3), 6, side * (size * 0.9 + i * 4), -size * 1.3);
        const f = k / 0.4;
        g.lineStyle(2, 0x7fd8ff, f).lineBetween(-size * f, -4, size * f, -4).lineBetween(0, -4 - size * 0.5 * f, 0, -4 + size * 0.5 * f);
      } else for (let i = 0; i < 4; i++) { // the sandy whirlwind with debris, moving with him
        const r = size * (0.4 + i * 0.22), ph = t * (10 - i) + i, cx = Math.cos(ang) * len * (k - 0.4), cy = Math.sin(ang) * len * (k - 0.4) - i * 6;
        g.lineStyle(5 - i, i % 2 ? 0xe8c890 : 0xc89858, 0.8 * a).beginPath().arc(cx, cy, r, ph, ph + 3.6).strokePath();
        g.fillStyle(0x8a6a3a, a).fillRect(cx + Math.cos(ph * 1.3) * r, cy + Math.sin(ph * 1.3) * r * 0.5, 3, 3);
      }
    });
  } else {
    play(scene, x, y, AIR - 3, ms + 260, (g, k) => { // time stops: the area goes grey and still
      const a = Math.sin(Math.min(1, k * 1.2) * Math.PI), cx = len * 0.4 * Math.cos(ang), cy = len * 0.4 * Math.sin(ang);
      g.fillStyle(0x9aa0b0, 0.28 * a).fillEllipse(cx, cy, 150 + len, 90 + len * 0.5);
      g.lineStyle(1.5, 0xe8eef8, 0.6 * a).strokeEllipse(cx, cy, 150 + len, 90 + len * 0.5);
    });
    play(scene, x, y - 12, AIR + 1, ms, (g, k) => { // a finger to the sky, then a pale afterimage crossing the stopped field
      if (k < 0.3) { g.lineStyle(2, 0xffffff, 0.9).lineBetween(0, -4, 0, -20 - k * 30); g.fillStyle(0xffffff, 0.8).fillCircle(0, -22 - k * 30, 3); return; }
      for (let i = 0; i < 4; i++) { const u = Math.max(0, (k - 0.3) / 0.7 - i * 0.12); g.fillStyle(0xf0f4ff, 0.4 - i * 0.08).fillEllipse(Math.cos(ang) * len * u, Math.sin(ang) * len * u, 12, 22); }
    }, true);
  }
}
