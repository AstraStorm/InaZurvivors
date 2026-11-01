-- Google is the only sign-in: the game needs to know whether the account opening it already has a global name
-- (returning player: load the cloud progress) or not (first connection: profile creation and name reservation).
-- Read-only, the caller's own row only. Tables, policies and the other functions are unchanged.

create or replace function private.my_profile() returns table (username extensions.citext, avatar text, crest text)
language sql stable security definer set search_path = public, extensions as $$
  select p.username, p.avatar, p.crest from public.profiles p where p.id = auth.uid();
$$;

create or replace function public.my_profile() returns table (username extensions.citext, avatar text, crest text)
language sql stable security invoker set search_path = '' as $$
  select * from private.my_profile();
$$;

revoke execute on function private.my_profile(), public.my_profile() from public, anon, authenticated;
grant execute on function private.my_profile(), public.my_profile() to authenticated;
