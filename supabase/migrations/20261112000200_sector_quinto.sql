-- 2.2 (author): «Sector Quinto». From 13 November 12:00 to the end of the Temporada 1 (12 December 15:00) each account
-- takes a side for good: Sector Quinto or Resistencia. Its runs add their points (the ranking's, worked out here by
-- submit_score, ×1.5 when the player rebelled against the match's decree) to the side's week. Every Thursday at 12:00 the
-- week closes: the side with the higher AVERAGE per active member (anyone who scored that week) wins. Winners get 300
-- fichas and 15.000 coins (the side's frame and copies of its three footballers are given by the client), losers who
-- played 100 and 5.000. Sides are kept even: nobody can join the side that is ahead by more than max(5, 10 %).
-- Same dates in src/systems/sector.ts. Weeks close lazily (sector_status / sector_claim), like the ranking seasons.

create or replace function private.sector_start() returns timestamptz language sql immutable as $$ select '2026-11-13 12:00+01'::timestamptz $$;
create or replace function private.sector_end() returns timestamptz language sql immutable as $$ select '2026-12-12 15:00+01'::timestamptz $$;
create or replace function private.sector_weeks_n() returns integer language sql immutable as $$ select 4 $$;
-- the week (0..3) a moment falls in, null outside the event; the last week runs to the end of the season
create or replace function private.sector_week(p_at timestamptz) returns integer language sql stable as $$
  select case when p_at < private.sector_start() or p_at >= private.sector_end() then null
    else least(private.sector_weeks_n() - 1, floor(extract(epoch from (p_at - private.sector_start())) / (7 * 86400))::integer) end
$$;
create or replace function private.sector_week_end(p_week integer) returns timestamptz language sql stable as $$
  select case when p_week >= private.sector_weeks_n() - 1 then private.sector_end() else private.sector_start() + (p_week + 1) * interval '7 days' end
$$;

create table if not exists private.sector_members (
  user_id uuid primary key references auth.users (id) on delete cascade,
  side text not null check (side in ('sector', 'resistencia')),
  joined_at timestamptz not null default now()
);
create table if not exists private.sector_points (
  user_id uuid not null references auth.users (id) on delete cascade,
  week integer not null,
  points bigint not null default 0,
  primary key (user_id, week)
);
create table if not exists private.sector_credited (
  run_id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  week integer not null,
  points bigint not null,
  rebel boolean not null default false,
  at timestamptz not null default now()
);
create table if not exists private.sector_results (
  week integer primary key,
  winner text not null check (winner in ('sector', 'resistencia', 'empate')),
  avg_sector numeric not null default 0,
  avg_resistencia numeric not null default 0,
  active_sector integer not null default 0,
  active_resistencia integer not null default 0,
  closed_at timestamptz not null default now()
);
create table if not exists private.sector_claims (
  user_id uuid not null references auth.users (id) on delete cascade,
  week integer not null,
  side text not null,
  won boolean not null,
  tokens integer not null,
  coins integer not null,
  claimed_at timestamptz not null default now(),
  primary key (user_id, week)
);
revoke all on table private.sector_members, private.sector_points, private.sector_credited, private.sector_results, private.sector_claims from public, anon, authenticated;

-- the points of each run, kept by submit_score so a side only ever gets what the server worked out
alter table public.submitted_runs add column if not exists points bigint;

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
  insert into public.submitted_runs (run_id, user_id, points) values (p_run_id, uid, private.score_of(p_rank, p_time_sec, dmg)) on conflict do nothing;
  if not found then return 'duplicate'; end if;
  insert into public.scores as s (user_id, map, rank, time_sec, damage, captain_id, run_id)
    values (uid, p_map, p_rank, p_time_sec, dmg, coalesce(p_captain_id, 0), p_run_id)
  on conflict (user_id, map, rank) do update
    set time_sec = excluded.time_sec, damage = excluded.damage, captain_id = excluded.captain_id, run_id = excluded.run_id, created_at = now()
    where (private.score_of(excluded.rank, excluded.time_sec, excluded.damage), excluded.time_sec, excluded.damage)
        > (private.score_of(s.rank, s.time_sec, s.damage), s.time_sec, s.damage);
  return 'ok';
end $function$;

-- weeks that have ended get their result, once
create or replace function private.sector_close_due() returns void
language plpgsql volatile security definer set search_path = '' as $$
declare w integer; a_s numeric; a_r numeric; n_s integer; n_r integer;
begin
  for w in 0 .. private.sector_weeks_n() - 1 loop
    exit when private.sector_week_end(w) > now();
    continue when exists (select 1 from private.sector_results r where r.week = w);
    perform pg_advisory_xact_lock(hashtext('sector_close'), w);
    continue when exists (select 1 from private.sector_results r where r.week = w);
    select coalesce(avg(p.points) filter (where m.side = 'sector'), 0), coalesce(avg(p.points) filter (where m.side = 'resistencia'), 0),
           count(*) filter (where m.side = 'sector'), count(*) filter (where m.side = 'resistencia')
      into a_s, a_r, n_s, n_r
      from private.sector_points p join private.sector_members m on m.user_id = p.user_id
      where p.week = w and p.points > 0;
    insert into private.sector_results (week, winner, avg_sector, avg_resistencia, active_sector, active_resistencia)
      values (w, case when a_s > a_r then 'sector' when a_r > a_s then 'resistencia' else 'empate' end, round(a_s), round(a_r), n_s, n_r)
      on conflict (week) do nothing;
  end loop;
end $$;

-- the most a side may have more than the other before it stops taking new members
create or replace function private.sector_margin(p_total integer) returns integer language sql immutable as $$
  select greatest(5, ceil(p_total * 0.1)::integer)
$$;

create or replace function private.sector_join(p_side text) returns text
language plpgsql volatile security definer set search_path = '' as $$
declare uid uuid := private.real_user(); n_s integer; n_r integer; mine integer; other integer;
begin
  if uid is null or not exists (select 1 from public.profiles where id = uid) then raise exception 'no_username' using errcode = '42501'; end if;
  if p_side not in ('sector', 'resistencia') then raise exception 'invalid_side' using errcode = '22023'; end if;
  if private.sector_week(now()) is null then raise exception 'sector_closed' using errcode = '22023'; end if;
  perform pg_advisory_xact_lock(hashtext('sector_join'));
  if exists (select 1 from private.sector_members where user_id = uid) then raise exception 'already_in_side' using errcode = '23505'; end if;
  select count(*) filter (where side = 'sector'), count(*) filter (where side = 'resistencia') into n_s, n_r from private.sector_members;
  mine := case when p_side = 'sector' then n_s else n_r end;
  other := case when p_side = 'sector' then n_r else n_s end;
  if mine - other >= private.sector_margin(n_s + n_r) then raise exception 'side_full' using errcode = '22023'; end if;
  insert into private.sector_members (user_id, side) values (uid, p_side);
  return p_side;
end $$;
alter function private.sector_join(text) set statement_timeout = '5s';

-- a run's points go to the player's side (once per run, only runs sent in the last 10 minutes)
create or replace function private.sector_credit(p_run_id uuid, p_rebel boolean) returns bigint
language plpgsql volatile security definer set search_path = '' as $$
declare uid uuid := private.real_user(); w integer := private.sector_week(now()); pts bigint;
begin
  if uid is null or w is null or not exists (select 1 from private.sector_members where user_id = uid) then return 0; end if;
  select r.points into pts from public.submitted_runs r where r.run_id = p_run_id and r.user_id = uid and r.at > now() - interval '10 minutes';
  if pts is null or pts <= 0 then return 0; end if;
  pts := floor(pts * (case when p_rebel then 1.5 else 1 end));
  insert into private.sector_credited (run_id, user_id, week, points, rebel) values (p_run_id, uid, w, pts, coalesce(p_rebel, false)) on conflict do nothing;
  if not found then return 0; end if;
  insert into private.sector_points as p (user_id, week, points) values (uid, w, pts)
    on conflict (user_id, week) do update set points = p.points + excluded.points;
  return pts;
end $$;
alter function private.sector_credit(uuid, boolean) set statement_timeout = '5s';

-- everything the menu and the side screen show: dates, my side, sides' sizes and who may still join, this week's
-- averages, my points this week and past results
create or replace function private.sector_status() returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare uid uuid := private.real_user(); w integer := private.sector_week(now()); n_s integer; n_r integer; m integer; mine text;
  a_s numeric := 0; a_r numeric := 0; c_s integer := 0; c_r integer := 0; my_pts bigint := 0;
begin
  perform private.sector_close_due();
  select count(*) filter (where side = 'sector'), count(*) filter (where side = 'resistencia') into n_s, n_r from private.sector_members;
  m := private.sector_margin(n_s + n_r);
  if uid is not null then select side into mine from private.sector_members where user_id = uid; end if;
  if w is not null then
    select coalesce(avg(p.points) filter (where s.side = 'sector'), 0), coalesce(avg(p.points) filter (where s.side = 'resistencia'), 0),
           count(*) filter (where s.side = 'sector'), count(*) filter (where s.side = 'resistencia')
      into a_s, a_r, c_s, c_r
      from private.sector_points p join private.sector_members s on s.user_id = p.user_id where p.week = w and p.points > 0;
    if uid is not null then select coalesce(points, 0) into my_pts from private.sector_points where user_id = uid and week = w; end if;
  end if;
  return jsonb_build_object(
    'start', private.sector_start(), 'end', private.sector_end(), 'week', w, 'weekEnd', case when w is null then null else private.sector_week_end(w) end,
    'side', mine, 'members', jsonb_build_object('sector', n_s, 'resistencia', n_r),
    'canJoin', jsonb_build_object('sector', n_s - n_r < m, 'resistencia', n_r - n_s < m),
    'avg', jsonb_build_object('sector', round(a_s), 'resistencia', round(a_r)),
    'active', jsonb_build_object('sector', c_s, 'resistencia', c_r),
    'myPoints', coalesce(my_pts, 0),
    'results', coalesce((select jsonb_agg(jsonb_build_object('week', r.week, 'winner', r.winner, 'sector', r.avg_sector, 'resistencia', r.avg_resistencia) order by r.week)
      from private.sector_results r), '[]'::jsonb));
end $$;
alter function private.sector_status() set statement_timeout = '5s';

-- the weeks this player has to collect: every closed week they scored in, won or lost, once
create or replace function private.sector_claim() returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare uid uuid := private.real_user(); mine text; got jsonb := '[]'::jsonb; r record; won boolean;
begin
  if uid is null then return got; end if;
  perform private.sector_close_due();
  select side into mine from private.sector_members where user_id = uid;
  if mine is null then return got; end if;
  for r in select res.week, res.winner from private.sector_results res
      join private.sector_points p on p.user_id = uid and p.week = res.week and p.points > 0
      where not exists (select 1 from private.sector_claims c where c.user_id = uid and c.week = res.week) order by res.week loop
    won := r.winner = mine or r.winner = 'empate';
    insert into private.sector_claims (user_id, week, side, won, tokens, coins)
      values (uid, r.week, mine, won, case when won then 300 else 100 end, case when won then 15000 else 5000 end)
      on conflict do nothing;
    if found then
      got := got || jsonb_build_object('week', r.week, 'side', mine, 'won', won, 'winner', r.winner,
        'tokens', case when won then 300 else 100 end, 'coins', case when won then 15000 else 5000 end);
    end if;
  end loop;
  return got;
end $$;
alter function private.sector_claim() set statement_timeout = '10s';

create or replace function public.sector_join(p_side text) returns text language sql volatile security invoker set search_path = '' as $$ select private.sector_join(p_side); $$;
create or replace function public.sector_credit(p_run_id uuid, p_rebel boolean) returns bigint language sql volatile security invoker set search_path = '' as $$ select private.sector_credit(p_run_id, p_rebel); $$;
create or replace function public.sector_status() returns jsonb language sql volatile security invoker set search_path = '' as $$ select private.sector_status(); $$;
create or replace function public.sector_claim() returns jsonb language sql volatile security invoker set search_path = '' as $$ select private.sector_claim(); $$;

revoke execute on function private.sector_close_due(), private.sector_join(text), private.sector_credit(uuid, boolean), private.sector_status(), private.sector_claim(),
  public.sector_join(text), public.sector_credit(uuid, boolean), public.sector_status(), public.sector_claim() from public;
grant execute on function private.sector_join(text), private.sector_credit(uuid, boolean), private.sector_claim(),
  public.sector_join(text), public.sector_credit(uuid, boolean), public.sector_claim() to authenticated;
grant execute on function private.sector_status(), public.sector_status() to anon, authenticated;

-- economy_cap: as in pass_125, plus the Sector Quinto weeks claimed since the last save
create or replace function private.economy_cap(p_new jsonb, p_old jsonb, p_since timestamptz, p_uid uuid) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare
  hours numeric := greatest(0, extract(epoch from (now() - coalesce(p_since, now()))) / 3600);
  promo_t numeric := 0; promo_c numeric := 0; bug_t numeric := 0; clan_t numeric := 0; clan_c numeric := 0; sea_t numeric := 0; sea_c numeric := 0;
  sec_t numeric := 0; sec_c numeric := 0;
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
  select coalesce(sum(s.tokens), 0), coalesce(sum(s.coins), 0) into sec_t, sec_c from private.sector_claims s
    where s.user_id = p_uid and s.claimed_at > coalesce(p_since, '-infinity'::timestamptz);
  promo_t := promo_t + bug_t + clan_t + sea_t + sec_t;
  promo_c := promo_c + clan_c + sea_c + sec_c;
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
