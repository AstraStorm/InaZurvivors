/**
 * Cañonazo de fragmentos (Shellbit Burst; author, from its scene in GO Chrono Stone, As09F7l__co): the shooter flicks
 * the ball up and leaps; behind him a shell of glowing green hexagons with circuit lines snaps together, plate by plate,
 * like a turtle's back. The plates light up yellow one after another and fire like cannons, and the ball leaves as a
 * huge yellow-white beam that floods everything with light.
 * Here: the shell forms behind the shooter, each lit plate fires a yellow fragment at a rival near him, and the ball goes
 * as a beam to the target and bursts in a ring of hexagons.
 */
import Phaser from 'phaser';

type S = Phaser.Scene;
const GREEN = 0x2cff6a, GREEN_D = 0x0a7a2a, LIME = 0xb8ffb0, YELLOW = 0xfff04a, WHITE = 0xffffff;

/** a flat-topped hexagon of radius r at (x, y) */
const hexPts = (x: number, y: number, r: number) => Array.from({ length: 6 }, (_, k) => ({ x: x + Math.cos(k * Math.PI / 3) * r, y: y + Math.sin(k * Math.PI / 3) * r }));

/** one plate of the shell: green glass, a bright rim, a few circuit lines; `lit` 0..1 turns it yellow */
function plate(g: Phaser.GameObjects.Graphics, x: number, y: number, r: number, a: number, lit: number, seed: number) {
  const pts = hexPts(x, y, r);
  g.fillStyle(lit > 0 ? 0xd8c818 : GREEN_D, (0.7 + lit * 0.2) * a).fillPoints(pts, true);
  g.fillStyle(lit > 0 ? YELLOW : GREEN, 0.55 * a).fillPoints(hexPts(x, y, r * 0.7), true);
  g.lineStyle(Math.max(2, r * 0.14), lit > 0.5 ? WHITE : LIME, a).strokePoints(pts, true);
  // circuit lines: short right-angle traces inside the plate
  g.lineStyle(1.5, lit > 0.5 ? 0xfffbd0 : LIME, 0.75 * a);
  for (let k = 0; k < 3; k++) {
    const h = (n: number) => Math.sin(seed * 31.7 + k * 11.3 + n * 5.1);
    const sx = x + h(1) * r * 0.45, sy = y + h(2) * r * 0.45, ex = sx + h(3) * r * 0.35;
    g.beginPath().moveTo(sx, sy).lineTo(ex, sy).lineTo(ex, sy + h(4) * r * 0.3).strokePath();
    g.fillCircle(ex, sy + h(4) * r * 0.3, 1.6);
  }
}

/** the plates of the shell, as offsets from its centre: a honeycomb dome, the middle ones first */
function shellLayout(size: number) {
  const r = size * 0.36, w = r * 1.5, h = r * Math.sqrt(3);
  const out: { x: number; y: number; d: number }[] = [];
  for (let col = -3; col <= 3; col++) for (let row = -2; row <= 1; row++) {
    const x = col * w, y = row * h + (col & 1 ? h / 2 : 0);
    if ((x / (size * 1.25)) ** 2 + ((y + h * 0.2) / (size * 0.95)) ** 2 > 1) continue; // keep the dome round
    out.push({ x, y, d: Math.hypot(x, y) });
  }
  return { r: r * 0.92, plates: out.sort((a, b) => a.d - b.d) };
}

export const SHELLBIT_CHARGE = 640;

/**
 * Cañonazo de fragmentos. (x, y) the shooter's feet, (tx, ty) the target. `frags` the rivals the plates fire at (each
 * hit() deals its blow when the fragment lands); onHit fires when the beam lands. Visual only besides those hooks.
 */
