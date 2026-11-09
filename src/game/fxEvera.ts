/**
 * Asalto mortal (author, from its scene in GO Chrono Stones, oxMqBje4mZg 0:00-0:16): rocks rise round the shooter in a
 * golden storm and Gran señor de los demonios, Evera, comes out of it — a huge white spiky mane, a lilac face with yellow
 * eyes and fangs, a dark blue helmet with two red curls like horns, a collar of golden beads, blue gauntlets and two
 * giant red fists. In the shot he draws one fist back, blue lightning wraps it, and he punches the ball at the same time
 * as the shooter kicks it: the ball leaves as a blue sphere of lightning and bursts in a blue and orange star.
 * Here: the sphere flies to the thickest crowd and bursts there (big blow, knockback, stun), and the lightning jumps to
 * the rivals round it.
 */
import Phaser from 'phaser';
import { canvasTex, D, fade, rnd } from './fxKeshin';

type S = Phaser.Scene;
const BLUE = 0x4ad8ff, BLUE2 = 0xc8f4ff, GOLD = 0xffc83a;
const OUT = '#141028';

/** fluffy white fur round (cx, cy): n thick tufts, each curling to a soft point, between angles a0 and a1 */
function mane(c: CanvasRenderingContext2D, cx: number, cy: number, rx: number, ry: number, n: number, a0: number, a1: number, seed: number, shade = false) {
  const h = (k: number) => Math.abs((Math.sin(seed * 12.9898 + k * 78.233) * 43758.5453) % 1);
  const at = (a: number, r: number) => [cx + Math.cos(a) * rx * r, cy + Math.sin(a) * ry * r] as const;
  const step = (a1 - a0) / n;
  c.beginPath();
  c.moveTo(...at(a0, 0.55));
  for (let k = 0; k < n; k++) {
    const a = a0 + step * k, tip = a + step * (0.55 + h(k) * 0.3), l = 0.86 + h(k + 9) * 0.22;
    const [c1x, c1y] = at(a + step * 0.15, l * 0.95), [tx, ty] = at(tip, l), [c2x, c2y] = at(a + step * 0.9, 0.78), [ex, ey] = at(a + step, 0.66);
    c.quadraticCurveTo(c1x, c1y, tx, ty); c.quadraticCurveTo(c2x, c2y, ex, ey);
  }
  c.lineTo(cx, cy); c.closePath();
  const g = c.createRadialGradient(cx, cy - ry * 0.2, rx * 0.1, cx, cy, Math.max(rx, ry));
  if (shade) { g.addColorStop(0, '#d8d0f4'); g.addColorStop(1, '#9a8ec8'); } else { g.addColorStop(0, '#ffffff'); g.addColorStop(0.7, '#f8f6ff'); g.addColorStop(1, '#dcd4f6'); }
  c.fillStyle = g; c.fill(); c.lineWidth = 4; c.strokeStyle = OUT; c.stroke();
  // a few fur strokes inside each tuft
  c.lineWidth = 2.5; c.strokeStyle = shade ? '#7a6eb0' : '#a89ad8';
  for (let k = 0; k < n; k++) {
    const a = a0 + step * (k + 0.5), [x0, y0] = at(a, 0.62), [x1, y1] = at(a + step * 0.2, 0.84);
    c.beginPath(); c.moveTo(x0, y0); c.quadraticCurveTo((x0 + x1) / 2 + 6, (y0 + y1) / 2, x1, y1); c.stroke();
  }
}

