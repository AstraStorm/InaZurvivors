-- GENERADO: concatenación de supabase/migrations/*.sql en orden (lo que tiene el proyecto real). No editar a mano:
-- añade una migración nueva y regenera este archivo.

-- ===== 20261031000000_inazurivors_init.sql
-- Migración inicial reproducible (idéntica a supabase/schema.sql). Aplicar con `supabase db push` o en el SQL Editor.
-- InaZurivors online: accounts (Supabase Auth, email), permanent unique usernames, the global ranking and the cloud save.
-- Security model: the browser only holds the PUBLIC anon/publishable key. The browser never touches a table: every read
-- and write goes through the functions below (PostgREST /rpc), which act as the caller (auth.uid()). Tables keep row
-- level security as a second wall. Emails live in auth.users only and no function returns them.
-- Supabase grants anon/authenticated every table privilege and EXECUTE on new functions in `public` by default, so the
-- end of this file takes those back explicitly and grants only what the game calls.

create schema if not exists extensions;
create extension if not exists citext with schema extensions;
create schema if not exists private; -- not exposed by the Data API

-- the signed-in, non-anonymous account calling a function, or an error
create or replace function private.real_user() returns uuid language plpgsql stable set search_path = '' as $$
declare uid uuid := auth.uid();
begin
  if uid is null or coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;
  return uid;
end $$;

-- ---------------------------------------------------------------- profiles: one permanent, unique username per account
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username extensions.citext not null,
  avatar text not null default '',
  crest text not null default '',
  created_at timestamptz not null default now(),
  constraint username_format check (username::text ~ '^[A-Za-z0-9_]{3,20}$')
);
-- the uniqueness that matters: Astra, ASTRA and astra are one name (citext compares case-insensitively)
create unique index if not exists profiles_username_key on public.profiles (username);

alter table public.profiles enable row level security;
drop policy if exists profiles_read on public.profiles;
create policy profiles_read on public.profiles for select to anon, authenticated using (true); -- names are public
-- no insert/update/delete policies: only reserve_username() writes, and nobody can rename

-- usernames can never change, even for the service role by mistake
create or replace function public.forbid_rename() returns trigger language plpgsql set search_path = '' as $$
begin
  if new.username is distinct from old.username then
    raise exception 'username_permanent' using errcode = '42501';
  end if;
  return new;
end $$;
drop trigger if exists profiles_no_rename on public.profiles;
create trigger profiles_no_rename before update on public.profiles for each row execute function public.forbid_rename();

-- informative check while typing (the final word is reserve_username)
create or replace function public.username_available(name text) returns boolean language sql stable security definer set search_path = public, extensions as $$
  select trim(name) ~ '^[A-Za-z0-9_]{3,20}$' and not exists (select 1 from public.profiles where username = trim(name)::citext);
$$;

-- atomic reservation: the unique index decides between two simultaneous requests; one wins, the other gets 'taken'
create or replace function public.reserve_username(name text, avatar text default '', crest text default '') returns text
language plpgsql security definer set search_path = public, extensions as $$
declare uid uuid := private.real_user(); clean text := trim(name);
begin
  if clean !~ '^[A-Za-z0-9_]{3,20}$' then raise exception 'invalid_username' using errcode = '22023'; end if;
  if exists (select 1 from public.profiles where id = uid) then raise exception 'already_has_username' using errcode = '23505'; end if;
  begin
    insert into public.profiles (id, username, avatar, crest) values (uid, clean, left(coalesce(avatar, ''), 64), left(coalesce(crest, ''), 64));
  exception when unique_violation then
    raise exception 'taken' using errcode = '23505';
  end;
  return clean;
end $$;

-- ---------------------------------------------------------------- scores: best mark per player and board
create table if not exists public.scores (
  user_id uuid not null references public.profiles (id) on delete cascade,
  map text not null,
  rank text not null check (rank in ('C', 'B', 'A', 'S', 'X')),
  time_sec integer not null check (time_sec >= 0),
  damage bigint not null check (damage >= 0),
  captain_id integer not null default 0,
  run_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (user_id, map, rank)
);
create table if not exists public.submitted_runs (run_id uuid primary key, user_id uuid not null, at timestamptz not null default now());
create index if not exists submitted_runs_user_at on public.submitted_runs (user_id, at desc); -- anti-spam lookup

alter table public.scores enable row level security;
alter table public.submitted_runs enable row level security; -- no policies: only the functions touch it
drop policy if exists scores_read on public.scores;
create policy scores_read on public.scores for select to anon, authenticated using (true);
-- no write policies: submit_score() is the only way in

-- Plausibility limits (basic, NOT tamper-proof: the game runs on the client; an authoritative ranking would need the
-- server to replay or validate whole runs). Values are generous upper bounds of the real game.
create or replace function public.submit_score(p_run_id uuid, p_map text, p_rank text, p_time_sec integer, p_damage bigint, p_captain_id integer default 0)
returns text language plpgsql security definer set search_path = public, extensions as $$
declare uid uuid := private.real_user();
begin
  if not exists (select 1 from public.profiles where id = uid) then raise exception 'no_username' using errcode = '42501'; end if;
  if p_rank not in ('C', 'B', 'A', 'S', 'X') or p_map !~ '^[a-z0-9_-]{1,32}$' then raise exception 'invalid_board' using errcode = '22023'; end if;
  if p_time_sec < 0 or p_time_sec > 4 * 3600 then raise exception 'implausible_time' using errcode = '22023'; end if;
  if p_damage < 0 or p_damage > (p_time_sec + 1)::bigint * 200000 then raise exception 'implausible_damage' using errcode = '22023'; end if;
  -- anti-spam: one submission per account every 20 seconds (a real run lasts minutes)
  if exists (select 1 from public.submitted_runs r where r.user_id = uid and r.at > now() - interval '20 seconds') then
    raise exception 'too_fast' using errcode = '54000';
  end if;
  -- the same run can only count once (reloading the results screen sends the same run id)
  insert into public.submitted_runs (run_id, user_id) values (p_run_id, uid) on conflict do nothing;
  if not found then return 'duplicate'; end if;
  insert into public.scores as s (user_id, map, rank, time_sec, damage, captain_id, run_id)
    values (uid, p_map, p_rank, p_time_sec, p_damage, p_captain_id, p_run_id)
  on conflict (user_id, map, rank) do update
    set time_sec = excluded.time_sec, damage = excluded.damage, captain_id = excluded.captain_id, run_id = excluded.run_id, created_at = now()
    where (excluded.time_sec, excluded.damage) > (s.time_sec, s.damage);
  return 'ok';
end $$;

-- ---------------------------------------------------------------- ranking: positions are computed here, not in the browser
-- Order: time survived, then damage. Each player appears once per query (their best row for the filter).
-- Internal and unlimited; the public functions below cap and filter it. Account ids never leave the database.
create or replace function private.board(p_map text, p_rank text, p_order text)
returns table (pos bigint, user_id uuid, username extensions.citext, avatar text, crest text, map text, rank text, time_sec integer, damage bigint, captain_id integer)
language sql stable set search_path = public, extensions as $$
  with best as (
    select distinct on (s.user_id) s.*
    from public.scores s
    where (p_map is null or s.map = p_map) and (p_rank is null or s.rank = p_rank)
    order by s.user_id, case when p_order = 'damage' then s.damage else s.time_sec end desc, s.damage desc, s.time_sec desc
  ), ranked as (
    select row_number() over (order by case when p_order = 'damage' then b.damage else b.time_sec end desc,
                                      case when p_order = 'damage' then b.time_sec else b.damage end desc, b.created_at) as pos, b.*
    from best b
  )
  select r.pos, r.user_id, p.username, p.avatar, p.crest, r.map, r.rank, r.time_sec, r.damage, r.captain_id
  from ranked r join public.profiles p on p.id = r.user_id
  order by r.pos;
$$;

-- the top of a board (at most 100 rows per call, so the API can't dump the whole table)
create or replace function public.leaderboard(p_map text default null, p_rank text default null, p_order text default 'time', p_limit integer default 15)
returns table (pos bigint, username extensions.citext, avatar text, crest text, map text, rank text, time_sec integer, damage bigint, captain_id integer)
language sql stable security definer set search_path = public, extensions as $$
  select b.pos, b.username, b.avatar, b.crest, b.map, b.rank, b.time_sec, b.damage, b.captain_id
  from private.board(p_map, p_rank, p_order) b
  where b.pos <= least(greatest(coalesce(p_limit, 15), 1), 100)
  order by b.pos;
$$;

-- the caller's own position for the same filter, however far down it is
create or replace function public.my_position(p_map text default null, p_rank text default null, p_order text default 'time')
returns table (pos bigint, username extensions.citext, avatar text, crest text, map text, rank text, time_sec integer, damage bigint, captain_id integer)
language sql stable security definer set search_path = public, extensions as $$
  select b.pos, b.username, b.avatar, b.crest, b.map, b.rank, b.time_sec, b.damage, b.captain_id
  from private.board(p_map, p_rank, p_order) b where b.user_id = auth.uid();
$$;

-- ---------------------------------------------------------------- cloud save: one JSON per account
create table if not exists public.saves (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null,
  version integer not null default 0,
  updated_at timestamptz not null default now()
);
alter table public.saves enable row level security;
drop policy if exists saves_own on public.saves;
-- read-only even for the owner: writes must go through put_save (version lock, size and rate limits)
create policy saves_own on public.saves for select to authenticated using (user_id = (select auth.uid()));

-- optimistic lock: a device can only overwrite the version it last read, so a stale tab can't wipe newer progress
create or replace function public.put_save(p_data jsonb, p_expected integer) returns integer
language plpgsql security definer set search_path = public, extensions as $$
declare uid uuid := private.real_user(); v integer;
begin
  if octet_length(p_data::text) > 2000000 then raise exception 'save_too_large' using errcode = '54000'; end if;
  if exists (select 1 from public.saves s where s.user_id = uid and s.updated_at > now() - interval '2 seconds') then
    raise exception 'too_fast' using errcode = '54000';
  end if;
  insert into public.saves (user_id, data, version) values (uid, p_data, 1)
  on conflict (user_id) do update set data = excluded.data, version = public.saves.version + 1, updated_at = now()
    where public.saves.version = p_expected
  returning version into v;
  if v is null then raise exception 'version_conflict' using errcode = '40001'; end if;
  return v;
end $$;

create or replace function public.get_save() returns table (data jsonb, version integer, updated_at timestamptz)
language sql stable security definer set search_path = public, extensions as $$
  select s.data, s.version, s.updated_at from public.saves s where s.user_id = auth.uid();
$$;

-- account deletion (GDPR): removes the auth user; profiles, scores and saves go with it (on delete cascade)
create or replace function public.delete_my_account() returns void language plpgsql security definer set search_path = public, auth as $$
declare uid uuid := private.real_user();
begin
  delete from public.submitted_runs where user_id = uid;
  delete from auth.users where id = uid;
end $$;

-- ---------------------------------------------------------------- privileges: only what the game calls
revoke all on table public.profiles, public.scores, public.submitted_runs, public.saves from anon, authenticated;
revoke all on schema private from public, anon, authenticated;
revoke execute on function private.real_user(), private.board(text, text, text), public.forbid_rename(),
  public.username_available(text), public.reserve_username(text, text, text), public.submit_score(uuid, text, text, integer, bigint, integer),
  public.leaderboard(text, text, text, integer), public.my_position(text, text, text), public.put_save(jsonb, integer),
  public.get_save(), public.delete_my_account() from public, anon, authenticated;
grant execute on function public.username_available(text), public.leaderboard(text, text, text, integer) to anon, authenticated;
grant execute on function public.reserve_username(text, text, text), public.submit_score(uuid, text, text, integer, bigint, integer),
  public.my_position(text, text, text), public.put_save(jsonb, integer), public.get_save(), public.delete_my_account() to authenticated;

-- ===== 20261031000100_definer_out_of_api.sql
-- The privileged (SECURITY DEFINER) bodies move to the `private` schema, which the Data API does not expose; `public`
-- keeps the same functions as thin SECURITY INVOKER wrappers, so the game's /rpc calls don't change. Each private
-- function still checks the caller itself (private.real_user / auth.uid()).

create or replace function private.username_available(name text) returns boolean language sql stable security definer set search_path = public, extensions as $$
  select trim(name) ~ '^[A-Za-z0-9_]{3,20}$' and not exists (select 1 from public.profiles where username = trim(name)::citext);
$$;

create or replace function private.reserve_username(name text, avatar text, crest text) returns text
language plpgsql security definer set search_path = public, extensions as $$
declare uid uuid := private.real_user(); clean text := trim(name);
begin
  if clean !~ '^[A-Za-z0-9_]{3,20}$' then raise exception 'invalid_username' using errcode = '22023'; end if;
  if exists (select 1 from public.profiles where id = uid) then raise exception 'already_has_username' using errcode = '23505'; end if;
  begin
    insert into public.profiles (id, username, avatar, crest) values (uid, clean, left(coalesce(avatar, ''), 64), left(coalesce(crest, ''), 64));
  exception when unique_violation then
    raise exception 'taken' using errcode = '23505';
  end;
  return clean;
end $$;

create or replace function private.submit_score(p_run_id uuid, p_map text, p_rank text, p_time_sec integer, p_damage bigint, p_captain_id integer)
returns text language plpgsql security definer set search_path = public, extensions as $$
declare uid uuid := private.real_user();
begin
  if not exists (select 1 from public.profiles where id = uid) then raise exception 'no_username' using errcode = '42501'; end if;
  if p_rank not in ('C', 'B', 'A', 'S', 'X') or p_map !~ '^[a-z0-9_-]{1,32}$' then raise exception 'invalid_board' using errcode = '22023'; end if;
  if p_time_sec < 0 or p_time_sec > 4 * 3600 then raise exception 'implausible_time' using errcode = '22023'; end if;
  if p_damage < 0 or p_damage > (p_time_sec + 1)::bigint * 200000 then raise exception 'implausible_damage' using errcode = '22023'; end if;
  if exists (select 1 from public.submitted_runs r where r.user_id = uid and r.at > now() - interval '20 seconds') then
    raise exception 'too_fast' using errcode = '54000';
  end if;
  insert into public.submitted_runs (run_id, user_id) values (p_run_id, uid) on conflict do nothing;
  if not found then return 'duplicate'; end if;
  insert into public.scores as s (user_id, map, rank, time_sec, damage, captain_id, run_id)
    values (uid, p_map, p_rank, p_time_sec, p_damage, coalesce(p_captain_id, 0), p_run_id)
  on conflict (user_id, map, rank) do update
    set time_sec = excluded.time_sec, damage = excluded.damage, captain_id = excluded.captain_id, run_id = excluded.run_id, created_at = now()
    where (excluded.time_sec, excluded.damage) > (s.time_sec, s.damage);
  return 'ok';
end $$;

create or replace function private.leaderboard(p_map text, p_rank text, p_order text, p_limit integer)
returns table (pos bigint, username extensions.citext, avatar text, crest text, map text, rank text, time_sec integer, damage bigint, captain_id integer)
language sql stable security definer set search_path = public, extensions as $$
  select b.pos, b.username, b.avatar, b.crest, b.map, b.rank, b.time_sec, b.damage, b.captain_id
  from private.board(p_map, p_rank, p_order) b
  where b.pos <= least(greatest(coalesce(p_limit, 15), 1), 100)
  order by b.pos;
$$;

create or replace function private.my_position(p_map text, p_rank text, p_order text)
returns table (pos bigint, username extensions.citext, avatar text, crest text, map text, rank text, time_sec integer, damage bigint, captain_id integer)
language sql stable security definer set search_path = public, extensions as $$
  select b.pos, b.username, b.avatar, b.crest, b.map, b.rank, b.time_sec, b.damage, b.captain_id
  from private.board(p_map, p_rank, p_order) b where b.user_id = auth.uid();
$$;

create or replace function private.put_save(p_data jsonb, p_expected integer) returns integer
language plpgsql security definer set search_path = public, extensions as $$
declare uid uuid := private.real_user(); v integer;
begin
  if octet_length(p_data::text) > 2000000 then raise exception 'save_too_large' using errcode = '54000'; end if;
  if exists (select 1 from public.saves s where s.user_id = uid and s.updated_at > now() - interval '2 seconds') then
    raise exception 'too_fast' using errcode = '54000';
  end if;
  insert into public.saves (user_id, data, version) values (uid, p_data, 1)
  on conflict (user_id) do update set data = excluded.data, version = public.saves.version + 1, updated_at = now()
    where public.saves.version = p_expected
  returning version into v;
  if v is null then raise exception 'version_conflict' using errcode = '40001'; end if;
  return v;
end $$;

create or replace function private.get_save() returns table (data jsonb, version integer, updated_at timestamptz)
language sql stable security definer set search_path = public, extensions as $$
  select s.data, s.version, s.updated_at from public.saves s where s.user_id = auth.uid();
$$;

create or replace function private.delete_my_account() returns void language plpgsql security definer set search_path = public, auth as $$
declare uid uuid := private.real_user();
begin
  delete from public.submitted_runs where user_id = uid;
  delete from auth.users where id = uid;
end $$;

-- public API: same names and arguments as before, now SECURITY INVOKER
create or replace function public.username_available(name text) returns boolean language sql stable security invoker set search_path = '' as $$
  select private.username_available(name);
$$;
create or replace function public.reserve_username(name text, avatar text default '', crest text default '') returns text language sql security invoker set search_path = '' as $$
  select private.reserve_username(name, avatar, crest);
$$;
create or replace function public.submit_score(p_run_id uuid, p_map text, p_rank text, p_time_sec integer, p_damage bigint, p_captain_id integer default 0)
returns text language sql security invoker set search_path = '' as $$
  select private.submit_score(p_run_id, p_map, p_rank, p_time_sec, p_damage, p_captain_id);
$$;
create or replace function public.leaderboard(p_map text default null, p_rank text default null, p_order text default 'time', p_limit integer default 15)
returns table (pos bigint, username extensions.citext, avatar text, crest text, map text, rank text, time_sec integer, damage bigint, captain_id integer)
language sql stable security invoker set search_path = '' as $$
  select * from private.leaderboard(p_map, p_rank, p_order, p_limit);
$$;
create or replace function public.my_position(p_map text default null, p_rank text default null, p_order text default 'time')
returns table (pos bigint, username extensions.citext, avatar text, crest text, map text, rank text, time_sec integer, damage bigint, captain_id integer)
language sql stable security invoker set search_path = '' as $$
  select * from private.my_position(p_map, p_rank, p_order);
$$;
create or replace function public.put_save(p_data jsonb, p_expected integer) returns integer language sql security invoker set search_path = '' as $$
  select private.put_save(p_data, p_expected);
$$;
create or replace function public.get_save() returns table (data jsonb, version integer, updated_at timestamptz) language sql stable security invoker set search_path = '' as $$
  select * from private.get_save();
$$;
create or replace function public.delete_my_account() returns void language sql security invoker set search_path = '' as $$
  select private.delete_my_account();
$$;

-- privileges: the API roles may reach `private` only through the public wrappers they are granted
revoke execute on function private.username_available(text), private.reserve_username(text, text, text),
  private.submit_score(uuid, text, text, integer, bigint, integer), private.leaderboard(text, text, text, integer),
  private.my_position(text, text, text), private.put_save(jsonb, integer), private.get_save(), private.delete_my_account()
  from public, anon, authenticated;
revoke execute on function public.username_available(text), public.reserve_username(text, text, text),
  public.submit_score(uuid, text, text, integer, bigint, integer), public.leaderboard(text, text, text, integer),
  public.my_position(text, text, text), public.put_save(jsonb, integer), public.get_save(), public.delete_my_account()
  from public, anon, authenticated;
grant usage on schema private to anon, authenticated;
grant execute on function private.username_available(text), private.leaderboard(text, text, text, integer),
  public.username_available(text), public.leaderboard(text, text, text, integer) to anon, authenticated;
grant execute on function private.reserve_username(text, text, text), private.submit_score(uuid, text, text, integer, bigint, integer),
  private.my_position(text, text, text), private.put_save(jsonb, integer), private.get_save(), private.delete_my_account(),
  public.reserve_username(text, text, text), public.submit_score(uuid, text, text, integer, bigint, integer),
  public.my_position(text, text, text), public.put_save(jsonb, integer), public.get_save(), public.delete_my_account() to authenticated;

-- ===== 20261031000200_my_profile.sql
-- Google is the only sign-in: the game needs to know whether the account opening it already has a global name
-- (returning player: load the cloud progress) or not (first connection: profile creation and name reservation).
-- Read-only, the caller's own row only. Tables, policies and the other functions are unchanged.

create or replace function private.my_profile() returns table (username extensions.citext, avatar text, crest text)
language sql stable security definer set search_path = public, extensions as $$
  select p.username, p.avatar, p.crest from public.profiles p where p.id = auth.uid();
$$;

create or replace function public.my_profile() returns table (username extensions.citext, avatar text, crest text)
language sql stable security invoker set search_path = '' as $$
  select * from private.my_profile();
$$;

revoke execute on function private.my_profile(), public.my_profile() from public, anon, authenticated;
grant execute on function private.my_profile(), public.my_profile() to authenticated;

-- ===== 20261031000300_reset_progress.sql
-- «Reiniciar progreso»: the account, its Google identity and its global name stay; the game progress starts again.
-- Every reset first copies the old save and ranking marks to private.progress_backups (not reachable from the API), so
-- the author can restore them by hand. The save JSON carries `progressEpoch`: a reset raises it, and put_save refuses
-- any copy from an older epoch, so an old browser can never write the pre-reset progress back over the new one.

create table if not exists private.progress_backups (
  id bigint generated always as identity primary key,
  user_id uuid not null,
  username text not null,
  save_data jsonb,
  save_version integer,
  scores jsonb not null default '[]',
  reason text not null,
  created_at timestamptz not null default now()
);
create index if not exists progress_backups_user on private.progress_backups (user_id, created_at desc);
alter table private.progress_backups enable row level security; -- no policies: only the owner (postgres) reads it
revoke all on table private.progress_backups from public, anon, authenticated;

-- the epoch of a save JSON (0 before any reset)
create or replace function private.save_epoch(p jsonb) returns integer language sql immutable set search_path = '' as $$
  select case when jsonb_typeof(p -> 'progressEpoch') = 'number' then (p ->> 'progressEpoch')::integer else 0 end;
$$;

-- put_save, same as before plus the epoch rule (raised as 'progress_reset' so the game reloads the new progress)
create or replace function private.put_save(p_data jsonb, p_expected integer) returns integer
language plpgsql security definer set search_path = public, extensions as $$
declare uid uuid := private.real_user(); v integer; cur_epoch integer;
begin
  if octet_length(p_data::text) > 2000000 then raise exception 'save_too_large' using errcode = '54000'; end if;
  if exists (select 1 from public.saves s where s.user_id = uid and s.updated_at > now() - interval '2 seconds') then
    raise exception 'too_fast' using errcode = '54000';
  end if;
  select private.save_epoch(s.data) into cur_epoch from public.saves s where s.user_id = uid;
  if cur_epoch is not null and private.save_epoch(p_data) < cur_epoch then
    raise exception 'progress_reset' using errcode = '40001';
  end if;
  insert into public.saves (user_id, data, version) values (uid, p_data, 1)
  on conflict (user_id) do update set data = excluded.data, version = public.saves.version + 1, updated_at = now()
    where public.saves.version = p_expected
  returning version into v;
  if v is null then raise exception 'version_conflict' using errcode = '40001'; end if;
  return v;
end $$;

-- Starts the caller's progress again: backup, new save (epoch + 1, version + 1), the caller's ranking marks removed.
-- p_data is the fresh save the game built; the account, profile and username are not touched.
create or replace function private.reset_my_progress(p_data jsonb) returns table (version integer, epoch integer)
language plpgsql security definer set search_path = public, extensions as $$
declare uid uuid := private.real_user(); name text; old public.saves; new_epoch integer; new_version integer;
begin
  select p.username::text into name from public.profiles p where p.id = uid;
  if name is null then raise exception 'no_username' using errcode = '42501'; end if;
  if octet_length(p_data::text) > 2000000 then raise exception 'save_too_large' using errcode = '54000'; end if;
  if exists (select 1 from private.progress_backups b where b.user_id = uid and b.reason = 'reset' and b.created_at > now() - interval '30 seconds') then
    raise exception 'too_fast' using errcode = '54000';
  end if;
  select * into old from public.saves s where s.user_id = uid for update;
  insert into private.progress_backups (user_id, username, save_data, save_version, scores, reason)
  values (uid, name, old.data, old.version,
          coalesce((select jsonb_agg(to_jsonb(sc) - 'user_id') from public.scores sc where sc.user_id = uid), '[]'), 'reset');
  new_epoch := coalesce(private.save_epoch(old.data), 0) + 1;
  insert into public.saves as s (user_id, data, version) values (uid, jsonb_set(p_data, '{progressEpoch}', to_jsonb(new_epoch)), 1)
  on conflict (user_id) do update set data = excluded.data, version = s.version + 1, updated_at = now()
  returning s.version into new_version;
  delete from public.scores where user_id = uid;
  delete from public.submitted_runs where user_id = uid;
  return query select new_version, new_epoch;
end $$;

create or replace function public.reset_my_progress(p_data jsonb) returns table (version integer, epoch integer)
language sql security invoker set search_path = '' as $$
  select * from private.reset_my_progress(p_data);
$$;

revoke execute on function private.save_epoch(jsonb), private.reset_my_progress(jsonb), public.reset_my_progress(jsonb) from public, anon, authenticated;
grant execute on function private.reset_my_progress(jsonb), public.reset_my_progress(jsonb) to authenticated;

-- ===== 20261101000000_bug_reports.sql
-- «Reportar un bug»: reports from signed-in players, a private screenshot bucket and an admin panel.
-- Same model as the rest: the API roles never touch the table; every read and write goes through functions that check
-- the caller. Admins are listed by account id in private.admins (never by username, which anybody can see).

create table if not exists private.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  note text not null default '',
  created_at timestamptz not null default now()
);
alter table private.admins enable row level security;
revoke all on table private.admins from public, anon, authenticated;

create or replace function private.is_admin() returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from private.admins a where a.user_id = auth.uid())
    and not coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false);
$$;

create table if not exists public.bug_reports (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  user_id uuid not null references auth.users (id) on delete cascade,
  client_id uuid not null,
  username text,
  category text not null check (category in ('gameplay', 'interfaz', 'graficos', 'gacha', 'guardado', 'online', 'rendimiento', 'otro')),
  severity text not null check (severity in ('baja', 'media', 'alta', 'critica')),
  title text not null check (char_length(title) between 4 and 120),
  description text not null check (char_length(description) between 10 and 4000),
  steps text not null default '' check (char_length(steps) <= 4000),
  game_version text not null default '' check (char_length(game_version) <= 32),
  build text not null default '' check (char_length(build) <= 32),
  browser text not null default '' check (char_length(browser) <= 120),
  os text not null default '' check (char_length(os) <= 80),
  screen text not null default '' check (char_length(screen) <= 40),
  map text not null default '' check (char_length(map) <= 40),
  difficulty text not null default '' check (char_length(difficulty) <= 4),
  run_time_sec integer check (run_time_sec between 0 and 86400),
  screenshot_path text check (char_length(screenshot_path) <= 200),
  status text not null default 'nuevo' check (status in ('nuevo', 'revisando', 'corregido', 'descartado')),
  admin_notes text not null default '' check (char_length(admin_notes) <= 4000),
  notified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, client_id) -- the same form sent twice is one report
);
create index if not exists bug_reports_user_created on public.bug_reports (user_id, created_at desc);
create index if not exists bug_reports_created on public.bug_reports (created_at desc);
alter table public.bug_reports enable row level security;
drop policy if exists bug_reports_own_or_admin on public.bug_reports;
create policy bug_reports_own_or_admin on public.bug_reports for select to authenticated
  using (user_id = (select auth.uid()) or (select private.is_admin()));
revoke all on table public.bug_reports from anon, authenticated;

-- ---------------------------------------------------------------- screenshots: private bucket, one folder per account
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('bug-screenshots', 'bug-screenshots', false, 2097152, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists bug_shots_insert_own on storage.objects;
create policy bug_shots_insert_own on storage.objects for insert to authenticated
  with check (
    bucket_id = 'bug-screenshots'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and not coalesce(((select auth.jwt()) ->> 'is_anonymous')::boolean, false)
    -- at most 10 uploads per account per day
    and (select count(*) from storage.objects o where o.bucket_id = 'bug-screenshots' and o.owner_id = (select auth.uid())::text
         and o.created_at > now() - interval '1 day') < 10
  );
drop policy if exists bug_shots_read_own_or_admin on storage.objects;
create policy bug_shots_read_own_or_admin on storage.objects for select to authenticated
  using (bucket_id = 'bug-screenshots' and ((storage.foldername(name))[1] = (select auth.uid())::text or (select private.is_admin())));
drop policy if exists bug_shots_delete_own_or_admin on storage.objects;
create policy bug_shots_delete_own_or_admin on storage.objects for delete to authenticated
  using (bucket_id = 'bug-screenshots' and ((storage.foldername(name))[1] = (select auth.uid())::text or (select private.is_admin())));

-- ---------------------------------------------------------------- player functions
-- Sends a report; the same client_id twice returns the first code (no duplicates). Limits: one every 60 s, 10 a day.
create or replace function private.submit_bug_report(p_client_id uuid, p_category text, p_severity text, p_title text, p_description text,
  p_steps text, p_meta jsonb, p_screenshot text) returns text
language plpgsql security definer set search_path = public, extensions as $$
declare uid uuid := private.real_user(); existing text; new_code text; uname text;
begin
  select code into existing from public.bug_reports where user_id = uid and client_id = p_client_id;
  if existing is not null then return existing; end if;
  if exists (select 1 from public.bug_reports where user_id = uid and created_at > now() - interval '60 seconds') then
    raise exception 'too_fast' using errcode = '54000';
  end if;
  if (select count(*) from public.bug_reports where user_id = uid and created_at > now() - interval '1 day') >= 10 then
    raise exception 'daily_limit' using errcode = '54000';
  end if;
  if p_screenshot is not null and (
       p_screenshot !~ ('^' || uid::text || '/[A-Za-z0-9-]{8,64}\.(png|jpg|webp)$')
       or not exists (select 1 from storage.objects o where o.bucket_id = 'bug-screenshots' and o.name = p_screenshot)) then
    raise exception 'invalid_screenshot' using errcode = '22023';
  end if;
  select username::text into uname from public.profiles where id = uid;
  new_code := 'BUG-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
  insert into public.bug_reports (code, user_id, client_id, username, category, severity, title, description, steps,
    game_version, build, browser, os, screen, map, difficulty, run_time_sec, screenshot_path)
  values (new_code, uid, p_client_id, uname, p_category, p_severity, trim(p_title), trim(p_description), trim(coalesce(p_steps, '')),
    left(coalesce(p_meta ->> 'version', ''), 32), left(coalesce(p_meta ->> 'build', ''), 32), left(coalesce(p_meta ->> 'browser', ''), 120),
    left(coalesce(p_meta ->> 'os', ''), 80), left(coalesce(p_meta ->> 'screen', ''), 40), left(coalesce(p_meta ->> 'map', ''), 40),
    left(coalesce(p_meta ->> 'difficulty', ''), 4),
    case when jsonb_typeof(p_meta -> 'runTimeSec') = 'number' then least(greatest((p_meta ->> 'runTimeSec')::numeric, 0), 86400)::integer end,
    p_screenshot);
  return new_code;
end $$;

-- the caller's own reports (no private notes)
create or replace function private.my_bug_reports() returns table (code text, category text, severity text, title text, status text, created_at timestamptz, has_screenshot boolean)
language sql stable security definer set search_path = public as $$
  select b.code, b.category, b.severity, b.title, b.status, b.created_at, b.screenshot_path is not null
  from public.bug_reports b where b.user_id = auth.uid() order by b.created_at desc limit 50;
$$;

-- deletes the caller's reports; returns the screenshot paths so the game removes the files through the Storage API
create or replace function private.delete_my_bug_reports() returns setof text
language plpgsql security definer set search_path = public as $$
declare uid uuid := private.real_user();
begin
  return query delete from public.bug_reports b where b.user_id = uid returning b.screenshot_path;
end $$;

-- the Edge Function claims a report once to send its notice (an owner can't trigger it twice)
create or replace function private.claim_bug_notification(p_code text) returns table (code text, category text, severity text, title text, description text, username text, game_version text, created_at timestamptz)
language sql security definer set search_path = public as $$
  update public.bug_reports b set notified_at = now()
  where b.code = p_code and b.user_id = auth.uid() and b.notified_at is null
  returning b.code, b.category, b.severity, b.title, b.description, b.username, b.game_version, b.created_at;
$$;

create or replace function private.am_i_admin() returns boolean language sql stable security definer set search_path = '' as $$
  select private.is_admin();
$$;

-- ---------------------------------------------------------------- admin functions (refuse anyone not in private.admins)
create or replace function private.admin_bug_reports(p_category text, p_severity text, p_status text, p_from timestamptz, p_to timestamptz, p_order text, p_limit integer)
returns setof public.bug_reports language plpgsql stable security definer set search_path = public as $$
begin
  if not private.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  return query select * from public.bug_reports b
    where (p_category is null or b.category = p_category) and (p_severity is null or b.severity = p_severity)
      and (p_status is null or b.status = p_status) and (p_from is null or b.created_at >= p_from) and (p_to is null or b.created_at < p_to)
    order by case when p_order = 'prioridad' then array_position(array['critica', 'alta', 'media', 'baja'], b.severity) end nulls last,
             b.created_at desc
    limit least(greatest(coalesce(p_limit, 100), 1), 500);
end $$;

create or replace function private.admin_update_bug(p_code text, p_status text, p_notes text) returns timestamptz
language plpgsql security definer set search_path = public as $$
declare t timestamptz;
begin
  if not private.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  update public.bug_reports set status = coalesce(p_status, status), admin_notes = coalesce(p_notes, admin_notes), updated_at = now()
  where code = p_code returning updated_at into t;
  if t is null then raise exception 'not_found' using errcode = 'P0002'; end if;
  return t;
end $$;

-- ---------------------------------------------------------------- public API: invoker wrappers
create or replace function public.submit_bug_report(p_client_id uuid, p_category text, p_severity text, p_title text, p_description text,
  p_steps text default '', p_meta jsonb default '{}', p_screenshot text default null) returns text
language sql security invoker set search_path = '' as $$
  select private.submit_bug_report(p_client_id, p_category, p_severity, p_title, p_description, p_steps, p_meta, p_screenshot);
$$;
create or replace function public.my_bug_reports() returns table (code text, category text, severity text, title text, status text, created_at timestamptz, has_screenshot boolean)
language sql stable security invoker set search_path = '' as $$ select * from private.my_bug_reports(); $$;
create or replace function public.delete_my_bug_reports() returns setof text language sql security invoker set search_path = '' as $$ select * from private.delete_my_bug_reports(); $$;
create or replace function public.claim_bug_notification(p_code text) returns table (code text, category text, severity text, title text, description text, username text, game_version text, created_at timestamptz)
language sql security invoker set search_path = '' as $$ select * from private.claim_bug_notification(p_code); $$;
create or replace function public.am_i_admin() returns boolean language sql stable security invoker set search_path = '' as $$ select private.am_i_admin(); $$;
create or replace function public.admin_bug_reports(p_category text default null, p_severity text default null, p_status text default null,
  p_from timestamptz default null, p_to timestamptz default null, p_order text default 'fecha', p_limit integer default 100)
returns setof public.bug_reports language sql stable security invoker set search_path = '' as $$
  select * from private.admin_bug_reports(p_category, p_severity, p_status, p_from, p_to, p_order, p_limit);
$$;
create or replace function public.admin_update_bug(p_code text, p_status text default null, p_notes text default null) returns timestamptz
language sql security invoker set search_path = '' as $$ select private.admin_update_bug(p_code, p_status, p_notes); $$;

revoke execute on function private.is_admin(), private.submit_bug_report(uuid, text, text, text, text, text, jsonb, text), private.my_bug_reports(),
  private.delete_my_bug_reports(), private.claim_bug_notification(text), private.am_i_admin(),
  private.admin_bug_reports(text, text, text, timestamptz, timestamptz, text, integer), private.admin_update_bug(text, text, text),
  public.submit_bug_report(uuid, text, text, text, text, text, jsonb, text), public.my_bug_reports(), public.delete_my_bug_reports(),
  public.claim_bug_notification(text), public.am_i_admin(), public.admin_bug_reports(text, text, text, timestamptz, timestamptz, text, integer),
  public.admin_update_bug(text, text, text) from public, anon, authenticated;
-- is_admin() is used inside policies, so the signed-in role may run it (it only ever answers about the caller)
grant execute on function private.is_admin(), private.submit_bug_report(uuid, text, text, text, text, text, jsonb, text), private.my_bug_reports(),
  private.delete_my_bug_reports(), private.claim_bug_notification(text), private.am_i_admin(),
  private.admin_bug_reports(text, text, text, timestamptz, timestamptz, text, integer), private.admin_update_bug(text, text, text),
  public.submit_bug_report(uuid, text, text, text, text, text, jsonb, text), public.my_bug_reports(), public.delete_my_bug_reports(),
  public.claim_bug_notification(text), public.am_i_admin(), public.admin_bug_reports(text, text, text, timestamptz, timestamptz, text, integer),
  public.admin_update_bug(text, text, text) to authenticated;

-- ===== 20261101000100_bug_shots_limit.sql
-- The upload limit counted storage.objects from inside a policy on storage.objects, which Postgres rejects as a recursive
-- policy (Storage answered 503 on every upload). The count now lives in a private function that doesn't go through RLS.
create or replace function private.shots_today() returns bigint language sql stable security definer set search_path = '' as $$
  select count(*) from storage.objects o
  where o.bucket_id = 'bug-screenshots' and o.owner_id = (select auth.uid())::text and o.created_at > now() - interval '1 day';
$$;
revoke execute on function private.shots_today() from public, anon, authenticated;
grant execute on function private.shots_today() to authenticated;

drop policy if exists bug_shots_insert_own on storage.objects;
create policy bug_shots_insert_own on storage.objects for insert to authenticated
  with check (
    bucket_id = 'bug-screenshots'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and not coalesce(((select auth.jwt()) ->> 'is_anonymous')::boolean, false)
    and (select private.shots_today()) < 10 -- at most 10 uploads per account per day
  );

-- ===== 20261101000200_server_now.sql
-- Fix 1.11: server clock for the daily shop and the weekly pass. Read-only, no table access; callable by anon so guests
-- with a connection also rotate on the server's day. The browser can't read the Date header (CORS), hence the RPC.
create or replace function public.server_now()
returns timestamptz
language sql
stable
set search_path = ''
as $$ select now() $$;

revoke all on function public.server_now() from public;
grant execute on function public.server_now() to anon, authenticated;

-- ===== 20261102000000_promo_codes.sql
-- Fix 1.12: promotional codes. The API roles never touch the tables; redeem_code() checks the caller, records the
-- redemption atomically (one row per account and code, primary key) and decides the reward on the server, so a code
-- can't be redeemed twice from two devices or by replaying the request. New codes are rows of private.promo_codes.

create table if not exists private.promo_codes (
  code text primary key check (code = upper(code) and char_length(code) between 3 and 32),
  rewards jsonb not null, -- {"tokens": n, "coins": n, "legendary_pool": [ids]}
  active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table private.promo_codes enable row level security;
revoke all on table private.promo_codes from public, anon, authenticated;

create table if not exists private.promo_redemptions (
  user_id uuid not null references auth.users (id) on delete cascade,
  code text not null references private.promo_codes (code),
  result jsonb not null,
  created_at timestamptz not null default now(),
  primary key (user_id, code)
);
alter table private.promo_redemptions enable row level security;
revoke all on table private.promo_redemptions from public, anon, authenticated;

-- ASTRA17: welcome gift. 72 fichas (a ×10 pull), 500 coins and one random Legendario of the 1.12 roster
insert into private.promo_codes (code, rewards) values ('ASTRA17', jsonb_build_object('tokens', 72, 'coins', 500,
  'legendary_pool', jsonb_build_array(1,2,3,10,29,1024,1370,1371,1382,1384,1405,1513,1532,1541,1542,1548,1567,1589,100248,100293,100382,100405,100438,100468,100475,100487,100494,100510,100519,100538,100540,100544,100562,100577,100580,100717,100728,100739,100797,100844,100905,100907,100979,101308,101488,101504,101505,101558,101572,101710,101719,101722,101775,101791,101838,101855,101871,102015,102117,102130,102185,102205,102307)))
on conflict (code) do nothing;

-- p_already_applied: a guest who redeemed on this device and now signs in; the account is marked as redeemed and gets
-- nothing more (the reward is already in the save). Answers: status ok | used | linked, and the reward when ok.
create or replace function private.redeem_code(p_code text, p_already_applied boolean) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare uid uuid := private.real_user(); c record; pool jsonb; pick integer; res jsonb; inserted integer;
begin
  select * into c from private.promo_codes where code = upper(trim(p_code)) and active;
  if not found then return jsonb_build_object('status', 'invalid'); end if;
  if p_already_applied then
    insert into private.promo_redemptions (user_id, code, result) values (uid, c.code, jsonb_build_object('guest', true))
    on conflict do nothing;
    get diagnostics inserted = row_count;
    return jsonb_build_object('status', case when inserted = 1 then 'linked' else 'used' end);
  end if;
  pool := c.rewards -> 'legendary_pool';
  pick := case when jsonb_array_length(coalesce(pool, '[]')) > 0 then (pool ->> floor(random() * jsonb_array_length(pool))::integer)::integer end;
  res := jsonb_build_object('tokens', coalesce((c.rewards ->> 'tokens')::integer, 0), 'coins', coalesce((c.rewards ->> 'coins')::integer, 0), 'player', pick);
  insert into private.promo_redemptions (user_id, code, result) values (uid, c.code, res) on conflict do nothing;
  get diagnostics inserted = row_count;
  if inserted = 0 then return jsonb_build_object('status', 'used'); end if;
  return jsonb_build_object('status', 'ok', 'reward', res);
end $$;

create or replace function public.redeem_code(p_code text, p_already_applied boolean default false) returns jsonb
language sql security invoker set search_path = '' as $$ select private.redeem_code(p_code, p_already_applied); $$;

revoke execute on function private.redeem_code(text, boolean), public.redeem_code(text, boolean) from public, anon, authenticated;
grant execute on function private.redeem_code(text, boolean), public.redeem_code(text, boolean) to authenticated;

-- ===== 20261102000200_save_economy_guard.sql
-- Fix 1.23: the cloud save no longer takes any amount of fichas or coins. The game runs in the browser, so a save can be
-- edited before it is sent (console, storage, a forged backup); the server now limits how much each currency can GROW
-- between two writes to what can be earned in the real time that has passed (generous: several hours of play), plus
-- what promo codes gave on the server in that time. Spending is never limited. The extra is cut, not refused, so an
-- honest player never loses a write; a cheated amount just never reaches the account or another device.

create or replace function private.economy_cap(p_new jsonb, p_old jsonb, p_since timestamptz, p_uid uuid) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  hours numeric := greatest(0, extract(epoch from (now() - coalesce(p_since, now()))) / 3600);
  promo_t numeric := 0; promo_c numeric := 0;
  old_t numeric; old_c numeric; new_t numeric; new_c numeric; max_t numeric; max_c numeric;
  out jsonb := p_new;
begin
  -- promo codes redeemed on the server since the last write (only where the promo codes migration is applied)
  if to_regclass('private.promo_redemptions') is not null then
    execute 'select coalesce(sum((r.result ->> ''tokens'')::numeric), 0), coalesce(sum((r.result ->> ''coins'')::numeric), 0)
      from private.promo_redemptions r where r.user_id = $1 and r.created_at > coalesce($2, ''-infinity''::timestamptz)'
      into promo_t, promo_c using p_uid, p_since;
  end if;
  new_t := case when jsonb_typeof(p_new -> 'tokens') = 'number' then (p_new ->> 'tokens')::numeric else 0 end;
  new_c := case when jsonb_typeof(p_new -> 'coins') = 'number' then (p_new ->> 'coins')::numeric else 0 end;
  if p_old is null then
    -- first copy of an account (a guest's progress being linked): generous fixed ceilings
    max_t := 5000 + promo_t; max_c := 60000 + promo_c;
  else
    old_t := case when jsonb_typeof(p_old -> 'tokens') = 'number' then greatest(0, (p_old ->> 'tokens')::numeric) else 0 end;
    old_c := case when jsonb_typeof(p_old -> 'coins') = 'number' then greatest(0, (p_old ->> 'coins')::numeric) else 0 end;
    -- a base (one weekly pass day, rewards claimed together) plus what hours of play can give
    max_t := old_t + 2000 + 1000 * hours + promo_t;
    max_c := old_c + 8000 + 8000 * hours + promo_c;
  end if;
  if new_t > max_t then out := jsonb_set(out, '{tokens}', to_jsonb(floor(max_t)::bigint)); end if;
  if new_c > max_c then out := jsonb_set(out, '{coins}', to_jsonb(floor(max_c)::bigint)); end if;
  return out;
end $$;
revoke all on function private.economy_cap(jsonb, jsonb, timestamptz, uuid) from public, anon, authenticated;

-- put_save as before (size, rate, epoch, version lock) with the economy cap applied to what is stored
create or replace function private.put_save(p_data jsonb, p_expected integer) returns integer
language plpgsql security definer set search_path = public, extensions as $$
declare uid uuid := private.real_user(); v integer; cur_epoch integer; old_data jsonb; old_at timestamptz;
begin
  if octet_length(p_data::text) > 2000000 then raise exception 'save_too_large' using errcode = '54000'; end if;
  if exists (select 1 from public.saves s where s.user_id = uid and s.updated_at > now() - interval '2 seconds') then
    raise exception 'too_fast' using errcode = '54000';
  end if;
  select s.data, s.updated_at, private.save_epoch(s.data) into old_data, old_at, cur_epoch from public.saves s where s.user_id = uid;
  if cur_epoch is not null and private.save_epoch(p_data) < cur_epoch then
    raise exception 'progress_reset' using errcode = '40001';
  end if;
  p_data := private.economy_cap(p_data, old_data, old_at, uid);
  insert into public.saves (user_id, data, version) values (uid, p_data, 1)
  on conflict (user_id) do update set data = excluded.data, version = public.saves.version + 1, updated_at = now()
    where public.saves.version = p_expected
  returning version into v;
  if v is null then raise exception 'version_conflict' using errcode = '40001'; end if;
  return v;
end $$;

-- the welcome code stays one ×10 pull at the new price (10 per pull, 100 the ×10)
do $$ begin
  if to_regclass('private.promo_codes') is not null then
    update private.promo_codes set rewards = jsonb_set(rewards, '{tokens}', '100') where code = 'ASTRA17';
  end if;
end $$;

-- ===== 20261102000300_ranking_score.sql
-- Fix 1.31: the ranking goes by POINTS (rank first, then time and damage), and can still be ordered by time, damage or rank.
--   points = (time_sec * 10 + sqrt(damage) * 2) * rank multiplier (C 1, B 1.6, A 2.4, S 3.4, X 4.8)
-- The square root keeps endless-mode damage (tens of millions) from burying everything else; the multiplier makes the
-- rank the most important part: an average X run beats the best C run. Same formula in src/systems/leaderboard.ts.

create or replace function private.score_of(p_rank text, p_time_sec integer, p_damage bigint) returns bigint
language sql immutable set search_path = '' as $$
  select round((greatest(p_time_sec, 0) * 10 + sqrt(greatest(p_damage, 0)::numeric) * 2)
    * case p_rank when 'X' then 4.8 when 'S' then 3.4 when 'A' then 2.4 when 'B' then 1.6 else 1 end)::bigint;
$$;

-- a board keeps each player's best mark by points (before: best time, then damage)
create or replace function private.submit_score(p_run_id uuid, p_map text, p_rank text, p_time_sec integer, p_damage bigint, p_captain_id integer)
returns text language plpgsql security definer set search_path = public, extensions as $$
declare uid uuid := private.real_user();
begin
  if not exists (select 1 from public.profiles where id = uid) then raise exception 'no_username' using errcode = '42501'; end if;
  if p_rank not in ('C', 'B', 'A', 'S', 'X') or p_map !~ '^[a-z0-9_-]{1,32}$' then raise exception 'invalid_board' using errcode = '22023'; end if;
  if p_time_sec < 0 or p_time_sec > 4 * 3600 then raise exception 'implausible_time' using errcode = '22023'; end if;
  if p_damage < 0 or p_damage > (p_time_sec + 1)::bigint * 200000 then raise exception 'implausible_damage' using errcode = '22023'; end if;
  if exists (select 1 from public.submitted_runs r where r.user_id = uid and r.at > now() - interval '20 seconds') then
    raise exception 'too_fast' using errcode = '54000';
  end if;
  insert into public.submitted_runs (run_id, user_id) values (p_run_id, uid) on conflict do nothing;
  if not found then return 'duplicate'; end if;
  insert into public.scores as s (user_id, map, rank, time_sec, damage, captain_id, run_id)
    values (uid, p_map, p_rank, p_time_sec, p_damage, coalesce(p_captain_id, 0), p_run_id)
  on conflict (user_id, map, rank) do update
    set time_sec = excluded.time_sec, damage = excluded.damage, captain_id = excluded.captain_id, run_id = excluded.run_id, created_at = now()
    where (private.score_of(excluded.rank, excluded.time_sec, excluded.damage), excluded.time_sec, excluded.damage)
        > (private.score_of(s.rank, s.time_sec, s.damage), s.time_sec, s.damage);
  return 'ok';
end $$;

-- the return types change (new `score` column): drop and recreate the board and its readers
drop function if exists public.leaderboard(text, text, text, integer);
drop function if exists public.my_position(text, text, text);
drop function if exists private.leaderboard(text, text, text, integer);
drop function if exists private.my_position(text, text, text);
drop function if exists private.board(text, text, text);

-- p_order: 'score' (default), 'time', 'damage' or 'rank' (highest rank first, then points)
create function private.board(p_map text, p_rank text, p_order text)
returns table (pos bigint, user_id uuid, username extensions.citext, avatar text, crest text, map text, rank text, time_sec integer, damage bigint, captain_id integer, score bigint)
language sql stable set search_path = public, extensions as $$
  with marks as (
    select s.*, private.score_of(s.rank, s.time_sec, s.damage) as score, array_position(array['C', 'B', 'A', 'S', 'X'], s.rank) as tier,
      case coalesce(p_order, 'score')
        when 'time' then s.time_sec::numeric
        when 'damage' then s.damage::numeric
        when 'rank' then array_position(array['C', 'B', 'A', 'S', 'X'], s.rank)::numeric * 1e15 + private.score_of(s.rank, s.time_sec, s.damage)
        else private.score_of(s.rank, s.time_sec, s.damage)::numeric end as k
    from public.scores s
    where (p_map is null or s.map = p_map) and (p_rank is null or s.rank = p_rank)
  ), best as (
    select distinct on (m.user_id) m.* from marks m order by m.user_id, m.k desc, m.score desc, m.created_at
  ), ranked as (
    select row_number() over (order by b.k desc, b.score desc, b.created_at) as pos, b.* from best b
  )
  select r.pos, r.user_id, p.username, p.avatar, p.crest, r.map, r.rank, r.time_sec, r.damage, r.captain_id, r.score
  from ranked r join public.profiles p on p.id = r.user_id
  order by r.pos;
$$;

create function private.leaderboard(p_map text, p_rank text, p_order text, p_limit integer)
returns table (pos bigint, username extensions.citext, avatar text, crest text, map text, rank text, time_sec integer, damage bigint, captain_id integer, score bigint)
language sql stable security definer set search_path = public, extensions as $$
  select b.pos, b.username, b.avatar, b.crest, b.map, b.rank, b.time_sec, b.damage, b.captain_id, b.score
  from private.board(p_map, p_rank, p_order) b
  where b.pos <= least(greatest(coalesce(p_limit, 15), 1), 100)
  order by b.pos;
$$;

create function private.my_position(p_map text, p_rank text, p_order text)
returns table (pos bigint, username extensions.citext, avatar text, crest text, map text, rank text, time_sec integer, damage bigint, captain_id integer, score bigint)
language sql stable security definer set search_path = public, extensions as $$
  select b.pos, b.username, b.avatar, b.crest, b.map, b.rank, b.time_sec, b.damage, b.captain_id, b.score
  from private.board(p_map, p_rank, p_order) b where b.user_id = auth.uid();
$$;

create function public.leaderboard(p_map text default null, p_rank text default null, p_order text default 'score', p_limit integer default 15)
returns table (pos bigint, username extensions.citext, avatar text, crest text, map text, rank text, time_sec integer, damage bigint, captain_id integer, score bigint)
language sql stable security invoker set search_path = '' as $$
  select * from private.leaderboard(p_map, p_rank, p_order, p_limit);
$$;

create function public.my_position(p_map text default null, p_rank text default null, p_order text default 'score')
returns table (pos bigint, username extensions.citext, avatar text, crest text, map text, rank text, time_sec integer, damage bigint, captain_id integer, score bigint)
language sql stable security invoker set search_path = '' as $$
  select * from private.my_position(p_map, p_rank, p_order);
$$;

-- privileges as before: the board itself and the score formula stay out of the API; the readers keep their grants
revoke execute on function private.board(text, text, text), private.score_of(text, integer, bigint),
  private.leaderboard(text, text, text, integer), private.my_position(text, text, text),
  public.leaderboard(text, text, text, integer), public.my_position(text, text, text)
  from public, anon, authenticated;
grant execute on function private.leaderboard(text, text, text, integer), public.leaderboard(text, text, text, integer) to anon, authenticated;
grant execute on function private.my_position(text, text, text), public.my_position(text, text, text) to authenticated;

-- ===== 20261103000000_request_timeouts.sql
-- Fix 1.32: a request can no longer wedge the database. On 2026-11-02 at 23:31 a cloud save got stuck in an open
-- (aborted) transaction while holding its row lock; every later request waited for that lock with no limit, the
-- connection pool filled up and everything else (rankings included) timed out with 504 «PGRST003».
--   * lock_timeout: a request waits at most 3 s for a lock, then fails (the game retries the save later).
--   * statement_timeout: no API call runs longer than 8 s.
--   * idle_in_transaction_session_timeout: a transaction left open and idle is closed after 10 s, releasing its locks.
-- PostgREST applies the settings of the role it switches to (anon / authenticated) on every request.

alter role authenticated set lock_timeout = '3s';
alter role authenticated set statement_timeout = '8s';
alter role authenticated set idle_in_transaction_session_timeout = '10s';
alter role anon set lock_timeout = '3s';
alter role anon set statement_timeout = '8s';
alter role anon set idle_in_transaction_session_timeout = '10s';

-- the save itself: never queue behind another save of the same player; a second one at the same time just fails
alter function private.put_save(jsonb, integer) set lock_timeout = '3s';
alter function private.submit_score(uuid, text, text, integer, bigint, integer) set lock_timeout = '3s';

notify pgrst, 'reload config';
