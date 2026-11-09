/**
 * Espinas insidiosas (author, from its scene in Chrono Stones, xNGetygr1hE 2:35; inazuma.fandom «Bruja de la discordia
 * Eris»: an air spirit, «enreda a los enemigos en un caos de rosas espinosas»; Mystic Thorn: «Eris adentra su pelo en el
 * suelo sacando 4 lazos con espinas, que rodean al rival y lo derriban»). A cyan whirlwind spins up round the player and
 * Eris unfolds behind her (a black hood with two tall ears edged in teal, a white mask with black spirals, a ruff of black
 * feathers with a blue rose at the chest, a black bodysuit lined in teal, and great locks of pale blue hair spreading like
 * wings, ending in thorns). The sky turns violet, she drives her hair into the ground, and four lashes of black thorns burst
 * up in blue fire round the rivals, coil round them and hold them.
 */
import Phaser from 'phaser';
import { canvasTex, D, fade, rnd } from './fxKeshin';

type S = Phaser.Scene;
const CYAN = 0x4ae8ff, BLUE = 0x2a6aff, BLUE2 = 0x8ab8ff, THORN = 0x14141e;
const OUT = '#08080e', BLACK = '#16161e', BLACK2 = '#262636', TEAL = '#3ad8e8', HAIR = '#a8c4e8', HAIR2 = '#7a98c8', WHITE = '#f2f2f6';

/** the head: the black hood with two tall ears edged in teal, the white mask with black spirals; 220×280, chin at (110, 270) */
function drawHead(c: CanvasRenderingContext2D) {
  const cx = 110;
  c.lineJoin = 'round'; c.lineCap = 'round';
  // the two tall ears of the hood, curving out, edged in teal
  for (const s of [-1, 1]) {
    c.beginPath(); c.moveTo(cx + s * 20, 130); c.quadraticCurveTo(cx + s * 70, 70, cx + s * 52, 4); c.quadraticCurveTo(cx + s * 30, 60, cx + s * 6, 110); c.closePath();
    c.fillStyle = BLACK; c.fill(); c.lineWidth = 6; c.strokeStyle = TEAL; c.stroke(); c.lineWidth = 2.5; c.strokeStyle = OUT; c.stroke();
    c.beginPath(); c.moveTo(cx + s * 22, 110); c.quadraticCurveTo(cx + s * 52, 70, cx + s * 46, 24); c.lineWidth = 3; c.strokeStyle = TEAL; c.stroke();
  }
  // the hood round the face
  c.beginPath(); c.moveTo(cx - 62, 250); c.quadraticCurveTo(cx - 74, 120, cx, 100); c.quadraticCurveTo(cx + 74, 120, cx + 62, 250); c.lineTo(cx + 40, 270); c.lineTo(cx - 40, 270); c.closePath();
  c.fillStyle = BLACK2; c.fill(); c.lineWidth = 4; c.strokeStyle = OUT; c.stroke();
  // the white mask: long, pointed at the chin
  c.beginPath(); c.moveTo(cx - 42, 140); c.quadraticCurveTo(cx, 124, cx + 42, 140); c.quadraticCurveTo(cx + 46, 210, cx, 270); c.quadraticCurveTo(cx - 46, 210, cx - 42, 140); c.closePath();
  c.fillStyle = WHITE; c.fill(); c.lineWidth = 3.5; c.strokeStyle = OUT; c.stroke();
  // the black spirals over the eyes and the line down to the chin
  c.lineWidth = 4; c.strokeStyle = BLACK;
  for (const s of [-1, 1]) {
    c.beginPath(); for (let a = 0; a < Math.PI * 3.2; a += 0.2) { const r = 3 + a * 2.6; const px = cx + s * 20 + Math.cos(a * s) * r, py = 178 + Math.sin(a * s) * r * 0.8; if (a === 0) c.moveTo(px, py); else c.lineTo(px, py); } c.stroke();
  }
  c.beginPath(); c.moveTo(cx, 200); c.lineTo(cx, 262); c.moveTo(cx - 16, 226); c.quadraticCurveTo(cx, 236, cx + 16, 226); c.stroke();
  c.fillStyle = TEAL; for (const s of [-1, 1]) { c.beginPath(); c.arc(cx + s * 20, 178, 3, 0, Math.PI * 2); c.fill(); }
}
/** the body: the pale hair spreading out like wings with thorny tips, the ruff of black feathers with the blue rose, the
 *  black bodysuit lined in teal, the white collar; 600×360, the waist at (300, 356) */
