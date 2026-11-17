/** 3.0 Piedra Alius: registry, roster clones, save rules (stones, unlocks, mirrors, limit), run setup and the 29 passives. */
import fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { Manifest, RosterEntry } from '../src/data/manifest';
import { ALIUS, ALIUS_CONFIG, ALIUS_PASSIVES, ALIUS_PLAYERS, ALIUS_EXCLUSIVE, LINA_COACH, addAliusRoster, baseIdOf, passiveTextAt, recolourTorsoSkin, scaledParams, TORSO_SKIN_RAMP, type AliusPassiveId } from '../src/data/alius';
import { newSave, migrate, validate } from '../src/systems/save';
import { aliusCapProblem, awardAliusStones, equippedAlius, sanitizeAliusState, syncAliusOwned, trimAliusCap, undoUnlock, unlockAlius } from '../src/systems/aliusSave';
import { aliusRun } from '../src/systems/alius';
import { ascend, nextStep } from '../src/systems/ascension';
import { trainStat } from '../src/systems/training';
import { buyStar } from '../src/systems/stars';
import { charactersOf, sameCharacter } from '../src/systems/identity';
import { playsAs } from '../src/systems/combos';
import { bannerPool, BANNERS } from '../src/systems/banners';
import { coachesOfMachine, COACH_BY_ID } from '../src/data/coaches';
import { AliusEngine, type AlEnemy, type AlMember, type AliusRunCfg } from '../src/game/aliusEngine';

const manifestFile = 'public/generated/manifest.json';
const m: Manifest | null = fs.existsSync(manifestFile) ? JSON.parse(fs.readFileSync(manifestFile, 'utf8')) : null;
const KIRA = ALIUS_PLAYERS.find((a) => a.key === 'kira')!;

describe('registry', () => {
  it('29 transformations: 28 footballers with their own ids and one coach', () => {
    expect(ALIUS).toHaveLength(29);
    expect(ALIUS_PLAYERS).toHaveLength(28);
    expect(new Set(ALIUS.map((a) => a.key)).size).toBe(29);
    expect(new Set(ALIUS_PLAYERS.map((a) => a.id)).size).toBe(28);
    expect(new Set(ALIUS_PLAYERS.map((a) => a.base)).size).toBe(28);
    for (const a of ALIUS_PLAYERS) expect(a.id).not.toBe(a.base); // never the original's id
    expect(ALIUS.filter((a) => a.coach).map((a) => a.coach)).toEqual([LINA_COACH]);
    expect(new Set(ALIUS.map((a) => a.passive)).size).toBe(29);
    for (const a of ALIUS) expect(ALIUS_PASSIVES[a.passive]).toBeDefined();
  });
  it('Kira Hiroto (Ares/Orion) is not Xavier Foster', () => {
    expect(KIRA.base).toBe(100907);
    expect(KIRA.base).not.toBe(101722);
    expect(sameCharacter({ name: 'Kira Hiroto Alius' }, { name: 'Xavier Foster' })).toBe(false);
  });
  it('every passive has a Spanish text, numbers and only shrinks its benefit as an Aura', () => {
    for (const d of Object.values(ALIUS_PASSIVES)) {
      expect(passiveTextAt(d).length).toBeGreaterThan(20);
      const half = scaledParams(d, 0.4);
      for (const [k, v] of Object.entries(d.params)) expect(half[k]).toBeCloseTo(d.scaled.includes(k) ? v * 0.4 : v);
      for (const k of ['cd', 'every']) if (k in d.params) expect(d.scaled).not.toContain(k); // cooldowns never shrink
    }
  });
  it.skipIf(!m)('the 29 portraits are the author files, byte for byte, 64 px', () => {
    for (const a of ALIUS) {
      const art = m!.alius?.[a.key];
      expect(art?.head, a.key).toBeTruthy();
      const out = fs.readFileSync(`public/${art!.head}`);
      expect(out.readUInt32BE(16)).toBe(64); expect(out.readUInt32BE(20)).toBe(64); // PNG IHDR width/height
      const src = `D:/Sprites Inazuma/Alius/${a.file}`;
      if (fs.existsSync(src)) expect(out.equals(fs.readFileSync(src))).toBe(true);
      if (a.id !== undefined) expect(fs.existsSync(`public/${art!.bust}`), a.key).toBe(true);
    }
  });
});

