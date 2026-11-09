/**
 * Rayo demoníaco (author, from its scene in Chrono Stones, 6624VyiTekU 3:18; inazuma.fandom «Portador del sol nocturno,
 * Glenr»: a mountain spirit, «su luz inundará tus movimientos más oscuros»). Sand and boulders rise round the player in a
 * burst of golden light; Glenr unfolds behind him (a pale demon: white hair swept up into horns, a red mask over the eyes,
 * pale blue-grey skin, a dark V of armour on the chest with red under it and a violet gem, huge slate-blue bat wings edged
 * in red). The light goes out into a dark red night: he lifts one hand, a sphere of cyan lightning gathers in his palm and
 * he hurls it at the rival; it bursts there and the lightning leaps to the rivals around.
 */
import Phaser from 'phaser';
import { canvasTex, D, fade, rnd } from './fxKeshin';
import { bolt } from './fxMovie';

type S = Phaser.Scene;
const CYAN = 0x4af0ff, CYAN2 = 0xd8ffff, EDGE = 0x1a6aa8, GOLD = 0xffd23a;
const OUT = '#0c0c18', SKIN = '#c8d0dc', SKIN2 = '#98a4b8', WING = '#3a4a62', WING2 = '#56688a', RED = '#c81e2e', HAIR = '#f2eee6';

/** the head: white hair swept up into horns and spikes, the pale face with the red mask over the eyes, a thin grin;
 *  240×260, the chin at (120, 250) */
function drawHead(c: CanvasRenderingContext2D) {
  const cx = 120;
  c.lineJoin = 'round'; c.lineCap = 'round';
  // the hair: spikes swept up and out, two long horn-locks rising from the crown
  for (const s of [-1, 1]) {
    c.beginPath(); c.moveTo(cx + s * 18, 110); c.quadraticCurveTo(cx + s * 30, 40, cx + s * 14, 2); c.quadraticCurveTo(cx + s * 50, 50, cx + s * 40, 120); c.closePath();
    c.fillStyle = HAIR; c.fill(); c.lineWidth = 3.5; c.strokeStyle = OUT; c.stroke();
    for (const [a, L] of [[-0.6, 96], [-0.15, 104], [0.3, 92], [0.75, 80]]) {
      const an = -Math.PI / 2 + s * (0.9 + a);
      c.beginPath(); c.moveTo(cx + s * 30, 130); c.lineTo(cx + s * 30 + Math.cos(an) * L * 0.5 + s * 6, 130 + Math.sin(an) * L * 0.5); c.lineTo(cx + s * 30 + Math.cos(an) * L, 130 + Math.sin(an) * L);
      c.lineTo(cx + s * 30 + Math.cos(an) * L * 0.5 - s * 6, 136 + Math.sin(an) * L * 0.5); c.closePath();
      c.fillStyle = HAIR; c.fill(); c.lineWidth = 3; c.stroke();
    }
  }
  // the face: long and narrow, down to a pointed chin
  c.beginPath(); c.moveTo(cx - 40, 120); c.quadraticCurveTo(cx, 100, cx + 40, 120); c.quadraticCurveTo(cx + 44, 200, cx, 250); c.quadraticCurveTo(cx - 44, 200, cx - 40, 120); c.closePath();
  const fg = c.createLinearGradient(0, 100, 0, 250); fg.addColorStop(0, SKIN); fg.addColorStop(1, SKIN2);
  c.fillStyle = fg; c.fill(); c.lineWidth = 4; c.strokeStyle = OUT; c.stroke();
  // the red mask across the eyes, with slit white eyes inside
  c.beginPath(); c.moveTo(cx - 44, 146); c.lineTo(cx, 158); c.lineTo(cx + 44, 146); c.lineTo(cx + 38, 176); c.lineTo(cx, 186); c.lineTo(cx - 38, 176); c.closePath();
  c.fillStyle = RED; c.fill(); c.lineWidth = 3; c.stroke();
  c.fillStyle = '#ffffff'; for (const s of [-1, 1]) { c.beginPath(); c.moveTo(cx + s * 8, 172); c.lineTo(cx + s * 32, 160); c.lineTo(cx + s * 28, 170); c.closePath(); c.fill(); }
  // the violet gem on the brow, a thin cruel grin
  c.beginPath(); c.moveTo(cx, 118); c.lineTo(cx + 7, 130); c.lineTo(cx, 142); c.lineTo(cx - 7, 130); c.closePath(); c.fillStyle = '#9a4ae8'; c.fill(); c.lineWidth = 2; c.stroke();
  c.beginPath(); c.moveTo(cx - 18, 214); c.quadraticCurveTo(cx, 224, cx + 18, 214); c.lineWidth = 3; c.stroke();
  c.fillStyle = '#ffffff'; for (const s of [-1, 1]) { c.beginPath(); c.moveTo(cx + s * 10, 216); c.lineTo(cx + s * 6, 228); c.lineTo(cx + s * 4, 218); c.closePath(); c.fill(); }
}
/** the body: the huge bat wings behind (slate blue, red edges, ribs ending in claws), the pale torso with the dark V of
 *  armour, red under it and the violet gem; 560×340, the waist at (280, 336) */
