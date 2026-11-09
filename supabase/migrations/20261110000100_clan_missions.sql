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
