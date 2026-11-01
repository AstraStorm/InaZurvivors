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
  /** pickup radius: base px, bonus percentages ADD up (never multiply each other), at most +100%, never past maxPx */
  pickupBase: 46, pickupPerMember: 4, pickupBonusMax: 1, pickupMaxPx: 130,
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
/**
 * Effective pickup radius in px. `bonuses` are fractions (0.15 = +15%) from separate sources (permanent upgrade, cards,
 * gear...): they are added, capped at +100%, applied once to the base, and the result never passes pickupMaxPx.
 */
export function pickupRadius(members: number, bonuses: number[]) {
  const pct = Math.min(CAPS.pickupBonusMax, bonuses.reduce((a, b) => a + Math.max(0, b), 0));
  return Math.min(CAPS.pickupMaxPx, Math.round((CAPS.pickupBase + members * CAPS.pickupPerMember) * (1 + pct)));
}
export const capRegen = (x: number) => Math.min(CAPS.regen, x);