function drawBody(c: CanvasRenderingContext2D) {
  const cx = 300;
  c.lineJoin = 'round';
  // the locks of pale hair: long tapering ribbons sweeping up and out, a thorn at each end
  for (const s of [-1, 1]) for (const [up, len, w] of [[0.95, 290, 64], [0.55, 270, 56], [0.15, 230, 46]] as const) {
    const a = -Math.PI / 2 + s * (Math.PI / 2 - up * 0.9), x0 = cx + s * 40, y0 = 90;
    const ex = x0 + Math.cos(a) * len, ey = y0 + Math.sin(a) * len * 0.8, mx = x0 + Math.cos(a) * len * 0.5, my = y0 + Math.sin(a) * len * 0.4 - 30;
    c.beginPath(); c.moveTo(x0, y0 - w / 2); c.quadraticCurveTo(mx, my - w / 2, ex, ey); c.quadraticCurveTo(mx, my + w / 2, x0, y0 + w / 2); c.closePath();
    const g = c.createLinearGradient(x0, y0, ex, ey); g.addColorStop(0, HAIR2); g.addColorStop(1, HAIR);
    c.fillStyle = g; c.fill(); c.lineWidth = 3; c.strokeStyle = OUT; c.stroke();
    for (const d of [-1, 1]) { c.beginPath(); c.moveTo(ex, ey); c.lineTo(ex + Math.cos(a + d * 0.9) * 24, ey + Math.sin(a + d * 0.9) * 24); c.lineTo(ex - Math.cos(a) * 10, ey - Math.sin(a) * 10); c.closePath(); c.fillStyle = HAIR; c.fill(); c.lineWidth = 2; c.stroke(); }
  }
  // the black bodysuit lined in teal
  c.beginPath(); c.moveTo(cx - 54, 80); c.quadraticCurveTo(cx - 70, 220, cx - 40, 356); c.lineTo(cx + 40, 356); c.quadraticCurveTo(cx + 70, 220, cx + 54, 80); c.closePath();
  c.fillStyle = BLACK; c.fill(); c.lineWidth = 4; c.strokeStyle = OUT; c.stroke();
  c.lineWidth = 3; c.strokeStyle = TEAL; c.beginPath(); c.moveTo(cx - 30, 150); c.quadraticCurveTo(cx - 44, 250, cx - 20, 350); c.moveTo(cx + 30, 150); c.quadraticCurveTo(cx + 44, 250, cx + 20, 350); c.stroke();
  // the white collar flaring up behind the head
  for (const s of [-1, 1]) { c.beginPath(); c.moveTo(cx + s * 10, 90); c.quadraticCurveTo(cx + s * 70, 40, cx + s * 64, 0); c.quadraticCurveTo(cx + s * 50, 50, cx + s * 30, 110); c.closePath(); c.fillStyle = WHITE; c.fill(); c.lineWidth = 3; c.strokeStyle = OUT; c.stroke(); }
  // the ruff of black feathers
  for (let n = 0; n < 16; n++) {
    const a = Math.PI * (0.05 + n / 15 * 0.9), L = 150 + (n % 2) * 30;
    c.beginPath(); c.moveTo(cx + Math.cos(a - 0.12) * 30, 110 + Math.sin(a - 0.12) * 20); c.lineTo(cx + Math.cos(a) * L, 110 + Math.sin(a) * L * 0.7); c.lineTo(cx + Math.cos(a + 0.12) * 30, 110 + Math.sin(a + 0.12) * 20); c.closePath();
    c.fillStyle = n % 2 ? BLACK : BLACK2; c.fill(); c.lineWidth = 2.5; c.strokeStyle = OUT; c.stroke();
  }
  for (let n = 0; n < 12; n++) { const a = Math.PI * (1.15 + n / 11 * 0.7), L = 80 + (n % 2) * 16; c.beginPath(); c.moveTo(cx + Math.cos(a - 0.15) * 30, 110 + Math.sin(a - 0.15) * 14); c.lineTo(cx + Math.cos(a) * L, 110 + Math.sin(a) * L * 0.5); c.lineTo(cx + Math.cos(a + 0.15) * 30, 110 + Math.sin(a + 0.15) * 14); c.closePath(); c.fillStyle = BLACK2; c.fill(); c.lineWidth = 2.5; c.stroke(); }
  // the blue rose at the chest
  for (let n = 0; n < 6; n++) { const a = n * 1.047; c.beginPath(); c.ellipse(cx + Math.cos(a) * 9, 132 + Math.sin(a) * 9, 10, 7, a, 0, Math.PI * 2); c.fillStyle = n % 2 ? '#3a7aff' : '#5a9aff'; c.fill(); c.lineWidth = 1.5; c.strokeStyle = '#0a1a5a'; c.stroke(); }
  c.beginPath(); c.arc(cx, 132, 7, 0, Math.PI * 2); c.fillStyle = '#1a4ad8'; c.fill(); c.stroke();
}
const headTex = (scene: S) => canvasTex(scene, 'eris-head', 220, 280, (c) => drawHead(c));
const bodyTex = (scene: S) => canvasTex(scene, 'eris-body', 600, 360, (c) => drawBody(c));

