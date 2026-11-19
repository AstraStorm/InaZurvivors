-- Modo Duelo: opens with the 3.0 and the admin panel gets its metrics (author: «el duelo sale con la 3.0, pero yo, desde
-- el panel mío de admin, puedo entrar ya. Añade a las métricas y prepáralas para el modo duelo, pj más usados, victorias y eso»).
--   · Before private.duel_opens_at() only admins can open a match against the CPU or join the online queue (a trigger on
--     their tables, so the RPCs keep their bodies).
--   · duel_start also keeps your team, coach, the rival's and the story chapter; duel_finish the turns, fusions, combined
--     techniques and ultis. The old one-argument calls still work (the new arguments have defaults).
--   · Online matches are deleted after two days, so each finished one is copied to private.duel_pvp_log (teams, winner, reason).
--   · admin_duel_metrics(days): matches and players per day, wins per level, the most used footballers and coaches with
--     their win share (CPU and online), the story chapters cleared, and how online matches end.

create or replace function private.duel_opens_at() returns timestamptz language sql immutable set search_path = '' as $$
  select timestamptz '2026-11-25 12:00:00+01' $$;

create or replace function private.duel_gate() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if now() < private.duel_opens_at() and not private.is_admin() then raise exception 'duel_not_open' using errcode = 'P0001'; end if;
  return new;
end $$;
drop trigger if exists duel_runs_gate on private.duel_runs;
create trigger duel_runs_gate before insert on private.duel_runs for each row execute function private.duel_gate();
drop trigger if exists duel_queue_gate on private.duel_queue;
create trigger duel_queue_gate before insert on private.duel_queue for each row execute function private.duel_gate();

alter table private.duel_runs
  add column if not exists team integer[],
  add column if not exists coach text,
  add column if not exists rival integer[],
  add column if not exists chapter text,
  add column if not exists turns integer,
  add column if not exists merges integer,
  add column if not exists combos integer,
  add column if not exists ultis integer;
create index if not exists duel_runs_started on private.duel_runs (started_at);

