/** 2.3 English translation (src/i18n): the language choice, t() and that every t('…') in the code has its English text.
 *  2.4: the same for French, Italian and German (fr.ts, it.ts, de.ts), plus their technique names (fr_/it_/de_tech.json, fr_/it_/de_tech_manual.ts).
 *  2.5: and for Catalan and Portuguese (ca.ts, pt.ts, ca_/pt_tech.json, ca_/pt_tech_manual.ts). */
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { browserLang, resolveLang, setLang, tr } from '../src/i18n/i18n';
import { EN } from '../src/i18n/en';
import { FR } from '../src/i18n/fr';
import { IT } from '../src/i18n/it';
import { DE } from '../src/i18n/de';
import { CA } from '../src/i18n/ca';
import { PT } from '../src/i18n/pt';
import { tEl, tTech } from '../src/i18n/data';
import { PERKS, PERK_CATEGORIES } from '../src/systems/perks';
import { SAGAS } from '../src/data/sagas';
import { ENDLESS_PHASES } from '../src/systems/endless';
import { COMBOS } from '../src/systems/combos';

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
const DICTS: Record<string, Record<string, string>> = { en: EN, fr: FR, it: IT, de: DE, ca: CA, pt: PT };

describe('i18n', () => {
  it('follows the browser unless the player chose a language', () => {
    expect(browserLang(['en-US', 'es'])).toBe('en');
    expect(browserLang(['es-ES', 'en'])).toBe('es');
    expect(browserLang(['fr'])).toBe('fr');
    expect(browserLang(['fr-CA', 'en'])).toBe('fr');
    expect(browserLang(['it-IT', 'en'])).toBe('it');
    expect(browserLang(['de-DE', 'en'])).toBe('de');
    expect(browserLang(['pt-BR'])).toBe('pt');
    expect(browserLang(['pt-PT', 'en'])).toBe('pt');
    expect(browserLang(['ca-ES', 'es'])).toBe('ca');
    expect(browserLang(['es-ES', 'ca'])).toBe('es');
    expect(browserLang([])).toBe('es');
    expect(resolveLang('', ['en-GB'])).toBe('en');
    expect(resolveLang('es', ['en-GB'])).toBe('es');
    expect(resolveLang('fr', ['es-ES'])).toBe('fr');
    expect(resolveLang(undefined, ['de'])).toBe('de');
    expect(resolveLang(undefined, ['ja'])).toBe('es');
  });
  it('tr() translates, fills placeholders and falls back to the Spanish text', () => {
    setLang('en');
    expect(tr('Ajustes')).toBe('Settings');
    expect(tr('Texto sin traducir {n}', { n: 3 })).toBe('Texto sin traducir 3');
    setLang('fr');
    expect(tr('Ajustes')).toBe('Paramètres');
    expect(tr('Ver el perfil de {name}', { name: 'Mark' })).toBe('Voir le profil de Mark');
    setLang('es');
    expect(tr('Ajustes')).toBe('Ajustes');
  });
  for (const [lang, dict] of Object.entries(DICTS)) {
    it(`every tr() of the code has its ${lang} text, with the same placeholders`, () => {
      const missing: string[] = [], badVars: string[] = [];
      const vars = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(',');
      for (const f of files(SRC).filter((f) => !f.includes(`${path.sep}i18n${path.sep}`))) for (const k of tKeys(fs.readFileSync(f, 'utf-8'))) {
        const t = dict[k];
        if (t === undefined) missing.push(`${path.relative(SRC, f)}: ${k}`);
        else if (vars(t) !== vars(k)) badVars.push(k);
      }
      expect([...new Set(missing)]).toEqual([]);
      expect(badVars).toEqual([]);
    });
    it(`the texts the data tables translate when they load have their ${lang} text`, () => {
      // tables whose factory calls tr() on a field (the literal is not inside tr(), so the scan above does not see it)
      const texts = [...PERKS.flatMap((p) => [p.label, p.description]), ...PERK_CATEGORIES, ...SAGAS, ...ENDLESS_PHASES.map((p) => p.name)]; // sagas, phases: ids shown through tr()
      expect(texts.filter((k) => dict[k] === undefined)).toEqual([]);
    });
  }
  it('French, Italian, German, Catalan and Portuguese have the same keys as English: nothing translated to one language only', () => {
    for (const d of [FR, IT, DE, CA, PT]) {
      expect(Object.keys(EN).filter((k) => !(k in d))).toEqual([]);
      expect(Object.keys(d).filter((k) => !(k in EN))).toEqual([]);
    }
  });
  it('techniques, combined ones and elements take their official French, Italian and German names', () => {
    setLang('fr');
    expect(tTech('Tornado de fuego')).toBe('Tornade de Feu');
    expect(tTech('Mano Celestial')).toBe('Main Céleste');
    expect(tTech('Coz 3')).toBe('Ruade 3'); // fr_tech_manual.ts
    expect(COMBOS.filter((c) => tTech(c.name) === c.name && c.name !== 'Big Bang').map((c) => c.name)).toEqual([]);
    expect(tEl('Montaña')).toBe('Terre');
    setLang('it');
    expect(tTech('Tornado de fuego')).toBe('Tornado di Fuoco');
    expect(tTech('Mano Celestial')).toBe('Mano di Luce');
    expect(COMBOS.filter((c) => tTech(c.name) === c.name && !['Big Bang', 'Zero Magnum'].includes(c.name)).map((c) => c.name)).toEqual([]);
    expect(tEl('Bosque')).toBe('Foresta');
    expect(tr('Ajustes')).toBe('Impostazioni');
    setLang('de');
    expect(tTech('Tornado de fuego')).toBe('Feuertornado');
    expect(tTech('Mano Celestial')).toBe('Himmelshand');
    expect(tTech('Fuego cruzado')).toBe('Kreuzfeuer');
    expect(COMBOS.filter((c) => tTech(c.name) === c.name && !['Big Bang', 'Zero Magnum', 'Tripegaso'].includes(c.name)).map((c) => c.name)).toEqual([]);
    expect(tEl('Bosque')).toBe('Holz');
    expect(tr('Ajustes')).toBe('Einstellungen');
    setLang('ca');
    expect(tTech('Tornado de fuego')).toBe('Tornado de Foc'); // ca_tech.json (Catalan wiki)
    expect(tTech('Mano Celestial')).toBe('Mà Celestial');
    expect(tTech('Fuego cruzado')).toBe('Foc creuat'); // ca_tech_manual.ts
    expect(COMBOS.filter((c) => tTech(c.name) === c.name && !['Big Bang', 'Zero Magnum', 'Escena nocturna'].includes(c.name)).map((c) => c.name)).toEqual([]);
    expect(tEl('Bosque')).toBe('Bosc');
    expect(tr('Ajustes')).toBe('Configuració');
    setLang('pt');
    expect(tTech('Tornado de fuego')).toBe('Furacão de Fogo'); // pt_tech.json (Brazilian wiki)
    expect(tTech('Mano Celestial')).toBe('Mão Fantasma');
    expect(tTech('Fuego total')).toBe('Fogo Total'); // pt_tech_manual.ts
    expect(COMBOS.filter((c) => tTech(c.name) === c.name && !['Big Bang', 'Zero Magnum'].includes(c.name)).map((c) => c.name)).toEqual([]);
    expect(tEl('Aire')).toBe('Vento');
    expect(tr('Ajustes')).toBe('Configurações');
    setLang('es');
    expect(tTech('Tornado de fuego')).toBe('Tornado de fuego');
  });
});
