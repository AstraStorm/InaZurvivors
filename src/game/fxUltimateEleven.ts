/**
 * Impulso del equipo definitivo (Saikyō Eleven Hadō, «Ultimate Eleven Assault»; author, from its scene 636DMnBkpVU 0:12;
 * inazuma.fandom: air, combined shot, «el usuario asciende junto al aura de los demás miembros del equipo, que se concentran
 * en el balón, y chuta»). Golden flames burst off the players; they leap into a sky of rainbow speed lines (magenta, violet,
 * red); the team's golden auras pour into the ball, which becomes a blazing golden sun ringed by a rainbow halo; the kick
 * sends a huge golden-white beam down the pitch with the whole team running in it as golden ghosts. Visual only: the damage
 * is the combined shot's (ArenaScene.comboShot).
 */
import Phaser from 'phaser';
import { play, ride, sparks } from './fxMovie';

type S = Phaser.Scene;
type Img = Phaser.GameObjects.Image;
type G = Phaser.GameObjects.Graphics;
type P = { x: number; y: number };
const AIR = 8900;
const GOLD = 0xffe24a, GOLD2 = 0xfff6c0, AMBER = 0xffb02e;
const RAINBOW = [0xff4ad8, 0x9a5aff, 0x5ab4ff, 0x5affb4, 0xffe85a, 0xff5a5a];

/** a footballer-shaped golden ghost (head and body), running: the team inside the beam */
function ghost(g: G, x: number, y: number, s: number, t: number, alpha: number) {
  const leg = Math.sin(t * 18) * 3 * s;
  g.fillStyle(GOLD, 0.35 * alpha).fillCircle(x, y - 14 * s, 9 * s);
  g.fillStyle(GOLD2, 0.55 * alpha).fillCircle(x, y - 22 * s, 4 * s).fillEllipse(x, y - 12 * s, 8 * s, 12 * s);
  g.lineStyle(2.5 * s, GOLD2, 0.55 * alpha).lineBetween(x, y - 6 * s, x - 3 * s + leg, y + 2 * s).lineBetween(x, y - 6 * s, x + 3 * s - leg, y + 2 * s);
}

export function ultimateElevenCharge(scene: S, who: P[], x: number, y: number, lv: number, ms: number) {
  const k = 1 + lv * 0.04, rise = 36 * k, cam = scene.cameras.main;
  // the sky turns into rainbow speed lines rushing past
  play(scene, cam.worldView.centerX, cam.worldView.centerY, AIR - 3, ms + 200, (g, u, t) => {
    const v = cam.worldView, a = u < 0.15 ? u / 0.15 : u > 0.85 ? (1 - u) / 0.15 : 1;
    g.fillStyle(0x2a0a4a, 0.45 * a).fillRect(-v.width, -v.height, v.width * 2, v.height * 2);
    for (let i = 0; i < 26; i++) {
      const yy = (i / 26 - 0.5) * v.height * 1.2, p = (t * 1.8 + i * 0.37) % 1, xx = (0.6 - p * 1.6) * v.width;
      g.lineStyle(3 + (i % 4) * 2, RAINBOW[i % RAINBOW.length], 0.35 * a).lineBetween(xx, yy, xx + v.width * 0.35, yy - v.width * 0.12);
    }
  }, true);
  // golden flames burst off each player as they rise
  who.forEach((p, i) => play(scene, p.x, p.y, AIR - 1, ms + 120, (g, u, t) => {
    const h = -rise * Math.min(1, u * 1.6), a = u > 0.85 ? (1 - u) / 0.15 : Math.min(1, u * 5);
    for (let n = 0; n < 11; n++) {
      const fx = (n - 5) * 3.6 * k, L = (30 + Math.sin(t * 16 + n * 1.9 + i) * 9) * k;
      g.fillStyle(n % 3 ? GOLD : AMBER, (n % 2 ? 0.6 : 0.4) * a).fillTriangle(fx - 4.5 * k, h + 4, fx + 4.5 * k, h + 4, fx + Math.sin(t * 9 + n) * 3, h - L);
    }
  }, true));
  // the auras pour into the ball: golden streams from each player, the ball swelling into a sun with a rainbow halo
  play(scene, x, y - 12, AIR + 1, ms + 140, (g, u, t) => {
    if (u < 0.3) return;
    const w = (u - 0.3) / 0.7, a = u > 0.92 ? (1 - u) / 0.08 : 1;
    for (const [i, p] of who.entries()) {
      const sx = p.x - x, sy = p.y - rise - (y - 12);
      for (let s = 0; s < 5; s++) {
        const q = (t * 2.2 + s * 0.2 + i * 0.11) % 1;
        g.fillStyle(s % 2 ? GOLD2 : GOLD, 0.95 * a).fillCircle(sx * (1 - q), sy * (1 - q) - Math.sin(q * Math.PI) * 16, 3.4 * k);
      }
    }
    const r = (7 + w * 16) * k;
    RAINBOW.forEach((c, i) => g.lineStyle(2.5, c, 0.75 * a * w).strokeCircle(0, 0, r * 1.5 + i * 2.2 + Math.sin(t * 8 + i) * 1.2));
    g.fillStyle(AMBER, 0.45 * a).fillCircle(0, 0, r * 1.35);
    g.fillStyle(GOLD, 0.9 * a).fillCircle(0, 0, r);
    g.fillStyle(0xffffff, a).fillCircle(0, 0, r * 0.6);
    for (let i = 0; i < 12; i++) { const an = i * 0.5236 + t * 2, L = r * (1.6 + (i % 2) * 0.6); g.lineStyle(2, 0xffffff, 0.7 * a * w).lineBetween(Math.cos(an) * r * 1.1, Math.sin(an) * r * 1.1, Math.cos(an) * L, Math.sin(an) * L); }
  }, true);
}

