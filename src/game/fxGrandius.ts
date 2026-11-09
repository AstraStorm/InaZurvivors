/**
 * Mano grandiosa (author's portrait of the spirit): Mágico gigante Grandius, a golden demon — a huge mane of red flames,
 * two long golden horns sweeping back from the brow, pointed ears, a roaring fanged mouth, a muscular golden body crackling
 * with yellow lightning. He rises behind the keeper in a column of golden lightning, roars (the roar alone pushes the
 * rivals back), draws back his right arm and thrusts his giant open hand forward: the palm slams down on the rivals, the
 * ground cracks in its print and a golden wave runs across the pitch swallowing every rival shot.
 * The anime scene (author, V78B1o7cWfE): he is enormous behind the keeper, his golden body edged in orange fire, dark
 * spiral tattoos on the shoulders and arms; he raises his open hand and a white-blue whirlwind spins into the palm before
 * he thrusts it out.
 */
import Phaser from 'phaser';
import { canvasTex, D, fade, rnd } from './fxKeshin';

type S = Phaser.Scene;
const GOLD = 0xffd84a, GOLD2 = 0xfff2a8, FLAME = 0xff5a1a;
const OUT = '#3a1a00';

/** golden skin: light at the top, amber shade below */
const skin = (c: CanvasRenderingContext2D, y0: number, y1: number) => {
  const g = c.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, '#fff3a0'); g.addColorStop(0.5, '#ffd23a'); g.addColorStop(1, '#d08a10'); return g;
};

