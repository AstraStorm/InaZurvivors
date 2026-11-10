/**
 * The online migrations (supabase/migrations, in order: what the real project has) run for real on PGlite (PostgreSQL in WebAssembly). Supabase's auth schema is
 * stubbed: auth.uid() reads a session setting, so each "request" acts as one account.
 */
import fs from 'node:fs';
import { scoreOf } from '../src/systems/leaderboard';
import path from 'node:path';
import { PGlite } from '@electric-sql/pglite';
import { citext } from '@electric-sql/pglite/contrib/citext';
import { beforeAll, describe, expect, it } from 'vitest';
import { validateUsername } from '../src/systems/username';

const migrations = path.resolve(__dirname, '..', 'supabase', 'migrations');
const schema = fs.readdirSync(migrations).filter((f) => f.endsWith('.sql')).sort().map((f) => fs.readFileSync(path.join(migrations, f), 'utf-8')).join('\n');
let db: PGlite;
const ids: Record<string, string> = {};

async function as(user: string, sql: string, params: unknown[] = [], role = '', jwt = '') {
  return db.transaction(async (tx) => {
    await tx.query(`select set_config('test.uid', $1, true), set_config('test.jwt', $2, true)`, [ids[user] ?? '', jwt]);
    if (role) await tx.exec(`set local role ${role}`);
    return tx.query(sql, params);
  });
}
/** A request through the Data API: the anon or authenticated role, never the owner. */
const api = (user: string, sql: string, params: unknown[] = []) => as(user, sql, params, user ? 'authenticated' : 'anon');

beforeAll(async () => {
  db = new PGlite({ extensions: { citext } });
  await db.exec(`
    create role anon; create role authenticated;
    create schema auth;
    create table auth.users (id uuid primary key, email text, created_at timestamptz not null default now(), last_sign_in_at timestamptz);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('test.uid', true), '')::uuid $$;
    create function auth.jwt() returns jsonb language sql stable as $$ select coalesce(nullif(current_setting('test.jwt', true), ''), '{}')::jsonb $$;
    -- Supabase Storage, reduced to what the migrations use
    create schema storage;
    create table storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
    create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text, name text, owner_id text, created_at timestamptz default now());
    alter table storage.objects enable row level security;
    create function storage.foldername(name text) returns text[] language sql immutable as $$ select (string_to_array(name, '/'))[1:array_length(string_to_array(name, '/'), 1) - 1] $$;
    grant usage on schema storage to anon, authenticated;
    grant select, insert, delete on storage.objects to authenticated;
    grant usage on schema auth, public to anon, authenticated;
    grant execute on all functions in schema auth to anon, authenticated;
    -- Supabase's defaults: every new table and function in public is fully open to the API roles until revoked
    alter default privileges in schema public grant all on tables to anon, authenticated;
    alter default privileges in schema public grant execute on functions to anon, authenticated;
  `);
  await db.exec(schema);
  for (const [i, u] of ['astra', 'beto', 'carla', 'dani'].entries()) {
    ids[u] = `00000000-0000-0000-0000-00000000000${i + 1}`;
    await db.query('insert into auth.users (id, email) values ($1, $2)', [ids[u], `${u}@example.test`]);
  }
}, 60000);

describe('usernames (client rules)', () => {
  it('3-20 characters, letters, numbers and underscore, trimmed', () => {
    expect(validateUsername('  Astra  ')).toEqual({ ok: true, name: 'Astra', key: 'astra' });
    expect(validateUsername('ab').ok).toBe(false);
    expect(validateUsername('a'.repeat(21)).ok).toBe(false);
    expect(validateUsername('a'.repeat(20)).ok).toBe(true);
    expect(validateUsername('con espacio').ok).toBe(false);
    expect(validateUsername('ñandú').ok).toBe(false);
  });
});

describe('usernames (database)', () => {
  it('reserves once; Astra / ASTRA / astra conflict; no account takes two; nobody can rename', async () => {
    expect((await as('astra', `select public.reserve_username('Astra') as n`)).rows[0]).toEqual({ n: 'Astra' });
    await expect(as('beto', `select public.reserve_username('ASTRA')`)).rejects.toThrow(/taken/);
    await expect(as('beto', `select public.reserve_username('astra')`)).rejects.toThrow(/taken/);
    expect((await as('beto', `select public.username_available('aStRa') as a`)).rows[0]).toEqual({ a: false });
    await expect(as('astra', `select public.reserve_username('Otro')`)).rejects.toThrow(/already_has_username/);
    await expect(as('beto', `select public.reserve_username('${'x'.repeat(21)}')`)).rejects.toThrow(/invalid_username/);
    await expect(as('beto', `select public.reserve_username('ab')`)).rejects.toThrow(/invalid_username/);
    await expect(db.query(`update public.profiles set username = 'Nuevo' where id = $1`, [ids.astra])).rejects.toThrow(/username_permanent/);
    await expect(as('', `select public.reserve_username('Anonimo')`)).rejects.toThrow(/not_authenticated/);
  });
  it('two simultaneous reservations of the same name: exactly one wins', async () => {
    const r = await Promise.allSettled([as('beto', `select public.reserve_username('Rayo')`), as('carla', `select public.reserve_username('RAYO')`)]);
    expect(r.filter((x) => x.status === 'fulfilled')).toHaveLength(1);
    expect(r.filter((x) => x.status === 'rejected')).toHaveLength(1);
    expect((await db.query(`select count(*)::int as n from public.profiles where lower(username::text) = 'rayo'`)).rows[0]).toEqual({ n: 1 });
  });
});

