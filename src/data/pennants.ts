/**
 * v1.65 (author): profile banners. A banner hangs next to the player's name in the ranking and on their profile (their
 * own and the one others open). Fifteen original designs in the Inazuma style, drawn here as SVG (no third-party art):
 * three sold in the shop, two earned as achievements, ten that drop from the limited-time banner event (one Mítico
 * only obtainable there, at 3%).
 */
import type { Rarity } from './manifest';

export type PennantSource = 'tienda' | 'logro' | 'evento' | 'codigo' | 'clan';
export type PennantPattern = 'franjas' | 'diagonal' | 'llamas' | 'estrellas' | 'arcoiris' | 'cuadros' | 'tiza' | 'olas' | 'rayos' | 'copos' | 'espiral' | 'nebulosa';
export type PennantEmblem = 'balon' | 'rayo' | 'llama' | 'caravana' | 'corona' | 'neumatico' | 'pizarra' | 'olas' | 'viento' | 'copo' | 'espiral' | 'mano' | 'reloj' | 'planeta' | 'ojo';

export interface PennantDef {
  id: string; name: string; rarity: Rarity; source: PennantSource;
  /** v1.65 (author): 'marco' is an avatar frame (same shop / achievements / event as the banners); absent = a banner */
  kind?: 'marco';
  /** frames: wings on the sides (Legendario and above) */
  wings?: boolean;
  /** shop price in coins */
  price?: number;
  /** how an achievement banner is earned */
  how?: string;
  /** cloth gradient (top, bottom), emblem/pattern colour */
  c1: string; c2: string; accent: string;
  pattern: PennantPattern; emblem: PennantEmblem;
  tagline: string;
}

