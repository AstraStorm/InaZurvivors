/**
 * Fix 1.22: what a footballer's stats do in a run. Before this only Velocidad did something (the captain's speed); now every
 * stat has a real, moderate effect, centred on 60 (the usual value) and applied to that footballer's own techniques, or to
 * the captain when that is who matters (only the captain takes damage). The same numbers feed the menus, so what the
 * card says is what the game does.
 */
import type { RosterEntry, TechType } from '../data/manifest';
import { tr } from '../i18n/i18n';

export const STAT_CENTER = 60;
// v1.5: up to 120 — a stat only goes over 99 with an Aura (auras.ts), and that is still a real, effective value in combat
const clamp = (v: number) => Math.max(30, Math.min(120, v));
const over = (v: number | undefined) => clamp(v ?? STAT_CENTER) - STAT_CENTER;

export interface StatInfo { key: string; name: string; short: string; what: (v: number) => string }

/** Effect of each stat, from its value, as the menus explain it. */
export const STAT_INFO: StatInfo[] = [
  { key: 'kick', name: tr('Tiro'), short: tr('TIR'), what: (v) => tr('{x1} daño de sus tiros', { x1: signPct(over(v) * 0.006) }) },
  { key: 'control', name: tr('Control'), short: tr('CON'), what: (v) => tr('{x1} daño de sus regates', { x1: signPct(over(v) * 0.006) }) },
  { key: 'guard', name: tr('Defensa'), short: tr('DEF'), what: (v) => tr('{x1} daño de sus defensas y paradas; como capitán, {x2} daño recibido', { x1: signPct(over(v) * 0.006), x2: signPct(-over(v) * 0.004) }) },
  { key: 'body', name: tr('Físico'), short: tr('FÍS'), what: (v) => tr('{x1} vida que aporta al equipo', { x1: signPct(over(v) * 0.005) }) },
  { key: 'speed', name: tr('Velocidad'), short: tr('VEL'), what: (v) => tr('como capitán, {x1} velocidad de movimiento', { x1: signPct(over(v) * 0.15 / 101) }) },
  { key: 'guts', name: tr('Agallas'), short: tr('AGA'), what: (v) => tr('{x1} daño de todas sus técnicas', { x1: signPct(over(v) * 0.003) }) },
  { key: 'stamina', name: tr('Aguante'), short: tr('AGU'), what: (v) => tr('{x1} recarga de sus técnicas', { x1: signPct(-over(v) * 0.003) }) },
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
