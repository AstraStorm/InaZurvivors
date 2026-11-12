/**
 * v1.65 (author): profile banners. A banner hangs next to the player's name in the ranking and on their profile (their
 * own and the one others open). Fifteen original designs in the Inazuma style, drawn here as SVG (no third-party art):
 * three sold in the shop, two earned as achievements, ten that drop from the limited-time banner event (one Mítico
 * only obtainable there, at 3%).
 */
import type { Rarity } from './manifest';
import { tr } from '../i18n/i18n';

export type PennantSource = 'tienda' | 'logro' | 'evento' | 'codigo' | 'clan' | 'colab' | 'pase' | 'temporada' | 'sector';
export type PennantPattern = 'franjas' | 'diagonal' | 'llamas' | 'estrellas' | 'arcoiris' | 'cuadros' | 'tiza' | 'olas' | 'rayos' | 'copos' | 'espiral' | 'nebulosa' | 'rejilla' | 'huracan';
export type PennantEmblem = 'balon' | 'rayo' | 'llama' | 'caravana' | 'corona' | 'neumatico' | 'pizarra' | 'olas' | 'viento' | 'copo' | 'espiral' | 'mano' | 'reloj' | 'planeta' | 'ojo' | 'bluelock' | 'cuernos' | 'todopoderoso' | 'sector' | 'resistencia';

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
  { id: 'raimon', name: tr('Banderín del Raimon'), rarity: 'comun', source: 'tienda', price: 2500, c1: '#2a62d8', c2: '#0d2a6a', accent: '#ffd23f', pattern: 'franjas', emblem: 'balon', tagline: tr('El de toda la vida, el del club del instituto.') },
  { id: 'relampago', name: tr('Relámpago Inazuma'), rarity: 'raro', source: 'tienda', price: 8000, c1: '#1a2f66', c2: '#071233', accent: '#ffe94a', pattern: 'diagonal', emblem: 'rayo', tagline: tr('Un rayo amarillo sobre la noche: el once del relámpago.') },
  { id: 'goleador', name: tr('Llama del Goleador'), rarity: 'epico', source: 'tienda', price: 20000, c1: '#ff7a1a', c2: '#6a0d00', accent: '#ffe08a', pattern: 'llamas', emblem: 'llama', tagline: tr('Para quien remata cada balón con fuego.') },
  // ---- achievements
  { id: 'caravana', name: tr('Caravana Inazuma'), rarity: 'legendario', source: 'logro', how: tr('Consigue 200 futbolistas'), c1: '#1f47a8', c2: '#081a45', accent: '#ffd23f', pattern: 'estrellas', emblem: 'caravana', tagline: tr('Doscientos fichajes: la caravana ya no cabe más.') },
  { id: 'once-leyenda', name: tr('Once de Leyenda'), rarity: 'leyenda', source: 'logro', how: tr('Consigue un futbolista Leyenda'), c1: '#3a1270', c2: '#0a0420', accent: '#fff6c8', pattern: 'arcoiris', emblem: 'corona', tagline: tr('Solo para quien tiene una Leyenda en su club.') },
  // ---- limited-time event
  { id: 'neumatico', name: tr('Neumático de Entrenamiento'), rarity: 'comun', source: 'evento', c1: '#4a4a52', c2: '#1a1a20', accent: '#ff9a3a', pattern: 'cuadros', emblem: 'neumatico', tagline: tr('Arrastrarlo por la orilla, día tras día.') },
  { id: 'pizarra', name: tr('Pizarra del Míster'), rarity: 'comun', source: 'evento', c1: '#2a5a3e', c2: '#0d2a1c', accent: '#eef6e6', pattern: 'tiza', emblem: 'pizarra', tagline: tr('Equis, círculos y una flecha: el plan está claro.') },
  { id: 'ribera', name: tr('Ribera del Río'), rarity: 'comun', source: 'evento', c1: '#2a8ad8', c2: '#0d3a6a', accent: '#bfe8ff', pattern: 'olas', emblem: 'olas', tagline: tr('Donde se entrena al atardecer.') },
  { id: 'viento-celestial', name: tr('Viento Celestial'), rarity: 'raro', source: 'evento', c1: '#fff0b8', c2: '#b8861a', accent: '#ffffff', pattern: 'rayos', emblem: 'viento', tagline: tr('Una ráfaga dorada que dibuja una S.') },
  { id: 'ventisca', name: tr('Ventisca Eterna'), rarity: 'raro', source: 'evento', c1: '#a8ecff', c2: '#1a5a9a', accent: '#ffffff', pattern: 'copos', emblem: 'copo', tagline: tr('Frío que no se derrite nunca.') },
  { id: 'tornado-fuego', name: tr('Tornado de Fuego'), rarity: 'raro', source: 'evento', c1: '#ff6a2a', c2: '#4a0a00', accent: '#ffd23f', pattern: 'espiral', emblem: 'espiral', tagline: tr('Gira, sube y arde.') },
  { id: 'mano-celestial', name: tr('Mano Celestial'), rarity: 'epico', source: 'evento', c1: '#ffd84a', c2: '#9a5a0a', accent: '#fff8d8', pattern: 'rayos', emblem: 'mano', tagline: tr('La mano que lo para todo.') },
  { id: 'hora-celestial', name: tr('Hora Celestial'), rarity: 'epico', source: 'evento', c1: '#c8a8ff', c2: '#2e1470', accent: '#ffffff', pattern: 'estrellas', emblem: 'reloj', tagline: tr('Detén el tiempo y avanza con calma.') },
  { id: 'la-tierra', name: tr('La Tierra'), rarity: 'legendario', source: 'evento', c1: '#1e62e0', c2: '#04103a', accent: '#5ee07a', pattern: 'estrellas', emblem: 'planeta', tagline: tr('Tres corazones, un solo planeta.') },
  { id: 'supernova', name: tr('Supernova Oscura'), rarity: 'mitico', source: 'evento', c1: '#2a0a4a', c2: '#050010', accent: '#ff3a1a', pattern: 'nebulosa', emblem: 'ojo', tagline: tr('Materia oscura con un ojo rojo. Solo en el evento, 3%.') },
  // ---- 1.81 (author): only through the code INA483; invisible to anyone who hasn't redeemed it
  { id: 'inazuma', name: tr('Banner Inazuma'), rarity: 'mitico', source: 'codigo', how: tr('Código especial'), c1: '#0fd8c8', c2: '#02141c', accent: '#ffd23f', pattern: 'rayos', emblem: 'rayo', tagline: tr('Un rayo dorado sobre el turquesa: solo para quien tiene el código.') },
  // ---- 1.93 (author): only in the clan shop, the weeks the author puts it there (systems/clans.ts CLAN_SHOP_WEEKS)
  // ---- (author) the InaZurvivors x BlueLock celebration: earned while the collab is open (systems/collabEvent.ts),
  //      with the BlueLock logo; hidden until it opens, kept for good by whoever earns it
  { id: 'colab-bluelock', name: tr('InaZurvivors x BlueLock'), rarity: 'mitico', source: 'colab', how: tr('gana 3 partidas mientras esté abierta'), c1: '#1f5bff', c2: '#02061a', accent: '#5fd8ff', pattern: 'rejilla', emblem: 'bluelock', tagline: tr('Ego, fútbol y un candado azul: la colaboración, en tu perfil.') },
  // ---- 2.1 (author): the season pass, Temporada 1 «Soy todopoderoso» (systems/seasonPass.ts); hidden until owned
  { id: 'pase-dominio', name: tr('Dominio de Zanark'), rarity: 'raro', source: 'pase', how: tr('Pase de la Temporada 1, nivel 20'), c1: '#0f6a72', c2: '#021a1e', accent: '#ff3a5a', pattern: 'diagonal', emblem: 'cuernos', tagline: tr('El territorio de Zanark: aquí manda él.') },
  { id: 'pase-cuernos', name: tr('Furia del Dominio'), rarity: 'epico', source: 'pase', how: tr('Pase de la Temporada 1, nivel 40'), c1: '#2a1a5a', c2: '#06021a', accent: '#5fe8f0', pattern: 'rayos', emblem: 'cuernos', tagline: tr('Cuernos al viento y ojos rojos: el Dominio de Zanark entra en el campo.') },
  { id: 'todopoderoso', name: tr('Soy todopoderoso'), rarity: 'legendario', source: 'pase', how: tr('Pase premium de la Temporada 1, nivel 25'), c1: '#ffcc2a', c2: '#4a2a00', accent: '#ffe94a', pattern: 'huracan', emblem: 'todopoderoso', tagline: tr('Una tormenta de oro con truenos azules: así tira Zanark.') },
  // ---- 2.1 (author): the final ranking of Temporada 1 (migration ranking_season); hidden until owned
  { id: 't1-campeon', name: tr('Campeón de la Temporada 1'), rarity: 'mitico', source: 'temporada', how: tr('Top 1 del ranking de la Temporada 1'), c1: '#ffd23f', c2: '#5a1a00', accent: '#fff6c8', pattern: 'huracan', emblem: 'corona', tagline: tr('El número uno del mundo en la Temporada 1. Solo hay uno.') },
  { id: 't1-podio', name: tr('Podio de la Temporada 1'), rarity: 'legendario', source: 'temporada', how: tr('Top 3 del ranking de la Temporada 1'), c1: '#e8ecff', c2: '#2a3060', accent: '#ffcc2a', pattern: 'estrellas', emblem: 'corona', tagline: tr('Plata y estrellas: subiste al podio de la Temporada 1.') },
  { id: 't1-top8', name: tr('Top 8 de la Temporada 1'), rarity: 'epico', source: 'temporada', how: tr('Top 8 del ranking de la Temporada 1'), c1: '#5a2ad8', c2: '#100430', accent: '#ffcc2a', pattern: 'rayos', emblem: 'rayo', tagline: tr('Entre los ocho mejores del mundo en la Temporada 1.') },
  { id: 't1-top15', name: tr('Top 15 de la Temporada 1'), rarity: 'raro', source: 'temporada', how: tr('Top 15 del ranking de la Temporada 1'), c1: '#1a5ad8', c2: '#041030', accent: '#7fd3ff', pattern: 'diagonal', emblem: 'balon', tagline: tr('En la tabla de honor de la Temporada 1.') },
  { id: 'clan-cerezo', name: tr('Banderín del Cerezo'), rarity: 'epico', source: 'clan', how: tr('Tienda del clan'), c1: '#ffb8d8', c2: '#7a1a4a', accent: '#ffffff', pattern: 'copos', emblem: 'balon', tagline: tr('Pétalos sobre el balón: la Colina de los Cerezos.') },
];

