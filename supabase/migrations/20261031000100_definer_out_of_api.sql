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
