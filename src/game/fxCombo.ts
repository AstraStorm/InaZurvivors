/**
 * 1.93 (author: when a lot of damage lands at once, on screen, juiced): the burst meter. Hits never stop in a run, so it
 * does not count streaks: it watches the damage per second against the run's own usual pace and shows up only when a
 * burst far above it lands (a combined technique, an evolution, a crowd caught in an area). While the burst lasts it
 * counts hits and adds up the damage, big at the top of the screen, and climbs through ranks by how many times the usual
 * damage it made (¡COMBO! · ¡GENIAL! · ¡BRUTAL! · ¡IMPARABLE! · ¡INAZUMA!) with a punch, a flash and sparks on each.
 * When it calms down it shows the total and flies away. Fixed to the camera, whatever its zoom.
 *
 * 2.0 (author: «más juiced en lo de combos, una mini funcionalidad pero no muy rota»): each rank past ¡COMBO! charges
 * the active warrior spirit's ultimate a little (onRank, ArenaScene: 4 % per rank step, at most 40 % in one burst) and
 * says so under the meter; every rank also throws a shock ring and shakes the count.
 */
import { locale, tr } from '../i18n/i18n';
import Phaser from 'phaser';
import type { Settings } from '../systems/save';
import { sfx } from './sfx';

const WINDOW_MS = 800; // the damage of the last 0.8 s is the current pace
const START = 4; // a burst starts at 4 times the usual pace...
const KEEP = 1.6; // ...and lasts while it stays above 1.6 times it
const CALM_MS = 600; // below that for 0.6 s: it is over
const FLOOR = 120; // damage per second that never counts as a burst
const WARMUP_MS = 6000; // the first seconds of hits only learn the pace
/** ranks by how many seconds of the usual damage the burst made */
const RANKS: { at: number; label: string; color: string; glow: number }[] = [
  { at: 0, label: tr('¡COMBO!'), color: '#ffffff', glow: 0x7fd3ff },
  { at: 6, label: tr('¡GENIAL!'), color: '#7dff9a', glow: 0x3fd07a },
  { at: 12, label: tr('¡BRUTAL!'), color: '#ffe24a', glow: 0xffb020 },
  { at: 22, label: tr('¡IMPARABLE!'), color: '#ff8a3a', glow: 0xff5a1f },
  { at: 40, label: tr('¡INAZUMA!'), color: '#ff5ad8', glow: 0xb36bff },
];
const fmt = (n: number) => Math.round(n).toLocaleString(locale());

export class ComboMeter {
  private hits = 0;
  private total = 0;
  private rank = -1;
  /** recent hits (time, damage) for the current pace; the usual pace (damage per second, slow average) */
  private recent: [number, number][] = [];
  private base = 0;
  private lastTick = 0;
  private calmSince = 0;
  private firstHit = 0;
  private shown = false;
  private box: Phaser.GameObjects.Container;
  private count: Phaser.GameObjects.Text;
  private dmg: Phaser.GameObjects.Text;
  private word: Phaser.GameObjects.Text;
  private bar: Phaser.GameObjects.Rectangle;
  private halo: Phaser.GameObjects.Ellipse;
  private shownDmg = 0;
  private gift: Phaser.GameObjects.Text;
  private ring: Phaser.GameObjects.Ellipse;
  /** 2.0: a rank past ¡COMBO! was reached; returns what it gave (shown under the meter), or null */
  onRank: ((rank: number) => { text: string; color: string } | null) | null = null;

