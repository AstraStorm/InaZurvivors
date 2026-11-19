import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { DUEL_BY_ID, DUEL_COMBOS, DUEL_PLAYERS, duelStats } from '../src/systems/duel/cards';

const manifest = JSON.parse(fs.readFileSync(path.resolve(__dirname, '..', 'public', 'generated', 'manifest.json'), 'utf-8')) as {
  roster: { id: number; name: string; rarity: string; position: string; exclusive?: string; stats: Record<string, number>; techniques: { name: string; type: string; power?: number }[] }[];
};
const byId = new Map(manifest.roster.map((p) => [p.id, p]));
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9áéíóúüñ]/g, '');

describe('Modo Duelo: the 50 footballers', () => {
  it('50 different, Legendario or higher, none exclusive to an event', () => {
    expect(DUEL_PLAYERS).toHaveLength(50);
    expect(new Set(DUEL_PLAYERS.map((p) => p.id)).size).toBe(50);
    for (const d of DUEL_PLAYERS) {
      const p = byId.get(d.id);
      expect(p, String(d.id)).toBeTruthy();
      expect(['legendario', 'mitico', 'leyenda'], p!.name).toContain(p!.rarity);
      expect(p!.exclusive, p!.name).toBeFalsy();
    }
  });
  it('every card is a technique that footballer really has', () => {
    for (const d of DUEL_PLAYERS) {
      const own = new Set(byId.get(d.id)!.techniques.map((t) => norm(t.name)));
      for (const t of [...d.cards.map((c) => c.tech), d.ulti.tech]) expect(own.has(norm(t)), `${byId.get(d.id)!.name}: ${t}`).toBe(true);
    }
  });
  it('combined techniques only name footballers of the list', () => {
    for (const c of DUEL_COMBOS) for (const id of c.players) expect(DUEL_BY_ID.has(id), `${c.name}: ${id}`).toBe(true);
  });
  it('stats as the doc says (Axel Blaze: 1723 PV, 459 ATQ, 207 DEF)', () => {
    // the doc's formula, before the balance multiplier (DUEL_TUNE): checked without the footballer's id
    const raw = (id: number) => duelStats({ ...(byId.get(id)! as object), id: undefined } as never);
    expect(raw(10)).toMatchObject({ hp: 1723, atk: 459, def: 207 });
    expect(raw(100773)).toMatchObject({ hp: 3125, atk: 338, def: 453 });
  });
});

describe('Modo Duelo: the story mode', async () => {
  const { STORY, STORY_CHAPTERS, storyOpen, storyTeams } = await import('../src/systems/duel/story');
  const dicts = await Promise.all(['en', 'fr', 'it', 'de', 'ca', 'pt'].map((l) => import(`../src/i18n/${l}.ts`).then((m) => Object.values(m)[0] as Record<string, string>)));
  it('three seasons (3, 4 and 3 chapters), every team made of the mode\'s footballers and ready for the engine', () => {
    expect(STORY.map((s) => s.chapters.length)).toEqual([3, 4, 3]);
    for (const c of STORY_CHAPTERS) {
      for (const pid of [...c.you, ...c.foe, ...(c.joins ?? [])]) expect(DUEL_BY_ID.has(pid), `${c.id}: ${pid}`).toBe(true);
      expect(c.you).toHaveLength(4);
      for (const j of c.joins ?? []) expect(c.you, `${c.id}`).toContain(j);
      const [a, b] = storyTeams(byId as never, c);
      expect(a.units).toHaveLength(4);
      expect(b.units.length).toBe(c.foe.length);
      for (const l of [...c.intro, ...c.outro]) if (typeof l.who === 'number') expect([...c.you, ...c.foe], `${c.id}: ${l.text}`).toContain(l.who);
    }
  });
  it('a chapter opens when the one before is won', () => {
    expect(storyOpen([], '1-1')).toBe(true);
    expect(storyOpen([], '1-2')).toBe(false);
    expect(storyOpen(['1-1'], '1-2')).toBe(true);
    expect(storyOpen(['1-1', '1-2', '1-3'], '2-1')).toBe(true);
  });
  it('every text of the story has its translation in every language', () => {
    const texts = STORY.flatMap((s) => [s.title, s.sub, ...s.chapters.flatMap((c) => [c.title, ...c.intro.map((l) => l.text), ...c.outro.map((l) => l.text)])]);
    for (const d of dicts) expect(texts.filter((t) => d[t] === undefined)).toEqual([]);
  });
});

describe('Modo Duelo: story bosses', async () => {
  const { createDuel, teamOf } = await import('../src/systems/duel/rules');
  it('a boss gets its extra actions and cards each turn, and its shields stop at the cap', () => {
    const plain = createDuel([teamOf(byId as never, [1, 10, 29, 2], 'hillman'), teamOf(byId as never, [157], null)], 5, 1);
    const boss = createDuel([teamOf(byId as never, [1, 10, 29, 2], 'hillman'), { ...teamOf(byId as never, [157], null), boss: { actions: 2, cards: 3 } }], 5, 1);
    expect(boss.sides[1].actions).toBe(plain.sides[1].actions + 2);
    // equal cards fuse as they come, so the cards dealt are counted by weight (an R2 is two R1, an R3 four)
    const weight = (h: { rank: number; idx: unknown }[]) => h.filter((c) => c.idx !== 'u').reduce((a, c) => a + 2 ** (c.rank - 1), 0);
    expect(weight(boss.sides[1].hand)).toBe(weight(plain.sides[1].hand) + 3);
    expect(boss.sides[1].boss?.shieldCap).toBe(0.5);
  });
});
