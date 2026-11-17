/**
 * 3.0 Piedra Alius: the 29 exclusive passives in a run. One engine, a few shared parts, and each passive a short rule on
 * top of them:
 *
 *   - events the arena already has: an attack fired (`onAttack`), a hit landed (`onHit` + `damageMult`), a rival knocked
 *     out (`onKill`), a hit on the team's shared health (`takenMult`, `absorb`, `afterHurt`) and the clock (`tick`);
 *   - shared effects: periodic timers, per-rival marks and stacks (stored on the rival, gone with it), slows with a total cap
 *     (lower for the control-immune: bosses and rival captains), a barrier, damage-taken reductions with a total cap,
 *     own-damage buffs, a decoy and a gravity field;
 *   - secondary hits (`host.strike`) never trigger passives again: no explosion makes another one, no echo echoes.
 *
 * Only the arena's own lists are read; rivals are scanned only when a timer fires (and the gravity field at 10 Hz while
 * it lasts), never every frame for every passive. Everything lives in this object: a new run builds a new one, so no state
 * survives the end of a run. Numbers: data/alius.ts ALIUS_PASSIVES (scaled by where the Alius is: pitch, Aura).
 */
import { ALIUS_CONFIG, ALIUS_PASSIVES, scaledParams, type AliusPassiveId } from '../data/alius';

export interface AlMarks {
  slows: Record<string, { mul: number; until: number }>;
  marks: Record<number, number>;
  stacks: Record<number, number>;
  cd: Record<number, number>;
  last: Record<number, number>;
  confused: number;
}
export interface AlEnemy {
  pos: { x: number; y: number }; hp: number; maxHp: number; kind: string; variant?: string; dead: boolean; rival?: boolean;
  knockX: number; knockY: number; radius: number; al?: AlMarks;
}
export interface AlMember { entry: { id: number }; f: { x: number; y: number } }

/** one passive in this run: the Alius it comes from, whose attacks and knock-outs drive it (himself, or his Aura carrier) */
export interface AliusSource { aliusId: number; passive: AliusPassiveId; owner: number; scale: number; via: 'campo' | 'aura' | 'banquillo' }
export interface AliusRunCfg {
  sources: AliusSource[];
  /** every Alius footballer of the run (pitch candidates and Auras): Lina and the Resonancia read it */
  aliusIds: number[];
  /** Lina Schiller Alius on the coach's bench: attack speed of the Alius on the pitch (0 = none) */
  linaSpeed: number;
  /** Resonancia Alius: exactly three Alius footballers equipped; their attacks deal this much more with one on the pitch */
  resonance: number;
}

export interface AliusHost<E extends AlEnemy, M extends AlMember> {
  runTime(): number;
  enemies(): readonly E[];
  members(): readonly M[];
  hp(): number; maxHp(): number;
  heal(amount: number): void;
  /** the member's basic attack damage (first active technique, his stats and the run's multipliers) */
  basic(m: M): number;
  /** a secondary hit: full hit rules (crits, numbers) but never passives again */
  strike(e: E, dmg: number, by: M, kx?: number, ky?: number): void;
  delay(ms: number, fn: () => void): void;
  fx: {
    ring(x: number, y: number, r: number, color: number, ms: number, w?: number): void;
    label(x: number, y: number, text: string, color: string): void;
    line(x0: number, y0: number, x1: number, y1: number, color: number, w: number): void;
    star(x0: number, y0: number, x1: number, y1: number, color: number, ms: number): void;
    illusion(m: M, ms: number): void;
  };
  rand(): number;
}

interface SrcState { src: AliusSource; idx: number; p: Record<string, number>; next: number; n: number; armed: boolean; until: number; cd: number; below: boolean; lost: number; target: AlEnemy | null }

const VIOLET = 0x9a4dff, CRIMSON = 0xd0103a, NAVY = 0x3a2a8a;
/** immune to control: they don't get pushed, pulled, confused or lured, and their slows are capped low */
export const controlImmune = (e: AlEnemy) => e.kind === 'boss' || !!e.rival;
const normalRival = (e: AlEnemy) => e.kind === 'enemy' && !e.rival;
const marksOf = (e: AlEnemy): AlMarks => (e.al ??= { slows: {}, marks: {}, stacks: {}, cd: {}, last: {}, confused: 0 });
const dist = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(a.x - b.x, a.y - b.y);

