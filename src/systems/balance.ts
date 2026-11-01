/**
 * Limits of a build. Every source (cards, permanent upgrades, kit, ascension, talents) multiplies freely in its own
 * file; these caps are applied where the numbers meet in combat, so a great build feels strong without being untouchable.
 * The values and the history of each change are in BALANCE.md.
 */
export const CAPS = {
  /** build damage: full value up to the knee, diminishing above it, never past max */
  damageKnee: 2.2, damageMax: 3.6,
  /** cooldown multiplier floor (techniques can't recharge more than this much faster) */
  cooldown: 0.55,
  speed: 1.55,
  /** at least this share of each hit always lands */
  damageTaken: 0.35,
  crit: 0.3, luck: 0.6, xp: 2, area: 1.7, pickup: 2.5,
  /** share of max HP per second */
  regen: 0.012,
  heroes: 2,
};

/** 1 until the knee, then an asymptote at max. */
export function softCap(x: number, knee = CAPS.damageKnee, max = CAPS.damageMax) {
  if (x <= knee) return x;
  const room = max - knee;
  return knee + room * (1 - Math.exp(-(x - knee) / room));
}
export const capCooldown = (x: number) => Math.max(CAPS.cooldown, x);
export const capSpeed = (x: number) => Math.min(CAPS.speed, x);
export const capTaken = (x: number) => Math.max(CAPS.damageTaken, x);
export const capCrit = (x: number) => Math.min(CAPS.crit, x);
export const capLuck = (x: number) => Math.min(CAPS.luck, x);
export const capXp = (x: number) => Math.min(CAPS.xp, x);
export const capArea = (x: number) => Math.min(CAPS.area, x);
export const capPickup = (x: number) => Math.min(CAPS.pickup, x);
export const capRegen = (x: number) => Math.min(CAPS.regen, x);
