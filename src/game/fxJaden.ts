/**
 * pre-2.0 (author): two techniques of Jaden Evans redrawn from their scenes (frames looked at):
 *   Corriente negra (Kuroshio Ride, Victory Road, youtube 3HHrumDcVB8) — arms crossed, a huge navy and white wave
 *     whirls round him and lifts him on its crest; then a beast of dark water with open jaws and glowing eyes carries
 *     him forward and crashes through the rival in a burst of white spray.
 *   Corte volcánico (Volcano Cut, anime, youtube JtoGt6HYUtk) — a sliding kick with burning feet draws an arc of fire on
 *     the pitch, and a wall of flames rises along it in front of the rival.
 * Drawn with graphics only (no third-party art), normal blending so navy and orange read over the green pitch.
 */
import Phaser from 'phaser';

type S = Phaser.Scene;
type G = Phaser.GameObjects.Graphics;
const AIR = 8900;
const NAVY = 0x0d2a5a, DEEP = 0x061634, FOAM = 0xeaf6ff, SPRAY = 0xbfe6ff, EYE = 0x7ff6ff;
const EMBER = 0x8a1a06, FIRE = 0xff6a1a, FLAME = 0xffb020, CORE = 0xfff2b0;

/** Draws `frame(g, k, t)` every frame for `ms` (k 0..1) on its own graphics, then removes it. */
function play(scene: S, x: number, y: number, depth: number, ms: number, frame: (g: G, k: number, t: number) => void) {
  const g = scene.add.graphics({ x, y }).setDepth(depth);
  const t0 = scene.time.now;
  const tick = () => {
    const t = scene.time.now - t0;
    if (t > ms || !g.active) { scene.events.off('update', tick); g.destroy(); return; }
    g.clear();
    frame(g, t / ms, t / 1000);
  };
  scene.events.on('update', tick);
  scene.events.once('shutdown', () => scene.events.off('update', tick));
  tick();
}

// ================================================================ Corriente negra
export const isCorrienteNegra = (name: string) => /^corriente negra$|kuroshio ride/i.test(name.trim());

/** the dribble from (x, y) to (tx, ty) */
export function corrienteNegra(scene: S, x: number, y: number, tx: number, ty: number, lv: number, ms = 560) {
  const ang = Math.atan2(ty - y, tx - x), len = Math.max(40, Math.hypot(tx - x, ty - y)), c = Math.cos(ang), s = Math.sin(ang);
  const R = 20 + lv * 1.2;
  // 1) the wave whirls round him and lifts him
  play(scene, x, y - 6, AIR - 1, ms * 0.5, (g, k, t) => {
    const a = Math.min(1, k * 4) * (1 - Math.max(0, k - 0.7) * 3.3);
    g.fillStyle(DEEP, 0.45 * a).fillEllipse(0, 4, R * 3, R * 1.4);
    for (let i = 0; i < 4; i++) {
      const ph = t * (9 + i * 2) + i * 1.6, rr = R * (0.7 + i * 0.18);
      g.lineStyle(6 - i, i % 2 ? FOAM : NAVY, 0.9 * a).beginPath().arc(0, -4 - k * 10, rr, ph, ph + 2.4).strokePath();
    }
    for (let i = 0; i < 6; i++) { const an = t * 6 + i; g.fillStyle(SPRAY, 0.8 * a).fillCircle(Math.cos(an) * R * 1.3, -6 + Math.sin(an) * R * 0.5 - k * 14, 1.6); }
  });
  // 2) the beast of dark water carries him along the dribble and crashes into the rival
  play(scene, 0, 0, AIR + 1, ms, (g, k, t) => {
    if (k < 0.2) return;
    const q = Math.min(1, (k - 0.2) / 0.7), a = 1 - Math.max(0, k - 0.9) * 10;
    const hx = x + c * len * q, hy = y - 4 + s * len * q, nx = -s, ny = c;
    for (let i = 7; i >= 0; i--) { // its body: swells of navy water with white crests, waving behind the head
      const d = i * (8 + lv * 0.4), w = Math.sin(t * 16 - i * 0.9) * 4, bx = hx - c * d + nx * w, by = hy - s * d + ny * w, r = (12 + lv * 0.6) * (1 - i * 0.07);
      g.fillStyle(i % 2 ? NAVY : DEEP, 0.92 * a).fillEllipse(bx, by, r * 2.2, r * 1.5);
      g.lineStyle(2, FOAM, 0.85 * a).beginPath().arc(bx, by - r * 0.3, r, Math.PI * 1.1, Math.PI * 1.9).strokePath();
    }
    const H = 14 + lv * 0.7, open = 0.35 + Math.sin(t * 18) * 0.15; // the head: open jaws, white teeth, glowing eyes
    const jaw = (side: number) => {
      const ja = ang + side * open;
      g.fillStyle(DEEP, a).fillTriangle(hx + nx * side * H * 0.5, hy + ny * side * H * 0.5, hx + Math.cos(ja) * H * 2, hy + Math.sin(ja) * H * 2, hx - c * H * 0.4, hy - s * H * 0.4);
      for (let k2 = 1; k2 <= 3; k2++) { const f = k2 / 4, px = hx + Math.cos(ja) * H * 2 * f, py = hy + Math.sin(ja) * H * 2 * f; g.fillStyle(FOAM, a).fillTriangle(px, py, px - nx * side * 4, py - ny * side * 4, px + c * 3, py + s * 3); }
    };
    jaw(1); jaw(-1);
    g.fillStyle(EYE, a).fillCircle(hx - c * H * 0.1 + nx * H * 0.45, hy - s * H * 0.1 + ny * H * 0.45, 2.6);
    g.fillStyle(EYE, a).fillCircle(hx - c * H * 0.1 - nx * H * 0.45, hy - s * H * 0.1 - ny * H * 0.45, 2.6);
  });
  // 3) the crash: white spray where the dribble ends, when the beast gets there
  scene.time.delayedCall(ms * 0.82, () => play(scene, tx, ty - 6, AIR + 2, ms * 0.5, (g, k) => {
    const a = 1 - k, r = (16 + lv) * (0.5 + k * 1.4);
    g.fillStyle(FOAM, 0.75 * a).fillCircle(0, 0, r * 0.7);
    g.lineStyle(3, SPRAY, a).strokeCircle(0, 0, r);
    for (let i = 0; i < 10; i++) { const an = i * 0.628; g.fillStyle(i % 2 ? FOAM : SPRAY, a).fillCircle(Math.cos(an) * r * 1.2, Math.sin(an) * r * 0.8, 2.4); }
  }));
}

