/**
 * pre-2.0: a co-op run for two (CoopLink, src/online/coop.ts). Each player simulates HIS OWN team (movement, techniques,
 * damage with his own upgrades, his own health); the host owns the world: rivals, drops, the shared XP bar, the boss and
 * the end. The guest draws the host's rivals from snapshots and sends his hits; each one sees the other's team as ghosts.
 *
 *   state channel (unordered): team snapshots both ways (JSON) and the host's rival snapshot (binary, 8 bytes a rival)
 *   event channel (reliable):  spawn / kill / drop / gone / gift / xp / lvl / resume / eshot / hazard / shock / end (host)
 *                              hit / take / picked (guest) and fx / ult / down / up (both)
 */
import { tr } from '../i18n/i18n';
import type Phaser from 'phaser';
import type { CoopLink, CoopMsg } from '../online/coop';
import type { Manifest, RosterEntry } from '../data/manifest';
import type { FxStyle } from './fx';
import type { Footballer } from './Footballer';

export type CoopRole = 'host' | 'guest';
export interface CoopRun {
  role: CoopRole;
  link: CoopLink;
  partner: { name: string; team: RosterEntry[]; kit: NonNullable<Manifest['kits']>[string] | null };
}

/** what ArenaScene opens to the co-op session (closures over its own fields) */
export interface CoopPort {
  scene: Phaser.Scene;
  runTime(): number;
  captain(): { x: number; y: number };
  team(): { id: number; x: number; y: number; vx: number; vy: number; dir: number }[];
  hp(): { hp: number; max: number };
  isDown(): boolean;
  setDown(down: boolean): void;
  /** rivals by id (host: its own; guest: the mirrored ones) */
  enemy(id: number): { id?: number; pos: { x: number; y: number }; hp: number; maxHp: number; dead: boolean; dir: number; sprite: Phaser.GameObjects.Sprite } | undefined;
  enemies(): { id?: number; pos: { x: number; y: number }; hp: number; maxHp: number; dead: boolean; dir: number }[];
  /** guest: a rival the host spawned */
  spawnMirror(m: SpawnMsg): void;
  /** guest: the host's knock-out of a rival (visual only); host: the guest's hit on one of its rivals */
  killMirror(id: number, style: FxStyle): void;
  hitFromPartner(id: number, v: number, kx: number, ky: number, style: FxStyle): void;
  dropMirror(m: DropMsg): void;
  removePickup(pid: number): { kind: 'xp' | 'item'; value: number; dropId?: string } | null;
  giftItem(dropId: string): void;
  gainSharedXp(v: number): void;
  setSharedXp(xp: number, level: number, kills: number): void;
  partnerLevelUp(level: number): void;
  resumeAfterCards(): void;
  enemyShot(x: number, y: number, vx: number, vy: number, damage: number, by: string): void;
  hazard(x: number, y: number, damage: number, by: string): void;
  shock(x: number, y: number, damage: number, color: number, by: string): void;
  makeGhost(entry: RosterEntry, x: number, y: number): Footballer;
  replayShot(m: FxMsg): void;
  end(victory: boolean): void;
  banner(text: string, color: string): void;
  telegraph(m: TeleMsg): void;
  /** 2.0: the partner fired his warrior spirit's ultimate (`at`: where his player stands now) */
  partnerUlt(spiritId: string, at: () => { x: number; y: number }): void;
  /** IDEA-45F61B95: the partner opened (true) or closed (false) his level-up cards */
  partnerPicking(on: boolean): void;
}

export interface SpawnMsg { id: number; u: number; k: string; s: number; v?: string; x: number; y: number; hp: number; dmg: number }
export interface DropMsg { pid: number; k: 'xp' | 'item'; v: number; tex?: string; d?: string; x: number; y: number }
export interface TeleMsg { k: string; x: number; y: number; dx: number; dy: number; s: number; c: number; dmg: number; by: string }
/** altar events that bring rivals of their own: only on the host's screen (he owns the rivals) */
export const COOP_HOST_ALTARS: ReadonlySet<string> = new Set(['fichaje', 'portal', 'supervivencia', 'duelo', 'minijefe']);
export interface FxMsg { name: string; element: string | null; power: number; rarity: string; x: number; y: number; tx: number; ty: number; lv: number }

const TEAM_MS = 66; // ~15 snapshots a second
const REVIVE_RADIUS = 36;
const REVIVE_SEC = 3;

interface Ghost { f: Footballer; tx: number; ty: number; vx: number; vy: number; seen: number }
/** what the partner shows of his run (IDEA-45F61B95): his Auras and his combined techniques */
export interface PartnerMeta { auras: { carrier: string; name: string; element: string | null }[]; combos: { name: string; level: number }[] }

