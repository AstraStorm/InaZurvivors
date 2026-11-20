/**
 * Modo Duelo: its two boards. The tier list ranks the mode's 50 footballers by how often their team won in thousands of
 * CPU-against-CPU matches (tools/duel_tiers.ts writes src/data/duelTiers.json): S, A, B and C, yours lit and the rest
 * dimmed, the techniques of each one on hovering him. The ranking lists who won most against the CPU this week or of
 * all time (the server's own wins: duel_runs).
 */
import { tr } from '../i18n/i18n';
import { sfx } from '../game/sfx';
import { DUEL_BY_ID } from '../systems/duel/cards';
import { artUrl } from './duelArt';
import { elementIcon } from './elements';
import { techInfo } from './duelText';
import TIERS from '../data/duelTiers.json';
import type { DuelHubHost, DuelNav } from './duelHub';
import { fit, go } from './duelNav';

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
const TIER_COL: Record<string, [string, string]> = { S: ['#ff4a6a', '#7a0a2a'], A: ['#ffb020', '#7a4a00'], B: ['#3fc46a', '#0a4a22'], C: ['#4f8cff', '#0a2a6a'] };

function shell(title: string, body: string, back: (from: HTMLElement) => void, nav?: DuelNav) {
  document.querySelector('.dbo:not(.dn-out)')?.remove();
  const el = document.createElement('div');
  el.className = 'dbo';
  el.innerHTML = `<style>${CSS}</style><img class="dbo-bg" src="${artUrl('mesa-horizontal')}" alt="">
    <div class="dbo-box"><header><button class="dbo-back" type="button" aria-label="${tr('Volver')}">‹</button><h2>${title}</h2></header>${body}</div>`;
  document.body.appendChild(el);
  el.querySelector('.dbo-back')!.addEventListener('click', () => { sfx('whoosh'); document.querySelector('.dbo-tip')?.remove(); back(el); });
  fit(el, '.dbo-box', 1700, 950);
  if (nav) go(nav.from, el.querySelector<HTMLElement>('.dbo-box'), nav.dir); else sfx('reveal');
  return el;
}

export function openDuelTiers(h: DuelHubHost, back: (from: HTMLElement) => void, nav?: DuelNav) {
  const owned = new Set(h.owned);
  let mine = false;
  const rows = (TIERS.players as { id: number; tier: string; wr: number; games: number }[]).filter((p) => DUEL_BY_ID.has(p.id) && h.byId.has(p.id));
  const body = () => `<div class="dbo-prov"><b>${tr('PROVISIONAL')}</b><span>${tr('Según {n} partidas de la CPU contra la CPU, en Difícil: cuántas ganó el equipo de cada futbolista. Las tierlists de verdad las hacéis vosotros.', { n: TIERS.matches.toLocaleString() })}</span>
      ${h.makeTierlist ? `<button type="button" class="dbo-make" data-make>${tr('Crea tu tierlist del duelo')}</button>` : ''}</div>
    <div class="dbo-chips"><button type="button" data-mine="0" class="${mine ? '' : 'on'}">${tr('Todos')}</button><button type="button" data-mine="1" class="${mine ? 'on' : ''}">${tr('Los míos')}</button></div>
    ${['S', 'A', 'B', 'C'].map((t) => {
      const list = rows.filter((r) => r.tier === t && (!mine || owned.has(r.id)));
      return `<div class="dbo-tier" style="--c1:${TIER_COL[t][0]};--c2:${TIER_COL[t][1]}"><b class="dbo-tl">${t}</b><div class="dbo-row">${list.map((r, i) => `<div class="dbo-p${owned.has(r.id) ? ' own' : ''}" data-tip="${r.id}" style="--k:${i}">
          <span class="dbo-mug">${h.mug(r.id, 56)}</span><span class="dbo-el">${elementIcon(h.byId.get(r.id)?.element ?? 'Neutro', 14)}</span>
          <small>${esc(h.name(r.id))}</small><em>${r.wr}%</em></div>`).join('') || `<span class="dbo-none">${tr('Ninguno')}</span>`}</div></div>`;
    }).join('')}`;
  const el = shell(tr('Tier list del duelo'), `<div class="dbo-tiers">${body()}</div>`, back, nav);
  const box = el.querySelector<HTMLElement>('.dbo-tiers')!;
  box.addEventListener('click', (e) => {
    if ((e.target as HTMLElement).closest('[data-make]')) { sfx('click'); el.remove(); tip.remove(); h.makeTierlist?.(); return; }
    const b = (e.target as HTMLElement).closest<HTMLElement>('[data-mine]');
    if (!b) return;
    mine = b.dataset.mine === '1'; sfx('click'); box.innerHTML = body();
  });
  // the techniques of a footballer on hovering him
  const tip = document.createElement('div');
  tip.className = 'dbo-tip';
  tip.hidden = true;
  document.body.appendChild(tip);
  el.addEventListener('pointerover', (e) => {
    const t = (e.target as HTMLElement).closest<HTMLElement>('[data-tip]');
    if (!t || (e as PointerEvent).pointerType === 'touch') { tip.hidden = true; return; }
    const pid = Number(t.dataset.tip);
    tip.innerHTML = `<b>${esc(h.name(pid))}</b>${([0, 1, 'u'] as const).map((idx) => { const i = techInfo(pid, idx); return `<p><i>${idx === 'u' ? tr('Ulti') : '◆'}</i> ${esc(i.tech)}</p>`; }).join('')}`;
    tip.hidden = false;
    const r = t.getBoundingClientRect();
    tip.style.left = `${Math.min(window.innerWidth - 230, r.right + 8)}px`;
    tip.style.top = `${Math.max(8, r.top)}px`;
  });
  el.addEventListener('pointerleave', () => { tip.hidden = true; });
}

