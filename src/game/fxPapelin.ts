/**
 * Descarga de colores (author, from its scene in Victory Road, PojRldJnXcg 0:04-0:12): the keeper raises his hand inside a
 * whirl of green light; Rey de los empollones, Papelín, rises behind him in a green aura — a giant king in red armour
 * trimmed in gold, blue shoulder plates, a white ruff, the golden crown with its green gem, cyan spectacles in an orange
 * frame, a red button nose and a huge white moustache that flows down past his chest. He lifts his right arm: a blue
 * gun barrel ending in a revolver of colour bands (yellow, red, green, pink) with coloured pencil tips round its muzzle.
 * A cyan reticle locks on; the drum spins and fires a stream of coloured bursts that stop the shot.
 * Here: the reticles lock on the rivals' shots and the nearest rivals; every pencil shot hits one of them in a splash of
 * its colour, the shots round the keeper are swallowed, and the team is healed like any save.
 */
import Phaser from 'phaser';
import { canvasTex, D, fade, rnd } from './fxKeshin';

type S = Phaser.Scene;
const GREEN = 0x5aff3a, GREEN2 = 0xc8ff9a, CYAN = 0x3af0ff;
/** the pencil colours of the drum, in its order */
export const PAPELIN_COLORS = [0xffd21a, 0xff3a3a, 0x3ad24a, 0xff4ad0, 0x8a4aff, 0x3a8aff];
const OUT = '#2a0a10';

