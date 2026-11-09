/**
 * Despeje demoníaco (author, from its scene in GO Chrono Stones, youtube IpLlr4G-fs4 2:16-2:25, watched frame by frame;
 * inazuma.fandom «Duque destructor, Demogorgo»: purple with black stripes, black fists, red hair and two horns; «Despeje
 * demoníaco»: «invoca a Demogorgo, el cual con un gran golpe despeja el tiro enemigo»). The keeper raises his fist in a
 * green burst and Demogorgo rises behind him — a purple giant striped in black, a red flaming mane, two lilac horns
 * curling up with black swirls, pale glowing eyes and fangs, black bat wings tipped in red, huge black fists. A violet
 * slash sweeps the air, the ball comes in as a golden comet, and his fist meets it: a golden flash, a violet whirl with
 * yellow lightning, and the ball is sent flying away as a violet-and-red streak that vanishes in the sky with a twinkle.
 * Here: the fist lands on the thickest crowd near the keeper; every rival shot in reach is punched away and the rivals of
 * the blow fly off. Visual only: the scene deals the damage in the hooks.
 */
import Phaser from 'phaser';
import { canvasTex, D, fade, rnd } from './fxKeshin';
import { bolt } from './fxMovie';

type S = Phaser.Scene;
const GREEN = 0x5aff4a, GREEN2 = 0xd8ffb0, VIOLET = 0x8a2aff, VIOLET2 = 0xc88aff, GOLD = 0xffd23a, GOLD2 = 0xfff4b0, RED = 0xff3a2a;
const OUT = '#120818';

/** a black tiger stripe, curling at its end */
function stripe(c: CanvasRenderingContext2D, x: number, y: number, len: number, ang: number, w: number) {
  c.save(); c.translate(x, y); c.rotate(ang);
  c.beginPath(); c.moveTo(0, -w); c.quadraticCurveTo(len * 0.6, -w * 1.6, len, 0); c.quadraticCurveTo(len * 0.9, w * 0.4, len * 0.75, w * 0.9);
  c.quadraticCurveTo(len * 0.5, w * 0.3, 0, w); c.closePath(); c.fillStyle = '#16101e'; c.fill();
  c.restore();
}

/** the head: the red flaming mane, two curled lilac horns with black swirls, the purple face, pale eyes, fangs;
 *  380×360, the chin at (190, 320) */
