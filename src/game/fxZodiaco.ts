/**
 * Prisión escarlata (author, from its scene in GO Chrono Stones, ka22Gu6PVwo 3:05-3:14): the pitch turns to a purple void
 * cut by speed lines; Príncipe del plano astral, Zodíaco, looms behind the shooter — black armour with red plates, two
 * long horns swept back from a horned crown, a green gem on the brow, burning yellow eyes, fangs, wide black wings lined
 * in red and red claws. The shooter crosses his arms, everything flushes red; the spirit raises his claw and a red orb
 * gathers over it; a white flash, and the ball is locked inside a red crystal that turns and cracks with red lightning.
 * Red tendrils run out ahead, the shot leaves, and the crystal bursts into red shards.
 * Here: the crystal flies to the thickest crowd; on landing it locks every rival round it in a red crystal of its own
 * (bosses are only slowed), red lightning ties the prisons together, and they all shatter at once.
 */
import Phaser from 'phaser';
import { canvasTex, D, fade, rnd } from './fxKeshin';

type S = Phaser.Scene;
const RED = 0xff1a3a, RED2 = 0xff8a9a;
const OUT = '#120610';

/** the head: horned crown, the two swept-back horns, green gem, yellow eyes and fangs; 360×320, the chin at (180, 290) */
function drawHead(c: CanvasRenderingContext2D) {
  const cx = 180;
  c.lineJoin = 'round'; c.lineCap = 'round';
  const black = (y0: number, y1: number) => { const g = c.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, '#4a4a5a'); g.addColorStop(1, '#0a0a12'); return g; };
  // the two long horns, swept back and out, red underneath
  for (const s of [-1, 1]) {
    c.beginPath(); c.moveTo(cx + s * 40, 120); c.bezierCurveTo(cx + s * 110, 60, cx + s * 150, 20, cx + s * 176, 4);
    c.bezierCurveTo(cx + s * 150, 50, cx + s * 120, 110, cx + s * 70, 156); c.closePath();
    c.fillStyle = black(0, 160); c.fill(); c.lineWidth = 4; c.strokeStyle = OUT; c.stroke();
    c.beginPath(); c.moveTo(cx + s * 60, 140); c.bezierCurveTo(cx + s * 110, 100, cx + s * 140, 50, cx + s * 168, 12); c.lineWidth = 5; c.strokeStyle = '#d0102a'; c.stroke();
  }
  // the helmet: a black mask narrowing to the jaw, a spiked crest up the middle
  c.beginPath(); c.moveTo(cx - 70, 110); c.lineTo(cx - 30, 30); c.lineTo(cx, 0); c.lineTo(cx + 30, 30); c.lineTo(cx + 70, 110);
  c.lineTo(cx + 62, 200); c.lineTo(cx + 30, 270); c.lineTo(cx, 292); c.lineTo(cx - 30, 270); c.lineTo(cx - 62, 200); c.closePath();
  c.fillStyle = black(0, 290); c.fill(); c.lineWidth = 4; c.strokeStyle = OUT; c.stroke();
  // the face inside: pale violet, fangs
  c.beginPath(); c.moveTo(cx - 42, 150); c.lineTo(cx + 42, 150); c.lineTo(cx + 34, 230); c.lineTo(cx, 268); c.lineTo(cx - 34, 230); c.closePath();
  const fg = c.createLinearGradient(0, 150, 0, 268); fg.addColorStop(0, '#9a8ab8'); fg.addColorStop(1, '#4a3a6a'); c.fillStyle = fg; c.fill(); c.lineWidth = 3; c.stroke();
  c.beginPath(); c.moveTo(cx - 26, 228); c.lineTo(cx + 26, 228); c.lineTo(cx + 16, 252); c.lineTo(cx - 16, 252); c.closePath(); c.fillStyle = '#2a0a1a'; c.fill(); c.stroke(); // the mouth
  c.fillStyle = '#ffffff';
  for (const s of [-1, 1]) { c.beginPath(); c.moveTo(cx + s * 18, 228); c.lineTo(cx + s * 10, 228); c.lineTo(cx + s * 14, 246); c.closePath(); c.fill(); } // the fangs
  // the burning yellow eyes, slanted
  for (const s of [-1, 1]) {
    c.beginPath(); c.moveTo(cx + s * 8, 186); c.lineTo(cx + s * 40, 168); c.lineTo(cx + s * 36, 190); c.closePath();
    c.fillStyle = '#ffe23a'; c.fill(); c.lineWidth = 2.5; c.strokeStyle = '#6a3a00'; c.stroke();
  }
  // red plates on the brow and cheeks
  c.fillStyle = '#d0102a'; c.strokeStyle = OUT; c.lineWidth = 3;
  for (const s of [-1, 1]) { c.beginPath(); c.moveTo(cx + s * 44, 120); c.lineTo(cx + s * 68, 112); c.lineTo(cx + s * 60, 180); c.lineTo(cx + s * 46, 160); c.closePath(); c.fill(); c.stroke(); }
  // the green gem
  c.beginPath(); c.moveTo(cx, 96); c.lineTo(cx + 14, 118); c.lineTo(cx, 140); c.lineTo(cx - 14, 118); c.closePath();
  const gg = c.createLinearGradient(0, 96, 0, 140); gg.addColorStop(0, '#c8ffd8'); gg.addColorStop(1, '#1a9a5a'); c.fillStyle = gg; c.fill(); c.lineWidth = 3; c.stroke();
}

