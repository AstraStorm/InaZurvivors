/**
 * Run-long modifiers from level-up stat cards and passive objects. Values are provisional balance.
 * Icons are IE2 item icons of a fitting object (boots, bracelet, notebook...), never a technique manual.
 */

import { tr } from '../i18n/i18n';
export interface RunMods { damage: number; cooldown: number; speed: number; pickup: number; xp: number; area: number; hp: number; luck: number; regen: number;
  /** Fix 1.31: flat damage taken off every hit on the captain */
  armor: number }

export const baseMods = (): RunMods => ({ damage: 1, cooldown: 1, speed: 1, pickup: 1, xp: 1, area: 1, hp: 1, luck: 0, regen: 0, armor: 0 });

export interface ModDef { id: string; label: string; description: string; max: number; icon: number; apply(m: RunMods): void }

export const STAT_CARDS: ModDef[] = [
  { id: 'fuerza', label: tr('Entrenamiento de tiro'), description: tr('+6% daño del equipo'), max: 5, icon: 2201, apply: (m) => { m.damage *= 1.06; } },
  { id: 'ritmo', label: tr('Ritmo de juego'), description: tr('-5% recarga de técnicas'), max: 5, icon: 1211, apply: (m) => { m.cooldown *= 0.95; } },
  { id: 'carrera', label: 'Sprint', description: tr('+5% velocidad del equipo'), max: 5, icon: 2203, apply: (m) => { m.speed *= 1.05; } },
  { id: 'aguante', label: tr('Aguante'), description: tr('+8% vida máxima del equipo'), max: 5, icon: 2400, apply: (m) => { m.hp *= 1.08; } },
  // Fix 1.31: flat damage negation (the player's own defence), at most half of each hit
  { id: 'protecciones', label: tr('Equipación reforzada'), description: tr('-1 daño en cada golpe que recibe el capitán (como mucho la mitad del golpe)'), max: 3, icon: 2101, apply: (m) => { m.armor += 1; } },
];

export const PASSIVES: ModDef[] = [
  { id: 'iman', label: tr('Colgante imantado'), description: tr('+20% radio de recogida (suma, máx. +100% entre todas las fuentes)'), max: 3, icon: 1115, apply: (m) => { m.pickup += 0.2; } },
  { id: 'cuaderno', label: tr('Cuaderno de tácticas'), description: '+10% experiencia', max: 3, icon: 1114, apply: (m) => { m.xp *= 1.1; } },
  { id: 'campo', label: tr('Campo amplio'), description: tr('+10% área de técnicas'), max: 3, icon: 2404, apply: (m) => { m.area *= 1.1; } },
  { id: 'trebol', label: tr('Trébol de la suerte'), description: '+8% objetos raros', max: 3, icon: 2405, apply: (m) => { m.luck += 0.08; } },
  { id: 'botella', label: tr('Botella de agua'), description: tr('Recupera 0,25% de vida por segundo'), max: 3, icon: 102, apply: (m) => { m.regen += 0.0025; } },
];

export const modDef = (id: string) => [...STAT_CARDS, ...PASSIVES].find((d) => d.id === id);
