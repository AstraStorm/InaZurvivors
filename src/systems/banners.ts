/**
 * Gacha banners (Fix 1.11): one machine per era plus a team machine. Every character belongs to exactly ONE era — the
 * earliest it appears in — so nobody is in two era machines. Odds are computed on each machine's own pool so that a
 * specific player of a higher rarity is always rarer than a specific player of the rarity below (a given Mítico is at most
 * half as likely as a given Legendario, a Leyenda half a Mítico); the share taken away from the top falls to Común.
 */
import type { Rarity, RosterEntry } from '../data/manifest';
import { RARITY_ORDER } from '../data/manifest';
import { sagaOf } from '../data/sagas';
import { RARITY_WEIGHTS } from './gacha';

// Fix 1.31: one machine per SAGA (author's request), priced by how likely its stars are; the eras stay for missions
export type BannerId = 'ff' | 'alius' | 'ffi' | 'go' | 'chrono' | 'galaxy' | 'ares' | 'orion' | 'fichatron' | 'equipo';
export interface BannerDef { id: BannerId; label: string; tagline: string; cost: number; multiCost: number; color: string }

/** cost/multiCost here are the defaults; the real price of a saga machine comes from bannerPrice() */
export const BANNERS: Record<BannerId, BannerDef> = {
  ff: { id: 'ff', label: 'Fútbol Frontier', tagline: 'Inazuma Eleven 1', cost: 10, multiCost: 100, color: '#ff8a2a' },
  alius: { id: 'alius', label: 'Invasión Alius', tagline: 'Inazuma Eleven 2 y el viaje por Japón', cost: 10, multiCost: 100, color: '#ff4f6a' },
  ffi: { id: 'ffi', label: 'Mundial FFI', tagline: 'Inazuma Eleven 3 y las selecciones', cost: 10, multiCost: 100, color: '#4f8bff' },
  go: { id: 'go', label: 'Inazuma Eleven GO', tagline: 'Sector Quinto y la Revolución', cost: 10, multiCost: 100, color: '#4fd0ff' },
  chrono: { id: 'chrono', label: 'Chrono Stone', tagline: 'El Dorado, Protocolo Omega y los Miximax', cost: 10, multiCost: 100, color: '#b36bff' },
  galaxy: { id: 'galaxy', label: 'Galaxy', tagline: 'Earth Eleven y el Grand Celesta', cost: 10, multiCost: 100, color: '#5af0e0' },
  ares: { id: 'ares', label: 'Ares', tagline: 'Victory Road: Ares no Tenbin', cost: 10, multiCost: 100, color: '#ffd84a' },
  orion: { id: 'orion', label: 'Orion', tagline: 'Victory Road: Orion no Kokuin', cost: 10, multiCost: 100, color: '#ff9ad8' },
  fichatron: { id: 'fichatron', label: 'Fichatrón', tagline: 'Fichajes sueltos de toda la serie', cost: 5, multiCost: 50, color: '#9aa8c8' },
  equipo: { id: 'equipo', label: 'Por equipo', tagline: 'Elige un equipo: solo sus futbolistas', cost: 15, multiCost: 150, color: '#7dff9a' },
};
export const BANNER_ORDER: BannerId[] = ['ff', 'alius', 'ffi', 'go', 'chrono', 'galaxy', 'ares', 'orion', 'fichatron', 'equipo'];

const GO = new Set(['GO', 'Chrono Stones', 'Galaxy']);
const VR = new Set(['Ares', 'Orion']);

/** The one era a character belongs to: the original games first, then GO, then Victory Road (missions use it). */
export function eraOf(p: Pick<RosterEntry, 'teams'> & { era?: RosterEntry['era'] }): 'original' | 'go' | 'vr' {
  if (p.era) return p.era; // Fix 1.23: the character's first game (wiki); the teams below are only a fallback
  const sagas = p.teams.map(sagaOf);
  if (sagas.some((s) => !GO.has(s) && !VR.has(s) && s !== 'Otros equipos' && s !== 'Selecciones y leyendas')) return 'original';
  if (sagas.some((s) => GO.has(s))) return 'go';
  if (sagas.some((s) => VR.has(s))) return 'vr';
  return 'original';
}

