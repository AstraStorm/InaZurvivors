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
