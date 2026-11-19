/**
 * Modo Duelo: the story mode's screens (story.ts holds the chapters). The map: the three seasons as tabs, each with its
 * chapters on a path (cleared ✓, open glowing, locked 🔒) and a fourth season teased. A chapter opens its scene: the
 * speakers talk in turns (portrait on your side or the rival's, the text typed out, tap to go on, «Saltar»), then the
 * two teams face each other («¡A jugar!»), the match, and if won the closing scene and the next chapter unlocked. A
 * story match pays as a match against the CPU at the chapter's level (the server's ticket and daily cap).
 */
import { tr } from '../i18n/i18n';
import { sfx } from '../game/sfx';
import { COACH_BY_ID } from '../data/coaches';
import { STORY, STORY_CHAPTERS, storyOpen, storyTeams, type StoryChapter, type StoryLine } from '../systems/duel/story';
import { artUrl } from './duelArt';
import { DUEL_STATS_CSS, duelCardFace } from './duelTeam';
import { fit, go } from './duelNav';
import type { DuelHubHost, DuelNav } from './duelHub';
import type { DuelSummary } from './duelMatch';

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
const LEVEL = () => ({ facil: tr('Fácil'), normal: tr('Normal'), dificil: tr('Difícil') } as Record<string, string>);

/** the story's host: the hub's, plus the chapters cleared and saving a new one */
export interface StoryHost extends DuelHubHost {
  story: string[];
  storyCleared(id: string): void;
}

