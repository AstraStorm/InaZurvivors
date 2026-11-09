/**
 * Zarpazo real (author, from its scene in Chrono Stones, 6624VyiTekU 1:40; inazuma.fandom «Adalid leonino, Jmet»: a
 * mountain spirit, «las zarpas de acero de este veterano hablan por él»; Scratch Raid: «lanza un zarpazo que derriba al
 * oponente»). The player crouches in a storm of sand, golden light bursts up out of him and boulders fly round; Jmet
 * rises behind him roaring (a dark violet lion face, yellow eyes, a white beard and crest with a golden diadem and a red
 * gem, a huge black-green mane, black and gold pauldrons, a golden chain across the purple chest, two great claws of golden
 * steel). A golden X flashes, he draws back one claw and rakes it across the pitch: three streaks of golden fire tear
 * through everything in front of him and the rivals go flying.
 */
import Phaser from 'phaser';
import { canvasTex, D, fade, rnd } from './fxKeshin';

type S = Phaser.Scene;
const GOLD = 0xffd23a, GOLD2 = 0xfff4a0, SAND = 0xc8a060, ROCK = 0x8a6a42;
const OUT = '#0c0a14', VIOLET = '#5a4ab8', VIOLET2 = '#8a7ae8', MANE = '#16141e', MANE2 = '#2a2636', GOLDC = '#e8c050', RED = '#c8242a';

/** the head: the black-green mane round it, the white crest with the golden diadem and its red gem, the round violet ears,
 *  the dark violet lion face with yellow eyes, the roaring jaws and the white beard; 300×300, the chin at (150, 290) */
