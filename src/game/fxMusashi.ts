/**
 * Estocada samurái (author, from its scene in GO, qn3ZmLmO_Zg 0:42, «Bushin Renzan»): smoke rolls over the pitch and
 * maple leaves whirl; Musashi rises out of it behind the player (after the author's frame: a huge dark-navy samurai with
 * the great horned kabuto, a golden demon crest, a red snarling face, golden pauldrons, pink shoulders, a red sash, the
 * blue cape and the bulging purple belly, one katana over the shoulder and the other in his fist). The ball charges with
 * red energy at his chest, he draws both swords and cuts a red X across the pitch; the ball flies out at its heart and
 * the X blows up on the rival.
 */
import Phaser from 'phaser';
import { canvasTex, D, fade, rnd } from './fxKeshin';

type S = Phaser.Scene;
const RED = 0xff2a2a, RED2 = 0xff8a6a, GOLD = 0xffc928;
const OUT = '#0a0a1a', NAVY = '#1e2a5a', NAVY2 = '#2e3c78', GOLDC = '#f0b820';

/** the head: the great kabuto with its horns curving up and in, the golden demon crest, the red snarling face;
 *  240×260, the chin at (120, 250) */
function drawHead(c: CanvasRenderingContext2D) {
  const cx = 120;
  c.lineJoin = 'round'; c.lineCap = 'round';
  // the horns: from the helmet's sides, up and curving in to nearly meet over it
  for (const s of [-1, 1]) {
    c.beginPath(); c.moveTo(cx + s * 30, 150); c.bezierCurveTo(cx + s * 100, 130, cx + s * 110, 30, cx + s * 30, 8);
    c.bezierCurveTo(cx + s * 80, 40, cx + s * 74, 120, cx + s * 22, 128); c.closePath();
    c.fillStyle = NAVY; c.fill(); c.lineWidth = 5; c.strokeStyle = OUT; c.stroke();
    c.beginPath(); c.moveTo(cx + s * 36, 140); c.bezierCurveTo(cx + s * 94, 120, cx + s * 98, 46, cx + s * 44, 20); c.lineWidth = 3; c.strokeStyle = '#4a5ca0'; c.stroke();
  }
  // the helmet bowl and its wide brim
  c.beginPath(); c.moveTo(cx - 50, 170); c.quadraticCurveTo(cx - 54, 116, cx, 110); c.quadraticCurveTo(cx + 54, 116, cx + 50, 170); c.closePath();
  c.fillStyle = NAVY2; c.fill(); c.lineWidth = 5; c.strokeStyle = OUT; c.stroke();
  for (const s of [-1, 1]) { c.beginPath(); c.moveTo(cx + s * 40, 168); c.lineTo(cx + s * 82, 186); c.lineTo(cx + s * 50, 196); c.closePath(); c.fillStyle = NAVY; c.fill(); c.lineWidth = 4; c.stroke(); }
  // the golden crest on the front (author's frame): a fierce lion-demon mask with a wide brow, glaring eyes and fangs
  c.beginPath(); c.moveTo(cx - 40, 162); c.quadraticCurveTo(cx - 48, 128, cx - 24, 118); c.quadraticCurveTo(cx - 14, 104, cx, 112); c.quadraticCurveTo(cx + 14, 104, cx + 24, 118); c.quadraticCurveTo(cx + 48, 128, cx + 40, 162);
  c.quadraticCurveTo(cx + 22, 154, cx + 14, 168); c.lineTo(cx, 160); c.lineTo(cx - 14, 168); c.quadraticCurveTo(cx - 22, 154, cx - 40, 162); c.closePath();
  const g = c.createLinearGradient(0, 104, 0, 170); g.addColorStop(0, '#fff2a0'); g.addColorStop(0.6, GOLDC); g.addColorStop(1, '#b07a00');
  c.fillStyle = g; c.fill(); c.lineWidth = 4; c.strokeStyle = '#4a2a00'; c.stroke();
  c.strokeStyle = '#4a2a00'; c.lineWidth = 3;
  for (const s of [-1, 1]) { // curls of the mane, brows, angry eyes
    c.beginPath(); c.arc(cx + s * 30, 132, 6, 0, Math.PI * 1.5); c.stroke();
    c.beginPath(); c.moveTo(cx + s * 4, 130); c.lineTo(cx + s * 22, 124); c.stroke();
    c.beginPath(); c.moveTo(cx + s * 6, 138); c.lineTo(cx + s * 18, 134); c.lineTo(cx + s * 16, 142); c.closePath(); c.fillStyle = '#4a2a00'; c.fill();
  }
  c.beginPath(); c.moveTo(cx - 12, 152); c.quadraticCurveTo(cx, 158, cx + 12, 152); c.stroke(); // snarl
  c.fillStyle = '#fffbe0'; for (const s of [-1, 1]) { c.beginPath(); c.moveTo(cx + s * 8, 152); c.lineTo(cx + s * 5, 162); c.lineTo(cx + s * 2, 153); c.closePath(); c.fill(); } // fangs
  // the face (author: «con barba y como cicatrices en los ojos, más imponente»): broad and heavy-jawed, pink-red, deep
  // angry brows, a scar slashed down through each eye, a big nose, gritted teeth, a dark beard round the jaw
  c.beginPath(); c.moveTo(cx - 42, 172); c.lineTo(cx + 42, 172); c.quadraticCurveTo(cx + 46, 206, cx + 38, 226); c.quadraticCurveTo(cx, 258, cx - 38, 226); c.quadraticCurveTo(cx - 46, 206, cx - 42, 172); c.closePath();
  c.fillStyle = '#e06a5a'; c.fill(); c.lineWidth = 4; c.strokeStyle = OUT; c.stroke();
  c.beginPath(); c.moveTo(cx - 42, 172); c.lineTo(cx + 42, 172); c.lineTo(cx + 40, 184); c.lineTo(cx - 40, 184); c.closePath(); c.fillStyle = '#a83a30'; c.fill(); // the shadow under the brim
  // the beard: dark navy, round the jaw and chin, up the cheeks
  c.beginPath(); c.moveTo(cx - 44, 200); c.quadraticCurveTo(cx - 44, 236, cx - 22, 250); c.quadraticCurveTo(cx, 264, cx + 22, 250); c.quadraticCurveTo(cx + 44, 236, cx + 44, 200);
  c.quadraticCurveTo(cx + 34, 222, cx + 24, 226); c.quadraticCurveTo(cx, 238, cx - 24, 226); c.quadraticCurveTo(cx - 34, 222, cx - 44, 200); c.closePath();
  c.fillStyle = '#20264a'; c.fill(); c.lineWidth = 3; c.strokeStyle = OUT; c.stroke();
  c.strokeStyle = '#3a4478'; c.lineWidth = 2; c.beginPath(); for (let n = -3; n <= 3; n++) { c.moveTo(cx + n * 9, 232 + Math.abs(n) * -2); c.lineTo(cx + n * 10, 244 + Math.abs(n) * -3); } c.stroke();
  // heavy brows and glaring white eyes
  c.lineWidth = 6; c.strokeStyle = OUT;
  for (const s of [-1, 1]) { c.beginPath(); c.moveTo(cx + s * 4, 194); c.lineTo(cx + s * 34, 184); c.stroke(); }
  c.fillStyle = '#fffbe0'; for (const s of [-1, 1]) { c.beginPath(); c.moveTo(cx + s * 8, 200); c.lineTo(cx + s * 30, 192); c.lineTo(cx + s * 26, 203); c.closePath(); c.fill(); c.lineWidth = 2; c.stroke(); }
  // the scars: a slash down through each eye
  c.lineWidth = 3; c.strokeStyle = '#7a1a14';
  for (const s of [-1, 1]) { c.beginPath(); c.moveTo(cx + s * 14, 182); c.lineTo(cx + s * 22, 214); c.stroke(); c.lineWidth = 1.5; c.strokeStyle = '#ffb0a0'; c.beginPath(); c.moveTo(cx + s * 15, 183); c.lineTo(cx + s * 23, 213); c.stroke(); c.lineWidth = 3; c.strokeStyle = '#7a1a14'; }
  // a big nose
  c.beginPath(); c.moveTo(cx - 4, 198); c.quadraticCurveTo(cx - 6, 212, cx - 14, 216); c.quadraticCurveTo(cx, 224, cx + 14, 216); c.quadraticCurveTo(cx + 6, 212, cx + 4, 198);
  c.fillStyle = '#c84a3c'; c.fill(); c.lineWidth = 2.5; c.strokeStyle = OUT; c.stroke();
  c.fillStyle = OUT; for (const s of [-1, 1]) { c.beginPath(); c.ellipse(cx + s * 6, 217, 2.8, 1.8, 0, 0, Math.PI * 2); c.fill(); }
  // gritted teeth in a wide snarl
  c.beginPath(); c.moveTo(cx - 20, 226); c.quadraticCurveTo(cx, 222, cx + 20, 226); c.lineTo(cx + 16, 238); c.quadraticCurveTo(cx, 241, cx - 16, 238); c.closePath(); c.fillStyle = '#fff'; c.fill(); c.lineWidth = 3; c.strokeStyle = OUT; c.stroke();
  c.beginPath(); c.moveTo(cx - 18, 232); c.lineTo(cx + 18, 232); for (let n = -12; n <= 12; n += 6) { c.moveTo(cx + n, 225); c.lineTo(cx + n, 239); } c.lineWidth = 1.8; c.stroke();
  // gold cheek guards
  for (const s of [-1, 1]) { c.beginPath(); c.moveTo(cx + s * 40, 174); c.lineTo(cx + s * 54, 196); c.lineTo(cx + s * 44, 214); c.closePath(); c.fillStyle = GOLDC; c.fill(); c.lineWidth = 3; c.strokeStyle = '#5a3a00'; c.stroke(); }
}
/** a katana, its grip at (16, 290) on 60×310, the blade up: blue-wrapped grip, gold guard, a long pale curved blade */
function drawKatana(c: CanvasRenderingContext2D) {
  c.lineJoin = 'round';
  c.fillStyle = '#2a4ab8'; c.fillRect(10, 236, 14, 70); c.strokeStyle = OUT; c.lineWidth = 3; c.strokeRect(10, 236, 14, 70);
  c.fillStyle = '#7aa0ff'; for (let y = 242; y < 300; y += 10) c.fillRect(11, y, 12, 3);
  c.fillStyle = GOLDC; c.fillRect(2, 228, 30, 9); c.strokeRect(2, 228, 30, 9);
  c.beginPath(); c.moveTo(12, 228); c.quadraticCurveTo(14, 110, 40, 4); c.quadraticCurveTo(30, 120, 24, 228); c.closePath();
  const g = c.createLinearGradient(10, 0, 40, 0); g.addColorStop(0, '#9aa6c0'); g.addColorStop(0.6, '#f2f6ff'); g.addColorStop(1, '#c8d0e0');
  c.fillStyle = g; c.fill(); c.lineWidth = 3; c.strokeStyle = OUT; c.stroke();
  c.beginPath(); c.moveTo(19, 222); c.quadraticCurveTo(22, 120, 38, 12); c.lineWidth = 1.5; c.strokeStyle = '#ffffff'; c.stroke();
}
/** the body: golden pauldrons, pink shoulders, navy armour with gold trim, the red sash with its bow, the bulging purple
 *  belly tapering down, the blue cape behind; 340×320, the point at (170, 316), the shoulders at (60, 70) and (280, 70) */