export const PENNANTS: PennantDef[] = [
  // ---- shop
  { id: 'raimon', name: 'Banderín del Raimon', rarity: 'comun', source: 'tienda', price: 2500, c1: '#2a62d8', c2: '#0d2a6a', accent: '#ffd23f', pattern: 'franjas', emblem: 'balon', tagline: 'El de toda la vida, el del club del instituto.' },
  { id: 'relampago', name: 'Relámpago Inazuma', rarity: 'raro', source: 'tienda', price: 8000, c1: '#1a2f66', c2: '#071233', accent: '#ffe94a', pattern: 'diagonal', emblem: 'rayo', tagline: 'Un rayo amarillo sobre la noche: el once del relámpago.' },
  { id: 'goleador', name: 'Llama del Goleador', rarity: 'epico', source: 'tienda', price: 20000, c1: '#ff7a1a', c2: '#6a0d00', accent: '#ffe08a', pattern: 'llamas', emblem: 'llama', tagline: 'Para quien remata cada balón con fuego.' },
  // ---- achievements
  { id: 'caravana', name: 'Caravana Inazuma', rarity: 'legendario', source: 'logro', how: 'Consigue 200 futbolistas', c1: '#1f47a8', c2: '#081a45', accent: '#ffd23f', pattern: 'estrellas', emblem: 'caravana', tagline: 'Doscientos fichajes: la caravana ya no cabe más.' },
  { id: 'once-leyenda', name: 'Once de Leyenda', rarity: 'leyenda', source: 'logro', how: 'Consigue un futbolista Leyenda', c1: '#3a1270', c2: '#0a0420', accent: '#fff6c8', pattern: 'arcoiris', emblem: 'corona', tagline: 'Solo para quien tiene una Leyenda en su club.' },
  // ---- limited-time event
  { id: 'neumatico', name: 'Neumático de Entrenamiento', rarity: 'comun', source: 'evento', c1: '#4a4a52', c2: '#1a1a20', accent: '#ff9a3a', pattern: 'cuadros', emblem: 'neumatico', tagline: 'Arrastrarlo por la orilla, día tras día.' },
  { id: 'pizarra', name: 'Pizarra del Míster', rarity: 'comun', source: 'evento', c1: '#2a5a3e', c2: '#0d2a1c', accent: '#eef6e6', pattern: 'tiza', emblem: 'pizarra', tagline: 'Equis, círculos y una flecha: el plan está claro.' },
  { id: 'ribera', name: 'Ribera del Río', rarity: 'comun', source: 'evento', c1: '#2a8ad8', c2: '#0d3a6a', accent: '#bfe8ff', pattern: 'olas', emblem: 'olas', tagline: 'Donde se entrena al atardecer.' },
  { id: 'viento-celestial', name: 'Viento Celestial', rarity: 'raro', source: 'evento', c1: '#fff0b8', c2: '#b8861a', accent: '#ffffff', pattern: 'rayos', emblem: 'viento', tagline: 'Una ráfaga dorada que dibuja una S.' },
  { id: 'ventisca', name: 'Ventisca Eterna', rarity: 'raro', source: 'evento', c1: '#a8ecff', c2: '#1a5a9a', accent: '#ffffff', pattern: 'copos', emblem: 'copo', tagline: 'Frío que no se derrite nunca.' },
  { id: 'tornado-fuego', name: 'Tornado de Fuego', rarity: 'raro', source: 'evento', c1: '#ff6a2a', c2: '#4a0a00', accent: '#ffd23f', pattern: 'espiral', emblem: 'espiral', tagline: 'Gira, sube y arde.' },
  { id: 'mano-celestial', name: 'Mano Celestial', rarity: 'epico', source: 'evento', c1: '#ffd84a', c2: '#9a5a0a', accent: '#fff8d8', pattern: 'rayos', emblem: 'mano', tagline: 'La mano que lo para todo.' },
  { id: 'hora-celestial', name: 'Hora Celestial', rarity: 'epico', source: 'evento', c1: '#c8a8ff', c2: '#2e1470', accent: '#ffffff', pattern: 'estrellas', emblem: 'reloj', tagline: 'Detén el tiempo y avanza con calma.' },
  { id: 'la-tierra', name: 'La Tierra', rarity: 'legendario', source: 'evento', c1: '#1e62e0', c2: '#04103a', accent: '#5ee07a', pattern: 'estrellas', emblem: 'planeta', tagline: 'Tres corazones, un solo planeta.' },
  { id: 'supernova', name: 'Supernova Oscura', rarity: 'mitico', source: 'evento', c1: '#2a0a4a', c2: '#050010', accent: '#ff3a1a', pattern: 'nebulosa', emblem: 'ojo', tagline: 'Materia oscura con un ojo rojo. Solo en el evento, 3%.' },
  // ---- 1.81 (author): only through the code INA483; invisible to anyone who hasn't redeemed it
  { id: 'inazuma', name: 'Banner Inazuma', rarity: 'mitico', source: 'codigo', how: 'Código especial', c1: '#0fd8c8', c2: '#02141c', accent: '#ffd23f', pattern: 'rayos', emblem: 'rayo', tagline: 'Un rayo dorado sobre el turquesa: solo para quien tiene el código.' },
  // ---- 1.93 (author): only in the clan shop
  { id: 'clan-estandarte', name: 'Estandarte del Clan', rarity: 'legendario', source: 'clan', how: 'Tienda del clan', c1: '#1a8a5a', c2: '#03180e', accent: '#ffd23f', pattern: 'estrellas', emblem: 'corona', tagline: 'El estandarte que se alza tras una semana en lo más alto.' },
  { id: 'clan-cerezo', name: 'Banderín del Cerezo', rarity: 'epico', source: 'clan', how: 'Tienda del clan', c1: '#ffb8d8', c2: '#7a1a4a', accent: '#ffffff', pattern: 'copos', emblem: 'balon', tagline: 'Pétalos sobre el balón: la Colina de los Cerezos.' },
];

/**
 * v1.65 (author): avatar frames, "la idea de los banners pero con marcos". They go around the player's avatar in the
 * rankings and on the profiles: a ring in the cloth colours, the pattern turned into ornaments (flames, lightning,
 * ice, stars...), the emblem as a crest on top and wings from Legendario up.
 */
