/**
 * 2.7 (author: «mejórame el entendimiento de menús y cómo se explica el tutorial, que con las cosas nuevas se quedó
 * atrás»): what every screen is for, in one place.
 *   - guideEntries(): one entry per screen, matched by the title its titlebar shows; the titlebar draws a «?» button and
 *     the screen explains itself once, the first time it is opened (save.helpSeen; save.tipsOff turns that off);
 *   - menuTourSteps() + runTour(): a spotlight over the real main menu, section by section;
 *   - guideHub(): «¿Cómo se juega?»: the tutorial, the tour and the whole guide, grouped like the menu.
 * Everything is built when called (tr() follows the language of the moment). Layers over the page carry .gd-layer, so the
 * gamepad navigates inside them (gamepad.ts).
 */
import { tr } from '../i18n/i18n';
import { uiIcon, type UiIconName } from './uiIcons';

export type GuideGroup = 'campo' | 'club' | 'fichajes' | 'comp';
export interface GuideEntry { id: string; titles: string[]; icon: UiIconName; group: GuideGroup; name: string; what: string; how: string[] }

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));

export function guideEntries(): GuideEntry[] {
  return [
    { id: 'squad', titles: ['Mi Equipo'], icon: 'team', group: 'campo', name: tr('Mi Equipo'),
      what: tr('Aquí eliges a tu capitán y a los 7 candidatos que podrás fichar durante la partida.'),
      how: [tr('El capitán empieza en el campo y es el único que recibe daño: elige a alguien resistente.'),
        tr('Los demás salen como cartas de fichaje al subir de nivel (hasta 5 en el campo a la vez).'),
        tr('Las sinergias (elemento y química de club) suben el daño: mezcla con cabeza.'),
        tr('En el banquillo puedes sentar a un entrenador con sus bonificaciones.')] },
    { id: 'arenas', titles: ['Camino de arenas'], icon: 'pitch', group: 'campo', name: tr('Camino de arenas'),
      what: tr('Elige arena y rango antes de saltar al campo.'),
      how: [tr('Gana una arena para abrir la siguiente del camino.'),
        tr('El rango es la dificultad: C es el más fácil y Z el más difícil. Cuanto más alto, más monedas y fichas.'),
        tr('Ganar en rango X o Z da Fichas EG para los Espíritus Guerreros.'),
        tr('Cada arena recuerda qué rangos has superado.')] },
    { id: 'training', titles: ['Campo de entrenamiento'], icon: 'target', group: 'campo', name: tr('Campo de entrenamiento'),
      what: tr('Un campo sin presión para probar técnicas antes de una partida de verdad.'),
      how: [tr('Elige qué técnicas activar y mira cómo atacan.'), tr('Aquí no se gana ni se pierde nada.')] },
    { id: 'collection', titles: ['Enciclopedia'], icon: 'cards', group: 'club', name: tr('Colección'),
      what: tr('Todos los futbolistas del juego: los tuyos a color y los que te faltan en sombra.'),
      how: [tr('Toca uno para ver su ficha: estadísticas, técnicas y talentos.'),
        tr('Con duplicados puedes ASCENDER: sube de rareza y, al final, a HÉROE.'),
        tr('Las estrellas se compran con monedas: cada una sube el límite de la estadística que elijas.'),
        tr('Un Legendario, Mítico o Leyenda puede ser el Aura de otro: le presta parte de sus estadísticas.'),
        tr('Completar equipos da recompensas: busca el aviso «¡Recompensas!».')] },
    { id: 'keshin', titles: ['Espíritus Guerreros'], icon: 'fire', group: 'club', name: tr('Espíritus Guerreros'),
      what: tr('Algunos futbolistas pueden invocar su Espíritu Guerrero.'),
      how: [tr('Se desbloquea y sube de nivel (de I a Ω) con Fichas EG, que se ganan en rango X y Z.'),
        tr('En el campo da un pasivo a todo el equipo y más estadística a su portador.'),
        tr('Su supertécnica es una ulti: cuando brille, pulsa R, Y en el mando o su botón en pantalla.'),
        tr('Solo un espíritu está activo a la vez.')] },
    { id: 'perks', titles: ['Mejoras permanentes'], icon: 'perks', group: 'club', name: tr('Mejoras permanentes'),
      what: tr('Las monedas compran potencia que dura para siempre.'),
      how: [tr('Cinco categorías: Supervivencia, Combate, Progresión, Economía y Equipo.'),
        tr('Cada mejora tiene niveles y cada nivel cuesta más que el anterior.'),
        tr('¿No sabes por dónde empezar? Vida, daño e imán.')] },
    { id: 'techshop', titles: ['Tienda de técnicas'], icon: 'bolt', group: 'club', name: tr('Tienda de técnicas'),
      what: tr('Manuales para el repertorio de cada futbolista, aparte de lo que mejoras dentro de la partida.'),
      how: [tr('Algunas técnicas están bloqueadas hasta que las compras aquí: entonces ya pueden salir como carta.'),
        tr('También puedes reforzar una técnica para que empiece más fuerte.')] },
    { id: 'coaches', titles: ['Entrenadores'], icon: 'crown', group: 'club', name: tr('Entrenadores'),
      what: tr('Un entrenador se sienta en el banquillo de Mi Equipo y da pasivos a toda la partida.'),
      how: [tr('Cada uno tiene lo suyo: su formación, más objetos raros, afinidad con un elemento, daño o defensa.'),
        tr('Salen de la máquina de fichajes de su saga, con una pequeña probabilidad por tirada.')] },
    { id: 'kits', titles: ['Equipaciones'], icon: 'shirt', group: 'club', name: tr('Equipaciones'),
      what: tr('Tu uniforme y tu escudo. Cada equipación da al equipo una bonificación propia.'),
      how: [tr('Con 3 o más futbolistas de ese club en el campo se activa la Química de club: +6% de daño.'),
        tr('Completar los equipos de la Colección desbloquea sus equipaciones.')] },
    { id: 'gear', titles: ['Equipamiento'], icon: 'boot', group: 'club', name: tr('Equipamiento'),
      what: tr('Objetos permanentes que dan estadísticas a todo el equipo.'),
      how: [tr('Botas, guantes, pulsera y colgante: uno por ranura.'), tr('Se compran con monedas y no cambian el aspecto de tus jugadores.')] },
    { id: 'hall', titles: ['Salón de la fama'], icon: 'trophy', group: 'club', name: tr('Salón de la fama'),
      what: tr('Cada victoria, con el equipo que la consiguió, la arena, el rango y el tiempo.'),
      how: [tr('Sirve para recordar tus mejores partidas y tu récord en supervivencia infinita.')] },
    { id: 'gacha', titles: ['Máquina de fichajes'], icon: 'capsule', group: 'fichajes', name: tr('Máquina de fichajes'),
      what: tr('Gasta Fichas de Fichaje para conseguir futbolistas.'),
      how: [tr('Cada banner trae otros equipos y otros destacados: elige arriba cuál usar.'),
        tr('Un futbolista nuevo es tuyo para siempre; un duplicado sirve para ascenderlo.'),
        tr('Las fichas se ganan jugando, con misiones, pases y eventos.')] },
    { id: 'daily', titles: ['Tienda'], icon: 'shop', group: 'fichajes', name: tr('Tienda'),
      what: tr('Futbolistas a la venta por monedas. Las ofertas cambian cada día.'),
      how: [tr('Hay ofertas diarias, destacados de más rareza, uno de tu equipo favorito y un especial semanal.'),
        tr('Los Leyenda nunca se venden.')] },
    { id: 'gts', titles: ['GTS · Estación de intercambio'], icon: 'gts', group: 'fichajes', name: tr('GTS'),
      what: tr('Intercambia futbolistas con otros jugadores online.'),
      how: [tr('Deja un futbolista que te sobre y pide a cambio el que quieras.'),
        tr('O busca lo que otros ofrecen y acepta si tienes lo que piden.'),
        tr('Necesitas cuenta online. Lo que se intercambie mientras no estás te llega al volver al menú.')] },
    { id: 'missions', titles: ['Recompensas'], icon: 'missions', group: 'comp', name: tr('Misiones'),
      what: tr('Misiones de partida, diarias, semanales y logros, cada una con su premio.'),
      how: [tr('Recoge cada premio con su botón: nada se paga dos veces.'),
        tr('Las diarias se renuevan a medianoche y las semanales el lunes.')] },
    { id: 'season', titles: ['Pase de temporada'], icon: 'crown', group: 'comp', name: tr('Pase de temporada'),
      what: tr('Cada minuto jugado da experiencia del pase (más en rangos altos) y cada nivel tiene premio.'),
      how: [tr('La fila normal se abre con la Llave normal, que se compra con monedas.'),
        tr('La fila premium se abre con la Llave dorada, que solo cae en partida al derrotar rivales.'),
        tr('Abrir una fila te deja reclamar todos los niveles que ya tenías.')] },
    { id: 'weekly', titles: ['Pase semanal'], icon: 'ticket', group: 'comp', name: tr('Pase semanal'),
      what: tr('Siete premios gratis, uno por cada día que entres a reclamarlo.'),
      how: [tr('Saltarte días no hace perder nada: el pase espera al siguiente premio.'), tr('El día 7 es el gran premio.')] },
    { id: 'ranking', titles: ['Ranking'], icon: 'crown', group: 'comp', name: tr('Ranking'),
      what: tr('Las mejores marcas del mundo, por arena y rango.'),
      how: [tr('Solo cuentan las partidas completadas.'), tr('Al acabar cada temporada hay premios según tu puesto.')] },
    { id: 'lobby', titles: ['Sala de jugadores'], icon: 'team', group: 'comp', name: tr('Sala de jugadores'),
      what: tr('Todos los jugadores del ranking con su capitán, juntos en un campo.'),
      how: [tr('Muévete con tu capitán y acércate a alguien para ver su ficha.')] },
    { id: 'road', titles: ['Road to Fútbol Frontier'], icon: 'trophy', group: 'comp', name: tr('Road to Fútbol Frontier'),
      what: tr('Cinco futbolistas de Raimon o Inazuma Japón juegan varias arenas seguidas hasta la final.'),
      how: [tr('Perder un partido termina el camino.'), tr('Cuanto más difícil, mejor premio: la dificultad máxima garantiza un Legendario o mejor.'),
        tr('Completarla en dificultad máxima trae a Jaden Evans.')] },
    { id: 'clan', titles: ['Clanes', 'Mi clan'], icon: 'team', group: 'comp', name: tr('Clanes'),
      what: tr('Únete a un clan o crea el tuyo y competid juntos cada semana.'),
      how: [tr('Los Juegos del Clan son 3 partidas al día que suman para la semana del clan.'),
        tr('Al cerrar la semana hay premios según el puesto del clan, y el clan tiene su propia tienda.')] },
    { id: 'tierlist', titles: ['Tierlists'], icon: 'cards', group: 'comp', name: tr('Tierlists'),
      what: tr('Ordena futbolistas de S a D sobre un tema y compártelo con la comunidad.'),
      how: [tr('Toca o arrastra cada futbolista a su fila.'), tr('En Comunidad ves las de los demás.')] },
    { id: 'coop', titles: ['Cooperativo'], icon: 'team', group: 'comp', name: tr('Cooperativo'),
      what: tr('Juega una partida con un amigo, cada uno con su equipo.'),
      how: [tr('Crea una sala y pásale el código a tu amigo, o únete a la suya.'), tr('Si uno cae, el otro lo levanta.'), tr('Necesitas cuenta online. Está en pruebas.')] },
    { id: 'sector', titles: ['Sector Quinto'], icon: 'fire', group: 'comp', name: tr('Sector Quinto'),
      what: tr('Evento por bandos: Sector Quinto o Resistencia. Tu elección es para siempre.'),
      how: [tr('Tus partidas suman puntos a tu bando; cada jueves gana la semana el bando con más media por miembro.'),
        tr('Antes de cada partida llega un decreto: acéptalo, o rebélate para jugar contra rivales más duros por más puntos.')] },
    { id: 'profile', titles: ['Perfil'], icon: 'team', group: 'club', name: tr('Perfil'),
      what: tr('Tu nombre, tu icono y los banderines, marcos y emblemas que has ganado.'),
      how: [tr('Lo que te pongas aquí lo ven los demás en el ranking y en la sala.')] },
  ];
}

