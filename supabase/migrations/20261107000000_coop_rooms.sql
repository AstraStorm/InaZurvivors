-- pre-2.0 (author): co-op rooms for two. The host creates a room and shares its 6-letter code; the guest joins with it.
-- The match itself goes peer to peer (WebRTC); this table only carries the two signalling messages (the guest's offer
-- and the host's answer, each with its ICE candidates already gathered), so no Realtime connection is used. Rooms last
-- 15 minutes unless they connect; rows older than a day are swept on each create. Tables closed to the API.

create table if not exists public.coop_rooms (
  code text primary key check (code ~ '^[A-Z2-9]{6}$'),
  host uuid not null references auth.users (id) on delete cascade,
  guest uuid references auth.users (id) on delete cascade,
  host_name text,
  guest_name text,
  offer text check (char_length(offer) <= 20000),
  answer text check (char_length(answer) <= 20000),
  status text not null default 'abierta' check (status in ('abierta', 'emparejada', 'conectada', 'cerrada')),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '15 minutes',
  connected_at timestamptz
);
create index if not exists coop_rooms_host on public.coop_rooms (host, created_at desc);
alter table public.coop_rooms enable row level security;
revoke all on table public.coop_rooms from public, anon, authenticated;

create or replace function private.coop_create() returns text
language plpgsql security definer set search_path = public as $$
declare uid uuid := private.real_user(); alphabet text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; c text; b bytea; i int; tries int := 0;
begin
  if uid is null then raise exception 'not_signed_in' using errcode = '42501'; end if;
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
  select * into r from public.coop_rooms where code = upper(trim(p_code)) for update;
  if r.code is null or r.status = 'cerrada' or r.expires_at < now() then raise exception 'room_not_found' using errcode = 'P0002'; end if;
  if r.host = uid then raise exception 'own_room' using errcode = '42501'; end if;
  if r.guest is not null and r.guest <> uid then raise exception 'room_full' using errcode = '54000'; end if;
  update public.coop_rooms set guest = uid, guest_name = (select username::text from public.profiles where id = uid), status = 'emparejada',
    offer = case when guest = uid then offer else null end, answer = case when guest = uid then answer else null end
  where code = r.code;
  return r.host_name;
end $$;

-- the guest sends the offer, the host the answer
create or replace function private.coop_signal(p_code text, p_kind text, p_sdp text) returns void
language plpgsql security definer set search_path = public as $$
declare uid uuid := private.real_user(); r record;
begin
  if uid is null then raise exception 'not_signed_in' using errcode = '42501'; end if;
  if char_length(p_sdp) > 20000 then raise exception 'too_big' using errcode = '54000'; end if;
  select * into r from public.coop_rooms where code = upper(trim(p_code));
  if r.code is null or r.status = 'cerrada' or r.expires_at < now() then raise exception 'room_not_found' using errcode = 'P0002'; end if;
  if p_kind = 'offer' and r.guest = uid then update public.coop_rooms set offer = p_sdp, answer = null where code = r.code;
  elsif p_kind = 'answer' and r.host = uid then update public.coop_rooms set answer = p_sdp where code = r.code;
  else raise exception 'forbidden' using errcode = '42501';
  end if;
end $$;

create or replace function private.coop_poll(p_code text) returns table (status text, host_name text, guest_name text, offer text, answer text, role text)
language plpgsql stable security definer set search_path = public as $$
declare uid uuid := private.real_user();
begin
  return query select case when r.expires_at < now() and r.status <> 'conectada' then 'cerrada' else r.status end, r.host_name, r.guest_name,
    case when r.host = uid then r.offer end, case when r.guest = uid then r.answer end, case when r.host = uid then 'host' else 'guest' end
  from public.coop_rooms r where r.code = upper(trim(p_code)) and uid is not null and (r.host = uid or r.guest = uid);
end $$;

-- 'conectada' (the host, once the peers talk: kept for the admin stats) or 'cerrada' (either of the two)
create or replace function private.coop_mark(p_code text, p_status text) returns void
language plpgsql security definer set search_path = public as $$
declare uid uuid := private.real_user();
begin
  if p_status = 'conectada' then
    update public.coop_rooms set status = 'conectada', connected_at = now() where code = upper(trim(p_code)) and host = uid and status = 'emparejada';
  elsif p_status = 'cerrada' then
    update public.coop_rooms set status = 'cerrada' where code = upper(trim(p_code)) and (host = uid or guest = uid);
  else raise exception 'bad_status' using errcode = '22023';
  end if;
end $$;

create or replace function public.coop_create() returns text
language sql security invoker set search_path = '' as $$ select private.coop_create(); $$;
create or replace function public.coop_join(p_code text) returns text
language sql security invoker set search_path = '' as $$ select private.coop_join(p_code); $$;
create or replace function public.coop_signal(p_code text, p_kind text, p_sdp text) returns void
language sql security invoker set search_path = '' as $$ select private.coop_signal(p_code, p_kind, p_sdp); $$;
create or replace function public.coop_poll(p_code text) returns table (status text, host_name text, guest_name text, offer text, answer text, role text)
language sql stable security invoker set search_path = '' as $$ select * from private.coop_poll(p_code); $$;
create or replace function public.coop_mark(p_code text, p_status text) returns void
language sql security invoker set search_path = '' as $$ select private.coop_mark(p_code, p_status); $$;

revoke execute on function private.coop_create(), private.coop_join(text), private.coop_signal(text, text, text), private.coop_poll(text),
  private.coop_mark(text, text) from public, anon, authenticated;
grant execute on function private.coop_create(), private.coop_join(text), private.coop_signal(text, text, text), private.coop_poll(text),
  private.coop_mark(text, text) to authenticated;
revoke execute on function public.coop_create(), public.coop_join(text), public.coop_signal(text, text, text), public.coop_poll(text),
  public.coop_mark(text, text) from public, anon;
grant execute on function public.coop_create(), public.coop_join(text), public.coop_signal(text, text, text), public.coop_poll(text),
  public.coop_mark(text, text) to authenticated;

alter function private.coop_create() set statement_timeout = '5s';
alter function private.coop_join(text) set statement_timeout = '5s';
alter function private.coop_signal(text, text, text) set statement_timeout = '5s';
alter function private.coop_poll(text) set statement_timeout = '5s';
alter function private.coop_mark(text, text) set statement_timeout = '5s';
