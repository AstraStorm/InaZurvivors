/**
 * 1.93 (author): clans. The server keeps the clans, the Juegos del Clan points and the weekly ranking
 * (migration 20261108000000_clans.sql); this file has what the game shows and grants: prizes, missions, the clan items
 * that drop in the Juegos del Clan and the weekly clan shop that spends them.
 */
import type { Rarity, RosterEntry } from '../data/manifest';
import type { SaveData } from './save';

export const CLAN_COST = 15000;
export const CLAN_MAX = 20;
export const CLAN_RUNS_PER_DAY = 1; // (author) was 3; the server limits it too (20261110000000_rank_z.sql)
export const CLAN_ROLE_LABEL = { lider: 'Líder', oficial: 'Oficial', miembro: 'Miembro' } as const;
export const CLAN_MAP = 'clan';
/** (author) with 1 clan match a day it pays like a normal match (it was half when there were 3) */
export const CLAN_REWARD_MULT = 1;

export type ClanTier = 'top1' | 'top3' | 'top8' | 'resto';
/** weekly prizes (the server records coins and fichas for the save's economy cap: same numbers in clan_prize) */
export const CLAN_PRIZES: Record<ClanTier, { label: string; coins: number; tokens: number; /** author: Fichas EG */ eg: number; players: { n: number; odds: Partial<Record<Rarity, number>>; label: string }[] }> = {
  top1: { label: 'TOP 1', coins: 100000, tokens: 500, eg: 12, players: [{ n: 2, odds: { mitico: 85, leyenda: 15 }, label: 'Mítico o más' }] },
  top3: { label: 'TOP 3', coins: 50000, tokens: 300, eg: 8, players: [{ n: 2, odds: { legendario: 85, mitico: 13, leyenda: 2 }, label: 'Legendario o más' }] },
  top8: { label: 'TOP 8', coins: 25000, tokens: 300, eg: 5, players: [{ n: 1, odds: { legendario: 85, mitico: 13, leyenda: 2 }, label: 'Legendario o más' }, { n: 2, odds: { epico: 85, legendario: 13, mitico: 2 }, label: 'Épico o más' }] },
  resto: { label: 'Resto', coins: 10000, tokens: 100, eg: 2, players: [{ n: 1, odds: { epico: 85, legendario: 13, mitico: 2 }, label: 'Épico o más' }] },
};
export const tierOfPos = (pos: number): ClanTier => (pos === 1 ? 'top1' : pos <= 3 ? 'top3' : pos <= 8 ? 'top8' : 'resto');

/** weekly missions (goals and rewards come from the server; these are the texts) */
export const CLAN_MISSION_TEXT: Record<string, string> = {
  partidas: 'Jugad partidas de los Juegos del Clan',
  victorias: 'Ganad partidas de los Juegos del Clan',
  rivales: 'Derrotad rivales entre todos',
  puntos: 'Sumad puntos esta semana',
  todos: 'Que todo el clan juegue al menos una vez (3 miembros o más)',
  constancia: 'Jugad en 5 días distintos de la semana',
  ganadores: 'Que 3 miembros distintos ganen su partida',
};

// ---- clan items: ROM objects (icon codes of the items atlas) that drop only in the Juegos del Clan
export type ClanItemId = 'pinchito' | 'galletas' | 'nectar' | 'chapa' | 'artefacto';
export const CLAN_ITEMS: { id: ClanItemId; name: string; icon: number; rarity: Rarity; weight: number }[] = [
  { id: 'pinchito', name: 'Pinchito supremo', icon: 305, rarity: 'comun', weight: 45 },
  { id: 'galletas', name: 'Galletas de ciervo', icon: 1110, rarity: 'raro', weight: 30 },
  { id: 'nectar', name: 'Néctar', icon: 1217, rarity: 'epico', weight: 15 },
  { id: 'chapa', name: 'Chapa vieja', icon: 1121, rarity: 'legendario', weight: 8 },
  { id: 'artefacto', name: 'Artefacto raro', icon: 1213, rarity: 'mitico', weight: 2 },
];
export const CLAN_ITEM_BY_ID = new Map(CLAN_ITEMS.map((x) => [x.id, x]));
export type ClanBag = Partial<Record<ClanItemId, number>>;

