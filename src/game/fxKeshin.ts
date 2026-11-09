/**
 * Warrior spirits (EG, espíritus guerreros), drawn by hand on canvas, and their techniques.
 *
 * Hacha del Azote Negro (author, from its scene): a storm vortex opens in the sky, the giant axe drops out of it and
 * buries itself beside the player, Dark Exodus rises from the dust in a crimson-magenta aura, the player leaps and
 * strikes the ball as the spirit swings the axe down: the blow blows up the ground in magenta and a huge beam of
 * magenta light runs across the pitch to the target.
 */
import Phaser from 'phaser';

type S = Phaser.Scene;
const AIR = 8900;
/** layers of the scene, back to front: the darkened pitch, the storm, the spirit and its axe, then the player (the scene
 * lifts him to CAST_DEPTH while the game is stopped) and the blow */
export const CAST_DEPTH = AIR - 15;
export const D = { dim: AIR - 40, vortex: AIR - 36, aura: AIR - 34, tendrils: AIR - 33, giant: AIR - 32, held: AIR - 31, fall: AIR - 30, fx: AIR - 5 };
const MAG = 0xff2a9a, MAG2 = 0xff7ad0, CRIMSON = 0xd0103a, VIOLET = 0x8a3aff;
export const rnd = (a: number, b: number) => a + Math.random() * (b - a);
export const fade = (scene: S, o: Phaser.GameObjects.GameObject, delay: number, dur = 220) =>
  scene.tweens.add({ targets: o, alpha: 0, delay, duration: dur, onComplete: () => o.destroy() });

/** a canvas texture drawn once per scene (2× resolution: shown at half scale, so it stays sharp when zoomed) */
export function canvasTex(scene: S, key: string, w: number, h: number, draw: (c: CanvasRenderingContext2D) => void) {
  const k = `eg:${key}`;
  if (!scene.textures.exists(k)) {
    const t = scene.textures.createCanvas(k, w, h);
    if (t) { draw(t.getContext()); t.refresh(); }
  }
  return k;
}

// ------------------------------------------------------------------ Dark Exodus, in parts so it can move
/*
 * Drawn on the body's frame (260×300, feet at the bottom middle): the mane is its own layer (it flows), the right arm
 * too (it lifts the axe, winds up and chops), the rest is the body (it breathes and leans into the blow).
 */
const HEAD = { x: 130, y: 84 }, SHOULDER = { x: 200, y: 120 }, ARM_LEN = 124;

function drawMane(c: CanvasRenderingContext2D, hx: number, hy: number) {
  const blade = (bx: number, by: number, ex: number, ey: number, w: number, col: string) => {
    c.beginPath(); c.moveTo(bx - w, by);
    c.quadraticCurveTo((bx + ex) / 2 - w * 1.4, (by + ey) / 2 - w, ex, ey);
    c.quadraticCurveTo((bx + ex) / 2 + w * 1.4, (by + ey) / 2 + w * 0.4, bx + w, by); c.closePath();
    c.fillStyle = col; c.fill(); c.lineWidth = 3; c.strokeStyle = '#1a1622'; c.stroke();
  };
  const dx = hx - 130, dy = hy - 74; // the blades were laid out round a head at (130, 74)
  c.shadowColor = '#ff2a9a'; c.shadowBlur = 18;
  for (const [ex, ey, w, col] of [[18, 40, 13, '#8a8f9e'], [242, 44, 13, '#8a8f9e'], [6, 92, 12, '#6e7484'], [254, 96, 12, '#6e7484'], [40, 6, 12, '#d8dce6'], [220, 8, 12, '#d8dce6']] as const) blade(130 + dx, 74 + dy, ex + dx, ey + dy, w, col);
  c.shadowBlur = 0;
  for (const [ex, ey, w, col] of [[86, -2, 10, '#c8102e'], [174, -2, 10, '#c8102e'], [62, 14, 9, '#f4f6fa'], [198, 16, 9, '#f4f6fa'], [108, 2, 8, '#f4f6fa'], [152, 2, 8, '#f4f6fa']] as const) blade(130 + dx, 70 + dy, ex + dx, ey + dy, w, col);
}

function drawBody(c: CanvasRenderingContext2D) {
  const cx = 130;
  c.lineCap = 'round';
  const skin = c.createLinearGradient(0, 100, 0, 260); skin.addColorStop(0, '#5a5664'); skin.addColorStop(1, '#2c2934');
  c.fillStyle = skin; c.strokeStyle = '#120f18'; c.lineWidth = 4;
  const ell = (x: number, y: number, rx: number, ry: number, rot = 0) => { c.beginPath(); c.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2); c.fill(); c.stroke(); };
  ell(cx - 66, 126, 30, 24, -0.3); ell(cx + 66, 126, 30, 24, 0.3); // shoulders
  ell(cx - 84, 172, 16, 40, 0.15); // the left arm, down
  c.beginPath(); c.moveTo(cx - 62, 112); c.quadraticCurveTo(cx - 70, 200, cx - 34, 236); c.lineTo(cx + 34, 236); c.quadraticCurveTo(cx + 70, 200, cx + 62, 112); c.closePath(); c.fill(); c.stroke();
  c.strokeStyle = '#17141d'; c.lineWidth = 3; // muscles and dark tattoo lines
  c.beginPath(); c.moveTo(cx, 126); c.lineTo(cx, 226); c.moveTo(cx - 44, 150); c.quadraticCurveTo(cx - 20, 164, cx, 152); c.quadraticCurveTo(cx + 20, 164, cx + 44, 150);
  for (const y of [180, 200, 218]) { c.moveTo(cx - 22, y); c.lineTo(cx + 22, y); }
  c.moveTo(cx - 54, 124); c.lineTo(cx - 36, 140); c.moveTo(cx + 54, 124); c.lineTo(cx + 36, 140); c.stroke();
  c.fillStyle = '#6e6a7a'; for (const s of [-1, 1]) { c.beginPath(); c.ellipse(cx + s * 24, 140, 18, 9, s * 0.2, 0, Math.PI * 2); c.fill(); }
  c.fillStyle = '#9a5aff'; c.fillRect(cx - 98, 196, 28, 8); c.fillStyle = '#2c2934'; c.strokeStyle = '#120f18'; c.lineWidth = 4; c.beginPath(); c.arc(cx - 84, 216, 13, 0, Math.PI * 2); c.fill(); c.stroke();
  c.lineWidth = 3; c.beginPath(); c.ellipse(cx, 136, 14, 17, 0, 0, Math.PI * 2); c.stroke(); // the setting of the gem (the gem itself glows on top)
  c.fillStyle = '#1e1a26'; c.fillRect(cx - 40, 234, 80, 14); // belt, violet gem, skirt
  c.beginPath(); c.moveTo(cx - 40, 248); c.lineTo(cx - 52, 298); c.lineTo(cx + 52, 298); c.lineTo(cx + 40, 248); c.closePath(); c.fillStyle = '#2a2632'; c.fill(); c.stroke();
  c.shadowColor = '#b06aff'; c.shadowBlur = 12; c.fillStyle = '#b06aff';
  c.beginPath(); c.moveTo(cx, 232); c.lineTo(cx + 10, 241); c.lineTo(cx, 250); c.lineTo(cx - 10, 241); c.closePath(); c.fill(); c.shadowBlur = 0;
  for (const s of [-1, 1]) { // the white horns that curl round the face
    c.beginPath(); c.moveTo(cx + s * 12, 70); c.bezierCurveTo(cx + s * 44, 40, cx + s * 40, 96, cx + s * 22, 112);
    c.lineWidth = 10; c.strokeStyle = '#1a1622'; c.stroke(); c.lineWidth = 6; c.strokeStyle = '#f4f6fa'; c.stroke();
  }
  c.strokeStyle = '#120f18'; c.lineWidth = 4; // head and the grey scarf (the eyes glow on top)
  c.fillStyle = '#3a3644'; c.beginPath(); c.ellipse(HEAD.x, HEAD.y, 22, 26, 0, 0, Math.PI * 2); c.fill(); c.stroke();
  c.fillStyle = '#6a7080'; c.beginPath(); c.moveTo(cx - 26, 86); c.quadraticCurveTo(cx, 120, cx + 26, 86); c.lineTo(cx + 30, 104); c.quadraticCurveTo(cx, 132, cx - 30, 104); c.closePath(); c.fill(); c.stroke();
  c.fillStyle = '#0c0a10'; for (const s of [-1, 1]) { c.beginPath(); c.moveTo(cx + s * 3, 77); c.lineTo(cx + s * 19, 72); c.lineTo(cx + s * 17, 84); c.closePath(); c.fill(); }
}

