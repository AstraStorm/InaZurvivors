-- 1.8 (author): the GTS, an online bank of footballers like Pokémon's Global Trade Station. A player leaves one spare copy
-- (never his only one) asking for another footballer in exchange; anyone who has a spare copy of the one asked for can take
-- the deposit at once, and the depositor collects what he got the next time he looks. Until then he can withdraw it.
--   * Leyenda, HÉROE and limited-event footballers can't be left (private.gts_banned + the HÉROE flag of the save).
--   * Deposit slots: 1, +1 per level of the «Ventanilla GTS» upgrade (save upgrades.gts), 5 at most.
--   * The same exchange can't be repeated: no two open deposits giving X for Y, and nobody repeats an exchange he already
--     made (private.gts_done, from both sides).
-- The server is the ledger. The client applies each movement to its own save once (save gts.applied: 'd:<id>' left,
-- 'w:<id>' withdrawn, 'r:<id>' received as depositor, 't:<id>' taken) and the spare checks discount what it has not
-- applied yet, so a stale cloud save can't leave the same copy twice.

create table if not exists private.gts_deposits (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  give_id integer not null check (give_id > 0),
  want_id integer not null check (want_id > 0 and want_id <> give_id),
  status text not null default 'open' check (status in ('open', 'traded', 'withdrawn')),
  taker_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  closed_at timestamptz
);
create index if not exists gts_open_give on private.gts_deposits (give_id) where status = 'open';
create index if not exists gts_user on private.gts_deposits (user_id, created_at desc);
create index if not exists gts_taker on private.gts_deposits (taker_id) where taker_id is not null;

create table if not exists private.gts_done (
  user_id uuid not null references auth.users (id) on delete cascade,
  give_id integer not null,
  want_id integer not null,
  primary key (user_id, give_id, want_id)
);

create table if not exists private.gts_banned (player_id integer primary key);
insert into private.gts_banned (player_id) values (1085), (100234), (100773), (900001), (900002), (900003), (900004), (900005), (900006), (900007), (900008)
on conflict do nothing;

alter table private.gts_deposits enable row level security;
alter table private.gts_done enable row level security;
alter table private.gts_banned enable row level security;
revoke all on private.gts_deposits, private.gts_done, private.gts_banned from public, anon, authenticated;

-- spare copies of a footballer in the cloud save, minus the ones the ledger already took and the client hasn't applied
create or replace function private.gts_spare(p_uid uuid, p_id integer) returns integer
language sql stable security definer set search_path = '' as $$
  with s as (select data from public.saves where user_id = p_uid),
  ap as (select coalesce((select array_agg(x) from s, jsonb_array_elements_text(case when jsonb_typeof(s.data->'gts'->'applied') = 'array' then s.data->'gts'->'applied' else '[]'::jsonb end) x), '{}'::text[]) a)
  select coalesce((select greatest(0, coalesce((s.data->'owned'->p_id::text->>'copies')::integer, 0) - 1 - coalesce((s.data->'owned'->p_id::text->>'spent')::integer, 0)) from s), 0)
    - (select count(*)::integer from private.gts_deposits d, ap where d.user_id = p_uid and d.give_id = p_id and not ('d:' || d.id) = any (ap.a))
    + (select count(*)::integer from private.gts_deposits d, ap where d.user_id = p_uid and d.give_id = p_id and d.status = 'withdrawn' and ('d:' || d.id) = any (ap.a) and not ('w:' || d.id) = any (ap.a))
    - (select count(*)::integer from private.gts_deposits d, ap where d.taker_id = p_uid and d.want_id = p_id and not ('t:' || d.id) = any (ap.a))
$$;

