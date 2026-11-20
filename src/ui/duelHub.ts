/**
 * Modo Duelo: its screen, opened from the menu tile. The tutorial first (the other doors open when it is won), then
 * matches against the CPU in three levels; online is coming; the rulebook is always there. Your duel team is made
 * from your collection: your best four footballers among the mode's 50 (three on the pitch, one on the bench) and a
 * coach of yours that the mode has; without four of them you play with Raimon's, lent.
 */
import { tr } from '../i18n/i18n';
import { sfx } from '../game/sfx';
import { COACH_BY_ID } from '../data/coaches';
import { DUEL_BY_ID, DUEL_COACHES, DUEL_PLAYERS, familyOf, sameFamily, type CoachId } from '../systems/duel/cards';
import { DUEL_STATS_CSS, duelCardFace, duelPower } from './duelTeam';
import { backToMenu, fit, go, leaveMenu } from './duelNav';
import { setMusicContext } from '../game/music';
import type { CpuLevel } from '../systems/duel/cpu';
import { teamOf, type TeamCfg } from '../systems/duel/rules';
import { TUTORIAL_TEAM } from '../systems/duel/tutorial';
import { STORY_CHAPTERS } from '../systems/duel/story';
import { artUrl } from './duelArt';
import type { DuelHost, DuelSummary } from './duelMatch';

export interface DuelHubHost extends Omit<DuelHost, 'done'> {
  /** the ids of the footballers and coaches you own */
  owned: number[];
  coaches: string[];
  benchCoach?: string;
  progress: { tutorial?: boolean; wins?: number; story?: string[] };
  /** a story chapter won for the first time (duelStory.ts) */
  storyCleared?(id: string): void;
  /** a match ended: won or not, and whether it was the tutorial */
  finished(won: boolean, tutorial: boolean): void;
  /** a match against the CPU begins (the server opens it: its ticket, or null without an account) */
  begin?(level: CpuLevel, info: { team: number[]; coach: string | null; rival: number[]; chapter?: string }): Promise<string | null>;
  /** what a match pays and counts for the missions */
  pay?(won: boolean, tutorial: boolean, stats: DuelSummary, ticket: string | null, level: CpuLevel | null): Promise<{ coins: number; note?: string } | null>;
  close(): void;
  /** the team set in the team editor, and saving a new one */
  team?: { pids: number[]; coach: string | null };
  saveTeam?(t: { pids: number[]; coach: string | null }): void;
  /** the duel ranking (wins against the CPU): this week's or of all time; null without the online service */
  ranking?(week: boolean): Promise<{ pos: number; username: string; wins: number }[] | null>;
  /** online (signed in): the server's queue and match calls (src/online/client.ts) and how plates are drawn */
  pvp?: {
    join(team: unknown, plate: import('../online/client').PvpPlate): Promise<import('../online/client').PvpQueue>;
    poll(): Promise<import('../online/client').PvpQueue>;
    leave(): Promise<void>;
    move(match: string, n: number, actions: unknown[]): Promise<void>;
    sync(match: string, from: number): ReturnType<typeof import('../online/client').duelPvpSync>;
    end(match: string, winner: 0 | 1, reason: 'win' | 'surrender' | 'gone'): Promise<unknown>;
    me(): import('../online/client').PvpPlate;
    plate(p: import('../online/client').PvpPlate, you: boolean): string;
  };
  /** the game's menu under the duel, which slides away while the duel is open */
  under?: HTMLElement;
  /** open the community tier lists on the duel's topic, to make yours */
  makeTierlist?(): void;
  /** your online name, to mark your row in the ranking */
  me?: string;
  /** a footballer's card as the collection draws it (rarity frame, stars, element, name) */
  card?(pid: number): string;
}

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
const DUEL_COACH_IDS = new Set<string>(DUEL_COACHES.map((c) => c.id));

