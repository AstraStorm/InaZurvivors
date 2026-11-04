import { RARITY_ORDER, type Rarity } from '../data/manifest';
import { PENNANT_BY_ID } from '../data/pennants';
/** Local save with schema version + migrations + validation. Pure logic + a thin localStorage adapter.
 *  Never destroys data: an unreadable save is set aside under a recovery key and the last good copy is tried first. */

export const SCHEMA_VERSION = 9;

/** copies counts every pull; `spent` = duplicates consumed by ascensions; ascMitico/hero = ascension (ascension.ts);
 *  ascRarity = rarity reached by the first ascension (Fix 1.23; older saves without it reached Mítico) */
export interface OwnedPlayer { stars: number; copies: number; obtainedAt: string; spent?: number; ascMitico?: boolean; ascRarity?: Rarity; hero?: boolean;
  /** Fix 1.31: hero stars (0..3) a HÉROE earns with more duplicates (ascension.ts) */
  heroStars?: number;
  /** Fix 1.23: training points per stat (training.ts), 20 at most in total */
  train?: Partial<Record<string, number>> }

export interface SaveData {
  schemaVersion: number;
  coins: number;
  owned: Record<string, OwnedPlayer>;
  captainId: number | null;
  clearedMaps: string[];
  stats: { runs: number; wins: number; kills: number; bestTimeSec: number; pulls: number; bestKills: number; bestLevel: number; bestEndless?: number };
  settings: Settings;
  upgrades: Record<string, number>;
  formation: string;
  /** the one-time welcome draft of 5 footballers has been done */
  onboardingDone: boolean;
  profile: Profile;
  /** team chosen when the profile was created; null for profiles older than that step */
  favoriteTeam: string | null;
  missions: MissionState;
  /** technique shop: repertoire techniques bought per player, permanent boosts per technique id */
  shop: { techUnlocks: Record<string, number[]>; techBoosts: Record<string, number> };
  /** equipment owned and what is worn in each slot */
  gear: { owned: string[]; equipped: Record<string, string> };
  introSeen: boolean;
  /** gacha currency; coins pay for upgrades and shops */
  tokens: number;
  /** Fix 1.23: Fichas de entrenamiento, one per training point (training.ts) */
  trainTokens?: number;
  /** rewards already claimed per team */
  teamRewards: Record<string, { crest?: boolean; kit?: boolean; captain?: boolean }>;
  /** kit worn by the squad ('' = Raimon) and crest shown on the profile */
  kit: string;
  crest: string;
  /** today's catalogue is stored when first rolled, so later roster or rarity changes can't reshuffle it */
  daily: { key: string; bought: number[]; offers?: { playerId: number; price: number; discount: number; tag?: string }[]; layout?: number };
  /** Fix 1.12: promotional codes redeemed by this save, and those redeemed as a guest still to be linked to an account */
  redeemedCodes?: string[];
  guestCodes?: string[];
  /** Fix 1.12: the weekly special of the shop (one per week, bought once) */
  weeklyShop?: { key: string; offer: { playerId: number; price: number; discount: number; tag?: string } | null; bought: boolean };
  /** per-profile salt of the daily shop */
  shopSeed: number;
  /** lifetime uses per technique id */
  mastery: Record<string, number>;
  /** repertoire index each player starts a run with */
  loadout: Record<string, number>;
  /** v1.5: Auras, carrier id -> Aura id (auras.ts); the roster checks (rarity) run at load in sanitizeAuras */
  auras?: Record<string, number>;
  /** v1.5: Aura milestones that are not run counters (first Aura, first compatible pair), for the achievements */
  achAura?: { equipped?: boolean; bond?: boolean };
  /** v1.5: the explanation of Auras has been shown (first visit to Mi Equipo) */
  auraIntroSeen?: boolean;
  /** (author) Fichas de evento: they only pay the Banner de agradecimiento (thanksEvent.ts) */
  eventTokens?: number;
  /** the thank-you notice of the Banner de agradecimiento was closed */
  thanksSeen?: boolean;
  /** v1.5: achievements already announced with the «¡LOGRO!» banner (each one only once) */
  achShown?: string[];
  /** last manifest techRemaps step applied to this save (remapTechSlots) */
  techRev?: number;
  /** Fix 1.31: Míticos/Leyendas ascended the old way were turned into HÉROE (ascension.ts migrateHeroes131) */
  heroes131?: boolean;
  /** Fix 1.53: the Drakul compensation (ascension.ts compensateDrakul153) was already given */
  drakul153?: boolean;
  /** v1.65: profile banners owned and the one shown (pennants.ts) */
  pennants?: { owned: string[]; equipped?: string; frame?: string };
  /** Fix 1.32: ids of the news items already opened (news board) */
  newsRead?: string[];
  /** Fix 1.11 weekly pass: rewards claimed in the current cycle (0-6) and the last day one was claimed */
  weeklyPass?: { claimed: number; lastDay: string };
  /** "Mi Equipo": up to seven owned candidates for a run, captain first */
  squad: number[];
  /**
   * 1.76 (author): five saved teams to rotate between (squad.ts). The live team is always `squad` + `auras` +
   * `formation`; the slot `activeSquad` holds a copy that is refreshed when switching away from it.
   */
  squads?: SquadPreset[];
  activeSquad?: number;
  /** 1.8: GTS movements already applied to this save (gts.ts) */
  gts?: { applied: string[] };
  /** run difficulty rank chosen last */
  difficulty: Rank;
  /** best rank cleared per arena */
  clearedRanks: Record<string, Rank[]>;
  /** pickups already explained once in a run */
  seenItems: string[];
  /** first-steps tutorial: shown on its own until completed or skipped; Options can replay it */
  tutorial: 'pendiente' | 'hecho' | 'omitido';
  /** last capsule pulls, newest first */
  gachaHistory: { id: number; rarity: string; isNew: boolean; at: string }[];
  /** devlog version the player has already opened */
  devlogSeen: string;
  /** best mark per arena+rank on this device (leaderboard.ts) */
  bests?: Record<string, { map: string; rank: string; time: number; damage: number; captainId: number; at: string }>;
  /** ids of runs already recorded, so a reload can't count one twice */
  seenRuns?: string[];
  /** username is permanent once the profile is created (and once reserved online) */
  nameLocked?: boolean;
  /** online account: reserved global username, if any */
  onlineName?: string;
  /** hall of fame: every victory with its squad (hallOfFame.ts) */
  hall?: { runId: string; at: string; map: string; rank: string; team: number[]; time: number; kills: number; damage: number; endless: number }[];
  /** version of the cloud copy this device last wrote (optimistic lock) */
  cloudVersion?: number;
  /** raised by «Reiniciar progreso»: a copy from an older epoch is stale and can never overwrite a newer one */
  progressEpoch?: number;
}

