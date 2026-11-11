-- 2.1 (author): the ranking goes by seasons and ends with the pass (private.seasons). There is no scheduler on this
-- project, so a season is closed lazily, once: the first signed-in call after its end (claim_season_rewards from the
-- menu, or a new mark in submit_score) stores the final positions of the global board (best mark of each player by
-- points) with each one's prizes, archives the marks and empties the board for the next season. Prizes (author: «haz
-- recompensas buenas»):
--   top 1      2500 fichas, 300.000 coins, 15 Fichas EG, Super Zanark, banner + frame «Campeón» (Mítico)
--   top 2-3    1500 fichas, 180.000 coins, 10 Fichas EG, Cronus Fourseasons, banner + frame «Podio» (Legendario)
--   top 4-8     900 fichas, 100.000 coins,  6 Fichas EG, banner «Top 8» (Épico)
--   top 9-15    600 fichas,  60.000 coins,  4 Fichas EG, banner «Top 15» (Raro)
--   the rest    250 fichas,  25.000 coins,  2 Fichas EG
-- The game pays them when they are claimed; economy_cap counts the claimed fichas and coins.

create table if not exists private.season_closed (
  id text primary key references private.seasons (id) on delete cascade,
  closed_at timestamptz not null default now()
);
create table if not exists private.season_results (
  season text not null references private.seasons (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  pos integer not null,
  score bigint not null,
  tier text not null,
  tokens integer not null default 0,
  coins integer not null default 0,
  eg integer not null default 0,
  pennants text[] not null default '{}',
  player integer,
  claimed_at timestamptz,
  primary key (season, user_id)
);
create index if not exists season_results_user on private.season_results (user_id) where claimed_at is null;
create table if not exists private.scores_archive (season text not null, like public.scores);
revoke all on table private.season_closed, private.season_results, private.scores_archive from public, anon, authenticated;

-- closes every season that has ended and was not closed yet (idempotent; concurrent callers: only one does the work)
create or replace function private.close_due_seasons() returns void
language plpgsql volatile security definer set search_path = '' as $$
declare s record; n integer;
begin
  for s in select id from private.seasons where ends_at <= now() and id not in (select id from private.season_closed) order by ends_at loop
    insert into private.season_closed (id) values (s.id) on conflict do nothing;
    get diagnostics n = row_count;
    if n = 0 then continue; end if;
    insert into private.season_results (season, user_id, pos, score, tier, tokens, coins, eg, pennants, player)
    select s.id, b.user_id, b.pos, b.score,
      case when b.pos = 1 then 'top1' when b.pos <= 3 then 'top3' when b.pos <= 8 then 'top8' when b.pos <= 15 then 'top15' else 'resto' end,
      case when b.pos = 1 then 2500 when b.pos <= 3 then 1500 when b.pos <= 8 then 900 when b.pos <= 15 then 600 else 250 end,
      case when b.pos = 1 then 300000 when b.pos <= 3 then 180000 when b.pos <= 8 then 100000 when b.pos <= 15 then 60000 else 25000 end,
      case when b.pos = 1 then 15 when b.pos <= 3 then 10 when b.pos <= 8 then 6 when b.pos <= 15 then 4 else 2 end,
      case when b.pos = 1 then array[lower(s.id) || '-campeon', 'marco-' || lower(s.id) || '-campeon']
           when b.pos <= 3 then array[lower(s.id) || '-podio', 'marco-' || lower(s.id) || '-podio']
           when b.pos <= 8 then array[lower(s.id) || '-top8'] when b.pos <= 15 then array[lower(s.id) || '-top15'] else '{}'::text[] end,
      case when b.pos = 1 then 900401 when b.pos <= 3 then 900400 else null end
    from private.board(null, null, 'score') b
    on conflict (season, user_id) do nothing;
    insert into private.scores_archive select s.id, sc.* from public.scores sc;
    delete from public.scores;
  end loop;
end $$;

-- the caller's prizes of closed seasons, handed over once
create or replace function private.claim_season_rewards() returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare uid uuid := auth.uid(); out jsonb;
begin
  if uid is null then return '[]'::jsonb; end if;
  perform private.close_due_seasons();
  with got as (
    update private.season_results r set claimed_at = now() where r.user_id = uid and r.claimed_at is null
    returning r.season, r.pos, r.score, r.tier, r.tokens, r.coins, r.eg, r.pennants, r.player
  ) select coalesce(jsonb_agg(to_jsonb(got) order by got.season), '[]'::jsonb) into out from got;
  return out;
end $$;
create or replace function public.claim_season_rewards() returns jsonb
language sql volatile security invoker set search_path = '' as $$ select private.claim_season_rewards(); $$;
revoke execute on function private.close_due_seasons() from public, anon, authenticated;
revoke execute on function private.claim_season_rewards(), public.claim_season_rewards() from public, anon, authenticated;
grant execute on function private.claim_season_rewards(), public.claim_season_rewards() to authenticated;
alter function private.claim_season_rewards() set statement_timeout = '15s';

-- a new mark first closes a season that has just ended (so it counts for the new one)
create or replace function private.submit_score(p_run_id uuid, p_map text, p_rank text, p_time_sec integer, p_damage bigint, p_captain_id integer)
 returns text language plpgsql security definer set search_path to 'public', 'extensions' set lock_timeout to '3s'
as $function$
declare uid uuid := private.real_user(); dmg bigint;
begin
  perform private.close_due_seasons();
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

-- economy_cap: as in season_pass, plus the season prizes claimed since the last save
create or replace function private.economy_cap(p_new jsonb, p_old jsonb, p_since timestamptz, p_uid uuid) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare
  hours numeric := greatest(0, extract(epoch from (now() - coalesce(p_since, now()))) / 3600);
  promo_t numeric := 0; promo_c numeric := 0; bug_t numeric := 0; clan_t numeric := 0; clan_c numeric := 0; sea_t numeric := 0; sea_c numeric := 0;
  old_t numeric; old_c numeric; new_t numeric; new_c numeric; max_t numeric; max_c numeric;
  cur text := private.current_season(); seen integer := 0; claimed integer := 0; pass_n integer := 0;
  out jsonb := p_new;
begin
  if to_regclass('private.promo_redemptions') is not null then
    execute 'select coalesce(sum((r.result ->> ''tokens'')::numeric), 0), coalesce(sum((r.result ->> ''coins'')::numeric), 0)
      from private.promo_redemptions r where r.user_id = $1 and r.created_at > coalesce($2, ''-infinity''::timestamptz)'
      into promo_t, promo_c using p_uid, p_since;
  end if;
  select coalesce(sum(b.tokens), 0) into bug_t from private.bug_rewards b
    where b.user_id = p_uid and b.claimed_at is not null and b.claimed_at > coalesce(p_since, '-infinity'::timestamptz);
  select coalesce(sum(c.tokens), 0), coalesce(sum(c.coins), 0) into clan_t, clan_c from public.clan_rewards c
    where c.user_id = p_uid and c.claimed_at > coalesce(p_since, '-infinity'::timestamptz);
  select coalesce(sum(r.tokens), 0), coalesce(sum(r.coins), 0) into sea_t, sea_c from private.season_results r
    where r.user_id = p_uid and r.claimed_at is not null and r.claimed_at > coalesce(p_since, '-infinity'::timestamptz);
  promo_t := promo_t + bug_t + clan_t + sea_t;
  promo_c := promo_c + clan_c + sea_c;
  -- 2.1: the season pass
  if cur is not null and p_uid is not null and p_new -> 'season' ->> 'id' = cur then
    claimed := least(200,
      (case when jsonb_typeof(p_new -> 'season' -> 'claimedNormal') = 'array' then jsonb_array_length(p_new -> 'season' -> 'claimedNormal') else 0 end)
      + (case when jsonb_typeof(p_new -> 'season' -> 'claimedPremium') = 'array' then jsonb_array_length(p_new -> 'season' -> 'claimedPremium') else 0 end));
    select n into seen from private.season_claims where user_id = p_uid and season = cur;
    pass_n := greatest(0, claimed - coalesce(seen, 0));
    if pass_n > 0 then
      insert into private.season_claims (user_id, season, n) values (p_uid, cur, claimed)
      on conflict (user_id, season) do update set n = greatest(private.season_claims.n, excluded.n);
    end if;
    promo_t := promo_t + pass_n * 120;
    promo_c := promo_c + pass_n * 6000;
  end if;
  new_t := case when jsonb_typeof(p_new -> 'tokens') = 'number' then (p_new ->> 'tokens')::numeric else 0 end;
  new_c := case when jsonb_typeof(p_new -> 'coins') = 'number' then (p_new ->> 'coins')::numeric else 0 end;
  if p_old is null then
    max_t := 5000 + promo_t; max_c := 120000 + promo_c;
  else
    old_t := case when jsonb_typeof(p_old -> 'tokens') = 'number' then greatest(0, (p_old ->> 'tokens')::numeric) else 0 end;
    old_c := case when jsonb_typeof(p_old -> 'coins') = 'number' then greatest(0, (p_old ->> 'coins')::numeric) else 0 end;
    max_t := old_t + 2000 + 1000 * hours + promo_t;
    max_c := old_c + 16000 + 16000 * hours + promo_c;
  end if;
  if new_t > max_t then out := jsonb_set(out, '{tokens}', to_jsonb(floor(max_t)::bigint)); end if;
  if new_c > max_c then out := jsonb_set(out, '{coins}', to_jsonb(floor(max_c)::bigint)); end if;
  return out;
end $$;
revoke all on function private.economy_cap(jsonb, jsonb, timestamptz, uuid) from public, anon, authenticated;

notify pgrst, 'reload schema';
