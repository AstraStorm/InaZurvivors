/**
 * Missions: run, daily, weekly and permanent achievements. Rewards are claimed with a button and each claim id is stored,
 * so nothing pays twice. Daily resets at local midnight, weekly on local Monday 00:00 (keys are local calendar dates).
 */
import type { RunResult } from './economy';
import type { SaveData } from './save';

export type MissionKind = 'partida' | 'diaria' | 'semanal' | 'logro';
/** counter: lifetime/period sum of a run stat; best: highest value in one run. */
/** `dupe`: also grants a duplicate of one of your Legendary/Mythic players (ascension material) */
export interface MissionDef { id: string; kind: MissionKind; label: string; stat: string; goal: number; coins: number; tokens: number; dupe?: boolean;
  /** Fix 1.3: Fichas de entrenamiento (weekly missions and achievements) */
  train: number }

// Fix 1.13: missions pay 20% fewer coins, like the runs (rounded to 5)
const M = (id: string, kind: MissionKind, label: string, stat: string, goal: number, coins: number, tokens?: number): MissionDef => ({ id, kind, label, stat, goal, coins: Math.round(coins * 0.8 / 5) * 5, tokens: tokens ?? (kind === 'diaria' ? 4 : kind === 'semanal' ? 12 : kind === 'logro' ? 10 : 4), train: kind === 'semanal' ? 1 : kind === 'logro' ? 2 : 0 }); // Fix 1.3: at the new pull price
/** Fix 1.31: achievement tiers, round fichas: bronze 10, silver 20, gold 50 */
const L = (id: string, label: string, stat: string, goal: number, coins: number, tier: 1 | 2 | 3 = 1) => M(id, 'logro', label, stat, goal, coins, [10, 20, 50][tier - 1]);

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
  M('l_todas', 'logro', 'Completa las seis arenas', 'arenas', 6, 1200, 50),
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
  // Fix 1.11: more ways to earn fichas by playing (daily 3, weekly 10, achievements 8, per run 3)
  M('d_victoria', 'diaria', 'Gana una partida', 'wins', 1, 50),
  M('d_supervivencia', 'diaria', 'Aguanta 4 minutos en una partida', 'long_runs', 1, 40),
  M('d_jefe', 'diaria', 'Derrota a un jefe', 'bosses', 1, 50),
  M('d_ofensiva', 'diaria', 'Juega una partida en formación ofensiva', 'runs_ofensiva', 1, 30),
  M('d_defensiva', 'diaria', 'Juega una partida en formación defensiva', 'runs_defensiva', 1, 30),
  M('s_original', 'semanal', 'Juega 3 partidas con un capitán de la saga original', 'runs_era_original', 3, 150),
  M('s_go', 'semanal', 'Juega 3 partidas con un capitán de la era GO', 'runs_era_go', 3, 150),
  M('s_vr', 'semanal', 'Juega 2 partidas con un capitán de Victory Road', 'runs_era_vr', 2, 150),
  M('s_favorito', 'semanal', 'Juega 3 partidas con 3 o más futbolistas de tu equipo favorito', 'runs_fav', 3, 200),
  M('s_tecnicas', 'semanal', 'Usa 300 técnicas de cualquier elemento', 'uses_all', 300, 150),
  M('s_eventos', 'semanal', 'Supera 6 altares o eventos', 'altars', 6, 200),
  M('s_rangoB', 'semanal', 'Gana 3 partidas en rango B o superior', 'wins_hi_b', 3, 250),
  M('l_royal', 'logro', 'Gana en la Royal Academy', 'wins_map_royal', 1, 300),
  M('l_zeus', 'logro', 'Gana en el Estadio Zeus', 'wins_map_zeus', 1, 400),
  M('l_equilibrada', 'logro', 'Gana con formación equilibrada', 'wins_equilibrada', 1, 250),
  M('l_defensiva', 'logro', 'Gana con formación defensiva', 'wins_defensiva', 1, 250),
  // Fix 1.31: many more achievements, in tiers (bronze 10 fichas, silver 20, gold 50)
  L('l_partidas10', 'Juega 10 partidas', 'runs', 10, 150),
  L('l_partidas50', 'Juega 50 partidas', 'runs', 50, 500, 2),
  L('l_partidas200', 'Juega 200 partidas', 'runs', 200, 1500, 3),
  L('l_kills1000', 'Derrota a 1000 rivales', 'kills', 1000, 250),
  L('l_kills20000', 'Derrota a 20 000 rivales', 'kills', 20000, 1200, 2),
  L('l_kills100000', 'Derrota a 100 000 rivales', 'kills', 100000, 3000, 3),
  L('l_hora', 'Juega 1 hora en total', 'time', 3600, 300),
  L('l_5horas', 'Juega 5 horas en total', 'time', 18000, 1000, 2),
  L('l_20horas', 'Juega 20 horas en total', 'time', 72000, 3000, 3),
  L('l_victorias5', 'Gana 5 partidas', 'wins', 5, 300),
  L('l_victorias25', 'Gana 25 partidas', 'wins', 25, 1000, 2),
  L('l_victorias100', 'Gana 100 partidas', 'wins', 100, 3000, 3),
  L('l_tres', 'Completa tres arenas', 'arenas', 3, 500),
  L('l_raimon', 'Gana en el Instituto Raimon', 'wins_map_raimon', 1, 200),
  L('l_alpino', 'Gana en el Parque del Alpino', 'wins_map_alpino', 1, 400),
  L('l_claustro', 'Gana en el Claustro Sagrado', 'wins_map_claustro', 1, 500),
  L('l_marytimes', 'Gana en la Isla Mary Times', 'wins_map_marytimes', 1, 600),
  L('l_ribera', 'Gana en la Ribera del río', 'wins_map_ribera', 1, 250),
  L('l_nara', 'Gana en el Parque de los Ciervos', 'wins_map_nara', 1, 350),
  L('l_nevada', 'Gana en la Gran Llanura Nevada', 'wins_map_nevada', 1, 450),
  L('l_naniwa', 'Gana en Naniwaland', 'wins_map_naniwa', 1, 550),
  L('l_yokato', 'Gana en el Instituto Yokato', 'wins_map_yokato', 1, 550),
  L('l_fuji', 'Gana en el Mar de Árboles', 'wins_map_fuji', 1, 1000, 2),
  L('l_camino', 'Completa el camino de arenas entero', 'arenas', 12, 3000, 3),
  L('l_rangoB', 'Gana una partida en rango B', 'wins_B', 1, 300),
  L('l_rangoA', 'Gana una partida en rango A', 'wins_A', 1, 600, 2),
  L('l_rangoS', 'Gana una partida en rango S', 'wins_S', 1, 1200, 2),
  L('l_rangoX5', 'Gana 5 partidas en rango X', 'wins_X', 5, 4000, 3),
  L('l_bosque', 'Usa 500 técnicas de Bosque', 'uses_Bosque', 500, 250),
  L('l_montana', 'Usa 500 técnicas de Montaña', 'uses_Montaña', 500, 250),
  L('l_tecnicas5000', 'Usa 5000 técnicas', 'uses_all', 5000, 800, 2),
  L('l_tecnicas25000', 'Usa 25 000 técnicas', 'uses_all', 25000, 2500, 3),
  L('l_jefes10', 'Derrota a 10 jefes', 'bosses', 10, 500),
  L('l_jefes50', 'Derrota a 50 jefes', 'bosses', 50, 1500, 2),
  L('l_altares25', 'Supera 25 altares o eventos', 'altars', 25, 400),
  L('l_altares100', 'Supera 100 altares o eventos', 'altars', 100, 1200, 2),
  L('l_infinito10', 'Aguanta 10 minutos en supervivencia infinita (en total)', 'endless', 600, 600),
  L('l_infinito60', 'Aguanta 1 hora en supervivencia infinita (en total)', 'endless', 3600, 2000, 3),
  L('l_niveles500', 'Sube 500 niveles (sumando partidas)', 'levels', 500, 600),
  L('l_combos5', 'Aprende 5 técnicas combinadas (sumando partidas)', 'combos', 5, 600, 2),
  L('l_15min', 'Sobrevive 15 minutos en una partida', 'best_time', 900, 500, 2),
  L('l_1000bajas', 'Derrota a 1000 rivales en una partida', 'best_kills', 1000, 600, 2),
  L('l_nivel30', 'Llega al nivel 30 en una partida', 'best_level', 30, 600, 2),
  L('l_col100', 'Ten 100 futbolistas en tu colección', 'col_owned', 100, 600),
  L('l_col500', 'Ten 500 futbolistas en tu colección', 'col_owned', 500, 2500, 3),
  L('l_col1000', 'Ten 1000 futbolistas en tu colección', 'col_owned', 1000, 5000, 3),
  L('l_equipos3', 'Completa 3 equipos principales', 'col_teams', 3, 1200, 2),
  L('l_equipos10', 'Completa 10 equipos principales', 'col_teams', 10, 4000, 3),
  L('l_ascensos5', 'Asciende a 5 futbolistas', 'col_ascended', 5, 1200, 2),
  L('l_heroes5', 'Convierte a 5 futbolistas en HÉROE', 'col_heroes', 5, 4000, 3),
  L('l_fichajes100', 'Consigue 100 fichajes nuevos', 'news', 100, 800, 2),
  L('l_favorito10', 'Juega 10 partidas con 3 o más de tu equipo favorito', 'runs_fav', 10, 500),
  L('l_eraGo', 'Juega 10 partidas con un capitán de la era GO', 'runs_era_go', 10, 400),
  L('l_eraVr', 'Juega 10 partidas con un capitán de Victory Road', 'runs_era_vr', 10, 400),
  L('l_eraOriginal', 'Juega 10 partidas con un capitán de la saga original', 'runs_era_original', 10, 400),
  // v1.5: Auras (every one checked from what really happened: the save, the stats or the run)
  L('a_primera', 'Equipa tu primera Aura', 'aura_equipped', 1, 200),
  L('a_vinculo', 'Equipa un Aura compatible (♥)', 'aura_bond', 1, 400),
  L('a_110', 'Lleva una estadística efectiva a 110 con un Aura', 'aura_max', 110, 600, 2),
  L('a_120', 'Lleva una estadística efectiva a 120 con un Aura', 'aura_max', 120, 1500, 3),
  L('a_heredada', 'Usa 50 técnicas heredadas de un Aura', 'aura_inherited', 50, 300),
  L('a_heredada1000', 'Usa 1000 técnicas heredadas de un Aura', 'aura_inherited', 1000, 1200, 2),
  L('a_conjunta', 'Ejecuta una técnica conjunta con un Aura', 'aura_joint', 1, 500),
  L('a_conjunta50', 'Ejecuta 50 técnicas conjuntas con Auras', 'aura_joint', 50, 1500, 2),
  L('a_partida', 'Completa una arena con Auras en el equipo', 'wins_aura', 1, 500),
  L('a_partidas25', 'Completa 25 arenas con Auras en el equipo', 'wins_aura', 25, 2500, 3),
  // v1.5: collection
  L('c_legend5', 'Consigue 5 Legendarios', 'col_legend', 5, 400),
  L('c_legend25', 'Consigue 25 Legendarios', 'col_legend', 25, 1200, 2),
  L('c_mitico', 'Consigue un Mítico', 'col_mitico', 1, 600),
  L('c_leyenda', 'Consigue una Leyenda', 'col_leyenda', 1, 1500, 2),
  L('c_eras', 'Ten futbolistas de las tres eras (original, GO y Victory Road)', 'col_eras', 3, 500),
  // v1.5: combat
  L('k_rangos', 'Gana en los cinco rangos (C, B, A, S y X)', 'ranks_won', 5, 3000, 3),
  L('k_jefes200', 'Derrota a 200 jefes', 'bosses', 200, 4000, 3),
  L('k_20min', 'Sobrevive 20 minutos en una partida', 'best_time', 1200, 1500, 3),
  // v1.5: progression
  L('g_entreno', 'Reparte 20 puntos de entrenamiento', 'prog_train', 20, 300),
  L('g_entreno200', 'Reparte 200 puntos de entrenamiento', 'prog_train', 200, 1500, 2),
  L('g_mejoras', 'Compra 20 niveles de mejoras permanentes', 'prog_upgrades', 20, 600),
  L('g_tecnicas', 'Desbloquea 10 técnicas en la tienda', 'prog_techs', 10, 600),
  L('g_misiones', 'Cobra 100 misiones y logros', 'prog_claims', 100, 1500, 2),
];

