/**
 * Team formations (captain + up to 4 AI teammates, 5 in total). Bonuses are PROVISIONAL balance values — tune here.
 * Slots are in the captain's local frame: +y = towards where the captain is facing (forward), +x = to the right.
 */
export type FormationId = 'ofensiva' | 'equilibrada' | 'defensiva';

export interface Formation {
  id: FormationId;
  label: string;
  key: string;
  /** multiplier on all damage dealt by the team */
  damageMult: number;
  /** multiplier on damage received by the shared HP bar */
  damageTakenMult: number;
  description: string;
  slots: [number, number][];
}

export const FORMATIONS: Record<FormationId, Formation> = {
  ofensiva: {
    id: 'ofensiva', label: 'Ofensiva', key: '1', damageMult: 1.12, damageTakenMult: 1.2,
    description: 'Compañeros adelantados. +15% daño, +15% daño recibido.',
    slots: [[-30, 40], [30, 40], [-62, 16], [62, 16]],
  },
  equilibrada: {
    id: 'equilibrada', label: 'Equilibrada', key: '2', damageMult: 1, damageTakenMult: 1,
    description: 'Compañeros repartidos alrededor del capitán. Sin modificadores.',
    slots: [[-42, 6], [42, 6], [-24, -36], [24, -36]],
  },
  defensiva: {
    id: 'defensiva', label: 'Defensiva', key: '3', damageMult: 0.85, damageTakenMult: 0.82,
    description: 'Compañeros cerrando filas junto al capitán. -18% daño recibido, -15% daño.',
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