export function openDuelStory(h: StoryHost, back: (from: HTMLElement) => void, nav?: DuelNav, season?: number, fresh?: string) {
  document.querySelector('.dst:not(.dn-out)')?.remove();
  const cleared = h.story;
  const cur = STORY_CHAPTERS.find((c) => !cleared.includes(c.id)) ?? STORY_CHAPTERS[STORY_CHAPTERS.length - 1];
  let sn = season ?? Number(cur.id[0]);
  const el = document.createElement('div');
  el.className = 'dst';
  const lead = (c: StoryChapter) => c.foe[0];
  const body = () => {
    const S = STORY.find((x) => x.n === sn)!;
    const done = S.chapters.filter((c) => cleared.includes(c.id)).length;
    return `<nav class="dst-tabs">${STORY.map((x) => {
      const ok = storyOpen(cleared, x.chapters[0].id), all = x.chapters.every((c) => cleared.includes(c.id));
      return `<button type="button" data-s="${x.n}" class="${x.n === sn ? 'on' : ''}${ok ? '' : ' locked'}" style="--c1:${x.c1};--c2:${x.c2}"><small>${tr('Temporada {n}', { n: x.n })}</small><b>${esc(tr(x.title))}</b>${all ? '<em>✓</em>' : ok ? '' : '<em>🔒</em>'}</button>`;
    }).join('')}<button type="button" class="locked soon" style="--c1:#3fc46a;--c2:#0a4a22"><small>${tr('Temporada {n}', { n: 4 })}</small><b>Inazuma Eleven GO</b><em>${tr('Pronto')}</em></button></nav>
      <section class="dst-season" style="--c1:${S.c1};--c2:${S.c2}">
        <header><h2>${esc(tr(S.title))}</h2><span>${esc(tr(S.sub))}</span><i>${done}/${S.chapters.length}</i></header>
        <div class="dst-path">${S.chapters.map((c, i) => {
          const ok = storyOpen(cleared, c.id), won = cleared.includes(c.id), boss = !!c.boss && i === S.chapters.length - 1;
          return `${i ? `<i class="dst-link${ok ? ' on' : ''}"></i>` : ''}<button type="button" class="dst-ch${won ? ' won' : ok ? ' open' : ' locked'}${boss ? ' boss' : ''}${c.id === fresh ? ' fresh' : ''}" data-c="${c.id}" style="--k:${i}" ${ok ? '' : 'disabled'}>
            <span class="dst-crest">${ok ? h.mug(lead(c), 96) : '<b>?</b>'}</span>
            <small>${tr('Capítulo {n}', { n: c.id })}</small><b>${ok ? esc(tr(c.title)) : '???'}</b>
            <span class="dst-meta">${ok ? `<em class="lv ${c.level}">${LEVEL()[c.level]}</em>${boss ? `<em class="bs">${tr('JEFE')}</em>` : ''}` : ''}</span>
            ${won ? '<i class="dst-ok">✓</i>' : ok ? `<i class="dst-play">${tr('JUGAR')}</i>` : '<i class="dst-lock">🔒</i>'}
          </button>`;
        }).join('')}</div>
      </section>
      <p class="dst-note">${tr('Juegas con el equipo de la historia, que crece capítulo a capítulo. Cada victoria paga como un duelo contra la CPU.')}</p>`;
  };
  el.innerHTML = `<style>${CSS}</style><img class="dst-bg" src="${artUrl('mesa-horizontal')}" alt="">
    <div class="dst-box"><header class="dst-head"><button class="dst-back" type="button" aria-label="${tr('Volver')}">‹</button><h1>${tr('MODO HISTORIA')}</h1>
      <span class="dst-prog"><small>${tr('Capítulos')}</small><b>${cleared.length}/${STORY_CHAPTERS.length}</b></span></header><div class="dst-body">${body()}</div></div>`;
  document.body.appendChild(el);
  fit(el, '.dst-box', 1700, 950);
  if (nav) go(nav.from, el.querySelector<HTMLElement>('.dst-box'), nav.dir); else sfx('reveal');
  el.querySelector('.dst-back')!.addEventListener('click', () => { sfx('whoosh'); back(el); });
  el.querySelector('.dst-body')!.addEventListener('click', (e) => {
    const t = e.target as HTMLElement;
    const tab = t.closest<HTMLElement>('[data-s]');
    if (tab) {
      if (tab.classList.contains('locked')) { sfx('error'); return; }
      sfx('click'); sn = Number(tab.dataset.s); el.querySelector('.dst-body')!.innerHTML = body(); return;
    }
    const ch = t.closest<HTMLElement>('[data-c]');
    if (!ch || ch.hasAttribute('disabled')) return;
    sfx('click');
    const c = STORY_CHAPTERS.find((x) => x.id === ch.dataset.c)!;
    scene(h, c, c.intro, () => versus(h, c, () => play(h, c, back)), () => {});
  });
}

/** who speaks: a footballer's face and name, or a coach's portrait and name */
function speaker(h: DuelHubHost, who: StoryLine['who']) {
  if (typeof who === 'number') return { face: h.mug(who, 180), name: h.name(who) };
  const art = h.coachArt(who);
  return { face: art ? `<img src="${art}" alt="">` : '📋', name: COACH_BY_ID.get(who)?.name ?? who };
}