/** the head: crown, spectacles, nose and the great moustache; 340×320, the chin's middle at (170, 250) */
function drawHead(c: CanvasRenderingContext2D) {
  const cx = 170;
  c.lineJoin = 'round'; c.lineCap = 'round';
  // the face: pale and round under the crown
  c.beginPath(); c.ellipse(cx, 160, 78, 84, 0, 0, Math.PI * 2);
  const fg = c.createLinearGradient(0, 80, 0, 240); fg.addColorStop(0, '#f4ece4'); fg.addColorStop(1, '#c8b8b0');
  c.fillStyle = fg; c.fill(); c.lineWidth = 4; c.strokeStyle = OUT; c.stroke();
  // the crown: a golden band and its spikes, the green gem in the middle
  c.beginPath(); c.moveTo(cx - 92, 104); c.lineTo(cx - 100, 30); c.lineTo(cx - 70, 70); c.lineTo(cx - 52, 6); c.lineTo(cx - 26, 62); c.lineTo(cx, -4);
  c.lineTo(cx + 26, 62); c.lineTo(cx + 52, 6); c.lineTo(cx + 70, 70); c.lineTo(cx + 100, 30); c.lineTo(cx + 92, 104); c.closePath();
  const cg = c.createLinearGradient(0, 0, 0, 104); cg.addColorStop(0, '#fff6a0'); cg.addColorStop(0.5, '#ffd21a'); cg.addColorStop(1, '#c88a00');
  c.fillStyle = cg; c.fill(); c.lineWidth = 4; c.strokeStyle = '#5a3a00'; c.stroke();
  c.beginPath(); c.rect(cx - 92, 84, 184, 22); c.fillStyle = '#ffd21a'; c.fill(); c.stroke();
  c.beginPath(); c.ellipse(cx, 74, 12, 14, 0, 0, Math.PI * 2); c.fillStyle = '#2ad04a'; c.fill(); c.lineWidth = 3; c.stroke();
  c.beginPath(); c.ellipse(cx - 3, 69, 4, 4, 0, 0, Math.PI * 2); c.fillStyle = '#d8ffd8'; c.fill();
  // the spectacles: two cyan lenses in an orange frame, pointed at the outer corners like a mask
  for (const s of [-1, 1]) {
    c.beginPath(); c.moveTo(cx + s * 8, 132); c.quadraticCurveTo(cx + s * 40, 112, cx + s * 96, 116); c.quadraticCurveTo(cx + s * 72, 168, cx + s * 30, 170); c.quadraticCurveTo(cx + s * 8, 160, cx + s * 8, 132); c.closePath();
    const lg = c.createLinearGradient(cx, 116, cx, 170); lg.addColorStop(0, '#c8ffff'); lg.addColorStop(1, '#3ad8e8');
    c.fillStyle = lg; c.fill(); c.lineWidth = 7; c.strokeStyle = '#ff8a1a'; c.stroke(); c.lineWidth = 2; c.strokeStyle = '#6a2a00'; c.stroke();
    c.beginPath(); c.moveTo(cx + s * 30, 128); c.lineTo(cx + s * 54, 124); c.lineWidth = 4; c.strokeStyle = '#ffffff'; c.stroke(); // the glint
  }
  // the moustache: two great white sweeps from under the nose, curling down past the chin, with strands
  for (const s of [-1, 1]) {
    c.beginPath(); c.moveTo(cx, 186);
    c.bezierCurveTo(cx + s * 60, 160, cx + s * 150, 190, cx + s * 160, 250);
    c.bezierCurveTo(cx + s * 164, 290, cx + s * 130, 318, cx + s * 110, 300);
    c.bezierCurveTo(cx + s * 136, 280, cx + s * 120, 236, cx + s * 70, 230);
    c.quadraticCurveTo(cx + s * 30, 228, cx, 214); c.closePath();
    const mg = c.createLinearGradient(cx, 170, cx + s * 160, 300); mg.addColorStop(0, '#ffffff'); mg.addColorStop(1, '#c8ccd8');
    c.fillStyle = mg; c.fill(); c.lineWidth = 4; c.strokeStyle = '#3a3a4a'; c.stroke();
    c.lineWidth = 2; c.strokeStyle = '#a0a4b8';
    for (const u of [0.3, 0.55, 0.8]) { c.beginPath(); c.moveTo(cx + s * 30 * u, 196 + u * 6); c.bezierCurveTo(cx + s * (60 + 70 * u), 186, cx + s * (110 + 30 * u), 210, cx + s * (128 + 10 * u), 250 + u * 20); c.stroke(); }
  }
  // the beard under it: soft round white tufts round the chin (pointed ones read as teeth)
  const puffs: [number, number, number][] = [[-50, 236, 22], [-24, 250, 24], [0, 256, 26], [24, 250, 24], [50, 236, 22], [-12, 270, 18], [12, 270, 18]];
  c.lineWidth = 3; c.strokeStyle = '#8a8ea4';
  for (const [dx, py, r] of puffs) { c.beginPath(); c.arc(cx + dx, py, r, 0, Math.PI * 2); c.stroke(); }
  c.fillStyle = '#f4f4fa';
  for (const [dx, py, r] of puffs) { c.beginPath(); c.arc(cx + dx, py, r - 1.5, 0, Math.PI * 2); c.fill(); }
  c.lineWidth = 2; c.strokeStyle = '#c8ccd8';
  for (const [dx, py, r] of puffs) { c.beginPath(); c.arc(cx + dx - 3, py - 2, r * 0.5, Math.PI * 0.9, Math.PI * 1.6); c.stroke(); }
  // the red button nose on top of it all
  c.beginPath(); c.ellipse(cx, 184, 17, 16, 0, 0, Math.PI * 2);
  const ng = c.createRadialGradient(cx - 5, 178, 2, cx, 184, 17); ng.addColorStop(0, '#ff9a9a'); ng.addColorStop(1, '#d01020');
  c.fillStyle = ng; c.fill(); c.lineWidth = 3; c.strokeStyle = OUT; c.stroke();
}