/** your duel team: the best four of your footballers that the mode has, and your coach if the mode has him */
export function myDuelTeam(h: Pick<DuelHubHost, 'owned' | 'coaches' | 'benchCoach' | 'byId' | 'rarity' | 'team'>): { pids: number[]; coach: CoachId | null; lent: boolean } {
  const ownsIt = (id: number) => h.owned.includes(id) && DUEL_BY_ID.has(id) && h.byId.has(id);
  // the one set in the team editor, while it is still valid (all yours, four, one form of each footballer)
  const saved = h.team;
  if (saved && saved.pids.length === 4 && saved.pids.every(ownsIt) && !sameFamily(saved.pids)) {
    const c = saved.coach && h.coaches.includes(saved.coach) && DUEL_COACH_IDS.has(saved.coach) ? (saved.coach as CoachId) : null;
    return { pids: saved.pids, coach: c, lent: false };
  }
  // else the best four, one form each (a footballer and his Mixi Max form are the same player)
  const mine: number[] = [];
  for (const id of h.owned.filter(ownsIt).sort((a, b) => duelPower(h, b) - duelPower(h, a))) if (mine.length < 4 && !mine.some((m) => familyOf(m) === familyOf(id))) mine.push(id);
  const coach = (h.benchCoach && DUEL_COACH_IDS.has(h.benchCoach) ? h.benchCoach : h.coaches.find((c) => DUEL_COACH_IDS.has(c))) as CoachId | undefined;
  if (mine.length < 4) return { pids: TUTORIAL_TEAM, coach: 'hillman', lent: true };
  return { pids: mine, coach: coach ?? null, lent: false };
}
/** a rival for a match against the CPU: four footballers of the mode (none of yours) and a coach, at random */
function rivalTeam(h: DuelHubHost, not: number[]): { pids: number[]; coach: CoachId } {
  const pool = DUEL_PLAYERS.map((p) => p.id).filter((id) => !not.includes(id) && h.byId.has(id));
  for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
  const pids: number[] = [];
  for (const id of pool) if (pids.length < 4 && !pids.some((p) => familyOf(p) === familyOf(id))) pids.push(id);
  return { pids, coach: DUEL_COACHES[Math.floor(Math.random() * DUEL_COACHES.length)].id };
}

