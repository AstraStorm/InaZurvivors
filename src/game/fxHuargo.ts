/**
 * Garras llameantes (author, from its scene in Chrono Stones, 6624VyiTekU 3:04; inazuma.fandom «Can infernal, Huargo»: a
 * fire spirit, «te seguirá hasta el infierno y más allá»). A ring of fire lights round the player and a spiral of flame
 * opens; Huargo bursts out of it, jaws gaping (a black wolf with red markings, a pale chest and muzzle, yellow eyes, rows of
 * fangs, golden blades fanned along his back). He bows his head, his claws catch fire, and he rakes the ground ahead: three
 * streaks of fire run at the rival and a row of flames erupts along them and keeps burning.
 */
import Phaser from 'phaser';
import { canvasTex, D, fade, rnd } from './fxKeshin';

type S = Phaser.Scene;
const FIRE = 0xff5a1a, FIRE2 = 0xffc23a, EMBER = 0xff2a10;
const OUT = '#0c0808', FUR = '#24201e', FUR2 = '#3a3430', RED = '#c8242a', PALE = '#e8dcd0', GOLDC = '#e8a830';

/** the wolf's head side-on, jaws gaping: a long snout, red stripes, a yellow eye, rows of fangs, the pale throat;
 *  300×240, facing right, the neck at (60, 200) */
function drawHead(c: CanvasRenderingContext2D) {
  c.lineJoin = 'round'; c.lineCap = 'round';
  // the ruff of black fur round the neck
  c.beginPath(); c.moveTo(20, 230); for (let n = 0; n <= 8; n++) { const a = Math.PI * (0.55 + n / 8 * 0.9); c.lineTo(80 + Math.cos(a) * (70 + (n % 2) * 26), 130 + Math.sin(a) * (80 + (n % 2) * 26)); } c.lineTo(130, 230); c.closePath();
  c.fillStyle = FUR; c.fill(); c.lineWidth = 4; c.strokeStyle = OUT; c.stroke();
  // the upper jaw and skull: up and back, the snout pointing right and a little up
  c.beginPath(); c.moveTo(60, 150); c.quadraticCurveTo(70, 70, 130, 60); c.lineTo(110, 24); c.lineTo(150, 54); c.quadraticCurveTo(230, 56, 290, 96); c.lineTo(282, 112);
  c.quadraticCurveTo(200, 104, 130, 128); c.closePath();
  c.fillStyle = FUR2; c.fill(); c.lineWidth = 4; c.strokeStyle = OUT; c.stroke();
  // the pale muzzle underside and the red stripes over the eye
  c.beginPath(); c.moveTo(150, 120); c.quadraticCurveTo(220, 100, 282, 110); c.lineTo(276, 120); c.quadraticCurveTo(210, 116, 150, 132); c.closePath(); c.fillStyle = PALE; c.fill();
  c.fillStyle = RED; for (const [x, y] of [[120, 70], [140, 64], [100, 92]]) { c.beginPath(); c.moveTo(x, y); c.lineTo(x + 40, y - 4); c.lineTo(x + 8, y + 12); c.closePath(); c.fill(); }
  // the eye: narrow, yellow, glaring
  c.beginPath(); c.moveTo(160, 78); c.lineTo(196, 74); c.lineTo(186, 86); c.closePath(); c.fillStyle = '#ffd02a'; c.fill(); c.lineWidth = 2.5; c.strokeStyle = OUT; c.stroke();
  // the lower jaw, hanging open
  c.beginPath(); c.moveTo(80, 170); c.quadraticCurveTo(160, 160, 250, 190); c.lineTo(244, 204); c.quadraticCurveTo(160, 196, 70, 200); c.closePath();
  c.fillStyle = PALE; c.fill(); c.lineWidth = 4; c.strokeStyle = OUT; c.stroke();
  // the mouth: dark red, the tongue, two rows of fangs
  c.beginPath(); c.moveTo(130, 130); c.quadraticCurveTo(210, 116, 280, 116); c.quadraticCurveTo(250, 160, 250, 188); c.quadraticCurveTo(160, 164, 84, 170); c.closePath();
  c.fillStyle = '#3a0612'; c.fill();
  c.beginPath(); c.ellipse(170, 170, 40, 10, -0.1, 0, Math.PI * 2); c.fillStyle = '#c83048'; c.fill();
  c.fillStyle = '#fffbea'; c.strokeStyle = OUT; c.lineWidth = 1.5;
  for (let x = 140; x < 276; x += 16) { c.beginPath(); c.moveTo(x, 122 - (x - 140) * 0.05); c.lineTo(x + 10, 120 - (x - 140) * 0.05); c.lineTo(x + 5, 140 - (x - 140) * 0.02); c.closePath(); c.fill(); c.stroke(); }
  for (let x = 110; x < 246; x += 16) { c.beginPath(); c.moveTo(x, 172 + (x - 110) * 0.12); c.lineTo(x + 10, 173 + (x - 110) * 0.12); c.lineTo(x + 5, 156 + (x - 110) * 0.12); c.closePath(); c.fill(); c.stroke(); }
  // the black nose at the tip
  c.beginPath(); c.ellipse(284, 100, 8, 6, 0.3, 0, Math.PI * 2); c.fillStyle = '#0a0606'; c.fill();
}
/** the body crouched side-on: the black back with golden blades fanned along it, the red flank stripes, the pale chest,
 *  the forelegs with claws; 380×220, facing right, the head goes at (300, 70) */
