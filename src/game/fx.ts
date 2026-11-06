/**
 * Combat VFX primitives. Technique sequences live in supertech.ts; the originals are 3D, so these are original recreations.
 * Style (element) and trajectory are derived from the technique's own data: element + name keywords.
 */
import Phaser from 'phaser';
import type { Technique } from '../data/manifest';
import type { Settings } from '../systems/save';
import { ComboMeter } from './fxCombo';

export type FxStyle = 'fuego' | 'hielo' | 'viento' | 'rayo' | 'bosque' | 'tierra' | 'sombra' | 'energia';
export type Trajectory = 'recta' | 'espiral' | 'onda' | 'meteoro' | 'multiple';

export const STYLE_COLORS: Record<FxStyle, [number, number]> = {
  fuego: [0xff5a1f, 0xffd23f], hielo: [0x7fe3ff, 0xffffff], viento: [0x9bf0c8, 0xe9fff6], rayo: [0xffe94a, 0x7fd3ff],
  bosque: [0x58d65a, 0xc8ff7a], tierra: [0xc98a3c, 0xffd590], sombra: [0x9a4dff, 0x2a1240], energia: [0xff8ad8, 0xffffff],
};
const STYLE_PARTICLE: Record<FxStyle, string> = {
  fuego: 'fx:flame', hielo: 'fx:snow', viento: 'fx:spark', rayo: 'fx:spark', bosque: 'fx:leaf', tierra: 'fx:rock', sombra: 'fx:flame', energia: 'fx:star',
};

const KW: [RegExp, FxStyle][] = [
  [/fuego|llama|ardient|infiern|inferno|calor|fénix|fenix|flamíg|ígne|lava|volc|magma|abrasad|solar|verano|amanecer|rojo|limonada|bisonte/i, 'fuego'],
  [/ventisca|hielo|helad|glacia|nieve|congel|escarcha|polar|cristal|frío|frio|blizzard|diamant|diamond|niebla|sirena|burbuja/i, 'hielo'],
  [/relámpago|relampago|rayo|trueno|eléctr|electr|chispa|inazuma|voltio|centell|plasma|gauss|bobina|volt|sónic|sonic|magnet/i, 'rayo'],
  [/oscur|sombr|diabl|maldi|negro|tiniebl|demon|agujero|umbr|vampir|víbora|cuervo|fantasm|supermasiv|réquiem|caos|ceniza/i, 'sombra'],
  [/divin|celest|sagrad|dios|ángel|angel|luz|estrella|planet|orbe|glorios|inocente|pluma|reinos/i, 'energia'],
];
const ELEMENT_STYLE: Record<string, FxStyle> = { Fuego: 'fuego', Aire: 'viento', Bosque: 'bosque', 'Montaña': 'tierra', Neutro: 'energia' };

export function fxStyle(t: Pick<Technique, 'name' | 'element'>): FxStyle {
  for (const [rx, s] of KW) if (rx.test(t.name)) return s;
  return (t.element && ELEMENT_STYLE[t.element]) || 'energia';
}

export function trajectory(t: Pick<Technique, 'name'>): Trajectory {
  const n = t.name;
  if (/tornado|torbellino|cicl[oó]n|espiral|remolino|giro|rodante|tornillo|sierra|curvo|efecto|bumer|cicl/i.test(n)) return 'espiral';
  if (/drag[oó]n|serpien|onda|ola|tsunami|cometa|víbora|zigzag|zig zag|sirena/i.test(n)) return 'onda';
  if (/meteor|ca[ií]da|cielo|celest|divin|lluvia|estrella|sagrad|tierra|sismo|supermasiv|planet|cañ[oó]n|martillo/i.test(n)) return 'meteoro';
  if (/tri[aá]ngulo|m[uú]ltiple|trillizo|combinad|doble|clon|gemel|aguijones|fisi[oó]n|remate triple|lanceros/i.test(n)) return 'multiple';
  return 'recta';
}

