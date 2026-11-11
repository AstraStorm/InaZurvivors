-- 2.11 (author: «los que tengan el pase, nombre en dorado en el ranking»; only the premium one, the Llave dorada): which of
-- these names hold the gold key of the season open now. Pass ownership lives only in the cloud save (save.season, whose
-- id must be the current season: last season's key does not count), the same way profile_frames reads the frame.
create or replace function private.pass_holders(p_usernames text[]) returns table (username text)
language sql stable security definer set search_path = public as $$
  select p.username::text
  from public.profiles p
  join public.saves s on s.user_id = p.id
  where p.username = any (select trim(u)::extensions.citext from unnest(p_usernames[1:60]) u)
    and s.data->'season'->>'id' = private.current_season()
    and s.data->'season'->>'gold' = 'true'
$$;
alter function private.pass_holders(text[]) set statement_timeout = '5s';

create or replace function public.pass_holders(p_usernames text[]) returns table (username text)
language sql stable security invoker set search_path = '' as $$ select * from private.pass_holders(p_usernames); $$;

revoke execute on function private.pass_holders(text[]), public.pass_holders(text[]) from public;
grant execute on function private.pass_holders(text[]), public.pass_holders(text[]) to anon, authenticated;
