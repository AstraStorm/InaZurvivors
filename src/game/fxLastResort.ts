/**
 * The Último recurso family (author; scenes in youtube J76gfn1Cbxs, watched frame by frame in the author's browser;
 * inazuma.fandom «Último recurso», «Último recurso: Dragón», «Último recurso: Sigma»).
 *
 *   - Último recurso (1:00, Asuto, Nosaka, Haizaki): a lilac-and-pink whirl round the first player, a red streak strikes the
 *     ball down onto the pitch where it glows as a cyan orb; a spiral wraps it, pink-white inside and orange fire outside;
 *     the last kick crackles with violet lightning; the ball flies as a pink-violet orb and the rocks it tears up follow it
 *     as a dragon of stone.
 *   - Último recurso: Dragón (1:31, Petronio): a dark violet aura rises round him first; the same strike and orb, the spiral
 *     magenta and violet; out comes a huge dragon of dark violet rock full of holes, a pink glowing outline, a blue eye and
 *     fanged jaws with white light inside.
 *   - Último recurso Σ (1:52, with Hikaru): the spiral crimson and cyan, a golden Σ over the kick, and four dragons fly with
 *     the ball — cyan, green, yellow and pink — trailing bands of their colour.
 * Visual only: the damage is the combined shot's (ArenaScene.comboShot).
 */
import Phaser from 'phaser';
import { canvasTex } from './fxKeshin';
import { bolt, play, ride, sparks } from './fxMovie';

type S = Phaser.Scene;
type Img = Phaser.GameObjects.Image;
type G = Phaser.GameObjects.Graphics;
type P = { x: number; y: number };
export type LastResort = 'ultimo-recurso' | 'ultimo-recurso-sigma' | 'ultimo-recurso-dragon';
const AIR = 8900;
const CYAN = 0x5ae8ff, CYAN2 = 0xd8fbff, PINK = 0xff7ad8, LILAC = 0xd8b8ff, VIOLET = 0x8a3aff, DEEP = 0x2a0a4a, MAGENTA = 0xe03aff;
const FIRE = 0xff8a3a, FIRE2 = 0xffc26a, ROCK = 0x8a6040, GOLD = 0xffd23a, CRIMSON = 0xd81a3a;
const SIGMA = [0x4af0ff, 0x5aff7a, 0xffd23a, 0xff5aa8];
export const LAST_RESORT_WIND = 1050;

/** the spiral colours round the orb: inner and outer */
const SPIRAL: Record<LastResort, [number, number]> = { 'ultimo-recurso': [PINK, FIRE], 'ultimo-recurso-dragon': [MAGENTA, VIOLET], 'ultimo-recurso-sigma': [CYAN, CRIMSON] };

/**
 * The dragons, one drawing for the three, each with the look of its scene:
 *   - 'rock' (Último recurso, 1:08): brown stone, dark cracks, jagged stones along the back, the violet orb's light in the eye;
 *   - 'dark' (Dragón, 1:43): violet rock pitted with black holes, a glowing pink outline, a mane of dark flame, a blue eye;
 *   - 'crystal' (Σ, 2:04): cyan, green, yellow or pink crystal with a white edge, light facets and sharp spikes.
 * The head is drawn once per look on a 320×200 canvas facing right, the ball in the jaws at (205, 128).
 */
type Look = 'rock' | 'dark' | 'crystal';
interface Pal { key: string; look: Look; dark: string; mid: string; edge: string; glow: string | null; mark: string; eye: string; eyeGlow: string; mouth: string;
  /** the same colours as numbers, for the body drawn on the pitch */ nDark: number; nMid: number; nEdge: number; nGlow: number | null; nMark: number }
const hex = (n: number) => `#${n.toString(16).padStart(6, '0')}`;
const shade = (n: number, f: number) => ((Math.round(((n >> 16) & 255) * f) << 16) | (Math.round(((n >> 8) & 255) * f) << 8) | Math.round((n & 255) * f));
const pal = (key: string, look: Look, dark: number, mid: number, edge: number, glow: number | null, mark: number, eye: string, eyeGlow: string, mouth: string): Pal =>
  ({ key, look, dark: hex(dark), mid: hex(mid), edge: hex(edge), glow: glow === null ? null : hex(glow), mark: hex(mark), eye, eyeGlow, mouth, nDark: dark, nMid: mid, nEdge: edge, nGlow: glow, nMark: mark });
