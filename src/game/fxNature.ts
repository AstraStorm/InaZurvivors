/**
 * Fix 1.31: drawn animations for the penguin, flower and sea techniques, each one after its official usage text on the
 * Inazuma Eleven wiki (Usage / Description sections). Visual only: damage, reach and behaviour stay those of their type
 * in ArenaScene. Original 2D recreations (the games use 3D models), built from small textures generated once.
 *
 *   Pingüino emperador n.º 2 — a whistle, five penguins rise from the ground and follow the ball in a yellow spiral.
 *   Pingüino emperador n.º 1 — the forbidden one: feral penguins peck at the shooter's feet, then hunt with the ball.
 *   Pingüino emperador n.º 3 — five purple penguins circle the shooter in a ring of purple energy; three heel trails.
 *   Pingüino emperador X — five black penguins leap up, dive back and circle in a dark red glow (born from hatred).
 *   Pingüino emperador 7 — penguins of seven colours paint a rainbow arch on the way to the goal.
 *   Pingüino espacial — penguins in spacesuits launch off from a purple vortex and come back down through the atmosphere.
 *   Mano de pingüinos — five red penguins spiral down and peck the keeper's arm; the red fist opens and stops the ball.
 *   Pingüino perfecto — eight red-eyed black penguins spiral into a glowing orb above the head; the volley splits them.
 *   Pingüino aéreo — six penguins called by a whistle fly overhead like rockets, flames under their feet.
 *   Pingüino múltiple — penguins in three lanes march alongside the ball.
 *   Lecho de rosas — pink energy swirls into the ball, which becomes a thorned rose that loses petals as it flies.
 *   Desesperación floral — the pitch goes dark blue, a dark red rose blooms and releases red pollen; black-red swirls.
 *   Fiesta floral — golden sparkles circle the rival, bloom into five spotted pink flowers and burst like fireworks.
 *   Tormenta de pétalos — fallen petals whirl into a whirlwind in front of the keeper.
 *   Hojarasca — a mass of leaves flutters down in front of the goal.
 *   Bola de hojas — a whirlwind gathers leaves into a huge ball that rolls over the rivals.
 *   Tiburón de las profundidades — the pitch turns into ocean, a fin slices to the goal and the shark leaps with its jaws.
 *   Ataque de la ballena (Killer Whale) — water floods around the rival, a dorsal fin circles and the orca breaches.
 *   Bloqueo ballena (Whale Guard) — a wave crests, a giant whale swallows the rivals and blows them out of its blowhole.
 *   Baile de mariposas — butterflies flutter around the ball.
 */
import Phaser from 'phaser';

export type Nature = 'p2' | 'p1' | 'p3' | 'px' | 'p7' | 'pspace' | 'phand' | 'pperfect' | 'paereo' | 'pmulti'
  | 'rosa' | 'floral' | 'fiesta' | 'petalos' | 'hojarasca' | 'hojas' | 'tiburon' | 'orca' | 'ballena' | 'mariposa';

const PENGUIN = /ping[uü]ino|penguin/i;
export function natureOf(name: string): Nature | null {
  const n = name.normalize('NFC');
  if (PENGUIN.test(n)) {
    if (/mano de ping|penguin the hand/i.test(n)) return 'phand';
    if (/espacial|space/i.test(n)) return 'pspace';
    if (/perfect/i.test(n)) return 'pperfect';
    if (/a[eé]reo|overhead/i.test(n)) return 'paereo';
    if (/m[uú]ltiple/i.test(n)) return 'pmulti';
    if (/\bX\b/.test(n)) return 'px';
    if (/\b7\b/.test(n)) return 'p7';
    if (/(n\.?\s*[º°~]?\s*|no\.?\s*|\b)3\b/i.test(n)) return 'p3';
    if (/(n\.?\s*[º°~]?\s*|no\.?\s*|\b)1\b/i.test(n)) return 'p1';
    return 'p2';
  }
  if (/lecho de rosas|rose splash/i.test(n)) return 'rosa';
  if (/desesperaci[oó]n floral|floral despair/i.test(n)) return 'floral';
  if (/fiesta floral|magical flower/i.test(n)) return 'fiesta';
  if (/tormenta de p[eé]talos|petal storm/i.test(n)) return 'petalos';
  if (/hojarasca/i.test(n)) return 'hojarasca';
  if (/bola de hojas|konoha roll/i.test(n)) return 'hojas';
  if (/tibur[oó]n|shark/i.test(n)) return 'tiburon';
  if (/ataque de la ballena|killer whale|orca/i.test(n)) return 'orca';
  if (/bloqueo ballena|whale guard/i.test(n)) return 'ballena';
  if (/mariposa|butterfl/i.test(n)) return 'mariposa';
  return null;
}

type S = Phaser.Scene;
type Img = Phaser.GameObjects.Image;
const AIR = 8900;
const ADD = Phaser.BlendModes.ADD;
const rnd = (a: number, b: number) => a + Math.random() * (b - a);
let lowPower = false;
export const setNatureLowPower = (v: boolean) => { lowPower = v; };

// ------------------------------------------------------------------ textures (generated once per scene)
function tex(scene: S, key: string, w: number, h: number, draw: (g: Phaser.GameObjects.Graphics) => void) {
  const k = `nat:${key}`;
  if (!scene.textures.exists(k)) {
    const g = scene.make.graphics({}, false);
    draw(g);
    g.generateTexture(k, w, h);
    g.destroy();
  }
  return k;
}

interface PenguinLook { body: number; belly?: number; eye?: number; patch?: number; helmet?: boolean }
const LOOKS: Record<string, PenguinLook> = {
  emperor: { body: 0x1b2440, patch: 0xffc93a },
  feral: { body: 0x141a33, eye: 0xff2a2a, patch: 0xff8a3a },
  purple: { body: 0x5a2a8a, patch: 0xd99bff },
  black: { body: 0x08080c, belly: 0x2a2a34, eye: 0xff3030, patch: 0x8a1010 },
  red: { body: 0x9a1418, patch: 0xffd23f },
  space: { body: 0x1b2440, patch: 0xffc93a, helmet: true },
  jet: { body: 0x050508, eye: 0xff2020, patch: 0xffe27a },
};
const RAINBOW = [0xff3b3b, 0xff9a2a, 0xffe23a, 0x4bdc5a, 0x3ab8ff, 0x3a5aff, 0xb35aff];

