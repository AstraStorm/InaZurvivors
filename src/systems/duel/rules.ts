/**
 * Modo Duelo: the rules engine (the author's doc «InaZurvivors — Modo Duelo: reglamento»). Pure and seeded: the same
 * seed and the same actions give the same match, so the CPU can try moves on a copy, the tests can replay games and the
 * online server can run this very file. No DOM, no Phaser.
 *
 * A side has 4 footballers (slots 0-2 on the pitch, 3 on the bench) and a coach. Each turn it gets 2 cards per starter
 * standing and 1 at random (up to 7, kept between turns), has 3 actions (2 with 2 standing, 1 with 1), and fuses equal
 * cards side by side. The gauge (5 segments) fills with every card used and every fusion; full, the ulti comes into the
 * hand. Whoever knocks out the 4 rivals wins.
 */
import { ALLY_ON_FIELD_BONUS, DUEL_BY_ID, passiveOf, sameFamily, DUEL_COACHES, DUEL_COMBOS, duelStats, type CardKind, type CardSpec, type CoachId, type Cond, type DuelGroup,
  type DuelStats, type Fx, type Per, type StatusId } from './cards';

export type Side = 0 | 1;
export type Element = 'Fuego' | 'Bosque' | 'Montaña' | 'Aire' | 'Neutro';
export const GAUGE_MAX = 5;
export const HAND_MAX = 7;
export const TURN_LIMIT = 20;
const RANK_MULT: Partial<Record<CardKind, [number, number, number]>> = {
  ataque: [1.5, 2.4, 3.6], area: [0.9, 1.4, 2.1], debilitar: [0.6, 1, 1.5],
};
const STATUS_TURNS: Record<StatusId, number> = { quemadura: 3, congelado: 1, electrizado: 2, aturdido: 1, provocar: 2 };
/** the Inazuma Eleven wheel: Montaña beats Fuego, Fuego beats Bosque, Bosque beats Aire, Aire beats Montaña; Neutro is
 * neutral against all of them (author) */
export const BEATS: Partial<Record<Element, Element>> = { Montaña: 'Fuego', Fuego: 'Bosque', Bosque: 'Aire', Aire: 'Montaña' };

export interface Mod { stat: 'atk' | 'def' | 'crit' | 'vuln'; pct: number; turns: number }
export type Stance =
  | { kind: 'block'; who: 'ally' | 'team'; ward: number; n: number; reflect?: number; rankDownAttacker?: boolean; gaugeSelf?: number }
  | { kind: 'dodge'; n: number; stealGauge?: number; gaugeSelf?: number }
  | { kind: 'counter'; mult: number; guardsTaunt?: boolean }
  | { kind: 'reflect'; pct: number; burn?: boolean }
  | { kind: 'endure' } | { kind: 'mine'; mult: number };

export interface Unit {
  uid: number; pid: number; side: Side; slot: number; // 0-2 pitch, 3 bench, -1 out
  hp: number; maxHp: number; base: DuelStats; element: Element; position: string; group: DuelGroup; family: number;
  gauge: number; shield: number; status: Partial<Record<StatusId, number>>; mods: Mod[]; stances: (Stance & { owner: number })[];
  blind: number; noHeal: number; ultiReady: boolean; spirit?: boolean; spiritOn?: boolean;
  /** his last-stand passive is spent */
  stood?: boolean;
}
export interface Card { id: number; owner: number; idx: 0 | 1 | 'u' | 'c'; rank: 1 | 2 | 3; sealed?: boolean; decoy?: boolean; combo?: { name: string; members: number[] } }
export interface SideState {
  units: Unit[]; hand: Card[]; actions: number; coach: CoachId | null; swapUsed: boolean; freeSwaps: number; freeMoves: number;
  nextCardsMinus: number; nextActionsMinus: number; nextExtra: number; faceDown: boolean; immune: number; statusGuard: boolean;
  reduce: { area: number; all: number }; mergedThisTurn: boolean; mergeBoost: boolean; usedThisTurn: Record<number, number>; cardsThisTurn: number;
  critThisTurn: boolean; hillman: number; groups: Partial<Record<DuelGroup, number>>; elemBonus: number; coachBoost: boolean;
  /** story bosses (story.ts): actions and cards more each turn; their shields never pass `shieldCap` of their PV (two
   *  goalkeepers with extra actions stacked them for ever) */
  boss?: { actions: number; cards: number; shieldCap: number };
}
export type Ev =
  | { t: 'turn'; side: Side; turn: number } | { t: 'deal'; side: Side; cards: number } | { t: 'merge'; side: Side; card: number; rank: number; owner: number; idx: Card['idx'] }
  | { t: 'combo'; side: Side; name: string } | { t: 'use'; side: Side; card: Card; spec: string; target?: number }
  | { t: 'hit'; from: number; to: number; dmg: number; crit: boolean; elem: number; broke?: boolean }
  | { t: 'miss'; from: number; to: number; why: 'dodge' | 'block' | 'blind' }
  /** a blow that ignores stances went through one that was guarding its target (the screen says so: a block that does
   *  nothing looked like a bug, author «pongo la mano mágica y la atraviesan») */
  | { t: 'pierce'; to: number }
  /** a passive that shows (cards.ts DUEL_PASSIVE): the last stand that kept him up */
  | { t: 'passive'; uid: number; what: 'lastStand' }
  | { t: 'heal'; to: number; hp: number } | { t: 'shield'; to: number; amount: number } | { t: 'status'; to: number; s: StatusId; turns: number }
  | { t: 'resist'; to: number; s: StatusId } | { t: 'dispel'; to: number } | { t: 'ko'; uid: number } | { t: 'enter'; uid: number; slot: number }
  | { t: 'ulti'; uid: number } | { t: 'cards'; side: Side; what: string } | { t: 'win'; side: Side };

export interface DuelState {
  sides: [SideState, SideState]; turn: number; active: Side; first: Side; rng: number; nextId: number; log: Ev[]; winner: Side | -1;
  /** tutorial: the player's footballers never fall below 1 PV, and each of its turns can deal fixed cards */
  tutorial?: { deals: { pid: number; idx: 0 | 1; rank?: 1 | 2 | 3 }[][]; dealt: number; kos?: Record<number, number>; gauges?: Record<number, Record<number, number>> };
}

export interface UnitCfg { pid: number; stats: DuelStats; element: Element; position: string; bonusPct?: number; spirit?: boolean }
export interface TeamCfg { units: UnitCfg[]; coach: CoachId | null; boss?: { actions: number; cards: number; shieldCap?: number } }

