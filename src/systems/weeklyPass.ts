/**
 * Free weekly pass (Fix 1.11): seven rewards, one per day claimed. A day is a calendar day of the server clock for online
 * players (serverTime.ts) or of the device for guests. Skipping days never loses anything: the pass just waits on the
 * next unclaimed reward; after the seventh, a new cycle starts on the following day. Everything lives in the save, so it
 * travels with the cloud copy and can't be claimed twice on the same day.
 * Amounts were set against the 1.11 economy (ECONOMIA_1.11.md): the two ×10 pulls add about 140 fichas a week on top of
 * ~100 from play, the coins about a third of a week's income.
 */
import type { Rarity, RosterEntry } from '../data/manifest';
import { RARITY_ORDER } from '../data/manifest';
import { MULTI_COST, grantCopy } from './gacha';
import { dayKey } from './missions';
import type { SaveData } from './save';

export type PassReward =
  | { kind: 'fichas'; amount: number; label: string }
  | { kind: 'monedas'; amount: number; label: string }
  | { kind: 'jugador'; odds: Partial<Record<Rarity, number>>; team: boolean; label: string };

/** Épico or better: 80% Épico, 18% Legendario, 2% Mítico. Day 7: from a team you pick, with better odds. */
const EPIC_PLUS = { epico: 80, legendario: 18, mitico: 2 };
const TEAM_PLUS = { epico: 62, legendario: 33, mitico: 4, leyenda: 1 };

export const PASS: PassReward[] = [
  { kind: 'fichas', amount: MULTI_COST, label: 'Tirada ×10 (fichas)' },
  { kind: 'jugador', odds: EPIC_PLUS, team: false, label: 'Futbolista Épico o superior' },
  { kind: 'monedas', amount: 1600, label: '1.600 monedas' }, // 1.86: coins doubled
  { kind: 'fichas', amount: MULTI_COST, label: 'Tirada ×10 (fichas)' },
  { kind: 'jugador', odds: EPIC_PLUS, team: false, label: 'Futbolista Épico o superior' },
  { kind: 'monedas', amount: 3000, label: '3.000 monedas' },
  { kind: 'jugador', odds: TEAM_PLUS, team: true, label: 'Épico o superior del equipo que elijas' },
];

export interface PassState { claimed: number; lastDay: string }
export const passState = (s: SaveData): PassState => (s.weeklyPass ??= { claimed: 0, lastDay: '' });

/** 'disponible' once per day; the index is the reward that a claim would give. */
export function passStatus(s: SaveData, now: Date) {
  const st = passState(s);
  const today = dayKey(now);
  const index = st.claimed % PASS.length;
  return { index, available: st.lastDay !== today, today, claimedInCycle: index };
}

export function rollPassPlayer(pool: RosterEntry[], odds: Partial<Record<Rarity, number>>, rng: () => number): RosterEntry | null {
  const present = RARITY_ORDER.filter((r) => (odds[r] ?? 0) > 0 && pool.some((p) => p.rarity === r));
  if (!present.length) return null;
  const total = present.reduce((a, r) => a + (odds[r] ?? 0), 0);
  let x = rng() * total, rarity = present[0];
  for (const r of present) { x -= odds[r] ?? 0; if (x < 0) { rarity = r; break; } }
  const from = pool.filter((p) => p.rarity === rarity);
  return from[Math.floor(rng() * from.length)];
}

/**
 * Claims today's reward. Returns what was given, or null when it was already claimed today (no double claim). For the
 * team reward, `teamPool` is the chosen team's roster; a team without Épicos falls back to the whole roster.
 */
export function claimPass(s: SaveData, roster: RosterEntry[], now: Date, rng: () => number = Math.random, teamPool?: RosterEntry[]):
  { reward: PassReward; player?: RosterEntry } | null {
  const st = passState(s);
  const { index, available, today } = passStatus(s, now);
  if (!available) return null;
  const reward = PASS[index];
  let player: RosterEntry | undefined;
  if (reward.kind === 'fichas') s.tokens += reward.amount;
  else if (reward.kind === 'monedas') s.coins += reward.amount;
  else {
    const pool = reward.team && teamPool?.some((p) => RARITY_ORDER.indexOf(p.rarity) >= RARITY_ORDER.indexOf('epico')) ? teamPool : roster;
    player = rollPassPlayer(pool, reward.odds, rng) ?? undefined;
    if (player) grantCopy(s, player.id, player.rarity);
  }
  st.claimed = (st.claimed + 1) % PASS.length;
  st.lastDay = today;
  return { reward, player };
}