function drawTorso(c: CanvasRenderingContext2D) {
  const cx = 170;
  c.lineJoin = 'round';
  // the blue cape behind
  // (a cape that flares out from the shoulders to a ragged hem, open in the middle over the belly)
  for (const s of [-1, 1]) {
    c.beginPath(); c.moveTo(cx + s * 70, 60); c.quadraticCurveTo(cx + s * 150, 150, cx + s * 166, 300);
    c.lineTo(cx + s * 140, 286); c.lineTo(cx + s * 122, 304); c.lineTo(cx + s * 100, 284); c.lineTo(cx + s * 70, 300); c.quadraticCurveTo(cx + s * 70, 180, cx + s * 40, 70); c.closePath();
    c.fillStyle = '#2a3aa8'; c.fill(); c.lineWidth = 4; c.strokeStyle = OUT; c.stroke();
    c.beginPath(); c.moveTo(cx + s * 86, 80); c.quadraticCurveTo(cx + s * 140, 170, cx + s * 150, 280); c.lineWidth = 3; c.strokeStyle = '#5a7aff'; c.stroke();
  }
  // the bulging purple belly, down to a point
  c.beginPath(); c.moveTo(cx - 70, 180); c.quadraticCurveTo(cx - 92, 250, cx, 316); c.quadraticCurveTo(cx + 92, 250, cx + 70, 180); c.closePath();
  const b = c.createRadialGradient(cx - 20, 230, 10, cx, 240, 100); b.addColorStop(0, '#8a7ae0'); b.addColorStop(1, '#3a2a8a');
  c.fillStyle = b; c.fill(); c.lineWidth = 4; c.strokeStyle = OUT; c.stroke();
  // the navy chest armour with gold trim
  c.beginPath(); c.moveTo(cx - 92, 70); c.quadraticCurveTo(cx, 46, cx + 92, 70); c.lineTo(cx + 78, 190); c.lineTo(cx - 78, 190); c.closePath();
  c.fillStyle = NAVY; c.fill(); c.lineWidth = 4; c.strokeStyle = OUT; c.stroke();
  c.lineWidth = 5; c.strokeStyle = GOLDC;
  c.beginPath(); c.moveTo(cx - 70, 96); c.quadraticCurveTo(cx - 30, 130, cx - 46, 170); c.moveTo(cx + 70, 96); c.quadraticCurveTo(cx + 30, 130, cx + 46, 170); c.moveTo(cx - 40, 80); c.quadraticCurveTo(cx, 100, cx + 40, 80); c.stroke();
  // the red sash and its bow
  c.fillStyle = '#d8241a'; c.fillRect(cx - 80, 180, 160, 22); c.lineWidth = 3; c.strokeStyle = OUT; c.strokeRect(cx - 80, 180, 160, 22);
  for (const s of [-1, 1]) { c.beginPath(); c.moveTo(cx - 10, 190); c.lineTo(cx - 10 + s * 34, 172); c.lineTo(cx - 10 + s * 30, 212); c.closePath(); c.fillStyle = '#e8342a'; c.fill(); c.stroke(); }
  c.beginPath(); c.moveTo(cx - 14, 198); c.lineTo(cx - 26, 240); c.lineTo(cx - 6, 236); c.closePath(); c.fill(); c.stroke();
  // the armour skirt plates with gold edges
  for (const s of [-1, 1]) { c.beginPath(); c.moveTo(cx + s * 20, 202); c.lineTo(cx + s * 78, 202); c.lineTo(cx + s * 70, 252); c.lineTo(cx + s * 26, 246); c.closePath(); c.fillStyle = NAVY; c.fill(); c.lineWidth = 4; c.strokeStyle = OUT; c.stroke(); c.beginPath(); c.moveTo(cx + s * 26, 244); c.lineTo(cx + s * 70, 250); c.lineWidth = 4; c.strokeStyle = GOLDC; c.stroke(); }
  // pink shoulders under the great golden pauldrons
  for (const s of [-1, 1]) {
    c.beginPath(); c.ellipse(cx + s * 98, 92, 34, 30, 0, 0, Math.PI * 2); c.fillStyle = '#e8907a'; c.fill(); c.lineWidth = 4; c.strokeStyle = OUT; c.stroke();
    c.beginPath(); c.moveTo(cx + s * 50, 44); c.quadraticCurveTo(cx + s * 140, 30, cx + s * 150, 84); c.lineTo(cx + s * 104, 96); c.quadraticCurveTo(cx + s * 80, 70, cx + s * 46, 74); c.closePath();
    const p = c.createLinearGradient(0, 30, 0, 96); p.addColorStop(0, '#fff2a0'); p.addColorStop(1, GOLDC);
    c.fillStyle = p; c.fill(); c.lineWidth = 4; c.strokeStyle = '#5a3a00'; c.stroke();
    c.beginPath(); c.arc(cx + s * 106, 66, 7, 0, Math.PI * 2); c.fillStyle = '#d8241a'; c.fill(); c.lineWidth = 2; c.stroke();
  }
}
/** an arm from the shoulder at (40, 12) on 80×170: navy sleeve with a gold band, a big purple fist */
function drawArm(c: CanvasRenderingContext2D) {
  const sx = 40;
  c.lineJoin = 'round';
  c.beginPath(); c.ellipse(sx, 52, 22, 42, 0, 0, Math.PI * 2); c.fillStyle = NAVY2; c.fill(); c.lineWidth = 4; c.strokeStyle = OUT; c.stroke();
  c.fillStyle = GOLDC; c.fillRect(sx - 22, 96, 44, 12); c.lineWidth = 3; c.strokeStyle = '#5a3a00'; c.strokeRect(sx - 22, 96, 44, 12);
  c.beginPath(); c.ellipse(sx, 136, 24, 26, 0, 0, Math.PI * 2); c.fillStyle = '#6a5ad0'; c.fill(); c.lineWidth = 4; c.strokeStyle = OUT; c.stroke();
  c.lineWidth = 2.5; c.beginPath(); for (const d of [-10, 0, 10]) { c.moveTo(sx + d, 120); c.lineTo(sx + d, 134); } c.stroke();
}
const headTex = (scene: S) => canvasTex(scene, 'musashi-head2', 240, 266, (c) => drawHead(c));
const torsoTex = (scene: S) => canvasTex(scene, 'musashi-torso', 340, 320, (c) => drawTorso(c));
const armTex = (scene: S) => canvasTex(scene, 'musashi-arm', 80, 170, (c) => drawArm(c));
const katanaTex = (scene: S) => canvasTex(scene, 'musashi-katana', 60, 310, (c) => drawKatana(c));
/** (author: «que caigan hojas, no estrellas») a maple leaf: five pointed lobes with serrated edges, a short stem and its
 *  veins; drawn at 3× and shown small */
