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
