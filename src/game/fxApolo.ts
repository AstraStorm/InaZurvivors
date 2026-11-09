/**
 * Llamarada solar (author, from its scene in GO, Z3HsG5tU3Cc 0:19, «Sunshine Force»): the player gathers two orbs of
 * light in his hands and claps them into a flash; behind him Apolo rises, the sun god: white armour with red discs on
 * the shoulders and gold trim, a red mask with a black heart-shaped visor, the sun disc on its brow and great golden
 * horns curling out; it spreads its arms and the fireballs it throws up gather into a sun over the pitch. The player
 * leaps and kicks the sun down on the rival: a huge blazing fireball that blows up in a sea of flames.
 */
import Phaser from 'phaser';
import { canvasTex, D, fade, rnd } from './fxKeshin';

type S = Phaser.Scene;
const SUN = 0xffd23a, SUN2 = 0xfff6c0, FIRE = 0xff7a1a, RED = 0xe0301a, EMBER = 0xffb02e;
const OUT = '#2a0804';
/** the head (author's reference): small, a red face with a dark visor and white glints, under a golden crown of flame
 *  spikes with the sun gem; 180×200, the chin at (90, 190) */
function drawHead(c: CanvasRenderingContext2D) {
  const cx = 90;
  c.lineJoin = 'round'; c.lineCap = 'round';
  // the crown: five tall golden flame spikes, the middle one highest
  for (const [dx, h, w] of [[-44, 70, 16], [44, 70, 16], [-24, 100, 18], [24, 100, 18], [0, 130, 20]] as const) {
    c.beginPath(); c.moveTo(cx + dx - w, 112); c.quadraticCurveTo(cx + dx - w * 0.6, 112 - h * 0.6, cx + dx + w * 0.3, 112 - h); c.quadraticCurveTo(cx + dx + w * 0.2, 112 - h * 0.5, cx + dx + w, 112); c.closePath();
    const g = c.createLinearGradient(0, 112 - h, 0, 112); g.addColorStop(0, '#fff3a0'); g.addColorStop(0.5, '#ffc928'); g.addColorStop(1, '#e88a10');
    c.fillStyle = g; c.fill(); c.lineWidth = 3; c.strokeStyle = '#6a3a00'; c.stroke();
  }
  c.beginPath(); c.moveTo(cx - 52, 110); c.quadraticCurveTo(cx, 96, cx + 52, 110); c.lineTo(cx + 46, 128); c.quadraticCurveTo(cx, 116, cx - 46, 128); c.closePath();
  c.fillStyle = '#ffc928'; c.fill(); c.lineWidth = 3; c.strokeStyle = '#6a3a00'; c.stroke(); // the band of the crown
  c.beginPath(); c.arc(cx, 112, 8, 0, Math.PI * 2); c.fillStyle = '#e0301a'; c.fill(); c.lineWidth = 2; c.stroke(); // the sun gem
  // the face: red, narrow, a dark visor with white glints
  c.beginPath(); c.moveTo(cx - 30, 124); c.lineTo(cx + 30, 124); c.lineTo(cx + 26, 166); c.quadraticCurveTo(cx, 196, cx - 26, 166); c.closePath();
  c.fillStyle = '#d02a18'; c.fill(); c.lineWidth = 4; c.strokeStyle = OUT; c.stroke();
  c.beginPath(); c.moveTo(cx - 26, 136); c.lineTo(cx + 26, 136); c.lineTo(cx + 18, 156); c.lineTo(cx, 164); c.lineTo(cx - 18, 156); c.closePath(); c.fillStyle = '#1a0606'; c.fill();
  c.shadowColor = '#fff6c0'; c.shadowBlur = 8; c.fillStyle = '#fffbe0';
  for (const s of [-1, 1]) { c.beginPath(); c.moveTo(cx + s * 4, 146); c.lineTo(cx + s * 20, 140); c.lineTo(cx + s * 16, 150); c.closePath(); c.fill(); }
  c.shadowBlur = 0;
}
/** the great golden horn-wings behind it: two crescents from the shoulders, up and out, dark red inside; 560×340, their
 *  roots at (280, 300) */