export class AliusEngine<E extends AlEnemy, M extends AlMember> {
  private st: SrcState[];
  private reductions: { key: string; until: number; reduce: number }[] = [];
  private barrier = 0;
  private decoy: { x: number; y: number; r: number; until: number } | null = null;
  private field: { x: number; y: number; r: number; pull: number; until: number } | null = null;
  private fieldAcc = 0;
  private aliusSet: Set<number>;
  /** proc counters for QA (window.__ies.alius) */
  readonly procs: Record<string, number> = {};

  constructor(private host: AliusHost<E, M>, private cfg: AliusRunCfg) {
    // the same passive never twice (an Alius and... himself as an Aura can't happen, but the cap is kept here as well)
    const seen = new Map<AliusPassiveId, AliusSource>();
    for (const s of cfg.sources) if (!seen.has(s.passive) || seen.get(s.passive)!.scale < s.scale) seen.set(s.passive, s);
    this.st = [...seen.values()].map((src, idx) => ({ src, idx, p: scaledParams(ALIUS_PASSIVES[src.passive], src.scale), next: -1, n: 0, armed: false, until: 0, cd: 0, below: false, lost: 0, target: null }));
    this.aliusSet = new Set(cfg.aliusIds);
  }

  get active() { return this.st.length > 0 || this.cfg.linaSpeed > 0 || this.cfg.resonance > 0; }
  private proc(id: string) { this.procs[id] = (this.procs[id] ?? 0) + 1; }
  private ownerOf(s: SrcState) { return this.host.members().find((m) => m.entry.id === s.src.owner) ?? null; }
  private mine(m: M) { return this.st.filter((s) => s.src.owner === m.entry.id); }
  private rt() { return this.host.runTime(); }

  // ------------------------------------------------------------- shared effects
  /** slows a rival by `mul` until `until` under `key` (the same key refreshes, never stacks with itself) */
  slow(e: E, key: string, mul: number, sec: number) {
    if (e.dead || mul <= 0) return;
    const a = marksOf(e);
    const until = this.rt() + sec;
    const cur = a.slows[key];
    a.slows[key] = { mul: Math.max(mul, cur && cur.until > this.rt() ? cur.mul : 0), until: Math.max(until, cur?.until ?? 0) };
  }
  /** the rival's speed factor from Alius slows (1 = none), capped: never frozen by Alius effects, bosses barely */
  speedMul(e: E): number {
    const a = e.al;
    if (!a) return 1;
    const rt = this.rt();
    let keep = 1;
    for (const [k, s] of Object.entries(a.slows)) { if (s.until <= rt) delete a.slows[k]; else keep *= 1 - s.mul; }
    const cap = controlImmune(e) ? ALIUS_CONFIG.maxBossSlow : ALIUS_CONFIG.maxSlow;
    return Math.max(1 - cap, keep);
  }
  confused(e: E) { return !controlImmune(e) && (e.al?.confused ?? 0) > this.rt(); }
  /** where a lured rival goes instead of the captain (Mil ilusiones), or null */
  lure(e: E): { x: number; y: number } | null {
    const d = this.decoy;
    if (!d || d.until <= this.rt() || controlImmune(e) || e.kind === 'miniboss') return null;
    return dist(e.pos, d) < d.r ? d : null;
  }
  private reduceFor(key: string, reduce: number, sec: number) {
    this.reductions = this.reductions.filter((r) => r.key !== key && r.until > this.rt()); // never stacks with itself
    this.reductions.push({ key, until: this.rt() + sec, reduce });
  }
  private nearest(from: { x: number; y: number }, range: number, ok: (e: E) => boolean = () => true): E | null {
    let best: E | null = null, bd = range;
    for (const e of this.host.enemies()) { if (e.dead || !ok(e)) continue; const d = dist(from, e.pos); if (d < bd) { bd = d; best = e; } }
    return best;
  }
  private around(c: { x: number; y: number }, r: number) { return this.host.enemies().filter((e) => !e.dead && dist(c, e.pos) < r + e.radius); }

