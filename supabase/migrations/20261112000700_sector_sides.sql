-- 2.2 (author: «que se vea en el ranking el bando, si Sector Quinto o Resistencia»): the side of each of these names, for
-- a mark next to them on the boards. Names without a side are left out. Sides are public anyway (each week's tally).
create or replace function private.sector_sides(p_usernames text[]) returns table (username text, side text)
language sql stable security definer set search_path = public as $$
  select p.username::text, m.side
  from public.profiles p
  join private.sector_members m on m.user_id = p.id
  where p.username = any (select trim(u)::extensions.citext from unnest(p_usernames[1:60]) u)
$$;
alter function private.sector_sides(text[]) set statement_timeout = '5s';

create or replace function public.sector_sides(p_usernames text[]) returns table (username text, side text)
language sql stable security invoker set search_path = '' as $$ select * from private.sector_sides(p_usernames); $$;

revoke execute on function private.sector_sides(text[]), public.sector_sides(text[]) from public;
grant execute on function private.sector_sides(text[]), public.sector_sides(text[]) to anon, authenticated;

notify pgrst, 'reload schema';
