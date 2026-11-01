/**
 * What the PUBLIC sees: the first public version is InaZurivors v1.0. The internal history (changelog.ts, git tags
 * v2.8…v4.x) stays for development and is never shown to players. BUILD is the internal version, kept in bug reports
 * and in Credits so a report can be traced to the code. RELEASED turns true only once a public deployment exists and
 * has been checked; until then the game says "pre-lanzamiento".
 */
import { CHANGELOG } from './changelog';

export const PUBLIC_VERSION = '1.0';
export const BUILD = CHANGELOG[0].version;
export const RELEASED = false;
export const VERSION_LABEL = RELEASED ? `v${PUBLIC_VERSION}` : `v${PUBLIC_VERSION} · pre-lanzamiento`;
export const TIKTOK_URL = 'https://www.tiktok.com/@aastra.__';
/** Simple Icons "TikTok" glyph (CC0), used only as a link to the author's profile. */
export const TIKTOK_PATH = 'M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z';

export interface PublicRelease {
  version: string;
  title: string;
  tagline: string;
  intro: string;
  /** each card says what is there; `online` cards need the online service of the build */
  features: { icon: string; title: string; text: string; online?: boolean }[];
  start: string[];
}

/** Public news, newest first. Starts at v1.0: the internal versions before it are not part of the public history. */
export const PUBLIC_RELEASES: PublicRelease[] = [
  {
    version: '1.0',
    title: 'InaZurivors v1.0 — ¡Comienza la aventura!',
    tagline: 'La primera versión pública',
    intro: 'Un fangame roguelite de supervivencia inspirado en el universo de Inazuma Eleven: recluta futbolistas, mejora sus supertécnicas y aguanta oleadas de rivales cada vez más duras.',
    features: [
      { icon: '◆', title: 'Más de 2.000 futbolistas', text: 'Catalogados por equipo y saga, de Raimon al Mundial y la era GO.' },
      { icon: '◎', title: 'Máquina de fichajes', text: 'Colección con rarezas, duplicados y estrellas.' },
      { icon: '⚡', title: 'Supertécnicas', text: 'Técnicas por jugador, combinadas y nivel de maestría.' },
      { icon: '♜', title: 'Equipo y formaciones', text: 'Elige capitán, 7 candidatos y tu formación.' },
      { icon: '⚑', title: 'Arenas y dificultades', text: 'Varios estadios y rangos de C a X.' },
      { icon: '▲', title: 'Mejoras permanentes', text: 'Tu club se hace más fuerte partida a partida.' },
      { icon: '✔', title: 'Misiones y desafíos', text: 'Diarias, semanales y logros con recompensas.' },
      { icon: '♦', title: 'Equipaciones y escudos', text: 'Viste a tu equipo y desbloquea bonificaciones.' },
      { icon: '★', title: 'Ascensión', text: 'Lleva a tus leyendas a Mítico y a Héroe.' },
      { icon: '∞', title: 'Supervivencia infinita', text: 'Tras el jefe, sigue mientras aguantes.' },
      { icon: 'G', title: 'Cuenta con Google', text: 'Nombre único y guardado en la nube.', online: true },
      { icon: '♛', title: 'Ranking mundial', text: 'Compite por el TOP 15 de cada arena.', online: true },
    ],
    start: ['Entra con Google o juega como invitado', 'Crea tu perfil', 'Elige tu club favorito', 'Consigue tus 5 primeros futbolistas', 'Prepara tu plantilla', 'Sobrevive, recluta y mejora tus técnicas'],
  },
];
export const CURRENT_PUBLIC = PUBLIC_RELEASES[0];
/** real captures of the game, in public/devlog */
export const DEVLOG_SHOTS = [
  { src: 'devlog/partida.webp', caption: 'Oleadas de rivales y supertécnicas' },
  { src: 'devlog/menu.webp', caption: 'Tu club, listo para saltar al campo' },
  { src: 'devlog/coleccion.webp', caption: 'Colección de futbolistas' },
];
