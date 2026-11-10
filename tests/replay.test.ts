import { describe, expect, it } from 'vitest';
import { ReplayRecorder, RIVALS_MS, TEAM_MS, frameAtTime, readReplay, spawnOf } from '../src/game/replay';

const header = { v: 1, map: 'raimon', rank: 'S', kit: null, team: [101, 900201], version: '2.02', at: '2026-11-10T20:00:00Z' };

describe('2.02 replays', () => {
  it('reads back what it recorded (team, rivals with steps and jumps, spawns, kills, events), gzipped', async () => {
    const rec = new ReplayRecorder(header);
    const rival = { id: 7, pos: { x: 500, y: 400 }, hp: 50, maxHp: 100, dead: false, dir: 3 };
    let t = 0;
    rec.spawn(0, { id: 7, unit: { id: 33 }, kind: 'miniboss', variant: 'tank', sprite: { scale: 1.25 } });
    for (let i = 0; i < 40; i++) {
      t += 0.05;
      rival.pos.x += i === 20 ? 300 : 3; // one long jump in the middle (back to full coordinates)
      rec.tick(50, t, [{ id: 101, x: 500 + i, y: 400, dir: 2 }, { id: 900201, x: 480, y: 410 - i, dir: 6 }], 80, 120, [rival]);
    }
    rec.event(1.5, { k: 'card', lv: 2, card: { kind: 'recruit', playerId: 900201 } });
    rec.kill(1.9, 7);
    rec.event(2, { k: 'end', win: true, kills: 1, level: 2 });
    const blob = await rec.finish();
    const bytes = new Uint8Array(await blob.arrayBuffer());
    expect([bytes[0], bytes[1]]).toEqual([0x1f, 0x8b]);
    const rp = await readReplay(bytes.buffer);
    expect(rp.header).toEqual(header);
    expect(rp.team.length).toBe(Math.ceil(2000 / TEAM_MS));
    expect(rp.team[rp.team.length - 1].m[1]).toMatchObject({ id: 900201, x: 480 });
    expect(rp.team[0]).toMatchObject({ hp: 80, max: 120 });
    // the last sample of the rival is where the rival was (a step chain with a jump in between)
    const last = rp.rivals[rp.rivals.length - 1].r[0];
    expect(rp.rivals.length).toBeGreaterThanOrEqual(Math.floor(2000 / RIVALS_MS) - 1);
    expect(last.id).toBe(7);
    expect(last.x).toBe(500 + 3 * 36 + 297); // sampled every 5th tick: the last sample is tick 35 (after its +3), the jump added 297 more
    expect(last.hp).toBeCloseTo(0.5, 1);
    expect(rp.spawns[0]).toMatchObject({ id: 7, unit: 33, kind: 'miniboss', variant: 'tank', scale: 1.25 });
    expect(rp.kills).toEqual([{ t: 1.9, id: 7 }]);
    expect(rp.events.map((e) => e.e.k)).toEqual(['card', 'end']);
    expect(rp.duration).toBeCloseTo(2, 1);
  });

  it('far rivals are not recorded, and the frame/spawn lookups pick the right one', async () => {
    const rec = new ReplayRecorder(header);
    rec.tick(300, 0.3, [{ id: 101, x: 0, y: 0, dir: 0 }], 1, 1, [
      { id: 1, pos: { x: 100, y: 50 }, hp: 1, maxHp: 1, dead: false, dir: 0 },
      { id: 2, pos: { x: 3000, y: 50 }, hp: 1, maxHp: 1, dead: false, dir: 0 },
      { id: 3, pos: { x: 10, y: 10 }, hp: 1, maxHp: 1, dead: true, dir: 0 },
    ]);
    const rp = await readReplay(await (await rec.finish()).arrayBuffer());
    expect(rp.rivals[0].r.map((r) => r.id)).toEqual([1]);
    const list = [{ t: 0 }, { t: 1 }, { t: 2 }];
    expect([frameAtTime(list, -1), frameAtTime(list, 0), frameAtTime(list, 1.5), frameAtTime(list, 9)]).toEqual([-1, 0, 1, 2]);
    const a = { t: 0, id: 5, unit: 1, kind: 'normal' as const, variant: '', scale: 1 }, b = { ...a, t: 60, unit: 2 };
    const byId = new Map([[5, [a, b]]]);
    expect(spawnOf(byId, 5, 30)).toBe(a);
    expect(spawnOf(byId, 5, 61)).toBe(b);
  });
});