  // ------------------------------------------------------------- events
  /** every frame (cheap: timers and the health thresholds; rivals only when something fires) */
  tick(dt: number) {
    if (!this.st.length) return;
    const rt = this.rt(), hpF = this.host.hp() / Math.max(1, this.host.maxHp());
    for (const s of this.st) {
      const m = this.ownerOf(s);
      if (!m) { s.next = -1; continue; } // not on the pitch (yet): nothing runs, and its timer starts when he comes in
      const p = s.p, id = s.src.passive;
      if ('every' in p) {
        if (s.next < 0) s.next = rt + p.every;
        else if (rt >= s.next) { s.next = rt + p.every; this.periodic(s, m); }
      }
      if (id === 'voluntad-eclipse' || id === 'mano-demoniaca') {
        if (hpF >= p.below) s.below = false;
        else if (!s.below && rt >= s.cd) {
          s.below = true; s.cd = rt + p.cd; this.proc(id);
          if (id === 'voluntad-eclipse') { s.until = rt + p.dur; this.host.fx.label(m.f.x, m.f.y - 40, 'VOLUNTAD DEL ECLIPSE', '#ff4d6d'); }
          else { this.reduceFor(id, p.reduce, p.dur); this.host.fx.ring(m.f.x, m.f.y - 10, 34, CRIMSON, 600, 4); this.host.fx.label(m.f.x, m.f.y - 40, 'MANO DEMONÍACA', '#ff4d6d'); }
        }
      }
    }
    // the gravity field pulls at 10 Hz while it lasts
    const g = this.field;
    if (g) {
      if (g.until <= rt) this.field = null;
      else if ((this.fieldAcc += dt) >= 100) {
        this.fieldAcc = 0;
        for (const e of this.around(g, g.r)) {
          if (!normalRival(e)) continue;
          const d = dist(e.pos, g) || 1;
          e.knockX += (g.x - e.pos.x) / d * g.pull * 0.6; e.knockY += (g.y - e.pos.y) / d * g.pull * 0.6;
        }
      }
    }
  }

  private periodic(s: SrcState, m: M) {
    const p = s.p, id = s.src.passive, rt = this.rt(), fx = this.host.fx, me = { x: m.f.x, y: m.f.y - 10 };
    this.proc(id);
    switch (id) {
      case 'ojo-huracan':
        fx.ring(me.x, me.y, p.radius, 0x8fd8ff, 420, 4);
        for (const e of this.around(me, p.radius)) {
          if (normalRival(e) || e.kind === 'miniboss') { const d = dist(e.pos, me) || 1, k = e.kind === 'miniboss' ? 0.3 : 1; e.knockX += (e.pos.x - me.x) / d * p.push * k; e.knockY += (e.pos.y - me.y) / d * p.push * k; }
          this.slow(e, id, p.slow, p.dur);
        }
        break;
      case 'rugido-abisal': {
        fx.ring(me.x, me.y, p.radius, 0x2fd0e0, 520, 5);
        const dmg = this.host.basic(m) * p.damage;
        for (const e of this.around(me, p.radius)) { this.slow(e, id, p.slow, p.dur); this.host.strike(e, dmg, m); }
        break;
      }
      case 'juicio-divino': {
        let best: E | null = null;
        for (const e of this.around(me, p.range)) if (!best || e.hp > best.hp) best = e;
        if (best) { marksOf(best).marks[s.idx] = rt + p.dur; fx.ring(best.pos.x, best.pos.y - 12, 20, 0xfff2a0, 700, 3); fx.label(best.pos.x, best.pos.y - 40, 'JUICIO', '#fff2a0'); }
        break;
      }
      case 'rosa-negra': case 'ojo-omnisciente': {
        const special = (e: E) => e.variant === 'elite' || e.kind === 'miniboss' || e.kind === 'boss' || !!e.rival;
        const t = id === 'rosa-negra' ? this.nearest(me, p.range, normalRival) : this.nearest(me, p.range, special) ?? this.nearest(me, p.range);
        if (t) { marksOf(t).marks[s.idx] = rt + p.dur; fx.ring(t.pos.x, t.pos.y - 12, 18, id === 'rosa-negra' ? CRIMSON : VIOLET, 700, 3); }
        break;
      }
      case 'eclipse-protector': this.reduceFor(id, p.reduce, p.dur); fx.ring(me.x, me.y, 40, 0xffc94a, 700, 4); break;
      case 'fortaleza-negra': this.reduceFor(id, p.reduce, p.dur); s.until = rt + p.dur; fx.ring(me.x, me.y, 36, NAVY, 700, 5); break;
      case 'mil-ilusiones': {
        const ms = Math.max(1, p.dur) * 1000;
        this.decoy = { x: m.f.x + (this.host.rand() < 0.5 ? -40 : 40), y: m.f.y, r: p.radius, until: rt + Math.max(1, p.dur) };
        fx.illusion(m, ms);
        break;
      }
      case 'gravedad-oscura': {
        const t = this.nearest(me, 200, normalRival);
        const c = t ? { x: t.pos.x, y: t.pos.y } : me;
        this.field = { x: c.x, y: c.y, r: p.radius, pull: p.pull, until: rt + p.dur };
        fx.ring(c.x, c.y, p.radius, 0x5a2a9a, p.dur * 1000, 6);
        break;
      }
      case 'eclipse-dorado': s.until = rt + p.dur; fx.ring(me.x, me.y, 30, 0xffd23f, 600, 4); fx.label(m.f.x, m.f.y - 40, 'ECLIPSE', '#ffd23f'); break;
      case 'mascara-fantasma': case 'supernova-negra': s.armed = true; break;
      case 'espejo-humeante': s.armed = true; fx.ring(me.x, me.y, 22, 0xb0b0c8, 500, 3); break;
      default: break;
    }
  }

