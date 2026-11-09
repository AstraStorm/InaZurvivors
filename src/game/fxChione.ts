/**
 * Lanza de carámbanos (author, from its scene in GO, lgiqWxtgaxg 0:12): the pitch goes dark blue and snow swirls in a
 * galaxy of cyan and violet; Chione rises behind the player (after the author's frame: a tall pale-mint crest of ice
 * spikes for a helmet, glowing cyan eyes, a spiky white fur collar with a cyan gem, a silver breastplate over a violet
 * suit, long mint hair streaming down both sides, the body tapering to a point, and her great spear with its jagged ice
 * blade). A blizzard wraps round the player, she sweeps the spear and the ball flies off inside a lance of ice; where it
 * lands, ice spikes burst out of the ground and freeze everything round.
 */
import Phaser from 'phaser';
import { canvasTex, D, fade, rnd } from './fxKeshin';

type S = Phaser.Scene;
const ICE = 0x9be7ff, ICE2 = 0xe8fbff, CYAN = 0x3ad8ff, VIOLET = 0x8a5aff;
const OUT = '#1a2a3a', MINT = '#cdeee6', MINT2 = '#9fd8cc', PURP = '#7a4ac8', PURP2 = '#a07ae8';

/** the head: the tall crest of ice spikes, the glowing cyan eyes under it, a pale chin; 220×300, the chin at (110, 292) */
function drawHead(c: CanvasRenderingContext2D) {
  const cx = 110;
  c.lineJoin = 'round';
  // the crest: a tall central spike and swept-back side spikes, pale mint, outlined
  const spike = (pts: [number, number][], fill: string) => { c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); for (const p of pts.slice(1)) c.lineTo(p[0], p[1]); c.closePath(); c.fillStyle = fill; c.fill(); c.lineWidth = 3.5; c.strokeStyle = OUT; c.stroke(); };
  for (const s of [-1, 1]) {
    spike([[cx + s * 20, 210], [cx + s * 96, 80], [cx + s * 54, 190]], MINT2);
    spike([[cx + s * 14, 190], [cx + s * 70, 40], [cx + s * 40, 180]], MINT);
  }
  spike([[cx - 26, 214], [cx, 4], [cx + 26, 214]], '#e4f8f2');
  c.beginPath(); c.moveTo(cx, 20); c.lineTo(cx, 200); c.lineWidth = 2; c.strokeStyle = '#9fd8cc'; c.stroke();
  // the helmet's brow and the face under it: a delicate woman's face, narrow pointed chin, almond eyes glowing cyan, small lips
  c.beginPath(); c.moveTo(cx - 36, 214); c.quadraticCurveTo(cx, 188, cx + 36, 214); c.lineTo(cx + 28, 246); c.quadraticCurveTo(cx, 238, cx - 28, 246); c.closePath();
  c.fillStyle = MINT; c.fill(); c.lineWidth = 3.5; c.strokeStyle = OUT; c.stroke();
  c.beginPath(); c.moveTo(cx - 22, 236); c.quadraticCurveTo(cx - 24, 262, cx - 10, 282); c.quadraticCurveTo(cx, 294, cx + 10, 282); c.quadraticCurveTo(cx + 24, 262, cx + 22, 236); c.closePath();
  c.fillStyle = '#f8e8dc'; c.fill(); c.lineWidth = 3; c.stroke();
  c.fillStyle = '#c8b0b8'; c.beginPath(); c.moveTo(cx - 22, 236); c.quadraticCurveTo(cx, 244, cx + 22, 236); c.lineTo(cx + 22, 246); c.quadraticCurveTo(cx, 252, cx - 22, 246); c.closePath(); c.fill(); // the brow's soft shadow
  c.shadowColor = '#3ad8ff'; c.shadowBlur = 10; c.fillStyle = '#9ff4ff';
  for (const s of [-1, 1]) { c.beginPath(); c.moveTo(cx + s * 4, 254); c.quadraticCurveTo(cx + s * 12, 246, cx + s * 19, 250); c.quadraticCurveTo(cx + s * 12, 258, cx + s * 4, 254); c.closePath(); c.fill(); }
  c.shadowBlur = 0;
  c.lineWidth = 2; c.strokeStyle = OUT; for (const s of [-1, 1]) { c.beginPath(); c.moveTo(cx + s * 3, 252); c.quadraticCurveTo(cx + s * 12, 243, cx + s * 21, 249); c.stroke(); } // lashes
  c.lineWidth = 1.5; c.beginPath(); c.moveTo(cx, 262); c.lineTo(cx - 2, 268); c.stroke(); // the nose, a stroke
  c.fillStyle = '#c86a7a'; c.beginPath(); c.moveTo(cx - 5, 276); c.quadraticCurveTo(cx, 273, cx + 5, 276); c.quadraticCurveTo(cx, 280, cx - 5, 276); c.fill(); // small lips
}
/** the long mint hair, one side (mirrored for the other): long ribbons from the head down past the waist; 160×420, from (20, 20) */
function drawHair(c: CanvasRenderingContext2D) {
  c.lineCap = 'round'; c.lineJoin = 'round';
  for (const [off, w, col] of [[0, 30, MINT2], [26, 22, MINT], [48, 16, '#e4f8f2']] as const) {
    c.beginPath(); c.moveTo(24 + off * 0.3, 20); c.bezierCurveTo(96 + off * 0.5, 110, 64 + off * 0.5, 280, 124 + off * 0.3, 410); // sweeping out in a wide curve, as in the frame
    c.lineWidth = w + 6; c.strokeStyle = OUT; c.stroke(); c.lineWidth = w; c.strokeStyle = col; c.stroke();
  }
  c.beginPath(); c.moveTo(30, 40); c.bezierCurveTo(100, 130, 70, 290, 126, 400); c.lineWidth = 3; c.strokeStyle = PURP2; c.stroke(); // a violet sheen
}
/** the body (author: «ha de ser una mujer»): a slender woman — narrow shoulders under the spiky white fur collar and its
 *  cyan gem, a silver breastplate shaped to the bust, a narrow waist in the violet suit, the hips flaring into the long
 *  pale robe that tapers to a point; 260×360, the point at (130, 356) */