export class CoopSession {
  readonly role: CoopRole;
  private teamAcc = 0;
  private enemyAcc = 0;
  private xpAcc = 0;
  private ghosts = new Map<number, Ghost>();
  /** the partner's captain (first ghost) and his state */
  partnerDown = false;
  partnerHp = { hp: 1, max: 1 };
  private reviveT = 0;
  /** how far the partner's own revive has got (0..1), from his snapshots */
  partnerRevive = 0;
  /** the partner is choosing his level-up card */
  partnerPicking = false;
  partnerMeta: PartnerMeta = { auras: [], combos: [] };
  private metaKey = '';
  /** the revive rings over a downed captain, drawn in the world */
  private reviveGfx: Phaser.GameObjects.Graphics | null = null;
  private reviveTxt: Phaser.GameObjects.Text | null = null;
  /** host: the partner has picked his level-up card */
  private partnerPicked = true;
  private resumeWait: (() => void) | null = null;
  /** guest: where each mirrored rival should be (smoothed towards) */
  readonly targets = new Map<number, { x: number; y: number; dir: number }>();
  private enc = new TextEncoder();
  private dec = new TextDecoder();
  private lost = false;

  constructor(private port: CoopPort, private run: CoopRun) {
    this.role = run.role;
    const link = run.link;
    link.onEvent = (m) => this.onEvent(m);
    link.onState = (d) => this.onState(d);
    link.onClose = (why) => {
      if (this.lost) return;
      this.lost = true;
      this.port.banner(tr('Tu compañero se ha desconectado ({why})', { why }), '#ff9a8a');
      // the host keeps playing alone; the guest's world was the host's: his run ends with what he has
      if (this.role === 'guest') this.port.end(false);
    };
  }

  get partnerName() { return this.run.partner.name; }
  get connected() { return !this.lost && this.run.link.open; }
  private send(m: CoopMsg) { if (!this.lost) this.run.link.send(m); }

  /** the partner's captain, for the rivals to chase (null when down or gone) */
  partnerCaptain(): { x: number; y: number } | null {
    return this.partnerDown ? null : this.partnerPos();
  }
  /** where the partner's captain is, down or not (minimap, revive ring) */
  partnerPos(): { x: number; y: number } | null {
    if (this.lost) return null;
    const g = this.ghosts.get(this.run.partner.team[0]?.id ?? -1) ?? [...this.ghosts.values()][0];
    return g ? { x: g.f.x, y: g.f.y } : null;
  }

  // ------------------------------------------------------------ every frame
  tick(dt: number) {
    if (this.lost) return;
    this.teamAcc += dt;
    if (this.teamAcc >= TEAM_MS) {
      this.teamAcc = 0;
      const { hp, max } = this.port.hp();
      const body = this.enc.encode(JSON.stringify({ m: this.port.team().map((t) => [t.id, Math.round(t.x), Math.round(t.y), Math.round(t.vx), Math.round(t.vy), t.dir]), hp: Math.round(hp), max: Math.round(max), down: this.port.isDown() ? 1 : 0, rv: +this.reviveProgress.toFixed(2) }));
      const buf = new Uint8Array(body.length + 1); buf[0] = 1; buf.set(body, 1);
      this.run.link.sendState(buf.buffer);
    }
    if (this.role === 'host') {
      this.enemyAcc += dt;
      if (this.enemyAcc >= TEAM_MS) { this.enemyAcc = 0; this.run.link.sendState(this.enemySnapshot()); }
      this.xpAcc += dt;
    }
    // ghosts glide to where the partner said they are
    const k = Math.min(1, dt / 90);
    for (const g of this.ghosts.values()) {
      g.f.container.x += (g.tx - g.f.container.x) * k;
      g.f.container.y += (g.ty - g.f.container.y) * k;
      if (Math.hypot(g.vx, g.vy) > 22) g.f.setVelocity(g.vx, g.vy); else g.f.idle();
      g.f.pace = Math.max(0.6, Math.min(1.8, Math.hypot(g.vx, g.vy) / 100));
      g.f.container.setDepth(g.f.container.y);
      g.f.update(dt);
    }
    // downed: the partner standing close for a few seconds lifts the captain back up
    if (this.port.isDown()) {
      const p = this.partnerCaptain(), c = this.port.captain();
      if (p && Math.hypot(p.x - c.x, p.y - c.y) < REVIVE_RADIUS) {
        this.reviveT += dt / 1000;
        if (this.reviveT >= REVIVE_SEC) { this.reviveT = 0; this.port.setDown(false); this.send({ t: 'up' }); this.port.banner(tr('¡Tu compañero te ha levantado!'), '#8fffa0'); }
      } else this.reviveT = Math.max(0, this.reviveT - dt / 2000);
    } else this.reviveT = 0;
    this.drawRevive();
  }