export type Rank = 'C' | 'B' | 'A' | 'S' | 'X';

export interface MissionState {
  counters: Record<string, number>; // lifetime
  daily: { key: string; counters: Record<string, number> };
  weekly: { key: string; counters: Record<string, number> };
  claimed: string[]; // claim ids (period-stamped for daily/weekly)
  /** last player given as a mission duplicate (for the reward summary) */
  lastDupe?: number;
}

export interface Profile { name: string; icon: { kind: 'emblem' | 'player' | 'coach'; id: number } }
export const DEFAULT_PROFILE: Profile = { name: 'Entrenador', icon: { kind: 'emblem', id: 1 } };

export type ParticleLevel = 'completo' | 'reducido' | 'desactivado';
export interface Settings {
  volume: number; // sound effects
  musicVolume: number;
  muted: boolean;
  menuTrack: string; // '' = automatic
  battleTrack: string; // '' = automatic rotation
  particles: ParticleLevel;
  shake: number; // 0..1
  flashes: boolean;
  damageNumbers: boolean;
  reducedMotion: boolean;
  uiScale: number;
  quality: 'alta' | 'media' | 'baja';
  moveKeys: 'ambos' | 'wasd' | 'flechas';
  /** 'original' = music generated by the game; 'local' = OST exported from the player's own ROM */
  musicSource: 'original' | 'local';
  /** how much of the pitch the camera shows: 'cerca' frames the squad tightly */
  camera: 'cerca' | 'normal' | 'lejos';
}

