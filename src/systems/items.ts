/** Combat pickups: experience tiers, magnet, timed buffs and rewards. All values are configurable balance. */

export const XP_TIERS = [
  { id: 'normal', value: 1, texture: 'fx:orb0', chance: 1 },
  { id: 'mejorado', value: 5, texture: 'fx:orb1', chance: 0.07 },
  { id: 'excepcional', value: 20, texture: 'fx:orb2', chance: 0.012 },
] as const;

/** Highest tier that rolls; `luck` raises the rare chances. */
export function rollXpTier(rng: () => number, luck = 0) {
  for (let i = XP_TIERS.length - 1; i > 0; i--) if (rng() < XP_TIERS[i].chance * (1 + luck)) return XP_TIERS[i];
  return XP_TIERS[0];
}

export type BuffId = 'escudo' | 'xp' | 'dano' | 'recarga' | 'velocidad';
export type DropId = BuffId | 'iman' | 'cofre' | 'arroz' | 'chocolate' | 'cofretec' | 'bolsa' | 'ficha' | 'senuelo' | 'hielo';

/** `info` is the one-line explanation shown the first time the player picks one up */
export interface DropDef { id: DropId; label: string; chance: number; texture: string; seconds?: number; info?: string }

export const DROPS: DropDef[] = [
  { id: 'arroz', label: 'Bola de arroz', chance: 0.012, texture: 'items:206', info: 'Recupera un 15% de la vida del equipo.' },
  { id: 'chocolate', label: 'Chocolate', chance: 0.0025, texture: 'items:303', info: 'Recupera un 40% de la vida del equipo.' },
  { id: 'iman', label: 'Imán', chance: 0.0012, texture: 'fx:magnet', info: 'Atrae toda la experiencia del campo.' },
  { id: 'escudo', label: 'Escudo', chance: 0.0025, texture: 'fx:pk_shield', seconds: 8, info: 'Reduce el daño recibido a la mitad durante 8 s.' },
  { id: 'xp', label: 'Experiencia ×2', chance: 0.002, texture: 'fx:pk_xp', seconds: 12, info: 'Duplica la experiencia durante 12 s.' },
  { id: 'dano', label: 'Daño +50%', chance: 0.002, texture: 'fx:pk_dmg', seconds: 10, info: 'El equipo hace un 50% más de daño durante 10 s.' },
  { id: 'recarga', label: 'Recarga -40%', chance: 0.002, texture: 'fx:pk_cd', seconds: 10, info: 'Las técnicas se recargan más rápido durante 10 s.' },
  { id: 'velocidad', label: 'Velocidad +30%', chance: 0.002, texture: 'fx:pk_speed', seconds: 10, info: 'Corres un 30% más rápido durante 10 s.' },
  { id: 'cofre', label: 'Cofre', chance: 0.0015, texture: 'fx:pk_chest', info: 'Monedas extra al terminar la partida.' },
  { id: 'cofretec', label: 'Cofre de técnica', chance: 0.0008, texture: 'fx:pk_tech', info: 'Abre una elección de mejora gratis.' },
  { id: 'bolsa', label: 'Bolsa de monedas', chance: 0.004, texture: 'fx:pk_coins', info: 'Monedas para gastar después de la partida.' },
  { id: 'ficha', label: 'Ficha de Fichaje', chance: 0.0012, texture: 'fx:pk_token', info: 'Una Ficha de Fichaje para la máquina de cápsulas.' },
  { id: 'senuelo', label: 'Señuelo', chance: 0.0012, texture: 'fx:pk_lure', seconds: 5, info: 'Los rivales persiguen el señuelo durante 5 s.' },
  { id: 'hielo', label: 'Congelación', chance: 0.001, texture: 'fx:pk_ice', seconds: 3, info: 'Congela a todos los rivales durante 3 s.' },
];

export const CHEST_COINS = 40;
export const BAG_COINS = 15;
export const SHIELD_REDUCTION = 0.5;
/** seconds between two magnets, whatever the luck: picking one up is an event */
export const MAGNET_GAP_SEC = 80;
export const MAX_PICKUPS = 260;

/** `magnetReady` is false while the magnet is on its minimum gap or one is still on the pitch; luck never raises its chance. */
export function rollDrop(rng: () => number, luck = 0, magnetReady = true): DropDef | null {
  let x = rng();
  for (const d of DROPS) {
    x -= d.chance * (d.id === 'iman' ? 1 : 1 + luck);
    if (x < 0) return d.id === 'iman' && !magnetReady ? null : d;
  }
  return null;
}