/** a scene: the lines in turns, typed out; tap to finish the line or go on. `done` after the last one (or «Saltar») */
function scene(h: DuelHubHost, c: StoryChapter, lines: StoryLine[], done: () => void, cancel: () => void) {
  const el = document.createElement('div');
  el.className = 'dsc';
  const mine = (who: StoryLine['who']) => (typeof who === 'number' ? c.you.includes(who) : who === c.youCoach);
  el.innerHTML = `<style>${CSS}</style><img class="dst-bg" src="${artUrl('mesa-horizontal')}" alt="">
    <div class="dsc-top"><small>${tr('Capítulo {n}', { n: c.id })}</small><b>${esc(tr(c.title))}</b><button type="button" class="dsc-skip">${tr('Saltar')} ⏭</button><button type="button" class="dsc-x" aria-label="${tr('Volver')}">✕</button></div>
    <div class="dsc-stage"><div class="dsc-who"></div><div class="dsc-box"><b class="dsc-name"></b><p class="dsc-text"></p><i class="dsc-next">▼</i></div></div>`;
  document.body.appendChild(el);
  let i = -1, typing = 0, full = '';
  const text = el.querySelector<HTMLElement>('.dsc-text')!;
  const next = () => {
    if (typing) { window.clearInterval(typing); typing = 0; text.textContent = full; return; }
    i++;
    if (i >= lines.length) { el.remove(); done(); return; }
    const L = lines[i], sp = speaker(h, L.who), side = mine(L.who) ? 'me' : 'foe';
    el.querySelector('.dsc-stage')!.className = `dsc-stage ${side}`;
    const who = el.querySelector<HTMLElement>('.dsc-who')!;
    who.innerHTML = `<span class="dsc-face">${sp.face}</span>`;
    who.animate([{ opacity: 0, transform: `translateX(${side === 'me' ? -40 : 40}px) scale(.9)` }, { opacity: 1, transform: 'none' }], { duration: 260, easing: 'cubic-bezier(.2,1.3,.4,1)' });
    el.querySelector('.dsc-name')!.textContent = sp.name;
    full = tr(L.text); text.textContent = '';
    let k = 0;
    sfx('click');
    typing = window.setInterval(() => {
      k += 2; text.textContent = full.slice(0, k);
      if (k >= full.length) { window.clearInterval(typing); typing = 0; }
    }, 22);
  };
  el.querySelector('.dsc-stage')!.addEventListener('click', next);
  el.querySelector('.dsc-skip')!.addEventListener('click', (e) => { e.stopPropagation(); window.clearInterval(typing); sfx('whoosh'); el.remove(); done(); });
  el.querySelector('.dsc-x')!.addEventListener('click', (e) => { e.stopPropagation(); window.clearInterval(typing); sfx('whoosh'); el.remove(); cancel(); });
  next();
}

/** the two teams face each other before the match */
function versus(h: DuelHubHost, c: StoryChapter, go_: () => void) {
  const el = document.createElement('div');
  el.className = 'dsv';
  const card = (pid: number, i: number, side: 0 | 1) => `<div class="dsv-c s${side}${side === 0 && c.joins?.includes(pid) ? ' new' : ''}${side === 1 && c.boss ? ' boss' : ''}${i === 3 ? ' bench' : ''}" style="--i:${i}">
      ${duelCardFace(h, pid) || h.mug(pid, 120)}${side === 0 && c.joins?.includes(pid) ? `<em>${tr('¡SE UNE!')}</em>` : ''}</div>`;
  el.innerHTML = `<style>${DUEL_STATS_CSS}${CSS}</style><img class="dst-bg" src="${artUrl('mesa-horizontal')}" alt="">
    <div class="dsv-box"><div class="dsv-side"><h3>${tr('Tu equipo')}</h3><div class="dsv-row">${c.you.map((p, i) => card(p, i, 0)).join('')}</div></div>
      <b class="dsv-vs">VS</b>
      <div class="dsv-side foe"><h3>${esc(c.rival)}${c.boss ? ` <em>${tr('JEFE')}</em>` : ''}</h3><div class="dsv-row">${c.foe.map((p, i) => card(p, i, 1)).join('')}</div></div>
      <div class="dsv-go"><span class="lv ${c.level}">${LEVEL()[c.level]}</span><button type="button" class="dsv-play">${tr('¡A jugar!')} ▶</button></div></div>`;
  document.body.appendChild(el);
  // the rival's cards show its PV and ATQ as the chapter makes them
  const foe = storyTeams(h.byId, c)[1].units;
  el.querySelectorAll('.dsv-c.s1').forEach((card, i) => {
    const hp = card.querySelector('.hp b'), atk = card.querySelector('.atk b');
    if (hp && foe[i]) hp.textContent = String(foe[i].stats.hp);
    if (atk && foe[i]) atk.textContent = String(foe[i].stats.atk);
  });
  fit(el, '.dsv-box', 1500, 900);
  sfx('reveal');
  el.querySelector('.dsv-play')!.addEventListener('click', () => { sfx('click'); el.remove(); go_(); });
}