function drawBody(c: CanvasRenderingContext2D) {
  c.lineJoin = 'round';
  // the golden blades fanned along the back
  for (let n = 0; n < 5; n++) {
    const bx = 70 + n * 40, a = -Math.PI / 2 - 0.9 + n * 0.12;
    c.beginPath(); c.moveTo(bx - 8, 80); c.lineTo(bx + Math.cos(a) * 110, 70 + Math.sin(a) * 110); c.lineTo(bx + 10, 74); c.closePath();
    const g = c.createLinearGradient(bx, 80, bx + Math.cos(a) * 110, 70 + Math.sin(a) * 110); g.addColorStop(0, '#a86a10'); g.addColorStop(1, '#ffe08a');
    c.fillStyle = g; c.fill(); c.lineWidth = 2.5; c.strokeStyle = '#4a2a00'; c.stroke();
    c.beginPath(); c.arc(bx + Math.cos(a) * 40, 76 + Math.sin(a) * 40, 5, 0, Math.PI * 2); c.fillStyle = GOLDC; c.fill(); c.stroke();
  }
  // the body: a hunched black back, down to the haunch on the left
  c.beginPath(); c.moveTo(10, 200); c.quadraticCurveTo(0, 110, 80, 80); c.quadraticCurveTo(200, 50, 310, 90); c.quadraticCurveTo(330, 150, 300, 200); c.closePath();
  c.fillStyle = FUR; c.fill(); c.lineWidth = 4; c.strokeStyle = OUT; c.stroke();
  // the pale chest and the red markings along the flank
  c.beginPath(); c.moveTo(240, 110); c.quadraticCurveTo(320, 110, 310, 200); c.lineTo(250, 200); c.quadraticCurveTo(250, 150, 240, 110); c.closePath(); c.fillStyle = PALE; c.fill(); c.lineWidth = 3; c.stroke();
  c.fillStyle = RED; for (const x of [80, 130, 180]) { c.beginPath(); c.moveTo(x, 96); c.lineTo(x + 30, 100); c.lineTo(x + 6, 150); c.closePath(); c.fill(); }
  // the forelegs and their claws
  for (const x of [250, 300]) {
    c.beginPath(); c.moveTo(x - 18, 160); c.lineTo(x + 18, 160); c.lineTo(x + 14, 206); c.lineTo(x - 14, 206); c.closePath(); c.fillStyle = FUR2; c.fill(); c.lineWidth = 3.5; c.strokeStyle = OUT; c.stroke();
    c.fillStyle = '#fffbea'; for (const d of [-10, 0, 10]) { c.beginPath(); c.moveTo(x + d - 3, 206); c.lineTo(x + d + 6, 218); c.lineTo(x + d + 3, 206); c.closePath(); c.fill(); c.lineWidth = 1.5; c.stroke(); }
  }
}
const headTex = (scene: S) => canvasTex(scene, 'huargo-head', 300, 240, (c) => drawHead(c));
const bodyTex = (scene: S) => canvasTex(scene, 'huargo-body', 380, 220, (c) => drawBody(c));

export interface FlameClawHooks {
  /** the streaks run from (x0, y0) to (x1, y1), `w` wide: the scene hurts everything along them */
  onRake: (x0: number, y0: number, x1: number, y1: number, w: number) => void;
  /** the row of flames keeps burning along the same line for `ms` */
  onBurn: (x0: number, y0: number, x1: number, y1: number, w: number, ms: number) => void;
  at: () => { x: number; y: number };
}
export const FLAME_MS = { ring: 0, rise: 360, roar: 820, rake: 1350, total: 2700, burn: 2200 };
export const flameSize = (level: number) => ({ len: 300 + level * 22, w: 70 + level * 6 });

