/**
 * Fix 1.11: bigger, drawn effects for the families of supertechniques that used small placeholder sprites: hands and
 * fists of goalkeepers (Mano celestial and its V/X/double/triple forms, infinite hands, released hands, fists, the
 * ultradimensional and spirit hands) and dragons (shots, dribbles and catches). Everything is procedural Phaser graphics
 * that tweens out and destroys itself, so nothing stays on the pitch. Original recreations; the games use 3D models.
 */
import Phaser from 'phaser';
import { manoX } from './fxMovie';
import type { Fx } from './fx';

type G = Phaser.GameObjects.Graphics;

/** Fades the objects out after `delay` ms and destroys them. */
function fadeOut(scene: Phaser.Scene, objs: Phaser.GameObjects.GameObject[], delay: number, duration = 260) {
  scene.tweens.add({ targets: objs, alpha: 0, delay, duration, onComplete: () => objs.forEach((o) => o.destroy()) });
}

const shade = (c: number, k: number) => {
  const r = Math.min(255, Math.round(((c >> 16) & 255) * k)), g = Math.min(255, Math.round(((c >> 8) & 255) * k)), b = Math.min(255, Math.round((c & 255) * k));
  return (r << 16) | (g << 8) | b;
};

/**
 * A big hand drawn around its wrist (0, 0), fingers pointing up. `fist` closes it. Size ~ 40 px tall at scale 1.
 */
export function drawHand(g: G, color: number, fist = false, outline = 0x3a2208) {
  const light = shade(color, 1.4), dark = shade(color, 0.72);
  const pt = (x: number, y: number) => new Phaser.Geom.Point(x, y);
  if (fist) {
    // back of the fist: block, four knuckles with their creases, thumb folded across, cuff
    g.lineStyle(2, outline, 1);
    g.fillStyle(color).fillRoundedRect(-15, -28, 30, 26, 8).strokeRoundedRect(-15, -28, 30, 26, 8);
    for (let i = 0; i < 4; i++) {
      g.fillStyle(color).fillRoundedRect(-14 + i * 7, -33, 7, 12, 3.5).strokeRoundedRect(-14 + i * 7, -33, 7, 12, 3.5);
      g.fillStyle(light).fillRect(-12.5 + i * 7, -31, 2, 4);
    }
    g.fillStyle(color).fillRoundedRect(-17, -17, 22, 9, 4.5).strokeRoundedRect(-17, -17, 22, 9, 4.5);
    g.fillStyle(light, 0.7).fillRoundedRect(-13, -26, 6, 14, 3);
    g.fillStyle(dark).fillRoundedRect(-13, -3, 26, 6, 2).lineStyle(2, outline, 1).strokeRoundedRect(-13, -3, 26, 6, 2);
    return;
  }
  // palm: wider at the knuckles, narrowing to the wrist
  const palm = [pt(-15, -24), pt(15, -24), pt(14, -6), pt(9, 2), pt(-9, 2), pt(-13, -8)];
  g.fillStyle(color).fillPoints(palm, true).lineStyle(2, outline, 1).strokePoints(palm, true);
  // fingers: index to little, slightly fanned, two knuckle creases each
  const fingers = [[-11, 21, -0.12], [-3.8, 24, -0.03], [3.6, 22, 0.05], [10.6, 17, 0.16]] as const;
  for (const [fx, len, tilt] of fingers) {
    const top = -24 - len, tx = fx + tilt * len;
    const f = [pt(fx - 3.4, -22), pt(tx - 3.2, top + 3), pt(tx, top), pt(tx + 3.2, top + 3), pt(fx + 3.4, -22)];
    g.fillStyle(color).fillPoints(f, true).lineStyle(2, outline, 1).strokePoints(f, true);
    g.fillStyle(light, 0.85).fillRect(tx - 1.6 + (fx - tx) * 0.5, top + 4, 1.6, len - 8);
    g.lineStyle(1, dark, 0.9);
    for (const k of [0.35, 0.65]) g.lineBetween(fx + (tx - fx) * k - 2.4, -22 - len * k, fx + (tx - fx) * k + 2.4, -22 - len * k);
  }
  // thumb, out to the side with its own joint
  const thumb = [pt(-13, -6), pt(-23, -14), pt(-28, -24), pt(-24, -27), pt(-17, -19), pt(-13, -17)];
  g.fillStyle(color).fillPoints(thumb, true).lineStyle(2, outline, 1).strokePoints(thumb, true);
  g.lineStyle(1, dark, 0.9).lineBetween(-20, -15, -23, -20);
  // shading: light down the index side, palm lines, cuff
  g.fillStyle(light, 0.55).fillPoints([pt(-13, -22), pt(-6, -22), pt(-6, -2), pt(-11, -4)], true);
  g.lineStyle(1, dark, 0.9).beginPath().arc(1, -7, 9, Math.PI * 1.08, Math.PI * 1.8).strokePath();
  g.lineBetween(-8, -15, 9, -18);
  g.fillStyle(dark).fillRoundedRect(-10, 1, 20, 6, 2).lineStyle(2, outline, 1).strokeRoundedRect(-10, 1, 20, 6, 2);
}