function drawHead(c: CanvasRenderingContext2D) {
  const cx = 190;
  c.lineJoin = 'round'; c.lineCap = 'round';
  // the mane: red flames all round, darker behind
  for (const [col, r] of [['#8a1408', 1.0], ['#e8401a', 0.86]] as const) {
    c.beginPath(); c.moveTo(cx - 140 * r, 300);
    for (let n = 0; n <= 12; n++) {
      const a = Math.PI * (0.95 + n / 12 * 1.1), rr = (n % 2 ? 170 : 120) * r;
      c.lineTo(cx + Math.cos(a) * rr * 1.05, 205 + Math.sin(a) * rr);
    }
    c.lineTo(cx + 140 * r, 300); c.closePath(); c.fillStyle = col; c.fill(); c.lineWidth = 4; c.strokeStyle = OUT; c.stroke();
  }
  // the horns: lilac, curling up and in, black swirls on them
  for (const s of [-1, 1]) {
    c.beginPath(); c.moveTo(cx + s * 46, 130); c.bezierCurveTo(cx + s * 120, 100, cx + s * 130, 20, cx + s * 80, 6);
    c.bezierCurveTo(cx + s * 106, 40, cx + s * 96, 90, cx + s * 30, 112); c.closePath();
    const hg = c.createLinearGradient(cx + s * 30, 120, cx + s * 90, 0); hg.addColorStop(0, '#9a7ad8'); hg.addColorStop(1, '#e0d0ff');
    c.fillStyle = hg; c.fill(); c.lineWidth = 4; c.strokeStyle = OUT; c.stroke();
    c.beginPath(); c.arc(cx + s * 96, 66, 14, s < 0 ? 0 : Math.PI, s < 0 ? Math.PI * 1.6 : Math.PI * 2.6); c.lineWidth = 6; c.strokeStyle = '#16101e'; c.stroke();
  }
  // the face: purple, a heavy brow, a broad jaw
  c.beginPath(); c.moveTo(cx - 74, 120); c.quadraticCurveTo(cx - 96, 220, cx - 60, 290); c.lineTo(cx, 322); c.lineTo(cx + 60, 290); c.quadraticCurveTo(cx + 96, 220, cx + 74, 120);
  c.quadraticCurveTo(cx, 96, cx - 74, 120); c.closePath();
  const fg = c.createLinearGradient(0, 110, 0, 320); fg.addColorStop(0, '#a88ae8'); fg.addColorStop(1, '#5a3aa0'); c.fillStyle = fg; c.fill(); c.lineWidth = 4; c.strokeStyle = OUT; c.stroke();
  // black swirls on the cheeks and the brow
  for (const s of [-1, 1]) { c.beginPath(); c.arc(cx + s * 52, 230, 16, s < 0 ? 0.3 : Math.PI + 0.3, s < 0 ? Math.PI * 1.7 : Math.PI * 2.7); c.lineWidth = 6; c.strokeStyle = '#16101e'; c.stroke(); }
  c.beginPath(); c.moveTo(cx - 70, 150); c.lineTo(cx - 12, 176); c.lineTo(cx, 160); c.lineTo(cx + 12, 176); c.lineTo(cx + 70, 150); c.lineTo(cx + 64, 136); c.lineTo(cx, 150); c.lineTo(cx - 64, 136); c.closePath();
  c.fillStyle = '#2a1840'; c.fill(); // the scowling brow
  // the eyes: pale, glowing, slanted
  for (const s of [-1, 1]) {
    c.beginPath(); c.moveTo(cx + s * 12, 186); c.lineTo(cx + s * 50, 168); c.lineTo(cx + s * 44, 192); c.closePath();
    c.fillStyle = '#fff6c8'; c.shadowColor = '#ffe86a'; c.shadowBlur = 14; c.fill(); c.shadowBlur = 0; c.lineWidth = 2.5; c.strokeStyle = OUT; c.stroke();
  }
  // the mouth roaring open, white fangs, red beard tufts round it
  c.beginPath(); c.moveTo(cx - 40, 248); c.quadraticCurveTo(cx, 236, cx + 40, 248); c.quadraticCurveTo(cx + 30, 300, cx, 304); c.quadraticCurveTo(cx - 30, 300, cx - 40, 248); c.closePath();
  c.fillStyle = '#3a0818'; c.fill(); c.lineWidth = 3; c.strokeStyle = OUT; c.stroke();
  c.fillStyle = '#ffffff';
  for (const s of [-1, 1]) {
    c.beginPath(); c.moveTo(cx + s * 34, 248); c.lineTo(cx + s * 22, 246); c.lineTo(cx + s * 28, 272); c.closePath(); c.fill();
    c.beginPath(); c.moveTo(cx + s * 26, 298); c.lineTo(cx + s * 14, 300); c.lineTo(cx + s * 20, 278); c.closePath(); c.fill();
  }
  c.fillStyle = '#e8401a';
  for (const s of [-1, 1]) { c.beginPath(); c.moveTo(cx + s * 58, 270); c.lineTo(cx + s * 80, 330); c.lineTo(cx + s * 40, 300); c.closePath(); c.fill(); c.lineWidth = 3; c.strokeStyle = OUT; c.stroke(); }
}

/** the body: black bat wings tipped in red behind a purple torso striped in black, the left arm and its black fist;
 *  1000×640, the neck at (500, 130) */
