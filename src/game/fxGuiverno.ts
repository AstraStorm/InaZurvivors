/**
 * Aliento blanco (author, from its scene in GO, eASe7J9sPO8): Bai Long burns in gold and the ball rises glowing; behind
 * it Guiverno Blanco appears (author: «tiene brazos», frame by frame): a green dragon-man to the waist, muscled chest
 * with a cream band down the middle, red flame fins on the shoulders and elbows, two arms in white gauntlets with gold
 * bands and green claws with red talons; the green face lined in gold under a tall white ring and wide white-gold horns;
 * below the waist a long serpent tail that coils round the player. It cradles the ball in its claws at its mouth while
 * the light gathers, Bai Long kicks it and the dragon breathes it out in a huge beam of white-gold light.
 */
import Phaser from 'phaser';
import { canvasTex, D, fade, rnd } from './fxKeshin';

type S = Phaser.Scene;
const GOLD = 0xffd84a, GOLD2 = 0xfff3b0, LIME = 0xc8ff6a, GREEN = 0x5aa83a, GREEN_D = 0x2e6a22, BELLY = 0xe8f0b8, FIN = 0xe03a2a;

const OUT = '#1a3010';
/** the head, from the front as in the author's frames: a big white oval behind it with gold lines like a leaf, wide
 *  white horns with an orange-gold underside and the tips turned up, the face a green shield of tiles split by gold
 *  lines with a glowing white orb in the middle; 260×220, the snout at (130, 206) */
function drawHead(c: CanvasRenderingContext2D) {
  const cx = 130, GOLDL = '#d89a28', DARK = '#6a4a14';
  c.lineJoin = 'round'; c.lineCap = 'round';
  // the white oval and its gold leaf
  c.beginPath(); c.ellipse(cx, 80, 52, 76, 0, 0, Math.PI * 2); c.fillStyle = '#fbf8ec'; c.fill(); c.lineWidth = 4; c.strokeStyle = DARK; c.stroke();
  c.lineWidth = 4; c.strokeStyle = GOLDL;
  c.beginPath(); c.ellipse(cx, 84, 34, 62, 0, 0, Math.PI * 2); c.stroke();
  c.beginPath(); c.moveTo(cx, 22); c.lineTo(cx, 146); c.moveTo(cx, 120); c.quadraticCurveTo(cx - 30, 80, cx - 22, 34); c.moveTo(cx, 120); c.quadraticCurveTo(cx + 30, 80, cx + 22, 34); c.stroke();
  c.fillStyle = '#c8dca0'; for (const s of [-1, 1]) { c.beginPath(); c.moveTo(cx + s * 4, 112); c.quadraticCurveTo(cx + s * 22, 80, cx + s * 16, 44); c.quadraticCurveTo(cx + s * 6, 70, cx + s * 4, 112); c.fill(); }
  // the horns, out to the sides with the tips turned up; white, the underside orange and gold
  for (const s of [-1, 1]) {
    const horn = () => { c.beginPath(); c.moveTo(cx + s * 30, 126); c.quadraticCurveTo(cx + s * 70, 116, cx + s * 128, 70); c.quadraticCurveTo(cx + s * 104, 130, cx + s * 40, 162); c.closePath(); };
    horn(); c.fillStyle = '#fbf8ec'; c.fill(); c.lineWidth = 4; c.strokeStyle = DARK; c.stroke();
    c.beginPath(); c.moveTo(cx + s * 40, 156); c.quadraticCurveTo(cx + s * 100, 128, cx + s * 126, 76); c.lineWidth = 8; c.strokeStyle = '#e8902a'; c.stroke(); c.lineWidth = 3; c.strokeStyle = '#ffd25a'; c.stroke();
  }
  // the face: a green shield of tiles split by gold lines
  const shield = () => { c.beginPath(); c.moveTo(cx - 46, 136); c.lineTo(cx + 46, 136); c.lineTo(cx + 40, 168); c.lineTo(cx, 210); c.lineTo(cx - 40, 168); c.closePath(); };
  shield(); c.fillStyle = '#9ac46a'; c.fill(); c.lineWidth = 5; c.strokeStyle = GOLDL; c.stroke();
  c.save(); shield(); c.clip();
  c.fillStyle = '#b8d888'; c.fillRect(cx - 46, 136, 46, 30); c.fillStyle = '#7aa84a'; c.fillRect(cx, 166, 46, 50); // the tiles catch the light unevenly
  c.lineWidth = 3.5; c.strokeStyle = GOLDL; c.beginPath();
  c.moveTo(cx, 136); c.lineTo(cx, 210); c.moveTo(cx - 46, 164); c.lineTo(cx + 46, 164); c.moveTo(cx - 40, 168); c.lineTo(cx - 10, 196); c.moveTo(cx + 40, 168); c.lineTo(cx + 10, 196);
  c.stroke(); c.restore();
  for (const s of [-1, 1]) { c.beginPath(); c.ellipse(cx + s * 28, 174, 8, 6, s * 0.4, 0, Math.PI * 2); c.fillStyle = '#ffd25a'; c.fill(); c.lineWidth = 2; c.strokeStyle = DARK; c.stroke(); } // the eyes
  // the glowing white orb in the middle
  c.shadowColor = '#fff6c0'; c.shadowBlur = 14; c.fillStyle = '#ffffff'; c.beginPath(); c.arc(cx, 154, 11, 0, Math.PI * 2); c.fill(); c.shadowBlur = 0;
  c.lineWidth = 3; c.strokeStyle = GOLDL; c.stroke();
}
/** a red flame fin, its root at (x, y), pointing at `ang` */
function flameFin(c: CanvasRenderingContext2D, x: number, y: number, ang: number, len: number) {
  c.save(); c.translate(x, y); c.rotate(ang);
  c.beginPath(); c.moveTo(0, -len * 0.18);
  for (let n = 0; n < 4; n++) { const u = (n + 1) / 4; c.lineTo(len * u, -len * (0.3 - u * 0.12) - (n % 2 ? 0 : len * 0.12)); c.lineTo(len * (u - 0.08), -len * 0.04 * n); }
  c.lineTo(len * 0.7, len * 0.12); c.quadraticCurveTo(len * 0.3, len * 0.2, 0, len * 0.18); c.closePath();
  c.fillStyle = '#e8402c'; c.fill(); c.lineWidth = 3; c.strokeStyle = '#5a0a06'; c.stroke();
  c.restore();
}
/** the chest, slender as in the frames: green, a wide white belly lined in gold, gold lines down the sides and big red
 *  flame fins on the shoulders; the waist at the bottom middle of 260×220, the shoulders at (74, 56) and (186, 56) */