export type DuelNav = { from: HTMLElement | null; dir: 1 | -1 };
export function openDuelHub(h: DuelHubHost, nav?: DuelNav) {
  document.querySelector('.dh:not(.dn-out)')?.remove();
  setMusicContext('duelmenu');
  if (import.meta.env.DEV) (window as unknown as Record<string, unknown>).__duelHub = h; // (dev only) for the TikTok director
  const done = !!h.progress.tutorial;
  const team = myDuelTeam(h);
  const coachName = team.coach ? COACH_BY_ID.get(team.coach)?.name ?? team.coach : tr('Sin entrenador');
  const power = team.pids.reduce((a, p) => a + duelPower(h, p), 0);
  const el = document.createElement('div');
  el.className = 'dh';
  // the four in a row, the same size: three starters and, apart, the bench
  const face = (pid: number, i: number) => `<div class="dh-tc${i === 3 ? ' bench' : ''}" style="--k:${i}"><small>${i === 3 ? tr('Banquillo') : tr('Titular {n}', { n: i + 1 })}</small>${duelCardFace(h, pid) || h.mug(pid, 96)}</div>`;
  // the floating backs of cards in the background
  const backs = Array.from({ length: 10 }, (_, i) => `<img class="dh-fly" src="${artUrl('carta-reverso')}" alt="" style="--x:${(i * 37) % 100}%;--d:${(i * 1.7) % 9}s;--r:${(i * 47) % 360}deg;--s:${0.6 + ((i * 13) % 7) / 10}">`).join('');
  el.innerHTML = `<style>${CSS}</style><img class="dh-bg" src="${artUrl('mesa-horizontal')}" alt=""><i class="dh-rays"></i>${backs}
    <div class="dh-wrap">
      <header class="dh-head">
        <button class="dh-x" type="button" aria-label="${tr('Volver')}">‹</button>
        <div class="dh-logo"><img src="${artUrl('carta-reverso')}" alt=""><h1><span>${tr('MODO DUELO')}</span><i class="dh-shine"></i></h1><img src="${artUrl('carta-reverso')}" alt=""></div>
        <div class="dh-wins"><small>${tr('Victorias')}</small><b>${h.progress.wins ?? 0}</b></div>
      </header>
      <div class="dh-main">
        <section class="dh-team">
          <div class="dh-team-h"><b>${tr('Tu equipo de duelo')}</b><span class="dh-pow"><small>${tr('Poder')}</small><em>${power.toLocaleString()}</em></span></div>
          <div class="dh-fan">${team.pids.map(face).join('')}</div>
          <div class="dh-coachrow">${team.coach && h.coachArt(team.coach) ? `<img src="${h.coachArt(team.coach)}" alt="">` : '<i>📋</i>'}<span><small>${tr('Entrenador')}</small><b>${esc(coachName)}</b></span>
            ${team.lent ? '' : `<button class="dh-edit" type="button" data-m="team">✎ ${tr('Editar equipo')}</button>`}</div>
          ${team.lent ? `<p class="dh-note">${tr('Equipo prestado del Raimon: consigue 4 futbolistas del Modo Duelo para jugar con los tuyos.')}</p>` : ''}
        </section>
        <section class="dh-modes">
          <div class="dh-tile cpu big${done ? '' : ' locked'}" style="--c1:#ff7a1a;--c2:#9a1a00"><img class="dh-art" src="${artUrl('tipo-ataque')}" alt="">
            <b>${tr('Contra la CPU')}</b><small>${done ? tr('30.000 monedas por victoria · elige la dificultad') : tr('Completa el tutorial para desbloquearlo')}</small>
            ${done ? `<div class="dh-lv"><button data-m="facil" class="f">${tr('Fácil')}</button><button data-m="normal" class="n">${tr('Normal')}</button><button data-m="dificil" class="d">${tr('Difícil')}</button></div>` : '<em class="lock">🔒</em>'}<i class="dh-tshine"></i></div>
          <button class="dh-tile story${done ? ' hot' : ' locked'}" data-m="${done ? 'story' : ''}" style="--c1:#e0408a;--c2:#4a0a5a"><img class="dh-art" src="${artUrl('carta-reverso')}" alt=""><b>${tr('Modo historia')}</b><small>${done ? tr('Temporadas 1, 2 y 3 · {n}/{t} capítulos', { n: (h.progress.story ?? []).length, t: STORY_CHAPTERS.length }) : tr('Completa el tutorial para desbloquearlo')}</small>${done ? `<em class="new">${tr('NUEVO')}</em>` : '<em class="lock">🔒</em>'}<i class="dh-tshine"></i></button>
          <button class="dh-tile${done ? '' : ' hot'}" data-m="tutorial" style="--c1:#2fbf62;--c2:#0a4a22"><img class="dh-art" src="${artUrl('tipo-mejora')}" alt=""><b>${tr('Tutorial')}</b><small>${done ? tr('Completado · vuelve a jugarlo cuando quieras') : tr('Aprende a jugar con el Raimon')}</small>${done ? '<em class="ok">✓</em>' : `<em class="new">${tr('EMPIEZA AQUÍ')}</em>`}<i class="dh-tshine"></i></button>
          ${h.pvp && done && !team.lent
            ? `<button class="dh-tile" data-m="online" style="--c1:#7a3fc4;--c2:#2a0a5a"><img class="dh-art" src="${artUrl('tipo-combinada')}" alt=""><b>${tr('Online')}</b><small>${tr('Contra otros jugadores · 60 s por turno')}</small><i class="dh-tshine"></i></button>`
            : `<div class="dh-tile locked" style="--c1:#7a3fc4;--c2:#2a0a5a"><img class="dh-art" src="${artUrl('tipo-combinada')}" alt=""><b>${tr('Online')}</b><small>${!h.pvp ? tr('Conéctate con tu cuenta para jugar') : tr('Completa el tutorial para desbloquearlo')}</small><em class="lock">🔒</em></div>`}
          <button class="dh-tile" data-m="ranking" style="--c1:#ffb020;--c2:#7a4a00"><img class="dh-art" src="${artUrl('tipo-postura')}" alt=""><b>${tr('Ranking')}</b><small>${tr('Las victorias de la semana')}</small><i class="dh-tshine"></i></button>
          <button class="dh-tile" data-m="tiers" style="--c1:#1f8fc0;--c2:#0a2a6a"><img class="dh-art" src="${artUrl('tipo-area')}" alt=""><b>${tr('Tier list')}</b><small>${tr('Los {n}, de mejor a peor', { n: DUEL_PLAYERS.length })}</small><i class="dh-tshine"></i></button>
          <button class="dh-tile" data-m="book" style="--c1:#c04a8a;--c2:#4a0a3a"><img class="dh-art" src="${artUrl('tipo-especial')}" alt=""><b>${tr('Reglamento')}</b><small>${tr('Todas las reglas, con ejemplos')}</small><i class="dh-tshine"></i></button>
        </section>
      </div>
    </div>`;
  document.body.appendChild(el);
  const wrap = el.querySelector<HTMLElement>('.dh-wrap')!;
  fit(el, '.dh-wrap', 1700, 950);
  if (nav) go(nav.from, wrap, nav.dir); else { sfx('whoosh'); leaveMenu(h.under); go(null, wrap, 1); }
  const close = () => { el.remove(); };
  const away = (): DuelNav => { sfx('whoosh'); return { from: el, dir: 1 }; };
  el.querySelector('.dh-x')!.addEventListener('click', () => { sfx('whoosh'); h.close(); backToMenu(el, h.under); });
  el.addEventListener('click', (e) => {
    const m = (e.target as HTMLElement).closest<HTMLElement>('[data-m]')?.dataset.m;
    if (!m) return;
    sfx('click');
    if (m === 'book') { void import('./duelBook').then((b) => b.openDuelBook({ mug: h.mug, name: h.name, byId: h.byId as never })); return; }
    if (m === 'team') {
      const nav = away();
      void import('./duelTeam').then(({ openDuelTeam }) => openDuelTeam(h, team, (t) => { h.saveTeam?.(t); h.team = t; }, (from) => openDuelHub(h, { from, dir: -1 }), nav));
      return;
    }
    if (m === 'tiers' || m === 'ranking') {
      const nav = away(), back = (from: HTMLElement) => openDuelHub(h, { from, dir: -1 });
      void import('./duelBoards').then((b) => (m === 'tiers' ? b.openDuelTiers(h, back, nav) : b.openDuelRanking(h, back, nav)));
      return;
    }
    if (m === 'story') {
      const nav = away();
      const host = { ...h, story: [...(h.progress.story ?? [])], storyCleared: (id: string) => { h.storyCleared?.(id); h.progress = { ...h.progress, story: [...(h.progress.story ?? []), id] }; } };
      void import('./duelStory').then((st) => st.openDuelStory(host, (from) => openDuelHub(h, { from, dir: -1 }), nav));
      return;
    }
    if (m === 'online') {
      const nav = away();
      void import('./duelOnline').then((o) => o.openDuelQueue(h, (from) => openDuelHub(h, { from, dir: -1 }), nav));
      return;
    }
    close();
    startDuel(h, m as 'tutorial' | CpuLevel);
  });
}

