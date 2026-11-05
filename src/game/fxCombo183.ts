/**
 * 1.83 (author): new combined techniques and redrawn techniques, from their scenes on YouTube (frames looked at):
 *   Triángulo letal (Death Zone, IXpyALqFnUI) — the pitch turns into a swirling violet void; the three jump to the corners
 *     of a triangle traced in pink laser lines, a magenta orb grows in its middle and they spin round it; the ball leaves
 *     as a pink-violet sphere with a long white and pink flame trail.
 *   Triángulo letal 2 (Death Zone 2, 0Nlev9ss7pQ) — the same triangle, wider, under a purple vortex sky with lightning.
 *   Tornado dragón (Dragon Tornado, qMR6_ZrmqAg) — Kevin's blue dragon rises in a coil and opens its jaws; Axel's ball,
 *     wrapped in fire, flies into its mouth and the dragon carries it: a blue serpent with a fiery head.
 *   Tornado dirección doble / triple (Fire Tornado DD / TC, 4qac5NNVANc) — a dark stormy blue sky, each player rises
 *     with fire on his legs, huge loops of fire spiral round them and the ball becomes a whirling beam of flame.
 *   Orbe de Perseo (Perseus Orb, KwXz5Q_oC7I) — night in the stadium; a winged figure of white light over the ball and a
 *     wide cyan-white beam.
 *   Ventisca triple (Triple Blizzard, _pngCtDhHFY) — a cold blue sky crossed by white streaks and a great icy arc; the
 *     three jump one after another and the ball goes as an ice comet with white swooshes.
 *   Disparo sagrado (God Break, TKDI4YQkuKk) — a sphere of white-gold light crackling with lightning in a blue sky, then a
 *     golden blast like a fist of light.
 *   Mano Diabólica (Maou The Hand, 4ASO2dbgQYU) — a huge magenta demon with a red horned mask rises behind the keeper and
 *     its hand closes on the ball with a yellow glow.
 *   Apisonadora (Sabaki no Tettsui, «the iron hammer of judgement»; no clear footage) — a giant golden hammer falls from
 *     the sky and stamps the ground in front of the defender: shockwave and dust.
 * Everything is drawn with graphics (no third-party art); only transform/alpha and per-frame redraws.
 */
import Phaser from 'phaser';

type S = Phaser.Scene;
type Img = Phaser.GameObjects.Image;
type G = Phaser.GameObjects.Graphics;
type P = { x: number; y: number };
const AIR = 8900;
const ADD = Phaser.BlendModes.ADD;