/** the head: the white mane, the blue helmet with its red curls, lilac face, yellow eyes, fangs; 420×380, chin at (210, 330) */
function drawHead(c: CanvasRenderingContext2D) {
  const cx = 210;
  c.lineJoin = 'round'; c.lineCap = 'round';
  mane(c, cx, 240, 210, 190, 11, Math.PI * 0.9, Math.PI * 2.1, 3, true); // the mane behind, in shade
  mane(c, cx, 250, 200, 175, 12, Math.PI * 0.75, Math.PI * 2.25, 4); // and the white one over it, all round the face
  // the face: lilac, broad jaw
  c.beginPath(); c.moveTo(cx - 74, 172); c.quadraticCurveTo(cx - 92, 260, cx - 50, 314); c.lineTo(cx, 334); c.lineTo(cx + 50, 314); c.quadraticCurveTo(cx + 92, 260, cx + 74, 172); c.closePath();
  const fg = c.createLinearGradient(0, 170, 0, 330); fg.addColorStop(0, '#9a8ee0'); fg.addColorStop(1, '#5a4aa0'); c.fillStyle = fg; c.fill(); c.lineWidth = 4; c.strokeStyle = OUT; c.stroke();
  for (const sd of [-1, 1]) mane(c, cx + sd * 92, 262, 62, 92, 4, sd < 0 ? Math.PI * 0.5 : -Math.PI * 0.5, sd < 0 ? Math.PI * 1.5 : Math.PI * 0.5, 20 + sd); // fur over the cheeks
  // the open mouth and its fangs
  c.beginPath(); c.moveTo(cx - 34, 282); c.quadraticCurveTo(cx, 272, cx + 34, 282); c.quadraticCurveTo(cx, 322, cx - 34, 282); c.closePath(); c.fillStyle = '#2a0a2a'; c.fill(); c.lineWidth = 3; c.stroke();
  c.fillStyle = '#ffffff';
  for (const s of [-1, 1]) { c.beginPath(); c.moveTo(cx + s * 26, 281); c.lineTo(cx + s * 16, 279); c.lineTo(cx + s * 21, 298); c.closePath(); c.fill(); }
  // the nose and the scowl lines
  c.strokeStyle = '#3a2a70'; c.lineWidth = 3;
  c.beginPath(); c.moveTo(cx - 12, 252); c.quadraticCurveTo(cx, 260, cx + 12, 252); c.stroke();
  // yellow eyes under heavy brows (author: no pupils), red marks running down from them
  for (const s of [-1, 1]) {
    c.beginPath(); c.moveTo(cx + s * 10, 222); c.lineTo(cx + s * 46, 204); c.lineTo(cx + s * 40, 228); c.closePath();
    c.fillStyle = '#ffd21a'; c.fill(); c.lineWidth = 2.5; c.strokeStyle = '#5a3000'; c.stroke();
    c.strokeStyle = '#d0102a'; c.lineWidth = 4; c.beginPath(); c.moveTo(cx + s * 34, 232); c.lineTo(cx + s * 40, 258); c.stroke();
  }
  // fur on the cheeks and chin, over the jaw line
  mane(c, cx, 296, 150, 84, 8, Math.PI * 0.02, Math.PI * 0.98, 7); // the beard of fur under the jaw
  c.beginPath(); c.moveTo(cx - 34, 282); c.quadraticCurveTo(cx, 272, cx + 34, 282); c.quadraticCurveTo(cx, 322, cx - 34, 282); c.closePath(); c.fillStyle = '#2a0a2a'; c.fill(); c.lineWidth = 3; c.strokeStyle = OUT; c.stroke();
  c.fillStyle = '#ffffff';
  for (const s of [-1, 1]) { c.beginPath(); c.moveTo(cx + s * 26, 281); c.lineTo(cx + s * 16, 279); c.lineTo(cx + s * 21, 298); c.closePath(); c.fill(); }
  // the helmet: dark blue band over the brow, a crest in the middle
  c.beginPath(); c.moveTo(cx - 80, 196); c.quadraticCurveTo(cx - 70, 130, cx, 118); c.quadraticCurveTo(cx + 70, 130, cx + 80, 196);
  c.quadraticCurveTo(cx + 40, 176, cx, 192); c.quadraticCurveTo(cx - 40, 176, cx - 80, 196); c.closePath();
  const hg = c.createLinearGradient(0, 118, 0, 196); hg.addColorStop(0, '#3a5a9a'); hg.addColorStop(1, '#1a2a5a'); c.fillStyle = hg; c.fill(); c.lineWidth = 4; c.strokeStyle = OUT; c.stroke();
  // the two curls: dark blue horns swept up, red spirals inside
  for (const s of [-1, 1]) {
    c.beginPath(); c.moveTo(cx + s * 14, 150); c.bezierCurveTo(cx + s * 30, 70, cx + s * 120, 20, cx + s * 170, 56);
    c.bezierCurveTo(cx + s * 196, 80, cx + s * 170, 140, cx + s * 130, 130); c.bezierCurveTo(cx + s * 110, 124, cx + s * 112, 96, cx + s * 134, 96);
    c.bezierCurveTo(cx + s * 110, 70, cx + s * 70, 100, cx + s * 60, 160); c.closePath();
    c.fillStyle = '#22386a'; c.fill(); c.lineWidth = 4; c.strokeStyle = OUT; c.stroke();
    c.beginPath(); c.moveTo(cx + s * 30, 140); c.bezierCurveTo(cx + s * 50, 80, cx + s * 120, 44, cx + s * 160, 66);
    c.bezierCurveTo(cx + s * 178, 82, cx + s * 160, 118, cx + s * 138, 114);
    c.lineWidth = 12; c.strokeStyle = '#e0202a'; c.stroke(); c.lineWidth = 3; c.strokeStyle = '#ff8a7a'; c.stroke();
  }
}

