-- 2.2 (author: «quita el límite de 100 en lo de sala»): the Sala de jugadores shows every player with a mark, not only
-- the top 100. One call still has a ceiling (1.000 rows) so nobody can ask for millions; the boards keep asking for 15.
create or replace function private.leaderboard(p_map text, p_rank text, p_order text, p_limit integer)
returns table (pos bigint, username extensions.citext, avatar text, crest text, map text, rank text, time_sec integer, damage bigint, captain_id integer, score bigint)
language sql stable security definer set search_path = public, extensions as $$
  select b.pos, b.username, b.avatar, b.crest, b.map, b.rank, b.time_sec, b.damage, b.captain_id, b.score
  from private.board(p_map, p_rank, p_order) b
  where b.pos <= least(greatest(coalesce(p_limit, 15), 1), 1000)
  order by b.pos;
$$;

notify pgrst, 'reload schema';
