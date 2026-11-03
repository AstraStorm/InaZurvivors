/**
 * Fix 1.32: the news board (Noticias). Two sources, shown together, newest first (pinned ones on top):
 *   - AUTHOR_NEWS: the author's own news, written here by hand (newest first).
 *   - every public release (release.ts), turned into an «Actualización» automatically, so the whole update history stays.
 *
 * HOW TO ADD A NEWS ITEM — copy one entry of AUTHOR_NEWS to the top of the list and change it:
 *   id       unique, never reused (it marks the item as read)
 *   kind     'novedad' (blue) · 'aviso' (red) · 'actualizacion' (green) · 'fix' (orange, patches) · 'evento' (purple)
 *   date     'YYYY-MM-DD'          pinned   true to keep it at the top
 *   title / summary                icon     one emoji or symbol for its tile
 *   blocks   the body, in order:
 *     { h: 'Heading', icon: '⚽' }            section heading (icon optional)
 *     { p: 'Text with **bold** words' }       paragraph; **…** is bold
 *     { list: ['item', '**bold** item'] }     bullet list
 *     { callout: 'aviso' | 'nuevo' | 'info', text: '…' }   coloured box with its label
 *     { divider: true }                       rainbow separator
 */
import { PUBLIC_RELEASES, type PublicRelease } from './release';

export type NewsKind = 'novedad' | 'aviso' | 'actualizacion' | 'fix' | 'evento';
export type NewsBlock =
  | { h: string; icon?: string }
  | { p: string }
  | { list: string[] }
  | { callout: 'aviso' | 'nuevo' | 'info'; text: string }
  | { divider: true };
export interface NewsItem { id: string; kind: NewsKind; date: string; title: string; summary: string; icon?: string; pinned?: boolean; blocks: NewsBlock[]; version?: string }

export const NEWS_KIND_LABEL: Record<NewsKind, string> = { novedad: 'NOVEDAD', aviso: 'AVISO', actualizacion: 'ACTUALIZACIÓN', fix: 'FIX', evento: 'EVENTO' };

export const AUTHOR_NEWS: NewsItem[] = [
  {
    id: 'tablon-noticias', kind: 'novedad', date: '2026-11-02', icon: '📰',
    title: '¡Estrenamos tablón de noticias!',
    summary: 'Aquí irán los avisos, las novedades del desarrollo y el registro de todas las actualizaciones de InaZurvivors.',
    blocks: [
      { h: 'Un sitio para todas las novedades' },
      { p: 'A partir de ahora, todo lo que cambie en **InaZurvivors** se contará aquí: las **actualizaciones**, los **avisos** importantes y las **novedades** de lo que viene.' },
      { callout: 'nuevo', text: 'Las noticias que aún no has leído llevan un **punto amarillo** en la lista, y el botón **NOTICIAS** del menú te avisa cuando hay alguna nueva.' },
      { divider: true },
      { h: 'El registro de actualizaciones', icon: '📜' },
      { p: 'Todas las versiones públicas, desde la **v1.0**, se quedan en el tablón con su fecha: puedes repasar qué trajo cada una cuando quieras.' },
      { list: ['Las **actualizaciones** (cambio de versión, como la 1.4) van en verde.', 'Los **fixes** (parches como el Fix 1.41 o el 1.31) van en naranja, con una llave inglesa.', 'Los **avisos** van en rojo: léelos, suelen ser importantes.', 'Las **novedades** y los **eventos** van en azul y morado.'] },
    ],
  },
];

/** Fix 1.41: a patch has two decimals (1.41, 1.32, 1.22) or says «Fix» in its title; 1.3, 1.4 are updates. */
export const isFix = (r: PublicRelease) => !/semiactualizaci/i.test(r.title) && (/^\d+\.\d\d$/.test(r.version) || /\bfix\b/i.test(r.title)); // v1.65: a semi-update is news, not a fix

/** A public release as an «Actualización» news item. */
export function releaseNews(r: PublicRelease, online = true): NewsItem {
  const feats = r.features.filter((f) => online || !f.online);
  return {
    // v1.4: a «Fix» (1.31, 1.22...) is a patch, shown in its own colour; a version number change (1.3, 1.4) is an update
    id: `version-${r.version}`, kind: isFix(r) ? 'fix' : 'actualizacion', date: r.date, icon: '⚙', version: r.version,
    title: r.title, summary: r.tagline,
    blocks: [
      { p: r.intro },
      { divider: true },
      { h: 'Qué trae', icon: '✦' },
      { list: feats.map((f) => `${f.icon} **${f.title}**: ${f.text}`) },
      ...(r.start.length ? [{ divider: true } as NewsBlock, { h: 'Cómo empezar', icon: '▶' } as NewsBlock, { list: r.start } as NewsBlock] : []),
    ],
  };
}

/** Every news item, pinned first, then newest first (same day: author news before the update). */
export function allNews(online = true): NewsItem[] {
  const all = [...AUTHOR_NEWS, ...PUBLIC_RELEASES.map((r) => releaseNews(r, online))];
  const order = new Map(all.map((n, i) => [n.id, i]));
  return all.sort((a, b) => Number(!!b.pinned) - Number(!!a.pinned) || b.date.localeCompare(a.date) || order.get(a.id)! - order.get(b.id)!);
}

/** id of the newest item: the menu marks Noticias as new until it has been opened. */
export const LATEST_NEWS_ID = [...AUTHOR_NEWS.map((n) => ({ id: n.id, date: n.date })), ...PUBLIC_RELEASES.map((r) => ({ id: `version-${r.version}`, date: r.date }))]
  .sort((a, b) => b.date.localeCompare(a.date))[0]?.id ?? '';