/** A small emperor penguin seen from the front, 16x20. */
function penguinTex(scene: S, look: string | number) {
  const l = typeof look === 'number' ? { body: look, patch: 0xffffff } : LOOKS[look];
  return tex(scene, `peng_${typeof look === 'number' ? look.toString(16) : look}`, 18, 22, (g) => {
    g.fillStyle(0xff9a1a, 1).fillEllipse(6, 20, 5, 3).fillEllipse(12, 20, 5, 3); // feet
    g.fillStyle(l.body, 1).fillEllipse(9, 12, 14, 18); // body
    g.fillStyle(l.belly ?? 0xf4f4f0, 1).fillEllipse(9, 14, 8, 12); // belly
    g.fillStyle(l.patch ?? 0xffc93a, 1).fillEllipse(4.5, 8, 3, 4).fillEllipse(13.5, 8, 3, 4); // emperor neck patches
    g.fillStyle(l.body, 1).fillEllipse(1.5, 12, 3, 9).fillEllipse(16.5, 12, 3, 9); // flippers
    g.fillStyle(0xffffff, 1).fillCircle(6.5, 6, 1.8).fillCircle(11.5, 6, 1.8);
    g.fillStyle(l.eye ?? 0x101010, 1).fillCircle(6.8, 6.2, 1).fillCircle(11.2, 6.2, 1);
    g.fillStyle(0xff8a1a, 1).fillTriangle(7.5, 8, 10.5, 8, 9, 11); // beak
    if (l.helmet) { g.lineStyle(1.2, 0xbfeaff, 0.95).strokeCircle(9, 7, 7.4); g.fillStyle(0xbfeaff, 0.25).fillCircle(9, 7, 7); g.fillStyle(0xffffff, 0.8).fillCircle(6, 3.5, 1.2); }
  });
}
const petalTex = (scene: S, c: number) => tex(scene, `petal_${c.toString(16)}`, 8, 5, (g) => { g.fillStyle(c, 1).fillEllipse(4, 2.5, 7, 4); g.fillStyle(0xffffff, 0.35).fillEllipse(3, 2, 3, 1.5); });
const leafTex = (scene: S, c: number) => tex(scene, `leaf_${c.toString(16)}`, 10, 6, (g) => {
  g.fillStyle(c, 1).fillEllipse(5, 3, 9, 5); g.lineStyle(1, 0x2a5a14, 0.9).lineBetween(1, 3, 9, 3);
});
function roseTex(scene: S, dark = false) {
  const [c1, c2, c3] = dark ? [0x5a0612, 0x8a1020, 0xc41a2a] : [0xc81860, 0xff4a8a, 0xffa0c8];
  return tex(scene, `rose_${dark ? 'd' : 'p'}`, 22, 22, (g) => {
    g.fillStyle(0x2f8a2a, 1).fillTriangle(2, 14, 9, 11, 6, 19).fillTriangle(20, 14, 13, 11, 16, 19); // leaves
    g.fillStyle(c1, 1).fillCircle(11, 10, 8);
    for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2; g.fillStyle(c2, 1).fillCircle(11 + Math.cos(a) * 4.5, 10 + Math.sin(a) * 4.5, 3.6); }
    g.fillStyle(c3, 1).fillCircle(11, 10, 3.4);
    g.lineStyle(1, c1, 1).beginPath(); g.arc(11, 10, 1.8, 0, Math.PI * 1.5); g.strokePath();
  });
}
const sparkleTex = (scene: S) => tex(scene, 'sparkle', 8, 8, (g) => {
  g.fillStyle(0xffffff, 1).fillTriangle(4, 0, 5, 4, 3, 4).fillTriangle(4, 8, 5, 4, 3, 4).fillTriangle(0, 4, 4, 3, 4, 5).fillTriangle(8, 4, 4, 3, 4, 5);
});
/** Magical Flower: five white-spotted pink petals around a star-shaped orange and yellow disk. */
const flowerTex = (scene: S) => tex(scene, 'flower5', 24, 24, (g) => {
  for (let k = 0; k < 5; k++) {
    const a = -Math.PI / 2 + (k / 5) * Math.PI * 2, px = 12 + Math.cos(a) * 6.5, py = 12 + Math.sin(a) * 6.5;
    g.fillStyle(0xff6aa8, 1).fillCircle(px, py, 5.2);
    g.fillStyle(0xffffff, 0.9).fillCircle(px + Math.cos(a) * 1.5, py + Math.sin(a) * 1.5, 1.1);
  }
  const star = Array.from({ length: 10 }, (_, k) => { const a = -Math.PI / 2 + (k / 10) * Math.PI * 2, r = k % 2 ? 2 : 4.6; return new Phaser.Geom.Point(12 + Math.cos(a) * r, 12 + Math.sin(a) * r); });
  g.fillStyle(0xff9a1a, 1).fillPoints(star, true);
  g.fillStyle(0xffe23a, 1).fillCircle(12, 12, 1.8);
});
function butterflyTex(scene: S, open: boolean, c: number) {
  return tex(scene, `bfly_${open ? 'o' : 'c'}_${c.toString(16)}`, 16, 12, (g) => {
    const w = open ? 7 : 3;
    g.fillStyle(c, 1).fillEllipse(8 - w / 2 - 0.5, 4, w, 7).fillEllipse(8 + w / 2 + 0.5, 4, w, 7);
    g.fillStyle(c, 0.85).fillEllipse(8 - w / 2, 8.5, w * 0.8, 5).fillEllipse(8 + w / 2, 8.5, w * 0.8, 5);
    if (open) g.fillStyle(0xffffff, 0.7).fillCircle(4.5, 4, 1).fillCircle(11.5, 4, 1);
    g.fillStyle(0x201010, 1).fillRect(7.4, 2, 1.2, 9);
  });
}
const finTex = (scene: S, c: number) => tex(scene, `fin_${c.toString(16)}`, 14, 14, (g) => {
  g.fillStyle(c, 1).fillTriangle(1, 13, 13, 13, 9, 1); g.fillStyle(0xffffff, 0.25).fillTriangle(9, 1, 10, 13, 12, 13);
});
/** Shark with its jaws open, side view looking right (48x24). */
const sharkTex = (scene: S) => tex(scene, 'shark', 48, 26, (g) => {
  g.fillStyle(0x4a2a8a, 1).fillTriangle(0, 4, 0, 22, 12, 13); // tail
  g.fillStyle(0x6a3ab0, 1).fillEllipse(24, 13, 34, 14);
  g.fillStyle(0x4a2a8a, 1).fillTriangle(20, 7, 30, 7, 24, 0); // dorsal fin
  g.fillStyle(0xd8c8ff, 1).fillEllipse(26, 16, 26, 5); // belly
  g.fillStyle(0x200a2a, 1).fillTriangle(34, 13, 47, 5, 47, 21); // open jaws
  g.fillStyle(0xffffff, 1);
  for (let k = 0; k < 4; k++) { g.fillTriangle(37 + k * 2.5, 9.5 - k * 0.6, 39 + k * 2.5, 9.5 - k * 0.6, 38 + k * 2.5, 12); g.fillTriangle(37 + k * 2.5, 16.5 + k * 0.6, 39 + k * 2.5, 16.5 + k * 0.6, 38 + k * 2.5, 14); }
  g.fillStyle(0xffe23a, 1).fillCircle(33, 9, 1.4);
});
/** Killer whale breaching, side view looking right (40x20). */
const orcaTex = (scene: S) => tex(scene, 'orca', 42, 22, (g) => {
  g.fillStyle(0x0a0a10, 1).fillTriangle(0, 3, 0, 19, 10, 11).fillEllipse(22, 11, 30, 14).fillTriangle(17, 6, 24, 6, 19, 0);
  g.fillStyle(0xffffff, 1).fillEllipse(24, 15, 20, 5).fillEllipse(31, 8, 5, 3);
});
/** Giant whale with its mouth wide open, front-ish view (72x44). */
const whaleTex = (scene: S) => tex(scene, 'whale', 74, 46, (g) => {
  g.fillStyle(0x2a5ab0, 1).fillEllipse(37, 24, 70, 40);
  g.fillStyle(0xbfe0ff, 1).fillEllipse(37, 33, 52, 18);
  g.fillStyle(0x10183a, 1).fillEllipse(37, 30, 44, 14); // open mouth
  g.fillStyle(0xff7a9a, 1).fillEllipse(37, 34, 26, 5); // tongue
  g.fillStyle(0xffffff, 1).fillCircle(14, 16, 3.2).fillCircle(60, 16, 3.2);
  g.fillStyle(0x101010, 1).fillCircle(14.5, 16.5, 1.6).fillCircle(59.5, 16.5, 1.6);
});

