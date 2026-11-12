/**
 * Talents as real passives. The talent itself comes from the games (technique ids 51-81 are the same in IE2 and IE3);
 * what it does here is an adaptation to a survivors game, not the game's number. A footballer whose documented moves have
 * no talent gets a passive of InaZurvivors chosen from its position, always shown as such. Totals go through balance.ts.
 */
import type { RosterEntry, TechType } from '../data/manifest';
import { tr } from '../i18n/i18n';
import { tEl } from '../i18n/data';

export interface TalentFx {
  speed: number; regen: number; crit: number; luck: number; xp: number; cooldown: number; shield: number; elemental: number;
  /** extra damage of everyone's techniques by type, by element, and for the whole team */
  type: Partial<Record<TechType, number>>; element: Record<string, number>; team: number;
  /** extra damage below 30% health */
  lastStand: number; /** share of max health recovered once per run (0 = none) */ revive: number; taken: number;
  /** Fix 1.11, effects closer to the games: extra critical multiplier (base ×1,8), power of goalkeeper techniques (damage,
   * healing and shield), damage against male / female rivals, chance that a hit freezes the rival for a moment, chance
   * that a hit curses it (slower, takes more damage), healing while the captain stands still, extra damage of the
   * elemental effect (base +20%) */
  critDamage: number; keeper: number; vsMale: number; vsFemale: number; stun: number; curse: number; idleRegen: number; elementalPower: number;
}
export const emptyFx = (): TalentFx => ({ speed: 0, regen: 0, crit: 0, luck: 0, xp: 0, cooldown: 0, shield: 0, elemental: 0, type: {}, element: {}, team: 0, lastStand: 0, revive: 0, taken: 0,
  critDamage: 0, keeper: 0, vsMale: 0, vsFemale: 0, stun: 0, curse: 0, idleRegen: 0, elementalPower: 0 });

type Effect = { name: string; text: string; apply(f: TalentFx, k: number): void };
const addType = (f: TalentFx, t: TechType, v: number) => { f.type[t] = (f.type[t] ?? 0) + v; };
const addElem = (f: TalentFx, e: string, v: number) => { f.element[e] = (f.element[e] ?? 0) + v; };

/**
 * Keyed by technique id. `name` is the name shown everywhere: the official Spanish one of IE2 (Mejor garantía for 77; the
 * author chose Femme fatale and Casanova for 58 and 59 in Fix 1.21).
 * Fix 1.11: every talent does what it does in the games, translated to this one (its text is generated from these numbers,
 * describeFx): Portero+ strengthens goalkeeper techniques, Femme fatale works on male rivals and Casanova on female ones,
 * ¡Trampa! (Ikasama) freezes rivals for an instant, Gafe (Yakubyougami) curses them, Pereza heals only standing still...
 */
