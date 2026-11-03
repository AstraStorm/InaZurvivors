/** Level-up cards: recruit unlocked players, learn a second technique, upgrade active ones, team stats, passives, heal. */
import type { RosterEntry, Technique } from '../data/manifest';
import { ACTIVE_SLOTS, MAX_TECH_LEVEL } from './techniques';
import { PASSIVES, STAT_CARDS } from './runmods';

export const MAX_TEAM = 5; // captain + 4 recruits

/** Repertoire index in each of the two active slots, and the run level of every technique used so far. */
export interface TeamMemberState { playerId: number; slots: (number | null)[]; levels: Record<number, number> }

export type Card =
  | { kind: 'recruit'; playerId: number }
  | { kind: 'learn'; playerId: number; tech: number }
  | { kind: 'upgrade'; playerId: number; tech: number; toLevel: number }
  | { kind: 'stat'; id: string }
  | { kind: 'passive'; id: string }
  | { kind: 'heal'; amount: number }
  /** combined supertechnique (combos.ts): learn at level 1 or upgrade its special slot */
  | { kind: 'combo'; id: string; toLevel: number };

export interface CardContext {
  team: TeamMemberState[];
  unlocked: RosterEntry[];
  runLevel: number;
  /** repertoire indexes bought in the shop, per player */
  bought(playerId: number): number[];
  taken: Record<string, number>; // stat/passive levels this run
  /** only recruit cards, if any can be offered (altar reward) */
  onlyRecruits?: boolean;
}

/** Technique that starts in slot 1: the first active one, never a passive talent when an active one exists. */
export function startingTech(p: Pick<RosterEntry, 'techniques'>): number {
  const i = p.techniques.findIndex((t) => t.type !== 'talento');
  return i < 0 ? 0 : i;
}

export const newMemberState = (p: RosterEntry, slotCount = ACTIVE_SLOTS, chosen?: number): TeamMemberState => {
  const first = chosen !== undefined && p.techniques[chosen] && p.techniques[chosen].type !== 'talento' ? chosen : startingTech(p);
  return { playerId: p.id, slots: [first, ...Array<null>(slotCount - 1).fill(null)], levels: { [first]: 1 } };
};

/** Techniques learned late in the original game appear later in a run; level-100 ones need the technique shop. */
export const SHOP_ONLY_LEVEL = 100;
export function canLearn(t: Technique, index: number, runLevel: number, bought: number[]) {
  if (bought.includes(index)) return true;
  return t.unlockLevel < SHOP_ONLY_LEVEL && runLevel >= Math.floor((t.unlockLevel ?? 1) / 6);
}

/** Fix 1.53 (author): a run can start with a technique only if it is learnable at run level 1 (or bought), or it is the default one */
export function canStartWith(p: Pick<RosterEntry, 'techniques'>, i: number, bought: number[]) {
  const t = p.techniques[i];
  if (!t || t.type === 'talento') return false;
  return i === startingTech(p) || canLearn(t, i, 1, bought);
}

export function cardPool(ctx: CardContext): Card[] {
  const { team, unlocked } = ctx;
  const pool: Card[] = [];
  const inTeam = new Set(team.map((m) => m.playerId));
  if (team.length < MAX_TEAM) for (const p of unlocked) if (!inTeam.has(p.id)) pool.push({ kind: 'recruit', playerId: p.id });
  for (const m of team) {
    const p = unlocked.find((x) => x.id === m.playerId);
    for (const i of m.slots) {
      if (i === null) continue;
      const lv = m.levels[i] ?? 1;
      if (lv < MAX_TECH_LEVEL) pool.push({ kind: 'upgrade', playerId: m.playerId, tech: i, toLevel: lv + 1 });
    }
    if (p && m.slots.includes(null)) {
      p.techniques.forEach((t, i) => {
        if (!m.slots.includes(i) && canLearn(t, i, ctx.runLevel, ctx.bought(m.playerId))) pool.push({ kind: 'learn', playerId: m.playerId, tech: i });
      });
    }
  }
  for (const d of STAT_CARDS) if ((ctx.taken[d.id] ?? 0) < d.max) pool.push({ kind: 'stat', id: d.id });
  for (const d of PASSIVES) if ((ctx.taken[d.id] ?? 0) < d.max) pool.push({ kind: 'passive', id: d.id });
  return pool;
}

/** Distinct random cards. Weights decide the kind first, so the huge recruit list can't drown everything else. */
export function drawCards(ctx: CardContext, rng: () => number = Math.random, n = 3): Card[] {
  const buckets: [Card['kind'], number, Card[]][] = (['recruit', 'learn', 'upgrade', 'stat', 'passive'] as const)
    .map((k) => [k, { recruit: 0.32, learn: 0.28, upgrade: 0.4, stat: 0.16, passive: 0.14 }[k], []]);
  const pool = cardPool(ctx);
  const recruits = pool.filter((c) => c.kind === 'recruit');
  for (const c of ctx.onlyRecruits && recruits.length ? recruits : pool) buckets.find((b) => b[0] === c.kind)![2].push(c);
  const out: Card[] = [];
  while (out.length < n) {
    const open = buckets.filter((b) => b[2].length);
    if (!open.length) break;
    let x = rng() * open.reduce((a, b) => a + b[1], 0);
    let pick = open[open.length - 1];
    for (const b of open) { x -= b[1]; if (x < 0) { pick = b; break; } }
    out.push(pick[2].splice(Math.floor(rng() * pick[2].length), 1)[0]);
  }
  while (out.length < n) out.push({ kind: 'heal', amount: 0.3 });
  return out;
}

export function applyCard(card: Card, team: TeamMemberState[], recruit?: RosterEntry, slotCount = ACTIVE_SLOTS, chosen?: number): TeamMemberState[] {
  if (card.kind === 'recruit' && recruit && team.length < MAX_TEAM && !team.some((m) => m.playerId === card.playerId)) {
    return [...team, newMemberState(recruit, slotCount, chosen)];
  }
  if (card.kind === 'upgrade') {
    return team.map((m) => (m.playerId !== card.playerId ? m
      : { ...m, levels: { ...m.levels, [card.tech]: Math.min(MAX_TECH_LEVEL, (m.levels[card.tech] ?? 1) + 1) } }));
  }
  if (card.kind === 'learn') {
    return team.map((m) => {
      const free = m.slots.indexOf(null);
      if (m.playerId !== card.playerId || free < 0 || m.slots.includes(card.tech)) return m;
      const slots = [...m.slots];
      slots[free] = card.tech;
      return { ...m, slots, levels: { ...m.levels, [card.tech]: 1 } };
    });
  }
  return team;
}
