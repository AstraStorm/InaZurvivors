/**
 * Player shop. The catalogue is a function of the day (server clock online, serverTime.ts), the profile's seed and the
 * favourite team, rolled once and stored in the save: reopening the menu, reloading or another device with the same cloud
 * save shows the same offers until the day changes. The weekly special keeps for the whole week.
 *
 * Fix 1.12 layout: 6 daily rotation + 2 featured of a higher rarity + 1 of the favourite team + 1 weekly special.
 * Prices follow the 1.11 economy (ECONOMIA_1.11.md): a Legendario is a couple of days of play, a Mítico more than a week,
 * and Míticos only show up now and then in a featured slot. Leyendas are never sold.
 */
import type { Rarity, RosterEntry } from '../data/manifest';
import { grantCopy } from './gacha';
import { dayKey, weekKey } from './missions';
import type { SaveData } from './save';

export const PRICE: Record<Rarity, number> = { comun: 200, raro: 600, epico: 1800, legendario: 6000, mitico: 25000, leyenda: 0 };
export type OfferTag = 'diaria' | 'destacado' | 'favorito' | 'semanal';

/** Weighted rarities of a slot; the first rarity with someone left is used if the rolled one is empty. */
type Slot = { odds: Partial<Record<Rarity, number>>; tag: OfferTag; discount?: number; team?: boolean };
const DAILY: Slot[] = [
  { odds: { comun: 1 }, tag: 'diaria' }, { odds: { comun: 1 }, tag: 'diaria' }, { odds: { raro: 1 }, tag: 'diaria' },
  { odds: { raro: 1 }, tag: 'diaria' }, { odds: { epico: 1 }, tag: 'diaria' }, { odds: { epico: 0.6, raro: 0.4 }, tag: 'diaria' },
  { odds: { legendario: 0.88, mitico: 0.12 }, tag: 'destacado', discount: 10 },
  { odds: { legendario: 0.5, epico: 0.5 }, tag: 'destacado', discount: 10 },
  { odds: { epico: 0.55, legendario: 0.2, raro: 0.25 }, tag: 'favorito', team: true },
];
const WEEKLY: Slot = { odds: { legendario: 0.7, epico: 0.3 }, tag: 'semanal', discount: 30 };
/** daily + featured + favourite + weekly */
export const OFFERS = DAILY.length + 1;
/** bumped when the layout changes: offers rolled with an older layout are rolled again (purchases of the day stay) */
export const SHOP_LAYOUT = 2;

export interface Offer { playerId: number; price: number; discount: number; tag?: OfferTag }

function hash(text: string) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return h >>> 0;
}

function rng(seed: number) {
  let s = seed || 1;
  return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
}

function rollSlot(pool: RosterEntry[], slot: Slot, r: () => number, used: Set<number>, favoriteTeam: string | null): Offer | null {
  const team = slot.team ? pool.filter((p) => favoriteTeam && p.teams.includes(favoriteTeam) && !used.has(p.id)) : [];
  const fav = team.length > 0;
  const from = (fav ? team : pool).filter((p) => p.rarity !== 'leyenda');
  const entries = Object.entries(slot.odds) as [Rarity, number][];
  let x = r() * entries.reduce((a, [, w]) => a + w, 0), rolled = entries[0][0];
  for (const [rar, w] of entries) { x -= w; if (x < 0) { rolled = rar; break; } }
  const order = [rolled, ...entries.map(([rar]) => rar).filter((rar) => rar !== rolled)];
  let options: RosterEntry[] = [];
  for (const rar of order) { options = from.filter((p) => p.rarity === rar && !used.has(p.id)); if (options.length) break; }
  if (!options.length) return null;
  const p = options[Math.floor(r() * options.length)];
  used.add(p.id);
  const discount = slot.discount ?? (r() < 0.15 ? 20 : 0);
  // without a favourite team the slot is an ordinary daily offer
  return { playerId: p.id, price: Math.round(PRICE[p.rarity] * (1 - discount / 100) / 10) * 10, discount, tag: slot.team && !fav ? 'diaria' : slot.tag };
}

export function dailyOffers(pool: RosterEntry[], key: string, seed: number, favoriteTeam: string | null = null, exclude: number[] = []): Offer[] {
  const r = rng(hash(`${key}:${seed}`));
  const used = new Set<number>(exclude);
  return DAILY.map((s) => rollSlot(pool, s, r, used, favoriteTeam)).filter((o): o is Offer => !!o);
}

export function weeklyOffer(pool: RosterEntry[], key: string, seed: number): Offer | null {
  return rollSlot(pool, WEEKLY, rng(hash(`W${key}:${seed}`)), new Set(), null);
}

/** Today's offers plus the weekly special. A new day rolls new daily offers and clears their purchases. */
export function rollDaily(save: SaveData, pool: RosterEntry[], now = new Date()): Offer[] {
  const key = dayKey(now), wk = weekKey(now);
  if (save.weeklyShop?.key !== wk) save.weeklyShop = { key: wk, offer: weeklyOffer(pool, wk, save.shopSeed), bought: false };
  const weekly = save.weeklyShop.offer as Offer | null;
  if (save.daily.key !== key || !save.daily.offers?.length || (save.daily.layout ?? 1) < SHOP_LAYOUT) {
    save.daily = { key, layout: SHOP_LAYOUT, bought: save.daily.key === key ? save.daily.bought : [],
      offers: dailyOffers(pool, key, save.shopSeed, save.favoriteTeam, weekly ? [weekly.playerId] : []) };
  }
  return [...(save.daily.offers as Offer[]), ...(weekly ? [weekly] : [])];
}

export const isBought = (save: SaveData, o: Offer) => (o.tag === 'semanal' ? !!save.weeklyShop?.bought : save.daily.bought.includes(o.playerId));

export function buyOffer(save: SaveData, pool: RosterEntry[], playerId: number, now = new Date()): boolean {
  const offer = rollDaily(save, pool, now).find((o) => o.playerId === playerId);
  if (!offer || isBought(save, offer) || save.coins < offer.price) return false;
  save.coins -= offer.price;
  if (offer.tag === 'semanal') save.weeklyShop!.bought = true;
  else save.daily.bought.push(playerId);
  grantCopy(save, playerId, pool.find((p) => p.id === playerId)?.rarity);
  return true;
}

export const msToNextDay = (now = new Date()) => new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime() - now.getTime();
/** to next Monday 00:00 (weeks start on Monday, as the weekly missions) */
export const msToNextWeek = (now = new Date()) => {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  d.setDate(d.getDate() + ((8 - d.getDay()) % 7 || 7));
  return d.getTime() - now.getTime();
};
