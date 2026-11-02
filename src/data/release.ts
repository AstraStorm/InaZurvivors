/**
 * What the PUBLIC sees: the first public version is InaZurvivors v1.0. The internal history (changelog.ts, git tags
 * v2.8…v4.x) stays for development and is never shown to players. BUILD is the internal version, kept in bug reports
 * and in Credits so a report can be traced to the code. RELEASED turns true only once a public deployment exists and
 * has been checked; until then the game says "pre-lanzamiento".
 */
import { CHANGELOG } from './changelog';

export const PUBLIC_VERSION = '1.2';
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
    version: '1.2',
    title: 'InaZurvivors v1.2 — Miximax, técnicas propias y tres arenas nuevas',
    tagline: 'Las fusiones llegan como Míticos, cada futbolista lleva sus técnicas y hay tres arenas más',
    intro: 'Tezcat + Bailong, Mark + Arion y las demás fusiones Miximax ya se pueden fichar. Casi todo el plantel recupera sus técnicas firma, Ares y Orion incluidos, y estrenamos el Parque del Alpino, el Claustro Sagrado y la Isla Mary Times.',
    features: [
      { icon: '★', title: 'Miximax Míticos', text: '36 formas Miximax, todas Mítico, con las técnicas de su forma.' },
      { icon: '⚡', title: 'Técnicas propias', text: 'Todos con cuatro técnicas: Rayo de Diamante de Clario, Tiro supermasivo de Flora y muchas más.' },
      { icon: '◆', title: 'Tres arenas nuevas', text: 'Parque del Alpino, Claustro Sagrado e Isla Mary Times, cada una con sus rivales y su jefe.' },
      { icon: '♜', title: 'Estadio Zeus renovado', text: 'Un gran estadio dorado y azul.' },
      { icon: '▲', title: 'Recta final', text: 'Los últimos minutos antes del jefe aprietan: más rivales, con más vida y más daño.' },
      { icon: '☼', title: 'Economía', text: 'Las monedas cuestan un poco más de ganar, en partidas y misiones.' },
      { icon: '✦', title: 'Mejor en móvil', text: 'Subida de nivel, resultados, barra del jefe y selector de dificultad caben y se leen.' },
    ],
    start: ['Busca un Miximax en los fichajes', 'Mira las técnicas nuevas de tus futbolistas en la Enciclopedia', 'Supera el Estadio Zeus para abrir el Parque del Alpino'],
  },
  {
    version: '1.12',
    title: 'InaZurvivors Fix 1.12 — Más impacto, mejor en móvil',
    tagline: 'Técnicas combinadas nuevas, tienda renovada, códigos de regalo y un menú con ranking y pase a lo grande',
    intro: 'El combate pega más fuerte, llegan El Fénix, La Tierra y Remate caótico, y los eventos tienen a su robot. Además: tienda con diez ofertas, códigos promocionales, una dificultad más progresiva y un móvil mucho más cómodo.',
    features: [
      { icon: '★', title: 'Técnicas combinadas', text: 'El Fénix, La Tierra, Remate caótico, Ventisca de fuego y La Tierra ∞, cada una con su animación.' },
      { icon: '⚡', title: 'Más impacto', text: 'Críticos, barridas de grupos y técnicas evolucionadas que se notan al golpear.' },
      { icon: '☼', title: 'Tienda renovada', text: 'Seis ofertas diarias, dos destacadas, una de tu equipo y una semanal.' },
      { icon: '♛', title: 'Ranking y pase', text: 'Grandes y a la vista en el menú, con podio y los siete días del pase.' },
      { icon: '✉', title: 'Códigos', text: 'Canjea regalos desde el menú. Una vez por cuenta.' },
      { icon: '◆', title: 'Eventos', text: 'El robot de las cadenas de partidos, flechas más claras y paneles que no tapan nada.' },
      { icon: '▲', title: 'Dificultad y móvil', text: 'Curva más suave al principio y controles táctiles para todo.' },
    ],
    start: ['Reclama tu pase semanal desde el menú', 'Canjea tu código en CÓDIGOS', 'Junta a Erik, Bobby y Mark para El Fénix'],
  },
  {
    version: '1.11',
    title: 'InaZurvivors Fix 1.11 — El capitán manda',
    tagline: 'Solo tu capitán recibe daño, gachas por saga y un pase semanal gratis',
    intro: 'Tus compañeros son apoyo invulnerable y solo el capitán puede caer. Llegan gachas por saga y por equipo con probabilidades exactas, un pase semanal gratuito, más misiones, objetos y mejoras, y una economía más exigente.',
    features: [
      { icon: '♜', title: 'Solo el capitán', text: 'Los compañeros no reciben daño ni bloquean tiros; la formación te da extras de ataque o de defensa.' },
      { icon: '◎', title: 'Gachas por saga', text: 'Inazuma Eleven, GO y Victory Road, más una por equipo; probabilidades exactas a la vista.' },
      { icon: '✦', title: 'Pase semanal', text: 'Siete recompensas gratis: tiradas, monedas y futbolistas Épico o superior.' },
      { icon: '☼', title: 'Tienda ampliada', text: 'Diez ofertas al día con destacado, oferta y un fichaje de tu equipo favorito.' },
      { icon: '✚', title: 'Revivir y más objetos', text: 'Revivir, Barrera, Protección elemental, Cazador de élites y más.' },
      { icon: '✖', title: 'Causa de la derrota', text: 'Sabrás qué te derribó y cómo evitarlo.' },
      { icon: '▲', title: 'HUD nuevo', text: 'Vida y experiencia grandes, estado crítico y escudo del equipo.' },
      { icon: '⚡', title: 'Técnicas', text: 'Araña Gigante, Mordisco de serpiente y Telaraña con efectos propios; nivel visible (+X, Lv X o GX).' },
    ],
    start: ['Elige tu formación: ahora cambia cómo protegen tus compañeros', 'Reclama el día 1 del pase semanal', 'Prueba la gacha de tu equipo favorito'],
  },
  {
    version: '1.1',
    title: 'InaZurvivors v1.1 — Más técnicas, más fichajes',
    tagline: 'Técnicas de GO, nueva máquina de fichajes y vuelve la introducción',
    intro: 'Los futbolistas de GO, Chrono Stone y Galaxy aprenden sus técnicas de los juegos originales, la máquina de fichajes gira como una de verdad y conseguir fichas es más rápido.',
    features: [
      { icon: '⚡', title: 'Técnicas de GO', text: 'Hasta cuatro técnicas jugables por futbolista de GO, Chrono Stone y Galaxy.' },
      { icon: '◎', title: 'Máquina nueva', text: 'Manivela, cápsula que rueda y apertura con la intensidad de su rareza.' },
      { icon: '▲', title: 'Más fichas', text: 'La tirada cuesta 8 fichas y las primeras partidas dan un extra.' },
      { icon: '★', title: 'Basara', text: 'Los Basara de Victory Road son, como mínimo, Legendarios.' },
      { icon: '▶', title: 'Introducción', text: 'Vuelve la presentación animada al abrir el juego.' },
    ],
    start: ['Abre el juego y disfruta la introducción', 'Pulsa Continuar con tu club', 'Prueba la nueva máquina de fichajes'],
  },
  {
    version: '1.0',
    title: 'InaZurvivors v1.0 — ¡Comienza la aventura!',
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
