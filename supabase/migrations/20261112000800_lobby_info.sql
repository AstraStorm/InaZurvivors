-- 2.3 (author: «que en la sala de players salgan tus amigos, el bando, la equipación que llevan, el top 1, 2 y 3 y el
-- clan»): everything the Sala de jugadores shows of each player in one call, for every name of the room (up to the 1.000
-- of the leaderboard): the kit they wear, their Sector Quinto side, their clan with its crest, their banner and frame.
-- All of it is already public one by one (public_profile, sector_sides, clan_of, profile_banners, profile_frames).
create or replace function private.lobby_info(p_usernames text[])
returns table (username text, kit text, side text, clan text, crest text, banner text, frame text)
language sql stable security definer set search_path = public as $$
  select p.username::text,
    case when coalesce(s.data->>'kit', '') ~ '^[^<>"''&]{1,64}$' then s.data->>'kit' else '' end,
    m.side,
    c.name::text,
    c.crest,
    case when coalesce(s.data->'pennants'->>'equipped', '') ~ '^[a-z0-9-]{1,32}$' then s.data->'pennants'->>'equipped' end,
    case when coalesce(s.data->'pennants'->>'frame', '') ~ '^[a-z0-9-]{1,32}$' then s.data->'pennants'->>'frame' end
  from public.profiles p
  left join public.saves s on s.user_id = p.id
  left join private.sector_members m on m.user_id = p.id
  left join public.clan_members cm on cm.user_id = p.id
  left join public.clans c on c.id = cm.clan_id
  where p.username = any (select trim(u)::extensions.citext from unnest(p_usernames[1:1000]) u)
$$;
alter function private.lobby_info(text[]) set statement_timeout = '8s';

create or replace function public.lobby_info(p_usernames text[])
returns table (username text, kit text, side text, clan text, crest text, banner text, frame text)
language sql stable security invoker set search_path = '' as $$ select * from private.lobby_info(p_usernames); $$;

revoke execute on function private.lobby_info(text[]), public.lobby_info(text[]) from public;
grant execute on function private.lobby_info(text[]), public.lobby_info(text[]) to anon, authenticated;

notify pgrst, 'reload schema';
