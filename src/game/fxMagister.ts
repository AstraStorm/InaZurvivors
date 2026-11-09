/**
 * Movimientos armónicos (author, from its scene in GO, HN3lM3OVROE): the pitch goes dark blue and music notes float up;
 * Director Magister looms over the player (author's stills) — a mop of wavy pale-blue hair over his eyes with two curled
 * tufts on top, the white conductor's coat with a big pleated ruff and a blue chain over it, huge magenta sleeves raised
 * in a V with green cuffs and open hands (his upper pair of arms; the lower pair holds the baton), two orange blades behind his shoulders, magenta energy blazing behind, bare hands holding the
 * green baton across his chest. He conducts; the ball rises between his hands into a sphere
 * of blue light, the player kicks it and it flies in a spiral of blue streams; where it lands the notes turn into shots
 * that fly at the rivals round it.
 * The game's scene (author, l-XomIo6POI): the ball swells between his hands into a big cyan sphere, the ball still
 * inside, cyan flames licking round it; a white flash, and it leaves as a cyan beam wrapped in rings of light.
 */
import Phaser from 'phaser';
import { canvasTex, D, fade, rnd } from './fxKeshin';

type S = Phaser.Scene;
const BLUE = 0x2ae0ff, BLUE2 = 0xc8faff, MAGENTA = 0xff3ad8;
const OUT = '#141a3a';

/** the head (author's refs: the anime scene and its stills): a mop of wavy pale-blue hair parted in the middle and falling
 *  over the eyes, two curled tufts on top, only the tan chin and the closed mouth showing under it; 300×300, chin at (150, 286) */
function drawHead(c: CanvasRenderingContext2D) {
  const cx = 150;
  c.lineJoin = 'round'; c.lineCap = 'round';
  // the chin and mouth under the hair
  c.beginPath(); c.moveTo(cx - 46, 200); c.quadraticCurveTo(cx - 44, 262, cx, 286); c.quadraticCurveTo(cx + 44, 262, cx + 46, 200); c.closePath();
  const fg = c.createLinearGradient(0, 190, 0, 286); fg.addColorStop(0, '#9a6a4a'); fg.addColorStop(0.4, '#e2a878'); fg.addColorStop(1, '#d09060');
  c.fillStyle = fg; c.fill(); c.lineWidth = 3; c.strokeStyle = OUT; c.stroke();
  c.lineWidth = 3; c.beginPath(); c.moveTo(cx - 12, 258); c.quadraticCurveTo(cx, 262, cx + 12, 258); c.stroke();
  // the mop: one wavy mass from the crown down past the cheeks, its fringe scalloped low over the eyes
  const pal = (y0: number, y1: number) => { const g = c.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, '#d8f2ff'); g.addColorStop(0.5, '#8fd0f4'); g.addColorStop(1, '#5aa0d8'); return g; };
  c.beginPath(); c.moveTo(cx - 40, 238);
  c.bezierCurveTo(cx - 88, 250, cx - 118, 210, cx - 104, 160); c.bezierCurveTo(cx - 140, 130, cx - 120, 70, cx - 80, 60);
  c.bezierCurveTo(cx - 70, 20, cx - 20, 14, cx, 34); c.bezierCurveTo(cx + 20, 14, cx + 70, 20, cx + 80, 60);
  c.bezierCurveTo(cx + 120, 70, cx + 140, 130, cx + 104, 160); c.bezierCurveTo(cx + 118, 210, cx + 88, 250, cx + 40, 238);
  // the fringe over the eyes, from right to left: wavy locks dropping to y≈220
  for (let n = 0; n <= 6; n++) { const px = cx + 40 - n * (80 / 6); c.quadraticCurveTo(px - 4, 226 + (n % 2) * 8, px - 13.3 / 2, 206); }
  c.closePath();
  c.fillStyle = pal(20, 240); c.fill(); c.lineWidth = 4; c.strokeStyle = '#2a5a9a'; c.stroke();
  // the waves: light crests and dark hollows following the mass
  c.lineWidth = 3;
  for (const [x0, y0, x1, y1, x2, y2] of [[-80, 70, -100, 130, -84, 190], [-50, 50, -70, 120, -58, 200], [-20, 44, -30, 120, -24, 200], [20, 44, 30, 120, 24, 200], [50, 50, 70, 120, 58, 200], [80, 70, 100, 130, 84, 190]] as const) {
    c.beginPath(); c.moveTo(cx + x0, y0); c.quadraticCurveTo(cx + x1, y1, cx + x2, y2); c.strokeStyle = '#eafaff'; c.stroke();
    c.beginPath(); c.moveTo(cx + x0 + 8, y0 + 14); c.quadraticCurveTo(cx + x1 + 10, y1 + 6, cx + x2 + 8, y2 - 6); c.strokeStyle = '#4a86c8'; c.stroke();
  }
  c.beginPath(); c.moveTo(cx, 40); c.quadraticCurveTo(cx - 6, 120, cx, 200); c.strokeStyle = '#2a5a9a'; c.lineWidth = 3; c.stroke(); // the parting
  // the two curled tufts on top
  for (const s of [-1, 1]) {
    c.beginPath(); c.moveTo(cx + s * 14, 40); c.bezierCurveTo(cx + s * 20, 0, cx + s * 64, -4, cx + s * 62, 22); c.bezierCurveTo(cx + s * 58, 40, cx + s * 40, 34, cx + s * 44, 22);
    c.lineWidth = 9; c.strokeStyle = '#2a5a9a'; c.stroke(); c.lineWidth = 5; c.strokeStyle = '#bfe8ff'; c.stroke();
  }
}
/** the coat: the long white conductor's coat with its folds, the big pleated white ruff round the neck and the blue chain
 *  draped over it; 380×540, the hem at (190, 536), the neck at (190, 70) */
