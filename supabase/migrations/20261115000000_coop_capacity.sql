-- 16.7 (author: «quita la limitación del coop de llegar solo hasta el jefe, que se vuelva infinito, pero que antes de llegar
-- al límite del servidor pare de ofrecer partidas y avise»). With endless co-op a room no longer costs a fixed ~35 MB of
-- relay: it costs what it lasts. The host's game reports, once a minute while the match runs, the minute and the megabytes
-- that went through the TURN relay (0 when the pair talks directly). Those add up per month in private.coop_usage, which
-- outlives the rooms (swept after a day). Before the free relay allowance (Cloudflare Realtime: 1000 GB a month) or the
-- room cap of coop_turn_claim runs out, coop_status says «closed»: no new rooms or joins, and the game tells why and when
-- it opens again. Matches already being played go on (the margin is there for them).

create table if not exists private.coop_usage (
  month date primary key,
  relay_mb numeric not null default 0,
  minutes bigint not null default 0
);
revoke all on table private.coop_usage from public, anon, authenticated;

alter table public.coop_rooms add column if not exists last_beat timestamptz;
alter table public.coop_rooms add column if not exists minutes int not null default 0;
alter table public.coop_rooms add column if not exists relay_mb numeric not null default 0;

-- the caps, in one place: relay megabytes a month (80% of 1000 GB), turn rooms a month (90% of coop_turn_claim's 8000),
-- matches at the same time
create or replace function private.coop_caps(out relay_mb numeric, out turn_rooms bigint, out live bigint)
language sql immutable set search_path = '' as $$ select 819200::numeric, 7200::bigint, 150::bigint $$;

-- the host, once a minute while the match runs: megabytes relayed since the last beat (0 when direct). Faster beats are
-- ignored and one beat counts at most 30 MB, so a broken or rigged client can't fill the month by itself.
create or replace function private.coop_beat(p_code text, p_relay_mb numeric) returns void
language plpgsql security definer set search_path = public as $$
declare uid uuid := private.real_user(); c text := upper(trim(p_code)); mb numeric := least(greatest(coalesce(p_relay_mb, 0), 0), 30);
begin
  if uid is null then raise exception 'not_signed_in' using errcode = '42501'; end if;
  update public.coop_rooms set last_beat = now(), minutes = minutes + 1, relay_mb = relay_mb + mb
  where code = c and host = uid and status = 'conectada' and (last_beat is null or last_beat < now() - interval '50 seconds');
  if not found then return; end if;
  insert into private.coop_usage (month, relay_mb, minutes) values (date_trunc('month', now())::date, mb, 1)
  on conflict (month) do update set relay_mb = private.coop_usage.relay_mb + excluded.relay_mb, minutes = private.coop_usage.minutes + 1;
end $$;

-- open = new rooms are offered; pct = the fullest of the three budgets; reopens = when the monthly budgets reset
create or replace function private.coop_status() returns table (open boolean, pct int, reason text, reopens timestamptz)
language plpgsql stable security definer set search_path = public as $$
declare caps record; mb numeric; rooms bigint; live bigint; p_relay numeric; p_turn numeric; p_live numeric;
begin
  select * into caps from private.coop_caps();
  select coalesce((select u.relay_mb from private.coop_usage u where u.month = date_trunc('month', now())::date), 0) into mb;
  select count(distinct l.code) into rooms from private.coop_turn_log l where l.at >= date_trunc('month', now());
  select count(*) into live from public.coop_rooms r where r.status = 'conectada'
    and coalesce(r.last_beat, r.connected_at) > now() - interval '3 minutes';
  p_relay := mb / caps.relay_mb; p_turn := rooms::numeric / caps.turn_rooms; p_live := live::numeric / caps.live;
  return query select greatest(p_relay, p_turn, p_live) < 1,
    least(100, floor(100 * greatest(p_relay, p_turn, p_live)))::int,
    case when p_live >= 1 and p_relay < 1 and p_turn < 1 then 'lleno' when greatest(p_relay, p_turn) >= 1 then 'mensual' else null end,
    case when p_live >= 1 and p_relay < 1 and p_turn < 1 then now() + interval '10 minutes' else date_trunc('month', now()) + interval '1 month' end;
end $$;

create or replace function private.coop_check_open() returns void
language plpgsql stable security definer set search_path = public as $$
begin
  if not (select s.open from private.coop_status() s) then raise exception 'coop_capacity' using errcode = '54000'; end if;
end $$;

-- coop_create / coop_join: same bodies as 20261107000000, plus the capacity check
create or replace function private.coop_create() returns text
language plpgsql security definer set search_path = public as $$
declare uid uuid := private.real_user(); alphabet text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; c text; b bytea; i int; tries int := 0;
begin
  if uid is null then raise exception 'not_signed_in' using errcode = '42501'; end if;
  perform private.coop_check_open();
  delete from public.coop_rooms where created_at < now() - interval '1 day';
  if (select count(*) from public.coop_rooms where host = uid and created_at > now() - interval '1 day') >= 40 then
    raise exception 'coop_daily_limit' using errcode = '54000';
  end if;
  update public.coop_rooms set status = 'cerrada' where host = uid and status in ('abierta', 'emparejada');
  loop
    b := decode(replace(gen_random_uuid()::text, '-', ''), 'hex'); c := '';
    for i in 0..5 loop c := c || substr(alphabet, get_byte(b, i) % 32 + 1, 1); end loop;
    exit when not exists (select 1 from public.coop_rooms where code = c);
    tries := tries + 1;
    if tries > 8 then raise exception 'no_code' using errcode = '54000'; end if;
  end loop;
  insert into public.coop_rooms (code, host, host_name) values (c, uid, (select username::text from public.profiles where id = uid));
  return c;
end $$;

create or replace function private.coop_join(p_code text) returns text
language plpgsql security definer set search_path = public as $$
declare uid uuid := private.real_user(); r record;
begin
  if uid is null then raise exception 'not_signed_in' using errcode = '42501'; end if;
  perform private.coop_check_open();
  select * into r from public.coop_rooms where code = upper(trim(p_code)) for update;
  if r.code is null or r.status = 'cerrada' or r.expires_at < now() then raise exception 'room_not_found' using errcode = 'P0002'; end if;
  if r.host = uid then raise exception 'own_room' using errcode = '42501'; end if;
  if r.guest is not null and r.guest <> uid then raise exception 'room_full' using errcode = '54000'; end if;
  update public.coop_rooms set guest = uid, guest_name = (select username::text from public.profiles where id = uid), status = 'emparejada',
    offer = case when guest = uid then offer else null end, answer = case when guest = uid then answer else null end
  where code = r.code;
  return r.host_name;
end $$;

create or replace function public.coop_beat(p_code text, p_relay_mb numeric) returns void
language sql security invoker set search_path = '' as $$ select private.coop_beat(p_code, p_relay_mb); $$;
create or replace function public.coop_status() returns table (open boolean, pct int, reason text, reopens timestamptz)
language sql stable security invoker set search_path = '' as $$ select * from private.coop_status(); $$;

revoke execute on function private.coop_caps(), private.coop_beat(text, numeric), private.coop_status(), private.coop_check_open()
  from public, anon, authenticated;
grant execute on function private.coop_caps(), private.coop_beat(text, numeric), private.coop_status(), private.coop_check_open() to authenticated;
revoke execute on function public.coop_beat(text, numeric), public.coop_status() from public, anon;
grant execute on function public.coop_beat(text, numeric), public.coop_status() to authenticated;

alter function private.coop_beat(text, numeric) set statement_timeout = '5s';
alter function private.coop_status() set statement_timeout = '5s';
