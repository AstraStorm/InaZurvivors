/**
 * Living main-menu background: the rebuilt Instituto Raimon arena with the player's footballers jogging around the
 * pitch while the camera pans slowly. Purely decorative (no gameplay).
 */
import Phaser from 'phaser';
import type { Manifest, RosterEntry } from '../data/manifest';
import { Arena } from './MapBuilder';
import { Footballer, bodyKey, headKey } from './Footballer';
import { skinnedTexture } from './skin';

/** `kit`: the equipped kit's body sheets; absent = Raimon */
export interface MenuInit { manifest: Manifest; players: RosterEntry[]; kit?: NonNullable<Manifest['kits']>[string] | null }

export class MenuScene extends Phaser.Scene {
  private cfg!: MenuInit;
  private walkers: { f: Footballer; tx: number; ty: number; wait: number }[] = [];
  private arena!: Arena;
  private t = 0;

  constructor() { super('Menu'); }

  init(data: MenuInit) {
    this.cfg = data;
    this.walkers = [];
    this.t = 0;
  }

  preload() {
    const m = this.cfg.manifest;
    const map = m.maps.find((x) => x.id === 'raimon') ?? m.maps[0];
    const sheet = (key: string, s: { texture: string; frameW: number; frameH: number }) => {
      if (!this.textures.exists(key)) this.load.spritesheet(key, s.texture, { frameWidth: s.frameW, frameHeight: s.frameH });
    };
    if (m.bodies.field) sheet(bodyKey('field'), m.bodies.field);
    if (m.bodies.gk) sheet(bodyKey('gk'), m.bodies.gk);
    const kit = this.cfg.kit;
    if (kit && m.bodies.field) {
      sheet(`kit:${kit.field}`, { ...m.bodies.field, texture: kit.field });
      if (kit.gk && m.bodies.gk) sheet(`kit:${kit.gk}`, { ...m.bodies.gk, texture: kit.gk });
    }
    for (const p of this.cfg.players) sheet(headKey(p.id), p.head);
    for (const t of Object.values(map.textures)) if (!this.textures.exists(t.key)) this.load.image(t.key, t.texture);
    if (map.baked) for (const f of [...map.baked.tiles, ...map.baked.props]) {
      const key = `bk:${map.id}:${f.src}`;
      if (!this.textures.exists(key)) this.load.image(key, map.baked.base + f.src);
    }
  }

  create() {
    const m = this.cfg.manifest;
    const map = m.maps.find((x) => x.id === 'raimon') ?? m.maps[0];
    this.arena = new Arena(this, map);
    this.arena.build();
    const pitch = map.blueprint!.pitches[0];
    const cx = (pitch[0] + pitch[2] / 2) * 32, cy = (pitch[1] + pitch[3] / 2) * 32;
    this.cameras.main.setBounds(0, 0, this.arena.widthPx, this.arena.heightPx).setZoom(1.25).centerOn(cx, cy);
    this.cfg.players.slice(0, 8).forEach((p, i) => {
      const body = m.bodies[p.body] ?? m.bodies.field!;
      // same rule as in a run: the squad wears the equipped kit (keepers its keeper kit when there is one)
      const kit = this.cfg.kit, keeper = p.body === 'gk' && !!kit?.gk;
      const base = kit ? `kit:${keeper ? kit.gk! : kit.field}` : bodyKey(p.body);
      const fromSkin = kit ? (keeper ? kit.gkSkin : kit.fieldSkin) : body.skin;
      const f = new Footballer(this, p, body, cx + (i - 3.5) * 26, cy + ((i % 2) * 2 - 1) * 20, skinnedTexture(this, base, body, fromSkin, p.skin));
      this.walkers.push({ f, tx: f.x, ty: f.y, wait: i * 300 });
    });
  }

  update(_t: number, dt: number) {
    this.t += dt;
    const map = this.cfg.manifest.maps.find((x) => x.id === 'raimon') ?? this.cfg.manifest.maps[0];
    const [px, py, pw, ph] = map.blueprint!.pitches[0];
    // slow figure-eight pan over the pitch
    const cx = (px + pw / 2) * 32 + Math.sin(this.t / 14000) * pw * 11;
    const cy = (py + ph / 2) * 32 + Math.sin(this.t / 7000) * ph * 9;
    this.cameras.main.centerOn(cx, cy);
    for (const w of this.walkers) {
      w.wait -= dt;
      const dx = w.tx - w.f.x, dy = w.ty - w.f.y, d = Math.hypot(dx, dy);
      if (d < 3) {
        w.f.idle();
        if (w.wait <= 0) {
          w.tx = (px + 3 + Math.random() * (pw - 6)) * 32;
          w.ty = (py + 3 + Math.random() * (ph - 6)) * 32;
          w.wait = 600 + Math.random() * 1800;
        }
      } else {
        const s = Math.min(d, 70 * dt / 1000);
        w.f.container.x += (dx / d) * s;
        w.f.container.y += (dy / d) * s;
        w.f.setVelocity(dx, dy);
      }
      w.f.update(dt);
    }
  }
}
