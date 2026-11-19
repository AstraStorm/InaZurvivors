import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { act, createDuel, teamOf, type Action } from '../src/systems/duel/rules';
import { cpuAction } from '../src/systems/duel/cpu';
import { pvpLink } from '../src/systems/duel/pvp';
import type { PvpMatch, PvpTurn } from '../src/online/client';

const manifest = JSON.parse(fs.readFileSync(path.resolve(__dirname, '..', 'public', 'generated', 'manifest.json'), 'utf-8'));
const byId = new Map((manifest.roster as { id: number }[]).map((p) => [p.id, p])) as Parameters<typeof teamOf>[0];

describe('Modo Duelo online: two players through the server play the same match', () => {
  it('each runs its own engine, only the turns travel, and both end with the same result', async () => {
    const A = teamOf(byId, [10, 1513, 1, 29], 'hillman'), B = teamOf(byId, [1532, 1542, 1541, 2], 'ray-dark');
    const seed = 321, first = 1 as 0 | 1;
    // the server, in memory: the turns in order
    const moves: PvpTurn[] = [];
    const server = (side: 0 | 1) => ({
      move: async (_m: string, n: number, actions: unknown[]) => { if (!moves.some((x) => x.n === n)) moves.push({ n, side, actions }); },
      sync: async (_m: string, from: number) => ({ moves: moves.filter((x) => x.n >= from), rival_seen: 0, status: 'live' as const, winner: null }),
      end: async () => ({}),
      plate: () => '',
    });
    const match = (side: 0 | 1): PvpMatch => ({ status: 'matched', match: 'm', side, seed, first, teams: [A, B], plates: [{ name: 'a' }, { name: 'b' }], live: true });
    const players = ([0, 1] as const).map((side) => ({
      side,
      s: createDuel(side === 0 ? [A, B] : [B, A], seed, (side === 0 ? first : 1 - first) as 0 | 1),
      link: pvpLink(server(side), match(side)),
    }));
    let roll = 5;
    const rnd = () => { roll = (roll * 1103515245 + 12345) & 0x7fffffff; return roll / 0x7fffffff; };
    for (let turn = 0; turn < 60 && players[0].s.winner < 0; turn++) {
      // whose turn it is: they play it on their engine and send it; the other gets it and plays it as the rival
      const me = players.find((p) => p.s.active === 0)!, them = players.find((p) => p !== me)!;
      const sent: Action[] = [];
      for (let k = 0; k < 12 && me.s.active === 0 && me.s.winner < 0; k++) {
        const a = cpuAction(me.s, 'dificil', rnd);
        if (a.do === 'end') break;
        if (act(me.s, 0, a)) break;
        sent.push(a);
      }
      me.link.send(sent);
      if (me.s.winner < 0) act(me.s, 0, { do: 'end' });
      const got = await them.link.next();
      expect(got).not.toBeNull();
      for (const a of got!) if (them.s.winner < 0) expect(act(them.s, 1, a)).toBeNull();
      if (them.s.winner < 0) act(them.s, 1, { do: 'end' });
      expect(them.s.sides[1].units.map((u) => u.hp)).toEqual(me.s.sides[0].units.map((u) => u.hp));
      expect(them.s.sides[0].units.map((u) => u.hp)).toEqual(me.s.sides[1].units.map((u) => u.hp));
    }
    expect(players[0].s.winner).toBeGreaterThanOrEqual(0);
    expect(players[1].s.winner).toBe(1 - players[0].s.winner);
  });
});