describe('roster clones', () => {
  it.skipIf(!m)('the originals are the named footballers and stay untouched; each Alius inherits everything but his id, name and passive', () => {
    const mm: Manifest = JSON.parse(JSON.stringify(m));
    const before = JSON.stringify(mm.roster);
    expect(addAliusRoster(mm)).toEqual([]);
    expect(JSON.stringify(mm.roster.slice(0, m!.roster.length))).toBe(before);
    const byId = new Map(mm.roster.map((p) => [p.id, p]));
    for (const a of ALIUS_PLAYERS) {
      const b = byId.get(a.base!)!, x = byId.get(a.id!)!;
      expect(b.name.trim()).toBe(a.baseName.trim());
      expect(x.name).toBe(`${b.name.trim()} Alius`);
      expect(x.exclusive).toBe(ALIUS_EXCLUSIVE);
      for (const k of ['rarity', 'element', 'position', 'body', 'stats', 'head', 'torso', 'skin', 'heroTech', 'gender', 'era'] as const) expect(x[k], `${a.key} ${k}`).toEqual(b[k]);
      expect(x.techniques).toEqual(b.techniques); // exactly the same techniques, levels and numbers
      expect(x.techniques[0]).not.toBe(b.techniques[0]); // ...as copies
      expect(x.baseTeams).toEqual(b.teams);
      expect(charactersOf(x)).toEqual(charactersOf(b));
      expect(baseIdOf(x.id)).toBe(b.id);
    }
    expect(mm.coaches?.some((c) => c.id === LINA_COACH)).toBe(true);
    // never from a machine or the special banner
    for (const id of Object.keys(BANNERS)) expect(bannerPool(mm.roster, id as never, '').some((p) => p.exclusive === ALIUS_EXCLUSIVE), id).toBe(false);
  });
  it('combined techniques and coaches', () => {
    expect(playsAs('Byron Love Alius', 'Byron Love')).toBe(true);
    expect(coachesOfMachine('alius').some((c) => c.id === LINA_COACH)).toBe(false); // Lina never comes out of a capsule
    expect(COACH_BY_ID.get(LINA_COACH)?.altar).toBe('lina');
  });
});

const owned = (s: ReturnType<typeof newSave>, id: number, extra = {}) => { s.owned[String(id)] = { stars: 3, copies: 4, obtainedAt: '2026-01-01T00:00:00.000Z', ...extra }; };