function drawHorns(c: CanvasRenderingContext2D) {
  const cx = 280, by = 300;
  c.lineJoin = 'round';
  for (const s of [-1, 1]) {
    c.beginPath(); c.moveTo(cx + s * 40, by - 20); c.bezierCurveTo(cx + s * 140, by - 40, cx + s * 250, by - 140, cx + s * 230, by - 290);
    c.bezierCurveTo(cx + s * 175, by - 235, cx + s * 110, by - 160, cx + s * 58, by - 140); c.quadraticCurveTo(cx + s * 32, by - 100, cx + s * 30, by - 50); c.closePath();
    const g = c.createLinearGradient(cx, by, cx + s * 240, by - 290); g.addColorStop(0, '#e88a10'); g.addColorStop(0.45, '#ffd23a'); g.addColorStop(1, '#fff6c0');
    c.fillStyle = g; c.fill(); c.lineWidth = 5; c.strokeStyle = '#6a3a00'; c.stroke();
    // the dark red inner line, following the curve
    c.beginPath(); c.moveTo(cx + s * 56, by - 50); c.bezierCurveTo(cx + s * 140, by - 70, cx + s * 210, by - 150, cx + s * 222, by - 250);
    c.lineWidth = 9; c.strokeStyle = '#8a1a0c'; c.stroke(); c.lineWidth = 3; c.strokeStyle = '#e0301a'; c.stroke();
  }
}
/** the body (author's reference): broad golden shoulders, dark red and black armour with white plates, a great golden
 *  sun disc on the belly, tapering to a golden point; 300×300, the point at (150, 296), the shoulders at (60, 74) and
 *  (240, 74) */
