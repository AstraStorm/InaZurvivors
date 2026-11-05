/**
 * Ascension (Fix 1.23: for EVERY footballer, whatever the rarity), paid with DUPLICATES of the same player:
 *   1. ASCENDIDO: one rarity up (Común → Raro → … → Legendario → Mítico; Mítico and Leyenda keep theirs) and a bonus.
 *   2. HÉROE: a state on top of the rarity (never a gacha rarity), with its aura.
 * The cost depends on the base rarity: a given Común comes out about ten times as often as a given Mítico, so it needs
 * more copies and every rarity ascends at a similar pace. Duplicates are copies beyond the first; spent ones are recorded
 * in `spent`, so a copy can never pay twice; stars already earned are kept. The save field is still `ascMitico` (older
 * saves: a Legendario that became Mítico is exactly step 1). The base rarity of the roster is never rewritten.
 *
 * Fix 1.31 (author's request): a Mítico or Leyenda has no rarity to climb, so its ascension IS the HÉROE; and every
 * HÉROE can then earn up to 3 hero stars (★ de héroe) with more duplicates. migrateHeroes131 converts older saves.
 */
import type { Rarity, RosterEntry } from '../data/manifest';
import { RARITY_ORDER } from '../data/manifest';
import type { SaveData } from './save';

export type AscStep = 'ascenso' | 'heroe' | 'estrella' | 'campeon';
/** Mítico and Leyenda have no `ascenso`: their first step is the HÉROE (Fix 1.31). `estrella` = each of the 3 hero stars. */
export const ASC_COSTS: Record<Rarity, Record<'ascenso' | 'heroe' | 'estrella', number>> = {
  // Fix 1.31 (author's request): a few copies for the low rarities, fewer for the high ones (were 12+20 ... 1+3)
  // Fix 1.53 (author): HÉROE costs twice as much for footballers born Común, Raro or Épico (were 10 / 8 / 6)
  comun: { ascenso: 6, heroe: 20, estrella: 10 }, raro: { ascenso: 5, heroe: 16, estrella: 8 }, epico: { ascenso: 4, heroe: 12, estrella: 6 },
  legendario: { ascenso: 2, heroe: 4, estrella: 4 }, mitico: { ascenso: 0, heroe: 2, estrella: 3 }, leyenda: { ascenso: 0, heroe: 1, estrella: 2 },
};
export const HERO_STARS_MAX = 3;
/**
 * 1.8 (author): a Leyenda doesn't become HÉROE: he climbs to Campeón, Campeón+ and Campeón++ (training.ts: +10 to his stat
 * limit, +4 to his stats and +5 training points per level). Duplicates per level:
 */
export const CHAMPION_COSTS = [1, 2, 3];
export const CHAMPION_MAX = 3;
export const CHAMPION_LABEL = ['', 'CAMPEÓN', 'CAMPEÓN+', 'CAMPEÓN++'];
export const championOf = (save: SaveData, id: number) => Math.max(0, Math.min(CHAMPION_MAX, save.owned[String(id)]?.champion ?? 0));
/** rarities whose ascension is the HÉROE itself */
export const isTopRarity = (r: Rarity) => r === 'mitico' || r === 'leyenda';

/** Run bonuses per stage (InaZurvivors balance values); `estrella` applies once per hero star. */
export const ASC_BONUS = { ascenso: { damage: 1.12, hp: 1.08 }, heroe: { damage: 1.18, hp: 1.12 }, estrella: { damage: 1.05, hp: 1.03 }, campeon: { damage: 1.12, hp: 1.08 } } as const;
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
  if (!o) return null;
  // 1.8: a Leyenda climbs Campeón, Campeón+ and Campeón++ instead of HÉROE
  if (p.rarity === 'leyenda') { const c = championOf(save, p.id); return c < CHAMPION_MAX ? { step: 'campeon', cost: CHAMPION_COSTS[c] } : null; }
  const cost = ASC_COSTS[p.rarity] ?? ASC_COSTS.legendario;
  // Fix 1.31: after HÉROE come the hero stars (3 at most), paid with duplicates (1.88: back, 1.84 removed them by mistake)
  if (o.hero) return (o.heroStars ?? 0) < HERO_STARS_MAX ? { step: 'estrella', cost: cost.estrella } : null;
  // Fix 1.51 (author): a footballer climbs one rarity per ascension (Común » Raro » Épico » Legendario » Mítico), each
  // step at the price of the rarity it climbs from, and only at Mítico (or as a Leyenda) comes the HÉROE. Before, any
  // rarity climbed once and then went straight to HÉROE (an Épico never reached Mítico)
  const cur = effectiveRarity(save, p);
  if (isTopRarity(cur)) return { step: 'heroe', cost: cost.heroe };
  return { step: 'ascenso', cost: (ASC_COSTS[cur] ?? cost).ascenso };
}

