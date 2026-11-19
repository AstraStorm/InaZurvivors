/**
 * Modo Duelo online (author: «aplica el online»). Each player runs the match on their own engine with themselves as
 * side 0, and only the actions travel: the engine is the same seen from either side (tests/duelMirror.test.ts), as long
 * as both start from the same teams, seed and first side. A unit's uid is side·16 + place, so from the other side
 * it is the other half (uid ^ 16); card ids are dealt in the same order on both, so they are the same.
 */
import type { Action } from './rules';
import type { DuelRemote } from '../../ui/duelMatch';
import type { PvpMatch, PvpTurn } from '../../online/client';

/** the server calls the link needs (src/online/client.ts) */
export interface PvpServer {
  move(match: string, n: number, actions: unknown[]): Promise<void>;
  sync(match: string, from: number): Promise<{ moves: PvpTurn[]; rival_seen: number; status: 'live' | 'done'; winner: 0 | 1 | null }>;
  end(match: string, winner: 0 | 1, reason: 'win' | 'surrender' | 'gone'): Promise<unknown>;
  plate(p: PvpMatch['plates'][number], you: boolean): string;
}
const SYNC_MS = 1200;
/** the rival unseen for this long is gone: the match is yours */
const GONE_S = 75;
const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/** an action as the other player's engine sees it */
export function mirrorAction(a: Action): Action {
  if (a.do === 'use') return a.target === undefined ? { ...a } : { ...a, target: a.target ^ 16 };
  if (a.do === 'swap') return { do: 'swap', bench: a.bench ^ 16, out: a.out ^ 16 };
  return { ...a };
}

/** the link to the rival during the match */
export function pvpLink(pvp: PvpServer, m: PvpMatch): DuelRemote {
  let n = 0; // turns played so far by both: turn n is the opener's when n is even
  let over = false;
  const sendTurn = async (k: number, actions: Action[]) => {
    for (let tries = 0; tries < 6 && !over; tries++) {
      try { await pvp.move(m.match, k, actions); return; } catch { await wait(1000 * (tries + 1)); }
    }
  };
  return {
    plate: pvp.plate(m.plates[1 - m.side], false),
    send(actions) { const k = n++; void sendTurn(k, actions); },
    async next() {
      for (;;) {
        if (over) return null;
        try {
          const r = await pvp.sync(m.match, n);
          const t = r.moves.find((x) => x.n === n && x.side !== m.side);
          if (t) { n++; return (t.actions as Action[]).map(mirrorAction); }
          if (r.status === 'done') { over = true; return r.winner === m.side ? null : []; }
          if (r.rival_seen > GONE_S) { over = true; await pvp.end(m.match, m.side, 'gone').catch(() => undefined); return null; }
        } catch { /* a bad moment of the network: try again */ }
        await wait(SYNC_MS);
      }
    },
    end(won) { over = true; if (won) void pvp.end(m.match, m.side, 'win').catch(() => undefined); },
    surrender() { over = true; void pvp.end(m.match, (1 - m.side) as 0 | 1, 'surrender').catch(() => undefined); },
  };
}

