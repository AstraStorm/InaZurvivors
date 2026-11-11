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

-- ===== 20261103000100_admin_players.sql
-- Panel de jugadores (admin): how many accounts there are, how many play and who, for the author only.
-- Only signed-in players exist on the server; guests play locally and are not counted (nothing about them is sent).
-- Same shape as the bug panel: the body lives in `private` behind is_admin(), the public wrapper is an invoker.

create or replace function private.admin_player_stats(p_limit integer default 100) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare out jsonb;
begin
  if not private.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  with acc as (
    select u.id, u.created_at, u.last_sign_in_at, p.username, s.updated_at as saved_at,
      coalesce((s.data->'stats'->>'runs')::int, 0) as runs, coalesce((s.data->'stats'->>'kills')::bigint, 0) as kills,
      coalesce((s.data->'stats'->>'bestTimeSec')::int, 0) as best_time,
      (select count(*) from jsonb_object_keys(coalesce(s.data->'owned', '{}'::jsonb))) as owned,
      (select count(*) from public.submitted_runs r where r.user_id = u.id) as ranked_runs
    from auth.users u
    left join public.profiles p on p.id = u.id
    left join public.saves s on s.user_id = u.id
  )
  select jsonb_build_object(
    'accounts', (select count(*) from acc),
    'with_name', (select count(*) from acc where username is not null),
    'played', (select count(*) from acc where runs > 0),
    'runs', (select coalesce(sum(runs), 0) from acc),
    'kills', (select coalesce(sum(kills), 0) from acc),
    'ranked_runs', (select count(*) from public.submitted_runs),
    'active_24h', (select count(*) from acc where greatest(saved_at, last_sign_in_at) > now() - interval '24 hours'),
    'active_7d', (select count(*) from acc where greatest(saved_at, last_sign_in_at) > now() - interval '7 days'),
    'new_7d', (select count(*) from acc where created_at > now() - interval '7 days'),
    'players', coalesce((select jsonb_agg(row_to_json(x)) from (
      select username, created_at, greatest(saved_at, last_sign_in_at) as last_seen, runs, kills, best_time, owned, ranked_runs
      from acc order by greatest(saved_at, last_sign_in_at) desc nulls last
      limit least(greatest(coalesce(p_limit, 100), 1), 500)) x), '[]'::jsonb)
  ) into out;
  return out;
end $$;
alter function private.admin_player_stats(integer) set statement_timeout = '8s';

create or replace function public.admin_player_stats(p_limit integer default 100) returns jsonb
language sql stable security invoker set search_path = '' as $$ select private.admin_player_stats(p_limit); $$;

revoke execute on function private.admin_player_stats(integer), public.admin_player_stats(integer) from public, anon, authenticated;
grant execute on function private.admin_player_stats(integer), public.admin_player_stats(integer) to authenticated;

notify pgrst, 'reload schema';

-- ===== 20261103000200_public_profile.sql
-- v1.6 (author): anyone can open another player's profile from the ranking and see their club: name, icon, crest,
-- favourite team, a few totals and the squad they play with (ids, stars, HÉROE, ascension, Auras). Only players with a
-- reserved username exist here (guests never reach the server), and nothing private leaves the save: no email, no
-- currencies, no shop or mission state.

create or replace function private.public_profile(p_username text) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'username', p.username::text,
    'avatar', p.avatar,
    'crest', coalesce(nullif(s.data->>'crest', ''), p.crest),
    'joined', p.created_at::date,
    'favorite', coalesce(s.data->>'favoriteTeam', ''),
    'icon', coalesce(s.data->'profile'->'icon', 'null'::jsonb),
    'kit', coalesce(s.data->>'kit', ''),
    'captain', coalesce(s.data->'captainId', 'null'::jsonb),
    'stats', jsonb_build_object(
      'runs', coalesce((s.data->'stats'->>'runs')::int, 0),
      'wins', coalesce((s.data->'stats'->>'wins')::int, 0),
      'kills', coalesce((s.data->'stats'->>'kills')::bigint, 0),
      'bestTimeSec', coalesce((s.data->'stats'->>'bestTimeSec')::int, 0),
      'bestEndless', coalesce((s.data->'stats'->>'bestEndless')::int, 0)),
    'owned', (select count(*) from jsonb_object_keys(coalesce(s.data->'owned', '{}'::jsonb))),
    'heroes', (select count(*) from jsonb_each(coalesce(s.data->'owned', '{}'::jsonb)) o where (o.value->>'hero')::boolean),
    'squad', coalesce((select jsonb_agg(jsonb_build_object(
        'id', sq.id::int,
        'stars', coalesce((s.data->'owned'->sq.id->>'stars')::int, 0),
        'hero', coalesce((s.data->'owned'->sq.id->>'hero')::boolean, false),
        'heroStars', coalesce((s.data->'owned'->sq.id->>'heroStars')::int, 0),
        'ascRarity', s.data->'owned'->sq.id->>'ascRarity',
        'asc', coalesce((s.data->'owned'->sq.id->>'ascMitico')::boolean, false),
        'aura', s.data->'auras'->>sq.id) order by sq.n)
      from jsonb_array_elements_text(coalesce(s.data->'squad', '[]'::jsonb)) with ordinality as sq(id, n)
      where sq.n <= 7 and sq.id ~ '^[0-9]{1,9}$'), '[]'::jsonb),
    'marks', coalesce((select jsonb_agg(jsonb_build_object('map', m.map, 'rank', m.rank, 'time_sec', m.time_sec, 'damage', m.damage, 'captain_id', m.captain_id))
      from (select * from public.scores sc where sc.user_id = p.id
            order by array_position(array['X', 'S', 'A', 'B', 'C'], sc.rank), sc.time_sec desc limit 6) m), '[]'::jsonb)
  )
  from public.profiles p
  left join public.saves s on s.user_id = p.id
  where p.username = trim(p_username)::extensions.citext
$$;
alter function private.public_profile(text) set statement_timeout = '5s';

create or replace function public.public_profile(p_username text) returns jsonb
language sql stable security invoker set search_path = '' as $$ select private.public_profile(p_username); $$;

revoke execute on function private.public_profile(text), public.public_profile(text) from public;
grant execute on function private.public_profile(text), public.public_profile(text) to anon, authenticated;

notify pgrst, 'reload schema';

-- ===== 20261103000300_profile_banners.sql
-- v1.65 (author): profile banners. The banner a player shows lives in their save (data->'pennants'->>'equipped'); the
-- ranking asks for the banners of the names on screen, and the public profile includes it. Only the id of a known
-- shape (lowercase letters, digits and dashes) leaves the save; the game ignores ids it does not know.

create or replace function private.profile_banners(p_usernames text[]) returns table (username text, banner text)
language sql stable security definer set search_path = public as $$
  select p.username::text, s.data->'pennants'->>'equipped'
  from public.profiles p
  join public.saves s on s.user_id = p.id
  where p.username = any (select trim(u)::extensions.citext from unnest(p_usernames[1:60]) u)
    and coalesce(s.data->'pennants'->>'equipped', '') ~ '^[a-z0-9-]{1,32}$'
$$;
alter function private.profile_banners(text[]) set statement_timeout = '5s';

create or replace function public.profile_banners(p_usernames text[]) returns table (username text, banner text)
language sql stable security invoker set search_path = '' as $$ select * from private.profile_banners(p_usernames); $$;

revoke execute on function private.profile_banners(text[]), public.profile_banners(text[]) from public;
grant execute on function private.profile_banners(text[]), public.profile_banners(text[]) to anon, authenticated;

-- the public profile also carries the banner (same rule)
create or replace function private.public_profile(p_username text) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'username', p.username::text,
    'avatar', p.avatar,
    'crest', coalesce(nullif(s.data->>'crest', ''), p.crest),
    'joined', p.created_at::date,
    'favorite', coalesce(s.data->>'favoriteTeam', ''),
    'icon', coalesce(s.data->'profile'->'icon', 'null'::jsonb),
    'kit', coalesce(s.data->>'kit', ''),
    'captain', coalesce(s.data->'captainId', 'null'::jsonb),
    'banner', case when coalesce(s.data->'pennants'->>'equipped', '') ~ '^[a-z0-9-]{1,32}$' then s.data->'pennants'->>'equipped' end,
    'stats', jsonb_build_object(
      'runs', coalesce((s.data->'stats'->>'runs')::int, 0),
      'wins', coalesce((s.data->'stats'->>'wins')::int, 0),
      'kills', coalesce((s.data->'stats'->>'kills')::bigint, 0),
      'bestTimeSec', coalesce((s.data->'stats'->>'bestTimeSec')::int, 0),
      'bestEndless', coalesce((s.data->'stats'->>'bestEndless')::int, 0)),
    'owned', (select count(*) from jsonb_object_keys(coalesce(s.data->'owned', '{}'::jsonb))),
    'heroes', (select count(*) from jsonb_each(coalesce(s.data->'owned', '{}'::jsonb)) o where (o.value->>'hero')::boolean),
    'squad', coalesce((select jsonb_agg(jsonb_build_object(
        'id', sq.id::int,
        'stars', coalesce((s.data->'owned'->sq.id->>'stars')::int, 0),
        'hero', coalesce((s.data->'owned'->sq.id->>'hero')::boolean, false),
        'heroStars', coalesce((s.data->'owned'->sq.id->>'heroStars')::int, 0),
        'ascRarity', s.data->'owned'->sq.id->>'ascRarity',
        'asc', coalesce((s.data->'owned'->sq.id->>'ascMitico')::boolean, false),
        'aura', s.data->'auras'->>sq.id) order by sq.n)
      from jsonb_array_elements_text(coalesce(s.data->'squad', '[]'::jsonb)) with ordinality as sq(id, n)
      where sq.n <= 7 and sq.id ~ '^[0-9]{1,9}$'), '[]'::jsonb),
    'marks', coalesce((select jsonb_agg(jsonb_build_object('map', m.map, 'rank', m.rank, 'time_sec', m.time_sec, 'damage', m.damage, 'captain_id', m.captain_id))
      from (select * from public.scores sc where sc.user_id = p.id
            order by array_position(array['X', 'S', 'A', 'B', 'C'], sc.rank), sc.time_sec desc limit 6) m), '[]'::jsonb)
  )
  from public.profiles p
  left join public.saves s on s.user_id = p.id
  where p.username = trim(p_username)::extensions.citext
$$;

notify pgrst, 'reload schema';

-- ===== 20261103000400_profile_frames.sql
-- v1.65 (author): avatar frames. Same rule as the banners: the frame worn lives in the save (data->'pennants'->>'frame'),
-- the ranking asks for the frames of the names on screen and the public profile includes it. Read-only.

create or replace function private.profile_frames(p_usernames text[]) returns table (username text, frame text)
language sql stable security definer set search_path = public as $$
  select p.username::text, s.data->'pennants'->>'frame'
  from public.profiles p
  join public.saves s on s.user_id = p.id
  where p.username = any (select trim(u)::extensions.citext from unnest(p_usernames[1:60]) u)
    and coalesce(s.data->'pennants'->>'frame', '') ~ '^[a-z0-9-]{1,32}$'
$$;
alter function private.profile_frames(text[]) set statement_timeout = '5s';

create or replace function public.profile_frames(p_usernames text[]) returns table (username text, frame text)
language sql stable security invoker set search_path = '' as $$ select * from private.profile_frames(p_usernames); $$;

revoke execute on function private.profile_frames(text[]), public.profile_frames(text[]) from public;
grant execute on function private.profile_frames(text[]), public.profile_frames(text[]) to anon, authenticated;

-- the public profile also carries the frame
create or replace function private.public_profile(p_username text) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'username', p.username::text,
    'avatar', p.avatar,
    'crest', coalesce(nullif(s.data->>'crest', ''), p.crest),
    'joined', p.created_at::date,
    'favorite', coalesce(s.data->>'favoriteTeam', ''),
    'icon', coalesce(s.data->'profile'->'icon', 'null'::jsonb),
    'kit', coalesce(s.data->>'kit', ''),
    'captain', coalesce(s.data->'captainId', 'null'::jsonb),
    'banner', case when coalesce(s.data->'pennants'->>'equipped', '') ~ '^[a-z0-9-]{1,32}$' then s.data->'pennants'->>'equipped' end,
    'frame', case when coalesce(s.data->'pennants'->>'frame', '') ~ '^[a-z0-9-]{1,32}$' then s.data->'pennants'->>'frame' end,
    'stats', jsonb_build_object(
      'runs', coalesce((s.data->'stats'->>'runs')::int, 0),
      'wins', coalesce((s.data->'stats'->>'wins')::int, 0),
      'kills', coalesce((s.data->'stats'->>'kills')::bigint, 0),
      'bestTimeSec', coalesce((s.data->'stats'->>'bestTimeSec')::int, 0),
      'bestEndless', coalesce((s.data->'stats'->>'bestEndless')::int, 0)),
    'owned', (select count(*) from jsonb_object_keys(coalesce(s.data->'owned', '{}'::jsonb))),
    'heroes', (select count(*) from jsonb_each(coalesce(s.data->'owned', '{}'::jsonb)) o where (o.value->>'hero')::boolean),
    'squad', coalesce((select jsonb_agg(jsonb_build_object(
        'id', sq.id::int,
        'stars', coalesce((s.data->'owned'->sq.id->>'stars')::int, 0),
        'hero', coalesce((s.data->'owned'->sq.id->>'hero')::boolean, false),
        'heroStars', coalesce((s.data->'owned'->sq.id->>'heroStars')::int, 0),
        'ascRarity', s.data->'owned'->sq.id->>'ascRarity',
        'asc', coalesce((s.data->'owned'->sq.id->>'ascMitico')::boolean, false),
        'aura', s.data->'auras'->>sq.id) order by sq.n)
      from jsonb_array_elements_text(coalesce(s.data->'squad', '[]'::jsonb)) with ordinality as sq(id, n)
      where sq.n <= 7 and sq.id ~ '^[0-9]{1,9}$'), '[]'::jsonb),
    'marks', coalesce((select jsonb_agg(jsonb_build_object('map', m.map, 'rank', m.rank, 'time_sec', m.time_sec, 'damage', m.damage, 'captain_id', m.captain_id))
      from (select * from public.scores sc where sc.user_id = p.id
            order by array_position(array['X', 'S', 'A', 'B', 'C'], sc.rank), sc.time_sec desc limit 6) m), '[]'::jsonb)
  )
  from public.profiles p
  left join public.saves s on s.user_id = p.id
  where p.username = trim(p_username)::extensions.citext
$$;

notify pgrst, 'reload schema';

-- ===== 20261105000000_save_conflict_no_retry.sql
-- 1.7 outage fix: put_save raised version_conflict / progress_reset with SQLSTATE 40001 (serialization_failure).
-- PostgREST retries 40001 on its own, so a save with a stale version looped inside the API forever, each one holding a
-- pool connection: with a handful of such clients the pool was full and the ranking timed out (504) for everyone.
-- Same body as 20261102000200_save_economy_guard.sql; only the error code changes to P0001 (plain raise_exception,
-- HTTP 400, never retried). The game reads the message text (version_conflict, progress_reset), not the code.
create or replace function private.put_save(p_data jsonb, p_expected integer)
 returns integer
 language plpgsql
 security definer
 set search_path to 'public', 'extensions'
 set lock_timeout to '3s'
as $function$
declare uid uuid := private.real_user(); v integer; cur_epoch integer; old_data jsonb; old_at timestamptz;
begin
  if octet_length(p_data::text) > 2000000 then raise exception 'save_too_large' using errcode = '54000'; end if;
  if exists (select 1 from public.saves s where s.user_id = uid and s.updated_at > now() - interval '2 seconds') then
    raise exception 'too_fast' using errcode = '54000';
  end if;
  select s.data, s.updated_at, private.save_epoch(s.data) into old_data, old_at, cur_epoch from public.saves s where s.user_id = uid;
  if cur_epoch is not null and private.save_epoch(p_data) < cur_epoch then
    raise exception 'progress_reset' using errcode = 'P0001';
  end if;
  p_data := private.economy_cap(p_data, old_data, old_at, uid);
  insert into public.saves (user_id, data, version) values (uid, p_data, 1)
  on conflict (user_id) do update set data = excluded.data, version = public.saves.version + 1, updated_at = now()
    where public.saves.version = p_expected
  returning version into v;
  if v is null then raise exception 'version_conflict' using errcode = 'P0001'; end if;
  return v;
end $function$;

-- ===== 20261105000100_thanks_code.sql
-- 1.75 (author): Banner de agradecimiento. redeem_code also hands out Fichas de evento (rewards.event_tokens, answered as
-- reward.eventTokens, which only pay the Banner de agradecimiento), and the code GRACIAS: a free ×10 of that banner
-- (150 fichas de evento) and 10.000 coins. Same function as 20261102000000_promo_codes.sql otherwise.

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
  res := jsonb_build_object('tokens', coalesce((c.rewards ->> 'tokens')::integer, 0), 'coins', coalesce((c.rewards ->> 'coins')::integer, 0), 'player', pick,
    'eventTokens', coalesce((c.rewards ->> 'event_tokens')::integer, 0));
  insert into private.promo_redemptions (user_id, code, result) values (uid, c.code, res) on conflict do nothing;
  get diagnostics inserted = row_count;
  if inserted = 0 then return jsonb_build_object('status', 'used'); end if;
  return jsonb_build_object('status', 'ok', 'reward', res);
end $$;

revoke execute on function private.redeem_code(text, boolean) from public, anon, authenticated;
grant execute on function private.redeem_code(text, boolean) to authenticated;

insert into private.promo_codes (code, rewards) values ('GRACIAS', jsonb_build_object('tokens', 0, 'coins', 10000, 'event_tokens', 150))
on conflict (code) do nothing;

-- ===== 20261105000200_public_profile_full.sql
-- 1.76 (author): the profile opened from the ranking is the same player card as the own Perfil screen. It also needs the
-- number of pulls, the achievements claimed (mission ids without a period stamp, i.e. the logros) and the collection
-- (owned: copies, stars, ascension, HÉROE, training), from which the client works out the best footballer and his mean
-- exactly like on the own profile. Read-only; everything else as in 20261103000400_profile_frames.sql.

create or replace function private.public_profile(p_username text) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'username', p.username::text,
    'avatar', p.avatar,
    'crest', coalesce(nullif(s.data->>'crest', ''), p.crest),
    'joined', p.created_at::date,
    'favorite', coalesce(s.data->>'favoriteTeam', ''),
    'icon', coalesce(s.data->'profile'->'icon', 'null'::jsonb),
    'kit', coalesce(s.data->>'kit', ''),
    'captain', coalesce(s.data->'captainId', 'null'::jsonb),
    'banner', case when coalesce(s.data->'pennants'->>'equipped', '') ~ '^[a-z0-9-]{1,32}$' then s.data->'pennants'->>'equipped' end,
    'frame', case when coalesce(s.data->'pennants'->>'frame', '') ~ '^[a-z0-9-]{1,32}$' then s.data->'pennants'->>'frame' end,
    'stats', jsonb_build_object(
      'runs', coalesce((s.data->'stats'->>'runs')::int, 0),
      'wins', coalesce((s.data->'stats'->>'wins')::int, 0),
      'kills', coalesce((s.data->'stats'->>'kills')::bigint, 0),
      'bestTimeSec', coalesce((s.data->'stats'->>'bestTimeSec')::int, 0),
      'bestEndless', coalesce((s.data->'stats'->>'bestEndless')::int, 0),
      'pulls', coalesce((s.data->'stats'->>'pulls')::int, 0)),
    'owned', (select count(*) from jsonb_object_keys(coalesce(s.data->'owned', '{}'::jsonb))),
    'heroes', (select count(*) from jsonb_each(coalesce(s.data->'owned', '{}'::jsonb)) o where (o.value->>'hero')::boolean),
    'collection', coalesce((select jsonb_object_agg(o.key, jsonb_strip_nulls(jsonb_build_object(
        'stars', o.value->'stars', 'hero', o.value->'hero', 'heroStars', o.value->'heroStars',
        'ascMitico', o.value->'ascMitico', 'ascRarity', o.value->'ascRarity', 'train', o.value->'train')))
      from jsonb_each(case when jsonb_typeof(s.data->'owned') = 'object' then s.data->'owned' else '{}'::jsonb end) o
      where o.key ~ '^[0-9]{1,9}$' and jsonb_typeof(o.value) = 'object'), '{}'::jsonb),
    'achievements', coalesce((select jsonb_agg(c.v) from (
        select distinct c.v from jsonb_array_elements_text(case when jsonb_typeof(s.data->'missions'->'claimed') = 'array' then s.data->'missions'->'claimed' else '[]'::jsonb end) c(v)
        where c.v ~ '^[a-z0-9_-]{1,48}$' limit 500) c), '[]'::jsonb),
    'squad', coalesce((select jsonb_agg(jsonb_build_object(
        'id', sq.id::int,
        'stars', coalesce((s.data->'owned'->sq.id->>'stars')::int, 0),
        'hero', coalesce((s.data->'owned'->sq.id->>'hero')::boolean, false),
        'heroStars', coalesce((s.data->'owned'->sq.id->>'heroStars')::int, 0),
        'ascRarity', s.data->'owned'->sq.id->>'ascRarity',
        'asc', coalesce((s.data->'owned'->sq.id->>'ascMitico')::boolean, false),
        'aura', s.data->'auras'->>sq.id) order by sq.n)
      from jsonb_array_elements_text(coalesce(s.data->'squad', '[]'::jsonb)) with ordinality as sq(id, n)
      where sq.n <= 7 and sq.id ~ '^[0-9]{1,9}$'), '[]'::jsonb),
    'marks', coalesce((select jsonb_agg(jsonb_build_object('map', m.map, 'rank', m.rank, 'time_sec', m.time_sec, 'damage', m.damage, 'captain_id', m.captain_id))
      from (select * from public.scores sc where sc.user_id = p.id
            order by array_position(array['X', 'S', 'A', 'B', 'C'], sc.rank), sc.time_sec desc limit 6) m), '[]'::jsonb)
  )
  from public.profiles p
  left join public.saves s on s.user_id = p.id
  where p.username = trim(p_username)::extensions.citext
$$;

-- create or replace drops the settings of the function: the 5 s limit of 20261103000200 goes back on
alter function private.public_profile(text) set statement_timeout = '5s';

notify pgrst, 'reload schema';

-- ===== 20261106000000_gts.sql
-- 1.8 (author): the GTS, an online bank of footballers like Pokémon's Global Trade Station. A player leaves one spare copy
-- (never his only one) asking for another footballer in exchange; anyone who has a spare copy of the one asked for can take
-- the deposit at once, and the depositor collects what he got the next time he looks. Until then he can withdraw it.
--   * Leyenda, HÉROE and limited-event footballers can't be left (private.gts_banned + the HÉROE flag of the save).
--   * Deposit slots: 1, +1 per level of the «Ventanilla GTS» upgrade (save upgrades.gts), 5 at most.
--   * The same exchange can't be repeated: no two open deposits giving X for Y, and nobody repeats an exchange he already
--     made (private.gts_done, from both sides).
-- The server is the ledger. The client applies each movement to its own save once (save gts.applied: 'd:<id>' left,
-- 'w:<id>' withdrawn, 'r:<id>' received as depositor, 't:<id>' taken) and the spare checks discount what it has not
-- applied yet, so a stale cloud save can't leave the same copy twice.

