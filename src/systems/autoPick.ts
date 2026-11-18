/**
 * 3.0 (author: «un modo que tienes las mejoras que se cogen automáticas, que puedes elegir prioridad»): the level-up cards
 * can pick themselves, so whoever leaves the run playing on its own keeps growing. The player orders the kinds of card in
 * Opciones (combined technique first by default, healing last); within a kind, a card that completes a combined technique
 * goes first and then the highest level. With «curar con poca vida», healing jumps to the front below that much health,
 * and a heal at full health is never taken while there is anything else.
 */
import type { Card } from './cards';

export type AutoKind = Card['kind'];
export const AUTO_KINDS: AutoKind[] = ['combo', 'recruit', 'upgrade', 'learn', 'passive', 'stat', 'heal'];
export interface AutoPick { on: boolean; order: AutoKind[]; /** health share under which healing goes first; 0 = never */ healBelow: number }
export const AUTO_HEAL_BELOW = 0.35;
export const DEFAULT_AUTO: AutoPick = { on: false, order: AUTO_KINDS, healBelow: AUTO_HEAL_BELOW };

/** a saved setting made whole: every kind once, in the saved order, the new ones at the end */
export function autoSettings(a?: Partial<AutoPick> | null): AutoPick {
  const order = [...new Set((a?.order ?? []).filter((k): k is AutoKind => AUTO_KINDS.includes(k))), ...AUTO_KINDS];
  return { on: !!a?.on, order: [...new Set(order)], healBelow: typeof a?.healBelow === 'number' ? Math.max(0, Math.min(1, a.healBelow)) : AUTO_HEAL_BELOW };
}

/** one place up (or down) in the order */
export function moveKind(a: AutoPick, kind: AutoKind, by: -1 | 1): AutoPick {
  const order = [...a.order], i = order.indexOf(kind), j = i + by;
  if (i < 0 || j < 0 || j >= order.length) return a;
  [order[i], order[j]] = [order[j], order[i]];
  return { ...a, order };
}

const within = (c: Card) => (c.kind === 'learn' || c.kind === 'upgrade' ? (c.combo?.some((h) => h.reaches) ? 1000 : 0) : 0)
  + (c.kind === 'upgrade' || c.kind === 'combo' ? c.toLevel : 0);

/** the index of the card to take; hp = health share now (0..1) */
export function autoChoose(cards: Card[], a: AutoPick, hp: number): number {
  if (!cards.length) return -1;
  const rank = (c: Card) => {
    if (c.kind === 'heal') {
      if (a.healBelow > 0 && hp < a.healBelow) return -1;
      if (hp >= 0.999) return AUTO_KINDS.length;
    }
    return a.order.indexOf(c.kind);
  };
  let best = 0;
  for (let i = 1; i < cards.length; i++) {
    const d = rank(cards[i]) - rank(cards[best]);
    if (d < 0 || (d === 0 && within(cards[i]) > within(cards[best]))) best = i;
  }
  return best;
}
