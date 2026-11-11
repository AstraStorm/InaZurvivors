/**
 * Soy todopoderoso (Great Max na Ore; 2.1, author, from its scene in Chrono Stones, youtube tr-k63Jr6-k from 0:04, watched
 * frame by frame). Blue lightning crackles round the player's hands and fists; a gigantic storm of golden wind bursts out
 * as crossing orange-yellow streaks; it winds up into a huge golden sphere of swirling strands, a blue bolt across it; the
 * kick sends the ball as a blue-white sphere of energy wrapped in blue lightning, golden storm streaks trailing it; where it
 * lands, a blue-white star burst with blue lightning and the golden strands flung out. Visual only: the damage is the
 * technique's.
 */
import Phaser from 'phaser';
import { bolt, play, ride, sparks } from './fxMovie';

type S = Phaser.Scene;
type Img = Phaser.GameObjects.Image;
type G = Phaser.GameObjects.Graphics;
const AIR = 8900;
const GOLD = 0xffcc2a, GOLD2 = 0xffe94a, ORANGE = 0xff8a1a, DEEP = 0xc8500a, BLUE = 0x5fd8ff, BLUE2 = 0x2a8aff, WHITE = 0xf4fdff, INK = 0x2a1400;

export const isAlmighty = (name: string) => /^soy todopoderoso$|great max|i am the almighty/i.test(name.trim());

/** one storm streak: a long curved stroke, thick in the middle, through the point at angle `an` round the centre */
function streak(g: G, r: number, an: number, len: number, w: number, color: number, a: number) {
  const steps = 10;
  for (let i = 0; i < steps; i++) {
    const t0 = i / steps, t1 = (i + 1) / steps, k = Math.sin(Math.PI * (t0 + t1) / 2);
    const p = (t: number) => { const b = an + (t - 0.5) * len; return [Math.cos(b) * r * (0.85 + t * 0.3), Math.sin(b) * r * 0.62 * (0.85 + t * 0.3)] as const; };
    const [x0, y0] = p(t0), [x1, y1] = p(t1);
    g.lineStyle(Math.max(1, w * k), color, a * (0.4 + 0.6 * k)).lineBetween(x0, y0, x1, y1);
  }
}

/** the golden storm sphere: dark outline, swirling strands inside, light at the heart */
function stormSphere(g: G, r: number, t: number, a: number) {
  g.fillStyle(INK, 0.9 * a).fillCircle(0, 0, r + 3);
  g.fillStyle(DEEP, 0.95 * a).fillCircle(0, 0, r);
  g.fillStyle(ORANGE, 0.9 * a).fillCircle(0, 0, r * 0.88);
  for (let i = 0; i < 9; i++) {
    const an = t * (i % 2 ? 2.2 : -1.7) + i * 0.7, rr = r * (0.35 + (i % 4) * 0.15);
    g.lineStyle(2 + (i % 3), i % 2 ? GOLD2 : GOLD, 0.95 * a).beginPath().arc(0, 0, rr, an, an + 1.6 + (i % 3) * 0.4).strokePath();
  }
  g.fillStyle(GOLD2, 0.55 * a).fillCircle(-r * 0.2, -r * 0.2, r * 0.45);
  g.fillStyle(0xfff6c8, 0.7 * a).fillCircle(0, 0, r * 0.18);
}