/** the entry of a screen, by the title its titlebar shows (the Spanish source or its translation) */
export function guideFor(title: string): GuideEntry | undefined {
  return guideEntries().find((g) => g.titles.some((t) => t === title || tr(t) === title));
}

export const GROUP_LABEL = (g: GuideGroup) => ({ campo: tr('JUGAR'), club: tr('TU CLUB'), fichajes: tr('FICHAJES'), comp: tr('COMPETICIÓN') }[g]);

// ------------------------------------------------------------------- the tip of one screen
/** A card over the corner of the screen (it never blocks it): `auto` is the first visit, which offers to stop the tips. */
export function showTip(g: GuideEntry, auto: boolean, onClose: (tipsOff: boolean) => void) {
  document.getElementById('gdtip')?.remove();
  const box = document.createElement('aside');
  box.id = 'gdtip';
  box.className = 'gd-tip';
  box.setAttribute('role', 'dialog');
  box.innerHTML = `<div class="gd-tip-head"><span class="gd-tip-ic">${uiIcon(g.icon)}</span><span><small>${tr('¿PARA QUÉ SIRVE?')}</small><b>${esc(g.name)}</b></span>
      <button class="gd-x" aria-label="${tr('Cerrar')}">✕</button></div>
    <p>${esc(g.what)}</p><ul>${g.how.map((h, i) => `<li style="--i:${i}">${esc(h)}</li>`).join('')}</ul>
    <div class="gd-tip-foot">${auto ? `<button class="gd-off">${tr('No mostrar más consejos')}</button>` : `<small>${tr('Lo tienes siempre en el botón ? de arriba.')}</small>`}
      <button class="btn small gd-ok">${tr('¡Entendido!')}</button></div>`;
  document.body.appendChild(box);
  const close = (off: boolean) => { box.classList.add('out'); window.setTimeout(() => box.remove(), 220); onClose(off); };
  box.querySelector('.gd-ok')!.addEventListener('click', () => close(false));
  box.querySelector('.gd-x')!.addEventListener('click', () => close(false));
  box.querySelector('.gd-off')?.addEventListener('click', () => close(true));
}

