/**
 * Golpe de Atenea, «Orden de tiro EG02» in the game (author, from its scene in GO Chrono Stones, youtube TkBy_0FNC1o
 * 4:12-4:20, watched frame by frame; inazuma.fandom «Golpe de Atenea»: «el usuario y Athena saltan, Athena va girando y
 * se detiene; las dos serpientes de sus brazos abren la boca y crean una bola de energía, azul y rosa, que lanza hacia el
 * usuario; le dan al balón y se crea una gran esfera de energía, que se transforma en rayo y va a la portería»).
 * Dueña del aire, Atenea: wide wings of long dark feathers, a pale face with violet eyes framed by dark hair and white
 * locks, a teal crown with a cyan serpent and red eyes on her brow, a white gown, her arms ending in two serpents — pink
 * on the left, cyan on the right. Blue speed lines rush past; she spins down behind the shooter, the serpents open their
 * mouths and make a pink orb and a cyan orb that fly into the ball; it swells into a white sphere inside a violet whirl
 * and leaves as a violet beam full of pink and cyan streaks. Here the beam runs through the rivals in a line.
 * Visual only: the scene deals the damage in the hooks.
 */
import Phaser from 'phaser';
import { canvasTex, D, fade, rnd } from './fxKeshin';

type S = Phaser.Scene;
const PINK = 0xff3ad8, PINK2 = 0xffa8f0, CYAN = 0x3ae0ff, CYAN2 = 0xb8f8ff, VIOLET = 0x7a2aff, DEEP = 0x2a0a5a;
const OUT = '#0c0a1a';

/** the head: dark hair with white locks, the pale face, violet eyes, the teal crown and its cyan serpent; 380×400,
 *  the chin at (190, 330) */
