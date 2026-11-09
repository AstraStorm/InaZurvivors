/**
 * Victor Blade's shots, redrawn from the scenes the author linked (UsBfWTxFD1M, «Tsurugi Kyousuke - All Hissatsus»), watched
 * frame by frame. Visual only: damage, reach and behaviour stay those of a shot in ArenaScene.
 *   Proyectil letal (Death Sword, 0:00) — the kick throws an arc of orange fire; the pitch goes black and a pale blue sphere
 *     swells round the ball with dark blue veins reaching out of it like roots; they draw back into it, it shrinks to a point
 *     and flashes a pink star, then flies as a blue star on a long thin line of light with pale green rays round it.
 *   Aguijón letal (Death Drop, 1:13) — he kicks the ball straight up and flips over it in blue speed lines; it turns into a
 *     dark red sphere wrapped in black, and he drives it down in a storm of dark blue tendrils.
 *   Tiro sobrenatural (Devil Burst, 2:57) — an orange ring lights at his feet in a dark field of fire; black devil wings edged
 *     in blue open behind him over white slashes on the ground; the ball becomes an orange-yellow fireball in a whirl of blue,
 *     and it bursts in a column of golden light.
 *   Katana crisantemo (Kiku Ichimonji, 3:24) — the ball hangs in a spotlight; a golden chrysanthemum blooms behind it with
 *     golden crescents round it, a white-blue blade slashes it off and it flies as a golden beam scattering crescents.
 */
import Phaser from 'phaser';
import { bolt, play, ride, sparks } from './fxMovie';

type S = Phaser.Scene;
type Img = Phaser.GameObjects.Image;
type G = Phaser.GameObjects.Graphics;
const AIR = 8900;

export type VictorMove = 'deathsword' | 'deathdrop' | 'devilburst' | 'kiku';
export function victorOf(name: string): VictorMove | null {
  const n = name.trim();
  if (/^proyectil letal$|death ?sword/i.test(n)) return 'deathsword';
  if (/^aguij[oó]n letal$|death ?drop/i.test(n)) return 'deathdrop';
  if (/^tiro sobrenatural$|devil ?burst/i.test(n)) return 'devilburst';
  if (/^katana crisantemo$|kiku ?ichimonji/i.test(n)) return 'kiku';
  return null;
}

const rnd = (a: number, b: number) => a + Math.random() * (b - a);
/** a four-point star (the flashes of Death Sword) */
function star(g: G, x: number, y: number, r: number, color: number, alpha: number, thin = 0.18) {
  const pts: Phaser.Math.Vector2[] = [];
  for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, l = i % 2 ? r * thin : r; pts.push(new Phaser.Math.Vector2(x + Math.cos(a) * l, y + Math.sin(a) * l)); }
  g.fillStyle(color, alpha).fillPoints(pts, true);
}
/** a crescent moon at (x, y), `r` round, opening towards `ang` */
function crescent(g: G, x: number, y: number, r: number, ang: number, color: number, alpha: number) {
  const pts: Phaser.Math.Vector2[] = [];
  for (let i = 0; i <= 12; i++) { const a = ang + Math.PI / 2 + i / 12 * Math.PI; pts.push(new Phaser.Math.Vector2(x + Math.cos(a) * r, y + Math.sin(a) * r)); }
  for (let i = 12; i >= 0; i--) { const a = ang + Math.PI / 2 + i / 12 * Math.PI; pts.push(new Phaser.Math.Vector2(x + Math.cos(ang) * r * 0.45 + Math.cos(a) * r * 0.78, y + Math.sin(ang) * r * 0.45 + Math.sin(a) * r * 0.78)); }
  g.fillStyle(color, alpha).fillPoints(pts, true);
}
/** a wavy root reaching out from the centre (the veins of Death Sword, the tendrils of Death Drop) */
function root(g: G, x: number, y: number, ang: number, len: number, seed: number, w: number, color: number, alpha: number) {
  g.lineStyle(w, color, alpha).beginPath().moveTo(x, y);
  for (let i = 1; i <= 10; i++) {
    const u = i / 10, wob = Math.sin(seed * 3.1 + u * 4.2) * 0.22;
    g.lineTo(x + Math.cos(ang + wob) * len * u, y + Math.sin(ang + wob) * len * u * 0.75);
  }
  g.strokePath();
}

