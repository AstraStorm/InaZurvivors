/**
 * 3.0 Piedra Alius: what the Altar and the run need from the save and the roster. The save rules themselves live in
 * aliusSave.ts (no game imports, save.ts uses them); this file adds the roster: the state of each transformation for the
 * Altar, Lina's requirement, and the passives a run gets (game/aliusEngine.ts).
 */
import type { RosterEntry } from '../data/manifest';
import { ALIUS, ALIUS_BY_ID, ALIUS_CONFIG, LINA_COACH, isAliusId, type AliusDef } from '../data/alius';
import type { AliusRunCfg, AliusSource } from '../game/aliusEngine';
import { coachRequirement } from './profileUnlocks';
import { COACH_BY_ID } from '../data/coaches';
import { aliusStones, isUnlocked } from './aliusSave';
import type { SaveData } from './save';

/** Lina Schiller is no footballer: her «original» is the Lina of the profile coaches (IE2 portrait 1076, Aquilina Schiller),
 *  so her requirement is that portrait's (profileUnlocks.coachRequirement) */
export const LINA_PORTRAIT = 1076;

/** Lina's attack speed, from her coach passive (data/coaches.ts) */
const linaSpeed = () => { const p = COACH_BY_ID.get(LINA_COACH)?.passives.find((x) => x.kind === 'alius'); return p?.kind === 'alius' ? p.attackSpeed : 0; };

export type AliusStatus = 'sin-original' | 'sin-piedras' | 'disponible' | 'desbloqueado';

/** whether the original is unlocked (owned footballer; for Lina, her profile portrait's requirement) and its label */
export function originalOk(save: SaveData, roster: RosterEntry[], a: AliusDef): { ok: boolean; label: string } {
  if (a.coach) { const r = coachRequirement(save, roster, LINA_PORTRAIT); return { ok: r.ok, label: r.label }; }
  return { ok: !!save.owned[String(a.base)], label: `Ten a ${a.baseName.trim()} en tu colección` };
}

export function aliusStatus(save: SaveData, roster: RosterEntry[], a: AliusDef): AliusStatus {
  if (isUnlocked(save, a.key)) return 'desbloqueado';
  if (!originalOk(save, roster, a).ok) return 'sin-original';
  return aliusStones(save) >= ALIUS_CONFIG.unlockCost ? 'disponible' : 'sin-piedras';
}
export const unlockedCount = (save: SaveData) => ALIUS.filter((a) => isUnlocked(save, a.key)).length;

/**
 * The Alius passives of a run. `squad` = the candidates (captain first; they play once recruited), `auras` = carrier id ->
 * Aura id of the run, `coach` = the coach on the bench. An Alius plays his passive at 100 % on the pitch (the engine waits
 * until he is), at ALIUS_CONFIG.slotScale.aura through his Aura carrier; the bench gives nothing (no bench passives in
 * InaZurvivors). Only owned Alius count, never more than the limit, and the same Alius only once.
 */
export function aliusRun(save: SaveData, squad: number[], auras: Record<string, number>, coach: string | undefined): AliusRunCfg {
  const sources: AliusSource[] = [];
  const ids: number[] = [];
  const add = (id: number) => {
    if (!isAliusId(id) || !save.owned[String(id)] || ids.includes(id) || ids.length >= ALIUS_CONFIG.maxEquipped) return false;
    ids.push(id);
    return true;
  };
  for (const id of squad) if (add(id)) sources.push({ aliusId: id, passive: ALIUS_BY_ID.get(id)!.passive, owner: id, scale: ALIUS_CONFIG.slotScale.field, via: 'campo' });
  for (const [c, a] of Object.entries(auras)) {
    if (!squad.includes(Number(c)) || !add(a)) continue;
    sources.push({ aliusId: a, passive: ALIUS_BY_ID.get(a)!.passive, owner: Number(c), scale: ALIUS_CONFIG.slotScale.aura, via: 'aura' });
  }
  const lina = coach === LINA_COACH && isUnlocked(save, 'lina');
  return {
    sources, aliusIds: ids,
    linaSpeed: lina ? linaSpeed() : 0,
    // exactly three Alius FOOTBALLERS equipped (the coach never counts); the engine also wants one on the pitch
    resonance: ids.length === 3 ? ALIUS_CONFIG.resonanceDamage : 0,
  };
}

/** the Resonancia as Mi Equipo shows it: Alius footballers equipped (squad + Auras) and whether it is on */
export function resonanceState(save: SaveData) {
  const ids = [save.captainId ?? -1, ...(save.squad ?? []), ...Object.values(save.auras ?? {})].filter((x, i, a) => isAliusId(x) && a.indexOf(x) === i && !!save.owned[String(x)]);
  return { n: ids.length, on: ids.length === 3 };
}