function drawHead(c: CanvasRenderingContext2D) {
  const cx = 150;
  c.lineJoin = 'round'; c.lineCap = 'round';
  // the mane: long spiky locks fanning out round the face
  for (let n = 0; n < 19; n++) {
    const a = Math.PI * (0.8 + n / 18 * 1.4), L = 134 + (n % 2) * 14, w = 0.18;
    c.beginPath(); c.moveTo(cx + Math.cos(a - w) * 50, 150 + Math.sin(a - w) * 50);
    c.quadraticCurveTo(cx + Math.cos(a) * L * 0.8, 150 + Math.sin(a) * L * 0.8 - 6, cx + Math.cos(a) * L, 150 + Math.sin(a) * L);
    c.quadraticCurveTo(cx + Math.cos(a + w) * L * 0.7, 150 + Math.sin(a + w) * L * 0.7, cx + Math.cos(a + w) * 50, 150 + Math.sin(a + w) * 50); c.closePath();
    c.fillStyle = n % 2 ? MANE : MANE2; c.fill(); c.lineWidth = 3; c.strokeStyle = OUT; c.stroke();
  }
  // the white crest rising over the brow
  c.beginPath(); c.moveTo(cx - 54, 100); c.quadraticCurveTo(cx - 60, 50, cx - 30, 36); c.lineTo(cx - 18, 54); c.lineTo(cx - 6, 22); c.lineTo(cx + 6, 50); c.lineTo(cx + 20, 24);
  c.lineTo(cx + 28, 52); c.quadraticCurveTo(cx + 62, 52, cx + 54, 100); c.closePath();
  c.fillStyle = '#f2ece0'; c.fill(); c.lineWidth = 3.5; c.strokeStyle = OUT; c.stroke();
  // the round ears, violet with a pale inside
  for (const s of [-1, 1]) {
    c.beginPath(); c.ellipse(cx + s * 64, 100, 17, 21, s * 0.5, 0, Math.PI * 2); c.fillStyle = VIOLET; c.fill(); c.lineWidth = 3.5; c.strokeStyle = OUT; c.stroke();
    c.beginPath(); c.ellipse(cx + s * 64, 102, 9, 12, s * 0.5, 0, Math.PI * 2); c.fillStyle = VIOLET2; c.fill();
  }
  // the face: a broad dark violet muzzle
  c.beginPath(); c.moveTo(cx - 58, 110); c.quadraticCurveTo(cx, 80, cx + 58, 110); c.quadraticCurveTo(cx + 70, 170, cx + 46, 214); c.quadraticCurveTo(cx, 236, cx - 46, 214); c.quadraticCurveTo(cx - 70, 170, cx - 58, 110); c.closePath();
  const fg = c.createLinearGradient(0, 90, 0, 236); fg.addColorStop(0, VIOLET2); fg.addColorStop(1, '#3a2a88');
  c.fillStyle = fg; c.fill(); c.lineWidth = 4; c.strokeStyle = OUT; c.stroke();
  // the golden diadem with its red gem
  c.beginPath(); c.moveTo(cx - 44, 104); c.quadraticCurveTo(cx, 86, cx + 44, 104); c.lineTo(cx + 40, 114); c.quadraticCurveTo(cx, 98, cx - 40, 114); c.closePath();
  c.fillStyle = GOLDC; c.fill(); c.lineWidth = 2.5; c.strokeStyle = '#5a3a00'; c.stroke();
  c.beginPath(); c.moveTo(cx, 84); c.lineTo(cx + 10, 100); c.lineTo(cx, 116); c.lineTo(cx - 10, 100); c.closePath(); c.fillStyle = GOLDC; c.fill(); c.stroke();
  c.beginPath(); c.ellipse(cx, 100, 5, 8, 0, 0, Math.PI * 2); c.fillStyle = RED; c.fill(); c.lineWidth = 1.5; c.stroke();
  // heavy brows and narrow yellow eyes
  for (const s of [-1, 1]) {
    c.beginPath(); c.moveTo(cx + s * 8, 132); c.lineTo(cx + s * 46, 118); c.lineTo(cx + s * 44, 128); c.lineTo(cx + s * 10, 140); c.closePath(); c.fillStyle = '#2a1e5a'; c.fill();
    c.beginPath(); c.moveTo(cx + s * 14, 142); c.lineTo(cx + s * 42, 132); c.lineTo(cx + s * 38, 144); c.quadraticCurveTo(cx + s * 26, 150, cx + s * 14, 142); c.closePath();
    c.fillStyle = '#ffd02a'; c.fill(); c.lineWidth = 2; c.strokeStyle = OUT; c.stroke();
    c.beginPath(); c.ellipse(cx + s * 28, 141, 2.5, 4, 0, 0, Math.PI * 2); c.fillStyle = OUT; c.fill();
  }
  // the lighter muzzle round the nose and jaws, with whisker spots
  c.beginPath(); c.ellipse(cx, 184, 44, 34, 0, 0, Math.PI * 2); c.fillStyle = '#9a8ae0'; c.fill();
  c.fillStyle = '#4a3a98'; for (const s of [-1, 1]) for (const [dx, dy] of [[24, 166], [32, 172], [26, 176]]) { c.beginPath(); c.arc(cx + s * dx, dy, 2, 0, Math.PI * 2); c.fill(); }
  // the broad nose
  c.beginPath(); c.moveTo(cx - 16, 160); c.quadraticCurveTo(cx, 150, cx + 16, 160); c.quadraticCurveTo(cx + 12, 172, cx, 174); c.quadraticCurveTo(cx - 12, 172, cx - 16, 160); c.closePath();
  c.fillStyle = '#2a1e5a'; c.fill(); c.lineWidth = 2.5; c.strokeStyle = OUT; c.stroke();
  // the roaring jaws: a dark mouth, white fangs above and below, a red tongue
  c.beginPath(); c.moveTo(cx - 34, 182); c.quadraticCurveTo(cx, 174, cx + 34, 182); c.quadraticCurveTo(cx + 30, 226, cx, 232); c.quadraticCurveTo(cx - 30, 226, cx - 34, 182); c.closePath();
  c.fillStyle = '#1a0610'; c.fill(); c.lineWidth = 3; c.strokeStyle = OUT; c.stroke();
  c.beginPath(); c.ellipse(cx, 220, 16, 8, 0, 0, Math.PI * 2); c.fillStyle = '#b8243a'; c.fill();
  c.fillStyle = '#fffbea';
  for (const [x0, y0, dy] of [[-28, 184, 14], [-14, 180, 10], [14, 180, 10], [28, 184, 14], [-22, 226, -12], [22, 226, -12], [-8, 230, -8], [8, 230, -8]]) {
    c.beginPath(); c.moveTo(cx + x0 - 5, y0); c.lineTo(cx + x0 + 5, y0); c.lineTo(cx + x0, y0 + dy); c.closePath(); c.fill(); c.lineWidth = 1.5; c.strokeStyle = OUT; c.stroke();
  }
  // the white beard hanging from the jaw
  c.beginPath(); c.moveTo(cx - 44, 216); c.quadraticCurveTo(cx - 40, 252, cx - 22, 270); c.lineTo(cx - 12, 258); c.lineTo(cx - 6, 288); c.lineTo(cx, 268); c.lineTo(cx + 6, 288); c.lineTo(cx + 12, 258); c.lineTo(cx + 22, 270);
  c.quadraticCurveTo(cx + 40, 252, cx + 44, 216); c.quadraticCurveTo(cx, 244, cx - 44, 216); c.closePath();
  c.fillStyle = '#f2ece0'; c.fill(); c.lineWidth = 3; c.strokeStyle = OUT; c.stroke();
}
/** the body: the mane falling over the shoulders, red pauldrons trimmed in gold, the purple chest, the golden chain with
 *  its medallion; 380×300, the waist at (190, 296) */