export function openDuelRanking(h: DuelHubHost, back: (from: HTMLElement) => void, nav?: DuelNav) {
  let week = true;
  const el = shell(tr('Ranking del duelo'), `<div class="dbo-chips"><button type="button" data-week="1" class="on">${tr('Esta semana')}</button><button type="button" data-week="0">${tr('Siempre')}</button></div><div class="dbo-list"></div>`, back, nav);
  const list = el.querySelector<HTMLElement>('.dbo-list')!;
  const load = async () => {
    list.innerHTML = `<p class="dbo-sub">${tr('Cargando…')}</p>`;
    const rows = await (h.ranking?.(week) ?? Promise.resolve(null)).catch(() => null);
    if (!rows) { list.innerHTML = `<p class="dbo-sub">${tr('El ranking necesita conexión y una cuenta. Las victorias contra la CPU cuentan cuando las paga el servidor.')}</p>`; return; }
    if (!rows.length) { list.innerHTML = `<p class="dbo-sub">${tr('Todavía nadie ha ganado esta semana. ¡Sé el primero!')}</p>`; return; }
    const me = (h.me ?? '').toLowerCase();
    // each one as on the game's other boards: his icon in his frame, his banner behind, his name (golden with the key)
    const plate = await (h.rankPlates?.(rows.map((r) => String(r.username))) ?? Promise.resolve(null)).catch(() => null);
    list.innerHTML = rows.map((r, i) => {
      const p = plate?.(String(r.username), r.avatar);
      return `<div class="dbo-rank${r.pos <= 3 ? ` top t${r.pos}` : ''}${String(r.username).toLowerCase() === me ? ' me' : ''}${p?.ribbon ? ' has-pn' : ''}" style="--k:${i}">${p?.ribbon ?? ''}
      <b class="dbo-pos">${r.pos <= 3 ? ['🥇', '🥈', '🥉'][r.pos - 1] : r.pos}</b>${p ? `<span class="dbo-face">${p.face}</span>` : ''}<span class="dbo-name"><b class="${p?.nameCls ?? ''}">${esc(String(r.username))}</b>${p?.clan ?? ''}</span><span class="dbo-wins"><b>${Number(r.wins)}</b> ${tr('victorias')}</span></div>`;
    }).join('');
  };
  el.querySelector('.dbo-chips')!.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLElement>('[data-week]');
    if (!b) return;
    week = b.dataset.week === '1';
    for (const x of el.querySelectorAll('[data-week]')) x.classList.toggle('on', x === b);
    sfx('click'); void load();
  });
  void load();
}