// ------------------------------------------------------------------ Proyectil letal (Death Sword)
const DS_BLUE = 0x2a4aff, DS_PALE = 0xbfe0ff, DS_DARK = 0x101a6a, DS_PINK = 0xff6ad8, DS_GREEN = 0xc8ffd8, DS_FIRE = 0xff8a2a;
function deathSwordCharge(scene: S, x: number, y: number, lv: number, ms: number) {
  const size = 22 + lv * 1.6;
  // the kick's arc of orange fire
  play(scene, x, y - 10, AIR, ms * 0.35, (g, k) => {
    g.lineStyle(6, DS_FIRE, 0.9 * (1 - k)).beginPath().arc(0, 0, 18 + k * 20, -2.6, -2.6 + k * 4.4).strokePath();
    g.lineStyle(2, 0xffe0a0, 1 - k).beginPath().arc(0, 0, 18 + k * 20, -2.6, -2.6 + k * 4.4).strokePath();
  }, true);
  // the pale sphere and its dark blue veins, which draw back in until it shrinks to a point and flashes a pink star
  play(scene, x, y - 14, AIR + 1, ms + 120, (g, k, t) => {
    const grow = Math.min(1, k * 2.5), back = k < 0.55 ? 1 : Math.max(0, 1 - (k - 0.55) / 0.35);
    for (let i = 0; i < 9; i++) {
      const a = i / 9 * Math.PI * 2 + Math.sin(i * 5.3) * 0.2, L = size * (1.6 + (i % 3) * 0.5) * grow * back;
      root(g, 0, 0, a, L, i, 5, DS_DARK, 0.9);
      root(g, 0, 0, a, L, i, 2, DS_BLUE, 0.95);
    }
    const r = size * 0.55 * grow * (k < 0.55 ? 1 : 0.2 + 0.8 * back);
    g.fillStyle(DS_BLUE, 0.35).fillCircle(0, 0, r * 1.5);
    g.fillStyle(DS_PALE, 0.9).fillCircle(0, 0, r);
    g.fillStyle(0xffffff, 0.8).fillCircle(-r * 0.25, -r * 0.25, r * 0.35);
    if (k > 0.88) star(g, 0, 0, size * (0.8 + Math.sin(t * 30) * 0.15), DS_PINK, (1 - k) / 0.12 + 0.2);
  });
}
function deathSwordShot(scene: S, ball: Img, lv: number) {
  ride(scene, ball, (g, bx, by, ang, t) => {
    const len = 90 + lv * 5;
    // the long thin line of light, the pale green rays round the star and the star itself
    g.lineStyle(7, DS_BLUE, 0.45).lineBetween(bx - Math.cos(ang) * len, by - Math.sin(ang) * len, bx, by);
    g.lineStyle(2.5, DS_PALE, 1).lineBetween(bx - Math.cos(ang) * len, by - Math.sin(ang) * len, bx, by);
    for (let i = 0; i < 6; i++) {
      const a = ang + Math.PI + (i - 2.5) * 0.22, u = (t * 4 + i * 0.31) % 1, r0 = 10 + u * 30;
      g.lineStyle(1.5, DS_GREEN, 0.8 * (1 - u)).lineBetween(bx + Math.cos(a) * r0, by + Math.sin(a) * r0, bx + Math.cos(a) * (r0 + 14), by + Math.sin(a) * (r0 + 14));
    }
    g.fillStyle(DS_BLUE, 0.4).fillCircle(bx, by, 11 + lv * 0.4);
    star(g, bx, by, 16 + lv * 0.6, DS_PALE, 0.95);
    star(g, bx, by, 8 + lv * 0.3, 0xffffff, 1, 0.3);
  }, (x, y) => {
    play(scene, x, y, AIR + 2, 380, (g, k) => {
      star(g, 0, 0, 24 + k * 50, DS_BLUE, 0.7 * (1 - k));
      star(g, 0, 0, 12 + k * 24, DS_PALE, 1 - k);
      for (let i = 0; i < 7; i++) root(g, 0, 0, i * 0.9, 18 + k * 40, i, 2.5, DS_BLUE, 0.9 * (1 - k));
    }, true);
    sparks(scene, x, y, 10, 44, [DS_PALE, DS_BLUE, DS_PINK]);
  });
}