export const DEFAULT_SETTINGS: Settings = { volume: 0.5, musicVolume: 0.45, muted: false, menuTrack: '', battleTrack: '', particles: 'completo',
  shake: 0.35, flashes: true, damageNumbers: true, reducedMotion: false, musicSource: 'local', uiScale: 1, quality: 'alta', moveKeys: 'ambos', camera: 'normal' };

export const emptyMissions = (): MissionState => ({ counters: {}, daily: { key: '', counters: {} }, weekly: { key: '', counters: {} }, claimed: [] });

/** 1.76: one of the five saved teams of Mi Equipo */
export interface SquadPreset { name: string; squad: number[]; auras?: Record<string, number>; formation?: string }
export const SQUAD_SLOTS = 5;

export function newSave(starterIds: number[], captainId: number | null): SaveData {
  const owned: Record<string, OwnedPlayer> = {};
  for (const id of starterIds) owned[String(id)] = { stars: 0, copies: 1, obtainedAt: new Date(0).toISOString() };
  return {
    schemaVersion: SCHEMA_VERSION, coins: 200, owned, captainId, clearedMaps: [],
    stats: { runs: 0, wins: 0, kills: 0, bestTimeSec: 0, pulls: 0, bestKills: 0, bestLevel: 0 },
    settings: { ...DEFAULT_SETTINGS }, upgrades: {}, formation: 'equilibrada',
    onboardingDone: starterIds.length > 0, profile: { ...DEFAULT_PROFILE, icon: { ...DEFAULT_PROFILE.icon } },
    favoriteTeam: null, missions: emptyMissions(), shop: { techUnlocks: {}, techBoosts: {} }, gear: { owned: [], equipped: {} }, introSeen: false,
    tokens: 20, teamRewards: {}, kit: '', crest: '', daily: { key: '', bought: [] }, shopSeed: Math.floor(Math.random() * 1e9),
    mastery: {}, loadout: {}, squad: [], difficulty: 'C', clearedRanks: {}, seenItems: [], tutorial: 'pendiente', gachaHistory: [], devlogSeen: '',
  };
}

