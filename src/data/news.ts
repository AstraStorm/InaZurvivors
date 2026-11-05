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
    id: 'bugs-1-85', kind: 'novedad', date: '2026-11-05', icon: '🐞', pinned: true,
    title: '¡Reporta bugs y gana fichas!',
    summary: 'Cada bug que reportes y se corrija te da 100 fichas de fichaje. Y las estrellas vuelven a empezar para todos con las reglas nuevas.',
    blocks: [
      { h: 'Ayuda a mejorar el juego', icon: '🐞' },
      { p: 'Si encuentras un fallo, repórtalo desde el **🐞 del menú** o en **Ajustes » Reportar un bug**. Cuéntanos qué pasó y, si puedes, cómo repetirlo y una captura.' },
      { callout: 'nuevo', text: 'Revisamos cada reporte. Cuando se **corrige**, recibes **100 fichas** automáticamente y un aviso la próxima vez que abras el juego. Necesitas **entrar con tu cuenta**.' },
      { list: [
        'Un reporte por fallo: los repetidos o que no son un bug se descartan.',
        'Cuanta más información (pasos, captura, dónde estabas), antes se corrige.',
      ] },
      { divider: true },
      { h: 'Estrellas nuevas, para todos igual', icon: '★' },
      { p: 'Las estrellas ahora se **compran con monedas** en la ficha de cada futbolista y cada una sube **+5 el límite** de la estadística que elijas. Para que nadie empiece con ventaja, **las estrellas de todos se han reiniciado**.' },
    ],
  },
  {
    id: 'gts-1-8', kind: 'novedad', date: '2026-11-04', icon: '🌐', pinned: false,
    title: '¡Llega la GTS! Cambia futbolistas con todo el mundo',
    summary: 'La 1.8 trae la Estación Global de Intercambio: deja una copia repetida, pide el futbolista que te falta y recoge tu cambio cuando vuelvas.',
    blocks: [
      { h: 'La Estación Global de Intercambio', icon: '🌐' },
      { p: 'La **GTS** es un banco online de futbolistas. Dejas una **copia repetida** pidiendo el futbolista que quieres a cambio, y cualquier jugador que lo tenga repetido puede cambiártelo **aunque no estés conectado**. Cuando vuelvas, te estará esperando.' },
      { list: [
        '**Dejar:** elige tu copia repetida y el futbolista que pides. Se va a la GTS en su cápsula.',
        '**Buscar:** mira lo que han dejado los demás. Si tienes repetido el que piden, cámbialo al momento.',
        '**Recuperar:** mientras nadie te lo cambie, puedes recuperar tu futbolista cuando quieras.',
        '**Historial:** todos tus cambios, con quién los hiciste.',
      ] },
      { callout: 'info', text: 'La encontrarás en el menú, en **FICHAJES » GTS**. En la portada verás también los últimos intercambios de todo el mundo. Necesitas **entrar con tu cuenta**.' },
      { divider: true },
      { h: 'Reglas', icon: '🔒' },
      { list: [
        'Solo se dejan **copias repetidas**: nunca la única que tienes.',
        'Los **Leyenda** y los futbolistas de **evento** no se pueden dejar. Si has subido a alguien a **HÉROE**, sus copias repetidas sí.',
        'La copia que viaja va **sin entrenamiento, estrellas ni ascensión**: tu futbolista se queda con todo.',
        'Puedes pedir el futbolista que quieras, pero **no puedes repetir un cambio** que ya hiciste.',
      ] },
      { callout: 'nuevo', text: 'Empiezas con **1 hueco** para dejar futbolistas. Mejora la **Ventanilla GTS** en MEJORAS (Economía) para tener hasta **5**.' },
      { divider: true },
      { h: 'Campeón', icon: '♛' },
      { p: 'Los **Leyenda** ya no se hacen HÉROE: suben a **Campeón**, **Campeón+** y **Campeón++**. Cada nivel sube **10** el límite de sus estadísticas (de 99 a 109, 119 y 129), mejora sus estadísticas y le da **5 puntos más de entrenamiento**. Si ya tenías un Leyenda HÉROE, ahora es Campeón, y sus estrellas cuentan como los niveles siguientes.' },
      { h: 'Un jugador de cada', icon: '👥' },
      { p: 'En tu equipo no puede repetirse un personaje, ni como Aura: nada de dos Axel, dos Mark, una versión **Oscuro** junto a la normal o una **fusión Miximax** con uno de sus dos jugadores.' },
    ],
  },
  {
    id: 'banner-agradecimiento', kind: 'evento', date: '2026-11-04', icon: '♥', pinned: true,
    title: '¡Gracias por ser más de 50 jugando!',
    summary: 'Banner de agradecimiento durante 7 días, con futbolistas que solo salen ahí, y el código GRACIAS.',
    blocks: [
      { h: 'Más de 50 personas jugando', icon: '♥' },
      { p: 'InaZurvivors ya tiene **más de 50 personas jugando**. Muchísimas gracias a todos: para celebrarlo abrimos el **Banner de agradecimiento**.' },
      { list: ['**Ataque a los Titanes**: Levi, Eren, Mikasa, Armin y Erwin.', '**Los Siete Pecados Capitales**: Meliodas, Escanor y Ban.', '**Axel Encapuchado**, con la sudadera de Okinawa (Leyenda).', 'Todos solo salen en este banner.'] },
      { callout: 'info', text: 'Empieza el **4 de noviembre a las 15:00** y dura **7 días**. Se tira con **fichas de evento** (15 la tirada, 150 el ×10), que ganas jugando en **Rango S o X**.' },
      { divider: true },
      { h: 'Código GRACIAS', icon: '🎁' },
      { callout: 'nuevo', text: 'Canjea **GRACIAS** en CÓDIGOS: un **×10 gratis** del banner y **10.000 monedas**.' },
    ],
  },
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