/** a dark spiral tattoo (the scene's marks on his shoulders and arms) */
const spiral = (c: CanvasRenderingContext2D, x: number, y: number, r: number, turn = 1) => {
  c.beginPath();
  for (let a = 0; a <= Math.PI * 4.2; a += 0.12) { const rr = r * (1 - a / (Math.PI * 4.6)); const px = x + Math.cos(a * turn) * rr, py = y + Math.sin(a * turn) * rr; if (a === 0) c.moveTo(px, py); else c.lineTo(px, py); }
  c.lineWidth = r * 0.22; c.strokeStyle = '#6a2a00'; c.lineCap = 'round'; c.stroke();
};
/** the head: the flame mane, the swept golden horns, pointed ears, the roaring face; 360×300, chin at (180, 290) */
function drawHead(c: CanvasRenderingContext2D) {
  const cx = 180;
  c.lineJoin = 'round'; c.lineCap = 'round';
  // the mane of red flames: tongues fanning up and out behind the head
  const tongues = 15;
  c.beginPath(); c.moveTo(cx - 70, 200);
  for (let n = 0; n <= tongues; n++) {
    const a = Math.PI * (1.02 + n / tongues * 0.96), r = n % 2 ? 140 : 168 + (n % 4 === 0 ? 8 : 0);
    const tip = { x: cx + Math.cos(a) * r * 1.05, y: 170 + Math.sin(a) * r };
    const a2 = a + Math.PI / tongues * 0.5, r2 = 82;
    c.quadraticCurveTo(cx + Math.cos(a - 0.12) * r * 0.8, 170 + Math.sin(a - 0.12) * r * 0.8, tip.x, tip.y);
    c.quadraticCurveTo(cx + Math.cos(a2) * r2 * 1.1, 170 + Math.sin(a2) * r2, cx + Math.cos(a2 + 0.08) * r2, 170 + Math.sin(a2 + 0.08) * r2);
  }
  c.lineTo(cx + 70, 200); c.closePath();
  const fg = c.createRadialGradient(cx, 170, 30, cx, 150, 160); fg.addColorStop(0, '#ff8a2a'); fg.addColorStop(0.4, '#ee3a14'); fg.addColorStop(1, '#a01008');
  c.fillStyle = fg; c.fill(); c.lineWidth = 4; c.strokeStyle = '#5a0800'; c.stroke();
  c.strokeStyle = '#ffd06a'; c.lineWidth = 3; // light strands in the flames
  for (let n = 0; n < 9; n++) { const a = Math.PI * (1.1 + n / 8 * 0.8); c.beginPath(); c.moveTo(cx + Math.cos(a) * 70, 170 + Math.sin(a) * 66); c.quadraticCurveTo(cx + Math.cos(a - 0.1) * 100, 170 + Math.sin(a - 0.1) * 96, cx + Math.cos(a) * 124, 170 + Math.sin(a) * 118); c.stroke(); }
  // the long golden horns, sweeping out from the brow and curving up
  for (const s of [-1, 1]) {
    c.beginPath(); c.moveTo(cx + s * 14, 146); c.bezierCurveTo(cx + s * 70, 124, cx + s * 130, 100, cx + s * 168, 14);
    c.bezierCurveTo(cx + s * 150, 110, cx + s * 100, 178, cx + s * 40, 190); c.closePath();
    c.fillStyle = skin(c, 40, 172); c.fill(); c.lineWidth = 3.5; c.strokeStyle = OUT; c.stroke();
    c.beginPath(); c.moveTo(cx + s * 34, 152); c.bezierCurveTo(cx + s * 84, 134, cx + s * 130, 106, cx + s * 158, 40); c.lineWidth = 3; c.strokeStyle = '#fff8c8'; c.stroke();
  }
  // pointed ears
  for (const s of [-1, 1]) {
    c.beginPath(); c.moveTo(cx + s * 48, 196); c.lineTo(cx + s * 92, 168); c.lineTo(cx + s * 56, 226); c.closePath();
    c.fillStyle = skin(c, 168, 226); c.fill(); c.lineWidth = 3; c.strokeStyle = OUT; c.stroke();
  }
  // the face: a broad jaw, heavy brow
  c.beginPath(); c.moveTo(cx - 50, 160); c.quadraticCurveTo(cx, 140, cx + 50, 160); c.lineTo(cx + 56, 220); c.quadraticCurveTo(cx + 40, 282, cx, 290); c.quadraticCurveTo(cx - 40, 282, cx - 56, 220); c.closePath();
  c.fillStyle = skin(c, 140, 290); c.fill(); c.lineWidth = 4; c.strokeStyle = OUT; c.stroke();
  // the brow ridge, angry, and the eyes glowing white under it
  c.beginPath(); c.moveTo(cx - 50, 180); c.lineTo(cx - 6, 198); c.lineTo(cx, 190); c.lineTo(cx + 6, 198); c.lineTo(cx + 50, 180); c.lineTo(cx + 46, 170); c.lineTo(cx, 180); c.lineTo(cx - 46, 170); c.closePath();
  c.fillStyle = '#c87a08'; c.fill(); c.lineWidth = 3; c.stroke();
  c.shadowColor = '#ffffff'; c.shadowBlur = 12; c.fillStyle = '#ffffff';
  for (const s of [-1, 1]) { c.beginPath(); c.moveTo(cx + s * 10, 204); c.lineTo(cx + s * 40, 192); c.lineTo(cx + s * 34, 208); c.closePath(); c.fill(); }
  c.shadowBlur = 0;
  c.lineWidth = 3; c.strokeStyle = OUT; c.beginPath(); c.moveTo(cx - 6, 214); c.lineTo(cx - 10, 232); c.lineTo(cx + 10, 232); c.lineTo(cx + 6, 214); c.stroke(); // the nose
  for (const s of [-1, 1]) { c.beginPath(); c.moveTo(cx + s * 16, 230); c.quadraticCurveTo(cx + s * 30, 240, cx + s * 30, 254); c.stroke(); } // snarl lines
  // the roaring mouth: dark inside, red tongue, fangs top and bottom
  c.beginPath(); c.moveTo(cx - 26, 244); c.quadraticCurveTo(cx, 236, cx + 26, 244); c.quadraticCurveTo(cx + 22, 278, cx, 280); c.quadraticCurveTo(cx - 22, 278, cx - 26, 244); c.closePath();
  c.fillStyle = '#4a0808'; c.fill(); c.lineWidth = 3.5; c.stroke();
  c.beginPath(); c.ellipse(cx, 272, 13, 6, 0, 0, Math.PI * 2); c.fillStyle = '#e04a4a'; c.fill();
  c.fillStyle = '#ffffff'; c.lineWidth = 1.5;
  for (const [x, y0, d] of [[-20, 245, 12], [-8, 242, 7], [8, 242, 7], [20, 245, 12], [-16, 276, -9], [16, 276, -9]] as const) { c.beginPath(); c.moveTo(cx + x - 4, y0); c.lineTo(cx + x, y0 + d); c.lineTo(cx + x + 4, y0); c.closePath(); c.fill(); c.stroke(); }
}
/** the body: broad golden shoulders and chest, the abs, lightning spikes crackling out of it; 440×320, the waist at (220, 316) */
function drawTorso(c: CanvasRenderingContext2D) {
  const cx = 220;
  c.lineJoin = 'round';
  c.beginPath(); c.moveTo(cx - 60, 30); c.quadraticCurveTo(cx - 150, 30, cx - 170, 90); c.quadraticCurveTo(cx - 130, 110, cx - 100, 150);
  c.quadraticCurveTo(cx - 70, 250, cx - 66, 316); c.lineTo(cx + 66, 316); c.quadraticCurveTo(cx + 70, 250, cx + 100, 150);
  c.quadraticCurveTo(cx + 130, 110, cx + 170, 90); c.quadraticCurveTo(cx + 150, 30, cx + 60, 30); c.quadraticCurveTo(cx, 50, cx - 60, 30); c.closePath();
  c.fillStyle = skin(c, 30, 316); c.fill(); c.lineWidth = 4.5; c.strokeStyle = OUT; c.stroke();
  // muscles: pecs, the line down the middle, abs, the shoulder balls
  c.lineWidth = 3; c.strokeStyle = '#a86000';
  for (const s of [-1, 1]) {
    c.beginPath(); c.moveTo(cx, 76); c.quadraticCurveTo(cx + s * 50, 70, cx + s * 92, 96); c.quadraticCurveTo(cx + s * 80, 150, cx + s * 4, 146); c.stroke();
    c.beginPath(); c.arc(cx + s * 126, 84, 36, s < 0 ? Math.PI * 0.6 : -Math.PI * 0.4, s < 0 ? Math.PI * 1.5 : Math.PI * 0.5); c.stroke();
  }
  c.beginPath(); c.moveTo(cx, 80); c.lineTo(cx, 300); c.stroke();
  for (const y of [180, 220, 260]) { c.beginPath(); c.moveTo(cx - 40, y - 4); c.quadraticCurveTo(cx - 20, y + 6, cx, y); c.quadraticCurveTo(cx + 20, y + 6, cx + 40, y - 4); c.stroke(); }
  c.fillStyle = '#fff8c0'; for (const s of [-1, 1]) { c.beginPath(); c.ellipse(cx + s * 46, 96, 18, 10, s * 0.3, 0, Math.PI * 2); c.fill(); c.beginPath(); c.ellipse(cx + s * 132, 66, 14, 8, s * -0.5, 0, Math.PI * 2); c.fill(); }
  for (const s of [-1, 1]) { spiral(c, cx + s * 126, 80, 24, s); spiral(c, cx + s * 52, 120, 15, -s); } // the tattoos
  // the yellow lightning spikes crackling out of the shoulders and the flanks
  c.fillStyle = '#fff36a'; c.strokeStyle = OUT; c.lineWidth = 2.5;
  for (const [x, y, a, L] of [[-150, 60, -2.4, 70], [150, 60, -0.74, 70], [-104, 170, -2.9, 60], [104, 170, -0.24, 60], [-90, 240, 2.9, 50], [90, 240, 0.24, 50]] as const) {
    const nx = -Math.sin(a) * 8, ny = Math.cos(a) * 8, mx = cx + x + Math.cos(a) * L * 0.5, my = y + Math.sin(a) * L * 0.5;
    c.beginPath(); c.moveTo(cx + x + nx, y + ny); c.lineTo(mx + nx * 2, my + ny * 2); c.lineTo(mx - nx * 0.4, my - ny * 0.4); c.lineTo(cx + x + Math.cos(a) * L, y + Math.sin(a) * L); c.lineTo(mx - nx * 1.6, my - ny * 1.6); c.lineTo(mx + nx * 0.4, my + ny * 0.4); c.lineTo(cx + x - nx, y - ny); c.closePath(); c.fill(); c.stroke();
  }
}
/** a big arm from the shoulder at (40, 14) on 80×200: golden, a fist at the end; the open hand is its own texture */
function drawArm(c: CanvasRenderingContext2D) {
  const sx = 40;
  c.lineJoin = 'round';
  c.beginPath(); c.moveTo(sx - 30, 14); c.quadraticCurveTo(sx - 40, 90, sx - 22, 180); c.lineTo(sx + 22, 180); c.quadraticCurveTo(sx + 40, 90, sx + 30, 14); c.closePath();
  c.fillStyle = skin(c, 0, 200); c.fill(); c.lineWidth = 4; c.strokeStyle = OUT; c.stroke();
  c.lineWidth = 2.5; c.strokeStyle = '#a86000'; c.beginPath(); c.moveTo(sx - 18, 60); c.quadraticCurveTo(sx, 80, sx + 18, 60); c.stroke(); c.beginPath(); c.moveTo(sx - 4, 110); c.lineTo(sx + 4, 160); c.stroke();
  spiral(c, sx, 42, 16); // the tattoo
  c.fillStyle = '#ff5a1a'; c.fillRect(sx - 24, 150, 48, 16); c.lineWidth = 3; c.strokeStyle = OUT; c.strokeRect(sx - 24, 150, 48, 16); // the red wristband
  c.beginPath(); c.ellipse(sx, 184, 22, 16, 0, 0, Math.PI * 2); c.fillStyle = skin(c, 168, 200); c.fill(); c.stroke();
}
/** the giant open hand, palm to the viewer, fingers spread, the glowing lines of the palm; 360×320, the wrist at (180, 310) */
function drawHand(c: CanvasRenderingContext2D) {
  const cx = 180;
  c.lineJoin = 'round'; c.lineCap = 'round';
  const finger = (x: number, y: number, a: number, L: number, w: number) => {
    c.save(); c.translate(x, y); c.rotate(a);
    c.beginPath(); c.moveTo(-w, 0); c.lineTo(-w * 0.9, -L + w); c.quadraticCurveTo(0, -L - w * 0.6, w * 0.9, -L + w); c.lineTo(w, 0); c.closePath();
    c.fillStyle = skin(c, -L, 0); c.fill(); c.lineWidth = 4.5; c.strokeStyle = OUT; c.stroke();
    c.lineWidth = 2.5; c.strokeStyle = '#a86000'; for (const u of [0.38, 0.68]) { c.beginPath(); c.moveTo(-w * 0.6, -L * u); c.quadraticCurveTo(0, -L * u + 4, w * 0.6, -L * u); c.stroke(); }
    c.beginPath(); c.moveTo(-w * 0.5, -L + w * 0.9); c.quadraticCurveTo(0, -L - w * 0.2, w * 0.5, -L + w * 0.9); c.strokeStyle = '#fff8c8'; c.stroke(); // nail shine
    c.restore();
  };
  finger(cx - 64, 168, -0.34, 112, 22); finger(cx - 22, 150, -0.1, 140, 23); finger(cx + 22, 150, 0.08, 146, 23); finger(cx + 62, 166, 0.3, 120, 21);
  finger(cx - 96, 236, -1.05, 104, 25); // the thumb
  c.beginPath(); c.moveTo(cx - 92, 170); c.quadraticCurveTo(cx - 108, 250, cx - 60, 300); c.lineTo(cx + 60, 300); c.quadraticCurveTo(cx + 100, 250, cx + 86, 164); c.quadraticCurveTo(cx, 136, cx - 92, 170); c.closePath();
  c.fillStyle = skin(c, 140, 300); c.fill(); c.lineWidth = 4.5; c.strokeStyle = OUT; c.stroke();
  // the palm's lines, glowing
  c.shadowColor = '#fff6a0'; c.shadowBlur = 10; c.strokeStyle = '#fff9d0'; c.lineWidth = 4;
  c.beginPath(); c.moveTo(cx - 80, 196); c.quadraticCurveTo(cx - 10, 214, cx + 74, 186); c.stroke();
  c.beginPath(); c.moveTo(cx - 70, 222); c.quadraticCurveTo(cx - 20, 236, cx + 30, 218); c.stroke();
  c.beginPath(); c.moveTo(cx - 50, 296); c.quadraticCurveTo(cx - 70, 252, cx - 40, 214); c.stroke();
  c.shadowBlur = 0;
  c.fillStyle = '#ff5a1a'; c.fillRect(cx - 64, 296, 128, 18); c.lineWidth = 3.5; c.strokeStyle = OUT; c.strokeRect(cx - 64, 296, 128, 18); // the wristband
}
const headTex = (scene: S) => canvasTex(scene, 'grandius-head', 360, 300, (c) => drawHead(c));
const torsoTex = (scene: S) => canvasTex(scene, 'grandius-torso', 440, 320, (c) => drawTorso(c));
const armTex = (scene: S) => canvasTex(scene, 'grandius-arm', 80, 200, (c) => drawArm(c));
const handTex = (scene: S) => canvasTex(scene, 'grandius-hand', 360, 320, (c) => drawHand(c));