  constructor(private scene: Phaser.Scene, private settings: () => Settings) {
    const font = { fontFamily: '"Press Start 2P"', stroke: '#000000', align: 'center' };
    this.halo = scene.add.ellipse(0, 0, 360, 120, 0x7fd3ff, 0.18).setBlendMode(Phaser.BlendModes.ADD);
    this.count = scene.add.text(0, -26, '', { ...font, fontSize: '15px', color: '#ffffff', strokeThickness: 5 }).setOrigin(0.5);
    this.dmg = scene.add.text(0, 6, '', { ...font, fontSize: '26px', color: '#ffe24a', strokeThickness: 7 }).setOrigin(0.5);
    this.word = scene.add.text(0, 40, '', { ...font, fontSize: '13px', color: '#ffffff', strokeThickness: 5 }).setOrigin(0.5);
    this.bar = scene.add.rectangle(0, 58, 180, 5, 0xffffff, 0.9);
    this.gift = scene.add.text(0, 80, '', { ...font, fontSize: '11px', color: '#ffffff', strokeThickness: 5 }).setOrigin(0.5).setAlpha(0);
    this.ring = scene.add.ellipse(0, 6, 120, 60).setStrokeStyle(4, 0xffffff, 1).setAlpha(0);
    this.box = scene.add.container(0, 0, [this.halo, this.ring, this.count, this.dmg, this.word, this.bar, this.gift]).setScrollFactor(0).setDepth(99990).setAlpha(0).setVisible(false);
    scene.events.on('update', this.tick, this);
    scene.events.once('shutdown', () => scene.events.off('update', this.tick, this));
  }

  /** a hit of `value` damage (crit or not) */
  add(value: number, crit: boolean) {
    if (!this.firstHit) this.firstHit = this.scene.time.now;
    this.recent.push([this.scene.time.now, value]);
    if (!this.shown) return;
    this.hits++;
    this.total += value;
    this.count.setText(`x${this.hits} GOLPES`);
    this.scene.tweens.killTweensOf(this.count);
    this.count.setScale(crit ? 1.35 : 1.18);
    this.scene.tweens.add({ targets: this.count, scale: 1, duration: 140, ease: 'Back.easeOut' });
    const r = RANKS.reduce((k, x, i) => (this.total / Math.max(this.base, FLOOR) >= x.at ? i : k), 0);
    if (r > this.rank) this.rankUp(r);
  }

  private open() {
    this.shown = true;
    this.scene.tweens.killTweensOf(this.box);
    this.box.setVisible(true).setAlpha(0);
    this.place(0.6);
    this.scene.tweens.add({ targets: this.box, alpha: 1, duration: 140 });
  }

  private rankUp(r: number) {
    const def = RANKS[r];
    this.rank = r;
    this.word.setText(def.label).setColor(def.color);
    this.halo.setFillStyle(def.glow, 0.22);
    this.bar.setFillStyle(def.glow, 1);
    this.scene.tweens.killTweensOf([this.word, this.halo]);
    this.word.setScale(2.2).setAngle(-8);
    this.scene.tweens.add({ targets: this.word, scale: 1, angle: 0, duration: 320, ease: 'Back.easeOut' });
    this.halo.setScale(0.4).setAlpha(1);
    this.scene.tweens.add({ targets: this.halo, scaleX: 1, scaleY: 1, alpha: 0.7, duration: 380, ease: 'Cubic.easeOut' });
    if (r > 0) {
      const cam = this.scene.cameras.main;
      if (this.settings().flashes && !this.settings().reducedMotion) cam.flash(110, (def.glow >> 16) & 255, (def.glow >> 8) & 255, def.glow & 255, false);
      if (this.settings().shake) cam.shake(120, 0.002 + r * 0.0012);
      this.sparks(def.glow, 10 + r * 4);
      sfx(r >= 3 ? 'legend' : 'powerup', 1 + r * 0.06);
      // a shock ring out of the meter, and the whole meter kicks
      this.ring.setStrokeStyle(4 + r, def.glow, 1).setScale(0.4).setAlpha(1);
      this.scene.tweens.add({ targets: this.ring, scaleX: 2.6 + r * 0.3, scaleY: 2.6 + r * 0.3, alpha: 0, duration: 520, ease: 'Cubic.easeOut' });
      this.scene.tweens.add({ targets: this.dmg, angle: { from: -6, to: 0 }, scale: { from: 1.5, to: 1 }, duration: 300, ease: 'Back.easeOut' });
      const got = this.onRank?.(r);
      if (got) {
        this.gift.setText(got.text).setColor(got.color).setScale(1.8).setAlpha(1).setY(80);
        this.scene.tweens.killTweensOf(this.gift);
        this.scene.tweens.add({ targets: this.gift, scale: 1, duration: 260, ease: 'Back.easeOut' });
        this.scene.tweens.add({ targets: this.gift, y: 72, alpha: 0, delay: 1200, duration: 400 });
      }
    }
  }