function drawBody(c: CanvasRenderingContext2D) {
  const cx = 280;
  c.lineJoin = 'round';
  for (const s of [-1, 1]) {
    // the wing: from the shoulder up to a high tip, then scalloped down to the waist
    const pts: [number, number][] = [[cx + s * 50, 70], [cx + s * 150, 4], [cx + s * 270, 30], [cx + s * 230, 110], [cx + s * 260, 170], [cx + s * 190, 190], [cx + s * 210, 270], [cx + s * 120, 250], [cx + s * 60, 300]];
    c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); for (const [px, py] of pts.slice(1)) c.lineTo(px, py); c.closePath();
    const wg = c.createLinearGradient(cx, 0, cx + s * 270, 0); wg.addColorStop(0, WING); wg.addColorStop(1, WING2);
    c.fillStyle = wg; c.fill(); c.lineWidth = 6; c.strokeStyle = RED; c.stroke(); c.lineWidth = 2.5; c.strokeStyle = OUT; c.stroke();
    c.lineWidth = 3; c.strokeStyle = '#22304a';
    for (const [px, py] of pts.slice(2, 8)) { c.beginPath(); c.moveTo(cx + s * 60, 80); c.lineTo(px, py); c.stroke(); } // the ribs
  }
  // the pale torso
  c.beginPath(); c.moveTo(cx - 70, 60); c.quadraticCurveTo(cx, 40, cx + 70, 60); c.quadraticCurveTo(cx + 80, 200, cx + 40, 336); c.lineTo(cx - 40, 336); c.quadraticCurveTo(cx - 80, 200, cx - 70, 60); c.closePath();
  c.fillStyle = SKIN; c.fill(); c.lineWidth = 4; c.strokeStyle = OUT; c.stroke();
  // red under the armour, then the dark V of armour with spikes, the violet gem at its heart
  c.beginPath(); c.moveTo(cx - 40, 120); c.lineTo(cx + 40, 120); c.lineTo(cx + 20, 300); c.lineTo(cx - 20, 300); c.closePath(); c.fillStyle = RED; c.fill(); c.lineWidth = 3; c.stroke();
  c.beginPath(); c.moveTo(cx - 76, 64); c.lineTo(cx - 20, 70); c.lineTo(cx, 110); c.lineTo(cx + 20, 70); c.lineTo(cx + 76, 64); c.lineTo(cx + 60, 140); c.lineTo(cx + 40, 120); c.lineTo(cx + 28, 170);
  c.lineTo(cx, 140); c.lineTo(cx - 28, 170); c.lineTo(cx - 40, 120); c.lineTo(cx - 60, 140); c.closePath();
  c.fillStyle = '#2a3654'; c.fill(); c.lineWidth = 3.5; c.strokeStyle = OUT; c.stroke();
  c.beginPath(); c.moveTo(cx, 82); c.lineTo(cx + 10, 96); c.lineTo(cx, 110); c.lineTo(cx - 10, 96); c.closePath(); c.fillStyle = '#9a4ae8'; c.fill(); c.lineWidth = 2; c.stroke();
}
/** an arm from the shoulder at (40, 12) on 80×220: pale, a red cuff, a clawed hand open at the end */
function drawArm(c: CanvasRenderingContext2D) {
  const sx = 40;
  c.lineJoin = 'round';
  c.beginPath(); c.moveTo(sx - 16, 12); c.quadraticCurveTo(sx - 22, 90, sx - 14, 160); c.lineTo(sx + 14, 160); c.quadraticCurveTo(sx + 22, 90, sx + 16, 12); c.closePath();
  c.fillStyle = SKIN; c.fill(); c.lineWidth = 3.5; c.strokeStyle = OUT; c.stroke();
  c.fillStyle = RED; c.fillRect(sx - 18, 146, 36, 16); c.strokeRect(sx - 18, 146, 36, 16);
  c.beginPath(); c.ellipse(sx, 178, 18, 16, 0, 0, Math.PI * 2); c.fillStyle = SKIN; c.fill(); c.stroke();
  c.fillStyle = SKIN; for (const d of [-14, -5, 5, 14]) { c.beginPath(); c.moveTo(sx + d - 4, 186); c.lineTo(sx + d * 1.4, 216); c.lineTo(sx + d + 4, 186); c.closePath(); c.fill(); c.lineWidth = 2.5; c.stroke(); }
}
const headTex = (scene: S) => canvasTex(scene, 'glenr-head', 240, 260, (c) => drawHead(c));
const bodyTex = (scene: S) => canvasTex(scene, 'glenr-body', 560, 340, (c) => drawBody(c));
const armTex = (scene: S) => canvasTex(scene, 'glenr-arm', 80, 220, (c) => drawArm(c));

