-- 1.9 (author): player tier lists. A signed-in player with a name ranks footballers in the fixed tiers S A B C D under one
-- of a few fixed topics (no free text, so nothing to moderate but the order) and publishes it; everyone sees the latest
-- ones in the menu. One list per account: publishing again replaces it. The admin can hide one. Tables closed to the API.

create table if not exists public.tierlists (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  topic text not null check (topic in ('general', 'delanteros', 'medios', 'defensas', 'porteros', 'favoritos')),
  tiers jsonb not null,
  hidden boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists tierlists_recent on public.tierlists (updated_at desc) where not hidden;
alter table public.tierlists enable row level security;
revoke all on table public.tierlists from public, anon, authenticated;

-- tiers: {"S": [ids], "A": [...], ...}; only these keys, whole positive ids, 3 to 60 in all, none repeated
create or replace function private.valid_tiers(p jsonb) returns boolean
language plpgsql immutable set search_path = '' as $$
declare k text; v jsonb; total int := 0; seen int[] := '{}'; e jsonb; id int;
begin
  if p is null or jsonb_typeof(p) <> 'object' then return false; end if;
  for k, v in select * from jsonb_each(p) loop
    if k not in ('S', 'A', 'B', 'C', 'D') or jsonb_typeof(v) <> 'array' or jsonb_array_length(v) > 30 then return false; end if;
    for e in select * from jsonb_array_elements(v) loop
      if jsonb_typeof(e) <> 'number' then return false; end if;
      id := (e #>> '{}')::numeric::int;
      if id <= 0 or id > 9999999 or (e #>> '{}')::numeric <> id or id = any (seen) then return false; end if;
      seen := seen || id;
      total := total + 1;
    end loop;
  end loop;
  return total between 3 and 60;
end $$;

create or replace function private.submit_tierlist(p_topic text, p_tiers jsonb) returns timestamptz
language plpgsql security definer set search_path = public as $$
declare uid uuid := private.real_user(); at timestamptz;
begin
  if not exists (select 1 from public.profiles where id = uid) then raise exception 'no_username' using errcode = '42501'; end if;
  if not private.valid_tiers(p_tiers) then raise exception 'invalid_tiers' using errcode = '22023'; end if;
  if exists (select 1 from public.tierlists where user_id = uid and updated_at > now() - interval '60 seconds') then
    raise exception 'too_fast' using errcode = '54000';
  end if;
  insert into public.tierlists as t (user_id, topic, tiers) values (uid, p_topic, p_tiers)
  on conflict (user_id) do update set topic = excluded.topic, tiers = excluded.tiers, updated_at = now()
  returning t.updated_at into at;
  return at;
end $$;

create or replace function private.tierlist_feed(p_limit int) returns table (username text, topic text, tiers jsonb, updated_at timestamptz)
language sql stable security definer set search_path = '' as $$
  select p.username::text, t.topic, t.tiers, t.updated_at
  from public.tierlists t join public.profiles p on p.id = t.user_id
  where not t.hidden order by t.updated_at desc limit least(greatest(coalesce(p_limit, 20), 1), 50);
$$;

create or replace function private.my_tierlist() returns table (topic text, tiers jsonb, updated_at timestamptz, hidden boolean)
language sql stable security definer set search_path = '' as $$
  select t.topic, t.tiers, t.updated_at, t.hidden from public.tierlists t where t.user_id = auth.uid();
$$;

create or replace function private.delete_my_tierlist() returns boolean
language sql security definer set search_path = '' as $$
  with d as (delete from public.tierlists t where t.user_id = private.real_user() returning 1) select exists (select 1 from d);
$$;

create or replace function private.admin_hide_tierlist(p_username text, p_hidden boolean) returns boolean
language plpgsql security definer set search_path = public as $$
begin
  if not private.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  update public.tierlists t set hidden = p_hidden from public.profiles p where p.id = t.user_id and p.username = p_username::extensions.citext;
  return found;
end $$;

create or replace function public.submit_tierlist(p_topic text, p_tiers jsonb) returns timestamptz
language sql security invoker set search_path = '' as $$ select private.submit_tierlist(p_topic, p_tiers); $$;
create or replace function public.tierlist_feed(p_limit int default 20) returns table (username text, topic text, tiers jsonb, updated_at timestamptz)
language sql stable security invoker set search_path = '' as $$ select * from private.tierlist_feed(p_limit); $$;
create or replace function public.my_tierlist() returns table (topic text, tiers jsonb, updated_at timestamptz, hidden boolean)
language sql stable security invoker set search_path = '' as $$ select * from private.my_tierlist(); $$;
create or replace function public.delete_my_tierlist() returns boolean
language sql security invoker set search_path = '' as $$ select private.delete_my_tierlist(); $$;
create or replace function public.admin_hide_tierlist(p_username text, p_hidden boolean default true) returns boolean
language sql security invoker set search_path = '' as $$ select private.admin_hide_tierlist(p_username, p_hidden); $$;

revoke execute on function private.valid_tiers(jsonb), private.submit_tierlist(text, jsonb), private.tierlist_feed(int), private.my_tierlist(),
  private.delete_my_tierlist(), private.admin_hide_tierlist(text, boolean) from public, anon, authenticated;
grant execute on function private.tierlist_feed(int) to anon, authenticated;
grant execute on function private.submit_tierlist(text, jsonb), private.my_tierlist(), private.delete_my_tierlist(),
  private.admin_hide_tierlist(text, boolean) to authenticated;
revoke execute on function public.submit_tierlist(text, jsonb), public.tierlist_feed(int), public.my_tierlist(), public.delete_my_tierlist(),
  public.admin_hide_tierlist(text, boolean) from public, anon;
grant execute on function public.tierlist_feed(int) to anon, authenticated;
grant execute on function public.submit_tierlist(text, jsonb), public.my_tierlist(), public.delete_my_tierlist(), public.admin_hide_tierlist(text, boolean) to authenticated;