/** the chapter's match; won: the closing scene, the chapter saved and the map with the next one open */
function play(h: StoryHost, c: StoryChapter, back: (from: HTMLElement) => void) {
  const map = document.querySelector<HTMLElement>('.dst');
  map?.remove();
  const teams = storyTeams(h.byId, c);
  const ticket = h.begin ? h.begin(c.level, { team: c.you, coach: c.youCoach, rival: c.foe, chapter: c.id }).catch(() => null) : Promise.resolve(null);
  void Promise.all([import('./duelMatch'), ticket]).then(([{ openDuelMatch }, t]) => {
    openDuelMatch({
      ...h,
      reward: (won: boolean, _tut: boolean, stats: DuelSummary) => h.pay?.(won, false, stats, t, c.level) ?? Promise.resolve(null),
      done: (won: boolean) => {
        h.finished(won, false);
        const first = won && !h.story.includes(c.id);
        if (first) { h.story = [...h.story, c.id]; h.storyCleared(c.id); }
        const reopen = () => {
          const next = STORY_CHAPTERS[STORY_CHAPTERS.indexOf(c) + 1];
          openDuelStory(h, back, undefined, Number((first && next ? next : c).id[0]), first ? next?.id : undefined);
          if (first && STORY.find((x) => x.chapters.includes(c))?.chapters.at(-1) === c) seasonDone(Number(c.id[0]));
        };
        if (won) scene(h, c, c.outro, reopen, reopen); else reopen();
      },
    }, { teams, level: c.level, story: { rival: c.rival } });
  });
}

/** the banner when a season's last chapter is won */
function seasonDone(n: number) {
  const S = STORY.find((x) => x.n === n);
  if (!S) return;
  const el = document.createElement('div');
  el.className = 'dsd';
  el.innerHTML = `<style>${CSS}</style><div style="--c1:${S.c1};--c2:${S.c2}"><small>${tr('Temporada {n}', { n })}</small><b>${esc(tr(S.title))}</b><em>${tr('¡COMPLETADA!')}</em></div>`;
  document.body.appendChild(el);
  sfx('legend');
  el.addEventListener('click', () => el.remove());
  window.setTimeout(() => el.remove(), 3600);
}

