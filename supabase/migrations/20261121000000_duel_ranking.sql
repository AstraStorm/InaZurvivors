-- Modo Duelo: the ranking of wins against the CPU (author: «que haya un nuevo ranking del duel»). This week's (Madrid,
-- from Monday 00:00) or of all time. The wins are the server's own (private.duel_runs, opened and closed by duel_start
-- and duel_finish), so no browser can add any; only wins that lasted the minute count, as for the coins.
create or replace function public.duel_ranking(p_week boolean default true, p_limit integer default 50)
returns table (pos bigint, username extensions.citext, avatar text, crest text, wins bigint)
language sql stable security definer set search_path = '' as $$
  with w as (
    select d.user_id, count(*) as wins
    from private.duel_runs d
    where d.won and d.finished_at - d.started_at >= interval '60 seconds'
      and (not coalesce(p_week, true) or d.finished_at >= (date_trunc('week', now() at time zone 'Europe/Madrid') at time zone 'Europe/Madrid'))
    group by d.user_id)
  select rank() over (order by w.wins desc) as pos, p.username, p.avatar, p.crest, w.wins
  from w join public.profiles p on p.id = w.user_id
  order by w.wins desc, p.username
  limit least(greatest(coalesce(p_limit, 50), 1), 100);
$$;
alter function public.duel_ranking(boolean, integer) set statement_timeout = '5s';
revoke all on function public.duel_ranking(boolean, integer) from public;
grant execute on function public.duel_ranking(boolean, integer) to anon, authenticated;