// ---- randomness (mulberry32 on the state, so a copy of the state replays the same luck)
function rand(s: DuelState): number {
  s.rng = (s.rng + 0x6d2b79f5) | 0;
  let t = s.rng;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const pick = <T>(s: DuelState, a: T[]): T | undefined => (a.length ? a[Math.floor(rand(s) * a.length)] : undefined);

// ---- lookups
export const unit = (s: DuelState, uid: number) => s.sides[uid >> 4 ? 1 : 0].units[uid & 15];
const sideOf = (s: DuelState, u: Unit) => s.sides[u.side];
const foe = (side: Side): Side => (side ? 0 : 1);
export const onPitch = (ss: SideState) => ss.units.filter((u) => u.slot >= 0 && u.slot <= 2 && u.hp > 0).sort((a, b) => a.slot - b.slot);
export const standing = (ss: SideState) => ss.units.filter((u) => u.slot >= 0);
export function specOf(card: Card, u: Unit): { kind: CardKind | 'ulti' | 'combo'; tech: string; fx: Fx[]; mult: number[]; area: boolean } {
  const p = DUEL_BY_ID.get(u.pid)!;
  if (card.idx === 'c') return { kind: 'combo', tech: card.combo!.name, fx: [], mult: [card.combo!.members.length >= 3 ? 8 : 6], area: false };
  if (card.idx === 'u') return { kind: 'ulti', tech: p.ulti.tech, fx: p.ulti.fx, mult: [p.ulti.mult], area: !!p.ulti.area };
  const c: CardSpec = p.cards[card.idx];
  return { kind: c.kind, tech: c.tech, fx: c.fx, mult: c.mult ?? RANK_MULT[c.kind] ?? [0, 0, 0], area: c.kind === 'area' };
}
const fxAt = (fx: Fx[], rank: number) => fx.filter((f) => (f.min ?? 1) <= rank);
const modSum = (u: Unit, stat: Mod['stat']) => u.mods.filter((m) => m.stat === stat).reduce((a, m) => a + m.pct, 0);
const coachOf = (ss: SideState, id: CoachId) => ss.coach === id;
const coachK = (ss: SideState) => (ss.coachBoost ? 1.5 : 1);

// ---- setup
export function createDuel(teams: [TeamCfg, TeamCfg], seed: number, first: Side = 0, tutorial?: DuelState['tutorial']): DuelState {
  const s: DuelState = { sides: [null!, null!], turn: 0, active: first, first, rng: seed | 0, nextId: 1, log: [], winner: -1, tutorial };
  teams.forEach((t, side) => {
    const units: Unit[] = t.units.map((c, i) => {
      const p = DUEL_BY_ID.get(c.pid);
      if (!p) throw new Error(`not a duel footballer: ${c.pid}`);
      const k = 1 + Math.min(20, Math.max(0, c.bonusPct ?? 0)) / 100;
      const base = { ...c.stats, hp: Math.round(c.stats.hp * k), atk: Math.round(c.stats.atk * k), def: Math.round(c.stats.def * k) };
      return { uid: side * 16 + i, pid: c.pid, side: side as Side, slot: i < 3 ? i : 3, hp: base.hp, maxHp: base.hp, base, element: c.element,
        position: c.position, group: p.group, family: p.family ?? p.id,
        gauge: Math.min(GAUGE_MAX - 1, (p.mixiMax ? 2 : 0) + (passiveOf(c.pid)?.do === 'gaugeStart' ? (passiveOf(c.pid) as { n: number }).n : 0)), shield: 0, status: {}, mods: [], stances: [],
        blind: 0, noHeal: 0, ultiReady: false, spirit: c.spirit };
    });
    const groups: Partial<Record<DuelGroup, number>> = {};
    for (const u of units) groups[u.group] = (groups[u.group] ?? 0) + 1;
    const els = new Map<string, number>();
    for (const u of units.slice(0, 3)) els.set(u.element, (els.get(u.element) ?? 0) + 1);
    const allSame = units.every((u) => u.element === units[0].element);
    const coach = DUEL_COACHES.find((c) => c.id === t.coach);
    const ss: SideState = {
      units, hand: [], actions: 0, coach: t.coach, swapUsed: false, freeSwaps: 0, freeMoves: 0, nextCardsMinus: 0, nextActionsMinus: 0, nextExtra: 0,
      faceDown: false, immune: 0, statusGuard: false, reduce: { area: 0, all: 0 }, mergedThisTurn: false, mergeBoost: false, usedThisTurn: {}, cardsThisTurn: 0,
      critThisTurn: false, hillman: 0, groups, elemBonus: allSame ? 15 : Math.max(...els.values()) >= 3 ? 10 : 0,
      coachBoost: !!coach && units.filter((u) => (coach.groups as readonly string[]).includes(u.group)).length >= 2,
      ...(t.boss ? { boss: { shieldCap: 0.5, ...t.boss } } : {}),
    };
    if (groups['Ares y Orion']! >= 3) for (const u of units) u.gauge = Math.max(u.gauge, 2);
    if (coachOf(ss, 'david-evans')) for (const u of units) if (u.position === 'GK') u.gauge = Math.max(u.gauge, 2);
    s.sides[side] = ss;
  });
  if (s.sides[foe(first)].coach === 'ray-dark') s.sides[first].nextCardsMinus += 1; // Juego sucio: the rival's first hand is one card short
  if (s.sides[first].coach === 'ray-dark') s.sides[foe(first)].nextCardsMinus += 1;
  startTurn(s, true);
  return s;
}

/** group effect active on that side (3+ of the group among its 4) */
const groupOn = (ss: SideState, g: DuelGroup) => (ss.groups[g] ?? 0) >= 3;
/** ATK multiplier from groups (2: +8 % to them, 4: +15 % to all), Hillman's stacks, the spirit and the mods */
function atkOf(s: DuelState, u: Unit): number {
  const ss = sideOf(s, u);
  let k = 1 + modSum(u, 'atk') / 100;
  const g = ss.groups[u.group] ?? 0;
  if (g >= 2) k *= 1.08;
  if (Object.values(ss.groups).some((n) => n! >= 4)) k *= 1.15;
  k *= 1 + (ss.hillman * 10 * coachK(ss)) / 100;
  if (u.spiritOn) k *= 1.25;
  // passives: a team mate on the pitch who raises his mates' ATK
  for (const o of onPitch(ss)) { const p = passiveOf(o.pid); if (o.uid !== u.uid && p?.do === 'teamAtk') k *= 1 + p.pct / 100; }
  return u.base.atk * k;
}
function defOf(s: DuelState, u: Unit): number {
  const ss = sideOf(s, u);
  let k = 1 + modSum(u, 'def') / 100;
  if (coachOf(ss, 'mister-d')) k *= 1 - (8 * coachK(ss)) / 100;
  if (u.spiritOn) k *= 1.25;
  return Math.max(0, u.base.def * k);
}

// ---- turns
export function startTurn(s: DuelState, first = false) {
  const ss = s.sides[s.active];
  s.turn += first ? 1 : 0;
  s.log.push({ t: 'turn', side: s.active, turn: s.turn });
  for (const u of ss.units) u.stances = [];
  ss.reduce = { area: 0, all: 0 };
  ss.statusGuard = false;
  if (ss.immune > 0) ss.immune--;
  ss.mergedThisTurn = false; ss.mergeBoost = false; ss.usedThisTurn = {}; ss.cardsThisTurn = 0; ss.critThisTurn = false; ss.freeMoves = 0;
  // burns, then everything timed ticks down
  for (const u of standing(ss)) {
    if (u.status.quemadura) damageRaw(s, u, Math.round(u.maxHp * 0.06), null);
    for (const k of ['quemadura', 'provocar'] as StatusId[]) if (u.status[k]) { u.status[k]!--; if (!u.status[k]) delete u.status[k]; }
    u.mods = u.mods.map((m) => ({ ...m, turns: m.turns - 1 })).filter((m) => m.turns > 0);
    if (u.noHeal) u.noHeal--;
  }
  checkKos(s);
  if (s.winner >= 0) return;
  // tutorial: at the start of the player's turn n a footballer may fall by script, and gauges may be set
  if (s.tutorial && s.active === 0) {
    const n = s.tutorial.dealt, ko = s.tutorial.kos?.[n];
    const fall = ko !== undefined ? ss.units.find((u) => u.pid === ko && u.slot >= 0) : undefined;
    if (fall) { fall.hp = 0; fall.slot = -1; fall.status = {}; ss.hand = ss.hand.filter((c) => c.owner !== fall.uid); s.log.push({ t: 'ko', uid: fall.uid }); if (coachOf(ss, 'hillman')) ss.hillman = Math.min(2, ss.hillman + 1); }
    for (const [pid, g] of Object.entries(s.tutorial.gauges?.[n] ?? {})) { const u = ss.units.find((x) => x.pid === Number(pid)); if (u) u.gauge = g; }
  }
  // the bench fills an empty place
  benchIn(s, ss);
  // passives of every turn (Garra before the deal, so a gauge they fill brings its ulti now)
  for (const u of onPitch(ss)) {
    const p = passiveOf(u.pid);
    if (p?.do === 'turnHeal' && !u.noHeal && u.hp < u.maxHp) { const hp = Math.min(u.maxHp - u.hp, Math.round(u.maxHp * p.pct / 100)); u.hp += hp; s.log.push({ t: 'heal', to: u.uid, hp }); }
    if (p?.do === 'turnShield') { const amt = Math.round(u.maxHp * p.pct / 100); u.shield = ss.boss ? Math.min(u.shield + amt, Math.round(u.maxHp * ss.boss.shieldCap)) : u.shield + amt; s.log.push({ t: 'shield', to: u.uid, amount: amt }); }
    if (p?.do === 'turnGauge') gauge(u, p.n);
  }
  deal(s, ss);
  for (const u of onPitch(ss)) if (passiveOf(u.pid)?.do === 'rankStart') {
    const x = pick(s, ss.hand.filter((c) => c.owner === u.uid && c.rank < 3 && c.idx !== 'u' && c.idx !== 'c' && !c.decoy));
    if (x) { x.rank = (x.rank + 1) as 2 | 3; s.log.push({ t: 'cards', side: u.side, what: 'rankUp' }); settle(s, ss); }
  }
  for (const u of standing(ss)) if (u.status.congelado) { u.status.congelado--; if (!u.status.congelado) delete u.status.congelado; }
  const n = onPitch(ss).length;
  ss.actions = Math.max(1, (n >= 3 ? 3 : n) - ss.nextActionsMinus) + (ss.boss?.actions ?? 0); // the side that opens plays 3 too (author)
  ss.nextActionsMinus = 0;
  ss.faceDown = false;
}

export function endTurn(s: DuelState) {
  if (s.winner >= 0) return;
  const ss = s.sides[s.active];
  for (const u of standing(ss)) for (const k of ['aturdido', 'electrizado'] as StatusId[]) if (u.status[k]) { u.status[k]!--; if (!u.status[k]) delete u.status[k]; }
  ss.hand = ss.hand.filter((c) => !c.decoy).map((c) => ({ ...c, sealed: false }));
  s.active = foe(s.active);
  if (s.active === s.first) s.turn++;
  if (s.turn > TURN_LIMIT) { finishByHp(s); return; }
  startTurn(s);
}
function finishByHp(s: DuelState) {
  const pct = (ss: SideState) => ss.units.reduce((a, u) => a + Math.max(0, u.hp) / u.maxHp, 0);
  s.winner = pct(s.sides[0]) >= pct(s.sides[1]) ? 0 : 1;
  s.log.push({ t: 'win', side: s.winner });
}

function newCard(s: DuelState, owner: number, idx: Card['idx'], rank: 1 | 2 | 3 = 1): Card { return { id: s.nextId++, owner, idx, rank }; }

function deal(s: DuelState, ss: SideState) {
  const before = ss.hand.length;
  const fresh: Card[] = [];
  const script = s.tutorial && s.active === 0 ? s.tutorial.deals[s.tutorial.dealt++] : undefined;
  if (script) {
    for (const d of script) { const u = ss.units.find((x) => x.pid === d.pid && x.slot >= 0); if (u) fresh.push(newCard(s, u.uid, d.idx, d.rank ?? 1)); }
    for (const c of fresh) if (ss.hand.length < HAND_MAX) ss.hand.push(c);
  } else {
    // like Grand Cross (author: «siempre he de tener en la mano las cartas máximas al empezar turno, aunque se junten»):
    // the hand fills up to its size every turn, also the first one, and the cards that fuse as they come in are made
    // up for. Its size is 2 per starter who can play and 1 more (7 with three, 5 with two, 3 with one), give or take
    // the cards some effects add or take away
    const can = onPitch(ss).filter((u) => !u.status.congelado);
    const size = Math.min(HAND_MAX, can.length ? 2 * can.length + 1 + ss.nextExtra + (ss.boss?.cards ?? 0) - ss.nextCardsMinus : 0);
    for (let round = 0; ss.hand.length < size && round < 12; round++) {
      // each round: as many as are missing, spread over the starters, then they settle (and fuse)
      const fresh: Card[] = [];
      for (let k = 0, n = size - ss.hand.length; k < n; k++) {
        const u = round === 0 && k < can.length * 2 ? can[k % can.length] : pick(s, can)!;
        fresh.push(newCard(s, u.uid, rand(s) < 0.5 ? 0 : 1, round === 0 && k === 0 && groupOn(ss, 'Inazuma Japan') ? 2 : 1));
      }
      if (groupOn(ss, 'Protocolo Omega')) fresh.sort((a, b) => a.owner - b.owner || Number(a.idx) - Number(b.idx));
      ss.hand.push(...fresh);
      settle(s, ss);
    }
  }
  ss.nextCardsMinus = 0; ss.nextExtra = 0;
  // full gauges: the ulti comes in first (beyond the 7)
  for (const u of onPitch(ss)) if (u.gauge >= GAUGE_MAX && !ss.hand.some((c) => c.idx === 'u' && c.owner === u.uid)) { ss.hand.unshift(newCard(s, u.uid, 'u')); s.log.push({ t: 'ulti', uid: u.uid }); }
  s.log.push({ t: 'deal', side: s.active, cards: ss.hand.length - before });
  settle(s, ss);
}

/** equal cards side by side fuse (again and again), then the combined techniques of the game join */
function settle(s: DuelState, ss: SideState) {
  const fam = (c: Card) => unit(s, c.owner).family;
  for (let again = true; again;) {
    again = false;
    for (let i = 0; i + 1 < ss.hand.length; i++) {
      const a = ss.hand[i], b = ss.hand[i + 1];
      if (a.idx === 'u' || a.idx === 'c' || a.decoy || b.decoy || a.sealed || b.sealed || a.idx !== b.idx || a.rank !== b.rank || a.rank >= 3 || fam(a) !== fam(b)) continue;
      let rank = a.rank + 1;
      if (!ss.mergedThisTurn && coachOf(ss, 'travis')) rank++; // Táctica: the first fusion of each turn climbs one more
      if (ss.mergeBoost) { rank++; ss.mergeBoost = false; }
      ss.mergedThisTurn = true;
      a.rank = Math.min(3, rank) as 1 | 2 | 3;
      ss.hand.splice(i + 1, 1);
      gauge(unit(s, a.owner), 1);
      s.log.push({ t: 'merge', side: unit(s, a.owner).side, card: a.id, rank: a.rank, owner: a.owner, idx: a.idx });
      again = true;
      break;
    }
    if (again) continue;
    again = combos(s, ss);
  }
}
function combos(s: DuelState, ss: SideState): boolean {
  // only cards of ★★ or more join a combined technique: fuse first, then bring them together (any card would otherwise
  // vanish into a combo the moment it touched a partner's)
  const ok = (c: Card) => c.idx !== 'u' && c.idx !== 'c' && !c.decoy && !c.sealed && c.rank >= 2 && unit(s, c.owner).slot >= 0 && unit(s, c.owner).slot <= 2;
  for (const size of [3, 2]) {
    for (let i = 0; i + size <= ss.hand.length; i++) {
      const run = ss.hand.slice(i, i + size);
      if (!run.every(ok)) continue;
      const pids = run.map((c) => unit(s, c.owner).pid);
      const combo = DUEL_COMBOS.find((k) => k.players.length === size && k.players.every((p) => pids.includes(p)) && new Set(pids).size === size);
      if (!combo) continue;
      const card = newCard(s, run[0].owner, 'c', 2);
      card.combo = { name: combo.name, members: run.map((c) => c.owner) };
      ss.hand.splice(i, size, card);
      s.log.push({ t: 'combo', side: unit(s, run[0].owner).side, name: combo.name });
      return true;
    }
  }
  return false;
}
function gauge(u: Unit, n: number) {
  u.gauge = Math.max(0, Math.min(GAUGE_MAX, u.gauge + n));
  if (u.gauge >= GAUGE_MAX && u.spirit && !u.spiritOn) u.spiritOn = true; // Espíritu desatado: the first full gauge
}
function benchIn(s: DuelState, ss: SideState) {
  for (let slot = 0; slot < 3; slot++) {
    if (ss.units.some((u) => u.slot === slot)) continue;
    const b = ss.units.find((u) => u.slot === 3);
    if (!b) return;
    b.slot = slot;
    s.log.push({ t: 'enter', uid: b.uid, slot });
  }
}
function checkKos(s: DuelState) {
  for (const ss of s.sides) {
    for (const u of ss.units) {
      if (u.slot < 0 || u.hp > 0) continue;
      if (s.tutorial && u.side === 0) { u.hp = 1; continue; }
      u.slot = -1;
      u.status = {}; u.stances = [];
      ss.hand = ss.hand.filter((c) => c.owner !== u.uid && !(c.combo?.members.includes(u.uid)));
      s.log.push({ t: 'ko', uid: u.uid });
      if (coachOf(ss, 'hillman')) ss.hillman = Math.min(2, ss.hillman + 1);
      benchIn(s, ss);
    }
    if (ss.units.every((u) => u.slot < 0)) { s.winner = foe(ss.units[0].side); s.log.push({ t: 'win', side: s.winner }); return; }
  }
}

// ---- actions
export type Action = { do: 'use'; card: number; target?: number } | { do: 'move'; card: number; to: number } | { do: 'swap'; bench: number; out: number } | { do: 'end' };

/** why an action can't be done now (null = it can) */
export function illegal(s: DuelState, side: Side, a: Action): string | null {
  if (s.winner >= 0) return 'over';
  if (s.active !== side) return 'not_your_turn';
  if (a.do === 'end') return null;
  const ss = s.sides[side];
  if (a.do === 'swap') {
    const b = unit(s, a.bench), o = unit(s, a.out);
    if (b.side !== side || o.side !== side || b.slot !== 3 || o.slot < 0 || o.slot > 2) return 'bad_swap';
    if (ss.freeSwaps <= 0 && (ss.swapUsed || ss.actions <= 0)) return 'no_swap';
    return null;
  }
  const c = ss.hand.find((x) => x.id === a.card);
  if (!c) return 'no_card';
  if (a.do === 'move') {
    if (c.sealed) return 'sealed';
    if (a.to < 0 || a.to >= ss.hand.length) return 'bad_place';
    if (ss.actions <= 0 && ss.freeMoves <= 0) return 'no_actions';
    return null;
  }
  if (ss.actions <= 0) return 'no_actions';
  if (c.decoy) return 'decoy';
  if (c.sealed) return 'sealed';
  const u = unit(s, c.owner);
  if (u.slot < 0 || u.slot > 2) return 'owner_out';
  if (u.status.aturdido) return 'stunned';
  if (a.target !== undefined) {
    const t = unit(s, a.target);
    if (!t || t.slot < 0 || t.slot > 2) return 'bad_target';
  }
  return null;
}

export function act(s: DuelState, side: Side, a: Action): string | null {
  const why = illegal(s, side, a);
  if (why) return why;
  const ss = s.sides[side];
  if (a.do === 'end') { endTurn(s); return null; }
  if (a.do === 'swap') {
    const b = unit(s, a.bench), o = unit(s, a.out);
    if (ss.freeSwaps > 0) ss.freeSwaps--; else { ss.swapUsed = true; ss.actions--; }
    [b.slot, o.slot] = [o.slot, 3];
    o.status = {};
    ss.hand = ss.hand.filter((c) => c.owner !== o.uid);
    s.log.push({ t: 'enter', uid: b.uid, slot: b.slot });
    return null;
  }
  const i = ss.hand.findIndex((x) => x.id === a.card);
  if (a.do === 'move') {
    if (ss.freeMoves > 0) ss.freeMoves--; else ss.actions--;
    const [c] = ss.hand.splice(i, 1);
    ss.hand.splice(a.to, 0, c);
    // moving a card charges its footballer's Garra by one, fusion or not (author: «cuando mueves cartas, aunque no se
    // junten, dan orbes»); a fusion it makes adds its own
    if (c.idx !== 'u' && c.idx !== 'c' && !c.decoy) gauge(unit(s, c.owner), 1);
    settle(s, ss);
    return null;
  }
  const card = ss.hand[i];
  ss.hand.splice(i, 1);
  ss.actions--;
  play(s, ss, card, a.target, i);
  settle(s, ss); // the cards on each side of the one used come together and may fuse, for free
  checkKos(s);
  return null;
}

// ---- resolving a card
interface Ctx { s: DuelState; ss: SideState; card: Card; u: Unit; spec: ReturnType<typeof specOf>; rank: number; fx: Fx[]; pos: number; first: boolean; kos: number }
const has = (c: Ctx, k: Fx['do']) => c.fx.some((f) => f.do === k);
const get = <K extends Fx['do']>(c: Ctx, k: K) => c.fx.filter((f) => f.do === k) as Extract<Fx, { do: K }>[];

function play(s: DuelState, ss: SideState, card: Card, target: number | undefined, pos: number) {
  const u = unit(s, card.owner);
  const spec = specOf(card, u);
  const rank = card.idx === 'u' || card.idx === 'c' ? 3 : card.rank;
  const c: Ctx = { s, ss, card, u, spec, rank, fx: fxAt(spec.fx, rank), pos, first: ss.cardsThisTurn === 0, kos: 0 };
  ss.cardsThisTurn++;
  ss.usedThisTurn[u.uid] = (ss.usedThisTurn[u.uid] ?? 0) + 1;
  s.log.push({ t: 'use', side: u.side, card, spec: spec.tech, target });
  if (u.status.electrizado) damageRaw(s, u, Math.round(u.maxHp * 0.05), null);
  const enemies = onPitch(s.sides[foe(u.side)]);
  const mult = spec.mult[Math.min(spec.mult.length - 1, rank - 1)] ?? 0;
  const attacker = card.idx === 'c' ? comboAttacker(s, card) : u;
  // damage
  if (mult > 0 || has(c, 'hits')) {
    if (spec.area) for (const t of enemies) hit(c, attacker, t, mult);
    else if (has(c, 'randomHits')) for (let k = 0; k < get(c, 'randomHits')[0].n; k++) { const t = pick(s, onPitch(s.sides[foe(u.side)])); if (t) hit(c, attacker, t, mult); }
    else {
      const t = aim(s, u, target, has(c, 'ignoreTaunt'));
      if (t) {
        const h = get(c, 'hits')[0];
        for (let k = 0; k < (h?.n ?? 1); k++) if (t.slot >= 0) hit(c, attacker, t, h ? (mult || 1) * h.each : mult);
      }
    }
  }
  // the rest of the effects
  const tgtEnemy = () => aim(s, u, target, true);
  const ally = () => (target !== undefined && unit(s, target).side === u.side && unit(s, target).slot >= 0 ? unit(s, target) : [...onPitch(ss)].sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0]);
  for (const f of c.fx) {
    switch (f.do) {
      case 'status': if (mult === 0) { const t = tgtEnemy(); if (t) giveStatus(c, t, f.s, f.turns, f.sure); } break; // with damage: below, on what was hit
      case 'selfStun': u.status.aturdido = 2; break; // through its own next turn
      case 'gale': s.sides[foe(u.side)].nextCardsMinus += 1; break;
      case 'rankDown': rankDown(c, f.who, tgtEnemy()); break;
      case 'seal': sealCards(s, s.sides[foe(u.side)], f.n); break;
      case 'destroy': { const t = tgtEnemy(); const fs = s.sides[foe(u.side)]; const cs = fs.hand.filter((x) => t && x.owner === t.uid && x.rank >= f.minRank && x.idx !== 'u'); const x = pick(s, cs); if (x) { fs.hand.splice(fs.hand.indexOf(x), 1); s.log.push({ t: 'cards', side: fs.units[0].side, what: 'destroy' }); } break; }
      case 'stealGauge': { const n = f.n + (groupOn(ss, 'Zero y Zan') ? 1 : 0); const from = f.each ? enemies : [tgtEnemy()].filter(Boolean) as Unit[]; for (const t of from) gauge(t, -n); break; }
      case 'decoys': { const fs = s.sides[foe(u.side)]; for (let k = 0; k < f.n; k++) fs.hand.splice(Math.floor(rand(s) * (fs.hand.length + 1)), 0, { ...newCard(s, onPitch(fs)[0]?.uid ?? fs.units[0].uid, 0), decoy: true }); break; }
      case 'faceDown': s.sides[foe(u.side)].faceDown = true; break;
      case 'enemyActions': s.sides[foe(u.side)].nextActionsMinus += f.n; break;
      case 'shield': { const amt = Math.round(u.maxHp * f.pct[rank - 1] / 100 * (coachOf(ss, 'david-evans') ? 1 + 0.3 * coachK(ss) : 1)); for (const t of f.who === 'all' ? onPitch(ss) : f.who === 'self' ? [u] : [ally()]) if (t) { t.shield = ss.boss ? Math.min(t.shield + amt, Math.round(t.maxHp * ss.boss.shieldCap)) : t.shield + amt; s.log.push({ t: 'shield', to: t.uid, amount: amt }); } break; }
      case 'heal': for (const t of f.who === 'all' ? onPitch(ss) : f.who === 'self' ? [u] : [ally()]) if (t && !t.noHeal) { const hp = Math.round(t.maxHp * f.pct[rank - 1] / 100); t.hp = Math.min(t.maxHp, t.hp + hp); s.log.push({ t: 'heal', to: t.uid, hp }); } break;
      case 'block': { const t = f.who === 'team' ? u : ally(); t?.stances.push({ kind: 'block', who: f.who, ward: t.uid, n: f.n[rank - 1], reflect: f.reflect, rankDownAttacker: f.rankDownAttacker, gaugeSelf: f.gaugeSelf, owner: u.uid }); break; }
      case 'dodge': u.stances.push({ kind: 'dodge', n: f.n[rank - 1], stealGauge: f.stealGauge, gaugeSelf: f.gaugeSelf, owner: u.uid }); break;
      case 'counter': u.stances.push({ kind: 'counter', mult: f.mult, guardsTaunt: f.guardsTaunt, owner: u.uid }); break;
      case 'reflect': u.stances.push({ kind: 'reflect', pct: f.pct, burn: f.burn, owner: u.uid }); break;
      case 'endure': u.stances.push({ kind: 'endure', owner: u.uid }); break;
      case 'mine': u.stances.push({ kind: 'mine', mult: f.mult, owner: u.uid }); break;
      case 'reduce': ss.reduce[f.scope] = Math.max(ss.reduce[f.scope], f.pct); break;
      case 'statusGuard': ss.statusGuard = true; break;
      case 'immune': ss.immune = 1; break;
      // Nanatsu's «disipar»: the rival loses what helps him (his buffs, his stances, his shield)
      case 'dispel': { const t = tgtEnemy(); if (t) { t.mods = t.mods.filter((m) => m.pct < 0); t.stances = []; t.shield = 0; s.log.push({ t: 'dispel', to: t.uid }); } break; }
      case 'cleanse': if (has(c, 'shield') || has(c, 'heal')) for (const t of onPitch(ss)) t.status = {}; else { const t = tgtEnemy(); if (t) t.mods = t.mods.filter((m) => m.pct < 0); } break;
      case 'taunt': u.status.provocar = f.turns[rank - 1] + 1; if (f.defPct) u.mods.push({ stat: 'def', pct: f.defPct, turns: f.turns[rank - 1] + 1 }); s.log.push({ t: 'status', to: u.uid, s: 'provocar', turns: f.turns[rank - 1] }); break;
      case 'buff': { const turns = (f.turns ?? 2) + (groupOn(ss, 'Héroes de la historia') ? 1 : 0) + 1; for (const t of f.who === 'team' ? onPitch(ss) : [u]) t.mods.push({ stat: f.stat, pct: f.pct[rank - 1], turns }); break; }
      case 'debuff': { const extra = coachOf(ss, 'ray-dark') ? 10 * coachK(ss) : 0; for (const t of f.area ? enemies : [tgtEnemy()].filter(Boolean) as Unit[]) { const turns = (f.turns ?? 2) + 1; if (f.stat !== 'def') t.mods.push({ stat: 'atk', pct: -f.pct, turns }); if (f.stat !== 'atk') t.mods.push({ stat: 'def', pct: -f.pct - extra, turns }); } break; }
      case 'vulnerable': { const t = tgtEnemy(); t?.mods.push({ stat: 'vuln', pct: f.pct, turns: 3 }); break; }
      case 'noHeal': { const t = tgtEnemy(); if (t) t.noHeal = 2; break; }
      case 'blind': { const t = tgtEnemy(); if (t) t.blind = f.pct; break; }
      case 'rankUp': rankUp(c, f.which, f.n ?? 1, f.players); break;
      case 'createCard': { const a = pick(s, onPitch(ss)); if (a && ss.hand.length < HAND_MAX) ss.hand.push(newCard(s, a.uid, rand(s) < 0.5 ? 0 : 1, f.rank as 1 | 2 | 3)); break; }
      case 'freeMoves': ss.freeMoves += f.n; break;
      case 'mergeBoost': ss.mergeBoost = true; break;
      case 'freeSwap': ss.freeSwaps += 1; break;
      case 'extraAction': ss.actions += f.n; break;
      case 'chooseNext': ss.nextExtra += f.n; break;
      case 'gaugeSelf': gauge(u, f.n); break;
      case 'gaugeAllies': for (const t of onPitch(ss)) if (t !== u) gauge(t, f.n); break;
      case 'gaugeTo': { const t = ss.units.find((x) => x.pid === f.pid && x.slot >= 0); if (t) gauge(t, f.n); break; }
      case 'peekSeal': sealCards(s, s.sides[foe(u.side)], 1); break;
      case 'actionOnKo': break; // in hit()
      default: break; // damage modifiers, read by hit()
    }
  }
  // the Debilitar of a Royal Academy side of 3+ also lowers a card of its target
  if (spec.kind === 'debilitar' && rank >= 2 && groupOn(ss, 'Royal Academy')) rankDown(c, 'target', tgtEnemy());
  if (has(c, 'selfDamage')) damageRaw(s, u, Math.round(u.maxHp * get(c, 'selfDamage')[0].pct / 100), null);
  // a card gives as many segments as its stars (a fused card charges the ulti faster, as in Grand Cross); the tutorial's
  // lessons were written for one per card
  if (card.idx === 'u') u.gauge = 0; else if (card.idx !== 'c') gauge(u, s.tutorial ? 1 : card.rank);
  if (c.kos && has(c, 'actionOnKo')) ss.actions++;
  // statuses that come with a damaging card land on what it hit (aim() again: the first living target)
  if (mult > 0) for (const f of get(c, 'status')) {
    const ts = spec.area ? onPitch(s.sides[foe(u.side)]) : [aim(s, u, target, has(c, 'ignoreTaunt'))].filter(Boolean) as Unit[];
    for (const t of ts) giveStatus(c, t, f.s, f.turns, f.sure);
  }
}
function comboAttacker(s: DuelState, card: Card): Unit {
  // the combined shot hits with the members' average ATK (the first member owns it)
  const ms = card.combo!.members.map((m) => unit(s, m)).filter((m) => m.slot >= 0);
  const first = unit(s, card.owner);
  return { ...first, base: { ...first.base, atk: Math.round(ms.reduce((a, m) => a + atkOf(s, m), 0) / Math.max(1, ms.length)) }, mods: [], spiritOn: false, uid: first.uid };
}
/** the target of a single-target card: the chosen rival, the one taunting unless ignored, else the weakest */
function aim(s: DuelState, u: Unit, target: number | undefined, ignoreTaunt: boolean): Unit | undefined {
  const es = onPitch(s.sides[foe(u.side)]);
  if (!es.length) return undefined;
  const taunt = es.find((e) => e.status.provocar);
  if (taunt && !ignoreTaunt) return taunt;
  const t = target !== undefined ? es.find((e) => e.uid === target) : undefined;
  return t ?? [...es].sort((a, b) => a.hp - b.hp)[0];
}

