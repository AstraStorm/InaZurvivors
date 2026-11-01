/**
 * INTERNAL version history (builds). Players see the public history in release.ts, which starts at v1.0; this list is
 * kept for development and for tracing bug reports (BUILD). PROGRESS.md keeps the technical detail.
 */
export interface Release {
  version: string;
  date: string;
  title: string;
  features: string[];
  fixes: string[];
  visuals: string[];
  balance: string[];
  next?: string[];
}

export const CHANGELOG: Release[] = [
  {
    version: '4.3', date: '2026-11-01', title: 'Gameplay',
    features: [
      'Rivales con comportamiento propio: tiradores, interceptores, bombas y tanques; rodeos y castigo por quedarse quieto.',
      'Jefes con tres fases y ataques propios; Desafío de rival con barra de vida, fases y técnicas del personaje.',
      'Eventos con tarjeta previa, aceptación con E, panel de progreso y resultado; minimapa y flechas en el borde.',
      'Infinito en cinco fases hasta el Infierno, con escalado sin límite y recompensas solo por jugar.',
      'Talentos con efecto real y pasivas adaptadas para quien no tiene talento documentado.',
      'Fichatrón separado de los equipos de la historia; equipo favorito con escudo y equipación desde el inicio.',
      'Teclas 1, 2 y 3 para elegir mejora y pantalla de resultados nueva.',
    ],
    fixes: ['Música secuenciada: instrumentos desafinados entre sí y octavas erróneas corregidos (MUSICA.md).'],
    visuals: [],
    balance: ['Rebalanceo general con topes de build e imanes mucho más raros (BALANCE.md).'],
  },
  {
    version: '4.2', date: '2026-11-01', title: 'Preparación v1.0',
    features: [
      'Google como único acceso online; jugar como invitado se mantiene.',
      'Reiniciar progreso conservando cuenta y nombre global (copia en el servidor, épocas de progreso).',
      'Reportar un bug (menú, ajustes y pausa) con captura privada; panel de bugs para administradores.',
      'Novedades públicas desde v1.0, TikTok del autor y ranking mundial destacado en el menú.',
    ],
    fixes: ['Técnicas de IE3: los nombres estaban desplazados respecto a sus datos; además, movesets oficiales de la wiki (p. ej. Astaroth: El Olvido).'],
    visuals: [], balance: [],
  },
  {
    version: '4.1', date: '2026-10-31', title: 'Capitanes',
    features: [
      'Sael aparece con su nombre español (era «Sanctus», nombre inglés de la ROM) en Sky Team, Ángel Oscuro y Chaos Angels, y es Legendario.',
      'Nombres españoles de la wiki para los jugadores de IE3 cuando existen (sin crear duplicados).',
      'Capitanes reales: Pierre Godin, Queraldo Naval y Jonas Polk ya son los adultos del Mundial; vuelven Zanark Avalonic y Alpha (Alfa); Chrono Storm con su plantilla.',
      'Cuentas online listas para activarse: registro con correo y contraseña, confirmación, recuperación, nombre global permanente, guardado en la nube con control de versiones y ranking mundial.',
      'Página de privacidad y condiciones.',
      'Panel de ranking mundial en el menú principal (TOP 5 y tu posición cuando el servicio online esté activo).',
      'Sky Team y Ángel Oscuro con su nombre en español en la enciclopedia.',
    ],
    fixes: [
      'Los focos del menú ya no se cortan: haces completos que se desvanecen suavemente.',
      'Las Fichas de Fichaje tienen su propio icono (moneda dorada con rayo) en vez del rombo azul.',
      'Los jugadores que ahora usan otra ficha de la ROM conservan su progreso (copias, estrellas, ascensión).',
    ],
    visuals: ['Nuevo icono de ficha en menús, HUD y en el campo.'],
    balance: ['Sael y Alpha pasan a Legendario.'],
    next: ['Activar el servicio online (necesita tu proyecto de Supabase)', 'Publicar en GitHub Pages cuando lo apruebes'],
  },
  {
    version: '4.0', date: '2026-10-31', title: 'Héroes',
    features: [
      'Ascensión HÉROE: Legendario » Mítico con 3 duplicados y Mítico » Héroe con 5. Marco dorado, más daño y vida, «Espíritu de héroe» y una técnica de Héroe sacada de las listas oficiales de la wiki (p. ej. Mark: Mano Omega).',
      'Supervivencia infinita: al derrotar al jefe eliges terminar o seguir, con dificultad creciente, recompensas por minuto y récord.',
      'Eventos nuevos: supervivencia, portal de rivales, duelo, contrarreloj, defensa de zona, cofre especial y minijefe.',
      'Ranking con TOP 15, medallas y filtros. Global cuando se active el servicio online; mientras, tus mejores marcas.',
      'Nombre de usuario permanente al crear el perfil, con reglas y comprobación en vivo.',
      '16 misiones nuevas (diarias, semanales y logros) con duplicados como recompensa; 7 mejoras permanentes nuevas.',
      'Equipos completos: Dark Emperors con sus 11 jugadores y equipos principales agrupados en la enciclopedia.',
      'Salón de la fama: cada victoria con el equipo que la ganó y las leyendas de tu club por número de victorias.',
      'Cada equipación da un bonus (con nombre propio en los equipos principales) y «Química de club» con 3 o más jugadores del equipo.',
      'Las caras del HUD y de los menús, el muñeco del capitán y los jugadores del fondo del menú llevan la equipación puesta (torsos originales de la ROM).',
    ],
    fixes: [
      'Los futbolistas con varias fichas en la ROM ya pertenecen a todos sus equipos.',
      'Escudos encontrados tanto por el nombre de la ROM como por el nombre visible.',
    ],
    visuals: [
      'Supertécnicas con fases y entidades: demonio, Majin detrás del portero, tormenta de fuego en varias fases.',
      'Subida de nivel con cámara lenta breve y celebración al maximizar una técnica.',
      'Escudo del club en el HUD de vida y experiencia.',
      'Registro de perfil por pasos: nombre, escudo, equipo y confirmación.',
    ],
    balance: ['Revisión de rarezas con justificación (data/rarity_review.md).', 'Más élites y peligros en rangos altos; el infinito sube un 35% por minuto.'],
    next: ['Activar cuentas por correo, nombres globales y ranking online (preparado, ver ONLINE.md)', 'Nuevos mapas', 'Más técnicas combinadas verificadas'],
  },
  {
    version: '3.1', date: '2026-10-31', title: 'Aviso legal',
    features: ['Pie del menú con el aviso legal y enlace a la nueva pantalla de créditos y aviso legal.'],
    fixes: ['Los paneles de la máquina de fichajes ya no se aplastan en columnas estrechas.'],
    visuals: [], balance: [],
    next: ['Publicación web cuando haya recursos con permiso de distribución'],
  },
  {
    version: '3.0', date: '2026-10-31', title: 'InaZurivors',
    features: [
      'Nuevo nombre: InaZurivors, con el escudo del Raimon en la pestaña del navegador.',
      'Mi Equipo: elige 7 candidatos y tu capitán; solo ellos aparecen como fichajes en la partida.',
      'Dificultades C, B, A, S y X: más ritmo, élites, balones que caen del cielo y jefes con patrones. Más recompensas cuanto más alto.',
      'Técnicas combinadas: Fuego cruzado (Axel + Shawn), Tornado dragón (Kevin + Axel) y Ruptura relámpago (Jude + Mark + Axel).',
      'Botón RECLAMAR TODO en misiones y en recompensas de equipo.',
      'Máquina de fichajes explicada: fichas, costes, probabilidades reales, duplicados e historial.',
      'Tutorial breve que se puede saltar y volver a ver desde Opciones.',
      'Este devlog.',
      'Escudos de 215 equipos de IE3 y equipos reales para los jugadores que salían como agentes libres.',
      'Colmillo de pantera reforzado: unas fauces de fuego muerden a todos los rivales cercanos.',
    ],
    fixes: [
      'La tienda diaria ya no cambia al entrar y salir: las ofertas se guardan para todo el día.',
      'La música no se superpone ni se queda sonando al cambiar de pantalla.',
      'Los objetos y la experiencia se recogen siempre, aunque el capitán esté quieto, sin quedarse orbitando.',
      'Los golpes a compañeros se ven y cuentan en la vida compartida, con un instante de invulnerabilidad.',
      'Iconos de las cartas de mejora: cada uno con su objeto, y las técnicas con su tipo y elemento.',
      'El perfil solo deja equipar lo que tienes desbloqueado.',
      '48 técnicas de IE3 que salían en inglés ya usan su nombre oficial de IE2 en español.',
      'Un mando conectado con un botón o el stick atascado ya no mueve los menús solo.',
    ],
    visuals: [
      'Cámara más cercana, con seguimiento suave y ajuste de zoom en Opciones.',
      'Orbes de experiencia nuevos: chispa, balón y rayo según su valor.',
      'Rivales que reaccionan al golpe y salen despedidos al caer.',
      'Pantalla de carga con progreso; las caras se descargan solo cuando se ven.',
      'Icono de elemento (llama, remolino, hoja, montaña) en cartas, fichas y en el HUD de cada jugador.',
    ],
    balance: [
      'Primeros 30 segundos con más rivales; oleadas de presión seguidas de respiros.',
      'Rivales élite (dorados) y rápidos (azulados).',
    ],
    next: ['Estadísticas reales de IE3 (aún estimadas)', 'Revisar rarezas de GO, Galaxy y Ares', 'Más técnicas combinadas verificadas'],
  },
  {
    version: '2.8', date: '2026-10-31', title: 'Great Road',
    features: ['1.505 futbolistas nuevos de Inazuma Eleven 3 Great Road, con sagas Mundial, GO, Chrono Stones, Galaxy, Ares y Orion.'],
    fixes: ['Potencias imposibles de algunas técnicas de IE3 corregidas.'], visuals: [], balance: [],
  },
  {
    version: '2.7', date: '2026-11-01', title: 'Móvil y mando',
    features: ['Joystick táctil y soporte de mando.'], fixes: [], visuals: ['Nuevo HUD y recompensas animadas.'], balance: ['Mejoras por categorías.'],
  },
];

export const CURRENT = CHANGELOG[0];
