/**
 * Modo Duelo: the team editor, laid out like Grand Cross's team select. Above, the formation: three starters, the
 * bench and the coach, with the team's power; under it, what the team gets together (its groups, its element, the
 * combined techniques it can make); below, your footballers of the mode to pick from, filtered by element. Tap a
 * slot to choose it and then a footballer to put him there (a footballer already in the team swaps places); the ✕ of
 * a slot empties it. A footballer and his Mixi Max form are one player: when one is in, the other is locked.
 */
import { tr } from '../i18n/i18n';
import { sfx } from '../game/sfx';
import { COACH_BY_ID } from '../data/coaches';
import { DUEL_BY_ID, DUEL_COACHES, DUEL_COMBOS, duelStats, familyOf, type CoachId, type DuelGroup } from '../systems/duel/cards';
import { artUrl } from './duelArt';
import { elementIcon } from './elements';
import { techInfo, passiveText, coachText, pctOf } from './duelText';
import type { DuelHubHost, DuelNav } from './duelHub';
import { fit, go, zoomOf } from './duelNav';

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
const RAR = ['leyenda', 'mitico', 'legendario'];
const RAR_COL: Record<string, string> = { leyenda: '#ff5ad1', mitico: '#c46aff', legendario: '#ffb020' };
const EL_ORDER = ['Fuego', 'Aire', 'Bosque', 'Montaña'];

export type DuelTeamHost = Pick<DuelHubHost, 'owned' | 'coaches' | 'benchCoach' | 'byId' | 'rarity' | 'mug' | 'name' | 'coachArt' | 'card'>;
export interface DuelTeam { pids: number[]; coach: CoachId | null }

/** how strong a footballer is for the duel (rarity first, then his stats) */
export function duelPower(h: Pick<DuelTeamHost, 'byId' | 'rarity'>, pid: number) {
  const p = h.byId.get(pid);
  if (!p) return 0;
  const st = duelStats(p as never);
  return Math.round(st.atk * 2 + st.def + st.hp / 6 + (3 - Math.max(0, RAR.indexOf(h.rarity(pid)))) * 120);
}

/** the collection's card of a footballer with the duel's stats in place of its bars: PV and ATQ big, then DEF, critical,
 *  critical damage and piercing ('' without the collection's card); its CSS is DUEL_STATS_CSS */