function cond(c: Ctx, k: Cond, t: Unit): boolean {
  const { s, u, ss } = c;
  switch (k) {
    case 'targetHasStatus': return Object.keys(t.status).some((x) => x !== 'provocar');
    case 'targetFrozen': return !!t.status.congelado;
    case 'targetElectrified': return !!t.status.electrizado;
    case 'targetGK': return t.position === 'GK';
    case 'targetLowestHp': return onPitch(s.sides[t.side]).every((e) => e.hp >= t.hp);
    case 'lastEnemy': return standing(s.sides[t.side]).length === 1;
    case 'targetTaunt': return !!t.status.provocar;
    case 'selfHpBelow50': return u.hp < u.maxHp / 2;
    case 'selfHpAbove70': return u.hp > u.maxHp * 0.7;
    case 'firstCard': return c.first;
    case 'lastAction': return ss.actions === 0;
    case 'fwCardsInHand2': return ss.hand.filter((x) => unit(s, x.owner).position === 'FW').length >= 2;
  }
}
function per(c: Ctx, k: Per): number {
  const { s, u, ss } = c;
  switch (k) {
    case 'ownCardsInHand': return ss.hand.filter((x) => x.owner === u.uid).length;
    case 'groupCardsInHand': return ss.hand.filter((x) => unit(s, x.owner).group === u.group).length;
    case 'r3InHand': return ss.hand.filter((x) => x.rank === 3 && x.idx !== 'u').length;
    case 'alliesAlive': return standing(ss).length - 1;
    case 'ownCardsUsedThisTurn': return (ss.usedThisTurn[u.uid] ?? 1) - 1;
  }
}