describe('save: stones, unlocks, mirrors', () => {
  it('unlocking checks first and pays once', () => {
    const s = newSave([], null);
    expect(unlockAlius(s, 'kira', false).ok).toBe(false); // no original
    owned(s, KIRA.base!);
    expect(unlockAlius(s, 'kira', true).ok).toBe(false); // no stones
    expect(s.alius?.stones ?? 0).toBe(0);
    s.alius = { stones: 25, unlocked: [] };
    expect(unlockAlius(s, 'kira', true).ok).toBe(true);
    expect(s.alius.stones).toBe(15);
    expect(unlockAlius(s, 'kira', true).ok).toBe(false); // never twice
    expect(s.alius.stones).toBe(15);
    expect(s.owned[String(KIRA.id)]).toBeDefined();
    undoUnlock(s, 'kira'); // a failed write puts everything back
    expect(s.alius.stones).toBe(25);
    expect(s.owned[String(KIRA.id)]).toBeUndefined();
  });
  it('the Alius mirrors his original and can never be upgraded on his own', () => {
    const s = newSave([], null);
    owned(s, KIRA.base!, { hero: true, train: { kick: 5 } });
    s.alius = { stones: 10, unlocked: [] };
    unlockAlius(s, 'kira', true);
    const al = s.owned[String(KIRA.id)];
    expect(al.stars).toBe(3); expect(al.hero).toBe(true); expect(al.train).toEqual({ kick: 5 }); expect(al.copies).toBe(1);
    const p = { id: KIRA.id!, rarity: 'legendario' } as RosterEntry;
    expect(nextStep(s, p)).toBeNull(); expect(ascend(s, p)).toBe(false);
    expect(trainStat(s, KIRA.id!, 'kick')).toBe(false); expect(buyStar(s, p, 'kick')).toBe(false);
    s.owned[String(KIRA.base)].stars = 5; // the original improves...
    syncAliusOwned(s);
    expect(s.owned[String(KIRA.id)].stars).toBe(5); // ...and so does his Alius
    delete s.owned[String(KIRA.base)];
    syncAliusOwned(s);
    expect(s.owned[String(KIRA.id)]).toBeUndefined(); // never owned on his own
    expect(s.alius!.unlocked).toContain('kira'); // the unlock stays
  });
  it('survives a reload, a cloud copy and garbage', () => {
    const s = newSave([], null);
    owned(s, KIRA.base!);
    s.alius = { stones: 30, unlocked: [] };
    unlockAlius(s, 'kira', true);
    const back = migrate(JSON.parse(JSON.stringify(s)), [], null);
    expect(back.alius).toEqual({ stones: 20, unlocked: ['kira'] });
    expect(back.owned[String(KIRA.id)]).toBeDefined();
    expect(sanitizeAliusState({ stones: -4.5, unlocked: ['kira', 'kira', 'nadie', 7] })).toEqual({ stones: 0, unlocked: ['kira'] });
    const old = migrate({ schemaVersion: 9, coins: 1, owned: { 1: { stars: 1, copies: 1 } } }, [], null); // a save from before 3.0
    expect(old.alius).toBeUndefined();
    expect(old.owned['1']).toBeDefined();
  });
  it('Lina is owned as a coach while unlocked', () => {
    const s = newSave([], null);
    s.alius = { stones: 10, unlocked: [] };
    expect(unlockAlius(s, 'lina', true).ok).toBe(true);
    expect(s.coaches?.owned).toContain(LINA_COACH);
    const v = validate(JSON.parse(JSON.stringify(s)));
    expect(v.coaches?.owned).toContain(LINA_COACH);
  });
  it('at most three Alius in the squad and the Auras, however they are put there', () => {
    const s = newSave([], null);
    const four = ALIUS_PLAYERS.slice(0, 4);
    for (const a of four) owned(s, a.base!);
    s.alius = { stones: 0, unlocked: four.map((a) => a.key) };
    syncAliusOwned(s);
    s.captainId = four[0].id!; s.squad = [four[0].id!, four[1].id!, four[2].id!];
    expect(aliusCapProblem(s, four[3].id!)).toMatch(/Máximo 3/);
    expect(aliusCapProblem(s, four[0].id!)).toBeNull(); // already in: moving him is fine
    s.auras = { [String(four[0].id)]: four[3].id! }; // a hand-edited save with a fourth as Aura
    trimAliusCap(s);
    expect(equippedAlius(s)).toHaveLength(3);
    const v = validate(JSON.parse(JSON.stringify({ ...s, squad: four.map((a) => a.id!) })));
    expect(equippedAlius(v).length).toBeLessThanOrEqual(3);
  });
  it('stones: by rank, only for wins, a daily cap', () => {
    const s = newSave([], null);
    expect(awardAliusStones(s, { victory: false, rank: 'Z' }, '2026-11-17')).toBe(0);
    expect(awardAliusStones(s, { victory: true, rank: 'C' }, '2026-11-17')).toBe(0);
    expect(awardAliusStones(s, { victory: true, rank: 'S' }, '2026-11-17')).toBe(2);
    expect(awardAliusStones(s, { victory: true, rank: 'Z' }, '2026-11-17')).toBe(ALIUS_CONFIG.stones.dailyCap - 2);
    expect(awardAliusStones(s, { victory: true, rank: 'Z' }, '2026-11-17')).toBe(0);
    expect(awardAliusStones(s, { victory: true, rank: 'B' }, '2026-11-18')).toBe(1);
    expect(s.alius!.stones).toBe(ALIUS_CONFIG.stones.dailyCap + 1);
  });
});

