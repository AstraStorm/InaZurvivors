/**
 * Axel Blaze Encapuchado's fire techniques, drawn from the scenes the author linked (watched frame by frame):
 *
 *   Fuego supremo (Maximum Fire, Inazuma Eleven Strikers) — he leaps with the ball over his head while a ring of fire
 *     spins round him; the volley leaves as a white-hot beam with a yellow core, and the impact is a starburst of fire
 *     with a column of flame.
 *   Fuego total (Grand Fire) — a huge curtain of fire bursts out, spreads very wide to the sides and then rolls forward
 *     as a wall of flame round a giant fireball, sweeping away everything in its path. Normally the combined technique
 *     of Xavier, Austin and Axel (combos.ts 'fuego-total'); the hooded Axel is the only one who does it alone.
 *
 * Visual only: who gets hurt and how much is decided by ArenaScene through the callbacks.
 */
import Phaser from 'phaser';

type S = Phaser.Scene;
const AIR = 8900;
const RED = 0xd8261a, ORANGE = 0xff7a1a, YELLOW = 0xffd04a, WHITE = 0xfff6d8;
const rnd = (a: number, b: number) => a + Math.random() * (b - a);

export type FuegoMove = 'supremo' | 'total';
export function fuegoOf(name: string): FuegoMove | null {
  if (/^fuego supremo$|maximum fire/i.test(name.trim())) return 'supremo';
  if (/^fuego total$|grand fire/i.test(name.trim())) return 'total';
  return null;
}

// ------------------------------------------------------------------ textures (generated once per scene)
function tex(scene: S, key: string, w: number, h: number, draw: (g: Phaser.GameObjects.Graphics) => void) {
  const k = `fuego:${key}`;
  if (!scene.textures.exists(k)) {
    const g = scene.make.graphics({}, false);
    draw(g);
    g.generateTexture(k, w, h);
    g.destroy();
  }
  return k;
}
/** a tongue of flame pointing up: red rim, orange body, yellow and white heart (origin at its base) */
const tongueTex = (scene: S) => tex(scene, 'tongue', 24, 48, (g) => {
  const tongue = (c: number, a: number, w: number, top: number) => {
    g.fillStyle(c, a);
    g.beginPath();
    g.moveTo(12 - w, 46);
    g.lineTo(12 - w * 0.9, 30);
    g.lineTo(12 - w * 0.2, top + 10);
    g.lineTo(12 + w * 0.15, top);
    g.lineTo(12 + w * 0.6, top + 16);
    g.lineTo(12 + w, 32);
    g.lineTo(12 + w, 46);
    g.closePath();
    g.fillPath();
  };
  tongue(RED, 1, 11, 1);
  tongue(ORANGE, 1, 9, 9);
  tongue(YELLOW, 1, 6, 20);
  tongue(WHITE, 0.9, 3, 31);
});
/** a curved arc of fire (a quarter of the ring that spins round the shooter) */
const arcTex = (scene: S) => tex(scene, 'arc', 64, 64, (g) => {
  for (const [c, a, w] of [[RED, 0.55, 9], [ORANGE, 0.9, 6], [YELLOW, 1, 3]] as const) {
    g.lineStyle(w, c, a);
    g.beginPath();
    g.arc(32, 32, 26, -Math.PI * 0.95, -Math.PI * 0.15);
    g.strokePath();
  }
});
/** an eight-point starburst (the impact of Fuego supremo) */
const starTex = (scene: S) => tex(scene, 'star', 64, 64, (g) => {
  const star = (c: number, a: number, r1: number, r2: number) => {
    g.fillStyle(c, a);
    g.beginPath();
    for (let k = 0; k < 16; k++) {
      const r = k % 2 ? r2 : r1, ang = (k / 16) * Math.PI * 2;
      if (k === 0) g.moveTo(32 + Math.cos(ang) * r, 32 + Math.sin(ang) * r); else g.lineTo(32 + Math.cos(ang) * r, 32 + Math.sin(ang) * r);
    }
    g.closePath();
    g.fillPath();
  };
  star(RED, 0.9, 31, 14);
  star(ORANGE, 1, 25, 11);
  star(YELLOW, 1, 17, 8);
  star(WHITE, 1, 9, 5);
});
const emberTex = (scene: S) => tex(scene, 'ember', 6, 6, (g) => { g.fillStyle(YELLOW, 1); g.fillCircle(3, 3, 3); g.fillStyle(WHITE, 1); g.fillCircle(3, 3, 1.4); });