function hit(c: Ctx, a: Unit, t: Unit, mult: number) {
  const { s } = c;
  if (t.slot < 0) return;
  const real = unit(s, a.uid);
  if (real.blind && rand(s) * 100 < real.blind) { real.blind = 0; s.log.push({ t: 'miss', from: a.uid, to: t.uid, why: 'blind' }); return; }
  real.blind = 0;
  const ts = s.sides[t.side];
  const ignoreStance = has(c, 'ignoreStance');
  if (ignoreStance && (t.stances.some((x) => x.kind === 'dodge') || ts.units.some((x) => x.stances.some((st) => st.kind === 'block' && (st.who === 'team' || st.ward === t.uid))))) s.log.push({ t: 'pierce', to: t.uid });
  if (!ignoreStance) {
    // a dodge evades one hit: against a multi-hit card, the first misses and the rest land (author)
    const dodge = t.stances.find((x) => x.kind === 'dodge') as Extract<Stance, { kind: 'dodge' }> | undefined;
    if (dodge) {
      if (--dodge.n <= 0) t.stances.splice(t.stances.indexOf(dodge as never), 1);
      if (dodge.stealGauge) gauge(real, -dodge.stealGauge);
      if (dodge.gaugeSelf) gauge(t, dodge.gaugeSelf);
      stanceFired(s, ts);
      s.log.push({ t: 'miss', from: a.uid, to: t.uid, why: 'dodge' });
      return;
    }
    const block = ts.units.flatMap((x) => x.stances.map((st) => ({ st, x }))).find(({ st }) => st.kind === 'block' && (st.who === 'team' || st.ward === t.uid));
    if (block && block.st.kind === 'block') {
      const b = block.st;
      if (--b.n <= 0) block.x.stances.splice(block.x.stances.indexOf(b), 1);
      if (b.reflect) damage(c, unit(s, b.owner), real, 1.5 * (b.reflect / 100), false);
      if (b.rankDownAttacker) { const cs = s.sides[real.side].hand.filter((x) => x.owner === real.uid && x.rank > 1); const x = pick(s, cs); if (x) x.rank = (x.rank - 1) as 1 | 2; }
      if (b.gaugeSelf) gauge(unit(s, b.owner), b.gaugeSelf);
      stanceFired(s, ts);
      s.log.push({ t: 'miss', from: a.uid, to: t.uid, why: 'block' });
      return;
    }
    const mine = t.stances.find((x) => x.kind === 'mine') as Extract<Stance, { kind: 'mine' }> | undefined;
    if (mine) { t.stances.splice(t.stances.indexOf(mine as never), 1); damage(c, t, real, mine.mult, false); giveStatus(c, real, 'aturdido', 1, true); stanceFired(s, ts); }
  }
  const dealt = damage(c, a, t, mult, true);
  if (!ignoreStance && dealt > 0 && t.slot >= 0) {
    const refl = t.stances.find((x) => x.kind === 'reflect') as Extract<Stance, { kind: 'reflect' }> | undefined;
    if (refl) { damageRaw(s, real, Math.round(dealt * refl.pct / 100), t); if (refl.burn) giveStatus(c, real, 'quemadura'); }
    const counter = ts.units.map((x) => ({ x, st: x.stances.find((y) => y.kind === 'counter') as (Extract<Stance, { kind: 'counter' }> & { owner: number }) | undefined }))
      .find(({ x, st }) => st && x.slot >= 0 && (x === t || (st.guardsTaunt && t.status.provocar)));
    if (counter?.st) { counter.x.stances.splice(counter.x.stances.indexOf(counter.st), 1); damage(c, counter.x, real, counter.st.mult, false); stanceFired(s, ts); }
  }
  if (t.hp <= 0 && t.slot >= 0) {
    c.kos++;
    const p = passiveOf(real.pid);
    if (p?.do === 'koGauge' && real.slot >= 0) gauge(real, p.n);
  }
}
function stanceFired(s: DuelState, ss: SideState) {
  // Raimon GO of 3+: every stance that fires raises one of its cards
  if (!groupOn(ss, 'Raimon GO')) return;
  const x = pick(s, ss.hand.filter((k) => k.rank < 3 && k.idx !== 'u' && k.idx !== 'c'));
  if (x) x.rank = (x.rank + 1) as 2 | 3;
}