type Migration = (s: any) => any; // eslint-disable-line @typescript-eslint/no-explicit-any
/** migrations[n] upgrades a save from version n to n+1. */
export const migrations: Record<number, Migration> = {
  // v1 stored unlocked players as an id list and had no stats.pulls
  1: (s) => {
    const owned: Record<string, OwnedPlayer> = {};
    for (const id of s.unlocked ?? []) owned[String(id)] = { stars: s.stars?.[id] ?? 0, copies: 1, obtainedAt: new Date(0).toISOString() };
    const { unlocked: _u, stars: _s, ...rest } = s;
    return { ...rest, owned, stats: { pulls: 0, ...(s.stats ?? {}) }, schemaVersion: 2 };
  },
  // v2 -> v3: visual/accessibility settings, permanent upgrades, formation, new records (owned/coins untouched)
  2: (s) => ({
    ...s,
    settings: { ...DEFAULT_SETTINGS, ...(s.settings ?? {}) },
    upgrades: s.upgrades ?? {},
    formation: s.formation ?? 'equilibrada',
    stats: { bestKills: 0, bestLevel: 0, ...(s.stats ?? {}) },
    schemaVersion: 3,
  }),
  // v3 -> v4: one-time onboarding flag (already done if the profile owns players), profile, music settings, softer shake
  3: (s) => ({
    ...s,
    onboardingDone: Object.keys(s.owned ?? {}).length > 0,
    profile: s.profile ?? { ...DEFAULT_PROFILE, icon: { ...DEFAULT_PROFILE.icon } },
    settings: { ...DEFAULT_SETTINGS, ...(s.settings ?? {}), shake: Math.min(s.settings?.shake ?? 0.35, 0.35) },
    schemaVersion: 4,
  }),
  // v4 -> v5: favourite team, missions, technique shop, equipment, intro flag. Existing players skip the intro once.
  4: (s) => ({
    ...s,
    favoriteTeam: s.favoriteTeam ?? null,
    missions: s.missions ?? emptyMissions(),
    shop: s.shop ?? { techUnlocks: {}, techBoosts: {} },
    gear: s.gear ?? { owned: [], equipped: {} },
    introSeen: s.introSeen ?? !!s.onboardingDone,
    settings: { ...DEFAULT_SETTINGS, ...(s.settings ?? {}) },
    schemaVersion: 5,
  }),
  // v5 -> v6: the game's own soundtrack becomes the default music
  5: (s) => ({ ...s, settings: { ...(s.settings ?? {}), musicSource: 'local' }, schemaVersion: 6 }),
  // v6 -> v7: gacha tokens (starter grant, coins untouched), team rewards, kits, daily shop. Collection unchanged.
  6: (s) => ({ ...s, tokens: s.tokens ?? 30, teamRewards: s.teamRewards ?? {}, kit: s.kit ?? '', crest: s.crest ?? '',
    daily: s.daily ?? { key: '', bought: [] }, shopSeed: s.shopSeed ?? Math.floor(Math.random() * 1e9), schemaVersion: 7 }),
  // v7 -> v8: technique mastery and starting technique
  7: (s) => ({ ...s, mastery: s.mastery ?? {}, loadout: s.loadout ?? {}, schemaVersion: 8 }),
  // v8 -> v9 (InaZurvivors 3.0): squad of seven, difficulty ranks, tutorial and gacha history. Existing players already
  // know the game, so their tutorial is not forced on them (it stays in Options).
  8: (s) => ({ ...s, squad: s.squad ?? [], difficulty: s.difficulty ?? 'C', clearedRanks: s.clearedRanks ?? {}, seenItems: s.seenItems ?? [],
    tutorial: s.tutorial ?? (s.onboardingDone ? 'omitido' : 'pendiente'), gachaHistory: s.gachaHistory ?? [], devlogSeen: s.devlogSeen ?? '', schemaVersion: 9 }),
};

const num = (v: unknown, d: number) => (typeof v === 'number' && Number.isFinite(v) ? v : d);
const obj = (v: unknown) => (v && typeof v === 'object' && !Array.isArray(v) ? v as Record<string, unknown> : null);

/**
 * Moves players owned under an old id to their current id (manifest idAliases): copies, stars, spent duplicates and
 * ascensions add up; squad, captain, loadout and the hall of fame follow. Returns how many were moved.
 */
export function remapIds(s: SaveData, aliases: Record<string, number> = {}) {
  let moved = 0;
  for (const [from, to] of Object.entries(aliases)) {
    const o = s.owned[from];
    if (!o) continue;
    const t = s.owned[String(to)];
    if (t) {
      t.copies += o.copies; t.stars = Math.min(5, Math.max(t.stars, o.stars)); t.spent = (t.spent ?? 0) + (o.spent ?? 0);
      t.ascMitico ||= o.ascMitico; t.hero ||= o.hero; t.heroStars = Math.max(t.heroStars ?? 0, o.heroStars ?? 0) || undefined; t.ascRarity ??= o.ascRarity; t.train ??= o.train;
    } else s.owned[String(to)] = o;
    delete s.owned[from];
    const map = (id: number) => (String(id) === from ? to : id);
    s.squad = [...new Set((s.squad ?? []).map(map))];
    if (s.captainId !== null) s.captainId = map(s.captainId);
    for (const q of s.squads ?? []) q.squad = [...new Set(q.squad.map(map))]; // 1.76: the saved teams follow too
    if (s.loadout[from] !== undefined && s.loadout[String(to)] === undefined) s.loadout[String(to)] = s.loadout[from];
    for (const h of s.hall ?? []) h.team = h.team.map(map);
    moved++;
  }
  return moved;
}

