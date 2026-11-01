/**
 * Fix 1.12: central safety net for marks on the ground (aim lines, bomb fuses, attack lanes and fans, falling-ball
 * shadows, shock waves, event areas). Every one of them has an owner that removes it; anything left in the ground layer
 * with no live owner and no running animation is an orphan and goes. The pitch itself is drawn below GROUND_MIN.
 */
export const GROUND_MIN = -9950;
export const GROUND_MAX = -9000;

export interface Sweepable { depth: number }

/** Objects in the telegraph layer that nobody owns and nothing animates. */
export function orphans<T extends Sweepable>(objects: readonly T[], owned: ReadonlySet<unknown>, animating: (o: T) => boolean): T[] {
  return objects.filter((o) => o.depth >= GROUND_MIN && o.depth <= GROUND_MAX && !owned.has(o) && !animating(o));
}