/**
 * Collection goals read the collection itself (not run counters): owned players, ascended players and complete main
 * teams. Called when the missions screen opens and after pulls or ascensions.
 */
export function recordCollection(s: SaveData, roster: { id: number; teams: string[]; rarity?: string; era?: string }[], mainTeams: string[], auraMax = 0) {
  const owned = Object.values(s.owned);
  const c = s.missions.counters;
  // v1.5: rarities and eras owned, progression already made, and the Aura milestones (best only ever goes up)
  const have = roster.filter((p) => s.owned[String(p.id)]);
  c.col_legend = have.filter((p) => p.rarity === 'legendario').length;
  c.col_mitico = have.filter((p) => p.rarity === 'mitico').length;
  c.col_leyenda = have.filter((p) => p.rarity === 'leyenda').length;
  c.col_eras = new Set(have.map((p) => p.era).filter(Boolean)).size;
  c.prog_train = owned.reduce((a, o) => a + Object.values(o.train ?? {}).reduce<number>((x, v) => x + (Number(v) || 0), 0), 0);
  c.prog_upgrades = Object.values(s.upgrades ?? {}).reduce((a, v) => a + (Number(v) || 0), 0);
  c.prog_techs = Object.values(s.shop?.techUnlocks ?? {}).reduce((a, v) => a + v.length, 0);
  c.prog_claims = s.missions.claimed.length;
  if (s.achAura?.equipped) c.aura_equipped = 1;
  if (s.achAura?.bond) c.aura_bond = 1;
  c.aura_max = Math.max(c.aura_max ?? 0, auraMax);
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

/**
 * Fix 1.23: the clock of the periods. The game sets it to the server's (serverTime.ts); while the server hasn't answered
 * the device clock isn't trusted, so a day or week that has started can't be replaced (changing the PC's date used to
 * reset the daily missions and pay them again). Tests keep the plain clock.
 */
let periodNow = () => new Date();
let periodTrusted = () => true;
export function setPeriodClock(now: () => Date, trusted: () => boolean) { periodNow = now; periodTrusted = trusted; }

/** Clears period counters when the day or week has changed (never back to an earlier day, never on an untrusted clock). */
export function rollPeriods(s: SaveData, now = periodNow()) {
  const m = s.missions;
  const may = (key: string, next: string) => !key || (periodTrusted() && next > key);
  if (m.daily.key !== dayKey(now) && may(m.daily.key, dayKey(now))) m.daily = { key: dayKey(now), counters: {} };
  if (m.weekly.key !== weekKey(now) && may(m.weekly.key, weekKey(now))) m.weekly = { key: weekKey(now), counters: {} };
}

/** Adds to a counter in the lifetime, daily and weekly bags (things that happen outside runs, e.g. new signings). */
export function addCounter(s: SaveData, key: string, v: number, now = periodNow()) {
  rollPeriods(s, now);
  const m = s.missions;
  for (const bag of [m.counters, m.daily.counters, m.weekly.counters]) bag[key] = (bag[key] ?? 0) + v;
}

/** Adds a finished run to every counter. */
export function recordRun(s: SaveData, r: RunResult, now = periodNow()) {
  rollPeriods(s, now);
  const add: Record<string, number> = { runs: 1, kills: r.kills, time: Math.floor(r.timeSec), wins: r.victory ? 1 : 0,
    levels: Math.max(0, (r.level ?? 1) - 1), bosses: r.bossDefeated ? 1 : 0, altars: r.altars ?? 0, endless: Math.floor(r.endlessSec ?? 0),
    combos: r.combos?.length ?? 0 };
  if (r.victory && r.rank) { add[`wins_${r.rank}`] = 1; if (['A', 'S', 'X'].includes(r.rank)) add.wins_hi = 1; if (r.rank !== 'C') add.wins_hi_b = 1; }
  if (r.victory && r.formation) add[`wins_${r.formation}`] = 1;
  // Fix 1.11 counters: formation played, era of the captain, favourite team, arena, long survivals
  if (r.formation) add[`runs_${r.formation}`] = 1;
  if (r.captainEra) add[`runs_era_${r.captainEra}`] = 1;
  if ((r.favoriteOnPitch ?? 0) >= 3) add.runs_fav = 1;
  if (r.victory) add[`wins_map_${r.mapId}`] = 1;
  if (r.timeSec >= 240) add.long_runs = 1;
  for (const [k, v] of Object.entries(r.techUses ?? {})) add[`uses_${k}`] = v;
  add.uses_all = Object.values(r.techUses ?? {}).reduce((a, v) => a + v, 0);
  const m = s.missions;
  for (const bag of [m.counters, m.daily.counters, m.weekly.counters]) for (const [k, v] of Object.entries(add)) bag[k] = (bag[k] ?? 0) + v;
  const best = (k: string, v: number) => { m.counters[k] = Math.max(m.counters[k] ?? 0, v); };
  best('best_time', Math.floor(r.timeSec));
  best('best_kills', r.kills);
  best('best_level', r.level ?? 0);
  best('best_tech', r.maxTechLevel ?? 0);
  m.counters.arenas = s.clearedMaps.length;
  // v1.5: Auras in the run, and the ranks won at least once anywhere
  m.counters.aura_inherited = (m.counters.aura_inherited ?? 0) + (r.auraTechUses ?? 0);
  m.counters.aura_joint = (m.counters.aura_joint ?? 0) + (r.auraCombos ?? 0);
  if (r.victory && r.withAuras) m.counters.wins_aura = (m.counters.wins_aura ?? 0) + 1;
  m.counters.ranks_won = (['C', 'B', 'A', 'S', 'X'] as const).filter((k) => (m.counters[`wins_${k}`] ?? 0) > 0).length;
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
/** 1.86 (author): missions and achievements pay double coins */
export const MISSION_COIN_BOOST = 2;

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
  const coins = Math.round(d.coins * mult * MISSION_COIN_BOOST);
  s.missions.claimed.push(claimId(s, d));
  s.coins += coins;
  s.tokens += d.tokens;
  s.trainTokens = (s.trainTokens ?? 0) + (d.train ?? 0);
  if (d.dupe && roster) {
    // the owned Legendary/Mythic with the fewest copies: the copy helps the ascension that is furthest away
    const pick = roster.filter((p) => (p.rarity === 'legendario' || p.rarity === 'mitico' || p.rarity === 'leyenda') && s.owned[String(p.id)])
      .sort((a, b) => s.owned[String(a.id)].copies - s.owned[String(b.id)].copies)[0];
    if (pick) { const o = s.owned[String(pick.id)]; o.copies += 1; s.missions.lastDupe = pick.id; } // 1.86: no free star (stars are bought, 1.84)
  }
  return coins;
}
