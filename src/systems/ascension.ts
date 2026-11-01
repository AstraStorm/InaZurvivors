/**
 * Ascension: a permanent progression for Legendary and Mythic footballers, paid with DUPLICATES of the same player.
 * HÉROE is a state on top of a player's rarity, never a gacha rarity.
 *   Legendario -> Mítico: 3 duplicates. Mítico (base or ascended) -> Héroe: 5 duplicates.
 * Duplicates are copies beyond the first. Spent ones are recorded in `spent`, so a copy can never pay twice; stars
 * already earned from duplicates are kept. The base rarity of the roster is never rewritten: a later rarity review
 * changes the base, the ascension flags stay.
 */
import type { Rarity, RosterEntry } from '../data/manifest';
import type { SaveData } from './save';

export type AscStep = 'mitico' | 'heroe';
export const ASC_COST: Record<AscStep, number> = { mitico: 3, heroe: 5 };

/** Run bonuses per stage (InaZurvivors balance values). */
export const ASC_BONUS = { mitico: { damage: 1.12, hp: 1.08 }, heroe: { damage: 1.18, hp: 1.12 } } as const;
/** Original InaZurvivors passive of a HÉROE on the pitch (not an official technique). */
export const HERO_AURA = { label: 'Espíritu de héroe', teamDamage: 0.06, description: '+6% de daño a todo el equipo mientras el héroe está en el campo (máximo 2 héroes).' };

export const sparesOf = (save: SaveData, id: number) => {
  const o = save.owned[String(id)];
  return o ? Math.max(0, o.copies - 1 - (o.spent ?? 0)) : 0;
};

export function effectiveRarity(save: SaveData, p: Pick<RosterEntry, 'id' | 'rarity'>): Rarity {
  const o = save.owned[String(p.id)];
  // an ascension is the player's, not the roster's: it survives a later change of the base rarity, up or down
  return o?.ascMitico && (p.rarity === 'comun' || p.rarity === 'raro' || p.rarity === 'epico' || p.rarity === 'legendario') ? 'mitico' : p.rarity;
}

export const isHero = (save: SaveData, id: number) => !!save.owned[String(id)]?.hero;

/** Next ascension step and its cost, or null when the player can't ascend any further (or isn't owned). */
export function nextStep(save: SaveData, p: Pick<RosterEntry, 'id' | 'rarity'>): { step: AscStep; cost: number } | null {
  const o = save.owned[String(p.id)];
  if (!o || o.hero) return null;
  const r = effectiveRarity(save, p);
  if (r === 'legendario') return { step: 'mitico', cost: ASC_COST.mitico };
  if (r === 'mitico' || r === 'leyenda') return { step: 'heroe', cost: ASC_COST.heroe };
  return null;
}

/** Spends the duplicates and applies the step. Returns false (and changes nothing) when it isn't possible. */
export function ascend(save: SaveData, p: Pick<RosterEntry, 'id' | 'rarity'>): AscStep | false {
  const next = nextStep(save, p);
  if (!next || sparesOf(save, p.id) < next.cost) return false;
  const o = save.owned[String(p.id)];
  o.spent = (o.spent ?? 0) + next.cost;
  if (next.step === 'mitico') o.ascMitico = true;
  else o.hero = true;
  return next.step;
}

/** Damage and HP multipliers a player gets in a run from its ascension. */
export function ascMultipliers(save: SaveData, p: Pick<RosterEntry, 'id' | 'rarity'>) {
  const o = save.owned[String(p.id)];
  let damage = 1, hp = 1;
  if (o?.ascMitico) { damage *= ASC_BONUS.mitico.damage; hp *= ASC_BONUS.mitico.hp; }
  if (o?.hero) { damage *= ASC_BONUS.heroe.damage; hp *= ASC_BONUS.heroe.hp; }
  return { damage, hp };
}
