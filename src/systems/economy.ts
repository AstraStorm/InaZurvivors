/** End-of-run rewards (kept on defeat too) and map unlocks. */
import type { SaveData } from './save';
import { rankDef, recordRankClear } from './difficulty';

export interface RunResult {
  mapId: string;
  /** difficulty rank (C when absent, e.g. runs from older versions) */
  rank?: import('./save').Rank;
  victory: boolean;
  timeSec: number;
  kills: number;
  minibosses: number;
  bossDefeated: boolean;
  reachedBoss: boolean;
  level?: number;
  bonusCoins?: number;
  bonusTokens?: number;
  formation?: string;
  techUses?: Record<string, number>;
  techById?: Record<string, number>;
  maxTechLevel?: number;
  /** v1.5: inherited techniques fired, combined techniques with an Aura taking part, and whether any carrier played */
  auraTechUses?: number;
  auraCombos?: number;
  withAuras?: boolean;
  /** total damage dealt by the squad, and a unique id of the run (ranking) */
  damage?: number;
  runId?: string;
  captainId?: number;
  /** the hit that beat the captain (defeats only): real source recorded by the scene */
  death?: { by: string; attack: string; dmg: number; still?: boolean; at: number };
  /** ids on the pitch at the end, captain first */
  teamIds?: number[];
  /** altars and events completed */
  altars?: number;
  /** seconds survived after choosing endless survival */
  endlessSec?: number;
  endlessPhase?: string;
  endlessBosses?: number;
  endlessCoins?: number;
  endlessTokens?: number;
  /** Fix 1.11 missions: era of the captain (banners.ts eraOf) and teammates of the favourite team on the pitch */
  captainEra?: string;
  favoriteOnPitch?: number;
  /** combined techniques learned during the run */
  combos?: string[];
}

export interface Reward { label: string; coins: number }

/** 1.86 (author: «más fácil la obtención de monedas»): everything a run pays in coins counts double */
export const COIN_BOOST = 2;

export function computeRewards(r: RunResult, rewardMult = 1): Reward[] {
  const out: Reward[] = [
    // Fix 1.11 halved the coins and Fix 1.13 took about 20% more, so upgrades take real effort (ECONOMIA_1.11.md)
    { label: `Eliminaciones (${r.kills})`, coins: Math.floor(r.kills / 4) },
    { label: `Supervivencia (${Math.floor(r.timeSec)} s)`, coins: Math.floor(r.timeSec / 5) },
  ];
  if (r.minibosses) out.push({ label: `Minijefes (${r.minibosses})`, coins: 20 * r.minibosses });
  if (r.reachedBoss) out.push({ label: 'Objetivo: llegar al jefe', coins: 25 });
  if (r.bossDefeated) out.push({ label: 'Jefe derrotado', coins: Math.round(100 * rewardMult) });
  if (r.victory) out.push({ label: 'Victoria', coins: Math.round(65 * rewardMult) });
  if (r.bonusCoins) out.push({ label: 'Cofres', coins: r.bonusCoins });
  return out.map((x) => ({ ...x, coins: x.coins * COIN_BOOST }));
}

/** a run only pays in full when the player really played: an idle captain is beaten before reaching this */
export const ACTIVE_KILLS = 20;
/** the first runs of a profile pay a welcome bonus, so the early collection grows fast */
export const WELCOME_RUNS = 10;
export const WELCOME_TOKENS = 6;

/**
 * Fichas de Fichaje earned by a run (a pull costs 8). An active defeat pays about one pull, a full victory more than two,
 * and each of the first WELCOME_RUNS active runs adds WELCOME_TOKENS. `runsBefore`: runs finished before this one.
 */
export function tokenRewards(r: RunResult, firstClear: boolean, runsBefore = Infinity): Reward[] {
  const active = r.kills >= ACTIVE_KILLS;
  const out: Reward[] = [{ label: 'Partida jugada', coins: active ? 5 : 1 }];
  if (active && runsBefore < WELCOME_RUNS) out.push({ label: `Bienvenida (partida ${runsBefore + 1} de ${WELCOME_RUNS})`, coins: WELCOME_TOKENS });
  // Fix 1.23 (player feedback: 13 minutes paid little more than one ×10): time on the pitch and goals of the run pay
  // fichas, so a long run is worth it; a short abandoned one still gives almost nothing
  if (active) out.push({ label: `Tiempo en el campo (${Math.floor(r.timeSec / 60)} min)`, coins: Math.floor(r.timeSec / 12) });
  if (active && r.kills >= 40) out.push({ label: `Eliminaciones (${r.kills})`, coins: Math.floor(r.kills / 40) });
  if (r.bossDefeated) out.push({ label: 'Jefe derrotado', coins: 15 });
  if (r.victory) out.push({ label: 'Victoria', coins: 15 });
  if (firstClear) out.push({ label: 'Primera victoria en la arena', coins: 40 });
  if (r.bonusTokens) out.push({ label: 'Fichas recogidas y altares', coins: r.bonusTokens });
  return out;
}

export const MAP_ORDER = ['raimon', 'ribera', 'royal', 'nara', 'zeus', 'alpino', 'nevada', 'claustro', 'naniwa', 'yokato', 'marytimes', 'fuji', 'ehime', 'alius', 'ruinas', 'barrio', 'plazanieve', 'torre']; // 2.0: three more arenas after the sea of trees; 2.1: three after the ruins

function ruleMet(rule: string | undefined, save: SaveData) {
  if (!rule) return false;
  if (rule === 'start') return true;
  const m = /^clear:(.+)$/.exec(rule);
  return !!m && save.clearedMaps.includes(m[1]);
}
/** v1.7: an arena opens when the one before it on the path is cleared; one already won (or open under the old order) stays open */
export function isMapUnlocked(map: { id: string; unlock: string; legacyUnlock?: string }, save: SaveData): boolean {
  return ruleMet(map.unlock, save) || ruleMet(map.legacyUnlock, save) || save.clearedMaps.includes(map.id);
}

