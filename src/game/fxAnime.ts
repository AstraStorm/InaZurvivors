/**
 * v1.4: techniques redrawn from their anime scenes (frames studied one by one). Visual only: damage, reach and
 * behaviour stay those of their type in ArenaScene. Original 2D drawings built from small generated textures.
 *
 *   Brisa deslizante (Easy Breezy) — "evade the opponent with a light and breezy step, like a gust of wind blowing
 *     through" (zukan.inazuma.jp): green-white ribbons of breeze sweep along the step, leaves flutter in its wake.
 *   Viento celestial (God Wind) — v1.5, redone at the author's request: no wings. The wind whirls around the shooter
 *     and leaves as a gust that draws a full S towards the rival, hurting what it crosses as it goes (godWindGust).
 *   Tormenta, tornado, huracán — white crescents of wind curl around the ball at the kick and keep wrapping it, while
 *     a trail of sand rises behind.
 *   Tormenta de fuego — the shooter rises in a pillar of fire and a giant of flames appears behind him, flexing; the
 *     ball leaves with tongues of fire and bursts into flames at the end.
 *   Tornado de fuego (Fire Tornado) — v1.5: the shooter spins up inside a rising spiral of flame, leaving a ring of fire
 *     at his feet; the ball leaves wrapped in two braided tongues of fire and bursts into a ring of flames.
 *   Ciclón blanco (White Hurricane) — golden rays burst from the shooter, white wind spirals up into a vortex; the
 *     ball, golden inside a bubble of wind, is followed by a huge golden-white crescent of hurricane.
 */
import Phaser from 'phaser';

type S = Phaser.Scene;
type Img = Phaser.GameObjects.Image;
const AIR = 8900;
// normal blending: additive light over the green pitch turned the gold to lime and washed the fire giant out
const ADD = Phaser.BlendModes.NORMAL;
const rnd = (a: number, b: number) => a + Math.random() * (b - a);
const BREEZE = 0xc8ffe0, BREEZE2 = 0x7fffc0, GOLD = 0xffd23f, GOLD2 = 0xfff2a0, FIRE = 0xff7a1a, FIRE2 = 0xffd04a;

export type AnimeMove = 'brisa' | 'godwind' | 'tth' | 'fuego' | 'ciclon' | 'tfuego';
export function animeOf(name: string): AnimeMove | null {
  if (/brisa deslizante|easy breezy|soyokaze/i.test(name)) return 'brisa';
  if (/viento celestial|god ?wind/i.test(name)) return 'godwind';
  if (/tormenta,? tornado,? hurac[aá]n|storm.?tornado.?hurricane/i.test(name)) return 'tth';
  if (/tormenta de fuego|bakunetsu storm|fire ?storm/i.test(name)) return 'fuego';
  if (/tornado de fuego|fire ?tornado|fire tornado/i.test(name)) return 'tfuego';
  if (/cicl[oó]n blanco|hurac[aá]n blanco|white hurricane/i.test(name)) return 'ciclon';
  return null;
}

// ------------------------------------------------------------------ textures (generated once per scene)
function tex(scene: S, key: string, w: number, h: number, draw: (g: Phaser.GameObjects.Graphics) => void) {
  const k = `anime:${key}`;
  if (!scene.textures.exists(k)) {
    const g = scene.make.graphics({}, false);
    draw(g);
    g.generateTexture(k, w, h);
    g.destroy();
  }
  return k;
}
/** a curved ribbon of wind, brighter in the middle */
const streakTex = (scene: S) => tex(scene, 'streak', 48, 16, (g) => {
  g.lineStyle(5, 0xffffff, 0.35); g.beginPath(); g.arc(24, 44, 40, -2.2, -0.94); g.strokePath();
  g.lineStyle(2, 0xffffff, 1); g.beginPath(); g.arc(24, 44, 40, -2.05, -1.1); g.strokePath();
});
/** a crescent blade of wind (thick in the middle, thin at the tips), drawn white to be tinted */
const crescentTex = (scene: S) => tex(scene, 'crescent', 40, 40, (g) => {
  for (let k = 0; k < 6; k++) { g.lineStyle(7 - k, 0xffffff, 0.25 + k * 0.13); g.beginPath(); g.arc(20, 20, 16 - k * 0.4, -2.6 + k * 0.18, 0.2 - k * 0.18); g.strokePath(); }
});
/** a short jagged bolt */
const boltTex = (scene: S) => tex(scene, 'bolt', 44, 16, (g) => {
  const pts = [[0, 8], [7, 3], [13, 11], [20, 4], [27, 12], [34, 5], [44, 9]];
  g.lineStyle(5, 0xffffff, 0.3); g.strokePoints(pts.map(([x, y]) => ({ x, y })), false);
  g.lineStyle(2, 0xffffff, 1); g.strokePoints(pts.map(([x, y]) => ({ x, y })), false);
});
const leafTex = (scene: S) => tex(scene, 'leaf', 8, 5, (g) => {
  g.fillStyle(0x9cffb0, 1); g.fillEllipse(4, 2.5, 8, 4); g.fillStyle(0x3aa860, 1); g.fillRect(1, 2, 6, 1);
});
const featherTex = (scene: S) => tex(scene, 'feather', 10, 4, (g) => {
  g.fillStyle(0xffffff, 1); g.fillEllipse(5, 2, 10, 4); g.fillStyle(0xffe8a0, 1); g.fillRect(0, 1.5, 9, 1);
});
/** the giant of flames: head with flame hair, broad shoulders and flexed arms (drawn bright, shown additive) */
const giantTex = (scene: S) => tex(scene, 'giant', 100, 90, (g) => {
  const body = (c: number, s: number) => {
    g.fillStyle(c, 1);
    g.fillEllipse(50, 62, 64 * s, 46 * s); // chest
    g.fillEllipse(50, 30, 26 * s, 26 * s); // head
    g.fillEllipse(18, 46, 22 * s, 34 * s); g.fillEllipse(82, 46, 22 * s, 34 * s); // shoulders and upper arms
    g.fillEllipse(14, 28, 16 * s, 20 * s); g.fillEllipse(86, 28, 16 * s, 20 * s); // fists raised (flexing)
    for (let k = 0; k < 7; k++) { const x = 34 + k * 5.3; g.fillTriangle(x - 5 * s, 24, x + 5 * s, 24, x + rnd(-3, 3), 4 + Math.abs(3 - k) * 3); } // flame hair
  };
  body(0xff5a10, 1); body(0xffa030, 0.78); body(0xffe08a, 0.45);
  g.fillStyle(0x7a1a00, 1); g.fillRect(43, 28, 4, 3); g.fillRect(53, 28, 4, 3); // eyes
});

