/**
 * Daily player shop. The catalogue is a function of the local date and the profile's seed, rolled once per day and
 * stored in the save: reopening the menu, reloading or a new roster can't change it until the date changes. Local only: anything competitive would need the server to validate it.
 */
import type { Rarity, RosterEntry } from '../data/manifest';
import { grantCopy } from './gacha';
import { dayKey } from './missions';
import type { SaveData } from './save';

export const PRICE: Record<Rarity, number> = { comun: 150, raro: 400, epico: 1200, legendario: 4000, mitico: 12000, leyenda: 40000 };
export const OFFERS = 6;
/** Slots by rarity: mostly affordable, one rare chance at the top. */
const SLOTS: Rarity[][] = [['comun'], ['comun'], ['raro'], ['raro'], ['epico'], ['legendario', 'epico']];

export interface Offer { playerId: number; price: number; discount: number }

function hash(text: string) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return h >>> 0;
}

function rng(seed: number) {
  let s = seed || 1;
  return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
}

export function dailyOffers(pool: RosterEntry[], key: string, seed: number): Offer[] {
  const r = rng(hash(`${key}:${seed}`));
  const used = new Set<number>();
  const out: Offer[] = [];
  for (const rarities of SLOTS) {
    const options = pool.filter((p) => rarities.includes(p.rarity) && !used.has(p.id));
    if (!options.length) continue;
    const p = options[Math.floor(r() * options.length)];
    used.add(p.id);
    const discount = r() < 0.2 ? 25 : 0;
    out.push({ playerId: p.id, price: Math.round(PRICE[p.rarity] * (1 - discount / 100)), discount });
  }
  return out;
}

/** Offers and purchases belong to one day; a new date rolls new offers and clears the purchases. */
export function rollDaily(save: SaveData, pool: RosterEntry[], now = new Date()): Offer[] {
  const key = dayKey(now);
  if (save.daily.key !== key || !save.daily.offers?.length) {
    save.daily = { key, bought: save.daily.key === key ? save.daily.bought : [], offers: dailyOffers(pool, key, save.shopSeed) };
  }
  return save.daily.offers!;
}

export function buyOffer(save: SaveData, pool: RosterEntry[], playerId: number, now = new Date()): boolean {
  const offer = rollDaily(save, pool, now).find((o) => o.playerId === playerId);
  if (!offer || save.daily.bought.includes(playerId) || save.coins < offer.price) return false;
  save.coins -= offer.price;
  save.daily.bought.push(playerId);
  grantCopy(save, playerId);
  return true;
}

export const msToNextDay = (now = new Date()) => new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime() - now.getTime();