export interface ThornHooks {
  /** the thorns burst up round (x, y), `r` round: the scene hurts and holds everything in it */
  onThorns: (x: number, y: number, r: number) => void;
  at: () => { x: number; y: number };
}
export const THORN_MS = { whirl: 0, rise: 420, dive: 1250, thorns: 1550, total: 3000, hold: 1400 };
export const thornR = (level: number) => 95 + level * 9;

/** a lash of black thorns rising out of the ground from (x0, y0) and curling over to (x1, y1), u = 0..1 of its growth */
function lash(g: Phaser.GameObjects.Graphics, x0: number, y0: number, x1: number, y1: number, lift: number, u: number, w: number) {
  const pts: { x: number; y: number }[] = [];
  for (let v = 0; v <= u + 0.001; v += 0.05) { const px = x0 + (x1 - x0) * v, py = y0 + (y1 - y0) * v - Math.sin(v * Math.PI) * lift; pts.push({ x: px, y: py }); }
  if (pts.length < 2) return;
  g.lineStyle(w * 2.2, BLUE, 0.35).beginPath().moveTo(pts[0].x, pts[0].y); for (const p of pts.slice(1)) g.lineTo(p.x, p.y); g.strokePath();
  g.lineStyle(w, THORN, 1).beginPath().moveTo(pts[0].x, pts[0].y); for (const p of pts.slice(1)) g.lineTo(p.x, p.y); g.strokePath();
  g.fillStyle(THORN, 1);
  for (let i = 1; i < pts.length; i += 2) { // the thorns, alternating sides
    const a = Math.atan2(pts[i].y - pts[i - 1].y, pts[i].x - pts[i - 1].x) + (i % 4 === 1 ? -Math.PI / 2 : Math.PI / 2);
    g.fillTriangle(pts[i].x - Math.cos(a + 1.57) * w * 0.4, pts[i].y - Math.sin(a + 1.57) * w * 0.4, pts[i].x + Math.cos(a + 1.57) * w * 0.4, pts[i].y + Math.sin(a + 1.57) * w * 0.4, pts[i].x + Math.cos(a) * w * 1.3, pts[i].y + Math.sin(a) * w * 1.3);
  }
}