/** Spends the duplicates and applies the step. Returns false (and changes nothing) when it isn't possible. */
export function ascend(save: SaveData, p: Pick<RosterEntry, 'id' | 'rarity'>): AscStep | false {
  const next = nextStep(save, p);
  if (!next || sparesOf(save, p.id) < next.cost) return false;
  const o = save.owned[String(p.id)];
  o.spent = (o.spent ?? 0) + next.cost;
  if (next.step === 'ascenso') { const cur = effectiveRarity(save, p); o.ascMitico = true; o.ascRarity = rarityUp(cur); }
  else if (next.step === 'heroe') o.hero = true;
  else if (next.step === 'campeon') o.champion = championOf(save, p.id) + 1;
  else o.heroStars = Math.min(HERO_STARS_MAX, (o.heroStars ?? 0) + 1);
  return next.step;
}

/** Damage and HP multipliers a player gets in a run from its ascension (hero stars included). */
export function ascMultipliers(save: SaveData, p: Pick<RosterEntry, 'id' | 'rarity'>) {
  const o = save.owned[String(p.id)];
  let damage = 1, hp = 1;
  if (o?.ascMitico) { damage *= ASC_BONUS.ascenso.damage; hp *= ASC_BONUS.ascenso.hp; }
  if (o?.hero) { damage *= ASC_BONUS.heroe.damage; hp *= ASC_BONUS.heroe.hp; }
  const hs = o?.hero ? Math.min(HERO_STARS_MAX, o.heroStars ?? 0) : 0;
  damage *= ASC_BONUS.estrella.damage ** hs; hp *= ASC_BONUS.estrella.hp ** hs;
  const ch = championOf(save, p.id); // 1.8
  damage *= ASC_BONUS.campeon.damage ** ch; hp *= ASC_BONUS.campeon.hp ** ch;
  return { damage, hp };
}

/**
 * Fix 1.31, once per save: Míticos and Leyendas that took the old first step (an «Ascendido» that kept their rarity)
 * become HÉROE with the duplicates they already spent; those that were HÉROE too turn that second payment into their
 * first hero star. Nothing is lost: the spent copies stay spent, and the bonus is at least what they had.
 */
/**
 * 1.8, once per save: a Leyenda who was already HÉROE becomes Campeón, and his hero stars turn into the next levels
 * (1 star: Campeón+, 2 or 3: Campeón++). The duplicates spent stay spent.
 */
export function migrateChampions18(save: SaveData, roster: Pick<RosterEntry, 'id' | 'rarity'>[]): boolean {
  if (save.champions18) return false;
  for (const p of roster) {
    if (p.rarity !== 'leyenda') continue;
    const o = save.owned[String(p.id)];
    if (!o?.hero) continue;
    o.champion = Math.max(o.champion ?? 0, Math.min(CHAMPION_MAX, 1 + Math.min(2, o.heroStars ?? 0)));
    delete o.hero; delete o.heroStars;
  }
  save.champions18 = true;
  return true; // the flag itself has to be saved even when nothing changed
}

/** Desmodus Drakul (Raro until Fix 1.52, now Legendario) */
export const DRAKUL_ID = 101437;
export const DRAKUL_COPIES = 3;

/**
 * Fix 1.53 (author), once per save: whoever had ascended Drakul while he was Raro gets 3 copies of him, since he is
 * Legendario now. The ascension they paid for stays.
 */
export function compensateDrakul153(save: SaveData): boolean {
  if (save.drakul153) return false;
  const o = save.owned[String(DRAKUL_ID)];
  if (o && (o.ascMitico || o.hero)) o.copies += DRAKUL_COPIES;
  save.drakul153 = true;
  return true; // the flag itself has to be saved even when nothing changed
}

export function migrateHeroes131(save: SaveData, roster: Pick<RosterEntry, 'id' | 'rarity'>[]): boolean {
  if (save.heroes131) return false;
  let changed = 0;
  for (const p of roster) {
    if (!isTopRarity(p.rarity)) continue;
    const o = save.owned[String(p.id)];
    if (!o?.ascMitico) continue;
    if (o.hero) o.heroStars = Math.min(HERO_STARS_MAX, (o.heroStars ?? 0) + 1);
    else o.hero = true;
    delete o.ascMitico; delete o.ascRarity;
    changed++;
  }
  save.heroes131 = true;
  return true; // the flag itself has to be saved even when nothing changed
}

/** 1.85 (author): every owned footballer climbs as many ascension steps as his duplicates pay, in one go. */
export function ascendAll(save: SaveData, roster: Pick<RosterEntry, 'id' | 'rarity'>[]): { id: number; steps: AscStep[] }[] {
  const out: { id: number; steps: AscStep[] }[] = [];
  for (const p of roster) {
    if (!save.owned[String(p.id)]) continue;
    const steps: AscStep[] = [];
    for (let k = 0; k < 10; k++) { const st = ascend(save, p); if (!st) break; steps.push(st); }
    if (steps.length) out.push({ id: p.id, steps });
  }
  return out;
}
/** how many owned footballers could ascend right now */
export const ascendableCount = (save: SaveData, roster: Pick<RosterEntry, 'id' | 'rarity'>[]) =>
  roster.filter((p) => { const n = save.owned[String(p.id)] && nextStep(save, p); return !!n && sparesOf(save, p.id) >= n.cost; }).length;
