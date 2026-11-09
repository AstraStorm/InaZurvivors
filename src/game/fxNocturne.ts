/**
 * Escena nocturna (ザ・モンスターズ «The Monsters», «Nocturne»; author: any Desmodus with any Wolfram; from its scene in
 * Chrono Stones, youtube WIhN69SSTPk from 0:03, watched frame by frame; inazuma.fandom «Escena nocturna»: «los usuarios
 * ascienden con una horda de murciélagos, bajo la luz de una luna roja, invocando un lobo que muerde a la par que chutan,
 * mandando al lobo junto con una horda de murciélagos junto al balón»).
 *
 * The scene: both players flare (one red, one blue) as they jump; a horde of black bats with red wings sweeps past; the
 * night falls and a huge red moon with a cyan-white rim rises; both kick the ball from either side while a black wolf's
 * head with glowing red eyes looms inside the moon behind it; the wolf opens its fanged jaws and the ball turns into a
 * blue-white whirl in its mouth; the shot flies as a red-black wedge with cyan streaks, the wolf's head biting ahead and
 * the bats flying with it. Visual only: the damage is the combined shot's (ArenaScene.comboShot).
 */
import Phaser from 'phaser';
import { canvasTex } from './fxKeshin';
import { play, ride, sparks } from './fxMovie';

type S = Phaser.Scene;
type Img = Phaser.GameObjects.Image;
type P = { x: number; y: number };
const AIR = 8900;
const MOON = 0xc83a30, MOON2 = 0x8a1e1e, RIM = 0x9af4ff, BLUE = 0x4aa8ff, BLUE2 = 0xd8f4ff, BLOOD = 0xb0141e;
/** wind-up time of the combined shot (ArenaScene.comboShot) */
export const NOCTURNE_WIND = 950;

/** a bat with spread wings: black body, red-veined wing membranes, two red eyes; 64×36, facing up */
function drawBat(c: CanvasRenderingContext2D) {
  c.lineJoin = 'round';
  for (const s of [-1, 1]) {
    c.beginPath(); c.moveTo(32, 16);
    c.lineTo(32 + s * 10, 6); c.lineTo(32 + s * 22, 2); c.lineTo(32 + s * 31, 8);
    c.lineTo(32 + s * 26, 16); c.lineTo(32 + s * 22, 13); c.lineTo(32 + s * 18, 22); c.lineTo(32 + s * 13, 18); c.lineTo(32 + s * 7, 26); c.closePath();
    c.fillStyle = '#1a0a10'; c.fill(); c.lineWidth = 1.5; c.strokeStyle = '#06020a'; c.stroke();
    c.strokeStyle = '#a0182a'; c.lineWidth = 1.2; // the red veins of the membrane
    for (const [x, y] of [[22, 2], [26, 16], [18, 22]]) { c.beginPath(); c.moveTo(32 + s * 4, 14); c.lineTo(32 + s * x, y); c.stroke(); }
  }
  c.beginPath(); c.ellipse(32, 18, 5, 9, 0, 0, Math.PI * 2); c.fillStyle = '#120610'; c.fill();
  c.beginPath(); c.moveTo(28, 10); c.lineTo(29, 4); c.lineTo(31, 9); c.moveTo(36, 10); c.lineTo(35, 4); c.lineTo(33, 9); c.fill(); // ears
  c.fillStyle = '#ff2a2a'; c.fillRect(29, 12, 2, 2); c.fillRect(33, 12, 2, 2);
}