/** the right arm, straight up from the shoulder (at the bottom of the frame) to the fist */
function drawArm(c: CanvasRenderingContext2D, sx: number, sy: number) {
  const skin = c.createLinearGradient(sx - 20, 0, sx + 20, 0); skin.addColorStop(0, '#2c2934'); skin.addColorStop(0.5, '#5a5664'); skin.addColorStop(1, '#2c2934');
  c.fillStyle = skin; c.strokeStyle = '#120f18'; c.lineWidth = 4;
  c.beginPath(); c.ellipse(sx, sy - 34, 19, 38, 0, 0, Math.PI * 2); c.fill(); c.stroke(); // upper arm
  c.beginPath(); c.ellipse(sx, sy - 92, 15, 36, 0, 0, Math.PI * 2); c.fill(); c.stroke(); // forearm
  c.fillStyle = '#9a5aff'; c.fillRect(sx - 16, sy - 112, 32, 8); // bracelet
  c.fillStyle = '#3a3644'; c.beginPath(); c.arc(sx, sy - ARM_LEN, 15, 0, Math.PI * 2); c.fill(); c.stroke(); // fist
}

const maneTex = (scene: S) => canvasTex(scene, 'exodus-mane', 260, 160, (c) => drawMane(c, 130, 120));
const bodyTex = (scene: S) => canvasTex(scene, 'exodus-body', 260, 300, (c) => drawBody(c));
const armTex = (scene: S) => canvasTex(scene, 'exodus-arm', 60, 150, (c) => drawArm(c, 30, 142));

/**
 * the axe, after the author's references: almost a sword. A very long blade, as tall as the spirit, black with a broad
 * neon violet rim and a violet line inside following its shape, wide by the guard with an angular hook and tapering to a
 * point, a small C mark half-way; the grip wrapped in blue. The grip is at the bottom of the frame (AXE_GRIP) and the
 * blade runs up from it; the spirit holds it high and lets it hang point-down beside him.
 */
const AXE_W = 170, AXE_H = 540, AXE_GRIP = { x: 40, y: 486 };
/** middle of the blade, from the grip, in the frame's pixels (for the trail of the edge) */
const AXE_BLADE = { x: 40, y: -250 };
const axeTex = (scene: S) => canvasTex(scene, 'exodus-axe5', AXE_W, AXE_H, (c) => {
  const sx = AXE_GRIP.x, guard = 452;
  // the grip: blue wrapping, violet rings, a small dark pommel
  c.fillStyle = '#1a1822'; c.fillRect(sx - 9, guard, 18, 80);
  c.fillStyle = '#2a6ab8'; for (let y = guard + 6; y < 528; y += 11) { c.save(); c.translate(sx, y); c.rotate(-0.45); c.fillRect(-12, -3.5, 24, 7); c.restore(); }
  c.fillStyle = '#6ab0ff'; for (let y = guard + 10; y < 528; y += 22) { c.save(); c.translate(sx, y); c.rotate(-0.45); c.fillRect(-10, -1, 20, 2); c.restore(); }
  c.fillStyle = '#9a5aff'; c.fillRect(sx - 13, guard - 4, 26, 9); c.fillRect(sx - 11, 528, 22, 9);
  // the blade: straight spine along the grip's line, the edge outside, wide by the guard (with its hook), to a point
  const blade = () => {
    c.beginPath();
    c.moveTo(sx - 8, guard - 4);                       // spine, by the guard
    c.lineTo(sx - 10, 120);                            // up the spine
    c.lineTo(sx + 6, 8);                               // the point
    c.quadraticCurveTo(sx + 70, 150, sx + 84, 300);    // the long edge, slightly convex
    c.lineTo(sx + 118, 336);                           // the angular hook near the guard
    c.lineTo(sx + 96, 372);
    c.quadraticCurveTo(sx + 104, 420, sx + 70, guard - 4);
    c.closePath();
  };
  c.shadowColor = '#9a4aff'; c.shadowBlur = 22; blade(); c.fillStyle = '#8a4ae8'; c.fill(); c.shadowBlur = 0; // the violet rim
  c.save(); c.translate(sx + 30, 260); c.scale(0.72, 0.93); c.translate(-(sx + 30), -260); blade(); c.fillStyle = '#100e16'; c.fill(); c.restore(); // the black face
  c.lineWidth = 3; c.strokeStyle = '#0a0810'; blade(); c.stroke();
  // the violet line inside, following the shape, and a light glint on the edge
  c.lineWidth = 5; c.strokeStyle = '#7a3ad8'; c.beginPath(); c.moveTo(sx + 8, 60); c.quadraticCurveTo(sx + 56, 170, sx + 62, 300); c.lineTo(sx + 84, 334); c.lineTo(sx + 70, 364); c.quadraticCurveTo(sx + 76, 410, sx + 52, 440); c.stroke();
  c.lineWidth = 2; c.strokeStyle = '#efe0ff'; c.beginPath(); c.moveTo(sx + 10, 16); c.quadraticCurveTo(sx + 72, 150, sx + 82, 290); c.stroke();
  // the small C mark half-way
  c.lineWidth = 5; c.strokeStyle = '#b07aff'; c.beginPath(); c.arc(sx + 30, 250, 13, 0.4, Math.PI * 1.7); c.stroke();
  c.lineWidth = 3; c.beginPath(); c.arc(sx + 30, 250, 5, 0.4, Math.PI * 1.7); c.stroke();
});

/** the storm vortex in the sky: dark clouds turning round a black hole */
const vortexTex = (scene: S) => canvasTex(scene, 'exodus-vortex', 240, 150, (c) => {
  const g = c.createRadialGradient(120, 75, 4, 120, 75, 118);
  g.addColorStop(0, '#000000'); g.addColorStop(0.12, '#120c1c'); g.addColorStop(0.5, '#3a3a4a'); g.addColorStop(1, 'rgba(60,60,80,0)');
  c.fillStyle = g; c.beginPath(); c.ellipse(120, 75, 118, 72, 0, 0, Math.PI * 2); c.fill();
  c.lineCap = 'round';
  for (let k = 0; k < 7; k++) {
    c.beginPath();
    for (let a = 0; a < Math.PI * 3.2; a += 0.08) {
      const r = 8 + a * 10 + k * 3, x = 120 + Math.cos(a + k * 0.9) * r, y = 75 + Math.sin(a + k * 0.9) * r * 0.6;
      if (a === 0) c.moveTo(x, y); else c.lineTo(x, y);
    }
    c.lineWidth = 3 + (k % 3); c.strokeStyle = k % 2 ? 'rgba(150,150,170,.55)' : 'rgba(90,80,110,.6)'; c.stroke();
  }
  c.fillStyle = '#000'; c.beginPath(); c.ellipse(120, 75, 12, 8, 0, 0, Math.PI * 2); c.fill();
  c.strokeStyle = 'rgba(176,106,255,.8)'; c.lineWidth = 2; c.beginPath(); c.ellipse(120, 75, 14, 9, 0, 0, Math.PI * 2); c.stroke();
});

/**
 * (author: "que salga el típico banner en grande diciendo el nombre") the big banner of an ultimate, over the game:
 * a slanted band that sweeps in, the warrior spirit's portrait, its name and the technique's name in huge letters.
 * DOM over the canvas, so it is sharp at any zoom; it removes itself.
 */
/** 2.0 (author: «que en el banner salga el mugshot del EG, no el modelo»): the spirits' portraits, set by the app when a
 *  run starts (manifest.eg.spirits) */
let EG_ART: Record<string, string> = {};
export function setEgArt(art: Record<string, string>) { EG_ART = art; }