describe('ranking (database)', () => {
  const run = (n: number) => `10000000-0000-0000-0000-${String(n).padStart(12, '0')}`;
  beforeAll(async () => {
    // whoever lost the race above still needs a name
    for (const [u, name] of [['beto', 'Beto'], ['carla', 'Carla'], ['dani', 'Dani']] as const) {
      await as(u, `select public.reserve_username($1)`, [name]).catch(() => undefined);
    }
  });
  it('one best mark per player and board; the same run never counts twice; implausible data is refused', async () => {
    expect((await as('astra', `select public.submit_score($1, 'raimon', 'C', 300, 9000) as r`, [run(1)])).rows[0]).toEqual({ r: 'ok' });
    const age = () => db.exec(`update public.submitted_runs set at = now() - interval '1 minute'`);
    await expect(as('astra', `select public.submit_score($1, 'raimon', 'C', 300, 9000) as r`, [run(1)])).rejects.toThrow(/too_fast/); // spam guard first
    await age();
    expect((await as('astra', `select public.submit_score($1, 'raimon', 'C', 300, 9000) as r`, [run(1)])).rows[0]).toEqual({ r: 'duplicate' });
    await as('astra', `select public.submit_score($1, 'raimon', 'C', 200, 99999)`, [run(2)]); // worse time: kept the old one
    await age();
    expect((await db.query(`select time_sec, damage::int from public.scores where user_id = $1`, [ids.astra])).rows).toEqual([{ time_sec: 300, damage: 9000 }]);
    await expect(as('astra', `select public.submit_score($1, 'raimon', 'C', 30, -1)`, [run(3)])).rejects.toThrow(/implausible_damage/);
    // 2.01: too much damage per second is trimmed to 800.000/s instead of refusing the run
    expect((await as('astra', `select public.submit_score($1, 'raimon', 'A', 30, 99999999) as r`, [run(6)])).rows[0]).toEqual({ r: 'ok' });
    expect((await db.query(`select damage::int as d from public.scores where user_id = $1 and rank = 'A'`, [ids.astra])).rows).toEqual([{ d: 31 * 800000 }]);
    await age();
    await expect(as('astra', `select public.submit_score($1, 'raimon', 'Q', 30, 10)`, [run(4)])).rejects.toThrow(/invalid_board/);
    // Rango Z: refused until the Tuesday update (2026-11-10 12:00 Madrid), then a board like the rest
    if (Date.now() < Date.parse('2026-11-10T12:00:00+01:00')) await expect(as('astra', `select public.submit_score($1, 'raimon', 'Z', 30, 10)`, [run(4)])).rejects.toThrow(/rank_locked/);
    await expect(db.query(`insert into public.scores values ($1, 'raimon', 'C', 9999, 1, 0, $2)`, [ids.beto, run(5)])).resolves.toBeTruthy(); // superuser in tests; RLS blocks clients
  });
  it('points: rank Z above X and the arena multiplies them (same as scoreOf in the client)', async () => {
    const pts = async (map: string, rank: string, t: number, d: number) => Number((await db.query<{ p: string }>(`select private.score_of($1, $2, $3, $4) as p`, [map, rank, t, d])).rows[0].p);
    for (const [map, rank, t, d] of [['raimon', 'C', 300, 9000], ['ruinas', 'X', 560, 123456], ['torre', 'X', 630, 5555], ['fuji', 'Z', 510, 98765], ['clan', 'S', 300, 10], ['nueva', 'Z', 1, 1]] as const)
      expect(await pts(map, rank, t, d)).toBe(scoreOf({ map, rank, time: t, damage: d }));
    expect(await pts('raimon', 'Z', 300, 0)).toBeGreaterThan(await pts('raimon', 'X', 300, 0));
    expect(await pts('ruinas', 'X', 300, 0)).toBeGreaterThan(await pts('raimon', 'X', 300, 0));
  });
  it('top 15 by time then damage, filters, and my position far below the top', async () => {
    await db.exec('delete from public.scores; delete from public.submitted_runs;');
    // 30 ranked players, made with the superuser (they are not real accounts)
    for (let i = 0; i < 30; i++) {
      const id = `20000000-0000-0000-0000-${String(i).padStart(12, '0')}`;
      await db.query('insert into auth.users (id) values ($1)', [id]);
      await db.query('insert into public.profiles (id, username) values ($1, $2)', [id, `bot_${i}`]);
      await db.query(`insert into public.scores values ($1, $2, $3, $4, $5, 0, $1)`, [id, i % 2 ? 'royal' : 'raimon', i % 3 ? 'A' : 'X', 1000 + i * 10, 500 + (i % 4)]);
    }
    await as('dani', `select public.submit_score($1, 'raimon', 'A', 10, 5)`, [run(9)]); // last of everything
    await as('carla', `select public.submit_score($1, 'raimon', 'X', 1290, 9999)`, [run(10)]); // ties bot_29 on time
    const top = (await db.query<{ pos: number; username: string; time_sec: number; damage: number }>(`select * from public.leaderboard(null, null, 'time', 15)`)).rows;
    expect(top).toHaveLength(15);
    expect(top.map((r) => r.time_sec)).toEqual([...top.map((r) => r.time_sec)].sort((a, b) => b - a));
    expect(top[0].username).toBe('Carla'); // same time as bot_29, more damage
    expect(top[1].username).toBe('bot_29');
    const mine = (await as('dani', `select * from public.my_position(null, null, 'time')`)).rows[0] as { pos: number; username: string };
    expect(Number(mine.pos)).toBe(32);
    expect(mine.username).toBe('Dani');
    const royalX = (await db.query<{ map: string; rank: string }>(`select * from public.leaderboard('royal', 'X', 'time', 15)`)).rows;
    expect(royalX.every((r) => r.map === 'royal' && r.rank === 'X')).toBe(true);
    const byDamage = (await db.query<{ username: string }>(`select * from public.leaderboard(null, null, 'damage', 3)`)).rows;
    expect(byDamage[0].username).toBe('Carla');
  });
  it('Fix 1.31: the default board goes by points, where the rank matters most, and can be ordered by rank', async () => {
    const top = (await db.query<{ username: string; rank: string; score: string }>(`select * from public.leaderboard()`)).rows;
    expect(top.map((r) => Number(r.score))).toEqual([...top.map((r) => Number(r.score))].sort((a, b) => b - a));
    expect(top[0].rank).toBe('X'); // an X mark beats every A mark of similar time
    const formula = (await db.query<{ p: string }>(`select private.score_of('X', 600, 1000000) as p`)).rows[0].p;
    expect(Number(formula)).toBe(Math.round((6000 + 2000) * 4.8)); // same formula as src/systems/leaderboard.ts
    const byRank = (await db.query<{ rank: string }>(`select * from public.leaderboard(null, null, 'rank', 30)`)).rows;
    const tiers = byRank.map((r) => 'CBASX'.indexOf(r.rank));
    expect(tiers).toEqual([...tiers].sort((a, b) => b - a));
    await expect(api('', `select private.score_of('X', 1, 1)`)).rejects.toThrow(/permission denied/);
  });
  it('the email and account ids never appear in the ranking; one call returns at most 100 rows', async () => {
    const cols = (await db.query(`select * from public.leaderboard(null, null, 'time', 1)`)).fields.map((f) => f.name);
    expect(cols).not.toContain('email');
    expect(cols).not.toContain('user_id');
    expect((await api('', `select * from public.leaderboard(null, null, 'time', 100000)`)).rows.length).toBeLessThanOrEqual(100);
    expect((await api('', `select * from public.leaderboard(null, null, 'time', null)`)).rows).toHaveLength(15);
  });
});

describe('cloud save (database)', () => {
  it('each account reads only its own save; a stale device cannot overwrite a newer version', async () => {
    const v1 = (await as('beto', `select public.put_save('{"coins":1}'::jsonb, 0) as v`)).rows[0] as { v: number };
    expect(v1.v).toBe(1);
    await db.exec(`update public.saves set updated_at = now() - interval '1 minute'`);
    const v2 = (await as('beto', `select public.put_save('{"coins":2}'::jsonb, 1) as v`)).rows[0] as { v: number }; // device A
    expect(v2.v).toBe(2);
    await db.exec(`update public.saves set updated_at = now() - interval '1 minute'`);
    await expect(as('beto', `select public.put_save('{"coins":99}'::jsonb, 1)`)).rejects.toThrow(/version_conflict/); // device B, stale
    expect((await as('beto', `select data->>'coins' as c, version from public.get_save()`)).rows[0]).toEqual({ c: '2', version: 2 });
    expect((await as('carla', `select * from public.get_save()`)).rows).toHaveLength(0); // someone else's save is invisible
    await as('beto', `select public.put_save('{"coins":3}'::jsonb, 2)`);
    await expect(as('beto', `select public.put_save('{"coins":4}'::jsonb, 3)`)).rejects.toThrow(/too_fast/); // write flood right after
  });
  it('deleting the account removes its name, marks and save', async () => {
    await as('dani', `select public.delete_my_account()`);
    expect((await db.query(`select count(*)::int as n from public.profiles where id = $1`, [ids.dani])).rows[0]).toEqual({ n: 0 });
    expect((await db.query(`select count(*)::int as n from public.scores where user_id = $1`, [ids.dani])).rows[0]).toEqual({ n: 0 });
  });
});

describe('API roles (what the anon key can reach)', () => {
  it('no table is readable or writable directly, not even your own rows', async () => {
    for (const t of ['profiles', 'scores', 'submitted_runs', 'saves']) {
      await expect(api('', `select * from public.${t}`)).rejects.toThrow(/permission denied/);
      await expect(api('beto', `select * from public.${t}`)).rejects.toThrow(/permission denied/);
    }
    await expect(api('beto', `update public.saves set data = '{"coins":999}' where user_id = $1`, [ids.beto])).rejects.toThrow(/permission denied/);
    await expect(api('beto', `insert into public.scores values ($1, 'raimon', 'X', 9999, 1, 0, $1)`, [ids.beto])).rejects.toThrow(/permission denied/);
    await expect(api('carla', `delete from public.profiles where id = $1`, [ids.beto])).rejects.toThrow(/permission denied/);
  });
  it('another account cannot read or overwrite your save through the functions', async () => {
    const before = (await api('beto', `select data->>'coins' as c, version from public.get_save()`)).rows[0];
    expect((await api('carla', `select * from public.get_save()`)).rows).toHaveLength(0);
    await db.exec(`update public.saves set updated_at = now() - interval '1 minute'`);
    await api('carla', `select public.put_save('{"coins":-1}'::jsonb, 0)`); // creates Carla's own save, never Beto's
    expect((await api('beto', `select data->>'coins' as c, version from public.get_save()`)).rows[0]).toEqual(before);
  });
  it('signed-out callers can only check names and read the ranking', async () => {
    expect((await api('', `select public.username_available('Libre') as a`)).rows[0]).toEqual({ a: true });
    for (const call of [`public.get_save()`, `public.my_position()`, `public.put_save('{}'::jsonb, 0)`, `public.reserve_username('Libre')`,
      `public.submit_score(gen_random_uuid(), 'raimon', 'A', 60, 1)`, `public.delete_my_account()`]) {
      await expect(api('', `select ${call}`)).rejects.toThrow(/permission denied/);
    }
    await expect(api('', `select private.board(null, null, 'time')`)).rejects.toThrow(/permission denied/);
  });
  it('anonymous (guest) sessions cannot take a name or save', async () => {
    await db.query('insert into auth.users (id) values ($1)', [(ids.guest = '00000000-0000-0000-0000-0000000000aa')]);
    await expect(as('guest', `select public.reserve_username('Invitado')`, [], 'authenticated', '{"is_anonymous":true}')).rejects.toThrow(/not_authenticated/);
    await expect(as('guest', `select public.put_save('{}'::jsonb, 0)`, [], 'authenticated', '{"is_anonymous":true}')).rejects.toThrow(/not_authenticated/);
  });
});

