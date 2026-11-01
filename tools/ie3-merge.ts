/**
 * Pure merge rules for the future IE3 / Great Road import: identify, drop duplicates of IE2 players, list what is pending.
 * Existing ids are never touched, so saved collections stay valid.
 */
export interface Ie3Player { id: number; name: string; complete: boolean; techniques?: unknown[] }

export const normalizeName = (n: string) => n.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\(.*?\)/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

/** IE3 ids start here in the manifest, far above every IE2 id. */
export const IE3_ID_OFFSET = 100000;

export function mergeIe3(existing: { name: string }[], incoming: Ie3Player[]) {
  const known = new Set(existing.map((p) => normalizeName(p.name)));
  const add: (Ie3Player & { gameId: number })[] = [];
  const duplicates: string[] = [], pending: string[] = [];
  for (const p of incoming) {
    const key = normalizeName(p.name);
    if (known.has(key)) { duplicates.push(p.name); continue; }
    if (!p.complete || !p.techniques?.length) { pending.push(p.name); continue; }
    known.add(key);
    add.push({ ...p, gameId: IE3_ID_OFFSET + p.id });
  }
  return { add, duplicates, pending };
}
