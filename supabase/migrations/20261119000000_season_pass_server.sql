-- 3.0 (seguridad del pase, informe del autor): the season pass moves to the server. Until now the save said who had
-- the Llave dorada, how much EXP the pass had and which levels were claimed, and the client paid every level into its
-- own save: editing the JSON (season.gold, season.xp, claimedPremium, owned) gave the premium row, level 125, its
-- footballers and its fichas. Now:
--   · private.season_pass holds the keys and the EXP of each account and season; nothing in the save can change them
--   · a run's EXP is worked out here: season_run_start marks when it began, season_run_finish pays at most the real time
--     that passed (the game clock never runs faster than the wall clock), times the rank (seasonPass.ts RANK_XP)
--   · the Llave dorada is rolled here: season_run_tick, every half minute or so of the run, rolls the rivals knocked out
--     since the last roll, never more than 15 a second of real time (×2 the chance in a co-op room really connected).
--     Only the newest run of an account rolls, so many runs at once give nothing extra
--   · season_claim pays a level only when its row is open and the EXP reaches it, once (private.season_pass_claims, one
--     row per level), and answers what it pays from private.season_rewards (same table as seasonPass.ts SEASONS)
--   · the Llave normal is bought with season_buy_normal_key (the cloud save must hold the 15.000 coins; economy_cap
--     takes them off what the next write may hold)
--   · put_save writes the server's pass into save.season, credits economy_cap only with the levels really claimed (their
--     exact coins and fichas, not the old per-level allowance), and keeps the pass-only footballers (Cronus, Super
--     Zanark) to the copies the server gave (pass levels, ranking prizes, promo codes); they leave the GTS
-- (author: «lo demás se suba en la 3.0 programada»): all of it switches on with 3.0, at private.pass_server.from_at
-- (2026-11-25 12:00 Madrid; the client waits for the same hour, seasonPass.ts PASS_SERVER_AT). Until then economy_cap,
-- put_save and pass_holders behave exactly as before and the new calls refuse. After it, each account's pass is made
-- the first time the server touches it, from what its cloud save held at that moment (keys, EXP up to 125 levels,
-- claimed levels), since nothing tells an honest pass from an edited one; from there on only the server moves it.

create table if not exists private.pass_server (id boolean primary key default true check (id), from_at timestamptz not null);
insert into private.pass_server (id, from_at) values (true, '2026-11-25 12:00+01') on conflict (id) do nothing;
alter table private.pass_server enable row level security;
revoke all on table private.pass_server from public, anon, authenticated;
create or replace function private.pass_server_on() returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from private.pass_server x where now() >= x.from_at);
$$;

