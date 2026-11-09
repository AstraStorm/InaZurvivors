/**
 * Estocada de Lancelot (author's sprite of the spirit, the third cell of the spritesheet; guiasnintendo: fire, «El
 * caballero Lancelot alza su espada y la hunde con el balón»): Caballero Lancelot — grey-green plate armour, a helmet with
 * two crescent horns, a gold-trimmed V visor with a green gem on the brow and a red bevor (redrawn from the anime still,
 * UsBfWTxFD1M 0:27, «Sword Saint Lancelot»), a plume of red flame and a red cape, big round
 * pauldrons studded with rivets. He rises behind the shooter, lifts his long sword over his head while fire runs up the
 * blade, aims it at the rival and thrusts: a giant flaming blade runs straight across the pitch through everything in
 * its line, and the line blows up behind it.
 * The anime scene (author, MBK9l7Mco6g): blue-violet flames burst off the shooter and Lancelot forms over him in white
 * armour edged in blue, the red plume, a white shield with a golden cross on his left arm, the sword held straight up;
 * the sky goes violet, he points the sword down at the ball, it turns black with a golden rim, the shooter kicks it off
 * in golden swirls and the knight lunges after it with his thrust.
 */
import Phaser from 'phaser';
import { canvasTex, D, fade, rnd } from './fxKeshin';

type S = Phaser.Scene;
const GOLD = 0xffc02a, GOLD2 = 0xfff0a0, STEEL = 0xdfe8ff, RED = 0xd0182a, VIOLET = 0x7a3aff, BLUE = 0x4a8aff;
const OUT = '#141a3a';

/** white armour plate shaded blue (the scene) */
const steel = (c: CanvasRenderingContext2D, y0: number, y1: number) => {
  const g = c.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, '#ffffff'); g.addColorStop(0.55, '#d4ddf0'); g.addColorStop(1, '#8a9ad0'); return g;
};
const rivet = (c: CanvasRenderingContext2D, x: number, y: number, r = 5) => {
  c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fillStyle = '#d4dedc'; c.fill(); c.lineWidth = 2; c.strokeStyle = OUT; c.stroke();
};

/** the helmet, after the scene (1:56): crescent horns, a plume of red flame, a white sallet with a gold-trimmed V visor and a
 * green gem on the brow, two narrow eye slits and a red bevor under them; 320×320, chin at (160, 310) */
