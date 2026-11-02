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
    version: '4.9', date: '2026-11-02', title: 'Fix 1.21',
    features: ['Talentos 58 y 59 con los nombres elegidos por el autor: Femme fatale y Casanova.'],
    fixes: [], visuals: [], balance: [],
  },
  {
    version: '4.8', date: '2026-11-02', title: 'v1.2',
    features: [
      'Las 36 formas Miximax son Mítico: entran las fusiones (Tezcat + Bailong, Mark + Arion, Arion + Tezcat...) y Simeon MM.',
      'Todos los futbolistas tienen 4 técnicas activas: las propias de la wiki, técnicas firma incluidas, también las que no están en la ROM; Ares y Orion dejan las del parche.',
      'Tiro Supermasivo con animación propia: vórtice negro y rojo, orbe enorme y grieta en el campo.',
      'Talentos pasivos de verdad: funcionan sin ocupar un hueco de técnica y la ficha dice qué hace cada uno.',
      'Radar de estadísticas en la ficha de cada futbolista.',
      'Equipaciones de los equipos de IE3 sacadas de la ROM: 78 de los 81 equipos principales ya tienen la suya (antes 24).',
      'Tarjetas con brillo por rareza (destello y holográfico), media de estadísticas y radar en la elección de equipo.',
      'Talentos con sus nombres oficiales (Ultratécnica, Carga elemental, Mejor garantía, Gafe...); las acciones básicas como Tiro potente o Tiro raso pasan a ser un talento.',
      'Tres arenas nuevas: Parque del Alpino, Claustro Sagrado e Isla Mary Times, con sus equipos y jefes.',
      'Estadio Zeus renovado: de un edificio sobre nubes grises a un gran estadio dorado y azul.',
    ],
    fixes: [
      'Los efectos temporales nuevos ya no muestran «undefined» en la barra de efectos.',
      'Móvil: la interfaz se escala sola en pantallas pequeñas (unos 330 px de alto en horizontal), minimapa sin tapar la pausa y Tiro Supermasivo sin oscurecer toda la pantalla.',
      'Móvil: la barra del jefe no pisa el panel del capitán y el selector de dificultad ocupa mucho menos.',
      'Móvil: la subida de nivel cabe entera, resultados legibles en horizontal, texto mínimo de 8 px, toques más cómodos y zonas seguras de la muesca.',
    ],
    visuals: [],
    balance: [
      'Monedas: alrededor de un 20 % menos en partidas y misiones.',
      'Los rivales pegan un 55 % más y cada compañero suma menos vida: el daño recibido vuelve a importar.',
      'Recta final: desde el 70 % del tiempo, más rivales, más vida y más daño, de forma progresiva; el jefe no cambia.',
    ],
  },
  {
    version: '4.7', date: '2026-11-02', title: 'Fix 1.12',
    features: [
      'Técnicas combinadas nuevas con animación propia: El Fénix, La Tierra, Remate caótico, Ventisca de fuego y La Tierra ∞; desbloqueo con retratos y nombre.',
      'Tienda: 6 diarias, 2 destacadas, 1 del equipo favorito y 1 semanal, con filtros por rareza y tiempo restante.',
      'Ranking y pase semanal grandes en el menú principal, con podio, top 15 y posición propia.',
      'Códigos promocionales: ASTRA17 (validación en el servidor para cuentas, local para invitados).',
      'Pedestales: el robot de recepción de las cadenas de partidos.',
      'Eventos aceptables con el mando; en táctil, botón sin mención a la tecla E.',
    ],
    fixes: [
      'Una segunda partida sin recargar no reiniciaba tiempo ni eliminaciones (error introducido en la 1.11).',
      'Las ofertas ya generadas el día de la actualización se quedaban con el diseño anterior.',
      'La flecha de los eventos quedaba tapada por su icono.',
      'El panel de evento se solapaba con el del capitán.',
      'Barrido central de marcas de suelo sin dueño.',
    ],
    visuals: ['Hitstop en golpes fuertes, críticos con destello y sonido propio, recompensa por barrer grupos, tono variable de golpes e impactos que crecen con el nivel de la técnica.'],
    balance: ['Curva continua: grupos sin escalones, oleadas que crecen y rivales especiales que llegan hasta el 2:30.', 'Precios de tienda: Común 200, Raro 600, Épico 1.800, Legendario 6.000, Mítico 25.000; Leyendas no se venden.'],
  },
  {
    version: '4.6', date: '2026-11-01', title: 'Fix 1.11',
    features: [
      'Solo el capitán recibe daño: los compañeros son apoyo invulnerable, sin barra de vida; los balones los atraviesan y solo alcanzan al capitán.',
      'Gachas por saga (Inazuma Eleven, GO, Victory Road) y por equipo (14/126 fichas, equipos de 8+ futbolistas), con destacados y probabilidades exactas por rareza y por futbolista; ×10 garantiza un Épico o superior.',
      'Pase semanal gratuito de 7 días (fichas, futbolistas Épico+, monedas y un Épico+ del equipo elegido); saltarse días no pierde nada.',
      'Tienda diaria de 10 ofertas: destacado, oferta del 40% y un fichaje del equipo favorito; rota por la hora del servidor cuando la función server_now está desplegada.',
      '17 misiones nuevas (diarias, semanales y logros) y 5 mejoras permanentes nuevas con tope.',
      'Objetos nuevos: Revivir (máx. 2 cargas), Barrera, Protección elemental, Cazador de élites, Balón amplio y Apuesta arriesgada.',
      'Pantalla de causa de la derrota con el golpe real y un consejo; estadísticas del capitán en la pausa.',
      'Araña Gigante, Mordisco de serpiente y Telaraña con manifestación y efecto propios (atrapar en la red, veneno).',
      'Nivel visible de todas las técnicas salvo talentos: +X, Lv X o GX según su forma de evolucionar.',
      'Supertécnicas dibujadas: manos y puños de portero por familia (Mano celestial V/X, Bimano, Trimano, Manos infinitas, Manos liberadas, puños, Mano ultradimensional, espiritual, de pingüinos), dragones con cuerpo y cabeza (tiros, regates y Mate del dragón), fénix, alas divinas, tornado, llamas, estrella, rayos, hielo y sombras en la carga de los tiros, y defensas y regates por elemento (rocas, enredaderas, viento...).',
      'Talentos como en los juegos: Portero+ refuerza las técnicas de portero, ¡Encanto +! y ¡Guapo +! hacen más daño a rivales masculinos o femeninas, ¡Trampa! deja clavado al rival, Gafe lo maldice, Pereza cura quieto, ¡Crítico! y ¡Todo o nada! hacen críticos más fuertes.',
      'Emperadores Oscuros como fichas propias («Kevin Dragonfly Oscuro»...), con su retrato y su cara.',
    ],
    fixes: [
      'Las telegrafías de rivales que se retiraban quedaban dibujadas en el suelo.',
      'Radio de recogida: las bonificaciones se suman con tope en lugar de multiplicarse.',
      'Talentos duplicados (¡Guapo +!, ¡Súper técnica!) y Pereza con efecto neto negativo; descripciones generadas de sus valores reales.',
      'Los usos de técnica contaban también los intentos sin rival al alcance.',
      'Minimapa tapando el reloj en móvil vertical.',
      'Retratos rotos de los 80 futbolistas de la última hoja del atlas (Mark Brand, Chuck Hardy...): se escalaban con el ancho de la primera hoja.',
      'La supervivencia infinita también muestra qué golpe tumbó al capitán.',
      'Sin equipo favorito, la casilla de la tienda reservada a él se convierte en una oferta normal.',
    ],
    visuals: ['HUD del capitán: barra de vida grande con valores, daño fantasma, estado crítico, barra de experiencia con nivel y escudo del equipo; adaptado a 1920×1080, 1366×768, 1280×720 y móvil.'],
    balance: ['Monedas por partida a la mitad aprox., mejoras ×1,5 y rango X ×2,2 (ECONOMIA_1.11.md); no se quita ninguna moneda.',
      'Formaciones con identidad: ofensiva (+15% daño, -10% recarga), equilibrada (+20% combinadas), defensiva (-30% daño recibido, sin extras de ataque ni penalización); solo cambian estadísticas, los compañeros no bloquean tiros.',
      'Mítico menos probable por futbolista que Legendario y Leyenda la más exclusiva.',
      'Ares y Orion: capitanes de peso a Legendario (Clario Orvan, Froy Girikanan, Li Hao, Yurika Beor), resto de capitanes a Épico como mínimo; Basara que faltaban a Legendario.',
      'Límites de talentos: daño con poca vida máx. +60%, efecto elemental máx. 40%.'],
  },
  {
    version: '4.5', date: '2026-11-01', title: 'Actualización 1.1',
    features: [
      'Introducción en cada visita: completa la primera vez y el logo animado después, con pantalla de bienvenida para quien ya tiene club.',
      'Técnicas oficiales de GO, Chrono Stone y Galaxy (wiki) con nombre español: sustituyen a las del parche Great Road; 220 de 406 futbolistas con cuatro técnicas jugables (antes 20) y 139 con tres.',
      'Nombres en español por nombre japonés (wiki en español) para técnicas que estaban en inglés o japonés.',
      'Las compras de técnicas se trasladan a su nueva posición; si una técnica comprada desaparece, se devuelven sus monedas.',
      'Repertorio de hasta 8 técnicas (4 jugables más talentos) visible en la ficha.',
    ],
    fixes: [
      'La introducción salía en blanco: la pantalla se tomaba por repetida y se congelaban sus animaciones.',
      'Shawn Froste ya no figura en Knights of Queen (registro 2529 de la ROM fuera del bloque del equipo).',
      'Mark Evans Leyenda usa el retrato y la miniatura del Mark adulto (registro 430).',
    ],
    visuals: ['Gacha nuevo: manivela con aceleración y frenado, cápsula que rueda y se asienta, carga por rareza y apertura en dos mitades.'],
    balance: ['Basara de Victory Road a Legendario como mínimo (15 cambios).', 'Economía: tirada a 8 fichas (×10 a 72), más fichas por partida activa, bienvenida en las 10 primeras partidas y misiones más generosas.'],
  },
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
    version: '3.0', date: '2026-10-31', title: 'InaZurvivors',
    features: [
      'Nuevo nombre: InaZurvivors, con el escudo del Raimon en la pestaña del navegador.',
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