/** what a clan match drops: one item per 60 rivals, 3 more for winning, more for a harder rank (at most 20) */
export function clanDrops(r: { kills: number; victory: boolean; rank?: string }, rng: () => number): ClanBag {
  const rankBonus = ({ C: 0, B: 1, A: 2, S: 3, X: 5, Z: 8 } as Record<string, number>)[r.rank ?? 'C'] ?? 0;
  // (author) 1 match a day: three times the items of a match (they were made for 3 a day)
  const n = Math.min(60, 3 * (Math.floor(Math.max(0, r.kills) / 60) + (r.victory ? 3 : 0) + rankBonus));
  const out: ClanBag = {};
  const total = CLAN_ITEMS.reduce((a, x) => a + x.weight, 0);
  for (let i = 0; i < n; i++) {
    let x = rng() * total;
    const it = CLAN_ITEMS.find((c) => (x -= c.weight) < 0) ?? CLAN_ITEMS[0];
    out[it.id] = (out[it.id] ?? 0) + 1;
  }
  return out;
}
export function addBag(save: SaveData, bag: ClanBag) {
  const own = (save.clanItems ??= {});
  for (const [k, v] of Object.entries(bag)) own[k as ClanItemId] = Math.max(0, (own[k as ClanItemId] ?? 0) + (v ?? 0));
}
export const canPay = (save: SaveData, cost: ClanBag) => Object.entries(cost).every(([k, v]) => (save.clanItems?.[k as ClanItemId] ?? 0) >= (v ?? 0));

// ---- weekly clan shop (Monday 00:00 Madrid, like the clan week)
/** the Monday (YYYY-MM-DD, Madrid) of the week of this moment */
export function clanWeekKey(now: Date): string {
  const madrid = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Madrid' }));
  const day = (madrid.getDay() + 6) % 7; // Monday 0
  madrid.setDate(madrid.getDate() - day);
  return `${madrid.getFullYear()}-${String(madrid.getMonth() + 1).padStart(2, '0')}-${String(madrid.getDate()).padStart(2, '0')}`;
}
/** milliseconds until the next Monday 00:00 in Madrid */
export function clanWeekLeftMs(now: Date): number {
  const madrid = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Madrid' }));
  const next = new Date(madrid); next.setHours(24 * (7 - ((madrid.getDay() + 6) % 7)), 0, 0, 0);
  return next.getTime() - madrid.getTime();
}

export type ClanOffer =
  | { id: string; kind: 'monedas'; coins: number; cost: ClanBag; stock: number }
  | { id: string; kind: 'fichas'; tokens: number; cost: ClanBag; stock: number }
  | { id: string; kind: 'eg'; egTokens: number; cost: ClanBag; stock: number }
  | { id: string; kind: 'pennant'; pennant: string; cost: ClanBag; stock: number }
  | { id: string; kind: 'jugador'; odds: Partial<Record<Rarity, number>>; label: string; rarity: Rarity; cost: ClanBag; stock: number };

/**
 * 1.94 (author: «each week I'll tell you»): the clan-exclusive banners and frames (data/pennants.ts, source 'clan') on sale
 * each week, by its Monday (clanWeekKey). A week not listed sells CLAN_SHOP_DEFAULT.
 */
export const CLAN_SHOP_WEEKS: Record<string, string[]> = {
  '2026-11-02': ['marco-cerezo'],
};
export const CLAN_SHOP_DEFAULT: string[] = ['marco-cerezo'];
export const clanShopPennants = (week: string) => CLAN_SHOP_WEEKS[week] ?? CLAN_SHOP_DEFAULT;
/** author: a Ficha EG in the clan shop, at most CLAN_EG_STOCK a week */
export const CLAN_EG_STOCK = 6;
export const CLAN_EG_COST: ClanBag = { nectar: 2, chapa: 1 };
/** what they cost: a frame a little more than a banner */
const PENNANT_COST = { banner: { chapa: 2, nectar: 3 }, marco: { chapa: 3, nectar: 2 } };