/** a match from the hub: the tutorial, against the CPU, or online (`online`: the rival's team and the link to them) */
export function startDuel(h: DuelHubHost, m: 'tutorial' | CpuLevel, online?: { rival: TeamCfg; seed: number; first: 0 | 1; remote: import('./duelMatch').DuelRemote }) {
  const team = myDuelTeam(h);
  const level = m === 'tutorial' || online ? null : m;
  const rival = rivalTeam(h, team.pids);
  const ticket = level && h.begin ? h.begin(level, { team: team.pids, coach: team.coach, rival: rival.pids }).catch(() => null) : Promise.resolve(null);
  void Promise.all([import('./duelMatch'), ticket]).then(([{ openDuelMatch }, t]) => {
    const match = {
      ...h,
      reward: (won: boolean, tutorial: boolean, stats: DuelSummary) => h.pay?.(won, tutorial, stats, t, level) ?? Promise.resolve(null),
      done: (won: boolean, tutorial: boolean) => { h.finished(won, tutorial); openDuelHub({ ...h, progress: { tutorial: h.progress.tutorial || (tutorial && won), wins: (h.progress.wins ?? 0) + (!tutorial && won ? 1 : 0) } }); },
    };
    if (m === 'tutorial') { openDuelMatch(match, { tutorial: true }); return; }
    const mine = teamOf(h.byId, team.pids, team.coach);
    if (online) { openDuelMatch(match, { teams: [mine, online.rival], level: 'normal', seed: online.seed, first: online.first, remote: online.remote }); return; }
    openDuelMatch(match, { teams: [mine, teamOf(h.byId, rival.pids, rival.coach)], level: m });
  });
}