  /** an attack of `m` really fired (one per cast, not per rival hit) */
  onAttack(m: M) {
    for (const s of this.mine(m)) {
      const p = s.p, id = s.src.passive;
      if (id !== 'colmillo-dragon' && id !== 'constelacion-negra') continue;
      if (++s.n % p.nth) continue;
      this.proc(id);
      const me = { x: m.f.x, y: m.f.y - 10 }, dmg = this.host.basic(m) * p.damage;
      if (id === 'colmillo-dragon') {
        const t = this.nearest(me, p.length);
        if (!t) continue;
        const ang = Math.atan2(t.pos.y - 10 - me.y, t.pos.x - me.x), x1 = me.x + Math.cos(ang) * p.length, y1 = me.y + Math.sin(ang) * p.length;
        this.host.fx.line(me.x, me.y, x1, y1, 0x6a1a9a, 10);
        const L = p.length;
        for (const e of [...this.host.enemies()]) {
          if (e.dead) continue;
          const rx = e.pos.x - me.x, ry = e.pos.y - 10 - me.y, along = rx * Math.cos(ang) + ry * Math.sin(ang), side = Math.abs(-rx * Math.sin(ang) + ry * Math.cos(ang));
          if (along >= 0 && along <= L && side <= p.width + e.radius) this.host.strike(e, dmg, m, Math.cos(ang) * 60, Math.sin(ang) * 60);
        }
      } else {
        const ts = [...this.host.enemies()].filter((e) => !e.dead && dist(e.pos, me) < p.range).sort((a, b) => dist(a.pos, me) - dist(b.pos, me)).slice(0, p.count);
        for (let i = 0; i < p.count && ts.length; i++) {
          const t = ts[i % ts.length];
          this.host.fx.star(me.x, me.y, t.pos.x, t.pos.y - 12, 0x7f9cff, 220);
          this.host.delay(220, () => { if (!t.dead) this.host.strike(t, dmg, m); });
        }
      }
    }
  }

  /** damage factor of a hit of `by` on `e` (before crits): his buffs, his marks on the rival, the Resonancia */
  damageMult(by: M | null, e: E): number {
    if (!by) return 1;
    let k = 1;
    const rt = this.rt();
    if (this.cfg.resonance > 0 && this.aliusSet.has(by.entry.id)) k *= 1 + this.cfg.resonance;
    for (const s of this.mine(by)) {
      const p = s.p, id = s.src.passive;
      if ((id === 'voluntad-eclipse' || id === 'devorador-almas') && s.until > rt) k *= 1 + p.damage;
      else if (id === 'corona-rota' && e.hp > e.maxHp * p.above) k *= 1 + p.damage;
      else if ((id === 'juicio-divino' || id === 'rosa-negra' || id === 'ojo-omnisciente') && (e.al?.marks[s.idx] ?? 0) > rt) k *= 1 + p.damage;
      else if (id === 'fortaleza-negra' && s.armed) { s.armed = false; k *= 1 + p.bonus; this.proc('fortaleza-negra:golpe'); }
    }
    return k;
  }

