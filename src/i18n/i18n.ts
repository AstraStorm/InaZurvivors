/**
 * 2.3 (author: «empezaremos a traducir el juego, primero al inglés»). Spanish stays the source text in the code: `tr('Texto')`
 * looks the Spanish string up in the English dictionary (en.ts) when the game is in English, and falls back to the Spanish
 * one when it has no entry yet, so screens can be translated one at a time without breaking the others.
 *
 * Placeholders are `{name}`: `tr('Ver el perfil de {name}', { name })`. The dictionary keeps them in the English text.
 * Game data (techniques, players, maps…) goes through its own tables (tName and friends), not through tr(). (Named tr, not t: t is a technique or a time in much of the code.)
 *
 * The language is the player's choice in Ajustes (save.settings.lang); without one it follows the browser: English,
 * French, Italian or German (2.4, fr.ts / it.ts / de.ts) when the browser asks for one of them first, Spanish otherwise.
 */
import { EN } from './en';
import { FR } from './fr';
import { IT } from './it';
import { DE } from './de';

export type Lang = 'es' | 'en' | 'fr' | 'it' | 'de';
export const LANGS: { id: Lang; label: string }[] = [
  { id: 'es', label: 'Español' }, { id: 'en', label: 'English' }, { id: 'fr', label: 'Français' }, { id: 'it', label: 'Italiano' }, { id: 'de', label: 'Deutsch' },
];
/** 2.4 (author: «traduceme ahora el juego de la misma forma del inglés al francés», then «pon italiano tmb» and «aleman»): the dictionaries */
const DICTS: Partial<Record<Lang, Record<string, string>>> = { en: EN, fr: FR, it: IT, de: DE };
const isLang = (l: string | undefined | null): l is Lang => l === 'es' || l === 'en' || l === 'fr' || l === 'it' || l === 'de';
const LOCALES: Record<Lang, string> = { es: 'es-ES', en: 'en-GB', fr: 'fr-FR', it: 'it-IT', de: 'de-DE' };

let lang: Lang = 'es';

/** the browser's first language, as one of ours */
export function browserLang(langs: readonly string[] = typeof navigator === 'undefined' ? [] : navigator.languages ?? [navigator.language]): Lang {
  const first = (langs[0] ?? '').toLowerCase();
  return (['en', 'fr', 'it', 'de'] as const).find((l) => first.startsWith(l)) ?? 'es';
}
/** the language to use for a saved choice ('' or absent = follow the browser) */
export const resolveLang = (choice: string | undefined | null, langs?: readonly string[]): Lang => (isLang(choice) ? choice : browserLang(langs));

/** the language saved in the local save, read before any module builds its tables: the data tables (perks, missions…)
 * translate their texts once, when they load, so a change of language in Ajustes reloads the page */
function savedLang(): Lang {
  if (typeof document === 'undefined') return 'es'; // tests (node): the source texts
  let choice: string | undefined;
  try { choice = JSON.parse(localStorage.getItem('ie-survivors-save') ?? 'null')?.settings?.lang; } catch { /* no storage */ }
  return resolveLang(choice);
}
lang = savedLang();

export function setLang(l: Lang) {
  lang = l;
  if (typeof document !== 'undefined') document.documentElement.lang = l;
}
export const getLang = () => lang;
/** the locale for numbers and dates */
export const locale = () => LOCALES[lang];
export const fmtNum = (n: number) => n.toLocaleString(locale());

type Vars = Record<string, string | number | null | undefined>;
const fill = (s: string, vars?: Vars) => (vars ? s.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k] ?? '') : m)) : s);

/** a text of the interface, in the current language */
export function tr(es: string, vars?: Vars): string {
  return fill(DICTS[lang]?.[es] ?? es, vars);
}