/** the body: the huge white mane over the shoulders, the broad lilac chest, the collar of golden beads, the red fist
 *  emblem and the white fur tapering to a point below; 760×560, the neck at (380, 70) */
function drawBody(c: CanvasRenderingContext2D) {
  const cx = 380;
  c.lineJoin = 'round';
  // the white fur below the waist, tapering to a point (as on the model)
  c.beginPath(); c.moveTo(cx - 110, 330); c.quadraticCurveTo(cx - 70, 470, cx, 556); c.quadraticCurveTo(cx + 70, 470, cx + 110, 330); c.closePath();
  const wg = c.createLinearGradient(0, 330, 0, 556); wg.addColorStop(0, '#ffffff'); wg.addColorStop(1, '#b4a8e0'); c.fillStyle = wg; c.fill(); c.lineWidth = 4; c.strokeStyle = OUT; c.stroke();
  c.lineWidth = 2.5; c.strokeStyle = '#a89ad8';
  for (const s of [-1, 0, 1]) { c.beginPath(); c.moveTo(cx + s * 50, 360); c.quadraticCurveTo(cx + s * 40, 440, cx + s * 14, 510); c.stroke(); }
  // the mane over the shoulders, in two layers
  mane(c, cx, 170, 380, 190, 13, Math.PI * 1.0, Math.PI * 2.0, 11, true);
  mane(c, cx, 170, 320, 150, 12, Math.PI * 1.02, Math.PI * 1.98, 12);
  // the chest: broad lilac pecs narrowing to the waist
  c.beginPath(); c.moveTo(cx - 170, 140); c.quadraticCurveTo(cx - 190, 240, cx - 110, 340); c.lineTo(cx + 110, 340); c.quadraticCurveTo(cx + 190, 240, cx + 170, 140); c.closePath();
  const tg = c.createLinearGradient(cx - 180, 0, cx + 180, 0); tg.addColorStop(0, '#4a3a90'); tg.addColorStop(0.5, '#8e7ed6'); tg.addColorStop(1, '#4a3a90');
  c.fillStyle = tg; c.fill(); c.lineWidth = 4; c.strokeStyle = OUT; c.stroke();
  c.strokeStyle = '#3a2a70'; c.lineWidth = 3;
  for (const s of [-1, 1]) { c.beginPath(); c.moveTo(cx, 190); c.quadraticCurveTo(cx + s * 90, 250, cx + s * 150, 200); c.stroke(); }
  c.beginPath(); c.moveTo(cx, 250); c.lineTo(cx, 330); c.stroke();
  // the white fur over the chest, falling from the neck
  mane(c, cx, 100, 170, 130, 9, Math.PI * 0.1, Math.PI * 0.9, 5);
  // the collar: a red band with golden beads
  c.beginPath(); c.moveTo(cx - 180, 150); c.quadraticCurveTo(cx, 270, cx + 180, 150); c.lineWidth = 16; c.strokeStyle = '#a0101e'; c.stroke(); c.lineWidth = 4; c.strokeStyle = OUT;
  for (let n = 0; n <= 6; n++) {
    const u = n / 6, bx = cx - 180 + 360 * u, by = 150 + (1 - (2 * u - 1) ** 2) * 60;
    const g = c.createRadialGradient(bx - 5, by - 5, 2, bx, by, 16); g.addColorStop(0, '#fff6b0'); g.addColorStop(0.5, '#ffc83a'); g.addColorStop(1, '#a86a00');
    c.beginPath(); c.arc(bx, by, 15, 0, Math.PI * 2); c.fillStyle = g; c.fill(); c.lineWidth = 3; c.stroke();
  }
  // the emblem at the waist: a red fist in a blue frame
  c.beginPath(); c.moveTo(cx - 40, 290); c.lineTo(cx + 40, 290); c.lineTo(cx + 34, 360); c.lineTo(cx, 382); c.lineTo(cx - 34, 360); c.closePath();
  c.fillStyle = '#5ab0d0'; c.fill(); c.lineWidth = 4; c.strokeStyle = OUT; c.stroke();
  c.fillStyle = '#d0202a'; c.fillRect(cx - 22, 304, 44, 46); c.strokeRect(cx - 22, 304, 44, 46);
  c.strokeStyle = '#ffd040'; c.lineWidth = 3; for (const y of [318, 334]) { c.beginPath(); c.moveTo(cx - 16, y); c.lineTo(cx + 16, y); c.stroke(); }
}