create or replace function private.gts_deposit(p_give integer, p_want integer) returns bigint
language plpgsql security definer set search_path = '' as $$
declare uid uuid := private.real_user(); sv jsonb; slots integer; open_n integer; new_id bigint;
begin
  if p_give is null or p_want is null or p_give = p_want or p_give <= 0 or p_want <= 0 then raise exception 'gts_invalid' using errcode = 'P0001'; end if;
  perform pg_advisory_xact_lock(hashtext('gts:' || uid::text));
  select data into sv from public.saves where user_id = uid;
  if sv is null then raise exception 'gts_no_save' using errcode = 'P0001'; end if;
  if exists (select 1 from private.gts_banned where player_id = p_give) or coalesce((sv->'owned'->p_give::text->>'hero')::boolean, false) then
    raise exception 'gts_banned' using errcode = 'P0001'; end if;
  if exists (select 1 from private.gts_banned where player_id = p_want) then raise exception 'gts_banned' using errcode = 'P0001'; end if;
  slots := least(5, 1 + greatest(0, coalesce((sv->'upgrades'->>'gts')::integer, 0)));
  select count(*) into open_n from private.gts_deposits where user_id = uid and status = 'open';
  if open_n >= slots then raise exception 'gts_slots' using errcode = 'P0001'; end if;
  if exists (select 1 from private.gts_deposits where user_id = uid and status = 'open' and give_id = p_give and want_id = p_want)
     or exists (select 1 from private.gts_done where user_id = uid and give_id = p_give and want_id = p_want) then
    raise exception 'gts_repeated' using errcode = 'P0001'; end if;
  if private.gts_spare(uid, p_give) < 1 then raise exception 'gts_no_spare' using errcode = 'P0001'; end if;
  insert into private.gts_deposits (user_id, give_id, want_id) values (uid, p_give, p_want) returning id into new_id;
  return new_id;
end $$;

create or replace function private.gts_withdraw(p_id bigint) returns boolean
language plpgsql security definer set search_path = '' as $$
declare uid uuid := private.real_user(); n integer;
begin
  update private.gts_deposits set status = 'withdrawn', closed_at = now() where id = p_id and user_id = uid and status = 'open';
  get diagnostics n = row_count;
  return n = 1;
end $$;

-- takes a deposit: the caller gives the footballer asked for and gets the one left. Exactly one taker wins.
create or replace function private.gts_take(p_id bigint) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare uid uuid := private.real_user(); d record;
begin
  perform pg_advisory_xact_lock(hashtext('gts:' || uid::text));
  select * into d from private.gts_deposits where id = p_id for update;
  if not found or d.status <> 'open' then raise exception 'gts_gone' using errcode = 'P0001'; end if;
  if d.user_id = uid then raise exception 'gts_own' using errcode = 'P0001'; end if;
  if exists (select 1 from private.gts_done where user_id = uid and give_id = d.want_id and want_id = d.give_id) then
    raise exception 'gts_repeated' using errcode = 'P0001'; end if;
  if coalesce((select (data->'owned'->d.want_id::text->>'hero')::boolean from public.saves where user_id = uid), false) then
    raise exception 'gts_banned' using errcode = 'P0001'; end if;
  if private.gts_spare(uid, d.want_id) < 1 then raise exception 'gts_no_spare' using errcode = 'P0001'; end if;
  update private.gts_deposits set status = 'traded', taker_id = uid, closed_at = now() where id = p_id;
  insert into private.gts_done (user_id, give_id, want_id) values (d.user_id, d.give_id, d.want_id), (uid, d.want_id, d.give_id) on conflict do nothing;
  return jsonb_build_object('id', d.id, 'give', d.want_id, 'get', d.give_id);
end $$;

-- the caller's ledger: his deposits (any state, the last 100) and the deposits he took
create or replace function private.gts_mine() returns table (id bigint, role text, give_id integer, want_id integer, status text, created_at timestamptz, closed_at timestamptz, other text)
language sql stable security definer set search_path = '' as $$
  select d.id, 'deposito', d.give_id, d.want_id, d.status, d.created_at, d.closed_at, (select p.username::text from public.profiles p where p.id = d.taker_id)
  from private.gts_deposits d where d.user_id = private.real_user()
  union all
  select d.id, 'tomado', d.give_id, d.want_id, d.status, d.created_at, d.closed_at, (select p.username::text from public.profiles p where p.id = d.user_id)
  from private.gts_deposits d where d.taker_id = private.real_user()
  order by 6 desc limit 200
