-- 1.76 (author): the profile opened from the ranking is the same player card as the own Perfil screen. It also needs the
-- number of pulls, the achievements claimed (mission ids without a period stamp, i.e. the logros) and the collection
-- (owned: copies, stars, ascension, HÉROE, training), from which the client works out the best footballer and his mean
-- exactly like on the own profile. Read-only; everything else as in 20261103000400_profile_frames.sql.

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
    'frame', case when coalesce(s.data->'pennants'->>'frame', '') ~ '^[a-z0-9-]{1,32}$' then s.data->'pennants'->>'frame' end,
    'stats', jsonb_build_object(
      'runs', coalesce((s.data->'stats'->>'runs')::int, 0),
      'wins', coalesce((s.data->'stats'->>'wins')::int, 0),
      'kills', coalesce((s.data->'stats'->>'kills')::bigint, 0),
      'bestTimeSec', coalesce((s.data->'stats'->>'bestTimeSec')::int, 0),
      'bestEndless', coalesce((s.data->'stats'->>'bestEndless')::int, 0),
      'pulls', coalesce((s.data->'stats'->>'pulls')::int, 0)),
    'owned', (select count(*) from jsonb_object_keys(coalesce(s.data->'owned', '{}'::jsonb))),
    'heroes', (select count(*) from jsonb_each(coalesce(s.data->'owned', '{}'::jsonb)) o where (o.value->>'hero')::boolean),
    'collection', coalesce((select jsonb_object_agg(o.key, jsonb_strip_nulls(jsonb_build_object(
        'stars', o.value->'stars', 'hero', o.value->'hero', 'heroStars', o.value->'heroStars',
        'ascMitico', o.value->'ascMitico', 'ascRarity', o.value->'ascRarity', 'train', o.value->'train')))
      from jsonb_each(case when jsonb_typeof(s.data->'owned') = 'object' then s.data->'owned' else '{}'::jsonb end) o
      where o.key ~ '^[0-9]{1,9}$' and jsonb_typeof(o.value) = 'object'), '{}'::jsonb),
    'achievements', coalesce((select jsonb_agg(c.v) from (
        select distinct c.v from jsonb_array_elements_text(case when jsonb_typeof(s.data->'missions'->'claimed') = 'array' then s.data->'missions'->'claimed' else '[]'::jsonb end) c(v)
        where c.v ~ '^[a-z0-9_-]{1,48}$' limit 500) c), '[]'::jsonb),
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

-- create or replace drops the settings of the function: the 5 s limit of 20261103000200 goes back on
alter function private.public_profile(text) set statement_timeout = '5s';

notify pgrst, 'reload schema';