function embers(scene: S, x: number, y: number, n: number, spread: number, rise: number) {
  for (let k = 0; k < n; k++) {
    const e = scene.add.image(x + rnd(-spread, spread), y + rnd(-spread * 0.4, spread * 0.4), emberTex(scene)).setDepth(AIR + 2).setScale(rnd(0.5, 1.1));
    scene.tweens.add({ targets: e, y: e.y - rise * rnd(0.6, 1.3), x: e.x + rnd(-10, 10), alpha: 0, duration: rnd(380, 700), onComplete: () => e.destroy() });
  }
}

// ------------------------------------------------------------------ Fuego supremo
/** wind-up: two arcs of fire spin round him (a full ring), embers rise and the ground glows */
export function supremoCharge(scene: S, x: number, y: number, level: number, ms: number) {
  const scale = 0.85 + level * 0.03;
  const glow = scene.add.ellipse(x, y + 2, 34 * scale, 12 * scale, ORANGE, 0.35).setDepth(AIR - 1);
  const arcs = [0, Math.PI].map((r) => scene.add.image(x, y - 14, arcTex(scene)).setDepth(AIR + 1).setScale(scale).setRotation(r).setAlpha(0));
  scene.tweens.add({ targets: arcs, alpha: 1, duration: 120 });
  const st = { a: 0 };
  scene.tweens.add({ targets: st, a: Math.PI * 4, duration: ms + 120, ease: 'Cubic.easeIn',
    onUpdate: () => arcs.forEach((a, i) => a.setRotation(st.a + i * Math.PI).setScale(scale * (1 + st.a * 0.03))),
    onComplete: () => scene.tweens.add({ targets: [...arcs, glow], alpha: 0, scale: scale * 1.6, duration: 160, onComplete: () => { arcs.forEach((a) => a.destroy()); glow.destroy(); } }) });
  scene.time.addEvent({ delay: 90, repeat: Math.floor(ms / 90), callback: () => embers(scene, x, y - 6, 2, 14, 30) });
}

/**
 * The volley: a white-hot beam with a yellow core runs from the shooter to (tx, ty) in `ms`; `onLine` is called with
 * the stretch it covered each frame (to hurt what it crosses), then the starburst and its column of flame, `onBlast`.
 */
