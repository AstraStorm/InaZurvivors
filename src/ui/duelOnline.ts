/**
 * Modo Duelo online (author: «si quieres jugar online que salga la lista de espera, la cantidad de jugadores y que si
 * pasan más de 1:30 min se emparejan con bots»). The search screen: how long you have waited, how many are looking and
 * playing, and at 1:30 a bot (the CPU, Normal) instead. Once paired, the link to the rival for the match: each turn
 * goes to the server whole, and the rival's comes back the same way (src/systems/duel/pvp.ts, migration duel_pvp).
 */
import { tr } from '../i18n/i18n';
import { sfx } from '../game/sfx';
import { teamOf, type TeamCfg } from '../systems/duel/rules';
import { pvpLink } from '../systems/duel/pvp';
import { artUrl } from './duelArt';
import { fit, go } from './duelNav';
import { myDuelTeam, startDuel, type DuelHubHost, type DuelNav } from './duelHub';
import type { PvpMatch } from '../online/client';

/** after this long in the queue, a bot */
export const BOT_AFTER_MS = 90_000;
const POLL_MS = 2000;
const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export function openDuelQueue(h: DuelHubHost, back: (from: HTMLElement) => void, nav?: DuelNav) {
  const pvp = h.pvp!;
  document.querySelector('.dq:not(.dn-out)')?.remove();
  const team = myDuelTeam(h);
  const cfg = teamOf(h.byId, team.pids, team.coach);
  const el = document.createElement('div');
  el.className = 'dq';
  el.innerHTML = `<style>${CSS}</style><img class="dq-bg" src="${artUrl('mesa-horizontal')}" alt="">
    <div class="dq-box">
      <div class="dq-cards">${[0, 1, 2].map((i) => `<img src="${artUrl('carta-reverso')}" alt="" style="--k:${i}">`).join('')}</div>
      <h2>${tr('Buscando rival…')}</h2>
      <div class="dq-time">0:00</div>
      <p class="dq-count">${tr('Conectando…')}</p>
      <div class="dq-bar"><i></i></div>
      <p class="dq-note">${tr('Si en 1:30 no aparece nadie, jugarás contra un bot.')}</p>
      <button class="dq-x" type="button">${tr('Cancelar')}</button>
    </div>`;
  document.body.appendChild(el);
  fit(el, '.dq-box', 1200, 720);
  if (nav) go(nav.from, el.querySelector<HTMLElement>('.dq-box'), nav.dir); else sfx('reveal');
  const t0 = performance.now();
  let stopped = false;
  const stop = () => { stopped = true; window.clearInterval(clock); };
  const clock = window.setInterval(() => {
    const ms = performance.now() - t0, sec = Math.floor(ms / 1000);
    el.querySelector('.dq-time')!.textContent = `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
    el.querySelector<HTMLElement>('.dq-bar i')!.style.width = `${Math.min(100, (ms / BOT_AFTER_MS) * 100)}%`;
  }, 250);
  el.querySelector('.dq-x')!.addEventListener('click', () => { sfx('whoosh'); stop(); void pvp.leave().catch(() => undefined); back(el); });
  const begin = (m: PvpMatch | null) => {
    stop();
    sfx('legend');
    el.querySelector('h2')!.textContent = m ? tr('¡Rival encontrado!') : tr('Jugarás contra un bot');
    window.setTimeout(() => {
      el.remove();
      if (!m) { startDuel(h, 'normal'); return; }
      // both engines start the same: the teams of a and b, the seed, who opens, each seen from its own side
      const rival = m.teams[1 - m.side] as TeamCfg;
      startDuel(h, 'normal', { rival, seed: m.seed, first: (m.side === 0 ? m.first : 1 - m.first) as 0 | 1, remote: pvpLink(h.pvp!, m) });
    }, 900);
  };
  void (async () => {
    try {
      let r = await pvp.join(cfg, pvp.me());
      while (!stopped) {
        if (r.status === 'matched') { begin(r); return; }
        if (r.status === 'waiting') {
          el.querySelector('.dq-count')!.innerHTML = tr('<b>{n}</b> buscando · <b>{m}</b> jugando', { n: r.waiting, m: r.playing });
        }
        if (performance.now() - t0 > BOT_AFTER_MS) { await pvp.leave().catch(() => undefined); if (!stopped) begin(null); return; }
        await wait(POLL_MS);
        if (stopped) return;
        r = await pvp.poll();
        if (r.status === 'out') r = await pvp.join(cfg, pvp.me());
      }
    } catch {
      if (stopped) return;
      el.querySelector('.dq-count')!.textContent = tr('No se puede conectar ahora. Jugarás contra un bot.');
      await wait(1500);
      if (!stopped) begin(null);
    }
  })();
}

const CSS = `
.dq{position:fixed;inset:0;z-index:8950;display:grid;place-items:center;font-family:'Segoe UI',system-ui,sans-serif;background:#02040f;color:#e6ecff}
.dq-bg{position:fixed;inset:-4%;width:108%;height:108%;object-fit:cover;filter:blur(8px) brightness(.35) saturate(1.2);pointer-events:none}
.dq-box{position:relative;width:min(460px,92vw);padding:22px 22px 18px;box-sizing:border-box;border-radius:18px;text-align:center;background:linear-gradient(#152a6cf2,#060c2af2);border:2px solid #b07aff99;box-shadow:0 20px 60px #000c,0 0 40px #7a3fc455}
.dq-cards{position:relative;height:120px;margin-bottom:6px}
.dq-cards img{position:absolute;left:50%;top:6px;width:76px;margin-left:-38px;filter:drop-shadow(0 6px 10px #000c);transform-origin:50% 140%;animation:dqFan 1.6s ease-in-out infinite;animation-delay:calc(var(--k) * -.53s)}
@keyframes dqFan{0%,100%{transform:rotate(-22deg)}50%{transform:rotate(22deg)}}
.dq h2{margin:0;font:900 italic 26px 'Arial Black','Segoe UI',sans-serif;color:#f0d8ff;text-shadow:0 0 14px #b07aff,0 2px 0 #000}
.dq-time{margin:6px 0 2px;font:900 34px 'Arial Black',sans-serif;color:#fff;letter-spacing:.04em}
.dq-count{margin:2px 0 10px;color:#cfe0ff;font-size:14px}
.dq-count b{color:#ffe14a}
.dq-bar{height:8px;border-radius:99px;background:#ffffff1a;overflow:hidden}
.dq-bar i{display:block;height:100%;width:0;background:linear-gradient(90deg,#7a3fc4,#ff6ad5);transition:width .25s linear}
.dq-note{margin:8px 0 14px;color:#9fb6e8;font-size:12px}
.dq-x{font:900 14px 'Segoe UI',sans-serif;padding:9px 22px;border-radius:12px;border:2px solid #fff;background:linear-gradient(#5a6a9a,#2a3460);color:#fff;cursor:pointer}
`;