/**
 * Moves technique purchases and the chosen starting technique to their new slots after a repertoire changed order
 * (manifest techRemaps); an unlocked technique that left the repertoire is refunded. Each step applies once (techRev).
 * Returns the coins refunded, or -1 when nothing changed.
 */
export function remapTechSlots(s: SaveData, steps: { rev: number; players: Record<string, { map: number[]; refund: number[] }> }[] = []) {
  const from = s.techRev ?? 0;
  let refunded = 0, changed = false;
  for (const step of steps) {
    if (step.rev <= from) continue;
    changed = true;
    for (const [pid, { map, refund }] of Object.entries(step.players)) {
      const bought = s.shop.techUnlocks[pid];
      if (bought) {
        for (const i of bought) if ((map[i] ?? i) < 0) refunded += refund[i] ?? 0;
        s.shop.techUnlocks[pid] = [...new Set(bought.map((i) => map[i] ?? i).filter((i) => i >= 0))];
      }
      if (s.loadout[pid] !== undefined) {
        const to = map[s.loadout[pid]] ?? s.loadout[pid];
        if (to < 0) delete s.loadout[pid]; else s.loadout[pid] = to;
      }
    }
    s.techRev = Math.max(s.techRev ?? 0, step.rev);
  }
  s.coins += refunded;
  return changed ? refunded : -1;
}

