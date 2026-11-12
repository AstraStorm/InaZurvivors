/**
 * Kit bonuses (InaZurvivors design): the equipped kit gives the squad a perk. Main teams have a named one inspired by
 * their style in the saga; any other kit gets one from the dominant element of its roster. On top, «Química de club»:
 * +6% damage while 3+ players of that team are on the pitch. Values are balance, tuned here.
 */
import type { RosterEntry } from '../data/manifest';
import type { PerkEffects } from './perks';
import { tr } from '../i18n/i18n';

export interface KitBonus { name: string; description: string; apply(e: PerkEffects): void }

const SPECIAL: Record<string, KitBonus> = {
  '': { name: tr('Espíritu Raimon'), description: tr('+6% experiencia y +5% vida: nunca se rinden.'), apply: (e) => { e.xpMult *= 1.06; e.hpMult *= 1.05; } },
  Raimon: { name: tr('Espíritu Raimon'), description: tr('+6% experiencia y +5% vida: nunca se rinden.'), apply: (e) => { e.xpMult *= 1.06; e.hpMult *= 1.05; } },
  Royal_Academy: { name: tr('Táctica imperial'), description: tr('+8% daño y -5% recarga: fútbol de precisión.'), apply: (e) => { e.damageMult *= 1.08; e.cooldownMult *= 0.95; } },
  Zeus: { name: tr('Néctar divino'), description: tr('+7% daño y +0,1% de vida por segundo.'), apply: (e) => { e.damageMult *= 1.07; e.regen += 0.001; } },
  Occult: { name: tr('Maldición'), description: tr('+8% probabilidad de efecto elemental (ralentiza).'), apply: (e) => { e.elementalChance += 0.08; } },
  Wild: { name: tr('Instinto salvaje'), description: tr('+8% velocidad del equipo.'), apply: (e) => { e.speedMult *= 1.08; } },
  Brain: { name: tr('Cálculo perfecto'), description: tr('+10% experiencia y +1 opción de reroll.'), apply: (e) => { e.xpMult *= 1.1; e.extraRerolls += 1; } },
  Otaku: { name: tr('Combo friki'), description: tr('+12% daño de técnicas combinadas.'), apply: (e) => { e.comboMult *= 1.12; } },
  Shuriken: { name: tr('Ninjutsu'), description: tr('+6% velocidad y +4% crítico.'), apply: (e) => { e.speedMult *= 1.06; e.critChance += 0.04; } },
  Farm: { name: tr('Fuerza de granja'), description: tr('+10% vida del capitán.'), apply: (e) => { e.hpMult *= 1.1; } },
  Kirkwood: { name: tr('Triple ataque'), description: tr('+5% daño y +5% área.'), apply: (e) => { e.damageMult *= 1.05; e.areaMult *= 1.05; } },
  Emperadores_Oscuros: { name: tr('Piedra Aqua'), description: tr('+10% daño, pero +8% daño recibido.'), apply: (e) => { e.damageMult *= 1.1; e.damageTakenMult *= 1.08; } },
  'Tormenta_de_Géminis': { name: tr('Velocidad alienígena'), description: tr('+10% velocidad del equipo.'), apply: (e) => { e.speedMult *= 1.1; } },
  'Épsilon': { name: tr('Presión Epsilon'), description: tr('+8% daño y +4% crítico.'), apply: (e) => { e.damageMult *= 1.08; e.critChance += 0.04; } },
  'Génesis': { name: tr('Genes superiores'), description: tr('+6% daño, +4% vida y -3% recarga.'), apply: (e) => { e.damageMult *= 1.06; e.hpMult *= 1.04; e.cooldownMult *= 0.97; } },
  Inazuma_Japan_A: { name: tr('Orgullo nacional'), description: tr('+6% daño, +6% vida y +6% monedas.'), apply: (e) => { e.damageMult *= 1.06; e.hpMult *= 1.06; e.coinMult *= 1.06; } },
};

const BY_ELEMENT: Record<string, KitBonus> = {
  Fuego: { name: tr('Pasión de fuego'), description: tr('+6% daño (equipo de Fuego).'), apply: (e) => { e.damageMult *= 1.06; } },
  Aire: { name: tr('Viento a favor'), description: tr('+6% velocidad (equipo de Aire).'), apply: (e) => { e.speedMult *= 1.06; } },
  Bosque: { name: tr('Raíces del bosque'), description: tr('+0,1% de vida por segundo (equipo de Bosque).'), apply: (e) => { e.regen += 0.001; } },
  'Montaña': { name: tr('Muralla de montaña'), description: tr('-6% daño recibido (equipo de Montaña).'), apply: (e) => { e.damageTakenMult *= 0.94; } },
};

export const CLUB_CHEMISTRY = { min: 3, damage: 1.06 };

/** Bonus of a kit ('' = the default Raimon kit). */
export function kitBonus(team: string, roster: RosterEntry[]): KitBonus {
  if (SPECIAL[team]) return SPECIAL[team];
  const count: Record<string, number> = {};
  for (const p of roster) if (p.teams.includes(team)) count[String(p.element)] = (count[String(p.element)] ?? 0) + 1;
  const top = Object.entries(count).sort((a, b) => b[1] - a[1])[0]?.[0];
  return BY_ELEMENT[top ?? ''] ?? BY_ELEMENT.Fuego;
}

/** Club chemistry multiplier for a squad on the pitch wearing `team`'s kit. */
export function chemistry(team: string, onPitch: Pick<RosterEntry, 'teams'>[]) {
  const key = team || 'Raimon';
  return onPitch.filter((p) => p.teams.includes(key)).length >= CLUB_CHEMISTRY.min ? CLUB_CHEMISTRY.damage : 1;
}
