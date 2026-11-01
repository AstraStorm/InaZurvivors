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

export type BannerId = 'original' | 'go' | 'vr' | 'equipo';
export interface BannerDef { id: BannerId; label: string; tagline: string; cost: number; multiCost: number; color: string }

export const BANNERS: Record<BannerId, BannerDef> = {
  original: { id: 'original', label: 'Inazuma Eleven', tagline: 'IE1, IE2, IE3 y el Mundial FFI', cost: 8, multiCost: 72, color: '#ff8a2a' },
  go: { id: 'go', label: 'Inazuma Eleven GO', tagline: 'GO, Chrono Stone y Galaxy', cost: 8, multiCost: 72, color: '#4fd0ff' },
  vr: { id: 'vr', label: 'Victory Road', tagline: 'Ares y Orion', cost: 8, multiCost: 72, color: '#ffd84a' },
  equipo: { id: 'equipo', label: 'Por equipo', tagline: 'Elige un equipo: solo sus futbolistas', cost: 14, multiCost: 126, color: '#b36bff' },
};
export const BANNER_ORDER: BannerId[] = ['original', 'go', 'vr', 'equipo'];

const GO = new Set(['GO', 'Chrono Stones', 'Galaxy']);
const VR = new Set(['Ares', 'Orion']);

/** The one era a character belongs to: the original games first, then GO, then Victory Road. */
export function eraOf(p: Pick<RosterEntry, 'teams'>): Exclude<BannerId, 'equipo'> {
  const sagas = p.teams.map(sagaOf);
  if (sagas.some((s) => !GO.has(s) && !VR.has(s) && s !== 'Otros equipos' && s !== 'Selecciones y leyendas')) return 'original';
  if (sagas.some((s) => GO.has(s))) return 'go';
  if (sagas.some((s) => VR.has(s))) return 'vr';
  return 'original';
}

/** Team machine: only teams with enough players, so a tiny roster can't be farmed for its one star. */
export const TEAM_MIN_PLAYERS = 8;
/**
 * Small machines (a team, Victory Road): highest chance any single player of these rarities may have (%), so a short
 * roster can't hand out its stars; what is trimmed goes to Común and Raro.
 */
const SMALL_CAP: Partial<Record<BannerId, Partial<Record<Rarity, number>>>> = {
  equipo: { epico: 2.5, legendario: 1.2, mitico: 0.5, leyenda: 0.15 },
  vr: { legendario: 1.2, mitico: 0.5, leyenda: 0.15 },
};

export function bannerPool(roster: RosterEntry[], banner: BannerId, team?: string): RosterEntry[] {
  if (banner === 'equipo') return team ? roster.filter((p) => p.teams.includes(team)) : [];
  return roster.filter((p) => eraOf(p) === banner);
}

export function teamChoices(roster: RosterEntry[], mainTeams: string[]): { team: string; size: number }[] {
  return mainTeams.map((t) => ({ team: t, size: roster.filter((p) => p.teams.includes(t)).length }))
    .filter((x) => x.size >= TEAM_MIN_PLAYERS).sort((a, b) => a.team.localeCompare(b.team));
}

/**
 * Percent chance of each rarity on this pool. Empty rarities pass their share down; then, from Legendario up, each
 * rarity is trimmed so its per-player chance is at most half the per-player chance of the rarity below; on the team
 * machine the top rarities are also capped per player. Everything trimmed goes to Común (or the lowest non-empty rarity).
 */
export function rarityOdds(pool: RosterEntry[], banner: BannerId = 'original'): Record<Rarity, number> {
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
export function perPlayerOdds(pool: RosterEntry[], banner: BannerId = 'original'): Record<Rarity, number> {
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
