/** 1.8: a Leyenda climbs Campeón, Campeón+ and Campeón++ (instead of HÉROE); each level +10 stat limit, +5 training. */
import { describe, expect, it } from 'vitest';
import type { RosterEntry } from '../src/data/manifest';
import { newSave, migrate } from '../src/systems/save';
import { ascend, championOf, migrateChampions18, nextStep } from '../src/systems/ascension';
import { STAT_MAX, playerStats, statCapOf, trainMaxOf, trainStat, trainRoom } from '../src/systems/training';

const P = (id: number, rarity: RosterEntry['rarity']): RosterEntry => ({ id, name: `P${id}`, nickname: `P${id}`, position: 'FW', element: 'Fuego', teams: [], rarity, body: 'field',
  head: {} as RosterEntry['head'], stats: { kick: 90, control: 85, guard: 60, body: 80, speed: 88, guts: 80, stamina: 75 }, fpMax: null, techniques: [], starter: false, startUnlocked: false });
const ley = P(1, 'leyenda'), mit = P(2, 'mitico');

describe('Campeón (1.8)', () => {
  it('a Leyenda goes Campeón → Campeón+ → Campeón++ (1, 2 and 3 duplicates) and never HÉROE; a Mítico still becomes HÉROE', () => {
    const s = newSave([1, 2], 1);
    s.owned['1'].copies = 7; s.owned['2'].copies = 3;
    expect(nextStep(s, ley)).toEqual({ step: 'campeon', cost: 1 });
    expect(nextStep(s, mit)).toEqual({ step: 'heroe', cost: 2 });
    for (const lvl of [1, 2, 3]) { expect(ascend(s, ley)).toBe('campeon'); expect(championOf(s, 1)).toBe(lvl); }
    expect(nextStep(s, ley)).toBeNull();
    expect(s.owned['1'].hero).toBeUndefined();
    expect(s.owned['1'].spent).toBe(6);
  });
  it('each level: stat limit +10 (99 → 129), stats up, +5 training points', () => {
    const s = newSave([1], 1);
    const before = playerStats(s, ley, 'leyenda', false);
    expect(Math.max(...Object.values(before))).toBeLessThanOrEqual(STAT_MAX);
    s.owned['1'].champion = 3;
    expect(statCapOf(s, ley)).toBe(129);
    expect(trainMaxOf(s, 1)).toBe(35);
    const after = playerStats(s, ley, 'leyenda', false);
    expect(after.kick).toBeGreaterThan(before.kick);
    expect(Math.max(...Object.values(after))).toBeLessThanOrEqual(129);
    expect(trainRoom(s, ley, 'leyenda', false).kick).toBe(129 - after.kick);
    s.trainTokens = 40;
    let n = 0; while (trainStat(s, 1, 'guard')) n++;
    expect(n).toBe(35);
  });
  it('old Leyenda HÉROES become Campeón (stars turn into levels); the save keeps level and extra training', () => {
    const s = newSave([1, 2], 1);
    Object.assign(s.owned['1'], { hero: true, heroStars: 1 });
    Object.assign(s.owned['2'], { hero: true, heroStars: 2 });
    migrateChampions18(s, [ley, mit]);
    expect(s.owned['1']).toMatchObject({ champion: 2 });
    expect(s.owned['1'].hero).toBeUndefined();
    expect(s.owned['2']).toMatchObject({ hero: true, heroStars: 2 }); // a Mítico keeps his HÉROE
    s.owned['1'].train = { kick: 28 };
    const back = migrate(JSON.parse(JSON.stringify({ ...s, owned: { ...s.owned, 1: { ...s.owned['1'], champion: 9 } } })), [1, 2], 1);
    expect(back.owned['1'].champion).toBe(3);
    expect(back.owned['1'].train).toEqual({ kick: 28 }); // 20 + 5 per level
  });
});
