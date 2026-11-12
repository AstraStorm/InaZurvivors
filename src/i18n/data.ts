/**
 * 2.3: names of the game's data in the current language. Techniques take the official English dub names (en_tech.json,
 * made by tools/i18n_tech_names.py), then my translations (en_tech_manual.ts); talents their own table. Unknown = as is.
 */
import { getLang } from './i18n';
import EN_TECH from './en_tech.json';
import { EN_TALENTS, EN_TECH_MANUAL } from './en_tech_manual';
import { COMBOS } from '../systems/combos';

const TECH = EN_TECH as Record<string, string>;
/** the combined techniques carry their dub name (ComboDef.en) */
let combos: Record<string, string> | null = null;
const comboEn = () => (combos ??= Object.fromEntries(COMBOS.filter((c) => c.en).map((c) => [c.name, c.en!])));

/** a technique's or talent's name */
export function tTech(name: string): string {
  if (getLang() !== 'en') return name;
  return EN_TALENTS[name] ?? TECH[name] ?? comboEn()[name] ?? EN_TECH_MANUAL[name] ?? name;
}

/** the official English names of the elements; the Spanish ones stay the ids of the code */
const ELEMENTS: Record<string, string> = { Fuego: 'Fire', Aire: 'Wind', Bosque: 'Wood', 'Montaña': 'Earth', Neutro: 'Void' };
export const tEl = (e: string | number | null | undefined) => (getLang() === 'en' ? ELEMENTS[String(e)] ?? String(e ?? '') : String(e ?? ''));
