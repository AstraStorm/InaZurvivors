/**
 * Team formations (captain + up to 4 AI teammates, 5 in total). ONLY THE CAPTAIN TAKES DAMAGE: teammates are invulnerable
 * support, so a formation changes how they attack and how they shield the captain, never their own health.
 * Slots are in the captain's local frame: +y = towards where the captain is facing (forward), +x = to the right.
 */
export type FormationId = 'ofensiva' | 'equilibrada' | 'defensiva';

export interface Formation {
  id: FormationId;
  label: string;
  key: string;
  /** multiplier on all damage dealt by the team */
  damageMult: number;
  /** multiplier on damage received by the captain */
  damageTakenMult: number;
  /** multiplier on every technique's cooldown (< 1 = more often) */
  cooldownMult: number;
  /** multiplier on combined techniques' damage (teammates in sync) */
  comboMult: number;
  description: string;
  slots: [number, number][];
}

export const FORMATIONS: Record<FormationId, Formation> = {
  ofensiva: {
    id: 'ofensiva', label: 'Ofensiva', key: '1', damageMult: 1.08, damageTakenMult: 1.25, cooldownMult: 0.95, comboMult: 1,
    description: 'Compañeros adelantados, presión total: +8% daño, técnicas un 5% más frecuentes. El capitán recibe un 25% más de daño.',
    slots: [[-30, 40], [30, 40], [-62, 16], [62, 16]],
  },
  equilibrada: {
    id: 'equilibrada', label: 'Equilibrada', key: '2', damageMult: 1.03, damageTakenMult: 0.97, cooldownMult: 1, comboMult: 1.1,
    description: 'Compañeros repartidos y coordinados: +3% daño, -3% daño recibido y técnicas combinadas un 10% más fuertes.',
    slots: [[-42, 6], [42, 6], [-24, -36], [24, -36]],
  },
  defensiva: {
    id: 'defensiva', label: 'Defensiva', key: '3', damageMult: 1, damageTakenMult: 0.82, cooldownMult: 1, comboMult: 1,
    description: 'Muralla alrededor del capitán: -18% daño recibido. Tu equipo ataca igual, pero sin ningún extra de ataque.',
    slots: [[-22, 4], [22, 4], [-14, -22], [14, -22]],
  },
};

export const FORMATION_ORDER: FormationId[] = ['ofensiva', 'equilibrada', 'defensiva'];
export const DEFAULT_FORMATION: FormationId = 'equilibrada';

/** World positions of the slots for a captain at (cx, cy) facing `heading` (radians, 0 = facing down/+y). */
export function slotPositions(f: FormationId, cx: number, cy: number, heading: number): { x: number; y: number }[] {
  const c = Math.cos(heading), s = Math.sin(heading);
  return FORMATIONS[f].slots.map(([lx, ly]) => ({ x: cx + lx * c - ly * s, y: cy + lx * s + ly * c }));
}

/** Heading angle (0 = +y) from a direction vector. */
export const headingFromVector = (dx: number, dy: number) => Math.atan2(-dx, dy);