  /** a hit of `by` landed on `e` (primary hits only) */
  onHit(by: M, e: E, dmg: number) {
    const rt = this.rt();
    for (const s of this.mine(by)) {
      const p = s.p, id = s.src.passive;
      switch (id) {
        case 'aliento-boreal':
          if (++s.n % p.nth === 0) { this.proc(id); if (controlImmune(e)) this.slow(e, id, p.bossSlow, p.bossDur); else this.slow(e, id, p.slow, p.dur); }
          break;
        case 'fractura-obsidiana': {
          const a = marksOf(e);
          if ((a.cd[s.idx] ?? 0) > rt) break;
          a.stacks[s.idx] = (a.stacks[s.idx] ?? 0) + 1;
          if (a.stacks[s.idx] >= p.marks) {
            a.stacks[s.idx] = 0; a.cd[s.idx] = rt + p.cd; this.proc(id);
            this.host.fx.ring(e.pos.x, e.pos.y - 12, 16, 0x1a1a2a, 300, 4);
            this.host.strike(e, this.host.basic(by) * p.damage, by);
          }
          break;
        }
        case 'escarcha-eterna': {
          const a = marksOf(e);
          a.stacks[s.idx] = (a.stacks[s.idx] ?? 0) + 1;
          if (a.stacks[s.idx] >= p.stacks) { a.stacks[s.idx] = 0; this.proc(id); this.slow(e, id, controlImmune(e) ? p.bossSlow : p.slow, p.dur); this.host.fx.ring(e.pos.x, e.pos.y - 12, 14, 0xbfeaff, 300, 3); }
          break;
        }
        case 'cenizas-rey': case 'silencio-eterno': {
          const a = marksOf(e), life = id === 'cenizas-rey' ? p.dur : p.expire;
          if ((a.last[s.idx] ?? -99) + life < rt) a.stacks[s.idx] = 0;
          a.stacks[s.idx] = Math.min(p.stacks, (a.stacks[s.idx] ?? 0) + 1);
          a.last[s.idx] = rt;
          this.slow(e, id, p.slow * a.stacks[s.idx], life);
          break;
        }
        case 'mascara-fantasma':
          if (!s.armed) break;
          s.armed = false; this.proc(id);
          if (controlImmune(e)) this.slow(e, id, p.bossSlow, 2);
          else { marksOf(e).confused = rt + p.dur; this.host.fx.label(e.pos.x, e.pos.y - 34, '?', '#c79bff'); }
          break;
        case 'supernova-negra':
          if (!s.armed) break;
          s.armed = false; this.proc(id);
          this.host.fx.ring(e.pos.x, e.pos.y - 12, p.radius, 0x2a0a4a, 500, 8);
          this.host.fx.ring(e.pos.x, e.pos.y - 12, p.radius * 0.6, VIOLET, 400, 4);
          for (const x of this.around(e.pos, p.radius)) this.host.strike(x, this.host.basic(by) * p.damage, by);
          break;
        case 'eclipse-dorado':
          if (s.until > rt && this.host.rand() < p.chance) { this.proc(id); this.host.delay(90, () => { if (!e.dead) this.host.strike(e, dmg * p.damage, by); }); }
          break;
        case 'jaque-mate':
          if (s.target !== e) { s.target = e; s.n = 0; }
          if (++s.n >= p.nth && rt >= s.cd) {
            s.n = 0; s.cd = rt + p.cd; this.proc(id);
            this.host.fx.label(e.pos.x, e.pos.y - 40, 'JAQUE MATE', '#ffffff');
            this.host.strike(e, this.host.basic(by) * p.damage, by);
          }
          break;
        default: break;
      }
    }
  }

  /** `by` knocked `e` out with a primary hit */
  onKill(by: M, e: E) {
    const rt = this.rt();
    for (const s of this.mine(by)) {
      const p = s.p, id = s.src.passive;
      if (id === 'angel-caido' && rt >= s.cd) { s.cd = rt + p.cd; this.proc(id); this.host.heal(this.host.maxHp() * p.heal); }
      else if (id === 'explosion-destructora' && this.host.rand() < p.chance) {
        this.proc(id);
        const c = { x: e.pos.x, y: e.pos.y }, dmg = this.host.basic(by) * p.damage;
        this.host.fx.ring(c.x, c.y - 8, p.radius, 0xff4a2a, 380, 6);
        this.host.delay(60, () => { for (const x of this.around(c, p.radius)) this.host.strike(x, dmg, by); });
      } else if (id === 'devorador-almas' && ++s.n % p.kills === 0 && s.until <= rt) { // never refreshed while it lasts
        s.until = rt + p.dur; this.proc(id);
        this.host.fx.label(by.f.x, by.f.y - 40, 'DEVORADOR DE ALMAS', '#c79bff');
      }
    }
  }

