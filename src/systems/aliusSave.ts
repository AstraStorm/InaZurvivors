/**
 * 3.0 Piedra Alius: what the save keeps and the rules that only need the save (no manifest), so save.ts can apply them in
 * validate() without importing the game.
 *
 * - `save.alius` = { stones, unlocked (keys of data/alius.json), day (stones earned today) }.
 * - An unlocked Alius footballer is owned while his original is: his `owned` record is a MIRROR of the original's
 *   (stars, ascension, HÉROE, training...) rebuilt on every validate and store, so he plays with the original's progress
 *   and nothing the player does can split them. The upgrade screens never write to an Alius (ascension/stars/training guard
 *   it too). His repertoire purchases and warrior spirit level mirror the original's the same way.
 * - At most ALIUS_CONFIG.maxEquipped Alius footballers in the squad of seven plus the Auras; extra ones are dropped.
 */
import { ALIUS, ALIUS_BY_ID, ALIUS_BY_KEY, ALIUS_CONFIG, ALIUS_PLAYERS, LINA_COACH, isAliusId } from '../data/alius';
import type { SaveData } from './save';

export interface AliusSave { stones: number; unlocked: string[]; day?: { key: string; got: number } }

/** the save's Alius state, cleaned (known keys once each, whole non-negative stones) */
export function sanitizeAliusState(v: unknown): AliusSave | undefined {
  if (!v || typeof v !== 'object') return undefined;
  const o = v as Record<string, unknown>;
  const stones = Math.max(0, Math.min(1_000_000, Math.floor(Number(o.stones) || 0)));
  const unlocked = [...new Set((Array.isArray(o.unlocked) ? o.unlocked : []).filter((k): k is string => typeof k === 'string' && ALIUS_BY_KEY.has(k)))];
  const d = o.day as Record<string, unknown> | undefined;
  const out: AliusSave = { stones, unlocked };
  if (d && typeof d.key === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d.key)) out.day = { key: d.key, got: Math.max(0, Math.floor(Number(d.got) || 0)) };
  return out;
}

export const aliusState = (s: SaveData): AliusSave => (s.alius ??= { stones: 0, unlocked: [] });
export const aliusStones = (s: SaveData) => s.alius?.stones ?? 0;
export const isUnlocked = (s: SaveData, key: string) => !!s.alius?.unlocked.includes(key);

const clone = <T>(x: T): T => JSON.parse(JSON.stringify(x)) as T;

/**
 * Rebuilds the mirrors: owned record, repertoire purchases and spirit level of every unlocked Alius whose original is
 * owned; removes them for the rest (an Alius is never owned on his own). Lina is owned as a coach while unlocked.
 * Returns whether anything changed.
 */
export function syncAliusOwned(s: SaveData): boolean {
  const before = JSON.stringify([s.owned, s.shop?.techUnlocks, s.keshin, s.coaches]);
  const unlocked = new Set(s.alius?.unlocked ?? []);
  for (const a of ALIUS_PLAYERS) {
    const k = String(a.id), b = String(a.base);
    const base = s.owned?.[b];
    if (!s.owned || typeof s.owned !== 'object') return false;
    if (unlocked.has(a.key) && base) {
      const prev = s.owned[k];
      s.owned[k] = { ...clone(base), copies: 1, spent: undefined, obtainedAt: prev?.obtainedAt ?? new Date().toISOString() };
      delete s.owned[k].spent;
      if (s.shop?.techUnlocks && typeof s.shop.techUnlocks === 'object') { if (Array.isArray(s.shop.techUnlocks[b])) s.shop.techUnlocks[k] = [...s.shop.techUnlocks[b]]; else delete s.shop.techUnlocks[k]; }
      if (s.keshin && typeof s.keshin === 'object') { if (s.keshin[b]) s.keshin[k] = s.keshin[b]; else delete s.keshin[k]; }
    } else {
      if (s.owned) delete s.owned[k];
      if (s.shop?.techUnlocks && typeof s.shop.techUnlocks === 'object') delete s.shop.techUnlocks[k];
      if (s.keshin) delete s.keshin[k];
    }
  }
  // the coach
  const lina = ALIUS.find((a) => a.coach === LINA_COACH)!;
  if (s.coaches && !Array.isArray(s.coaches.owned)) { /* not validated yet (first pass of validate): next pass */ }
  else if (unlocked.has(lina.key)) {
    s.coaches ??= { owned: [] };
    if (!s.coaches.owned.includes(LINA_COACH)) s.coaches.owned.push(LINA_COACH);
  } else if (s.coaches) {
    s.coaches.owned = s.coaches.owned.filter((c) => c !== LINA_COACH);
    if (s.coaches.bench === LINA_COACH) delete s.coaches.bench;
  }
  return before !== JSON.stringify([s.owned, s.shop?.techUnlocks, s.keshin, s.coaches]);
}

