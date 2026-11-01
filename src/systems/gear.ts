/** Equipment: permanent stat items from the original item catalogue. Purely statistical; the Raimon look never changes. */
import type { ItemInfo } from '../data/manifest';
import type { SaveData } from './save';
import type { PerkEffects } from './perks';

export type GearSlot = 'botas' | 'guantes' | 'accesorio' | 'especial';
export const GEAR_SLOTS: { id: GearSlot; label: string }[] = [
  { id: 'botas', label: 'Botas' }, { id: 'guantes', label: 'Guantes' }, { id: 'accesorio', label: 'Pulsera' }, { id: 'especial', label: 'Colgante' },
];

export interface GearItem { id: string; name: string; description: string; icon: number; slot: GearSlot; tier: number; price: number; effect: string; note?: string }

const PER_SLOT = 8;
const SLOT_BY_FOLDER: Record<string, GearSlot> = { Botas: 'botas', Guantes: 'guantes', Pulseras: 'accesorio', Colgantes_y_medallas: 'especial' };
/** Bracelets rotate through these so each one has its own purpose. */
const ACCESSORY = ['recarga', 'suerte', 'experiencia'] as const;

function effectText(slot: GearSlot, tier: number, index: number) {
  const n = tier + 1;
  if (slot === 'botas') return `+${n * 3}% velocidad`;
  if (slot === 'guantes') return `-${n * 3}% daño recibido`;
  if (slot === 'especial') return `+${n * 4}% vida del equipo`;
  const kind = ACCESSORY[index % ACCESSORY.length];
  return kind === 'recarga' ? `-${n * 2}% recarga` : kind === 'suerte' ? `+${n * 4}% suerte` : `+${n * 3}% experiencia`;
}

/** Up to PER_SLOT items per slot spread across the price range, skipping goalkeeper-only variants of the same name. */
export function buildGear(items: (ItemInfo & { price?: number })[]): GearItem[] {
  const out: GearItem[] = [];
  for (const [folder, slot] of Object.entries(SLOT_BY_FOLDER)) {
    const seen = new Set<string>();
    const pool = items.filter((i) => i.folder === folder && i.name && i.description && !seen.has(i.name) && seen.add(i.name))
      .sort((a, b) => (a.price ?? 0) - (b.price ?? 0) || a.id - b.id);
    for (let k = 0; k < Math.min(PER_SLOT, pool.length); k++) {
      const it = pool[Math.floor(k * pool.length / Math.min(PER_SLOT, pool.length))];
      out.push({ id: `${slot}:${it.id}`, name: it.name.trim(), description: it.description.replace(/\s+/g, ' '), icon: it.icon, slot, tier: k,
        price: 150 + k * k * 60 + k * 90, effect: effectText(slot, k, k),
        note: slot === 'guantes' ? 'Solo con un portero en el equipo' : undefined });
    }
  }
  return out;
}

export function buyGear(s: SaveData, it: GearItem): boolean {
  if (s.gear.owned.includes(it.id) || s.coins < it.price) return false;
  s.coins -= it.price;
  s.gear.owned.push(it.id);
  return true;
}

export function equipGear(s: SaveData, it: GearItem): boolean {
  if (!s.gear.owned.includes(it.id)) return false;
  if (s.gear.equipped[it.slot] === it.id) delete s.gear.equipped[it.slot];
  else s.gear.equipped[it.slot] = it.id;
  return true;
}

/** Applies what is equipped on top of the perk effects. */
export function applyGear(e: PerkEffects, s: SaveData, gear: GearItem[]): PerkEffects {
  const out = { ...e };
  for (const id of Object.values(s.gear.equipped)) {
    const it = gear.find((g) => g.id === id);
    if (!it) continue;
    const n = it.tier + 1;
    if (it.slot === 'botas') out.speedMult *= 1 + n * 0.03;
    else if (it.slot === 'guantes') out.gloveReduction = n * 0.03;
    else if (it.slot === 'especial') out.hpMult *= 1 + n * 0.04;
    else {
      const kind = ACCESSORY[it.tier % ACCESSORY.length];
      if (kind === 'recarga') out.cooldownMult *= 1 - n * 0.02;
      else if (kind === 'suerte') out.luck += n * 0.04;
      else out.xpMult *= 1 + n * 0.03;
    }
  }
  return out;
}
