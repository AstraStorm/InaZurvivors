/**
 * Fix 1.3: the look of some signature techniques, after their official descriptions (zukan.inazuma.jp). Visual only:
 * damage, reach and behaviour stay those of their type in ArenaScene.
 *   - Espejismo de balón (Illusory Ball): a dribble that leaves afterimages of the ball, which trick the rivals.
 *   - Ceniza negra (Black Ash): a shot of pure darkness; the black fog in its wake swallows the pitch.
 *   - El ojo del huracán (Storm Zone): a storm rises around the dribbler, who walks through its calm eye.
 */
import Phaser from 'phaser';

type Sig = 'espejismo' | 'ceniza' | 'huracan';
export function signatureOf(name: string): Sig | null {
  if (/espejismo de bal[oó]n|illusion ball|illusory ball/i.test(name)) return 'espejismo';
  if (/ceniza negra|black ash/i.test(name)) return 'ceniza';
  if (/ojo del hurac[aá]n|storm zone|eye of the storm/i.test(name)) return 'huracan';
  return null;
}

const ADD = Phaser.BlendModes.ADD;

/** Espejismo de balón: copies of the ball circle the footballer, split apart and vanish (the real one stays with him). */
export function illusionBall(scene: Phaser.Scene, x: number, y: number, level: number, ms = 620) {
  const n = 3 + Math.min(3, Math.floor(level / 3));
  const start = Math.random() * Math.PI * 2;
  for (let k = 0; k < n; k++) {
    const a0 = start + (k / n) * Math.PI * 2;
    const ball = scene.add.image(x, y, 'fx:ball').setDepth(y + 3).setAlpha(0.9);
    const ghosts = [0.5, 0.3, 0.15].map((al) => scene.add.image(x, y, 'fx:ball').setDepth(y + 2).setAlpha(al).setTint(0xbfe8ff));
    const trail: [number, number][] = [];
    const st = { t: 0 };
    scene.tweens.add({
      targets: st, t: 1, duration: ms, ease: 'Sine.easeInOut',
      onUpdate: () => {
        // circle at a growing radius, then fly out: the afterimages trail behind each copy
        const r = 10 + st.t * (26 + level * 2), a = a0 + st.t * Math.PI * 2.4;
        const bx = x + Math.cos(a) * r, by = y - 8 + Math.sin(a) * r * 0.55;
        ball.setPosition(bx, by).setAngle(st.t * 900).setAlpha(st.t < 0.75 ? 0.9 : 0.9 * (1 - (st.t - 0.75) / 0.25));
        trail.unshift([bx, by]);
        ghosts.forEach((g, i) => { const p = trail[(i + 1) * 3] ?? trail[trail.length - 1]; g.setPosition(p[0], p[1]).setAlpha(g.alpha * 0.98); });
      },
      onComplete: () => { ball.destroy(); ghosts.forEach((g) => g.destroy()); },
    });
  }
  // a shimmer at the feet: the rivals see several balls at once
  const ring = scene.add.ellipse(x, y + 2, 20, 8, 0xbfe8ff, 0.35).setDepth(y - 1).setBlendMode(ADD);
  scene.tweens.add({ targets: ring, scaleX: 3, scaleY: 3, alpha: 0, duration: ms, onComplete: () => ring.destroy() });
}

/*
 * Ceniza negra (author: redrawn from its scene in the GO movie, youtube 4DZ9DrCcL48 0:05-0:16, watched frame by frame).
 * A pillar of magenta and violet flame rises round the shooter; black arms whirl round the ball, which glows pink in the
 * middle of the vortex; the kick turns it into a white sphere wrapped in a black swirl, and it flies as a black needle
 * edged in glowing magenta. Where it lands, a huge black star of spikes bursts over a violet glow.
 */
const MAG = 0xff3ad8, VIO = 0x8a3aff, INK = 0x07030c;

/** runs `frame(g, u, t)` on a fresh graphics at (x, y) for `ms` (u = 0..1, t seconds) */
function anim(scene: Phaser.Scene, x: number, y: number, depth: number, ms: number, frame: (g: Phaser.GameObjects.Graphics, u: number, t: number) => void, add = false) {
  const g = scene.add.graphics({ x, y }).setDepth(depth);
  if (add) g.setBlendMode(ADD);
  const t0 = scene.time.now;
  const tick = () => {
    const t = scene.time.now - t0;
    if (t > ms || !g.active) { scene.events.off('update', tick); g.destroy(); return; }
    g.clear(); frame(g, t / ms, t / 1000);
  };
  scene.events.on('update', tick);
  scene.events.once('shutdown', () => scene.events.off('update', tick));
  tick();
}

