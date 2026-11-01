/** Technique shop. Only touches a player's own repertoire, and is separate from upgrades earned inside a run. */
import type { RosterEntry, Technique } from '../data/manifest';
import { SHOP_ONLY_LEVEL } from './cards';
import type { SaveData } from './save';

export const MAX_TECH_BOOST = 5;

export const unlockCost = (t: Technique) => 200 + Math.round((t.power ?? 0) * 8);
export const boostCost = (t: Technique, level: number) => 150 + Math.round((t.power ?? 0) * 3) + level * 150;

export const isBought = (s: SaveData, playerId: number, index: number) => (s.shop.techUnlocks[String(playerId)] ?? []).includes(index);

/** Locked = needs the shop before it can ever appear on a level-up card. */
export const isLocked = (t: Technique) => t.unlockLevel >= SHOP_ONLY_LEVEL;

/** Unlocks a technique of this player's repertoire: from then on it can be offered from the first level of a run. */
export function buyTechUnlock(s: SaveData, p: RosterEntry, index: number): boolean {
  const t = p.techniques[index];
  if (!t || !s.owned[String(p.id)] || isBought(s, p.id, index)) return false;
  const cost = unlockCost(t);
  if (s.coins < cost) return false;
  s.coins -= cost;
  (s.shop.techUnlocks[String(p.id)] ??= []).push(index);
  return true;
}

/** Technique manual: +5% damage per level for that technique, whoever uses it. */
export function buyTechBoost(s: SaveData, p: RosterEntry, index: number): boolean {
  const t = p.techniques[index];
  if (!t || !s.owned[String(p.id)]) return false;
  const lv = s.shop.techBoosts[String(t.id)] ?? 0;
  const cost = boostCost(t, lv);
  if (lv >= MAX_TECH_BOOST || s.coins < cost) return false;
  s.coins -= cost;
  s.shop.techBoosts[String(t.id)] = lv + 1;
  return true;
}
