/**
 * 1.8 (author): the GTS, an online bank of footballers like Pokémon's Global Trade Station (migration 20261106000000_gts).
 * A player leaves one spare copy asking for another footballer; whoever has a spare copy of that one can take it at once,
 * and the depositor collects his footballer later. The server is the ledger: here each movement is applied to the save
 * once (save.gts.applied), whenever it is seen (right after the action, or on the next look if the game closed first).
 *   d:<id> a copy left the collection · w:<id> it came back (withdrawn) · r:<id> the footballer asked for arrived
 *   t:<id> as taker: the copy asked for left and the deposited one arrived
 * The copy that travels goes clean: the footballer who stays keeps his training, stars and ascension (author's choice).
 */
import type { RosterEntry } from '../data/manifest';
import type { SaveData } from './save';
import { perkLevel } from './perks';

export const GTS_MAX_SLOTS = 5;
/** deposit slots: 1, +1 per level of the «Ventanilla GTS» upgrade */
export const gtsSlots = (s: SaveData) => Math.min(GTS_MAX_SLOTS, 1 + perkLevel(s, 'gts'));
/** copies beyond the one the player keeps and beyond those spent on ascensions */
export const gtsSpare = (s: SaveData, id: number) => { const o = s.owned[String(id)]; return o ? Math.max(0, o.copies - 1 - (o.spent ?? 0)) : 0; };

/** Leyenda, HÉROE and limited-event footballers never travel (the server checks it too, private.gts_banned) */
export const gtsBanned = (p: Pick<RosterEntry, 'rarity' | 'exclusive'>) => p.rarity === 'leyenda' || !!p.exclusive;
export function canLeave(s: SaveData, p: Pick<RosterEntry, 'id' | 'rarity' | 'exclusive'>): string | null {
  if (gtsBanned(p)) return p.rarity === 'leyenda' ? 'Los Leyenda no se pueden dejar en la GTS.' : 'Los futbolistas de evento no se pueden dejar en la GTS.';
  if (s.owned[String(p.id)]?.hero) return 'Un HÉROE no se puede dejar en la GTS.';
  if (gtsSpare(s, p.id) < 1) return 'Solo puedes dejar copias repetidas: necesitas al menos 2.';
  return null;
}

/** One row of the ledger (public.gts_mine) */
export interface GtsRow { id: number; role: 'deposito' | 'tomado'; give_id: number; want_id: number; status: 'open' | 'traded' | 'withdrawn'; created_at: string; closed_at: string | null; other: string | null }
/** What applying the ledger did, for the animations and messages */
export interface GtsEvent { kind: 'dejado' | 'devuelto' | 'recibido' | 'cambiado'; id: number; left?: number; arrived?: number; other?: string | null }

const add = (s: SaveData, id: number) => {
  const o = s.owned[String(id)];
  if (o) o.copies += 1;
  else s.owned[String(id)] = { stars: 0, copies: 1, obtainedAt: new Date().toISOString() };
};
const remove = (s: SaveData, id: number) => { const o = s.owned[String(id)]; if (o && o.copies > 1) o.copies -= 1; };

/** Applies every movement of the ledger not applied yet; returns what happened (oldest first). */
export function applyGtsLedger(s: SaveData, rows: GtsRow[]): GtsEvent[] {
  const done = new Set(s.gts?.applied ?? []);
  const out: GtsEvent[] = [];
  const mark = (k: string) => { done.add(k); };
  for (const r of [...rows].sort((a, b) => a.created_at.localeCompare(b.created_at) || a.id - b.id)) {
    if (r.role === 'deposito') {
      if (!done.has(`d:${r.id}`)) { remove(s, r.give_id); mark(`d:${r.id}`); out.push({ kind: 'dejado', id: r.id, left: r.give_id }); }
      if (r.status === 'withdrawn' && !done.has(`w:${r.id}`)) { add(s, r.give_id); mark(`w:${r.id}`); out.push({ kind: 'devuelto', id: r.id, arrived: r.give_id }); }
      if (r.status === 'traded' && !done.has(`r:${r.id}`)) { add(s, r.want_id); mark(`r:${r.id}`); out.push({ kind: 'recibido', id: r.id, left: r.give_id, arrived: r.want_id, other: r.other }); }
    } else if (!done.has(`t:${r.id}`)) {
      remove(s, r.want_id); add(s, r.give_id); mark(`t:${r.id}`); out.push({ kind: 'cambiado', id: r.id, left: r.want_id, arrived: r.give_id, other: r.other });
    }
  }
  // the newest 400 marks are enough: the server only lists the last 200 movements
  s.gts = { ...(s.gts ?? {}), applied: [...done].slice(-400) };
  return out;
}

/** Friendly text for the server's refusals */
export function gtsError(e: unknown): string {
  const m = String((e as Error)?.message ?? e);
  if (/gts_no_spare/.test(m)) return 'No tienes una copia repetida de ese futbolista (o aún no se ha guardado en la nube).';
  if (/gts_banned/.test(m)) return 'Los Leyenda, los HÉROE y los futbolistas de evento no se pueden cambiar.';
  if (/gts_slots/.test(m)) return 'No te quedan huecos en la GTS. Mejora la «Ventanilla GTS» en Mejoras para tener más.';
  if (/gts_repeated/.test(m)) return 'Ese cambio ya lo hiciste (o ya tienes ese depósito): no se puede repetir.';
  if (/gts_gone/.test(m)) return 'Alguien se te adelantó: ese depósito ya no está.';
  if (/gts_own/.test(m)) return 'Ese depósito es tuyo.';
  if (/gts_no_save|not_authenticated/.test(m)) return 'Entra con tu cuenta para usar la GTS.';
  return 'No se pudo conectar con la GTS. Inténtalo de nuevo.';
}