export function shellbitBurst(scene: S, x: number, y: number, tx: number, ty: number, size: number, frags: { x: number; y: number; hit: () => void }[], onHit: () => void) {
  const { r: pr, plates } = shellLayout(size);
  const cx = x, cy = y - size * 1.1;
  const shell = scene.add.graphics().setDepth(y - 2); // just under the shooter; normal blend so the green reads on any pitch
  const fx = scene.add.graphics().setDepth(8901);
  const t0 = scene.time.now, total = SHELLBIT_CHARGE + 520;
  let fired = false;
  const draw = () => {
    if (!shell.active) { scene.events.off('update', draw); return; }
    const ms = scene.time.now - t0, k = Math.min(1, ms / SHELLBIT_CHARGE);
    shell.clear();
    // the ball flicked up over the shooter while the shell forms
    if (!fired) { const up = Math.sin(Math.min(1, k * 1.4) * Math.PI / 2); shell.fillStyle(WHITE, 0.9).fillCircle(x, y - 20 - up * size * 1.3, 5); }
    plates.forEach((p, n) => {
      const born = n / plates.length * 0.5, a = Phaser.Math.Clamp((k - born) / 0.12, 0, 1);
      if (a <= 0) return;
      const lit = Phaser.Math.Clamp((k - 0.55 - n / plates.length * 0.35) / 0.08, 0, 1);
      const fade = ms > SHELLBIT_CHARGE ? Math.max(0, 1 - (ms - SHELLBIT_CHARGE) / 480) : 1;
      plate(shell, cx + p.x * (0.6 + a * 0.4), cy + p.y * (0.6 + a * 0.4), pr * (0.5 + a * 0.5), a * fade, fired ? 1 : lit, n);
    });
    // the green glow round the dome
    shell.lineStyle(4, GREEN, 0.4 * (1 - Math.max(0, (ms - SHELLBIT_CHARGE) / 480))).strokeEllipse(cx, cy, size * 2.7 * Math.min(1, k * 2), size * 2.1 * Math.min(1, k * 2));
    if (ms > total) { scene.events.off('update', draw); shell.destroy(); }
  };
  scene.events.on('update', draw);
  scene.time.delayedCall(SHELLBIT_CHARGE, () => {
    if (!shell.active) return;
    fired = true;
    // every lit plate fires a yellow fragment at a rival near the shooter
    frags.forEach((f, n) => {
      const p = plates[n % plates.length], sx = cx + p.x, sy = cy + p.y;
      const bolt = scene.add.graphics().setDepth(8901);
      const st = { k: 0 };
      scene.tweens.add({ targets: st, k: 1, delay: n * 40, duration: 220, ease: 'Quad.easeIn', onUpdate: () => {
        const px = sx + (f.x - sx) * st.k, py = sy + (f.y - sy) * st.k, bx = sx + (f.x - sx) * Math.max(0, st.k - 0.3), by = sy + (f.y - sy) * Math.max(0, st.k - 0.3);
        bolt.clear().lineStyle(6, YELLOW, 0.9).lineBetween(bx, by, px, py).fillStyle(WHITE, 1).fillCircle(px, py, 4);
      }, onComplete: () => {
        bolt.destroy(); f.hit();
        const spark = scene.add.graphics().setDepth(8901);
        scene.tweens.addCounter({ from: 0, to: 1, duration: 260, onUpdate: (tw) => { const u = tw.getValue() ?? 0; spark.clear().lineStyle(3, YELLOW, 1 - u).strokePoints(hexPts(f.x, f.y, 6 + u * 18), true); }, onComplete: () => spark.destroy() });
      } });
    });
    // the ball leaves as a yellow-white beam
    const st = { k: 0 };
    scene.tweens.add({ targets: st, k: 1, duration: 260, ease: 'Quad.easeIn', onUpdate: () => {
      const hx = cx + (tx - cx) * st.k, hy = cy + (ty - cy) * st.k;
      fx.clear();
      fx.lineStyle(size * 0.7, YELLOW, 0.45).lineBetween(cx, cy, hx, hy);
      fx.lineStyle(size * 0.32, WHITE, 0.95).lineBetween(cx, cy, hx, hy);
      fx.fillStyle(WHITE, 1).fillCircle(hx, hy, size * 0.32).fillStyle(YELLOW, 0.6).fillCircle(hx, hy, size * 0.55);
    }, onComplete: () => {
      onHit();
      scene.tweens.addCounter({ from: 0, to: 1, duration: 420, onUpdate: (tw) => {
        const u = tw.getValue() ?? 0;
        fx.clear();
        fx.lineStyle(size * 0.6 * (1 - u), YELLOW, 0.5 * (1 - u)).lineBetween(cx, cy, tx, ty);
        fx.fillStyle(WHITE, 0.8 * (1 - u)).fillCircle(tx, ty, size * (0.5 + u * 0.9));
        for (let n = 0; n < 6; n++) { // a ring of hexagons thrown out from the blast
          const a = n / 6 * Math.PI * 2 + u, d = size * (0.4 + u * 1.8);
          fx.lineStyle(3, n % 2 ? GREEN : YELLOW, 1 - u).strokePoints(hexPts(tx + Math.cos(a) * d, ty + Math.sin(a) * d * 0.6, size * 0.28), true);
        }
      }, onComplete: () => fx.destroy() });
    } });
  });
}