/** the wolf's black head seen from the front, muzzle down, red eyes glowing; jaws closed or gaping with fangs; 160×190 */
function drawWolf(c: CanvasRenderingContext2D, open: boolean) {
  c.lineJoin = 'round';
  const fur = '#16121a', fur2 = '#2a2430';
  // the pointed ears and the ruff of the cheeks
  for (const s of [-1, 1]) {
    c.beginPath(); c.moveTo(80 + s * 18, 50); c.lineTo(80 + s * 46, 4); c.lineTo(80 + s * 58, 62); c.closePath();
    c.fillStyle = fur; c.fill(); c.strokeStyle = '#000'; c.lineWidth = 3; c.stroke();
    c.beginPath(); c.moveTo(80 + s * 28, 48); c.lineTo(80 + s * 44, 20); c.lineTo(80 + s * 50, 56); c.closePath(); c.fillStyle = '#3a0c14'; c.fill();
  }
  c.beginPath(); c.moveTo(80, 36);
  for (let n = 0; n <= 10; n++) { const a = -Math.PI * 0.1 + n / 10 * Math.PI * 1.2, r = n % 2 ? 66 : 76; c.lineTo(80 + Math.cos(a) * r, 92 + Math.sin(a) * r * 0.62); }
  c.closePath(); c.fillStyle = fur; c.fill(); c.strokeStyle = '#000'; c.lineWidth = 3; c.stroke();
  // the skull and the long muzzle reaching down towards the viewer
  c.beginPath(); c.moveTo(40, 70); c.quadraticCurveTo(80, 26, 120, 70); c.lineTo(104, 128); c.quadraticCurveTo(80, open ? 150 : 172, 56, 128); c.closePath();
  c.fillStyle = fur2; c.fill(); c.stroke();
  // the eyes: slanted, glowing red
  for (const s of [-1, 1]) {
    c.beginPath(); c.moveTo(80 + s * 10, 92); c.lineTo(80 + s * 32, 80); c.lineTo(80 + s * 26, 96); c.closePath();
    c.fillStyle = '#ff3a2a'; c.shadowColor = '#ff2010'; c.shadowBlur = 12; c.fill(); c.shadowBlur = 0;
    c.fillStyle = '#ffd0b0'; c.fillRect(80 + s * 20 - 1.5, 87, 3, 3);
  }
  if (!open) { c.beginPath(); c.ellipse(80, 160, 12, 8, 0, 0, Math.PI * 2); c.fillStyle = '#050307'; c.fill(); return; }
  // gaping jaws: the dark red mouth and two rows of fangs
  c.beginPath(); c.moveTo(50, 126); c.quadraticCurveTo(80, 118, 110, 126); c.quadraticCurveTo(116, 160, 80, 186); c.quadraticCurveTo(44, 160, 50, 126); c.closePath();
  c.fillStyle = '#3a0610'; c.fill(); c.strokeStyle = '#000'; c.lineWidth = 3; c.stroke();
  c.fillStyle = '#fff6ea'; c.strokeStyle = '#000'; c.lineWidth = 1.2;
  for (let i = 0; i < 6; i++) { const x = 54 + i * 10; c.beginPath(); c.moveTo(x, 126); c.lineTo(x + 8, 126); c.lineTo(x + 4, 140 + (i === 0 || i === 5 ? 6 : 0)); c.closePath(); c.fill(); c.stroke(); }
  for (let i = 0; i < 4; i++) { const x = 60 + i * 11; c.beginPath(); c.moveTo(x, 176 - Math.abs(i - 1.5) * 6); c.lineTo(x + 8, 176 - Math.abs(i - 1.5) * 6); c.lineTo(x + 4, 162 - Math.abs(i - 1.5) * 6); c.closePath(); c.fill(); c.stroke(); }
}

const batTex = (scene: S) => canvasTex(scene, 'nocturne-bat', 64, 36, drawBat);
const wolfTex = (scene: S, open: boolean) => canvasTex(scene, open ? 'nocturne-wolf-open' : 'nocturne-wolf', 160, 190, (c) => drawWolf(c, open));

/** an image driven every frame until `ms` runs out */
function sprite(scene: S, key: string, x: number, y: number, depth: number, ms: number, frame: (im: Img, u: number, t: number) => void) {
  const im = scene.add.image(x, y, key).setDepth(depth);
  const t0 = scene.time.now;
  const tick = () => {
    const t = scene.time.now - t0;
    if (t > ms || !im.active) { scene.events.off('update', tick); im.destroy(); return; }
    frame(im, t / ms, t / 1000);
  };
  scene.events.on('update', tick);
  scene.events.once('shutdown', () => scene.events.off('update', tick));
  tick();
  return im;
}

/** a horde of bats flying from one side to the other across (x, y), flapping */
function horde(scene: S, x: number, y: number, n: number, span: number, ms: number, delay: number, k: number, depth: number) {
  const key = batTex(scene);
  for (let i = 0; i < n; i++) {
    const row = (i / n - 0.5) * span * 0.8 + Math.sin(i * 7.1) * 14 * k, sc = (0.35 + ((i * 37) % 10) / 22) * k, lag = (i % 5) * 0.06;
    scene.time.delayedCall(delay + (i % 7) * 30, () => sprite(scene, key, x - span, y + row, depth + (sc > 0.6 * k ? 1 : 0), ms, (im, u, t) => {
      const q = Math.min(1, Math.max(0, (u - lag) / (1 - lag)));
      im.setPosition(x - span + q * span * 2, y + row - Math.sin(q * Math.PI) * 30 * k + Math.sin(t * 9 + i) * 4)
        .setRotation(Math.PI / 2 - 0.25).setScale(sc, sc * (0.45 + Math.abs(Math.sin(t * 26 + i)) * 0.6)) // the wings beat
        .setAlpha(q <= 0 || q >= 1 ? 0 : Math.min(1, q * 6, (1 - q) * 6));
    }));
  }
}

