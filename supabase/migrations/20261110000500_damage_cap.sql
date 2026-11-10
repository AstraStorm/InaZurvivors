-- 2.01 (author: a 20+ minute Rango Z run of a player did not reach the ranking): the anti-cheat damage ceiling was 200.000
-- per second, and late teams in Rango Z with their spirits go past it, so real runs were refused as implausible_damage
-- (6 on 2026-11-10). The ceiling is now 800.000 per second and a run above it is no longer refused: its damage is
-- trimmed to the ceiling, so the time survived still counts.
create or replace function private.submit_score(p_run_id uuid, p_map text, p_rank text, p_time_sec integer, p_damage bigint, p_captain_id integer)
returns text language plpgsql security definer set search_path to 'public', 'extensions' set lock_timeout to '3s' as $function$
declare uid uuid := private.real_user(); dmg bigint;
begin
  if not exists (select 1 from public.profiles where id = uid) then raise exception 'no_username' using errcode = '42501'; end if;
  if p_rank not in ('C', 'B', 'A', 'S', 'X', 'Z') or p_map !~ '^[a-z0-9_-]{1,32}$' then raise exception 'invalid_board' using errcode = '22023'; end if;
  if p_rank = 'Z' and not private.rank_z_open() then raise exception 'rank_locked' using errcode = '22023'; end if;
  if p_time_sec < 0 or p_time_sec > 4 * 3600 then raise exception 'implausible_time' using errcode = '22023'; end if;
  if p_damage < 0 then raise exception 'implausible_damage' using errcode = '22023'; end if;
  dmg := least(p_damage, (p_time_sec + 1)::bigint * 800000);
  if exists (select 1 from public.submitted_runs r where r.user_id = uid and r.at > now() - interval '20 seconds') then
    raise exception 'too_fast' using errcode = '54000';
  end if;
  insert into public.submitted_runs (run_id, user_id) values (p_run_id, uid) on conflict do nothing;
  if not found then return 'duplicate'; end if;
  insert into public.scores as s (user_id, map, rank, time_sec, damage, captain_id, run_id)
    values (uid, p_map, p_rank, p_time_sec, dmg, coalesce(p_captain_id, 0), p_run_id)
  on conflict (user_id, map, rank) do update
    set time_sec = excluded.time_sec, damage = excluded.damage, captain_id = excluded.captain_id, run_id = excluded.run_id, created_at = now()
    where (private.score_of(excluded.rank, excluded.time_sec, excluded.damage), excluded.time_sec, excluded.damage)
        > (private.score_of(s.rank, s.time_sec, s.damage), s.time_sec, s.damage);
  return 'ok';
end $function$;