export const FRAMES: PennantDef[] = [
  // ---- shop
  { id: 'marco-raimon', kind: 'marco', name: 'Marco del Raimon', rarity: 'comun', source: 'tienda', price: 2000, c1: '#2a62d8', c2: '#0d2a6a', accent: '#ffd23f', pattern: 'franjas', emblem: 'balon', tagline: 'Azul y amarillo, como la equipación del club.' },
  { id: 'marco-trueno', kind: 'marco', name: 'Marco del Trueno', rarity: 'raro', source: 'tienda', price: 6000, c1: '#3a5ad8', c2: '#0a1440', accent: '#ffe94a', pattern: 'diagonal', emblem: 'rayo', tagline: 'Chispas amarillas alrededor del retrato.' },
  { id: 'marco-fuego', kind: 'marco', name: 'Marco Llameante', rarity: 'epico', source: 'tienda', price: 15000, c1: '#ff7a1a', c2: '#7a1000', accent: '#ffe08a', pattern: 'llamas', emblem: 'llama', tagline: 'El retrato rodeado de fuego.' },
  // ---- achievements
  { id: 'marco-caravana', kind: 'marco', name: 'Marco de la Caravana', rarity: 'legendario', source: 'logro', how: 'Consigue 200 futbolistas', wings: true, c1: '#ffd23f', c2: '#8a5a00', accent: '#ffffff', pattern: 'estrellas', emblem: 'caravana', tagline: 'Oro y alas para un club de doscientos.' },
  { id: 'marco-leyenda', kind: 'marco', name: 'Marco de Leyenda', rarity: 'leyenda', source: 'logro', how: 'Consigue un futbolista Leyenda', wings: true, c1: '#fff6c8', c2: '#6a3aa8', accent: '#fff6c8', pattern: 'arcoiris', emblem: 'corona', tagline: 'Corona y arcoíris: solo con una Leyenda en el club.' },
  // ---- limited-time event
  { id: 'marco-entreno', kind: 'marco', name: 'Marco de Entrenamiento', rarity: 'comun', source: 'evento', c1: '#5a5a62', c2: '#1a1a20', accent: '#ff9a3a', pattern: 'cuadros', emblem: 'neumatico', tagline: 'Cuerda, neumático y muchas horas.' },
  { id: 'marco-pizarra', kind: 'marco', name: 'Marco de la Pizarra', rarity: 'comun', source: 'evento', c1: '#2a5a3e', c2: '#0d2a1c', accent: '#eef6e6', pattern: 'tiza', emblem: 'pizarra', tagline: 'Trazado con tiza por el míster.' },
  { id: 'marco-rio', kind: 'marco', name: 'Marco del Río', rarity: 'comun', source: 'evento', c1: '#2a8ad8', c2: '#0d3a6a', accent: '#bfe8ff', pattern: 'olas', emblem: 'olas', tagline: 'Agua fresca de la ribera.' },
  { id: 'marco-viento', kind: 'marco', name: 'Marco del Viento', rarity: 'raro', source: 'evento', c1: '#fff0b8', c2: '#b8861a', accent: '#ffffff', pattern: 'rayos', emblem: 'viento', tagline: 'Una corriente dorada que no para.' },
  { id: 'marco-hielo', kind: 'marco', name: 'Marco de Hielo', rarity: 'raro', source: 'evento', c1: '#a8ecff', c2: '#1a5a9a', accent: '#ffffff', pattern: 'copos', emblem: 'copo', tagline: 'Cristales de escarcha que no se funden.' },
  { id: 'marco-tornado', kind: 'marco', name: 'Marco del Tornado', rarity: 'raro', source: 'evento', c1: '#ff6a2a', c2: '#4a0a00', accent: '#ffd23f', pattern: 'espiral', emblem: 'espiral', tagline: 'Un remolino de fuego alrededor.' },
  { id: 'marco-mano', kind: 'marco', name: 'Marco de la Mano Celestial', rarity: 'epico', source: 'evento', c1: '#ffd84a', c2: '#9a5a0a', accent: '#fff8d8', pattern: 'rayos', emblem: 'mano', tagline: 'Rayos dorados de la mano que lo para todo.' },
  { id: 'marco-reloj', kind: 'marco', name: 'Marco del Tiempo', rarity: 'epico', source: 'evento', c1: '#c8a8ff', c2: '#2e1470', accent: '#ffffff', pattern: 'estrellas', emblem: 'reloj', tagline: 'Las horas marcadas en el borde.' },
  { id: 'marco-tierra', kind: 'marco', name: 'Marco de La Tierra', rarity: 'legendario', source: 'evento', wings: true, c1: '#1e62e0', c2: '#04103a', accent: '#5ee07a', pattern: 'estrellas', emblem: 'planeta', tagline: 'El planeta en órbita sobre tu retrato.' },
  { id: 'marco-supernova', kind: 'marco', name: 'Marco Supernova Oscura', rarity: 'mitico', source: 'evento', wings: true, c1: '#5a1a9a', c2: '#050010', accent: '#ff3a1a', pattern: 'nebulosa', emblem: 'ojo', tagline: 'Alas de materia oscura y un ojo rojo. Solo en el evento, 3%.' },
  // ---- 1.93 (author): only in the clan shop (systems/clans.ts CLAN_PENNANTS)
  { id: 'marco-clan', kind: 'marco', name: 'Marco del Clan', rarity: 'legendario', source: 'clan', how: 'Tienda del clan', wings: true, c1: '#1a8a5a', c2: '#03180e', accent: '#ffd23f', pattern: 'rayos', emblem: 'corona', tagline: 'Alas verdes y una corona: para quien defiende a su clan.' },
  { id: 'marco-cerezo', kind: 'marco', name: 'Marco del Cerezo', rarity: 'epico', source: 'clan', how: 'Tienda del clan', c1: '#ffb8d8', c2: '#7a1a4a', accent: '#ffffff', pattern: 'copos', emblem: 'espiral', tagline: 'Pétalos de la colina donde juegan los clanes.' },
  // ---- 1.81 (author): only through the code INA483
  { id: 'marco-inazuma', kind: 'marco', name: 'Marco Inazuma', rarity: 'mitico', source: 'codigo', how: 'Código especial', wings: true, c1: '#0fd8c8', c2: '#02141c', accent: '#ffd23f', pattern: 'rayos', emblem: 'rayo', tagline: 'Alas de oro y rayos turquesa: solo para quien tiene el código.' },
];