function drawTorso(c: CanvasRenderingContext2D) {
  const cx = 190;
  c.lineJoin = 'round';
  // the mane falling behind, wide and ragged
  c.beginPath(); c.moveTo(cx - 110, 20); c.quadraticCurveTo(cx - 190, 140, cx - 160, 290); c.lineTo(cx - 120, 260); c.lineTo(cx - 90, 296); c.lineTo(cx + 90, 296); c.lineTo(cx + 120, 260); c.lineTo(cx + 160, 290);
  c.quadraticCurveTo(cx + 190, 140, cx + 110, 20); c.closePath();
  c.fillStyle = MANE; c.fill(); c.lineWidth = 4; c.strokeStyle = OUT; c.stroke();
  // the purple chest
  c.beginPath(); c.moveTo(cx - 80, 40); c.quadraticCurveTo(cx, 20, cx + 80, 40); c.quadraticCurveTo(cx + 96, 180, cx + 60, 296); c.lineTo(cx - 60, 296); c.quadraticCurveTo(cx - 96, 180, cx - 80, 40); c.closePath();
  const cg = c.createLinearGradient(0, 30, 0, 296); cg.addColorStop(0, '#6a5ad0'); cg.addColorStop(1, '#2e2478');
  c.fillStyle = cg; c.fill(); c.lineWidth = 4; c.strokeStyle = OUT; c.stroke();
  c.lineWidth = 3; c.strokeStyle = '#1e1850';
  c.beginPath(); c.moveTo(cx, 70); c.lineTo(cx, 190); c.moveTo(cx - 50, 150); c.quadraticCurveTo(cx, 170, cx + 50, 150); c.moveTo(cx - 40, 210); c.quadraticCurveTo(cx, 226, cx + 40, 210); c.stroke();
  // the golden chain across the chest and its medallion
  c.lineWidth = 9; c.strokeStyle = '#5a3a00'; c.beginPath(); c.moveTo(cx - 92, 70); c.quadraticCurveTo(cx, 150, cx + 92, 70); c.stroke();
  c.lineWidth = 6; c.strokeStyle = GOLDC; c.stroke();
  c.beginPath(); c.arc(cx, 120, 20, 0, Math.PI * 2); c.fillStyle = GOLDC; c.fill(); c.lineWidth = 3; c.strokeStyle = '#5a3a00'; c.stroke();
  c.beginPath(); c.arc(cx, 120, 10, 0, Math.PI * 2); c.fillStyle = RED; c.fill(); c.lineWidth = 2; c.stroke();
  // the red pauldrons trimmed in gold, in two tiers
  for (const s of [-1, 1]) {
    for (const [dy, r] of [[0, 1], [30, 0.84]] as const) {
      c.beginPath(); c.ellipse(cx + s * 112, 54 + dy, 70 * r, 46 * r, s * 0.3, Math.PI, Math.PI * 2); c.lineTo(cx + s * 112 + s * 54 * r, 74 + dy);
      c.quadraticCurveTo(cx + s * 112, 96 + dy, cx + s * 112 - s * 54 * r, 74 + dy); c.closePath();
      c.fillStyle = '#221e2e'; c.fill(); c.lineWidth = 6; c.strokeStyle = GOLDC; c.stroke(); c.lineWidth = 2.5; c.strokeStyle = OUT; c.stroke();
    }
    c.beginPath(); c.arc(cx + s * 112, 40, 7, 0, Math.PI * 2); c.fillStyle = GOLDC; c.fill(); c.lineWidth = 2; c.stroke();
  }
}
/** an arm from the shoulder at (55, 14) on 110×260: a dark sleeve, a red and gold bracer and the claw of golden steel,
 *  four curved blades at the end */