/**
 * One hand that rises (and grows) at x,y, holds and fades: a glow copy behind (ADD, a bit bigger) and the hand with a
 * dark outline of its own colour, in one container so both move together. Returns the container.
 */
function riseHand(scene: Phaser.Scene, x: number, y: number, color: number, scale: number, opts: { fist?: boolean; rot?: number; delay?: number; hold?: number; add?: boolean; depth?: number; alpha?: number } = {}) {
  const glow = scene.add.graphics().setScale(1.16).setAlpha(0.4);
  drawHand(glow, shade(color, 1.45), opts.fist, shade(color, 1.45));
  const g = scene.add.graphics();
  drawHand(g, color, opts.fist, shade(color, 0.45));
  if (opts.add) g.setBlendMode(Phaser.BlendModes.ADD);
  const c = scene.add.container(x, y + 10, [glow, g]).setDepth(opts.depth ?? 8800).setRotation(opts.rot ?? 0).setScale(scale * 0.3).setAlpha(0);
  scene.tweens.add({ targets: c, y, scale, alpha: opts.alpha ?? 1, duration: 200, delay: opts.delay ?? 0, ease: 'Back.easeOut' });
  fadeOut(scene, [c], (opts.delay ?? 0) + 200 + (opts.hold ?? 420));
  return c;
}

/** Soft glowing aura (ADD blend). */
function aura(scene: Phaser.Scene, x: number, y: number, r: number, color: number, ms: number, alpha = 0.16) {
  // two soft rings of light instead of a flat disc
  for (const [k, a] of [[1, alpha], [0.6, alpha * 1.4]] as const) {
    const c = scene.add.circle(x, y, r * k, color, a).setBlendMode(Phaser.BlendModes.ADD).setDepth(8790);
    scene.tweens.add({ targets: c, scale: 1.4, alpha: 0, duration: ms, onComplete: () => c.destroy() });
  }
}

export type HandKind = 'celestial' | 'infinita' | 'liberadas' | 'puno' | 'punos' | 'dimension' | 'espiritu' | 'pinguinos';

/** Which hand family a goalkeeper technique belongs to (null: not a hand). */
export function handKind(name: string): HandKind | null {
  const n = name.toLowerCase();
  if (/manos? liberad/.test(n)) return 'liberadas';
  if (/infinit|mugen|mill[oó]n de manos|manos m[uú]ltiples/.test(n)) return 'infinita';
  if (/ultradimension|dimensi/.test(n)) return 'dimension';
  if (/espirit|fantasm|ghost/.test(n)) return 'espiritu';
  if (/ping[uü]in/.test(n)) return 'pinguinos';
  if (/pu[ñn]os volador|rocket|cohete/.test(n)) return 'punos';
  if (/pu[ñn]o|fist|punch/.test(n)) return 'puno';
  if (/mano|hand|palma|brazo|zarpazo/.test(n)) return 'celestial';
  return null;
}

