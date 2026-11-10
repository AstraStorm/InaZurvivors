/**
 * 2.02: run replays (author: «ver cómo juega la gente»). The run records what is seen, not the inputs: the game is not
 * deterministic (Math.random, variable frame time), so positions are sampled and the viewer (ReplayScene) interpolates.
 *
 *   header   JSON (u32 length first): map, rank, kit, team, game version, start date
 *   records  u8 type + u32 run time in ms, then
 *     TEAM    every 150 ms: hp u16, max u16, n u8, n × (id i32, x i16, y i16, dir u8)
 *     RIVALS  every 250 ms, only those near the captain (the viewer follows him): n u16, n × (id u16, flags u8,
 *             x/y as i16 the first time or after a long jump, else i8 steps from the last sample; hp u8, dir u8)
 *     SPAWN   id u16, unit u16, kind u8, variant u8, scale ×100 u16
 *     KILL    id u16
 *     EVENT   u16 length + JSON (shots, cards, hits taken, boss, end): rare, so JSON is fine
 *
 * The whole file goes through gzip (CompressionStream): a 12-minute run is a few hundred KB.
 */

export const REPLAY_VERSION = 1;
const T_TEAM = 1, T_RIVALS = 2, T_SPAWN = 3, T_KILL = 4, T_EVENT = 5;
export const TEAM_MS = 150;
export const RIVALS_MS = 250;
/** rivals further than this from the captain are not recorded (outside any camera) */
const NEAR_X = 560, NEAR_Y = 380;
/** past this size the recording stops (a very long endless run): the end is kept, the middle is not */
const MAX_BYTES = 6_000_000;

const KINDS = ['normal', 'miniboss', 'boss', 'rival'] as const;
const VARIANTS = ['', 'elite', 'runner', 'shooter', 'flanker', 'bomber', 'tank'] as const;

export interface ReplayHeader {
  v: number; map: string; rank: string; kit: string | null; team: number[]; version: string; at: string;
  /** who played it (filled by the server listing, not by the recording) */
  user?: string;
}
export type ReplayEvent =
  | { k: 'shot'; n: string; e: string | null; p: number; r: string; x: number; y: number; tx: number; ty: number; lv: number }
  | { k: 'card'; lv: number; card: Record<string, unknown> }
  | { k: 'hurt'; by: string; atk: string; dmg: number }
  | { k: 'boss'; name: string }
  | { k: 'ult'; id: number; spirit: string }
  | { k: 'formation'; f: string }
  | { k: 'end'; win: boolean; kills: number; level: number };

export interface RecRival { id?: number; pos: { x: number; y: number }; hp: number; maxHp: number; dead: boolean; dir: number }
export interface RecMember { id: number; x: number; y: number; dir: number }

/** Growing byte buffer. */
class Out {
  buf = new Uint8Array(1 << 16);
  v = new DataView(this.buf.buffer);
  n = 0;
  private room(k: number) {
    if (this.n + k <= this.buf.length) return;
    let size = this.buf.length * 2;
    while (size < this.n + k) size *= 2;
    const b = new Uint8Array(size);
    b.set(this.buf.subarray(0, this.n));
    this.buf = b; this.v = new DataView(b.buffer);
  }
  u8(x: number) { this.room(1); this.v.setUint8(this.n, x); this.n += 1; }
  i8(x: number) { this.room(1); this.v.setInt8(this.n, x); this.n += 1; }
  u16(x: number) { this.room(2); this.v.setUint16(this.n, x); this.n += 2; }
  i16(x: number) { this.room(2); this.v.setInt16(this.n, x); this.n += 2; }
  u32(x: number) { this.room(4); this.v.setUint32(this.n, x); this.n += 4; }
  i32(x: number) { this.room(4); this.v.setInt32(this.n, x); this.n += 4; }
  bytes(b: Uint8Array) { this.room(b.length); this.buf.set(b, this.n); this.n += b.length; }
}

const clamp16 = (x: number) => Math.max(-32768, Math.min(32767, Math.round(x)));
const enc = new TextEncoder();

export class ReplayRecorder {
  private out = new Out();
  private teamAcc = TEAM_MS;
  private rivalAcc = RIVALS_MS;
  /** last recorded position of each rival (for the i8 steps) */
  private last = new Map<number, { x: number; y: number }>();
  full = false;