export function nocturneCharge(scene: S, who: P[], x: number, y: number, lv: number, ms: number) {
  const k = 1 + lv * 0.05, cam = scene.cameras.main, mx = x, my = y - 30 * k, R = 46 * k;
  // speed lines rushing to the moon (author: no dark screen)
  play(scene, cam.worldView.centerX, cam.worldView.centerY, AIR - 4, ms + 260, (g, u, t) => {
    const v = cam.worldView, a = u < 0.2 ? u / 0.2 : u > 0.88 ? (1 - u) / 0.12 : 1;
    const cx = mx - v.centerX, cy = my - v.centerY;
    for (let i = 0; i < 28; i++) {
      const an = i * 0.2244 + Math.sin(i * 3.3) * 0.08, p = (t * 2.4 + i * 0.41) % 1, r0 = v.width * (0.75 - p * 0.45), r1 = r0 + v.width * 0.12;
      g.lineStyle(1.5 + (i % 3), 0xdfe8ff, 0.55 * a).lineBetween(cx + Math.cos(an) * r0, cy + Math.sin(an) * r0, cx + Math.cos(an) * r1, cy + Math.sin(an) * r1);
    }
  });
  // each player flares as he jumps: the first in crimson, the second in blue
  who.forEach((p, i) => play(scene, p.x, p.y - 14, AIR - 1, ms * 0.6, (g, u) => {
    const c = i % 2 ? BLUE : 0xff4a3a, a = 1 - u;
    g.fillStyle(c, 0.45 * a).fillCircle(0, 0, (14 + u * 22) * k);
    g.fillStyle(0xffe0f0, 0.8 * a).fillCircle(0, 0, (7 + u * 8) * k);
    g.lineStyle(3, c, 0.8 * a).strokeCircle(0, 0, (18 + u * 34) * k);
  }, true));
  // the red moon rises behind the meeting point, its cyan-white rim glowing
  play(scene, mx, my, AIR - 3, ms + 200, (g, u, t) => {
    const a = Math.min(1, u * 4) * (u > 0.9 ? (1 - u) / 0.1 : 1), r = R * (0.7 + Math.min(1, u * 2.2) * 0.3);
    g.fillStyle(RIM, 0.25 * a).fillCircle(0, 0, r * 1.22);
    g.fillStyle(MOON2, a).fillCircle(0, 0, r);
    g.fillStyle(MOON, a).fillCircle(-r * 0.06, -r * 0.04, r * 0.93);
    for (const [ox, oy, rr] of [[-0.3, -0.25, 0.22], [0.25, 0.1, 0.18], [-0.1, 0.4, 0.14], [0.35, -0.4, 0.1]]) g.fillStyle(MOON2, 0.55 * a).fillCircle(ox * r, oy * r, rr * r);
    // the crescent rim lit on the right, as in the scene
    for (let j = 0; j < 4; j++) g.lineStyle(5 - j, j < 2 ? RIM : 0xffffff, (0.85 - j * 0.15) * a).beginPath().arc(0, 0, r + 1 + j * 2, -1.35 + Math.sin(t * 3) * 0.05, 1.25).strokePath();
  });
  // the horde of bats sweeps across the moon, twice
  horde(scene, mx, my, 12 + lv, 150 * k, ms * 0.55, 0, k, AIR - 2);
  horde(scene, mx, my + 10, 8 + lv, 130 * k, ms * 0.5, ms * 0.45, k, AIR);
  // the wolf's head looms inside the moon, then opens its jaws
  const wolfS = (R * 1.6) / 190;
  sprite(scene, wolfTex(scene, false), mx, my + R * 0.1, AIR - 2, ms * 0.72, (im, u) => im.setScale(wolfS * (0.9 + u * 0.1)).setAlpha(u < 0.45 ? 0 : Math.min(1, (u - 0.45) * 5))).setOrigin(0.5, 0.42);
  scene.time.delayedCall(ms * 0.72, () => sprite(scene, wolfTex(scene, true), mx, my + R * 0.1, AIR - 2, ms * 0.28 + 200, (im, u) =>
    im.setScale(wolfS * (1 + u * 0.12)).setAlpha(u > 0.75 ? (1 - u) / 0.25 : 1)).setOrigin(0.5, 0.42));
  // the ball turns into a blue-white whirl between the fangs
  play(scene, mx, my + R * 0.5, AIR + 1, ms + 120, (g, u, t) => {
    if (u < 0.68) return;
    const w = (u - 0.68) / 0.32, r = (6 + w * 12) * k;
    g.fillStyle(BLUE, 0.5).fillCircle(0, 0, r * 1.5);
    for (let i = 0; i < 5; i++) {
      const a0 = t * 14 + i * 1.2566;
      g.lineStyle(2.5, i % 2 ? BLUE2 : BLUE, 0.9).beginPath().arc(0, 0, r * (0.5 + i * 0.16), a0, a0 + 2.2).strokePath();
    }
    g.fillStyle(0xffffff, 0.95).fillCircle(0, 0, r * 0.45);
  }, true);
}

