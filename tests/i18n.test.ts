/** 2.3 English translation (src/i18n): the language choice, t() and that every t('…') in the code has its English text. */
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { browserLang, resolveLang, setLang, tr } from '../src/i18n/i18n';
import { EN } from '../src/i18n/en';
import { PERKS, PERK_CATEGORIES } from '../src/systems/perks';
import { SAGAS } from '../src/data/sagas';
import { ENDLESS_PHASES } from '../src/systems/endless';

const SRC = path.resolve(__dirname, '..', 'src');
const files = (dir: string): string[] => fs.readdirSync(dir, { withFileTypes: true })
  .flatMap((d) => (d.isDirectory() ? files(path.join(dir, d.name)) : d.name.endsWith('.ts') ? [path.join(dir, d.name)] : []));
/** every literal passed to tr(): '…', "…" or `…` without ${} */
export function tKeys(code: string): string[] {
  const out: string[] = [];
  const re = /(?<![\w$.])tr\(\s*(?:'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)"|`((?:[^`\\$]|\\.|\$(?!\{))*)`)/g;
  for (const m of code.matchAll(re)) out.push((m[1] ?? m[2] ?? m[3]).replace(/\\(['"`\\])/g, '$1').replace(/\\n/g, '\n'));
  return out;
}

describe('i18n', () => {
  it('follows the browser unless the player chose a language', () => {
    expect(browserLang(['en-US', 'es'])).toBe('en');
    expect(browserLang(['es-ES', 'en'])).toBe('es');
    expect(browserLang(['fr'])).toBe('es');
    expect(browserLang([])).toBe('es');
    expect(resolveLang('', ['en-GB'])).toBe('en');
    expect(resolveLang('es', ['en-GB'])).toBe('es');
    expect(resolveLang(undefined, ['de'])).toBe('es');
  });
  it('tr() translates, fills placeholders and falls back to the Spanish text', () => {
    setLang('en');
    expect(tr('Ajustes')).toBe('Settings');
    expect(tr('Texto sin traducir {n}', { n: 3 })).toBe('Texto sin traducir 3');
    setLang('es');
    expect(tr('Ajustes')).toBe('Ajustes');
  });
  it('every tr() of the code has its English text, with the same placeholders', () => {
    const missing: string[] = [], badVars: string[] = [];
    const vars = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(',');
    for (const f of files(SRC).filter((f) => !f.includes(`${path.sep}i18n${path.sep}`))) for (const k of tKeys(fs.readFileSync(f, 'utf-8'))) {
      const en = EN[k];
      if (en === undefined) missing.push(`${path.relative(SRC, f)}: ${k}`);
      else if (vars(en) !== vars(k)) badVars.push(k);
    }
    expect([...new Set(missing)]).toEqual([]);
    expect(badVars).toEqual([]);
  });
  it('the texts the data tables translate when they load have their English text', () => {
    // tables whose factory calls tr() on a field (the literal is not inside tr(), so the scan above does not see it)
    const texts = [...PERKS.flatMap((p) => [p.label, p.description]), ...PERK_CATEGORIES, ...SAGAS, ...ENDLESS_PHASES.map((p) => p.name)]; // sagas, phases: ids shown through tr()
    expect(texts.filter((k) => EN[k] === undefined)).toEqual([]);
  });
});