/**
 * Goalkeeper hands. x,y: the keeper; tx,ty: the rival aimed at (fists fly there); targets: rivals for flying fists.
 * `big` for Mítico / Leyenda / HÉROE owners.
 */
export function keeperHand(fx: Fx, scene: Phaser.Scene, name: string, kind: HandKind, x: number, y: number, level: number, color: number,
  tx: number, ty: number, targets: { x: number; y: number }[], big = false) {
  const s = (1.15 + level * 0.07) * (big ? 1.3 : 1);
  const n = name.toLowerCase();
  switch (kind) {
    case 'celestial': {
      // Mano celestial: a golden hand of light behind the keeper. V: wings of light in a V; X: two crossed beams;
      // Bimano / Trimano: two or three hands fanned out
      const gold = /\bx\b|mano celestial x/.test(n) ? 0xff5a3a : /celest|divin|dios|god/.test(n) ? 0xffd84a : color; // 1.76: X is red
      const count = /trimano|triple/.test(n) ? 3 : /bimano|doble|double/.test(n) ? 2 : 1;
      fx.pillar(x, y + 4, 0xfff0b0, level + 4);
      aura(scene, x, y - 30, 22 + level * 2, gold, 700);
      for (let i = 0; i < count; i++) {
        const off = count === 1 ? 0 : (i - (count - 1) / 2);
        riseHand(scene, x + off * 26 * s, y - 6 - Math.abs(off) * 6, gold, s, { rot: off * 0.35, delay: i * 70 });
      }
      if (/\bv\b|mano celestial v/.test(n)) {
        for (const side of [-1, 1]) {
          const w = scene.add.triangle(x, y - 28, 0, 0, side * 46 * s, -40 * s, side * 30 * s, 6, 0xfff2a0, 0.55).setBlendMode(Phaser.BlendModes.ADD).setDepth(8795);
          fadeOut(scene, [w], 420);
        }
      }
      if (/\bx\b|mano celestial x/.test(n)) {
        manoX(scene, x, y, level, big); // 1.76: red fists and a giant red hand, from the anime scene (fxMovie.ts)
        for (const a of [Math.PI / 4, -Math.PI / 4]) {
          const b = scene.add.rectangle(x, y - 30, 7, 84 * s, 0xffd84a, 0.6).setRotation(a).setBlendMode(Phaser.BlendModes.ADD).setDepth(8795);
          scene.tweens.add({ targets: b, scaleY: { from: 0.1, to: 1 }, duration: 180, ease: 'Quad.easeOut' });
          fadeOut(scene, [b], 380);
        }
        fx.flashDisc(x, y - 30, 14 * s, 0xfff6c0, 160);
      }
      for (let i = 0; i < 2 + Math.floor(level / 4); i++) fx.lightning(x + (i - 1) * 16, y - 70, x + (i - 1) * 6, y - 26, 0xfff27a);
      fx.rays(x, y - 30, 12, 40 + level * 3, 0xfff6c0, 480);
      fx.burst('energia', x, y - 30, 12 + level * 2, 80, true);
      break;
    }
    case 'infinita': {
      // Manos infinitas / Millón de manos: hands appear one after another in a ring around the keeper
      const k = 6 + Math.floor(level / 2) + (big ? 4 : 0);
      for (let i = 0; i < k; i++) {
        const a = (i / k) * Math.PI * 2 - Math.PI / 2;
        riseHand(scene, x + Math.cos(a) * 34 * s, y - 14 + Math.sin(a) * 22 * s, color, s * 0.55, { rot: a + Math.PI / 2, delay: i * 35, hold: 360 });
      }
      aura(scene, x, y - 14, 46 * s, color, 760, 0.25);
      fx.ring(x, y - 14, 44 * s, color, 520, 3);
      break;
    }
    case 'liberadas': {
      // Manos liberadas: burning hands burst out of the keeper in every direction
      const k = 6 + Math.floor(level / 3);
      for (let i = 0; i < k; i++) {
        const a = (i / k) * Math.PI * 2;
        const g = riseHand(scene, x, y - 14, i % 2 ? 0xff7a2a : 0xffc04a, s * 0.6, { rot: a + Math.PI / 2, hold: 300 });
        scene.tweens.add({ targets: g, x: x + Math.cos(a) * 60 * s, y: y - 14 + Math.sin(a) * 44 * s, duration: 420, ease: 'Cubic.easeOut' });
      }
      fx.flashDisc(x, y - 14, 30 * s, 0xffe24a, 200);
      fx.burst('fuego', x, y - 14, 18 + level * 2, 120, true);
      break;
    }
    case 'puno': {
      // Puño vengativo, de furia, de arena, rayo de puño, superpuño: a giant fist punches at the rival
      const fistColor = /arena/.test(n) ? 0xd9b46a : /rayo/.test(n) ? 0xfff27a : color;
      const ang = Math.atan2(ty - y, tx - x);
      const g = scene.add.graphics().setDepth(8805).setPosition(x, y - 16).setRotation(ang + Math.PI / 2).setScale(s * 0.4);
      drawHand(g, fistColor, true);
      const dist = Math.min(110, Math.hypot(tx - x, ty - y));
      const ex = x + Math.cos(ang) * dist, ey = y - 16 + Math.sin(ang) * dist;
      for (let i = 0; i < 5; i++) { // speed lines
        const l = scene.add.rectangle(x + Math.cos(ang) * dist * 0.5, y - 16 + Math.sin(ang) * dist * 0.5 + (i - 2) * 6, dist, 1.5, 0xffffff, 0.6).setRotation(ang).setDepth(8800);
        fadeOut(scene, [l], 120, 200);
      }
      scene.tweens.add({ targets: g, x: ex, y: ey, scale: s * 1.3, duration: 160, ease: 'Quad.easeIn', onComplete: () => {
        fx.ring(ex, ey, 30 * s, fistColor, 320, 4);
        fx.rays(ex, ey, 10, 36 * s, 0xffffff, 260);
        fx.burst(/arena/.test(n) ? 'tierra' : /rayo/.test(n) ? 'rayo' : 'fuego', ex, ey, 14 + level * 2, 120, true);
        fx.shake(0.005, 120);
        if (/rayo/.test(n)) fx.lightning(ex, ey - 60, ex, ey, 0xfff27a);
      } });
      fadeOut(scene, [g], 420, 200);
      break;
    }
    case 'punos': {
      // Puños voladores: fists launched at several rivals
      const list = targets.length ? targets.slice(0, 3 + Math.floor(level / 4)) : [{ x: tx, y: ty }];
      list.forEach((t, i) => {
        const ang = Math.atan2(t.y - y, t.x - x);
        const g = scene.add.graphics().setDepth(8805).setPosition(x, y - 16).setRotation(ang + Math.PI / 2).setScale(s * 0.5);
        drawHand(g, color, true);
        scene.tweens.add({ targets: g, x: t.x, y: t.y, duration: 220, delay: i * 60, ease: 'Quad.easeIn', onComplete: () => { fx.ring(t.x, t.y, 18, color, 260, 3); fx.burst('energia', t.x, t.y, 8, 80, true); } });
        fadeOut(scene, [g], 300 + i * 60, 160);
      });
      break;
    }
    case 'dimension': {
      // Mano ultradimensional: a rift opens and the hand comes through it
      const rift = scene.add.ellipse(x, y - 30, 10, 80 * s, 0x1a0630, 0.92).setStrokeStyle(4, 0xc07aff).setDepth(8790);
      scene.tweens.add({ targets: rift, width: 70 * s, duration: 200, ease: 'Back.easeOut' });
      fadeOut(scene, [rift], 640);
      riseHand(scene, x, y - 4, 0xd0a0ff, s * 1.1, { delay: 160, hold: 420, depth: 8805 });
      fx.gather(x, y - 24, 0x8a3aff, 0xffffff, 10 + level, 50, 300);
      fx.ring(x, y - 24, 40 * s, 0xc07aff, 500, 3);
      break;
    }
    case 'espiritu': {
      // Mano espiritual: a translucent ghost hand with wisps
      riseHand(scene, x, y - 4, 0x7fd4ff, s * 1.1, { hold: 480, alpha: 0.7 }); // translucent: a ghost
      for (let i = 0; i < 8; i++) {
        const w = scene.add.circle(x + (Math.random() - 0.5) * 50, y - 10, 3, 0xbff4ff, 0.7).setBlendMode(Phaser.BlendModes.ADD).setDepth(8806);
        scene.tweens.add({ targets: w, y: y - 70 - Math.random() * 20, alpha: 0, duration: 600 + i * 40, onComplete: () => w.destroy() });
      }
      aura(scene, x, y - 30, 34 * s, 0x9fe8ff, 700, 0.3);
      break;
    }
    case 'pinguinos': {
      // Mano de pingüinos: the hand, with penguins diving out of it
      riseHand(scene, x, y - 4, color, s);
      for (let i = 0; i < 4 + Math.floor(level / 3); i++) {
        const p = scene.add.graphics().setDepth(8806).setPosition(x, y - 40);
        p.fillStyle(0x1a1a2a).fillEllipse(0, 0, 10, 14).fillStyle(0xffffff).fillEllipse(0, 2, 6, 9).fillStyle(0xffa020).fillTriangle(-2, -3, 2, -3, 0, 0);
        const a = -Math.PI / 2 + (i - 2) * 0.5;
        scene.tweens.add({ targets: p, x: x + Math.cos(a) * 70, y: y - 40 + Math.sin(a) * 30 + 60, rotation: a * 2, duration: 520, delay: 160 + i * 50, ease: 'Quad.easeIn' });
        fadeOut(scene, [p], 600 + i * 50, 160);
      }
      break;
    }
  }
  fx.groundRing(x, y + 8, 30 + level * 3, color, 320);
}