/** the body: red armour trimmed in gold, the blue shoulder plates, the white ruff and the belt; 460×420, the neck at (230, 40) */
function drawBody(c: CanvasRenderingContext2D) {
  const cx = 230;
  c.lineJoin = 'round';
  // the red cape behind, falling wide
  c.beginPath(); c.moveTo(cx - 120, 60); c.quadraticCurveTo(cx - 220, 260, cx - 200, 416); c.lineTo(cx + 200, 416); c.quadraticCurveTo(cx + 220, 260, cx + 120, 60); c.closePath();
  c.fillStyle = '#7a0a1a'; c.fill(); c.lineWidth = 4; c.strokeStyle = OUT; c.stroke();
  // the breastplate
  c.beginPath(); c.moveTo(cx - 110, 70); c.quadraticCurveTo(cx - 130, 240, cx - 96, 400); c.lineTo(cx + 96, 400); c.quadraticCurveTo(cx + 130, 240, cx + 110, 70); c.closePath();
  const bg = c.createLinearGradient(cx - 110, 0, cx + 110, 0); bg.addColorStop(0, '#a01020'); bg.addColorStop(0.5, '#ff3a3a'); bg.addColorStop(1, '#a01020');
  c.fillStyle = bg; c.fill(); c.lineWidth = 4; c.strokeStyle = OUT; c.stroke();
  // gold trims: the middle seam and two bands
  c.lineWidth = 10; c.strokeStyle = '#ffd21a';
  c.beginPath(); c.moveTo(cx, 110); c.lineTo(cx, 400); c.stroke();
  for (const y of [210, 300]) { c.beginPath(); c.moveTo(cx - 118, y); c.quadraticCurveTo(cx, y + 26, cx + 118, y); c.stroke(); }
  c.lineWidth = 2; c.strokeStyle = '#6a4a00';
  for (const y of [210, 300]) { c.beginPath(); c.moveTo(cx - 118, y + 5); c.quadraticCurveTo(cx, y + 31, cx + 118, y + 5); c.stroke(); }
  // the belt and its golden buckle
  c.beginPath(); c.rect(cx - 108, 340, 216, 30); c.fillStyle = '#3a1a5a'; c.fill(); c.lineWidth = 3; c.strokeStyle = OUT; c.stroke();
  c.beginPath(); c.rect(cx - 22, 334, 44, 42); c.fillStyle = '#ffd21a'; c.fill(); c.stroke();
  // the blue shoulder plates, layered
  for (const s of [-1, 1]) for (let n = 2; n >= 0; n--) {
    c.beginPath(); c.ellipse(cx + s * (126 + n * 10), 92 + n * 22, 62 - n * 8, 40 - n * 6, s * 0.35, Math.PI, Math.PI * 2);
    c.lineTo(cx + s * (126 + n * 10) + 62 - n * 8, 92 + n * 22); c.closePath();
    const pg = c.createLinearGradient(0, 60, 0, 140); pg.addColorStop(0, '#8ac8ff'); pg.addColorStop(1, '#1a5ad0');
    c.fillStyle = pg; c.fill(); c.lineWidth = 4; c.strokeStyle = '#0a1a4a'; c.stroke();
    c.lineWidth = 4; c.strokeStyle = '#ffd21a'; c.beginPath(); c.ellipse(cx + s * (126 + n * 10), 92 + n * 22, 56 - n * 8, 34 - n * 6, s * 0.35, Math.PI * 1.1, Math.PI * 1.9); c.stroke();
  }
  // the white ruff round the neck: a row of soft round frills (pointed ones read as teeth)
  const frills = Array.from({ length: 9 }, (_, n) => [cx - 96 + n * 24, 62 + Math.sin(n / 8 * Math.PI) * 12] as const);
  c.lineWidth = 3; c.strokeStyle = '#8a8ea4';
  for (const [fx, fy] of frills) { c.beginPath(); c.arc(fx, fy, 18, 0, Math.PI * 2); c.stroke(); }
  c.fillStyle = '#ffffff';
  for (const [fx, fy] of frills) { c.beginPath(); c.arc(fx, fy, 16.5, 0, Math.PI * 2); c.fill(); }
}

/** the gun arm: the blue barrel ending in the drum of colour bands and the coloured pencil tips round its muzzle; 420×200,
 *  the shoulder end at (20, 100), the muzzle's middle at (400, 100) */
