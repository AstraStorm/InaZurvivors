import Phaser from 'phaser';
import type { Manifest, MapInfo, RosterEntry, Technique, UnitInfo } from '../data/manifest';
import { Footballer, bodyKey, headKey } from './Footballer';
import { skinnedTexture } from './skin';
import { analogMove, firstPad, heldKeys } from './controls';
import { masteryDamage, resonanceBonus } from '../systems/mastery';
import { directionFromVector, frameAt } from './rig';
import { Arena } from './MapBuilder';
import { Fx, fxStyle, trajectory, STYLE_COLORS, type FxStyle, type Trajectory } from './fx';
import { charge, impact, recipeFor, type Recipe } from './supertech';
import { sfx, setVolume } from './sfx';
import { MAX_TECH_LEVEL, techStats, type TechStats } from '../systems/techniques';
import { applyCard, drawCards, MAX_TEAM, newMemberState, type Card, type TeamMemberState } from '../systems/cards';
import { baseMods, modDef } from '../systems/runmods';
import { altarFx, type AltarFx } from './fxAltar';
import { ALTAR_EVERY_SEC, ALTAR_ICON, ALTAR_INFO, ALTAR_WAIT_SEC, ALTAR_LABEL, ALTAR_MODE, ALTAR_RADIUS, ALTAR_COLOR, ALTAR_REWARD, ALTAR_TASK, ALTAR_TYPES, FIRST_ALTAR_SEC, createAltar, stepAltar, type Altar } from '../systems/altars';
import { ALTAR_TOKENS, DUEL_TOKENS, ENDLESS_TOKENS, FICHA_DROP, BAG_COINS, CHEST_COINS, DROPS, MAGNET_GAP_SEC, MAX_PICKUPS, MAX_REVIVES, rollDrop, rollXpTier, SHIELD_REDUCTION, XP_TIERS, type BuffId, type DropDef } from '../systems/items';
import { evolutionLabel, evolvesAt, comboLabel } from '../systems/evolution';
import { starBonus } from '../systems/gacha';
import { canStartGuardedMove, GUARD_LOCKOUT_SEC } from '../systems/combat';
import { FORMATIONS, FORMATION_ORDER, headingFromVector, slotPositions, type FormationId } from '../systems/formations';
import type { PerkEffects } from '../systems/perks';
import type { Settings } from '../systems/save';
import { mapTierScale, type RunResult } from '../systems/economy';
import { statCooldown, statDamage, statHealth, statTaken } from '../systems/playerStats';
import { burstSize, FINAL_STRETCH_FROM, finalStretch, xpForLevel, RANK_ORDER, rankDef, variantRamp, waveIntensity, type RankDef } from '../systems/difficulty';
import { capArea, capCooldown, capCrit, capLuck, pickupRadius, capRegen, capSpeed, capTaken, capXp, CAPS, softCap } from '../systems/balance';
import { endlessActive, endlessCoins, endlessPhase, endlessScale } from '../systems/endless';
import { BOSS_WARN_SEC, bossKit, bossPhase, rivalKit, type AttackId, type BossKit } from '../systems/bossKit';
import { chemistry } from '../systems/kitBonus';
import { captainSynergy, chemistrySynergy, resonances, type Synergy } from '../systems/synergy';
import { teamLabel as kitTeamLabel } from '../data/sagas';
import { HERO_AURA } from '../systems/ascension';
import { dragon, handKind, handTintOf, keeperHand } from './fxTech';
import { orphans } from '../systems/groundSweep';
import { chaosMeteorCharge, chaosMeteorShot, fireStormCharge, fireStormShot, elementBurst, phoenix, phoenixFlight, setLowPower, teamBeams } from './fxManif';
import { crossfireCharge, crossfireShot } from './fxCross';
import { cullOffscreen, type CullStats } from './cull';
import { corrienteNegra, corteVolcanico, isCorrienteNegra, isCorteVolcanico } from './fxJaden';
import type { CoachRun } from '../data/coaches';
import { COOP_HOST_ALTARS, CoopSession, type CoopPort, type CoopRun, type DropMsg, type FxMsg, type SpawnMsg, type TeleMsg } from './coopArena';
import { dribbleOf, frenteCharge, frenteShot, gungnirCharge, gungnirShot, movieCharge, movieDribble, movieOf, movieShot, rupturaCharge, rupturaShot, superrayoCharge, superrayoShot, zeroCharge, zeroShot } from './fxMovie';
import { blackAshCharge, blackAshTrail, illusionBall, signatureOf, stormZone } from './fxSignature';
import { COMBO189, combo189Charge, combo189Shot, solo189Charge, solo189Of, solo189Shot, type Combo189 } from './fxCombo183';
import { COMBO183, combo183Charge, combo183Shot, combo183Wind, isMeteorShower, judgementHammer, killerFieldsBlast, maouHand, meteorShower, solo183Charge, solo183Of, solo183Shot, type Combo183 } from './fxCombo183';
import { natureArea, natureCharge, natureOf, natureShot, setNatureLowPower } from './fxNature';
import { blackAxeStrike, AXE_MS, CAST_DEPTH, skyBolt, BOLT_MS, spiritApparition, ultBanner } from './fxKeshin';
import { whiteBreath, BREATH_MS } from './fxGuiverno';
import { solarFlare, SUN_MS } from './fxApolo';
import { samuraiSlash, SLASH_MS } from './fxMusashi';
import { CLAW_MS, royalClaw } from './fxJmet';
import { flameClaws, FLAME_MS } from './fxHuargo';
import { demonBolt, DEMON_MS } from './fxGlenr';
import { insidiousThorns, THORN_MS } from './fxEris';
import { iceLance, ICE_MS } from './fxChione';
import { harmony, HARMONY_MS } from './fxMagister';
import { colorBurst, COLOR_MS } from './fxPapelin';
import { scarletPrison, PRISON_MS, prisonSize } from './fxZodiaco';
import { demonClear, demonClearSize, DEMOGORGO_MS } from './fxDemogorgo';
import { athenaStrike, ATHENA_MS } from './fxAtenea';
import { ReplayRecorder } from './replay';
import { drawShot } from './shotReplay';
import { mortalSmash, SMASH_MS, smashSize } from './fxEvera';
import { shellbitBurst, SHELLBIT_CHARGE } from './fxShellbit';
import { greatHand, greatSize, GREAT_MS } from './fxGrandius';
import { inferno, INFERNO_MS } from './fxSurtur';
import { lancelotThrust, THRUST_MS } from './fxLancelot';
import { victorCharge, victorOf, victorShot } from './fxVictor';
import { isSetsuna, setsunaCharge, setsunaShot } from './fxSetsuna';
import { ultimateElevenCharge, ultimateElevenShot } from './fxUltimateEleven';
import { nocturneCharge, nocturneShot, NOCTURNE_WIND } from './fxNocturne';
import { cataclysmCharge, cataclysmShot, isCataclysm } from './fxCataclysm';
import { almightyCharge, almightyShot, isAlmighty } from './fxAlmighty';
import { LAST_RESORT_WIND, lastResortCharge, lastResortShot, type LastResort } from './fxLastResort';
import { applyKeshin, KESHIN_BY_ID, ULT_FIRST_SHARE, ultTech, ultTechLevel, type KeshinId } from '../systems/keshin';

/** 2.0: the slot index of a member's warrior-spirit ultimate (after the five technique slots); fired with R / the HUD button */
const ULT = 5;
/** 2.02 Métricas: the damage the team deals in these seconds after an ultimate counts as that spirit's */
const ULT_DMG_WINDOW_SEC = 3;
import { animeCharge, animeOf, animeShot, auroraVeil, cometTex, earthBurst, earthCharge, furyFist, breezeStep, chaosBreakCharge, chaosBreakShot, fireBlizzardCharge, fireBlizzardShot, godWindGust } from './fxAnime';
import { fuegoOf, supremoCharge, supremoShot, totalCharge, totalWave } from './fxFuego';
import { adaptedPassive, CAP_ELEMENTAL, CAP_LAST_STAND, emptyFx, TALENTS, talentScale, type TalentFx } from '../systems/talents';
import { COMBOS, COMBOS_BY_PRIORITY, COMBO_MAX_LEVEL, comboCast, comboDamage, comboGoals, comboHints, comboMembers, comboReady, type ComboDef } from '../systems/combos';
import { AURA_ELEMENT_BONUS, AURA_TECH_DAMAGE } from '../systems/auras';
import type { Rank } from '../systems/save';
import { mapTextureKeys, swapRunTextures } from './runTextures';

export interface HudTech { name: string; type: Technique['type']; level: number; evolution: string; cd: number; /** v1.5: inherited from the Aura */ aura?: boolean; /** v1.7: combined technique that needs this one higher */ combo?: string; /** 1.83: the level it needs */ comboNeed?: number }
export interface HudMember { id: number; techs: (HudTech | null)[]; /** v1.5 */ aura?: { id: number; name: string } | null }
export interface HudState {
  hp: number; maxHp: number; xp: number; xpNext: number; level: number; timeSec: number; durationSec: number;
  kills: number; team: HudMember[]; boss: { name: string; hp: number; maxHp: number; title: string; phase: number; rival: boolean } | null;
  rerolls: number; formation: FormationId; formationChangedAt: number; hurtAt: number; healAt?: number; now: number;
  buffs: { id: BuffId; left: number; total: number; label?: string }[];
  runCoins: number; runTokens: number; shield: number;
  resonance: { element: string; bonus: number }[];
  /** Fix 1.31: every team synergy with its progress (synergy.ts), for the big HUD panel */
  synergies: Synergy[];
  altar: { type: Altar['type']; label: string; task: string; state: Altar['state']; progress: number; goal: number; timeLeft: number; dist: number; inside: boolean; waitLeft: number;
    rival: { id: number | null; name: string; team: string } | null } | null;
  /** last technique that went up a level, so the HUD can pulse it */
  upgraded: { playerId: number; slot: number; at: number } | null;
  /** special slot of the combined techniques (0 = ready) */
  combos: { name: string; level: number; cd: number }[];
  /** 2.0: the active warrior spirit's ultimate (R / Y / its button; at most one); cd 0 = ready */
  ults?: { playerId: number; spirit: string; tech: string; cd: number; left: number }[];
  /** v1.7: combined techniques still to learn with the team on the pitch, and what each participant needs */
  comboGoals: { id: string; name: string; complete: boolean; ready: boolean; parts: { player: string; tech?: string; anyTech?: boolean; bestTech?: string; need: number; have: number; memberId: number | null; viaAura: boolean }[] }[];
  /** v1.7: Revivir charges left, and the most a run can hold */
  revives: number; reviveMax: number;
  /** endless survival: difficulty multiplier and seconds survived after the boss */
  endless: { mult: number; sec: number; phase: string } | null;
}

/** Point of interest on the pitch, for the minimap and the arrows at the edge of the screen. */
export interface Poi { kind: 'evento' | 'jefe' | 'minijefe' | 'objeto' | 'companero'; icon: string; color: number; x: number; y: number; label: string; priority: number }
export interface MarkerState {
  pois: Poi[]; player: { x: number; y: number }; world: { w: number; h: number };
  view: { x: number; y: number; w: number; h: number; zoom: number; screenW: number; screenH: number };
}

export interface ArenaHooks {
  hud(s: HudState): void;
  levelUp(cards: Card[], rerolls: number, reroll: () => Card[], level: number): Promise<Card>;
  end(r: RunResult & { level: number }): void;
  pause(): void;
  /** boss beaten for the first time: the player picks finishing now or endless survival */
  bossDown(): Promise<'end' | 'continue'>;
  /** author: the loading screen — the share of the run's files loaded (0..1), and the first frame drawn */
  loading?(progress: number): void;
  ready?(): void;
  markers?(m: MarkerState): void;
  /** pre-2.0 (IDEA-45F61B95): the co-op partner is choosing his level-up card (null: he is not) */
  coopPicking?(name: string | null): void;
  /** an event just ended: what happened, shown as a card */
  event?(r: { ok: boolean; title: string; detail: string }): void;
  /** Fix 1.12: a combined technique was just learned: participants' portraits and its name */
  combo?(c: { name: string; ids: number[] }): void;
  /** 2.0: a signing that brings a warrior spirit; `active`: it is the team's active one (its ultimate on R) */
  egJoin?(e: { playerId: number; active: boolean }): void;
  /** 1.82 (author: the boss had to feel dangerous): the alarm a moment before the boss comes, then its entrance card */
  bossWarn?(): void;
  bossIntro?(b: { name: string; title: string; again: boolean }): void;
  bossDefeated?(): void;
  /** 2.1: the Llave dorada dropped from a rival this run (the app unlocks the premium pass and says so) */
  goldKey?(): void;
  /** Altar de despido: the player picks a teammate to send off (never the captain); null = nobody */
  dismiss?(ids: number[]): Promise<number | null>;
}

export interface ArenaInit {
  manifest: Manifest; map: MapInfo; team: RosterEntry[]; unlocked: RosterEntry[]; stars: Record<string, number>;
  hooks: ArenaHooks; settings: Settings; perks: PerkEffects; formation: FormationId; seed?: number;
  /** shop state: repertoire indexes bought per player, permanent boost levels per technique id */
  shop?: { techUnlocks: Record<string, number[]>; techBoosts: Record<string, number> };
  mastery?: Record<string, number>;
  loadout?: Record<string, number>;
  /** team of the equipped kit, for club chemistry (kitBonus.ts) */
  kitTeam?: string;
  /** ascension multipliers per player id (ascension.ts) */
  asc?: Record<string, { damage: number; hp: number; hero: boolean }>;
  /** difficulty rank of the run (C if absent) */
  rank?: Rank;
  /** first time a pickup is collected, for its one-line explanation */
  onPickup?: (id: string, label: string, info: string) => void;
  /** body textures of the kit worn by the squad; absent = Raimon */
  kit?: NonNullable<Manifest['kits']>[string] | null;
  /** v1.5: the Auras of the squad (their own entries), only to show them inside a combined technique */
  auras?: RosterEntry[];
  /** v1.6: training field — chosen techniques and levels, chosen combined techniques; no damage taken, no rewards */
  training?: TrainingSetup;
  /** pre-2.0: a co-op run (coopArena.ts): this player's role, the link and the partner's team */
  coop?: CoopRun;
  /** pre-2.0: the coach on the bench: his formation and element bonuses (the rest is already in the perks, coaches.ts) */
  coach?: CoachRun;
  /** pre-2.0: a match of Road to Fútbol Frontier: the boss ends it (no endless) */
  road?: boolean;
  /** 2.1: the season pass's Llave dorada: chance per rival knocked out (already ×2 in co-op) and its picture; absent = none */
  goldKey?: { chance: number; texture: string | null };
  /** 2.02: record the run (replay.ts) with this kit and game version in its header; the app uploads it at the end */
  record?: { kit: string | null; version: string };
}

/** v1.6: what the training field puts on the pitch: each footballer's active techniques with their levels, and combos */
export interface TrainingSetup {
  members: { id: number; slots: number[]; levels: Record<number, number> }[];
  combos: Record<string, number>;
}
/** 1.76: the saves of a Leyenda keeper hit like shots (base parada damage is 0.2 of the power, a shot 0.5) and heal more */
const LEGEND_SAVE_DAMAGE = 2.4;
const LEGEND_SAVE_HEAL = 1.5;
/** rivals kept on the pitch while training */
const TRAINING_RIVALS = 22;

interface Member {
  f: Footballer; state: TeamMemberState; entry: RosterEntry; damageMult: number;
  cds: number[]; maxCd: number[]; styles: FxStyle[]; trajs: Trajectory[]; recipes: Recipe[];
  slot: number; windup: { i: number; until: number } | null;
  /** 2.0: his warrior spirit's ultimate (slot ULT), fired by the player */
  ult: { tech: Technique; lv: number } | null;
  dash: { fromX: number; fromY: number; toX: number; toY: number; t: number; dur: number; hits: Set<Enemy>; chain: Set<Enemy>; dmg: number; style: FxStyle; left: number } | null;
  vx: number; vy: number; settled: boolean;
  /** v1.65: distance to its formation slot; a new dribble only starts back in formation, so nobody sticks to a boss */
  slotDist: number;
  /** contact-immune until this run time (only while a dribble moves the player) */
  guardUntil: number;
  /** no new dribble may start before this run time: immunity can't be chained */
  guardLock: number;
  /** max health this teammate added to the team (taken back if he is sent off) */
  hpAdd: number;
}
interface Enemy {
  /** pre-2.0: stable id, the same on both screens of a co-op run */
  id?: number;
  sprite: Phaser.GameObjects.Sprite; unit: UnitInfo; hp: number; maxHp: number; speed: number; damage: number;
  kind: UnitInfo['kind']; animTime: number; dir: number; hitCd: number; knockX: number; knockY: number;
  radius: number; dead: boolean; pos: { x: number; y: number }; slowUntil: number; altarWave?: boolean;
  variant?: 'elite' | 'runner' | 'shooter' | 'flanker' | 'bomber' | 'tank';
  /** flanker: the side it comes from; shooter and bomber: the warning being shown */
  side?: number; fireCd?: number; aim?: { t: number; dx: number; dy: number; gfx: Phaser.GameObjects.Rectangle }; fuse?: { t: number; gfx: Phaser.GameObjects.Arc };
  /** boss/miniboss pattern timer and the attack being telegraphed or performed */
  patternCd?: number; pattern?: { kind: AttackId; t: number; dx: number; dy: number; gfx?: Phaser.GameObjects.GameObject; n?: number };
  kit?: BossKit; phase?: number; lastAttack?: AttackId; rival?: boolean;
  /** Araña Gigante: caught in the web (doesn't move) until this time; Mordisco de serpiente: poison damage per second */
  webUntil?: number; poison?: { until: number; dps: number; acc: number };
  /** Gafe: cursed until this time */
  curseUntil?: number;
}

/** width in radians of the opening of a shock wave */
const SHOCK_GAP = 1.1;
const BOMB_RADIUS = 52;
/** names of the boss attacks when the character has no own name for them (defeat screen) */
const ATTACK_LABEL: Record<AttackId, string> = { carga: 'carga', radial: 'disparo en estrella', abanico: 'disparo en abanico', espiral: 'espiral de balones',
  lluvia: 'lluvia de balones', onda: 'onda de choque', invocacion: 'invocación', majin: 'golpe de la entidad' };
interface EnemyShot { img: Phaser.GameObjects.Image; x: number; y: number; vx: number; vy: number; life: number; damage: number; src: HitSource }
/** where a hit on the captain came from, for the defeat screen */
export interface HitSource { by: string; attack: string; still?: boolean }
interface Hazard { x: number; y: number; t: number; fall: number; r: number; damage: number; shadow: Phaser.GameObjects.Ellipse; ring: Phaser.GameObjects.Ellipse; ball?: Phaser.GameObjects.Image; src: HitSource }
interface Projectile {
  ball: Phaser.GameObjects.Image; aura: Phaser.GameObjects.Arc; x: number; y: number; vx: number; vy: number; t: number;
  traj: Trajectory; style: FxStyle; damage: number; pierce: number; life: number; hits: Set<Enemy>; knock: number;
  level: number; explode: boolean; scale: number; targetY?: number; phase: number; dragon: boolean; recipe: Recipe; blast: number; exploded?: boolean;
  /** Fix 1.53: La Tierra's comets leave a streak of light instead of the element trail */
  comet?: boolean;
}
/** x/y is the real position; the image only adds a bob on top while it rests, so nothing fights the pull */
interface Pickup { id?: number; img: Phaser.GameObjects.Image; kind: 'xp' | 'item'; value: number; drop?: DropDef; pulled: boolean; x: number; y: number; speed: number; born: number }

const MAX_ENEMIES = 150;

export class ArenaScene extends Phaser.Scene {
  private cfg!: ArenaInit;
  private arena!: Arena;
  private fx!: Fx;
  private members: Member[] = [];
  /** players sent off at an Altar de despido: they don't come back as recruit cards this run */
  private dismissed = new Set<number>();
  private enemies: Enemy[] = [];
  private projectiles: Projectile[] = [];
  private pickups: Pickup[] = [];
  private trail: { x: number; y: number }[] = [];
  private hp = 100;
  private maxHp = 100;
  private xp = 0;
  private level = 1;
  private kills = 0;
  private runTime = 0;
  /** seconds of the current run, for bug reports */
  get elapsedSec() { return this.runTime; }
  private spawnAcc = 0;
  private flowAcc = 0;
  private fadeAcc = 0;
  private minibossesSpawned = 0;
  private minibossesKilled = 0;
  private boss: Enemy | null = null;
  private bossSpawned = false;
  /** 1.82: the alarm before the boss already sounded */
  private bossWarned = false;
  /** 1.82: boss juice, rate limits */
  private nextBossSpark = 0; private nextBossShake = 0; private enragedFx = new WeakMap<Enemy, number>();
  private ended = false;
  private hudAcc = 0;
  private rerolls = 2;
  private levelingUp = false;
  private formation: FormationId = 'equilibrada';
  private formationChangedAt = -10;
  private hurtAt = -10;
  /** 2.0: last heal (HUD flash) and the regeneration gathered since its last number */
  private healAt = -10;
  private regenShown = 0;
  private regenAt = 0;
  /** shared i-frames: a crowd touching the squad at once costs one hit, not ten */
  private invulnUntil = 0;
  private hitsTaken: Record<string, number> = {};
  /** who and what is hitting right now (set by bosses, shooters and hazards), and the last hit the captain took */
  private hitSrc: HitSource = { by: '', attack: '' };
  private lastHit: (HitSource & { dmg: number; at: number }) | null = null;
  /** Revivir charges picked up this run (in-run item) */
  private reviveCharges = 0;
  private guardBlocks = 0;
  private mods = baseMods();
  private taken: Record<string, number> = {};
  private buffs = new Map<BuffId, { until: number; total: number }>();
  private bonusCoins = 0;
  private lastUpgrade: HudState['upgraded'] = null;
  private techUses: Record<string, number> = {};
  /** v1.5: inherited techniques fired and combined techniques with an Aura taking part (achievements) */
  private auraTechUses = 0;
  private auraCombos = 0;
  private bonusTokens = 0;
  private padHeld: Record<number, boolean> = {};
  private xpCombo = 0;
  private xpComboUntil = 0;
  private techById: Record<string, number> = {};
  private altar: Altar | null = null;
  private altarGfx: Phaser.GameObjects.GameObject[] = [];
  /** 1.93: the altar's look (fxAltar.ts) */
  private altarLook: AltarFx | null = null;
  private nextAltarAt = FIRST_ALTAR_SEC;
  private altarKills = 0;
  /** portal events release their rivals a few at a time */
  private portalLeft = 0;
  private portalNext = 0;
  private freezeUntil = 0;
  /** (author) an ultimate stops the game while its scene plays (performance.now ms) */
  private cineUntil = 0;
  private lure: { x: number; y: number; until: number } | null = null;
  private heading = 0;
  private capVx = 0;
  private capVy = 0;
  private rng!: Phaser.Math.RandomDataGenerator;
  private rank: RankDef = rankDef('C');
  private shots: EnemyShot[] = [];
  private hazards: Hazard[] = [];
  private nextHazardAt = 20;
  private wavePhase = '';
  private stretchAnnounced = false;
  /** brief slow motion before the level-up cards: the moment reads, then the choice */
  private slowmoUntil = 0;
  /** Fix 1.12 game feel: hitstop, and the kills of the last moment for the sweep reward */
  private hitstopUntil = 0; private nextHitstop = 0; private recentKills: number[] = []; private nextSweepCheer = 0;
  private hitstop(ms: number) {
    const now = performance.now();
    if (now < this.nextHitstop || this.cfg.settings.reducedMotion) return;
    this.hitstopUntil = now + ms;
    this.nextHitstop = now + ms + 260; // never chained: the game must not feel sticky
  }
  private secondWindUsed = false;
  private altarsDone = 0;
  private damageDealt = 0;
  private runId = '';
  /** 2.1: chance of the Llave dorada per rival knocked out (0 once it dropped this run) */
  private goldChance = 0;
  /** 2.02 Métricas: ultimates cast and the damage dealt right after them, by spirit */
  private ultLog = new Map<string, { casts: number; damage: number }>();
  private ultWin: { spirit: string; until: number } | null = null;
  /** 2.02: the run being recorded (null: not recording) */
  private rec: ReplayRecorder | null = null;
  /** endless survival after the boss: start time, last reward tick, movement in the current tick (anti-AFK) */
  private endless: { since: number; nextTick: number; moved: number; ticks: number; nextBoss: number; nextMiniboss: number; killsAtTick: number; phase: number; bosses: number; coins: number; tokens: number } | null = null;
  private shocks: { x: number; y: number; r: number; gap: number; damage: number; color: number; g: Phaser.GameObjects.Graphics; hit: boolean; src: HitSource }[] = [];
  private campX = 0; private campY = 0; private campSince = 0; private campWarned = false; private nextCampHit = 0; private nextSurround = 0;
  private lastMagnetAt = -MAGNET_GAP_SEC;
  private altarAccepted = false; private altarWait = 0; private altarTag: Phaser.GameObjects.Text | null = null;
  private altarRival: { unit: UnitInfo; entry: RosterEntry | null } | null = null;
  private rival: Enemy | null = null;
  private aimLines = 0;
  private markerAcc = 0;
  private fxCache: TalentFx | null = null; private fxAt = -1; private reviveUsed = false;
  private lastCapPos = { x: 0, y: 0 };
  /** learned combined techniques: level and cooldown of their special slot */
  private combos = new Map<string, { level: number; cd: number }>();
  /** pre-2.0: the co-op session (null when playing alone), downed captain, ids shared with the partner */
  coop: CoopSession | null = null;
  private down = false;
  private nextEnemyId = 1;
  private nextPickupId = 1;
  private coopResumePending = false;
  private coopPendingLevels = 0;

  constructor() { super('Arena'); }