// ------------------------------------------------------------------- the menu tour
export interface TourStep { sel: string; title: string; text: string }

export function menuTourSteps(): TourStep[] {
  return [
    { sel: '.m4-play', title: tr('JUGAR'), text: tr('Empieza una partida: eliges arena y rango y saltas al campo con tu capitán.') },
    { sel: '.m4-team', title: tr('MI EQUIPO'), text: tr('Tu capitán y los 7 candidatos que podrás fichar durante la partida. Aquí también ves las sinergias del equipo.') },
    { sel: '.m4-wallet', title: tr('Tu cartera'), text: tr('Fichas de Fichaje para fichar, monedas para mejoras, técnicas y estrellas, y Fichas EG para los Espíritus Guerreros. Todo se gana jugando.') },
    { sel: '.g-club', title: tr('TU CLUB'), text: tr('Lo que hace a tu equipo más fuerte para siempre: la colección (ascender, estrellas, auras), los Espíritus, mejoras, técnicas, entrenadores, equipaciones y equipamiento.') },
    { sel: '.g-sign', title: tr('FICHAJES'), text: tr('Consigue futbolistas: la máquina de fichajes, la tienda del día, los intercambios GTS con otros jugadores y los códigos de regalo.') },
    { sel: '.g-comp', title: tr('COMPETICIÓN'), text: tr('Misiones y pases con premios cada día, el ranking mundial, Road to FF, clanes, tierlists y el cooperativo con amigos.') },
    { sel: '#m5promo', title: tr('Novedades'), text: tr('Los eventos y banners del momento. Toca uno para ir directo.') },
    { sel: '.m4-tools', title: tr('Noticias y ajustes'), text: tr('Las novedades de cada versión, los ajustes (idioma, sonido, cuenta) y el botón para reportar bugs.') },
    { sel: '.m4-help', title: tr('¿Perdido?'), text: tr('Aquí vuelves a ver el tutorial, este recorrido y la guía de cada pantalla. Además, cada pantalla tiene arriba un botón ? que explica para qué sirve.') },
  ];
}