function drawCoat(c: CanvasRenderingContext2D) {
  const cx = 190;
  c.lineJoin = 'round';
  c.beginPath(); c.moveTo(cx - 92, 100); c.quadraticCurveTo(cx - 120, 300, cx - 176, 532); c.lineTo(cx + 176, 532); c.quadraticCurveTo(cx + 120, 300, cx + 92, 100); c.closePath();
  const g = c.createLinearGradient(0, 100, 0, 532); g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#c4c8dc'); c.fillStyle = g; c.fill(); c.lineWidth = 4; c.strokeStyle = OUT; c.stroke();
  c.strokeStyle = '#a0a6c4'; c.lineWidth = 3; c.beginPath();
  for (const x of [-120, -70, -24, 24, 70, 120]) { c.moveTo(cx + x * 0.45, 170); c.quadraticCurveTo(cx + x * 0.8, 360, cx + x * 1.3, 528); }
  c.stroke();
  // his lower pair of arms: white sleeves from the shoulders, out at the elbows, in to the hands on the baton (y≈300)
  for (const s of [-1, 1]) {
    c.beginPath(); c.moveTo(cx + s * 70, 104); c.quadraticCurveTo(cx + s * 150, 120, cx + s * 168, 200); c.quadraticCurveTo(cx + s * 160, 270, cx + s * 120, 312);
    c.lineTo(cx + s * 70, 296); c.quadraticCurveTo(cx + s * 112, 250, cx + s * 114, 206); c.quadraticCurveTo(cx + s * 100, 160, cx + s * 64, 150); c.closePath();
    const ag = c.createLinearGradient(cx + s * 60, 0, cx + s * 170, 0); ag.addColorStop(0, '#e4e6f2'); ag.addColorStop(1, '#ffffff');
    c.fillStyle = ag; c.fill(); c.lineWidth = 4; c.strokeStyle = OUT; c.stroke();
    c.lineWidth = 2.5; c.strokeStyle = '#a0a6c4'; c.beginPath(); c.moveTo(cx + s * 140, 170); c.quadraticCurveTo(cx + s * 150, 230, cx + s * 124, 280); c.stroke(); // a fold
  }
  // the ruff: a wide fan of white pleats under the chin
  const R = 128, H = 70, top = 34;
  c.beginPath(); c.moveTo(cx - R, top + 30);
  for (let n = 0; n <= 16; n++) { const a = Math.PI - n / 16 * Math.PI, px = cx + Math.cos(a) * R, py = top + 30 + Math.sin(a) * H * 1.3; c.lineTo(px, py + (n % 2 ? 8 : 0)); }
  c.lineTo(cx + R, top + 30); c.quadraticCurveTo(cx, top - 14, cx - R, top + 30); c.closePath();
  c.fillStyle = '#ffffff'; c.fill(); c.lineWidth = 4; c.strokeStyle = OUT; c.stroke();
  c.lineWidth = 2.5; c.strokeStyle = '#b4bad4';
  for (let n = 1; n < 16; n++) { const a = Math.PI - n / 16 * Math.PI; c.beginPath(); c.moveTo(cx + Math.cos(a) * 30, top + 26 + Math.sin(a) * 12); c.lineTo(cx + Math.cos(a) * (R - 4), top + 30 + Math.sin(a) * H * 1.24); c.stroke(); }
  // the blue chain draped across the ruff
  c.lineWidth = 6; c.strokeStyle = '#3a8ae8';
  for (let n = 0; n < 13; n++) { const u = n / 12, px = cx - 110 + u * 220, py = top + 44 + Math.sin(u * Math.PI) * 70; c.beginPath(); c.ellipse(px, py, 9, 5, n % 2 ? 0.8 : -0.8, 0, Math.PI * 2); c.stroke(); }
}
/** behind him: his upper pair of arms (he has four) — the huge magenta sleeves raised in a V, their green cuffs trimmed in
 *  orange and an open hand out of each — and the two big orange blades sticking out from behind the shoulders;
 *  960×700, the shoulders' middle at (480, 660) */