const CSS = `
.dst,.dsc,.dsv{position:fixed;inset:0;z-index:8950;overflow:auto;font-family:'Segoe UI',system-ui,sans-serif;background:#02040f;color:#e6ecff}
.dsc,.dsv{z-index:9100}
.dst-bg{position:fixed;inset:-4%;width:108%;height:108%;object-fit:cover;filter:blur(6px) brightness(.35) saturate(1.3);pointer-events:none}
.dst-box{position:relative;max-width:1180px;margin:0 auto;padding:14px 18px 24px;box-sizing:border-box;min-height:calc(100vh / var(--z,1));display:flex;flex-direction:column;justify-content:center;gap:14px}
.dst-head{display:flex;align-items:center;gap:12px}
.dst-back{width:44px;height:44px;flex:none;border-radius:50%;border:2px solid #ffd76a;background:#0b1440cc;color:#ffd76a;font-size:26px;line-height:1;cursor:pointer}
.dst-head h1{flex:1;margin:0;text-align:center;font:900 italic clamp(28px,5vw,54px)/1 'Arial Black',sans-serif;letter-spacing:.05em;background:linear-gradient(#fff6c8,#ffd23a 45%,#ff8a1a 55%,#ffe9a8);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;filter:drop-shadow(0 4px 0 #6a2a00)}
.dst-prog{display:flex;flex-direction:column;align-items:center;padding:6px 14px;border-radius:12px;background:#0b1440cc;border:2px solid #ffd76a88;line-height:1}
.dst-prog small{font-size:10px;font-weight:900;letter-spacing:.12em;color:#9fb6e8;text-transform:uppercase}
.dst-prog b{font:900 italic 24px 'Arial Black',sans-serif;color:#ffe14a}
.dst-tabs{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}
.dst-tabs button{position:relative;display:flex;flex-direction:column;align-items:flex-start;gap:2px;padding:10px 14px;border-radius:14px;border:2px solid #ffffff44;background:linear-gradient(135deg,var(--c1),var(--c2));color:#fff;font:inherit;text-align:left;cursor:pointer;opacity:.6;transition:transform .15s,opacity .15s}
.dst-tabs button.on{opacity:1;transform:translateY(-3px);box-shadow:0 0 0 2px #fff,0 10px 24px #000a}
.dst-tabs button.locked{filter:grayscale(.8) brightness(.6);cursor:default}
.dst-tabs small{font-size:10px;font-weight:900;letter-spacing:.12em;text-transform:uppercase;opacity:.85}
.dst-tabs b{font:900 italic 16px/1.1 'Arial Black',sans-serif}
.dst-tabs em{position:absolute;top:8px;right:10px;font-style:normal;font-weight:900;font-size:13px}
.dst-season{padding:16px;border-radius:20px;background:linear-gradient(160deg,color-mix(in srgb,var(--c1) 30%,#0b1440ee),#060c2aee);border:2px solid color-mix(in srgb,var(--c1) 70%,#fff);box-shadow:0 14px 40px #000a}
.dst-season header{display:flex;align-items:baseline;gap:12px;margin-bottom:12px}
.dst-season h2{margin:0;font:900 italic 28px 'Arial Black',sans-serif;color:#fff;text-shadow:0 3px 0 var(--c2)}
.dst-season header span{flex:1;color:#cfe0ff;font-weight:700}
.dst-season header i{font:900 italic 20px 'Arial Black',sans-serif;color:#ffe14a;font-style:normal}
.dst-path{display:flex;align-items:center;gap:0}
.dst-link{flex:0 0 40px;height:6px;border-radius:3px;background:#ffffff22}
.dst-link.on{background:linear-gradient(90deg,var(--c1),#ffe14a)}
.dst-ch{position:relative;flex:1;min-width:0;display:flex;flex-direction:column;align-items:center;gap:4px;padding:14px 10px 16px;border-radius:18px;border:2px solid #ffffff44;background:linear-gradient(#13245e,#081238);color:#fff;font:inherit;cursor:pointer;transition:transform .15s cubic-bezier(.2,1.4,.4,1);animation:dstIn .5s cubic-bezier(.2,1.4,.4,1) backwards;animation-delay:calc(var(--k) * .08s)}
@keyframes dstIn{from{transform:translateY(20px) scale(.9);opacity:0}}
.dst-ch.open{border-color:#ffe14a;box-shadow:0 0 24px #ffd23a66;animation:dstIn .5s cubic-bezier(.2,1.4,.4,1) backwards,dstPulse 1.6s ease-in-out .6s infinite}
@keyframes dstPulse{50%{box-shadow:0 0 36px #ffd23aaa}}
.dst-ch.won{border-color:#5ad87a}
.dst-ch.locked{filter:grayscale(.8) brightness(.55);cursor:default}
.dst-ch.boss{background:linear-gradient(#4a0a2a,#14031a)}
.dst-ch.fresh{animation:dstIn .5s backwards,dstFresh 1s ease-out .4s 2}
@keyframes dstFresh{40%{transform:scale(1.08);box-shadow:0 0 50px #fff}}
.dst-ch:not(.locked):hover{transform:translateY(-4px) scale(1.02)}
.dst-crest{width:96px;height:96px;border-radius:50%;overflow:hidden;display:grid;place-items:center;background:#0a1030;border:3px solid #ffd76a;box-shadow:0 6px 14px #000a}
.dst-crest b{font:900 40px 'Arial Black',sans-serif;color:#ffffff55}
.dst-ch small{font-size:11px;font-weight:900;letter-spacing:.1em;color:#9fb6e8;text-transform:uppercase}
.dst-ch>b{font:900 16px/1.15 'Segoe UI',sans-serif;text-align:center}
.dst-meta{display:flex;gap:6px}
.dst-meta em,.dsv-go .lv,.dsv h3 em{font-style:normal;font-size:11px;font-weight:900;padding:2px 8px;border-radius:10px}
.lv.facil{background:#1a8a3a}.lv.normal{background:#e0700c}.lv.dificil{background:#9a0a0a}
.dst-meta .bs,.dsv h3 em{background:linear-gradient(#ff3a5a,#7a0a2a);color:#fff}
.dst-ch>i{position:absolute;top:8px;right:10px;font-style:normal;font-weight:900}
.dst-ok{width:26px;height:26px;display:grid;place-items:center;border-radius:50%;background:#5ad87a;color:#04210c}
.dst-play{padding:3px 10px;border-radius:20px;background:#ffe14a;color:#3a1600;font-size:12px;animation:dhNew 1s ease-in-out infinite}
@keyframes dhNew{50%{transform:scale(1.1)}}
.dst-note{margin:0;text-align:center;color:#cfe0ff;font-size:13px}
.dsc-top{position:fixed;top:0;left:0;right:0;display:flex;align-items:center;gap:12px;padding:12px 16px;background:linear-gradient(#000c,#0000);z-index:2}
.dsc-top small{font-size:11px;font-weight:900;letter-spacing:.12em;color:#ffd76a;text-transform:uppercase}
.dsc-top b{flex:1;font:900 italic 20px 'Arial Black',sans-serif}
.dsc-top button{font:900 13px 'Segoe UI',sans-serif;padding:7px 14px;border-radius:12px;border:2px solid #ffffff88;background:#0b1440cc;color:#fff;cursor:pointer}
.dsc-stage{position:fixed;inset:0;display:flex;align-items:flex-end;justify-content:center;padding:0 16px 4vh;cursor:pointer}
.dsc-who{position:absolute;bottom:calc(4vh + 150px);left:max(16px,calc(50% - 460px))}
.dsc-stage.foe .dsc-who{left:auto;right:max(16px,calc(50% - 460px))}
.dsc-face{display:grid;place-items:center;width:200px;height:200px;border-radius:24px;overflow:hidden;background:radial-gradient(circle at 50% 30%,#2a4aa8,#0a1030);border:4px solid #ffd76a;box-shadow:0 14px 30px #000c}
.dsc-stage.foe .dsc-face{border-color:#ff5a6a;background:radial-gradient(circle at 50% 30%,#a82a3a,#1a0510)}
.dsc-face img{width:100%;height:100%;object-fit:cover}
.dsc-face>*{max-width:100%}
.dsc-box{position:relative;width:min(920px,100%);min-height:120px;padding:16px 22px 26px;box-sizing:border-box;border-radius:20px;background:linear-gradient(#13245ef2,#081238f2);border:3px solid #ffd76a;box-shadow:0 14px 40px #000c}
.dsc-stage.foe .dsc-box{border-color:#ff5a6a}
.dsc-name{display:inline-block;margin-bottom:6px;padding:3px 12px;border-radius:10px;background:#ffd76a;color:#3a1600;font:900 15px 'Segoe UI',sans-serif}
.dsc-stage.foe .dsc-name{background:#ff5a6a;color:#fff}
.dsc-text{margin:0;font:700 clamp(16px,2.2vw,21px)/1.4 'Segoe UI',sans-serif;color:#fff;min-height:2.8em}
.dsc-next{position:absolute;right:18px;bottom:8px;font-style:normal;color:#ffd76a;animation:dhNew .8s ease-in-out infinite}
.dsv{display:flex}
.dsv-box{position:relative;margin:auto;width:min(1280px,100%);padding:20px;box-sizing:border-box;display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:14px}
.dsv-go{grid-column:1 / -1}
.dsv .cc-eg{display:none!important}
.dsv-c .pcard .cc-stats.dt-dstats span:not(.hp):not(.atk){display:none!important}
.dsv-side h3{margin:0 0 8px;font:900 italic 22px 'Arial Black',sans-serif;color:#ffd76a}
.dsv-side h3{text-align:right}.dsv-side.foe h3{color:#ff8a9a;text-align:left}
.dsv-row{display:flex;gap:10px;justify-content:flex-end;align-items:flex-end}
.dsv-side.foe .dsv-row{justify-content:flex-start}
.dsv-c{position:relative;width:min(122px,10vw);animation:dsvIn .5s cubic-bezier(.2,1.4,.4,1) backwards;animation-delay:calc(var(--i) * .1s)}
.dsv-side.foe .dsv-c{animation-name:dsvInR}
@keyframes dsvIn{from{transform:translateX(-60px) rotate(-8deg);opacity:0}}
@keyframes dsvInR{from{transform:translateX(60px) rotate(8deg);opacity:0}}
.dsv-c.bench{opacity:.75;transform:scale(.9)}
.dsv-c .pcard{width:100%;margin:0;pointer-events:none}
.dsv-c.new{filter:drop-shadow(0 0 12px #5ad87a)}
.dsv-c.boss{filter:drop-shadow(0 0 16px #ff3a5a)}
.dsv-c em{position:absolute;top:-10px;left:50%;translate:-50% 0;padding:2px 10px;border-radius:10px;background:#5ad87a;color:#04210c;font:900 12px 'Segoe UI',sans-serif;font-style:normal;white-space:nowrap;animation:dhNew 1s ease-in-out infinite}
.dsv-vs{align-self:center;font:900 italic 64px/1 'Arial Black',sans-serif;color:#ffe14a;text-shadow:0 0 24px #ff8a1a,0 5px 0 #6a2a00;animation:dsvVs .6s cubic-bezier(.2,1.6,.4,1) .3s backwards}
@keyframes dsvVs{from{transform:scale(3);opacity:0}}
.dsv-go{display:flex;align-items:center;justify-content:center;gap:14px}
.dsv-play{font:900 20px 'Segoe UI',sans-serif;padding:12px 30px;border-radius:14px;border:2px solid #fff;background:linear-gradient(#ffb63a,#e0700c);color:#3a1600;cursor:pointer;box-shadow:0 5px 0 #7a3a00,0 8px 18px #000a}
.dsv-play:hover{filter:brightness(1.1);transform:translateY(-2px)}
.dsd{position:fixed;inset:0;z-index:9600;display:grid;place-items:center;background:#000a;cursor:pointer}
.dsd div{display:flex;flex-direction:column;align-items:center;gap:6px;padding:28px 50px;border-radius:24px;background:linear-gradient(135deg,var(--c1),var(--c2));border:3px solid #fff;box-shadow:0 0 60px var(--c1);animation:dsvVs .6s cubic-bezier(.2,1.6,.4,1)}
.dsd small{font-weight:900;letter-spacing:.14em;text-transform:uppercase}
.dsd b{font:900 italic 34px 'Arial Black',sans-serif;text-align:center}
.dsd em{font:900 italic 26px 'Arial Black',sans-serif;color:#ffe14a;font-style:normal}
@media (max-width:820px){.dst-tabs{grid-template-columns:repeat(2,minmax(0,1fr))}.dst-path{flex-direction:column}.dst-link{flex:0 0 18px;width:6px;height:18px}.dst-ch{width:100%}
  .dsv-box{grid-template-columns:1fr}.dsv-row,.dsv-side.foe .dsv-row{justify-content:center}.dsv-side h3,.dsv-side.foe h3{text-align:center}.dsv-c{width:22vw}.dsc-face{width:130px;height:130px}.dsc-who{bottom:calc(4vh + 140px)}}
`;
