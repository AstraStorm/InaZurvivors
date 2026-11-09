/**
 * Tormenta de fuego with Surtur (author's portrait of the spirit; the description: «Surtur la convierte en un infierno»):
 * Gigante de fuego, Surtur — a dark-grey giant, angular orange plates rising off his brow like flames with a white streak
 * down the middle, a crimson mane streaming back, slanted yellow eyes, high orange collar points. The pitch goes red, he
 * rises behind the shooter with his arms crossed in an X while the blaze grows (the Tormenta de fuego windup), throws them
 * open in a ring of fire, the shooter volleys a giant fireball and where it lands the storm breaks: fire tornadoes burst up
 * all round and the ground keeps burning.
 */
import Phaser from 'phaser';
import { canvasTex, D, fade, rnd } from './fxKeshin';

type S = Phaser.Scene;
const FIRE = 0xff5a2a, FIRE2 = 0xffc04a, EMBER = 0xff2a0a;
const OUT = '#1a0606';

/** dark-grey skin */
const skin = (c: CanvasRenderingContext2D, y0: number, y1: number) => {
  const g = c.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, '#8a8890'); g.addColorStop(0.6, '#5a5860'); g.addColorStop(1, '#34323a'); return g;
};
/** orange plate */
const plate = (c: CanvasRenderingContext2D, y0: number, y1: number) => {
  const g = c.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, '#ff8a4a'); g.addColorStop(0.5, '#ee3a1a'); g.addColorStop(1, '#9a1206'); return g;
};
const poly = (c: CanvasRenderingContext2D, pts: number[][], fill: string | CanvasGradient, w = 3.5) => {
  c.beginPath(); pts.forEach(([px, py], n) => (n ? c.lineTo(px, py) : c.moveTo(px, py))); c.closePath();
  c.fillStyle = fill; c.fill(); c.lineWidth = w; c.strokeStyle = OUT; c.stroke();
};

/** the head: the crimson mane streaming back, the flame plates off the brow, the white streak, the dark face; 360×340,
 *  chin at (180, 330) */
