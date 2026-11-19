import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { act, onPitch, unit, type Action, type teamOf } from '../src/systems/duel/rules';
import { cpuAction, cpuTurn } from '../src/systems/duel/cpu';
import { createTutorial, tutorialAllows, tutorialCard, tutorialSteps, tutorialTarget } from '../src/systems/duel/tutorial';

const manifest = JSON.parse(fs.readFileSync(path.resolve(__dirname, '..', 'public', 'generated', 'manifest.json'), 'utf-8'));
const byId = new Map((manifest.roster as { id: number }[]).map((p) => [p.id, p])) as Parameters<typeof teamOf>[0];

describe('Modo Duelo: the tutorial', () => {
  it('every step can be done as it says, in order, and then the match is won', () => {
    const s = createTutorial(byId);
    const steps = tutorialSteps();
    const log: string[] = [];
    for (const [k, step] of steps.entries()) {
      if (step.expect.do === 'free') break;
      // the rival plays between the player's turns
      if (s.active === 1) cpuTurn(s, 'facil', () => 0.9);
      let a: Action;
      if (step.expect.do === 'end') a = { do: 'end' };
      else {
        const card = tutorialCard(s, step);
        expect(card, `step ${k + 1}: its card is in the hand (${JSON.stringify(s.sides[0].hand.map((c) => [unit(s, c.owner).pid, c.idx, c.rank]))})`).toBeTruthy();
        if (step.expect.do === 'move') a = { do: 'move', card: card!.id, to: step.expect.to };
        else {
          const t = step.expect.target !== undefined ? tutorialTarget(s, step) : undefined;
          if (step.expect.target !== undefined) expect(t, `step ${k + 1}: its target is still standing`).toBeTruthy();
          a = { do: 'use', card: card!.id, target: t?.uid ?? (step.expect.target !== undefined ? undefined : onPitch(s.sides[0])[0].uid) };
        }
      }
      expect(tutorialAllows(s, step, a), `step ${k + 1}`).toBe(true);
      expect(act(s, 0, a), `step ${k + 1}`).toBeNull();
      log.push(`${k + 1}`);
    }
    // the step that freezes and the one that breaks the ice did what they say
    expect(s.log.some((e) => e.t === 'combo')).toBe(true);
    expect(s.log.some((e) => e.t === 'hit' && e.broke)).toBe(true);
    expect(s.log.some((e) => e.t === 'ko' && unit(s, e.uid).pid === 29)).toBe(true);
    // free play until the win (the player can't lose)
    for (let k = 0; k < 200 && s.winner < 0; k++) act(s, s.active, cpuAction(s, s.active === 0 ? 'dificil' : 'facil', () => 0.9));
    expect(s.winner).toBe(0);
  });
  it('a step refuses any other action', () => {
    const s = createTutorial(byId);
    const [step] = tutorialSteps();
    const other = s.sides[0].hand.find((c) => c !== tutorialCard(s, step))!;
    expect(tutorialAllows(s, step, { do: 'use', card: other.id })).toBe(false);
    expect(tutorialAllows(s, step, { do: 'end' })).toBe(false);
  });
});