/** Draws `frame(g, k, t)` every frame for `ms` (k 0..1) on its own graphics, then removes it. */
function play(scene: S, x: number, y: number, depth: number, ms: number, frame: (g: G, k: number, t: number) => void, blend = false) {
  const g = scene.add.graphics({ x, y }).setDepth(depth);
  if (blend) g.setBlendMode(ADD);
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

/** Follows a flying ball (frame gets its position and heading); `end` runs once where it stopped. */
function ride(scene: S, ball: Img, frame: (g: G, bx: number, by: number, ang: number, t: number) => void, end: (x: number, y: number) => void, blend = false) {
  const g = scene.add.graphics().setDepth(AIR);
  if (blend) g.setBlendMode(ADD);
  let px = ball.x, py = ball.y, ang = 0;
  const t0 = scene.time.now;
  const tick = () => {
    if (!ball.active) { scene.events.off('update', tick); g.destroy(); end(px, py); return; }
    if (Math.hypot(ball.x - px, ball.y - py) > 0.5) ang = Math.atan2(ball.y - py, ball.x - px);
    px = ball.x; py = ball.y;
    g.clear();
    frame(g, px, py, ang, (scene.time.now - t0) / 1000);
  };
  scene.events.on('update', tick);
  scene.events.once('shutdown', () => scene.events.off('update', tick));
}

/** A tapering tail behind (bx, by) along -ang: `len` long, `w` wide at the ball. */
function tail(g: G, bx: number, by: number, ang: number, len: number, w: number, color: number, alpha: number) {
  const c = Math.cos(ang), s = Math.sin(ang), nx = -s, ny = c;
  g.fillStyle(color, alpha).fillPoints([
    new Phaser.Math.Vector2(bx + nx * w, by + ny * w), new Phaser.Math.Vector2(bx - c * len, by - s * len), new Phaser.Math.Vector2(bx - nx * w, by - ny * w),
  ], true);
}

const burst = (scene: S, x: number, y: number, ms: number, colors: number[], size: number) => play(scene, x, y, AIR + 2, ms, (g, k) => {
  const a = 1 - k;
  colors.forEach((c, i) => g.fillStyle(c, (0.55 - i * 0.12) * a).fillCircle(0, 0, size * (0.4 + k) * (1 - i * 0.22)));
  g.lineStyle(4, colors[0], a).strokeCircle(0, 0, size * (0.6 + k * 1.4));
}, true);

// ================================================================ Triángulo letal (1 and 2)
const DZ_VOID = 0x2a0a4a, DZ_VIOLET = 0x8a2aff, DZ_PINK = 0xff4ad8, DZ_WHITE = 0xffe8ff;
export function deathZoneCharge(scene: S, who: P[], x: number, y: number, lv: number, ms: number, two: boolean) {
  const span = (two ? 70 : 52) + lv * 2;
  const top = y - 26;
  // the three corners: the participants' own spots pushed out to a clean triangle round the meeting point
  const corners = [0, 1, 2].map((i) => { const a = -Math.PI / 2 + i * (Math.PI * 2 / 3); return { x: x + Math.cos(a) * span, y: top + Math.sin(a) * span * 0.75 }; });
  play(scene, x, top, AIR - 3, ms, (g, k, t) => { // the violet void, swirling
    const a = Math.min(1, k * 3) * (1 - Math.max(0, k - 0.85) * 6);
    for (let i = 0; i < 5; i++) g.fillStyle(i % 2 ? DZ_VIOLET : DZ_VOID, (i % 2 ? 0.28 : 0.42) * a).fillEllipse(0, 0, span * (5 - i * 0.8), span * (3.4 - i * 0.55));
    for (let i = 0; i < 6; i++) { const r = span * (0.8 + i * 0.35), ph = t * (2 + i * 0.4) + i; g.lineStyle(2, i % 2 ? DZ_PINK : DZ_VIOLET, 0.35 * a).beginPath().arc(0, 0, r, ph, ph + 1.7).strokePath(); }
    if (two) for (let i = 0; i < 2; i++) { // Death Zone 2: lightning in the vortex
      if (((t * 6 + i * 3) | 0) % 3) continue;
      let lx = (i ? 1 : -1) * span * 1.6, ly = -span * 1.4;
      g.lineStyle(2, DZ_WHITE, 0.8 * a).beginPath().moveTo(lx, ly);
      for (let s = 0; s < 5; s++) { lx += (Math.random() - 0.5) * 18; ly += span * 0.28; g.lineTo(lx, ly); }
      g.strokePath();
    }
  });
  play(scene, 0, 0, AIR + 1, ms, (g, k) => { // the triangle of pink lasers, drawn edge by edge, and the orb in the middle
    const draw = Math.min(1, k * 2.2);
    for (let i = 0; i < 3; i++) {
      const p0 = corners[i], p1 = corners[(i + 1) % 3], e = Math.max(0, Math.min(1, draw * 3 - i));
      if (e <= 0) continue;
      const ex = p0.x + (p1.x - p0.x) * e, ey = p0.y + (p1.y - p0.y) * e;
      g.lineStyle(7, DZ_PINK, 0.35).lineBetween(p0.x, p0.y, ex, ey);
      g.lineStyle(2.5, DZ_WHITE, 0.95).lineBetween(p0.x, p0.y, ex, ey);
    }
    for (const c of corners) { g.fillStyle(DZ_PINK, 0.6).fillCircle(c.x, c.y, 6); g.fillStyle(DZ_WHITE, 0.9).fillCircle(c.x, c.y, 3); }
    const orb = (6 + lv) * Math.min(1, k * 1.6) * (two ? 1.3 : 1);
    g.fillStyle(DZ_VIOLET, 0.45).fillCircle(x, top, orb * 2);
    g.fillStyle(DZ_PINK, 0.8).fillCircle(x, top, orb * 1.2);
    g.fillStyle(DZ_WHITE, 0.95).fillCircle(x, top, orb * 0.55);
  }, true);
  for (const p of who) play(scene, p.x, p.y, AIR + 2, ms * 0.8, (g, k, t) => { // each one spins in the air: a pink whirl round him
    const a = Math.min(1, k * 4) * (1 - Math.max(0, k - 0.75) * 4);
    for (let i = 0; i < 3; i++) { const ph = t * 14 + i * 2.1; g.lineStyle(2.5, i % 2 ? DZ_WHITE : DZ_PINK, 0.8 * a).beginPath().arc(0, -14, 12 + i * 3, ph, ph + 2.2).strokePath(); }
  }, true);
}
export function deathZoneShot(scene: S, ball: Img, lv: number, two: boolean) {
  const r = (two ? 12 : 10) + lv * 0.6;
  ride(scene, ball, (g, bx, by, ang, t) => {
    const len = (two ? 110 : 90) + lv * 4;
    tail(g, bx, by, ang, len, r * 1.7, DZ_PINK, 0.35);
    tail(g, bx, by, ang, len * 0.8, r * 1.1, DZ_WHITE, 0.55);
    for (let i = 0; i < 3; i++) { const o = Math.sin(t * 20 + i * 2) * r * 0.8; tail(g, bx + Math.cos(ang + 1.57) * o, by + Math.sin(ang + 1.57) * o, ang, len * (0.5 + i * 0.1), r * 0.35, DZ_PINK, 0.5); }
    g.fillStyle(DZ_VIOLET, 0.6).fillCircle(bx, by, r * 1.6);
    g.fillStyle(DZ_PINK, 0.9).fillCircle(bx, by, r * 1.1);
    g.lineStyle(2, DZ_WHITE, 0.9).beginPath().arc(bx, by, r * 1.3, t * 10, t * 10 + 3.8).strokePath();
  }, (x, y) => burst(scene, x, y, 480, [DZ_PINK, DZ_VIOLET, DZ_WHITE], 26 + lv * 2), true);
}

// ================================================================ Tornado dragón
const DR_BLUE = 0x3a8aff, DR_PALE = 0xbfe4ff, DR_FIRE = 0xff6a1a, DR_GOLD = 0xffd23f;
/** A serpent of blue scales along `pts` (head last), jaws open at the end. */
function serpent(g: G, pts: P[], w: number, a: number, jaw: number) {
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i], s = w * (0.45 + 0.55 * (i / pts.length));
    g.fillStyle(DR_BLUE, 0.85 * a).fillCircle(p.x, p.y, s);
    g.fillStyle(DR_PALE, 0.55 * a).fillCircle(p.x - s * 0.25, p.y - s * 0.3, s * 0.45);
    if (i % 2) g.lineStyle(2, DR_PALE, 0.7 * a).beginPath().arc(p.x, p.y + s * 0.2, s * 0.9, 3.6, 5.8).strokePath(); // the white mane
  }
  const h = pts[pts.length - 1], b = pts[pts.length - 2] ?? h, ang = Math.atan2(h.y - b.y, h.x - b.x);
  const c = Math.cos(ang), s = Math.sin(ang), hw = w * 1.3;
  for (const side of [-1, 1]) { // upper and lower jaw
    const ja = ang + side * jaw;
    g.fillStyle(DR_BLUE, a).fillTriangle(h.x + Math.cos(ang + side * 1.57) * hw * 0.6, h.y + Math.sin(ang + side * 1.57) * hw * 0.6, h.x + Math.cos(ja) * hw * 2.2, h.y + Math.sin(ja) * hw * 2.2, h.x + c * hw * 0.6, h.y + s * hw * 0.6);
  }
  g.fillStyle(0xff3030, a).fillCircle(h.x + Math.cos(ang - 1.2) * hw * 0.7, h.y + Math.sin(ang - 1.2) * hw * 0.7, 2.4); // its red eye
}
export function dragonTornadoCharge(scene: S, kevin: P, axel: P, x: number, y: number, lv: number, ms: number) {
  const w = 6 + lv * 0.5;
  play(scene, 0, 0, AIR + 1, ms, (g, k, t) => { // the dragon rises from Kevin in a coil towards the meeting point
    const a = Math.min(1, k * 3);
    const n = 16, pts: P[] = [];
    for (let i = 0; i < n; i++) {
      const u = (i / (n - 1)) * Math.min(1, k * 1.4);
      const coil = Math.sin(u * 9 + t * 3) * (18 + lv) * (1 - u);
      pts.push({ x: kevin.x + (x - kevin.x) * u + coil, y: kevin.y - 10 + (y - 60 - (kevin.y - 10)) * u - Math.sin(u * Math.PI) * 50 });
    }
    serpent(g, pts, w, a, 0.25 + Math.min(0.45, k * 0.6));
  });
  play(scene, axel.x, axel.y, AIR + 2, ms, (g, k, t) => { // Axel's own spiral of fire, then the fireball rising to its jaws
    const a = Math.min(1, k * 4) * (1 - Math.max(0, k - 0.8) * 5);
    for (let i = 0; i < 5; i++) { const h = -6 - i * 9 - k * 12, ph = t * 12 + i; g.lineStyle(4, i % 2 ? DR_GOLD : DR_FIRE, 0.8 * a).beginPath().arc(0, h, 10 + i * 2, ph, ph + 3).strokePath(); }
  }, true);
  play(scene, x, y - 60, AIR + 3, ms, (g, k) => { // the fireball in the dragon's mouth
    if (k < 0.55) return;
    const s2 = (k - 0.55) / 0.45, r = (8 + lv * 0.6) * s2;
    g.fillStyle(DR_FIRE, 0.55).fillCircle(0, 0, r * 2);
    g.fillStyle(DR_GOLD, 0.85).fillCircle(0, 0, r * 1.2);
    g.fillStyle(0xffffff, 0.9).fillCircle(0, 0, r * 0.6);
  }, true);
}
export function dragonTornadoShot(scene: S, ball: Img, lv: number) {
  const w = 8 + lv * 0.6, len = 80 + lv * 5;
  ride(scene, ball, (g, bx, by, ang, t) => { // the dragon flies with the ball in its jaws: a long blue body waving behind
    const c = Math.cos(ang), sn = Math.sin(ang), nx = -sn, ny = c, n = 18, pts: P[] = [];
    for (let i = n - 1; i >= 0; i--) {
      const d = (i / (n - 1)) * len, wave = Math.sin(t * 14 - i * 0.6) * (4 + i * 0.6);
      pts.push({ x: bx - c * (d + w) + nx * wave, y: by - sn * (d + w) + ny * wave });
    }
    serpent(g, pts, w, 1, 0.5 + Math.sin(t * 12) * 0.1);
    g.fillStyle(DR_FIRE, 0.75).fillCircle(bx + c * w * 0.6, by + sn * w * 0.6, w * 1.5);
    g.fillStyle(DR_GOLD, 0.95).fillCircle(bx + c * w * 0.6, by + sn * w * 0.6, w * 0.9);
  }, (x, y) => burst(scene, x, y, 460, [DR_FIRE, DR_BLUE, DR_GOLD], 26 + lv * 2));
}