/** a fist: blue gauntlet with a golden stud, the giant red hand clenched; 300×300, the wrist at (150, 40), knuckles down */
function drawFist(c: CanvasRenderingContext2D) {
  c.lineJoin = 'round';
  // the gauntlet
  c.beginPath(); c.moveTo(70, 10); c.lineTo(230, 10); c.lineTo(250, 130); c.lineTo(50, 130); c.closePath();
  const gg = c.createLinearGradient(50, 0, 250, 0); gg.addColorStop(0, '#1a3a6a'); gg.addColorStop(0.5, '#3a7ab0'); gg.addColorStop(1, '#1a3a6a');
  c.fillStyle = gg; c.fill(); c.lineWidth = 5; c.strokeStyle = OUT; c.stroke();
  c.lineWidth = 6; c.strokeStyle = '#8ad0e0'; c.beginPath(); c.moveTo(62, 60); c.lineTo(238, 60); c.stroke();
  const sg = c.createRadialGradient(145, 90, 3, 150, 95, 26); sg.addColorStop(0, '#fff6b0'); sg.addColorStop(1, '#d09000');
  c.beginPath(); c.ellipse(150, 96, 30, 20, 0, 0, Math.PI * 2); c.fillStyle = sg; c.fill(); c.lineWidth = 4; c.strokeStyle = OUT; c.stroke();
  // the red fist: a big block with four knuckles
  c.beginPath(); c.moveTo(40, 130); c.lineTo(260, 130); c.quadraticCurveTo(290, 200, 262, 286); c.lineTo(38, 286); c.quadraticCurveTo(10, 200, 40, 130); c.closePath();
  const fg = c.createLinearGradient(0, 130, 0, 290); fg.addColorStop(0, '#ff4a4a'); fg.addColorStop(1, '#8a0a1a');
  c.fillStyle = fg; c.fill(); c.lineWidth = 5; c.strokeStyle = OUT; c.stroke();
  c.lineWidth = 4; c.strokeStyle = '#5a0010';
  for (let k = 1; k < 4; k++) { c.beginPath(); c.moveTo(38 + k * 56, 210); c.lineTo(38 + k * 56, 286); c.stroke(); }
  c.beginPath(); c.moveTo(48, 210); c.quadraticCurveTo(150, 196, 252, 210); c.stroke();
  c.strokeStyle = '#ff9a8a'; c.lineWidth = 3; for (let k = 0; k < 4; k++) { c.beginPath(); c.moveTo(52 + k * 56, 226); c.lineTo(80 + k * 56, 226); c.stroke(); }
}

const headTex = (scene: S) => canvasTex(scene, 'evera-head4', 420, 380, (c) => drawHead(c));
const bodyTex = (scene: S) => canvasTex(scene, 'evera-body3', 760, 560, (c) => drawBody(c));
const fistTex = (scene: S) => canvasTex(scene, 'evera-fist', 300, 300, (c) => drawFist(c));

/** a jagged bolt from (x0, y0) to (x1, y1) */
function bolt(g: Phaser.GameObjects.Graphics, x0: number, y0: number, x1: number, y1: number, w: number, col: number, alpha: number, jag = 18) {
  g.lineStyle(w, col, alpha).beginPath().moveTo(x0, y0);
  for (let k = 1; k < 6; k++) g.lineTo(x0 + (x1 - x0) * k / 6 + rnd(-jag, jag), y0 + (y1 - y0) * k / 6 + rnd(-jag, jag));
  g.lineTo(x1, y1).strokePath();
}