// ================================================================ Corte volcánico
export const isCorteVolcanico = (name: string) => /^corte volc[aá]nico$|volcano cut/i.test(name.trim());

/** the defence at (x, y), reach `r`, facing `ang` (towards the rival) */
export function corteVolcanico(scene: S, x: number, y: number, r: number, ang: number, lv: number, ms = 900) {
  const span = 2.2, R = r * 0.85, a0 = ang - span / 2;
  const pt = (u: number) => ({ x: Math.cos(a0 + span * u) * R, y: Math.sin(a0 + span * u) * R * 0.6 }); // on the ground: flattened
  play(scene, x, y + 4, -9700, ms, (g, k) => { // the burning arc drawn on the pitch
    const draw = Math.min(1, k * 3.5), a = 1 - Math.max(0, k - 0.8) * 5;
    g.lineStyle(9, EMBER, 0.6 * a).beginPath();
    for (let i = 0; i <= 24 * draw; i++) { const p = pt(i / 24); if (i === 0) g.moveTo(p.x, p.y); else g.lineTo(p.x, p.y); }
    g.strokePath();
    g.lineStyle(4, FIRE, 0.95 * a).beginPath();
    for (let i = 0; i <= 24 * draw; i++) { const p = pt(i / 24); if (i === 0) g.moveTo(p.x, p.y); else g.lineTo(p.x, p.y); }
    g.strokePath();
  });
  play(scene, x, y + 4, AIR - 2, ms, (g, k, t) => { // the wall of flames rising along it
    if (k < 0.25) return;
    const rise = Math.min(1, (k - 0.25) / 0.25), a = 1 - Math.max(0, k - 0.75) * 4;
    const n = 14 + lv;
    for (let i = 0; i < n; i++) {
      const u = (i + 0.5) / n, p = pt(u), flick = Math.sin(t * 22 + i * 1.7) * 0.25 + 0.85;
      const h = (16 + lv * 1.2 + ((i * 7) % 5) * 4) * rise * flick, w = (R * span / n) * 0.75;
      g.fillStyle(FIRE, 0.85 * a).fillTriangle(p.x - w, p.y, p.x + w, p.y, p.x, p.y - h);
      g.fillStyle(FLAME, 0.9 * a).fillTriangle(p.x - w * 0.6, p.y, p.x + w * 0.6, p.y, p.x, p.y - h * 0.7);
      g.fillStyle(CORE, 0.9 * a).fillTriangle(p.x - w * 0.25, p.y, p.x + w * 0.25, p.y, p.x, p.y - h * 0.35);
    }
  });
  play(scene, x, y - 2, AIR - 1, ms * 0.35, (g, k, t) => { // the burning feet of the sliding kick
    const a = 1 - k;
    for (let i = 0; i < 6; i++) { const an = ang + Math.PI + (i - 2.5) * 0.35; const d = 6 + k * 14 + Math.sin(t * 30 + i) * 2; g.fillStyle(i % 2 ? FLAME : FIRE, 0.9 * a).fillCircle(Math.cos(an) * d, Math.sin(an) * d * 0.6 + 6, 3 - k * 2); }
  });
}
