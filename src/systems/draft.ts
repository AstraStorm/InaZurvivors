/** Start-of-run draft: 5 distinct footballers from the permanent collection. Free; never changes the collection. */
export const DRAFT_SIZE = 5;

export function drawDraft<T extends { id: number }>(owned: T[], rng: () => number = Math.random, size = DRAFT_SIZE): T[] {
  const pool = [...new Map(owned.map((p) => [p.id, p])).values()];
  const out: T[] = [];
  while (out.length < size && pool.length) out.push(pool.splice(Math.floor(rng() * pool.length), 1)[0]);
  return out;
}

/** Captain rule (prepared for a manual choice later): the first drafted player unless one is chosen. */
export function pickCaptain<T extends { id: number }>(team: T[], chosenId?: number | null): T | undefined {
  return team.find((p) => p.id === chosenId) ?? team[0];
}
