/** v1.65: profile banners — owning, buying, equipping, the two achievement banners and the limited-time event. */
import type { Rarity, RosterEntry } from '../data/manifest';
import { EVENT_POOL, isFrame, PENNANT_BY_ID, PENNANT_EVENT, type PennantDef } from '../data/pennants';
import type { SaveData } from './save';

export const COLLECTION_PENNANT_AT = 200;

export const ownedPennants = (s: SaveData) => s.pennants?.owned ?? [];
export const hasPennant = (s: SaveData, id: string) => ownedPennants(s).includes(id);
export const equippedPennant = (s: SaveData): PennantDef | undefined => {
  const id = s.pennants?.equipped;
  return id && hasPennant(s, id) && !isFrame(PENNANT_BY_ID.get(id)) ? PENNANT_BY_ID.get(id) : undefined;
};
/** v1.65: the avatar frame worn */
export const equippedFrame = (s: SaveData): PennantDef | undefined => {
  const id = s.pennants?.frame;
  return id && hasPennant(s, id) && isFrame(PENNANT_BY_ID.get(id)) ? PENNANT_BY_ID.get(id) : undefined;
};

/** 1.81: hand an owned banner or frame (promo codes) */
export const givePennant = (s: SaveData, id: string) => { if (PENNANT_BY_ID.has(id)) give(s, id); };
/** 1.81: a code's banner or frame only exists for whoever owns it */
export const visiblePennant = (s: SaveData, p: PennantDef) => p.source !== 'codigo' || hasPennant(s, p.id);

function give(s: SaveData, id: string) {
  s.pennants ??= { owned: [] };
  if (!s.pennants.owned.includes(id)) s.pennants.owned.push(id);
}

/** Buys a shop banner with coins; false (and nothing changes) if it is not for sale, already owned or too dear. */
export function buyPennant(s: SaveData, id: string): boolean {
  const p = PENNANT_BY_ID.get(id);
  if (!p || p.source !== 'tienda' || !p.price || hasPennant(s, id) || s.coins < p.price) return false;
  s.coins -= p.price;
  give(s, id);
  return true;
}

/** Equips an owned banner, or takes it off with null. */
export function equipPennant(s: SaveData, id: string | null): boolean {
  if (id !== null && (!hasPennant(s, id) || isFrame(PENNANT_BY_ID.get(id)))) return false;
  s.pennants ??= { owned: [] };
  if (id === null) delete s.pennants.equipped; else s.pennants.equipped = id;
  return true;
}

/** Wears an owned frame, or takes it off with null. */
export function equipFrame(s: SaveData, id: string | null): boolean {
  if (id !== null && (!hasPennant(s, id) || !isFrame(PENNANT_BY_ID.get(id)))) return false;
  s.pennants ??= { owned: [] };
  if (id === null) delete s.pennants.frame; else s.pennants.frame = id;
  return true;
}

/** The achievement banners and frames: 200 footballers, and any Leyenda. Returns the ones just earned. */
export function grantAchievementPennants(s: SaveData, roster: Pick<RosterEntry, 'id' | 'rarity'>[]): PennantDef[] {
  const out: PennantDef[] = [];
  const owned = Object.keys(s.owned);
  const leyenda = roster.some((p) => p.rarity === 'leyenda' && s.owned[String(p.id)]);
  for (const [id, ok] of [['caravana', owned.length >= COLLECTION_PENNANT_AT], ['marco-caravana', owned.length >= COLLECTION_PENNANT_AT], ['once-leyenda', leyenda], ['marco-leyenda', leyenda]] as const) {
    if (ok && !hasPennant(s, id)) { give(s, id); out.push(PENNANT_BY_ID.get(id)!); }
  }
  return out;
}

// ------------------------------------------------------------------ the limited-time event
const DAY = 86_400_000;
export const eventStart = () => Date.parse(PENNANT_EVENT.start);
export const eventEnd = () => eventStart() + PENNANT_EVENT.days * DAY;
export const eventActive = (now: number | Date) => +now >= eventStart() && +now < eventEnd();
export const eventLeftMs = (now: number | Date) => Math.max(0, eventEnd() - +now);

/** Percent chance of each banner of the event (its rarity's share split evenly). */
export function eventOdds(): { def: PennantDef; pct: number }[] {
  return EVENT_POOL.map((def) => {
    const same = EVENT_POOL.filter((p) => p.rarity === def.rarity).length;
    return { def, pct: (PENNANT_EVENT.odds[def.rarity] ?? 0) / same };
  });
}

export interface PennantPull { def: PennantDef; isNew: boolean; refund: number }

/**
 * One or ten pulls of the event, charged in coins before anything is shown. A banner already owned (or drawn twice in
 * the same ×10) gives coins back by rarity. Null when the event is closed or there aren't enough coins.
 */
export function pullEvent(s: SaveData, count: 1 | 10, now: number | Date, rng: () => number = Math.random): PennantPull[] | null {
  const cost = count === 10 ? PENNANT_EVENT.multiCost : PENNANT_EVENT.cost;
  if (!eventActive(now) || s.coins < cost) return null;
  s.coins -= cost;
  const odds = eventOdds();
  const out: PennantPull[] = [];
  for (let k = 0; k < count; k++) {
    let x = rng() * 100, def = odds[odds.length - 1].def;
    for (const o of odds) { x -= o.pct; if (x < 0) { def = o.def; break; } }
    const isNew = !hasPennant(s, def.id);
    const refund = isNew ? 0 : PENNANT_EVENT.refund[def.rarity as Rarity] ?? 0;
    if (isNew) give(s, def.id); else s.coins += refund;
    out.push({ def, isNew, refund });
  }
  return out;
}
