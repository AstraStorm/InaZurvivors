/**
 * Fix 1.3: the look of some signature techniques, after their official descriptions (zukan.inazuma.jp). Visual only:
 * damage, reach and behaviour stay those of their type in ArenaScene.
 *   - Espejismo de balón (Illusory Ball): a dribble that leaves afterimages of the ball, which trick the rivals.
 *   - Ceniza negra (Black Ash): a shot of pure darkness; the black fog in its wake swallows the pitch.
 *   - El ojo del huracán (Storm Zone): a storm rises around the dribbler, who walks through its calm eye.
 */
import Phaser from 'phaser';

type Sig = 'espejismo' | 'ceniza' | 'huracan';
export function signatureOf(name: string): Sig | null {
  if (/espejismo de bal[oó]n|illusion ball|illusory ball/i.test(name)) return 'espejismo';
  if (/ceniza negra|black ash/i.test(name)) return 'ceniza';
  if (/ojo del hurac[aá]n|storm zone|eye of the storm/i.test(name)) return 'huracan';
  return null;
}

const ADD = Phaser.BlendModes.ADD;

/** Espejismo de balón: copies of the ball circle the footballer, split apart and vanish (the real one stays with him). */
export function illusionBall(scene: Phaser.Scene, x: number, y: number, level: number, ms = 620) {
  const n = 3 + Math.min(3, Math.floor(level / 3));
  const start = Math.random() * Math.PI * 2;
  for (let k = 0; k < n; k++) {
    const a0 = start + (k / n) * Math.PI * 2;
    const ball = scene.add.image(x, y, 'fx:ball').setDepth(y + 3).setAlpha(0.9);
    const ghosts = [0.5, 0.3, 0.15].map((al) => scene.add.image(x, y, 'fx:ball').setDepth(y + 2).setAlpha(al).setTint(0xbfe8ff));
    const trail: [number, number][] = [];
    const st = { t: 0 };
    scene.tweens.add({
      targets: st, t: 1, duration: ms, ease: 'Sine.easeInOut',
      onUpdate: () => {
        // circle at a growing radius, then fly out: the afterimages trail behind each copy
        const r = 10 + st.t * (26 + level * 2), a = a0 + st.t * Math.PI * 2.4;
        const bx = x + Math.cos(a) * r, by = y - 8 + Math.sin(a) * r * 0.55;
        ball.setPosition(bx, by).setAngle(st.t * 900).setAlpha(st.t < 0.75 ? 0.9 : 0.9 * (1 - (st.t - 0.75) / 0.25));
        trail.unshift([bx, by]);
        ghosts.forEach((g, i) => { const p = trail[(i + 1) * 3] ?? trail[trail.length - 1]; g.setPosition(p[0], p[1]).setAlpha(g.alpha * 0.98); });
      },
      onComplete: () => { ball.destroy(); ghosts.forEach((g) => g.destroy()); },
    });
  }
  // a shimmer at the feet: the rivals see several balls at once
  const ring = scene.add.ellipse(x, y + 2, 20, 8, 0xbfe8ff, 0.35).setDepth(y - 1).setBlendMode(ADD);
  scene.tweens.add({ targets: ring, scaleX: 3, scaleY: 3, alpha: 0, duration: ms, onComplete: () => ring.destroy() });
}

/** Ceniza negra, the charge: black smoke spirals up around the shooter and the light dims around him. */
export function blackAshCharge(scene: Phaser.Scene, x: number, y: number, level: number, ms: number) {
  const dim = scene.add.ellipse(x, y + 2, 70 + level * 4, 26 + level, 0x000000, 0.0).setDepth(y - 2);
  scene.tweens.add({ targets: dim, fillAlpha: 0.45, duration: ms * 0.7, yoyo: true, hold: ms * 0.3, onComplete: () => dim.destroy() });
  const n = 10 + level;
  for (let k = 0; k < n; k++) {
    const a = (k / n) * Math.PI * 2, delay = (k / n) * ms * 0.6;
    const puff = scene.add.circle(x + Math.cos(a) * 18, y + Math.sin(a) * 7, 4, 0x140a1c, 0.8).setDepth(y + 1);
    scene.tweens.add({ targets: puff, x: x + Math.cos(a + 2) * 6, y: y - 26 - level, scale: 2.4, alpha: 0, delay, duration: ms * 0.6, ease: 'Sine.easeIn', onComplete: () => puff.destroy() });
  }
}

/**
 * Ceniza negra, the flight: the ball turns black and drags a fog that spreads and lingers, with violet embers; where it
 * ends, the fog swallows a patch of the pitch for a moment.
 */