export function supremoShot(scene: S, ox: number, oy: number, tx: number, ty: number, level: number, ms: number,
  onLine: (x0: number, y0: number, x1: number, y1: number) => void, onBlast: (x: number, y: number, r: number) => void) {
  const ang = Math.atan2(ty - oy, tx - ox);
  const width = 7 + level * 0.5;
  const beam = scene.add.graphics().setDepth(AIR);
  const ball = scene.add.circle(ox, oy, 6 + level * 0.3, WHITE, 1).setDepth(AIR + 2);
  const halo = scene.add.circle(ox, oy, 12 + level * 0.5, ORANGE, 0.45).setDepth(AIR + 1);
  const st = { p: 0 };
  let prev = { x: ox, y: oy };
  scene.tweens.add({ targets: st, p: 1, duration: ms, ease: 'Quad.easeIn',
    onUpdate: () => {
      const x = ox + (tx - ox) * st.p, y = oy + (ty - oy) * st.p;
      beam.clear();
      beam.lineStyle(width * 2.4, RED, 0.35).lineBetween(ox, oy, x, y);
      beam.lineStyle(width * 1.5, ORANGE, 0.7).lineBetween(ox, oy, x, y);
      beam.lineStyle(width * 0.8, YELLOW, 0.95).lineBetween(ox, oy, x, y);
      beam.lineStyle(width * 0.35, WHITE, 1).lineBetween(ox, oy, x, y);
      ball.setPosition(x, y);
      halo.setPosition(x, y).setScale(1 + Math.sin(st.p * 30) * 0.12);
      if (Math.random() < 0.6) {
        const t = scene.add.image(x, y, tongueTex(scene)).setOrigin(0.5, 0.95).setDepth(AIR).setRotation(ang - Math.PI / 2 + Math.PI).setScale(0.45 + level * 0.02, 0.6);
        scene.tweens.add({ targets: t, alpha: 0, scaleY: 0.2, duration: 240, onComplete: () => t.destroy() });
      }
      onLine(prev.x, prev.y, x, y);
      prev = { x, y };
    },
    onComplete: () => {
      ball.destroy(); halo.destroy();
      scene.tweens.add({ targets: beam, alpha: 0, duration: 260, onComplete: () => beam.destroy() });
      const r = 40 + level * 4;
      const star = scene.add.image(tx, ty, starTex(scene)).setDepth(AIR + 2).setScale(0.3).setRotation(rnd(0, 1));
      scene.tweens.add({ targets: star, scale: (r * 2.2) / 64, rotation: star.rotation + 0.5, duration: 200, ease: 'Cubic.easeOut',
        onComplete: () => scene.tweens.add({ targets: star, alpha: 0, scale: star.scale * 1.15, duration: 300, onComplete: () => star.destroy() }) });
      // the column of flame rising from the impact
      for (let k = 0; k < 7; k++) {
        const t = scene.add.image(tx + rnd(-r * 0.35, r * 0.35), ty + 6, tongueTex(scene)).setOrigin(0.5, 1).setDepth(AIR + 1).setScale(0.6, 0.2);
        scene.tweens.add({ targets: t, scaleY: rnd(1.4, 2.2) * (1 + level * 0.04), duration: 220, delay: k * 25, ease: 'Back.easeOut',
          onComplete: () => scene.tweens.add({ targets: t, alpha: 0, y: t.y - 20, duration: 340, onComplete: () => t.destroy() }) });
      }
      const ring = scene.add.circle(tx, ty, r * 0.4, 0, 0).setStrokeStyle(4, ORANGE, 0.9).setDepth(AIR);
      scene.tweens.add({ targets: ring, scale: 2.5, alpha: 0, duration: 380, onComplete: () => ring.destroy() });
      embers(scene, tx, ty, 14, r * 0.6, 60);
      onBlast(tx, ty, r);
    } });
}

// ------------------------------------------------------------------ Fuego total
/** wind-up: a curtain of fire bursts up round the shooter (or the meeting point of the combined version) */
export function totalCharge(scene: S, x: number, y: number, level: number, ms: number) {
  const n = 9, base = 44 + level * 3;
  const glow = scene.add.ellipse(x, y + 2, base * 2, base * 0.5, ORANGE, 0.3).setDepth(AIR - 1).setScale(0.2, 1);
  scene.tweens.add({ targets: glow, scaleX: 1, duration: ms, ease: 'Cubic.easeOut' });
  for (let k = 0; k < n; k++) {
    const off = (k / (n - 1) - 0.5) * 2;
    const t = scene.add.image(x + off * base * 0.25, y + 4, tongueTex(scene)).setOrigin(0.5, 1).setDepth(AIR + (Math.abs(off) < 0.3 ? 2 : 1)).setScale(0.5, 0.1);
    scene.tweens.add({ targets: t, x: x + off * base, scaleY: (1.6 - Math.abs(off) * 0.7) * (1 + level * 0.03), scaleX: 0.7, duration: ms * 0.8, delay: Math.abs(off) * ms * 0.15, ease: 'Cubic.easeOut' });
    scene.tweens.add({ targets: t, alpha: 0, duration: 200, delay: ms, onComplete: () => t.destroy() });
  }
  scene.tweens.add({ targets: glow, alpha: 0, duration: 200, delay: ms, onComplete: () => glow.destroy() });
  scene.time.addEvent({ delay: 70, repeat: Math.floor(ms / 70), callback: () => embers(scene, x, y - 8, 3, base * 0.6, 40) });
}

