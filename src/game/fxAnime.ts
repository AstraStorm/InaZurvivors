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
 *   La Tierra (The Earth) — Fix 1.53: the aura grows and grows, the Earth appears in it with its red orbit, and it
 *     bursts into comets of light in every direction (more of them each level).
 *   Puño de Furia — Fix 1.53: golden aura with red crests, a golden giant rises behind the keeper and its fist comes
 *     down on the rival: white-gold impact, a shock ring and cracks in the ground.
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

export type AnimeMove = 'brisa' | 'godwind' | 'tth' | 'fuego' | 'ciclon' | 'tfuego' | 'supernova' | 'bigbang' | 'tierra';
export function animeOf(name: string): AnimeMove | null {
  if (/brisa deslizante|easy breezy|soyokaze/i.test(name)) return 'brisa';
  if (/viento celestial|god ?wind/i.test(name)) return 'godwind';
  if (/tormenta,? tornado,? hurac[aá]n|storm.?tornado.?hurricane/i.test(name)) return 'tth';
  if (/tormenta de fuego|bakunetsu storm|fire ?storm/i.test(name)) return 'fuego';
  if (/tornado de fuego|fire ?tornado|fire tornado/i.test(name)) return 'tfuego';
  if (/^supernova$/i.test(name.trim())) return 'supernova';
  if (/^big ?bang$/i.test(name.trim())) return 'bigbang'; // the combined technique (Xavier, Jude, Shawn), not «Corte Big Bang»
  if (/^la tierra$|^the earth$/i.test(name.trim())) return 'tierra'; // Fix 1.53: the solo version (Mark, Nelly, Adam)
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
    case 'tierra': earthCharge(scene, x, y - 30, 12 + level, ms); break; // Fix 1.53: the burst and its comets are the scene's
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
    case 'bigbang': { // Fix 1.51, from the scene: a white-blue vortex, an atom forms (nucleus and three orbits) and swells into a sun
      const cx = x, cy = y - 26;
      const g = scene.add.graphics().setDepth(AIR + 1).setBlendMode(ADD);
      const st = { t: 0 };
      scene.tweens.add({ targets: st, t: 1, duration: ms, ease: 'Sine.easeIn', onUpdate: () => {
        g.clear();
        const k = st.t, grow = 0.6 + k * 1.6, rot = k * 14;
        for (let o = 0; o < 3; o++) { // the three orbits, tilted 60° apart, each with its electron
          const tilt = o * (Math.PI / 3), rx = 22 * grow, ry = 7 * grow;
          g.lineStyle(2, o === 1 ? 0x7fd3ff : 0xffffff, 0.75);
          let px = 0, py = 0;
          for (let i = 0; i <= 24; i++) {
            const a = (i / 24) * Math.PI * 2, ex = Math.cos(a) * rx, ey = Math.sin(a) * ry;
            const qx = cx + ex * Math.cos(tilt) - ey * Math.sin(tilt), qy = cy + ex * Math.sin(tilt) + ey * Math.cos(tilt);
            if (i) g.lineBetween(px, py, qx, qy);
            px = qx; py = qy;
          }
          const a = rot * (1 + o * 0.3) + o * 2, ex = Math.cos(a) * rx, ey = Math.sin(a) * ry;
          g.fillStyle(0x7fd3ff, 1).fillCircle(cx + ex * Math.cos(tilt) - ey * Math.sin(tilt), cy + ex * Math.sin(tilt) + ey * Math.cos(tilt), 3);
        }
        g.fillStyle(0xffd27a, 0.5).fillCircle(cx, cy, 9 * grow); // the nucleus swelling into a sun
        g.fillStyle(0xffffff, 0.95).fillCircle(cx, cy, 5 * grow);
      }, onComplete: () => {
        g.destroy();
        const sun = scene.add.circle(cx, cy, 30, 0xfff2c0, 0.95).setDepth(AIR + 2).setBlendMode(ADD);
        scene.tweens.add({ targets: sun, scale: 2.4, alpha: 0, duration: 260, onComplete: () => sun.destroy() });
        rays(scene, cx, cy, 18, 0xffb04a, 90 + level * 4, 320);
      } });
      for (let k = 0; k < 14; k++) { // the white-blue vortex winding in
        const s = scene.add.image(cx, cy, streakTex(scene)).setDepth(AIR).setBlendMode(ADD).setTint(k % 3 ? 0xffffff : 0x7fd3ff).setAlpha(0).setScale(1.1);
        const t0 = { t: 0 }, a0 = (k / 14) * Math.PI * 2;
        scene.tweens.add({ targets: t0, t: 1, delay: k * 20, duration: ms * 0.85, ease: 'Sine.easeIn',
          onUpdate: () => { const a = a0 + t0.t * 7, r = 90 * (1 - t0.t) + 10; s.setPosition(cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.6).setRotation(a + Math.PI / 2).setAlpha(Math.sin(t0.t * Math.PI)); },
          onComplete: () => s.destroy() });
      }
      break;
    }
    case 'supernova': { // Fix 1.51, from the scene: the kick draws a great X of orange-white energy with a beam down its middle
      const cx = x, cy = y - 18, L = 46 + level * 3;
      const beams = [Math.PI / 4, -Math.PI / 4, Math.PI / 2].map((a, i) => {
        const b = scene.add.rectangle(cx, cy, L * (i === 2 ? 1.6 : 2.2), i === 2 ? 5 : 7, i === 2 ? 0xffffff : 0xffb04a, 0.95).setRotation(a).setDepth(AIR + 1).setBlendMode(ADD).setScale(0, 1);
        const glow = scene.add.rectangle(cx, cy, L * (i === 2 ? 1.6 : 2.2), i === 2 ? 12 : 16, 0xff5a1a, 0.35).setRotation(a).setDepth(AIR).setBlendMode(ADD).setScale(0, 1);
        scene.tweens.add({ targets: [b, glow], scaleX: 1, delay: ms * 0.45 + i * 60, duration: 160, ease: 'Cubic.easeOut' });
        [b, glow].forEach((o) => fade(scene, o, ms * 0.45 + 360, 200));
        return b;
      });
      void beams;
      scene.time.delayedCall(ms * 0.45, () => { const f = scene.add.circle(cx, cy, 10, 0xffffff, 1).setDepth(AIR + 2).setBlendMode(ADD); scene.tweens.add({ targets: f, scale: 3.5, alpha: 0, duration: 300, onComplete: () => f.destroy() }); });
      for (let k = 0; k < 8 + level; k++) { // star dust drawn in before the kick
        const a = rnd(0, Math.PI * 2), d = rnd(30, 60), p = scene.add.circle(cx + Math.cos(a) * d, cy + Math.sin(a) * d * 0.7, rnd(1, 2), k % 3 ? 0xd8c8ff : 0xffffff, 1).setDepth(AIR).setBlendMode(ADD);
        scene.tweens.add({ targets: p, x: cx, y: cy, alpha: 0.2, delay: rnd(0, ms * 0.3), duration: ms * 0.35, ease: 'Sine.easeIn', onComplete: () => p.destroy() });
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

/**
 * Fix 1.51 (author: «las alas esas, horribles»): the divine family (celestial, sagrado, ángel, divino...) no longer opens
 * angel wings. A circle of holy light opens on the ground, beams of light fall around the player, motes rise and a halo
 * crowns him: light that strikes, not decoration.
 */
export function holyLight(scene: S, x: number, y: number, size: number, ms: number) {
  const ring = scene.add.ellipse(x, y + 4, size * 0.6, size * 0.22).setStrokeStyle(3, GOLD2, 0.95).setDepth(y + 1).setBlendMode(ADD);
  const disc = scene.add.ellipse(x, y + 4, size * 0.6, size * 0.22, 0xfff2c0, 0.18).setDepth(y).setBlendMode(ADD);
  scene.tweens.add({ targets: [ring, disc], scaleX: 2.6, scaleY: 2.6, duration: ms * 0.5, ease: 'Cubic.easeOut' });
  [ring, disc].forEach((o) => fade(scene, o, ms * 0.75, 220));
  for (let k = 0; k < 6; k++) { // beams of light falling around him, one after another
    const a = (k / 6) * Math.PI * 2, bx = x + Math.cos(a) * size * 0.8, by = y + 4 + Math.sin(a) * size * 0.3;
    const beam = scene.add.rectangle(bx, by, 6, 70, 0xfff6d0, 0.85).setOrigin(0.5, 1).setDepth(by).setBlendMode(ADD).setScale(1, 0);
    scene.tweens.add({ targets: beam, scaleY: 1, alpha: { from: 0.95, to: 0 }, delay: (k / 6) * ms * 0.6, duration: 260, ease: 'Cubic.easeOut', onComplete: () => beam.destroy() });
    scene.time.delayedCall((k / 6) * ms * 0.6 + 120, () => { const f = scene.add.circle(bx, by, 4, 0xffffff, 0.9).setDepth(by).setBlendMode(ADD); scene.tweens.add({ targets: f, scale: 3, alpha: 0, duration: 260, onComplete: () => f.destroy() }); });
  }
  for (let k = 0; k < 10; k++) { // motes rising
    const m = scene.add.circle(x + rnd(-size * 0.6, size * 0.6), y + rnd(-2, 6), rnd(1.2, 2.2), k % 2 ? GOLD2 : 0xffffff, 1).setDepth(AIR).setBlendMode(ADD);
    scene.tweens.add({ targets: m, y: m.y - rnd(30, 60), alpha: 0, delay: rnd(0, ms * 0.6), duration: rnd(400, 700), onComplete: () => m.destroy() });
  }
  const halo = scene.add.ellipse(x, y - 30, 18, 6).setStrokeStyle(2, GOLD, 1).setDepth(AIR).setBlendMode(ADD).setAlpha(0);
  scene.tweens.add({ targets: halo, alpha: 1, y: y - 34, duration: ms * 0.4, yoyo: true, hold: ms * 0.3, onComplete: () => halo.destroy() });
}

// ------------------------------------------------------------------ v1.5: Ventisca de fuego and Remate caótico
// Both redrawn from their anime scenes, watched frame by frame (author's request, links to the scenes in the changelog).
const ICE = 0x9fe8ff, ICE2 = 0xffffff, SUN = 0xfff6d0;

/** a spiral arm (fire or ice/wind) behind a point, redrawn each frame: thick near the centre, thin at the tail */
function spiralArm(g: Phaser.GameObjects.Graphics, x: number, y: number, ang: number, rot: number, len: number, rMax: number, color: number, alpha: number) {
  const back = ang + Math.PI;
  let px = x, py = y;
  for (let i = 1; i <= 18; i++) {
    const u = i / 18, a = rot + u * Math.PI * 1.7, r = 4 + u * rMax;
    const cx = x + Math.cos(back) * u * len, cy = y + Math.sin(back) * u * len;
    const nx = cx + Math.cos(a) * r, ny = cy + Math.sin(a) * r * 0.75;
    g.lineStyle(Math.max(1, (1 - u) * 7), color, alpha * (1 - u * 0.7)).lineBetween(px, py, nx, ny);
    px = nx; py = ny;
  }
}

/**
 * Ventisca de fuego (Fire Blizzard), from the scene: the two leap towards the sun wrapped in a whirl of white-blue wind
 * (blizzard rings around their legs); the double kick is a burst of golden speed rays inside a big orange ring of fire.
 */
export function fireBlizzardCharge(scene: S, x: number, y: number, size: number, ms: number) {
  const top = y - size * 1.4;
  for (let k = 0; k < 7; k++) { // blizzard rings rising around the jump
    const ring = scene.add.ellipse(x + rnd(-6, 6), y - 4, size * 0.9, size * 0.32).setStrokeStyle(3, k % 2 ? ICE : ICE2, 0.9).setDepth(AIR).setBlendMode(ADD).setAlpha(0);
    scene.tweens.add({ targets: ring, y: top + k * 4, alpha: { from: 0.9, to: 0 }, scaleX: 0.5, scaleY: 0.5, delay: k * (ms * 0.08), duration: ms * 0.55, ease: 'Sine.easeOut', onComplete: () => ring.destroy() });
  }
  for (let k = 0; k < 12; k++) { // white-blue wind streaks spiralling up
    const s = scene.add.image(x, y, streakTex(scene)).setDepth(AIR).setBlendMode(ADD).setTint(k % 3 ? ICE2 : ICE).setAlpha(0).setScale(0.8);
    const st = { t: 0 }, a0 = (k / 12) * Math.PI * 2;
    scene.tweens.add({ targets: st, t: 1, delay: k * 25, duration: ms * 0.75, ease: 'Sine.easeOut',
      onUpdate: () => { const a = a0 + st.t * 8, r = size * (0.55 - st.t * 0.25); s.setPosition(x + Math.cos(a) * r, y - st.t * size * 1.3 + Math.sin(a) * r * 0.35).setRotation(a + Math.PI / 2).setAlpha(Math.sin(st.t * Math.PI)); },
      onComplete: () => s.destroy() });
  }
  scene.time.delayedCall(ms * 0.85, () => { // the double kick: golden speed rays in a ring of fire
    rays(scene, x, top, 16, GOLD2, size * 1.6, 320);
    const fireRing = scene.add.circle(x, top, size * 0.35).setStrokeStyle(6, FIRE, 1).setDepth(AIR + 1).setBlendMode(ADD);
    scene.tweens.add({ targets: fireRing, scale: 3.2, alpha: 0, duration: 380, ease: 'Cubic.easeOut', onComplete: () => fireRing.destroy() });
    const flash = scene.add.circle(x, top, size * 0.3, 0xffffff, 0.9).setDepth(AIR + 2).setBlendMode(ADD);
    scene.tweens.add({ targets: flash, scale: 2, alpha: 0, duration: 220, onComplete: () => flash.destroy() });
  });
}

/**
 * In flight, as in the scene: the ball drills ahead with a great double spiral behind it — an arm of orange fire and an
 * arm of white-blue wind, wound round each other like a galaxy. One arm per ball (the two balls spiral together).
 */
export function fireBlizzardShot(scene: S, ball: Img, level: number, kind: 'fire' | 'ice') {
  const g = scene.add.graphics().setDepth(AIR).setBlendMode(ADD);
  const core = scene.add.circle(ball.x, ball.y, 9, kind === 'fire' ? FIRE2 : ICE2, 0.55).setDepth(AIR + 1).setBlendMode(ADD);
  const col = kind === 'fire' ? FIRE : ICE, col2 = kind === 'fire' ? FIRE2 : ICE2;
  ride(scene, ball, (bx, by, ang, t) => {
    g.clear();
    const rot = t * 14 + (kind === 'ice' ? Math.PI : 0), rMax = 18 + level * 1.2;
    spiralArm(g, bx, by, ang, rot, 46, rMax, col, 0.9);
    spiralArm(g, bx, by, ang, rot + 0.35, 40, rMax * 0.8, col2, 0.6);
    core.setPosition(bx, by).setScale(1 + Math.sin(t * 26) * 0.12);
  }, (bx, by) => {
    g.destroy();
    for (let k = 0; k < 10; k++) {
      const a = (k / 10) * Math.PI * 2;
      const s = kind === 'ice' ? scene.add.rectangle(bx, by, 3, 10, k % 2 ? ICE : ICE2, 1).setRotation(a + Math.PI / 2) : scene.add.circle(bx, by, rnd(2.5, 4), k % 2 ? FIRE : FIRE2, 1);
      s.setDepth(AIR).setBlendMode(ADD);
      scene.tweens.add({ targets: s, x: bx + Math.cos(a) * rnd(18, 32), y: by + Math.sin(a) * rnd(10, 18), alpha: 0, duration: 340, onComplete: () => s.destroy() });
    }
    scene.tweens.add({ targets: core, alpha: 0, scale: 2.4, duration: 220, onComplete: () => core.destroy() });
  });
}

/**
 * Remate caótico (Chaos Break), from the scene: the ball goes up and turns into a white-gold sun (halo and long rays);
 * the three rise to it through streaks of orange flame and kick it together in a fan of golden flares, then a white flash.
 */
export function chaosBreakCharge(scene: S, x: number, y: number, size: number, ms: number) {
  const sy = y - size * 1.6;
  const sun = scene.add.circle(x, sy, size * 0.22, SUN, 0.95).setDepth(AIR + 1).setBlendMode(ADD).setScale(0.3);
  const halo = scene.add.circle(x, sy, size * 0.75).setStrokeStyle(3, SUN, 0.7).setDepth(AIR + 1).setBlendMode(ADD).setScale(0.3).setAlpha(0);
  scene.tweens.add({ targets: sun, scale: 1, duration: ms * 0.4, ease: 'Back.easeOut' });
  scene.tweens.add({ targets: halo, scale: 1, alpha: 0.8, duration: ms * 0.45, ease: 'Cubic.easeOut' });
  rays(scene, x, sy, 12, SUN, size * 1.7, ms * 0.5);
  for (let k = 0; k < 9; k++) { // flame streaks rising towards the sun (the three flying up)
    const s = scene.add.image(x + rnd(-size, size), y + rnd(-4, 8), streakTex(scene)).setDepth(AIR).setBlendMode(ADD).setTint(k % 2 ? FIRE : FIRE2).setRotation(-Math.PI / 2).setScale(0.6, 1.4).setAlpha(0);
    scene.tweens.add({ targets: s, x: x + (s.x - x) * 0.2, y: sy + 10, alpha: { from: 0.9, to: 0 }, delay: ms * 0.25 + k * 25, duration: ms * 0.45, ease: 'Sine.easeIn', onComplete: () => s.destroy() });
  }
  scene.time.delayedCall(ms * 0.8, () => { // the triple kick: a fan of golden flares like wings, then the flash
    for (let k = 0; k < 9; k++) {
      const a = -Math.PI / 2 + (k - 4) * 0.32, f = scene.add.image(x, sy, streakTex(scene)).setDepth(AIR + 2).setBlendMode(ADD).setTint(k % 2 ? GOLD : GOLD2).setRotation(a + Math.PI / 2).setScale(0.6, 1.8).setAlpha(0.95);
      scene.tweens.add({ targets: f, x: x + Math.cos(a) * size * 0.9, y: sy + Math.sin(a) * size * 0.9, scaleY: 2.6, alpha: 0, duration: 340, onComplete: () => f.destroy() });
    }
    const flash = scene.add.circle(x, sy, size * 0.4, 0xffffff, 1).setDepth(AIR + 3).setBlendMode(ADD);
    scene.tweens.add({ targets: flash, scale: 4.5, alpha: 0, duration: 300, onComplete: () => flash.destroy() });
    scene.tweens.add({ targets: [sun, halo], alpha: 0, duration: 200, onComplete: () => { sun.destroy(); halo.destroy(); } });
  });
}

/**
 * In flight, as in the scene: a bright core inside a round whirlpool of blue ice and orange fire turning around the ball
 * (a disc, not a trail), with speed lines; a white-gold burst at the end.
 */
export function chaosBreakShot(scene: S, ball: Img, level: number) {
  const g = scene.add.graphics().setDepth(AIR).setBlendMode(ADD);
  const core = scene.add.circle(ball.x, ball.y, 11, SUN, 0.8).setDepth(AIR + 1).setBlendMode(ADD);
  const R = 22 + level * 1.5;
  let last = 0;
  ride(scene, ball, (bx, by, ang, t) => {
    g.clear();
    for (let arm = 0; arm < 4; arm++) {
      const col = arm % 2 ? 0x5aa8ff : FIRE, rot = t * 12 + arm * (Math.PI / 2);
      let px = bx, py = by;
      for (let i = 1; i <= 14; i++) {
        const u = i / 14, a = rot + u * Math.PI * 1.3, r = 6 + u * R;
        const nx = bx + Math.cos(a) * r, ny = by + Math.sin(a) * r * 0.8;
        g.lineStyle(Math.max(1, (1 - u) * 6 + 1), u < 0.2 ? 0xffffff : col, 0.85 * (1 - u * 0.6)).lineBetween(px, py, nx, ny);
        px = nx; py = ny;
      }
    }
    core.setPosition(bx, by).setScale(1 + Math.sin(t * 30) * 0.1);
    if (scene.time.now - last > 50) { // speed lines past the whirl
      last = scene.time.now;
      const l = scene.add.image(bx - Math.cos(ang) * R, by - Math.sin(ang) * R + rnd(-R * 0.6, R * 0.6), streakTex(scene)).setDepth(AIR - 1).setBlendMode(ADD).setTint(0xdff0ff).setRotation(ang).setScale(0.8, 0.5).setAlpha(0.7);
      scene.tweens.add({ targets: l, x: l.x - Math.cos(ang) * 24, y: l.y - Math.sin(ang) * 24, alpha: 0, duration: 240, onComplete: () => l.destroy() });
    }
  }, (bx, by) => {
    g.destroy();
    const b = scene.add.circle(bx, by, 14, 0xffffff, 0.95).setDepth(AIR).setBlendMode(ADD);
    scene.tweens.add({ targets: b, scale: 4.2, alpha: 0, duration: 360, onComplete: () => b.destroy() });
    [[FIRE, 1], [0x5aa8ff, 1.3]].forEach(([c, s]) => {
      const r = scene.add.circle(bx, by, 10).setStrokeStyle(4, c as number, 1).setDepth(AIR).setBlendMode(ADD);
      scene.tweens.add({ targets: r, scale: 4 * (s as number), alpha: 0, duration: 420, onComplete: () => r.destroy() });
    });
    rays(scene, bx, by, 12, SUN, 40, 300);
    scene.tweens.add({ targets: core, alpha: 0, duration: 120, onComplete: () => core.destroy() });
  });
}

// ------------------------------------------------------------------ La Tierra (The Earth)
/**
 * Fix 1.53 (author, from the scene): a blue-white aura gathers and keeps growing, streaks of light are drawn into it,
 * then the Earth appears inside — a translucent blue globe with glowing continents, a red orbit and a pale disk round it.
 * Returns the centre so the caller can burst it (earthBurst) when the charge ends. `inf`: the rainbow orbit of La Tierra ∞.
 */
export function earthCharge(scene: S, x: number, y: number, size: number, ms: number, inf = false) {
  const g = scene.add.graphics().setDepth(AIR);
  const lands = Array.from({ length: 6 }, (_, i) => ({ a: i * 1.05, lat: Math.sin(i * 2.3) * 0.55, r: 0.2 + (i % 3) * 0.06 }));
  const st = { t: 0 };
  scene.tweens.add({ targets: st, t: 1, duration: ms, ease: 'Linear',
    onUpdate: () => {
      const k = st.t, pulse = 1 + Math.sin(k * 40) * 0.04;
      g.clear();
      // the aura: grows and grows, flickering — a light veil with a bright edge, so the players stay visible
      const aura = size * (0.4 + k * 1.1) * pulse;
      g.fillStyle(0x3a8cff, 0.08 + k * 0.06).fillCircle(0, 0, aura * 1.2);
      g.fillStyle(0x9fdcff, 0.1 + k * 0.08).fillCircle(0, 0, aura);
      g.lineStyle(2 + k * 2, 0xbfe8ff, 0.55 + k * 0.3).strokeCircle(0, 0, aura);
      g.fillStyle(0xffffff, 0.5 + k * 0.3).fillCircle(0, 0, size * (0.18 + k * 0.12));
      // the Earth comes out of the light in the second half
      const e = Math.max(0, (k - 0.4) / 0.6);
      if (e > 0) {
        const r = size * (0.3 + e * 0.75), spin = k * 5;
        g.fillStyle(0xdff6ff, 0.18 * e).fillEllipse(0, 0, r * 4.2, r * 1.1); // the pale disk
        g.fillStyle(0xffffff, 0.3 * e).fillCircle(0, 0, r * 1.18); // its glow
        g.fillStyle(0x1e62e0, e).fillCircle(0, 0, r);
        for (const b of lands) {
          const lon = (b.a + spin) % (Math.PI * 2), vis = Math.cos(lon);
          if (vis < -0.1) continue;
          g.fillStyle(0x4fd86a, e).fillEllipse(Math.sin(lon) * r * 0.78, b.lat * r, r * b.r * 2 * Math.max(0.2, vis), r * b.r * 1.5);
        }
        g.fillStyle(0xffffff, 0.4 * e).fillCircle(-r * 0.35, -r * 0.38, r * 0.28); // the shine
        g.lineStyle(2, 0xdff6ff, e).strokeCircle(0, 0, r);
        if (inf) [0xff4a4a, 0xffb020, 0xffe24a, 0x5ee05a, 0x4fb3ff, 0xb36bff].forEach((c, i) => g.lineStyle(2, c, 0.9 * e).strokeEllipse(0, 0, r * (2.7 + i * 0.12), r * (0.7 + i * 0.05)));
        else g.lineStyle(2, 0xff4a4a, 0.85 * e).strokeEllipse(0, 0, r * 2.7, r * 0.75); // the red orbit
      }
      g.setPosition(x, y);
    },
    onComplete: () => g.destroy() });
  // streaks of light pulled into the aura, more and more of them
  const n = 12 + Math.round(size / 3);
  for (let k = 0; k < n; k++) {
    const a = rnd(0, Math.PI * 2), d = size * rnd(2.2, 3.4);
    const s = scene.add.rectangle(x + Math.cos(a) * d, y + Math.sin(a) * d * 0.8, 14, 2, k % 3 ? 0xffffff : 0x9fdcff, 0).setDepth(AIR + 1).setRotation(a);
    scene.tweens.add({ targets: s, x, y, alpha: { from: 0.95, to: 0.2 }, scaleX: 2, delay: (k / n) * ms * 0.8, duration: ms * 0.3, ease: 'Quad.easeIn', onComplete: () => s.destroy() });
  }
  return { x, y };
}

/** a comet of light: white head, blue glow (drawn once per scene) */
export const cometTex = (scene: S) => tex(scene, 'comet', 24, 24, (g) => {
  g.fillStyle(0x3a8cff, 0.35).fillCircle(12, 12, 12); g.fillStyle(0x9fdcff, 0.7).fillCircle(12, 12, 8); g.fillStyle(0xffffff, 1).fillCircle(12, 12, 5);
});

/** The Earth bursts: a white flash, a ring that runs out and shards of light in every direction. */
export function earthBurst(scene: S, x: number, y: number, size: number) {
  const flash = scene.add.circle(x, y, size * 1.4, 0xffffff, 0.95).setDepth(AIR + 2);
  scene.tweens.add({ targets: flash, scale: 2.2, alpha: 0, duration: 380, ease: 'Cubic.easeOut', onComplete: () => flash.destroy() });
  const ring = scene.add.circle(x, y, size, 0x9fdcff, 0).setStrokeStyle(4, 0x9fdcff, 1).setDepth(AIR + 1);
  scene.tweens.add({ targets: ring, scale: 5, alpha: 0, duration: 520, ease: 'Cubic.easeOut', onComplete: () => ring.destroy() });
  for (let k = 0; k < 14; k++) {
    const a = (k / 14) * Math.PI * 2, s = scene.add.rectangle(x, y, 18, 3, k % 2 ? 0xffffff : 0x7dff9a, 1).setDepth(AIR + 1).setRotation(a);
    scene.tweens.add({ targets: s, x: x + Math.cos(a) * size * 3, y: y + Math.sin(a) * size * 3, alpha: 0, duration: 420, ease: 'Cubic.easeOut', onComplete: () => s.destroy() });
  }
}

// ------------------------------------------------------------------ Puño de Furia (a keeper's catch)
/** the golden giant of Puño de Furia: gold body, red crests of fire on the head, one fist drawn back */
const furyGiantTex = (scene: S) => tex(scene, 'furygiant', 100, 96, (g) => {
  const body = (c: number, s: number) => {
    g.fillStyle(c, 1);
    g.fillEllipse(50, 66, 66 * s, 48 * s); // chest
    g.fillEllipse(50, 34, 28 * s, 28 * s); // head
    g.fillEllipse(17, 52, 22 * s, 36 * s); g.fillEllipse(83, 50, 24 * s, 30 * s); // shoulders
    g.fillEllipse(10, 34, 18 * s, 22 * s); // the drawn-back fist
  };
  g.fillStyle(0xe0281a, 1); // crests of red flame, sweeping back like his hair in the scene
  for (let k = 0; k < 6; k++) g.fillTriangle(30 + k * 7, 30, 40 + k * 7, 28, 22 + k * 9, 2 + (k % 2) * 6);
  body(0xff9a10, 1); body(0xffd23f, 0.78); body(0xfff2a0, 0.42);
  g.fillStyle(0x7a3a00, 1); g.fillRect(43, 32, 4, 3); g.fillRect(53, 32, 4, 3);
});
/** a huge golden fist, knuckles forward, white-hot in the middle */
const furyFistTex = (scene: S) => tex(scene, 'furyfist', 48, 48, (g) => {
  g.fillStyle(0xff9a10, 1).fillRoundedRect(4, 8, 40, 34, 12);
  g.fillStyle(0xffd23f, 1).fillRoundedRect(8, 11, 32, 27, 10);
  for (let k = 0; k < 4; k++) g.fillStyle(0xfff2a0, 1).fillCircle(12 + k * 8, 14, 4); // knuckles
  g.fillStyle(0xffffff, 0.8).fillCircle(22, 24, 6);
  g.fillStyle(0xff9a10, 1).fillRoundedRect(30, 26, 14, 10, 4); // thumb
});

/**
 * Fix 1.53 (author, from the scene): a golden aura bursts round the keeper with red crests of flame, he leaps, a giant
 * of golden energy rises behind him and drives its fist down onto the ball: white-gold impact, shock ring and cracks.
 * Visual only; `onImpact` fires when the fist lands (the scene does the damage there).
 */
export function furyFist(scene: S, x: number, y: number, tx: number, ty: number, level: number, ms: number, onImpact: () => void) {
  const rise = ms * 0.45, punch = ms - rise, k = 1 + level * 0.04;
  // the aura and its crests
  const aura = scene.add.ellipse(x, y - 8, 30, 44, GOLD, 0.45).setDepth(y - 2).setBlendMode(ADD);
  scene.tweens.add({ targets: aura, scaleX: 1.8, scaleY: 2.2, alpha: 0.15, duration: ms, onComplete: () => aura.destroy() });
  for (let c = 0; c < 5; c++) {
    const cr = scene.add.triangle(x - 8 + c * 4, y - 22, 0, 12, 6, 12, 3 - c, -14 - (c % 2) * 6, 0xe0281a, 0.95).setDepth(y - 1).setAlpha(0);
    scene.tweens.add({ targets: cr, alpha: 1, y: cr.y - 6, scaleY: 1.3, delay: c * 30, duration: rise * 0.7, ease: 'Back.easeOut', onComplete: () => fade(scene, cr, punch * 0.5) });
  }
  rays(scene, x, y - 12, 8 + level, GOLD2, 34 + level * 2, rise);
  // the giant behind him, rising
  const giant = scene.add.image(x, y + 6, furyGiantTex(scene)).setOrigin(0.5, 1).setDepth(y - 3).setAlpha(0).setScale(0.35 * k);
  scene.tweens.add({ targets: giant, alpha: 0.82, scale: 0.72 * k, y: y - 2, duration: rise, ease: 'Back.easeOut' });
  fade(scene, giant, ms + 120, 280);
  // the fist: starts drawn back over the giant's shoulder, grows as it drives down onto the target
  const fist = scene.add.image(x - 26 * k, y - 50 * k, furyFistTex(scene)).setDepth(AIR + 1).setAlpha(0).setScale(0.7 * k);
  scene.tweens.add({ targets: fist, alpha: 1, duration: rise * 0.6 });
  scene.time.delayedCall(rise, () => {
    if (!fist.active) return;
    fist.setRotation(Math.atan2(ty - fist.y, tx - fist.x));
    scene.tweens.add({ targets: fist, x: tx, y: ty, scale: 1.4 * k, duration: punch, ease: 'Cubic.easeIn',
      onUpdate: () => { const t = scene.add.circle(fist.x, fist.y, 10 * k, GOLD, 0.45).setDepth(AIR); fade(scene, t, 0, 160); },
      onComplete: () => {
        onImpact();
        const flash = scene.add.circle(tx, ty, 26 * k, 0xffffff, 0.95).setDepth(AIR + 2);
        scene.tweens.add({ targets: flash, scale: 2.4, alpha: 0, duration: 300, onComplete: () => flash.destroy() });
        const ring = scene.add.circle(tx, ty + 6, 20, GOLD, 0).setStrokeStyle(4, GOLD2, 1).setDepth(ty + 6);
        scene.tweens.add({ targets: ring, scaleX: 4 * k, scaleY: 2.4 * k, alpha: 0, duration: 460, ease: 'Cubic.easeOut', onComplete: () => ring.destroy() });
        for (let c = 0; c < 6 + level; c++) { // cracks and gold sparks
          const a = (c / (6 + level)) * Math.PI * 2, crack = scene.add.rectangle(tx, ty + 8, 4, 2, 0x5a3a10, 0.9).setOrigin(0, 0.5).setRotation(a).setDepth(ty + 5);
          scene.tweens.add({ targets: crack, displayWidth: rnd(18, 34) * k, duration: 160, onComplete: () => fade(scene, crack, 500, 300) });
          const sp = scene.add.circle(tx, ty, rnd(2, 3.5), c % 2 ? GOLD : 0xffffff, 1).setDepth(AIR + 1);
          scene.tweens.add({ targets: sp, x: tx + Math.cos(a) * rnd(30, 60) * k, y: ty + Math.sin(a) * rnd(20, 40) * k, alpha: 0, duration: 420, ease: 'Cubic.easeOut', onComplete: () => sp.destroy() });
        }
        fade(scene, fist, 60, 200);
      } });
  });
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
    case 'bigbang': { // Fix 1.51: an immense ball of light with a huge trail of fire, and an explosion that fills the screen
      const sun = scene.add.circle(ball.x, ball.y, 20 + level, 0xfff2c0, 0.9).setDepth(AIR + 1).setBlendMode(ADD);
      const rim = scene.add.circle(ball.x, ball.y, 26 + level).setStrokeStyle(4, 0x7fd3ff, 0.8).setDepth(AIR + 1).setBlendMode(ADD);
      let last = 0;
      ride(scene, ball, (bx, by, ang, t) => {
        sun.setPosition(bx, by).setScale(1 + Math.sin(t * 22) * 0.08);
        rim.setPosition(bx, by).setScale(1 + Math.sin(t * 15) * 0.12);
        if (scene.time.now - last > 30) {
          last = scene.time.now;
          for (let k = 0; k < 3; k++) {
            const f = scene.add.circle(bx - Math.cos(ang) * (16 + k * 6) + rnd(-10, 10), by - Math.sin(ang) * (16 + k * 6) + rnd(-10, 10), rnd(6, 13), [0xff5a1a, 0xff9a2a, 0xffd04a][k], 0.85).setDepth(AIR).setBlendMode(ADD);
            scene.tweens.add({ targets: f, x: f.x - Math.cos(ang) * rnd(30, 60), y: f.y - Math.sin(ang) * rnd(30, 60), scale: 0.3, alpha: 0, duration: rnd(380, 560), onComplete: () => f.destroy() });
          }
        }
      }, (bx, by) => {
        scene.tweens.add({ targets: [sun, rim], alpha: 0, duration: 100, onComplete: () => { sun.destroy(); rim.destroy(); } });
        scene.cameras.main.shake(420, 0.012);
        const flash = scene.add.circle(bx, by, 40, 0xffffff, 1).setDepth(AIR + 3).setBlendMode(ADD);
        scene.tweens.add({ targets: flash, scale: 6, alpha: 0, duration: 420, onComplete: () => flash.destroy() });
        [[0xffd04a, 0], [0xff5a1a, 80], [0x7fd3ff, 160]].forEach(([c, d]) => {
          const r = scene.add.circle(bx, by, 16).setStrokeStyle(7, c, 1).setDepth(AIR + 2).setBlendMode(ADD);
          scene.tweens.add({ targets: r, scale: 10, alpha: 0, delay: d, duration: 620, ease: 'Cubic.easeOut', onComplete: () => r.destroy() });
        });
        for (let k = 0; k < 34; k++) {
          const a = (k / 34) * Math.PI * 2 + rnd(-0.1, 0.1), d = rnd(60, 150);
          const f = scene.add.circle(bx, by, rnd(5, 11), k % 3 === 0 ? 0xffd04a : k % 3 === 1 ? 0xff5a1a : 0xffffff, 0.95).setDepth(AIR + 1).setBlendMode(ADD);
          scene.tweens.add({ targets: f, x: bx + Math.cos(a) * d, y: by + Math.sin(a) * d * 0.7, scale: 0.2, alpha: 0, duration: rnd(500, 800), ease: 'Cubic.easeOut', onComplete: () => f.destroy() });
        }
        rays(scene, bx, by, 20, 0xfff2c0, 170, 480);
        const scorch = scene.add.ellipse(bx, by + 8, 120, 46, 0x1a0a00, 0.45).setDepth(by - 1);
        scene.tweens.add({ targets: scorch, alpha: 0, delay: 900, duration: 800, onComplete: () => scorch.destroy() });
      });
      break;
    }
    case 'supernova': { // Fix 1.51: a sphere of dark matter in a violet whirl, with a red energy eye at its heart
      const g = scene.add.graphics().setDepth(AIR + 1);
      const glow = scene.add.graphics().setDepth(AIR + 2).setBlendMode(ADD);
      const R = 11 + level * 0.5;
      let last = 0;
      ride(scene, ball, (bx, by, ang, t) => {
        g.clear(); glow.clear();
        g.fillStyle(0x07020f, 0.95).fillCircle(bx, by, R);
        for (let arm = 0; arm < 3; arm++) { // the violet whirl around the dark sphere
          const rot = t * 9 + arm * (Math.PI * 2 / 3);
          let px = bx + Math.cos(rot) * R, py = by + Math.sin(rot) * R;
          for (let i = 1; i <= 10; i++) {
            const u = i / 10, a = rot + u * Math.PI * 1.1, r = R + u * R * 0.9;
            const nx = bx + Math.cos(a) * r, ny = by + Math.sin(a) * r * 0.85;
            glow.lineStyle(Math.max(1, (1 - u) * 5), u < 0.3 ? 0xd8a8ff : 0x8a3aff, 0.9 * (1 - u * 0.7)).lineBetween(px, py, nx, ny);
            px = nx; py = ny;
          }
        }
        // the eye: a red-orange glow with a bright slit, pulsing
        const pulse = 1 + Math.sin(t * 18) * 0.15;
        glow.fillStyle(0xff3a1a, 0.55).fillCircle(bx, by, R * 0.55 * pulse);
        glow.fillStyle(0xffb04a, 0.95).fillEllipse(bx, by, R * 0.35 * pulse, R * 0.9 * pulse);
        glow.fillStyle(0xffffff, 0.9).fillEllipse(bx, by, R * 0.12, R * 0.55);
        if (scene.time.now - last > 50) {
          last = scene.time.now;
          const d = scene.add.circle(bx - Math.cos(ang) * R, by - Math.sin(ang) * R, rnd(2, 4), Math.random() < 0.5 ? 0x8a3aff : 0x2a0a50, 0.8).setDepth(AIR).setBlendMode(ADD);
          scene.tweens.add({ targets: d, x: d.x - Math.cos(ang) * 14, y: d.y - Math.sin(ang) * 14, scale: 0.3, alpha: 0, duration: 360, onComplete: () => d.destroy() });
        }
      }, (bx, by) => {
        g.destroy(); glow.destroy();
        const ring = scene.add.circle(bx, by, 34).setStrokeStyle(4, 0x8a3aff, 1).setDepth(AIR).setBlendMode(ADD);
        scene.tweens.add({ targets: ring, scale: 0.15, duration: 130, ease: 'Quad.easeIn', onComplete: () => {
          ring.destroy();
          const b = scene.add.circle(bx, by, 12, 0xffd8a0, 0.95).setDepth(AIR).setBlendMode(ADD);
          scene.tweens.add({ targets: b, scale: 3.6, alpha: 0, duration: 340, onComplete: () => b.destroy() });
          const r2 = scene.add.circle(bx, by, 10).setStrokeStyle(4, 0xb98aff, 1).setDepth(AIR).setBlendMode(ADD);
          scene.tweens.add({ targets: r2, scale: 4.5, alpha: 0, duration: 420, onComplete: () => r2.destroy() });
        } });
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
