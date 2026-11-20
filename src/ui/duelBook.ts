/**
 * Modo Duelo (author: «un libro de instrucciones así guay con paso de páginas 3D chulo», «mucho más juiced»): the
 * rulebook as a real book. Two pages side by side on wide screens (each leaf turns over the spine, front and back), one
 * page at a time on phones. A leather cover with a light sweep, stacked page edges that grow and shrink as you read,
 * a dog-ear that invites the next turn, sparkles and a whoosh on every turn, page content popping in, an index and
 * coloured bookmarks to jump to each chapter. Arrows, the page edges and ← → turn the pages, or take a page and drag it;
 * Esc or ✕ closes it.
 * The art is the author's (public/art/duel, tools/duel_assets.py).
 */
import { tr } from '../i18n/i18n';
import { sfx } from '../game/sfx';
import { ART, ART_V } from './duelArt';
import { pctOf, techInfo } from './duelText';
import { DUEL_PLAYERS, duelStats } from '../systems/duel/cards';

/** what the book needs from the game to fill its cards with real footballers (without it, the cards show their art only) */
export interface BookHost {
  mug(pid: number, size: number): string;
  name(pid: number): string;
  byId: Map<number, { element?: string } & Parameters<typeof duelStats>[0]>;
}
// the footballers of the examples: Axel, Shawn, Mark and Aiden
const AXEL = 10, SHAWN = 1513, MARK = 1, AIDEN = 100797;

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
const img = (file: string, cls = '', alt = '') => `<img class="db-img ${cls}" src="${ART}${file}.webp?v=${ART_V}" alt="${esc(alt)}" draggable="false">`;
const head = (n: number, title: string) => `<div class="db-head"><small>${tr('Capítulo {n}', { n })}</small><h2>${title}</h2><i class="db-rule"></i></div>`;

/** the chapters: page index (0 = cover, 1 = index) and the bookmark colour of its part */
interface Chapter { title: string; page: number; part: number }
const PARTS = (): { name: string; icon: string; color: string }[] => [
  { name: tr('Lo básico'), icon: 'tipo-mejora', color: '#ffb020' },
  { name: tr('Cartas'), icon: 'tipo-especial', color: '#ff4f8b' },
  { name: tr('Combate'), icon: 'tipo-ataque', color: '#4fb3ff' },
  { name: tr('Estrategia'), icon: 'tipo-combinada', color: '#5cdc6a' },
];