const leafTex = (scene: S) => canvasTex(scene, 'maple-leaf2', 48, 52, (c) => {
  const cx = 24, cy = 26;
  // lobes: angle from the stem's base, length, half-width
  const lobes: [number, number, number][] = [[-90, 22, 0.32], [-38, 20, 0.34], [-142, 20, 0.34], [12, 13, 0.3], [-192, 13, 0.3]];
  c.beginPath();
  c.moveTo(cx, cy + 4);
  for (const [deg, len, hw] of lobes.sort((a, b) => b[0] - a[0])) {
    const a = (deg * Math.PI) / 180, tipx = cx + Math.cos(a) * len, tipy = cy + Math.sin(a) * len;
    const l = a - hw, r = a + hw;
    c.lineTo(cx + Math.cos(r) * len * 0.45, cy + Math.sin(r) * len * 0.45);
    c.lineTo(cx + Math.cos(r - 0.08) * len * 0.72, cy + Math.sin(r - 0.08) * len * 0.72); // a serration
    c.lineTo(cx + Math.cos(r - 0.02) * len * 0.66, cy + Math.sin(r - 0.02) * len * 0.66);
    c.lineTo(tipx, tipy);
    c.lineTo(cx + Math.cos(l + 0.02) * len * 0.66, cy + Math.sin(l + 0.02) * len * 0.66);
    c.lineTo(cx + Math.cos(l + 0.08) * len * 0.72, cy + Math.sin(l + 0.08) * len * 0.72);
    c.lineTo(cx + Math.cos(l) * len * 0.45, cy + Math.sin(l) * len * 0.45);
  }
  c.closePath();
  const g = c.createRadialGradient(cx, cy, 2, cx, cy, 24); g.addColorStop(0, '#ffb03a'); g.addColorStop(0.6, '#f0601a'); g.addColorStop(1, '#c0300e');
  c.fillStyle = g; c.fill(); c.lineWidth = 2; c.lineJoin = 'round'; c.strokeStyle = '#7a1a06'; c.stroke();
  c.strokeStyle = '#8a2a08'; c.lineWidth = 1.4; // the veins
  for (const [deg, len] of lobes) { const a = (deg * Math.PI) / 180; c.beginPath(); c.moveTo(cx, cy + 2); c.lineTo(cx + Math.cos(a) * len * 0.85, cy + Math.sin(a) * len * 0.85); c.stroke(); }
  c.beginPath(); c.moveTo(cx, cy + 3); c.quadraticCurveTo(cx + 2, cy + 14, cx + 6, cy + 24); c.lineWidth = 2.4; c.strokeStyle = '#7a3a10'; c.stroke(); // the stem
});