/** saga of the encyclopedia -> its machine, in story order (a character goes to the earliest one) */
const SAGA_MACHINE: [string, BannerId][] = [['Fútbol Frontier', 'ff'], ['Invasión Alius', 'alius'], ['Viaje por Japón', 'alius'], ['Mundial FFI', 'ffi'],
  ['GO', 'go'], ['Chrono Stones', 'chrono'], ['Galaxy', 'galaxy'], ['Ares', 'ares'], ['Orion', 'orion']];
/** Miximax forms (sync-assets isMixi): «+» in the name or ending in « MM» — they come from Chrono Stone */
const isMixi = (name: string) => /\+| MM$/.test(name);

/** The one saga machine a character comes out of: his earliest story saga; scouts with no story team go to the Fichatrón. */
export function machineOf(p: Pick<RosterEntry, 'teams' | 'name'> & { era?: RosterEntry['era'] }): Exclude<BannerId, 'equipo'> {
  if (isMixi(p.name)) return 'chrono';
  const sagas = new Set(p.teams.map(sagaOf));
  const hit = SAGA_MACHINE.find(([s]) => sagas.has(s as never));
  if (hit) return hit[1] as Exclude<BannerId, 'equipo'>;
  if (p.era === 'go') return 'go';
  if (p.era === 'vr') return 'ares';
  return 'fichatron';
}

/** Team machine: only teams with enough players, so a tiny roster can't be farmed for its one star. */
export const TEAM_MIN_PLAYERS = 8;
/**
 * Small machines (a team, Victory Road): highest chance any single player of these rarities may have (%), so a short
 * roster can't hand out its stars; what is trimmed goes to Común and Raro.
 */
const SMALL_CAP: Partial<Record<BannerId, Partial<Record<Rarity, number>>>> = {
  equipo: { epico: 2.5, legendario: 1.2, mitico: 0.5, leyenda: 0.15 },
  ares: { legendario: 1.2, mitico: 0.5, leyenda: 0.15 },
  orion: { legendario: 1.2, mitico: 0.5, leyenda: 0.15 },
  // the Fichatrón is loose scouts: its few stars must not come out every few pulls
  fichatron: { epico: 1, legendario: 0.3, mitico: 0.1, leyenda: 0.05 },
};

export function bannerPool(roster: RosterEntry[], banner: BannerId, team?: string): RosterEntry[] {
  if (banner === 'equipo') return team ? roster.filter((p) => p.teams.includes(team)) : [];
  return roster.filter((p) => machineOf(p) === banner);
}

export function teamChoices(roster: RosterEntry[], mainTeams: string[]): { team: string; size: number }[] {
  return mainTeams.map((t) => ({ team: t, size: roster.filter((p) => p.teams.includes(t)).length }))
    .filter((x) => x.size >= TEAM_MIN_PLAYERS).sort((a, b) => a.team.localeCompare(b.team));
}

/**
 * Fix 1.31: round, easy prices by what a machine holds, as the author asked — the more Míticos, the dearer:
 *   no Legendario or better: 5 fichas · no Mítico: 10 · 1 to 5 Míticos (or a Leyenda): 15 · 6 or more Míticos: 20.
 * The Fichatrón (loose scouts) is always 5 and a team 15. The ×10 is always ten times the single pull.
 */
export function bannerPrice(pool: RosterEntry[], banner: BannerId): { cost: number; multiCost: number; mythics: number } {
  const n = (r: Rarity) => pool.filter((p) => p.rarity === r).length;
  const mythics = n('mitico'), stars = n('legendario') + mythics + n('leyenda');
  const cost = banner === 'fichatron' ? 5 : banner === 'equipo' ? 15
    : !stars ? 5 : mythics >= 6 ? 20 : mythics || n('leyenda') ? 15 : 10;
  return { cost, multiCost: cost * 10, mythics };
}