const ROCK_PAL = pal('rock', 'rock', 0x5a3a22, 0x93683f, 0x24140a, null, 0x2a160a, '#e0a8ff', '#b05aff', '#ff9ae8');
const DARK_PAL = pal('dark', 'dark', 0x24083e, 0x3e1466, 0xff8af0, 0xe05aff, 0x08020f, '#7ae0ff', '#5ac8ff', '#a03ae0');
const crystalPal = (c: number) => pal(`crystal-${c.toString(16)}`, 'crystal', shade(c, 0.5), c, 0xffffff, c, shade(c, 0.35) | 0, '#ffffff', hex(c), hex(c));

function drawDragonHead(c: CanvasRenderingContext2D, p: Pal) {
  c.lineJoin = p.look === 'crystal' ? 'miter' : 'round'; c.lineCap = 'round';
  const glow = (blur: number) => { if (p.glow) { c.shadowColor = p.glow; c.shadowBlur = blur; } };
  const edgeW = p.look === 'rock' ? 3 : 3.5;
  // the mane swept back from the skull: flames (dark), stones (rock) or crystal spikes
  const mane = [[70, 70, 4, 18], [100, 60, 22, 6], [128, 58, 50, 4], [150, 60, 78, 14], [60, 92, 2, 70], [44, 112, 0, 104]];
  for (const [x, y, tx, ty] of mane) {
    c.beginPath(); c.moveTo(x - 14, y + 12);
    if (p.look === 'dark') { c.quadraticCurveTo((x + tx) / 2 - 10, (y + ty) / 2 - 10, tx, ty); c.quadraticCurveTo((x + tx) / 2 + 6, (y + ty) / 2 + 4, x + 16, y + 6); }
    else if (p.look === 'rock') { c.lineTo((x + tx) / 2 - 8, (y + ty) / 2 - 4); c.lineTo(tx + 10, ty + 6); c.lineTo((x + tx) / 2 + 8, (y + ty) / 2 + 6); c.lineTo(x + 16, y + 6); }
    else { c.lineTo(tx, ty); c.lineTo(x + 12, y + 4); }
    c.closePath();
    c.fillStyle = p.look === 'crystal' ? p.mid : p.dark; glow(14); c.fill(); c.shadowBlur = 0; c.lineWidth = 2.5; c.strokeStyle = p.edge; c.stroke();
  }
  // the skull and the upper jaw, the long snout ending in a hooked nose
  c.beginPath(); c.moveTo(22, 132); c.quadraticCurveTo(26, 78, 80, 66); c.quadraticCurveTo(140, 52, 178, 68);
  c.quadraticCurveTo(250, 76, 302, 96); c.quadraticCurveTo(314, 102, 304, 112); c.lineTo(286, 112);
  c.quadraticCurveTo(220, 104, 150, 114); c.quadraticCurveTo(120, 118, 100, 128); c.quadraticCurveTo(60, 140, 22, 132); c.closePath();
  const sk = c.createLinearGradient(0, 60, 0, 130); sk.addColorStop(0, p.look === 'dark' ? p.mid : p.look === 'crystal' ? '#ffffff' : p.mid); sk.addColorStop(p.look === 'crystal' ? 0.25 : 0, p.mid); sk.addColorStop(1, p.dark);
  c.fillStyle = sk; glow(18); c.fill(); c.shadowBlur = 0; c.lineWidth = edgeW; c.strokeStyle = p.edge; c.stroke();
  // the lower jaw hanging open
  c.beginPath(); c.moveTo(40, 150); c.quadraticCurveTo(110, 136, 160, 146); c.quadraticCurveTo(230, 156, 286, 178);
  c.quadraticCurveTo(292, 186, 280, 190); c.quadraticCurveTo(200, 184, 130, 176); c.quadraticCurveTo(70, 172, 40, 150); c.closePath();
  c.fillStyle = p.dark; glow(14); c.fill(); c.shadowBlur = 0; c.lineWidth = edgeW; c.strokeStyle = p.edge; c.stroke();
  // the mouth: white light inside, the orb's colour at the edges
  c.beginPath(); c.moveTo(100, 128); c.quadraticCurveTo(200, 106, 290, 114); c.quadraticCurveTo(250, 150, 282, 178); c.quadraticCurveTo(190, 150, 110, 150); c.closePath();
  const m = c.createRadialGradient(205, 128, 4, 205, 128, 100); m.addColorStop(0, '#ffffff'); m.addColorStop(0.35, '#fff0ff'); m.addColorStop(1, p.mouth);
  c.fillStyle = m; c.fill();
  // fangs: jagged, the long ones at the front
  c.fillStyle = p.look === 'rock' ? '#f0e4cc' : '#fff8ff'; c.strokeStyle = p.look === 'rock' ? p.edge : p.glow ?? p.edge; c.lineWidth = 1.5;
  for (let i = 0; i < 9; i++) { const x = 118 + i * 19, y = 112 - i * 0.2 + (i > 6 ? 2 : 0), L = 12 + (i % 2) * 6 + (i > 6 ? 8 : 0);
    c.beginPath(); c.moveTo(x, y); c.lineTo(x + 11, y); c.lineTo(x + 6, y + L); c.closePath(); c.fill(); c.stroke(); }
  for (let i = 0; i < 8; i++) { const x = 122 + i * 19, y = 150 + i * 3.3, L = 11 + (i % 2) * 6;
    c.beginPath(); c.moveTo(x, y); c.lineTo(x + 11, y + 1); c.lineTo(x + 6, y - L); c.closePath(); c.fill(); c.stroke(); }
  // the marks of the material: holes (dark), cracks (rock), light facets (crystal)
  const spots = [[52, 104, 9, 6], [78, 88, 6, 4], [118, 76, 7, 4], [92, 116, 5, 4], [140, 92, 5, 3], [66, 126, 6, 4], [232, 88, 5, 3], [86, 160, 6, 3], [60, 150, 4, 3]];
  if (p.look === 'dark') { c.fillStyle = p.mark; for (const [x, y, rx, ry] of spots) { c.beginPath(); c.ellipse(x, y, rx, ry, -0.2, 0, Math.PI * 2); c.fill(); } }
  else if (p.look === 'rock') {
    c.strokeStyle = p.mark; c.lineWidth = 2.2;
    for (const [x, y, rx] of spots) { c.beginPath(); c.moveTo(x - rx * 1.4, y - 2); c.lineTo(x - rx * 0.3, y + 3); c.lineTo(x + rx * 0.4, y - 3); c.lineTo(x + rx * 1.5, y + 2); c.stroke(); }
  } else {
    c.strokeStyle = 'rgba(255,255,255,0.75)'; c.lineWidth = 2.5;
    for (const [x0, y0, x1, y1] of [[60, 96, 120, 74], [140, 70, 220, 82], [70, 120, 110, 110], [230, 92, 290, 102], [80, 162, 160, 168]]) { c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke(); }
  }
  // the eye, shining
  c.beginPath(); c.moveTo(168, 84); c.quadraticCurveTo(186, 72, 204, 80); c.quadraticCurveTo(186, 92, 168, 84); c.closePath();
  c.fillStyle = p.eye; c.shadowColor = p.eyeGlow; c.shadowBlur = 16; c.fill(); c.shadowBlur = 0;
  c.beginPath(); c.ellipse(190, 81, 4, 3, 0, 0, Math.PI * 2); c.fillStyle = p.look === 'crystal' ? p.mid : '#ffffff'; c.fill();
}
const dragonHeadTex = (scene: S, p: Pal) => canvasTex(scene, `lr-dragon-${p.key}${p.look === 'rock' ? '-earth' : ''}`, 320, 200, (c) => (p.look === 'rock' ? drawEarthHead(c) : drawDragonHead(c, p)));

