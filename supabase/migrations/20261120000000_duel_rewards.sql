-- Modo Duelo: 30.000 coins for each match won against the CPU, paid by the server.
--   · duel_start opens a match (its row in private.duel_runs) and gives its id; duel_finish closes it once: a win of a
--     match of at least 60 seconds pays 30.000, up to 10 wins a day (Madrid); a second finish, someone else's match or a
--     match too short pay nothing. The match is played in the browser, so these limits are what keep it honest.
--   · economy_cap_base credits what duel_runs paid since the last write (as the clan prizes or the season pass), so the
--     30.000 are not trimmed by the cap of a normal write.

create table if not exists private.duel_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  level text not null check (level in ('facil', 'normal', 'dificil')),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  won boolean,
  coins integer not null default 0,
  paid_at timestamptz
);
create index if not exists duel_runs_user on private.duel_runs (user_id, paid_at);
alter table private.duel_runs enable row level security;
revoke all on private.duel_runs from public, anon, authenticated;

create or replace function public.duel_start(p_level text) returns uuid
language plpgsql volatile security definer set search_path = '' as $$
declare uid uuid := private.real_user(); rid uuid;
begin
  if uid is null then raise exception 'not_signed_in' using errcode = '28000'; end if;
  if p_level not in ('facil', 'normal', 'dificil') then raise exception 'bad_level' using errcode = '22023'; end if;
  -- a match at a time is enough: the ones left open are closed without pay
  update private.duel_runs set finished_at = now(), won = false where user_id = uid and finished_at is null;
  insert into private.duel_runs (user_id, level) values (uid, p_level) returning id into rid;
  return rid;
end $$;

create or replace function public.duel_finish(p_run uuid, p_won boolean) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare uid uuid := private.real_user(); r private.duel_runs; today integer; pay integer := 0;
begin
  if uid is null then raise exception 'not_signed_in' using errcode = '28000'; end if;
  select * into r from private.duel_runs where id = p_run and user_id = uid for update;
  if not found or r.finished_at is not null then return jsonb_build_object('coins', 0, 'left', 0, 'why', 'closed'); end if;
  select count(*) into today from private.duel_runs
    where user_id = uid and paid_at is not null and (paid_at at time zone 'Europe/Madrid')::date = (now() at time zone 'Europe/Madrid')::date;
  if coalesce(p_won, false) and now() - r.started_at >= interval '60 seconds' and today < 10 then pay := 30000; end if;
  update private.duel_runs set finished_at = now(), won = coalesce(p_won, false), coins = pay, paid_at = case when pay > 0 then now() end where id = r.id;
  return jsonb_build_object('coins', pay, 'left', greatest(0, 10 - today - (case when pay > 0 then 1 else 0 end)),
    'why', case when pay > 0 then 'paid' when not coalesce(p_won, false) then 'lost' when today >= 10 then 'cap' else 'short' end);
end $$;
revoke all on function public.duel_start(text) from public, anon;
revoke all on function public.duel_finish(uuid, boolean) from public, anon;
grant execute on function public.duel_start(text) to authenticated;
grant execute on function public.duel_finish(uuid, boolean) to authenticated;

-- economy_cap_base as in season_pass_server, now also crediting the duel wins
create or replace function private.economy_cap_base(p_new jsonb, p_old jsonb, p_since timestamptz, p_uid uuid) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare
  hours numeric := greatest(0, extract(epoch from (now() - coalesce(p_since, now()))) / 3600);
  promo_t numeric := 0; promo_c numeric := 0; bug_t numeric := 0; clan_t numeric := 0; clan_c numeric := 0; sea_t numeric := 0; sea_c numeric := 0;
  sec_t numeric := 0; sec_c numeric := 0; pass_t numeric := 0; pass_c numeric := 0; key_c numeric := 0; duel_c numeric := 0;
  cur text := private.current_season(); seen integer := 0; claimed integer := 0; pass_n integer := 0;
  old_t numeric; old_c numeric; new_t numeric; new_c numeric; max_t numeric; max_c numeric;
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
  select coalesce(sum(s.tokens), 0), coalesce(sum(s.coins), 0) into sec_t, sec_c from private.sector_claims s
    where s.user_id = p_uid and s.claimed_at > coalesce(p_since, '-infinity'::timestamptz);
  -- Modo Duelo: the CPU wins the server paid since the last write
  select coalesce(sum(d.coins), 0) into duel_c from private.duel_runs d
    where d.user_id = p_uid and d.paid_at is not null and d.paid_at > coalesce(p_since, '-infinity'::timestamptz);
  if private.pass_server_on() then
    -- 3.0: the pass levels claimed on the server since the last write, and the Llave normal bought in that time
    select coalesce(sum(c.tokens), 0), coalesce(sum(c.coins), 0) into pass_t, pass_c from private.season_pass_claims c
      where c.user_id = p_uid and c.claimed_at > coalesce(p_since, '-infinity'::timestamptz);
    select 15000 * count(*) into key_c from private.season_pass k
      where k.user_id = p_uid and k.normal_at > coalesce(p_since, '-infinity'::timestamptz);
  elsif cur is not null and p_uid is not null and p_new -> 'season' ->> 'id' = cur then
    -- before 3.0, as in pass_125: each newly claimed level of the save allows what one level can pay
    claimed := least(250,
      (case when jsonb_typeof(p_new -> 'season' -> 'claimedNormal') = 'array' then jsonb_array_length(p_new -> 'season' -> 'claimedNormal') else 0 end)
      + (case when jsonb_typeof(p_new -> 'season' -> 'claimedPremium') = 'array' then jsonb_array_length(p_new -> 'season' -> 'claimedPremium') else 0 end));
    select n into seen from private.season_claims where user_id = p_uid and season = cur;
    pass_n := greatest(0, claimed - coalesce(seen, 0));
    if pass_n > 0 then
      insert into private.season_claims (user_id, season, n) values (p_uid, cur, claimed)
      on conflict (user_id, season) do update set n = greatest(private.season_claims.n, excluded.n);
    end if;
    pass_t := pass_n * 120;
    pass_c := pass_n * 6000;
  end if;
  promo_t := promo_t + bug_t + clan_t + sea_t + sec_t + pass_t;
  promo_c := promo_c + clan_c + sea_c + sec_c + pass_c + duel_c - key_c;
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
  max_c := greatest(0, max_c);
  if new_t > max_t then out := jsonb_set(out, '{tokens}', to_jsonb(floor(max_t)::bigint)); end if;
  if new_c > max_c then out := jsonb_set(out, '{coins}', to_jsonb(floor(max_c)::bigint)); end if;
  return out;
end $$;
revoke all on function private.economy_cap_base(jsonb, jsonb, timestamptz, uuid) from public, anon, authenticated;