function drawTorso(c: CanvasRenderingContext2D) {
  const cx = 130;
  c.lineJoin = 'round'; c.lineCap = 'round';
  flameFin(c, 84, 50, -2.2, 96); flameFin(c, 176, 50, -0.94, 96); // the big fins over the shoulders
  flameFin(c, 80, 84, -2.8, 62); flameFin(c, 180, 84, -0.34, 62);
  const g = c.createLinearGradient(0, 30, 0, 220); g.addColorStop(0, '#9ac46a'); g.addColorStop(1, '#5a9a32');
  const body = () => { c.beginPath(); c.moveTo(cx - 60, 50); c.quadraticCurveTo(cx - 62, 130, cx - 24, 218); c.lineTo(cx + 24, 218); c.quadraticCurveTo(cx + 62, 130, cx + 60, 50); c.quadraticCurveTo(cx, 30, cx - 60, 50); c.closePath(); };
  body(); c.fillStyle = g; c.fill(); c.lineWidth = 4; c.strokeStyle = OUT; c.stroke();
  for (const s of [-1, 1]) { c.beginPath(); c.ellipse(cx + s * 56, 56, 20, 18, 0, 0, Math.PI * 2); c.fillStyle = '#9ac46a'; c.fill(); c.stroke(); } // shoulders
  c.lineWidth = 3; c.strokeStyle = '#e8a030'; // gold lines down the sides
  for (const s of [-1, 1]) { c.beginPath(); c.moveTo(cx + s * 50, 66); c.quadraticCurveTo(cx + s * 50, 140, cx + s * 20, 216); c.stroke(); }
  c.strokeStyle = '#3e6a22'; c.lineWidth = 3; // the muscles of the chest
  c.beginPath(); c.moveTo(cx - 44, 82); c.quadraticCurveTo(cx - 22, 98, cx - 20, 80); c.moveTo(cx + 44, 82); c.quadraticCurveTo(cx + 22, 98, cx + 20, 80); c.stroke();
  // the wide white belly, lined in gold, with its plates
  c.beginPath(); c.moveTo(cx - 20, 72); c.quadraticCurveTo(cx, 64, cx + 20, 72); c.lineTo(cx + 18, 218); c.lineTo(cx - 18, 218); c.closePath();
  c.fillStyle = '#f8f4e2'; c.fill(); c.lineWidth = 3; c.strokeStyle = '#d89a28'; c.stroke();
  c.strokeStyle = '#d8ccA0'; c.lineWidth = 2; c.beginPath(); for (let yy = 92; yy < 214; yy += 15) { c.moveTo(cx - 17, yy); c.quadraticCurveTo(cx, yy + 4, cx + 17, yy); } c.stroke();
}
/** an arm hanging from the shoulder at (40, 12) on 80×150: the green upper arm, a red fin at the elbow, the white
 *  gauntlet with gold bands, the green claw with red talons */