// ------------------------------------------------------------------ small helpers
function put(scene: S, key: string, x: number, y: number, depth = AIR, scale = 1) {
  return scene.add.image(x, y, key).setDepth(depth).setScale(scale);
}
function fadeKill(scene: S, objs: Phaser.GameObjects.GameObject[], delay: number, duration = 240) {
  scene.tweens.add({ targets: objs, alpha: 0, delay, duration, onComplete: () => objs.forEach((o) => o.destroy()) });
}
/** a short whistle: a note pops above the footballer */
function whistle(scene: S, x: number, y: number) {
  const t = scene.add.text(x + 6, y - 30, '♪', { fontFamily: 'monospace', fontSize: '12px', color: '#ffffff', stroke: '#000000', strokeThickness: 3 }).setDepth(AIR + 2).setOrigin(0.5);
  scene.tweens.add({ targets: t, y: y - 44, alpha: 0, duration: 520, ease: 'Sine.easeOut', onComplete: () => t.destroy() });
}
/** Calls `frame` every update while the ball lives (with its direction), then `end` where it stopped. */
function follow(scene: S, ball: Img, frame: (bx: number, by: number, ang: number, t: number) => void, end: (bx: number, by: number, ang: number) => void) {
  let px = ball.x, py = ball.y, ang = 0, t0 = scene.time.now, n = 0;
  const tick = () => {
    if (!ball.active) { scene.events.off('update', tick); end(px, py, ang); return; }
    if (Math.hypot(ball.x - px, ball.y - py) > 0.5) ang = Math.atan2(ball.y - py, ball.x - px);
    px = ball.x; py = ball.y;
    if (lowPower && n++ % 2) return;
    frame(px, py, ang, (scene.time.now - t0) / 1000);
  };
  scene.events.on('update', tick);
  scene.events.once('shutdown', () => scene.events.off('update', tick));
}
/** penguins pop out of the ground around (x, y) */
function emerge(scene: S, key: string, pts: [number, number][], ms: number, scale = 1) {
  return pts.map(([px, py], i) => {
    const p = put(scene, key, px, py, py + 2, scale).setScale(scale, 0).setOrigin(0.5, 1);
    scene.tweens.add({ targets: p, scaleY: scale, delay: i * 50, duration: 160, ease: 'Back.easeOut' });
    scene.tweens.add({ targets: p, y: py - 4, delay: 200 + i * 50, duration: 140, yoyo: true, repeat: Math.max(0, Math.floor(ms / 300) - 1) });
    const dust = scene.add.ellipse(px, py, 10, 3, 0x6a4a2a, 0.5).setDepth(py);
    scene.tweens.add({ targets: dust, scaleX: 2, alpha: 0, duration: 380, onComplete: () => dust.destroy() });
    return p;
  });
}
function burstOf(scene: S, key: string, x: number, y: number, n: number, dist: number, ms: number, tint?: number) {
  for (let k = 0; k < n; k++) {
    const a = (k / n) * Math.PI * 2 + rnd(-0.3, 0.3), d = dist * rnd(0.6, 1.1);
    const o = put(scene, key, x, y, AIR + 1, rnd(0.7, 1.2)).setAngle(rnd(0, 360));
    if (tint !== undefined) o.setTint(tint);
    scene.tweens.add({ targets: o, x: x + Math.cos(a) * d, y: y + Math.sin(a) * d * 0.7 + 6, angle: o.angle + rnd(-200, 200), alpha: 0, duration: ms, ease: 'Cubic.easeOut', onComplete: () => o.destroy() });
  }
}
function glow(scene: S, x: number, y: number, r: number, c: number, ms: number, a = 0.4) {
  const o = scene.add.circle(x, y, r, c, a).setDepth(AIR - 1).setBlendMode(ADD);
  scene.tweens.add({ targets: o, scale: 1.6, alpha: 0, duration: ms, onComplete: () => o.destroy() });
}

