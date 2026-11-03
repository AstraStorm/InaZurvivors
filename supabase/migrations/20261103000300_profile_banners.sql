-- v1.65 (author): profile banners. The banner a player shows lives in their save (data->'pennants'->>'equipped'); the
-- ranking asks for the banners of the names on screen, and the public profile includes it. Only the id of a known
-- shape (lowercase letters, digits and dashes) leaves the save; the game ignores ids it does not know.

create or replace function private.profile_banners(p_usernames text[]) returns table (username text, banner text)
language sql stable security definer set search_path = public as $$
  select p.username::text, s.data->'pennants'->>'equipped'
  from public.profiles p
  join public.saves s on s.user_id = p.id
  where p.username = any (select trim(u)::extensions.citext from unnest(p_usernames[1:60]) u)
    and coalesce(s.data->'pennants'->>'equipped', '') ~ '^[a-z0-9-]{1,32}$'
$$;
alter function private.profile_banners(text[]) set statement_timeout = '5s';

create or replace function public.profile_banners(p_usernames text[]) returns table (username text, banner text)
language sql stable security invoker set search_path = '' as $$ select * from private.profile_banners(p_usernames); $$;

revoke execute on function private.profile_banners(text[]), public.profile_banners(text[]) from public;
grant execute on function private.profile_banners(text[]), public.profile_banners(text[]) to anon, authenticated;

-- the public profile also carries the banner (same rule)
create or replace function private.public_profile(p_username text) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'username', p.username::text,
    'avatar', p.avatar,
    'crest', coalesce(nullif(s.data->>'crest', ''), p.crest),
    'joined', p.created_at::date,
    'favorite', coalesce(s.data->>'favoriteTeam', ''),
    'icon', coalesce(s.data->'profile'->'icon', 'null'::jsonb),
    'kit', coalesce(s.data->>'kit', ''),
    'captain', coalesce(s.data->'captainId', 'null'::jsonb),
    'banner', case when coalesce(s.data->'pennants'->>'equipped', '') ~ '^[a-z0-9-]{1,32}$' then s.data->'pennants'->>'equipped' end,
    'stats', jsonb_build_object(
      'runs', coalesce((s.data->'stats'->>'runs')::int, 0),
      'wins', coalesce((s.data->'stats'->>'wins')::int, 0),
      'kills', coalesce((s.data->'stats'->>'kills')::bigint, 0),
      'bestTimeSec', coalesce((s.data->'stats'->>'bestTimeSec')::int, 0),
      'bestEndless', coalesce((s.data->'stats'->>'bestEndless')::int, 0)),
    'owned', (select count(*) from jsonb_object_keys(coalesce(s.data->'owned', '{}'::jsonb))),
    'heroes', (select count(*) from jsonb_each(coalesce(s.data->'owned', '{}'::jsonb)) o where (o.value->>'hero')::boolean),
    'squad', coalesce((select jsonb_agg(jsonb_build_object(
        'id', sq.id::int,
        'stars', coalesce((s.data->'owned'->sq.id->>'stars')::int, 0),
        'hero', coalesce((s.data->'owned'->sq.id->>'hero')::boolean, false),
        'heroStars', coalesce((s.data->'owned'->sq.id->>'heroStars')::int, 0),
        'ascRarity', s.data->'owned'->sq.id->>'ascRarity',
        'asc', coalesce((s.data->'owned'->sq.id->>'ascMitico')::boolean, false),
        'aura', s.data->'auras'->>sq.id) order by sq.n)
      from jsonb_array_elements_text(coalesce(s.data->'squad', '[]'::jsonb)) with ordinality as sq(id, n)
      where sq.n <= 7 and sq.id ~ '^[0-9]{1,9}$'), '[]'::jsonb),
    'marks', coalesce((select jsonb_agg(jsonb_build_object('map', m.map, 'rank', m.rank, 'time_sec', m.time_sec, 'damage', m.damage, 'captain_id', m.captain_id))
      from (select * from public.scores sc where sc.user_id = p.id
            order by array_position(array['X', 'S', 'A', 'B', 'C'], sc.rank), sc.time_sec desc limit 6) m), '[]'::jsonb)
  )
  from public.profiles p
  left join public.saves s on s.user_id = p.id
  where p.username = trim(p_username)::extensions.citext
$$;

notify pgrst, 'reload schema';
