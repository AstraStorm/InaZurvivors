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
const NAVY = 0x0d2a5a, DEEP = 0x061634, FOAM = 0xf4fbff, SPRAY = 0xbfe6ff, EYE = 0x7ff6ff;
// the beast is light translucent teal water (video 3-6 s), not the navy of the maelstrom
const WATER = 0x3f9fc4, AQUA = 0x7fd6ee, PALE = 0xc8f2ff, DARKW = 0x0f3a52, ORB = 0x7ff6ff;
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

/**
 * the dribble from (x, y) to (tx, ty). (author: «el agua está mal hecha») Redone from the video frame by frame (8 fps):
 *   0-1.2 s  a flat maelstrom on the pitch, navy bands and white foam streaks spinning round him;
 *   1.2-2.2  a mountain of navy water with white blotches erupts under him and lifts him on its peak, spray all round;
 *   3-4.5    he stands on the head of a beast of LIGHT translucent teal water (not navy): spiky crests, white eyes, teeth;
 *   4.75-5.3 the jaws open, the ball goes in and comes out as a glowing cyan orb;
 *   5.6-7.3  its long serpent body arches over and comes down on the rival, and everything blows up in white foam.
 * A dribble here lasts about a second, so the five beats are compressed into `ms`.
 */
/** reach of the crash at a level: the beast's splash grows with the technique (author: «el área se ha de hacer más grande») */
export const corrienteCrashR = (lv: number) => 30 + lv * 6;

