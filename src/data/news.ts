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
import { tr } from '../i18n/i18n';

export type NewsKind = 'novedad' | 'aviso' | 'actualizacion' | 'fix' | 'evento';
export type NewsBlock =
  | { h: string; icon?: string }
  | { p: string }
  | { list: string[] }
  | { callout: 'aviso' | 'nuevo' | 'info'; text: string }
  | { divider: true };
export interface NewsItem { id: string; kind: NewsKind; date: string; title: string; summary: string; icon?: string; pinned?: boolean; blocks: NewsBlock[]; version?: string;
  /** (author) hidden until this moment (ISO date with its zone; the game passes the server's clock) */ from?: string }

export const NEWS_KIND_LABEL: Record<NewsKind, string> = { novedad: tr('NOVEDAD'), aviso: tr('AVISO'), actualizacion: tr('ACTUALIZACIÓN'), fix: tr('FIX'), evento: tr('EVENTO') };

export const AUTHOR_NEWS: NewsItem[] = [
  // 2.1 (author): the season pass opens with the BlueLock collab; until then the news only tells how it works (who the two
  // footballers are stays a secret: the menu shows them in silhouette)
  {
    id: 'pase-temporada-1', kind: 'novedad', date: '2026-11-11', icon: '👑', pinned: true,
    title: tr('Llega el pase de temporada (12 de noviembre)'),
    summary: tr('El 12 de noviembre a las 12:00 empieza la Temporada 1: un pase de 125 niveles con una fila normal y otra premium, dos futbolistas nuevos y el ranking por temporadas.'),
    blocks: [
      { callout: 'info', text: tr('La **Temporada 1** empieza el **12 de noviembre a las 12:00** y dura **un mes**: hasta el **12 de diciembre a las 15:00**.') },
      { h: tr('El pase'), icon: '🎟️' },
      { list: [
        tr('**125 niveles** que se suben **jugando partidas**: cada minuto jugado da EXP, y **cuanto más alto el rango, más EXP**.'),
        tr('Dos filas de premios: la **normal** y la **premium**. La EXP cuenta siempre; cuando abras una fila, reclamas todo lo que ya hayas alcanzado.'),
        tr('Completarlo entero lleva como mínimo unas **15-20 partidas** en los rangos más altos.'),
      ] },
      { h: tr('Las dos llaves'), icon: '🔑' },
      { list: [
        tr('**Llave normal**: se compra en la **Tienda** por **15.000 monedas** y abre la fila normal.'),
        tr('**Llave dorada**: no se compra. **Cae al derrotar rivales** durante las partidas (**0,005%** por rival) y en **cooperativo la probabilidad es el doble**. Si te toca, lo verás en la misma partida.'),
      ] },
      { h: tr('Qué hay dentro'), icon: '🎁' },
      { list: [
        tr('**Dos futbolistas nuevos**: uno **Legendario** nada más abrir la fila premium y uno **Leyenda** en el nivel 100. El pase trae también **copias de los dos para ascenderlos**: todas menos la última, que es para el **top 1 del ranking**. ¿Quiénes serán? Míralos en silueta en el menú.'),
        tr('Fila normal: monedas, fichas, tiradas, **jugadores de un equipo nuevo para tu club**, dos **banners** de perfil y un **marco**.'),
        tr('Fila premium: **mucho oro**, fichas, **tiradas ×10**, **Fichas EG**, un **banner** y un **marco Legendarios** exclusivos de la temporada.'),
      ] },
      { h: tr('El ranking, por temporadas'), icon: '🏆' },
      { list: [
        tr('El ranking también va por temporadas y termina con el pase, el **12 de diciembre a las 15:00**. Cuenta tu mejor marca en la clasificación general; después empieza de cero.'),
        tr('**Top 1**: 2.500 fichas, 300.000 monedas, 15 Fichas EG, **los dos futbolistas del pase** (la copia que el pase no da: solo el campeón puede ascenderlos al máximo) y el banner y el marco **Míticos** de campeón.'),
        tr('**Top 2-3**: 1.500 fichas, 180.000 monedas, 15 Fichas EG y el banner y el marco **Legendarios** del podio.'),
        tr('**Top 4-8**: 900 fichas, 100.000 monedas, 6 Fichas EG y un banner **Épico**. **Top 9-15**: 600 fichas, 60.000 monedas, 4 Fichas EG y un banner **Raro**.'),
        tr('**Todos los demás con marca**: 250 fichas, 25.000 monedas y 2 Fichas EG. Los premios te llegan al entrar en el juego después del cierre.'),
      ] },
    ],
  },
  // (author) InaZurvivors x BlueLock: it appears on its own, pinned, the moment its banner opens (server clock)
  {
    id: 'colab-bluelock', kind: 'evento', date: '2026-11-12', icon: '⚽', pinned: true, from: '2026-11-12T12:00:00+01:00',
    title: tr('¡InaZurvivors x BlueLock ya está aquí!'),
    summary: tr('Seishiro Nagi e Yoichi Isagi llegan en su propio banner durante 7 días. Juntos tienen afinidad del 20% y Cometa legendario.'),
    blocks: [
      { callout: 'nuevo', text: tr('La nueva colaboración ya está abierta: **InaZurvivors x BlueLock**, hasta el **19 de noviembre a las 12:00**.') },
      { h: tr('Los fichajes'), icon: '⚽' },
      { list: [
        tr('**Seishiro Nagi** · Aire · Delantero · **Mítico**: Ventisca eterna, Espejismo de balón, Regate supersónico y Ultratécnica.'),
        tr('**Yoichi Isagi** · Bosque · Delantero · **Mítico**: Impulso efímero, Mirada al futuro, Fuerza de tiro y Lance crítico.'),
        tr('Juntos tienen **afinidad del 20%** como Aura y la técnica combinada **Cometa legendario**.'),
      ] },
      { h: tr('El banner'), icon: '🎰' },
      { list: [
        tr('Se paga con **fichas de evento**: **15** una tirada y **150** diez. Ganas fichas de evento con las partidas en **rango S o X** mientras está abierto.'),
        tr('Nagi e Isagi **solo salen en este banner** y solo mientras dure.'),
      ] },
      { h: tr('Premios de la colaboración'), icon: '🏅' },
      { list: [
        tr('Gana **3 partidas** mientras esté abierta y llévate el **banner de perfil InaZurvivors x BlueLock**.'),
        tr('Ficha a **Nagi y a Isagi** y consigue el **Marco BlueLock**.'),
      ] },
      { callout: 'info', text: tr('Lo encontrarás en el menú, en **FICHAJES**, y en la portada del carrusel.') },
    ],
  },
  {
    // 2.2 (author): never say who Zabel really is
    id: 'sector-quinto', kind: 'evento', date: '2026-11-12', icon: '⚔️', pinned: true, from: '2026-11-12T12:00:00+01:00',
    title: tr('Sector Quinto: ¿de qué bando eres?'),
    summary: tr('Elige Sector Quinto o Resistencia para toda la temporada. Cada semana gana el bando que mejor juegue: marco, fichas, monedas y copias de sus tres estrellas.'),
    blocks: [
      { callout: 'nuevo', text: tr('Desde hoy y hasta el **12 de diciembre a las 15:00**: elige bando en el **carrusel del menú**. Necesitas tu cuenta conectada.') },
      { h: tr('Los bandos'), icon: '⚔️' },
      { list: [
        tr('**Sector Quinto** · Victor Blade, Bai Long y Tezcat.'),
        tr('**Resistencia** · Arion + Arthur, Riccardo + Nobunaga y Victor + Okita (Mixi Max).'),
        tr('El bando es **para toda la temporada**. El que vaya por delante en miembros no admite a nadie más hasta que el otro lo alcance.'),
      ] },
      { h: 'Decretos', icon: '📜' },
      { list: [
        tr('Antes de cada partida, **Zabel** impone un decreto del Sector. **Acátalo**, o **rebélate**: sin decreto, pero con rivales más duros y muchos SEED, y tu victoria vale **×1,5**.'),
        tr('Cada semana, un **decreto semanal** da **+20 %** a un elemento para todo el mundo.'),
      ] },
      { h: tr('Cada jueves a las 12:00'), icon: '🏅' },
      { list: [
        tr('Gana el bando con más **puntos de media por jugador activo** (cuentan tus victorias en partidas normales).'),
        tr('Bando ganador: **300 fichas**, **15.000 monedas**, una **copia de sus tres estrellas** y el **marco del bando** la primera vez.'),
        tr('Bando perdedor: **100 fichas** y **5.000 monedas** si jugaste esa semana.'),
      ] },
    ],
  },
  {
    id: 'pase-temporada-1-abierto', kind: 'evento', date: '2026-11-12', icon: '👑', pinned: true, from: '2026-11-12T12:00:00+01:00',
    title: tr('¡Ya está aquí el pase de la Temporada 1: Soy todopoderoso!'),
    summary: tr('Cronus Fourseasons (Legendario, con Surtur) al conseguir la llave dorada y Super Zanark (Leyenda, con Zodíaco) en el nivel 100, y más copias suyas hasta el 125. Hasta el 12 de diciembre.'),
    blocks: [
      { callout: 'nuevo', text: tr('El **pase de la Temporada 1** está abierto hasta el **12 de diciembre a las 15:00**. Lo tienes en **Competición > Temporada**.') },
      { h: tr('Los dos fichajes'), icon: '⭐' },
      { list: [
        tr('**Cronus Fourseasons** · Fuego · Centrocampista · **Legendario**, con el Espíritu Guerrero **Surtur**: nivel 1 de la fila premium, nada más abrirla.'),
        tr('**Super Zanark** · Montaña · Delantero · **Leyenda**, con el Espíritu Guerrero **Zodíaco**: Golpe cataclismo, Ultratécnica, Carga elemental y **Soy todopoderoso**. Nivel 100 de la fila premium.'),
        tr('Y a lo largo de la fila premium, copias de **Zanark Avalonic** y de **Zanark + Cao Cao** (Míticos): **11 de cada uno**, una cada 10 niveles.'),
      ] },
      { h: tr('Cómo va'), icon: '🔑' },
      { list: [
        tr('Sube de nivel jugando: cada minuto de partida da EXP, y más cuanto más alto es el rango.'),
        tr('**Llave normal**: en la **Tienda** por **15.000 monedas**. Abre la fila normal: monedas, fichas, tiradas, los jugadores del **Dominio de Zanark**, dos banners y un marco.'),
        tr('**Llave dorada**: cae al derrotar rivales (**0,005%** por rival, **el doble en cooperativo**). Abre la fila premium: mucho oro, fichas, tiradas ×10, Fichas EG, el banner y el marco legendarios **Soy todopoderoso**, Zanark y los dos fichajes.'),
        tr('Al conseguir una llave puedes reclamar todos los niveles que ya hayas alcanzado.'),
      ] },
    ],
  },
  {
    id: 'version-2-0-espiritus', kind: 'actualizacion', date: '2026-11-10', icon: '👻', pinned: true,
    title: tr('¡Llega la 2.0: Espíritus Guerreros!'),
    summary: tr('La actualización más grande de InaZurvivors: 19 Espíritus Guerreros con definitivas, el Rango Z, seis arenas nuevas, técnicas combinadas de leyenda y mucho más. Aquí tienes todo explicado.'),
    blocks: [
      { callout: 'nuevo', text: tr('Se acabó la fase «pre»: esto ya es la **versión 2.0**. Gracias a todos los que habéis jugado, probado y reportado fallos durante estas semanas.') },
      { h: tr('Espíritus Guerreros'), icon: '👻' },
      { p: tr('Algunos futbolistas llevan dentro un **Espíritu Guerrero** de los juegos GO. Los reconocerás por su **insignia** en las cartas y en Mi Equipo. Hay **19**: Grandius, Pegaso, Lancelot, Musashi, Apolo, Surtur, Chione, Guiverno Blanco, Magister, Azote Negro, Eris, Huargo, Glenr, Jmet, Papelín, Zodíaco, Evera, Demogorgo y Atenea.') },
      { list: [
        tr('**Despertarlo** cuesta **3 Fichas EG**. Desde la casilla **ESPÍRITUS GUERREROS** del menú ves todos, quién los lleva y qué dan.'),
        tr('Sube de nivel **I → II → III → IV → V → Ω** (cada nivel cuesta una ficha más que el anterior: II 1, III 2… Ω 5).'),
        tr('Cada nivel sube un **% la estadística** de la técnica del espíritu (tiro, regate, defensa o parada) y refuerza su **pasiva**, que ayuda a **todo el equipo** mientras su futbolista juega.'),
        tr('Los espíritus son de **fuego, aire, montaña o bosque**: su color, su **marco** (que crece con el nivel) y la **fanfarria** al despertarlos van por su elemento.'),
        tr('Toca el retrato de un espíritu para ver su **carta en 3D**: gírala, dale la vuelta y pasa de uno a otro con las flechas.'),
      ] },
      { h: tr('Definitivas con la R'), icon: '⚡' },
      { p: tr('El espíritu del futbolista **más a la izquierda** de tu equipo es el **activo**. Su definitiva se lanza con **R**, con **Y / Triángulo** en el mando o con su **botón** (encima de las placas). Los demás espíritus del equipo dan su pasiva.') },
      { list: [
        tr('Se recarga cada **30 s**; la mejora **«Espíritu despierto»** (Mejoras, Combate) la baja hasta **15 s**. Las ráfagas de daño (¡GENIAL!… ¡INAZUMA!) también la cargan un poco.'),
        tr('Abarcan el doble que una técnica normal y cada una tiene **su propia escena**, dibujada desde el juego original: el puño de Demogorgo, el rayo de Atenea, la prisión escarlata de Zodíaco, el sol de Apolo…'),
        tr('Un anillo bajo los pies del futbolista y el botón te dicen cuánto falta. Cuando está lista, se anuncia en pantalla.'),
      ] },
      { h: tr('Cómo conseguir Fichas EG'), icon: '🎴' },
      { list: [
        tr('**1** por cada mapa superado en **rango X** y **3** en **rango Z**.'),
        tr('**3** con el código **EGu3rr3r0** (una sola vez, en la casilla CÓDIGOS).'),
        tr('Hasta **6 por semana** en la **tienda del clan** (1 por 2 Néctar y 1 Chapa vieja).'),
        tr('En los **premios semanales del clan**: **12** el primero, **8** el top 3, **5** el top 8 y **2** el resto.'),
      ] },
      { divider: true },
      { h: tr('Rango Z'), icon: '🏔' },
      { p: tr('Más allá del X, para los mejores equipos. Abre el **martes 10 a las 12:00**: los rivales más duros del juego, recompensas **×3,2**, **60 fichas** la primera victoria en cada arena, **3 Fichas EG** por mapa y **×7** de puntos en el ranking.') },
      { h: tr('Seis arenas nuevas'), icon: '🗺' },
      { list: [
        tr('**Puerto de Ehime** · jefe Caleb Stonewall'), '**Academia Alius** · jefe Xene', tr('**Instituto en ruinas** · jefe Kevin Dragonfly'),
        tr('**Parque de la calle comercial**'), tr('**Plaza nevada del Alpino**'), tr('**Torre de hierro al atardecer**'),
      ] },
      { h: tr('Técnicas combinadas nuevas'), icon: '🔗' },
      { p: tr('Se aprenden en la partida cuando sus futbolistas están en el campo con sus técnicas al nivel que piden (lo verás en Mi Equipo y en las cartas):') },
      { list: [
        tr('**Escena nocturna**: cualquier Desmodus con cualquier Wolfram, bajo una luna roja.'),
        tr('**Último recurso** (Asuto, Nosaka y Haizaki) o **Último recurso Σ** (también Hikaru): solo se aprende uno por partida. Con uno de ellos activo, **Petronio** puede aprender **Último recurso: Dragón**.'),
        tr('**Impulso del equipo definitivo** (Victor, Fei y Arion en sus Mixi Max), **Lluvia oscura**, **Lluvia de azufre**, **Triple amenaza**, **Grito del Edén** y **Pingüino emperador n.º 3**.'),
      ] },
      { callout: 'info', text: tr('Los futbolistas que comparten una técnica combinada tienen **afinidad del 20%** como Aura. Y un futbolista y su propia forma Mixi Max (por ejemplo, Wolfram y Vulpeen MM) **no pueden** ser Aura el uno del otro.') },
      { h: tr('Técnicas redibujadas'), icon: '🎬' },
      { p: tr('**Golpe cataclismo**, **Ceniza negra**, **Impulso efímero** y los tiros de **Victor Blade** se han dibujado de nuevo, fotograma a fotograma, desde sus escenas.') },
      { divider: true },
      { h: 'Clanes', icon: '🏯' },
      { p: tr('Cada jugador juega **1 partida al día** por su clan en la Colina de los Cerezos. Hay **misiones semanales** nuevas (por ejemplo, jugar 5 días distintos o que ganen 3 miembros), más premios y, cada lunes, **Fichas EG** según vuestro puesto.') },
      { h: tr('Una nueva colaboración'), icon: '🤫' },
      { p: tr('Cuando termine el **Banner de agradecimiento** llega una **colaboración nueva**. Aún es secreta: el menú te dirá cuántos días faltan. ¿Quiénes serán?') },
      { h: tr('Lo que ya estaba en la fase previa'), icon: '🤝' },
      { list: [
        tr('**Cooperativo**: juega con un amigo, cada uno con su equipo (casilla COOP).'),
        tr('**Amigos**: añádelos por su nombre o desde su perfil en el ranking.'),
        tr('**Entrenadores**: salen en las máquinas de fichajes y, desde el banquillo, dan ventajas a tu equipo.'),
        tr('**Road to Fútbol Frontier**: gana en Máxima y llévate a **Jaden Evans**.'),
      ] },
      { divider: true },
      { h: tr('Para empezar'), icon: '▶' },
      { list: [
        tr('Canjea **EGu3rr3r0** en **CÓDIGOS**: con esas 3 fichas despiertas tu primer espíritu.'),
        tr('Abre **ESPÍRITUS GUERREROS** y mira quién de tu colección lleva uno.'),
        tr('Pon a ese futbolista **el primero por la izquierda** de tu equipo y pulsa **R** en la partida.'),
      ] },
      { callout: 'aviso', text: tr('Si encuentras cualquier fallo, repórtalo desde el **🐞** del menú. ¡Gracias por jugar!') },
    ],
  },
  {
    id: 'online-pre2', kind: 'novedad', date: '2026-11-06', icon: '🤝', // 2.0: no longer pinned (the 2.0 news is)
    title: tr('Pre-2.0: llega el cooperativo online (en pruebas)'),
    summary: tr('Ya puedes jugar con un amigo: cada uno con su equipo, los mismos rivales y una barra de experiencia para los dos. Está en pruebas: si veis fallos, reportadlos.'),
    blocks: [
      { h: tr('Juega con un amigo'), icon: '🤝' },
      { p: tr('Desde la casilla **COOP** del menú puedes **crear una sala** y pasar su código, o **unirte** con el código de otro. También puedes añadir **amigos** (casilla **AMIGOS**, o desde su perfil en el ranking) e **invitarles** directamente a tu sala.') },
      { list: [
        tr('Cada uno juega con **su propio equipo**, sus mejoras y su vida.'),
        tr('Los rivales, los objetos y la **barra de experiencia son de los dos**: al subir de nivel se pausa la partida y cada uno elige sus cartas.'),
        tr('Si tu capitán cae, tu compañero puede **levantarte** quedándose a tu lado unos segundos. Si caéis los dos, se acaba la partida.'),
        tr('Los **altares** son de cada uno: lo que dan solo le sirve a quien los activa.'),
        tr('El jefe va a por el capitán que tenga **más cerca**.'),
        tr('Las partidas en cooperativo **no cuentan para el ranking**.'),
      ] },
      { callout: 'aviso', text: tr('El online está **en pruebas**: es la parte más nueva y difícil del juego y seguro que tiene fallos (desconexiones, cosas que no se ven igual en las dos pantallas...). Se necesita **entrar con tu cuenta**.') },
      { h: tr('Límite de partidas'), icon: '⏱' },
      { p: tr('El cooperativo es **gratis**, y para que lo siga siendo tiene unos límites:') },
      { list: [
        tr('Cada jugador puede crear hasta **40 salas al día**.'),
        tr('Si vuestras redes no se ven directamente, la partida pasa por un **servidor de paso**. Cada jugador puede usarlo hasta **20 veces al día**, y entre todos hay un tope de **8000 salas al mes**.'),
        tr('Si se llega al tope del mes, se puede seguir jugando cuando las dos redes se conectan directamente (lo más habitual en casa). El cupo vuelve a empezar **el día 1 de cada mes**.'),
      ] },
      { divider: true },
      { h: tr('Ayúdanos a que funcione'), icon: '🐞' },
      { p: tr('Si encontráis cualquier fallo jugando juntos, **reportadlo desde el 🐞 del menú** y contad qué estabais haciendo, en qué arena y si erais el anfitrión o el invitado. Cada reporte nos ayuda a que el cooperativo funcione bien en el futuro, y si se corrige os llevaréis vuestras **100 fichas**.') },
    ],
  },
  {
    id: 'bugs-1-85', kind: 'novedad', date: '2026-11-05', icon: '🐞', pinned: true,
    title: tr('¡Reporta bugs y gana fichas!'),
    summary: tr('Cada bug que reportes y se corrija te da 100 fichas de fichaje. Y las estrellas vuelven a empezar para todos con las reglas nuevas.'),
    blocks: [
      { h: tr('Ayuda a mejorar el juego'), icon: '🐞' },
      { p: tr('Si encuentras un fallo, repórtalo desde el **🐞 del menú** o en **Ajustes » Reportar un bug**. Cuéntanos qué pasó y, si puedes, cómo repetirlo y una captura.') },
      { callout: 'nuevo', text: tr('Revisamos cada reporte. Cuando se **corrige**, recibes **100 fichas** automáticamente y un aviso la próxima vez que abras el juego. Necesitas **entrar con tu cuenta**.') },
      { list: [
        tr('Un reporte por fallo: los repetidos o que no son un bug se descartan.'),
        tr('Cuanta más información (pasos, captura, dónde estabas), antes se corrige.'),
      ] },
      { divider: true },
      { h: tr('Estrellas nuevas, para todos igual'), icon: '★' },
      { p: tr('Las estrellas ahora se **compran con monedas** en la ficha de cada futbolista y cada una sube **+5 el límite** de la estadística que elijas. Para que nadie empiece con ventaja, **las estrellas de todos se han reiniciado**.') },
    ],
  },
  {
    id: 'gts-1-8', kind: 'novedad', date: '2026-11-04', icon: '🌐', pinned: false,
    title: tr('¡Llega la GTS! Cambia futbolistas con todo el mundo'),
    summary: tr('La 1.8 trae la Estación Global de Intercambio: deja una copia repetida, pide el futbolista que te falta y recoge tu cambio cuando vuelvas.'),
    blocks: [
      { h: tr('La Estación Global de Intercambio'), icon: '🌐' },
      { p: tr('La **GTS** es un banco online de futbolistas. Dejas una **copia repetida** pidiendo el futbolista que quieres a cambio, y cualquier jugador que lo tenga repetido puede cambiártelo **aunque no estés conectado**. Cuando vuelvas, te estará esperando.') },
      { list: [
        tr('**Dejar:** elige tu copia repetida y el futbolista que pides. Se va a la GTS en su cápsula.'),
        tr('**Buscar:** mira lo que han dejado los demás. Si tienes repetido el que piden, cámbialo al momento.'),
        tr('**Recuperar:** mientras nadie te lo cambie, puedes recuperar tu futbolista cuando quieras.'),
        tr('**Historial:** todos tus cambios, con quién los hiciste.'),
      ] },
      { callout: 'info', text: tr('La encontrarás en el menú, en **FICHAJES » GTS**. En la portada verás también los últimos intercambios de todo el mundo. Necesitas **entrar con tu cuenta**.') },
      { divider: true },
      { h: 'Reglas', icon: '🔒' },
      { list: [
        tr('Solo se dejan **copias repetidas**: nunca la única que tienes.'),
        tr('Los **Leyenda** y los futbolistas de **evento** no se pueden dejar. Si has subido a alguien a **HÉROE**, sus copias repetidas sí.'),
        tr('La copia que viaja va **sin entrenamiento, estrellas ni ascensión**: tu futbolista se queda con todo.'),
        tr('Puedes pedir el futbolista que quieras, pero **no puedes repetir un cambio** que ya hiciste.'),
      ] },
      { callout: 'nuevo', text: tr('Empiezas con **1 hueco** para dejar futbolistas. Mejora la **Ventanilla GTS** en MEJORAS (Economía) para tener hasta **5**.') },
      { divider: true },
      { h: tr('Campeón'), icon: '♛' },
      { p: tr('Los **Leyenda** ya no se hacen HÉROE: suben a **Campeón**, **Campeón+** y **Campeón++**. Cada nivel sube **10** el límite de sus estadísticas (de 99 a 109, 119 y 129), mejora sus estadísticas y le da **5 puntos más de entrenamiento**. Si ya tenías un Leyenda HÉROE, ahora es Campeón, y sus estrellas cuentan como los niveles siguientes.') },
      { h: tr('Un jugador de cada'), icon: '👥' },
      { p: tr('En tu equipo no puede repetirse un personaje, ni como Aura: nada de dos Axel, dos Mark, una versión **Oscuro** junto a la normal o una **fusión Miximax** con uno de sus dos jugadores.') },
    ],
  },
  {
    id: 'banner-agradecimiento', kind: 'evento', date: '2026-11-04', icon: '♥', pinned: true,
    title: tr('¡Gracias por ser más de 50 jugando!'),
    summary: tr('Banner de agradecimiento durante 7 días, con futbolistas que solo salen ahí, y el código GRACIAS.'),
    blocks: [
      { h: tr('Más de 50 personas jugando'), icon: '♥' },
      { p: tr('InaZurvivors ya tiene **más de 50 personas jugando**. Muchísimas gracias a todos: para celebrarlo abrimos el **Banner de agradecimiento**.') },
      { list: [tr('**Ataque a los Titanes**: Levi, Eren, Mikasa, Armin y Erwin.'), tr('**Los Siete Pecados Capitales**: Meliodas, Escanor y Ban.'), tr('**Axel Encapuchado**, con la sudadera de Okinawa (Leyenda).'), tr('Todos solo salen en este banner.')] },
      { callout: 'info', text: tr('Empieza el **4 de noviembre a las 15:00** y dura **7 días**. Se tira con **fichas de evento** (15 la tirada, 150 el ×10), que ganas jugando en **Rango S o X**.') },
      { divider: true },
      { h: tr('Código GRACIAS'), icon: '🎁' },
      { callout: 'nuevo', text: tr('Canjea **GRACIAS** en CÓDIGOS: un **×10 gratis** del banner y **10.000 monedas**.') },
    ],
  },
  {
    id: 'tablon-noticias', kind: 'novedad', date: '2026-11-02', icon: '📰',
    title: tr('¡Estrenamos tablón de noticias!'),
    summary: tr('Aquí irán los avisos, las novedades del desarrollo y el registro de todas las actualizaciones de InaZurvivors.'),
    blocks: [
      { h: tr('Un sitio para todas las novedades') },
      { p: tr('A partir de ahora, todo lo que cambie en **InaZurvivors** se contará aquí: las **actualizaciones**, los **avisos** importantes y las **novedades** de lo que viene.') },
      { callout: 'nuevo', text: tr('Las noticias que aún no has leído llevan un **punto amarillo** en la lista, y el botón **NOTICIAS** del menú te avisa cuando hay alguna nueva.') },
      { divider: true },
      { h: tr('El registro de actualizaciones'), icon: '📜' },
      { p: tr('Todas las versiones públicas, desde la **v1.0**, se quedan en el tablón con su fecha: puedes repasar qué trajo cada una cuando quieras.') },
      { list: [tr('Las **actualizaciones** (cambio de versión, como la 1.4) van en verde.'), tr('Los **fixes** (parches como el Fix 1.41 o el 1.31) van en naranja, con una llave inglesa.'), tr('Los **avisos** van en rojo: léelos, suelen ser importantes.'), tr('Las **novedades** y los **eventos** van en azul y morado.')] },
    ],
  },
];