/** deterministic noise in [0, 1) */
const hash = (n: number) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const EARTH = ['#7a5434', '#93683f', '#a87a4a', '#6a4528', '#b88a58'];
const EARTH_N = [0x7a5434, 0x93683f, 0xa87a4a, 0x6a4528, 0xb88a58];

/** Último recurso (1:08): the dragon's head made of loose chunks of earth with gaps between them, the light of the jaws
 *  behind, stone fangs and a violet eye; the same silhouette and size as the other heads */
function drawEarthHead(c: CanvasRenderingContext2D) {
  c.lineJoin = 'round';
  const skull = () => { c.beginPath(); c.moveTo(22, 132); c.quadraticCurveTo(26, 78, 80, 66); c.quadraticCurveTo(140, 52, 178, 68);
    c.quadraticCurveTo(250, 76, 302, 96); c.quadraticCurveTo(314, 102, 304, 112); c.lineTo(286, 112);
    c.quadraticCurveTo(220, 104, 150, 114); c.quadraticCurveTo(120, 118, 100, 128); c.quadraticCurveTo(60, 140, 22, 132); c.closePath(); };
  const jaw = () => { c.beginPath(); c.moveTo(40, 150); c.quadraticCurveTo(110, 136, 160, 146); c.quadraticCurveTo(230, 156, 286, 178);
    c.quadraticCurveTo(292, 186, 280, 190); c.quadraticCurveTo(200, 184, 130, 176); c.quadraticCurveTo(70, 172, 40, 150); c.closePath(); };
  // the light of the jaws, behind everything
  c.beginPath(); c.moveTo(100, 128); c.quadraticCurveTo(200, 106, 290, 114); c.quadraticCurveTo(250, 150, 282, 178); c.quadraticCurveTo(190, 150, 110, 150); c.closePath();
  const m = c.createRadialGradient(205, 128, 4, 205, 128, 100); m.addColorStop(0, '#ffffff'); m.addColorStop(0.35, '#ffe8fa'); m.addColorStop(1, 'rgba(255,140,230,0.6)');
  c.fillStyle = m; c.fill();
  // a chunk: an irregular polygon, a lighter face on top, a dark edge
  const chunk = (x: number, y: number, r: number, seed: number) => {
    const nv = 5 + Math.floor(hash(seed) * 3);
    c.beginPath();
    for (let v = 0; v < nv; v++) {
      const a = v / nv * Math.PI * 2 + hash(seed + v) * 0.6, rr = r * (0.7 + hash(seed + v * 7) * 0.45);
      if (v) c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); else c.moveTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
    }
    c.closePath(); c.fillStyle = EARTH[Math.floor(hash(seed * 3) * EARTH.length)]; c.fill(); c.lineWidth = 4; c.strokeStyle = '#24140a'; c.stroke();
    c.beginPath(); c.ellipse(x - r * 0.2, y - r * 0.3, r * 0.4, r * 0.18, -0.3, 0, Math.PI * 2); c.fillStyle = 'rgba(255,230,190,0.25)'; c.fill();
  };
  // the chunks fill the skull and the jaw, with gaps between them
  const areas: [() => void, number, number, number, number][] = [[skull, 20, 50, 312, 136], [jaw, 36, 134, 292, 192]];
  for (const [path, x0, y0, x1, y1] of areas) {
    c.save(); path(); c.clip();
    let n = 0;
    for (let y = y0 + 6; y < y1 + 10; y += 24) for (let x = x0 + (Math.round(y / 24) % 2) * 14; x < x1 + 10; x += 28) { n++; chunk(x + (hash(n) - 0.5) * 8, y + (hash(n + 50) - 0.5) * 8, 15 + hash(n + 99) * 5, n * 13 + y); }
    c.restore();
  }
  // the mane: shards of stone swept back
  for (const [x, y, tx, ty] of [[70, 70, 4, 18], [100, 60, 22, 6], [128, 58, 50, 4], [150, 60, 78, 14], [60, 92, 2, 70], [44, 112, 0, 104]]) {
    c.beginPath(); c.moveTo(x - 12, y + 10); c.lineTo((x + tx) / 2 - 6, (y + ty) / 2 - 2); c.lineTo(tx, ty); c.lineTo((x + tx) / 2 + 8, (y + ty) / 2 + 6); c.lineTo(x + 14, y + 6); c.closePath();
    c.fillStyle = EARTH[(x + y) % EARTH.length]; c.fill(); c.lineWidth = 2.2; c.strokeStyle = '#24140a'; c.stroke();
  }
  // stone fangs
  c.fillStyle = '#e8d8b8'; c.strokeStyle = '#24140a'; c.lineWidth = 1.5;
  for (let i = 0; i < 9; i++) { const x = 118 + i * 19, y = 112, L = 12 + (i % 2) * 6 + (i > 6 ? 8 : 0); c.beginPath(); c.moveTo(x, y); c.lineTo(x + 11, y); c.lineTo(x + 6, y + L); c.closePath(); c.fill(); c.stroke(); }
  for (let i = 0; i < 8; i++) { const x = 122 + i * 19, y = 150 + i * 3.3, L = 11 + (i % 2) * 6; c.beginPath(); c.moveTo(x, y); c.lineTo(x + 11, y + 1); c.lineTo(x + 6, y - L); c.closePath(); c.fill(); c.stroke(); }
  // the eye, glowing violet with the orb's light
  c.beginPath(); c.moveTo(168, 84); c.quadraticCurveTo(186, 72, 204, 80); c.quadraticCurveTo(186, 92, 168, 84); c.closePath();
  c.fillStyle = '#e0a8ff'; c.shadowColor = '#b05aff'; c.shadowBlur = 16; c.fill(); c.shadowBlur = 0;
}