/** Draws the procedural textures once (ball and particles). */
export function makeFxTextures(scene: Phaser.Scene) {
  if (scene.textures.exists('fx:ball')) return;
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  // 12x12 pixel-art football: white ball, dark outline, black patches
  const ball = [
    '....####....',
    '..##wwww##..',
    '.#wwwwwwww#.',
    '.#ww##www#w#',
    '#ww####wwww#',
    '#www##wwww##',
    '#wwwwwww####',
    '##wwwwwww##w',
    '.#w##wwwwww#',
    '.##www##ww#.',
    '..##ww##w#..',
    '....####....',
  ];
  ball.forEach((row, y) => [...row].forEach((ch, x) => {
    if (ch === '#') g.fillStyle(0x202020).fillRect(x, y, 1, 1);
    else if (ch === 'w') g.fillStyle(0xffffff).fillRect(x, y, 1, 1);
  }));
  g.fillStyle(0xd8d8e8).fillRect(3, 9, 2, 1).fillRect(8, 2, 2, 1);
  g.generateTexture('fx:ball', 12, 12);
  g.clear();
  g.fillStyle(0xffffff).fillRect(0, 0, 3, 3);
  g.generateTexture('fx:spark', 3, 3);
  g.clear();
  g.fillStyle(0xffffff, 0.35).fillCircle(4, 4, 4);
  g.fillStyle(0xffffff, 0.8).fillCircle(4, 4, 2.5);
  g.generateTexture('fx:flame', 8, 8);
  g.clear();
  g.fillStyle(0xffffff).fillRect(2, 0, 1, 5).fillRect(0, 2, 5, 1).fillRect(1, 1, 1, 1).fillRect(3, 3, 1, 1).fillRect(3, 1, 1, 1).fillRect(1, 3, 1, 1);
  g.generateTexture('fx:snow', 5, 5);
  g.clear();
  g.fillStyle(0xffffff).fillRect(1, 0, 3, 1).fillRect(0, 1, 5, 2).fillRect(1, 3, 2, 1);
  g.generateTexture('fx:leaf', 5, 4);
  g.clear();
  g.fillStyle(0xffffff).fillRect(0, 1, 4, 2).fillRect(1, 0, 2, 4);
  g.generateTexture('fx:rock', 4, 4);
  g.clear();
  g.fillStyle(0xffffff).fillRect(2, 0, 1, 5).fillRect(0, 2, 5, 1);
  g.generateTexture('fx:star', 5, 5);
  g.clear();
  // 24x30 pixel-art open hand (palm facing the viewer), drawn in white so it can be tinted per technique
  const hand = [
    '..........##............',
    '....##...#ww#...##......',
    '...#ww#..#ww#..#ww#.....',
    '...#ww#..#ww#..#ww#.....',
    '...#ww#..#ww#..#ww#.##..',
    '...#ww#..#ww#..#ww##ww#.',
    '...#ww#..#ww#..#ww##ww#.',
    '...#ww##.#ww#.##ww##ww#.',
    '...#wwww##ww##wwww#ww#..',
    '...#wwwwwwwwwwwwwwwwww#.',
    '##.#wwwwwwwwwwwwwwwwww#.',
    '#w##wwwwwwwwwwwwwwwwww#.',
    '#ww#wwwwwwwwwwwwwwwwww#.',
    '.#wwwwwwwwwwwwwwwwwwww#.',
    '.#wwwwwwwwwwwwwwwwwwww#.',
    '..#wwwwwwwwwwwwwwwwww#..',
    '..#wwwwwwwwwwwwwwwwww#..',
    '...#wwwwwwwwwwwwwwww#...',
    '...#wwwwwwwwwwwwwwww#...',
    '....#wwwwwwwwwwwwww#....',
    '....#wwwwwwwwwwwwww#....',
    '.....#wwwwwwwwwwww#.....',
    '.....#wwwwwwwwwwww#.....',
    '.....##############.....',
  ];
  hand.forEach((row, y) => [...row].forEach((ch, x) => {
    if (ch === '#') g.fillStyle(0x5a3a10).fillRect(x, y, 1, 1);
    else if (ch === 'w') g.fillStyle(0xffffff).fillRect(x, y, 1, 1);
  }));
  g.generateTexture('fx:hand', 24, 24);
  g.clear();
  // Supernova core: bright star on a soft halo
  g.fillStyle(0xbfa8ff, 0.3).fillCircle(12, 12, 12);
  g.fillStyle(0xe6dcff, 0.7).fillCircle(12, 12, 8);
  g.fillStyle(0xffffff).fillCircle(12, 12, 5).fillTriangle(12, 0, 9, 12, 15, 12).fillTriangle(12, 24, 9, 12, 15, 12).fillTriangle(0, 12, 12, 9, 12, 15).fillTriangle(24, 12, 12, 9, 12, 15);
  g.generateTexture('fx:nova', 24, 24);
  g.clear();
  // white silhouettes, tinted per technique
  g.fillStyle(0xffffff);
  g.fillPoints([[2, 26], [12, 14], [10, 4], [20, 10], [30, 2], [34, 12], [46, 14], [38, 20], [46, 26], [34, 26], [26, 34], [24, 26], [14, 30]].map(([x, y]) => new Phaser.Geom.Point(x, y)), true);
  g.fillStyle(0x000000, 0.75).fillCircle(29, 13, 2);
  g.generateTexture('fx:dragon', 48, 36);
  g.clear();
  g.fillStyle(0xffffff);
  for (const mirror of [1, -1]) {
    g.fillPoints([[0, 22], [10, 8], [24, 0], [22, 10], [30, 8], [26, 18], [32, 18], [24, 26], [14, 26], [6, 34]]
      .map(([x, y]) => new Phaser.Geom.Point(32 + x * mirror, y)), true);
  }
  g.generateTexture('fx:wings', 64, 36);
  g.clear();
  // experience: green energy spark, blue mini ball, golden lightning bolt (bigger value = bigger, rarer, louder shape)
  const pts = (l: number[]) => l.flatMap((v, i) => (i % 2 ? [] : [new Phaser.Geom.Point(v, l[i + 1])]));
  g.fillStyle(0x5ee05a, 0.3).fillCircle(5, 5, 5);
  g.fillStyle(0x5ee05a).fillTriangle(5, 0, 2, 5, 8, 5).fillTriangle(5, 10, 2, 5, 8, 5);
  g.fillStyle(0xeaffea).fillRect(4, 3, 2, 2);
  g.generateTexture('fx:orb0', 10, 10);
  g.clear();
  g.fillStyle(0x4fb3ff, 0.3).fillCircle(7, 7, 7);
  g.fillStyle(0x0a1d48).fillCircle(7, 7, 5);
  g.fillStyle(0xffffff).fillCircle(7, 7, 4);
  g.fillStyle(0x2a6ae0).fillRect(6, 4, 3, 2).fillRect(4, 7, 2, 2).fillRect(9, 7, 2, 2).fillRect(6, 9, 3, 1);
  g.generateTexture('fx:orb1', 14, 14);
  g.clear();
  g.fillStyle(0xffc83a, 0.3).fillCircle(9, 9, 9);
  g.fillStyle(0x7a4a00).fillPoints(pts([10, 1, 3, 10, 8, 10, 6, 17, 15, 7, 10, 7, 12, 1]), true);
  g.fillStyle(0xffe24a).fillPoints(pts([10, 2, 4, 9.5, 8.5, 9.5, 7, 15.5, 14, 7.5, 9.5, 7.5, 11.5, 2]), true);
  g.generateTexture('fx:orb2', 18, 18);
  g.clear();
  // field pickups: 14x14 tokens with a framed symbol
  const token = (key: string, c: number, draw: () => void) => {
    g.fillStyle(0x0a1d48).fillCircle(7, 7, 7);
    g.fillStyle(c).fillCircle(7, 7, 6);
    g.fillStyle(0xffffff);
    draw();
    g.generateTexture(key, 14, 14);
    g.clear();
  };
  token('fx:magnet', 0xe23a3a, () => { g.fillRect(3, 3, 3, 6).fillRect(8, 3, 3, 6).fillRect(3, 9, 8, 2); g.fillStyle(0x202020).fillRect(3, 3, 3, 2).fillRect(8, 3, 3, 2); });
  token('fx:pk_shield', 0x4fb3ff, () => { g.fillRect(4, 3, 6, 5).fillTriangle(4, 8, 10, 8, 7, 12); });
  token('fx:pk_xp', 0x5ee05a, () => { g.fillRect(3, 3, 8, 1).fillRect(6, 3, 2, 8).fillRect(3, 10, 8, 1); });
  token('fx:pk_dmg', 0xff6a2a, () => { g.fillTriangle(8, 2, 3, 8, 7, 8).fillTriangle(6, 12, 11, 6, 7, 6); });
  token('fx:pk_cd', 0xb36bff, () => { g.fillCircle(7, 7, 4); g.fillStyle(0x202020).fillRect(7, 4, 1, 4).fillRect(7, 7, 3, 1); });
  token('fx:pk_speed', 0x5ee0c8, () => { g.fillTriangle(3, 3, 8, 7, 3, 11).fillTriangle(7, 3, 12, 7, 7, 11); });
  token('fx:pk_tech', 0xb36bff, () => { g.fillStyle(0xffe24a).fillRect(3, 4, 8, 7); g.fillStyle(0xffffff).fillRect(6, 3, 2, 8); });
  token('fx:pk_coins', 0xc98a3c, () => { g.fillCircle(7, 8, 4); g.fillRect(5, 2, 4, 2); });
  // Ficha de Fichaje: blue-rimmed gold coin with a lightning bolt (same design as the menu counter)
  g.fillStyle(0x0a1d48).fillCircle(7, 7, 7);
  g.fillStyle(0x1a6ad8).fillCircle(7, 7, 6);
  g.fillStyle(0xffd21f).fillCircle(7, 7, 4.5);
  g.fillStyle(0xffffff).fillTriangle(8, 3, 4.5, 8, 7, 8).fillTriangle(6.5, 11.5, 9.5, 6.5, 7, 6.5);
  g.generateTexture('fx:pk_token', 14, 14);
  g.clear();
  token('fx:pk_lure', 0xff4f8b, () => { g.fillCircle(7, 7, 2); g.lineStyle(1, 0xffffff).strokeCircle(7, 7, 5); });
  token('fx:pk_ice', 0x7fe3ff, () => { g.fillRect(6, 2, 2, 10).fillRect(2, 6, 10, 2); });
  token('fx:pk_revive', 0xffe27a, () => { g.fillRect(6, 2, 2, 10).fillRect(3, 5, 8, 2); g.fillStyle(0xffffff).fillRect(6, 3, 1, 3); });
  token('fx:pk_barrier', 0x8fe8ff, () => { g.lineStyle(2, 0xffffff).strokeCircle(7, 7, 4); });
  token('fx:pk_elem', 0x5ee0a0, () => { g.fillTriangle(7, 2, 3, 11, 11, 11); g.fillStyle(0x202020).fillRect(6, 6, 2, 3); });
  token('fx:pk_elite', 0xff9a3a, () => { g.fillTriangle(2, 5, 7, 2, 12, 5); g.fillRect(3, 6, 8, 5); });
  token('fx:pk_area', 0x6fd0ff, () => { g.lineStyle(1, 0xffffff).strokeCircle(7, 7, 5).strokeCircle(7, 7, 2); });
  token('fx:pk_gamble', 0xb36bff, () => { g.fillRect(3, 3, 8, 8); g.fillStyle(0xffffff).fillRect(5, 5, 1, 1).fillRect(8, 8, 1, 1).fillRect(5, 8, 1, 1).fillRect(8, 5, 1, 1); });
  g.fillStyle(0x6d7a8c).fillRect(4, 10, 16, 22).fillStyle(0x8c9aae).fillRect(6, 10, 12, 20).fillStyle(0x3d4656).fillRect(2, 30, 20, 6).fillStyle(0xffffff).fillRect(10, 2, 4, 8).fillRect(8, 4, 8, 4).fillRect(9, 14, 6, 10);
  g.generateTexture('fx:altar', 24, 36);
  g.clear();
  token('fx:pk_chest', 0xffc83a, () => { g.fillStyle(0x7a4a12).fillRect(3, 4, 8, 7); g.fillStyle(0xffffff).fillRect(6, 6, 2, 3); });
  g.destroy();
}