/**
 * Percent chance of each rarity on this pool. Empty rarities pass their share down; then, from Legendario up, each
 * rarity is trimmed so its per-player chance is at most half the per-player chance of the rarity below; on the team
 * machine the top rarities are also capped per player. Everything trimmed goes to Común (or the lowest non-empty rarity).
 */
export function rarityOdds(pool: RosterEntry[], banner: BannerId = 'ff'): Record<Rarity, number> {
  const count = Object.fromEntries(RARITY_ORDER.map((r) => [r, pool.filter((p) => p.rarity === r).length])) as Record<Rarity, number>;
  const out = Object.fromEntries(RARITY_ORDER.map((r) => [r, 0])) as Record<Rarity, number>;
  const at = (i: number) => RARITY_ORDER[i];
  // an empty rarity hands its share to the nearest rarity that has players, lower first (never wrapping to the top)
  for (let i = 0; i < RARITY_ORDER.length; i++) {
    let to: Rarity | undefined;
    for (let d = 0; d < RARITY_ORDER.length && !to; d++) to = [at(i - d), at(i + d)].find((x) => x && count[x]);
    if (to) out[to] += RARITY_WEIGHTS[at(i)];
  }
  // low rarities with very few players (one Común in the GO machine) can't each be far likelier than the rarity above:
  // at most 3x a player of the next rarity up; the excess moves up
  const low: Rarity[] = ['comun', 'raro', 'epico'];
  for (const r of low) {
    if (!count[r]) continue;
    const up = RARITY_ORDER.slice(RARITY_ORDER.indexOf(r) + 1).find((x) => count[x]);
    if (!up) continue;
    const cap = (out[up] / count[up]) * 3 * count[r];
    if (out[r] > cap) { out[up] += out[r] - cap; out[r] = cap; }
  }
  let spare = 0;
  const caps = SMALL_CAP[banner] ?? {};
  for (const r of ['epico', 'legendario', 'mitico', 'leyenda'] as Rarity[]) {
    if (!count[r]) continue;
    const below = RARITY_ORDER.slice(0, RARITY_ORDER.indexOf(r)).reverse().find((x) => count[x]);
    let per = out[r] / count[r];
    if (below && (r === 'mitico' || r === 'leyenda')) per = Math.min(per, (out[below] / count[below]) * 0.5);
    if (caps[r] !== undefined) per = Math.min(per, caps[r]!);
    const keep = per * count[r];
    spare += out[r] - keep;
    out[r] = keep;
  }
  // what the top rarities gave up goes to Común and Raro (Épico too on the big machines), in proportion to their share
  const base = (caps.epico !== undefined ? low.slice(0, 2) : low).filter((r) => count[r]);
  const sum = base.reduce((a, r) => a + out[r], 0);
  for (const r of base) out[r] += sum ? spare * out[r] / sum : spare / base.length;
  return out;
}

/** Percent chance of one specific player of each rarity on this pool. */
export function perPlayerOdds(pool: RosterEntry[], banner: BannerId = 'ff'): Record<Rarity, number> {
  const odds = rarityOdds(pool, banner);
  return Object.fromEntries(RARITY_ORDER.map((r) => {
    const n = pool.filter((p) => p.rarity === r).length;
    return [r, n ? odds[r] / n : 0];
  })) as Record<Rarity, number>;
}

/** Picks a rarity with these odds (percent). */
export function rollWith(odds: Record<Rarity, number>, rng: () => number, minRarity?: Rarity): Rarity {
  const allowed = RARITY_ORDER.filter((r) => odds[r] > 0 && (!minRarity || RARITY_ORDER.indexOf(r) >= RARITY_ORDER.indexOf(minRarity)));
  const total = allowed.reduce((a, r) => a + odds[r], 0);
  let x = rng() * total;
  for (const r of allowed) { x -= odds[r]; if (x < 0) return r; }
  return allowed[allowed.length - 1] ?? 'comun';
}

/** Players shown on the banner: the rarest of its pool. */
export const featured = (pool: RosterEntry[], n = 4) =>
  [...pool].sort((a, b) => RARITY_ORDER.indexOf(b.rarity) - RARITY_ORDER.indexOf(a.rarity)).slice(0, n);
