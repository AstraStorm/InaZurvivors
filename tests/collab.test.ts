/** author: InaZurvivors x BlueLock — dates, its own banner pool, the Fichas de evento, Cometa legendario and the 20% bond */
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import type { Manifest } from '../src/data/manifest';
import { BLUELOCK_EVENT, bluelockActive, bluelockDaysToStart, bluelockStart, bluelockUpcoming } from '../src/systems/collabEvent';
import { thanksEnd, thanksTokens } from '../src/systems/thanksEvent';
import { bannerPool, bannerPrice } from '../src/systems/banners';
import { COMBOS } from '../src/systems/combos';
import { bondOf, BOND_PCT } from '../src/systems/auras';

const manifestFile = 'public/generated/manifest.json';
const m: Manifest | null = fs.existsSync(manifestFile) ? JSON.parse(fs.readFileSync(manifestFile, 'utf8')) : null;
const DAY = 86_400_000;

describe('InaZurvivors x BlueLock', () => {
  it('opens the day after the Banner de agradecimiento ends, for seven days', () => {
    expect(bluelockStart() - thanksEnd()).toBe(DAY);
    expect(bluelockActive(bluelockStart() - 1)).toBe(false);
    expect(bluelockActive(bluelockStart())).toBe(true);
    expect(bluelockActive(bluelockStart() + 7 * DAY)).toBe(false);
    expect(bluelockUpcoming(bluelockStart() - 1)).toBe(true);
    expect(bluelockDaysToStart(bluelockStart() - 3.5 * DAY)).toBe(4);
    expect(bluelockDaysToStart(bluelockStart() + 1)).toBe(0);
  });

  it('pays with the same Fichas de evento: a Rango S or X run still gives them while it is open', () => {
    expect(thanksTokens('S', 12, bluelockStart() + DAY)).toBe(12);
    expect(thanksTokens('A', 12, bluelockStart() + DAY)).toBe(0);
    expect(thanksTokens('X', 12, bluelockStart() - 12 * 3600_000)).toBe(0); // the gap day between both: nothing
  });

  it('Nagi and Isagi only come out of their own banner, at 15 / 150', () => {
    if (!m) return;
    const bl = bannerPool(m.roster, 'bluelock'), ev = bannerPool(m.roster, 'evento');
    expect(bl.filter((p) => p.exclusive).map((p) => p.id).sort()).toEqual([...BLUELOCK_EVENT.players].sort());
    expect(ev.some((p) => p.exclusive === 'bluelock')).toBe(false);
    expect(bannerPool(m.roster, 'ff').some((p) => p.exclusive)).toBe(false);
    expect(bannerPrice(bl, 'bluelock')).toMatchObject({ cost: 15, multiCost: 150 });
    // the morralla: 30 Comunes, 20 Raros and 8 Épicos, the weakest of each, so the ×10 guarantee lands on an Épico
    const fill = bl.filter((p) => !p.exclusive);
    expect(fill.map((p) => p.rarity).filter((r) => r === 'epico').length).toBe(8);
    expect(fill.length).toBe(58);
    const avg = (p: { stats: Record<string, number> | null }) => Object.values(p.stats!).reduce((a, b) => a + b, 0) / 7;
    const commons = m.roster.filter((p) => !p.exclusive && p.rarity === 'comun' && p.stats).map(avg).sort((a, b) => a - b);
    expect(Math.max(...fill.filter((p) => p.rarity === 'comun').map(avg))).toBeLessThanOrEqual(commons[29]);
  });

  it('they bond at 20% and launch Cometa legendario together', () => {
    expect(bondOf(900200, 900201)?.combos).toContain('cometa-legendario-bl');
    expect(BOND_PCT).toBe(0.2);
    const c = COMBOS.find((x) => x.id === 'cometa-legendario-bl')!;
    expect(c.name).toBe('Cometa legendario');
    expect(c.needs.map((n) => n.player).sort()).toEqual(['Seishiro Nagi', 'Yoichi Isagi']);
  });
});