/** the body and wings: black armour with red plates and claws, the wide black wings lined in red; 900×560, the neck at (450, 120) */
function drawBody(c: CanvasRenderingContext2D) {
  const cx = 450;
  c.lineJoin = 'round';
  // the wings: four long black feathers a side, red inside
  for (const s of [-1, 1]) for (let n = 0; n < 4; n++) {
    const a = -0.5 + n * 0.32, L = 400 - n * 40, bx = cx + s * 90, by = 170;
    const ex = bx + s * Math.cos(a) * L, ey = by + Math.sin(a) * L * 0.9;
    c.beginPath(); c.moveTo(bx, by - 30); c.quadraticCurveTo((bx + ex) / 2, ey - 60, ex, ey); c.quadraticCurveTo((bx + ex) / 2 + s * 10, ey + 30, bx, by + 50); c.closePath();
    const wg = c.createLinearGradient(bx, by, ex, ey); wg.addColorStop(0, '#2a0a12'); wg.addColorStop(0.5, '#0e0e16'); wg.addColorStop(1, '#3a3a4a');
    c.fillStyle = wg; c.fill(); c.lineWidth = 4; c.strokeStyle = OUT; c.stroke();
    c.beginPath(); c.moveTo(bx, by + 10); c.quadraticCurveTo((bx + ex) / 2, ey - 20, ex - s * 20, ey); c.lineWidth = 6; c.strokeStyle = '#b00a24'; c.stroke();
  }
  // the torso
  c.beginPath(); c.moveTo(cx - 90, 120); c.quadraticCurveTo(cx - 120, 330, cx - 70, 556); c.lineTo(cx + 70, 556); c.quadraticCurveTo(cx + 120, 330, cx + 90, 120); c.closePath();
  const tg = c.createLinearGradient(cx - 100, 0, cx + 100, 0); tg.addColorStop(0, '#0a0a12'); tg.addColorStop(0.5, '#3a3a4a'); tg.addColorStop(1, '#0a0a12');
  c.fillStyle = tg; c.fill(); c.lineWidth = 4; c.strokeStyle = OUT; c.stroke();
  // red chest plates in a V and the ribs
  c.fillStyle = '#c80a24';
  for (const s of [-1, 1]) { c.beginPath(); c.moveTo(cx, 170); c.lineTo(cx + s * 86, 140); c.lineTo(cx + s * 70, 230); c.lineTo(cx + s * 10, 260); c.closePath(); c.fill(); c.stroke(); }
  c.lineWidth = 3; c.strokeStyle = '#ff5a6a';
  for (const y of [300, 350, 400]) for (const s of [-1, 1]) { c.beginPath(); c.moveTo(cx + s * 8, y); c.quadraticCurveTo(cx + s * 50, y - 14, cx + s * 70, y + 10); c.stroke(); }
  // the shoulders: curved red plates like claws
  for (const s of [-1, 1]) {
    c.beginPath(); c.moveTo(cx + s * 70, 110); c.bezierCurveTo(cx + s * 160, 70, cx + s * 220, 120, cx + s * 230, 200);
    c.bezierCurveTo(cx + s * 190, 170, cx + s * 150, 170, cx + s * 110, 200); c.closePath();
    const sg = c.createLinearGradient(cx + s * 70, 80, cx + s * 230, 200); sg.addColorStop(0, '#ff3a4a'); sg.addColorStop(1, '#6a0010');
    c.fillStyle = sg; c.fill(); c.lineWidth = 4; c.strokeStyle = OUT; c.stroke();
  }
}