/** Repairs wrong field types without dropping valid progress. */
export function validate(s: SaveData): SaveData {
  s.coins = Math.max(0, Math.floor(num(s.coins, 0)));
  s.tokens = Math.max(0, Math.floor(num(s.tokens, 0)));
  s.trainTokens = Math.max(0, Math.floor(num(s.trainTokens, 0)));
  s.eventTokens = Math.max(0, Math.floor(num(s.eventTokens, 0)));
  const owned: Record<string, OwnedPlayer> = {};
  for (const [k, v] of Object.entries(obj(s.owned) ?? {})) {
    const o = obj(v);
    if (!o || !/^\d+$/.test(k)) continue;
    const copies = Math.max(1, Math.floor(num(o.copies, 1)));
    owned[k] = { stars: Math.max(0, Math.floor(num(o.stars, 0))), copies, obtainedAt: String(o.obtainedAt ?? new Date(0).toISOString()) };
    // ascension survives validation; spent duplicates can never exceed the duplicates there are
    const spent = Math.min(copies - 1, Math.max(0, Math.floor(num(o.spent, 0))));
    if (spent) owned[k].spent = spent;
    if (o.ascMitico === true) owned[k].ascMitico = true;
    if (o.ascMitico === true && typeof o.ascRarity === 'string' && (RARITY_ORDER as string[]).includes(o.ascRarity)) owned[k].ascRarity = o.ascRarity as Rarity;
    if (o.hero === true) owned[k].hero = true;
    if (o.hero === true && num(o.heroStars, 0) > 0) owned[k].heroStars = Math.min(3, Math.max(0, Math.floor(num(o.heroStars, 0))));
    // training: known stats, whole points, 20 at most in total (a forged save can't go beyond)
    const tr = obj(o.train);
    if (tr) {
      let left = 20;
      const train: Record<string, number> = {};
      for (const key of ['kick', 'control', 'guard', 'body', 'speed', 'guts', 'stamina']) {
        const v = Math.min(left, Math.max(0, Math.floor(num(tr[key], 0))));
        if (v) { train[key] = v; left -= v; }
      }
      if (Object.keys(train).length) owned[k].train = train;
    }
  }
  s.owned = owned;
  if (!Array.isArray(s.clearedMaps)) s.clearedMaps = [];
  if (!obj(s.upgrades)) s.upgrades = {};
  if (!Array.isArray(s.missions?.claimed)) s.missions = emptyMissions();
  s.squad = Array.isArray(s.squad) ? [...new Set(s.squad.filter((id) => Number.isInteger(id) && owned[String(id)]))].slice(0, 7) : [];
  if (!['C', 'B', 'A', 'S', 'X'].includes(s.difficulty)) s.difficulty = 'C';
  if (!Array.isArray(s.seenItems)) s.seenItems = [];
  if (!Array.isArray(s.gachaHistory)) s.gachaHistory = [];
  if (!obj(s.clearedRanks)) s.clearedRanks = {};
  if (s.progressEpoch !== undefined) s.progressEpoch = Math.max(0, Math.floor(num(s.progressEpoch, 0)));
  // v1.65: banners — known ids only, no repeats; the equipped one must be owned
  const pn = obj(s.pennants);
  if (pn) {
    const ownedP = Array.isArray(pn.owned) ? [...new Set(pn.owned.filter((x): x is string => typeof x === 'string' && PENNANT_BY_ID.has(x)))] : [];
    s.pennants = { owned: ownedP };
    if (typeof pn.equipped === 'string' && ownedP.includes(pn.equipped) && PENNANT_BY_ID.get(pn.equipped)!.kind !== 'marco') s.pennants.equipped = pn.equipped;
    if (typeof pn.frame === 'string' && ownedP.includes(pn.frame) && PENNANT_BY_ID.get(pn.frame)!.kind === 'marco') s.pennants.frame = pn.frame;
  } else delete s.pennants;
  // v1.5: Auras — owned on both sides, never oneself, one carrier per Aura, no chains (a carrier is nobody's Aura)
  const cleanAuras = (au: Record<string, unknown>) => {
    // read in numeric key order: the first legal link stays, a later one that would repeat an Aura or chain is dropped
    const clean: Record<string, number> = {};
    const auras = new Set<number>(), carriers = new Set<number>();
    for (const k of Object.keys(au).filter((x) => /^\d+$/.test(x)).sort((x, y) => Number(x) - Number(y))) {
      const c = Number(k), a = Math.floor(num(au[k], -1));
      if (!owned[k] || !owned[String(a)] || c === a || auras.has(a) || carriers.has(a) || auras.has(c)) continue;
      clean[k] = a; auras.add(a); carriers.add(c);
    }
    return clean;
  };
  const au = obj(s.auras);
  if (au) s.auras = cleanAuras(au);
  else delete s.auras;
  // 1.76: the five saved teams, cleaned the same way as the live one
  if (Array.isArray(s.squads)) {
    s.squads = (s.squads as unknown[]).slice(0, SQUAD_SLOTS).map((q, i) => {
      const o = obj(q) ?? {};
      const ids = Array.isArray(o.squad) ? [...new Set((o.squad as unknown[]).filter((id): id is number => Number.isInteger(id) && !!owned[String(id)]))].slice(0, 7) : [];
      const pa = obj(o.auras);
      const name = typeof o.name === 'string' && o.name.trim() ? o.name.trim().slice(0, 16) : `Equipo ${i + 1}`;
      return { name, squad: ids, ...(pa ? { auras: cleanAuras(pa) } : {}), ...(typeof o.formation === 'string' ? { formation: o.formation.slice(0, 24) } : {}) };
    });
    while (s.squads.length < SQUAD_SLOTS) s.squads.push({ name: `Equipo ${s.squads.length + 1}`, squad: [] });
    s.activeSquad = Math.max(0, Math.min(SQUAD_SLOTS - 1, Math.floor(num(s.activeSquad, 0))));
  } else { delete s.squads; delete s.activeSquad; }
  // 1.8: GTS ledger marks: short strings only
  const gt = obj(s.gts);
  if (gt && Array.isArray(gt.applied)) s.gts = { applied: (gt.applied as unknown[]).filter((x): x is string => typeof x === 'string' && /^[dwrt]:\d{1,12}$/.test(x)).slice(-400) };
  else delete s.gts;
  return s;
}

