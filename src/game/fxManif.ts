/**
 * Fix 1.11: drawn manifestations for every family of supertechnique, so each one reads as what it is instead of rings and
 * sparks: a phoenix, angel wings, a tornado funnel, flames, a bursting star, lightning, ice, shadows, an energy orb for
 * the shots; rock spikes, vines, wind blades, fire and so on for defences and dribbles by element. Procedural graphics
 * that tween out and destroy themselves. Original recreations; the games use 3D models.
 */
import Phaser from 'phaser';
import type { FxStyle } from './fx';

type S = Phaser.Scene;
const pt = (x: number, y: number) => new Phaser.Geom.Point(x, y);
const shade = (c: number, k: number) => {
  const r = Math.min(255, Math.round(((c >> 16) & 255) * k)), g = Math.min(255, Math.round(((c >> 8) & 255) * k)), b = Math.min(255, Math.round((c & 255) * k));
  return (r << 16) | (g << 8) | b;
};

/** Redraws `draw(g, k)` with k going 0 -> 1 over ms, then fades and destroys. */
function animate(scene: S, x: number, y: number, depth: number, ms: number, draw: (g: Phaser.GameObjects.Graphics, k: number) => void, fade = 220, add = false) {
  const g = scene.add.graphics().setPosition(x, y).setDepth(depth);
  if (add) g.setBlendMode(Phaser.BlendModes.ADD);
  const st = { k: 0 };
  draw(g, 0);
  scene.tweens.add({ targets: st, k: 1, duration: ms, onUpdate: () => { g.clear(); draw(g, st.k); } });
  scene.tweens.add({ targets: g, alpha: 0, delay: ms, duration: fade, onComplete: () => g.destroy() });
  return g;
}

/** A feathered wing (right side; mirror with sx = -1). `open` 0..1. */
function wing(g: Phaser.GameObjects.Graphics, sx: number, size: number, open: number, c1: number, c2: number) {
  const a0 = -0.2 - open * 0.9;
  for (let f = 0; f < 7; f++) {
    const a = a0 + f * (0.22 + open * 0.06), len = size * (1.1 - f * 0.1);
    const tip = pt(sx * Math.cos(a) * len, Math.sin(a) * len - size * 0.1);
    const base1 = pt(sx * size * 0.12 * f * 0.4, -size * 0.12), base2 = pt(sx * size * 0.12 * (f * 0.4 + 0.6), size * 0.1);
    g.fillStyle(f % 2 ? c2 : c1, 0.95).fillTriangle(base1.x, base1.y, tip.x, tip.y, base2.x, base2.y);
  }
}

/** Phoenix: a bird of fire with its wings beating, rising behind the player. */
export function phoenix(scene: S, x: number, y: number, size: number, ms: number, c1 = 0xff6a1a, c2 = 0xffd23f) {
  return animate(scene, x, y - 26, 8795, ms, (g, k) => {
    const flap = Math.sin(k * Math.PI * 4) * 0.5 + 0.5, s = size * (0.6 + k * 0.5);
    g.y = y - 26 - k * 18;
    g.setAlpha(Math.min(1, k * 4));
    wing(g, 1, s, flap, c1, c2); wing(g, -1, s, flap, c1, c2);
    for (let i = 0; i < 5; i++) g.fillStyle(i % 2 ? c2 : c1).fillTriangle(-s * 0.08, s * 0.1, s * (i - 2) * 0.15, s * (0.9 + (i % 2) * 0.2), s * 0.08, s * 0.1); // tail
    g.fillStyle(c1).fillEllipse(0, 0, s * 0.32, s * 0.55).fillStyle(c2).fillCircle(0, -s * 0.32, s * 0.13);
    g.fillStyle(0xff3a00).fillTriangle(-s * 0.04, -s * 0.36, s * 0.04, -s * 0.36, 0, -s * 0.24);
    for (let i = 0; i < 3; i++) g.fillStyle(c2).fillTriangle(-s * 0.03 + (i - 1) * s * 0.05, -s * 0.42, (i - 1) * s * 0.1, -s * 0.62, s * 0.03 + (i - 1) * s * 0.05, -s * 0.42); // crest
  });
}