describe('Google sign-in: first connection vs returning account', () => {
  it('my_profile returns only your own name, nothing before reserving one, and nothing signed out', async () => {
    expect((await api('astra', `select username::text as u from public.my_profile()`)).rows).toEqual([{ u: 'Astra' }]);
    await db.query('insert into auth.users (id) values ($1)', [(ids.nuevo = '00000000-0000-0000-0000-0000000000bb')]);
    expect((await api('nuevo', `select * from public.my_profile()`)).rows).toHaveLength(0); // first connection
    await api('nuevo', `select public.reserve_username('Nuevo_Google', '7', 'Raimon')`);
    expect((await api('nuevo', `select username::text as u, avatar, crest from public.my_profile()`)).rows).toEqual([{ u: 'Nuevo_Google', avatar: '7', crest: 'Raimon' }]);
    await expect(api('', `select * from public.my_profile()`)).rejects.toThrow(/permission denied/);
  });
});

describe('reiniciar progreso (database)', () => {
  const sv = (u: string) => api(u, `select (data->>'coins')::int as coins, (data->>'progressEpoch')::int as epoch, version from public.get_save()`);
  it('keeps the account and name, backs up, starts a new epoch, removes only your marks; old copies are refused', async () => {
    // Nuevo_Google (from the previous block) has a save and a mark; Astra has a mark too
    await db.exec(`update public.saves set updated_at = now() - interval '1 minute'; delete from public.submitted_runs`);
    await api('nuevo', `select public.put_save('{"coins":500,"owned":{"1":{}}}'::jsonb, 0)`);
    await api('nuevo', `select public.submit_score(gen_random_uuid(), 'raimon', 'C', 400, 99)`);
    await api('astra', `select public.submit_score(gen_random_uuid(), 'raimon', 'C', 300, 50)`);
    const before = (await sv('nuevo')).rows[0] as { version: number };
    await db.exec(`update public.saves set updated_at = now() - interval '1 minute'`);

    const r = (await api('nuevo', `select * from public.reset_my_progress('{"coins":200,"owned":{}}'::jsonb)`)).rows[0];
    expect(r).toEqual({ version: before.version + 1, epoch: 1 });
    expect((await sv('nuevo')).rows[0]).toEqual({ coins: 200, epoch: 1, version: before.version + 1 });
    expect((await api('nuevo', `select username::text as u from public.my_profile()`)).rows).toEqual([{ u: 'Nuevo_Google' }]); // name kept
    expect((await db.query(`select count(*)::int as n from auth.users where id = $1`, [ids.nuevo])).rows[0]).toEqual({ n: 1 }); // account kept
    expect((await api('nuevo', `select * from public.my_position()`)).rows).toHaveLength(0); // own marks gone
    expect((await api('astra', `select * from public.my_position()`)).rows).toHaveLength(1); // other players untouched
    // backup of the old save and marks, readable only by the owner of the database
    const b = (await db.query<{ coins: number; marks: number; save_version: number }>(`select (save_data->>'coins')::int as coins, jsonb_array_length(scores) as marks, save_version from private.progress_backups where user_id = $1`, [ids.nuevo])).rows;
    expect(b).toEqual([{ coins: 500, marks: 1, save_version: before.version }]);
    await expect(api('nuevo', `select * from private.progress_backups`)).rejects.toThrow(/permission denied/);

    await db.exec(`update public.saves set updated_at = now() - interval '1 minute'`);
    // an old browser still holding the pre-reset copy (no epoch) cannot write it back, even with the right version
    await expect(api('nuevo', `select public.put_save('{"coins":500}'::jsonb, ${before.version + 1})`)).rejects.toThrow(/progress_reset/);
    // the new progress (same epoch) saves normally
    expect((await api('nuevo', `select public.put_save('{"coins":210,"progressEpoch":1}'::jsonb, ${before.version + 1}) as v`)).rows[0]).toEqual({ v: before.version + 2 });
    // a second reset right away is refused; signed-out callers can't reset anyone
    await expect(api('nuevo', `select * from public.reset_my_progress('{}'::jsonb)`)).rejects.toThrow(/too_fast/);
    await expect(api('', `select * from public.reset_my_progress('{}'::jsonb)`)).rejects.toThrow(/permission denied/);
  });
});

