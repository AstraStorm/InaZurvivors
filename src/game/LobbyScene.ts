/**
 * Sala de jugadores: every player of the ranking as their captain's overworld sprite, gathered on the Instituto Raimon
 * pitch with their name over the head. The own captain is walked with the run controls; the rest wander about.
 * The scene only says who is in focus (pointer over them, or near the own captain on touch screens) and where on the
 * screen: the card itself is HTML, drawn by the app.
 */
import Phaser from 'phaser';
import type { Manifest, RosterEntry } from '../data/manifest';
import type { Settings } from '../systems/save';
import { analogMove, heldKeys } from './controls';
import { Arena } from './MapBuilder';
import { mapTextureKeys, swapRunTextures } from './runTextures';
import { Footballer, bodyKey, headKey } from './Footballer';
import { skinnedTexture } from './skin';

export interface LobbyPlayer { key: string; name: string; captain: RosterEntry; me?: boolean }
export interface LobbyInit {
  manifest: Manifest; players: LobbyPlayer[]; kit?: NonNullable<Manifest['kits']>[string] | null;
  moveKeys: Settings['moveKeys']; touch: boolean;
  /** each frame: the player in focus (null = nobody), the screen point over their head and the screen y under their feet */
  onFocus: (key: string | null, x: number, y: number, feet: number) => void;
}

const SPEED = 110, WANDER = 55, NEAR = 56;
/** feet to the top of the head in the 40×44 overworld cell (anchor at 20,41, same as the menu previews) */
const HEAD = 42;

interface Walker { p: LobbyPlayer; f: Footballer; label: Phaser.GameObjects.Text; tx: number; ty: number; wait: number }

export class LobbyScene extends Phaser.Scene {
  private cfg!: LobbyInit;
  private arena!: Arena;
  private walkers: Walker[] = [];
  private me: Walker | null = null;
  private pitch = [0, 0, 0, 0];
  private pointerIn = false;

  constructor() { super('Lobby'); }

  init(data: LobbyInit) {
    this.cfg = data;
    this.walkers = [];
    this.me = null;
    this.pointerIn = false;
  }

  private map() { return this.cfg.manifest.maps.find((x) => x.id === 'raimon') ?? this.cfg.manifest.maps[0]; }

  preload() {
    const m = this.cfg.manifest, map = this.map();
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
    for (const p of this.cfg.players) sheet(headKey(p.captain.id), p.captain.head);
    swapRunTextures(this, mapTextureKeys(map)); // 2.11: as in the menu
    for (const t of Object.values(map.textures)) if (!this.textures.exists(t.key)) this.load.image(t.key, t.texture);
    if (map.baked) for (const f of [...map.baked.tiles, ...map.baked.props]) {
      const key = `bk:${map.id}:${f.src}`;
      if (!this.textures.exists(key)) this.load.image(key, map.baked.base + f.src);
    }
  }

  create() {
    const m = this.cfg.manifest, map = this.map();
    this.arena = new Arena(this, map);
    this.arena.build();
    const [px, py, pw, ph] = map.blueprint!.pitches[0];
    this.pitch = [px * 32, py * 32, pw * 32, ph * 32];
    const cx = (px + pw / 2) * 32, cy = (py + ph / 2) * 32;
    const others = this.cfg.players.filter((p) => !p.me);
    this.cfg.players.forEach((p) => {
      const body = m.bodies[p.captain.body] ?? m.bodies.field!;
      // only the own captain wears the equipped kit: the others' kits are not public, so they wear Raimon's
      const kit = p.me ? this.cfg.kit : null, keeper = p.captain.body === 'gk' && !!kit?.gk;
      const base = kit ? `kit:${keeper ? kit.gk! : kit.field}` : bodyKey(p.captain.body);
      const fromSkin = kit ? (keeper ? kit.gkSkin : kit.fieldSkin) : body.skin;
      // the others in rings round the centre spot, the own captain in the middle
      const i = others.indexOf(p), ring = Math.floor(Math.sqrt(i + 1)), a = i * 2.4;
      const x = p.me ? cx : this.clampX(cx + Math.cos(a) * (60 + ring * 44)), y = p.me ? cy : this.clampY(cy + Math.sin(a) * (40 + ring * 30));
      const f = new Footballer(this, p.captain, body, x, y, skinnedTexture(this, base, body, fromSkin, p.captain.skin));
      const label = this.add.text(x, y - HEAD, p.name, { fontFamily: '"Press Start 2P", monospace', fontSize: '8px', color: p.me ? '#ffe24a' : '#ffffff',
        stroke: '#000000', strokeThickness: 3, resolution: 2 }).setOrigin(0.5, 1).setDepth(9000);
      const w: Walker = { p, f, label, tx: x, ty: y, wait: 400 + Math.random() * 2000 };
      this.walkers.push(w);
      if (p.me) this.me = w;
    });
    const cam = this.cameras.main.setBounds(0, 0, this.arena.widthPx, this.arena.heightPx).setZoom(1.6).centerOn(cx, cy);
    if (this.me) cam.startFollow(this.me.f.container, true, 0.12, 0.12);
    this.input.on('gameover', () => { this.pointerIn = true; });
    this.input.on('gameout', () => { this.pointerIn = false; });
    this.events.once('shutdown', () => this.cfg.onFocus(null, 0, 0, 0));
  }