// ------------------------------------------------------------------ Aguijón letal (Death Drop)
const DD_RED = 0xe0203a, DD_HOT = 0xff6a6a, DD_BLACK = 0x12040c, DD_BLUE = 0x2a3adf, DD_VIOLET = 0x6a5aff;
function deathDropCharge(scene: S, x: number, y: number, lv: number, ms: number) {
  const size = 10 + lv * 0.7, rise = 34 + lv * 1.5;
  // blue speed lines rushing past, and the ball kicked straight up, turning dark red as it climbs
  play(scene, x, y - 20, AIR - 1, ms + 80, (g, k, t) => {
    for (let i = 0; i < 10; i++) {
      const lx = (i - 4.5) * 9 + Math.sin(i * 3.7) * 4, u = (t * 3 + i * 0.27) % 1;
      g.lineStyle(2, i % 2 ? DD_BLUE : DD_VIOLET, 0.5 * (1 - u) * Math.min(1, k * 4)).lineBetween(lx, -rise - 30 + u * 90, lx, -rise + 10 + u * 90);
    }
  }, true);
  play(scene, x, y - 14, AIR + 1, ms + 80, (g, k) => {
    const h = -rise * Phaser.Math.Easing.Cubic.Out(Math.min(1, k * 1.4)), r = size * (0.5 + 0.5 * Math.min(1, k * 1.6));
    g.fillStyle(DD_BLACK, 0.85).fillCircle(0, h, r * 1.45);
    g.fillStyle(DD_RED, 0.95).fillCircle(0, h, r);
    g.fillStyle(DD_HOT, 0.9).fillCircle(-r * 0.2, h - r * 0.2, r * 0.45);
    if (k > 0.6) for (let i = 0; i < 5; i++) root(g, 0, h, i * 1.25 + k * 3, r * 2.4, i, 2, DD_BLUE, (k - 0.6) / 0.4); // the tendrils gather
  });
}
function deathDropShot(scene: S, ball: Img, lv: number) {
  ride(scene, ball, (g, bx, by, ang, t) => {
    const r = 10 + lv * 0.5, seed = Math.floor(t * 12);
    for (let i = 0; i < 5; i++) { // dark blue tendrils trailing behind like lightning
      const a = ang + Math.PI + (i - 2) * 0.35;
      bolt(g, bx, by, bx + Math.cos(a) * (34 + (i % 2) * 16), by + Math.sin(a) * (34 + (i % 2) * 16), seed + i * 5, 2.5, DD_BLUE, DD_BLACK, 0.85, 5);
    }
    g.fillStyle(DD_BLACK, 0.8).fillCircle(bx, by, r * 1.5);
    g.fillStyle(DD_RED, 0.95).fillCircle(bx, by, r);
    g.fillStyle(DD_HOT, 0.9).fillCircle(bx - r * 0.2, by - r * 0.2, r * 0.45);
  }, (x, y) => {
    play(scene, x, y, AIR + 2, 420, (g, k, t) => {
      const a = 1 - k, seed = Math.floor(t * 16);
      g.fillStyle(DD_BLACK, 0.7 * a).fillCircle(0, 0, 18 + k * 34);
      g.fillStyle(DD_RED, 0.8 * a).fillCircle(0, 0, 10 + k * 26);
      for (let i = 0; i < 6; i++) { const an = i * 1.047 + 0.4, l = 20 + k * 44; bolt(g, 0, 0, Math.cos(an) * l, Math.sin(an) * l * 0.7, seed + i, 3, DD_BLUE, DD_BLACK, a, 4); }
    });
    sparks(scene, x, y, 10, 40, [DD_RED, DD_HOT, DD_BLUE]);
  });
}

