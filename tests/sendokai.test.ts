/** 2.9: InaZurvivors x Desafío Sendokai — Tampo's bonus by how many of the five are on the pitch, and he is no machine's coach. */
import { describe, expect, it } from 'vitest';
import { COACH_BY_ID, coachesOfMachine, coachRun, rewardCoachesDue } from '../src/data/coaches';
import { SENDOKAI_EVENT, sendokaiActive, sendokaiUpcoming } from '../src/systems/collabEvent';

const tampo = COACH_BY_ID.get('tampo')!;
const five = SENDOKAI_EVENT.players;

describe('InaZurvivors x Desafío Sendokai (2.9)', () => {
  it('Tampo: +50% / −25% in Equilibrada with the five, a fifth less per missing one, 2.5% with none', () => {
    expect(coachRun(tampo, five)?.formation).toEqual({ id: 'equilibrada', damage: 0.5, taken: 0.25 });
    const three = coachRun(tampo, [...five.slice(0, 3), 1, 2])!.formation!;
    expect(three.damage).toBeCloseTo(0.3); expect(three.taken).toBeCloseTo(0.15);
    expect(coachRun(tampo, [1, 2, 3])?.formation).toEqual({ id: 'equilibrada', damage: 0.025, taken: 0.025 });
  });
  it('comes for owning the five, never from a capsule', () => {
    expect(coachesOfMachine('sendokai')).toEqual([]);
    expect(rewardCoachesDue((id) => five.slice(0, 4).includes(id), [])).toEqual([]);
    expect(rewardCoachesDue((id) => five.includes(id), []).map((c) => c.id)).toEqual(['tampo']);
    expect(rewardCoachesDue((id) => five.includes(id), ['tampo'])).toEqual([]);
  });
  it('hidden until it opens, then a week', () => {
    const start = Date.parse(SENDOKAI_EVENT.start);
    expect(sendokaiUpcoming(start - 1)).toBe(true);
    expect(sendokaiActive(start)).toBe(true);
    expect(sendokaiActive(start + 7 * 86_400_000)).toBe(false);
  });
});
