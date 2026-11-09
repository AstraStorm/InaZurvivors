/**
 * Fix 1.12: promotional codes. Online, the server decides and records every redemption (migration
 * 20261102000000_promo_codes.sql): one per account, atomic, the Legendario chosen there. Guests redeem on this device
 * only; the code waits in `guestCodes` and, when the guest signs in with Google, the account is marked as redeemed
 * without a second reward (redeem_code with p_already_applied). New codes are rows on the server; guests only know the
 * codes listed in LOCAL_CODES.
 */
import type { Rarity, RosterEntry } from '../data/manifest';
import { grantCopy } from './gacha';
import { givePennant } from './pennants';
import type { SaveData } from './save';

export interface CodeReward { tokens: number; coins: number; player: number | null; eventTokens?: number; /** author: Fichas EG (EGU3RR3R0) */ egTokens?: number; /** 1.81: banners/frames given (hidden to everyone else) */ pennants?: string[] }
export type RedeemStatus = 'ok' | 'used' | 'invalid' | 'error';

/** 1.81: INA483's guaranteed footballer (the server migration 20261106000200_ina483.sql uses the same odds) */
export const INA483_ODDS: Partial<Record<Rarity, number>> = { legendario: 80, mitico: 17, leyenda: 3 };

/** Codes a guest can redeem without a connection (the same reward the server gives). */
export const LOCAL_CODES: Record<string, { tokens: number; coins: number; legendary: boolean; label: string; eventTokens?: number; egTokens?: number;
  /** 1.81: chance of each rarity (percent) for the guaranteed footballer; without it, a Legendario */ odds?: Partial<Record<Rarity, number>>;
  pennants?: string[] }> = {
  // (author) 1.75: thanks to the 50+ people playing: a free ×10 of the Banner de agradecimiento and 10.000 coins
  GRACIAS: { tokens: 0, coins: 10000, eventTokens: 150, legendary: false, label: 'Gracias por jugar: un ×10 gratis del Banner de agradecimiento y 10.000 monedas' },
  // (author) 1.81: 5 ×10 of the Banner de agradecimiento (750 fichas de evento), 20.000 coins, a Legendario or higher
  // for sure (Legendario 80 / Mítico 17 / Leyenda 3, never an event-only footballer), 5 normal ×10 (500 fichas) and its
  // own banner and frame, which nobody without the code ever sees
  INA483: { tokens: 500, coins: 20000, eventTokens: 750, legendary: true, odds: INA483_ODDS, pennants: ['inazuma', 'marco-inazuma'],
    label: '5 tiradas ×10 del Banner de agradecimiento, 5 tiradas ×10 normales, 20.000 monedas, un Legendario o superior y un banner y un marco exclusivos' },
  ASTRA17: { tokens: 72, coins: 500, legendary: true, label: 'Regalo de bienvenida: 10 tiradas, un Legendario y 500 monedas' },
  // (author) 2.0: 3 Fichas EG, once (typed EGu3rr3r0; codes are case-insensitive)
  EGU3RR3R0: { tokens: 0, coins: 0, egTokens: 3, legendary: false, label: '3 Fichas EG para despertar tu primer Espíritu Guerrero' },
};

/** the footballer a code guarantees: rarity by `odds` (Legendario when absent), never an event-only one */
export function codePlayer(roster: RosterEntry[], odds: Partial<Record<Rarity, number>> | undefined, rng: () => number): number | null {
  const pool = (r: Rarity) => roster.filter((p) => p.rarity === r && !p.exclusive);
  let rarity: Rarity = 'legendario';
  if (odds) {
    const open = (Object.entries(odds) as [Rarity, number][]).filter(([r]) => pool(r).length);
    let x = rng() * open.reduce((a, [, w]) => a + w, 0);
    for (const [r, w] of open) { rarity = r; if ((x -= w) < 0) break; }
  }
  const list = pool(rarity).length ? pool(rarity) : roster.filter((p) => p.rarity === 'legendario');
  return list.length ? list[Math.floor(rng() * list.length)].id : null;
}

export const normalizeCode = (c: string) => c.trim().toUpperCase().replace(/\s+/g, '');
export const hasRedeemed = (s: SaveData, code: string) => (s.redeemedCodes ?? []).includes(normalizeCode(code));

export function applyReward(s: SaveData, code: string, r: CodeReward) {
  s.tokens += r.tokens;
  s.coins += r.coins;
  if (r.eventTokens) s.eventTokens = (s.eventTokens ?? 0) + r.eventTokens;
  if (r.egTokens) s.egTokens = (s.egTokens ?? 0) + r.egTokens;
  if (r.player !== null) grantCopy(s, r.player);
  for (const id of r.pennants ?? []) givePennant(s, id);
  (s.redeemedCodes ??= []).push(normalizeCode(code));
}

/** Guest redemption on this device. The Legendario is drawn from the roster with `rng`. */
export function redeemLocal(s: SaveData, code: string, roster: RosterEntry[], rng: () => number = Math.random): { status: RedeemStatus; reward?: CodeReward } {
  const c = normalizeCode(code), def = LOCAL_CODES[c];
  if (!def) return { status: 'invalid' };
  if (hasRedeemed(s, c)) return { status: 'used' };
  const pool = roster.filter((p) => p.rarity === 'legendario');
  const player = !def.legendary ? null : def.odds ? codePlayer(roster, def.odds, rng) : pool.length ? pool[Math.floor(rng() * pool.length)].id : null;
  const reward: CodeReward = { tokens: def.tokens, coins: def.coins, player, ...(def.eventTokens ? { eventTokens: def.eventTokens } : {}), ...(def.egTokens ? { egTokens: def.egTokens } : {}), ...(def.pennants ? { pennants: def.pennants } : {}) };
  applyReward(s, c, reward);
  (s.guestCodes ??= []).push(c);
  return { status: 'ok', reward };
}