// ------------------------------------------------------------------ small helpers
const fade = (scene: S, o: Phaser.GameObjects.GameObject, delay: number, dur = 220) =>
  scene.tweens.add({ targets: o, alpha: 0, delay, duration: dur, onComplete: () => o.destroy() });
/** golden (or any colour) rays bursting from a point */
function rays(scene: S, x: number, y: number, n: number, color: number, len: number, ms: number) {
  for (let k = 0; k < n; k++) {
    const a = (k / n) * Math.PI * 2 + rnd(-0.1, 0.1);
    const r = scene.add.rectangle(x, y, len, 2, color, 0.9).setOrigin(0, 0.5).setRotation(a).setDepth(AIR - 1).setBlendMode(ADD).setScale(0.1, 1);
    scene.tweens.add({ targets: r, scaleX: 1, alpha: 0, duration: ms, ease: 'Cubic.easeOut', onComplete: () => r.destroy() });
  }
}
/** something that rides along with a flying ball until it lands */
function ride(scene: S, ball: Img, frame: (bx: number, by: number, ang: number, t: number) => void, end: (bx: number, by: number, ang: number) => void) {
  let px = ball.x, py = ball.y, ang = 0;
  const t0 = scene.time.now;
  const tick = () => {
    if (!ball.active) { scene.events.off('update', tick); end(px, py, ang); return; }
    if (Math.hypot(ball.x - px, ball.y - py) > 0.5) ang = Math.atan2(ball.y - py, ball.x - px);
    px = ball.x; py = ball.y;
    frame(px, py, ang, (scene.time.now - t0) / 1000);
  };
  scene.events.on('update', tick);
  scene.events.once('shutdown', () => scene.events.off('update', tick));
}

