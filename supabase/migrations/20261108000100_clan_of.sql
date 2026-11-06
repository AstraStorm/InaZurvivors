-- 1.93 (author): the clan of each player on the ranking. Public: a name, its clan's name and crest (players without a
-- clan are left out). At most 60 names per call.
create or replace function private.clan_of(p_usernames text[]) returns table (username text, clan text, crest text)
language sql stable security definer set search_path = '' as $$
  select p.username::text, c.name::text, c.crest
  from public.profiles p join public.clan_members m on m.user_id = p.id join public.clans c on c.id = m.clan_id
  where lower(p.username::text) in (select lower(x) from unnest(p_usernames[1:60]) x);
$$;
create or replace function public.clan_of(p_usernames text[]) returns table (username text, clan text, crest text)
language sql stable security invoker set search_path = '' as $$ select * from private.clan_of(p_usernames); $$;
revoke execute on function private.clan_of(text[]), public.clan_of(text[]) from public, anon, authenticated;
grant execute on function private.clan_of(text[]), public.clan_of(text[]) to anon, authenticated;
