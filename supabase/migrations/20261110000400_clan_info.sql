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
