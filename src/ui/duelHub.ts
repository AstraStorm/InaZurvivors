/**
 * Modo Duelo: its screen, opened from the menu tile. The tutorial first (the other doors open when it is won), then
 * matches against the CPU in three levels; online is coming; the rulebook is always there. Your duel team is made
 * from your collection: your best four footballers among the mode's 50 (three on the pitch, one on the bench) and a
 * coach of yours that the mode has; without four of them you play with Raimon's, lent.
 */
import { tr } from '../i18n/i18n';
import { sfx } from '../game/sfx';
import { COACH_BY_ID } from '../data/coaches';
import { DUEL_BY_ID, DUEL_COACHES, DUEL_PLAYERS, duelStats, type CoachId } from '../systems/duel/cards';
import type { CpuLevel } from '../systems/duel/cpu';
import { teamOf, type TeamCfg } from '../systems/duel/rules';
import { TUTORIAL_TEAM } from '../systems/duel/tutorial';
import { artUrl } from './duelArt';
import type { DuelHost, DuelSummary } from './duelMatch';

export interface DuelHubHost extends Omit<DuelHost, 'done'> {
  /** the ids of the footballers and coaches you own */
  owned: number[];
  coaches: string[];
  benchCoach?: string;
  progress: { tutorial?: boolean; wins?: number };
  /** a match ended: won or not, and whether it was the tutorial */
  finished(won: boolean, tutorial: boolean): void;
  /** a match against the CPU begins (the server opens it: its ticket, or null without an account) */
  begin?(level: CpuLevel): Promise<string | null>;
  /** what a match pays and counts for the missions */
  pay?(won: boolean, tutorial: boolean, stats: DuelSummary, ticket: string | null, level: CpuLevel | null): Promise<{ coins: number; note?: string } | null>;
  close(): void;
}

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
const RAR = ['leyenda', 'mitico', 'legendario'];
const DUEL_COACH_IDS = new Set<string>(DUEL_COACHES.map((c) => c.id));

/** your duel team: the best four of your footballers that the mode has, and your coach if the mode has him */
export function myDuelTeam(h: Pick<DuelHubHost, 'owned' | 'coaches' | 'benchCoach' | 'byId' | 'rarity'>): { pids: number[]; coach: CoachId | null; lent: boolean } {
  const power = (pid: number) => {
    const p = h.byId.get(pid);
    if (!p) return 0;
    const st = duelStats(p as never);
    return (3 - Math.max(0, RAR.indexOf(h.rarity(pid)))) * 10000 + st.atk * 2 + st.def + st.hp / 6;
  };
  const mine = h.owned.filter((id) => DUEL_BY_ID.has(id) && h.byId.has(id)).sort((a, b) => power(b) - power(a)).slice(0, 4);
  const coach = (h.benchCoach && DUEL_COACH_IDS.has(h.benchCoach) ? h.benchCoach : h.coaches.find((c) => DUEL_COACH_IDS.has(c))) as CoachId | undefined;
  if (mine.length < 4) return { pids: TUTORIAL_TEAM, coach: 'hillman', lent: true };
  return { pids: mine, coach: coach ?? null, lent: false };
}
/** a rival for a match against the CPU: four footballers of the mode (none of yours) and a coach, at random */
function rivalTeam(h: DuelHubHost, not: number[]): { pids: number[]; coach: CoachId } {
  const pool = DUEL_PLAYERS.map((p) => p.id).filter((id) => !not.includes(id) && h.byId.has(id));
  for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
  return { pids: pool.slice(0, 4), coach: DUEL_COACHES[Math.floor(Math.random() * DUEL_COACHES.length)].id };
}