// ================================================================ Tornado dirección doble / triple
const FT_NIGHT = 0x0a1a4a, FT_FIRE = 0xff5a10, FT_GOLD = 0xffc23a, FT_WHITE = 0xfff4d0;
export function fireTornadoCharge(scene: S, who: P[], x: number, y: number, lv: number, ms: number) {
  const triple = who.length >= 3, size = (triple ? 44 : 36) + lv * 2;
  play(scene, x, y - 20, AIR - 3, ms, (g, k) => { // the dark stormy sky
    const a = Math.min(1, k * 3) * (1 - Math.max(0, k - 0.85) * 6);
    for (let i = 0; i < 4; i++) g.fillStyle(FT_NIGHT, (0.26 - i * 0.04) * a).fillEllipse(0, 0, size * (5.4 - i), size * (3.2 - i * 0.5));
  });
  for (const p of who) play(scene, p.x, p.y, AIR + 1, ms * 0.85, (g, k, t) => { // fire on each one's legs, loops climbing
    const a = Math.min(1, k * 4) * (1 - Math.max(0, k - 0.8) * 5);
    for (let i = 0; i < 6; i++) { const h = -2 - i * 8 - k * 14, ph = t * 13 + i * 0.9; g.lineStyle(4.5, i % 2 ? FT_GOLD : FT_FIRE, 0.85 * a).beginPath().arc(0, h, 9 + i * 2.5, ph, ph + 3.4).strokePath(); }
  }, true);
  play(scene, x, y - 30, AIR + 2, ms, (g, k, t) => { // the giant loops of fire meeting over the ball
    if (k < 0.45) return;
    const s2 = (k - 0.45) / 0.55;
    for (let i = 0; i < (triple ? 7 : 5); i++) {
      const r = size * (0.35 + i * 0.16) * s2, ph = t * (6 + i) + i;
      g.lineStyle(6 - i * 0.5, i % 2 ? FT_GOLD : FT_FIRE, 0.85).beginPath().arc(0, 0, r, ph, ph + 4.4).strokePath();
    }
    g.fillStyle(FT_WHITE, 0.9 * s2).fillCircle(0, 0, 8 + lv * 0.6);
  }, true);
}
export function fireTornadoShot(scene: S, ball: Img, lv: number, triple: boolean) {
  const r = (triple ? 13 : 11) + lv * 0.6;
  ride(scene, ball, (g, bx, by, ang, t) => { // a whirling beam of flame
    const len = (triple ? 120 : 95) + lv * 4, c = Math.cos(ang), s = Math.sin(ang), nx = -s, ny = c;
    tail(g, bx, by, ang, len, r * 1.8, FT_FIRE, 0.4);
    tail(g, bx, by, ang, len * 0.75, r, FT_GOLD, 0.6);
    for (let i = 0; i < 7; i++) { // spiral loops along the beam
      const d = i * len / 7, ph = t * 16 - i * 0.9, w = r * (1.5 - i * 0.12);
      g.lineStyle(3, i % 2 ? FT_GOLD : FT_FIRE, 0.8 - i * 0.08).beginPath().arc(bx - c * d + nx * Math.sin(ph) * 2, by - s * d + ny * Math.sin(ph) * 2, w, ph, ph + 3.6).strokePath();
    }
    g.fillStyle(FT_WHITE, 0.95).fillCircle(bx, by, r * 0.8);
  }, (x, y) => burst(scene, x, y, 520, [FT_FIRE, FT_GOLD, FT_WHITE], (triple ? 34 : 28) + lv * 2));
}