function drawTorso(c: CanvasRenderingContext2D) {
  const cx = 130;
  c.lineJoin = 'round';
  // the robe: from the hips, a long pale tail narrowing to a point, its flared tips at the hips
  c.beginPath(); c.moveTo(cx - 40, 196); c.bezierCurveTo(cx - 58, 240, cx - 30, 300, cx, 356); c.bezierCurveTo(cx + 30, 300, cx + 58, 240, cx + 40, 196); c.closePath();
  const g = c.createLinearGradient(0, 190, 0, 356); g.addColorStop(0, MINT); g.addColorStop(0.7, MINT2); g.addColorStop(1, '#1a2a3a');
  c.fillStyle = g; c.fill(); c.lineWidth = 3.5; c.strokeStyle = OUT; c.stroke();
  for (const s of [-1, 1]) { // the robe's flared, pointed lapels at the hips
    c.beginPath(); c.moveTo(cx + s * 12, 190); c.lineTo(cx + s * 50, 186); c.lineTo(cx + s * 62, 232); c.lineTo(cx + s * 40, 214); c.lineTo(cx + s * 30, 246); c.closePath();
    c.fillStyle = '#e4f8f2'; c.fill(); c.lineWidth = 3; c.stroke();
  }
  // the violet suit: narrow waist, hips, the scaled pattern down the front
  c.beginPath(); c.moveTo(cx - 34, 84); c.quadraticCurveTo(cx - 20, 140, cx - 22, 160); c.quadraticCurveTo(cx - 40, 184, cx - 36, 200); c.lineTo(cx, 214); c.lineTo(cx + 36, 200); c.quadraticCurveTo(cx + 40, 184, cx + 22, 160); c.quadraticCurveTo(cx + 20, 140, cx + 34, 84); c.closePath();
  c.fillStyle = PURP; c.fill(); c.lineWidth = 3.5; c.strokeStyle = OUT; c.stroke();
  c.strokeStyle = '#5a2aa0'; c.lineWidth = 2; c.beginPath(); for (const y of [140, 158, 176, 192]) { c.moveTo(cx - 18, y); c.lineTo(cx, y + 8); c.lineTo(cx + 18, y); } c.stroke();
  // the silver breastplate, shaped to the bust, ending above the waist
  c.beginPath(); c.moveTo(cx - 36, 82); c.quadraticCurveTo(cx - 44, 108, cx - 30, 122); c.quadraticCurveTo(cx - 14, 132, cx, 120); c.quadraticCurveTo(cx + 14, 132, cx + 30, 122); c.quadraticCurveTo(cx + 44, 108, cx + 36, 82); c.quadraticCurveTo(cx, 72, cx - 36, 82); c.closePath();
  const b = c.createLinearGradient(0, 74, 0, 132); b.addColorStop(0, '#f6f9fc'); b.addColorStop(1, '#8e9cae'); c.fillStyle = b; c.fill(); c.lineWidth = 3; c.strokeStyle = OUT; c.stroke();
  c.lineWidth = 2; c.beginPath(); c.moveTo(cx, 96); c.lineTo(cx, 120); c.stroke();
  for (const s of [-1, 1]) { c.beginPath(); c.ellipse(cx + s * 16, 106, 7, 5, s * 0.4, 0, Math.PI * 2); c.fillStyle = '#ffffffaa'; c.fill(); } // the shine on the curves
  c.beginPath(); c.moveTo(cx - 24, 128); c.lineTo(cx, 140); c.lineTo(cx + 24, 128); c.lineTo(cx + 18, 138); c.lineTo(cx, 148); c.lineTo(cx - 18, 138); c.closePath(); c.fillStyle = '#c8d0dc'; c.fill(); c.lineWidth = 2; c.stroke(); // a plate under it
  // the spiky white fur collar round narrow shoulders, its cyan gem
  c.beginPath();
  for (let n = 0; n <= 12; n++) { const a = Math.PI + (n / 12) * Math.PI, r = n % 2 ? 38 : 70; c.lineTo(cx + Math.cos(a) * r * 1.2, 72 + Math.sin(a) * r * 0.45 + (n % 2 ? 2 : 10)); }
  for (let n = 12; n >= 0; n--) { const a = Math.PI + (n / 12) * Math.PI; c.lineTo(cx + Math.cos(a) * 26, 76 + Math.sin(a) * 10); }
  c.closePath(); c.fillStyle = '#f8fcff'; c.fill(); c.lineWidth = 3; c.strokeStyle = OUT; c.stroke();
  c.beginPath(); c.ellipse(cx, 72, 9, 7, 0, 0, Math.PI * 2); c.fillStyle = '#3ad8ff'; c.fill(); c.lineWidth = 2.5; c.stroke();
  c.beginPath(); c.ellipse(cx - 2, 70, 3, 2, 0, 0, Math.PI * 2); c.fillStyle = '#e8fbff'; c.fill();
}
/** a slender arm from the shoulder at (30, 10) on 60×150: violet sleeve, white fur cuff, a long-fingered hand */
function drawArm(c: CanvasRenderingContext2D) {
  const sx = 30;
  c.lineJoin = 'round';
  c.beginPath(); c.ellipse(sx, 50, 9, 40, 0, 0, Math.PI * 2); c.fillStyle = PURP2; c.fill(); c.lineWidth = 3; c.strokeStyle = OUT; c.stroke();
  c.beginPath(); for (let n = 0; n <= 6; n++) c.lineTo(sx - 12 + n * 4, 92 + (n % 2 ? 8 : 0)); c.lineTo(sx + 12, 84); c.lineTo(sx - 12, 84); c.closePath(); c.fillStyle = '#f8fcff'; c.fill(); c.stroke();
  c.beginPath(); c.ellipse(sx, 112, 7, 12, 0, 0, Math.PI * 2); c.fillStyle = '#f0d8c0'; c.fill(); c.lineWidth = 2.5; c.stroke();
  c.lineWidth = 2; for (const d of [-4, 0, 4]) { c.beginPath(); c.moveTo(sx + d, 120); c.lineTo(sx + d * 1.2, 132); c.stroke(); } // slim fingers
}
/** the spear: a long dark shaft and the jagged ice blade; 60×460, the grip at (30, 300), the blade up */
function drawSpear(c: CanvasRenderingContext2D) {
  c.lineJoin = 'round';
  c.fillStyle = '#1a2a5a'; c.fillRect(25, 150, 10, 300); c.strokeStyle = OUT; c.lineWidth = 3; c.strokeRect(25, 150, 10, 300);
  c.fillStyle = '#c8d8ff'; c.fillRect(22, 146, 16, 10); c.strokeRect(22, 146, 16, 10);
  c.beginPath(); c.moveTo(30, 0); c.lineTo(44, 40); c.lineTo(38, 44); c.lineTo(52, 80); c.lineTo(42, 84); c.lineTo(54, 118); c.lineTo(36, 148); c.lineTo(24, 148); c.lineTo(6, 116); c.lineTo(18, 86); c.lineTo(8, 80); c.lineTo(22, 46); c.lineTo(16, 40); c.closePath();
  const g = c.createLinearGradient(0, 0, 60, 0); g.addColorStop(0, '#c8b8ff'); g.addColorStop(0.5, '#f2fbff'); g.addColorStop(1, '#9fd8ff');
  c.fillStyle = g; c.fill(); c.lineWidth = 3; c.strokeStyle = '#3a4a7a'; c.stroke();
  c.beginPath(); c.moveTo(30, 10); c.lineTo(30, 140); c.lineWidth = 1.5; c.strokeStyle = '#ffffff'; c.stroke();
}
const headTex = (scene: S) => canvasTex(scene, 'chione-head2', 220, 300, (c) => drawHead(c));
const hairTex = (scene: S) => canvasTex(scene, 'chione-hair3', 160, 420, (c) => drawHair(c));
const torsoTex = (scene: S) => canvasTex(scene, 'chione-torso2', 260, 360, (c) => drawTorso(c));
const armTex = (scene: S) => canvasTex(scene, 'chione-arm2', 60, 150, (c) => drawArm(c));
const spearTex = (scene: S) => canvasTex(scene, 'chione-spear', 60, 460, (c) => drawSpear(c));
/** a snowflake: six arms with their little branches */
const flakeTex = (scene: S) => canvasTex(scene, 'snowflake', 32, 32, (c) => {
  c.translate(16, 16); c.strokeStyle = '#f2fbff'; c.lineWidth = 2; c.lineCap = 'round';
  for (let n = 0; n < 6; n++) { c.save(); c.rotate((n / 6) * Math.PI * 2); c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -13); c.moveTo(0, -7); c.lineTo(-4, -11); c.moveTo(0, -7); c.lineTo(4, -11); c.stroke(); c.restore(); }
});
/** an ice spike out of the ground: a pale crystal with a light face; 40×90, its base at (20, 88) */
const spikeTex = (scene: S) => canvasTex(scene, 'ice-spike', 40, 90, (c) => {
  c.beginPath(); c.moveTo(20, 2); c.lineTo(36, 88); c.lineTo(4, 88); c.closePath();
  const g = c.createLinearGradient(4, 0, 36, 0); g.addColorStop(0, '#7ac8ff'); g.addColorStop(0.5, '#f2fbff'); g.addColorStop(1, '#5aa8e8');
  c.fillStyle = g; c.fill(); c.lineWidth = 2; c.strokeStyle = '#2a5a9a'; c.stroke();
  c.beginPath(); c.moveTo(20, 6); c.lineTo(20, 86); c.lineWidth = 1.5; c.strokeStyle = '#ffffff'; c.stroke();
});

