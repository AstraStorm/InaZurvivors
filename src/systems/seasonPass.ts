/**
 * 2.1 (author): the season pass. A season lasts about a month; the ranking season ends with it. Every minute played
 * gives pass EXP, more on higher ranks; 125 levels, and maxing everything takes at least 15-20 runs on the top ranks.
 *
 *   fila normal   opened with the Llave normal, bought in the shop for 15.000 coins
 *   fila premium  opened with the Llave dorada, which only drops in a run: 0,005% for every rival knocked out (×2 in
 *                 co-op); its level 1 is Cronus (Legendario) and its level 100 Super Zanark (Leyenda). 2.1 (author): levels
 *                 101-125 give a copy of Super Zanark every 5 levels — enough for CAMPEÓN+, one short of CAMPEÓN++, which only
 *                 the ranking's top 1 reaches (his prize is one more copy)
 *
 * EXP is earned with or without keys: opening a row lets the player claim every level already reached. What a row pays
 * stays inside the per-level limits the server allows for a claimed level (economy_cap, migration season_pass), so
 * claiming many levels at once never gets clipped. Before the season opens the menu only teases it (silhouettes and
 * the date), like the BlueLock collab.
 */
import type { RosterEntry } from '../data/manifest';
import type { Rank, SaveData, SeasonSave } from './save';
import { addCopy } from './gacha';
import { givePennant, hasPennant } from './pennants';

const DAY = 86_400_000;

export type SeasonReward =
  | { kind: 'monedas'; n: number }
  | { kind: 'fichas'; n: number }
  /** a ×10 pull's worth of fichas */
  | { kind: 'multi' }
  | { kind: 'eg'; n: number }
  | { kind: 'jugador'; id: number }
  | { kind: 'banner'; id: string }
  | { kind: 'marco'; id: string };
export type SeasonTrack = 'normal' | 'premium';

export interface SeasonDef {
  id: string; name: string; subtitle: string;
  /** Madrid times; the server's clock decides */
  start: string; end: string;
  /** level n is index n - 1 */
  normal: SeasonReward[]; premium: SeasonReward[];
  /** the premium row's level 1 and level 100 footballers (teaser silhouettes) */
  stars: number[];
}

export const LEVELS = 125;
export const LEVEL_XP = 140;
/** EXP per minute played, before the rank */
export const XP_PER_MIN = 30;
export const RANK_XP: Record<Rank, number> = { C: 1, B: 1.2, A: 1.45, S: 1.75, X: 2.1, Z: 2.5 };
export const NORMAL_KEY_PRICE = 15_000;
/** chance per rival knocked out of the Llave dorada (0,005%); ×2 in co-op */
export const GOLD_KEY_CHANCE = 0.00005;
export const GOLD_KEY_COOP = 2;
export const MULTI_FICHAS = 100;
/** what one claimed level may pay at most (the server allows exactly this per newly claimed level) */
export const LEVEL_MAX = { fichas: 120, monedas: 6000 };

export const CRONUS_ID = 900400;
export const SUPER_ZANARK_ID = 900401;
/** the Zanark Domain footballers of the normal row (comun/raro ids of the team) */
const ZANARK_DOMAIN = [100949, 100912, 100464, 100517, 100726, 101512, 100457, 100781, 100947, 101591, 102114, 102134, 100485, 100776, 102170];

function season1(): Pick<SeasonDef, 'normal' | 'premium'> {
  const normal: SeasonReward[] = [], premium: SeasonReward[] = [];
  const domainAt = new Map(ZANARK_DOMAIN.map((id, k) => [3 + k * 6, id])); // levels 3, 9, ... 87
  const normalSpecial: Record<number, SeasonReward> = {
    20: { kind: 'banner', id: 'pase-dominio' }, 40: { kind: 'banner', id: 'pase-cuernos' }, 60: { kind: 'marco', id: 'marco-dominio' },
    100: { kind: 'eg', n: 2 }, 125: { kind: 'eg', n: 3 },
  };
  const premiumSpecial: Record<number, SeasonReward> = {
    1: { kind: 'jugador', id: CRONUS_ID }, 25: { kind: 'banner', id: 'todopoderoso' }, 50: { kind: 'jugador', id: 100242 },
    75: { kind: 'marco', id: 'marco-todopoderoso' }, 100: { kind: 'jugador', id: SUPER_ZANARK_ID },
    // his duplicates for the Campeón ascension (1 + 2 = CAMPEÓN+ with two to spare; the ranking's top 1 adds the last one for ++)
    ...Object.fromEntries([105, 110, 115, 120, 125].map((lv) => [lv, { kind: 'jugador', id: SUPER_ZANARK_ID } as SeasonReward])),
  };
  for (let lv = 1; lv <= LEVELS; lv++) {
    normal.push(normalSpecial[lv] ?? (domainAt.has(lv) ? { kind: 'jugador', id: domainAt.get(lv)! }
      : lv % 20 === 10 ? { kind: 'multi' } : lv % 5 === 0 ? { kind: 'fichas', n: 30 } : { kind: 'monedas', n: 1000 }));
    premium.push(premiumSpecial[lv] ?? (lv % 10 === 0 ? { kind: 'eg', n: 1 } : lv % 5 === 0 ? { kind: 'multi' }
      : lv % 2 ? { kind: 'fichas', n: 20 } : { kind: 'monedas', n: 3000 }));
  }
  return { normal, premium };
}

