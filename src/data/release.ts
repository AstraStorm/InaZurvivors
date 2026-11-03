/**
 * What the PUBLIC sees: the first public version is InaZurvivors v1.0. The internal history (changelog.ts, git tags
 * v2.8…v4.x) stays for development and is never shown to players. BUILD is the internal version, kept in bug reports
 * and in Credits so a report can be traced to the code. RELEASED turns true only once a public deployment exists and
 * has been checked; until then the game says "pre-lanzamiento".
 */
import { CHANGELOG } from './changelog';

export const PUBLIC_VERSION = '1.4';
export const BUILD = CHANGELOG[0].version;
export const RELEASED = false;
export const VERSION_LABEL = RELEASED ? `v${PUBLIC_VERSION}` : `v${PUBLIC_VERSION} · pre-lanzamiento`;
export const TIKTOK_URL = 'https://www.tiktok.com/@aastra.__';
/** Simple Icons "TikTok" glyph (CC0), used only as a link to the author's profile. */
export const TIKTOK_PATH = 'M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z';

export interface PublicRelease {
  version: string;
  /** Fix 1.32: publication day (YYYY-MM-DD), for the news board */
  date: string;
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
    version: '1.4', date: '2026-11-03',
    title: 'InaZurvivors 1.4 — Todo nuevo por dentro y por fuera',
    tagline: 'Menús, HUD, cartas de nivel, recompensas, pase y perfil rediseñados; técnica inicial para cada jugador y técnicas de Arion, Axel y Bai Long redibujadas',
    intro: 'Toda la interfaz se renueva: un menú principal más claro con tus botones agrupados, tu capitán en el centro del estadio, un ranking con podio, tiendas con tarjetas de producto, máquinas de fichajes con su estrella y arenas a pantalla grande. También en el móvil.',
    features: [
      { icon: '▶', title: 'Menú principal nuevo', text: 'Botón JUGAR grande, Mi Equipo con las caras de tu equipo, y el resto agrupado en Tu club, Fichajes y Competición, con iconos nuevos. Noticias, Ajustes, sonido y reportar un bug, arriba a la derecha.' },
      { icon: '♛', title: 'Ranking con podio', text: 'Los tres primeros en un podio con su capitán, y filtros de un toque por puntos, rango, tiempo, daño y arena.', online: true },
      { icon: '◎', title: 'Máquinas de fichajes', text: 'Cada máquina enseña a su mejor futbolista y su precio; la elegida, sus destacados, precios y garantía de un vistazo.' },
      { icon: '★', title: 'Tiendas', text: 'Ofertas como tarjetas de producto con el color de su rareza. En la tienda de técnicas eliges futbolista en una lista y ves cada técnica con sus manuales.' },
      { icon: '⚽', title: 'Arenas y dificultad', text: 'Las arenas con su mapa en grande, duración, rivales y jefe, y los rangos como insignias.' },
      { icon: '✦', title: 'Todo a juego', text: 'Barra de título, paneles, botones, pestañas, misiones y mejoras con el mismo estilo, también en el móvil.' },
      { icon: '⚡', title: 'HUD y cartas de nivel', text: 'Vida con corazón, reloj que se llena hasta el jefe, formaciones en un interruptor y fichas del equipo con sus técnicas. Las cartas de subir de nivel entran boca abajo, se dan la vuelta y se inclinan en 3D.' },
      { icon: '★', title: 'Técnica inicial', text: 'En Mi Equipo eliges con qué técnica empieza cada futbolista (no solo el capitán).' },
      { icon: '🎁', title: 'Recompensas con chispa', text: 'Misiones y logros con sello «¡COBRADA!», monedas que vuelan al monedero y un resumen con confeti. Pase semanal y perfil rediseñados; el equipo favorito ya es para siempre.' },
      { icon: '🔥', title: 'Técnicas como en el anime', text: 'Viento celestial, Tormenta, tornado, huracán, Tormenta de fuego, Ciclón blanco y Brisa deslizante, redibujadas a partir de sus escenas.' },
      { icon: '🛠', title: 'Correcciones', text: 'Arion vuelve a ser de Aire y otros 11 futbolistas tienen su elemento correcto; avisos que salían sin nada; HUD del móvil sin solapes.' },
    ],
    start: ['Pulsa JUGAR', 'Mira el podio en Ranking'],
  },
  {
    version: '1.32', date: '2026-11-02',
    title: 'InaZurvivors 1.32 — Tablón de noticias',
    tagline: 'Tablón de noticias, tarjetas rediseñadas como cromos y un Mi Equipo más cómodo que enseña tus técnicas combinadas',
    intro: 'Novedades se convierte en Noticias: a la izquierda tienes todas las entradas, con su etiqueta y su fecha, y a la derecha la noticia completa. Ahí verás los avisos y novedades del desarrollo y el registro de todas las actualizaciones desde la v1.0.',
    features: [
      { icon: '📰', title: 'Tablón de noticias', text: 'Lista de noticias con etiquetas (Novedad, Aviso, Actualización, Evento), noticias fijadas, fecha y aviso de las que aún no has leído.' },
      { icon: '📜', title: 'Registro completo', text: 'Todas las actualizaciones públicas, de la v1.0 a hoy, se quedan guardadas para consultarlas cuando quieras.' },
      { icon: '🃏', title: 'Tarjetas nuevas', text: 'Rediseñadas como cromos: cada rareza tiene su propio marco (bronce, plata, amatista, oro, holográfico, aurora y fuego para HÉROE), con el retrato sobre su elemento, media, estadísticas y efectos de brillo, holografía y chispas.' },
      { icon: '🔗', title: 'Técnicas combinadas a la vista', text: 'Mi Equipo enseña arriba las sinergias y qué futbolistas pueden hacer juntos una técnica combinada, y marca en tu colección a quien la completaría.' },
      { icon: '♜', title: 'Mi Equipo más cómodo', text: 'Coge las tarjetas y muévelas de verdad a sus plazas o entre ellas; o pulsa para añadir y quitar. Autocompletar con tus mejores, Vaciar, y orden por media, rareza o nombre.' },
    ],
    start: ['Abre Noticias desde el menú', 'Lee las que tienen el punto de no leída'],
  },
  {
    version: '1.31', date: '2026-11-02',
    title: 'InaZurvivors Fix 1.31 — Pingüinos, sagas y ranking por puntos',
    tagline: 'Una máquina por saga con precios claros, técnicas de pingüinos, flores y tiburones dibujadas, ranking por puntos y muchos más logros',
    intro: 'Cada saga tiene su máquina de fichajes y cuanto más Míticos tiene, más cuesta. Los Pingüinos emperador, Tiburón de las profundidades, Lecho de rosas y compañía se ven como en la serie. El ranking ordena por puntos (el rango es lo que más cuenta) y se puede filtrar por tiempo, daño o rango.',
    features: [
      { icon: '◎', title: 'Una máquina por saga', text: 'Fútbol Frontier, Alius, FFI, GO, Chrono Stone, Galaxy, Ares, Orion y Fichatrón. Precio redondo según sus Míticos: 5, 10, 15 o 20 fichas.' },
      { icon: '🐧', title: 'Técnicas de la naturaleza', text: 'Pingüinos emperador (n.º 1, 2, 3, 7 y X), Pingüino espacial, perfecto y aéreo, Mano de pingüinos, rosas, flores, hojas, tiburón, orca y ballena, cada una como en la wiki.' },
      { icon: '♛', title: 'Ranking por puntos', text: 'Puntos = (segundos × 10 + √daño × 2) × rango. También puedes ordenar por tiempo, daño o rango, y filtrar por arena y rango.', online: true },
      { icon: '★', title: 'Más logros', text: 'Unos 70 logros en tres niveles (10, 20 y 50 fichas).' },
      { icon: '⚡', title: 'Sinergias visibles', text: 'Resonancia de elementos, química de club y sinergia del capitán, grandes en la partida y en Mi Equipo.' },
      { icon: '▲', title: 'Legendarios y Míticos más fuertes', text: 'Legendarios con medias de 80 y pico, Míticos cerca de 90; ascender pide menos duplicados.' },
      { icon: '★', title: 'Estrellas de héroe', text: 'Un Mítico o una Leyenda asciende directamente a HÉROE, y cada HÉROE gana hasta 3 estrellas de héroe con más duplicados. Los Míticos que ya habías ascendido pasan a HÉROE.' },
      { icon: '🛡', title: 'Blindaje', text: 'Nueva mejora permanente y nueva carta en la partida que restan daño fijo a cada golpe que recibe el capitán.' },
      { icon: '⏭', title: 'Gacha más claro', text: 'Al saltar ves todo lo que has fichado; estrellas dibujadas y el brillo ya no tapa al jugador.' },
      { icon: '♜', title: 'Retratos de IE3 con sus colores', text: 'Cada equipo pinta su torso con su propia paleta de la ROM.' },
    ],
    start: ['Prueba la máquina de tu saga favorita', 'Mira las sinergias en Mi Equipo', 'Busca tu posición en el ranking por puntos'],
  },
  {
    version: '1.3', date: '2026-11-02',
    title: 'InaZurvivors 1.3 — Asciende, entrena y juega más duro',
    tagline: 'Todos pueden llegar a HÉROE, los duplicados están equilibrados, los rivales aprietan más y las equipaciones de IE3 por fin cuadran',
    intro: 'Cualquier futbolista, también los Comunes, puede ascender y convertirse en HÉROE con sus duplicados; cuanto más fácil es que salga, más copias pide. Los bustos de Inazuma Japón, Zero y el resto de equipos de IE3 llevan su propia equipación, y el gacha se salta con Espacio.',
    features: [
      { icon: '▲', title: 'Ascensión para todos', text: 'Ascendido (una rareza más, hasta Mítico) y HÉROE para cualquier futbolista, con un coste según su rareza.' },
      { icon: '★', title: 'Duplicados equilibrados', text: 'Las estrellas de los Comunes cuestan más copias y las copias sobrantes se guardan para ascender.' },
      { icon: '♜', title: 'Bustos de IE3 corregidos', text: 'Inazuma Japón, Zero y los demás equipos de IE3 con su equipación de verdad.' },
      { icon: '⏭', title: 'Gacha más ágil', text: 'Espacio o Intro saltan la animación y aceptan la tarjeta; Esc salta toda la tirada ×10.' },
      { icon: '✦', title: 'Talentos claros', text: 'Al mejorar un talento ves lo que gana de verdad; ¡Resurgir! cura más con cada nivel.' },
      { icon: '☠', title: 'Más reto', text: 'Los rivales se endurecen cada minuto y la recta final llega antes; sin nada que mejorar, subir de nivel te cura directamente.' },
      { icon: '◎', title: 'Más fichas, precios claros', text: 'Una tirada cuesta 10 fichas y diez, 100; las partidas largas pagan muchas más fichas.' },
      { icon: '⚑', title: 'Cada uno en su máquina', text: 'Los futbolistas de GO y Victory Road ya solo salen en la máquina de su era.' },
      { icon: '▲', title: 'Estadísticas por rareza y entrenamiento', text: 'Cada rareza tiene su banda de estadísticas, ascender las sube y puedes repartir hasta 20 puntos con Fichas de entrenamiento.' },
    ],
    start: ['Entrena a tu capitán en su ficha', 'Mira qué futbolistas puedes ascender en la Enciclopedia', 'Tira en la máquina y pulsa Espacio'],
  },
  {
    version: '1.22', date: '2026-11-02',
    title: 'InaZurvivors Fix 1.22 — Tarjetas, estadísticas y un gacha memorable',
    tagline: 'Cada rareza se ve distinta, las estadísticas por fin cuentan y conseguir un Legendario es un momento',
    intro: 'Las tarjetas tienen un lenguaje propio por rareza y ya no cortan sus efectos al seleccionarlas. Las estadísticas de cada futbolista afectan a la partida y se explican en su ficha, donde además puedes comparar dos jugadores. Los Legendarios, Míticos y Leyendas llegan con una escena propia.',
    features: [
      { icon: '★', title: 'Gacha nuevo', text: 'Apertura rápida para Común, Raro y Épico; para Legendario, Mítico y Leyenda, tu futbolista entra en silueta y usa su técnica emblemática para romper la cápsula.' },
      { icon: '◆', title: 'Tarjetas por rareza', text: 'Remates para Raro, pulso de energía para Épico, doble marco dorado para Legendario, holográfico con chispas para Mítico y aro de luz con corona para Leyenda.' },
      { icon: '▲', title: 'Estadísticas reales', text: 'Tiro, Control, Defensa, Físico, Velocidad, Agallas y Aguante cambian la partida; la ficha dice cuánto, y puedes comparar dos futbolistas.' },
      { icon: '♜', title: 'Bustos con equipación', text: 'Los retratos llevan la equipación de los equipos de IE3, Zero incluido.' },
      { icon: '⚡', title: 'Tormenta de fuego', text: 'Con su Majin de fuego, el giro y la volea.' },
      { icon: '✦', title: 'HUD móvil', text: 'Panel compacto, minimapa sin solapes y compañeros que se distinguen.' },
      { icon: '♟', title: 'Formaciones ajustadas', text: 'Ofensiva, equilibrada y defensiva siguen marcando la diferencia, pero ya no deciden la partida solas.' },
    ],
    start: ['Tira en la máquina de fichajes', 'Compara a dos futbolistas en la Enciclopedia', 'Prueba a Axel con Tormenta de fuego'],
  },
  {
    version: '1.21', date: '2026-11-02',
    title: 'InaZurvivors Fix 1.21 — Talentos, tarjetas y equipaciones de IE3',
    tagline: 'Talentos que se notan, tarjetas que brillan y 54 equipaciones nuevas',
    intro: 'Los talentos funcionan siempre y con sus nombres de la saga, las técnicas básicas dejan sitio a talentos, las tarjetas brillan según su rareza y casi todos los equipos de IE3 estrenan su equipación. Los rivales pegan más fuerte.',
    features: [
      { icon: '✦', title: 'Talentos de verdad', text: 'Siempre activos, con sus nombres: Femme fatale, Casanova, Ultratécnica, Carga elemental, Mejor garantía, Gafe...' },
      { icon: '★', title: 'Tarjetas nuevas', text: 'Brillo según la rareza, media de estadísticas y radar en la ficha y en tu equipo.' },
      { icon: '♜', title: 'Equipaciones de IE3', text: 'Earth Eleven, Zero, Protocol Omega, Orion y muchas más, con los colores del juego.' },
      { icon: '⚡', title: 'Técnicas', text: 'Nombres de la saga en español y Tiro Supermasivo con animación propia.' },
      { icon: '▲', title: 'Más reto', text: 'Los rivales pegan más y tus compañeros suman menos vida.' },
      { icon: '◆', title: 'Móvil', text: 'La interfaz se ajusta sola a pantallas pequeñas.' },
    ],
    start: ['Mira el radar de tus futbolistas en la Enciclopedia', 'Prueba una equipación de IE3', 'Sobrevive a la recta final'],
  },
  {
    version: '1.2', date: '2026-11-02',
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
    version: '1.12', date: '2026-11-02',
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
    version: '1.11', date: '2026-11-01',
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
    version: '1.1', date: '2026-11-01',
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
    version: '1.0', date: '2026-11-01',
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