  constructor(header: ReplayHeader) {
    const h = enc.encode(JSON.stringify(header));
    this.out.u32(h.length);
    this.out.bytes(h);
  }

  get size() { return this.out.n; }

  private head(type: number, tSec: number) {
    if (this.out.n > MAX_BYTES) { this.full = true; return false; }
    this.out.u8(type); this.out.u32(Math.round(tSec * 1000));
    return true;
  }

  tick(dtMs: number, tSec: number, team: RecMember[], hp: number, maxHp: number, rivals: RecRival[]) {
    this.teamAcc += dtMs; this.rivalAcc += dtMs;
    if (this.teamAcc >= TEAM_MS) {
      this.teamAcc = 0;
      if (!this.head(T_TEAM, tSec)) return;
      const o = this.out;
      o.u16(Math.max(0, Math.min(65535, Math.round(hp)))); o.u16(Math.max(0, Math.min(65535, Math.round(maxHp))));
      o.u8(Math.min(255, team.length));
      for (const m of team.slice(0, 255)) { o.i32(m.id); o.i16(clamp16(m.x)); o.i16(clamp16(m.y)); o.u8(m.dir & 0xff); }
    }
    if (this.rivalAcc >= RIVALS_MS && team.length) {
      this.rivalAcc = 0;
      const cx = team[0].x, cy = team[0].y;
      const near = rivals.filter((e) => !e.dead && e.id !== undefined && Math.abs(e.pos.x - cx) < NEAR_X && Math.abs(e.pos.y - cy) < NEAR_Y)
        .sort((a, b) => a.id! - b.id!).slice(0, 400);
      if (!this.head(T_RIVALS, tSec)) return;
      const o = this.out, seen = new Set<number>();
      o.u16(near.length);
      for (const e of near) {
        const id = e.id! & 0xffff, x = Math.round(e.pos.x), y = Math.round(e.pos.y), was = this.last.get(id);
        seen.add(id);
        const dx = was ? x - was.x : 0, dy = was ? y - was.y : 0;
        const step = !!was && Math.abs(dx) <= 127 && Math.abs(dy) <= 127;
        o.u16(id); o.u8(step ? 0 : 1);
        if (step) { o.i8(dx); o.i8(dy); } else { o.i16(clamp16(x)); o.i16(clamp16(y)); }
        o.u8(Math.max(0, Math.min(255, Math.round((e.hp / Math.max(1, e.maxHp)) * 255)))); o.u8(e.dir & 0xff);
        this.last.set(id, { x, y });
      }
      // one that left the view starts again from a full position when it comes back
      for (const id of this.last.keys()) if (!seen.has(id)) this.last.delete(id);
    }
  }

  spawn(tSec: number, e: { id?: number; unit: { id: number }; kind: string; variant?: string; sprite: { scale: number } }) {
    if (e.id === undefined || !this.head(T_SPAWN, tSec)) return;
    const o = this.out;
    o.u16(e.id & 0xffff); o.u16(e.unit.id & 0xffff);
    o.u8(Math.max(0, KINDS.indexOf(e.kind as never))); o.u8(Math.max(0, VARIANTS.indexOf((e.variant ?? '') as never)));
    o.u16(Math.round(e.sprite.scale * 100));
  }

  kill(tSec: number, id: number | undefined) {
    if (id === undefined || !this.head(T_KILL, tSec)) return;
    this.out.u16(id & 0xffff);
  }

  event(tSec: number, ev: ReplayEvent) {
    const b = enc.encode(JSON.stringify(ev));
    if (b.length > 65535 || !this.head(T_EVENT, tSec)) return;
    this.out.u16(b.length); this.out.bytes(b);
  }

  /** the recording, gzipped */
  async finish(): Promise<Blob> {
    const raw = new Blob([this.out.buf.slice(0, this.out.n)]);
    if (typeof CompressionStream === 'undefined') return raw; // very old browsers: the viewer reads both
    return new Response(raw.stream().pipeThrough(new CompressionStream('gzip'))).blob();
  }
}

// ------------------------------------------------------------------ reading