function drawBody(c: CanvasRenderingContext2D) {
  const cx = 500;
  c.lineJoin = 'round';
  // the wings: three bony fingers a side, black membrane, red tips
  for (const s of [-1, 1]) {
    const sx = cx + s * 120, sy = 200;
    const tips = [[sx + s * 380, 40], [sx + s * 400, 230], [sx + s * 300, 420]];
    c.beginPath(); c.moveTo(sx, sy - 40);
    for (const [tx, ty] of tips) { c.lineTo(tx, ty); c.quadraticCurveTo((tx + sx) / 2 + s * 40, (ty + sy) / 2 + 40, sx + s * 60, sy + 120); }
    c.closePath(); c.fillStyle = '#1a1424'; c.fill(); c.lineWidth = 4; c.strokeStyle = OUT; c.stroke();
    for (const [tx, ty] of tips) {
      c.beginPath(); c.moveTo(sx, sy); c.lineTo(tx, ty); c.lineWidth = 7; c.strokeStyle = '#3a2a4a'; c.stroke();
      c.beginPath(); c.moveTo(tx, ty); c.lineTo(tx - s * 60, ty + 30); c.lineTo(tx - s * 30, ty - 20); c.closePath(); c.fillStyle = '#d02a1a'; c.fill(); c.lineWidth = 3; c.strokeStyle = OUT; c.stroke();
    }
  }
  // the torso: broad purple shoulders and chest
  c.beginPath(); c.moveTo(cx - 200, 170); c.quadraticCurveTo(cx - 150, 110, cx, 120); c.quadraticCurveTo(cx + 150, 110, cx + 200, 170);
  c.quadraticCurveTo(cx + 170, 420, cx + 110, 636); c.lineTo(cx - 110, 636); c.quadraticCurveTo(cx - 170, 420, cx - 200, 170); c.closePath();
  const tg = c.createLinearGradient(cx - 200, 0, cx + 200, 0); tg.addColorStop(0, '#5a3aa0'); tg.addColorStop(0.5, '#a88ae8'); tg.addColorStop(1, '#5a3aa0');
  c.fillStyle = tg; c.fill(); c.lineWidth = 4; c.strokeStyle = OUT; c.stroke();
  // the pecs and the abs
  c.lineWidth = 3; c.strokeStyle = '#3a2470';
  for (const s of [-1, 1]) { c.beginPath(); c.moveTo(cx, 190); c.quadraticCurveTo(cx + s * 90, 170, cx + s * 150, 230); c.stroke(); }
  for (const y of [330, 400, 470]) { c.beginPath(); c.moveTo(cx - 50, y); c.quadraticCurveTo(cx, y + 14, cx + 50, y); c.stroke(); }
  c.beginPath(); c.moveTo(cx, 260); c.lineTo(cx, 560); c.stroke();
  // black tiger stripes across the body
  for (const s of [-1, 1]) for (const [y, len, a] of [[240, 90, 0.2], [300, 110, 0.1], [380, 100, 0.25], [460, 80, 0.15]] as const) stripe(c, cx + s * 170, y, len, s < 0 ? a : Math.PI - a, 12);
  // the left arm hanging, its black fist
  c.beginPath(); c.moveTo(cx - 200, 180); c.quadraticCurveTo(cx - 280, 320, cx - 250, 470); c.lineTo(cx - 180, 470); c.quadraticCurveTo(cx - 200, 320, cx - 150, 220); c.closePath();
  c.fillStyle = '#7a5ac0'; c.fill(); c.lineWidth = 4; c.strokeStyle = OUT; c.stroke();
  stripe(c, cx - 250, 330, 60, 0.3, 10);
  c.beginPath(); c.ellipse(cx - 215, 510, 62, 56, 0, 0, Math.PI * 2); c.fillStyle = '#1a1424'; c.fill(); c.stroke();
  // the right shoulder (the punching arm is its own sprite)
  c.beginPath(); c.ellipse(cx + 190, 200, 70, 56, -0.3, 0, Math.PI * 2); c.fillStyle = '#8a6ad0'; c.fill(); c.stroke();
}

