/**
 * Modo Duelo: the first match is a guided tutorial with Raimon (doc «Tutorial: la primera partida»). Mark, Axel and Jude
 * start, Shawn waits on the bench, Hillman coaches; the rival is a Royal Academy for practice (King, Samford, Caleb) at
 * half its attack, more PV and no resistance (it lasts until the last lesson and every status lands). The player's turns get fixed cards and each step
 * allows only the action it teaches; the player can't lose (rules.ts keeps its footballers at 1 PV). After the last step
 * the match goes on free until the win.
 */
import { tr } from '../../i18n/i18n';
import { createDuel, teamOf, unit, type Action, type DuelState } from './rules';

export const TUTORIAL_TEAM = [1, 10, 29, 1513]; // Mark, Axel, Jude + Shawn on the bench
export const TUTORIAL_RIVAL = [1532, 1542, 1541]; // Joseph King, David Samford, Caleb Stonewall
const MARK = 1, AXEL = 10, JUDE = 29, SHAWN = 1513, KING = 1532, SAMFORD = 1542, CALEB = 1541;

/** what a step lets the player do: a card (footballer, its card 0/1, 'u' ulti or 'c' combined) on a target, a move, or end */
export type Expect =
  | { do: 'use'; pid: number; idx: 0 | 1 | 'u' | 'c'; rank?: number; target?: number }
  | { do: 'move'; pid: number; idx: 0 | 1; to: number }
  | { do: 'end' } | { do: 'free' };
export interface TutorialStep { say: string; expect: Expect }

export function tutorialSteps(): TutorialStep[] {
  return [
    { say: tr('Esta es tu mano: las cartas son las técnicas de tus titulares. Arrastra el Tornado de fuego de Axel hasta Samford.'), expect: { do: 'use', pid: AXEL, idx: 0, target: SAMFORD } },
    { say: tr('Dos cartas iguales juntas se fusionan. Arrastra el Trampolín relámpago junto al otro.'), expect: { do: 'move', pid: AXEL, idx: 1, to: 1 } },
    { say: tr('¡Fusionado a ★★! Tus acciones están en sus casillas: pulsa ¡Jugar! y mira cómo pasan en orden.'), expect: { do: 'end' } },
    { say: tr('Si usas la carta que separa a dos iguales, se juntan gratis. Usa el Corte giratorio de Jude contra King.'), expect: { do: 'use', pid: JUDE, idx: 1, target: KING } },
    { say: tr('La Mano mágica es una postura: bloquea el próximo ataque. Úsala para proteger a Axel.'), expect: { do: 'use', pid: MARK, idx: 0, target: AXEL } },
    { say: tr('El Trampolín relámpago ★★ electriza: cada carta que use Samford le quitará vida. ¡Lánzalo!'), expect: { do: 'use', pid: AXEL, idx: 1, target: SAMFORD } },
    { say: tr('Pulsa ¡Jugar!'), expect: { do: 'end' } },
    { say: tr('Cada carta y cada fusión llenan la Garra. La de Axel está llena: su ulti ha entrado en tu mano. ¡Tormenta de fuego!'), expect: { do: 'use', pid: AXEL, idx: 'u' } },
    { say: tr('Las cartas ★★ de Jude y Axel juntas se han fundido en su técnica combinada. ¡Cometa legendario contra King!'), expect: { do: 'use', pid: JUDE, idx: 'c', target: KING } },
    { say: tr('Pulsa ¡Jugar!'), expect: { do: 'end' } },
    { say: tr('¡Han lesionado a Jude! Shawn entra desde el banquillo con la Garra llena. Ventisca eterna contra Caleb.'), expect: { do: 'use', pid: SHAWN, idx: 'u', target: CALEB } },
    { say: tr('La Ventisca congelará a Caleb, y el golpe siguiente rompe el hielo y hace el doble. ¡Tornado de fuego contra Caleb!'), expect: { do: 'use', pid: AXEL, idx: 0, target: CALEB } },
    { say: tr('¡Muy bien! Ahora juegas tú solo: termina el partido.'), expect: { do: 'free' } },
  ];
}

type ById = Parameters<typeof teamOf>[0];
export function createTutorial(byId: ById, seed = 2026): DuelState {
  const rival = teamOf(byId, TUTORIAL_RIVAL, null);
  // sturdy but toothless: it lasts until the last lesson and hits softly
  // (Caleb, the last lesson's target, has to stand a critical ulti before the ice is broken on him)
  for (const u of rival.units) u.stats = { ...u.stats, hp: Math.round(u.stats.hp * (u.pid === CALEB ? 3 : 2)), atk: Math.round(u.stats.atk * 0.5), res: 0 };
  const s = createDuel([teamOf(byId, TUTORIAL_TEAM, 'hillman'), rival], seed, 0, {
    // the player's hands, turn by turn: each one sets up the steps above
    deals: [
      [{ pid: AXEL, idx: 1 }, { pid: AXEL, idx: 0 }, { pid: MARK, idx: 1 }, { pid: AXEL, idx: 1 }],
      [{ pid: MARK, idx: 0 }, { pid: JUDE, idx: 1 }, { pid: MARK, idx: 0 }],
      [{ pid: JUDE, idx: 0 }, { pid: JUDE, idx: 0 }, { pid: AXEL, idx: 0 }, { pid: AXEL, idx: 0 }],
      [{ pid: SHAWN, idx: 1 }, { pid: AXEL, idx: 0 }, { pid: MARK, idx: 1 }],
    ],
    dealt: 0, kos: { 3: JUDE }, gauges: { 2: { [AXEL]: 5 }, 3: { [SHAWN]: 5 } },
  });
  return s;
}

/** whether this action is the one the step teaches (free steps allow anything) */
export function tutorialAllows(s: DuelState, step: TutorialStep | undefined, a: Action): boolean {
  if (!step || step.expect.do === 'free') return true;
  const e = step.expect;
  if (e.do === 'end') return a.do === 'end';
  if (a.do === 'end' || a.do === 'swap') return false;
  const card = s.sides[0].hand.find((c) => c.id === a.card);
  if (!card || unit(s, card.owner).pid !== e.pid || card.idx !== e.idx) return false;
  if (e.do === 'move') return a.do === 'move' && a.to === e.to;
  if (a.do !== 'use') return false;
  return e.target === undefined || a.target === undefined || unit(s, a.target).pid === e.target;
}
/** the card the step points at (for the UI's highlight) */
export function tutorialCard(s: DuelState, step: TutorialStep | undefined) {
  const e = step?.expect;
  if (!e || (e.do !== 'use' && e.do !== 'move')) return undefined;
  const cs = s.sides[0].hand.filter((c) => unit(s, c.owner).pid === e.pid && c.idx === e.idx);
  return e.do === 'move' ? cs.at(-1) : cs[0]; // a move brings the last one next to the first
}
export const tutorialTarget = (s: DuelState, step: TutorialStep | undefined) => {
  const e = step?.expect;
  return e && e.do === 'use' && e.target !== undefined ? [...s.sides[1].units, ...s.sides[0].units].find((u) => u.pid === e.target && u.slot >= 0) : undefined;
};