describe('run setup', () => {
  it('pitch 100 %, Aura 40 % through the carrier, no bench, three at most, the coach never counts for the Resonancia', () => {
    const s = newSave([], null);
    const [a, b, c, d] = ALIUS_PLAYERS;
    for (const x of [a, b, c, d]) owned(s, x.base!);
    s.alius = { stones: 0, unlocked: [a.key, b.key, c.key, d.key, 'lina'] };
    syncAliusOwned(s);
    const run = aliusRun(s, [1, a.id!, b.id!], { 1: c.id!, [String(a.id)]: d.id! }, LINA_COACH);
    expect(run.sources.map((x) => [x.aliusId, x.scale, x.owner])).toEqual([[a.id, 1, a.id], [b.id, 1, b.id], [c.id, 0.4, 1]]);
    expect(run.resonance).toBe(ALIUS_CONFIG.resonanceDamage);
    expect(run.linaSpeed).toBeGreaterThan(0);
    const two = aliusRun(s, [a.id!, b.id!], {}, LINA_COACH);
    expect(two.resonance).toBe(0); // Lina is not the third
  });
});

// ------------------------------------------------------------- the passives, on a fake arena
interface E extends AlEnemy { id: number }
function arena(passive: AliusPassiveId, opts: { scale?: number; enemies?: Partial<E>[]; resonance?: number; lina?: number } = {}) {
  let t = 0, hp = 1000;
  const member: AlMember = { entry: { id: 7 }, f: { x: 0, y: 10 } };
  const enemies: E[] = (opts.enemies ?? [{}]).map((e, i) => ({ id: i, pos: { x: 30 + i * 5, y: 10 }, hp: 100, maxHp: 100, kind: 'enemy', dead: false, knockX: 0, knockY: 0, radius: 6, ...e }));
  const strikes: { id: number; dmg: number }[] = [], heals: number[] = [];
  const later: (() => void)[] = [];
  const noop = () => undefined;
  const cfg: AliusRunCfg = { sources: [{ aliusId: 960000, passive, owner: 7, scale: opts.scale ?? 1, via: 'campo' }], aliusIds: [7], linaSpeed: opts.lina ?? 0, resonance: opts.resonance ?? 0 };
  const eng = new AliusEngine<E, AlMember>({
    runTime: () => t, enemies: () => enemies, members: () => [member], hp: () => hp, maxHp: () => 1000,
    heal: (n) => { heals.push(n); hp = Math.min(1000, hp + n); }, basic: () => 100,
    strike: (e, dmg) => { strikes.push({ id: e.id, dmg }); e.hp -= dmg; }, // like the arena: a strike never calls onHit again
    delay: (_ms, fn) => later.push(fn), rand: () => 0,
    fx: { ring: noop, label: noop, line: noop, star: noop, illusion: noop },
  }, cfg);
  return { eng, enemies, member, strikes, heals, run: () => { while (later.length) later.shift()!(); }, at: (x: number) => { t = x; eng.tick(16); }, setHp: (x: number) => { hp = x; } };
}