// ------------------------------------------------------------------ Brisa deslizante (a dribble)
export function breezeStep(scene: S, x: number, y: number, tx: number, ty: number, level: number, ms = 380) {
  const ang = Math.atan2(ty - y, tx - x), len = Math.max(30, Math.hypot(tx - x, ty - y));
  const nx = -Math.sin(ang), ny = Math.cos(ang);
  const lanes = 3 + Math.min(3, Math.floor(level / 3));
  for (let k = 0; k < lanes; k++) {
    const off = (k - (lanes - 1) / 2) * 9, flip = k % 2 ? -1 : 1;
    const s = scene.add.image(x - Math.cos(ang) * 20 + nx * off, y - 10 - Math.sin(ang) * 20 + ny * off, streakTex(scene))
      .setDepth(AIR).setBlendMode(ADD).setTint(k % 2 ? BREEZE : BREEZE2).setAlpha(0).setRotation(ang).setScale(0.9, 1.1 * flip);
    scene.tweens.add({ targets: s, x: tx + Math.cos(ang) * 26 + nx * off, y: ty - 10 + Math.sin(ang) * 26 + ny * off, scaleX: 1.7, delay: k * 40, duration: ms, ease: 'Sine.easeOut' });
    scene.tweens.add({ targets: s, alpha: { from: 0, to: 0.95 }, yoyo: true, delay: k * 40, duration: ms / 2, onComplete: () => s.destroy() });
  }
  for (let k = 0; k < 3; k++) { // afterimages of the step
    const f = 0.25 + k * 0.25, o = scene.add.ellipse(x + Math.cos(ang) * len * f, y + Math.sin(ang) * len * f, 16, 6, BREEZE, 0.5).setDepth(y - 1).setBlendMode(ADD);
    scene.tweens.add({ targets: o, alpha: 0, scaleX: 1.8, delay: k * 60, duration: 320, onComplete: () => o.destroy() });
  }
  for (let k = 0; k < 5 + level; k++) { // leaves caught in the gust
    const l = scene.add.image(x + rnd(-8, 8), y - rnd(0, 18), leafTex(scene)).setDepth(AIR + 1).setRotation(rnd(0, 6)).setScale(1.5);
    const f = rnd(0.6, 1.3);
    scene.tweens.add({ targets: l, x: tx + Math.cos(ang) * 30 * f + nx * rnd(-20, 20), y: ty - 6 + Math.sin(ang) * 30 * f + ny * rnd(-20, 20) - rnd(4, 18),
      angle: rnd(240, 720), alpha: 0, delay: rnd(0, 120), duration: ms + rnd(80, 260), ease: 'Sine.easeOut', onComplete: () => l.destroy() });
  }
}