function drawHead(c: CanvasRenderingContext2D) {
  const cx = 190;
  c.lineJoin = 'round'; c.lineCap = 'round';
  // the hair: long and dark, falling past the shoulders
  // (curved sides, flowing out at the shoulders, ending in pointed strands)
  c.beginPath(); c.moveTo(cx - 90, 130); c.quadraticCurveTo(cx, 80, cx + 90, 130);
  c.bezierCurveTo(cx + 150, 190, cx + 120, 280, cx + 160, 360);
  for (const [px, py] of [[cx + 130, 340], [cx + 120, 396], [cx + 96, 350], [cx + 76, 398], [cx + 66, 320]]) c.lineTo(px, py);
  c.lineTo(cx - 66, 320);
  for (const [px, py] of [[cx - 76, 398], [cx - 96, 350], [cx - 120, 396], [cx - 130, 340], [cx - 160, 360]]) c.lineTo(px, py);
  c.bezierCurveTo(cx - 120, 280, cx - 150, 190, cx - 90, 130); c.closePath();
  const hg = c.createLinearGradient(0, 100, 0, 400); hg.addColorStop(0, '#2a3a52'); hg.addColorStop(1, '#0e1420'); c.fillStyle = hg; c.fill(); c.lineWidth = 4; c.strokeStyle = OUT; c.stroke();
  // the face: pale, narrow chin
  c.beginPath(); c.moveTo(cx - 62, 170); c.quadraticCurveTo(cx - 70, 270, cx, 334); c.quadraticCurveTo(cx + 70, 270, cx + 62, 170); c.quadraticCurveTo(cx, 150, cx - 62, 170); c.closePath();
  const fg = c.createLinearGradient(0, 160, 0, 334); fg.addColorStop(0, '#f4f0fa'); fg.addColorStop(1, '#c8c0dc'); c.fillStyle = fg; c.fill(); c.lineWidth = 3.5; c.strokeStyle = OUT; c.stroke();
  // white locks framing the face
  for (const s of [-1, 1]) {
    c.beginPath(); c.moveTo(cx + s * 30, 160); c.quadraticCurveTo(cx + s * 80, 230, cx + s * 64, 380); c.lineTo(cx + s * 40, 380); c.quadraticCurveTo(cx + s * 56, 240, cx + s * 18, 168); c.closePath();
    c.fillStyle = '#f0f0f8'; c.fill(); c.lineWidth = 3; c.strokeStyle = '#8a8aa8'; c.stroke();
  }
  // the eyes: violet, half closed, calm
  for (const s of [-1, 1]) {
    c.beginPath(); c.moveTo(cx + s * 12, 236); c.quadraticCurveTo(cx + s * 30, 224, cx + s * 46, 232); c.quadraticCurveTo(cx + s * 30, 244, cx + s * 12, 236); c.closePath();
    c.fillStyle = '#b08ae8'; c.fill(); c.lineWidth = 2.5; c.strokeStyle = '#3a2a5a'; c.stroke();
    c.beginPath(); c.moveTo(cx + s * 10, 226); c.quadraticCurveTo(cx + s * 30, 214, cx + s * 50, 224); c.lineWidth = 3; c.strokeStyle = '#2a2040'; c.stroke();
  }
  c.beginPath(); c.moveTo(cx - 14, 296); c.quadraticCurveTo(cx, 300, cx + 14, 296); c.lineWidth = 2.5; c.strokeStyle = '#7a5a8a'; c.stroke(); // the mouth
  // the crown: teal plates fanning up, a cyan serpent rising in the middle with red eyes
  for (let n = -2; n <= 2; n++) {
    const a = -Math.PI / 2 + n * 0.32, bx = cx + n * 22, by = 168;
    c.beginPath(); c.moveTo(bx - 14, by); c.lineTo(bx + Math.cos(a) * 70, by + Math.sin(a) * 70); c.lineTo(bx + 14, by); c.closePath();
    c.fillStyle = n === 0 ? '#3ad8c8' : '#1a7a80'; c.fill(); c.lineWidth = 3; c.strokeStyle = OUT; c.stroke();
  }
  c.beginPath(); c.ellipse(cx, 72, 26, 34, 0, 0, Math.PI * 2); c.fillStyle = '#5af0e0'; c.fill(); c.lineWidth = 3.5; c.strokeStyle = OUT; c.stroke(); // the serpent's head
  for (const s of [-1, 1]) { c.beginPath(); c.ellipse(cx + s * 10, 66, 5, 7, 0, 0, Math.PI * 2); c.fillStyle = '#ff2a3a'; c.fill(); }
  c.beginPath(); c.moveTo(cx - 10, 96); c.lineTo(cx, 112); c.lineTo(cx + 10, 96); c.lineWidth = 3; c.strokeStyle = OUT; c.stroke();
}

