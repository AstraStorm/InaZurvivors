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
  /** total damage dealt by the squad, and a unique id of the run (ranking) */
  damage?: number;
  runId?: string;
  captainId?: number;
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
  /** combined techniques learned during the run */
  combos?: string[];
}

export interface Reward { label: string; coins: number }

export function computeRewards(r: RunResult, rewardMult = 1): Reward[] {
  const out: Reward[] = [
    { label: `Eliminaciones (${r.kills})`, coins: r.kills },
    { label: `Supervivencia (${Math.floor(r.timeSec)} s)`, coins: Math.floor(r.timeSec / 2) },
  ];
  if (r.minibosses) out.push({ label: `Minijefes (${r.minibosses})`, coins: 30 * r.minibosses });
  if (r.reachedBoss) out.push({ label: 'Objetivo: llegar al jefe', coins: 40 });
  if (r.bossDefeated) out.push({ label: 'Jefe derrotado', coins: Math.round(150 * rewardMult) });
  if (r.victory) out.push({ label: 'Victoria', coins: Math.round(100 * rewardMult) });
  if (r.bonusCoins) out.push({ label: 'Cofres', coins: r.bonusCoins });
  return out;
}

/** Fichas de Fichaje earned by a run: a full run pays about one pull (10 fichas). */
export function tokenRewards(r: RunResult, firstClear: boolean): Reward[] {
  const out: Reward[] = [{ label: 'Partida jugada', coins: 3 }];
  if (r.timeSec >= 180) out.push({ label: 'Tres minutos en el campo', coins: 2 });
  if (r.bossDefeated) out.push({ label: 'Jefe derrotado', coins: 4 });
  if (r.victory) out.push({ label: 'Victoria', coins: 3 });
  if (firstClear) out.push({ label: 'Primera victoria en la arena', coins: 15 });
  if (r.bonusTokens) out.push({ label: 'Fichas recogidas y altares', coins: r.bonusTokens });
  return out;
}

export const MAP_ORDER = ['raimon', 'royal', 'zeus'];

export function isMapUnlocked(unlockRule: string, save: SaveData): boolean {
  if (unlockRule === 'start') return true;
  const m = /^clear:(.+)$/.exec(unlockRule);
  return !!m && save.clearedMaps.includes(m[1]);
}

/** Applies a finished run to the save (mutates and returns it). Coins are kept on defeat too. */
export function applyRun(save: SaveData, r: RunResult, coinMult = 1, rewardMult = 1, extraTokens = 0): { save: SaveData; rewards: Reward[]; total: number; records: string[]; tokens: Reward[]; tokenTotal: number } {
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
  const tokens = tokenRewards(r, r.victory && !save.clearedMaps.includes(r.mapId));
  if (extraTokens && r.timeSec >= 180) tokens.push({ label: 'Ojeador', coins: extraTokens });
  if (r.victory && recordRankClear(save.clearedRanks ??= {}, r.mapId, rank.id)) tokens.push({ label: `Primera victoria en ${rank.label}`, coins: rank.firstClearTokens });
  const tokenTotal = tokens.reduce((a, x) => a + x.coins, 0);
  save.tokens += tokenTotal;
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
  return { save, rewards, total, records, tokens, tokenTotal };
}