// ------------------------------------------------------------------ shots: the charge (wind-up)
export function natureCharge(scene: S, kind: Nature, x: number, y: number, level: number, ms: number) {
  const ring = (n: number, r: number): [number, number][] => Array.from({ length: n }, (_, i) => [x + Math.cos((i / n) * Math.PI * 2 + 0.4) * r, y + 6 + Math.sin((i / n) * Math.PI * 2 + 0.4) * r * 0.45]);
  switch (kind) {
    case 'p2': { // a whistle and five penguins rise from the ground
      whistle(scene, x, y);
      const ps = emerge(scene, penguinTex(scene, 'emperor'), Array.from({ length: 5 }, (_, i) => [x - 22 + i * 11, y + 10 - Math.abs(i - 2) * 3] as [number, number]), ms);
      fadeKill(scene, ps, ms, 160);
      break;
    }
    case 'p1': { // feral penguins peck at the shooter's feet; a dark aura
      glow(scene, x, y - 6, 18 + level, 0x5a1a8a, ms, 0.35);
      const key = penguinTex(scene, 'feral');
      for (let i = 0; i < 6 + Math.floor(level / 3); i++) {
        const a = rnd(0, Math.PI * 2), p = put(scene, key, x + Math.cos(a) * 40, y + 8 + Math.sin(a) * 16, y + 6, 0.9).setOrigin(0.5, 1);
        scene.tweens.add({ targets: p, x: x + rnd(-8, 8), y: y + 8 + rnd(-3, 3), duration: ms * 0.45, delay: i * 30, ease: 'Cubic.easeIn' });
        scene.tweens.add({ targets: p, angle: { from: -18, to: 18 }, duration: 70, yoyo: true, repeat: 6, delay: ms * 0.45 + i * 30 });
        fadeKill(scene, [p], ms, 140);
      }
      break;
    }
    case 'p3': { // five purple penguins circle the shooter in a ring of purple energy
      whistle(scene, x, y);
      const key = penguinTex(scene, 'purple');
      const g = scene.add.ellipse(x, y + 6, 70, 24).setStrokeStyle(3, 0xb35aff, 0.9).setDepth(y).setBlendMode(ADD);
      const st = { a: 0 };
      const ps = Array.from({ length: 5 }, () => put(scene, key, x, y, AIR, 0.95).setOrigin(0.5, 1));
      scene.tweens.add({ targets: st, a: Math.PI * 3, duration: ms, onUpdate: () => ps.forEach((p, i) => { const a = st.a + (i / 5) * Math.PI * 2; p.setPosition(x + Math.cos(a) * 34, y + 8 + Math.sin(a) * 12).setDepth(y + 8 + Math.sin(a) * 12); }) });
      fadeKill(scene, [...ps, g], ms, 160);
      break;
    }
    case 'px': { // five black penguins leap up, dive back and circle in a dark red glow
      whistle(scene, x, y);
      glow(scene, x, y - 8, 22, 0x8a0a10, ms, 0.45);
      const key = penguinTex(scene, 'black');
      ring(5, 30).forEach(([px, py], i) => {
        const p = put(scene, key, px, py, AIR, 1).setOrigin(0.5, 1);
        scene.tweens.add({ targets: p, y: py - 70, duration: ms * 0.4, ease: 'Cubic.easeOut', delay: i * 30 });
        scene.tweens.add({ targets: p, y: py, angle: 180, duration: ms * 0.35, ease: 'Cubic.easeIn', delay: ms * 0.4 + i * 30 });
        fadeKill(scene, [p], ms, 140);
      });
      break;
    }
    case 'p7': { // penguins of seven colours dance in an arch over the shooter
      whistle(scene, x, y);
      RAINBOW.forEach((c, i) => {
        const p = put(scene, penguinTex(scene, c), x, y, AIR, 0.85).setOrigin(0.5, 1);
        const a = Math.PI + (i / 6) * Math.PI;
        scene.tweens.add({ targets: p, x: x + Math.cos(a) * 34, y: y - 6 + Math.sin(a) * 30, duration: ms * 0.6, delay: i * 40, ease: 'Back.easeOut' });
        fadeKill(scene, [p], ms, 160);
      });
      break;
    }
    case 'pspace': { // a dark purple vortex; penguins in spacesuits launch off into space
      const v = scene.add.ellipse(x, y + 8, 40, 14, 0x3a1a6a, 0.6).setStrokeStyle(2, 0xb35aff).setDepth(y);
      scene.tweens.add({ targets: v, angle: 360, scale: 1.4, duration: ms, onComplete: () => v.destroy() });
      const key = penguinTex(scene, 'space');
      for (let i = 0; i < 5; i++) {
        const p = put(scene, key, x - 20 + i * 10, y + 8, y + 9, 1).setOrigin(0.5, 1);
        scene.tweens.add({ targets: p, y: y - 260, duration: ms * 0.7, delay: ms * 0.25 + i * 50, ease: 'Cubic.easeIn', onComplete: () => p.destroy() });
        const flame = scene.add.ellipse(p.x, p.y, 6, 10, 0xff9a2a, 0.9).setDepth(y + 8).setBlendMode(ADD);
        scene.tweens.add({ targets: flame, y: y - 250, alpha: 0, duration: ms * 0.7, delay: ms * 0.25 + i * 50, ease: 'Cubic.easeIn', onComplete: () => flame.destroy() });
      }
      break;
    }
    case 'pperfect': { // eight black penguins spiral into a glowing orb above the head, which bursts and stabilises
      const ox = x, oy = y - 46;
      const orb = scene.add.circle(ox, oy, 8, 0xffe27a, 0.85).setDepth(AIR).setBlendMode(ADD);
      scene.tweens.add({ targets: orb, scale: 2.2, duration: ms * 0.7, yoyo: true, hold: ms * 0.1, onComplete: () => orb.destroy() });
      const key = penguinTex(scene, 'jet');
      for (let i = 0; i < 8; i++) {
        const p = put(scene, key, ox, oy, AIR + 1, 0.8), st = { k: 0 }, a0 = (i / 8) * Math.PI * 2;
        scene.tweens.add({ targets: st, k: 1, duration: ms * 0.75, delay: i * 25, ease: 'Sine.easeIn', onUpdate: () => { const r = 60 * (1 - st.k), a = a0 + st.k * 5; p.setPosition(ox + Math.cos(a) * r, oy + Math.sin(a) * r * 0.6).setScale(0.8 * (1 - st.k * 0.6)); }, onComplete: () => p.destroy() });
      }
      break;
    }
    case 'paereo': { // a whistle; six penguins gather overhead with flames under their feet
      whistle(scene, x, y);
      const key = penguinTex(scene, 'emperor');
      for (let i = 0; i < 6; i++) {
        const p = put(scene, key, x + rnd(-60, 60), y - 90, AIR, 0.9).setOrigin(0.5, 1);
        scene.tweens.add({ targets: p, x: x - 25 + i * 10, y: y - 42 - Math.abs(i - 2.5) * 4, duration: ms * 0.7, ease: 'Cubic.easeOut' });
        const f = scene.add.ellipse(p.x, p.y + 4, 5, 9, 0xff7a1a, 0.9).setDepth(AIR - 1).setBlendMode(ADD);
        scene.tweens.add({ targets: f, x: x - 25 + i * 10, y: y - 38 - Math.abs(i - 2.5) * 4, duration: ms * 0.7, ease: 'Cubic.easeOut' });
        fadeKill(scene, [p, f], ms, 120);
      }
      break;
    }
    case 'pmulti': { // three rows of penguins pop out
      whistle(scene, x, y);
      const pts: [number, number][] = [];
      for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) pts.push([x - 14 + c * 14, y + 2 + r * 7]);
      fadeKill(scene, emerge(scene, penguinTex(scene, 'emperor'), pts, ms, 0.75), ms, 140);
      break;
    }
    case 'rosa': { // swirls of pink energy gather on the ball
      for (let i = 0; i < 14; i++) {
        const a = (i / 14) * Math.PI * 2, p = put(scene, petalTex(scene, i % 2 ? 0xff4a8a : 0xffa0c8), x + Math.cos(a) * 40, y + Math.sin(a) * 18, AIR, 1.2);
        scene.tweens.add({ targets: p, x: x + 8, y: y + 2, angle: 360, scale: 0.4, duration: ms * 0.8, delay: i * 15, ease: 'Sine.easeIn', onComplete: () => p.destroy() });
      }
      glow(scene, x + 8, y + 2, 10, 0xff6aa8, ms, 0.5);
      break;
    }
    case 'floral': { // the area turns dark blue; a dark red rose blooms and releases red pollen
      const dark = scene.add.ellipse(x, y + 4, 140, 60, 0x0a1440, 0).setDepth(y - 2);
      scene.tweens.add({ targets: dark, fillAlpha: 0.55, duration: ms * 0.4, yoyo: true, hold: ms * 0.5, onComplete: () => dark.destroy() });
      const rose = put(scene, roseTex(scene, true), x, y - 18, AIR - 2, 0.1);
      scene.tweens.add({ targets: rose, scale: 2.6, angle: 40, duration: ms * 0.7, ease: 'Back.easeOut' });
      fadeKill(scene, [rose], ms * 0.85, 200);
      for (let i = 0; i < 16; i++) {
        const pol = scene.add.circle(x + rnd(-14, 14), y - 18 + rnd(-8, 8), rnd(1, 2), 0xff3030, 0.9).setDepth(AIR - 1).setBlendMode(ADD);
        scene.tweens.add({ targets: pol, y: pol.y - rnd(30, 60), x: pol.x + rnd(-20, 20), alpha: 0, delay: ms * 0.4, duration: ms * 0.6, onComplete: () => pol.destroy() });
      }
      break;
    }
    case 'mariposa': { // butterflies gather around the shooter
      for (let i = 0; i < 5; i++) {
        const b = put(scene, butterflyTex(scene, true, [0xffd23f, 0x7ad8ff, 0xff8ad8][i % 3]), x + rnd(-50, 50), y - rnd(20, 60), AIR, 1);
        scene.tweens.add({ targets: b, x: x + rnd(-14, 14), y: y - 14 + rnd(-8, 8), duration: ms * 0.8, ease: 'Sine.easeInOut' });
        fadeKill(scene, [b], ms, 120);
      }
      break;
    }
    case 'tiburon': { // a dark blue-indigo wave rises at the shooter's feet
      const w = scene.add.ellipse(x - 6, y + 6, 20, 10, 0x2a2a8a, 0.8).setStrokeStyle(2, 0x8ab8ff).setDepth(y + 1);
      scene.tweens.add({ targets: w, scaleX: 3, scaleY: 2.4, y: y - 6, duration: ms * 0.7, ease: 'Sine.easeOut' });
      fadeKill(scene, [w], ms * 0.7, 200);
      break;
    }
    default: break;
  }
}

