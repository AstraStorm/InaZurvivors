import Phaser from 'phaser';
import type { Manifest, MapInfo, RosterEntry, Technique, UnitInfo } from '../data/manifest';
import { Footballer, bodyKey, headKey } from './Footballer';
import { skinnedTexture } from './skin';
import { analogMove, firstPad } from './controls';
import { masteryDamage, resonanceBonus } from '../systems/mastery';
import { directionFromVector, frameAt } from './rig';
import { Arena } from './MapBuilder';
import { Fx, fxStyle, trajectory, STYLE_COLORS, type FxStyle, type Trajectory } from './fx';
import { charge, impact, recipeFor, type Recipe } from './supertech';
import { sfx, setVolume } from './sfx';
import { MAX_TECH_LEVEL, techStats, type TechStats } from '../systems/techniques';
import { applyCard, drawCards, MAX_TEAM, newMemberState, type Card, type TeamMemberState } from '../systems/cards';
import { baseMods, modDef } from '../systems/runmods';
import { ALTAR_EVERY_SEC, ALTAR_ICON, ALTAR_INFO, ALTAR_WAIT_SEC, ALTAR_LABEL, ALTAR_MODE, ALTAR_RADIUS, ALTAR_COLOR, ALTAR_REWARD, ALTAR_TASK, ALTAR_TYPES, FIRST_ALTAR_SEC, createAltar, stepAltar, type Altar } from '../systems/altars';
import { BAG_COINS, CHEST_COINS, DROPS, MAGNET_GAP_SEC, MAX_PICKUPS, rollDrop, rollXpTier, SHIELD_REDUCTION, XP_TIERS, type BuffId, type DropDef } from '../systems/items';
import { evolutionLabel, evolvesAt } from '../systems/evolution';
import { starBonus } from '../systems/gacha';
import { canStartGuardedMove, GUARD_LOCKOUT_SEC } from '../systems/combat';
import { FORMATIONS, FORMATION_ORDER, headingFromVector, slotPositions, type FormationId } from '../systems/formations';
import type { PerkEffects } from '../systems/perks';
import type { Settings } from '../systems/save';
import type { RunResult } from '../systems/economy';
import { RANK_ORDER, rankDef, waveIntensity, type RankDef } from '../systems/difficulty';
import { capArea, capCooldown, capCrit, capLuck, capPickup, capRegen, capSpeed, capTaken, capXp, CAPS, softCap } from '../systems/balance';
import { endlessActive, endlessCoins, endlessPhase, endlessScale } from '../systems/endless';
import { bossKit, bossPhase, rivalKit, type AttackId, type BossKit } from '../systems/bossKit';
import { chemistry } from '../systems/kitBonus';
import { HERO_AURA } from '../systems/ascension';
import { adaptedPassive, emptyFx, TALENTS, talentScale, type TalentFx } from '../systems/talents';
import { COMBOS, COMBO_MAX_LEVEL, comboDamage, comboMembers, comboReady, type ComboDef } from '../systems/combos';
import type { Rank } from '../systems/save';

export interface HudTech { name: string; type: Technique['type']; level: number; evolution: string; cd: number }
export interface HudMember { id: number; techs: (HudTech | null)[] }
export interface HudState {
  hp: number; maxHp: number; xp: number; xpNext: number; level: number; timeSec: number; durationSec: number;
  kills: number; team: HudMember[]; boss: { name: string; hp: number; maxHp: number; title: string; phase: number; rival: boolean } | null;
  rerolls: number; formation: FormationId; formationChangedAt: number; hurtAt: number; now: number;
  buffs: { id: BuffId; left: number; total: number }[];
  runCoins: number; runTokens: number; shield: number;
  resonance: { element: string; bonus: number }[];
  altar: { type: Altar['type']; label: string; task: string; state: Altar['state']; progress: number; goal: number; timeLeft: number; dist: number; inside: boolean; waitLeft: number;
    rival: { id: number | null; name: string; team: string } | null } | null;
  /** last technique that went up a level, so the HUD can pulse it */
  upgraded: { playerId: number; slot: number; at: number } | null;
  /** special slot of the combined techniques (0 = ready) */
  combos: { name: string; level: number; cd: number }[];
  /** endless survival: difficulty multiplier and seconds survived after the boss */
  endless: { mult: number; sec: number; phase: string } | null;
}

/** Point of interest on the pitch, for the minimap and the arrows at the edge of the screen. */
export interface Poi { kind: 'evento' | 'jefe' | 'minijefe' | 'objeto'; icon: string; color: number; x: number; y: number; label: string; priority: number }
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
  markers?(m: MarkerState): void;
  /** an event just ended: what happened, shown as a card */
  event?(r: { ok: boolean; title: string; detail: string }): void;
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
}

interface Member {
  f: Footballer; state: TeamMemberState; entry: RosterEntry; damageMult: number;
  cds: number[]; maxCd: number[]; styles: FxStyle[]; trajs: Trajectory[]; recipes: Recipe[];
  slot: number; windup: { i: number; until: number } | null;
  dash: { fromX: number; fromY: number; toX: number; toY: number; t: number; dur: number; hits: Set<Enemy>; dmg: number; style: FxStyle; left: number } | null;
  vx: number; vy: number; settled: boolean;
  /** contact-immune until this run time (only while a dribble moves the player) */
  guardUntil: number;
  /** no new dribble may start before this run time: immunity can't be chained */
  guardLock: number;
}
interface Enemy {
  sprite: Phaser.GameObjects.Sprite; unit: UnitInfo; hp: number; maxHp: number; speed: number; damage: number;
  kind: UnitInfo['kind']; animTime: number; dir: number; hitCd: number; knockX: number; knockY: number;
  radius: number; dead: boolean; pos: { x: number; y: number }; slowUntil: number; altarWave?: boolean;
  variant?: 'elite' | 'runner' | 'shooter' | 'flanker' | 'bomber' | 'tank';
  /** flanker: the side it comes from; shooter and bomber: the warning being shown */
  side?: number; fireCd?: number; aim?: { t: number; dx: number; dy: number; gfx: Phaser.GameObjects.Rectangle }; fuse?: { t: number; gfx: Phaser.GameObjects.Arc };
  /** boss/miniboss pattern timer and the attack being telegraphed or performed */
  patternCd?: number; pattern?: { kind: AttackId; t: number; dx: number; dy: number; gfx?: Phaser.GameObjects.GameObject; n?: number };
  kit?: BossKit; phase?: number; lastAttack?: AttackId; rival?: boolean;
}

/** width in radians of the opening of a shock wave */
const SHOCK_GAP = 1.1;
const BOMB_RADIUS = 52;
interface EnemyShot { img: Phaser.GameObjects.Image; x: number; y: number; vx: number; vy: number; life: number; damage: number }
interface Hazard { x: number; y: number; t: number; fall: number; r: number; damage: number; shadow: Phaser.GameObjects.Ellipse; ring: Phaser.GameObjects.Ellipse; ball?: Phaser.GameObjects.Image }
interface Projectile {
  ball: Phaser.GameObjects.Image; aura: Phaser.GameObjects.Arc; x: number; y: number; vx: number; vy: number; t: number;
  traj: Trajectory; style: FxStyle; damage: number; pierce: number; life: number; hits: Set<Enemy>; knock: number;
  level: number; explode: boolean; scale: number; targetY?: number; phase: number; dragon: boolean; recipe: Recipe; blast: number; exploded?: boolean;
}
/** x/y is the real position; the image only adds a bob on top while it rests, so nothing fights the pull */
interface Pickup { img: Phaser.GameObjects.Image; kind: 'xp' | 'item'; value: number; drop?: DropDef; pulled: boolean; x: number; y: number; speed: number; born: number }

const MAX_ENEMIES = 150;

