/**
 * Modo Duelo: the match screen (doc «Pantalla de partida»), played like Grand Cross's PvP. On your turn you don't play
 * a card and see it happen: you line up your actions in their boxes (1, 2, 3) — drag a card onto a rival or tap it and
 * then the rival, drag it among the others to fuse it with an equal one, tap a box to take it back — and «¡Jugar!»
 * plays them one after the other; then the turn changes. The hand you see while you plan is already the one you will
 * have (the cards on each side of the one you take come together and may fuse, as in Grand Cross): rules.ts is
 * deterministic, so the plan is a copy of the match with your actions applied, and «¡Jugar!» replays them on the real
 * one. The rival does the same: its boxes fill up, then they are played.
 *
 * Each card played is a scene: the camera closes in on whoever plays (both, for a combined technique), the technique
 * comes in from the right, he charges at the rival and hits him (lightning, sparks of his element, the table shakes,
 * a short freeze on a critical), or leaps and slams for an area card; heals rise in green, shields shine blue; the
 * PV count down. The author's tables (mesa-horizontal on wide screens, mesa-vertical on tall ones) are the stage.
 * In the tutorial Hillman talks from his pedestal and the card, rival and button of each lesson glow.
 */
import { tr } from '../i18n/i18n';
import { elementSfx, orbSfx, sfx, ultiReadySfx } from '../game/sfx';
import { COACH_BY_ID } from '../data/coaches';
import { artUrl } from './duelArt';
import { elementIcon } from './elements';
import { cardInfo } from './duelText';
import { DUEL_MATCH_CSS as CSS_TEXT } from './duelMatchCss';
import { GAUGE_MAX, act, cloneDuel, createDuel, illegal, onPitch, specOf, teamOf, unit, type Action, type Card, type DuelState, type Ev, type Side, type TeamCfg, type Unit } from '../systems/duel/rules';
import { cpuAction, type CpuLevel } from '../systems/duel/cpu';
import { createTutorial, tutorialAllows, tutorialCard, tutorialSteps, tutorialTarget, type TutorialStep } from '../systems/duel/tutorial';

export interface DuelHost {
  byId: Parameters<typeof teamOf>[0];
  /** a footballer's face as the game draws it (`.mug`, size in px) */
  mug(pid: number, size: number): string;
  name(pid: number): string;
  rarity(pid: number): string;
  /** a coach's portrait (url) */
  coachArt(id: string): string;
  done?(won: boolean, tutorial: boolean): void;
  /** what the match pays (asked when it ends; the result shows it): coins, or why there are none */
  reward?(won: boolean, tutorial: boolean, stats: DuelSummary): Promise<{ coins: number; note?: string } | null>;
}
/** what you did in a match, for the missions */
export interface DuelSummary { merges: number; combos: number; ultis: number }
export type DuelSetup = { tutorial: true } | { tutorial?: false; teams: [TeamCfg, TeamCfg]; level: CpuLevel; seed?: number };

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
const img = (file: string, cls = '') => `<img class="${cls}" src="${artUrl(file)}" alt="" draggable="false">`;
/** a number in the match's own style (thick type with an outline; the colour by where it goes) */
export function setDuelDigits(_d?: unknown) { /* the original pixel digits were tried and dropped: text reads better */ }
function izNum(n: number | string, color: 'naranja' | 'morado' = 'naranja', cls = '') {
  return `<span class="iz-num c-${color} ${cls}">${n}</span>`;
}
const lifeColor = (k: number) => (k > 0.5 ? '#4be36a' : k > 0.25 ? '#ffc93a' : '#ff4848');
const wait = (ms: number) => new Promise<void>((r) => window.setTimeout(r, ms));
const EL_FX: Record<string, string> = { Fuego: '#ff7a2a', Aire: '#5ad8ff', Bosque: '#7dff6a', Montaña: '#ffc35a' };

/** where everything is on each table (% of the stage); unit widths in cqw */
interface Layout {
  board: string; v: boolean; slots: Record<Side, [number, number][]>; coach: Record<Side, [number, number]>; unitW: Record<Side, number>;
  center: [number, number]; queue: [number, number]; rqueue: [number, number]; play: [number, number]; bubble: [number, number]; info: [number, number]; cast: [number, number];
}
const LAYOUTS: Record<'h' | 'v', Layout> = {
  h: {
    board: 'mesa-horizontal', v: false,
    slots: { 0: [[30.5, 52.5], [50.5, 52.5], [71.5, 52.5], [91, 53]], 1: [[34, 25.5], [50, 25.5], [66.5, 25.5], [81, 26]] },
    coach: { 0: [10, 45], 1: [18.5, 18] }, unitW: { 0: 11.5, 1: 9.4 },
    center: [5, 9], queue: [18.5, 83.5], rqueue: [87, 8], play: [84, 83.5], bubble: [2.5, 59], info: [79, 12], cast: [63, 81],
  },
  v: {
    board: 'mesa-vertical', v: true,
    slots: { 0: [[26, 57], [50, 57], [74, 57], [92.5, 54]], 1: [[27, 29], [50, 29], [73, 29], [91, 21]] },
    coach: { 0: [7.5, 49], 1: [8.5, 21] }, unitW: { 0: 22, 1: 18 },
    center: [50, 43], queue: [26, 73.5], rqueue: [80, 11], play: [79, 73.5], bubble: [3, 63], info: [50, 42], cast: [60, 87],
  },
};
const FRAME: Record<string, string> = { leyenda: 'marco-leyenda', mitico: 'marco-mitico' };
const STATUS_FILE: Record<string, string> = { quemadura: 'estado-quemadura', congelado: 'estado-congelado', electrizado: 'estado-electrizado', aturdido: 'estado-aturdido', provocar: 'estado-provocar' };
const STATUS_NAME = (): Record<string, string> => ({ quemadura: tr('Quemadura'), congelado: tr('Congelado'), electrizado: tr('Electrizado'), aturdido: tr('Aturdido'), provocar: tr('Provocar') });
const KIND_NAME = (): Record<string, string> => ({
  ataque: tr('Ataque'), area: tr('Área'), debilitar: tr('Debilitar'), mejora: tr('Mejora'), recuperacion: tr('Recuperación'),
  postura: tr('Postura'), especial: tr('Especial'), combo: tr('Combinada'), ulti: tr('Ulti'),
});
const AT_RIVAL = new Set(['ataque', 'debilitar', 'combo']);
const AT_ALLY = new Set(['mejora', 'recuperacion', 'postura']);
/** who a card is aimed at: 1 a rival, 0 an ally, null nobody (area, especial) */
function aimSide(c: Card, u: Unit): Side | null {
  const sp = specOf(c, u);
  if (AT_RIVAL.has(sp.kind) || (sp.kind === 'ulti' && !sp.area)) return 1;
  return AT_ALLY.has(sp.kind) ? 0 : null;
}
/** chevrons in the aiming arrow */
const AIM_N = 14;
const iconOf = (c: Card, u: Unit) => { const sp = specOf(c, u); return sp.kind === 'combo' ? 'tipo-combinada' : sp.kind === 'ulti' ? (sp.area ? 'tipo-area' : 'tipo-ataque') : `tipo-${sp.kind}`; };
/** an action lined up: what it is and the card it takes (for its box) */
interface Queued { a: Action; card: Card }

