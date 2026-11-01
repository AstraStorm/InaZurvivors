/** Dribble immunity rules. Immunity only lasts while a dribble moves the player and cannot be chained. */

/** Pause after a dribble ends before that player can start another one. */
export const GUARD_LOCKOUT_SEC = 0.9;

export const canStartGuardedMove = (now: number, lockUntil: number) => now >= lockUntil;