export const TALENTS: Record<number, Effect> = {
  51: { name: 'Portero+', text: tr('Técnicas de portero más potentes'), apply: (f, k) => { f.keeper += 0.12 * k; } },
  52: { name: 'Rapidez+', text: tr('Más velocidad'), apply: (f, k) => { f.speed += 0.04 * k; } },
  53: { name: 'Tiro+', text: tr('Tiros más fuertes'), apply: (f, k) => addType(f, 'tiro', 0.1 * k) },
  54: { name: 'Defensa+', text: tr('Defensas más fuertes y algo menos de daño recibido'), apply: (f, k) => { addType(f, 'defensa', 0.1 * k); f.shield += 0.015 * k; } },
  55: { name: 'Ataque+', text: tr('Regates más fuertes'), apply: (f, k) => addType(f, 'regate', 0.1 * k) },
  56: { name: 'Recobro', text: tr('Recupera vida con el tiempo'), apply: (f, k) => { f.regen += 0.0015 * k; } },
  57: { name: 'Piscinazo', text: tr('A veces deja al rival clavado en el sitio'), apply: (f, k) => { f.stun += 0.05 * k; f.crit += 0.01 * k; } },
  58: { name: 'Femme fatale', text: tr('Más daño contra rivales masculinos'), apply: (f, k) => { f.vsMale += 0.15 * k; } },
  59: { name: 'Casanova', text: tr('Más daño contra rivales femeninas'), apply: (f, k) => { f.vsFemale += 0.15 * k; } },
  60: { name: 'Ahorro', text: tr('Técnicas más frecuentes'), apply: (f, k) => { f.cooldown += 0.05 * k; } },
  61: { name: 'Ultratécnica', text: tr('Todas las técnicas más fuertes'), apply: (f, k) => { f.team += 0.04 * k; f.cooldown += 0.02 * k; } },
  62: { name: 'Carga elemental', text: tr('Efecto elemental más frecuente y más fuerte'), apply: (f, k) => { f.elemental += 0.03 * k; f.elementalPower += 0.15 * k; } },
  63: { name: 'Repaso', text: tr('Más experiencia'), apply: (f, k) => { f.xp += 0.08 * k; } },
  64: { name: 'Vagueza', text: tr('Se recupera quieto, pero pega menos'), apply: (f, k) => { f.idleRegen += 0.004 * k; f.team -= 0.03; } },
  65: { name: 'Lance crítico', text: tr('Más críticos y más fuertes'), apply: (f, k) => { f.crit += 0.03 * k; f.critDamage += 0.2 * k; } },
  66: { name: 'Anti afinidades', text: tr('Menos daño recibido'), apply: (f, k) => { f.shield += 0.03 * k; } },
  67: { name: 'Suerte', text: tr('Más objetos raros'), apply: (f, k) => { f.luck += 0.08 * k; } },
  68: { name: 'Gafe', text: tr('Maldice a los rivales que golpea'), apply: (f, k) => { f.curse += 0.06 * k; } },
  69: { name: 'Fuerza veloz', text: tr('Mucha más velocidad'), apply: (f, k) => { f.speed += 0.06 * k; } },
  70: { name: 'Fuerza de tiro', text: tr('Tiros mucho más fuertes'), apply: (f, k) => { addType(f, 'tiro', 0.12 * k); f.critDamage += 0.1 * k; } },
  71: { name: 'Fuerza defensiva', text: tr('Defensas mucho más fuertes'), apply: (f, k) => { addType(f, 'defensa', 0.12 * k); f.shield += 0.02 * k; } },
  72: { name: 'Fuerza ofensiva', text: tr('Regates mucho más fuertes'), apply: (f, k) => { addType(f, 'regate', 0.12 * k); f.stun += 0.02 * k; } },
  73: { name: 'Siempre a muerte', text: tr('Más daño con poca vida'), apply: (f, k) => { f.lastStand += 0.15 * k; } },
  74: { name: '¡Vamos!', text: tr('Más daño del equipo'), apply: (f, k) => { f.team += 0.04 * k; } },
  75: { name: '¡Vamos todos!', text: tr('Más daño y velocidad del equipo'), apply: (f, k) => { f.team += 0.04 * k; f.speed += 0.03 * k; } },
  76: { name: '¡Resurgir!', text: tr('Una vez por partida recupera vida al quedar por debajo del 20%'), apply: (f, k) => { f.revive = Math.max(f.revive, 0.2 * k); } },
  77: { name: 'Mejor garantía', text: tr('Golpes con toda el alma'), apply: (f, k) => { f.crit += 0.02 * k; f.critDamage += 0.25 * k; } },
  78: { name: '¡Como el viento!', text: tr('+12% daño de técnicas de Aire'), apply: (f, k) => addElem(f, 'Aire', 0.12 * k) },
  79: { name: '¡Como el bosque!', text: tr('+12% daño de técnicas de Bosque'), apply: (f, k) => addElem(f, 'Bosque', 0.12 * k) },
  80: { name: '¡Como el fuego!', text: tr('+12% daño de técnicas de Fuego'), apply: (f, k) => addElem(f, 'Fuego', 0.12 * k) },
  81: { name: '¡Como la montaña!', text: tr('+12% daño de técnicas de Montaña'), apply: (f, k) => addElem(f, 'Montaña', 0.12 * k) },
};

/** Technique level adds a quarter of the base effect per level. */
export const talentScale = (level: number) => 1 + Math.max(0, level - 1) * 0.25;

const RARITY_K: Record<string, number> = { comun: 1, raro: 1.3, epico: 1.6, legendario: 2, mitico: 2.4 };