// ================================================================ Orbe de Perseo
const PO_NIGHT = 0x061033, PO_CYAN = 0x6ae8ff, PO_WHITE = 0xffffff, PO_GOLD = 0xffe08a;
/** A wing of white light (right side; mirror with sx -1): five feathers fanning up and out. */
function lightWing(g: G, x: number, y: number, sx: number, size: number, open: number, a: number) {
  for (let i = 0; i < 5; i++) {
    const ang = -Math.PI / 2 + sx * (0.25 + i * 0.28) * open, len = size * (1.1 - i * 0.12);
    const ex = x + Math.cos(ang) * len * sx * 0 + Math.sin(-ang + Math.PI / 2) * 0, tipx = x + sx * Math.abs(Math.cos(ang)) * len, tipy = y + Math.sin(ang) * len;
    g.fillStyle(i % 2 ? PO_CYAN : PO_WHITE, (0.75 - i * 0.08) * a).fillTriangle(x, y - 2, x, y + 4, tipx, tipy);
    void ex;
  }
}
export function perseusCharge(scene: S, who: P[], x: number, y: number, lv: number, ms: number) {
  const size = 34 + lv * 2;
  play(scene, x, y - 20, AIR - 3, ms, (g, k) => { // night falls on the stadium
    const a = Math.min(1, k * 3) * (1 - Math.max(0, k - 0.85) * 6);
    for (let i = 0; i < 4; i++) g.fillStyle(PO_NIGHT, (0.3 - i * 0.05) * a).fillEllipse(0, 0, size * (5.6 - i), size * (3.4 - i * 0.5));
  });
  for (const p of who) play(scene, p.x, p.y, AIR + 1, ms * 0.8, (g, k) => { // a column of cyan light on each of the three
    const a = Math.min(1, k * 4) * (1 - Math.max(0, k - 0.75) * 4);
    g.fillStyle(PO_CYAN, 0.25 * a).fillRect(-8, -90, 16, 90);
    g.fillStyle(PO_WHITE, 0.6 * a).fillRect(-2.5, -90, 5, 90);
  }, true);
  play(scene, x, y - 50, AIR + 2, ms, (g, k, t) => { // the winged figure of light over the ball
    if (k < 0.35) return;
    const s2 = Math.min(1, (k - 0.35) / 0.4), flap = 0.8 + Math.sin(t * 10) * 0.15;
    lightWing(g, 0, 0, 1, size * 1.1, flap * s2, s2);
    lightWing(g, 0, 0, -1, size * 1.1, flap * s2, s2);
    g.fillStyle(PO_WHITE, 0.9 * s2).fillEllipse(0, 6, 10, 22); // the body of light
    g.fillStyle(PO_GOLD, 0.9 * s2).fillCircle(0, -8, 4.5);
    g.lineStyle(2, PO_CYAN, 0.8 * s2).strokeCircle(0, 30, 10 + lv * 0.6); // the orb below it
    g.fillStyle(PO_CYAN, 0.7 * s2).fillCircle(0, 30, 7 + lv * 0.5);
  }, true);
}
export function perseusShot(scene: S, ball: Img, lv: number) {
  const r = 11 + lv * 0.6;
  ride(scene, ball, (g, bx, by, ang, t) => { // a wide cyan-white beam, the wings riding at the front
    const len = 130 + lv * 5;
    tail(g, bx, by, ang, len, r * 2.2, PO_CYAN, 0.35);
    tail(g, bx, by, ang, len * 0.85, r * 1.1, PO_WHITE, 0.75);
    const flap = 0.7 + Math.sin(t * 14) * 0.2, wx = bx - Math.cos(ang) * r, wy = by - Math.sin(ang) * r - 6;
    lightWing(g, wx, wy, 1, r * 2.2, flap, 0.9);
    lightWing(g, wx, wy, -1, r * 2.2, flap, 0.9);
    g.fillStyle(PO_WHITE, 1).fillCircle(bx, by, r * 0.8);
  }, (x, y) => burst(scene, x, y, 520, [PO_CYAN, PO_WHITE, PO_GOLD], 30 + lv * 2), true);
}