/** the body of the earth dragon: loose chunks of earth along the spine, each tumbling a little, stone shards on its back,
 *  dust trailing behind and pebbles falling off */
function earthBody(g: G, spine: P[], k: number, t: number, size: number, up: number) {
  const n = spine.length;
  if (n < 3) return;
  const poly = (x: number, y: number, r: number, seed: number, rot: number) => {
    const nv = 5 + Math.floor(hash(seed) * 3), pts: P[] = [];
    for (let v = 0; v < nv; v++) { const a = rot + v / nv * Math.PI * 2 + hash(seed + v) * 0.6, rr = r * (0.7 + hash(seed + v * 7) * 0.45); pts.push({ x: x + Math.cos(a) * rr, y: y + Math.sin(a) * rr }); }
    return pts;
  };
  // dust trailing behind
  for (let i = 0; i < n; i += 2) { const q = i / (n - 1); g.fillStyle(0xd8b888, 0.22 * (1 - q * 0.5)).fillCircle(spine[i].x, spine[i].y + 4, (6 + (1 - q) * 10) * k * size); }
  for (let i = 0; i < n; i++) {
    const q = i / (n - 1), a = spine[Math.max(0, i - 1)], b = spine[Math.min(n - 1, i + 1)], l = Math.hypot(b.x - a.x, b.y - a.y) || 1;
    const nx = -(b.y - a.y) / l, ny = (b.x - a.x) / l, w = (2 + Math.pow(q, 0.7) * 12) * k * size;
    // two or three chunks across the body at this point, plus a shard on the back every other point
    const across = q > 0.3 ? 3 : 2;
    for (let j = 0; j < across; j++) {
      const seed = i * 17 + j * 5, off = (j / (across - 1) - 0.5) * w * 1.3, r = Math.min(7.5 * k * size, w * (0.45 + hash(seed) * 0.2) + 1.5);
      const cx = spine[i].x + nx * off + (hash(seed + 3) - 0.5) * 3, cy = spine[i].y + ny * off + (hash(seed + 4) - 0.5) * 3;
      const pts = poly(cx, cy, r, seed, t * (hash(seed + 9) - 0.5) * 3);
      g.fillStyle(EARTH_N[Math.floor(hash(seed * 3) * EARTH_N.length)], 1).fillPoints(pts, true);
      g.lineStyle(1.6, 0x24140a, 0.95).strokePoints(pts, true);
    }
    if (i % 2 === 0 && i > 1 && i < n - 1) {
      const L = w * 1.1, bx = spine[i].x + nx * up * w, by = spine[i].y + ny * up * w, tx = (b.x - a.x) / l, ty = (b.y - a.y) / l;
      const x3 = bx + nx * up * L - tx * L * 0.7, y3 = by + ny * up * L - ty * L * 0.7;
      g.fillStyle(0x6a4528, 1).fillTriangle(bx - tx * w * 0.5, by - ty * w * 0.5, bx + tx * w * 0.4, by + ty * w * 0.4, x3, y3);
      g.lineStyle(1.5, 0x24140a, 0.95).strokeTriangle(bx - tx * w * 0.5, by - ty * w * 0.5, bx + tx * w * 0.4, by + ty * w * 0.4, x3, y3);
    }
  }
  // pebbles falling off the tail
  for (let j = 0; j < 6; j++) {
    const i = Math.floor(hash(j + Math.floor(t * 6)) * n * 0.6), f = (t * 3 + j * 0.37) % 1, p = spine[i];
    g.fillStyle(0x6a4528, 1 - f).fillRect(p.x + (hash(j) - 0.5) * 10, p.y + f * 14 * k, 3, 2.5);
  }
}