export class ArenaScene extends Phaser.Scene {
  private cfg!: ArenaInit;
  private arena!: Arena;
  private fx!: Fx;
  private members: Member[] = [];
  private enemies: Enemy[] = [];
  private projectiles: Projectile[] = [];
  private pickups: Pickup[] = [];
  private trail: { x: number; y: number }[] = [];
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;
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
  private ended = false;
  private hudAcc = 0;
  private rerolls = 2;
  private levelingUp = false;
  private formation: FormationId = 'equilibrada';
  private formationChangedAt = -10;
  private hurtAt = -10;
  /** shared i-frames: a crowd touching the squad at once costs one hit, not ten */
  private invulnUntil = 0;
  private hitsTaken: Record<string, number> = {};
  private guardBlocks = 0;
  private mods = baseMods();
  private taken: Record<string, number> = {};
  private buffs = new Map<BuffId, { until: number; total: number }>();
  private bonusCoins = 0;
  private lastUpgrade: HudState['upgraded'] = null;
  private techUses: Record<string, number> = {};
  private bonusTokens = 0;
  private padHeld: Record<number, boolean> = {};
  private xpCombo = 0;
  private xpComboUntil = 0;
  private techById: Record<string, number> = {};
  private altar: Altar | null = null;
  private altarGfx: Phaser.GameObjects.GameObject[] = [];
  private nextAltarAt = FIRST_ALTAR_SEC;
  private altarKills = 0;
  /** portal events release their rivals a few at a time */
  private portalLeft = 0;
  private portalNext = 0;
  private freezeUntil = 0;
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
  /** brief slow motion before the level-up cards: the moment reads, then the choice */
  private slowmoUntil = 0;
  private secondWindUsed = false;
  private altarsDone = 0;
  private damageDealt = 0;
  private runId = '';
  /** endless survival after the boss: start time, last reward tick, movement in the current tick (anti-AFK) */
  private endless: { since: number; nextTick: number; moved: number; ticks: number; nextBoss: number; nextMiniboss: number; killsAtTick: number; phase: number; bosses: number; coins: number; tokens: number } | null = null;
  private shocks: { x: number; y: number; r: number; gap: number; damage: number; color: number; g: Phaser.GameObjects.Graphics; hit: boolean }[] = [];
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

  constructor() { super('Arena'); }