/** Ceniza negra, the charge: the magenta flame pillar, the black whirl round the glowing pink ball, the white sphere. */
export function blackAshCharge(scene: Phaser.Scene, x: number, y: number, level: number, ms: number) {
  const k = 1 + level * 0.05;
  // a dark blue shade under the shooter, only round him (author: never the whole screen)
  anim(scene, x, y + 2, y - 2, ms + 200, (g, u) => { const a = Math.min(1, u * 4) * (u > 0.85 ? (1 - u) / 0.15 : 1); g.fillStyle(0x0a0a3a, 0.5 * a).fillEllipse(0, 0, (110 + u * 30) * k, (44 + u * 12) * k); });
  // the pillar of magenta and violet flame
  anim(scene, x, y, y + 2, ms + 120, (g, u, t) => {
    const a = Math.min(1, u * 3) * (u > 0.85 ? (1 - u) / 0.15 : 1), H = (40 + Math.min(1, u * 2) * 26) * k;
    for (let n = 0; n < 13; n++) {
      const fx = (n - 6) * 4 * k, L = H * (0.6 + Math.abs(Math.sin(t * 9 + n * 1.7)) * 0.5);
      g.fillStyle(n % 3 === 0 ? VIO : MAG, (n % 2 ? 0.55 : 0.4) * a).fillTriangle(fx - 5 * k, 4, fx + 5 * k, 4, fx + Math.sin(t * 7 + n) * 4 * k, -L);
    }
    g.fillStyle(0xffb8f0, 0.35 * a).fillEllipse(0, -H * 0.4, 16 * k, H * 0.8);
  }, true);
  // the black whirl round the ball, which glows pink in its middle; at the end the ball is a white sphere in a black swirl
  anim(scene, x + 10 * k, y - 6, y + 3, ms + 140, (g, u, t) => {
    if (u < 0.3) return;
    const w = Math.min(1, (u - 0.3) / 0.4), a = u > 0.9 ? (1 - u) / 0.1 : 1, R = (16 + w * 10) * k;
    for (let arm = 0; arm < 4; arm++) { // curved black arms sweeping in, a violet edge on each
      let px = 0, py = 0;
      for (let i = 0; i <= 14; i++) {
        const q = i / 14, an = t * 6 + arm * Math.PI / 2 + q * 3.2, r = R * (0.25 + q * 1.2);
        const nx = Math.cos(an) * r, ny = Math.sin(an) * r * 0.7;
        if (i) { g.lineStyle((2 + q * 6) * k, VIO, 0.5 * a * w).lineBetween(px, py, nx, ny); g.lineStyle((1 + q * 4) * k, INK, 0.95 * a * w).lineBetween(px, py, nx, ny); }
        px = nx; py = ny;
      }
    }
    const white = u > 0.8;
    g.fillStyle(white ? 0xffffff : MAG, (white ? 0.95 : 0.6) * a).fillCircle(0, 0, (white ? 7 : 5 + w * 3) * k);
    if (white) g.lineStyle(3 * k, INK, a).beginPath().arc(0, 0, 9 * k, t * 8, t * 8 + 4.2).strokePath();
  });
}

/**
 * Ceniza negra, the flight: a black needle edged in magenta from the kick to the ball, its tip a dark point with a white
 * core; where it ends, a black star of spikes bursts over a violet glow and lingers a moment.
 */
