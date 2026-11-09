-- 2.0 (author: «que en el ranking se vea si es campeón o no»): for each name on the ranking and the captain of its mark,
-- that footballer's Camino del Campeón level in the player's own save (0 none, 1 CAMPEÓN, 2 CAMPEÓN+, 3 CAMPEÓN++).
-- Public, like the clan: one small number per row. At most 60 pairs per call.
create or replace function private.champion_of(p_usernames text[], p_captains integer[])
returns table (username text, captain_id integer, champion integer)
language sql stable security definer set search_path = '' as $$
  select p.username::text, q.cap,
         least(3, greatest(0, coalesce((s.data -> 'owned' -> (q.cap::text) ->> 'champion')::integer, 0)))
  from unnest(p_usernames[1:60], p_captains[1:60]) as q(name, cap)
  join public.profiles p on lower(p.username::text) = lower(q.name)
  join public.saves s on s.user_id = p.id
  where q.cap is not null;
$$;
create or replace function public.champion_of(p_usernames text[], p_captains integer[])
returns table (username text, captain_id integer, champion integer)
language sql stable security invoker set search_path = '' as $$ select * from private.champion_of(p_usernames, p_captains); $$;
revoke execute on function private.champion_of(text[], integer[]), public.champion_of(text[], integer[]) from public, anon, authenticated;
grant execute on function private.champion_of(text[], integer[]), public.champion_of(text[], integer[]) to anon, authenticated;
