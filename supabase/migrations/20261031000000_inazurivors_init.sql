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