export function duelCardFace(h: Pick<DuelTeamHost, 'byId' | 'card'>, pid: number) {
  const face = h.card?.(pid), p = h.byId.get(pid);
  if (!face || !p) return '';
  const st = duelStats(p as never);
  const duel = `<div class="cc-stats dt-dstats"><span class="hp"><small>${tr('PV')}</small><b>${st.hp}</b></span><span class="atk"><small>${tr('ATQ')}</small><b>${st.atk}</b></span>`
    + `<span><small>${tr('DEF')}</small><b>${st.def}</b></span><span><small>${tr('Crít.')}</small><b>${st.crit}%</b></span><span><small>${tr('D. crít.')}</small><b>${st.critDmg}%</b></span><span><small>${tr('Perf.')}</small><b>${st.pierce}%</b></span></div>`;
  return face.replace(/<div class="cc-stats[^"]*">[\s\S]*?<\/div>/, duel);
}
export function openDuelTeam(h: DuelTeamHost, start: DuelTeam, save: (t: DuelTeam) => void, back: (from: HTMLElement) => void, nav?: DuelNav) {
  document.querySelector('.dt:not(.dn-out)')?.remove();
  const own = h.owned.filter((id) => DUEL_BY_ID.has(id) && h.byId.has(id)).sort((a, b) => duelPower(h, b) - duelPower(h, a));
  const coaches = DUEL_COACHES.map((c) => c.id).filter((id) => h.coaches.includes(id)) as CoachId[];
  // the team being edited: 4 slots (the 4th is the bench) and the coach
  const slots: (number | null)[] = [0, 1, 2, 3].map((i) => (start.pids[i] && own.includes(start.pids[i]) ? start.pids[i] : null));
  let coach: CoachId | null = start.coach && coaches.includes(start.coach) ? start.coach : null;
  let sel = slots.indexOf(null) >= 0 ? slots.indexOf(null) : 0;
  let filter = '';
  let coachOpen = false;

  const el = document.createElement('div');
  el.className = 'dt';
  document.body.appendChild(el);
  const elementOf = (pid: number) => h.byId.get(pid)?.element ?? 'Neutro';
  const groupOf = (pid: number) => DUEL_BY_ID.get(pid)!.group;

  function cardHtml(pid: number, cls = '') {
    const p = h.byId.get(pid)!, st = duelStats(p as never), rar = h.rarity(pid);
    // the collection's own card (rarity frame, stars, element, name), with the duel's PV and ATQ under it
    const face = duelCardFace(h, pid);
    if (face) return `<div class="dt-cc ${cls}" data-tip="${pid}">${face}</div>`;
    return `<div class="dt-card ${cls}" style="--rc:${RAR_COL[rar] ?? '#ffb020'}">
      <span class="dt-port">${h.mug(pid, 84)}</span>
      <span class="dt-el">${elementIcon(elementOf(pid), 18)}</span>
      <b class="dt-nm">${esc(h.name(pid))}</b>
      <span class="dt-st"><i>♥ ${st.hp}</i><i>⚔ ${st.atk}</i></span></div>`;
  }
  function synergies() {
    const team = slots.filter((x): x is number => x !== null), starters = slots.slice(0, 3).filter((x): x is number => x !== null);
    const groups = new Map<DuelGroup, number>();
    for (const pid of team) groups.set(groupOf(pid), (groups.get(groupOf(pid)) ?? 0) + 1);
    const chips: string[] = [];
    for (const [g, n] of [...groups].sort((a, b) => b[1] - a[1])) {
      if (n < 2) continue;
      chips.push(`<span class="dt-syn g${Math.min(4, n)}"><b>${esc(tr(g))}</b> ×${n}<small>${n >= 4 ? tr('efecto + ATQ +15 %') : n >= 3 ? tr('efecto de grupo') : tr('ATQ +8 %')}</small></span>`);
    }
    const els = new Map<string, number>();
    for (const pid of starters) els.set(elementOf(pid), (els.get(elementOf(pid)) ?? 0) + 1);
    const allEl = team.length === 4 && new Set(team.map(elementOf)).size === 1;
    for (const [e, n] of els) if (n >= 3) chips.push(`<span class="dt-syn el">${elementIcon(e, 16)}<b>${esc(tr(e))}</b><small>${allEl ? tr('daño +15 %') : tr('daño +10 %')}</small></span>`);
    const combos = DUEL_COMBOS.filter((c) => c.players.every((p) => team.includes(p))).map((c) => c.name);
    for (const c of [...new Set(combos)]) chips.push(`<span class="dt-syn cb"><b>${esc(c)}</b><small>${tr('Combinada')}</small></span>`);
    const coachDef = coach ? DUEL_COACHES.find((c) => c.id === coach) : null;
    if (coachDef && team.filter((p) => (coachDef.groups as readonly DuelGroup[]).includes(groupOf(p))).length >= 2) chips.push(`<span class="dt-syn co"><b>${esc(COACH_BY_ID.get(coach!)?.name ?? coach!)}</b><small>${tr('pasiva +50 %')}</small></span>`);
    return chips.join('') || `<span class="dt-none">${tr('Junta futbolistas del mismo grupo o elemento para activar sinergias.')}</span>`;
  }
  /** the coach's passive is worth 50 % more with 2+ footballers of his groups */
  const coachBoosted = (team: number[]) => { const d = coach ? DUEL_COACHES.find((c) => c.id === coach) : null; return !!d && team.filter((p) => (d.groups as readonly DuelGroup[]).includes(groupOf(p))).length >= 2; };
  function render() {
    const team = slots.filter((x): x is number => x !== null);
    const fams = new Map(team.map((p) => [familyOf(p), p]));
    const power = team.reduce((a, p) => a + duelPower(h, p), 0);
    const ok = team.length === 4;
    const list = own.filter((pid) => !filter || elementOf(pid) === filter);
    const coachArt = coach ? h.coachArt(coach) : '';
    el.innerHTML = `<style>${CSS}</style><img class="dt-bg" src="${artUrl('mesa-horizontal')}" alt="">
      <div class="dt-box">
        <header><button class="dt-back" type="button" aria-label="${tr('Volver')}">‹</button><h2>${tr('Editar equipo')}</h2>
          <span class="dt-pow"><small>${tr('Poder')}</small><b>${power.toLocaleString()}</b></span>
          <button class="dt-auto" type="button">${tr('Auto')}</button><button class="dt-save" type="button" ${ok ? '' : 'disabled'}>${tr('Guardar')}</button></header>
        <div class="dt-form">
          ${slots.map((pid, i) => `<div class="dt-slot${i === 3 ? ' bench' : ''}${sel === i ? ' sel' : ''}" data-slot="${i}">
            <small class="dt-lbl">${i === 3 ? tr('Banquillo') : tr('Titular {n}', { n: i + 1 })}</small>
            ${pid !== null ? `${cardHtml(pid, 'in')}<button class="dt-out" data-out="${i}" type="button" aria-label="${tr('Quitar')}">✕</button>` : '<div class="dt-empty">+</div>'}</div>`).join('')}
          <div class="dt-slot coach${coachOpen ? ' sel' : ''}" data-coach><small class="dt-lbl">${tr('Entrenador')}</small>
            <div class="dt-coach">${coachArt ? `<img src="${coachArt}" alt="">` : '<i>📋</i>'}<b>${esc(coach ? COACH_BY_ID.get(coach)?.name ?? coach : tr('Sin entrenador'))}</b></div></div>
        </div>
        ${coachOpen ? `<div class="dt-coaches">${[null, ...coaches].map((c) => `<button type="button" data-pick-coach="${c ?? ''}" class="${c === coach ? 'on' : ''}">${c && h.coachArt(c) ? `<img src="${h.coachArt(c)}" alt="">` : '<i>📋</i>'}<span>${esc(c ? COACH_BY_ID.get(c)?.name ?? c : tr('Sin entrenador'))}${c ? `<small>${esc(coachText(c))}</small>` : ''}</span></button>`).join('')}</div>` : ''}
        ${coach && !coachOpen ? `<p class="dt-cpas"><b>${esc(COACH_BY_ID.get(coach)?.name ?? coach)}</b>${esc(coachText(coach, coachBoosted(team)))}${coachBoosted(team) ? ` <em>${tr('(+50 % por tener 2 o más de su grupo)')}</em>` : ''}</p>` : ''}
        <div class="dt-syns">${synergies()}</div>
        <div class="dt-filter">${['', ...EL_ORDER].map((e) => `<button type="button" data-f="${e}" class="${filter === e ? 'on' : ''}">${e ? elementIcon(e, 16) + esc(tr(e)) : tr('Todos')}</button>`).join('')}<span class="dt-count">${tr('{n} futbolistas', { n: own.length })}</span></div>
        <div class="dt-grid">${list.map((pid) => {
          const inTeam = team.includes(pid), other = !inTeam && fams.has(familyOf(pid));
          return `<button type="button" class="dt-pick${inTeam ? ' in' : ''}${other ? ' lock' : ''}" data-pid="${pid}" ${other ? `title="${esc(tr('Ya tienes otra forma de este futbolista en el equipo'))}"` : ''}>${cardHtml(pid)}<span class="dt-pw">${duelPower(h, pid).toLocaleString()}</span>${inTeam ? `<em>${tr('EN EQUIPO')}</em>` : other ? `<em class="lk">${tr('OTRA FORMA')}</em>` : ''}</button>`;
        }).join('') || `<p class="dt-none">${tr('No tienes futbolistas de este elemento en el Modo Duelo.')}</p>`}</div>
      </div>`;
    refit?.();
  }
  // ---- the tooltip: the footballer's two techniques and his ulti
  const tip = document.createElement('div');
  tip.className = 'dt-tip';
  tip.hidden = true;
  document.body.appendChild(tip);
  const KIND = (): Record<string, string> => ({ ataque: tr('Ataque'), area: tr('Área'), debilitar: tr('Debilitar'), mejora: tr('Mejora'), recuperacion: tr('Recuperación'), postura: tr('Postura'), especial: tr('Especial'), ulti: tr('Ulti') });
  const KIND_COL: Record<string, string> = { ataque: '#ff6a3a', area: '#ff9a1a', debilitar: '#b45aff', mejora: '#3fc46a', recuperacion: '#2fd0b0', postura: '#4f8cff', especial: '#ff4fa0', ulti: '#ffb020' };
  function tipHtml(pid: number) {
    const st = duelStats(h.byId.get(pid) as never);
    // each technique as its card of the match (frame, face, type icon, name, multiplier) and what it does under it
    const part = (idx: 0 | 1 | 'u') => {
      const t = techInfo(pid, idx), ulti = idx === 'u', kind = ulti ? 'ulti' : t.kind;
      const icon = ulti ? (t.area ? 'tipo-area' : 'tipo-ataque') : `tipo-${t.kind}`;
      const mults = ulti
        ? (t.mults.length ? `<span class="m u">${pctOf(t.mults[0])}${t.area ? ` · ${tr('a todos')}` : ''}</span>` : '')
        : t.mults.map((m, i) => `<span class="m"><i>${'★'.repeat(i + 1)}</i>${pctOf(m)}</span>`).join('') + (t.area ? `<span class="m a">${tr('a todos')}</span>` : '');
      const top = ulti ? t.mults[0] : t.mults[t.mults.length - 1];
      const lw = Math.max(...t.tech.split(/\s+/).map((w) => w.length));
      return `<div class="dt-tt${ulti ? ' ulti' : ''}" style="--kc:${KIND_COL[kind] ?? '#4fb3ff'}">
        <div class="dt-mc"><span class="dt-mcf">${h.mug(pid, 62)}</span><img class="dt-mcfr" src="${artUrl(ulti ? 'carta-ulti' : 'carta-r3')}" alt=""><img class="dt-mci" src="${artUrl(icon)}" alt="">
          <span class="dt-mct" style="--lw:${lw}">${esc(t.tech)}</span>${top ? `<span class="dt-mcm">${pctOf(top)}</span>` : ''}${ulti ? '<i class="dt-mcs"></i>' : ''}</div>
        <em class="dt-kind">${esc(KIND()[kind] ?? kind)}</em>
        ${mults ? `<div class="dt-ttm">${mults}</div>` : ''}
        ${t.lines.map((l) => `<p>${l.min > 1 ? `<i>${'★'.repeat(l.min)}+</i>` : '<i class="d">✦</i>'}${esc(l.text)}</p>`).join('')}</div>`;
    };
    return `<header><span class="dt-tmug">${h.mug(pid, 52)}</span><span class="dt-tn"><b>${esc(h.name(pid))}</b><small>${elementIcon(elementOf(pid), 14)}${esc(tr(groupOf(pid)))}</small></span>
      <span class="dt-tst"><span class="hp">${tr('PV')} <b>${st.hp}</b></span><span class="atk">${tr('ATQ')} <b>${st.atk}</b></span></span></header>
      <div class="dt-tcards">${part(0)}${part(1)}${part('u')}</div>
      ${passiveText(pid) ? `<p class="dt-pas"><b>${tr('Pasiva')}</b>${esc(passiveText(pid))}</p>` : ''}`;
  }
  let tipFor = 0;
  el.addEventListener('pointerover', (e) => {
    const t = (e.target as HTMLElement).closest<HTMLElement>('[data-tip]');
    if (!t || (e as PointerEvent).pointerType === 'touch') { tip.hidden = true; tipFor = 0; return; }
    const pid = Number(t.dataset.tip);
    if (pid !== tipFor) { tip.innerHTML = tipHtml(pid); tipFor = pid; }
    tip.hidden = false;
    // in screen pixels; the tooltip is zoomed like the editor, so its left and top are divided by the zoom
    const z = zoomOf(tip), r = t.getBoundingClientRect(), box = tip.getBoundingClientRect(), tw = box.width, th = box.height;
    const right = r.right + 10 + tw < window.innerWidth;
    tip.style.left = `${(right ? r.right + 10 : Math.max(8, r.left - 10 - tw)) / z}px`;
    tip.style.top = `${Math.max(8, Math.min(window.innerHeight - th - 8, r.top)) / z}px`;
  });
  el.addEventListener('pointerleave', () => { tip.hidden = true; tipFor = 0; });
  const close = () => { tip.remove(); back(el); };
  el.addEventListener('click', (e) => {
    if (dragged) { dragged = false; return; } // the end of a drag is not a tap
    const t = e.target as HTMLElement;
    if (t.closest('.dt-back')) { sfx('whoosh'); close(); return; }
    if (t.closest('.dt-save')) {
      if (slots.some((x) => x === null)) return;
      sfx('buy'); save({ pids: slots as number[], coach }); close(); return;
    }
    if (t.closest('.dt-auto')) {
      // the best four, one form each, and the first coach of yours
      const best: number[] = [];
      for (const pid of own) if (best.length < 4 && !best.some((b) => familyOf(b) === familyOf(pid))) best.push(pid);
      best.forEach((p, i) => { slots[i] = p; });
      coach = coach ?? coaches[0] ?? null;
      sfx('powerup'); render(); pop('.dt-slot .dt-card'); return;
    }
    const out = t.closest<HTMLElement>('[data-out]');
    if (out) { const i = Number(out.dataset.out); slots[i] = null; sel = i; sfx('click', 0.8); render(); return; }
    const f = t.closest<HTMLElement>('[data-f]');
    if (f) { filter = f.dataset.f ?? ''; sfx('click'); render(); return; }
    const pc = t.closest<HTMLElement>('[data-pick-coach]');
    if (pc) { coach = (pc.dataset.pickCoach || null) as CoachId | null; coachOpen = false; sfx('click'); render(); pop('.dt-slot.coach .dt-coach'); return; }
    if (t.closest('[data-coach]')) { coachOpen = !coachOpen; sfx('click'); render(); return; }
    const slot = t.closest<HTMLElement>('[data-slot]');
    if (slot) { sel = Number(slot.dataset.slot); coachOpen = false; sfx('click'); render(); return; }
    const pick = t.closest<HTMLElement>('[data-pid]');
    if (pick) {
      const pid = Number(pick.dataset.pid);
      if (pick.classList.contains('lock')) { sfx('error'); pick.animate([{ translate: '-4px 0' }, { translate: '4px 0' }, { translate: '0 0' }], { duration: 220 }); return; }
      const at = slots.indexOf(pid);
      if (at >= 0) { [slots[at], slots[sel]] = [slots[sel], slots[at]]; }
      else slots[sel] = pid;
      sfx('pickup');
      const placed = sel;
      // the next empty slot is chosen next
      const next = slots.indexOf(null);
      sel = next >= 0 ? next : sel;
      render();
      pop(`.dt-slot[data-slot="${placed}"] .dt-card`);
    }
  });
  // ---- drag a footballer from the list or from a place onto a place (author: «que me deje arrastrar a los personajes en
  // mi equipo»): from the list it takes that place (another form of him elsewhere in the team is refused), between two
  // places they swap
  let drag: { pid: number; from: number | null; x0: number; y0: number; ghost: HTMLElement | null; src: HTMLElement } | null = null, dragged = false;
  const slotAt = (x: number, y: number) => (document.elementFromPoint(x, y) as HTMLElement | null)?.closest<HTMLElement>('.dt-form [data-slot]') ?? null;
  el.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 || (e.target as HTMLElement).closest('[data-out]')) return;
    const t = e.target as HTMLElement, pick = t.closest<HTMLElement>('.dt-grid [data-pid]'), slotEl = t.closest<HTMLElement>('.dt-form [data-slot]');
    const pid = pick ? Number(pick.dataset.pid) : slotEl ? slots[Number(slotEl.dataset.slot)] : null;
    if (pid === null || pid === undefined || pick?.classList.contains('lock')) return;
    const src = (pick ?? slotEl)!.querySelector<HTMLElement>('.dt-card') ?? (pick ?? slotEl)!;
    drag = { pid, from: pick ? null : Number(slotEl!.dataset.slot), x0: e.clientX, y0: e.clientY, ghost: null, src };
  });
  el.addEventListener('pointermove', (e) => {
    if (!drag) return;
    if (!drag.ghost) {
      if (Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) < 7) return;
      const r = drag.src.getBoundingClientRect(), g = drag.src.cloneNode(true) as HTMLElement;
      g.className += ' dt-ghost';
      g.style.cssText = `position:fixed;left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height}px;margin:0;z-index:9200;pointer-events:none`;
      document.body.appendChild(g);
      drag.ghost = g; drag.src.classList.add('dt-dragsrc'); tip.hidden = true;
      try { el.setPointerCapture(e.pointerId); } catch { /* the pointer is gone */ }
      sfx('pickup');
    }
    drag.ghost.style.translate = `${e.clientX - drag.x0}px ${e.clientY - drag.y0}px`;
    const over = slotAt(e.clientX, e.clientY);
    for (const s2 of el.querySelectorAll('.dt-form .dt-slot.drop')) if (s2 !== over) s2.classList.remove('drop');
    over?.classList.add('drop');
  });
  const endDrag = (e: PointerEvent) => {
    const d = drag;
    drag = null;
    if (!d?.ghost) return;
    dragged = true;
    d.ghost.remove(); d.src.classList.remove('dt-dragsrc');
    for (const s2 of el.querySelectorAll('.dt-form .dt-slot.drop')) s2.classList.remove('drop');
    const over = slotAt(e.clientX, e.clientY);
    if (!over) return;
    const to = Number(over.dataset.slot);
    if (d.from !== null) { [slots[d.from], slots[to]] = [slots[to], slots[d.from]]; }
    else {
      const at = slots.indexOf(d.pid);
      if (at >= 0) [slots[at], slots[to]] = [slots[to], slots[at]];
      else if (slots.some((x, i) => x !== null && i !== to && familyOf(x) === familyOf(d.pid))) { sfx('error'); return; }
      else slots[to] = d.pid;
    }
    sel = slots.indexOf(null) >= 0 ? slots.indexOf(null) : to;
    sfx('pickup'); render(); pop(`.dt-slot[data-slot="${to}"] .dt-card`);
  };
  el.addEventListener('pointerup', endDrag);
  el.addEventListener('pointercancel', () => { if (drag?.ghost) { drag.ghost.remove(); drag.src.classList.remove('dt-dragsrc'); } drag = null; });
  function pop(q: string) {
    for (const c of el.querySelectorAll<HTMLElement>(q)) c.animate([{ transform: 'scale(.6)', filter: 'brightness(2)' }, { transform: 'scale(1.08)', offset: 0.6 }, { transform: 'scale(1)', filter: 'none' }], { duration: 380, easing: 'cubic-bezier(.2,1.5,.4,1)' });
  }
  let refit: (() => void) | null = null;
  render();
  refit = fit(el, '.dt-box', 1700, 950, [tip]);
  if (nav) go(nav.from, el.querySelector<HTMLElement>('.dt-box'), nav.dir); else sfx('reveal');
}