// ================================================================ Ventisca triple
const BZ_SKY = 0x2a6ad8, BZ_ICE = 0x9ae6ff, BZ_WHITE = 0xffffff;
export function blizzardCharge(scene: S, who: P[], x: number, y: number, lv: number, ms: number) {
  const size = 38 + lv * 2;
  play(scene, x, y - 24, AIR - 3, ms, (g, k, t) => { // the cold blue sky, the great icy arc and white streaks
    const a = Math.min(1, k * 3) * (1 - Math.max(0, k - 0.85) * 6);
    for (let i = 0; i < 3; i++) g.fillStyle(BZ_SKY, (0.2 - i * 0.04) * a).fillEllipse(0, 0, size * (5.2 - i), size * (3 - i * 0.5));
    g.lineStyle(5, BZ_WHITE, 0.55 * a).beginPath().arc(0, size * 0.8, size * 2, Math.PI * 1.1, Math.PI * 1.9).strokePath();
    for (let i = 0; i < 7; i++) { const yy = -size + i * size * 0.3, xx = ((t * 260 + i * 70) % (size * 5)) - size * 2.5; g.lineStyle(2, BZ_WHITE, 0.5 * a).lineBetween(xx, yy, xx + 30, yy - 8); }
  });
  who.forEach((p, i) => scene.time.delayedCall(i * ms * 0.18, () => play(scene, p.x, p.y, AIR + 1, ms * 0.6, (g, k, t) => { // each jumps in turn in a swirl of snow
    const a = 1 - k;
    for (let j = 0; j < 3; j++) { const ph = t * 12 + j * 2; g.lineStyle(3, j % 2 ? BZ_WHITE : BZ_ICE, 0.85 * a).beginPath().arc(0, -14 - k * 10, 12 + j * 3, ph, ph + 2.4).strokePath(); }
    for (let j = 0; j < 6; j++) g.fillStyle(BZ_WHITE, 0.8 * a).fillCircle(Math.cos(j + t * 4) * 16, -10 + Math.sin(j * 2 + t * 5) * 14, 1.6);
  }, true)));
  play(scene, x, y - 20, AIR + 2, ms, (g, k, t) => { // the ice ball forming
    if (k < 0.5) return;
    const s2 = (k - 0.5) / 0.5, r = (8 + lv * 0.6) * s2;
    for (let i = 0; i < 6; i++) { const an = i * 1.047 + t * 2; g.fillStyle(BZ_ICE, 0.8).fillTriangle(Math.cos(an) * r, Math.sin(an) * r, Math.cos(an + 0.3) * r * 2.4, Math.sin(an + 0.3) * r * 2.4, Math.cos(an + 0.5) * r, Math.sin(an + 0.5) * r); }
    g.fillStyle(BZ_WHITE, 0.95).fillCircle(0, 0, r);
  }, true);
}
export function blizzardShot(scene: S, ball: Img, lv: number) {
  const r = 11 + lv * 0.6;
  ride(scene, ball, (g, bx, by, ang, t) => { // an ice comet with white swooshes
    const len = 110 + lv * 4, c = Math.cos(ang), s = Math.sin(ang), nx = -s, ny = c;
    tail(g, bx, by, ang, len, r * 1.9, BZ_ICE, 0.4);
    tail(g, bx, by, ang, len * 0.8, r * 1.0, BZ_WHITE, 0.7);
    for (const side of [-1, 1]) for (let i = 0; i < 2; i++) { // the swooshes
      const d = 20 + i * 30 + ((t * 120) % 30), o = side * r * (1.4 + i * 0.4);
      g.lineStyle(2.5, BZ_WHITE, 0.75).beginPath().arc(bx - c * d + nx * o, by - s * d + ny * o, r * 0.9, ang + side * 1.2, ang + side * 2.6).strokePath();
    }
    for (let i = 0; i < 6; i++) { const an = i * 1.047 + t * 6; g.fillStyle(BZ_ICE, 0.9).fillTriangle(bx + Math.cos(an) * r, by + Math.sin(an) * r, bx + Math.cos(an + 0.25) * r * 1.9, by + Math.sin(an + 0.25) * r * 1.9, bx + Math.cos(an + 0.5) * r, by + Math.sin(an + 0.5) * r); }
    g.fillStyle(BZ_WHITE, 1).fillCircle(bx, by, r * 0.75);
  }, (x, y) => burst(scene, x, y, 520, [BZ_ICE, BZ_WHITE, BZ_SKY], 30 + lv * 2), true);
}

// ================================================================ solo techniques
export type Solo183 = 'godbreak' | 'dragon' | 'oso';
export function solo183Of(name: string): Solo183 | null {
  const n = name.trim();
  if (/^disparo sagrado$|god ?break/i.test(n)) return 'godbreak';
  if (/^tornado drag[oó]n$|dragon ?tornado/i.test(n)) return 'dragon';
  if (/^furia de oso$|kuma ?goroshi ?zan/i.test(n)) return 'oso'; // 1.87
  return null;
}

const GB_SKY = 0x4aa8ff, GB_GOLD = 0xffd23f, GB_WHITE = 0xfffbe0, GB_BOLT = 0xe8f8ff;
function bolts(g: G, r: number, a: number, n: number) {
  for (let i = 0; i < n; i++) {
    let px = 0, py = 0, an = Math.random() * Math.PI * 2;
    g.lineStyle(2, GB_BOLT, a).beginPath().moveTo(Math.cos(an) * r * 0.6, Math.sin(an) * r * 0.6);
    for (let s = 1; s <= 4; s++) { const rr = r * (0.6 + s * 0.35); an += (Math.random() - 0.5) * 0.7; px = Math.cos(an) * rr; py = Math.sin(an) * rr; g.lineTo(px, py); }
    g.strokePath();
  }
}
export function solo183Charge(scene: S, kind: Solo183, x: number, y: number, lv: number, ms: number) {
  if (kind === 'dragon') { dragonTornadoCharge(scene, { x: x - 30, y: y + 6 }, { x, y }, x + 10, y, lv, ms); return; }
  if (kind === 'oso') { bearCharge(scene, x, y, lv, ms); return; }
  // Disparo sagrado: a patch of blue sky over him, and the sphere of white-gold light crackling above
  play(scene, x, y - 30, AIR - 3, ms, (g, k) => {
    const a = Math.min(1, k * 3) * (1 - Math.max(0, k - 0.85) * 6);
    for (let i = 0; i < 3; i++) g.fillStyle(GB_SKY, (0.16 - i * 0.03) * a).fillEllipse(0, 0, 160 - i * 30, 100 - i * 20);
  });
  play(scene, x, y - 46, AIR + 2, ms, (g, k, t) => {
    const s2 = Math.min(1, k * 1.5), r = (9 + lv * 0.7) * s2;
    g.fillStyle(GB_GOLD, 0.35).fillCircle(0, 0, r * 2.6);
    g.lineStyle(2, GB_WHITE, 0.6).strokeCircle(0, 0, r * 2.2 + Math.sin(t * 12) * 2);
    g.fillStyle(GB_WHITE, 0.95).fillCircle(0, 0, r);
    if (((t * 20) | 0) % 2) bolts(g, r * 1.4, 0.9, 3);
  }, true);
}
export function solo183Shot(scene: S, kind: Solo183, ball: Img, lv: number) {
  if (kind === 'dragon') { dragonTornadoShot(scene, ball, lv); return; }
  if (kind === 'oso') { bearShot(scene, ball, lv); return; }
  const r = 10 + lv * 0.6;
  ride(scene, ball, (g, bx, by, ang, t) => {
    tail(g, bx, by, ang, 80 + lv * 4, r * 1.4, GB_GOLD, 0.4);
    g.fillStyle(GB_GOLD, 0.45).fillCircle(bx, by, r * 1.9);
    g.fillStyle(GB_WHITE, 0.95).fillCircle(bx, by, r);
    if (((t * 24) | 0) % 2) { g.save(); g.translateCanvas(bx, by); bolts(g, r * 1.2, 0.85, 2); g.restore(); }
  }, (x, y) => play(scene, x, y, AIR + 2, 560, (g, k) => { // the golden blast, like a fist of light opening
    const a = 1 - k, R = 30 + lv * 2;
    g.fillStyle(GB_GOLD, 0.55 * a).fillCircle(0, 0, R * (0.5 + k * 1.3));
    for (let i = 0; i < 10; i++) { const an = i * 0.628 + k; g.fillStyle(GB_GOLD, 0.7 * a).fillTriangle(Math.cos(an - 0.12) * R * 0.4, Math.sin(an - 0.12) * R * 0.4, Math.cos(an) * R * (1.2 + k * 1.6), Math.sin(an) * R * (1.2 + k * 1.6), Math.cos(an + 0.12) * R * 0.4, Math.sin(an + 0.12) * R * 0.4); }
    g.fillStyle(GB_WHITE, 0.9 * a).fillCircle(0, 0, R * 0.45 * (1 - k * 0.5));
  }, true), true);
}