function drawBack(c: CanvasRenderingContext2D) {
  const cx = 410;
  c.translate(70, 100);
  c.lineJoin = 'round'; c.lineCap = 'round';
  for (const s of [-1, 1]) {
    // the sleeve: a long magenta tube from the shoulder up to the corner, widening
    c.beginPath(); c.moveTo(cx + s * 50, 580); c.quadraticCurveTo(cx + s * 150, 360, cx + s * 278, 120); c.lineTo(cx + s * 404, 196);
    c.quadraticCurveTo(cx + s * 300, 430, cx + s * 210, 596); c.closePath();
    const g = c.createLinearGradient(cx, 580, cx + s * 360, 160); g.addColorStop(0, '#5a1050'); g.addColorStop(0.6, '#a01a8a'); g.addColorStop(1, '#d03ab0');
    c.fillStyle = g; c.fill(); c.lineWidth = 5; c.strokeStyle = '#2a0828'; c.stroke();
    c.lineWidth = 4; c.strokeStyle = '#ff7ae8'; c.beginPath(); c.moveTo(cx + s * 110, 540); c.quadraticCurveTo(cx + s * 210, 370, cx + s * 320, 180); c.stroke();
    c.strokeStyle = '#3a0a34'; c.lineWidth = 3; for (const u of [0.35, 0.6]) { c.beginPath(); c.moveTo(cx + s * (100 + u * 120), 590 - u * 200); c.quadraticCurveTo(cx + s * (180 + u * 140), 470 - u * 260, cx + s * (300 + u * 40), 200 - u * 40); c.stroke(); } // the folds
    // the green cuff, its orange trim
    c.save(); c.translate(cx + s * 345, 140); c.rotate(s * 0.55);
    // the open hand, fingers spread up out of the cuff
    const hg = c.createLinearGradient(0, -170, 0, -60); hg.addColorStop(0, '#f0bc8a'); hg.addColorStop(1, '#b8784a');
    c.lineWidth = 3.5; c.strokeStyle = '#3a1a08';
    for (const [fx, fa, fl] of [[-26, -0.35, 52], [-10, -0.12, 64], [6, 0.05, 66], [22, 0.25, 56]] as const) {
      c.save(); c.translate(fx, -112); c.rotate(fa);
      c.beginPath(); c.moveTo(-8, 0); c.lineTo(-7, -fl + 8); c.quadraticCurveTo(0, -fl - 6, 7, -fl + 8); c.lineTo(8, 0); c.closePath();
      c.fillStyle = hg; c.fill(); c.stroke(); c.restore();
    }
    c.beginPath(); c.moveTo(-s * 30, -80); c.quadraticCurveTo(-s * 66, -96, -s * 70, -128); c.quadraticCurveTo(-s * 54, -132, -s * 26, -104); c.closePath(); c.fillStyle = hg; c.fill(); c.stroke(); // the thumb
    c.beginPath(); c.ellipse(0, -96, 38, 34, 0, 0, Math.PI * 2); c.fillStyle = hg; c.fill(); c.stroke(); // the palm
    c.beginPath(); c.moveTo(-60, 40); c.lineTo(-52, -40); c.lineTo(52, -40); c.lineTo(60, 40); c.closePath();
    const cg = c.createLinearGradient(0, -40, 0, 40); cg.addColorStop(0, '#9af07a'); cg.addColorStop(1, '#2a9a3a'); c.fillStyle = cg; c.fill(); c.lineWidth = 4; c.strokeStyle = '#0a3a10'; c.stroke();
    c.beginPath(); c.moveTo(-52, -40); c.lineTo(-30, -78); c.lineTo(0, -48); c.lineTo(30, -78); c.lineTo(52, -40); c.closePath(); c.fillStyle = '#ff9a2a'; c.fill(); c.lineWidth = 3; c.strokeStyle = '#6a3000'; c.stroke();
    c.restore();
    // the orange blade from behind the shoulder
    c.beginPath(); c.moveTo(cx + s * 40, 560); c.quadraticCurveTo(cx + s * 120, 420, cx + s * 250, 330); c.quadraticCurveTo(cx + s * 170, 460, cx + s * 120, 590); c.closePath();
    const og = c.createLinearGradient(cx, 560, cx + s * 250, 330); og.addColorStop(0, '#c85a00'); og.addColorStop(1, '#ffb84a'); c.fillStyle = og; c.fill(); c.lineWidth = 4; c.strokeStyle = '#5a2000'; c.stroke();
    c.beginPath(); c.moveTo(cx + s * 80, 540); c.quadraticCurveTo(cx + s * 140, 440, cx + s * 230, 345); c.lineWidth = 3; c.strokeStyle = '#ffe0a0'; c.stroke();
  }
}
/** the two big bare hands holding the green baton across the chest, its orange knob in the middle; 340×150, middle (170, 75) */
function drawHands(c: CanvasRenderingContext2D) {
  const cx = 170;
  c.lineJoin = 'round'; c.lineCap = 'round';
  // the baton: green rod, orange knob and tip
  c.lineWidth = 14; c.strokeStyle = '#1a4a1a'; c.beginPath(); c.moveTo(14, 84); c.lineTo(326, 66); c.stroke();
  c.lineWidth = 9; c.strokeStyle = '#4ad04a'; c.stroke();
  c.beginPath(); c.ellipse(cx, 75, 18, 24, 0.06, 0, Math.PI * 2); c.fillStyle = '#ff8a1a'; c.fill(); c.lineWidth = 3; c.strokeStyle = '#6a3000'; c.stroke();
  c.beginPath(); c.ellipse(326, 66, 8, 10, 0, 0, Math.PI * 2); c.fillStyle = '#ff8a1a'; c.fill(); c.stroke();
  // the hands closing on it: tan, knuckles over the rod
  for (const [hx, s] of [[86, -1], [254, 1]] as const) {
    c.beginPath(); c.moveTo(hx - 44, 40); c.quadraticCurveTo(hx - 50, 110, hx - 10, 126); c.quadraticCurveTo(hx + 40, 128, hx + 46, 70); c.quadraticCurveTo(hx + 30, 30, hx - 44, 40); c.closePath();
    const g = c.createLinearGradient(0, 30, 0, 128); g.addColorStop(0, '#f0bc8a'); g.addColorStop(1, '#b8784a'); c.fillStyle = g; c.fill(); c.lineWidth = 3.5; c.strokeStyle = '#3a1a08'; c.stroke();
    c.lineWidth = 2.5; for (const d of [-24, -6, 12, 30]) { c.beginPath(); c.moveTo(hx + d, 52); c.quadraticCurveTo(hx + d + 4, 80, hx + d, 104); c.stroke(); } // the fingers round the rod
    c.beginPath(); c.moveTo(hx - s * 40, 60); c.quadraticCurveTo(hx - s * 60, 80, hx - s * 46, 98); c.lineWidth = 3; c.stroke(); // the thumb
    // the white sleeve end at the wrist
    c.beginPath(); c.ellipse(hx + s * 10, 136, 40, 14, 0, 0, Math.PI * 2); c.fillStyle = '#ffffff'; c.fill(); c.lineWidth = 3; c.strokeStyle = OUT; c.stroke();
  }
}
/** a music note (♪) */
const noteTex = (scene: S) => canvasTex(scene, 'music-note', 28, 36, (c) => {
  c.fillStyle = '#ffffff'; c.strokeStyle = '#ffffff'; c.lineWidth = 3;
  c.beginPath(); c.ellipse(9, 28, 7, 5, -0.4, 0, Math.PI * 2); c.fill();
  c.beginPath(); c.moveTo(15, 27); c.lineTo(15, 4); c.quadraticCurveTo(22, 8, 24, 16); c.stroke();
});
const headTex = (scene: S) => canvasTex(scene, 'magister-head4', 300, 300, (c) => drawHead(c));
const coatTex = (scene: S) => canvasTex(scene, 'magister-coat2', 380, 540, (c) => drawCoat(c));
const backTex = (scene: S) => canvasTex(scene, 'magister-back2', 960, 700, (c) => drawBack(c));
const handsTex = (scene: S) => canvasTex(scene, 'magister-hands', 340, 150, (c) => drawHands(c));

