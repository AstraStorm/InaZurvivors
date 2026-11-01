/**
 * Missions: run, daily, weekly and permanent achievements. Rewards are claimed with a button and each claim id is stored,
 * so nothing pays twice. Daily resets at local midnight, weekly on local Monday 00:00 (keys are local calendar dates).
 */
import type { RunResult } from './economy';
import type { SaveData } from './save';

export type MissionKind = 'partida' | 'diaria' | 'semanal' | 'logro';
/** counter: lifetime/period sum of a run stat; best: highest value in one run. */
/** `dupe`: also grants a duplicate of one of your Legendary/Mythic players (ascension material) */
export interface MissionDef { id: string; kind: MissionKind; label: string; stat: string; goal: number; coins: number; tokens: number; dupe?: boolean }

const M = (id: string, kind: MissionKind, label: string, stat: string, goal: number, coins: number): MissionDef => ({ id, kind, label, stat, goal, coins, tokens: kind === 'diaria' ? 3 : kind === 'semanal' ? 10 : kind === 'logro' ? 8 : 3 });

export const MISSIONS: MissionDef[] = [
  M('p_sobrevive', 'partida', 'Sobrevive 5 minutos en una partida', 'best_time', 300, 80),
  M('p_kills', 'partida', 'Derrota a 200 rivales en una partida', 'best_kills', 200, 80),
  M('p_nivel', 'partida', 'Llega al nivel 15 en una partida', 'best_level', 15, 100),
  M('p_tec10', 'partida', 'Mejora una técnica al nivel 10', 'best_tech', 10, 200),
  M('d_partidas', 'diaria', 'Juega 2 partidas', 'runs', 2, 60),
  M('d_kills', 'diaria', 'Derrota a 150 rivales', 'kills', 150, 60),
  M('d_fuego', 'diaria', 'Usa 30 técnicas de Fuego', 'uses_Fuego', 30, 60),
  M('s_partidas', 'semanal', 'Juega 10 partidas', 'runs', 10, 250),
  M('s_kills', 'semanal', 'Derrota a 1000 rivales', 'kills', 1000, 250),
  M('s_arena', 'semanal', 'Completa 2 arenas', 'wins', 2, 300),
  M('l_500', 'logro', 'Derrota a 500 rivales', 'kills', 500, 150),
  M('l_5000', 'logro', 'Derrota a 5000 rivales', 'kills', 5000, 600),
  M('l_diez', 'logro', 'Sobrevive 10 minutos en total', 'time', 600, 150),
  M('l_arena', 'logro', 'Completa una arena', 'wins', 1, 200),
  M('l_ofensiva', 'logro', 'Gana con formación ofensiva', 'wins_ofensiva', 1, 250),
  M('l_fuego', 'logro', 'Usa 500 técnicas de Fuego', 'uses_Fuego', 500, 250),
  M('l_aire', 'logro', 'Usa 500 técnicas de Aire', 'uses_Aire', 500, 250),
  M('l_todas', 'logro', 'Completa las tres arenas', 'arenas', 3, 800),
  // 4.0
  M('d_nivel', 'diaria', 'Sube 25 niveles (sumando partidas)', 'levels', 25, 60),
  M('d_aire', 'diaria', 'Usa 30 técnicas de Aire', 'uses_Aire', 30, 60),
  M('d_bosque', 'diaria', 'Usa 30 técnicas de Bosque', 'uses_Bosque', 30, 60),
  M('d_montana', 'diaria', 'Usa 30 técnicas de Montaña', 'uses_Montaña', 30, 60),
  M('d_eventos', 'diaria', 'Supera 2 altares o eventos', 'altars', 2, 80),
  M('s_jefes', 'semanal', 'Derrota a 5 jefes', 'bosses', 5, 300),
  { ...M('s_rango', 'semanal', 'Gana 2 partidas en rango A o superior', 'wins_hi', 2, 400), dupe: true },
  M('s_fichajes', 'semanal', 'Consigue 3 futbolistas nuevos', 'news', 3, 250),
  M('s_infinito', 'semanal', 'Sobrevive 3 minutos en supervivencia infinita', 'endless', 180, 300),
  M('l_col50', 'logro', 'Ten 50 futbolistas en tu colección', 'col_owned', 50, 400),
  { ...M('l_col200', 'logro', 'Ten 200 futbolistas en tu colección', 'col_owned', 200, 1500), dupe: true },
  M('l_equipo', 'logro', 'Completa un equipo principal', 'col_teams', 1, 600),
  M('l_mitico', 'logro', 'Asciende un Legendario a Mítico', 'col_ascended', 1, 500),
  M('l_heroe', 'logro', 'Asciende a un futbolista a HÉROE', 'col_heroes', 1, 1500),
  M('l_rangoX', 'logro', 'Gana una partida en rango X', 'wins_X', 1, 2000),
  M('l_combo', 'logro', 'Aprende una técnica combinada', 'combos', 1, 500),
];

/**
 * Collection goals read the collection itself (not run counters): owned players, ascended players and complete main
 * teams. Called when the missions screen opens and after pulls or ascensions.
 */
export function recordCollection(s: SaveData, roster: { id: number; teams: string[] }[], mainTeams: string[]) {
  const owned = Object.values(s.owned);
  const c = s.missions.counters;
  c.col_owned = owned.length;
  c.col_ascended = owned.filter((o) => o.ascMitico).length;
  c.col_heroes = owned.filter((o) => o.hero).length;
  c.col_teams = mainTeams.filter((t) => { const m = roster.filter((p) => p.teams.includes(t)); return m.length > 0 && m.every((p) => s.owned[String(p.id)]); }).length;
}