function drawArm(c: CanvasRenderingContext2D) {
  const sx = 55;
  c.lineJoin = 'round';
  c.beginPath(); c.moveTo(sx - 26, 14); c.quadraticCurveTo(sx - 34, 80, sx - 24, 130); c.lineTo(sx + 24, 130); c.quadraticCurveTo(sx + 34, 80, sx + 26, 14); c.closePath();
  c.fillStyle = '#2a2440'; c.fill(); c.lineWidth = 4; c.strokeStyle = OUT; c.stroke();
  c.fillStyle = '#5a4ab8'; c.fillRect(sx - 28, 110, 56, 26); c.lineWidth = 4; c.strokeStyle = GOLDC; c.strokeRect(sx - 28, 110, 56, 26);
  // the gauntlet: a broad golden hand
  c.beginPath(); c.moveTo(sx - 42, 132); c.lineTo(sx + 42, 132); c.quadraticCurveTo(sx + 54, 176, sx + 40, 204); c.lineTo(sx - 40, 204); c.quadraticCurveTo(sx - 54, 176, sx - 42, 132); c.closePath();
  const g = c.createLinearGradient(sx - 40, 0, sx + 40, 0); g.addColorStop(0, '#9a7a30'); g.addColorStop(0.5, '#f2dc8a'); g.addColorStop(1, '#8a6a20');
  c.fillStyle = g; c.fill(); c.lineWidth = 3.5; c.strokeStyle = '#3a2600'; c.stroke();
  for (const [x, y] of [[-16, 154], [0, 150], [16, 154]]) { c.beginPath(); c.arc(sx + x, y, 4, 0, Math.PI * 2); c.fillStyle = '#5a4210'; c.fill(); }
  // four curved blades
  for (const [x, curl] of [[-30, -6], [-10, -2], [10, 2], [30, 6]]) {
    c.beginPath(); c.moveTo(sx + x - 11, 198); c.quadraticCurveTo(sx + x + curl, 232, sx + x + curl * 1.6, 256); c.quadraticCurveTo(sx + x + curl * 0.5 + 6, 228, sx + x + 11, 198); c.closePath();
    c.fillStyle = g; c.fill(); c.lineWidth = 3; c.strokeStyle = '#3a2600'; c.stroke();
    c.beginPath(); c.moveTo(sx + x - 2, 198); c.quadraticCurveTo(sx + x + curl * 0.8, 228, sx + x + curl * 1.5, 250); c.lineWidth = 1.5; c.strokeStyle = '#fffbd0'; c.stroke();
  }
}
const headTex = (scene: S) => canvasTex(scene, 'jmet-head', 300, 300, (c) => drawHead(c));
const torsoTex = (scene: S) => canvasTex(scene, 'jmet-torso', 380, 300, (c) => drawTorso(c));
const armTex = (scene: S) => canvasTex(scene, 'jmet-arm', 110, 260, (c) => drawArm(c));

