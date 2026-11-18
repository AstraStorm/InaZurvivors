-- (author: «muchas más monedas de recompensas del clan, rollo lo más alto 600k, del Sector Quinto igual»): weekly clan
-- prizes 600k / 300k / 150k / 60k coins and Sector Quinto weeks 600k won / 200k lost. Same numbers as src/systems/clans.ts
-- CLAN_PRIZES and src/systems/sector.ts WIN_PRIZE/LOSE_PRIZE. economy_cap already adds clan_rewards and sector_claims to
-- what a save may hold, so the bigger prizes pass the guard. Weeks already recorded keep what they were given.

create or replace function private.clan_prize(p_tier text) returns table (coins int, tokens int) language sql immutable set search_path = '' as $$
  select v.c, v.k from (values ('top1', 600000, 500), ('top3', 300000, 300), ('top8', 150000, 300), ('resto', 60000, 100)) v (t, c, k) where v.t = p_tier
  union all select 0, 0 where p_tier not in ('top1', 'top3', 'top8', 'resto');
$$;

create or replace function private.sector_claim() returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare uid uuid := private.real_user(); mine text; got jsonb := '[]'::jsonb; r record; won boolean;
begin
  if uid is null then return got; end if;
  perform private.sector_close_due();
  select side into mine from private.sector_members where user_id = uid;
  if mine is null then return got; end if;
  for r in select res.week, res.winner from private.sector_results res
      join private.sector_points p on p.user_id = uid and p.week = res.week and p.points > 0
      where not exists (select 1 from private.sector_claims c where c.user_id = uid and c.week = res.week) order by res.week loop
    won := r.winner = mine or r.winner = 'empate';
    insert into private.sector_claims (user_id, week, side, won, tokens, coins)
      values (uid, r.week, mine, won, case when won then 300 else 100 end, case when won then 600000 else 200000 end)
      on conflict do nothing;
    if found then
      got := got || jsonb_build_object('week', r.week, 'side', mine, 'won', won, 'winner', r.winner,
        'tokens', case when won then 300 else 100 end, 'coins', case when won then 600000 else 200000 end);
    end if;
  end loop;
  return got;
end $$;
alter function private.sector_claim() set statement_timeout = '10s';

notify pgrst, 'reload schema';
