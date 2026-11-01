/** Types of public/generated/manifest.json (written by tools/sync-assets.ts). */

export type Skin = [number, number, number][];
export type Rarity = 'comun' | 'raro' | 'epico' | 'legendario' | 'mitico' | 'leyenda';
export type TechType = 'tiro' | 'regate' | 'defensa' | 'parada' | 'talento';

export interface SheetInfo {
  texture: string;
  frameW: number;
  frameH: number;
  originX: number;
  originY: number;
  columns: number;
}

export interface RigFrame { b: number | null; h: number | null; hf: boolean; d: number }
export interface RigAnimation { index: number; name: string; mirror: boolean; verified: boolean; frames: RigFrame[] }

export interface BodyInfo extends SheetInfo {
  skin?: Skin | null;
  pcb: number;
  sourcePlayer: string;
  rig: { source: string; animations: RigAnimation[] };
}

export interface Technique {
  id: number;
  name: string;
  description: string;
  type: TechType;
  element: string | null;
  power: number;
  cost: number;
  unlockLevel: number;
  /** growth family byte from command.dat (101, 102, 103) */
  growth: number | null;
}

export interface RosterEntry {
  skin?: Skin | null;
  id: number;
  name: string;
  nickname: string;
  position: 'GK' | 'DF' | 'MF' | 'FW';
  element: string | number;
  teams: string[];
  rarity: Rarity;
  body: 'field' | 'gk';
  head: SheetInfo;
  stats: Record<string, number> | null;
  /** technique unlocked by the HÉROE ascension (documented in the ROM for this character, single-user) */
  heroTech?: Technique;
  /** original (English, IE3 ROM) name when the Spanish one is shown */
  nameEn?: string;
  /** portrait torso shape: 1 field / 2 keeper, build and variant (to wear another kit's torso) */
  torso?: { kind: number; build: number; variant: number };
  /** 'derivado' = estimated by InaZurvivors (IE3 stats are not decoded); absent = read from the IE2 ROM */
  statsSource?: 'derivado';
  fpMax: number | null;
  techniques: Technique[];
  starter: boolean;
  startUnlocked: boolean;
}

export interface UnitAnim { index: number; mirror: boolean; frames: { f: number; d: number }[] }
export interface UnitInfo extends SheetInfo {
  id: number;
  name: string;
  kind: 'enemy' | 'creature' | 'miniboss' | 'boss';
  stats: Record<string, number> | null;
  animations: UnitAnim[];
}

export interface MapTexture { key: string; texture: string; w: number; h: number }
export interface MapInfo {
  id: string;
  name: string;
  unlock: string;
  durationSec: number;
  provisional?: string;
  ambience: string;
  enemies: number[];
  minibosses: number[];
  boss: number | null;
  textures: Record<string, MapTexture>;
  minimapTexture?: string;
  blueprint?: Blueprint;
  /** image tiles and depth-sorted props rendered from the game's real 3D scene */
  baked?: { base: string; scene: string; tiles: { x: number; y: number; src: string }[]; props: { x: number; y: number; w: number; h: number; src: string; base: number }[] };
}

export interface BlueprintClass {
  id: string;
  walk: boolean;
  kind: 'ground' | 'tree' | 'building' | 'wall';
  tex: string;
  props?: string[];
  facade?: string;
  crop?: [number, number];
}
export interface Blueprint {
  w: number; h: number; cell: number;
  classes: BlueprintClass[];
  rows: string[];
  pitches: number[][];
  spawn: [number, number];
  decor: string[];
  pitchTex: string;
  stats: Record<string, number>;
}

export interface ProfileIcon { file: string; texture: string; name: string; teamId?: number; index?: number }
export interface MusicTrack { id: string; src: string; durationSec: number; loopStartSec: number | null; onsetsPerSec: number; rms: number }
export interface CapsuleSheet { base: string; rarityColor: Record<string, string>; pieces: Record<string, { file: string; w: number; h: number }>; source: string }

export interface ItemInfo { id: number; name: string; folder: string; icon: number; description: string; price?: number }

export interface Manifest {
  generatedAt: string;
  /** published builds only: hashed file of each kit bust (tools/empaquetar_recursos.py) */
  kitBustFiles?: Record<string, string>;
  bodies: { field?: BodyInfo; gk?: BodyInfo };
  roster: RosterEntry[];
  units: UnitInfo[];
  maps: MapInfo[];
  items: { atlas?: string; items: ItemInfo[] };
  /** mugshots are split over several sheets (images); each frame says which one holds it */
  atlases: { portraits?: { image: string; images: string[]; json: string }; mugshots: { image: string; images?: string[]; json: string }; items: { image: string; json: string } };
  profile: { emblems: ProfileIcon[]; coaches: ProfileIcon[] };
  music: { menu: string[]; battle: string[]; tracks: MusicTrack[]; contexts?: Record<string, string[]> };
  capsule: CapsuleSheet | null;
  /** verified team kits: body sheets with the same cells and rig as the Raimon body */
  /** saga of IE3 teams, from the export's folders */
  teamSagas?: Record<string, string>;
  /** encyclopedia's main teams (data/teams_canon.json + exported sagas); the rest show under «Ver todos» */
  mainTeams?: string[];
  /** display names of canonical teams */
  teamLabels?: Record<string, string>;
  /** group = the kit's wearset team id: its portrait torsos are generated/kitbusts/<GGKKSSCC>.png */
  kits?: Record<string, { field: string; gk: string | null; fieldSkin?: Skin | null; gkSkin?: Skin | null; group?: number | null }>;
  /** old player id -> current id (a character now represented by another ROM record) */
  idAliases?: Record<string, number>;
  /** portrait torso ids available (GGKKSSCC) */
  kitBusts?: number[];
  problems: string[];
}

export const RARITY_LABEL: Record<Rarity, string> = {
  comun: 'Común', raro: 'Raro', epico: 'Épico', legendario: 'Legendario', mitico: 'Mítico', leyenda: 'Leyenda',
};
export const RARITY_ORDER: Rarity[] = ['comun', 'raro', 'epico', 'legendario', 'mitico', 'leyenda'];

/** Original item icon codes used by the game UI (pic3d/sp/io.pkb). */
export const ICON = {
  manual: { tiro: 2601, regate: 2604, defensa: 2607, parada: 2610, talento: 2613 } as Record<TechType, number>,
  riceBall: 206,
  chocolate: 303,
  water: 101,
  xpSmall: 1117,
  xpBig: 1116,
};