/**
 * The wave: the fire spreads very wide to the sides of the shot direction and rolls forward `reach` px in `ms`, a wall
 * of flame round a giant fireball. `onSweep` gets, each frame, the centre of the wall's front, its direction and half
 * its width (ArenaScene hurts everything inside the band it has swept).
 */
export function totalWave(scene: S, ox: number, oy: number, ang: number, level: number, reach: number, ms: number,
  onSweep: (cx: number, cy: number, ang: number, half: number) => void, onEnd?: () => void) {
  const ux = Math.cos(ang), uy = Math.sin(ang), nx = -uy, ny = ux;
  const maxHalf = 70 + level * 6;
  const N = 15;
  const tongues = Array.from({ length: N }, (_, k) => {
    const img = scene.add.image(ox, oy, tongueTex(scene)).setOrigin(0.5, 0.9).setDepth(AIR + 1).setRotation(ang + Math.PI / 2).setScale(0.9, 0.3);
    return { img, at: k / (N - 1) - 0.5 };
  });
  const ball = scene.add.circle(ox, oy, 11 + level * 0.6, WHITE, 1).setDepth(AIR + 3);
  const core = scene.add.circle(ox, oy, 20 + level, YELLOW, 0.75).setDepth(AIR + 2);
  const halo = scene.add.circle(ox, oy, 32 + level * 1.5, ORANGE, 0.4).setDepth(AIR + 1);
  const scorch = scene.add.graphics().setDepth(AIR - 2);
  const st = { p: 0 };
  let lastEmber = 0;
  scene.tweens.add({ targets: st, p: 1, duration: ms, ease: 'Sine.easeIn',
    onUpdate: () => {
      // it widens fast at the start (the burst to the sides), then keeps its width while it rolls on
      const spread = Math.min(1, st.p / 0.25), half = maxHalf * (0.25 + 0.75 * spread);
      const d = reach * st.p, cx = ox + ux * d, cy = oy + uy * d;
      for (const { img, at } of tongues) {
        const lag = Math.abs(at) * 22 * spread; // the edges trail a little behind the centre: a curved front
        img.setPosition(cx + nx * at * 2 * half - ux * lag, cy + ny * at * 2 * half - uy * lag)
          .setScale(0.9 + spread * 0.4, (0.6 + spread * 1.2 + Math.sin(scene.time.now / 70 + at * 9) * 0.25) * (1 + level * 0.03) * (1 - Math.abs(at) * 0.5));
      }
      ball.setPosition(cx, cy); core.setPosition(cx, cy).setScale(1 + Math.sin(st.p * 40) * 0.1); halo.setPosition(cx, cy);
      // a scorched band stays behind it for a moment
      scorch.clear().fillStyle(RED, 0.16);
      scorch.fillPoints([
        { x: ox + nx * half * 0.3, y: oy + ny * half * 0.3 }, { x: cx + nx * half, y: cy + ny * half },
        { x: cx - nx * half, y: cy - ny * half }, { x: ox - nx * half * 0.3, y: oy - ny * half * 0.3 }], true);
      if (scene.time.now - lastEmber > 60) {
        lastEmber = scene.time.now;
        embers(scene, cx - ux * 14, cy - uy * 14, 4, half * 0.8, 36);
      }
      onSweep(cx, cy, ang, half);
    },
    onComplete: () => {
      scene.tweens.add({ targets: [...tongues.map((t) => t.img), ball, core, halo], alpha: 0, scaleY: 0.2, duration: 260, onComplete: () => { tongues.forEach((t) => t.img.destroy()); ball.destroy(); core.destroy(); halo.destroy(); } });
      scene.tweens.add({ targets: scorch, alpha: 0, duration: 600, onComplete: () => scorch.destroy() });
      const fx = ox + ux * reach, fy = oy + uy * reach;
      const ring = scene.add.ellipse(fx, fy, maxHalf * 2, maxHalf * 0.8, ORANGE, 0.35).setDepth(AIR);
      scene.tweens.add({ targets: ring, scale: 1.4, alpha: 0, duration: 360, onComplete: () => ring.destroy() });
      onEnd?.();
    } });
}