/** one blow: ATQ × card × 1000 / (1000 + DEF × (1 − pierce)) × element × critical, ±5 %; returns what reached the PV */
function damage(c: Ctx, a: Unit, t: Unit, mult: number, main: boolean): number {
  const { s } = c;
  const as = s.sides[a.side];
  const fx = main ? c.fx : [];
  let pierce = a.base.pierce / 100 + fx.filter((f) => f.do === 'pierce').reduce((x, f) => x + (f as { pct: number }).pct / 100, 0);
  if (fx.some((f) => f.do === 'ignoreDef')) pierce = 1;
  const def = defOf(s, t) * (1 - Math.min(1, pierce));
  let dmg = atkOf(s, a) * mult * 1000 / (1000 + def);
  const elem = fx.some((f) => f.do === 'alwaysAdvantage') || BEATS[a.element] === t.element ? 1.3 : BEATS[t.element] === a.element ? 0.8 : 1;
  dmg *= elem;
  let crit = a.base.crit + fx.filter((f) => f.do === 'critBonus').reduce((x, f) => x + (f as { pct: number }).pct, 0);
  if (coachOf(as, 'mister-d')) crit += 12 * coachK(as);
  const isCrit = (main && fx.some((f) => f.do === 'critSure')) || rand(s) * 100 < crit;
  if (isCrit) dmg *= a.base.critDmg / 100;
  for (const f of fx) {
    if (f.do === 'bonusIf' && cond(c, f.cond, t)) dmg *= 1 + f.pct / 100;
    if (f.do === 'bonusPer') dmg *= 1 + (f.pct / 100) * per(c, f.per);
  }
  const extra = main && c.card.idx !== 'c' && c.card.idx !== 'u' ? ALLY_ON_FIELD_BONUS[`${c.u.pid}:${c.card.idx}`] : undefined;
  if (extra && onPitch(as).some((x) => x.pid === extra.ally)) dmg *= 1 + extra.pct / 100;
  dmg *= 1 + as.elemBonus / 100;
  dmg *= 1 + modSum(t, 'vuln') / 100;
  // passives: the attacker's (on his own blows, not on counters) and the target's side
  const pa = main ? passiveOf(a.pid) : undefined, ra = unit(s, a.uid);
  if (pa?.do === 'lowHpAtk' && ra.hp < ra.maxHp / 2) dmg *= 1 + pa.pct / 100;
  if (pa?.do === 'vsStatus' && Object.keys(t.status).some((x) => x !== 'provocar')) dmg *= 1 + pa.pct / 100;
  if (pa?.do === 'elemPlus' && elem > 1) dmg *= 1 + pa.pct / 100;
  if (pa?.do === 'ultiPlus' && c.card.idx === 'u') dmg *= 1 + pa.pct / 100;
  if (pa?.do === 'firstCard' && c.first) dmg *= 1 + pa.pct / 100;
  const pt = passiveOf(t.pid);
  if (pt?.do === 'takeLess') dmg *= 1 - pt.pct / 100;
  for (const o of onPitch(s.sides[t.side])) { const p = passiveOf(o.pid); if (o.uid !== t.uid && p?.do === 'teamDef') dmg *= 1 - p.pct / 100; }
  const ts = s.sides[t.side];
  if (c.spec.area && main) dmg *= 1 - ts.reduce.area / 100;
  dmg *= 1 - ts.reduce.all / 100;
  let broke = false;
  if (t.status.congelado) { dmg *= 2; delete t.status.congelado; broke = true; } // rompe el hielo
  dmg *= 0.95 + rand(s) * 0.1;
  const n = damageRaw(s, t, Math.round(dmg), a);
  s.log.push({ t: 'hit', from: a.uid, to: t.uid, dmg: n, crit: isCrit, elem, broke });
  // passives after the blow: the attacker drinks a share of it, the target sends a share back
  if (pa?.do === 'lifesteal' && n > 0 && ra.hp > 0 && ra.slot >= 0 && !ra.noHeal) { const hp = Math.min(ra.maxHp - ra.hp, Math.round(n * pa.pct / 100)); if (hp > 0) { ra.hp += hp; s.log.push({ t: 'heal', to: ra.uid, hp }); } }
  if (main && pt?.do === 'thorns' && n > 0 && ra.uid !== t.uid && ra.slot >= 0) { const back = damageRaw(s, ra, Math.round(n * pt.pct / 100), t); s.log.push({ t: 'hit', from: t.uid, to: ra.uid, dmg: back, crit: false, elem: 1 }); }
  if (main && isCrit && !as.critThisTurn && groupOn(as, 'Selecciones')) { as.critThisTurn = true; gauge(unit(s, a.uid), 1); }
  if (main && isCrit && c.card.idx === 'u' && c.fx.some((f) => f.do === 'gaugeSelf')) gauge(unit(s, a.uid), 1); // Victor + Okita: every critical of the ulti
  if (main && isCrit && c.fx.some((f) => f.do === 'repeatOnCrit') && t.slot >= 0 && t.hp > 0) { const again = damage({ ...c, fx: c.fx.filter((f) => f.do !== 'repeatOnCrit') }, a, t, mult, true); return n + again; }
  return n;
}
/** damage that goes through the shield and the endure stance; returns what reached the PV */
function damageRaw(s: DuelState, t: Unit, amount: number, _from: Unit | null): number {
  let n = Math.max(0, amount);
  const soak = Math.min(t.shield, n);
  t.shield -= soak; n -= soak;
  if (t.hp - n <= 0) {
    const endure = t.stances.find((x) => x.kind === 'endure');
    if (endure) { t.stances.splice(t.stances.indexOf(endure), 1); n = t.hp - 1; }
    // his last-stand passive: once a match
    else if (t.hp > 1 && !t.stood && passiveOf(t.pid)?.do === 'lastStand') { t.stood = true; n = t.hp - 1; s.log.push({ t: 'passive', uid: t.uid, what: 'lastStand' }); }
  }
  t.hp -= n;
  return n;
}
function giveStatus(c: Ctx, t: Unit, st: StatusId, turns?: number, sure?: boolean) {
  const { s } = c;
  const ts = s.sides[t.side];
  if (t.slot < 0) return;
  if (ts.immune > 0 || ts.statusGuard) { if (ts.statusGuard) ts.statusGuard = false; s.log.push({ t: 'resist', to: t.uid, s: st }); return; }
  if (!sure && rand(s) * 100 < t.base.res) { s.log.push({ t: 'resist', to: t.uid, s: st }); return; }
  let n = turns ?? STATUS_TURNS[st];
  if ((st === 'quemadura' || st === 'congelado') && groupOn(c.ss, 'Alius y Zeus')) n++;
  t.status[st] = Math.max(t.status[st] ?? 0, n);
  s.log.push({ t: 'status', to: t.uid, s: st, turns: n });
}
function rankDown(c: Ctx, who: 'target' | 'eachEnemy' | 'allOfTarget', target: Unit | undefined) {
  const { s, u } = c;
  const fs = s.sides[foe(u.side)];
  const lower = (cs: Card[]) => { for (const x of cs) if (x.rank > 1 && x.idx !== 'u' && x.idx !== 'c') x.rank = (x.rank - 1) as 1 | 2; };
  if (who === 'eachEnemy') for (const e of onPitch(fs)) { const x = pick(s, fs.hand.filter((k) => k.owner === e.uid && k.rank > 1)); if (x) lower([x]); }
  else if (target) {
    const cs = fs.hand.filter((k) => k.owner === target.uid);
    if (who === 'allOfTarget') lower(cs); else { const x = pick(s, cs.filter((k) => k.rank > 1)); if (x) lower([x]); }
  }
  s.log.push({ t: 'cards', side: fs.units[0].side, what: 'rankDown' });
}
function sealCards(s: DuelState, fs: SideState, n: number) {
  for (let k = 0; k < n; k++) { const x = pick(s, fs.hand.filter((c) => !c.sealed && !c.decoy)); if (x) x.sealed = true; }
  s.log.push({ t: 'cards', side: fs.units[0].side, what: 'seal' });
}
function rankUp(c: Ctx, which: 'other' | 'random' | 'right' | 'allOwn' | 'allMine', n: number, players?: number[]) {
  const { s, ss, u, pos } = c;
  const up = (x: Card | undefined) => { if (x && x.rank < 3 && x.idx !== 'u' && x.idx !== 'c' && !x.decoy) x.rank = (x.rank + 1) as 2 | 3; };
  if (which === 'right') up(ss.hand[pos]);
  else if (which === 'allMine') ss.hand.forEach(up);
  else if (which === 'allOwn') ss.hand.filter((x) => (players ? players.includes(unit(s, x.owner).pid) : x.owner === u.uid)).forEach(up);
  else for (let k = 0; k < n; k++) up(pick(s, ss.hand.filter((x) => x.rank < 3 && x.idx !== 'u' && x.idx !== 'c' && !x.decoy)));
  s.log.push({ t: 'cards', side: u.side, what: 'rankUp' });
}

/** a deep copy (the CPU tries its moves on one) */
export const cloneDuel = (s: DuelState): DuelState => structuredClone(s);

/** a team from the roster: 4 footballers (3 starters + the bench, in that order), the coach and their collection bonus */
export function teamOf(byId: Map<number, { id: number; rarity: string; position: string; element: string; stats: Record<string, number>; techniques: { type: string; power?: number }[] }>,
  pids: number[], coach: CoachId | null, bonus: (pid: number) => number = () => 0): TeamCfg {
  if (sameFamily(pids)) throw new Error('two forms of the same footballer in one team');
  return {
    coach,
    units: pids.map((pid) => {
      const p = byId.get(pid);
      if (!p) throw new Error(`unknown footballer ${pid}`);
      return { pid, stats: duelStats(p as never), element: p.element as Element, position: p.position, bonusPct: bonus(pid) };
    }),
  };
}
