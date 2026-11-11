-- 2.1 (author): Cronus Fourseasons works like Super Zanark: the pass gives every copy he needs but one, and only the
-- ranking's top 1 gets that last one. So a place can give several footballers (season_results.players): top 1 gets
-- Super Zanark and Cronus; top 2-3 no longer get Cronus (they would complete him too) and get 15 Fichas EG instead of 10.

alter table private.season_results add column if not exists players integer[] not null default '{}';

create or replace function private.close_due_seasons() returns void
language plpgsql volatile security definer set search_path = '' as $$
declare s record; n integer;
begin
  for s in select id from private.seasons where ends_at <= now() and id not in (select id from private.season_closed) order by ends_at loop
    insert into private.season_closed (id) values (s.id) on conflict do nothing;
    get diagnostics n = row_count;
    if n = 0 then continue; end if;
    insert into private.season_results (season, user_id, pos, score, tier, tokens, coins, eg, pennants, players)
    select s.id, b.user_id, b.pos, b.score,
      case when b.pos = 1 then 'top1' when b.pos <= 3 then 'top3' when b.pos <= 8 then 'top8' when b.pos <= 15 then 'top15' else 'resto' end,
      case when b.pos = 1 then 2500 when b.pos <= 3 then 1500 when b.pos <= 8 then 900 when b.pos <= 15 then 600 else 250 end,
      case when b.pos = 1 then 300000 when b.pos <= 3 then 180000 when b.pos <= 8 then 100000 when b.pos <= 15 then 60000 else 25000 end,
      case when b.pos = 1 then 15 when b.pos <= 3 then 15 when b.pos <= 8 then 6 when b.pos <= 15 then 4 else 2 end,
      case when b.pos = 1 then array[lower(s.id) || '-campeon', 'marco-' || lower(s.id) || '-campeon']
           when b.pos <= 3 then array[lower(s.id) || '-podio', 'marco-' || lower(s.id) || '-podio']
           when b.pos <= 8 then array[lower(s.id) || '-top8'] when b.pos <= 15 then array[lower(s.id) || '-top15'] else '{}'::text[] end,
      case when b.pos = 1 then array[900401, 900400] else '{}'::integer[] end
    from private.board(null, null, 'score') b
    on conflict (season, user_id) do nothing;
    insert into private.scores_archive select s.id, sc.* from public.scores sc;
    delete from public.scores;
  end loop;
end $$;

create or replace function private.claim_season_rewards() returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare uid uuid := auth.uid(); out jsonb;
begin
  if uid is null then return '[]'::jsonb; end if;
  perform private.close_due_seasons();
  with got as (
    update private.season_results r set claimed_at = now() where r.user_id = uid and r.claimed_at is null
    returning r.season, r.pos, r.score, r.tier, r.tokens, r.coins, r.eg, r.pennants, r.players
  ) select coalesce(jsonb_agg(to_jsonb(got) order by got.season), '[]'::jsonb) into out from got;
  return out;
end $$;
revoke execute on function private.close_due_seasons() from public, anon, authenticated;
revoke execute on function private.claim_season_rewards() from public, anon, authenticated;
grant execute on function private.claim_season_rewards() to authenticated;
alter function private.claim_season_rewards() set statement_timeout = '15s';

notify pgrst, 'reload schema';