function drawHead(c: CanvasRenderingContext2D) {
  const cx = 180;
  c.lineJoin = 'round'; c.lineCap = 'round';
  // the mane (author's still): a great blaze of red flame tongues sweeping back and out behind the crest
  for (const s of [-1, 1]) for (let n = 0; n < 6; n++) {
    const y0 = 70 + n * 26, ex = cx + s * (130 + n * 6), ey = 40 + n * 46, w = 26 - n * 2;
    c.beginPath(); c.moveTo(cx + s * 24, y0 + 40);
    c.quadraticCurveTo(cx + s * (70 + n * 10), y0 - 10, ex + s * 40, ey - 20);
    c.quadraticCurveTo(cx + s * (90 + n * 6), y0 + 20 + w, cx + s * 30, y0 + 60 + w); c.closePath();
    const g = c.createLinearGradient(cx, y0, ex + s * 40, ey); g.addColorStop(0, '#a01208'); g.addColorStop(0.6, '#e8321a'); g.addColorStop(1, '#ff8a3a');
    c.fillStyle = g; c.fill(); c.lineWidth = 3; c.strokeStyle = '#3a0400'; c.stroke();
  }
  // the face: long, narrow, a sharp chin
  c.beginPath(); c.moveTo(cx - 44, 170); c.quadraticCurveTo(cx - 50, 260, cx - 22, 306); c.lineTo(cx, 330); c.lineTo(cx + 22, 306); c.quadraticCurveTo(cx + 50, 260, cx + 44, 170); c.closePath();
  c.fillStyle = skin(c, 160, 330); c.fill(); c.lineWidth = 4; c.strokeStyle = OUT; c.stroke();
  // cheekbones, the frown, the mouth
  c.lineWidth = 2.5; c.strokeStyle = '#26242a';
  for (const s of [-1, 1]) { c.beginPath(); c.moveTo(cx + s * 40, 252); c.lineTo(cx + s * 22, 274); c.stroke(); }
  c.beginPath(); c.moveTo(cx - 24, 288); c.quadraticCurveTo(cx, 302, cx + 24, 288); c.lineTo(cx + 18, 300); c.quadraticCurveTo(cx, 310, cx - 18, 300); c.closePath();
  c.fillStyle = '#f4f0e8'; c.fill(); c.lineWidth = 3; c.strokeStyle = OUT; c.stroke(); // the grin, teeth bared
  c.lineWidth = 1.5; for (const d of [-14, -6, 2, 10]) { c.beginPath(); c.moveTo(cx + d, 292); c.lineTo(cx + d + 1, 304); c.stroke(); }
  c.beginPath(); c.moveTo(cx - 3, 246); c.lineTo(cx - 6, 270); c.lineTo(cx + 2, 272); c.lineWidth = 2; c.stroke(); // the nose
  // the slanted yellow eyes, orange irises, glowing
  c.shadowColor = '#ffc04a'; c.shadowBlur = 12;
  for (const s of [-1, 1]) {
    c.beginPath(); c.moveTo(cx + s * 8, 232); c.lineTo(cx + s * 40, 216); c.lineTo(cx + s * 34, 236); c.closePath(); c.fillStyle = '#ffe24a'; c.fill();
    c.beginPath(); c.arc(cx + s * 24, 229, 4.5, 0, Math.PI * 2); c.fillStyle = '#ff6a1a'; c.fill();
  }
  c.shadowBlur = 0;
  for (const s of [-1, 1]) { c.beginPath(); c.moveTo(cx + s * 4, 222); c.lineTo(cx + s * 44, 204); c.lineWidth = 4; c.strokeStyle = OUT; c.stroke(); } // the brows, down in a frown
  // the flame plates rising off the brow and sweeping back: a crown of pointed orange blades
  for (const s of [-1, 1]) {
    poly(c, [[cx + s * 6, 214], [cx + s * 30, 120], [cx + s * 22, 10], [cx + s * 62, 104], [cx + s * 50, 196]], plate(c, 10, 214));
    poly(c, [[cx + s * 40, 196], [cx + s * 84, 96], [cx + s * 120, 30], [cx + s * 104, 120], [cx + s * 56, 210]], plate(c, 30, 210));
    poly(c, [[cx + s * 48, 222], [cx + s * 120, 160], [cx + s * 168, 140], [cx + s * 118, 200], [cx + s * 52, 244]], plate(c, 140, 244));
    c.lineWidth = 2.5; c.strokeStyle = '#ffd88a'; c.beginPath(); c.moveTo(cx + s * 28, 190); c.lineTo(cx + s * 30, 70); c.moveTo(cx + s * 60, 180); c.lineTo(cx + s * 100, 70); c.stroke();
  }
  // the white streak down the middle
  poly(c, [[cx - 6, 216], [cx - 10, 120], [cx, 40], [cx + 10, 120], [cx + 6, 216]], '#f4f0f0', 3);
}
/** the body: dark-grey chest, flame pauldrons pointing up, the high orange collar; 440×340, the waist at (220, 336) */
function drawTorso(c: CanvasRenderingContext2D) {
  const cx = 220;
  c.lineJoin = 'round';
  c.beginPath(); c.moveTo(cx - 70, 40); c.quadraticCurveTo(cx - 150, 50, cx - 160, 110); c.quadraticCurveTo(cx - 110, 150, cx - 96, 190);
  c.quadraticCurveTo(cx - 70, 270, cx - 70, 336); c.lineTo(cx + 70, 336); c.quadraticCurveTo(cx + 70, 270, cx + 96, 190);
  c.quadraticCurveTo(cx + 110, 150, cx + 160, 110); c.quadraticCurveTo(cx + 150, 50, cx + 70, 40); c.closePath();
  c.fillStyle = skin(c, 40, 336); c.fill(); c.lineWidth = 4.5; c.strokeStyle = OUT; c.stroke();
  c.lineWidth = 3; c.strokeStyle = '#26242a';
  for (const s of [-1, 1]) { c.beginPath(); c.moveTo(cx, 110); c.quadraticCurveTo(cx + s * 50, 100, cx + s * 86, 130); c.quadraticCurveTo(cx + s * 70, 176, cx + s * 4, 170); c.stroke(); }
  c.beginPath(); c.moveTo(cx, 110); c.lineTo(cx, 320); c.stroke();
  for (const y of [210, 246, 282]) { c.beginPath(); c.moveTo(cx - 40, y - 4); c.quadraticCurveTo(cx - 20, y + 6, cx, y); c.quadraticCurveTo(cx + 20, y + 6, cx + 40, y - 4); c.stroke(); }
  // the red flame armour curling across the dark chest (the still)
  for (const s of [-1, 1]) {
    poly(c, [[cx + s * 4, 96], [cx + s * 70, 110], [cx + s * 110, 150], [cx + s * 60, 140], [cx + s * 84, 190], [cx + s * 36, 160], [cx + s * 40, 230], [cx + s * 10, 180]], plate(c, 96, 230), 3);
    poly(c, [[cx + s * 60, 250], [cx + s * 96, 200], [cx + s * 90, 270], [cx + s * 70, 300]], plate(c, 200, 300), 3);
  }
  // a dark-crimson sash at the waist, glowing seams of fire on the chest
  poly(c, [[cx - 74, 300], [cx + 74, 300], [cx + 70, 336], [cx - 70, 336]], '#6a0a1a', 3);
  c.shadowColor = '#ff6a1a'; c.shadowBlur = 8; c.strokeStyle = '#ff9a3a'; c.lineWidth = 2.5;
  for (const s of [-1, 1]) { c.beginPath(); c.moveTo(cx + s * 10, 186); c.lineTo(cx + s * 30, 220); c.lineTo(cx + s * 20, 260); c.stroke(); }
  c.shadowBlur = 0;
  // the flame pauldrons: three blades up off each shoulder
  for (const s of [-1, 1]) {
    poly(c, [[cx + s * 90, 120], [cx + s * 120, 30], [cx + s * 128, 90], [cx + s * 160, 4], [cx + s * 162, 84], [cx + s * 204, 30], [cx + s * 178, 130], [cx + s * 130, 150]], plate(c, 4, 150), 4);
    c.lineWidth = 2.5; c.strokeStyle = '#ffd88a'; c.beginPath(); c.moveTo(cx + s * 126, 110); c.lineTo(cx + s * 150, 40); c.stroke();
    c.beginPath(); c.ellipse(cx + s * 140, 112, 15, 12, 0, 0, Math.PI * 2); c.fillStyle = '#ffd23a'; c.fill(); c.lineWidth = 3; c.strokeStyle = OUT; c.stroke(); // the yellow gem
    c.beginPath(); c.ellipse(cx + s * 136, 108, 5, 4, 0, 0, Math.PI * 2); c.fillStyle = '#fff8c0'; c.fill();
  }
  // the high orange collar points rising either side of the neck
  for (const s of [-1, 1]) poly(c, [[cx + s * 10, 96], [cx + s * 34, 60], [cx + s * 54, -0], [cx + s * 72, 70], [cx + s * 40, 110]], plate(c, 0, 110), 4);
}
/** an arm from the shoulder at (50, 14) on 100×240 (the still): red upper arm, a big white forearm flaring into white
 *  flame spikes, a white clawed hand */