function drawGun(c: CanvasRenderingContext2D) {
  c.lineJoin = 'round';
  // the barrel: a blue and silver tube
  c.beginPath(); c.moveTo(14, 70); c.lineTo(190, 60); c.lineTo(190, 140); c.lineTo(14, 130); c.closePath();
  const g = c.createLinearGradient(0, 60, 0, 140); g.addColorStop(0, '#c8e0ff'); g.addColorStop(0.45, '#3a7ae8'); g.addColorStop(1, '#0a2a7a');
  c.fillStyle = g; c.fill(); c.lineWidth = 4; c.strokeStyle = '#0a1a3a'; c.stroke();
  c.lineWidth = 3; for (const x of [60, 110, 160]) { c.beginPath(); c.moveTo(x, 64); c.lineTo(x, 136); c.strokeStyle = '#a0c0f0'; c.stroke(); }
  // the drum: four colour bands
  const bands = ['#ffd21a', '#ff3a3a', '#3ad24a', '#ff4ad0'];
  bands.forEach((col, n) => {
    const x0 = 190 + n * 44;
    c.beginPath(); c.moveTo(x0, 30); c.lineTo(x0 + 44, 26); c.lineTo(x0 + 44, 174); c.lineTo(x0, 170); c.closePath();
    const bgd = c.createLinearGradient(0, 26, 0, 174); bgd.addColorStop(0, '#ffffff'); bgd.addColorStop(0.25, col); bgd.addColorStop(1, '#3a1a2a');
    c.fillStyle = bgd; c.fill(); c.lineWidth = 3; c.strokeStyle = '#1a0a1a'; c.stroke();
  });
  // the muzzle: a grey ring with the pencil tips round it
  c.beginPath(); c.ellipse(376, 100, 26, 76, 0, 0, Math.PI * 2); c.fillStyle = '#c8ccd8'; c.fill(); c.lineWidth = 4; c.strokeStyle = '#1a1a2a'; c.stroke();
  for (let n = 0; n < 6; n++) {
    const a = n / 6 * Math.PI * 2, py = 100 + Math.sin(a) * 50, px = 380 + Math.cos(a) * 12;
    c.beginPath(); c.moveTo(px, py - 9); c.lineTo(px + 34, py); c.lineTo(px, py + 9); c.closePath();
    c.fillStyle = `#${PAPELIN_COLORS[n].toString(16).padStart(6, '0')}`; c.fill(); c.lineWidth = 2.5; c.strokeStyle = '#1a0a1a'; c.stroke();
  }
}

/** a coloured pencil, the shot of the drum; 60×16 pointing right */
const pencilTex = (scene: S) => canvasTex(scene, 'papelin-pencil', 60, 16, (c) => {
  c.fillStyle = '#ffffff'; c.fillRect(0, 2, 44, 12);
  c.beginPath(); c.moveTo(44, 2); c.lineTo(60, 8); c.lineTo(44, 14); c.closePath(); c.fill();
});
const headTex = (scene: S) => canvasTex(scene, 'papelin-head2', 340, 320, (c) => drawHead(c));
const bodyTex = (scene: S) => canvasTex(scene, 'papelin-body2', 460, 420, (c) => drawBody(c));
const gunTex = (scene: S) => canvasTex(scene, 'papelin-gun', 420, 200, (c) => drawGun(c));

export interface ColorHooks {
  /** up to n targets near the keeper: the rivals' shots first, then the nearest rivals */
  pick: (n: number) => { x: number; y: number; hit: () => void }[];
  /** the colour storm swallows the rivals' shots within r of (x, y); heals the team */
  onClear: (x: number, y: number, r: number) => void;
}
/** times of the scene, ms */
export const COLOR_MS = { rise: 300, aim: 1150, fire: 1500, total: 3200 };
/** shots of the drum and the reach of the clear, by level */
export const colorSize = (level: number) => ({ shots: 8 + level * 2, clear: 300 + level * 15 });

