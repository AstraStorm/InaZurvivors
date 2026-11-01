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

export type BuffId = 'escudo' | 'xp' | 'dano' | 'recarga' | 'velocidad' | 'barrera' | 'proteccion' | 'cazador' | 'amplio' | 'apuesta';
export type DropId = BuffId | 'iman' | 'cofre' | 'arroz' | 'chocolate' | 'cofretec' | 'bolsa' | 'ficha' | 'senuelo' | 'hielo' | 'revivir';
/** Revivir charges the captain can carry at once: picking one up past this gives nothing more */
export const MAX_REVIVES = 2;
/** special drops: «Ojo para lo raro» raises only these */
export const SPECIAL_DROPS: DropId[] = ['revivir', 'barrera', 'proteccion', 'cazador', 'amplio', 'apuesta', 'cofre', 'cofretec'];

/** `info` is the one-line explanation shown the first time the player picks one up */
export interface DropDef { id: DropId; label: string; chance: number; texture: string; seconds?: number; info?: string }

export const DROPS: DropDef[] = [
  { id: 'arroz', label: 'Bola de arroz', chance: 0.012, texture: 'items:206', info: 'Recupera un 15% de la vida del capitán.' },
  { id: 'chocolate', label: 'Chocolate', chance: 0.0025, texture: 'items:303', info: 'Recupera un 40% de la vida del capitán.' },
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
  // Fix 1.11
  { id: 'revivir', label: 'Revivir', chance: 0.00035, texture: 'fx:pk_revive', info: 'Una carga: si tu capitán cae, se levanta con un 40% de vida y 2,5 s de invulnerabilidad. Máximo 2 cargas.' },
  { id: 'barrera', label: 'Barrera', chance: 0.0012, texture: 'fx:pk_barrier', seconds: 12, info: 'Anula por completo el siguiente golpe que reciba el capitán (dura 12 s).' },
  { id: 'proteccion', label: 'Protección elemental', chance: 0.001, texture: 'fx:pk_elem', seconds: 12, info: 'Los ataques de jefes y minijefes hacen un 40% menos de daño durante 12 s.' },
  { id: 'cazador', label: 'Cazador de élites', chance: 0.001, texture: 'fx:pk_elite', seconds: 15, info: '+40% de daño contra élites, minijefes y jefes durante 15 s.' },
  { id: 'amplio', label: 'Balón amplio', chance: 0.001, texture: 'fx:pk_area', seconds: 12, info: '+20% de área de las técnicas durante 12 s.' },
  { id: 'apuesta', label: 'Apuesta arriesgada', chance: 0.0008, texture: 'fx:pk_gamble', seconds: 15, info: '+35% de daño, pero el capitán recibe un 25% más de daño durante 15 s.' },
];

export const CHEST_COINS = 40;
export const BAG_COINS = 15;
export const SHIELD_REDUCTION = 0.5;
/** seconds between two magnets, whatever the luck: picking one up is an event */
export const MAGNET_GAP_SEC = 80;
export const MAX_PICKUPS = 260;

/** `magnetReady` is false while the magnet is on its minimum gap or one is still on the pitch; luck never raises its chance. */
export function rollDrop(rng: () => number, luck = 0, magnetReady = true, specialLuck = 0): DropDef | null {
  let x = rng();
  for (const d of DROPS) {
    x -= d.chance * (d.id === 'iman' ? 1 : 1 + luck + (SPECIAL_DROPS.includes(d.id) ? specialLuck : 0));
    if (x < 0) return d.id === 'iman' && !magnetReady ? null : d;
  }
  return null;
}
