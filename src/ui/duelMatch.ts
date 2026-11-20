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
import { elementSfx, iceBreakSfx, orbSfx, sfx, ultiReadySfx } from '../game/sfx';
import { setMusicContext } from '../game/music';
import { COACH_BY_ID } from '../data/coaches';
import { artUrl } from './duelArt';
import { elementIcon } from './elements';
import { cardInfo, coachText, passiveText, pctOf } from './duelText';
import { LOW_FX } from '../systems/perf';
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
  /** a player's plate: profile icon in its frame and the name on its banner. Side 0 is you; side 1 only online ('' or
   *  nothing: the match draws the CPU's, with its coach) */
  plate?(side: Side): string;
  /** what the match pays (asked when it ends; the result shows it): coins, or why there are none */
  reward?(won: boolean, tutorial: boolean, stats: DuelSummary): Promise<{ coins: number; note?: string } | null>;
}
/** what you did in a match, for the missions */
export interface DuelSummary { merges: number; combos: number; ultis: number; turns: number }
export type DuelSetup = { tutorial: true } | { tutorial?: false; teams: [TeamCfg, TeamCfg]; level: CpuLevel; seed?: number; first?: Side; remote?: DuelRemote;
  /** a chapter of the story mode (duelStory.ts): the rival's team name on its plate; a boss's footballers glow */
  story?: { rival: string } };
/** an online rival instead of the CPU (src/ui/duelOnline.ts): your turns go to it, its turns come from it, both already
 *  seen from your side (you are side 0 on your engine and on theirs they are) */
export interface DuelRemote {
  /** the rival's plate (html) */
  plate: string;
  /** your turn's actions, sent as soon as you play them */
  send(actions: Action[]): void;
  /** the rival's next turn; null when the rival is gone (left or out of time for too long: you win) */
  next(): Promise<Action[] | null>;
  /** the match is over (won: yours) */
  end(won: boolean): void;
  /** you leave a live match: it counts as surrendering */
  surrender(): void;
}
/** seconds for a turn online (author: «importante lo del timer»): when they run out, what you lined up is played */
export const TURN_SECONDS = 60;

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
const img = (file: string, cls = '') => `<img class="${cls}" src="${artUrl(file)}" alt="" draggable="false">`;
/** a number in the match's own style (thick type with an outline; the colour by where it goes) */
export function setDuelDigits(_d?: unknown) { /* the original pixel digits were tried and dropped: text reads better */ }
function izNum(n: number | string, color: 'naranja' | 'morado' = 'naranja', cls = '') {
  return `<span class="iz-num c-${color} ${cls}">${n}</span>`;
}
const lifeColor = (k: number) => (k > 0.5 ? '#4be36a' : k > 0.25 ? '#ffc93a' : '#ff4848');
/** ×1 / ×2 (author: «es un poco pesado de jugar, ha de tener flow»): the player's choice, kept in this browser. At ×2
 * every pause of the match is halved and the one-shot animations playing then run twice as fast (the looping ones,
 * the idle sway and the auras, keep their pace) */
let speed = 1;
try { speed = localStorage.getItem('iz-duel-speed') === '2' ? 2 : 1; } catch { /* no storage: ×1 */ }
function hurry() {
  for (const a of document.getAnimations()) if (a.playbackRate !== speed && (a.effect as KeyframeEffect | null)?.getTiming().iterations !== Infinity) a.playbackRate = speed;
}
const wait = (ms: number) => { if (speed !== 1) hurry(); return new Promise<void>((r) => window.setTimeout(r, ms / speed)); };
const EL_FX: Record<string, string> = { Fuego: '#ff7a2a', Aire: '#5ad8ff', Bosque: '#7dff6a', Montaña: '#ffc35a' };