create table if not exists private.gts_deposits (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  give_id integer not null check (give_id > 0),
  want_id integer not null check (want_id > 0 and want_id <> give_id),
  status text not null default 'open' check (status in ('open', 'traded', 'withdrawn')),
  taker_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  closed_at timestamptz
);
create index if not exists gts_open_give on private.gts_deposits (give_id) where status = 'open';
create index if not exists gts_user on private.gts_deposits (user_id, created_at desc);
create index if not exists gts_taker on private.gts_deposits (taker_id) where taker_id is not null;

create table if not exists private.gts_done (
  user_id uuid not null references auth.users (id) on delete cascade,
  give_id integer not null,
  want_id integer not null,
  primary key (user_id, give_id, want_id)
);

create table if not exists private.gts_banned (player_id integer primary key);
insert into private.gts_banned (player_id) values (1085), (100234), (100773), (900001), (900002), (900003), (900004), (900005), (900006), (900007), (900008)
on conflict do nothing;

alter table private.gts_deposits enable row level security;
alter table private.gts_done enable row level security;
alter table private.gts_banned enable row level security;
revoke all on private.gts_deposits, private.gts_done, private.gts_banned from public, anon, authenticated;

-- spare copies of a footballer in the cloud save, minus the ones the ledger already took and the client hasn't applied
create or replace function private.gts_spare(p_uid uuid, p_id integer) returns integer
language sql stable security definer set search_path = '' as $$
  with s as (select data from public.saves where user_id = p_uid),
  ap as (select coalesce((select array_agg(x) from s, jsonb_array_elements_text(case when jsonb_typeof(s.data->'gts'->'applied') = 'array' then s.data->'gts'->'applied' else '[]'::jsonb end) x), '{}'::text[]) a)
  select coalesce((select greatest(0, coalesce((s.data->'owned'->p_id::text->>'copies')::integer, 0) - 1 - coalesce((s.data->'owned'->p_id::text->>'spent')::integer, 0)) from s), 0)
    - (select count(*)::integer from private.gts_deposits d, ap where d.user_id = p_uid and d.give_id = p_id and not ('d:' || d.id) = any (ap.a))
    + (select count(*)::integer from private.gts_deposits d, ap where d.user_id = p_uid and d.give_id = p_id and d.status = 'withdrawn' and ('d:' || d.id) = any (ap.a) and not ('w:' || d.id) = any (ap.a))
    - (select count(*)::integer from private.gts_deposits d, ap where d.taker_id = p_uid and d.want_id = p_id and not ('t:' || d.id) = any (ap.a))
$$;

create or replace function private.gts_deposit(p_give integer, p_want integer) returns bigint
language plpgsql security definer set search_path = '' as $$
declare uid uuid := private.real_user(); sv jsonb; slots integer; open_n integer; new_id bigint;
begin
  if p_give is null or p_want is null or p_give = p_want or p_give <= 0 or p_want <= 0 then raise exception 'gts_invalid' using errcode = 'P0001'; end if;
  perform pg_advisory_xact_lock(hashtext('gts:' || uid::text));
  select data into sv from public.saves where user_id = uid;
  if sv is null then raise exception 'gts_no_save' using errcode = 'P0001'; end if;
  if exists (select 1 from private.gts_banned where player_id = p_give) or coalesce((sv->'owned'->p_give::text->>'hero')::boolean, false) then
    raise exception 'gts_banned' using errcode = 'P0001'; end if;
  if exists (select 1 from private.gts_banned where player_id = p_want) then raise exception 'gts_banned' using errcode = 'P0001'; end if;
  slots := least(5, 1 + greatest(0, coalesce((sv->'upgrades'->>'gts')::integer, 0)));
  select count(*) into open_n from private.gts_deposits where user_id = uid and status = 'open';
  if open_n >= slots then raise exception 'gts_slots' using errcode = 'P0001'; end if;
  if exists (select 1 from private.gts_deposits where user_id = uid and status = 'open' and give_id = p_give and want_id = p_want)
     or exists (select 1 from private.gts_done where user_id = uid and give_id = p_give and want_id = p_want) then
    raise exception 'gts_repeated' using errcode = 'P0001'; end if;
  if private.gts_spare(uid, p_give) < 1 then raise exception 'gts_no_spare' using errcode = 'P0001'; end if;
  insert into private.gts_deposits (user_id, give_id, want_id) values (uid, p_give, p_want) returning id into new_id;
  return new_id;
end $$;

create or replace function private.gts_withdraw(p_id bigint) returns boolean
language plpgsql security definer set search_path = '' as $$
declare uid uuid := private.real_user(); n integer;
begin
  update private.gts_deposits set status = 'withdrawn', closed_at = now() where id = p_id and user_id = uid and status = 'open';
  get diagnostics n = row_count;
  return n = 1;
end $$;

-- takes a deposit: the caller gives the footballer asked for and gets the one left. Exactly one taker wins.
create or replace function private.gts_take(p_id bigint) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare uid uuid := private.real_user(); d record;
begin
  perform pg_advisory_xact_lock(hashtext('gts:' || uid::text));
  select * into d from private.gts_deposits where id = p_id for update;
  if not found or d.status <> 'open' then raise exception 'gts_gone' using errcode = 'P0001'; end if;
  if d.user_id = uid then raise exception 'gts_own' using errcode = 'P0001'; end if;
  if exists (select 1 from private.gts_done where user_id = uid and give_id = d.want_id and want_id = d.give_id) then
    raise exception 'gts_repeated' using errcode = 'P0001'; end if;
  if coalesce((select (data->'owned'->d.want_id::text->>'hero')::boolean from public.saves where user_id = uid), false) then
    raise exception 'gts_banned' using errcode = 'P0001'; end if;
  if private.gts_spare(uid, d.want_id) < 1 then raise exception 'gts_no_spare' using errcode = 'P0001'; end if;
  update private.gts_deposits set status = 'traded', taker_id = uid, closed_at = now() where id = p_id;
  insert into private.gts_done (user_id, give_id, want_id) values (d.user_id, d.give_id, d.want_id), (uid, d.want_id, d.give_id) on conflict do nothing;
  return jsonb_build_object('id', d.id, 'give', d.want_id, 'get', d.give_id);
end $$;

-- the caller's ledger: his deposits (any state, the last 100) and the deposits he took
create or replace function private.gts_mine() returns table (id bigint, role text, give_id integer, want_id integer, status text, created_at timestamptz, closed_at timestamptz, other text)
language sql stable security definer set search_path = '' as $$
  select d.id, 'deposito', d.give_id, d.want_id, d.status, d.created_at, d.closed_at, (select p.username::text from public.profiles p where p.id = d.taker_id)
  from private.gts_deposits d where d.user_id = private.real_user()
  union all
  select d.id, 'tomado', d.give_id, d.want_id, d.status, d.created_at, d.closed_at, (select p.username::text from public.profiles p where p.id = d.user_id)
  from private.gts_deposits d where d.taker_id = private.real_user()
  order by 6 desc limit 200
$$;

-- open deposits of other players; p_get: the footballer the caller is looking for, p_give: the one he would give
create or replace function private.gts_search(p_get integer, p_give integer) returns table (id bigint, username text, give_id integer, want_id integer, created_at timestamptz)
language sql stable security definer set search_path = '' as $$
  select d.id, coalesce(p.username::text, '?'), d.give_id, d.want_id, d.created_at
  from private.gts_deposits d left join public.profiles p on p.id = d.user_id
  where d.status = 'open' and d.user_id is distinct from auth.uid()
    and (p_get is null or d.give_id = p_get) and (p_give is null or d.want_id = p_give)
  order by d.created_at desc limit 60
$$;

-- the latest movements, for the main menu (no account needed)
create or replace function private.gts_feed() returns table (id bigint, username text, give_id integer, want_id integer, status text, at timestamptz)
language sql stable security definer set search_path = '' as $$
  select d.id, coalesce(p.username::text, '?'), d.give_id, d.want_id, d.status, coalesce(d.closed_at, d.created_at)
  from private.gts_deposits d left join public.profiles p on p.id = d.user_id
  where d.status in ('open', 'traded')
  order by coalesce(d.closed_at, d.created_at) desc limit 12
$$;

alter function private.gts_deposit(integer, integer) set statement_timeout = '5s';
alter function private.gts_take(bigint) set statement_timeout = '5s';
alter function private.gts_search(integer, integer) set statement_timeout = '5s';
alter function private.gts_feed() set statement_timeout = '5s';
alter function private.gts_mine() set statement_timeout = '5s';

create or replace function public.gts_deposit(p_give integer, p_want integer) returns bigint
language sql security invoker set search_path = '' as $$ select private.gts_deposit(p_give, p_want); $$;
create or replace function public.gts_withdraw(p_id bigint) returns boolean
language sql security invoker set search_path = '' as $$ select private.gts_withdraw(p_id); $$;
create or replace function public.gts_take(p_id bigint) returns jsonb
language sql security invoker set search_path = '' as $$ select private.gts_take(p_id); $$;
create or replace function public.gts_mine() returns table (id bigint, role text, give_id integer, want_id integer, status text, created_at timestamptz, closed_at timestamptz, other text)
language sql security invoker set search_path = '' as $$ select * from private.gts_mine(); $$;
create or replace function public.gts_search(p_get integer default null, p_give integer default null) returns table (id bigint, username text, give_id integer, want_id integer, created_at timestamptz)
language sql security invoker set search_path = '' as $$ select * from private.gts_search(p_get, p_give); $$;
create or replace function public.gts_feed() returns table (id bigint, username text, give_id integer, want_id integer, status text, at timestamptz)
language sql security invoker set search_path = '' as $$ select * from private.gts_feed(); $$;

revoke execute on function private.gts_spare(uuid, integer), private.gts_deposit(integer, integer), private.gts_withdraw(bigint), private.gts_take(bigint),
  private.gts_mine(), private.gts_search(integer, integer), private.gts_feed() from public, anon, authenticated;
revoke execute on function public.gts_deposit(integer, integer), public.gts_withdraw(bigint), public.gts_take(bigint), public.gts_mine(),
  public.gts_search(integer, integer), public.gts_feed() from public, anon, authenticated;
grant execute on function private.gts_deposit(integer, integer), private.gts_withdraw(bigint), private.gts_take(bigint), private.gts_mine(),
  public.gts_deposit(integer, integer), public.gts_withdraw(bigint), public.gts_take(bigint), public.gts_mine() to authenticated;
grant execute on function private.gts_search(integer, integer), private.gts_feed(), public.gts_search(integer, integer), public.gts_feed() to anon, authenticated;

notify pgrst, 'reload schema';

-- ===== 20261106000100_gts_heroes.sql
-- 1.8 (author): a footballer the player ascended to HÉROE can leave spare copies in the GTS (the copy travels clean,
-- the HÉROE stays). Only Leyenda and limited-event footballers stay banned (private.gts_banned). No footballer is a
-- HÉROE by nature today; if one is added, put its id in private.gts_banned.

create or replace function private.gts_deposit(p_give integer, p_want integer) returns bigint
language plpgsql security definer set search_path = '' as $$
declare uid uuid := private.real_user(); sv jsonb; slots integer; open_n integer; new_id bigint;
begin
  if p_give is null or p_want is null or p_give = p_want or p_give <= 0 or p_want <= 0 then raise exception 'gts_invalid' using errcode = 'P0001'; end if;
  perform pg_advisory_xact_lock(hashtext('gts:' || uid::text));
  select data into sv from public.saves where user_id = uid;
  if sv is null then raise exception 'gts_no_save' using errcode = 'P0001'; end if;
  if exists (select 1 from private.gts_banned where player_id in (p_give, p_want)) then raise exception 'gts_banned' using errcode = 'P0001'; end if;
  slots := least(5, 1 + greatest(0, coalesce((sv->'upgrades'->>'gts')::integer, 0)));
  select count(*) into open_n from private.gts_deposits where user_id = uid and status = 'open';
  if open_n >= slots then raise exception 'gts_slots' using errcode = 'P0001'; end if;
  if exists (select 1 from private.gts_deposits where user_id = uid and status = 'open' and give_id = p_give and want_id = p_want)
     or exists (select 1 from private.gts_done where user_id = uid and give_id = p_give and want_id = p_want) then
    raise exception 'gts_repeated' using errcode = 'P0001'; end if;
  if private.gts_spare(uid, p_give) < 1 then raise exception 'gts_no_spare' using errcode = 'P0001'; end if;
  insert into private.gts_deposits (user_id, give_id, want_id) values (uid, p_give, p_want) returning id into new_id;
  return new_id;
end $$;

create or replace function private.gts_take(p_id bigint) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare uid uuid := private.real_user(); d record;
begin
  perform pg_advisory_xact_lock(hashtext('gts:' || uid::text));
  select * into d from private.gts_deposits where id = p_id for update;
  if not found or d.status <> 'open' then raise exception 'gts_gone' using errcode = 'P0001'; end if;
  if d.user_id = uid then raise exception 'gts_own' using errcode = 'P0001'; end if;
  if exists (select 1 from private.gts_done where user_id = uid and give_id = d.want_id and want_id = d.give_id) then
    raise exception 'gts_repeated' using errcode = 'P0001'; end if;
  if private.gts_spare(uid, d.want_id) < 1 then raise exception 'gts_no_spare' using errcode = 'P0001'; end if;
  update private.gts_deposits set status = 'traded', taker_id = uid, closed_at = now() where id = p_id;
  insert into private.gts_done (user_id, give_id, want_id) values (d.user_id, d.give_id, d.want_id), (uid, d.want_id, d.give_id) on conflict do nothing;
  return jsonb_build_object('id', d.id, 'give', d.want_id, 'get', d.give_id);
end $$;

-- ===== 20261106000200_ina483.sql
-- 1.81 (author): code INA483. 5 ×10 of the Banner de agradecimiento (750 fichas de evento), 5 normal ×10 (500 fichas),
-- 20.000 coins, one footballer Legendario or higher for sure (Legendario 80 / Mítico 17 / Leyenda 3, from rewards.rarity_pools,
-- event-only footballers left out) and its own banner and frame (rewards.pennants, answered as reward.pennants; the
-- client only lists them for whoever owns them). redeem_code learns rarity_pools/rarity_odds and pennants; codes
-- without them (ASTRA17, GRACIAS) answer exactly as before. Same function as 20261105000100_thanks_code.sql otherwise.

create or replace function private.redeem_code(p_code text, p_already_applied boolean) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare uid uuid := private.real_user(); c record; pool jsonb; pick integer; res jsonb; inserted integer;
  odds jsonb; total numeric; x numeric; r text;
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
  odds := c.rewards -> 'rarity_odds';
  if odds is not null then
    -- rarity first by its weight (only rarities with footballers), then one of that rarity
    select sum((value)::numeric) into total from jsonb_each_text(odds) e
      where jsonb_array_length(coalesce(c.rewards -> 'rarity_pools' -> e.key, '[]')) > 0;
    x := random() * coalesce(total, 0);
    for r in select e.key from jsonb_each_text(odds) e
      where jsonb_array_length(coalesce(c.rewards -> 'rarity_pools' -> e.key, '[]')) > 0 order by (e.value)::numeric desc loop
      pool := c.rewards -> 'rarity_pools' -> r;
      x := x - (odds ->> r)::numeric;
      exit when x < 0;
    end loop;
  end if;
  pick := case when jsonb_array_length(coalesce(pool, '[]')) > 0 then (pool ->> floor(random() * jsonb_array_length(pool))::integer)::integer end;
  res := jsonb_build_object('tokens', coalesce((c.rewards ->> 'tokens')::integer, 0), 'coins', coalesce((c.rewards ->> 'coins')::integer, 0), 'player', pick,
    'eventTokens', coalesce((c.rewards ->> 'event_tokens')::integer, 0));
  if c.rewards ? 'pennants' then res := res || jsonb_build_object('pennants', c.rewards -> 'pennants'); end if;
  insert into private.promo_redemptions (user_id, code, result) values (uid, c.code, res) on conflict do nothing;
  get diagnostics inserted = row_count;
  if inserted = 0 then return jsonb_build_object('status', 'used'); end if;
  return jsonb_build_object('status', 'ok', 'reward', res);
end $$;

revoke execute on function private.redeem_code(text, boolean) from public, anon, authenticated;
grant execute on function private.redeem_code(text, boolean) to authenticated;

insert into private.promo_codes (code, rewards) values ('INA483', jsonb_build_object(
  'tokens', 500, 'coins', 20000, 'event_tokens', 750,
  'rarity_odds', jsonb_build_object('legendario', 80, 'mitico', 17, 'leyenda', 3),
  'rarity_pools', '{"legendario":[1541,1567,1532,29,10,1542,1513,1384,2,3,1589,1,1548,1024,1370,1371,1405,1382,101855,101791,101838,101871,101775,100248,100405,100468,100562,101722,101308,102015,101719,100293,100844,100538,100544,100580,100728,101504,102117,102185,101558,100494,100510,100907,102205,102307,100487,100540,100717,100382,101488,101572,101505,100438,100739,100577,101710,100797,100519,100905,102130,100979,101437],"mitico":[157,1406,101894,102014,102025,100475,100944,100303,100427,100426,100242,100635,101416,101527,101345,100602,100609,100615,100638,102346,101004,100516,101626,100805,101520,100398,102454,100335,101652,100524,100604,100568,100238,100723,100597,100288,100600,100725,100332,100598,100603,100982,101321,102050,100989,100952,100759],"leyenda":[100773,100234]}'::jsonb,
  'pennants', jsonb_build_array('inazuma', 'marco-inazuma')))
-- run again (an earlier draft had other amounts and banner ids): the code always ends up with these rewards
on conflict (code) do update set rewards = excluded.rewards, active = true;