export interface TeamFrame { t: number; hp: number; max: number; m: RecMember[] }
export interface RivalFrame { t: number; r: { id: number; x: number; y: number; hp: number; dir: number }[] }
export interface SpawnInfo { t: number; id: number; unit: number; kind: typeof KINDS[number]; variant: string; scale: number }
export interface Replay {
  header: ReplayHeader;
  team: TeamFrame[];
  rivals: RivalFrame[];
  /** by rival id: the LAST spawn with that id before a given time wins (ids are u16 and can wrap in endless runs) */
  spawns: SpawnInfo[];
  kills: { t: number; id: number }[];
  events: { t: number; e: ReplayEvent }[];
  /** run length in seconds */
  duration: number;
}

export async function readReplay(data: ArrayBuffer): Promise<Replay> {
  let bytes = new Uint8Array(data);
  if (bytes[0] === 0x1f && bytes[1] === 0x8b) bytes = new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer());
  const v = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength), dec = new TextDecoder();
  let o = 0;
  const hl = v.getUint32(0); o = 4;
  const header = JSON.parse(dec.decode(bytes.subarray(o, o + hl))) as ReplayHeader; o += hl;
  if (header.v > REPLAY_VERSION) throw new Error('Esta repetición es de una versión más nueva del juego.');
  const rp: Replay = { header, team: [], rivals: [], spawns: [], kills: [], events: [], duration: 0 };
  const last = new Map<number, { x: number; y: number }>();
  while (o + 5 <= bytes.length) {
    const type = v.getUint8(o), t = v.getUint32(o + 1) / 1000; o += 5;
    rp.duration = Math.max(rp.duration, t);
    if (type === T_TEAM) {
      const hp = v.getUint16(o), max = v.getUint16(o + 2), n = v.getUint8(o + 4); o += 5;
      const m: RecMember[] = [];
      for (let i = 0; i < n; i++, o += 9) m.push({ id: v.getInt32(o), x: v.getInt16(o + 4), y: v.getInt16(o + 6), dir: v.getUint8(o + 8) });
      rp.team.push({ t, hp, max, m });
    } else if (type === T_RIVALS) {
      const n = v.getUint16(o); o += 2;
      const r: RivalFrame['r'] = [], seen = new Set<number>();
      for (let i = 0; i < n; i++) {
        const id = v.getUint16(o), full = v.getUint8(o + 2) & 1; o += 3;
        let x: number, y: number;
        if (full) { x = v.getInt16(o); y = v.getInt16(o + 2); o += 4; } else { const w = last.get(id) ?? { x: 0, y: 0 }; x = w.x + v.getInt8(o); y = w.y + v.getInt8(o + 1); o += 2; }
        const hp = v.getUint8(o) / 255, dir = v.getUint8(o + 1); o += 2;
        last.set(id, { x, y }); seen.add(id);
        r.push({ id, x, y, hp, dir });
      }
      for (const id of last.keys()) if (!seen.has(id)) last.delete(id);
      rp.rivals.push({ t, r });
    } else if (type === T_SPAWN) {
      rp.spawns.push({ t, id: v.getUint16(o), unit: v.getUint16(o + 2), kind: KINDS[v.getUint8(o + 4)] ?? 'normal', variant: VARIANTS[v.getUint8(o + 5)] ?? '', scale: v.getUint16(o + 6) / 100 });
      o += 8;
    } else if (type === T_KILL) {
      rp.kills.push({ t, id: v.getUint16(o) }); o += 2;
    } else if (type === T_EVENT) {
      const n = v.getUint16(o); o += 2;
      try { rp.events.push({ t, e: JSON.parse(dec.decode(bytes.subarray(o, o + n))) as ReplayEvent }); } catch { /* a broken event is skipped */ }
      o += n;
    } else break; // unknown record: the rest can't be read
  }
  return rp;
}

/** index of the last frame with frame.t <= t (binary search; -1 before the first) */
export function frameAtTime<T extends { t: number }>(list: T[], t: number): number {
  let lo = 0, hi = list.length - 1, best = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (list[mid].t <= t) { best = mid; lo = mid + 1; } else hi = mid - 1;
  }
  return best;
}

/** the spawn that made rival `id` visible at time t */
export function spawnOf(byId: Map<number, SpawnInfo[]>, id: number, t: number): SpawnInfo | undefined {
  const list = byId.get(id);
  if (!list) return undefined;
  let best: SpawnInfo | undefined;
  for (const s of list) if (s.t <= t + 0.5) best = s; else break;
  return best ?? list[0];
}
