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