export function blackAshTrail(scene: Phaser.Scene, ball: Phaser.GameObjects.Image, level: number) {
  ball.setTint(0x3a2448);
  let lastX = ball.x, lastY = ball.y;
  const ev = scene.time.addEvent({
    delay: 40, loop: true,
    callback: () => {
      if (!ball.active) {
        ev.remove();
        const fog = scene.add.ellipse(lastX, lastY + 8, 30, 12, 0x07030c, 0.75).setDepth(lastY - 1);
        scene.tweens.add({ targets: fog, scaleX: 3 + level * 0.15, scaleY: 3 + level * 0.15, alpha: 0, duration: 1400, ease: 'Sine.easeOut', onComplete: () => fog.destroy() });
        return;
      }
      lastX = ball.x; lastY = ball.y;
      const puff = scene.add.circle(ball.x + Phaser.Math.Between(-3, 3), ball.y + Phaser.Math.Between(-3, 3), 4 + level * 0.3, 0x0b0612, 0.75).setDepth(ball.depth - 1);
      scene.tweens.add({ targets: puff, scale: 2.6 + level * 0.12, alpha: 0, duration: 1000, ease: 'Sine.easeOut', onComplete: () => puff.destroy() });
      if (Math.random() < 0.55) {
        const ember = scene.add.image(ball.x, ball.y, 'fx:spark').setTint(0xa24bff).setBlendMode(ADD).setDepth(ball.depth + 1);
        scene.tweens.add({ targets: ember, x: ember.x + Phaser.Math.Between(-10, 10), y: ember.y - Phaser.Math.Between(6, 16), alpha: 0, duration: 500, onComplete: () => ember.destroy() });
      }
    },
  });
}

/**
 * El ojo del huracán: a funnel of wind turns around the footballer (streaks drawn every frame at three heights), leaves
 * and dust fly up its walls and the centre, the eye, stays calm and bright.
 */
export function stormZone(scene: Phaser.Scene, x: number, y: number, radius: number, level: number, ms = 700, color = 0x9cffb0) {
  const g = scene.add.graphics().setDepth(y + 4).setBlendMode(ADD);
  const eye = scene.add.ellipse(x, y - 4, radius * 0.5, radius * 0.22, 0xffffff, 0.25).setDepth(y - 1).setBlendMode(ADD);
  const st = { t: 0 };
  scene.tweens.add({
    targets: st, t: 1, duration: ms,
    onUpdate: () => {
      g.clear();
      const fade = st.t < 0.15 ? st.t / 0.15 : st.t > 0.75 ? (1 - st.t) / 0.25 : 1;
      for (let layer = 0; layer < 3; layer++) {
        const h = layer * 12, rr = radius * (0.75 + layer * 0.18);
        for (let k = 0; k < 4; k++) {
          const a0 = st.t * Math.PI * 6 + layer * 0.8 + (k / 4) * Math.PI * 2;
          g.lineStyle(2 + (layer === 0 ? 1 : 0), layer === 1 ? 0xffffff : color, 0.55 * fade);
          g.beginPath();
          for (let s = 0; s <= 8; s++) {
            const a = a0 + s * 0.12;
            const px = x + Math.cos(a) * rr, py = y - 6 - h + Math.sin(a) * rr * 0.32;
            if (s === 0) g.moveTo(px, py); else g.lineTo(px, py);
          }
          g.strokePath();
        }
      }
    },
    onComplete: () => { g.destroy(); eye.destroy(); },
  });
  scene.tweens.add({ targets: eye, alpha: 0.5, duration: ms / 2, yoyo: true });
  const n = 8 + level * 2;
  for (let k = 0; k < n; k++) {
    const a = (k / n) * Math.PI * 2;
    const leaf = scene.add.image(x + Math.cos(a) * radius * 0.8, y + Math.sin(a) * radius * 0.25, k % 3 ? 'fx:leaf' : 'fx:rock').setDepth(y + 5).setTint(k % 2 ? color : 0xffffff);
    const st2 = { t: 0 };
    scene.tweens.add({
      targets: st2, t: 1, duration: ms, delay: (k / n) * 120, ease: 'Sine.easeIn',
      onUpdate: () => {
        const aa = a + st2.t * Math.PI * 3, rr = radius * (0.8 + st2.t * 0.35);
        leaf.setPosition(x + Math.cos(aa) * rr, y - st2.t * (40 + level * 3) + Math.sin(aa) * rr * 0.3).setAngle(st2.t * 720).setAlpha(1 - st2.t);
      },
      onComplete: () => leaf.destroy(),
    });
  }
}