  init(data: ArenaInit) {
    this.cfg = data;
    this.nextSweep = 0; this.sweptOrphans = 0;
    this.members = []; this.enemies = []; this.projectiles = []; this.pickups = []; this.trail = [];
    this.hp = this.maxHp = 100; this.xp = 0; this.level = 1; this.kills = 0; this.runTime = 0; this.spawnAcc = 0;
    this.flowAcc = 0; this.fadeAcc = 0; this.minibossesSpawned = 0; this.minibossesKilled = 0; this.boss = null;
    this.bossSpawned = false; this.bossWarned = false; this.ended = false; this.rerolls = 2 + data.perks.extraRerolls; this.levelingUp = false;
    this.formation = data.formation; this.formationChangedAt = -10; this.hurtAt = -10; this.healAt = -10; this.regenShown = 0; this.regenAt = 0; this.heading = 0; this.capVx = 0; this.capVy = 0; this.invulnUntil = 0; this.hitsTaken = {}; this.lastHit = null; this.reviveCharges = 0; this.hitSrc = { by: '', attack: '' };
    this.rng = new Phaser.Math.RandomDataGenerator([String(data.seed ?? Date.now())]);
    this.mods = baseMods(); this.taken = {}; this.buffs = new Map(); this.bonusCoins = 0; this.lastUpgrade = null; this.techUses = {}; this.auraTechUses = 0; this.auraCombos = 0; this.guardBlocks = 0;
    this.padHeld = {}; this.xpCombo = 0; this.xpComboUntil = 0; this.techById = {};
    this.rank = rankDef(data.rank); this.shots = []; this.hazards = []; this.nextHazardAt = 20; this.wavePhase = ''; this.stretchAnnounced = false; this.combos = new Map(); this.slowmoUntil = 0; this.hitstopUntil = 0; this.nextHitstop = 0; this.recentKills = []; this.nextSweepCheer = 0; this.endless = null; this.secondWindUsed = false; this.altarsDone = 0; this.damageDealt = 0; this.dismissed = new Set();
    this.rec = null; this.ultLog = new Map(); this.ultWin = null; this.goldChance = data.goldKey?.chance ?? 0;
    this.coop = null; this.down = false; this.nextEnemyId = 1; this.nextPickupId = 1; this.coopResumePending = false; this.coopPendingLevels = 0;
    this.runId = crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`; this.spawnAcc = 1.2; // first rivals within a second or two
    this.bonusTokens = 0; this.altar = null; this.altarGfx = []; this.altarLook = null; this.altarTag = null; this.rival = null; this.altarRival = null; this.fxCache = null; this.fxAt = -1; this.reviveUsed = false; this.shocks = []; this.campSince = 0; this.campWarned = false; this.nextCampHit = 0; this.nextSurround = 60; this.lastMagnetAt = -MAGNET_GAP_SEC; this.nextAltarAt = FIRST_ALTAR_SEC; this.altarKills = 0; this.freezeUntil = 0; this.lure = null;
    setVolume(data.settings.volume);
  }

  preload() {
    const { manifest: m, map, unlocked, team } = this.cfg;
    this.load.on('progress', (p: number) => this.cfg.hooks.loading?.(p));
    const sheet = (key: string, s: { texture: string; frameW: number; frameH: number }) => {
      if (!this.textures.exists(key)) this.load.spritesheet(key, s.texture, { frameWidth: s.frameW, frameHeight: s.frameH });
    };
    if (m.bodies.field) sheet(bodyKey('field'), m.bodies.field);
    if (m.bodies.gk) sheet(bodyKey('gk'), m.bodies.gk);
    const kit = this.cfg.kit;
    if (kit && m.bodies.field) {
      sheet(`kit:${kit.field}`, { ...m.bodies.field, texture: kit.field });
      if (kit.gk && m.bodies.gk) sheet(`kit:${kit.gk}`, { ...m.bodies.gk, texture: kit.gk });
    }
    for (const p of new Map([...unlocked, ...team, ...(this.cfg.auras ?? []), ...(this.cfg.coop?.partner.team ?? [])].map((x) => [x.id, x])).values()) sheet(headKey(p.id), p.head);
    const pk = this.cfg.coop?.partner.kit; // pre-2.0: the partner's kit, for his ghosts
    if (pk && m.bodies.field) { sheet(`kit:${pk.field}`, { ...m.bodies.field, texture: pk.field }); if (pk.gk && m.bodies.gk) sheet(`kit:${pk.gk}`, { ...m.bodies.gk, texture: pk.gk }); }
    const units = new Map(m.units.map((u) => [u.id, u]));
    const rivals = [...map.enemies, ...map.minibosses, ...(map.boss !== null ? [map.boss] : []), ...(m.eventRobot ? [m.eventRobot] : [])];
    swapRunTextures(this, [...mapTextureKeys(map), ...rivals.map((id) => `unit:${id}`)]); // 2.11: the last run's arena and rivals go (they piled up until phones killed the page)
    for (const id of rivals) {
      const u = units.get(id);
      if (u) sheet(`unit:${id}`, u);
    }
    for (const t of Object.values(map.textures)) if (!this.textures.exists(t.key)) this.load.image(t.key, t.texture);
    if (map.baked) for (const f of [...map.baked.tiles, ...map.baked.props]) {
      const key = `bk:${map.id}:${f.src}`;
      if (!this.textures.exists(key)) this.load.image(key, map.baked.base + f.src);
    }
    if (!this.textures.exists('items')) this.load.atlas('items', m.atlases.items.image, m.atlases.items.json);
    const gk = this.cfg.goldKey?.texture; // 2.1
    if (gk && !this.textures.exists('pase:dorada')) this.load.image('pase:dorada', gk);
  }

  create() {
    const { map, settings } = this.cfg;
    this.game.events.once(Phaser.Core.Events.POST_RENDER, () => this.cfg.hooks.ready?.()); // the loading screen goes once the pitch is drawn
    this.arena = new Arena(this, map, settings.quality);
    this.arena.build();
    this.fx = new Fx(this, { ...settings }); // a copy: adaptive quality must not change the saved settings
    this.fx.combo.onRank = (r) => this.comboUltCharge(r); // 2.0: bursts charge the ultimate a little
    setLowPower(false); setNatureLowPower(false); this.lowFps = 0; this.synergySeen.clear();
    this.xp = Math.floor(this.xpNext() * this.cfg.perks.startXpFrac); // «Ventaja inicial»
    this.cameras.main.setBounds(0, 0, this.arena.widthPx, this.arena.heightPx).setZoom(this.zoomFor()).setBackgroundColor(map.ambience);
    // removed on shutdown: a listener left behind would touch a dead camera after the run ends
    const onResize = () => this.cameras.main?.setZoom(this.zoomFor());
    this.scale.on('resize', onResize);
    this.events.once('shutdown', () => this.scale.off('resize', onResize));
    let sp = this.arena.spawnPoint();
    if (this.cfg.coop?.role === 'guest') sp = this.arena.randomCellAround(sp.x, sp.y, 30, 60, this.rng) ?? sp; // pre-2.0: next to the host, not on top of him
    this.cfg.team.slice(0, MAX_TEAM).forEach((p, i) => this.addMember(p, sp.x + (i ? (i % 2 ? -1 : 1) * 18 * Math.ceil(i / 2) : 0), sp.y + (i ? 14 : 0)));
    if (this.cfg.training) this.applyTraining(this.cfg.training);
    // soft follow with a small dead zone: the captain can move a little without dragging the view along
    this.cameras.main.startFollow(this.members[0].f.container, true, 0.09, 0.09).setDeadzone(18, 14);
    this.arena.updateFlow(sp.x, sp.y);
    const kb = this.input.keyboard!;
    // Fix 1.23: no capture for letters and numbers (movement reads heldKeys): Phaser keeps captures after the run ends,
    // so W, A, S, D, P and 1-3 stopped reaching every text box of the menus (the search box couldn't type an «a»).
    // Only the arrows are captured, so they never scroll the page, and only while the run lasts.
    kb.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT,ESC,P,ONE,TWO,THREE', false);
    kb.addCapture('UP,DOWN,LEFT,RIGHT');
    this.events.once('shutdown', () => this.input.keyboard?.removeCapture('UP,DOWN,LEFT,RIGHT'));
    kb.on('keydown-ESC', () => this.requestPause());
    kb.on('keydown-P', () => this.requestPause());
    // a key still held after choosing a card repeats: only a fresh press changes the formation
    const fresh = (id: FormationId) => (ev: KeyboardEvent) => { if (!ev.repeat) this.setFormation(id); };
    kb.on('keydown-ONE', fresh('ofensiva'));
    kb.on('keydown-TWO', fresh('equilibrada'));
    kb.on('keydown-THREE', fresh('defensiva'));
    kb.on('keydown-E', () => this.acceptAltar());
    kb.on('keydown-R', () => this.requestUlt()); // 2.0: the warrior spirits' ultimates
    this.events.on('resume', () => { this.input.keyboard?.resetKeys(); });
    // pre-2.0: nothing outside the camera is drawn (cull.ts); the simulation is untouched
    this.events.on('postupdate', () => { this.cullStats = cullOffscreen(this); });
    // 2.02: only solo runs are recorded (in co-op half the world is the partner's)
    if (this.cfg.record && !this.cfg.training && !this.cfg.coop) {
      this.rec = new ReplayRecorder({ v: 1, map: this.cfg.map.id, rank: this.rank.id, kit: this.cfg.record.kit, team: this.cfg.team.map((p) => p.id), version: this.cfg.record.version, at: new Date().toISOString() });
    }
    if (this.cfg.coop) {
      this.coop = new CoopSession(this.coopPort(), this.cfg.coop);
      this.events.once('shutdown', () => { this.coop?.destroy(); this.coop = null; });
    }
  }
  /** pre-2.0: last culling pass (QA reads it) */
  cullStats: CullStats = { checked: 0, culled: 0 };

  /**
   * Zoom from how much pitch should be visible, not from a fixed factor, so a phone and a monitor frame the same
   * play area. Height is what matters most for reading threats; wide screens simply see more to the sides.
   */
  private zoomFor() {
    const visibleH = { cerca: 230, normal: 290, lejos: 370 }[this.cfg.settings.camera ?? 'normal'];
    const z = Math.min(this.scale.height / visibleH, this.scale.width / (visibleH * 1.25));
    return Math.max(1.5, Math.min(5, Math.round(z * 8) / 8));
  }

  // ------------------------------------------------------------- team
  private addMember(entry: RosterEntry, x: number, y: number) {
    const body = this.cfg.manifest.bodies[entry.body] ?? this.cfg.manifest.bodies.field!;
    const kit = this.cfg.kit;
    const keeper = entry.body === 'gk' && !!kit?.gk;
    const kitTexture = kit ? (keeper ? kit.gk! : kit.field) : null;
    const baseKey = kitTexture ? `kit:${kitTexture}` : bodyKey(entry.body);
    const fromSkin = kit ? (keeper ? kit.gkSkin : kit.fieldSkin) : body.skin;
    const f = new Footballer(this, entry, body, x, y, skinnedTexture(this, baseKey, body, fromSkin, entry.skin));
    const sb = { ...starBonus(this.cfg.stars[String(entry.id)] ?? 0) };
    const asc = this.cfg.asc?.[String(entry.id)];
    if (asc) { sb.damage *= asc.damage; sb.hp *= asc.hp; }
    // v1.5: a carrier gets one more slot, the Aura slot, holding his first inherited technique from the start; the second
    // one can be learned into a free normal slot with a level-up card (it never replaces one of his own)
    const auraFirst = entry.techniques.findIndex((t) => t.aura !== undefined);
    const state = newMemberState(entry, this.cfg.perks.techSlots + (auraFirst >= 0 ? 1 : 0), this.cfg.loadout?.[String(entry.id)]);
    if (auraFirst >= 0 && !state.slots.includes(auraFirst)) { state.slots[state.slots.length - 1] = auraFirst; state.levels[auraFirst] = 1; }
    const first = entry.techniques[state.slots[0]!];
    const perSlot = <T>(f: (k: number) => T) => [0, 1, 2, 3, 4].map(f);
    const m: Member = {
      f, entry, state, damageMult: sb.damage * this.cfg.perks.damageMult,
      cds: perSlot((k) => 700 + this.members.length * 230 + k * 600), maxCd: perSlot(() => 1),
      styles: perSlot((k) => fxStyle(entry.techniques[state.slots[k] ?? -1] ?? first)), trajs: perSlot((k) => trajectory(entry.techniques[state.slots[k] ?? -1] ?? first)),
      recipes: perSlot((k) => recipeFor(entry.techniques[state.slots[k] ?? -1] ?? first, this.fxRarity(entry))),
      slot: this.members.length - 1, windup: null, ult: null, dash: null, vx: 0, vy: 0, settled: false, slotDist: 0, guardUntil: 0, guardLock: 0, hpAdd: 0,
    };
    // 2.0 (author): one active spirit, the leftmost on the team (the first to join); the others keep only their passive.
    // Its ultimate rests in slot ULT, beyond the five normal ones, at the spirit's level (never chosen or levelled in a run)
    if (entry.keshin && !this.members.some((o) => o.ult)) {
      const ut = ultTech(entry.keshin);
      if (ut) {
        m.ult = { tech: ut, lv: ultTechLevel(entry.keshin.level) };
        m.cds[ULT] = this.ultCdMs() * ULT_FIRST_SHARE; m.maxCd[ULT] = this.ultCdMs();
        m.styles[ULT] = fxStyle(ut); m.trajs[ULT] = trajectory(ut); m.recipes[ULT] = recipeFor(ut, this.fxRarity(entry));
      }
    }
    this.members.push(m);
    const add = Math.round((this.members.length === 1 ? 160 : 25) * sb.hp * this.cfg.perks.hpMult * statHealth(entry)); // Fix 1.13: teammates add 25 (was 40)
    m.hpAdd = add;
    if (this.members.length === 1) this.maxHp = this.hp = add;
    else { this.maxHp += add; this.hp = Math.min(this.maxHp, this.hp + add); }
    if (this.members.length > 1) this.fx.burst(m.styles[0], x, y - 10, 12, 50);
    if (entry.aura) { // v1.5: the Aura shows itself for a moment when its carrier comes in
      this.fx.ring(x, y - 10, 34, 0x7ff6ff, 700, 3);
      this.fx.label(x, y - 40, `Aura: ${entry.aura.name}`, '#7ff6ff');
    }
    if (asc?.hero) { // HÉROE: golden entrance and a lasting aura
      this.fx.rays(x, y - 12, 12, 46, 0xffe27a, 600);
      this.fx.ring(x, y - 10, 30, 0xffd84a, 500, 3);
    }
  }

  /** v1.6: the training field sets every footballer's techniques and levels and the combined techniques by hand */
  private applyTraining(t: TrainingSetup) {
    for (const m of this.members) {
      const c = t.members.find((x) => x.id === m.entry.id);
      if (!c) continue;
      const slots = c.slots.filter((i) => m.entry.techniques[i] && m.entry.techniques[i].type !== 'talento').slice(0, 5);
      if (!slots.length) continue;
      m.state = { playerId: m.entry.id, slots, levels: Object.fromEntries(slots.map((i) => [i, Math.max(1, Math.min(MAX_TECH_LEVEL, c.levels[i] ?? 1))])) };
      slots.forEach((idx, k) => {
        const tech = m.entry.techniques[idx];
        m.styles[k] = fxStyle(tech); m.trajs[k] = trajectory(tech); m.recipes[k] = recipeFor(tech, this.fxRarity(m.entry));
        m.cds[k] = 600 + k * 500 + m.slot * 250;
      });
    }
    for (const [id, level] of Object.entries(t.combos)) if (COMBOS.some((c) => c.id === id)) this.combos.set(id, { level: Math.max(1, Math.min(COMBO_MAX_LEVEL, level)), cd: 1500 });
    // nothing that ends or interrupts the session: no hazards, altars or surrounding waves
    this.nextHazardAt = Infinity; this.nextAltarAt = Infinity; this.nextSurround = Infinity;
  }

  /** v1.6: training keeps a steady crowd of ordinary rivals to aim at (no minibosses, boss or waves) */
  private trainingSpawn(dt: number) {
    const { map } = this.cfg, units = this.units();
    this.spawnAcc += dt / 1000;
    if (this.spawnAcc < 0.25 || !map.enemies.length) return;
    this.spawnAcc = 0;
    const alive = this.enemies.filter((e) => !e.dead).length;
    for (let i = alive; i < TRAINING_RIVALS && i < alive + 4; i++) {
      const u = units.get(map.enemies[this.rng.between(0, map.enemies.length - 1)]);
      if (u) this.spawnEnemy(u, u.kind === 'creature' ? 'creature' : 'enemy');
    }
  }

  /** Rarity used for effect quality: a HÉROE gets the top tier. */
  private fxRarity(entry: RosterEntry) { return this.cfg.asc?.[String(entry.id)]?.hero ? 'leyenda' as const : entry.rarity; }

  /** «Espíritu de héroe» (InaZurvivors passive): +10% team damage per HÉROE on the pitch. */
  private heroAura() { return 1 + HERO_AURA.teamDamage * Math.min(CAPS.heroes, this.members.filter((m) => this.cfg.asc?.[String(m.entry.id)]?.hero).length); }

  private setFormation(id: FormationId) {
    if (this.ended || this.formation === id) return;
    this.formation = id;
    this.formationChangedAt = this.runTime;
    this.rec?.event(this.runTime, { k: 'formation', f: id });
    sfx('whoosh');
    // ghost markers on the new slots
    const cap = this.members[0].f;
    slotPositions(id, cap.x, cap.y, this.heading).slice(0, this.members.length - 1).forEach((p) => {
      const c = this.add.circle(p.x, p.y, 7, 0xffffff, 0.15).setStrokeStyle(1, 0xffe24a).setDepth(50);
      this.tweens.add({ targets: c, alpha: 0, scale: 1.6, duration: 900, onComplete: () => c.destroy() });
    });
  }

  private formationDamage() { return FORMATIONS[this.formation].damageMult * this.formationTactic().damage * (this.buffOn('apuesta') ? 1.35 : 1) * (this.cfg.coach?.formation?.id === this.formation ? 1 + this.cfg.coach.formation.damage : 1); }
  /** «Pizarra avanzada» strengthens what the active formation is about */
  private formationTactic() {
    const lv = this.cfg.perks.tactic;
    return { damage: this.formation === 'ofensiva' ? 1 + 0.01 * lv : 1, taken: this.formation === 'defensiva' ? 1 - 0.01 * lv : 1,
      combo: this.formation === 'equilibrada' ? 1 + 0.02 * lv : 1 };
  }
  /** effective pickup radius (px): permanent upgrade and cards add their percentages, capped (balance.ts) */
  pickupRange() { return pickupRadius(this.members.length, [this.cfg.perks.magnetMult - 1, this.mods.pickup - 1]); }

  /** Talents of everyone on the pitch plus the adapted passives (talents.ts), refreshed twice a second. */
  private talents(): TalentFx {
    if (this.fxAt > this.runTime - 0.5 && this.fxAt <= this.runTime && this.fxCache) return this.fxCache;
    const f = emptyFx();
    // (author) the footballers on the pitch and their Auras count, each by their own gender
    const people = this.members.flatMap((m) => [m.entry.gender, m.entry.aura ? this.cfg.manifest.roster.find((p) => p.id === m.entry.aura!.id)?.gender : undefined]);
    const genders = { male: people.filter((g) => g === 'M').length, female: people.filter((g) => g === 'F').length };
    for (const m of this.members) {
      // Fix 1.13: a talent works without taking an active slot (it used to need one, so most did nothing); in a slot it
      // also grows with the technique level of the run
      const slotted = new Set<number>();
      for (let i = 0; i < m.state.slots.length; i++) {
        const t = this.activeTech(m, i);
        if (t?.type === 'talento') { TALENTS[t.id]?.apply(f, talentScale(this.techLevel(m, i))); slotted.add(t.id); }
      }
      for (const t of m.entry.techniques) if (t.type === 'talento' && !slotted.has(t.id)) TALENTS[t.id]?.apply(f, talentScale(1));
      adaptedPassive(m.entry)?.apply(f);
      applyKeshin(f, m.entry.keshin, genders); // 2.0: the warrior spirit's passive, for the whole team (some count boys or girls)
    }
    this.fxCache = f; this.fxAt = this.runTime;
    return f;
  }

  private teamDamageBonus() { return Math.max(0.5, 1 + this.talents().team); }

  private shield() {
    let s = 0;
    for (const m of this.members) {
      // 1.76: a Leyenda keeper adds up the shields of all his saves (any other keeper counts only his best one)
      const legend = m.entry.rarity === 'leyenda';
      let own = 0;
      for (let i = 0; i < m.state.slots.length; i++) {
        const t = this.activeTech(m, i);
        if (t?.type !== 'parada') continue;
        const v = techStats(t, this.techLevel(m, i)).shield * (1 + this.talents().keeper);
        own = legend ? own + v : Math.max(own, v);
      }
      s = Math.max(s, Math.min(0.6, own));
    }
    return s + this.talents().shield;
  }

  /** Active techniques of an element across the squad. */
  private elementCount(element: string | null) {
    if (!element) return 0;
    let n = 0;
    for (const m of this.members) for (let i = 0; i < m.state.slots.length; i++) if (this.activeTech(m, i)?.element === element) n++;
    return n;
  }

  private activeTech(m: Member, slot: number): Technique | null {
    if (slot === ULT) return m.ult?.tech ?? null;
    const idx = m.state.slots[slot];
    return idx === null || idx === undefined ? null : m.entry.techniques[idx] ?? null;
  }

  private techLevel(m: Member, slot: number) { return slot === ULT ? m.ult?.lv ?? 1 : m.state.levels[m.state.slots[slot] ?? -1] ?? 1; }

  /** BUG-D48C193C: the «Daño»/«Recarga» power-up text with the upgrades bought (Potenciador/Turbo), not the base +50%/-40% */
  private boostLabel(id: string): string | undefined {
    if (id === 'dano') return `Daño +${Math.round((this.cfg.perks.damageBuff ?? 0.5) * 100)}%`;
    if (id === 'recarga') return `Recarga -${Math.round((this.cfg.perks.cooldownBuff ?? 0.4) * 100)}%`;
    return undefined;
  }

  private buffOn(id: BuffId) { return (this.buffs.get(id)?.until ?? 0) > this.runTime; }

  private stats(m: Member, i: number): TechStats {
    const t = this.activeTech(m, i)!;
    const boost = (1 + 0.05 * (this.cfg.shop?.techBoosts[String(t.id)] ?? 0)) * masteryDamage(this.cfg.mastery?.[String(t.id)] ?? 0)
      * (1 + resonanceBonus(this.elementCount(t.element)));
    const captainElement = this.members[0].entry.element;
    const allies = this.members.filter((o) => o !== this.members[0] && o.entry.element === captainElement).length;
    // the build as a whole has a soft limit; the formation and timed buffs stay outside it, they are decisions of the moment
    const fx = this.talents();
    const talent = 1 + (fx.type[t.type] ?? 0) + (fx.element[String(t.element)] ?? 0) + (this.hp < this.maxHp * 0.3 ? Math.min(CAP_LAST_STAND, fx.lastStand) : 0);
    // v1.5: affinity with the Aura's element (one multiplier, the carrier keeps his own element for every other rule)
    const affinity = (m.entry.aura && t.element && t.element === m.entry.aura.element ? 1 + AURA_ELEMENT_BONUS : 1) * (t.aura !== undefined ? AURA_TECH_DAMAGE : 1)
      * (this.cfg.coach?.element && String(t.element) === this.cfg.coach.element.element ? 1 + this.cfg.coach.element.damage : 1); // pre-2.0: the coach's affinity
    const build = softCap(m.damageMult * boost * talent * affinity * this.mods.damage * (1 + this.cfg.perks.synergy * allies) * this.teamDamageBonus() * this.heroAura()
      * chemistry(this.cfg.kitTeam ?? '', this.members.map((x) => x.entry)));
    const s = techStats(t, this.techLevel(m, i), build * statDamage(m.entry, t.type) * (this.buffOn('dano') ? 1 + (this.cfg.perks.damageBuff ?? 0.5) : 1) * this.formationDamage() * (t.type === 'parada' ? 1 + fx.keeper : 1));
    if (t.type === 'parada' && fx.keeper) { s.heal *= 1 + fx.keeper; s.shield = Math.min(0.6, s.shield * (1 + fx.keeper)); } // Portero+
    if (t.type === 'parada' && m.entry.rarity === 'leyenda') { s.damage = Math.round(s.damage * LEGEND_SAVE_DAMAGE); s.heal *= LEGEND_SAVE_HEAL; } // 1.76
    s.cooldownMs = Math.round(s.cooldownMs * capCooldown(this.mods.cooldown * this.cfg.perks.cooldownMult * (1 - fx.cooldown) * statCooldown(m.entry)) * (this.buffOn('recarga') ? 1 - (this.cfg.perks.cooldownBuff ?? 0.4) : 1) * FORMATIONS[this.formation].cooldownMult);
    s.radius = Math.round(s.radius * capArea(this.mods.area * this.cfg.perks.areaMult * (this.buffOn('amplio') ? 1.2 : 1)));
    // 2.0 (author: «son ultis, han de ser más poderosas en lo que abarcan»): the warrior spirit's ultimate, twice the area and
    // the damage, two more projectiles, through everything
    if (i === ULT) { s.radius *= 2; s.damage *= 2; s.count += 2; s.pierce = 99; s.knockback *= 1.6; }
    return s;
  }

  // ------------------------------------------------------------- loop
  update(_t: number, dtRaw: number) {
    if (this.ended) return;
    const nowMs = performance.now();
    if (nowMs < this.cineUntil) return; // everyone holds still; tweens and timers (the scene itself) keep running
    // Fix 1.12: hitstop, a few frames almost frozen on the heaviest impacts (never in reduced motion)
    const dt = Math.min(dtRaw, 50) * (nowMs < this.hitstopUntil ? 0.08 : nowMs < this.slowmoUntil ? 0.2 : 1);
    this.runTime += dt / 1000;
    if (this.cfg.training) { this.hp = this.maxHp; this.invulnUntil = this.runTime + 1; } // v1.6: nobody gets hurt in training
    if (!this.down) { // pre-2.0: a downed captain and his team stand still until the partner lifts them
      this.moveTeam(dt);
      this.runTechniques(dt);
      this.runCombos(dt);
    }
    this.updateProjectiles(dt);
    if (this.coop?.role !== 'guest') this.spawn(dt); // the guest's rivals are the host's
    this.flowAcc += dt;
    if (this.flowAcc > 250) {
      this.flowAcc = 0;
      this.arena.updateFlow(this.members[0].f.x, this.members[0].f.y);
    }
    if (this.coop?.role === 'guest') this.updateMirrors(dt); else this.updateEnemies(dt);
    this.updateShots(dt);
    this.updateHazards(dt);
    this.updateShocks(dt);
    this.updatePressure();
    this.updatePickups(dt);
    this.updateAltar(dt); // pre-2.0: in co-op each player has his own altars (their rewards are only his)
    this.coop?.tick(dt);
    this.rec?.tick(dt, this.runTime, this.members.map((m) => ({ id: m.entry.id, x: m.f.x, y: m.f.y, dir: m.f.dir })), this.hp, this.maxHp, this.enemies);
    if (this.runTime >= this.nextSweep) { this.nextSweep = this.runTime + 1; this.sweepGround(); this.adaptQuality(); this.announceSynergies(); }
    const pad = firstPad(); // Fix 1.12: A / Cross accepts the event, as E does
    const padA = !!pad?.buttons[0]?.pressed;
    if (padA && !this.padAWas) this.acceptAltar();
    this.padAWas = padA;
    this.updateEndless();
    const still = Math.hypot(this.capVx, this.capVy) < 5; // Pereza heals only standing still
    const regen = capRegen(this.mods.regen + this.cfg.perks.regen + this.talents().regen + (still ? this.talents().idleRegen : 0));
    if (this.talents().revive && !this.reviveUsed && this.hp > 0 && this.hp < this.maxHp * 0.2) {
      this.reviveUsed = true;
      this.healBy(this.maxHp * this.talents().revive); // more with the talent's level (talents.ts)
      this.fx.ring(this.members[0].f.x, this.members[0].f.y - 10, 60, 0x5ee05a, 500, 3);
      this.banner('¡Resurgir!', '#8fffa0');
      sfx('evolve');
    }
    if (regen && !this.down) { // 2.0: the regeneration is shown too, gathered into one number a second
      const before = this.hp;
      this.hp = Math.min(this.maxHp, this.hp + this.maxHp * regen * dt / 1000);
      this.regenShown += this.hp - before;
      if (this.runTime - this.regenAt >= 1.2 && this.regenShown >= 1) { this.regenAt = this.runTime; const c = this.members[0].f; this.fx.healFx(c.x, c.y - 10, this.regenShown); this.healAt = this.runTime; this.regenShown = 0; }
    }
    this.fadeAcc += dt;
    if (this.fadeAcc > 150) {
      this.fadeAcc = 0;
      this.arena.fadePropsNear(this.members.map((m) => ({ x: m.f.x, y: m.f.y })));
    }
    this.drawUltRing();
    this.markerAcc += dt;
    if (this.markerAcc > 120) { this.markerAcc = 0; this.pushMarkers(); }
    this.hudAcc += dt;
    if (this.hudAcc > 100) {
      this.hudAcc = 0;
      this.pushHud();
    }
    if (this.hp <= 0 && this.cfg.perks.secondWind && !this.secondWindUsed) {
      this.secondWindUsed = true;
      this.hp = Math.round(this.maxHp * 0.3);
      this.invulnUntil = this.runTime + 2;
      const c = this.members[0].f;
      this.fx.pillar(c.x, c.y + 4, 0x8fe8ff, 10);
      this.fx.ring(c.x, c.y - 10, 90, 0x8fe8ff, 600, 4);
      for (const e of this.enemies) { const [nx, ny] = norm(e.pos.x - c.x, e.pos.y - c.y); e.knockX += nx * 260; e.knockY += ny * 260; }
      this.banner('¡SEGUNDO ALIENTO!', '#8fe8ff');
      sfx('evolve');
    }
    // Revivir (in-run item): one charge, one comeback, a short safety window
    if (this.hp <= 0 && this.reviveCharges > 0) {
      this.reviveCharges--;
      this.hp = Math.round(this.maxHp * 0.4);
      this.invulnUntil = this.runTime + 2.5;
      const c = this.members[0].f;
      this.fx.pillar(c.x, c.y + 4, 0xffe27a, 10);
      for (const e of this.enemies) { const [nx, ny] = norm(e.pos.x - c.x, e.pos.y - c.y); e.knockX += nx * 220; e.knockY += ny * 220; }
      this.banner(`¡REVIVIDO! · quedan ${this.reviveCharges}`, '#ffe27a');
      sfx('evolve');
    }
    if (this.hp <= 0) { if (this.coop) this.coopDown(); else this.finish(false); }
    if (this.coop?.role === 'host' && !this.ended && this.coop.bothDown()) { this.coop.end(false); this.finish(false); }
  }

  /** pre-2.0: out of health in co-op: the captain is down until the partner lifts him (both down = the run is lost) */
  private coopDown() {
    this.hp = 0;
    if (this.down) return;
    this.down = true;
    const c = this.members[0].f;
    c.idle(); this.capVx = this.capVy = 0;
    for (const m of this.members) m.f.container.setAlpha(0.5); // the whole team fades while the captain is down
    this.fx.ring(c.x, c.y - 6, 28, 0xff5a5a, 700, 3);
    this.banner(this.coop?.connected ? `¡Has caído! ${this.coop.partnerName} puede levantarte` : '¡Has caído!', '#ff8a8a');
    sfx('hurt');
    if (this.coop && !this.coop.connected) this.finish(false);
  }

  private moveTeam(dt: number) {
    const scheme = this.cfg.settings.moveKeys;
    const letters = scheme !== 'flechas', arrows = scheme !== 'wasd';
    // what the hand holds right now, also through a pause (heldKeys in controls.ts)
    const held = (a: string, b: string) => ((letters && heldKeys.has(a)) || (arrows && heldKeys.has(b)) ? 1 : 0);
    let dx = held('d', 'arrowright') - held('a', 'arrowleft');
    let dy = held('s', 'arrowdown') - held('w', 'arrowup');
    const [ax, ay] = analogMove();
    if (!dx && !dy) { dx = ax; dy = ay; } // analog keeps its partial speed, keys are always full
    const len = Math.max(1, Math.hypot(dx, dy));
    dx /= len; dy /= len;
    this.padButtons();
    const cap = this.members[0];
    const speed = (92 + (cap.entry.stats?.speed ?? 0) * 0.15) * capSpeed(this.mods.speed * this.cfg.perks.speedMult * (1 + this.talents().speed)) * (this.buffOn('velocidad') ? 1.3 : 1);
    const c = cap.f.container;
    // ~70 ms to reach full speed or stop: snappy, but no robotic start/stop; reversing is just as quick
    const resp = Math.min(1, dt / 70);
    this.capVx += (dx * speed - this.capVx) * resp;
    this.capVy += (dy * speed - this.capVy) * resp;
    if (!dx && !dy && Math.hypot(this.capVx, this.capVy) < 4) this.capVx = this.capVy = 0;
    this.arena.move(c, this.capVx * dt / 1000, this.capVy * dt / 1000);
    if (dx || dy) cap.f.setVelocity(dx, dy);
    else cap.f.idle();
    cap.f.pace = Math.max(0.6, Math.min(1.8, Math.hypot(this.capVx, this.capVy) / 100));
    // look ahead where the captain runs, eased so a direction change never snaps the view
    const cam = this.cameras.main, ahead = 34 / Math.max(1, cam.zoom / 2);
    const ease = Math.min(1, dt / 450);
    cam.setFollowOffset(cam.followOffset.x + (-dx * ahead - cam.followOffset.x) * ease, cam.followOffset.y + (-dy * ahead * 0.7 - cam.followOffset.y) * ease);
    cap.f.update(dt);
    if (dx || dy) {
      // smooth heading so formation slots rotate gently
      const target = headingFromVector(dx, dy);
      const diff = Phaser.Math.Angle.Wrap(target - this.heading);
      this.heading += diff * Math.min(1, dt / 220);
    }
    const last = this.trail[0];
    if (!last || Math.hypot(last.x - c.x, last.y - c.y) > 3) {
      this.trail.unshift({ x: c.x, y: c.y });
      if (this.trail.length > 260) this.trail.pop();
    }
    const slots = slotPositions(this.formation, c.x, c.y, this.heading);
    const smooth = Math.min(1, dt / 1000 * 9); // velocity smoothing factor
    this.members.slice(1).forEach((m) => {
      const fc = m.f.container;
      if (m.dash) {
        this.updateDash(m, dt);
        m.f.update(dt);
        m.vx = m.vy = 0;
        return;
      }
      // followers ignore solid props: only the outer limit of the arena applies to them
      const target = this.arena.clampToBounds(slots[m.slot % slots.length].x, slots[m.slot % slots.length].y);
      const dx = target.x - fc.x, dy = target.y - fc.y;
      const dist = Math.hypot(dx, dy);
      m.slotDist = dist;
      // dead zone with hysteresis: stop inside 3px, only start again past 9px, so nobody hunts around the slot
      if (m.settled ? dist > 9 : dist < 3) m.settled = !m.settled;
      // arrival steering; far-behind followers sprint back instead of teleporting
      const maxSpeed = speed * 1.9 * (1 + Math.max(0, dist - 120) / 90);
      const want = m.settled ? 0 : Math.min(maxSpeed, dist * 5);
      let tvx = dist > 0 ? (dx / dist) * want : 0, tvy = dist > 0 ? (dy / dist) * want : 0;
      // soft separation from teammates (only when really close)
      for (const o of this.members) {
        if (o === m) continue;
        const ox = fc.x - o.f.x, oy = fc.y - o.f.y, d = Math.hypot(ox, oy);
        if (d > 0 && d < 16) { tvx += (ox / d) * (16 - d) * 6; tvy += (oy / d) * (16 - d) * 6; }
      }
      m.vx += (tvx - m.vx) * smooth;
      m.vy += (tvy - m.vy) * smooth;
      const next = this.arena.clampToBounds(fc.x + m.vx * dt / 1000, fc.y + m.vy * dt / 1000);
      fc.x = next.x; fc.y = next.y;
      const sp = Math.hypot(m.vx, m.vy);
      // direction hysteresis: only turn while really moving; idle followers look where the captain looks
      if (sp > 22) m.f.setVelocity(m.vx, m.vy);
      else m.f.idle(cap.f.dir);
      m.f.pace = Math.max(0.6, Math.min(2, sp / 100));
      m.f.update(dt);
    });
  }

  /** Shoulder buttons cycle formations during play; Y / Triangle fires an ultimate (2.0). */
  private padButtons() {
    const p = firstPad();
    if (!p) return;
    for (const [i, step] of [[4, 2], [5, 1]] as const) {
      const down = !!p.buttons[i]?.pressed;
      if (down && !this.padHeld[i]) this.setFormation(FORMATION_ORDER[(FORMATION_ORDER.indexOf(this.formation) + step) % 3]);
      this.padHeld[i] = down;
    }
    const y = !!p.buttons[3]?.pressed; // 2.0: Y / Triangle fires an ultimate, as R does
    if (y && !this.padHeld[3]) this.requestUlt();
    this.padHeld[3] = y;
  }

  private nearestEnemy(x: number, y: number, range: number): Enemy | null {
    let best: Enemy | null = null;
    let bd = range * range;
    for (const e of this.enemies) {
      if (e.dead) continue; // 1.91: a rival knocked out this frame still flies off; never aim at it
      const d = (e.pos.x - x) ** 2 + (e.pos.y - 12 - y) ** 2;
      if (d < bd) { bd = d; best = e; }
    }
    return best;
  }

  // ------------------------------------------------------------- techniques
  private runTechniques(dt: number) {
    for (const m of this.members) {
      const ox = m.f.x, oy = m.f.y - 10;
      if (m.ult && m.cds[ULT] > 0) m.cds[ULT] -= dt;
      if (m.windup) {
        if (this.runTime >= m.windup.until) {
          const i = m.windup.i;
          m.windup = null;
          this.fireShot(m, i, ox, oy);
        }
        continue;
      }
      m.state.slots.forEach((_, i) => this.castSlot(m, i, dt, ox, oy));
    }
    if (this.ultWanted !== false && this.castUlt()) this.ultWanted = false;
  }

  /** 2.0 (author: «las ultis con la R»): R or the HUD button asks for an ultimate; it fires on the next frame of play */
  private ultWanted: number | boolean = false;
  /** 2.0 (author: «más visible lo de la ulti»): on the pitch, a ring under the active spirit's holder fills in its colour
   *  as the ultimate charges; ready, it glows and pulses and the key to fire it floats over his head */
  private ultG: Phaser.GameObjects.Graphics | null = null;
  private ultKey: Phaser.GameObjects.Text | null = null;
  private ultReadyAt = 0;
  private drawUltRing() {
    const m = this.members.find((x) => x.ult), k = m?.entry.keshin && KESHIN_BY_ID.get(m.entry.keshin.id);
    if (!m || !k) { this.ultG?.setVisible(false); this.ultKey?.setVisible(false); return; }
    if (!this.ultG?.active) this.ultG = this.add.graphics();
    if (!this.ultKey?.active) this.ultKey = this.add.text(0, 0, 'R', { fontFamily: '"Press Start 2P"', fontSize: '9px', color: '#04061a', backgroundColor: '#ffffff', padding: { x: 4, y: 3 } }).setOrigin(0.5, 1);
    const col = Phaser.Display.Color.HexStringToColor(k.color).color, g = this.ultG, x = m.f.x, y = m.f.y + 1, t = this.time.now / 1000;
    const fill = Math.max(0, Math.min(1, 1 - m.cds[ULT] / Math.max(1, m.maxCd[ULT]))), ready = m.cds[ULT] <= 0;
    if (ready && !this.ultReadyAt) this.ultReadyAt = this.time.now; else if (!ready) this.ultReadyAt = 0;
    const fresh = ready && this.time.now - this.ultReadyAt < 3300; // (author) it signals three times, then stays quiet
    g.clear().setVisible(true).setDepth(y - 2);
    const rx = 15, ry = 6;
    g.lineStyle(3, 0x04061a, 0.55).strokeEllipse(x, y, rx * 2, ry * 2);
    if (ready) {
      const p = fresh ? 1 + Math.sin(t * 5.7) * 0.12 : 1;
      g.fillStyle(col, 0.22 + Math.sin(t * 8) * 0.08).fillEllipse(x, y, rx * 2.4 * p, ry * 2.4 * p);
      g.lineStyle(2.5, col, 1).strokeEllipse(x, y, rx * 2 * p, ry * 2 * p);
      g.lineStyle(1.5, 0xffffff, 0.9).strokeEllipse(x, y, rx * 2.6 * p, ry * 2.6 * p);
    } else if (fill > 0) {
      g.lineStyle(3, col, 0.95).beginPath();
      for (let a = 0; a <= fill * Math.PI * 2 + 0.001; a += 0.12) {
        const px = x + Math.sin(a) * rx, py = y - Math.cos(a) * ry;
        if (a === 0) g.moveTo(px, py); else g.lineTo(px, py);
      }
      g.strokePath();
    }
    const pad = !!firstPad(), touch = typeof document !== 'undefined' && document.body.classList.contains('touch');
    const key = pad ? 'Y' : 'R';
    this.ultKey.setVisible(fresh && !touch && Math.sin(t * 5.7) > -0.3).setText(key).setPosition(x, m.f.y - 40 + Math.sin(t * 6) * 2).setDepth(9500).setScale(1 + Math.max(0, Math.sin(t * 8)) * 0.15);
  }

  /** 2.0 (author: a small use for the combos, «no muy rota»): each burst rank past ¡COMBO! takes 4 % per rank step off the
   *  active ultimate's charge (¡GENIAL! 4 %, ¡BRUTAL! 8 %, ¡IMPARABLE! 12 %, ¡INAZUMA! 16 %: 40 % at most in one burst) */
  private comboUltCharge(rank: number) {
    const m = this.members.find((x) => x.ult);
    if (!m || m.cds[ULT] <= 0) return null;
    const pct = 0.04 * rank;
    m.cds[ULT] = Math.max(0, m.cds[ULT] - m.maxCd[ULT] * pct);
    const k = m.entry.keshin && KESHIN_BY_ID.get(m.entry.keshin.id);
    return { text: `+${Math.round(pct * 100)}% DEFINITIVA`, color: k?.color ?? '#7fd3ff' };
  }
  /** ms between two ultimates: 30 s, down to 15 s with the «Espíritu despierto» upgrade */
  private ultCdMs() { return (this.cfg.perks.ultCooldownSec ?? 30) * 1000; }
  /** `playerId`: that footballer's ultimate (a tap on its HUD button); none: the first ready one */
  requestUlt(playerId?: number) { if (!this.ended) this.ultWanted = playerId ?? true; }
  /** the active spirit's ultimate; with no rival in reach it stays ready. False while its holder is winding up another
   *  shot: the request waits for it (it is never lost) */
  private castUlt(): boolean {
    const only = typeof this.ultWanted === 'number' ? this.ultWanted : null;
    for (const m of this.members) {
      if (!m.ult || m.cds[ULT] > 0 || (only !== null && m.entry.id !== only)) continue;
      if (m.windup) return false;
      m.cds[ULT] = 0;
      this.castSlot(m, ULT, 0, m.f.x, m.f.y - 10);
      const fired = m.cds[ULT] > 200 || (m.windup as Member['windup'])?.i === ULT; // a shot winds up first
      m.cds[ULT] = fired ? this.ultCdMs() : 0;
      m.maxCd[ULT] = fired ? m.cds[ULT] : 1;
      // (author: «el banner debería salir antes de la animación, no al final») every ultimate opens with its banner
      const k = m.entry.keshin && KESHIN_BY_ID.get(m.entry.keshin.id);
      if (fired && k) {
        ultBanner(this, m.ult.tech.name, k.name.toUpperCase(), k.id, 1500, '', k.color);
        this.cameras.main.shake(220, 0.008);
        this.rec?.event(this.runTime, { k: 'ult', id: m.entry.id, spirit: k.id });
        const log = this.ultLog.get(k.id) ?? { casts: 0, damage: 0 };
        log.casts++; this.ultLog.set(k.id, log);
        this.ultWin = { spirit: k.id, until: this.runTime + ULT_DMG_WINDOW_SEC };
        this.coop?.ult(m.entry.id, k.id); // co-op: the banner is only the caster's; the partner sees the spirit appear
      }
      if (!fired) this.fx.label(m.f.x, m.f.y - 40, 'Sin rival cerca', '#9fe8ff');
      return true;
    }
    return true;
  }

  /** one technique slot of a member: its cooldown and, when it is ready, its cast (2.0: also the ultimate, slot ULT) */
  private castSlot(m: Member, i: number, dt: number, ox: number, oy: number) {
    const t = this.activeTech(m, i);
    if (!t) return;
    if (t.type === 'talento') {
      m.cds[i] -= dt;
      if (m.cds[i] <= 0) {
        m.cds[i] = 5000;
        m.maxCd[i] = 5000;
        this.fx.burst(m.styles[i], ox, oy, 4 + this.techLevel(m, i), 25, true);
      }
      return;
    }
    m.cds[i] -= dt;
    if (m.cds[i] > 0) return;
    const s = this.stats(m, i);
    const lv = this.techLevel(m, i);
    const style = m.styles[i];
    const [c1, c2] = STYLE_COLORS[style];
    // Fix 1.11: counted only when the technique really fires (not on a retry with no rival in reach)
    const used = () => {
      this.techById[t.id] = (this.techById[t.id] ?? 0) + 1;
      const elementKey = t.element ?? 'neutro';
      this.techUses[elementKey] = (this.techUses[elementKey] ?? 0) + 1;
      if (t.aura !== undefined) this.auraTechUses++;
    };
    if (/colmillo de pantera/i.test(t.name)) {
      // signature move, deliberately strong: lunges at the closest rival and bites everything in a wide area
      const target = this.nearestEnemy(ox, oy, 150 + lv * 6);
      if (!target) { m.cds[i] = 150; return; }
      const bx = target.pos.x, by = target.pos.y - 10;
      const r = 46 + lv * 5;
      const dmg = Math.max(s.damage, (t.power ?? 80) * 0.9) * 3 * (1 + 0.15 * (lv - 1));
      m.f.hop(this, 6, 200);
      this.fx.fangs(bx, by, r, lv);
      sfx('whoosh');
      this.time.delayedCall(230, () => {
        sfx('boom');
        for (const e of this.enemies) {
          const d = Math.hypot(e.pos.x - bx, e.pos.y - 10 - by);
          if (d < r + e.radius) { this.hit(e, dmg, (e.pos.x - bx) / (d || 1) * 90, (e.pos.y - by) / (d || 1) * 90, 'fuego', true); e.slowUntil = this.runTime + 2; }
        }
      });
      if (t.type === 'parada') this.healBy(Math.round(this.maxHp * s.heal));
      used();
      m.cds[i] = Math.max(1600, s.cooldownMs * 0.6);
      m.maxCd[i] = m.cds[i];
      return;
    }
    if (/hacha del azote negro/i.test(t.name)) {
      // (author) the first warrior-spirit technique: Dark Exodus comes down with its axe; the blow blows up the
      // ground in front of the player and a magenta beam runs across the pitch. Long cooldown: it is an ultimate
      const target = this.nearestEnemy(ox, oy, 300 * this.cfg.perks.rangeMult);
      if (!target) { m.cds[i] = 150; return; }
      sfx('whoosh');
      this.cinematic(AXE_MS.total);
      m.f.container.setDepth(CAST_DEPTH); // over the spirit while the game is stopped (the next frame puts it back)
      this.time.delayedCall(AXE_MS.leap, () => { if (this.sys.isActive()) { m.f.hop(this, 26, 460); sfx('whoosh'); } });
      // (author: "que haga mucho daño") an ultimate: the blow, the beam and the burning cut that stays on the ground
      const blow = s.damage * 4, beam = s.damage * 9, burn = s.damage * 0.9;
      blackAxeStrike(this, ox, oy, target.pos.x, target.pos.y - 10, lv, {
        onDrop: (ax, ay) => { // (author) the falling axe already hits round where it lands
          sfx('boom');
          const r = 70 + lv * 5;
          for (const e of this.enemies) {
            const d = Math.hypot(e.pos.x - ax, e.pos.y - 10 - ay);
            if (d < r + e.radius) this.hit(e, s.damage * 2, (e.pos.x - ax) / (d || 1) * 120, (e.pos.y - ay) / (d || 1) * 120, 'sombra', true);
          }
        },
        onImpact: (ix, iy) => {
          sfx('boom');
          const r = 90 + lv * 6;
          for (const e of this.enemies) {
            const d = Math.hypot(e.pos.x - ix, e.pos.y - 10 - iy);
            if (d < r + e.radius) this.hit(e, blow, (e.pos.x - ix) / (d || 1) * 140, (e.pos.y - iy) / (d || 1) * 140, 'sombra', true);
          }
        },
        onBeam: (x0, y0, x1, y1, w) => {
          const dx = x1 - x0, dy = y1 - y0, L2 = dx * dx + dy * dy || 1;
          for (const e of this.enemies) {
            const ex = e.pos.x, ey = e.pos.y - 10, u = Math.max(0, Math.min(1, ((ex - x0) * dx + (ey - y0) * dy) / L2));
            const d = Math.hypot(ex - (x0 + dx * u), ey - (y0 + dy * u));
            if (d < w / 2 + e.radius) this.hit(e, beam, dx / Math.sqrt(L2) * 160, dy / Math.sqrt(L2) * 160, 'sombra', true);
          }
        },
        onScar: (x0, y0, x1, y1, w, ms) => {
          const dx = x1 - x0, dy = y1 - y0, L2 = dx * dx + dy * dy || 1;
          this.time.addEvent({ delay: 250, repeat: Math.floor(ms / 250) - 1, callback: () => {
            for (const e of this.enemies) {
              const ex = e.pos.x, ey = e.pos.y - 10, u = Math.max(0, Math.min(1, ((ex - x0) * dx + (ey - y0) * dy) / L2));
              if (Math.hypot(ex - (x0 + dx * u), ey - (y0 + dy * u)) < w / 2 + e.radius) this.hit(e, burn, 0, 0, 'sombra');
            }
          } });
        },
        at: () => ({ x: m.f.x, y: m.f.y }),
      });
      used();
      m.cds[i] = Math.max(9000, s.cooldownMs * 4);
      m.maxCd[i] = m.cds[i];
      return;
    }
    if (/^movimientos arm[oó]nicos$/i.test(t.name)) {
      // 2.0 (author, from its scene): Magister's shot. He conducts, the ball becomes a sphere of blue light and flies in a
      // spiral; where it lands it bursts and the music notes turn into shots at the rivals round it
      const target = this.nearestEnemy(ox, oy, 320 * this.cfg.perks.rangeMult);
      if (!target) { m.cds[i] = 150; return; }
      sfx('whoosh');
      this.cinematic(HARMONY_MS.total);
      m.f.container.setDepth(CAST_DEPTH);
      this.time.delayedCall(HARMONY_MS.kick - 200, () => { if (this.sys.isActive()) { m.f.hop(this, 14, 360); sfx('kick'); } });
      harmony(this, ox, oy, target.pos.x, target.pos.y - 10, lv, {
        onBurst: (bx, by, r) => {
          sfx('boom');
          for (const e of this.enemies) {
            const d = Math.hypot(e.pos.x - bx, e.pos.y - 10 - by);
            if (d < r + e.radius) this.hit(e, s.damage * 5, (e.pos.x - bx) / (d || 1) * 150, (e.pos.y - by) / (d || 1) * 150, 'bosque', true);
          }
        },
        pick: (bx, by, n) => this.enemies.filter((e) => !e.dead && Math.hypot(e.pos.x - bx, e.pos.y - by) < 320)
          .sort((a, b) => Math.hypot(a.pos.x - bx, a.pos.y - by) - Math.hypot(b.pos.x - bx, b.pos.y - by)).slice(0, n)
          .map((e) => ({ x: e.pos.x, y: e.pos.y - 10, hit: () => { if (!e.dead) this.hit(e, s.damage * 2.5, 0, 0, 'bosque', true); } })),
        at: () => ({ x: m.f.x, y: m.f.y }),
      });
      used();
      m.cds[i] = Math.max(7000, s.cooldownMs * 3);
      m.maxCd[i] = m.cds[i];
      return;
    }
    if (/^descarga de colores$/i.test(t.name)) {
      // 2.1 (author, from its scene): Papelín's save. Cyan reticles lock on the rivals' shots and the nearest rivals, his
      // pencil revolver fires a stream of coloured shots at them, and the burst of colours round the keeper swallows every
      // rival shot in reach; the team is healed like any save
      const reach = 360 * this.cfg.perks.rangeMult;
      const near = this.enemies.filter((e) => !e.dead && Math.hypot(e.pos.x - ox, e.pos.y - oy) < reach)
        .sort((a, b) => Math.hypot(a.pos.x - ox, a.pos.y - oy) - Math.hypot(b.pos.x - ox, b.pos.y - oy));
      const incoming = this.shots.filter((b) => Math.hypot(b.x - ox, b.y - oy) < reach);
      if (!near.length && !incoming.length) { m.cds[i] = 150; return; }
      sfx('whoosh');
      this.cinematic(COLOR_MS.total);
      m.f.container.setDepth(CAST_DEPTH);
      this.time.delayedCall(COLOR_MS.aim - 100, () => { if (this.sys.isActive()) { m.f.hop(this, 10, 300); sfx('kick'); } });
      const swallow = (b: (typeof this.shots)[number]) => {
        const k = this.shots.indexOf(b);
        if (k < 0) return;
        this.shots.splice(k, 1);
        this.tweens.add({ targets: b.img, alpha: 0, scale: 0, duration: 180, onComplete: () => b.img.destroy() });
      };
      colorBurst(this, ox, oy, lv, {
        pick: (n) => {
          const shots = incoming.slice(0, n).map((b) => ({ x: b.x, y: b.y, hit: () => swallow(b) }));
          const foes = near.slice(0, Math.max(0, n - shots.length)).map((e) => ({ x: e.pos.x, y: e.pos.y - 10, hit: () => { if (!e.dead) this.hit(e, s.damage * 2.2, 0, 0, 'bosque', true); } }));
          return [...shots, ...foes];
        },
        onClear: (bx, by, r) => {
          for (const b of this.shots.filter((q) => Math.hypot(q.x - bx, q.y - by) < r)) swallow(b);
          for (const e of this.enemies) {
            const d = Math.hypot(e.pos.x - bx, e.pos.y - 10 - by);
            if (d < r * 0.6 + e.radius && d > 1) this.hit(e, s.damage * 1.5, (e.pos.x - bx) / d * 220, (e.pos.y - by) / d * 220, 'bosque', true);
          }
          this.healBy(Math.round(this.maxHp * s.heal));
        },
      });
      used();
      m.cds[i] = Math.max(9000, s.cooldownMs * 4);
      m.maxCd[i] = m.cds[i];
      return;
    }
    if (/^prisi[oó]n escarlata$/i.test(t.name)) {
      // 2.1 (author, from its scene): Zodíaco's shot. The ball is locked in a red crystal and flies to the thickest crowd;
      // there every rival round it is locked in a crystal of its own (bosses only slowed), and they all shatter at once
      const near = this.enemies.filter((e) => !e.dead && Math.hypot(e.pos.x - ox, e.pos.y - oy) < 340 * this.cfg.perks.rangeMult);
      if (!near.length) { m.cds[i] = 150; return; }
      const { r } = prisonSize(lv);
      const target = near.reduce((best, e) => {
        const n = near.filter((o) => Math.hypot(o.pos.x - e.pos.x, o.pos.y - e.pos.y) < r).length;
        return n > best.n ? { e, n } : best;
      }, { e: near[0], n: 0 }).e;
      sfx('whoosh');
      this.cinematic(PRISON_MS.total);
      m.f.container.setDepth(CAST_DEPTH);
      this.time.delayedCall(PRISON_MS.flash - 150, () => { if (this.sys.isActive()) { m.f.hop(this, 14, 360); sfx('kick'); } });
      scarletPrison(this, ox, oy, target.pos.x, target.pos.y - 10, lv, {
        lock: (bx, by, rr) => {
          sfx('boom');
          return this.enemies.filter((e) => !e.dead && Math.hypot(e.pos.x - bx, e.pos.y - 10 - by) < rr + e.radius).map((e) => {
            if (e.kind !== 'boss') e.webUntil = this.runTime + 2.6;
            e.slowUntil = this.runTime + 3.6;
            return { x: e.pos.x, y: e.pos.y - 10, shatter: () => { if (!e.dead) { this.hit(e, s.damage * 6, 0, 0, 'tierra', true); e.curseUntil = this.runTime + 3; } } };
          });
        },
      });
      used();
      m.cds[i] = Math.max(7000, s.cooldownMs * 3);
      m.maxCd[i] = m.cds[i];
      return;
    }
    if (/^despeje demon[ií]aco$/i.test(t.name)) {
      // 2.1 (author, from its scene): Demogorgo's save. He rises behind the keeper in a green burst, slashes the air and
      // brings his black fist down on the thickest crowd near the goal: every rival shot in reach is punched away, the
      // rivals of the blow fly off stunned, and the team is healed like any save
      const reach = 340 * this.cfg.perks.rangeMult;
      const near = this.enemies.filter((e) => !e.dead && Math.hypot(e.pos.x - ox, e.pos.y - oy) < reach);
      const incoming = this.shots.filter((b) => Math.hypot(b.x - ox, b.y - oy) < reach);
      if (!near.length && !incoming.length) { m.cds[i] = 150; return; }
      const { r } = demonClearSize(lv);
      const target = near.length ? near.reduce((best, e) => {
        const n = near.filter((o) => Math.hypot(o.pos.x - e.pos.x, o.pos.y - e.pos.y) < r).length;
        return n > best.n ? { e, n } : best;
      }, { e: near[0], n: 0 }).e : null;
      const px = target ? target.pos.x : incoming[0].x, py = target ? target.pos.y - 10 : incoming[0].y;
      sfx('whoosh');
      this.cinematic(DEMOGORGO_MS.total);
      m.f.container.setDepth(CAST_DEPTH);
      this.time.delayedCall(DEMOGORGO_MS.rise, () => { if (this.sys.isActive()) m.f.hop(this, 12, 360); });
      demonClear(this, ox, oy, px, py, lv, {
        punch: (bx, by, rr) => {
          sfx('boom');
          const flown: { x: number; y: number }[] = [];
          for (const b of this.shots.filter((q) => Math.hypot(q.x - ox, q.y - oy) < reach || Math.hypot(q.x - bx, q.y - by) < rr)) {
            const k = this.shots.indexOf(b);
            if (k < 0) continue;
            this.shots.splice(k, 1);
            flown.push({ x: b.x, y: b.y });
            this.tweens.add({ targets: b.img, alpha: 0, scale: 0, duration: 160, onComplete: () => b.img.destroy() });
          }
          for (const e of this.enemies) {
            if (e.dead) continue;
            const d = Math.hypot(e.pos.x - bx, e.pos.y - 10 - by);
            if (d > rr + e.radius) continue;
            const k = d > 1 ? d : 1;
            this.hit(e, s.damage * 5, (e.pos.x - bx) / k * 380, (e.pos.y - by) / k * 380, 'bosque', true);
            if (e.kind !== 'boss') e.webUntil = this.runTime + 1.2; // stunned
            flown.push({ x: e.pos.x, y: e.pos.y - 10 });
          }
          this.healBy(Math.round(this.maxHp * s.heal));
          return flown;
        },
      });
      used();
      m.cds[i] = Math.max(9000, s.cooldownMs * 4);
      m.maxCd[i] = m.cds[i];
      return;
    }
    if (/^golpe de atenea$/i.test(t.name)) {
      // 2.1 (author, from its scene): Atenea's shot. She spins down behind the shooter, her serpents send a pink and a cyan
      // orb into the ball, and it leaves as a violet beam that runs through every rival in its line toward the thickest crowd
      const near = this.enemies.filter((e) => !e.dead && Math.hypot(e.pos.x - ox, e.pos.y - oy) < 360 * this.cfg.perks.rangeMult);
      if (!near.length) { m.cds[i] = 150; return; }
      const target = near.reduce((best, e) => {
        const n = near.filter((o) => Math.hypot(o.pos.x - e.pos.x, o.pos.y - e.pos.y) < 90).length;
        return n > best.n ? { e, n } : best;
      }, { e: near[0], n: 0 }).e;
      sfx('whoosh');
      this.cinematic(ATHENA_MS.total);
      m.f.container.setDepth(CAST_DEPTH);
      this.time.delayedCall(ATHENA_MS.shot - 150, () => { if (this.sys.isActive()) { m.f.hop(this, 14, 360); sfx('kick'); } });
      athenaStrike(this, ox, oy, target.pos.x, target.pos.y - 10, lv, {
        beam: (bx, by, ang, len, half) => {
          sfx('boom');
          this.sweepBand(bx, by, ang, bx + Math.cos(ang) * len, by + Math.sin(ang) * len, half, new Set(), s.damage * 5, 260, 'viento');
        },
      });
      used();
      m.cds[i] = Math.max(7000, s.cooldownMs * 3);
      m.maxCd[i] = m.cds[i];
      return;
    }
    if (/^asalto mortal$/i.test(t.name)) {
      // 2.1 (author, from its scene): Evera's shot. He charges his red fist with blue lightning and punches the ball as the
      // shooter kicks it: a sphere of lightning flies to the thickest crowd and bursts there (big blow, knockback, stun),
      // and the lightning jumps to the rivals round it
      const near = this.enemies.filter((e) => !e.dead && Math.hypot(e.pos.x - ox, e.pos.y - oy) < 340 * this.cfg.perks.rangeMult);
      if (!near.length) { m.cds[i] = 150; return; }
      const { r } = smashSize(lv);
      const target = near.reduce((best, e) => {
        const n = near.filter((o) => Math.hypot(o.pos.x - e.pos.x, o.pos.y - e.pos.y) < r).length;
        return n > best.n ? { e, n } : best;
      }, { e: near[0], n: 0 }).e;
      sfx('whoosh');
      this.cinematic(SMASH_MS.total);
      m.f.container.setDepth(CAST_DEPTH);
      this.time.delayedCall(SMASH_MS.punch - 120, () => { if (this.sys.isActive()) { m.f.hop(this, 14, 360); sfx('kick'); } });
      mortalSmash(this, ox, oy, target.pos.x, target.pos.y - 10, lv, {
        burst: (bx, by, rr) => {
          sfx('boom');
          const zaps: { x: number; y: number; zap: () => void }[] = [];
          for (const e of this.enemies) {
            if (e.dead) continue;
            const d = Math.hypot(e.pos.x - bx, e.pos.y - 10 - by);
            if (d < rr * 0.55 + e.radius) {
              const k = d > 1 ? d : 1;
              this.hit(e, s.damage * 5, (e.pos.x - bx) / k * 320, (e.pos.y - by) / k * 320, 'tierra', true);
              if (e.kind !== 'boss') e.webUntil = this.runTime + 1.4; // stunned
            } else if (d < rr * 1.25 + e.radius && zaps.length < 12) {
              zaps.push({ x: e.pos.x, y: e.pos.y - 10, zap: () => { if (!e.dead) { this.hit(e, s.damage * 2.5, 0, 0, 'tierra', true); e.slowUntil = this.runTime + 2; } } });
            }
          }
          return zaps;
        },
      });
      used();
      m.cds[i] = Math.max(7000, s.cooldownMs * 3);
      m.maxCd[i] = m.cds[i];
      return;
    }
    if (/^mano grandiosa$/i.test(t.name)) {
      // 2.0 (author's portrait): Grandius' save. He roars (the roar pushes the rivals away), thrusts his giant hand and the
      // palm slams down on the thickest crowd in reach: everyone under it is crushed and stunned, then a golden wave runs
      // across the pitch swallowing every rival shot; the team is healed like any save
      const near = this.enemies.filter((e) => !e.dead && Math.hypot(e.pos.x - ox, e.pos.y - oy) < 340 * this.cfg.perks.rangeMult);
      if (!near.length) { m.cds[i] = 150; return; }
      const { slam } = greatSize(lv);
      const target = near.reduce((best, e) => { // the crowd: the rival with the most others under the palm
        const n = near.filter((o) => Math.hypot(o.pos.x - e.pos.x, o.pos.y - e.pos.y) < slam).length;
        return n > best.n ? { e, n } : best;
      }, { e: near[0], n: 0 }).e;
      sfx('whoosh');
      this.cinematic(GREAT_MS.total);
      m.f.container.setDepth(CAST_DEPTH);
      this.time.delayedCall(GREAT_MS.thrust - 120, () => { if (this.sys.isActive()) { m.f.hop(this, 10, 300); sfx('kick'); } });
      greatHand(this, ox, oy, target.pos.x, target.pos.y - 10, lv, {
        onRoar: (rx, ry, r) => {
          sfx('boom');
          for (const e of this.enemies) {
            const d = Math.hypot(e.pos.x - rx, e.pos.y - 10 - ry);
            if (d < r + e.radius) this.hit(e, s.damage, (e.pos.x - rx) / (d || 1) * 260, (e.pos.y - ry) / (d || 1) * 260, 'tierra', true);
          }
        },
        onSlam: (bx, by, r) => {
          sfx('boom');
          for (const e of this.enemies) {
            const d = Math.hypot(e.pos.x - bx, e.pos.y - 10 - by);
            if (d < r + e.radius) { this.hit(e, s.damage * 6, 0, 0, 'tierra', true); e.webUntil = this.runTime + 2.2; e.slowUntil = this.runTime + 3.5; }
          }
          this.healBy(Math.round(this.maxHp * s.heal));
        },
        onWave: (bx, by, r) => {
          this.shots = this.shots.filter((b) => {
            if (Math.hypot(b.x - bx, b.y - by) >= r) return true;
            this.tweens.add({ targets: b.img, alpha: 0, scale: 0, duration: 200, onComplete: () => b.img.destroy() });
            return false;
          });
          for (const e of this.enemies) {
            const d = Math.hypot(e.pos.x - bx, e.pos.y - 10 - by);
            if (d < r + e.radius && d > 1) this.hit(e, s.damage * 1.5, (e.pos.x - bx) / d * 200, (e.pos.y - by) / d * 200, 'tierra', true);
          }
        },
      });
      used();
      m.cds[i] = Math.max(9000, s.cooldownMs * 4);
      m.maxCd[i] = m.cds[i];
      return;
    }
    if (/^estocada de lancelot$/i.test(t.name)) {
      // 2.0 (author: Lancelot, the third cell of the spritesheet): the knight lifts his sword while fire runs up the blade,
      // aims and thrusts: a giant flaming blade runs straight across the pitch piercing everything in its line, and the
      // line blows up behind it
      const target = this.nearestEnemy(ox, oy, 360 * this.cfg.perks.rangeMult);
      if (!target) { m.cds[i] = 150; return; }
      sfx('whoosh');
      this.cinematic(THRUST_MS.total);
      m.f.container.setDepth(CAST_DEPTH);
      this.time.delayedCall(THRUST_MS.kick - 60, () => { if (this.sys.isActive()) { m.f.hop(this, 12, 320); sfx('kick'); } });
      lancelotThrust(this, ox, oy, target.pos.x, target.pos.y - 10, lv, {
        onThrust: (x0, y0, x1, y1, w) => {
          sfx('boom');
          const dx = x1 - x0, dy = y1 - y0, L2 = dx * dx + dy * dy, L = Math.sqrt(L2);
          for (const e of this.enemies) {
            const ex = e.pos.x, ey = e.pos.y - 10, u = Math.max(0, Math.min(1, ((ex - x0) * dx + (ey - y0) * dy) / L2));
            if (Math.hypot(ex - (x0 + dx * u), ey - (y0 + dy * u)) < w / 2 + e.radius) this.hit(e, s.damage * 5, dx / L * 180, dy / L * 180, 'fuego', true);
          }
        },
        onBurst: (bx, by, r) => {
          for (const e of this.enemies) {
            const d = Math.hypot(e.pos.x - bx, e.pos.y - 10 - by);
            if (d < r + e.radius) this.hit(e, s.damage * 1.2, (e.pos.x - bx) / (d || 1) * 80, (e.pos.y - by) / (d || 1) * 80, 'fuego', true);
          }
        },
      });
      used();
      m.cds[i] = Math.max(9000, s.cooldownMs * 4);
      m.maxCd[i] = m.cds[i];
      return;
    }
    if (/^lanza de carámbanos$/i.test(t.name)) {
      // 2.0 (author, from its scene): Chione's shot. A blizzard wraps the player, she sweeps her spear and the ball flies off
      // in a lance of ice; where it lands ice spikes burst out and freeze everything round (wider with the spirit's level)
      const target = this.nearestEnemy(ox, oy, 320 * this.cfg.perks.rangeMult);
      if (!target) { m.cds[i] = 150; return; }
      sfx('whoosh');
      this.cinematic(ICE_MS.total);
      m.f.container.setDepth(CAST_DEPTH);
      this.time.delayedCall(ICE_MS.kick - 200, () => { if (this.sys.isActive()) { m.f.hop(this, 14, 360); sfx('kick'); } });
      iceLance(this, ox, oy, target.pos.x, target.pos.y - 10, lv, {
        onLance: (x0, y0, x1, y1, w) => {
          const dx = x1 - x0, dy = y1 - y0, L = Math.sqrt(dx * dx + dy * dy) || 1;
          for (const e of this.enemies) {
            const ex = e.pos.x, ey = e.pos.y - 10, u = Math.max(0, Math.min(1, ((ex - x0) * dx + (ey - y0) * dy) / (L * L)));
            if (Math.hypot(ex - (x0 + dx * u), ey - (y0 + dy * u)) < w / 2 + e.radius) { this.hit(e, s.damage * 3, dx / L * 100, dy / L * 100, 'hielo', true); e.slowUntil = this.runTime + 2; }
          }
        },
        onBurst: (bx, by, r) => {
          sfx('boom');
          for (const e of this.enemies) {
            const d = Math.hypot(e.pos.x - bx, e.pos.y - 10 - by);
            if (d >= r + e.radius) continue;
            this.hit(e, s.damage * 5, 0, 0, 'hielo', true);
            e.webUntil = this.runTime + 2.5; e.slowUntil = this.runTime + 4; // frozen still (bosses only slowed), then slow
            if (!e.dead) e.sprite.setTint?.(0xbfefff);
            this.time.delayedCall(2500, () => { if (!e.dead) e.sprite.clearTint?.(); });
          }
        },
        at: () => ({ x: m.f.x, y: m.f.y }),
      });
      used();
      m.cds[i] = Math.max(7000, s.cooldownMs * 3);
      m.maxCd[i] = m.cds[i];
      return;
    }
    if (/^estocada samur[aá]i$/i.test(t.name)) {
      // 2.0 (author, from its scene): Musashi's shot. He rises out of the smoke, draws both katanas and cuts a red X across
      // the pitch; the ball flies at its heart and the X blows up on the rival (longer, wider with the spirit's level)
      const target = this.nearestEnemy(ox, oy, 320 * this.cfg.perks.rangeMult);
      if (!target) { m.cds[i] = 150; return; }
      sfx('whoosh');
      this.cinematic(SLASH_MS.total);
      m.f.container.setDepth(CAST_DEPTH);
      this.time.delayedCall(SLASH_MS.cut - 200, () => { if (this.sys.isActive()) { m.f.hop(this, 16, 360); sfx('kick'); } });
      // (author: «que todo lo que corte Musashi muera») every ordinary rival he cuts falls; bosses and minibosses lose at
      // least 12 % of their whole life instead (a one-shot boss would break the run)
      const slay = (e: Enemy, dmg: number) => (e.kind === 'boss' || e.kind === 'miniboss' ? Math.max(dmg, e.maxHp * 0.12) : Math.max(dmg, e.hp + 1));
      samuraiSlash(this, ox, oy, target.pos.x, target.pos.y - 10, lv, {
        onCross: (x0, y0, x1, y1, w) => {
          sfx('boom');
          const dx = x1 - x0, dy = y1 - y0, L = Math.sqrt(dx * dx + dy * dy) || 1;
          for (const e of this.enemies) {
            const ex = e.pos.x, ey = e.pos.y - 10, u = Math.max(0, Math.min(1, ((ex - x0) * dx + (ey - y0) * dy) / (L * L)));
            if (Math.hypot(ex - (x0 + dx * u), ey - (y0 + dy * u)) < w / 2 + e.radius) this.hit(e, slay(e, s.damage * 3), dx / L * 120, dy / L * 120, 'tierra', true);
          }
        },
        onBlast: (bx, by, r) => {
          sfx('boom');
          for (const e of this.enemies) {
            const d = Math.hypot(e.pos.x - bx, e.pos.y - 10 - by);
            if (d < r + e.radius) this.hit(e, slay(e, s.damage * 5), (e.pos.x - bx) / (d || 1) * 170, (e.pos.y - by) / (d || 1) * 170, 'tierra', true);
          }
        },
        at: () => ({ x: m.f.x, y: m.f.y }),
      });
      used();
      m.cds[i] = Math.max(7000, s.cooldownMs * 3);
      m.maxCd[i] = m.cds[i];
      return;
    }
    if (/^llamarada solar$/i.test(t.name)) {
      // 2.0 (author, from its scene): Apolo's shot. The god gathers a sun over the pitch and the player kicks it down on
      // the rival: a huge blast, then a sea of flames that keeps burning (wider with the spirit's level)
      const target = this.nearestEnemy(ox, oy, 300 * this.cfg.perks.rangeMult);
      if (!target) { m.cds[i] = 150; return; }
      sfx('whoosh');
      this.cinematic(SUN_MS.total);
      m.f.container.setDepth(CAST_DEPTH);
      this.time.delayedCall(SUN_MS.kick - 260, () => { if (this.sys.isActive()) { m.f.hop(this, 22, 420); sfx('kick'); } });
      solarFlare(this, ox, oy, target.pos.x, target.pos.y - 10, lv, {
        onImpact: (bx, by, r) => {
          sfx('boom');
          for (const e of this.enemies) {
            const d = Math.hypot(e.pos.x - bx, e.pos.y - 10 - by);
            if (d < r + e.radius) this.hit(e, s.damage * 6, (e.pos.x - bx) / (d || 1) * 170, (e.pos.y - by) / (d || 1) * 170, 'fuego', true);
          }
        },
        onBurn: (bx, by, r, ms) => {
          this.time.addEvent({ delay: 250, repeat: Math.floor(ms / 250) - 1, callback: () => {
            for (const e of this.enemies) if (Math.hypot(e.pos.x - bx, (e.pos.y - 10 - by) * 1.6) < r + e.radius) this.hit(e, s.damage * 0.6, 0, 0, 'fuego');
          } });
        },
        at: () => ({ x: m.f.x, y: m.f.y }),
      });
      used();
      m.cds[i] = Math.max(7000, s.cooldownMs * 3);
      m.maxCd[i] = m.cds[i];
      return;
    }
    if (/^aliento blanco$/i.test(t.name)) {
      // 2.0 (author, from its scene): Guiverno Blanco's shot. The dragon coils round the player, gathers the light in the
      // ball at its mouth and breathes it out in a huge white-gold beam; longer and wider with the spirit's level
      const target = this.nearestEnemy(ox, oy, 300 * this.cfg.perks.rangeMult);
      if (!target) { m.cds[i] = 150; return; }
      sfx('whoosh');
      this.cinematic(BREATH_MS.total);
      m.f.container.setDepth(CAST_DEPTH);
      this.time.delayedCall(BREATH_MS.kick - 200, () => { if (this.sys.isActive()) { m.f.hop(this, 14, 360); sfx('kick'); } });
      whiteBreath(this, ox, oy, target.pos.x, target.pos.y - 10, lv, {
        onBreath: (x0, y0, x1, y1, w) => {
          sfx('boom');
          const dx = x1 - x0, dy = y1 - y0, L = Math.sqrt(dx * dx + dy * dy) || 1;
          for (const e of this.enemies) {
            const ex = e.pos.x, ey = e.pos.y - 10, u = Math.max(0, Math.min(1, ((ex - x0) * dx + (ey - y0) * dy) / (L * L)));
            const half = w * (0.2 + u * 0.4); // the cone widens away from the mouth
            if (Math.hypot(ex - (x0 + dx * u), ey - (y0 + dy * u)) < half + e.radius) this.hit(e, s.damage * 6, dx / L * 180, dy / L * 180, 'viento', true);
          }
        },
        at: () => ({ x: m.f.x, y: m.f.y }),
      });
      used();
      m.cds[i] = Math.max(7000, s.cooldownMs * 3);
      m.maxCd[i] = m.cds[i];
      return;
    }
    if (/^zarpazo real$/i.test(t.name)) {
      // author, from its scene: Jmet's dribble. He rises out of a sandstorm roaring (the roar shoves the rivals round the
      // player) and rakes his golden claw across a wide fan in front: everything in it is hit hard, flung away and slowed
      const target = this.nearestEnemy(ox, oy, 260 * this.cfg.perks.rangeMult);
      if (!target) { m.cds[i] = 150; return; }
      sfx('whoosh');
      this.cinematic(CLAW_MS.total);
      m.f.container.setDepth(CAST_DEPTH);
      this.time.delayedCall(CLAW_MS.rake - 200, () => { if (this.sys.isActive()) { m.f.hop(this, 12, 320); sfx('kick'); } });
      royalClaw(this, ox, oy, target.pos.x, target.pos.y - 10, lv, {
        onRoar: (rx, ry, r) => {
          for (const e of this.enemies) {
            const d = Math.hypot(e.pos.x - rx, e.pos.y - ry);
            if (d < r + e.radius) this.hit(e, s.damage, (e.pos.x - rx) / (d || 1) * 200, (e.pos.y - ry) / (d || 1) * 200, 'tierra');
          }
        },
        onRake: (cx, cy, r, ang, spread) => {
          sfx('boom');
          for (const e of this.enemies) {
            const dx = e.pos.x - cx, dy = e.pos.y - 10 - cy, d = Math.hypot(dx, dy);
            const off = Math.abs(Phaser.Math.Angle.Wrap(Math.atan2(dy, dx) - ang));
            if (d < r + e.radius && (off < spread || d < 30)) { this.hit(e, s.damage * 5.5, Math.cos(ang) * 260, Math.sin(ang) * 260, 'tierra', true); e.slowUntil = this.runTime + 1.5; }
          }
        },
        at: () => ({ x: m.f.x, y: m.f.y }),
      });
      used();
      m.cds[i] = Math.max(7000, s.cooldownMs * 3);
      m.maxCd[i] = m.cds[i];
      return;
    }
    if (/^espinas insidiosas$/i.test(t.name)) {
      // author, from its scene: Eris's block. She drives her hair into the ground and four lashes of black thorns burst up in
      // blue fire round the biggest group of rivals: hurt, and held fast (bosses only slowed)
      const target = this.nearestEnemy(ox, oy, 260 * this.cfg.perks.rangeMult);
      if (!target) { m.cds[i] = 150; return; }
      sfx('whoosh');
      this.cinematic(THORN_MS.total);
      m.f.container.setDepth(CAST_DEPTH);
      m.f.hop(this, 8, 300);
      insidiousThorns(this, ox, oy, target.pos.x, target.pos.y - 10, lv, {
        onThorns: (bx, by, r) => {
          sfx('boom');
          for (const e of this.enemies) {
            const d = Math.hypot(e.pos.x - bx, e.pos.y - 10 - by);
            if (d < r + e.radius) { this.hit(e, s.damage * 5, 0, 0, 'viento', true); if (e.kind !== 'boss') e.webUntil = this.runTime + 2.4; e.slowUntil = this.runTime + 3.5; }
          }
        },
        at: () => ({ x: m.f.x, y: m.f.y }),
      });
      used();
      m.cds[i] = Math.max(7000, s.cooldownMs * 3);
      m.maxCd[i] = m.cds[i];
      return;
    }
    if (/^garras llameantes$/i.test(t.name)) {
      // author, from its scene: Huargo's dribble. Out of a spiral of fire, he rakes three streaks of fire along the ground at
      // the rival; a row of flames erupts along them and keeps burning
      const target = this.nearestEnemy(ox, oy, 260 * this.cfg.perks.rangeMult);
      if (!target) { m.cds[i] = 150; return; }
      sfx('whoosh');
      this.cinematic(FLAME_MS.total);
      m.f.container.setDepth(CAST_DEPTH);
      this.time.delayedCall(FLAME_MS.rake - 200, () => { if (this.sys.isActive()) { m.f.hop(this, 12, 320); sfx('kick'); } });
      const inLine = (e: Enemy, x0: number, y0: number, x1: number, y1: number, w: number) => {
        const dx = x1 - x0, dy = y1 - y0, L2 = dx * dx + dy * dy || 1, ex = e.pos.x, ey = e.pos.y - 10, u = Math.max(0, Math.min(1, ((ex - x0) * dx + (ey - y0) * dy) / L2));
        return Math.hypot(ex - (x0 + dx * u), ey - (y0 + dy * u)) < w / 2 + e.radius;
      };
      flameClaws(this, ox, oy, target.pos.x, target.pos.y - 10, lv, {
        onRake: (x0, y0, x1, y1, w) => {
          sfx('boom');
          const L = Math.hypot(x1 - x0, y1 - y0) || 1;
          for (const e of this.enemies) if (inLine(e, x0, y0, x1, y1, w)) this.hit(e, s.damage * 5, (x1 - x0) / L * 200, (y1 - y0) / L * 200, 'fuego', true);
        },
        onBurn: (x0, y0, x1, y1, w, ms) => {
          this.time.addEvent({ delay: 250, repeat: Math.floor(ms / 250) - 1, callback: () => {
            for (const e of this.enemies) if (inLine(e, x0, y0, x1, y1, w)) this.hit(e, s.damage * 0.5, 0, 0, 'fuego');
          } });
        },
        at: () => ({ x: m.f.x, y: m.f.y }),
      });
      used();
      m.cds[i] = Math.max(7000, s.cooldownMs * 3);
      m.maxCd[i] = m.cds[i];
      return;
    }
    if (/^rayo demon[ií]aco$/i.test(t.name)) {
      // author, from its scene: Glenr's dribble. Night falls, a sphere of cyan lightning gathers in his palm and he hurls it:
      // it bursts on the rival and the lightning leaps to the rivals around (more of them with the spirit's level)
      const target = this.nearestEnemy(ox, oy, 280 * this.cfg.perks.rangeMult);
      if (!target) { m.cds[i] = 150; return; }
      sfx('whoosh');
      this.cinematic(DEMON_MS.total);
      m.f.container.setDepth(CAST_DEPTH);
      m.f.hop(this, 8, 300);
      const chains = 4 + lv;
      demonBolt(this, ox, oy, target.pos.x, target.pos.y - 10, lv, {
        onBurst: (bx, by, r) => {
          sfx('boom');
          const struck = new Set<Enemy>();
          for (const e of this.enemies) {
            const d = Math.hypot(e.pos.x - bx, e.pos.y - 10 - by);
            if (d < r + e.radius) { struck.add(e); this.hit(e, s.damage * 5.5, (e.pos.x - bx) / (d || 1) * 160, (e.pos.y - by) / (d || 1) * 160, 'rayo', true); e.slowUntil = this.runTime + 1.5; }
          }
          const near = (e: Enemy) => Math.hypot(e.pos.x - bx, e.pos.y - 10 - by);
          const out = this.enemies.filter((e) => !struck.has(e) && near(e) < r * 3).sort((a, b) => near(a) - near(b)).slice(0, chains);
          for (const e of out) { this.hit(e, s.damage * 2, 0, 0, 'rayo'); e.slowUntil = this.runTime + 1; }
          return out.map((e) => ({ x: e.pos.x, y: e.pos.y - 10 }));
        },
        at: () => ({ x: m.f.x, y: m.f.y }),
      });
      used();
      m.cds[i] = Math.max(7000, s.cooldownMs * 3);
      m.maxCd[i] = m.cds[i];
      return;
    }
    if (/^rayo celeste$/i.test(t.name)) {
      // 2.0 (author, from its scene): Pegaso's dribble. It flies into the storm over the rival and punches a cyan
      // bolt down on him; the area grows with the spirit's level and the shock jumps to the rivals nearby
      const target = this.nearestEnemy(ox, oy, 220 * this.cfg.perks.rangeMult);
      if (!target) { m.cds[i] = 150; return; }
      sfx('whoosh');
      this.cinematic(BOLT_MS.total);
      m.f.container.setDepth(CAST_DEPTH);
      m.f.hop(this, 8, 300);
      const chains = 4 + lv;
      skyBolt(this, ox, oy, target.pos.x, target.pos.y - 10, lv, {
        onStrike: (bx, by, r) => {
          sfx('boom');
          const struck = new Set<Enemy>();
          for (const e of this.enemies) {
            const d = Math.hypot(e.pos.x - bx, e.pos.y - 10 - by);
            if (d < r + e.radius) { struck.add(e); this.hit(e, s.damage * 5, (e.pos.x - bx) / (d || 1) * 150, (e.pos.y - by) / (d || 1) * 150, 'rayo', true); e.slowUntil = this.runTime + 1.5; }
          }
          // the shock jumps to the nearest rivals outside the area
          const near = (e: Enemy) => Math.hypot(e.pos.x - bx, e.pos.y - 10 - by);
          const out = this.enemies.filter((e) => !struck.has(e) && near(e) < r * 3.2).sort((a, b) => near(a) - near(b)).slice(0, chains);
          for (const e of out) { this.hit(e, s.damage * 2, 0, 0, 'rayo'); e.slowUntil = this.runTime + 1; }
          return out.map((e) => ({ x: e.pos.x, y: e.pos.y - 10 }));
        },
        at: () => ({ x: m.f.x, y: m.f.y }),
      });
      used();
      m.cds[i] = Math.max(7000, s.cooldownMs * 3);
      m.maxCd[i] = m.cds[i];
      return;
    }
    if (i === ULT && /^tormenta de fuego$/i.test(t.name)) {
      // 2.0 (author: «Surtur la convierte en un infierno»): the spirit's own Tormenta de fuego (Axel's ordinary one stays
      // below). Surtur rises with his arms crossed, throws them open in a ring of fire, the fireball lands and the storm
      // breaks: fire tornadoes burst up all round the rival and the ground keeps burning
      const target = this.nearestEnemy(ox, oy, 320 * this.cfg.perks.rangeMult);
      if (!target) { m.cds[i] = 150; return; }
      sfx('whoosh');
      this.cinematic(INFERNO_MS.total);
      m.f.container.setDepth(CAST_DEPTH);
      this.time.delayedCall(INFERNO_MS.kick - 200, () => { if (this.sys.isActive()) { m.f.hop(this, 18, 380); sfx('kick'); } });
      const around = (x: number, y: number, r: number, f: (e: Enemy, d: number) => void) => {
        for (const e of this.enemies) { const d = Math.hypot(e.pos.x - x, e.pos.y - 10 - y); if (d < r + e.radius) f(e, d); }
      };
      inferno(this, ox, oy, target.pos.x, target.pos.y - 10, lv, {
        onRing: (x, y, r) => { sfx('boom'); around(x, y, r, (e, d) => this.hit(e, s.damage, (e.pos.x - x) / (d || 1) * 220, (e.pos.y - y) / (d || 1) * 220, 'fuego', true)); },
        onBlast: (x, y, r) => { sfx('boom'); around(x, y, r, (e, d) => this.hit(e, s.damage * 5, (e.pos.x - x) / (d || 1) * 160, (e.pos.y - y) / (d || 1) * 160, 'fuego', true)); },
        onTornado: (x, y, r) => around(x, y, r, (e) => { this.hit(e, s.damage * 2, 0, 0, 'fuego', true); e.slowUntil = this.runTime + 1.5; }),
        onBurn: (x, y, r, ms) => {
          const burn = s.damage * 0.35;
          this.time.addEvent({ delay: 250, repeat: Math.floor(ms / 250) - 1, callback: () => around(x, y, r, (e) => this.hit(e, burn, 0, 0, 'fuego')) });
        },
      });
      used();
      m.cds[i] = Math.max(9000, s.cooldownMs * 4);
      m.maxCd[i] = m.cds[i];
      return;
    }
    if (/^ca[nñ]onazo de fragmentos$/i.test(t.name)) {
      // 2.1 (author, from its scene): Simeon's Shellbit Burst. A shell of green hexagons forms behind him, its plates light
      // up and each fires a fragment at a rival near him, and the ball leaves as a yellow beam that bursts on the target.
      // The beam does the damage of any shot of its level; the fragments add a third of it each
      const target = this.nearestEnemy(ox, oy, 250 * this.cfg.perks.rangeMult);
      if (!target) { m.cds[i] = 150; return; }
      const size = 28 + lv * 2, r = Math.max(42, s.radius * 1.15);
      const others = this.enemies.filter((e) => !e.dead && e !== target && Math.hypot(e.pos.x - ox, e.pos.y - oy) < 230 * this.cfg.perks.rangeMult)
        .sort((a, b) => Math.hypot(a.pos.x - ox, a.pos.y - oy) - Math.hypot(b.pos.x - ox, b.pos.y - oy)).slice(0, 3 + Math.floor(lv / 3));
      sfx('whoosh');
      m.f.hop(this, 16, SHELLBIT_CHARGE * 0.7);
      const bx = target.pos.x, by = target.pos.y - 10;
      shellbitBurst(this, ox, oy, bx, by, size,
        others.map((e) => ({ x: e.pos.x, y: e.pos.y - 10, hit: () => { if (!e.dead) this.hit(e, s.damage * 0.33, 0, 0, 'energia', true); } })),
        () => {
          sfx('boom');
          this.fx.shake(0.005, 180);
          for (const e of this.enemies) {
            const d = Math.hypot(e.pos.x - bx, e.pos.y - 10 - by);
            if (d < r + e.radius) this.hit(e, s.damage, (e.pos.x - bx) / (d || 1) * 120, (e.pos.y - by) / (d || 1) * 120, 'energia', true);
          }
        });
      used();
      m.cds[i] = s.cooldownMs;
      m.maxCd[i] = m.cds[i];
      return;
    }
    if (/^tormenta de fuego$/i.test(t.name)) {
      // Fix 1.22: Tormenta de fuego (Bakunetsu Storm) with its own animation: the fiery Majin, the spin, the volley. Same
      // damage and cooldown as any shot of its level (its numbers come from techStats); the blast hits around the target
      const target = this.nearestEnemy(ox, oy, 240 * this.cfg.perks.rangeMult);
      if (!target) { m.cds[i] = 150; return; }
      const size = 26 + lv * 2, r = Math.max(36, s.radius);
      const charge = 560;
      fireStormCharge(this, ox, oy, size, charge);
      sfx('whoosh');
      m.f.hop(this, 14, charge * 0.6);
      this.time.delayedCall(charge, () => {
        if (this.sys.isActive() === false) return;
        const bx = target.pos.x, by = target.pos.y - 10;
        sfx('whoosh');
        fireStormShot(this, m.f.x, m.f.y - 16, bx, by, size, 340, () => {
          sfx('boom');
          this.fx.shake(0.005, 180);
          for (const e of this.enemies) {
            const d = Math.hypot(e.pos.x - bx, e.pos.y - 10 - by);
            if (d < r + e.radius) this.hit(e, s.damage, (e.pos.x - bx) / (d || 1) * 100, (e.pos.y - by) / (d || 1) * 100, 'fuego', true);
          }
        });
      });
      used();
      m.cds[i] = s.cooldownMs;
      m.maxCd[i] = m.cds[i];
      return;
    }
    if (/tiro supermasivo/i.test(t.name)) {
      // signature move: charge in a black and red vortex, then a huge orb that tears the pitch and blows up on arrival
      const target = this.nearestEnemy(ox, oy, 260 * this.cfg.perks.rangeMult);
      if (!target) { m.cds[i] = 150; return; }
      const size = 34 + lv * 2.5, r = 58 + lv * 5, dmg = s.damage * 2.2;
      const charge = 620;
      chaosMeteorCharge(this, ox, oy, size, charge);
      sfx('whoosh');
      m.f.hop(this, 8, charge * 0.5);
      this.time.delayedCall(charge, () => {
        if (this.sys.isActive() === false) return;
        const bx = target.pos.x, by = target.pos.y - 10;
        const sx = m.f.x, sy = m.f.y - size * 1.25;
        sfx('whoosh');
        chaosMeteorShot(this, sx, sy, bx, by, size, 300, () => {
          sfx('boom');
          this.fx.shake(0.006, 220);
          for (const e of this.enemies) {
            const d = Math.hypot(e.pos.x - bx, e.pos.y - 10 - by);
            if (d < r + e.radius) this.hit(e, dmg, (e.pos.x - bx) / (d || 1) * 120, (e.pos.y - by) / (d || 1) * 120, 'sombra', true);
          }
        });
      });
      used();
      m.cds[i] = Math.max(3200, s.cooldownMs * 1.5);
      m.maxCd[i] = m.cds[i];
      return;
    }
    if (t.type === 'tiro') {
      const target = this.nearestEnemy(ox, oy, 240 * this.cfg.perks.rangeMult);
      if (!target) { m.cds[i] = 150; return; }
      // anticipation + charge come from the technique's recipe
      const recipe = m.recipes[i];
      m.windup = { i, until: this.runTime + recipe.windupSec };
      m.f.hop(this, 5 + lv * 0.6, recipe.windupSec * 1000);
      charge(this.fx, recipe, ox, oy, lv);
      if (signatureOf(t.name) === 'ceniza') blackAshCharge(this, ox, oy, lv, recipe.windupSec * 1000);
      const nat = natureOf(t.name); // Fix 1.31: penguins, flowers, sharks... drawn after the wiki
      if (nat) natureCharge(this, nat, ox, oy, lv, recipe.windupSec * 1000);
      const anime = animeOf(t.name); // v1.4: techniques redrawn from their anime scenes
      if (anime) animeCharge(this, anime, ox, oy, lv, recipe.windupSec * 1000);
      const mv = movieOf(t.name); // 1.76: six more shots redrawn from their scenes (fxMovie.ts)
      if (mv) movieCharge(this, mv, ox, oy, lv, recipe.windupSec * 1000);
      const vb = victorOf(t.name); // Victor Blade's shots redrawn from their scenes (fxVictor.ts)
      if (vb) victorCharge(this, vb, ox, oy, lv, recipe.windupSec * 1000);
      if (isSetsuna(t.name)) setsunaCharge(this, ox, oy, lv, recipe.windupSec * 1000, target.pos.x, target.pos.y, m.f); // author: Impulso efímero redrawn (fxSetsuna.ts)
      if (isCataclysm(t.name)) cataclysmCharge(this, ox, oy, lv, recipe.windupSec * 1000); // author: Golpe cataclismo redrawn (fxCataclysm.ts)
      if (isAlmighty(t.name)) almightyCharge(this, ox, oy, lv, recipe.windupSec * 1000); // 2.1: Soy todopoderoso (fxAlmighty.ts)
      const s183 = solo183Of(t.name); // 1.83: Disparo sagrado, Tornado dragón (fxCombo183.ts)
      if (s183) solo183Charge(this, s183, ox, oy, lv, recipe.windupSec * 1000);
      const s189 = solo189Of(t.name); // 1.88: Remate del tigre, Fénix, Fénix oscuro
      if (s189) solo189Charge(this, s189, ox, oy, lv, recipe.windupSec * 1000);
      if (mv === 'vibora') this.darkClone(m, recipe.windupSec * 1000); // Víbora de Orión: her dark clone kicks with her
      const fuego = fuegoOf(t.name); // Axel Blaze Encapuchado: Fuego supremo / Fuego total (fxFuego.ts)
      if (fuego === 'supremo') supremoCharge(this, ox, oy, lv, recipe.windupSec * 1000);
      else if (fuego === 'total') totalCharge(this, ox, oy, lv, recipe.windupSec * 1000);
      if (recipe.id === 'dragon') dragon(this, 'rise', ox, oy, c1, c2, lv, recipe.windupSec * 1000 + 160, ox, oy, recipe.tier >= 3);
    } else if (t.type === 'regate') {
      if (!canStartGuardedMove(this.runTime, m.guardLock)) { m.cds[i] = 120; return; }
      if (m === this.members[0]) {
        // captain: elemental whirl (the captain is never moved automatically)
        const r = s.radius + 6;
        m.guardUntil = this.runTime + 0.26;
        m.guardLock = m.guardUntil + GUARD_LOCKOUT_SEC;
        this.fx.ring(ox, oy + 6, r, c1, 260, 2 + Math.floor(lv / 2));
        const sig = signatureOf(t.name), dr = dribbleOf(t.name); // 1.76: Espada real, El ojo del huracán, Hora celestial (fxMovie.ts)
        const near0 = dr ? this.nearestEnemy(ox, oy, 160) : null;
        if (isMeteorShower(t.name)) { const near = this.nearestEnemy(ox, oy, 160); meteorShower(this, ox, oy, near ? near.pos.x : ox + 50, near ? near.pos.y - 10 : oy, lv); } // 1.83
        if (isCorrienteNegra(t.name)) { const near = this.nearestEnemy(ox, oy, 160); corrienteNegra(this, ox, oy, near ? near.pos.x : ox + 50, near ? near.pos.y - 10 : oy, lv, undefined, (cx, cy, cr) => this.waterCrash(cx, cy, cr, s.damage * 1.4, style)); } // pre-2.0 (fxJaden.ts); 2.0: the crash hurts
        if (dr) {
          movieDribble(this, dr, ox, oy, near0 ? near0.pos.x : ox + 40, near0 ? near0.pos.y - 10 : oy, lv, 420);
          if (dr === 'hora' || dr === 'atenea') for (const e of this.enemies) if (Math.hypot(e.pos.x - ox, e.pos.y - oy) < 90) e.slowUntil = this.runTime + 1.2; // time stops / the hymn charms them
        } else if (sig === 'espejismo') illusionBall(this, ox, oy, lv);
        else if (sig === 'huracan') stormZone(this, ox, oy, r + 10, lv);
        else if (animeOf(t.name) === 'brisa') { const near = this.nearestEnemy(ox, oy, 160), ba = near ? Math.atan2(near.pos.y - 10 - oy, near.pos.x - ox) : 0; breezeStep(this, ox - Math.cos(ba) * 30, oy - Math.sin(ba) * 30, ox + Math.cos(ba) * 40, oy + Math.sin(ba) * 40, lv); }
        else if (/drag[oó]n/i.test(t.name)) dragon(this, /ascend/i.test(t.name) ? 'rise' : 'coil', ox, oy, c1, c2, lv, 520);
        else elementBurst(this, style, ox, oy, r, 300, c1);
        for (let k = 0; k < 6 + lv * 2; k++) {
          const a = (k / (6 + lv * 2)) * Math.PI * 2;
          this.fx.burst(style, ox + Math.cos(a) * r, oy + 6 + Math.sin(a) * r * 0.6, 1, 20, k % 2 === 0);
        }
        const hurtR = dr === 'hora' ? Math.max(r, 90) : r; // 1.91: Hora celestial hurts the whole area it stops
        for (const e of this.enemies) {
          const d = Math.hypot(e.pos.x - ox, e.pos.y - 10 - oy);
          if (d < hurtR + e.radius) this.hit(e, s.damage, (e.pos.x - ox) / (d || 1) * 60, (e.pos.y - oy) / (d || 1) * 60, style);
        }
        sfx('whoosh');
      } else {
        // v1.65 (author: melee players stayed on a tough boss until it died): back to the formation first
        if (m.slotDist > 36) { m.cds[i] = 150; return; }
        const target = this.nearestEnemy(ox, oy, 120);
        if (!target) { m.cds[i] = 200; return; }
        const ang = Math.atan2(target.pos.y - 10 - oy, target.pos.x - ox);
        const reach = Math.min(110, Math.hypot(target.pos.x - ox, target.pos.y - oy) + 24);
        m.settled = false;
        m.guardUntil = Infinity; // released when the movement phase ends
        if (/drag[oó]n/i.test(t.name)) dragon(this, 'strike', m.f.x, m.f.y - 10, c1, c2, lv, 300, m.f.x + Math.cos(ang) * reach, m.f.y - 10 + Math.sin(ang) * reach);
        if (signatureOf(t.name) === 'espejismo') illusionBall(this, m.f.x, m.f.y, lv, 420);
        if (animeOf(t.name) === 'brisa') breezeStep(this, m.f.x, m.f.y, m.f.x + Math.cos(ang) * reach, m.f.y + Math.sin(ang) * reach, lv, 300);
        const dr = dribbleOf(t.name); // 1.76 (fxMovie.ts)
        if (dr) movieDribble(this, dr, m.f.x, m.f.y, m.f.x + Math.cos(ang) * reach, m.f.y + Math.sin(ang) * reach, lv, 420);
        if (isCorrienteNegra(t.name)) corrienteNegra(this, m.f.x, m.f.y, m.f.x + Math.cos(ang) * reach, m.f.y - 6 + Math.sin(ang) * reach, lv, undefined, (cx, cy, cr) => this.waterCrash(cx, cy, cr, s.damage * 1.4, style)); // pre-2.0; 2.0: the crash hurts
        if (isMeteorShower(t.name)) meteorShower(this, m.f.x, m.f.y, m.f.x + Math.cos(ang) * reach, m.f.y - 10 + Math.sin(ang) * reach, lv); // 1.83
        if (dr === 'hora' || dr === 'atenea') for (const e of this.enemies) if (Math.hypot(e.pos.x - m.f.x, e.pos.y - m.f.y) < 90) e.slowUntil = this.runTime + 1.2;
        if (!dr && signatureOf(t.name) === 'huracan') stormZone(this, m.f.x + Math.cos(ang) * reach * 0.5, m.f.y + Math.sin(ang) * reach * 0.5, 34, lv, 520);
        m.dash = { fromX: m.f.x, fromY: m.f.y, toX: m.f.x + Math.cos(ang) * reach, toY: m.f.y + Math.sin(ang) * reach,
          t: 0, dur: 220, hits: new Set(), chain: new Set(), dmg: s.damage, style, left: s.count - 1 };
        sfx('whoosh');
      }
    } else if (t.type === 'defensa') {
      const r = s.radius;
      const wall = /muro|muralla|pared|barrera|escudo|armadur|bloque|fortal|refugio|falange/i.test(t.name);
      const web = /telara[ñn]a|spider ?web/i.test(t.name);
      this.fx.ring(ox, oy + 8, r, c1, 320, 2 + Math.floor(lv / 2));
      if (wall) {
        const wv = this.add.rectangle(ox, oy + 2, r * 1.4, 10 + lv * 2, c1, 0.55).setStrokeStyle(2, c2).setDepth(m.f.y + 2);
        this.tweens.add({ targets: wv, scaleY: 2.2, alpha: 0, duration: 380, onComplete: () => wv.destroy() });
      }
      this.fx.burst(style, ox, oy + 8, 8 + lv * 3, 70);
      if (/apisonadora|sabaki/i.test(t.name)) judgementHammer(this, ox, oy + 2, r, lv, () => this.fx.shake(0.006, 180)); // 1.83: the hammer of judgement
      const natD = natureOf(t.name);
      const volcano = isCorteVolcanico(t.name); // pre-2.0: the arc and wall of fire of its scene (fxJaden.ts)
      if (volcano) { const ne = this.nearestEnemy(ox, oy, r * 2.5); corteVolcanico(this, ox, oy + 2, r, ne ? Math.atan2(ne.pos.y - 10 - oy, ne.pos.x - ox) : this.heading, lv); }
      if (volcano) { /* its own drawing */ } else if (natD) natureArea(this, natD, ox, oy + 2, r, lv, this.enemies.filter((e) => !e.dead && Math.hypot(e.pos.x - ox, e.pos.y - 10 - oy) < r + e.radius).map((e) => ({ x: e.pos.x, y: e.pos.y - 10 })));
      else if (!wall && !web) elementBurst(this, style, ox, oy + 2, r, 420, c1); // Fix 1.11: rock, vines, wind, fire... by element
      for (const e of this.enemies) {
        const d = Math.hypot(e.pos.x - ox, e.pos.y - 10 - oy);
        if (d < r + e.radius) {
          this.hit(e, s.damage, (e.pos.x - ox) / (d || 1) * s.knockback, (e.pos.y - oy) / (d || 1) * s.knockback, style);
          if (s.slow < 1) e.slowUntil = this.runTime + 1.5;
          if (web) e.webUntil = this.runTime + 0.8 + lv * 0.08; // Telaraña: the rivals in it are caught for a moment
        }
      }
      if (web) this.fx.spiderWeb(ox, oy + 8, r);
    } else if (t.type === 'parada') {
      const heal = Math.round(this.maxHp * s.heal);
      let cx = ox, cy = oy; // centre of the area hit
      let later = false; // Fix 1.53: the hit comes with the animation, not at once
      if (/olvido|the end/i.test(t.name)) {
        // El Olvido (The End): a black hole in front of the keeper swallows the rivals' balls and pulls rivals in
        const big = ['mitico', 'leyenda'].includes(m.entry.rarity) || !!this.cfg.asc?.[String(m.entry.id)]?.hero;
        // the hole opens on the rivals (the closest one in reach), never on the keeper
        const target = this.nearestEnemy(ox, oy, 220 * this.cfg.perks.rangeMult);
        if (!target) { m.cds[i] = 200; return; }
        const hx = target.pos.x, hy = target.pos.y - 10;
        cx = hx; cy = hy;
        this.fx.blackHole(hx, hy, s.radius, lv, 900, big);
        this.shots = this.shots.filter((b) => {
          if (Math.hypot(b.x - hx, b.y - hy) >= s.radius * 1.4) return true;
          this.tweens.add({ targets: b.img, x: hx, y: hy, scale: 0, duration: 260, ease: 'Cubic.easeIn', onComplete: () => b.img.destroy() });
          return false;
        });
        for (const e of this.enemies) {
          const d = Math.hypot(e.pos.x - hx, e.pos.y - hy);
          if (d < s.radius * 1.3) e.slowUntil = this.runTime + 0.9;
        }
        sfx('whoosh');
        this.time.delayedCall(700, () => { if (!this.ended) sfx('boom'); });
      } else if (/ara[ñn]a gigante|giant spider/i.test(t.name)) {
        // Araña Gigante: the spider lands on the rivals around the keeper and webs them: caught rivals can't move
        // for a while (bosses only slow down) and the balls in the web stop dead
        const target = this.nearestEnemy(ox, oy, 200 * this.cfg.perks.rangeMult);
        if (!target) { m.cds[i] = 200; return; }
        cx = target.pos.x; cy = target.pos.y - 10;
        const webR = s.radius * 1.25;
        const caught = this.enemies.filter((e) => Math.hypot(e.pos.x - cx, e.pos.y - 10 - cy) < webR + e.radius).slice(0, 6 + lv);
        const hold = 1.4 + lv * 0.12;
        for (const e of caught) { e.webUntil = this.runTime + hold; e.slowUntil = this.runTime + hold + 1; }
        this.shots = this.shots.filter((b) => {
          if (Math.hypot(b.x - cx, b.y - cy) >= webR) return true;
          b.img.destroy();
          return false;
        });
        this.fx.spider(cx, cy, webR, lv, 900, caught.map((e) => ({ x: e.pos.x, y: e.pos.y - 10 })), ['mitico', 'leyenda'].includes(m.entry.rarity));
        sfx('whoosh');
      } else if (/mordisco de serpiente|snake bite|serpent/i.test(t.name)) {
        // Mordisco de serpiente: the serpent lunges at the closest rival in reach, bites and poisons the rivals around
        // the bite (damage over 3 s on top of the hit)
        const target = this.nearestEnemy(ox, oy, 210 * this.cfg.perks.rangeMult);
        if (!target) { m.cds[i] = 200; return; }
        cx = target.pos.x; cy = target.pos.y - 10;
        this.fx.serpentBite(ox, oy - 6, cx, cy, lv, ['mitico', 'leyenda'].includes(m.entry.rarity));
        const dps = Math.max(2, s.damage * 0.25);
        for (const e of this.enemies) if (Math.hypot(e.pos.x - cx, e.pos.y - 10 - cy) < s.radius) e.poison = { until: this.runTime + 3, dps, acc: 0 };
        sfx('whoosh');
      } else if (/drag[oó]n/i.test(t.name)) {
        // Mate del dragón: a dragon leaves the keeper, bites the closest rival and the catch hits around it
        const target = this.nearestEnemy(ox, oy, 200 * this.cfg.perks.rangeMult);
        if (!target) { m.cds[i] = 200; return; }
        cx = target.pos.x; cy = target.pos.y - 10;
        dragon(this, 'strike', ox, oy - 6, c1, c2, lv, 420, cx, cy, ['mitico', 'leyenda'].includes(m.entry.rarity));
        sfx('whoosh');
      } else if (/mano diab[oó]lica|maou/i.test(t.name)) {
        // 1.83: Mano Diabólica (Maou The Hand): a magenta demon with a red horned mask rises and its hand closes on the ball
        maouHand(this, ox, oy, lv, ['mitico', 'leyenda'].includes(m.entry.rarity) || !!this.cfg.asc?.[String(m.entry.id)]?.hero);
        this.fx.ring(ox, oy, s.radius, 0xd02ad8, 420, 2);
      } else if (/m[aá]gica|majin/i.test(t.name)) {
        // Mano mágica (Majin The Hand): the Majin rises behind the keeper and raises its arm, then the hand blocks
        const tint = handTintOf(m.entry.name); // 1.76: Mark's yellow-orange, Darren's blue
        this.fx.entity('majin', ox, oy + 6, 900, ['mitico', 'leyenda'].includes(m.entry.rarity) || !!this.cfg.asc?.[String(m.entry.id)]?.hero, tint);
        this.fx.magicHand(ox, oy, lv, tint);
        this.fx.ring(ox, oy, s.radius, tint?.main ?? 0xb36bff, 420, 2);
      } else if (natureOf(t.name)) {
        // Fix 1.31: Mano de pingüinos, Tormenta de pétalos, Hojarasca... drawn after the wiki
        natureArea(this, natureOf(t.name)!, ox, oy, s.radius, lv, this.enemies.filter((e) => !e.dead && Math.hypot(e.pos.x - ox, e.pos.y - oy) < s.radius).map((e) => ({ x: e.pos.x, y: e.pos.y - 10 })));
        this.fx.ring(ox, oy, s.radius, 0xffe27a, 480, 2);
      } else if (/pu[ñn]o de furia/i.test(t.name)) {
        // Fix 1.53 (author, from the scene): the golden giant's fist comes down on the closest rival, 30% more damage and
        // reach than a plain catch; the heal is immediate, the hit lands with the fist
        const near = this.nearestEnemy(ox, oy, 210 * this.cfg.perks.rangeMult);
        if (!near) { m.cds[i] = 200; return; }
        const fx0 = near.pos.x, fy0 = near.pos.y - 10, r = s.radius * 1.3;
        later = true;
        m.f.hop(this, 16, 380);
        sfx('whoosh');
        furyFist(this, ox, oy, fx0, fy0, lv, 640, () => {
          if (this.ended) return;
          sfx('boom');
          this.fx.shake(0.007, 220);
          for (const e of this.enemies) {
            const d = Math.hypot(e.pos.x - fx0, e.pos.y - 10 - fy0);
            if (d < r + e.radius) this.hit(e, s.damage * 1.3, (e.pos.x - fx0) / (d || 1) * s.knockback, (e.pos.y - fy0) / (d || 1) * s.knockback, 'fuego', true);
          }
          this.shots = this.shots.filter((b) => { if (Math.hypot(b.x - fx0, b.y - fy0) >= r) return true; b.img.destroy(); return false; });
        });
      } else if (handKind(t.name)) {
        // Fix 1.11: drawn hands and fists per family (fxTech.ts); fists hit where they land
        const kind = handKind(t.name)!;
        const near = this.nearestEnemy(ox, oy, 200 * this.cfg.perks.rangeMult);
        if (kind === 'puno' && near) { cx = near.pos.x; cy = near.pos.y - 10; }
        const aims = this.enemies.filter((e) => !e.dead && Math.hypot(e.pos.x - ox, e.pos.y - oy) < 200).slice(0, 6).map((e) => ({ x: e.pos.x, y: e.pos.y - 10 }));
        keeperHand(this.fx, this, t.name, kind, ox, oy, lv, c2, near?.pos.x ?? ox + 60, (near?.pos.y ?? oy) - 10, aims,
          ['mitico', 'leyenda'].includes(m.entry.rarity) || !!this.cfg.asc?.[String(m.entry.id)]?.hero, m.entry.name);
        if (kind === 'punos') for (const a of aims) for (const e of this.enemies) if (Math.hypot(e.pos.x - a.x, e.pos.y - 10 - a.y) < 18 + e.radius) this.hit(e, s.damage * 0.6, 0, 0, style);
        this.fx.ring(cx, cy, s.radius, 0xffe27a, 480, 3); // the push that rejects rivals
      }
      else this.fx.ring(ox, oy, s.radius, 0xffe27a, 520, 3);
      this.fx.burst('energia', ox, oy, 6 + lv * 2, 40, true);
      // El Olvido pulls inwards (into the hole) instead of pushing away; same damage and reach as every parada
      const pull = /olvido|the end/i.test(t.name) ? -0.8 : 1;
      this.healBy(heal, false); // after the target check: an Olvido with no rival in reach does nothing (its number comes below)
      if (!later) for (const e of this.enemies) {
        const d = Math.hypot(e.pos.x - cx, e.pos.y - cy);
        if (d < s.radius) this.hit(e, s.damage, (e.pos.x - cx) / (d || 1) * s.knockback * pull, (e.pos.y - cy) / (d || 1) * s.knockback * pull, style);
      }
      if (heal > 0) { this.fx.healFx(this.members[0].f.x, this.members[0].f.y - 10, heal); this.healAt = this.runTime; } // 2.0: a heal, shown as one
    }
    used();
    m.cds[i] = s.cooldownMs;
    m.maxCd[i] = s.cooldownMs;
  }

  /** Special slot of the combined techniques: fires on its own cooldown while every participant is on the pitch. */
  private runCombos(dt: number) {
    for (const [id, st] of this.combos) {
      const def = COMBOS.find((x) => x.id === id)!;
      const who = comboMembers(def, this.members);
      if (!who.length) continue;
      if (def.requires && !this.comboActive(def.requires)) continue; // author: the Dragón needs a Último recurso active
      st.cd -= dt;
      if (st.cd > 0) continue;
      const mx = who.reduce((a, m) => a + m.f.x, 0) / who.length, my = who.reduce((a, m) => a + m.f.y, 0) / who.length - 10;
      const target = this.nearestEnemy(mx, my, 300);
      if (!target) { st.cd = 300; continue; }
      st.cd = def.cooldownMs * (1 - 0.06 * (st.level - 1));
      this.comboShot(def, st.level, who, mx, my, target);
    }
  }

  /** One of these combos is learned in this run and its participants are on the pitch (or carried as Aura). */
  private comboActive(ids: string[]) {
    return ids.some((id) => { const d = COMBOS.find((x) => x.id === id); return !!d && this.combos.has(id) && comboMembers(d, this.members).length > 0; });
  }

  /** Cooperative wind-up (participants jump, their auras meet in the middle), then one big piercing shot. */
  private comboShot(def: ComboDef, level: number, who: Member[], mx: number, my: number, target: Enemy) {
    const t = { name: def.name, element: def.element, power: def.power };
    const recipe = recipeFor(t, 'legendario');
    const style = fxStyle(t);
    const [c1, c2] = STYLE_COLORS[style];
    // Fix 1.12: the participants send their power to the meeting point and each combination has its own manifestation
    const lastResort = def.effect.startsWith('ultimo-recurso') ? def.effect as LastResort : null; // author (fxLastResort.ts)
    const wind = lastResort ? LAST_RESORT_WIND : def.effect === 'escena-nocturna' ? NOCTURNE_WIND : COMBO189.has(def.effect) ? 800 : COMBO183.has(def.effect) ? combo183Wind(def.effect as Combo183) : def.effect === 'tierra' || def.effect === 'tierra-inf' || def.effect === 'bigbang' || def.effect === 'fuego-total' ? 900 : def.effect === 'caos' || def.effect === 'fenix' || def.effect === 'aurora' || def.effect === 'tiro-doble' || def.effect === 'zero' || def.effect === 'frente' ? 700 : def.effect === 'gungnir' ? 900 : def.effect === 'tiro-rayo' || def.effect === 'superrayo' ? 600 : 360;
    // v1.5: a participant carried as Aura appears beside its carrier for the technique only, then fades away
    const ghosts: { x: number; y: number }[] = [];
    for (const c of comboCast(def, who)) {
      if (!c.viaAura) continue;
      const ae = this.cfg.auras?.find((p) => p.id === c.member.entry.aura?.id);
      const body = ae && (this.cfg.manifest.bodies[ae.body] ?? this.cfg.manifest.bodies.field);
      if (!ae || !body || !this.textures.exists(headKey(ae.id))) continue;
      const side = c.member.f.x < mx ? -1 : 1;
      const gx = c.member.f.x + side * 18, gy = c.member.f.y - 2;
      const ghost = new Footballer(this, ae, body, gx, gy);
      ghost.dir = c.member.f.dir;
      ghost.update(0);
      ghost.container.setAlpha(0).setDepth(gy);
      const glow = this.add.circle(gx, gy - 10, 16, 0x7ff6ff, 0.35).setBlendMode(Phaser.BlendModes.ADD).setDepth(gy - 1);
      this.tweens.add({ targets: ghost.container, alpha: 0.9, duration: 160 });
      ghost.hop(this, 10, wind);
      this.fx.ring(gx, gy - 10, 22, 0x7ff6ff, 420, 2);
      this.time.delayedCall(wind + 260, () => {
        this.tweens.add({ targets: [ghost.container, glow], alpha: 0, duration: 220, onComplete: () => { ghost.destroy(); glow.destroy(); } });
      });
      ghosts.push({ x: gx, y: gy - 12 });
      this.auraCombos++;
    }
    if (ghosts.length) teamBeams(this, ghosts, mx, my, 0x7ff6ff, wind);
    for (const m of who) {
      m.f.hop(this, 9, wind);
      if (def.effect === 'tiro-rayo') this.fx.lightning(m.f.x, m.f.y - 12, mx, my);
      else this.fx.burst(style, m.f.x, m.f.y - 12, 10, 40, true);
    }
    teamBeams(this, who.map((m) => ({ x: m.f.x, y: m.f.y - 12 })), mx, my, c1, wind);
    if (def.effect === 'tierra' || def.effect === 'tierra-inf') earthCharge(this, mx, my - 40, 24 + level * 2, wind, def.effect === 'tierra-inf'); // Fix 1.53: the aura grows, the Earth appears
    else if (def.effect === 'caos') chaosBreakCharge(this, mx, my, 34 + level * 2, wind); // v1.5: its own chaos vortex
    else if (def.effect === 'ventisca') fireBlizzardCharge(this, mx, my, 30 + level * 2, wind); // v1.5: half fire, half ice
    else if (def.effect === 'tiro-rayo') rupturaCharge(this, mx, my, 4 + level, wind); // 1.76: Ruptura relámpago as in the anime (fxMovie.ts)
    else if (def.effect === 'zero') zeroCharge(this, who.map((m) => ({ x: m.f.x, y: m.f.y })), mx, my, 4 + level, wind); // 1.76: Zero Magnum (Bailong, Tezcat)
    else if (def.effect === 'superrayo') superrayoCharge(this, mx, my, 4 + level, wind); // 1.76: Súper relámpago (Mark, Axel)
    else if (def.effect === 'gungnir' || def.effect === 'frente') { // 1.76: Shawn and Aiden (fxMovie.ts)
      const pos = (m: Member) => ({ x: m.f.x, y: m.f.y });
      const shawn = who.find((m) => m.entry.name.includes('Shawn')) ?? who[0], aiden = who.find((m) => m !== shawn) ?? shawn;
      if (def.effect === 'gungnir') gungnirCharge(this, pos(shawn), pos(aiden), mx, my, 4 + level, wind);
      else frenteCharge(this, who.map(pos), mx, my, 4 + level, wind);
    }
    else if (def.effect === 'tiro-doble') { // 1.76: Fuego cruzado as in the anime (fxCross.ts): Axel's sphere of fire, Shawn's of ice
      const fire = who.find((m) => m.entry.element === 'Fuego') ?? who[0], ice = who.find((m) => m !== fire) ?? fire;
      crossfireCharge(this, { x: fire.f.x, y: fire.f.y }, { x: ice.f.x, y: ice.f.y }, mx, my, 30 + level * 2, wind);
    }
    else if (def.effect === 'fenix') phoenix(this, mx, my, 40 + level * 3, wind);
    else if (def.effect === 'aurora') auroraVeil(this, mx, my, 30 + level * 2, wind); // v1.5: La Aurora
    else if (def.effect === 'bigbang') animeCharge(this, 'bigbang', mx, my + 10, 4 + level, wind); // Fix 1.51: the atom and its sun
    else if (def.effect === 'fuego-total') totalCharge(this, mx, my, 4 + level, wind); // the curtain of fire between the three
    else if (COMBO183.has(def.effect)) combo183Charge(this, def.effect as Combo183, who.map((m) => ({ x: m.f.x, y: m.f.y, name: m.entry.name })), mx, my, level, wind); // 1.83
    else if (COMBO189.has(def.effect)) combo189Charge(this, def.effect as Combo189, who.map((m) => ({ x: m.f.x, y: m.f.y })), mx, my, level, wind); // 1.88
    else if (def.effect === 'equipo-definitivo') ultimateElevenCharge(this, who.map((m) => ({ x: m.f.x, y: m.f.y })), mx, my, level, wind); // author (fxUltimateEleven.ts)
    else if (def.effect === 'escena-nocturna') nocturneCharge(this, who.map((m) => ({ x: m.f.x, y: m.f.y })), mx, my, level, wind); // author (fxNocturne.ts)
    else if (lastResort) lastResortCharge(this, lastResort, who.map((m) => ({ x: m.f.x, y: m.f.y })), mx, my, level, wind);
    this.fx.ring(mx, my, 34, c2, 360, 3);
    this.fx.label(mx, my - 30, def.name, '#ffe24a');
    sfx('evolve');
    this.time.delayedCall(wind, () => {
      if (this.ended) return;
      // 1.91 (author: some shots flew the opposite way): the rival picked before the wind-up may be gone by now
      if (target.dead) { const t2 = this.nearestEnemy(mx, my, 300); if (!t2) return; target = t2; }
      const a = Math.atan2(target.pos.y - 12 - my, target.pos.x - mx);
      const dmg = comboDamage(def, level, this.mods.damage * this.teamDamageBonus() * this.formationDamage() * this.cfg.perks.damageMult * this.cfg.perks.comboMult * FORMATIONS[this.formation].comboMult * this.formationTactic().combo);
      // 1.76: Fuego cruzado kicks ONE ball, as in the anime; it carries the damage the two balls had
      const cross = def.effect === 'tiro-doble';
      const twin = def.effect === 'ventisca' || def.effect === 'caos';
      const shots = twin ? [-0.12, 0.12] : [0];
      const flight = Math.min(900, Math.hypot(target.pos.x - mx, target.pos.y - my) / 260 * 1000);
      if (def.effect === 'fenix') phoenixFlight(this, mx, my, target.pos.x, target.pos.y - 10, 40 + level * 3, flight);
      if (def.effect === 'campo') { // 1.91 (author): Campo de fuerza is a blow over the area round Jude and Caleb, not a shot
        const R = 110 + level * 8;
        killerFieldsBlast(this, mx, my + 10, 4 + level, R);
        for (const e of this.enemies) {
          if (e.dead) continue;
          const d = Math.hypot(e.pos.x - mx, (e.pos.y - 10 - my) / 0.6); // the field is drawn flattened on the pitch
          if (d < R + e.radius) this.hit(e, dmg, (e.pos.x - mx) / (d || 1) * 140, (e.pos.y - my) / (d || 1) * 140, style, true);
        }
        this.fx.shake(0.007, 260);
        sfx('boom');
        return;
      }
      if (def.effect === 'fuego-total') { // Xavier, Austin and Axel: the wall of fire, wider and longer than the solo one
        const hits = new Set<Enemy>();
        totalWave(this, mx, my, a, 4 + level, 300 + level * 15, 1000, (cx, cy, ang, half) => {
          if (!this.ended) this.sweepBand(mx, my, ang, cx, cy, half, hits, dmg, 140, style);
        });
        this.fx.shake(0.008, 400);
        sfx('kick');
        return;
      }
      if (def.effect === 'tierra' || def.effect === 'tierra-inf') {
        // Fix 1.53 (author): the Earth bursts into comets in every direction, 2 more each combo level (10 to 18)
        earthBurst(this, mx, my - 40, 24 + level * 2);
        this.earthComets(mx, my - 40, 8 + level * 2, dmg * 0.75, 6 + level, 4 + level, a, recipe, 1.5 + level * 0.1);
        this.fx.shake(0.008, 300);
        sfx('kick');
        return;
      }
      for (const off of shots) {
        const ang = a + off, speed = 260;
        const color = twin && off > 0 ? 0x8fe8ff : c1;
        const scale = 1.7 + level * 0.1;
        const aura = this.add.circle(mx, my, 8 * scale, color, 0.4).setDepth(8900).setBlendMode(Phaser.BlendModes.ADD);
        const ball = this.add.image(mx, my, recipe.ballTexture).setScale(scale).setDepth(8901);
        if (cross) crossfireShot(this, ball, level);
        else if (def.effect === 'tiro-rayo') rupturaShot(this, ball, 4 + level);
        else if (def.effect === 'zero') zeroShot(this, ball, 4 + level);
        else if (def.effect === 'superrayo') superrayoShot(this, ball, 4 + level);
        else if (def.effect === 'gungnir') gungnirShot(this, ball, 4 + level);
        else if (def.effect === 'frente') frenteShot(this, ball, 4 + level);
        else if (def.effect === 'ventisca') fireBlizzardShot(this, ball, level, off > 0 ? 'ice' : 'fire'); // v1.5
        // Remate caótico is one ball in the scene: the second one keeps its damage but is not drawn
        else if (def.effect === 'bigbang') animeShot(this, 'bigbang', ball, 4 + level); // Fix 1.51: immense ball and explosion
        else if (def.effect === 'caos') { if (off > 0) { ball.setVisible(false); aura.setVisible(false); } else chaosBreakShot(this, ball, level); }
        else if (COMBO183.has(def.effect)) combo183Shot(this, def.effect as Combo183, ball, level); // 1.83
        else if (COMBO189.has(def.effect)) combo189Shot(this, def.effect as Combo189, ball, level); // 1.88
        else if (def.effect === 'equipo-definitivo') { if (off === 0) ultimateElevenShot(this, ball, level); else { ball.setVisible(false); aura.setVisible(false); } }
        else if (def.effect === 'escena-nocturna') { nocturneShot(this, ball, level); aura.setVisible(false); }
        else if (lastResort) { lastResortShot(this, lastResort, ball, level); aura.setVisible(false); }
        this.projectiles.push({ ball, aura, x: mx, y: my, vx: Math.cos(ang) * speed, vy: Math.sin(ang) * speed, t: 0,
          traj: twin ? 'espiral' : 'recta' as Trajectory, style: twin && off > 0 ? 'hielo' : style,
          // 1.76: Big Bang explodes on the first rival it touches, over the area its explosion is drawn on (it pierced
          // 5-9 rivals first and hit only 46-70 px round the blast, so it rarely seemed to hit in an area)
          damage: cross ? dmg * 2 : dmg, pierce: def.effect === 'bigbang' ? 0 : 4 + level, life: 1700, hits: new Set(), knock: 120, level: 6 + level, explode: true, scale, phase: off * 10,
          dragon: def.effect === 'tiro-dragon', recipe, blast: def.effect === 'bigbang' ? 150 + level * 10 : (40 + level * 6) * (cross ? 1.25 : 1) });
      }
      this.fx.shake(0.003, 120);
      sfx('kick');
    });
  }

  /** 1.76: Víbora de Orión — a dark copy of the shooter appears beside her, hops with her and fades after the kick. */
  private darkClone(m: Member, ms: number) {
    const body = this.cfg.manifest.bodies[m.entry.body] ?? this.cfg.manifest.bodies.field;
    if (!body || !this.textures.exists(headKey(m.entry.id))) return;
    const side = this.rng.frac() < 0.5 ? -1 : 1;
    const clone = new Footballer(this, m.entry, body, m.f.x + side * 20, m.f.y - 2);
    clone.dir = m.f.dir; clone.update(0);
    for (const o of clone.container.list as Phaser.GameObjects.Sprite[]) o.setTint(0x2a0a14);
    clone.container.setAlpha(0).setDepth(m.f.y - 1);
    const glow = this.add.ellipse(m.f.x + side * 20, m.f.y - 12, 22, 34, 0xe0102a, 0.35).setDepth(m.f.y - 2);
    this.tweens.add({ targets: clone.container, alpha: 0.85, duration: 160 });
    clone.hop(this, 9, ms);
    this.time.delayedCall(ms + 200, () => this.tweens.add({ targets: [clone.container, glow], alpha: 0, duration: 260, onComplete: () => { clone.destroy(); glow.destroy(); } }));
  }

  /** Fix 1.53: La Tierra's comets, evenly round the circle, the first one aimed at `aim`; they pierce and explode */
  private earthComets(cx: number, cy: number, n: number, damage: number, level: number, pierce: number, aim: number, recipe: Recipe, scale: number) {
    for (let k = 0; k < n; k++) {
      const ang = aim + (k / n) * Math.PI * 2, speed = 240;
      const aura = this.add.circle(cx, cy, 7 * scale, 0x9fdcff, 0.45).setDepth(8900).setBlendMode(Phaser.BlendModes.ADD);
      const ball = this.add.image(cx, cy, cometTex(this)).setScale(scale * 0.7).setDepth(8901);
      this.projectiles.push({ ball, aura, x: cx, y: cy, vx: Math.cos(ang) * speed, vy: Math.sin(ang) * speed, t: 0, traj: 'recta', style: 'hielo',
        damage, pierce, life: 1300, hits: new Set(), knock: 110, level, explode: true, scale, phase: k, dragon: false, recipe, blast: 26 + level * 3, comet: true });
    }
  }

  private fireShot(m: Member, i: number, ox: number, oy: number) {
    const target = this.nearestEnemy(ox, oy, 260 * this.cfg.perks.rangeMult);
    const s = this.stats(m, i);
    const lv = this.techLevel(m, i);
    const t = this.activeTech(m, i);
    if (!t) return;
    const recipe = m.recipes[i];
    m.cds[i] = s.cooldownMs;
    m.maxCd[i] = s.cooldownMs;
    if (!target) return;
    this.coop?.shot({ name: t.name, element: t.element === null || t.element === undefined ? null : String(t.element), power: t.power ?? 0, rarity: this.fxRarity(m.entry), x: Math.round(ox), y: Math.round(oy), tx: Math.round(target.pos.x), ty: Math.round(target.pos.y - 12), lv });
    this.rec?.event(this.runTime, { k: 'shot', n: t.name, e: t.element === null || t.element === undefined ? null : String(t.element), p: t.power ?? 0, r: this.fxRarity(m.entry), x: Math.round(ox), y: Math.round(oy), tx: Math.round(target.pos.x), ty: Math.round(target.pos.y - 12), lv });
    const style = m.styles[i];
    const traj = m.trajs[i];
    const big = (t.power ?? 0) >= 60;
    // Fix 1.51 (author): Supernova throws 1 sphere, 2 from level 5 and 3 at level 10, each at a different rival
    const nova = animeOf(t.name) === 'supernova';
    const count = nova ? (lv >= 10 ? 3 : lv >= 5 ? 2 : 1) : s.count + (traj === 'multiple' ? 1 : 0);
    const novaTargets = nova ? [...this.enemies].filter((e) => !e.dead).sort((p, q) => Math.hypot(p.pos.x - ox, p.pos.y - oy) - Math.hypot(q.pos.x - ox, q.pos.y - oy)).slice(0, count) : [];
    const base = Math.atan2(target.pos.y - 12 - oy, target.pos.x - ox);
    sfx('kick');
    // release: short burst at the foot
    this.fx.ring(ox, oy, 10 + recipe.tier * 4, STYLE_COLORS[recipe.style][1], 180, 2);
    if (recipe.id === 'dragon' && traj !== 'meteoro') { // the dragon flies with the ball and bites at the target
      const [d1, d2] = STYLE_COLORS[style];
      const flight = Math.min(900, Math.max(250, Math.hypot(target.pos.x - ox, target.pos.y - oy) / s.speed * 1000));
      dragon(this, 'strike', ox, oy, d1, d2, lv, flight, target.pos.x, target.pos.y - 10, big);
    }
    if (recipe.tier >= 2) this.fx.shake(0.0012, 60);
    if (animeOf(t.name) === 'tierra') { // Fix 1.53 (author): the solo La Tierra bursts into 4 + level comets all round
      earthBurst(this, ox, oy - 30, 12 + lv);
      this.earthComets(ox, oy - 30, 4 + lv, s.damage, lv, s.pierce + 1, base, recipe, 1 + lv * 0.05);
      this.fx.shake(0.004, 160);
      return;
    }
    const fuego = fuegoOf(t.name);
    if (fuego === 'supremo') { // white-hot beam that pierces everything on its line, then a starburst round the end
      const reach = Math.min(300, Math.hypot(target.pos.x - ox, target.pos.y - 12 - oy) + 24);
      const tx = ox + Math.cos(base) * reach, ty = oy - 8 + Math.sin(base) * reach;
      const hits = new Set<Enemy>(), dmg = s.damage * (1 + 0.5 * (count - 1));
      supremoShot(this, ox, oy - 8, tx, ty, lv, Math.max(200, reach / (s.speed * 1.8) * 1000), (x0, y0, x1, y1) => {
        if (!this.ended) this.hitSegment(x0, y0, x1, y1, 10 + lv, hits, dmg, base, s.knockback, style);
      }, (x, y, r) => {
        if (this.ended) return;
        for (const e of this.enemies) {
          const d = Math.hypot(e.pos.x - x, e.pos.y - 10 - y);
          if (!e.dead && d < r + e.radius) this.hit(e, dmg * 1.2, (e.pos.x - x) / (d || 1) * s.knockback, (e.pos.y - y) / (d || 1) * s.knockback, style, true);
        }
        this.fx.shake(0.004, 140);
      });
      return;
    }
    if (fuego === 'total') { // a wall of fire as wide as the pitch rolls forward and hurts everything it sweeps (once each)
      const hits = new Set<Enemy>(), dmg = s.damage * 1.8 * (1 + 0.3 * (count - 1));
      this.fx.shake(0.005, 300);
      totalWave(this, ox, oy - 8, base, lv, 260 + lv * 8, 900, (cx, cy, ang, half) => {
        if (!this.ended) this.sweepBand(ox, oy - 8, ang, cx, cy, half, hits, dmg, s.knockback, style);
      });
      m.cds[i] = m.maxCd[i] = s.cooldownMs * 1.5; // the biggest of his shots comes a little less often
      return;
    }
    if (animeOf(t.name) === 'godwind') { // v1.5 (author): Viento celestial is a gust drawing an S, hurting along the way
      const reach = Math.hypot(target.pos.x - ox, target.pos.y - 12 - oy) + 50;
      const tx = ox + Math.cos(base) * reach, ty = oy + Math.sin(base) * reach;
      const ms = Math.max(520, Math.min(1100, reach / s.speed * 1000 * 1.5));
      const hits = new Set<Enemy>(), r = 16 + s.radius * 0.5;
      // every projectile it would have thrown becomes damage of the one gust; each rival is hit once per gust
      const dmg = s.damage * (1 + 0.6 * (count - 1));
      godWindGust(this, ox, oy, tx, ty, lv, ms, (x, y, ang) => {
        if (this.ended) return;
        for (const e of this.enemies) {
          if (e.dead || hits.has(e) || Math.hypot(e.pos.x - x, e.pos.y - 10 - y) > r + e.radius) continue;
          hits.add(e);
          this.hit(e, dmg, Math.cos(ang) * s.knockback, Math.sin(ang) * s.knockback, style);
        }
      });
      return;
    }
    for (let k = 0; k < count; k++) {
      const nt = novaTargets[k % Math.max(1, novaTargets.length)];
      const a = nova && nt ? Math.atan2(nt.pos.y - 12 - oy, nt.pos.x - ox) : base + (k - (count - 1) / 2) * 0.2;
      const scale = (big ? 1.3 : 1) * (1 + (nova ? 0.12 : 0.05) * (lv - 1)) * (1 + recipe.tier * 0.12) * recipe.ballScale; // Fix 1.53: a bigger Supernova also hits wider
      const c1 = recipe.id === 'supernova' ? 0xbfa8ff : STYLE_COLORS[style][0];
      let x = ox, y = oy, vx = Math.cos(a) * s.speed, vy = Math.sin(a) * s.speed;
      let targetY: number | undefined;
      if (traj === 'meteoro') {
        // drops from the sky onto the target
        x = target.pos.x + (k - (count - 1) / 2) * 18; y = target.pos.y - 150; vx = 0; vy = s.speed * 1.3; targetY = target.pos.y - 10;
      }
      const aura = this.add.circle(x, y, 6 * scale, c1, 0.35).setDepth(8900).setBlendMode(Phaser.BlendModes.ADD);
      const ball = this.add.image(x, y, recipe.ballTexture).setScale(scale).setDepth(8901);
      if (signatureOf(t.name) === 'ceniza') { blackAshTrail(this, ball, lv); aura.setFillStyle(0x6a2aa8, 0.3); }
      const nat = natureOf(t.name);
      if (nat) natureShot(this, nat, ball, lv, { x: target.pos.x, y: target.pos.y - 10 }, k === 0);
      const anime = animeOf(t.name);
      if ((k === 0 || anime === 'supernova') && anime && anime !== 'brisa') animeShot(this, anime, ball, lv); // every Supernova sphere has its whirl and eye
      const mv = movieOf(t.name);
      if (mv && k === 0) movieShot(this, mv, ball, lv);
      const vb = victorOf(t.name);
      if (vb && k === 0) victorShot(this, vb, ball, lv);
      if (isSetsuna(t.name) && k === 0) setsunaShot(this, ball, lv);
      if (isCataclysm(t.name) && k === 0) cataclysmShot(this, ball, lv);
      if (isAlmighty(t.name) && k === 0) almightyShot(this, ball, lv);
      const s183 = solo183Of(t.name);
      if (s183 && k === 0) solo183Shot(this, s183, ball, lv);
      const s189 = solo189Of(t.name);
      if (s189 && k === 0) solo189Shot(this, s189, ball, lv);
      // Fix 1.51: Big Bang always explodes, over twice the usual area (its explosion fills the screen)
      const bigBang = anime === 'bigbang';
      this.projectiles.push({ ball, aura, x, y, vx, vy, t: 0, traj, style, damage: s.damage, pierce: bigBang ? 0 : s.pierce, life: 1500,
        hits: new Set(), knock: s.knockback, level: lv, explode: bigBang || big || s.explodes || recipe.tier >= 2, scale, targetY, phase: k * 1.7,
        dragon: recipe.id === 'dragon', recipe, blast: bigBang ? Math.max(140, s.radius * 2.4 + 30) : s.radius }); // 1.76: Big Bang bursts on the first rival
    }
  }

  private updateDash(m: Member, dt: number) {
    const d = m.dash!;
    d.t += dt;
    const p = Math.min(1, d.t / d.dur);
    const e = Phaser.Math.Easing.Cubic.Out(p);
    const fc = m.f.container;
    const n = this.arena.clampToBounds(d.fromX + (d.toX - d.fromX) * e, d.fromY + (d.toY - d.fromY) * e);
    fc.x = n.x; fc.y = n.y;
    m.f.setVelocity(d.toX - d.fromX, d.toY - d.fromY);
    this.fx.trail(d.style, fc.x, fc.y - 10, 0.9);
    for (const en of this.enemies) {
      if (d.hits.has(en)) continue;
      if (Math.hypot(en.pos.x - fc.x, en.pos.y - fc.y) < en.radius + 10) {
        d.hits.add(en); d.chain.add(en);
        this.hit(en, d.dmg, (d.toX - d.fromX) * 0.6, (d.toY - d.fromY) * 0.6, d.style);
      }
    }
    if (p >= 1) {
      if (d.left > 0) {
        // v1.65: the chain only jumps to rivals it has not hit yet; the hops left against one it already hit (a boss)
        // land at once, so the dribbler keeps its damage and goes back to the formation instead of circling it
        let t: Enemy | null = null, bd = 100 * 100;
        for (const en of this.enemies) {
          const q = (en.pos.x - fc.x) ** 2 + (en.pos.y - 12 - (fc.y - 10)) ** 2;
          if (!en.dead && !d.chain.has(en) && q < bd) { bd = q; t = en; }
        }
        if (!t) {
          const last = [...d.chain].find((en) => !en.dead && Math.hypot(en.pos.x - fc.x, en.pos.y - fc.y) < en.radius + 60);
          if (last) { this.hit(last, d.dmg * d.left, 0, 0, d.style); this.fx.burst(d.style, last.pos.x, last.pos.y - 10, 8 + d.left * 2, 40); }
        }
        if (t) {
          const ang = Math.atan2(t.pos.y - fc.y, t.pos.x - fc.x);
          m.dash = { ...d, fromX: fc.x, fromY: fc.y, toX: fc.x + Math.cos(ang) * 70, toY: fc.y + Math.sin(ang) * 70, t: 0, left: d.left - 1, hits: new Set() };
          return;
        }
      }
      m.dash = null; // returns to its formation slot through the normal follow logic
      m.guardUntil = 0;
      m.guardLock = this.runTime + GUARD_LOCKOUT_SEC;
    }
  }

  private updateProjectiles(dt: number) {
    for (const p of this.projectiles) {
      p.life -= dt;
      p.t += dt / 1000;
      p.x += p.vx * dt / 1000;
      p.y += p.vy * dt / 1000;
      let rx = p.x, ry = p.y;
      const l = Math.hypot(p.vx, p.vy) || 1;
      const px = -p.vy / l, py = p.vx / l;
      if (p.traj === 'espiral') {
        const r = 8 + p.level * 1.5;
        rx += px * Math.sin(p.t * 16 + p.phase) * r + (p.vx / l) * Math.cos(p.t * 16 + p.phase) * r * 0.4;
        ry += py * Math.sin(p.t * 16 + p.phase) * r + (p.vy / l) * Math.cos(p.t * 16 + p.phase) * r * 0.4;
      } else if (p.traj === 'onda') {
        rx += px * Math.sin(p.t * 9 + p.phase) * 14;
        ry += py * Math.sin(p.t * 9 + p.phase) * 14;
      }
      p.ball.setPosition(rx, ry).setRotation(p.ball.rotation + (dt / 1000) * 18);
      p.aura.setPosition(rx, ry).setRadius(6 * p.scale + Math.sin(p.t * 30) * 1.5);
      this.fx.trail(p.style, rx, ry, 0.45 + p.level * 0.07);
      if (p.recipe.id === 'supernova') {
        this.fx.segment(rx, ry, Math.floor(p.t * 24) % 2 ? 0xbfa8ff : 0xfff2a8, 2 + p.scale * 2);
        this.fx.trail('energia', rx, ry, 0.8);
      }
      if (p.comet) this.fx.segment(rx, ry, Math.floor(p.t * 30) % 2 ? 0x9fdcff : 0xffffff, 2 + p.scale * 2);
      if (p.dragon) this.fx.segment(rx, ry, STYLE_COLORS[p.style][(Math.floor(p.t * 30) % 2) as 0 | 1], 3 + p.scale * 2);
      if (p.style === 'rayo' && Math.random() < 0.08) this.fx.lightning(rx, ry, rx + Phaser.Math.Between(-14, 14), ry + Phaser.Math.Between(-14, 14));
      if (p.targetY !== undefined && ry >= p.targetY) {
        this.explode(p, rx, ry, true);
        p.life = 0;
        continue;
      }
      for (const e of this.enemies) {
        if (p.hits.has(e) || e.dead) continue;
        if (Math.hypot(e.pos.x - rx, e.pos.y - 12 - ry) < e.radius + 5 * p.scale) {
          p.hits.add(e);
          this.hit(e, p.damage, (p.vx / l) * p.knock, (p.vy / l) * p.knock, p.style, true);
          // 1.91 (author: Rizo de dragón, Orbe de Perseo... did no area damage): an area shot bursts where it first lands,
          // not at the end of its flight (often off screen); it keeps piercing after
          if (p.explode && !p.exploded) this.explode(p, rx, ry, false);
          this.fx.burst(p.style, rx, ry, 4 + p.level, 70);
          if (p.style === 'rayo' && p.level >= 3) {
            const chain = this.nearestOther(e, 70);
            if (chain) { this.fx.lightning(rx, ry, chain.pos.x, chain.pos.y - 12); this.hit(chain, p.damage * 0.5, 0, 0, 'rayo'); }
          }
          if (p.hits.size > p.pierce) {
            if (p.explode && !p.exploded) this.explode(p, rx, ry, false);
            p.life = 0;
            break;
          }
        }
      }
    }
    this.projectiles = this.projectiles.filter((p) => {
      if (p.life > 0) return true;
      if (p.explode && !p.exploded) this.explode(p, p.ball.x, p.ball.y, false); // a spent shot still lands its finish
      p.ball.destroy();
      p.aura.destroy();
      return false;
    });
  }

  private nearestOther(e: Enemy, range: number): Enemy | null {
    let best: Enemy | null = null, bd = range;
    for (const o of this.enemies) {
      if (o === e || o.dead) continue;
      const d = Math.hypot(o.pos.x - e.pos.x, o.pos.y - e.pos.y);
      if (d < bd) { bd = d; best = o; }
    }
    return best;
  }

  private explode(p: Projectile, x: number, y: number, fromSky: boolean) {
    p.exploded = true;
    const r = p.blast + (fromSky ? 8 : 0);
    impact(this.fx, p.recipe, x, y, r, p.level);
    // Fix 1.12: the stage of the technique shows in its impact. Evolved (Lv 4+): a second shock ring; G2/G3 (Lv 7+):
    // a flash and stronger rays; maximum (Lv 10): a column of light, a heavier shake and a brief hitstop
    const [c1, c2] = STYLE_COLORS[p.style];
    if (p.level >= 4) this.fx.ring(x, y, r * 1.5, c2, 420, 2);
    if (p.level >= 7) { this.fx.flashDisc(x, y, r * 0.8, c1, 200); this.fx.rays(x, y, 10, r * 1.3, c2, 300); }
    if (p.level >= 10) { this.fx.pillar(x, y + 6, c2, 10); this.hitstop(55); }
    if (p.level >= 7 || fromSky || p.recipe.tier >= 2) this.fx.shake(0.0012 + p.level * 0.00015, 80);
    sfx('boom');
    for (const e of this.enemies) {
      if (e.dead) continue;
      const d = Math.hypot(e.pos.x - x, e.pos.y - 10 - y);
      if (d < r + e.radius) this.hit(e, p.damage * (fromSky ? 1 : 0.6), (e.pos.x - x) / (d || 1) * 80, (e.pos.y - y) / (d || 1) * 80, p.style);
    }
  }

  // ------------------------------------------------------------- enemies
  private units() { return new Map(this.cfg.manifest.units.map((u) => [u.id, u])); }

  private spawnEnemy(unit: UnitInfo, kind: UnitInfo['kind'], hpMult = 1, scale = 1, place?: { x: number; y: number }) {
    const cam = this.cameras.main;
    const cap = this.members[0].f;
    // just outside the view, never so close that a spawn lands on top of the squad
    const r = Math.max(190, Math.hypot(cam.width, cam.height) / cam.zoom / 2 + 20);
    const at = place ?? this.arena.randomCellAround(cap.x, cap.y, r, r + 140, this.rng);
    if (!at) return null;
    const sprite = this.add.sprite(at.x, at.y, `unit:${unit.id}`, 0)
      .setOrigin(unit.originX / unit.frameW, unit.originY / unit.frameH).setScale(scale);
    const st = unit.stats ?? {};
    const minutes = this.runTime / 60;
    const R = this.rank;
    // plain rivals can come as elites (tough, golden, better drop) or runners (fast, fragile, icy tint)
    const roll = kind === 'enemy' || kind === 'creature' ? this.rng.frac() : 1;
    const ramp = variantRamp(this.runTime);
    let variant: Enemy['variant'];
    let bar = 0;
    for (const [id, chance] of [['elite', (R.elite + (this.endless ? endlessPhase(this.endlessMin()).elite : 0)) * ramp], ['runner', R.runner * Math.min(1, this.runTime / 40)], ['shooter', R.shooter * ramp], ['flanker', R.flanker * ramp], ['bomber', R.bomber * ramp], ['tank', R.tank * ramp]] as [NonNullable<Enemy['variant']>, number][]) {
      bar += chance;
      if (roll < bar) { variant = id; break; }
    }
    const pick = (t: Partial<Record<string, number>>) => t[variant ?? ''];
    const vHp = pick({ elite: 3.2, runner: 0.5, shooter: 0.8, flanker: 1, bomber: 0.7, tank: 5.5 }) ?? 1;
    const vSpeed = pick({ elite: 1.12, runner: 1.75, shooter: 0.9, flanker: 1.3, bomber: 1.2, tank: 0.68 }) ?? 1;
    const tint = pick({ elite: 0xffe08a, runner: 0xb8f0ff, shooter: 0xffa8c8, flanker: 0xb8ffb0, bomber: 0xff9050, tank: 0x8f9fd0 });
    if (tint !== undefined) sprite.setTint(tint);
    if (variant === 'elite') sprite.setScale(scale * 1.18);
    if (variant === 'tank') sprite.setScale(scale * 1.3);
    const scaling = this.endlessScaleNow();
    const stretch = finalStretch(kind === 'boss' ? 0 : this.runTime / this.cfg.map.durationSec); // the boss keeps its own balance
    const baseHp = 8 + ((st.body ?? 30) + (st.guts ?? 30)) / 14;
    // Fix 1.24: health grows faster as the minutes pass (quadratic term), so the rivals of the last minutes are much tougher
    const tier = mapTierScale(this.cfg.map.tier); // v1.7: later arenas on the map path have tougher rivals
    const hp = Math.round(baseHp * (1 + minutes * 0.6 + minutes * minutes * 0.07) * hpMult * R.hp * vHp * scaling.hp * stretch.hp * tier.hp);
    const e: Enemy = {
      sprite, unit, kind, hp, maxHp: hp, speed: (28 + (st.speed ?? 30) * 0.22) * (kind === 'boss' ? 0.8 : 1) * R.speed * vSpeed * scaling.speed,
      // Fix 1.13: rivals hit about 55% harder and keep growing until minute 12, so health is something to look after
      // Fix 1.24: they hit harder from the start and keep growing (more slowly after minute 12)
      damage: Math.round((4 + Math.min(minutes, 12) * 2.1 + Math.max(0, minutes - 12) * 0.8) * (kind === 'boss' ? 2.5 : kind === 'miniboss' ? 2 : 1) * R.damage * (variant === 'elite' || variant === 'tank' ? 1.5 : 1) * scaling.damage * stretch.damage * tier.damage),
      animTime: this.rng.between(0, 500), dir: 4, hitCd: 0, knockX: 0, knockY: 0,
      radius: 7 * scale * (variant === 'elite' ? 1.18 : variant === 'tank' ? 1.3 : 1), dead: false, pos: sprite, slowUntil: 0, variant, side: this.rng.frac() < 0.5 ? -1 : 1,
      patternCd: kind === 'boss' ? 3 : kind === 'miniboss' ? 5 : undefined,
    };
    if (kind === 'boss' || kind === 'miniboss') {
      this.fx.ring(at.x, at.y - 10, 40, 0xff4f4f, 600, 3);
      this.fx.shake(0.006, 250);
      sfx('boom');
    }
    e.id = this.nextEnemyId++;
    this.enemies.push(e);
    this.coop?.onSpawn(e);
    this.rec?.spawn(this.runTime, e);
    return e;
  }

  private spawn(dt: number) {
    if (this.cfg.training) { this.trainingSpawn(dt); return; }
    const { map } = this.cfg;
    const units = this.units();
    const frac = this.runTime / map.durationSec;
    const extra = [0.25, 0.55, 0.85].slice(0, this.rank.extraMinibosses);
    [0.4, 0.7, ...extra].sort((a, b) => a - b).forEach((at, i) => {
      if (frac >= at && this.minibossesSpawned <= i && map.minibosses.length) {
        this.minibossesSpawned++;
        const u = units.get(map.minibosses[this.rng.between(0, map.minibosses.length - 1)]);
        if (u) this.spawnEnemy(u, 'miniboss', 14, 1.5);
      }
    });
    if (!this.bossWarned && map.boss !== null && this.runTime >= map.durationSec - BOSS_WARN_SEC) { this.bossWarned = true; this.bossWarning(); }
    if (frac >= 1 && !this.bossSpawned) {
      const u = map.boss !== null ? units.get(map.boss) : undefined;
      if (u) this.boss = this.spawnEnemy(u, 'boss', 32, 2.1);
      if (this.boss) this.bossEntrance(this.boss, false);
      // no free spot this frame: try again next one instead of ending the run
      if (this.boss || !u) this.bossSpawned = true;
      if (!u) this.finish(true);
    }
    const wave = waveIntensity(this.runTime);
    if (frac >= FINAL_STRETCH_FROM && !this.stretchAnnounced) { this.stretchAnnounced = true; this.banner('¡RECTA FINAL!', '#ff5a5a'); }
    if (wave.phase !== this.wavePhase) {
      if (wave.phase === 'presion' && !this.boss) this.banner('¡OLEADA!', '#ff8a5a');
      if (wave.phase === 'respiro' && this.wavePhase === 'presion' && !this.boss) this.banner('Respiro', '#8fe8ff');
      this.wavePhase = wave.phase;
    }
    const interval = Math.max(0.15, 1.3 - Math.min(1, frac) * 1.1) * (this.boss ? 2.5 : 1) * this.rank.spawnInterval / wave.rate / this.endlessScaleNow().spawn / (this.boss ? 1 : finalStretch(frac).rate);
    this.spawnAcc += dt / 1000;
    while (this.spawnAcc > interval) {
      this.spawnAcc -= interval;
      if (this.enemies.length >= MAX_ENEMIES || !map.enemies.length) break;
      const burst = burstSize(Math.min(1, frac), this.members.length >= 5, this.rank.burst, this.rng.frac());
      for (let i = 0; i < burst; i++) {
        const u = units.get(map.enemies[this.rng.between(0, map.enemies.length - 1)]);
        if (u) this.spawnEnemy(u, u.kind === 'creature' ? 'creature' : 'enemy');
      }
    }
  }

  private updateEnemies(dt: number) {
    const shield = this.shield();
    const taken = FORMATIONS[this.formation].damageTakenMult;
    const cap = this.members[0].f;
    for (const e of this.enemies) {
      // ONLY THE CAPTAIN TAKES DAMAGE: rivals chase the captain, and teammates are invulnerable support that bodies
      // rivals away (a small push), never a target and never a way to lose health
      let tx = cap.x, ty = cap.y;
      const bd = (cap.x - e.pos.x) ** 2 + (cap.y - e.pos.y) ** 2;
      const pc = this.coop?.partnerCaptain(); // pre-2.0: the partner's captain when he is closer (or the host is down)
      if (pc && (this.down || (pc.x - e.pos.x) ** 2 + (pc.y - e.pos.y) ** 2 < bd)) { tx = pc.x; ty = pc.y; }
      const chasing = tx !== cap.x || ty !== cap.y;
      const target: Member = this.members[0];
      const guarded = this.members[0].guardUntil > this.runTime && bd < (12 + e.radius) ** 2; // the captain's dribble
      if (guarded) this.guardBlocks++;
      for (let k = 1; k < this.members.length; k++) {
        const m = this.members[k];
        const dx = e.pos.x - m.f.x, dy = e.pos.y - m.f.y, d2 = dx * dx + dy * dy;
        if (d2 < (10 + e.radius) ** 2 && e.kind !== 'boss') { const [nx, ny] = norm(dx, dy); e.knockX += nx * 18; e.knockY += ny * 18; }
      }
      const dist = chasing ? Math.hypot(tx - e.pos.x, ty - e.pos.y) : Math.sqrt(bd);
      let [fx, fy] = chasing || bd < 70 * 70 ? norm(tx - e.pos.x, ty - e.pos.y) : this.arena.flowDir(e.pos.x, e.pos.y, tx, ty);
      // flankers run for the spot ahead of the captain and to one side, so they cut the way instead of chasing it
      if (e.variant === 'flanker' && dist > 70 && dist < 300) {
        const lead = Math.min(1, dist / 160);
        [fx, fy] = norm(tx + this.capVx * 0.8 * lead + -fy * e.side! * 70 - e.pos.x, ty + this.capVy * 0.8 * lead + fx * e.side! * 70 - e.pos.y);
      }
      if (e.variant === 'shooter' && dist < 110) { fx = -fx * 0.7; fy = -fy * 0.7; }
      const held = this.freezeUntil <= this.runTime && (e.variant === 'shooter' || e.variant === 'bomber') && this.rivalBehaviour(e, dist, dt);
      if (e.dead) continue;
      if (e.poison && e.poison.until > this.runTime) {
        e.poison.acc += e.poison.dps * dt / 1000;
        if (e.poison.acc >= 1) { const v = Math.floor(e.poison.acc); e.poison.acc -= v; this.hit(e, v, 0, 0, 'tierra'); if (e.dead) continue; }
      }
      const webbed = (e.webUntil ?? 0) > this.runTime && e.kind !== 'boss'; // bosses tear the web: only slowed
      const spd = this.freezeUntil > this.runTime || held || webbed ? 0 : e.speed * (e.slowUntil > this.runTime ? 0.6 : 1);
      if (this.lure && this.lure.until > this.runTime) { tx = this.lure.x; ty = this.lure.y; }
      this.arena.move(e.sprite, (fx * spd + e.knockX) * dt / 1000, (fy * spd + e.knockY) * dt / 1000, 4);
      e.knockX *= 0.86; e.knockY *= 0.86;
      e.dir = directionFromVector(fx, fy, e.dir);
      e.animTime += dt;
      const anim = e.unit.animations.find((a) => a.index === 8 + e.dir) ?? e.unit.animations.find((a) => a.index === e.dir);
      if (anim) {
        const { frame } = frameAt(anim.frames, e.animTime);
        e.sprite.setFrame(frame.f).setFlipX(anim.mirror);
      }
      e.sprite.setDepth(e.pos.y);
      e.hitCd -= dt;
      // contact with the captain hurts; teammates are never hurt
      if (!guarded && this.freezeUntil <= this.runTime && Math.sqrt(bd) < 12 + e.radius && e.hitCd <= 0
        && this.hurtCaptain(e.damage, { by: e.unit.name, attack: e.kind === 'boss' || e.kind === 'miniboss' ? 'choque' : 'entrada' }, shield, taken)) {
        e.hitCd = 900;
        // the rival bounces off whoever it hit, which also makes the contact readable
        const [nx, ny] = norm(e.pos.x - target.f.x, e.pos.y - target.f.y);
        e.knockX += nx * 90; e.knockY += ny * 90;
      }
      if (e.patternCd !== undefined) this.bossPattern(e, dt);
    }
    this.enemies = this.enemies.filter((e) => !e.dead);
  }

  /**
   * The only way to lose health: a hit on the CAPTAIN. Teammates are invulnerable (they have no health and never pass
   * damage on). `src` records the real source for the defeat screen. False while the i-frames last.
   */
  private hurtCaptain(raw: number, src: HitSource, shield = this.shield(), taken = FORMATIONS[this.formation].damageTakenMult) {
    const target = this.members[0];
    if (this.runTime < this.invulnUntil || this.ended || this.down) return false;
    if (this.buffOn('barrera')) { // Barrera: this hit does nothing, and the barrier is gone
      this.buffs.delete('barrera');
      this.invulnUntil = this.runTime + 0.3;
      this.fx.ring(target.f.x, target.f.y - 10, 30, 0x8fe8ff, 300, 3);
      this.fx.label(target.f.x, target.f.y - 30, '¡Bloqueado!', '#8fe8ff');
      return false;
    }
    const bossHit = !['entrada', 'disparo', 'explosión', 'lluvia de balones'].includes(src.attack);
    if (bossHit) raw *= this.cfg.perks.bossTakenMult * (this.buffOn('proteccion') ? 0.6 : 1);
    if (this.buffOn('apuesta')) raw *= 1.25;
    taken *= this.formationTactic().taken;
    if (this.cfg.coach?.formation?.id === this.formation) taken *= 1 - this.cfg.coach.formation.taken; // pre-2.0: his formation
    this.invulnUntil = this.runTime + 0.3;
    const gloves = this.members.some((m) => m.entry.position === 'GK') ? 1 - this.cfg.perks.gloveReduction : 1;
    const scaled = raw * capTaken((1 - shield) * gloves * statTaken(target.entry) * (1 + this.talents().taken) * this.cfg.perks.damageTakenMult * (this.buffOn('escudo') ? 1 - SHIELD_REDUCTION : 1)) * taken;
    // Fix 1.31: flat negation (Blindaje + Equipación reforzada), never more than half of the hit
    const flat = Math.min((this.cfg.perks.flatArmor ?? 0) + this.mods.armor, scaled * 0.5);
    const dmg = Math.max(1, Math.round(scaled - flat));
    this.hp -= dmg;
    this.hurtAt = this.runTime;
    this.lastHit = { ...src, dmg, at: this.runTime };
    this.rec?.event(this.runTime, { k: 'hurt', by: src.by, atk: src.attack, dmg });
    this.hitsTaken.capitan = (this.hitsTaken.capitan ?? 0) + 1;
    if (this.cfg.settings.flashes) target.f.flash();
    if (this.cfg.settings.damageNumbers) this.fx.label(target.f.x, target.f.y - 30, `-${dmg}`, '#ff6a6a');
    sfx('hurt');
    return true;
  }

  /** Teammate touching a point, if any: the captain can be hurt there, a follower only blocks (shots). */
  /** Captain inside a circle (hazards, bombs). */
  private captainIn(x: number, y: number, r: number, squash = 1.2) {
    const c = this.members[0].f;
    return Math.hypot(c.x - x, (c.y - y) * squash) < r;
  }

  /** Attack set of a boss, miniboss or rival, resolved once. */
  private kitOf(e: Enemy) {
    if (!e.kit) {
      const entry = this.cfg.manifest.roster.find((p) => p.name === e.unit.name || (p as { nameEn?: string }).nameEn === e.unit.name);
      e.kit = bossKit(e.unit.name, entry?.element === null || entry?.element === undefined ? null : String(entry.element));
    }
    return e.kit;
  }

  /**
   * Boss, miniboss and rival attacks. Each has its own warning on the ground before it hits (see the cases), so all of
   * them can be avoided. Which ones are available depends on the phase, from remaining health; in late endless the
   * phase is forced up so recurring bosses combine their attacks.
   */
  private bossPattern(e: Enemy, dt: number) {
    const s = dt / 1000;
    // pre-2.0: in co-op the boss goes for the nearer captain (the partner's when the host is down)
    const own = this.members[0].f, pc = this.coop?.partnerCaptain();
    const cap = pc && (this.down || Math.hypot(pc.x - e.pos.x, pc.y - e.pos.y) < Math.hypot(own.x - e.pos.x, own.y - e.pos.y)) ? pc : own;
    const kit = this.kitOf(e);
    this.hitSrc = { by: e.unit.name, attack: (e.pattern && kit.names[e.pattern.kind]) || ATTACK_LABEL[e.pattern?.kind ?? 'carga'] };
    const main = e.kind === 'boss' || !!e.rival;
    const forced = this.endless ? Math.floor(endlessPhase(this.endlessMin()).id / 2) : 0;
    const phase = Math.max(forced, main ? bossPhase(e.hp, e.maxHp) : Math.min(1, bossPhase(e.hp, e.maxHp)));
    if (main && phase > (e.phase ?? 0)) {
      e.phase = phase;
      this.bossRoar(e, kit, phase);
    }
    // 1.82: below a quarter of its health the boss is enraged: a red aura pulses around it
    if (main && e.hp < e.maxHp * 0.25 && this.runTime >= (this.enragedFx.get(e) ?? 0)) {
      this.enragedFx.set(e, this.runTime + 0.55);
      this.fx.ring(e.pos.x, e.pos.y - 8, 26 * e.sprite.scale, 0xff2a2a, 520, 3);
    }
    if (!e.pattern) {
      e.patternCd! -= s;
      if (e.patternCd! > 0 || this.freezeUntil > this.runTime) return;
      const list = kit.phases[phase].filter((a) => a !== e.lastAttack);
      const kind = (list.length ? list : kit.phases[phase])[this.rng.between(0, Math.max(0, (list.length || kit.phases[phase].length) - 1))];
      e.lastAttack = kind;
      const [dx, dy] = norm(cap.x - e.pos.x, cap.y - e.pos.y);
      const name = kit.names[kind];
      if (name) this.fx.label(e.pos.x, e.pos.y - 34 * e.sprite.scale, name, '#ffd27a');
      sfx('whoosh');
      const rot = Math.atan2(dy, dx);
      let gfx: Phaser.GameObjects.GameObject | undefined;
      if (kind === 'carga' || kind === 'majin') {
        const len = kind === 'carga' ? 190 : 240, w = kind === 'carga' ? 22 * e.sprite.scale : 84;
        const lane = this.add.rectangle(e.pos.x + dx * len / 2, e.pos.y - 8 + dy * len / 2, len, w, kit.color, 0.2).setRotation(rot).setStrokeStyle(2, 0xff5050, 0.9).setDepth(-9800);
        this.tweens.add({ targets: lane, alpha: 0.55, duration: 160, yoyo: true, repeat: 3 });
        if (kind === 'majin') this.fx.entity(this.rng.frac() < 0.5 ? 'majin' : 'demonio', e.pos.x, e.pos.y + 6, 1300, e.kind === 'boss');
        gfx = lane;
      } else if (kind === 'abanico') {
        const c = this.add.container(e.pos.x, e.pos.y - 8).setDepth(-9800);
        for (const off of [-0.45, 0, 0.45]) c.add(this.add.rectangle(0, 0, 200, 6, kit.color, 0.35).setOrigin(0, 0.5).setRotation(rot + off));
        gfx = c;
      } else {
        const ring = this.add.circle(e.pos.x, e.pos.y - 10, 18 * e.sprite.scale, kit.color, 0.15).setStrokeStyle(3, kit.color).setDepth(e.pos.y + 1);
        this.tweens.add({ targets: ring, scale: 1.8, alpha: 0, duration: 650 });
        gfx = ring;
      }
      e.pattern = { kind, t: 0, dx, dy, gfx, n: 0 };
      this.coop?.telegraph({ k: kind, x: Math.round(e.pos.x), y: Math.round(e.pos.y), dx: +dx.toFixed(3), dy: +dy.toFixed(3), s: +e.sprite.scale.toFixed(2), c: kit.color, dmg: e.damage, by: e.unit.name });
      return;
    }
    const p = e.pattern;
    p.t += s;
    const shot = Math.round(e.damage * 0.6);
    switch (p.kind) {
      case 'carga':
        if (p.t < 0.75) { e.knockX *= 0.5; e.knockY *= 0.5; return; } // wind-up: the boss plants its feet
        if (p.t < 1.25) { // the charge itself: fast and straight, along the lane that was shown
          this.arena.move(e.sprite, p.dx * 330 * s, p.dy * 330 * s, 4);
          this.fx.trail('energia', e.pos.x, e.pos.y - 10, 0.9);
          return;
        }
        break;
      case 'radial':
        if (p.t < 0.65) return;
        for (let k = 0, n = (e.kind === 'boss' ? 12 : 8) + phase * 2; k < n; k++) {
          const a = (k / n) * Math.PI * 2 + this.rng.frac() * 0.3;
          this.enemyShot(e.pos.x, e.pos.y - 12, Math.cos(a) * 105, Math.sin(a) * 105, shot);
        }
        sfx('kick');
        break;
      case 'abanico': {
        if (p.t < 0.6) return;
        const n = 5 + phase * 2, base = Math.atan2(p.dy, p.dx);
        for (let k = 0; k < n; k++) { const a = base + (k / (n - 1) - 0.5) * 0.9; this.enemyShot(e.pos.x, e.pos.y - 12, Math.cos(a) * 150, Math.sin(a) * 150, shot); }
        sfx('kick');
        break;
      }
      case 'espiral':
        if (p.t < 0.55) return;
        if (p.t < 2.3) {
          p.n = (p.n ?? 0) + s;
          if (p.n >= 0.11) { // two arms that turn: there is always room between them
            p.n = 0;
            const a = p.t * 2.6;
            for (const o of [0, Math.PI]) this.enemyShot(e.pos.x, e.pos.y - 12, Math.cos(a + o) * 100, Math.sin(a + o) * 100, shot);
          }
          return;
        }
        break;
      case 'lluvia':
        for (let k = 0, n = 5 + phase * 2; k < n; k++) {
          const a = this.rng.frac() * Math.PI * 2, d = k === 0 ? this.rng.between(10, 50) : this.rng.between(40, 170);
          this.dropHazard(cap.x + Math.cos(a) * d, cap.y + Math.sin(a) * d * 0.8, e.damage, { ...this.hitSrc });
        }
        break;
      case 'onda':
        if (p.t < 0.8) return;
        this.addShock(e.pos.x, e.pos.y, e.damage, this.kitOf(e).color);
        if (phase === 2 && (p.n ?? 0) < 1) { p.n = 1; p.t = 0.45; return; } // last phase: a second wave right after
        break;
      case 'invocacion': {
        if (p.t < 0.6) return;
        const units = this.cfg.map.enemies.map((id) => this.units().get(id)).filter((u): u is UnitInfo => !!u);
        for (let k = 0, n = 3 + phase * 2; k < n && units.length && this.enemies.length < MAX_ENEMIES - 10; k++) {
          const m = this.spawnEnemy(units[this.rng.between(0, units.length - 1)], 'enemy');
          if (m) { const a = (k / n) * Math.PI * 2; m.sprite.setPosition(e.pos.x + Math.cos(a) * 44, e.pos.y + Math.sin(a) * 34); this.fx.implode(m.pos.x, m.pos.y - 10, 26, this.kitOf(e).color, 260); }
        }
        break;
      }
      case 'majin': {
        if (p.t < 1.05) { e.knockX *= 0.5; e.knockY *= 0.5; return; }
        {
          const m = this.members[0];
          const rx = m.f.x - e.pos.x, ry = m.f.y - 8 - e.pos.y, along = rx * p.dx + ry * p.dy, side = Math.abs(rx * p.dy - ry * p.dx);
          if (along > 0 && along < 240 && side < 44) this.hurtCaptain(e.damage * 1.5, this.hitSrc);
        }
        this.fx.shake(0.008, 220);
        this.fx.flashDisc(e.pos.x + p.dx * 120, e.pos.y - 8 + p.dy * 120, 90, this.kitOf(e).color, 300);
        sfx('boom');
        break;
      }
    }
    p.gfx?.destroy();
    e.pattern = undefined;
    e.patternCd = kit.tempo[phase] * this.rank.bossTempo * (main ? 1 : 1.6);
  }

  /** Expanding wave with a gap that the player can run through. */
  private addShock(x: number, y: number, damage: number, color: number) {
    if (this.shocks.length >= 4) return;
    this.shocks.push({ x, y, r: 16, gap: this.rng.frac() * Math.PI * 2, damage, color, g: this.add.graphics().setDepth(-9700), hit: false, src: { ...this.hitSrc } });
    this.coop?.shock(x, y, damage, color, this.hitSrc.by);
    sfx('boom');
  }

  private updateShocks(dt: number) {
    const c = this.members[0].f;
    for (const w of this.shocks) {
      w.r += 165 * dt / 1000;
      w.g.clear().lineStyle(7, w.color, 0.75).beginPath().arc(w.x, w.y, w.r, w.gap + SHOCK_GAP / 2, w.gap - SHOCK_GAP / 2 + Math.PI * 2).strokePath();
      const d = Math.hypot(c.x - w.x, c.y - w.y);
      const off = Math.abs(Phaser.Math.Angle.Wrap(Math.atan2(c.y - w.y, c.x - w.x) - w.gap));
      if (!w.hit && Math.abs(d - w.r) < 11 && off > SHOCK_GAP / 2) { w.hit = true; this.hurtCaptain(w.damage, w.src); }
    }
    this.shocks = this.shocks.filter((w) => { if (w.r < 300) return true; w.g.destroy(); return false; });
  }

  /** Own behaviour of the special rivals; returns true while the rival must not walk this frame. */
  private rivalBehaviour(e: Enemy, dist: number, dt: number) {
    const s = dt / 1000;
    if (e.variant === 'shooter') {
      e.fireCd = (e.fireCd ?? 1 + this.rng.frac() * 2) - s;
      if (e.aim) { // the red line stays still for 0.6 s: there is time to step aside
        e.aim.t += s;
        if (e.aim.t >= 0.6) {
          this.hitSrc = { by: e.unit.name, attack: 'disparo' };
          this.enemyShot(e.pos.x, e.pos.y - 12, e.aim.dx * 170, e.aim.dy * 170, e.damage);
          e.aim.gfx.destroy(); e.aim = undefined; e.fireCd = 3.4;
          sfx('kick');
        }
        return true;
      }
      if (e.fireCd <= 0 && dist < 240 && this.aimLines < 10) {
        const [dx, dy] = norm(this.members[0].f.x - e.pos.x, this.members[0].f.y - e.pos.y);
        e.aim = { t: 0, dx, dy, gfx: this.add.rectangle(e.pos.x + dx * 120, e.pos.y - 10 + dy * 120, 240, 4, 0xff4040, 0.55).setRotation(Math.atan2(dy, dx)).setDepth(-9750) };
        return true;
      }
      return dist < 120;
    }
    if (e.variant === 'bomber') {
      if (e.fuse) {
        e.fuse.t += s;
        e.sprite.setTint(Math.floor(e.fuse.t * 8) % 2 ? 0xffffff : 0xff5020);
        if (e.fuse.t >= 0.95) {
          if (this.captainIn(e.pos.x, e.pos.y, BOMB_RADIUS)) this.hurtCaptain(e.damage * 1.6, { by: e.unit.name, attack: 'explosión' });
          impact(this.fx, recipeFor({ name: 'Balón', element: 'Fuego', power: 40 }, 'comun'), e.pos.x, e.pos.y, BOMB_RADIUS, 3);
          sfx('boom');
          this.kill(e, 'fuego');
        }
        return true;
      }
      if (dist < 42) {
        e.fuse = { t: 0, gfx: this.add.circle(e.pos.x, e.pos.y, BOMB_RADIUS, 0xff5020, 0.2).setStrokeStyle(2, 0xff8040, 0.9).setDepth(-9750) };
        return true;
      }
    }
    return false;
  }

  /** Waves that close in from every side but one, and a push for those who stand still for too long. */
  private updatePressure() {
    const c = this.members[0].f;
    if (Math.hypot(c.x - this.campX, c.y - this.campY) > 46) { this.campX = c.x; this.campY = c.y; this.campSince = this.runTime; this.campWarned = false; }
    if (this.runTime - this.campSince > 6 && this.runTime >= this.nextCampHit && !this.ended) {
      this.nextCampHit = this.runTime + (this.rank.id === 'C' ? 4 : 2.6);
      if (!this.campWarned) { this.campWarned = true; this.banner('¡No te quedes quieto!', '#ffb050'); }
      for (let k = 0; k < 2; k++) {
        const x = c.x + this.rng.between(-14, 14), y = c.y + this.rng.between(-10, 10);
        // pre-2.0: the guest asks the host, who drops it for both screens
        if (this.coop?.role === 'guest') this.coop.askHazard(x, y); else this.dropHazard(x, y, undefined, { by: '', attack: 'lluvia de balones', still: true });
      }
    }
    const every = this.endless ? endlessPhase(this.endlessMin()).surroundEvery : this.rank.surroundEvery;
    // pre-2.0 (BUG-F44BE9B4): rivals are the host's, so the guest never surrounds himself — his rivals were his alone
    // and the host never saw them; the host closes the circle round each captain still standing instead
    if (!this.boss && every && this.runTime >= this.nextSurround && this.runTime > 55 && this.coop?.role !== 'guest') {
      this.nextSurround = this.runTime + every;
      if (!this.down) { this.surround(c); this.banner('¡Te rodean!', '#ff8a5a'); }
      const pc = this.coop?.partnerCaptain();
      if (pc && (this.down || Math.hypot(pc.x - c.x, pc.y - c.y) > 160)) { this.surround(pc); this.coop?.say('¡Te rodean!', '#ff8a5a'); }
    }
  }

  /** A ring of rivals round a captain, with an opening of about 80 degrees to escape through. */
  private surround(c: { x: number; y: number }) {
    const units = this.cfg.map.enemies.map((id) => this.units().get(id)).filter((u): u is UnitInfo => !!u);
    const n = Math.min(10 + RANK_ORDER.indexOf(this.rank.id) * 3 + Math.floor(this.runTime / 60), MAX_ENEMIES - this.enemies.length);
    const cam = this.cameras.main, r = Math.min(cam.width, cam.height) / cam.zoom / 2 + 30, gap = this.rng.frac() * Math.PI * 2;
    for (let k = 0; k < n && units.length; k++) {
      const a = gap + 0.7 + (k / n) * (Math.PI * 2 - 1.4);
      const x = c.x + Math.cos(a) * r, y = c.y + Math.sin(a) * r;
      if (!this.arena.walkableAt(x, y, 6)) continue;
      this.spawnEnemy(units[this.rng.between(0, units.length - 1)], 'enemy', 1, 1, { x, y });
    }
  }

  private enemyShot(x: number, y: number, vx: number, vy: number, damage: number) {
    if (this.shots.length >= 120) return; // long endless runs: a hard cap keeps the frame rate stable
    const img = this.add.image(x, y, 'fx:ball').setTint(0xff7a5a).setDepth(8800);
    this.shots.push({ img, x, y, vx, vy, life: 4, damage, src: { ...this.hitSrc } });
    this.coop?.enemyShot(x, y, vx, vy, damage, this.hitSrc.by);
  }

  private updateShots(dt: number) {
    const s = dt / 1000;
    for (const b of this.shots) {
      b.life -= s;
      b.x += b.vx * s; b.y += b.vy * s;
      b.img.setPosition(b.x, b.y).setRotation(b.img.rotation + s * 10);
      // balls go through teammates (they never block): only the captain can be hit. Formations only change stats.
      const cap = this.members[0];
      if (cap.guardUntil <= this.runTime && Math.hypot(cap.f.x - b.x, cap.f.y - 10 - b.y) < 11 && this.hurtCaptain(b.damage, b.src)) { this.fx.burst('fuego', b.x, b.y, 6, 40); b.life = 0; }
    }
    this.shots = this.shots.filter((b) => { if (b.life > 0) return true; b.img.destroy(); return false; });
  }

  /** One falling ball: warned for 1.1 s by its shadow and ring. */
  private dropHazard(x: number, y: number, damage?: number, src: HitSource = { by: '', attack: 'lluvia de balones' }) {
    if (this.hazards.length >= 40) return;
    const r = 26;
    const shadow = this.add.ellipse(x, y, 4, 3, 0x000000, 0.35).setDepth(-9700);
    const ring = this.add.ellipse(x, y, r * 2, r * 1.5).setStrokeStyle(2, 0xff5050, 0.9).setDepth(-9700);
    const dmg = Math.round((damage ?? (5 + this.runTime / 60 * 2) * this.rank.damage) * this.endlessScaleNow().damage);
    this.hazards.push({ x, y, t: 0, fall: 1.1, r, damage: dmg, shadow, ring, src });
    if (this.coop?.role === 'host') this.coop.hazard(x, y, dmg, src.by);
  }

  /** Falling balls (every rank): a growing shadow for 1.1 s, then the impact. Hurts rivals too. */
  private updateHazards(dt: number) {
    const s = dt / 1000;
    const every = this.endless ? Math.min(this.rank.hazardEvery || 99, endlessPhase(this.endlessMin()).hazardEvery) : this.rank.hazardEvery;
    // pre-2.0 (BUG-F44BE9B4): the falling balls are the host's too (the guest's own ones never showed on the host's
    // screen); he drops them round each captain standing and they reach the guest through dropHazard
    if (every && !this.ended && this.runTime >= this.nextHazardAt && this.coop?.role !== 'guest') {
      this.nextHazardAt = this.runTime + every * (0.8 + this.rng.frac() * 0.4);
      const n = Math.min(10, 2 + Math.floor(this.runTime / 120));
      const pc = this.coop?.partnerCaptain();
      for (const c of [this.down ? null : this.members[0].f, pc]) {
        if (!c) continue;
        for (let k = 0; k < n; k++) {
          const a = this.rng.frac() * Math.PI * 2, d = k === 0 ? this.rng.between(0, 40) : this.rng.between(40, 130);
          this.dropHazard(c.x + Math.cos(a) * d, c.y + Math.sin(a) * d * 0.8);
        }
      }
    }
    for (const h of this.hazards) {
      h.t += s;
      const k = Math.min(1, h.t / h.fall);
      h.shadow.setSize(h.r * 2 * k, h.r * 1.5 * k);
      h.ring.setAlpha(0.5 + Math.sin(h.t * 20) * 0.4);
      if (!h.ball && h.t > h.fall - 0.35) h.ball = this.add.image(h.x, h.y - 160, 'fx:ball').setScale(1.6).setDepth(8900);
      if (h.ball) h.ball.y = h.y - 160 * Math.max(0, (h.fall - h.t) / 0.35);
      if (h.t < h.fall) continue;
      impact(this.fx, recipeFor({ name: 'Balón', element: null, power: 40 }, 'comun'), h.x, h.y, h.r, 3);
      sfx('boom');
      if (this.captainIn(h.x, h.y, h.r + 6, 1.3)) this.hurtCaptain(h.damage, h.src);
      for (const e of this.enemies) if (!e.dead && Math.hypot(e.pos.x - h.x, e.pos.y - h.y) < h.r + e.radius) this.hit(e, h.damage * 2, 0, 0, 'energia');
      h.t = -1;
    }
    this.hazards = this.hazards.filter((h) => {
      if (h.t >= 0) return true;
      h.shadow.destroy(); h.ring.destroy(); h.ball?.destroy();
      return false;
    });
  }

  /** Big centred word for wave changes and milestones (kept short and rare). */
  /** Fix 1.31: the team synergies right now (resonance by active techniques, club chemistry, the captain's synergy) */
  private synergyList(): Synergy[] {
    const active = this.members.flatMap((m) => m.state.slots.map((_, i) => this.activeTech(m, i)).filter((t) => t && t.type !== 'talento').map((t) => t!.element));
    const kit = this.cfg.kitTeam || 'Raimon';
    const cap = this.members[0]?.entry;
    const allies = cap ? this.members.filter((o) => o !== this.members[0] && o.entry.element === cap.element).length : 0;
    const out = [...resonances(active), chemistrySynergy(kit, kitTeamLabel(kit), this.members.map((x) => x.entry))];
    const syn = cap ? captainSynergy(this.cfg.perks.synergy, String(cap.element), allies) : null;
    if (syn && syn.count) out.push(syn);
    return out.filter((x) => x.bonus > 0 || x.count > 0);
  }
  private synergySeen = new Map<string, number>();
  /** a banner on the pitch when a synergy switches on or goes up a step */
  private announceSynergies() {
    for (const x of this.synergyList()) {
      const before = this.synergySeen.get(x.key) ?? 0;
      if (x.bonus > before + 1e-6) {
        const col = x.element ? ({ Fuego: '#ff7a3a', Aire: '#7ae0ff', Bosque: '#7af07a', 'Montaña': '#ffc35a', Neutro: '#d08aff' } as Record<string, string>)[x.element] ?? '#ffe27a' : '#ffe27a';
        this.banner(`¡${x.label.split(' · ')[0]} +${Math.round(x.bonus * 100)}%!`, col);
        sfx('powerup');
      }
      this.synergySeen.set(x.key, x.bonus);
    }
  }

  /** 2.0: heals the captain and shows it (green number, ring, crosses, HUD flash); `show` false when the caller shows it */
  private healBy(amount: number, show = true) {
    const before = this.hp;
    this.hp = Math.min(this.maxHp, this.hp + amount);
    const got = this.hp - before;
    if (got >= 1 && show && this.members[0]) { const c = this.members[0].f; this.fx.healFx(c.x, c.y - 10, got); this.healAt = this.runTime; }
  }

  /** 2.0: Corriente negra's beast crashing down: hurts and pushes back every rival in the splash */
  private waterCrash(cx: number, cy: number, r: number, dmg: number, style: FxStyle) {
    sfx('boom');
    for (const e of this.enemies) {
      const d = Math.hypot(e.pos.x - cx, e.pos.y - 10 - cy);
      if (d < r + e.radius) this.hit(e, dmg, (e.pos.x - cx) / (d || 1) * 150, (e.pos.y - cy) / (d || 1) * 150, style);
    }
  }

  /** (author) the game stops for an ultimate: nothing moves or hurts, the camera closes in, then all goes on */
  private cinematic(ms: number) {
    const wall = ms / Math.max(0.05, this.time.timeScale);
    // co-op (author): the game never stops for an ultimate, each screen would freeze alone and the two would part ways
    if (!this.coop) this.cineUntil = performance.now() + wall;
    this.invulnUntil = Math.max(this.invulnUntil, this.runTime + 0.6);
    const cam = this.cameras.main, z = this.zoomFor();
    cam.zoomTo(z * 1.22, 320, 'Cubic.easeOut', true);
    cam.setFollowOffset(0, 34); // a little higher: the spirit and its axe stand above the player (running eases it back)
    this.time.delayedCall(ms - 260, () => { if (this.sys.isActive()) cam.zoomTo(this.zoomFor(), 300, 'Cubic.easeInOut', true); });
  }

  /**
   * 1.82 (author: the boss had to feel dangerous): BOSS_WARN_SEC before it comes, the alarm: the pitch darkens and pulses
   * red three times while the HUD shows the warning (app.ts bossWarn).
   */
  private bossWarning() {
    this.cfg.hooks.bossWarn?.();
    const cam = this.cameras.main;
    const veil = this.add.rectangle(0, 0, cam.width, cam.height, 0x2a0006, 0).setOrigin(0).setScrollFactor(0).setDepth(9500);
    this.tweens.add({ targets: veil, fillAlpha: 0.32, duration: 500, ease: 'Sine.easeOut' });
    for (let k = 0; k < 3; k++) this.time.delayedCall(k * 700, () => {
      if (this.ended) return;
      if (this.cfg.settings.flashes) cam.flash(260, 140, 0, 20, true);
      this.fx.shake(0.002 + k * 0.0015, 220);
    });
    this.time.delayedCall(BOSS_WARN_SEC * 1000 + 600, () => this.tweens.add({ targets: veil, fillAlpha: 0, duration: 700, onComplete: () => veil.destroy() }));
  }

  /** 1.82: the boss lands: hit-stop, a heavy shake, shockwaves and dust, its column of light, then its name card */
  private bossEntrance(b: Enemy, again: boolean) {
    const kit = this.kitOf(b), { x, y } = b.pos;
    this.slowmoUntil = performance.now() + 900;
    this.fx.pillar(x, y, kit.color, 14);
    this.fx.shake(0.012, 650);
    for (let k = 0; k < 3; k++) this.time.delayedCall(k * 140, () => this.fx.ring(x, y, 70 + k * 55, k === 1 ? 0xffffff : 0xff3a2a, 520, 5 - k));
    this.fx.burst('fuego', x, y, 26, 120, true);
    if (this.cfg.settings.flashes) this.cameras.main.flash(180, 255, 60, 40, true);
    this.rec?.event(this.runTime, { k: 'boss', name: b.unit.name });
    if (this.cfg.hooks.bossIntro) this.cfg.hooks.bossIntro({ name: b.unit.name, title: kit.title, again });
    else this.banner(again ? `¡${b.unit.name} regresa!` : `¡${b.unit.name}!`, '#ff5a5a');
  }

  /**
   * 1.82: a new phase: everyone holds still while the boss roars (shockwaves, a camera punch, the pitch shakes), the
   * small rivals around it are blown back, and the HUD announces the phase on its bar.
   */
  private bossRoar(e: Enemy, kit: BossKit, phase: number) {
    const { x, y } = e.pos;
    this.cineUntil = performance.now() + 650;
    this.invulnUntil = Math.max(this.invulnUntil, this.runTime + 1);
    for (let k = 0; k < 3; k++) this.time.delayedCall(k * 120, () => this.fx.ring(x, y - 10, 60 + k * 70, k === 1 ? 0xffffff : kit.color, 600, 5 - k));
    this.fx.rays(x, y - 14, 14, 110, kit.color, 600);
    this.fx.shake(0.011, 520);
    for (const o of this.enemies) {
      if (o === e || o.kind === 'boss' || o.rival) continue;
      const dx = o.pos.x - x, dy = o.pos.y - y, d = Math.hypot(dx, dy);
      if (d < 200 && d > 0) { o.knockX += dx / d * 260; o.knockY += dy / d * 260; }
    }
    const sp = e.sprite, sx = sp.scaleX, sy = sp.scaleY;
    this.tweens.add({ targets: sp, scaleX: sx * 1.25, scaleY: sy * 1.25, duration: 160, yoyo: true, repeat: 1, onComplete: () => sp.active && sp.setScale(sx, sy) });
    const cam = this.cameras.main, z = cam.zoom;
    if (!this.cfg.settings.reducedMotion) this.tweens.add({ targets: cam, zoom: z * 1.07, duration: 170, yoyo: true, ease: 'Sine.easeOut', onComplete: () => cam.setZoom(z) });
    if (this.cfg.settings.flashes) cam.flash(200, 255, 80, 60, true);
    sfx('boom'); sfx('bossdrop');
    if (!this.cfg.hooks.bossIntro) this.banner(`${e.rival ? '¡Se pone serio!' : `FASE ${phase + 1}`}`, '#ff8a5a');
  }

  /**
   * 1.82: the boss goes down for good: time almost stops, a chain of explosions runs over where it stood, a white flash
   * and the heaviest shake, then the choice (or the endless reward) as before.
   */
  private bossFinale(x: number, y: number, color: number) {
    this.cineUntil = performance.now() + 1500;
    this.invulnUntil = Math.max(this.invulnUntil, this.runTime + 3);
    for (let k = 0; k < 6; k++) this.time.delayedCall(k * 160, () => {
      const ex = x + (this.rng.frac() - 0.5) * 70, ey = y - 10 + (this.rng.frac() - 0.5) * 50;
      this.fx.burst(k % 2 ? 'fuego' : 'energia', ex, ey, 18, 110, true);
      this.fx.ring(ex, ey, 40 + k * 8, k % 2 ? 0xffd23f : color, 380, 4);
      this.fx.shake(0.004 + k * 0.0015, 160);
      sfx('boom');
    });
    this.time.delayedCall(1000, () => {
      this.fx.rays(x, y - 14, 20, 160, 0xfff6c0, 800);
      for (let k = 0; k < 3; k++) this.fx.ring(x, y - 10, 90 + k * 80, 0xffffff, 700, 6 - k * 2);
      if (this.cfg.settings.flashes) this.cameras.main.flash(350, 255, 255, 255, true);
      this.fx.shake(0.016, 600);
      sfx('bossdrop'); sfx('legend');
    });
    this.cfg.hooks.bossDefeated?.();
    this.time.delayedCall(1550, () => { if (!this.ended) this.onBossDown(x, y); });
  }

  private banner(text: string, color: string) {
    const cam = this.cameras.main;
    const t = this.add.text(cam.width / 2, cam.height * 0.3, text, { fontFamily: '"Press Start 2P"', fontSize: '22px', color, stroke: '#000', strokeThickness: 6 })
      .setOrigin(0.5).setScrollFactor(0).setDepth(9800).setScale(0.6).setAlpha(0);
    this.tweens.add({ targets: t, scale: 1, alpha: 1, duration: 220, ease: 'Back.easeOut', yoyo: true, hold: 700, onComplete: () => t.destroy() });
  }

  /** hurts, once per `hits`, every rival within `w` of the segment (x0,y0)-(x1,y1) (Fuego supremo's beam) */
  private hitSegment(x0: number, y0: number, x1: number, y1: number, w: number, hits: Set<Enemy>, dmg: number, ang: number, knock: number, style: FxStyle) {
    const dx = x1 - x0, dy = y1 - y0, L2 = dx * dx + dy * dy || 1;
    for (const e of this.enemies) {
      if (e.dead || hits.has(e)) continue;
      const ex = e.pos.x, ey = e.pos.y - 10, u = Math.max(0, Math.min(1, ((ex - x0) * dx + (ey - y0) * dy) / L2));
      if (Math.hypot(ex - (x0 + dx * u), ey - (y0 + dy * u)) > w + e.radius) continue;
      hits.add(e);
      this.hit(e, dmg, Math.cos(ang) * knock, Math.sin(ang) * knock, style);
    }
  }

  /** hurts, once per `hits`, every rival inside the band swept from (ox,oy) to the front (cx,cy), `half` wide each side (Fuego total) */
  private sweepBand(ox: number, oy: number, ang: number, cx: number, cy: number, half: number, hits: Set<Enemy>, dmg: number, knock: number, style: FxStyle) {
    const ux = Math.cos(ang), uy = Math.sin(ang), front = (cx - ox) * ux + (cy - oy) * uy;
    for (const e of this.enemies) {
      if (e.dead || hits.has(e)) continue;
      const rx = e.pos.x - ox, ry = e.pos.y - 10 - oy, along = rx * ux + ry * uy, side = Math.abs(-rx * uy + ry * ux);
      if (along < -12 || along > front + 14 || side > half + e.radius) continue;
      hits.add(e);
      this.hit(e, dmg, ux * knock * 1.4, uy * knock * 1.4, style, true);
    }
  }

  private hit(e: Enemy, dmg: number, kx: number, ky: number, style: FxStyle, crit = false) {
    if (e.dead) return;
    const p = this.cfg.perks;
    const tf = this.talents();
    if (this.rng.frac() < capCrit(p.critChance + tf.crit)) { dmg *= 1.8 + Math.min(1.2, tf.critDamage); crit = true; }
    if (e.unit.gender === 'M') dmg *= 1 + tf.vsMale; else if (e.unit.gender === 'F') dmg *= 1 + tf.vsFemale;
    if ((e.curseUntil ?? 0) > this.runTime) dmg *= 1.15; // Gafe
    if (e.kind !== 'boss' && tf.stun && this.rng.frac() < Math.min(0.3, tf.stun)) e.webUntil = Math.max(e.webUntil ?? 0, this.runTime + 0.6); // ¡Trampa!
    if (tf.curse && this.rng.frac() < Math.min(0.3, tf.curse)) { e.curseUntil = this.runTime + 3; e.slowUntil = Math.max(e.slowUntil, this.runTime + 3); }
    if (this.buffOn('cazador') && (e.variant === 'elite' || e.kind === 'miniboss' || e.kind === 'boss')) dmg *= 1.4;
    if (this.rng.frac() < Math.min(CAP_ELEMENTAL, p.elementalChance + tf.elemental)) { dmg *= 1.2 + Math.min(0.6, tf.elementalPower); e.slowUntil = this.runTime + 1.5; this.fx.burst(style, e.pos.x, e.pos.y - 10, 4, 30, true); }
    const v = Math.max(1, Math.round(dmg));
    this.damageDealt += Math.min(v, Math.max(0, e.hp));
    if (this.ultWin && this.runTime <= this.ultWin.until) { const l = this.ultLog.get(this.ultWin.spirit); if (l) l.damage += Math.min(v, Math.max(0, e.hp)); }
    if (this.coop?.role === 'guest') { // pre-2.0: the host applies it (and decides the knock-out); here only what is seen
      this.coop.hit(e.id, v, kx, ky, style);
      this.fx.flash(e.sprite, 0xffffff, 60);
      this.fx.damageNumber(e.pos.x, e.pos.y - 26 * (e.sprite.scale || 1), v, crit || v >= 40 || e.kind === 'boss');
      sfx(crit ? 'crit' : 'hit');
      return;
    }
    e.hp -= v;
    const kr = e.kind === 'boss' ? 0.1 : e.kind === 'miniboss' || e.variant === 'tank' ? 0.3 : 1;
    e.knockX += kx * kr; e.knockY += ky * kr;
    this.fx.flash(e.sprite, 0xffffff, 60);
    if (e.kind !== 'boss' && !this.tweens.isTweening(e.sprite)) {
      const sx = e.sprite.scaleX, sy = e.sprite.scaleY;
      this.tweens.add({ targets: e.sprite, scaleX: sx * 1.18, scaleY: sy * 0.82, duration: 50, yoyo: true, onComplete: () => e.sprite.active && e.sprite.setScale(sx, sy) });
    }
    const bossHit = e.kind === 'boss' || !!e.rival;
    this.fx.damageNumber(e.pos.x, e.pos.y - 26 * (e.sprite.scale || 1), v, crit || v >= 40 || bossHit);
    if (bossHit) { // 1.82: hitting the boss has weight
      const now = performance.now();
      if (now >= this.nextBossSpark) { this.nextBossSpark = now + 90; this.fx.burst(style, e.pos.x + (this.rng.frac() - 0.5) * 20, e.pos.y - 14 * (e.sprite.scale || 1), 4, 55, true); }
      if (v >= 40 && now >= this.nextBossShake) { this.nextBossShake = now + 160; this.fx.shake(0.0025, 70); }
    }
    if (style === 'hielo') e.speed *= 0.97;
    if (crit) { // a critical reads at a glance: a burst of light and its own sound
      this.fx.ring(e.pos.x, e.pos.y - 12, 16, 0xffe24a, 200, 3);
      this.fx.rays(e.pos.x, e.pos.y - 12, 6, 22, 0xfff6c0, 180);
      sfx('crit');
    } else sfx('hit');
    if (crit && v >= 60 || e.kind === 'boss' && v >= 80) this.hitstop(e.kind === 'boss' ? 70 : 45);
    if (e.hp <= 0) this.kill(e, style);
  }

  /**
   * Everything a rival leaves on the ground (aim line, bomb fuse, attack telegraph) goes with it, however it leaves:
   * defeated, withdrawn, or at the end of the run.
   */
  /**
   * Fix 1.12: adaptive quality. Three low seconds in a row (under 40 fps) drop the particles and the redraw rate of the
   * drawn effects for the rest of the run; it never touches the player's saved settings.
   */
  private padAWas = false; private lowFps = 0;
  private adaptQuality() {
    if (this.game.loop.actualFps < 40) this.lowFps++; else this.lowFps = 0;
    if (this.lowFps >= 3 && this.fx.settings.particles === 'completo') { this.fx.settings.particles = 'reducido'; setLowPower(true); setNatureLowPower(true); }
  }

  /** Fix 1.12: ground marks with no live owner are removed (groundSweep.ts); the count is kept for QA (window.__ies). */
  private nextSweep = 0;
  sweptOrphans = 0;
  private sweepGround() {
    const owned = new Set<unknown>(this.altarGfx);
    for (const e of this.enemies) if (!e.dead) for (const g of [e.aim?.gfx, e.fuse?.gfx, e.pattern?.gfx]) if (g) owned.add(g);
    for (const h of this.hazards) { owned.add(h.shadow); owned.add(h.ring); }
    for (const w of this.shocks) owned.add(w.g);
    const list = this.children.list as unknown as (Phaser.GameObjects.GameObject & { depth: number })[];
    for (const o of orphans(list, owned, (x) => this.tweens.isTweening(x))) {
      this.sweptOrphans++;
      o.destroy();
    }
  }

  private disposeTelegraphs(e: Enemy) {
    for (const g of [e.aim?.gfx, e.fuse?.gfx, e.pattern?.gfx]) if (g) { this.tweens.killTweensOf(g); g.destroy(); }
    e.aim = undefined; e.fuse = undefined;
    if (e.pattern) e.pattern.gfx = undefined;
  }

  private kill(e: Enemy, style: FxStyle) {
    e.dead = true;
    this.coop?.onKill(e.id, style);
    this.rec?.kill(this.runTime, e.id);
    this.rollGoldKey(e);
    this.kills++;
    this.altarCount(e);
    this.disposeTelegraphs(e);
    if (e === this.rival) this.rival = null;
    const x = e.pos.x, y = e.pos.y - 6;
    this.fx.burst(style, x, y - 4, 6, 50);
    this.fx.ring(x, y - 4, 12, 0xffffff, 180, 2); // the pop of the knock-out
    // Fix 1.12: sweeping a group is rewarded on screen
    const nowMs = performance.now();
    this.recentKills = this.recentKills.filter((t) => nowMs - t < 700);
    this.recentKills.push(nowMs);
    if (this.recentKills.length >= 6 && nowMs > this.nextSweepCheer) {
      this.nextSweepCheer = nowMs + 2500;
      this.fx.label(this.members[0].f.x, this.members[0].f.y - 50, `¡BARRIDA ×${this.recentKills.length}!`, '#ffe24a');
      this.fx.ring(this.members[0].f.x, this.members[0].f.y - 10, 70, 0xffe24a, 420, 3);
      sfx('sweep');
    }
    // knocked off their feet and gone in a quarter second: clear, not instant
    const sp = e.sprite;
    this.tweens.killTweensOf(sp);
    const away = Math.sign(e.knockX || (x - this.members[0].f.x)) || 1;
    if (e.kind === 'boss') this.tweens.add({ targets: sp, x: sp.x + away * 60, y: sp.y - 46, angle: away * 520, alpha: 0, duration: 1100, ease: 'Cubic.easeOut', onComplete: () => sp.destroy() });
    else this.tweens.add({ targets: sp, x: sp.x + away * 14, y: sp.y - 10, angle: away * 70, alpha: 0, duration: 240, ease: 'Quad.easeOut', onComplete: () => sp.destroy() });
    if (e.kind === 'miniboss') {
      this.minibossesKilled++;
      this.dropXp(x, y, XP_TIERS[2]);
      this.dropXp(x + 6, y + 4, XP_TIERS[2]);
      this.dropItem(x + 10, y, DROPS.find((d) => d.id === 'chocolate')!);
      if (this.magnetReady()) { this.lastMagnetAt = this.runTime; this.dropItem(x - 10, y, DROPS.find((d) => d.id === 'iman')!); }
      this.fx.shake(0.006, 200);
    } else if (e.kind === 'boss') {
      this.boss = null;
      this.bossFinale(x, y, this.kitOf(e).color);
    } else {
      const rand = () => this.rng.frac();
      if (e.variant === 'elite') { this.dropXp(x, y, XP_TIERS[2]); this.fx.ring(x, y - 6, 22, 0xffd27a, 300, 2); }
      else this.dropXp(x, y, rollXpTier(rand, capLuck(this.mods.luck + this.cfg.perks.luck + this.talents().luck)));
      const d = rollDrop(rand, capLuck(this.mods.luck + this.cfg.perks.luck + this.talents().luck), this.magnetReady(), this.cfg.perks.specialLuck);
      if (d?.id === 'iman') this.lastMagnetAt = this.runTime;
      if (d) this.dropItem(x + 6, y, d);
    }
  }

  /** A magnet needs its minimum gap and none left on the pitch: never two in a row. */
  private magnetReady() { return this.runTime - this.lastMagnetAt >= MAGNET_GAP_SEC && !this.pickups.some((p) => p.drop?.id === 'iman'); }

  private dropXp(x: number, y: number, tier: (typeof XP_TIERS)[number]) {
    if (this.pickups.length >= MAX_PICKUPS) { // full field: bank the value in the last orb instead of adding objects
      const orb = this.pickups.find((p) => p.kind === 'xp');
      if (orb) { orb.value += tier.value; return; }
    }
    const img = this.add.image(x, y, tier.texture).setDepth(y - 1);
    const id = this.nextPickupId++;
    this.pickups.push({ id, img, kind: 'xp', value: tier.value, pulled: false, x, y, speed: 0, born: this.runTime });
    this.coop?.onDrop({ pid: id, k: 'xp', v: tier.value, tex: tier.texture, x: Math.round(x), y: Math.round(y) });
  }

  private dropItem(x: number, y: number, drop: DropDef) {
    const [atlas, frame] = drop.texture.split(':');
    const img = atlas === 'items' ? this.add.image(x, y, 'items', frame) : this.add.image(x, y, drop.texture);
    img.setDepth(y - 1);
    const id = this.nextPickupId++;
    this.pickups.push({ id, img, kind: 'item', value: 0, drop, pulled: false, x, y, speed: 0, born: this.runTime });
    this.coop?.onDrop({ pid: id, k: 'item', v: 0, tex: drop.texture, d: drop.id, x: Math.round(x), y: Math.round(y) });
  }

  private collect(p: Pickup) {
    const c = this.members[0].f;
    if (p.kind === 'xp') {
      // quick pickups chain: pitch climbs, and bigger orbs get a visible pop
      this.xpCombo = this.runTime < this.xpComboUntil ? this.xpCombo + 1 : 0;
      this.xpComboUntil = this.runTime + 0.7;
      this.gainXp(p.value);
      sfx('pickup', 1 + Math.min(this.xpCombo, 16) * 0.05);
      if (p.value >= 5) {
        this.fx.ring(c.x, c.y - 10, p.value >= 20 ? 26 : 16, p.value >= 20 ? 0xffc83a : 0x4fb3ff, 240, 2);
        this.fx.label(c.x, c.y - 26, `+${p.value} EXP`, p.value >= 20 ? '#ffe24a' : '#8fd8ff');
      }
      return;
    }
    const d = p.drop!;
    // IDEA-C16CF5D6: the power-up says what it really gives with the upgrades bought
    const boost = d.id === 'dano' ? Math.round((this.cfg.perks.damageBuff ?? 0.5) * 100) : d.id === 'recarga' ? Math.round((this.cfg.perks.cooldownBuff ?? 0.4) * 100) : 0;
    const label = this.boostLabel(d.id) ?? d.label;
    const info = boost && d.id === 'dano' ? `El equipo hace un ${boost}% más de daño durante 10 s.` : d.info;
    if (info) this.cfg.onPickup?.(d.id, label, info);
    this.fx.ring(c.x, c.y - 10, 24, 0xffffff, 260, 2);
    this.fx.burst('energia', c.x, c.y - 10, 8, 60, true);
    if (d.id === 'arroz' || d.id === 'chocolate') {
      this.healBy(Math.round(this.maxHp * (d.id === 'arroz' ? 0.15 : 0.4) * this.cfg.perks.healMult));
      sfx('pickup');
    } else if (d.id === 'iman') {
      // IDEA-C16CF5D6: with «Imán de botín» the coin bags, fichas and chests come too
      const loot = (o: Pickup) => this.cfg.perks.lootMagnet && o.kind === 'item' && (o.drop?.id === 'bolsa' || o.drop?.id === 'ficha' || o.drop?.id === 'cofre');
      for (const o of this.pickups) if (o.kind === 'xp' || loot(o)) { o.pulled = true; o.speed = Math.max(o.speed, 300); }
      this.fx.ring(c.x, c.y - 10, 90, 0xe23a3a, 500, 3);
      this.fx.ring(c.x, c.y - 10, 160, 0xffffff, 700, 2);
      this.fx.rays(c.x, c.y - 10, 12, 110, 0xe23a3a, 420);
      this.banner('¡IMÁN!', '#ff6a6a');
      sfx('magnet');
    } else if (d.id === 'bolsa') {
      this.bonusCoins += BAG_COINS;
      this.fx.label(c.x, c.y - 34, `+${BAG_COINS} monedas`);
      sfx('buy');
    } else if (d.id === 'ficha') {
      this.bonusTokens += FICHA_DROP;
      this.fx.label(c.x, c.y - 34, `+${FICHA_DROP} fichas`, '#8fe8ff');
      sfx('evolve');
    } else if (d.id === 'cofretec') {
      this.fx.label(c.x, c.y - 34, d.label);
      sfx('evolve');
      this.time.delayedCall(0, () => this.offerCards());
    } else if (d.id === 'senuelo') {
      this.lure = { x: p.x, y: p.y, until: this.runTime + (d.seconds ?? 5) };
      this.fx.ring(p.x, p.y, 60, 0xff4f8b, 700, 2);
      this.fx.label(c.x, c.y - 34, d.label);
      sfx('powerup');
    } else if (d.id === 'hielo') {
      this.freezeUntil = this.runTime + (d.seconds ?? 3);
      for (const e of this.enemies) this.fx.flash(e.sprite, 0x9fe8ff, 300);
      this.fx.label(c.x, c.y - 34, d.label, '#9fe8ff');
      sfx('magnet');
    } else if (d.id === 'revivir') {
      if (this.reviveCharges < MAX_REVIVES) { this.reviveCharges++; this.banner(`REVIVIR · cargas ${this.reviveCharges}/${MAX_REVIVES}`, '#ffe27a'); }
      else this.fx.label(c.x, c.y - 34, `Revivir al máximo (${MAX_REVIVES})`);
      sfx('evolve');
    } else if (d.id === 'cofre') {
      this.bonusCoins += CHEST_COINS;
      this.fx.label(c.x, c.y - 34, `+${CHEST_COINS} monedas`);
      sfx('buy');
    } else {
      const total = (d.seconds ?? 8) * this.cfg.perks.buffMult;
      this.buffs.set(d.id as BuffId, { until: this.runTime + total, total });
      this.fx.label(c.x, c.y - 34, label);
      sfx('powerup');
    }
  }

  /**
   * Pickups inside the magnet radius are pulled for good: they accelerate straight at the captain's body and are
   * collected on contact. A step never passes the target, so nothing orbits or jitters, and a captain standing still
   * collects exactly like a moving one.
   */
  private updatePickups(dt: number) {
    const cap = this.members[0].f;
    const magnet = this.pickupRange();
    const s = dt / 1000;
    const tx = cap.x, ty = cap.y - 10;
    for (const p of this.pickups) {
      let d = Math.hypot(tx - p.x, ty - p.y);
      if (!p.pulled && d < magnet) p.pulled = true;
      if (p.pulled && d >= 12) {
        p.speed = Math.min(Math.max(p.speed, 80) + 1500 * s, 720);
        const step = Math.min(d, p.speed * s);
        p.x += ((tx - p.x) / d) * step; p.y += ((ty - p.y) / d) * step;
        d = Math.hypot(tx - p.x, ty - p.y);
      }
      if (d < 12) { this.take(p); continue; }
      if (p.pulled) p.img.setPosition(p.x, p.y).setScale(1);
      else {
        // resting: gentle bob and pulse on the image only
        const t = this.runTime - p.born;
        p.img.setPosition(p.x, p.y - (p.kind === 'item' ? 2 + Math.sin(t * 5) * 2 : Math.abs(Math.sin(t * 4)) * 2));
        if (p.kind === 'xp' && p.value >= 5) p.img.setScale(1 + Math.sin(t * 6) * 0.08);
      }
      p.img.setDepth(p.y - 1);
    }
    this.pickups = this.pickups.filter((p) => p.value >= 0);
  }

  /** First boss: choose to finish or keep surviving. Later bosses (endless) pay a reward and the run goes on. */
  private onBossDown(x: number, y: number) {
    if (this.coop || this.cfg.road) { this.finish(true); return; } // pre-2.0: co-op and the road end with the boss (no endless)
    if (this.endless) {
      this.bonusCoins += 60; this.bonusTokens += FICHA_DROP;
      this.endless.coins += 60; this.endless.tokens += FICHA_DROP; this.endless.bosses++;
      this.fx.label(x, y - 30, `¡Jefe derrotado! +60 monedas +${FICHA_DROP} fichas`, '#8fe8ff');
      sfx('evolve');
      return;
    }
    this.levelingUp = true;
    this.scene.pause();
    void this.cfg.hooks.bossDown().then((choice) => {
      this.levelingUp = false;
      if (choice === 'end') { this.finish(true); return; }
      const c = this.members[0].f;
      this.endless = { since: this.runTime, nextTick: this.runTime + 60, moved: 0, ticks: 0, nextBoss: this.runTime + 150, nextMiniboss: this.runTime + 70, killsAtTick: this.kills, phase: 0, bosses: 0, coins: 0, tokens: 0 };
      this.nextSurround = this.runTime + 40;
      this.lastCapPos = { x: c.x, y: c.y };
      this.scene.resume();
      this.banner('¡SUPERVIVENCIA INFINITA!', '#ff8a5a');
    });
  }

  private endlessMin() { return this.endless ? (this.runTime - this.endless.since) / 60 : 0; }
  private endlessScaleNow() { return endlessScale(this.endlessMin()); }

  /**
   * Endless rhythm, phase by phase (endless.ts). Every minute pays coins, and a token every second one, only with real
   * play, so leaving the game idle earns nothing. Minibosses and the boss come back more and more often.
   */
  private updateEndless() {
    const e = this.endless;
    if (!e) return;
    const c = this.members[0].f;
    e.moved += Math.hypot(c.x - this.lastCapPos.x, c.y - this.lastCapPos.y);
    this.lastCapPos = { x: c.x, y: c.y };
    const min = this.endlessMin(), ph = endlessPhase(min);
    if (ph.id > e.phase) {
      e.phase = ph.id;
      this.banner(ph.id === 4 ? '¡FASE INFERNAL!' : `Fase: ${ph.name}`, ph.id === 4 ? '#ff4040' : '#ff8a5a');
      const bonus = 25 * (ph.id + 1);
      this.bonusCoins += bonus; e.coins += bonus;
      sfx('boom');
    }
    if (this.runTime >= e.nextTick) {
      e.nextTick += 60;
      if (endlessActive(e.moved, this.kills - e.killsAtTick)) {
        e.ticks++;
        const coins = endlessCoins(e.ticks);
        this.bonusCoins += coins; e.coins += coins;
        if (e.ticks % 2 === 0) { this.bonusTokens += ENDLESS_TOKENS; e.tokens += ENDLESS_TOKENS; }
        this.banner(`+${coins} monedas${e.ticks % 2 === 0 ? ` +${ENDLESS_TOKENS} fichas` : ''}`, '#ffe24a');
      } else this.banner('Sin recompensa: juega para ganarla', '#ff9a8a');
      e.moved = 0; e.killsAtTick = this.kills;
    }
    const units = this.units();
    if (this.runTime >= e.nextMiniboss) {
      e.nextMiniboss = this.runTime + ph.minibossEvery;
      const list = this.cfg.map.minibosses;
      const u = list.length ? units.get(list[this.rng.between(0, list.length - 1)]) : undefined;
      if (u) this.spawnEnemy(u, 'miniboss', 14, 1.5);
    }
    if (this.runTime >= e.nextBoss && !this.boss) {
      e.nextBoss = this.runTime + ph.bossEvery;
      const u = this.cfg.map.boss !== null ? units.get(this.cfg.map.boss) : undefined;
      if (u) { this.boss = this.spawnEnemy(u, 'boss', 32, 2.1); if (this.boss) this.bossEntrance(this.boss, true); }
    }
  }

  private take(p: Pickup) {
    if (this.coop?.role === 'guest') { this.coop.take(p.id); p.img.destroy(); p.value = -1; return; } // pre-2.0: the host grants it
    this.coop?.onGone(p.id);
    this.collect(p);
    p.img.destroy();
    p.value = -1;
  }

  // ------------------------------------------------------------- progression
  /** Fix 1.23: grows faster late in the run, so the last minutes aren't a string of level-ups; from level 40 it only
   *  grows linearly (+26 per level), so long endless runs never ask for spikes of thousands */
  private xpNext() { return xpForLevel(this.level); }

  private gainXp(v: number) {
    if (this.cfg.training) return; // v1.6: levels are chosen, not earned
    if (this.coop?.role === 'guest') { this.coop.addXp(v); return; } // pre-2.0: the shared bar is the host's
    this.xp += v * capXp(this.mods.xp * this.cfg.perks.xpMult * (1 + this.talents().xp)) * (this.buffOn('xp') ? 2 : 1);
    if (this.xp >= this.xpNext() && !this.levelingUp) this.levelUp();
    this.coop?.xp(this.xp, this.level, this.kills);
  }

  private currentTeam(): TeamMemberState[] { return this.members.map((m) => m.state); }

  private levelUp() {
    if (this.ended) return;
    this.xp -= this.xpNext();
    this.level++;
    this.coop?.xp(this.xp, this.level, this.kills, true);
    this.coop?.levelUp(this.level);
    sfx('levelup');
    const lc = this.members[0].f;
    this.fx.ring(lc.x, lc.y - 10, 70, 0xffe24a, 420, 3);
    this.fx.ring(lc.x, lc.y - 10, 40, 0xffffff, 300, 2);
    this.fx.rays(lc.x, lc.y - 10, 12, 70, 0xfff6c0, 420);
    this.fx.label(lc.x, lc.y - 40, `¡NIVEL ${this.level}!`, '#ffe24a');
    // 350 ms of slow motion so the level-up registers, then the cards (never longer: the run must keep its pace)
    this.slowmoUntil = performance.now() + 350;
    this.levelingUp = true;
    this.time.delayedCall(300, () => { this.levelingUp = false; this.offerCards(false, this.level); });
  }

  /** Card screen, from a level-up or a reward. `recruitOnly` keeps just recruit cards when any can be offered. */
  private offerCards(recruitOnly = false, level = 0) {
    if (this.cfg.training) return;
    if (this.ended || this.levelingUp) return;
    this.levelingUp = true;
    this.scene.pause();
    const shop = this.cfg.shop;
    const draw = () => {
      const cards = drawCards({ team: this.currentTeam(), unlocked: this.cfg.unlocked.filter((p) => !this.dismissed.has(p.id)), runLevel: this.level, taken: this.taken,
        bought: (id) => shop?.techUnlocks[String(id)] ?? [], onlyRecruits: recruitOnly }, () => this.rng.frac(), 3 + this.cfg.perks.extraChoices);
      if (recruitOnly) return cards;
      // a combination that just became possible always shows up; upgrades of learned ones now and then
      const pitch = this.members.map((m) => ({ entry: m.entry, state: m.state }));
      // 1.76: combos of a group are alternatives (Lanza Nórdica Congelada / Frente Frío): one of the ready ones at random,
      // and none of them once the run has learned one of the group
      const groupPick = new Map<string, string>();
      for (const c of COMBOS) {
        if (!c.group || groupPick.has(c.group)) continue;
        const ready = COMBOS.filter((o) => o.group === c.group && comboReady(o, pitch));
        if (ready.length) groupPick.set(c.group, ready[this.rng.between(0, ready.length - 1)].id);
      }
      for (const c of [...COMBOS_BY_PRIORITY].reverse()) { // the highest priority ends up first
        const got = this.combos.get(c.id);
        if (!got && c.group && ([...this.combos.keys()].some((id) => COMBOS.find((x) => x.id === id)?.group === c.group) || groupPick.get(c.group) !== c.id)) continue;
        if (!got && c.requires && !this.comboActive(c.requires)) continue; // author: the Dragón only with a Último recurso active
        if (!got && comboReady(c, pitch)) cards.splice(0, 1, { kind: 'combo', id: c.id, toLevel: 1 });
        else if (got && got.level < COMBO_MAX_LEVEL && this.rng.frac() < 0.35) cards.splice(cards.length - 1, 1, { kind: 'combo', id: c.id, toLevel: got.level + 1 });
      }
      // v1.7: mark the cards that bring a combined technique closer (the technique and level a participant still needs)
      const goals = comboGoals(pitch, this.combos.keys());
      for (const card of cards) {
        if (card.kind !== 'upgrade' && card.kind !== 'learn') continue;
        const m = this.members.find((x) => x.entry.id === card.playerId);
        const t = m?.entry.techniques[card.tech];
        if (!m || !t) continue;
        const hints = comboHints(goals, m.entry.id, t.name, card.kind === 'learn' ? 1 : card.toLevel);
        if (hints.length) card.combo = hints;
      }
      return cards;
    };
    const reroll = () => {
      if (this.rerolls <= 0) return [];
      this.rerolls--;
      return draw();
    };
    const cards = draw();
    // Fix 1.24: nothing left to improve (only heal cards): no screen, the level heals straight away
    if (!recruitOnly && cards.length && cards.every((c) => c.kind === 'heal')) {
      this.levelingUp = false;
      this.applyChoice(cards[0]);
      this.afterCards(level, true);
      const lc = this.members[0].f;
      this.fx.label(lc.x, lc.y - 52, `+${Math.round((cards[0] as { amount: number }).amount * 100)}% vida`, '#8fffa0');
      sfx('pickup');
      return;
    }
    this.coop?.picking(true);
    this.cfg.hooks.levelUp(cards, this.rerolls, reroll, level).then((card) => {
      this.levelingUp = false;
      if (this.ended) return;
      this.applyChoice(card);
      this.afterCards(level);
    });
  }

  /** After a card: alone, the run goes on; in co-op the host waits for the partner's card, the guest for the host. */
  private afterCards(level: number, quick = false) {
    if (!quick) this.coop?.picking(false);
    const go = () => {
      this.scene.resume();
      if (this.coop?.role === 'guest') { if (this.coopPendingLevels > 0) { this.coopPendingLevels--; this.offerCards(false, this.level); } return; }
      if (this.xp >= this.xpNext()) { if (quick) this.time.delayedCall(250, () => this.levelUp()); else this.levelUp(); }
    };
    if (this.coop?.role === 'host' && level > 0) { void this.coop.waitPartner().then(() => { this.coop?.resumeBoth(); go(); }); return; }
    if (this.coop?.role === 'guest' && level > 0 && this.coop.connected) { this.coop.picked(); this.coopResumePending = true; return; }
    go();
  }

  private applyChoice(card: Card) {
    const c = this.members[0].f;
    this.rec?.event(this.runTime, { k: 'card', lv: this.level, card: { ...card } });
    if (card.kind === 'combo') {
      const def = COMBOS.find((x) => x.id === card.id);
      if (!def) return;
      const had = this.combos.get(def.id);
      this.combos.set(def.id, { level: card.toLevel, cd: had?.cd ?? 800 });
      this.banner(had ? `${def.name} ${comboLabel(def.power, card.toLevel) || `Nv ${card.toLevel}`}` : `¡${def.name.toUpperCase()}!`, '#ffe24a');
      sfx('evolve');
      if (!had) { // a brief freeze, the participants' portraits and the name (app.ts)
        this.slowmoUntil = performance.now() + 700;
        this.cfg.hooks.combo?.({ name: def.name, ids: comboMembers(def, this.members).map((m) => m.entry.id) });
        for (const m of comboMembers(def, this.members)) this.fx.ring(m.f.x, m.f.y - 10, 26, 0xffe24a, 600, 3);
      } else this.fx.label(c.x, c.y - 52, `${def.name}: +daño, -recarga, +1 atraviesa`, '#ffe24a'); // what the level gave
      return;
    }
    if (card.kind === 'heal') {
      this.healBy(Math.round(this.maxHp * card.amount));
      return;
    }
    if (card.kind === 'stat' || card.kind === 'passive') {
      const def = modDef(card.id);
      if (!def) return;
      const hpBefore = this.mods.hp;
      def.apply(this.mods);
      this.taken[card.id] = (this.taken[card.id] ?? 0) + 1;
      if (this.mods.hp !== hpBefore) {
        const grown = Math.round(this.maxHp * (this.mods.hp / hpBefore));
        this.hp += grown - this.maxHp;
        this.maxHp = grown;
      }
      this.fx.label(c.x, c.y - 34, def.label);
      return;
    }
    const recruit = card.kind === 'recruit' ? this.cfg.unlocked.find((p) => p.id === card.playerId) : undefined;
    const before = this.currentTeam();
    const after = applyCard(card, before, recruit, this.cfg.perks.techSlots, recruit ? this.cfg.loadout?.[String(recruit.id)] : undefined);
    if (card.kind === 'recruit') {
      if (after.length > before.length && recruit) {
        this.addMember(recruit, c.x, c.y + 12);
        const nm = this.members[this.members.length - 1], k = nm?.entry.keshin && KESHIN_BY_ID.get(nm.entry.keshin.id);
        if (k && nm.entry.id === recruit.id) { // 2.0 (author: «que salga el EG si tiene, chulo y juiced»): a pause, his spirit's colour round him, the reveal (app.ts)
          const col = Phaser.Display.Color.HexStringToColor(k.color).color;
          this.slowmoUntil = performance.now() + 900;
          for (const [d, r] of [[0, 30], [120, 44], [240, 58]] as const) this.time.delayedCall(d, () => this.fx.ring(nm.f.x, nm.f.y - 10, r, col, 620, 3));
          this.fx.burst('energia', nm.f.x, nm.f.y - 10, 18, 70, true);
          this.cfg.hooks.egJoin?.({ playerId: nm.entry.id, active: !!nm.ult });
        }
      }
      return;
    }
    const m = this.members.find((x) => x.entry.id === card.playerId);
    if (!m) return;
    const prev = m.state;
    m.state = after.find((s) => s.playerId === card.playerId)!;
    const slot = m.state.slots.indexOf(card.tech);
    const t = m.entry.techniques[card.tech];
    if (card.kind === 'learn') {
      m.styles[slot] = fxStyle(t);
      m.trajs[slot] = trajectory(t);
      m.recipes[slot] = recipeFor(t, this.fxRarity(m.entry));
      m.cds[slot] = 500;
      this.fx.label(m.f.x, m.f.y - 30, t.name);
    } else {
      const evo = evolvesAt(t, prev.levels[card.tech] ?? 1);
      if (evo) { this.fx.label(m.f.x, m.f.y - 30, `${t.name} ${evo}`); sfx('evolve'); }
      if ((m.state.levels[card.tech] ?? 0) >= MAX_TECH_LEVEL) {
        // technique maxed: its own celebration (golden pillar, crown of rays, banner)
        this.fx.pillar(m.f.x, m.f.y + 4, 0xffe24a, 12);
        this.fx.rays(m.f.x, m.f.y - 14, 16, 80, 0xffe27a, 700);
        this.fx.ring(m.f.x, m.f.y - 10, 54, 0xffd84a, 600, 4);
        this.banner(`${t.name} ¡NIVEL MÁXIMO!`, '#ffe24a');
        sfx('legend');
      }
    }
    this.fx.burst(m.styles[slot], m.f.x, m.f.y - 12, 16, 60, true);
    this.lastUpgrade = { playerId: m.entry.id, slot, at: this.runTime };
  }

  // ------------------------------------------------------------- altars
  private altarCount(e: Enemy) {
    const a = this.altar;
    if (!a || a.state !== 'active') return;
    const mode = ALTAR_MODE[a.type];
    if (mode === 'cualquiera' || (mode === 'propios' && e.altarWave) || (mode === 'cerca' && Math.hypot(e.pos.x - a.x, e.pos.y - a.y) < ALTAR_RADIUS * 1.5)) this.altarKills++;
  }

  private spawnAltar() {
    const c = this.members[0].f;
    const at = this.arena.randomCellAround(c.x, c.y, 220, 420, this.rng);
    // never inside an obstacle or outside the map: the whole marker area must stand on walkable ground
    if (!at || !this.arena.walkableAt(at.x, at.y, 28) || !this.arena.walkableAt(at.x + 40, at.y, 8) || !this.arena.walkableAt(at.x - 40, at.y, 8)) { this.nextAltarAt = this.runTime + 3; return; }
    // the Altar de despido only shows up when there is someone besides the captain to send off
    const types = ALTAR_TYPES.filter((t) => (t !== 'despido' || this.members.length > 1) && (this.coop?.role !== 'guest' || !COOP_HOST_ALTARS.has(t)));
    const type = types[this.rng.between(0, types.length - 1)];
    this.altar = createAltar(type, at.x, at.y, this.runTime / 60);
    this.altarAccepted = false; this.altarWait = ALTAR_WAIT_SEC; this.altarRival = null;
    if (type === 'duelo') this.altarRival = this.pickRival();
    const color = ALTAR_COLOR[type];
    // 1.93 (author: more eye-catching): rune circle, column of light, sparks, orbs and a progress ring (fxAltar.ts)
    this.altarLook = altarFx(this, at.x, at.y, color, this.cfg.settings.particles !== 'completo');
    // the reception robot of the match chains, front on with its coloured panel (second row of its sheet)
    const rid = this.cfg.manifest.eventRobot;
    let pillar: Phaser.GameObjects.Image | Phaser.GameObjects.Sprite;
    if (rid && this.textures.exists(`unit:${rid}`)) {
      if (!this.anims.exists('event-robot')) this.anims.create({ key: 'event-robot', frames: this.anims.generateFrameNumbers(`unit:${rid}`, { start: 16, end: 19 }), frameRate: 6, repeat: -1 });
      pillar = this.add.sprite(at.x, at.y + 8, `unit:${rid}`, 16).setOrigin(0.5, 1).setScale(1.9).setDepth(at.y + 8).play('event-robot');
    } else pillar = this.add.image(at.x, at.y + 8, 'fx:altar').setOrigin(0.5, 1).setTint(color).setDepth(at.y + 8);
    this.altarGfx = [pillar, ...this.altarLook.objs];
    // named marker floating over the event
    const tag = this.add.text(at.x, at.y - 96, `${ALTAR_ICON[type]} ${ALTAR_LABEL[type]}`, { fontFamily: '"Press Start 2P"', fontSize: '9px', color: '#ffffff', stroke: '#000', strokeThickness: 5, align: 'center',
      backgroundColor: '#050c22aa', padding: { x: 6, y: 4 } }).setOrigin(0.5).setDepth(9500).setScale(0);
    this.tweens.add({ targets: tag, scale: 1, duration: 420, delay: 250, ease: 'Back.easeOut' });
    this.tweens.add({ targets: tag, y: at.y - 102, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.altarGfx.push(tag);
    this.altarTag = tag;
    this.banner(ALTAR_LABEL[type], '#ffffff');
    sfx('reveal');
  }

  /** A named footballer of this arena: the player sees who it is before accepting. */
  private pickRival() {
    const list = this.cfg.map.minibosses.map((id) => this.units().get(id)).filter((u): u is UnitInfo => !!u);
    const unit = list[this.rng.between(0, Math.max(0, list.length - 1))];
    if (!unit) return null;
    const entry = this.cfg.manifest.roster.find((p) => p.name === unit.name || (p as { nameEn?: string }).nameEn === unit.name) ?? null;
    return { unit, entry };
  }

  /** The player accepts the event in front of them. Public for the HUD button. */
  acceptAltar() {
    const a = this.altar, c = this.members[0].f;
    if (!a || a.state !== 'idle' || this.altarAccepted || Math.hypot(c.x - a.x, (c.y - a.y) * 1.3) > ALTAR_RADIUS) return;
    this.altarAccepted = true;
  }

  private clearAltar() {
    this.altarLook?.destroy(); this.altarLook = null;
    for (const g of this.altarGfx) { this.tweens.killTweensOf(g); g.destroy(); }
    this.altarGfx = [];
    this.altarTag = null;
    this.altar = null;
    if (this.rival) { // never left behind: no ghost rival or marker after the event ends
      const e = this.rival; this.rival = null;
      if (!e.dead) { e.dead = true; this.disposeTelegraphs(e); this.fx.implode(e.pos.x, e.pos.y - 10, 30, 0xffffff, 260); e.sprite.destroy(); }
    }
    this.nextAltarAt = this.runTime + ALTAR_EVERY_SEC;
  }

  private updateAltar(dt: number) {
    if (this.boss) { if (this.altar) this.clearAltar(); return; }
    if (!this.altar) { if (this.runTime >= this.nextAltarAt) this.spawnAltar(); return; }
    const a = this.altar;
    const c = this.members[0].f;
    const inside = Math.hypot(c.x - a.x, (c.y - a.y) * 1.3) < ALTAR_RADIUS;
    const was = a.state;
    if (a.state === 'idle') {
      this.altarWait -= dt / 1000;
      if (this.altarWait <= 0) { this.clearAltar(); return; } // nobody came: it goes away quietly
      if (this.altarTag) this.altarTag.setText(inside ? `${ALTAR_ICON[a.type]} Pulsa E para aceptar` : `${ALTAR_ICON[a.type]} ${ALTAR_LABEL[a.type]}`);
      if (Math.floor(this.runTime * 1.4) !== Math.floor((this.runTime - dt / 1000) * 1.4)) this.fx.burst('energia', a.x + this.rng.between(-12, 12), a.y - 30, 2, 24, true);
    }
    // defending a zone only counts while few rivals are inside it
    const crowded = a.type === 'defensa' && this.enemies.filter((e) => Math.hypot(e.pos.x - a.x, (e.pos.y - a.y) * 1.3) < ALTAR_RADIUS).length >= 4;
    const state = stepAltar(a, dt / 1000, a.state === 'idle' ? this.altarAccepted : inside && !crowded, this.altarKills);
    this.altarLook?.update(a.state, a.progress / Math.max(1e-6, a.goal), inside);
    this.altarKills = 0;
    if (was === 'idle' && state === 'active') {
      this.altarLook?.activate();
      this.fx.ring(a.x, a.y, ALTAR_RADIUS, ALTAR_COLOR[a.type], 500, 3);
      sfx('whoosh');
      this.banner(ALTAR_TASK[a.type], '#ffe24a');
      if (this.altarTag) this.altarTag.setText(`${ALTAR_ICON[a.type]} ${ALTAR_LABEL[a.type]}`);
      const units = this.cfg.map.enemies.map((id) => this.units().get(id)).filter((u): u is UnitInfo => !!u);
      const pickU = () => units[this.rng.between(0, units.length - 1)];
      if (a.type === 'fichaje' && units.length) {
        for (let i = 0; i < a.goal; i++) { const e = this.spawnEnemy(pickU(), 'enemy'); if (e) e.altarWave = true; }
      } else if (a.type === 'portal') { this.portalLeft = a.goal; this.portalNext = this.runTime; }
      else if (a.type === 'supervivencia' && units.length) { for (let i = 0; i < 12; i++) this.spawnEnemy(pickU(), 'enemy'); }
      else if (a.type === 'duelo') this.startRival(a);
      else if (a.type === 'minijefe' && (this.cfg.map.minibosses.length || units.length)) {
        const mid = this.cfg.map.minibosses[this.rng.between(0, Math.max(0, this.cfg.map.minibosses.length - 1))];
        const u = (mid !== undefined && this.units().get(mid)) || pickU();
        const e = this.spawnEnemy(u, 'miniboss', 10, 1.5);
        if (e) { e.altarWave = true; e.sprite.setTint(0xff8080); }
      } else if (a.type === 'cofre') {
        const chest = this.add.image(a.x, a.y, 'fx:pk_chest').setScale(2).setDepth(a.y);
        this.tweens.add({ targets: chest, y: a.y - 4, duration: 400, yoyo: true, repeat: -1 });
        this.altarGfx.push(chest);
      }
    }
    // the portal spits its rivals out in small groups
    if (a.type === 'portal' && a.state === 'active' && this.portalLeft > 0 && this.runTime >= this.portalNext) {
      this.portalNext = this.runTime + 2.2;
      const units = this.cfg.map.enemies.map((id) => this.units().get(id)).filter((u): u is UnitInfo => !!u);
      for (let i = 0; i < 3 && this.portalLeft > 0 && units.length; i++) {
        const e = this.spawnEnemy(units[this.rng.between(0, units.length - 1)], 'enemy');
        if (e) { e.altarWave = true; e.sprite.setPosition(a.x + this.rng.between(-20, 20), a.y + this.rng.between(-14, 14)); this.portalLeft--; }
      }
      this.fx.implode(a.x, a.y - 10, 40, 0x9a4aff, 300);
    }
    if (state === 'done') this.altarReward(a);
    if (state === 'failed') {
      for (const e of this.enemies) e.altarWave = false;
      this.cfg.hooks.event?.({ ok: false, title: ALTAR_LABEL[a.type], detail: ALTAR_INFO[a.type].fail });
      sfx('hurt');
    }
    if (state === 'done' || state === 'failed') this.clearAltar();
  }

  /** Desafío de rival: entrance, then a fight with its own attacks, phases and health bar. */
  private startRival(a: Altar) {
    const r = this.altarRival;
    if (!r) { a.state = 'failed'; return; }
    const e = this.spawnEnemy(r.unit, 'miniboss', 16, 1.6);
    if (!e) { a.state = 'failed'; return; }
    const techs = (r.entry?.techniques ?? []).filter((t) => t.type !== 'talento').map((t) => t.name);
    e.altarWave = true; e.rival = true; e.phase = 0; e.patternCd = 1.8;
    e.kit = rivalKit(r.entry?.position, techs, ALTAR_COLOR.duelo);
    e.sprite.setPosition(a.x, a.y - 30);
    this.rival = e;
    this.fx.pillar(a.x, a.y - 22, 0xffffff, 10);
    this.fx.rays(a.x, a.y - 40, 12, 80, 0xffe24a, 600);
    this.fx.shake(0.005, 200);
    this.banner(`¡${r.unit.name} te reta!`, '#ffffff');
    sfx('legend');
  }

  private altarReward(a: Altar) {
    const rankIdx = RANK_ORDER.indexOf(this.rank.id);
    const tokens = a.type === 'duelo' && rankIdx >= 2 ? DUEL_TOKENS : ALTAR_TOKENS; // Fix 1.31
    let coins = Math.round((a.type === 'duelo' ? 30 + rankIdx * 15 : 20) * this.cfg.perks.eventMult);
    this.bonusTokens += tokens;
    this.altarsDone++;
    this.fx.rays(a.x, a.y - 16, 10, 60, ALTAR_COLOR[a.type], 520);
    this.fx.ring(a.x, a.y, ALTAR_RADIUS, 0xffffff, 520, 3);
    sfx('evolve');
    const t = a.type;
    if (t === 'entrenamiento' || t === 'portal') this.gainXp(this.xpNext() * 0.6);
    else if (t === 'resistencia' || t === 'defensa') {
      this.hp = Math.min(this.maxHp, this.hp + this.maxHp * 0.25);
      this.buffs.set('escudo', { until: this.runTime + 10, total: 10 });
    } else if (t === 'elemental') this.buffs.set('dano', { until: this.runTime + 15, total: 15 });
    else if (t === 'contrarreloj') this.buffs.set('recarga', { until: this.runTime + 15, total: 15 });
    else if (t === 'supervivencia') coins += Math.round(40 * this.cfg.perks.eventMult);
    else if (t === 'minijefe') { this.gainXp(this.xpNext() * 1.2); this.dropItem(a.x, a.y, DROPS.find((d) => d.id === 'chocolate')!); }
    else if (t === 'cofre') { coins += Math.round(CHEST_COINS * this.cfg.perks.eventMult); this.time.delayedCall(0, () => this.offerCards()); }
    else if (t === 'duelo') this.time.delayedCall(0, () => this.offerCards());
    else if (t === 'despido') this.time.delayedCall(0, () => this.offerDismiss());
    else this.time.delayedCall(0, () => this.offerCards(true));
    this.bonusCoins += coins;
    this.cfg.hooks.event?.({ ok: true, title: ALTAR_LABEL[a.type], detail: `+${tokens} ${tokens > 1 ? 'fichas' : 'ficha'} · +${coins} monedas · ${ALTAR_REWARD[a.type]}` });
  }

  /** Altar de despido: the scene waits paused while the player picks who leaves (or nobody). */
  private offerDismiss() {
    const hook = this.cfg.hooks.dismiss;
    if (!hook || this.ended || this.levelingUp || this.members.length < 2) return;
    this.levelingUp = true;
    this.scene.pause();
    void hook(this.members.slice(1).map((m) => m.entry.id)).then((id) => {
      this.levelingUp = false;
      if (this.ended) return;
      this.scene.resume();
      if (id !== null) this.dismissMember(id);
      if (this.xp >= this.xpNext()) this.levelUp();
    });
  }

  /** Sends a teammate off: his techniques, his health share and his combined techniques go with him; the slot is free again. */
  dismissMember(id: number) {
    const i = this.members.findIndex((m) => m.entry.id === id);
    if (i <= 0) return; // never the captain
    const [m] = this.members.splice(i, 1);
    this.members.forEach((o, k) => { o.slot = k - 1; });
    this.dismissed.add(id);
    this.maxHp = Math.max(1, this.maxHp - m.hpAdd);
    this.hp = Math.min(this.hp, this.maxHp);
    const { x, y } = m.f;
    this.fx.implode(x, y - 10, 30, 0xb0b6c8, 300);
    this.fx.label(x, y - 34, `${m.entry.name} deja el equipo`, '#d0d6e8');
    this.tweens.add({ targets: m.f.container, alpha: 0, y: y - 12, duration: 300, onComplete: () => m.f.destroy() });
    if (this.lastUpgrade?.playerId === id) this.lastUpgrade = null;
    sfx('whoosh');
  }

  /** Points of interest for the minimap and the arrows at the edge of the screen (drawn by the HUD, in screen pixels). */
  private pushMarkers() {
    const hook = this.cfg.hooks.markers;
    if (!hook) return;
    const c = this.members[0].f, cam = this.cameras.main, pois: Poi[] = [];
    if (this.altar) pois.push({ kind: 'evento', icon: ALTAR_ICON[this.altar.type], color: ALTAR_COLOR[this.altar.type], x: this.altar.x, y: this.altar.y, label: ALTAR_LABEL[this.altar.type], priority: 3 });
    for (const e of this.enemies) {
      if (e.kind === 'boss') pois.push({ kind: 'jefe', icon: '☠', color: 0xff3030, x: e.pos.x, y: e.pos.y, label: e.unit.name, priority: 4 });
      else if (e.kind === 'miniboss') pois.push({ kind: 'minijefe', icon: '♛', color: 0xff8a3a, x: e.pos.x, y: e.pos.y, label: e.unit.name, priority: 2 });
    }
    // pre-2.0 (IDEA-45F61B95): the partner on the minimap, and an arrow to him when he is off screen
    const pp = this.coop?.partnerPos();
    if (pp && this.coop) pois.push({ kind: 'companero', icon: this.coop.partnerDown ? '✚' : '👥', color: this.coop.partnerDown ? 0xff6a5a : 0x4fd8ff, x: pp.x, y: pp.y, label: this.coop.partnerName, priority: this.coop.partnerDown ? 5 : 3 });
    for (const p of this.pickups) if (p.kind === 'item' && (p.drop?.id === 'cofre' || p.drop?.id === 'cofretec' || p.drop?.id === 'iman')) pois.push({ kind: 'objeto', icon: p.drop.id === 'iman' ? '∩' : '✪', color: 0xffc83a, x: p.x, y: p.y, label: p.drop.label, priority: 1 });
    hook({ pois, player: { x: c.x, y: c.y }, world: { w: this.arena.widthPx, h: this.arena.heightPx }, view: { x: cam.worldView.x, y: cam.worldView.y, w: cam.worldView.width, h: cam.worldView.height, zoom: cam.zoom, screenW: cam.width, screenH: cam.height } });
  }

  private requestPause() {
    if (this.ended || this.levelingUp) return;
    this.scene.pause();
    this.cfg.hooks.pause();
  }

  private pushHud() {
    const goals = comboGoals(this.members.map((m) => ({ entry: m.entry, state: m.state })), this.combos.keys()); // v1.7
    this.cfg.hooks.hud({
      hp: Math.max(0, this.hp), maxHp: this.maxHp, xp: Math.floor(this.xp), xpNext: this.xpNext(), level: this.level,
      timeSec: this.runTime, durationSec: this.cfg.map.durationSec, kills: this.kills,
      team: this.members.map((m) => ({ id: m.entry.id, techs: m.state.slots.map((_, i) => {
        const t = this.activeTech(m, i);
        if (!t) return null;
        const level = this.techLevel(m, i);
        return { name: t.name, type: t.type, level, evolution: evolutionLabel(t, level), cd: Math.max(0, Math.min(1, m.cds[i] / Math.max(1, m.maxCd[i]))), aura: t.aura !== undefined,
          ...(() => { const h = comboHints(goals, m.entry.id, t.name, level + 1)[0]; return { combo: h?.name, comboNeed: h?.need }; })() };
      }), aura: m.entry.aura ? { id: m.entry.aura.id, name: m.entry.aura.name } : null })),
      boss: (() => { const b = this.boss ?? this.rival; return b ? { name: b.unit.name, hp: Math.max(0, b.hp), maxHp: b.maxHp, title: this.kitOf(b).title, phase: b.phase ?? 0, rival: !!b.rival } : null; })(),
      rerolls: this.rerolls, formation: this.formation, formationChangedAt: this.formationChangedAt,
      hurtAt: this.hurtAt, healAt: this.healAt, now: this.runTime, upgraded: this.lastUpgrade, runCoins: this.bonusCoins, runTokens: this.bonusTokens,
      shield: this.buffOn('escudo') ? 1 : 0,
      resonance: [...new Set(this.members.flatMap((m) => m.state.slots.map((_, i) => this.activeTech(m, i)?.element ?? '')))].filter(Boolean)
        .map((element) => ({ element, bonus: resonanceBonus(this.elementCount(element)) })).filter((r) => r.bonus > 0),
      synergies: this.synergyList(),
      altar: this.altar ? { type: this.altar.type, label: ALTAR_LABEL[this.altar.type], task: ALTAR_TASK[this.altar.type], state: this.altar.state,
        inside: Math.hypot(this.members[0].f.x - this.altar.x, (this.members[0].f.y - this.altar.y) * 1.3) < ALTAR_RADIUS, waitLeft: this.altarWait,
        rival: this.altarRival ? { id: this.altarRival.entry?.id ?? null, name: this.altarRival.unit.name, team: this.altarRival.entry?.teams[0] ?? '' } : null, progress: this.altar.progress, goal: this.altar.goal,
        timeLeft: this.altar.timeLeft, dist: Math.round(Math.hypot(this.altar.x - this.members[0].f.x, this.altar.y - this.members[0].f.y) / 32) } : null,
      buffs: [...this.buffs].filter(([, b]) => b.until > this.runTime).map(([id, b]) => ({ id, left: b.until - this.runTime, total: b.total, label: this.boostLabel(id) })),
      endless: this.endless ? { mult: this.endlessScaleNow().hp, sec: this.runTime - this.endless.since, phase: endlessPhase(this.endlessMin()).name } : null,
      combos: [...this.combos].map(([id, s]) => { const d = COMBOS.find((x) => x.id === id)!; return { name: d.name, level: s.level, cd: Math.max(0, Math.min(1, s.cd / d.cooldownMs)) }; }),
      comboGoals: goals.map((g) => ({ id: g.combo.id, name: g.combo.name, complete: g.complete, ready: g.ready, parts: g.parts })),
      ults: this.members.filter((m) => m.ult).map((m) => ({ playerId: m.entry.id, spirit: m.entry.keshin!.id, tech: m.ult!.tech.name, cd: Math.max(0, Math.min(1, m.cds[ULT] / Math.max(1, m.maxCd[ULT]))), left: Math.max(0, m.cds[ULT] / 1000) })),
      revives: this.reviveCharges, reviveMax: MAX_REVIVES,
    });
  }

  private finish(victory: boolean) {
    if (this.ended) return;
    this.coop?.end(victory);
    this.rec?.event(this.runTime, { k: 'end', win: victory || !!this.endless, kills: this.kills, level: this.level });
    this.ended = true;
    for (const b of this.shots) b.img.destroy();
    for (const h of this.hazards) { h.shadow.destroy(); h.ring.destroy(); h.ball?.destroy(); }
    for (const w of this.shocks) w.g.destroy();
    for (const e of this.enemies) this.disposeTelegraphs(e);
    this.shots = []; this.hazards = []; this.shocks = [];
    this.pushHud();
    const lost = !(victory || this.endless);
    this.cfg.hooks.end({ death: (lost || (this.endless && this.hp <= 0)) && this.lastHit ? { ...this.lastHit } : undefined, mapId: this.cfg.map.id, rank: this.rank.id, victory: victory || !!this.endless, endlessSec: this.endless ? this.runTime - this.endless.since : 0, endlessPhase: this.endless ? endlessPhase(this.endlessMin()).name : undefined, endlessBosses: this.endless?.bosses ?? 0, endlessCoins: this.endless?.coins ?? 0, endlessTokens: this.endless?.tokens ?? 0, altars: this.altarsDone, damage: Math.round(this.damageDealt), runId: this.runId, captainId: this.members[0].entry.id, teamIds: this.members.map((m) => m.entry.id), timeSec: this.runTime, kills: this.kills, level: this.level,
      minibosses: this.minibossesKilled, bossDefeated: (victory || !!this.endless) && this.bossSpawned, reachedBoss: this.bossSpawned, bonusCoins: this.bonusCoins, bonusTokens: this.bonusTokens,
      formation: this.formation, techUses: this.techUses, techById: this.techById, auraTechUses: this.auraTechUses, auraCombos: this.auraCombos, withAuras: this.members.some((m) => !!m.entry.aura),
      maxTechLevel: Math.max(...this.members.flatMap((m) => Object.values(m.state.levels))), combos: [...this.combos.keys()] });
  }

  // ------------------------------------------------------------- pre-2.0 co-op (coopArena.ts)
  /** what the co-op session may do with this run: closures over the scene's own state */
  private coopPort(): CoopPort {
    const byId = (id: number) => this.enemies.find((e) => e.id === id && !e.dead);
    return {
      scene: this,
      runTime: () => this.runTime,
      captain: () => ({ x: this.members[0].f.x, y: this.members[0].f.y }),
      team: () => this.members.map((m, i) => ({ id: m.entry.id, x: m.f.x, y: m.f.y, vx: i ? m.vx : this.capVx, vy: i ? m.vy : this.capVy, dir: m.f.dir })),
      hp: () => ({ hp: this.hp, max: this.maxHp }),
      isDown: () => this.down,
      setDown: (d) => {
        this.down = d;
        if (d) return;
        for (const m of this.members) m.f.container.setAlpha(1);
        this.hp = Math.max(1, Math.round(this.maxHp * 0.4)); // lifted by the partner: back with 40% and a short safety window
        this.invulnUntil = this.runTime + 2.5;
        const c = this.members[0].f;
        this.fx.pillar(c.x, c.y + 4, 0x8fffa0, 10);
        sfx('evolve');
      },
      enemy: (id) => byId(id),
      enemies: () => this.enemies,
      spawnMirror: (m) => this.spawnMirror(m),
      killMirror: (id, style) => { const e = byId(id); if (e) this.killMirror(e, style); },
      hitFromPartner: (id, v, kx, ky, style) => {
        const e = byId(id);
        if (!e) return;
        e.hp -= v;
        const kr = e.kind === 'boss' ? 0.1 : e.kind === 'miniboss' || e.variant === 'tank' ? 0.3 : 1;
        e.knockX += kx * kr; e.knockY += ky * kr;
        this.fx.flash(e.sprite, 0xffffff, 60);
        if (e.hp <= 0) this.kill(e, style);
      },
      dropMirror: (m) => this.dropMirror(m),
      removePickup: (pid) => {
        const p = this.pickups.find((x) => x.id === pid && x.value >= 0);
        if (!p) return null;
        const out = { kind: p.kind, value: p.value, dropId: p.drop?.id };
        p.img.destroy();
        p.value = -1;
        if (this.coop?.role === 'host') this.coop.onGone(pid);
        return out;
      },
      giftItem: (dropId) => {
        const d = DROPS.find((x) => x.id === dropId);
        const c = this.members[0].f;
        if (d) this.collect({ img: null as never, kind: 'item', value: 0, drop: d, pulled: false, x: c.x, y: c.y, speed: 0, born: this.runTime });
      },
      gainSharedXp: (v) => this.gainXp(v),
      setSharedXp: (xp, level, kills) => { this.xp = xp; this.level = Math.max(this.level, level); this.kills = kills; },
      partnerLevelUp: (level) => {
        this.level = level;
        sfx('levelup');
        const c = this.members[0].f;
        this.fx.label(c.x, c.y - 40, `¡NIVEL ${level}!`, '#ffe24a');
        if (this.levelingUp || this.coopResumePending) { this.coopPendingLevels++; return; }
        this.offerCards(false, level);
      },
      resumeAfterCards: () => {
        if (!this.coopResumePending) return;
        this.coopResumePending = false;
        this.scene.resume();
        if (this.coopPendingLevels > 0) { this.coopPendingLevels--; this.offerCards(false, this.level); }
      },
      enemyShot: (x, y, vx, vy, dmg, by) => { this.hitSrc = { by, attack: 'disparo' }; this.enemyShot(x, y, vx, vy, dmg); },
      hazard: (x, y, dmg, by) => this.dropHazard(x, y, dmg < 0 ? undefined : dmg, { by, attack: 'lluvia de balones' }), // < 0: the guest's ask
      shock: (x, y, dmg, c, by) => { this.hitSrc = { by, attack: 'onda de choque' }; this.addShock(x, y, dmg, c); },
      makeGhost: (entry, x, y) => this.makeGhost(entry, x, y),
      replayShot: (m) => this.replayShot(m),
      partnerUlt: (id, at) => { const k = KESHIN_BY_ID.get(id as KeshinId); spiritApparition(this, id, k?.color ?? '#ffffff', at); },
      end: (v) => this.finish(v),
      banner: (t, c) => this.banner(t, c),
      telegraph: (m) => this.telegraphMirror(m),
      partnerPicking: (on) => this.cfg.hooks.coopPicking?.(on && this.coop ? this.coop.partnerName : null),
    };
  }

  /** guest: a rival the host just spawned, drawn here; the host moves it (snapshots) and decides its health */
  private spawnMirror(m: SpawnMsg) {
    const unit = this.units().get(m.u);
    if (!unit || !this.textures.exists(`unit:${unit.id}`) || this.enemies.some((e) => e.id === m.id)) return;
    const sprite = this.add.sprite(m.x, m.y, `unit:${unit.id}`, 0).setOrigin(unit.originX / unit.frameW, unit.originY / unit.frameH).setScale(m.s);
    const tint = ({ elite: 0xffe08a, runner: 0xb8f0ff, shooter: 0xffa8c8, flanker: 0xb8ffb0, bomber: 0xff9050, tank: 0x8f9fd0 } as Record<string, number>)[m.v ?? ''];
    if (tint !== undefined) sprite.setTint(tint);
    const kind = m.k as UnitInfo['kind'];
    const e: Enemy = { id: m.id, sprite, unit, kind, hp: m.hp, maxHp: m.hp, speed: 0, damage: m.dmg, animTime: 0, dir: 4, hitCd: 0, knockX: 0, knockY: 0,
      radius: 7 * m.s, dead: false, pos: sprite, slowUntil: 0, variant: m.v as Enemy['variant'] };
    if (kind === 'boss') this.boss = e;
    if (kind === 'boss' || kind === 'miniboss') { this.fx.ring(m.x, m.y - 10, 40, 0xff4f4f, 600, 3); this.fx.shake(0.006, 250); sfx('boom'); }
    this.enemies.push(e);
    this.coop?.targets.set(m.id, { x: m.x, y: m.y, dir: 4 });
  }

  /** guest: mirrored rivals glide to the host's positions; only contact with this player's own captain is checked here */
  private updateMirrors(dt: number) {
    const cap = this.members[0], k = Math.min(1, dt / 70);
    const shield = this.shield(), taken = FORMATIONS[this.formation].damageTakenMult;
    for (const e of this.enemies) {
      const t = this.coop?.targets.get(e.id ?? -1);
      if (t) { e.sprite.x += (t.x - e.sprite.x) * k; e.sprite.y += (t.y - e.sprite.y) * k; e.dir = t.dir; }
      e.animTime += dt;
      const anim = e.unit.animations.find((a) => a.index === 8 + e.dir) ?? e.unit.animations.find((a) => a.index === e.dir);
      if (anim) { const { frame } = frameAt(anim.frames, e.animTime); e.sprite.setFrame(frame.f).setFlipX(anim.mirror); }
      e.sprite.setDepth(e.pos.y);
      e.hitCd -= dt;
      const d = Math.hypot(cap.f.x - e.pos.x, cap.f.y - e.pos.y);
      const guarded = cap.guardUntil > this.runTime;
      if (!guarded && d < 12 + e.radius && e.hitCd <= 0
        && this.hurtCaptain(e.damage, { by: e.unit.name, attack: e.kind === 'boss' || e.kind === 'miniboss' ? 'choque' : 'entrada' }, shield, taken)) e.hitCd = 900;
    }
    this.enemies = this.enemies.filter((e) => !e.dead);
  }

  /** guest: the host knocked a rival out: the same knock-out, without drops (those come from the host too) */
  private killMirror(e: Enemy, style: FxStyle) {
    e.dead = true;
    this.rollGoldKey(e); // 2.1: the guest rolls on the knock-outs he sees too
    this.altarCount(e);
    this.disposeTelegraphs(e);
    if (e === this.boss) this.boss = null;
    const x = e.pos.x, y = e.pos.y - 6, sp = e.sprite;
    this.fx.burst(style, x, y - 4, 6, 50);
    this.fx.ring(x, y - 4, 12, 0xffffff, 180, 2);
    this.tweens.killTweensOf(sp);
    const away = Math.sign(x - this.members[0].f.x) || 1;
    this.tweens.add({ targets: sp, x: sp.x + away * 14, y: sp.y - 10, angle: away * 70, alpha: 0, duration: e.kind === 'boss' ? 1100 : 240, ease: 'Quad.easeOut', onComplete: () => sp.destroy() });
    this.coop?.targets.delete(e.id ?? -1);
  }

  /** guest: the warning of a boss attack, as on the host's screen; the entity's blow (majin) can hit this captain */
  private telegraphMirror(m: TeleMsg) {
    const rot = Math.atan2(m.dy, m.dx);
    let g: Phaser.GameObjects.GameObject;
    if (m.k === 'carga' || m.k === 'majin') {
      const len = m.k === 'carga' ? 190 : 240, w = m.k === 'carga' ? 22 * m.s : 84;
      g = this.add.rectangle(m.x + m.dx * len / 2, m.y - 8 + m.dy * len / 2, len, w, m.c, 0.2).setRotation(rot).setStrokeStyle(2, 0xff5050, 0.9).setDepth(-9800);
      this.tweens.add({ targets: g, alpha: 0.55, duration: 160, yoyo: true, repeat: 3 });
    } else if (m.k === 'abanico') {
      const c = this.add.container(m.x, m.y - 8).setDepth(-9800);
      for (const off of [-0.45, 0, 0.45]) c.add(this.add.rectangle(0, 0, 200, 6, m.c, 0.35).setOrigin(0, 0.5).setRotation(rot + off));
      g = c;
    } else {
      const ring = this.add.circle(m.x, m.y - 10, 18 * m.s, m.c, 0.15).setStrokeStyle(3, m.c).setDepth(m.y + 1);
      this.tweens.add({ targets: ring, scale: 1.8, alpha: 0, duration: 650 });
      g = ring;
    }
    this.time.delayedCall(1300, () => g.destroy());
    if (m.k === 'majin') this.time.delayedCall(1050, () => {
      const c = this.members[0].f, rx = c.x - m.x, ry = c.y - 8 - m.y, along = rx * m.dx + ry * m.dy, side = Math.abs(rx * m.dy - ry * m.dx);
      if (along > 0 && along < 240 && side < 44) this.hurtCaptain(m.dmg * 1.5, { by: m.by, attack: 'golpe de la entidad' });
      this.fx.shake(0.008, 220);
    });
  }

  /** guest: something the host dropped */
  private dropMirror(m: DropMsg) {
    if (this.pickups.some((p) => p.id === m.pid) || !m.tex) return;
    const [atlas, frame] = m.tex.split(':');
    const img = m.k === 'item' && atlas === 'items' ? this.add.image(m.x, m.y, 'items', frame) : this.add.image(m.x, m.y, m.tex);
    img.setDepth(m.y - 1);
    this.pickups.push({ id: m.pid, img, kind: m.k, value: m.v, drop: m.d ? DROPS.find((d) => d.id === m.d) : undefined, pulled: false, x: m.x, y: m.y, speed: 0, born: this.runTime });
  }

  /** the partner's footballer, in his own kit (driven by his snapshots) */
  private makeGhost(entry: RosterEntry, x: number, y: number) {
    const kit = this.cfg.coop?.partner.kit ?? null;
    const body = this.cfg.manifest.bodies[entry.body] ?? this.cfg.manifest.bodies.field!;
    const keeper = entry.body === 'gk' && !!kit?.gk;
    const kitTexture = kit ? (keeper ? kit.gk! : kit.field) : null;
    const baseKey = kitTexture && this.textures.exists(`kit:${kitTexture}`) ? `kit:${kitTexture}` : bodyKey(entry.body);
    const fromSkin = kitTexture && kit ? (keeper ? kit.gkSkin : kit.fieldSkin) : body.skin;
    return new Footballer(this, entry, body, x, y, skinnedTexture(this, baseKey, body, fromSkin, entry.skin));
  }

  /** the partner's technique, drawn here: the same charge and ball, flying to where he aimed (it hurts nothing here) */
  private replayShot(m: FxMsg) { drawShot(this, this.fx, m); }

  /** pre-2.0 HUD: the partner's name, health, downed state and the revive progress */
  coopHud() {
    const c = this.coop;
    if (!c) return null;
    // IDEA-45F61B95: own Auras and combos go to the partner (only sent when they change)
    c.meta({ auras: this.members.filter((m) => m.entry.aura).map((m) => ({ carrier: m.entry.name, name: m.entry.aura!.name, element: m.entry.aura!.element ?? null })),
      combos: [...this.combos].map(([id, st]) => ({ name: COMBOS.find((x) => x.id === id)?.name ?? id, level: st.level })) });
    return { name: c.partnerName, hp: Math.max(0, c.partnerHp.hp), max: c.partnerHp.max, down: c.partnerDown, connected: c.connected, meDown: this.down, revive: c.reviveProgress,
      partnerRevive: c.partnerRevive, picking: c.partnerPicking, meta: c.partnerMeta };
  }

  /**
   * 2.1: the Llave dorada (season pass premium). It jumps out of the rival with a golden flash, hangs a moment and flies
   * into the captain; then the app shows «¡Has obtenido el pase premium!». Only once per run.
   */
  private rollGoldKey(e: Enemy) {
    if (this.goldChance <= 0 || this.cfg.training || Math.random() >= this.goldChance) return;
    this.goldChance = 0;
    const x = e.pos.x, y = e.pos.y - 14;
    this.fx.pillar(x, y + 10, 0xffd23f, 10);
    this.fx.ring(x, y, 30, 0xffe94a, 500, 4);
    this.fx.burst('fuego', x, y, 18, 90, true);
    sfx('legend');
    const key = this.textures.exists('pase:dorada') ? this.add.image(x, y, 'pase:dorada').setScale(1.4) : this.add.star(x, y, 5, 5, 11, 0xffd23f);
    key.setDepth(9500);
    const glow = this.add.circle(x, y, 18, 0xffe94a, 0.35).setDepth(9499);
    this.tweens.add({ targets: [key, glow], y: y - 34, duration: 520, ease: 'Back.easeOut' });
    this.tweens.add({ targets: key, angle: 360, duration: 900 });
    this.tweens.add({ targets: glow, scale: 1.8, alpha: 0.15, duration: 520, yoyo: true, repeat: 1 });
    this.time.delayedCall(1100, () => {
      const c = this.members[0]?.f;
      if (!c || !key.active) { key.destroy(); glow.destroy(); this.cfg.hooks.goldKey?.(); return; }
      this.tweens.add({ targets: [key, glow], x: c.x, y: c.y - 16, scale: 0.6, duration: 420, ease: 'Quad.easeIn', onComplete: () => {
        this.fx.ring(c.x, c.y - 12, 26, 0xffd23f, 420, 4);
        key.destroy(); glow.destroy();
        this.cfg.hooks.goldKey?.();
      } });
    });
  }

  /** 2.02 Métricas: the team's active warrior spirit, its ultimates and the damage right after them (null: none, or training) */
  spiritStats(): { spirit: string; casts: number; damage: number } | null {
    if (this.cfg.training) return null;
    const spirit = this.members.find((m) => m.ult)?.entry.keshin?.id ?? [...this.ultLog.keys()][0];
    if (!spirit) return null;
    const l = this.ultLog.get(spirit) ?? { casts: 0, damage: 0 };
    return { spirit, casts: l.casts, damage: Math.round(l.damage) };
  }

  /** 2.02: the recording of this run, once (the app uploads it); null when the run was not recorded */
  takeReplay() { const r = this.rec; this.rec = null; return r; }

  /** Public for the pause menu / HUD buttons. */
  forceEnd() { this.finish(false); }
  cycleFormation() { this.setFormation(FORMATION_ORDER[(FORMATION_ORDER.indexOf(this.formation) + 1) % 3]); }
  selectFormation(id: FormationId) { this.setFormation(id); }
  /** settings changed during the run (pause screen, options): applied at once, the effects work on a copy of them */
  liveSettings(s: Settings) {
    Object.assign(this.fx.settings, { shake: s.shake, flashes: s.flashes, reducedMotion: s.reducedMotion, damageNumbers: s.damageNumbers, particles: s.particles });
  }

  /** Debug/test hook used by the browser smoke test. */
  /** Real values of the build right now, for the pause screen (same formulas as combat). */
  buildStats() {
    const fx = this.talents();
    const f = FORMATIONS[this.formation];
    const gloves = this.members.some((m) => m.entry.position === 'GK') ? 1 - this.cfg.perks.gloveReduction : 1;
    const taken = capTaken((1 - this.shield()) * gloves * (1 + fx.taken) * this.cfg.perks.damageTakenMult) * f.damageTakenMult;
    return {
      pickupPx: this.pickupRange(),
      damageTakenPct: Math.round(taken * 100),
      cooldownPct: Math.round(capCooldown(this.mods.cooldown * this.cfg.perks.cooldownMult * (1 - fx.cooldown)) * f.cooldownMult * 100),
      areaPct: Math.round(capArea(this.mods.area * this.cfg.perks.areaMult) * 100),
      luckPct: Math.round(capLuck(this.mods.luck + this.cfg.perks.luck + fx.luck) * 100),
      revives: this.reviveCharges,
      formation: f.label,
    };
  }

  debugState() {
    return { members: this.members.length, enemies: this.enemies.length, hp: this.hp, time: this.runTime, level: this.level,
      formation: this.formation, team: this.members.map((m) => ({ name: m.entry.name, x: Math.round(m.f.x), y: Math.round(m.f.y) })),
      projectiles: this.projectiles.length, guardBlocks: this.guardBlocks, hitsTaken: { ...this.hitsTaken }, maxHp: this.maxHp,
      dashing: this.members.filter((m) => m.dash).length, rank: this.rank.id, shots: this.shots.length, hazards: this.hazards.length,
      combos: Object.fromEntries(this.combos), elites: this.enemies.filter((e) => e.variant === 'elite').length, runners: this.enemies.filter((e) => e.variant === 'runner').length };
  }
}

function norm(x: number, y: number): [number, number] {
  const l = Math.hypot(x, y) || 1;
  return [x / l, y / l];
}
