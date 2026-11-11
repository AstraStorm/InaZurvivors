-- 2.1 (author): season pass and ranking seasons. private.seasons holds each season's dates (the game has the same ones in
-- src/systems/seasonPass.ts). The pass is paid on the client like every other reward, so economy_cap learns it: every
-- level newly claimed this season (save.season.claimedNormal / claimedPremium) allows at most what one level can pay
-- (120 fichas, 6000 coins, seasonPass.ts LEVEL_MAX). The count is checked against the highest one the server has
-- already seen for that account and season (private.season_claims), so dropping levels from the save and claiming them
-- again gives nothing; it can never pass the 200 levels of a season.

create table if not exists private.seasons (
  id text primary key,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  check (ends_at > starts_at)
);
insert into private.seasons (id, starts_at, ends_at) values ('T1', '2026-11-12 15:00+01', '2026-12-12 15:00+01')
on conflict (id) do update set starts_at = excluded.starts_at, ends_at = excluded.ends_at;

create table if not exists private.season_claims (
  user_id uuid not null references auth.users (id) on delete cascade,
  season text not null references private.seasons (id) on delete cascade,
  n integer not null default 0,
  primary key (user_id, season)
);
revoke all on table private.seasons, private.season_claims from public, anon, authenticated;

-- the season open now (null between seasons)
create or replace function private.current_season() returns text
language sql stable security definer set search_path = '' as $$
  select s.id from private.seasons s where now() >= s.starts_at and now() < s.ends_at order by s.starts_at desc limit 1;
$$;

-- same as before (promo codes, bug bounty, clan rewards), plus the season pass levels; volatile now: it records the
-- highest claimed count of the season
create or replace function private.economy_cap(p_new jsonb, p_old jsonb, p_since timestamptz, p_uid uuid) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare
  hours numeric := greatest(0, extract(epoch from (now() - coalesce(p_since, now()))) / 3600);
  promo_t numeric := 0; promo_c numeric := 0; bug_t numeric := 0; clan_t numeric := 0; clan_c numeric := 0;
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
  promo_t := promo_t + bug_t + clan_t;
  promo_c := promo_c + clan_c;
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
revoke all on function private.current_season() from public, anon, authenticated;

notify pgrst, 'reload schema';