export interface IceHooks {
  /** the lance flies from (x0, y0) to (x1, y1), `width` wide (the scene hurts what it passes through) */
  onLance: (x0: number, y0: number, x1: number, y1: number, width: number) => void;
  /** it lands at (x, y): ice spikes burst out `r` round and freeze everything there */
  onBurst: (x: number, y: number, r: number) => void;
  /** where the player is now */
  at: () => { x: number; y: number };
}
/** times of the scene, ms */
export const ICE_MS = { rise: 360, swirl: 900, sweep: 1450, kick: 1600, land: 1900, total: 2900 };
/** the lance's width and the burst, by level (an ultimate: wide) */
export const iceSize = (level: number) => ({ len: 340 + level * 18, w: 54 + level * 5, r: 120 + level * 11 });

/** Lanza de carámbanos. (x, y) the player's feet, (tx, ty) the rival. Visual only: the scene deals the damage in the hooks. */
export function iceLance(scene: S, x: number, y: number, tx: number, ty: number, level: number, hooks: IceHooks) {
  const k = 1 + level * 0.05, side = tx >= x ? 1 : -1, cam = scene.cameras.main, view = () => cam.worldView;
  const live: Phaser.GameObjects.GameObject[] = [];
  const keep = <T extends Phaser.GameObjects.GameObject>(o: T) => { live.push(o); return o; };
  // the night of ice: dark blue, a galaxy of cyan and violet behind her, snow falling
  const dim = keep(scene.add.rectangle(view().centerX, view().centerY, view().width * 2, view().height * 2, 0x040a24, 1).setDepth(D.dim).setAlpha(0));
  scene.tweens.add({ targets: dim, alpha: 0.66, duration: 260 });
  const galaxy = keep(scene.add.graphics().setDepth(D.giant - 2).setBlendMode(Phaser.BlendModes.ADD));
  const snow = scene.time.addEvent({ delay: 45, repeat: Math.floor(ICE_MS.total / 45) - 8, callback: () => {
    const f = scene.add.image(view().left + rnd(0, view().width), view().top - 10, flakeTex(scene)).setDepth(D.fx).setScale(rnd(0.25, 0.6)).setAlpha(rnd(0.6, 1));
    scene.tweens.add({ targets: f, x: f.x + rnd(-80, 80), y: f.y + view().height * rnd(0.6, 1.1), angle: rnd(-200, 200), alpha: 0, duration: rnd(1500, 2400), onComplete: () => f.destroy() });
  } });
  // ---- Chione behind the player: hair, robe and body, arms, the spear, the crested head
  const gs = 0.19 * k, wx = x - side * 6, wy = y + 10;
  const spirit = keep(scene.add.container(wx, wy).setDepth(D.giant).setScale(gs * 0.3).setAlpha(0));
  const hair = [-1, 1].map((s) => scene.add.image(s * 14, -320, hairTex(scene)).setOrigin(20 / 160, 20 / 420).setFlipX(s < 0).setOrigin(s < 0 ? 1 - 20 / 160 : 20 / 160, 20 / 420));
  const torso = scene.add.image(0, 0, torsoTex(scene)).setOrigin(0.5, 356 / 360);
  const spear = scene.add.image(side * 40, -170, spearTex(scene)).setOrigin(0.5, 300 / 460).setAngle(-side * 62).setScale(1.3).setFlipX(side < 0);
  const arms = [-1, 1].map((s) => scene.add.image(s * 38, -280, armTex(scene)).setOrigin(0.5, 10 / 150).setAngle(s * -20));
  const head = scene.add.image(0, -282, headTex(scene)).setOrigin(0.5, 292 / 300).setScale(0.95);
  spirit.add([...hair, torso, spear, ...arms, head]);
  try { spirit.postFX?.addGlow(0x9be7ff, 3, 0, false, 0.1, 10); } catch { /* canvas renderer: no glow */ }
  scene.tweens.add({ targets: spirit, alpha: 1, scaleX: gs, scaleY: gs, delay: ICE_MS.rise, duration: 460, ease: 'Back.easeOut' });
  const blizzard = keep(scene.add.graphics().setDepth(D.giant + 3).setBlendMode(Phaser.BlendModes.ADD));
  let swirl = 0; // the blizzard round the player (0..1)
  const t0 = scene.time.now;
  const tick = () => {
    if (!spirit.active) { scene.events.off('update', tick); return; }
    const t = (scene.time.now - t0) / 1000, p = hooks.at();
    dim.setPosition(view().centerX, view().centerY);
    hair.forEach((h, n) => h.setAngle((n ? -1 : 1) * (4 + Math.sin(t * 2.6 + n) * 4))); // the hair flows
    head.setAngle(Math.sin(t * 2) * 1.5);
    // the galaxy: rays of cyan and violet bursting out from behind her
    galaxy.clear();
    if (spirit.alpha > 0.05) {
      const gx = spirit.x, gy = spirit.y - 200 * gs;
      galaxy.fillStyle(CYAN, 0.1 * spirit.alpha).fillCircle(gx, gy, 70 * k).fillStyle(VIOLET, 0.08 * spirit.alpha).fillCircle(gx, gy, 110 * k);
      for (let n = 0; n < 16; n++) {
        const a = (n / 16) * Math.PI * 2 + t * 0.4, L = (120 + Math.sin(t * 5 + n * 2.1) * 26) * k;
        galaxy.fillStyle(n % 2 ? CYAN : VIOLET, 0.06 * spirit.alpha).fillTriangle(gx, gy, gx + Math.cos(a - 0.08) * L, gy + Math.sin(a - 0.08) * L, gx + Math.cos(a + 0.08) * L, gy + Math.sin(a + 0.08) * L);
      }
    }
    // the blizzard: spiralling streaks of snow round the player
    blizzard.clear();
    if (swirl > 0) for (let n = 0; n < 7; n++) {
      blizzard.lineStyle(3 - (n % 2), n % 3 ? ICE2 : CYAN, 0.6 * swirl).beginPath();
      for (let u = 0; u <= 1.001; u += 0.08) {
        const a = u * Math.PI * 2.2 + t * 7 + n * 0.9, r = (14 + u * 36) * k * swirl, px = p.x + Math.cos(a) * r, py = p.y - 8 - u * 40 * k + Math.sin(a) * r * 0.35;
        if (u === 0) blizzard.moveTo(px, py); else blizzard.lineTo(px, py);
      }
      blizzard.strokePath();
    }
  };
  scene.events.on('update', tick);
  // the blizzard wraps round the player and the ball
  scene.time.delayedCall(ICE_MS.swirl, () => { if (spirit.active) scene.tweens.addCounter({ from: 0, to: 1, duration: 300, onUpdate: (tw) => { swirl = tw.getValue() ?? 0; } }); });
  // she sweeps the spear down across; the player kicks
  scene.time.delayedCall(ICE_MS.sweep, () => {
    if (!spirit.active) return;
    scene.tweens.add({ targets: spear, angle: side * 70, x: side * 40, duration: 180, ease: 'Cubic.easeIn' });
    arms.forEach((a, n) => scene.tweens.add({ targets: a, angle: (n ? -1 : 1) * 70 * side, duration: 180, ease: 'Cubic.easeIn' }));
    cam.shake(200, 0.008);
  });
  scene.time.delayedCall(ICE_MS.kick, () => {
    if (!spirit.active) return;
    scene.tweens.addCounter({ from: 1, to: 0, duration: 260, onUpdate: (tw) => { swirl = tw.getValue() ?? 0; } });
    const p = hooks.at(), { len, w, r } = iceSize(level);
    const ang = Math.atan2(ty - p.y, tx - p.x), x0 = p.x, y0 = p.y - 8, x1 = x0 + Math.cos(ang) * len, y1 = y0 + Math.sin(ang) * len;
    hooks.onLance(x0, y0, x1, y1, w);
    cam.flash(110, 200, 240, 255);
    // the lance: a long spike of ice with the ball at its tip, a frost trail behind it
    const lance = scene.add.image(x0, y0, spikeTex(scene)).setDepth(D.fx + 1).setOrigin(0.5, 0.06).setRotation(ang - Math.PI / 2).setScale(w / 40 * 0.9, 0.2);
    const ball = scene.add.image(x0, y0, 'fx:ball').setDepth(D.fx + 2);
    const trail = scene.add.rectangle(x0, y0, len, w * 0.8, ICE, 0.35).setOrigin(0, 0.5).setRotation(ang).setDepth(D.fx).setBlendMode(Phaser.BlendModes.ADD).setScale(0, 1);
    scene.tweens.add({ targets: trail, scaleX: 1, duration: ICE_MS.land - ICE_MS.kick, ease: 'Quad.easeOut', onComplete: () => scene.tweens.add({ targets: trail, scaleY: 0, alpha: 0, duration: 400, onComplete: () => trail.destroy() }) });
    let lastT = 0;
    scene.tweens.add({ targets: [ball, lance], x: tx, y: ty, duration: ICE_MS.land - ICE_MS.kick, ease: 'Quad.easeIn',
      onUpdate: () => {
        lance.setScale(w / 40 * 0.9, Math.min(1.6, lance.scaleY + 0.08));
        if (scene.time.now - lastT < 20) return;
        lastT = scene.time.now;
        const f = scene.add.image(ball.x + rnd(-w, w) * 0.4, ball.y + rnd(-w, w) * 0.4, flakeTex(scene)).setDepth(D.fx).setScale(rnd(0.3, 0.6));
        scene.tweens.add({ targets: f, scale: 0.1, alpha: 0, angle: 180, duration: 500, onComplete: () => f.destroy() });
      },
      onComplete: () => {
        // the burst: ice spikes out of the ground all round, frost rings, everything there frozen
        hooks.onBurst(tx, ty, r);
        fade(scene, ball, 0, 120); fade(scene, lance, 0, 160);
        cam.shake(380, 0.014);
        for (const [d, col] of [[0, 0xffffff], [70, CYAN], [150, VIOLET]] as const) {
          const ring = scene.add.ellipse(tx, ty, r * 0.5, r * 0.28).setStrokeStyle(5, col, 1).setDepth(D.fx - 1);
          scene.tweens.add({ targets: ring, scale: 4, alpha: 0, delay: d, duration: 600, ease: 'Cubic.easeOut', onComplete: () => ring.destroy() });
        }
        const frost = scene.add.ellipse(tx, ty, r * 2, r * 1.1, ICE, 0.35).setDepth(ty - 3).setBlendMode(Phaser.BlendModes.ADD).setScale(0.2);
        scene.tweens.add({ targets: frost, scale: 1, duration: 200, ease: 'Cubic.easeOut', onComplete: () => fade(scene, frost, 700, 500) });
        const n = 16 + level * 2;
        for (let s = 0; s < n; s++) {
          const a = (s / n) * Math.PI * 2 + rnd(-0.15, 0.15), d = r * Math.sqrt(rnd(0.05, 1)), px = tx + Math.cos(a) * d, py = ty + Math.sin(a) * d * 0.55;
          const sp = scene.add.image(px, py, spikeTex(scene)).setOrigin(0.5, 88 / 90).setDepth(py).setScale(rnd(0.3, 0.55) * k, 0).setAngle(rnd(-14, 14));
          scene.tweens.add({ targets: sp, scaleY: rnd(0.4, 0.8) * k, delay: s * 12, duration: 140, ease: 'Back.easeOut', onComplete: () => scene.tweens.add({ targets: sp, alpha: 0, scaleY: 0.2, delay: 600, duration: 360, onComplete: () => sp.destroy() }) });
        }
        for (let s = 0; s < 14; s++) { // shards of ice flying off
          const a = rnd(0, Math.PI * 2), sh = scene.add.rectangle(tx, ty - 10, rnd(3, 6), rnd(8, 14), 0xe8fbff, 1).setDepth(D.fx).setRotation(a);
          scene.tweens.add({ targets: sh, x: tx + Math.cos(a) * rnd(50, 120) * k, y: ty - 10 + Math.sin(a) * rnd(30, 80) * k, angle: rnd(-300, 300), alpha: 0, duration: 560, ease: 'Cubic.easeOut', onComplete: () => sh.destroy() });
        }
      } });
    scene.time.delayedCall(380, () => { if (spirit.active) scene.tweens.add({ targets: spirit, alpha: 0, y: spirit.y - 24, duration: 640, ease: 'Cubic.easeIn' }); });
  });
  const end = ICE_MS.total;
  for (const o of live) if (o !== dim) fade(scene, o, end - 420, 400);
  scene.tweens.add({ targets: dim, alpha: 0, delay: end - 400, duration: 380, onComplete: () => dim.destroy() });
  scene.time.delayedCall(end, () => { scene.events.off('update', tick); snow.remove(); });
}