/** `spiritId`: the warrior spirit (its portrait from EG_ART); `color`: its colour, for the banners without a theme of their own */
export function ultBanner(scene: S, name: string, spirit: string, spiritId: string, ms = 1500, theme = '', color = '') {
  const canvas = scene.game.canvas, r = canvas.getBoundingClientRect();
  const el = document.createElement('div');
  el.className = `ult-banner${theme ? ` ub-${theme}` : color ? ' ub-kc' : ''}`; // 2.0: each spirit's colours (styleKeshin.css)
  el.style.cssText = `left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height}px;--ms:${ms}ms${color ? `;--kc:${color}` : ''}`;
  const art = EG_ART[spiritId] ?? '';
  el.innerHTML = `<i class="ub-speed"></i><div class="ub-band"><i class="ub-lines"></i>${art ? `<span class="ub-art"><img src="${art}" alt=""></span>` : ''}
    <div class="ub-tx"><small>ESPÍRITU GUERRERO · ${spirit}</small><b>${name}</b></div></div><i class="ub-flash"></i>`;
  document.body.appendChild(el);
  window.setTimeout(() => el.remove(), ms + 400);
}

export interface AxeHooks {
  /** the axe hits the ground in front of the player */
  onImpact: (x: number, y: number) => void;
  /** the axe lands out of the storm beside the player: a first, smaller impact around it */
  onDrop: (x: number, y: number) => void;
  /** the beam (with the kicked ball at its head) runs from (x0, y0) to (x1, y1), `width` wide */
  onBeam: (x0: number, y0: number, x1: number, y1: number, width: number) => void;
  /** the cut the axe leaves on the ground along the beam keeps burning for `ms` */
  onScar: (x0: number, y0: number, x1: number, y1: number, width: number, ms: number) => void;
  /** where the player is now (the spirit stays behind him) */
  at: () => { x: number; y: number };
}

/** times of the scene, ms (the player's leap is timed against them) */
export const AXE_MS = { rise: 540, leap: 960, windup: 1060, strike: 1250, impact: 1340, total: 3100, scar: 1800 };

/**
 * Hacha del Azote Negro. (x, y) the player's feet, (tx, ty) the target. Visual only: the scene deals the damage in
 * the hooks.
 */