export function nocturneShot(scene: S, ball: Img, lv: number) {
  const k = 1 + lv * 0.05, x0 = ball.x, y0 = ball.y;
  play(scene, x0, y0, AIR + 2, 340, (g, u) => { // the bite: a blue flash in a red ring
    g.fillStyle(BLUE2, 0.9 * (1 - u)).fillCircle(0, 0, (14 + u * 36) * k);
    g.lineStyle(4, BLOOD, 0.9 * (1 - u)).strokeCircle(0, 0, (20 + u * 56) * k);
    g.lineStyle(2, RIM, 0.8 * (1 - u)).strokeCircle(0, 0, (24 + u * 64) * k);
  }, true);
  const wolf = scene.add.image(x0, y0, wolfTex(scene, true)).setDepth(AIR + 1).setOrigin(0.5, 0.78).setScale(0.36 * k);
  const bats = Array.from({ length: 6 + Math.round(lv / 2) }, (_, i) => scene.add.image(x0, y0, batTex(scene)).setDepth(AIR + 1).setScale((0.35 + (i % 3) * 0.12) * k));
  ride(scene, ball, (g, bx, by, ang, t) => {
    const nx = -Math.sin(ang), ny = Math.cos(ang), w = (14 + lv * 0.8) * k, cx = Math.cos(ang), cy = Math.sin(ang);
    // the red-black wedge opening behind the ball, cyan streaks down its middle
    for (const [ww, col, al] of [[2.2, BLOOD, 0.45], [1.5, 0x3a0812, 0.75], [0.7, 0x120410, 0.85]] as const) {
      const ex = x0 - cx * 10, ey = y0 - cy * 10;
      g.fillStyle(col, al).fillTriangle(ex + nx * w * ww * 1.4, ey + ny * w * ww * 1.4, ex - nx * w * ww * 1.4, ey - ny * w * ww * 1.4, bx, by);
    }
    for (let i = -2; i <= 2; i++) {
      const sx = x0 + nx * i * w * 0.5, sy = y0 + ny * i * w * 0.5;
      g.lineStyle(2 - Math.abs(i) * 0.4, i % 2 ? BLUE : BLUE2, 0.75).lineBetween(sx, sy, bx - cx * 6, by - cy * 6);
    }
    // the blue whirl the ball has become
    const r = w * 0.8;
    g.fillStyle(BLUE, 0.55).fillCircle(bx, by, r * 1.5);
    for (let i = 0; i < 4; i++) { const a0 = t * 16 + i * 1.5708; g.lineStyle(2.5, i % 2 ? BLUE2 : BLUE, 0.95).beginPath().arc(bx, by, r * (0.6 + i * 0.15), a0, a0 + 2.4).strokePath(); }
    g.fillStyle(0xffffff, 1).fillCircle(bx, by, r * 0.45);
    // the wolf bites ahead, the bats flap along the wedge
    wolf.setPosition(bx, by).setRotation(ang - Math.PI / 2);
    bats.forEach((b, i) => {
      const q = ((i * 0.17 + t * 1.3) % 1) * 0.9, side = (i % 2 ? 1 : -1) * w * (0.8 + (i % 3) * 0.5) * q;
      b.setPosition(x0 + (bx - x0) * (0.2 + q * 0.75) + nx * side, y0 + (by - y0) * (0.2 + q * 0.75) + ny * side)
        .setRotation(ang + Math.PI / 2).setScale(b.scaleX, Math.abs(b.scaleX) * (0.45 + Math.abs(Math.sin(t * 24 + i)) * 0.6));
    });
  }, (x, y) => {
    wolf.destroy();
    bats.forEach((b, i) => { // the bats scatter
      const a = i * 1.1 + Math.random(), d = 50 + Math.random() * 40;
      scene.tweens.add({ targets: b, x: x + Math.cos(a) * d, y: y + Math.sin(a) * d * 0.7, alpha: 0, duration: 420, onComplete: () => b.destroy() });
    });
    play(scene, x, y, AIR + 2, 520, (g, u) => {
      const a = 1 - u;
      g.fillStyle(BLOOD, 0.45 * a).fillCircle(0, 0, (24 + u * 80) * k);
      g.fillStyle(BLUE, 0.6 * a).fillCircle(0, 0, (16 + u * 40) * k);
      g.fillStyle(0xffffff, 0.9 * a).fillCircle(0, 0, (8 + u * 18) * k);
      g.lineStyle(3, RIM, 0.8 * a).strokeCircle(0, 0, (30 + u * 90) * k);
    }, true);
    sparks(scene, x, y, 16, 60, [0xffffff, BLUE, BLUE2, BLOOD, MOON]);
  });
}
