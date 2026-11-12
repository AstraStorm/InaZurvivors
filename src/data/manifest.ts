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
  /** v1.5: id of the Aura this technique is inherited from (only on run copies, never in the manifest) */
  aura?: number;
}

export interface RosterEntry {
  skin?: Skin | null;
  /** 'M' / 'F' from the ROM's catalog (special players: data/special_players.json); for the passives of boys and girls */
  gender?: 'M' | 'F' | null;
  id: number;
  name: string;
  nickname: string;
  position: 'GK' | 'DF' | 'MF' | 'FW';
  element: string | number;
  teams: string[];
  rarity: Rarity;
  /** Fix 1.23: era of the character (first game it appears in, from the wiki): which gacha machine it belongs to */
  era?: 'original' | 'go' | 'vr';
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
  /** special footballer whose sprite already has the body drawn in it (head sheet = whole figure): no Raimon body, no kit */
  fullBody?: boolean;
  /** only comes out of its special banner (data/special_players.json), never from the normal machines */
  exclusive?: string;
  /** v1.5: the Aura this footballer carries in a run (auras.ts carrierForRun); never in the manifest */
  aura?: import('../systems/auras').AuraLink;
  /** 2.0: the warrior spirit he calls in this run and its level (keshin.ts keshinForRun); never in the manifest */
  keshin?: import('../systems/keshin').KeshinRun;
  /** 1.83: lowest value of a stat whatever the rarity band gives (rosterFixes.ts statFloor) */
  statFloor?: Partial<Record<string, number>>;
}

export interface UnitAnim { index: number; mirror: boolean; frames: { f: number; d: number }[] }
export interface UnitInfo extends SheetInfo {
  id: number;
  name: string;
  kind: 'enemy' | 'creature' | 'miniboss' | 'boss';
  stats: Record<string, number> | null;
  /** 'M' / 'F' from the ROM; null for creatures */
  gender?: 'M' | 'F' | null;
  animations: UnitAnim[];
}

export interface MapTexture { key: string; texture: string; w: number; h: number }
export interface MapInfo {
  id: string;
  name: string;
  unlock: string;
  /** v1.7: the rule before the map path got new arenas in between; a save that met it keeps the arena open */
  legacyUnlock?: string;
  /** v1.7: position on the map path (1 = first); every step makes the rivals tougher (mapTierScale) */
  tier?: number;
  /** v1.7: one line for the map path */
  blurb?: string;
  durationSec: number;
  /** 1.93: only for the Juegos del Clan (app keeps it out of the arena path) */
  clanOnly?: boolean;
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
/** 2.11: one colour of the saga's digits: Phaser bitmap font (png + BMFont xml) and the glyphs' [x, width] in the png */
export interface UiDigits { png: string; xml: string; h: number; w: number; glyphs: [number, number][] }
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
  /** Fix 1.12: unit id of the reception robot used as event pedestal */
  eventRobot?: number | null;
  maps: MapInfo[];
  items: { atlas?: string; items: ItemInfo[] };
  /** mugshots are split over several sheets (images); each frame says which one holds it */
  atlases: { portraits?: { image: string; images: string[]; json: string }; mugshots: { image: string; images?: string[]; json: string }; items: { image: string; json: string } };
  profile: { emblems: ProfileIcon[]; coaches: ProfileIcon[] };
  /** pre-2.0: the coaches of Mi Equipo (portraits from IE3, ids of data/coaches.ts) */
  coaches?: { id: string; name: string; texture: string; source?: string }[];
  /** 2.11: GO-era coaches from the author's portrait sheet (tools/go_coaches.py): 64 px face and the sheet's bust */
  goCoaches?: { id: string; name: string; alias?: string; face: string; bust: string }[];
  /** 2.2: the Sector Quinto sides' logos (tools/sector_logos.py) */
  sector?: Record<'sector' | 'resistencia', string> | null;
  /** 2.11: the saga's interface pieces with no text (tools/ui_assets.py): two digit fonts (Phaser bitmap font + the
   *  strip the HUD draws with CSS: x and width of each glyph 0-9) and details */
  ui?: { digits: Record<'naranja' | 'morado', UiDigits>; pieces: Record<'vs' | 'chevron' | 'chevron_azul' | 'rayo_hex' | 'rayo_hex_rojo', string> } | null;
  music: { menu: string[]; battle: string[]; tracks: MusicTrack[]; contexts?: Record<string, string[]> };
  capsule: CapsuleSheet | null;
  /** 1.81: logo of each technique level step (src/systems/evolution.ts labels → generated/mejoras/*.webp) */
  evoIcons?: Record<string, string>;
  /** 2.0: Espíritus Guerreros art (tools/eg_assets.py): portraits by spirit id, level symbols 2-6, Ficha EG, badge */
  eg?: { ficha: string; insignia: string; levels: Record<string, string>; spirits: Record<string, string> } | null;
  /** 2.1: the season pass keys (tools/pase_assets.py) */
  pase?: { normal: string; dorada: string } | null;
  /** the original element icons (Sprites Inazuma/Elementos), by element name */
  elements?: Record<string, string>;
  /** collab logos for their banners (generated/collab), by collab id */
  collab?: Record<string, string>;
  /** verified team kits: body sheets with the same cells and rig as the Raimon body */
  /** saga of IE3 teams, from the export's folders */
  teamSagas?: Record<string, string>;
  /** encyclopedia's main teams (data/teams_canon.json + exported sagas); the rest show under «Ver todos» */
  mainTeams?: string[];
  /** display names of canonical teams */
  teamLabels?: Record<string, string>;
  /** group = the torso group of the kit's wearset: its portrait torsos are generated/kitbusts/<GGKKSSCC>.png;
   *  bustKinds = the KK of field players and goalkeepers when the wearset doesn't use the plain 1/2 (IE3, Fix 1.23) */
  kits?: Record<string, { field: string; gk: string | null; fieldSkin?: Skin | null; gkSkin?: Skin | null; group?: number | null; bustKinds?: [number, number] }>;
  /** old player id -> current id (a character now represented by another ROM record) */
  idAliases?: Record<string, number>;
  /**
   * Repertoires that changed order (tools/sync-assets.ts), oldest first: for each player, map[oldIndex] = newIndex or -1
   * when the technique left; refund[oldIndex] = coins paid for unlocking a technique that left. Saves apply the steps
   * newer than their techRev.
   */
  techRemaps?: { rev: number; players: Record<string, { map: number[]; refund: number[] }> }[];
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