// ------------------------------------------------------------------ shots: what travels with the ball
export function natureShot(scene: S, kind: Nature, ball: Img, level: number, target: { x: number; y: number }, onlyFirst: boolean) {
  if (!onlyFirst) return; // multi-ball shots: the escort goes with the first ball only
  const sx = ball.x, sy = ball.y;
  const escort = (look: string | number, n: number, scale: number, place: (i: number, bx: number, by: number, ang: number, t: number) => [number, number, number?]) => {
    const ps = Array.from({ length: n }, () => put(scene, penguinTex(scene, look), sx, sy, AIR, scale));
    follow(scene, ball, (bx, by, ang, t) => ps.forEach((p, i) => { const [px, py, rot] = place(i, bx, by, ang, t); p.setPosition(px, py).setRotation(rot ?? 0); }),
      (bx, by) => { ps.forEach((p) => { const a = rnd(0, Math.PI * 2); scene.tweens.add({ targets: p, x: bx + Math.cos(a) * 40, y: by + Math.sin(a) * 26, alpha: 0, angle: rnd(-180, 180), duration: 360, onComplete: () => p.destroy() }); }); });
    return ps;
  };
  const side = (ang: number) => [-Math.sin(ang), Math.cos(ang)];
  switch (kind) {
    case 'p2': { // five penguins follow the ball in a spiral, bright yellow energy
      escort('emperor', 5, 0.85, (i, bx, by, ang, t) => { const a = t * 14 + (i / 5) * Math.PI * 2, back = 8 + i * 3; return [bx - Math.cos(ang) * back + Math.cos(a) * 11, by - Math.sin(ang) * back + Math.sin(a) * 8, ang + Math.PI / 2]; });
      follow(scene, ball, (bx, by) => { if (Math.random() < 0.5) glow(scene, bx, by, 5, 0xffe23a, 220, 0.5); }, (bx, by) => glow(scene, bx, by, 16, 0xffe23a, 300, 0.6));
      break;
    }
    case 'p1': { // the pack hunts in a tight wedge and pecks at the target
      escort('feral', 6 + Math.floor(level / 4), 0.85, (i, bx, by, ang, t) => {
        const row = Math.floor((i + 1) / 2), s = i === 0 ? 0 : i % 2 ? 1 : -1, [nx, ny] = side(ang), back = 8 + row * 8;
        return [bx - Math.cos(ang) * back + nx * s * row * 6 + Math.sin(t * 30 + i) * 1.5, by - Math.sin(ang) * back + ny * s * row * 6, ang + Math.PI / 2];
      });
      follow(scene, ball, () => undefined, (bx, by) => { for (let k = 0; k < 8; k++) glow(scene, bx + rnd(-14, 14), by + rnd(-10, 10), 3, 0xff2a2a, 260, 0.7); });
      break;
    }
    case 'p3': { // a ring of purple penguins around the ball and the two heel trails of the other users
      escort('purple', 5, 0.8, (i, bx, by, _ang, t) => { const a = t * 10 + (i / 5) * Math.PI * 2; return [bx + Math.cos(a) * 14, by + Math.sin(a) * 14, a + Math.PI]; });
      follow(scene, ball, (bx, by, ang) => { const [nx, ny] = side(ang); for (const s of [-1, 1]) if (Math.random() < 0.6) glow(scene, bx + nx * s * 12, by + ny * s * 12, 3, 0x6a3aff, 260, 0.6); }, (bx, by) => glow(scene, bx, by, 18, 0xb35aff, 320, 0.6));
      break;
    }
    case 'px': { // black penguins orbit the ball in a dark red aura
      escort('black', 5, 0.85, (i, bx, by, ang, t) => { const a = -t * 12 + (i / 5) * Math.PI * 2; return [bx - Math.cos(ang) * 6 + Math.cos(a) * 13, by - Math.sin(ang) * 6 + Math.sin(a) * 9, ang + Math.PI / 2]; });
      follow(scene, ball, (bx, by) => { if (Math.random() < 0.6) glow(scene, bx, by, 7, 0x8a0a10, 260, 0.55); }, (bx, by) => glow(scene, bx, by, 22, 0xa01010, 360, 0.6));
      break;
    }
    case 'p7': { // seven coloured penguins and the rainbow arch they paint from the shooter to the ball
      const arc = scene.add.graphics().setDepth(AIR - 2).setBlendMode(ADD);
      const ps = RAINBOW.map((c) => put(scene, penguinTex(scene, c), sx, sy, AIR, 0.75));
      follow(scene, ball, (bx, by) => {
        arc.clear();
        const d = Math.hypot(bx - sx, by - sy), h = Math.min(60, d * 0.35);
        RAINBOW.forEach((c, i) => {
          arc.lineStyle(2, c, 0.55).beginPath();
          for (let k = 0; k <= 16; k++) { const u = k / 16, px = sx + (bx - sx) * u, py = sy + (by - sy) * u - Math.sin(u * Math.PI) * (h - i * 2.4); if (k) arc.lineTo(px, py); else arc.moveTo(px, py); }
          arc.strokePath();
          const u = Math.max(0, 1 - i * 0.07), px = sx + (bx - sx) * u, py = sy + (by - sy) * u - Math.sin(u * Math.PI) * (h - i * 2.4);
          ps[i].setPosition(px, py - 4);
        });
      }, (bx, by) => { fadeKill(scene, [arc], 0, 300); ps.forEach((p, i) => scene.tweens.add({ targets: p, x: bx + Math.cos(i) * 30, y: by - 20 - i * 3, alpha: 0, duration: 360, onComplete: () => p.destroy() })); });
      break;
    }
    case 'pspace': { // the space penguins come back down through the atmosphere onto the target
      const key = penguinTex(scene, 'space');
      for (let i = 0; i < 5; i++) {
        const tx = target.x + rnd(-18, 18), ty = target.y + rnd(-8, 8), p = put(scene, key, tx - 40, ty - 240, AIR, 1).setAngle(150);
        const fire = scene.add.circle(p.x, p.y, 7, 0xff7a1a, 0.6).setDepth(AIR - 1).setBlendMode(ADD);
        const delay = 120 + i * 70;
        scene.tweens.add({ targets: [p, fire], x: tx, y: ty, duration: 420, delay, ease: 'Cubic.easeIn', onComplete: () => { glow(scene, tx, ty, 10, 0xffa040, 260, 0.7); p.destroy(); fire.destroy(); } });
      }
      break;
    }
    case 'pperfect': { // the volley splits the penguins apart, a dark purple trail; they rejoin the ball on arrival
      escort('jet', 8, 0.75, (i, bx, by, ang, t) => { const [nx, ny] = side(ang), s = i % 2 ? 1 : -1, spread = Math.max(0, 18 - t * 30) + 6, back = 6 + Math.floor(i / 2) * 7; return [bx - Math.cos(ang) * back + nx * s * spread, by - Math.sin(ang) * back + ny * s * spread, ang + Math.PI / 2]; });
      follow(scene, ball, (bx, by) => { if (Math.random() < 0.7) glow(scene, bx, by, 5, 0x5a1a8a, 300, 0.5); }, (bx, by) => glow(scene, bx, by, 20, 0xffe27a, 300, 0.7));
      break;
    }
    case 'paereo': { // six penguins in a V like rockets, flames from their feet
      escort('emperor', 6, 0.8, (i, bx, by, ang) => { const [nx, ny] = side(ang), s = i % 2 ? 1 : -1, row = Math.floor(i / 2) + 1; return [bx - Math.cos(ang) * row * 9 + nx * s * row * 7, by - Math.sin(ang) * row * 9 + ny * s * row * 7, ang + Math.PI / 2]; });
      follow(scene, ball, (bx, by, ang) => { if (Math.random() < 0.8) glow(scene, bx - Math.cos(ang) * rnd(12, 30), by - Math.sin(ang) * rnd(12, 30), 3, 0xff7a1a, 200, 0.8); }, () => undefined);
      break;
    }
    case 'pmulti': { // penguins march in three lanes alongside the ball
      escort('emperor', 9, 0.6, (i, bx, by, ang, t) => { const [nx, ny] = side(ang), lane = (i % 3) - 1, back = 6 + Math.floor(i / 3) * 8; return [bx - Math.cos(ang) * back + nx * lane * 13, by - Math.sin(ang) * back + ny * lane * 13 + Math.sin(t * 25 + i) * 1.5, ang + Math.PI / 2]; });
      break;
    }
    case 'rosa': { // the ball becomes a thorned rose that loses petals as it spirals to the goal
      const rose = put(scene, roseTex(scene), sx, sy, AIR + 2, 1.1);
      ball.setAlpha(0.25);
      follow(scene, ball, (bx, by, _a, t) => {
        rose.setPosition(bx, by).setAngle(t * 400);
        if (Math.random() < 0.45) { const p = put(scene, petalTex(scene, 0xff4a8a), bx, by, AIR + 1, 1.1); scene.tweens.add({ targets: p, y: by + rnd(10, 26), x: bx + rnd(-10, 10), angle: rnd(-200, 200), alpha: 0, duration: 600, onComplete: () => p.destroy() }); }
      }, (bx, by) => { rose.destroy(); burstOf(scene, petalTex(scene, 0xff4a8a), bx, by, 12, 40, 520); for (let k = 0; k < 6; k++) glow(scene, bx + rnd(-10, 10), by + rnd(-8, 8), 2, 0x2f8a2a, 200, 0.9); });
      break;
    }
    case 'floral': { // black and red swirls, crimson petals in the wake
      follow(scene, ball, (bx, by, _a, t) => {
        glow(scene, bx + Math.cos(t * 20) * 6, by + Math.sin(t * 20) * 6, 4, Math.random() < 0.5 ? 0x1a0408 : 0xc41a2a, 240, 0.6);
        if (Math.random() < 0.35) { const p = put(scene, petalTex(scene, 0x8a1020), bx, by, AIR + 1, 1.2); scene.tweens.add({ targets: p, y: by + rnd(8, 20), angle: 300, alpha: 0, duration: 520, onComplete: () => p.destroy() }); }
      }, (bx, by) => { burstOf(scene, petalTex(scene, 0x8a1020), bx, by, 14, 46, 560); glow(scene, bx, by, 20, 0xc41a2a, 360, 0.6); });
      break;
    }
    case 'mariposa': { // butterflies flutter around the ball
      const cols = [0xffd23f, 0x7ad8ff, 0xff8ad8, 0xb5ff7a];
      const bs = cols.map((c) => put(scene, butterflyTex(scene, true, c), sx, sy, AIR + 1, 1));
      follow(scene, ball, (bx, by, _a, t) => bs.forEach((b, i) => {
        const a = t * 6 + (i / 4) * Math.PI * 2, open = Math.floor(t * 18 + i) % 2 === 0;
        b.setTexture(butterflyTex(scene, open, cols[i])).setPosition(bx + Math.cos(a) * 14, by - 4 + Math.sin(a * 1.3) * 10);
      }), (bx, by) => bs.forEach((b) => scene.tweens.add({ targets: b, x: bx + rnd(-50, 50), y: by - rnd(30, 70), alpha: 0, duration: 600, onComplete: () => b.destroy() })));
      break;
    }
    case 'tiburon': { // the pitch turns to ocean, a fin slices the water, and the shark leaps with its jaws at the goal
      const sea = scene.add.graphics().setDepth(sy - 3);
      const fin = put(scene, finTex(scene, 0x4a2a8a), sx, sy, AIR + 2, 1.2).setOrigin(0.5, 1);
      ball.setAlpha(0.3);
      follow(scene, ball, (bx, by, _a, t) => {
        sea.clear();
        sea.fillStyle(0x1a2a8a, 0.38).fillEllipse((sx + bx) / 2, (sy + by) / 2 + 8, Math.hypot(bx - sx, by - sy) + 40, 26);
        sea.lineStyle(1, 0x9ad8ff, 0.6);
        for (let k = 0; k < 4; k++) { const u = ((t * 2 + k / 4) % 1); sea.strokeEllipse(sx + (bx - sx) * u, sy + (by - sy) * u + 8, 10, 3); }
        fin.setPosition(bx, by + 6).setAngle(Math.sin(t * 18) * 6);
        if (Math.random() < 0.6) { const d = scene.add.circle(bx + rnd(-6, 6), by + 8, 1.5, 0xcfefff, 0.9).setDepth(AIR + 1); scene.tweens.add({ targets: d, y: d.y + 6, alpha: 0, duration: 300, onComplete: () => d.destroy() }); }
      }, (bx, by, ang) => {
        fin.destroy();
        const shark = put(scene, sharkTex(scene), bx, by + 10, AIR + 3, 1.2).setFlipX(Math.cos(ang) < 0).setAngle(Math.cos(ang) < 0 ? 30 : -30);
        scene.tweens.add({ targets: shark, y: by - 26, angle: 0, duration: 220, ease: 'Cubic.easeOut', yoyo: true, hold: 120, onComplete: () => shark.destroy() });
        for (let k = 0; k < 12; k++) { const d = scene.add.circle(bx + rnd(-16, 16), by + 6, rnd(1.5, 3), 0xbfe8ff, 0.9).setDepth(AIR + 2); scene.tweens.add({ targets: d, y: by - rnd(10, 34), x: d.x + rnd(-12, 12), alpha: 0, duration: 480, ease: 'Sine.easeOut', onComplete: () => d.destroy() }); }
        fadeKill(scene, [sea], 360, 300);
      });
      break;
    }
    default: break;
  }
}