export function corrienteNegra(scene: S, x: number, y: number, tx: number, ty: number, lv: number, ms = 650, onCrash?: (cx: number, cy: number, r: number) => void) {
  const ang = Math.atan2(ty - y, tx - x), len = Math.max(40, Math.hypot(tx - x, ty - y)), c = Math.cos(ang), s = Math.sin(ang);
  const nx = -s, ny = c, R = 20 + lv * 3; // the maelstrom (where the beast comes out of) grows with the level
  // 1) the maelstrom: a flat ellipse on the ground, spiral bands of navy and foam turning fast
  play(scene, x, y + 4, -9700, ms * 0.45, (g, k, t) => {
    const a = Math.min(1, k * 5) * (1 - Math.max(0, k - 0.6) * 2.5), grow = 0.6 + k * 0.6;
    g.fillStyle(DEEP, 0.55 * a).fillEllipse(0, 0, R * 3.2 * grow, R * 1.5 * grow);
    for (let arm = 0; arm < 6; arm++) { // six spiral bands, navy and foam by turns, drawn as continuous strokes
      g.lineStyle(arm % 2 ? 3 : 5, arm % 2 ? FOAM : NAVY, 0.92 * a).beginPath();
      for (let i = 0; i <= 22; i++) {
        const u = i / 22, an = t * 10 + arm * 1.047 + u * 3.6, rr = R * 1.55 * grow * (0.12 + u * 0.88);
        if (i === 0) g.moveTo(Math.cos(an) * rr, Math.sin(an) * rr * 0.46); else g.lineTo(Math.cos(an) * rr, Math.sin(an) * rr * 0.46);
      }
      g.strokePath();
    }
    g.fillStyle(FOAM, 0.7 * a).fillEllipse(0, 0, R * 0.5 * grow, R * 0.22 * grow);
  });
  // 2) the mountain of water erupting under him (navy with white blotches) and the spray thrown up
  play(scene, x, y + 6, y - 1, ms * 0.5, (g, k, t) => { // behind him (footballers sort by y), so it lifts him instead of hiding him
    if (k < 0.15) return;
    const q = Math.min(1, (k - 0.15) / 0.35), a = 1 - Math.max(0, k - 0.7) * 3.3, H = (30 + lv * 2) * q, W = R * 1.1;
    for (let i = 0; i < 6; i++) { // a dome of stacked swells, wide at the base, round at the top
      const v = i / 5, hw = W * (1 - v * 0.75), cy = -H * v * 0.85;
      g.fillStyle(i % 2 ? NAVY : DEEP, 0.92 * a).fillEllipse(Math.sin(t * 8 + i) * 2, cy, hw * 2, H * 0.32 + 4);
    }
    for (let i = 0; i < 7; i++) { // foam blotches over the slope
      const u = ((i * 37) % 10) / 10, v = ((i * 53) % 10) / 10, py = -H * (0.15 + v * 0.7), half = W * (1 + py / H);
      g.fillStyle(FOAM, 0.85 * a).fillEllipse((u - 0.5) * half * 1.6, py, 6 + (i % 3) * 2, 3 + (i % 2) * 2);
    }
    g.fillStyle(FOAM, 0.95 * a).fillEllipse(0, -H, W * 0.7, 5); // the crest he stands on
    for (let i = 0; i < 10; i++) { const an = -Math.PI / 2 + (i - 4.5) * 0.3, d = H * 0.4 + k * 30 + (i % 3) * 5; g.fillStyle(i % 2 ? FOAM : SPRAY, 0.85 * a).fillCircle(Math.cos(an) * d, -H * 0.5 + Math.sin(an) * d * 0.6 + Math.sin(t * 9 + i) * 2, 1.4 + (i % 3) * 0.5); }
  });
  // 3-4) the beast of light teal water: a long serpent body from him to its head, jaws open, the cyan orb shot ahead
  play(scene, 0, 0, AIR + 1, ms, (g, k, t) => {
    if (k < 0.3) return;
    const q = Math.min(1, (k - 0.3) / 0.45), a = 1 - Math.max(0, k - 0.88) * 8.3;
    const hx = x + c * len * 0.85 * q, hy = y - 14 + s * len * 0.85 * q - Math.sin(q * Math.PI) * 18; // its head arches up and comes down
    const n = 14, bodyLen = Math.max(1, Math.hypot(hx - x, hy - y));
    for (let i = n; i >= 0; i--) { // the body: discs of water thinning towards the tail, with foam spikes on its back
      const u = i / n, bx = hx + (x - hx) * u + nx * Math.sin(t * 14 + u * 6) * 5 * (1 - u), by = hy + (y - 4 - hy) * u - Math.sin(u * Math.PI) * bodyLen * 0.25;
      const r = (11 + lv * 0.6) * (1 - u * 0.55);
      g.fillStyle(WATER, 0.88 * a).fillCircle(bx, by, r);
      g.fillStyle(AQUA, 0.8 * a).fillCircle(bx - nx * r * 0.25, by - r * 0.35, r * 0.62);
      g.fillStyle(PALE, 0.7 * a).fillCircle(bx - nx * r * 0.35, by - r * 0.55, r * 0.28);
      if (i % 2 === 0) g.fillStyle(FOAM, 0.9 * a).fillTriangle(bx - r * 0.4, by - r * 0.7, bx + r * 0.4, by - r * 0.7, bx, by - r * 1.6); // crest spikes
    }
    const H = 13 + lv * 0.7, open = 0.28 + Math.min(1, q * 2) * 0.22 + Math.sin(t * 20) * 0.05, J = H * 1.5;
    g.fillStyle(WATER, a).fillCircle(hx - c * H * 0.3, hy - s * H * 0.3, H * 0.95); // the skull
    g.fillStyle(AQUA, a).fillCircle(hx - c * H * 0.4 - nx * H * 0.2, hy - s * H * 0.4 - H * 0.35, H * 0.55);
    g.fillStyle(DARKW, 0.9 * a).fillTriangle(hx, hy, hx + Math.cos(ang - open) * J * 0.9, hy + Math.sin(ang - open) * J * 0.9, hx + Math.cos(ang + open) * J * 0.9, hy + Math.sin(ang + open) * J * 0.9); // the open mouth
    for (const side of [1, -1]) { // the two jaws with white teeth
      const ja = ang + side * open, ex = hx + Math.cos(ja) * J, ey = hy + Math.sin(ja) * J;
      g.fillStyle(WATER, a).fillTriangle(hx + nx * side * H * 0.7, hy + ny * side * H * 0.7, ex, ey, hx - c * H * 0.5, hy - s * H * 0.5);
      g.fillStyle(AQUA, a).fillTriangle(hx + nx * side * H * 0.5, hy + ny * side * H * 0.5, ex, ey, hx, hy);
      for (let k2 = 1; k2 <= 4; k2++) { const f = k2 / 5, px = hx + (ex - hx) * f, py = hy + (ey - hy) * f; g.fillStyle(FOAM, a).fillTriangle(px - c * 2, py - s * 2, px + c * 2, py + s * 2, px - nx * side * 5, py - ny * side * 5); }
    }
    for (const side of [1, -1]) { // crests on the head and the white glowing eyes
      const bx = hx - c * H * 0.4 + nx * side * H * 0.55, by = hy - s * H * 0.4 + ny * side * H * 0.55;
      g.fillStyle(PALE, a).fillTriangle(bx - c * H * 0.2, by - s * H * 0.2, bx - c * H * 1.2 + nx * side * H * 0.6, by - s * H * 1.2 + ny * side * H * 0.6 - 8, bx - c * H * 0.9 - nx * side * H * 0.1, by - s * H * 0.9 - ny * side * H * 0.1);
      g.fillStyle(FOAM, a).fillCircle(bx + c * 3, by + s * 3, 3.2);
      g.fillStyle(EYE, 0.5 * a).fillCircle(bx + c * 3, by + s * 3, 5.5);
    }
    if (q > 0.55) { // the ball inside a glowing cyan orb, shot out of the jaws
      const o = Math.min(1, (q - 0.55) / 0.45), ox = hx + (tx - hx) * o, oy = hy + (ty - 6 - hy) * o, pr = 7 + lv * 0.3 + Math.sin(t * 30) * 1;
      g.fillStyle(ORB, 0.35 * a).fillCircle(ox, oy, pr * 1.9);
      g.fillStyle(ORB, 0.85 * a).fillCircle(ox, oy, pr);
      g.lineStyle(2, FOAM, a).strokeCircle(ox, oy, pr * 1.3);
      g.fillStyle(FOAM, a).fillCircle(ox, oy, pr * 0.45);
    }
  });
  // 5) the serpent comes down on the rival: a crescent wave of foam rising and breaking, then white spray everywhere
  const CR = corrienteCrashR(lv);
  scene.time.delayedCall(ms * 0.72, () => { if (scene.sys.isActive()) onCrash?.(tx, ty, CR); }); // (author: «cuando ataca no hace daño») the crash hurts
  scene.time.delayedCall(ms * 0.72, () => play(scene, tx, ty - 4, AIR + 2, ms * 0.6, (g, k, t) => {
    const a = 1 - Math.max(0, k - 0.35) * 1.55, r = CR * 0.6 * (0.7 + k * 1.3);
    g.fillStyle(FOAM, 0.85 * a * (1 - k * 0.5)).fillEllipse(0, 0, r * 2.2, r * 1.1);
    g.fillStyle(PALE, 0.7 * a).fillEllipse(0, 0, r * 1.3, r * 0.6);
    const n = 16;
    for (let i = 0; i < n; i++) { // the foam spikes of the breaking wave, taller in front
      const an = Math.PI + (i / (n - 1)) * Math.PI, px = Math.cos(an) * r, py = Math.sin(an) * r * 0.5, h = (14 + (i * 7 % 5) * 4 + lv) * (1 - k * 0.6) * (0.6 + Math.sin(i / (n - 1) * Math.PI) * 0.6);
      g.fillStyle(i % 3 ? FOAM : AQUA, 0.95 * a).fillTriangle(px - 4, py, px + 4, py, px + Math.cos(an) * 3, py - h);
    }
    for (let i = 0; i < 14; i++) { const an = i * 0.449 + t, d = r * (0.9 + k * 0.8); g.fillStyle(i % 2 ? FOAM : SPRAY, a).fillCircle(Math.cos(an) * d, Math.sin(an) * d * 0.55 - k * 10, 1.6 + (i % 3) * 0.6); }
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
