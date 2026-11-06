-- pre-2.0 (author): budget for the TURN relay (Cloudflare Realtime, free up to its monthly allowance, billed past it).
-- The turn-credentials Edge Function asks coop_turn_claim before generating short-lived credentials: only a player who is
-- in a paired or connected room gets them, at most 20 a day each, and never more than the monthly cap for everyone
-- (8000 rooms: even if every one of them were relayed at ~35 MB that is far below the free allowance; in practice only
-- 10-20% of pairs need the relay). Over a cap the game still tries a direct connection.

create table if not exists private.coop_turn_log (
  id bigserial primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  code text not null,
  at timestamptz not null default now()
);
create index if not exists coop_turn_log_user on private.coop_turn_log (user_id, at desc);
create index if not exists coop_turn_log_at on private.coop_turn_log (at);
revoke all on table private.coop_turn_log from public, anon, authenticated;

create or replace function private.coop_turn_claim(p_code text) returns boolean
language plpgsql security definer set search_path = public as $$
declare uid uuid := private.real_user(); c text := upper(trim(p_code));
begin
  if uid is null then raise exception 'not_signed_in' using errcode = '42501'; end if;
  if not exists (select 1 from public.coop_rooms r where r.code = c and r.status in ('emparejada', 'conectada') and (r.host = uid or r.guest = uid)) then
    raise exception 'room_not_found' using errcode = 'P0002';
  end if;
  if (select count(*) from private.coop_turn_log where user_id = uid and at > now() - interval '1 day') >= 20 then return false; end if;
  if (select count(distinct code) from private.coop_turn_log where at >= date_trunc('month', now())) >= 8000
     and not exists (select 1 from private.coop_turn_log where code = c and at >= date_trunc('month', now())) then return false; end if;
  insert into private.coop_turn_log (user_id, code) values (uid, c);
  return true;
end $$;

-- admins: how much of the month's relay budget is used
create or replace function private.coop_turn_usage() returns table (rooms_month bigint, claims_month bigint, cap bigint)
language plpgsql stable security definer set search_path = public as $$
begin
  if not private.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  return query select count(distinct l.code), count(*), 8000::bigint from private.coop_turn_log l where l.at >= date_trunc('month', now());
end $$;

create or replace function public.coop_turn_claim(p_code text) returns boolean
language sql security invoker set search_path = '' as $$ select private.coop_turn_claim(p_code); $$;
create or replace function public.coop_turn_usage() returns table (rooms_month bigint, claims_month bigint, cap bigint)
language sql stable security invoker set search_path = '' as $$ select * from private.coop_turn_usage(); $$;

revoke execute on function private.coop_turn_claim(text), private.coop_turn_usage() from public, anon, authenticated;
grant execute on function private.coop_turn_claim(text), private.coop_turn_usage() to authenticated;
revoke execute on function public.coop_turn_claim(text), public.coop_turn_usage() from public, anon;
grant execute on function public.coop_turn_claim(text), public.coop_turn_usage() to authenticated;

alter function private.coop_turn_claim(text) set statement_timeout = '5s';
alter function private.coop_turn_usage() set statement_timeout = '5s';