create table if not exists private.season_rewards (
  season text not null references private.seasons (id) on delete cascade,
  track text not null check (track in ('normal', 'premium')),
  level integer not null check (level between 1 and 125),
  reward jsonb not null,
  primary key (season, track, level)
);
create table if not exists private.season_pass (
  user_id uuid not null references auth.users (id) on delete cascade,
  season text not null references private.seasons (id) on delete cascade,
  xp integer not null default 0 check (xp between 0 and 17500),
  normal boolean not null default false,
  gold boolean not null default false,
  normal_at timestamptz,
  gold_at timestamptz,
  primary key (user_id, season)
);
create table if not exists private.season_runs (
  run_id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  season text not null references private.seasons (id) on delete cascade,
  coop boolean not null default false,
  started_at timestamptz not null default now(),
  -- a newer run of the same account started: this one stops rolling and its EXP counts only up to here
  superseded_at timestamptz,
  rolled_kills integer not null default 0,
  rolled_at timestamptz not null default now(),
  finished_at timestamptz,
  xp integer not null default 0
);
create index if not exists season_runs_user on private.season_runs (user_id, started_at desc);
create table if not exists private.season_pass_claims (
  user_id uuid not null references auth.users (id) on delete cascade,
  season text not null references private.seasons (id) on delete cascade,
  track text not null check (track in ('normal', 'premium')),
  level integer not null check (level between 1 and 125),
  reward jsonb not null,
  -- what economy_cap lets the save grow by for this level (a footballer may turn into coins when it can't ascend)
  coins integer not null default 0,
  tokens integer not null default 0,
  claimed_at timestamptz not null default now(),
  primary key (user_id, season, track, level)
);
alter table private.season_rewards enable row level security;
alter table private.season_pass enable row level security;
alter table private.season_runs enable row level security;
alter table private.season_pass_claims enable row level security;
revoke all on table private.season_rewards, private.season_pass, private.season_runs, private.season_pass_claims from public, anon, authenticated;

insert into private.season_rewards (season, track, level, reward) values
('T1', 'normal', 1, '{"kind":"monedas","n":1000}'),
('T1', 'normal', 2, '{"kind":"monedas","n":1000}'),
('T1', 'normal', 3, '{"kind":"jugador","id":100949}'),
('T1', 'normal', 4, '{"kind":"monedas","n":1000}'),
('T1', 'normal', 5, '{"kind":"fichas","n":30}'),
('T1', 'normal', 6, '{"kind":"monedas","n":1000}'),
('T1', 'normal', 7, '{"kind":"monedas","n":1000}'),
('T1', 'normal', 8, '{"kind":"monedas","n":1000}'),
('T1', 'normal', 9, '{"kind":"jugador","id":100912}'),
('T1', 'normal', 10, '{"kind":"multi"}'),
('T1', 'normal', 11, '{"kind":"monedas","n":1000}'),
('T1', 'normal', 12, '{"kind":"monedas","n":1000}'),
('T1', 'normal', 13, '{"kind":"monedas","n":1000}'),
('T1', 'normal', 14, '{"kind":"monedas","n":1000}'),
('T1', 'normal', 15, '{"kind":"jugador","id":100464}'),
('T1', 'normal', 16, '{"kind":"monedas","n":1000}'),
('T1', 'normal', 17, '{"kind":"monedas","n":1000}'),
('T1', 'normal', 18, '{"kind":"monedas","n":1000}'),
('T1', 'normal', 19, '{"kind":"monedas","n":1000}'),
('T1', 'normal', 20, '{"kind":"banner","id":"pase-dominio"}'),
('T1', 'normal', 21, '{"kind":"jugador","id":100517}'),
('T1', 'normal', 22, '{"kind":"monedas","n":1000}'),
('T1', 'normal', 23, '{"kind":"monedas","n":1000}'),
('T1', 'normal', 24, '{"kind":"monedas","n":1000}'),
('T1', 'normal', 25, '{"kind":"fichas","n":30}'),
('T1', 'normal', 26, '{"kind":"monedas","n":1000}'),
('T1', 'normal', 27, '{"kind":"jugador","id":100726}'),
('T1', 'normal', 28, '{"kind":"monedas","n":1000}'),
('T1', 'normal', 29, '{"kind":"monedas","n":1000}'),
('T1', 'normal', 30, '{"kind":"multi"}'),
('T1', 'normal', 31, '{"kind":"monedas","n":1000}'),
('T1', 'normal', 32, '{"kind":"monedas","n":1000}'),
('T1', 'normal', 33, '{"kind":"jugador","id":101512}'),
('T1', 'normal', 34, '{"kind":"monedas","n":1000}'),
('T1', 'normal', 35, '{"kind":"fichas","n":30}'),
('T1', 'normal', 36, '{"kind":"monedas","n":1000}'),
('T1', 'normal', 37, '{"kind":"monedas","n":1000}'),
('T1', 'normal', 38, '{"kind":"monedas","n":1000}'),
('T1', 'normal', 39, '{"kind":"jugador","id":100457}'),
('T1', 'normal', 40, '{"kind":"banner","id":"pase-cuernos"}'),
('T1', 'normal', 41, '{"kind":"monedas","n":1000}'),
('T1', 'normal', 42, '{"kind":"monedas","n":1000}'),
('T1', 'normal', 43, '{"kind":"monedas","n":1000}'),
('T1', 'normal', 44, '{"kind":"monedas","n":1000}'),
('T1', 'normal', 45, '{"kind":"jugador","id":100781}'),
('T1', 'normal', 46, '{"kind":"monedas","n":1000}'),
('T1', 'normal', 47, '{"kind":"monedas","n":1000}'),
('T1', 'normal', 48, '{"kind":"monedas","n":1000}'),
('T1', 'normal', 49, '{"kind":"monedas","n":1000}'),
('T1', 'normal', 50, '{"kind":"multi"}'),
('T1', 'normal', 51, '{"kind":"jugador","id":100947}'),
('T1', 'normal', 52, '{"kind":"monedas","n":1000}'),
('T1', 'normal', 53, '{"kind":"monedas","n":1000}'),
('T1', 'normal', 54, '{"kind":"monedas","n":1000}'),
('T1', 'normal', 55, '{"kind":"fichas","n":30}'),
('T1', 'normal', 56, '{"kind":"monedas","n":1000}'),
('T1', 'normal', 57, '{"kind":"jugador","id":101591}'),
('T1', 'normal', 58, '{"kind":"monedas","n":1000}'),
('T1', 'normal', 59, '{"kind":"monedas","n":1000}'),
('T1', 'normal', 60, '{"kind":"marco","id":"marco-dominio"}'),
('T1', 'normal', 61, '{"kind":"monedas","n":1000}'),
('T1', 'normal', 62, '{"kind":"monedas","n":1000}'),
('T1', 'normal', 63, '{"kind":"jugador","id":102114}'),
('T1', 'normal', 64, '{"kind":"monedas","n":1000}'),
('T1', 'normal', 65, '{"kind":"fichas","n":30}'),
('T1', 'normal', 66, '{"kind":"monedas","n":1000}'),
('T1', 'normal', 67, '{"kind":"monedas","n":1000}'),
('T1', 'normal', 68, '{"kind":"monedas","n":1000}'),
('T1', 'normal', 69, '{"kind":"jugador","id":102134}'),
('T1', 'normal', 70, '{"kind":"multi"}'),
('T1', 'normal', 71, '{"kind":"monedas","n":1000}'),
('T1', 'normal', 72, '{"kind":"monedas","n":1000}'),
('T1', 'normal', 73, '{"kind":"monedas","n":1000}'),
('T1', 'normal', 74, '{"kind":"monedas","n":1000}'),
('T1', 'normal', 75, '{"kind":"jugador","id":100485}'),
('T1', 'normal', 76, '{"kind":"monedas","n":1000}'),
('T1', 'normal', 77, '{"kind":"monedas","n":1000}'),
('T1', 'normal', 78, '{"kind":"monedas","n":1000}'),
('T1', 'normal', 79, '{"kind":"monedas","n":1000}'),
('T1', 'normal', 80, '{"kind":"fichas","n":30}'),
('T1', 'normal', 81, '{"kind":"jugador","id":100776}'),
('T1', 'normal', 82, '{"kind":"monedas","n":1000}'),
('T1', 'normal', 83, '{"kind":"monedas","n":1000}'),
('T1', 'normal', 84, '{"kind":"monedas","n":1000}'),
('T1', 'normal', 85, '{"kind":"fichas","n":30}'),
('T1', 'normal', 86, '{"kind":"monedas","n":1000}'),
('T1', 'normal', 87, '{"kind":"jugador","id":102170}'),
('T1', 'normal', 88, '{"kind":"monedas","n":1000}'),
('T1', 'normal', 89, '{"kind":"monedas","n":1000}'),
('T1', 'normal', 90, '{"kind":"multi"}'),
('T1', 'normal', 91, '{"kind":"monedas","n":1000}'),
('T1', 'normal', 92, '{"kind":"monedas","n":1000}'),
('T1', 'normal', 93, '{"kind":"monedas","n":1000}'),
('T1', 'normal', 94, '{"kind":"monedas","n":1000}'),
('T1', 'normal', 95, '{"kind":"fichas","n":30}'),
('T1', 'normal', 96, '{"kind":"monedas","n":1000}'),
('T1', 'normal', 97, '{"kind":"monedas","n":1000}'),
('T1', 'normal', 98, '{"kind":"monedas","n":1000}'),
('T1', 'normal', 99, '{"kind":"monedas","n":1000}'),
('T1', 'normal', 100, '{"kind":"eg","n":2}'),
('T1', 'normal', 101, '{"kind":"monedas","n":1000}'),
('T1', 'normal', 102, '{"kind":"monedas","n":1000}'),
('T1', 'normal', 103, '{"kind":"monedas","n":1000}'),
('T1', 'normal', 104, '{"kind":"monedas","n":1000}'),
('T1', 'normal', 105, '{"kind":"fichas","n":30}'),
('T1', 'normal', 106, '{"kind":"monedas","n":1000}'),
('T1', 'normal', 107, '{"kind":"monedas","n":1000}'),
('T1', 'normal', 108, '{"kind":"monedas","n":1000}'),
('T1', 'normal', 109, '{"kind":"monedas","n":1000}'),
('T1', 'normal', 110, '{"kind":"multi"}'),
('T1', 'normal', 111, '{"kind":"monedas","n":1000}'),
('T1', 'normal', 112, '{"kind":"monedas","n":1000}'),
('T1', 'normal', 113, '{"kind":"monedas","n":1000}'),
('T1', 'normal', 114, '{"kind":"monedas","n":1000}'),
('T1', 'normal', 115, '{"kind":"fichas","n":30}'),
('T1', 'normal', 116, '{"kind":"monedas","n":1000}'),
('T1', 'normal', 117, '{"kind":"monedas","n":1000}'),
('T1', 'normal', 118, '{"kind":"monedas","n":1000}'),
('T1', 'normal', 119, '{"kind":"monedas","n":1000}'),
('T1', 'normal', 120, '{"kind":"fichas","n":30}'),
('T1', 'normal', 121, '{"kind":"monedas","n":1000}'),
('T1', 'normal', 122, '{"kind":"monedas","n":1000}'),
('T1', 'normal', 123, '{"kind":"monedas","n":1000}'),
('T1', 'normal', 124, '{"kind":"monedas","n":1000}'),
('T1', 'normal', 125, '{"kind":"eg","n":3}'),
('T1', 'premium', 1, '{"kind":"jugador","id":900400}'),
('T1', 'premium', 2, '{"kind":"monedas","n":3000}'),
('T1', 'premium', 3, '{"kind":"fichas","n":20}'),
('T1', 'premium', 4, '{"kind":"jugador","id":900400}'),
('T1', 'premium', 5, '{"kind":"multi"}'),
('T1', 'premium', 6, '{"kind":"monedas","n":3000}'),
('T1', 'premium', 7, '{"kind":"fichas","n":20}'),
('T1', 'premium', 8, '{"kind":"jugador","id":900400}'),
('T1', 'premium', 9, '{"kind":"fichas","n":20}'),
('T1', 'premium', 10, '{"kind":"eg","n":1}'),
('T1', 'premium', 11, '{"kind":"fichas","n":20}'),
('T1', 'premium', 12, '{"kind":"jugador","id":100952}'),
('T1', 'premium', 13, '{"kind":"fichas","n":20}'),
('T1', 'premium', 14, '{"kind":"jugador","id":900400}'),
('T1', 'premium', 15, '{"kind":"multi"}'),
('T1', 'premium', 16, '{"kind":"jugador","id":100242}'),
('T1', 'premium', 17, '{"kind":"fichas","n":20}'),
('T1', 'premium', 18, '{"kind":"jugador","id":900400}'),
('T1', 'premium', 19, '{"kind":"fichas","n":20}'),
('T1', 'premium', 20, '{"kind":"eg","n":1}'),
('T1', 'premium', 21, '{"kind":"fichas","n":20}'),
('T1', 'premium', 22, '{"kind":"jugador","id":100952}'),
('T1', 'premium', 23, '{"kind":"fichas","n":20}'),
('T1', 'premium', 24, '{"kind":"jugador","id":900400}'),
('T1', 'premium', 25, '{"kind":"banner","id":"todopoderoso"}'),
('T1', 'premium', 26, '{"kind":"jugador","id":100242}'),
('T1', 'premium', 27, '{"kind":"fichas","n":20}'),
('T1', 'premium', 28, '{"kind":"jugador","id":900400}'),
('T1', 'premium', 29, '{"kind":"fichas","n":20}'),
('T1', 'premium', 30, '{"kind":"eg","n":1}'),
('T1', 'premium', 31, '{"kind":"fichas","n":20}'),
('T1', 'premium', 32, '{"kind":"jugador","id":100952}'),
('T1', 'premium', 33, '{"kind":"fichas","n":20}'),
('T1', 'premium', 34, '{"kind":"jugador","id":900400}'),
('T1', 'premium', 35, '{"kind":"multi"}'),
('T1', 'premium', 36, '{"kind":"jugador","id":100242}'),
('T1', 'premium', 37, '{"kind":"fichas","n":20}'),
('T1', 'premium', 38, '{"kind":"jugador","id":900400}'),
('T1', 'premium', 39, '{"kind":"fichas","n":20}'),
('T1', 'premium', 40, '{"kind":"eg","n":1}'),
('T1', 'premium', 41, '{"kind":"fichas","n":20}'),
('T1', 'premium', 42, '{"kind":"jugador","id":100952}'),
('T1', 'premium', 43, '{"kind":"fichas","n":20}'),
('T1', 'premium', 44, '{"kind":"jugador","id":900400}'),
('T1', 'premium', 45, '{"kind":"multi"}'),
('T1', 'premium', 46, '{"kind":"jugador","id":100242}'),
('T1', 'premium', 47, '{"kind":"fichas","n":20}'),
('T1', 'premium', 48, '{"kind":"jugador","id":900400}'),
('T1', 'premium', 49, '{"kind":"fichas","n":20}'),
('T1', 'premium', 50, '{"kind":"jugador","id":100242}'),
('T1', 'premium', 51, '{"kind":"fichas","n":20}'),
('T1', 'premium', 52, '{"kind":"jugador","id":100952}'),
('T1', 'premium', 53, '{"kind":"fichas","n":20}'),
('T1', 'premium', 54, '{"kind":"jugador","id":900400}'),
('T1', 'premium', 55, '{"kind":"multi"}'),
('T1', 'premium', 56, '{"kind":"jugador","id":100242}'),
('T1', 'premium', 57, '{"kind":"fichas","n":20}'),
('T1', 'premium', 58, '{"kind":"jugador","id":900400}'),
('T1', 'premium', 59, '{"kind":"fichas","n":20}'),
('T1', 'premium', 60, '{"kind":"eg","n":1}'),
('T1', 'premium', 61, '{"kind":"fichas","n":20}'),
('T1', 'premium', 62, '{"kind":"jugador","id":100952}'),
('T1', 'premium', 63, '{"kind":"fichas","n":20}'),
('T1', 'premium', 64, '{"kind":"jugador","id":900400}'),
('T1', 'premium', 65, '{"kind":"multi"}'),
('T1', 'premium', 66, '{"kind":"jugador","id":100242}'),
('T1', 'premium', 67, '{"kind":"fichas","n":20}'),
('T1', 'premium', 68, '{"kind":"jugador","id":900400}'),
('T1', 'premium', 69, '{"kind":"fichas","n":20}'),
('T1', 'premium', 70, '{"kind":"eg","n":1}'),
('T1', 'premium', 71, '{"kind":"fichas","n":20}'),
('T1', 'premium', 72, '{"kind":"jugador","id":100952}'),
('T1', 'premium', 73, '{"kind":"fichas","n":20}'),
('T1', 'premium', 74, '{"kind":"jugador","id":900400}'),
('T1', 'premium', 75, '{"kind":"marco","id":"marco-todopoderoso"}'),
('T1', 'premium', 76, '{"kind":"jugador","id":100242}'),
('T1', 'premium', 77, '{"kind":"fichas","n":20}'),
('T1', 'premium', 78, '{"kind":"jugador","id":900400}'),
('T1', 'premium', 79, '{"kind":"fichas","n":20}'),
('T1', 'premium', 80, '{"kind":"eg","n":1}'),
('T1', 'premium', 81, '{"kind":"fichas","n":20}'),
('T1', 'premium', 82, '{"kind":"jugador","id":100952}'),
('T1', 'premium', 83, '{"kind":"fichas","n":20}'),
('T1', 'premium', 84, '{"kind":"jugador","id":900400}'),
('T1', 'premium', 85, '{"kind":"multi"}'),
('T1', 'premium', 86, '{"kind":"jugador","id":100242}'),
('T1', 'premium', 87, '{"kind":"fichas","n":20}'),
('T1', 'premium', 88, '{"kind":"monedas","n":3000}'),
('T1', 'premium', 89, '{"kind":"fichas","n":20}'),
('T1', 'premium', 90, '{"kind":"eg","n":1}'),
('T1', 'premium', 91, '{"kind":"fichas","n":20}'),
('T1', 'premium', 92, '{"kind":"jugador","id":100952}'),
('T1', 'premium', 93, '{"kind":"fichas","n":20}'),
('T1', 'premium', 94, '{"kind":"monedas","n":3000}'),
('T1', 'premium', 95, '{"kind":"multi"}'),
('T1', 'premium', 96, '{"kind":"jugador","id":100242}'),
('T1', 'premium', 97, '{"kind":"fichas","n":20}'),
('T1', 'premium', 98, '{"kind":"monedas","n":3000}'),
('T1', 'premium', 99, '{"kind":"fichas","n":20}'),
('T1', 'premium', 100, '{"kind":"jugador","id":900401}'),
('T1', 'premium', 101, '{"kind":"fichas","n":20}'),
('T1', 'premium', 102, '{"kind":"jugador","id":100952}'),
('T1', 'premium', 103, '{"kind":"fichas","n":20}'),
('T1', 'premium', 104, '{"kind":"monedas","n":3000}'),
('T1', 'premium', 105, '{"kind":"jugador","id":900401}'),
('T1', 'premium', 106, '{"kind":"jugador","id":100242}'),
('T1', 'premium', 107, '{"kind":"fichas","n":20}'),
('T1', 'premium', 108, '{"kind":"monedas","n":3000}'),
('T1', 'premium', 109, '{"kind":"fichas","n":20}'),
('T1', 'premium', 110, '{"kind":"jugador","id":900401}'),
('T1', 'premium', 111, '{"kind":"fichas","n":20}'),
('T1', 'premium', 112, '{"kind":"jugador","id":100952}'),
('T1', 'premium', 113, '{"kind":"fichas","n":20}'),
('T1', 'premium', 114, '{"kind":"monedas","n":3000}'),
('T1', 'premium', 115, '{"kind":"jugador","id":900401}'),
('T1', 'premium', 116, '{"kind":"monedas","n":3000}'),
('T1', 'premium', 117, '{"kind":"fichas","n":20}'),
('T1', 'premium', 118, '{"kind":"monedas","n":3000}'),
('T1', 'premium', 119, '{"kind":"fichas","n":20}'),
('T1', 'premium', 120, '{"kind":"jugador","id":900401}'),
('T1', 'premium', 121, '{"kind":"fichas","n":20}'),
('T1', 'premium', 122, '{"kind":"monedas","n":3000}'),
('T1', 'premium', 123, '{"kind":"fichas","n":20}'),
('T1', 'premium', 124, '{"kind":"monedas","n":3000}'),
('T1', 'premium', 125, '{"kind":"jugador","id":900401}')

on conflict (season, track, level) do update set reward = excluded.reward;

-- the footballers only the server hands over (exclusive «pase» in data/special_players.json)
create or replace function private.pass_only_players() returns integer[] language sql immutable set search_path = '' as $$
  select array[900400, 900401];
$$;
insert into private.gts_banned (player_id) select unnest(private.pass_only_players()) on conflict do nothing;

create or replace function private.season_rank_xp(p_rank text) returns numeric language sql immutable set search_path = '' as $$
  select case p_rank when 'C' then 1 when 'B' then 1.2 when 'A' then 1.45 when 'S' then 1.75 when 'X' then 2.1 when 'Z' then 2.5 end;
$$;

-- the pass row of an account. The first time, it starts from what the cloud save held for this season (claimed levels
-- only on open rows and reached levels, dated in the past so economy_cap never credits them again). A promo code that
-- gave the Llave dorada while the season was open opens it (redeem_code answers goldKey, kept in promo_redemptions.result)
create or replace function private.season_row(p_uid uuid, p_season text) returns private.season_pass
language plpgsql volatile security definer set search_path = '' as $$
declare r private.season_pass; d jsonb;
begin
  select * into r from private.season_pass p where p.user_id = p_uid and p.season = p_season;
  if not found then
    select s.data -> 'season' into d from public.saves s where s.user_id = p_uid;
    if jsonb_typeof(d) <> 'object' or d ->> 'id' is distinct from p_season then d := null; end if;
    insert into private.season_pass (user_id, season, xp, normal, gold, normal_at, gold_at) values (p_uid, p_season,
      case when jsonb_typeof(d -> 'xp') = 'number' then least(17500, greatest(0, floor((d ->> 'xp')::numeric)))::integer else 0 end,
      coalesce(d ->> 'normal' = 'true', false), coalesce(d ->> 'gold' = 'true', false),
      case when d ->> 'normal' = 'true' then timestamptz '2000-01-01' end, case when d ->> 'gold' = 'true' then timestamptz '2000-01-01' end)
    on conflict do nothing;
    select * into r from private.season_pass p where p.user_id = p_uid and p.season = p_season;
    if d is not null then
      insert into private.season_pass_claims (user_id, season, track, level, reward, coins, tokens, claimed_at)
      select p_uid, p_season, w.track, w.level, w.reward, 0, 0, timestamptz '2000-01-01'
      from (values ('normal', 'claimedNormal', r.normal), ('premium', 'claimedPremium', r.gold)) t (track, field, open)
      cross join lateral jsonb_array_elements(case when jsonb_typeof(d -> t.field) = 'array' then d -> t.field else '[]'::jsonb end) e (v)
      join private.season_rewards w on w.season = p_season and w.track = t.track and jsonb_typeof(e.v) = 'number' and w.level::numeric = (e.v #>> '{}')::numeric
      where t.open and w.level <= least(125, r.xp / 140)
      on conflict do nothing;
    end if;
  end if;
  if not r.gold and exists (select 1 from private.promo_redemptions x join private.seasons s on s.id = p_season
      where x.user_id = p_uid and x.result ->> 'goldKey' = 'true' and x.created_at >= s.starts_at and x.created_at < s.ends_at) then
    update private.season_pass p set gold = true, gold_at = now() where p.user_id = p_uid and p.season = p_season returning * into r;
  end if;
  return r;
end $$;

-- what the game keeps in save.season (seasonPass.ts SeasonSave); volatile: it must see the claims season_row has just
-- written in the same statement
create or replace function private.season_json(r private.season_pass) returns jsonb
language sql volatile security definer set search_path = '' as $$
  select jsonb_build_object('id', r.season, 'xp', r.xp, 'normal', r.normal, 'gold', r.gold,
    'claimedNormal', coalesce((select jsonb_agg(c.level order by c.level) from private.season_pass_claims c
      where c.user_id = r.user_id and c.season = r.season and c.track = 'normal'), '[]'::jsonb),
    'claimedPremium', coalesce((select jsonb_agg(c.level order by c.level) from private.season_pass_claims c
      where c.user_id = r.user_id and c.season = r.season and c.track = 'premium'), '[]'::jsonb));
$$;

create or replace function private.season_state() returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare uid uuid := private.real_user(); cur text := private.current_season();
begin
  if not private.pass_server_on() then raise exception 'pass_not_yet' using errcode = '22023'; end if;
  if cur is null then return null; end if;
  return private.season_json(private.season_row(uid, cur));
end $$;

-- a run begins (not training): a newer run stops the older ones that never finished
create or replace function private.season_run_start(p_run_id uuid, p_coop boolean) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare uid uuid := private.real_user(); cur text := private.current_season(); co boolean; r private.season_runs;
begin
  if not private.pass_server_on() then raise exception 'pass_not_yet' using errcode = '22023'; end if;
  if cur is null then return null; end if;
  select * into r from private.season_runs x where x.run_id = p_run_id;
  if found then
    if r.user_id <> uid then raise exception 'run_taken' using errcode = '22023'; end if;
    return jsonb_build_object('season', r.season, 'coop', r.coop);
  end if;
  if (select count(*) from private.season_runs x where x.user_id = uid and x.started_at > now() - interval '10 minutes') >= 20 then
    raise exception 'too_fast' using errcode = '54000';
  end if;
  delete from private.season_runs x where x.user_id = uid and x.started_at < now() - interval '7 days';
  perform private.season_row(uid, cur);
  -- ×2 only in a co-op room this account really joined (both players connected) in the last hours
  co := coalesce(p_coop, false) and exists (select 1 from public.coop_rooms c where (c.host = uid or c.guest = uid)
    and c.guest is not null and c.connected_at > now() - interval '6 hours');
  update private.season_runs x set superseded_at = now() where x.user_id = uid and x.finished_at is null and x.superseded_at is null;
  insert into private.season_runs (run_id, user_id, season, coop) values (p_run_id, uid, cur, co);
  return jsonb_build_object('season', cur, 'coop', co);
end $$;

-- rolls the Llave dorada for the rivals knocked out since the last roll (at most 15 a second of real time)
create or replace function private.season_roll(p_run_id uuid, p_uid uuid, p_kills integer) returns boolean
language plpgsql volatile security definer set search_path = '' as $$
declare r private.season_runs; p private.season_pass; n integer; got boolean := false;
begin
  select * into r from private.season_runs x where x.run_id = p_run_id and x.user_id = p_uid for update;
  if not found or r.finished_at is not null or r.superseded_at is not null or r.started_at < now() - interval '6 hours'
    or r.season is distinct from private.current_season() then return false; end if;
  n := greatest(0, least(coalesce(p_kills, 0) - r.rolled_kills, floor(extract(epoch from (now() - r.rolled_at)) * 15)::integer));
  p := private.season_row(p_uid, r.season);
  if n > 0 and not p.gold and random() < 1 - power(1 - 0.00005 * (case when r.coop then 2 else 1 end), n) then
    update private.season_pass x set gold = true, gold_at = now() where x.user_id = p_uid and x.season = r.season;
    got := true;
  end if;
  update private.season_runs x set rolled_kills = r.rolled_kills + n, rolled_at = now() where x.run_id = p_run_id;
  return got;
end $$;

-- during the run, about every half minute: did the key drop?
create or replace function private.season_run_tick(p_run_id uuid, p_kills integer) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare uid uuid := private.real_user(); got boolean := false;
begin
  if not private.pass_server_on() then raise exception 'pass_not_yet' using errcode = '22023'; end if;
  if exists (select 1 from private.season_runs x where x.run_id = p_run_id and x.user_id = uid and x.rolled_at <= now() - interval '15 seconds') then
    got := private.season_roll(p_run_id, uid, p_kills);
  end if;
  return jsonb_build_object('dropped', got);
end $$;

-- the run is over: its EXP (the game time, never more than the real time it lasted) and a last roll of the key
create or replace function private.season_run_finish(p_run_id uuid, p_time_sec integer, p_rank text, p_kills integer) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare uid uuid := private.real_user(); r private.season_runs; got boolean; secs numeric; gained integer := 0; p private.season_pass;
begin
  if not private.pass_server_on() then raise exception 'pass_not_yet' using errcode = '22023'; end if;
  if private.season_rank_xp(p_rank) is null then raise exception 'invalid_rank' using errcode = '22023'; end if;
  if p_rank = 'Z' and not private.rank_z_open() then raise exception 'rank_locked' using errcode = '22023'; end if;
  select * into r from private.season_runs x where x.run_id = p_run_id and x.user_id = uid;
  if not found then raise exception 'unknown_run' using errcode = '22023'; end if;
  if r.finished_at is not null then
    return private.season_json(private.season_row(uid, r.season)) || jsonb_build_object('gained', 0, 'dropped', false, 'duplicate', true);
  end if;
  got := private.season_roll(p_run_id, uid, p_kills);
  if r.season = private.current_season() then
    secs := least(greatest(0, coalesce(p_time_sec, 0)), extract(epoch from (coalesce(r.superseded_at, now()) - r.started_at)) + 30, 4 * 3600);
    gained := floor(secs / 60 * 30 * private.season_rank_xp(p_rank));
    perform private.season_row(uid, r.season);
    update private.season_pass x set xp = least(17500, x.xp + gained) where x.user_id = uid and x.season = r.season;
  end if;
  update private.season_runs x set finished_at = now(), xp = gained where x.run_id = p_run_id;
  return private.season_json(private.season_row(uid, r.season)) || jsonb_build_object('gained', gained, 'dropped', got);
end $$;

-- pays levels of one row: only open rows, reached levels, each once. Answers what each new level gives.
create or replace function private.season_claim(p_track text, p_levels integer[]) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare uid uuid := private.real_user(); cur text := private.current_season(); p private.season_pass; lv integer; rw jsonb; out jsonb := '[]'::jsonb;
begin
  if not private.pass_server_on() then raise exception 'pass_not_yet' using errcode = '22023'; end if;
  if cur is null then raise exception 'season_closed' using errcode = '22023'; end if;
  if p_track not in ('normal', 'premium') or coalesce(cardinality(p_levels), 0) > 125 then raise exception 'invalid_claim' using errcode = '22023'; end if;
  p := private.season_row(uid, cur);
  if (p_track = 'normal' and not p.normal) or (p_track = 'premium' and not p.gold) then raise exception 'row_locked' using errcode = '42501'; end if;
  for lv in select distinct x from unnest(p_levels) x where x between 1 and least(125, p.xp / 140) order by 1 loop
    select w.reward into rw from private.season_rewards w where w.season = cur and w.track = p_track and w.level = lv;
    continue when rw is null;
    insert into private.season_pass_claims (user_id, season, track, level, reward, coins, tokens)
      values (uid, cur, p_track, lv, rw,
        case rw ->> 'kind' when 'monedas' then (rw ->> 'n')::integer when 'jugador' then 250 else 0 end, -- 250: a duplicate's refund at most
        case rw ->> 'kind' when 'fichas' then (rw ->> 'n')::integer when 'multi' then 100 else 0 end)
      on conflict do nothing;
    if found then out := out || jsonb_build_object('track', p_track, 'level', lv, 'reward', rw); end if;
  end loop;
  return out;
end $$;

-- the Llave normal: 15.000 coins the cloud save must hold (economy_cap takes them off the next write)
create or replace function private.season_buy_normal_key() returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare uid uuid := private.real_user(); cur text := private.current_season(); p private.season_pass; coins numeric;
begin
  if not private.pass_server_on() then raise exception 'pass_not_yet' using errcode = '22023'; end if;
  if cur is null then raise exception 'season_closed' using errcode = '22023'; end if;
  p := private.season_row(uid, cur);
  if p.normal then return private.season_json(p); end if;
  select case when jsonb_typeof(s.data -> 'coins') = 'number' then (s.data ->> 'coins')::numeric else 0 end into coins from public.saves s where s.user_id = uid;
  if coalesce(coins, 0) < 15000 then raise exception 'not_enough_coins' using errcode = '22023'; end if;
  update private.season_pass x set normal = true, normal_at = now() where x.user_id = uid and x.season = cur returning * into p;
  return private.season_json(p);
end $$;

-- economy_cap_base as in sector_quinto, the pass now credited with exactly what its claimed levels pay
create or replace function private.economy_cap_base(p_new jsonb, p_old jsonb, p_since timestamptz, p_uid uuid) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare
  hours numeric := greatest(0, extract(epoch from (now() - coalesce(p_since, now()))) / 3600);
  promo_t numeric := 0; promo_c numeric := 0; bug_t numeric := 0; clan_t numeric := 0; clan_c numeric := 0; sea_t numeric := 0; sea_c numeric := 0;
  sec_t numeric := 0; sec_c numeric := 0; pass_t numeric := 0; pass_c numeric := 0; key_c numeric := 0;
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
  promo_c := promo_c + clan_c + sea_c + sec_c + pass_c - key_c;
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

-- what a write may say about the pass: the server's, word for word (only goldSeen, a screen already shown, is the save's);
-- and the pass-only footballers no more than the copies the server gave
create or replace function private.season_enforce(p_data jsonb, p_uid uuid) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare cur text := private.current_season(); out jsonb := p_data; pid integer; k text; allowed integer; o jsonb;
begin
  if p_uid is null or jsonb_typeof(p_data) <> 'object' or not private.pass_server_on() then return out; end if;
  if cur is not null then
    out := jsonb_set(out, '{season}', private.season_json(private.season_row(p_uid, cur))
      || case when p_data -> 'season' ->> 'id' = cur and jsonb_typeof(p_data -> 'season' -> 'goldSeen') = 'boolean'
           then jsonb_build_object('goldSeen', p_data -> 'season' -> 'goldSeen') else '{}'::jsonb end);
  end if;
  if jsonb_typeof(out -> 'owned') = 'object' then
    foreach pid in array private.pass_only_players() loop
      k := pid::text;
      continue when not (out -> 'owned' ? k);
      allowed := (select count(*) from private.season_pass_claims c where c.user_id = p_uid and c.reward ->> 'kind' = 'jugador' and c.reward ->> 'id' = k)
        + (select count(*) from private.season_results s where s.user_id = p_uid and s.claimed_at is not null and (pid = any (s.players) or s.player = pid))
        + (select count(*) from private.promo_redemptions x where x.user_id = p_uid and jsonb_typeof(x.result -> 'players') = 'array' and x.result -> 'players' @> to_jsonb(pid));
      o := out -> 'owned' -> k;
      if allowed <= 0 then
        out := out #- array['owned', k];
      elsif jsonb_typeof(o -> 'copies') <> 'number' or (o ->> 'copies')::numeric > allowed then
        out := jsonb_set(out, array['owned', k, 'copies'], to_jsonb(allowed));
        if jsonb_typeof(o -> 'spent') = 'number' and (o ->> 'spent')::numeric > allowed - 1 then
          out := jsonb_set(out, array['owned', k, 'spent'], to_jsonb(allowed - 1));
        end if;
      end if;
    end loop;
  end if;
  return out;
end $$;

-- put_save as in save_conflict_no_retry, plus season_enforce after the economy cap
create or replace function private.put_save(p_data jsonb, p_expected integer)
 returns integer
 language plpgsql
 security definer
 set search_path to 'public', 'extensions'
 set lock_timeout to '3s'
as $function$
declare uid uuid := private.real_user(); v integer; cur_epoch integer; old_data jsonb; old_at timestamptz;
begin
  if octet_length(p_data::text) > 2000000 then raise exception 'save_too_large' using errcode = '54000'; end if;
  if exists (select 1 from public.saves s where s.user_id = uid and s.updated_at > now() - interval '2 seconds') then
    raise exception 'too_fast' using errcode = '54000';
  end if;
  select s.data, s.updated_at, private.save_epoch(s.data) into old_data, old_at, cur_epoch from public.saves s where s.user_id = uid;
  if cur_epoch is not null and private.save_epoch(p_data) < cur_epoch then
    raise exception 'progress_reset' using errcode = 'P0001';
  end if;
  p_data := private.season_enforce(private.economy_cap(p_data, old_data, old_at, uid), uid);
  insert into public.saves (user_id, data, version) values (uid, p_data, 1)
  on conflict (user_id) do update set data = excluded.data, version = public.saves.version + 1, updated_at = now()
    where public.saves.version = p_expected
  returning version into v;
  if v is null then raise exception 'version_conflict' using errcode = 'P0001'; end if;
  return v;
end $function$;

-- 2.11 gold names: from the server's pass now, not from the save
create or replace function private.pass_holders(p_usernames text[]) returns table (username text)
language sql stable security definer set search_path = public as $$
  select p.username::text
  from public.profiles p
  join private.season_pass sp on sp.user_id = p.id and sp.season = private.current_season() and sp.gold
  where private.pass_server_on() and p.username = any (select trim(u)::extensions.citext from unnest(p_usernames[1:60]) u)
  union
  -- before 3.0, as in pass_holders: what the save says
  select p.username::text
  from public.profiles p
  join public.saves s on s.user_id = p.id
  where not private.pass_server_on() and p.username = any (select trim(u)::extensions.citext from unnest(p_usernames[1:60]) u)
    and s.data->'season'->>'id' = private.current_season()
    and s.data->'season'->>'gold' = 'true'
$$;
alter function private.pass_holders(text[]) set statement_timeout = '5s';

create or replace function public.season_state() returns jsonb
language sql volatile security invoker set search_path = '' as $$ select private.season_state(); $$;
create or replace function public.season_run_start(p_run_id uuid, p_coop boolean default false) returns jsonb
language sql volatile security invoker set search_path = '' as $$ select private.season_run_start(p_run_id, p_coop); $$;
create or replace function public.season_run_tick(p_run_id uuid, p_kills integer) returns jsonb
language sql volatile security invoker set search_path = '' as $$ select private.season_run_tick(p_run_id, p_kills); $$;
create or replace function public.season_run_finish(p_run_id uuid, p_time_sec integer, p_rank text, p_kills integer) returns jsonb
language sql volatile security invoker set search_path = '' as $$ select private.season_run_finish(p_run_id, p_time_sec, p_rank, p_kills); $$;
create or replace function public.season_claim(p_track text, p_levels integer[]) returns jsonb
language sql volatile security invoker set search_path = '' as $$ select private.season_claim(p_track, p_levels); $$;
create or replace function public.season_buy_normal_key() returns jsonb
language sql volatile security invoker set search_path = '' as $$ select private.season_buy_normal_key(); $$;

revoke all on function private.pass_server_on(), private.pass_only_players(), private.season_rank_xp(text), private.season_row(uuid, text),
  private.season_json(private.season_pass), private.season_roll(uuid, uuid, integer), private.season_enforce(jsonb, uuid)
  from public, anon, authenticated;
revoke all on function private.season_state(), private.season_run_start(uuid, boolean), private.season_run_tick(uuid, integer),
  private.season_run_finish(uuid, integer, text, integer), private.season_claim(text, integer[]), private.season_buy_normal_key(),
  public.season_state(), public.season_run_start(uuid, boolean), public.season_run_tick(uuid, integer),
  public.season_run_finish(uuid, integer, text, integer), public.season_claim(text, integer[]), public.season_buy_normal_key()
  from public, anon, authenticated;
grant execute on function private.season_state(), private.season_run_start(uuid, boolean), private.season_run_tick(uuid, integer),
  private.season_run_finish(uuid, integer, text, integer), private.season_claim(text, integer[]), private.season_buy_normal_key(),
  public.season_state(), public.season_run_start(uuid, boolean), public.season_run_tick(uuid, integer),
  public.season_run_finish(uuid, integer, text, integer), public.season_claim(text, integer[]), public.season_buy_normal_key()
  to authenticated;

notify pgrst, 'reload schema';
