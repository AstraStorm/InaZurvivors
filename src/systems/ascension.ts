/**
 * Ascension (Fix 1.23: for EVERY footballer, whatever the rarity), paid with DUPLICATES of the same player:
 *   1. ASCENDIDO: one rarity up (Común → Raro → … → Legendario → Mítico; Mítico and Leyenda keep theirs) and a bonus.
 *   2. HÉROE: a state on top of the rarity (never a gacha rarity), with its aura.
 * The cost depends on the base rarity: a given Común comes out about ten times as often as a given Mítico, so it needs
 * more copies and every rarity ascends at a similar pace. Duplicates are copies beyond the first; spent ones are recorded
 * in `spent`, so a copy can never pay twice; stars already earned are kept. The save field is still `ascMitico` (older
 * saves: a Legendario that became Mítico is exactly step 1). The base rarity of the roster is never rewritten.
 */
import type { Rarity, RosterEntry } from '../data/manifest';
import { RARITY_ORDER } from '../data/manifest';
import type { SaveData } from './save';

export type AscStep = 'ascenso' | 'heroe';
export const ASC_COSTS: Record<Rarity, Record<AscStep, number>> = {
  comun: { ascenso: 12, heroe: 20 }, raro: { ascenso: 9, heroe: 15 }, epico: { ascenso: 6, heroe: 10 },
  legendario: { ascenso: 3, heroe: 5 }, mitico: { ascenso: 2, heroe: 4 }, leyenda: { ascenso: 1, heroe: 3 },
};

/** Run bonuses per stage (InaZurvivors balance values). */
export const ASC_BONUS = { ascenso: { damage: 1.12, hp: 1.08 }, heroe: { damage: 1.18, hp: 1.12 } } as const;
/** Original InaZurvivors passive of a HÉROE on the pitch (not an official technique). */
export const HERO_AURA = { label: 'Espíritu de héroe', teamDamage: 0.06, description: '+6% de daño a todo el equipo mientras el héroe está en el campo (máximo 2 héroes).' };

export const sparesOf = (save: SaveData, id: number) => {
  const o = save.owned[String(id)];
  return o ? Math.max(0, o.copies - 1 - (o.spent ?? 0)) : 0;
};

/** The rarity one step up, Mítico at most (Leyenda is its own thing and stays). */
export function rarityUp(r: Rarity): Rarity {
  if (r === 'mitico' || r === 'leyenda') return r;
  return RARITY_ORDER[RARITY_ORDER.indexOf(r) + 1] ?? r;
}

export function effectiveRarity(save: SaveData, p: Pick<RosterEntry, 'id' | 'rarity'>): Rarity {
  // an ascension is the player's, not the roster's: the rarity it reached survives a later change of the base rarity
  const o = save.owned[String(p.id)];
  if (!o?.ascMitico) return p.rarity;
  const reached = o.ascRarity ?? 'mitico'; // older saves: only Legendarios ascended, to Mítico
  return RARITY_ORDER.indexOf(reached) >= RARITY_ORDER.indexOf(p.rarity) ? reached : p.rarity;
}

export const isHero = (save: SaveData, id: number) => !!save.owned[String(id)]?.hero;

/** Next ascension step and its cost, or null when the player can't ascend any further (or isn't owned). */
export function nextStep(save: SaveData, p: Pick<RosterEntry, 'id' | 'rarity'>): { step: AscStep; cost: number } | null {
  const o = save.owned[String(p.id)];
  if (!o || o.hero) return null;
  const cost = ASC_COSTS[p.rarity] ?? ASC_COSTS.legendario;
  // a Mítico that became HÉROE straight away in an older save has no step left; one that didn't starts at step 1
  return o.ascMitico ? { step: 'heroe', cost: cost.heroe } : { step: 'ascenso', cost: cost.ascenso };
}

/** Spends the duplicates and applies the step. Returns false (and changes nothing) when it isn't possible. */
export function ascend(save: SaveData, p: Pick<RosterEntry, 'id' | 'rarity'>): AscStep | false {
  const next = nextStep(save, p);
  if (!next || sparesOf(save, p.id) < next.cost) return false;
  const o = save.owned[String(p.id)];
  o.spent = (o.spent ?? 0) + next.cost;
  if (next.step === 'ascenso') { o.ascMitico = true; o.ascRarity = rarityUp(p.rarity); }
  else o.hero = true;
  return next.step;
}

/** Damage and HP multipliers a player gets in a run from its ascension. */
export function ascMultipliers(save: SaveData, p: Pick<RosterEntry, 'id' | 'rarity'>) {
  const o = save.owned[String(p.id)];
  let damage = 1, hp = 1;
  if (o?.ascMitico) { damage *= ASC_BONUS.ascenso.damage; hp *= ASC_BONUS.ascenso.hp; }
  if (o?.hero) { damage *= ASC_BONUS.heroe.damage; hp *= ASC_BONUS.heroe.hp; }
  return { damage, hp };
}