/** a claw: the raised red hand, three hooked talons; 200×240, the wrist at (100, 230) */
function drawClaw(c: CanvasRenderingContext2D) {
  c.lineJoin = 'round';
  c.beginPath(); c.moveTo(60, 236); c.lineTo(60, 150); c.lineTo(140, 150); c.lineTo(140, 236); c.closePath(); c.fillStyle = '#0e0e16'; c.fill(); c.lineWidth = 4; c.strokeStyle = OUT; c.stroke();
  for (const [fx, fa] of [[60, -0.45], [100, 0], [140, 0.45]] as const) {
    c.save(); c.translate(fx, 156); c.rotate(fa);
    c.beginPath(); c.moveTo(-14, 0); c.quadraticCurveTo(-16, -90, 6, -130); c.quadraticCurveTo(0, -80, 14, 0); c.closePath();
    const g = c.createLinearGradient(0, 0, 0, -130); g.addColorStop(0, '#6a0010'); g.addColorStop(1, '#ff3a4a'); c.fillStyle = g; c.fill(); c.lineWidth = 3.5; c.strokeStyle = OUT; c.stroke();
    c.restore();
  }
}

const headTex = (scene: S) => canvasTex(scene, 'zodiaco-head', 360, 320, (c) => drawHead(c));
const bodyTex = (scene: S) => canvasTex(scene, 'zodiaco-body', 900, 560, (c) => drawBody(c));
const clawTex = (scene: S) => canvasTex(scene, 'zodiaco-claw', 200, 240, (c) => drawClaw(c));

/** a red crystal round (x, y), turning; returns the graphics to redraw it each frame */
function crystal(g: Phaser.GameObjects.Graphics, x: number, y: number, r: number, t: number, alpha = 1) {
  const pts = (k: number, rr: number) => Array.from({ length: 6 }, (_, n) => {
    const a = t * k + n / 6 * Math.PI * 2;
    return { x: x + Math.cos(a) * rr, y: y + Math.sin(a) * rr * 1.25 };
  });
  const outer = pts(1.4, r), inner = pts(-2, r * 0.55);
  g.fillStyle(0xb00a24, 0.5 * alpha).fillPoints(outer, true).lineStyle(3, RED, alpha).strokePoints(outer, true);
  g.fillStyle(0xff3a4a, 0.45 * alpha).fillPoints(inner, true).lineStyle(2, RED2, alpha).strokePoints(inner, true);
  for (let n = 0; n < 6; n++) g.lineStyle(2, RED2, 0.7 * alpha).lineBetween(outer[n].x, outer[n].y, inner[n].x, inner[n].y);
  // red lightning cracks inside: steady for a tenth of a second at a time (random every frame only flickered)
  const seed = Math.floor(t * 10), h = (n: number) => Math.sin(seed * 12.9898 + n * 78.233 + x * 0.1) * 43758.5453 % 1;
  for (let k = 0; k < 2; k++) {
    g.lineStyle(1.5, 0xffc8d0, 0.85 * alpha).beginPath();
    let px = x, py = y; g.moveTo(px, py);
    for (let n = 0; n < 3; n++) { px += h(k * 7 + n) * r * 0.35; py += h(k * 7 + n + 3) * r * 0.35; g.lineTo(px, py); }
    g.strokePath();
  }
}