export interface GreatHooks {
  /** the roar: a wave `r` round the player pushes the rivals back */
  onRoar: (x: number, y: number, r: number) => void;
  /** the palm lands on (x, y): every rival `r` round is crushed */
  onSlam: (x: number, y: number, r: number) => void;
  /** the golden wave after the slam, `r` round (x, y): it swallows the rival shots */
  onWave: (x: number, y: number, r: number) => void;
}
/** times of the scene, ms */
export const GREAT_MS = { rise: 300, roar: 900, draw: 1250, thrust: 1600, slam: 1850, total: 3100 };
/** the crush and the wave, by level */
export const greatSize = (level: number) => ({ slam: 170 + level * 12, wave: 420 + level * 20, roar: 200 });

/** a jagged lightning line from (x0, y0) to (x1, y1) */
function bolt(g: Phaser.GameObjects.Graphics, x0: number, y0: number, x1: number, y1: number, w: number, col: number, a: number) {
  const n = 7, dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy), nx = -dy / L, ny = dx / L;
  g.lineStyle(w, col, a).beginPath().moveTo(x0, y0);
  for (let i = 1; i < n; i++) { const o = rnd(-1, 1) * L * 0.09; g.lineTo(x0 + dx * i / n + nx * o, y0 + dy * i / n + ny * o); }
  g.lineTo(x1, y1).strokePath();
}