/** the body: the feather wings, the white gown with violet trims; 1000×620, the neck at (500, 120) */
function drawBody(c: CanvasRenderingContext2D) {
  const cx = 500;
  c.lineJoin = 'round';
  // the wings: long dark feathers fanning up and out, pale tips
  for (const s of [-1, 1]) for (let n = 0; n < 7; n++) {
    const a = -1.25 + n * 0.3, L = 420 - Math.abs(n - 2) * 30, bx = cx + s * 80, by = 180;
    const ex = bx + s * Math.cos(a) * L, ey = by + Math.sin(a) * L;
    c.beginPath(); c.moveTo(bx, by - 18); c.quadraticCurveTo((bx + ex) / 2 - s * 10, (by + ey) / 2 - 30, ex, ey); c.quadraticCurveTo((bx + ex) / 2 + s * 20, (by + ey) / 2 + 24, bx, by + 22); c.closePath();
    const g = c.createLinearGradient(bx, by, ex, ey); g.addColorStop(0, '#1a1e2a'); g.addColorStop(0.75, '#3a4252'); g.addColorStop(1, '#c8ccd8');
    c.fillStyle = g; c.fill(); c.lineWidth = 3.5; c.strokeStyle = OUT; c.stroke();
  }
  // the gown: white, flaring down, violet bands
  // (slender: a fitted bodice, then a skirt that melts into light toward the bottom)
  c.beginPath(); c.moveTo(cx - 80, 120); c.quadraticCurveTo(cx - 70, 240, cx - 50, 280); c.quadraticCurveTo(cx - 120, 450, cx - 130, 616);
  c.lineTo(cx + 130, 616); c.quadraticCurveTo(cx + 120, 450, cx + 50, 280); c.quadraticCurveTo(cx + 70, 240, cx + 80, 120); c.closePath();
  const gg = c.createLinearGradient(cx - 130, 0, cx + 130, 0); gg.addColorStop(0, '#b8acd8'); gg.addColorStop(0.5, '#ffffff'); gg.addColorStop(1, '#b8acd8');
  c.fillStyle = gg; c.fill(); c.lineWidth = 4; c.strokeStyle = OUT; c.stroke();
  c.lineWidth = 8; c.strokeStyle = '#8a5ad8';
  c.beginPath(); c.moveTo(cx - 52, 280); c.quadraticCurveTo(cx, 296, cx + 52, 280); c.stroke(); // the violet sash at the waist
  for (const s of [-1, 1]) { c.beginPath(); c.moveTo(cx + s * 20, 290); c.quadraticCurveTo(cx + s * 50, 420, cx + s * 70, 600); c.lineWidth = 3; c.strokeStyle = '#c8bce8'; c.stroke(); } // folds
  // the skirt fades out at the bottom
  c.globalCompositeOperation = 'destination-out';
  const fade = c.createLinearGradient(0, 380, 0, 616); fade.addColorStop(0, 'rgba(0,0,0,0)'); fade.addColorStop(1, 'rgba(0,0,0,1)');
  c.fillStyle = fade; c.fillRect(cx - 150, 380, 300, 240);
  c.globalCompositeOperation = 'source-over';
  // the shoulder guards
  for (const s of [-1, 1]) { c.beginPath(); c.ellipse(cx + s * 100, 150, 54, 36, s * 0.3, 0, Math.PI * 2); c.fillStyle = '#e8e0f4'; c.fill(); c.lineWidth = 4; c.strokeStyle = OUT; c.stroke(); }
}

/** an arm ending in a serpent, mouth open, facing right; `pink`: the left one; 340×150, the shoulder at (10, 75), the
 *  mouth at (316, 75) */
function drawSerpentArm(c: CanvasRenderingContext2D, pink: boolean) {
  const col = pink ? '#ff5ad8' : '#3ad0ff', dark = pink ? '#9a1a8a' : '#1a6aa8';
  c.lineJoin = 'round';
  c.beginPath(); c.moveTo(10, 60); c.quadraticCurveTo(110, 40, 200, 56); c.lineTo(200, 96); c.quadraticCurveTo(110, 110, 10, 92); c.closePath();
  c.fillStyle = '#e8e0f4'; c.fill(); c.lineWidth = 4; c.strokeStyle = OUT; c.stroke();
  // the gauntlet scales
  c.beginPath(); c.moveTo(150, 46); c.lineTo(250, 40); c.lineTo(250, 110); c.lineTo(150, 104); c.closePath();
  const g = c.createLinearGradient(150, 0, 250, 0); g.addColorStop(0, dark); g.addColorStop(1, col); c.fillStyle = g; c.fill(); c.lineWidth = 4; c.stroke();
  c.lineWidth = 2; c.strokeStyle = dark;
  for (let x = 165; x < 250; x += 18) { c.beginPath(); c.moveTo(x, 48); c.quadraticCurveTo(x + 10, 75, x, 102); c.stroke(); }
  // the serpent's head, jaws open
  c.beginPath(); c.moveTo(246, 40); c.quadraticCurveTo(300, 26, 334, 58); c.lineTo(292, 70); c.lineTo(246, 66); c.closePath(); c.fillStyle = col; c.fill(); c.lineWidth = 4; c.strokeStyle = OUT; c.stroke();
  c.beginPath(); c.moveTo(246, 84); c.lineTo(292, 82); c.lineTo(330, 100); c.quadraticCurveTo(290, 120, 246, 110); c.closePath(); c.fillStyle = col; c.fill(); c.stroke();
  c.beginPath(); c.moveTo(292, 70); c.lineTo(334, 60); c.lineTo(330, 98); c.lineTo(292, 82); c.closePath(); c.fillStyle = '#ffffff'; c.fill();
  c.beginPath(); c.ellipse(282, 48, 6, 4, 0.2, 0, Math.PI * 2); c.fillStyle = '#ff2a3a'; c.fill();
}