// ================================================================ Mano Diabólica (keeper)
const MH_MAGENTA = 0xd02ad8, MH_DEEP = 0x5a0a6a, MH_RED = 0xe02020, MH_GLOW = 0xffe24a;
export function maouHand(scene: S, x: number, y: number, lv: number, big: boolean) {
  const s = (big ? 1.9 : 1.5) * (1 + lv * 0.03);
  play(scene, x, y + 4, y - 3, 950, (g, k, t) => { // the demon rises behind the keeper
    const rise = Math.min(1, k * 3), a = Math.min(1, k * 4) * (1 - Math.max(0, k - 0.78) * 4.5);
    const by = -30 * s * rise, sway = Math.sin(t * 6) * 2;
    g.fillStyle(MH_DEEP, 0.85 * a).fillEllipse(sway, by - 6 * s, 64 * s, 70 * s); // body
    g.fillStyle(MH_MAGENTA, 0.9 * a).fillEllipse(sway, by - 10 * s, 52 * s, 56 * s);
    g.fillStyle(MH_MAGENTA, a).fillCircle(sway, by - 40 * s, 13 * s); // head
    g.fillStyle(MH_RED, 0.95 * a).fillTriangle(sway - 12 * s, by - 44 * s, sway, by - 36 * s, sway + 12 * s, by - 44 * s); // the red mask
    g.fillStyle(MH_RED, 0.95 * a).fillTriangle(sway - 9 * s, by - 48 * s, sway - 16 * s, by - 66 * s, sway - 4 * s, by - 50 * s); // horns
    g.fillStyle(MH_RED, 0.95 * a).fillTriangle(sway + 9 * s, by - 48 * s, sway + 16 * s, by - 66 * s, sway + 4 * s, by - 50 * s);
    g.fillStyle(MH_GLOW, a).fillCircle(sway - 5 * s, by - 42 * s, 1.8 * s).fillCircle(sway + 5 * s, by - 42 * s, 1.8 * s); // eyes
  });
  play(scene, x, y - 10, AIR + 1, 950, (g, k) => { // its huge hand closing in front, with the yellow glow at the catch
    if (k < 0.25) return;
    const s2 = Math.min(1, (k - 0.25) / 0.3), a = 1 - Math.max(0, k - 0.78) * 4.5, close = Math.max(0, Math.min(1, (k - 0.5) / 0.25));
    const R = 20 * s * s2;
    g.fillStyle(MH_MAGENTA, 0.95 * a).fillEllipse(0, 0, R * 1.9, R * 1.6); // palm
    for (let i = 0; i < 4; i++) { // fingers, curling in as it closes
      const an = -2.3 + i * 0.5, len = R * (1.3 - close * 0.6);
      g.lineStyle(7 * s, MH_MAGENTA, 0.85 * a).lineBetween(Math.cos(an) * R * 0.6, Math.sin(an) * R * 0.6, Math.cos(an) * (R * 0.6 + len), Math.sin(an) * (R * 0.6 + len) + close * R * 0.5);
    }
    g.lineStyle(6 * s, MH_MAGENTA, 0.85 * a).lineBetween(R * 0.7, R * 0.2, R * (1.4 - close * 0.5), -R * 0.2); // thumb
    g.fillStyle(MH_GLOW, 0.8 * a * close).fillCircle(0, -R * 0.1, R * 0.5);
  });
}

// ================================================================ Apisonadora (defence)
const HM_GOLD = 0xffcf3a, HM_DARK = 0x8a5a00, HM_DUST = 0xd8b88a;
export function judgementHammer(scene: S, x: number, y: number, r: number, lv: number, onSlam?: () => void) {
  const s = 1.6 + lv * 0.06;
  let slammed = false;
  play(scene, x, y, AIR + 1, 1000, (g, k) => {
    const fall = Math.min(1, k / 0.3), e = fall * fall, a = 1 - Math.max(0, k - 0.75) * 4;
    const hy = -120 * s + e * 120 * s; // the hammer head comes down from far above
    if (fall >= 1 && !slammed) { slammed = true; onSlam?.(); }
    g.lineStyle(7 * s, HM_DARK, a).lineBetween(14 * s, hy - 10 * s, 50 * s, hy - 60 * s); // the handle, slanted
    g.fillStyle(HM_GOLD, a).fillRoundedRect(-30 * s, hy - 22 * s, 60 * s, 30 * s, 6); // the head
    g.fillStyle(0xffffff, 0.45 * a).fillRect(-26 * s, hy - 19 * s, 52 * s, 5 * s);
    g.lineStyle(2, HM_DARK, a).strokeRoundedRect(-30 * s, hy - 22 * s, 60 * s, 30 * s, 6);
    if (fall >= 1) { // the stamp: a shockwave and dust round the impact
      const q = (k - 0.3) / 0.7;
      g.lineStyle(6, HM_GOLD, (1 - q) * 0.95).strokeEllipse(0, 6, r * 2.6 * (0.4 + q), r * 1.3 * (0.4 + q));
      g.lineStyle(3, 0xffffff, (1 - q) * 0.8).strokeEllipse(0, 6, r * 1.8 * (0.3 + q), r * 0.9 * (0.3 + q));
      for (let i = 0; i < 10; i++) { const an = i * 0.628, d = r * (0.4 + q * 0.9); g.fillStyle(HM_DUST, 0.6 * (1 - q)).fillCircle(Math.cos(an) * d, 6 + Math.sin(an) * d * 0.5, 5 + q * 8); }
    }
  });
}