/** Angel wings with a halo and a column of light: divine techniques. */
export function angelWings(scene: S, x: number, y: number, size: number, ms: number) {
  const col = scene.add.rectangle(x, y - 60, size * 0.55, 140, 0xffe9a0, 0.22).setBlendMode(Phaser.BlendModes.ADD).setDepth(8790);
  scene.tweens.add({ targets: col, alpha: 0, scaleX: 1.6, duration: ms + 200, onComplete: () => col.destroy() });
  return animate(scene, x, y - 22, 8795, ms, (g, k) => {
    const s = size * (0.7 + k * 0.4), open = Math.min(1, k * 1.6);
    // tall wings: the feathers fan from above the shoulders down to the waist
    for (const sx of [1, -1]) for (let f = 0; f < 8; f++) {
      const a = -1.35 + f * 0.2 * open + (1 - open) * 0.6, len = s * (1.25 - f * 0.08);
      g.fillStyle(f % 2 ? 0xfff0b8 : 0xffffff, 0.96).fillTriangle(sx * s * 0.08, -s * 0.2, sx * Math.cos(a) * len, Math.sin(a) * len, sx * s * 0.14, s * 0.12);
      g.lineStyle(1, 0xd8c070, 0.6).lineBetween(sx * s * 0.1, -s * 0.05, sx * Math.cos(a) * len * 0.9, Math.sin(a) * len * 0.9);
    }
    g.lineStyle(3, 0xffe27a, 0.95).strokeEllipse(0, -s * 0.55, s * 0.5, s * 0.16);
  });
}

/** A tornado funnel: stacked rotating ellipses, wider at the top. */
export function funnel(scene: S, x: number, y: number, size: number, ms: number, c1: number, c2: number) {
  return animate(scene, x, y + 6, 8794, ms, (g, k) => {
    const h = size * (0.8 + k * 0.6), rings = 9;
    for (let i = 0; i < rings; i++) {
      const u = i / (rings - 1), w = size * (0.15 + u * 0.9), yy = -u * h;
      const off = Math.sin(k * 20 + i * 0.9) * size * 0.08 * u;
      g.lineStyle(2.5, i % 2 ? c1 : c2, 0.75 - u * 0.25).strokeEllipse(off, yy, w * 2, w * 0.45);
      g.lineStyle(1.5, 0xffffff, 0.35).beginPath().arc(off, yy, w, k * 30 + i, k * 30 + i + 1.2).strokePath();
    }
  }, 260, true);
}

/** Tongues of fire in a ring rising around the player. */
export function flames(scene: S, x: number, y: number, size: number, ms: number, c1 = 0xff5a1f, c2 = 0xffd23f) {
  return animate(scene, x, y + 6, 8794, ms, (g, k) => {
    const n = 9;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + k * 2, r = size * 0.7;
      const fx = Math.cos(a) * r, fy = Math.sin(a) * r * 0.4, h = size * (0.5 + 0.5 * Math.sin(k * 18 + i * 1.7) ** 2) * Math.min(1, k * 3);
      g.fillStyle(c1, 0.85).fillTriangle(fx - size * 0.16, fy, fx + size * 0.16, fy, fx + Math.sin(k * 10 + i) * size * 0.08, fy - h);
      g.fillStyle(c2, 0.9).fillTriangle(fx - size * 0.08, fy, fx + size * 0.08, fy, fx, fy - h * 0.6);
    }
  }, 220, true);
}

/** A star that grows and bursts, with orbiting sparks: cosmic shots. */
export function starburst(scene: S, x: number, y: number, size: number, ms: number) {
  return animate(scene, x, y - 18, 8796, ms, (g, k) => {
    const r = size * (0.2 + k * 0.6), spikes = 8, rot = k * 3;
    const pts: Phaser.Geom.Point[] = [];
    for (let i = 0; i < spikes * 2; i++) { const a = rot + (i / (spikes * 2)) * Math.PI * 2, rr = i % 2 ? r * 0.38 : r; pts.push(pt(Math.cos(a) * rr, Math.sin(a) * rr)); }
    g.fillStyle(0xbfa8ff, 0.35).fillCircle(0, 0, r * 1.4).fillStyle(0xfff6d0).fillPoints(pts, true).fillStyle(0xffffff).fillCircle(0, 0, r * 0.3);
    for (let i = 0; i < 4; i++) { const a = -k * 8 + i * Math.PI / 2; g.fillStyle(i % 2 ? 0x8fd0ff : 0xffb0f0).fillCircle(Math.cos(a) * size * 0.9, Math.sin(a) * size * 0.35, size * 0.08); }
  }, 200, true);
}

