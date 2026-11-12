/**
 * Free weekly pass (Fix 1.11): seven rewards, one per day claimed. A day is a calendar day of the server clock for online
 * players (serverTime.ts) or of the device for guests. Skipping days never loses anything: the pass just waits on the
 * next unclaimed reward; after the seventh, a new cycle starts on the following day. Everything lives in the save, so it
 * travels with the cloud copy and can't be claimed twice on the same day.
 * 2.0 (author: «mejores recompensas»): a day can give several things at once. A week now gives 450 fichas, 17.000 coins
 * and three footballers (Épico+, Legendario+ and a Legendario+ of the team you pick), against 200 fichas, 4.600 coins and
 * three Épico+ before. Day 5 is a «plus» day and day 7 the grand prize.
 */
import type { Rarity, RosterEntry } from '../data/manifest';
import { RARITY_ORDER } from '../data/manifest';
import { MULTI_COST, grantCopy } from './gacha';
import { dayKey } from './missions';
import type { SaveData } from './save';
import { tr } from '../i18n/i18n';

/** what a day gives: fichas, coins and/or a footballer; `kind` is the main one (its art), `tier` marks the big days */
export interface PassReward {
  kind: 'fichas' | 'monedas' | 'jugador';
  label: string;
  fichas: number;
  monedas: number;
  jugador?: { odds: Partial<Record<Rarity, number>>; team: boolean; label: string };
  tier?: 'plus' | 'grand';
}

/** Épico or better (day 2), Legendario or better (day 5), and day 7's Legendario+ from the team you pick */
export const PASS_EPIC = { epico: 70, legendario: 25, mitico: 5 };
export const PASS_LEGEND = { legendario: 85, mitico: 13, leyenda: 2 };
export const PASS_TEAM = { legendario: 70, mitico: 25, leyenda: 5 };

export const PASS: PassReward[] = [
  { kind: 'fichas', fichas: MULTI_COST, monedas: 1000, label: tr('Tirada ×10 y 1.000 monedas') },
  { kind: 'jugador', fichas: 0, monedas: 1000, jugador: { odds: PASS_EPIC, team: false, label: tr('Épico o superior') }, label: tr('Futbolista Épico o superior y 1.000 monedas') },
  { kind: 'monedas', fichas: 50, monedas: 4000, label: tr('4.000 monedas y 50 fichas') },
  { kind: 'fichas', fichas: MULTI_COST * 2, monedas: 0, label: tr('Dos tiradas ×10') },
  { kind: 'jugador', fichas: 0, monedas: 0, jugador: { odds: PASS_LEGEND, team: false, label: tr('Legendario o superior') }, label: tr('Futbolista Legendario o superior'), tier: 'plus' },
  { kind: 'monedas', fichas: 0, monedas: 6000, label: tr('6.000 monedas') },
  { kind: 'jugador', fichas: MULTI_COST, monedas: 5000, jugador: { odds: PASS_TEAM, team: true, label: tr('Legendario o superior de tu equipo') }, label: tr('Legendario o superior del equipo que elijas, tirada ×10 y 5.000 monedas'), tier: 'grand' },
];
/** what a whole cycle gives */
export const PASS_TOTAL = { fichas: PASS.reduce((a, r) => a + r.fichas, 0), monedas: PASS.reduce((a, r) => a + r.monedas, 0), jugadores: PASS.filter((r) => r.jugador).length };

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
  s.tokens += reward.fichas;
  s.coins += reward.monedas;
  if (reward.jugador) {
    // the team pool counts only if it holds a footballer of the rarities the reward can give
    const ok = (pool: RosterEntry[]) => pool.some((p) => (reward.jugador!.odds[p.rarity] ?? 0) > 0);
    const pool = reward.jugador.team && teamPool && ok(teamPool) ? teamPool : roster;
    player = rollPassPlayer(pool, reward.jugador.odds, rng) ?? undefined;
    if (player) grantCopy(s, player.id, player.rarity);
  }
  st.claimed = (st.claimed + 1) % PASS.length;
  st.lastDay = today;
  return { reward, player };
}