export function openDuelMatch(host: DuelHost, setup: DuelSetup) {
  document.querySelector('.dm')?.remove();
  const tutorial = !!setup.tutorial;
  const s: DuelState = setup.tutorial ? createTutorial(host.byId) : createDuel(setup.teams, setup.seed ?? (Math.random() * 2 ** 31) | 0, Math.random() < 0.5 ? 0 : 1);
  const level: CpuLevel = setup.tutorial ? 'facil' : setup.level;
  // the tutorial's rival always plays the same way (its lessons were tested with these rolls)
  const roll = tutorial ? () => 0.9 : Math.random;
  const steps = tutorial ? tutorialSteps() : [];
  let step = 0;
  const lesson = (): TutorialStep | undefined => steps[step];

  // ---- the plan: the actions lined up this turn, and the match as it will be once they are played
  let queue: Queued[] = [];
  let plan: DuelState = s;
  let planning = false;
  /** the boxes of the turn being played (yours or the rival's) and which one is playing now */
  let playing: { side: Side; list: Queued[]; now: number } | null = null;
  function startPlanning() { plan = cloneDuel(s); queue = []; planning = s.active === 0 && s.winner < 0; }
  /** the plan again from the real match, without the actions that no longer fit (a target that would already be out aims anew) */
  function replan() {
    plan = cloneDuel(s);
    const kept: Queued[] = [];
    for (const q of queue) {
      const card = plan.sides[0].hand.find((c) => c.id === (q.a as { card: number }).card);
      let a = q.a, why = act(plan, 0, a);
      if (why === 'bad_target' && a.do === 'use') { a = { ...a, target: undefined }; why = act(plan, 0, a); }
      if (!why && card) kept.push({ a, card: structuredClone(card) });
    }
    queue = kept;
  }

  const root = document.createElement('div');
  root.className = 'dm';
  root.innerHTML = `<style>${CSS_TEXT}</style><img class="dm-bg" alt="" draggable="false"><aside class="dm-side l"></aside><aside class="dm-side r"></aside><div class="dm-stage"><div class="dm-cam"><img class="dm-table" alt="" draggable="false">
    <div class="dm-coaches"></div><div class="dm-center"></div><div class="dm-units"></div></div>
    <div class="dm-rq"></div><div class="dm-speed"></div>
    <svg class="dm-aim"><defs><linearGradient id="dmAimBody" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="var(--ac)" stop-opacity="0"/><stop offset=".25" stop-color="var(--ac)" stop-opacity=".85"/><stop offset="1" stop-color="var(--ac)"/></linearGradient></defs><path class="dm-aim-trail"/><path class="dm-aim-body"/><g class="dm-aim-dots">${'<path vector-effect="non-scaling-stroke" d="M-.7 -1L.6 0L-.7 1L-.25 0Z"/>'.repeat(AIM_N)}</g><g class="dm-aim-ring"><circle r="1"/><path d="M0 -1.45V-.75M0 1.45V.75M-1.45 0H-.75M1.45 0H.75"/></g><path class="dm-aim-head" vector-effect="non-scaling-stroke" d="M1.15 0L-.85 -1.05L-.35 0L-.85 1.05Z"/></svg>
    <div class="dm-tray"><div class="dm-hand"></div></div><svg class="dm-links"></svg><div class="dm-q"></div>
    <button class="dm-play" type="button">${img('boton-turno')}<span></span></button>
    <div class="dm-bubble" hidden></div><div class="dm-info" hidden></div><div class="dm-fx"></div><div class="dm-banner"></div></div>
    <button class="dm-x" type="button" aria-label="${tr('Salir')}">✕</button>`;
  document.body.appendChild(root);
  const stage = root.querySelector<HTMLElement>('.dm-stage')!;
  const $ = <T extends HTMLElement>(q: string) => stage.querySelector<T>(q)!;
  let busy = false, picked: number | null = null, benchPick: number | null = null, closed = false, hoverCard: number | null = null, hoverUnit: number | null = null;
  let seenCards = new Set<number>();
  let L: Layout = LAYOUTS.h;
  /** PV as shown while the events of an action play (the state already has the final ones) */
  const hpView = new Map<number, number>();
  /** the Garra each footballer had when last drawn (the new orbs pop) */
  const gaugeSeen = new Map<number, number>();

  const close = () => { closed = true; window.clearInterval(flashTimer); root.remove(); window.removeEventListener('resize', onResize); };
  function crowdFlash(n = 1) {
    for (let i = 0; i < n; i++) {
      const f = document.createElement('i');
      f.className = 'dm-cflash';
      f.style.cssText = `left:${4 + Math.random() * 92}%;top:${1 + Math.random() * (L.v ? 9 : 13)}%;animation-delay:${i * 45 + Math.random() * 120}ms`;
      $('.dm-cam').appendChild(f);
      window.setTimeout(() => f.remove(), 900 + i * 45);
    }
  }
  const flashTimer = window.setInterval(() => { if (!document.hidden && Math.random() < 0.55) crowdFlash(1 + (Math.random() < 0.2 ? 2 : 0)); }, 700);
  root.querySelector('.dm-x')!.addEventListener('click', () => { sfx('click'); close(); host.done?.(false, tutorial); });
  function layout() {
    const v = window.innerWidth / window.innerHeight < 0.9;
    L = LAYOUTS[v ? 'v' : 'h'];
    stage.classList.toggle('v', v);
    const t = $<HTMLImageElement>('.dm-table');
    if (!t.src.includes(L.board)) { t.src = artUrl(L.board); root.querySelector<HTMLImageElement>('.dm-bg')!.src = artUrl(L.board); }
  }
  const onResize = () => { layout(); render(); };
  window.addEventListener('resize', onResize);

  // ---- drawing
  const px = (cqw: number) => Math.max(8, Math.round(stage.clientWidth * cqw / 100));
  /** the stage's own unit (1cqw wide, more on the tall table) in px */
  const U = () => stage.clientWidth / 100 * (L.v ? 1.8 : 1);
  function unitHtml(u: Unit) {
    const side = u.side, bench = u.slot === 3, [x, y] = L.slots[side][u.slot];
    const w = L.unitW[side] * (bench ? 0.72 : 1);
    const hp = hpView.get(u.uid) ?? Math.max(0, u.hp), k = hp / u.maxHp;
    const st = Object.entries(u.status).filter(([, n]) => n).map(([id, n]) => `<span class="dm-st" title="${esc(STATUS_NAME()[id] ?? id)}">${img(STATUS_FILE[id])}<b>${n}</b></span>`).join('')
      + (u.shield > 0 ? `<span class="dm-st">${img('estado-escudo')}<b>${u.shield}</b></span>` : '')
      + (u.stances.length ? `<span class="dm-st">${img('tipo-postura')}</span>` : '');
    const gauge = Array.from({ length: GAUGE_MAX }, (_, i) => `<span class="dm-g${i < u.gauge ? ' on' : ''}" style="left:${FR.orbX + i * FR.orbStep}%">${img(i < u.gauge ? 'garra-lleno' : 'garra-vacio')}</span>`).join('');
    const name = host.name(u.pid);
    return `<div class="dm-unit s${side}${bench ? ' bench' : ''}${u.gauge >= GAUGE_MAX ? ' full' : ''}" data-uid="${u.uid}" style="left:${x}%;top:${y}%;--w:${w}cqw;--i:${(u.uid * 0.37) % 1}">
      <div class="dm-sts">${st}</div>
      <div class="dm-card">
        <span class="dm-tring"></span><div class="dm-port">${host.mug(u.pid, px(w * FR.portW / 100))}</div>
        ${img(FRAME[host.rarity(u.pid)] ?? 'marco-legendario', 'dm-frame')}
        <span class="dm-el" title="${esc(tr(u.element))}">${elementIcon(u.element, px(w * 0.12))}</span>
        ${gauge}
        <span class="dm-nm" style="--n:${Math.max(6, name.length)}">${esc(name)}</span>
        <span class="dm-hpn" style="--d:${String(Math.round(hp)).length}">${izNum(Math.round(hp))}</span><span class="dm-atk" style="--d:${String(u.base.atk).length}">${izNum(u.base.atk, 'morado')}</span>
      </div>
      <div class="dm-life${k <= 0.25 ? ' low' : ''}" style="--p:${k * 100}%;--c:${lifeColor(k)}"><span class="hrt">♥</span><span class="bar"><span class="lag"></span><span class="cur"></span><span class="tick"></span></span><b>${izNum(Math.round(hp))}</b>${u.shield > 0 ? `<em>+${u.shield}</em>` : ''}</div>
      <div class="dm-pv"></div></div>`;
  }
  /** a card of the hand; `w` its width in cqw (sizes the faces) */
  function cardHtml(st: DuelState, c: Card, w: number) {
    const u = unit(st, c.owner), sp = specOf(c, u);
    const frame = c.idx === 'u' ? 'carta-ulti' : c.idx === 'c' ? 'carta-combinada' : `carta-r${c.rank}`;
    const faces = (c.combo ? c.combo.members.map((m) => unit(st, m).pid) : [u.pid]);
    const fw = w * 0.56 / (faces.length > 1 ? 1.45 : 1);
    const mult = sp.mult[Math.min(sp.mult.length - 1, (c.idx === 'u' || c.idx === 'c' ? 3 : c.rank) - 1)];
    const tech = cardInfo(st, c, host.name).tech;
    return `<div class="dm-hc${c.sealed ? ' sealed' : ''}${c.idx === 'u' ? ' ulti' : ''}${c.idx === 'c' ? ' combo' : ''}" data-cid="${c.id}">
      <div class="dm-hface">${faces.map((p) => host.mug(p, px(fw))).join('')}</div>
      ${img(frame, 'dm-hframe')}${img(iconOf(c, u), 'dm-hicon')}<i class="dm-hshine"></i>
      <span class="dm-htech" style="--lw:${Math.max(...tech.split(/\s+/).map((w) => w.length))}">${esc(tech)}</span>${mult ? `<span class="dm-hmult">×${mult}</span>` : ''}
      ${c.sealed ? img('estado-sellada', 'dm-hseal') : ''}</div>`;
  }
  const handW = () => (L.v ? 15 : 9.6);
  function render() {
    if (closed) return;
    // no card picked or dragged: no arrow
    if (picked === null && !drag) { aimAt.on = false; aimSvg.classList.remove('on'); }
    const me = s.sides[0], them = s.sides[1], mine = planning && !busy;
    const T = lesson(), hintCard = mine && tutorial ? tutorialCard(plan, T) : undefined, hintTarget = mine && tutorial ? tutorialTarget(plan, T) : undefined;
    $('.dm-units').innerHTML = [...them.units, ...me.units].filter((u) => u.slot >= 0).map(unitHtml).join('');
    for (const u of [...them.units, ...me.units]) {
      const was = gaugeSeen.get(u.uid) ?? u.gauge;
      if (u.gauge > was) {
        stage.querySelectorAll<HTMLElement>(`.dm-unit[data-uid="${u.uid}"] .dm-g`).forEach((g, i) => {
          if (i < was || i >= u.gauge) return;
          g.classList.add('gain'); g.style.setProperty('--gd', `${(i - was) * 110}ms`);
          window.setTimeout(() => { if (!closed) orbSfx(i, u.side === 1); }, (i - was) * 110);
        });
        if (u.gauge >= GAUGE_MAX && was < GAUGE_MAX) window.setTimeout(() => { if (!closed) gaugeFull(u.uid); }, (u.gauge - was) * 110 + 120);
      }
      gaugeSeen.set(u.uid, u.gauge);
    }
    const hand = (planning || playing?.side === 0 ? plan : s).sides[0].hand;
    $('.dm-hand').innerHTML = hand.map((c) => cardHtml(planning || playing?.side === 0 ? plan : s, c, handW())).join('');
    $('.dm-coaches').innerHTML = ([0, 1] as Side[]).map((side) => {
      const id = s.sides[side].coach, c = id ? COACH_BY_ID.get(id) : undefined, [x, y] = L.coach[side];
      const art = id ? host.coachArt(id) : '';
      return `<div class="dm-coach s${side}" style="left:${x}%;top:${y}%">${art ? `<img src="${art}" alt="" draggable="false">` : ''}<span>${esc(c?.name ?? tr('Sin entrenador'))}</span></div>`;
    }).join('');
    const center = $('.dm-center');
    center.style.cssText = `left:${L.center[0]}%;top:${L.center[1]}%`;
    center.innerHTML = `${img('aro-turno', 'dm-ring')}<b>${s.turn}</b><small>${s.active === 0 ? tr('Tu turno') : tr('Turno rival')}</small>`;
    center.classList.toggle('foe', s.active === 1);
    // the boxes of the turn: yours while you plan or play, the rival's while it plays
    const boxes = (side: Side) => {
      const list = playing?.side === side ? playing.list : side === 0 ? queue : [];
      const n = side === 0 ? Math.max(list.length + (planning ? plan.sides[0].actions : 0), planning || playing?.side === 0 ? 1 : 0) : list.length;
      return Array.from({ length: n }, (_, i) => {
        const q = list[i], st = playing?.side === side ? (i < playing.now ? ' done' : i === playing.now ? ' now' : '') : '';
        if (!q) return `<div class="dm-box empty"><b>${i + 1}</b></div>`;
        const tgt = q.a.do === 'use' && q.a.target !== undefined ? unit(s, q.a.target) : undefined;
        return `<div class="dm-box${st}${q.a.do === 'move' ? ' mv' : ''}" data-q="${i}"><b>${i + 1}</b>${cardHtml(side === 0 ? (playing ? s : plan) : s, q.card, 5 * (L.v ? 1.8 : 1))}${q.a.do === 'move' ? '<i class="dm-mvic">⇄</i>' : ''}${tgt ? `<span class="dm-tgt">${host.mug(tgt.pid, px(2.4))}</span>` : ''}</div>`;
      }).join('');
    };
    const qEl = $('.dm-q');
    qEl.style.cssText = `left:${L.queue[0]}%;top:${L.queue[1]}%`;
    qEl.innerHTML = `<small>${tr('Acciones')}</small><div>${boxes(0)}</div>`;
    const rq = $('.dm-rq');
    rq.style.cssText = `left:${L.rqueue[0]}%;top:${L.rqueue[1]}%`;
    rq.innerHTML = playing?.side === 1 ? `<div>${boxes(1)}</div>`
      : `<div class="dm-rhand" style="--n:${them.hand.length}">${them.hand.map((_, i) => `<span style="--k:${i - (them.hand.length - 1) / 2}">${img('carta-reverso')}</span>`).join('')}</div>${them.hand.length ? `<em>${them.hand.length}</em>` : ''}`;
    rq.classList.toggle('boxes', playing?.side === 1);
    const play = $<HTMLButtonElement>('.dm-play');
    play.style.cssText = `left:${L.play[0]}%;top:${L.play[1]}%`;
    play.disabled = !mine;
    play.querySelector('span')!.textContent = queue.length ? tr('¡Jugar!') : tr('Pasar turno');
    play.classList.toggle('hint', !!(mine && tutorial && T?.expect.do === 'end'));
    play.classList.toggle('glow', mine && queue.length > 0 && plan.sides[0].actions <= 0);
    // the fan of the hand
    const cards = [...stage.querySelectorAll<HTMLElement>('.dm-hand .dm-hc')];
    {
      const tw = $('.dm-tray').clientWidth, cw = cards[0]?.offsetWidth ?? 0, n = cards.length;
      const gap = n > 1 ? Math.min(cw * 0.06, (tw - n * cw) / (n - 1)) : 0;
      $('.dm-hand').style.setProperty('--gap', `${gap}px`);
    }
    cards.forEach((el, i) => {
      const id = Number(el.dataset.cid), t = i - (cards.length - 1) / 2;
      if (!seenCards.has(id)) el.classList.add('dealt');
      el.style.setProperty('--d', `${i * 70}ms`);
      el.style.setProperty('--r', `${t * 2.6}deg`);
      el.style.setProperty('--y', `${t * t * 0.22 * U()}px`);
      el.style.zIndex = String(i + 1);
      el.classList.toggle('ready', mine && plan.sides[0].actions > 0 && !el.classList.contains('sealed'));
      el.classList.toggle('picked', picked === id);
      el.classList.toggle('hint', hintCard?.id === id && picked !== id);
      el.classList.toggle('off', !mine);
    });
    if (mine && T?.expect.do === 'move' && hintCard) {
      // the place a lesson's card has to be dragged to
      const others = hand.filter((c) => c.id !== hintCard.id), at = others[T.expect.to];
      stage.querySelector(`.dm-hand .dm-hc[data-cid="${at?.id}"]`)?.classList.add('dropmark');
    }
    seenCards = new Set(hand.map((c) => c.id));
    fuseHints(planning || playing?.side === 0 ? plan : s, hand, mine);
    for (const el of stage.querySelectorAll<HTMLElement>('.dm-unit')) {
      const u = unit(s, Number(el.dataset.uid));
      el.classList.toggle('swap', benchPick !== null && u.side === 0 && u.slot <= 2);
      el.classList.toggle('picked', benchPick === u.uid);
      el.classList.toggle('hint', !!hintTarget && hintTarget.uid === u.uid && picked === hintCard?.id);
    }
    markTargets(picked);
    // the bar over the picked card
    stage.querySelector('.dm-bar')?.remove();
    const pc = picked !== null ? plan.sides[0].hand.find((c) => c.id === picked) : undefined;
    if (pc && mine) {
      const i = plan.sides[0].hand.indexOf(pc), cel = stage.querySelector<HTMLElement>(`.dm-hand .dm-hc[data-cid="${pc.id}"]`)!;
      const bar = document.createElement('div');
      bar.className = 'dm-bar';
      const to = aimSide(pc, unit(plan, pc.owner));
      bar.innerHTML = `<button data-mv="-1"${i === 0 ? ' disabled' : ''}>◀</button>`
        + (to === null ? `<button data-use class="${T?.expect.do === 'use' && hintCard?.id === pc.id ? 'hint' : ''}">${tr('Usar')}</button>` : `<span class="dm-pick">${to === 1 ? tr('Elige un rival') : tr('Elige un aliado')}</span>`)
        + `<button data-mv="1"${i === plan.sides[0].hand.length - 1 ? ' disabled' : ''}>▶</button>`;
      cel.appendChild(bar);
    }
    // Hillman's lesson
    const bubble = $('.dm-bubble');
    bubble.style.cssText = `left:${L.bubble[0]}%;top:${L.bubble[1]}%`;
    bubble.hidden = !(tutorial && T && mine);
    if (!bubble.hidden) bubble.innerHTML = `<b>Seymour Hillman</b>${esc(T!.say)}`;
    info();
    sides();
  }

  /** the panels at the sides of the table, when the screen is wider than it: the element wheel and your team on the
   * left, what each status does and the rival team on the right */
  function sides() {
    const free = (window.innerWidth - stage.clientWidth) / 2;
    const show = free >= 190;
    for (const el of root.querySelectorAll<HTMLElement>('.dm-side')) { el.hidden = !show; el.style.width = `${Math.min(330, free - 24)}px`; }
    if (!show) return;
    const team = (side: Side) => s.sides[side].units.map((u) => {
      const k = Math.max(0, u.hp) / u.maxHp, st = Object.entries(u.status).filter(([, n]) => n);
      return `<div class="dm-pf${u.slot < 0 ? ' out' : u.slot === 3 ? ' bench' : ''}"><span class="mugw">${host.mug(u.pid, 40)}</span><div><b>${elementIcon(u.element, 14)} ${esc(host.name(u.pid))}<small>${u.slot === 3 ? tr('Banquillo') : u.slot < 0 ? tr('Lesionado') : u.position}</small></b>`
        + `<span class="hp"><i style="width:${k * 100}%;background:${lifeColor(k)}"></i></span><span class="nums">♥ ${Math.max(0, u.hp)} · ${tr('ATQ')} ${u.base.atk} · ${tr('DEF')} ${u.base.def} · ${tr('Crít.')} ${u.base.crit} %</span>`
        + `<span class="gauge">${Array.from({ length: GAUGE_MAX }, (_, i) => `<i class="${i < u.gauge ? 'on' : ''}"></i>`).join('')}${st.map(([id, n]) => `${img(STATUS_FILE[id], 'ic')}<em>${n}</em>`).join('')}</span></div></div>`;
    }).join('');
    const coach = (side: Side) => { const id = s.sides[side].coach; return id ? `<small class="coachline">${esc(COACH_BY_ID.get(id)?.name ?? id)}</small>` : ''; };
    // the Inazuma wheel, clockwise: Montaña > Fuego > Bosque > Aire > Montaña; Neutro apart
    const arc = (d: string) => `<path d="${d}" marker-end="url(#dmW)"/>`;
    const wheel = `<div class="dm-wheel">${(['Montaña', 'Fuego', 'Bosque', 'Aire'] as const).map((e, i) => `<span class="w${i} el-${e === 'Montaña' ? 'Montana' : e}"><i>${elementIcon(e, 40)}</i><small>${esc(tr(e))}</small></span>`).join('')}`
      + `<svg viewBox="0 0 100 100"><defs><marker id="dmW" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="4" markerHeight="4" orient="auto"><path d="M0 0L10 5L0 10z"/></marker></defs>${arc('M63 17Q81 19 83 37')}${arc('M83 63Q81 81 63 83')}${arc('M37 83Q19 81 17 63')}${arc('M17 37Q19 19 37 17')}</svg><b>×1.3</b></div>`
      + `<p class="dm-sidenote">${esc(tr('Cada elemento gana al siguiente de la rueda (×1,3) y pierde contra el anterior (×0,8).'))}</p>`
      + `<p class="dm-neutral">${elementIcon('Neutro', 22)}<span>${esc(tr('Neutro: ni ventaja ni desventaja contra nadie.'))}</span></p>`;
    const desc: [string, string][] = [
      ['quemadura', tr('Pierde un 6 % de PV cada turno, 3 turnos')], ['congelado', tr('No recibe cartas; golpearlo rompe el hielo (×2)')],
      ['electrizado', tr('Cada carta suya que use le quita un 5 % de PV')], ['aturdido', tr('Sus cartas llegan pero no se pueden usar')],
      ['provocar', tr('Los ataques a 1 rival van a él')],
    ];
    const legend = desc.map(([id, t]) => `<p>${img(STATUS_FILE[id], 'ic')}<span><b>${esc(STATUS_NAME()[id])}</b>${esc(t)}</span></p>`).join('')
      + `<p>${img('estado-escudo', 'ic')}<span><b>${tr('Escudo')}</b>${esc(tr('Absorbe daño antes que los PV'))}</span></p>`;
    root.querySelector('.dm-side.l')!.innerHTML = `<h3>${tr('Elementos')}</h3>${wheel}<h3>${tr('Tu equipo')}</h3>${coach(0)}${team(0)}`;
    root.querySelector('.dm-side.r')!.innerHTML = `<h3>${tr('Rival')}</h3>${coach(1)}${team(1)}<h3>${tr('Estados')}</h3><div class="dm-legend">${legend}</div>`;
  }

  /** whether two cards of the hand fuse when they end up side by side (as rules.ts settle() decides) */
  const canFuse = (st: DuelState, a: Card, b: Card) => a.idx === b.idx && a.rank === b.rank && a.rank < 3 && a.idx !== 'u' && a.idx !== 'c'
    && !a.decoy && !b.decoy && !a.sealed && !b.sealed && unit(st, a.owner).family === unit(st, b.owner).family;
  /** Grand Cross: two equal cards with one card between them are joined by a golden arc, and the one in the middle is
   * marked — using it brings them together and they fuse */
  function fuseHints(st: DuelState, hand: Card[], on: boolean) {
    const svg = stage.querySelector<SVGSVGElement>('.dm-links')!;
    svg.innerHTML = '';
    if (!on) return;
    const pairs: [number, number][] = [];
    for (let i = 0; i + 2 < hand.length; i++) if (canFuse(st, hand[i], hand[i + 2]) && !canFuse(st, hand[i], hand[i + 1])) pairs.push([i, i + 2]);
    if (!pairs.length) return;
    const els = [...stage.querySelectorAll<HTMLElement>('.dm-hand .dm-hc')];
    for (const [a, b] of pairs) {
      els[a]?.classList.add('fusepair'); els[b]?.classList.add('fusepair');
      const mid = els[a + 1];
      if (mid && !mid.querySelector('.dm-fkey')) mid.insertAdjacentHTML('beforeend', `<span class="dm-fkey">⇄ ${esc(tr('¡Fusión!'))}</span>`);
    }
    // the arcs, once the fan has its final place
    requestAnimationFrame(() => {
      const sr = stage.getBoundingClientRect();
      svg.setAttribute('viewBox', `0 0 ${sr.width} ${sr.height}`);
      svg.innerHTML = pairs.map(([a, b]) => {
        const ra = els[a]?.getBoundingClientRect(), rb = els[b]?.getBoundingClientRect();
        if (!ra || !rb) return '';
        const x0 = ra.left + ra.width / 2 - sr.left, y0 = ra.top + ra.height * 0.12 - sr.top, x1 = rb.left + rb.width / 2 - sr.left, y1 = rb.top + rb.height * 0.12 - sr.top;
        const cy = Math.min(y0, y1) - U() * 4.5, mx = (x0 + x1) / 2, my = (y0 + y1) / 4 + cy / 2;
        return `<path class="glow" d="M${x0} ${y0}Q${mx} ${cy} ${x1} ${y1}"/><path d="M${x0} ${y0}Q${mx} ${cy} ${x1} ${y1}"/><circle cx="${x0}" cy="${y0}" r="${U() * 0.45}"/><circle cx="${x1}" cy="${y1}" r="${U() * 0.45}"/><text x="${mx}" y="${my + U() * 0.5}">✦</text>`;
      }).join('');
    });
  }
  /** cards dealt side by side that fused on their own: the two come together and become one */
  async function mergeOnEntry(ev: Extract<Ev, { t: 'merge' }>) {
    const el = stage.querySelector<HTMLElement>(`.dm-hand .dm-hc[data-cid="${ev.card}"]`);
    const st = planning ? plan : s, c = st.sides[0].hand.find((x) => x.id === ev.card);
    if (!el || !c) return;
    const sr = stage.getBoundingClientRect(), r = el.getBoundingClientRect();
    const before = cardHtml(st, { ...c, rank: Math.max(1, ev.rank - 1) as 1 | 2 | 3 }, handW());
    el.style.opacity = '0';
    const ghosts = [-1, 1].map((side) => {
      const g = document.createElement('div');
      g.className = 'dm-ghost';
      g.style.cssText = `left:${r.left - sr.left}px;top:${r.top - sr.top}px;width:${r.width}px`;
      g.innerHTML = before;
      fxLayer.appendChild(g);
      return g.animate([{ translate: `${side * r.width * 0.65}px 0`, rotate: `${side * 6}deg` }, { translate: `${side * r.width * 0.65}px 0`, rotate: `${side * 6}deg`, offset: 0.3 }, { translate: '0 0', rotate: '0deg', scale: '1.08' }], { duration: 620, easing: 'cubic-bezier(.6,0,.4,1)' }).finished.then(() => g.remove(), () => g.remove());
    });
    await Promise.all(ghosts);
    el.style.opacity = '';
    pulse(el, 'merged', 800);
    const p = { x: ((r.left + r.width / 2 - sr.left) / sr.width) * 100, y: ((r.top + r.height * 0.4 - sr.top) / sr.height) * 100 };
    particlesAt(p, 'star', '#ffd76a', 14);
    particlesAt(p, 'spark', '#fff3b0', 10);
    const tag = document.createElement('div');
    tag.className = 'dm-float rank';
    tag.style.cssText = `left:${p.x}%;top:${p.y - 6}%`;
    tag.textContent = '★'.repeat(ev.rank);
    fxLayer.appendChild(tag);
    window.setTimeout(() => tag.remove(), 1500);
    sfx('powerup', 1 + ev.rank * 0.1);
  }

  /** a combined technique formed as the cards were dealt: first the fusions it took in (each pair of cards coming
   * together over it), then those cards flying into it, and its name */
  async function comboOnEntry(merges: Extract<Ev, { t: 'merge' }>[], ev: Extract<Ev, { t: 'combo' }>) {
    const st = planning ? plan : s;
    const card = st.sides[0].hand.find((c) => c.idx === 'c' && c.combo?.name === ev.name);
    const el = card ? stage.querySelector<HTMLElement>(`.dm-hand .dm-hc[data-cid="${card.id}"]`) : null;
    if (!el) { banner(cardTech(ev.name), 'combo s0', 1400); sfx('legend'); return; }
    const sr = stage.getBoundingClientRect(), r = el.getBoundingClientRect(), w = r.width;
    const base = `left:${r.left - sr.left}px;top:${r.top - sr.top - w * 0.35}px;width:${w}px`;
    const ghost = (html: string) => { const g = document.createElement('div'); g.className = 'dm-ghost'; g.style.cssText = base; g.innerHTML = html; fxLayer.appendChild(g); return g; };
    el.style.opacity = '0';
    const n = merges.length;
    // 1. each pair comes together into its fused card, side by side above the combined one
    const fused = await Promise.all(merges.map(async (m, i) => {
      const x = (i - (n - 1) / 2) * w * 1.15;
      const lo = cardHtml(st, { id: -1, owner: m.owner, idx: m.idx, rank: Math.max(1, m.rank - 1) as 1 | 2 | 3 }, handW());
      const pair = [-1, 1].map((side) => {
        const g = ghost(lo);
        return g.animate([{ translate: `${x + side * w * 0.45}px 0`, opacity: 0 }, { translate: `${x + side * w * 0.45}px 0`, opacity: 1, offset: 0.3 }, { translate: `${x}px 0`, opacity: 1 }], { duration: 650, delay: i * 120, easing: 'cubic-bezier(.6,0,.4,1)', fill: 'forwards' }).finished.then(() => g.remove(), () => g.remove());
      });
      await Promise.all(pair);
      const g = ghost(cardHtml(st, { id: -1, owner: m.owner, idx: m.idx, rank: m.rank as 1 | 2 | 3 }, handW()));
      g.style.translate = `${x}px 0`;
      pulse(g.firstElementChild, 'merged', 700);
      const gr = g.getBoundingClientRect();
      particlesAt({ x: ((gr.left + gr.width / 2 - sr.left) / sr.width) * 100, y: ((gr.top + gr.height * 0.4 - sr.top) / sr.height) * 100 }, 'star', '#ffd76a', 10);
      sfx('powerup', 1 + m.rank * 0.1);
      return { g, x };
    }));
    await wait(650);
    // 2. the fused cards fly into the combined technique
    await Promise.all(fused.map(({ g, x }) => g.animate([{ translate: `${x}px 0`, scale: '1' }, { translate: `0 ${w * 0.35}px`, scale: '.7', opacity: 0 }], { duration: 380, easing: 'cubic-bezier(.6,0,.6,1)', fill: 'forwards' }).finished.then(() => g.remove(), () => g.remove())));
    el.style.opacity = '';
    pulse(el, 'merged', 900);
    const p = { x: ((r.left + w / 2 - sr.left) / sr.width) * 100, y: ((r.top + r.height * 0.4 - sr.top) / sr.height) * 100 };
    particlesAt(p, 'star', '#ffd76a', 18);
    particlesAt(p, 'spark', '#fff3b0', 16);
    banner(cardTech(ev.name), 'combo s0', 1400);
    sfx('legend');
    await wait(500);
  }

  /** the rivals (or allies) the picked card can go to glow, each with what the card would do to him */
  function markTargets(cid: number | null) {
    const pc = cid !== null && planning ? plan.sides[0].hand.find((c) => c.id === cid) : undefined;
    const to = pc ? aimSide(pc, unit(plan, pc.owner)) : null;
    stage.classList.toggle('aiming', to !== null);
    stage.classList.toggle('aim-ally', to === 0);
    for (const el of stage.querySelectorAll<HTMLElement>('.dm-unit')) {
      const u = unit(s, Number(el.dataset.uid)), pu = unit(plan, u.uid);
      const ok = to !== null && u.side === to && pu.slot >= 0 && pu.slot <= 2 && pu.hp > 0;
      el.classList.toggle('aim', ok);
      el.classList.toggle('dim', to !== null && !ok && u.slot <= 2);
      const pv = el.querySelector<HTMLElement>('.dm-pv')!;
      pv.innerHTML = ok && pc ? preview(pc, u.uid) : '';
    }
  }
  /** what a card would do to this target (played on a copy of the plan; a critical is shown as a normal blow) */
  function preview(c: Card, uid: number) {
    const sim = cloneDuel(plan), n = sim.log.length;
    if (act(sim, 0, { do: 'use', card: c.id, target: uid })) return '';
    const evs = sim.log.slice(n), atk = unit(sim, c.owner);
    const hits = evs.filter((e): e is Extract<Ev, { t: 'hit' }> => e.t === 'hit' && unit(sim, e.to).side === 1);
    const out: string[] = [];
    if (hits.length) {
      const h = hits.find((e) => e.to === uid) ?? hits[0];
      const dmg = hits.filter((e) => e.to === h.to).reduce((a, e) => a + (e.crit ? e.dmg / (atk.base.critDmg / 100) : e.dmg), 0);
      out.push(`<b class="dmg">${izNum(`-${Math.round(dmg / 10) * 10}`)}</b>`);
      if (h.to !== uid) out.push(`<span class="redir">${img('estado-provocar')}${esc(host.name(unit(s, h.to).pid))}</span>`);
      if (h.elem > 1) out.push(`<span class="good">▲ ${tr('Eficaz')}</span>`); else if (h.elem < 1) out.push(`<span class="bad">▼ ${tr('Poco eficaz')}</span>`);
      if (unit(sim, h.to).hp <= 0 && unit(plan, h.to).hp > 0) out.push(`<span class="ko">KO</span>`);
    }
    const heal = evs.filter((e): e is Extract<Ev, { t: 'heal' }> => e.t === 'heal' && e.to === uid).reduce((a, e) => a + e.hp, 0);
    const shield = evs.filter((e): e is Extract<Ev, { t: 'shield' }> => e.t === 'shield' && e.to === uid).reduce((a, e) => a + e.amount, 0);
    if (heal) out.push(`<b class="heal">${izNum(`+${heal}`, 'naranja', 'green')}</b>`);
    if (shield) out.push(`<b class="shield">${img('estado-escudo')}+${shield}</b>`);
    for (const e of evs) if (e.t === 'status' && e.to === uid) out.push(`<span class="st">${img(STATUS_FILE[e.s])}</span>`);
    return out.join('');
  }

  /** the panel with what the card under the pointer (or the picked one) does, or the footballer's numbers */
  function info() {
    const box = $('.dm-info');
    const st = planning ? plan : s;
    const cid = hoverCard ?? picked;
    const c = cid !== null ? st.sides[0].hand.find((x) => x.id === cid) ?? queue.find((q) => q.card.id === cid)?.card : undefined;
    box.style.cssText = `left:${L.info[0]}%;top:${L.info[1]}%`;
    if (c && !stage.classList.contains('scene')) {
      const ci = cardInfo(st, c, host.name), u = unit(st, c.owner);
      box.innerHTML = `<div class="dm-ih">${img(iconOf(c, u))}<div><b>${esc(ci.tech)}</b><small>${esc(KIND_NAME()[ci.kind] ?? ci.kind)} · ${esc(host.name(u.pid))}${c.idx === 'u' || c.idx === 'c' ? '' : ` · ${'★'.repeat(c.rank)}`}</small></div></div>`
        + (ci.base ? `<p class="base">${esc(ci.base)}</p>` : '')
        + ci.lines.map((l) => `<p class="${l.on ? '' : 'off'}">${l.on ? '' : `<em>${'★'.repeat(l.min)}</em> `}${esc(l.text)}</p>`).join('');
      box.hidden = false;
      return;
    }
    const hu = hoverUnit !== null ? unit(s, hoverUnit) : undefined;
    if (hu && !stage.classList.contains('scene') && !stage.classList.contains('dragging')) {
      const b = hu.base;
      box.innerHTML = `<div class="dm-ih">${elementIcon(hu.element, Math.round(U() * 2.4))}<div><b>${esc(host.name(hu.pid))}</b><small>${esc(tr(hu.element))} · ${esc(hu.position)}</small></div></div>`
        + `<div class="dm-stats"><span>♥ ${Math.max(0, hu.hp)}/${hu.maxHp}</span><span>${tr('ATQ')} ${b.atk}</span><span>${tr('DEF')} ${b.def}</span><span>${tr('Crít.')} ${b.crit} %</span><span>${tr('Daño crít.')} ${b.critDmg} %</span><span>${tr('Garra')} ${hu.gauge}/${GAUGE_MAX}</span></div>`
        + Object.entries(hu.status).filter(([, n]) => n).map(([id, n]) => `<p>${img(STATUS_FILE[id], 'ic')} ${esc(STATUS_NAME()[id] ?? id)} · ${tr('{n} turnos', { n: n! })}</p>`).join('');
      box.hidden = false;
      return;
    }
    box.hidden = true;
  }

  // ---- effects
  const fxLayer = $('.dm-fx');
  function at(el: Element, fy = 0.4) {
    const r = el.getBoundingClientRect(), sr = stage.getBoundingClientRect();
    return { x: ((r.left + r.width / 2 - sr.left) / sr.width) * 100, y: ((r.top + r.height * fy - sr.top) / sr.height) * 100 };
  }
  const unitEl = (uid: number) => stage.querySelector<HTMLElement>(`.dm-unit[data-uid="${uid}"]`);
  function float(uid: number, text: string, cls: string, delay = 0) {
    const el = unitEl(uid);
    if (!el) return;
    const p = at(el, 0.3), f = document.createElement('div');
    f.className = `dm-float ${cls}`;
    f.style.cssText = `left:${p.x + (Math.random() - 0.5) * 3}%;top:${p.y}%;animation-delay:${delay}ms`;
    f.innerHTML = text;
    fxLayer.appendChild(f);
    window.setTimeout(() => f.remove(), 1600 + delay);
  }
  function pulse(el: Element | null, cls: string, ms = 450) {
    if (!el) return;
    const cs = cls.split(' ');
    el.classList.remove(...cs); void (el as HTMLElement).offsetWidth; el.classList.add(...cs);
    window.setTimeout(() => el.classList.remove(...cs), ms);
  }
  /** a burst of little lights: sparks out of a blow, green crosses rising from a heal, flames, ice, lightning */
  type PtKind = 'spark' | 'heal' | 'shield' | 'burn' | 'ice' | 'zap' | 'ko' | 'power' | 'leaf' | 'rock' | 'star';
  function particles(uid: number, kind: PtKind, color = '#fff', n = 14) {
    const el = unitEl(uid);
    if (el) particlesAt(at(el, kind === 'heal' ? 0.7 : 0.4), kind, color, n);
  }
  function particlesAt(p: { x: number; y: number }, kind: PtKind, color = '#fff', n = 14) {
    for (let i = 0; i < n; i++) {
      const d = document.createElement('i');
      const ang = Math.random() * Math.PI * 2, dist = (kind === 'spark' || kind === 'ko' || kind === 'rock' || kind === 'leaf' ? 4 + Math.random() * 8 : 2 + Math.random() * 4) * U();
      const rise = kind === 'heal' || kind === 'burn';
      const dx = rise ? (Math.random() - 0.5) * 6 * U() : Math.cos(ang) * dist;
      const dy = rise ? -(4 + Math.random() * 7) * U() : Math.sin(ang) * dist + (kind === 'rock' || kind === 'leaf' ? 3 * U() : 0);
      d.className = `dm-pt ${kind}`;
      d.style.cssText = `left:${p.x + (kind === 'heal' ? (Math.random() - 0.5) * 6 : 0)}%;top:${p.y}%;--dx:${dx}px;--dy:${dy}px;--c:${color};--s:${0.5 + Math.random()};animation-delay:${Math.random() * (kind === 'heal' ? 350 : 60)}ms`;
      if (kind === 'heal') d.textContent = '+';
      if (kind === 'star') d.textContent = '★';
      fxLayer.appendChild(d);
      window.setTimeout(() => d.remove(), 1300);
    }
  }
  /** the table shakes, harder for bigger blows */
  function shake(power: number) {
    const k = Math.min(1.6, power) * U();
    cam.animate(Array.from({ length: 7 }, (_, i) => ({ translate: i === 0 || i === 6 ? '0 0' : `${(Math.random() - 0.5) * 2 * k}px ${(Math.random() - 0.5) * 2 * k}px` })), { duration: 320 + power * 120, easing: 'ease-out', composite: 'add' });
  }
  /** the PV count down (or up) to their new value */
  function setHp(uid: number, hp: number) {
    const from = hpView.get(uid) ?? hp;
    hpView.set(uid, hp);
    const el = unitEl(uid), u = unit(s, uid);
    if (!el) return;
    const life = el.querySelector<HTMLElement>('.dm-life')!, k = Math.max(0, hp / u.maxHp);
    life.style.setProperty('--p', `${k * 100}%`);
    life.style.setProperty('--c', lifeColor(k));
    life.classList.toggle('low', k <= 0.25);
    pulse(life, hp < from ? 'hit' : 'up', 500);
    const b = life.querySelector('b')!, n2 = el.querySelector('.dm-hpn')!, t0 = performance.now();
    const step = (t: number) => {
      const q = Math.min(1, (t - t0) / 450), v = Math.max(0, Math.round(from + (hp - from) * (1 - (1 - q) ** 3)));
      b.innerHTML = izNum(v); n2.innerHTML = izNum(v); (n2 as HTMLElement).style.setProperty('--d', String(String(v).length));
      if (q < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
  function banner(text: string, cls = '', ms = 1100) {
    const b = $('.dm-banner');
    b.className = `dm-banner on ${cls}`;
    b.innerHTML = `<span>${esc(text)}</span>`;
    window.setTimeout(() => { if (b.innerHTML.includes(esc(text))) b.className = 'dm-banner'; }, ms);
  }
  // ---- the scene of a card: the camera closes in, the technique comes in from the right, the charge and the blow
  const cam = $('.dm-cam');
  let camK = 1;
  function focus(uids: number[] | null) {
    const els = (uids ?? []).map(unitEl).filter(Boolean) as HTMLElement[];
    stage.classList.toggle('scene', els.length > 0);
    if (!els.length) { camK = 1; cam.style.transform = ''; return; }
    const x = els.reduce((a, e) => a + parseFloat(e.style.left), 0) / els.length, y = els.reduce((a, e) => a + parseFloat(e.style.top), 0) / els.length - 4;
    // one footballer: close; several (an attacker and his target, a combined technique): wider, all in view
    const ys = els.map((e) => parseFloat(e.style.top)), spread = Math.max(...ys) - Math.min(...ys);
    camK = els.length > 1 ? (spread > 15 ? 1.08 : 1.15) : 1.3;
    cam.style.transformOrigin = `${x}% ${y}%`;
    cam.style.transform = `translate(${(50 - x) * 0.3}%, ${(44 - y) * 0.3}%) scale(${camK})`;
  }
  const membersOf = (c: Card) => (c.combo ? c.combo.members.filter((m) => unit(s, m).slot >= 0 && unit(s, m).slot <= 2) : [c.owner]);
  async function castIn(ev: Extract<Ev, { t: 'use' }>, also: number[] = []) {
    const big = ev.card.idx === 'u' || ev.card.idx === 'c';
    const who = membersOf(ev.card);
    const c = document.createElement('div');
    c.className = `dm-cast s${ev.side}${big ? ' big' : ''}`;
    c.style.cssText = `left:${L.cast[0]}%;top:${L.cast[1]}%`;
    c.innerHTML = cardHtml(s, ev.card, (big ? 12.5 : 10.5) * (L.v ? 1.8 : 1)) + `<div class="dm-cname"><small>${esc(who.map((m) => host.name(unit(s, m).pid)).join(' + '))}</small><span>${esc(cardInfo(s, ev.card, host.name).tech)}</span></div>`;
    fxLayer.appendChild(c);
    focus([...who, ...also]);
    for (const m of who) { unitEl(m)?.classList.add('acting'); particles(m, 'power', EL_FX[unit(s, m).element] ?? '#fff', 10); }
    sfx(big ? 'legend' : 'whoosh');
    elementSfx(unit(s, ev.card.owner).element, 'cast', big);
    if (big) {
      stage.classList.add('ultimate'); root.classList.add('flash'); window.setTimeout(() => root.classList.remove('flash'), 500);
      crowdFlash(14);
      // an ulti or a combined technique cuts in: a band across the table with the faces, big, and the technique's name
      const cut = document.createElement('div');
      cut.className = `dm-cutin s${ev.side}`;
      cut.innerHTML = `<div class="dm-cut-band"><div class="dm-cut-faces">${who.map((m) => host.mug(unit(s, m).pid, px(16))).join('')}</div><b>${esc(cardInfo(s, ev.card, host.name).tech)}</b></div>`;
      stage.appendChild(cut);
      window.setTimeout(() => cut.remove(), 1300);
    }
    await wait(big ? 1250 : ev.side === 1 ? 620 : 520);
    return c;
  }
  async function castOut(c: HTMLElement, ev: Extract<Ev, { t: 'use' }>) {
    c.classList.add('go');
    for (const m of membersOf(ev.card)) unitEl(m)?.classList.remove('acting');
    stage.classList.remove('ultimate');
    focus(null);
    await wait(320);
    c.remove();
  }
  function impact(uid: number, color: string, crit = false, power = 0.6) {
    const el = unitEl(uid);
    if (!el) return;
    const p = at(el), f = document.createElement('div');
    f.className = `dm-impact${crit ? ' crit' : ''}`;
    f.style.cssText = `left:${p.x}%;top:${p.y}%;--c:${color}`;
    f.innerHTML = '<svg viewBox="0 0 100 100"><path d="M58 2L30 52h18L38 98l36-58H54z"/></svg><span class="slash"></span>';
    fxLayer.appendChild(f);
    window.setTimeout(() => f.remove(), 700);
    particles(uid, 'spark', color, crit ? 22 : 14);
    shake(crit ? power + 0.8 : power);
    if (crit || power > 1) vignette(color);
  }
  const delta = (from: HTMLElement, to: HTMLElement, k: number) => {
    const a = from.getBoundingClientRect(), b = to.getBoundingClientRect();
    return { dx: ((b.left + b.width / 2) - (a.left + a.width / 2)) / camK * k, dy: ((b.top + b.height / 2) - (a.top + a.height / 2)) / camK * k };
  };
  /** the Garra is full: a pillar of light, a ring, gold stars and the words; the ulti will be in the hand next turn */
  function gaugeFull(uid: number) {
    const el = unitEl(uid);
    if (!el) return;
    const u = unit(s, uid), gold = u.side === 0 ? '#ffd23a' : '#8fd0ff', p = at(el, 0.5);
    const fx = document.createElement('div');
    fx.className = `dm-ultifx s${u.side}`;
    fx.style.cssText = `left:${p.x}%;top:${p.y}%`;
    fx.innerHTML = '<i class="pillar"></i><i class="ring"></i><i class="ring r2"></i>';
    fxLayer.appendChild(fx);
    window.setTimeout(() => fx.remove(), 1400);
    pulse(el, 'ultiup', 1300);
    particles(uid, 'star', gold, 22);
    particles(uid, 'power', gold, 16);
    float(uid, tr('¡Ulti lista!'), `ultiready s${u.side}`, 120);
    if (u.side === 0) { ultiReadySfx(); crowdFlash(6); punch(1); } else sfx('powerup', 0.7);
  }
  function vignette(color: string) {
    const v = document.createElement('div');
    v.className = 'dm-vig';
    v.style.setProperty('--c', color);
    stage.appendChild(v);
    window.setTimeout(() => v.remove(), 650);
  }
  /** the burst of each element where a blow lands: flames, a whirlwind, leaves, rocks and a crack */
  function elementBurst(uid: number, element: string, big: boolean) {
    const el = unitEl(uid);
    if (!el) return;
    const p = at(el), n = big ? 1.6 : 1;
    if (element === 'Fuego') { particlesAt(p, 'burn', '#ff8a2a', Math.round(18 * n)); particlesAt(p, 'burn', '#ffd23a', Math.round(8 * n)); }
    else if (element === 'Bosque') particlesAt(p, 'leaf', '#6aff5a', Math.round(16 * n));
    else if (element === 'Montaña') particlesAt(p, 'rock', '#c08a4a', Math.round(14 * n));
    const f = document.createElement('div');
    f.className = `dm-elfx el-${element === 'Montaña' ? 'Montana' : element}`;
    f.style.cssText = `left:${p.x}%;top:${p.y}%`;
    f.innerHTML = '<span></span><span></span><span></span>';
    fxLayer.appendChild(f);
    window.setTimeout(() => f.remove(), 900);
  }
  /** the ball, kicked from `from` to `to` with a trail of the kicker's element (resolves when it arrives) */
  async function shot(from: HTMLElement, to: HTMLElement, color: string, big: boolean) {
    const a = at(from, 0.75), b = at(to, 0.4);
    const ball = document.createElement('div');
    ball.className = `dm-ball${big ? ' big' : ''}`;
    const sr0 = stage.getBoundingClientRect();
    ball.style.cssText = `left:${a.x}%;top:${a.y}%;--c:${color};--ang:${Math.atan2((b.y - a.y) * sr0.height, (b.x - a.x) * sr0.width)}rad`;
    ball.innerHTML = '<i class="dm-tail"></i>';
    fxLayer.appendChild(ball);
    sfx('kick', 1.2);
    const dur = 230, t0 = performance.now();
    await new Promise<void>((done) => {
      const step = (t: number) => {
        const q = Math.min(1, (t - t0) / dur), x = a.x + (b.x - a.x) * q, y = a.y + (b.y - a.y) * q - Math.sin(q * Math.PI) * 4;
        ball.style.left = `${x}%`; ball.style.top = `${y}%`; ball.style.setProperty('--spin', `${q * 720}deg`);
        particlesAt({ x, y }, 'power', color, 2);
        if (q < 1) requestAnimationFrame(step); else done();
      };
      requestAnimationFrame(step);
    });
    ball.remove();
  }
  /** the camera kicks towards the blow */
  function punch(k: number) { cam.animate([{ scale: '1' }, { scale: String(1 + 0.05 * k) }, { scale: '1' }], { duration: 260, easing: 'ease-out' }); }
  /** they run at the target (all the members of a combined technique, one after the other), kick and the ball hits */
  async function lunge(froms: number[], to: number, crit: boolean, color: string, power: number, element = '') {
    const b = unitEl(to);
    if (!b) return;
    froms.forEach((from, i) => {
      const a = unitEl(from);
      if (!a) return;
      const { dx, dy } = delta(a, b, 0.42 - i * 0.06);
      a.style.zIndex = '7';
      a.classList.add('dash');
      const anim = a.animate([
        { translate: '0 0', rotate: '0deg' },
        { translate: `${-dx * 0.1}px ${-dy * 0.1}px`, rotate: `${dx > 0 ? -7 : 7}deg`, offset: 0.28 },
        { translate: `${dx}px ${dy}px`, rotate: `${dx > 0 ? 5 : -5}deg`, offset: 0.52 },
        { translate: `${dx * 0.88}px ${dy * 0.88}px`, rotate: '0deg', offset: 0.66 },
        { translate: '0 0', rotate: '0deg' },
      ], { duration: 860, delay: i * 110, easing: 'cubic-bezier(.5,0,.3,1)' });
      void anim.finished.then(() => { a.style.zIndex = ''; a.classList.remove('dash'); }, () => undefined);
    });
    sfx('whoosh', 0.8);
    await wait(420 + (froms.length - 1) * 110);
    const kicker = unitEl(froms[froms.length - 1]);
    if (kicker) await shot(kicker, b, color, froms.length > 1 || power > 1.2);
    if (crit) {
      // a critical stops time for an instant before the blow lands
      b.classList.add('freeze'); root.classList.add('flash');
      await wait(110);
      b.classList.remove('freeze'); window.setTimeout(() => root.classList.remove('flash'), 300);
    }
    impact(to, color, crit, power);
    elementBurst(to, element, crit || froms.length > 1);
    elementSfx(element, 'hit', crit || froms.length > 1 || power > 1.2);
    punch(crit ? 2 : 1);
  }
  async function slam(from: number[], tos: number[], color: string) {
    for (const f of from) {
      const a = unitEl(f);
      if (!a) continue;
      a.style.zIndex = '7';
      const anim = a.animate([
        { translate: '0 0', scale: '1' }, { translate: `0 ${-3 * U()}px`, scale: '1.16', offset: 0.45 }, { translate: `0 ${0.4 * U()}px`, scale: '1', offset: 0.6 }, { translate: '0 0', scale: '1' },
      ], { duration: 780, easing: 'ease-in-out' });
      void anim.finished.then(() => { a.style.zIndex = ''; }, () => undefined);
    }
    await wait(470);
    sfx('boom');
    elementSfx(unit(s, from[0]).element, 'hit', true);
    const a = unitEl(from[0]);
    if (a) {
      const w = document.createElement('div');
      w.className = 'dm-wave';
      const p = at(a);
      w.style.cssText = `left:${p.x}%;top:${p.y}%;--c:${color}`;
      fxLayer.appendChild(w);
      window.setTimeout(() => w.remove(), 750);
    }
    for (const t of tos) { impact(t, color, false, 0.9); elementBurst(t, unit(s, from[0]).element, false); await wait(80); }
    punch(1.5);
  }
  /** the effect of one event of the log */
  async function one(ev: Ev) {
    switch (ev.t) {
      case 'hit': {
        const u = unit(s, ev.to);
        setHp(ev.to, (hpView.get(ev.to) ?? u.hp) - ev.dmg);
        pulse(unitEl(ev.to), ev.crit ? 'hurt crit' : 'hurt', 480);
        if (ev.dmg > unit(s, ev.to).maxHp * 0.25) particles(ev.to, 'star', '#ffe14a', 8);
        sfx(ev.crit ? 'crit' : 'hit');
        float(ev.to, `${ev.crit ? `<small>${tr('¡Crítico!')}</small>` : ''}${izNum(`-${ev.dmg}`, ev.crit ? 'morado' : 'naranja')}`, ev.crit ? 'dmg crit' : 'dmg');
        if (ev.broke) { float(ev.to, tr('¡Hielo roto!'), 'note ice', 140); particles(ev.to, 'ice', '#bff4ff', 18); }
        else if (ev.elem > 1) float(ev.to, tr('¡Eficaz!'), 'note good', 140);
        else if (ev.elem < 1) float(ev.to, tr('Poco eficaz'), 'note bad', 140);
        await wait(210);
        break;
      }
      case 'miss': float(ev.to, ev.why === 'dodge' ? tr('Esquiva') : ev.why === 'block' ? tr('Bloqueado') : tr('Fallo'), 'note'); pulse(unitEl(ev.to), ev.why === 'dodge' ? 'dodge' : 'shielded', 600); sfx('sweep'); await wait(320); break;
      case 'heal': setHp(ev.to, (hpView.get(ev.to) ?? 0) + ev.hp); float(ev.to, izNum(`+${ev.hp}`, 'naranja', 'green'), 'heal'); pulse(unitEl(ev.to), 'healed', 900); particles(ev.to, 'heal', '#7dff9a', 16); sfx('pickup'); await wait(260); break;
      case 'shield': float(ev.to, `${img('estado-escudo')}+${ev.amount}`, 'shield'); pulse(unitEl(ev.to), 'shielded', 800); particles(ev.to, 'shield', '#8fd8ff', 12); sfx('magnet', 1.3); await wait(220); break;
      case 'status': {
        float(ev.to, `${img(STATUS_FILE[ev.s])}${esc(STATUS_NAME()[ev.s] ?? ev.s)}`, `status st-${ev.s}`);
        const k = ev.s === 'quemadura' ? 'burn' : ev.s === 'congelado' ? 'ice' : ev.s === 'electrizado' ? 'zap' : 'spark';
        particles(ev.to, k, ({ burn: '#ff8a2a', ice: '#bff4ff', zap: '#7fe8ff', spark: '#ffe08a' } as Record<string, string>)[k], 14);
        pulse(unitEl(ev.to), `got-${ev.s}`, 900);
        sfx(ev.s === 'electrizado' ? 'zap' : ev.s === 'congelado' ? 'sweep' : 'magnet');
        await wait(280);
        break;
      }
      case 'resist': float(ev.to, tr('Resiste'), 'note'); await wait(200); break;
      case 'ko': {
        const el = unitEl(ev.uid);
        el?.classList.add('koing');
        root.classList.add('flash', 'slowmo');
        await wait(260);
        float(ev.uid, tr('K.O.'), 'kostamp');
        particles(ev.uid, 'ko', '#ffffff', 26);
        particles(ev.uid, 'spark', unit(s, ev.uid).side === 0 ? '#ff6a6a' : '#ffd76a', 18);
        shake(1.6); punch(2.4); sfx('boom');
        window.setTimeout(() => root.classList.remove('flash', 'slowmo'), 380);
        await wait(380);
        el?.classList.add('ko');
        await wait(620);
        break;
      }
      default: break;
    }
  }
  /** shows what an action did, on the table as it was; each card played is one scene */
  async function show(events: Ev[]) {
    for (let k = 0; k < events.length && !closed;) {
      const ev = events[k];
      if (ev.t !== 'use') { await one(ev); k++; continue; }
      let j = k + 1;
      while (j < events.length && events[j].t !== 'use') j++;
      const group = events.slice(k + 1, j);
      const who = membersOf(ev.card), color = EL_FX[unit(s, ev.card.owner).element] ?? '#fff';
      const blows = group.filter((e): e is Extract<Ev, { t: 'hit' | 'miss' }> => (e.t === 'hit' || e.t === 'miss') && unit(s, e.to).side !== ev.side);
      const targets = [...new Set(blows.map((e) => e.to))];
      const c = await castIn(ev, targets.length === 1 ? targets : []);
      const dmg = blows.reduce((a, e) => a + (e.t === 'hit' ? e.dmg : 0), 0), maxHp = targets.length ? unit(s, targets[0]).maxHp : 1;
      if (targets.length === 1) await lunge(who, targets[0], blows.some((e) => e.t === 'hit' && e.crit), color, 0.4 + Math.min(1.2, dmg / maxHp * 2.5), unit(s, ev.card.owner).element);
      else if (targets.length > 1) await slam(who, targets, color);
      for (const e of group) { if (closed) return; await one(e); }
      await wait(340);
      await castOut(c, ev);
      k = j;
    }
  }
  /** after the new state is drawn: the rival's fusions, ultis ready, entries, the new turn */
  async function after(events: Ev[], mine: boolean) {
    let dealt = false;
    const entry: Extract<Ev, { t: 'merge' | 'combo' }>[] = [];
    for (const ev of events) {
      if (closed) return;
      if ((ev.t === 'merge' || ev.t === 'combo') && !mine && ev.side === 0) entry.push(ev);
      else if (ev.t === 'merge' && !mine) sfx('powerup', 0.8);
      else if (ev.t === 'combo' && !mine) { banner(cardTech(ev.name), `combo s${ev.side}`, 1400); sfx('legend'); await wait(700); }
      else if (ev.t === 'ulti') {
        pulse(unitEl(ev.uid), 'ultiup', 1300);
        if (unit(s, ev.uid).side === 0) {
          sfx('levelup');
          const card = [...stage.querySelectorAll<HTMLElement>('.dm-hand .dm-hc.ulti')].find((c) => plan.sides[0].hand.find((h) => h.id === Number(c.dataset.cid))?.owner === ev.uid);
          if (card) { pulse(card, 'ultiin', 1200); const r = card.getBoundingClientRect(), sr = stage.getBoundingClientRect(); particlesAt({ x: ((r.left + r.width / 2 - sr.left) / sr.width) * 100, y: ((r.top + r.height * 0.4 - sr.top) / sr.height) * 100 }, 'star', '#ffd23a', 18); }
        }
      }
      else if (ev.t === 'enter') { pulse(unitEl(ev.uid), 'enter', 800); sfx('whoosh', 1.2); }
      else if (ev.t === 'deal') dealt = true;
      else if (ev.t === 'turn') { banner(ev.side === 0 ? tr('¡Tu turno!') : tr('Turno rival'), `turn s${ev.side}`, 1250); sfx(ev.side === 0 ? 'reveal' : 'whoosh', 0.9); }
    }
    if (dealt) sfx('reveal');
    if (entry.length) {
      // in the order they happened: a fusion whose card is still in the hand plays on it; the ones a combined technique
      // then took in are shown first (each pair coming together) and then flying into it
      await wait(dealt ? 1150 : 100); // after the «Tu turno» banner
      let taken: Extract<Ev, { t: 'merge' }>[] = [];
      for (const ev of entry) {
        if (closed) return;
        if (ev.t === 'merge') {
          if (stage.querySelector(`.dm-hand .dm-hc[data-cid="${ev.card}"]`)) { await mergeOnEntry(ev); await wait(120); } else taken.push(ev);
        } else { await comboOnEntry(taken, ev); taken = []; await wait(150); }
      }
    }
  }
  const cardTech = (name: string) => cardInfo(s, { id: 0, owner: 0, idx: 'c', rank: 3, combo: { name, members: [0] } }, host.name).tech;
  /** where each card of the hand is (and how it looks), to animate the hand from there after it changes */
  function snapHand() {
    const m = new Map<number, { r: DOMRect; html: string }>();
    for (const el of stage.querySelectorAll<HTMLElement>('.dm-hand .dm-hc')) m.set(Number(el.dataset.cid), { r: el.getBoundingClientRect(), html: el.outerHTML });
    return m;
  }
  /** the hand slides from where it was; a card that fused flies into the one it joined, which grows and shines */
  async function flipHand(snap: Map<number, { r: DOMRect; html: string }>, events: Ev[], used?: number) {
    const sr = stage.getBoundingClientRect();
    const now = new Map([...stage.querySelectorAll<HTMLElement>('.dm-hand .dm-hc')].map((el) => [Number(el.dataset.cid), el]));
    for (const [id, el] of now) {
      const o = snap.get(id);
      if (!o) continue;
      const r = el.getBoundingClientRect(), dx = o.r.left - r.left, dy = o.r.top - r.top;
      if (Math.abs(dx) + Math.abs(dy) > 1) el.animate([{ translate: `${dx}px ${dy}px` }, { translate: '0 0' }], { duration: 340, easing: 'cubic-bezier(.2,1.1,.3,1)' });
    }
    const gone = [...snap.keys()].filter((id) => !now.has(id) && id !== used);
    for (const ev of events) {
      if ((ev.t !== 'merge' && ev.t !== 'combo') || ev.side !== 0) continue;
      const into = ev.t === 'merge' ? now.get(ev.card) : stage.querySelector<HTMLElement>('.dm-hand .dm-hc.combo') ?? undefined;
      if (!into) continue;
      const ir = into.getBoundingClientRect();
      for (const id of gone.splice(0, ev.t === 'merge' ? 1 : 2)) {
        const o = snap.get(id)!, g = document.createElement('div');
        g.className = 'dm-ghost';
        g.style.cssText = `left:${o.r.left - sr.left}px;top:${o.r.top - sr.top}px;width:${o.r.width}px`;
        g.innerHTML = o.html;
        fxLayer.appendChild(g);
        g.animate([{ translate: '0 0', scale: '1', opacity: 1 }, { translate: `${ir.left - o.r.left}px ${ir.top - o.r.top - 10}px`, scale: '.9', opacity: 1, offset: 0.75 }, { translate: `${ir.left - o.r.left}px ${ir.top - o.r.top}px`, scale: '.6', opacity: 0 }], { duration: 360, easing: 'cubic-bezier(.5,0,.6,1)' }).finished.then(() => g.remove(), () => g.remove());
      }
      await wait(300);
      pulse(into, 'merged', 800);
      const p = { x: ((ir.left + ir.width / 2 - sr.left) / sr.width) * 100, y: ((ir.top + ir.height * 0.4 - sr.top) / sr.height) * 100 };
      particlesAt(p, 'star', '#ffd76a', 14);
      particlesAt(p, 'spark', '#fff3b0', 12);
      const tag = document.createElement('div');
      tag.className = 'dm-float rank';
      tag.style.cssText = `left:${p.x}%;top:${p.y - 6}%`;
      tag.textContent = ev.t === 'merge' ? '★'.repeat(ev.rank) : cardTech(ev.name);
      fxLayer.appendChild(tag);
      window.setTimeout(() => tag.remove(), 1500);
      if (ev.t === 'combo') { banner(cardTech(ev.name), 'combo s0', 1300); sfx('legend'); } else sfx('powerup', 1 + ev.rank * 0.1);
      await wait(250);
    }
  }
  async function run(side: Side, a: Action) {
    const n = s.log.length;
    const before = structuredClone(s.sides);
    if (a.do === 'use') before[side].hand = before[side].hand.filter((c) => c.id !== a.card);
    const why = act(s, side, a);
    if (why) return why;
    const evs = s.log.slice(n);
    // the table as it was (the state already moved on) while the blows land
    const now = s.sides;
    s.sides = before;
    for (const u of [...before[0].units, ...before[1].units]) hpView.set(u.uid, Math.max(0, u.hp));
    // (an effect that fails never stops the match: the state is put back and the game goes on)
    try { render(); await show(evs); } catch (e) { console.error(e); }
    s.sides = now;
    hpView.clear();
    render();
    try { await after(evs, side === 0 && a.do !== 'end'); } catch (e) { console.error(e); }
    return null;
  }

  // ---- the turns
  /** «¡Jugar!»: your boxes are played in order, then the turn goes to the rival */
  async function playTurn() {
    if (busy || !planning) return;
    const T = lesson();
    if (tutorial && !tutorialAllows(plan, T, { do: 'end' })) { sfx('error'); pulse($('.dm-bubble'), 'nope', 500); return; }
    busy = true; planning = false; picked = null; hoverCard = null;
    const list = queue;
    queue = [];
    if (tutorial && T?.expect.do === 'end') step++;
    playing = { side: 0, list, now: 0 };
    render();
    sfx('click');
    for (let i = 0; i < list.length && s.winner < 0 && !closed; i++) {
      playing.now = i;
      render();
      if (list[i].a.do === 'move') { act(s, 0, list[i].a); await wait(150); continue; }
      await wait(250);
      await run(0, list[i].a);
    }
    playing = null;
    plan = s;
    if (s.winner < 0 && !closed) await run(0, { do: 'end' });
    await rivalTurn();
  }
  /** the rival lines up its actions (they are worked out on a copy), its boxes fill up, then they are played */
  async function rivalTurn() {
    while (!closed && s.active === 1 && s.winner < 0) {
      const sim = cloneDuel(s), list: Queued[] = [];
      for (let k = 0; k < 12 && sim.active === 1 && sim.winner < 0; k++) {
        const a = cpuAction(sim, level, roll);
        if (a.do === 'end') break;
        const card = a.do === 'swap' ? undefined : sim.sides[1].hand.find((c) => c.id === a.card);
        if (act(sim, 1, a)) break;
        if (card) list.push({ a, card: structuredClone(card) }); else if (a.do === 'swap') list.push({ a, card: { id: -1, owner: a.bench, idx: 0, rank: 1 } });
      }
      playing = { side: 1, list: [], now: -1 };
      render();
      for (const q of list) { await wait(260); playing.list.push(q); sfx('click', 0.8); render(); }
      await wait(450);
      for (let i = 0; i < list.length && s.winner < 0 && !closed; i++) {
        playing.now = i;
        render();
        if (list[i].a.do === 'move') { act(s, 1, list[i].a); await wait(120); continue; }
        await wait(220);
        await run(1, list[i].a);
      }
      playing = null;
      if (s.winner < 0 && !closed) await run(1, { do: 'end' });
    }
    busy = false;
    if (s.winner >= 0) { render(); void finish(); return; }
    startPlanning();
    render();
  }
  /** lines up an action of yours (refused if the lesson asks for another) */
  async function plan_(a: Action) {
    if (busy || !planning) return false;
    const T = lesson();
    if (tutorial && a.do === 'use' && a.target === undefined && T?.expect.do === 'use') {
      // «Usar» in a lesson aims where the lesson says (or, with no target, like the lesson was tested)
      a = { ...a, target: tutorialTarget(plan, T)?.uid ?? (T.expect.target === undefined ? onPitch(plan.sides[0])[0]?.uid : undefined) };
    }
    if (tutorial && !tutorialAllows(plan, T, a)) { sfx('error'); pulse($('.dm-bubble'), 'nope', 500); return false; }
    let why = illegal(plan, 0, a);
    if (why === 'bad_target' && a.do === 'use') { a = { ...a, target: undefined }; why = illegal(plan, 0, a); }
    if (why) { sfx('error'); banner(why === 'stunned' ? tr('Aturdido') : why === 'no_actions' ? tr('No te quedan acciones') : why === 'sealed' ? tr('Sellada') : tr('No se puede'), 'note', 900); return false; }
    const card = plan.sides[0].hand.find((c) => c.id === (a as { card: number }).card)!;
    const fromEl = stage.querySelector<HTMLElement>(`.dm-hand .dm-hc[data-cid="${card.id}"]`);
    const fromRect = fromEl?.getBoundingClientRect();
    const n = plan.log.length, snap = snapHand();
    act(plan, 0, a);
    queue.push({ a, card: structuredClone(card) });
    if (tutorial && T && T.expect.do !== 'free') step++;
    picked = null;
    render();
    // the card flies to its box
    const box = stage.querySelector<HTMLElement>(`.dm-q .dm-box[data-q="${queue.length - 1}"]`);
    if (a.do === 'use' && fromRect && box) {
      const r = box.getBoundingClientRect();
      box.animate([{ translate: `${fromRect.left - r.left}px ${fromRect.top - r.top}px`, scale: String(fromRect.width / r.width) }, { translate: '0 0', scale: '1' }], { duration: 380, easing: 'cubic-bezier(.2,1.2,.4,1)' });
      sfx('whoosh', 1.3);
    }
    await flipHand(snap, plan.log.slice(n), a.do === 'use' ? card.id : undefined);
    return true;
  }
  /** paper of the four elements rains over the table */
  function confetti() {
    const cols = ['#ff7a2a', '#5ad8ff', '#7dff6a', '#ffc35a', '#fff3b0', '#ff5ad1'];
    for (let i = 0; i < 90; i++) {
      const d = document.createElement('i');
      d.className = 'dm-conf';
      d.style.cssText = `left:${Math.random() * 100}%;--c:${cols[i % cols.length]};--x:${(Math.random() - 0.5) * 18 * U()}px;--r:${(Math.random() - 0.5) * 1440}deg;--t:${1.8 + Math.random() * 1.6}s;animation-delay:${Math.random() * 0.9}s;--s:${0.6 + Math.random() * 0.8}`;
      stage.appendChild(d);
      window.setTimeout(() => d.remove(), 4600);
    }
  }
  async function finish() {
    await wait(900);
    if (closed) return;
    const won = s.winner === 0;
    sfx(won ? 'legend' : 'hurt');
    const end = document.createElement('div');
    end.className = `dm-result ${won ? 'won' : 'lost'}`;
    end.innerHTML = `<div><h2>${won ? tr('¡Victoria!') : tr('Derrota')}</h2>${tutorial && won ? `<p><b>${tr('¡Tutorial completado!')}</b>${tr('Ya conoces lo básico del Modo Duelo.')}</p>` : ''}<p class="dm-prize"></p><button type="button">${tr('Continuar')}</button></div>`;
    stage.appendChild(end);
    if (won) confetti(); else stage.classList.add('lost');
    for (const u of s.sides[won ? 0 : 1].units) if (u.hp > 0) unitEl(u.uid)?.classList.add('cheer');
    crowdFlash(won ? 18 : 4);
    // what it pays (the server answers for a win against the CPU)
    const mine = s.log.filter((e) => ('side' in e && e.side === 0));
    const stats: DuelSummary = { merges: mine.filter((e) => e.t === 'merge').length, combos: mine.filter((e) => e.t === 'combo').length, ultis: mine.filter((e) => e.t === 'use' && e.card.idx === 'u').length };
    const prize = end.querySelector<HTMLElement>('.dm-prize')!;
    if (host.reward) {
      prize.textContent = '…';
      void host.reward(won, tutorial, stats).then((r) => {
        if (!r || (!r.coins && !r.note)) { prize.remove(); return; }
        prize.innerHTML = r.coins ? `<b class="coins">+0 ◉</b>${r.note ? `<small>${esc(r.note)}</small>` : ''}` : `<small>${esc(r.note!)}</small>`;
        if (r.coins) {
          // the coins count up, with a shower of gold
          sfx('buy'); prize.classList.add('paid');
          const b = prize.querySelector('b')!, t0 = performance.now(), total = r.coins;
          const tick = (t: number) => {
            const q = Math.min(1, (t - t0) / 1100);
            b.textContent = `+${Math.round(total * (1 - (1 - q) ** 3)).toLocaleString()} ◉`;
            if (q < 1) requestAnimationFrame(tick); else { pulse(b, 'done', 600); sfx('levelup'); }
          };
          requestAnimationFrame(tick);
          const pr = prize.getBoundingClientRect(), sr = stage.getBoundingClientRect();
          particlesAt({ x: ((pr.left + pr.width / 2 - sr.left) / sr.width) * 100, y: ((pr.top + pr.height / 2 - sr.top) / sr.height) * 100 }, 'star', '#ffd23a', 24);
        }
      }, () => prize.remove());
    } else prize.remove();
    end.querySelector('button')!.addEventListener('click', () => { sfx('click'); close(); host.done?.(won, tutorial); });
  }

  // ---- aiming and dragging
  // the arrow (Hearthstone's): chevrons that flow along a curve from the card, bigger towards the head; it turns gold and
  // snaps onto the target under the pointer, with a sight around it
  const aimSvg = stage.querySelector<SVGSVGElement>('.dm-aim')!;
  const aimDots = [...aimSvg.querySelectorAll<SVGPathElement>('.dm-aim-dots path')], aimHead = aimSvg.querySelector<SVGPathElement>('.dm-aim-head')!;
  const aimRing = aimSvg.querySelector<SVGGElement>('.dm-aim-ring')!, aimTrail = aimSvg.querySelector<SVGPathElement>('.dm-aim-trail')!;
  const aimBody = aimSvg.querySelector<SVGPathElement>('.dm-aim-body')!, aimGrad = aimSvg.querySelector<SVGLinearGradientElement>('#dmAimBody')!;
  const aimAt = { x0: 0, y0: 0, cx: 0, cy: 0, x1: 0, y1: 0, on: false, raf: 0, phase: 0, t: 0 };
  const bez = (t: number) => {
    const { x0, y0, cx, cy, x1, y1 } = aimAt, u = 1 - t;
    return { x: u * u * x0 + 2 * u * t * cx + t * t * x1, y: u * u * y0 + 2 * u * t * cy + t * t * y1, dx: 2 * u * (cx - x0) + 2 * t * (x1 - cx), dy: 2 * u * (cy - y0) + 2 * t * (y1 - cy) };
  };
  function drawArrow(now: number) {
    if (!aimAt.on) { aimAt.raf = 0; return; }
    aimAt.phase = (aimAt.phase + (now - (aimAt.t || now)) / 260) % 1;
    aimAt.t = now;
    const k = U();
    // the body: one ribbon that widens towards the head
    const left: string[] = [], right: string[] = [];
    for (let i = 0; i <= 28; i++) {
      const t = (i / 28) * 0.9, p = bez(t), l = Math.hypot(p.dx, p.dy) || 1, hw = k * (0.24 + 0.95 * t);
      const nx = -p.dy / l * hw, ny = p.dx / l * hw;
      left.push(`${(p.x + nx).toFixed(1)} ${(p.y + ny).toFixed(1)}`);
      right.unshift(`${(p.x - nx).toFixed(1)} ${(p.y - ny).toFixed(1)}`);
    }
    aimBody.setAttribute('d', `M${left.join('L')}L${right.join('L')}Z`);
    aimGrad.setAttribute('x1', String(aimAt.x0)); aimGrad.setAttribute('y1', String(aimAt.y0));
    aimGrad.setAttribute('x2', String(aimAt.x1)); aimGrad.setAttribute('y2', String(aimAt.y1));
    // light flowing along it
    aimDots.forEach((d, i) => {
      const t = 0.1 + ((i + aimAt.phase) / AIM_N) * 0.8, p = bez(t), sz = k * (0.2 + t * 0.5);
      d.setAttribute('transform', `translate(${p.x} ${p.y}) rotate(${Math.atan2(p.dy, p.dx) * 180 / Math.PI}) scale(${sz})`);
      d.style.opacity = String(Math.min(1, (t - 0.1) * 5) * 0.8);
    });
    const h = bez(1), hs = k * 1.8;
    // the tip of the head (1.15 of its size ahead of its centre) is what touches the end point
    const ang = Math.atan2(h.dy, h.dx), hx = h.x - Math.cos(ang) * 1.15 * hs, hy = h.y - Math.sin(ang) * 1.15 * hs;
    aimHead.setAttribute('transform', `translate(${hx} ${hy}) rotate(${ang * 180 / Math.PI}) scale(${hs})`);
    aimRing.setAttribute('transform', `translate(${aimAt.x1} ${aimAt.y1}) scale(${k * 3.4}) rotate(${now / 8 % 360})`);
    aimAt.raf = requestAnimationFrame(drawArrow);
  }
  /** the arrow from a card to a point (it snaps to the target under the pointer) */
  function arrow(cel: HTMLElement | null, x: number, y: number, to: Side | null) {
    const target = (document.elementFromPoint(x, y) as HTMLElement | null)?.closest<HTMLElement>('.dm-unit.aim');
    for (const el of stage.querySelectorAll('.dm-unit.lock')) if (el !== target) el.classList.remove('lock');
    if (target && !target.classList.contains('lock')) { target.classList.add('lock'); sfx('hover'); }
    const off = () => { aimAt.on = false; aimAt.on = false; aimSvg.classList.remove('on'); };
    if (!cel || to === null) return off();
    const sr = stage.getBoundingClientRect(), r = cel.getBoundingClientRect();
    aimSvg.setAttribute('viewBox', `0 0 ${sr.width} ${sr.height}`);
    let x1 = x - sr.left, y1 = y - sr.top;
    if (target) { const t = (target.querySelector('.dm-life') ?? target).getBoundingClientRect(); x1 = t.left + t.width / 2 - sr.left; y1 = t.bottom + U() * 0.3 - sr.top; }
    const x0 = r.left + r.width / 2 - sr.left, y0 = r.top + r.height * 0.2 - sr.top;
    if (y1 > y0 - 10) return off();
    // the control point below the target: the arrow rises from the card and arrives from underneath, never over the top
    Object.assign(aimAt, { x0, y0, x1, y1, cx: x0 + (x1 - x0) * 0.1, cy: (y0 + y1) / 2 });
    aimTrail.setAttribute('d', `M${x0} ${y0} Q${aimAt.cx} ${aimAt.cy} ${x1} ${y1}`);
    aimSvg.classList.toggle('ally', to === 0);
    aimSvg.classList.toggle('locked', !!target);
    aimSvg.classList.add('on');
    aimAt.on = true;
    if (!aimAt.raf) { aimAt.t = 0; aimAt.raf = requestAnimationFrame(drawArrow); }
  }
  let sway = 0, lastX = 0;
  let drag: { id: number; el: HTMLElement; x0: number; y0: number; moved: boolean; mode: 'hand' | 'aim' | 'play' | null; to: number; centers: number[]; preview: string } | null = null;
  let suppressClick = false;
  stage.addEventListener('pointerdown', (e) => {
    const hc = (e.target as HTMLElement).closest<HTMLElement>('.dm-hand .dm-hc');
    if (!hc || busy || !planning || e.button > 0) return;
    const cards = [...stage.querySelectorAll<HTMLElement>('.dm-hand .dm-hc')];
    drag = { id: Number(hc.dataset.cid), el: hc, x0: e.clientX, y0: e.clientY, moved: false, mode: null, to: cards.indexOf(hc), centers: cards.map((c) => { const r = c.getBoundingClientRect(); return r.left + r.width / 2; }), preview: '' };
    hc.setPointerCapture(e.pointerId);
  });
  stage.addEventListener('pointermove', (e) => {
    if (!drag) {
      // the card under the pointer leans towards it (and its shine follows)
      const hov = (e.target as HTMLElement).closest<HTMLElement>('.dm-hand .dm-hc');
      if (hov) {
        const r = hov.getBoundingClientRect(), fx = (e.clientX - r.left) / r.width - 0.5, fy = (e.clientY - r.top) / r.height - 0.5;
        hov.style.setProperty('--tx', `${fx * 22}deg`); hov.style.setProperty('--ty', `${-fy * 16}deg`); hov.style.setProperty('--mx', `${(fx + 0.5) * 100}%`);
      }
      // a picked card (tapped) aims at the pointer
      const pc = picked !== null && planning && !busy ? plan.sides[0].hand.find((c) => c.id === picked) : undefined;
      arrow(pc ? stage.querySelector<HTMLElement>(`.dm-hand .dm-hc[data-cid="${pc.id}"]`) : null, e.clientX, e.clientY, pc ? aimSide(pc, unit(plan, pc.owner)) : null);
      return;
    }
    const dx = e.clientX - drag.x0, dy = e.clientY - drag.y0;
    if (!drag.moved && Math.hypot(dx, dy) < 8) return;
    if (!drag.moved) { drag.moved = true; picked = drag.id; hoverCard = null; stage.classList.add('dragging'); stage.querySelector('.dm-bar')?.remove(); markTargets(drag.id); info(); sfx('click', 1.2); }
    const card = plan.sides[0].hand.find((c) => c.id === drag!.id)!;
    const to = aimSide(card, unit(plan, card.owner));
    const trayTop = $('.dm-tray').getBoundingClientRect().top;
    const inHand = e.clientY > trayTop;
    drag.mode = inHand ? 'hand' : to !== null ? 'aim' : 'play';
    drag.el.classList.toggle('drag', drag.mode !== 'aim');
    drag.el.classList.toggle('aimfrom', drag.mode === 'aim');
    stage.classList.toggle('drop-play', drag.mode === 'play');
    if (drag.mode === 'aim') { drag.el.style.translate = ''; arrow(drag.el, e.clientX, e.clientY, to); }
    else {
      drag.el.style.translate = `${dx}px ${dy}px`; arrow(null, e.clientX, e.clientY, null);
      // it sways with the movement, like a card held by a corner
      sway = sway * 0.7 + Math.max(-16, Math.min(16, (e.clientX - lastX) * 0.9)) * 0.3;
      drag.el.style.rotate = `${sway}deg`;
    }
    lastX = e.clientX;
    // among the other cards: where it would go, the others make room, and whether it would fuse there
    const cards = [...stage.querySelectorAll<HTMLElement>('.dm-hand .dm-hc')], from = cards.indexOf(drag.el);
    const spacing = drag.centers.length > 1 ? (drag.centers[drag.centers.length - 1] - drag.centers[0]) / (drag.centers.length - 1) : 0;
    let place = drag.centers.filter((c, i) => i !== from && c < e.clientX).length;
    if (!inHand) place = from;
    if (place !== drag.to) {
      drag.to = place;
      let k = 0;
      cards.forEach((c, i) => { if (i === from) return; const pos = k < place ? k : k + 1; c.style.translate = `${(pos - i) * spacing}px 0`; k++; });
      for (const c of stage.querySelectorAll('.dm-hand .fusing')) c.classList.remove('fusing');
      drag.preview = '';
      if (place !== from) {
        const sim = cloneDuel(plan), n = sim.log.length;
        if (!act(sim, 0, { do: 'move', card: drag.id, to: place })) {
          const evs = sim.log.slice(n), mg = evs.find((x) => x.t === 'merge'), cb = evs.find((x) => x.t === 'combo');
          if (cb && cb.t === 'combo') drag.preview = `${tr('¡Combinada!')} ${cardTech(cb.name)}`;
          else if (mg && mg.t === 'merge') { drag.preview = `${tr('¡Fusión!')} ${'★'.repeat(mg.rank)}`; stage.querySelector(`.dm-hand .dm-hc[data-cid="${mg.card}"]`)?.classList.add('fusing'); }
        }
      }
      drag.el.dataset.preview = drag.preview;
      drag.el.classList.toggle('willfuse', !!drag.preview);
    }
  });
  const endDrag = async (e: PointerEvent) => {
    const d = drag;
    drag = null;
    if (!d) return;
    stage.classList.remove('dragging', 'drop-play');
    aimAt.on = false; aimSvg.classList.remove('on');
    if (!d.moved) return;
    suppressClick = true;
    window.setTimeout(() => { suppressClick = false; }, 50);
    const target = (document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null)?.closest<HTMLElement>('.dm-unit.aim');
    const cards = [...stage.querySelectorAll<HTMLElement>('.dm-hand .dm-hc')], from = cards.indexOf(d.el);
    picked = null;
    let done = false;
    if (d.mode === 'aim' && target) done = await plan_({ do: 'use', card: d.id, target: Number(target.dataset.uid) });
    else if (d.mode === 'play') done = await plan_({ do: 'use', card: d.id });
    else if (d.mode === 'hand' && d.to !== from) done = await plan_({ do: 'move', card: d.id, to: d.to });
    if (!done) render();
  };
  stage.addEventListener('pointerup', (e) => { void endDrag(e); });
  stage.addEventListener('pointercancel', () => { drag = null; stage.classList.remove('dragging', 'drop-play'); render(); });
  // what a card does, under the pointer
  stage.addEventListener('pointerover', (e) => {
    if (drag || (e as PointerEvent).pointerType === 'touch') return;
    const t = e.target as HTMLElement;
    const hc = t.closest<HTMLElement>('.dm-hand .dm-hc, .dm-box');
    const cid = hc ? Number(hc.dataset.cid ?? hc.querySelector<HTMLElement>('.dm-hc')?.dataset.cid) : null;
    const ue = t.closest<HTMLElement>('.dm-unit');
    const uid = ue ? Number(ue.dataset.uid) : null;
    if (cid !== hoverCard || uid !== hoverUnit) { hoverCard = Number.isFinite(cid) ? cid : null; hoverUnit = uid; info(); }
  });
  stage.addEventListener('pointerleave', () => { hoverCard = null; hoverUnit = null; info(); });

  // ---- taps
  stage.addEventListener('click', (e) => {
    if (suppressClick) return;
    const t = e.target as HTMLElement;
    if (busy || !planning) return;
    const bar = t.closest('.dm-bar button') as HTMLButtonElement | null;
    if (bar && picked !== null) {
      e.stopPropagation();
      const i = plan.sides[0].hand.findIndex((c) => c.id === picked);
      if (bar.dataset.use !== undefined) void plan_({ do: 'use', card: picked });
      else void plan_({ do: 'move', card: picked, to: i + Number(bar.dataset.mv) });
      return;
    }
    const box = t.closest<HTMLElement>('.dm-q .dm-box[data-q]');
    if (box) {
      // a box tapped gives its action back (not in the tutorial, whose lessons go in order)
      if (tutorial) { sfx('error'); return; }
      const snap = snapHand();
      queue.splice(Number(box.dataset.q), 1);
      replan();
      sfx('click', 0.8);
      render();
      void flipHand(snap, []);
      return;
    }
    const hc = t.closest<HTMLElement>('.dm-hand .dm-hc');
    if (hc) { sfx('click'); benchPick = null; picked = picked === Number(hc.dataset.cid) ? null : Number(hc.dataset.cid); render(); return; }
    const ue = t.closest<HTMLElement>('.dm-unit');
    if (ue) {
      const u = unit(s, Number(ue.dataset.uid));
      if (picked !== null) { if (ue.classList.contains('aim')) void plan_({ do: 'use', card: picked, target: u.uid }); return; }
      if (u.side === 0 && u.slot === 3) { sfx('click'); benchPick = benchPick === u.uid ? null : u.uid; render(); return; }
      if (benchPick !== null && u.side === 0 && u.slot <= 2) { const b = benchPick; benchPick = null; void plan_({ do: 'swap', bench: b, out: u.uid }); return; }
      return;
    }
    if (t.closest('.dm-play')) { void playTurn(); return; }
    if (picked !== null || benchPick !== null) { picked = null; benchPick = null; render(); }
  });

  // ---- go
  layout();
  if (s.active === 0) startPlanning();
  render();
  sfx('reveal');
  banner(tutorial ? tr('Tutorial') : s.active === 0 ? tr('Tu turno') : tr('Turno rival'), 'turn s0', 1200);
  if (s.active === 1) { busy = true; void rivalTurn(); }
  return { state: s, close };
}

/** where things are on the footballer frame (% of it), from the author's frames */
const FR = { portW: 54, orbX: 24.8, orbStep: 10.5 };