export const DUEL_STATS_CSS = `
.dt .cc-eg{display:none!important}
.pcard .cc-stats.dt-dstats{display:grid!important;grid-template-columns:1fr 1fr;gap:3px 4px;padding:4px 5px!important;height:auto!important}
.pcard .cc-stats.dt-dstats span{display:flex!important;align-items:baseline;justify-content:space-between;gap:3px;min-width:0;font-size:9px;line-height:1.1;color:#cfe0ff}
.pcard .cc-stats.dt-dstats span small{font-size:8px;font-weight:800;letter-spacing:.02em;opacity:.85;white-space:nowrap}
.pcard .cc-stats.dt-dstats span b{font-weight:900;color:#fff;white-space:nowrap}
.pcard .cc-stats.dt-dstats .hp,.pcard .cc-stats.dt-dstats .atk{flex-direction:column!important;align-items:center!important;gap:0;padding:3px 0 2px;border-radius:6px}
.pcard .cc-stats.dt-dstats .hp{background:linear-gradient(#2fa84a,#0e4a1a);box-shadow:inset 0 0 0 1px #7dff9a66}
.pcard .cc-stats.dt-dstats .atk{background:linear-gradient(#d0501f,#5a1a08);box-shadow:inset 0 0 0 1px #ffb08066}
.pcard .cc-stats.dt-dstats .hp b,.pcard .cc-stats.dt-dstats .atk b{font:900 italic 18px/1 'Arial Black','Segoe UI',sans-serif;color:#fff;-webkit-text-stroke:.7px #000;paint-order:stroke fill;text-shadow:0 1px 0 #000}
.pcard .cc-stats.dt-dstats .hp small,.pcard .cc-stats.dt-dstats .atk small{font-size:9px;color:#fff;opacity:1}
`;