describe('reportar un bug (database)', () => {
  const meta = `'{"version":"1.0","build":"4.2","browser":"Chrome 130","os":"Windows","screen":"1920x1080","map":"raimon","difficulty":"B","runTimeSec":75}'::jsonb`;
  const send = (u: string, client: string, shot = 'null') => api(u, `select public.submit_bug_report('${client}', 'gameplay', 'alta', 'El portero no para', 'Al usar Mano Celestial el balón atraviesa.', '1. Jugar 2. Parar', ${meta}, ${shot}) as code`);
  const age = () => db.exec(`update public.bug_reports set created_at = created_at - interval '2 minutes'`);
  it('a signed-in player sends a report and gets a code; sending the same form twice is one report', async () => {
    const a = (await send('beto', '30000000-0000-0000-0000-000000000001')).rows[0] as { code: string };
    expect(a.code).toMatch(/^BUG-[0-9A-F]{8}$/);
    expect((await send('beto', '30000000-0000-0000-0000-000000000001')).rows[0]).toEqual(a);
    const mine = (await api('beto', `select code, status, title from public.my_bug_reports()`)).rows;
    expect(mine).toEqual([{ code: a.code, status: 'nuevo', title: 'El portero no para' }]);
    const row = (await db.query(`select map, run_time_sec from public.bug_reports where code = $1`, [a.code])).rows[0];
    expect(row).toEqual({ map: 'raimon', run_time_sec: 75 });
  });
  it('spam limits: one report a minute, ten a day', async () => {
    await expect(send('beto', '30000000-0000-0000-0000-000000000002')).rejects.toThrow(/too_fast/);
    for (let i = 3; i <= 11; i++) { await age(); await send('beto', `30000000-0000-0000-0000-0000000000${String(i).padStart(2, '0')}`); }
    await age();
    await expect(send('beto', '30000000-0000-0000-0000-000000000099')).rejects.toThrow(/daily_limit/);
  });
  it("nobody reads other people's reports; signed-out callers can't send", async () => {
    expect((await api('carla', `select * from public.my_bug_reports()`)).rows).toHaveLength(0);
    await expect(api('carla', `select * from public.bug_reports`)).rejects.toThrow(/permission denied/);
    await expect(api('', `select public.submit_bug_report(gen_random_uuid(), 'otro', 'baja', 'Hola mundo', 'Descripción larga', '', '{}'::jsonb, null)`)).rejects.toThrow(/permission denied/);
    await expect(api('carla', `select public.submit_bug_report(gen_random_uuid(), 'nada', 'baja', 'Hola mundo', 'Descripción larga', '', '{}'::jsonb, null)`)).rejects.toThrow(/check constraint|violates/);
  });
  it('the admin panel is only for accounts in private.admins, never by username', async () => {
    expect((await api('carla', `select public.am_i_admin() as a`)).rows[0]).toEqual({ a: false });
    await expect(api('carla', `select * from public.admin_bug_reports()`)).rejects.toThrow(/forbidden/);
    await expect(api('carla', `select public.admin_update_bug('BUG-00000000', 'corregido', 'x')`)).rejects.toThrow(/forbidden/);
    await expect(api('beto', `select public.admin_player_stats()`)).rejects.toThrow(/forbidden/);
    await expect(api('', `select public.admin_player_stats()`)).rejects.toThrow(/permission denied/);
    await expect(api('beto', `select public.admin_metrics()`)).rejects.toThrow(/forbidden/);
    await expect(api('', `select public.admin_metrics()`)).rejects.toThrow(/permission denied/);
    await db.query('insert into private.admins (user_id) values ($1)', [ids.carla]);
    expect((await api('carla', `select public.am_i_admin() as a`)).rows[0]).toEqual({ a: true });
    // Fix 1.41: the players panel counts every account, and lists names without e-mails
    const st = (await api('carla', `select public.admin_player_stats(50) as s`)).rows[0] as { s: { accounts: number; players: Record<string, unknown>[] } };
    expect(st.s.accounts).toBe(((await db.query(`select count(*)::int as n from auth.users`)).rows[0] as { n: number }).n);
    expect(st.s.players.length).toBeGreaterThan(0);
    expect(JSON.stringify(st.s)).not.toMatch(/@example\.test/);
    const mt = (await api('carla', `select public.admin_metrics(7) as m`)).rows[0] as { m: { daily: unknown[]; hours: number[] } };
    expect(mt.m.daily.length).toBe(7);
    expect(mt.m.hours.length).toBe(24);
    const all = (await api('carla', `select code, severity from public.admin_bug_reports(null, null, null, null, null, 'prioridad', 100)`)).rows as { code: string }[];
    expect(all.length).toBeGreaterThanOrEqual(10);
    await api('carla', `select public.admin_update_bug($1, 'revisando', 'Reproducido en Chrome')`, [all[0].code]);
    expect((await api('beto', `select status from public.my_bug_reports() where code = $1`, [all[0].code])).rows[0]).toEqual({ status: 'revisando' });
    expect((await api('beto', `select * from public.my_bug_reports() limit 1`)).fields.map((f) => f.name)).not.toContain('admin_notes');
    expect((await api('carla', `select code from public.admin_bug_reports('gameplay', 'alta', 'revisando', now() - interval '1 day', now() + interval '1 day', 'fecha', 10)`)).rows).toEqual([{ code: all[0].code }]);
    // a guest (anonymous) session of an admin account is not an admin
    expect((await as('carla', `select public.am_i_admin() as a`, [], 'authenticated', '{"is_anonymous":true}')).rows[0]).toEqual({ a: false });
  });
  it('1.85: a report marked «corregido» pays its reporter 100 fichas once; admins and repeats pay nothing', async () => {
    const all = (await api('carla', `select code, title from public.admin_bug_reports(null, null, null, null, null, 'fecha', 100)`)).rows as { code: string; title: string }[];
    const mine = (await api('beto', `select code from public.my_bug_reports()`)).rows as { code: string }[];
    const code = mine[0].code;
    expect((await api('beto', `select * from public.claim_bug_rewards()`)).rows).toEqual([]);
    await api('carla', `select public.admin_update_bug($1, 'corregido', null)`, [code]);
    await api('carla', `select public.admin_update_bug($1, 'revisando', null)`, [code]);
    await api('carla', `select public.admin_update_bug($1, 'corregido', null)`, [code]); // back and forth: still once
    const got = (await api('beto', `select * from public.claim_bug_rewards()`)).rows as { code: string; tokens: number }[];
    expect(got).toEqual([expect.objectContaining({ code, tokens: 100 })]);
    expect((await api('beto', `select * from public.claim_bug_rewards()`)).rows).toEqual([]); // claimed only once
    await expect(api('', `select * from public.claim_bug_rewards()`)).rejects.toThrow(/permission denied/);
    await expect(api('beto', `select * from private.bug_rewards`)).rejects.toThrow();
    expect(all.length).toBeGreaterThan(0);
  });
  it('1.88: a reply or a fixed report reaches the reporter once; discarded tells nothing; private notes never', async () => {
    const mine = (await api('beto', `select code from public.my_bug_reports()`)).rows as { code: string }[];
    const [a, b] = [mine[0].code, mine[1].code];
    await api('beto', `select * from public.claim_bug_notices()`); // nothing left from earlier tests
    await api('carla', `select public.admin_update_bug($1, null, 'nota privada', 'Gracias, ya lo estamos mirando')`, [a]);
    await api('carla', `select public.admin_update_bug($1, 'descartado', null, null)`, [b]);
    const got = (await api('beto', `select * from public.claim_bug_notices() order by code`)).rows as { code: string; status: string; reply: string }[];
    expect(got.map((r) => r.code)).toEqual([a]); // (author) a discarded report tells nothing
    expect(got[0].reply).toBe('Gracias, ya lo estamos mirando');
    expect(JSON.stringify(got)).not.toMatch(/nota privada/);
    expect((await api('beto', `select * from public.claim_bug_notices()`)).rows).toEqual([]); // once
    await api('carla', `select public.admin_update_bug($1, null, 'otra nota', null)`, [a]); // notes alone: no notice
    expect((await api('beto', `select * from public.claim_bug_notices()`)).rows).toEqual([]);
    expect((await api('beto', `select reply from public.my_bug_reports() where code = $1`, [a])).rows[0]).toEqual({ reply: 'Gracias, ya lo estamos mirando' });
    await expect(api('beto', `select public.admin_update_bug($1, null, null, 'hack')`, [a])).rejects.toThrow(/forbidden/);
  });
  it('1.88: recommendations — send, see own, admin marks; accepted or answered tells the player once, discarded tells nothing', async () => {
    const code = (await api('beto', `select public.submit_suggestion('Más mapas nocturnos', 'Estaría genial jugar de noche en el Raimon.') as c`)).rows[0] as { c: string };
    expect(code.c).toMatch(/^IDEA-/);
    await expect(api('beto', `select public.submit_suggestion('Otra idea', 'Demasiado rápido después de la primera.')`)).rejects.toThrow(/too_fast/);
    await db.query(`update public.suggestions set created_at = now() - interval '2 minutes'`);
    const c2 = ((await api('beto', `select public.submit_suggestion('Modo torneo', 'Un torneo de eliminación con amigos.') as c`)).rows[0] as { c: string }).c;
    expect((await api('beto', `select code, status from public.my_suggestions() order by code`)).rows).toHaveLength(2);
    await expect(api('beto', `select * from public.admin_suggestions()`)).rejects.toThrow(/forbidden/);
    expect(((await api('carla', `select count(*)::int as n from public.admin_suggestions('pendiente')`)).rows[0] as { n: number }).n).toBe(2);
    await api('carla', `select public.admin_update_suggestion($1, 'aceptada', '¡Para la 1.9!')`, [code.c]);
    await api('carla', `select public.admin_update_suggestion($1, 'descartada', null)`, [c2]);
    const got = (await api('beto', `select * from public.claim_suggestion_notices()`)).rows as { code: string; reply: string }[];
    expect(got).toEqual([expect.objectContaining({ code: code.c, status: 'aceptada', reply: '¡Para la 1.9!' })]);
    expect((await api('beto', `select * from public.claim_suggestion_notices()`)).rows).toEqual([]);
    await expect(api('', `select public.submit_suggestion('Hola', 'sin sesión no se puede')`)).rejects.toThrow(/permission denied/);
    await expect(api('beto', `select * from public.suggestions`)).rejects.toThrow();
  });
  it("screenshots must be the sender's own uploaded file; the notice can be claimed once", async () => {
    await db.exec(`delete from public.bug_reports where user_id = '${ids.carla}'`);
    const mine = `${ids.carla}/31000000-0000-0000-0000-000000000001.webp`;
    await expect(send('carla', '31000000-0000-0000-0000-000000000001', `'${ids.beto}/robado-123456789.webp'`)).rejects.toThrow(/invalid_screenshot/);
    await expect(send('carla', '31000000-0000-0000-0000-000000000001', `'${mine}'`)).rejects.toThrow(/invalid_screenshot/); // not uploaded
    await db.query(`insert into storage.objects (bucket_id, name, owner_id) values ('bug-screenshots', $1, $2)`, [mine, ids.carla]);
    const { code } = (await send('carla', '31000000-0000-0000-0000-000000000001', `'${mine}'`)).rows[0] as { code: string };
    expect((await api('carla', `select title from public.claim_bug_notification($1)`, [code])).rows).toEqual([{ title: 'El portero no para' }]);
    expect((await api('carla', `select * from public.claim_bug_notification($1)`, [code])).rows).toHaveLength(0);
    expect((await api('beto', `select * from public.claim_bug_notification($1)`, [code])).rows).toHaveLength(0); // not beto's
    expect((await api('carla', `select * from public.delete_my_bug_reports() as p`)).rows).toEqual([{ p: mine }]);
    expect((await api('carla', `select * from public.my_bug_reports()`)).rows).toHaveLength(0);
  });
});