function drawArm(c: CanvasRenderingContext2D) {
  const sx = 40;
  c.lineJoin = 'round'; c.lineCap = 'round';
  flameFin(c, sx + 10, 62, 0.5, 34);
  c.beginPath(); c.ellipse(sx, 38, 15, 30, 0, 0, Math.PI * 2); c.fillStyle = '#7ab04a'; c.fill(); c.lineWidth = 4; c.strokeStyle = OUT; c.stroke();
  c.beginPath(); c.moveTo(sx - 15, 64); c.lineTo(sx + 15, 64); c.lineTo(sx + 12, 108); c.lineTo(sx - 12, 108); c.closePath(); c.fillStyle = '#f6f2e0'; c.fill(); c.stroke();
  c.strokeStyle = '#e8a020'; c.lineWidth = 3; c.beginPath(); c.moveTo(sx - 14, 76); c.lineTo(sx + 14, 76); c.moveTo(sx - 13, 98); c.lineTo(sx + 13, 98); c.stroke();
  c.beginPath(); c.ellipse(sx, 120, 14, 13, 0, 0, Math.PI * 2); c.fillStyle = '#7ab04a'; c.fill(); c.lineWidth = 4; c.strokeStyle = OUT; c.stroke();
  for (const d of [-1, 0, 1]) { // the talons
    c.beginPath(); c.moveTo(sx + d * 9, 128); c.quadraticCurveTo(sx + d * 15, 140, sx + d * 8, 148); c.lineWidth = 6; c.strokeStyle = '#5a0a06'; c.stroke(); c.lineWidth = 3.5; c.strokeStyle = '#e8402c'; c.stroke();
  }
}
const headTex = (scene: S) => canvasTex(scene, 'wyvern-head3', 260, 220, (c) => drawHead(c));
const torsoTex = (scene: S) => canvasTex(scene, 'wyvern-torso2', 260, 220, (c) => drawTorso(c));
const armTex = (scene: S) => canvasTex(scene, 'wyvern-arm', 80, 150, (c) => drawArm(c));
export interface BreathHooks {
  /** the breath runs from (x0, y0) to (x1, y1), `width` wide (the scene hurts what is in it) */
  onBreath: (x0: number, y0: number, x1: number, y1: number, width: number) => void;
  /** where the player is now */
  at: () => { x: number; y: number };
}

/** times of the scene, ms */
export const BREATH_MS = { rise: 220, head: 420, charge: 900, kick: 1380, total: 2500 };
/** the length and width of the breath, by spirit level */
export const breathSize = (level: number) => ({ len: 380 + level * 20, w: 84 + level * 8 });