// ------------------------------------------------------------------ shots: the charge
export function animeCharge(scene: S, kind: AnimeMove, x: number, y: number, level: number, ms: number) {
  switch (kind) {
    case 'godwind': { // v1.5 (author): no wings — the wind gathers around him in a whirl, gold sparks crackle in it
      const aura = scene.add.circle(x, y - 12, 14, GOLD, 0.3).setDepth(y - 2).setBlendMode(ADD);
      scene.tweens.add({ targets: aura, scale: 2, alpha: 0.1, duration: ms, onComplete: () => aura.destroy() });
      for (let k = 0; k < 7 + level; k++) {
        const s = scene.add.image(x, y, streakTex(scene)).setDepth(AIR).setBlendMode(ADD).setTint(k % 3 ? 0xffffff : GOLD2).setAlpha(0).setScale(0.6);
        const st = { t: 0 }, a0 = (k / (7 + level)) * Math.PI * 2;
        scene.tweens.add({ targets: st, t: 1, delay: k * 18, duration: ms * 0.85, ease: 'Sine.easeIn',
          onUpdate: () => { const a = a0 - st.t * 8, r = 34 - st.t * 22; s.setPosition(x + Math.cos(a) * r, y - 10 + Math.sin(a) * r * 0.45).setRotation(a - Math.PI / 2).setAlpha(Math.sin(st.t * Math.PI)); },
          onComplete: () => s.destroy() });
      }
      for (let k = 0; k < 5 + Math.floor(level / 2); k++) {
        const a = rnd(0, Math.PI * 2), b = scene.add.image(x + Math.cos(a) * 18, y - 8 + Math.sin(a) * 10, boltTex(scene)).setDepth(AIR).setBlendMode(ADD).setTint(k % 2 ? GOLD : GOLD2).setRotation(a + Math.PI / 2).setScale(0.6).setAlpha(0);
        scene.tweens.add({ targets: b, alpha: 1, yoyo: true, delay: (k / 6) * ms * 0.7, duration: 90, onComplete: () => b.destroy() });
      }
      break;
    }
    case 'tth': { // white crescents curl around the ball at the kicker's feet; dust at the heels
      for (let k = 0; k < 3 + Math.floor(level / 3); k++) {
        const c = scene.add.image(x + 6, y, crescentTex(scene)).setDepth(AIR).setBlendMode(ADD).setScale(0.3).setAlpha(0).setAngle(k * 120);
        scene.tweens.add({ targets: c, angle: c.angle + 540, scale: 0.75, alpha: { from: 0.2, to: 0.95 }, delay: k * 60, duration: ms, ease: 'Sine.easeIn', onComplete: () => fade(scene, c, 0, 120) });
      }
      for (let k = 0; k < 6; k++) {
        const d = scene.add.circle(x + rnd(-10, 10), y + 8, rnd(3, 5), 0xd8b070, 0.7).setDepth(y + 1);
        scene.tweens.add({ targets: d, y: d.y - rnd(6, 14), x: d.x + rnd(-14, 14), scale: 2, alpha: 0, delay: ms * 0.5 + k * 25, duration: 380, onComplete: () => d.destroy() });
      }
      break;
    }
    case 'fuego': { // a pillar of fire lifts him and the giant of flames rises behind, flexing
      const pillar = scene.add.rectangle(x, y + 6, 20, 4, FIRE, 0.6).setOrigin(0.5, 1).setDepth(y - 1).setBlendMode(ADD);
      scene.tweens.add({ targets: pillar, displayHeight: 60 + level * 3, displayWidth: 26, duration: ms * 0.5, ease: 'Cubic.easeOut' });
      fade(scene, pillar, ms * 0.8, 200);
      const giant = scene.add.image(x, y - 6, giantTex(scene)).setOrigin(0.5, 1).setDepth(y - 3).setBlendMode(ADD).setAlpha(0).setScale(0.4);
      scene.tweens.add({ targets: giant, alpha: 0.92, scale: 1 + level * 0.03, duration: ms * 0.55, ease: 'Back.easeOut' });
      scene.tweens.add({ targets: giant, scaleX: (1 + level * 0.03) * 1.08, yoyo: true, repeat: 1, delay: ms * 0.55, duration: ms * 0.12 }); // the flex
      fade(scene, giant, ms, 260);
      for (let k = 0; k < 10 + level; k++) { // embers rising in the pillar
        const e = scene.add.circle(x + rnd(-10, 10), y + 4, rnd(1.5, 3), k % 2 ? FIRE : FIRE2, 1).setDepth(AIR).setBlendMode(ADD);
        scene.tweens.add({ targets: e, y: y - rnd(40, 70), x: e.x + rnd(-8, 8), alpha: 0, delay: rnd(0, ms * 0.6), duration: rnd(300, 500), onComplete: () => e.destroy() });
      }
      break;
    }
    case 'tfuego': { // v1.5: he spins up inside a spiral of flame; a ring of fire stays at his feet
      const ring = scene.add.ellipse(x, y + 4, 18, 7).setStrokeStyle(3, FIRE, 0.9).setDepth(y + 1).setBlendMode(ADD);
      scene.tweens.add({ targets: ring, scaleX: 2.4, scaleY: 2.4, duration: ms * 0.6, ease: 'Cubic.easeOut' });
      fade(scene, ring, ms * 0.7, 260);
      const n = 9 + level;
      for (let k = 0; k < n; k++) {
        const s = scene.add.image(x, y + 4, streakTex(scene)).setDepth(AIR).setBlendMode(ADD).setTint(k % 3 ? FIRE : FIRE2).setAlpha(0).setScale(0.75);
        const st = { t: 0 }, a0 = (k / n) * Math.PI * 2;
        scene.tweens.add({ targets: st, t: 1, delay: k * 22, duration: ms * 0.8, ease: 'Sine.easeOut',
          onUpdate: () => { const a = a0 + st.t * 9, r = 16 - st.t * 6; s.setPosition(x + Math.cos(a) * r, y + 4 - st.t * 46 + Math.sin(a) * r * 0.4).setRotation(a + Math.PI / 2).setAlpha(Math.sin(st.t * Math.PI) * 0.95); },
          onComplete: () => s.destroy() });
      }
      for (let k = 0; k < 8 + level; k++) { // embers thrown off the spin
        const e = scene.add.circle(x, y - rnd(0, 30), rnd(1.2, 2.6), k % 2 ? FIRE : FIRE2, 1).setDepth(AIR).setBlendMode(ADD);
        const a = rnd(0, Math.PI * 2);
        scene.tweens.add({ targets: e, x: x + Math.cos(a) * rnd(18, 34), y: e.y + Math.sin(a) * rnd(6, 14) - rnd(6, 20), alpha: 0, delay: rnd(ms * 0.2, ms * 0.8), duration: rnd(260, 420), onComplete: () => e.destroy() });
      }
      break;
    }
    case 'ciclon': { // golden rays burst out, then white wind spirals up around him into a vortex above
      rays(scene, x, y - 10, 14, GOLD2, 60 + level * 3, ms * 0.6);
      const vortex = scene.add.ellipse(x, y - 54, 30, 10).setStrokeStyle(3, 0xffffff, 0.8).setDepth(AIR).setBlendMode(ADD).setAlpha(0);
      scene.tweens.add({ targets: vortex, alpha: 1, scaleX: 2.6, scaleY: 2.2, delay: ms * 0.3, duration: ms * 0.6, onComplete: () => fade(scene, vortex, 0, 200) });
      for (let k = 0; k < 8 + level; k++) {
        const s = scene.add.image(x, y + 4, streakTex(scene)).setDepth(AIR).setBlendMode(ADD).setTint(k % 3 ? 0xffffff : GOLD2).setAlpha(0.9).setScale(0.7);
        const st = { t: 0 }, a0 = (k / (8 + level)) * Math.PI * 2;
        scene.tweens.add({ targets: st, t: 1, delay: ms * 0.25 + k * 20, duration: ms * 0.7, ease: 'Sine.easeIn',
          onUpdate: () => { const a = a0 + st.t * 7, r = 14 + st.t * 26; s.setPosition(x + Math.cos(a) * r, y + 4 - st.t * 58 + Math.sin(a) * r * 0.35).setRotation(a + Math.PI / 2).setAlpha(0.9 * (1 - st.t * 0.6)); },
          onComplete: () => s.destroy() });
      }
      break;
    }
    default: break;
  }
}