/** a dragon's body: one tapering ribbon along the spine (tail → head) with its material's marks, its edge and spikes along
 *  the back (flames, stones or crystal); `size` scales its thickness */
function dragonBody(g: G, spine: P[], k: number, t: number, p: Pal, size = 1, up = 1) {
  const n = spine.length;
  if (n < 3) return;
  const left: P[] = [], right: P[] = [], nrm: P[] = [], wid: number[] = [];
  for (let i = 0; i < n; i++) {
    const a = spine[Math.max(0, i - 1)], b = spine[Math.min(n - 1, i + 1)], l = Math.hypot(b.x - a.x, b.y - a.y) || 1;
    const nx = -(b.y - a.y) / l, ny = (b.x - a.x) / l, q = i / (n - 1), w = (2 + Math.pow(q, 0.7) * 12) * k * size;
    nrm.push({ x: nx, y: ny }); wid.push(w);
    left.push({ x: spine[i].x + nx * w, y: spine[i].y + ny * w }); right.push({ x: spine[i].x - nx * w, y: spine[i].y - ny * w });
  }
  const outline = [...left, ...[...right].reverse()];
  // the spikes along its back
  for (let i = 2; i < n - 1; i += 2) {
    const q = i / (n - 1), flick = p.look === 'dark' ? Math.sin(t * 18 + i * 1.9) * 0.3 : 0, L = wid[i] * ((p.look === 'crystal' ? 1.3 : 0.9) + flick);
    const s = spine[i], d = spine[i - 1], bl = Math.hypot(s.x - d.x, s.y - d.y) || 1, back = p.look === 'crystal' ? 0.5 : 0.8;
    const side = up > 0 ? left : right, sx = nrm[i].x * up, sy = nrm[i].y * up;
    const tipX = side[i].x + sx * L - (s.x - d.x) / bl * L * back, tipY = side[i].y + sy * L - (s.y - d.y) / bl * L * back;
    g.fillStyle(p.look === 'crystal' ? p.nMid : p.nDark, 0.95).fillTriangle(side[i - 1].x, side[i - 1].y, side[i + 1].x, side[i + 1].y, tipX, tipY);
    g.lineStyle(1.5, p.nEdge, 0.8 * q + 0.2).strokeTriangle(side[i - 1].x, side[i - 1].y, side[i + 1].x, side[i + 1].y, tipX, tipY);
  }
  if (p.nGlow !== null) g.fillStyle(p.nGlow, 0.3).fillPoints(outline.map((pt, i) => { const j = i < n ? i : 2 * n - 1 - i, c = spine[j]; return { x: c.x + (pt.x - c.x) * 1.35, y: c.y + (pt.y - c.y) * 1.35 }; }), true);
  g.fillStyle(p.nDark, 1).fillPoints(outline, true);
  // a lighter band along the back
  for (let i = 1; i < n; i++) g.lineStyle(wid[i] * (p.look === 'crystal' ? 0.8 : 0.5), p.nMid, 0.95).lineBetween(spine[i - 1].x + nrm[i - 1].x * wid[i - 1] * 0.3, spine[i - 1].y + nrm[i - 1].y * wid[i - 1] * 0.3, spine[i].x + nrm[i].x * wid[i] * 0.3, spine[i].y + nrm[i].y * wid[i] * 0.3);
  // the marks of its material
  for (let i = 2; i < n - 1; i += 2) {
    const side = (i % 4 ? 0.4 : -0.35) * wid[i], cx = spine[i].x + nrm[i].x * side, cy = spine[i].y + nrm[i].y * side, s = spine[i], d = spine[i - 1], bl = Math.hypot(s.x - d.x, s.y - d.y) || 1, tx = (s.x - d.x) / bl, ty = (s.y - d.y) / bl;
    if (p.look === 'dark') g.fillStyle(p.nMark, 0.95).fillEllipse(cx, cy, wid[i] * 0.55, wid[i] * 0.35);
    else if (p.look === 'rock') g.lineStyle(1.6, p.nMark, 0.9).beginPath().moveTo(cx - tx * wid[i] * 0.5, cy - ty * wid[i] * 0.5).lineTo(cx + nrm[i].x * 2, cy + nrm[i].y * 2).lineTo(cx + tx * wid[i] * 0.5, cy + ty * wid[i] * 0.5).strokePath();
    else g.lineStyle(1.5, 0xffffff, 0.7).lineBetween(cx - tx * wid[i] * 0.6, cy - ty * wid[i] * 0.6, cx + tx * wid[i] * 0.6 + nrm[i].x * 3, cy + ty * wid[i] * 0.6 + nrm[i].y * 3);
  }
  g.lineStyle(p.look === 'rock' ? 2.2 : 2, p.nEdge, 0.95).strokePoints(left).strokePoints(right);
}