export function blackAxeStrike(scene: S, x: number, y: number, tx: number, ty: number, level: number, hooks: AxeHooks) {
  const k = 1 + level * 0.05, side = tx >= x ? 1 : -1, cam = scene.cameras.main;
  const view = () => cam.worldView;
  const live: Phaser.GameObjects.GameObject[] = [];
  const keep = <T extends Phaser.GameObjects.GameObject>(o: T) => { live.push(o); return o; };
  // the sky darkens and a storm opens above
  const dim = keep(scene.add.rectangle(view().centerX, view().centerY, view().width * 2, view().height * 2, 0x1a0820, 1).setDepth(D.dim).setAlpha(0));
  scene.tweens.add({ targets: dim, alpha: 0.6, duration: 260 });
  const vx = x - side * 14, vy = Math.max(view().top + 40, y - 104);
  const vortex = keep(scene.add.image(vx, vy, vortexTex(scene)).setDepth(D.vortex).setScale(0.05).setAlpha(0));
  scene.tweens.add({ targets: vortex, scale: 0.42 * k, alpha: 0.95, duration: 320, ease: 'Cubic.easeOut' });
  scene.tweens.add({ targets: vortex, angle: 420, duration: AXE_MS.total });
  // lightning in the storm
  for (let n = 0; n < 4; n++) scene.time.delayedCall(120 + n * 260, () => {
    if (!vortex.active) return;
    const g = scene.add.graphics().setDepth(D.vortex + 1);
    let px = vx + rnd(-30, 30), py = vy;
    g.lineStyle(2, n % 2 ? 0xffffff : MAG2, 0.95).beginPath().moveTo(px, py);
    for (let s = 0; s < 5; s++) { px += rnd(-10, 10); py += rnd(6, 12); g.lineTo(px, py); }
    g.strokePath(); fade(scene, g, 60, 120);
  });
  // the axe drops out of the storm and buries itself beside the player
  const ax = x - side * 26 * k, ay = y + 4;
  const fall = scene.add.image(vx, vy, axeTex(scene)).setOrigin(AXE_GRIP.x / AXE_W + 0.04, 0.03).setDepth(D.fall).setScale(0.12).setAlpha(0).setAngle(180 + side * 20).setFlipX(side < 0);
  scene.tweens.add({ targets: fall, alpha: 1, scale: 0.3 * k, delay: 220, duration: 120 });
  scene.tweens.add({ targets: fall, x: ax, y: ay, angle: 180, delay: 260, duration: 260, ease: 'Quad.easeIn', onComplete: () => {
    hooks.onDrop(ax, ay);
    cam.shake(200, 0.009);
    const ring = scene.add.ellipse(ax, ay, 30 * k, 14 * k).setStrokeStyle(4, MAG2, 1).setDepth(D.fx - 1);
    scene.tweens.add({ targets: ring, scale: 3.4, alpha: 0, duration: 420, ease: 'Cubic.easeOut', onComplete: () => ring.destroy() });
    for (let n = 0; n < 8; n++) { const a = (n / 8) * Math.PI * 2, cr = scene.add.rectangle(ax, ay, 3, 2, 0x5a0a3a, 0.8).setOrigin(0, 0.5).setRotation(a).setDepth(ay + 1); scene.tweens.add({ targets: cr, displayWidth: rnd(12, 24) * k, duration: 120, onComplete: () => fade(scene, cr, 500, 300) }); }
    for (let n = 0; n < 16; n++) { // a ring of dust and stones
      const a = (n / 16) * Math.PI * 2, d = scene.add.circle(ax, ay, rnd(7, 13) * k, n % 3 ? 0x8a7a66 : 0xb8aa94, 0.85).setDepth(D.fx - 2);
      scene.tweens.add({ targets: d, x: ax + Math.cos(a) * rnd(24, 44) * k, y: ay + Math.sin(a) * rnd(10, 20) * k - 6, scale: 1.8, alpha: 0, duration: rnd(520, 760), ease: 'Cubic.easeOut', onComplete: () => d.destroy() });
    }
    scene.time.delayedCall(AXE_MS.rise - 520 + 40, () => fade(scene, fall, 0, 120)); // the spirit takes it
  } });

  // ---- Dark Exodus, behind the player: body, mane, eyes, gem and the arm with the axe, all in one container
  const gs = 0.3 + level * 0.006, sgn = side; // mirrored when the target is to the left
  const spirit = keep(scene.add.container(x - side * 10, y + 14).setDepth(D.giant).setScale(0.1 * sgn, 0.1).setAlpha(0));
  const aura = scene.add.ellipse(0, -150, 230, 360, MAG, 1).setAlpha(0);
  const mane = scene.add.image(0, -226, maneTex(scene)).setOrigin(0.5, 120 / 160);
  const body = scene.add.image(0, 0, bodyTex(scene)).setOrigin(0.5, 1);
  const eyes = scene.add.graphics();
  eyes.fillStyle(0xffe24a, 1);
  for (const s of [-1, 1]) eyes.fillTriangle(s * 4, -222, s * 17, -226, s * 15, -218);
  const eyeGlow = scene.add.ellipse(0, -222, 52, 16, 0xffd23f, 0.35);
  const gem = scene.add.ellipse(0, -164, 18, 24, 0xff2a3a, 1);
  const gemGlow = scene.add.circle(0, -164, 22, 0xff2040, 0.35);
  const arm = scene.add.container(SHOULDER.x - 130, SHOULDER.y - 300);
  const armImg = scene.add.image(0, 0, armTex(scene)).setOrigin(0.5, 142 / 150);
  const AXE_S = 0.62; // about as tall as the spirit, as in the scene
  const axe = scene.add.image(0, -ARM_LEN, axeTex(scene)).setOrigin(AXE_GRIP.x / AXE_W, AXE_GRIP.y / AXE_H).setScale(AXE_S).setAlpha(0).setAngle(155).setFlipX(true);
  // resting, as in the references: the fist up by the head, the blade hanging point-down beside him, edge outwards
  arm.add([axe, armImg]).setAngle(25);
  spirit.add([aura, mane, body, arm, gemGlow, gem, eyeGlow, eyes]);
  const tendrils = keep(scene.add.graphics().setDepth(D.tendrils));
  const smear = keep(scene.add.graphics().setDepth(D.fx - 3)); // the trail of the axe's edge during the chop
  const tips: { x: number; y: number }[] = [];
  /** world position of the axe's blade (for the smear) */
  const tip = () => {
    const rot = (x0: number, y0: number, deg: number) => { const r = Phaser.Math.DegToRad(deg), c = Math.cos(r), n = Math.sin(r); return [x0 * c - y0 * n, x0 * n + y0 * c]; };
    const [bx, by] = rot(AXE_BLADE.x * AXE_S, AXE_BLADE.y * AXE_S, axe.angle); // the blade from the fist, in the arm's frame
    const [lx0, ly0] = rot(bx, by - ARM_LEN, arm.angle);
    const lx = arm.x + lx0, ly = arm.y + ly0;
    return { x: spirit.x + lx * spirit.scaleX, y: spirit.y + ly * spirit.scaleY };
  };
  let rising = false, chopping = false, swinging = false; // swinging: the arm is driven by its tweens, not the idle sway
  const t0 = scene.time.now;
  const tick = () => {
    if (!spirit.active) { scene.events.off('update', tick); return; }
    const t = (scene.time.now - t0) / 1000, p = hooks.at();
    spirit.x += (p.x - side * 10 - spirit.x) * 0.2; // stays right behind the player
    // breathing, the mane flowing, the eyes and the gem burning
    body.setScale(1, 1 + Math.sin(t * 4) * 0.015);
    mane.setAngle(Math.sin(t * 3.2) * 3 + (chopping ? 8 : 0)).setScale(1 + Math.sin(t * 5) * 0.03, 1 + Math.cos(t * 4) * 0.03);
    eyeGlow.setAlpha(0.25 + Math.abs(Math.sin(t * 7)) * 0.4);
    gemGlow.setScale(1 + Math.sin(t * 6) * 0.25).setAlpha(0.25 + Math.abs(Math.sin(t * 6)) * 0.3);
    aura.setScale(1 + Math.sin(t * 5) * 0.05, 1 + Math.cos(t * 4) * 0.04);
    if (rising && !swinging) arm.setAngle(arm.angle + (Math.sin(t * 2.4) * 2 + 25 - arm.angle) * 0.1);
    dim.setPosition(view().centerX, view().centerY);
    // crimson tendrils whipping round the spirit
    tendrils.clear();
    const a = Math.min(1, spirit.alpha * 1.2), sc = Math.abs(spirit.scaleX) / 0.3;
    for (let n = 0; n < 8; n++) {
      const base = (n / 8) * Math.PI * 2 + t * 0.8, len = (44 + (n % 3) * 16) * sc;
      const sx = spirit.x + Math.cos(base) * 16 * sc, sy = spirit.y - 60 * sc + Math.sin(base) * 24 * sc;
      tendrils.lineStyle(5 - (n % 3), n % 2 ? CRIMSON : MAG, 0.75 * a).beginPath().moveTo(sx, sy);
      for (let s = 1; s <= 8; s++) {
        const u = s / 8, w = Math.sin(t * 9 + n + u * 5) * 10 * u * sc;
        tendrils.lineTo(sx + Math.cos(base) * len * u - Math.sin(base) * w, sy + Math.sin(base) * len * u * 0.6 + Math.cos(base) * w - u * 20 * sc);
      }
      tendrils.strokePath();
    }
    // the smear behind the edge of the axe while it chops
    smear.clear();
    if (chopping) {
      tips.push(tip()); if (tips.length > 10) tips.shift();
      for (let n = 1; n < tips.length; n++) {
        const u = n / tips.length;
        smear.lineStyle(34 * u * sc, n % 2 ? MAG : MAG2, 0.7 * u).beginPath().moveTo(tips[n - 1].x, tips[n - 1].y).lineTo(tips[n].x, tips[n].y).strokePath();
        smear.lineStyle(8 * u * sc, 0xffffff, 0.9 * u).beginPath().moveTo(tips[n - 1].x, tips[n - 1].y).lineTo(tips[n].x, tips[n].y).strokePath();
      }
    }
  };
  scene.events.on('update', tick);
  // it rises from the dust and takes up the axe
  scene.time.delayedCall(AXE_MS.rise, () => {
    if (!spirit.active) return;
    rising = true;
    scene.tweens.add({ targets: spirit, alpha: 1, scaleX: gs * sgn, scaleY: gs, duration: 420, ease: 'Back.easeOut' });
    scene.tweens.add({ targets: aura, alpha: 0.3, duration: 300 });
    scene.tweens.add({ targets: axe, alpha: 1, delay: 160, duration: 120 });
    for (let n = 0; n < 14; n++) { // sparks of power flying up
      const s = scene.add.circle(x + rnd(-44, 44) * k, y - rnd(0, 40), rnd(1.5, 3), n % 2 ? MAG2 : 0xffffff, 1).setDepth(D.fx);
      scene.tweens.add({ targets: s, y: s.y - rnd(60, 130) * k, alpha: 0, delay: n * 25, duration: 620, onComplete: () => s.destroy() });
    }
  });
  // the player burns in magenta too, more and more until the kick
  const pAura = keep(scene.add.ellipse(x, y - 10, 26, 40, MAG, 1).setDepth(D.giant + 4).setAlpha(0));
  scene.tweens.add({ targets: pAura, alpha: 0.35, scaleX: 1.4, scaleY: 1.3, delay: AXE_MS.rise, duration: 380, yoyo: true, repeat: 2 });
  const pRing = keep(scene.add.ellipse(x, y + 2, 34, 12).setStrokeStyle(2, MAG2, 0.9).setDepth(D.giant + 3).setAlpha(0));
  scene.tweens.add({ targets: pRing, alpha: 1, scaleX: 1.5, scaleY: 1.5, delay: AXE_MS.rise, duration: 500, yoyo: true, repeat: 1 });
  scene.events.on('update', function follow() {
    if (!pAura.active) { scene.events.off('update', follow); return; }
    const p = hooks.at(); pAura.setPosition(p.x, p.y - 10); pRing.setPosition(p.x, p.y + 2);
  });
  // the ball: it rises with the leap and is kicked at the blow
  const ball = keep(scene.add.image(x + side * 6, y - 2, 'fx:ball').setDepth(D.fx + 1).setScale(0.9).setAlpha(0));
  const ballGlow = keep(scene.add.circle(ball.x, ball.y, 9, MAG, 0.6).setDepth(D.fx));
  ballGlow.setAlpha(0);
  scene.time.delayedCall(AXE_MS.leap, () => {
    ball.setAlpha(1); ballGlow.setAlpha(1);
    scene.tweens.add({ targets: [ball, ballGlow], y: y - 34, duration: 260, ease: 'Quad.easeOut', yoyo: true, hold: 60 });
    scene.tweens.add({ targets: ball, angle: 720, duration: 600 });
    const f = scene.add.circle(x, y - 12, 10, MAG, 0.85).setDepth(D.fx);
    scene.tweens.add({ targets: f, scale: 2.6, alpha: 0, duration: 340, onComplete: () => f.destroy() });
  });
  // the wind-up: the arm goes back behind the head, the spirit leans back
  scene.time.delayedCall(AXE_MS.windup, () => {
    if (!spirit.active) return;
    swinging = true;
    scene.tweens.add({ targets: arm, angle: -34, duration: AXE_MS.strike - AXE_MS.windup, ease: 'Back.easeIn' });
    // lifted over the head, turned in the hand so the edge leads the chop
    axe.setFlipX(false);
    scene.tweens.add({ targets: axe, angle: 25, duration: AXE_MS.strike - AXE_MS.windup, ease: 'Cubic.easeOut' });
    scene.tweens.add({ targets: spirit, angle: -side * 5, duration: AXE_MS.strike - AXE_MS.windup });
    const r = scene.add.circle(tip().x, tip().y, 6, 0xffffff, 0.9).setDepth(D.fx); // a glint on the edge
    scene.tweens.add({ targets: r, scale: 4, alpha: 0, duration: 260, onComplete: () => r.destroy() });
  });
  // the chop: the arm whips forward and down, the body leans into it
  const ang = Math.atan2(ty - y, tx - x);
  const ix = x + Math.cos(ang) * 46 * k, iy = y + Math.sin(ang) * 30 * k + 4;
  scene.time.delayedCall(AXE_MS.strike, () => {
    if (!spirit.active) return;
    chopping = true;
    scene.tweens.add({ targets: arm, angle: 150, duration: AXE_MS.impact - AXE_MS.strike, ease: 'Cubic.easeIn' });
    scene.tweens.add({ targets: axe, angle: 0, duration: AXE_MS.impact - AXE_MS.strike, ease: 'Cubic.easeIn' });
    scene.tweens.add({ targets: spirit, angle: side * 7, y: spirit.y + 8, duration: AXE_MS.impact - AXE_MS.strike, ease: 'Cubic.easeIn',
      onComplete: () => scene.tweens.add({ targets: spirit, angle: 0, y: spirit.y - 8, delay: 260, duration: 500, ease: 'Sine.easeOut' }) });
  });
  // the blow: the ground blows up, the banner, then the beam with the ball, the slash running ahead and the burning cut
  scene.time.delayedCall(AXE_MS.impact, () => {
    chopping = false; tips.length = 0;
    scene.time.delayedCall(700, () => { if (!axe.active) return; swinging = false; axe.setFlipX(true); scene.tweens.add({ targets: axe, angle: 155, duration: 520, ease: 'Sine.easeInOut' }); }); // back to hanging beside him // back on the back, the arm drops again
    hooks.onImpact(ix, iy);
    cam.shake(320, 0.012);
    const pillar = scene.add.ellipse(ix, iy - 30 * k, 54 * k, 130 * k, MAG, 0.85).setDepth(D.fx);
    scene.tweens.add({ targets: pillar, scaleX: 1.7, scaleY: 1.35, alpha: 0, duration: 560, ease: 'Cubic.easeOut', onComplete: () => pillar.destroy() });
    const core = scene.add.ellipse(ix, iy - 20 * k, 24 * k, 80 * k, 0xffffff, 0.95).setDepth(D.fx + 1);
    scene.tweens.add({ targets: core, scaleX: 2.2, alpha: 0, duration: 320, onComplete: () => core.destroy() });
    for (const [d, c] of [[0, MAG2], [90, 0xffffff], [180, MAG]] as const) {
      const ring = scene.add.ellipse(ix, iy, 40 * k, 18 * k).setStrokeStyle(5, c, 1).setDepth(D.fx - 1);
      scene.tweens.add({ targets: ring, scale: 4.6, alpha: 0, delay: d, duration: 560, ease: 'Cubic.easeOut', onComplete: () => ring.destroy() });
    }
    for (let c = 0; c < 10 + level; c++) { // rocks and magenta flames
      const a = (c / (10 + level)) * Math.PI * 2;
      const fl = scene.add.triangle(ix + Math.cos(a) * 14 * k, iy + Math.sin(a) * 8 * k, 0, 0, 8, 0, 4, -rnd(16, 30) * k, c % 2 ? MAG : CRIMSON, 0.9).setDepth(D.fx);
      scene.tweens.add({ targets: fl, y: fl.y - 20 * k, scaleY: 1.6, alpha: 0, duration: 520, onComplete: () => fl.destroy() });
      const rock = scene.add.rectangle(ix, iy - 6, rnd(4, 7), rnd(4, 7), 0x4a3a2a).setDepth(D.fx);
      scene.tweens.add({ targets: rock, x: ix + Math.cos(a) * rnd(40, 80) * k, y: iy - rnd(30, 70) * k, angle: rnd(-300, 300), alpha: 0, duration: 620, ease: 'Cubic.easeOut', onComplete: () => rock.destroy() });
    }
    const dist = Math.max(320, Math.hypot(tx - ix, ty - iy) + 120), bw = (44 + level * 4) * k;
    const bx1 = ix + Math.cos(ang) * dist, by1 = iy + Math.sin(ang) * dist;
    const nx = -Math.sin(ang), ny = Math.cos(ang);
    // the cut on the ground, from the blow forward: dark, with burning edges and embers, it stays a while
    hooks.onScar(ix, iy, bx1, by1, bw * 0.7, AXE_MS.scar);
    const scarGlow = scene.add.rectangle(ix, iy, dist, bw * 0.7, MAG, 0.45).setOrigin(0, 0.5).setRotation(ang).setDepth(iy + 1).setScale(0, 1);
    const scar = scene.add.rectangle(ix, iy, dist, bw * 0.28, 0x22000f, 0.95).setOrigin(0, 0.5).setRotation(ang).setDepth(iy + 2).setScale(0, 1);
    const scarCore = scene.add.rectangle(ix, iy, dist, 2, MAG2, 1).setOrigin(0, 0.5).setRotation(ang).setDepth(iy + 3).setScale(0, 1);
    scene.tweens.add({ targets: [scarGlow, scar, scarCore], scaleX: 1, duration: 300, ease: 'Cubic.easeOut' });
    scene.tweens.add({ targets: scarGlow, alpha: 0.2, duration: 260, yoyo: true, repeat: 3, delay: 300 });
    for (const o of [scarGlow, scar, scarCore]) fade(scene, o, AXE_MS.scar, 400);
    const embers = scene.time.addEvent({ delay: 70, repeat: Math.floor(AXE_MS.scar / 70), callback: () => {
      const u = Math.random(), e = scene.add.circle(ix + Math.cos(ang) * dist * u + nx * rnd(-4, 4), iy + Math.sin(ang) * dist * u + ny * rnd(-4, 4), rnd(1.5, 3), Math.random() < 0.5 ? MAG2 : 0xffd0f0, 1).setDepth(D.fx - 1);
      scene.tweens.add({ targets: e, y: e.y - rnd(14, 30), alpha: 0, duration: 520, onComplete: () => e.destroy() });
    } });
    scene.time.delayedCall(AXE_MS.scar + 400, () => embers.remove());
    // the slash wave: a crescent of light that runs forward along the cut, ahead of the beam
    const wave = scene.add.graphics().setDepth(D.fx + 1);
    const drawWave = (s: number, al: number) => {
      wave.clear();
      const R = 34 * k * s, a0 = ang - 1.1, a1 = ang + 1.1;
      wave.fillStyle(MAG, 0.75 * al).beginPath();
      wave.arc(0, 0, R, a0, a1, false); wave.arc(0, 0, R * 0.72, a1, a0, true); wave.closePath().fillPath();
      wave.lineStyle(3, 0xffffff, al).beginPath().arc(0, 0, R, a0 + 0.15, a1 - 0.15, false).strokePath();
    };
    drawWave(0.6, 1); wave.setPosition(ix, iy - 8);
    scene.tweens.addCounter({ from: 0, to: 1, duration: 300, ease: 'Quad.easeOut',
      onUpdate: (tw) => { const u = tw.getValue() ?? 0; wave.setPosition(ix + Math.cos(ang) * dist * u, iy - 8 + Math.sin(ang) * dist * u); drawWave(0.6 + u * 1.1, 1 - u * 0.5); },
      onComplete: () => fade(scene, wave, 0, 200) });
    // the ball is kicked: it flies at the head of the beam
    scene.tweens.killTweensOf([ball, ballGlow]);
    ball.setPosition(ix, iy - 10); ballGlow.setPosition(ix, iy - 10);
    let lastT = 0;
    scene.tweens.add({ targets: [ball, ballGlow], x: bx1, y: by1 - 8, duration: 240, ease: 'Cubic.easeOut',
      onUpdate: () => { if (scene.time.now - lastT > 16) { lastT = scene.time.now; const tr = scene.add.circle(ball.x, ball.y, 8 * k, MAG2, 0.7).setDepth(D.fx); scene.tweens.add({ targets: tr, scale: 0.2, alpha: 0, duration: 260, onComplete: () => tr.destroy() }); } },
      onComplete: () => { fade(scene, ball, 0, 120); fade(scene, ballGlow, 0, 120); } });
    // the beam of magenta light across the pitch
    scene.time.delayedCall(60, () => {
      hooks.onBeam(ix, iy, bx1, by1, bw);
      const beam = scene.add.rectangle(ix, iy - 8, dist, bw, MAG, 0.75).setOrigin(0, 0.5).setRotation(ang).setDepth(D.fx).setScale(0, 1);
      const inner = scene.add.rectangle(ix, iy - 8, dist, bw * 0.38, 0xffffff, 0.95).setOrigin(0, 0.5).setRotation(ang).setDepth(D.fx + 1).setScale(0, 1);
      const edge = scene.add.rectangle(ix, iy - 8, dist, bw * 1.6, VIOLET, 0.3).setOrigin(0, 0.5).setRotation(ang).setDepth(D.fx - 1).setScale(0, 1);
      scene.tweens.add({ targets: [beam, inner, edge], scaleX: 1, duration: 200, ease: 'Cubic.easeOut' });
      scene.tweens.add({ targets: [beam, inner, edge], scaleY: 0, alpha: 0, delay: 420, duration: 380, onComplete: () => { beam.destroy(); inner.destroy(); edge.destroy(); } });
      for (let n = 0; n < 14; n++) { // light rays thrown off the beam
        const u = rnd(0.1, 1), px = ix + Math.cos(ang) * dist * u, py = iy - 8 + Math.sin(ang) * dist * u;
        const r = scene.add.rectangle(px, py, rnd(40, 90) * k, 2, n % 2 ? MAG2 : 0xffffff, 0.9).setOrigin(0, 0.5).setRotation(ang + rnd(-0.9, 0.9)).setDepth(D.fx).setScale(0.1, 1);
        scene.tweens.add({ targets: r, scaleX: 1, alpha: 0, delay: 80 + n * 15, duration: 360, onComplete: () => r.destroy() });
      }
      scene.time.delayedCall(230, () => { // the far end blows up
        cam.shake(200, 0.008);
        for (const [d, s] of [[0, 3.4], [80, 2.2]] as const) {
          const boom = scene.add.circle(bx1, by1, 22 * k, d ? 0xffffff : MAG2, 0.9).setDepth(D.fx + 1);
          scene.tweens.add({ targets: boom, scale: s, alpha: 0, delay: d, duration: 440, onComplete: () => boom.destroy() });
        }
      });
    });
  });
  // the spirit, the axe and the storm go away
  const end = AXE_MS.total;
  for (const o of live) if (o !== dim) fade(scene, o, end - 420, 400);
  scene.tweens.add({ targets: dim, alpha: 0, delay: end - 400, duration: 380, onComplete: () => dim.destroy() });
  scene.time.delayedCall(end, () => scene.events.off('update', tick));
}