/**
 * v1.5 (author's request): Viento celestial as a real gust. Instead of a ball, a head of wind leaves the shooter and
 * draws a full S on its way to the rival (one sine period across the path), leaving white-gold wind behind it that
 * fades a moment later. `onPoint` is called every frame with the head's position: the scene deals the damage there, so
 * the hits follow the gust as it travels instead of landing all at once. Nothing stays on screen afterwards.
 */
export function godWindGust(scene: S, fx: number, fy: number, tx: number, ty: number, level: number, ms: number, onPoint: (x: number, y: number, ang: number) => void) {
  const dx = tx - fx, dy = ty - fy, len = Math.hypot(dx, dy) || 1, ux = dx / len, uy = dy / len, nx = -uy, ny = ux;
  const amp = Math.min(46, 18 + len * 0.16) * (1 + level * 0.02);
  const at = (p: number) => { const w = Math.sin(p * Math.PI * 2) * amp; return { x: fx + dx * p + nx * w, y: fy + dy * p + ny * w }; };
  const head = scene.add.circle(fx, fy, 9 + level * 0.6, 0xffffff, 0.75).setDepth(AIR + 1).setBlendMode(ADD);
  const halo = scene.add.circle(fx, fy, 12 + level * 0.6, GOLD2, 0.2).setDepth(AIR).setBlendMode(ADD);
  const blades = Array.from({ length: 3 }, (_, i) => scene.add.image(fx, fy, crescentTex(scene)).setDepth(AIR + 2).setBlendMode(ADD).setTint(i === 1 ? GOLD2 : 0xffffff).setScale(0.55 + level * 0.02));
  const st = { p: 0 };
  let lastTrail = -1, prev = at(0);
  // the S itself: a continuous ribbon of wind (three strands) that follows the head, thick near it, thin and faint at
  // the tail; points older than LIFE fade away, so the S draws itself and then blows away
  const LIFE = Math.max(650, ms * 0.95), width = 7 + level * 0.5;
  const ribbon = scene.add.graphics().setDepth(AIR).setBlendMode(ADD);
  const pts: { x: number; y: number; t: number }[] = [];
  const drawRibbon = () => {
    const now = scene.time.now;
    while (pts.length && now - pts[0].t > LIFE) pts.shift();
    ribbon.clear();
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1], b = pts[i], life = 1 - (now - b.t) / LIFE, along = i / pts.length;
      const w = width * (0.25 + 0.75 * along) * life;
      ribbon.lineStyle(w * 2.2, GOLD2, 0.18 * life).lineBetween(a.x, a.y, b.x, b.y);
      ribbon.lineStyle(w, 0xffffff, 0.75 * life).lineBetween(a.x, a.y, b.x, b.y);
      for (const side of [-1, 1]) { // two thin strands braided around the core
        const o = Math.sin(along * 14 + now / 60) * w * 0.9 * side;
        ribbon.lineStyle(1.5, side < 0 ? 0xdff6ff : GOLD2, 0.8 * life).lineBetween(a.x + nx * o, a.y + ny * o, b.x + nx * o, b.y + ny * o);
      }
    }
  };
  scene.tweens.add({ targets: st, p: 1, duration: ms, ease: 'Sine.easeInOut',
    onUpdate: () => {
      const c = at(st.p), ang = Math.atan2(c.y - prev.y, c.x - prev.x);
      head.setPosition(c.x, c.y).setScale(1 + Math.sin(st.p * 40) * 0.1);
      halo.setPosition(c.x, c.y);
      blades.forEach((b, i) => b.setPosition(c.x, c.y).setRotation(st.p * 30 + (i / 3) * Math.PI * 2));
      pts.push({ x: c.x, y: c.y, t: scene.time.now });
      drawRibbon();
      // wind streaks thrown along the path (lying with it), fading behind the head
      const step = Math.floor(st.p * 30);
      if (step !== lastTrail) {
        lastTrail = step;
        const off = rnd(-9, 9);
        const s = scene.add.image(c.x + nx * off, c.y + ny * off, streakTex(scene)).setDepth(AIR).setBlendMode(ADD).setTint(step % 3 ? 0xffffff : GOLD2)
          .setRotation(ang).setScale(0.6 + level * 0.03, 0.7).setAlpha(0.8);
        scene.tweens.add({ targets: s, alpha: 0, scaleX: s.scaleX * 1.5, x: s.x + ux * 12, y: s.y + uy * 12, delay: 200, duration: 380, onComplete: () => s.destroy() });
        if (step % 4 === 0) { // a gold spark thrown off sideways
          const sp = scene.add.image(c.x, c.y, boltTex(scene)).setDepth(AIR).setBlendMode(ADD).setTint(GOLD).setScale(0.45).setRotation(ang + rnd(-0.6, 0.6));
          scene.tweens.add({ targets: sp, alpha: 0, x: sp.x + nx * rnd(-14, 14), y: sp.y + ny * rnd(-14, 14), duration: 220, onComplete: () => sp.destroy() });
        }
      }
      prev = c;
      onPoint(c.x, c.y, ang);
    },
    onComplete: () => {
      const end = at(1);
      const b = scene.add.circle(end.x, end.y, 12, 0xffffff, 0.7).setDepth(AIR).setBlendMode(ADD);
      scene.tweens.add({ targets: b, scale: 3.2, alpha: 0, duration: 300, onComplete: () => b.destroy() });
      scene.tweens.add({ targets: [head, halo, ...blades], alpha: 0, duration: 160, onComplete: () => { head.destroy(); halo.destroy(); blades.forEach((x) => x.destroy()); } });
      // the ribbon keeps fading on its own, then goes
      const fadeOut = { k: 0 };
      scene.tweens.add({ targets: fadeOut, k: 1, duration: LIFE + 50, onUpdate: drawRibbon, onComplete: () => ribbon.destroy() });
    } });
}