/** the punching fist: a huge black fist with red studs, seen from the knuckles; 300×280, the wrist at (150, 270) */
function drawFist(c: CanvasRenderingContext2D) {
  c.lineJoin = 'round';
  c.beginPath(); c.moveTo(80, 276); c.lineTo(80, 200); c.lineTo(220, 200); c.lineTo(220, 276); c.closePath(); c.fillStyle = '#7a5ac0'; c.fill(); c.lineWidth = 4; c.strokeStyle = OUT; c.stroke();
  c.beginPath(); c.moveTo(30, 200); c.quadraticCurveTo(10, 90, 60, 40); c.quadraticCurveTo(150, 0, 240, 40); c.quadraticCurveTo(290, 90, 270, 200); c.closePath();
  const g = c.createRadialGradient(130, 80, 10, 150, 120, 160); g.addColorStop(0, '#4a4058'); g.addColorStop(1, '#0c0a12'); c.fillStyle = g; c.fill(); c.lineWidth = 5; c.strokeStyle = OUT; c.stroke();
  c.lineWidth = 3; c.strokeStyle = '#3a3048';
  for (const x of [90, 150, 210]) { c.beginPath(); c.moveTo(x, 40); c.quadraticCurveTo(x + 6, 100, x, 160); c.stroke(); }
  c.fillStyle = '#d02a1a';
  for (const x of [70, 120, 180, 230]) { c.beginPath(); c.moveTo(x - 10, 60); c.lineTo(x, 34); c.lineTo(x + 10, 60); c.closePath(); c.fill(); c.lineWidth = 2; c.strokeStyle = OUT; c.stroke(); }
}

const headTex = (scene: S) => canvasTex(scene, 'demogorgo-head', 380, 360, (c) => drawHead(c));
const bodyTex = (scene: S) => canvasTex(scene, 'demogorgo-body', 1000, 640, (c) => drawBody(c));
const fistTex = (scene: S) => canvasTex(scene, 'demogorgo-fist', 300, 280, (c) => drawFist(c));

export interface DemonClearHooks {
  /** the fist lands on (x, y): punch away the shots and rivals within r; returns where each one was, to draw its streak */
  punch: (x: number, y: number, r: number) => { x: number; y: number }[];
}
/** times of the scene, ms */
export const DEMOGORGO_MS = { burst: 0, rise: 300, slash: 950, comet: 1150, punch: 1650, total: 3100 };
/** the reach of the blow, by level */
export const demonClearSize = (level: number) => ({ r: 120 + level * 10 });