/** Alius footballers among these ids (each version once) */
export const aliusIn = (ids: Iterable<number>) => [...new Set([...ids].filter(isAliusId))];

/** the Alius footballers equipped: squad of seven (captain included) and Auras */
export function equippedAlius(s: SaveData): number[] {
  const ids = [s.captainId ?? -1, ...(s.squad ?? []), ...Object.values(s.auras ?? {})];
  return aliusIn(ids);
}

/**
 * Why `id` can't go into the team where `leaving` leaves (null = it can): the Alius limit. An Alius already equipped
 * (moving between the squad and an Aura) never counts twice.
 */
export function aliusCapProblem(s: SaveData, id: number, leaving: number | null = null): string | null {
  if (!isAliusId(id)) return null;
  const now = equippedAlius(s).filter((x) => x !== leaving);
  if (now.includes(id) || now.length < ALIUS_CONFIG.maxEquipped) return null;
  return `Máximo ${ALIUS_CONFIG.maxEquipped} Alius en tu equipo (titulares, banquillo y Auras).`;
}

/** Drops the Alius beyond the limit (squad order first, then Auras by carrier); returns how many left. Saved teams too. */
export function trimAliusCap(s: SaveData): number {
  let dropped = 0;
  const trim = (squad: number[], auras: Record<string, number> | undefined) => {
    const seen = new Set<number>();
    const keep = (id: number) => { if (!isAliusId(id) || seen.has(id)) return true; if (seen.size >= ALIUS_CONFIG.maxEquipped) { dropped++; return false; } seen.add(id); return true; };
    const sq = squad.filter(keep);
    const au: Record<string, number> = {};
    for (const [c, a] of Object.entries(auras ?? {}).sort((x, y) => Number(x[0]) - Number(y[0]))) if (sq.includes(Number(c)) || !squad.includes(Number(c))) { if (keep(a)) au[c] = a; }
    return { sq, au };
  };
  const live = [s.captainId, ...(s.squad ?? [])].filter((x, i, a): x is number => x !== null && x !== undefined && a.indexOf(x) === i);
  const t = trim(live, s.auras);
  if (t.sq.length !== live.length) { s.squad = t.sq; if (s.captainId !== null && !t.sq.includes(s.captainId)) s.captainId = t.sq[0] ?? null; }
  if (s.auras) s.auras = t.au;
  for (const q of s.squads ?? []) { const r = trim(q.squad, q.auras); q.squad = r.sq; if (q.auras) q.auras = r.au; }
  return dropped;
}

export type UnlockResult = { ok: true; key: string } | { ok: false; why: string };
/**
 * Unlocks a transformation: all checks first, then stones and the key change together (nothing is spent when it fails, a
 * key is never paid twice). `baseOwned` and `extraOk` (Lina's requirement) come from the caller, which knows the roster.
 */
export function unlockAlius(s: SaveData, key: string, baseOwned: boolean, cost = ALIUS_CONFIG.unlockCost): UnlockResult {
  const a = ALIUS_BY_KEY.get(key);
  if (!a) return { ok: false, why: 'Transformación desconocida.' };
  const st = aliusState(s);
  if (st.unlocked.includes(key)) return { ok: false, why: 'Ya está desbloqueada.' };
  if (!baseOwned) return { ok: false, why: a.coach ? 'Todavía no cumples el requisito de Lina Schiller.' : `Necesitas a ${a.baseName.trim()} en tu colección.` };
  if (!Number.isInteger(cost) || cost < 0 || st.stones < cost) return { ok: false, why: `Te faltan Piedras Alius (${st.stones}/${cost}).` };
  st.stones -= cost;
  st.unlocked.push(key);
  syncAliusOwned(s);
  return { ok: true, key };
}
/** puts a failed write back exactly as it was (the caller's storeSave failed) */
export function undoUnlock(s: SaveData, key: string, cost = ALIUS_CONFIG.unlockCost) {
  const st = aliusState(s);
  if (!st.unlocked.includes(key)) return;
  st.unlocked = st.unlocked.filter((k) => k !== key);
  st.stones += cost;
  syncAliusOwned(s);
}

/** Piedras Alius for a won arena (ALIUS_CONFIG.stones), at most dailyCap per day of `day` (YYYY-MM-DD, server clock). */
export function awardAliusStones(s: SaveData, r: { victory: boolean; rank?: string }, day: string): number {
  if (!r.victory) return 0;
  const want = ALIUS_CONFIG.stones.perWin[r.rank ?? 'C'] ?? 0;
  if (want <= 0) return 0;
  const st = aliusState(s);
  if (st.day?.key !== day) st.day = { key: day, got: 0 };
  const got = Math.max(0, Math.min(want, ALIUS_CONFIG.stones.dailyCap - st.day.got));
  st.day.got += got;
  st.stones += got;
  return got;
}

/** an Alius id's registry entry (or undefined): re-exported for the systems that guard upgrades */
export const aliusEntry = (id: number) => ALIUS_BY_ID.get(id);