/** Live decorative objects allowed at once; beyond this, optional detail is skipped instead of dropping frames. */
const DECOR_LIMIT = 160;

/** 1.76: the colours of a keeper's own hand and Majin (fxTech handTintOf) */
export interface HandTint { main: number; light: number; dark: number }

export class Fx {
  private emitters = new Map<string, Phaser.GameObjects.Particles.ParticleEmitter>();
  private numbers: Phaser.GameObjects.Text[] = [];
  /** 1.93: the combo meter at the top of the screen (fxCombo.ts) */
  private combo: ComboMeter;
  /** 1.93: the usual size of a hit (slow average), so «big» and «huge» stay special as the run grows */
  private avgHit = 0;
  private numberIdx = 0;

  private rawShake: Phaser.Cameras.Scene2D.Camera['shake'];

  constructor(private scene: Phaser.Scene, public settings: Settings) {
    // every camera shake obeys the player's setting, also the techniques that shake the camera directly (Keshin, anime
    // effects): off = nothing, and the slider scales them (their strengths were tuned for the default 0.35)
    const cam = scene.cameras.main as Phaser.Cameras.Scene2D.Camera & { rawShake?: Phaser.Cameras.Scene2D.Camera['shake'] };
    this.rawShake = cam.rawShake ??= cam.shake.bind(cam); // a restarted scene may keep its camera: never wrap twice
    cam.shake = ((ms: number, intensity?: number | Phaser.Math.Vector2, ...rest: unknown[]) => {
      if (this.settings.shake <= 0 || this.settings.reducedMotion) return cam;
      const k = typeof intensity === 'number' ? intensity * Math.min(1, this.settings.shake / 0.35) : intensity;
      return (this.rawShake as (...a: unknown[]) => Phaser.Cameras.Scene2D.Camera)(ms, k, ...rest);
    }) as Phaser.Cameras.Scene2D.Camera['shake'];
    makeFxTextures(scene);
    for (const key of ['fx:flame', 'fx:snow', 'fx:spark', 'fx:leaf', 'fx:rock', 'fx:star']) {
      const e = scene.add.particles(0, 0, key, {
        emitting: false, lifespan: { min: 220, max: 520 }, speed: { min: 10, max: 60 }, scale: { start: 1, end: 0.2 },
        alpha: { start: 1, end: 0 }, blendMode: key === 'fx:flame' || key === 'fx:spark' ? 'ADD' : 'NORMAL',
      });
      e.setDepth(9000);
      this.emitters.set(key, e);
    }
    for (let i = 0; i < 36; i++) {
      this.numbers.push(scene.add.text(0, 0, '', {
        fontFamily: '"Press Start 2P"', fontSize: '8px', color: '#ffffff', stroke: '#000000', strokeThickness: 3,
      }).setDepth(9500).setVisible(false).setOrigin(0.5));
    }
    this.combo = new ComboMeter(scene, () => this.settings);
  }

  /** the scene, for the drawn manifestations (fxManif.ts, fxTech.ts) */
  get world() { return this.scene; }

  private density() {
    const d = this.settings.particles === 'completo' ? 1 : this.settings.particles === 'reducido' ? 0.4 : 0;
    return this.settings.reducedMotion ? Math.min(d, 0.4) : d;
  }

  private live = 0;
  private free(n: number) { return this.density() > 0 && this.live + n <= DECOR_LIMIT; }

  /** Tweened throwaway object, counted against the budget. */
  private deco<T extends Phaser.GameObjects.GameObject>(obj: T, tween: Omit<Phaser.Types.Tweens.TweenBuilderConfig, 'targets'>) {
    this.live++;
    this.scene.tweens.add({ targets: obj, ...tween, onComplete: () => { obj.destroy(); this.live--; } });
    return obj;
  }