export interface PrisonHooks {
  /** the crystal lands on (x, y): the rivals within r get locked; returns them (x, y on screen, shatter() deals the blow) */
  lock: (x: number, y: number, r: number) => { x: number; y: number; shatter: () => void }[];
}
/** times of the scene, ms */
export const PRISON_MS = { rise: 280, cross: 950, orb: 1250, flash: 1750, land: 2150, shatter: 2950, total: 3500 };
/** the reach of the prison, by level */
export const prisonSize = (level: number) => ({ r: 140 + level * 12 });

/** Prisión escarlata. (x, y) the shooter's feet, (tx, ty) the crowd. Visual only: the scene deals the damage in the hooks. */
export function scarletPrison(scene: S, x: number, y: number, tx: number, ty: number, level: number, hooks: PrisonHooks) {
  const cam = scene.cameras.main, view = () => cam.worldView;
  const live: Phaser.GameObjects.GameObject[] = [];
  const keep = <T extends Phaser.GameObjects.GameObject>(o: T) => { live.push(o); return o; };
  const dim = keep(scene.add.rectangle(view().centerX, view().centerY, view().width * 2, view().height * 2, 0x14062a, 1).setDepth(D.dim).setAlpha(0));
  scene.tweens.add({ targets: dim, alpha: 0.7, duration: 240 });
  const lines = keep(scene.add.graphics().setDepth(D.vortex).setBlendMode(Phaser.BlendModes.ADD)); // the speed lines
  // ---- Zodíaco looms behind the shooter, wings wide
  const H = 900, gs = (view().height * 0.8) / H, wx = x, wy = Math.max(y + 10, view().top + H * gs + 4);
  const spirit = keep(scene.add.container(wx, wy).setDepth(D.giant).setScale(gs * 0.3).setAlpha(0));
  const body = scene.add.image(0, 0, bodyTex(scene)).setOrigin(0.5, 1);
  const head = scene.add.image(0, -455, headTex(scene)).setOrigin(0.5, 290 / 320); // high enough that the shooter doesn't hide the face
  const claw = scene.add.image(250, -340, clawTex(scene)).setOrigin(0.5, 230 / 240).setAngle(30);
  spirit.add([body, claw, head]);
  try { spirit.postFX?.addGlow(RED, 3, 0, false, 0.1, 10); } catch { /* canvas renderer: no glow */ }
  scene.tweens.add({ targets: spirit, alpha: 1, scaleX: gs, scaleY: gs, delay: PRISON_MS.rise, duration: 480, ease: 'Back.easeOut' });
  const redWash = keep(scene.add.rectangle(view().centerX, view().centerY, view().width * 2, view().height * 2, 0xd0102a, 1).setDepth(D.dim + 1).setAlpha(0).setBlendMode(Phaser.BlendModes.ADD));
  const orbG = keep(scene.add.graphics().setDepth(D.fx).setBlendMode(Phaser.BlendModes.ADD));
  const ball = keep(scene.add.image(0, 0, 'fx:ball').setDepth(D.fx + 1).setAlpha(0));
  let orbR = 0, orbX = 0, orbY = 0, flying = false;
  const t0 = scene.time.now;
  const tick = () => {
    if (!spirit.active) { scene.events.off('update', tick); return; }
    const t = (scene.time.now - t0) / 1000, v = view();
    dim.setPosition(v.centerX, v.centerY); redWash.setPosition(v.centerX, v.centerY);
    head.setAngle(Math.sin(t * 2) * 2);
    lines.clear();
    for (let n = 0; n < 26; n++) { // white and violet speed lines rushing in to the middle
      const a = n / 26 * Math.PI * 2 + n * 0.37, r0 = Math.max(v.width, v.height) * 0.75, r1 = r0 * (0.35 + ((t * 2.6 + n * 0.13) % 1) * 0.4);
      const cxv = v.centerX, cyv = v.centerY;
      lines.lineStyle(n % 3 ? 3 : 6, n % 2 ? 0xffffff : 0xb08aff, 0.28).lineBetween(cxv + Math.cos(a) * r0, cyv + Math.sin(a) * r0, cxv + Math.cos(a) * r1, cyv + Math.sin(a) * r1);
    }
    orbG.clear();
    if (orbR > 1) {
      if (!flying) { const sc = spirit.scaleX; orbX = spirit.x + 250 * sc; orbY = spirit.y - 620 * sc; }
      if (flying || scene.time.now - t0 > PRISON_MS.flash) crystal(orbG, orbX, orbY, orbR, t);
      else { // the red orb gathering over the claw
        orbG.fillStyle(RED, 0.35).fillCircle(orbX, orbY, orbR * 1.5).fillStyle(0xff5a6a, 0.8).fillCircle(orbX, orbY, orbR).fillStyle(0xffffff, 0.9).fillCircle(orbX, orbY, orbR * 0.35);
      }
      ball.setPosition(orbX, orbY).setAngle(t * 300);
    }
  };
  scene.events.on('update', tick);
  // the shooter crosses his arms: everything flushes red
  scene.time.delayedCall(PRISON_MS.cross, () => {
    scene.tweens.add({ targets: redWash, alpha: 0.35, duration: 160, yoyo: true, hold: 120 });
    cam.shake(200, 0.006);
  });
  // he raises the claw and the orb gathers over it
  scene.time.delayedCall(PRISON_MS.orb - 260, () => { if (spirit.active) scene.tweens.add({ targets: claw, angle: -8, y: -420, duration: 260, ease: 'Back.easeOut' }); });
  scene.time.delayedCall(PRISON_MS.orb, () => {
    if (!spirit.active) return;
    scene.tweens.addCounter({ from: 0, to: 1, duration: PRISON_MS.flash - PRISON_MS.orb, ease: 'Quad.easeOut', onUpdate: (tw) => { orbR = 8 + (tw.getValue() ?? 0) * 26; } });
    const flow = scene.time.addEvent({ delay: 40, repeat: Math.floor((PRISON_MS.flash - PRISON_MS.orb) / 40), callback: () => {
      const a = rnd(0, Math.PI * 2), d = rnd(60, 110), sp = scene.add.circle(orbX + Math.cos(a) * d, orbY + Math.sin(a) * d, rnd(2, 4), Math.random() < 0.5 ? RED : RED2, 1).setDepth(D.fx).setBlendMode(Phaser.BlendModes.ADD);
      scene.tweens.add({ targets: sp, x: orbX, y: orbY, alpha: 0.2, duration: 220, ease: 'Quad.easeIn', onComplete: () => sp.destroy() });
    } });
    scene.time.delayedCall(PRISON_MS.flash - PRISON_MS.orb, () => flow.remove());
  });
  // white flash: the ball is locked in the red crystal and flies off, red tendrils running ahead of it
  scene.time.delayedCall(PRISON_MS.flash, () => {
    if (!spirit.active) return;
    cam.flash(160, 255, 255, 255);
    ball.setAlpha(1); orbR = 30;
    flying = true;
    const sx = orbX, sy = orbY, dur = PRISON_MS.land - PRISON_MS.flash;
    const tendrils = keep(scene.add.graphics().setDepth(D.fx - 1).setBlendMode(Phaser.BlendModes.ADD));
    scene.tweens.addCounter({ from: 0, to: 1, duration: dur, ease: 'Quad.easeIn', onUpdate: (tw) => {
      const u = tw.getValue() ?? 0;
      orbX = sx + (tx - sx) * u; orbY = sy + (ty - sy) * u;
      tendrils.clear();
      for (let n = 0; n < 5; n++) { // red lightning tendrils reaching out from the crystal toward the target
        tendrils.lineStyle(n % 2 ? 3 : 5, n % 2 ? RED2 : RED, 0.7).beginPath(); tendrils.moveTo(orbX, orbY);
        let px = orbX, py = orbY;
        for (let k = 1; k <= 6; k++) { const w = k / 6; px = orbX + (tx - orbX) * w * 0.9 + rnd(-30, 30); py = orbY + (ty - orbY) * w * 0.9 + rnd(-30, 30); tendrils.lineTo(px, py); }
        tendrils.strokePath();
      }
    }, onComplete: () => {
      tendrils.destroy();
      flying = false; orbR = 0; ball.setAlpha(0);
      cam.shake(300, 0.012);
      const { r } = prisonSize(level);
      const locked = hooks.lock(tx, ty, r);
      // the landing: a red ring, and every rival round it in a crystal of its own, lightning tying them to the middle
      const ring = scene.add.ellipse(tx, ty, r * 0.4, r * 0.24).setStrokeStyle(6, RED, 1).setDepth(D.fx - 1);
      scene.tweens.add({ targets: ring, scale: 5, alpha: 0, duration: 520, ease: 'Cubic.easeOut', onComplete: () => ring.destroy() });
      const cages = scene.add.graphics().setDepth(D.fx).setBlendMode(Phaser.BlendModes.ADD);
      const c0 = scene.time.now;
      const draw = () => {
        if (!cages.active) { scene.events.off('update', draw); return; }
        const t = (scene.time.now - c0) / 1000, grow = Math.min(1, t * 5);
        cages.clear();
        crystal(cages, tx, ty, 34 * grow, t);
        for (const q of locked) {
          crystal(cages, q.x, q.y - 4, 24 * grow, t + q.x);
          cages.lineStyle(2, RED2, 0.6).beginPath().moveTo(tx, ty);
          for (let k = 1; k <= 4; k++) cages.lineTo(tx + (q.x - tx) * k / 4 + rnd(-10, 10), ty + (q.y - ty) * k / 4 + rnd(-10, 10));
          cages.strokePath();
        }
      };
      scene.events.on('update', draw);
      // they all shatter at once: red shards everywhere
      scene.time.delayedCall(PRISON_MS.shatter - PRISON_MS.land, () => {
        scene.events.off('update', draw); cages.destroy();
        cam.flash(140, 255, 60, 80); cam.shake(320, 0.014);
        for (const q of [{ x: tx, y: ty, shatter: () => undefined }, ...locked]) {
          q.shatter();
          for (let n = 0; n < 7; n++) {
            const a = rnd(0, Math.PI * 2), sh = scene.add.triangle(q.x, q.y, 0, 0, rnd(6, 12), rnd(2, 5), rnd(2, 6), rnd(10, 18), Math.random() < 0.5 ? RED : 0xb00a24, 1).setDepth(D.fx).setBlendMode(Phaser.BlendModes.ADD);
            scene.tweens.add({ targets: sh, x: q.x + Math.cos(a) * rnd(40, 90), y: q.y + Math.sin(a) * rnd(30, 70), angle: rnd(-360, 360), alpha: 0, duration: rnd(380, 560), onComplete: () => sh.destroy() });
          }
        }
      });
    } });
    scene.time.delayedCall(320, () => { if (spirit.active) scene.tweens.add({ targets: spirit, alpha: 0, y: spirit.y - 24, duration: 600, ease: 'Cubic.easeIn' }); });
  });
  const end = PRISON_MS.total;
  scene.time.delayedCall(end - 420, () => { for (const o of live) if (o !== dim && o.active) fade(scene, o, 0, 400); });
  scene.tweens.add({ targets: dim, alpha: 0, delay: end - 400, duration: 380, onComplete: () => dim.destroy() });
  scene.time.delayedCall(end, () => scene.events.off('update', tick));
}