// ------------------------------------------------------------------ Pegaso alado: Rayo celeste
/*
 * Rayo celeste (author, from its scene in GO): a dribble. The player crackles with cyan lightning and Pegaso appears
 * behind him, red wings spread and the golden bands crossed on its chest; it flies up into the storm clouds over the
 * rival, draws back its fist and punches down: a huge cyan bolt falls on the rival and knocks him flying, the shock
 * runs along the ground to the ones nearby, and the ball goes past him in a streak of lightning.
 */
const CYAN = 0x5ef0ff, CYAN2 = 0xb8fbff, SKY = 0x2a8cff, PEG_RED = 0xd8222a;

/** one wing, the right one (mirrored for the left), its root at (0, 0): long red feathers in three rows */
function drawWing(c: CanvasRenderingContext2D) {
  c.lineJoin = 'round';
  const feather = (x: number, y: number, len: number, ang: number, w: number, col: string) => {
    c.save(); c.translate(x, y); c.rotate(ang);
    c.beginPath(); c.moveTo(0, -w); c.quadraticCurveTo(len * 0.6, -w * 1.3, len, 0); c.quadraticCurveTo(len * 0.6, w * 1.1, 0, w); c.closePath();
    c.fillStyle = col; c.fill(); c.lineWidth = 3; c.strokeStyle = '#3a0608'; c.stroke(); c.restore();
  };
  for (let n = 0; n < 7; n++) feather(10 + n * 14, 6 + n * 7, 120 - n * 6, -0.9 + n * 0.32, 13, n % 2 ? '#a8141c' : '#c41c24'); // long flight feathers
  for (let n = 0; n < 6; n++) feather(8 + n * 12, 2 + n * 5, 78 - n * 4, -0.7 + n * 0.3, 11, n % 2 ? '#e0323a' : '#f04a4a');
  for (let n = 0; n < 4; n++) feather(4 + n * 10, n * 4, 44, -0.5 + n * 0.3, 10, '#ff7a6a'); // the small coverts, lighter
  c.beginPath(); c.moveTo(-4, -8); c.quadraticCurveTo(50, -40, 96, -20); c.lineWidth = 9; c.strokeStyle = '#3a0608'; c.stroke(); c.lineWidth = 5; c.strokeStyle = '#ff9a8a'; c.stroke(); // the arm of the wing
}