/** Mano grandiosa. (x, y) the player's feet, (tx, ty) where the palm lands. Visual only: the scene deals the damage in the hooks. */
export function greatHand(scene: S, x: number, y: number, tx: number, ty: number, level: number, hooks: GreatHooks) {
  const k = 1 + level * 0.05, side = tx >= x ? 1 : -1, cam = scene.cameras.main, view = () => cam.worldView;
  const size = greatSize(level);
  const live: Phaser.GameObjects.GameObject[] = [];
  const keep = <T extends Phaser.GameObjects.GameObject>(o: T) => { live.push(o); return o; };
  const dim = keep(scene.add.rectangle(view().centerX, view().centerY, view().width * 2, view().height * 2, 0x1a0a00, 1).setDepth(D.dim).setAlpha(0));
  scene.tweens.add({ targets: dim, alpha: 0.62, duration: 240 });
  // the column of golden lightning he rises in
  const pillar = keep(scene.add.rectangle(x, y, 60 * k, 600, GOLD, 0.85).setOrigin(0.5, 1).setDepth(D.aura).setBlendMode(Phaser.BlendModes.ADD).setScale(1, 0));
  scene.tweens.add({ targets: pillar, scaleY: 1, duration: 260, ease: 'Cubic.easeOut' });
  scene.tweens.add({ targets: pillar, scaleX: 3.2, alpha: 0, delay: 260, duration: 420, onComplete: () => pillar.destroy() });
  cam.flash(120, 255, 220, 120);
  // ---- Grandius: the body, the left arm hanging, the right arm (it draws back and thrusts the hand), the head on top
  // he fills most of the view's height whatever the camera's zoom, and never pokes out of its top
  const H = 760, gs = (view().height * 0.8) / H, wx = x - side * 8, wy = Math.max(y + 12, view().top + H * gs + 4);
  const aura = keep(scene.add.graphics().setDepth(D.giant - 1).setBlendMode(Phaser.BlendModes.ADD));
  const spirit = keep(scene.add.container(wx, wy + 40).setDepth(D.giant).setScale(gs * 0.4).setAlpha(0));
  const torso = scene.add.image(0, 0, torsoTex(scene)).setOrigin(0.5, 316 / 320);
  const armL = scene.add.image(-side * 150, -250, armTex(scene)).setOrigin(0.5, 14 / 200).setAngle(side * 12);
  const armR = scene.add.image(side * 150, -250, armTex(scene)).setOrigin(0.5, 14 / 200).setAngle(-side * 18);
  const head = scene.add.image(0, -270, headTex(scene)).setOrigin(0.5, 290 / 300).setScale(1.2);
  const palm = scene.add.image(0, 0, handTex(scene)).setOrigin(0.5, 310 / 320).setScale(0.42).setVisible(false); // the open hand he raises
  spirit.add([armL, torso, head, armR, palm]); // the raised arm and its open hand in front of the mane
  const hand = keep(scene.add.image(0, 0, handTex(scene)).setOrigin(0.5, 0.62).setDepth(D.fx + 2).setAlpha(0));
  const swirl = keep(scene.add.graphics().setDepth(D.fx + 3).setBlendMode(Phaser.BlendModes.ADD));
  let swirlAt: { x: number; y: number; r: number } | null = null, flying = false; // the white-blue whirlwind spinning into the palm
  try { spirit.postFX?.addGlow(GOLD, 4, 0, false, 0.1, 12); } catch { /* canvas renderer: no glow */ }
  scene.tweens.add({ targets: spirit, alpha: 1, y: wy, scaleX: gs, scaleY: gs, delay: GREAT_MS.rise, duration: 480, ease: 'Back.easeOut' });
  const t0 = scene.time.now;
  const tick = () => {
    if (!spirit.active) { scene.events.off('update', tick); return; }
    const t = (scene.time.now - t0) / 1000;
    dim.setPosition(view().centerX, view().centerY);
    // the crackling golden aura round him: lightning licking up from his outline
    aura.clear();
    if (spirit.alpha > 0.05) {
      const sc = spirit.scaleX, cx = spirit.x, cy = spirit.y - 300 * sc; // the middle of his body
      aura.fillStyle(GOLD, 0.16 * spirit.alpha).fillEllipse(cx, cy, 480 * sc, 640 * sc);
      for (let n = 0; n < 17; n++) { // the orange fire edging his outline
        const a = -Math.PI / 2 + (n / 16 - 0.5) * 3.6, L = (120 + Math.sin(t * 14 + n * 1.9) * 40) * sc;
        const bx = cx + Math.cos(a) * 210 * sc, by = cy + Math.sin(a) * 300 * sc, nx = -Math.sin(a) * 26 * sc, ny = Math.cos(a) * 26 * sc;
        aura.fillStyle(n % 3 === 0 ? 0xffb02a : FLAME, 0.38 * spirit.alpha).fillTriangle(bx + nx, by + ny, bx - nx, by - ny, bx + Math.cos(a) * L, by + Math.sin(a) * L);
      }
      if (Math.floor(t * 30) % 2 === 0) for (let n = 0; n < 3; n++) {
        const a = rnd(-Math.PI, 0), r = rnd(200, 260) * sc;
        const bx = cx + Math.cos(a) * r, by = cy + Math.sin(a) * r * 1.3;
        bolt(aura, bx, by, bx + Math.cos(a) * 90 * sc, by + Math.sin(a) * 90 * sc, 2, GOLD2, 0.9 * spirit.alpha);
      }
    }
    head.setAngle(Math.sin(t * 2) * 2);
    // the raised palm stays on the end of the arm, fingers out
    const th = Phaser.Math.DegToRad(armR.angle);
    palm.setPosition(armR.x - Math.sin(th) * 186, armR.y + Math.cos(th) * 186).setAngle(armR.angle + 180);
    const ph = Phaser.Math.DegToRad(palm.angle), pr = 120 * palm.scaleX; // from the wrist to the middle of the palm
    if (palm.visible) swirlAt = { x: spirit.x + (palm.x + Math.sin(ph) * pr) * spirit.scaleX, y: spirit.y + (palm.y - Math.cos(ph) * pr) * spirit.scaleY, r: 22 };
    else if (hand.alpha > 0.5 && flying) swirlAt = { x: hand.x, y: hand.y - 20 * hand.scaleY, r: 60 * hand.scaleX };
    else swirlAt = null;
    swirl.clear();
    if (swirlAt) for (let n = 0; n < 4; n++) { // four arms of the whirlwind, turning and closing in
      swirl.lineStyle(n % 2 ? 5 : 8, n % 2 ? 0xffffff : 0x9ad8ff, 0.85).beginPath();
      for (let u = 0; u <= 1.001; u += 0.05) { const a = t * 9 + n * Math.PI / 2 + u * 3.4, rr = swirlAt.r * (1.6 - u * 1.4); const px = swirlAt.x + Math.cos(a) * rr, py = swirlAt.y + Math.sin(a) * rr * 0.8; if (u === 0) swirl.moveTo(px, py); else swirl.lineTo(px, py); }
      swirl.strokePath();
    }
  };
  scene.events.on('update', tick);
  // the roar: the head throws back, a ring of golden air pushes the rivals away
  scene.time.delayedCall(GREAT_MS.roar, () => {
    if (!spirit.active) return;
    scene.tweens.add({ targets: head, scaleX: 1.34, scaleY: 1.34, y: -284, duration: 120, yoyo: true, hold: 260 });
    cam.shake(380, 0.012);
    hooks.onRoar(x, y, size.roar);
    for (const [d, col] of [[0, 0xffffff], [90, GOLD], [180, FLAME]] as const) {
      const ring = scene.add.ellipse(x, y - 10, size.roar * 0.5, size.roar * 0.3).setStrokeStyle(6, col, 0.9).setDepth(D.fx - 1).setBlendMode(Phaser.BlendModes.ADD);
      scene.tweens.add({ targets: ring, scale: 2.4, alpha: 0, delay: d, duration: 560, ease: 'Cubic.easeOut', onComplete: () => ring.destroy() });
    }
  });
  // he draws back his right arm; power gathers in it
  scene.time.delayedCall(GREAT_MS.draw, () => {
    if (!spirit.active) return;
    scene.tweens.add({ targets: armR, angle: -side * 165, duration: 260, ease: 'Back.easeOut' }); // the open hand up over his head
    palm.setVisible(true);
    const gather = scene.time.addEvent({ delay: 30, repeat: Math.floor((GREAT_MS.thrust - GREAT_MS.draw) / 30), callback: () => {
      const hx = spirit.x + side * 150 * spirit.scaleX, hy = spirit.y - 420 * spirit.scaleX, a = rnd(0, Math.PI * 2), d = rnd(60, 110);
      const sp = scene.add.circle(hx + Math.cos(a) * d, hy + Math.sin(a) * d, rnd(2, 4), Math.random() < 0.6 ? GOLD2 : FLAME, 1).setDepth(D.fx).setBlendMode(Phaser.BlendModes.ADD);
      scene.tweens.add({ targets: sp, x: hx, y: hy, alpha: 0.2, duration: 220, ease: 'Quad.easeIn', onComplete: () => sp.destroy() });
    } });
    scene.time.delayedCall(GREAT_MS.thrust - GREAT_MS.draw + 30, () => gather.remove());
  });
  // the thrust: the arm swings forward and the giant hand flies out of it, growing, onto the rivals
  scene.time.delayedCall(GREAT_MS.thrust, () => {
    if (!spirit.active) return;
    scene.tweens.add({ targets: armR, angle: side * 70, duration: 140, ease: 'Cubic.easeOut' });
    const sx = swirlAt?.x ?? spirit.x + side * 160 * spirit.scaleX, sy = swirlAt?.y ?? spirit.y - 380 * spirit.scaleX, dur = GREAT_MS.slam - GREAT_MS.thrust; // out of the raised palm
    const big = Math.min(size.slam * 1.2, view().width * 0.42) / 360; // the palm ends big, but never wider than about half the view
    palm.setVisible(false); flying = true;
    hand.setPosition(sx, sy).setScale(0.15).setAlpha(1).setAngle(side * 20);
    try { hand.postFX?.addGlow(GOLD, 5, 0, false, 0.1, 14); } catch { /* canvas renderer: no glow */ }
    const trail = scene.time.addEvent({ delay: 25, repeat: Math.floor(dur / 25), callback: () => {
      const g = scene.add.image(hand.x, hand.y, handTex(scene)).setOrigin(0.5, 0.62).setScale(hand.scale).setAngle(hand.angle).setDepth(D.fx + 1).setTint(GOLD).setAlpha(0.45).setBlendMode(Phaser.BlendModes.ADD);
      scene.tweens.add({ targets: g, alpha: 0, scale: hand.scale * 1.1, duration: 240, onComplete: () => g.destroy() });
    } });
    scene.tweens.add({ targets: hand, x: tx, y: ty - 30, scale: big, angle: 0, duration: dur, ease: 'Cubic.easeIn', onComplete: () => {
      trail.remove(); flying = false;
      // the slam: the palm crushes the rivals, the ground cracks in its print
      hooks.onSlam(tx, ty, size.slam);
      cam.shake(320, 0.012); cam.flash(100, 255, 236, 160);
      scene.tweens.add({ targets: hand, scaleY: big * 0.86, y: ty - 18, duration: 90, yoyo: true });
      const cracks = keep(scene.add.graphics().setDepth(D.fx - 2));
      for (let n = 0; n < 14; n++) {
        const a = n / 14 * Math.PI * 2 + rnd(-0.1, 0.1); let px = tx, py = ty;
        cracks.lineStyle(n % 2 ? 4 : 6, 0x2a1000, 0.85).beginPath().moveTo(px, py);
        for (let j = 0; j < 4; j++) { px += Math.cos(a + rnd(-0.3, 0.3)) * size.slam * 0.28; py += Math.sin(a + rnd(-0.3, 0.3)) * size.slam * 0.17; cracks.lineTo(px, py); }
        cracks.strokePath();
      }
      const glow = scene.add.ellipse(tx, ty, size.slam * 2, size.slam * 1.2, GOLD, 0.7).setDepth(D.fx - 1).setBlendMode(Phaser.BlendModes.ADD);
      scene.tweens.add({ targets: glow, alpha: 0, scale: 1.3, duration: 700, onComplete: () => glow.destroy() });
      // rocks flung up from the print
      for (let n = 0; n < 22; n++) {
        const a = rnd(0, Math.PI * 2), d = rnd(0.4, 1) * size.slam, r = scene.add.rectangle(tx, ty, rnd(6, 14), rnd(6, 12), n % 3 ? 0x8a5a2a : 0xd0a050).setDepth(D.fx).setAngle(rnd(0, 90));
        scene.tweens.add({ targets: r, x: tx + Math.cos(a) * d, y: ty + Math.sin(a) * d * 0.6 - rnd(30, 90), angle: r.angle + rnd(-200, 200), duration: 380, ease: 'Quad.easeOut', onComplete: () => {
          scene.tweens.add({ targets: r, y: r.y + rnd(30, 90), alpha: 0, duration: 340, ease: 'Quad.easeIn', onComplete: () => r.destroy() });
        } });
      }
      // lightning forks out of the palm
      const arcs = scene.add.graphics().setDepth(D.fx + 3).setBlendMode(Phaser.BlendModes.ADD);
      const zap = scene.time.addEvent({ delay: 60, repeat: 8, callback: () => {
        arcs.clear();
        for (let n = 0; n < 6; n++) { const a = rnd(0, Math.PI * 2), d = size.slam * rnd(0.7, 1.3); bolt(arcs, tx, ty - 20, tx + Math.cos(a) * d, ty + Math.sin(a) * d * 0.6, 3, n % 2 ? GOLD2 : 0xffffff, 1); }
      } });
      scene.time.delayedCall(600, () => { zap.remove(); arcs.destroy(); });
      // the golden wave runs out across the pitch and swallows the rival shots
      scene.time.delayedCall(120, () => {
        hooks.onWave(tx, ty, size.wave);
        for (const [d, w, col] of [[0, 14, GOLD], [80, 8, 0xffffff], [170, 6, FLAME]] as const) {
          const ring = scene.add.ellipse(tx, ty, size.slam, size.slam * 0.6).setStrokeStyle(w, col, 0.9).setDepth(D.fx - 1).setBlendMode(Phaser.BlendModes.ADD);
          scene.tweens.add({ targets: ring, scale: size.wave * 2 / size.slam, alpha: 0, delay: d, duration: 720, ease: 'Cubic.easeOut', onComplete: () => ring.destroy() });
        }
      });
      fade(scene, cracks, 900, 600);
      scene.tweens.add({ targets: hand, alpha: 0, scale: big * 1.08, delay: 520, duration: 360 }); // the palm lifts away, leaving its print
    } });
    scene.time.delayedCall(dur + 400, () => { if (spirit.active) scene.tweens.add({ targets: spirit, alpha: 0, y: spirit.y + 30, duration: 600, ease: 'Cubic.easeIn' }); });
  });
  const end = GREAT_MS.total;
  for (const o of live) if (o !== dim) fade(scene, o, end - 450, 420);
  scene.tweens.add({ targets: dim, alpha: 0, delay: end - 420, duration: 400, onComplete: () => dim.destroy() });
  scene.time.delayedCall(end, () => scene.events.off('update', tick));
}