  /** Particles rushing inwards: energy gathering. */
  gather(x: number, y: number, c1: number, c2: number, count: number, radius: number, ms: number) {
    const n = Math.round(count * this.density());
    if (!this.free(n)) return;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, r = radius * (0.7 + Math.random() * 0.5);
      const p = this.scene.add.image(x + Math.cos(a) * r, y + Math.sin(a) * r * 0.8, 'fx:spark').setTint(i % 3 ? c1 : c2)
        .setBlendMode(Phaser.BlendModes.ADD).setDepth(8800);
      this.deco(p, { x, y, scale: 0.4, duration: ms * (0.6 + Math.random() * 0.4), ease: 'Cubic.easeIn' });
    }
  }

  /** Objects circling a point, shrinking onto it. */
  orbit(x: number, y: number, tex: string, color: number, count: number, radius: number, ms: number) {
    if (!this.free(count)) return;
    for (let i = 0; i < count; i++) {
      const p = this.scene.add.image(x, y, tex).setTint(color).setBlendMode(Phaser.BlendModes.ADD).setDepth(8810).setScale(1.4);
      this.live++;
      this.scene.tweens.addCounter({ from: 0, to: 1, duration: ms,
        onUpdate: (tw) => {
          const t = tw.getValue() ?? 0, a = (i / count) * Math.PI * 2 + t * 9, r = radius * (1 - t * 0.8);
          p.setPosition(x + Math.cos(a) * r, y + Math.sin(a) * r * 0.55);
        },
        onComplete: () => { p.destroy(); this.live--; } });
    }
  }

  /** Flat circle on the ground, closing in while a technique charges. */
  groundRing(x: number, y: number, radius: number, color: number, ms: number) {
    if (!this.free(1)) return;
    const c = this.scene.add.ellipse(x, y, radius * 2, radius, color, 0.12).setStrokeStyle(2, color, 0.9).setDepth(y - 1);
    this.deco(c, { scaleX: 0.3, scaleY: 0.3, alpha: 0.2, duration: ms, ease: 'Quad.easeIn' });
  }

  /** Tinted silhouette appearing behind a player or at an impact (dragons, wings...). */
  summon(tex: string, x: number, y: number, color: number, scale: number, ms: number) {
    if (!this.free(1)) return;
    const s = this.scene.add.image(x, y + 8, tex).setTint(color).setAlpha(0).setScale(scale * 0.5).setBlendMode(Phaser.BlendModes.ADD).setDepth(8790);
    this.deco(s, { y, scale: scale * 1.15, alpha: { from: 0.9, to: 0 }, duration: ms, ease: 'Cubic.easeOut' });
  }

  /** Brief bright disc at an impact; respects the flashes setting and stays translucent. */
  flashDisc(x: number, y: number, radius: number, color: number, ms: number) {
    if (!this.settings.flashes || !this.free(1)) return;
    const c = this.scene.add.circle(x, y, radius, color, 0.55).setBlendMode(Phaser.BlendModes.ADD).setDepth(8850);
    this.deco(c, { alpha: 0, scale: 1.3, duration: ms });
  }

  /** Radial light streaks. */
  rays(x: number, y: number, count: number, length: number, color: number, ms: number) {
    if (!this.free(count)) return;
    for (let i = 0; i < count; i++) {
      const r = this.scene.add.rectangle(x, y, 2, length * 0.5, color, 0.8).setOrigin(0.5, 1).setRotation((i / count) * Math.PI * 2)
        .setBlendMode(Phaser.BlendModes.ADD).setDepth(8840);
      this.deco(r, { scaleY: 2, alpha: 0, duration: ms, ease: 'Cubic.easeOut' });
    }
  }

  /** Ring collapsing inwards (shadow techniques). */
  implode(x: number, y: number, radius: number, color: number, ms: number) {
    if (!this.free(1)) return;
    const c = this.scene.add.circle(x, y, radius, color, 0.25).setStrokeStyle(3, color).setDepth(8840);
    this.deco(c, { scale: 0.1, alpha: 0.2, duration: ms, ease: 'Cubic.easeIn' });
  }

  /** Short floating text (technique evolved, buff taken). */
  label(x: number, y: number, text: string, color = '#ffe24a') {
    const t = this.scene.add.text(x, y, text, { fontFamily: '"Press Start 2P"', fontSize: '8px', color, stroke: '#000000', strokeThickness: 3 })
      .setOrigin(0.5).setDepth(9600);
    this.scene.tweens.add({ targets: t, y: y - 22, alpha: { from: 1, to: 0 }, duration: 1300, ease: 'Cubic.easeOut', onComplete: () => t.destroy() });
  }

  /** Emits `count` particles of a style at a point (scaled by the particle setting). */
  burst(style: FxStyle, x: number, y: number, count: number, speed = 60, tintAlt = false) {
    const n = Math.round(count * this.density());
    if (n <= 0) return;
    const e = this.emitters.get(STYLE_PARTICLE[style]);
    if (!e?.active || !e.ops) return; // scene shutting down: its emitters are already destroyed
    const [c1, c2] = STYLE_COLORS[style];
    e.setParticleTint(tintAlt ? c2 : c1);
    e.setParticleSpeed(speed * 0.3, speed);
    e.emitParticleAt(x, y, n);
  }

  trail(style: FxStyle, x: number, y: number, amount: number) {
    if (Math.random() < amount * this.density()) this.burst(style, x, y, 1, 18, Math.random() < 0.4);
  }

  ring(x: number, y: number, radius: number, color: number, duration = 320, width = 2) {
    const r = this.scene.add.circle(x, y, 4, color, 0.18).setStrokeStyle(width, color).setDepth(8000);
    this.scene.tweens.add({ targets: r, radius, alpha: 0, duration, ease: 'Cubic.easeOut', onComplete: () => r.destroy() });
  }

  flash(target: Phaser.GameObjects.Components.Tint & Phaser.GameObjects.GameObject, color = 0xffffff, ms = 60) {
    if (!this.settings.flashes) return;
    target.setTintFill(color);
    this.scene.time.delayedCall(ms, () => { if (target.active) target.clearTint(); });
  }

  shake(intensity: number, ms = 80) {
    if (this.settings.shake <= 0 || this.settings.reducedMotion) return;
    // capped: only strong hits, bosses and big explosions call this, and never stronger than a light rumble
    this.rawShake(ms, Math.min(0.006, intensity) * this.settings.shake);
  }

  lightning(x1: number, y1: number, x2: number, y2: number, color = 0xfff27a) {
    if (this.density() === 0) return;
    const g = this.scene.add.graphics().setDepth(8500);
    g.lineStyle(2, color, 1).beginPath().moveTo(x1, y1);
    const n = 5;
    for (let i = 1; i < n; i++) {
      const t = i / n;
      g.lineTo(x1 + (x2 - x1) * t + Phaser.Math.Between(-6, 6), y1 + (y2 - y1) * t + Phaser.Math.Between(-6, 6));
    }
    g.lineTo(x2, y2).strokePath();
    this.scene.tweens.add({ targets: g, alpha: 0, duration: 140, onComplete: () => g.destroy() });
  }

  /** Rising elemental whirlwind around a player (Tornado de fuego, torbellinos, ciclones...). */
  tornado(x: number, y: number, style: FxStyle, level: number, ms = 320) {
    if (this.density() === 0) return;
    const [c1, c2] = STYLE_COLORS[style];
    const n = Math.round((10 + level * 3) * (this.density() < 1 ? 0.5 : 1));
    const parts = Array.from({ length: n }, (_, i) => this.scene.add.image(x, y, STYLE_PARTICLE[style])
      .setTint(i % 3 ? c1 : c2).setBlendMode(Phaser.BlendModes.ADD).setDepth(y + 2));
    this.scene.tweens.addCounter({
      from: 0, to: 1, duration: ms,
      onUpdate: (tw) => {
        const t = tw.getValue() ?? 0;
        parts.forEach((p, i) => {
          const h = (i / n) * (26 + level * 3) * (0.4 + t);
          const a = i * 0.9 + t * 14;
          const r = 6 + h * 0.35;
          p.setPosition(x + Math.cos(a) * r, y - h + Math.sin(a) * r * 0.35).setScale(1.3 - (i / n) * 0.6).setAlpha(1 - t * 0.4);
        });
      },
      onComplete: () => parts.forEach((p) => p.destroy()),
    });
  }

  /** Short column of light while charging a shot. */
  pillar(x: number, y: number, color: number, level: number) {
    const r = this.scene.add.rectangle(x, y - 14, 8 + level * 2, 44, color, 0.35).setBlendMode(Phaser.BlendModes.ADD).setDepth(y + 1);
    this.scene.tweens.add({ targets: r, scaleX: 0.2, alpha: 0, duration: 300, onComplete: () => r.destroy() });
  }

  /** Giant hand rising behind the goalkeeper (Mano celestial / Mano mágica...). */
  hand(x: number, y: number, level: number, tint: number) {
    const s0 = 1.6 + level * 0.25;
    const glow = this.scene.add.circle(x, y - 20, 18 + level * 3, tint, 0.25).setBlendMode(Phaser.BlendModes.ADD).setDepth(8790);
    const h = this.scene.add.image(x, y + 6, 'fx:hand').setOrigin(0.5, 1).setTint(tint).setScale(0.4).setAlpha(0).setDepth(8800);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const ray = this.scene.add.rectangle(x, y - 20, 2, 26 + level * 4, 0xfff6c0, 0.6).setRotation(a).setOrigin(0.5, 1)
        .setBlendMode(Phaser.BlendModes.ADD).setDepth(8795);
      this.scene.tweens.add({ targets: ray, scaleY: 1.6, alpha: 0, duration: 520, onComplete: () => ray.destroy() });
    }
    this.scene.tweens.add({ targets: h, y: y - 14, scale: s0, alpha: 0.95, duration: 220, ease: 'Back.easeOut' });
    this.scene.tweens.add({ targets: h, alpha: 0, delay: 520, duration: 260, onComplete: () => h.destroy() });
    this.scene.tweens.add({ targets: glow, radius: 34 + level * 4, alpha: 0, duration: 700, onComplete: () => glow.destroy() });
    this.burst('energia', x, y - 24, 10 + level * 3, 70, true);
    this.groundRing(x, y + 8, 30 + level * 3, tint, 300);
    this.rays(x, y - 24, 10, 34 + level * 3, 0xfff6c0, 460);
  }

  /**
   * Colmillo de pantera: a beast's jaws of fire. Two rows of fangs open wide around the target and slam shut,
   * with a red flash and slash marks. Drawn with shapes (the original effect is 3D).
   */
  fangs(x: number, y: number, size: number, level: number) {
    const w = size * 1.1, h = size * 0.7;
    const jaw = (top: boolean) => {
      const g = this.scene.add.graphics().setDepth(8805).setPosition(x, y);
      const dir = top ? -1 : 1;
      g.fillStyle(0x3a0a00, 0.85).fillRoundedRect(-w / 2 - 4, top ? -h - 10 : h - 2, w + 8, 12, 4);
      const n = 6 + Math.floor(level / 3);
      for (let k = 0; k < n; k++) {
        const fx = -w / 2 + (k + 0.5) * (w / n);
        const len = (k === 1 || k === n - 2 ? 1.6 : 1) * (8 + level);
        g.fillStyle(0xfff6e0).fillTriangle(fx - w / n / 2 + 1, dir * -h, fx + w / n / 2 - 1, dir * -h, fx, dir * (-h + len));
        g.lineStyle(1, 0xff5a1a).strokeTriangle(fx - w / n / 2 + 1, dir * -h, fx + w / n / 2 - 1, dir * -h, fx, dir * (-h + len));
      }
      g.setScale(1.25);
      this.scene.tweens.add({ targets: g, y: y - dir * h * 0.75, scale: 1, duration: 110, ease: 'Quad.easeIn', delay: 120,
        onComplete: () => this.scene.tweens.add({ targets: g, alpha: 0, duration: 260, delay: 140, onComplete: () => g.destroy() }) });
    };
    const glow = this.scene.add.ellipse(x, y, w * 1.6, h * 2.4, 0xff3a00, 0.28).setBlendMode(Phaser.BlendModes.ADD).setDepth(8790);
    this.scene.tweens.add({ targets: glow, alpha: 0, scaleX: 1.4, scaleY: 1.4, duration: 520, onComplete: () => glow.destroy() });
    jaw(true);
    jaw(false);
    this.scene.time.delayedCall(230, () => {
      for (let k = -1; k <= 1; k++) {
        const s = this.scene.add.rectangle(x + k * 9, y, 3, size * 1.3, 0xffe0a0, 0.95).setRotation(0.5).setBlendMode(Phaser.BlendModes.ADD).setDepth(8810);
        this.scene.tweens.add({ targets: s, scaleY: 0.1, alpha: 0, duration: 260, onComplete: () => s.destroy() });
      }
      this.burst('fuego', x, y, 14 + level * 2, 80, true);
      this.shake(0.004, 110);
    });
  }

  /** Mano Mágica: violet hand in a turning rune circle, closing into a fist of light. Reads apart from the golden Mano Celestial. */
  magicHand(x: number, y: number, level: number, tint?: HandTint | null) {
    const violet = tint?.main ?? 0xb36bff; // 1.76: each keeper's own colour (fxTech handTintOf)
    const s0 = 1.4 + level * 0.1;
    if (this.free(1)) {
      const circle = this.scene.add.ellipse(x, y + 8, 60 + level * 4, 26 + level * 2, violet, 0.12).setStrokeStyle(2, tint?.light ?? 0xe6c8ff).setDepth(y - 1);
      this.deco(circle, { angle: 40, scaleX: 1.3, scaleY: 1.3, alpha: 0, duration: 680 });
    }
    this.orbit(x, y - 16, 'fx:star', tint?.light ?? 0xe6c8ff, 6, 34 + level, 560);
    const h = this.scene.add.image(x, y + 8, 'fx:hand').setOrigin(0.5, 1).setTint(violet).setBlendMode(Phaser.BlendModes.ADD).setScale(0.3, 1.2).setAlpha(0).setDepth(8800);
    this.scene.tweens.add({ targets: h, y: y - 8, scaleX: s0, scaleY: s0, alpha: 0.9, duration: 200, ease: 'Sine.easeOut' });
    this.scene.tweens.add({ targets: h, scaleX: s0 * 0.75, scaleY: s0 * 0.75, delay: 300, duration: 120, yoyo: true });
    this.scene.tweens.add({ targets: h, alpha: 0, delay: 560, duration: 180, onComplete: () => h.destroy() });
    this.burst('sombra', x, y - 18, 6 + level * 2, 50, true);
  }

  /**
   * Summoned entities, drawn as layered silhouettes (originals are 3D): they APPEAR (rise from the ground), ACT (a
   * gesture of their own) and LEAVE (fade), apart from the ball and the impact. `big` = mythic/legend/hero owner.
   *  - demonio: horned figure with bat wings and red eyes, rising behind the shooter, wings beating once
   *  - majin: giant muscular spirit behind a keeper, raising its arm to block
   */
  entity(kind: 'demonio' | 'majin', x: number, y: number, ms: number, big = false, tint?: HandTint | null) {
    if (!this.free(1)) return;
    const s = big ? 1.35 : 1;
    const g = this.scene.add.graphics().setDepth(y - 2).setPosition(x, y);
    const pts = (l: number[]) => l.flatMap((v, i) => (i % 2 ? [] : [new Phaser.Geom.Point(v, l[i + 1])]));
    if (kind === 'demonio') {
      const body = 0x2a0a3a, edge = 0xb03aff;
      g.fillStyle(0x8a1aff, 0.18).fillEllipse(0, -34, 110, 90);
      // wings (drawn first: behind the body)
      for (const side of [-1, 1]) {
        g.fillStyle(body, 0.92).fillPoints(pts([0, -40, side * 52, -64, side * 46, -40, side * 58, -30, side * 40, -24, side * 46, -10, side * 14, -20]), true);
        g.lineStyle(2, edge, 0.9).strokePoints(pts([0, -40, side * 52, -64, side * 46, -40, side * 58, -30, side * 40, -24, side * 46, -10, side * 14, -20]), true);
      }
      g.fillStyle(body, 0.95).fillEllipse(0, -30, 30, 40).fillCircle(0, -54, 11);
      g.fillStyle(body).fillTriangle(-9, -60, -4, -62, -14, -76).fillTriangle(9, -60, 4, -62, 14, -76); // horns
      g.fillStyle(0xff2a2a).fillRect(-6, -57, 4, 2).fillRect(2, -57, 4, 2); // eyes
      g.setScale(s * 0.2, 0).setAlpha(0);
      this.scene.tweens.add({ targets: g, scaleX: s, scaleY: s, alpha: 1, duration: ms * 0.35, ease: 'Back.easeOut' });
      this.scene.tweens.add({ targets: g, scaleX: s * 1.12, delay: ms * 0.45, duration: ms * 0.12, yoyo: true }); // wing beat
      this.scene.tweens.add({ targets: g, alpha: 0, y: y - 12, delay: ms * 0.8, duration: ms * 0.45, onComplete: () => g.destroy() });
      this.burst('sombra', x, y - 30, 10, 60, true);
    } else {
      const skin = tint?.main ?? 0xffa040, dark = tint?.dark ?? 0x7a2a00;
      g.fillStyle(tint?.light ?? 0xffd060, 0.2).fillEllipse(0, -46, 120, 110);
      g.fillStyle(skin, 0.9).fillEllipse(0, -46, 54, 46).fillCircle(0, -78, 13); // torso, head
      g.fillStyle(dark, 0.9).fillRect(-14, -80, 28, 5); // brow band
      g.fillStyle(0xffffff).fillRect(-7, -79, 4, 2).fillRect(3, -79, 4, 2);
      g.fillStyle(skin, 0.9).fillEllipse(-30, -40, 16, 34); // left arm, down
      const arm = this.scene.add.graphics().setDepth(y - 1).setPosition(x + 24 * s, y - 60 * s);
      arm.fillStyle(skin, 0.95).fillRoundedRect(-7, -38, 14, 40, 6).fillCircle(0, -42, 12); // raised arm + open palm
      arm.lineStyle(2, dark).strokeCircle(0, -42, 12);
      arm.setScale(s).setAngle(70).setAlpha(0);
      g.setScale(s * 0.6, 0).setAlpha(0);
      this.scene.tweens.add({ targets: g, scaleX: s, scaleY: s, alpha: 0.95, duration: ms * 0.3, ease: 'Cubic.easeOut' });
      this.scene.tweens.add({ targets: arm, alpha: 1, angle: -10, delay: ms * 0.3, duration: ms * 0.25, ease: 'Back.easeOut' }); // the block
      this.scene.tweens.add({ targets: [g, arm], alpha: 0, delay: ms * 0.8, duration: ms * 0.4, onComplete: () => { g.destroy(); arm.destroy(); } });
      this.rays(x + 24 * s, y - 100 * s, 10, 40, tint?.light ?? 0xffe080, ms * 0.6);
    }
  }

  /**
   * El Olvido (The End): a black hole opens, its accretion disc spins, everything around is pulled in, then it closes
   * on itself and the ball is gone.
   */
  /**
   * Araña Gigante: a giant spider drops onto the area on its thread, plants eight jointed legs that strike the ground,
   * and throws a web over the rivals in `caught`. Everything is tweened and destroys itself after `ms`.
   */
  spider(x: number, y: number, radius: number, level: number, ms: number, caught: { x: number; y: number }[], big = false) {
    const s = this.scene;
    const scale = (0.9 + level * 0.05) * (big ? 1.35 : 1);
    const body = s.add.graphics().setDepth(8800).setPosition(x, y - 120);
    const legs = s.add.graphics().setDepth(8799).setPosition(x, y);
    const web = s.add.graphics().setDepth(8790).setPosition(x, y);
    const thread = s.add.rectangle(x, y - 160, 1.5, 120, 0xe8e8e8, 0.8).setOrigin(0.5, 0).setDepth(8798);
    // body: abdomen with a red hourglass, head and eyes
    body.fillStyle(0x1a0a0a).fillEllipse(0, 6, 34 * scale, 30 * scale).fillEllipse(0, -12 * scale, 20 * scale, 16 * scale);
    body.fillStyle(0xd8261a).fillTriangle(-5 * scale, 0, 5 * scale, 0, 0, 7 * scale).fillTriangle(-5 * scale, 14 * scale, 5 * scale, 14 * scale, 0, 7 * scale);
    body.fillStyle(0xff4a2a);
    for (const ex of [-6, -2, 2, 6]) body.fillCircle(ex * scale, -15 * scale, 1.6 * scale);
    body.lineStyle(2, 0xff5a1a, 0.7).strokeEllipse(0, 6, 34 * scale, 30 * scale);
    const drawLegs = (spread: number) => {
      legs.clear().lineStyle(3 * scale, 0x2a0e0a);
      for (let k = 0; k < 8; k++) {
        const side = k < 4 ? -1 : 1, i = k % 4;
        const a = (-0.9 + i * 0.6) * (side < 0 ? -1 : 1) + (side < 0 ? Math.PI : 0);
        const kx = Math.cos(a) * 22 * scale * spread, ky = Math.sin(a) * 14 * scale * spread - 10 * scale;
        const fx2 = Math.cos(a) * radius * 0.75 * spread, fy2 = Math.sin(a) * radius * 0.5 * spread + 6;
        legs.lineBetween(0, 0, kx, ky).lineBetween(kx, ky, fx2, fy2);
      }
    };
    legs.setAlpha(0);
    s.tweens.add({ targets: body, y, duration: 260, ease: 'Bounce.easeOut' });
    s.tweens.add({ targets: thread, y: y - 120, duration: 260, ease: 'Bounce.easeOut' });
    const st = { spread: 0.3 };
    s.tweens.add({ targets: st, spread: 1, duration: 220, delay: 240, ease: 'Back.easeOut', onStart: () => legs.setAlpha(1), onUpdate: () => drawLegs(st.spread),
      onComplete: () => { this.shake(0.003, 90); this.ring(x, y + 6, radius, 0xff6a2a, 300, 2); } });
    // the web: radial threads and rings, then a strand to every caught rival
    s.time.delayedCall(420, () => {
      web.lineStyle(1.2, 0xf4f4f4, 0.85);
      for (let k = 0; k < 10; k++) { const a = (k / 10) * Math.PI * 2; web.lineBetween(0, 0, Math.cos(a) * radius, Math.sin(a) * radius * 0.6); }
      for (let r = radius * 0.25; r <= radius; r += radius * 0.25) web.strokeEllipse(0, 0, r * 2, r * 1.2);
      web.lineStyle(1.5, 0xffffff, 0.95);
      for (const c of caught) {
        web.lineBetween(0, 0, c.x - x, c.y - y);
        web.strokeCircle(c.x - x, c.y - y, 7).lineBetween(c.x - x - 7, c.y - y, c.x - x + 7, c.y - y).lineBetween(c.x - x, c.y - y - 7, c.x - x, c.y - y + 7);
      }
    });
    const fade = [body, legs, web, thread];
    s.tweens.add({ targets: fade, alpha: 0, duration: 300, delay: ms, onComplete: () => fade.forEach((o) => o.destroy()) });
  }

  /** Telaraña: a web on the ground, self-destroying */
  spiderWeb(x: number, y: number, radius: number) {
    const web = this.scene.add.graphics().setDepth(8790).setPosition(x, y).lineStyle(1.2, 0xf4f4f4, 0.85);
    for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; web.lineBetween(0, 0, Math.cos(a) * radius, Math.sin(a) * radius * 0.6); }
    for (let r = radius * 0.3; r <= radius; r += radius * 0.35) web.strokeEllipse(0, 0, r * 2, r * 1.2);
    web.setScale(0.3);
    this.scene.tweens.add({ targets: web, scale: 1, duration: 160, ease: 'Back.easeOut' });
    this.scene.tweens.add({ targets: web, alpha: 0, duration: 300, delay: 700, onComplete: () => web.destroy() });
  }

  /**
   * Mordisco de serpiente: a serpent body rises from the ground at the keeper, its head lunges at the target and the
   * jaws snap shut. Self-destroying.
   */
  serpentBite(x0: number, y0: number, x1: number, y1: number, level: number, big = false) {
    const s = this.scene;
    const scale = (1 + level * 0.05) * (big ? 1.3 : 1);
    const body = s.add.graphics().setDepth(8800);
    const head = s.add.graphics().setDepth(8805).setPosition(x0, y0);
    const ang = Math.atan2(y1 - y0, x1 - x0);
    const draw = (t: number) => {
      body.clear();
      const hx = x0 + (x1 - x0) * t, hy = y0 + (y1 - y0) * t;
      for (let k = 0; k <= 14; k++) {
        const u = k / 14;
        const px = x0 + (hx - x0) * u - Math.sin(ang) * Math.sin(u * Math.PI * 2.5 + t * 6) * 10 * scale * (1 - u);
        const py = y0 + (hy - y0) * u + Math.cos(ang) * Math.sin(u * Math.PI * 2.5 + t * 6) * 10 * scale * (1 - u) - Math.sin(u * Math.PI) * 18;
        const w = (4 + 5 * u) * scale;
        body.fillStyle(k % 2 ? 0x3f7a2a : 0x8fb83a).fillCircle(px, py, w);
      }
      head.setPosition(hx, hy - 0);
    };
    const drawHead = (open: number) => {
      head.clear().setRotation(ang);
      head.fillStyle(0x4f8f2f).fillTriangle(0, -8 * scale - open, 22 * scale, -2 * scale - open, 0, 0 - open);
      head.fillStyle(0x3f7a2a).fillTriangle(0, 8 * scale + open, 22 * scale, 2 * scale + open, 0, 0 + open);
      head.fillStyle(0xfff6e0).fillTriangle(16 * scale, -2 * scale - open, 19 * scale, -2 * scale - open, 17 * scale, 5 * scale - open)
        .fillTriangle(16 * scale, 2 * scale + open, 19 * scale, 2 * scale + open, 17 * scale, -5 * scale + open);
      head.fillStyle(0xffe22a).fillCircle(6 * scale, -5 * scale - open, 2 * scale);
    };
    const st = { t: 0, open: 10 * scale };
    drawHead(st.open); draw(0);
    s.tweens.add({ targets: st, t: 1, duration: 240, ease: 'Quad.easeIn', onUpdate: () => draw(st.t),
      onComplete: () => s.tweens.add({ targets: st, open: 0, duration: 70, onUpdate: () => drawHead(st.open), onComplete: () => {
        this.burst('bosque', x1, y1, 10 + level, 50, true);
        this.ring(x1, y1, 22 + level * 2, 0x8fff3a, 320, 2);
        this.shake(0.003, 80);
      } }) });
    s.tweens.add({ targets: [body, head], alpha: 0, duration: 260, delay: 560, onComplete: () => { body.destroy(); head.destroy(); } });
  }

  blackHole(x: number, y: number, radius: number, level: number, ms: number, big = false) {
    if (!this.free(4)) return;
    const r = radius * (big ? 0.62 : 0.5);
    const glow = this.scene.add.circle(x, y, r * 1.7, 0x6a1aff, 0.22).setBlendMode(Phaser.BlendModes.ADD).setDepth(8790).setScale(0.2);
    const disc = this.scene.add.graphics().setDepth(8795).setPosition(x, y);
    for (let i = 0; i < 3; i++) {
      disc.lineStyle(3 - i, [0xc79bff, 0x8a3aff, 0xff4fd8][i], 0.9 - i * 0.2);
      disc.strokeEllipse(0, 0, r * (2.3 + i * 0.35), r * (0.9 + i * 0.16));
    }
    disc.setScale(0.2).setAlpha(0);
    const core = this.scene.add.circle(x, y, r, 0x05000c, 1).setStrokeStyle(2, 0xb36bff).setDepth(8800).setScale(0.1);
    this.live += 3;
    const open = ms * 0.25, hold = ms * 0.5, close = ms * 0.25;
    this.scene.tweens.add({ targets: [glow, core], scale: 1, duration: open, ease: 'Back.easeOut' });
    this.scene.tweens.add({ targets: disc, scale: 1, alpha: 1, duration: open, ease: 'Cubic.easeOut' });
    this.scene.tweens.add({ targets: disc, angle: big ? 540 : 360, duration: ms, ease: 'Sine.easeIn' });
    this.scene.tweens.add({ targets: glow, alpha: 0.4, duration: hold / 3, yoyo: true, repeat: 1, delay: open });
    // the swirl: sparks spiral into the hole while it is open
    const n = Math.round((14 + level * 2 + (big ? 10 : 0)) * this.density());
    for (let i = 0; i < n && this.free(1); i++) {
      const a = (i / n) * Math.PI * 2, d = radius * (0.9 + Math.random() * 0.5);
      const p = this.scene.add.image(x + Math.cos(a) * d, y + Math.sin(a) * d * 0.55, 'fx:spark')
        .setTint(i % 3 ? 0x9a5aff : 0xff6ad8).setBlendMode(Phaser.BlendModes.ADD).setDepth(8798);
      const t = { k: 0 };
      this.live++;
      this.scene.tweens.add({ targets: t, k: 1, delay: open * 0.5 + Math.random() * hold * 0.4, duration: hold * 0.8, ease: 'Cubic.easeIn',
        onUpdate: () => { const aa = a + t.k * 4, dd = d * (1 - t.k); p.setPosition(x + Math.cos(aa) * dd, y + Math.sin(aa) * dd * 0.55).setScale(1 - t.k * 0.7); },
        onComplete: () => { p.destroy(); this.live--; } });
    }
    // it closes on itself with a last flash
    this.scene.tweens.add({ targets: [glow, disc, core], scale: 0, delay: open + hold, duration: close, ease: 'Back.easeIn',
      onComplete: () => { glow.destroy(); disc.destroy(); core.destroy(); this.live -= 3; } });
    this.scene.time.delayedCall(open + hold + close, () => {
      this.flashDisc(x, y, r * 0.6, 0xe0c8ff, 140);
      this.ring(x, y, r * 1.2, 0x8a3aff, 260, 2);
    });
  }

  /**
   * Tormenta de fuego (and other fire storms): ground ring -> flames gathering -> rising fire whirl around the player.
   * The ball, its trail and the explosion come after, from the shot itself.
   */
  fireStorm(x: number, y: number, level: number, ms: number, big = false) {
    this.groundRing(x, y + 6, 26 + level * 2, 0xff6a2a, ms);
    this.gather(x, y - 10, 0xff6a2a, 0xffe24a, 12 + level + (big ? 8 : 0), 50 + level * 2, ms * 0.6);
    this.scene.time.delayedCall(ms * 0.35, () => {
      this.tornado(x, y + 6, 'fuego', level + (big ? 3 : 0), ms * 0.7);
      if (!this.free(6)) return;
      for (let i = 0; i < 6; i++) { // flame tongues spiralling up
        const a = (i / 6) * Math.PI * 2;
        const f = this.scene.add.image(x + Math.cos(a) * 18, y + 4, 'fx:flame').setScale(2).setTint(i % 2 ? 0xff6a2a : 0xffe24a).setBlendMode(Phaser.BlendModes.ADD).setDepth(y + 1);
        this.deco(f, { x: x + Math.cos(a + 2) * 6, y: y - 44 - level * 2, scale: 0.6, alpha: 0, duration: ms * 0.65, ease: 'Sine.easeIn' });
      }
    });
  }

  /** Serpentine body behind a dragon shot. */
  segment(x: number, y: number, color: number, size: number) {
    if (this.density() === 0) return;
    const c = this.scene.add.circle(x, y, size, color, 0.8).setDepth(8890).setBlendMode(Phaser.BlendModes.ADD);
    this.scene.tweens.add({ targets: c, radius: size * 0.2, alpha: 0, duration: 260, onComplete: () => c.destroy() });
  }

  /**
   * 1.93 (author: juiced): three sizes — normal (white), big or critical (gold or orange, «!»), huge (red, bigger, a little
   * shake) — each popping in and arcing up; every hit also feeds the combo meter. Heals are green and don't count.
   */
  damageNumber(x: number, y: number, value: number, big = false, heal = false) {
    if (!heal) this.combo.add(value, big);
    if (!this.settings.damageNumbers) return;
    const t = this.numbers[this.numberIdx++ % this.numbers.length];
    this.scene.tweens.killTweensOf(t);
    const v = Math.round(value);
    if (!heal) this.avgHit = this.avgHit ? this.avgHit + (v - this.avgHit) * 0.02 : v;
    const tier = heal ? 0 : v >= Math.max(300, this.avgHit * 6) ? 2 : big || v >= Math.max(40, this.avgHit * 2.5) ? 1 : 0;
    const color = heal ? '#7dff9a' : tier === 2 ? '#ff4f6a' : tier === 1 ? (v >= 40 ? '#ffe24a' : '#ff9a3a') : '#ffffff';
    const size = [1, 1.35, 1.8][tier];
    const dx = Phaser.Math.Between(-4, 4) + (tier ? Phaser.Math.Between(-10, 10) : 0);
    t.setText(heal ? `+${v}` : tier ? `${v}!` : String(v)).setPosition(x + Phaser.Math.Between(-4, 4), y).setVisible(true).setAlpha(1)
      .setColor(color).setScale(size * (tier ? 1.5 : 1.25)).setAngle(tier ? Phaser.Math.Between(-10, 10) : 0).setDepth(9500 + tier);
    if (tier === 2 && this.settings.shake) this.scene.cameras.main.shake(70, 0.0015);
    this.scene.tweens.add({ targets: t, scale: size, angle: 0, duration: tier ? 180 : 110, ease: 'Back.easeOut' });
    this.scene.tweens.add({ targets: t, x: t.x + dx, y: y - [16, 26, 34][tier], duration: [520, 700, 820][tier], ease: 'Cubic.easeOut' });
    this.scene.tweens.add({ targets: t, alpha: 0, delay: [300, 460, 560][tier], duration: 260, onComplete: () => t.setVisible(false) });
  }

}