/** Pegaso without its wings, on a 300×300 frame with its feet at the bottom middle */
function drawPegasus(c: CanvasRenderingContext2D) {
  const cx = 150;
  c.lineCap = 'round'; c.lineJoin = 'round'; c.strokeStyle = '#2a0e0a'; c.lineWidth = 4;
  const skin = c.createLinearGradient(0, 110, 0, 250); skin.addColorStop(0, '#f08a6a'); skin.addColorStop(1, '#b8503a');
  const ell = (x: number, y: number, rx: number, ry: number, col: string | CanvasGradient, rot = 0) => { c.beginPath(); c.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2); c.fillStyle = col; c.fill(); c.stroke(); };
  // arms, down by the body, fists closed, golden rings round the forearms
  for (const s of [-1, 1]) {
    ell(cx + s * 72, 168, 17, 40, skin, s * -0.2);
    ell(cx + s * 80, 214, 15, 20, '#f08a6a');
    c.lineWidth = 6; c.strokeStyle = '#7a5a00'; c.beginPath(); c.ellipse(cx + s * 76, 190, 20, 7, s * -0.2, 0, Math.PI * 2); c.stroke();
    c.lineWidth = 3.5; c.strokeStyle = '#ffd84a'; c.stroke(); c.lineWidth = 4; c.strokeStyle = '#2a0e0a';
  }
  // torso, the white cloth on the shoulders and the teal belt and shorts
  c.beginPath(); c.moveTo(cx - 56, 118); c.quadraticCurveTo(cx - 60, 196, cx - 34, 230); c.lineTo(cx + 34, 230); c.quadraticCurveTo(cx + 60, 196, cx + 56, 118); c.closePath(); c.fillStyle = skin; c.fill(); c.stroke();
  c.strokeStyle = '#8a3a2a'; c.lineWidth = 2.5; c.beginPath(); c.moveTo(cx, 130); c.lineTo(cx, 220); for (const y of [184, 202]) { c.moveTo(cx - 18, y); c.lineTo(cx + 18, y); } c.stroke();
  c.strokeStyle = '#2a0e0a'; c.lineWidth = 4;
  for (const s of [-1, 1]) { c.beginPath(); c.moveTo(cx + s * 30, 108); c.quadraticCurveTo(cx + s * 86, 104, cx + s * 92, 150); c.quadraticCurveTo(cx + s * 70, 140, cx + s * 46, 140); c.closePath(); c.fillStyle = '#f4f6f8'; c.fill(); c.stroke(); }
  c.fillStyle = '#1a9a9a'; c.fillRect(cx - 38, 228, 76, 14); c.strokeRect(cx - 38, 228, 76, 14);
  c.beginPath(); c.moveTo(cx - 38, 242); c.lineTo(cx - 48, 290); c.lineTo(cx - 6, 290); c.lineTo(cx, 260); c.lineTo(cx + 6, 290); c.lineTo(cx + 48, 290); c.lineTo(cx + 38, 242); c.closePath(); c.fillStyle = '#22b8b0'; c.fill(); c.stroke();
  // the golden bands crossed on the chest
  for (const s of [-1, 1]) {
    c.beginPath(); c.moveTo(cx - s * 54, 122); c.lineTo(cx + s * 44, 226);
    c.lineWidth = 15; c.strokeStyle = '#6a4a00'; c.stroke(); c.lineWidth = 10; c.strokeStyle = '#ffd23f'; c.stroke(); c.lineWidth = 3; c.strokeStyle = '#fff2a0'; c.stroke();
  }
  c.lineWidth = 4; c.strokeStyle = '#2a0e0a';
  // the head: the red crest behind, a white helmet with a beak-like front, the teal mask over the eyes
  c.beginPath(); c.moveTo(cx - 30, 30); c.quadraticCurveTo(cx - 52, 0, cx - 18, -6); c.lineTo(cx - 6, 10); c.lineTo(cx, -14); c.lineTo(cx + 6, 10); c.lineTo(cx + 18, -6); c.quadraticCurveTo(cx + 52, 0, cx + 30, 30); c.closePath();
  c.fillStyle = '#e8282e'; c.fill(); c.stroke();
  ell(cx, 74, 30, 34, '#f08a6a');
  c.beginPath(); c.moveTo(cx - 34, 70); c.quadraticCurveTo(cx - 36, 30, cx, 26); c.quadraticCurveTo(cx + 36, 30, cx + 34, 70); c.lineTo(cx + 20, 64); c.lineTo(cx, 96); c.lineTo(cx - 20, 64); c.closePath(); c.fillStyle = '#f4f6f8'; c.fill(); c.stroke();
  c.fillStyle = '#1aa8a8';
  for (const s of [-1, 1]) { c.beginPath(); c.moveTo(cx + s * 24, 62); c.lineTo(cx + s * 4, 68); c.lineTo(cx + s * 6, 76); c.lineTo(cx + s * 24, 70); c.closePath(); c.fill(); c.stroke(); }
  c.lineWidth = 3; c.beginPath(); c.moveTo(cx - 10, 94); c.quadraticCurveTo(cx, 100, cx + 10, 94); c.stroke(); // the mouth, shouting
  c.fillStyle = '#ff3a3a'; c.beginPath(); c.arc(cx, 40, 6, 0, Math.PI * 2); c.fill(); c.stroke(); // the gem on the helmet
}