/** Spotlight over each element of the steps that is on the page (missing ones are skipped); Esc or «Saltar» ends it. */
export function runTour(all: TourStep[], onEnd: () => void) {
  const steps = all.filter((s) => { const el = document.querySelector<HTMLElement>(s.sel); return !!el && el.getClientRects().length > 0; });
  if (!steps.length) { onEnd(); return; }
  document.getElementById('gdtour')?.remove();
  const layer = document.createElement('div');
  layer.id = 'gdtour';
  layer.className = 'gd-tour gd-layer';
  layer.innerHTML = '<div class="gd-hole"><i></i></div><div class="gd-bubble"></div>';
  document.body.appendChild(layer);
  const hole = layer.querySelector<HTMLElement>('.gd-hole')!, bubble = layer.querySelector<HTMLElement>('.gd-bubble')!;
  let at = 0;
  const place = () => {
    const el = document.querySelector<HTMLElement>(steps[at].sel);
    if (!el) return;
    const r = el.getBoundingClientRect(), pad = 6, vw = window.innerWidth, vh = window.innerHeight;
    Object.assign(hole.style, { left: `${r.left - pad}px`, top: `${r.top - pad}px`, width: `${r.width + pad * 2}px`, height: `${r.height + pad * 2}px` });
    // the bubble goes where there is more room: below or above the hole, kept inside the window
    const bw = Math.min(400, vw - 24), bh = bubble.offsetHeight || 150;
    const below = vh - r.bottom > r.top;
    const top = below ? Math.min(vh - bh - 12, r.bottom + 16) : Math.max(12, r.top - bh - 16);
    const left = Math.max(12, Math.min(vw - bw - 12, r.left + r.width / 2 - bw / 2));
    Object.assign(bubble.style, { width: `${bw}px`, left: `${left}px`, top: `${top}px` });
    bubble.dataset.side = below ? 'below' : 'above';
  };
  const go = (i: number) => {
    at = Math.max(0, Math.min(steps.length - 1, i));
    const s = steps[at], last = at === steps.length - 1;
    document.querySelector<HTMLElement>(s.sel)?.scrollIntoView({ block: 'center', inline: 'nearest' });
    bubble.innerHTML = `<div class="gd-b-top"><small>${at + 1}/${steps.length}</small><i class="gd-bar"><b style="width:${(at + 1) / steps.length * 100}%"></b></i></div>
      <h3>${esc(s.title)}</h3><p>${esc(s.text)}</p>
      <div class="gd-b-nav"><button class="gd-skip">${tr('Saltar recorrido')}</button><span class="spacer"></span>
        ${at ? `<button class="btn small blue gd-prev">${tr('◀ Atrás')}</button>` : ''}<button class="btn small gd-next">${last ? tr('¡Entendido!') : tr('Siguiente ▶')}</button></div>`;
    bubble.classList.remove('pop'); void bubble.offsetWidth; bubble.classList.add('pop');
    bubble.querySelector('.gd-skip')!.addEventListener('click', end);
    bubble.querySelector('.gd-prev')?.addEventListener('click', () => go(at - 1));
    bubble.querySelector('.gd-next')!.addEventListener('click', () => (last ? end() : go(at + 1)));
    requestAnimationFrame(place);
  };
  const keys = (e: KeyboardEvent) => {
    if (e.key === 'Escape') { e.preventDefault(); end(); }
    else if (e.key === 'ArrowRight' || e.key === 'Enter') { e.preventDefault(); bubble.querySelector<HTMLElement>('.gd-next')?.click(); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); if (at) go(at - 1); }
  };
  const onResize = () => place();
  function end() {
    window.removeEventListener('keydown', keys, true);
    window.removeEventListener('resize', onResize);
    window.removeEventListener('scroll', onResize, true);
    layer.classList.add('out');
    window.setTimeout(() => layer.remove(), 220);
    onEnd();
  }
  window.addEventListener('keydown', keys, true);
  window.addEventListener('resize', onResize);
  window.addEventListener('scroll', onResize, true);
  go(0);
}