// ------------------------------------------------------------------ Tiro sobrenatural (Devil Burst)
const DB_ORANGE = 0xff7a1a, DB_YELLOW = 0xffd23a, DB_BLACK = 0x07040e, DB_BLUE = 0x2a5aff, DB_PALE = 0xdfe8ff;
function wing(g: G, s: number, span: number, open: number, alpha: number) {
  // a devil's wing: three bony points and scalloped skin between them, black, edged in blue
  const pts = [new Phaser.Math.Vector2(s * 6, -4), new Phaser.Math.Vector2(s * span * 0.3 * open, -span * 0.85 * open)];
  pts.push(new Phaser.Math.Vector2(s * span * 0.5 * open, -span * open));
  pts.push(new Phaser.Math.Vector2(s * span * 0.62 * open, -span * 0.48 * open));
  pts.push(new Phaser.Math.Vector2(s * span * 0.98 * open, -span * 0.42 * open));
  pts.push(new Phaser.Math.Vector2(s * span * 0.55 * open, -span * 0.12 * open));
  pts.push(new Phaser.Math.Vector2(s * span * 0.85 * open, span * 0.08 * open));
  pts.push(new Phaser.Math.Vector2(s * 8, 6));
  g.fillStyle(DB_BLACK, 0.92 * alpha).fillPoints(pts, true);
  g.lineStyle(3, DB_BLUE, 0.95 * alpha).strokePoints(pts, true);
  g.lineStyle(1.2, 0x9ab8ff, 0.8 * alpha).strokePoints(pts, true);
}
function devilBurstCharge(scene: S, x: number, y: number, lv: number, ms: number) {
  const span = 30 + lv * 1.8;
  // the field of fire: dark orange tongues licking up round him, the orange ring at his feet and the white slashes
  play(scene, x, y, y - 2, ms + 120, (g, k, t) => {
    const a = Math.min(1, k * 4) * (k > 0.9 ? (1 - k) * 10 : 1);
    for (let i = 0; i < 9; i++) {
      const fx = (i - 4) * 14, h = (26 + Math.sin(t * 14 + i * 2.3) * 10) * a;
      g.fillStyle(i % 2 ? DB_ORANGE : 0xc83a10, 0.45 * a).fillTriangle(fx - 8, 4, fx + 8, 4, fx + Math.sin(t * 9 + i) * 4, -h - 20);
    }
    g.lineStyle(4, DB_ORANGE, 0.9 * a).strokeEllipse(0, 4, 34 + k * 14, 12 + k * 5);
    g.lineStyle(1.5, DB_YELLOW, a).strokeEllipse(0, 4, 34 + k * 14, 12 + k * 5);
    if (k > 0.35) for (let i = 0; i < 6; i++) { // the white slashes on the ground
      const an = (i < 3 ? Math.PI : 0) + (i % 3 - 1) * 0.35, r0 = 22, r1 = 30 + (k - 0.35) * 70;
      g.lineStyle(2.5, DB_PALE, 0.85 * a).lineBetween(Math.cos(an) * r0, 4 + Math.sin(an) * r0 * 0.3, Math.cos(an) * r1, 4 + Math.sin(an) * r1 * 0.3);
    }
  }, true);
  // the black devil wings opening behind him
  play(scene, x, y - 18, y - 1, ms + 140, (g, k) => {
    const open = Phaser.Math.Easing.Back.Out(Math.min(1, Math.max(0, (k - 0.2) / 0.5))), a = k > 0.9 ? (1 - k) * 10 : 1;
    if (open <= 0) return;
    wing(g, -1, span, open, a); wing(g, 1, span, open, a);
  });
}
function devilBurstShot(scene: S, ball: Img, lv: number) {
  ride(scene, ball, (g, bx, by, ang, t) => {
    const r = 11 + lv * 0.5;
    for (let n = 0; n < 3; n++) { // the whirl of blue round the fireball, trailing behind
      g.lineStyle(4 - n, n === 1 ? 0x6a9aff : DB_BLUE, 0.85).beginPath();
      for (let v = 0; v <= 1.001; v += 0.06) {
        const a = t * 16 + n * 2.1 + v * 6, back = v * 48, rr = r * 1.7 * (1 - v * 0.6);
        const qx = bx - Math.cos(ang) * back - Math.sin(ang) * Math.sin(a) * rr, qy = by - Math.sin(ang) * back + Math.cos(ang) * Math.sin(a) * rr * 0.8;
        if (v === 0) g.moveTo(qx, qy); else g.lineTo(qx, qy);
      }
      g.strokePath();
    }
    g.fillStyle(DB_BLACK, 0.5).fillCircle(bx - Math.cos(ang) * 6, by - Math.sin(ang) * 6, r * 1.5);
    g.fillStyle(DB_ORANGE, 0.95).fillCircle(bx, by, r * 1.2);
    g.fillStyle(DB_YELLOW, 1).fillCircle(bx, by, r * 0.8);
    g.fillStyle(0xffffff, 0.8).fillCircle(bx - r * 0.2, by - r * 0.2, r * 0.3);
  }, (x, y) => {
    // the column of golden light
    play(scene, x, y, AIR + 2, 520, (g, k) => {
      const a = 1 - k, w = 16 + k * 26;
      g.fillStyle(DB_YELLOW, 0.55 * a).fillTriangle(-w, 10, w, 10, 0, -150 - k * 60);
      g.fillStyle(0xffffff, 0.7 * a).fillTriangle(-w * 0.4, 10, w * 0.4, 10, 0, -130 - k * 50);
      g.fillStyle(DB_ORANGE, 0.6 * a).fillCircle(0, 0, 18 + k * 40);
      g.fillStyle(DB_YELLOW, 0.9 * a).fillCircle(0, 0, 10 + k * 24);
      g.lineStyle(3, DB_BLUE, 0.7 * a).strokeEllipse(0, 8, 40 + k * 90, 12 + k * 26);
    }, true);
    sparks(scene, x, y, 14, 54, [DB_YELLOW, DB_ORANGE, 0xffffff]);
  });
}