// ------------------------------------------------------------------ defences and keepers: an area at (x, y) of radius r
export function natureArea(scene: S, kind: Nature, x: number, y: number, r: number, level: number, targets: { x: number; y: number }[] = []) {
  const t0 = targets[0] ?? { x: x + r * 0.6, y };
  switch (kind) {
    case 'fiesta': { // golden sparkles circle the rivals, bloom into five flowers that rise and burst like fireworks
      const at = targets.length ? targets.slice(0, 5) : [t0];
      at.forEach((p, j) => {
        const sp = Array.from({ length: 5 }, () => put(scene, sparkleTex(scene), p.x, p.y, AIR, 0.8).setTint(0xffd23f));
        const st = { k: 0 };
        scene.tweens.add({ targets: st, k: 1, duration: 520, delay: j * 60, onUpdate: () => sp.forEach((s, i) => { const a = st.k * 7 + (i / 5) * Math.PI * 2; s.setPosition(p.x + Math.cos(a) * 16, p.y - 6 + Math.sin(a) * 8).setScale(0.8 + st.k); }),
          onComplete: () => sp.forEach((s, i) => {
            const fl = put(scene, flowerTex(scene), s.x, s.y, AIR + 1, 0.2);
            s.destroy();
            scene.tweens.add({ targets: fl, scale: 1.1, angle: 120, duration: 260, ease: 'Back.easeOut' });
            scene.tweens.add({ targets: fl, y: fl.y - 50 - i * 6, duration: 420, delay: 260, ease: 'Cubic.easeOut', onComplete: () => {
              for (let k = 0; k < 10; k++) { const a = (k / 10) * Math.PI * 2, c = k % 2 ? 0xffe23a : 0x5af0e0; const d = scene.add.circle(fl.x, fl.y, 1.6, c, 1).setDepth(AIR + 2).setBlendMode(ADD); scene.tweens.add({ targets: d, x: fl.x + Math.cos(a) * 24, y: fl.y + Math.sin(a) * 24, alpha: 0, duration: 420, onComplete: () => d.destroy() }); }
              fl.destroy();
            } });
          }) });
      });
      break;
    }
    case 'petalos': { // fallen petals whirl into a whirlwind in front of the keeper
      const n = lowPower ? 18 : 30;
      for (let i = 0; i < n; i++) {
        const p = put(scene, petalTex(scene, [0xffa0c8, 0xff6aa8, 0xffffff][i % 3]), x + rnd(-r, r), y + rnd(4, 12), AIR, 1.2), st = { k: 0 }, a0 = rnd(0, Math.PI * 2), rr = rnd(0.4, 1) * r;
        scene.tweens.add({ targets: st, k: 1, duration: 760, delay: rnd(0, 120), onUpdate: () => { const a = a0 + st.k * 9; p.setPosition(x + Math.cos(a) * rr * (0.5 + st.k * 0.5), y - st.k * 36 + Math.sin(a) * rr * 0.35).setAngle(st.k * 720); }, onComplete: () => scene.tweens.add({ targets: p, x: p.x + rnd(-40, 40), y: p.y + rnd(10, 30), alpha: 0, duration: 260, onComplete: () => p.destroy() }) });
      }
      break;
    }
    case 'hojarasca': { // a mass of leaves flutters down in front of the goal
      const cols = [0x8acb3a, 0xd8a02a, 0xc8642a, 0x5aa83a];
      for (let i = 0; i < (lowPower ? 16 : 26); i++) {
        const lx = x + rnd(-r, r), p = put(scene, leafTex(scene, cols[i % 4]), lx, y - rnd(40, 80), AIR, 1.2);
        scene.tweens.add({ targets: p, y: y + rnd(0, 14), duration: rnd(600, 900), ease: 'Sine.easeIn' });
        scene.tweens.add({ targets: p, x: lx + rnd(12, 20), angle: { from: -40, to: 40 }, duration: 180, yoyo: true, repeat: 3, ease: 'Sine.easeInOut' });
        fadeKill(scene, [p], 900, 260);
      }
      break;
    }
    case 'hojas': { // a whirlwind gathers leaves into a huge ball that rolls over the rivals
      const cols = [0x5aa83a, 0x8acb3a, 0x3a8a2a];
      const ball = scene.add.container(x, y - 8).setDepth(AIR);
      for (let i = 0; i < 16; i++) { const a = rnd(0, Math.PI * 2), d = rnd(0, 9); ball.add(scene.add.image(Math.cos(a) * d, Math.sin(a) * d, leafTex(scene, cols[i % 3])).setAngle(rnd(0, 360)).setScale(1.3)); }
      ball.setScale(0.2);
      scene.tweens.add({ targets: ball, scale: 1.4 + level * 0.04, angle: 360, duration: 360, ease: 'Back.easeOut' });
      scene.tweens.add({ targets: ball, x: t0.x, y: t0.y, angle: 1080, delay: 360, duration: 320, ease: 'Cubic.easeIn', onComplete: () => { burstOf(scene, leafTex(scene, 0x5aa83a), ball.x, ball.y, 14, 44, 480); ball.destroy(); } });
      break;
    }
    case 'orca': { // water floods around the rival, a dorsal fin circles it and the killer whale breaches
      const pool = scene.add.ellipse(t0.x, t0.y + 8, r * 1.8, r * 0.7, 0x1a4aa8, 0.45).setStrokeStyle(2, 0x9ad8ff, 0.8).setDepth(t0.y - 2).setScale(0.2);
      scene.tweens.add({ targets: pool, scale: 1, duration: 200, ease: 'Back.easeOut' });
      const fin = put(scene, finTex(scene, 0x0a0a10), t0.x, t0.y, t0.y + 9, 1.1).setOrigin(0.5, 1), st = { a: 0 };
      scene.tweens.add({ targets: st, a: Math.PI * 2, duration: 420, onUpdate: () => fin.setPosition(t0.x + Math.cos(st.a) * r * 0.75, t0.y + 8 + Math.sin(st.a) * r * 0.28).setFlipX(Math.sin(st.a) > 0), onComplete: () => {
        fin.destroy();
        const orca = put(scene, orcaTex(scene), t0.x - r * 0.6, t0.y + 6, AIR + 1, 1.2).setAngle(-35);
        scene.tweens.add({ targets: orca, x: t0.x + r * 0.6, duration: 380, ease: 'Linear' });
        scene.tweens.add({ targets: orca, y: t0.y - 30, duration: 190, yoyo: true, ease: 'Sine.easeOut' });
        scene.tweens.add({ targets: orca, angle: 35, duration: 380, onComplete: () => orca.destroy() });
        for (let k = 0; k < 10; k++) { const d = scene.add.circle(t0.x + rnd(-r * 0.6, r * 0.6), t0.y + 6, rnd(1.5, 3), 0xcfefff, 0.9).setDepth(AIR); scene.tweens.add({ targets: d, y: d.y - rnd(10, 30), alpha: 0, duration: 420, delay: rnd(0, 200), onComplete: () => d.destroy() }); }
      } });
      fadeKill(scene, [pool], 820, 260);
      break;
    }
    case 'ballena': { // a wave crests, a giant whale swallows the rivals and blows them out through its blowhole
      const wave = scene.add.ellipse(x, y + 8, r * 2, 14, 0x2a6ad8, 0.6).setStrokeStyle(3, 0xcfefff, 0.9).setDepth(y - 1);
      scene.tweens.add({ targets: wave, scaleY: 3, y: y - 6, duration: 300, yoyo: true, hold: 300 });
      const whale = put(scene, whaleTex(scene), t0.x, t0.y + 24, AIR + 1, 0.3).setOrigin(0.5, 1);
      scene.tweens.add({ targets: whale, scale: 1.1 + level * 0.03, y: t0.y + 14, duration: 320, ease: 'Back.easeOut' });
      scene.tweens.add({ targets: whale, scaleY: 0.7 + level * 0.02, duration: 120, delay: 420, yoyo: true }); // gulp
      scene.time.delayedCall(560, () => {
        for (let k = 0; k < 12; k++) { const d = scene.add.circle(t0.x, t0.y - 18, rnd(1.5, 3), 0xcfefff, 0.95).setDepth(AIR + 2); scene.tweens.add({ targets: d, x: t0.x + rnd(-24, 24), y: t0.y - rnd(40, 70), alpha: 0, duration: 520, ease: 'Sine.easeOut', onComplete: () => d.destroy() }); }
      });
      fadeKill(scene, [wave, whale], 900, 260);
      break;
    }
    case 'phand': { // five red penguins spiral down and peck the keeper's arm; the red fist opens and stops the shot
      const ax = x + 10, ay = y - 16;
      for (let i = 0; i < 5; i++) {
        const p = put(scene, penguinTex(scene, 'red'), ax, ay, AIR + 1, 0.8), st = { k: 0 }, a0 = (i / 5) * Math.PI * 2;
        scene.tweens.add({ targets: st, k: 1, duration: 420, delay: i * 50, ease: 'Sine.easeIn', onUpdate: () => { const rr = 50 * (1 - st.k), a = a0 + st.k * 6; p.setPosition(ax + Math.cos(a) * rr, ay - 40 * (1 - st.k) + Math.sin(a) * rr * 0.4); },
          onComplete: () => { glow(scene, ax + rnd(-4, 4), ay + rnd(-4, 4), 3, 0xff2a2a, 160, 0.9); scene.tweens.add({ targets: p, x: ax + Math.cos(a0) * 40, y: ay + Math.sin(a0) * 26, alpha: 0, delay: 360, duration: 300, onComplete: () => p.destroy() }); } });
      }
      scene.time.delayedCall(560, () => {
        const fist = scene.add.circle(ax + 12, ay, 9, 0xff2a2a, 0.75).setDepth(AIR + 2).setBlendMode(ADD);
        scene.tweens.add({ targets: fist, scale: 2.6, alpha: 0, duration: 340, onComplete: () => fist.destroy() });
      });
      break;
    }
    default: break;
  }
}
