/**
 * Modo Duelo: the CPU rival. Each action it tries every card it can use on every target (and every move that makes a
 * fusion) on a copy of the match, scores what happened (damage done and taken, knock-outs, fusions, gauge, ultis
 * ready) and plays the best one; it stops when nothing is worth an action. «fácil» sometimes takes a worse move.
 */
import { act, cloneDuel, illegal, onPitch, standing, unit, type Action, type DuelState, type Side } from './rules';

export type CpuLevel = 'facil' | 'normal' | 'dificil';

function score(before: DuelState, after: DuelState, side: Side): number {
  const me = after.sides[side], them = after.sides[side ? 0 : 1];
  const meB = before.sides[side], themB = before.sides[side ? 0 : 1];
  const hp = (ss: typeof me) => ss.units.reduce((a, u) => a + Math.max(0, u.hp) + u.shield * 0.7, 0);
  let v = (hp(themB) - hp(them)) - (hp(meB) - hp(me)) * 1.1;
  v += (standing(themB).length - standing(them).length) * 2500;
  v -= (standing(meB).length - standing(me).length) * 2500;
  v += me.units.reduce((a, u) => a + u.gauge * 60, 0) - meB.units.reduce((a, u) => a + u.gauge * 60, 0);
  v += me.hand.reduce((a, c) => a + c.rank * c.rank * 40, 0) - meB.hand.reduce((a, c) => a + c.rank * c.rank * 40, 0) * 0.6;
  v += them.units.reduce((a, u) => a + Object.keys(u.status).filter((k) => k !== 'provocar').length * 120, 0);
  v += me.units.reduce((a, u) => a + u.stances.length * 150 + (u.status.provocar ? 100 : 0), 0);
  if (after.winner === side) v += 1e6;
  return v;
}

/** every action worth trying now */
function options(s: DuelState, side: Side): Action[] {
  const ss = s.sides[side], foe = s.sides[side ? 0 : 1];
  const out: Action[] = [];
  for (const c of ss.hand) {
    const targets = [...onPitch(foe), ...onPitch(ss)].map((u) => u.uid);
    for (const t of [undefined, ...targets]) out.push({ do: 'use', card: c.id, target: t });
    for (let to = 0; to < ss.hand.length; to++) out.push({ do: 'move', card: c.id, to });
  }
  const bench = ss.units.find((u) => u.slot === 3);
  if (bench) for (const u of onPitch(ss)) out.push({ do: 'swap', bench: bench.uid, out: u.uid });
  return out.filter((a) => !illegal(s, side, a));
}

/** the CPU's next action (an «end» when nothing is worth it) */
export function cpuAction(s: DuelState, level: CpuLevel = 'normal', roll: () => number = Math.random): Action {
  const side = s.active;
  const tried = options(s, side).map((a) => {
    const copy = cloneDuel(s);
    act(copy, side, a);
    let v = score(s, copy, side);
    if (a.do === 'move' && !copy.log.slice(s.log.length).some((e) => e.t === 'merge' || e.t === 'combo')) v = -Infinity; // moves only for a fusion
    if (a.do === 'swap') v -= 400; // the one swap of the match is not spent lightly
    return { a, v };
  }).filter((x) => x.v > 0).sort((x, y) => y.v - x.v);
  if (!tried.length) return { do: 'end' };
  if (level === 'facil' && tried.length > 1 && roll() < 0.4) return tried[Math.min(tried.length - 1, 1 + Math.floor(roll() * 3))].a;
  if (level === 'normal' && tried.length > 1 && roll() < 0.12) return tried[1].a;
  return tried[0].a;
}

/** plays the CPU's whole turn; returns the actions it took */
export function cpuTurn(s: DuelState, level: CpuLevel = 'normal', roll: () => number = Math.random): Action[] {
  const side = s.active, done: Action[] = [];
  for (let k = 0; k < 12 && s.active === side && s.winner < 0; k++) {
    const a = cpuAction(s, level, roll);
    done.push(a);
    act(s, side, a);
    if (a.do === 'end') break;
  }
  if (s.active === side && s.winner < 0) { act(s, side, { do: 'end' }); done.push({ do: 'end' }); }
  return done;
}
export { unit };