export interface Passive { name: string; text: string; apply(f: TalentFx): void }
type Tpl = (p: RosterEntry, k: number) => Passive;
const pct = (v: number) => `${Math.round(v * 100)}%`;
const ELEMENTALIST: Tpl = (p, k) => ({ name: tr('Especialista: {element}', { element: tEl(p.element) }), text: tr('+{x1} daño de técnicas de {element}', { x1: pct(0.04 * k), element: tEl(p.element) }), apply: (f) => addElem(f, String(p.element), 0.04 * k) });
const SPIRIT: Tpl = (_p, k) => ({ name: tr('Espíritu de equipo'), text: tr('+{x1} daño del equipo', { x1: pct(0.015 * k) }), apply: (f) => { f.team += 0.015 * k; } });
const LAST: Tpl = (_p, k) => ({ name: tr('Último esfuerzo'), text: tr('+{x1} daño con menos del 30% de vida', { x1: pct(0.08 * k) }), apply: (f) => { f.lastStand += 0.08 * k; } });
const TECHNICIAN: Tpl = (_p, k) => ({ name: tr('Técnico'), text: `-${pct(0.025 * k)} recarga`, apply: (f) => { f.cooldown += 0.025 * k; } });
const LEADER: Tpl = (_p, k) => ({ name: tr('Líder'), text: tr('+{x1} daño del equipo', { x1: pct(0.02 * k) }), apply: (f) => { f.team += 0.02 * k; } });
const DEFENDER: Tpl = (_p, k) => ({ name: tr('Defensor'), text: tr('+{x1} de reducción de daño', { x1: pct(0.015 * k) }), apply: (f) => { f.shield += 0.015 * k; } });
const KEEPER: Tpl = (_p, k) => ({ name: tr('Guardameta'), text: tr('+{x1} potencia de las técnicas de portero', { x1: pct(0.06 * k) }), apply: (f) => { f.keeper += 0.06 * k; } });
const SNIPER: Tpl = (_p, k) => ({ name: tr('Remate certero'), text: tr('+{x1} daño de los críticos', { x1: pct(0.08 * k) }), apply: (f) => { f.critDamage += 0.08 * k; } });
const RUNNER: Tpl = (_p, k) => ({ name: tr('Incansable'), text: `+${pct(0.02 * k)} velocidad`, apply: (f) => { f.speed += 0.02 * k; } });
const STRIKER: Tpl = (_p, k) => ({ name: tr('Instinto goleador'), text: tr('+{x1} daño de tiros', { x1: pct(0.04 * k) }), apply: (f) => addType(f, 'tiro', 0.04 * k) });

const BY_POSITION: Record<string, Tpl[]> = {
  GK: [KEEPER, DEFENDER, SPIRIT], DF: [DEFENDER, LAST, SPIRIT, ELEMENTALIST], MF: [TECHNICIAN, LEADER, RUNNER, ELEMENTALIST], FW: [STRIKER, ELEMENTALIST, LAST, RUNNER, SNIPER],
};

/** Passive of InaZurvivors for a footballer with no documented talent; null when it has one of its own. */
export function adaptedPassive(p: RosterEntry): Passive | null {
  if (p.techniques.some((t) => t.type === 'talento')) return null;
  const list = BY_POSITION[p.position] ?? BY_POSITION.MF;
  return list[p.id % list.length](p, RARITY_K[p.rarity] ?? 1);
}

/** Fix 1.11: highest technique level, used to show what a talent does at its top. */
export const TALENT_MAX_LEVEL = 10;

/**
 * The text of a talent read from the numbers it really applies (TALENTS[...].apply), never typed by hand, so the description
 * can't drift from the effect. Limits that cut the total in combat (balance.ts) are named at the end.
 */