const CSS = `
.dbo{position:fixed;inset:0;z-index:8950;display:grid;place-items:start center;overflow:auto;padding:14px;box-sizing:border-box;font-family:'Segoe UI',system-ui,sans-serif;background:#02040f;color:#e6ecff}
.dbo-bg{position:fixed;inset:-4%;width:108%;height:108%;object-fit:cover;filter:blur(8px) brightness(.4) saturate(1.2);pointer-events:none}
.dbo-box{position:relative;width:min(1000px,100%);padding:14px 16px 18px;box-sizing:border-box;border-radius:18px;background:linear-gradient(#0f2160f2,#060c2af2);border:2px solid #ffd76a99;box-shadow:0 20px 60px #000c;animation:dbIn .3s cubic-bezier(.2,1.3,.4,1)}
@keyframes dbIn{from{transform:translateY(14px);opacity:0}}
.dbo header{display:flex;align-items:center;gap:12px;margin-bottom:6px}
.dbo-back{width:38px;height:38px;border-radius:50%;border:2px solid #ffd76a;background:#0b1440;color:#ffd76a;font-size:22px;line-height:1;cursor:pointer}
.dbo h2{margin:0;font:900 italic 26px 'Arial Black','Segoe UI',sans-serif;color:#ffe9a8;text-shadow:0 0 12px #ffb020,0 2px 0 #000}
.dbo-sub{margin:4px 0 10px;color:#b9c7ef;font-size:13px}
.dbo-chips{display:flex;gap:8px;margin-bottom:10px}
.dbo-chips button{padding:6px 16px;border-radius:20px;border:1px solid #4fb3ff66;background:#0b1440;color:#cfe0ff;font-weight:800;cursor:pointer}
.dbo-chips button.on{background:linear-gradient(#ffb63a,#e0700c);color:#3a1600;border-color:#fff8}
.dbo-tier{display:flex;align-items:stretch;margin-bottom:8px;border-radius:12px;overflow:hidden;border:1px solid color-mix(in srgb,var(--c1) 60%,transparent);background:#0a1030aa}
.dbo-tl{flex:none;display:grid;place-items:center;width:64px;font:900 italic 40px 'Arial Black',sans-serif;color:#fff;background:linear-gradient(135deg,var(--c1),var(--c2));text-shadow:0 3px 0 #0008}
.dbo-row{display:flex;flex-wrap:wrap;gap:6px;padding:8px}
.dbo-p{position:relative;display:flex;flex-direction:column;align-items:center;width:76px;padding:4px 2px 3px;border-radius:10px;background:#13245e;border:2px solid #ffffff22;opacity:.55;animation:dbP .35s cubic-bezier(.2,1.4,.4,1) backwards;animation-delay:calc(var(--k) * .03s);cursor:default}
@keyframes dbP{from{transform:scale(.6);opacity:0}}
.dbo-p.own{opacity:1;border-color:var(--c1);box-shadow:0 0 10px color-mix(in srgb,var(--c1) 50%,transparent)}
.dbo-p:hover{transform:translateY(-3px);opacity:1}
.dbo-mug{width:56px;height:56px;display:flex;align-items:center;justify-content:center;overflow:hidden;border-radius:8px;background:radial-gradient(circle at 50% 35%,#4a74d0,#14205a 70%)}
.dbo-mug>*{flex:none;margin:0!important}
.dbo-prov{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin:4px 0 10px;padding:8px 12px;border-radius:12px;background:#3a2a10cc;border:1px solid #ffd76a88}
.dbo-prov b{padding:2px 8px;border-radius:6px;background:#ffb020;color:#3a1600;font-size:11px;letter-spacing:.1em}
.dbo-prov span{flex:1;min-width:200px;font-size:12px;color:#ffe9a8}
.dbo-make{font:900 13px 'Segoe UI',sans-serif;padding:7px 14px;border-radius:10px;border:2px solid #fff;background:linear-gradient(#ffb63a,#e0700c);color:#3a1600;cursor:pointer}
.dbo-el{position:absolute;top:3px;left:3px}
.dbo-p small{font-size:10px;font-weight:800;max-width:72px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.dbo-p em{font-style:normal;font-size:10px;font-weight:900;color:#ffe14a}
.dbo-none{font-size:12px;color:#9fb6e8;align-self:center;padding:0 6px}
.dbo-tip{position:fixed;z-index:9100;width:220px;padding:8px 10px;border-radius:10px;background:#081238f7;border:2px solid #ffd76a99;color:#e8eeff;font:12px 'Segoe UI',sans-serif;pointer-events:none;box-shadow:0 8px 24px #000c}
.dbo-tip b{display:block;margin-bottom:4px;color:#ffe9a8}
.dbo-tip p{margin:2px 0}
.dbo-tip i{font-style:normal;color:#ffd23a;font-weight:900}
.dbo-list{display:flex;flex-direction:column;gap:6px}
.dbo-rank{position:relative;overflow:hidden;display:flex;align-items:center;gap:12px;min-height:56px;padding:8px 14px;border-radius:12px;background:#13245e;border:1px solid #4fb3ff44;animation:dbP .35s cubic-bezier(.2,1.4,.4,1) backwards;animation-delay:calc(var(--k) * .03s)}
.dbo-rank>*:not(.pn-ribbon){position:relative;z-index:1}
.dbo-rank.has-pn .pn-ribbon{opacity:.55}
.dbo-face{flex:none;display:grid;place-items:center;width:46px;height:46px}
.dbo-name{display:flex;align-items:center;gap:8px;min-width:0}
.dbo-name b{font-weight:900;font-size:15px;text-shadow:0 1px 2px #000}
.dbo-rank.top{background:linear-gradient(90deg,#3a2a10,#13245e);border-color:#ffd76a}
.dbo-rank.t1{box-shadow:0 0 18px #ffb02066}
.dbo-rank.me{outline:2px solid #7dff9a}
.dbo-pos{width:40px;text-align:center;font:900 italic 20px 'Arial Black',sans-serif;color:#ffe9a8}
.dbo-name{flex:1}
.dbo-wins{color:#cfe0ff;font-size:12px}
.dbo-wins b{font:900 italic 18px 'Arial Black',sans-serif;color:#ffe14a}
`;