export function almightyCharge(scene: S, x: number, y: number, lv: number, ms: number) {
  const k = 1 + lv * 0.05, cy = y - 20;
  // blue lightning crackling round the hands and fists, flickering outward
  play(scene, x, cy, AIR + 2, ms * 0.5, (g, u, t) => {
    const a = u > 0.8 ? (1 - u) / 0.2 : 1, seed = Math.floor(t * 18);
    for (let i = 0; i < 4; i++) {
      const side = i % 2 ? 1 : -1, hx = side * 9, hy = -2 - (i > 1 ? 12 : 0), an = (side > 0 ? -0.4 : Math.PI + 0.4) + Math.sin(t * 9 + i) * 0.6;
      bolt(g, hx, hy, hx + Math.cos(an) * (22 + u * 26) * k, hy + Math.sin(an) * (18 + u * 20) * k, seed + i * 5, 1.8, BLUE, BLUE2, a, 6);
    }
    g.fillStyle(BLUE, 0.35 * a).fillCircle(-9, -2, 6 * k).fillCircle(9, -2, 6 * k);
    g.fillStyle(WHITE, 0.8 * a).fillCircle(-9, -2, 2.2).fillCircle(9, -2, 2.2);
  });
  // the golden storm: crossing orange-yellow streaks sweeping round the player, wider and wider
  const streaks = Array.from({ length: 12 }, (_, i) => ({ an: i * 0.53, sp: (i % 2 ? 1 : -1) * (1.6 + (i % 3) * 0.5), r: 0.55 + (i % 4) * 0.18, w: 3 + (i % 3) * 2, c: [GOLD, ORANGE, GOLD2, DEEP][i % 4] }));
  play(scene, x, cy, AIR + 1, ms * 0.85, (g, u, t) => {
    if (u < 0.22) return;
    const w = Math.min(1, (u - 0.22) / 0.3), a = u > 0.85 ? (1 - u) / 0.15 : 1, R = (40 + w * 70) * k;
    g.fillStyle(ORANGE, 0.18 * a * w).fillEllipse(0, 0, R * 2.2, R * 1.4);
    for (const s of streaks) streak(g, R * s.r, s.an + t * s.sp, 1.9, s.w * k, s.c, 0.9 * a * w);
  });
  // it winds up into the huge golden sphere above the player, a blue bolt across it, then collapses into the ball
  play(scene, x, cy - 26 * k, AIR + 3, ms * 0.9, (g, u, t) => {
    if (u < 0.45) return;
    const w = Math.min(1, (u - 0.45) / 0.25), shrink = u > 0.8 ? 1 - (u - 0.8) / 0.2 : 1, r = (8 + w * 24) * k * Math.max(0.15, shrink);
    stormSphere(g, r, t, 1);
    if (u > 0.6) bolt(g, -r * 1.3, -r * 0.4, r * 1.2, r * 0.5, Math.floor(t * 14), 2, BLUE, BLUE2, 0.95, 7);
  });
  // the kick: a blue-white flash at the feet, golden strands thrown sideways
  scene.time.delayedCall(ms * 0.82, () => play(scene, x, y - 10, AIR + 3, ms * 0.18 + 260, (g, u, t) => {
    const a = 1 - u;
    g.fillStyle(BLUE, 0.5 * a).fillCircle(0, 0, (10 + u * 30) * k);
    g.fillStyle(WHITE, 0.95 * a).fillCircle(0, 0, (6 + u * 12) * k);
    for (let i = 0; i < 6; i++) streak(g, (20 + u * 50) * k, i * 1.05 + t, 1.2, 3 * k, i % 2 ? GOLD : ORANGE, a);
  }));
}

