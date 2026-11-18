/**
 * 3.0 (author: «algún minievento para llevarte otra ficha de despertar para la 3.0»): the Desafío del Despertar. The
 * first week of 3.0 (25-11 12:00 → 2-12 12:00, Madrid; the server's clock decides), every arena won on rank A or higher
 * counts; at 5 the save gets one more Moneda de Despertar (ascension.ts awaken: a HÉROE becomes Campeón). Once per save.
 * Training and the Juegos del Clan don't count; co-op and Road matches do.
 */
import { ALIUS_OPEN_AT } from '../data/alius';
import { RANK_ORDER } from './difficulty';
import { awakenCoins } from './ascension';
import type { Rank, SaveData } from './save';

export const AWAKEN_EVENT = { from: ALIUS_OPEN_AT, to: '2026-12-02T12:00:00+01:00', wins: 5, minRank: 'A' as Rank, coins: 1 };
export const awakenEventActive = (now: number | Date) => +now >= Date.parse(AWAKEN_EVENT.from) && +now < Date.parse(AWAKEN_EVENT.to);
export const awakenEventLeftMs = (now: number | Date) => Math.max(0, Date.parse(AWAKEN_EVENT.to) - +now);
export const awakenEventWins = (s: SaveData) => Math.min(AWAKEN_EVENT.wins, s.awakenEv30?.wins ?? 0);
export const awakenEventDone = (s: SaveData) => !!s.awakenEv30?.done;

/** a won arena: counts while the challenge is open; true when this win completes it (the coin is paid here) */
export function recordAwakenWin(s: SaveData, rank: Rank, now: number | Date): boolean {
  if (!awakenEventActive(now) || awakenEventDone(s) || RANK_ORDER.indexOf(rank) < RANK_ORDER.indexOf(AWAKEN_EVENT.minRank)) return false;
  const wins = awakenEventWins(s) + 1;
  s.awakenEv30 = { wins };
  if (wins < AWAKEN_EVENT.wins) return false;
  s.awakenEv30.done = true;
  s.awakenCoins = awakenCoins(s) + AWAKEN_EVENT.coins;
  return true;
}