/**
 * v1.5: La Aurora (The Birth), combined shot of Xavier and Shawn: curtains of aurora (green, cyan and violet) wave in the
 * sky over the meeting point while the power gathers, then fade. Graphics redrawn every frame, gone at the end.
 */
export function auroraVeil(scene: S, x: number, y: number, size: number, ms: number) {
  const g = scene.add.graphics().setDepth(AIR).setBlendMode(Phaser.BlendModes.ADD);
  const cols = [0x5cffb0, 0x7ff6ff, 0xb98aff, 0x5cffb0, 0x7ff6ff];
  const st = { t: 0 };
  scene.tweens.add({ targets: st, t: 1, duration: ms + 300, onUpdate: () => {
    g.clear();
    const life = Math.sin(Math.min(1, st.t * 1.15) * Math.PI); // rises, holds, fades
    cols.forEach((c, i) => {
      const cx = x + (i - 2) * size * 0.45, top = y - size * 2.2, h = size * 1.6;
      for (let k = 0; k < 14; k++) {
        const yy = top + (k / 14) * h, sway = Math.sin(k * 0.5 + st.t * 9 + i) * size * 0.18;
        g.fillStyle(c, 0.16 * life * (1 - k / 16)).fillRect(cx + sway - size * 0.12, yy, size * 0.24, h / 14 + 1);
      }
    });
  }, onComplete: () => g.destroy() });
  for (let k = 0; k < 12; k++) { // motes of light drifting down into the ball
    const m = scene.add.circle(x + rnd(-size, size), y - rnd(size, size * 2.2), rnd(1.2, 2.4), k % 2 ? 0x7ff6ff : 0xb98aff, 1).setDepth(AIR).setBlendMode(Phaser.BlendModes.ADD);
    scene.tweens.add({ targets: m, x, y, alpha: 0.2, delay: rnd(0, ms * 0.5), duration: ms * 0.5, ease: 'Sine.easeIn', onComplete: () => m.destroy() });
  }
}