export function almightyShot(scene: S, ball: Img, lv: number) {
  const k = 1 + lv * 0.05, x0 = ball.x, y0 = ball.y;
  ride(scene, ball, (g, bx, by, ang, t) => {
    const nx = -Math.sin(ang), ny = Math.cos(ang), dx = Math.cos(ang), dy = Math.sin(ang), w = (6 + lv * 0.4) * k;
    // 2.1 (author's sketch): the hurricane it leaves — a golden cone with the ball at its tip, opening behind it, wound with
    // spinning loops (each loop an ellipse across the cone, drawn back to front, the far side fainter)
    const back = Math.min(170 * k, Math.hypot(bx - x0, by - y0)), wide = 34 * k;
    if (back > 4) {
      const at = (d: number, side: number) => [bx - dx * d + nx * side, by - dy * d + ny * side] as const;
      const [lx, ly] = at(back, wide), [rx, ry] = at(back, -wide);
      g.fillStyle(GOLD, 0.16).fillTriangle(bx, by, lx, ly, rx, ry);
      g.lineStyle(2.4 * k, GOLD, 0.95).lineBetween(bx, by, lx, ly).lineBetween(bx, by, rx, ry);
      const loops = 7, spin = (t * 4.5) % 1;
      for (let i = 0; i < loops; i++) {
        const u = (i + spin) / loops, d = u * back, half = wide * u, len = Math.max(2, half * 0.42);
        if (half < 2) continue;
        const [cx, cy] = at(d, Math.sin(t * 9 + i * 1.7) * half * 0.12);
        const fade = Math.min(1, u * 3) * (1 - Math.max(0, u - 0.85) / 0.15);
        // the loop: an ellipse across the cone (its long axis along the normal), front half bright, back half dim
        const pts = Array.from({ length: 19 }, (_, j) => { const a = (j / 18) * Math.PI * 2; return [cx + nx * Math.cos(a) * half - dx * Math.sin(a) * len, cy + ny * Math.cos(a) * half - dy * Math.sin(a) * len] as const; });
        for (let j = 0; j < 18; j++) {
          const front = j < 9;
          g.lineStyle(Math.max(1.2, (front ? 2.8 : 1.6) * k), front ? (i % 2 ? GOLD : GOLD2) : ORANGE, (front ? 0.95 : 0.5) * fade)
            .lineBetween(pts[j][0], pts[j][1], pts[j + 1][0], pts[j + 1][1]);
        }
      }
    }
    // the blue-white sphere of energy, blue lightning wrapped round it
    g.fillStyle(BLUE2, 0.3).fillCircle(bx, by, w * 2.6);
    g.fillStyle(BLUE, 0.6).fillCircle(bx, by, w * 1.8);
    g.fillStyle(WHITE, 0.95).fillCircle(bx, by, w * 1.15);
    const seed = Math.floor(t * 18);
    for (let i = 0; i < 3; i++) { const an = seed * 0.8 + i * 2.1; bolt(g, bx + Math.cos(an) * w * 0.8, by + Math.sin(an) * w * 0.8, bx + Math.cos(an + 0.9) * w * 3.2, by + Math.sin(an + 0.9) * w * 3.2, seed + i, 1.6, BLUE, BLUE2, 0.95, 5); }
  }, (x, y) => {
    // the blue-white star burst with lightning, golden strands flung out
    play(scene, x, y, AIR + 2, 780, (g, u, t) => {
      const grow = 1 - Math.pow(1 - Math.min(1, u * 2.4), 3), a = u > 0.5 ? (1 - u) / 0.5 : 1, R = (24 + grow * 64) * k;
      for (let i = 0; i < 12; i++) {
        const an = i * 0.5236 + 0.2, L = R * (i % 2 ? 0.7 : 1.15);
        g.fillStyle(i % 2 ? BLUE2 : BLUE, 0.9 * a).fillTriangle(Math.cos(an - 0.09) * R * 0.18, Math.sin(an - 0.09) * R * 0.18, Math.cos(an) * L, Math.sin(an) * L * 0.75, Math.cos(an + 0.09) * R * 0.18, Math.sin(an + 0.09) * R * 0.18);
      }
      g.fillStyle(BLUE, 0.8 * a).fillCircle(0, 0, R * 0.42);
      g.fillStyle(0xbff0ff, a).fillCircle(0, 0, R * 0.3);
      g.fillStyle(WHITE, a).fillCircle(0, 0, R * 0.16);
      const seed = Math.floor(t * 12);
      for (let i = 0; i < 4; i++) { const an = seed * 1.1 + i * 1.6; bolt(g, 0, 0, Math.cos(an) * R * 1.1, Math.sin(an) * R * 0.8, seed + i * 3, 2, BLUE, BLUE2, a, 7); }
      for (let i = 0; i < 6; i++) streak(g, R * (0.7 + (i % 3) * 0.2), i * 1.05 + t * 3, 1.3, 3 * k, i % 2 ? GOLD : ORANGE, 0.8 * a);
    });
    sparks(scene, x, y, 14, 60 * k, [BLUE, WHITE, GOLD, GOLD2]);
    scene.cameras.main.shake(200, 0.005);
  });
}
