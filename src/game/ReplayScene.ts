/**
 * 2.02: watching a recorded run (replay.ts). Nothing is simulated: the team and the rivals near the captain are drawn
 * where the recording says, interpolated between samples, and the techniques are drawn again from the shot events.
 * Time, speed and seeking are driven by the app's controls (play/pause, ×1/×2/×4, the timeline).
 */
import Phaser from 'phaser';
import type { Manifest, RosterEntry, UnitInfo } from '../data/manifest';
import type { Settings } from '../systems/save';
import { Arena } from './MapBuilder';
import { Footballer, bodyKey, headKey } from './Footballer';
import { skinnedTexture } from './skin';
import { directionFromVector, frameAt } from './rig';
import { Fx } from './fx';
import { drawShot } from './shotReplay';
import { frameAtTime, spawnOf, type Replay, type ReplayEvent, type SpawnInfo } from './replay';
import { mapTextureKeys, swapRunTextures } from './runTextures';

export interface ReplayTick { t: number; duration: number; hp: number; max: number; playing: boolean; speed: number }
export interface ReplayInit {
  manifest: Manifest; replay: Replay; roster: Map<number, RosterEntry>; settings: Settings;
  /** every frame: where the playback is */
  onTick(s: ReplayTick): void;
  /** an event the playback just went past (the app writes it in the log / as a banner) */
  onEvent(t: number, e: ReplayEvent): void;
}

const TINT: Record<string, number> = { elite: 0xffe08a, runner: 0xb8f0ff, shooter: 0xffa8c8, flanker: 0xb8ffb0, bomber: 0xff9050, tank: 0x8f9fd0 };
/** events are only drawn at these speeds or slower (at ×8 the screen would be all charges) */
const FX_MAX_SPEED = 4;

interface Rival { sprite: Phaser.GameObjects.Sprite; unit: UnitInfo; anim: number; spawn: SpawnInfo }

export class ReplayScene extends Phaser.Scene {
  private cfg!: ReplayInit;
  private fx!: Fx;
  private t = 0;
  speed = 1;
  playing = true;
  private team = new Map<number, Footballer>();
  private rivals = new Map<number, Rival>();
  private spawnsById = new Map<number, SpawnInfo[]>();
  private units = new Map<number, UnitInfo>();
  private focus!: Phaser.GameObjects.Zone;
  /** next event / kill index to fire while playing forward */
  /** rivals already knocked out (by id, with the spawn they belonged to): the next samples still list them for a moment */
  private gone = new Map<number, SpawnInfo>();
  private evIdx = 0;
  private killIdx = 0;

  constructor() { super('Replay'); }

  init(data: ReplayInit) {
    this.cfg = data;
    this.t = 0; this.speed = 1; this.playing = true; this.evIdx = 0; this.killIdx = 0;
    this.team = new Map(); this.rivals = new Map(); this.spawnsById = new Map(); this.gone = new Map();
    for (const s of data.replay.spawns) {
      const l = this.spawnsById.get(s.id) ?? [];
      l.push(s);
      this.spawnsById.set(s.id, l);
    }
    this.units = new Map(data.manifest.units.map((u) => [u.id, u]));
  }

  private map() { return this.cfg.manifest.maps.find((m) => m.id === this.cfg.replay.header.map) ?? this.cfg.manifest.maps[0]; }
  private kit() { const k = this.cfg.replay.header.kit; return (k && this.cfg.manifest.kits?.[k]) || null; }
  private memberIds() { return [...new Set(this.cfg.replay.team.flatMap((f) => f.m.map((m) => m.id)))]; }

  preload() {
    const m = this.cfg.manifest, map = this.map();
    const sheet = (key: string, s: { texture: string; frameW: number; frameH: number }) => {
      if (!this.textures.exists(key)) this.load.spritesheet(key, s.texture, { frameWidth: s.frameW, frameHeight: s.frameH });
    };
    if (m.bodies.field) sheet(bodyKey('field'), m.bodies.field);
    if (m.bodies.gk) sheet(bodyKey('gk'), m.bodies.gk);
    const kit = this.kit();
    if (kit && m.bodies.field) {
      sheet(`kit:${kit.field}`, { ...m.bodies.field, texture: kit.field });
      if (kit.gk && m.bodies.gk) sheet(`kit:${kit.gk}`, { ...m.bodies.gk, texture: kit.gk });
    }
    for (const id of this.memberIds()) { const p = this.cfg.roster.get(id); if (p) sheet(headKey(p.id), p.head); }
    const rivals = [...new Set(this.cfg.replay.spawns.map((s) => s.unit))];
    swapRunTextures(this, [...mapTextureKeys(map), ...rivals.map((id) => `unit:${id}`)]); // 2.11: as in a run, the last arena goes
    for (const id of rivals) { const u = this.units.get(id); if (u) sheet(`unit:${id}`, u); }
    for (const t of Object.values(map.textures)) if (!this.textures.exists(t.key)) this.load.image(t.key, t.texture);
    if (map.baked) for (const f of [...map.baked.tiles, ...map.baked.props]) {
      const key = `bk:${map.id}:${f.src}`;
      if (!this.textures.exists(key)) this.load.image(key, map.baked.base + f.src);
    }
  }