  private sparks(color: number, n: number) {
    if (this.settings().particles === 'desactivado') return;
    for (let i = 0; i < n; i++) {
      const s = this.scene.add.rectangle(0, 6, 4, 4, i % 2 ? color : 0xffffff).setBlendMode(Phaser.BlendModes.ADD);
      this.box.add(s);
      const a = Math.random() * Math.PI * 2, d = 60 + Math.random() * 90;
      this.scene.tweens.add({ targets: s, x: Math.cos(a) * d, y: 6 + Math.sin(a) * d * 0.5, angle: 180, alpha: 0, scale: 0.3, duration: 420 + Math.random() * 300, ease: 'Cubic.easeOut', onComplete: () => s.destroy() });
    }
  }

  /** where it sits: top centre of the screen, under the clock, compensating the camera zoom */
  private place(scale = 1) {
    const cam = this.scene.cameras.main, z = cam.zoom || 1;
    const k = Math.min(1, cam.width / 900, cam.height / 560) * scale; // smaller on short (phone) screens
    const sy = Math.max(64 * k + 10, Math.min(cam.height * 0.2, 140));
    this.box.setPosition(cam.width / 2, cam.height / 2 + (sy - cam.height / 2) / z).setScale(k / z);
  }

  private tick() {
    const now = this.scene.time.now, dt = Math.min(250, now - (this.lastTick || now));
    this.lastTick = now;
    while (this.recent.length && this.recent[0][0] < now - WINDOW_MS) this.recent.shift();
    const pace = this.recent.reduce((a, [, v]) => a + v, 0) / (WINDOW_MS / 1000);
    // the usual pace: learnt fast in the first seconds, then it follows slowly (about 12 s), hardly at all during a burst
    const warm = !this.firstHit || now - this.firstHit < WARMUP_MS;
    this.base += (pace - this.base) * Math.min(1, dt / (warm ? 1500 : this.shown ? 60000 : 12000));
    const usual = Math.max(this.base, FLOOR);
    if (!this.shown) {
      if (!warm && pace > usual * START && this.recent.length >= 5) {
        this.hits = this.recent.length; this.total = this.recent.reduce((a, [, v]) => a + v, 0); this.rank = -1; this.shownDmg = 0; this.calmSince = 0;
        this.open();
        this.rankUp(RANKS.reduce((k, x, i) => (this.total / usual >= x.at ? i : k), 0));
        this.count.setText(`x${this.hits} GOLPES`);
      }
      return;
    }
    this.place();
    // the damage rolls up towards the real total
    if (this.shownDmg < this.total) { this.shownDmg += Math.max(1, (this.total - this.shownDmg) * 0.25); this.dmg.setText(fmt(Math.min(this.shownDmg, this.total))); }
    if (pace > usual * KEEP) this.calmSince = 0; else if (!this.calmSince) this.calmSince = now;
    const left = this.calmSince ? 1 - (now - this.calmSince) / CALM_MS : 1;
    this.bar.setScale(Math.max(0, left), 1);
    if (left <= 0) this.close();
  }

  private close() {
    this.shown = false;
    const final = this.hits;
    this.dmg.setText(fmt(this.total));
    this.count.setText(`x${final} GOLPES`);
    this.word.setText(this.rank >= 2 ? `${RANKS[this.rank].label} TOTAL` : RANKS[Math.max(0, this.rank)].label);
    this.scene.tweens.killTweensOf(this.box);
    this.scene.tweens.add({ targets: this.dmg, scale: 1.35, duration: 120, yoyo: true });
    this.scene.tweens.add({ targets: this.box, alpha: 0, y: this.box.y - 30 / (this.scene.cameras.main.zoom || 1), delay: 650, duration: 380, ease: 'Cubic.easeIn', onComplete: () => this.box.setVisible(false) });
    this.hits = 0; this.total = 0; this.rank = -1; this.shownDmg = 0; this.calmSince = 0;
  }
}