const wingTex = (scene: S) => canvasTex(scene, 'peg-wing', 230, 200, (c) => { c.translate(20, 80); drawWing(c); });
const pegBodyTex = (scene: S) => canvasTex(scene, 'peg-body', 300, 310, (c) => { c.translate(0, 18); drawPegasus(c); });
/** the storm clouds the spirit flies into: dark rolls with a cold light inside */
const cloudTex = (scene: S) => canvasTex(scene, 'peg-cloud', 320, 140, (c) => {
  for (let n = 0; n < 22; n++) {
    const x = 40 + Math.random() * 240, y = 50 + Math.random() * 50, r = 26 + Math.random() * 30;
    const g = c.createRadialGradient(x, y - r * 0.3, 2, x, y, r);
    g.addColorStop(0, n % 4 ? '#4a5268' : '#6a8ab0'); g.addColorStop(0.7, '#262a3a'); g.addColorStop(1, 'rgba(20,22,34,0)');
    c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill();
  }
});

export interface SkyBoltHooks {
  /** the bolt hits the ground at (x, y), `r` round: the scene hurts that area and returns where the shock chains to */
  onStrike: (x: number, y: number, r: number) => { x: number; y: number }[];
  /** where the player is now */
  at: () => { x: number; y: number };
}

/** times of the scene, ms */
export const BOLT_MS = { rise: 280, fly: 720, windup: 1040, strike: 1280, total: 2400 };
/** the area the bolt hits, by level (it grows with the spirit) */
export const skyBoltR = (level: number) => 70 + level * 8;