/** Despeje demoníaco. (x, y) the keeper's feet, (tx, ty) where the fist lands. */
export function demonClear(scene: S, x: number, y: number, tx: number, ty: number, level: number, hooks: DemonClearHooks) {
  const cam = scene.cameras.main, view = () => cam.worldView;
  const live: Phaser.GameObjects.GameObject[] = [];
  const keep = <T extends Phaser.GameObjects.GameObject>(o: T) => { live.push(o); return o; };
  const dim = keep(scene.add.rectangle(view().centerX, view().centerY, view().width * 2, view().height * 2, 0x12061e, 1).setDepth(D.dim).setAlpha(0));
  scene.tweens.add({ targets: dim, alpha: 0.6, duration: 240 });
  // ---- the green burst round the keeper's raised fist
  const burst = keep(scene.add.graphics().setDepth(D.vortex).setBlendMode(Phaser.BlendModes.ADD));
  const t0 = scene.time.now;
  // ---- Demogorgo rises behind the keeper, wings spread
  const H = 1000, gs = (view().height * 0.78) / H, wy = Math.max(y + 10, view().top + H * gs + 4);
  const spirit = keep(scene.add.container(x, wy).setDepth(D.giant).setScale(gs * 0.3).setAlpha(0));
  const body = scene.add.image(0, 0, bodyTex(scene)).setOrigin(0.5, 1);
  const head = scene.add.image(0, -500, headTex(scene)).setOrigin(0.5, 320 / 360);
  // the punching fist hangs from the right shoulder, raised (it is part of him, so it scales and glows with him)
  const FIST = { x: 230, y: -420 };
  const fist = scene.add.image(FIST.x, FIST.y, fistTex(scene)).setOrigin(0.5, 270 / 280).setAngle(10).setScale(1.2);
  spirit.add([body, head, fist]);
  try { spirit.postFX?.addGlow(VIOLET, 3, 0, false, 0.1, 10); } catch { /* canvas renderer: no glow */ }
  scene.tweens.add({ targets: spirit, alpha: 1, scaleX: gs, scaleY: gs, delay: DEMOGORGO_MS.rise, duration: 480, ease: 'Back.easeOut' });
  const slash = keep(scene.add.graphics().setDepth(D.fx).setBlendMode(Phaser.BlendModes.ADD));
  const comet = keep(scene.add.graphics().setDepth(D.fx).setBlendMode(Phaser.BlendModes.ADD));
  let cometU = -1, slashU = -1;
  const tick = () => {
    if (!spirit.active) { scene.events.off('update', tick); return; }
    const ms = scene.time.now - t0, t = ms / 1000, v = view();
    dim.setPosition(v.centerX, v.centerY);
    head.setAngle(Math.sin(t * 3) * 2);
    burst.clear();
    if (ms < 900) { // green rays bursting out of the keeper
      const u = ms / 900, a = 1 - u;
      burst.fillStyle(GREEN, 0.4 * a).fillCircle(x, y - 14, 30 + u * 70);
      burst.fillStyle(GREEN2, 0.7 * a).fillCircle(x, y - 14, 12 + u * 20);
      for (let n = 0; n < 22; n++) { const an = n / 22 * Math.PI * 2 + n * 0.4, r0 = 20 + u * 40, r1 = r0 + 60 + (n % 3) * 30; burst.lineStyle(n % 2 ? 3 : 5, n % 3 ? GREEN : GREEN2, 0.7 * a).lineBetween(x + Math.cos(an) * r0, y - 14 + Math.sin(an) * r0, x + Math.cos(an) * r1, y - 14 + Math.sin(an) * r1); }
    }
    slash.clear();
    if (slashU >= 0 && slashU <= 1) { // a violet slash sweeping the air in front of him
      const a = 1 - slashU, cx = (x + tx) / 2, cy = (y + ty) / 2 - 30, R = 150;
      for (let k = 0; k < 4; k++) slash.lineStyle(22 - k * 5, k % 2 ? VIOLET2 : VIOLET, 0.7 * a).beginPath().arc(cx, cy, R - k * 8, Math.PI * 1.05, Math.PI * (1.05 + slashU * 0.9)).strokePath();
    }
    comet.clear();
    if (cometU >= 0 && cometU <= 1) { // the ball coming in as a golden comet
      const sx = tx + 260, sy = ty - 140, bx = sx + (tx - sx) * cometU, by = sy + (ty - sy) * cometU;
      for (let k = 0; k < 8; k++) comet.fillStyle(k % 2 ? GOLD : GOLD2, 0.5 - k * 0.05).fillCircle(bx + (sx - tx) * 0.04 * k, by + (sy - ty) * 0.04 * k, 10 - k);
      comet.fillStyle(0xffffff, 1).fillCircle(bx, by, 6);
    }
  };
  scene.events.on('update', tick);
  scene.time.delayedCall(DEMOGORGO_MS.slash, () => scene.tweens.addCounter({ from: 0, to: 1, duration: 360, onUpdate: (tw) => { slashU = tw.getValue() ?? 0; }, onComplete: () => { slashU = -1; } }));
  scene.time.delayedCall(DEMOGORGO_MS.comet, () => scene.tweens.addCounter({ from: 0, to: 1, duration: DEMOGORGO_MS.punch - DEMOGORGO_MS.comet, ease: 'Quad.easeIn', onUpdate: (tw) => { cometU = tw.getValue() ?? 0; }, onComplete: () => { cometU = -1; } }));
  // the fist winds back, then swings down onto the crowd
  scene.time.delayedCall(DEMOGORGO_MS.punch - 300, () => {
    if (!spirit.active) return;
    // the blow's point in his own frame (the fist is inside the container)
    const lx = (tx - spirit.x) / spirit.scaleX, ly = (ty + 30 - spirit.y) / spirit.scaleY;
    scene.tweens.add({ targets: fist, x: FIST.x + 60, y: FIST.y - 120, angle: -25, duration: 160, ease: 'Quad.easeOut', onComplete: () => {
      scene.tweens.add({ targets: fist, x: lx, y: ly, angle: 30, scale: 1.6, duration: 140, ease: 'Quad.easeIn' });
    } });
  });
  scene.time.delayedCall(DEMOGORGO_MS.punch, () => {
    if (!spirit.active) return;
    cam.shake(320, 0.014); // no full-screen flash: the golden flash is drawn at the blow
    const { r } = demonClearSize(level);
    const flown = hooks.punch(tx, ty, r);
    // a golden flash, then a violet whirl with yellow lightning
    const boom = keep(scene.add.graphics().setDepth(D.fx).setBlendMode(Phaser.BlendModes.ADD));
    const b0 = scene.time.now;
    const draw = () => {
      if (!boom.active) { scene.events.off('update', draw); return; }
      const u = Math.min(1, (scene.time.now - b0) / 900), a = 1 - u, t = (scene.time.now - b0) / 1000;
      boom.clear();
      if (u < 0.35) { const q = u / 0.35; boom.fillStyle(GOLD, 0.8 * (1 - q)).fillCircle(tx, ty, 20 + q * r * 0.6); boom.fillStyle(GOLD2, 0.9 * (1 - q)).fillCircle(tx, ty, 12 + q * 24); boom.lineStyle(5, GOLD, 1 - q).strokeCircle(tx, ty, 26 + q * r * 0.8); }
      for (let k = 0; k < 4; k++) { const a0 = t * 7 + k * 1.57; boom.lineStyle(14 - k * 2, k % 2 ? VIOLET2 : VIOLET, 0.6 * a).beginPath().arc(tx, ty, r * (0.25 + u * 0.55) + k * 6, a0, a0 + 2.4).strokePath(); }
      const seed = Math.floor(t * 12);
      for (let k = 0; k < 4; k++) { const an = seed * 1.7 + k * 1.57; bolt(boom, tx, ty, tx + Math.cos(an) * r * 0.9, ty + Math.sin(an) * r * 0.6, seed + k, 3, GOLD, 0x8a5a00, a, 6); }
    };
    scene.events.on('update', draw);
    scene.time.delayedCall(900, () => { scene.events.off('update', draw); boom.destroy(); });
    // everything punched flies away as a violet-and-red streak and vanishes with a twinkle
    for (const q of flown.slice(0, 14)) {
      const an = Math.atan2(q.y - ty, q.x - tx) + rnd(-0.3, 0.3), d = rnd(220, 320), ex = q.x + Math.cos(an) * d, ey = q.y + Math.sin(an) * d - 60;
      const streak = scene.add.graphics().setDepth(D.fx).setBlendMode(Phaser.BlendModes.ADD);
      scene.tweens.addCounter({ from: 0, to: 1, duration: 520, ease: 'Quad.easeOut', onUpdate: (tw) => {
        const u = tw.getValue() ?? 0, hx = q.x + (ex - q.x) * u, hy = q.y + (ey - q.y) * u, bx = q.x + (ex - q.x) * Math.max(0, u - 0.35), by = q.y + (ey - q.y) * Math.max(0, u - 0.35);
        streak.clear().lineStyle(9, VIOLET, 0.8).lineBetween(bx, by, hx, hy).lineStyle(3, RED, 0.9).lineBetween(bx, by, hx, hy).fillStyle(0xffffff, 1).fillCircle(hx, hy, 3);
      }, onComplete: () => {
        streak.destroy();
        const star = scene.add.star(ex, ey, 4, 2, 9, 0xffffff, 1).setDepth(D.fx).setBlendMode(Phaser.BlendModes.ADD);
        scene.tweens.add({ targets: star, scale: 1.8, angle: 90, alpha: 0, duration: 380, onComplete: () => star.destroy() });
      } });
    }
    scene.time.delayedCall(260, () => { if (spirit.active) { scene.tweens.add({ targets: spirit, alpha: 0, duration: 600, ease: 'Cubic.easeIn' }); } });
  });
  const end = DEMOGORGO_MS.total;
  scene.time.delayedCall(end - 420, () => { for (const o of live) if (o !== dim && o.active) fade(scene, o, 0, 400); });
  scene.tweens.add({ targets: dim, alpha: 0, delay: end - 400, duration: 380, onComplete: () => dim.destroy() });
  scene.time.delayedCall(end, () => scene.events.off('update', tick));
}