export function openDuelHub(h: DuelHubHost) {
  document.querySelector('.dh')?.remove();
  const done = !!h.progress.tutorial;
  const team = myDuelTeam(h);
  const coachName = team.coach ? COACH_BY_ID.get(team.coach)?.name ?? team.coach : tr('Sin entrenador');
  const el = document.createElement('div');
  el.className = 'dh';
  el.innerHTML = `<style>${CSS}</style><img class="dh-bg" src="${artUrl('mesa-horizontal')}" alt="">
    <div class="dh-box">
      <button class="dh-x" type="button" aria-label="${tr('Volver')}">✕</button>
      <h1><img src="${artUrl('carta-reverso')}" alt="">${tr('MODO DUELO')}<img src="${artUrl('carta-reverso')}" alt=""></h1>
      <p class="dh-sub">${tr('Cartas al estilo Grand Cross con tus futbolistas')}${done && h.progress.wins ? ` · ${tr('Victorias: {n}', { n: h.progress.wins })}` : ''}</p>
      <div class="dh-team"><b>${tr('Tu equipo de duelo')}</b><div class="dh-faces">${team.pids.map((pid, i) => `<span class="${i === 3 ? 'bench' : ''}">${h.mug(pid, 48)}<small>${esc(h.name(pid))}${i === 3 ? ` · ${tr('Banquillo')}` : ''}</small></span>`).join('')}
        <span class="coach">${team.coach && h.coachArt(team.coach) ? `<img src="${h.coachArt(team.coach)}" alt="">` : '<i>📋</i>'}<small>${esc(coachName)}</small></span></div>
        ${team.lent ? `<p class="dh-note">${tr('Equipo prestado del Raimon: consigue 4 futbolistas del Modo Duelo para jugar con los tuyos.')}</p>` : ''}</div>
      <div class="dh-modes">
        <button class="dh-mode tut${done ? '' : ' hot'}" data-m="tutorial"><img src="${artUrl('tipo-mejora')}" alt=""><span><b>${tr('Tutorial')}</b><small>${done ? tr('Completado · vuelve a jugarlo cuando quieras') : tr('Aprende a jugar con el Raimon')}</small></span>${done ? '<em>✓</em>' : `<em class="new">${tr('EMPIEZA AQUÍ')}</em>`}</button>
        <div class="dh-mode cpu${done ? '' : ' locked'}"><img src="${artUrl('tipo-ataque')}" alt=""><span><b>${tr('Contra la CPU')}</b><small>${done ? tr('Elige la dificultad') : tr('Completa el tutorial para desbloquearlo')}</small></span>
          ${done ? `<div class="dh-lv"><button data-m="facil">${tr('Fácil')}</button><button data-m="normal">${tr('Normal')}</button><button data-m="dificil">${tr('Difícil')}</button></div>` : '<em>🔒</em>'}</div>
        <div class="dh-mode locked"><img src="${artUrl('tipo-combinada')}" alt=""><span><b>${tr('Online')}</b><small>${tr('Próximamente')}</small></span><em>🔒</em></div>
        <button class="dh-mode" data-m="book"><img src="${artUrl('tipo-especial')}" alt=""><span><b>${tr('Reglamento')}</b><small>${tr('Todas las reglas, con ejemplos')}</small></span><em>›</em></button>
      </div>
    </div>`;
  document.body.appendChild(el);
  sfx('reveal');
  const close = () => { el.remove(); };
  el.querySelector('.dh-x')!.addEventListener('click', () => { sfx('click'); close(); h.close(); });
  el.addEventListener('click', (e) => {
    const m = (e.target as HTMLElement).closest<HTMLElement>('[data-m]')?.dataset.m;
    if (!m) return;
    sfx('click');
    if (m === 'book') { void import('./duelBook').then((b) => b.openDuelBook()); return; }
    close();
    const level = m === 'tutorial' ? null : (m as CpuLevel);
    const ticket = level && h.begin ? h.begin(level).catch(() => null) : Promise.resolve(null);
    void Promise.all([import('./duelMatch'), ticket]).then(([{ openDuelMatch }, t]) => {
      const match = {
        ...h,
        reward: (won: boolean, tutorial: boolean, stats: DuelSummary) => h.pay?.(won, tutorial, stats, t, level) ?? Promise.resolve(null),
        done: (won: boolean, tutorial: boolean) => { h.finished(won, tutorial); openDuelHub({ ...h, progress: { tutorial: h.progress.tutorial || (tutorial && won), wins: (h.progress.wins ?? 0) + (!tutorial && won ? 1 : 0) } }); },
      };
      if (m === 'tutorial') { openDuelMatch(match, { tutorial: true }); return; }
      const rival = rivalTeam(h, team.pids);
      const teams: [TeamCfg, TeamCfg] = [teamOf(h.byId, team.pids, team.coach), teamOf(h.byId, rival.pids, rival.coach)];
      openDuelMatch(match, { teams, level: m as CpuLevel });
    });
  });
}