/** where everything is on each table (% of the stage); unit widths in cqw */
interface Layout {
  board: string; v: boolean; slots: Record<Side, [number, number][]>; coach: Record<Side, [number, number]>; unitW: Record<Side, number>;
  center: [number, number]; queue: [number, number]; rqueue: [number, number]; plate: Record<Side, [number, number] | null>; play: [number, number]; bubble: [number, number]; info: [number, number]; cast: Record<Side, [number, number]>;
}
const LAYOUTS: Record<'h' | 'v', Layout> = {
  h: {
    board: 'mesa-horizontal', v: false,
    // the rival a little lower and smaller: their cards were touching the top edge (author: «el límite arriba se ve muy pegado»)
    slots: { 0: [[30.5, 53], [50.5, 53], [71.5, 53], [91, 53.5]], 1: [[34, 28], [50, 28], [66.5, 28], [81, 28.5]] },
    coach: { 0: [10, 45], 1: [18.5, 20] }, unitW: { 0: 11.5, 1: 8.8 },
    center: [5, 9], queue: [18.5, 83.5], rqueue: [75, 6.5], plate: { 0: [19.5, 5.5], 1: [89, 5.5] }, play: [84, 83.5], bubble: [2.5, 59], info: [79, 12], cast: { 0: [10.5, 50], 1: [89.5, 46] },
  },
  v: {
    board: 'mesa-vertical', v: true,
    slots: { 0: [[26, 57], [50, 57], [74, 57], [92.5, 54]], 1: [[27, 29], [50, 29], [73, 29], [91, 21]] },
    coach: { 0: [7.5, 49], 1: [8.5, 21] }, unitW: { 0: 22, 1: 18 },
    center: [50, 43], queue: [26, 73.5], rqueue: [80, 12.5], plate: { 0: null, 1: [27, 4.5] }, play: [79, 73.5], bubble: [3, 63], info: [50, 42], cast: { 0: [24, 9], 1: [76, 9] },
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
  const s: DuelState = setup.tutorial ? createTutorial(host.byId) : createDuel(setup.teams, setup.seed ?? (Math.random() * 2 ** 31) | 0, setup.first ?? (Math.random() < 0.5 ? 0 : 1));
  const level: CpuLevel = setup.tutorial ? 'facil' : setup.level;
  const remote = setup.tutorial ? undefined : setup.remote;
  const story = setup.tutorial ? undefined : setup.story;
  const boss = !setup.tutorial && !!setup.teams[1].boss;
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
  function startPlanning() { plan = cloneDuel(s); queue = []; planning = s.active === 0 && s.winner < 0; if (remote && planning) clock(TURN_SECONDS); }
  // the turn's clock online: shown at the top, it plays what you lined up when it runs out
  let deadline = 0, clockTimer = 0;
  function clock(secs: number) {
    deadline = performance.now() + secs * 1000;
    window.clearInterval(clockTimer);
    const el = root.querySelector<HTMLElement>('.dm-clock')!;
    el.hidden = false;
    const tick = () => {
      if (closed) { window.clearInterval(clockTimer); return; }
      const left = Math.max(0, Math.ceil((deadline - performance.now()) / 1000)), mineNow = s.active === 0;
      el.innerHTML = `<b>${left}</b><small>${mineNow ? tr('Tu turno') : tr('Turno rival')}</small>`;
      el.classList.toggle('rival', !mineNow);
      el.classList.toggle('low', mineNow && left <= 10);
      el.style.setProperty('--k', String(left / secs));
      if (mineNow && left === 0 && planning && !busy) void playTurn();
    };
    tick();
    clockTimer = window.setInterval(tick, 250);
  }
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
  root.innerHTML = `<style>${CSS_TEXT}</style><img class="dm-bg" alt="" draggable="false"><aside class="dm-side l"></aside><aside class="dm-side r"></aside><div class="dm-stage"><div class="dm-cam"><img class="dm-table" alt="" draggable="false"><i class="dm-spot a"></i><i class="dm-spot b"></i>
    <div class="dm-coaches"></div><div class="dm-center"></div><div class="dm-units"></div><div class="dm-fx cam"></div></div>
    <div class="dm-rq"></div><div class="dm-plate s0"></div><div class="dm-plate s1"></div><div class="dm-speed"></div>
    <svg class="dm-aim"><defs><linearGradient id="dmAimBody" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="var(--ac)" stop-opacity="0"/><stop offset=".25" stop-color="var(--ac)" stop-opacity=".85"/><stop offset="1" stop-color="var(--ac)"/></linearGradient></defs><path class="dm-aim-trail"/><path class="dm-aim-body"/><g class="dm-aim-dots">${'<path vector-effect="non-scaling-stroke" d="M-.7 -1L.6 0L-.7 1L-.25 0Z"/>'.repeat(AIM_N)}</g><g class="dm-aim-ring"><circle r="1"/><path d="M0 -1.45V-.75M0 1.45V.75M-1.45 0H-.75M1.45 0H.75"/></g><path class="dm-aim-head" vector-effect="non-scaling-stroke" d="M1.15 0L-.85 -1.05L-.35 0L-.85 1.05Z"/></svg>
    <div class="dm-tray"><div class="dm-hand"></div></div><svg class="dm-links"></svg><div class="dm-q"></div>
    <button class="dm-play" type="button">${img('boton-turno')}<span></span></button>
    <div class="dm-bubble" hidden></div><div class="dm-info" hidden></div><div class="dm-fx"></div><div class="dm-banner"></div></div>
    <button class="dm-x" type="button" aria-label="${tr('Salir')}">✕</button><button class="dm-spd" type="button" aria-label="${tr('Velocidad')}">×${speed}</button><div class="dm-clock" hidden></div>`;
  document.body.appendChild(root);
  const stage = root.querySelector<HTMLElement>('.dm-stage')!;
  const $ = <T extends HTMLElement>(q: string) => stage.querySelector<T>(q)!;
  let hoverCoach: Side | null = null;
  let busy = false, picked: number | null = null, benchPick: number | null = null, closed = false, hoverCard: number | null = null, hoverUnit: number | null = null;
  let seenCards = new Set<number>();
  let L: Layout = LAYOUTS.h;
  /** PV as shown while the events of an action play (the state already has the final ones) */
  const hpView = new Map<number, number>();
  /** when the opening's drop began (its phase survives redraws) */
  let introAt = 0;
  /** the Garra each footballer had when last drawn (the new orbs pop) */
  const gaugeSeen = new Map<number, number>();
  /** the orbs lit on each footballer's card right now (the new ones light up as their orb arrives) */
  const orbShown = new Map<number, number>();
  /** where the orbs a footballer is about to get fly from: the card of his you just moved or used */
  const orbFrom = new Map<number, DOMRect>();

  // the duel has its own theme (IE2's M201); leaving puts the menu's back
  setMusicContext('duel');
  const close = () => { setMusicContext('menu'); closed = true; window.clearInterval(flashTimer); root.remove(); window.removeEventListener('resize', onResize); };
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
  root.querySelector('.dm-spd')!.addEventListener('click', (e) => {
    speed = speed === 1 ? 2 : 1;
    try { localStorage.setItem('iz-duel-speed', String(speed)); } catch { /* ×1 next time */ }
    (e.currentTarget as HTMLElement).textContent = `×${speed}`;
    (e.currentTarget as HTMLElement).classList.toggle('on', speed > 1);
    sfx('click');
  });
  root.querySelector('.dm-spd')!.classList.toggle('on', speed > 1);
  root.querySelector('.dm-x')!.addEventListener('click', () => { sfx('click'); if (remote && s.winner < 0) remote.surrender(); close(); host.done?.(false, tutorial); });
  /** the CPU's plate: its coach's portrait and «CPU · level» (the tutorial's rival is the Royal Academy for practice) */
  function cpuPlate() {
    if (remote) return remote.plate;
    const id = s.sides[1].coach, art = id ? host.coachArt(id) : '';
    const lv = story ? story.rival : tutorial ? 'Royal Academy' : ({ facil: tr('Fácil'), normal: tr('Normal'), dificil: tr('Difícil') } as Record<string, string>)[level] ?? level;
    return `<span class="dmp-ic cpu">${art ? `<img src="${art}" alt="" draggable="false">` : story ? host.mug(s.sides[1].units[0].pid, 38) : '🤖'}</span><span class="dmp-tx"><b class="dmp-name"><span>${'CPU'}</span></b><small>${esc(lv)}</small></span>`;
  }
  function plates() {
    for (const side of [0, 1] as Side[]) {
      const el = $(`.dm-plate.s${side}`), at_ = L.plate[side];
      el.hidden = !at_;
      if (!at_) continue;
      el.style.cssText = `left:${at_[0]}%;top:${at_[1]}%`;
      if (!el.innerHTML) el.innerHTML = host.plate?.(side) || (side === 1 ? cpuPlate() : '');
    }
  }
  function layout() {
    const v = window.innerWidth / window.innerHeight < 0.9;
    L = LAYOUTS[v ? 'v' : 'h'];
    stage.classList.toggle('v', v);
    plates();
    const t = $<HTMLImageElement>('.dm-table');
    if (!t.src.includes(L.board)) { t.src = artUrl(L.board); root.querySelector<HTMLImageElement>('.dm-bg')!.src = artUrl(L.board); }
  }
  const onResize = () => { layout(); render(); };
  window.addEventListener('resize', onResize);

  // ---- drawing
  const px = (cqw: number) => Math.max(8, Math.round(stage.clientWidth * cqw / 100));
  /** the stage's own unit (1cqw wide, more on the tall table) in px */
  const U = () => stage.clientWidth / 100 * (L.v ? 1.8 : 1);
  /** where a footballer stands on the table: yours, where your lined-up swaps leave them; the rivals, where they are
   *  (what your plan does to them is not shown before it is played, author: «se sigue viendo el daño que hago y si lo
   *  dejo KO, eso no lo quiero ver»). -1: not drawn */
  const slotView = (u: Unit): number => (planning && queue.length && u.side === 0 ? unit(plan, u.uid).slot : u.slot);
  /** the Garra shown: while you plan, what your fusions and cards have charged already (author: «deberían subir orbes
   *  por cada juntada, aunque se junten solas») */
  const gaugeOf = (u: Unit) => (planning || playing?.side === 0 ? unit(plan, u.uid).gauge : u.gauge); // (and while your plan plays: it is that)
  function unitHtml(u: Unit) {
    const side = u.side, slot = slotView(u), bench = slot === 3, [x, y] = L.slots[side][slot], incoming = slot !== u.slot && u.slot === 3;
    const w = L.unitW[side] * (bench ? 0.72 : 1);
    const hp = hpView.get(u.uid) ?? Math.max(0, u.hp), k = hp / u.maxHp;
    // while you plan: what your lined-up actions leave him with (the plan is the match itself, played on a copy)
    const st = Object.entries(u.status).filter(([, n]) => n).map(([id, n]) => `<span class="dm-st" title="${esc(STATUS_NAME()[id] ?? id)}">${img(STATUS_FILE[id])}<b>${n}</b></span>`).join('')
      + (u.shield > 0 ? `<span class="dm-st">${img('estado-escudo')}<b>${u.shield}</b></span>` : '')
      + (u.stances.length ? `<span class="dm-st">${img('tipo-postura')}</span>` : '');
    // the orbs are lit afterwards, in place (paintOrbs): in the markup, each new orb drew his whole card anew and it blinked
    const gauge = Array.from({ length: GAUGE_MAX }, (_, i) => `<span class="dm-g" style="left:${FR.orbX + i * FR.orbStep}%">${img('garra-vacio')}</span>`).join('');
    const name = host.name(u.pid);
    const sts = Object.entries(u.status).filter(([, n]) => n).map(([id]) => ` st-${id}`).join('')
      + [...new Set(u.stances.map((x) => ` ps-${x.kind}`))].join('') + (u.shield > 0 ? ' sh' : '');
    return `<div class="dm-unit s${side}${bench ? ' bench' : ''}${boss && side === 1 ? ' boss' : ''}${incoming ? ' incoming' : ''}${sts}" data-uid="${u.uid}" style="left:${x}%;top:${y}%;--w:${w}cqw;--i:${(u.uid * 0.37) % 1}">
      <div class="dm-sts">${st}</div>
      <div class="dm-card">
        <span class="dm-tring"></span>${/st-/.test(sts) ? '<span class="dm-stfx"><i></i><i></i><i></i></span>' : ''}<div class="dm-port">${host.mug(u.pid, px(w * FR.portW / 100))}</div>
        ${img(FRAME[host.rarity(u.pid)] ?? 'marco-legendario', 'dm-frame')}
        <span class="dm-el" title="${esc(tr(u.element))}">${elementIcon(u.element, px(w * 0.12))}</span>
        ${gauge}
        <span class="dm-nm" style="--n:${Math.max(6, name.length)}">${esc(name)}</span>
        <span class="dm-hpn" style="--d:${String(Math.round(hp)).length}">${izNum(Math.round(hp))}</span><span class="dm-atk" style="--d:${String(u.base.atk).length}">${izNum(u.base.atk, 'morado')}</span>
      </div>
      <div class="dm-life${k <= 0.25 ? ' low' : ''}${u.shield > 0 ? ' shielded' : ''}" style="--p:${k * 100}%;--s:${Math.min(100 - k * 100, (u.shield / u.maxHp) * 100)}%;--c:${lifeColor(k)}"><span class="hrt">♥</span><span class="bar"><span class="lag"></span><span class="cur"></span><span class="shd"></span><span class="tick"></span><i class="gloss"></i></span><b>${izNum(Math.round(hp))}<small>/${u.maxHp}</small></b>${u.shield > 0 ? `<em>🛡${u.shield}</em>` : ''}</div>
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
      <span class="dm-htech" style="--lw:${Math.max(...tech.split(/\s+/).map((w) => w.length))}">${esc(tech)}</span>${mult ? `<span class="dm-hmult">${pctOf(mult)}</span>` : ''}
      ${c.sealed ? img('estado-sellada', 'dm-hseal') : ''}</div>`;
  }
  const handW = () => (L.v ? 15 : 9.6);
  /** lights a footballer's orbs as many as have landed */
  function paintOrbs(uid: number) {
    const el = unitEl(uid), n = orbShown.get(uid) ?? 0;
    if (!el) return;
    el.querySelectorAll<HTMLElement>('.dm-g').forEach((o, i) => {
      o.classList.toggle('on', i < n);
      const im = o.querySelector('img'), want = artUrl(i < n ? 'garra-lleno' : 'garra-vacio');
      if (im && im.getAttribute('src') !== want) im.setAttribute('src', want);
    });
    el.classList.toggle('full', n >= GAUGE_MAX);
  }
  /** a blue orb flies to the place of orb `i` on his card, then that orb pops */
  function flyOrb(u: Unit, i: number, from?: DOMRect) {
    if (closed) return;
    const land = () => {
      if (closed) return;
      orbShown.set(u.uid, Math.max(orbShown.get(u.uid) ?? 0, i + 1));
      paintOrbs(u.uid);
      const o = unitEl(u.uid)?.querySelectorAll<HTMLElement>('.dm-g')[i];
      if (o) { o.classList.remove('gain'); void o.offsetWidth; o.classList.add('gain'); }
      orbSfx(i, u.side === 1);
      if (i + 1 >= GAUGE_MAX) window.setTimeout(() => { if (!closed) gaugeFull(u.uid); }, 140);
    };
    const target = unitEl(u.uid)?.querySelectorAll<HTMLElement>('.dm-g')[i];
    if (!target) { land(); return; }
    const t = target.getBoundingClientRect(), card = cardOf(unitEl(u.uid)!).getBoundingClientRect();
    const a = from ? { x: from.left + from.width / 2, y: from.top + from.height * 0.4 } : { x: card.left + card.width / 2, y: card.top + card.height * 0.45 };
    const b = { x: t.left + t.width / 2, y: t.top + t.height / 2 };
    const orb = document.createElement('i');
    orb.className = `dm-orbfly${u.side === 1 ? ' s1' : ''}`;
    orb.style.cssText = `left:${a.x}px;top:${a.y}px`;
    root.appendChild(orb);
    const dx = b.x - a.x, dy = b.y - a.y, lift = -Math.min(120, Math.hypot(dx, dy) * 0.35);
    orb.animate([
      { transform: 'translate(-50%,-50%) scale(.4)', opacity: 0 },
      { transform: `translate(calc(-50% + ${dx * 0.5}px), calc(-50% + ${dy * 0.5 + lift}px)) scale(1.15)`, opacity: 1, offset: 0.5 },
      { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(.7)`, opacity: 1 },
    ], { duration: (from ? 460 : 300) / speed, easing: 'cubic-bezier(.45,0,.55,1)' }).finished.then(() => { orb.remove(); land(); }, () => { orb.remove(); land(); });
  }
  /** the markup each card of the hand / footballer on the table was made from */
  const madeFrom = new WeakMap<Element, string>();
  /** a list of elements as it should be, keeping the ones whose markup did not change. Rebuilt every time, a picked
   *  card jumped up, the fan snapped, and the eight footballers (portraits, frames, shadows) were made anew several
   *  times per action, cutting the flashes and hops under way and stalling the frame each blow began on */
  function syncKeyed(box: HTMLElement, key: string, want: [number, string][], reused?: (el: HTMLElement) => void) {
    const old = new Map([...box.children].filter((el) => !el.classList.contains('leaving')).map((el) => [Number((el as HTMLElement).dataset[key]), el]));
    const els = want.map(([id, html]) => {
      const was = old.get(id);
      if (was && madeFrom.get(was) === html) { reused?.(was as HTMLElement); return was; }
      const t = document.createElement('template');
      t.innerHTML = html.trim();
      const el = t.content.firstElementChild!;
      madeFrom.set(el, html);
      return el;
    });
    const keep = new Set(els);
    for (const el of [...box.children]) {
      if (keep.has(el) || el.classList.contains('leaving')) continue;
      // a footballer your plan knocks out goes with a short KO instead of vanishing
      if (key === 'uid' && planning) { el.classList.add('leaving'); window.setTimeout(() => el.remove(), 420); } else el.remove();
    }
    els.forEach((el, i) => { if (box.children[i] !== el) box.insertBefore(el, box.children[i] ?? null); });
  }
  const syncHand = (want: [number, string][]) => syncKeyed($('.dm-hand'), 'cid', want, (h) => {
    // what a drag left on it (a new card never had it)
    if (drag?.el !== h) { h.style.translate = ''; h.style.rotate = ''; h.classList.remove('drag', 'aimfrom', 'fusing', 'willfuse', 'dropmark'); }
  });
  function render() {
    if (closed) return;
    // no card picked or dragged: no arrow
    if (picked === null && !drag) { aimAt.on = false; aimSvg.classList.remove('on'); }
    const me = s.sides[0], them = s.sides[1], mine = planning && !busy;
    const T = lesson(), hintCard = mine && tutorial ? tutorialCard(plan, T) : undefined, hintTarget = mine && tutorial ? tutorialTarget(plan, T) : undefined;
    syncKeyed($('.dm-units'), 'uid', [...them.units, ...me.units].filter((u) => slotView(u) >= 0).map((u) => [u.uid, unitHtml(u)]));
    // looping effects (the ulti's aura) take their phase from one clock, so drawing the table again does not restart them
    // and the footballers' drop of the opening goes on from where it was (each redraw used to start it again: little hops)
    const nowMs = performance.now();
    $('.dm-units').style.setProperty('--ph', `${-Math.round(nowMs)}ms`);
    $('.dm-units').style.setProperty('--ia', `${-Math.round(nowMs - introAt)}ms`);
    // the Garra: each orb won flies in (a blue orb from the card that gave it, or from his own card) and lights up
    // when it lands; the footballer's card itself does nothing (author: «haz que se acerque un orbe azul a la zona de
    // orbes y salga la animación del orbe, pero que no haga nada la carta»)
    for (const u of [...them.units, ...me.units]) {
      const g = gaugeOf(u), was = gaugeSeen.get(u.uid) ?? g;
      if (g > was) {
        const from = orbFrom.get(u.uid);
        orbFrom.delete(u.uid);
        for (let i = was; i < g; i++) window.setTimeout(() => flyOrb(u, i, from), (i - was) * 130);
      } else if (g < was || !orbShown.has(u.uid)) orbShown.set(u.uid, g);
      gaugeSeen.set(u.uid, g);
      paintOrbs(u.uid);
    }
    const hand = (planning || playing?.side === 0 ? plan : s).sides[0].hand;
    syncHand(hand.map((c) => [c.id, cardHtml(planning || playing?.side === 0 ? plan : s, c, handW())]));
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
      if (!seenCards.has(id)) {
        // dealt once: the class goes when it lands (kept, any other animation of the card ending, a fusion's glow,
        // played the deal again and the card flew in a second time)
        el.classList.add('dealt');
        const done = (e: AnimationEvent) => { if (e.animationName === 'dmDeal') { el.classList.remove('dealt'); el.removeEventListener('animationend', done); } };
        el.addEventListener('animationend', done);
        window.setTimeout(() => el.classList.remove('dealt'), 1100);
      }
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
      el.classList.toggle('swap', benchPick !== null && u.side === 0 && slotView(u) >= 0 && slotView(u) <= 2);
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
    fuseFx(el, ev.rank);
  }
  /** a fusion lands on a card of the hand: a shockwave of the rank's colour, a beam of light, the stars of its new rank
   *  popping one by one (each one a note higher), a hop of the card; ★★★ also shakes the table and the crowd flashes.
   *  `combo`: a combined technique formed (violet, bigger) */
  function fuseFx(el: HTMLElement, rank: number, combo = false) {
    const sr = stage.getBoundingClientRect(), r = el.getBoundingClientRect();
    const p = { x: ((r.left + r.width / 2 - sr.left) / sr.width) * 100, y: ((r.top + r.height * 0.42 - sr.top) / sr.height) * 100 };
    const col = combo ? '#c46aff' : rank >= 3 ? '#ffd23a' : '#8fd0ff';
    el.classList.remove('dealt'); // it has landed: the deal must not play again when the glow ends
    pulse(el, `merged r${combo ? 4 : rank}`, 1100);
    el.animate([{ scale: '1', translate: '0 0' }, { scale: '1.6', translate: '0 -2.5cqw', offset: 0.3 }, { scale: '1.45', translate: '0 -2cqw', offset: 0.6 }, { scale: '1', translate: '0 0' }], { duration: 950, easing: 'cubic-bezier(.3,1.4,.5,1)', composite: 'add' });
    // rays of its colour turning behind the card, and the whole screen lit in that colour for a moment
    const rays = document.createElement('div');
    rays.className = `dm-fuserays r${combo ? 4 : rank}`;
    rays.style.cssText = `left:${p.x}%;top:${p.y}%;--c:${col}`;
    fxLayer.appendChild(rays);
    window.setTimeout(() => rays.remove(), 1100);
    const flash = document.createElement('div');
    flash.className = 'dm-fuseflash';
    flash.style.setProperty('--c', col);
    fxLayer.appendChild(flash);
    window.setTimeout(() => flash.remove(), 700);
    const ring = document.createElement('div');
    ring.className = 'dm-fusering';
    ring.style.cssText = `left:${p.x}%;top:${p.y}%;--c:${col}`;
    ring.innerHTML = '<i></i><i></i><b></b>';
    fxLayer.appendChild(ring);
    window.setTimeout(() => ring.remove(), 1000);
    particlesAt(p, 'star', combo ? '#e0b0ff' : rank >= 3 ? '#ffd76a' : '#cfeaff', 18 + rank * 8);
    particlesAt(p, 'spark', '#fff3b0', 14 + rank * 6);
    shake(rank >= 3 || combo ? 0.7 : 0.35);
    const tag = document.createElement('div');
    tag.className = `dm-float rank r${combo ? 4 : rank}`;
    tag.style.cssText = `left:${p.x}%;top:${p.y - 13}%`;
    tag.innerHTML = combo ? `<span style="--k:0">${esc(tr('¡Combinada!'))}</span>` : `<em>${esc(tr('¡Fusión!'))}</em>${Array.from({ length: rank }, (_, i) => `<span style="--k:${i}">★</span>`).join('')}`;
    fxLayer.appendChild(tag);
    window.setTimeout(() => tag.remove(), 1600);
    if (combo) { sfx('legend'); crowdFlash(10); shake(0.8); }
    else {
      for (let i = 0; i < rank; i++) window.setTimeout(() => { if (!closed) orbSfx(i + 1); }, 90 + i * 120);
      if (rank >= 3) { window.setTimeout(() => { if (!closed) { sfx('powerup', 1.3); shake(0.6); crowdFlash(8); } }, 90 + rank * 120); }
      else sfx('powerup', 1.1);
    }
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
    fuseFx(el, 3, true);
    banner(cardTech(ev.name), 'combo s0', 1400);
    await wait(500);
  }

  /** the rivals (or allies) the picked card can go to glow, each with what the card would do to him */
  function markTargets(cid: number | null) {
    const pc = cid !== null && planning ? plan.sides[0].hand.find((c) => c.id === cid) : undefined;
    const to = pc ? aimSide(pc, unit(plan, pc.owner)) : null;
    stage.classList.toggle('aiming', to !== null);
    stage.classList.toggle('aim-ally', to === 0);
    for (const el of stage.querySelectorAll<HTMLElement>('.dm-unit')) {
      // a rival as he is now (your plan's blows are not shown); your own as your plan leaves them
      const u = unit(s, Number(el.dataset.uid)), pu = u.side === 0 ? unit(plan, u.uid) : u;
      const ok = to !== null && u.side === to && pu.slot >= 0 && pu.slot <= 2 && pu.hp > 0;
      el.classList.toggle('aim', ok);
      el.classList.toggle('dim', to !== null && !ok && slotView(u) <= 2);
      const pv = el.querySelector<HTMLElement>('.dm-pv')!;
      pv.innerHTML = ok && pc ? preview(pc, u.uid) : '';
    }
  }
  /** what a card would do to this target (played on a copy of the plan; a critical is shown as a normal blow) */
  function preview(c: Card, uid: number) {
    const sim = cloneDuel(plan), n = sim.log.length;
    if (act(sim, 0, { do: 'use', card: c.id, target: uid })) return '';
    const evs = sim.log.slice(n);
    const hits = evs.filter((e): e is Extract<Ev, { t: 'hit' }> => e.t === 'hit' && unit(sim, e.to).side === 1);
    const out: string[] = [];
    if (hits.length) {
      // who it lands on and how well, but not how much nor whether he falls (author: «el daño que hago y si lo dejo KO,
      // eso no lo quiero ver»)
      const h = hits.find((e) => e.to === uid) ?? hits[0];
      if (h.to !== uid) out.push(`<span class="redir">${img('estado-provocar')}${esc(host.name(unit(s, h.to).pid))}</span>`);
      if (h.elem > 1) out.push(`<span class="good">▲ ${tr('Eficaz')}</span>`); else if (h.elem < 1) out.push(`<span class="bad">▼ ${tr('Poco eficaz')}</span>`);
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
    // a coach: his passive (worth 50 % more with 2+ footballers of his groups)
    const hc = hoverCoach !== null ? s.sides[hoverCoach] : undefined;
    if (hc?.coach && !stage.classList.contains('scene')) {
      box.innerHTML = `<div class="dm-ih"><div><b>${esc(COACH_BY_ID.get(hc.coach)?.name ?? hc.coach)}</b><small>${tr('Entrenador')}</small></div></div>`
        + `<p class="pas"><b>${tr('Pasiva')}</b> ${esc(coachText(hc.coach, hc.coachBoost))}</p>` + (hc.coachBoost ? `<p>${tr('(+50 % por tener 2 o más de su grupo)')}</p>` : '');
      box.hidden = false;
      return;
    }
    const hu = hoverUnit !== null ? unit(s, hoverUnit) : undefined;
    if (hu && !stage.classList.contains('scene') && !stage.classList.contains('dragging')) {
      const b = hu.base;
      box.innerHTML = `<div class="dm-ih">${elementIcon(hu.element, Math.round(U() * 2.4))}<div><b>${esc(host.name(hu.pid))}</b><small>${esc(tr(hu.element))} · ${esc(hu.position)}</small></div></div>`
        + `<div class="dm-stats"><span>♥ ${Math.max(0, hu.hp)}/${hu.maxHp}</span><span>${tr('ATQ')} ${b.atk}</span><span>${tr('DEF')} ${b.def}</span><span>${tr('Crít.')} ${b.crit} %</span><span>${tr('Daño crít.')} ${b.critDmg} %</span><span>${tr('Garra')} ${hu.gauge}/${GAUGE_MAX}</span></div>`
        + (passiveText(hu.pid) ? `<p class="pas"><b>${tr('Pasiva')}</b> ${esc(passiveText(hu.pid))}</p>` : '')
        + Object.entries(hu.status).filter(([, n]) => n).map(([id, n]) => `<p>${img(STATUS_FILE[id], 'ic')} ${esc(STATUS_NAME()[id] ?? id)} · ${tr('{n} turnos', { n: n! })}</p>`).join('');
      box.hidden = false;
      return;
    }
    box.hidden = true;
  }

  // ---- effects
  /** a card effect on a hand: the hand it touches shines and says what happened */
  function cardsFx(side: Side, what: string) {
    const txt = ({ rankUp: tr('¡Rango arriba!'), rankDown: tr('Rango abajo'), seal: tr('¡Carta sellada!'), destroy: tr('¡Carta destruida!') } as Record<string, string>)[what];
    if (!txt) return;
    const good = what === 'rankUp';
    const host_ = side === 0 ? $('.dm-hand') : $('.dm-rq');
    const r = host_.getBoundingClientRect(), sr = stage.getBoundingClientRect();
    const p = { x: ((r.left + r.width / 2 - sr.left) / sr.width) * 100, y: ((r.top + r.height * 0.3 - sr.top) / sr.height) * 100 };
    const f = document.createElement('div');
    f.className = `dm-float cardsfx ${good ? 'up' : 'down'}`;
    f.style.cssText = `left:${p.x}%;top:${p.y}%`;
    f.textContent = txt;
    fxLayer.appendChild(f);
    window.setTimeout(() => f.remove(), 1600);
    particlesAt(p, good ? 'star' : 'spark', good ? '#ffd76a' : '#c46aff', 14);
    pulse(host_, good ? 'cards-up' : 'cards-down', 700);
    sfx(good ? 'powerup' : 'error', good ? 1.2 : 0.8);
  }
  /** two layers of effects: the screen's (the technique's card, the hand) and the table's, inside the camera, so what
   *  happens on a footballer stays on him while the camera closes in or shakes */
  const fxLayer = stage.querySelector<HTMLElement>(':scope > .dm-fx')!, camFx = stage.querySelector<HTMLElement>('.dm-cam > .dm-fx')!;
  /** a point of an element in the camera's own % (the camera may be zoomed and moving: its box scales with it) */
  function atCam(el: Element, fy = 0.4) {
    const r = el.getBoundingClientRect(), cr = cam.getBoundingClientRect();
    return { x: ((r.left + r.width / 2 - cr.left) / cr.width) * 100, y: ((r.top + r.height * fy - cr.top) / cr.height) * 100 };
  }
  /** the centre of a footballer's card (not of the whole unit, which also has his life bar and statuses) */
  const cardOf = (el: HTMLElement) => el.querySelector('.dm-card') ?? el;
  const unitEl = (uid: number) => stage.querySelector<HTMLElement>(`.dm-unit[data-uid="${uid}"]`);
  function float(uid: number, text: string, cls: string, delay = 0) {
    const el = unitEl(uid);
    if (!el) return;
    const p = atCam(el, 0.3), f = document.createElement('div');
    f.className = `dm-float ${cls}`;
    f.style.cssText = `left:${p.x + (Math.random() - 0.5) * 3}%;top:${p.y}%;animation-delay:${delay}ms`;
    f.innerHTML = text;
    camFx.appendChild(f);
    window.setTimeout(() => f.remove(), 1600 + delay);
  }
  function pulse(el: Element | null, cls: string, ms = 450) {
    if (!el) return;
    const cs = cls.split(' ');
    const on = () => { el.classList.add(...cs); window.setTimeout(() => el.classList.remove(...cs), ms); };
    // restarting a pulse that is still on takes a frame without it; reading offsetWidth for that laid the whole page
    // out there and then, dozens of times a blow (the stalls at the start of each beat)
    if (cs.some((c) => el.classList.contains(c))) { el.classList.remove(...cs); requestAnimationFrame(() => requestAnimationFrame(on)); } else on();
  }
  /** a burst of little lights: sparks out of a blow, green crosses rising from a heal, flames, ice, lightning */
  type PtKind = 'spark' | 'heal' | 'shield' | 'burn' | 'ice' | 'zap' | 'ko' | 'power' | 'leaf' | 'rock' | 'star' | 'arrow';
  function particles(uid: number, kind: PtKind, color = '#fff', n = 14) {
    const el = unitEl(uid);
    if (el) particlesAt(atCam(cardOf(el), kind === 'heal' ? 0.8 : 0.5), kind, color, n, camFx);
  }
  function particlesAt(p: { x: number; y: number }, kind: PtKind, color = '#fff', n = 14, layer: HTMLElement = fxLayer) {
    for (let i = 0; i < n; i++) {
      const d = document.createElement('i');
      const ang = Math.random() * Math.PI * 2, dist = (kind === 'spark' || kind === 'ko' || kind === 'rock' || kind === 'leaf' ? 4 + Math.random() * 8 : 2 + Math.random() * 4) * U();
      const rise = kind === 'heal' || kind === 'burn' || kind === 'arrow';
      const dx = rise ? (Math.random() - 0.5) * 6 * U() : Math.cos(ang) * dist;
      const dy = rise ? -(4 + Math.random() * 7) * U() : Math.sin(ang) * dist + (kind === 'rock' || kind === 'leaf' ? 3 * U() : 0);
      d.className = `dm-pt ${kind}`;
      d.style.cssText = `left:${p.x + (kind === 'heal' ? (Math.random() - 0.5) * 6 : 0)}%;top:${p.y}%;--dx:${dx}px;--dy:${dy}px;--c:${color};--s:${0.5 + Math.random()};animation-delay:${Math.random() * (kind === 'heal' ? 350 : 60)}ms`;
      if (kind === 'heal') d.textContent = '+';
      if (kind === 'star') d.textContent = '★';
      if (kind === 'arrow') d.textContent = color === '#6aff8a' ? '▲' : '▼';
      layer.appendChild(d);
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
    madeFrom.delete(el); // written by hand from here on: the next drawing makes it anew
    const life = el.querySelector<HTMLElement>('.dm-life')!, k = Math.max(0, hp / u.maxHp);
    life.style.setProperty('--p', `${k * 100}%`);
    life.style.setProperty('--c', lifeColor(k));
    life.classList.toggle('low', k <= 0.25);
    pulse(life, hp < from ? 'hit' : 'up', 500);
    if (hp < from) chips(life, from / u.maxHp, Math.max(0, hp / u.maxHp), lifeColor(Math.max(0, hp / u.maxHp)));
    if (u.side === 0 && hp > 0 && hp <= u.maxHp * 0.25 && from > u.maxHp * 0.25) { heartbeat(); pulse(el, 'danger', 1400); }
    const b = life.querySelector('b')!, n2 = el.querySelector('.dm-hpn')!, t0 = performance.now();
    const step = (t: number) => {
      const q = Math.min(1, (t - t0) / 450), v = Math.max(0, Math.round(from + (hp - from) * (1 - (1 - q) ** 3)));
      b.innerHTML = izNum(v); n2.innerHTML = izNum(v); (n2 as HTMLElement).style.setProperty('--d', String(String(v).length));
      if (q < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
  function heartbeat() {
    sfx('hurt', 0.5);
    window.setTimeout(() => { if (!closed) sfx('hurt', 0.45); }, 260);
    stage.classList.add('dangerv'); window.setTimeout(() => stage.classList.remove('dangerv'), 1300);
  }
  /** pieces of the life bar break off between the old and the new value */
  function chips(life: HTMLElement, k0: number, k1: number, color: string) {
    const bar = life.querySelector<HTMLElement>('.bar');
    if (!bar) return;
    const r = bar.getBoundingClientRect(), sr = cam.getBoundingClientRect();
    const n = Math.min(10, 2 + Math.round((k0 - k1) * 16));
    for (let i = 0; i < n; i++) {
      const d = document.createElement('i');
      const k = k1 + (k0 - k1) * Math.random();
      d.className = 'dm-chip';
      d.style.cssText = `left:${((r.left + r.width * k - sr.left) / sr.width) * 100}%;top:${((r.top + r.height / 2 - sr.top) / sr.height) * 100}%;--c:${color};--dx:${(Math.random() - 0.3) * 5 * U()}px;--dy:${-(1 + Math.random() * 3) * U()}px;--r:${(Math.random() - 0.5) * 540}deg;animation-delay:${Math.random() * 80}ms`;
      camFx.appendChild(d);
      window.setTimeout(() => d.remove(), 900);
    }
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
    // yours comes in on the left, the rival's on the right; under it, what the technique does
    c.style.cssText = `left:${L.cast[ev.side][0]}%;top:${L.cast[ev.side][1]}%`;
    const ci = cardInfo(s, ev.card, host.name), eff = [ci.base, ...ci.lines.filter((l) => l.on).map((l) => l.text)].filter(Boolean).slice(0, 3);
    c.innerHTML = cardHtml(s, ev.card, (big ? 9.5 : 8.5) * (L.v ? 1.8 : 1)) + `<div class="dm-cname"><small>${esc(who.map((m) => host.name(unit(s, m).pid)).join(' + '))}</small><span>${esc(ci.tech)}</span></div>`
      + (eff.length ? `<div class="dm-ceff">${eff.map((t) => `<p>${esc(t)}</p>`).join('')}</div>` : '');
    // on a wide screen it goes over the side panel of its side (nothing there matters during a scene): the table stays clear
    const panel = root.querySelector<HTMLElement>(`.dm-side.${ev.side === 0 ? 'l' : 'r'}`);
    if (panel && !panel.hidden && panel.offsetWidth >= 160) {
      const pr = panel.getBoundingClientRect();
      c.classList.add('out');
      // big enough to read (author: «no se ven casi las cartas de los que atacan»): wider than the panel if need be, and
      // kept inside the window
      const w = Math.max(pr.width - 12, Math.min(stage.clientWidth * 0.2, 380)), cx = Math.max(w / 2 + 8, Math.min(window.innerWidth - w / 2 - 8, pr.left + pr.width / 2));
      c.style.cssText = `left:${cx}px;top:${pr.top + pr.height / 2}px;--u:${stage.clientWidth / 100}px;width:${w}px`;
      panel.classList.add('casting');
      root.appendChild(c);
    } else fxLayer.appendChild(c);
    const box = stage.querySelector<HTMLElement>(ev.side === 0 ? '.dm-q .dm-box.now' : '.dm-rq .dm-box.now');
    if (box) {
      const b = box.getBoundingClientRect(), r = c.getBoundingClientRect();
      c.animate([{ translate: `${b.left + b.width / 2 - (r.left + r.width / 2)}px ${b.top + b.height / 2 - (r.top + r.height / 2)}px`, scale: String(Math.max(0.2, b.width / r.width)) }, { translate: '0 0', scale: '1' }], { duration: 380, easing: 'cubic-bezier(.2,1.2,.4,1)' });
    }
    focus([...who, ...also]);
    for (const m of who) { unitEl(m)?.classList.add('acting'); particles(m, 'power', EL_FX[unit(s, m).element] ?? '#fff', 10); auraBurst(m, big ? 1900 : 1150, big ? 1.4 : 1); }
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
    await wait(big ? 1150 : ev.side === 1 ? 460 : 380);
    return c;
  }
  async function castOut(c: HTMLElement, ev: Extract<Ev, { t: 'use' }>) {
    c.classList.add('go');
    root.querySelectorAll('.dm-side.casting').forEach((p) => p.classList.remove('casting'));
    for (const m of membersOf(ev.card)) unitEl(m)?.classList.remove('acting');
    stage.classList.remove('ultimate');
    focus(null);
    await wait(220);
    c.remove();
  }
  function impact(uid: number, color: string, crit = false, power = 0.6) {
    const el = unitEl(uid);
    if (!el) return;
    const p = atCam(cardOf(el), 0.5), f = document.createElement('div');
    f.className = `dm-impact${crit ? ' crit' : ''}`;
    f.style.cssText = `left:${p.x}%;top:${p.y}%;--c:${color}`;
    f.innerHTML = '<svg viewBox="0 0 100 100"><path d="M58 2L30 52h18L38 98l36-58H54z"/></svg><span class="slash"></span>';
    camFx.appendChild(f);
    window.setTimeout(() => f.remove(), 700);
    particles(uid, 'spark', color, crit ? 22 : 14);
    shake(crit ? power + 0.8 : power);
    if (crit || power > 1) vignette(color);
  }
  /** from one footballer to another on the table, in its own pixels: from where they stand, not from the screen (the
   *  camera is still zooming when a run starts, and the runner used to land beside his target) */
  const delta = (from: HTMLElement, to: HTMLElement, k: number) => {
    const W = cam.clientWidth / 100, H = cam.clientHeight / 100;
    return { dx: (parseFloat(to.style.left) - parseFloat(from.style.left)) * W * k, dy: (parseFloat(to.style.top) - parseFloat(from.style.top)) * H * k };
  };
  /** the Garra is full: a pillar of light, a ring, gold stars and the words; the ulti will be in the hand next turn */
  function gaugeFull(uid: number) {
    const el = unitEl(uid);
    if (!el) return;
    const u = unit(s, uid), gold = u.side === 0 ? '#ffd23a' : '#8fd0ff', p = atCam(cardOf(el), 0.5);
    const fx = document.createElement('div');
    fx.className = `dm-ultifx s${u.side}`;
    fx.style.cssText = `left:${p.x}%;top:${p.y}%`;
    fx.innerHTML = '<i class="pillar"></i><i class="ring"></i><i class="ring r2"></i>';
    camFx.appendChild(fx);
    window.setTimeout(() => fx.remove(), 1400);
    pulse(el, 'ultiup', 1300);
    particles(uid, 'star', gold, 22);
    particles(uid, 'power', gold, 16);
    float(uid, tr('¡Ulti lista!'), `ultiready s${u.side}`, 120);
    if (u.side === 0) { ultiReadySfx(); crowdFlash(6); punch(1); } else sfx('powerup', 0.7);
  }
  /** the ice around a frozen card breaks: white cracks run from the blow, then it bursts into shards that fall */
  function shatter(uid: number) {
    const el = unitEl(uid);
    if (!el) return;
    const card = cardOf(el), pp = atCam(card, 0.5), cr = card.getBoundingClientRect(), kr = cam.getBoundingClientRect();
    const w = (cr.width / kr.width) * 100, h = (cr.height / kr.height) * 100, cw = cam.clientWidth, ch = cam.clientHeight;
    const f = document.createElement('div');
    f.className = 'dm-shatter';
    f.style.cssText = `left:${pp.x}%;top:${pp.y}%;width:${w}%;height:${h}%`;
    // the cracks: from the centre out to the edges, each one bending twice
    const cracks = Array.from({ length: 7 }, (_, i) => {
      const a = (i / 7) * Math.PI * 2 + Math.random() * 0.5, r1 = 18 + Math.random() * 12, r2 = 34 + Math.random() * 14, r3 = 55;
      const pt = (r: number, j: number) => `${50 + Math.cos(a + j) * r} ${50 + Math.sin(a + j) * r * 1.3}`;
      return `M50 50 L${pt(r1, 0.15)} L${pt(r2, -0.12)} L${pt(r3, 0.08)}`;
    }).join(' ');
    f.innerHTML = `<svg viewBox="0 0 100 100" preserveAspectRatio="none"><path d="${cracks}"/></svg>`;
    camFx.appendChild(f);
    pulse(el, 'freeze', 160);
    iceBreakSfx();
    window.setTimeout(() => {
      if (closed) return;
      f.querySelector('svg')?.remove();
      el.classList.remove('st-congelado');
      el.querySelector('.dm-stfx')?.remove();
      frost.delete(uid);
      // the shards: triangles of ice thrown out from the card, spinning and falling
      const pxW = (w / 100) * cw, pxH = (h / 100) * ch;
      for (let i = 0; i < (LOW_FX ? 9 : 16); i++) {
        const b = document.createElement('b'), sz = pxW * (0.16 + Math.random() * 0.2);
        const p = Array.from({ length: 3 }, () => `${Math.random() * 100}% ${Math.random() * 100}%`).join(',');
        b.style.cssText = `width:${sz}px;height:${sz}px;margin:${-sz / 2}px;clip-path:polygon(${p})`;
        f.appendChild(b);
        const ang = Math.random() * Math.PI * 2, d = pxW * (0.5 + Math.random() * 0.9);
        const sx = (Math.random() - 0.5) * pxW * 0.7, sy = (Math.random() - 0.5) * pxH * 0.7;
        const ex = sx + Math.cos(ang) * d, ey = sy + Math.sin(ang) * d * 0.7, rot = (Math.random() - 0.5) * 720;
        b.animate([
          { transform: `translate(${sx}px,${sy}px) rotate(0deg)`, opacity: 1 },
          { transform: `translate(${ex}px,${ey}px) rotate(${rot * 0.6}deg)`, opacity: 1, offset: 0.45 },
          { transform: `translate(${ex * 1.15}px,${ey + pxH * 0.9}px) rotate(${rot}deg)`, opacity: 0 },
        ], { duration: 650 + Math.random() * 350, easing: 'cubic-bezier(.2,.7,.5,1)' });
      }
      particles(uid, 'ice', '#e6fbff', 20);
      shake(1.2);
      window.setTimeout(() => f.remove(), 1100);
    }, 170);
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
    const p = atCam(cardOf(el), 0.5), n = big ? 1.6 : 1;
    if (element === 'Fuego') { particlesAt(p, 'burn', '#ff8a2a', Math.round(18 * n), camFx); particlesAt(p, 'burn', '#ffd23a', Math.round(8 * n), camFx); }
    else if (element === 'Bosque') particlesAt(p, 'leaf', '#6aff5a', Math.round(16 * n), camFx);
    else if (element === 'Montaña') particlesAt(p, 'rock', '#c08a4a', Math.round(14 * n), camFx);
    const f = document.createElement('div');
    f.className = `dm-elfx el-${element === 'Montaña' ? 'Montana' : element}`;
    f.style.cssText = `left:${p.x}%;top:${p.y}%`;
    f.innerHTML = '<span></span><span></span><span></span>';
    camFx.appendChild(f);
    window.setTimeout(() => f.remove(), 900);
  }
  /** the ball, kicked from `from` to `to` with a trail of the kicker's element (resolves when it arrives) */
  async function shot(from: HTMLElement, to: HTMLElement, color: string, big: boolean) {
    const a = atCam(from, 0.75), b = atCam(cardOf(to), 0.5);
    const ball = document.createElement('div');
    ball.className = `dm-ball${big ? ' big' : ''}`;
    const sr0 = cam.getBoundingClientRect();
    ball.style.cssText = `left:${a.x}%;top:${a.y}%;--c:${color};--ang:${Math.atan2((b.y - a.y) * sr0.height, (b.x - a.x) * sr0.width)}rad`;
    ball.innerHTML = '<i class="dm-tail"></i>';
    camFx.appendChild(ball);
    sfx('kick', 1.2);
    // the flight on the compositor (moving left/top every frame relaid the page out each time) and its trail a few
    // sparks at a time
    const dur = 230 / speed, W = cam.clientWidth / 100, H = cam.clientHeight / 100;
    const at = (q: number) => ({ x: a.x + (b.x - a.x) * q, y: a.y + (b.y - a.y) * q - Math.sin(q * Math.PI) * 4 });
    const fly = ball.animate(Array.from({ length: 9 }, (_, i) => {
      const q = i / 8, p = at(q);
      return { transform: `translate(${(p.x - a.x) * W}px, ${(p.y - a.y) * H}px)` };
    }), { duration: dur, easing: 'linear', fill: 'forwards' });
    const t0 = performance.now();
    const trail = window.setInterval(() => particlesAt(at(Math.min(1, (performance.now() - t0) / dur)), 'power', color, 2, camFx), 34);
    await fly.finished.catch(() => undefined);
    window.clearInterval(trail);
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
  /** a card that hits nobody (a buff, a stance, a heal, a special): a hop, a ring of his element and rising lights */
  async function selfCast(who: number[], color: string) {
    for (const m of who) {
      const el = unitEl(m);
      if (!el) continue;
      el.animate([{ translate: '0 0' }, { translate: `0 ${-2.2 * U()}px`, offset: 0.4 }, { translate: '0 0' }], { duration: 520, easing: 'cubic-bezier(.3,0,.3,1)' });
      const pp = atCam(cardOf(el), 0.55), w = document.createElement('div');
      w.className = 'dm-wave self'; w.style.cssText = `left:${pp.x}%;top:${pp.y}%;--c:${color}`;
      camFx.appendChild(w); window.setTimeout(() => w.remove(), 750);
      particles(m, 'power', color, 14);
      particles(m, 'star', '#fff3b0', 6);
    }
    sfx('powerup', 0.9);
    await wait(460);
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
      const p = atCam(cardOf(a), 0.5);
      w.style.cssText = `left:${p.x}%;top:${p.y}%;--c:${color}`;
      camFx.appendChild(w);
      window.setTimeout(() => w.remove(), 750);
    }
    for (const t of tos) { impact(t, color, false, 0.9); elementBurst(t, unit(s, from[0]).element, false); await wait(80); }
    punch(1.5);
  }
  /** the effect of one event of the log */
  async function one(ev: Ev, last = false) {
    switch (ev.t) {
      case 'hit': {
        const u = unit(s, ev.to);
        setHp(ev.to, (hpView.get(ev.to) ?? u.hp) - ev.dmg);
        pulse(unitEl(ev.to), ev.crit ? 'dm-hurt crit' : 'dm-hurt', 480);
        if (ev.dmg > unit(s, ev.to).maxHp * 0.25) particles(ev.to, 'star', '#ffe14a', 8);
        if (ev.crit) { const el = unitEl(ev.to); if (el) { const pp = atCam(cardOf(el), 0.5), x = document.createElement('div'); x.className = 'dm-slashx'; x.style.cssText = `left:${pp.x}%;top:${pp.y}%`; x.innerHTML = '<i></i><i></i>'; camFx.appendChild(x); window.setTimeout(() => x.remove(), 700); } }
        sfx(ev.crit ? 'crit' : 'hit');
        float(ev.to, `${ev.crit ? `<small>${tr('¡Crítico!')}</small>` : ''}${izNum(`-${ev.dmg}`, ev.crit ? 'morado' : 'naranja')}`, ev.crit ? 'dmg crit' : 'dmg');
        if (ev.broke) { float(ev.to, tr('¡Hielo roto!'), 'note ice', 140); shatter(ev.to); }
        else if (ev.elem > 1) float(ev.to, tr('¡Eficaz!'), 'note good', 140);
        else if (ev.elem < 1) float(ev.to, tr('Poco eficaz'), 'note bad', 140);
        await wait(210);
        break;
      }
      case 'passive': {
        // a passive that triggers: his last stand (1 PV), his second wind, his rage for a fallen mate
        float(ev.uid, ev.what === 'lastStand' ? tr('¡Aguanta!') : ev.what === 'secondWind' ? tr('¡Segundo aliento!') : tr('¡Furia!'), 'mod up');
        const el = unitEl(ev.uid);
        if (el) { pulse(el, 'buffed', 800); particles(ev.uid, 'star', '#ffd76a', 18); }
        sfx('levelup', 1.2);
        await wait(320);
        break;
      }
      case 'pierce': {
        float(ev.to, tr('¡Atraviesa la postura!'), 'mod down');
        const el = unitEl(ev.to);
        if (el) { shatter(ev.to); pulse(el, 'debuffed', 600); }
        sfx('crit', 1.2);
        await wait(260);
        break;
      }
      case 'miss': {
        float(ev.to, ev.why === 'dodge' ? tr('Esquiva') : ev.why === 'block' ? tr('Bloqueado') : tr('Fallo'), 'note');
        pulse(unitEl(ev.to), ev.why === 'dodge' ? 'dodge' : 'shielded', 600);
        const el = unitEl(ev.to);
        if (el && ev.why === 'block') {
          const pp = atCam(cardOf(el), 0.5), sh = document.createElement('div');
          sh.className = 'dm-shieldfx';
          // the shield takes the card's shape (a bit bigger), so it sits right over it
          const cr = cardOf(el).getBoundingClientRect(), kr = cam.getBoundingClientRect();
          sh.style.cssText = `left:${pp.x}%;top:${pp.y}%;width:${(cr.width / kr.width) * 128}%;height:${(cr.height / kr.height) * 112}%`;
          camFx.appendChild(sh); window.setTimeout(() => sh.remove(), 800);
          particles(ev.to, 'shield', '#bfe8ff', 14); sfx('magnet', 1.6);
        } else if (el && ev.why === 'dodge') {
          const g = el.querySelector('.dm-card')!.cloneNode(true) as HTMLElement;
          g.classList.add('dm-after'); el.appendChild(g); window.setTimeout(() => g.remove(), 600);
          const pp = atCam(cardOf(el), 0.5), sl = document.createElement('div');
          sl.className = 'dm-dodgefx'; sl.style.cssText = `left:${pp.x}%;top:${pp.y}%`; sl.innerHTML = '<i></i><i></i><i></i><i></i>';
          camFx.appendChild(sl); window.setTimeout(() => sl.remove(), 600);
          sfx('whoosh', 1.5);
        } else sfx('sweep');
        await wait(320);
        break;
      }
      case 'heal': setHp(ev.to, (hpView.get(ev.to) ?? 0) + ev.hp); float(ev.to, izNum(`+${ev.hp}`, 'naranja', 'green'), 'heal'); pulse(unitEl(ev.to), 'healed', 900); particles(ev.to, 'heal', '#7dff9a', 16); sfx('pickup'); await wait(260); break;
      case 'shield': float(ev.to, `${img('estado-escudo')}+${ev.amount}`, 'shield'); pulse(unitEl(ev.to), 'shielded', 800); particles(ev.to, 'shield', '#8fd8ff', 12); sfx('magnet', 1.3); await wait(220); break;
      case 'status': {
        float(ev.to, `${img(STATUS_FILE[ev.s])}${esc(STATUS_NAME()[ev.s] ?? ev.s)}`, `status st-${ev.s}`);
        { const el = unitEl(ev.to); if (el && STATUS_FILE[ev.s]) { const pp = atCam(cardOf(el), 0.5), sl = document.createElement('div'); sl.className = 'dm-stslam'; sl.style.cssText = `left:${pp.x}%;top:${pp.y}%`; sl.innerHTML = img(STATUS_FILE[ev.s]); camFx.appendChild(sl); window.setTimeout(() => sl.remove(), 900); } }
        const k = ev.s === 'quemadura' ? 'burn' : ev.s === 'congelado' ? 'ice' : ev.s === 'electrizado' ? 'zap' : 'spark';
        particles(ev.to, k, ({ burn: '#ff8a2a', ice: '#bff4ff', zap: '#7fe8ff', spark: '#ffe08a' } as Record<string, string>)[k], 14);
        pulse(unitEl(ev.to), `got-${ev.s}`, 900);
        { const el = unitEl(ev.to); if (el) {
          if (ev.s === 'congelado') { const pp = atCam(cardOf(el), 0.5), ring = document.createElement('div'); ring.className = 'dm-icering'; ring.style.cssText = `left:${pp.x}%;top:${pp.y}%`; camFx.appendChild(ring); window.setTimeout(() => ring.remove(), 700); }
          else if (ev.s === 'quemadura') elementBurst(ev.to, 'Fuego', true);
          else if (ev.s === 'electrizado') zapBoost.set(ev.to, performance.now() + 900);
        } }
        sfx(ev.s === 'electrizado' ? 'zap' : ev.s === 'congelado' ? 'sweep' : 'magnet');
        await wait(280);
        break;
      }
      case 'resist': float(ev.to, tr('Resiste'), 'note'); await wait(200); break;
      case 'dispel': {
        // what helped him breaks: a purple flash, the shards of his barrier and the words
        const el = unitEl(ev.to);
        float(ev.to, tr('¡Efectos anulados!'), 'note bad');
        if (el) { el.classList.remove('ps-block', 'ps-dodge', 'ps-counter', 'ps-reflect', 'sh'); pulse(el, 'debuffed', 800); }
        particles(ev.to, 'spark', '#c46aff', 20); particles(ev.to, 'star', '#e0b0ff', 10);
        sfx('error', 0.6); sfx('sweep');
        await wait(360);
        break;
      }
      case 'ko': {
        const el = unitEl(ev.uid);
        el?.classList.add('koing');
        root.classList.add('flash', 'slowmo');
        if (last) {
          // the blow that ends the match: everything stops on him
          focus([ev.uid]); root.classList.add('finale'); sfx('thunder'); crowdFlash(24);
          await wait(700);
        }
        await wait(260);
        float(ev.uid, tr('K.O.'), 'kostamp');
        particles(ev.uid, 'ko', '#ffffff', 26);
        particles(ev.uid, 'spark', unit(s, ev.uid).side === 0 ? '#ff6a6a' : '#ffd76a', 18);
        shake(1.6); punch(2.4); sfx('boom');
        window.setTimeout(() => root.classList.remove('flash', 'slowmo'), 380);
        await wait(380);
        el?.classList.add('ko');
        await wait(last ? 1100 : 620);
        if (last) { root.classList.remove('finale'); focus(null); }
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
      else await selfCast(who, color);
      const lastKo = s.winner >= 0 ? group.filter((e) => e.t === 'ko').pop() : undefined;
      for (const e of group) { if (closed) return; await one(e, e === lastKo); }
      if (showExtras()) await wait(360);
      const nHits = group.filter((e) => e.t === 'hit' && unit(s, e.to).side !== ev.side).length;
      if (nHits >= 3) banner(tr('{n} golpes', { n: nHits }), `hits s${ev.side}`, 900);
      await wait(200);
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
      else if (ev.t === 'enter') {
        pulse(unitEl(ev.uid), 'dm-enter', 800); sfx('whoosh', 1.2);
        const u = unit(s, ev.uid);
        window.setTimeout(() => { if (closed) return; elementBurst(ev.uid, u.element, true); particles(ev.uid, 'power', EL_FX[u.element] ?? '#fff', 14); float(ev.uid, tr('¡Entra!'), `ultiready s${u.side}`); sfx('boom'); shake(0.8); }, 320);
      }
      else if (ev.t === 'deal') dealt = true;
      else if (ev.t === 'cards') cardsFx(ev.side, ev.what);
      else if (ev.t === 'turn') { pulse($('.dm-center'), 'flip', 700); banner(ev.side === 0 ? tr('¡Tu turno!') : tr('Turno rival'), `turn s${ev.side}`, 1250); sfx(ev.side === 0 ? 'reveal' : 'whoosh', 0.9); }
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
      let fromX = ir.left;
      for (const id of gone.splice(0, ev.t === 'merge' ? 1 : 2)) {
        const o = snap.get(id)!, g = document.createElement('div');
        fromX = o.r.left;
        g.className = 'dm-ghost';
        g.style.cssText = `left:${o.r.left - sr.left}px;top:${o.r.top - sr.top}px;width:${o.r.width}px`;
        g.innerHTML = o.html;
        fxLayer.appendChild(g);
        // in an arc, leaning into the flight, and it melts into the card it joins
        const dx = ir.left - o.r.left, dy = ir.top - o.r.top, lift = -o.r.height * 0.45, lean = dx > 0 ? 9 : -9;
        g.animate([
          { translate: '0 0', scale: '1', rotate: '0deg', opacity: 1, filter: 'brightness(1)' },
          { translate: `${dx * 0.45}px ${dy * 0.45 + lift}px`, scale: '1.12', rotate: `${lean}deg`, opacity: 1, filter: 'brightness(1.4)', offset: 0.5 },
          { translate: `${dx}px ${dy}px`, scale: '.7', rotate: '0deg', opacity: 0, filter: 'brightness(2.2)' },
        ], { duration: 400, easing: 'cubic-bezier(.45,0,.55,1)' }).finished.then(() => g.remove(), () => g.remove());
      }
      // the card it joins leans towards it, and bursts the moment it arrives
      into.animate([{ rotate: '0deg' }, { rotate: `${fromX < ir.left ? -5 : 5}deg`, offset: 0.7 }, { rotate: '0deg' }], { duration: 380, easing: 'ease-in-out', composite: 'add' });
      await wait(330);
      fuseFx(into, ev.t === 'merge' ? ev.rank : 3, ev.t === 'combo');
      // a fusion that climbed one more rank says why (★ + ★ giving ★★★ looked like a bug)
      if (ev.t === 'merge' && ev.boost) banner(ev.boost === 'travis' ? tr('¡Táctica de Travis! La primera fusión del turno sube un rango más.') : tr('¡Fusión potenciada! Sube un rango más.'), 'combo s0', 1600);
      if (ev.t === 'combo') banner(cardTech(ev.name), 'combo s0', 1300);
      await wait(250);
    }
  }
  /** buffs, debuffs and stances an action gave (they have no event): shown at the end of its scene */
  let extras = new Map<number, { mods: { stat: string; pct: number }[]; stance: boolean }>();
  const STAT_NAME = (): Record<string, string> => ({ atk: tr('ATQ'), def: tr('DEF'), crit: tr('Crít.'), vuln: tr('Daño recibido') });
  function showExtras() {
    let i = 0;
    for (const [uid, x] of extras) {
      const u = unit(s, uid), el = unitEl(uid);
      if (!el) continue;
      for (const m of x.mods) {
        // a debuff of «damage taken» going up is bad news too
        const good = m.stat === 'vuln' ? m.pct < 0 : m.pct > 0;
        float(uid, `${good ? '▲' : '▼'} ${esc(STAT_NAME()[m.stat] ?? m.stat)} ${m.pct > 0 ? '+' : ''}${m.pct}%`, `mod ${good ? 'up' : 'down'}`, i * 120);
        particles(uid, 'arrow', good ? '#6aff8a' : '#c46aff', 10);
        pulse(el, good ? 'buffed' : 'debuffed', 800);
        i++;
      }
      if (x.stance) {
        float(uid, tr('Postura'), 'mod stance', i * 120);
        const pp = atCam(cardOf(el), 0.5), a = document.createElement('div');
        a.className = `dm-stancefx s${u.side}`; a.style.cssText = `left:${pp.x}%;top:${pp.y}%`;
        camFx.appendChild(a); window.setTimeout(() => a.remove(), 1000);
        i++;
      }
    }
    if (i) sfx('powerup', 1.1);
    extras = new Map();
    return i;
  }
  async function run(side: Side, a: Action) {
    const n = s.log.length;
    const before = structuredClone(s.sides);
    if (a.do === 'use') before[side].hand = before[side].hand.filter((c) => c.id !== a.card);
    let why = act(s, side, a);
    // a target an earlier blow already knocked out: the card goes to another rival instead of being lost
    if (why === 'bad_target' && a.do === 'use') why = act(s, side, { ...a, target: undefined });
    if (why) return why;
    const evs = s.log.slice(n);
    // the table as it was (the state already moved on) while the blows land
    const now = s.sides;
    extras = new Map();
    // (the end of a turn ages every buff by a turn: that is not a new one)
    if (a.do !== 'end') for (const u of [...now[0].units, ...now[1].units]) {
      const b = before[u.side].units.find((x) => x.uid === u.uid);
      if (!b || u.hp <= 0) continue;
      const mods = u.mods.filter((m) => !b.mods.some((o) => o.stat === m.stat && o.pct === m.pct && o.turns === m.turns));
      const stance = u.stances.length > b.stances.length;
      if (mods.length || stance) extras.set(u.uid, { mods, stance });
    }
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
    remote?.send(list.map((q) => q.a));
    if (tutorial && T?.expect.do === 'end') step++;
    playing = { side: 0, list, now: 0 };
    render();
    sfx('click');
    for (let i = 0; i < list.length && s.winner < 0 && !closed; i++) {
      playing.now = i;
      render();
      if (list[i].a.do === 'move') { act(s, 0, list[i].a); await wait(120); continue; }
      await wait(120);
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
      // online: the rival's turn as it comes (its clock runs meanwhile)
      let theirs: Action[] | null = null;
      if (remote) {
        clock(TURN_SECONDS);
        theirs = await remote.next();
        if (closed) return;
        if (!theirs) { s.winner = 0; s.log.push({ t: 'win', side: 0 }); banner(tr('El rival se ha ido'), 'note', 1600); break; }
      }
      for (let k = 0; k < (theirs ? theirs.length : 12) && sim.active === 1 && sim.winner < 0; k++) {
        const a = theirs ? theirs[k] : cpuAction(sim, level, roll);
        if (a.do === 'end') break;
        const card = a.do === 'swap' ? undefined : sim.sides[1].hand.find((c) => c.id === a.card);
        if (act(sim, 1, a)) break;
        if (card) list.push({ a, card: structuredClone(card) }); else if (a.do === 'swap') list.push({ a, card: { id: -1, owner: a.bench, idx: 0, rank: 1 } });
      }
      playing = { side: 1, list: [], now: -1 };
      render();
      for (const q of list) { await wait(170); playing.list.push(q); sfx('click', 0.8); render(); }
      await wait(280);
      for (let i = 0; i < list.length && s.winner < 0 && !closed; i++) {
        playing.now = i;
        render();
        if (list[i].a.do === 'move') { act(s, 1, list[i].a); await wait(120); continue; }
        await wait(120);
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
    if (fromRect) orbFrom.set(card.owner, fromRect);
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
    // the winners celebrate: in the order they stand, each jumps (squashing on landing), the first jump with a spin
    s.sides[won ? 0 : 1].units.filter((u) => u.hp > 0 && u.slot >= 0).sort((a, b) => a.slot - b.slot).forEach((u, i) => {
      const card = unitEl(u.uid)?.querySelector<HTMLElement>('.dm-card');
      if (!card) return;
      const up = -3.2 * U();
      card.style.animation = 'none';
      const jump = (spin: boolean) => card.animate([
        { transform: 'translateY(0) scale(1,1) rotateY(0deg)' },
        { transform: 'translateY(0) scale(1.12,.86) rotateY(0deg)', offset: 0.14 },
        { transform: `translateY(${up}px) scale(.94,1.1) rotateY(${spin ? 180 : 0}deg)`, offset: 0.45, easing: 'cubic-bezier(.3,0,.7,1)' },
        { transform: `translateY(0) scale(1.1,.9) rotateY(${spin ? 360 : 0}deg)`, offset: 0.78 },
        { transform: 'translateY(0) scale(1,1) rotateY(360deg)' },
      ], { duration: 900, easing: 'cubic-bezier(.3,0,.3,1)' });
      window.setTimeout(async () => {
        if (closed) return;
        await jump(true).finished.catch(() => undefined);
        for (let k = 0; k < 40 && !closed && card.isConnected; k++) { await wait(260); await jump(false).finished.catch(() => undefined); }
      }, 250 + i * 160);
    });
    crowdFlash(won ? 18 : 4);
    // what it pays (the server answers for a win against the CPU)
    const mine = s.log.filter((e) => ('side' in e && e.side === 0));
    const stats: DuelSummary = { merges: mine.filter((e) => e.t === 'merge').length, combos: mine.filter((e) => e.t === 'combo').length, ultis: mine.filter((e) => e.t === 'use' && e.card.idx === 'u').length, turns: s.turn };
    const prize = end.querySelector<HTMLElement>('.dm-prize')!;
    if (remote) { window.clearInterval(clockTimer); root.querySelector<HTMLElement>('.dm-clock')!.hidden = true; remote.end(won); }
    if (host.reward && !remote) {
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
    // locked on a footballer, it points at his face (the centre of the portrait in his frame)
    if (target) { const t = (target.querySelector('.dm-port') ?? target).getBoundingClientRect(); x1 = t.left + t.width / 2 - sr.left; y1 = t.top + t.height * 0.55 - sr.top; }
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
  /** where a hand card sits in the layout, without its hover lift, lean or the room made for a dragged card */
  const layoutBox = (el: HTMLElement) => {
    const pr = (el.offsetParent as HTMLElement | null)?.getBoundingClientRect() ?? { left: 0, top: 0 };
    return { left: pr.left + el.offsetLeft, top: pr.top + el.offsetTop, width: el.offsetWidth, height: el.offsetHeight };
  };
  const clamp = (v: number) => Math.max(-0.5, Math.min(0.5, v));
  let drag: { id: number; el: HTMLElement; x0: number; y0: number; moved: boolean; mode: 'hand' | 'aim' | 'play' | null; to: number; centers: number[]; preview: string } | null = null;
  let suppressClick = false;
  stage.addEventListener('pointerdown', (e) => {
    const hc = (e.target as HTMLElement).closest<HTMLElement>('.dm-hand .dm-hc');
    if (!hc || busy || !planning || e.button > 0) return;
    const cards = [...stage.querySelectorAll<HTMLElement>('.dm-hand .dm-hc')];
    drag = { id: Number(hc.dataset.cid), el: hc, x0: e.clientX, y0: e.clientY, moved: false, mode: null, to: cards.indexOf(hc), centers: cards.map((c) => { const r = layoutBox(c); return r.left + r.width / 2; }), preview: '' };
    hc.setPointerCapture(e.pointerId);
  });
  stage.addEventListener('pointermove', (e) => {
    if (!drag) {
      // the card under the pointer leans towards it (and its shine follows)
      const hov = (e.target as HTMLElement).closest<HTMLElement>('.dm-hand .dm-hc');
      if (hov) {
        // measured on the card's place in the hand, not on the card already leaning, lifted and scaled (that fed back
        // on itself and the card shook), and eased towards the pointer
        const box = layoutBox(hov), fx = clamp((e.clientX - box.left) / box.width - 0.5), fy = clamp((e.clientY - box.top) / box.height - 0.5);
        const ox = Number(hov.dataset.fx ?? 0), oy = Number(hov.dataset.fy ?? 0), nx = ox + (fx - ox) * 0.35, ny = oy + (fy - oy) * 0.35;
        hov.dataset.fx = String(nx); hov.dataset.fy = String(ny);
        hov.style.setProperty('--tx', `${nx * 18}deg`); hov.style.setProperty('--ty', `${-ny * 12}deg`); hov.style.setProperty('--mx', `${(nx + 0.5) * 100}%`);
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
      sway = sway * 0.85 + Math.max(-9, Math.min(9, (e.clientX - lastX) * 0.5)) * 0.15;
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
    const co = t.closest<HTMLElement>('.dm-coach'), cs = co ? (co.classList.contains('s1') ? 1 : 0) : null;
    if (cid !== hoverCard || uid !== hoverUnit || cs !== hoverCoach) { hoverCard = Number.isFinite(cid) ? cid : null; hoverUnit = uid; hoverCoach = cs; info(); }
  });
  stage.addEventListener('pointerleave', () => { hoverCard = null; hoverUnit = null; hoverCoach = null; info(); });

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
      const pu = unit(plan, u.uid); // the table as your plan leaves it
      if (u.side === 0 && pu.slot === 3) { sfx('click'); benchPick = benchPick === u.uid ? null : u.uid; render(); return; }
      if (benchPick !== null && u.side === 0 && pu.slot >= 0 && pu.slot <= 2) { const b = benchPick; benchPick = null; void plan_({ do: 'swap', bench: b, out: u.uid }); return; }
      return;
    }
    if (t.closest('.dm-play')) { void playTurn(); return; }
    if (picked !== null || benchPick !== null) { picked = null; benchPick = null; render(); }
  });

  /** the opening: both starting lines slide in from the sides, VS slams between them, then the footballers drop in */
  async function intro() {
    const faces = (side: Side) => s.sides[side].units.filter((u) => u.slot >= 0 && u.slot <= 2).map((u, i) => `<span style="--k:${i}">${host.mug(u.pid, px(L.v ? 15 : 8.5))}</span>`).join('');
    const coach = (side: Side) => { const id = s.sides[side].coach; return id ? COACH_BY_ID.get(id)?.name ?? '' : ''; };
    const v = document.createElement('div');
    v.className = 'dm-vs';
    // each side comes in with its player's plate (profile, frame, banner, name; the CPU with its coach) and its starters
    const plateOf = (side: Side) => host.plate?.(side) || (side === 1 ? cpuPlate() : `<span class="dmp-tx"><b class="dmp-name">${esc(tr('Tu equipo'))}</b></span>`);
    v.innerHTML = `<div class="dm-vs-side s0"><div class="dm-plate s0 vs">${plateOf(0)}</div><div class="faces">${faces(0)}</div><small>${esc(coach(0))}</small></div>
      <div class="dm-vs-x"><span>VS</span></div>
      <div class="dm-vs-side s1"><div class="dm-plate s1 vs">${plateOf(1)}</div><div class="faces">${faces(1)}</div><small>${esc(coach(1))}</small></div>`;
    stage.appendChild(v);
    sfx('whoosh');
    await wait(520);
    sfx('boom'); shake(1.5); crowdFlash(12); root.classList.add('flash'); window.setTimeout(() => root.classList.remove('flash'), 450);
    await wait(1250);
    v.classList.add('out');
    introAt = performance.now();
    stage.classList.add('intro');
    $('.dm-units').style.setProperty('--ia', '0ms');
    sfx('whoosh', 1.3);
    await wait(420);
    v.remove();
    window.setTimeout(() => stage.classList.remove('intro'), 1200);
  }

  // ---- the ulti's aura: flames of ki on a canvas behind the footballers whose Garra is full. One loop draws them all,
  // where their cards are this very frame, so it follows the camera and never restarts when the table is drawn again.
  const auraCv = document.createElement('canvas');
  auraCv.className = 'dm-auracv';
  cam.insertBefore(auraCv, cam.querySelector('.dm-units'));
  const actx = auraCv.getContext('2d')!;
  /** white core, the side's colour, its deep edge (yours gold, the rival's blue) */
  const AURA: Record<Side, [string, string, string]> = { 0: ['255,250,225', '255,200,60', '255,110,20'], 1: ['230,248,255', '110,200,255', '40,95,255'] };
  /** a short aura in the colours of his element while he casts: uid -> until when (ms) and how strong */
  const EL_AURA: Record<string, [string, string, string]> = {
    Fuego: ['255,240,220', '255,140,40', '220,50,10'], Aire: ['235,255,255', '120,230,255', '30,140,220'],
    Bosque: ['240,255,230', '130,255,110', '30,160,40'], Montaña: ['255,245,225', '235,175,80', '150,85,20'], Neutro: ['255,255,255', '205,165,255', '120,70,220'],
  };
  const bursts = new Map<number, { until: number; k: number; cols: [string, string, string] }>();
  function auraBurst(uid: number, ms: number, k = 1) {
    bursts.set(uid, { until: performance.now() + ms, k, cols: EL_AURA[unit(s, uid).element] ?? EL_AURA.Neutro });
  }
  const sparks: { x: number; y: number; vx: number; vy: number; life: number; max: number; side: Side; cols?: [string, string, string] }[] = [];
  let auraLast = 0;
  /** what each canvas drew last frame: an empty one is not cleared again (two full-screen clears every frame, for
   *  nothing, kept the browser busy; streamers saw their broadcast stutter) */
  let auraDirty = true, stDirty = true;
  // over the footballers: frost and lightning
  const stCv = document.createElement('canvas');
  stCv.className = 'dm-stcv';
  cam.querySelector('.dm-units')!.after(stCv);
  const sctx = stCv.getContext('2d')!;
  /** the frost of each frozen card: its branches (in the card's own 0-1 space) and since when it grows */
  const frost = new Map<number, { t0: number; br: { x: number; y: number; a: number; len: number; kids: { at: number; a: number; len: number }[] }[] }>();
  const flakes: { x: number; y: number; vx: number; vy: number; life: number; max: number; s: number }[] = [];
  const zapBoost = new Map<number, number>();
  const FIRE: [string, string, string] = ['255,240,200', '255,140,30', '220,45,0'];
  function frostOf(uid: number, now: number) {
    let f = frost.get(uid);
    if (!f) {
      const br = Array.from({ length: LOW_FX ? 10 : 18 }, (_, i) => {
        // a seed on the edge (going round it), pointing inwards with some spread
        const q = (i + Math.random() * 0.6) / (LOW_FX ? 10 : 18) * 4, side = Math.floor(q), u = q - side;
        const [x, y] = side === 0 ? [u, 0] : side === 1 ? [1, u] : side === 2 ? [1 - u, 1] : [0, 1 - u];
        const a = Math.atan2(0.5 - y, 0.5 - x) + (Math.random() - 0.5) * 0.9;
        return { x, y, a, len: 0.12 + Math.random() * 0.2, kids: [0.35, 0.65].map((at) => ({ at, a: (Math.random() < 0.5 ? -1 : 1) * (0.5 + Math.random() * 0.5), len: 0.35 + Math.random() * 0.3 })) };
      });
      f = { t0: now, br };
      frost.set(uid, f);
    }
    return f;
  }
  function flames(ctx: CanvasRenderingContext2D, x0: number, y0: number, w: number, h: number, cols: [string, string, string], t: number, seed: number, scale: number, n: number) {
    const cx = x0 + w / 2, [c0, c1, c2] = cols;
    for (let pass = 0; pass < 2; pass++) {
      for (let i = 0; i < n; i++) {
        const u = (i / (n - 1)) * 2 - 1, au = Math.abs(u);
        const flick = 0.7 + 0.3 * Math.sin(t * (7 + (i % 5)) + i * 1.9 + seed) * Math.sin(t * 3.1 + i);
        const bx = cx + u * w * 0.55, by = y0 + h * (0.99 - 0.6 * au * au);
        const len = h * (0.3 + 0.48 * au) * flick * (pass ? 0.62 : 1) * scale;
        const wd = w * (pass ? 0.06 : 0.12) * (1 - 0.35 * au);
        const sway = Math.sin(t * 5.3 + i * 0.8 + seed) * w * 0.05 + u * w * 0.1;
        const lg = ctx.createLinearGradient(bx, by, bx + sway, by - len);
        if (pass) { lg.addColorStop(0, `rgba(${c0},.7)`); lg.addColorStop(0.5, `rgba(${c0},.35)`); lg.addColorStop(1, `rgba(${c1},0)`); }
        else { lg.addColorStop(0, `rgba(${c1},.55)`); lg.addColorStop(0.45, `rgba(${c2},.4)`); lg.addColorStop(1, `rgba(${c2},0)`); }
        ctx.fillStyle = lg;
        ctx.beginPath();
        ctx.moveTo(bx - wd, by);
        ctx.quadraticCurveTo(bx - wd * 0.7 + sway * 0.4, by - len * 0.55, bx + sway, by - len);
        ctx.quadraticCurveTo(bx + wd * 0.7 + sway * 0.4, by - len * 0.55, bx + wd, by);
        ctx.closePath();
        ctx.fill();
      }
    }
  }
  /** a point on the edge of a box, `q` going round it (0-4) */
  const edge = (x0: number, y0: number, w: number, h: number, q: number): [number, number] => {
    q = ((q % 4) + 4) % 4;
    const side = Math.floor(q), u = q - side;
    return side === 0 ? [x0 + u * w, y0] : side === 1 ? [x0 + w, y0 + u * h] : side === 2 ? [x0 + (1 - u) * w, y0 + h] : [x0, y0 + (1 - u) * h];
  };
  function statusFrame(now: number, dt: number, dpr: number, cr: DOMRect) {
    const W = auraCv.width, H = auraCv.height, kx = W / cr.width, ky = H / cr.height, t = now / 1000;
    if (stCv.width !== W || stCv.height !== H) { stCv.width = W; stCv.height = H; }
    if (stDirty) sctx.clearRect(0, 0, W, H);
    for (const [uid, until] of zapBoost) if (until < now) zapBoost.delete(uid);
    const seen = new Set<number>();
    let drew = false;
    for (const el of stage.querySelectorAll<HTMLElement>('.dm-unit:not(.ko):not(.koing)')) {
      const uid = Number(el.dataset.uid), cl = el.classList;
      const burn = cl.contains('st-quemadura'), ice = cl.contains('st-congelado'), zap = cl.contains('st-electrizado') || zapBoost.has(uid);
      const block = cl.contains('ps-block'), dodge = cl.contains('ps-dodge'), counter = cl.contains('ps-counter'), mirror = cl.contains('ps-reflect'), shield = cl.contains('sh');
      if (!burn && !ice && !zap && !block && !dodge && !counter && !mirror && !shield) continue;
      drew = true;
      const r = cardOf(el).getBoundingClientRect();
      // the visible frame is narrower than the card's box (the frame art has transparent sides)
      const x0 = (r.left - cr.left) * kx + r.width * kx * 0.16, y0 = (r.top - cr.top) * ky, w = r.width * kx * 0.68, h = r.height * ky;
      const cx = x0 + w / 2, cy = y0 + h / 2;
      if (shield) {
        // a shield: a pane of blue glass that hugs the card (author: the old bubble around him «así es horrible»), its
        // edge breathing and a glint running round it
        const k = 0.75 + 0.25 * Math.sin(t * 3 + uid), px0 = x0 - w * 0.05, py0 = y0 - h * 0.025, pw = w * 1.1, ph = h * 1.05, rr = w * 0.1;
        sctx.save();
        sctx.beginPath(); sctx.roundRect(px0, py0, pw, ph, rr);
        const g = sctx.createLinearGradient(px0, py0, px0 + pw, py0 + ph);
        g.addColorStop(0, `rgba(150,215,255,${0.16 * k})`); g.addColorStop(0.5, 'rgba(120,200,255,.04)'); g.addColorStop(1, `rgba(150,215,255,${0.16 * k})`);
        sctx.fillStyle = g; sctx.fill();
        sctx.strokeStyle = `rgba(190,235,255,${0.55 + 0.3 * k})`; sctx.lineWidth = 2 * dpr; sctx.shadowColor = '#4fb3ff'; sctx.shadowBlur = 10 * dpr;
        sctx.stroke(); sctx.shadowBlur = 0;
        // the glint: a short bright stretch of the edge, going round
        const per = 2 * (pw + ph), dash = per * 0.12;
        sctx.setLineDash([dash, per - dash]); sctx.lineDashOffset = -((t * 0.35 + uid * 0.17) % 1) * per;
        sctx.strokeStyle = 'rgba(255,255,255,.95)'; sctx.lineWidth = 3 * dpr; sctx.lineCap = 'round';
        sctx.stroke();
        sctx.restore();
      }
      if (block) {
        // blocking: a barrier of energy hexagons in front of the card, a band of light running down it
        const R = w * 0.11, band = ((t * 0.6 + uid * 0.13) % 1.4) - 0.2;
        sctx.save();
        sctx.beginPath(); sctx.roundRect(x0 - w * 0.04, y0 - h * 0.02, w * 1.08, h * 1.04, w * 0.1); sctx.clip();
        sctx.lineWidth = 1.1 * dpr;
        for (let row = 0, y = y0; y < y0 + h + R; row++, y += R * 1.5) {
          for (let x = x0 + (row % 2 ? R * 0.87 : 0); x < x0 + w + R; x += R * 1.73) {
            const near = Math.max(0, 1 - Math.abs((y - y0) / h - band) * 4);
            sctx.strokeStyle = `rgba(150,220,255,${0.18 + 0.6 * near})`;
            sctx.fillStyle = `rgba(110,190,255,${0.05 + 0.18 * near})`;
            sctx.beginPath();
            for (let a = 0; a < 6; a++) { const an = Math.PI / 6 + (a * Math.PI) / 3; sctx[a ? 'lineTo' : 'moveTo'](x + Math.cos(an) * R * 0.92, y + Math.sin(an) * R * 0.92); }
            sctx.closePath(); sctx.fill(); sctx.stroke();
          }
        }
        sctx.restore();
        sctx.strokeStyle = 'rgba(170,230,255,.9)'; sctx.lineWidth = 2 * dpr; sctx.shadowColor = '#4fb3ff'; sctx.shadowBlur = 10 * dpr;
        sctx.beginPath(); sctx.roundRect(x0 - w * 0.04, y0 - h * 0.02, w * 1.08, h * 1.04, w * 0.1); sctx.stroke(); sctx.shadowBlur = 0;
      }
      if (dodge) {
        // dodging: crescents of wind circle him, ready to slip away
        sctx.lineCap = 'round'; sctx.shadowColor = '#bff4ff'; sctx.shadowBlur = 6 * dpr;
        for (let i = 0; i < 3; i++) {
          const a = t * 3.2 + (i * Math.PI * 2) / 3 + uid;
          sctx.strokeStyle = `rgba(225,255,250,${0.75 - i * 0.12})`; sctx.lineWidth = (3 - i * 0.6) * dpr;
          sctx.beginPath(); sctx.ellipse(cx, cy, w * 0.78, h * 0.58, 0, a, a + 0.9); sctx.stroke();
        }
        sctx.shadowBlur = 0;
      }
      if (counter) {
        // countering: red spikes all round, pulsing out, ready to strike back
        const n = 16, pulseK = 0.5 + 0.5 * Math.sin(t * 6 + uid);
        sctx.fillStyle = 'rgba(255,90,60,.8)'; sctx.shadowColor = '#ff2a2a'; sctx.shadowBlur = 8 * dpr;
        for (let i = 0; i < n; i++) {
          const a = (i / n) * Math.PI * 2, ex = cx + Math.cos(a) * w * 0.62, ey = cy + Math.sin(a) * h * 0.55, L = w * (0.1 + 0.08 * pulseK);
          const tx = cx + Math.cos(a) * (w * 0.62 + L), ty = cy + Math.sin(a) * (h * 0.55 + L), nx = -Math.sin(a) * w * 0.04, ny = Math.cos(a) * w * 0.04;
          sctx.beginPath(); sctx.moveTo(ex + nx, ey + ny); sctx.lineTo(tx, ty); sctx.lineTo(ex - nx, ey - ny); sctx.closePath(); sctx.fill();
        }
        sctx.shadowBlur = 0;
      }
      if (mirror) {
        // reflecting: a golden mirror shine sweeps across the card, a golden edge
        const q = ((t * 0.7 + uid * 0.2) % 1.6) - 0.3;
        sctx.save();
        sctx.beginPath(); sctx.roundRect(x0, y0, w, h, w * 0.08); sctx.clip();
        const lg = sctx.createLinearGradient(x0 + w * (q - 0.3), y0, x0 + w * (q + 0.3), y0 + h);
        lg.addColorStop(0, 'rgba(255,240,180,0)'); lg.addColorStop(0.5, 'rgba(255,245,200,.55)'); lg.addColorStop(1, 'rgba(255,240,180,0)');
        sctx.fillStyle = lg; sctx.fillRect(x0, y0, w, h);
        sctx.restore();
        sctx.strokeStyle = 'rgba(255,210,90,.85)'; sctx.lineWidth = 2 * dpr; sctx.shadowColor = '#ffb020'; sctx.shadowBlur = 10 * dpr;
        sctx.beginPath(); sctx.roundRect(x0 - w * 0.03, y0 - h * 0.015, w * 1.06, h * 1.03, w * 0.09); sctx.stroke(); sctx.shadowBlur = 0;
      }
      if (burn) {
        // burning: real flames around him (behind the card) and embers rising off it
        actx.globalCompositeOperation = 'lighter';
        flames(actx, x0, y0, w, h, FIRE, t, uid * 2.3, 0.55, LOW_FX ? 10 : 18);
        if (Math.random() < 0.5) sparks.push({ x: x0 + Math.random() * w, y: y0 + h * (0.5 + Math.random() * 0.5), vx: (Math.random() - 0.5) * 20 * dpr, vy: -(50 + Math.random() * 80) * dpr, life: 0, max: 0.6 + Math.random() * 0.6, side: 0, cols: FIRE });
      }
      if (ice) {
        // frozen: frost branches grow in from the edges (half a second), then glint; snowflakes drift down
        seen.add(uid);
        const f = frostOf(uid, now), grow = Math.min(1, (now - f.t0) / 550);
        sctx.save();
        sctx.lineCap = 'round';
        sctx.shadowColor = '#8fd8ff'; sctx.shadowBlur = 6 * dpr;
        f.br.forEach((b, i) => {
          const glint = 0.55 + 0.45 * Math.sin(t * 2.2 + i * 1.7);
          sctx.strokeStyle = `rgba(235,250,255,${0.85 * glint + 0.15})`;
          sctx.lineWidth = 1.5 * dpr;
          const L = b.len * grow * Math.min(w, h), sx = x0 + b.x * w, sy = y0 + b.y * h, ex = sx + Math.cos(b.a) * L, ey = sy + Math.sin(b.a) * L;
          sctx.beginPath(); sctx.moveTo(sx, sy); sctx.lineTo(ex, ey);
          for (const k of b.kids) {
            const kx0 = sx + (ex - sx) * k.at, ky0 = sy + (ey - sy) * k.at, kl = L * k.len;
            sctx.moveTo(kx0, ky0); sctx.lineTo(kx0 + Math.cos(b.a + k.a) * kl, ky0 + Math.sin(b.a + k.a) * kl);
          }
          sctx.stroke();
          // a star of light where a branch ends, now and then
          if (glint > 0.95) { sctx.fillStyle = '#fff'; sctx.beginPath(); sctx.arc(ex, ey, 2.2 * dpr, 0, Math.PI * 2); sctx.fill(); }
        });
        sctx.restore();
        if (Math.random() < (LOW_FX ? 0.12 : 0.3)) flakes.push({ x: x0 + Math.random() * w, y: y0 - h * 0.05, vx: (Math.random() - 0.5) * 12 * dpr, vy: (18 + Math.random() * 22) * dpr, life: 0, max: 1.4 + Math.random(), s: (1 + Math.random() * 1.6) * dpr });
      }
      if (zap) {
        // electrified: arcs jump along the edge of the card, white-hot inside a blue glow
        const tries = zapBoost.has(uid) ? 3 : 1;
        for (let k = 0; k < tries; k++) {
          if (Math.random() > (zapBoost.has(uid) ? 0.8 : 0.32)) continue;
          const q = Math.random() * 4, q2 = q + 0.25 + Math.random() * 0.5;
          const [ax, ay] = edge(x0 - w * 0.03, y0 - h * 0.02, w * 1.06, h * 1.04, q), [bx, by] = edge(x0 - w * 0.03, y0 - h * 0.02, w * 1.06, h * 1.04, q2);
          const pts: [number, number][] = [[ax, ay]], segs = 7, nx = -(by - ay), ny = bx - ax, nl = Math.hypot(nx, ny) || 1;
          for (let j = 1; j < segs; j++) { const u = j / segs, off = (Math.random() - 0.5) * w * 0.18; pts.push([ax + (bx - ax) * u + (nx / nl) * off, ay + (by - ay) * u + (ny / nl) * off]); }
          pts.push([bx, by]);
          for (const [lw, col, blur] of [[4 * dpr, 'rgba(90,190,255,.55)', 14 * dpr], [1.4 * dpr, 'rgba(240,252,255,.95)', 4 * dpr]] as [number, string, number][]) {
            sctx.strokeStyle = col; sctx.lineWidth = lw; sctx.shadowColor = '#3fa8ff'; sctx.shadowBlur = blur;
            sctx.beginPath(); sctx.moveTo(pts[0][0], pts[0][1]); for (const [x, y] of pts.slice(1)) sctx.lineTo(x, y); sctx.stroke();
          }
          sctx.shadowBlur = 0;
        }
      }
    }
    for (const uid of [...frost.keys()]) if (!seen.has(uid)) frost.delete(uid);
    for (let i = flakes.length - 1; i >= 0; i--) {
      const p = flakes[i];
      p.life += dt; p.x += (p.vx + Math.sin(p.life * 3 + i) * 8 * dpr) * dt; p.y += p.vy * dt;
      if (p.life >= p.max) { flakes.splice(i, 1); continue; }
      const k = Math.min(1, (p.max - p.life) * 2);
      sctx.fillStyle = `rgba(240,252,255,${0.85 * k})`;
      sctx.beginPath(); sctx.arc(p.x, p.y, p.s, 0, Math.PI * 2); sctx.fill();
    }
    return (stDirty = drew || flakes.length > 0);
  }
  function auraFrame(now: number) {
    if (closed) return;
    requestAnimationFrame(auraFrame);
    // 60 fps at most (a 144 Hz screen drew the flames 144 times a second) and nothing at all with the tab hidden
    if (document.hidden || now - auraLast < 15) return;
    const dt = Math.min(0.05, (now - (auraLast || now)) / 1000);
    auraLast = now;
    const dpr = Math.min(LOW_FX ? 1 : 2, window.devicePixelRatio || 1);
    const W = Math.round(cam.clientWidth * dpr), H = Math.round(cam.clientHeight * dpr);
    if (auraCv.width !== W || auraCv.height !== H) { auraCv.width = W; auraCv.height = H; }
    actx.globalCompositeOperation = 'source-over';
    if (auraDirty) actx.clearRect(0, 0, W, H);
    for (const [uid, b] of bursts) if (b.until < now) bursts.delete(uid);
    const units = [...stage.querySelectorAll<HTMLElement>('.dm-unit.full:not(.ko):not(.koing)')];
    for (const uid of bursts.keys()) { const e = unitEl(uid); if (e && !units.includes(e)) units.push(e); }
    const cr = cam.getBoundingClientRect(), kx = W / cr.width, ky = H / cr.height, t = now / 1000;
    statusFrame(now, dt, dpr, cr);
    auraDirty = units.length > 0 || sparks.length > 0 || stDirty; // a burning card draws its flames on this canvas too
    actx.globalCompositeOperation = 'lighter';
    for (const el of units) {
      const side: Side = el.classList.contains('s1') ? 1 : 0, burst = bursts.get(Number(el.dataset.uid));
      // a burst (casting) wins over the ulti's aura and grows with it, fading out at its end
      const bk = burst ? burst.k * Math.min(1, (burst.until - now) / 250) : 1;
      const [c0, c1, c2] = burst ? burst.cols : AURA[side];
      const r = cardOf(el).getBoundingClientRect();
      const x0 = (r.left - cr.left) * kx, y0 = (r.top - cr.top) * ky, w = r.width * kx, h = r.height * ky, cx = x0 + w / 2, grow = burst ? 1 + 0.4 * bk : 1;
      const seed = Number(el.dataset.uid) * 1.7, beat = (0.8 + 0.2 * Math.sin(t * 4.2 + seed)) * (burst ? 0.6 + 0.6 * bk : 1);
      // the glow around him, breathing
      const g = actx.createRadialGradient(cx, y0 + h * 0.5, w * 0.25, cx, y0 + h * 0.5, w * 1.15);
      g.addColorStop(0, `rgba(${c1},${0.32 * beat})`); g.addColorStop(0.55, `rgba(${c2},${0.16 * beat})`); g.addColorStop(1, `rgba(${c2},0)`);
      actx.fillStyle = g;
      actx.beginPath(); actx.ellipse(cx, y0 + h * 0.5, w * 1.15, h * 0.78, 0, 0, Math.PI * 2); actx.fill();
      // tongues of flame along the sides and under him, leaning out and up; the side ones rise past his head
      const n = LOW_FX ? 14 : 26;
      for (let pass = 0; pass < 2; pass++) {
        for (let i = 0; i < n; i++) {
          const u = (i / (n - 1)) * 2 - 1, au = Math.abs(u);
          const flick = 0.7 + 0.3 * Math.sin(t * (7 + (i % 5)) + i * 1.9 + seed) * Math.sin(t * 3.1 + i);
          const bx = cx + u * w * 0.55, by = y0 + h * (0.99 - 0.6 * au * au);
          const len = h * (0.3 + 0.48 * au) * flick * (pass ? 0.62 : 1) * grow;
          const wd = w * (pass ? 0.06 : 0.12) * (1 - 0.35 * au);
          const sway = Math.sin(t * 5.3 + i * 0.8 + seed) * w * 0.05 + u * w * 0.1;
          const lg = actx.createLinearGradient(bx, by, bx + sway, by - len);
          if (pass) { lg.addColorStop(0, `rgba(${c0},.7)`); lg.addColorStop(0.5, `rgba(${c0},.35)`); lg.addColorStop(1, `rgba(${c1},0)`); }
          else { lg.addColorStop(0, `rgba(${c1},.55)`); lg.addColorStop(0.45, `rgba(${c2},.4)`); lg.addColorStop(1, `rgba(${c2},0)`); }
          actx.fillStyle = lg;
          actx.beginPath();
          actx.moveTo(bx - wd, by);
          actx.quadraticCurveTo(bx - wd * 0.7 + sway * 0.4, by - len * 0.55, bx + sway, by - len);
          actx.quadraticCurveTo(bx + wd * 0.7 + sway * 0.4, by - len * 0.55, bx + wd, by);
          actx.closePath();
          actx.fill();
        }
      }
      // sparks rise off him
      if (Math.random() < (LOW_FX ? 0.35 : burst ? 1 : 0.8)) sparks.push({ x: cx + (Math.random() - 0.5) * w * 1.15, y: y0 + h * (0.35 + Math.random() * 0.65), vx: (Math.random() - 0.5) * 30 * dpr, vy: -(70 + Math.random() * 110) * dpr * (burst ? 1.5 : 1), life: 0, max: 0.5 + Math.random() * 0.6, side, cols: burst?.cols });
      // now and then a crackle of lightning runs up his side
      const ph = (t * 1000 + seed * 431) % 1900;
      if (ph < 110) {
        const left = Math.floor((t * 1000 + seed * 431) / 1900) % 2 === 0;
        let x = left ? x0 - w * 0.04 : x0 + w * 1.04, y = y0 + h * 0.92;
        actx.strokeStyle = `rgba(${c0},.95)`; actx.lineWidth = 1.6 * dpr; actx.shadowColor = `rgb(${c1})`; actx.shadowBlur = 8 * dpr;
        actx.beginPath(); actx.moveTo(x, y);
        for (let k = 0; k < 7; k++) { x += (Math.random() - 0.5) * w * 0.14 + (left ? -1 : 1) * w * 0.01; y -= h * 0.13; actx.lineTo(x, y); }
        actx.stroke(); actx.shadowBlur = 0;
      }
    }
    for (let i = sparks.length - 1; i >= 0; i--) {
      const p = sparks[i];
      p.life += dt; p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.life >= p.max) { sparks.splice(i, 1); continue; }
      const k = 1 - p.life / p.max, [c0, c1] = p.cols ?? AURA[p.side];
      actx.fillStyle = `rgba(${c0},${0.9 * k})`;
      actx.beginPath(); actx.arc(p.x, p.y, (1.2 + 1.3 * k) * dpr, 0, Math.PI * 2); actx.fill();
      actx.fillStyle = `rgba(${c1},${0.3 * k})`;
      actx.beginPath(); actx.arc(p.x, p.y, (3 + 3 * k) * dpr, 0, Math.PI * 2); actx.fill();
    }
  }
  requestAnimationFrame(auraFrame);
  // (dev only) QA hook to see the effects without waiting for them in a match
  // (dev only) QA hook to see the effects without waiting for them in a match; `plan`/`play`/`ready` let a director
  // (the TikTok recordings) play your turns through the same path as the hand
  if (import.meta.env.DEV) (window as unknown as Record<string, unknown>).__duelFx = { shatter, gaugeFull, fuseFx, state: s,
    plan: plan_, play: playTurn, planned: () => plan, ready: () => planning && !busy && !closed, replan: () => { startPlanning(); render(); }, banner };

  // ---- go
  layout();
  if (s.active === 0) startPlanning();
  busy = true;
  render();
  void (async () => {
    try { await intro(); } catch (e) { console.error(e); }
    if (closed) return;
    busy = false;
    render();
    sfx('reveal');
    banner(tutorial ? tr('Tutorial') : s.active === 0 ? tr('¡Tu turno!') : tr('Turno rival'), `turn s${s.active}`, 1250);
    if (s.active === 1) { busy = true; void rivalTurn(); }
  })();
  return { state: s, close };
}

/** where things are on the footballer frame (% of it), from the author's frames */
const FR = { portW: 54, orbX: 24.8, orbStep: 10.5 };