function content(h?: BookHost): { pages: string[]; chapters: Chapter[] } {
  const types: [string, string, string][] = [
    ['ataque', tr('Ataque'), tr('Daño a 1 rival')], ['area', tr('Área'), tr('Daño a todos los rivales')],
    ['debilitar', tr('Debilitar'), tr('Golpe flojo y un efecto negativo')], ['mejora', tr('Mejora'), tr('Sube el ATQ propio o del equipo')],
    ['recuperacion', tr('Recuperación'), tr('Cura o da escudo')], ['postura', tr('Postura'), tr('Responde al próximo ataque')],
    ['especial', tr('Especial'), tr('Actúa sobre las cartas o la Garra')], ['combinada', tr('Combinada'), tr('Dos o tres futbolistas a la vez')],
  ];
  const states: [string, string, string][] = [
    ['quemadura', tr('Quemadura'), tr('Pierde un 6 % de PV cada turno, 3 turnos')], ['congelado', tr('Congelado'), tr('No recibe cartas; golpearlo rompe el hielo (×2)')],
    ['electrizado', tr('Electrizado'), tr('Cada carta suya que use le quita un 5 % de PV')], ['aturdido', tr('Aturdido'), tr('Sus cartas llegan pero no se pueden usar')],
    ['vendaval', tr('Vendaval'), tr('Su equipo recibe 1 carta menos')], ['sellada', tr('Sellada'), tr('Esa carta no se puede usar ni mover')],
    ['provocar', tr('Provocar'), tr('Los ataques a 1 rival van a él')], ['escudo', tr('Escudo'), tr('Absorbe daño antes que los PV')],
  ];
  const chapters: Chapter[] = [
    { title: tr('El duelo'), page: 2, part: 0 }, { title: tr('La mesa'), page: 3, part: 0 }, { title: tr('Las estadísticas'), page: 4, part: 0 },
    { title: tr('Tu mano'), page: 5, part: 1 }, { title: tr('Las estrellas'), page: 6, part: 1 }, { title: tr('Fusión'), page: 7, part: 1 },
    { title: tr('Tipos de carta'), page: 8, part: 1 }, { title: tr('El daño'), page: 9, part: 2 }, { title: tr('Garra y ulti'), page: 10, part: 2 },
    { title: tr('Estados'), page: 11, part: 2 }, { title: tr('Sinergias'), page: 12, part: 3 }, { title: tr('Banquillo y entrenador'), page: 13, part: 3 },
  ];
  const parts = PARTS();
  const ch = (i: number) => head(i + 1, chapters[i].title);
  const has = (pid: number) => !!h?.byId.has(pid);
  const nm = (pid: number) => (h && has(pid) ? esc(h.name(pid)) : '');
  /** a card of the match, filled: the footballer's face, the frame of its stars, its type icon, the technique and its
   *  multiplier at those stars (only the frame without the game's data) */
  const card = (pid: number, idx: 0 | 1 | 'u', rank: 1 | 2 | 3, cls = '') => {
    if (!h || !has(pid)) return img(idx === 'u' ? 'carta-ulti' : `carta-r${rank}`, `db-card ${cls}`);
    const t = techInfo(pid, idx), ulti = idx === 'u';
    const mult = ulti ? t.mults[0] : t.mults[Math.min(t.mults.length, rank) - 1];
    const icon = ulti ? (t.area ? 'tipo-area' : 'tipo-ataque') : `tipo-${t.kind}`;
    const lw = Math.max(...t.tech.split(/\s+/).map((w) => w.length));
    return `<span class="db-mc ${cls}"><span class="db-mcf">${h.mug(pid, 60)}</span>${img(ulti ? 'carta-ulti' : `carta-r${rank}`, 'db-mcfr')}${img(icon, 'db-mci')}
      <span class="db-mct" style="--lw:${lw}">${esc(t.tech)}</span>${mult ? `<span class="db-mcm">${pctOf(mult)}</span>` : ''}</span>`;
  };
  // the stats chapter: Axel's real ones, each with what it does
  const st = h && has(AXEL) ? duelStats(h.byId.get(AXEL)!) : null;
  const statRows: [string, string, string][] = [
    ['hp', tr('PV'), tr('Su vida. A 0 cae fuera de combate y entra el suplente.')],
    ['atk', tr('ATQ'), tr('La fuerza de sus cartas: cada golpe es ATQ × el multiplicador de la carta.')],
    ['def', tr('DEF'), tr('Frena los golpes que recibe: con 1000 de DEF recibe la mitad.')],
    ['crit', tr('Crít.'), tr('Probabilidad de que un golpe suyo sea crítico.')],
    ['critDmg', tr('D. crít.'), tr('Cuánto pega un crítico: 150 % es ×1,5.')],
    ['pierce', tr('Perf.'), tr('Parte de la DEF rival que se salta.')],
    ['res', tr('Res.'), tr('Probabilidad de librarse de un estado negativo.')],
  ];
  const statVal = (k: string) => (st ? `${(st as unknown as Record<string, number>)[k]}${['crit', 'critDmg', 'pierce', 'res'].includes(k) ? '%' : ''}` : '');
  // the damage chapter: Axel's first technique at ★★ against Mark, worked out
  const dmgEx = (() => {
    if (!h || !has(AXEL) || !has(MARK)) return '';
    const a = duelStats(h.byId.get(AXEL)!), m = duelStats(h.byId.get(MARK)!), t = techInfo(AXEL, 0);
    const mult = t.mults[Math.min(1, t.mults.length - 1)] ?? 1;
    const ea = h.byId.get(AXEL)!.element ?? '', em = h.byId.get(MARK)!.element ?? '';
    const BEATS: Record<string, string> = { 'Montaña': 'Fuego', 'Fuego': 'Bosque', 'Bosque': 'Aire', 'Aire': 'Montaña' };
    const el = BEATS[ea] === em ? 1.3 : BEATS[em] === ea ? 0.8 : 1;
    const raw = a.atk * mult, after = raw * 1000 / (1000 + m.def), fin = Math.round(after * el);
    return `<div class="db-ex"><div class="db-exc">${card(AXEL, 0, 2)}<b>→</b><span class="db-exm">${h.mug(MARK, 64)}<small>${nm(MARK)}</small></span></div>
      <ol class="db-calc"><li>${tr('{a}: ATQ {atk} × {m} ({t} ★★) = {r}', { a: nm(AXEL), atk: a.atk, m: mult, t: esc(t.tech), r: Math.round(raw) })}</li>
      <li>${tr('DEF de {b} ({def}): × 1000 / (1000 + {def}) = {r}', { b: nm(MARK), def: m.def, r: Math.round(after) })}</li>
      <li>${el === 1 ? tr('Elementos sin ventaja: × 1') : el > 1 ? tr('Ventaja de elemento: × 1,3') : tr('Desventaja de elemento ({e1} contra {e2}): × 0,8', { e1: esc(tr(ea)), e2: esc(tr(em)) })}</li>
      <li><b>${tr('Le quita unos {n} PV', { n: fin })}</b> ${tr('(×1,5 o más si es crítico)')}</li></ol></div>`;
  })();
  // the stars chapter: one technique at ★, ★★ and ★★★
  const ice = h && has(AIDEN) ? techInfo(AIDEN, 0) : null;
  const pages = [
    // the cover is one giant card: the card back as the hard cover, the title on a gold plate, a light sweep
    `<div class="db-cover db-cardcover"><span class="db-bigcard">${img('carta-reverso')}<i class="db-shine"></i></span>
      <div class="db-plate"><h1>${tr('MODO DUELO')}</h1><p>${tr('Libro de instrucciones')}</p></div><em>${tr('Pasa la página →')}</em></div>`,
    `<div class="db-head"><small>InaZurvivors</small><h2>${tr('Índice')}</h2><i class="db-rule"></i></div><ol class="db-index">${chapters.map((c, i) =>
      `<li data-go="${c.page}" style="--c:${parts[c.part].color}"><b>${i + 1}</b><span>${c.title}</span><i></i><em>${c.page + 1}</em></li>`).join('')}</ol>`,
    `${ch(0)}<p class="db-lead">${tr('Dos equipos de 3 titulares y 1 suplente se enfrentan por turnos. Gana quien deja fuera de combate a los 4 rivales.')}</p>
     <div class="db-row db-fan">${has(AXEL) ? `${card(MARK, 0, 1)}${card(AXEL, 0, 2)}${card(SHAWN, 0, 3)}` : `${img('marco-legendario', 'db-frame')}${img('marco-mitico', 'db-frame')}${img('marco-leyenda', 'db-frame')}`}</div>
     <p class="db-note">${tr('Juegan {n} futbolistas conocidos, Legendarios o más, que tengas en tu colección. Lo que tengas subido les da hasta un +20 %. Solo una forma de cada uno por equipo.', { n: DUEL_PLAYERS.length })}</p>`,
    `${ch(1)}<div class="db-shot">${img('mesa-horizontal', 'db-tableimg')}</div>
     <ul><li>${tr('Arriba, el rival; abajo, tu equipo: 3 círculos de titulares y el banquillo a la derecha.')}</li>
     <li>${tr('En la peana, tu entrenador: no juega, pero da una pasiva toda la partida.')}</li>
     <li>${tr('En la bandeja de abajo, tu mano de cartas.')}</li></ul>`,
    `${ch(2)}<div class="db-stats">${st && h ? `<span class="db-sm">${h.mug(AXEL, 72)}<small>${nm(AXEL)}</small></span>` : ''}<div class="db-st">${statRows.map(([k, n, d]) =>
      `<div class="db-str ${k}"><b>${n}</b>${st ? `<em>${statVal(k)}</em>` : ''}<span>${d}</span></div>`).join('')}</div></div>
     <p class="db-note">${tr('Salen de las estadísticas del futbolista en el juego, su rareza y su posición: los delanteros pegan más, los defensas y porteros aguantan más.')}</p>`,
    `${ch(3)}<div class="db-row db-fan">${card(AXEL, 0, 1)}${card(AXEL, 1, 1)}${card(SHAWN, 0, 2)}</div>
     <ul><li>${tr('Cada turno recibes 2 cartas por titular y 1 más al azar, hasta 7.')}</li>
     <li>${tr('Cada futbolista tiene 2 técnicas: sus cartas son esas dos, con su cara.')}</li>
     <li>${tr('Tienes 3 acciones: usar una carta, moverla de sitio o usar una ulti.')}</li>
     <li>${tr('Las cartas que no uses se quedan para el turno siguiente.')}</li></ul>`,
    `${ch(4)}<div class="db-row db-stars">${card(AIDEN, 0, 1)}${card(AIDEN, 0, 2)}${card(AIDEN, 0, 3, 'db-glow')}</div>
     <ul><li>${tr('Una carta tiene 1, 2 o 3 estrellas: más estrellas, más multiplicador.')}${ice ? ` ${tr('{t} de {n}: ★ {a}, ★★ {b}, ★★★ {c} de daño.', { t: esc(ice.tech), n: nm(AIDEN), a: pctOf(ice.mults[0]), b: pctOf(ice.mults[1] ?? ice.mults[0]), c: pctOf(ice.mults[2] ?? ice.mults[0]) })}` : ''}</li>
     <li>${tr('Algunos efectos solo salen con ★★ o ★★★ (en la carta pone «★★+» o «★★★+»).')}${ice?.lines.some((l) => l.min >= 3) ? ` ${tr('Aquí, congelar al rival solo con ★★★.')}` : ''}</li>
     <li>${tr('Usar una carta llena la Garra de su futbolista tantos segmentos como estrellas tenga.')}</li>
     <li>${tr('Las de 3 estrellas son las más fuertes, pero no se pueden fusionar más.')}</li></ul>`,
    `${ch(5)}<div class="db-row db-fuse">${card(AXEL, 0, 1)}<b>+</b>${card(AXEL, 0, 1)}<b>=</b>${card(AXEL, 0, 2, 'db-glow')}</div>
     <div class="db-center"><i class="db-fuse-anim" aria-hidden="true"></i></div>
     <ul><li>${tr('Dos cartas iguales juntas se fusionan solas: ★ + ★ = ★★, y ★★ + ★★ = ★★★.')}</li>
     <li>${tr('Si usas la carta que separa a dos iguales, se juntan gratis.')}</li>
     <li>${tr('Cada fusión da además 1 segmento de Garra.')}</li></ul>`,
    `${ch(6)}<div class="db-grid">${types.map(([k, n, d]) => `<div class="db-gi">${img(`tipo-${k}`, 'db-icon', n)}<b>${n}</b><small>${d}</small></div>`).join('')}</div>`,
    `${ch(7)}${dmgEx}
     <ul><li>${tr('Elementos: Montaña gana a Fuego, Fuego a Bosque, Bosque a Aire y Aire a Montaña. Con ventaja ×1,3; con desventaja ×0,8.')}</li>
     <li>${tr('El golpe varía un ±5 % al azar.')}</li></ul>`,
    `${ch(8)}<div class="db-fx-gauge" aria-hidden="true"><span class="orbs">${'<i class="db-orb"></i>'.repeat(5)}</span><i class="bu"></i>${has(AXEL) ? card(AXEL, 'u', 3, 'ul') : img('carta-ulti', 'ul')}</div>
     <ul><li>${tr('Cada carta que usa un futbolista le da tantos segmentos de Garra como estrellas tiene (★ 1, ★★ 2, ★★★ 3), y cada fusión otro más.')}</li>
     <li>${tr('Con 5 segmentos, su ulti entra en tu mano: su técnica más fuerte.')}</li>
     <li>${tr('Algunas cartas cargan la Garra de otros o anulan las mejoras y posturas del rival.')}</li></ul>`,
    `${ch(9)}<div class="db-list">${states.map(([k, n, d]) => `<div class="db-li">${img(`estado-${k}`, 'db-badge', n)}<span><b>${n}</b> ${d}</span></div>`).join('')}</div>`,
    `${ch(10)}${has(AXEL) && has(SHAWN) ? `<span class="db-float db-combo">${img('carta-combinada', 'db-mcfr')}<span class="db-cmugs">${h!.mug(AXEL, 40)}${h!.mug(SHAWN, 40)}</span></span>` : img('carta-combinada', 'db-card db-float db-glow')}
     <ul><li>${tr('Combinadas: las cartas de Axel y Shawn juntas se funden en Fuego cruzado. Mark, Axel y Shawn en fila hacen La Tierra.')}</li>
     <li>${tr('Uno prepara y otro remata: Shawn congela y Claude rompe el hielo; Jack provoca y Hurley contraataca.')}</li>
     <li>${tr('Grupos: 3 futbolistas del mismo grupo (Inazuma Japan, Royal Academy…) activan su efecto.')}</li></ul>`,
    `${ch(11)}<div class="db-row">${img('peana', 'db-ped')}${img('circulo', 'db-circle')}</div>
     <ul><li>${tr('Cuando cae un titular, entra tu suplente.')}</li>
     <li>${tr('Una vez por partida puedes hacer un cambio voluntario.')}</li>
     <li>${tr('Si 2 de tus futbolistas son del equipo del entrenador, su pasiva vale un 50 % más.')}</li></ul>`,
    `<div class="db-cover db-end"><i class="db-shine"></i><span class="db-corner tl"></span><span class="db-corner tr"></span><span class="db-corner bl"></span><span class="db-corner br"></span>
      <div class="db-cover-card">${has(AXEL) ? card(AXEL, 'u', 3) : img('carta-r3')}</div><h1>${tr('¡A jugar!')}</h1><p>${tr('Tu primer duelo es un tutorial con el Raimon.')}</p></div>`,
  ];
  return { pages, chapters };
}