/** v1.7: each step of the map path makes rivals tougher: tier 1 is the old balance, the last arena about +66% health, +44% damage */
export function mapTierScale(tier = 1) {
  const t = Math.max(0, tier - 1);
  return { hp: 1 + t * 0.06, damage: 1 + t * 0.04 };
}

/** Applies a finished run to the save (mutates and returns it). Coins are kept on defeat too. */
/** Fix 1.3: Fichas de entrenamiento of a run (training.ts): a victory, the boss, a new rank cleared, endless minutes. */
export function trainingRewards(r: RunResult, newRankClear: boolean): Reward[] {
  const out: Reward[] = [];
  if (r.victory) out.push({ label: 'Victoria', coins: 1 });
  if (r.bossDefeated && (r.rank === 'A' || r.rank === 'S' || r.rank === 'X' || r.rank === 'Z')) out.push({ label: 'Jefe en rango alto', coins: 1 });
  if (newRankClear) out.push({ label: 'Rango superado por primera vez', coins: 2 });
  if ((r.endlessSec ?? 0) >= 300) out.push({ label: 'Supervivencia infinita', coins: Math.floor((r.endlessSec ?? 0) / 300) });
  return out;
}

/** 2.0 (author: «cada vez que te pases un mapa en rango X te dan fichas EG (1); nada que te regalen fichas»): the only
 *  source of Fichas EG is beating a map (boss defeated) in rank X, 1 each time */
export const EG_X_WIN = 1;
/** (author) Rango Z pays more: 3 Fichas EG per map beaten */
export const EG_Z_WIN = 3;
export function egRewards(r: RunResult, _newRankClear: boolean): Reward[] {
  if (!r.victory || !r.bossDefeated) return [];
  if (r.rank === 'Z') return [{ label: 'Mapa superado en rango Z', coins: EG_Z_WIN }];
  return r.rank === 'X' ? [{ label: 'Mapa superado en rango X', coins: EG_X_WIN }] : [];
}

export function applyRun(save: SaveData, r: RunResult, coinMult = 1, rewardMult = 1, extraTokens = 0): { save: SaveData; rewards: Reward[]; total: number; records: string[]; tokens: Reward[]; tokenTotal: number; training: Reward[]; trainTotal: number; eg: Reward[]; egTotal: number } {
  const rewards = computeRewards(r, rewardMult);
  if (coinMult > 1) {
    const base = rewards.reduce((a, x) => a + x.coins, 0);
    rewards.push({ label: `Patrocinio (+${Math.round((coinMult - 1) * 100)}%)`, coins: Math.round(base * (coinMult - 1)) });
  }
  const rank = rankDef(r.rank);
  if (rank.reward > 1) {
    const base = rewards.reduce((a, x) => a + x.coins, 0);
    rewards.push({ label: `${rank.label} (×${rank.reward})`, coins: Math.round(base * (rank.reward - 1)) });
  }
  const total = rewards.reduce((a, x) => a + x.coins, 0);
  const tokens = tokenRewards(r, r.victory && !save.clearedMaps.includes(r.mapId), save.stats.runs);
  if (extraTokens && r.timeSec >= 180) tokens.push({ label: 'Ojeador', coins: extraTokens });
  const newRank = r.victory && recordRankClear(save.clearedRanks ??= {}, r.mapId, rank.id);
  if (newRank) tokens.push({ label: `Primera victoria en ${rank.label}`, coins: rank.firstClearTokens });
  // Fix 1.3: the rank multiplies the fichas too, like the coins
  if (rank.reward > 1) {
    const base = tokens.reduce((a, x) => a + x.coins, 0);
    tokens.push({ label: `${rank.label} (×${rank.reward})`, coins: Math.round(base * (rank.reward - 1)) });
  }
  const tokenTotal = tokens.reduce((a, x) => a + x.coins, 0);
  save.tokens += tokenTotal;
  const training = trainingRewards(r, newRank);
  const trainTotal = training.reduce((a, x) => a + x.coins, 0);
  save.trainTokens = (save.trainTokens ?? 0) + trainTotal;
  const eg = egRewards(r, newRank);
  const egTotal = eg.reduce((a, x) => a + x.coins, 0);
  save.egTokens = (save.egTokens ?? 0) + egTotal;
  const records: string[] = [];
  if (Math.floor(r.timeSec) > save.stats.bestTimeSec) records.push('tiempo');
  if (r.kills > (save.stats.bestKills ?? 0)) records.push('eliminaciones');
  if ((r.level ?? 0) > (save.stats.bestLevel ?? 0)) records.push('nivel');
  save.coins += total;
  save.stats.runs += 1;
  save.stats.kills += r.kills;
  save.stats.bestTimeSec = Math.max(save.stats.bestTimeSec, Math.floor(r.timeSec));
  save.stats.bestKills = Math.max(save.stats.bestKills ?? 0, r.kills);
  save.stats.bestLevel = Math.max(save.stats.bestLevel ?? 0, r.level ?? 0);
  if ((r.endlessSec ?? 0) > (save.stats.bestEndless ?? 0)) { records.push('infinito'); save.stats.bestEndless = Math.floor(r.endlessSec!); }
  if (r.victory) {
    save.stats.wins += 1;
    if (!save.clearedMaps.includes(r.mapId)) save.clearedMaps.push(r.mapId);
  }
  return { save, rewards, total, records, tokens, tokenTotal, training, trainTotal, eg, egTotal };
}