/** Lightning striking around the player, an electric ring. */
export function boltStorm(scene: S, x: number, y: number, size: number, ms: number) {
  return animate(scene, x, y, 8797, ms, (g, k) => {
    g.lineStyle(2, 0x7fd3ff, 0.8).strokeEllipse(0, 6, size * 1.6, size * 0.6);
    const n = 4;
    for (let i = 0; i < n; i++) {
      if ((Math.floor(k * 14) + i) % 3) continue;
      const bx = Math.cos(i * 1.7 + k) * size * 0.7;
      let px = bx, py = -size * 1.6;
      g.lineStyle(2.5, 0xfff27a, 1).beginPath().moveTo(px, py);
      for (let s = 0; s < 6; s++) { px = bx + (Math.random() - 0.5) * size * 0.3; py += size * 0.28; g.lineTo(px, py); }
      g.strokePath();
    }
  }, 160, true);
}

/** Crystals of ice growing from the ground around the player. */
export function iceSpikes(scene: S, x: number, y: number, size: number, ms: number) {
  return animate(scene, x, y + 6, 8794, ms, (g, k) => {
    const n = 8, grow = Math.min(1, k * 2.5);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2, r = size * 0.75, cx = Math.cos(a) * r, cy = Math.sin(a) * r * 0.4, h = size * (0.5 + (i % 3) * 0.2) * grow;
      g.fillStyle(0x9fe8ff, 0.9).fillTriangle(cx - size * 0.1, cy, cx + size * 0.1, cy, cx, cy - h);
      g.fillStyle(0xffffff, 0.8).fillTriangle(cx - size * 0.03, cy, cx + size * 0.04, cy, cx, cy - h * 0.85);
    }
  });
}

/** Shadow tendrils reaching up and two red eyes: dark techniques. */
export function shadows(scene: S, x: number, y: number, size: number, ms: number) {
  return animate(scene, x, y + 4, 8794, ms, (g, k) => {
    const n = 7;
    g.fillStyle(0x1a0830, 0.55).fillEllipse(0, 0, size * 2, size * 0.7);
    for (let i = 0; i < n; i++) {
      const bx = (i - (n - 1) / 2) * size * 0.28;
      g.lineStyle(4 - (i % 2), i % 2 ? 0x5a2a90 : 0x2a1240, 0.9).beginPath().moveTo(bx, 0);
      for (let s = 1; s <= 6; s++) g.lineTo(bx + Math.sin(k * 10 + i + s) * size * 0.12 * s / 3, -s * size * 0.2 * Math.min(1, k * 2.5));
      g.strokePath();
    }
    if (k > 0.3) g.fillStyle(0xff2a2a).fillEllipse(-size * 0.18, -size * 1.2, size * 0.14, size * 0.06).fillEllipse(size * 0.18, -size * 1.2, size * 0.14, size * 0.06);
  });
}

/** A charging orb of energy with lines rushing in: cannon shots. */
export function energyOrb(scene: S, x: number, y: number, size: number, ms: number, color: number) {
  return animate(scene, x, y - 14, 8796, ms, (g, k) => {
    const r = size * (0.15 + k * 0.35);
    g.fillStyle(color, 0.3).fillCircle(0, 0, r * 2).fillStyle(color, 0.7).fillCircle(0, 0, r * 1.3).fillStyle(0xffffff).fillCircle(0, 0, r * 0.7);
    for (let i = 0; i < 10; i++) { const a = i * 0.63 + k * 2, d = size * (1.2 - ((k * 3 + i * 0.1) % 1)); g.lineStyle(1.5, 0xffffff, 0.7).lineBetween(Math.cos(a) * d, Math.sin(a) * d, Math.cos(a) * (d - size * 0.25), Math.sin(a) * (d - size * 0.25)); }
  }, 160, true);
}