/** Descarga de colores. (x, y) the keeper's feet. Visual only: the scene deals the damage in the hooks. */
export function colorBurst(scene: S, x: number, y: number, level: number, hooks: ColorHooks) {
  const cam = scene.cameras.main, view = () => cam.worldView;
  const live: Phaser.GameObjects.GameObject[] = [];
  const keep = <T extends Phaser.GameObjects.GameObject>(o: T) => { live.push(o); return o; };
  const dim = keep(scene.add.rectangle(view().centerX, view().centerY, view().width * 2, view().height * 2, 0x062a0a, 1).setDepth(D.dim).setAlpha(0));
  scene.tweens.add({ targets: dim, alpha: 0.55, duration: 240 });
  // the whirl of green light round the keeper (the scene's green swirl)
  const whirl = keep(scene.add.graphics().setDepth(D.aura).setBlendMode(Phaser.BlendModes.ADD));
  // ---- Papelín: rises behind the keeper, gun arm out to his right
  const H = 760, gs = (view().height * 0.7) / H, wx = x, wy = Math.max(y + 10, view().top + H * gs + 4);
  const aura = keep(scene.add.graphics().setDepth(D.giant - 1).setBlendMode(Phaser.BlendModes.ADD));
  const spirit = keep(scene.add.container(wx, wy).setDepth(D.giant).setScale(gs * 0.3).setAlpha(0));
  const body = scene.add.image(0, -20, bodyTex(scene)).setOrigin(0.5, 1);
  const gun = scene.add.image(150, -330, gunTex(scene)).setOrigin(20 / 420, 0.5).setAngle(40);
  const head = scene.add.image(0, -380, headTex(scene)).setOrigin(0.5, 250 / 320);
  spirit.add([body, gun, head]);
  try { spirit.postFX?.addGlow(GREEN, 3, 0, false, 0.1, 10); } catch { /* canvas renderer: no glow */ }
  scene.tweens.add({ targets: spirit, alpha: 1, scaleX: gs, scaleY: gs, delay: COLOR_MS.rise, duration: 460, ease: 'Back.easeOut' });
  // he lifts the gun: from down at his side to level, pointing at the field
  scene.tweens.add({ targets: gun, angle: -12, delay: COLOR_MS.aim - 300, duration: 340, ease: 'Back.easeOut' });
  const t0 = scene.time.now;
  let spin = 0;
  const tick = () => {
    if (!spirit.active) { scene.events.off('update', tick); return; }
    const t = (scene.time.now - t0) / 1000;
    dim.setPosition(view().centerX, view().centerY);
    head.setAngle(Math.sin(t * 2) * 2);
    body.setScale(1, 1 + Math.sin(t * 3) * 0.01);
    gun.setScale(1, 1 + spin * 0.04 * Math.sin(t * 60)); // the drum shudders while it fires
    whirl.clear();
    const wr = 34 + Math.min(1, t * 2) * 50;
    for (let n = 0; n < 7; n++) { // green arcs sweeping round the keeper
      const a0 = t * (5 + n * 0.6) + n * 0.9, r = wr * (0.6 + n * 0.08);
      whirl.lineStyle(3 + (n % 3), n % 2 ? GREEN : GREEN2, 0.75).beginPath();
      for (let u = 0; u <= 1.6; u += 0.1) { const a = a0 + u; const px = x + Math.cos(a) * r, py = y - 20 + Math.sin(a) * r * 0.55 - u * 10; if (u === 0) whirl.moveTo(px, py); else whirl.lineTo(px, py); }
      whirl.strokePath();
    }
    aura.clear();
    if (spirit.alpha > 0.05) {
      const sc = spirit.scaleX, cx = spirit.x, cy = spirit.y - 360 * sc;
      for (let n = 0; n < 18; n++) {
        const a = n / 18 * Math.PI * 2 + t * 0.6, L = (420 + Math.sin(t * 6 + n * 1.7) * 50) * sc;
        const nx = -Math.sin(a) * 40 * sc, ny = Math.cos(a) * 40 * sc;
        aura.fillStyle(n % 2 ? GREEN : 0x2ad04a, 0.18 * spirit.alpha).fillTriangle(cx + nx, cy + ny, cx - nx, cy - ny, cx + Math.cos(a) * L, cy + Math.sin(a) * L);
      }
    }
  };
  scene.events.on('update', tick);
  // ---- the reticles lock on, then the drum fires
  const { shots, clear } = colorSize(level);
  const targets = hooks.pick(shots);
  const marks: Phaser.GameObjects.Graphics[] = [];
  scene.time.delayedCall(COLOR_MS.aim, () => {
    if (!spirit.active) return;
    targets.forEach((q, i) => scene.time.delayedCall(i * 30, () => {
      const g = keep(scene.add.graphics().setDepth(D.fx).setPosition(q.x, q.y).setScale(2.2).setAlpha(0));
      g.lineStyle(3, CYAN, 1).strokeCircle(0, 0, 16).lineBetween(-24, 0, -10, 0).lineBetween(10, 0, 24, 0).lineBetween(0, -24, 0, -10).lineBetween(0, 10, 0, 24);
      g.fillStyle(0xff3a3a, 1).fillTriangle(-6, -30, 6, -30, 0, -21); // the red marker over the lock
      scene.tweens.add({ targets: g, scale: 1, alpha: 1, angle: 90, duration: 220, ease: 'Back.easeOut' });
      marks.push(g);
    }));
  });
  scene.time.delayedCall(COLOR_MS.fire, () => {
    if (!spirit.active) return;
    spin = 1;
    cam.shake(900, 0.005);
    const muzzle = () => { const a = Phaser.Math.DegToRad(gun.angle), sc = spirit.scaleX; return { mx: spirit.x + (150 + Math.cos(a) * 400) * sc, my: spirit.y + (-330 + Math.sin(a) * 400) * sc }; };
    const list = targets.length ? targets : [];
    const n = Math.max(list.length, 6), gap = Math.min(95, 1150 / n); // the whole burst fits in the scene at any level
    for (let i = 0; i < n; i++) scene.time.delayedCall(i * gap, () => {
      const col = PAPELIN_COLORS[i % PAPELIN_COLORS.length], q = list[i % Math.max(1, list.length)];
      const { mx, my } = muzzle();
      const tx = q ? q.x : mx + rnd(120, 260), ty = q ? q.y : my + rnd(-80, 80);
      const p = scene.add.image(mx, my, pencilTex(scene)).setTint(col).setDepth(D.fx + 1).setScale(1.2).setRotation(Math.atan2(ty - my, tx - mx));
      const flash = scene.add.circle(mx, my, 14, col, 0.9).setDepth(D.fx).setBlendMode(Phaser.BlendModes.ADD);
      scene.tweens.add({ targets: flash, scale: 2, alpha: 0, duration: 160, onComplete: () => flash.destroy() });
      scene.tweens.add({ targets: p, x: tx, y: ty, duration: 220, ease: 'Quad.easeIn', onComplete: () => {
        p.destroy();
        if (q && i < list.length) q.hit();
        // a splash of its colour: a blot and drops flying out
        const blot = scene.add.circle(tx, ty, 10, col, 0.95).setDepth(D.fx);
        scene.tweens.add({ targets: blot, scale: 3, alpha: 0, duration: 320, onComplete: () => blot.destroy() });
        for (let d = 0; d < 6; d++) {
          const a = rnd(0, Math.PI * 2), drop = scene.add.circle(tx, ty, rnd(2, 4), col, 1).setDepth(D.fx);
          scene.tweens.add({ targets: drop, x: tx + Math.cos(a) * rnd(24, 50), y: ty + Math.sin(a) * rnd(16, 36), alpha: 0, duration: rnd(260, 380), onComplete: () => drop.destroy() });
        }
        if (marks[i]) fade(scene, marks[i], 0, 160);
      } });
    });
    // the burst of colours round the keeper: it swallows the rivals' shots
    scene.time.delayedCall(n * gap + 160, () => {
      spin = 0;
      hooks.onClear(x, y, clear);
      cam.flash(180, 255, 255, 255);
      PAPELIN_COLORS.forEach((col, k) => {
        const ring = scene.add.ellipse(x, y - 10, clear * 0.3, clear * 0.18).setStrokeStyle(6, col, 1).setDepth(D.fx - 1);
        scene.tweens.add({ targets: ring, scale: 3.4, alpha: 0, delay: k * 50, duration: 560, ease: 'Cubic.easeOut', onComplete: () => ring.destroy() });
      });
    });
    scene.time.delayedCall(n * gap + 400, () => { if (spirit.active) scene.tweens.add({ targets: spirit, alpha: 0, y: spirit.y - 20, duration: 520, ease: 'Cubic.easeIn' }); });
  });
  const end = COLOR_MS.total;
  scene.time.delayedCall(end - 420, () => { for (const o of live) if (o !== dim && o.active) fade(scene, o, 0, 400); });
  scene.tweens.add({ targets: dim, alpha: 0, delay: end - 400, duration: 380, onComplete: () => dim.destroy() });
  scene.time.delayedCall(end, () => scene.events.off('update', tick));
}
