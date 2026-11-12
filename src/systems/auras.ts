/**
 * v1.5: Auras. A footballer (the carrier, any rarity) can carry ONE other footballer of the collection as his Aura,
 * a support card in the spirit of Grand Cross's support slots:
 *   - only Legendario, Mítico or Leyenda (effective rarity, ascension included) can be an Aura;
 *   - an Aura is not a sixth player: it never appears on the pitch except briefly inside a combined technique;
 *   - one copy, one place: an Aura is equipped to one carrier at most, it is not in the squad at the same time, a carrier
 *     can't be anybody's Aura (no chains) and nobody is his own Aura. Equipping consumes nothing.
 *
 * What it gives (all of it computed from the Aura's own stats, never from another Aura, so nothing is recursive):
 *   - stats: its three best stats (ties: the order of STAT_KEYS) add AURA_PCT (15%) of their value to the carrier's same
 *     stats, BOND_PCT (20%) when the pair has a bond (data/auraBonds.ts). bonus = round(auraStat × pct), half up.
 *     The carrier's own stats stay at 99 at most; with the Aura the EFFECTIVE stat goes up to EFFECTIVE_STAT_MAX (120).
 *   - techniques: two of its active techniques are inherited for the run (those its combined techniques need first, then
 *     the strongest), never one the carrier already knows. They are extra repertoire entries, not replacements.
 *   - element: the carrier's techniques of the Aura's element deal AURA_ELEMENT_BONUS more damage. The carrier keeps his
 *     own element (captain synergy and the rest still read that one).
 *   - combined techniques: an Aura counts as a participant of the combined techniques it takes part in (combos.ts).
 */
import { RARITY_ORDER, type Rarity, type RosterEntry, type Technique } from '../data/manifest';
import { AURA_BONDS, BOND_PCT, type AuraBond } from '../data/auraBonds';
import { COMBOS, playsAs } from './combos';
import { effectiveRarity, isHero } from './ascension';
import { STAT_KEYS, playerStats, type StatKey } from './training';
import type { SaveData } from './save';
import { clashWith, sameCharacter } from './identity';
import { tr } from '../i18n/i18n';

export const AURA_PCT = 0.15;
export { BOND_PCT };
export const EFFECTIVE_STAT_MAX = 120;
export const AURA_ELEMENT_BONUS = 0.1;
export const AURA_TECHS = 2;
/** v1.5 balance: an inherited technique is one more active technique for its carrier, so it hits at 85% (BALANCE.md) */
export const AURA_TECH_DAMAGE = 0.85;
export const AURA_RARITIES: Rarity[] = ['legendario', 'mitico', 'leyenda'];
/** author: «chetar a David Evans» (the Leyenda nobody played) — as an Aura he passes ALL his stats, not just the best three */
export const FULL_AURAS = new Set([100773]);
/** how many of the Aura's stats it passes */
export const auraStatCount = (auraId: number) => (FULL_AURAS.has(auraId) ? STAT_KEYS.length : 3);

type Entry = Pick<RosterEntry, 'id' | 'name' | 'rarity' | 'stats' | 'techniques' | 'element'> & { position?: string };

/** Effective rarity is what counts: an Épico ascended to Legendario can be an Aura. */
export const canBeAura = (save: SaveData, p: Pick<RosterEntry, 'id' | 'rarity'>) =>
  RARITY_ORDER.indexOf(effectiveRarity(save, p)) >= RARITY_ORDER.indexOf('legendario');

export const auraOf = (save: SaveData, carrierId: number): number | null => save.auras?.[String(carrierId)] ?? null;
/** The carrier wearing this footballer as Aura, if any. */
export const carrierOf = (save: SaveData, auraId: number): number | null => {
  for (const [k, v] of Object.entries(save.auras ?? {})) if (v === auraId) return Number(k);
  return null;
};

export function bondOf(a: number, b: number): AuraBond | null {
  return AURA_BONDS.find((x) => (x.a === a && x.b === b) || (x.a === b && x.b === a)) ?? null;
}

/** Why this Aura can't go on this carrier (null = it can). `squad`: ids of the current squad; `byId` (1.8) checks that the
 *  Aura is not the same character as anyone in the squad or another Aura. */