export function blackAshTrail(scene: Phaser.Scene, ball: Phaser.GameObjects.Image, level: number) {
  const k = 1 + level * 0.05, x0 = ball.x, y0 = ball.y;
  ball.setTint(0x1a0a24);
  const g = scene.add.graphics().setDepth(ball.depth - 1);
  let lastX = ball.x, lastY = ball.y, ang = 0;
  const tick = () => {
    if (!ball.active) { scene.events.off('update', tick); g.destroy(); burst(lastX, lastY); return; }
    if (Math.hypot(ball.x - lastX, ball.y - lastY) > 0.5) ang = Math.atan2(ball.y - lastY, ball.x - lastX);
    lastX = ball.x; lastY = ball.y;
    const nx = -Math.sin(ang), ny = Math.cos(ang), w = (2.5 + level * 0.15) * k;
    g.clear();
    // the needle: a magenta glow, then the black core, thin at the kick and wider at the tip
    g.fillStyle(MAG, 0.55).fillTriangle(x0, y0, lastX + nx * w * 2.2, lastY + ny * w * 2.2, lastX - nx * w * 2.2, lastY - ny * w * 2.2);
    g.fillStyle(INK, 1).fillTriangle(x0, y0, lastX + nx * w, lastY + ny * w, lastX - nx * w, lastY - ny * w);
    // the tip: rounded (author), a black head with a magenta glow and a white core
    const hx = lastX + Math.cos(ang) * w * 1.2, hy = lastY + Math.sin(ang) * w * 1.2;
    g.fillStyle(MAG, 0.7).fillCircle(hx, hy, w * 3.2);
    g.fillStyle(INK, 1).fillCircle(hx, hy, w * 2.3);
    g.fillStyle(0xffffff, 0.9).fillCircle(hx, hy, w * 0.9);
  };
  scene.events.on('update', tick);
  scene.events.once('shutdown', () => scene.events.off('update', tick));
  const burst = (x: number, y: number) => {
    // the violet glow under it
    anim(scene, x, y, y - 1, 1100, (gg, u) => { const a = u < 0.15 ? u / 0.15 : (1 - u); gg.fillStyle(VIO, 0.45 * a).fillCircle(0, 0, (22 + u * 36) * k); gg.fillStyle(MAG, 0.3 * a).fillCircle(0, 0, (12 + u * 14) * k); }, true);
    // the black star of spikes, bursting out and lingering
    const spikes = 13, seed = Math.random() * 10;
    anim(scene, x, y, y + 1, 1100, (gg, u) => {
      const grow = 1 - Math.pow(1 - Math.min(1, u * 3), 3), a = u > 0.7 ? (1 - u) / 0.3 : 1, R = (14 + grow * 32) * k; // author: a little smaller
      const pts: { x: number; y: number }[] = [];
      for (let i = 0; i < spikes * 2; i++) {
        const an = i / (spikes * 2) * Math.PI * 2, long = i % 2 === 0, j = Math.abs(Math.sin(seed + i * 7.3));
        const r = long ? R * (0.8 + j * 0.45) : R * 0.5;
        pts.push({ x: Math.cos(an) * r, y: Math.sin(an) * r * 0.75 });
      }
      gg.fillStyle(INK, 0.95 * a).fillPoints(pts, true);
      gg.lineStyle(2, VIO, 0.6 * a).strokePoints(pts, true);
    });
  };
}

/**
 * El ojo del huracán: a funnel of wind turns around the footballer (streaks drawn every frame at three heights), leaves
 * and dust fly up its walls and the centre, the eye, stays calm and bright.
 */
export function stormZone(scene: Phaser.Scene, x: number, y: number, radius: number, level: number, ms = 700, color = 0x9cffb0) {
  const g = scene.add.graphics().setDepth(y + 4).setBlendMode(ADD);
  const eye = scene.add.ellipse(x, y - 4, radius * 0.5, radius * 0.22, 0xffffff, 0.25).setDepth(y - 1).setBlendMode(ADD);
  const st = { t: 0 };
  scene.tweens.add({
    targets: st, t: 1, duration: ms,
    onUpdate: () => {
      g.clear();
      const fade = st.t < 0.15 ? st.t / 0.15 : st.t > 0.75 ? (1 - st.t) / 0.25 : 1;
      for (let layer = 0; layer < 3; layer++) {
        const h = layer * 12, rr = radius * (0.75 + layer * 0.18);
        for (let k = 0; k < 4; k++) {
          const a0 = st.t * Math.PI * 6 + layer * 0.8 + (k / 4) * Math.PI * 2;
          g.lineStyle(2 + (layer === 0 ? 1 : 0), layer === 1 ? 0xffffff : color, 0.55 * fade);
          g.beginPath();
          for (let s = 0; s <= 8; s++) {
            const a = a0 + s * 0.12;
            const px = x + Math.cos(a) * rr, py = y - 6 - h + Math.sin(a) * rr * 0.32;
            if (s === 0) g.moveTo(px, py); else g.lineTo(px, py);
          }
          g.strokePath();
        }
      }
    },
    onComplete: () => { g.destroy(); eye.destroy(); },
  });
  scene.tweens.add({ targets: eye, alpha: 0.5, duration: ms / 2, yoyo: true });
  const n = 8 + level * 2;
  for (let k = 0; k < n; k++) {
    const a = (k / n) * Math.PI * 2;
    const leaf = scene.add.image(x + Math.cos(a) * radius * 0.8, y + Math.sin(a) * radius * 0.25, k % 3 ? 'fx:leaf' : 'fx:rock').setDepth(y + 5).setTint(k % 2 ? color : 0xffffff);
    const st2 = { t: 0 };
    scene.tweens.add({
      targets: st2, t: 1, duration: ms, delay: (k / n) * 120, ease: 'Sine.easeIn',
      onUpdate: () => {
        const aa = a + st2.t * Math.PI * 3, rr = radius * (0.8 + st2.t * 0.35);
        leaf.setPosition(x + Math.cos(aa) * rr, y - st2.t * (40 + level * 3) + Math.sin(aa) * rr * 0.3).setAngle(st2.t * 720).setAlpha(1 - st2.t);
      },
      onComplete: () => leaf.destroy(),
    });
  }
}