-- ===== 20261106000300_bug_bounty.sql
-- 1.85 (author): bug bounty. When the admin marks a report «corregido» (admin_update_bug), its reporter earns 100 fichas,
-- once per report (marking it again, or going back and forth, never pays twice; admins' own reports pay nothing). The
-- reward waits in private.bug_rewards until the reporter's game claims it (claim_bug_rewards), which adds the fichas and
-- shows a notice. economy_cap counts the rewards claimed since the last write, like promo codes, so a save never cuts them.

create table if not exists private.bug_rewards (
  report_id uuid primary key references public.bug_reports (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  code text not null,
  title text not null,
  tokens integer not null default 100 check (tokens between 0 and 1000),
  created_at timestamptz not null default now(),
  claimed_at timestamptz
);
create index if not exists bug_rewards_user_pending on private.bug_rewards (user_id) where claimed_at is null;
revoke all on private.bug_rewards from public, anon, authenticated;

-- admin_update_bug as before (20261101000000_bug_reports.sql), plus the reward when the status becomes «corregido»
create or replace function private.admin_update_bug(p_code text, p_status text, p_notes text) returns timestamptz
language plpgsql security definer set search_path = public as $$
declare t timestamptz; r record;
begin
  if not private.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  update public.bug_reports set status = coalesce(p_status, status), admin_notes = coalesce(p_notes, admin_notes), updated_at = now()
  where code = p_code returning updated_at, id, user_id, code, title, status into r;
  if r.updated_at is null then raise exception 'not_found' using errcode = 'P0002'; end if;
  t := r.updated_at;
  if r.status = 'corregido' and not exists (select 1 from private.admins a where a.user_id = r.user_id) then
    insert into private.bug_rewards (report_id, user_id, code, title, tokens) values (r.id, r.user_id, r.code, r.title, 100)
    on conflict (report_id) do nothing;
  end if;
  return t;
end $$;

-- the reporter's game takes its pending rewards (once: they are marked as claimed in the same statement)
create or replace function private.claim_bug_rewards() returns table (code text, title text, tokens integer)
language sql security definer set search_path = '' as $$
  update private.bug_rewards b set claimed_at = now()
  where b.user_id = private.real_user() and b.claimed_at is null
  returning b.code, b.title, b.tokens;
$$;
revoke execute on function private.claim_bug_rewards() from public, anon, authenticated;
grant execute on function private.claim_bug_rewards() to authenticated;
create or replace function public.claim_bug_rewards() returns table (code text, title text, tokens integer)
language sql security invoker set search_path = '' as $$ select * from private.claim_bug_rewards(); $$;
revoke execute on function public.claim_bug_rewards() from public, anon;
grant execute on function public.claim_bug_rewards() to authenticated;

-- economy_cap as in 20261102000200_save_economy_guard.sql, plus the bug rewards claimed since the last write
create or replace function private.economy_cap(p_new jsonb, p_old jsonb, p_since timestamptz, p_uid uuid) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  hours numeric := greatest(0, extract(epoch from (now() - coalesce(p_since, now()))) / 3600);
  promo_t numeric := 0; promo_c numeric := 0; bug_t numeric := 0;
  old_t numeric; old_c numeric; new_t numeric; new_c numeric; max_t numeric; max_c numeric;
  out jsonb := p_new;
begin
  if to_regclass('private.promo_redemptions') is not null then
    execute 'select coalesce(sum((r.result ->> ''tokens'')::numeric), 0), coalesce(sum((r.result ->> ''coins'')::numeric), 0)
      from private.promo_redemptions r where r.user_id = $1 and r.created_at > coalesce($2, ''-infinity''::timestamptz)'
      into promo_t, promo_c using p_uid, p_since;
  end if;
  select coalesce(sum(b.tokens), 0) into bug_t from private.bug_rewards b
    where b.user_id = p_uid and b.claimed_at is not null and b.claimed_at > coalesce(p_since, '-infinity'::timestamptz);
  promo_t := promo_t + bug_t;
  new_t := case when jsonb_typeof(p_new -> 'tokens') = 'number' then (p_new ->> 'tokens')::numeric else 0 end;
  new_c := case when jsonb_typeof(p_new -> 'coins') = 'number' then (p_new ->> 'coins')::numeric else 0 end;
  if p_old is null then
    max_t := 5000 + promo_t; max_c := 60000 + promo_c;
  else
    old_t := case when jsonb_typeof(p_old -> 'tokens') = 'number' then greatest(0, (p_old ->> 'tokens')::numeric) else 0 end;
    old_c := case when jsonb_typeof(p_old -> 'coins') = 'number' then greatest(0, (p_old ->> 'coins')::numeric) else 0 end;
    max_t := old_t + 2000 + 1000 * hours + promo_t;
    max_c := old_c + 8000 + 8000 * hours + promo_c;
  end if;
  if new_t > max_t then out := jsonb_set(out, '{tokens}', to_jsonb(floor(max_t)::bigint)); end if;
  if new_c > max_c then out := jsonb_set(out, '{coins}', to_jsonb(floor(max_c)::bigint)); end if;
  return out;
end $$;
revoke all on function private.economy_cap(jsonb, jsonb, timestamptz, uuid) from public, anon, authenticated;

-- ===== 20261106000400_coin_cap.sql
-- 1.86 (author: coins easier to earn): runs, missions and the weekly pass pay double coins, so the economy cap lets coins
-- grow twice as fast between two writes (16.000 + 16.000 per hour; 120.000 for the first copy of an account). Fichas are
-- unchanged. Same function as 20261106000300_bug_bounty.sql otherwise.

create or replace function private.economy_cap(p_new jsonb, p_old jsonb, p_since timestamptz, p_uid uuid) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  hours numeric := greatest(0, extract(epoch from (now() - coalesce(p_since, now()))) / 3600);
  promo_t numeric := 0; promo_c numeric := 0; bug_t numeric := 0;
  old_t numeric; old_c numeric; new_t numeric; new_c numeric; max_t numeric; max_c numeric;
  out jsonb := p_new;
begin
  if to_regclass('private.promo_redemptions') is not null then
    execute 'select coalesce(sum((r.result ->> ''tokens'')::numeric), 0), coalesce(sum((r.result ->> ''coins'')::numeric), 0)
      from private.promo_redemptions r where r.user_id = $1 and r.created_at > coalesce($2, ''-infinity''::timestamptz)'
      into promo_t, promo_c using p_uid, p_since;
  end if;
  select coalesce(sum(b.tokens), 0) into bug_t from private.bug_rewards b
    where b.user_id = p_uid and b.claimed_at is not null and b.claimed_at > coalesce(p_since, '-infinity'::timestamptz);
  promo_t := promo_t + bug_t;
  new_t := case when jsonb_typeof(p_new -> 'tokens') = 'number' then (p_new ->> 'tokens')::numeric else 0 end;
  new_c := case when jsonb_typeof(p_new -> 'coins') = 'number' then (p_new ->> 'coins')::numeric else 0 end;
  if p_old is null then
    max_t := 5000 + promo_t; max_c := 120000 + promo_c;
  else
    old_t := case when jsonb_typeof(p_old -> 'tokens') = 'number' then greatest(0, (p_old ->> 'tokens')::numeric) else 0 end;
    old_c := case when jsonb_typeof(p_old -> 'coins') = 'number' then greatest(0, (p_old ->> 'coins')::numeric) else 0 end;
    max_t := old_t + 2000 + 1000 * hours + promo_t;
    max_c := old_c + 16000 + 16000 * hours + promo_c;
  end if;
  if new_t > max_t then out := jsonb_set(out, '{tokens}', to_jsonb(floor(max_t)::bigint)); end if;
  if new_c > max_c then out := jsonb_set(out, '{coins}', to_jsonb(floor(max_c)::bigint)); end if;
  return out;
end $$;
revoke all on function private.economy_cap(jsonb, jsonb, timestamptz, uuid) from public, anon, authenticated;

-- ===== 20261106000500_bug_replies.sql
-- 1.88 (author): the bug panel can answer the reporter. A reply (bug_reports.reply, separate from the private
-- admin_notes) or a status change to «corregido» or «descartado» leaves a notice for the reporter (notice_pending); their
-- game takes it with claim_bug_notices when the menu opens and shows it. my_bug_reports also returns the reply.
-- admin_update_bug gets a 4th argument (p_reply); the 3-argument version is dropped so the API call is unambiguous.

alter table public.bug_reports add column if not exists reply text not null default '' check (char_length(reply) <= 2000);
alter table public.bug_reports add column if not exists notice_pending boolean not null default false;

drop function if exists public.admin_update_bug(text, text, text);
drop function if exists private.admin_update_bug(text, text, text);

create or replace function private.admin_update_bug(p_code text, p_status text, p_notes text, p_reply text) returns timestamptz
language plpgsql security definer set search_path = public as $$
declare t timestamptz; r record; old record;
begin
  if not private.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  select status, reply into old from public.bug_reports where code = p_code;
  update public.bug_reports set status = coalesce(p_status, status), admin_notes = coalesce(p_notes, admin_notes),
    reply = coalesce(left(p_reply, 2000), reply), updated_at = now()
  where code = p_code returning updated_at, id, user_id, code, title, status, reply into r;
  if r.updated_at is null then raise exception 'not_found' using errcode = 'P0002'; end if;
  t := r.updated_at;
  -- the reporter is told when there is a new reply, or when the report is fixed or discarded
  if (r.reply <> '' and r.reply is distinct from old.reply)
     or (r.status is distinct from old.status and r.status in ('corregido', 'descartado')) then
    update public.bug_reports set notice_pending = true where id = r.id;
  end if;
  -- 1.85: the bug bounty (100 fichas once per report, never for admins)
  if r.status = 'corregido' and not exists (select 1 from private.admins a where a.user_id = r.user_id) then
    insert into private.bug_rewards (report_id, user_id, code, title, tokens) values (r.id, r.user_id, r.code, r.title, 100)
    on conflict (report_id) do nothing;
  end if;
  return t;
end $$;
create or replace function public.admin_update_bug(p_code text, p_status text default null, p_notes text default null, p_reply text default null) returns timestamptz
language sql security invoker set search_path = '' as $$ select private.admin_update_bug(p_code, p_status, p_notes, p_reply); $$;
revoke execute on function private.admin_update_bug(text, text, text, text) from public, anon, authenticated;
grant execute on function private.admin_update_bug(text, text, text, text) to authenticated;
revoke execute on function public.admin_update_bug(text, text, text, text) from public, anon;
grant execute on function public.admin_update_bug(text, text, text, text) to authenticated;

-- the reporter's notices, taken once
create or replace function private.claim_bug_notices() returns table (code text, title text, status text, reply text)
language sql security definer set search_path = '' as $$
  update public.bug_reports b set notice_pending = false
  where b.user_id = private.real_user() and b.notice_pending
  returning b.code, b.title, b.status, b.reply;
$$;
revoke execute on function private.claim_bug_notices() from public, anon, authenticated;
grant execute on function private.claim_bug_notices() to authenticated;
create or replace function public.claim_bug_notices() returns table (code text, title text, status text, reply text)
language sql security invoker set search_path = '' as $$ select * from private.claim_bug_notices(); $$;
revoke execute on function public.claim_bug_notices() from public, anon;
grant execute on function public.claim_bug_notices() to authenticated;

-- my_bug_reports with the reply (its row type changes, so it is dropped first)
drop function if exists public.my_bug_reports();
drop function if exists private.my_bug_reports();
create function private.my_bug_reports() returns table (code text, category text, severity text, title text, status text, created_at timestamptz, has_screenshot boolean, reply text)
language sql stable security definer set search_path = '' as $$
  select b.code, b.category, b.severity, b.title, b.status, b.created_at, b.screenshot_path is not null, b.reply
  from public.bug_reports b where b.user_id = auth.uid() order by b.created_at desc limit 50;
$$;
revoke execute on function private.my_bug_reports() from public, anon, authenticated;
grant execute on function private.my_bug_reports() to authenticated;
create function public.my_bug_reports() returns table (code text, category text, severity text, title text, status text, created_at timestamptz, has_screenshot boolean, reply text)
language sql stable security invoker set search_path = '' as $$ select * from private.my_bug_reports(); $$;
revoke execute on function public.my_bug_reports() from public, anon;
grant execute on function public.my_bug_reports() to authenticated;

-- (author, same day) a discarded report tells the reporter nothing: only a new reply or «corregido» leave a notice
create or replace function private.admin_update_bug(p_code text, p_status text, p_notes text, p_reply text) returns timestamptz
language plpgsql security definer set search_path = public as $$
declare t timestamptz; r record; old record;
begin
  if not private.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  select status, reply into old from public.bug_reports where code = p_code;
  update public.bug_reports set status = coalesce(p_status, status), admin_notes = coalesce(p_notes, admin_notes),
    reply = coalesce(left(p_reply, 2000), reply), updated_at = now()
  where code = p_code returning updated_at, id, user_id, code, title, status, reply into r;
  if r.updated_at is null then raise exception 'not_found' using errcode = 'P0002'; end if;
  t := r.updated_at;
  if r.status = 'descartado' then
    update public.bug_reports set notice_pending = false where id = r.id;
  elsif (r.reply <> '' and r.reply is distinct from old.reply) or (r.status is distinct from old.status and r.status = 'corregido') then
    update public.bug_reports set notice_pending = true where id = r.id;
  end if;
  if r.status = 'corregido' and not exists (select 1 from private.admins a where a.user_id = r.user_id) then
    insert into private.bug_rewards (report_id, user_id, code, title, tokens) values (r.id, r.user_id, r.code, r.title, 100)
    on conflict (report_id) do nothing;
  end if;
  return t;
end $$;

-- ===== 20261106000600_suggestions.sql
-- 1.88 (author): recommendations, next to the bug reports. A signed-in player sends an idea (title + text); the admin panel
-- lists them and marks each one pendiente / aceptada / descartada, with an optional reply. Accepting it or replying leaves a
-- notice for the player (claimed with claim_suggestion_notices); a discarded one tells nothing. Tables closed to the API.

create table if not exists public.suggestions (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  user_id uuid not null references auth.users (id) on delete cascade,
  username text,
  title text not null check (char_length(title) between 4 and 120),
  description text not null check (char_length(description) between 10 and 4000),
  status text not null default 'pendiente' check (status in ('pendiente', 'aceptada', 'descartada')),
  reply text not null default '' check (char_length(reply) <= 2000),
  notice_pending boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists suggestions_user on public.suggestions (user_id, created_at desc);
alter table public.suggestions enable row level security;
revoke all on table public.suggestions from public, anon, authenticated;

create or replace function private.submit_suggestion(p_title text, p_description text) returns text
language plpgsql security definer set search_path = public as $$
declare uid uuid := private.real_user(); new_code text; uname text;
begin
  if uid is null then raise exception 'not_signed_in' using errcode = '42501'; end if;
  if exists (select 1 from public.suggestions where user_id = uid and created_at > now() - interval '60 seconds') then
    raise exception 'too_fast' using errcode = '54000';
  end if;
  if (select count(*) from public.suggestions where user_id = uid and created_at > now() - interval '1 day') >= 5 then
    raise exception 'daily_limit' using errcode = '54000';
  end if;
  select username::text into uname from public.profiles where id = uid;
  new_code := 'IDEA-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
  insert into public.suggestions (code, user_id, username, title, description) values (new_code, uid, uname, trim(p_title), trim(p_description));
  return new_code;
end $$;

create or replace function private.my_suggestions() returns table (code text, title text, status text, created_at timestamptz)
language sql stable security definer set search_path = '' as $$
  select s.code, s.title, s.status, s.created_at from public.suggestions s where s.user_id = auth.uid() order by s.created_at desc limit 50;
$$;

create or replace function private.admin_suggestions(p_status text) returns setof public.suggestions
language plpgsql stable security definer set search_path = public as $$
begin
  if not private.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  return query select * from public.suggestions s where p_status is null or s.status = p_status order by s.created_at desc limit 300;
end $$;

create or replace function private.admin_update_suggestion(p_code text, p_status text, p_reply text) returns timestamptz
language plpgsql security definer set search_path = public as $$
declare old record; r record;
begin
  if not private.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  select status, reply into old from public.suggestions where code = p_code;
  update public.suggestions set status = coalesce(p_status, status), reply = coalesce(left(p_reply, 2000), reply), updated_at = now()
  where code = p_code returning id, status, reply, updated_at into r;
  if r.updated_at is null then raise exception 'not_found' using errcode = 'P0002'; end if;
  if r.status = 'descartada' then
    update public.suggestions set notice_pending = false where id = r.id;
  elsif (r.reply <> '' and r.reply is distinct from old.reply) or (r.status is distinct from old.status and r.status = 'aceptada') then
    update public.suggestions set notice_pending = true where id = r.id;
  end if;
  return r.updated_at;
end $$;

create or replace function private.claim_suggestion_notices() returns table (code text, title text, status text, reply text)
language sql security definer set search_path = '' as $$
  update public.suggestions s set notice_pending = false
  where s.user_id = private.real_user() and s.notice_pending
  returning s.code, s.title, s.status, s.reply;
$$;

create or replace function public.submit_suggestion(p_title text, p_description text) returns text
language sql security invoker set search_path = '' as $$ select private.submit_suggestion(p_title, p_description); $$;
create or replace function public.my_suggestions() returns table (code text, title text, status text, created_at timestamptz)
language sql stable security invoker set search_path = '' as $$ select * from private.my_suggestions(); $$;
create or replace function public.admin_suggestions(p_status text default null) returns setof public.suggestions
language sql stable security invoker set search_path = '' as $$ select * from private.admin_suggestions(p_status); $$;
create or replace function public.admin_update_suggestion(p_code text, p_status text default null, p_reply text default null) returns timestamptz
language sql security invoker set search_path = '' as $$ select private.admin_update_suggestion(p_code, p_status, p_reply); $$;
create or replace function public.claim_suggestion_notices() returns table (code text, title text, status text, reply text)
language sql security invoker set search_path = '' as $$ select * from private.claim_suggestion_notices(); $$;

revoke execute on function private.submit_suggestion(text, text), private.my_suggestions(), private.admin_suggestions(text),
  private.admin_update_suggestion(text, text, text), private.claim_suggestion_notices() from public, anon, authenticated;
grant execute on function private.submit_suggestion(text, text), private.my_suggestions(), private.admin_suggestions(text),
  private.admin_update_suggestion(text, text, text), private.claim_suggestion_notices() to authenticated;
revoke execute on function public.submit_suggestion(text, text), public.my_suggestions(), public.admin_suggestions(text),
  public.admin_update_suggestion(text, text, text), public.claim_suggestion_notices() from public, anon;
grant execute on function public.submit_suggestion(text, text), public.my_suggestions(), public.admin_suggestions(text),
  public.admin_update_suggestion(text, text, text), public.claim_suggestion_notices() to authenticated;

-- ===== 20261107000000_coop_rooms.sql
-- pre-2.0 (author): co-op rooms for two. The host creates a room and shares its 6-letter code; the guest joins with it.
-- The match itself goes peer to peer (WebRTC); this table only carries the two signalling messages (the guest's offer
-- and the host's answer, each with its ICE candidates already gathered), so no Realtime connection is used. Rooms last
-- 15 minutes unless they connect; rows older than a day are swept on each create. Tables closed to the API.

create table if not exists public.coop_rooms (
  code text primary key check (code ~ '^[A-Z2-9]{6}$'),
  host uuid not null references auth.users (id) on delete cascade,
  guest uuid references auth.users (id) on delete cascade,
  host_name text,
  guest_name text,
  offer text check (char_length(offer) <= 20000),
  answer text check (char_length(answer) <= 20000),
  status text not null default 'abierta' check (status in ('abierta', 'emparejada', 'conectada', 'cerrada')),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '15 minutes',
  connected_at timestamptz
);
create index if not exists coop_rooms_host on public.coop_rooms (host, created_at desc);
alter table public.coop_rooms enable row level security;
revoke all on table public.coop_rooms from public, anon, authenticated;

create or replace function private.coop_create() returns text
language plpgsql security definer set search_path = public as $$
declare uid uuid := private.real_user(); alphabet text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; c text; b bytea; i int; tries int := 0;
begin
  if uid is null then raise exception 'not_signed_in' using errcode = '42501'; end if;
  delete from public.coop_rooms where created_at < now() - interval '1 day';
  if (select count(*) from public.coop_rooms where host = uid and created_at > now() - interval '1 day') >= 40 then
    raise exception 'coop_daily_limit' using errcode = '54000';
  end if;
  update public.coop_rooms set status = 'cerrada' where host = uid and status in ('abierta', 'emparejada');
  loop
    b := decode(replace(gen_random_uuid()::text, '-', ''), 'hex'); c := '';
    for i in 0..5 loop c := c || substr(alphabet, get_byte(b, i) % 32 + 1, 1); end loop;
    exit when not exists (select 1 from public.coop_rooms where code = c);
    tries := tries + 1;
    if tries > 8 then raise exception 'no_code' using errcode = '54000'; end if;
  end loop;
  insert into public.coop_rooms (code, host, host_name) values (c, uid, (select username::text from public.profiles where id = uid));
  return c;
end $$;

create or replace function private.coop_join(p_code text) returns text
language plpgsql security definer set search_path = public as $$
declare uid uuid := private.real_user(); r record;
begin
  if uid is null then raise exception 'not_signed_in' using errcode = '42501'; end if;
  select * into r from public.coop_rooms where code = upper(trim(p_code)) for update;
  if r.code is null or r.status = 'cerrada' or r.expires_at < now() then raise exception 'room_not_found' using errcode = 'P0002'; end if;
  if r.host = uid then raise exception 'own_room' using errcode = '42501'; end if;
  if r.guest is not null and r.guest <> uid then raise exception 'room_full' using errcode = '54000'; end if;
  update public.coop_rooms set guest = uid, guest_name = (select username::text from public.profiles where id = uid), status = 'emparejada',
    offer = case when guest = uid then offer else null end, answer = case when guest = uid then answer else null end
  where code = r.code;
  return r.host_name;
end $$;

-- the guest sends the offer, the host the answer
create or replace function private.coop_signal(p_code text, p_kind text, p_sdp text) returns void
language plpgsql security definer set search_path = public as $$
declare uid uuid := private.real_user(); r record;
begin
  if uid is null then raise exception 'not_signed_in' using errcode = '42501'; end if;
  if char_length(p_sdp) > 20000 then raise exception 'too_big' using errcode = '54000'; end if;
  select * into r from public.coop_rooms where code = upper(trim(p_code));
  if r.code is null or r.status = 'cerrada' or r.expires_at < now() then raise exception 'room_not_found' using errcode = 'P0002'; end if;
  if p_kind = 'offer' and r.guest = uid then update public.coop_rooms set offer = p_sdp, answer = null where code = r.code;
  elsif p_kind = 'answer' and r.host = uid then update public.coop_rooms set answer = p_sdp where code = r.code;
  else raise exception 'forbidden' using errcode = '42501';
  end if;
end $$;

create or replace function private.coop_poll(p_code text) returns table (status text, host_name text, guest_name text, offer text, answer text, role text)
language plpgsql stable security definer set search_path = public as $$
declare uid uuid := private.real_user();
begin
  return query select case when r.expires_at < now() and r.status <> 'conectada' then 'cerrada' else r.status end, r.host_name, r.guest_name,
    case when r.host = uid then r.offer end, case when r.guest = uid then r.answer end, case when r.host = uid then 'host' else 'guest' end
  from public.coop_rooms r where r.code = upper(trim(p_code)) and uid is not null and (r.host = uid or r.guest = uid);
end $$;

-- 'conectada' (the host, once the peers talk: kept for the admin stats) or 'cerrada' (either of the two)
create or replace function private.coop_mark(p_code text, p_status text) returns void
language plpgsql security definer set search_path = public as $$
declare uid uuid := private.real_user();
begin
  if p_status = 'conectada' then
    update public.coop_rooms set status = 'conectada', connected_at = now() where code = upper(trim(p_code)) and host = uid and status = 'emparejada';
  elsif p_status = 'cerrada' then
    update public.coop_rooms set status = 'cerrada' where code = upper(trim(p_code)) and (host = uid or guest = uid);
  else raise exception 'bad_status' using errcode = '22023';
  end if;
end $$;

create or replace function public.coop_create() returns text
language sql security invoker set search_path = '' as $$ select private.coop_create(); $$;
create or replace function public.coop_join(p_code text) returns text
language sql security invoker set search_path = '' as $$ select private.coop_join(p_code); $$;
create or replace function public.coop_signal(p_code text, p_kind text, p_sdp text) returns void
language sql security invoker set search_path = '' as $$ select private.coop_signal(p_code, p_kind, p_sdp); $$;
create or replace function public.coop_poll(p_code text) returns table (status text, host_name text, guest_name text, offer text, answer text, role text)
language sql stable security invoker set search_path = '' as $$ select * from private.coop_poll(p_code); $$;
create or replace function public.coop_mark(p_code text, p_status text) returns void
language sql security invoker set search_path = '' as $$ select private.coop_mark(p_code, p_status); $$;

revoke execute on function private.coop_create(), private.coop_join(text), private.coop_signal(text, text, text), private.coop_poll(text),
  private.coop_mark(text, text) from public, anon, authenticated;
grant execute on function private.coop_create(), private.coop_join(text), private.coop_signal(text, text, text), private.coop_poll(text),
  private.coop_mark(text, text) to authenticated;
revoke execute on function public.coop_create(), public.coop_join(text), public.coop_signal(text, text, text), public.coop_poll(text),
  public.coop_mark(text, text) from public, anon;
grant execute on function public.coop_create(), public.coop_join(text), public.coop_signal(text, text, text), public.coop_poll(text),
  public.coop_mark(text, text) to authenticated;

alter function private.coop_create() set statement_timeout = '5s';
alter function private.coop_join(text) set statement_timeout = '5s';
alter function private.coop_signal(text, text, text) set statement_timeout = '5s';
alter function private.coop_poll(text) set statement_timeout = '5s';
alter function private.coop_mark(text, text) set statement_timeout = '5s';

-- ===== 20261107000100_coop_turn.sql
-- pre-2.0 (author): budget for the TURN relay (Cloudflare Realtime, free up to its monthly allowance, billed past it).
-- The turn-credentials Edge Function asks coop_turn_claim before generating short-lived credentials: only a player who is
-- in a paired or connected room gets them, at most 20 a day each, and never more than the monthly cap for everyone
-- (8000 rooms: even if every one of them were relayed at ~35 MB that is far below the free allowance; in practice only
-- 10-20% of pairs need the relay). Over a cap the game still tries a direct connection.

create table if not exists private.coop_turn_log (
  id bigserial primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  code text not null,
  at timestamptz not null default now()
);
create index if not exists coop_turn_log_user on private.coop_turn_log (user_id, at desc);
create index if not exists coop_turn_log_at on private.coop_turn_log (at);
revoke all on table private.coop_turn_log from public, anon, authenticated;

create or replace function private.coop_turn_claim(p_code text) returns boolean
language plpgsql security definer set search_path = public as $$
declare uid uuid := private.real_user(); c text := upper(trim(p_code));
begin
  if uid is null then raise exception 'not_signed_in' using errcode = '42501'; end if;
  if not exists (select 1 from public.coop_rooms r where r.code = c and r.status in ('emparejada', 'conectada') and (r.host = uid or r.guest = uid)) then
    raise exception 'room_not_found' using errcode = 'P0002';
  end if;
  if (select count(*) from private.coop_turn_log where user_id = uid and at > now() - interval '1 day') >= 20 then return false; end if;
  if (select count(distinct code) from private.coop_turn_log where at >= date_trunc('month', now())) >= 8000
     and not exists (select 1 from private.coop_turn_log where code = c and at >= date_trunc('month', now())) then return false; end if;
  insert into private.coop_turn_log (user_id, code) values (uid, c);
  return true;
end $$;

-- admins: how much of the month's relay budget is used
create or replace function private.coop_turn_usage() returns table (rooms_month bigint, claims_month bigint, cap bigint)
language plpgsql stable security definer set search_path = public as $$
begin
  if not private.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  return query select count(distinct l.code), count(*), 8000::bigint from private.coop_turn_log l where l.at >= date_trunc('month', now());
end $$;

create or replace function public.coop_turn_claim(p_code text) returns boolean
language sql security invoker set search_path = '' as $$ select private.coop_turn_claim(p_code); $$;
create or replace function public.coop_turn_usage() returns table (rooms_month bigint, claims_month bigint, cap bigint)
language sql stable security invoker set search_path = '' as $$ select * from private.coop_turn_usage(); $$;

revoke execute on function private.coop_turn_claim(text), private.coop_turn_usage() from public, anon, authenticated;
grant execute on function private.coop_turn_claim(text), private.coop_turn_usage() to authenticated;
revoke execute on function public.coop_turn_claim(text), public.coop_turn_usage() from public, anon;
grant execute on function public.coop_turn_claim(text), public.coop_turn_usage() to authenticated;

alter function private.coop_turn_claim(text) set statement_timeout = '5s';
alter function private.coop_turn_usage() set statement_timeout = '5s';

-- ===== 20261107000200_friends.sql
-- pre-2.0 (author): friends, for the co-op. A request by global name; accepted, both are friends (one row per pair, the
-- smaller id first). Being online = the game said so in the last two minutes (friend_heartbeat, once a minute while it
-- is open). A friend can be invited to the host's open co-op room: the invitation lasts two minutes and is shown once.
-- Limits: 30 requests a day, 100 friends, 20 invitations an hour. Tables closed to the API.

create table if not exists public.friendships (
  a uuid not null references auth.users (id) on delete cascade,
  b uuid not null references auth.users (id) on delete cascade,
  requester uuid not null references auth.users (id) on delete cascade,
  status text not null default 'pendiente' check (status in ('pendiente', 'aceptada')),
  created_at timestamptz not null default now(),
  accepted_at timestamptz,
  primary key (a, b),
  check (a < b),
  check (requester = a or requester = b)
);
create index if not exists friendships_b on public.friendships (b);
create index if not exists friendships_requester on public.friendships (requester, created_at desc);
alter table public.friendships enable row level security;
revoke all on table public.friendships from public, anon, authenticated;

create table if not exists private.presence (
  user_id uuid primary key references auth.users (id) on delete cascade,
  seen_at timestamptz not null default now()
);
revoke all on table private.presence from public, anon, authenticated;

create table if not exists public.coop_invites (
  id bigserial primary key,
  from_user uuid not null references auth.users (id) on delete cascade,
  to_user uuid not null references auth.users (id) on delete cascade,
  code text not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '2 minutes',
  shown boolean not null default false
);
create index if not exists coop_invites_to on public.coop_invites (to_user, created_at desc);
create index if not exists coop_invites_from on public.coop_invites (from_user, created_at desc);
alter table public.coop_invites enable row level security;
revoke all on table public.coop_invites from public, anon, authenticated;

create or replace function private.friend_uid(p_username text) returns uuid
language sql stable security definer set search_path = public as $$
  select id from public.profiles where username = trim(p_username)::extensions.citext;
$$;

-- a request; if the other one had already asked, it becomes a friendship
create or replace function private.friend_request(p_username text) returns text
language plpgsql security definer set search_path = public as $$
declare uid uuid := private.real_user(); other uuid; lo uuid; hi uuid; r record;
begin
  if uid is null then raise exception 'not_signed_in' using errcode = '42501'; end if;
  other := private.friend_uid(p_username);
  if other is null then raise exception 'friend_not_found' using errcode = 'P0002'; end if;
  if other = uid then raise exception 'friend_self' using errcode = '22023'; end if;
  lo := least(uid, other); hi := greatest(uid, other);
  select * into r from public.friendships where a = lo and b = hi for update;
  if r.a is not null then
    if r.status = 'aceptada' then return 'ya_amigos'; end if;
    if r.requester = uid then return 'enviada'; end if;
    update public.friendships set status = 'aceptada', accepted_at = now() where a = lo and b = hi;
    return 'aceptada';
  end if;
  if (select count(*) from public.friendships where requester = uid and created_at > now() - interval '1 day') >= 30 then
    raise exception 'friend_daily_limit' using errcode = '54000';
  end if;
  if (select count(*) from public.friendships where (a = uid or b = uid) and status = 'aceptada') >= 100 then
    raise exception 'friend_full' using errcode = '54000';
  end if;
  insert into public.friendships (a, b, requester) values (lo, hi, uid);
  return 'enviada';
end $$;

create or replace function private.friend_respond(p_username text, p_accept boolean) returns void
language plpgsql security definer set search_path = public as $$
declare uid uuid := private.real_user(); other uuid := private.friend_uid(p_username);
begin
  if uid is null then raise exception 'not_signed_in' using errcode = '42501'; end if;
  if other is null then raise exception 'friend_not_found' using errcode = 'P0002'; end if;
  if p_accept then
    update public.friendships set status = 'aceptada', accepted_at = now()
    where a = least(uid, other) and b = greatest(uid, other) and status = 'pendiente' and requester = other;
  else
    delete from public.friendships where a = least(uid, other) and b = greatest(uid, other) and status = 'pendiente' and requester = other;
  end if;
end $$;

-- unfriend, or cancel a request this player sent
create or replace function private.friend_remove(p_username text) returns void
language plpgsql security definer set search_path = public as $$
declare uid uuid := private.real_user(); other uuid := private.friend_uid(p_username);
begin
  if uid is null then raise exception 'not_signed_in' using errcode = '42501'; end if;
  if other is null then return; end if;
  delete from public.friendships where a = least(uid, other) and b = greatest(uid, other);
end $$;

create or replace function private.friend_list() returns table (username text, avatar text, crest text, status text, online boolean, since timestamptz)
language plpgsql stable security definer set search_path = public as $$
declare uid uuid := private.real_user();
begin
  if uid is null then raise exception 'not_signed_in' using errcode = '42501'; end if;
  return query
    select p.username::text, p.avatar, p.crest,
      case when f.status = 'aceptada' then 'amigo' when f.requester = uid then 'enviada' else 'recibida' end,
      f.status = 'aceptada' and coalesce(pr.seen_at > now() - interval '2 minutes', false),
      coalesce(f.accepted_at, f.created_at)
    from public.friendships f
    join public.profiles p on p.id = case when f.a = uid then f.b else f.a end
    left join private.presence pr on pr.user_id = p.id
    where f.a = uid or f.b = uid
    order by (f.status = 'aceptada' and coalesce(pr.seen_at > now() - interval '2 minutes', false)) desc, p.username;
end $$;

create or replace function private.friend_heartbeat() returns void
language plpgsql security definer set search_path = public as $$
declare uid uuid := private.real_user();
begin
  if uid is null then return; end if;
  insert into private.presence (user_id, seen_at) values (uid, now()) on conflict (user_id) do update set seen_at = now();
end $$;

-- the host of an open room invites a friend to it
create or replace function private.coop_invite(p_username text, p_code text) returns void
language plpgsql security definer set search_path = public as $$
declare uid uuid := private.real_user(); other uuid := private.friend_uid(p_username); c text := upper(trim(p_code));
begin
  if uid is null then raise exception 'not_signed_in' using errcode = '42501'; end if;
  if other is null then raise exception 'friend_not_found' using errcode = 'P0002'; end if;
  if not exists (select 1 from public.friendships where a = least(uid, other) and b = greatest(uid, other) and status = 'aceptada') then
    raise exception 'not_friends' using errcode = '42501';
  end if;
  if not exists (select 1 from public.coop_rooms where code = c and host = uid and status = 'abierta' and expires_at > now()) then
    raise exception 'room_not_found' using errcode = 'P0002';
  end if;
  if (select count(*) from public.coop_invites where from_user = uid and created_at > now() - interval '1 hour') >= 20 then
    raise exception 'invite_limit' using errcode = '54000';
  end if;
  delete from public.coop_invites where created_at < now() - interval '1 day';
  insert into public.coop_invites (from_user, to_user, code) values (uid, other, c);
end $$;

-- invitations for this player, each one returned once while it is still valid
create or replace function private.coop_invites_claim() returns table (from_name text, code text, created_at timestamptz)
language plpgsql security definer set search_path = public as $$
declare uid uuid := private.real_user();
begin
  if uid is null then return; end if;
  return query
    update public.coop_invites i set shown = true
    from public.profiles p
    where i.to_user = uid and not i.shown and i.expires_at > now() and p.id = i.from_user
    returning p.username::text, i.code, i.created_at;
end $$;

create or replace function public.friend_request(p_username text) returns text
language sql security invoker set search_path = '' as $$ select private.friend_request(p_username); $$;
create or replace function public.friend_respond(p_username text, p_accept boolean) returns void
language sql security invoker set search_path = '' as $$ select private.friend_respond(p_username, p_accept); $$;
create or replace function public.friend_remove(p_username text) returns void
language sql security invoker set search_path = '' as $$ select private.friend_remove(p_username); $$;
create or replace function public.friend_list() returns table (username text, avatar text, crest text, status text, online boolean, since timestamptz)
language sql stable security invoker set search_path = '' as $$ select * from private.friend_list(); $$;
create or replace function public.friend_heartbeat() returns void
language sql security invoker set search_path = '' as $$ select private.friend_heartbeat(); $$;
create or replace function public.coop_invite(p_username text, p_code text) returns void
language sql security invoker set search_path = '' as $$ select private.coop_invite(p_username, p_code); $$;
create or replace function public.coop_invites_claim() returns table (from_name text, code text, created_at timestamptz)
language sql security invoker set search_path = '' as $$ select * from private.coop_invites_claim(); $$;

revoke execute on function private.friend_uid(text), private.friend_request(text), private.friend_respond(text, boolean), private.friend_remove(text),
  private.friend_list(), private.friend_heartbeat(), private.coop_invite(text, text), private.coop_invites_claim() from public, anon, authenticated;
grant execute on function private.friend_uid(text), private.friend_request(text), private.friend_respond(text, boolean), private.friend_remove(text),
  private.friend_list(), private.friend_heartbeat(), private.coop_invite(text, text), private.coop_invites_claim() to authenticated;
revoke execute on function public.friend_request(text), public.friend_respond(text, boolean), public.friend_remove(text), public.friend_list(),
  public.friend_heartbeat(), public.coop_invite(text, text), public.coop_invites_claim() from public, anon;
grant execute on function public.friend_request(text), public.friend_respond(text, boolean), public.friend_remove(text), public.friend_list(),
  public.friend_heartbeat(), public.coop_invite(text, text), public.coop_invites_claim() to authenticated;

alter function private.friend_request(text) set statement_timeout = '5s';
alter function private.friend_respond(text, boolean) set statement_timeout = '5s';
alter function private.friend_remove(text) set statement_timeout = '5s';
alter function private.friend_list() set statement_timeout = '5s';
alter function private.friend_heartbeat() set statement_timeout = '5s';
alter function private.coop_invite(text, text) set statement_timeout = '5s';
alter function private.coop_invites_claim() set statement_timeout = '5s';

-- ===== 20261107000300_gts_jaden.sql
-- pre-2.0 (author): Jaden Evans (900100, Leyenda, reward of Road to Fútbol Frontier) can't be left at the GTS either.
insert into private.gts_banned (player_id) values (900100) on conflict do nothing;

-- ===== 20261107000400_tierlists.sql
-- 1.9 (author): player tier lists. A signed-in player with a name ranks footballers in the fixed tiers S A B C D under one
-- of a few fixed topics (no free text, so nothing to moderate but the order) and publishes it; everyone sees the latest
-- ones in the menu. One list per account: publishing again replaces it. The admin can hide one. Tables closed to the API.

create table if not exists public.tierlists (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  topic text not null check (topic in ('general', 'delanteros', 'medios', 'defensas', 'porteros', 'favoritos')),
  tiers jsonb not null,
  hidden boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists tierlists_recent on public.tierlists (updated_at desc) where not hidden;
alter table public.tierlists enable row level security;
revoke all on table public.tierlists from public, anon, authenticated;

-- tiers: {"S": [ids], "A": [...], ...}; only these keys, whole positive ids, 3 to 60 in all, none repeated
create or replace function private.valid_tiers(p jsonb) returns boolean
language plpgsql immutable set search_path = '' as $$
declare k text; v jsonb; total int := 0; seen int[] := '{}'; e jsonb; id int;
begin
  if p is null or jsonb_typeof(p) <> 'object' then return false; end if;
  for k, v in select * from jsonb_each(p) loop
    if k not in ('S', 'A', 'B', 'C', 'D') or jsonb_typeof(v) <> 'array' or jsonb_array_length(v) > 30 then return false; end if;
    for e in select * from jsonb_array_elements(v) loop
      if jsonb_typeof(e) <> 'number' then return false; end if;
      id := (e #>> '{}')::numeric::int;
      if id <= 0 or id > 9999999 or (e #>> '{}')::numeric <> id or id = any (seen) then return false; end if;
      seen := seen || id;
      total := total + 1;
    end loop;
  end loop;
  return total between 3 and 60;
end $$;

create or replace function private.submit_tierlist(p_topic text, p_tiers jsonb) returns timestamptz
language plpgsql security definer set search_path = public as $$
declare uid uuid := private.real_user(); at timestamptz;
begin
  if not exists (select 1 from public.profiles where id = uid) then raise exception 'no_username' using errcode = '42501'; end if;
  if not private.valid_tiers(p_tiers) then raise exception 'invalid_tiers' using errcode = '22023'; end if;
  if exists (select 1 from public.tierlists where user_id = uid and updated_at > now() - interval '60 seconds') then
    raise exception 'too_fast' using errcode = '54000';
  end if;
  insert into public.tierlists as t (user_id, topic, tiers) values (uid, p_topic, p_tiers)
  on conflict (user_id) do update set topic = excluded.topic, tiers = excluded.tiers, updated_at = now()
  returning t.updated_at into at;
  return at;
end $$;

create or replace function private.tierlist_feed(p_limit int) returns table (username text, topic text, tiers jsonb, updated_at timestamptz)
language sql stable security definer set search_path = '' as $$
  select p.username::text, t.topic, t.tiers, t.updated_at
  from public.tierlists t join public.profiles p on p.id = t.user_id
  where not t.hidden order by t.updated_at desc limit least(greatest(coalesce(p_limit, 20), 1), 50);
$$;

create or replace function private.my_tierlist() returns table (topic text, tiers jsonb, updated_at timestamptz, hidden boolean)
language sql stable security definer set search_path = '' as $$
  select t.topic, t.tiers, t.updated_at, t.hidden from public.tierlists t where t.user_id = auth.uid();
$$;

create or replace function private.delete_my_tierlist() returns boolean
language sql security definer set search_path = '' as $$
  with d as (delete from public.tierlists t where t.user_id = private.real_user() returning 1) select exists (select 1 from d);
$$;

create or replace function private.admin_hide_tierlist(p_username text, p_hidden boolean) returns boolean
language plpgsql security definer set search_path = public as $$
begin
  if not private.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  update public.tierlists t set hidden = p_hidden from public.profiles p where p.id = t.user_id and p.username = p_username::extensions.citext;
  return found;
end $$;

create or replace function public.submit_tierlist(p_topic text, p_tiers jsonb) returns timestamptz
language sql security invoker set search_path = '' as $$ select private.submit_tierlist(p_topic, p_tiers); $$;
create or replace function public.tierlist_feed(p_limit int default 20) returns table (username text, topic text, tiers jsonb, updated_at timestamptz)
language sql stable security invoker set search_path = '' as $$ select * from private.tierlist_feed(p_limit); $$;
create or replace function public.my_tierlist() returns table (topic text, tiers jsonb, updated_at timestamptz, hidden boolean)
language sql stable security invoker set search_path = '' as $$ select * from private.my_tierlist(); $$;
create or replace function public.delete_my_tierlist() returns boolean
language sql security invoker set search_path = '' as $$ select private.delete_my_tierlist(); $$;
create or replace function public.admin_hide_tierlist(p_username text, p_hidden boolean default true) returns boolean
language sql security invoker set search_path = '' as $$ select private.admin_hide_tierlist(p_username, p_hidden); $$;

revoke execute on function private.valid_tiers(jsonb), private.submit_tierlist(text, jsonb), private.tierlist_feed(int), private.my_tierlist(),
  private.delete_my_tierlist(), private.admin_hide_tierlist(text, boolean) from public, anon, authenticated;
grant execute on function private.tierlist_feed(int) to anon, authenticated;
grant execute on function private.submit_tierlist(text, jsonb), private.my_tierlist(), private.delete_my_tierlist(),
  private.admin_hide_tierlist(text, boolean) to authenticated;
revoke execute on function public.submit_tierlist(text, jsonb), public.tierlist_feed(int), public.my_tierlist(), public.delete_my_tierlist(),
  public.admin_hide_tierlist(text, boolean) from public, anon;
grant execute on function public.tierlist_feed(int) to anon, authenticated;
grant execute on function public.submit_tierlist(text, jsonb), public.my_tierlist(), public.delete_my_tierlist(), public.admin_hide_tierlist(text, boolean) to authenticated;

-- ===== 20261108000000_clans.sql
-- 1.93 (author): clans. A player with a name founds a clan (15.000 coins, paid in the save) with a name, crest and kit,
-- others join it (20 at most). Juegos del Clan: every member plays up to 3 matches a day on the clan arena and the points
-- add up for the clan; at the end of each week (Monday 00:00, Madrid) the clans are ranked and their members claim prizes
-- (TOP 1, TOP 3, TOP 8, the rest). Roles: lider (everything), oficial (answers requests, expels plain members), miembro.
-- A clan is open (anyone joins) or by request (a leader or officer accepts). Weekly clan missions pay every member who played for the clan that week. Names go
-- through a banned-word list. Tables closed to the API; everything through the functions below.

-- ---------------------------------------------------------------- weeks and days on the Madrid clock
create or replace function private.clan_day() returns date language sql stable set search_path = '' as $$
  select (now() at time zone 'Europe/Madrid')::date;
$$;
create or replace function private.clan_week(p_at timestamptz default now()) returns date language sql stable set search_path = '' as $$
  select date_trunc('week', p_at at time zone 'Europe/Madrid')::date;
$$;

-- ---------------------------------------------------------------- names
-- whole: only as a whole word (short words that hide inside normal ones: «Círculo», «Disputa»); otherwise anywhere
create table if not exists private.clan_banned_words (word text primary key, whole boolean not null default false);
insert into private.clan_banned_words (word, whole) values
  ('mierda', false), ('joder', false), ('gilipollas', false), ('subnormal', false), ('retrasado', false), ('maricon', false), ('bollera', false),
  ('negrata', false), ('hitler', false), ('violacion', false), ('violador', false), ('pedofilo', false), ('pederasta', false), ('hijoputa', false),
  ('hijodeputa', false), ('porno', false), ('fuck', false), ('pussy', false), ('nigger', false), ('nigga', false), ('faggot', false), ('whore', false),
  ('inazurvivors', false), ('inazurivors', false), ('astrastorm', false), ('moderador', false),
  ('puta', true), ('puto', true), ('putas', true), ('putos', true), ('polla', true), ('pollas', true), ('folla', true), ('follar', true),
  ('culo', true), ('culos', true), ('perra', true), ('zorra', true), ('tetas', true), ('sexo', true), ('semen', true), ('vagina', true),
  ('cabron', true), ('cabrones', true), ('marica', true), ('mongolo', true), ('travelo', true), ('sudaca', true), ('panchito', true),
  ('nazi', true), ('nazis', true), ('heil', true), ('kkk', true), ('violar', true), ('hdp', true), ('ctm', true), ('shit', true), ('bitch', true),
  ('cunt', true), ('dick', true), ('slut', true), ('porn', true), ('penis', true), ('retard', true), ('admin', true), ('staff', true),
  ('oficial', true), ('levels', true)
on conflict do nothing;

-- letters only, lower case, no accents, the usual digit swaps undone (p0ll4 -> polla)
create or replace function private.clan_name_key(p text) returns text language sql immutable set search_path = '' as $$
  select regexp_replace(translate(lower(coalesce(p, '')), 'áéíóúüñàèìòù013457@$', 'aeiouunaeiouoieastas'), '[^a-z]', '', 'g');
$$;

create or replace function private.clan_name_ok(p text) returns text language plpgsql stable set search_path = '' as $$
declare clean text := regexp_replace(trim(coalesce(p, '')), '\s+', ' ', 'g'); k text;
begin
  if clean !~ '^[A-Za-z0-9ÁÉÍÓÚÜÑáéíóúüñ _.-]{3,20}$' or clean !~ '[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]' then
    raise exception 'invalid_clan_name' using errcode = '22023';
  end if;
  k := private.clan_name_key(clean);
  if exists (select 1 from private.clan_banned_words w where not w.whole and position(w.word in k) > 0)
     or exists (select 1 from private.clan_banned_words w, regexp_split_to_table(lower(clean), '[\s_.-]+') part
                where w.whole and private.clan_name_key(part) = w.word) then
    raise exception 'banned_clan_name' using errcode = '22023';
  end if;
  return clean;
end $$;

-- ---------------------------------------------------------------- tables
create table if not exists public.clans (
  id bigint generated always as identity primary key,
  name extensions.citext not null unique,
  crest text not null default '' check (char_length(crest) <= 64),
  kit text not null default '' check (char_length(kit) <= 64),
  leader uuid not null references public.profiles (id),
  mode text not null default 'solicitud' check (mode in ('abierto', 'solicitud')),
  members int not null default 1,
  created_at timestamptz not null default now()
);
create table if not exists public.clan_members (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  clan_id bigint not null references public.clans (id) on delete cascade,
  role text not null default 'miembro' check (role in ('lider', 'oficial', 'miembro')),
  joined_at timestamptz not null default now()
);
create index if not exists clan_members_clan on public.clan_members (clan_id);
create table if not exists public.clan_requests (
  user_id uuid not null references public.profiles (id) on delete cascade,
  clan_id bigint not null references public.clans (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, clan_id)
);
create index if not exists clan_requests_clan on public.clan_requests (clan_id);
create table if not exists public.clan_runs (
  id bigint generated always as identity primary key,
  clan_id bigint not null,
  user_id uuid not null references public.profiles (id) on delete cascade,
  run_id text not null check (char_length(run_id) between 1 and 64),
  day date not null,
  week date not null,
  points int not null check (points >= 0),
  kills int not null default 0,
  victory boolean not null default false,
  created_at timestamptz not null default now(),
  unique (user_id, run_id)
);
create index if not exists clan_runs_week on public.clan_runs (week, clan_id);
create index if not exists clan_runs_user_day on public.clan_runs (user_id, day);
-- the closed weeks: position and prize tier of every clan that scored
create table if not exists public.clan_week_results (
  week date not null,
  clan_id bigint not null,
  name text not null,
  points bigint not null,
  pos int not null,
  tier text not null check (tier in ('top1', 'top3', 'top8', 'resto')),
  primary key (week, clan_id)
);
-- what each player has taken: weekly prizes ('premio', ref = week) and missions ('mision', ref = week:id). The coins and
-- fichas are counted by the save's economy cap.
create table if not exists public.clan_rewards (
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in ('premio', 'mision')),
  ref text not null,
  coins int not null default 0,
  tokens int not null default 0,
  claimed_at timestamptz not null default now(),
  primary key (user_id, kind, ref)
);
alter table public.clans enable row level security;
alter table public.clan_members enable row level security;
alter table public.clan_requests enable row level security;
alter table public.clan_runs enable row level security;
alter table public.clan_week_results enable row level security;
alter table public.clan_rewards enable row level security;
revoke all on table public.clans, public.clan_members, public.clan_requests, public.clan_runs, public.clan_week_results, public.clan_rewards from public, anon, authenticated;

-- ---------------------------------------------------------------- rules shared with src/systems/clans.ts
create or replace function private.clan_prize(p_tier text) returns table (coins int, tokens int) language sql immutable set search_path = '' as $$
  select v.c, v.k from (values ('top1', 100000, 500), ('top3', 50000, 300), ('top8', 25000, 300), ('resto', 10000, 100)) v (t, c, k) where v.t = p_tier
  union all select 0, 0 where p_tier not in ('top1', 'top3', 'top8', 'resto');
$$;
-- weekly missions: id, what is counted, goal, coins, fichas
create or replace function private.clan_missions_def() returns table (id text, kind text, goal bigint, coins int, tokens int) language sql immutable set search_path = '' as $$
  select * from (values
    ('partidas', 'runs', 30::bigint, 5000, 30),
    ('victorias', 'wins', 15::bigint, 10000, 30),
    ('rivales', 'kills', 15000::bigint, 10000, 50),
    ('puntos', 'points', 250000::bigint, 15000, 50),
    ('todos', 'everyone', 1::bigint, 10000, 50)
  ) v (id, kind, goal, coins, tokens);
$$;

create or replace function private.clan_points(p_kills int, p_time int, p_damage bigint, p_rank text, p_victory boolean) returns int
language sql immutable set search_path = '' as $$
  select floor((least(greatest(p_kills, 0), 4000) * 3 + least(greatest(p_time, 0), 900) * 2 + floor(sqrt(least(greatest(p_damage, 0), 20000000)))
    + case when p_victory then 300 else 0 end)
    * case p_rank when 'X' then 2.2 when 'S' then 1.8 when 'A' then 1.5 when 'B' then 1.25 else 1 end)::int;
$$;

-- closes a finished week once: every clan that scored, ranked by points (ties: the one that got there first)
create or replace function private.close_clan_week(p_week date) returns void language plpgsql security definer set search_path = public as $$
begin
  if p_week >= private.clan_week() then return; end if;
  if exists (select 1 from public.clan_week_results where week = p_week) then return; end if;
  perform pg_advisory_xact_lock(hashtext('close_clan_week'), (p_week - date '2026-01-01'));
  if exists (select 1 from public.clan_week_results where week = p_week) then return; end if;
  insert into public.clan_week_results (week, clan_id, name, points, pos, tier)
  select p_week, s.clan_id, coalesce(c.name::text, 'Clan disuelto'), s.pts, s.pos,
    case when s.pos = 1 then 'top1' when s.pos <= 3 then 'top3' when s.pos <= 8 then 'top8' else 'resto' end
  from (select r.clan_id, sum(r.points)::bigint as pts, row_number() over (order by sum(r.points) desc, max(r.created_at)) as pos
        from public.clan_runs r where r.week = p_week group by r.clan_id having sum(r.points) > 0) s
  left join public.clans c on c.id = s.clan_id
  on conflict do nothing;
end $$;

-- ---------------------------------------------------------------- membership
create or replace function private.clan_create(p_name text, p_crest text, p_kit text) returns bigint
language plpgsql security definer set search_path = public as $$
declare uid uuid := private.real_user(); clean text; new_id bigint;
begin
  if not exists (select 1 from public.profiles where id = uid) then raise exception 'no_username' using errcode = '42501'; end if;
  if exists (select 1 from public.clan_members where user_id = uid) then raise exception 'already_in_clan' using errcode = '23505'; end if;
  clean := private.clan_name_ok(p_name);
  if exists (select 1 from public.clans where name = clean::extensions.citext) then raise exception 'clan_name_taken' using errcode = '23505'; end if;
  insert into public.clans (name, crest, kit, leader) values (clean, left(coalesce(p_crest, ''), 64), left(coalesce(p_kit, ''), 64), uid) returning id into new_id;
  insert into public.clan_members (user_id, clan_id, role) values (uid, new_id, 'lider');
  delete from public.clan_requests where user_id = uid;
  return new_id;
exception when unique_violation then
  if exists (select 1 from public.clan_members where user_id = uid) then raise exception 'already_in_clan' using errcode = '23505'; end if;
  raise exception 'clan_name_taken' using errcode = '23505';
end $$;

create or replace function private.clan_update(p_name text, p_crest text, p_kit text, p_mode text) returns boolean
language plpgsql security definer set search_path = public as $$
declare uid uuid := private.real_user(); cid bigint; clean text;
begin
  select clan_id into cid from public.clan_members where user_id = uid and role = 'lider';
  if cid is null then raise exception 'not_leader' using errcode = '42501'; end if;
  if p_name is not null then
    clean := private.clan_name_ok(p_name);
    if exists (select 1 from public.clans where name = clean::extensions.citext and id <> cid) then raise exception 'clan_name_taken' using errcode = '23505'; end if;
  end if;
  if p_mode is not null and p_mode not in ('abierto', 'solicitud') then raise exception 'invalid_mode' using errcode = '22023'; end if;
  update public.clans set name = coalesce(clean, name), crest = coalesce(left(p_crest, 64), crest), kit = coalesce(left(p_kit, 64), kit),
    mode = coalesce(p_mode, mode) where id = cid;
  return true;
end $$;

-- puts a player in a clan (checked: has a name, in no clan, room left); his other requests go away
create or replace function private.clan_add(p_user uuid, p_clan bigint) returns void language plpgsql security definer set search_path = public as $$
declare n int;
begin
  if exists (select 1 from public.clan_members where user_id = p_user) then raise exception 'already_in_clan' using errcode = '23505'; end if;
  select members into n from public.clans where id = p_clan for update;
  if n is null then raise exception 'clan_not_found' using errcode = 'P0002'; end if;
  if n >= 20 then raise exception 'clan_full' using errcode = '54000'; end if;
  insert into public.clan_members (user_id, clan_id) values (p_user, p_clan);
  update public.clans set members = members + 1 where id = p_clan;
  delete from public.clan_requests where user_id = p_user;
end $$;

-- an open clan takes the player at once; one by request keeps it until a leader or officer answers (3 requests at most)
create or replace function private.clan_request(p_clan bigint) returns text
language plpgsql security definer set search_path = public as $$
declare uid uuid := private.real_user(); m text;
begin
  if not exists (select 1 from public.profiles where id = uid) then raise exception 'no_username' using errcode = '42501'; end if;
  if exists (select 1 from public.clan_members where user_id = uid) then raise exception 'already_in_clan' using errcode = '23505'; end if;
  select mode into m from public.clans where id = p_clan;
  if m is null then raise exception 'clan_not_found' using errcode = 'P0002'; end if;
  if m = 'abierto' then perform private.clan_add(uid, p_clan); return 'joined'; end if;
  if exists (select 1 from public.clan_requests where user_id = uid and clan_id = p_clan) then return 'requested'; end if;
  if (select count(*) from public.clan_requests where user_id = uid) >= 3 then raise exception 'too_many_requests' using errcode = '54000'; end if;
  insert into public.clan_requests (user_id, clan_id) values (uid, p_clan);
  return 'requested';
end $$;

create or replace function private.clan_cancel_request(p_clan bigint) returns boolean language sql security definer set search_path = '' as $$
  with d as (delete from public.clan_requests r where r.user_id = private.real_user() and r.clan_id = p_clan returning 1) select exists (select 1 from d);
$$;

create or replace function private.my_clan_requests() returns table (id bigint, name text, crest text, created_at timestamptz)
language sql stable security definer set search_path = '' as $$
  select c.id, c.name::text, c.crest, r.created_at from public.clan_requests r join public.clans c on c.id = r.clan_id where r.user_id = auth.uid() order by r.created_at;
$$;

-- the clan's role of the caller, if he can manage (lider or oficial)
create or replace function private.clan_manager() returns table (clan_id bigint, role text) language sql stable security definer set search_path = '' as $$
  select m.clan_id, m.role from public.clan_members m where m.user_id = private.real_user() and m.role in ('lider', 'oficial');
$$;

create or replace function private.clan_requests() returns table (username text, avatar text, created_at timestamptz)
language plpgsql stable security definer set search_path = public as $$
declare cid bigint;
begin
  select x.clan_id into cid from private.clan_manager() x;
  if cid is null then raise exception 'not_leader' using errcode = '42501'; end if;
  return query select p.username::text, p.avatar, r.created_at from public.clan_requests r join public.profiles p on p.id = r.user_id
    where r.clan_id = cid order by r.created_at;
end $$;

create or replace function private.clan_answer(p_username text, p_accept boolean) returns boolean
language plpgsql security definer set search_path = public as $$
declare cid bigint; target uuid;
begin
  select x.clan_id into cid from private.clan_manager() x;
  if cid is null then raise exception 'not_leader' using errcode = '42501'; end if;
  select r.user_id into target from public.clan_requests r join public.profiles p on p.id = r.user_id
    where r.clan_id = cid and p.username = p_username::extensions.citext;
  if target is null then return false; end if;
  if not p_accept then delete from public.clan_requests where user_id = target and clan_id = cid; return true; end if;
  if exists (select 1 from public.clan_members where user_id = target) then
    delete from public.clan_requests where user_id = target;
    raise exception 'already_in_clan' using errcode = '23505';
  end if;
  perform private.clan_add(target, cid);
  return true;
end $$;

-- leaving: the leader hands the clan to an officer (or else the longest-standing member); the last one out dissolves it
create or replace function private.clan_drop(p_user uuid) returns void language plpgsql security definer set search_path = public as $$
declare cid bigint; was text; heir uuid;
begin
  delete from public.clan_members where user_id = p_user returning clan_id, role into cid, was;
  if cid is null then return; end if;
  update public.clans set members = greatest(0, members - 1) where id = cid;
  if was = 'lider' then
    select user_id into heir from public.clan_members where clan_id = cid order by role = 'oficial' desc, joined_at limit 1;
    if heir is null then delete from public.clans where id = cid; return; end if;
    update public.clan_members set role = 'lider' where user_id = heir;
    update public.clans set leader = heir where id = cid;
  end if;
end $$;

create or replace function private.clan_leave() returns boolean language plpgsql security definer set search_path = public as $$
declare uid uuid := private.real_user();
begin
  if not exists (select 1 from public.clan_members where user_id = uid) then return false; end if;
  perform private.clan_drop(uid);
  return true;
end $$;

-- the leader expels anyone; an officer only plain members
create or replace function private.clan_kick(p_username text) returns boolean language plpgsql security definer set search_path = public as $$
declare me record; target uuid; trole text;
begin
  select * into me from private.clan_manager();
  if me.clan_id is null then raise exception 'not_leader' using errcode = '42501'; end if;
  select m.user_id, m.role into target, trole from public.clan_members m join public.profiles p on p.id = m.user_id
    where m.clan_id = me.clan_id and p.username = p_username::extensions.citext and m.user_id <> auth.uid();
  if target is null then return false; end if;
  if me.role = 'oficial' and trole <> 'miembro' then raise exception 'not_leader' using errcode = '42501'; end if;
  perform private.clan_drop(target);
  return true;
end $$;

-- the leader names officers (or takes it back) and can hand the leadership over (he becomes an officer)
create or replace function private.clan_set_role(p_username text, p_role text) returns boolean language plpgsql security definer set search_path = public as $$
declare uid uuid := private.real_user(); cid bigint; target uuid;
begin
  select clan_id into cid from public.clan_members where user_id = uid and role = 'lider';
  if cid is null then raise exception 'not_leader' using errcode = '42501'; end if;
  if p_role not in ('lider', 'oficial', 'miembro') then raise exception 'invalid_role' using errcode = '22023'; end if;
  select m.user_id into target from public.clan_members m join public.profiles p on p.id = m.user_id
    where m.clan_id = cid and p.username = p_username::extensions.citext and m.user_id <> uid;
  if target is null then return false; end if;
  if p_role = 'lider' then
    update public.clan_members set role = 'oficial' where user_id = uid;
    update public.clans set leader = target where id = cid;
  end if;
  update public.clan_members set role = p_role where user_id = target;
  return true;
end $$;

-- ---------------------------------------------------------------- reading
create or replace function private.clan_search(p_query text) returns table (id bigint, name text, crest text, kit text, members int, week_points bigint, mode text)
language sql stable security definer set search_path = '' as $$
  select c.id, c.name::text, c.crest, c.kit, c.members,
    coalesce((select sum(r.points) from public.clan_runs r where r.clan_id = c.id and r.week = private.clan_week()), 0)::bigint as wp, c.mode
  from public.clans c
  where coalesce(trim(p_query), '') = '' or c.name::text ilike '%' || replace(replace(trim(p_query), '%', ''), '_', '\_') || '%'
  order by wp desc, c.members desc, c.id limit 30;
$$;

create or replace function private.clan_ranking() returns table (pos bigint, id bigint, name text, crest text, kit text, members int, points bigint)
language sql stable security definer set search_path = '' as $$
  select row_number() over (order by s.pts desc, s.last), c.id, c.name::text, c.crest, c.kit, c.members, s.pts
  from (select r.clan_id, sum(r.points)::bigint as pts, max(r.created_at) as last from public.clan_runs r where r.week = private.clan_week() group by r.clan_id) s
  join public.clans c on c.id = s.clan_id
  order by s.pts desc, s.last limit 50;
$$;

create or replace function private.clan_last_week() returns table (pos int, name text, points bigint, tier text) language plpgsql security definer set search_path = public as $$
begin
  perform private.close_clan_week(private.clan_week() - 7);
  return query select r.pos, r.name, r.points, r.tier from public.clan_week_results r where r.week = private.clan_week() - 7 order by r.pos limit 8;
end $$;

-- the player's clan: the clan, its members (today's matches and this week's points), its position this week, its missions
create or replace function private.my_clan() returns jsonb language plpgsql stable security definer set search_path = public as $$
declare uid uuid := auth.uid(); cid bigint; w date := private.clan_week(); d date := private.clan_day(); out jsonb;
begin
  select clan_id into cid from public.clan_members where user_id = uid;
  if cid is null then return null; end if;
  select jsonb_build_object(
    'id', c.id, 'name', c.name::text, 'crest', c.crest, 'kit', c.kit, 'members', c.members, 'created_at', c.created_at,
    'me', (select role from public.clan_members where user_id = uid), 'mode', c.mode,
    'requests', case when (select role from public.clan_members where user_id = uid) in ('lider', 'oficial')
      then (select count(*) from public.clan_requests q where q.clan_id = c.id) else 0 end,
    'runsToday', (select count(*) from public.clan_runs r where r.user_id = uid and r.day = d),
    'weekPoints', coalesce((select sum(points) from public.clan_runs r where r.clan_id = c.id and r.week = w), 0),
    'pos', (select x.pos from (select r.clan_id, row_number() over (order by sum(r.points) desc, max(r.created_at)) as pos
                                from public.clan_runs r where r.week = w group by r.clan_id) x where x.clan_id = c.id),
    'clans', (select count(distinct r.clan_id) from public.clan_runs r where r.week = w),
    'roster', (select coalesce(jsonb_agg(jsonb_build_object('username', p.username::text, 'avatar', p.avatar, 'role', m.role,
                  'today', (select count(*) from public.clan_runs r where r.user_id = m.user_id and r.day = d),
                  'week', coalesce((select sum(points) from public.clan_runs r where r.user_id = m.user_id and r.clan_id = c.id and r.week = w), 0))
                order by m.role = 'lider' desc, m.role = 'oficial' desc, m.joined_at), '[]'::jsonb)
               from public.clan_members m join public.profiles p on p.id = m.user_id where m.clan_id = c.id),
    'missions', (select jsonb_agg(jsonb_build_object('id', md.id, 'goal', md.goal, 'coins', md.coins, 'tokens', md.tokens,
                  'progress', case md.kind
                    when 'runs' then (select count(*) from public.clan_runs r where r.clan_id = c.id and r.week = w)
                    when 'wins' then (select count(*) from public.clan_runs r where r.clan_id = c.id and r.week = w and r.victory)
                    when 'kills' then (select coalesce(sum(kills), 0) from public.clan_runs r where r.clan_id = c.id and r.week = w)
                    when 'points' then (select coalesce(sum(points), 0) from public.clan_runs r where r.clan_id = c.id and r.week = w)
                    else (case when c.members >= 3 and not exists (select 1 from public.clan_members m2 where m2.clan_id = c.id
                            and not exists (select 1 from public.clan_runs r where r.user_id = m2.user_id and r.clan_id = c.id and r.week = w)) then 1 else 0 end) end,
                  'claimed', exists (select 1 from public.clan_rewards cr where cr.user_id = uid and cr.kind = 'mision' and cr.ref = w::text || ':' || md.id)))
               from private.clan_missions_def() md))
  into out from public.clans c where c.id = cid;
  return out;
end $$;

-- ---------------------------------------------------------------- Juegos del Clan
create or replace function private.clan_submit_run(p_run_id text, p_kills int, p_time_sec int, p_damage bigint, p_rank text, p_victory boolean) returns jsonb
language plpgsql security definer set search_path = public as $$
declare uid uuid := private.real_user(); cid bigint; d date := private.clan_day(); n int; pts int;
begin
  select clan_id into cid from public.clan_members where user_id = uid;
  if cid is null then raise exception 'not_in_clan' using errcode = '42501'; end if;
  if p_rank not in ('C', 'B', 'A', 'S', 'X') then raise exception 'invalid_rank' using errcode = '22023'; end if;
  perform pg_advisory_xact_lock(hashtext('clan_run'), hashtext(uid::text));
  if exists (select 1 from public.clan_runs where user_id = uid and run_id = p_run_id) then raise exception 'duplicate' using errcode = '23505'; end if;
  select count(*) into n from public.clan_runs where user_id = uid and day = d;
  if n >= 3 then raise exception 'clan_daily_limit' using errcode = '54000'; end if;
  pts := private.clan_points(p_kills, p_time_sec, p_damage, p_rank, p_victory);
  insert into public.clan_runs (clan_id, user_id, run_id, day, week, points, kills, victory)
    values (cid, uid, p_run_id, d, private.clan_week(), pts, least(greatest(p_kills, 0), 4000), coalesce(p_victory, false));
  return jsonb_build_object('points', pts, 'left', 2 - n,
    'weekPoints', (select coalesce(sum(points), 0) from public.clan_runs where clan_id = cid and week = private.clan_week()));
end $$;

-- ---------------------------------------------------------------- rewards
-- weekly prizes of the last 4 closed weeks not taken yet, for the clan the player played for that week (the one he
-- gave the most points to); only players who played at least once for it get anything
create or replace function private.clan_claim_prizes() returns table (week date, clan text, pos int, tier text, coins int, tokens int)
language plpgsql security definer set search_path = public as $$
declare uid uuid := private.real_user(); w date; k int; cid bigint; res record; pz record;
begin
  for k in 1..4 loop
    w := private.clan_week() - 7 * k;
    perform private.close_clan_week(w);
    if exists (select 1 from public.clan_rewards cr where cr.user_id = uid and cr.kind = 'premio' and cr.ref = w::text) then continue; end if;
    select r.clan_id into cid from public.clan_runs r where r.user_id = uid and r.week = w group by r.clan_id order by sum(r.points) desc limit 1;
    if cid is null then continue; end if;
    select * into res from public.clan_week_results x where x.week = w and x.clan_id = cid;
    if res is null then continue; end if;
    select * into pz from private.clan_prize(res.tier);
    insert into public.clan_rewards (user_id, kind, ref, coins, tokens) values (uid, 'premio', w::text, pz.coins, pz.tokens) on conflict do nothing;
    if found then
      week := w; clan := res.name; pos := res.pos; tier := res.tier; coins := pz.coins; tokens := pz.tokens;
      return next;
    end if;
  end loop;
end $$;

create or replace function private.clan_claim_mission(p_id text) returns jsonb language plpgsql security definer set search_path = public as $$
declare uid uuid := private.real_user(); w date := private.clan_week(); info jsonb; m jsonb;
begin
  if not exists (select 1 from public.clan_runs r join public.clan_members cm on cm.user_id = r.user_id and cm.clan_id = r.clan_id
                 where r.user_id = uid and r.week = w) then
    raise exception 'play_first' using errcode = '42501';
  end if;
  select private.my_clan() into info;
  select x into m from jsonb_array_elements(info -> 'missions') x where x ->> 'id' = p_id;
  if m is null then raise exception 'mission_not_found' using errcode = 'P0002'; end if;
  if (m ->> 'progress')::bigint < (m ->> 'goal')::bigint then raise exception 'mission_not_done' using errcode = '54000'; end if;
  insert into public.clan_rewards (user_id, kind, ref, coins, tokens) values (uid, 'mision', w::text || ':' || p_id, (m ->> 'coins')::int, (m ->> 'tokens')::int)
  on conflict do nothing;
  if not found then raise exception 'already_claimed' using errcode = '23505'; end if;
  return jsonb_build_object('coins', (m ->> 'coins')::int, 'tokens', (m ->> 'tokens')::int);
end $$;

-- ---------------------------------------------------------------- admin
create or replace function private.admin_clan(p_name text, p_new_name text, p_dissolve boolean) returns boolean
language plpgsql security definer set search_path = public as $$
declare cid bigint;
begin
  if not private.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  select id into cid from public.clans where name = p_name::extensions.citext;
  if cid is null then return false; end if;
  if p_dissolve then delete from public.clans where id = cid; return true; end if;
  update public.clans set name = private.clan_name_ok(p_new_name) where id = cid;
  return true;
end $$;

-- ---------------------------------------------------------------- the save's economy cap counts clan rewards too
create or replace function private.economy_cap(p_new jsonb, p_old jsonb, p_since timestamptz, p_uid uuid) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  hours numeric := greatest(0, extract(epoch from (now() - coalesce(p_since, now()))) / 3600);
  promo_t numeric := 0; promo_c numeric := 0; bug_t numeric := 0; clan_t numeric := 0; clan_c numeric := 0;
  old_t numeric; old_c numeric; new_t numeric; new_c numeric; max_t numeric; max_c numeric;
  out jsonb := p_new;
begin
  if to_regclass('private.promo_redemptions') is not null then
    execute 'select coalesce(sum((r.result ->> ''tokens'')::numeric), 0), coalesce(sum((r.result ->> ''coins'')::numeric), 0)
      from private.promo_redemptions r where r.user_id = $1 and r.created_at > coalesce($2, ''-infinity''::timestamptz)'
      into promo_t, promo_c using p_uid, p_since;
  end if;
  select coalesce(sum(b.tokens), 0) into bug_t from private.bug_rewards b
    where b.user_id = p_uid and b.claimed_at is not null and b.claimed_at > coalesce(p_since, '-infinity'::timestamptz);
  select coalesce(sum(c.tokens), 0), coalesce(sum(c.coins), 0) into clan_t, clan_c from public.clan_rewards c
    where c.user_id = p_uid and c.claimed_at > coalesce(p_since, '-infinity'::timestamptz);
  promo_t := promo_t + bug_t + clan_t;
  promo_c := promo_c + clan_c;
  new_t := case when jsonb_typeof(p_new -> 'tokens') = 'number' then (p_new ->> 'tokens')::numeric else 0 end;
  new_c := case when jsonb_typeof(p_new -> 'coins') = 'number' then (p_new ->> 'coins')::numeric else 0 end;
  if p_old is null then
    max_t := 5000 + promo_t; max_c := 120000 + promo_c;
  else
    old_t := case when jsonb_typeof(p_old -> 'tokens') = 'number' then greatest(0, (p_old ->> 'tokens')::numeric) else 0 end;
    old_c := case when jsonb_typeof(p_old -> 'coins') = 'number' then greatest(0, (p_old ->> 'coins')::numeric) else 0 end;
    max_t := old_t + 2000 + 1000 * hours + promo_t;
    max_c := old_c + 16000 + 16000 * hours + promo_c;
  end if;
  if new_t > max_t then out := jsonb_set(out, '{tokens}', to_jsonb(floor(max_t)::bigint)); end if;
  if new_c > max_c then out := jsonb_set(out, '{coins}', to_jsonb(floor(max_c)::bigint)); end if;
  return out;
end $$;
revoke all on function private.economy_cap(jsonb, jsonb, timestamptz, uuid) from public, anon, authenticated;

-- ---------------------------------------------------------------- API wrappers
create or replace function public.clan_create(p_name text, p_crest text default '', p_kit text default '') returns bigint
language sql security invoker set search_path = '' as $$ select private.clan_create(p_name, p_crest, p_kit); $$;
create or replace function public.clan_update(p_name text default null, p_crest text default null, p_kit text default null, p_mode text default null) returns boolean
language sql security invoker set search_path = '' as $$ select private.clan_update(p_name, p_crest, p_kit, p_mode); $$;
create or replace function public.clan_request(p_clan bigint) returns text language sql security invoker set search_path = '' as $$ select private.clan_request(p_clan); $$;
create or replace function public.clan_cancel_request(p_clan bigint) returns boolean language sql security invoker set search_path = '' as $$ select private.clan_cancel_request(p_clan); $$;
create or replace function public.my_clan_requests() returns table (id bigint, name text, crest text, created_at timestamptz)
language sql stable security invoker set search_path = '' as $$ select * from private.my_clan_requests(); $$;
create or replace function public.clan_requests() returns table (username text, avatar text, created_at timestamptz)
language sql stable security invoker set search_path = '' as $$ select * from private.clan_requests(); $$;
create or replace function public.clan_answer(p_username text, p_accept boolean) returns boolean language sql security invoker set search_path = '' as $$ select private.clan_answer(p_username, p_accept); $$;
create or replace function public.clan_set_role(p_username text, p_role text) returns boolean language sql security invoker set search_path = '' as $$ select private.clan_set_role(p_username, p_role); $$;
create or replace function public.clan_leave() returns boolean language sql security invoker set search_path = '' as $$ select private.clan_leave(); $$;
create or replace function public.clan_kick(p_username text) returns boolean language sql security invoker set search_path = '' as $$ select private.clan_kick(p_username); $$;
create or replace function public.clan_search(p_query text default '') returns table (id bigint, name text, crest text, kit text, members int, week_points bigint, mode text)
language sql stable security invoker set search_path = '' as $$ select * from private.clan_search(p_query); $$;
create or replace function public.clan_ranking() returns table (pos bigint, id bigint, name text, crest text, kit text, members int, points bigint)
language sql stable security invoker set search_path = '' as $$ select * from private.clan_ranking(); $$;
create or replace function public.clan_last_week() returns table (pos int, name text, points bigint, tier text)
language sql security invoker set search_path = '' as $$ select * from private.clan_last_week(); $$;
create or replace function public.my_clan() returns jsonb language sql stable security invoker set search_path = '' as $$ select private.my_clan(); $$;
create or replace function public.clan_submit_run(p_run_id text, p_kills int, p_time_sec int, p_damage bigint, p_rank text, p_victory boolean) returns jsonb
language sql security invoker set search_path = '' as $$ select private.clan_submit_run(p_run_id, p_kills, p_time_sec, p_damage, p_rank, p_victory); $$;
create or replace function public.clan_claim_prizes() returns table (week date, clan text, pos int, tier text, coins int, tokens int)
language sql security invoker set search_path = '' as $$ select * from private.clan_claim_prizes(); $$;
create or replace function public.clan_claim_mission(p_id text) returns jsonb language sql security invoker set search_path = '' as $$ select private.clan_claim_mission(p_id); $$;
create or replace function public.admin_clan(p_name text, p_new_name text default null, p_dissolve boolean default false) returns boolean
language sql security invoker set search_path = '' as $$ select private.admin_clan(p_name, p_new_name, p_dissolve); $$;

revoke execute on function private.clan_day(), private.clan_week(timestamptz), private.clan_name_key(text), private.clan_name_ok(text),
  private.clan_prize(text), private.clan_missions_def(), private.clan_points(int, int, bigint, text, boolean), private.close_clan_week(date),
  private.clan_create(text, text, text), private.clan_update(text, text, text, text), private.clan_request(bigint), private.clan_cancel_request(bigint), private.my_clan_requests(), private.clan_requests(), private.clan_answer(text, boolean), private.clan_set_role(text, text), private.clan_drop(uuid), private.clan_add(uuid, bigint), private.clan_manager(), private.clan_leave(),
  private.clan_kick(text), private.clan_search(text), private.clan_ranking(), private.clan_last_week(), private.my_clan(),
  private.clan_submit_run(text, int, int, bigint, text, boolean), private.clan_claim_prizes(), private.clan_claim_mission(text),
  private.admin_clan(text, text, boolean) from public, anon, authenticated;
grant execute on function private.clan_search(text), private.clan_ranking(), private.clan_last_week() to anon, authenticated;
grant execute on function private.clan_create(text, text, text), private.clan_update(text, text, text, text), private.clan_request(bigint), private.clan_cancel_request(bigint), private.my_clan_requests(), private.clan_requests(), private.clan_answer(text, boolean), private.clan_set_role(text, text), private.clan_leave(),
  private.clan_kick(text), private.my_clan(), private.clan_submit_run(text, int, int, bigint, text, boolean), private.clan_claim_prizes(),
  private.clan_claim_mission(text), private.admin_clan(text, text, boolean) to authenticated;
revoke execute on function public.clan_create(text, text, text), public.clan_update(text, text, text, text), public.clan_request(bigint), public.clan_cancel_request(bigint), public.my_clan_requests(), public.clan_requests(), public.clan_answer(text, boolean), public.clan_set_role(text, text), public.clan_leave(),
  public.clan_kick(text), public.clan_search(text), public.clan_ranking(), public.clan_last_week(), public.my_clan(),
  public.clan_submit_run(text, int, int, bigint, text, boolean), public.clan_claim_prizes(), public.clan_claim_mission(text),
  public.admin_clan(text, text, boolean) from public, anon;
grant execute on function public.clan_search(text), public.clan_ranking(), public.clan_last_week() to anon, authenticated;
grant execute on function public.clan_create(text, text, text), public.clan_update(text, text, text, text), public.clan_request(bigint), public.clan_cancel_request(bigint), public.my_clan_requests(), public.clan_requests(), public.clan_answer(text, boolean), public.clan_set_role(text, text), public.clan_leave(),
  public.clan_kick(text), public.my_clan(), public.clan_submit_run(text, int, int, bigint, text, boolean), public.clan_claim_prizes(),
  public.clan_claim_mission(text), public.admin_clan(text, text, boolean) to authenticated;

-- ===== 20261108000100_clan_of.sql
-- 1.93 (author): the clan of each player on the ranking. Public: a name, its clan's name and crest (players without a
-- clan are left out). At most 60 names per call.
create or replace function private.clan_of(p_usernames text[]) returns table (username text, clan text, crest text)
language sql stable security definer set search_path = '' as $$
  select p.username::text, c.name::text, c.crest
  from public.profiles p join public.clan_members m on m.user_id = p.id join public.clans c on c.id = m.clan_id
  where lower(p.username::text) in (select lower(x) from unnest(p_usernames[1:60]) x);
$$;
create or replace function public.clan_of(p_usernames text[]) returns table (username text, clan text, crest text)
language sql stable security invoker set search_path = '' as $$ select * from private.clan_of(p_usernames); $$;
revoke execute on function private.clan_of(text[]), public.clan_of(text[]) from public, anon, authenticated;
grant execute on function private.clan_of(text[]), public.clan_of(text[]) to anon, authenticated;

-- ===== 20261109000000_champion_of.sql
-- 2.0 (author: «que en el ranking se vea si es campeón o no»): for each name on the ranking and the captain of its mark,
-- that footballer's Camino del Campeón level in the player's own save (0 none, 1 CAMPEÓN, 2 CAMPEÓN+, 3 CAMPEÓN++).
-- Public, like the clan: one small number per row. At most 60 pairs per call.
create or replace function private.champion_of(p_usernames text[], p_captains integer[])
returns table (username text, captain_id integer, champion integer)
language sql stable security definer set search_path = '' as $$
  select p.username::text, q.cap,
         least(3, greatest(0, coalesce((s.data -> 'owned' -> (q.cap::text) ->> 'champion')::integer, 0)))
  from unnest(p_usernames[1:60], p_captains[1:60]) as q(name, cap)
  join public.profiles p on lower(p.username::text) = lower(q.name)
  join public.saves s on s.user_id = p.id
  where q.cap is not null;
$$;
create or replace function public.champion_of(p_usernames text[], p_captains integer[])
returns table (username text, captain_id integer, champion integer)
language sql stable security invoker set search_path = '' as $$ select * from private.champion_of(p_usernames, p_captains); $$;
revoke execute on function private.champion_of(text[], integer[]), public.champion_of(text[], integer[]) from public, anon, authenticated;
grant execute on function private.champion_of(text[], integer[]), public.champion_of(text[], integer[]) to anon, authenticated;

-- ===== 20261109000100_admin_metrics.sql
-- Métricas (admin): daily activity, peak hours, retention, what people play and how much the social features are used.
-- Same shape as admin_player_stats: body in `private` behind is_admin(), public invoker wrapper. Days are Madrid days.

create or replace function private.admin_metrics(p_days integer default 30) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  d integer := least(greatest(coalesce(p_days, 30), 7), 90);
  today date := (now() at time zone 'Europe/Madrid')::date;
  out jsonb;
begin
  if not private.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  with days as (select generate_series(today - (d - 1), today, interval '1 day')::date as day),
  runs as (select user_id, (at at time zone 'Europe/Madrid') as t from public.submitted_runs where at > now() - make_interval(days => d + 1)),
  signups as (select (created_at at time zone 'Europe/Madrid')::date as day from auth.users where created_at > now() - make_interval(days => d + 1)),
  first_run as (select user_id, min(at) as first_at from public.submitted_runs group by user_id),
  ret as (
    select u.id, u.created_at,
      exists (select 1 from public.submitted_runs r where r.user_id = u.id and r.at >= u.created_at + interval '1 day' and r.at < u.created_at + interval '2 days') as d1,
      exists (select 1 from public.submitted_runs r where r.user_id = u.id and r.at >= u.created_at + interval '7 days') as d7
    from auth.users u join first_run f on f.user_id = u.id
  ),
  st as (select coalesce((data->'stats'->>'runs')::bigint, 0) as runs, coalesce((data->'stats'->>'wins')::bigint, 0) as wins,
    coalesce((data->'stats'->>'pulls')::bigint, 0) as pulls from public.saves)
  select jsonb_build_object(
    'days', d,
    'daily', (select jsonb_agg(jsonb_build_object(
        'day', x.day,
        'new', (select count(*) from signups s where s.day = x.day),
        'players', (select count(distinct user_id) from runs r where r.t::date = x.day),
        'runs', (select count(*) from runs r where r.t::date = x.day)) order by x.day) from days x),
    'hours', (select jsonb_agg(coalesce((select count(*) from runs r where extract(hour from r.t) = h), 0) order by h) from generate_series(0, 23) h),
    'online_now', (select count(*) from private.presence where seen_at > now() - interval '2 minutes'),
    'online_1h', (select count(*) from private.presence where seen_at > now() - interval '1 hour'),
    'retention', jsonb_build_object(
      'd1_base', (select count(*) from ret where created_at < now() - interval '2 days'),
      'd1', (select count(*) from ret where created_at < now() - interval '2 days' and d1),
      'd7_base', (select count(*) from ret where created_at < now() - interval '8 days'),
      'd7', (select count(*) from ret where created_at < now() - interval '8 days' and d7)),
    'totals', jsonb_build_object(
      'runs', (select coalesce(sum(runs), 0) from st), 'wins', (select coalesce(sum(wins), 0) from st),
      'pulls', (select coalesce(sum(pulls), 0) from st)),
    'maps', coalesce((select jsonb_agg(jsonb_build_object('map', map, 'n', n) order by n desc) from
      (select map, count(*) n from public.scores group by map order by n desc limit 10) m), '[]'::jsonb),
    'ranks', coalesce((select jsonb_agg(jsonb_build_object('rank', rank, 'n', n) order by n desc) from
      (select rank, count(*) n from public.scores group by rank) m), '[]'::jsonb),
    'captains', coalesce((select jsonb_agg(jsonb_build_object('id', captain_id, 'n', n) order by n desc) from
      (select captain_id, count(*) n from public.scores where captain_id is not null group by captain_id order by n desc limit 10) m), '[]'::jsonb),
    'social', jsonb_build_object(
      'friendships', (select count(*) from public.friendships where status = 'aceptada'),
      'clans', (select count(*) from public.clans),
      'clan_members', (select count(*) from public.clan_members),
      'coop_7d', (select count(*) from public.coop_rooms where connected_at > now() - interval '7 days'),
      'tierlists', (select count(*) from public.tierlists),
      'bugs_open', (select count(*) from public.bug_reports where status not in ('corregido', 'descartado')),
      'ideas_open', (select count(*) from public.suggestions where status = 'pendiente'))
  ) into out;
  return out;
end $$;
alter function private.admin_metrics(integer) set statement_timeout = '8s';

create or replace function public.admin_metrics(p_days integer default 30) returns jsonb
language sql stable security invoker set search_path = '' as $$ select private.admin_metrics(p_days); $$;

revoke execute on function private.admin_metrics(integer), public.admin_metrics(integer) from public, anon, authenticated;
grant execute on function private.admin_metrics(integer), public.admin_metrics(integer) to authenticated;

notify pgrst, 'reload schema';

-- ===== 20261110000000_rank_z.sql
-- (author) Rango Z: a rank above X. It counts the most on the ranking (×7) and opens with the Tuesday update,
-- 2026-11-10 12:00 Madrid: before that the server refuses Z marks and clan runs. The arena counts too now: points get
-- ×(1 + 5% per step of the path), from the tier in data/maps.json (same table as MAP_TIER in src/systems/leaderboard.ts).
-- Boards are recomputed on the fly, so the marks already stored get the arena multiplier at once.

alter table public.scores drop constraint if exists scores_rank_check;
alter table public.scores add constraint scores_rank_check check (rank in ('C', 'B', 'A', 'S', 'X', 'Z'));

create or replace function private.rank_z_open() returns boolean
language sql stable set search_path = '' as $$ select now() >= timestamptz '2026-11-10 12:00:00+01'; $$;

create or replace function private.map_mult(p_map text) returns numeric
language sql immutable set search_path = '' as $$
  select 1 + (coalesce(case p_map
    when 'raimon' then 1 when 'ribera' then 2 when 'royal' then 3 when 'nara' then 4 when 'zeus' then 5
    when 'alpino' then 6 when 'nevada' then 7 when 'claustro' then 8 when 'naniwa' then 9 when 'yokato' then 10
    when 'marytimes' then 11 when 'fuji' then 12 when 'ehime' then 13 when 'alius' then 14 when 'ruinas' then 15 end, 1) - 1) * 0.05;
$$;

-- the 3-argument form (rank only) keeps deciding which mark of a board is a player's best (same arena, so the same);
-- the 4-argument one is what the boards show and sort by
create or replace function private.score_of(p_rank text, p_time_sec integer, p_damage bigint) returns bigint
language sql immutable set search_path = '' as $$
  select round((greatest(p_time_sec, 0) * 10 + sqrt(greatest(p_damage, 0)::numeric) * 2)
    * case p_rank when 'Z' then 7 when 'X' then 4.8 when 'S' then 3.4 when 'A' then 2.4 when 'B' then 1.6 else 1 end)::bigint;
$$;

create or replace function private.score_of(p_map text, p_rank text, p_time_sec integer, p_damage bigint) returns bigint
language sql immutable set search_path = '' as $$
  select round((greatest(p_time_sec, 0) * 10 + sqrt(greatest(p_damage, 0)::numeric) * 2)
    * case p_rank when 'Z' then 7 when 'X' then 4.8 when 'S' then 3.4 when 'A' then 2.4 when 'B' then 1.6 else 1 end
    * private.map_mult(p_map))::bigint;
$$;

create or replace function private.submit_score(p_run_id uuid, p_map text, p_rank text, p_time_sec integer, p_damage bigint, p_captain_id integer)
returns text language plpgsql security definer set search_path = public, extensions as $$
declare uid uuid := private.real_user();
begin
  if not exists (select 1 from public.profiles where id = uid) then raise exception 'no_username' using errcode = '42501'; end if;
  if p_rank not in ('C', 'B', 'A', 'S', 'X', 'Z') or p_map !~ '^[a-z0-9_-]{1,32}$' then raise exception 'invalid_board' using errcode = '22023'; end if;
  if p_rank = 'Z' and not private.rank_z_open() then raise exception 'rank_locked' using errcode = '22023'; end if;
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
-- create or replace drops the settings of the function: the lock limit of 20261103000000 goes back on
alter function private.submit_score(uuid, text, text, integer, bigint, integer) set lock_timeout = '3s';

-- same columns as before (the leaderboard/my_position readers stay): points with the arena, Z on top
create or replace function private.board(p_map text, p_rank text, p_order text)
returns table (pos bigint, user_id uuid, username extensions.citext, avatar text, crest text, map text, rank text, time_sec integer, damage bigint, captain_id integer, score bigint)
language sql stable set search_path = public, extensions as $$
  with marks as (
    select s.*, private.score_of(s.map, s.rank, s.time_sec, s.damage) as score, array_position(array['C', 'B', 'A', 'S', 'X', 'Z'], s.rank) as tier,
      case coalesce(p_order, 'score')
        when 'time' then s.time_sec::numeric
        when 'damage' then s.damage::numeric
        when 'rank' then array_position(array['C', 'B', 'A', 'S', 'X', 'Z'], s.rank)::numeric * 1e15 + private.score_of(s.map, s.rank, s.time_sec, s.damage)
        else private.score_of(s.map, s.rank, s.time_sec, s.damage)::numeric end as k
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

-- Juegos del Clan: Z is worth the most points too, and only once it is open. (author) And 1 match a day per player
-- (it was 3), from now on: clan_submit_run below.
create or replace function private.clan_points(p_kills int, p_time int, p_damage bigint, p_rank text, p_victory boolean) returns int
language sql immutable set search_path = '' as $$
  select floor((least(greatest(p_kills, 0), 4000) * 3 + least(greatest(p_time, 0), 900) * 2 + floor(sqrt(least(greatest(p_damage, 0), 20000000)))
    + case when p_victory then 300 else 0 end)
    * case p_rank when 'Z' then 2.8 when 'X' then 2.2 when 'S' then 1.8 when 'A' then 1.5 when 'B' then 1.25 else 1 end)::int;
$$;

create or replace function private.clan_submit_run(p_run_id text, p_kills int, p_time_sec int, p_damage bigint, p_rank text, p_victory boolean) returns jsonb
language plpgsql security definer set search_path = public as $$
declare uid uuid := private.real_user(); cid bigint; d date := private.clan_day(); n int; pts int;
begin
  select clan_id into cid from public.clan_members where user_id = uid;
  if cid is null then raise exception 'not_in_clan' using errcode = '42501'; end if;
  if p_rank not in ('C', 'B', 'A', 'S', 'X', 'Z') or (p_rank = 'Z' and not private.rank_z_open()) then raise exception 'invalid_rank' using errcode = '22023'; end if;
  perform pg_advisory_xact_lock(hashtext('clan_run'), hashtext(uid::text));
  if exists (select 1 from public.clan_runs where user_id = uid and run_id = p_run_id) then raise exception 'duplicate' using errcode = '23505'; end if;
  select count(*) into n from public.clan_runs where user_id = uid and day = d;
  if n >= 1 then raise exception 'clan_daily_limit' using errcode = '54000'; end if;
  pts := private.clan_points(p_kills, p_time_sec, p_damage, p_rank, p_victory);
  insert into public.clan_runs (clan_id, user_id, run_id, day, week, points, kills, victory)
    values (cid, uid, p_run_id, d, private.clan_week(), pts, least(greatest(p_kills, 0), 4000), coalesce(p_victory, false));
  return jsonb_build_object('points', pts, 'left', greatest(0, 1 - (n + 1)),
    'weekPoints', (select coalesce(sum(points), 0) from public.clan_runs where clan_id = cid and week = private.clan_week()));
end $$;

-- the profile card lists the best marks from the highest rank down: Z first
create or replace function private.public_profile(p_username text) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'username', p.username::text,
    'avatar', p.avatar,
    'crest', coalesce(nullif(s.data->>'crest', ''), p.crest),
    'joined', p.created_at::date,
    'favorite', coalesce(s.data->>'favoriteTeam', ''),
    'icon', coalesce(s.data->'profile'->'icon', 'null'::jsonb),
    'kit', coalesce(s.data->>'kit', ''),
    'captain', coalesce(s.data->'captainId', 'null'::jsonb),
    'banner', case when coalesce(s.data->'pennants'->>'equipped', '') ~ '^[a-z0-9-]{1,32}$' then s.data->'pennants'->>'equipped' end,
    'frame', case when coalesce(s.data->'pennants'->>'frame', '') ~ '^[a-z0-9-]{1,32}$' then s.data->'pennants'->>'frame' end,
    'stats', jsonb_build_object(
      'runs', coalesce((s.data->'stats'->>'runs')::int, 0),
      'wins', coalesce((s.data->'stats'->>'wins')::int, 0),
      'kills', coalesce((s.data->'stats'->>'kills')::bigint, 0),
      'bestTimeSec', coalesce((s.data->'stats'->>'bestTimeSec')::int, 0),
      'bestEndless', coalesce((s.data->'stats'->>'bestEndless')::int, 0),
      'pulls', coalesce((s.data->'stats'->>'pulls')::int, 0)),
    'owned', (select count(*) from jsonb_object_keys(coalesce(s.data->'owned', '{}'::jsonb))),
    'heroes', (select count(*) from jsonb_each(coalesce(s.data->'owned', '{}'::jsonb)) o where (o.value->>'hero')::boolean),
    'collection', coalesce((select jsonb_object_agg(o.key, jsonb_strip_nulls(jsonb_build_object(
        'stars', o.value->'stars', 'hero', o.value->'hero', 'heroStars', o.value->'heroStars',
        'ascMitico', o.value->'ascMitico', 'ascRarity', o.value->'ascRarity', 'train', o.value->'train')))
      from jsonb_each(case when jsonb_typeof(s.data->'owned') = 'object' then s.data->'owned' else '{}'::jsonb end) o
      where o.key ~ '^[0-9]{1,9}$' and jsonb_typeof(o.value) = 'object'), '{}'::jsonb),
    'achievements', coalesce((select jsonb_agg(c.v) from (
        select distinct c.v from jsonb_array_elements_text(case when jsonb_typeof(s.data->'missions'->'claimed') = 'array' then s.data->'missions'->'claimed' else '[]'::jsonb end) c(v)
        where c.v ~ '^[a-z0-9_-]{1,48}$' limit 500) c), '[]'::jsonb),
    'squad', coalesce((select jsonb_agg(jsonb_build_object(
        'id', sq.id::int,
        'stars', coalesce((s.data->'owned'->sq.id->>'stars')::int, 0),
        'hero', coalesce((s.data->'owned'->sq.id->>'hero')::boolean, false),
        'heroStars', coalesce((s.data->'owned'->sq.id->>'heroStars')::int, 0),
        'ascRarity', s.data->'owned'->sq.id->>'ascRarity',
        'asc', coalesce((s.data->'owned'->sq.id->>'ascMitico')::boolean, false),
        'aura', s.data->'auras'->>sq.id) order by sq.n)
      from jsonb_array_elements_text(coalesce(s.data->'squad', '[]'::jsonb)) with ordinality as sq(id, n)
      where sq.n <= 7 and sq.id ~ '^[0-9]{1,9}$'), '[]'::jsonb),
    'marks', coalesce((select jsonb_agg(jsonb_build_object('map', m.map, 'rank', m.rank, 'time_sec', m.time_sec, 'damage', m.damage, 'captain_id', m.captain_id))
      from (select * from public.scores sc where sc.user_id = p.id
            order by array_position(array['Z', 'X', 'S', 'A', 'B', 'C'], sc.rank), sc.time_sec desc limit 6) m), '[]'::jsonb)
  )
  from public.profiles p
  left join public.saves s on s.user_id = p.id
  where p.username = trim(p_username)::extensions.citext
$$;
alter function private.public_profile(text) set statement_timeout = '5s';

notify pgrst, 'reload schema';

-- ===== 20261110000100_clan_missions.sql
-- (author) Juegos del Clan at 1 match a day per player (20261110000000_rank_z.sql): the weekly missions get goals a
-- clan can reach that way (made for a clan of 3-5 who play most days: ~12 matches; a clan match averaged 3,300 rivals,
-- 25,000 points and 94% wins on 2026-11-08) and pay more, and there
-- are two new ones: play on 5 different days, and 3 different members win. Texts in src/systems/clans.ts.
create or replace function private.clan_missions_def() returns table (id text, kind text, goal bigint, coins int, tokens int) language sql immutable set search_path = '' as $$
  select * from (values
    ('partidas', 'runs', 12::bigint, 8000, 40),
    ('victorias', 'wins', 10::bigint, 12000, 50),
    ('rivales', 'kills', 30000::bigint, 12000, 60),
    ('puntos', 'points', 250000::bigint, 20000, 80),
    ('todos', 'everyone', 1::bigint, 15000, 80),
    ('constancia', 'days', 5::bigint, 10000, 60),
    ('ganadores', 'winners', 3::bigint, 12000, 60)
  ) v (id, kind, goal, coins, tokens);
$$;

-- the same as in 20261108000000_clans.sql, with the progress of the two new kinds (days played, members who won)
create or replace function private.my_clan() returns jsonb language plpgsql stable security definer set search_path = public as $$
declare uid uuid := auth.uid(); cid bigint; w date := private.clan_week(); d date := private.clan_day(); out jsonb;
begin
  select clan_id into cid from public.clan_members where user_id = uid;
  if cid is null then return null; end if;
  select jsonb_build_object(
    'id', c.id, 'name', c.name::text, 'crest', c.crest, 'kit', c.kit, 'members', c.members, 'created_at', c.created_at,
    'me', (select role from public.clan_members where user_id = uid), 'mode', c.mode,
    'requests', case when (select role from public.clan_members where user_id = uid) in ('lider', 'oficial')
      then (select count(*) from public.clan_requests q where q.clan_id = c.id) else 0 end,
    'runsToday', (select count(*) from public.clan_runs r where r.user_id = uid and r.day = d),
    'weekPoints', coalesce((select sum(points) from public.clan_runs r where r.clan_id = c.id and r.week = w), 0),
    'pos', (select x.pos from (select r.clan_id, row_number() over (order by sum(r.points) desc, max(r.created_at)) as pos
                                from public.clan_runs r where r.week = w group by r.clan_id) x where x.clan_id = c.id),
    'clans', (select count(distinct r.clan_id) from public.clan_runs r where r.week = w),
    'roster', (select coalesce(jsonb_agg(jsonb_build_object('username', p.username::text, 'avatar', p.avatar, 'role', m.role,
                  'today', (select count(*) from public.clan_runs r where r.user_id = m.user_id and r.day = d),
                  'week', coalesce((select sum(points) from public.clan_runs r where r.user_id = m.user_id and r.clan_id = c.id and r.week = w), 0))
                order by m.role = 'lider' desc, m.role = 'oficial' desc, m.joined_at), '[]'::jsonb)
               from public.clan_members m join public.profiles p on p.id = m.user_id where m.clan_id = c.id),
    'missions', (select jsonb_agg(jsonb_build_object('id', md.id, 'goal', md.goal, 'coins', md.coins, 'tokens', md.tokens,
                  'progress', case md.kind
                    when 'runs' then (select count(*) from public.clan_runs r where r.clan_id = c.id and r.week = w)
                    when 'wins' then (select count(*) from public.clan_runs r where r.clan_id = c.id and r.week = w and r.victory)
                    when 'kills' then (select coalesce(sum(kills), 0) from public.clan_runs r where r.clan_id = c.id and r.week = w)
                    when 'points' then (select coalesce(sum(points), 0) from public.clan_runs r where r.clan_id = c.id and r.week = w)
                    when 'days' then (select count(distinct r.day) from public.clan_runs r where r.clan_id = c.id and r.week = w)
                    when 'winners' then (select count(distinct r.user_id) from public.clan_runs r where r.clan_id = c.id and r.week = w and r.victory)
                    else (case when c.members >= 3 and not exists (select 1 from public.clan_members m2 where m2.clan_id = c.id
                            and not exists (select 1 from public.clan_runs r where r.user_id = m2.user_id and r.clan_id = c.id and r.week = w)) then 1 else 0 end) end,
                  'claimed', exists (select 1 from public.clan_rewards cr where cr.user_id = uid and cr.kind = 'mision' and cr.ref = w::text || ':' || md.id)))
               from private.clan_missions_def() md))
  into out from public.clans c where c.id = cid;
  return out;
end $$;

notify pgrst, 'reload schema';

-- ===== 20261110000200_new_arenas.sql
-- 2.1 (author: «añade 3 mapas nuevos»): three arenas after the ruins, steps 16-18 of the path. The ranking's arena
-- multiplier learns them (+5% per step: ×1.75, ×1.8, ×1.85); same table as MAP_TIER in src/systems/leaderboard.ts.
create or replace function private.map_mult(p_map text) returns numeric
language sql immutable set search_path = '' as $$
  select 1 + (coalesce(case p_map
    when 'raimon' then 1 when 'ribera' then 2 when 'royal' then 3 when 'nara' then 4 when 'zeus' then 5
    when 'alpino' then 6 when 'nevada' then 7 when 'claustro' then 8 when 'naniwa' then 9 when 'yokato' then 10
    when 'marytimes' then 11 when 'fuji' then 12 when 'ehime' then 13 when 'alius' then 14 when 'ruinas' then 15
    when 'barrio' then 16 when 'plazanieve' then 17 when 'torre' then 18 end, 1) - 1) * 0.05;
$$;

-- ===== 20261110000300_eg_code.sql
-- 2.0 (author): code EGU3RR3R0 (typed EGu3rr3r0; codes are upper-cased) gives 3 Fichas EG, once per account.
-- redeem_code learns rewards.eg_tokens (answered as reward.egTokens); codes without it answer exactly as before.
-- Same function as 20261106000200_ina483.sql otherwise.

create or replace function private.redeem_code(p_code text, p_already_applied boolean) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare uid uuid := private.real_user(); c record; pool jsonb; pick integer; res jsonb; inserted integer;
  odds jsonb; total numeric; x numeric; r text;
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
  odds := c.rewards -> 'rarity_odds';
  if odds is not null then
    -- rarity first by its weight (only rarities with footballers), then one of that rarity
    select sum((value)::numeric) into total from jsonb_each_text(odds) e
      where jsonb_array_length(coalesce(c.rewards -> 'rarity_pools' -> e.key, '[]')) > 0;
    x := random() * coalesce(total, 0);
    for r in select e.key from jsonb_each_text(odds) e
      where jsonb_array_length(coalesce(c.rewards -> 'rarity_pools' -> e.key, '[]')) > 0 order by (e.value)::numeric desc loop
      pool := c.rewards -> 'rarity_pools' -> r;
      x := x - (odds ->> r)::numeric;
      exit when x < 0;
    end loop;
  end if;
  pick := case when jsonb_array_length(coalesce(pool, '[]')) > 0 then (pool ->> floor(random() * jsonb_array_length(pool))::integer)::integer end;
  res := jsonb_build_object('tokens', coalesce((c.rewards ->> 'tokens')::integer, 0), 'coins', coalesce((c.rewards ->> 'coins')::integer, 0), 'player', pick,
    'eventTokens', coalesce((c.rewards ->> 'event_tokens')::integer, 0));
  if c.rewards ? 'eg_tokens' then res := res || jsonb_build_object('egTokens', (c.rewards ->> 'eg_tokens')::integer); end if;
  if c.rewards ? 'pennants' then res := res || jsonb_build_object('pennants', c.rewards -> 'pennants'); end if;
  insert into private.promo_redemptions (user_id, code, result) values (uid, c.code, res) on conflict do nothing;
  get diagnostics inserted = row_count;
  if inserted = 0 then return jsonb_build_object('status', 'used'); end if;
  return jsonb_build_object('status', 'ok', 'reward', res);
end $$;

revoke execute on function private.redeem_code(text, boolean) from public, anon, authenticated;
grant execute on function private.redeem_code(text, boolean) to authenticated;

insert into private.promo_codes (code, rewards) values ('EGU3RR3R0', jsonb_build_object('eg_tokens', 3))
on conflict (code) do update set rewards = excluded.rewards, active = true;

-- ===== 20261110000400_clan_info.sql
-- 2.01 (author: «que cuando le des click al clan puedas ver los miembros, puntos y información»): the public card of any
-- clan, by id or by name (the ranking only knows the clan's name, from clan_of). Public data only: name, crest, kit,
-- mode, founding date, leader, this week's points and position, last week's result, its best week, all-time points and
-- the roster with each member's role and points (this week and in total for this clan). No user ids.
create or replace function private.clan_info(p_id bigint default null, p_name text default null) returns jsonb
language sql stable security definer set search_path = '' as $$
  with c as (
    select * from public.clans x
    where (p_id is not null and x.id = p_id) or (p_id is null and lower(x.name::text) = lower(trim(coalesce(p_name, ''))))
    limit 1
  ), w as (select private.clan_week() as wk)
  select jsonb_build_object(
    'id', c.id, 'name', c.name::text, 'crest', c.crest, 'kit', c.kit, 'mode', c.mode, 'members', c.members, 'created_at', c.created_at,
    'leader', (select p.username::text from public.profiles p where p.id = c.leader),
    'weekPoints', coalesce((select sum(r.points) from public.clan_runs r, w where r.clan_id = c.id and r.week = w.wk), 0),
    'pos', (select x.pos from (select r.clan_id, row_number() over (order by sum(r.points) desc, max(r.created_at)) as pos
                                from public.clan_runs r, w where r.week = w.wk group by r.clan_id) x where x.clan_id = c.id),
    'clans', (select count(distinct r.clan_id) from public.clan_runs r, w where r.week = w.wk),
    'totalPoints', coalesce((select sum(r.points) from public.clan_runs r where r.clan_id = c.id), 0),
    'runs', (select count(*) from public.clan_runs r where r.clan_id = c.id),
    'wins', (select count(*) from public.clan_runs r where r.clan_id = c.id and r.victory),
    'lastWeek', (select jsonb_build_object('pos', x.pos, 'points', x.points, 'tier', x.tier) from public.clan_week_results x, w
                 where x.clan_id = c.id and x.week = w.wk - 7),
    'bestPos', (select min(x.pos) from public.clan_week_results x where x.clan_id = c.id),
    'titles', (select count(*) from public.clan_week_results x where x.clan_id = c.id and x.pos = 1),
    'roster', (select coalesce(jsonb_agg(jsonb_build_object('username', p.username::text, 'avatar', p.avatar, 'role', m.role, 'joined_at', m.joined_at,
                  'week', coalesce((select sum(r.points) from public.clan_runs r, w where r.user_id = m.user_id and r.clan_id = c.id and r.week = w.wk), 0),
                  'total', coalesce((select sum(r.points) from public.clan_runs r where r.user_id = m.user_id and r.clan_id = c.id), 0))
                order by m.role = 'lider' desc, m.role = 'oficial' desc, m.joined_at), '[]'::jsonb)
               from public.clan_members m join public.profiles p on p.id = m.user_id where m.clan_id = c.id))
  from c;
$$;
create or replace function public.clan_info(p_id bigint default null, p_name text default null) returns jsonb
language sql stable security invoker set search_path = '' as $$ select private.clan_info(p_id, p_name); $$;
revoke execute on function private.clan_info(bigint, text), public.clan_info(bigint, text) from public, anon, authenticated;
grant execute on function private.clan_info(bigint, text), public.clan_info(bigint, text) to anon, authenticated;
alter function private.clan_info(bigint, text) set statement_timeout = '5s';

-- ===== 20261110000500_damage_cap.sql
-- 2.01 (author: a 20+ minute Rango Z run of a player did not reach the ranking): the anti-cheat damage ceiling was 200.000
-- per second, and late teams in Rango Z with their spirits go past it, so real runs were refused as implausible_damage
-- (6 on 2026-11-10). The ceiling is now 800.000 per second and a run above it is no longer refused: its damage is
-- trimmed to the ceiling, so the time survived still counts.
create or replace function private.submit_score(p_run_id uuid, p_map text, p_rank text, p_time_sec integer, p_damage bigint, p_captain_id integer)
returns text language plpgsql security definer set search_path to 'public', 'extensions' set lock_timeout to '3s' as $function$
declare uid uuid := private.real_user(); dmg bigint;
begin
  if not exists (select 1 from public.profiles where id = uid) then raise exception 'no_username' using errcode = '42501'; end if;
  if p_rank not in ('C', 'B', 'A', 'S', 'X', 'Z') or p_map !~ '^[a-z0-9_-]{1,32}$' then raise exception 'invalid_board' using errcode = '22023'; end if;
  if p_rank = 'Z' and not private.rank_z_open() then raise exception 'rank_locked' using errcode = '22023'; end if;
  if p_time_sec < 0 or p_time_sec > 4 * 3600 then raise exception 'implausible_time' using errcode = '22023'; end if;
  if p_damage < 0 then raise exception 'implausible_damage' using errcode = '22023'; end if;
  dmg := least(p_damage, (p_time_sec + 1)::bigint * 800000);
  if exists (select 1 from public.submitted_runs r where r.user_id = uid and r.at > now() - interval '20 seconds') then
    raise exception 'too_fast' using errcode = '54000';
  end if;
  insert into public.submitted_runs (run_id, user_id) values (p_run_id, uid) on conflict do nothing;
  if not found then return 'duplicate'; end if;
  insert into public.scores as s (user_id, map, rank, time_sec, damage, captain_id, run_id)
    values (uid, p_map, p_rank, p_time_sec, dmg, coalesce(p_captain_id, 0), p_run_id)
  on conflict (user_id, map, rank) do update
    set time_sec = excluded.time_sec, damage = excluded.damage, captain_id = excluded.captain_id, run_id = excluded.run_id, created_at = now()
    where (private.score_of(excluded.rank, excluded.time_sec, excluded.damage), excluded.time_sec, excluded.damage)
        > (private.score_of(s.rank, s.time_sec, s.damage), s.time_sec, s.damage);
  return 'ok';
end $function$;

-- ===== 20261110000600_replays.sql
-- 2.02: run replays (author: «ver cómo juega la gente»). The game records a finished solo run (src/game/replay.ts),
-- uploads the gzipped file to a private bucket in the player's own folder and registers it here. Only the author
-- (private.admins) lists and watches them; each player keeps the newest 3 plus those of his ranking marks (public.scores
-- run_id): the rest are handed back to be deleted.
-- Storage objects can only be deleted through the Storage API, so the functions return the paths to delete and the
-- rows of files that are already gone are swept at the next call.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('replays', 'replays', false, 8388608, array['application/gzip', 'application/octet-stream'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists replays_insert_own on storage.objects;
create policy replays_insert_own on storage.objects for insert to authenticated
  with check (
    bucket_id = 'replays'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and not coalesce(((select auth.jwt()) ->> 'is_anonymous')::boolean, false)
    -- at most 30 uploads per account per day
    and (select count(*) from storage.objects o where o.bucket_id = 'replays' and o.owner_id = (select auth.uid())::text
         and o.created_at > now() - interval '1 day') < 30
  );
drop policy if exists replays_read_own_or_admin on storage.objects;
create policy replays_read_own_or_admin on storage.objects for select to authenticated
  using (bucket_id = 'replays' and ((storage.foldername(name))[1] = (select auth.uid())::text or (select private.is_admin())));
drop policy if exists replays_delete_own_or_admin on storage.objects;
create policy replays_delete_own_or_admin on storage.objects for delete to authenticated
  using (bucket_id = 'replays' and ((storage.foldername(name))[1] = (select auth.uid())::text or (select private.is_admin())));

create table if not exists private.replays (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  path text not null unique,
  map text not null,
  rank text not null,
  time_sec integer not null,
  victory boolean not null,
  kills integer not null,
  level integer not null,
  captain_id integer,
  team integer[] not null default '{}',
  bytes integer not null,
  version text not null default '',
  created_at timestamptz not null default now()
);
create index if not exists replays_user_created on private.replays (user_id, created_at desc);
create index if not exists replays_created on private.replays (created_at desc);

-- the replay just uploaded; returns the player's own older files to delete (beyond the newest 3, ranking marks kept)
create or replace function private.register_replay(p_path text, p_map text, p_rank text, p_time_sec integer, p_victory boolean,
  p_kills integer, p_level integer, p_captain_id integer, p_team integer[], p_bytes integer, p_version text) returns text[]
language plpgsql volatile security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
  old text[];
begin
  if uid is null or coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) then raise exception 'not_signed_in' using errcode = 'P0001'; end if;
  if p_path is null or split_part(p_path, '/', 1) <> uid::text or p_path !~ '^[0-9a-f-]{36}/[A-Za-z0-9_-]{8,64}\.bin$' then
    raise exception 'bad_path' using errcode = 'P0001';
  end if;
  if not exists (select 1 from storage.objects o where o.bucket_id = 'replays' and o.name = p_path) then
    raise exception 'not_uploaded' using errcode = 'P0001';
  end if;
  -- rows whose file is already gone
  delete from private.replays r where r.user_id = uid
    and not exists (select 1 from storage.objects o where o.bucket_id = 'replays' and o.name = r.path);
  insert into private.replays (user_id, path, map, rank, time_sec, victory, kills, level, captain_id, team, bytes, version)
  values (uid, p_path, left(coalesce(p_map, ''), 40), left(coalesce(p_rank, ''), 4), greatest(0, least(coalesce(p_time_sec, 0), 86400)),
    coalesce(p_victory, false), greatest(0, coalesce(p_kills, 0)), greatest(0, coalesce(p_level, 0)), p_captain_id,
    coalesce(p_team[1:12], '{}'), greatest(0, coalesce(p_bytes, 0)), left(coalesce(p_version, ''), 24))
  on conflict (path) do nothing;
  select coalesce(array_agg(path), '{}') into old from (
    select r.path from private.replays r where r.user_id = uid
      and not exists (select 1 from public.scores s where s.user_id = uid and s.run_id::text = split_part(split_part(r.path, '/', 2), '.', 1))
    order by r.created_at desc offset 3) x;
  return old;
end $$;

-- admin: the replays, newest first, optionally of one player (exact name, any case)
create or replace function private.admin_replays(p_username text default null, p_limit integer default 100) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  if not private.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  return coalesce((select jsonb_agg(to_jsonb(x) order by x.created_at desc) from (
    select r.id, r.path, coalesce(p.username::text, '(sin nombre)') as username, r.map, r.rank, r.time_sec, r.victory, r.kills,
      r.level, r.captain_id, r.team, r.bytes, r.version, r.created_at
    from private.replays r left join public.profiles p on p.id = r.user_id
    where (p_username is null or p_username = '' or lower(p.username::text) = lower(p_username))
      and exists (select 1 from storage.objects o where o.bucket_id = 'replays' and o.name = r.path)
    order by r.created_at desc
    limit least(greatest(coalesce(p_limit, 100), 1), 300)) x), '[]'::jsonb);
end $$;

-- admin: files older than p_days to delete, never a ranking mark's (the rows go once the files are gone)
create or replace function private.admin_prune_replays(p_days integer default 30) returns text[]
language plpgsql volatile security definer set search_path = '' as $$
declare out text[];
begin
  if not private.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  delete from private.replays r where not exists (select 1 from storage.objects o where o.bucket_id = 'replays' and o.name = r.path);
  select coalesce(array_agg(path), '{}') into out from (select r.path from private.replays r
    where r.created_at < now() - make_interval(days => greatest(coalesce(p_days, 30), 3))
      and not exists (select 1 from public.scores s where s.user_id = r.user_id and s.run_id::text = split_part(split_part(r.path, '/', 2), '.', 1))
    limit 500) x;
  return out;
end $$;

create or replace function public.register_replay(p_path text, p_map text, p_rank text, p_time_sec integer, p_victory boolean,
  p_kills integer, p_level integer, p_captain_id integer, p_team integer[], p_bytes integer, p_version text) returns text[]
language sql volatile security invoker set search_path = '' as $$
  select private.register_replay(p_path, p_map, p_rank, p_time_sec, p_victory, p_kills, p_level, p_captain_id, p_team, p_bytes, p_version); $$;
create or replace function public.admin_replays(p_username text default null, p_limit integer default 100) returns jsonb
language sql stable security invoker set search_path = '' as $$ select private.admin_replays(p_username, p_limit); $$;
create or replace function public.admin_prune_replays(p_days integer default 30) returns text[]
language sql volatile security invoker set search_path = '' as $$ select private.admin_prune_replays(p_days); $$;

revoke all on table private.replays from public, anon, authenticated;
revoke execute on function private.register_replay(text, text, text, integer, boolean, integer, integer, integer, integer[], integer, text),
  public.register_replay(text, text, text, integer, boolean, integer, integer, integer, integer[], integer, text),
  private.admin_replays(text, integer), public.admin_replays(text, integer),
  private.admin_prune_replays(integer), public.admin_prune_replays(integer) from public, anon, authenticated;
grant execute on function private.register_replay(text, text, text, integer, boolean, integer, integer, integer, integer[], integer, text),
  public.register_replay(text, text, text, integer, boolean, integer, integer, integer, integer[], integer, text),
  private.admin_replays(text, integer), public.admin_replays(text, integer),
  private.admin_prune_replays(integer), public.admin_prune_replays(integer) to authenticated;
alter function private.register_replay(text, text, text, integer, boolean, integer, integer, integer, integer[], integer, text) set statement_timeout = '5s';
alter function private.admin_replays(text, integer) set statement_timeout = '8s';
alter function private.admin_prune_replays(integer) set statement_timeout = '8s';

notify pgrst, 'reload schema';

-- ===== 20261111000000_spirit_stats.sql
-- 2.02 Métricas (author: «qué espíritus son los que más se usan y los que más vidas quitan»). At the end of every run with an
-- active warrior spirit the game sends which one, how many ultimates were cast and the damage the team dealt in the 3 s
-- after each one. Stored added up per Madrid day and spirit: no account is kept with the numbers (only a per-account
-- daily counter against spam). Only admins read it.

create table if not exists private.spirit_daily (
  day date not null,
  spirit text not null,
  runs integer not null default 0,
  casts integer not null default 0,
  damage bigint not null default 0,
  primary key (day, spirit)
);
create table if not exists private.spirit_senders (
  user_id uuid not null references auth.users (id) on delete cascade,
  day date not null,
  n integer not null default 0,
  primary key (user_id, day)
);

create or replace function private.record_spirit_run(p_spirit text, p_casts integer, p_damage bigint) returns void
language plpgsql volatile security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
  d date := (now() at time zone 'Europe/Madrid')::date;
  k integer;
begin
  if uid is null or coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) then raise exception 'not_signed_in' using errcode = 'P0001'; end if;
  if p_spirit is null or p_spirit !~ '^[a-z_]{2,24}$' then raise exception 'bad_spirit' using errcode = 'P0001'; end if;
  insert into private.spirit_senders (user_id, day, n) values (uid, d, 1)
  on conflict (user_id, day) do update set n = private.spirit_senders.n + 1 returning n into k;
  if k > 60 then return; end if; -- more runs than anyone plays in a day: ignored
  insert into private.spirit_daily (day, spirit, runs, casts, damage)
  values (d, p_spirit, 1, least(greatest(coalesce(p_casts, 0), 0), 400), least(greatest(coalesce(p_damage, 0), 0), 2000000000))
  on conflict (day, spirit) do update set runs = private.spirit_daily.runs + 1, casts = private.spirit_daily.casts + excluded.casts,
    damage = private.spirit_daily.damage + excluded.damage;
  delete from private.spirit_senders where day < d - 2;
end $$;

create or replace function private.admin_spirit_stats(p_days integer default 30) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare d integer := least(greatest(coalesce(p_days, 30), 1), 365);
begin
  if not private.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  return coalesce((select jsonb_agg(jsonb_build_object('spirit', spirit, 'runs', runs, 'casts', casts, 'damage', damage) order by runs desc) from (
    select spirit, sum(runs)::bigint runs, sum(casts)::bigint casts, sum(damage)::bigint damage from private.spirit_daily
    where day > (now() at time zone 'Europe/Madrid')::date - d group by spirit) x), '[]'::jsonb);
end $$;

create or replace function public.record_spirit_run(p_spirit text, p_casts integer, p_damage bigint) returns void
language sql volatile security invoker set search_path = '' as $$ select private.record_spirit_run(p_spirit, p_casts, p_damage); $$;
create or replace function public.admin_spirit_stats(p_days integer default 30) returns jsonb
language sql stable security invoker set search_path = '' as $$ select private.admin_spirit_stats(p_days); $$;

revoke all on table private.spirit_daily, private.spirit_senders from public, anon, authenticated;
revoke execute on function private.record_spirit_run(text, integer, bigint), public.record_spirit_run(text, integer, bigint),
  private.admin_spirit_stats(integer), public.admin_spirit_stats(integer) from public, anon, authenticated;
grant execute on function private.record_spirit_run(text, integer, bigint), public.record_spirit_run(text, integer, bigint),
  private.admin_spirit_stats(integer), public.admin_spirit_stats(integer) to authenticated;
alter function private.record_spirit_run(text, integer, bigint) set statement_timeout = '5s';
alter function private.admin_spirit_stats(integer) set statement_timeout = '8s';

notify pgrst, 'reload schema';

-- ===== 20261111000100_season_pass.sql
-- 2.1 (author): season pass and ranking seasons. private.seasons holds each season's dates (the game has the same ones in
-- src/systems/seasonPass.ts). The pass is paid on the client like every other reward, so economy_cap learns it: every
-- level newly claimed this season (save.season.claimedNormal / claimedPremium) allows at most what one level can pay
-- (120 fichas, 6000 coins, seasonPass.ts LEVEL_MAX). The count is checked against the highest one the server has
-- already seen for that account and season (private.season_claims), so dropping levels from the save and claiming them
-- again gives nothing; it can never pass the 200 levels of a season.

create table if not exists private.seasons (
  id text primary key,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  check (ends_at > starts_at)
);
insert into private.seasons (id, starts_at, ends_at) values ('T1', '2026-11-12 15:00+01', '2026-12-12 15:00+01')
on conflict (id) do update set starts_at = excluded.starts_at, ends_at = excluded.ends_at;

create table if not exists private.season_claims (
  user_id uuid not null references auth.users (id) on delete cascade,
  season text not null references private.seasons (id) on delete cascade,
  n integer not null default 0,
  primary key (user_id, season)
);
revoke all on table private.seasons, private.season_claims from public, anon, authenticated;

-- the season open now (null between seasons)
create or replace function private.current_season() returns text
language sql stable security definer set search_path = '' as $$
  select s.id from private.seasons s where now() >= s.starts_at and now() < s.ends_at order by s.starts_at desc limit 1;
$$;

-- same as before (promo codes, bug bounty, clan rewards), plus the season pass levels; volatile now: it records the
-- highest claimed count of the season
create or replace function private.economy_cap(p_new jsonb, p_old jsonb, p_since timestamptz, p_uid uuid) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare
  hours numeric := greatest(0, extract(epoch from (now() - coalesce(p_since, now()))) / 3600);
  promo_t numeric := 0; promo_c numeric := 0; bug_t numeric := 0; clan_t numeric := 0; clan_c numeric := 0;
  old_t numeric; old_c numeric; new_t numeric; new_c numeric; max_t numeric; max_c numeric;
  cur text := private.current_season(); seen integer := 0; claimed integer := 0; pass_n integer := 0;
  out jsonb := p_new;
begin
  if to_regclass('private.promo_redemptions') is not null then
    execute 'select coalesce(sum((r.result ->> ''tokens'')::numeric), 0), coalesce(sum((r.result ->> ''coins'')::numeric), 0)
      from private.promo_redemptions r where r.user_id = $1 and r.created_at > coalesce($2, ''-infinity''::timestamptz)'
      into promo_t, promo_c using p_uid, p_since;
  end if;
  select coalesce(sum(b.tokens), 0) into bug_t from private.bug_rewards b
    where b.user_id = p_uid and b.claimed_at is not null and b.claimed_at > coalesce(p_since, '-infinity'::timestamptz);
  select coalesce(sum(c.tokens), 0), coalesce(sum(c.coins), 0) into clan_t, clan_c from public.clan_rewards c
    where c.user_id = p_uid and c.claimed_at > coalesce(p_since, '-infinity'::timestamptz);
  promo_t := promo_t + bug_t + clan_t;
  promo_c := promo_c + clan_c;
  -- 2.1: the season pass
  if cur is not null and p_uid is not null and p_new -> 'season' ->> 'id' = cur then
    claimed := least(200,
      (case when jsonb_typeof(p_new -> 'season' -> 'claimedNormal') = 'array' then jsonb_array_length(p_new -> 'season' -> 'claimedNormal') else 0 end)
      + (case when jsonb_typeof(p_new -> 'season' -> 'claimedPremium') = 'array' then jsonb_array_length(p_new -> 'season' -> 'claimedPremium') else 0 end));
    select n into seen from private.season_claims where user_id = p_uid and season = cur;
    pass_n := greatest(0, claimed - coalesce(seen, 0));
    if pass_n > 0 then
      insert into private.season_claims (user_id, season, n) values (p_uid, cur, claimed)
      on conflict (user_id, season) do update set n = greatest(private.season_claims.n, excluded.n);
    end if;
    promo_t := promo_t + pass_n * 120;
    promo_c := promo_c + pass_n * 6000;
  end if;
  new_t := case when jsonb_typeof(p_new -> 'tokens') = 'number' then (p_new ->> 'tokens')::numeric else 0 end;
  new_c := case when jsonb_typeof(p_new -> 'coins') = 'number' then (p_new ->> 'coins')::numeric else 0 end;
  if p_old is null then
    max_t := 5000 + promo_t; max_c := 120000 + promo_c;
  else
    old_t := case when jsonb_typeof(p_old -> 'tokens') = 'number' then greatest(0, (p_old ->> 'tokens')::numeric) else 0 end;
    old_c := case when jsonb_typeof(p_old -> 'coins') = 'number' then greatest(0, (p_old ->> 'coins')::numeric) else 0 end;
    max_t := old_t + 2000 + 1000 * hours + promo_t;
    max_c := old_c + 16000 + 16000 * hours + promo_c;
  end if;
  if new_t > max_t then out := jsonb_set(out, '{tokens}', to_jsonb(floor(max_t)::bigint)); end if;
  if new_c > max_c then out := jsonb_set(out, '{coins}', to_jsonb(floor(max_c)::bigint)); end if;
  return out;
end $$;
revoke all on function private.economy_cap(jsonb, jsonb, timestamptz, uuid) from public, anon, authenticated;
revoke all on function private.current_season() from public, anon, authenticated;

notify pgrst, 'reload schema';

-- ===== 20261111000200_ranking_season.sql
-- 2.1 (author): the ranking goes by seasons and ends with the pass (private.seasons). There is no scheduler on this
-- project, so a season is closed lazily, once: the first signed-in call after its end (claim_season_rewards from the
-- menu, or a new mark in submit_score) stores the final positions of the global board (best mark of each player by
-- points) with each one's prizes, archives the marks and empties the board for the next season. Prizes (author: «haz
-- recompensas buenas»):
--   top 1      2500 fichas, 300.000 coins, 15 Fichas EG, Super Zanark, banner + frame «Campeón» (Mítico)
--   top 2-3    1500 fichas, 180.000 coins, 10 Fichas EG, Cronus Fourseasons, banner + frame «Podio» (Legendario)
--   top 4-8     900 fichas, 100.000 coins,  6 Fichas EG, banner «Top 8» (Épico)
--   top 9-15    600 fichas,  60.000 coins,  4 Fichas EG, banner «Top 15» (Raro)
--   the rest    250 fichas,  25.000 coins,  2 Fichas EG
-- The game pays them when they are claimed; economy_cap counts the claimed fichas and coins.

create table if not exists private.season_closed (
  id text primary key references private.seasons (id) on delete cascade,
  closed_at timestamptz not null default now()
);
create table if not exists private.season_results (
  season text not null references private.seasons (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  pos integer not null,
  score bigint not null,
  tier text not null,
  tokens integer not null default 0,
  coins integer not null default 0,
  eg integer not null default 0,
  pennants text[] not null default '{}',
  player integer,
  claimed_at timestamptz,
  primary key (season, user_id)
);
create index if not exists season_results_user on private.season_results (user_id) where claimed_at is null;
create table if not exists private.scores_archive (season text not null, like public.scores);
revoke all on table private.season_closed, private.season_results, private.scores_archive from public, anon, authenticated;

-- closes every season that has ended and was not closed yet (idempotent; concurrent callers: only one does the work)
create or replace function private.close_due_seasons() returns void
language plpgsql volatile security definer set search_path = '' as $$
declare s record; n integer;
begin
  for s in select id from private.seasons where ends_at <= now() and id not in (select id from private.season_closed) order by ends_at loop
    insert into private.season_closed (id) values (s.id) on conflict do nothing;
    get diagnostics n = row_count;
    if n = 0 then continue; end if;
    insert into private.season_results (season, user_id, pos, score, tier, tokens, coins, eg, pennants, player)
    select s.id, b.user_id, b.pos, b.score,
      case when b.pos = 1 then 'top1' when b.pos <= 3 then 'top3' when b.pos <= 8 then 'top8' when b.pos <= 15 then 'top15' else 'resto' end,
      case when b.pos = 1 then 2500 when b.pos <= 3 then 1500 when b.pos <= 8 then 900 when b.pos <= 15 then 600 else 250 end,
      case when b.pos = 1 then 300000 when b.pos <= 3 then 180000 when b.pos <= 8 then 100000 when b.pos <= 15 then 60000 else 25000 end,
      case when b.pos = 1 then 15 when b.pos <= 3 then 10 when b.pos <= 8 then 6 when b.pos <= 15 then 4 else 2 end,
      case when b.pos = 1 then array[lower(s.id) || '-campeon', 'marco-' || lower(s.id) || '-campeon']
           when b.pos <= 3 then array[lower(s.id) || '-podio', 'marco-' || lower(s.id) || '-podio']
           when b.pos <= 8 then array[lower(s.id) || '-top8'] when b.pos <= 15 then array[lower(s.id) || '-top15'] else '{}'::text[] end,
      case when b.pos = 1 then 900401 when b.pos <= 3 then 900400 else null end
    from private.board(null, null, 'score') b
    on conflict (season, user_id) do nothing;
    insert into private.scores_archive select s.id, sc.* from public.scores sc;
    delete from public.scores;
  end loop;
end $$;

-- the caller's prizes of closed seasons, handed over once
create or replace function private.claim_season_rewards() returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare uid uuid := auth.uid(); out jsonb;
begin
  if uid is null then return '[]'::jsonb; end if;
  perform private.close_due_seasons();
  with got as (
    update private.season_results r set claimed_at = now() where r.user_id = uid and r.claimed_at is null
    returning r.season, r.pos, r.score, r.tier, r.tokens, r.coins, r.eg, r.pennants, r.player
  ) select coalesce(jsonb_agg(to_jsonb(got) order by got.season), '[]'::jsonb) into out from got;
  return out;
end $$;
create or replace function public.claim_season_rewards() returns jsonb
language sql volatile security invoker set search_path = '' as $$ select private.claim_season_rewards(); $$;
revoke execute on function private.close_due_seasons() from public, anon, authenticated;
revoke execute on function private.claim_season_rewards(), public.claim_season_rewards() from public, anon, authenticated;
grant execute on function private.claim_season_rewards(), public.claim_season_rewards() to authenticated;
alter function private.claim_season_rewards() set statement_timeout = '15s';

-- a new mark first closes a season that has just ended (so it counts for the new one)
create or replace function private.submit_score(p_run_id uuid, p_map text, p_rank text, p_time_sec integer, p_damage bigint, p_captain_id integer)
 returns text language plpgsql security definer set search_path to 'public', 'extensions' set lock_timeout to '3s'
as $function$
declare uid uuid := private.real_user(); dmg bigint;
begin
  perform private.close_due_seasons();
  if not exists (select 1 from public.profiles where id = uid) then raise exception 'no_username' using errcode = '42501'; end if;
  if p_rank not in ('C', 'B', 'A', 'S', 'X', 'Z') or p_map !~ '^[a-z0-9_-]{1,32}$' then raise exception 'invalid_board' using errcode = '22023'; end if;
  if p_rank = 'Z' and not private.rank_z_open() then raise exception 'rank_locked' using errcode = '22023'; end if;
  if p_time_sec < 0 or p_time_sec > 4 * 3600 then raise exception 'implausible_time' using errcode = '22023'; end if;
  if p_damage < 0 then raise exception 'implausible_damage' using errcode = '22023'; end if;
  dmg := least(p_damage, (p_time_sec + 1)::bigint * 800000);
  if exists (select 1 from public.submitted_runs r where r.user_id = uid and r.at > now() - interval '20 seconds') then
    raise exception 'too_fast' using errcode = '54000';
  end if;
  insert into public.submitted_runs (run_id, user_id) values (p_run_id, uid) on conflict do nothing;
  if not found then return 'duplicate'; end if;
  insert into public.scores as s (user_id, map, rank, time_sec, damage, captain_id, run_id)
    values (uid, p_map, p_rank, p_time_sec, dmg, coalesce(p_captain_id, 0), p_run_id)
  on conflict (user_id, map, rank) do update
    set time_sec = excluded.time_sec, damage = excluded.damage, captain_id = excluded.captain_id, run_id = excluded.run_id, created_at = now()
    where (private.score_of(excluded.rank, excluded.time_sec, excluded.damage), excluded.time_sec, excluded.damage)
        > (private.score_of(s.rank, s.time_sec, s.damage), s.time_sec, s.damage);
  return 'ok';
end $function$;

-- economy_cap: as in season_pass, plus the season prizes claimed since the last save
create or replace function private.economy_cap(p_new jsonb, p_old jsonb, p_since timestamptz, p_uid uuid) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare
  hours numeric := greatest(0, extract(epoch from (now() - coalesce(p_since, now()))) / 3600);
  promo_t numeric := 0; promo_c numeric := 0; bug_t numeric := 0; clan_t numeric := 0; clan_c numeric := 0; sea_t numeric := 0; sea_c numeric := 0;
  old_t numeric; old_c numeric; new_t numeric; new_c numeric; max_t numeric; max_c numeric;
  cur text := private.current_season(); seen integer := 0; claimed integer := 0; pass_n integer := 0;
  out jsonb := p_new;
begin
  if to_regclass('private.promo_redemptions') is not null then
    execute 'select coalesce(sum((r.result ->> ''tokens'')::numeric), 0), coalesce(sum((r.result ->> ''coins'')::numeric), 0)
      from private.promo_redemptions r where r.user_id = $1 and r.created_at > coalesce($2, ''-infinity''::timestamptz)'
      into promo_t, promo_c using p_uid, p_since;
  end if;
  select coalesce(sum(b.tokens), 0) into bug_t from private.bug_rewards b
    where b.user_id = p_uid and b.claimed_at is not null and b.claimed_at > coalesce(p_since, '-infinity'::timestamptz);
  select coalesce(sum(c.tokens), 0), coalesce(sum(c.coins), 0) into clan_t, clan_c from public.clan_rewards c
    where c.user_id = p_uid and c.claimed_at > coalesce(p_since, '-infinity'::timestamptz);
  select coalesce(sum(r.tokens), 0), coalesce(sum(r.coins), 0) into sea_t, sea_c from private.season_results r
    where r.user_id = p_uid and r.claimed_at is not null and r.claimed_at > coalesce(p_since, '-infinity'::timestamptz);
  promo_t := promo_t + bug_t + clan_t + sea_t;
  promo_c := promo_c + clan_c + sea_c;
  -- 2.1: the season pass
  if cur is not null and p_uid is not null and p_new -> 'season' ->> 'id' = cur then
    claimed := least(200,
      (case when jsonb_typeof(p_new -> 'season' -> 'claimedNormal') = 'array' then jsonb_array_length(p_new -> 'season' -> 'claimedNormal') else 0 end)
      + (case when jsonb_typeof(p_new -> 'season' -> 'claimedPremium') = 'array' then jsonb_array_length(p_new -> 'season' -> 'claimedPremium') else 0 end));
    select n into seen from private.season_claims where user_id = p_uid and season = cur;
    pass_n := greatest(0, claimed - coalesce(seen, 0));
    if pass_n > 0 then
      insert into private.season_claims (user_id, season, n) values (p_uid, cur, claimed)
      on conflict (user_id, season) do update set n = greatest(private.season_claims.n, excluded.n);
    end if;
    promo_t := promo_t + pass_n * 120;
    promo_c := promo_c + pass_n * 6000;
  end if;
  new_t := case when jsonb_typeof(p_new -> 'tokens') = 'number' then (p_new ->> 'tokens')::numeric else 0 end;
  new_c := case when jsonb_typeof(p_new -> 'coins') = 'number' then (p_new ->> 'coins')::numeric else 0 end;
  if p_old is null then
    max_t := 5000 + promo_t; max_c := 120000 + promo_c;
  else
    old_t := case when jsonb_typeof(p_old -> 'tokens') = 'number' then greatest(0, (p_old ->> 'tokens')::numeric) else 0 end;
    old_c := case when jsonb_typeof(p_old -> 'coins') = 'number' then greatest(0, (p_old ->> 'coins')::numeric) else 0 end;
    max_t := old_t + 2000 + 1000 * hours + promo_t;
    max_c := old_c + 16000 + 16000 * hours + promo_c;
  end if;
  if new_t > max_t then out := jsonb_set(out, '{tokens}', to_jsonb(floor(max_t)::bigint)); end if;
  if new_c > max_c then out := jsonb_set(out, '{coins}', to_jsonb(floor(max_c)::bigint)); end if;
  return out;
end $$;
revoke all on function private.economy_cap(jsonb, jsonb, timestamptz, uuid) from public, anon, authenticated;

notify pgrst, 'reload schema';

-- ===== 20261111000300_pass_125.sql
-- 2.1 (author): the season pass goes to 125 levels (Super Zanark's copies every 5 levels after 100, for CAMPEÓN+; the
-- ranking's top 1 gets the last one for CAMPEÓN++), so a season can have up to 250 claimed levels (both rows).

-- economy_cap: as in ranking_season; a season pass has 125 levels now, so up to 250 claimed levels count
create or replace function private.economy_cap(p_new jsonb, p_old jsonb, p_since timestamptz, p_uid uuid) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare
  hours numeric := greatest(0, extract(epoch from (now() - coalesce(p_since, now()))) / 3600);
  promo_t numeric := 0; promo_c numeric := 0; bug_t numeric := 0; clan_t numeric := 0; clan_c numeric := 0; sea_t numeric := 0; sea_c numeric := 0;
  old_t numeric; old_c numeric; new_t numeric; new_c numeric; max_t numeric; max_c numeric;
  cur text := private.current_season(); seen integer := 0; claimed integer := 0; pass_n integer := 0;
  out jsonb := p_new;
begin
  if to_regclass('private.promo_redemptions') is not null then
    execute 'select coalesce(sum((r.result ->> ''tokens'')::numeric), 0), coalesce(sum((r.result ->> ''coins'')::numeric), 0)
      from private.promo_redemptions r where r.user_id = $1 and r.created_at > coalesce($2, ''-infinity''::timestamptz)'
      into promo_t, promo_c using p_uid, p_since;
  end if;
  select coalesce(sum(b.tokens), 0) into bug_t from private.bug_rewards b
    where b.user_id = p_uid and b.claimed_at is not null and b.claimed_at > coalesce(p_since, '-infinity'::timestamptz);
  select coalesce(sum(c.tokens), 0), coalesce(sum(c.coins), 0) into clan_t, clan_c from public.clan_rewards c
    where c.user_id = p_uid and c.claimed_at > coalesce(p_since, '-infinity'::timestamptz);
  select coalesce(sum(r.tokens), 0), coalesce(sum(r.coins), 0) into sea_t, sea_c from private.season_results r
    where r.user_id = p_uid and r.claimed_at is not null and r.claimed_at > coalesce(p_since, '-infinity'::timestamptz);
  promo_t := promo_t + bug_t + clan_t + sea_t;
  promo_c := promo_c + clan_c + sea_c;
  -- 2.1: the season pass
  if cur is not null and p_uid is not null and p_new -> 'season' ->> 'id' = cur then
    claimed := least(250,
      (case when jsonb_typeof(p_new -> 'season' -> 'claimedNormal') = 'array' then jsonb_array_length(p_new -> 'season' -> 'claimedNormal') else 0 end)
      + (case when jsonb_typeof(p_new -> 'season' -> 'claimedPremium') = 'array' then jsonb_array_length(p_new -> 'season' -> 'claimedPremium') else 0 end));
    select n into seen from private.season_claims where user_id = p_uid and season = cur;
    pass_n := greatest(0, claimed - coalesce(seen, 0));
    if pass_n > 0 then
      insert into private.season_claims (user_id, season, n) values (p_uid, cur, claimed)
      on conflict (user_id, season) do update set n = greatest(private.season_claims.n, excluded.n);
    end if;
    promo_t := promo_t + pass_n * 120;
    promo_c := promo_c + pass_n * 6000;
  end if;
  new_t := case when jsonb_typeof(p_new -> 'tokens') = 'number' then (p_new ->> 'tokens')::numeric else 0 end;
  new_c := case when jsonb_typeof(p_new -> 'coins') = 'number' then (p_new ->> 'coins')::numeric else 0 end;
  if p_old is null then
    max_t := 5000 + promo_t; max_c := 120000 + promo_c;
  else
    old_t := case when jsonb_typeof(p_old -> 'tokens') = 'number' then greatest(0, (p_old ->> 'tokens')::numeric) else 0 end;
    old_c := case when jsonb_typeof(p_old -> 'coins') = 'number' then greatest(0, (p_old ->> 'coins')::numeric) else 0 end;
    max_t := old_t + 2000 + 1000 * hours + promo_t;
    max_c := old_c + 16000 + 16000 * hours + promo_c;
  end if;
  if new_t > max_t then out := jsonb_set(out, '{tokens}', to_jsonb(floor(max_t)::bigint)); end if;
  if new_c > max_c then out := jsonb_set(out, '{coins}', to_jsonb(floor(max_c)::bigint)); end if;
  return out;
end $$;
revoke all on function private.economy_cap(jsonb, jsonb, timestamptz, uuid) from public, anon, authenticated;

notify pgrst, 'reload schema';