function drawArm(c: CanvasRenderingContext2D) {
  const sx = 50;
  c.lineJoin = 'round';
  c.beginPath(); c.moveTo(sx - 24, 14); c.quadraticCurveTo(sx - 30, 60, sx - 24, 100); c.lineTo(sx + 24, 100); c.quadraticCurveTo(sx + 30, 60, sx + 24, 14); c.closePath();
  c.fillStyle = plate(c, 0, 100); c.fill(); c.lineWidth = 4; c.strokeStyle = OUT; c.stroke();
  const wg = c.createLinearGradient(0, 90, 0, 200); wg.addColorStop(0, '#ffffff'); wg.addColorStop(1, '#c8c4d0');
  poly(c, [[sx - 26, 92], [sx - 46, 120], [sx - 30, 130], [sx - 48, 160], [sx - 28, 166], [sx - 22, 196], [sx + 22, 196], [sx + 28, 166], [sx + 48, 160], [sx + 30, 130], [sx + 46, 120], [sx + 26, 92]], wg, 4);
  c.lineWidth = 2.5; c.strokeStyle = '#9a96b0'; c.beginPath(); c.moveTo(sx - 10, 110); c.quadraticCurveTo(sx - 4, 150, sx - 8, 186); c.stroke();
  c.beginPath(); c.ellipse(sx, 210, 24, 18, 0, 0, Math.PI * 2); c.fillStyle = '#f4f2f8'; c.fill(); c.lineWidth = 3.5; c.strokeStyle = OUT; c.stroke();
  for (const d of [-16, -5, 6, 17]) poly(c, [[sx + d - 5, 222], [sx + d, 238], [sx + d + 5, 222]], '#ffffff', 2); // the claws
}
const headTex = (scene: S) => canvasTex(scene, 'surtur-head2', 360, 340, (c) => drawHead(c));
const torsoTex = (scene: S) => canvasTex(scene, 'surtur-torso2', 440, 340, (c) => drawTorso(c));
const armTex = (scene: S) => canvasTex(scene, 'surtur-arm2', 100, 240, (c) => drawArm(c));

