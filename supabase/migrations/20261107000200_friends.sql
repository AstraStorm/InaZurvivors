-- pre-2.0 (author): friends, for the co-op. A request by global name; accepted, both are friends (one row per pair, the
-- smaller id first). Being online = the game said so in the last two minutes (friend_heartbeat, once a minute while it
-- is open). A friend can be invited to the host's open co-op room: the invitation lasts two minutes and is shown once.
-- Limits: 30 requests a day, 100 friends, 20 invitations an hour. Tables closed to the API.

create table if not exists public.friendships (
  a uuid not null references auth.users (id) on delete cascade,
  b uuid not null references auth.users (id) on delete cascade,
  requester uuid not null references auth.users (id) on delete cascade,
  status text not null default 'pendiente' check (status in ('pendiente', 'aceptada')),
  created_at timestamptz not null default now(),
  accepted_at timestamptz,
  primary key (a, b),
  check (a < b),
  check (requester = a or requester = b)
);
create index if not exists friendships_b on public.friendships (b);
create index if not exists friendships_requester on public.friendships (requester, created_at desc);
alter table public.friendships enable row level security;
revoke all on table public.friendships from public, anon, authenticated;

create table if not exists private.presence (
  user_id uuid primary key references auth.users (id) on delete cascade,
  seen_at timestamptz not null default now()
);
revoke all on table private.presence from public, anon, authenticated;

create table if not exists public.coop_invites (
  id bigserial primary key,
  from_user uuid not null references auth.users (id) on delete cascade,
  to_user uuid not null references auth.users (id) on delete cascade,
  code text not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '2 minutes',
  shown boolean not null default false
);
create index if not exists coop_invites_to on public.coop_invites (to_user, created_at desc);
create index if not exists coop_invites_from on public.coop_invites (from_user, created_at desc);
alter table public.coop_invites enable row level security;
revoke all on table public.coop_invites from public, anon, authenticated;

create or replace function private.friend_uid(p_username text) returns uuid
language sql stable security definer set search_path = public as $$
  select id from public.profiles where username = trim(p_username)::extensions.citext;
$$;

-- a request; if the other one had already asked, it becomes a friendship
create or replace function private.friend_request(p_username text) returns text
language plpgsql security definer set search_path = public as $$
declare uid uuid := private.real_user(); other uuid; lo uuid; hi uuid; r record;
begin
  if uid is null then raise exception 'not_signed_in' using errcode = '42501'; end if;
  other := private.friend_uid(p_username);
  if other is null then raise exception 'friend_not_found' using errcode = 'P0002'; end if;
  if other = uid then raise exception 'friend_self' using errcode = '22023'; end if;
  lo := least(uid, other); hi := greatest(uid, other);
  select * into r from public.friendships where a = lo and b = hi for update;
  if r.a is not null then
    if r.status = 'aceptada' then return 'ya_amigos'; end if;
    if r.requester = uid then return 'enviada'; end if;
    update public.friendships set status = 'aceptada', accepted_at = now() where a = lo and b = hi;
    return 'aceptada';
  end if;
  if (select count(*) from public.friendships where requester = uid and created_at > now() - interval '1 day') >= 30 then
    raise exception 'friend_daily_limit' using errcode = '54000';
  end if;
  if (select count(*) from public.friendships where (a = uid or b = uid) and status = 'aceptada') >= 100 then
    raise exception 'friend_full' using errcode = '54000';
  end if;
  insert into public.friendships (a, b, requester) values (lo, hi, uid);
  return 'enviada';
end $$;

create or replace function private.friend_respond(p_username text, p_accept boolean) returns void
language plpgsql security definer set search_path = public as $$
declare uid uuid := private.real_user(); other uuid := private.friend_uid(p_username);
begin
  if uid is null then raise exception 'not_signed_in' using errcode = '42501'; end if;
  if other is null then raise exception 'friend_not_found' using errcode = 'P0002'; end if;
  if p_accept then
    update public.friendships set status = 'aceptada', accepted_at = now()
    where a = least(uid, other) and b = greatest(uid, other) and status = 'pendiente' and requester = other;
  else
    delete from public.friendships where a = least(uid, other) and b = greatest(uid, other) and status = 'pendiente' and requester = other;
  end if;
end $$;

-- unfriend, or cancel a request this player sent
create or replace function private.friend_remove(p_username text) returns void
language plpgsql security definer set search_path = public as $$
declare uid uuid := private.real_user(); other uuid := private.friend_uid(p_username);
begin
  if uid is null then raise exception 'not_signed_in' using errcode = '42501'; end if;
  if other is null then return; end if;
  delete from public.friendships where a = least(uid, other) and b = greatest(uid, other);
end $$;