  create() {
    const map = this.map();
    const arena = new Arena(this, map, this.cfg.settings.quality);
    arena.build();
    this.fx = new Fx(this, { ...this.cfg.settings });
    const first = this.cfg.replay.team[0]?.m[0] ?? { x: arena.widthPx / 2, y: arena.heightPx / 2 };
    this.focus = this.add.zone(first.x, first.y, 1, 1);
    const zoom = () => Math.max(1.5, Math.min(5, Math.round(Math.min(this.scale.height / 290, this.scale.width / 362) * 8) / 8));
    this.cameras.main.setBounds(0, 0, arena.widthPx, arena.heightPx).setZoom(zoom()).setBackgroundColor(map.ambience).startFollow(this.focus, true, 0.15, 0.15);
    const onResize = () => this.cameras.main?.setZoom(zoom());
    this.scale.on('resize', onResize);
    this.events.once('shutdown', () => this.scale.off('resize', onResize));
    this.draw(0);
  }

  /** jumps to a moment (no effects for what is skipped) */
  seek(t: number) {
    this.t = Phaser.Math.Clamp(t, 0, this.cfg.replay.duration);
    this.gone.clear();
    this.evIdx = this.cfg.replay.events.findIndex((x) => x.t > this.t); if (this.evIdx < 0) this.evIdx = this.cfg.replay.events.length;
    this.killIdx = this.cfg.replay.kills.findIndex((x) => x.t > this.t); if (this.killIdx < 0) this.killIdx = this.cfg.replay.kills.length;
    this.draw(0);
  }

  update(_t: number, dt: number) {
    const rp = this.cfg.replay;
    if (this.playing) {
      const was = this.t;
      this.t = Math.min(rp.duration, this.t + (dt / 1000) * this.speed);
      if (this.t >= rp.duration) this.playing = false;
      this.fire(was, this.t);
    }
    this.draw(this.playing ? dt * this.speed : 0);
    const tf = rp.team[Math.max(0, frameAtTime(rp.team, this.t))];
    this.cfg.onTick({ t: this.t, duration: rp.duration, hp: tf?.hp ?? 0, max: tf?.max ?? 1, playing: this.playing, speed: this.speed });
  }

  /** events and knock-outs between two moments of forward play */
  private fire(from: number, to: number) {
    const rp = this.cfg.replay, showFx = this.speed <= FX_MAX_SPEED;
    while (this.evIdx < rp.events.length && rp.events[this.evIdx].t <= to) {
      const { t, e } = rp.events[this.evIdx++];
      if (t < from - 0.5) continue;
      this.cfg.onEvent(t, e);
      if (!showFx) continue;
      if (e.k === 'shot') drawShot(this, this.fx, { name: e.n, element: e.e, power: e.p, rarity: e.r, x: e.x, y: e.y, tx: e.tx, ty: e.ty, lv: e.lv });
      else if (e.k === 'hurt') { const c = this.captain(); if (c) { c.flash(); this.fx.label(c.x, c.y - 30, `-${e.dmg}`, '#ff6a6a'); } }
      else if (e.k === 'boss') { const c = this.captain(); if (c) this.fx.ring(c.x, c.y - 10, 90, 0xff4f4f, 700, 4); }
    }
    while (this.killIdx < rp.kills.length && rp.kills[this.killIdx].t <= to) {
      const k = rp.kills[this.killIdx++], r = this.rivals.get(k.id);
      if (!r) continue;
      if (showFx) { this.fx.burst('energia', r.sprite.x, r.sprite.y - 10, 6, 50); this.fx.ring(r.sprite.x, r.sprite.y - 10, 12, 0xffffff, 180, 2); }
      this.dropRival(k.id, true);
    }
  }

  private captain() { const f = this.cfg.replay.team[Math.max(0, frameAtTime(this.cfg.replay.team, this.t))]; return f?.m[0] ? this.team.get(f.m[0].id) : undefined; }