  private clampX(x: number) { return Phaser.Math.Clamp(x, this.pitch[0] + 48, this.pitch[0] + this.pitch[2] - 48); }
  private clampY(y: number) { return Phaser.Math.Clamp(y, this.pitch[1] + 48, this.pitch[1] + this.pitch[3] - 48); }

  private moveMe(w: Walker, dt: number) {
    const letters = this.cfg.moveKeys !== 'flechas', arrows = this.cfg.moveKeys !== 'wasd';
    const held = (a: string, b: string) => ((letters && heldKeys.has(a)) || (arrows && heldKeys.has(b)) ? 1 : 0);
    let dx = held('d', 'arrowright') - held('a', 'arrowleft');
    let dy = held('s', 'arrowdown') - held('w', 'arrowup');
    const [ax, ay] = analogMove();
    if (!dx && !dy) { dx = ax; dy = ay; }
    const len = Math.max(1, Math.hypot(dx, dy));
    dx /= len; dy /= len;
    const c = w.f.container, pos = { x: c.x, y: c.y }, s = SPEED * dt / 1000;
    this.arena.move(pos, dx * s, dy * s);
    c.setPosition(pos.x, pos.y);
    w.f.setVelocity(dx, dy);
    w.f.pace = Math.hypot(dx, dy);
  }

  private wander(w: Walker, dt: number) {
    w.wait -= dt;
    const dx = w.tx - w.f.x, dy = w.ty - w.f.y, d = Math.hypot(dx, dy);
    if (d < 3) {
      w.f.idle();
      if (w.wait <= 0) {
        const [x, y, pw, ph] = this.pitch;
        w.tx = this.clampX(x + Math.random() * pw);
        w.ty = this.clampY(y + Math.random() * ph);
        w.wait = 1200 + Math.random() * 3500;
      }
      return;
    }
    const s = Math.min(d, WANDER * dt / 1000), pos = { x: w.f.x, y: w.f.y };
    this.arena.move(pos, (dx / d) * s, (dy / d) * s);
    if (Math.hypot(pos.x - w.f.x, pos.y - w.f.y) < s * 0.3) { w.tx = w.f.x; w.ty = w.f.y; } // blocked: pick another spot
    w.f.container.setPosition(pos.x, pos.y);
    w.f.setVelocity(dx, dy);
  }

  /** pointer over someone (mouse only), or on touch screens the closest one within reach of the own captain */
  private focus(): Walker | null {
    const ptr = this.input.activePointer;
    if (!this.cfg.touch && this.pointerIn && !ptr.wasTouch) {
      const at = ptr.positionToCamera(this.cameras.main) as Phaser.Math.Vector2;
      let best: Walker | null = null, bd = Infinity;
      for (const w of this.walkers) {
        if (Math.abs(at.x - w.f.x) > 14 || at.y < w.f.y - HEAD - 12 || at.y > w.f.y + 4) continue;
        const d = Math.hypot(at.x - w.f.x, at.y - (w.f.y - HEAD / 2));
        if (d < bd) { bd = d; best = w; }
      }
      return best;
    }
    if (!this.cfg.touch || !this.me) return null;
    let best: Walker | null = null, bd = NEAR;
    for (const w of this.walkers) {
      if (w === this.me) continue;
      const d = Math.hypot(w.f.x - this.me.f.x, w.f.y - this.me.f.y);
      if (d < bd) { bd = d; best = w; }
    }
    return best;
  }

  update(_t: number, dt: number) {
    for (const w of this.walkers) {
      if (w === this.me) this.moveMe(w, dt); else this.wander(w, dt);
      w.f.update(dt);
      // names of those further down the pitch go in front; the own name always on top
      w.label.setPosition(Math.round(w.f.x), Math.round(w.f.y - HEAD)).setDepth(w === this.me ? 20000 : 9000 + w.f.y / 1000);
    }
    const f = this.focus(), cam = this.cameras.main;
    if (!f) { this.cfg.onFocus(null, 0, 0, 0); return; }
    this.cfg.onFocus(f.p.key, (f.f.x - cam.worldView.x) * cam.zoom, (f.f.y - HEAD - 10 - cam.worldView.y) * cam.zoom, (f.f.y + 8 - cam.worldView.y) * cam.zoom);
  }
}