export interface InfernoHooks {
  /** the arms thrown open: a ring of fire `r` round the shooter */
  onRing: (x: number, y: number, r: number) => void;
  /** the fireball lands on (x, y): the blast, `r` round */
  onBlast: (x: number, y: number, r: number) => void;
  /** a fire tornado bursts up at (x, y), `r` round */
  onTornado: (x: number, y: number, r: number) => void;
  /** the ground left burning, `r` round (x, y), for `ms` */
  onBurn: (x: number, y: number, r: number, ms: number) => void;
}
/** times of the scene, ms */
export const INFERNO_MS = { rise: 250, open: 1050, kick: 1500, land: 1850, total: 3400 };
/** the blast, the tornadoes and the burning ground, by level */
export const infernoSize = (level: number) => ({ ring: 190, blast: 150 + level * 10, tornadoes: 5 + Math.floor(level / 2), spread: 230 + level * 12, twister: 64 + level * 3, burn: 3500 });

/** a fire tornado at (x, y): stacked spinning rings of flame rising up, `r` wide at the top, for `ms` */
function twister(scene: S, x: number, y: number, r: number, ms: number) {
  const g = scene.add.graphics().setDepth(D.fx).setBlendMode(Phaser.BlendModes.ADD), t0 = scene.time.now, H = r * 3.4;
  const tick = () => {
    if (!g.active) { scene.events.off('update', tick); return; }
    const u = (scene.time.now - t0) / ms, grow = Math.min(1, u * 4), a = u > 0.7 ? (1 - u) / 0.3 : 1;
    g.clear();
    // the funnel's body: layers of flame narrowing to the ground, swaying
    for (const [ww, col, al] of [[1.15, EMBER, 0.32], [0.85, FIRE, 0.42], [0.45, FIRE2, 0.5]] as const) {
      g.fillStyle(col, al * a).beginPath().moveTo(x, y);
      for (let v = 0; v <= 1.001; v += 0.1) { const sw = Math.sin(scene.time.now / 120 + v * 5) * r * 0.12 * v; g.lineTo(x + sw + r * (0.15 + v * 0.85) * ww * grow, y - v * H * grow); }
      for (let v = 1; v >= -0.001; v -= 0.1) { const sw = Math.sin(scene.time.now / 120 + v * 5) * r * 0.12 * v; g.lineTo(x + sw - r * (0.15 + v * 0.85) * ww * grow, y - v * H * grow); }
      g.closePath().fillPath();
    }
    for (let n = 0; n < 12; n++) {
      const v = n / 11, w = r * (0.25 + v * 0.75) * grow, py = y - v * H * grow, ph = scene.time.now / 90 + n * 0.8;
      g.lineStyle(3 + (1 - v) * 3, n % 3 === 0 ? 0xffffff : n % 2 ? FIRE : FIRE2, 0.6 * a);
      g.beginPath(); g.arc(x + Math.sin(ph) * w * 0.1, py, w, ph % (Math.PI * 2), ph % (Math.PI * 2) + Math.PI * 1.4); g.strokePath();
    }
    g.fillStyle(FIRE, 0.22 * a).fillEllipse(x, y, r * 2.2 * grow, r * 0.9 * grow);
    if (u >= 1) { scene.events.off('update', tick); g.destroy(); }
  };
  scene.events.on('update', tick);
}