const CSS = `${DUEL_STATS_CSS}
.dt-grid .pcard,.dt-grid .pcard *,.dt-grid .pcard *::before,.dt-grid .pcard *::after{animation-play-state:paused!important}
.dt-grid .dt-pick:hover .pcard,.dt-grid .dt-pick:hover .pcard *,.dt-grid .dt-pick:hover .pcard *::before,.dt-grid .dt-pick:hover .pcard *::after{animation-play-state:running!important}
.dt{position:fixed;inset:0;z-index:8950;display:grid;place-items:center;padding:12px;box-sizing:border-box;font-family:'Segoe UI',system-ui,sans-serif;background:#02040f;overflow:auto}
.dt-bg{position:fixed;inset:-4%;width:108%;height:108%;object-fit:cover;filter:blur(10px) brightness(.4) saturate(1.2);pointer-events:none}
.dt-box{position:relative;width:min(1240px,100%);max-height:calc((100vh - 24px) / var(--z, 1));display:flex;flex-direction:column;gap:10px;padding:14px 16px;box-sizing:border-box;overflow-y:auto;border-radius:18px;background:linear-gradient(#0f2160f2,#060c2af2);border:2px solid #ffd76a99;box-shadow:0 20px 60px #000c;color:#e6ecff}
@keyframes dtIn{from{transform:scale(.94);opacity:0}}
.dt header{display:flex;align-items:center;gap:10px}
.dt h2{margin:0;flex:1;font:900 italic 24px 'Arial Black','Segoe UI',sans-serif;color:#ffe9a8;text-shadow:0 0 12px #ffb020,0 2px 0 #000;letter-spacing:.04em}
.dt-back{width:36px;height:36px;border-radius:50%;border:2px solid #ffd76a;background:#0b1440;color:#ffd76a;font-size:22px;line-height:1;cursor:pointer}
.dt-pow{display:flex;flex-direction:column;align-items:flex-end;line-height:1}
.dt-pow small{font-size:10px;font-weight:800;letter-spacing:.12em;color:#9fb6e8;text-transform:uppercase}
.dt-pow b{font:900 italic 24px 'Arial Black',sans-serif;color:#ffe14a;-webkit-text-stroke:1px #6a2a00;paint-order:stroke fill}
.dt-auto,.dt-save{font:900 14px 'Segoe UI',sans-serif;padding:8px 16px;border-radius:10px;border:2px solid #fff8;cursor:pointer}
.dt-auto{background:linear-gradient(#3f8cff,#173a9a);color:#fff}
.dt-save{background:linear-gradient(#ffb63a,#e0700c);color:#3a1600}
.dt-save:disabled{filter:grayscale(1) brightness(.6);cursor:default}
.dt-form{display:grid;grid-template-columns:repeat(4,minmax(0,176px)) minmax(0,140px);justify-content:center;gap:10px;align-items:end}
.dt-slot{position:relative;display:flex;flex-direction:column;align-items:center;gap:4px;padding:8px 6px 6px;border-radius:14px;background:#0a1440aa;border:2px solid #4fb3ff44;cursor:pointer;transition:border-color .15s,box-shadow .15s,transform .15s}
.dt-slot:hover{transform:translateY(-2px)}
.dt-slot.sel{border-color:#ffd76a;box-shadow:0 0 16px #ffb02088,inset 0 0 12px #ffb02033}
.dt-slot.bench{background:#0a1030aa}
.dt-lbl{font-size:10px;font-weight:900;letter-spacing:.12em;text-transform:uppercase;color:#ffe9a8}
.dt-slot.bench .dt-lbl{color:#9fb6e8}
.dt-empty{display:grid;place-items:center;width:100%;aspect-ratio:3/4;border:2px dashed #ffd76a66;border-radius:10px;color:#ffd76a99;font:900 34px sans-serif;animation:dtEmpty 1.4s ease-in-out infinite}
@keyframes dtEmpty{50%{border-color:#ffd76add;color:#ffd76a}}
.dt-slot:not(.sel) .dt-empty{animation:none}
.dt-out{position:absolute;top:22px;right:6px;width:24px;height:24px;border-radius:50%;border:2px solid #fff;background:#c4102a;color:#fff;font-size:12px;line-height:1;cursor:pointer;z-index:20;box-shadow:0 2px 6px #000a}
.dt-card{position:relative;width:100%;display:flex;flex-direction:column;align-items:center;gap:2px;padding:6px 4px 5px;box-sizing:border-box;border-radius:10px;background:linear-gradient(#1b3a8a,#0b1440);border:2px solid var(--rc);box-shadow:0 0 10px color-mix(in srgb,var(--rc) 45%,transparent)}
.dt-port{display:grid;place-items:center;width:84px;max-width:100%;aspect-ratio:1;overflow:hidden;border-radius:8px;background:radial-gradient(circle at 50% 35%,#4a74d0,#14205a 70%)}
.dt-el{position:absolute;top:4px;left:4px}
.dt-nm{font-size:12px;font-weight:900;color:#fff;max-width:100%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-shadow:0 1px 0 #000}
.dt-st{display:flex;gap:6px;font-size:10px;font-weight:800;color:#cfe0ff}
.dt-st i{font-style:normal}
.dt-coach{display:flex;flex-direction:column;align-items:center;gap:4px;width:100%;padding:6px 4px;box-sizing:border-box;border-radius:10px;background:linear-gradient(#3a2a10,#140c04);border:2px solid #ffd76a88}
.dt-coach img{width:64px;height:64px;object-fit:cover;border-radius:50%;border:2px solid #ffd76a}
.dt-coach i{font-size:40px;font-style:normal}
.dt-coach b{font-size:11px;color:#ffe9a8;text-align:center}
.dt-coaches{display:flex;gap:8px;flex-wrap:wrap;padding:8px;border-radius:12px;background:#0a1030;border:1px solid #ffd76a55}
.dt-coaches button{display:flex;align-items:center;gap:6px;padding:4px 10px 4px 4px;border-radius:30px;border:2px solid #ffd76a55;background:#13245e;color:#fff;font-weight:800;font-size:12px;cursor:pointer}
.dt-coaches button.on{border-color:#ffd76a;box-shadow:0 0 10px #ffb02088}
.dt-coaches img{width:30px;height:30px;border-radius:50%;object-fit:cover}
.dt-coaches i{font-style:normal;font-size:20px}
.dt-coaches button{align-items:flex-start;text-align:left;max-width:300px;border-radius:14px}
.dt-coaches span{display:flex;flex-direction:column;gap:2px}
.dt-coaches small{font-weight:600;font-size:11px;line-height:1.3;color:#cfe0ff}
.dt-ghost{opacity:.92;transform:scale(1.06) rotate(-3deg);filter:drop-shadow(0 12px 18px #000c);transition:none}
.dt-dragsrc{opacity:.35}
.dt-form .dt-slot.drop{outline:3px solid #ffd76a;outline-offset:3px;box-shadow:0 0 22px #ffb020aa}
.dt-form .dt-slot{touch-action:none}
.dt-cpas{margin:6px 0 0;padding:7px 10px;border-radius:10px;background:linear-gradient(90deg,#5a3a0a66,#2a1a0644);border:1px solid #ffd76a88;font-size:12.5px;line-height:1.35;color:#fff3d6}
.dt-cpas b{margin-right:8px;color:#ffd76a}
.dt-cpas em{color:#9fe0ff;font-style:normal}
.dt-syns{display:flex;gap:6px;flex-wrap:wrap;min-height:30px}
.dt-syn{display:inline-flex;align-items:center;gap:5px;padding:4px 10px;border-radius:20px;font-size:12px;background:#13245e;border:1px solid #4fb3ff66;animation:dtSyn .35s cubic-bezier(.2,1.5,.4,1)}
.dt-syn small{color:#ffe9a8;font-weight:700}
.dt-syn.g3,.dt-syn.g4{border-color:#ffd76a;box-shadow:0 0 10px #ffb02055}
.dt-syn.el{border-color:#7dff9a88}
.dt-syn.cb{border-color:#c46aff;background:#2a1450}
.dt-syn.co{border-color:#ffd76a;background:#3a2a10}
@keyframes dtSyn{from{transform:scale(.6);opacity:0}}
.dt-none{font-size:12px;color:#9fb6e8}
.dt-filter{display:flex;gap:6px;flex-wrap:wrap;align-items:center}
.dt-filter button{display:inline-flex;align-items:center;gap:4px;padding:5px 12px;border-radius:20px;border:1px solid #4fb3ff66;background:#0b1440;color:#cfe0ff;font-weight:800;font-size:12px;cursor:pointer}
.dt-filter button.on{background:linear-gradient(#ffb63a,#e0700c);color:#3a1600;border-color:#fff8}
.dt-count{margin-left:auto;font-size:11px;color:#9fb6e8}
.dt-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(158px,1fr));gap:8px;flex:none;padding:4px 2px 8px;min-height:160px}
.dt-pick{position:relative;padding:0;border:0;background:none;cursor:pointer;transition:transform .15s}
.dt-pick:hover{transform:translateY(-3px)}
.dt-pick .dt-card{transition:filter .15s}
.dt-pick.in .dt-card{filter:brightness(.55)}
.dt-pick.lock{cursor:not-allowed}
.dt-pick.lock .dt-card{filter:grayscale(1) brightness(.45)}
.dt-pick em{position:absolute;left:50%;top:38%;translate:-50% -50%;padding:2px 8px;border-radius:6px;font:900 10px 'Segoe UI',sans-serif;font-style:normal;letter-spacing:.06em;background:#2fbf62;color:#fff;box-shadow:0 2px 6px #000a;white-space:nowrap}
.dt-pick em.lk{background:#7a7f93}
.dt-pw{position:absolute;right:4px;top:4px;padding:1px 5px;border-radius:6px;background:#000a;color:#ffe14a;font:900 10px 'Arial Black',sans-serif}
.dt-cc{position:relative;width:100%;display:flex;flex-direction:column;align-items:stretch}
.dt-cc .pcard{width:100%;margin:0;box-sizing:border-box}
.dt-pick.in .dt-cc .pcard{filter:brightness(.55)}
.dt-pick.lock .dt-cc .pcard{filter:grayscale(1) brightness(.45)}
.dt-slot .dt-out{top:24px}
.dt-pw{z-index:3}
.dt-pick em{z-index:3}
.dt-tip{position:fixed;z-index:9100;width:380px;padding:0 0 8px;border-radius:14px;overflow:hidden;background:linear-gradient(#152a6cf9,#081238f9);border:2px solid #ffd76aaa;box-shadow:0 14px 36px #000d,0 0 0 1px #000;color:#e8eeff;font-family:'Segoe UI',system-ui,sans-serif;pointer-events:none;animation:dtTip .18s cubic-bezier(.2,1.4,.4,1)}
@keyframes dtTip{from{opacity:0;transform:translateY(6px) scale(.96)}}
.dt-tip header{display:flex;align-items:center;gap:10px;padding:8px 10px;background:linear-gradient(90deg,#ffd76a26,#0000);border-bottom:1px solid #ffd76a44}
.dt-tmug{width:52px;height:52px;flex:none;display:flex;align-items:center;justify-content:center;overflow:hidden;border-radius:10px;border:2px solid #ffd76a;background:radial-gradient(circle at 50% 35%,#4a74d0,#14205a 70%)}
.dt-tmug>*{flex:none;margin:0!important}
.dt-tn{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}
.dt-tn b{font:900 16px 'Segoe UI',sans-serif;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.dt-tn small{display:inline-flex;align-items:center;gap:4px;font-size:11px;color:#9fb6e8}
.dt-tst{display:flex;flex-direction:column;gap:3px;align-items:stretch}
.dt-tst span{padding:1px 7px;border-radius:6px;font-size:10px;font-weight:900;color:#fff;text-align:right}
.dt-tst b{font:900 italic 13px 'Arial Black',sans-serif}
.dt-tst .hp{background:linear-gradient(#2fbf62,#0f6a32)}.dt-tst .atk{background:linear-gradient(#ff7a3a,#a3260a)}
.dt-pas{margin:8px 10px 0;padding:6px 9px;border-radius:9px;background:linear-gradient(90deg,#5a2a9a66,#2a1a5a44);border:1px solid #c49aff88;font-size:12.5px;line-height:1.3;color:#f0e6ff}
.dt-pas b{display:inline-block;margin-right:6px;padding:0 6px;border-radius:6px;background:#c49aff;color:#2a0a4a;font-size:11px;letter-spacing:.06em;text-transform:uppercase}
.dt-tcards{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;padding:8px 10px 0;align-items:start}
.dt-tt{display:flex;flex-direction:column;align-items:center;gap:4px;min-width:0}
.dt-mc{position:relative;width:100%;aspect-ratio:263/360;container-type:inline-size;filter:drop-shadow(0 4px 6px #000c);animation:dtMc .35s cubic-bezier(.2,1.5,.4,1) backwards}
.dt-tt:nth-child(2) .dt-mc{animation-delay:.05s}.dt-tt:nth-child(3) .dt-mc{animation-delay:.1s}
@keyframes dtMc{from{transform:translateY(10px) rotate(-6deg) scale(.8);opacity:0}}
.dt-mcf{position:absolute;left:21%;top:16%;width:58%;height:47%;display:flex;justify-content:center;align-items:center;overflow:hidden;background:radial-gradient(circle at 50% 38%,#4a74d0,#101a44 75%)}
.dt-mcf>*{flex:none;margin:0!important;image-rendering:pixelated}
.dt-mcfr{position:absolute;inset:0;width:100%;height:100%}
.dt-mci{position:absolute;left:12%;top:9%;width:26%;z-index:2;filter:drop-shadow(0 1px 2px #000)}
.dt-mct{position:absolute;left:13%;right:13%;top:61%;min-height:18%;box-sizing:border-box;display:grid;place-items:center;text-align:center;line-height:1.05;--k:min(1,calc(9.5 / var(--lw,1)));font-size:calc(11.5cqw * var(--k));font-weight:900;color:#fff;text-shadow:0 1px 0 #000,0 0 3px #000;background:linear-gradient(#0000,#08103ad0 22%,#08103af0 78%,#0000)}
.dt-mcm{position:absolute;right:17%;top:15%;padding:0 3cqw;border-radius:4cqw;background:#000c;color:#ffe08a;font-size:9.5cqw;font-weight:900;z-index:2}
.dt-mcs{position:absolute;inset:6% 8%;background:linear-gradient(115deg,#fff0 35%,#fffa 50%,#fff0 65%) -150% 0/250% 100% no-repeat;mix-blend-mode:overlay;animation:dtShine 2.4s ease-in-out infinite;pointer-events:none;z-index:3}
@keyframes dtShine{to{background-position:150% 0}}
.dt-kind{padding:1px 7px;border-radius:5px;background:var(--kc);color:#10081a;font:900 9px 'Segoe UI',sans-serif;font-style:normal;letter-spacing:.08em;text-transform:uppercase}
.dt-ttm{display:flex;flex-wrap:wrap;justify-content:center;gap:3px}
.dt-ttm .m{padding:0 4px;border-radius:4px;background:#ffffff14;border:1px solid #ffffff22;font-size:10px;font-weight:900;color:#fff;white-space:nowrap}
.dt-ttm .m i{font-style:normal;color:#ffd23a;margin-right:2px;font-size:8px}
.dt-ttm .m.u{background:#ffb02033;border-color:#ffb020;color:#ffe14a}
.dt-ttm .m.a{background:#ff9a1a33;border-color:#ff9a1a88}
.dt-tt p{display:flex;gap:4px;margin:0;font-size:10.5px;line-height:1.25;align-self:stretch}
.dt-tt p i{flex:none;font-style:normal;color:#ffd23a;font-weight:900;font-size:9px;padding-top:1px}
.dt-tt p i.d{color:var(--kc)}
@media (max-width:640px){.dt-form{grid-template-columns:repeat(3,minmax(0,1fr))}.dt h2{font-size:18px}.dt-pow b{font-size:18px}}
`;