-- a list of footballer ids from what a client sent: at most 4 integers
create or replace function private.duel_pids(p jsonb) returns integer[] language sql immutable set search_path = '' as $$
  select case when jsonb_typeof(p) = 'array' and jsonb_array_length(p) between 1 and 4
    and not exists (select 1 from jsonb_array_elements(p) e where jsonb_typeof(e) <> 'number')
    then (select array_agg((e #>> '{}')::numeric::integer) from jsonb_array_elements(p) e) end $$;

drop function if exists public.duel_start(text);
create or replace function public.duel_start(p_level text, p_team jsonb default null, p_coach text default null, p_rival jsonb default null, p_chapter text default null) returns uuid
language plpgsql volatile security definer set search_path = '' as $$
declare uid uuid := private.real_user(); rid uuid;
begin
  if uid is null then raise exception 'not_signed_in' using errcode = '28000'; end if;
  if p_level not in ('facil', 'normal', 'dificil') then raise exception 'bad_level' using errcode = '22023'; end if;
  -- a match at a time is enough: the ones left open are closed without pay
  update private.duel_runs set finished_at = now(), won = false where user_id = uid and finished_at is null;
  insert into private.duel_runs (user_id, level, team, coach, rival, chapter)
    values (uid, p_level, private.duel_pids(p_team), left(p_coach, 24), private.duel_pids(p_rival), case when p_chapter ~ '^[0-9]-[0-9]$' then p_chapter end)
    returning id into rid;
  return rid;
end $$;

drop function if exists public.duel_finish(uuid, boolean);
create or replace function public.duel_finish(p_run uuid, p_won boolean, p_stats jsonb default null) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare uid uuid := private.real_user(); r private.duel_runs; today integer; pay integer := 0;
  n_ jsonb := case when jsonb_typeof(p_stats) = 'object' then p_stats else '{}'::jsonb end;
begin
  if uid is null then raise exception 'not_signed_in' using errcode = '28000'; end if;
  select * into r from private.duel_runs where id = p_run and user_id = uid for update;
  if not found or r.finished_at is not null then return jsonb_build_object('coins', 0, 'left', 0, 'why', 'closed'); end if;
  select count(*) into today from private.duel_runs
    where user_id = uid and paid_at is not null and (paid_at at time zone 'Europe/Madrid')::date = (now() at time zone 'Europe/Madrid')::date;
  if coalesce(p_won, false) and now() - r.started_at >= interval '60 seconds' and today < 10 then pay := 30000; end if;
  update private.duel_runs set finished_at = now(), won = coalesce(p_won, false), coins = pay, paid_at = case when pay > 0 then now() end,
    turns = least(99, greatest(0, (case when jsonb_typeof(n_->'turns') = 'number' then (n_->>'turns')::numeric end)::integer)),
    merges = least(999, greatest(0, (case when jsonb_typeof(n_->'merges') = 'number' then (n_->>'merges')::numeric end)::integer)),
    combos = least(99, greatest(0, (case when jsonb_typeof(n_->'combos') = 'number' then (n_->>'combos')::numeric end)::integer)),
    ultis = least(99, greatest(0, (case when jsonb_typeof(n_->'ultis') = 'number' then (n_->>'ultis')::numeric end)::integer))
    where id = r.id;
  return jsonb_build_object('coins', pay, 'left', greatest(0, 10 - today - (case when pay > 0 then 1 else 0 end)),
    'why', case when pay > 0 then 'paid' when not coalesce(p_won, false) then 'lost' when today >= 10 then 'cap' else 'short' end);
end $$;
revoke all on function public.duel_start(text, jsonb, text, jsonb, text) from public, anon;
revoke all on function public.duel_finish(uuid, boolean, jsonb) from public, anon;
grant execute on function public.duel_start(text, jsonb, text, jsonb, text) to authenticated;
grant execute on function public.duel_finish(uuid, boolean, jsonb) to authenticated;

-- the finished online matches, kept for the metrics
create table if not exists private.duel_pvp_log (
  match_id uuid primary key,
  created_at timestamptz not null,
  ended_at timestamptz not null default now(),
  a uuid, b uuid, a_team integer[], b_team integer[], a_coach text, b_coach text,
  winner smallint, reason text
);
alter table private.duel_pvp_log enable row level security;
revoke all on private.duel_pvp_log from public, anon, authenticated;
create index if not exists duel_pvp_log_ended on private.duel_pvp_log (ended_at);

create or replace function private.duel_team_pids(t jsonb) returns integer[] language sql immutable set search_path = '' as $$
  select array_agg((u->>'pid')::numeric::integer) from jsonb_array_elements(case when jsonb_typeof(t->'units') = 'array' then t->'units' else '[]'::jsonb end) u
  where jsonb_typeof(u->'pid') = 'number' $$;

create or replace function private.duel_pvp_logged() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.status = 'done' and old.status is distinct from 'done' then
    insert into private.duel_pvp_log (match_id, created_at, a, b, a_team, b_team, a_coach, b_coach, winner, reason)
      values (new.id, new.created_at, new.a, new.b, private.duel_team_pids(new.a_team), private.duel_team_pids(new.b_team),
        left(new.a_team->>'coach', 24), left(new.b_team->>'coach', 24), new.winner, left(new.reason, 16))
      on conflict (match_id) do nothing;
  end if;
  return new;
end $$;
drop trigger if exists duel_matches_log on private.duel_matches;
create trigger duel_matches_log after update on private.duel_matches for each row execute function private.duel_pvp_logged();

create or replace function private.admin_duel_metrics(p_days integer default 30) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  d integer := least(greatest(coalesce(p_days, 30), 7), 90);
  today date := (now() at time zone 'Europe/Madrid')::date;
  since timestamptz := now() - make_interval(days => d);
  out jsonb;
begin
  if not private.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  with runs as (select * from private.duel_runs where started_at > since and finished_at is not null),
  pvp as (select * from private.duel_pvp_log where ended_at > since),
  -- every footballer in a finished match: CPU (yours only) and online (both sides)
  uses as (
    select p as pid, won, 'cpu' as kind from runs, unnest(team) p where team is not null
    union all select p, winner = 0, 'pvp' from pvp, unnest(a_team) p where winner is not null
    union all select p, winner = 1, 'pvp' from pvp, unnest(b_team) p where winner is not null),
  coaches as (
    select coach, won from runs where coach is not null
    union all select a_coach, winner = 0 from pvp where a_coach is not null and winner is not null
    union all select b_coach, winner = 1 from pvp where b_coach is not null and winner is not null)
  select jsonb_build_object(
    'days', d,
    'opens_at', private.duel_opens_at(),
    'totals', jsonb_build_object(
      'cpu', (select count(*) from runs), 'cpu_wins', (select count(*) filter (where won) from runs),
      'players', (select count(distinct user_id) from runs),
      'coins', (select coalesce(sum(coins), 0) from runs),
      'pvp', (select count(*) from pvp), 'pvp_players', (select count(distinct u) from pvp, lateral (values (pvp.a), (pvp.b)) v(u)),
      'merges', (select coalesce(sum(merges), 0) from runs), 'combos', (select coalesce(sum(combos), 0) from runs), 'ultis', (select coalesce(sum(ultis), 0) from runs),
      'turns_avg', (select round(avg(turns)::numeric, 1) from runs where turns is not null)),
    'daily', (select jsonb_agg(jsonb_build_object('day', x.day,
        'cpu', (select count(*) from runs r where (r.started_at at time zone 'Europe/Madrid')::date = x.day),
        'players', (select count(distinct user_id) from runs r where (r.started_at at time zone 'Europe/Madrid')::date = x.day),
        'pvp', (select count(*) from pvp p where (p.ended_at at time zone 'Europe/Madrid')::date = x.day)) order by x.day)
      from (select generate_series(today - (d - 1), today, interval '1 day')::date as day) x),
    'levels', coalesce((select jsonb_agg(jsonb_build_object('level', level, 'n', n, 'wins', w) order by array_position(array['facil','normal','dificil'], level))
      from (select level, count(*) n, count(*) filter (where won) w from runs where chapter is null group by level) z), '[]'::jsonb),
    'players_top', coalesce((select jsonb_agg(jsonb_build_object('id', pid, 'n', n, 'wins', w, 'cpu', c, 'pvp', v) order by n desc)
      from (select pid, count(*) n, count(*) filter (where won) w, count(*) filter (where kind = 'cpu') c, count(*) filter (where kind = 'pvp') v
        from uses group by pid order by n desc limit 50) z), '[]'::jsonb),
    'coaches', coalesce((select jsonb_agg(jsonb_build_object('id', coach, 'n', n, 'wins', w) order by n desc)
      from (select coach, count(*) n, count(*) filter (where won) w from coaches group by coach) z), '[]'::jsonb),
    'story', coalesce((select jsonb_agg(jsonb_build_object('chapter', chapter, 'n', n, 'wins', w, 'players', p) order by chapter)
      from (select chapter, count(*) n, count(*) filter (where won) w, count(distinct user_id) filter (where won) p from runs where chapter is not null group by chapter) z), '[]'::jsonb),
    'pvp_end', coalesce((select jsonb_agg(jsonb_build_object('reason', reason, 'n', n) order by n desc)
      from (select coalesce(reason, '?') reason, count(*) n from pvp group by 1) z), '[]'::jsonb)
  ) into out;
  return out;
end $$;
alter function private.admin_duel_metrics(integer) set statement_timeout = '8s';

create or replace function public.admin_duel_metrics(p_days integer default 30) returns jsonb
language sql stable security invoker set search_path = '' as $$ select private.admin_duel_metrics(p_days); $$;

revoke all on function private.duel_gate(), private.duel_pvp_logged(), private.duel_pids(jsonb), private.duel_team_pids(jsonb), private.duel_opens_at() from public, anon, authenticated;
revoke execute on function private.admin_duel_metrics(integer), public.admin_duel_metrics(integer) from public, anon, authenticated;
grant execute on function private.admin_duel_metrics(integer), public.admin_duel_metrics(integer) to authenticated;

notify pgrst, 'reload schema';