// ================================================================ combo entry points (comboShot in ArenaScene)
export type Combo183 = 'triangulo' | 'triangulo2' | 'dragon2' | 'tornado-dd' | 'tornado-tc' | 'perseo' | 'ventisca3';
export const COMBO183: ReadonlySet<string> = new Set(['triangulo', 'triangulo2', 'dragon2', 'tornado-dd', 'tornado-tc', 'perseo', 'ventisca3']);
/** wind-up of each new combination (ms) */
export const combo183Wind = (e: Combo183) => (e === 'triangulo' || e === 'triangulo2' || e === 'tornado-tc' || e === 'perseo' ? 850 : 700);
export function combo183Charge(scene: S, e: Combo183, who: (P & { name: string })[], x: number, y: number, lv: number, ms: number) {
  if (e === 'triangulo' || e === 'triangulo2') deathZoneCharge(scene, who, x, y, 4 + lv, ms, e === 'triangulo2');
  else if (e === 'dragon2') {
    const kevin = who.find((p) => /kevin|dragonfly/i.test(p.name)) ?? who[0], axel = who.find((p) => p !== kevin) ?? kevin;
    dragonTornadoCharge(scene, kevin, axel, x, y, 4 + lv, ms);
  } else if (e === 'tornado-dd' || e === 'tornado-tc') fireTornadoCharge(scene, who, x, y, 4 + lv, ms);
  else if (e === 'perseo') perseusCharge(scene, who, x, y, 4 + lv, ms);
  else if (e === 'ventisca3') blizzardCharge(scene, who, x, y, 4 + lv, ms);
}
export function combo183Shot(scene: S, e: Combo183, ball: Img, lv: number) {
  if (e === 'triangulo' || e === 'triangulo2') deathZoneShot(scene, ball, 4 + lv, e === 'triangulo2');
  else if (e === 'dragon2') dragonTornadoShot(scene, ball, 4 + lv);
  else if (e === 'tornado-dd' || e === 'tornado-tc') fireTornadoShot(scene, ball, 4 + lv, e === 'tornado-tc');
  else if (e === 'perseo') perseusShot(scene, ball, 4 + lv);
  else if (e === 'ventisca3') blizzardShot(scene, ball, 4 + lv);
}

// ================================================================ Lluvia de meteoros (dribble, Fire)
/**
 * Lluvia de meteoros (Meteor Shower, pOuTeWCrnyM, author's link): he flips upside down and kicks the ball up through blue
 * speed lines, a burst of golden speed lines opens and orange fireballs rain on the rivals ahead.
 */
const MS_FIRE = 0xff7a1a, MS_GOLD = 0xffd27a, MS_CORE = 0xfff4c0, MS_BLUE = 0x3a7ad8;
export const isMeteorShower = (name: string) => /lluvia de meteoros|meteor ?shower/i.test(name);
export function meteorShower(scene: S, x: number, y: number, tx: number, ty: number, lv: number, ms = 520) {
  play(scene, x, y - 14, AIR + 1, ms * 0.6, (g, k, t) => { // the flip: blue streaks round him and the ball going up
    const a = 1 - k;
    for (let i = 0; i < 6; i++) { const xx = -20 + i * 8; g.lineStyle(2, MS_BLUE, 0.6 * a).lineBetween(xx, -40 + ((t * 300 + i * 13) % 40), xx, 10); }
    g.fillStyle(0xffffff, a).fillCircle(0, -12 - k * 40, 4);
  }, true);
  play(scene, (x + tx) / 2, (y + ty) / 2 - 30, AIR + 2, ms * 0.5, (g, k) => { // the golden burst of speed lines
    const a = 1 - k;
    for (let i = 0; i < 18; i++) { const an = i * 0.349, r0 = 8 + k * 10, r1 = 30 + k * 60; g.lineStyle(3, i % 2 ? MS_GOLD : MS_FIRE, 0.75 * a).lineBetween(Math.cos(an) * r0, Math.sin(an) * r0, Math.cos(an) * r1, Math.sin(an) * r1); }
    g.fillStyle(MS_CORE, 0.85 * a).fillCircle(0, 0, 10 + k * 8);
  }, true);
  const n = 5 + Math.floor(lv / 2);
  for (let i = 0; i < n; i++) scene.time.delayedCall(ms * 0.25 + i * 60, () => { // the fireballs falling on the area ahead
    const ex = tx + (Math.random() - 0.5) * 70, ey = ty + (Math.random() - 0.5) * 40;
    play(scene, ex, ey, AIR + 2, 420, (g, k) => {
      const fall = Math.min(1, k / 0.55), fx = -40 * (1 - fall), fy = -90 * (1 - fall);
      if (fall < 1) {
        tail(g, fx, fy, Math.atan2(90, 40), 34, 5, MS_FIRE, 0.7);
        g.fillStyle(MS_GOLD, 0.95).fillCircle(fx, fy, 5); g.fillStyle(MS_CORE, 1).fillCircle(fx, fy, 2.5);
      } else {
        const q = (k - 0.55) / 0.45;
        g.fillStyle(MS_FIRE, 0.6 * (1 - q)).fillCircle(0, 0, 6 + q * 14);
        g.lineStyle(2, MS_GOLD, 1 - q).strokeCircle(0, 0, 8 + q * 18);
      }
    }, true);
  });
}

// ================================================================ Furia de Oso (Aiden, Hissatsu Kuma Goroshi Zan)
/**
 * 1.87 (author, Ugffz5OsnEc 1:46-1:56, watched frame by frame): a red-pink aura in his raised hand, flame claws of red and
 * pink tearing across, the kick in an arc of fire, the ball glowing red; at the impact the screen goes red with a huge X
 * of light beams, a dark bear silhouette with burning red eyes rises behind it, and the kanji 斬 (cut) is stamped on top.
 */
