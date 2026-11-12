/**
 * Data-driven technique behaviours. Every player has a repertoire of up to four techniques from the ROM data and two
 * active slots in a run. TYPE (tiro/regate/defensa/parada/talento) selects the behaviour, POWER (command.dat) scales it.
 */
import type { TechType, Technique } from '../data/manifest';
import { getLang, tr } from '../i18n/i18n';

export const MAX_TECH_LEVEL = 10;
export const ACTIVE_SLOTS = 2;

export interface TechStats {
  damage: number;
  cooldownMs: number;
  count: number; // projectiles / chained dashes
  radius: number; // area (px)
  pierce: number;
  speed: number;
  knockback: number;
  heal: number; // fraction of max HP (parada)
  shield: number; // damage reduction (parada)
  teamDamageBonus: number; // talento passive
  explodes: boolean;
  slow: number; // speed multiplier applied to enemies hit (1 = none)
}

const BASE: Record<TechType, Omit<TechStats, 'damage' | 'explodes' | 'slow'>> = {
  tiro: { cooldownMs: 1500, count: 1, radius: 28, pierce: 0, speed: 260, knockback: 40, heal: 0, shield: 0, teamDamageBonus: 0 },
  regate: { cooldownMs: 1700, count: 1, radius: 30, pierce: 99, speed: 0, knockback: 30, heal: 0, shield: 0, teamDamageBonus: 0 },
  defensa: { cooldownMs: 2800, count: 1, radius: 46, pierce: 99, speed: 0, knockback: 90, heal: 0, shield: 0, teamDamageBonus: 0 },
  parada: { cooldownMs: 4500, count: 1, radius: 40, pierce: 0, speed: 0, knockback: 60, heal: 0.025, shield: 0.06, teamDamageBonus: 0 },
  talento: { cooldownMs: 0, count: 0, radius: 0, pierce: 0, speed: 0, knockback: 0, heal: 0, shield: 0, teamDamageBonus: 0.03 },
};

const DAMAGE_FACTOR: Record<TechType, number> = { tiro: 0.5, regate: 0.45, defensa: 0.3, parada: 0.2, talento: 0 };

/** Stats of a technique at a level (1..10), including the owner's damage multiplier. */
export function techStats(t: Pick<Technique, 'type' | 'power'>, level: number, damageMult = 1): TechStats {
  const lv = Math.max(1, Math.min(MAX_TECH_LEVEL, level));
  const b = BASE[t.type];
  const power = Math.max(10, t.power || 10);
  const tier = Math.floor((lv - 1) / 3); // 0 at 1-3, 1 at 4-6, 2 at 7-9, 3 at 10
  const s: TechStats = { ...b, explodes: false, slow: 1,
    damage: Math.round(power * DAMAGE_FACTOR[t.type] * (1 + 0.18 * (lv - 1)) * damageMult) };
  s.cooldownMs = Math.round(b.cooldownMs * (1 - 0.045 * (lv - 1)));
  switch (t.type) {
    case 'tiro':
      s.count = 1 + tier;
      s.pierce = tier;
      s.speed = b.speed + 12 * (lv - 1);
      s.radius = b.radius + 5 * (lv - 1);
      s.explodes = lv >= 4;
      break;
    case 'regate':
      s.count = 1 + tier;
      s.radius = b.radius + 3 * (lv - 1);
      break;
    case 'defensa':
      s.radius = b.radius + 6 * (lv - 1);
      s.knockback = b.knockback + 6 * (lv - 1);
      s.slow = lv >= 5 ? 0.6 : 1;
      break;
    case 'parada':
      s.radius = b.radius + 4 * (lv - 1);
      s.heal = b.heal + 0.004 * (lv - 1);
      s.shield = Math.min(0.4, b.shield + 0.03 * (lv - 1));
      break;
    case 'talento':
      s.teamDamageBonus = b.teamDamageBonus * lv;
      break;
  }
  return s;
}

/** Stat changes between two levels, for upgrade cards. New effects are flagged with an empty "from". */
export function statChanges(t: Pick<Technique, 'type' | 'power'>, level: number): { label: string; from: string; to: string }[] {
  const a = techStats(t, level), b = techStats(t, level + 1);
  const out: { label: string; from: string; to: string }[] = [];
  const add = (label: string, x: number | string, y: number | string) => { if (x !== y) out.push({ label, from: String(x), to: String(y) }); };
  const pct = (v: number) => `${Math.round(v * 100)}%`;
  if (t.type !== 'talento') add('Daño', a.damage, b.damage);
  if (t.type === 'tiro') add('Balones', a.count, b.count);
  if (t.type === 'regate') add('Regates', a.count, b.count);
  if (t.type === 'tiro') add('Atraviesa', a.pierce, b.pierce);
  if (t.type !== 'talento') add('Área', a.radius, b.radius);
  if (t.type !== 'talento') add('Recarga', `${(a.cooldownMs / 1000).toFixed(1)}s`, `${(b.cooldownMs / 1000).toFixed(1)}s`);
  if (t.type === 'parada') { add('Cura', pct(a.heal), pct(b.heal)); add('Escudo', pct(a.shield), pct(b.shield)); }
  if (!a.explodes && b.explodes) out.push({ label: tr('Explosión'), from: '', to: tr('NUEVO') });
  if (a.slow === 1 && b.slow < 1) out.push({ label: tr('Ralentiza'), from: '', to: tr('NUEVO') });
  return out;
}

export const ELEMENT_COLOR: Record<string, number> = {
  Fuego: 0xff6a2a, Aire: 0x6ad8ff, Bosque: 0x5ee05a, 'Montaña': 0xd9a440, Neutro: 0xc45aff,
};
export const elementColor = (e: string | null | undefined) => (e && ELEMENT_COLOR[e]) || 0xf2f2f2;

// 2.3: the dub's technique types (not tr(): «Tiro» and «Defensa» are also stats, Kick and Guard)
export const TYPE_LABEL: Record<TechType, string> = getLang() === 'en'
  ? { tiro: 'Shoot', regate: 'Dribble', defensa: 'Block', parada: 'Catch', talento: 'Talent' }
  : { tiro: 'Tiro', regate: 'Regate', defensa: 'Defensa', parada: 'Parada', talento: 'Talento' };
