/**
 * Fix 1.31: the team synergies in one place, so the run's HUD and the «Mi Equipo» screen show the same thing, big and
 * clear (they used to be a tiny line of text, and two of them weren't shown at all):
 *   - Resonancia: techniques of the same element active at once — 3 give +8% damage to them, 5 give +15% (mastery.ts).
 *   - Química de club: 3+ footballers of the equipped kit's team on the pitch — +6% damage (kitBonus.ts).
 *   - Sinergia elemental: the upgrade of that name, +1.5% damage per level for each teammate of the captain's element.
 */
import type { RosterEntry, Technique } from '../data/manifest';
import { resonanceBonus } from './mastery';
import { CLUB_CHEMISTRY } from './kitBonus';
import { MAX_TEAM } from './cards';

export const RESONANCE_STEPS = [{ n: 3, bonus: 0.08 }, { n: 5, bonus: 0.15 }] as const;

export interface Synergy {
  key: string;
  kind: 'resonancia' | 'quimica' | 'sinergia';
  label: string;
  element?: string;
  /** current bonus (0..1); 0 while it isn't active yet */
  bonus: number;
  count: number;
  /** count needed for the next step (or the last one when maxed) */
  goal: number;
  /** what the next step gives, for the hint */
  next?: number;
  hint: string;
}

/** Resonance of each element from the elements of the techniques active right now (one entry per active technique). */
export function resonances(activeElements: (string | null | undefined)[]): Synergy[] {
  const count: Record<string, number> = {};
  for (const e of activeElements) if (e) count[e] = (count[e] ?? 0) + 1;
  return Object.entries(count).filter(([, n]) => n >= 2).map(([element, n]) => {
    const bonus = resonanceBonus(n), step = RESONANCE_STEPS.find((s) => n < s.n);
    return { key: `res:${element}`, kind: 'resonancia', label: `Resonancia ${element}`, element, bonus, count: n, goal: step?.n ?? 5, next: step?.bonus,
      hint: step ? `${n}/${step.n} técnicas de ${element} activas → +${Math.round(step.bonus * 100)}%` : `${n} técnicas de ${element} activas (máximo)` } as Synergy;
  }).sort((a, b) => b.bonus - a.bonus || b.count - a.count);
}

export function chemistrySynergy(kitTeam: string, label: string, onPitch: Pick<RosterEntry, 'teams'>[]): Synergy {
  const key = kitTeam || 'Raimon', n = onPitch.filter((p) => p.teams.includes(key)).length;
  const on = n >= CLUB_CHEMISTRY.min;
  return { key: 'chem', kind: 'quimica', label: `Química de club · ${label}`, bonus: on ? CLUB_CHEMISTRY.damage - 1 : 0, count: n, goal: CLUB_CHEMISTRY.min,
    next: on ? undefined : CLUB_CHEMISTRY.damage - 1, hint: on ? `${n} de ${label} en el campo: +${Math.round((CLUB_CHEMISTRY.damage - 1) * 100)}% daño` : `${n}/${CLUB_CHEMISTRY.min} de ${label} en el campo → +${Math.round((CLUB_CHEMISTRY.damage - 1) * 100)}% daño` };
}

export function captainSynergy(perPlayer: number, captainElement: string, allies: number): Synergy | null {
  if (perPlayer <= 0) return null;
  return { key: 'syn', kind: 'sinergia', label: `Sinergia ${captainElement}`, element: captainElement, bonus: perPlayer * allies, count: allies, goal: MAX_TEAM - 1,
    hint: `${allies} compañero${allies === 1 ? '' : 's'} de ${captainElement} con el capitán: +${(perPlayer * 100).toFixed(1).replace('.', ',')}% cada uno` };
}

/**
 * For «Mi Equipo», before the run: which techniques will be active isn't known yet (they are chosen while levelling), so
 * the resonance shows its potential — how many techniques of each element the seven candidates bring.
 */
export function squadPotential(squad: (Pick<RosterEntry, 'element' | 'teams'> & { techniques: Pick<Technique, 'element' | 'type'>[] })[], kitTeam: string, kitLabel: string, synergyPerPlayer: number) {
  const elems: Record<string, number> = {};
  for (const p of squad) for (const t of p.techniques) if (t.type !== 'talento' && t.element) elems[t.element] = (elems[t.element] ?? 0) + 1;
  const players: Record<string, number> = {};
  for (const p of squad) if (p.element) players[String(p.element)] = (players[String(p.element)] ?? 0) + 1;
  const cap = squad[0];
  return {
    elements: Object.entries(elems).sort((a, b) => b[1] - a[1]).map(([element, techs]) => ({ element, techs, players: players[element] ?? 0, reach: techs >= 5 ? 0.15 : techs >= 3 ? 0.08 : 0 })),
    chemistry: chemistrySynergy(kitTeam, kitLabel, squad),
    captain: cap ? captainSynergy(synergyPerPlayer, String(cap.element), Math.min(MAX_TEAM - 1, squad.slice(1).filter((p) => p.element === cap.element).length)) : null,
  };
}
