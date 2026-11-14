/**
 * 2.3: names of the game's data in the current language. Techniques take the official English dub names (en_tech.json,
 * made by tools/i18n_tech_names.py), then my translations (en_tech_manual.ts); talents their own table. Unknown = as is.
 * 2.4: in French, Italian and German, the official names from each language's wiki (fr_ / it_ / de_tech.json,
 * tools/i18n_tech_names_wiki.py: techniques, combined ones and talents), then my translations (fr_ / it_ / de_tech_manual.ts).
 * 2.5: Catalan and Portuguese the same way (ca_ / pt_tech.json from the Catalan and Brazilian wikis, which are small, so most
 * names are mine in ca_ / pt_tech_manual.ts).
 */
import { getLang } from './i18n';
import EN_TECH from './en_tech.json';
import FR_TECH from './fr_tech.json';
import IT_TECH from './it_tech.json';
import DE_TECH from './de_tech.json';
import CA_TECH from './ca_tech.json';
import PT_TECH from './pt_tech.json';
import { EN_TALENTS, EN_TECH_MANUAL } from './en_tech_manual';
import { FR_TECH_MANUAL } from './fr_tech_manual';
import { IT_TECH_MANUAL } from './it_tech_manual';
import { DE_TECH_MANUAL } from './de_tech_manual';
import { CA_TECH_MANUAL } from './ca_tech_manual';
import { PT_TECH_MANUAL } from './pt_tech_manual';
import { COMBOS } from '../systems/combos';

const TECH = EN_TECH as Record<string, string>;
/** official names first, then mine */
const WIKI_TECH: Partial<Record<string, [Record<string, string>, Record<string, string>]>> = {
  fr: [FR_TECH as Record<string, string>, FR_TECH_MANUAL],
  it: [IT_TECH as Record<string, string>, IT_TECH_MANUAL],
  de: [DE_TECH as Record<string, string>, DE_TECH_MANUAL],
  ca: [CA_TECH as Record<string, string>, CA_TECH_MANUAL],
  pt: [PT_TECH as Record<string, string>, PT_TECH_MANUAL],
};
/** the combined techniques carry their dub name (ComboDef.en) */
let combos: Record<string, string> | null = null;
const comboEn = () => (combos ??= Object.fromEntries(COMBOS.filter((c) => c.en).map((c) => [c.name, c.en!])));

/** a technique's or talent's name */
export function tTech(name: string): string {
  const lang = getLang();
  const wiki = WIKI_TECH[lang];
  if (wiki) return wiki[0][name] ?? wiki[1][name] ?? name;
  if (lang !== 'en') return name;
  return EN_TALENTS[name] ?? TECH[name] ?? comboEn()[name] ?? EN_TECH_MANUAL[name] ?? name;
}

/** the official names of the elements in each language; the Spanish ones stay the ids of the code */
const ELEMENTS: Partial<Record<string, Record<string, string>>> = {
  en: { Fuego: 'Fire', Aire: 'Wind', Bosque: 'Wood', 'Montaña': 'Earth', Neutro: 'Void' },
  fr: { Fuego: 'Feu', Aire: 'Air', Bosque: 'Bois', 'Montaña': 'Terre', Neutro: 'Néant' },
  it: { Fuego: 'Fuoco', Aire: 'Vento', Bosque: 'Foresta', 'Montaña': 'Montagna', Neutro: 'Neutro' },
  de: { Fuego: 'Feuer', Aire: 'Wind', Bosque: 'Holz', 'Montaña': 'Erde', Neutro: 'Neutral' },
  ca: { Fuego: 'Foc', Aire: 'Aire', Bosque: 'Bosc', 'Montaña': 'Muntanya', Neutro: 'Neutre' },
  pt: { Fuego: 'Fogo', Aire: 'Vento', Bosque: 'Floresta', 'Montaña': 'Montanha', Neutro: 'Neutro' },
};
export const tEl = (e: string | number | null | undefined) => ELEMENTS[getLang()]?.[String(e)] ?? String(e ?? '');
