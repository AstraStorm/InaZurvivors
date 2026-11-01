/**
 * Fix 1.12: promotional codes. Online, the server decides and records every redemption (migration
 * 20261102000000_promo_codes.sql): one per account, atomic, the Legendario chosen there. Guests redeem on this device
 * only; the code waits in `guestCodes` and, when the guest signs in with Google, the account is marked as redeemed
 * without a second reward (redeem_code with p_already_applied). New codes are rows on the server; guests only know the
 * codes listed in LOCAL_CODES.
 */
import type { RosterEntry } from '../data/manifest';
import { grantCopy } from './gacha';
import type { SaveData } from './save';

export interface CodeReward { tokens: number; coins: number; player: number | null }
export type RedeemStatus = 'ok' | 'used' | 'invalid' | 'error';

/** Codes a guest can redeem without a connection (the same reward the server gives). */
export const LOCAL_CODES: Record<string, { tokens: number; coins: number; legendary: boolean; label: string }> = {
  ASTRA17: { tokens: 72, coins: 500, legendary: true, label: 'Regalo de bienvenida: 10 tiradas, un Legendario y 500 monedas' },
};

export const normalizeCode = (c: string) => c.trim().toUpperCase().replace(/\s+/g, '');
export const hasRedeemed = (s: SaveData, code: string) => (s.redeemedCodes ?? []).includes(normalizeCode(code));

export function applyReward(s: SaveData, code: string, r: CodeReward) {
  s.tokens += r.tokens;
  s.coins += r.coins;
  if (r.player !== null) grantCopy(s, r.player);
  (s.redeemedCodes ??= []).push(normalizeCode(code));
}

/** Guest redemption on this device. The Legendario is drawn from the roster with `rng`. */
export function redeemLocal(s: SaveData, code: string, roster: RosterEntry[], rng: () => number = Math.random): { status: RedeemStatus; reward?: CodeReward } {
  const c = normalizeCode(code), def = LOCAL_CODES[c];
  if (!def) return { status: 'invalid' };
  if (hasRedeemed(s, c)) return { status: 'used' };
  const pool = roster.filter((p) => p.rarity === 'legendario');
  const reward: CodeReward = { tokens: def.tokens, coins: def.coins, player: def.legendary && pool.length ? pool[Math.floor(rng() * pool.length)].id : null };
  applyReward(s, c, reward);
  (s.guestCodes ??= []).push(c);
  return { status: 'ok', reward };
}