describe('economy guard of the cloud save (Fix 1.23)', () => {
  const coins = (u: string) => as(u, `select (data->>'tokens')::int as t, (data->>'coins')::int as c, version from public.get_save()`).then((r) => r.rows[0] as { t: number; c: number; version: number });
  const back = (u: string, iv: string) => db.query(`update public.saves set updated_at = now() - interval '${iv}' where user_id = $1`, [ids[u]]);
  it('a forged jump of fichas or coins is cut to what the elapsed time allows; honest growth and spending pass', async () => {
    await db.query(`delete from public.saves where user_id = $1`, [ids.astra]);
    await api('astra', `select public.put_save('{"tokens":999999,"coins":99999999}'::jsonb, 0)`); // first copy: fixed ceilings
    expect(await coins('astra')).toMatchObject({ t: 5000, c: 120000 }); // 1.86: coin ceiling doubled
    await back('astra', '1 minute');
    await api('astra', `select public.put_save('{"tokens":5100,"coins":120300}'::jsonb, 1)`); // a normal run: untouched
    expect(await coins('astra')).toMatchObject({ t: 5100, c: 120300 });
    await back('astra', '1 minute');
    await api('astra', `select public.put_save('{"tokens":9999999,"coins":10}'::jsonb, 2)`); // console cheat; coins spent
    const cut = await coins('astra');
    expect(cut.t).toBeLessThan(5100 + 2100);
    expect(cut.c).toBe(10);
    await back('astra', '10 hours'); // hours of play allow more, never unlimited
    await api('astra', `select public.put_save('{"tokens":9999999}'::jsonb, 3)`);
    expect((await coins('astra')).t).toBeLessThan(cut.t + 2000 + 1000 * 10 + 50);
  });
  it('the cap is not callable from the API', async () => {
    await expect(api('astra', `select private.economy_cap('{}'::jsonb, null, null, null)`)).rejects.toThrow();
  });
});
describe('promotional codes (Fix 1.12)', () => {
  const redeem = (u: string, code: string, applied = false) => api(u, `select public.redeem_code($1, $2) as r`, [code, applied]).then((x) => (x.rows[0] as { r: Record<string, unknown> }).r);
  it('ASTRA17 once per account: ok with a server-chosen Legendario, then used; unknown codes and guests are refused', async () => {
    const first = await redeem('carla', 'astra17');
    expect(first.status).toBe('ok');
    const reward = first.reward as { tokens: number; coins: number; player: number };
    expect(reward).toMatchObject({ tokens: 100, coins: 500 }); // Fix 1.23: one ×10 at the new price
    expect(Number.isInteger(reward.player)).toBe(true);
    expect((await redeem('carla', 'ASTRA17')).status).toBe('used');
    expect((await redeem('carla', 'NOEXISTE')).status).toBe('invalid');
    await expect(api('', `select public.redeem_code('ASTRA17')`)).rejects.toThrow();
  });
  it('a guest redemption linked to an account blocks a second reward; tables are closed to the API', async () => {
    expect((await redeem('astra', 'ASTRA17', true)).status).toBe('linked');
    expect((await redeem('astra', 'ASTRA17')).status).toBe('used');
    await expect(api('astra', `select * from private.promo_redemptions`)).rejects.toThrow();
    await expect(api('astra', `select * from private.promo_codes`)).rejects.toThrow();
  });
  it('two requests at the same time give exactly one reward', async () => {
    const both = await Promise.all([redeem('beto', 'ASTRA17'), redeem('beto', 'ASTRA17')]);
    expect(both.filter((r) => r.status === 'ok')).toHaveLength(1);
  });
  it('1.75 GRACIAS: 150 fichas de evento and 10.000 coins, once', async () => {
    const r = await redeem('carla', 'gracias');
    expect(r.status).toBe('ok');
    expect(r.reward).toMatchObject({ tokens: 0, coins: 10000, eventTokens: 150, player: null });
    expect((await redeem('carla', 'GRACIAS')).status).toBe('used');
  });
  it('1.81 INA483: 5+5 ×10 pulls, 20.000 coins, a Legendario or higher (never event-only) and its banner and frame, once', async () => {
    const r = await redeem('carla', 'ina483');
    expect(r.status).toBe('ok');
    const reward = r.reward as { tokens: number; coins: number; eventTokens: number; player: number; pennants: string[] };
    expect(reward).toMatchObject({ tokens: 500, coins: 20000, eventTokens: 750, pennants: ['inazuma', 'marco-inazuma'] });
    // the footballer comes from the code's own pools (Legendario, Mítico, Leyenda; built without event-only ones)
    const pools = ((await db.query(`select rewards -> 'rarity_pools' as p from private.promo_codes where code = 'INA483'`)).rows[0] as { p: Record<string, number[]> }).p;
    expect(Object.keys(pools).sort()).toEqual(['legendario', 'leyenda', 'mitico']);
    expect(Object.values(pools).flat()).toContain(reward.player);
    expect((await redeem('carla', 'INA483')).status).toBe('used');
    // the old codes answer as before: no pennants key
    expect(Object.keys((await redeem('beto', 'GRACIAS')).reward as object)).not.toContain('pennants');
  });
});
describe('public profile (1.76)', () => {
  it('carries pulls, claimed achievements and the collection for the player card; nothing private', async () => {
    await db.query('insert into auth.users (id) values ($1)', [(ids.eva = '00000000-0000-0000-0000-0000000000cc')]);
    await api('eva', `select public.reserve_username('Eva_P', '7', 'Raimon')`);
    await api('eva', `select public.put_save($1::jsonb, 0)`, [JSON.stringify({ stats: { runs: 3, wins: 1, pulls: 12 },
      owned: { 10: { copies: 2, stars: 1, hero: true, heroStars: 2, train: { kick: 3 } }, x: { copies: 1 } },
      missions: { claimed: ['primera-victoria', 'diaria1@2026-11-04', 'bad id!'] }, coins: 5 })]);
    const p = (await api('', `select public.public_profile('Eva_P') as p`)).rows[0] as { p: Record<string, unknown> };
    expect(p.p.stats).toMatchObject({ runs: 3, wins: 1, pulls: 12 });
    expect(p.p.collection).toEqual({ 10: { stars: 1, hero: true, heroStars: 2, train: { kick: 3 } } });
    expect(p.p.achievements).toEqual(['primera-victoria']);
    expect(JSON.stringify(p.p)).not.toMatch(/coins|copies|example\.test/);
  });
});
describe('GTS (1.8)', () => {
  const u = async (name: string, id: string) => {
    await db.query('insert into auth.users (id) values ($1) on conflict do nothing', [(ids[name] = id)]);
    await api(name, `select public.reserve_username($1, '7', 'Raimon')`, [name.toUpperCase() + '_G']);
  };
  // the cloud save, written straight to the table (put_save has its own tests and rate limit)
  const save = (name: string, data: unknown) => db.query('insert into public.saves (user_id, data) values ($1, $2) on conflict (user_id) do update set data = excluded.data', [ids[name], JSON.stringify(data)]);
  const dep = (name: string, give: number, want: number) => api(name, 'select public.gts_deposit($1, $2) as id', [give, want]).then((r) => Number((r.rows[0] as { id: number }).id));
  const take = (name: string, id: number) => api(name, 'select public.gts_take($1) as r', [id]).then((r) => (r.rows[0] as { r: { give: number; get: number } }).r);
  beforeAll(async () => {
    await u('hugo', '00000000-0000-0000-0000-0000000000d1');
    await u('ines', '00000000-0000-0000-0000-0000000000d2');
    await u('juan', '00000000-0000-0000-0000-0000000000d3');
  });

  it('only a spare copy can be left: never the only one, a Leyenda or an event footballer; an ascended HÉROE can', async () => {
    await save('hugo', { owned: { 10: { copies: 1 }, 20: { copies: 3, spent: 1 }, 30: { copies: 4, hero: true }, 100234: { copies: 5 }, 900001: { copies: 3 } } });
    await expect(dep('hugo', 10, 20)).rejects.toThrow(/gts_no_spare/);
    const hero = await dep('hugo', 30, 20); // the spare copy of a HÉROE travels clean
    expect(hero).toBeGreaterThan(0);
    expect((await api('hugo', 'select public.gts_withdraw($1) as ok', [hero])).rows[0]).toEqual({ ok: true });
    await expect(dep('hugo', 100234, 20)).rejects.toThrow(/gts_banned/);
    await expect(dep('hugo', 900001, 20)).rejects.toThrow(/gts_banned/);
    await expect(dep('hugo', 20, 100234)).rejects.toThrow(/gts_banned/); // nobody could ever give a Leyenda
    await expect(dep('hugo', 20, 20)).rejects.toThrow(/gts_invalid/);
    expect(await dep('hugo', 20, 10)).toBeGreaterThan(0);
  });
  it('one slot (more with the Ventanilla GTS upgrade, 5 at most); the same deposit can\'t be open twice; a stale save can\'t leave a copy twice', async () => {
    await save('ines', { owned: { 40: { copies: 3 }, 41: { copies: 9 } } });
    const a = await dep('ines', 40, 1);
    await expect(dep('ines', 41, 2)).rejects.toThrow(/gts_slots/);
    await save('ines', { owned: { 40: { copies: 3 }, 41: { copies: 9 } }, upgrades: { gts: 9 } });
    await expect(dep('ines', 40, 1)).rejects.toThrow(/gts_repeated/);
    const b = await dep('ines', 40, 2); // the second and last spare of 40 (the save still says 3 copies: the ledger discounts)
    await expect(dep('ines', 40, 3)).rejects.toThrow(/gts_no_spare/);
    for (const w of [3, 4, 5]) await dep('ines', 41, w);
    await expect(dep('ines', 41, 6)).rejects.toThrow(/gts_slots/); // 5 at most
    expect((await api('ines', 'select public.gts_withdraw($1) as ok', [a])).rows[0]).toEqual({ ok: true });
    expect((await api('hugo', 'select public.gts_withdraw($1) as ok', [b])).rows[0]).toEqual({ ok: false }); // not his
  });
  it('a taker with a spare of the footballer asked for gets the deposit; exactly once; the same exchange is never repeated', async () => {
    await save('juan', { owned: { 10: { copies: 3 } } });
    const id = Number(((await api('juan', 'select * from public.gts_search(20, null)')).rows[0] as { id: number }).id);
    await expect(take('hugo', id)).rejects.toThrow(/gts_own/);
    const both = await Promise.allSettled([take('juan', id), take('juan', id)]);
    expect(both.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    expect((both.find((r) => r.status === 'fulfilled') as PromiseFulfilledResult<{ give: number; get: number }>).value).toMatchObject({ give: 10, get: 20 });
    await expect(take('ines', id)).rejects.toThrow(/gts_gone/);
    // Hugo can't leave 20 for 10 again, and Juan can't take another 20-for-10
    await save('hugo', { owned: { 20: { copies: 9 } }, gts: { applied: [`d:${id}`] } });
    await expect(dep('hugo', 20, 10)).rejects.toThrow(/gts_repeated/);
    const mine = (await api('hugo', 'select role, status, other from public.gts_mine()')).rows;
    expect(mine).toContainEqual({ role: 'deposito', status: 'traded', other: 'JUAN_G' });
    expect((await api('juan', 'select role from public.gts_mine()')).rows).toContainEqual({ role: 'tomado' });
  });
  it('anyone can read the feed and search; only signed-in players trade; tables are closed', async () => {
    expect((await api('', 'select count(*)::int as n from public.gts_feed()')).rows[0]).toMatchObject({ n: expect.any(Number) });
    await expect(api('', 'select public.gts_deposit(1, 2)')).rejects.toThrow();
    await expect(api('hugo', 'select * from private.gts_deposits')).rejects.toThrow();
    await expect(api('hugo', 'select private.gts_spare($1, 20)', [ids.hugo])).rejects.toThrow();
  });
});

describe('co-op rooms (pre-2.0)', () => {
  const u = async (name: string, id: string) => {
    await db.query('insert into auth.users (id) values ($1) on conflict do nothing', [(ids[name] = id)]);
    await api(name, `select public.reserve_username($1, '7', 'Raimon')`, [name.toUpperCase() + '_C']);
  };
  const poll = (name: string, code: string) => api(name, 'select * from public.coop_poll($1)', [code]).then((r) => r.rows[0] as Record<string, string | null> | undefined);
  beforeAll(async () => {
    await u('kike', '00000000-0000-0000-0000-0000000000e1');
    await u('lola', '00000000-0000-0000-0000-0000000000e2');
    await u('mario', '00000000-0000-0000-0000-0000000000e3');
  });

  it('host creates, guest joins with the code; offer only from the guest, answer only from the host; each sees only the other side', async () => {
    const code = ((await api('kike', 'select public.coop_create() as c')).rows[0] as { c: string }).c;
    expect(code).toMatch(/^[A-Z2-9]{6}$/);
    await expect(api('kike', 'select public.coop_join($1)', [code])).rejects.toThrow(/own_room/);
    expect((await api('lola', 'select public.coop_join($1) as h', [code.toLowerCase()])).rows[0]).toEqual({ h: 'KIKE_C' });
    await expect(api('mario', 'select public.coop_join($1)', [code])).rejects.toThrow(/room_full/);
    await expect(api('kike', `select public.coop_signal($1, 'offer', 'x')`, [code])).rejects.toThrow(/forbidden/);
    await api('lola', `select public.coop_signal($1, 'offer', 'OFFER-SDP')`, [code]);
    expect(await poll('kike', code)).toMatchObject({ status: 'emparejada', guest_name: 'LOLA_C', offer: 'OFFER-SDP', answer: null, role: 'host' });
    await expect(api('lola', `select public.coop_signal($1, 'answer', 'x')`, [code])).rejects.toThrow(/forbidden/);
    await api('kike', `select public.coop_signal($1, 'answer', 'ANSWER-SDP')`, [code]);
    expect(await poll('lola', code)).toMatchObject({ host_name: 'KIKE_C', offer: null, answer: 'ANSWER-SDP', role: 'guest' });
    expect(await poll('mario', code)).toBeUndefined(); // not in the room: sees nothing
    await api('kike', `select public.coop_mark($1, 'conectada')`, [code]);
    expect(await poll('lola', code)).toMatchObject({ status: 'conectada' });
    await api('lola', `select public.coop_mark($1, 'cerrada')`, [code]);
    await expect(api('mario', 'select public.coop_join($1)', [code])).rejects.toThrow(/room_not_found/);
  });
  it('a new room closes the host\'s previous open one; rooms expire; 40 a day; signed-in only; table closed', async () => {
    const a = ((await api('mario', 'select public.coop_create() as c')).rows[0] as { c: string }).c;
    const b = ((await api('mario', 'select public.coop_create() as c')).rows[0] as { c: string }).c;
    await expect(api('kike', 'select public.coop_join($1)', [a])).rejects.toThrow(/room_not_found/);
    await db.query(`update public.coop_rooms set expires_at = now() - interval '1 minute' where code = $1`, [b]);
    await expect(api('kike', 'select public.coop_join($1)', [b])).rejects.toThrow(/room_not_found/);
    await db.query(`insert into public.coop_rooms (code, host) select 'ZZ' || substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', g % 32 + 1, 1) || substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', g / 32 + 1, 1) || 'AA', $1 from generate_series(1, 38) g`, [ids.mario]);
    await expect(api('mario', 'select public.coop_create()')).rejects.toThrow(/coop_daily_limit/);
    await expect(api('lola', `select public.coop_signal('AAAAAA', 'offer', $1)`, ['x'.repeat(20001)])).rejects.toThrow(/too_big/);
    await expect(api('', 'select public.coop_create()')).rejects.toThrow();
    await expect(api('kike', 'select * from public.coop_rooms')).rejects.toThrow();
  });
  it('TURN credentials only for a player in a paired room, 20 a day each; the log is closed; usage is admin-only', async () => {
    const code = ((await api('kike', 'select public.coop_create() as c')).rows[0] as { c: string }).c;
    await expect(api('kike', 'select public.coop_turn_claim($1)', [code])).rejects.toThrow(/room_not_found/); // nobody joined yet
    await api('lola', 'select public.coop_join($1)', [code]);
    expect((await api('kike', 'select public.coop_turn_claim($1) as ok', [code])).rows[0]).toEqual({ ok: true });
    expect((await api('lola', 'select public.coop_turn_claim($1) as ok', [code])).rows[0]).toEqual({ ok: true });
    await expect(api('mario', 'select public.coop_turn_claim($1)', [code])).rejects.toThrow(/room_not_found/);
    await db.query(`insert into private.coop_turn_log (user_id, code) select $1, 'X' from generate_series(1, 19)`, [ids.kike]);
    expect((await api('kike', 'select public.coop_turn_claim($1) as ok', [code])).rows[0]).toEqual({ ok: false });
    await expect(api('kike', 'select * from private.coop_turn_log')).rejects.toThrow();
    await expect(api('kike', 'select * from public.coop_turn_usage()')).rejects.toThrow(/forbidden/);
  });
});

describe('friends and co-op invitations (pre-2.0)', () => {
  const u = async (name: string, id: string) => {
    await db.query('insert into auth.users (id) values ($1) on conflict do nothing', [(ids[name] = id)]);
    await api(name, `select public.reserve_username($1, '7', 'Raimon')`, [name.toUpperCase() + '_F']);
  };
  const list = (name: string) => api(name, 'select username, status, online from public.friend_list()').then((r) => r.rows as { username: string; status: string; online: boolean }[]);
  beforeAll(async () => {
    await u('nora', '00000000-0000-0000-0000-0000000000f1');
    await u('oscar', '00000000-0000-0000-0000-0000000000f2');
    await u('pepa', '00000000-0000-0000-0000-0000000000f3');
  });

  it('a request, accepted by the other one (or by asking back); unknown names and oneself are refused', async () => {
    expect((await api('nora', 'select public.friend_request($1) as r', ['OSCAR_F'])).rows[0]).toEqual({ r: 'enviada' });
    expect((await api('nora', 'select public.friend_request($1) as r', ['OSCAR_F'])).rows[0]).toEqual({ r: 'enviada' }); // twice: still one
    expect(await list('nora')).toEqual([{ username: 'OSCAR_F', status: 'enviada', online: false }]);
    expect(await list('oscar')).toEqual([{ username: 'NORA_F', status: 'recibida', online: false }]);
    await api('oscar', 'select public.friend_respond($1, true)', ['NORA_F']);
    expect((await list('nora'))[0]).toMatchObject({ status: 'amigo' });
    // asking back turns a pending request into a friendship
    await api('pepa', 'select public.friend_request($1)', ['NORA_F']);
    expect((await api('nora', 'select public.friend_request($1) as r', ['PEPA_F'])).rows[0]).toEqual({ r: 'aceptada' });
    await expect(api('nora', 'select public.friend_request($1)', ['NADIE_F'])).rejects.toThrow(/friend_not_found/);
    await expect(api('nora', 'select public.friend_request($1)', ['NORA_F'])).rejects.toThrow(/friend_self/);
  });
  it('online from the heartbeat; removing ends it; a declined request leaves nothing', async () => {
    await api('oscar', 'select public.friend_heartbeat()');
    expect((await list('nora')).find((f) => f.username === 'OSCAR_F')).toMatchObject({ online: true });
    await db.query(`update private.presence set seen_at = now() - interval '5 minutes' where user_id = $1`, [ids.oscar]);
    expect((await list('nora')).find((f) => f.username === 'OSCAR_F')).toMatchObject({ online: false });
    await api('pepa', 'select public.friend_remove($1)', ['NORA_F']);
    expect((await list('nora')).map((f) => f.username)).toEqual(['OSCAR_F']);
    await api('pepa', 'select public.friend_request($1)', ['OSCAR_F']);
    await api('oscar', 'select public.friend_respond($1, false)', ['PEPA_F']);
    expect(await list('pepa')).toEqual([]);
  });
  it('only a friend can be invited, only to the host\'s own open room; each invitation is shown once', async () => {
    const code = ((await api('nora', 'select public.coop_create() as c')).rows[0] as { c: string }).c;
    await expect(api('nora', 'select public.coop_invite($1, $2)', ['PEPA_F', code])).rejects.toThrow(/not_friends/);
    await expect(api('oscar', 'select public.coop_invite($1, $2)', ['NORA_F', code])).rejects.toThrow(/room_not_found/); // not his room
    await api('nora', 'select public.coop_invite($1, $2)', ['OSCAR_F', code]);
    expect((await api('oscar', 'select from_name, code from public.coop_invites_claim()')).rows).toEqual([{ from_name: 'NORA_F', code }]);
    expect((await api('oscar', 'select * from public.coop_invites_claim()')).rows).toEqual([]);
    await expect(api('oscar', 'select * from public.friendships')).rejects.toThrow();
    await expect(api('oscar', 'select * from public.coop_invites')).rejects.toThrow();
    await expect(api('', 'select public.friend_request($1)', ['NORA_F'])).rejects.toThrow();
  });
});

describe('tier lists (1.9)', () => {
  const u = async (name: string, id: string, username = true) => {
    await db.query('insert into auth.users (id) values ($1) on conflict do nothing', [(ids[name] = id)]);
    if (username) await api(name, `select public.reserve_username($1)`, [name.toUpperCase() + '_T']);
  };
  beforeAll(async () => {
    await u('tina', '00000000-0000-0000-0000-0000000000b1');
    await u('tomas', '00000000-0000-0000-0000-0000000000b2');
    await u('sinnombre', '00000000-0000-0000-0000-0000000000b3', false);
  });
  const feed = () => api('', 'select username, topic, tiers from public.tierlist_feed(10)').then((r) => r.rows as { username: string; topic: string; tiers: Record<string, number[]> }[]);
  it('publish, replace, read by anyone; one per account and bad lists refused', async () => {
    await api('tina', `select public.submit_tierlist('delanteros', $1::jsonb)`, [JSON.stringify({ S: [1, 2], A: [3], D: [] })]);
    expect((await feed()).filter((r) => r.username === 'TINA_T')).toEqual([{ username: 'TINA_T', topic: 'delanteros', tiers: { S: [1, 2], A: [3], D: [] } }]);
    await expect(api('tina', `select public.submit_tierlist('general', $1::jsonb)`, [JSON.stringify({ S: [1, 2, 3] })])).rejects.toThrow(/too_fast/);
    await db.query(`update public.tierlists set updated_at = now() - interval '2 minutes'`);
    await api('tina', `select public.submit_tierlist('general', $1::jsonb)`, [JSON.stringify({ S: [4, 5, 6] })]);
    expect((await feed()).filter((r) => r.username === 'TINA_T')).toHaveLength(1);
    for (const bad of [{ S: [1, 1, 2] }, { X: [1, 2, 3] }, { S: [1, 2] }, { S: [1.5, 2, 3] }, { S: ['1', 2, 3] }, { S: Array.from({ length: 31 }, (_, i) => i + 1) }])
      await expect(api('tomas', `select public.submit_tierlist('general', $1::jsonb)`, [JSON.stringify(bad)])).rejects.toThrow(/invalid_tiers/);
    await expect(api('tomas', `select public.submit_tierlist('memes', $1::jsonb)`, [JSON.stringify({ S: [1, 2, 3] })])).rejects.toThrow();
    await expect(api('sinnombre', `select public.submit_tierlist('general', $1::jsonb)`, [JSON.stringify({ S: [1, 2, 3] })])).rejects.toThrow(/no_username/);
    await expect(api('', `select public.submit_tierlist('general', $1::jsonb)`, [JSON.stringify({ S: [1, 2, 3] })])).rejects.toThrow(/permission denied/);
    await expect(api('tina', 'select * from public.tierlists')).rejects.toThrow();
  });
  it('the admin hides one; its owner can delete it', async () => {
    await expect(api('tomas', `select public.admin_hide_tierlist('TINA_T')`)).rejects.toThrow(/forbidden/);
    await api('carla', `select public.admin_hide_tierlist('TINA_T')`);
    expect((await feed()).some((r) => r.username === 'TINA_T')).toBe(false);
    expect((await api('tina', 'select hidden from public.my_tierlist()')).rows).toEqual([{ hidden: true }]);
    expect((await api('tina', 'select public.delete_my_tierlist() as d')).rows).toEqual([{ d: true }]);
    expect((await api('tina', 'select * from public.my_tierlist()')).rows).toEqual([]);
  });
});

describe('clans (1.93)', () => {
  const u = async (name: string, id: string) => {
    await db.query('insert into auth.users (id) values ($1) on conflict do nothing', [(ids[name] = id)]);
    await api(name, `select public.reserve_username($1)`, [name.toUpperCase() + '_C']);
  };
  const people = ['cira', 'cleo', 'coco', 'cris', 'cuca', 'cata', 'celia', 'ciro', 'cami', 'cora'];
  beforeAll(async () => { for (const [i, n] of people.entries()) await u(n, `00000000-0000-0000-0000-0000000000a${i}`); });
  const mine = (n: string) => api(n, 'select public.my_clan() as c').then((r) => (r.rows[0] as { c: Record<string, unknown> | null }).c);
  const run = (n: string, id: string, kills = 100, victory = true) => api(n, `select public.clan_submit_run($1, $2, 300, 250000, 'S', $3) as r`, [id, kills, victory]).then((r) => (r.rows[0] as { r: { points: number; left: number } }).r);

  it('names: format, banned words (anywhere or as a whole word), taken', async () => {
    for (const bad of ['ab', 'x'.repeat(21), '!!!', '123', 'Los Hijoputas', 'P0LL4', 'Mi culo FC', 'Admin']) {
      await expect(api('cira', `select public.clan_create($1)`, [bad])).rejects.toThrow(/invalid_clan_name|banned_clan_name/);
    }
    expect(((await api('cira', `select public.clan_create('Círculo Disputa', 'Raimon', 'Raimon') as id`)).rows[0] as { id: number }).id).toBeGreaterThan(0);
    await expect(api('cleo', `select public.clan_create('círculo disputa')`)).rejects.toThrow(/clan_name_taken/);
    await expect(api('cira', `select public.clan_create('Otro Clan')`)).rejects.toThrow(/already_in_clan/);
    const c = await mine('cira');
    expect(c).toMatchObject({ name: 'Círculo Disputa', crest: 'Raimon', kit: 'Raimon', members: 1, me: 'lider', runsToday: 0 });
    await expect(api('', `select public.clan_create('Sin Sesion')`)).rejects.toThrow(/permission denied/);
    await expect(api('cira', 'select * from public.clans')).rejects.toThrow();
  });

  it('requests: by request until a leader or officer accepts; open clans take you at once; 20 at most', async () => {
    const id = ((await api('cleo', `select id from public.clan_search('círculo')`)).rows[0] as { id: number }).id;
    expect((await api('cleo', 'select public.clan_request($1) as r', [id])).rows[0]).toEqual({ r: 'requested' });
    expect((await api('coco', 'select public.clan_request($1) as r', [id])).rows[0]).toEqual({ r: 'requested' });
    expect((await api('cleo', 'select name from public.my_clan_requests()')).rows).toEqual([{ name: 'Círculo Disputa' }]);
    expect(await mine('cleo')).toBeNull();
    await expect(api('cleo', 'select * from public.clan_requests()')).rejects.toThrow(/not_leader/);
    expect((await mine('cira'))?.requests).toBe(2);
    expect((await api('cira', 'select username from public.clan_requests() order by username')).rows).toEqual([{ username: 'CLEO_C' }, { username: 'COCO_C' }]);
    await api('cira', `select public.clan_answer('CLEO_C', true)`);
    await api('cira', `select public.clan_answer('COCO_C', false)`);
    expect(await mine('cleo')).toMatchObject({ members: 2, me: 'miembro' });
    expect(await mine('coco')).toBeNull();
    expect((await api('coco', 'select * from public.my_clan_requests()')).rows).toEqual([]);
    // open: straight in
    await api('cira', `select public.clan_update(null, null, null, 'abierto')`);
    expect((await api('coco', 'select public.clan_request($1) as r', [id])).rows[0]).toEqual({ r: 'joined' });
    expect((await mine('coco'))?.members).toBe(3);
    await db.query('update public.clans set members = 20 where id = $1', [id]);
    await expect(api('cris', 'select public.clan_request($1)', [id])).rejects.toThrow(/clan_full/);
    await db.query('update public.clans set members = 3 where id = $1', [id]);
    await api('cira', `select public.clan_update(null, null, null, 'solicitud')`);
  });

  it('roles: the leader edits, names officers, hands over; officers answer requests and expel plain members only', async () => {
    await expect(api('cleo', `select public.clan_update('Nuevo Nombre')`)).rejects.toThrow(/not_leader/);
    await api('cira', `select public.clan_update('Rayos Del Sur', null, 'Royal_Academy')`);
    expect(await mine('coco')).toMatchObject({ name: 'Rayos Del Sur', kit: 'Royal_Academy', mode: 'solicitud' });
    await expect(api('cleo', `select public.clan_kick('COCO_C')`)).rejects.toThrow(/not_leader/);
    await api('cira', `select public.clan_set_role('CLEO_C', 'oficial')`);
    expect(((await mine('cira'))?.roster as { username: string; role: string }[]).map((m) => m.role)).toEqual(['lider', 'oficial', 'miembro']);
    await expect(api('cleo', `select public.clan_kick('CIRA_C')`)).rejects.toThrow(/not_leader/);
    await expect(api('cleo', `select public.clan_set_role('COCO_C', 'oficial')`)).rejects.toThrow(/not_leader/);
    expect((await api('cleo', `select public.clan_kick('COCO_C') as k`)).rows[0]).toEqual({ k: true });
    expect(await mine('coco')).toBeNull();
    // hand over and back
    await api('cira', `select public.clan_set_role('CLEO_C', 'lider')`);
    expect(await mine('cira')).toMatchObject({ me: 'oficial' });
    expect(await mine('cleo')).toMatchObject({ me: 'lider' });
    await api('cleo', `select public.clan_set_role('CIRA_C', 'lider')`);
    expect(await mine('cira')).toMatchObject({ me: 'lider' });
    // a second clan to leave and dissolve: the leader's heir is the officer
    await api('cris', `select public.clan_create('Los Breves')`);
    await api('cris', `select public.clan_update(null, null, null, 'abierto')`);
    const b = ((await api('cuca', `select id from public.clan_search('Los Breves')`)).rows[0] as { id: number }).id;
    await api('cuca', 'select public.clan_request($1)', [b]);
    await api('cris', 'select public.clan_leave()');
    expect(await mine('cuca')).toMatchObject({ me: 'lider', members: 1 });
    await api('cuca', 'select public.clan_leave()');
    expect((await db.query(`select count(*)::int as n from public.clans where name = 'Los Breves'`)).rows[0]).toEqual({ n: 0 });
    await expect(api('cira', 'select * from public.clan_requests r join public.clans c on true')).rejects.toThrow();
  });

  it('clan games: 1 match a day per player, points add up, duplicates refused', async () => {
    const a = await run('cira', 'r1');
    expect(a.points).toBeGreaterThan(0);
    expect(a.left).toBe(0);
    await expect(run('cira', 'r1')).rejects.toThrow(/duplicate/);
    await expect(run('cira', 'r2')).rejects.toThrow(/clan_daily_limit/);
    expect((await mine('cira'))?.runsToday).toBe(1);
    // two more of Cira's matches from earlier days of this week (the mission test below counts them)
    await db.query(`insert into public.clan_runs (clan_id, user_id, run_id, day, week, points, kills, victory) select clan_id, user_id, x.id, day - 1, week, points, kills, victory from public.clan_runs, (values ('r2'), ('r3')) x(id) where run_id = 'r1'`);
    await run('cleo', 'c1', 50, false);
    const c = await mine('cira');
    expect(c?.runsToday).toBe(1);
    expect(Number(c?.weekPoints)).toBe(a.points * 3 + (await db.query(`select points from public.clan_runs where run_id = 'c1'`)).rows.map((r) => (r as { points: number }).points)[0]);
    expect(c?.pos).toBe(1);
    await expect(run('coco', 'x1')).rejects.toThrow(/not_in_clan/);
    // the ranking is public
    expect(((await api('', 'select name from public.clan_ranking()')).rows[0] as { name: string }).name).toBe('Rayos Del Sur');
  });

  it('missions: done ones pay once, only to those who played', async () => {
    await expect(api('cleo', `select public.clan_claim_mission('partidas')`)).rejects.toThrow(/mission_not_done/);
    await db.query(`update public.clan_runs set kills = 12000 where run_id in ('r1', 'r2', 'r3')`);
    const got = (await api('cira', `select public.clan_claim_mission('rivales') as r`)).rows[0] as { r: { coins: number; tokens: number } };
    expect(got.r).toEqual({ coins: 12000, tokens: 60 });
    // 1-a-day missions: days played this week and members who won (Cira today and yesterday; Cleo lost)
    const ms = (await mine('cira'))?.missions as { id: string; progress: number }[];
    expect(Number(ms.find((x) => x.id === 'constancia')?.progress)).toBe(2);
    expect(Number(ms.find((x) => x.id === 'ganadores')?.progress)).toBe(1);
    await expect(api('cira', `select public.clan_claim_mission('rivales')`)).rejects.toThrow(/already_claimed/);
    await api('cata', `select public.clan_request(id) from public.clan_search('Rayos Del')`);
    await api('cira', `select public.clan_answer('CATA_C', true)`);
    await expect(api('cata', `select public.clan_claim_mission('rivales')`)).rejects.toThrow(/play_first/);
  });

  it('weekly prizes: the closed week ranks the clans, each player takes his tier once; the economy cap counts it', async () => {
    // a rival clan with more points, both weeks moved to last week
    await api('celia', `select public.clan_create('Tormenta Azul')`);
    await api('celia', `select public.clan_submit_run('t1', 4000, 900, 20000000, 'X', true)`);
    await db.query(`update public.clan_runs set week = week - 7, day = day - 7`);
    const p = (await api('cleo', 'select week, clan, pos, tier, coins, tokens from public.clan_claim_prizes()')).rows as { clan: string; pos: number; tier: string; coins: number; tokens: number }[];
    expect(p).toEqual([expect.objectContaining({ clan: 'Rayos Del Sur', pos: 2, tier: 'top3', coins: 50000, tokens: 300 })]);
    expect((await api('cleo', 'select * from public.clan_claim_prizes()')).rows).toEqual([]);
    expect((await api('celia', 'select tier from public.clan_claim_prizes()')).rows).toEqual([{ tier: 'top1' }]);
    expect((await api('cata', 'select * from public.clan_claim_prizes()')).rows).toEqual([]); // did not play
    expect(((await api('', 'select name, tier from public.clan_last_week()')).rows)).toEqual([{ name: 'Tormenta Azul', tier: 'top1' }, { name: 'Rayos Del Sur', tier: 'top3' }]);
    const cap = (await db.query(`select private.economy_cap('{"coins": 1000000, "tokens": 100000}'::jsonb, '{"coins": 0, "tokens": 0}'::jsonb, now() - interval '1 hour', $1) as c`, [ids.celia])).rows[0] as { c: { coins: number; tokens: number } };
    expect(cap.c).toEqual({ coins: 132000, tokens: 3500 }); // 16.000 + 16.000/h and 2.000 + 1.000/h, plus the TOP 1 prize
  });

  it('the ranking shows the clan of each player (anyone can read it)', async () => {
    const r = (await api('', `select username, clan from public.clan_of(array['cira_c', 'CLEO_C', 'COCO_C', 'Nadie']) order by username`)).rows;
    expect(r).toEqual([{ username: 'CIRA_C', clan: 'Rayos Del Sur' }, { username: 'CLEO_C', clan: 'Rayos Del Sur' }]);
  });
  it('2.01: anyone reads a clan card by name or id (members, points, record), no user ids', async () => {
    const c = ((await api('', `select public.clan_info(null, 'rayos del sur') as c`)).rows[0] as { c: Record<string, unknown> & { roster: Record<string, unknown>[] } }).c;
    expect(c).toMatchObject({ name: 'Rayos Del Sur', members: 3, leader: 'CIRA_C', pos: null, lastWeek: { pos: 2, tier: 'top3' }, bestPos: 2, titles: 0 }); // its runs were moved to last week above
    expect(Number(c.totalPoints)).toBeGreaterThan(0);
    expect(c.roster.map((m) => m.username)).toEqual(['CIRA_C', 'CLEO_C', 'CATA_C']);
    expect(Number(c.roster[0].total)).toBeGreaterThan(0);
    expect(JSON.stringify(c)).not.toContain(ids.cira);
    const byId = ((await api('cleo', `select public.clan_info($1) as c`, [c.id])).rows[0] as { c: { name: string } }).c;
    expect(byId.name).toBe('Rayos Del Sur');
    expect(((await api('', `select public.clan_info(null, 'No Existe') as c`)).rows[0] as { c: unknown }).c).toBeNull();
  });
  it('the admin renames or dissolves a clan', async () => {
    await expect(api('cira', `select public.admin_clan('Rayos Del Sur', 'Hackeado')`)).rejects.toThrow(/forbidden/);
    await api('carla', `select public.admin_clan('Rayos Del Sur', 'Clan Renombrado')`);
    expect(await mine('cira')).toMatchObject({ name: 'Clan Renombrado' });
    await api('carla', `select public.admin_clan('Clan Renombrado', null, true)`);
    expect(await mine('cira')).toBeNull();
  });
});
