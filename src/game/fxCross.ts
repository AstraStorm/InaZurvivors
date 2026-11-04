/**
 * 1.76 (author): Fuego cruzado (Crossfire), Axel Blaze and Shawn Froste, redrawn from the anime scene the author linked
 * (youtube.com/watch?v=RQPV63KFMC8, watched frame by frame):
 * - Axel wraps himself in a sphere of orange flame lines and Shawn in a sphere of icy light while they run;
 * - the two spin up into a dark starry sky inside a whirl of pale blue ice ribbons;
 * - both kick ONE ball at the same time: a white flash crossed by a band of fire and a band of ice, an X;
 * - the ball flies with the two bands braided round it and bursts into the same X of fire and ice at the goal.
 */
import Phaser from 'phaser';

type S = Phaser.Scene;
type Img = Phaser.GameObjects.Image;
type P = { x: number; y: number };
const AIR = 8900;
const ADD = Phaser.BlendModes.ADD;
const FIRE = 0xff7a1a, FIRE2 = 0xffc04a, ICE = 0x8fe8ff, ICE2 = 0xe8fbff, NIGHT = 0x0b1f6e, WHITE = 0xffffff;

/** Calls `frame(k)` every frame for `ms` (k from 0 to 1, from the scene clock), then destroys the graphics. */
function play(scene: S, depth: number, ms: number, frame: (g: Phaser.GameObjects.Graphics, k: number, t: number) => void, linger = 0) {
  const g = scene.add.graphics().setDepth(depth);
  const t0 = scene.time.now;
  const tick = () => {
    const t = scene.time.now - t0;
    if (t > ms + linger || !g.active) { scene.events.off('update', tick); g.destroy(); return; }
    g.clear();
    frame(g, Math.min(1, t / ms), t / 1000);
  };
  scene.events.on('update', tick);
  scene.events.once('shutdown', () => scene.events.off('update', tick));
  tick();
  return g;
}

/** A sphere of lines round a player: flame meridians for Axel, rings of icy light for Shawn. */
function sphere(g: Phaser.GameObjects.Graphics, x: number, y: number, r: number, fire: boolean, t: number, alpha: number) {
  const c = fire ? FIRE : ICE, c2 = fire ? FIRE2 : ICE2;
  g.fillStyle(c, 0.16 * alpha).fillCircle(x, y, r);
  for (let i = 0; i < 4; i++) { // meridians, turning
    const w = Math.abs(Math.cos(t * 5 + i * 0.8)) * r;
    g.lineStyle(fire ? 2 : 1.5, i % 2 ? c2 : c, 0.85 * alpha).strokeEllipse(x, y, w * 2, r * 2);
  }
  for (let i = -1; i <= 1; i++) g.lineStyle(1.5, c2, 0.7 * alpha).strokeEllipse(x, y + i * r * 0.5, r * 2 * Math.sqrt(1 - (i * 0.5) ** 2), r * 0.5);
  g.lineStyle(2.5, c, 0.9 * alpha).strokeCircle(x, y, r);
  if (fire) for (let i = 0; i < 6; i++) { // little tongues of flame on the outline
    const a = t * 3 + i * 1.05, l = r * (1.15 + 0.12 * Math.sin(t * 20 + i));
    g.lineStyle(2, FIRE2, 0.8 * alpha).lineBetween(x + Math.cos(a) * r, y + Math.sin(a) * r, x + Math.cos(a) * l, y + Math.sin(a) * l);
  }
}

/** The X of the kick and of the impact: a white flash crossed by a band of fire (\) and a band of ice (/). */
function crossX(g: Phaser.GameObjects.Graphics, x: number, y: number, len: number, w: number, alpha: number) {
  for (const [ang, c, c2] of [[Math.PI / 4, FIRE, FIRE2], [-Math.PI / 4, ICE, ICE2]] as const) {
    const dx = Math.cos(ang) * len, dy = Math.sin(ang) * len * 0.8;
    g.lineStyle(w, c, 0.75 * alpha).lineBetween(x - dx, y - dy, x + dx, y + dy);
    g.lineStyle(w * 0.45, c2, 0.95 * alpha).lineBetween(x - dx * 0.85, y - dy * 0.85, x + dx * 0.85, y + dy * 0.85);
  }
  g.fillStyle(WHITE, 0.5 * alpha).fillCircle(x, y, w * 1.6);
  g.fillStyle(WHITE, 0.95 * alpha).fillCircle(x, y, w * 0.8);
}

/**
 * The windup. `fire` and `ice` are where Axel and Shawn stand (the same point when one carries the other as Aura);
 * `x, y` is where they meet and kick. Lasts `ms`; the X of the kick stays a moment after it.
 */