/** Spikes of rock bursting out of the ground in a ring (Montaña). */
export function rockSpikes(scene: S, x: number, y: number, radius: number, ms: number) {
  return animate(scene, x, y + 6, 8794, ms, (g, k) => {
    const n = 10, grow = Math.min(1, k * 3) * (1 - Math.max(0, k - 0.7) * 2);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2, cx = Math.cos(a) * radius * 0.8, cy = Math.sin(a) * radius * 0.35, h = radius * (0.55 + (i % 3) * 0.18) * grow;
      g.fillStyle(0x4a3418).fillTriangle(cx - radius * 0.17, cy + 2, cx + radius * 0.17, cy + 2, cx + radius * 0.02, cy - h - 2);
      g.fillStyle(0x8a6436).fillTriangle(cx - radius * 0.15, cy, cx + radius * 0.15, cy, cx + radius * 0.02, cy - h);
      g.fillStyle(0xd9a45a).fillTriangle(cx - radius * 0.02, cy, cx + radius * 0.12, cy, cx + radius * 0.02, cy - h * 0.9);
    }
  });
}

/** Vines and leaves lashing out (Bosque). */
export function vines(scene: S, x: number, y: number, radius: number, ms: number) {
  return animate(scene, x, y + 4, 8794, ms, (g, k) => {
    const n = 6, reach = Math.min(1, k * 2.2);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + 0.3;
      const path: Phaser.Geom.Point[] = [pt(0, 0)];
      for (let s = 1; s <= 8; s++) {
        const d = radius * reach * s / 8, wob = Math.sin(s * 1.3 + i + k * 6) * radius * 0.12;
        path.push(pt(Math.cos(a) * d - Math.sin(a) * wob, (Math.sin(a) * d + Math.cos(a) * wob) * 0.45));
      }
      g.lineStyle(6, 0x173f12, 1).strokePoints(path);
      g.lineStyle(3.5, 0x4caa2e, 1).strokePoints(path);
      for (let s = 2; s < path.length; s += 2) g.fillStyle(0x173f12).fillEllipse(path[s].x, path[s].y - 3, radius * 0.18, radius * 0.1).fillStyle(0x8af05a).fillEllipse(path[s].x, path[s].y - 3, radius * 0.15, radius * 0.07);
      const tip = path[path.length - 1];
      g.fillStyle(0xff7ab8).fillCircle(tip.x, tip.y, radius * 0.06);
    }
  });
}

/** Crescent blades of wind spinning out (Aire). */
export function windBlades(scene: S, x: number, y: number, radius: number, ms: number, color = 0xbff8e0) {
  return animate(scene, x, y - 4, 8796, ms, (g, k) => {
    const n = 5;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + k * 5, d = radius * (0.3 + k * 0.8);
      const cx = Math.cos(a) * d, cy = Math.sin(a) * d * 0.5;
      g.lineStyle(3, color, 0.9 - k * 0.5).beginPath().arc(cx, cy, radius * 0.3, a + 0.4, a + 2.2).strokePath();
      g.lineStyle(1.5, 0xffffff, 0.8 - k * 0.5).beginPath().arc(cx, cy, radius * 0.22, a + 0.6, a + 2.0).strokePath();
    }
  }, 160, true);
}

/** Energy dome that flashes up (energy / neutral defences). */
export function dome(scene: S, x: number, y: number, radius: number, ms: number, color: number) {
  return animate(scene, x, y, 8794, ms, (g, k) => {
    const r = radius * Math.min(1, k * 3);
    g.fillStyle(color, 0.18).fillEllipse(0, -r * 0.2, r * 2, r * 1.4);
    g.lineStyle(2.5, color, 0.85).strokeEllipse(0, -r * 0.2, r * 2, r * 1.4);
    for (let i = 0; i < 4; i++) g.lineStyle(1, 0xffffff, 0.5).strokeEllipse(0, -r * 0.2, r * 2 * (0.25 + i * 0.2), r * 1.4);
  }, 200, true);
}

/** The manifestation of a defence or a dribble by its style (element). */
export function elementBurst(scene: S, style: FxStyle, x: number, y: number, radius: number, ms: number, c1: number) {
  switch (style) {
    case 'tierra': return rockSpikes(scene, x, y, radius, ms);
    case 'bosque': return vines(scene, x, y, radius, ms);
    case 'viento': return windBlades(scene, x, y, radius, ms);
    case 'fuego': return flames(scene, x, y, radius * 0.9, ms);
    case 'hielo': return iceSpikes(scene, x, y, radius * 0.9, ms);
    case 'rayo': return boltStorm(scene, x, y, radius * 0.8, ms);
    case 'sombra': return shadows(scene, x, y, radius * 0.8, ms);
    default: return dome(scene, x, y, radius, ms, shade(c1, 1));
  }
}