describe('the 29 passives', () => {
  it('periodic ones wait for their time, then repeat on their cooldown', () => {
    const a = arena('rugido-abisal');
    a.at(0); a.at(24); expect(a.strikes).toHaveLength(0);
    a.at(25.1); expect(a.strikes).toHaveLength(1); expect(a.strikes[0].dmg).toBeCloseTo(60);
    a.at(26); expect(a.strikes).toHaveLength(1);
    a.at(50.3); expect(a.strikes).toHaveLength(2);
    expect(a.eng.speedMul(a.enemies[0])).toBeLessThan(1);
  });
  it('Ojo del huracán pushes normal rivals, never a boss', () => {
    const a = arena('ojo-huracan', { enemies: [{}, { kind: 'boss' }] });
    a.at(0); a.at(18.1);
    expect(a.enemies[0].knockX).toBeGreaterThan(0);
    expect(a.enemies[1].knockX).toBe(0);
    expect(a.eng.speedMul(a.enemies[1])).toBeGreaterThanOrEqual(1 - ALIUS_CONFIG.maxBossSlow);
  });
  it('Colmillo del dragón and Constelación negra count attacks', () => {
    const a = arena('colmillo-dragon');
    for (let i = 0; i < 4; i++) a.eng.onAttack(a.member);
    expect(a.strikes).toHaveLength(0);
    a.eng.onAttack(a.member); expect(a.strikes).toHaveLength(1); expect(a.strikes[0].dmg).toBeCloseTo(50);
    const b = arena('constelacion-negra');
    for (let i = 0; i < 3; i++) b.eng.onAttack(b.member);
    b.run(); expect(b.strikes).toHaveLength(2); expect(b.strikes[0].dmg).toBeCloseTo(25);
  });
  it('marks: Juicio divino, Rosa negra, Ojo omnisciente and Corona rota', () => {
    for (const id of ['juicio-divino', 'rosa-negra', 'ojo-omnisciente'] as const) {
      const a = arena(id); a.at(0); a.at(40);
      expect(a.eng.damageMult(a.member, a.enemies[0]), id).toBeGreaterThan(1.1);
    }
    const k = arena('corona-rota');
    expect(k.eng.damageMult(k.member, k.enemies[0])).toBeCloseTo(1.15);
    k.enemies[0].hp = 70;
    expect(k.eng.damageMult(k.member, k.enemies[0])).toBe(1);
  });
  it('Fractura de obsidiana breaks at four marks, then waits 8 s on that rival', () => {
    const a = arena('fractura-obsidiana');
    for (let i = 0; i < 4; i++) a.eng.onHit(a.member, a.enemies[0], 10);
    expect(a.strikes).toHaveLength(1); expect(a.strikes[0].dmg).toBeCloseTo(80);
    for (let i = 0; i < 8; i++) a.eng.onHit(a.member, a.enemies[0], 10);
    expect(a.strikes).toHaveLength(1);
  });
  it('slows: Aliento boreal, Escarcha eterna, Cenizas, Silencio; bosses get the reduced ones', () => {
    const f = arena('aliento-boreal', { enemies: [{}, { kind: 'boss' }] });
    for (let i = 0; i < 4; i++) { f.eng.onHit(f.member, f.enemies[0], 1); }
    expect(f.eng.speedMul(f.enemies[0])).toBeCloseTo(0.7);
    for (let i = 0; i < 4; i++) f.eng.onHit(f.member, f.enemies[1], 1);
    expect(f.eng.speedMul(f.enemies[1])).toBeCloseTo(0.9);
    const n = arena('escarcha-eterna');
    for (let i = 0; i < 3; i++) n.eng.onHit(n.member, n.enemies[0], 1);
    expect(n.eng.speedMul(n.enemies[0])).toBeCloseTo(0.65);
    const p = arena('cenizas-rey');
    for (let i = 0; i < 5; i++) p.eng.onHit(p.member, p.enemies[0], 1);
    expect(p.eng.speedMul(p.enemies[0])).toBeCloseTo(0.84); // two stacks at most
    const c = arena('silencio-eterno');
    for (let i = 0; i < 5; i++) c.eng.onHit(c.member, c.enemies[0], 1);
    expect(c.eng.speedMul(c.enemies[0])).toBeCloseTo(0.85);
    c.at(10); expect(c.eng.speedMul(c.enemies[0])).toBe(1); // gone after 4 s without a hit
  });
  it('Máscara fantasma confuses a normal rival, only slows a boss', () => {
    const a = arena('mascara-fantasma', { enemies: [{}, { kind: 'boss' }] });
    a.at(0); a.at(25.1); a.eng.onHit(a.member, a.enemies[0], 1);
    expect(a.eng.confused(a.enemies[0])).toBe(true);
    a.at(51); a.eng.onHit(a.member, a.enemies[1], 1);
    expect(a.eng.confused(a.enemies[1])).toBe(false);
    expect(a.eng.speedMul(a.enemies[1])).toBeCloseTo(0.9);
  });
  it('Supernova negra arms, explodes once around the rival, never again from its own blast', () => {
    const a = arena('supernova-negra', { enemies: [{}, {}] });
    a.at(0); a.at(35.1);
    a.eng.onHit(a.member, a.enemies[0], 1);
    expect(a.strikes).toHaveLength(2);
    a.eng.onHit(a.member, a.enemies[0], 1);
    expect(a.strikes).toHaveLength(2);
  });
  it('Jaque mate: six in a row on the same rival, reset on a change, 10 s cooldown', () => {
    const a = arena('jaque-mate', { enemies: [{}, {}] });
    for (let i = 0; i < 5; i++) a.eng.onHit(a.member, a.enemies[0], 1);
    a.eng.onHit(a.member, a.enemies[1], 1); // another rival: back to zero
    for (let i = 0; i < 5; i++) a.eng.onHit(a.member, a.enemies[1], 1);
    expect(a.strikes).toHaveLength(1); expect(a.strikes[0].dmg).toBeCloseTo(100);
    for (let i = 0; i < 6; i++) a.eng.onHit(a.member, a.enemies[1], 1);
    expect(a.strikes).toHaveLength(1);
  });
  it('Eclipse dorado: extra hits only during the eclipse', () => {
    const a = arena('eclipse-dorado');
    a.eng.onHit(a.member, a.enemies[0], 50); a.run();
    expect(a.strikes).toHaveLength(0);
    a.at(0); a.at(30.1); a.eng.onHit(a.member, a.enemies[0], 50); a.run();
    expect(a.strikes).toEqual([{ id: 0, dmg: 20 }]);
  });
  it('knock-outs: Ángel caído heals 1 % on its cooldown, Explosión destructora, Devorador de almas never refreshes', () => {
    const g = arena('angel-caido');
    g.eng.onKill(g.member, g.enemies[0]); g.eng.onKill(g.member, g.enemies[0]);
    expect(g.heals).toEqual([10]);
    const h = arena('explosion-destructora', { enemies: [{}, {}] });
    h.eng.onKill(h.member, h.enemies[0]); h.run();
    expect(h.strikes.length).toBe(2); expect(h.strikes[0].dmg).toBeCloseTo(55);
    const m2 = arena('devorador-almas');
    for (let i = 0; i < 5; i++) m2.eng.onKill(m2.member, m2.enemies[0]);
    expect(m2.eng.damageMult(m2.member, m2.enemies[0])).toBeCloseTo(1.1);
    for (let i = 0; i < 5; i++) m2.eng.onKill(m2.member, m2.enemies[0]); // while it lasts: no refresh
    m2.at(6.5);
    expect(m2.eng.damageMult(m2.member, m2.enemies[0])).toBe(1);
  });
  it('shared health: Muro carmesí (one barrier), Mano demoníaca, Eclipse protector, Fortaleza negra, capped together', () => {
    const w = arena('muro-carmesi');
    w.at(1); w.eng.afterHurt(250);
    expect(w.eng.absorb(50)).toBe(0); expect(w.eng.absorb(100)).toBe(70); // 80 absorbed in all
    const d = arena('mano-demoniaca');
    d.setHp(400); d.at(1);
    expect(d.eng.takenMult()).toBeCloseTo(0.8);
    d.at(7); expect(d.eng.takenMult()).toBe(1);
    d.at(8); expect(d.eng.takenMult()).toBe(1); // still below: not again until it goes back up and the cooldown ends
    const v = arena('fortaleza-negra');
    v.at(0); v.at(30.1); expect(v.eng.takenMult()).toBeCloseTo(0.9);
    v.eng.afterHurt(10);
    expect(v.eng.damageMult(v.member, v.enemies[0])).toBeCloseTo(1.3);
    expect(v.eng.damageMult(v.member, v.enemies[0])).toBe(1); // one stored attack only
  });
  it('Voluntad del eclipse once per fall below 35 %', () => {
    const a = arena('voluntad-eclipse');
    a.setHp(300); a.at(1);
    expect(a.eng.damageMult(a.member, a.enemies[0])).toBeCloseTo(1.18);
    a.at(10); expect(a.eng.damageMult(a.member, a.enemies[0])).toBe(1);
  });
  it('Espejo humeante reflects one hit per charge', () => {
    const a = arena('espejo-humeante');
    a.at(0); a.at(30.1);
    a.eng.afterHurt(5); a.eng.afterHurt(5); a.run();
    expect(a.strikes).toEqual([{ id: 0, dmg: 70 }]);
  });
  it('Mil ilusiones lures normal rivals near the copy, never a boss; Gravedad oscura pulls only normal rivals', () => {
    const a = arena('mil-ilusiones', { enemies: [{}, { kind: 'boss' }] });
    a.at(0); a.at(28.1);
    expect(a.eng.lure(a.enemies[0])).not.toBeNull();
    expect(a.eng.lure(a.enemies[1])).toBeNull();
    a.at(33); expect(a.eng.lure(a.enemies[0])).toBeNull();
    // the field opens on the nearest normal rival and draws the others in
    const s = arena('gravedad-oscura', { enemies: [{ pos: { x: 60, y: 10 } }, { pos: { x: 120, y: 10 } }, { kind: 'boss', pos: { x: 90, y: 10 } }] });
    s.at(0); s.at(30.1); s.eng.tick(200);
    expect(s.enemies[1].knockX).toBeLessThan(0);
    expect(s.enemies[2].knockX).toBe(0);
  });
  it('as an Aura the benefit is 40 %; the Resonancia and Lina', () => {
    const a = arena('corona-rota', { scale: 0.4 });
    expect(a.eng.damageMult(a.member, a.enemies[0])).toBeCloseTo(1.06);
    const r = arena('angel-caido', { resonance: 0.03, lina: 0.05 });
    expect(r.eng.damageMult(r.member, r.enemies[0])).toBeCloseTo(1.03);
    expect(r.eng.attackSpeed(r.member)).toBeCloseTo(1.05);
    expect(r.eng.resonanceOn()).toBe(true);
  });
  it('a passive never runs while its footballer is off the pitch, and a new run starts clean', () => {
    const a = arena('rugido-abisal');
    (a.member.entry as { id: number }).id = 99; // someone else on the pitch
    a.at(0); a.at(60); expect(a.strikes).toHaveLength(0);
    const b = arena('rugido-abisal');
    expect(b.eng.hud()).toEqual([]);
  });
});

describe('phase 4.1 skin on kit torsos', () => {
  it('recolours the neck ramp joined to the base colour, not a matching colour elsewhere', () => {
    const w = 4, h = 1, px = new Uint8ClampedArray(w * h * 4);
    const put = (i: number, c: number[]) => { px.set([...c, 255], i * 4); };
    put(0, TORSO_SKIN_RAMP[2]); put(1, TORSO_SKIN_RAMP[1]); put(2, [0, 0, 0]); put(3, TORSO_SKIN_RAMP[1]);
    const ramp: [number, number, number][] = [[1, 1, 1], [2, 2, 2], [3, 3, 3], [4, 4, 4]];
    recolourTorsoSkin(px, w, h, ramp);
    expect([...px.slice(0, 3)]).toEqual([3, 3, 3]);
    expect([...px.slice(4, 7)]).toEqual([2, 2, 2]);
    expect([...px.slice(12, 15)]).toEqual(TORSO_SKIN_RAMP[1]); // apart from the skin: left alone
  });
});