/**
 * v1.65 (author): avatar frames, "la idea de los banners pero con marcos". They go around the player's avatar in the
 * rankings and on the profiles: a ring in the cloth colours, the pattern turned into ornaments (flames, lightning,
 * ice, stars...), the emblem as a crest on top and wings from Legendario up.
 */
export const FRAMES: PennantDef[] = [
  // ---- shop
  { id: 'marco-raimon', kind: 'marco', name: tr('Marco del Raimon'), rarity: 'comun', source: 'tienda', price: 2000, c1: '#2a62d8', c2: '#0d2a6a', accent: '#ffd23f', pattern: 'franjas', emblem: 'balon', tagline: tr('Azul y amarillo, como la equipación del club.') },
  { id: 'marco-trueno', kind: 'marco', name: tr('Marco del Trueno'), rarity: 'raro', source: 'tienda', price: 6000, c1: '#3a5ad8', c2: '#0a1440', accent: '#ffe94a', pattern: 'diagonal', emblem: 'rayo', tagline: tr('Chispas amarillas alrededor del retrato.') },
  { id: 'marco-fuego', kind: 'marco', name: tr('Marco Llameante'), rarity: 'epico', source: 'tienda', price: 15000, c1: '#ff7a1a', c2: '#7a1000', accent: '#ffe08a', pattern: 'llamas', emblem: 'llama', tagline: tr('El retrato rodeado de fuego.') },
  // ---- achievements
  { id: 'marco-caravana', kind: 'marco', name: tr('Marco de la Caravana'), rarity: 'legendario', source: 'logro', how: tr('Consigue 200 futbolistas'), wings: true, c1: '#ffd23f', c2: '#8a5a00', accent: '#ffffff', pattern: 'estrellas', emblem: 'caravana', tagline: tr('Oro y alas para un club de doscientos.') },
  { id: 'marco-leyenda', kind: 'marco', name: tr('Marco de Leyenda'), rarity: 'leyenda', source: 'logro', how: tr('Consigue un futbolista Leyenda'), wings: true, c1: '#fff6c8', c2: '#6a3aa8', accent: '#fff6c8', pattern: 'arcoiris', emblem: 'corona', tagline: tr('Corona y arcoíris: solo con una Leyenda en el club.') },
  // ---- limited-time event
  { id: 'marco-entreno', kind: 'marco', name: tr('Marco de Entrenamiento'), rarity: 'comun', source: 'evento', c1: '#5a5a62', c2: '#1a1a20', accent: '#ff9a3a', pattern: 'cuadros', emblem: 'neumatico', tagline: tr('Cuerda, neumático y muchas horas.') },
  { id: 'marco-pizarra', kind: 'marco', name: tr('Marco de la Pizarra'), rarity: 'comun', source: 'evento', c1: '#2a5a3e', c2: '#0d2a1c', accent: '#eef6e6', pattern: 'tiza', emblem: 'pizarra', tagline: tr('Trazado con tiza por el míster.') },
  { id: 'marco-rio', kind: 'marco', name: tr('Marco del Río'), rarity: 'comun', source: 'evento', c1: '#2a8ad8', c2: '#0d3a6a', accent: '#bfe8ff', pattern: 'olas', emblem: 'olas', tagline: tr('Agua fresca de la ribera.') },
  { id: 'marco-viento', kind: 'marco', name: tr('Marco del Viento'), rarity: 'raro', source: 'evento', c1: '#fff0b8', c2: '#b8861a', accent: '#ffffff', pattern: 'rayos', emblem: 'viento', tagline: tr('Una corriente dorada que no para.') },
  { id: 'marco-hielo', kind: 'marco', name: tr('Marco de Hielo'), rarity: 'raro', source: 'evento', c1: '#a8ecff', c2: '#1a5a9a', accent: '#ffffff', pattern: 'copos', emblem: 'copo', tagline: tr('Cristales de escarcha que no se funden.') },
  { id: 'marco-tornado', kind: 'marco', name: tr('Marco del Tornado'), rarity: 'raro', source: 'evento', c1: '#ff6a2a', c2: '#4a0a00', accent: '#ffd23f', pattern: 'espiral', emblem: 'espiral', tagline: tr('Un remolino de fuego alrededor.') },
  { id: 'marco-mano', kind: 'marco', name: tr('Marco de la Mano Celestial'), rarity: 'epico', source: 'evento', c1: '#ffd84a', c2: '#9a5a0a', accent: '#fff8d8', pattern: 'rayos', emblem: 'mano', tagline: tr('Rayos dorados de la mano que lo para todo.') },
  { id: 'marco-reloj', kind: 'marco', name: tr('Marco del Tiempo'), rarity: 'epico', source: 'evento', c1: '#c8a8ff', c2: '#2e1470', accent: '#ffffff', pattern: 'estrellas', emblem: 'reloj', tagline: tr('Las horas marcadas en el borde.') },
  { id: 'marco-tierra', kind: 'marco', name: tr('Marco de La Tierra'), rarity: 'legendario', source: 'evento', wings: true, c1: '#1e62e0', c2: '#04103a', accent: '#5ee07a', pattern: 'estrellas', emblem: 'planeta', tagline: tr('El planeta en órbita sobre tu retrato.') },
  { id: 'marco-supernova', kind: 'marco', name: tr('Marco Supernova Oscura'), rarity: 'mitico', source: 'evento', wings: true, c1: '#5a1a9a', c2: '#050010', accent: '#ff3a1a', pattern: 'nebulosa', emblem: 'ojo', tagline: tr('Alas de materia oscura y un ojo rojo. Solo en el evento, 3%.') },
  // ---- 1.93 (author): only in the clan shop, the weeks the author puts it there (systems/clans.ts CLAN_SHOP_WEEKS)
  { id: 'marco-cerezo', kind: 'marco', name: tr('Marco del Cerezo'), rarity: 'epico', source: 'clan', how: tr('Tienda del clan'), c1: '#ffb8d8', c2: '#7a1a4a', accent: '#ffffff', pattern: 'copos', emblem: 'espiral', tagline: tr('Pétalos de la colina donde juegan los clanes.') },
  // ---- 2.1 (author): the season pass, Temporada 1
  { id: 'marco-dominio', kind: 'marco', name: tr('Marco del Dominio'), rarity: 'epico', source: 'pase', how: tr('Pase de la Temporada 1, nivel 60'), c1: '#0f6a72', c2: '#021a1e', accent: '#ff3a5a', pattern: 'diagonal', emblem: 'cuernos', tagline: tr('Rayos rojos alrededor del retrato, como los ojos de Zanark.') },
  { id: 'marco-todopoderoso', kind: 'marco', name: tr('Marco Todopoderoso'), rarity: 'legendario', source: 'pase', how: tr('Pase premium de la Temporada 1, nivel 75'), c1: '#ffcc2a', c2: '#4a2a00', accent: '#ffe94a', pattern: 'huracan', emblem: 'corona', tagline: tr('Rizos de huracán amarillos y electricidad azul por todo el borde, con una corona arriba.') }, // author's sketch: no wings, a crown on top
  // ---- 2.1 (author): the final ranking of Temporada 1
  // 2.2 Sector Quinto: each side's frame, for its members the first week their side wins (sector.ts SIDES)
  { id: 'marco-sector-quinto', kind: 'marco', name: tr('Marco del Sector Quinto'), rarity: 'legendario', source: 'sector', how: tr('Gana una semana con el Sector Quinto'), wings: true, c1: '#2a4dff', c2: '#04083a', accent: '#e8f0ff', pattern: 'rejilla', emblem: 'sector', tagline: tr('Alas blancas sobre azul: el fútbol, bajo control.') },
  { id: 'marco-resistencia', kind: 'marco', name: tr('Marco de la Resistencia'), rarity: 'legendario', source: 'sector', how: tr('Gana una semana con la Resistencia'), wings: true, c1: '#ffb020', c2: '#5a2a00', accent: '#ffe94a', pattern: 'rayos', emblem: 'resistencia', tagline: tr('Un rayo sobre el escudo: el fútbol es libre.') },
  { id: 'marco-t1-campeon', kind: 'marco', name: tr('Marco del Campeón (T1)'), rarity: 'mitico', source: 'temporada', how: tr('Top 1 del ranking de la Temporada 1'), wings: true, c1: '#ffd23f', c2: '#5a1a00', accent: '#fff6c8', pattern: 'huracan', emblem: 'corona', tagline: tr('Alas de oro y una corona: el campeón de la Temporada 1.') },
  { id: 'marco-t1-podio', kind: 'marco', name: tr('Marco del Podio (T1)'), rarity: 'legendario', source: 'temporada', how: tr('Top 3 del ranking de la Temporada 1'), wings: true, c1: '#e8ecff', c2: '#2a3060', accent: '#ffcc2a', pattern: 'estrellas', emblem: 'corona', tagline: tr('Alas de plata para el podio de la Temporada 1.') },
  // ---- (author) InaZurvivors x BlueLock: for whoever has both its footballers
  { id: 'marco-bluelock', kind: 'marco', name: tr('Marco BlueLock'), rarity: 'mitico', source: 'colab', how: tr('ficha a Nagi y a Isagi'), wings: true, c1: '#1f5bff', c2: '#02061a', accent: '#5fd8ff', pattern: 'rejilla', emblem: 'bluelock', tagline: tr('Cadenas azules y alas: Nagi e Isagi ya juegan en tu club.') },
  // ---- 1.81 (author): only through the code INA483
  { id: 'marco-inazuma', kind: 'marco', name: tr('Marco Inazuma'), rarity: 'mitico', source: 'codigo', how: tr('Código especial'), wings: true, c1: '#0fd8c8', c2: '#02141c', accent: '#ffd23f', pattern: 'rayos', emblem: 'rayo', tagline: tr('Alas de oro y rayos turquesa: solo para quien tiene el código.') },
];

/** banners and frames by id (the ids never clash) */
export const PENNANT_BY_ID = new Map([...PENNANTS, ...FRAMES].map((p) => [p.id, p]));
export const isFrame = (p: PennantDef | undefined) => p?.kind === 'marco';

/** v1.65: the limited-time event: 3 days, paid with coins, drops only its own ten banners */
export const PENNANT_EVENT = {
  id: 'estandartes-leyenda',
  name: tr('Evento: Banners y marcos de leyenda'),
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
