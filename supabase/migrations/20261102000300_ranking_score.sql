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