// ------------------------------------------------------------------ shots: the ball in flight
export function animeShot(scene: S, kind: AnimeMove, ball: Img, level: number) {
  switch (kind) {
    case 'godwind': { // a golden fireball with golden lightning coiling around it, feathers drifting off
      const core = scene.add.circle(ball.x, ball.y, 11, GOLD, 0.5).setDepth(AIR).setBlendMode(ADD);
      const n = 3 + Math.min(3, Math.floor(level / 3));
      const bolts = Array.from({ length: n }, (_, i) => scene.add.image(ball.x, ball.y, boltTex(scene)).setDepth(AIR + 1).setBlendMode(ADD).setTint(i % 2 ? GOLD : GOLD2).setScale(0.7));
      let lastF = 0;
      ride(scene, ball, (bx, by, ang, t) => {
        core.setPosition(bx, by).setScale(1 + Math.sin(t * 30) * 0.12);
        bolts.forEach((b, i) => {
          const a = t * 18 + (i / n) * Math.PI * 2, nx = -Math.sin(ang), ny = Math.cos(ang), back = 8 + i * 3;
          b.setPosition(bx - Math.cos(ang) * back + nx * Math.cos(a) * 12, by - Math.sin(ang) * back + ny * Math.cos(a) * 12 - Math.sin(a) * 5)
            .setRotation(ang + Math.cos(a) * 0.8).setAlpha(Math.random() < 0.15 ? 0.3 : 1);
        });
        if (scene.time.now - lastF > 90) {
          lastF = scene.time.now;
          const f = scene.add.image(bx, by, featherTex(scene)).setDepth(AIR).setRotation(rnd(0, 6));
          scene.tweens.add({ targets: f, x: f.x - Math.cos(ang) * 16 + rnd(-10, 10), y: f.y + rnd(4, 16), angle: rnd(-200, 200), alpha: 0, duration: 520, onComplete: () => f.destroy() });
        }
      }, (bx, by) => {
        const b = scene.add.circle(bx, by, 12, GOLD2, 0.8).setDepth(AIR).setBlendMode(ADD);
        scene.tweens.add({ targets: b, scale: 3.6, alpha: 0, duration: 320, onComplete: () => b.destroy() });
        rays(scene, bx, by, 10, GOLD2, 34, 300);
        scene.tweens.add({ targets: [core, ...bolts], alpha: 0, duration: 200, onComplete: () => { core.destroy(); bolts.forEach((x) => x.destroy()); } });
      });
      break;
    }
    case 'tfuego': { // v1.5: two tongues of fire braided around the ball, embers behind, a ring of flames at the end
      const tongues = [0, 1].map((i) => scene.add.image(ball.x, ball.y, streakTex(scene)).setDepth(AIR + 1).setBlendMode(ADD).setTint(i ? FIRE2 : FIRE).setScale(0.8 + level * 0.03, 1));
      const core = scene.add.circle(ball.x, ball.y, 9, FIRE, 0.45).setDepth(AIR).setBlendMode(ADD);
      let lastE = 0;
      ride(scene, ball, (bx, by, ang, t) => {
        const nx = -Math.sin(ang), ny = Math.cos(ang);
        core.setPosition(bx, by).setScale(1 + Math.sin(t * 26) * 0.15);
        tongues.forEach((g, i) => { const a = t * 20 + i * Math.PI, o = Math.sin(a) * 9; g.setPosition(bx - Math.cos(ang) * 10 + nx * o, by - Math.sin(ang) * 10 + ny * o).setRotation(ang + Math.PI / 2 + Math.cos(a) * 0.6); });
        if (scene.time.now - lastE > 45) {
          lastE = scene.time.now;
          const e = scene.add.circle(bx + rnd(-3, 3), by + rnd(-3, 3), rnd(1.5, 3), Math.random() < 0.5 ? FIRE : FIRE2, 1).setDepth(AIR).setBlendMode(ADD);
          scene.tweens.add({ targets: e, x: e.x - Math.cos(ang) * rnd(10, 22), y: e.y - Math.sin(ang) * rnd(10, 22) - rnd(2, 8), alpha: 0, scale: 0.4, duration: 360, onComplete: () => e.destroy() });
        }
      }, (bx, by) => {
        const r = scene.add.ellipse(bx, by + 4, 20, 8).setStrokeStyle(4, FIRE, 1).setDepth(AIR).setBlendMode(ADD);
        scene.tweens.add({ targets: r, scaleX: 3.4, scaleY: 3.4, alpha: 0, duration: 380, onComplete: () => r.destroy() });
        for (let k = 0; k < 10; k++) {
          const f = scene.add.circle(bx, by, rnd(2, 4), k % 2 ? FIRE : FIRE2, 1).setDepth(AIR).setBlendMode(ADD);
          const a = (k / 10) * Math.PI * 2;
          scene.tweens.add({ targets: f, x: bx + Math.cos(a) * rnd(20, 34), y: by + Math.sin(a) * rnd(8, 16) - rnd(4, 12), alpha: 0, duration: 400, onComplete: () => f.destroy() });
        }
        scene.tweens.add({ targets: [core, ...tongues], alpha: 0, duration: 160, onComplete: () => { core.destroy(); tongues.forEach((x) => x.destroy()); } });
      });
      break;
    }
    case 'tth': { // three white crescents keep wrapping the ball; sand rises behind it
      const n = 3;
      const cs = Array.from({ length: n }, () => scene.add.image(ball.x, ball.y, crescentTex(scene)).setDepth(AIR + 1).setBlendMode(ADD).setScale(0.7 + level * 0.02));
      let lastD = 0;
      ride(scene, ball, (bx, by, ang, t) => {
        cs.forEach((c, i) => c.setPosition(bx - Math.cos(ang) * (2 + i * 5), by - Math.sin(ang) * (2 + i * 5)).setRotation(t * 14 + (i / n) * Math.PI * 2).setAlpha(0.95 - i * 0.2));
        if (scene.time.now - lastD > 60) {
          lastD = scene.time.now;
          const d = scene.add.circle(bx + rnd(-4, 4), by + 10, rnd(2.5, 4.5), 0xd8b070, 0.6).setDepth(by + 9);
          scene.tweens.add({ targets: d, y: d.y - rnd(4, 12), scale: 2.2, alpha: 0, duration: 420, onComplete: () => d.destroy() });
        }
      }, (bx, by) => {
        cs.forEach((c, i) => scene.tweens.add({ targets: c, scale: 1.8, alpha: 0, angle: c.angle + 180, delay: i * 30, duration: 260, onComplete: () => c.destroy() }));
        const w = scene.add.circle(bx, by, 10, 0xffffff, 0.5).setDepth(AIR).setBlendMode(ADD);
        scene.tweens.add({ targets: w, scale: 3, alpha: 0, duration: 260, onComplete: () => w.destroy() });
      });
      break;
    }
    case 'fuego': { // tongues of fire whip around the ball, which explodes in flames at the end
      const core = scene.add.circle(ball.x, ball.y, 10, FIRE, 0.55).setDepth(AIR).setBlendMode(ADD);
      const tongues = Array.from({ length: 2 + Math.min(2, Math.floor(level / 4)) }, (_, i) => scene.add.image(ball.x, ball.y, streakTex(scene)).setDepth(AIR + 1).setBlendMode(ADD).setTint(i % 2 ? FIRE2 : FIRE).setScale(0.9, 1.2));
      let lastE = 0;
      ride(scene, ball, (bx, by, ang, t) => {
        core.setPosition(bx, by).setScale(1 + Math.sin(t * 26) * 0.15);
        tongues.forEach((s, i) => {
          const a = t * 12 + i * Math.PI, nx = -Math.sin(ang), ny = Math.cos(ang);
          s.setPosition(bx - Math.cos(ang) * 14 + nx * Math.sin(a) * 9, by - Math.sin(ang) * 14 + ny * Math.sin(a) * 9).setRotation(ang + Math.PI + Math.sin(a) * 0.7);
        });
        if (scene.time.now - lastE > 40) {
          lastE = scene.time.now;
          const e = scene.add.circle(bx, by, rnd(2, 4), Math.random() < 0.5 ? FIRE : FIRE2, 0.9).setDepth(AIR).setBlendMode(ADD);
          scene.tweens.add({ targets: e, x: e.x - Math.cos(ang) * 18 + rnd(-6, 6), y: e.y - Math.sin(ang) * 18 + rnd(-6, 2), scale: 0.2, alpha: 0, duration: 300, onComplete: () => e.destroy() });
        }
      }, (bx, by) => {
        for (const [r, c, d] of [[14, FIRE, 0], [10, FIRE2, 60]] as const) {
          const b = scene.add.circle(bx, by, r, c, 0.75).setDepth(AIR).setBlendMode(ADD);
          scene.tweens.add({ targets: b, scale: 3.2, alpha: 0, delay: d, duration: 340, onComplete: () => b.destroy() });
        }
        scene.tweens.add({ targets: [core, ...tongues], alpha: 0, duration: 160, onComplete: () => { core.destroy(); tongues.forEach((x) => x.destroy()); } });
      });
      break;
    }
    case 'ciclon': { // a golden ball inside a bubble of wind, followed by a huge golden-white crescent of hurricane
      const bubble = scene.add.circle(ball.x, ball.y, 12).setStrokeStyle(2, 0xffffff, 0.8).setDepth(AIR + 1).setBlendMode(ADD);
      const glowC = scene.add.circle(ball.x, ball.y, 10, GOLD, 0.5).setDepth(AIR).setBlendMode(ADD);
      const wave = scene.add.image(ball.x, ball.y, crescentTex(scene)).setDepth(AIR - 1).setBlendMode(ADD).setTint(GOLD2).setScale(1.9 + level * 0.06).setAlpha(0.85);
      const wave2 = scene.add.image(ball.x, ball.y, crescentTex(scene)).setDepth(AIR - 1).setBlendMode(ADD).setScale(1.4 + level * 0.05).setAlpha(0.75);
      ride(scene, ball, (bx, by, ang, t) => {
        bubble.setPosition(bx, by).setScale(1 + Math.sin(t * 20) * 0.08);
        glowC.setPosition(bx, by);
        // the crescent faces forward, its horns trailing behind the ball like the hurricane wave
        wave.setPosition(bx - Math.cos(ang) * 14, by - Math.sin(ang) * 14).setRotation(ang - Math.PI * 0.43 + Math.sin(t * 9) * 0.1);
        wave2.setPosition(bx - Math.cos(ang) * 22, by - Math.sin(ang) * 22).setRotation(ang - Math.PI * 0.43 - Math.sin(t * 9) * 0.1);
      }, (bx, by) => {
        rays(scene, bx, by, 14, GOLD2, 40, 320);
        const b = scene.add.circle(bx, by, 14, GOLD2, 0.7).setDepth(AIR).setBlendMode(ADD);
        scene.tweens.add({ targets: b, scale: 3.4, alpha: 0, duration: 340, onComplete: () => b.destroy() });
        scene.tweens.add({ targets: [bubble, glowC, wave, wave2], alpha: 0, scale: 2, duration: 240, onComplete: () => [bubble, glowC, wave, wave2].forEach((x) => x.destroy()) });
      });
      break;
    }
    default: break;
  }
}