let css = false;
function style() {
  if (css) return;
  css = true;
  const s = document.createElement('style');
  s.textContent = `
.db-wrap{position:fixed;inset:0;z-index:9000;display:flex;align-items:center;justify-content:center;overflow:hidden;animation:dbIn .45s ease-out;
  background:radial-gradient(ellipse at 50% 45%,#0b2350d9,#020814f5 75%),url(${ART}mesa-horizontal.webp?v=${ART_V}) center/cover}
.db-wrap::before{content:'';position:absolute;inset:-20%;background:conic-gradient(from 0deg at 50% 40%,#ffd23f00 0deg,#ffd23f14 20deg,#ffd23f00 40deg,#4fb3ff12 120deg,#ffd23f00 150deg,#ffd23f14 250deg,#ffd23f00 280deg);animation:dbRays 40s linear infinite}
@keyframes dbRays{to{transform:rotate(360deg)}}
@keyframes dbIn{from{opacity:0}to{opacity:1}}
.db-mote{position:absolute;bottom:-10px;width:var(--s);height:var(--s);border-radius:50%;background:#ffe9a8;box-shadow:0 0 8px #ffd23f;opacity:0;animation:dbMote var(--d) linear infinite;animation-delay:var(--dl)}
@keyframes dbMote{10%{opacity:.8}90%{opacity:.6}to{opacity:0;transform:translate(var(--x),-105vh)}}
.db-stage{position:relative;display:flex;flex-direction:column;align-items:center;animation:dbOpen .7s cubic-bezier(.2,1.4,.4,1)}
@keyframes dbOpen{from{transform:translateY(40px) scale(.85) rotateX(20deg);opacity:0}}
.db-book{position:relative;width:min(1040px,92vw,calc((100vh - 170px) * 1.5));aspect-ratio:1.5;perspective:2600px;transition:transform .9s cubic-bezier(.45,.05,.3,1)}
.db-one .db-book{width:min(440px,90vw,calc((100vh - 200px) * .68));aspect-ratio:.68}
.db-book::before,.db-book::after{content:'';position:absolute;top:1.2%;bottom:1.2%;pointer-events:none;transition:width .9s;border-radius:4px;
  background:repeating-linear-gradient(90deg,#efe3c5 0 2px,#cdb98d 2px 3px);box-shadow:0 18px 30px #0008}
.db-book::before{left:0;width:var(--l,0px);transform:translateX(-100%);z-index:1}
.db-book::after{left:100%;width:var(--r,0px);z-index:1}
.db-one .db-book::before{display:none}
.db-leaf{position:absolute;top:0;left:50%;width:50%;height:100%;transform-style:preserve-3d;transform-origin:left center;transition:transform .9s cubic-bezier(.45,.05,.3,1)}
.db-one .db-leaf{left:0;width:100%}
.db-leaf.on{transform:rotateY(-180deg)}
.db-book{touch-action:pan-y}.db-face{cursor:grab}.db-book.grabbing,.db-book.grabbing *{cursor:grabbing!important;user-select:none}
.db-curl{position:absolute;top:0;left:50%;width:50%;height:100%;transform-style:preserve-3d;pointer-events:none}
.db-one .db-curl{left:0;width:100%}
.db-cs{position:absolute;top:0;left:100%;width:100%;height:100%;transform-style:preserve-3d;transform-origin:left center}
.db-curl>.db-cs{width:calc(100% / 18)}
.db-csk{position:absolute;inset:0 -2px 0 0;overflow:hidden;backface-visibility:hidden;-webkit-backface-visibility:hidden}
.db-csk.b{inset:0 0 0 -2px;transform:rotateY(180deg)}
.db-csk>.db-face{transform:none!important;backface-visibility:visible}
.db-csk>.db-face>*{opacity:1!important;animation:none!important}
.db-csh{position:absolute;inset:0;pointer-events:none}
.db-face{position:absolute;inset:0;backface-visibility:hidden;-webkit-backface-visibility:hidden;overflow:hidden;padding:5.5% 6.5% 9%;box-sizing:border-box;
  background:radial-gradient(ellipse at 70% 20%,#fffaf0,#f6ecd4 55%,#e9dab4),#f6ecd4;color:#2a2016;font:600 clamp(11px,1.22vw,15px)/1.42 'Segoe UI',system-ui,sans-serif;
  border-radius:0 12px 12px 0;box-shadow:inset 14px 0 22px -12px #6b4f1f99,inset 0 0 0 2px #c9a84f55,inset 0 0 0 7px #f6ecd4,inset 0 0 0 8px #d4a01755}
.db-face.b{transform:rotateY(180deg);border-radius:12px 0 0 12px;box-shadow:inset -14px 0 22px -12px #6b4f1f99,inset 0 0 0 2px #c9a84f55,inset 0 0 0 7px #f6ecd4,inset 0 0 0 8px #d4a01755}
.db-one .db-face{border-radius:12px}
.db-face::after{content:'';position:absolute;inset:0;pointer-events:none;opacity:0;background:linear-gradient(90deg,#fff0 20%,#fff6 45%,#0005 75%,#000a);transition:opacity .45s}
.db-leaf.turning .db-face::after{opacity:1;background:linear-gradient(90deg,#0000 0%,#fff5 18%,#0000 32%,#0004 50%,#0009 66%,#0000 100%) 0 0/300% 100%;animation:dbBend var(--td,.9s) cubic-bezier(.4,.1,.3,1)}
@keyframes dbBend{from{background-position:100% 0}to{background-position:0 0}}
/* the corner lifts before the page turns */
.db-face>*{opacity:0}
.db-face.show>*{animation:dbPop .55s cubic-bezier(.2,1.5,.4,1) both;animation-delay:calc(var(--i,0) * 90ms + 120ms)}
@keyframes dbPop{from{opacity:0;transform:translateY(14px) scale(.94)}to{opacity:1;transform:none}}
.db-face>.db-pg,.db-face>.db-cover{opacity:1;animation:none}
.db-head small{display:block;font-size:.72em;letter-spacing:.18em;text-transform:uppercase;color:#a07a2a}
.db-head h2{margin:.15em 0 0;font:1.05em/1.3 'Press Start 2P',monospace;color:#0f2a5c;text-shadow:0 2px 0 #ffd23f66}
.db-rule{display:block;height:4px;margin:.45em 0 .7em;border-radius:2px;background:linear-gradient(90deg,#d4a017,#ffe48a 40%,#d4a01700)}
.db-face ul{margin:.6em 0 0;padding-left:1.25em}.db-face li{margin:.38em 0}.db-face li::marker{color:#d4a017}
.db-lead{font-size:1.06em}
.db-face .db-pg{position:absolute;bottom:3%;right:6.5%;font:.62em 'Press Start 2P',monospace;color:#a07a2a}.db-face.b .db-pg{right:auto;left:6.5%}
.db-face>.db-cover{position:absolute;inset:0;margin:0}
.db-coverleaf .db-face.f{inset:-2.2% -2.4% -2.2% 0;padding:0;border-radius:4px 16px 16px 4px;overflow:hidden}
.db-board{position:absolute;top:-2.2%;bottom:-2.2%;z-index:0;pointer-events:none;
  background:radial-gradient(circle at 40% 30%,#1d4c9c,#0b2152 60%,#050f2a);box-shadow:inset 0 0 0 4px #d4a017,inset 0 0 0 7px #071636,0 22px 40px #000b}
.db-board.r{left:50%;right:auto;width:52.4%;border-radius:4px 16px 16px 4px}
.db-board.l{left:-2.4%;right:auto;width:52.4%;border-radius:16px 4px 4px 16px;opacity:0;transition:opacity .3s .45s}
.db-book.open .db-board.l{opacity:1}
.db-book.closed-end .db-board.r{opacity:0}
.db-spine{position:absolute;top:-2.2%;bottom:-2.2%;left:50%;width:2.6%;margin-left:-1.3%;z-index:0;pointer-events:none;opacity:0;transition:opacity .3s .45s;
  background:linear-gradient(90deg,#050f2a,#1d4c9c 40%,#2a63c4 50%,#1d4c9c 60%,#050f2a);box-shadow:0 0 0 2px #d4a017}
.db-book.open .db-spine{opacity:1}
.db-one .db-board.r{left:-2.4%;width:104.8%}.db-one .db-board.l,.db-one .db-spine{display:none}
.db-cover{position:relative;height:100%;margin:-6% -7.5%;padding:9%;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;overflow:hidden;
  background:radial-gradient(circle at 50% 30%,#2357b0,#0b2152 55%,#050f2a),#0b2152;color:#ffe9a8;
  box-shadow:inset 0 0 0 7px #d4a017,inset 0 0 0 10px #071636,inset 0 0 0 12px #ffe48a,inset 0 0 60px #000a}
.db-cover::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse 60% 40% at 50% 28%,#4fb3ff33,#0000 70%),radial-gradient(ellipse 80% 30% at 50% 100%,#ffd23f1f,#0000 70%)}
.db-shine{position:absolute;inset:-30%;background:linear-gradient(115deg,#fff0 42%,#fff5 50%,#fff0 58%);animation:dbShine 3.6s ease-in-out infinite}
@keyframes dbShine{0%,30%{transform:translateX(-60%)}70%,100%{transform:translateX(60%)}}
.db-corner{position:absolute;width:15%;aspect-ratio:1;border:4px solid #ffd23f;filter:drop-shadow(0 0 6px #ffb020)}
.db-corner.tl{top:5%;left:5%;border-right:0;border-bottom:0;border-top-left-radius:40%}.db-corner.tr{top:5%;right:5%;border-left:0;border-bottom:0;border-top-right-radius:40%}
.db-corner.bl{bottom:5%;left:5%;border-right:0;border-top:0;border-bottom-left-radius:40%}.db-corner.br{bottom:5%;right:5%;border-left:0;border-top:0;border-bottom-right-radius:40%}
.db-cover h1{position:relative;margin:.45em 0 .15em;font:2em/1.2 'Press Start 2P',monospace;color:#ffd23f;text-shadow:0 4px 0 #7a4a00,0 0 22px #ffb020aa;animation:dbTitle 2.4s ease-in-out infinite}
@keyframes dbTitle{50%{text-shadow:0 4px 0 #7a4a00,0 0 36px #ffd23f}}
.db-cover p{position:relative;margin:0;color:#cfe0ff;font-size:1.15em}
.db-cover em{position:relative;margin-top:1.4em;font-style:normal;font-size:.9em;color:#ffe48a;animation:dbBlink 1.4s infinite}
@keyframes dbBlink{50%{opacity:.35}}
.db-cardcover{padding:6% 8% 7%;justify-content:space-between}
.db-bigcard{position:relative;display:block;width:62%;margin-top:2%;perspective:700px;overflow:hidden;border-radius:6%;animation:dbBig 5s ease-in-out infinite;transform-style:preserve-3d}
.db-bigcard img{width:100%;display:block}
.db-cardcover>.db-bigcard{filter:drop-shadow(0 0 18px #4fb3ff99)}
.db-bigcard .db-shine{inset:-40%}
@keyframes dbBig{0%,100%{transform:rotateY(-12deg) rotateX(4deg) translateY(0)}50%{transform:rotateY(12deg) rotateX(-4deg) translateY(-8px)}}
.db-plate{position:relative;padding:.6em 1.2em .7em;border-radius:12px;background:linear-gradient(180deg,#ffe48a,#d4a017 55%,#9a6a00);box-shadow:0 4px 0 #5b3a00,0 0 24px #ffb02088,inset 0 2px 0 #fff8}
.db-plate h1{margin:0;color:#0f2a5c;text-shadow:0 2px 0 #ffe9a8,0 0 0 #0000;animation:none;font-size:1.7em}
.db-plate p{margin:.25em 0 0;color:#3a2600;font-weight:800}
.db-cardcover em{margin-top:.4em}
.db-coverleaf .db-face.f{border-radius:4px 14px 14px 4px;box-shadow:6px 0 0 #3a2a10,7px 0 0 #d4a017,12px 10px 26px #000a}
.db-coverleaf{transition-timing-function:cubic-bezier(.3,.0,.2,1)}
.db-flash{position:absolute;width:10px;height:10px;margin:-5px;border-radius:50%;pointer-events:none;z-index:800;
  background:radial-gradient(circle,#fff 0,#fff6c8 20%,#ffd23f66 45%,#ffd23f00 70%);animation:dbFlash 1.3s ease-out forwards}
@keyframes dbFlash{0%{transform:scale(1);opacity:0}25%{transform:scale(70);opacity:1}100%{transform:scale(110);opacity:0}}
.db-cover-card{position:relative;width:36%;perspective:600px}
.db-cover-card img{width:100%;filter:drop-shadow(0 0 22px #4fb3ffaa);animation:dbSwing 4s ease-in-out infinite}
@keyframes dbSwing{0%,100%{transform:rotateY(-18deg) translateY(0)}50%{transform:rotateY(18deg) translateY(-8px)}}
.db-img{display:block;max-width:100%;user-select:none;transition:transform .25s cubic-bezier(.2,1.6,.4,1),filter .25s}
.db-img:hover{transform:translateY(-4px) scale(1.07) rotate(-2deg);filter:drop-shadow(0 6px 10px #0005) brightness(1.08)}
.db-glow{filter:drop-shadow(0 0 10px #ffd23f99)}
.db-row{display:flex;justify-content:center;align-items:center;gap:4%;margin:.5em 0}
.db-fan .db-img:nth-child(1){transform:rotate(-7deg) translateY(4px)}.db-fan .db-img:nth-child(3){transform:rotate(7deg) translateY(4px)}
.db-fan .db-img:hover{transform:translateY(-6px) scale(1.08)}
.db-frame{width:28%}.db-card{width:22%}
/* a card of the match, filled (face, frame, type icon, technique, multiplier); sized by its own width */
.db-mc{position:relative;display:block;width:24%;aspect-ratio:263/360;flex:none;container-type:inline-size;filter:drop-shadow(0 4px 6px #0006);transition:transform .25s cubic-bezier(.2,1.6,.4,1)}
.db-mc:hover{transform:translateY(-4px) scale(1.07) rotate(-2deg)}
.db-mc .db-img{position:absolute;max-width:none;transition:none}.db-mc .db-img:hover{transform:none;filter:none}
.db-mcf{position:absolute;left:21%;top:16%;width:58%;height:47%;display:flex;justify-content:center;align-items:center;overflow:hidden;background:radial-gradient(circle at 50% 38%,#4a74d0,#101a44 75%)}
.db-mcf>*,.db-sm>:first-child,.db-exm>:first-child,.db-cmugs>*{flex:none;margin:0!important;image-rendering:pixelated}
.db-mc .db-mcfr{inset:0;width:100%;height:100%}
.db-mc .db-mci{left:12%;top:9%;width:26%;z-index:2}
.db-mct{position:absolute;left:13%;right:13%;top:61%;min-height:18%;display:grid;place-items:center;text-align:center;line-height:1.05;--k:min(1,calc(9.5 / var(--lw,1)));font:900 calc(11.5cqw * var(--k)) 'Segoe UI',sans-serif;color:#fff;text-shadow:0 1px 0 #000,0 0 3px #000;background:linear-gradient(#0000,#08103ad0 22%,#08103af0 78%,#0000)}
.db-mcm{position:absolute;right:17%;top:15%;padding:0 3cqw;border-radius:4cqw;background:#000c;color:#ffe08a;font:900 9.5cqw 'Segoe UI',sans-serif;z-index:2}
.db-fan .db-mc:nth-child(1){transform:rotate(-7deg) translateY(4px)}.db-fan .db-mc:nth-child(3){transform:rotate(7deg) translateY(4px)}
.db-fx-gauge .db-mc.ul{width:22%}
.db-stars .db-mc:nth-child(2){width:26%}.db-stars .db-mc:nth-child(3){width:28%}
.db-cover-card .db-mc{width:100%;animation:dbSwing 4s ease-in-out infinite}
.db-combo{position:relative;display:block;aspect-ratio:263/360}.db-combo .db-mcfr{position:absolute;inset:0;width:100%;height:100%}
.db-cmugs{position:absolute;left:18%;right:18%;top:18%;height:42%;display:flex;justify-content:center;align-items:center;overflow:hidden;background:radial-gradient(circle at 50% 38%,#4a74d0,#101a44 75%)}.db-cmugs>*+*{margin-left:-20%!important}
.db-stats{display:flex;gap:.7em;align-items:flex-start}
.db-sm{flex:none;display:flex;flex-direction:column;align-items:center;gap:.2em;padding:.3em;border-radius:10px;background:#0f2a5c;box-shadow:0 0 0 3px #d4a017}.db-sm small{color:#ffe9a8;font-weight:900;font-size:.75em}
.db-st{flex:1;display:grid;gap:.22em}
.db-str{display:grid;grid-template-columns:4.2em 3.4em 1fr;align-items:center;gap:.4em;font-size:.86em;line-height:1.2}
.db-str b{padding:.1em .3em;border-radius:6px;background:#0f2a5c;color:#ffe9a8;text-align:center;font-size:.9em}
.db-str.hp b{background:#1f8a44;color:#fff}.db-str.atk b{background:#b8400f;color:#fff}
.db-str em{font-style:normal;font-weight:900;color:#0f2a5c;text-align:right}
.db-str span{color:#5a4626}
.db-ex{display:flex;flex-direction:column;gap:.4em}
.db-exc{display:flex;align-items:center;justify-content:center;gap:5%}.db-exc .db-mc{width:22%}.db-exc>b{font-size:1.6em;color:#b8400f}
.db-exm{display:flex;flex-direction:column;align-items:center;gap:.2em;padding:.3em;border-radius:10px;background:#0f2a5c;box-shadow:0 0 0 3px #d4a017}.db-exm small{color:#ffe9a8;font-weight:900;font-size:.75em}
.db-calc{margin:0;padding-left:1.4em;display:grid;gap:.15em;font-size:.88em}.db-calc b{color:#b8400f}
.db-shot{border-radius:10px;overflow:hidden;box-shadow:0 6px 14px #0006,0 0 0 3px #d4a017}.db-tableimg{width:100%}
.db-fuse b{font:1.4em 'Press Start 2P',monospace;color:#0f2a5c}
.db-center{display:flex;justify-content:center;align-items:center;gap:6%;margin:.5em 0}
.db-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:.55em .6em}
.db-one .db-grid{grid-template-columns:repeat(2,minmax(0,1fr))}
.db-gi{display:flex;flex-direction:column;align-items:center;text-align:center}.db-icon{width:66%;animation:dbBob 3s ease-in-out infinite}
.db-gi:nth-child(even) .db-icon{animation-delay:-1.5s}
@keyframes dbBob{50%{transform:translateY(-4px)}}
.db-gi small{color:#6b5636;font-size:.8em;font-weight:500;overflow-wrap:anywhere}
.db-list{display:grid;gap:.18em}.db-li{display:flex;align-items:center;gap:.6em;padding:.2em .4em;border-radius:8px;transition:background .2s}.db-li:hover{background:#d4a01722}
.db-badge{width:2.5em;flex:none}
.db-float{float:right;width:25%;margin:0 0 .4em .7em}.db-ped{width:26%}.db-circle{width:38%}
.db-note{font-size:.9em;color:#6b5636}
.db-index{list-style:none;margin:.2em 0 0;padding:0;display:grid;gap:.15em}
.db-index li{display:flex;align-items:center;gap:.6em;padding:.28em .5em;border-radius:8px;cursor:pointer;transition:background .2s,transform .2s}
.db-index li:hover{background:color-mix(in srgb,var(--c) 22%,transparent);transform:translateX(4px)}
.db-index b{width:1.8em;height:1.8em;flex:none;display:grid;place-items:center;border-radius:50%;background:var(--c);color:#1a1206;font:.7em 'Press Start 2P',monospace;box-shadow:0 2px 0 #0004}
.db-index i{flex:1;border-bottom:2px dotted #b99a5a;margin-top:.6em}.db-index em{font:.65em 'Press Start 2P',monospace;font-style:normal;color:#a07a2a}
/* fusion: the author's 13-frame sheet of two cards fusing */
.db-fuse-anim{display:block;width:36%;aspect-ratio:96/98;background:url(${ART}anim-fusion.webp?v=${ART_V}) 0 0/1300% 100% no-repeat;animation:dbFuse 1.5s steps(13,jump-none) infinite}
@keyframes dbFuse{to{background-position:100% 0}}
/* gauge: five orbs fill one after another with the author's 16-frame sheet (the book's timer drives the frames), then a
   burst and the ultimate card lights up */
.db-fx-gauge{position:relative;display:flex;flex-direction:column;align-items:center;margin:.3em 0 .5em}
.db-fx-gauge .orbs{display:flex;gap:2%;width:86%;justify-content:center}
.db-fx-gauge .db-orb{display:block;flex:none;width:18%;aspect-ratio:96/97;background:url(${ART}anim-garra.webp?v=${ART_V}) 0 0/1600% 100% no-repeat}
.db-fx-gauge .db-orb.full{filter:drop-shadow(0 0 6px #4fb3ff)}
.db-fx-gauge .bu{position:absolute;top:-25%;left:50%;width:90%;height:90%;margin-left:-45%;border-radius:50%;opacity:0;pointer-events:none;
  background:radial-gradient(ellipse,#fff 0,#9fe0ff 25%,#4fb3ff55 50%,#4fb3ff00 70%)}
.db-fx-gauge.burst .bu{animation:dbBurst .9s ease-out}
@keyframes dbBurst{0%{opacity:0;transform:scale(.4)}25%{opacity:1;transform:scale(1.2)}100%{opacity:0;transform:scale(1.6)}}
.db-fx-gauge .ul{width:24%;margin-top:.5em;filter:grayscale(.8) brightness(.7);transform:scale(.92);transition:filter .4s,transform .4s cubic-bezier(.2,1.6,.4,1)}
.db-fx-gauge.burst .ul{filter:drop-shadow(0 0 16px #b36bff) brightness(1.25);transform:scale(1.08)}
.db-marks{position:absolute;top:6%;left:calc(100% + var(--r,0px));display:flex;flex-direction:column;gap:8px;z-index:600}
.db-mark{display:flex;align-items:center;gap:6px;height:40px;width:max-content;white-space:nowrap;padding:0 14px 0 10px;border:0;border-radius:0 10px 10px 0;cursor:pointer;
  background:linear-gradient(90deg,color-mix(in srgb,var(--c) 70%,#000),var(--c));color:#1a1206;font:700 12px 'Segoe UI',system-ui,sans-serif;box-shadow:3px 4px 0 #0005;
  transform:translateX(-6px);transition:transform .2s,box-shadow .2s}
.db-mark img{width:26px;height:26px}.db-mark:hover,.db-mark.on{transform:translateX(4px)}.db-mark.on{box-shadow:3px 4px 0 #0005,0 0 14px var(--c)}
.db-one .db-marks{position:static;flex-direction:row;flex-wrap:wrap;justify-content:center;margin-top:10px}.db-one .db-mark{border-radius:10px;transform:none;height:34px}
.db-nav{display:flex;align-items:center;justify-content:center;gap:18px;margin-top:22px}
.db-btn{width:52px;height:52px;border-radius:50%;border:3px solid #ffd23f;background:radial-gradient(circle at 35% 30%,#3d7be0,#0f2a5c 70%);color:#ffe48a;font-size:28px;line-height:1;cursor:pointer;
  box-shadow:0 4px 0 #071636,0 0 16px #ffd23f66;transition:transform .15s,box-shadow .15s}
.db-btn:not(:disabled):hover{transform:translateY(-2px) scale(1.06);box-shadow:0 6px 0 #071636,0 0 26px #ffd23f}
.db-btn:not(:disabled):active{transform:translateY(2px);box-shadow:0 2px 0 #071636}
.db-btn.db-next:not(:disabled){animation:dbPulse 1.8s ease-in-out infinite}
@keyframes dbPulse{50%{box-shadow:0 4px 0 #071636,0 0 30px #ffd23f}}
.db-btn:disabled{opacity:.3;cursor:default}
.db-prog{display:flex;flex-direction:column;align-items:center;gap:6px;min-width:200px}
.db-prog b{font:10px 'Press Start 2P',monospace;color:#ffe48a;text-shadow:0 2px 0 #000}
.db-bar{width:100%;height:8px;border-radius:4px;background:#ffffff1f;overflow:hidden;box-shadow:inset 0 1px 2px #0008}
.db-bar i{display:block;height:100%;width:var(--p);background:linear-gradient(90deg,#ffb020,#ffe48a);box-shadow:0 0 10px #ffd23f;transition:width .6s}
.db-x{position:absolute;top:18px;right:18px;z-index:9;width:46px;height:46px;border-radius:50%;border:3px solid #ffd23f;background:#0f2a5c;color:#ffe48a;font-size:22px;cursor:pointer;box-shadow:0 4px 0 #071636;transition:transform .2s}
.db-x:hover{transform:rotate(90deg) scale(1.08)}
.db-hit{position:absolute;top:0;bottom:0;width:10%;z-index:500;cursor:pointer}.db-hit.l{left:0}.db-hit.r{right:0}
.db-spark{position:absolute;width:8px;height:8px;border-radius:50%;background:#fff6c8;box-shadow:0 0 10px #ffd23f,0 0 4px #fff;pointer-events:none;z-index:700;animation:dbSpark .8s ease-out forwards}
@keyframes dbSpark{to{transform:translate(var(--x),var(--y)) scale(.2);opacity:0}}
@media (prefers-reduced-motion:reduce){.db-leaf,.db-book{transition-duration:.01s}.db-fuse-anim,.db-fx-gauge *,.db-cover em,.db-cover-card img,.db-shine,.db-icon,.db-mote,.db-wrap::before,.db-btn{animation:none!important}.db-face.show>*{animation-duration:.01s}}
`;
  document.head.appendChild(s);
}