function seeded(key: string) {
  let h = 2166136261;
  for (const c of key) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return () => { h = Math.imul(h ^ (h >>> 15), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); h ^= h >>> 16; return (h >>> 0) / 4294967296; };
}
export function clanShop(week: string): ClanOffer[] {
  const rng = seeded(`clan-shop-${week}`);
  const pick = <T,>(a: T[]) => a[Math.floor(rng() * a.length)];
  return [
    { id: 'monedas-s', kind: 'monedas', coins: pick([5000, 6000, 7500]), cost: { pinchito: 6 }, stock: 3 },
    { id: 'monedas-l', kind: 'monedas', coins: pick([15000, 20000]), cost: { galletas: 6, pinchito: 4 }, stock: 2 },
    { id: 'fichas', kind: 'fichas', tokens: 100, cost: { galletas: 8, nectar: 3 }, stock: 2 },
    // author: Fichas EG, one per purchase, 6 a week at most
    { id: 'eg', kind: 'eg', egTokens: 1, cost: CLAN_EG_COST, stock: CLAN_EG_STOCK },
    ...clanShopPennants(week).map((id): ClanOffer => ({ id: `pn-${id}`, kind: 'pennant', pennant: id, cost: id.startsWith('marco-') ? PENNANT_COST.marco : PENNANT_COST.banner, stock: 1 })),
    { id: 'epico', kind: 'jugador', rarity: 'epico', label: 'Épico o más', odds: { epico: 90, legendario: 9, mitico: 1 }, cost: { pinchito: 10, galletas: 5 }, stock: 2 },
    { id: 'legendario', kind: 'jugador', rarity: 'legendario', label: 'Legendario o más', odds: { legendario: 90, mitico: 9, leyenda: 1 }, cost: { nectar: 5, chapa: 2 }, stock: 1 },
    { id: 'mitico', kind: 'jugador', rarity: 'mitico', label: 'Mítico o más', odds: { mitico: 92, leyenda: 8 }, cost: { artefacto: 2, chapa: 3 }, stock: 1 },
  ];
}
/** how many of an offer were bought this week (the counter starts over with each new week) */
export function boughtThisWeek(save: SaveData, week: string, id: string) {
  return save.clanShop?.week === week ? save.clanShop.bought[id] ?? 0 : 0;
}
export function recordBuy(save: SaveData, week: string, id: string) {
  if (save.clanShop?.week !== week) save.clanShop = { week, bought: {} };
  save.clanShop!.bought[id] = (save.clanShop!.bought[id] ?? 0) + 1;
}
export function payBag(save: SaveData, cost: ClanBag) {
  for (const [k, v] of Object.entries(cost)) save.clanItems![k as ClanItemId] = (save.clanItems![k as ClanItemId] ?? 0) - (v ?? 0);
}

// ---- names (the server decides; this only spares a round trip for the obvious cases)
export const CLAN_NAME_RE = /^[A-Za-z0-9ÁÉÍÓÚÜÑáéíóúüñ _.-]{3,20}$/;
export function clanNameProblem(name: string): string | null {
  const n = name.trim().replace(/\s+/g, ' ');
  if (!CLAN_NAME_RE.test(n) || !/[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/.test(n)) return 'De 3 a 20 letras, números, espacios, puntos o guiones';
  return null;
}
export const CLAN_ERRORS: Record<string, string> = {
  invalid_clan_name: 'Nombre no válido: de 3 a 20 letras, números, espacios, puntos o guiones.',
  banned_clan_name: 'Ese nombre no está permitido. Elige otro.',
  clan_name_taken: 'Ya hay un clan con ese nombre.',
  already_in_clan: 'Ya estás en un clan.',
  clan_full: 'Ese clan está lleno (20 miembros).',
  clan_not_found: 'Ese clan ya no existe.',
  not_leader: 'Tu rango en el clan no permite hacer eso.',
  no_username: 'Reserva tu nombre en Perfil antes de entrar en un clan.',
  clan_daily_limit: 'Ya has jugado tu partida del clan de hoy: vuelve mañana.',
  not_in_clan: 'No estás en ningún clan.',
  play_first: 'Juega al menos una partida del clan esta semana para cobrar las misiones.',
  mission_not_done: 'Esa misión aún no está completa.',
  already_claimed: 'Ya cobraste esa misión.',
  too_many_requests: 'Ya tienes 3 solicitudes pendientes: cancela alguna.',
  invalid_role: 'Rango no válido.',
};
export const clanError = (m: string) => Object.entries(CLAN_ERRORS).find(([k]) => m.includes(k))?.[1] ?? 'No se pudo hacer ahora. Prueba otra vez.';

/** a random footballer for a clan prize or shop offer (never exclusives) */
export function clanPlayer(roster: RosterEntry[], odds: Partial<Record<Rarity, number>>, rng: () => number): RosterEntry | null {
  const pool = (r: Rarity) => roster.filter((p) => p.rarity === r && !p.exclusive);
  const open = (Object.entries(odds) as [Rarity, number][]).filter(([r]) => pool(r).length);
  if (!open.length) return null;
  let x = rng() * open.reduce((a, [, w]) => a + w, 0), rarity = open[0][0];
  for (const [r, w] of open) { rarity = r; if ((x -= w) < 0) break; }
  const list = pool(rarity);
  return list[Math.floor(rng() * list.length)] ?? null;
}