function drawTorso(c: CanvasRenderingContext2D) {
  const cx = 150;
  c.lineJoin = 'round';
  // the tapering lower body: a golden V down to the point
  c.beginPath(); c.moveTo(cx - 44, 200); c.lineTo(cx + 44, 200); c.lineTo(cx, 296); c.closePath();
  const v = c.createLinearGradient(0, 200, 0, 296); v.addColorStop(0, '#ffc928'); v.addColorStop(1, '#a85a00');
  c.fillStyle = v; c.fill(); c.lineWidth = 4; c.strokeStyle = '#6a3a00'; c.stroke();
  c.beginPath(); c.moveTo(cx - 20, 210); c.lineTo(cx, 268); c.lineTo(cx + 20, 210); c.lineWidth = 3; c.strokeStyle = '#8a1a0c'; c.stroke();
  // the chest: dark red, black sides, white plates
  c.beginPath(); c.moveTo(cx - 84, 66); c.quadraticCurveTo(cx, 44, cx + 84, 66); c.lineTo(cx + 64, 150); c.lineTo(cx + 48, 206); c.lineTo(cx - 48, 206); c.lineTo(cx - 64, 150); c.closePath();
  const g = c.createLinearGradient(0, 50, 0, 210); g.addColorStop(0, '#9a1a10'); g.addColorStop(1, '#4a0a06');
  c.fillStyle = g; c.fill(); c.lineWidth = 4; c.strokeStyle = OUT; c.stroke();
  c.fillStyle = '#1a0606';
  for (const s of [-1, 1]) { c.beginPath(); c.moveTo(cx + s * 84, 66); c.lineTo(cx + s * 64, 150); c.lineTo(cx + s * 48, 206); c.lineTo(cx + s * 40, 140); c.closePath(); c.fill(); }
  c.fillStyle = '#f6f2ea'; c.strokeStyle = OUT; c.lineWidth = 3;
  for (const s of [-1, 1]) { c.beginPath(); c.moveTo(cx + s * 10, 70); c.lineTo(cx + s * 56, 74); c.lineTo(cx + s * 44, 108); c.lineTo(cx + s * 14, 100); c.closePath(); c.fill(); c.stroke(); } // the white chest plates
  // the great golden sun disc on the belly, with its rays
  c.fillStyle = '#ffc928';
  for (let r = 0; r < 16; r++) { const a = (r / 16) * Math.PI * 2; c.beginPath(); c.moveTo(cx + Math.cos(a - 0.13) * 30, 160 + Math.sin(a - 0.13) * 30); c.lineTo(cx + Math.cos(a) * 46, 160 + Math.sin(a) * 46); c.lineTo(cx + Math.cos(a + 0.13) * 30, 160 + Math.sin(a + 0.13) * 30); c.closePath(); c.fill(); }
  const sg = c.createRadialGradient(cx - 6, 152, 2, cx, 160, 32); sg.addColorStop(0, '#fffbe0'); sg.addColorStop(0.5, '#ffd23a'); sg.addColorStop(1, '#e88a10');
  c.beginPath(); c.arc(cx, 160, 31, 0, Math.PI * 2); c.fillStyle = sg; c.fill(); c.lineWidth = 4; c.strokeStyle = '#6a3a00'; c.stroke();
  c.beginPath(); c.arc(cx, 160, 18, 0, Math.PI * 2); c.lineWidth = 3; c.strokeStyle = '#c86a00'; c.stroke();
  // broad golden shoulders with white ridges
  for (const s of [-1, 1]) {
    c.beginPath(); c.moveTo(cx + s * 56, 50); c.quadraticCurveTo(cx + s * 120, 40, cx + s * 118, 90); c.lineTo(cx + s * 66, 96); c.closePath();
    c.fillStyle = '#ffc928'; c.fill(); c.lineWidth = 4; c.strokeStyle = '#6a3a00'; c.stroke();
    c.beginPath(); c.moveTo(cx + s * 66, 60); c.quadraticCurveTo(cx + s * 108, 54, cx + s * 110, 84); c.lineWidth = 4; c.strokeStyle = '#fffbe0'; c.stroke();
  }
}
/** an arm from the shoulder at (35, 10) on 70×150: dark red and black with a white plate, a golden bracelet, a red fist */
function drawArm(c: CanvasRenderingContext2D) {
  const sx = 35;
  c.lineJoin = 'round';
  c.beginPath(); c.ellipse(sx, 42, 16, 32, 0, 0, Math.PI * 2); c.fillStyle = '#7a140c'; c.fill(); c.lineWidth = 4; c.strokeStyle = OUT; c.stroke();
  c.beginPath(); c.ellipse(sx - 4, 38, 6, 22, 0, 0, Math.PI * 2); c.fillStyle = '#f6f2ea'; c.fill();
  c.beginPath(); c.moveTo(sx - 13, 74); c.lineTo(sx + 13, 74); c.lineTo(sx + 11, 112); c.lineTo(sx - 11, 112); c.closePath(); c.fillStyle = '#1a0606'; c.fill(); c.lineWidth = 4; c.strokeStyle = OUT; c.stroke();
  c.fillStyle = '#ffc928'; c.fillRect(sx - 15, 104, 30, 12); c.lineWidth = 3; c.strokeStyle = '#6a3a00'; c.strokeRect(sx - 15, 104, 30, 12);
  c.beginPath(); c.arc(sx, 130, 15, 0, Math.PI * 2); c.fillStyle = '#e0401a'; c.fill(); c.lineWidth = 4; c.strokeStyle = OUT; c.stroke();
  c.beginPath(); c.arc(sx - 4, 125, 5, 0, Math.PI * 2); c.fillStyle = '#ffb08a'; c.fill();
}
/** the sun: a white-hot core through yellow and orange to a red rim */
function drawSun(c: CanvasRenderingContext2D) {
  const g = c.createRadialGradient(128, 128, 4, 128, 128, 126);
  g.addColorStop(0, '#ffffff'); g.addColorStop(0.28, '#fff6c0'); g.addColorStop(0.5, '#ffd23a'); g.addColorStop(0.75, '#ff7a1a'); g.addColorStop(0.92, 'rgba(224,48,26,.7)'); g.addColorStop(1, 'rgba(224,48,26,0)');
  c.fillStyle = g; c.beginPath(); c.arc(128, 128, 126, 0, Math.PI * 2); c.fill();
  c.globalCompositeOperation = 'lighter';
  for (let n = 0; n < 14; n++) { // swirls of flame on its surface
    const a = (n / 14) * Math.PI * 2, r = 50 + (n % 3) * 18;
    c.beginPath(); c.arc(128 + Math.cos(a) * r * 0.4, 128 + Math.sin(a) * r * 0.4, r * 0.35, a, a + 1.6);
    c.lineWidth = 6; c.strokeStyle = 'rgba(255,240,180,.35)'; c.stroke();
  }
}
const headTex = (scene: S) => canvasTex(scene, 'apolo-head2', 180, 200, (c) => drawHead(c));
const hornsTex = (scene: S) => canvasTex(scene, 'apolo-horns', 560, 340, (c) => drawHorns(c));
const torsoTex = (scene: S) => canvasTex(scene, 'apolo-torso2', 300, 300, (c) => drawTorso(c));
const armTex = (scene: S) => canvasTex(scene, 'apolo-arm2', 70, 150, (c) => drawArm(c));
const sunTex = (scene: S) => canvasTex(scene, 'apolo-sun', 256, 256, (c) => drawSun(c));