// ------------------------------------------------------------------------------------------------ dragons

/** Path of a dragon: point and direction for u in 0..1 (0 tail, 1 head). */
type DragonPath = (u: number, t: number) => { x: number; y: number };

/**
 * Draws an eastern dragon along a path: a continuous tapering body (outline pass, scales, lighter belly, a ridge of
 * spikes) and a big horned head with open jaws, fangs, a mane, a glowing eye and whiskers.
 */
function drawDragon(g: G, path: DragonPath, t: number, color: number, color2: number, size: number) {
  g.clear();
  const N = 40;
  const pts = Array.from({ length: N + 1 }, (_, i) => path(i / N, t));
  const dark = shade(color, 0.5), mid = shade(color, 0.8), belly = shade(color2, 1.05);
  const width = (i: number) => size * (0.22 + 0.78 * Math.sin(Math.min(1, (i / N) * 1.15) * Math.PI * 0.5));
  const dir = (i: number) => { const p = pts[Math.max(0, i - 1)], q = pts[Math.min(N, i + 1)]; return Math.atan2(q.y - p.y, q.x - p.x); };
  // ridge spikes behind the body
  for (let i = 4; i < N - 2; i += 3) {
    const p = pts[i], a = dir(i), w = width(i), nx = -Math.sin(a), ny = Math.cos(a);
    g.fillStyle(color2).fillTriangle(p.x - nx * w * 0.5 - Math.cos(a) * w * 0.5, p.y - ny * w * 0.5 - Math.sin(a) * w * 0.5,
      p.x - nx * w * 1.9, p.y - ny * w * 1.9, p.x - nx * w * 0.5 + Math.cos(a) * w * 0.7, p.y - ny * w * 0.5 + Math.sin(a) * w * 0.7);
  }
  // outline, body, scales, belly
  for (let i = 0; i < N; i++) g.fillStyle(dark).fillCircle(pts[i].x, pts[i].y, width(i) + 1.6);
  for (let i = 0; i < N; i++) g.fillStyle(color).fillCircle(pts[i].x, pts[i].y, width(i));
  for (let i = 2; i < N; i += 2) {
    const p = pts[i], a = dir(i), w = width(i);
    g.lineStyle(1, mid, 0.9).beginPath().arc(p.x, p.y, w * 0.75, a + Math.PI * 0.6, a + Math.PI * 1.4).strokePath();
    g.fillStyle(belly, 0.85).fillCircle(p.x + Math.sin(a) * w * 0.45, p.y - Math.cos(a) * w * -0.45, w * 0.42);
  }
  // head, oriented along the last stretch of the body
  const h = pts[N], b = pts[N - 3];
  const a = Math.atan2(h.y - b.y, h.x - b.x), ca = Math.cos(a), sa = Math.sin(a);
  const S = size * 1.7;
  const P = (fx: number, fy: number) => new Phaser.Geom.Point(h.x + ca * fx - sa * fy, h.y + sa * fx + ca * fy);
  const tri = (c: number, p1: [number, number], p2: [number, number], p3: [number, number]) => {
    const [A, B, C] = [P(...p1), P(...p2), P(...p3)];
    g.fillStyle(c).fillTriangle(A.x, A.y, B.x, B.y, C.x, C.y);
  };
  // mane
  for (let k = 0; k < 5; k++) tri(color2, [-S * 0.5, -S * 0.3 + k * S * 0.18], [-S * 1.5 - k * S * 0.1, -S * 0.9 + k * S * 0.45], [-S * 0.2, k * S * 0.2]);
  // lower jaw (open), mouth, fangs
  const jawOpen = 0.35 + Math.sin(t * 14) * 0.12;
  const lower = [P(-S * 0.2, S * 0.15), P(S * 1.5, S * (0.25 + jawOpen)), P(S * 1.35, S * (0.55 + jawOpen)), P(-S * 0.3, S * 0.6)];
  g.fillStyle(dark).fillPoints(lower, true);
  g.fillStyle(0x6a0a0a).fillPoints([P(0, S * 0.05), P(S * 1.4, S * 0.05), P(S * 1.4, S * (0.25 + jawOpen)), P(0, S * 0.3)], true);
  // upper head and snout
  const upper = [P(-S * 0.6, -S * 0.75), P(S * 0.4, -S * 0.8), P(S * 1.75, -S * 0.35), P(S * 1.9, 0), P(S * 1.5, S * 0.1), P(-S * 0.4, S * 0.25)];
  g.fillStyle(dark).fillPoints(upper.map((q) => new Phaser.Geom.Point(q.x + 1, q.y + 1)), true);
  g.fillStyle(color).fillPoints(upper, true);
  g.fillStyle(shade(color, 1.25)).fillPoints([P(-S * 0.3, -S * 0.6), P(S * 1.3, -S * 0.35), P(S * 0.2, -S * 0.25)], true);
  for (const fx2 of [0.6, 1.0, 1.35]) { tri(0xfffbe8, [S * fx2, S * 0.08], [S * (fx2 + 0.14), S * 0.08], [S * (fx2 + 0.07), S * 0.38]); tri(0xfffbe8, [S * fx2, S * (0.25 + jawOpen)], [S * (fx2 + 0.12), S * (0.25 + jawOpen)], [S * (fx2 + 0.06), S * jawOpen]); }
  // horns, eye, nostril, whiskers
  tri(color2, [-S * 0.35, -S * 0.65], [-S * 1.7, -S * 1.6], [-S * 0.05, -S * 0.78]);
  tri(shade(color2, 0.85), [-S * 0.1, -S * 0.72], [-S * 1.1, -S * 1.85], [S * 0.2, -S * 0.78]);
  const eye = P(S * 0.45, -S * 0.45);
  g.fillStyle(0xffffff).fillCircle(eye.x, eye.y, S * 0.2).fillStyle(0xffe22a).fillCircle(eye.x, eye.y, S * 0.15).fillStyle(0x000000).fillCircle(eye.x + ca * S * 0.04, eye.y + sa * S * 0.04, S * 0.06);
  const nose = P(S * 1.65, -S * 0.2);
  g.fillStyle(dark).fillCircle(nose.x, nose.y, S * 0.07);
  g.lineStyle(1.5, color2, 0.95);
  for (const side of [-1, 1]) {
    const w0 = P(S * 1.55, -S * 0.15), w1 = P(S * 0.9, side * S * 0.6 + Math.sin(t * 10 + side) * S * 0.2), w2 = P(S * 0.1, side * S * 0.85);
    g.beginPath().moveTo(w0.x, w0.y).lineTo(w1.x, w1.y).lineTo(w2.x, w2.y).strokePath();
  }
}