export const SEASONS: SeasonDef[] = [
  { id: 'T1', name: 'Temporada 1', subtitle: 'Soy todopoderoso', start: '2026-11-12T15:00:00+01:00', end: '2026-12-12T15:00:00+01:00',
    ...season1(), stars: [CRONUS_ID, SUPER_ZANARK_ID] },
];

export const seasonStart = (d: SeasonDef) => Date.parse(d.start);
export const seasonEnd = (d: SeasonDef) => Date.parse(d.end);
/** the season open now, if any */
export const activeSeason = (now: number | Date) => SEASONS.find((d) => +now >= seasonStart(d) && +now < seasonEnd(d)) ?? null;
/** the next season not open yet (teaser) */
export const upcomingSeason = (now: number | Date) => SEASONS.filter((d) => +now < seasonStart(d)).sort((a, b) => seasonStart(a) - seasonStart(b))[0] ?? null;
export const daysTo = (at: number, now: number | Date) => Math.max(0, Math.ceil((at - +now) / DAY));

/** the save's pass for this season; a new season starts from zero (keys and levels are per season) */
export function seasonOf(s: SaveData, def: SeasonDef): SeasonSave {
  if (!s.season || s.season.id !== def.id) s.season = { id: def.id, xp: 0, normal: false, gold: false, claimedNormal: [], claimedPremium: [] };
  return s.season;
}

/** 2.1 (author: «haz recompensas buenas»): what the final ranking of a season pays (migration ranking_season, same numbers) */
export interface RankPrize { tier: 'top1' | 'top3' | 'top8' | 'top15' | 'resto'; label: string; from: number; to: number | null; fichas: number; monedas: number; eg: number; pennants: (season: string) => string[]; player: number | null }
export const RANK_PRIZES: RankPrize[] = [
  { tier: 'top1', label: 'Top 1', from: 1, to: 1, fichas: 2500, monedas: 300_000, eg: 15, pennants: (s) => [`${s.toLowerCase()}-campeon`, `marco-${s.toLowerCase()}-campeon`], player: SUPER_ZANARK_ID },
  { tier: 'top3', label: 'Top 2-3', from: 2, to: 3, fichas: 1500, monedas: 180_000, eg: 10, pennants: (s) => [`${s.toLowerCase()}-podio`, `marco-${s.toLowerCase()}-podio`], player: CRONUS_ID },
  { tier: 'top8', label: 'Top 4-8', from: 4, to: 8, fichas: 900, monedas: 100_000, eg: 6, pennants: (s) => [`${s.toLowerCase()}-top8`], player: null },
  { tier: 'top15', label: 'Top 9-15', from: 9, to: 15, fichas: 600, monedas: 60_000, eg: 4, pennants: (s) => [`${s.toLowerCase()}-top15`], player: null },
  { tier: 'resto', label: 'Resto con marca', from: 16, to: null, fichas: 250, monedas: 25_000, eg: 2, pennants: () => [], player: null },
];
/** a season prize handed over by the server (claim_season_rewards) */
export interface SeasonResult { season: string; pos: number; score: number; tier: string; tokens: number; coins: number; eg: number; pennants: string[]; player: number | null }
/** pays it into the save; the footballer goes as a copy (a duplicate when already owned) */
export function payRankPrize(s: SaveData, r: SeasonResult, byId: Map<number, RosterEntry>): { player?: RosterEntry; isNew?: boolean } {
  s.tokens += Math.max(0, Math.floor(r.tokens));
  s.coins += Math.max(0, Math.floor(r.coins));
  s.egTokens = (s.egTokens ?? 0) + Math.max(0, Math.floor(r.eg));
  for (const id of r.pennants ?? []) givePennant(s, id);
  const p = r.player ? byId.get(r.player) : undefined;
  if (!p) return {};
  return { player: p, isNew: addCopy(s, p).isNew };
}
/** pass footballers stay hidden only until the first season opens (afterwards the ranking can give them too) */
export const passPlayersHidden = (now: number | Date) => !SEASONS.some((d) => +now >= seasonStart(d));