  private makeMember(p: RosterEntry, x: number, y: number) {
    const m = this.cfg.manifest, kit = this.kit();
    const body = m.bodies[p.body] ?? m.bodies.field!;
    const keeper = p.body === 'gk' && !!kit?.gk, tex = kit ? (keeper ? kit.gk! : kit.field) : null;
    const base = tex && this.textures.exists(`kit:${tex}`) ? `kit:${tex}` : bodyKey(p.body);
    const fromSkin = tex && kit ? (keeper ? kit.gkSkin : kit.fieldSkin) : body.skin;
    return new Footballer(this, p, body, x, y, skinnedTexture(this, base, body, fromSkin, p.skin));
  }

  private draw(dtMs: number) {
    const rp = this.cfg.replay;
    // ---- team
    const i = frameAtTime(rp.team, this.t);
    const a = rp.team[Math.max(0, i)], b = rp.team[Math.min(rp.team.length - 1, i + 1)];
    if (a) {
      const k = b && b.t > a.t ? Phaser.Math.Clamp((this.t - a.t) / (b.t - a.t), 0, 1) : 0;
      const seen = new Set<number>();
      for (const m of a.m) {
        const n = b?.m.find((x) => x.id === m.id) ?? m;
        const x = m.x + (n.x - m.x) * k, y = m.y + (n.y - m.y) * k;
        let f = this.team.get(m.id);
        if (!f) {
          const p = this.cfg.roster.get(m.id);
          if (!p) continue;
          f = this.makeMember(p, x, y);
          this.team.set(m.id, f);
        }
        seen.add(m.id);
        const vx = n.x - m.x, vy = n.y - m.y, moving = Math.hypot(vx, vy) > 1.2;
        f.container.setPosition(x, y);
        if (moving) { f.setVelocity(vx, vy); f.pace = 1; } else f.idle(m.dir);
        f.update(dtMs);
      }
      for (const [id, f] of this.team) if (!seen.has(id)) { f.destroy(); this.team.delete(id); } // sent off / not yet signed
      if (a.m[0]) {
        const n = b?.m.find((x) => x.id === a.m[0].id) ?? a.m[0];
        this.focus.setPosition(a.m[0].x + (n.x - a.m[0].x) * k, a.m[0].y + (n.y - a.m[0].y) * k);
      }
    }
    // ---- rivals near the captain
    const j = frameAtTime(rp.rivals, this.t);
    const ra = rp.rivals[j], rb = rp.rivals[j + 1];
    const seen = new Set<number>();
    if (ra) {
      const k = rb && rb.t > ra.t ? Phaser.Math.Clamp((this.t - ra.t) / (rb.t - ra.t), 0, 1) : 0;
      const next = new Map((rb?.r ?? []).map((r) => [r.id, r]));
      for (const r of ra.r) {
        const n = next.get(r.id) ?? r;
        const x = r.x + (n.x - r.x) * k, y = r.y + (n.y - r.y) * k;
        let v = this.rivals.get(r.id);
        const sp = spawnOf(this.spawnsById, r.id, this.t);
        if (sp && this.gone.get(r.id) === sp) continue;
        if (v && sp && v.spawn !== sp) { this.dropRival(r.id, false); v = undefined; } // the id was reused
        if (!v) {
          const unit = sp && this.units.get(sp.unit);
          if (!sp || !unit || !this.textures.exists(`unit:${unit.id}`)) continue;
          const sprite = this.add.sprite(x, y, `unit:${unit.id}`, 0).setOrigin(unit.originX / unit.frameW, unit.originY / unit.frameH).setScale(sp.scale);
          if (TINT[sp.variant] !== undefined) sprite.setTint(TINT[sp.variant]);
          v = { sprite, unit, anim: Math.random() * 500, spawn: sp };
          this.rivals.set(r.id, v);
        }
        seen.add(r.id);
        v.sprite.setPosition(x, y).setDepth(y);
        v.anim += dtMs;
        const mv = Math.hypot(n.x - r.x, n.y - r.y) > 0.5, dir = mv ? directionFromVector(n.x - r.x, n.y - r.y, r.dir) : r.dir;
        const anim = v.unit.animations.find((an) => an.index === 8 + dir) ?? v.unit.animations.find((an) => an.index === dir);
        if (anim) { const { frame } = frameAt(anim.frames, v.anim); v.sprite.setFrame(frame.f).setFlipX(anim.mirror); }
      }
    }
    for (const id of [...this.rivals.keys()]) if (!seen.has(id)) this.dropRival(id, false);
  }

  private dropRival(id: number, knocked: boolean) {
    const v = this.rivals.get(id);
    if (!v) return;
    this.rivals.delete(id);
    if (knocked) this.gone.set(id, v.spawn);
    if (!knocked) { v.sprite.destroy(); return; }
    this.tweens.add({ targets: v.sprite, y: v.sprite.y - 10, angle: 70, alpha: 0, duration: 240, onComplete: () => v.sprite.destroy() });
  }
}