/** banners and frames by id (the ids never clash) */
export const PENNANT_BY_ID = new Map([...PENNANTS, ...FRAMES].map((p) => [p.id, p]));
export const isFrame = (p: PennantDef | undefined) => p?.kind === 'marco';

/** v1.65: the limited-time event: 3 days, paid with coins, drops only its own ten banners */
export const PENNANT_EVENT = {
  id: 'estandartes-leyenda',
  name: 'Evento: Banners y marcos de leyenda',
  /** Madrid midnight; three days from here (the server's clock decides) */
  start: '2026-11-04T00:00:00+01:00',
  days: 3,
  cost: 1500,
  multiCost: 10000, // v1.65 (author): 1500 / 10000 (were 5000 / 50000)
  /** chance of each rarity (percent), split among its banners and frames; each Mítico (banner and frame, only here) 3% */
  odds: { comun: 47, raro: 30, epico: 12, legendario: 5, mitico: 6 } as Partial<Record<Rarity, number>>,
  /** coins back for a banner already owned */
  refund: { comun: 150, raro: 300, epico: 600, legendario: 1200, mitico: 2500 } as Partial<Record<Rarity, number>>,
};
export const EVENT_POOL = [...PENNANTS, ...FRAMES].filter((p) => p.source === 'evento');