/** Garras llameantes. (x, y) the player's feet, (tx, ty) the rival. Visual only: the scene deals the damage in the hooks. */
export function flameClaws(scene: S, x: number, y: number, tx: number, ty: number, level: number, hooks: FlameClawHooks) {
  const k = 1 + level * 0.05, side = tx >= x ? 1 : -1, cam = scene.cameras.main, view = () => cam.worldView;
  const ang = Math.atan2(ty - y, tx - x), size = flameSize(level);
  const live: Phaser.GameObjects.GameObject[] = [];
  const keep = <T extends Phaser.GameObjects.GameObject>(o: T) => { live.push(o); return o; };
  const dim = keep(scene.add.rectangle(view().centerX, view().centerY, view().width * 2, view().height * 2, 0x3a0a04, 1).setDepth(D.dim).setAlpha(0));
  scene.tweens.add({ targets: dim, alpha: 0.6, duration: 240 });
  const swirl = keep(scene.add.graphics().setDepth(D.dim + 1).setBlendMode(Phaser.BlendModes.ADD));
  const ring = keep(scene.add.graphics().setDepth(D.aura).setBlendMode(Phaser.BlendModes.ADD));
  // ---- Huargo, crouched beside the player, facing the rival
  const H = 360, gs = (view().height * 0.36) / H, wx = x - side * 40 * gs / 0.2, wy = Math.max(y + 10, view().top + H * gs + 4);
  const spirit = keep(scene.add.container(wx, wy + 30).setDepth(D.giant).setScale(gs * 0.3).setAlpha(0));
  const body = scene.add.image(0, 0, bodyTex(scene)).setOrigin(0.5, 210 / 220);
  const head = scene.add.image(96, -112, headTex(scene)).setOrigin(60 / 300, 200 / 240).setAngle(-10);
  spirit.add([body, head]);
  if (side < 0) spirit.setScale(-gs * 0.3, gs * 0.3);
  try { spirit.postFX?.addGlow(FIRE, 3, 0, false, 0.1, 10); } catch { /* canvas renderer: no glow */ }
  scene.tweens.add({ targets: spirit, alpha: 1, scaleX: side * gs, scaleY: gs, y: wy, delay: FLAME_MS.rise, duration: 440, ease: 'Back.easeOut' });
  const t0 = scene.time.now;
  const tick = () => {
    if (!spirit.active) { scene.events.off('update', tick); return; }
    const t = (scene.time.now - t0) / 1000, v = view();
    dim.setPosition(v.centerX, v.centerY);
    // the spiral of flame turning round the middle of the view
    swirl.clear();
    const sa = Math.min(1, t * 3) * Math.max(0, 1 - Math.max(0, t - 1.2) * 1.5);
    for (let arm = 0; arm < 3; arm++) {
      swirl.lineStyle(10, arm % 2 ? FIRE2 : FIRE, 0.35 * sa).beginPath();
      for (let u = 0; u <= 1.001; u += 0.04) { const a = t * 3 + arm * 2.09 + u * 7, r = u * v.width * 0.5; const px = v.centerX + Math.cos(a) * r, py = v.centerY + Math.sin(a) * r * 0.7; if (u === 0) swirl.moveTo(px, py); else swirl.lineTo(px, py); }
      swirl.strokePath();
    }
    // the ring of fire at his feet
    ring.clear();
    const ra = Math.min(1, t * 4) * Math.max(0, 1 - Math.max(0, t - 1.6) * 2);
    for (let n = 0; n < 14; n++) { const a = n / 14 * Math.PI * 2 + t * 2, px = x + Math.cos(a) * 34 * k, py = y + Math.sin(a) * 12 * k, h = (14 + Math.sin(t * 16 + n) * 6) * k;
      ring.fillStyle(n % 2 ? FIRE : FIRE2, 0.75 * ra).fillTriangle(px - 6 * k, py, px + 6 * k, py, px, py - h); }
    head.setAngle(-10 + Math.sin(t * 5) * 3);
  };
  scene.events.on('update', tick);
  // the roar: the jaws open wider, flames burst off his back
  scene.time.delayedCall(FLAME_MS.roar, () => {
    if (!spirit.active) return;
    cam.shake(240, 0.009);
    scene.tweens.add({ targets: head, angle: -24, yoyo: true, duration: 180 });
    for (let n = 0; n < 14; n++) {
      const px = wx + rnd(-60, 60) * gs / 0.2, py = wy - rnd(120, 200) * gs / 0.2;
      const f = scene.add.triangle(px, py, 0, 0, 12, 0, 6, -rnd(26, 46), n % 2 ? FIRE : FIRE2, 0.9).setDepth(D.fx).setBlendMode(Phaser.BlendModes.ADD).setScale(k);
      scene.tweens.add({ targets: f, y: py - rnd(40, 80), alpha: 0, duration: rnd(400, 700), onComplete: () => f.destroy() });
    }
  });
  // the rake: he lunges, three streaks of fire run along the ground at the rival, a row of flames erupts behind them
  scene.time.delayedCall(FLAME_MS.rake, () => {
    if (!spirit.active) return;
    const p = hooks.at(), x0 = p.x, y0 = p.y - 6, x1 = x0 + Math.cos(ang) * size.len, y1 = y0 + Math.sin(ang) * size.len, nx = -Math.sin(ang), ny = Math.cos(ang);
    cam.shake(320, 0.014); cam.flash(80, 255, 140, 40);
    scene.tweens.add({ targets: spirit, x: spirit.x + Math.cos(ang) * 60, y: spirit.y + Math.sin(ang) * 30, duration: 160, ease: 'Cubic.easeIn' });
    hooks.onRake(x0, y0, x1, y1, size.w);
    hooks.onBurn(x0, y0, x1, y1, size.w, FLAME_MS.burn);
    const streak = scene.add.graphics().setDepth(D.fx).setBlendMode(Phaser.BlendModes.ADD);
    scene.tweens.addCounter({ from: 0, to: 1, duration: 260, ease: 'Cubic.easeOut', onUpdate: (tw) => {
      const u = tw.getValue() ?? 0;
      streak.clear();
      for (const o of [-0.3, 0, 0.3]) for (const [w, col, al] of [[9, FIRE, 0.5], [4, FIRE2, 0.9], [1.5, 0xffffff, 1]] as const) {
        streak.lineStyle(w * k, col, al).beginPath().moveTo(x0 + nx * size.w * o, y0 + ny * size.w * o);
        streak.lineTo(x0 + Math.cos(ang) * size.len * u + nx * size.w * o * 0.6, y0 + Math.sin(ang) * size.len * u + ny * size.w * o * 0.6).strokePath();
      }
    }, onComplete: () => fade(scene, streak, 200, 300) });
    // the row of flames along the line, erupting one after the other and flickering while they burn
    const n = Math.max(6, Math.round(size.len / 34));
    for (let i = 0; i < n; i++) scene.time.delayedCall(i * 26, () => {
      const u = (i + 0.5) / n, px = x0 + Math.cos(ang) * size.len * u + nx * rnd(-0.3, 0.3) * size.w, py = y0 + Math.sin(ang) * size.len * u + ny * rnd(-0.3, 0.3) * size.w;
      const f = scene.add.triangle(px, py, 0, 0, 22, 0, 11, -rnd(40, 66), i % 2 ? FIRE : EMBER, 0.85).setOrigin(0.5, 1).setDepth(D.fx - 1).setBlendMode(Phaser.BlendModes.ADD).setScale(k * 0.2, k * 0.2);
      const inner = scene.add.triangle(px, py, 0, 0, 10, 0, 5, -rnd(24, 40), FIRE2, 1).setOrigin(0.5, 1).setDepth(D.fx).setBlendMode(Phaser.BlendModes.ADD).setScale(k * 0.2);
      scene.tweens.add({ targets: [f, inner], scaleX: k, scaleY: k, duration: 160, ease: 'Back.easeOut' });
      scene.tweens.add({ targets: [f, inner], scaleY: k * 0.8, yoyo: true, repeat: 6, duration: 120, delay: 160 });
      scene.tweens.add({ targets: [f, inner], alpha: 0, delay: FLAME_MS.burn - 300, duration: 300, onComplete: () => { f.destroy(); inner.destroy(); } });
    });
    scene.time.delayedCall(520, () => { if (spirit.active) scene.tweens.add({ targets: spirit, alpha: 0, duration: 520, ease: 'Cubic.easeIn' }); });
  });
  const end = FLAME_MS.total;
  for (const o of live) if (o !== dim) fade(scene, o, end - 420, 400);
  scene.tweens.add({ targets: dim, alpha: 0, delay: end - 400, duration: 380, onComplete: () => dim.destroy() });
  scene.time.delayedCall(end, () => scene.events.off('update', tick));
}
