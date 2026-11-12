/**
 * Arena events ("altars"). Walking into the marked area starts one; ignoring it costs nothing. Goals scale with the
 * run's minute (and the rank through the enemies they bring). Placement is the scene's job: always on walkable cells.
 */

import { tr } from '../i18n/i18n';
export type AltarType = 'entrenamiento' | 'resistencia' | 'elemental' | 'fichaje'
  | 'supervivencia' | 'portal' | 'duelo' | 'contrarreloj' | 'defensa' | 'cofre' | 'minijefe' | 'despido';
export const ALTAR_TYPES: AltarType[] = ['entrenamiento', 'resistencia', 'elemental', 'fichaje', 'supervivencia', 'portal', 'duelo', 'contrarreloj', 'defensa', 'cofre', 'minijefe', 'despido'];
export const ALTAR_LABEL: Record<AltarType, string> = {
  entrenamiento: tr('Altar de entrenamiento'), resistencia: tr('Altar de resistencia'), elemental: tr('Altar elemental'), fichaje: tr('Altar de fichaje'),
  supervivencia: tr('Desafío de supervivencia'), portal: tr('Portal de rivales'), duelo: tr('Desafío de rival'), contrarreloj: tr('Contrarreloj'),
  defensa: tr('Defiende la zona'), cofre: tr('Cofre especial'), minijefe: tr('Encuentro con minijefe'), despido: tr('Altar de despido'),
};
export const ALTAR_TASK: Record<AltarType, string> = {
  entrenamiento: tr('Derrota rivales en el área'), resistencia: tr('Aguanta dentro del área'), elemental: tr('Derrota rivales a tiempo'), fichaje: tr('Supera la oleada'),
  supervivencia: tr('Sobrevive a la oleada especial'), portal: tr('Derrota a los que salen del portal'), duelo: tr('Derrota al rival'),
  contrarreloj: tr('Derrota rivales antes de que acabe el tiempo'), defensa: tr('Quédate en la zona con pocos rivales dentro'), cofre: tr('Llega al cofre a tiempo'),
  minijefe: tr('Derrota al minijefe'), despido: tr('Quédate junto al altar'),
};
/** What the card shows before accepting: what happens, how it can be lost and how hard it is. */
export const ALTAR_INFO: Record<AltarType, { description: string; fail: string; difficulty: 'Fácil' | 'Media' | 'Difícil' }> = {
  entrenamiento: { description: tr('Derrota rivales cerca del altar antes de que acabe el tiempo.'), fail: tr('Se acaba el tiempo'), difficulty: 'Fácil' },
  resistencia: { description: tr('Quédate dentro del círculo: el tiempo solo cuenta mientras estés dentro.'), fail: tr('Se acaba el tiempo'), difficulty: 'Media' },
  elemental: { description: tr('Derrota muchos rivales en muy poco tiempo, en cualquier lugar.'), fail: tr('Se acaba el tiempo'), difficulty: 'Media' },
  fichaje: { description: tr('Aparece una oleada: derrótala entera para fichar a un jugador.'), fail: tr('Queda algún rival al acabar el tiempo'), difficulty: 'Media' },
  supervivencia: { description: tr('Llega una oleada especial. Solo tienes que seguir vivo.'), fail: tr('Tu equipo cae'), difficulty: 'Media' },
  portal: { description: tr('Del portal salen rivales en grupos: derrótalos a todos.'), fail: tr('Se acaba el tiempo'), difficulty: 'Media' },
  duelo: { description: tr('Un futbolista rival te reta. Derrótalo antes de que se acabe el tiempo.'), fail: tr('Se acaba el tiempo: el rival se retira'), difficulty: 'Difícil' },
  contrarreloj: { description: tr('Derrota el máximo de rivales: el contador corre desde ya.'), fail: tr('Se acaba el tiempo'), difficulty: 'Media' },
  defensa: { description: tr('Quédate en la zona. Si entran 4 rivales o más, el contador se detiene.'), fail: tr('Se acaba el tiempo'), difficulty: 'Difícil' },
  cofre: { description: tr('El cofre se abre si te quedas junto a él un momento.'), fail: tr('Te alejas hasta que se acaba el tiempo'), difficulty: 'Fácil' },
  minijefe: { description: tr('Aparece un minijefe. Derrótalo antes de que se acabe el tiempo.'), fail: tr('Se acaba el tiempo: el minijefe se va'), difficulty: 'Difícil' },
  despido: { description: tr('Quédate un momento junto al altar y elige a un compañero para echarlo del equipo (nunca al capitán). Deja su hueco libre para otro fichaje.'), fail: tr('Te alejas hasta que se acaba el tiempo'), difficulty: 'Fácil' },
};
export const ALTAR_ICON: Record<AltarType, string> = {
  entrenamiento: '⚑', resistencia: '⛨', elemental: '✦', fichaje: '✚', supervivencia: '☠', portal: '◉', duelo: '⚔', contrarreloj: '⏱', defensa: '▣', cofre: '✪', minijefe: '♛', despido: '✖',
};
/** seconds an unaccepted event stays on the pitch */
export const ALTAR_WAIT_SEC = 45;