// ------------------------------------------------------------------- «¿Cómo se juega?»
export function guideHub(opts: { tipsOn: boolean; onTutorial: () => void; onTour: () => void; onTips: (on: boolean) => void }) {
  document.getElementById('gdhub')?.remove();
  const groups: GuideGroup[] = ['campo', 'club', 'fichajes', 'comp'];
  const entries = guideEntries();
  const box = document.createElement('div');
  box.id = 'gdhub';
  box.className = 'tut-modal gd-layer';
  box.innerHTML = `<div class="panel gd-hub"><h2>${tr('{x1}¿Cómo se juega?', { x1: uiIcon('help') })}</h2>
    <div class="gd-hub-top">
      <button class="gd-big" id="gdtut"><span class="gd-big-ic">${uiIcon('play')}</span><b>${tr('Tutorial')}</b><small>${tr('Lo básico del campo, paso a paso')}</small></button>
      <button class="gd-big" id="gdtourbtn"><span class="gd-big-ic">${uiIcon('target')}</span><b>${tr('Recorrido por el menú')}</b><small>${tr('Te señalamos cada sección del menú')}</small></button>
    </div>
    <h3>${tr('Guía de cada pantalla')}</h3>
    <div class="gd-list">${groups.map((g) => `<div class="gd-group"><h4>${esc(GROUP_LABEL(g))}</h4>${entries.filter((e) => e.group === g).map((e) => `<details class="gd-item">
      <summary><span class="gd-ic">${uiIcon(e.icon)}</span><span><b>${esc(e.name)}</b><small>${esc(e.what)}</small></span></summary>
      <ul>${e.how.map((h) => `<li>${esc(h)}</li>`).join('')}</ul></details>`).join('')}</div>`).join('')}</div>
    <div class="gd-hub-foot"><label class="gd-check"><input type="checkbox" id="gdtips"${opts.tipsOn ? ' checked' : ''}> ${tr('Explicar cada pantalla la primera vez que la abro')}</label>
      <span class="spacer"></span><button class="btn small" id="gdclose">${tr('Cerrar')}</button></div></div>`;
  document.body.appendChild(box);
  const keys = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.preventDefault(); close(); } };
  function close() { window.removeEventListener('keydown', keys, true); box.remove(); }
  window.addEventListener('keydown', keys, true);
  box.addEventListener('click', (e) => { if (e.target === box) close(); });
  box.querySelector('#gdclose')!.addEventListener('click', close);
  box.querySelector('#gdtut')!.addEventListener('click', () => { close(); opts.onTutorial(); });
  box.querySelector('#gdtourbtn')!.addEventListener('click', () => { close(); opts.onTour(); });
  box.querySelector<HTMLInputElement>('#gdtips')!.addEventListener('change', (e) => opts.onTips((e.target as HTMLInputElement).checked));
}
