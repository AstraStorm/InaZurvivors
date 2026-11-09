/**
 * Golpe cataclismo (Disaster Break; author, from its scene in Chrono Stones, youtube unnNak76vvM, watched frame by frame).
 * Red lightning edged in black crackles in from every side and knots into a red sphere with a black core split by black
 * cracks; the kick leaves a black streak and opens a red burst with a black hole in it, red lightning lashing out of it; the
 * ball flies as a red-black pillar, glowing red with a white-hot core, red lightning snaking along it; where it lands the
 * ground bursts into a huge cloud of sand-coloured dust with rocks flying, red lightning crawling through the cloud, and a
 * red sphere with dark cracks and a white core bulges out of it. Visual only: the damage is the technique's.
 */
import Phaser from 'phaser';
import { bolt, play, ride, sparks } from './fxMovie';

type S = Phaser.Scene;
type Img = Phaser.GameObjects.Image;
const AIR = 8900;
const RED = 0xff2a1a, RED2 = 0xff6a4a, DARK = 0x14040a, HOT = 0xfff0e0, SAND = 0xe8c888, SAND2 = 0xcfa868, SAND3 = 0xf6e0b0, ROCK = 0x6a4a2a;

export const isCataclysm = (name: string) => /^golpe cataclismo$|disaster ?break/i.test(name.trim());

/** the red sphere with the black core and the black cracks across it */
function sphere(g: Phaser.GameObjects.Graphics, x: number, y: number, r: number, t: number, a: number) {
  g.fillStyle(RED, 0.35 * a).fillCircle(x, y, r * 1.45);
  g.fillStyle(0xc81a10, 0.95 * a).fillCircle(x, y, r);
  g.fillStyle(RED2, 0.8 * a).fillCircle(x - r * 0.15, y - r * 0.15, r * 0.7);
  g.fillStyle(DARK, 0.95 * a).fillCircle(x, y, r * 0.42);
  for (let i = 0; i < 4; i++) { // the black cracks, a slowly turning cross
    const an = t * 1.6 + i * Math.PI / 2, ex = x + Math.cos(an) * r * 1.6, ey = y + Math.sin(an) * r * 1.6;
    g.lineStyle(3.5, DARK, 0.95 * a).lineBetween(x, y, x + Math.cos(an + 0.25) * r * 0.8, y + Math.sin(an + 0.25) * r * 0.8);
    g.lineStyle(2.5, DARK, 0.9 * a).lineBetween(x + Math.cos(an + 0.25) * r * 0.8, y + Math.sin(an + 0.25) * r * 0.8, ex, ey);
  }
}

export function cataclysmCharge(scene: S, x: number, y: number, lv: number, ms: number) {
  const k = 1 + lv * 0.05, cy = y - 22;
  // red lightning edged in black crackles in from every side and knots above the player
  play(scene, x, cy, AIR + 1, ms * 0.6, (g, u, t) => {
    const a = u > 0.8 ? (1 - u) / 0.2 : 1, seed = Math.floor(t * 14);
    for (let i = 0; i < 5; i++) {
      const an = i * 1.2566 + 0.4, L = (70 - u * 40) * k;
      bolt(g, Math.cos(an) * L, Math.sin(an) * L * 0.7, 0, 0, seed + i * 7, 2.5, RED, DARK, a, 6);
    }
  });
  // the sphere grows where they meet, its cracks turning, lightning lashing out of it
  play(scene, x, cy, AIR + 2, ms * 0.75, (g, u, t) => {
    if (u < 0.3) return;
    const w = (u - 0.3) / 0.7, a = u > 0.88 ? (1 - u) / 0.12 : 1, r = (10 + w * 16) * k;
    sphere(g, 0, 0, r, t, a);
    const seed = Math.floor(t * 12);
    for (let i = 0; i < 3; i++) { const an = seed * 0.9 + i * 2.1; bolt(g, 0, 0, Math.cos(an) * r * 3, Math.sin(an) * r * 2.2, seed + i, 2, RED, DARK, 0.9 * a, 5); }
  });
  // the kick: a black streak, then a red burst with a black hole in it
  scene.time.delayedCall(ms * 0.72, () => play(scene, x, y - 12, AIR + 2, ms * 0.28 + 220, (g, u) => {
    const a = 1 - u;
    g.lineStyle(6 * k, DARK, 0.85 * a).beginPath().arc(0, 0, 20 * k, -2.6, -2.6 + Math.min(1, u * 3) * 2.4).strokePath();
    g.fillStyle(RED, 0.55 * a).fillCircle(0, 0, (12 + u * 30) * k);
    g.fillStyle(RED2, 0.4 * a).fillCircle(0, 0, (8 + u * 18) * k);
    g.fillStyle(DARK, 0.95 * a).fillCircle(0, 0, (5 + u * 9) * k);
  }));
}