export interface HarmonyHooks {
  /** the sphere lands on (x, y) and bursts `r` round */
  onBurst: (x: number, y: number, r: number) => void;
  /** a note hits the rival at (x, y) (the scene picks the rivals: `pick(n)` returns up to n targets near the landing spot) */
  pick: (x: number, y: number, n: number) => { x: number; y: number; hit: () => void }[];
  /** where the player is now */
  at: () => { x: number; y: number };
}
/** times of the scene, ms */
export const HARMONY_MS = { rise: 340, conduct: 760, gather: 1100, kick: 1650, land: 2000, total: 3000 };
/** the burst and the number of note shots, by level */
export const harmonySize = (level: number) => ({ r: 120 + level * 10, notes: 6 + level });

/** Movimientos armónicos. (x, y) the player's feet, (tx, ty) the rival. Visual only: the scene deals the damage in the hooks. */
export function harmony(scene: S, x: number, y: number, tx: number, ty: number, level: number, hooks: HarmonyHooks) {
  const k = 1 + level * 0.05, side = tx >= x ? 1 : -1, cam = scene.cameras.main, view = () => cam.worldView;
  const live: Phaser.GameObjects.GameObject[] = [];
  const keep = <T extends Phaser.GameObjects.GameObject>(o: T) => { live.push(o); return o; };
  const dim = keep(scene.add.rectangle(view().centerX, view().centerY, view().width * 2, view().height * 2, 0x060a30, 1).setDepth(D.dim).setAlpha(0));
  scene.tweens.add({ targets: dim, alpha: 0.64, duration: 260 });
  // music notes drifting up all round
  const notes = scene.time.addEvent({ delay: 70, repeat: Math.floor(HARMONY_MS.total / 70) - 8, callback: () => {
    const n = scene.add.image(view().left + rnd(0, view().width), view().bottom + 10, noteTex(scene)).setDepth(D.fx).setScale(rnd(0.35, 0.6)).setTint(Math.random() < 0.5 ? 0x9ad8ff : 0xff9ae8);
    scene.tweens.add({ targets: n, y: n.y - view().height * rnd(0.6, 1), x: n.x + Math.sin(n.y) * 30, angle: rnd(-30, 30), alpha: 0, duration: rnd(1500, 2200), onComplete: () => n.destroy() });
  } });
  // ---- Magister (the anime): huge over the shooter — the magenta sleeves raised in a V and the orange blades behind, the
  // white coat and its ruff, the mop of hair over the eyes, the bare hands holding the baton across the chest. He fills
  // most of the view's height (whatever the camera's zoom) and never pokes out of its top
  const H = 1010, gs = (view().height * 0.84) / H, wx = x - side * 6, wy = Math.max(y + 10, view().top + H * gs + 4);
  const wings = keep(scene.add.graphics().setDepth(D.giant - 1).setBlendMode(Phaser.BlendModes.ADD)); // the magenta energy behind him
  const spirit = keep(scene.add.container(wx, wy).setDepth(D.giant).setScale(gs * 0.3).setAlpha(0));
  const back = scene.add.image(0, -380, backTex(scene)).setOrigin(480 / 960, 660 / 700);
  const coat = scene.add.image(0, 0, coatTex(scene)).setOrigin(0.5, 536 / 540);
  const head = scene.add.image(0, -420, headTex(scene)).setOrigin(0.5, 286 / 300);
  const hands = scene.add.image(0, -300, handsTex(scene));
  spirit.add([back, coat, head, hands]);
  try { spirit.postFX?.addGlow(0xff7ae8, 3, 0, false, 0.1, 10); } catch { /* canvas renderer: no glow */ }
  scene.tweens.add({ targets: spirit, alpha: 1, scaleX: gs, scaleY: gs, delay: HARMONY_MS.rise, duration: 460, ease: 'Back.easeOut' });
  const sphere = keep(scene.add.circle(wx, wy - 230 * gs, 4, BLUE, 1).setDepth(D.fx).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0));
  const orbit = keep(scene.add.graphics().setDepth(D.fx + 1).setBlendMode(Phaser.BlendModes.ADD));
  const inner = keep(scene.add.image(0, 0, 'fx:ball').setDepth(D.fx + 1).setAlpha(0)); // the ball, seen inside the sphere
  let sphereR = 0, conducting = false;
  const t0 = scene.time.now;
  const tick = () => {
    if (!spirit.active) { scene.events.off('update', tick); return; }
    const t = (scene.time.now - t0) / 1000;
    dim.setPosition(view().centerX, view().centerY);
    head.setAngle(Math.sin(t * 2.2) * 2);
    if (conducting) hands.setY(-300 + Math.sin(t * 9) * 16).setAngle(Math.sin(t * 4.5) * 6); // he conducts: the baton beats
    back.setAngle(Math.sin(t * 1.6) * 1.5);
    // the magenta energy blazing behind him (the scene's purple glow)
    wings.clear();
    if (spirit.alpha > 0.05) {
      const sc = spirit.scaleX, cx = spirit.x, cy = spirit.y - 520 * sc;
      for (let n = 0; n < 20; n++) {
        const a = -Math.PI / 2 + (n / 19 - 0.5) * 3.4, L = (560 + Math.sin(t * 7 + n * 1.3) * 60) * sc;
        const nx = -Math.sin(a) * 50 * sc, ny = Math.cos(a) * 50 * sc;
        wings.fillStyle(n % 2 ? MAGENTA : 0xb03aff, 0.22 * spirit.alpha).fillTriangle(cx + nx, cy + ny, cx - nx, cy - ny, cx + Math.cos(a) * L, cy + Math.sin(a) * L);
      }
    }
    // the sphere of light: orbits and rings round it
    orbit.clear();
    if (sphereR > 1) {
      sphere.setRadius(sphereR);
      inner.setPosition(sphere.x, sphere.y).setScale(sphereR / 30).setAngle(t * 200);
      for (let n = 0; n < 14; n++) { // cyan flames licking up round it
        const a = -Math.PI / 2 + (n / 13 - 0.5) * 4.4, L = sphereR * (0.9 + Math.sin(t * 16 + n * 1.7) * 0.35), bx = sphere.x + Math.cos(a) * sphereR, by = sphere.y + Math.sin(a) * sphereR;
        const fx = -Math.sin(a) * sphereR * 0.3, fy = Math.cos(a) * sphereR * 0.3;
        orbit.fillStyle(n % 2 ? BLUE : BLUE2, 0.5).fillTriangle(bx + fx, by + fy, bx - fx, by - fy, bx + Math.cos(a) * L, by + Math.sin(a) * L - L * 0.3);
      }
      for (let n = 0; n < 3; n++) {
        const tilt = n * 1.05 + t * 2;
        orbit.lineStyle(2, n === 1 ? 0xffffff : BLUE2, 0.85).beginPath();
        for (let u = 0; u <= Math.PI * 2 + 0.01; u += 0.2) { const px = sphere.x + Math.cos(u) * sphereR * 1.6, py = sphere.y + Math.sin(u) * sphereR * 0.5; const rx = sphere.x + (px - sphere.x) * Math.cos(tilt) - (py - sphere.y) * Math.sin(tilt), ry = sphere.y + (px - sphere.x) * Math.sin(tilt) + (py - sphere.y) * Math.cos(tilt); if (u === 0) orbit.moveTo(rx, ry); else orbit.lineTo(rx, ry); }
        orbit.strokePath();
      }
    }
  };
  scene.events.on('update', tick);
  scene.time.delayedCall(HARMONY_MS.conduct, () => { conducting = true; });
  // the ball rises between his hands into a sphere of blue light
  scene.time.delayedCall(HARMONY_MS.gather, () => {
    if (!spirit.active) return;
    sphere.setAlpha(0.75); inner.setAlpha(1);
    scene.tweens.addCounter({ from: 0, to: 1, duration: HARMONY_MS.kick - HARMONY_MS.gather, ease: 'Quad.easeOut', onUpdate: (tw) => { sphereR = (24 + (tw.getValue() ?? 0) * 96) * gs * k; } }); // in his own scale: about his hands' span
    const flow = scene.time.addEvent({ delay: 40, repeat: Math.floor((HARMONY_MS.kick - HARMONY_MS.gather) / 40), callback: () => {
      const a = rnd(0, Math.PI * 2), d = rnd(50, 80) * k, sp = scene.add.circle(sphere.x + Math.cos(a) * d, sphere.y + Math.sin(a) * d, rnd(1.5, 3), Math.random() < 0.5 ? BLUE2 : MAGENTA, 1).setDepth(D.fx).setBlendMode(Phaser.BlendModes.ADD);
      scene.tweens.add({ targets: sp, x: sphere.x, y: sphere.y, alpha: 0.2, duration: 240, ease: 'Quad.easeIn', onComplete: () => sp.destroy() });
    } });
    scene.time.delayedCall(HARMONY_MS.kick - HARMONY_MS.gather + 40, () => flow.remove());
  });
  // the kick: the sphere flies down to the rival inside a spiral of blue streams
  scene.time.delayedCall(HARMONY_MS.kick, () => {
    if (!spirit.active) return;
    conducting = false;
    scene.tweens.add({ targets: hands, y: -240, angle: 0, duration: 160, ease: 'Cubic.easeIn' }); // the baton sweeps down: off it goes
    cam.shake(240, 0.01); cam.flash(220, 255, 255, 255); inner.setAlpha(0);
    const sx = sphere.x, sy = sphere.y, dur = HARMONY_MS.land - HARMONY_MS.kick;
    const ball = scene.add.image(sx, sy, 'fx:ball').setDepth(D.fx + 2);
    const helix = scene.add.graphics().setDepth(D.fx).setBlendMode(Phaser.BlendModes.ADD);
    const ang = Math.atan2(ty - sy, tx - sx), nx = -Math.sin(ang), ny = Math.cos(ang), L = Math.hypot(tx - sx, ty - sy);
    const rings = scene.time.addEvent({ delay: 45, repeat: Math.floor(dur / 45), callback: () => { // rings of light round the beam
      const r = scene.add.ellipse(sphere.x, sphere.y, sphereR * 0.5, sphereR * 1.6).setStrokeStyle(4, BLUE2, 0.9).setRotation(ang).setDepth(D.fx + 1).setBlendMode(Phaser.BlendModes.ADD);
      scene.tweens.add({ targets: r, scale: 1.9, alpha: 0, duration: 380, onComplete: () => r.destroy() });
    } });
    scene.tweens.addCounter({ from: 0, to: 1, duration: dur, ease: 'Quad.easeIn', onUpdate: (tw) => {
      const u = tw.getValue() ?? 0, bx = sx + (tx - sx) * u, by = sy + (ty - sy) * u;
      ball.setPosition(bx, by).setAngle(u * 900); sphere.setPosition(bx, by); sphereR = 70 * gs * k;
      helix.clear();
      helix.lineStyle(sphereR * 0.9, BLUE, 0.35).lineBetween(sx, sy, bx, by).lineStyle(sphereR * 0.35, BLUE2, 0.8).lineBetween(sx, sy, bx, by); // the cyan beam
      for (const [ph, col] of [[0, BLUE], [Math.PI, BLUE2], [Math.PI / 2, MAGENTA]] as const) {
        helix.lineStyle(3, col, 0.85).beginPath();
        for (let v = 0; v <= u; v += 0.02) { const w = Math.sin(v * 22 + ph) * 16 * k, px = sx + Math.cos(ang) * L * v + nx * w, py = sy + Math.sin(ang) * L * v + ny * w * 0.6; if (v === 0) helix.moveTo(px, py); else helix.lineTo(px, py); }
        helix.strokePath();
      }
    }, onComplete: () => {
      rings.remove(); fade(scene, helix, 200, 300); fade(scene, ball, 0, 120); sphere.setAlpha(0); sphereR = 0;
      const { r, notes: n } = harmonySize(level);
      hooks.onBurst(tx, ty, r);
      cam.shake(320, 0.012);
      for (const [d, col] of [[0, 0xffffff], [70, BLUE], [150, MAGENTA]] as const) {
        const ring = scene.add.ellipse(tx, ty, r * 0.5, r * 0.28).setStrokeStyle(5, col, 1).setDepth(D.fx - 1);
        scene.tweens.add({ targets: ring, scale: 4, alpha: 0, delay: d, duration: 600, ease: 'Cubic.easeOut', onComplete: () => ring.destroy() });
      }
      // the notes turn into shots, one after another at the rivals round it
      hooks.pick(tx, ty, n).forEach((q, i) => scene.time.delayedCall(80 + i * 70, () => {
        const note = scene.add.image(tx, ty - 20, noteTex(scene)).setDepth(D.fx + 1).setScale(0.7).setTint(i % 2 ? 0x9ad8ff : 0xff9ae8);
        scene.tweens.add({ targets: note, x: q.x, y: q.y, angle: 360, duration: 260, ease: 'Quad.easeIn', onComplete: () => {
          q.hit();
          const f = scene.add.circle(q.x, q.y, 8, i % 2 ? BLUE : MAGENTA, 0.9).setDepth(D.fx).setBlendMode(Phaser.BlendModes.ADD);
          scene.tweens.add({ targets: f, scale: 2.4, alpha: 0, duration: 260, onComplete: () => f.destroy() });
          note.destroy();
        } });
      }));
    } });
    scene.time.delayedCall(500, () => { if (spirit.active) scene.tweens.add({ targets: spirit, alpha: 0, y: spirit.y - 24, duration: 620, ease: 'Cubic.easeIn' }); });
  });
  const end = HARMONY_MS.total;
  for (const o of live) if (o !== dim) fade(scene, o, end - 420, 400);
  scene.tweens.add({ targets: dim, alpha: 0, delay: end - 400, duration: 380, onComplete: () => dim.destroy() });
  scene.time.delayedCall(end, () => { scene.events.off('update', tick); notes.remove(); });
}
