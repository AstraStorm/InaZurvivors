/**
 * 1.93 (author): clans. The server keeps the clans, the Juegos del Clan points and the weekly ranking
 * (migration 20261108000000_clans.sql); this file has what the game shows and grants: prizes, missions, the clan items
 * that drop in the Juegos del Clan and the weekly clan shop that spends them.
 */
import type { Rarity, RosterEntry } from '../data/manifest';
import type { SaveData } from './save';

export const CLAN_COST = 15000;
export const CLAN_MAX = 20;
export const CLAN_RUNS_PER_DAY = 3;
export const CLAN_ROLE_LABEL = { lider: 'Líder', oficial: 'Oficial', miembro: 'Miembro' } as const;
export const CLAN_MAP = 'clan';
/** the Juegos del Clan pay half the coins and fichas of a normal match */
export const CLAN_REWARD_MULT = 0.5;

export type ClanTier = 'top1' | 'top3' | 'top8' | 'resto';
/** weekly prizes (the server records coins and fichas for the save's economy cap: same numbers in clan_prize) */
export const CLAN_PRIZES: Record<ClanTier, { label: string; coins: number; tokens: number; players: { n: number; odds: Partial<Record<Rarity, number>>; label: string }[] }> = {
  top1: { label: 'TOP 1', coins: 100000, tokens: 500, players: [{ n: 2, odds: { mitico: 85, leyenda: 15 }, label: 'Mítico o más' }] },
  top3: { label: 'TOP 3', coins: 50000, tokens: 300, players: [{ n: 2, odds: { legendario: 85, mitico: 13, leyenda: 2 }, label: 'Legendario o más' }] },
  top8: { label: 'TOP 8', coins: 25000, tokens: 300, players: [{ n: 1, odds: { legendario: 85, mitico: 13, leyenda: 2 }, label: 'Legendario o más' }, { n: 2, odds: { epico: 85, legendario: 13, mitico: 2 }, label: 'Épico o más' }] },
  resto: { label: 'Resto', coins: 10000, tokens: 100, players: [{ n: 1, odds: { epico: 85, legendario: 13, mitico: 2 }, label: 'Épico o más' }] },
};
export const tierOfPos = (pos: number): ClanTier => (pos === 1 ? 'top1' : pos <= 3 ? 'top3' : pos <= 8 ? 'top8' : 'resto');

/** weekly missions (goals and rewards come from the server; these are the texts) */
export const CLAN_MISSION_TEXT: Record<string, string> = {
  partidas: 'Jugad partidas de los Juegos del Clan',
  victorias: 'Ganad partidas de los Juegos del Clan',
  rivales: 'Derrotad rivales entre todos',
  puntos: 'Sumad puntos esta semana',
  todos: 'Que todo el clan juegue al menos una vez (3 miembros o más)',
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
  const rankBonus = ({ C: 0, B: 1, A: 2, S: 3, X: 5 } as Record<string, number>)[r.rank ?? 'C'] ?? 0;
  const n = Math.min(20, Math.floor(Math.max(0, r.kills) / 60) + (r.victory ? 3 : 0) + rankBonus);
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
  | { id: string; kind: 'pennant'; pennant: string; cost: ClanBag; stock: number }
  | { id: string; kind: 'jugador'; odds: Partial<Record<Rarity, number>>; label: string; rarity: Rarity; cost: ClanBag; stock: number };

/** the clan-exclusive banners and frames (data/pennants.ts, source 'clan'): two of them each week */
export const CLAN_PENNANTS = ['clan-estandarte', 'clan-cerezo', 'marco-clan', 'marco-cerezo'];

function seeded(key: string) {
  let h = 2166136261;
  for (const c of key) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return () => { h = Math.imul(h ^ (h >>> 15), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); h ^= h >>> 16; return (h >>> 0) / 4294967296; };
}
export function clanShop(week: string): ClanOffer[] {
  const rng = seeded(`clan-shop-${week}`);
  const pick = <T,>(a: T[]) => a[Math.floor(rng() * a.length)];
  const p1 = Math.floor(rng() * 2), p2 = 2 + Math.floor(rng() * 2); // one banner, one frame
  return [
    { id: 'monedas-s', kind: 'monedas', coins: pick([5000, 6000, 7500]), cost: { pinchito: 6 }, stock: 3 },
    { id: 'monedas-l', kind: 'monedas', coins: pick([15000, 20000]), cost: { galletas: 6, pinchito: 4 }, stock: 2 },
    { id: 'fichas', kind: 'fichas', tokens: 100, cost: { galletas: 8, nectar: 3 }, stock: 2 },
    { id: 'banner', kind: 'pennant', pennant: CLAN_PENNANTS[p1], cost: { chapa: 2, nectar: 3 }, stock: 1 },
    { id: 'marco', kind: 'pennant', pennant: CLAN_PENNANTS[p2], cost: { chapa: 3, nectar: 2 }, stock: 1 },
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
  clan_daily_limit: 'Ya has jugado tus 3 partidas del clan de hoy.',
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