/** True when the value looks like one of our saves at all. */
function isSaveShape(raw: unknown) {
  const o = obj(raw);
  return !!o && (typeof o.schemaVersion === 'number' || 'coins' in o || 'owned' in o || 'unlocked' in o);
}

export function migrate(raw: any, starterIds: number[], captainId: number | null): SaveData { // eslint-disable-line @typescript-eslint/no-explicit-any
  if (!raw || typeof raw !== 'object') return newSave(starterIds, captainId);
  let s = { ...raw };
  if (typeof s.schemaVersion !== 'number') s.schemaVersion = 1;
  while (s.schemaVersion < SCHEMA_VERSION) {
    const m = migrations[s.schemaVersion];
    if (!m) throw new Error(`sin migración desde v${s.schemaVersion}`);
    s = m(s);
  }
  const base = newSave(starterIds, captainId);
  return validate({ ...base, ...s, stats: { ...base.stats, ...s.stats }, settings: { ...base.settings, ...s.settings },
    profile: { ...base.profile, ...(s.profile ?? {}) } });
}

const KEY = 'ie-survivors-save';
const BACKUP = `${KEY}.bak`;

function parse(txt: string | null, starterIds: number[], captainId: number | null): SaveData | null {
  if (!txt) return null;
  const raw = JSON.parse(txt);
  if (!isSaveShape(raw)) throw new Error('no es un guardado');
  return migrate(raw, starterIds, captainId);
}

export function loadSave(starterIds: number[], captainId: number | null): SaveData {
  let txt: string | null = null;
  try { txt = localStorage.getItem(KEY); } catch { return newSave(starterIds, captainId); }
  try {
    return parse(txt, starterIds, captainId) ?? newSave(starterIds, captainId);
  } catch {
    // unreadable: keep it for manual recovery, then fall back to the last good copy
    try { localStorage.setItem(`${KEY}.recovery-${Date.now()}`, txt ?? ''); } catch { /* storage full */ }
    try {
      const prev = parse(localStorage.getItem(BACKUP), starterIds, captainId);
      if (prev) return prev;
    } catch { /* backup unusable too */ }
    return newSave(starterIds, captainId);
  }
}

export function storeSave(s: SaveData): boolean {
  try {
    const prev = localStorage.getItem(KEY);
    if (prev) localStorage.setItem(BACKUP, prev);
    localStorage.setItem(KEY, JSON.stringify(s));
    return true;
  } catch {
    return false;
  }
}

/** The id stays the pre-rename one, so backups made before and after the InaZurvivors rename import into each other. */
export const exportSave = (s: SaveData) => JSON.stringify({ game: 'inazuma-eleven-survivors', title: 'InaZurvivors', exportedAt: new Date().toISOString(), save: s }, null, 1);

/** Parses an exported backup; throws with a readable message and leaves the current save alone when it is not valid. */
export function importSave(text: string): SaveData {
  let raw: unknown;
  try { raw = JSON.parse(text); } catch { throw new Error('El archivo no es JSON válido.'); }
  const o = obj(raw);
  const inner = o?.game === 'inazuma-eleven-survivors' ? o.save : raw;
  if (!isSaveShape(inner)) throw new Error('El archivo no es una copia de InaZurvivors.');
  return migrate(inner, [], null);
}
