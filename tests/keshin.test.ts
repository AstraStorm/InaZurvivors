import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import { newSave, importSave, exportSave } from '../src/systems/save';
import { emptyFx } from '../src/systems/talents';
import { applyRun } from '../src/systems/economy';
import { applyKeshin, giveKeshinGift, KESHIN_GIFT, KESHIN_MAX, KESHINS, keshinForRun, keshinLevel, keshinOf, keshinStepCost, levelKeshin, statBonus, ultTech, withKeshinStats } from '../src/systems/keshin';
import type { Manifest } from '../src/data/manifest';
import { perkEffects } from '../src/systems/perks';
import { ROSTER_FIXES } from '../src/data/rosterFixes';

const manifestFile = 'public/generated/manifest.json';
const m: Manifest | null = fs.existsSync(manifestFile) ? JSON.parse(fs.readFileSync(manifestFile, 'utf8')) : null;

describe('2.0 Espíritus Guerreros', () => {
  it('every holder is in the roster with that name, and nobody calls two spirits', () => {
    const seen = new Set<number>();
    for (const k of KESHINS) for (const h of k.holders) {
      expect(seen.has(h.id), `${h.name} repetido`).toBe(false);
      seen.add(h.id);
      if (m) expect(ROSTER_FIXES[h.id]?.nombre ?? m.roster.find((p) => p.id === h.id)?.name, `${k.name}: ${h.name}`).toBe(h.name); // as the game shows it
    }
    expect(KESHINS).toHaveLength(19); // 2.0: Lancelot joined the nine, then Jmet, Huargo, Glenr and Eris; 2.1 Papelín, Zodíaco, Evera, Demogorgo and Atenea
  });

  it('a new technique id is never one a footballer already has (Surtur shares Tormenta de fuego on purpose)', () => {
    if (!m) return;
    const byId = new Map(m.roster.flatMap((p) => p.techniques.map((t) => [t.id, t.name] as const)));
    for (const k of KESHINS) { const n = byId.get(k.tech.id); if (n !== undefined) expect(n).toBe(k.tech.name); }
  });

  it('Grito de guerra counts the boys and Gatas salvajes the girls (Auras included by the caller)', () => {
    const f1 = emptyFx(), f2 = emptyFx();
    applyKeshin(f1, { id: 'jmet', level: 1 }, { male: 4, female: 1 });
    applyKeshin(f2, { id: 'eris', level: 1 }, { male: 4, female: 1 });
    expect(f1.team).toBeCloseTo(0.12);
    expect(f2.team).toBeCloseTo(0.05);
    const none = emptyFx(); applyKeshin(none, { id: 'eris', level: 6 }, { male: 5, female: 0 });
    expect(none.team).toBe(0);
  });

  it('unlocking costs 3 and each level L costs L-1 Fichas EG, up to Ω', () => {
    const s = newSave([], null);
    s.owned['100303'] = { stars: 0, copies: 1, obtainedAt: '' };
    expect(levelKeshin(s, 100303)).toBe('poor');
    s.egTokens = 3 + 1 + 2 + 3 + 4 + 5;
    for (let lv = 1; lv <= KESHIN_MAX; lv++) expect(levelKeshin(s, 100303)).toBe(lv);
    expect(s.egTokens).toBe(0);
    expect(levelKeshin(s, 100303)).toBe('max');
    expect(keshinStepCost(2)).toBe(1);
    expect(keshinStepCost(6)).toBe(5);
  });

  it('needs the footballer owned and a spirit of his', () => {
    const s = newSave([], null);
    s.egTokens = 50;
    expect(levelKeshin(s, 100303)).toBe('notOwned');
    s.owned['5'] = { stars: 0, copies: 1, obtainedAt: '' };
    expect(levelKeshin(s, 5)).toBe('none');
  });

  it('the stat of its technique grows by a stacking percentage; the passive reaches the team', () => {
    const k = keshinOf(1)!; // Grandius: a keeper spirit raises Defensa
    expect(statBonus(k, 1).key).toBe('guard');
    const base = { kick: 50, guard: 90 };
    expect(withKeshinStats(base, k, 1).guard).toBe(Math.round(90 * 1.05));
    expect(withKeshinStats(base, k, 6).guard).toBeGreaterThan(withKeshinStats(base, k, 5).guard);
    expect(withKeshinStats(base, k, 0)).toBe(base);
    const f = emptyFx();
    applyKeshin(f, { id: 'apolo', level: 1 });
    expect(f.element.Fuego).toBeCloseTo(0.06);
  });

  it('the run copy carries the spirit as an ultimate (R), stronger than the same technique in his repertoire', () => {
    if (!m) return;
    const tezcat = m.roster.find((p) => p.id === 100303)!, axel = m.roster.find((p) => p.id === 10)!;
    const t = keshinForRun(tezcat, 2);
    expect(t.techniques).toBe(tezcat.techniques); // an ultimate (R), never in the repertoire
    expect(t.keshin).toEqual({ id: 'azote_negro', level: 2 });
    expect(ultTech(t.keshin!)!.name).toBe('Hacha del Azote Negro');
    expect(keshinForRun(tezcat, 0)).toBe(tezcat);
    const a = keshinForRun(axel, 1), ult = ultTech(a.keshin!)!;
    expect(ult.name).toBe('Tormenta de fuego');
    expect(ult.power).toBeGreaterThan(axel.techniques.find((x) => x.name === 'Tormenta de fuego')!.power);
    const s0 = newSave([], null), e0 = perkEffects(s0);
    s0.upgrades.ulti = 5;
    expect([e0.ultCooldownSec, perkEffects(s0).ultCooldownSec]).toEqual([30, 15]); // «Espíritu despierto»: from 30 s to 15 s
    s0.upgrades.olfatoeg = 5;
    expect([e0.egChance, perkEffects(s0).egChance]).toEqual([0, 0.15]); // «Olfato de espíritu»: up to 15%
    const run = (timeSec: number, roll: number) => applyRun(newSave([], null), { mapId: 'raimon', rank: 'C', victory: false, timeSec, kills: 10, minibosses: 0, bossDefeated: false, reachedBoss: false }, 1, 1, 0, 0.15, () => roll).egTotal;
    expect([run(300, 0.1), run(300, 0.2), run(100, 0.1)]).toEqual([1, 0, 0]);
  });

  it('a map beaten in rank X pays 1 Ficha EG, nothing else does; the intro gives none; the save keeps them', () => {
    const win = (rank: string, endlessSec = 0) => applyRun(newSave([], null), { mapId: 'raimon', rank, victory: true, timeSec: 600, kills: 100, minibosses: 1, bossDefeated: true, reachedBoss: true, endlessSec } as never).egTotal;
    expect(win('X')).toBe(1);
    expect([win('C'), win('A'), win('S'), win('S', 3600)]).toEqual([0, 0, 0, 0]);
    expect(applyRun(newSave([], null), { mapId: 'raimon', rank: 'X', victory: false, timeSec: 300, kills: 10, minibosses: 0, bossDefeated: false, reachedBoss: true }).egTotal).toBe(0);
    const g = newSave([], null);
    expect(giveKeshinGift(g)).toBe(true);
    expect(giveKeshinGift(g)).toBe(false);
    expect(g.egTokens ?? 0).toBe(KESHIN_GIFT);
    g.egTokens = 3;
    g.owned['100303'] = { stars: 0, copies: 1, obtainedAt: '' };
    levelKeshin(g, 100303);
    const back = importSave(exportSave(g));
    expect(back.egTokens).toBe(0);
    expect(keshinLevel(back, 100303)).toBe(1);
    expect(back.egGift20).toBe(true);
  });
});