export interface SmashHooks {
  /** the sphere bursts on (x, y): hit everyone within r; returns the rivals round it the lightning jumps to */
  burst: (x: number, y: number, r: number) => { x: number; y: number; zap: () => void }[];
}
/** times of the scene, ms */
export const SMASH_MS = { rise: 250, wind: 1150, charge: 1450, punch: 2100, land: 2550, total: 3400 };
/** the reach of the burst, by level */
export const smashSize = (level: number) => ({ r: 150 + level * 12 });

/** Asalto mortal. (x, y) the shooter's feet, (tx, ty) the crowd. Visual only: the scene deals the damage in the hooks. */
export function mortalSmash(scene: S, x: number, y: number, tx: number, ty: number, level: number, hooks: SmashHooks) {
  const cam = scene.cameras.main, view = () => cam.worldView;
  const live: Phaser.GameObjects.GameObject[] = [];
  const keep = <T extends Phaser.GameObjects.GameObject>(o: T) => { live.push(o); return o; };
  const dim = keep(scene.add.rectangle(view().centerX, view().centerY, view().width * 2, view().height * 2, 0x1a1030, 1).setDepth(D.dim).setAlpha(0));
  scene.tweens.add({ targets: dim, alpha: 0.65, duration: 240 });
  const gold = keep(scene.add.rectangle(view().centerX, view().centerY, view().width * 2, view().height * 2, 0xffa81a, 1).setDepth(D.dim + 1).setAlpha(0).setBlendMode(Phaser.BlendModes.ADD));
  scene.tweens.add({ targets: gold, alpha: 0.28, duration: 300, yoyo: true, hold: 500 }); // the golden storm of the call
  const lines = keep(scene.add.graphics().setDepth(D.vortex).setBlendMode(Phaser.BlendModes.ADD));
  // the rocks rising round the shooter
  for (let n = 0; n < 9; n++) {
    const a = rnd(0, Math.PI * 2), d = rnd(40, 130), s = rnd(8, 18);
    const rock = keep(scene.add.polygon(x + Math.cos(a) * d, y + Math.sin(a) * d * 0.4, Array.from({ length: 6 }, (_, k) => {
      const b = k / 6 * Math.PI * 2; return { x: Math.cos(b) * s * rnd(0.7, 1.2), y: Math.sin(b) * s * rnd(0.6, 1) };
    }), 0x8a5a32, 1).setStrokeStyle(2, 0x2a1408).setDepth(D.fx));
    scene.tweens.add({ targets: rock, y: rock.y - rnd(90, 200), angle: rnd(-200, 200), duration: rnd(900, 1300), ease: 'Cubic.easeOut' });
  }
  // ---- Evera looms behind the shooter, fists low
  const H = 860, gs = (view().height * 0.78) / H, wy = Math.max(y + 10, view().top + H * gs + 4);
  const spirit = keep(scene.add.container(x, wy).setDepth(D.giant).setScale(gs * 0.3).setAlpha(0));
  const body = scene.add.image(0, -40, bodyTex(scene)).setOrigin(0.5, 1);
  const head = scene.add.image(0, -500, headTex(scene)).setOrigin(0.5, 330 / 380);
  const fistL = scene.add.image(-300, -250, fistTex(scene)).setOrigin(0.5, 40 / 300).setAngle(-12).setScale(-0.85, 0.85);
  const fistR = scene.add.image(300, -250, fistTex(scene)).setOrigin(0.5, 40 / 300).setAngle(12).setScale(0.85);
  spirit.add([body, fistL, fistR, head]);
  try { spirit.postFX?.addGlow(BLUE, 3, 0, false, 0.1, 10); } catch { /* canvas renderer: no glow */ }
  scene.tweens.add({ targets: spirit, alpha: 1, scaleX: gs, scaleY: gs, delay: SMASH_MS.rise, duration: 480, ease: 'Back.easeOut' });
  const zapG = keep(scene.add.graphics().setDepth(D.fx + 2).setBlendMode(Phaser.BlendModes.ADD));
  const orbG = keep(scene.add.graphics().setDepth(D.fx + 1).setBlendMode(Phaser.BlendModes.ADD));
  const ball = keep(scene.add.image(0, 0, 'fx:ball').setDepth(D.fx + 2).setAlpha(0));
  let charge = 0, orbR = 0, orbX = 0, orbY = 0;
  const t0 = scene.time.now;
  const fistPos = () => { const sc = spirit.scaleX; return { fx: spirit.x + fistR.x * sc, fy: spirit.y + (fistR.y + 170) * sc }; };
  const tick = () => {
    if (!spirit.active) { scene.events.off('update', tick); return; }
    const t = (scene.time.now - t0) / 1000, v = view();
    dim.setPosition(v.centerX, v.centerY); gold.setPosition(v.centerX, v.centerY);
    head.setAngle(Math.sin(t * 2.4) * 2.5);
    lines.clear();
    for (let n = 0; n < 24; n++) { // golden and white speed lines rushing in
      const a = n / 24 * Math.PI * 2 + n * 0.41, r0 = Math.max(v.width, v.height) * 0.75, r1 = r0 * (0.35 + ((t * 2.4 + n * 0.17) % 1) * 0.4);
      lines.lineStyle(n % 3 ? 3 : 6, n % 2 ? 0xffffff : 0xffc83a, 0.26).lineBetween(v.centerX + Math.cos(a) * r0, v.centerY + Math.sin(a) * r0, v.centerX + Math.cos(a) * r1, v.centerY + Math.sin(a) * r1);
    }
    zapG.clear();
    if (charge > 0) { // blue lightning wrapping the drawn-back fist, a blue swirl round it
      const { fx, fy } = fistPos(), R = 60 * spirit.scaleX * 4 * charge;
      zapG.lineStyle(5, BLUE, 0.55 * charge).beginPath().arc(fx, fy, R, t * 9, t * 9 + 4.2).strokePath();
      zapG.lineStyle(3, BLUE2, 0.7 * charge).beginPath().arc(fx, fy, R * 0.72, -t * 11, -t * 11 + 3.6).strokePath();
      for (let k = 0; k < 4; k++) { const a = rnd(0, Math.PI * 2); bolt(zapG, fx, fy, fx + Math.cos(a) * R * 1.5, fy + Math.sin(a) * R * 1.5, k % 2 ? 2 : 4, k % 2 ? BLUE2 : BLUE, 0.85 * charge, 10); }
    }
    orbG.clear();
    if (orbR > 1) { // the ball as a sphere of blue lightning
      orbG.fillStyle(BLUE, 0.3).fillCircle(orbX, orbY, orbR * 1.6).fillStyle(BLUE, 0.7).fillCircle(orbX, orbY, orbR).fillStyle(BLUE2, 0.9).fillCircle(orbX, orbY, orbR * 0.5);
      for (let k = 0; k < 3; k++) { const a = rnd(0, Math.PI * 2); bolt(orbG, orbX, orbY, orbX + Math.cos(a) * orbR * 2.2, orbY + Math.sin(a) * orbR * 2.2, 2.5, BLUE2, 0.9, 6); }
      ball.setPosition(orbX, orbY).setAngle(t * 500);
    }
  };
  scene.events.on('update', tick);
  // he draws the right fist back and lightning wraps it
  scene.time.delayedCall(SMASH_MS.wind, () => {
    if (!spirit.active) return;
    scene.tweens.add({ targets: fistR, x: 360, y: -360, angle: 40, duration: 300, ease: 'Back.easeOut' });
    scene.tweens.add({ targets: fistL, angle: -24, duration: 300 });
    cam.shake(160, 0.004);
  });
  scene.time.delayedCall(SMASH_MS.charge, () => {
    if (!spirit.active) return;
    scene.tweens.addCounter({ from: 0, to: 1, duration: SMASH_MS.punch - SMASH_MS.charge, ease: 'Quad.easeOut', onUpdate: (tw) => { charge = tw.getValue() ?? 0; } });
  });
  // the punch: the fist thrusts at the ball as the shooter kicks it, a flash, and the sphere flies off
  scene.time.delayedCall(SMASH_MS.punch - 120, () => { if (spirit.active) scene.tweens.add({ targets: fistR, x: 120, y: -150, angle: -30, duration: 120, ease: 'Quad.easeIn' }); });
  scene.time.delayedCall(SMASH_MS.punch, () => {
    if (!spirit.active) return;
    cam.flash(140, 200, 240, 255); cam.shake(220, 0.01);
    charge = 0;
    const sx = x, sy = y - 20;
    orbX = sx; orbY = sy; orbR = 22; ball.setAlpha(1);
    for (let n = 0; n < 6; n++) { // dust rolling out from the kick
      const a = n / 6 * Math.PI * 2, puff = scene.add.circle(sx, y, rnd(14, 22), 0xe8e8f0, 0.8).setDepth(D.fx - 1);
      scene.tweens.add({ targets: puff, x: sx + Math.cos(a) * 80, y: y + Math.sin(a) * 30, scale: 2.2, alpha: 0, duration: 600, onComplete: () => puff.destroy() });
    }
    scene.tweens.addCounter({ from: 0, to: 1, duration: SMASH_MS.land - SMASH_MS.punch, ease: 'Quad.easeIn', onUpdate: (tw) => {
      const u = tw.getValue() ?? 0; orbX = sx + (tx - sx) * u; orbY = sy + (ty - sy) * u - Math.sin(u * Math.PI) * 40;
    }, onComplete: () => {
      orbR = 0; ball.setAlpha(0);
      cam.shake(360, 0.016); cam.flash(160, 255, 200, 120);
      const { r } = smashSize(level);
      const zaps = hooks.burst(tx, ty, r);
      // the burst: an orange ring, a white star with blue lightning round it, then the bolts jump to the rivals
      const ring = scene.add.ellipse(tx, ty, r * 0.5, r * 0.3).setStrokeStyle(10, 0xff8a1a, 1).setDepth(D.fx).setBlendMode(Phaser.BlendModes.ADD);
      scene.tweens.add({ targets: ring, scale: 4.2, alpha: 0, duration: 560, ease: 'Cubic.easeOut', onComplete: () => ring.destroy() });
      const star = scene.add.star(tx, ty, 8, 18, 70, 0xffffff, 1).setDepth(D.fx + 1).setBlendMode(Phaser.BlendModes.ADD);
      scene.tweens.add({ targets: star, scale: 2.2, angle: 30, alpha: 0, duration: 480, ease: 'Cubic.easeOut', onComplete: () => star.destroy() });
      const fx = scene.add.graphics().setDepth(D.fx + 2).setBlendMode(Phaser.BlendModes.ADD);
      const b0 = scene.time.now;
      const draw = () => {
        if (!fx.active) { scene.events.off('update', draw); return; }
        const u = (scene.time.now - b0) / 700;
        fx.clear();
        fx.fillStyle(BLUE, 0.14 * (1 - u)).fillCircle(tx, ty, r * 0.35 * (0.6 + u));
        for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2 + u; bolt(fx, tx, ty, tx + Math.cos(a) * r * 0.8, ty + Math.sin(a) * r * 0.5, 4, k % 2 ? BLUE2 : BLUE, 1 - u); }
        for (const q of zaps) bolt(fx, tx, ty, q.x, q.y, 3, BLUE2, 0.9 * (1 - u));
      };
      scene.events.on('update', draw);
      scene.time.delayedCall(220, () => { for (const q of zaps) q.zap(); });
      scene.time.delayedCall(700, () => { scene.events.off('update', draw); fx.destroy(); });
      for (let n = 0; n < 10; n++) { // dust and gold sparks thrown out
        const a = rnd(0, Math.PI * 2), sp = scene.add.circle(tx, ty, rnd(3, 6), n % 2 ? GOLD : BLUE2, 1).setDepth(D.fx + 1).setBlendMode(Phaser.BlendModes.ADD);
        scene.tweens.add({ targets: sp, x: tx + Math.cos(a) * rnd(60, r), y: ty + Math.sin(a) * rnd(40, r * 0.6), alpha: 0, duration: rnd(380, 620), onComplete: () => sp.destroy() });
      }
    } });
    scene.time.delayedCall(260, () => { if (spirit.active) scene.tweens.add({ targets: spirit, alpha: 0, y: spirit.y - 24, duration: 600, ease: 'Cubic.easeIn' }); });
  });
  const end = SMASH_MS.total;
  scene.time.delayedCall(end - 420, () => { for (const o of live) if (o !== dim && o.active) fade(scene, o, 0, 400); });
  scene.tweens.add({ targets: dim, alpha: 0, delay: end - 400, duration: 380, onComplete: () => dim.destroy() });
  scene.time.delayedCall(end, () => scene.events.off('update', tick));
}