create or replace function private.friend_list() returns table (username text, avatar text, crest text, status text, online boolean, since timestamptz)
language plpgsql stable security definer set search_path = public as $$
declare uid uuid := private.real_user();
begin
  if uid is null then raise exception 'not_signed_in' using errcode = '42501'; end if;
  return query
    select p.username::text, p.avatar, p.crest,
      case when f.status = 'aceptada' then 'amigo' when f.requester = uid then 'enviada' else 'recibida' end,
      f.status = 'aceptada' and coalesce(pr.seen_at > now() - interval '2 minutes', false),
      coalesce(f.accepted_at, f.created_at)
    from public.friendships f
    join public.profiles p on p.id = case when f.a = uid then f.b else f.a end
    left join private.presence pr on pr.user_id = p.id
    where f.a = uid or f.b = uid
    order by (f.status = 'aceptada' and coalesce(pr.seen_at > now() - interval '2 minutes', false)) desc, p.username;
end $$;

create or replace function private.friend_heartbeat() returns void
language plpgsql security definer set search_path = public as $$
declare uid uuid := private.real_user();
begin
  if uid is null then return; end if;
  insert into private.presence (user_id, seen_at) values (uid, now()) on conflict (user_id) do update set seen_at = now();
end $$;

-- the host of an open room invites a friend to it
create or replace function private.coop_invite(p_username text, p_code text) returns void
language plpgsql security definer set search_path = public as $$
declare uid uuid := private.real_user(); other uuid := private.friend_uid(p_username); c text := upper(trim(p_code));
begin
  if uid is null then raise exception 'not_signed_in' using errcode = '42501'; end if;
  if other is null then raise exception 'friend_not_found' using errcode = 'P0002'; end if;
  if not exists (select 1 from public.friendships where a = least(uid, other) and b = greatest(uid, other) and status = 'aceptada') then
    raise exception 'not_friends' using errcode = '42501';
  end if;
  if not exists (select 1 from public.coop_rooms where code = c and host = uid and status = 'abierta' and expires_at > now()) then
    raise exception 'room_not_found' using errcode = 'P0002';
  end if;
  if (select count(*) from public.coop_invites where from_user = uid and created_at > now() - interval '1 hour') >= 20 then
    raise exception 'invite_limit' using errcode = '54000';
  end if;
  delete from public.coop_invites where created_at < now() - interval '1 day';
  insert into public.coop_invites (from_user, to_user, code) values (uid, other, c);
end $$;

-- invitations for this player, each one returned once while it is still valid
create or replace function private.coop_invites_claim() returns table (from_name text, code text, created_at timestamptz)
language plpgsql security definer set search_path = public as $$
declare uid uuid := private.real_user();
begin
  if uid is null then return; end if;
  return query
    update public.coop_invites i set shown = true
    from public.profiles p
    where i.to_user = uid and not i.shown and i.expires_at > now() and p.id = i.from_user
    returning p.username::text, i.code, i.created_at;
end $$;

create or replace function public.friend_request(p_username text) returns text
language sql security invoker set search_path = '' as $$ select private.friend_request(p_username); $$;
create or replace function public.friend_respond(p_username text, p_accept boolean) returns void
language sql security invoker set search_path = '' as $$ select private.friend_respond(p_username, p_accept); $$;
create or replace function public.friend_remove(p_username text) returns void
language sql security invoker set search_path = '' as $$ select private.friend_remove(p_username); $$;
create or replace function public.friend_list() returns table (username text, avatar text, crest text, status text, online boolean, since timestamptz)
language sql stable security invoker set search_path = '' as $$ select * from private.friend_list(); $$;
create or replace function public.friend_heartbeat() returns void
language sql security invoker set search_path = '' as $$ select private.friend_heartbeat(); $$;
create or replace function public.coop_invite(p_username text, p_code text) returns void
language sql security invoker set search_path = '' as $$ select private.coop_invite(p_username, p_code); $$;
create or replace function public.coop_invites_claim() returns table (from_name text, code text, created_at timestamptz)
language sql security invoker set search_path = '' as $$ select * from private.coop_invites_claim(); $$;

revoke execute on function private.friend_uid(text), private.friend_request(text), private.friend_respond(text, boolean), private.friend_remove(text),
  private.friend_list(), private.friend_heartbeat(), private.coop_invite(text, text), private.coop_invites_claim() from public, anon, authenticated;
grant execute on function private.friend_uid(text), private.friend_request(text), private.friend_respond(text, boolean), private.friend_remove(text),
  private.friend_list(), private.friend_heartbeat(), private.coop_invite(text, text), private.coop_invites_claim() to authenticated;
revoke execute on function public.friend_request(text), public.friend_respond(text, boolean), public.friend_remove(text), public.friend_list(),
  public.friend_heartbeat(), public.coop_invite(text, text), public.coop_invites_claim() from public, anon;
grant execute on function public.friend_request(text), public.friend_respond(text, boolean), public.friend_remove(text), public.friend_list(),
  public.friend_heartbeat(), public.coop_invite(text, text), public.coop_invites_claim() to authenticated;

alter function private.friend_request(text) set statement_timeout = '5s';
alter function private.friend_respond(text, boolean) set statement_timeout = '5s';
alter function private.friend_remove(text) set statement_timeout = '5s';
alter function private.friend_list() set statement_timeout = '5s';
alter function private.friend_heartbeat() set statement_timeout = '5s';
alter function private.coop_invite(text, text) set statement_timeout = '5s';
alter function private.coop_invites_claim() set statement_timeout = '5s';