/** opens the rulebook over whatever is on screen; resolves when it is closed */
export function openDuelBook(h?: BookHost): Promise<void> {
  style();
  return new Promise((resolve) => {
    const one = window.innerWidth < 760;
    const { pages: pg, chapters } = content(h);
    const parts = PARTS();
    const wrap = document.createElement('div');
    wrap.className = `db-wrap${one ? ' db-one' : ''}`;
    wrap.setAttribute('role', 'dialog');
    wrap.setAttribute('aria-label', tr('Libro de instrucciones del Modo Duelo'));
    // wide: leaf i = page 2i (front, right) + page 2i+1 (back, left); phone: one page per leaf, its back plain paper
    const leaves = one ? pg.map((p) => [p, '']) : Array.from({ length: Math.ceil(pg.length / 2) }, (_, i) => [pg[2 * i], pg[2 * i + 1] ?? '']);
    const pageNo = (i: number, side: 0 | 1) => (one ? i : 2 * i + side);
    const face = (html: string, p: number, back: boolean) => `<div class="db-face ${back ? 'b' : 'f'}" data-p="${p}">${html}${html && p > 0 && p < pg.length - 1 ? `<span class="db-pg">${p + 1}</span>` : ''}</div>`;
    const motes = Array.from({ length: 22 }, (_, i) => `<i class="db-mote" style="left:${(i * 37) % 100}%;--s:${2 + (i % 4)}px;--d:${9 + (i % 7)}s;--dl:-${(i * 1.3) % 12}s;--x:${((i % 5) - 2) * 30}px"></i>`).join('');
    wrap.innerHTML = `${motes}<button class="db-x" aria-label="${esc(tr('Cerrar'))}">✕</button><div class="db-stage"><div class="db-book"><i class="db-board l"></i><i class="db-board r"></i><i class="db-spine"></i>${leaves.map(([f, b], i) =>
      `<div class="db-leaf${i === 0 ? ' db-coverleaf' : ''}" style="z-index:${leaves.length - i}">${face(f, pageNo(i, 0), false)}${face(b, one ? -1 : pageNo(i, 1), true)}</div>`).join('')}
      <div class="db-hit l"></div><div class="db-hit r"></div>
      <div class="db-marks">${parts.map((p, i) => `<button class="db-mark" data-part="${i}" style="--c:${p.color}">${img(p.icon)}<span>${p.name}</span></button>`).join('')}</div></div>
      <div class="db-nav"><button class="db-btn db-prev" aria-label="${esc(tr('Página anterior'))}">‹</button><div class="db-prog"><b class="db-where"></b><span class="db-bar"><i></i></span></div><button class="db-btn db-next" aria-label="${esc(tr('Página siguiente'))}">›</button></div></div>`;
    document.body.appendChild(wrap);
    sfx('reveal');
    const els = [...wrap.querySelectorAll<HTMLElement>('.db-leaf')];
    // the children of each face pop in one after another when the page shows
    wrap.querySelectorAll<HTMLElement>('.db-face').forEach((f) => [...f.children].forEach((c, k) => (c as HTMLElement).style.setProperty('--i', String(k))));
    const book = wrap.querySelector<HTMLElement>('.db-book')!;
    let at = 0; // leaves turned
    const max = one || pg.length % 2 ? els.length - 1 : els.length; // never onto a blank last back
    const visible = () => (one ? [at] : [2 * at - 1, 2 * at]);
    const shift = () => (one ? '' : at === 0 ? 'translateX(-25%)' : at === els.length ? 'translateX(25%)' : 'translateX(0)');
    const draw = () => {
      els.forEach((el, i) => el.classList.toggle('on', i < at));
      const vis = visible();
      wrap.querySelectorAll<HTMLElement>('.db-face').forEach((f) => f.classList.toggle('show', vis.includes(Number(f.dataset.p))));
      const page = Math.max(...vis.filter((p) => p >= 0 && p < pg.length));
      const chap = [...chapters].reverse().find((c) => c.page <= page);
      wrap.querySelector<HTMLElement>('.db-where')!.textContent = page === 0 ? tr('Portada') : page === 1 ? tr('Índice') : page === pg.length - 1 ? tr('¡A jugar!') : chap ? chap.title : '';
      wrap.querySelector<HTMLElement>('.db-bar i')!.style.setProperty('--p', `${Math.round((page / (pg.length - 1)) * 100)}%`);
      wrap.querySelectorAll<HTMLElement>('.db-mark').forEach((m) => m.classList.toggle('on', !!chap && chap.part === Number(m.dataset.part) && page > 1 && page < pg.length - 1));
      wrap.querySelector<HTMLButtonElement>('.db-prev')!.disabled = at === 0;
      wrap.querySelector<HTMLButtonElement>('.db-next')!.disabled = at >= max;
      // the paper already read piles up on the left, what is left on the right
      book.style.setProperty('--l', `${Math.min(10, at * 2)}px`);
      book.style.setProperty('--r', `${Math.min(10, (els.length - at) * 2)}px`);
      book.style.transform = shift();
      book.classList.toggle('open', at > 0);
      book.classList.toggle('closed-end', !one && at === els.length);
    };
    const sparks = (forward: boolean) => {
      const r = book.getBoundingClientRect(), wr = wrap.getBoundingClientRect();
      for (let k = 0; k < 14; k++) {
        const s = document.createElement('i');
        s.className = 'db-spark';
        s.style.left = `${(one ? r.right - 20 : r.left + r.width / 2) - wr.left}px`;
        s.style.top = `${r.top - wr.top + r.height * (0.15 + Math.random() * 0.7)}px`;
        s.style.setProperty('--x', `${(forward ? -1 : 1) * (40 + Math.random() * 120)}px`);
        s.style.setProperty('--y', `${(Math.random() - 0.5) * 140}px`);
        s.style.animationDelay = `${k * 25}ms`;
        wrap.appendChild(s);
        window.setTimeout(() => s.remove(), 1200);
      }
    };
    /** opening the cover: light spills out of the book */
    const opening = () => {
      const r = book.getBoundingClientRect(), wr = wrap.getBoundingClientRect();
      const x = r.left - wr.left + r.width / 2, y = r.top - wr.top + r.height / 2;
      sfx('reveal', 1.2);
      window.setTimeout(() => sfx('legend', 1.1), 380);
      const flash = document.createElement('i');
      flash.className = 'db-flash';
      flash.style.left = `${x}px`; flash.style.top = `${y}px`;
      wrap.appendChild(flash);
      window.setTimeout(() => flash.remove(), 1400);
    };
    let busy = false;
    /** the page folds like paper as it turns (author: «quiero que se pliegue la página»). While it turns, the leaf is
     *  drawn as a chain of N narrow strips, each hinged to the one before: the first turns on the spine and each joint
     *  bends a little more towards the free edge, so the sheet curls from its corner and lands flat. Every strip carries
     *  its slice of both faces and darkens or shines with its own angle. The real leaf stays hidden until it lands. */
    const N = 18;
    /** the fold of a leaf: `set(p)` draws it at p (0 = where it lies, 1 = turned over) going `d`; `end()` takes it away */
    const fold = (el: HTMLElement, d: 1 | -1) => {
      const f = el.querySelector<HTMLElement>(':scope > .db-face.f')!, bk = el.querySelector<HTMLElement>(':scope > .db-face.b')!;
      const box = document.createElement('div');
      box.className = 'db-curl';
      box.style.zIndex = '450';
      const strips: HTMLElement[] = [], shades: HTMLElement[] = [];
      let parent: HTMLElement = box;
      for (let i = 0; i < N; i++) {
        const st = document.createElement('div');
        st.className = 'db-cs';
        if (i === 0) st.style.left = '0';
        const skin = (face: HTMLElement, back: boolean) => {
          const sk = document.createElement('div');
          sk.className = `db-csk${back ? ' b' : ''}`;
          const c = face.cloneNode(true) as HTMLElement;
          c.classList.add('show');
          c.style.left = back ? `calc(2px - ${N - 1 - i} * (100% - 2px))` : `calc(${-i} * (100% - 2px))`;
          c.style.width = `calc(${N} * (100% - 2px))`;
          c.style.right = 'auto';
          c.style.padding = getComputedStyle(face).padding; // its % padding would count from the narrow strip
          const sh = document.createElement('i');
          sh.className = 'db-csh';
          sk.append(c, sh);
          shades.push(sh);
          return sk;
        };
        st.append(skin(f, false), skin(bk, true));
        parent.appendChild(st);
        strips.push(st);
        parent = st;
      }
      el.parentElement!.appendChild(box);
      el.style.visibility = 'hidden';
      const wsum = (N * (N - 1)) / 2;
      const set = (p: number) => {
        const e = p < 0.5 ? 4 * p * p * p : 1 - (-2 * p + 2) ** 3 / 2;
        const base = d > 0 ? -180 * e : -180 * (1 - e);
        // the curl: strongest halfway, more at the free edge; the edge leads the way the page goes
        const bend = -d * 150 * Math.sin(Math.PI * Math.min(1, p * 1.05)) ** 1.2;
        // the angle of the sheet at each strip and at each joint (the shade is smooth across the joints)
        const ang: number[] = [];
        let acc = base;
        for (let i = 0; i < N; i++) {
          const r = i === 0 ? base : (bend * i) / wsum;
          if (i > 0) acc += r;
          ang.push(acc);
          strips[i].style.transform = `rotateY(${r}deg)`;
        }
        // light: flat to the viewer is bright, edge-on is dark
        const dark = (deg: number) => Math.min(0.5, (1 - Math.abs(Math.cos((deg * Math.PI) / 180))) * 0.55).toFixed(3);
        for (let i = 0; i < N; i++) {
          const l = dark(i === 0 ? ang[0] : (ang[i - 1] + ang[i]) / 2), r = dark(i === N - 1 ? ang[i] : (ang[i] + ang[i + 1]) / 2);
          shades[2 * i].style.background = `linear-gradient(90deg,rgba(58,42,16,${l}),rgba(58,42,16,${r}))`;
          shades[2 * i + 1].style.background = `linear-gradient(90deg,rgba(58,42,16,${r}),rgba(58,42,16,${l}))`;
        }
      };
      const end = () => { el.style.visibility = ''; box.remove(); };
      set(0);
      return { set, end };
    };
    /** plays a fold from p0 to p1 over ms */
    const play = (fd: ReturnType<typeof fold>, p0: number, p1: number, ms: number) => new Promise<void>((done) => {
      const t0 = performance.now();
      const frame = (now: number) => {
        // dev only: window.__curlP holds the fold at a given point, to look at it
        const hold = import.meta.env.DEV ? (window as unknown as { __curlP?: number }).__curlP : undefined;
        const k = Math.min(1, (now - t0) / Math.max(1, ms));
        fd.set(hold ?? p0 + (p1 - p0) * k);
        if (k < 1 || hold !== undefined) requestAnimationFrame(frame); else done();
      };
      requestAnimationFrame(frame);
    });
    /** the start of a turn: the leaf on top, the pages that will show under it already drawn, those showing kept */
    const begin = (d: 1 | -1, ms: number) => {
      const el = els[d > 0 ? at : at - 1];
      busy = true;
      el.style.zIndex = '400';
      el.style.setProperty('--td', `${ms}ms`);
      const cover = el.classList.contains('db-coverleaf');
      // the hard cover swings stiff; paper pages fold (the leaf itself jumps to its place, hidden, under the fold)
      el.style.transitionDuration = cover ? `${ms}ms` : '0s';
      el.classList.add('turning');
      const was = [...wrap.querySelectorAll<HTMLElement>('.db-face.show')];
      at += d;
      draw();
      for (const x of was) x.classList.add('show');
      return { el, cover };
    };
    /** the end of a turn (or of a drag let go): pages and leaves where they belong */
    const finish = (el: HTMLElement) => {
      draw();
      el.classList.remove('turning');
      els.forEach((x, i) => { x.style.zIndex = String(i < at ? i + 1 : els.length - i); x.style.transitionDuration = ''; });
      busy = false;
      if (at >= max) sfx('legend');
    };
    const turn = (d: 1 | -1, quick = false) => {
      const next = at + d;
      if (next < 0 || next > max || busy) return false;
      const el0 = els[d > 0 ? at : next];
      const cover = el0.classList.contains('db-coverleaf');
      const ms = quick ? 350 : cover ? 1300 : 950;
      busy = true;
      window.setTimeout(() => {
        const { el } = begin(d, ms);
        sfx('whoosh', quick ? 1.4 : cover ? 0.7 : 0.9 + Math.random() * 0.2);
        if (cover && d > 0) opening(); else sparks(d > 0);
        if (cover) { window.setTimeout(() => finish(el), ms + 10); return; }
        const fd = fold(el, d);
        void play(fd, 0, 1, ms).then(() => { fd.end(); finish(el); });
      }, 0);
      return true;
    };
    /** taking the page by hand (author: «poder coger la página y pasarla yo»): press on a page and drag it towards the
     *  spine; it folds under the pointer, and let go past a third (or with a flick) it turns over, otherwise it falls back */
    let grab: { x0: number; t0: number; d: 1 | -1; w: number; el?: HTMLElement; fd?: ReturnType<typeof fold>; p: number; v: number; lx: number; lt: number } | null = null;
    let dragged = false;
    book.addEventListener('pointerdown', (e) => {
      if (busy || e.button !== 0 || (e.target as HTMLElement).closest('button, [data-go], .db-mark')) return;
      const r = book.getBoundingClientRect(), rightHalf = one || e.clientX > r.left + r.width / 2;
      const d: 1 | -1 = one ? (e.clientX > r.left + r.width / 2 ? 1 : -1) : rightHalf ? 1 : -1;
      const next = at + d;
      if (next < 0 || next > max || els[d > 0 ? at : next].classList.contains('db-coverleaf')) return;
      grab = { x0: e.clientX, t0: performance.now(), d, w: one ? r.width : r.width / 2, p: 0, v: 0, lx: e.clientX, lt: performance.now() };
      dragged = false;
    });
    window.addEventListener('pointermove', (e) => {
      if (!grab || !wrap.isConnected) return;
      const dx = (e.clientX - grab.x0) * -grab.d;
      if (!grab.fd) {
        if (dx < 8) return;
        // it starts to fold
        const { el } = begin(grab.d, 600);
        grab.el = el;
        grab.fd = fold(el, grab.d);
        book.classList.add('grabbing');
        sfx('whoosh', 1.2);
        dragged = true;
      }
      grab.p = Math.max(0, Math.min(1, dx / (grab.w * 1.7)));
      const now = performance.now();
      grab.v = ((e.clientX - grab.lx) * -grab.d) / Math.max(1, now - grab.lt);
      grab.lx = e.clientX; grab.lt = now;
      grab.fd.set(grab.p);
    });
    const release = () => {
      const g = grab;
      grab = null;
      book.classList.remove('grabbing');
      if (!g?.fd || !g.el) return;
      const go = g.p > 0.33 || g.v > 0.6;
      const el = g.el, fd = g.fd;
      void play(fd, g.p, go ? 1 : 0, (go ? 1 - g.p : g.p) * 700 + 80).then(() => {
        fd.end();
        if (go) { sparks(g.d > 0); sfx('whoosh', 0.9); } else at -= g.d;
        finish(el);
      });
    };
    window.addEventListener('pointerup', release);
    window.addEventListener('pointercancel', release);
    // a drag is not a click on the page edges
    book.addEventListener('click', (e) => { if (dragged) { e.stopPropagation(); e.preventDefault(); dragged = false; } }, true);
    /** to a page by quick turns, one after another */
    const go = (page: number) => {
      const target = one ? page : page % 2 ? (page + 1) / 2 : page / 2;
      sfx('click');
      const step = () => { if (at !== target && turn(target > at ? 1 : -1, true)) window.setTimeout(step, 390); };
      step();
    };
    const close = () => { window.removeEventListener('keydown', key, true); sfx('click'); wrap.style.animation = 'dbIn .3s reverse forwards'; window.setTimeout(() => { wrap.remove(); resolve(); }, 280); };
    const key = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') turn(1); else if (e.key === 'ArrowLeft') turn(-1); else if (e.key === 'Escape') close(); else return;
      e.preventDefault(); e.stopPropagation();
    };
    window.addEventListener('keydown', key, true);
    wrap.querySelector('.db-next')!.addEventListener('click', () => turn(1));
    wrap.querySelector('.db-prev')!.addEventListener('click', () => turn(-1));
    wrap.querySelector('.db-hit.r')!.addEventListener('click', () => turn(1));
    wrap.querySelector('.db-hit.l')!.addEventListener('click', () => turn(-1));
    wrap.querySelectorAll<HTMLElement>('[data-go]').forEach((li) => li.addEventListener('click', () => go(Number(li.dataset.go))));
    wrap.querySelectorAll<HTMLElement>('.db-mark').forEach((m) => m.addEventListener('click', () => go(chapters.find((c) => c.part === Number(m.dataset.part))!.page)));
    wrap.querySelector('.db-x')!.addEventListener('click', close);
    // the gauge page: orb k plays its 16 frames from tick 10·k, all five full at tick 50, a burst, then it starts again
    const orbs = [...wrap.querySelectorAll<HTMLElement>('.db-fx-gauge .db-orb')], gauge = wrap.querySelector<HTMLElement>('.db-fx-gauge');
    let tick = 0;
    const timer = window.setInterval(() => {
      if (!wrap.isConnected) { window.clearInterval(timer); return; }
      tick = (tick + 1) % 90;
      orbs.forEach((o, k) => {
        const f = Math.max(0, Math.min(15, Math.floor((tick - k * 10) * 1.6)));
        o.style.backgroundPosition = `${(f / 15) * 100}% 0`;
        o.classList.toggle('full', f === 15);
      });
      if (tick === 56) { gauge?.classList.add('burst'); if (gauge?.closest('.db-face.show')) sfx('powerup', 1.3); }
      if (tick === 0) gauge?.classList.remove('burst');
    }, 45);
    draw();
  });
}