const headTex = (scene: S) => canvasTex(scene, 'atenea-head', 380, 400, (c) => drawHead(c));
const bodyTex = (scene: S) => canvasTex(scene, 'atenea-body', 1000, 620, (c) => drawBody(c));
const armTex = (scene: S, pink: boolean) => canvasTex(scene, pink ? 'atenea-arm-pink' : 'atenea-arm-cyan', 340, 150, (c) => drawSerpentArm(c, pink));

export interface AthenaHooks {
  /** the beam leaves (x, y) at angle `ang`, `len` long and `half` wide: hit the rivals in it */
  beam: (x: number, y: number, ang: number, len: number, half: number) => void;
}
/** times of the scene, ms */
export const ATHENA_MS = { rise: 250, stop: 1050, orbs: 1150, fly: 1600, sphere: 1850, shot: 2200, total: 3300 };
/** the beam, by level */
export const athenaBeam = (level: number) => ({ len: 380 + level * 25, half: 34 + level * 3 });

/** Golpe de Atenea. (x, y) the shooter's feet, (tx, ty) where he aims. */
export function athenaStrike(scene: S, x: number, y: number, tx: number, ty: number, level: number, hooks: AthenaHooks) {
  const cam = scene.cameras.main, view = () => cam.worldView;
  const live: Phaser.GameObjects.GameObject[] = [];
  const keep = <T extends Phaser.GameObjects.GameObject>(o: T) => { live.push(o); return o; };
  const dim = keep(scene.add.rectangle(view().centerX, view().centerY, view().width * 2, view().height * 2, 0x0a0a3a, 1).setDepth(D.dim).setAlpha(0));
  scene.tweens.add({ targets: dim, alpha: 0.65, duration: 240 });
  const lines = keep(scene.add.graphics().setDepth(D.vortex).setBlendMode(Phaser.BlendModes.ADD));
  // ---- Atenea comes down spinning behind the shooter
  const H = 1000, gs = (view().height * 0.78) / H, wy = Math.max(y + 10, view().top + H * gs + 4);
  const spirit = keep(scene.add.container(x, wy - 120).setDepth(D.giant).setScale(gs * 0.4).setAlpha(0));
  const body = scene.add.image(0, 0, bodyTex(scene)).setOrigin(0.5, 1);
  const armL = scene.add.image(-110, -470, armTex(scene, true)).setOrigin(10 / 340, 0.5).setAngle(200);
  const armR = scene.add.image(110, -470, armTex(scene, false)).setOrigin(10 / 340, 0.5).setAngle(-20);
  const head = scene.add.image(0, -460, headTex(scene)).setOrigin(0.5, 330 / 400);
  spirit.add([body, armL, armR, head]);
  try { spirit.postFX?.addGlow(PINK, 3, 0, false, 0.1, 10); } catch { /* canvas renderer: no glow */ }
  scene.tweens.add({ targets: spirit, alpha: 1, y: wy, delay: ATHENA_MS.rise, duration: ATHENA_MS.stop - ATHENA_MS.rise, ease: 'Cubic.easeOut' });
  // where each serpent's mouth is, in the world
  const mouth = (arm: Phaser.GameObjects.Image) => {
    const a = Phaser.Math.DegToRad(arm.angle), sc = spirit.scaleX;
    return { x: spirit.x + (arm.x + Math.cos(a) * 306) * sc, y: spirit.y + (arm.y + Math.sin(a) * 306) * sc };
  };
  const orbs = keep(scene.add.graphics().setDepth(D.fx).setBlendMode(Phaser.BlendModes.ADD));
  const ball = keep(scene.add.image(x, y - 14, 'fx:ball').setDepth(D.fx + 1).setAlpha(0));
  const bx = x + Math.cos(Math.atan2(ty - y, tx - x)) * 20, by = y - 14 + Math.sin(Math.atan2(ty - y, tx - x)) * 20;
  let orbU = -1, flyU = -1, sphereU = -1;
  const t0 = scene.time.now;
  const tick = () => {
    if (!spirit.active) { scene.events.off('update', tick); return; }
    const ms = scene.time.now - t0, t = ms / 1000, v = view();
    dim.setPosition(v.centerX, v.centerY);
    // she spins as she comes down, then stops facing us
    if (ms < ATHENA_MS.stop) { const sp = Math.cos(ms / ATHENA_MS.stop * Math.PI * 4); spirit.scaleX = (spirit.scaleY || gs) * (Math.abs(sp) < 0.15 ? 0.15 : Math.abs(sp)); }
    else if (spirit.scaleX !== spirit.scaleY) spirit.scaleX = spirit.scaleY;
    if (ms < ATHENA_MS.stop) spirit.scaleY = Math.min(gs, gs * (0.4 + ms / ATHENA_MS.stop));
    head.setAngle(Math.sin(t * 2) * 2);
    lines.clear();
    for (let n = 0; n < 24; n++) { // blue speed lines rushing past
      const yy = v.top + (n / 24) * v.height + Math.sin(n * 3.1) * 10, p = (t * 2.2 + n * 0.29) % 1, xx = v.right - p * v.width * 1.6;
      lines.lineStyle(n % 3 ? 2 : 4, n % 2 ? 0x5a8aff : 0xffffff, 0.3).lineBetween(xx, yy, xx + v.width * 0.3, yy);
    }
    orbs.clear();
    const mL = mouth(armL), mR = mouth(armR);
    if (orbU >= 0) for (const [m, c1, c2] of [[mL, PINK, PINK2], [mR, CYAN, CYAN2]] as const) { // the serpents' orbs
      const q = flyU >= 0 ? flyU : 0, ox = m.x + (bx - m.x) * q, oy = m.y + (by - m.y) * q, r = (6 + orbU * 16) * (1 - q * 0.4);
      orbs.fillStyle(c1, 0.35).fillCircle(ox, oy, r * 1.6).fillStyle(c1, 0.8).fillCircle(ox, oy, r).fillStyle(c2, 0.9).fillCircle(ox, oy, r * 0.5);
      for (let k = 0; k < 3; k++) { const a0 = t * 9 + k * 2.1; orbs.lineStyle(2, c2, 0.8).beginPath().arc(ox, oy, r * 1.25, a0, a0 + 1.4).strokePath(); }
    }
    if (sphereU >= 0) { // the white sphere inside a violet whirl
      const R = 14 + sphereU * 22;
      for (let k = 0; k < 4; k++) { const a0 = -t * 8 + k * 1.57; orbs.lineStyle(12 - k * 2, k % 2 ? DEEP : VIOLET, 0.75).beginPath().arc(bx, by, R * (1.3 + k * 0.25), a0, a0 + 2.3).strokePath(); }
      orbs.fillStyle(0xffffff, 0.35).fillCircle(bx, by, R * 1.2).fillStyle(0xffffff, 0.95).fillCircle(bx, by, R * 0.8);
      orbs.fillStyle(PINK2, 0.8).fillCircle(bx - R * 0.35, by - R * 0.2, R * 0.25).fillStyle(CYAN2, 0.8).fillCircle(bx + R * 0.3, by + R * 0.25, R * 0.22);
    }
  };
  scene.events.on('update', tick);
  // the serpents rise and open their mouths; the orbs swell, fly into the ball, the sphere grows
  scene.time.delayedCall(ATHENA_MS.stop, () => { if (spirit.active) { scene.tweens.add({ targets: armL, angle: 215, duration: 220 }); scene.tweens.add({ targets: armR, angle: -35, duration: 220 }); } });
  scene.time.delayedCall(ATHENA_MS.orbs, () => scene.tweens.addCounter({ from: 0, to: 1, duration: ATHENA_MS.fly - ATHENA_MS.orbs, onUpdate: (tw) => { orbU = tw.getValue() ?? 0; } }));
  scene.time.delayedCall(ATHENA_MS.fly, () => scene.tweens.addCounter({ from: 0, to: 1, duration: ATHENA_MS.sphere - ATHENA_MS.fly, ease: 'Quad.easeIn', onUpdate: (tw) => { flyU = tw.getValue() ?? 0; }, onComplete: () => { orbU = -1; flyU = -1; } }));
  scene.time.delayedCall(ATHENA_MS.sphere, () => {
    if (!spirit.active) return;
    ball.setPosition(bx, by).setAlpha(1);
    scene.tweens.addCounter({ from: 0, to: 1, duration: ATHENA_MS.shot - ATHENA_MS.sphere, onUpdate: (tw) => { sphereU = tw.getValue() ?? 0; } });
  });
  // the sphere turns into the beam
  scene.time.delayedCall(ATHENA_MS.shot, () => {
    if (!spirit.active) return;
    sphereU = -1; ball.setAlpha(0);
    cam.shake(260, 0.01);
    const ang = Math.atan2(ty - by, tx - bx), { len, half } = athenaBeam(level);
    hooks.beam(bx, by, ang, len, half);
    const beam = keep(scene.add.graphics().setDepth(D.fx).setBlendMode(Phaser.BlendModes.ADD));
    const ux = Math.cos(ang), uy = Math.sin(ang), nx = -uy, ny = ux, b0 = scene.time.now;
    const streaks = Array.from({ length: 14 }, (_, i) => ({ off: rnd(-0.8, 0.8), sp: rnd(1.2, 2.2), c: i % 2 ? PINK : CYAN, ph: rnd(0, 1) }));
    const draw = () => {
      if (!beam.active) { scene.events.off('update', draw); return; }
      const u = Math.min(1, (scene.time.now - b0) / 700), grow = Math.min(1, u * 4), a = u > 0.6 ? (1 - u) / 0.4 : 1, L = len * grow, t = (scene.time.now - b0) / 1000;
      const ex = bx + ux * L, ey = by + uy * L;
      beam.clear();
      for (const [w, c, al] of [[1.25, DEEP, 0.55], [0.9, VIOLET, 0.7], [0.45, 0xd8b8ff, 0.8], [0.18, 0xffffff, 0.95]] as const) {
        const hw = half * w;
        beam.fillStyle(c, al * a).fillPoints([{ x: bx + nx * hw * 0.4, y: by + ny * hw * 0.4 }, { x: ex + nx * hw, y: ey + ny * hw }, { x: ex - nx * hw, y: ey - ny * hw }, { x: bx - nx * hw * 0.4, y: by - ny * hw * 0.4 }], true);
      }
      for (const s of streaks) { // pink and cyan streaks racing down the beam
        const p = (t * s.sp + s.ph) % 1, sx = bx + ux * L * p + nx * half * s.off, sy = by + uy * L * p + ny * half * s.off;
        beam.lineStyle(3, s.c, 0.9 * a).lineBetween(sx, sy, sx - ux * 40, sy - uy * 40);
      }
      for (let k = 1; k <= 3; k++) { const p = ((t * 1.5 + k / 3) % 1) * L; beam.lineStyle(4, VIOLET, 0.6 * a).strokeEllipse(bx + ux * p, by + uy * p, half * 0.9, half * 2.1); } // spiral rings along it
    };
    scene.events.on('update', draw);
    scene.time.delayedCall(700, () => { scene.events.off('update', draw); beam.destroy(); });
    scene.time.delayedCall(200, () => { if (spirit.active) scene.tweens.add({ targets: spirit, alpha: 0, y: spirit.y - 30, duration: 600, ease: 'Cubic.easeIn' }); });
  });
  const end = ATHENA_MS.total;
  scene.time.delayedCall(end - 420, () => { for (const o of live) if (o !== dim && o.active) fade(scene, o, 0, 400); });
  scene.tweens.add({ targets: dim, alpha: 0, delay: end - 400, duration: 380, onComplete: () => dim.destroy() });
  scene.time.delayedCall(end, () => scene.events.off('update', tick));
}