export interface DemonBoltHooks {
  /** the sphere bursts at (x, y), `r` round: the scene hurts everything in it and returns where the lightning leaps to */
  onBurst: (x: number, y: number, r: number) => { x: number; y: number }[];
  at: () => { x: number; y: number };
}
export const DEMON_MS = { rise: 360, night: 1000, charge: 1150, throw: 1750, burst: 1950, total: 2800 };
export const demonR = (level: number) => 80 + level * 9;

/** Rayo demoníaco. (x, y) the player's feet, (tx, ty) the rival. Visual only: the scene deals the damage in the hooks. */
export function demonBolt(scene: S, x: number, y: number, tx: number, ty: number, level: number, hooks: DemonBoltHooks) {
  const k = 1 + level * 0.05, side = tx >= x ? 1 : -1, cam = scene.cameras.main, view = () => cam.worldView;
  const live: Phaser.GameObjects.GameObject[] = [];
  const keep = <T extends Phaser.GameObjects.GameObject>(o: T) => { live.push(o); return o; };
  // golden light and sand at first, then a dark red night
  const dim = keep(scene.add.rectangle(view().centerX, view().centerY, view().width * 2, view().height * 2, 0x3a2a08, 1).setDepth(D.dim).setAlpha(0));
  scene.tweens.add({ targets: dim, alpha: 0.55, duration: 240 });
  scene.time.delayedCall(DEMON_MS.night, () => { dim.setFillStyle(0x1a0408, 1); scene.tweens.add({ targets: dim, alpha: 0.78, duration: 200 }); });
  const light = keep(scene.add.graphics().setDepth(D.aura).setBlendMode(Phaser.BlendModes.ADD));
  for (let n = 0; n < 7; n++) scene.time.delayedCall(n * 80, () => {
    const rk = scene.add.polygon(x + rnd(-50, 50) * k, y + rnd(-4, 8), [0, 0, 14, -4, 20, 8, 12, 18, -2, 14], 0x8a6a42, 1).setStrokeStyle(2, 0x3a2410).setDepth(D.giant + 3).setScale(rnd(0.6, 1.2) * k);
    scene.tweens.add({ targets: rk, y: rk.y - rnd(80, 150) * k, angle: rnd(-200, 200), alpha: 0, duration: rnd(900, 1200), ease: 'Cubic.easeOut', onComplete: () => rk.destroy() });
  });
  // ---- Glenr, unfolding behind the player
  const H = 600, gs = (view().height * 0.62) / H, wx = x - side * 4, wy = Math.max(y + 12, view().top + H * gs + 4);
  const spirit = keep(scene.add.container(wx, wy + 30).setDepth(D.giant).setScale(gs * 0.3).setAlpha(0));
  const body = scene.add.image(0, 0, bodyTex(scene)).setOrigin(0.5, 336 / 340);
  const arms = [-1, 1].map((s) => scene.add.image(s * 66, -270, armTex(scene)).setOrigin(0.5, 12 / 220).setAngle(s * -35).setScale(1.2));
  const head = scene.add.image(0, -270, headTex(scene)).setOrigin(0.5, 250 / 260).setScale(1.1);
  spirit.add([body, ...arms, head]);
  try { spirit.postFX?.addGlow(GOLD, 3, 0, false, 0.1, 10); } catch { /* canvas renderer: no glow */ }
  scene.tweens.add({ targets: spirit, alpha: 1, scaleX: gs, scaleY: gs, y: wy, delay: DEMON_MS.rise, duration: 460, ease: 'Back.easeOut' });
  const hand = arms[side > 0 ? 1 : 0];
  const palm = () => { const m = hand.getWorldTransformMatrix(), a = Phaser.Math.DegToRad(hand.angle) + Math.PI / 2; return { x: m.tx + Math.cos(a) * 190 * gs * 1.2, y: m.ty + Math.sin(a) * 190 * gs * 1.2 }; };
  const orb = keep(scene.add.graphics().setDepth(D.fx + 1).setBlendMode(Phaser.BlendModes.ADD));
  let orbAt: { x: number; y: number } | null = null, orbR = 0;
  const t0 = scene.time.now;
  const tick = () => {
    if (!spirit.active) { scene.events.off('update', tick); return; }
    const t = (scene.time.now - t0) / 1000, v = view(), ms = scene.time.now - t0;
    dim.setPosition(v.centerX, v.centerY);
    light.clear();
    const la = ms < DEMON_MS.night ? Math.min(1, t * 4) : 0;
    light.fillStyle(GOLD, 0.35 * la).fillTriangle(x - 24 * k, y, x + 24 * k, y, x, y - 220 * k);
    light.fillStyle(0xfff4a0, 0.6 * la).fillTriangle(x - 8 * k, y, x + 8 * k, y, x, y - 190 * k);
    // the sphere of cyan lightning in his palm, then in flight
    orb.clear();
    if (ms > DEMON_MS.charge && ms < DEMON_MS.burst) {
      const p = orbAt ?? palm(), seed = Math.floor(t * 18);
      if (!orbAt) orbR = Math.min(1, (ms - DEMON_MS.charge) / 500) * 18 * k;
      orb.fillStyle(CYAN, 0.35).fillCircle(p.x, p.y, orbR * 1.6);
      orb.fillStyle(CYAN2, 0.9).fillCircle(p.x, p.y, orbR * 0.8);
      for (let n = 0; n < 5; n++) { const a = n * 1.26 + t * 3; bolt(orb, p.x, p.y, p.x + Math.cos(a) * orbR * 2.4, p.y + Math.sin(a) * orbR * 2.4, seed + n, 2, CYAN, EDGE, 0.9, 4); }
    }
  };
  scene.events.on('update', tick);
  // he lifts the hand on the rival's side; the lightning gathers in it
  scene.time.delayedCall(DEMON_MS.charge - 200, () => { if (spirit.active) scene.tweens.add({ targets: hand, angle: side * -120, duration: 260, ease: 'Back.easeOut' }); });
  // the throw: the sphere flies at the rival on a crackling bolt
  scene.time.delayedCall(DEMON_MS.throw, () => {
    if (!spirit.active) return;
    const from = palm();
    scene.tweens.add({ targets: hand, angle: side * -60, duration: 140, ease: 'Cubic.easeIn' });
    cam.shake(160, 0.008);
    const st = { u: 0 };
    orbAt = { ...from };
    const trail = scene.add.graphics().setDepth(D.fx).setBlendMode(Phaser.BlendModes.ADD);
    scene.tweens.add({ targets: st, u: 1, duration: DEMON_MS.burst - DEMON_MS.throw, ease: 'Quad.easeIn', onUpdate: () => {
      orbAt = { x: from.x + (tx - from.x) * st.u, y: from.y + (ty - from.y) * st.u };
      trail.clear(); bolt(trail, from.x, from.y, orbAt.x, orbAt.y, Math.floor(scene.time.now / 50), 4 * k, CYAN, EDGE, 0.9, 9);
    }, onComplete: () => fade(scene, trail, 0, 200) });
  });
  // the burst: a cyan explosion, and the lightning leaps from it to the rivals round it
  scene.time.delayedCall(DEMON_MS.burst, () => {
    if (!spirit.active) return;
    const r = demonR(level);
    cam.shake(320, 0.014); cam.flash(90, 150, 240, 255);
    const leaps = hooks.onBurst(tx, ty, r);
    const g = scene.add.graphics().setDepth(D.fx + 2).setBlendMode(Phaser.BlendModes.ADD);
    scene.tweens.addCounter({ from: 0, to: 1, duration: 520, onUpdate: (tw) => {
      const u = tw.getValue() ?? 0, a = 1 - u, seed = Math.floor(scene.time.now / 45);
      g.clear();
      g.fillStyle(CYAN, 0.45 * a).fillCircle(tx, ty, r * (0.3 + u * 0.8));
      g.fillStyle(CYAN2, 0.8 * a).fillCircle(tx, ty, r * 0.25 * (1 - u * 0.5));
      for (let n = 0; n < 10; n++) { const an = n * 0.628; bolt(g, tx, ty, tx + Math.cos(an) * r * (0.5 + u * 0.6), ty + Math.sin(an) * r * (0.4 + u * 0.5), seed + n, 3, CYAN, EDGE, a, 5); }
      for (const [i, q] of leaps.entries()) bolt(g, tx, ty, q.x, q.y, seed + 20 + i, 2.5, CYAN, EDGE, a, 7);
    }, onComplete: () => g.destroy() });
    const ring = scene.add.ellipse(tx, ty + 6, r * 0.6, r * 0.3).setStrokeStyle(5, CYAN, 1).setDepth(D.fx - 1);
    scene.tweens.add({ targets: ring, scale: 3, alpha: 0, duration: 500, ease: 'Cubic.easeOut', onComplete: () => ring.destroy() });
    scene.time.delayedCall(380, () => { if (spirit.active) scene.tweens.add({ targets: spirit, alpha: 0, duration: 520, ease: 'Cubic.easeIn' }); });
  });
  const end = DEMON_MS.total;
  for (const o of live) if (o !== dim) fade(scene, o, end - 420, 400);
  scene.tweens.add({ targets: dim, alpha: 0, delay: end - 400, duration: 380, onComplete: () => dim.destroy() });
  scene.time.delayedCall(end, () => scene.events.off('update', tick));
}
