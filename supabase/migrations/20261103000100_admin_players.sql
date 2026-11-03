-- Panel de jugadores (admin): how many accounts there are, how many play and who, for the author only.
-- Only signed-in players exist on the server; guests play locally and are not counted (nothing about them is sent).
-- Same shape as the bug panel: the body lives in `private` behind is_admin(), the public wrapper is an invoker.

create or replace function private.admin_player_stats(p_limit integer default 100) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare out jsonb;
begin
  if not private.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  with acc as (
    select u.id, u.created_at, u.last_sign_in_at, p.username, s.updated_at as saved_at,
      coalesce((s.data->'stats'->>'runs')::int, 0) as runs, coalesce((s.data->'stats'->>'kills')::bigint, 0) as kills,
      coalesce((s.data->'stats'->>'bestTimeSec')::int, 0) as best_time,
      (select count(*) from jsonb_object_keys(coalesce(s.data->'owned', '{}'::jsonb))) as owned,
      (select count(*) from public.submitted_runs r where r.user_id = u.id) as ranked_runs
    from auth.users u
    left join public.profiles p on p.id = u.id
    left join public.saves s on s.user_id = u.id
  )
  select jsonb_build_object(
    'accounts', (select count(*) from acc),
    'with_name', (select count(*) from acc where username is not null),
    'played', (select count(*) from acc where runs > 0),
    'runs', (select coalesce(sum(runs), 0) from acc),
    'kills', (select coalesce(sum(kills), 0) from acc),
    'ranked_runs', (select count(*) from public.submitted_runs),
    'active_24h', (select count(*) from acc where greatest(saved_at, last_sign_in_at) > now() - interval '24 hours'),
    'active_7d', (select count(*) from acc where greatest(saved_at, last_sign_in_at) > now() - interval '7 days'),
    'new_7d', (select count(*) from acc where created_at > now() - interval '7 days'),
    'players', coalesce((select jsonb_agg(row_to_json(x)) from (
      select username, created_at, greatest(saved_at, last_sign_in_at) as last_seen, runs, kills, best_time, owned, ranked_runs
      from acc order by greatest(saved_at, last_sign_in_at) desc nulls last
      limit least(greatest(coalesce(p_limit, 100), 1), 500)) x), '[]'::jsonb)
  ) into out;
  return out;
end $$;
alter function private.admin_player_stats(integer) set statement_timeout = '8s';

create or replace function public.admin_player_stats(p_limit integer default 100) returns jsonb
language sql stable security invoker set search_path = '' as $$ select private.admin_player_stats(p_limit); $$;

revoke execute on function private.admin_player_stats(integer), public.admin_player_stats(integer) from public, anon, authenticated;
grant execute on function private.admin_player_stats(integer), public.admin_player_stats(integer) to authenticated;

notify pgrst, 'reload schema';