export const ALTAR_REWARD: Record<AltarType, string> = {
  entrenamiento: tr('Experiencia'), resistencia: tr('Curación y escudo'), elemental: tr('Daño aumentado'), fichaje: tr('Carta de fichaje'),
  supervivencia: tr('Monedas y ficha'), portal: tr('Experiencia y ficha'), duelo: tr('Ficha y mejora gratis'), contrarreloj: tr('Recarga rápida'),
  defensa: tr('Curación y escudo'), cofre: tr('Monedas y mejora gratis'), minijefe: tr('Mucha experiencia y objeto'),
  despido: tr('Echa a un compañero de la partida'),
};
export const ALTAR_COLOR: Record<AltarType, number> = {
  entrenamiento: 0xffb020, resistencia: 0x4fb3ff, elemental: 0xff5a1f, fichaje: 0x5ee05a,
  supervivencia: 0xff4f8b, portal: 0x9a4aff, duelo: 0xffffff, contrarreloj: 0xffe24a, defensa: 0x3fd0c0, cofre: 0xffc83a, minijefe: 0xff2a2a, despido: 0xb0b6c8,
};
/** How progress is earned: kills near the altar, any kill, kills of the event's own rivals, or seconds. */
export const ALTAR_MODE: Record<AltarType, 'cerca' | 'cualquiera' | 'propios' | 'tiempo-dentro' | 'tiempo'> = {
  entrenamiento: 'cerca', resistencia: 'tiempo-dentro', elemental: 'cualquiera', fichaje: 'propios', supervivencia: 'tiempo', portal: 'propios',
  duelo: 'propios', contrarreloj: 'cualquiera', defensa: 'tiempo-dentro', cofre: 'tiempo-dentro', minijefe: 'propios', despido: 'tiempo-dentro',
};

export const FIRST_ALTAR_SEC = 40;
export const ALTAR_EVERY_SEC = 60;
export const ALTAR_RADIUS = 90;

export interface Altar { type: AltarType; x: number; y: number; state: 'idle' | 'active' | 'done' | 'failed'; progress: number; goal: number; timeLeft: number }

export function createAltar(type: AltarType, x: number, y: number, minute: number): Altar {
  const m = Math.floor(minute);
  const [goal, timeLeft] = ({
    entrenamiento: [8 + m * 2, 40], resistencia: [8 + Math.min(m, 6), 30], elemental: [6 + m * 2, 16], fichaje: [8 + m * 2, 45],
    supervivencia: [20 + Math.min(m, 5) * 2, 45], portal: [10 + m * 2, 40], duelo: [1, 45], contrarreloj: [10 + m * 3, 14],
    defensa: [12 + Math.min(m, 6), 35], cofre: [0.4, 15], minijefe: [1, 50], despido: [1.2, 20],
  } as Record<AltarType, [number, number]>)[type];
  return { type, x, y, state: 'idle', progress: 0, goal, timeLeft };
}

/**
 * Advances one event. `kills` = rivals that count for it this step (the scene filters them by ALTAR_MODE);
 * `inside` = captain inside the area (for 'defensa' the scene passes false while the zone is crowded).
 */
export function stepAltar(a: Altar, dtSec: number, inside: boolean, kills: number): Altar['state'] {
  if (a.state === 'idle' && inside) a.state = 'active';
  if (a.state !== 'active') return a.state;
  a.timeLeft -= dtSec;
  const mode = ALTAR_MODE[a.type];
  a.progress += mode === 'tiempo' ? dtSec : mode === 'tiempo-dentro' ? (inside ? dtSec : 0) : kills;
  if (a.progress >= a.goal) a.state = 'done';
  else if (a.timeLeft <= 0) a.state = 'failed';
  return a.state;
}
