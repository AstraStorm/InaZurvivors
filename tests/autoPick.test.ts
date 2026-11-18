import { describe, expect, it } from 'vitest';
import { AUTO_KINDS, autoChoose, autoSettings, moveKind } from '../src/systems/autoPick';
import type { Card } from '../src/systems/cards';

const heal: Card = { kind: 'heal', amount: 30 };
const stat: Card = { kind: 'stat', id: 'potencia' };
const recruit: Card = { kind: 'recruit', playerId: 1 };
const up = (toLevel: number, reaches = false): Card => ({ kind: 'upgrade', playerId: 1, tech: 0, toLevel, combo: reaches ? [{ name: 'X', need: toLevel, reaches: true }] : undefined });

describe('3.0 automatic level-up cards', () => {
  it('a saved setting is made whole: every kind once, saved order first, junk dropped', () => {
    expect(autoSettings(undefined)).toEqual({ on: false, order: AUTO_KINDS, healBelow: 0.35 });
    const a = autoSettings({ on: true, order: ['heal', 'heal', 'nada' as never, 'stat'] });
    expect(a.order.slice(0, 2)).toEqual(['heal', 'stat']);
    expect([...a.order].sort()).toEqual([...AUTO_KINDS].sort());
  });
  it('follows the order; within a kind, completing a combined technique and then the highest level', () => {
    const a = autoSettings({ on: true });
    expect(autoChoose([stat, recruit, heal], a, 0.9)).toBe(1); // recruit before stat
    expect(autoChoose([up(2), up(4), stat], a, 0.9)).toBe(1);
    expect(autoChoose([up(5), up(2, true)], a, 0.9)).toBe(1);
    expect(autoChoose([stat, recruit], moveKind(a, 'stat', -1), 0.9)).toBe(1); // stat moved up once: still behind recruit
    let b = a;
    for (let i = 0; i < 6; i++) b = moveKind(b, 'stat', -1);
    expect(b.order[0]).toBe('stat');
    expect(autoChoose([recruit, stat], b, 0.9)).toBe(1);
  });
  it('low health puts healing first (unless turned off); a heal at full health only when nothing else', () => {
    const a = autoSettings({ on: true });
    expect(autoChoose([recruit, heal], a, 0.2)).toBe(1);
    expect(autoChoose([recruit, heal], { ...a, healBelow: 0 }, 0.2)).toBe(0);
    const healFirst = autoSettings({ on: true, order: ['heal'] });
    expect(autoChoose([heal, stat], healFirst, 1)).toBe(1);
    expect(autoChoose([heal], healFirst, 1)).toBe(0);
    expect(autoChoose([], a, 1)).toBe(-1);
  });
});
