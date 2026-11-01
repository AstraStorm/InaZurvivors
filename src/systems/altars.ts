/**
 * Arena events ("altars"). Walking into the marked area starts one; ignoring it costs nothing. Goals scale with the
 * run's minute (and the rank through the enemies they bring). Placement is the scene's job: always on walkable cells.
 */

export type AltarType = 'entrenamiento' | 'resistencia' | 'elemental' | 'fichaje'
  | 'supervivencia' | 'portal' | 'duelo' | 'contrarreloj' | 'defensa' | 'cofre' | 'minijefe';
export const ALTAR_TYPES: AltarType[] = ['entrenamiento', 'resistencia', 'elemental', 'fichaje', 'supervivencia', 'portal', 'duelo', 'contrarreloj', 'defensa', 'cofre', 'minijefe'];
export const ALTAR_LABEL: Record<AltarType, string> = {
  entrenamiento: 'Altar de entrenamiento', resistencia: 'Altar de resistencia', elemental: 'Altar elemental', fichaje: 'Altar de fichaje',
  supervivencia: 'Desafío de supervivencia', portal: 'Portal de rivales', duelo: 'Desafío de rival', contrarreloj: 'Contrarreloj',
  defensa: 'Defiende la zona', cofre: 'Cofre especial', minijefe: 'Encuentro con minijefe',
};
export const ALTAR_TASK: Record<AltarType, string> = {
  entrenamiento: 'Derrota rivales en el área', resistencia: 'Aguanta dentro del área', elemental: 'Derrota rivales a tiempo', fichaje: 'Supera la oleada',
  supervivencia: 'Sobrevive a la oleada especial', portal: 'Derrota a los que salen del portal', duelo: 'Derrota al rival',
  contrarreloj: 'Derrota rivales antes de que acabe el tiempo', defensa: 'Quédate en la zona con pocos rivales dentro', cofre: 'Llega al cofre a tiempo',
  minijefe: 'Derrota al minijefe',
};
/** What the card shows before accepting: what happens, how it can be lost and how hard it is. */
export const ALTAR_INFO: Record<AltarType, { description: string; fail: string; difficulty: 'Fácil' | 'Media' | 'Difícil' }> = {
  entrenamiento: { description: 'Derrota rivales cerca del altar antes de que acabe el tiempo.', fail: 'Se acaba el tiempo', difficulty: 'Fácil' },
  resistencia: { description: 'Quédate dentro del círculo: el tiempo solo cuenta mientras estés dentro.', fail: 'Se acaba el tiempo', difficulty: 'Media' },
  elemental: { description: 'Derrota muchos rivales en muy poco tiempo, en cualquier lugar.', fail: 'Se acaba el tiempo', difficulty: 'Media' },
  fichaje: { description: 'Aparece una oleada: derrótala entera para fichar a un jugador.', fail: 'Queda algún rival al acabar el tiempo', difficulty: 'Media' },
  supervivencia: { description: 'Llega una oleada especial. Solo tienes que seguir vivo.', fail: 'Tu equipo cae', difficulty: 'Media' },
  portal: { description: 'Del portal salen rivales en grupos: derrótalos a todos.', fail: 'Se acaba el tiempo', difficulty: 'Media' },
  duelo: { description: 'Un futbolista rival te reta. Derrótalo antes de que se acabe el tiempo.', fail: 'Se acaba el tiempo: el rival se retira', difficulty: 'Difícil' },
  contrarreloj: { description: 'Derrota el máximo de rivales: el contador corre desde ya.', fail: 'Se acaba el tiempo', difficulty: 'Media' },
  defensa: { description: 'Quédate en la zona. Si entran 4 rivales o más, el contador se detiene.', fail: 'Se acaba el tiempo', difficulty: 'Difícil' },
  cofre: { description: 'El cofre se abre si te quedas junto a él un momento.', fail: 'Te alejas hasta que se acaba el tiempo', difficulty: 'Fácil' },
  minijefe: { description: 'Aparece un minijefe. Derrótalo antes de que se acabe el tiempo.', fail: 'Se acaba el tiempo: el minijefe se va', difficulty: 'Difícil' },
};
export const ALTAR_ICON: Record<AltarType, string> = {
  entrenamiento: '⚑', resistencia: '⛨', elemental: '✦', fichaje: '✚', supervivencia: '☠', portal: '◉', duelo: '⚔', contrarreloj: '⏱', defensa: '▣', cofre: '✪', minijefe: '♛',
};
/** seconds an unaccepted event stays on the pitch */
export const ALTAR_WAIT_SEC = 45;

export const ALTAR_REWARD: Record<AltarType, string> = {
  entrenamiento: 'Experiencia', resistencia: 'Curación y escudo', elemental: 'Daño aumentado', fichaje: 'Carta de fichaje',
  supervivencia: 'Monedas y ficha', portal: 'Experiencia y ficha', duelo: 'Ficha y mejora gratis', contrarreloj: 'Recarga rápida',
  defensa: 'Curación y escudo', cofre: 'Monedas y mejora gratis', minijefe: 'Mucha experiencia y objeto',
};
export const ALTAR_COLOR: Record<AltarType, number> = {
  entrenamiento: 0xffb020, resistencia: 0x4fb3ff, elemental: 0xff5a1f, fichaje: 0x5ee05a,
  supervivencia: 0xff4f8b, portal: 0x9a4aff, duelo: 0xffffff, contrarreloj: 0xffe24a, defensa: 0x3fd0c0, cofre: 0xffc83a, minijefe: 0xff2a2a,
};
/** How progress is earned: kills near the altar, any kill, kills of the event's own rivals, or seconds. */
export const ALTAR_MODE: Record<AltarType, 'cerca' | 'cualquiera' | 'propios' | 'tiempo-dentro' | 'tiempo'> = {
  entrenamiento: 'cerca', resistencia: 'tiempo-dentro', elemental: 'cualquiera', fichaje: 'propios', supervivencia: 'tiempo', portal: 'propios',
  duelo: 'propios', contrarreloj: 'cualquiera', defensa: 'tiempo-dentro', cofre: 'tiempo-dentro', minijefe: 'propios',
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
    defensa: [12 + Math.min(m, 6), 35], cofre: [0.4, 15], minijefe: [1, 50],
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
