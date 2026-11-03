/**
 * Fix 1.22: what a footballer's stats do in a run. Before this only Velocidad did something (the captain's speed); now every
 * stat has a real, moderate effect, centred on 60 (the usual value) and applied to that footballer's own techniques, or to
 * the captain when that is who matters (only the captain takes damage). The same numbers feed the menus, so what the
 * card says is what the game does.
 */
import type { RosterEntry, TechType } from '../data/manifest';

export const STAT_CENTER = 60;
// v1.5: up to 120 — a stat only goes over 99 with an Aura (auras.ts), and that is still a real, effective value in combat
const clamp = (v: number) => Math.max(30, Math.min(120, v));
const over = (v: number | undefined) => clamp(v ?? STAT_CENTER) - STAT_CENTER;

export interface StatInfo { key: string; name: string; short: string; what: (v: number) => string }

/** Effect of each stat, from its value, as the menus explain it. */
export const STAT_INFO: StatInfo[] = [
  { key: 'kick', name: 'Tiro', short: 'TIR', what: (v) => `${signPct(over(v) * 0.006)} daño de sus tiros` },
  { key: 'control', name: 'Control', short: 'CON', what: (v) => `${signPct(over(v) * 0.006)} daño de sus regates` },
  { key: 'guard', name: 'Defensa', short: 'DEF', what: (v) => `${signPct(over(v) * 0.006)} daño de sus defensas y paradas; como capitán, ${signPct(-over(v) * 0.004)} daño recibido` },
  { key: 'body', name: 'Físico', short: 'FÍS', what: (v) => `${signPct(over(v) * 0.005)} vida que aporta al equipo` },
  { key: 'speed', name: 'Velocidad', short: 'VEL', what: (v) => `como capitán, ${signPct(over(v) * 0.15 / 101)} velocidad de movimiento` },
  { key: 'guts', name: 'Agallas', short: 'AGA', what: (v) => `${signPct(over(v) * 0.003)} daño de todas sus técnicas` },
  { key: 'stamina', name: 'Aguante', short: 'AGU', what: (v) => `${signPct(-over(v) * 0.003)} recarga de sus técnicas` },
];

function signPct(x: number) {
  const v = Math.round(x * 1000) / 10;
  return `${v >= 0 ? '+' : '−'}${Math.abs(v).toString().replace('.', ',')}%`;
}

/** Damage multiplier of one of this footballer's techniques. */
export function statDamage(p: Pick<RosterEntry, 'stats'>, type: TechType) {
  const s = p.stats ?? {};
  const own = type === 'tiro' ? over(s.kick) : type === 'regate' ? over(s.control) : type === 'defensa' || type === 'parada' ? over(s.guard) : 0;
  return (1 + own * 0.006) * (1 + over(s.guts) * 0.003);
}
/** Cooldown multiplier of this footballer's techniques. */
export const statCooldown = (p: Pick<RosterEntry, 'stats'>) => 1 - over(p.stats?.stamina) * 0.003;
/** Multiplier of the health this footballer brings to the team. */
export const statHealth = (p: Pick<RosterEntry, 'stats'>) => 1 + over(p.stats?.body) * 0.005;
/** Damage taken multiplier when this footballer is the captain. */
export const statTaken = (p: Pick<RosterEntry, 'stats'>) => 1 - over(p.stats?.guard) * 0.004;