/** a spiral of `arms` flame-like ribbons round (0,0), turning: thin at the centre, wide and ragged at the edge */
function spiral(g: G, r: number, t: number, color: number, alpha: number, arms = 3, dir = 1) {
  const pt = (a: number, q: number) => { const an = dir * (t * 5 + a * (Math.PI * 2 / arms) + q * 4.2), rr = r * (0.2 + q); return [Math.cos(an) * rr, Math.sin(an) * rr * 0.62]; };
  for (let a = 0; a < arms; a++) {
    let [px, py] = pt(a, 0);
    for (let i = 1; i <= 26; i++) {
      const q = i / 26, [x, y] = pt(a, q), ragged = 1 + Math.sin(i * 2.7 + t * 20) * 0.25;
      g.lineStyle((1.5 + q * 9 * ragged) * (r / 60), color, alpha * (1 - q * 0.45)).lineBetween(px, py, x, y);
      px = x; py = y;
    }
  }
}

/** the golden Σ */
function sigmaGlyph(g: G, x: number, y: number, s: number, a: number) {
  g.lineStyle(5 * s, 0x8a5a00, a).beginPath().moveTo(x + 14 * s, y - 18 * s).lineTo(x - 12 * s, y - 18 * s).lineTo(x + 2 * s, y).lineTo(x - 12 * s, y + 18 * s).lineTo(x + 14 * s, y + 18 * s).strokePath();
  g.lineStyle(3 * s, GOLD, a).beginPath().moveTo(x + 14 * s, y - 18 * s).lineTo(x - 12 * s, y - 18 * s).lineTo(x + 2 * s, y).lineTo(x - 12 * s, y + 18 * s).lineTo(x + 14 * s, y + 18 * s).strokePath();
}