/** Aliento blanco. (x, y) the player's feet, (tx, ty) the target. Visual only: the scene deals the damage in the hooks. */
export function whiteBreath(scene: S, x: number, y: number, tx: number, ty: number, level: number, hooks: BreathHooks) {
  const k = 1 + level * 0.05, side = tx >= x ? 1 : -1, cam = scene.cameras.main, view = () => cam.worldView;
  const live: Phaser.GameObjects.GameObject[] = [];
  const keep = <T extends Phaser.GameObjects.GameObject>(o: T) => { live.push(o); return o; };
  // the night falls; the player burns in gold
  const dim = keep(scene.add.rectangle(view().centerX, view().centerY, view().width * 2, view().height * 2, 0x04081a, 1).setDepth(D.dim).setAlpha(0));
  scene.tweens.add({ targets: dim, alpha: 0.66, duration: 240 });
  const pAura = keep(scene.add.ellipse(x, y - 10, 30, 44, GOLD, 1).setDepth(D.giant + 4).setAlpha(0).setBlendMode(Phaser.BlendModes.ADD));
  scene.tweens.add({ targets: pAura, alpha: 0.25, scaleX: 1.5, scaleY: 1.3, duration: 320, yoyo: true, repeat: 2 });
  const rays = keep(scene.add.graphics().setDepth(D.giant - 1).setBlendMode(Phaser.BlendModes.ADD));
  // Guiverno Blanco stands in one container behind the player, its waist at his feet; local units are the drawings'
  // pixels (shoulders at y -164, the snout at -182)
  const gs = 0.2 * k, wx = x - side * 4, wy = y - 2;
  const mx = wx, my = wy - 168 * gs; // the ball rises glowing to just under the dragon's snout
  const hx = wx; // where the tail starts
  const ball = keep(scene.add.image(x + side * 6, y - 4, 'fx:ball').setDepth(D.fx + 1).setScale(0.9));
  const glow = keep(scene.add.circle(ball.x, ball.y, 10, GOLD2, 0.7).setDepth(D.fx).setBlendMode(Phaser.BlendModes.ADD));
  scene.tweens.add({ targets: [ball, glow], x: mx, y: my, delay: BREATH_MS.rise, duration: 460, ease: 'Cubic.easeOut' });
  scene.tweens.add({ targets: ball, angle: 540, duration: 1300 });
  // ---- the tail (drawn each frame, it undulates) and the dragon-man: chest, arms, head
  const body = keep(scene.add.graphics().setDepth(D.giant - 1));
  const spirit = keep(scene.add.container(wx, wy).setDepth(D.giant).setScale(0.05).setAlpha(0));
  const torso = scene.add.image(0, 0, torsoTex(scene)).setOrigin(0.5, 1);
  const mane = scene.add.graphics().setBlendMode(Phaser.BlendModes.ADD); // the golden flames behind its head and shoulders
  const arms = [-1, 1].map((s) => scene.add.image(s * 56, -164, armTex(scene)).setOrigin(0.5, 12 / 150).setAngle(s * -60).setScale(1.35));
  const head = scene.add.image(0, -182, headTex(scene)).setOrigin(0.5, 206 / 220).setScale(1.3);
  spirit.add([mane, torso, ...arms, head]);
  try { spirit.postFX?.addGlow(0xfff2b0, 3, 0, false, 0.1, 10); } catch { /* canvas renderer: no glow */ } // it shines all over, as in the scene
  let grow = 0; // how much of the tail has come out (0..1)
  scene.tweens.add({ targets: spirit, alpha: 1, scale: gs, delay: BREATH_MS.head, duration: 380, ease: 'Back.easeOut' });
  scene.tweens.addCounter({ from: 0, to: 1, delay: BREATH_MS.head, duration: 520, ease: 'Cubic.easeOut', onUpdate: (tw) => { grow = tw.getValue() ?? 0; } });
  let recoil = 0;
  const t0 = scene.time.now;
  const tick = () => {
    if (!spirit.active) { scene.events.off('update', tick); return; }
    const t = (scene.time.now - t0) / 1000, p = hooks.at();
    dim.setPosition(view().centerX, view().centerY);
    pAura.setPosition(p.x, p.y - 10);
    spirit.setPosition(wx - side * recoil * 8, wy - recoil * 4 + Math.sin(t * 3) * 1.5);
    head.setAngle(Math.sin(t * 2.2) * 3 - side * recoil * 10);
    torso.setScale(1, 1 + Math.sin(t * 4) * 0.015);
    mane.clear();
    for (let f = 0; f < 9; f++) { // flame tongues fanning out behind the head, flickering
      const a = -Math.PI / 2 + (f - 4) * 0.34, L = 120 + Math.sin(t * 9 + f * 1.7) * 22 + (f % 2 ? 0 : 30), bx = Math.cos(a) * 30, by = -230 + Math.sin(a) * 20;
      const tx2 = bx + Math.cos(a) * L, ty2 = by + Math.sin(a) * L * 0.9, nx = -Math.sin(a) * 24, ny = Math.cos(a) * 24;
      mane.fillStyle(0xffd23a, 0.5).fillTriangle(bx + nx, by + ny, bx - nx, by - ny, tx2, ty2);
      mane.fillStyle(0xfff6c8, 0.55).fillTriangle(bx + nx * 0.4, by + ny * 0.4, bx - nx * 0.4, by - ny * 0.4, bx + (tx2 - bx) * 0.7, by + (ty2 - by) * 0.7);
    }
    // the tail: from the waist, down behind the player and coiling round him
    body.clear();
    if (grow <= 0) return;
    const bez = (p0: number[], p1: number[], p2: number[], p3: number[], u: number) => {
      const v = 1 - u;
      return [v * v * v * p0[0] + 3 * v * v * u * p1[0] + 3 * v * u * u * p2[0] + u * u * u * p3[0], v * v * v * p0[1] + 3 * v * v * u * p1[1] + 3 * v * u * u * p2[1] + u * u * u * p3[1]];
    };
    const X = (dx: number) => hx - side * dx * k, Y = (dy: number) => y + dy * k;
    const A = [[X(0), wy - 6], [X(56), Y(-2)], [X(70), Y(30)], [X(-6), Y(28)]];
    const B = [[X(-6), Y(28)], [X(-80), Y(26)], [X(-88), Y(-34)], [X(-52), Y(-58)]];
    const n = 56, pts: { x: number; y: number; w: number }[] = [];
    for (let s2 = 0; s2 <= n * grow; s2++) {
      const u = s2 / n, [bx, by] = u < 0.5 ? bez(A[0], A[1], A[2], A[3], u * 2) : bez(B[0], B[1], B[2], B[3], u * 2 - 1);
      pts.push({ x: bx + Math.sin(t * 5 + u * 12) * 3 * u, y: by + Math.cos(t * 4 + u * 10) * 2 * u, w: (9 - u * 7) * k });
    }
    const seg = (dw: number, col: number, al: number, ox = 0, oy = 0, ws = 1) => {
      for (let s2 = 1; s2 < pts.length; s2++) {
        const q = pts[s2 - 1], r = pts[s2];
        body.lineStyle((q.w + dw) * 2 * ws, col, al).lineBetween(q.x + ox * q.w, q.y + oy * q.w, r.x + ox * r.w, r.y + oy * r.w);
        body.fillStyle(col, al).fillCircle(r.x + ox * r.w, r.y + oy * r.w, (r.w + dw) * ws);
      }
    };
    for (let s2 = 3; s2 < pts.length - 2; s2 += 5) { // red fins along the back (behind the body)
      const q = pts[s2], r = pts[s2 + 1], nx = -(r.y - q.y), ny = r.x - q.x, L = Math.hypot(nx, ny) || 1, f = q.w * 1.5 + Math.sin(t * 8 + s2) * 2;
      const sg = ny / L < 0 ? 1 : -1; // always on the upper side
      body.fillStyle(0x5a0a06, 1).fillTriangle(q.x, q.y, r.x + (r.x - q.x), r.y + (r.y - q.y), q.x + sg * nx / L * (q.w + f + 2), q.y + sg * ny / L * (q.w + f + 2));
      body.fillStyle(FIN, 1).fillTriangle(q.x, q.y, r.x + (r.x - q.x) * 0.8, r.y + (r.y - q.y) * 0.8, q.x + sg * nx / L * (q.w + f), q.y + sg * ny / L * (q.w + f));
    }
    seg(2.5, 0x10240a, 1);
    seg(0, GREEN, 1);
    seg(0, GREEN_D, 0.45, 0, 0.35, 0.55); // shade underneath
    seg(0, BELLY, 0.85, 0, -0.38, 0.3); // the pale belly line
    // golden rays behind the head while it charges
    rays.clear();
    const charge = Math.max(0, Math.min(1, (t * 1000 - BREATH_MS.charge) / (BREATH_MS.kick - BREATH_MS.charge)));
    if (charge > 0 && t * 1000 < BREATH_MS.kick + 200) for (let r = 0; r < 14; r++) {
      const ra = r / 14 * Math.PI * 2 + t * 1.5, L = (40 + charge * 60) * k;
      rays.fillStyle(r % 2 ? GOLD : LIME, 0.25 + charge * 0.35).fillTriangle(mx, my, mx + Math.cos(ra - 0.07) * L, my + Math.sin(ra - 0.07) * L, mx + Math.cos(ra + 0.07) * L, my + Math.sin(ra + 0.07) * L);
    }
  };
  scene.events.on('update', tick);
  // the charge: light flows into the ball at its mouth, a green-gold swirl turns round it
  scene.time.delayedCall(BREATH_MS.charge, () => {
    if (!spirit.active) return;
    arms.forEach((a, n) => scene.tweens.add({ targets: a, angle: (n ? 1 : -1) * 112, duration: 320, ease: 'Back.easeOut' })); // the claws round the ball
    scene.tweens.add({ targets: glow, scale: 3.2, fillAlpha: 0.9, duration: BREATH_MS.kick - BREATH_MS.charge, ease: 'Quad.easeIn' });
    const swirl = keep(scene.add.ellipse(mx, my, 70 * k, 40 * k).setStrokeStyle(3, LIME, 0.9).setDepth(D.fx));
    scene.tweens.add({ targets: swirl, scale: 0.3, angle: 360, duration: BREATH_MS.kick - BREATH_MS.charge, ease: 'Quad.easeIn', onComplete: () => swirl.destroy() });
    const flow = scene.time.addEvent({ delay: 40, repeat: Math.floor((BREATH_MS.kick - BREATH_MS.charge) / 40), callback: () => {
      const a = rnd(0, Math.PI * 2), d = rnd(50, 90) * k, sp = scene.add.circle(mx + Math.cos(a) * d, my + Math.sin(a) * d, rnd(1.5, 3), Math.random() < 0.5 ? GOLD2 : LIME, 1).setDepth(D.fx);
      scene.tweens.add({ targets: sp, x: mx, y: my, alpha: 0.2, duration: 260, ease: 'Quad.easeIn', onComplete: () => sp.destroy() });
    } });
    scene.time.delayedCall(BREATH_MS.kick - BREATH_MS.charge + 40, () => flow.remove());
  });
  // the kick: the breath of white-gold light carries the ball across the pitch
  scene.time.delayedCall(BREATH_MS.kick, () => {
    if (!spirit.active) return;
    arms.forEach((a, n) => scene.tweens.add({ targets: a, angle: (n ? -1 : 1) * 100, duration: 160, ease: 'Cubic.easeOut' })); // flung open by the blast
    const { len, w } = breathSize(level);
    const ang = Math.atan2(ty - my, tx - mx), x1 = mx + Math.cos(ang) * len, y1 = my + Math.sin(ang) * len;
    cam.shake(380, 0.012); cam.flash(140, 255, 246, 200);
    scene.tweens.addCounter({ from: 0, to: 1, duration: 160, yoyo: true, hold: 300, onUpdate: (tw) => { recoil = tw.getValue() ?? 0; } });
    hooks.onBreath(mx, my, x1, y1, w);
    // the cone: narrow at the mouth, wide at the end, three layers and a white core
    const cone = scene.add.graphics().setDepth(D.fx).setBlendMode(Phaser.BlendModes.ADD);
    const nx = -Math.sin(ang), ny = Math.cos(ang);
    const draw = (u: number, al: number) => {
      cone.clear();
      for (const [ws, col, a2] of [[1.25, LIME, 0.25], [1, GOLD, 0.5], [0.6, GOLD2, 0.75], [0.25, 0xffffff, 0.95]] as const) {
        const ex = mx + Math.cos(ang) * len * u, ey = my + Math.sin(ang) * len * u, w0 = w * 0.25 * ws, w1 = w * ws * (0.4 + u * 0.6);
        cone.fillStyle(col, a2 * al).fillPoints([{ x: mx + nx * w0 / 2, y: my + ny * w0 / 2 }, { x: ex + nx * w1 / 2, y: ey + ny * w1 / 2 }, { x: ex - nx * w1 / 2, y: ey - ny * w1 / 2 }, { x: mx - nx * w0 / 2, y: my - ny * w0 / 2 }], true);
        cone.fillCircle(ex, ey, w1 / 2);
      }
    };
    scene.tweens.addCounter({ from: 0, to: 1, duration: 220, ease: 'Cubic.easeOut', onUpdate: (tw) => draw(tw.getValue() ?? 0, 1),
      onComplete: () => scene.tweens.addCounter({ from: 1, to: 0, delay: 360, duration: 420, onUpdate: (tw) => draw(1, tw.getValue() ?? 0), onComplete: () => cone.destroy() }) });
    for (let n = 0; n < 22; n++) { // streaks of light along it
      const u = rnd(0.05, 0.9), off = rnd(-0.4, 0.4) * w * (0.4 + u * 0.6);
      const sx = mx + Math.cos(ang) * len * u + nx * off, sy = my + Math.sin(ang) * len * u + ny * off;
      const st = scene.add.rectangle(sx, sy, rnd(30, 70) * k, 2, n % 3 ? 0xffffff : LIME, 0.9).setOrigin(0, 0.5).setRotation(ang).setDepth(D.fx + 1).setScale(0.1, 1);
      scene.tweens.add({ targets: st, x: sx + Math.cos(ang) * 60, y: sy + Math.sin(ang) * 60, scaleX: 1, alpha: 0, delay: n * 14, duration: 380, onComplete: () => st.destroy() });
    }
    // the ball at the head of the breath
    scene.tweens.killTweensOf([ball, glow]);
    scene.tweens.add({ targets: [ball, glow], x: x1, y: y1, duration: 240, ease: 'Cubic.easeOut', onComplete: () => {
      fade(scene, ball, 0, 160); fade(scene, glow, 0, 160);
      cam.shake(200, 0.008);
      const fan = scene.add.graphics().setDepth(D.fx + 1).setBlendMode(Phaser.BlendModes.ADD); // a wide fan of golden flame
      scene.tweens.addCounter({ from: 0, to: 1, duration: 520, ease: 'Cubic.easeOut', onUpdate: (tw) => {
        const u = tw.getValue() ?? 0;
        fan.clear();
        for (let f = 0; f < 11; f++) {
          const a = ang + (f - 5) * 0.2, L = (40 + u * 70) * k * (f % 2 ? 0.8 : 1.1), ex = x1 + Math.cos(a) * L, ey = y1 + Math.sin(a) * L * 0.7;
          const nx = -Math.sin(a) * 9 * k, ny = Math.cos(a) * 9 * k;
          fan.fillStyle(f % 2 ? GOLD : GOLD2, 0.8 * (1 - u)).fillTriangle(x1 + nx, y1 + ny, x1 - nx, y1 - ny, ex, ey);
        }
      }, onComplete: () => fan.destroy() });
      for (const [d, sc] of [[0, 3.6], [90, 2.4]] as const) {
        const boom = scene.add.circle(x1, y1, 22 * k, d ? 0xffffff : GOLD, 0.9).setDepth(D.fx + 1).setBlendMode(Phaser.BlendModes.ADD);
        scene.tweens.add({ targets: boom, scale: sc, alpha: 0, delay: d, duration: 460, onComplete: () => boom.destroy() });
      }
    } });
  });
  const end = BREATH_MS.total;
  for (const o of live) if (o !== dim) fade(scene, o, end - 440, 420);
  scene.tweens.add({ targets: dim, alpha: 0, delay: end - 400, duration: 380, onComplete: () => dim.destroy() });
  scene.time.delayedCall(end, () => scene.events.off('update', tick));
}