/** Tormenta de fuego with Surtur. (x, y) the shooter's feet, (tx, ty) the rival. Visual only: the scene deals the damage. */
export function inferno(scene: S, x: number, y: number, tx: number, ty: number, level: number, hooks: InfernoHooks) {
  const k = 1 + level * 0.05, side = tx >= x ? 1 : -1, cam = scene.cameras.main, view = () => cam.worldView;
  const size = infernoSize(level);
  const live: Phaser.GameObjects.GameObject[] = [];
  const keep = <T extends Phaser.GameObjects.GameObject>(o: T) => { live.push(o); return o; };
  const dim = keep(scene.add.rectangle(view().centerX, view().centerY, view().width * 2, view().height * 2, 0x2a0400, 1).setDepth(D.dim).setAlpha(0));
  scene.tweens.add({ targets: dim, alpha: 0.66, duration: 260 });
  // embers rising all over the screen
  const embers = scene.time.addEvent({ delay: 40, repeat: Math.floor(INFERNO_MS.total / 40) - 12, callback: () => {
    const e = scene.add.circle(view().left + rnd(0, view().width), view().bottom + 6, rnd(1.5, 3.5), Math.random() < 0.5 ? FIRE2 : EMBER, 1).setDepth(D.fx).setBlendMode(Phaser.BlendModes.ADD);
    scene.tweens.add({ targets: e, y: e.y - view().height * rnd(0.5, 1), x: e.x + rnd(-40, 40), alpha: 0, duration: rnd(1200, 2000), onComplete: () => e.destroy() });
  } });
  // the ring of fire on the ground round the shooter
  const floor = keep(scene.add.ellipse(x, y, 40, 22).setStrokeStyle(6, FIRE, 1).setDepth(D.aura).setBlendMode(Phaser.BlendModes.ADD));
  scene.tweens.add({ targets: floor, scaleX: 4.4, scaleY: 4.4, duration: 400, ease: 'Cubic.easeOut' });
  // ---- Surtur: the body, the arms crossed in an X over the chest, the head
  // he fills most of the view's height whatever the camera's zoom, and never pokes out of its top
  const H = 720, gs = (view().height * 0.8) / H, wx = x - side * 8, wy = Math.max(y + 12, view().top + H * gs + 4);
  const blaze = keep(scene.add.graphics().setDepth(D.giant - 1).setBlendMode(Phaser.BlendModes.ADD));
  const spirit = keep(scene.add.container(wx, wy + 50).setDepth(D.giant).setScale(gs * 0.4).setAlpha(0));
  const torso = scene.add.image(0, 0, torsoTex(scene)).setOrigin(0.5, 336 / 340);
  const arms = [-1, 1].map((s) => scene.add.image(s * 120, -270, armTex(scene)).setOrigin(0.5, 14 / 240).setAngle(s * 54)); // crossed in an X over the chest
  const head = scene.add.image(0, -296, headTex(scene)).setOrigin(0.5, 330 / 340).setScale(1.15);
  spirit.add([torso, ...arms, head]);
  try { spirit.postFX?.addGlow(FIRE, 4, 0, false, 0.1, 12); } catch { /* canvas renderer: no glow */ }
  scene.tweens.add({ targets: spirit, alpha: 1, y: wy, scaleX: gs, scaleY: gs, delay: INFERNO_MS.rise, duration: 520, ease: 'Back.easeOut' });
  let heat = 0.4; // how big the blaze behind him is
  scene.tweens.addCounter({ from: 0.4, to: 1, delay: INFERNO_MS.rise, duration: INFERNO_MS.open - INFERNO_MS.rise, onUpdate: (tw) => { heat = tw.getValue() ?? 1; } });
  const t0 = scene.time.now;
  const tick = () => {
    if (!spirit.active) { scene.events.off('update', tick); return; }
    const t = (scene.time.now - t0) / 1000;
    dim.setPosition(view().centerX, view().centerY);
    head.setAngle(Math.sin(t * 2.4) * 1.5);
    // the blaze behind him: tongues of flame licking up round his outline
    blaze.clear();
    if (spirit.alpha > 0.05) {
      const sc = spirit.scaleX, cx = spirit.x, cy = spirit.y - 320 * sc;
      for (let n = 0; n < 15; n++) {
        const a = -Math.PI / 2 + (n / 14 - 0.5) * 3.2, L = (260 + Math.sin(t * 13 + n * 1.7) * 50) * sc * heat * (1 - Math.abs(n / 14 - 0.5) * 0.6);
        const bx = cx + Math.cos(a) * 150 * sc, by = cy + Math.sin(a) * 200 * sc, nx = -Math.sin(a) * 30 * sc, ny = Math.cos(a) * 30 * sc;
        blaze.fillStyle(n % 3 === 0 ? FIRE2 : n % 2 ? FIRE : EMBER, 0.42 * spirit.alpha).fillTriangle(bx + nx, by + ny, bx - nx, by - ny, bx + Math.cos(a) * L, by + Math.sin(a) * L);
      }
    }
  };
  scene.events.on('update', tick);
  // the arms thrown open: a ring of fire bursts out round the shooter
  scene.time.delayedCall(INFERNO_MS.open, () => {
    if (!spirit.active) return;
    scene.tweens.add({ targets: arms[0], angle: 130, duration: 180, ease: 'Back.easeOut' }); // flung up and out
    scene.tweens.add({ targets: arms[1], angle: -130, duration: 180, ease: 'Back.easeOut' });
    cam.shake(200, 0.005); cam.flash(90, 255, 120, 40);
    hooks.onRing(x, y, size.ring);
    for (const [d, col] of [[0, 0xffffff], [80, FIRE2], [160, FIRE]] as const) {
      const ring = scene.add.ellipse(x, y - 6, size.ring * 0.5, size.ring * 0.3).setStrokeStyle(8, col, 0.95).setDepth(D.fx - 1).setBlendMode(Phaser.BlendModes.ADD);
      scene.tweens.add({ targets: ring, scale: 4, alpha: 0, delay: d, duration: 560, ease: 'Cubic.easeOut', onComplete: () => ring.destroy() });
    }
  });
  // the volley: a giant fireball flies to the rival
  scene.time.delayedCall(INFERNO_MS.kick, () => {
    if (!spirit.active) return;
    scene.tweens.add({ targets: arms, angle: 0, duration: 140 });
    scene.tweens.add({ targets: arms[side > 0 ? 1 : 0], angle: -side * 70, duration: 160, ease: 'Cubic.easeOut' }); // he points the way
    cam.shake(120, 0.004);
    const sx = x, sy = y - 30, dur = INFERNO_MS.land - INFERNO_MS.kick;
    const ballR = 12 * k; // world px: the camera is close
    const core = scene.add.circle(sx, sy, ballR, FIRE2, 1).setDepth(D.fx + 2).setBlendMode(Phaser.BlendModes.ADD);
    const halo = scene.add.circle(sx, sy, ballR * 1.8, FIRE, 0.55).setDepth(D.fx + 1).setBlendMode(Phaser.BlendModes.ADD);
    const ball = scene.add.image(sx, sy, 'fx:ball').setDepth(D.fx + 3);
    const trail = scene.time.addEvent({ delay: 18, repeat: Math.floor(dur / 18), callback: () => {
      const f = scene.add.circle(core.x + rnd(-6, 6), core.y + rnd(-6, 6), ballR * rnd(0.7, 1.2), Math.random() < 0.5 ? FIRE : EMBER, 0.8).setDepth(D.fx).setBlendMode(Phaser.BlendModes.ADD);
      scene.tweens.add({ targets: f, scale: 0.2, alpha: 0, duration: 320, onComplete: () => f.destroy() });
    } });
    scene.tweens.addCounter({ from: 0, to: 1, duration: dur, ease: 'Quad.easeIn', onUpdate: (tw) => {
      const u = tw.getValue() ?? 0, bx = sx + (tx - sx) * u, by = sy + (ty - sy) * u - Math.sin(u * Math.PI) * 60;
      core.setPosition(bx, by); halo.setPosition(bx, by).setScale(1 + Math.sin(u * 30) * 0.12); ball.setPosition(bx, by).setAngle(u * 1000);
    }, onComplete: () => {
      trail.remove(); core.destroy(); halo.destroy(); ball.destroy();
      // the storm breaks: the blast, then fire tornadoes bursting up one after another all round, and the ground burns
      hooks.onBlast(tx, ty, size.blast);
      cam.shake(260, 0.008); cam.flash(120, 255, 140, 40);
      const glow = scene.add.circle(tx, ty, size.blast * 0.45, FIRE2, 0.6).setDepth(D.fx).setBlendMode(Phaser.BlendModes.ADD);
      scene.tweens.add({ targets: glow, scale: 1.6, alpha: 0, duration: 520, onComplete: () => glow.destroy() });
      for (const [d, col] of [[0, 0xffffff], [90, FIRE2], [180, EMBER]] as const) {
        const ring = scene.add.ellipse(tx, ty, size.blast, size.blast * 0.6).setStrokeStyle(5, col, 0.8).setDepth(D.fx - 1).setBlendMode(Phaser.BlendModes.ADD);
        scene.tweens.add({ targets: ring, scale: size.spread * 1.5 / size.blast, alpha: 0, delay: d, duration: 700, ease: 'Cubic.easeOut', onComplete: () => ring.destroy() });
      }
      // the burning ground outlives the scene (the scene burns the rivals for as long): it fades on its own
      const scorch = scene.add.ellipse(tx, ty, size.spread * 2, size.spread * 1.2, 0x3a0800, 0.55).setDepth(D.fx - 3);
      const lick = scene.add.graphics().setDepth(D.fx - 2).setBlendMode(Phaser.BlendModes.ADD);
      const lickEv = scene.time.addEvent({ delay: 70, loop: true, callback: () => {
        lick.clear();
        for (let n = 0; n < 26; n++) {
          const a = rnd(0, Math.PI * 2), d = Math.sqrt(Math.random()) * size.spread, fx0 = tx + Math.cos(a) * d, fy0 = ty + Math.sin(a) * d * 0.6, h = rnd(14, 34);
          lick.fillStyle(Math.random() < 0.5 ? FIRE : FIRE2, 0.6).fillTriangle(fx0 - 6, fy0, fx0 + 6, fy0, fx0 + rnd(-3, 3), fy0 - h);
        }
      } });
      hooks.onBurn(tx, ty, size.spread, size.burn);
      for (let n = 0; n < size.tornadoes; n++) scene.time.delayedCall(60 + n * 110, () => {
        const a = n / size.tornadoes * Math.PI * 2 + rnd(-0.3, 0.3), d = n === 0 ? 0 : size.spread * rnd(0.45, 0.9);
        const px = tx + Math.cos(a) * d, py = ty + Math.sin(a) * d * 0.6;
        twister(scene, px, py, size.twister * 0.6, 1300); // drawn smaller than it burns: the camera is close
        hooks.onTornado(px, py, size.twister);
      });
      scene.time.delayedCall(size.burn, () => lickEv.remove());
      fade(scene, scorch, size.burn, 400); fade(scene, lick, size.burn, 400);
    } });
    scene.time.delayedCall(dur + 500, () => { if (spirit.active) scene.tweens.add({ targets: spirit, alpha: 0, y: spirit.y - 30, duration: 620, ease: 'Cubic.easeIn' }); });
  });
  const end = INFERNO_MS.total;
  for (const o of live) if (o !== dim) fade(scene, o, end - 450, 420);
  scene.tweens.add({ targets: dim, alpha: 0, delay: end - 420, duration: 400, onComplete: () => dim.destroy() });
  scene.time.delayedCall(end, () => { scene.events.off('update', tick); embers.remove(); });
}