  /** damage taken factor of the shared health (Alius reductions only, capped) */
  takenMult(): number {
    const rt = this.rt();
    let k = 1;
    for (const r of this.reductions) if (r.until > rt) k *= 1 - r.reduce;
    return Math.max(1 - ALIUS_CONFIG.maxTakenReduction, k);
  }
  /** the barrier takes what it can of a hit; returns what is left for the health */
  absorb(dmg: number): number {
    if (this.barrier <= 0) return dmg;
    const a = Math.min(this.barrier, dmg);
    this.barrier -= a;
    return dmg - a;
  }
  /** the shared health took `dmg` (after the barrier) */
  afterHurt(dmg: number) {
    const rt = this.rt();
    for (const s of this.st) {
      const m = this.ownerOf(s);
      if (!m) continue;
      const p = s.p, id = s.src.passive;
      if (id === 'muro-carmesi') {
        s.lost += dmg;
        if (s.lost >= this.host.maxHp() * p.loss && rt >= s.cd && this.barrier <= 0) {
          s.lost = 0; s.cd = rt + p.cd; this.proc(id);
          this.barrier = this.host.maxHp() * p.shield;
          this.host.fx.ring(m.f.x, m.f.y - 10, 32, CRIMSON, 700, 5);
          this.host.fx.label(m.f.x, m.f.y - 40, 'MURO CARMESÍ', '#ff4d6d');
        }
      } else if (id === 'espejo-humeante' && s.armed) {
        s.armed = false;
        const t = this.nearest({ x: m.f.x, y: m.f.y - 10 }, p.range);
        if (t) {
          this.proc(id);
          this.host.fx.star(m.f.x, m.f.y - 10, t.pos.x, t.pos.y - 12, 0xd8d8f0, 200);
          const dmg2 = this.host.basic(m) * p.damage;
          this.host.delay(200, () => { if (!t.dead) this.host.strike(t, dmg2, m); });
        }
      } else if (id === 'fortaleza-negra' && s.until > rt && !s.armed) { s.armed = true; this.proc('fortaleza-negra:carga'); }
    }
  }

  /** attack speed factor of a member (Lina, from the coach's bench, for the Alius on the pitch) */
  attackSpeed(m: M) { return this.cfg.linaSpeed > 0 && this.aliusSet.has(m.entry.id) ? 1 + this.cfg.linaSpeed : 1; }

  /** the Resonancia is on: three Alius footballers equipped and at least one on the pitch */
  resonanceOn() { return this.cfg.resonance > 0 && this.host.members().some((m) => this.aliusSet.has(m.entry.id)); }

  /** what the HUD shows: the team's Alius states with their time left */
  hud(): { label: string; left: number; total: number }[] {
    const rt = this.rt(), out: { label: string; left: number; total: number }[] = [];
    if (this.resonanceOn()) out.push({ label: 'Resonancia Alius', left: 1, total: 1 });
    if (this.barrier > 0) out.push({ label: `Muro ${Math.round(this.barrier)}`, left: 1, total: 1 });
    for (const r of this.reductions) if (r.until > rt) out.push({ label: ALIUS_PASSIVES[r.key as AliusPassiveId]?.name ?? r.key, left: r.until - rt, total: 6 });
    for (const s of this.st) {
      const id = s.src.passive, p = s.p;
      if ((id === 'voluntad-eclipse' || id === 'devorador-almas' || id === 'eclipse-dorado') && s.until > rt) out.push({ label: ALIUS_PASSIVES[id].name, left: s.until - rt, total: p.dur });
      if ((id === 'espejo-humeante' || id === 'fortaleza-negra') && s.armed) out.push({ label: id === 'espejo-humeante' ? 'Espejo' : 'Fortaleza', left: 1, total: 1 });
    }
    return out;
  }
}