export function crossfireCharge(scene: S, fire: P, ice: P, x: number, y: number, size: number, ms: number) {
  // their spheres while they run
  play(scene, AIR, ms * 0.55, (g, k, t) => {
    const a = Math.min(1, k * 4) * (1 - Math.max(0, k - 0.75) * 4);
    sphere(g, fire.x, fire.y - 12, 13, true, t, a);
    if (ice.x !== fire.x || ice.y !== fire.y) sphere(g, ice.x, ice.y - 12, 13, false, t, a);
  });
  // the starry sky round the meeting point, the whirl of ice ribbons rising, and the X of the kick
  const stars = Array.from({ length: 16 }, (_, i) => ({ a: i * 2.4, d: 0.25 + ((i * 37) % 10) / 13, s: 1 + (i % 3) * 0.5 }));
  play(scene, AIR - 1, ms, (g, k, t) => {
    const sky = Math.min(1, Math.max(0, (k - 0.2) * 3)) * (1 - Math.max(0, k - 0.92) * 12);
    if (sky <= 0) return;
    for (let i = 0; i < 4; i++) g.fillStyle(NIGHT, 0.2 * sky).fillEllipse(x, y, size * (4.4 - i * 0.8), size * (2.6 - i * 0.45));
    for (const st of stars) {
      const tw = 0.5 + 0.5 * Math.sin(t * 9 + st.a * 3);
      g.fillStyle(WHITE, sky * tw).fillCircle(x + Math.cos(st.a) * st.d * size * 1.9, y + Math.sin(st.a) * st.d * size * 1.1, st.s);
    }
  });
  play(scene, AIR + 1, ms, (g, k, t) => {
    const grow = Math.min(1, Math.max(0, (k - 0.25) * 2.2));
    if (grow > 0 && k < 0.95) for (let arm = 0; arm < 3; arm++) { // ice ribbons spiralling up round the two
      g.lineStyle(3 - arm * 0.6, arm ? ICE2 : ICE, 0.85 * grow).beginPath();
      for (let i = 0; i <= 24; i++) {
        const u = i / 24, a = t * 9 + arm * 2.1 + u * 7, r = size * (1.2 - u * 0.55) * grow;
        const px = x + Math.cos(a) * r, py = y + 8 - u * size * 1.3 * grow + Math.sin(a) * r * 0.35;
        if (i) g.lineTo(px, py); else g.moveTo(px, py);
      }
      g.strokePath();
    }
    if (k > 0.78) { const s = (k - 0.78) / 0.22; crossX(g, x, y - 6, size * (0.4 + s * 1.1), 3 + s * 4, Math.min(1, s * 3)); }
  });
  // the X lingers and fades after the kick
  scene.time.delayedCall(ms, () => play(scene, AIR + 1, 260, (g, k) => crossX(g, x, y - 6, size * (1.5 + k * 0.6), 7 * (1 - k * 0.5), 1 - k)));
}

/** The flying ball: one band of fire and one of ice braided round it; at the end it bursts into the X. */
export function crossfireShot(scene: S, ball: Img, level: number) {
  const g = scene.add.graphics().setDepth(AIR);
  const core = scene.add.circle(ball.x, ball.y, 10, WHITE, 0.45).setDepth(AIR + 1).setBlendMode(ADD);
  let px = ball.x, py = ball.y, ang = 0;
  const t0 = scene.time.now, len = 54 + level * 3, r = 9 + level * 0.8;
  const tick = () => {
    if (!ball.active) {
      scene.events.off('update', tick);
      g.destroy();
      crossfireBurst(scene, px, py, 26 + level * 3);
      scene.tweens.add({ targets: core, alpha: 0, scale: 2.6, duration: 220, onComplete: () => core.destroy() });
      return;
    }
    if (Math.hypot(ball.x - px, ball.y - py) > 0.5) ang = Math.atan2(ball.y - py, ball.x - px);
    px = ball.x; py = ball.y;
    const t = (scene.time.now - t0) / 1000, bx = -Math.cos(ang), by = -Math.sin(ang), nx = -by, ny = bx;
    g.clear();
    for (const [ph, c, c2] of [[0, FIRE, FIRE2], [Math.PI, ICE, ICE2]] as const) {
      for (const [w, col, al] of [[5, c, 0.7], [2, c2, 1]] as const) {
        g.lineStyle(w, col, al).beginPath();
        for (let i = 0; i <= 18; i++) {
          const u = i / 18, wave = Math.sin(t * 22 - u * 9 + ph) * r * (1 - u * 0.35);
          const qx = px + bx * u * len + nx * wave, qy = py + by * u * len + ny * wave * 0.8;
          if (i) g.lineTo(qx, qy); else g.moveTo(qx, qy);
        }
        g.strokePath();
      }
    }
    core.setPosition(px, py).setScale(1 + Math.sin(t * 30) * 0.12);
  };
  scene.events.on('update', tick);
  scene.events.once('shutdown', () => scene.events.off('update', tick));
}

/** The impact: the X of fire and ice opens and fades, with sparks of both colours. */
export function crossfireBurst(scene: S, x: number, y: number, size: number) {
  play(scene, AIR + 2, 340, (g, k) => crossX(g, x, y, size * (0.5 + k * 1.2), 8 * (1 - k * 0.6), 1 - k * k));
  for (let i = 0; i < 12; i++) {
    const a = Math.PI / 4 + Math.floor(i / 3) * (Math.PI / 2) + (Math.random() - 0.5) * 0.35, ice = i % 6 >= 3;
    const s = scene.add.circle(x, y, 2 + Math.random() * 2, ice ? ICE : FIRE, 1).setDepth(AIR + 2).setBlendMode(ADD);
    scene.tweens.add({ targets: s, x: x + Math.cos(a) * size * 1.6, y: y + Math.sin(a) * size * 1.2, alpha: 0, duration: 360, onComplete: () => s.destroy() });
  }
}