  /** IDEA-45F61B95: a ring over a downed captain that fills while he is being lifted, with the seconds left */
  private drawRevive() {
    const sc = this.port.scene;
    const at = this.port.isDown() ? { ...this.port.captain(), k: this.reviveProgress } : this.partnerDown ? (() => { const p = this.partnerPos(); return p ? { ...p, k: this.partnerRevive } : null; })() : null;
    if (!at) { this.reviveGfx?.setVisible(false); this.reviveTxt?.setVisible(false); return; }
    this.reviveGfx ??= sc.add.graphics().setDepth(9500);
    this.reviveTxt ??= sc.add.text(0, 0, '', { fontFamily: '"Press Start 2P", monospace', fontSize: '8px', color: '#ffffff', stroke: '#000000', strokeThickness: 3 }).setOrigin(0.5).setDepth(9501);
    const g = this.reviveGfx.setVisible(true).clear(), y = at.y - 44;
    g.lineStyle(2, 0x8fffa0, 0.35).strokeEllipse(at.x, at.y, REVIVE_RADIUS * 2, REVIVE_RADIUS * 1.5); // where to stand
    g.fillStyle(0x000000, 0.55).fillCircle(at.x, y, 13);
    g.lineStyle(4, 0x3a3a3a, 1).strokeCircle(at.x, y, 11);
    if (at.k > 0) { g.lineStyle(4, 0x8fffa0, 1).beginPath(); g.arc(at.x, y, 11, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(1, at.k)); g.strokePath(); }
    this.reviveTxt.setVisible(true).setPosition(at.x, y).setText(at.k > 0 ? (REVIVE_SEC * (1 - Math.min(1, at.k))).toFixed(1) : '✚');
  }

  /** IDEA-45F61B95: own Auras and combined techniques, sent again only when they change */
  meta(m: PartnerMeta) {
    const key = JSON.stringify(m);
    if (key === this.metaKey) return;
    this.metaKey = key;
    this.send({ t: 'meta', au: m.auras, cb: m.combos });
  }
  /** IDEA-45F61B95: this player opened (true) or closed (false) his level-up cards */
  picking(on: boolean) { this.send({ t: 'pick', on: on ? 1 : 0 }); }

  /** seconds of revive progress (HUD) */
  get reviveProgress() { return this.reviveT / REVIVE_SEC; }

  private enemySnapshot() {
    const list = this.port.enemies().filter((e) => !e.dead && e.id !== undefined);
    const buf = new ArrayBuffer(3 + list.length * 8), v = new DataView(buf);
    v.setUint8(0, 2); v.setUint16(1, list.length);
    list.forEach((e, i) => {
      const o = 3 + i * 8;
      v.setUint16(o, e.id! & 0xffff); v.setInt16(o + 2, Math.round(e.pos.x)); v.setInt16(o + 4, Math.round(e.pos.y));
      v.setUint8(o + 6, Math.max(0, Math.min(255, Math.round((e.hp / Math.max(1, e.maxHp)) * 255)))); v.setUint8(o + 7, e.dir & 0xff);
    });
    return buf;
  }

  // ------------------------------------------------------------ incoming
  private onState(d: ArrayBuffer) {
    const b = new Uint8Array(d);
    if (b[0] === 1) {
      const s = JSON.parse(this.dec.decode(b.subarray(1))) as { m: number[][]; hp: number; max: number; down: number; rv?: number };
      this.partnerHp = { hp: s.hp, max: s.max };
      this.partnerRevive = Number(s.rv ?? 0);
      const wasDown = this.partnerDown;
      this.partnerDown = !!s.down;
      if (this.partnerDown && !wasDown) this.port.banner(tr('¡{partnerName} ha caído! Ponte a su lado para levantarlo', { partnerName: this.partnerName }), '#ff9a8a');
      const now = this.port.runTime();
      for (const [id, x, y, vx, vy] of s.m) {
        let g = this.ghosts.get(id);
        if (!g) {
          const entry = this.run.partner.team.find((p) => p.id === id);
          if (!entry) continue;
          g = { f: this.port.makeGhost(entry, x, y), tx: x, ty: y, vx: 0, vy: 0, seen: now };
          this.ghosts.set(id, g);
        }
        g.tx = x; g.ty = y; g.vx = vx; g.vy = vy; g.seen = now;
      }
      for (const [id, g] of this.ghosts) if (!s.m.some((r) => r[0] === id)) { g.f.destroy(); this.ghosts.delete(id); } // sent off
    } else if (b[0] === 2 && this.role === 'guest') {
      const v = new DataView(d), n = v.getUint16(1);
      for (let i = 0; i < n; i++) {
        const o = 3 + i * 8, id = v.getUint16(o);
        this.targets.set(id, { x: v.getInt16(o + 2), y: v.getInt16(o + 4), dir: v.getUint8(o + 7) });
        const e = this.port.enemy(id);
        if (e) e.hp = Math.max(1, (v.getUint8(o + 6) / 255) * e.maxHp);
      }
    }
  }