export interface SunHooks {
  /** the sun lands on (x, y) and blows up `r` round (the scene hurts that area) */
  onImpact: (x: number, y: number, r: number) => void;
  /** the sea of flames it leaves burns `r` round for `ms` */
  onBurn: (x: number, y: number, r: number, ms: number) => void;
  /** where the player is now */
  at: () => { x: number; y: number };
}
/** times of the scene, ms */
export const SUN_MS = { clap: 380, rise: 520, gather: 900, kick: 1600, impact: 1900, total: 3000, burn: 1800 };
/** the blast and the burning ground, by level (an ultimate: wide) */
export const sunBlastR = (level: number) => 140 + level * 12; // (author: «amplía el rango de la explosión del sol»)

/** Llamarada solar. (x, y) the player's feet, (tx, ty) the rival. Visual only: the scene deals the damage in the hooks. */
export function solarFlare(scene: S, x: number, y: number, tx: number, ty: number, level: number, hooks: SunHooks) {
  const k = 1 + level * 0.05, side = tx >= x ? 1 : -1, cam = scene.cameras.main, view = () => cam.worldView;
  const live: Phaser.GameObjects.GameObject[] = [];
  const keep = <T extends Phaser.GameObjects.GameObject>(o: T) => { live.push(o); return o; };
  // the sky burns orange
  const dim = keep(scene.add.rectangle(view().centerX, view().centerY, view().width * 2, view().height * 2, 0x2a0a00, 1).setDepth(D.dim).setAlpha(0));
  scene.tweens.add({ targets: dim, alpha: 0.55, duration: 260 });
  // two orbs of light in his hands meet in front of him: the flash
  const orbs = [-1, 1].map((s) => keep(scene.add.circle(x + s * 14, y - 12, 5, SUN2, 1).setDepth(D.fx).setBlendMode(Phaser.BlendModes.ADD)));
  orbs.forEach((o) => scene.tweens.add({ targets: o, scale: 1.5, duration: SUN_MS.clap - 80 }));
  const halos = [-1, 1].map((s) => keep(scene.add.circle(x + s * 14, y - 12, 10, SUN, 0.35).setDepth(D.fx).setBlendMode(Phaser.BlendModes.ADD)));
  scene.tweens.add({ targets: halos, x, y: y - 14, scale: 1.6, alpha: 0, delay: SUN_MS.clap - 120, duration: 160 });
  scene.tweens.add({ targets: orbs, x, y: y - 14, delay: SUN_MS.clap - 120, duration: 120, ease: 'Quad.easeIn' });
  scene.time.delayedCall(SUN_MS.clap, () => {
    orbs.forEach((o) => o.setAlpha(0));
    const f = scene.add.circle(x, y - 14, 14, 0xffffff, 1).setDepth(D.fx + 1).setBlendMode(Phaser.BlendModes.ADD);
    scene.tweens.add({ targets: f, scale: 7, alpha: 0, duration: 380, ease: 'Cubic.easeOut', onComplete: () => f.destroy() });
    cam.flash(120, 255, 230, 160);
  });
  // ---- Apolo, behind the player: chest, arms, head, a fire aura
  const gs = 0.22 * k, wx = x - side * 4, wy = y + 8;
  const aura = keep(scene.add.graphics().setDepth(D.giant - 1).setBlendMode(Phaser.BlendModes.ADD));
  const spirit = keep(scene.add.container(wx, wy).setDepth(D.giant).setScale(0.05).setAlpha(0));
  // (author's reference) the body tapers to a golden point at the player's feet; the horn-wings spread behind it, the
  // arms open wide to the sides, the small crowned head on top
  const horns = scene.add.image(0, -196, hornsTex(scene)).setOrigin(0.5, 300 / 340);
  const torso = scene.add.image(0, 0, torsoTex(scene)).setOrigin(0.5, 296 / 300);
  const arms = [-1, 1].map((s) => scene.add.image(s * 100, -214, armTex(scene)).setOrigin(0.5, 10 / 150).setAngle(s * -75).setScale(1.25));
  const head = scene.add.image(0, -232, headTex(scene)).setOrigin(0.5, 190 / 200).setScale(1.1);
  spirit.add([horns, ...arms, torso, head]);
  scene.tweens.add({ targets: horns, angle: { from: -2, to: 2 }, duration: 900, yoyo: true, repeat: 2, ease: 'Sine.easeInOut', delay: SUN_MS.rise });
  try { spirit.postFX?.addGlow(0xffd23a, 3, 0, false, 0.1, 10); } catch { /* canvas renderer: no glow */ }
  scene.tweens.add({ targets: spirit, alpha: 1, scale: gs, delay: SUN_MS.rise, duration: 420, ease: 'Back.easeOut' });
  // the sun gathers over Apolo: fireballs fly up from its hands into it
  const sx = wx, sy = wy - 560 * gs; // where the sun forms, over the god's head (as in the scene)
  const sun = keep(scene.add.image(sx, sy, sunTex(scene)).setDepth(D.fx).setScale(0).setBlendMode(Phaser.BlendModes.ADD));
  const corona = keep(scene.add.graphics().setDepth(D.fx - 1).setBlendMode(Phaser.BlendModes.ADD));
  let sunR = 0; // the sun's radius on screen
  const t0 = scene.time.now;
  const tick = () => {
    if (!spirit.active) { scene.events.off('update', tick); return; }
    const t = (scene.time.now - t0) / 1000;
    dim.setPosition(view().centerX, view().centerY);
    head.setAngle(Math.sin(t * 2.4) * 2);
    torso.setScale(1, 1 + Math.sin(t * 4) * 0.015);
    // the fire aura behind the god: flame tongues round its outline
    aura.clear();
    if (spirit.alpha > 0.05) for (let n = 0; n < 14; n++) {
      const a = -Math.PI / 2 + (n - 6.5) * 0.24, L = (70 + Math.sin(t * 10 + n * 1.3) * 16) * gs / 0.24, bx = spirit.x + Math.cos(a) * 34 * gs / 0.24, by = spirit.y - 120 * gs / 0.24 + Math.sin(a) * 30 * gs / 0.24;
      const ex = bx + Math.cos(a) * L, ey = by + Math.sin(a) * L, nx = -Math.sin(a) * 12, ny = Math.cos(a) * 12;
      aura.fillStyle(n % 2 ? FIRE : RED, 0.45 * spirit.alpha).fillTriangle(bx + nx, by + ny, bx - nx, by - ny, ex, ey);
      aura.fillStyle(SUN, 0.35 * spirit.alpha).fillTriangle(bx + nx * 0.4, by + ny * 0.4, bx - nx * 0.4, by - ny * 0.4, bx + (ex - bx) * 0.6, by + (ey - by) * 0.6);
    }
    // the sun's corona: rays turning round it
    corona.clear();
    if (sunR > 2 && sun.visible) for (let n = 0; n < 18; n++) {
      const a = (n / 18) * Math.PI * 2 + t * 1.2, L = sunR * (1.35 + Math.sin(t * 9 + n) * 0.15);
      corona.fillStyle(n % 2 ? SUN : FIRE, 0.55).fillTriangle(sun.x + Math.cos(a - 0.1) * sunR * 0.8, sun.y + Math.sin(a - 0.1) * sunR * 0.8, sun.x + Math.cos(a + 0.1) * sunR * 0.8, sun.y + Math.sin(a + 0.1) * sunR * 0.8, sun.x + Math.cos(a) * L, sun.y + Math.sin(a) * L);
    }
    sun.setAngle(t * 40);
  };
  scene.events.on('update', tick);
  // it spreads its arms up and throws fireballs into the sky; they gather into the sun
  scene.time.delayedCall(SUN_MS.gather, () => {
    if (!spirit.active) return;
    arms.forEach((a, n) => scene.tweens.add({ targets: a, angle: (n ? -1 : 1) * 150, duration: 320, ease: 'Back.easeOut' }));
    scene.tweens.addCounter({ from: 0, to: 1, duration: SUN_MS.kick - SUN_MS.gather, ease: 'Quad.easeOut', onUpdate: (tw) => { const u = tw.getValue() ?? 0; sunR = (14 + u * 30) * k; sun.setScale(sunR * 2 / 256 * 1.1); } });
    for (let n = 0; n < 10; n++) scene.time.delayedCall(n * 60, () => {
      if (!spirit.active) return;
      const hx = spirit.x + (n % 2 ? 1 : -1) * 150 * gs, hy = spirit.y - 360 * gs; // from its raised hands
      const b = scene.add.circle(hx + rnd(-10, 10), hy + rnd(-10, 10), rnd(4, 7) * k, n % 2 ? SUN : FIRE, 1).setDepth(D.fx).setBlendMode(Phaser.BlendModes.ADD);
      scene.tweens.add({ targets: b, x: sx, y: sy, scale: 0.4, duration: 300, ease: 'Quad.easeIn', onComplete: () => b.destroy() });
    });
  });
  // the kick: the player leaps, the sun shoots down on the rival
  scene.time.delayedCall(SUN_MS.kick, () => {
    if (!spirit.active) return;
    arms.forEach((a, n) => scene.tweens.add({ targets: a, angle: (n ? -1 : 1) * 80, duration: 200, ease: 'Cubic.easeOut' }));
    cam.shake(200, 0.008);
    let lastT = 0;
    scene.tweens.add({ targets: sun, x: tx, y: ty, duration: SUN_MS.impact - SUN_MS.kick, ease: 'Quad.easeIn',
      onUpdate: () => { // a blazing trail
        if (scene.time.now - lastT < 18) return;
        lastT = scene.time.now;
        const tr = scene.add.circle(sun.x + rnd(-6, 6), sun.y + rnd(-6, 6), sunR * rnd(0.5, 0.8), Math.random() < 0.5 ? FIRE : SUN, 0.6).setDepth(D.fx - 1).setBlendMode(Phaser.BlendModes.ADD);
        scene.tweens.add({ targets: tr, scale: 0.2, alpha: 0, duration: 320, onComplete: () => tr.destroy() });
      } });
  });
  // the impact: a huge blast, rings, flame pillars and a sea of flames that keeps burning
  scene.time.delayedCall(SUN_MS.impact, () => {
    if (!spirit.active) return;
    const R = sunBlastR(level);
    hooks.onImpact(tx, ty, R);
    hooks.onBurn(tx, ty, R * 0.8, SUN_MS.burn);
    sun.setVisible(false); sunR = 0;
    cam.shake(420, 0.016); cam.flash(160, 255, 200, 120);
    for (const [d, col, s] of [[0, 0xffffff, 0.5], [60, SUN, 0.8], [140, FIRE, 1]] as const) {
      const b = scene.add.circle(tx, ty, R * s, col, 0.85).setDepth(D.fx).setBlendMode(Phaser.BlendModes.ADD).setScale(0.2);
      scene.tweens.add({ targets: b, scale: 1, alpha: 0, delay: d, duration: 520, ease: 'Cubic.easeOut', onComplete: () => b.destroy() });
    }
    for (const [d, col] of [[0, 0xffffff], [90, SUN], [180, RED]] as const) {
      const ring = scene.add.ellipse(tx, ty, R * 0.6, R * 0.32).setStrokeStyle(5, col, 1).setDepth(D.fx - 1);
      scene.tweens.add({ targets: ring, scale: 3.6, alpha: 0, delay: d, duration: 600, ease: 'Cubic.easeOut', onComplete: () => ring.destroy() });
    }
    for (let n = 0; n < 12 + level; n++) { // flame pillars
      const a = (n / (12 + level)) * Math.PI * 2, d = R * rnd(0.3, 0.9), px = tx + Math.cos(a) * d, py = ty + Math.sin(a) * d * 0.55;
      const p = scene.add.triangle(px, py, 0, 0, 14, 0, 7, -rnd(40, 80) * k, n % 2 ? FIRE : SUN, 0.9).setDepth(py).setBlendMode(Phaser.BlendModes.ADD).setScale(1, 0.1);
      scene.tweens.add({ targets: p, scaleY: 1, duration: 160, delay: n * 18, ease: 'Back.easeOut', onComplete: () => scene.tweens.add({ targets: p, scaleY: 0, alpha: 0, delay: 200, duration: 400, onComplete: () => p.destroy() }) });
    }
    // the sea of flames on the ground
    const sea = scene.add.ellipse(tx, ty, R * 1.6, R * 0.9, RED, 0.45).setDepth(ty - 3).setBlendMode(Phaser.BlendModes.ADD);
    scene.tweens.add({ targets: sea, alpha: 0.2, duration: 220, yoyo: true, repeat: Math.floor(SUN_MS.burn / 440) });
    fade(scene, sea, SUN_MS.burn, 400);
    const embers = scene.time.addEvent({ delay: 60, repeat: Math.floor(SUN_MS.burn / 60), callback: () => {
      const a = rnd(0, Math.PI * 2), d = rnd(0, R * 0.8), e = scene.add.circle(tx + Math.cos(a) * d, ty + Math.sin(a) * d * 0.55, rnd(1.5, 3.5), Math.random() < 0.5 ? EMBER : SUN2, 1).setDepth(D.fx - 1);
      scene.tweens.add({ targets: e, y: e.y - rnd(20, 50), alpha: 0, duration: 600, onComplete: () => e.destroy() });
    } });
    scene.time.delayedCall(SUN_MS.burn + 400, () => embers.remove());
    scene.time.delayedCall(260, () => { if (spirit.active) scene.tweens.add({ targets: spirit, y: spirit.y - 30, alpha: 0, duration: 600, ease: 'Cubic.easeIn' }); });
  });
  const end = SUN_MS.total;
  for (const o of live) if (o !== dim) fade(scene, o, end - 420, 400);
  scene.tweens.add({ targets: dim, alpha: 0, delay: end - 400, duration: 380, onComplete: () => dim.destroy() });
  scene.time.delayedCall(end, () => scene.events.off('update', tick));
}