export function lastResortCharge(scene: S, kind: LastResort, who: P[], x: number, y: number, lv: number, ms: number) {
  const k = 1 + lv * 0.05, [inner, outer] = SPIRAL[kind], first = who[0] ?? { x, y };
  // the Dragón: Petronio's dark violet aura rises first, rocks lifting round him
  if (kind === 'ultimo-recurso-dragon') play(scene, first.x, first.y, AIR - 1, ms * 0.55, (g, u, t) => {
    const a = u > 0.75 ? (1 - u) / 0.25 : Math.min(1, u * 5);
    for (let n = 0; n < 9; n++) {
      const fx = (n - 4) * 5 * k, L = (34 + Math.sin(t * 14 + n * 1.7) * 10) * k;
      g.fillStyle(n % 2 ? VIOLET : DEEP, 0.75 * a).fillTriangle(fx - 6 * k, 2, fx + 6 * k, 2, fx + Math.sin(t * 8 + n) * 4, -L);
    }
    for (let n = 0; n < 5; n++) g.fillStyle(ROCK, a).fillRect(Math.cos(n * 1.3) * 22 * k, -10 - u * 30 * k - n * 4, 4, 3);
  });
  // a lilac-and-pink whirl round the first player
  play(scene, first.x, first.y - 12, AIR - 1, ms * 0.35, (g, u, t) => {
    const a = 1 - u;
    spiral(g, (20 + u * 16) * k, t, LILAC, 0.7 * a, 3);
    g.fillStyle(0xffffff, 0.6 * a).fillCircle(0, 0, 8 * k);
  }, true);
  // a red streak strikes the ball down onto the pitch, where it glows as a cyan orb; the spiral wraps it
  play(scene, x, y, AIR, ms + 120, (g, u, t) => {
    if (u > 0.18 && u < 0.36) { const q = (u - 0.18) / 0.18; g.lineStyle(4 * k, 0xff3a3a, 0.9).lineBetween(0, -90 * k * (1 - q) - 10, 0, 0); }
    if (u < 0.3) return;
    const w = Math.min(1, (u - 0.3) / 0.25), R = (24 + w * 22) * k;
    spiral(g, R * 1.5, t, outer, 0.75 * w, 3);
    spiral(g, R, t * 1.3, inner, 0.85 * w, 3);
    g.fillStyle(CYAN, 0.55).fillCircle(0, 0, (8 + w * 6) * k);
    g.fillStyle(CYAN2, 0.95).fillCircle(0, 0, (5 + w * 3) * k);
  });
  // the last kick crackles with violet lightning (Σ: a golden sigma above it)
  scene.time.delayedCall(ms * 0.8, () => play(scene, x, y, AIR + 2, ms * 0.2 + 260, (g, u, t) => {
    const a = 1 - u, seed = Math.floor(t * 14);
    g.fillStyle(0xffffff, 0.85 * a).fillCircle(0, 0, (12 + u * 26) * k);
    for (let i = 0; i < 4; i++) { const an = seed + i * 1.57; bolt(g, 0, 0, Math.cos(an) * 46 * k, Math.sin(an) * 30 * k, seed + i, 2, VIOLET, null, a, 5); }
    if (kind === 'ultimo-recurso-sigma') sigmaGlyph(g, 0, -42 * k, 1.1 * k, Math.min(1, a * 2));
  }, true));
}

/** a sinuous body following the path the ball has flown: `draw(px, py, q)` at each of n points, q = 0 tail … 1 head */
function along(path: P[], n: number, wave: number, t: number, phase: number, draw: (px: number, py: number, q: number) => void, lane = 0) {
  if (path.length < 2) return;
  for (let i = 0; i < n; i++) {
    const q = i / (n - 1), f = q * (path.length - 1), j = Math.min(path.length - 2, Math.floor(f)), r = f - j, a = path[j], b = path[j + 1];
    const dx = b.x - a.x, dy = b.y - a.y, l = Math.hypot(dx, dy) || 1, off = Math.sin(q * 9 - t * 10 + phase) * wave * (0.3 + q * 0.7) + lane;
    draw(a.x + dx * r - dy / l * off, a.y + dy * r + dx / l * off, q);
  }
}