  private onEvent(m: CoopMsg) {
    const p = this.port;
    switch (m.t) {
      // host -> guest
      case 'spawn': p.spawnMirror(m as unknown as SpawnMsg); break;
      case 'kill': p.killMirror(Number(m.id), m.st as FxStyle); this.targets.delete(Number(m.id)); break;
      case 'drop': p.dropMirror(m as unknown as DropMsg); break;
      case 'gone': p.removePickup(Number(m.pid)); break;
      case 'gift': p.giftItem(String(m.d)); break;
      case 'xp': p.setSharedXp(Number(m.xp), Number(m.lv), Number(m.k)); break;
      case 'lvl': p.partnerLevelUp(Number(m.lv)); break;
      case 'resume': p.resumeAfterCards(); break;
      case 'eshot': p.enemyShot(Number(m.x), Number(m.y), Number(m.vx), Number(m.vy), Number(m.dmg), String(m.by ?? '')); break;
      case 'hazard': p.hazard(Number(m.x), Number(m.y), Number(m.dmg), String(m.by ?? '')); break;
      case 'shock': p.shock(Number(m.x), Number(m.y), Number(m.dmg), Number(m.c), String(m.by ?? '')); break;
      case 'end': p.end(!!m.win); break;
      case 'tele': p.telegraph(m as unknown as TeleMsg); break;
      case 'say': p.banner(String(m.tx ?? ''), String(m.c ?? '#ffffff')); break;
      case 'askhz': if (this.role === 'host') p.hazard(Number(m.x), Number(m.y), -1, ''); break;
      // guest -> host
      case 'hit': p.hitFromPartner(Number(m.id), Number(m.v), Number(m.kx), Number(m.ky), m.st as FxStyle); break;
      case 'take': {
        const got = p.removePickup(Number(m.pid));
        if (!got) break;
        if (got.kind === 'xp') p.gainSharedXp(got.value);
        else if (got.dropId) this.send({ t: 'gift', d: got.dropId });
        break;
      }
      case 'addxp': p.gainSharedXp(Number(m.v)); break;
      case 'picked': this.partnerPicked = true; if (this.resumeWait) { const r = this.resumeWait; this.resumeWait = null; r(); } break;
      // both
      case 'fx': p.replayShot(m as unknown as FxMsg); break;
      case 'ult': {
        const id = Number(m.id), g = () => this.ghosts.get(id) ?? [...this.ghosts.values()][0];
        if (g()) p.partnerUlt(String(m.k ?? ''), () => { const x = g(); return x ? { x: x.f.x, y: x.f.y } : { x: 0, y: 0 }; });
        break;
      }
      case 'up': this.partnerDown = false; break;
      case 'pick': this.partnerPicking = !!m.on; p.partnerPicking(this.partnerPicking); break;
      case 'meta': this.partnerMeta = { auras: Array.isArray(m.au) ? (m.au as PartnerMeta['auras']).slice(0, 6) : [], combos: Array.isArray(m.cb) ? (m.cb as PartnerMeta['combos']).slice(0, 20) : [] }; break;
      default: break;
    }
  }