/** Espinas insidiosas. (x, y) the player's feet, (tx, ty) the rival. Visual only: the scene deals the damage in the hooks. */
export function insidiousThorns(scene: S, x: number, y: number, tx: number, ty: number, level: number, hooks: ThornHooks) {
  const k = 1 + level * 0.05, cam = scene.cameras.main, view = () => cam.worldView, r = thornR(level);
  const live: Phaser.GameObjects.GameObject[] = [];
  const keep = <T extends Phaser.GameObjects.GameObject>(o: T) => { live.push(o); return o; };
  const dim = keep(scene.add.rectangle(view().centerX, view().centerY, view().width * 2, view().height * 2, 0x0a1a3a, 1).setDepth(D.dim).setAlpha(0));
  scene.tweens.add({ targets: dim, alpha: 0.6, duration: 240 });
  scene.time.delayedCall(THORN_MS.dive - 150, () => { dim.setFillStyle(0x3a0a4a, 1); scene.tweens.add({ targets: dim, alpha: 0.7, duration: 200 }); }); // the violet sky
  const whirl = keep(scene.add.graphics().setDepth(D.giant + 2).setBlendMode(Phaser.BlendModes.ADD));
  // ---- Eris, behind the player
  const H = 620, gs = (view().height * 0.62) / H, wx = x, wy = Math.max(y + 12, view().top + H * gs + 4);
  const spirit = keep(scene.add.container(wx, wy + 30).setDepth(D.giant).setScale(gs * 0.3).setAlpha(0));
  const body = scene.add.image(0, 0, bodyTex(scene)).setOrigin(0.5, 356 / 360);
  const head = scene.add.image(0, -250, headTex(scene)).setOrigin(0.5, 270 / 280).setScale(1.05);
  spirit.add([body, head]);
  try { spirit.postFX?.addGlow(CYAN, 3, 0, false, 0.1, 10); } catch { /* canvas renderer: no glow */ }
  scene.tweens.add({ targets: spirit, alpha: 1, scaleX: gs, scaleY: gs, y: wy, delay: THORN_MS.rise, duration: 480, ease: 'Back.easeOut' });
  const hair = keep(scene.add.graphics().setDepth(D.giant - 1));
  const t0 = scene.time.now;
  const tick = () => {
    if (!spirit.active) { scene.events.off('update', tick); return; }
    const t = (scene.time.now - t0) / 1000, v = view(), ms = scene.time.now - t0;
    dim.setPosition(v.centerX, v.centerY);
    head.setAngle(Math.sin(t * 2) * 2);
    // the cyan whirlwind spinning up round the player
    whirl.clear();
    const wa = Math.min(1, t * 4) * Math.max(0, 1 - Math.max(0, t - 0.9) * 2.5);
    for (let n = 0; n < 4; n++) {
      whirl.lineStyle(5 * k, n % 2 ? CYAN : BLUE2, 0.7 * wa).beginPath();
      for (let u = 0; u <= 1.001; u += 0.05) { const a = t * 9 + n * 1.57 + u * 6, rr = (20 + u * 26) * k; const px = x + Math.cos(a) * rr, py = y - u * 90 * k + Math.sin(a) * rr * 0.35; if (u === 0) whirl.moveTo(px, py); else whirl.lineTo(px, py); }
      whirl.strokePath();
    }
    // her hair driving into the ground at the rival: pale ribbons from her shoulders down to it
    hair.clear();
    if (ms > THORN_MS.dive && ms < THORN_MS.thorns + 500) {
      const u = Math.min(1, (ms - THORN_MS.dive) / (THORN_MS.thorns - THORN_MS.dive)), sa = ms > THORN_MS.thorns ? 1 - (ms - THORN_MS.thorns) / 500 : 1;
      for (const s of [-1, 1]) for (const off of [-1, 1]) {
        const sx = wx + s * 40 * gs, sy = wy - 300 * gs, ex = tx + off * r * 0.3, ey = ty + 10;
        const cxp = (sx + ex) / 2 + s * 60, cyp = Math.min(sy, ey) - 60;
        hair.lineStyle(7 * k, 0xa8c4e8, 0.95 * sa).beginPath().moveTo(sx, sy);
        for (let v2 = 0.05; v2 <= u + 0.001; v2 += 0.05) { const q = 1 - v2; hair.lineTo(q * q * sx + 2 * q * v2 * cxp + v2 * v2 * ex, q * q * sy + 2 * q * v2 * cyp + v2 * v2 * ey); }
        hair.strokePath();
      }
    }
  };
  scene.events.on('update', tick);
  // the thorns: four lashes burst up in blue fire round the rival, coil over and hold everything there
  scene.time.delayedCall(THORN_MS.thorns, () => {
    if (!spirit.active) return;
    cam.shake(300, 0.012); cam.flash(80, 120, 160, 255);
    hooks.onThorns(tx, ty, r);
    const g = keep(scene.add.graphics().setDepth(D.fx));
    const fire = keep(scene.add.graphics().setDepth(D.fx - 1).setBlendMode(Phaser.BlendModes.ADD));
    const roots = [0, 1, 2, 3].map((i) => { const a = i * Math.PI / 2 + 0.4; return { x0: tx + Math.cos(a) * r, y0: ty + 10 + Math.sin(a) * r * 0.5, x1: tx - Math.cos(a) * r * 0.5, y1: ty + 10 - Math.sin(a) * r * 0.25 }; });
    const s0 = scene.time.now;
    const grow = () => {
      if (!g.active) { scene.events.off('update', grow); return; }
      const ms = scene.time.now - s0, u = Math.min(1, ms / 260), a = ms > THORN_MS.hold - 300 ? Math.max(0, 1 - (ms - (THORN_MS.hold - 300)) / 300) : 1;
      g.clear(); fire.clear(); g.setAlpha(a); fire.setAlpha(a);
      for (const [i, q] of roots.entries()) {
        for (let n = 0; n < 5; n++) { const fx = q.x0 + rnd(-8, 8), h = (20 + Math.sin(ms / 60 + n + i) * 8) * k; fire.fillStyle(n % 2 ? BLUE : CYAN, 0.6).fillTriangle(fx - 6 * k, q.y0, fx + 6 * k, q.y0, fx, q.y0 - h); }
        lash(g, q.x0, q.y0, q.x1, q.y1, r * 0.45, u, 5 * k);
      }
      g.lineStyle(4 * k, THORN, 1).strokeEllipse(tx, ty + 6, r * 1.2 * u, r * 0.5 * u); // the ring of thorns binding them
    };
    scene.events.on('update', grow);
    scene.time.delayedCall(THORN_MS.hold, () => { scene.events.off('update', grow); g.destroy(); fire.destroy(); });
    for (let n = 0; n < 16; n++) { // rose petals scattering
      const a = rnd(0, Math.PI * 2), p = scene.add.ellipse(tx, ty, 6 * k, 4 * k, n % 2 ? 0x3a7aff : 0x1a1a2a, 1).setDepth(D.fx + 1);
      scene.tweens.add({ targets: p, x: tx + Math.cos(a) * rnd(40, 110) * k, y: ty + Math.sin(a) * rnd(20, 60) * k - 20, angle: rnd(-300, 300), alpha: 0, duration: rnd(600, 1000), onComplete: () => p.destroy() });
    }
    scene.time.delayedCall(500, () => { if (spirit.active) scene.tweens.add({ targets: spirit, alpha: 0, duration: 560, ease: 'Cubic.easeIn' }); });
  });
  const end = THORN_MS.total;
  for (const o of live) if (o !== dim) fade(scene, o, end - 420, 400);
  scene.tweens.add({ targets: dim, alpha: 0, delay: end - 400, duration: 380, onComplete: () => dim.destroy() });
  scene.time.delayedCall(end, () => scene.events.off('update', tick));
}