export interface ClawHooks {
  /** the rake sweeps a fan in front of him: centre (x, y), reach `r`, towards `ang`, `spread` radians either side */
  onRake: (x: number, y: number, r: number, ang: number, spread: number) => void;
  /** the roar when he appears: it shoves the rivals round the player within `r` */
  onRoar: (x: number, y: number, r: number) => void;
  /** where the player is now */
  at: () => { x: number; y: number };
}
/** times of the scene, ms */
export const CLAW_MS = { storm: 0, rise: 380, roar: 900, cross: 1250, rake: 1650, total: 2800 };
/** the rake's reach and spread, and the roar, by level */
export const clawSize = (level: number) => ({ r: 170 + level * 14, spread: 0.85 + level * 0.03, roar: 70 + level * 6 });

/** Zarpazo real. (x, y) the player's feet, (tx, ty) the rival. Visual only: the scene deals the damage in the hooks. */
export function royalClaw(scene: S, x: number, y: number, tx: number, ty: number, level: number, hooks: ClawHooks) {
  const k = 1 + level * 0.05, side = tx >= x ? 1 : -1, cam = scene.cameras.main, view = () => cam.worldView;
  const ang = Math.atan2(ty - y, tx - x), size = clawSize(level);
  const live: Phaser.GameObjects.GameObject[] = [];
  const keep = <T extends Phaser.GameObjects.GameObject>(o: T) => { live.push(o); return o; };
  // the sky goes a dusty amber; a storm of sand whirls round the player and boulders fly up
  const dim = keep(scene.add.rectangle(view().centerX, view().centerY, view().width * 2, view().height * 2, 0x3a2408, 1).setDepth(D.dim).setAlpha(0));
  scene.tweens.add({ targets: dim, alpha: 0.6, duration: 260 });
  const storm = keep(scene.add.graphics().setDepth(D.aura));
  const lines = keep(scene.add.graphics().setDepth(D.dim + 1).setBlendMode(Phaser.BlendModes.ADD));
  const pillar = keep(scene.add.graphics().setDepth(D.aura + 1).setBlendMode(Phaser.BlendModes.ADD));
  for (let n = 0; n < 9; n++) scene.time.delayedCall(n * 70, () => { // boulders thrown up by the burst of light
    const rk = scene.add.polygon(x + rnd(-60, 60) * k, y + rnd(-4, 10), [0, 0, 14, -4, 20, 8, 12, 18, -2, 14], ROCK, 1).setStrokeStyle(2, 0x3a2410).setDepth(D.giant + 3).setScale(rnd(0.6, 1.3) * k);
    scene.tweens.add({ targets: rk, y: rk.y - rnd(90, 170) * k, x: rk.x + rnd(-40, 40), angle: rnd(-200, 200), duration: rnd(900, 1300), ease: 'Cubic.easeOut' });
    scene.tweens.add({ targets: rk, alpha: 0, delay: 1100, duration: 400, onComplete: () => rk.destroy() });
  });
  // ---- Jmet, rising behind the player: the mane and body, the two claws, the roaring head
  const H = 600, gs = (view().height * 0.62) / H, wx = x - side * 6, wy = Math.max(y + 12, view().top + H * gs + 4);
  const spirit = keep(scene.add.container(wx, wy + 30).setDepth(D.giant).setScale(gs * 0.3).setAlpha(0));
  const torso = scene.add.image(0, 0, torsoTex(scene)).setOrigin(0.5, 296 / 300);
  const arms = [-1, 1].map((s) => scene.add.image(s * 120, -236, armTex(scene)).setOrigin(0.5, 14 / 260).setAngle(s * -22).setScale(1.35));
  const head = scene.add.image(0, -236, headTex(scene)).setOrigin(0.5, 290 / 300).setScale(1.05);
  spirit.add([torso, ...arms, head]);
  try { spirit.postFX?.addGlow(GOLD, 3, 0, false, 0.1, 10); } catch { /* canvas renderer: no glow */ }
  scene.tweens.add({ targets: spirit, alpha: 1, scaleX: gs, scaleY: gs, y: wy, delay: CLAW_MS.rise, duration: 460, ease: 'Back.easeOut' });
  const t0 = scene.time.now;
  const tick = () => {
    if (!spirit.active) { scene.events.off('update', tick); return; }
    const t = (scene.time.now - t0) / 1000, v = view();
    dim.setPosition(v.centerX, v.centerY);
    torso.setScale(1, 1 + Math.sin(t * 4) * 0.015);
    // the sand whirling round him, thinning out as Jmet takes shape
    storm.clear();
    const sa = Math.max(0, 1 - t * 0.7);
    for (let n = 0; n < 22; n++) {
      const a = t * 5 + n * 0.29, r = (24 + (n % 5) * 9) * k * (1 + t * 0.6);
      storm.fillStyle(n % 3 ? SAND : 0xe8c890, 0.5 * sa).fillEllipse(x + Math.cos(a) * r, y - 4 + Math.sin(a) * r * 0.35, 18 * k, 7 * k);
    }
    // the golden light bursting up out of him
    pillar.clear();
    const pa = t < 1.4 ? Math.min(1, t * 4) : Math.max(0, 1 - (t - 1.4) * 2);
    pillar.fillStyle(GOLD, 0.35 * pa).fillTriangle(x - 26 * k, y, x + 26 * k, y, x, y - 230 * k);
    pillar.fillStyle(GOLD2, 0.6 * pa).fillTriangle(x - 9 * k, y, x + 9 * k, y, x, y - 200 * k);
    lines.clear();
    for (let n = 0; n < 24; n++) { // speed lines rushing in from the edges
      const a = n / 24 * Math.PI * 2 + Math.sin(n * 5.1) * 0.12, u = (t * 1.6 + n * 0.41) % 1, r0 = v.width * (0.62 - u * 0.4), r1 = r0 + v.width * 0.12;
      lines.lineStyle(2 + (n % 3), n % 2 ? GOLD : 0xffffff, 0.3 * u).lineBetween(v.centerX + Math.cos(a) * r0, v.centerY + Math.sin(a) * r0, v.centerX + Math.cos(a) * r1, v.centerY + Math.sin(a) * r1);
    }
  };
  scene.events.on('update', tick);
  // the roar: the jaws gape, the claws spread, a ring of dust shoves the rivals back
  scene.time.delayedCall(CLAW_MS.roar, () => {
    if (!spirit.active) return;
    hooks.onRoar(x, y, size.roar);
    cam.shake(260, 0.01);
    scene.tweens.add({ targets: head, scaleY: 1.34, scaleX: 1.3, yoyo: true, duration: 140, repeat: 1 });
    arms.forEach((a, n) => scene.tweens.add({ targets: a, angle: (n ? -1 : 1) * 62, duration: 220, ease: 'Back.easeOut' }));
    for (const [d, col] of [[0, 0xffffff], [90, GOLD]] as const) {
      const ring = scene.add.ellipse(x, y, size.roar * 0.6, size.roar * 0.3).setStrokeStyle(5, col, 0.9).setDepth(D.fx - 1);
      scene.tweens.add({ targets: ring, scale: 3.2, alpha: 0, delay: d, duration: 480, ease: 'Cubic.easeOut', onComplete: () => ring.destroy() });
    }
  });
  // the golden X flash, then he draws back the claw on the rival's side
  scene.time.delayedCall(CLAW_MS.cross, () => {
    if (!spirit.active) return;
    cam.flash(90, 255, 230, 120);
    const mx = x + Math.cos(ang) * 30, my = y - 30;
    for (const s of [-1, 1]) {
      const bar = scene.add.rectangle(mx, my, 150 * k, 10 * k, GOLD2, 1).setRotation(s * Math.PI / 4).setDepth(D.fx + 1).setBlendMode(Phaser.BlendModes.ADD).setScale(0, 1);
      scene.tweens.add({ targets: bar, scaleX: 1, duration: 100, ease: 'Cubic.easeOut' });
      scene.tweens.add({ targets: bar, scaleY: 0, alpha: 0, delay: 220, duration: 220, onComplete: () => bar.destroy() });
    }
    const arm = arms[side > 0 ? 1 : 0];
    scene.tweens.add({ targets: arm, angle: side * -140, duration: 260, ease: 'Back.easeOut' });
  });
  // the rake: three streaks of golden fire sweep across the fan in front of him
  scene.time.delayedCall(CLAW_MS.rake, () => {
    if (!spirit.active) return;
    const arm = arms[side > 0 ? 1 : 0];
    scene.tweens.add({ targets: arm, angle: side * 20, duration: 160, ease: 'Cubic.easeIn' });
    cam.shake(340, 0.016); cam.flash(80, 255, 210, 80);
    const p = hooks.at();
    hooks.onRake(p.x, p.y - 10, size.r, ang, size.spread);
    const rake = scene.add.graphics().setDepth(D.fx).setBlendMode(Phaser.BlendModes.ADD);
    // each streak is an arc across the fan, from one edge to the other, offset in reach
    scene.tweens.addCounter({ from: 0, to: 1, duration: 260, ease: 'Cubic.easeOut', onUpdate: (tw) => {
      const u = tw.getValue() ?? 0;
      rake.clear();
      for (let n = 0; n < 3; n++) {
        const rr = size.r * (0.55 + n * 0.2), a0 = ang - side * size.spread, a1 = a0 + side * size.spread * 2 * u;
        for (const [w, col, al] of [[22, GOLD, 0.45], [11, GOLD2, 0.85], [4, 0xffffff, 1]] as const) {
          rake.lineStyle(w * k, col, al).beginPath();
          for (let v = 0; v <= 1.001; v += 0.08) { const a = a0 + (a1 - a0) * v, q = rr * (0.92 + 0.08 * Math.sin(v * Math.PI)); const px = p.x + Math.cos(a) * q, py = p.y - 10 + Math.sin(a) * q * 0.8; if (v === 0) rake.moveTo(px, py); else rake.lineTo(px, py); }
          rake.strokePath();
        }
      }
    }, onComplete: () => fade(scene, rake, 240, 320) });
    for (let n = 0; n < 26; n++) { // flames and sparks thrown off the streaks
      const a = ang + rnd(-size.spread, size.spread), q = size.r * rnd(0.5, 1), px = p.x + Math.cos(a) * q, py = p.y - 10 + Math.sin(a) * q * 0.8;
      const sp = scene.add.circle(px, py, rnd(2, 5) * k, Math.random() < 0.5 ? GOLD : 0xff8a2a, 1).setDepth(D.fx + 1).setBlendMode(Phaser.BlendModes.ADD);
      scene.tweens.add({ targets: sp, x: px + Math.cos(a) * rnd(20, 60), y: py + Math.sin(a) * rnd(20, 60) - 20, alpha: 0, scale: 0.3, duration: rnd(300, 520), onComplete: () => sp.destroy() });
    }
    scene.time.delayedCall(520, () => { if (spirit.active) scene.tweens.add({ targets: spirit, alpha: 0, y: spirit.y - 20, duration: 560, ease: 'Cubic.easeIn' }); });
  });
  const end = CLAW_MS.total;
  for (const o of live) if (o !== dim) fade(scene, o, end - 420, 400);
  scene.tweens.add({ targets: dim, alpha: 0, delay: end - 400, duration: 380, onComplete: () => dim.destroy() });
  scene.time.delayedCall(end, () => scene.events.off('update', tick));
}