export function lastResortShot(scene: S, kind: LastResort, ball: Img, lv: number) {
  const k = 1 + lv * 0.05, path: P[] = [{ x: ball.x, y: ball.y }];
  const sigma = kind === 'ultimo-recurso-sigma', dark = kind === 'ultimo-recurso-dragon';
  // the stone dragon, Petronio's dark one, or the four crystal dragons of Σ flying side by side round the ball
  const dragons = sigma ? SIGMA.map((c, i) => ({ pal: crystalPal(c), lane: (i - 1.5) * 31 * k, size: 0.5, head: 0.15, phase: i * 1.7 }))
    : [{ pal: dark ? DARK_PAL : ROCK_PAL, lane: 0, size: dark ? 1.1 : 1, head: dark ? 0.29 : 0.26, phase: 0 }];
  const heads = dragons.map((d) => scene.add.image(ball.x, ball.y, dragonHeadTex(scene, d.pal)).setDepth(AIR + 1).setOrigin(205 / 320, 128 / 200).setScale(d.head * k));
  ride(scene, ball, (g, bx, by, ang, t) => {
    const last = path[path.length - 1];
    if (Math.hypot(bx - last.x, by - last.y) > 4) path.push({ x: bx, y: by });
    if (path.length > 50) path.shift();
    const nx = -Math.sin(ang), ny = Math.cos(ang);
    dragons.forEach((d, i) => {
      // its body: one tapering, waving ribbon that stops under the head's neck
      const spine: P[] = [], hx = bx + nx * d.lane, hy = by + ny * d.lane, neck = 150 * d.head * k * 0.95; // the neck's back end, so the body joins it
      along(path, 24, (sigma ? 6 : 9) * k, t, d.phase, (px, py) => spine.push({ x: px, y: py }), d.lane);
      // the back (and its spikes) on the same side as the head's mane: up on screen whichever way it flies
      const body = spine.filter((pt, j) => j === 0 || Math.hypot(pt.x - hx, pt.y - hy) > neck), up = Math.cos(ang) >= 0 ? -1 : 1;
      if (d.pal.look === 'rock') earthBody(g, body, k, t, d.size, up); // author: chunks of earth forming the dragon
      else dragonBody(g, body, k, t, d.pal, d.size, up);
      heads[i].setPosition(hx, hy).setRotation(ang).setFlipY(Math.cos(ang) < 0);
    });
    // Σ: the ball glows pink-white between the four (the others hold it in their jaws)
    if (sigma) {
      const r = (7 + lv * 0.4) * k;
      g.fillStyle(PINK, 0.5).fillCircle(bx, by, r * 1.9);
      g.fillStyle(LILAC, 0.75).fillCircle(bx, by, r * 1.3);
      g.fillStyle(0xffffff, 1).fillCircle(bx, by, r * 0.75);
    }
  }, (x, y) => {
    heads.forEach((h) => scene.tweens.add({ targets: h, alpha: 0, scale: h.scale * 1.4, duration: 260, onComplete: () => h.destroy() }));
    play(scene, x, y, AIR + 2, 560, (g, u) => {
      const a = 1 - u;
      g.fillStyle(dark ? VIOLET : sigma ? 0xffffff : PINK, 0.5 * a).fillCircle(0, 0, (22 + u * 70) * k);
      g.fillStyle(0xffffff, 0.9 * a).fillCircle(0, 0, (10 + u * 26) * k);
      if (sigma) SIGMA.forEach((c, i) => g.lineStyle(3, c, 0.85 * a).strokeCircle(0, 0, (26 + u * 80) * k + i * 4));
      else g.lineStyle(3, dark ? MAGENTA : FIRE2, 0.8 * a).strokeCircle(0, 0, (28 + u * 84) * k);
    }, true);
    if (!sigma) for (let i = 0; i < 9; i++) { // the rocks scatter
      const an = Math.random() * Math.PI * 2, d = (30 + Math.random() * 40) * k;
      const rk = scene.add.rectangle(x, y, 4 + Math.random() * 4, 3 + Math.random() * 3, dark ? DEEP : ROCK).setDepth(AIR + 2).setAngle(Math.random() * 90);
      scene.tweens.add({ targets: rk, x: x + Math.cos(an) * d, y: y + Math.sin(an) * d * 0.6, angle: rk.angle + 180, alpha: 0, duration: 520, onComplete: () => rk.destroy() });
    }
    sparks(scene, x, y, 14, 50 * k, sigma ? [...SIGMA, 0xffffff] : dark ? [VIOLET, MAGENTA, 0xffffff, CYAN] : [PINK, LILAC, 0xffffff, FIRE2]);
  });
}