  // ------------------------------------------------------------ hooks from ArenaScene
  /** host: a rival was born */
  onSpawn(e: { id?: number; unit: { id: number }; kind: string; variant?: string; pos: { x: number; y: number }; maxHp: number; damage: number; sprite: { scale: number } }) {
    if (this.role === 'host') this.send({ t: 'spawn', id: e.id, u: e.unit.id, k: e.kind, s: +e.sprite.scale.toFixed(2), v: e.variant, x: Math.round(e.pos.x), y: Math.round(e.pos.y), hp: e.maxHp, dmg: e.damage });
  }
  onKill(id: number | undefined, style: FxStyle) { if (this.role === 'host' && id !== undefined) this.send({ t: 'kill', id, st: style }); }
  onDrop(m: DropMsg) { if (this.role === 'host') this.send({ ...m, t: 'drop' }); }
  onGone(pid: number | undefined) { if (this.role === 'host' && pid !== undefined) this.send({ t: 'gone', pid }); }
  /** guest: a pickup touched his captain */
  take(pid: number | undefined) { if (pid !== undefined) this.send({ t: 'take', pid }); }
  /** guest: his hit on a mirrored rival */
  hit(id: number | undefined, v: number, kx: number, ky: number, style: FxStyle) { if (id !== undefined) this.send({ t: 'hit', id, v: Math.round(v), kx: Math.round(kx), ky: Math.round(ky), st: style }); }
  shot(m: FxMsg) { this.send({ ...m, t: 'fx' }); }
  /** 2.0: this player's spirit ultimate (the partner sees the spirit appear over him) */
  ult(playerId: number, spiritId: string) { this.send({ t: 'ult', id: playerId, k: spiritId }); }
  /** guest: a ball for standing still, dropped by the host so both screens have it */
  askHazard(x: number, y: number) { if (this.role === 'guest') this.send({ t: 'askhz', x: Math.round(x), y: Math.round(y) }); }
  /** host: a banner meant for the partner (something the host started round him) */
  say(text: string, color: string) { if (this.role === 'host') this.send({ t: 'say', tx: text, c: color }); }
  /** host: a boss attack starts (the guest draws its warning) */
  telegraph(m: TeleMsg) { if (this.role === 'host') this.send({ ...m, t: 'tele' }); }
  /** guest: XP earned on his side (his own altars) goes to the shared bar */
  addXp(v: number) { if (this.role === 'guest' && v > 0) this.send({ t: 'addxp', v: Math.round(v) }); }
  enemyShot(x: number, y: number, vx: number, vy: number, dmg: number, by: string) { if (this.role === 'host') this.send({ t: 'eshot', x: Math.round(x), y: Math.round(y), vx: Math.round(vx), vy: Math.round(vy), dmg, by }); }
  hazard(x: number, y: number, dmg: number, by: string) { if (this.role === 'host') this.send({ t: 'hazard', x: Math.round(x), y: Math.round(y), dmg, by }); }
  shock(x: number, y: number, dmg: number, c: number, by: string) { if (this.role === 'host') this.send({ t: 'shock', x: Math.round(x), y: Math.round(y), dmg, c, by }); }
  /** host: shared XP changed (sent at most 4 times a second, and always on a level-up) */
  xp(xp: number, level: number, kills: number, force = false) {
    if (this.role !== 'host' || (!force && this.xpAcc < 250)) return;
    this.xpAcc = 0;
    this.send({ t: 'xp', xp: Math.floor(xp), lv: level, k: kills });
  }
  /** host: a level-up; both pick their cards, the run goes on once both have */
  levelUp(level: number) {
    if (this.role !== 'host' || this.lost) return;
    this.partnerPicked = false;
    this.send({ t: 'lvl', lv: level });
  }
  /** host: resolves once the partner has picked (or straight away if he is gone) */
  waitPartner(): Promise<void> {
    if (this.role !== 'host' || this.partnerPicked || this.lost) return Promise.resolve();
    this.port.banner(tr('Esperando a que {partnerName} elija…', { partnerName: this.partnerName }), '#8fe8ff');
    return new Promise((r) => {
      this.resumeWait = r;
      setTimeout(() => { if (this.resumeWait === r) { this.resumeWait = null; r(); } }, 20000); // never stuck on a partner who left
    });
  }
  resumeBoth() { if (this.role === 'host') this.send({ t: 'resume' }); }
  picked() { if (this.role === 'guest') this.send({ t: 'picked' }); }
  down() { /* the partner reads it from the team snapshot */ }
  /** host: the run ended for both */
  end(victory: boolean) { if (this.role === 'host') this.send({ t: 'end', win: victory }); }
  /** both down: the run is lost */
  bothDown() { return this.port.isDown() && (this.partnerDown || this.lost); }

  destroy() {
    this.reviveGfx?.destroy(); this.reviveTxt?.destroy(); this.reviveGfx = null; this.reviveTxt = null;
    if (this.partnerPicking) { this.partnerPicking = false; this.port.partnerPicking(false); }
    for (const g of this.ghosts.values()) g.f.destroy();
    this.ghosts.clear();
    // the run is over: the link goes back to the lobby (which sets its own handlers when it opens)
    this.lost = true;
    this.run.link.onEvent = () => {}; this.run.link.onState = () => {}; this.run.link.onClose = () => {};
  }
}