export function ultimateElevenShot(scene: S, ball: Img, lv: number) {
  const k = 1 + lv * 0.04, x0 = ball.x, y0 = ball.y;
  play(scene, x0, y0, AIR + 2, 320, (g, u) => { // the flash of the kick
    g.fillStyle(0xffffff, 0.9 * (1 - u)).fillCircle(0, 0, (16 + u * 40) * k);
    RAINBOW.forEach((c, i) => g.lineStyle(3, c, 0.8 * (1 - u)).strokeCircle(0, 0, (20 + u * 60) * k + i * 3));
  }, true);
  ride(scene, ball, (g, bx, by, ang, t) => {
    const len = Math.hypot(bx - x0, by - y0), nx = -Math.sin(ang), ny = Math.cos(ang), w = (16 + lv * 0.7) * k;
    // the huge golden-white beam, widening towards the ball
    for (const [ww, col, al] of [[2.2, AMBER, 0.3], [1.5, GOLD, 0.55], [0.8, GOLD2, 0.85], [0.35, 0xffffff, 1]] as const) {
      g.fillStyle(col, al).fillTriangle(x0 + nx * w * ww * 0.2, y0 + ny * w * ww * 0.2, x0 - nx * w * ww * 0.2, y0 - ny * w * ww * 0.2, bx + nx * w * ww, by + ny * w * ww)
        .fillTriangle(x0 - nx * w * ww * 0.2, y0 - ny * w * ww * 0.2, bx + nx * w * ww, by + ny * w * ww, bx - nx * w * ww, by - ny * w * ww);
    }
    // the team running inside it as golden ghosts
    for (let i = 0; i < 6; i++) {
      const q = 0.25 + ((i * 0.13 + t * 0.6) % 1) * 0.7, side = (i % 2 ? 1 : -1) * w * (0.6 + (i % 3) * 0.25) * q;
      ghost(g, x0 + (bx - x0) * q + nx * side, y0 + (by - y0) * q + ny * side, 0.55 * k, t + i, Math.min(1, len / 60));
    }
    g.fillStyle(GOLD, 0.6).fillCircle(bx, by, w * 1.25);
    g.fillStyle(0xffffff, 1).fillCircle(bx, by, w * 0.75);
    RAINBOW.forEach((c, i) => g.lineStyle(2, c, 0.7).strokeCircle(bx, by, w * 1.35 + i * 2));
  }, (x, y) => {
    play(scene, x, y, AIR + 2, 520, (g, u) => {
      const a = 1 - u;
      g.fillStyle(AMBER, 0.4 * a).fillCircle(0, 0, (26 + u * 90) * k);
      g.fillStyle(GOLD2, 0.75 * a).fillCircle(0, 0, (18 + u * 50) * k);
      g.fillStyle(0xffffff, 0.95 * a).fillCircle(0, 0, (10 + u * 24) * k);
      for (let i = 0; i < 16; i++) { const an = i * 0.3927, L = (30 + u * 110) * k; g.lineStyle(3, 0xffffff, 0.8 * a).lineBetween(Math.cos(an) * L * 0.4, Math.sin(an) * L * 0.4, Math.cos(an) * L, Math.sin(an) * L); }
    }, true);
    sparks(scene, x, y, 18, 60, [0xffffff, GOLD, AMBER, ...RAINBOW.slice(0, 3)]);
  });
}