$$;

-- open deposits of other players; p_get: the footballer the caller is looking for, p_give: the one he would give
create or replace function private.gts_search(p_get integer, p_give integer) returns table (id bigint, username text, give_id integer, want_id integer, created_at timestamptz)
language sql stable security definer set search_path = '' as $$
  select d.id, coalesce(p.username::text, '?'), d.give_id, d.want_id, d.created_at
  from private.gts_deposits d left join public.profiles p on p.id = d.user_id
  where d.status = 'open' and d.user_id is distinct from auth.uid()
    and (p_get is null or d.give_id = p_get) and (p_give is null or d.want_id = p_give)
  order by d.created_at desc limit 60
$$;

-- the latest movements, for the main menu (no account needed)
create or replace function private.gts_feed() returns table (id bigint, username text, give_id integer, want_id integer, status text, at timestamptz)
language sql stable security definer set search_path = '' as $$
  select d.id, coalesce(p.username::text, '?'), d.give_id, d.want_id, d.status, coalesce(d.closed_at, d.created_at)
  from private.gts_deposits d left join public.profiles p on p.id = d.user_id
  where d.status in ('open', 'traded')
  order by coalesce(d.closed_at, d.created_at) desc limit 12
$$;

alter function private.gts_deposit(integer, integer) set statement_timeout = '5s';
alter function private.gts_take(bigint) set statement_timeout = '5s';
alter function private.gts_search(integer, integer) set statement_timeout = '5s';
alter function private.gts_feed() set statement_timeout = '5s';
alter function private.gts_mine() set statement_timeout = '5s';

create or replace function public.gts_deposit(p_give integer, p_want integer) returns bigint
language sql security invoker set search_path = '' as $$ select private.gts_deposit(p_give, p_want); $$;
create or replace function public.gts_withdraw(p_id bigint) returns boolean
language sql security invoker set search_path = '' as $$ select private.gts_withdraw(p_id); $$;
create or replace function public.gts_take(p_id bigint) returns jsonb
language sql security invoker set search_path = '' as $$ select private.gts_take(p_id); $$;
create or replace function public.gts_mine() returns table (id bigint, role text, give_id integer, want_id integer, status text, created_at timestamptz, closed_at timestamptz, other text)
language sql security invoker set search_path = '' as $$ select * from private.gts_mine(); $$;
create or replace function public.gts_search(p_get integer default null, p_give integer default null) returns table (id bigint, username text, give_id integer, want_id integer, created_at timestamptz)
language sql security invoker set search_path = '' as $$ select * from private.gts_search(p_get, p_give); $$;
create or replace function public.gts_feed() returns table (id bigint, username text, give_id integer, want_id integer, status text, at timestamptz)
language sql security invoker set search_path = '' as $$ select * from private.gts_feed(); $$;

revoke execute on function private.gts_spare(uuid, integer), private.gts_deposit(integer, integer), private.gts_withdraw(bigint), private.gts_take(bigint),
  private.gts_mine(), private.gts_search(integer, integer), private.gts_feed() from public, anon, authenticated;
revoke execute on function public.gts_deposit(integer, integer), public.gts_withdraw(bigint), public.gts_take(bigint), public.gts_mine(),
  public.gts_search(integer, integer), public.gts_feed() from public, anon, authenticated;
grant execute on function private.gts_deposit(integer, integer), private.gts_withdraw(bigint), private.gts_take(bigint), private.gts_mine(),
  public.gts_deposit(integer, integer), public.gts_withdraw(bigint), public.gts_take(bigint), public.gts_mine() to authenticated;
grant execute on function private.gts_search(integer, integer), private.gts_feed(), public.gts_search(integer, integer), public.gts_feed() to anon, authenticated;

notify pgrst, 'reload schema';