function drawHead(c: CanvasRenderingContext2D) {
  const cx = 160;
  c.lineJoin = 'round'; c.lineCap = 'round';
  // the plume: tongues of red flame rising off the crest
  const flame = (pts: number[][], fill: string) => {
    c.beginPath(); c.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i += 2) c.quadraticCurveTo(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1]);
    c.closePath(); c.fillStyle = fill; c.fill(); c.lineWidth = 3; c.strokeStyle = '#4a0008'; c.stroke();
  };
  c.save(); c.translate(0, 8);
  flame([[cx - 18, 92], [cx - 34, 60], [cx - 14, 40], [cx - 22, 20], [cx - 4, 2], [cx - 2, 26], [cx + 10, 16], [cx + 22, 0], [cx + 30, 8],
    [cx + 20, 30], [cx + 30, 44], [cx + 36, 34], [cx + 44, 30], [cx + 40, 64], [cx + 18, 92]], '#d0182a');
  flame([[cx - 8, 90], [cx - 16, 64], [cx - 4, 46], [cx, 34], [cx + 8, 30], [cx + 4, 48], [cx + 16, 52], [cx + 22, 70], [cx + 10, 90]], '#ff5a4a');
  c.restore();
  // the crescent horns: thin, sweeping out from the temples and curling back up, the points turned in
  for (const s of [-1, 1]) {
    c.beginPath(); c.moveTo(cx + s * 58, 150);
    c.bezierCurveTo(cx + s * 150, 140, cx + s * 150, 40, cx + s * 92, 14);
    c.bezierCurveTo(cx + s * 118, 56, cx + s * 112, 116, cx + s * 60, 124); c.closePath();
    c.fillStyle = steel(c, 14, 150); c.fill(); c.lineWidth = 3.5; c.strokeStyle = OUT; c.stroke();
    c.beginPath(); c.moveTo(cx + s * 70, 140); c.bezierCurveTo(cx + s * 128, 128, cx + s * 132, 70, cx + s * 100, 30); c.lineWidth = 2; c.strokeStyle = '#ffffff'; c.stroke();
  }
  // the sallet: a round dome swelling at the cheeks and narrowing to the chin
  c.beginPath(); c.moveTo(cx, 76);
  c.bezierCurveTo(cx + 60, 76, cx + 78, 120, cx + 76, 176); c.bezierCurveTo(cx + 74, 236, cx + 40, 290, cx, 310);
  c.bezierCurveTo(cx - 40, 290, cx - 74, 236, cx - 76, 176); c.bezierCurveTo(cx - 78, 120, cx - 60, 76, cx, 76); c.closePath();
  c.fillStyle = steel(c, 76, 310); c.fill(); c.lineWidth = 4; c.strokeStyle = OUT; c.stroke();
  c.beginPath(); c.moveTo(cx - 34, 96); c.quadraticCurveTo(cx - 60, 130, cx - 58, 190); c.lineWidth = 3; c.strokeStyle = '#ffffff'; c.stroke(); // the shine
  // the cheek plates, shaded blue along the jaw
  for (const s of [-1, 1]) {
    c.beginPath(); c.moveTo(cx + s * 74, 190); c.bezierCurveTo(cx + s * 70, 240, cx + s * 40, 286, cx + s * 8, 304); c.lineTo(cx + s * 22, 250); c.lineTo(cx + s * 60, 196); c.closePath();
    c.fillStyle = 'rgba(90, 110, 200, 0.35)'; c.fill();
  }
  // the visor: a V of dark steel trimmed in gold, pointing down between the eyes
  const V = [[cx - 70, 150], [cx - 20, 150], [cx, 176], [cx + 20, 150], [cx + 70, 150], [cx + 64, 196], [cx + 16, 214], [cx, 252], [cx - 16, 214], [cx - 64, 196]];
  c.beginPath(); V.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.closePath();
  const vg = c.createLinearGradient(0, 150, 0, 252); vg.addColorStop(0, '#1a2050'); vg.addColorStop(1, '#0a0c22');
  c.fillStyle = vg; c.fill(); c.lineWidth = 8; c.strokeStyle = '#e0a830'; c.stroke(); c.lineWidth = 2.5; c.strokeStyle = '#6a4200'; c.stroke();
  // the eye slits: narrow and slanted, a cold glow inside
  c.shadowColor = '#7affd8'; c.shadowBlur = 14; c.fillStyle = '#c8fff0';
  for (const s of [-1, 1]) {
    c.beginPath(); c.moveTo(cx + s * 18, 184); c.lineTo(cx + s * 56, 170); c.lineTo(cx + s * 52, 178); c.lineTo(cx + s * 20, 190); c.closePath(); c.fill();
  }
  c.shadowBlur = 0;
  // the gem on the brow, in its gold setting, with the crest ridge running up from it
  c.beginPath(); c.moveTo(cx, 84); c.lineTo(cx, 128); c.lineWidth = 3; c.strokeStyle = OUT; c.stroke();
  c.beginPath(); c.moveTo(cx, 120); c.lineTo(cx + 16, 138); c.lineTo(cx, 158); c.lineTo(cx - 16, 138); c.closePath();
  c.fillStyle = '#e0a830'; c.fill(); c.lineWidth = 2.5; c.strokeStyle = '#6a4200'; c.stroke();
  c.beginPath(); c.ellipse(cx, 139, 7, 10, 0, 0, Math.PI * 2);
  const gg = c.createRadialGradient(cx - 2, 135, 1, cx, 139, 10); gg.addColorStop(0, '#d8ffe0'); gg.addColorStop(0.4, '#30d070'); gg.addColorStop(1, '#0a6a30');
  c.fillStyle = gg; c.fill(); c.lineWidth = 1.5; c.strokeStyle = '#063a1a'; c.stroke();
  // the red bevor under the visor, split by a breathing slit
  c.beginPath(); c.moveTo(cx - 40, 224); c.lineTo(cx - 14, 230); c.lineTo(cx, 262); c.lineTo(cx + 14, 230); c.lineTo(cx + 40, 224);
  c.bezierCurveTo(cx + 34, 262, cx + 18, 290, cx, 300); c.bezierCurveTo(cx - 18, 290, cx - 34, 262, cx - 40, 224); c.closePath();
  const rg = c.createLinearGradient(0, 224, 0, 300); rg.addColorStop(0, '#e8283a'); rg.addColorStop(1, '#8a0a18');
  c.fillStyle = rg; c.fill(); c.lineWidth = 3; c.strokeStyle = '#4a0008'; c.stroke();
  c.beginPath(); c.moveTo(cx, 268); c.lineTo(cx, 292); c.lineWidth = 3; c.stroke();
  for (const s of [-1, 1]) { c.beginPath(); c.moveTo(cx + s * 12, 262); c.lineTo(cx + s * 24, 256); c.moveTo(cx + s * 10, 274); c.lineTo(cx + s * 22, 270); c.lineWidth = 2.5; c.stroke(); }
}
/** the body: the red cape behind, the breastplate, the big round pauldrons with rivets; 440×340, the waist at (220, 336) */
function drawTorso(c: CanvasRenderingContext2D) {
  const cx = 220;
  c.lineJoin = 'round';
  // the red cape, spread behind the shoulders
  c.beginPath(); c.moveTo(cx - 140, 60); c.quadraticCurveTo(cx - 210, 200, cx - 190, 336); c.lineTo(cx - 150, 310); c.lineTo(cx - 120, 336); c.lineTo(cx + 120, 336); c.lineTo(cx + 150, 310); c.lineTo(cx + 190, 336);
  c.quadraticCurveTo(cx + 210, 200, cx + 140, 60); c.closePath();
  const cg = c.createLinearGradient(0, 60, 0, 336); cg.addColorStop(0, '#e02a3a'); cg.addColorStop(1, '#7a0a14'); c.fillStyle = cg; c.fill(); c.lineWidth = 4; c.strokeStyle = '#3a0006'; c.stroke();
  // the breastplate
  c.beginPath(); c.moveTo(cx - 90, 40); c.lineTo(cx + 90, 40); c.quadraticCurveTo(cx + 110, 160, cx + 80, 240); c.lineTo(cx + 64, 336); c.lineTo(cx - 64, 336); c.lineTo(cx - 80, 240); c.quadraticCurveTo(cx - 110, 160, cx - 90, 40); c.closePath();
  c.fillStyle = steel(c, 40, 336); c.fill(); c.lineWidth = 4.5; c.strokeStyle = OUT; c.stroke();
  c.lineWidth = 3; c.beginPath(); c.moveTo(cx, 50); c.lineTo(cx, 230); c.stroke();
  c.beginPath(); c.moveTo(cx - 80, 230); c.quadraticCurveTo(cx, 260, cx + 80, 230); c.stroke(); // the belly plates
  c.beginPath(); c.moveTo(cx - 70, 280); c.quadraticCurveTo(cx, 304, cx + 70, 280); c.stroke();
  c.strokeStyle = '#f4faf8'; c.lineWidth = 3; c.beginPath(); c.moveTo(cx - 60, 70); c.quadraticCurveTo(cx - 76, 130, cx - 60, 190); c.stroke();
  // the pauldrons: big rounded plates in tiers, rivets along them
  for (const s of [-1, 1]) {
    for (const [dy, r] of [[0, 1], [34, 0.86]] as const) {
      c.beginPath(); c.ellipse(cx + s * 120, 76 + dy, 74 * r, 54 * r, s * 0.25, Math.PI, Math.PI * 2); c.lineTo(cx + s * 120 + s * 60 * r, 96 + dy);
      c.quadraticCurveTo(cx + s * 120, 120 + dy, cx + s * 120 - s * 60 * r, 96 + dy); c.closePath();
      c.fillStyle = steel(c, 20 + dy, 120 + dy); c.fill(); c.lineWidth = 4; c.strokeStyle = OUT; c.stroke();
    }
    for (const u of [-0.6, 0, 0.6]) rivet(c, cx + s * 120 + u * 50, 52 + Math.abs(u) * 18);
  }
}
/** an armoured arm from the shoulder at (45, 14) on 90×210, the gauntlet at the end */
function drawArm(c: CanvasRenderingContext2D) {
  const sx = 45;
  c.lineJoin = 'round';
  c.beginPath(); c.moveTo(sx - 28, 14); c.quadraticCurveTo(sx - 36, 90, sx - 24, 160); c.lineTo(sx + 24, 160); c.quadraticCurveTo(sx + 36, 90, sx + 28, 14); c.closePath();
  c.fillStyle = steel(c, 0, 170); c.fill(); c.lineWidth = 4; c.strokeStyle = OUT; c.stroke();
  for (const y of [60, 100]) { c.beginPath(); c.moveTo(sx - 30, y); c.quadraticCurveTo(sx, y + 10, sx + 30, y); c.lineWidth = 3; c.stroke(); }
  c.beginPath(); c.ellipse(sx, 80, 22, 16, 0, 0, Math.PI * 2); c.fillStyle = steel(c, 64, 96); c.fill(); c.stroke(); rivet(c, sx, 80, 4); // the elbow cop
  c.beginPath(); c.moveTo(sx - 28, 150); c.lineTo(sx + 28, 150); c.lineTo(sx + 22, 200); c.lineTo(sx - 22, 200); c.closePath(); c.fillStyle = steel(c, 150, 200); c.fill(); c.lineWidth = 3.5; c.stroke(); // the gauntlet
  c.lineWidth = 2; for (const y of [166, 182]) { c.beginPath(); c.moveTo(sx - 24, y); c.lineTo(sx + 24, y); c.stroke(); }
}
/** the long sword, point up; 64×440, the grip at (32, 400) */
function drawSword(c: CanvasRenderingContext2D) {
  const cx = 32;
  c.lineJoin = 'round';
  c.beginPath(); c.moveTo(cx, 4); c.lineTo(cx + 15, 40); c.lineTo(cx + 13, 360); c.lineTo(cx - 13, 360); c.lineTo(cx - 15, 40); c.closePath();
  const g = c.createLinearGradient(cx - 15, 0, cx + 15, 0); g.addColorStop(0, '#9aa8b0'); g.addColorStop(0.45, '#ffffff'); g.addColorStop(0.55, '#e4ecf0'); g.addColorStop(1, '#7a8890');
  c.fillStyle = g; c.fill(); c.lineWidth = 3; c.strokeStyle = OUT; c.stroke();
  c.beginPath(); c.moveTo(cx, 40); c.lineTo(cx, 350); c.lineWidth = 2; c.strokeStyle = '#8a98a0'; c.stroke(); // the fuller
  c.beginPath(); c.moveTo(cx - 30, 360); c.lineTo(cx + 30, 360); c.lineTo(cx + 26, 376); c.lineTo(cx - 26, 376); c.closePath(); c.fillStyle = '#c8a040'; c.fill(); c.lineWidth = 3; c.strokeStyle = OUT; c.stroke(); // the crossguard
  c.fillStyle = '#5a1a1a'; c.fillRect(cx - 6, 376, 12, 46); c.strokeRect(cx - 6, 376, 12, 46);
  c.beginPath(); c.arc(cx, 428, 9, 0, Math.PI * 2); c.fillStyle = '#c8a040'; c.fill(); c.stroke(); // the pommel
}
/** the shield: white, edged in blue, the golden cross; 150×210 */
function drawShield(c: CanvasRenderingContext2D) {
  const cx = 75;
  c.lineJoin = 'round';
  c.beginPath(); c.moveTo(10, 14); c.quadraticCurveTo(cx, 0, 140, 14); c.lineTo(136, 110); c.quadraticCurveTo(128, 170, cx, 206); c.quadraticCurveTo(22, 170, 14, 110); c.closePath();
  c.fillStyle = steel(c, 0, 206); c.fill(); c.lineWidth = 8; c.strokeStyle = '#3a6ad8'; c.stroke(); c.lineWidth = 3; c.strokeStyle = OUT; c.stroke();
  c.fillStyle = '#ffc02a'; c.strokeStyle = '#7a4a00'; c.lineWidth = 2.5;
  c.beginPath(); c.rect(cx - 9, 34, 18, 140); c.rect(cx - 44, 74, 88, 18); c.fill(); c.stroke();
  c.fillStyle = '#fff4c0'; c.fillRect(cx - 5, 38, 4, 60);
}
const headTex = (scene: S) => canvasTex(scene, 'lancelot-head', 320, 320, (c) => drawHead(c));
const torsoTex = (scene: S) => canvasTex(scene, 'lancelot-torso', 440, 340, (c) => drawTorso(c));
const armTex = (scene: S) => canvasTex(scene, 'lancelot-arm', 90, 210, (c) => drawArm(c));
const swordTex = (scene: S) => canvasTex(scene, 'lancelot-sword', 64, 440, (c) => drawSword(c));
const shieldTex = (scene: S) => canvasTex(scene, 'lancelot-shield', 150, 210, (c) => drawShield(c));