// ------------------------------------------------------------------ Katana crisantemo (Kiku Ichimonji)
const KK_GOLD = 0xffc21a, KK_GOLD2 = 0xfff0a0, KK_DEEP = 0xe08a00, KK_BLADE = 0xdff2ff, KK_BLUE = 0x5a9aff;
/** the chrysanthemum: two rings of long thin petals round a bright heart */
function chrysanthemum(g: G, x: number, y: number, r: number, spin: number, alpha: number) {
  for (const [n, rr, c, off] of [[20, 1, KK_DEEP, 0], [20, 0.78, KK_GOLD, 0.08], [14, 0.5, KK_GOLD2, 0.2]] as const) {
    for (let i = 0; i < n; i++) {
      const a = spin + off + i / n * Math.PI * 2, L = r * rr, w = 0.09;
      g.fillStyle(c, alpha).fillTriangle(x + Math.cos(a - w) * L * 0.25, y + Math.sin(a - w) * L * 0.25, x + Math.cos(a + w) * L * 0.25, y + Math.sin(a + w) * L * 0.25, x + Math.cos(a) * L, y + Math.sin(a) * L);
    }
  }
  g.fillStyle(0xffffff, alpha).fillCircle(x, y, r * 0.16);
}
function kikuCharge(scene: S, x: number, y: number, lv: number, ms: number) {
  const size = 26 + lv * 1.8;
  // the spotlight, the ball hanging in it, the flower blooming behind with golden crescents turning round it
  play(scene, x, y - 26, AIR - 1, ms + 100, (g, k, t) => {
    const bloom = Phaser.Math.Easing.Back.Out(Math.min(1, k * 1.5)), a = k > 0.9 ? (1 - k) * 10 : 1;
    g.fillStyle(0xffffff, 0.12 * a).fillTriangle(-6, -60, 6, -60, 0, 0).fillTriangle(-size * 0.8, 26, size * 0.8, 26, 0, -60);
    chrysanthemum(g, 0, 0, size * bloom, t * 0.8, 0.85 * a);
    for (let i = 0; i < 5; i++) { const an = t * 2.2 + i * 1.257; crescent(g, Math.cos(an) * size * 1.25, Math.sin(an) * size * 0.9, 6 + lv * 0.3, an + Math.PI, KK_GOLD, 0.9 * a * bloom); }
  }, true);
  // the white-blue slash that sends it off
  play(scene, x, y - 18, AIR + 1, ms + 160, (g, k) => {
    if (k < 0.7) return;
    const u = (k - 0.7) / 0.3, a = u < 0.6 ? 1 : (1 - u) / 0.4;
    g.lineStyle(9, KK_BLUE, 0.5 * a).beginPath().arc(0, 0, size * 0.9, -2.4, -2.4 + u * 3.2).strokePath();
    g.lineStyle(4, KK_BLADE, a).beginPath().arc(0, 0, size * 0.9, -2.4, -2.4 + u * 3.2).strokePath();
  }, true);
}
function kikuShot(scene: S, ball: Img, lv: number) {
  let drop = 0;
  ride(scene, ball, (g, bx, by, ang, t) => {
    const len = 70 + lv * 4, w = 9 + lv * 0.4, nx = -Math.sin(ang), ny = Math.cos(ang);
    const tx = bx - Math.cos(ang) * len, ty = by - Math.sin(ang) * len;
    // the golden beam of fire, wide at the ball and thinning out behind it
    g.fillStyle(KK_DEEP, 0.55).fillTriangle(bx + nx * w * 1.6, by + ny * w * 1.6, bx - nx * w * 1.6, by - ny * w * 1.6, tx, ty);
    g.fillStyle(KK_GOLD, 0.85).fillTriangle(bx + nx * w, by + ny * w, bx - nx * w, by - ny * w, tx, ty);
    g.fillStyle(KK_GOLD2, 1).fillTriangle(bx + nx * w * 0.4, by + ny * w * 0.4, bx - nx * w * 0.4, by - ny * w * 0.4, tx + Math.cos(ang) * len * 0.3, ty + Math.sin(ang) * len * 0.3);
    g.fillStyle(0xffffff, 0.9).fillCircle(bx, by, w * 0.8);
    if (t - drop > 0.07) { // golden crescents scattering off the beam
      drop = t;
      const c = scene.add.graphics({ x: bx, y: by }).setDepth(AIR + 1).setBlendMode(Phaser.BlendModes.ADD);
      crescent(c, 0, 0, 5 + lv * 0.25, rnd(0, 6.28), KK_GOLD, 1);
      const s = Math.random() < 0.5 ? 1 : -1;
      scene.tweens.add({ targets: c, x: bx + nx * s * rnd(14, 30), y: by + ny * s * rnd(14, 30), angle: rnd(-180, 180), alpha: 0, duration: 420, onComplete: () => c.destroy() });
    }
  }, (x, y) => {
    play(scene, x, y, AIR + 2, 460, (g, k, t) => {
      const a = 1 - k;
      chrysanthemum(g, 0, 0, 16 + k * 46, t * 2, 0.9 * a);
      for (let i = 0; i < 6; i++) { const an = i * 1.047 + k * 2; crescent(g, Math.cos(an) * (14 + k * 40), Math.sin(an) * (10 + k * 30), 6, an, KK_GOLD2, a); }
    }, true);
    sparks(scene, x, y, 12, 46, [KK_GOLD, KK_GOLD2, KK_BLADE]);
  });
}

export function victorCharge(scene: S, m: VictorMove, x: number, y: number, lv: number, ms: number) {
  if (m === 'deathsword') deathSwordCharge(scene, x, y, lv, ms);
  else if (m === 'deathdrop') deathDropCharge(scene, x, y, lv, ms);
  else if (m === 'devilburst') devilBurstCharge(scene, x, y, lv, ms);
  else kikuCharge(scene, x, y, lv, ms);
}
export function victorShot(scene: S, m: VictorMove, ball: Img, lv: number) {
  if (m === 'deathsword') deathSwordShot(scene, ball, lv);
  else if (m === 'deathdrop') deathDropShot(scene, ball, lv);
  else if (m === 'devilburst') devilBurstShot(scene, ball, lv);
  else kikuShot(scene, ball, lv);
}