export function auraProblem(save: SaveData, carrier: Pick<RosterEntry, 'id'>, aura: Pick<RosterEntry, 'id' | 'rarity' | 'name'>, squad: number[] = [],
  byId?: Map<number, Pick<RosterEntry, 'id' | 'name'>>): string | null {
  if (!save.owned[String(carrier.id)] || !save.owned[String(aura.id)]) return tr('Solo puedes usar futbolistas de tu colección.');
  if (carrier.id === aura.id) return tr('Un futbolista no puede ser su propia Aura.');
  if (!canBeAura(save, aura)) return tr('Solo los Legendarios, Míticos y Leyendas pueden ser Aura.');
  if (save.auras?.[String(aura.id)] !== undefined) return tr('{auraName} ya lleva un Aura: las Auras no se encadenan.', { auraName: aura.name });
  if (carrierOf(save, carrier.id) !== null) return tr('Este futbolista ya es el Aura de otro: no puede llevar una.');
  if (squad.includes(aura.id) && squad[0] === aura.id) return tr('{auraName} es tu capitán: elige otro capitán antes.', { auraName: aura.name });
  if (byId) { // 1.8: no two of the same character, as Auras either
    const others = [...squad.filter((x) => x !== aura.id), ...Object.entries(save.auras ?? {}).filter(([c, a]) => Number(c) !== carrier.id && a !== aura.id).map(([, a]) => a)];
    const clash = clashWith(aura, [carrier.id, ...others].map((x) => byId.get(x)).filter((x): x is Pick<RosterEntry, 'id' | 'name'> => !!x));
    if (clash) return tr('{auraName} es el mismo personaje que {clashName}: no pueden estar los dos en tu equipo.', { auraName: aura.name, clashName: clash.name });
  }
  return null;
}

/**
 * Equips an Aura. An Aura that was on another carrier moves (one copy, one place); one that was in the squad leaves it.
 * Returns the problem instead when it isn't allowed.
 */
export function equipAura(save: SaveData, carrier: Pick<RosterEntry, 'id'>, aura: Pick<RosterEntry, 'id' | 'rarity' | 'name'>, byId?: Map<number, Pick<RosterEntry, 'id' | 'name'>>): { ok: true; movedFrom: number | null; leftSquad: boolean } | { ok: false; why: string } {
  const why = auraProblem(save, carrier, aura, [save.captainId ?? -1, ...save.squad], byId);
  if (why) return { ok: false, why };
  const auras = { ...(save.auras ?? {}) };
  const movedFrom = carrierOf(save, aura.id);
  if (movedFrom !== null) delete auras[String(movedFrom)];
  auras[String(carrier.id)] = aura.id;
  save.auras = auras;
  const leftSquad = save.squad.includes(aura.id);
  if (leftSquad) save.squad = save.squad.filter((x) => x !== aura.id);
  return { ok: true, movedFrom, leftSquad };
}

export function removeAura(save: SaveData, carrierId: number) {
  if (!save.auras?.[String(carrierId)]) return false;
  const auras = { ...save.auras };
  delete auras[String(carrierId)];
  save.auras = auras;
  return true;
}

/** A footballer going into the squad stops being an Aura (he can't be in two places). */
export function releaseAsAura(save: SaveData, id: number) {
  const c = carrierOf(save, id);
  if (c !== null) removeAura(save, c);
  return c;
}

/**
 * Drops links that are no longer valid (not owned, not Legendario+, chains, duplicates, self or his other version). Run at load and after a
 * cloud load; returns how many were dropped.
 */
export function sanitizeAuras(save: SaveData, byId: Map<number, Pick<RosterEntry, 'id' | 'rarity' | 'name'>>): number {
  const src = save.auras ?? {};
  const out: Record<string, number> = {};
  const used = new Set<number>(), carriers = new Set<number>();
  let dropped = 0;
  // same order and rules as the save validation (save.ts), plus the roster checks: the first legal link stays
  const keys = Object.keys(src).sort((a, b) => Number(a) - Number(b));
  for (const k of keys) {
    const c = Number(k), a = src[k], carrier = byId.get(c), aura = byId.get(a);
    const ok = carrier && aura && save.owned[k] && save.owned[String(a)] && c !== a && !used.has(a) && !carriers.has(a) && !used.has(c) && canBeAura(save, aura)
      && !sameCharacter(carrier, aura); // author: never his own other version (Wolfram with Vulpeen MM)
    if (ok) { out[k] = a; used.add(a); carriers.add(c); } else dropped++;
  }
  // an Aura that is also in the squad leaves the squad
  save.squad = save.squad.filter((id) => !used.has(id));
  save.auras = out;
  return dropped;
}