export interface SlashHooks {
  /** the red X runs from the player to past the rival: the scene hurts everything along both cuts (`width` wide) */
  onCross: (x0: number, y0: number, x1: number, y1: number, width: number) => void;
  /** it blows up at (x, y), `r` round */
  onBlast: (x: number, y: number, r: number) => void;
  /** where the player is now */
  at: () => { x: number; y: number };
}
/** times of the scene, ms */
export const SLASH_MS = { smoke: 0, rise: 420, draw: 1000, charge: 1250, cut: 1700, blast: 1980, total: 2900 };
/** the cut's reach and width, and the blast, by level (an ultimate: wide) */
export const slashSize = (level: number) => ({ len: 360 + level * 20, w: 60 + level * 6, r: 110 + level * 10 });

/** Estocada samurái. (x, y) the player's feet, (tx, ty) the rival. Visual only: the scene deals the damage in the hooks. */
export function samuraiSlash(scene: S, x: number, y: number, tx: number, ty: number, level: number, hooks: SlashHooks) {
  const k = 1 + level * 0.05, side = tx >= x ? 1 : -1, cam = scene.cameras.main, view = () => cam.worldView;
  const live: Phaser.GameObjects.GameObject[] = [];
  const keep = <T extends Phaser.GameObjects.GameObject>(o: T) => { live.push(o); return o; };
  // the sky goes deep red; smoke rolls over the ground and maple leaves whirl
  const dim = keep(scene.add.rectangle(view().centerX, view().centerY, view().width * 2, view().height * 2, 0x2a0606, 1).setDepth(D.dim).setAlpha(0));
  scene.tweens.add({ targets: dim, alpha: 0.6, duration: 280 });
  for (let n = 0; n < 16; n++) {
    const a = (n / 16) * Math.PI * 2, px = x + Math.cos(a) * rnd(20, 50), py = y + Math.sin(a) * rnd(6, 16);
    const p = scene.add.ellipse(px, py, rnd(40, 70) * k, rnd(18, 28) * k, 0xf2eee8, 0.85).setDepth(D.giant + 2).setScale(0.3);
    scene.tweens.add({ targets: p, x: x + Math.cos(a) * rnd(80, 140) * k, y: y + Math.sin(a) * rnd(20, 40) * k, scale: 1.4, alpha: 0, duration: rnd(1100, 1600), ease: 'Cubic.easeOut', onComplete: () => p.destroy() });
  }
  const leaves = scene.time.addEvent({ delay: 50, repeat: Math.floor(SLASH_MS.total / 50) - 10, callback: () => {
    const l = scene.add.image(view().left + rnd(0, view().width), view().top - 10, leafTex(scene)).setDepth(D.fx).setScale(rnd(0.25, 0.45)).setAngle(rnd(0, 360)).setTint(Math.random() < 0.5 ? 0xffffff : 0xffb070);
    scene.tweens.add({ targets: l, x: l.x + rnd(-120, 40), y: l.y + view().height * rnd(0.5, 1.1), angle: l.angle + rnd(-400, 400), alpha: 0, duration: rnd(1400, 2200), onComplete: () => l.destroy() });
  } });
  // ---- Musashi, out of the smoke behind the player: cape, belly, armour, arms, two katanas, the horned head
  const gs = 0.17 * k, wx = x - side * 6, wy = y + 10;
  const aura = keep(scene.add.graphics().setDepth(D.giant - 1).setBlendMode(Phaser.BlendModes.ADD));
  const spirit = keep(scene.add.container(wx, wy).setDepth(D.giant).setScale(gs * 0.3).setAlpha(0));
  const torso = scene.add.image(0, 0, torsoTex(scene)).setOrigin(0.5, 316 / 320);
  // one katana rests on the right shoulder, the other hangs from the left fist
  const swords = [-1, 1].map((s) => scene.add.image(s < 0 ? -150 : 120, s < 0 ? -140 : -250, katanaTex(scene)).setOrigin(16 / 60, 290 / 310).setAngle(s < 0 ? -120 : -55).setScale(1.3)); // left: low in the fist; right: over the shoulder, as in the frame
  const arms = [-1, 1].map((s) => scene.add.image(s * 128, -244, armTex(scene)).setOrigin(0.5, 12 / 170).setAngle(s * -25).setScale(1.2));
  const head = scene.add.image(0, -262, headTex(scene)).setOrigin(0.5, 250 / 260).setScale(1.6);
  spirit.add([swords[1], torso, swords[0], ...arms, head]);
  try { spirit.postFX?.addGlow(0xff6a3a, 3, 0, false, 0.1, 10); } catch { /* canvas renderer: no glow */ }
  scene.tweens.add({ targets: spirit, alpha: 1, scaleX: gs, scaleY: gs, y: wy, delay: SLASH_MS.rise, duration: 460, ease: 'Back.easeOut' });
  // the red energy that will become the ball, at his chest
  const orb = keep(scene.add.circle(wx, wy - 150 * gs, 6, RED, 1).setDepth(D.fx).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0));
  const orbHalo = keep(scene.add.circle(orb.x, orb.y, 12, RED2, 0.5).setDepth(D.fx - 1).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0));
  const t0 = scene.time.now;
  const tick = () => {
    if (!spirit.active) { scene.events.off('update', tick); return; }
    const t = (scene.time.now - t0) / 1000;
    dim.setPosition(view().centerX, view().centerY);
    head.setAngle(Math.sin(t * 2) * 1.5);
    torso.setScale(1, 1 + Math.sin(t * 3.5) * 0.012);
    // the rainbow-fire aura behind him, as in the frame: flame tongues round his outline
    aura.clear();
    if (spirit.alpha > 0.05) for (let n = 0; n < 16; n++) {
      const a = -Math.PI / 2 + (n - 7.5) * 0.24, L = (90 + Math.sin(t * 9 + n * 1.3) * 18) * gs / 0.2;
      const bx = spirit.x + Math.cos(a) * 40 * gs / 0.2, by = spirit.y - 170 * gs / 0.2 + Math.sin(a) * 50 * gs / 0.2;
      const ex = bx + Math.cos(a) * L, ey = by + Math.sin(a) * L, nx = -Math.sin(a) * 14, ny = Math.cos(a) * 14;
      aura.fillStyle(n % 3 === 0 ? 0xffd23a : n % 3 === 1 ? 0xff4a1a : 0x7a3aff, 0.4 * spirit.alpha).fillTriangle(bx + nx, by + ny, bx - nx, by - ny, ex, ey);
    }
    orbHalo.setPosition(orb.x, orb.y).setScale(1 + Math.sin(t * 14) * 0.2);
  };
  scene.events.on('update', tick);
  // he draws both swords and raises them; the red energy gathers at his chest
  scene.time.delayedCall(SLASH_MS.draw, () => {
    if (!spirit.active) return;
    scene.tweens.add({ targets: swords[0], x: -150, y: -330, angle: -40, duration: 260, ease: 'Back.easeOut' });
    scene.tweens.add({ targets: swords[1], x: 150, y: -330, angle: 40, duration: 260, ease: 'Back.easeOut' });
    arms.forEach((a, n) => scene.tweens.add({ targets: a, angle: (n ? -1 : 1) * 150, duration: 260, ease: 'Back.easeOut' }));
    cam.shake(160, 0.006);
    for (const s of [-1, 1]) { // a glint runs along each blade
      const gl = scene.add.circle(wx + s * 30 * gs / 0.2, wy - 330 * gs, 5, 0xffffff, 1).setDepth(D.fx + 1).setBlendMode(Phaser.BlendModes.ADD);
      scene.tweens.add({ targets: gl, scale: 4, alpha: 0, duration: 300, onComplete: () => gl.destroy() });
    }
  });
  scene.time.delayedCall(SLASH_MS.charge, () => {
    if (!spirit.active) return;
    orb.setAlpha(1); orbHalo.setAlpha(1);
    scene.tweens.add({ targets: orb, scale: 2.4, duration: SLASH_MS.cut - SLASH_MS.charge, ease: 'Quad.easeIn' });
    const flow = scene.time.addEvent({ delay: 35, repeat: Math.floor((SLASH_MS.cut - SLASH_MS.charge) / 35), callback: () => {
      const a = rnd(0, Math.PI * 2), d = rnd(40, 70) * k, sp = scene.add.circle(orb.x + Math.cos(a) * d, orb.y + Math.sin(a) * d, rnd(1.5, 3), Math.random() < 0.5 ? RED : 0xffffff, 1).setDepth(D.fx).setBlendMode(Phaser.BlendModes.ADD);
      scene.tweens.add({ targets: sp, x: orb.x, y: orb.y, alpha: 0.2, duration: 220, ease: 'Quad.easeIn', onComplete: () => sp.destroy() });
    } });
    scene.time.delayedCall(SLASH_MS.cut - SLASH_MS.charge + 40, () => flow.remove());
  });
  // the cut: both swords come down in an X; two red slashes cross the pitch and the ball flies at their heart
  scene.time.delayedCall(SLASH_MS.cut, () => {
    if (!spirit.active) return;
    scene.tweens.add({ targets: swords[0], x: -40, y: -60, angle: 140, duration: 120, ease: 'Cubic.easeIn' });
    scene.tweens.add({ targets: swords[1], x: 40, y: -60, angle: -140, duration: 120, ease: 'Cubic.easeIn' });
    arms.forEach((a, n) => scene.tweens.add({ targets: a, angle: (n ? 1 : -1) * 20, duration: 120, ease: 'Cubic.easeIn' }));
    cam.shake(320, 0.014); cam.flash(110, 255, 80, 60);
    const { len, w, r } = slashSize(level);
    const ang = Math.atan2(ty - orb.y, tx - orb.x), ex = orb.x + Math.cos(ang) * len, ey = orb.y + Math.sin(ang) * len;
    hooks.onCross(orb.x, orb.y, ex, ey, w);
    // the X: two long red blades of light crossing on the line to the rival, a white core in each
    const mx = (orb.x + tx) / 2, my = (orb.y + ty) / 2;
    for (const [d, tilt] of [[0, 0.5], [70, -0.5]] as const) scene.time.delayedCall(d, () => {
      const a = ang + tilt, L = len * 0.9;
      const glow = scene.add.rectangle(mx, my, L, w * 0.7, RED, 0.6).setRotation(a).setDepth(D.fx).setBlendMode(Phaser.BlendModes.ADD).setScale(0, 1);
      const core = scene.add.rectangle(mx, my, L, w * 0.1, 0xffffff, 1).setRotation(a).setDepth(D.fx + 1).setScale(0, 1);
      scene.tweens.add({ targets: [glow, core], scaleX: 1, duration: 110, ease: 'Cubic.easeOut' });
      scene.tweens.add({ targets: [glow, core], scaleY: 0, alpha: 0, delay: 420, duration: 360, onComplete: () => { glow.destroy(); core.destroy(); } });
    });
    // the ball, red-hot, at the heart of the X
    scene.tweens.killTweensOf(orb);
    const ball = scene.add.image(orb.x, orb.y, 'fx:ball').setDepth(D.fx + 2).setScale(1.1);
    orb.setScale(2.4);
    let lastT = 0;
    scene.tweens.add({ targets: [ball, orb, orbHalo], x: tx, y: ty, duration: SLASH_MS.blast - SLASH_MS.cut, ease: 'Quad.easeIn',
      onUpdate: () => { if (scene.time.now - lastT > 16) { lastT = scene.time.now; const tr = scene.add.circle(ball.x, ball.y, 10 * k, RED, 0.6).setDepth(D.fx).setBlendMode(Phaser.BlendModes.ADD); scene.tweens.add({ targets: tr, scale: 0.2, alpha: 0, duration: 260, onComplete: () => tr.destroy() }); } } });
    scene.tweens.add({ targets: ball, angle: 900, duration: SLASH_MS.blast - SLASH_MS.cut });
    // the blast on the rival: a red X burst, rings, leaves blown away
    scene.time.delayedCall(SLASH_MS.blast - SLASH_MS.cut, () => {
      hooks.onBlast(tx, ty, r);
      fade(scene, ball, 0, 120); orb.setAlpha(0); orbHalo.setAlpha(0);
      cam.shake(360, 0.014);
      for (const s of [-1, 1]) {
        const x1 = scene.add.rectangle(tx, ty, r * 2.2, 14 * k, 0xffffff, 1).setRotation(s * Math.PI / 4).setDepth(D.fx + 1).setScale(0, 1);
        const x2 = scene.add.rectangle(tx, ty, r * 2.4, 40 * k, RED, 0.7).setRotation(s * Math.PI / 4).setDepth(D.fx).setBlendMode(Phaser.BlendModes.ADD).setScale(0, 1);
        scene.tweens.add({ targets: [x1, x2], scaleX: 1, duration: 120, ease: 'Cubic.easeOut' });
        scene.tweens.add({ targets: [x1, x2], scaleY: 0, alpha: 0, delay: 360, duration: 320, onComplete: () => { x1.destroy(); x2.destroy(); } });
      }
      for (const [d, col] of [[0, 0xffffff], [80, RED], [170, GOLD]] as const) {
        const ring = scene.add.ellipse(tx, ty, r * 0.6, r * 0.32).setStrokeStyle(5, col, 1).setDepth(D.fx - 1);
        scene.tweens.add({ targets: ring, scale: 3.6, alpha: 0, delay: d, duration: 560, ease: 'Cubic.easeOut', onComplete: () => ring.destroy() });
      }
      for (let n = 0; n < 18; n++) {
        const a = (n / 18) * Math.PI * 2, l = scene.add.image(tx, ty, leafTex(scene)).setDepth(D.fx).setScale(0.4).setTint(n % 2 ? 0xffffff : 0xff6040);
        scene.tweens.add({ targets: l, x: tx + Math.cos(a) * rnd(60, 140) * k, y: ty + Math.sin(a) * rnd(30, 80) * k, angle: rnd(-500, 500), alpha: 0, duration: 700, ease: 'Cubic.easeOut', onComplete: () => l.destroy() });
      }
    });
    scene.time.delayedCall(500, () => { if (spirit.active) scene.tweens.add({ targets: spirit, alpha: 0, y: spirit.y - 20, duration: 600, ease: 'Cubic.easeIn' }); });
  });
  const end = SLASH_MS.total;
  for (const o of live) if (o !== dim) fade(scene, o, end - 420, 400);
  scene.tweens.add({ targets: dim, alpha: 0, delay: end - 400, duration: 380, onComplete: () => dim.destroy() });
  scene.time.delayedCall(end, () => { scene.events.off('update', tick); leaves.remove(); });
}