export const levelOf = (xp: number) => Math.min(LEVELS, Math.floor(Math.max(0, xp) / LEVEL_XP));
/** EXP into the current level, 0..LEVEL_XP (full at the top) */
export const levelProgress = (xp: number) => levelOf(xp) >= LEVELS ? 1 : (Math.max(0, xp) % LEVEL_XP) / LEVEL_XP;
export const runXp = (timeSec: number, rank: Rank) => Math.max(0, Math.floor((timeSec / 60) * XP_PER_MIN * (RANK_XP[rank] ?? 1)));

/** a finished run (not training): its EXP while a season is open. Returns the EXP and the levels gained. */
export function addRunXp(s: SaveData, timeSec: number, rank: Rank, now: number | Date): { xp: number; from: number; to: number } | null {
  const def = activeSeason(now);
  if (!def) return null;
  const st = seasonOf(s, def), from = levelOf(st.xp), xp = runXp(timeSec, rank);
  st.xp = Math.min(LEVELS * LEVEL_XP, st.xp + xp);
  return { xp, from, to: levelOf(st.xp) };
}

export function buyNormalKey(s: SaveData, now: number | Date): boolean {
  const def = activeSeason(now);
  if (!def) return false;
  const st = seasonOf(s, def);
  if (st.normal || s.coins < NORMAL_KEY_PRICE) return false;
  s.coins -= NORMAL_KEY_PRICE;
  st.normal = true;
  return true;
}

/** the chance per knocked-out rival this run (0 when there is no season or the key is already owned) */
export function goldKeyChance(s: SaveData, now: number | Date, coop: boolean): number {
  const def = activeSeason(now);
  if (!def || seasonOf(s, def).gold) return 0;
  return GOLD_KEY_CHANCE * (coop ? GOLD_KEY_COOP : 1);
}
export function giveGoldKey(s: SaveData, now: number | Date): boolean {
  const def = activeSeason(now);
  if (!def) return false;
  const st = seasonOf(s, def);
  if (st.gold) return false;
  st.gold = true;
  st.goldSeen = false;
  return true;
}

export const rowOpen = (st: SeasonSave, track: SeasonTrack) => track === 'normal' ? st.normal : st.gold;
const claimedOf = (st: SeasonSave, track: SeasonTrack) => track === 'normal' ? st.claimedNormal : st.claimedPremium;
export const canClaim = (st: SeasonSave, track: SeasonTrack, level: number) =>
  rowOpen(st, track) && level >= 1 && level <= levelOf(st.xp) && !claimedOf(st, track).includes(level);
export const claimable = (st: SeasonSave, track: SeasonTrack) =>
  Array.from({ length: levelOf(st.xp) }, (_, k) => k + 1).filter((lv) => canClaim(st, track, lv));

export interface Granted { reward: SeasonReward; player?: RosterEntry; isNew?: boolean; refund?: number }
/** pays one level of one row; null when it can't be claimed */
export function claimLevel(s: SaveData, def: SeasonDef, track: SeasonTrack, level: number, byId: Map<number, RosterEntry>): Granted | null {
  const st = seasonOf(s, def);
  if (!canClaim(st, track, level)) return null;
  const reward = (track === 'normal' ? def.normal : def.premium)[level - 1];
  if (!reward) return null;
  // a footballer not loaded in this session (the game was opened before the season): nothing is spent, it waits
  if (reward.kind === 'jugador' && !byId.has(reward.id)) return null;
  claimedOf(st, track).push(level);
  const out: Granted = { reward };
  switch (reward.kind) {
    case 'monedas': s.coins += reward.n; break;
    case 'fichas': s.tokens += reward.n; break;
    case 'multi': s.tokens += MULTI_FICHAS; break;
    case 'eg': s.egTokens = (s.egTokens ?? 0) + reward.n; break;
    case 'jugador': {
      const p = byId.get(reward.id);
      if (p) { const r = addCopy(s, p); out.player = p; out.isNew = r.isNew; out.refund = r.refund; }
      break;
    }
    case 'banner': case 'marco': out.isNew = !hasPennant(s, reward.id); givePennant(s, reward.id); break;
  }
  return out;
}
