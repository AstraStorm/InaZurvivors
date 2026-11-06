/**
 * 1.93 (author: altars more eye-catching, juiced): the look of an event altar, apart from its rules (ArenaScene). A rune
 * circle on the ground that turns, a column of light with sparks rising, orbs circling the pillar, a progress ring
 * that fills while the task runs, and an arrival (light dropping from the sky + shockwave) and a stronger glow once
 * accepted. Everything it creates is returned so the altar can destroy it with the rest of its objects.
 */
import Phaser from 'phaser';

const RADIUS = 90;
/** a soft round dot, made once (additive sparks and orbs) */
function dot(scene: Phaser.Scene) {
  if (scene.textures.exists('fx:altdot')) return 'fx:altdot';
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  for (let r = 8; r > 0; r--) { g.fillStyle(0xffffff, 0.12 + (8 - r) * 0.1); g.fillCircle(8, 8, r); }
  g.generateTexture('fx:altdot', 16, 16);
  g.destroy();
  return 'fx:altdot';
}
const lighten = (c: number, k: number) => {
  const r = (c >> 16) & 255, g = (c >> 8) & 255, b = c & 255;
  return (Math.round(r + (255 - r) * k) << 16) | (Math.round(g + (255 - g) * k) << 8) | Math.round(b + (255 - b) * k);
};

export interface AltarFx {
  objs: Phaser.GameObjects.GameObject[];
  /** accepted: faster runes, brighter column */
  activate(): void;
  /** every frame: state and how much of the task is done (0..1) */
  update(state: 'idle' | 'active' | 'done' | 'failed', progress: number, inside: boolean): void;
  destroy(): void;
}

