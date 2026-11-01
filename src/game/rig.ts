/**
 * Pure helpers for the Raimon-body + original-head composition.
 * Animations 0-15 are the 8 directions (verified visually during extraction):
 * 0 up, 1 up_right, 2 right, 3 down_right, 4 down, 5 down_left, 6 left, 7 up_left; 8-15 same order.
 * Group 0-7 is used while standing, 8-15 while moving (their exact game function is not verified).
 */
import type { RigAnimation, RigFrame } from '../data/manifest';

export const TICK_MS = 1000 / 60; // durations are game ticks (probably 1/60 s)

/** Direction index 0..7 from a velocity (screen y grows downwards). */
export function directionFromVector(dx: number, dy: number, fallback = 4): number {
  if (Math.abs(dx) < 1e-6 && Math.abs(dy) < 1e-6) return fallback;
  const ang = Math.atan2(dx, -dy); // 0 = up, clockwise
  return ((Math.round(ang / (Math.PI / 4)) % 8) + 8) % 8;
}

export const animIndex = (dir: number, moving: boolean) => (moving ? 8 : 0) + dir;

/** Frame of an animation at a given time (loops). */
export function frameAt<T extends { d: number }>(frames: T[], elapsedMs: number): { frame: T; i: number } {
  const total = frames.reduce((a, f) => a + Math.max(1, f.d), 0) * TICK_MS;
  let t = total > 0 ? elapsedMs % total : 0;
  for (let i = 0; i < frames.length; i++) {
    const len = Math.max(1, frames[i].d) * TICK_MS;
    if (t < len) return { frame: frames[i], i };
    t -= len;
  }
  return { frame: frames[frames.length - 1], i: frames.length - 1 };
}

/** Sprite flips for a rig frame: the whole frame mirrors with the animation; the head may be mirrored again. */
export function flipsFor(anim: Pick<RigAnimation, 'mirror'>, f: RigFrame) {
  return { body: anim.mirror, head: anim.mirror !== f.hf };
}