  init(data: ArenaInit) {
    this.cfg = data;
    this.members = []; this.enemies = []; this.projectiles = []; this.pickups = []; this.trail = [];
    this.hp = this.maxHp = 100; this.xp = 0; this.level = 1; this.kills = 0; this.runTime = 0; this.spawnAcc = 0;
    this.flowAcc = 0; this.fadeAcc = 0; this.minibossesSpawned = 0; this.minibossesKilled = 0; this.boss = null;
    this.bossSpawned = false; this.ended = false; this.rerolls = 2 + data.perks.extraRerolls; this.levelingUp = false;
    this.formation = data.formation; this.formationChangedAt = -10; this.hurtAt = -10; this.heading = 0; this.capVx = 0; this.capVy = 0; this.invulnUntil = 0; this.hitsTaken = {};
    this.rng = new Phaser.Math.RandomDataGenerator([String(data.seed ?? Date.now())]);
    this.mods = baseMods(); this.taken = {}; this.buffs = new Map(); this.bonusCoins = 0; this.lastUpgrade = null; this.techUses = {}; this.guardBlocks = 0;
    this.padHeld = {}; this.xpCombo = 0; this.xpComboUntil = 0; this.techById = {};
    this.rank = rankDef(data.rank); this.shots = []; this.hazards = []; this.nextHazardAt = 20; this.wavePhase = ''; this.combos = new Map(); this.slowmoUntil = 0; this.endless = null; this.secondWindUsed = false; this.altarsDone = 0; this.damageDealt = 0;
    this.runId = crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`; this.spawnAcc = 1.2; // first rivals within a second or two
    this.bonusTokens = 0; this.altar = null; this.altarGfx = []; this.altarTag = null; this.rival = null; this.altarRival = null; this.fxCache = null; this.fxAt = -1; this.reviveUsed = false; this.shocks = []; this.campSince = 0; this.campWarned = false; this.nextCampHit = 0; this.nextSurround = 60; this.lastMagnetAt = -MAGNET_GAP_SEC; this.nextAltarAt = FIRST_ALTAR_SEC; this.altarKills = 0; this.freezeUntil = 0; this.lure = null;
    setVolume(data.settings.volume);
  }

  preload() {
    const { manifest: m, map, unlocked, team } = this.cfg;
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
    for (const p of new Map([...unlocked, ...team].map((x) => [x.id, x])).values()) sheet(headKey(p.id), p.head);
    const units = new Map(m.units.map((u) => [u.id, u]));
    for (const id of [...map.enemies, ...map.minibosses, ...(map.boss !== null ? [map.boss] : [])]) {
      const u = units.get(id);
      if (u) sheet(`unit:${id}`, u);
    }
    for (const t of Object.values(map.textures)) if (!this.textures.exists(t.key)) this.load.image(t.key, t.texture);
    if (map.baked) for (const f of [...map.baked.tiles, ...map.baked.props]) {
      const key = `bk:${map.id}:${f.src}`;
      if (!this.textures.exists(key)) this.load.image(key, map.baked.base + f.src);
    }
    if (!this.textures.exists('items')) this.load.atlas('items', m.atlases.items.image, m.atlases.items.json);
  }

  create() {
    const { map, settings } = this.cfg;
    this.arena = new Arena(this, map, settings.quality);
    this.arena.build();
    this.fx = new Fx(this, settings);
    this.cameras.main.setBounds(0, 0, this.arena.widthPx, this.arena.heightPx).setZoom(this.zoomFor()).setBackgroundColor(map.ambience);
    // removed on shutdown: a listener left behind would touch a dead camera after the run ends
    const onResize = () => this.cameras.main?.setZoom(this.zoomFor());
    this.scale.on('resize', onResize);
    this.events.once('shutdown', () => this.scale.off('resize', onResize));
    const sp = this.arena.spawnPoint();
    this.cfg.team.slice(0, MAX_TEAM).forEach((p, i) => this.addMember(p, sp.x + (i ? (i % 2 ? -1 : 1) * 18 * Math.ceil(i / 2) : 0), sp.y + (i ? 14 : 0)));
    // soft follow with a small dead zone: the captain can move a little without dragging the view along
    this.cameras.main.startFollow(this.members[0].f.container, true, 0.09, 0.09).setDeadzone(18, 14);
    this.arena.updateFlow(sp.x, sp.y);
    const kb = this.input.keyboard!;
    this.keys = kb.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT,ESC,P,ONE,TWO,THREE') as Record<string, Phaser.Input.Keyboard.Key>;
    kb.on('keydown-ESC', () => this.requestPause());
    kb.on('keydown-P', () => this.requestPause());
    // a key still held after choosing a card repeats: only a fresh press changes the formation
    const fresh = (id: FormationId) => (ev: KeyboardEvent) => { if (!ev.repeat) this.setFormation(id); };
    kb.on('keydown-ONE', fresh('ofensiva'));
    kb.on('keydown-TWO', fresh('equilibrada'));
    kb.on('keydown-THREE', fresh('defensiva'));
    kb.on('keydown-E', () => this.acceptAltar());
    this.events.on('resume', () => { this.input.keyboard?.resetKeys(); });
  }

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
    const state = newMemberState(entry, this.cfg.perks.techSlots, this.cfg.loadout?.[String(entry.id)]);
    const first = entry.techniques[state.slots[0]!];
    const m: Member = {
      f, entry, state, damageMult: sb.damage * this.cfg.perks.damageMult,
      cds: [0, 1, 2, 3].map((k) => 700 + this.members.length * 230 + k * 600), maxCd: [1, 1, 1, 1],
      styles: [0, 1, 2, 3].map(() => fxStyle(first)), trajs: [0, 1, 2, 3].map(() => trajectory(first)),
      recipes: [0, 1, 2, 3].map(() => recipeFor(first, this.fxRarity(entry))),
      slot: this.members.length - 1, windup: null, dash: null, vx: 0, vy: 0, settled: false, guardUntil: 0, guardLock: 0,
    };
    this.members.push(m);
    const add = Math.round((this.members.length === 1 ? 160 : 40) * sb.hp * this.cfg.perks.hpMult);
    if (this.members.length === 1) this.maxHp = this.hp = add;
    else { this.maxHp += add; this.hp = Math.min(this.maxHp, this.hp + add); }
    if (this.members.length > 1) this.fx.burst(m.styles[0], x, y - 10, 12, 50);
    if (asc?.hero) { // HÉROE: golden entrance and a lasting aura
      this.fx.rays(x, y - 12, 12, 46, 0xffe27a, 600);
      this.fx.ring(x, y - 10, 30, 0xffd84a, 500, 3);
    }
  }

  /** Rarity used for effect quality: a HÉROE gets the top tier. */
  private fxRarity(entry: RosterEntry) { return this.cfg.asc?.[String(entry.id)]?.hero ? 'leyenda' as const : entry.rarity; }

  /** «Espíritu de héroe» (InaZurivors passive): +10% team damage per HÉROE on the pitch. */
  private heroAura() { return 1 + HERO_AURA.teamDamage * Math.min(CAPS.heroes, this.members.filter((m) => this.cfg.asc?.[String(m.entry.id)]?.hero).length); }

  private setFormation(id: FormationId) {
    if (this.ended || this.formation === id) return;
    this.formation = id;
    this.formationChangedAt = this.runTime;
    sfx('whoosh');
    // ghost markers on the new slots
    const cap = this.members[0].f;
    slotPositions(id, cap.x, cap.y, this.heading).slice(0, this.members.length - 1).forEach((p) => {
      const c = this.add.circle(p.x, p.y, 7, 0xffffff, 0.15).setStrokeStyle(1, 0xffe24a).setDepth(50);
      this.tweens.add({ targets: c, alpha: 0, scale: 1.6, duration: 900, onComplete: () => c.destroy() });
    });
  }

  private formationDamage() { return FORMATIONS[this.formation].damageMult; }

  /** Talents of everyone on the pitch plus the adapted passives (talents.ts), refreshed twice a second. */
  private talents(): TalentFx {
    if (this.fxAt > this.runTime - 0.5 && this.fxAt <= this.runTime && this.fxCache) return this.fxCache;
    const f = emptyFx();
    for (const m of this.members) {
      for (let i = 0; i < m.state.slots.length; i++) {
        const t = this.activeTech(m, i);
        if (t?.type === 'talento') TALENTS[t.id]?.apply(f, talentScale(this.techLevel(m, i)));
      }
      adaptedPassive(m.entry)?.apply(f);
    }
    this.fxCache = f; this.fxAt = this.runTime;
    return f;
  }

  private teamDamageBonus() { return Math.max(0.5, 1 + this.talents().team); }

  private shield() {
    let s = 0;
    for (const m of this.members) for (let i = 0; i < m.state.slots.length; i++) {
      const t = this.activeTech(m, i);
      if (t?.type === 'parada') s = Math.max(s, techStats(t, this.techLevel(m, i)).shield);
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
    const idx = m.state.slots[slot];
    return idx === null || idx === undefined ? null : m.entry.techniques[idx] ?? null;
  }

  private techLevel(m: Member, slot: number) { return m.state.levels[m.state.slots[slot] ?? -1] ?? 1; }

  private buffOn(id: BuffId) { return (this.buffs.get(id)?.until ?? 0) > this.runTime; }

  private stats(m: Member, i: number): TechStats {
    const t = this.activeTech(m, i)!;
    const boost = (1 + 0.05 * (this.cfg.shop?.techBoosts[String(t.id)] ?? 0)) * masteryDamage(this.cfg.mastery?.[String(t.id)] ?? 0)
      * (1 + resonanceBonus(this.elementCount(t.element)));
    const captainElement = this.members[0].entry.element;
    const allies = this.members.filter((o) => o !== this.members[0] && o.entry.element === captainElement).length;
    // the build as a whole has a soft limit; the formation and timed buffs stay outside it, they are decisions of the moment
    const fx = this.talents();
    const talent = 1 + (fx.type[t.type] ?? 0) + (fx.element[String(t.element)] ?? 0) + (this.hp < this.maxHp * 0.3 ? fx.lastStand : 0);
    const build = softCap(m.damageMult * boost * talent * this.mods.damage * (1 + this.cfg.perks.synergy * allies) * this.teamDamageBonus() * this.heroAura()
      * chemistry(this.cfg.kitTeam ?? '', this.members.map((x) => x.entry)));
    const s = techStats(t, this.techLevel(m, i), build * (this.buffOn('dano') ? 1.5 : 1) * this.formationDamage());
    s.cooldownMs = Math.round(s.cooldownMs * capCooldown(this.mods.cooldown * this.cfg.perks.cooldownMult * (1 - fx.cooldown)) * (this.buffOn('recarga') ? 0.6 : 1));
    s.radius = Math.round(s.radius * capArea(this.mods.area * this.cfg.perks.areaMult));
    return s;
  }

  // ------------------------------------------------------------- loop
  update(_t: number, dtRaw: number) {
    if (this.ended) return;
    const dt = Math.min(dtRaw, 50) * (performance.now() < this.slowmoUntil ? 0.2 : 1);
    this.runTime += dt / 1000;
    this.moveTeam(dt);
    this.runTechniques(dt);
    this.runCombos(dt);
    this.updateProjectiles(dt);
    this.spawn(dt);
    this.flowAcc += dt;
    if (this.flowAcc > 250) {
      this.flowAcc = 0;
      this.arena.updateFlow(this.members[0].f.x, this.members[0].f.y);
    }
    this.updateEnemies(dt);
    this.updateShots(dt);
    this.updateHazards(dt);
    this.updateShocks(dt);
    this.updatePressure();
    this.updatePickups(dt);
    this.updateAltar(dt);
    this.updateEndless();
    const regen = capRegen(this.mods.regen + this.cfg.perks.regen + this.talents().regen);
    if (this.talents().revive && !this.reviveUsed && this.hp > 0 && this.hp < this.maxHp * 0.2) {
      this.reviveUsed = true;
      this.hp += this.maxHp * 0.2;
      this.fx.ring(this.members[0].f.x, this.members[0].f.y - 10, 60, 0x5ee05a, 500, 3);
      this.banner('¡Resurgir!', '#8fffa0');
      sfx('evolve');
    }
    if (regen) this.hp = Math.min(this.maxHp, this.hp + this.maxHp * regen * dt / 1000);
    this.fadeAcc += dt;
    if (this.fadeAcc > 150) {
      this.fadeAcc = 0;
      this.arena.fadePropsNear(this.members.map((m) => ({ x: m.f.x, y: m.f.y })));
    }
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
    if (this.hp <= 0) this.finish(false);
  }

  private moveTeam(dt: number) {
    const k = this.keys;
    const scheme = this.cfg.settings.moveKeys;
    const letters = scheme !== 'flechas', arrows = scheme !== 'wasd';
    const held = (a: Phaser.Input.Keyboard.Key, b: Phaser.Input.Keyboard.Key) => ((letters && a.isDown) || (arrows && b.isDown) ? 1 : 0);
    let dx = held(k.D, k.RIGHT) - held(k.A, k.LEFT);
    let dy = held(k.S, k.DOWN) - held(k.W, k.UP);
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

  /** Shoulder buttons cycle formations during play. */
  private padButtons() {
    const p = firstPad();
    if (!p) return;
    for (const [i, step] of [[4, 2], [5, 1]] as const) {
      const down = !!p.buttons[i]?.pressed;
      if (down && !this.padHeld[i]) this.setFormation(FORMATION_ORDER[(FORMATION_ORDER.indexOf(this.formation) + step) % 3]);
      this.padHeld[i] = down;
    }
  }

  private nearestEnemy(x: number, y: number, range: number): Enemy | null {
    let best: Enemy | null = null;
    let bd = range * range;
    for (const e of this.enemies) {
      const d = (e.pos.x - x) ** 2 + (e.pos.y - 12 - y) ** 2;
      if (d < bd) { bd = d; best = e; }
    }
    return best;
  }

  // ------------------------------------------------------------- techniques
  private runTechniques(dt: number) {
    for (const m of this.members) {
      const ox = m.f.x, oy = m.f.y - 10;
      if (m.windup) {
        if (this.runTime >= m.windup.until) {
          const i = m.windup.i;
          m.windup = null;
          this.fireShot(m, i, ox, oy);
        }
        continue;
      }
      m.state.slots.forEach((_, i) => {
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
        this.techById[t.id] = (this.techById[t.id] ?? 0) + 1;
        const elementKey = t.element ?? 'neutro';
        this.techUses[elementKey] = (this.techUses[elementKey] ?? 0) + 1;
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
          if (t.type === 'parada') this.hp = Math.min(this.maxHp, this.hp + Math.round(this.maxHp * s.heal));
          m.cds[i] = Math.max(1600, s.cooldownMs * 0.6);
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
        } else if (t.type === 'regate') {
          if (!canStartGuardedMove(this.runTime, m.guardLock)) { m.cds[i] = 120; return; }
          if (m === this.members[0]) {
            // captain: elemental whirl (the captain is never moved automatically)
            const r = s.radius + 6;
            m.guardUntil = this.runTime + 0.26;
            m.guardLock = m.guardUntil + GUARD_LOCKOUT_SEC;
            this.fx.ring(ox, oy + 6, r, c1, 260, 2 + Math.floor(lv / 2));
            for (let k = 0; k < 6 + lv * 2; k++) {
              const a = (k / (6 + lv * 2)) * Math.PI * 2;
              this.fx.burst(style, ox + Math.cos(a) * r, oy + 6 + Math.sin(a) * r * 0.6, 1, 20, k % 2 === 0);
            }
            for (const e of this.enemies) {
              const d = Math.hypot(e.pos.x - ox, e.pos.y - 10 - oy);
              if (d < r + e.radius) this.hit(e, s.damage, (e.pos.x - ox) / (d || 1) * 60, (e.pos.y - oy) / (d || 1) * 60, style);
            }
            sfx('whoosh');
          } else {
            const target = this.nearestEnemy(ox, oy, 120);
            if (!target) { m.cds[i] = 200; return; }
            const ang = Math.atan2(target.pos.y - 10 - oy, target.pos.x - ox);
            const reach = Math.min(110, Math.hypot(target.pos.x - ox, target.pos.y - oy) + 24);
            m.settled = false;
            m.guardUntil = Infinity; // released when the movement phase ends
            m.dash = { fromX: m.f.x, fromY: m.f.y, toX: m.f.x + Math.cos(ang) * reach, toY: m.f.y + Math.sin(ang) * reach,
              t: 0, dur: 220, hits: new Set(), dmg: s.damage, style, left: s.count - 1 };
            sfx('whoosh');
          }
        } else if (t.type === 'defensa') {
          const r = s.radius;
          const wall = /muro|pared|barrera|escudo|armadur|bloque|fortal/i.test(t.name);
          this.fx.ring(ox, oy + 8, r, c1, 320, 2 + Math.floor(lv / 2));
          if (wall) {
            const wv = this.add.rectangle(ox, oy + 2, r * 1.4, 10 + lv * 2, c1, 0.55).setStrokeStyle(2, c2).setDepth(m.f.y + 2);
            this.tweens.add({ targets: wv, scaleY: 2.2, alpha: 0, duration: 380, onComplete: () => wv.destroy() });
          }
          this.fx.burst(style, ox, oy + 8, 8 + lv * 3, 70);
          for (const e of this.enemies) {
            const d = Math.hypot(e.pos.x - ox, e.pos.y - 10 - oy);
            if (d < r + e.radius) {
              this.hit(e, s.damage, (e.pos.x - ox) / (d || 1) * s.knockback, (e.pos.y - oy) / (d || 1) * s.knockback, style);
              if (s.slow < 1) e.slowUntil = this.runTime + 1.5;
            }
          }
        } else if (t.type === 'parada') {
          const heal = Math.round(this.maxHp * s.heal);
          this.hp = Math.min(this.maxHp, this.hp + heal);
          if (/m[aá]gica|majin/i.test(t.name)) {
            // Mano mágica (Majin The Hand): the Majin rises behind the keeper and raises its arm, then the hand blocks
            this.fx.entity('majin', ox, oy + 6, 900, ['mitico', 'leyenda'].includes(m.entry.rarity) || !!this.cfg.asc?.[String(m.entry.id)]?.hero);
            this.fx.magicHand(ox, oy, lv);
            this.fx.ring(ox, oy, s.radius, 0xb36bff, 420, 2);
          } else if (/mano|puño|guante|palma/i.test(t.name)) {
            this.fx.hand(ox, oy, lv, /celest|divin|dios/i.test(t.name) ? 0xffd84a : c2);
            this.fx.ring(ox, oy, s.radius, 0xffe27a, 480, 3); // the push that rejects rivals
          }
          else this.fx.ring(ox, oy, s.radius, 0xffe27a, 520, 3);
          this.fx.burst('energia', ox, oy, 6 + lv * 2, 40, true);
          for (const e of this.enemies) {
            const d = Math.hypot(e.pos.x - ox, e.pos.y - oy);
            if (d < s.radius) this.hit(e, s.damage, (e.pos.x - ox) / (d || 1) * s.knockback, (e.pos.y - oy) / (d || 1) * s.knockback, style);
          }
          if (heal > 0) this.fx.damageNumber(ox, oy - 26, heal, false);
        }
        m.cds[i] = s.cooldownMs;
        m.maxCd[i] = s.cooldownMs;
      });
    }
  }

  /** Special slot of the combined techniques: fires on its own cooldown while every participant is on the pitch. */
  private runCombos(dt: number) {
    for (const [id, st] of this.combos) {
      const def = COMBOS.find((x) => x.id === id)!;
      const who = comboMembers(def, this.members);
      if (!who.length) continue;
      st.cd -= dt;
      if (st.cd > 0) continue;
      const mx = who.reduce((a, m) => a + m.f.x, 0) / who.length, my = who.reduce((a, m) => a + m.f.y, 0) / who.length - 10;
      const target = this.nearestEnemy(mx, my, 300);
      if (!target) { st.cd = 300; continue; }
      st.cd = def.cooldownMs * (1 - 0.06 * (st.level - 1));
      this.comboShot(def, st.level, who, mx, my, target);
    }
  }

  /** Cooperative wind-up (participants jump, their auras meet in the middle), then one big piercing shot. */
  private comboShot(def: ComboDef, level: number, who: Member[], mx: number, my: number, target: Enemy) {
    const t = { name: def.name, element: def.element, power: def.power };
    const recipe = recipeFor(t, 'legendario');
    const style = fxStyle(t);
    const [c1, c2] = STYLE_COLORS[style];
    for (const m of who) {
      m.f.hop(this, 9, 360);
      if (def.effect === 'tiro-rayo') this.fx.lightning(m.f.x, m.f.y - 12, mx, my);
      else this.fx.burst(style, m.f.x, m.f.y - 12, 10, 40, true);
    }
    this.fx.ring(mx, my, 34, c2, 360, 3);
    this.fx.label(mx, my - 30, def.name, '#ffe24a');
    sfx('evolve');
    this.time.delayedCall(360, () => {
      if (this.ended) return;
      const a = Math.atan2(target.pos.y - 12 - my, target.pos.x - mx);
      const dmg = comboDamage(def, level, this.mods.damage * this.teamDamageBonus() * this.formationDamage() * this.cfg.perks.damageMult * this.cfg.perks.comboMult);
      const shots = def.effect === 'tiro-doble' ? [-0.12, 0.12] : [0];
      for (const off of shots) {
        const ang = a + off, speed = 260;
        const color = def.effect === 'tiro-doble' && off > 0 ? 0x8fe8ff : c1;
        const scale = 1.7 + level * 0.1;
        const aura = this.add.circle(mx, my, 8 * scale, color, 0.4).setDepth(8900).setBlendMode(Phaser.BlendModes.ADD);
        const ball = this.add.image(mx, my, recipe.ballTexture).setScale(scale).setDepth(8901);
        this.projectiles.push({ ball, aura, x: mx, y: my, vx: Math.cos(ang) * speed, vy: Math.sin(ang) * speed, t: 0,
          traj: def.effect === 'tiro-doble' ? 'espiral' : 'recta' as Trajectory, style: def.effect === 'tiro-doble' && off > 0 ? 'hielo' : style,
          damage: dmg, pierce: 4 + level, life: 1700, hits: new Set(), knock: 120, level: 6 + level, explode: true, scale, phase: off * 10,
          dragon: def.effect === 'tiro-dragon', recipe, blast: 40 + level * 6 });
      }
      this.fx.shake(0.003, 120);
      sfx('kick');
    });
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
    const style = m.styles[i];
    const traj = m.trajs[i];
    const big = (t.power ?? 0) >= 60;
    const count = s.count + (traj === 'multiple' ? 1 : 0);
    const base = Math.atan2(target.pos.y - 12 - oy, target.pos.x - ox);
    sfx('kick');
    // release: short burst at the foot
    this.fx.ring(ox, oy, 10 + recipe.tier * 4, STYLE_COLORS[recipe.style][1], 180, 2);
    if (recipe.tier >= 2) this.fx.shake(0.0012, 60);
    for (let k = 0; k < count; k++) {
      const a = base + (k - (count - 1) / 2) * 0.2;
      const scale = (big ? 1.3 : 1) * (1 + 0.05 * (lv - 1)) * (1 + recipe.tier * 0.12) * recipe.ballScale;
      const c1 = recipe.id === 'supernova' ? 0xbfa8ff : STYLE_COLORS[style][0];
      let x = ox, y = oy, vx = Math.cos(a) * s.speed, vy = Math.sin(a) * s.speed;
      let targetY: number | undefined;
      if (traj === 'meteoro') {
        // drops from the sky onto the target
        x = target.pos.x + (k - (count - 1) / 2) * 18; y = target.pos.y - 150; vx = 0; vy = s.speed * 1.3; targetY = target.pos.y - 10;
      }
      const aura = this.add.circle(x, y, 6 * scale, c1, 0.35).setDepth(8900).setBlendMode(Phaser.BlendModes.ADD);
      const ball = this.add.image(x, y, recipe.ballTexture).setScale(scale).setDepth(8901);
      this.projectiles.push({ ball, aura, x, y, vx, vy, t: 0, traj, style, damage: s.damage, pierce: s.pierce, life: 1500,
        hits: new Set(), knock: s.knockback, level: lv, explode: big || s.explodes || recipe.tier >= 2, scale, targetY, phase: k * 1.7,
        dragon: recipe.id === 'dragon', recipe, blast: s.radius });
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
        d.hits.add(en);
        this.hit(en, d.dmg, (d.toX - d.fromX) * 0.6, (d.toY - d.fromY) * 0.6, d.style);
      }
    }
    if (p >= 1) {
      if (d.left > 0) {
        const t = this.nearestEnemy(fc.x, fc.y - 10, 100);
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
          this.fx.burst(p.style, rx, ry, 4 + p.level, 70);
          if (p.style === 'rayo' && p.level >= 3) {
            const chain = this.nearestOther(e, 70);
            if (chain) { this.fx.lightning(rx, ry, chain.pos.x, chain.pos.y - 12); this.hit(chain, p.damage * 0.5, 0, 0, 'rayo'); }
          }
          if (p.hits.size > p.pierce) {
            if (p.explode) this.explode(p, rx, ry, false);
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

  private spawnEnemy(unit: UnitInfo, kind: UnitInfo['kind'], hpMult = 1, scale = 1) {
    const cam = this.cameras.main;
    const cap = this.members[0].f;
    // just outside the view, never so close that a spawn lands on top of the squad
    const r = Math.max(190, Math.hypot(cam.width, cam.height) / cam.zoom / 2 + 20);
    const at = this.arena.randomCellAround(cap.x, cap.y, r, r + 140, this.rng);
    if (!at) return null;
    const sprite = this.add.sprite(at.x, at.y, `unit:${unit.id}`, 0)
      .setOrigin(unit.originX / unit.frameW, unit.originY / unit.frameH).setScale(scale);
    const st = unit.stats ?? {};
    const minutes = this.runTime / 60;
    const R = this.rank;
    // plain rivals can come as elites (tough, golden, better drop) or runners (fast, fragile, icy tint)
    const roll = kind === 'enemy' || kind === 'creature' ? this.rng.frac() : 1;
    const ramp = Math.min(1, this.runTime / 60);
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
    const baseHp = 8 + ((st.body ?? 30) + (st.guts ?? 30)) / 14;
    const hp = Math.round(baseHp * (1 + minutes * 0.6) * hpMult * R.hp * vHp * scaling.hp);
    const e: Enemy = {
      sprite, unit, kind, hp, maxHp: hp, speed: (28 + (st.speed ?? 30) * 0.22) * (kind === 'boss' ? 0.8 : 1) * R.speed * vSpeed * scaling.speed,
      damage: Math.round((2 + Math.min(minutes, 9) * 1.15) * (kind === 'boss' ? 2.5 : kind === 'miniboss' ? 2 : 1) * R.damage * (variant === 'elite' || variant === 'tank' ? 1.5 : 1) * scaling.damage),
      animTime: this.rng.between(0, 500), dir: 4, hitCd: 0, knockX: 0, knockY: 0,
      radius: 7 * scale * (variant === 'elite' ? 1.18 : variant === 'tank' ? 1.3 : 1), dead: false, pos: sprite, slowUntil: 0, variant, side: this.rng.frac() < 0.5 ? -1 : 1,
      patternCd: kind === 'boss' ? 3 : kind === 'miniboss' ? 5 : undefined,
    };
    if (kind === 'boss' || kind === 'miniboss') {
      this.fx.ring(at.x, at.y - 10, 40, 0xff4f4f, 600, 3);
      this.fx.shake(0.006, 250);
      sfx('boom');
    }
    this.enemies.push(e);
    return e;
  }

  private spawn(dt: number) {
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
    if (frac >= 1 && !this.bossSpawned) {
      const u = map.boss !== null ? units.get(map.boss) : undefined;
      if (u) this.boss = this.spawnEnemy(u, 'boss', 32, 2.1);
      if (this.boss) { // an entrance worthy of the last fight: a brief slow motion and its name
        this.slowmoUntil = performance.now() + 500;
        this.fx.pillar(this.boss.pos.x, this.boss.pos.y, this.kitOf(this.boss).color, 10);
        this.banner(`¡${this.boss.unit.name}!`, '#ff5a5a');
      }
      // no free spot this frame: try again next one instead of ending the run
      if (this.boss || !u) this.bossSpawned = true;
      if (!u) this.finish(true);
    }
    const wave = waveIntensity(this.runTime);
    if (wave.phase !== this.wavePhase) {
      if (wave.phase === 'presion' && !this.boss) this.banner('¡OLEADA!', '#ff8a5a');
      if (wave.phase === 'respiro' && this.wavePhase === 'presion' && !this.boss) this.banner('Respiro', '#8fe8ff');
      this.wavePhase = wave.phase;
    }
    const interval = Math.max(0.15, 1.3 - Math.min(1, frac) * 1.1) * (this.boss ? 2.5 : 1) * this.rank.spawnInterval / wave.rate / this.endlessScaleNow().spawn;
    this.spawnAcc += dt / 1000;
    while (this.spawnAcc > interval) {
      this.spawnAcc -= interval;
      if (this.enemies.length >= MAX_ENEMIES || !map.enemies.length) break;
      const burst = 1 + Math.floor(frac * 2.6) + (this.members.length >= 5 ? 1 : 0) + (frac > 0.3 ? this.rank.burst : 0);
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
      let tx = cap.x, ty = cap.y, bd = Infinity;
      let target: Member = this.members[0];
      let guarded = false; // touching someone mid-dribble costs no shared HP
      for (const m of this.members) {
        const d = (m.f.x - e.pos.x) ** 2 + (m.f.y - e.pos.y) ** 2;
        if (m.guardUntil > this.runTime) {
          if (d < (12 + e.radius) ** 2) guarded = true;
          continue;
        }
        if (d < bd) { bd = d; tx = m.f.x; ty = m.f.y; target = m; }
      }
      if (bd === Infinity) bd = (cap.x - e.pos.x) ** 2 + (cap.y - e.pos.y) ** 2;
      if (guarded) this.guardBlocks++;
      const dist = Math.sqrt(bd);
      let [fx, fy] = bd < 70 * 70 ? norm(tx - e.pos.x, ty - e.pos.y) : this.arena.flowDir(e.pos.x, e.pos.y, tx, ty);
      // flankers run for the spot ahead of the captain and to one side, so they cut the way instead of chasing it
      if (e.variant === 'flanker' && dist > 70 && dist < 300) {
        const lead = Math.min(1, dist / 160);
        [fx, fy] = norm(tx + this.capVx * 0.8 * lead + -fy * e.side! * 70 - e.pos.x, ty + this.capVy * 0.8 * lead + fx * e.side! * 70 - e.pos.y);
      }
      if (e.variant === 'shooter' && dist < 110) { fx = -fx * 0.7; fy = -fy * 0.7; }
      const held = this.freezeUntil <= this.runTime && (e.variant === 'shooter' || e.variant === 'bomber') && this.rivalBehaviour(e, dist, dt);
      if (e.dead) continue;
      const spd = this.freezeUntil > this.runTime || held ? 0 : e.speed * (e.slowUntil > this.runTime ? 0.6 : 1);
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
      // contact with ANY teammate (captain or follower) hurts the shared bar; followers ignore props, never rivals
      if (!guarded && this.freezeUntil <= this.runTime && Math.sqrt(bd) < 12 + e.radius && e.hitCd <= 0 && this.hurtSquad(target, e.damage, shield, taken)) {
        e.hitCd = 900;
        // the rival bounces off whoever it hit, which also makes the contact readable
        const [nx, ny] = norm(e.pos.x - target.f.x, e.pos.y - target.f.y);
        e.knockX += nx * 90; e.knockY += ny * 90;
      }
      if (e.patternCd !== undefined) this.bossPattern(e, dt);
    }
    this.enemies = this.enemies.filter((e) => !e.dead);
  }

  /** One hit on the shared bar through whichever teammate was touched. False while the shared i-frames last. */
  private hurtSquad(target: Member, raw: number, shield = this.shield(), taken = FORMATIONS[this.formation].damageTakenMult) {
    if (this.runTime < this.invulnUntil || this.ended) return false;
    this.invulnUntil = this.runTime + 0.3;
    const gloves = this.members.some((m) => m.entry.position === 'GK') ? 1 - this.cfg.perks.gloveReduction : 1;
    const dmg = Math.max(1, Math.round(raw * capTaken((1 - shield) * gloves * (1 + this.talents().taken) * this.cfg.perks.damageTakenMult * (this.buffOn('escudo') ? 1 - SHIELD_REDUCTION : 1)) * taken));
    this.hp -= dmg;
    this.hurtAt = this.runTime;
    const who = target === this.members[0] ? 'capitan' : 'companero';
    this.hitsTaken[who] = (this.hitsTaken[who] ?? 0) + 1;
    if (this.cfg.settings.flashes) target.f.flash();
    if (this.cfg.settings.damageNumbers) this.fx.label(target.f.x, target.f.y - 30, `-${dmg}`, '#ff6a6a');
    sfx('hurt');
    return true;
  }

  /** Teammate touching a point, if any (shots and hazards hit followers too). */
  private memberAt(x: number, y: number, r: number): Member | null {
    for (const m of this.members) if (m.guardUntil <= this.runTime && Math.hypot(m.f.x - x, m.f.y - 10 - y) < r) return m;
    return null;
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
    const cap = this.members[0].f;
    const kit = this.kitOf(e);
    const main = e.kind === 'boss' || !!e.rival;
    const forced = this.endless ? Math.floor(endlessPhase(this.endlessMin()).id / 2) : 0;
    const phase = Math.max(forced, main ? bossPhase(e.hp, e.maxHp) : Math.min(1, bossPhase(e.hp, e.maxHp)));
    if (main && phase > (e.phase ?? 0)) {
      e.phase = phase;
      this.fx.ring(e.pos.x, e.pos.y - 10, 70, kit.color, 500, 4);
      this.banner(`${e.rival ? '¡Se pone serio!' : `FASE ${phase + 1}`}`, '#ff8a5a');
      sfx('boom');
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
          this.dropHazard(cap.x + Math.cos(a) * d, cap.y + Math.sin(a) * d * 0.8, e.damage);
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
        for (const m of this.members) {
          const rx = m.f.x - e.pos.x, ry = m.f.y - 8 - e.pos.y, along = rx * p.dx + ry * p.dy, side = Math.abs(rx * p.dy - ry * p.dx);
          if (along > 0 && along < 240 && side < 44) { this.hurtSquad(m, e.damage * 1.5); break; }
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
    this.shocks.push({ x, y, r: 16, gap: this.rng.frac() * Math.PI * 2, damage, color, g: this.add.graphics().setDepth(-9700), hit: false });
    sfx('boom');
  }

  private updateShocks(dt: number) {
    const c = this.members[0].f;
    for (const w of this.shocks) {
      w.r += 165 * dt / 1000;
      w.g.clear().lineStyle(7, w.color, 0.75).beginPath().arc(w.x, w.y, w.r, w.gap + SHOCK_GAP / 2, w.gap - SHOCK_GAP / 2 + Math.PI * 2).strokePath();
      const d = Math.hypot(c.x - w.x, c.y - w.y);
      const off = Math.abs(Phaser.Math.Angle.Wrap(Math.atan2(c.y - w.y, c.x - w.x) - w.gap));
      if (!w.hit && Math.abs(d - w.r) < 11 && off > SHOCK_GAP / 2) { w.hit = true; this.hurtSquad(this.members[0], w.damage); }
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
          for (const m of this.members) if (Math.hypot(m.f.x - e.pos.x, (m.f.y - e.pos.y) * 1.2) < BOMB_RADIUS) { this.hurtSquad(m, e.damage * 1.6); break; }
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
      for (let k = 0; k < 2; k++) this.dropHazard(c.x + this.rng.between(-14, 14), c.y + this.rng.between(-10, 10));
    }
    const every = this.endless ? endlessPhase(this.endlessMin()).surroundEvery : this.rank.surroundEvery;
    if (!this.boss && every && this.runTime >= this.nextSurround && this.runTime > 55) {
      this.nextSurround = this.runTime + every;
      const units = this.cfg.map.enemies.map((id) => this.units().get(id)).filter((u): u is UnitInfo => !!u);
      const n = Math.min(10 + RANK_ORDER.indexOf(this.rank.id) * 3 + Math.floor(this.runTime / 60), MAX_ENEMIES - this.enemies.length);
      const cam = this.cameras.main, r = Math.min(cam.width, cam.height) / cam.zoom / 2 + 30, gap = this.rng.frac() * Math.PI * 2;
      for (let k = 0; k < n && units.length; k++) {
        const a = gap + 0.7 + (k / n) * (Math.PI * 2 - 1.4); // an opening of about 80 degrees to escape through
        const x = c.x + Math.cos(a) * r, y = c.y + Math.sin(a) * r;
        if (!this.arena.walkableAt(x, y, 6)) continue;
        const m = this.spawnEnemy(units[this.rng.between(0, units.length - 1)], 'enemy');
        m?.sprite.setPosition(x, y);
      }
      this.banner('¡Te rodean!', '#ff8a5a');
    }
  }

  private enemyShot(x: number, y: number, vx: number, vy: number, damage: number) {
    if (this.shots.length >= 120) return; // long endless runs: a hard cap keeps the frame rate stable
    const img = this.add.image(x, y, 'fx:ball').setTint(0xff7a5a).setDepth(8800);
    this.shots.push({ img, x, y, vx, vy, life: 4, damage });
  }

  private updateShots(dt: number) {
    const s = dt / 1000;
    for (const b of this.shots) {
      b.life -= s;
      b.x += b.vx * s; b.y += b.vy * s;
      b.img.setPosition(b.x, b.y).setRotation(b.img.rotation + s * 10);
      const m = this.memberAt(b.x, b.y, 11);
      if (m && this.hurtSquad(m, b.damage)) { this.fx.burst('fuego', b.x, b.y, 6, 40); b.life = 0; }
    }
    this.shots = this.shots.filter((b) => { if (b.life > 0) return true; b.img.destroy(); return false; });
  }

  /** One falling ball: warned for 1.1 s by its shadow and ring. */
  private dropHazard(x: number, y: number, damage?: number) {
    if (this.hazards.length >= 40) return;
    const r = 26;
    const shadow = this.add.ellipse(x, y, 4, 3, 0x000000, 0.35).setDepth(-9700);
    const ring = this.add.ellipse(x, y, r * 2, r * 1.5).setStrokeStyle(2, 0xff5050, 0.9).setDepth(-9700);
    this.hazards.push({ x, y, t: 0, fall: 1.1, r, damage: Math.round((damage ?? (5 + this.runTime / 60 * 2) * this.rank.damage) * this.endlessScaleNow().damage), shadow, ring });
  }

  /** Falling balls (every rank): a growing shadow for 1.1 s, then the impact. Hurts rivals too. */
  private updateHazards(dt: number) {
    const s = dt / 1000;
    const every = this.endless ? Math.min(this.rank.hazardEvery || 99, endlessPhase(this.endlessMin()).hazardEvery) : this.rank.hazardEvery;
    if (every && !this.ended && this.runTime >= this.nextHazardAt) {
      this.nextHazardAt = this.runTime + every * (0.8 + this.rng.frac() * 0.4);
      const c = this.members[0].f;
      const n = Math.min(10, 2 + Math.floor(this.runTime / 120));
      for (let k = 0; k < n; k++) {
        const a = this.rng.frac() * Math.PI * 2, d = k === 0 ? this.rng.between(0, 40) : this.rng.between(40, 130);
        this.dropHazard(c.x + Math.cos(a) * d, c.y + Math.sin(a) * d * 0.8);
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
      for (const m of this.members) if (Math.hypot(m.f.x - h.x, (m.f.y - h.y) * 1.3) < h.r + 6) { this.hurtSquad(m, h.damage); break; }
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
  private banner(text: string, color: string) {
    const cam = this.cameras.main;
    const t = this.add.text(cam.width / 2, cam.height * 0.3, text, { fontFamily: '"Press Start 2P"', fontSize: '22px', color, stroke: '#000', strokeThickness: 6 })
      .setOrigin(0.5).setScrollFactor(0).setDepth(9800).setScale(0.6).setAlpha(0);
    this.tweens.add({ targets: t, scale: 1, alpha: 1, duration: 220, ease: 'Back.easeOut', yoyo: true, hold: 700, onComplete: () => t.destroy() });
  }

  private hit(e: Enemy, dmg: number, kx: number, ky: number, style: FxStyle, crit = false) {
    if (e.dead) return;
    const p = this.cfg.perks;
    if (this.rng.frac() < capCrit(p.critChance + this.talents().crit)) { dmg *= 1.8; crit = true; }
    if (this.rng.frac() < p.elementalChance + this.talents().elemental) { dmg *= 1.2; e.slowUntil = this.runTime + 1.5; this.fx.burst(style, e.pos.x, e.pos.y - 10, 4, 30, true); }
    const v = Math.max(1, Math.round(dmg));
    this.damageDealt += Math.min(v, Math.max(0, e.hp));
    e.hp -= v;
    const kr = e.kind === 'boss' ? 0.1 : e.kind === 'miniboss' || e.variant === 'tank' ? 0.3 : 1;
    e.knockX += kx * kr; e.knockY += ky * kr;
    this.fx.flash(e.sprite, 0xffffff, 60);
    if (e.kind !== 'boss' && !this.tweens.isTweening(e.sprite)) {
      const sx = e.sprite.scaleX, sy = e.sprite.scaleY;
      this.tweens.add({ targets: e.sprite, scaleX: sx * 1.18, scaleY: sy * 0.82, duration: 50, yoyo: true, onComplete: () => e.sprite.active && e.sprite.setScale(sx, sy) });
    }
    this.fx.damageNumber(e.pos.x, e.pos.y - 26 * (e.sprite.scale || 1), v, crit || v >= 40);
    if (style === 'hielo') e.speed *= 0.97;
    sfx('hit');
    if (e.hp <= 0) this.kill(e, style);
  }

  private kill(e: Enemy, style: FxStyle) {
    e.dead = true;
    this.kills++;
    this.altarCount(e);
    e.aim?.gfx.destroy(); e.fuse?.gfx.destroy(); e.pattern?.gfx?.destroy(); e.aim = undefined; e.fuse = undefined;
    if (e === this.rival) this.rival = null;
    const x = e.pos.x, y = e.pos.y - 6;
    this.fx.burst(style, x, y - 4, 6, 50);
    // knocked off their feet and gone in a quarter second: clear, not instant
    const sp = e.sprite;
    this.tweens.killTweensOf(sp);
    const away = Math.sign(e.knockX || (x - this.members[0].f.x)) || 1;
    this.tweens.add({ targets: sp, x: sp.x + away * 14, y: sp.y - 10, angle: away * 70, alpha: 0, duration: 240, ease: 'Quad.easeOut', onComplete: () => sp.destroy() });
    if (e.kind === 'miniboss') {
      this.minibossesKilled++;
      this.dropXp(x, y, XP_TIERS[2]);
      this.dropXp(x + 6, y + 4, XP_TIERS[2]);
      this.dropItem(x + 10, y, DROPS.find((d) => d.id === 'chocolate')!);
      if (this.magnetReady()) { this.lastMagnetAt = this.runTime; this.dropItem(x - 10, y, DROPS.find((d) => d.id === 'iman')!); }
      this.fx.shake(0.006, 200);
    } else if (e.kind === 'boss') {
      this.boss = null;
      this.fx.shake(0.01, 400);
      this.onBossDown(x, y);
    } else {
      const rand = () => this.rng.frac();
      if (e.variant === 'elite') { this.dropXp(x, y, XP_TIERS[2]); this.fx.ring(x, y - 6, 22, 0xffd27a, 300, 2); }
      else this.dropXp(x, y, rollXpTier(rand, capLuck(this.mods.luck + this.cfg.perks.luck + this.talents().luck)));
      const d = rollDrop(rand, capLuck(this.mods.luck + this.cfg.perks.luck + this.talents().luck), this.magnetReady());
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
    this.pickups.push({ img, kind: 'xp', value: tier.value, pulled: false, x, y, speed: 0, born: this.runTime });
  }

  private dropItem(x: number, y: number, drop: DropDef) {
    const [atlas, frame] = drop.texture.split(':');
    const img = atlas === 'items' ? this.add.image(x, y, 'items', frame) : this.add.image(x, y, drop.texture);
    img.setDepth(y - 1);
    this.pickups.push({ img, kind: 'item', value: 0, drop, pulled: false, x, y, speed: 0, born: this.runTime });
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
    if (d.info) this.cfg.onPickup?.(d.id, d.label, d.info);
    this.fx.ring(c.x, c.y - 10, 24, 0xffffff, 260, 2);
    this.fx.burst('energia', c.x, c.y - 10, 8, 60, true);
    if (d.id === 'arroz' || d.id === 'chocolate') {
      this.hp = Math.min(this.maxHp, this.hp + Math.round(this.maxHp * (d.id === 'arroz' ? 0.15 : 0.4)));
      sfx('pickup');
    } else if (d.id === 'iman') {
      for (const o of this.pickups) if (o.kind === 'xp') { o.pulled = true; o.speed = Math.max(o.speed, 300); }
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
      this.bonusTokens += 1;
      this.fx.label(c.x, c.y - 34, '+1 ficha', '#8fe8ff');
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
    } else if (d.id === 'cofre') {
      this.bonusCoins += CHEST_COINS;
      this.fx.label(c.x, c.y - 34, `+${CHEST_COINS} monedas`);
      sfx('buy');
    } else {
      const total = (d.seconds ?? 8) * this.cfg.perks.buffMult;
      this.buffs.set(d.id as BuffId, { until: this.runTime + total, total });
      this.fx.label(c.x, c.y - 34, d.label);
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
    const magnet = (46 + this.members.length * 4) * capPickup(this.cfg.perks.magnetMult * this.mods.pickup);
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
    if (this.endless) {
      this.bonusCoins += 60; this.bonusTokens += 1;
      this.endless.coins += 60; this.endless.tokens += 1; this.endless.bosses++;
      this.fx.label(x, y - 30, '¡Jefe derrotado! +60 monedas +1 ficha', '#8fe8ff');
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
        if (e.ticks % 2 === 0) { this.bonusTokens += 1; e.tokens += 1; }
        this.banner(`+${coins} monedas${e.ticks % 2 === 0 ? ' +1 ficha' : ''}`, '#ffe24a');
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
      if (u) { this.boss = this.spawnEnemy(u, 'boss', 32, 2.1); this.banner(`¡${u.name} regresa!`, '#ff5a5a'); }
    }
  }

  private take(p: Pickup) {
    this.collect(p);
    p.img.destroy();
    p.value = -1;
  }

  // ------------------------------------------------------------- progression
  private xpNext() { return 5 + this.level * 6; }

  private gainXp(v: number) {
    this.xp += v * capXp(this.mods.xp * this.cfg.perks.xpMult * (1 + this.talents().xp)) * (this.buffOn('xp') ? 2 : 1);
    if (this.xp >= this.xpNext() && !this.levelingUp) this.levelUp();
  }

  private currentTeam(): TeamMemberState[] { return this.members.map((m) => m.state); }

  private levelUp() {
    if (this.ended) return;
    this.xp -= this.xpNext();
    this.level++;
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
    if (this.ended || this.levelingUp) return;
    this.levelingUp = true;
    this.scene.pause();
    const shop = this.cfg.shop;
    const draw = () => {
      const cards = drawCards({ team: this.currentTeam(), unlocked: this.cfg.unlocked, runLevel: this.level, taken: this.taken,
        bought: (id) => shop?.techUnlocks[String(id)] ?? [], onlyRecruits: recruitOnly }, () => this.rng.frac(), 3 + this.cfg.perks.extraChoices);
      if (recruitOnly) return cards;
      // a combination that just became possible always shows up; upgrades of learned ones now and then
      const pitch = this.members.map((m) => ({ entry: m.entry, state: m.state }));
      for (const c of COMBOS) {
        const got = this.combos.get(c.id);
        if (!got && comboReady(c, pitch)) cards.splice(0, 1, { kind: 'combo', id: c.id, toLevel: 1 });
        else if (got && got.level < COMBO_MAX_LEVEL && this.rng.frac() < 0.35) cards.splice(cards.length - 1, 1, { kind: 'combo', id: c.id, toLevel: got.level + 1 });
      }
      return cards;
    };
    const reroll = () => {
      if (this.rerolls <= 0) return [];
      this.rerolls--;
      return draw();
    };
    this.cfg.hooks.levelUp(draw(), this.rerolls, reroll, level).then((card) => {
      this.levelingUp = false;
      if (this.ended) return;
      this.applyChoice(card);
      this.scene.resume();
      if (this.xp >= this.xpNext()) this.levelUp();
    });
  }

  private applyChoice(card: Card) {
    const c = this.members[0].f;
    if (card.kind === 'combo') {
      const def = COMBOS.find((x) => x.id === card.id);
      if (!def) return;
      const had = this.combos.get(def.id);
      this.combos.set(def.id, { level: card.toLevel, cd: had?.cd ?? 800 });
      this.banner(had ? `${def.name} Nv ${card.toLevel}` : `¡${def.name.toUpperCase()}!`, '#ffe24a');
      sfx('evolve');
      return;
    }
    if (card.kind === 'heal') {
      this.hp = Math.min(this.maxHp, this.hp + Math.round(this.maxHp * card.amount));
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
      if (after.length > before.length && recruit) this.addMember(recruit, c.x, c.y + 12);
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
    const type = ALTAR_TYPES[this.rng.between(0, ALTAR_TYPES.length - 1)];
    this.altar = createAltar(type, at.x, at.y, this.runTime / 60);
    this.altarAccepted = false; this.altarWait = ALTAR_WAIT_SEC; this.altarRival = null;
    if (type === 'duelo') this.altarRival = this.pickRival();
    const color = ALTAR_COLOR[type];
    const area = this.add.ellipse(at.x, at.y, ALTAR_RADIUS * 2, ALTAR_RADIUS * 1.5, color, 0.08).setStrokeStyle(2, color, 0.8).setDepth(-9900);
    const pillar = this.add.image(at.x, at.y + 8, 'fx:altar').setOrigin(0.5, 1).setTint(color).setDepth(at.y + 8);
    const beam = this.add.rectangle(at.x, at.y - 110, 22, 220, color, 0.16).setDepth(at.y + 7);
    this.tweens.add({ targets: beam, alpha: 0.5, scaleX: 1.35, duration: 800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.tweens.add({ targets: area, scaleX: 1.04, scaleY: 1.04, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.altarGfx = [area, pillar, beam];
    // named marker floating over the event
    const tag = this.add.text(at.x, at.y - 56, `${ALTAR_ICON[type]} ${ALTAR_LABEL[type]}`, { fontFamily: '"Press Start 2P"', fontSize: '8px', color: '#ffffff', stroke: '#000', strokeThickness: 4, align: 'center' }).setOrigin(0.5).setDepth(9500);
    this.tweens.add({ targets: tag, y: at.y - 60, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
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
    for (const g of this.altarGfx) { this.tweens.killTweensOf(g); g.destroy(); }
    this.altarGfx = [];
    this.altarTag = null;
    this.altar = null;
    if (this.rival) { // never left behind: no ghost rival or marker after the event ends
      const e = this.rival; this.rival = null;
      if (!e.dead) { e.dead = true; e.pattern?.gfx?.destroy(); this.fx.implode(e.pos.x, e.pos.y - 10, 30, 0xffffff, 260); e.sprite.destroy(); }
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
    this.altarKills = 0;
    if (was === 'idle' && state === 'active') {
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
    const tokens = 1 + (a.type === 'duelo' && rankIdx >= 2 ? 1 : 0);
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
    else this.time.delayedCall(0, () => this.offerCards(true));
    this.bonusCoins += coins;
    this.cfg.hooks.event?.({ ok: true, title: ALTAR_LABEL[a.type], detail: `+${tokens} ${tokens > 1 ? 'fichas' : 'ficha'} · +${coins} monedas · ${ALTAR_REWARD[a.type]}` });
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
    for (const p of this.pickups) if (p.kind === 'item' && (p.drop?.id === 'cofre' || p.drop?.id === 'cofretec' || p.drop?.id === 'iman')) pois.push({ kind: 'objeto', icon: p.drop.id === 'iman' ? '∩' : '✪', color: 0xffc83a, x: p.x, y: p.y, label: p.drop.label, priority: 1 });
    hook({ pois, player: { x: c.x, y: c.y }, world: { w: this.arena.widthPx, h: this.arena.heightPx }, view: { x: cam.worldView.x, y: cam.worldView.y, w: cam.worldView.width, h: cam.worldView.height, zoom: cam.zoom, screenW: cam.width, screenH: cam.height } });
  }

  private requestPause() {
    if (this.ended || this.levelingUp) return;
    this.scene.pause();
    this.cfg.hooks.pause();
  }

  private pushHud() {
    this.cfg.hooks.hud({
      hp: Math.max(0, this.hp), maxHp: this.maxHp, xp: Math.floor(this.xp), xpNext: this.xpNext(), level: this.level,
      timeSec: this.runTime, durationSec: this.cfg.map.durationSec, kills: this.kills,
      team: this.members.map((m) => ({ id: m.entry.id, techs: m.state.slots.map((_, i) => {
        const t = this.activeTech(m, i);
        if (!t) return null;
        const level = this.techLevel(m, i);
        return { name: t.name, type: t.type, level, evolution: evolutionLabel(t, level), cd: Math.max(0, Math.min(1, m.cds[i] / Math.max(1, m.maxCd[i]))) };
      }) })),
      boss: (() => { const b = this.boss ?? this.rival; return b ? { name: b.unit.name, hp: Math.max(0, b.hp), maxHp: b.maxHp, title: this.kitOf(b).title, phase: b.phase ?? 0, rival: !!b.rival } : null; })(),
      rerolls: this.rerolls, formation: this.formation, formationChangedAt: this.formationChangedAt,
      hurtAt: this.hurtAt, now: this.runTime, upgraded: this.lastUpgrade, runCoins: this.bonusCoins, runTokens: this.bonusTokens,
      shield: this.buffOn('escudo') ? 1 : 0,
      resonance: [...new Set(this.members.flatMap((m) => m.state.slots.map((_, i) => this.activeTech(m, i)?.element ?? '')))].filter(Boolean)
        .map((element) => ({ element, bonus: resonanceBonus(this.elementCount(element)) })).filter((r) => r.bonus > 0),
      altar: this.altar ? { type: this.altar.type, label: ALTAR_LABEL[this.altar.type], task: ALTAR_TASK[this.altar.type], state: this.altar.state,
        inside: Math.hypot(this.members[0].f.x - this.altar.x, (this.members[0].f.y - this.altar.y) * 1.3) < ALTAR_RADIUS, waitLeft: this.altarWait,
        rival: this.altarRival ? { id: this.altarRival.entry?.id ?? null, name: this.altarRival.unit.name, team: this.altarRival.entry?.teams[0] ?? '' } : null, progress: this.altar.progress, goal: this.altar.goal,
        timeLeft: this.altar.timeLeft, dist: Math.round(Math.hypot(this.altar.x - this.members[0].f.x, this.altar.y - this.members[0].f.y) / 32) } : null,
      buffs: [...this.buffs].filter(([, b]) => b.until > this.runTime).map(([id, b]) => ({ id, left: b.until - this.runTime, total: b.total })),
      endless: this.endless ? { mult: this.endlessScaleNow().hp, sec: this.runTime - this.endless.since, phase: endlessPhase(this.endlessMin()).name } : null,
      combos: [...this.combos].map(([id, s]) => { const d = COMBOS.find((x) => x.id === id)!; return { name: d.name, level: s.level, cd: Math.max(0, Math.min(1, s.cd / d.cooldownMs)) }; }),
    });
  }

  private finish(victory: boolean) {
    if (this.ended) return;
    this.ended = true;
    for (const b of this.shots) b.img.destroy();
    for (const h of this.hazards) { h.shadow.destroy(); h.ring.destroy(); h.ball?.destroy(); }
    for (const w of this.shocks) w.g.destroy();
    this.shots = []; this.hazards = []; this.shocks = [];
    this.pushHud();
    this.cfg.hooks.end({ mapId: this.cfg.map.id, rank: this.rank.id, victory: victory || !!this.endless, endlessSec: this.endless ? this.runTime - this.endless.since : 0, endlessPhase: this.endless ? endlessPhase(this.endlessMin()).name : undefined, endlessBosses: this.endless?.bosses ?? 0, endlessCoins: this.endless?.coins ?? 0, endlessTokens: this.endless?.tokens ?? 0, altars: this.altarsDone, damage: Math.round(this.damageDealt), runId: this.runId, captainId: this.members[0].entry.id, teamIds: this.members.map((m) => m.entry.id), timeSec: this.runTime, kills: this.kills, level: this.level,
      minibosses: this.minibossesKilled, bossDefeated: (victory || !!this.endless) && this.bossSpawned, reachedBoss: this.bossSpawned, bonusCoins: this.bonusCoins, bonusTokens: this.bonusTokens,
      formation: this.formation, techUses: this.techUses, techById: this.techById,
      maxTechLevel: Math.max(...this.members.flatMap((m) => Object.values(m.state.levels))), combos: [...this.combos.keys()] });
  }

  /** Public for the pause menu / HUD buttons. */
  forceEnd() { this.finish(false); }
  cycleFormation() { this.setFormation(FORMATION_ORDER[(FORMATION_ORDER.indexOf(this.formation) + 1) % 3]); }
  selectFormation(id: FormationId) { this.setFormation(id); }

  /** Debug/test hook used by the browser smoke test. */
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
