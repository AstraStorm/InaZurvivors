/**
 * The online migrations (supabase/migrations, in order: what the real project has) run for real on PGlite (PostgreSQL in WebAssembly). Supabase's auth schema is
 * stubbed: auth.uid() reads a session setting, so each "request" acts as one account.
 */
import fs from 'node:fs';
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
    await expect(as('astra', `select public.submit_score($1, 'raimon', 'C', 30, 99999999)`, [run(3)])).rejects.toThrow(/implausible_damage/);
    await expect(as('astra', `select public.submit_score($1, 'raimon', 'Z', 30, 10)`, [run(4)])).rejects.toThrow(/invalid_board/);
    await expect(db.query(`insert into public.scores values ($1, 'raimon', 'C', 9999, 1, 0, $2)`, [ids.beto, run(5)])).resolves.toBeTruthy(); // superuser in tests; RLS blocks clients
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
    await db.query('insert into private.admins (user_id) values ($1)', [ids.carla]);
    expect((await api('carla', `select public.am_i_admin() as a`)).rows[0]).toEqual({ a: true });
    // Fix 1.41: the players panel counts every account, and lists names without e-mails
    const st = (await api('carla', `select public.admin_player_stats(50) as s`)).rows[0] as { s: { accounts: number; players: Record<string, unknown>[] } };
    expect(st.s.accounts).toBe(((await db.query(`select count(*)::int as n from auth.users`)).rows[0] as { n: number }).n);
    expect(st.s.players.length).toBeGreaterThan(0);
    expect(JSON.stringify(st.s)).not.toMatch(/@example\.test/);
    const all = (await api('carla', `select code, severity from public.admin_bug_reports(null, null, null, null, null, 'prioridad', 100)`)).rows as { code: string }[];
    expect(all.length).toBeGreaterThanOrEqual(10);
    await api('carla', `select public.admin_update_bug($1, 'revisando', 'Reproducido en Chrome')`, [all[0].code]);
    expect((await api('beto', `select status from public.my_bug_reports() where code = $1`, [all[0].code])).rows[0]).toEqual({ status: 'revisando' });
    expect((await api('beto', `select * from public.my_bug_reports() limit 1`)).fields.map((f) => f.name)).not.toContain('admin_notes');
    expect((await api('carla', `select code from public.admin_bug_reports('gameplay', 'alta', 'revisando', now() - interval '1 day', now() + interval '1 day', 'fecha', 10)`)).rows).toEqual([{ code: all[0].code }]);
    // a guest (anonymous) session of an admin account is not an admin
    expect((await as('carla', `select public.am_i_admin() as a`, [], 'authenticated', '{"is_anonymous":true}')).rows[0]).toEqual({ a: false });
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
    expect(await coins('astra')).toMatchObject({ t: 5000, c: 60000 });
    await back('astra', '1 minute');
    await api('astra', `select public.put_save('{"tokens":5100,"coins":60300}'::jsonb, 1)`); // a normal run: untouched
    expect(await coins('astra')).toMatchObject({ t: 5100, c: 60300 });
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

  it('only a spare copy can be left: never the only one, a HÉROE, a Leyenda or an event footballer', async () => {
    await save('hugo', { owned: { 10: { copies: 1 }, 20: { copies: 3, spent: 1 }, 30: { copies: 4, hero: true }, 100234: { copies: 5 }, 900001: { copies: 3 } } });
    await expect(dep('hugo', 10, 20)).rejects.toThrow(/gts_no_spare/);
    await expect(dep('hugo', 30, 20)).rejects.toThrow(/gts_banned/);
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