const BR_RED = 0xe0103a, BR_PINK = 0xff7ad8, BR_WHITE = 0xfff0f6, BR_DARK = 0x1a0006;
/** a flame claw: three curved tongues of fire */
function flameClaw(g: G, x: number, y: number, ang: number, len: number, a: number) {
  for (let i = -1; i <= 1; i++) {
    const c = Math.cos(ang), s = Math.sin(ang), nx = -s, ny = c, o = i * len * 0.18;
    const x0 = x + nx * o - c * len * 0.5, y0 = y + ny * o - s * len * 0.5, x1 = x + nx * (o + len * 0.12) + c * len * 0.5, y1 = y + ny * (o + len * 0.12) + s * len * 0.5;
    g.lineStyle(len * 0.16, BR_RED, 0.85 * a).beginPath().moveTo(x0, y0).lineTo((x0 + x1) / 2 + nx * len * 0.12, (y0 + y1) / 2 + ny * len * 0.12).lineTo(x1, y1).strokePath();
    g.lineStyle(len * 0.06, BR_PINK, a).beginPath().moveTo(x0, y0).lineTo((x0 + x1) / 2 + nx * len * 0.12, (y0 + y1) / 2 + ny * len * 0.12).lineTo(x1, y1).strokePath();
  }
}
/** the bear: a dark silhouette (head, ears, open jaws, shoulders) with red eyes */
function bearSilhouette(g: G, s: number, a: number) {
  g.fillStyle(BR_DARK, 0.9 * a);
  g.fillEllipse(0, 18 * s, 120 * s, 80 * s); // shoulders
  g.fillCircle(0, -14 * s, 34 * s); // head
  g.fillCircle(-26 * s, -40 * s, 11 * s).fillCircle(26 * s, -40 * s, 11 * s); // ears
  g.fillEllipse(0, 4 * s, 40 * s, 30 * s); // snout
  g.fillStyle(BR_RED, 0.95 * a).fillTriangle(-12 * s, 6 * s, 12 * s, 6 * s, 0, 22 * s); // open jaws
  g.fillStyle(BR_WHITE, a).fillTriangle(-9 * s, 6 * s, -5 * s, 6 * s, -7 * s, 12 * s).fillTriangle(5 * s, 6 * s, 9 * s, 6 * s, 7 * s, 12 * s); // fangs
  g.fillStyle(0xff2a2a, a).fillCircle(-12 * s, -20 * s, 3.4 * s).fillCircle(12 * s, -20 * s, 3.4 * s); // eyes
  g.fillStyle(0xffd0d0, a).fillCircle(-12 * s, -20 * s, 1.4 * s).fillCircle(12 * s, -20 * s, 1.4 * s);
  g.lineStyle(2, BR_RED, 0.7 * a).strokeCircle(0, -14 * s, 34 * s);
}
export function bearCharge(scene: S, x: number, y: number, lv: number, ms: number) {
  play(scene, x + 6, y - 22, AIR + 1, ms, (g, k, t) => { // the aura in his raised hand
    const r = (6 + lv * 0.5) * Math.min(1, k * 2.5);
    g.fillStyle(BR_RED, 0.5).fillCircle(0, 0, r * 2.2);
    g.fillStyle(BR_PINK, 0.85).fillCircle(0, 0, r * 1.2 + Math.sin(t * 20));
    g.fillStyle(BR_WHITE, 0.9).fillCircle(0, 0, r * 0.5);
  }, true);
  play(scene, x, y - 14, AIR + 2, ms, (g, k) => { // the flame claws tearing across, twice
    for (const [at, ang] of [[0.3, -0.6], [0.55, 0.5]] as const) {
      const q = (k - at) / 0.3;
      if (q < 0 || q > 1) continue;
      flameClaw(g, (q - 0.5) * 30, 0, ang, 46 + lv * 2, 1 - Math.abs(q - 0.5) * 1.6);
    }
  });
}
export function bearShot(scene: S, ball: Img, lv: number) {
  const r = 10 + lv * 0.6;
  ride(scene, ball, (g, bx, by, ang, t) => { // the ball red-hot in a tongue of red and pink fire
    const len = 90 + lv * 4;
    tail(g, bx, by, ang, len, r * 1.8, BR_RED, 0.55);
    tail(g, bx, by, ang, len * 0.7, r * 0.9, BR_PINK, 0.8);
    g.fillStyle(BR_RED, 0.6).fillCircle(bx, by, r * 1.6 + Math.sin(t * 18) * 1.5);
    g.fillStyle(BR_WHITE, 0.95).fillCircle(bx, by, r * 0.8);
  }, (x, y) => { // the cut: red flash, the X, the bear behind, 斬
    const R = 70 + lv * 4;
    play(scene, x, y, AIR + 3, 900, (g, k) => {
      const a = k < 0.15 ? k / 0.15 : 1 - Math.max(0, k - 0.7) / 0.3;
      g.fillStyle(0x5a0010, 0.55 * a).fillCircle(0, 0, R * 1.9);
      g.fillStyle(BR_RED, 0.5 * a).fillCircle(0, 0, R * 1.4);
      bearSilhouette(g, (R / 60) * (0.9 + k * 0.15), a);
      const w = R * 1.9 * Math.min(1, k * 4);
      for (const sg of [1, -1]) { g.lineStyle(9, BR_RED, 0.6 * a).lineBetween(-w, -w * 0.6 * sg, w, w * 0.6 * sg); g.lineStyle(3, BR_WHITE, a).lineBetween(-w, -w * 0.6 * sg, w, w * 0.6 * sg); }
      g.fillStyle(BR_WHITE, a).fillCircle(0, 0, 9 + lv * 0.4);
      for (let i = 0; i < 12; i++) { const an = i * 0.524 + k; g.lineStyle(2, BR_PINK, 0.6 * a).lineBetween(Math.cos(an) * R * 0.3, Math.sin(an) * R * 0.3, Math.cos(an) * R * (0.6 + k), Math.sin(an) * R * (0.6 + k)); }
    });
    const kanji = scene.add.text(x, y - 4, '斬', { fontFamily: 'serif', fontSize: `${Math.round(R * 0.9)}px`, color: '#ff2a5a', stroke: '#fff0f6', strokeThickness: 4 }).setOrigin(0.5).setDepth(AIR + 4).setScale(1.8).setAlpha(0);
    scene.tweens.add({ targets: kanji, scale: 1, alpha: 1, duration: 180, delay: 140, ease: 'Back.easeOut', onComplete: () => scene.tweens.add({ targets: kanji, alpha: 0, duration: 400, delay: 380, onComplete: () => kanji.destroy() }) });
  });
}
