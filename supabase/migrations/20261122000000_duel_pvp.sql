-- Modo Duelo online (author: «aplica el online»: a waiting list with how many are looking, a bot after 1:30, a 60 s turn
-- timer). Each player runs the match on their own engine with themselves as side 0 (src/systems/duel/pvp.ts): the
-- server only pairs them, keeps both teams, the seed and who opens, and relays each turn's actions in order.
--   · duel_pvp_join puts you in the queue (your team and your plate) and pairs you with whoever waited longest;
--     duel_pvp_poll says how many are looking and, once paired, the match; duel_pvp_leave takes you out.
--   · duel_pvp_move adds a whole turn of yours (turn n is the opener's when n is even); duel_pvp_sync gives the turns from
--     n on and how long ago the rival was last seen (a heartbeat: each sync marks you seen).
--   · duel_pvp_end closes it once: a win, a surrender, or the rival gone for more than 60 s.
-- No coins or ranking for now: the teams travel from the browsers, so a match is only as honest as both players.

create table if not exists private.duel_queue (
  user_id uuid primary key references auth.users (id) on delete cascade,
  team jsonb not null,
  plate jsonb not null,
  joined_at timestamptz not null default now(),
  seen_at timestamptz not null default now(),
  match_id uuid
);
create table if not exists private.duel_matches (
  id uuid primary key default gen_random_uuid(),
  a uuid not null references auth.users (id) on delete cascade,
  b uuid not null references auth.users (id) on delete cascade,
  a_team jsonb not null, b_team jsonb not null,
  a_plate jsonb not null, b_plate jsonb not null,
  seed integer not null,
  first smallint not null check (first in (0, 1)),
  status text not null default 'live' check (status in ('live', 'done')),
  winner smallint check (winner in (0, 1)),
  reason text,
  created_at timestamptz not null default now(),
  a_seen timestamptz not null default now(),
  b_seen timestamptz not null default now()
);
create index if not exists duel_matches_a on private.duel_matches (a, created_at desc);
create index if not exists duel_matches_b on private.duel_matches (b, created_at desc);
create table if not exists private.duel_moves (
  match_id uuid not null references private.duel_matches (id) on delete cascade,
  n integer not null,
  side smallint not null,
  actions jsonb not null,
  created_at timestamptz not null default now(),
  primary key (match_id, n)
);
alter table private.duel_queue enable row level security;
alter table private.duel_matches enable row level security;
alter table private.duel_moves enable row level security;
revoke all on private.duel_queue, private.duel_matches, private.duel_moves from public, anon, authenticated;

/** the match as one of its players sees it (side 0 = a, 1 = b) */
create or replace function private.duel_pvp_view(m private.duel_matches, uid uuid) returns jsonb
language sql stable set search_path = '' as $$
  select jsonb_build_object('status', 'matched', 'match', m.id, 'side', case when m.a = uid then 0 else 1 end, 'seed', m.seed, 'first', m.first,
    'teams', jsonb_build_array(m.a_team, m.b_team), 'plates', jsonb_build_array(m.a_plate, m.b_plate), 'live', m.status = 'live');
$$;

/** pairs you with whoever has waited longest (or says how many are waiting) */
create or replace function private.duel_pvp_pair(uid uuid) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare me private.duel_queue; o private.duel_queue; m private.duel_matches; waiting integer;
begin
  select * into me from private.duel_queue where user_id = uid for update;
  if not found then return jsonb_build_object('status', 'out'); end if;
  if me.match_id is not null then
    select * into m from private.duel_matches where id = me.match_id;
    if found then return private.duel_pvp_view(m, uid); end if;
  end if;
  select * into o from private.duel_queue
    where user_id <> uid and match_id is null and seen_at > now() - interval '15 seconds'
    order by joined_at limit 1 for update skip locked;
  if found then
    insert into private.duel_matches (a, b, a_team, b_team, a_plate, b_plate, seed, first)
      values (o.user_id, uid, o.team, me.team, o.plate, me.plate, floor(random() * 2147483647)::integer, floor(random() * 2)::smallint)
      returning * into m;
    update private.duel_queue set match_id = m.id where user_id in (uid, o.user_id);
    return private.duel_pvp_view(m, uid);
  end if;
  select count(*) into waiting from private.duel_queue where match_id is null and seen_at > now() - interval '15 seconds';
  return jsonb_build_object('status', 'waiting', 'waiting', waiting,
    'playing', (select count(*) * 2 from private.duel_matches where status = 'live' and greatest(a_seen, b_seen) > now() - interval '60 seconds'));
end $$;

create or replace function public.duel_pvp_join(p_team jsonb, p_plate jsonb) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare uid uuid := private.real_user();
begin
  if uid is null then raise exception 'not_signed_in' using errcode = '28000'; end if;
  if not exists (select 1 from public.profiles where id = uid) then raise exception 'no_username' using errcode = '42501'; end if;
  if jsonb_typeof(p_team) <> 'object' or jsonb_typeof(p_plate) <> 'object' or octet_length(p_team::text) > 12000 or octet_length(p_plate::text) > 2000 then
    raise exception 'bad_team' using errcode = '22023';
  end if;
  delete from private.duel_queue where seen_at < now() - interval '1 hour';
  delete from private.duel_matches where created_at < now() - interval '2 days';
  insert into private.duel_queue (user_id, team, plate) values (uid, p_team, p_plate)
    on conflict (user_id) do update set team = excluded.team, plate = excluded.plate, joined_at = now(), seen_at = now(), match_id = null;
  return private.duel_pvp_pair(uid);
end $$;

create or replace function public.duel_pvp_poll() returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare uid uuid := private.real_user();
begin
  if uid is null then raise exception 'not_signed_in' using errcode = '28000'; end if;
  update private.duel_queue set seen_at = now() where user_id = uid;
  return private.duel_pvp_pair(uid);
end $$;

create or replace function public.duel_pvp_leave() returns void
language sql volatile security definer set search_path = '' as $$
  delete from private.duel_queue where user_id = private.real_user() and match_id is null;
$$;

create or replace function public.duel_pvp_move(p_match uuid, p_n integer, p_actions jsonb) returns void
language plpgsql volatile security definer set search_path = '' as $$
declare uid uuid := private.real_user(); m private.duel_matches; my_side smallint; next_n integer;
begin
  if uid is null then raise exception 'not_signed_in' using errcode = '28000'; end if;
  select * into m from private.duel_matches where id = p_match and (a = uid or b = uid) for update;
  if not found then raise exception 'no_match' using errcode = '22023'; end if;
  my_side := case when m.a = uid then 0 else 1 end;
  if jsonb_typeof(p_actions) <> 'array' or jsonb_array_length(p_actions) > 40 then raise exception 'bad_actions' using errcode = '22023'; end if;
  -- a turn sent twice (a retry) is fine; one out of order or out of turn is not
  if exists (select 1 from private.duel_moves where match_id = m.id and n = p_n and duel_moves.side = my_side) then return; end if;
  if m.status <> 'live' then raise exception 'match_over' using errcode = '22023'; end if;
  select count(*) into next_n from private.duel_moves where match_id = m.id;
  if p_n <> next_n or (m.first + p_n) % 2 <> my_side then raise exception 'out_of_turn' using errcode = '22023'; end if;
  insert into private.duel_moves (match_id, n, side, actions) values (m.id, p_n, my_side, p_actions);
  if my_side = 0 then update private.duel_matches set a_seen = now() where id = m.id; else update private.duel_matches set b_seen = now() where id = m.id; end if;
end $$;

create or replace function public.duel_pvp_sync(p_match uuid, p_from integer) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare uid uuid := private.real_user(); m private.duel_matches; my_side smallint;
begin
  if uid is null then raise exception 'not_signed_in' using errcode = '28000'; end if;
  select * into m from private.duel_matches where id = p_match and (a = uid or b = uid);
  if not found then raise exception 'no_match' using errcode = '22023'; end if;
  my_side := case when m.a = uid then 0 else 1 end;
  if my_side = 0 then update private.duel_matches set a_seen = now() where id = m.id; else update private.duel_matches set b_seen = now() where id = m.id; end if;
  return jsonb_build_object(
    'moves', coalesce((select jsonb_agg(jsonb_build_object('n', n, 'side', mv.side, 'actions', actions) order by n) from private.duel_moves mv where match_id = m.id and n >= p_from), '[]'::jsonb),
    'rival_seen', extract(epoch from now() - case when my_side = 0 then m.b_seen else m.a_seen end)::integer,
    'status', m.status, 'winner', m.winner, 'reason', m.reason);
end $$;

create or replace function public.duel_pvp_end(p_match uuid, p_winner smallint, p_reason text) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare uid uuid := private.real_user(); m private.duel_matches; my_side smallint;
begin
  if uid is null then raise exception 'not_signed_in' using errcode = '28000'; end if;
  select * into m from private.duel_matches where id = p_match and (a = uid or b = uid) for update;
  if not found then raise exception 'no_match' using errcode = '22023'; end if;
  my_side := case when m.a = uid then 0 else 1 end;
  if m.status = 'live' and p_winner in (0, 1) and p_reason in ('win', 'surrender', 'gone') then
    -- a surrender can only lose; leaving the rival gone needs the rival really gone
    if p_reason = 'surrender' and p_winner = my_side then return jsonb_build_object('status', m.status); end if;
    if p_reason = 'gone' and (p_winner <> my_side or (case when my_side = 0 then m.b_seen else m.a_seen end) > now() - interval '60 seconds') then
      return jsonb_build_object('status', m.status);
    end if;
    update private.duel_matches set status = 'done', winner = p_winner, reason = p_reason where id = m.id;
    delete from private.duel_queue where match_id = m.id;
    return jsonb_build_object('status', 'done', 'winner', p_winner);
  end if;
  return jsonb_build_object('status', m.status, 'winner', m.winner);
end $$;

revoke all on function private.duel_pvp_view(private.duel_matches, uuid) from public, anon, authenticated;
revoke all on function private.duel_pvp_pair(uuid) from public, anon, authenticated;
revoke all on function public.duel_pvp_join(jsonb, jsonb), public.duel_pvp_poll(), public.duel_pvp_leave(),
  public.duel_pvp_move(uuid, integer, jsonb), public.duel_pvp_sync(uuid, integer), public.duel_pvp_end(uuid, smallint, text) from public, anon;
grant execute on function public.duel_pvp_join(jsonb, jsonb), public.duel_pvp_poll(), public.duel_pvp_leave(),
  public.duel_pvp_move(uuid, integer, jsonb), public.duel_pvp_sync(uuid, integer), public.duel_pvp_end(uuid, smallint, text) to authenticated;