/** Rayo celeste. (x, y) the player's feet, (tx, ty) the rival. Visual only: the scene deals the damage in the hooks. */
export function skyBolt(scene: S, x: number, y: number, tx: number, ty: number, level: number, hooks: SkyBoltHooks) {
  const k = 1 + level * 0.05, side = tx >= x ? 1 : -1, cam = scene.cameras.main, view = () => cam.worldView;
  const live: Phaser.GameObjects.GameObject[] = [];
  const keep = <T extends Phaser.GameObjects.GameObject>(o: T) => { live.push(o); return o; };
  /** a jagged bolt from (x0, y0) to (x1, y1): a wide glow, the cyan body and a white core, with a few forks */
  const bolt = (x0: number, y0: number, x1: number, y1: number, w: number, life: number, depth = D.fx) => {
    const g = scene.add.graphics().setDepth(depth);
    const n = Math.max(4, Math.round(Math.hypot(x1 - x0, y1 - y0) / 14)), pts: [number, number][] = [[x0, y0]];
    for (let s = 1; s < n; s++) { const u = s / n; pts.push([x0 + (x1 - x0) * u + rnd(-1, 1) * w * 2.2, y0 + (y1 - y0) * u + rnd(-0.5, 0.5) * w]); }
    pts.push([x1, y1]);
    for (const [lw, col, al] of [[w * 3, SKY, 0.35], [w, CYAN, 0.95], [Math.max(1, w * 0.35), 0xffffff, 1]] as const) {
      g.lineStyle(lw, col, al).beginPath().moveTo(pts[0][0], pts[0][1]);
      for (const p of pts) g.lineTo(p[0], p[1]);
      g.strokePath();
    }
    for (let f = 0; f < Math.floor(n / 3); f++) { // forks
      const [px, py] = pts[1 + Math.floor(Math.random() * (pts.length - 2))];
      let qx = px, qy = py;
      g.lineStyle(Math.max(1, w * 0.4), CYAN2, 0.9).beginPath().moveTo(qx, qy);
      for (let s = 0; s < 3; s++) { qx += rnd(-14, 14); qy += rnd(2, 12); g.lineTo(qx, qy); }
      g.strokePath();
    }
    fade(scene, g, life * 0.4, life * 0.6);
    return g;
  };
  // the sky goes dark and the storm gathers over the rival
  const dim = keep(scene.add.rectangle(view().centerX, view().centerY, view().width * 2, view().height * 2, 0x06102a, 1).setDepth(D.dim).setAlpha(0));
  scene.tweens.add({ targets: dim, alpha: 0.62, duration: 260 });
  const cy = Math.max(view().top + 30, ty - 130 * k);
  const clouds = keep(scene.add.image(tx, cy, cloudTex(scene)).setDepth(D.vortex).setScale(0.2, 0.1).setAlpha(0));
  scene.tweens.add({ targets: clouds, scaleX: 0.75 * k, scaleY: 0.6 * k, alpha: 0.95, duration: 520, ease: 'Cubic.easeOut' });
  scene.tweens.add({ targets: clouds, x: tx + 6, duration: 900, yoyo: true, repeat: 1, ease: 'Sine.easeInOut' });
  for (let n = 0; n < 5; n++) scene.time.delayedCall(200 + n * 190, () => { // light flickers inside the clouds
    if (!clouds.active) return;
    const fl = scene.add.ellipse(tx + rnd(-60, 60) * k, cy + rnd(-8, 10), rnd(40, 80) * k, rnd(16, 30) * k, CYAN2, 0.35).setDepth(D.vortex + 1).setBlendMode(Phaser.BlendModes.ADD);
    fade(scene, fl, 40, 140);
    if (n % 2) bolt(fl.x, fl.y, fl.x + rnd(-24, 24), fl.y + rnd(18, 34), 2, 200, D.vortex + 1);
  });
  // the player crackles with cyan lightning
  const crackle = keep(scene.add.graphics().setDepth(D.fx));
  const pAura = keep(scene.add.ellipse(x, y - 10, 26, 40, CYAN, 1).setDepth(D.giant + 4).setAlpha(0).setBlendMode(Phaser.BlendModes.ADD));
  scene.tweens.add({ targets: pAura, alpha: 0.3, scaleX: 1.4, scaleY: 1.3, duration: 300, yoyo: true, repeat: 2 });
  // ---- Pegaso: the body and its two wings in one container, behind the player
  const gs = 0.26 + level * 0.006;
  const spirit = keep(scene.add.container(x - side * 8, y + 12).setDepth(D.giant).setScale(0.08 * side, 0.08).setAlpha(0));
  const aura = scene.add.ellipse(0, -150, 240, 300, CYAN, 1).setAlpha(0).setBlendMode(Phaser.BlendModes.ADD);
  const wings = [-1, 1].map((s) => scene.add.image(s * 34, -176, wingTex(scene)).setScale(1.7).setFlipX(s < 0).setOrigin(s < 0 ? 1 - 20 / 230 : 20 / 230, 80 / 200));
  const body = scene.add.image(0, 0, pegBodyTex(scene)).setOrigin(0.5, 1);
  const fist = scene.add.circle(80, -96, 22, CYAN, 0).setBlendMode(Phaser.BlendModes.ADD); // the glow of the right fist, which charges and punches
  spirit.add([aura, ...wings, body, fist]);
  let flap = 1;
  const t0 = scene.time.now;
  const tick = () => {
    if (!spirit.active) { scene.events.off('update', tick); return; }
    const t = (scene.time.now - t0) / 1000, p = hooks.at();
    const beat = Math.sin(t * 10 * flap);
    wings[0].setAngle(30 - beat * 16); wings[1].setAngle(-30 + beat * 16); // they beat, faster while it flies
    aura.setScale(1 + Math.sin(t * 6) * 0.05, 1 + Math.cos(t * 5) * 0.04);
    dim.setPosition(view().centerX, view().centerY);
    pAura.setPosition(p.x, p.y - 10);
    crackle.clear();
    if (t * 1000 < BOLT_MS.strike + 400) for (let n = 0; n < 3; n++) { // little arcs round the player
      const a = rnd(0, Math.PI * 2), r0 = rnd(6, 10), r1 = rnd(14, 22);
      let px = p.x + Math.cos(a) * r0, py = p.y - 12 + Math.sin(a) * r0;
      crackle.lineStyle(1.5, n ? CYAN : 0xffffff, 0.9).beginPath().moveTo(px, py);
      for (let s = 1; s <= 3; s++) { const u = r0 + (r1 - r0) * s / 3; px = p.x + Math.cos(a + rnd(-0.4, 0.4)) * u; py = p.y - 12 + Math.sin(a + rnd(-0.4, 0.4)) * u; crackle.lineTo(px, py); }
      crackle.strokePath();
    }
  };
  scene.events.on('update', tick);
  // it appears behind the player, wings unfolding, red feathers in the air
  scene.time.delayedCall(BOLT_MS.rise, () => {
    if (!spirit.active) return;
    scene.tweens.add({ targets: spirit, alpha: 1, scaleX: gs * side, scaleY: gs, duration: 380, ease: 'Back.easeOut' });
    scene.tweens.add({ targets: aura, alpha: 0.16, duration: 300 });
    for (let n = 0; n < 12; n++) {
      const f = scene.add.ellipse(x + rnd(-40, 40) * k, y - rnd(20, 60), 4, 9, n % 3 ? PEG_RED : 0xff8a7a, 1).setDepth(D.fx).setAngle(rnd(0, 360));
      scene.tweens.add({ targets: f, y: f.y + rnd(20, 50), x: f.x + rnd(-20, 20), angle: f.angle + rnd(-200, 200), alpha: 0, delay: n * 30, duration: 900, onComplete: () => f.destroy() });
    }
  });
  // it flies up into the clouds, over the rival
  scene.time.delayedCall(BOLT_MS.fly, () => {
    if (!spirit.active) return;
    flap = 1.8;
    const sx = spirit.x, sy = spirit.y - 60;
    scene.tweens.add({ targets: spirit, x: tx - side * 40 * k, y: cy + 30, scaleX: gs * 0.6 * side, scaleY: gs * 0.6, duration: BOLT_MS.windup - BOLT_MS.fly, ease: 'Cubic.easeInOut' });
    for (let n = 0; n < 6; n++) { // the wind of its wings
      const w = scene.add.rectangle(sx + rnd(-30, 30), sy - rnd(0, 30), rnd(30, 50), 2, 0xffffff, 0.7).setDepth(D.fx).setRotation(Math.atan2(cy - sy, tx - sx));
      scene.tweens.add({ targets: w, x: w.x + (tx - sx) * 0.4, y: w.y + (cy - sy) * 0.4, alpha: 0, delay: n * 40, duration: 320, onComplete: () => w.destroy() });
    }
  });
  // the wind-up: the fist goes back and fills with lightning; the banner
  scene.time.delayedCall(BOLT_MS.windup, () => {
    if (!spirit.active) return;
    flap = 1;
    scene.tweens.add({ targets: fist, x: 96, y: -150, fillAlpha: 0.9, scale: 2, duration: BOLT_MS.strike - BOLT_MS.windup, ease: 'Back.easeIn' });
    scene.tweens.add({ targets: spirit, angle: -side * 8, duration: BOLT_MS.strike - BOLT_MS.windup });
    for (let n = 0; n < 3; n++) scene.time.delayedCall(n * 70, () => {
      const fx0 = spirit.x + 96 * spirit.scaleX, fy0 = spirit.y - 150 * spirit.scaleY;
      bolt(fx0 + rnd(-20, 20), fy0 + rnd(-20, 20), fx0, fy0, 1.5, 150);
    });
  });
  // the punch: the bolt falls out of the sky on the rival
  scene.time.delayedCall(BOLT_MS.strike, () => {
    if (!spirit.active) return;
    scene.tweens.add({ targets: fist, x: 40, y: 20, fillAlpha: 0, duration: 200, ease: 'Cubic.easeIn' });
    scene.tweens.add({ targets: spirit, angle: side * 10, y: spirit.y + 10, duration: 110, ease: 'Cubic.easeIn' });
    const R = skyBoltR(level);
    cam.shake(360, 0.014);
    cam.flash(120, 200, 250, 255);
    bolt(tx + rnd(-10, 10), cy + 10, tx, ty, 9 * k, 520);
    scene.time.delayedCall(60, () => bolt(tx + rnd(-20, 20), cy + 6, tx + rnd(-8, 8), ty, 5 * k, 380));
    const column = scene.add.rectangle(tx, ty, 34 * k, ty - cy, CYAN, 0.55).setOrigin(0.5, 1).setDepth(D.fx - 1).setBlendMode(Phaser.BlendModes.ADD);
    scene.tweens.add({ targets: column, scaleX: 2.4, alpha: 0, duration: 520, ease: 'Cubic.easeOut', onComplete: () => column.destroy() });
    // the ground: a blue pool of light, shock rings, sparks and arcs running along it
    const pool = scene.add.ellipse(tx, ty, R * 2, R * 1.1, SKY, 0.55).setDepth(ty - 2).setBlendMode(Phaser.BlendModes.ADD).setScale(0.2);
    scene.tweens.add({ targets: pool, scale: 1, duration: 160, ease: 'Cubic.easeOut', onComplete: () => fade(scene, pool, 260, 420) });
    for (const [d, col] of [[0, 0xffffff], [70, CYAN], [150, SKY]] as const) {
      const ring = scene.add.ellipse(tx, ty, R * 0.6, R * 0.32).setStrokeStyle(4, col, 1).setDepth(D.fx - 1);
      scene.tweens.add({ targets: ring, scale: 3.4, alpha: 0, delay: d, duration: 520, ease: 'Cubic.easeOut', onComplete: () => ring.destroy() });
    }
    for (let n = 0; n < 8 + level; n++) {
      const a = (n / (8 + level)) * Math.PI * 2;
      bolt(tx, ty, tx + Math.cos(a) * R * rnd(0.7, 1.1), ty + Math.sin(a) * R * 0.55 * rnd(0.7, 1.1), 2, 260, ty + 1);
      const sp = scene.add.circle(tx, ty - 6, rnd(1.5, 3), n % 2 ? CYAN2 : 0xffffff, 1).setDepth(D.fx);
      scene.tweens.add({ targets: sp, x: tx + Math.cos(a) * rnd(30, 70) * k, y: ty - rnd(20, 60) * k, alpha: 0, duration: 520, ease: 'Cubic.easeOut', onComplete: () => sp.destroy() });
    }
    // the shock chains to the rivals nearby
    hooks.onStrike(tx, ty, R).forEach((q, n) => scene.time.delayedCall(80 + n * 60, () => {
      bolt(tx, ty - 8, q.x, q.y, 2.5, 280);
      const f = scene.add.circle(q.x, q.y, 8, CYAN2, 0.9).setDepth(D.fx);
      scene.tweens.add({ targets: f, scale: 2.4, alpha: 0, duration: 260, onComplete: () => f.destroy() });
    }));
    // the ball goes past the rival in a streak of lightning
    const p = hooks.at(), ang = Math.atan2(ty - p.y, tx - p.x), far = Math.hypot(tx - p.x, ty - p.y) + 60;
    const ball = scene.add.image(p.x + side * 6, p.y - 4, 'fx:ball').setDepth(D.fx + 1).setScale(0.9);
    let lastT = 0;
    scene.tweens.add({ targets: ball, x: p.x + Math.cos(ang) * far, y: p.y - 4 + Math.sin(ang) * far, angle: 900, duration: 360, ease: 'Cubic.easeOut',
      onUpdate: () => { if (scene.time.now - lastT > 16) { lastT = scene.time.now; const tr = scene.add.circle(ball.x, ball.y, 7, CYAN, 0.7).setDepth(D.fx); scene.tweens.add({ targets: tr, scale: 0.2, alpha: 0, duration: 240, onComplete: () => tr.destroy() }); } },
      onComplete: () => fade(scene, ball, 120, 160) });
    // it hangs in the air a moment, then flies off
    scene.time.delayedCall(420, () => { if (spirit.active) scene.tweens.add({ targets: spirit, y: spirit.y - 60, angle: 0, alpha: 0, duration: 520, ease: 'Cubic.easeIn' }); });
  });
  const end = BOLT_MS.total;
  for (const o of live) if (o !== dim) fade(scene, o, end - 420, 400);
  scene.tweens.add({ targets: dim, alpha: 0, delay: end - 400, duration: 380, onComplete: () => dim.destroy() });
  scene.time.delayedCall(end, () => scene.events.off('update', tick));
}