const CSS = `${DUEL_STATS_CSS}
.dh .cc-eg{display:none!important}
.dh{position:fixed;inset:0;z-index:8900;overflow:auto;font-family:'Segoe UI',system-ui,sans-serif;background:#02040f;color:#e6ecff}
.dh-bg{position:fixed;inset:-4%;width:108%;height:108%;object-fit:cover;filter:blur(6px) brightness(.4) saturate(1.3);pointer-events:none;animation:dhBg 20s ease-in-out infinite alternate}
@keyframes dhBg{to{transform:scale(1.06) translate(-1%,1%)}}
.dh-rays{position:fixed;left:50%;top:22%;width:160vmax;height:160vmax;translate:-50% -50%;pointer-events:none;background:repeating-conic-gradient(from 0deg,#ffd76a10 0 6deg,#0000 6deg 15deg);-webkit-mask:radial-gradient(circle,#000 0,#0000 60%);mask:radial-gradient(circle,#000 0,#0000 60%);animation:dhRays 60s linear infinite}
@keyframes dhRays{to{rotate:360deg}}
.dh-fly{position:fixed;left:var(--x);top:110%;width:calc(54px * var(--s));opacity:.18;pointer-events:none;filter:blur(1px);animation:dhFly 16s linear infinite;animation-delay:calc(var(--d) * -1)}
@keyframes dhFly{to{transform:translateY(-130vh) rotate(var(--r))}}
.dh-wrap{position:relative;max-width:1180px;min-height:calc(100vh / var(--z, 1));display:flex;flex-direction:column;justify-content:center;gap:16px;margin:0 auto;padding:14px 18px 22px;box-sizing:border-box;animation:dhIn .4s cubic-bezier(.2,1.3,.4,1)}
@keyframes dhIn{from{transform:translateY(16px);opacity:0}}
.dh-head{display:flex;align-items:center;gap:12px}
.dh-x{width:44px;height:44px;flex:none;border-radius:50%;border:2px solid #ffd76a;background:#0b1440cc;color:#ffd76a;font-size:26px;line-height:1;cursor:pointer}
.dh-logo{flex:1;display:flex;align-items:center;justify-content:center;gap:16px}
.dh-logo img{width:clamp(34px,4.5vw,56px);filter:drop-shadow(0 6px 8px #000);animation:dhCard 3s ease-in-out infinite;transform-origin:50% 90%}
.dh-logo img:first-child{--a:-14deg}.dh-logo img:last-child{--a:14deg;animation-delay:-1.5s}
@keyframes dhCard{0%,100%{rotate:var(--a)}50%{rotate:calc(var(--a) * 1.6);translate:0 -4px}}
.dh h1{position:relative;margin:0;overflow:hidden;padding:0 6px}
.dh h1 span{display:block;font:900 italic clamp(30px,6vw,64px)/1 'Arial Black','Segoe UI Black',sans-serif;letter-spacing:.05em;color:#ffe9a8;background:linear-gradient(#fff6c8,#ffd23a 45%,#ff8a1a 55%,#ffe9a8);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;filter:drop-shadow(0 0 14px #ffb02099) drop-shadow(0 4px 0 #6a2a00)}
.dh-shine{position:absolute;top:0;bottom:0;width:30%;left:-40%;background:linear-gradient(100deg,#0000,#ffffffcc,#0000);mix-blend-mode:overlay;animation:dhShine 3.6s ease-in-out infinite}
@keyframes dhShine{0%,55%{left:-40%}100%{left:130%}}
.dh-wins{display:flex;flex-direction:column;align-items:center;padding:6px 14px;border-radius:12px;background:#0b1440cc;border:2px solid #ffd76a88;line-height:1}
.dh-wins small{font-size:10px;font-weight:900;letter-spacing:.12em;color:#9fb6e8;text-transform:uppercase}
.dh-wins b{font:900 italic 26px 'Arial Black',sans-serif;color:#ffe14a}
.dh-sub{margin:4px 0 14px;text-align:center;color:#cfe0ff;font-size:14px;text-shadow:0 1px 0 #000}
.dh-main{display:grid;grid-template-columns:minmax(0,1.1fr) minmax(0,.9fr);gap:18px;align-items:start}
.dh-team{padding:14px;border-radius:18px;background:linear-gradient(#13245ee6,#081238e6);border:2px solid #ffd76a77;box-shadow:0 14px 40px #000a,inset 0 0 30px #4fb3ff11}
.dh-team-h{display:flex;align-items:center;justify-content:space-between}
.dh-team-h b{color:#ffd76a;font-size:13px;letter-spacing:.14em;text-transform:uppercase}
.dh-pow{display:flex;align-items:baseline;gap:6px}
.dh-pow small{font-size:10px;font-weight:900;color:#9fb6e8;letter-spacing:.1em;text-transform:uppercase}
.dh-pow em{font:900 italic 22px 'Arial Black',sans-serif;color:#ffe14a;-webkit-text-stroke:1px #6a2a00;paint-order:stroke fill}
.dh-fan{display:grid;grid-template-columns:repeat(3,minmax(0,1fr)) 2px minmax(0,1fr);gap:10px;align-items:end;margin:10px 0 4px}
.dh-fan::after{content:'';grid-column:4;grid-row:1;align-self:stretch;margin-top:18px;border-left:2px dashed #ffd76a55}
.dh-tc.bench{grid-column:5}
.dh-tc{position:relative;min-width:0;display:flex;flex-direction:column;align-items:stretch;gap:4px;filter:drop-shadow(0 8px 10px #000a);transition:transform .2s cubic-bezier(.2,1.4,.4,1);animation:dhTc .5s cubic-bezier(.2,1.4,.4,1) backwards;animation-delay:calc(.1s + var(--k) * .08s)}
@keyframes dhTc{from{transform:translateY(30px) scale(.8);opacity:0}}
.dh-tc:hover{transform:translateY(-6px) scale(1.04);z-index:5}
.dh-tc small{text-align:center;font-size:10px;font-weight:900;color:#ffd76a;letter-spacing:.12em;text-transform:uppercase;white-space:nowrap}
.dh-tc.bench small{color:#9fb6e8}
.dh-tc .pcard{width:100%;margin:0;box-sizing:border-box;pointer-events:none}
.dh-tc .pcard .cc-stats.dt-dstats span:not(.hp):not(.atk){display:none!important}
.dh-coachrow{display:flex;align-items:center;gap:10px;margin-top:22px;padding:8px 10px;border-radius:12px;background:#0a1030aa}
.dh-coachrow img{width:46px;height:46px;border-radius:50%;object-fit:cover;border:2px solid #ffd76a}
.dh-coachrow i{font-size:30px;font-style:normal}
.dh-coachrow span{flex:1;display:flex;flex-direction:column;line-height:1.15}
.dh-coachrow small{font-size:10px;font-weight:900;color:#9fb6e8;letter-spacing:.1em;text-transform:uppercase}
.dh-coachrow b{font-size:14px;color:#fff}
.dh-edit{font:900 14px 'Segoe UI',sans-serif;padding:9px 18px;border-radius:12px;border:2px solid #fff;background:linear-gradient(#ffb63a,#e0700c);color:#3a1600;cursor:pointer;box-shadow:0 4px 0 #7a3a00,0 6px 14px #000a;transition:transform .1s}
.dh-edit:hover{transform:translateY(-2px);filter:brightness(1.1)}
.dh-edit:active{transform:translateY(2px);box-shadow:0 2px 0 #7a3a00}
.dh-note{margin:10px 0 0;text-align:center;color:#ffcf8a;font-size:12px}
.dh-modes{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:12px}
.dh-modes>*{grid-column:span 2}.dh-modes>:nth-child(3),.dh-modes>:nth-child(4){grid-column:span 3}
.dh-modes>:nth-child(n+5) .dh-art{width:78px}.dh-modes>:nth-child(n+5) b{font-size:19px}
.dh-modes>.dh-tile.story{grid-column:1 / -1;min-height:110px}
.dh-tile{position:relative;overflow:hidden;display:flex;flex-direction:column;align-items:flex-start;justify-content:flex-end;gap:2px;min-height:118px;padding:40px 16px 14px;box-sizing:border-box;border-radius:18px;border:2px solid #ffffff44;background:radial-gradient(circle at 85% 20%,color-mix(in srgb,var(--c1) 85%,#fff),transparent 55%),linear-gradient(135deg,var(--c1),var(--c2));color:#fff;text-align:left;font:inherit;cursor:pointer;box-shadow:0 10px 24px #000a,inset 0 0 0 1px #ffffff22;transition:transform .15s cubic-bezier(.2,1.4,.4,1),box-shadow .2s,filter .2s;animation:dhTile .5s cubic-bezier(.2,1.4,.4,1) backwards}
.dh-modes>:nth-child(2){animation-delay:.05s}.dh-modes>:nth-child(3){animation-delay:.1s}.dh-modes>:nth-child(4){animation-delay:.15s}.dh-modes>:nth-child(5){animation-delay:.2s}.dh-modes>:nth-child(6){animation-delay:.25s}
@keyframes dhTile{from{transform:translateY(20px) scale(.9);opacity:0}}
.dh-tile:not(.locked):hover{transform:translateY(-4px) scale(1.02);box-shadow:0 16px 30px #000c,0 0 24px color-mix(in srgb,var(--c1) 60%,transparent);filter:brightness(1.1)}
.dh-modes>.dh-tile.big{grid-column:1 / -1;min-height:150px}
.dh-tile.locked{filter:grayscale(.7) brightness(.6);cursor:default}
.dh-art{position:absolute;right:-6px;top:-4px;width:96px;opacity:.95;filter:drop-shadow(0 6px 8px #000a);transform:rotate(10deg);transition:transform .25s cubic-bezier(.2,1.4,.4,1)}
.dh-tile.big .dh-art{width:130px;right:6px}
.dh-tile:not(.locked):hover .dh-art{transform:rotate(-4deg) scale(1.1)}
.dh-tile b{position:relative;font:900 italic 22px/1.05 'Arial Black','Segoe UI',sans-serif;text-shadow:0 2px 0 #0008,0 0 12px #0006;letter-spacing:.02em}
.dh-tile.big b{font-size:30px}
.dh-tile small{position:relative;font-size:12px;font-weight:700;color:#ffffffdd;text-shadow:0 1px 0 #0008;max-width:80%}
.dh-tshine{position:absolute;top:0;bottom:0;width:40%;left:-60%;background:linear-gradient(100deg,#0000,#ffffff44,#0000);pointer-events:none}
.dh-tile:not(.locked):hover .dh-tshine{animation:dhTShine .7s ease-out}
@keyframes dhTShine{to{left:130%}}
.dh-tile em{position:absolute;top:10px;left:12px;font-style:normal;font-size:12px;font-weight:900}
.dh-tile em.new{padding:3px 10px;border-radius:20px;background:#fff;color:#0a4a22;letter-spacing:.06em;animation:dhNew 1s ease-in-out infinite}
@keyframes dhNew{50%{transform:scale(1.1)}}
.dh-tile em.ok{width:26px;height:26px;display:grid;place-items:center;border-radius:50%;background:#fff;color:#2fbf62}
.dh-tile em.lock{font-size:20px}
.dh-tile.hot{animation:dhTile .5s cubic-bezier(.2,1.4,.4,1) backwards,dhHot 1.4s ease-in-out .6s infinite}
@keyframes dhHot{50%{box-shadow:0 10px 24px #000a,0 0 28px #7dff9a}}
.dh-lv{position:relative;display:flex;gap:8px;margin-top:8px}
.dh-lv button{font:900 15px 'Segoe UI',sans-serif;padding:9px 20px;border-radius:12px;border:2px solid #fff;color:#fff;cursor:pointer;box-shadow:0 4px 0 #0008;transition:transform .1s}
.dh-lv button:hover{transform:translateY(-2px) scale(1.05)}
.dh-lv .f{background:linear-gradient(#5ad87a,#1a8a3a)}.dh-lv .n{background:linear-gradient(#ffb63a,#e0700c)}.dh-lv .d{background:linear-gradient(#ff5a5a,#9a0a0a)}
@media (max-width:820px){.dh-main{grid-template-columns:1fr}}
@media (max-width:480px){.dh-modes{grid-template-columns:1fr}.dh-modes>*{grid-column:auto!important}.dh-tile.big b{font-size:24px}.dh-art{width:76px}}
`;