/** Fix 1.41: a patch has two decimals (1.41, 1.32, 1.22) or says «Fix» in its title; 1.3, 1.4 are updates. */
export const isFix = (r: PublicRelease) => !/semiactualizaci|semi-update/i.test(r.title) && (/^\d+\.\d\d$/.test(r.version) || /\bfix\b/i.test(r.title)); // v1.65: a semi-update is news, not a fix

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
      { h: tr('Qué trae'), icon: '✦' },
      { list: feats.map((f) => `${f.icon} **${f.title}**: ${f.text}`) },
      ...(r.start.length ? [{ divider: true } as NewsBlock, { h: tr('Cómo empezar'), icon: '▶' } as NewsBlock, { list: r.start } as NewsBlock] : []),
    ],
  };
}

/** Every news item, pinned first, then newest first (same day: author news before the update). */
export function allNews(online = true, now: number | Date = Date.now()): NewsItem[] {
  const all = [...AUTHOR_NEWS.filter((n) => !n.from || +now >= Date.parse(n.from)), ...PUBLIC_RELEASES.map((r) => releaseNews(r, online))];
  const order = new Map(all.map((n, i) => [n.id, i]));
  return all.sort((a, b) => Number(!!b.pinned) - Number(!!a.pinned) || b.date.localeCompare(a.date) || order.get(a.id)! - order.get(b.id)!);
}

/** id of the newest item: the menu marks Noticias as new until it has been opened. */
export const latestNewsId = (now: number | Date = Date.now()) => [...AUTHOR_NEWS.filter((n) => !n.from || +now >= Date.parse(n.from)).map((n) => ({ id: n.id, date: n.date })), ...PUBLIC_RELEASES.map((r) => ({ id: `version-${r.version}`, date: r.date }))]
  .sort((a, b) => b.date.localeCompare(a.date))[0]?.id ?? '';
export const LATEST_NEWS_ID = latestNewsId();