/** The Aura's own stats: its progression only (rarity, ascension, HÉROE, training), never another Aura. */
export const auraOwnStats = (save: SaveData, aura: Entry) => playerStats(save, aura, effectiveRarity(save, aura), isHero(save, aura.id));

/** Its three best stats, highest first; ties keep the order of STAT_KEYS (deterministic). */
export function topStats(stats: Record<StatKey, number>, n = 3): StatKey[] {
  return [...STAT_KEYS].map((k, i) => ({ k, v: stats[k] ?? 0, i })).sort((a, b) => b.v - a.v || a.i - b.i).slice(0, n).map((x) => x.k);
}

export interface AuraBonus {
  auraId: number;
  pct: number;
  bond: AuraBond | null;
  keys: StatKey[];
  /** points added to each stat (only the three keys are present) */
  add: Partial<Record<StatKey, number>>;
  /** the Aura's own value of each of those stats */
  from: Partial<Record<StatKey, number>>;
}

export function auraBonus(save: SaveData, carrierId: number, aura: Entry): AuraBonus {
  const own = auraOwnStats(save, aura);
  const bond = bondOf(carrierId, aura.id);
  const pct = bond ? BOND_PCT : AURA_PCT;
  const keys = topStats(own, auraStatCount(aura.id));
  const add: Partial<Record<StatKey, number>> = {}, from: Partial<Record<StatKey, number>> = {};
  for (const k of keys) { from[k] = own[k]; add[k] = Math.round(own[k] * pct); }
  return { auraId: aura.id, pct, bond, keys, add, from };
}

/** Effective stats: own stats (≤ 99) plus the Aura's points, each capped at 120. */
export function withAura(base: Record<StatKey, number>, b: AuraBonus | null): Record<StatKey, number> {
  if (!b) return base;
  const out = { ...base };
  for (const k of b.keys) out[k] = Math.min(Math.max(EFFECTIVE_STAT_MAX, base[k]), base[k] + (b.add[k] ?? 0)); // 1.8: a Campeón may already be above 120
  return out;
}

/**
 * The two techniques the carrier inherits: first those a combined technique of the Aura needs (so Shawn as Aura brings
 * Ventisca eterna for Fuego cruzado), then the strongest. Talents (passives) and moves the carrier already has are left out.
 */
export function inheritedTechs(carrier: Pick<RosterEntry, 'techniques'>, aura: Pick<RosterEntry, 'name' | 'techniques'>): Technique[] {
  const known = new Set(carrier.techniques.map((t) => t.name.toLowerCase()));
  const needed = new Set(COMBOS.flatMap((c) => c.needs.filter((n) => playsAs(aura.name, n.player) && n.tech).map((n) => n.tech!.toLowerCase())));
  const pool = aura.techniques.filter((t) => t.type !== 'talento' && !known.has(t.name.toLowerCase()));
  const seen = new Set<string>();
  return [...pool].sort((a, b) => Number(needed.has(b.name.toLowerCase())) - Number(needed.has(a.name.toLowerCase())) || (b.power ?? 0) - (a.power ?? 0))
    .filter((t) => !seen.has(t.name.toLowerCase()) && seen.add(t.name.toLowerCase())).slice(0, AURA_TECHS);
}

/** What a run needs to know about a carrier's Aura. */
export interface AuraLink { id: number; name: string; element: string | null; rarity: Rarity; pct: number; bond: string | null; techs: string[] }

/**
 * The carrier as the run sees him: effective stats (with the Aura), the inherited techniques appended to the repertoire
 * (marked with `aura`, learnable from the start) and the link itself. Nothing is written to the save.
 */
export function carrierForRun<T extends Entry & { techniques: Technique[] }>(save: SaveData, carrier: T, stats: Record<StatKey, number> | null, aura: Entry | undefined): T & { aura?: AuraLink } {
  if (!aura) return carrier;
  const b = auraBonus(save, carrier.id, aura);
  const inherited = inheritedTechs(carrier, aura).map((t) => ({ ...t, unlockLevel: 1, aura: aura.id }));
  return {
    ...carrier,
    stats: stats ? withAura(stats, b) : carrier.stats,
    techniques: [...carrier.techniques, ...inherited],
    aura: { id: aura.id, name: aura.name, element: aura.element === null || aura.element === undefined ? null : String(aura.element), rarity: effectiveRarity(save, aura), pct: b.pct, bond: b.bond?.reason ?? null, techs: inherited.map((t) => t.name) },
  };
}