export function altarFx(scene: Phaser.Scene, x: number, y: number, color: number, lite = false): AltarFx {
  const key = dot(scene);
  const light = lighten(color, 0.55);
  const objs: Phaser.GameObjects.GameObject[] = [];
  const add = <T extends Phaser.GameObjects.GameObject>(o: T) => { objs.push(o); return o; };

  // ---- the rune circle on the ground (drawn round, squashed for the view, turning)
  const runes = add(scene.add.container(x, y).setDepth(-9899).setScale(1, 0.72));
  const disc = scene.add.graphics();
  disc.fillStyle(color, 0.1).fillCircle(0, 0, RADIUS);
  disc.lineStyle(3, color, 0.9).strokeCircle(0, 0, RADIUS);
  disc.lineStyle(1.5, light, 0.7).strokeCircle(0, 0, RADIUS - 8);
  disc.lineStyle(2, color, 0.75).strokeCircle(0, 0, RADIUS * 0.55);
  const spin = scene.add.graphics();
  for (let i = 0; i < 24; i++) { // ticks between the outer rings
    const a = (i / 24) * Math.PI * 2, r0 = RADIUS - 7, r1 = RADIUS - (i % 3 ? 2 : -3);
    spin.lineStyle(i % 3 ? 1.5 : 3, light, 0.9).lineBetween(Math.cos(a) * r0, Math.sin(a) * r0, Math.cos(a) * r1, Math.sin(a) * r1);
  }
  const star = scene.add.graphics(); // a six-point star between the inner rings
  const pts = (rot: number) => [0, 1, 2].map((k) => { const a = rot + (k / 3) * Math.PI * 2; return new Phaser.Math.Vector2(Math.cos(a) * RADIUS * 0.55, Math.sin(a) * RADIUS * 0.55); });
  star.lineStyle(2, light, 0.7).strokePoints(pts(-Math.PI / 2), true).strokePoints(pts(Math.PI / 2), true);
  runes.add([disc, spin, star]);
  const spinT = scene.tweens.add({ targets: spin, angle: 360, duration: 9000, repeat: -1 });
  const starT = scene.tweens.add({ targets: star, angle: -360, duration: 14000, repeat: -1 });
  const pulse = scene.tweens.add({ targets: runes, scaleX: 1.04, scaleY: 0.75, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

  // ---- glow under the pillar and the progress ring
  const glow = add(scene.add.image(x, y - 4, key).setDepth(-9898).setTint(color).setScale(6, 3.2).setAlpha(0.3).setBlendMode(Phaser.BlendModes.ADD));
  scene.tweens.add({ targets: glow, alpha: 0.5, scaleX: 7, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  const ring = add(scene.add.graphics().setDepth(-9897));

  // ---- the column of light: three layers, the core brightest
  const col = [
    scene.add.rectangle(x, y, 46, 260, color, 0.12),
    scene.add.rectangle(x, y, 24, 260, color, 0.22),
    scene.add.rectangle(x, y, 8, 260, light, 0.35),
  ].map((r) => add(r.setOrigin(0.5, 1).setDepth(y + 7).setBlendMode(Phaser.BlendModes.ADD)));
  for (const [i, r] of col.entries()) scene.tweens.add({ targets: r, scaleX: 1.3, alpha: r.alpha * 1.6, duration: 700 + i * 160, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  // arrival: the light falls from the sky, then a shockwave
  for (const r of col) { r.scaleY = 0; scene.tweens.add({ targets: r, scaleY: 1, duration: 380, ease: 'Cubic.easeOut' }); }
  const wave = scene.add.ellipse(x, y, 20, 14).setStrokeStyle(4, light, 1).setDepth(-9896);
  scene.tweens.add({ targets: wave, scaleX: RADIUS / 7, scaleY: RADIUS / 7, alpha: 0, duration: 650, delay: 260, ease: 'Cubic.easeOut', onComplete: () => wave.destroy() });
  const flash = scene.add.image(x, y - 30, key).setTint(0xffffff).setScale(2).setAlpha(0).setDepth(y + 9).setBlendMode(Phaser.BlendModes.ADD);
  scene.tweens.add({ targets: flash, alpha: { from: 1, to: 0 }, scale: 12, duration: 500, delay: 300, onComplete: () => flash.destroy() });

  // ---- sparks rising in the column
  const sparks: Phaser.GameObjects.Image[] = [];
  for (let i = 0; i < (lite ? 6 : 12); i++) {
    const s = add(scene.add.image(x, y, key).setTint(i % 2 ? light : color).setScale(0.35 + (i % 3) * 0.15).setDepth(y + 8).setBlendMode(Phaser.BlendModes.ADD));
    const loop = () => {
      s.setPosition(x + Phaser.Math.Between(-18, 18), y - Phaser.Math.Between(0, 20)).setAlpha(0);
      scene.tweens.add({ targets: s, y: y - Phaser.Math.Between(120, 230), x: s.x + Phaser.Math.Between(-10, 10), alpha: { from: 1, to: 0 }, duration: Phaser.Math.Between(1100, 1800), delay: Phaser.Math.Between(0, 900), ease: 'Sine.easeOut', onComplete: () => { if (s.active) loop(); } });
    };
    loop();
    sparks.push(s);
  }

  // ---- orbs circling the pillar (behind and in front of it)
  const orbs = [0, 1, 2].map(() => add(scene.add.image(x, y, key).setTint(light).setScale(0.9).setBlendMode(Phaser.BlendModes.ADD)));
  let t = Math.random() * 10, speed = 1.6, boost = 1;
  const tick = (_time: number, delta: number) => {
    t += (delta / 1000) * speed;
    orbs.forEach((o, i) => {
      const a = t + (i / orbs.length) * Math.PI * 2;
      const ox = x + Math.cos(a) * 34, oy = y - 46 + Math.sin(a) * 12 - Math.sin(t * 2 + i) * 6;
      o.setPosition(ox, oy).setDepth(Math.sin(a) > 0 ? y + 9 : y + 6).setScale((0.7 + Math.sin(a) * 0.25) * boost);
    });
  };
  scene.events.on('update', tick);

  let active = false, lastP = -1, lastIn = false;
  return {
    objs,
    activate() {
      if (active) return;
      active = true; speed = 3.4; boost = 1.3;
      spinT.timeScale = 3; starT.timeScale = 3; pulse.timeScale = 1.8;
      for (const r of col) scene.tweens.add({ targets: r, scaleX: 1.6, duration: 180, yoyo: true });
      const w2 = scene.add.ellipse(x, y, RADIUS * 2, RADIUS * 1.44).setStrokeStyle(5, 0xffffff, 1).setDepth(-9896);
      scene.tweens.add({ targets: w2, scaleX: 1.25, scaleY: 1.25, alpha: 0, duration: 500, onComplete: () => w2.destroy() });
    },
    update(state, progress, inside) {
      const p = state === 'active' ? Math.max(0, Math.min(1, progress)) : 0;
      if (Math.abs(p - lastP) < 0.004 && inside === lastIn) return;
      lastP = p; lastIn = inside;
      ring.clear();
      if (state === 'idle' && inside) ring.lineStyle(3, 0xffffff, 0.9).strokeEllipse(x, y, RADIUS * 2 + 10, RADIUS * 1.44 + 8);
      if (p > 0) {
        // the filled part of an ellipse, from the top clockwise
        const n = Math.max(2, Math.round(64 * p)), path: Phaser.Math.Vector2[] = [];
        for (let i = 0; i <= n; i++) { const a = -Math.PI / 2 + (i / 64) * Math.PI * 2; path.push(new Phaser.Math.Vector2(x + Math.cos(a) * (RADIUS + 6), y + Math.sin(a) * (RADIUS + 6) * 0.72)); }
        ring.lineStyle(7, 0x000000, 0.5).strokePoints(path, false);
        ring.lineStyle(4, p >= 1 ? 0xffffff : light, 1).strokePoints(path, false);
      }
    },
    destroy() {
      scene.events.off('update', tick);
      for (const o of [...sparks, ...objs]) scene.tweens.killTweensOf(o);
      scene.tweens.killTweensOf([disc, spin, star]);
    },
  };
}