const CSS = `
.dh{position:fixed;inset:0;z-index:8900;display:grid;place-items:center;overflow:auto;padding:16px;box-sizing:border-box;font-family:'Segoe UI',system-ui,sans-serif;background:#02040f}
.dh-bg{position:fixed;inset:-4%;width:108%;height:108%;object-fit:cover;filter:blur(10px) brightness(.45) saturate(1.2);pointer-events:none}
.dh-box{position:relative;width:min(720px,100%);padding:22px 22px 18px;box-sizing:border-box;border-radius:20px;background:linear-gradient(#0f2160f2,#060c2af2);border:2px solid #ffd76a99;box-shadow:0 20px 60px #000c,0 0 40px #ffb02033;color:#e6ecff;animation:dhIn .35s cubic-bezier(.2,1.3,.4,1)}
@keyframes dhIn{from{transform:scale(.9);opacity:0}}
.dh-x{position:absolute;top:12px;right:12px;width:38px;height:38px;border-radius:50%;border:2px solid #ffd76a;background:#0b1440;color:#ffd76a;font-size:18px;cursor:pointer}
.dh h1{display:flex;align-items:center;justify-content:center;gap:14px;margin:4px 0 2px;font:900 italic clamp(26px,5vw,40px)/1 'Arial Black','Segoe UI Black',sans-serif;letter-spacing:.06em;color:#ffe9a8;text-shadow:0 0 18px #ffb020,0 3px 0 #6a2a00}
.dh h1 img{width:clamp(26px,4vw,38px);transform:rotate(-12deg);filter:drop-shadow(0 4px 6px #000)}
.dh h1 img+img{transform:rotate(12deg)}
.dh-sub{margin:0 0 16px;text-align:center;color:#b9c7ef;font-size:14px}
.dh-team{padding:12px;border-radius:14px;background:#ffffff0d;border:1px solid #ffffff1a;margin-bottom:14px}
.dh-team>b{display:block;margin-bottom:8px;color:#ffd76a;font-size:12px;letter-spacing:.14em;text-transform:uppercase}
.dh-faces{display:flex;gap:10px;flex-wrap:wrap;justify-content:center}
.dh-faces>span{display:flex;flex-direction:column;align-items:center;gap:4px;width:84px}
.dh-faces>span .mug,.dh-faces>span>img,.dh-faces>span>i{width:48px;height:48px;border-radius:12px;overflow:hidden;background:radial-gradient(#4a74d0,#14205a);border:2px solid #ffd76a88;image-rendering:pixelated;display:grid;place-items:center;font-style:normal;font-size:24px;object-fit:cover}
.dh-faces>span.bench{opacity:.75}
.dh-faces>span.coach>img,.dh-faces>span.coach>i{border-radius:50%}
.dh-faces small{font-size:11px;color:#dfe7ff;text-align:center;line-height:1.2}
.dh-note{margin:8px 0 0;text-align:center;color:#ffcf8a;font-size:12px}
.dh-modes{display:grid;gap:10px}
.dh-mode{display:flex;align-items:center;gap:14px;width:100%;padding:12px 14px;box-sizing:border-box;border-radius:14px;border:2px solid #ffffff22;background:linear-gradient(#1c3488,#0f1d55);color:#fff;text-align:left;cursor:pointer;font:inherit;transition:transform .15s,filter .2s,border-color .2s}
button.dh-mode:hover{transform:translateY(-2px);filter:brightness(1.12);border-color:#ffd76a}
.dh-mode img{width:44px;flex:none;filter:drop-shadow(0 2px 4px #000)}
.dh-mode>span{flex:1;min-width:0}
.dh-mode b{display:block;font-size:17px;font-weight:900}
.dh-mode small{display:block;color:#b9c7ef;font-size:12.5px}
.dh-mode>em{font-style:normal;font-size:20px;color:#ffd76a}
.dh-mode>em.new{font-size:11px;font-weight:900;padding:4px 9px;border-radius:99px;background:linear-gradient(#ffcf4a,#e07a10);color:#3a1600;letter-spacing:.06em}
.dh-mode.hot{border-color:#ffd76a;box-shadow:0 0 18px #ffb02066;animation:dhHot 1.4s ease-in-out infinite}
@keyframes dhHot{50%{box-shadow:0 0 28px #ffb020aa}}
.dh-mode.locked{opacity:.55;cursor:default;filter:grayscale(.5)}
.dh-mode.cpu:not(.locked){cursor:default}
.dh-lv{display:flex;gap:6px;flex-wrap:wrap}
.dh-lv button{padding:8px 12px;border-radius:10px;border:2px solid #ffd76a88;background:linear-gradient(#ffb63a,#e0700c);color:#3a1600;font-weight:900;cursor:pointer;font-family:inherit}
.dh-lv button:nth-child(2){background:linear-gradient(#ff8a5a,#d0401a);color:#fff}
.dh-lv button:nth-child(3){background:linear-gradient(#c04aff,#6a10c0);color:#fff}
.dh-lv button:hover{filter:brightness(1.15)}
@media (max-width:560px){.dh-mode{flex-wrap:wrap}.dh-lv{width:100%}.dh-lv button{flex:1}}
`;