const pad = (n: number) => String(n).padStart(2, '0');
export const dayKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export function weekKey(d: Date) {
  const monday = new Date(d.getFullYear(), d.getMonth(), d.getDate() - ((d.getDay() + 6) % 7));
  return `S${dayKey(monday)}`;
}

/** Clears period counters when the day or week has changed. */
export function rollPeriods(s: SaveData, now = new Date()) {
  const m = s.missions;
  if (m.daily.key !== dayKey(now)) m.daily = { key: dayKey(now), counters: {} };
  if (m.weekly.key !== weekKey(now)) m.weekly = { key: weekKey(now), counters: {} };
}

/** Adds to a counter in the lifetime, daily and weekly bags (things that happen outside runs, e.g. new signings). */
export function addCounter(s: SaveData, key: string, v: number, now = new Date()) {
  rollPeriods(s, now);
  const m = s.missions;
  for (const bag of [m.counters, m.daily.counters, m.weekly.counters]) bag[key] = (bag[key] ?? 0) + v;
}

/** Adds a finished run to every counter. */
export function recordRun(s: SaveData, r: RunResult, now = new Date()) {
  rollPeriods(s, now);
  const add: Record<string, number> = { runs: 1, kills: r.kills, time: Math.floor(r.timeSec), wins: r.victory ? 1 : 0,
    levels: Math.max(0, (r.level ?? 1) - 1), bosses: r.bossDefeated ? 1 : 0, altars: r.altars ?? 0, endless: Math.floor(r.endlessSec ?? 0),
    combos: r.combos?.length ?? 0 };
  if (r.victory && r.rank) { add[`wins_${r.rank}`] = 1; if (['A', 'S', 'X'].includes(r.rank)) add.wins_hi = 1; }
  if (r.victory && r.formation) add[`wins_${r.formation}`] = 1;
  for (const [k, v] of Object.entries(r.techUses ?? {})) add[`uses_${k}`] = v;
  const m = s.missions;
  for (const bag of [m.counters, m.daily.counters, m.weekly.counters]) for (const [k, v] of Object.entries(add)) bag[k] = (bag[k] ?? 0) + v;
  const best = (k: string, v: number) => { m.counters[k] = Math.max(m.counters[k] ?? 0, v); };
  best('best_time', Math.floor(r.timeSec));
  best('best_kills', r.kills);
  best('best_level', r.level ?? 0);
  best('best_tech', r.maxTechLevel ?? 0);
  m.counters.arenas = s.clearedMaps.length;
}

export function missionProgress(s: SaveData, d: MissionDef) {
  const m = s.missions;
  const bag = d.kind === 'diaria' ? m.daily.counters : d.kind === 'semanal' ? m.weekly.counters : m.counters;
  return Math.min(d.goal, bag[d.stat] ?? 0);
}

/** Stored claim id: daily/weekly ones carry their period so they can be earned again next period. */
export function claimId(s: SaveData, d: MissionDef) {
  return d.kind === 'diaria' ? `${d.id}@${s.missions.daily.key}` : d.kind === 'semanal' ? `${d.id}@${s.missions.weekly.key}` : d.id;
}

export const isClaimed = (s: SaveData, d: MissionDef) => s.missions.claimed.includes(claimId(s, d));
export const isClaimable = (s: SaveData, d: MissionDef) => missionProgress(s, d) >= d.goal && !isClaimed(s, d);
export const pendingClaims = (s: SaveData) => MISSIONS.filter((d) => isClaimable(s, d)).length;

/**
 * Claims every completed, unclaimed mission in one go. Each one goes through claimMission, so nothing can pay twice and
 * unfinished missions are never touched. The caller saves right after.
 */
export function claimAllMissions(s: SaveData, mult = 1, roster?: { id: number; rarity: string }[]): { count: number; coins: number; tokens: number } {
  const out = { count: 0, coins: 0, tokens: 0 };
  for (const d of MISSIONS) {
    if (!isClaimable(s, d)) continue;
    const before = s.tokens;
    const coins = claimMission(s, d.id, mult, roster);
    if (!coins && s.tokens === before) continue;
    out.count++; out.coins += coins; out.tokens += s.tokens - before;
  }
  return out;
}

/** Pays a mission once; returns the coins given (0 if it wasn't claimable). `roster` lets `dupe` rewards pick a player. */
export function claimMission(s: SaveData, id: string, mult = 1, roster?: { id: number; rarity: string }[]): number {
  const d = MISSIONS.find((x) => x.id === id);
  if (!d || !isClaimable(s, d)) return 0;
  const coins = Math.round(d.coins * mult);
  s.missions.claimed.push(claimId(s, d));
  s.coins += coins;
  s.tokens += d.tokens;
  if (d.dupe && roster) {
    // the owned Legendary/Mythic with the fewest copies: the copy helps the ascension that is furthest away
    const pick = roster.filter((p) => (p.rarity === 'legendario' || p.rarity === 'mitico' || p.rarity === 'leyenda') && s.owned[String(p.id)])
      .sort((a, b) => s.owned[String(a.id)].copies - s.owned[String(b.id)].copies)[0];
    if (pick) { const o = s.owned[String(pick.id)]; o.copies += 1; o.stars = Math.min(5, o.stars + 1); s.missions.lastDupe = pick.id; }
  }
  return coins;
}