export interface ThrustHooks {
  /** the blade runs from (x0, y0) to (x1, y1), `w` wide: everything in its line is pierced */
  onThrust: (x0: number, y0: number, x1: number, y1: number, w: number) => void;
  /** the line blows up behind it: one burst at (x, y), `r` round */
  onBurst: (x: number, y: number, r: number) => void;
}
/** times of the scene, ms */
export const THRUST_MS = { rise: 250, aim: 1250, kick: 1550, thrust: 1750, total: 3100 };
/** the thrust's reach and width, and the bursts along it, by level */
export const thrustSize = (level: number) => ({ len: 620 + level * 30, w: 80 + level * 5, burst: 70 + level * 4 });

/** Estocada de Lancelot. (x, y) the shooter's feet, (tx, ty) the rival. Visual only: the scene deals the damage in the hooks. */
export function lancelotThrust(scene: S, x: number, y: number, tx: number, ty: number, level: number, hooks: ThrustHooks) {
  const k = 1 + level * 0.05, side = tx >= x ? 1 : -1, cam = scene.cameras.main, view = () => cam.worldView;
  const size = thrustSize(level), ang = Math.atan2(ty - y, tx - x);
  const live: Phaser.GameObjects.GameObject[] = [];
  const keep = <T extends Phaser.GameObjects.GameObject>(o: T) => { live.push(o); return o; };
  const dim = keep(scene.add.rectangle(view().centerX, view().centerY, view().width * 2, view().height * 2, 0x140a3a, 1).setDepth(D.dim).setAlpha(0));
  scene.tweens.add({ targets: dim, alpha: 0.7, duration: 240 });
  const lines = keep(scene.add.graphics().setDepth(D.dim + 1).setBlendMode(Phaser.BlendModes.ADD)); // the violet sky's speed lines
  const flames = keep(scene.add.graphics().setDepth(D.aura).setBlendMode(Phaser.BlendModes.ADD)); // blue-violet flames off the shooter
  const ring = keep(scene.add.ellipse(x, y, 60, 26).setStrokeStyle(5, 0xc8d8ff, 0.9).setDepth(D.aura).setBlendMode(Phaser.BlendModes.ADD));
  scene.tweens.add({ targets: ring, scaleX: 3, scaleY: 3, duration: 420, ease: 'Cubic.easeOut' });
  scene.tweens.add({ targets: ring, alpha: 0, delay: 900, duration: 400 });
  cam.flash(120, 140, 120, 255);
  // ---- Lancelot: the cape and body, the head, the sword arm (the sword held straight up), the shield arm in front
  // he fills most of the view's height whatever the camera's zoom, and never pokes out of its top
  const H = 880, gs = (view().height * 0.7) / H, wx = x - side * 10, wy = Math.max(y + 12, view().top + H * gs + 4);
  const spirit = keep(scene.add.container(wx, wy + 40).setDepth(D.giant).setScale(gs * 0.4).setAlpha(0));
  const torso = scene.add.image(0, 0, torsoTex(scene)).setOrigin(0.5, 336 / 340);
  const armL = scene.add.image(-side * 120, -270, armTex(scene)).setOrigin(0.5, 14 / 210).setAngle(side * 30);
  const shield = scene.add.image(-side * 70, -170, shieldTex(scene)).setScale(1.25).setAngle(side * 6);
  const armR = scene.add.image(0, 0, armTex(scene)).setOrigin(0.5, 14 / 210);
  const sword = scene.add.image(0, 190, swordTex(scene)).setOrigin(0.5, 400 / 440).setAngle(180);
  const swordArm = scene.add.container(side * 120, -270, [armR, sword]).setAngle(side * 168); // the sword straight up
  const head = scene.add.image(0, -280, headTex(scene)).setOrigin(0.5, 310 / 320).setScale(1.05);
  if (side < 0) head.setFlipX(true);
  spirit.add([torso, head, swordArm, armL, shield]);
  try { spirit.postFX?.addGlow(BLUE, 4, 0, false, 0.1, 12); } catch { /* canvas renderer: no glow */ }
  scene.tweens.add({ targets: spirit, alpha: 1, y: wy, scaleX: gs, scaleY: gs, delay: THRUST_MS.rise, duration: 460, ease: 'Back.easeOut' });
  const tip = () => { // the sword's point in the world
    const m = swordArm.getWorldTransformMatrix(), a = Phaser.Math.DegToRad(swordArm.angle), b = Phaser.Math.DegToRad(swordArm.angle + sword.angle - 90);
    const gx = m.tx + Math.cos(a + Math.PI / 2) * 190 * spirit.scaleX, gy = m.ty + Math.sin(a + Math.PI / 2) * 190 * spirit.scaleY;
    return { x: gx + Math.cos(b) * 396 * spirit.scaleX, y: gy + Math.sin(b) * 396 * spirit.scaleY };
  };
  const t0 = scene.time.now;
  const tick = () => {
    if (!spirit.active) { scene.events.off('update', tick); return; }
    const t = (scene.time.now - t0) / 1000, v = view();
    dim.setPosition(v.centerX, v.centerY);
    lines.clear();
    for (let n = 0; n < 26; n++) { // speed lines rushing out of the middle
      const a = n / 26 * Math.PI * 2 + Math.sin(n * 7.3) * 0.1, u = (t * 1.8 + n * 0.37) % 1, r0 = v.width * (0.12 + u * 0.5), r1 = r0 + v.width * 0.18;
      lines.lineStyle(2 + (n % 3), n % 2 ? VIOLET : BLUE, 0.35 * (1 - u)).lineBetween(v.centerX + Math.cos(a) * r0, v.centerY + Math.sin(a) * r0, v.centerX + Math.cos(a) * r1, v.centerY + Math.sin(a) * r1);
    }
    flames.clear();
    if (t < 1.1) for (let n = 0; n < 12; n++) { // the blue-violet flames bursting off the shooter
      const a = -Math.PI / 2 + (n / 11 - 0.5) * 2.2, L = (90 + Math.sin(t * 18 + n * 2.1) * 30) * k * Math.min(1, t * 4) * (1.1 - t * 0.8);
      const fx = -Math.sin(a) * 12, fy = Math.cos(a) * 12;
      flames.fillStyle(n % 2 ? VIOLET : BLUE, 0.55).fillTriangle(x + fx, y - 20 + fy, x - fx, y - 20 - fy, x + Math.cos(a) * L, y - 20 + Math.sin(a) * L);
    }
  };
  scene.events.on('update', tick);
  // he points the sword down at the ball before the shooter: it turns black with a golden rim
  const bx = x + Math.cos(ang) * 34, by = y - 12 + Math.sin(ang) * 20;
  const ball = keep(scene.add.circle(bx, by, 6, 0x08060c, 1).setStrokeStyle(2.5, GOLD, 1).setDepth(D.fx + 2).setAlpha(0));
  const rim = keep(scene.add.circle(bx, by, 10, GOLD, 0.35).setDepth(D.fx + 1).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0));
  scene.time.delayedCall(THRUST_MS.aim, () => {
    if (!spirit.active) return;
    const aim = Phaser.Math.RadToDeg(ang + side * 0.5) - 90; // the arm hangs along +y: the blade slants down the shot's way
    scene.tweens.add({ targets: swordArm, angle: aim, duration: 240, ease: 'Back.easeOut', onComplete: () => {
      const q = tip();
      const glint = scene.add.star(q.x, q.y, 4, 4, 22, 0xffffff).setDepth(D.fx + 3).setBlendMode(Phaser.BlendModes.ADD);
      scene.tweens.add({ targets: glint, scale: 2.2, angle: 90, alpha: 0, duration: 300, onComplete: () => glint.destroy() });
      ball.setAlpha(1); rim.setAlpha(1);
      scene.tweens.add({ targets: rim, scale: 1.4, yoyo: true, repeat: -1, duration: 120 });
    } });
  });
  // the kick: the black ball flies off wrapped in golden swirls, and the knight lunges after it with his thrust
  const x0 = x, y0 = y - 20, x1 = x0 + Math.cos(ang) * size.len, y1 = y0 + Math.sin(ang) * size.len, nx = -Math.sin(ang), ny = Math.cos(ang);
  const swirls = keep(scene.add.graphics().setDepth(D.fx + 1).setBlendMode(Phaser.BlendModes.ADD));
  scene.time.delayedCall(THRUST_MS.kick, () => {
    if (!spirit.active) return;
    cam.shake(200, 0.01);
    const dur = THRUST_MS.thrust - THRUST_MS.kick + 220;
    scene.tweens.addCounter({ from: 0, to: 1, duration: dur, ease: 'Quad.easeIn', onUpdate: (tw) => {
      const u = tw.getValue() ?? 0, px = bx + (x1 - bx) * u, py = by + (y1 - by) * u, t = scene.time.now / 1000;
      ball.setPosition(px, py); rim.setPosition(px, py);
      swirls.clear();
      for (let n = 0; n < 3; n++) { // golden swirl rings turning round it, trailing behind
        swirls.lineStyle(3, n === 1 ? GOLD2 : GOLD, 0.9).beginPath();
        for (let v = 0; v <= 1.001; v += 0.05) {
          const a = t * 14 + n * 2.1 + v * 5, back = v * 50, r = 14 * (1 - v * 0.5);
          const qx = px - Math.cos(ang) * back + nx * Math.sin(a) * r, qy = py - Math.sin(ang) * back + ny * Math.sin(a) * r * 0.7 - Math.cos(a) * r * 0.3;
          if (v === 0) swirls.moveTo(qx, qy); else swirls.lineTo(qx, qy);
        }
        swirls.strokePath();
      }
    }, onComplete: () => { swirls.clear(); fade(scene, ball, 0, 160); fade(scene, rim, 0, 160); } });
    scene.tweens.add({ targets: spirit, x: spirit.x + Math.cos(ang) * 140, y: spirit.y + Math.sin(ang) * 80, delay: 120, duration: 200, ease: 'Cubic.easeIn' });
    scene.tweens.add({ targets: swordArm, angle: Phaser.Math.RadToDeg(ang) - 90, duration: 160, ease: 'Cubic.easeOut' });
  });
  // the thrust: a white-blue blade edged in golden lightning runs straight across the pitch
  scene.time.delayedCall(THRUST_MS.thrust, () => {
    if (!spirit.active) return;
    cam.shake(260, 0.01); cam.flash(70, 220, 210, 255);
    hooks.onThrust(x0, y0, x1, y1, size.w);
    const blade = scene.add.graphics().setDepth(D.fx).setBlendMode(Phaser.BlendModes.ADD);
    scene.tweens.addCounter({ from: 0, to: 1, duration: 160, ease: 'Cubic.easeOut', onUpdate: (tw) => {
      const u = tw.getValue() ?? 0, L = size.len * u, w = size.w * 0.3; // drawn thinner than it hits: the camera is close
      blade.clear();
      for (const [ww, col, a] of [[1.5, VIOLET, 0.3], [1, BLUE, 0.45], [0.4, 0xffffff, 0.85]] as const) {
        blade.fillStyle(col, a).beginPath();
        blade.moveTo(x0 + nx * w * ww, y0 + ny * w * ww); blade.lineTo(x0 + Math.cos(ang) * L, y0 + Math.sin(ang) * L); blade.lineTo(x0 - nx * w * ww, y0 - ny * w * ww); blade.closePath().fillPath();
      }
      for (const sg of [-1, 1]) { // the golden lightning along both edges
        blade.lineStyle(3, GOLD, 0.95).beginPath().moveTo(x0 + nx * w * sg, y0 + ny * w * sg);
        for (let v = 0.1; v <= 1.001; v += 0.1) { const o = (1 - v) * w * sg + rnd(-8, 8); blade.lineTo(x0 + Math.cos(ang) * L * v + nx * o, y0 + Math.sin(ang) * L * v + ny * o); }
        blade.strokePath();
      }
    }, onComplete: () => {
      fade(scene, blade, 260, 360);
      for (let n = 0; n < 30; n++) { // sparks thrown off the line
        const u = rnd(0, 1), sg = Math.random() < 0.5 ? 1 : -1, px = x0 + Math.cos(ang) * size.len * u, py = y0 + Math.sin(ang) * size.len * u;
        const sp = scene.add.rectangle(px, py, rnd(8, 18), 3, Math.random() < 0.5 ? GOLD2 : STEEL).setDepth(D.fx + 2).setBlendMode(Phaser.BlendModes.ADD).setRotation(ang);
        scene.tweens.add({ targets: sp, x: px + nx * sg * rnd(30, 90) + Math.cos(ang) * 30, y: py + ny * sg * rnd(30, 90), alpha: 0, duration: rnd(260, 460), onComplete: () => sp.destroy() });
      }
      // the line blows up behind the blade, from the shooter out to the point
      const n = Math.max(5, Math.round(size.len / (size.burst * 1.1)));
      for (let i = 0; i < n; i++) scene.time.delayedCall(140 + i * 55, () => {
        const u = (i + 0.7) / n, px = x0 + Math.cos(ang) * size.len * u, py = y0 + Math.sin(ang) * size.len * u;
        hooks.onBurst(px, py, size.burst);
        cam.shake(90, 0.006);
        const b = scene.add.circle(px, py, size.burst * 0.35, GOLD, 0.7).setDepth(D.fx).setBlendMode(Phaser.BlendModes.ADD);
        scene.tweens.add({ targets: b, scale: 2.2, alpha: 0, duration: 380, ease: 'Cubic.easeOut', onComplete: () => b.destroy() });
        const r = scene.add.ellipse(px, py + 10, size.burst, size.burst * 0.55).setStrokeStyle(5, i % 2 ? VIOLET : RED, 0.9).setDepth(D.fx - 1).setBlendMode(Phaser.BlendModes.ADD);
        scene.tweens.add({ targets: r, scale: 2.4, alpha: 0, duration: 420, onComplete: () => r.destroy() });
      });
    } });
    scene.time.delayedCall(560, () => { if (spirit.active) scene.tweens.add({ targets: spirit, alpha: 0, duration: 600, ease: 'Cubic.easeIn' }); });
  });
  const end = THRUST_MS.total;
  for (const o of live) if (o !== dim) fade(scene, o, end - 420, 400);
  scene.tweens.add({ targets: dim, alpha: 0, delay: end - 400, duration: 380, onComplete: () => dim.destroy() });
  scene.time.delayedCall(end, () => scene.events.off('update', tick));
}