export function cataclysmShot(scene: S, ball: Img, lv: number) {
  const k = 1 + lv * 0.05, x0 = ball.x, y0 = ball.y;
  ride(scene, ball, (g, bx, by, ang, t) => {
    const nx = -Math.sin(ang), ny = Math.cos(ang), w = (6 + lv * 0.4) * k;
    // the red-black pillar it leaves behind, widest at the ball
    g.fillStyle(RED, 0.45).fillTriangle(x0, y0, bx + nx * w * 1.6, by + ny * w * 1.6, bx - nx * w * 1.6, by - ny * w * 1.6);
    g.fillStyle(DARK, 0.8).fillTriangle(x0, y0, bx + nx * w * 0.7, by + ny * w * 0.7, bx - nx * w * 0.7, by - ny * w * 0.7);
    // red lightning snaking along it
    const seed = Math.floor(t * 16);
    bolt(g, x0, y0, bx, by, seed, 2.2, RED, DARK, 0.95, 8);
    bolt(g, x0 + nx * w, y0 + ny * w, bx, by, seed + 5, 1.6, RED2, null, 0.7, 6);
    // the ball glowing red, white-hot inside
    g.fillStyle(RED, 0.4).fillCircle(bx, by, w * 2.2);
    g.fillStyle(RED2, 0.6).fillCircle(bx, by, w * 1.5);
    g.fillStyle(HOT, 0.9).fillCircle(bx, by, w * 0.8);
  }, (x, y) => {
    // the ground bursts: sand-coloured dust, rocks flying, red lightning crawling through it, the red sphere bulging out
    const puffs = Array.from({ length: 14 }, (_, i) => ({ an: i * 0.449 + Math.random() * 0.3, d: 0.5 + Math.random() * 0.6, r: 0.55 + Math.random() * 0.5, c: [SAND, SAND2, SAND3][i % 3] }));
    play(scene, x, y, AIR + 1, 900, (g, u, t) => {
      const grow = 1 - Math.pow(1 - Math.min(1, u * 2.2), 3), a = u > 0.6 ? (1 - u) / 0.4 : 1, R = (26 + grow * 46) * k;
      for (const p of puffs) g.fillStyle(p.c, 0.92 * a).fillCircle(Math.cos(p.an) * R * p.d, Math.sin(p.an) * R * p.d * 0.6 - grow * 8 * k, R * p.r * 0.55);
      const seed = Math.floor(t * 10);
      for (let i = 0; i < 3; i++) {
        const an = seed * 1.3 + i * 2.1;
        bolt(g, Math.cos(an) * R * 0.9, Math.sin(an) * R * 0.5, Math.cos(an + 2.4) * R * 0.8, Math.sin(an + 2.4) * R * 0.45, seed + i * 3, 2.4, RED, DARK, a, 7);
      }
      if (u > 0.25 && u < 0.8) sphere(g, 0, -4 * k, (10 + (u - 0.25) * 18) * k, t, Math.min(1, (u - 0.25) * 6, (0.8 - u) * 6));
      if (u > 0.25 && u < 0.8) g.fillStyle(HOT, Math.min(1, (0.8 - u) * 4)).fillCircle(0, -4 * k, 4 * k);
    });
    for (let i = 0; i < 10; i++) { // rocks thrown up and falling
      const an = -Math.PI * (0.1 + Math.random() * 0.8), d = (40 + Math.random() * 50) * k;
      const r = scene.add.rectangle(x, y, 3 + Math.random() * 4, 3 + Math.random() * 3, ROCK).setDepth(AIR + 2).setAngle(Math.random() * 90);
      scene.tweens.add({ targets: r, x: x + Math.cos(an) * d, y: y + Math.sin(an) * d * 0.6 + 20, angle: r.angle + 200, alpha: 0, duration: 650, ease: 'Quad.easeOut', onComplete: () => r.destroy() });
    }
    sparks(scene, x, y, 12, 50 * k, [RED, RED2, HOT, SAND3]);
    scene.cameras.main.shake(180, 0.004);
  });
}