export type DragonMode = 'rise' | 'strike' | 'coil';

/**
 * A dragon. rise: coils up around x,y (charge of a dragon shot, Dragón ascendente); coil: circles x,y (Torbellino
 * dragón); strike: flies from x,y to tx,ty and bites (Mate del dragón, the flight of a dragon shot).
 */
export function dragon(scene: Phaser.Scene, mode: DragonMode, x: number, y: number, color: number, color2: number, level: number, ms: number, tx = x, ty = y, big = false) {
  const size = (6.5 + level * 0.4) * (big ? 1.35 : 1);
  const g = scene.add.graphics().setDepth(8850);
  const len = 0.9;
  const path: DragonPath =
    mode === 'strike' ? (u, t) => {
      // the body keeps its length: at the start it trails behind the player, as if coming out of them
      const head = Math.min(1, t * 1.25), k = head - len * (1 - u) * 0.5;
      const px = x + (tx - x) * k, py = y + (ty - y) * k;
      const nx = -(ty - y), ny = tx - x, d = Math.hypot(nx, ny) || 1;
      const wave = Math.sin(k * 10 - t * 12) * 10 * (1 - u * 0.6);
      return { x: px + nx / d * wave, y: py + ny / d * wave - Math.sin(k * Math.PI) * 24 };
    }
      : mode === 'coil' ? (u, t) => {
        const a = t * Math.PI * 4 + u * Math.PI * 1.8;
        return { x: x + Math.cos(a) * (26 + size * 2), y: y - 14 + Math.sin(a) * (14 + size) };
      }
        : (u, t) => {
          const a = t * Math.PI * 3 + u * Math.PI * 2.2;
          const r = (30 + size * 2) * (1 - t * 0.4);
          return { x: x + Math.cos(a) * r * (1 - u * 0.3), y: y + 6 - (t * 60 + u * 40) + Math.sin(a) * r * 0.35 };
        };
  const st = { t: 0 };
  drawDragon(g, path, 0, color, color2, size);
  g.setAlpha(0);
  scene.tweens.add({ targets: g, alpha: 0.95, duration: 120 });
  scene.tweens.add({ targets: st, t: 1, duration: ms, ease: mode === 'strike' ? 'Quad.easeIn' : 'Sine.easeInOut', onUpdate: () => drawDragon(g, path, st.t, color, color2, size) });
  fadeOut(scene, [g], ms, 220);
}