export function describeFx(f: TalentFx): string {
  const p = (v: number, d = 0) => `${(Math.round(v * 100 * 10 ** d) / 10 ** d).toString().replace('.', ',')}%`;
  const sign = (v: number, d = 0) => `${v >= 0 ? '+' : '-'}${p(Math.abs(v), d)}`;
  const out: string[] = [];
  if (f.team) out.push(tr('{sign} daño de todas las técnicas', { sign: sign(f.team) }));
  for (const [t, v] of Object.entries(f.type)) if (v) out.push(tr('{sign} daño de {x1}', { sign: sign(v), x1: t === 'tiro' ? 'tiros' : t === 'regate' ? 'regates' : t === 'defensa' ? tr('técnicas de defensa') : t }));
  for (const [e, v] of Object.entries(f.element)) if (v) out.push(tr('{sign} daño de técnicas de {e}', { sign: sign(v), e: tEl(e) }));
  if (f.lastStand) out.push(tr('{sign} daño con menos del 30% de vida (máx. +{p})', { sign: sign(f.lastStand), p: p(CAP_LAST_STAND) }));
  if (f.crit) out.push(tr('{sign} probabilidad de crítico', { sign: sign(f.crit) }));
  if (f.critDamage) out.push(tr('{sign} daño de los críticos (base ×1,8)', { sign: sign(f.critDamage) }));
  if (f.keeper) out.push(tr('{sign} potencia de las técnicas de portero (daño, curación y escudo)', { sign: sign(f.keeper) }));
  if (f.vsMale) out.push(tr('{sign} daño contra rivales masculinos', { sign: sign(f.vsMale) }));
  if (f.vsFemale) out.push(tr('{sign} daño contra rivales femeninas', { sign: sign(f.vsFemale) }));
  if (f.stun) out.push(tr('{p} de probabilidad de dejar al rival clavado 0,6 s al golpearlo (no a jefes)', { p: p(f.stun) }));
  if (f.curse) out.push(tr('{p} de probabilidad de maldecir al rival: 3 s más lento y recibe un 15% más de daño', { p: p(f.curse) }));
  if (f.idleRegen) out.push(tr('{sign} de vida por segundo con el capitán quieto', { sign: sign(f.idleRegen, 2) }));
  if (f.elementalPower) out.push(tr('{sign} daño del efecto elemental (base +20%)', { sign: sign(f.elementalPower) }));
  if (f.elemental) out.push(tr('{sign} probabilidad de efecto elemental (máx. {p} en total)', { sign: sign(f.elemental), p: p(CAP_ELEMENTAL) }));
  if (f.speed) out.push(`${sign(f.speed)} velocidad`);
  if (f.cooldown) out.push(`-${p(f.cooldown, 1)} recarga`);
  if (f.shield) out.push(tr('-{p} daño recibido por el capitán', { p: p(f.shield, 1) }));
  if (f.taken) out.push(tr('+{p} daño recibido por el capitán', { p: p(f.taken) }));
  if (f.regen) out.push(tr('{sign} de vida del capitán por segundo', { sign: sign(f.regen, 2) }));
  if (f.xp) out.push(`${sign(f.xp)} experiencia`);
  if (f.luck) out.push(`${sign(f.luck)} suerte`);
  if (f.revive) out.push(tr('{p} de vida recuperada una vez por partida al bajar del 20%', { p: p(f.revive) }));
  return out.join(', ');
}
/** Combined limits of talents (Fix 1.11): conditional damage and elemental chance can't stack without end. */
export const CAP_LAST_STAND = 0.6;
export const CAP_ELEMENTAL = 0.4;

/**
 * Fix 1.22: what a talent gains from one level to the next, read from its real effect (the upgrade cards showed the old
 * generic "team damage" of the talent type, which no longer does anything).
 */
export function talentChanges(id: number, level: number): { label: string; from: string; to: string }[] {
  const def = TALENTS[id];
  if (!def) return [];
  const parts = (lv: number) => { const f = emptyFx(); def.apply(f, talentScale(lv)); return describeFx(f).split(/, (?![^()]*\))/); }; // commas inside brackets belong to one effect
  const a = parts(level), b = parts(level + 1);
  const out: { label: string; from: string; to: string }[] = [];
  b.forEach((after, i) => {
    const m2 = /^([+-]?[\d,]+%)\s*(.*)$/.exec(after), m1 = /^([+-]?[\d,]+%)\s*(.*)$/.exec(a[i] ?? '');
    if (m2 && m1 && m1[2] === m2[2] && m1[1] !== m2[1]) out.push({ label: m2[2].replace(/^de /, '').replace(/\s*\(.*\)$/, '').replace(/:.*$/, ''), from: m1[1], to: m2[1] });
  });
  return out;
}

/** "Lv 1: …  ·  Lv 10: …" with the real values. */
export function talentText(id: number, level = 1): string {
  const def = TALENTS[id];
  if (!def) return '';
  const at = (lv: number) => { const f = emptyFx(); def.apply(f, talentScale(lv)); return describeFx(f); };
  return level >= TALENT_MAX_LEVEL ? at(TALENT_MAX_LEVEL) : `Nv ${level}: ${at(level)} · Nv ${TALENT_MAX_LEVEL}: ${at(TALENT_MAX_LEVEL)}`;
}
export const passiveText = (pa: Passive) => { const f = emptyFx(); pa.apply(f); return describeFx(f); };
