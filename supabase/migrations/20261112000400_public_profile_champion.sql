-- 2.2 (author: «que se vea si sale campeón en el perfil»): another player's profile also carries each footballer's
-- Camino del Campeón level (owned.champion, 0..3) and the coin stars on top of the normal ones (owned.extraStars), in the
-- squad and in the collection, so their maxed footballers show as they really are. Everything else as in rank_z.
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
        'ascMitico', o.value->'ascMitico', 'ascRarity', o.value->'ascRarity', 'train', o.value->'train',
        'champion', o.value->'champion', 'extraStars', o.value->'extraStars')))
      from jsonb_each(case when jsonb_typeof(s.data->'owned') = 'object' then s.data->'owned' else '{}'::jsonb end) o
      where o.key ~ '^[0-9]{1,9}$' and jsonb_typeof(o.value) = 'object'), '{}'::jsonb),
    'achievements', coalesce((select jsonb_agg(c.v) from (
        select distinct c.v from jsonb_array_elements_text(case when jsonb_typeof(s.data->'missions'->'claimed') = 'array' then s.data->'missions'->'claimed' else '[]'::jsonb end) c(v)
        where c.v ~ '^[a-z0-9_-]{1,48}$' limit 500) c), '[]'::jsonb),
    'squad', coalesce((select jsonb_agg(jsonb_build_object(
        'id', sq.id::int,
        'stars', coalesce((s.data->'owned'->sq.id->>'stars')::int, 0),
        'extraStars', coalesce((s.data->'owned'->sq.id->>'extraStars')::int, 0),
        'hero', coalesce((s.data->'owned'->sq.id->>'hero')::boolean, false),
        'heroStars', coalesce((s.data->'owned'->sq.id->>'heroStars')::int, 0),
        'champion', coalesce((s.data->'owned'->sq.id->>'champion')::int, 0),
        'ascRarity', s.data->'owned'->sq.id->>'ascRarity',
        'asc', coalesce((s.data->'owned'->sq.id->>'ascMitico')::boolean, false),
        'aura', s.data->'auras'->>sq.id) order by sq.n)
      from jsonb_array_elements_text(coalesce(s.data->'squad', '[]'::jsonb)) with ordinality as sq(id, n)
      where sq.n <= 7 and sq.id ~ '^[0-9]{1,9}$'), '[]'::jsonb),
    'marks', coalesce((select jsonb_agg(jsonb_build_object('map', m.map, 'rank', m.rank, 'time_sec', m.time_sec, 'damage', m.damage, 'captain_id', m.captain_id))
      from (select * from public.scores sc where sc.user_id = p.id
            order by array_position(array['Z', 'X', 'S', 'A', 'B', 'C'], sc.rank), sc.time_sec desc limit 6) m), '[]'::jsonb)
  )
  from public.profiles p
  left join public.saves s on s.user_id = p.id
  where p.username = trim(p_username)::extensions.citext
$$;
alter function private.public_profile(text) set statement_timeout = '5s';

notify pgrst, 'reload schema';
