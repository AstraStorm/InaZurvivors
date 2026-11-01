/**
 * Run-long modifiers from level-up stat cards and passive objects. Values are provisional balance.
 * Icons are IE2 item icons of a fitting object (boots, bracelet, notebook...), never a technique manual.
 */

export interface RunMods { damage: number; cooldown: number; speed: number; pickup: number; xp: number; area: number; hp: number; luck: number; regen: number }

export const baseMods = (): RunMods => ({ damage: 1, cooldown: 1, speed: 1, pickup: 1, xp: 1, area: 1, hp: 1, luck: 0, regen: 0 });

export interface ModDef { id: string; label: string; description: string; max: number; icon: number; apply(m: RunMods): void }

export const STAT_CARDS: ModDef[] = [
  { id: 'fuerza', label: 'Entrenamiento de tiro', description: '+6% daño del equipo', max: 5, icon: 2201, apply: (m) => { m.damage *= 1.06; } },
  { id: 'ritmo', label: 'Ritmo de juego', description: '-5% recarga de técnicas', max: 5, icon: 1211, apply: (m) => { m.cooldown *= 0.95; } },
  { id: 'carrera', label: 'Sprint', description: '+5% velocidad del equipo', max: 5, icon: 2203, apply: (m) => { m.speed *= 1.05; } },
  { id: 'aguante', label: 'Aguante', description: '+8% vida máxima del equipo', max: 5, icon: 2400, apply: (m) => { m.hp *= 1.08; } },
];

export const PASSIVES: ModDef[] = [
  { id: 'iman', label: 'Colgante imantado', description: '+20% radio de recogida (suma, máx. +100% entre todas las fuentes)', max: 3, icon: 1115, apply: (m) => { m.pickup += 0.2; } },
  { id: 'cuaderno', label: 'Cuaderno de tácticas', description: '+10% experiencia', max: 3, icon: 1114, apply: (m) => { m.xp *= 1.1; } },
  { id: 'campo', label: 'Campo amplio', description: '+10% área de técnicas', max: 3, icon: 2404, apply: (m) => { m.area *= 1.1; } },
  { id: 'trebol', label: 'Trébol de la suerte', description: '+8% objetos raros', max: 3, icon: 2405, apply: (m) => { m.luck += 0.08; } },
  { id: 'botella', label: 'Botella de agua', description: 'Recupera 0,25% de vida por segundo', max: 3, icon: 102, apply: (m) => { m.regen += 0.0025; } },
];

export const modDef = (id: string) => [...STAT_CARDS, ...PASSIVES].find((d) => d.id === id);
