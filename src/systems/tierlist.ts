/**
 * 1.9 (author): player tier lists. Fixed tiers and fixed topics (no free text: everyone sees them in the menu, so there is
 * nothing to moderate but the order). The server checks the same rules (migration 20261107000400_tierlists.sql).
 */
import type { RosterEntry } from '../data/manifest';
import { tr } from '../i18n/i18n';

export const TIERS = ['S', 'A', 'B', 'C', 'D'] as const;
export type Tier = (typeof TIERS)[number];
export type Tiers = Partial<Record<Tier, number[]>>;
export const TIER_COLOR: Record<Tier, string> = { S: '#ff4f6a', A: '#ff9a3a', B: '#ffd84a', C: '#7dff9a', D: '#4fb3ff' };

export type TierTopic = 'general' | 'delanteros' | 'medios' | 'defensas' | 'porteros' | 'favoritos';
export const TIER_TOPICS: { id: TierTopic; label: string; pos: RosterEntry['position'] | null }[] = [
  { id: 'general', label: tr('Los mejores'), pos: null },
  { id: 'delanteros', label: tr('Delanteros'), pos: 'FW' },
  { id: 'medios', label: tr('Centrocampistas'), pos: 'MF' },
  { id: 'defensas', label: tr('Defensas'), pos: 'DF' },
  { id: 'porteros', label: tr('Porteros'), pos: 'GK' },
  { id: 'favoritos', label: tr('Mis favoritos'), pos: null },
];
export const topicLabel = (t: string) => TIER_TOPICS.find((x) => x.id === t)?.label ?? 'Tierlist';

export const TIER_MIN = 3;
export const TIER_MAX = 60;
export const ROW_MAX = 30;

export const tierCount = (t: Tiers) => TIERS.reduce((n, k) => n + (t[k]?.length ?? 0), 0);

/** Keeps only known tiers, whole ids that exist, no repeats, at most ROW_MAX per tier and TIER_MAX in all. */
export function cleanTiers(raw: unknown, exists: (id: number) => boolean): Tiers {
  const out: Tiers = {};
  const seen = new Set<number>();
  const src = raw && typeof raw === 'object' ? raw as Record<string, unknown> : {};
  let total = 0;
  for (const k of TIERS) {
    const row = Array.isArray(src[k]) ? src[k] as unknown[] : [];
    const ids: number[] = [];
    for (const v of row) {
      if (typeof v !== 'number' || !Number.isInteger(v) || v <= 0 || seen.has(v) || !exists(v)) continue;
      if (ids.length >= ROW_MAX || total >= TIER_MAX) break;
      seen.add(v); ids.push(v); total++;
    }
    if (ids.length) out[k] = ids;
  }
  return out;
}

/** Moves a footballer to a tier (or out of the list with null), at the end of the row. */
export function placeIn(t: Tiers, id: number, tier: Tier | null): Tiers {
  const out: Tiers = {};
  for (const k of TIERS) { const row = (t[k] ?? []).filter((x) => x !== id); if (row.length) out[k] = row; }
  if (tier && tierCount(out) < TIER_MAX && (out[tier]?.length ?? 0) < ROW_MAX) out[tier] = [...(out[tier] ?? []), id];
  return out;
}
