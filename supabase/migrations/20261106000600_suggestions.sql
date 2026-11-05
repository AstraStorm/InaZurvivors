-- 1.88 (author): recommendations, next to the bug reports. A signed-in player sends an idea (title + text); the admin panel
-- lists them and marks each one pendiente / aceptada / descartada, with an optional reply. Accepting it or replying leaves a
-- notice for the player (claimed with claim_suggestion_notices); a discarded one tells nothing. Tables closed to the API.

create table if not exists public.suggestions (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  user_id uuid not null references auth.users (id) on delete cascade,
  username text,
  title text not null check (char_length(title) between 4 and 120),
  description text not null check (char_length(description) between 10 and 4000),
  status text not null default 'pendiente' check (status in ('pendiente', 'aceptada', 'descartada')),
  reply text not null default '' check (char_length(reply) <= 2000),
  notice_pending boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists suggestions_user on public.suggestions (user_id, created_at desc);
alter table public.suggestions enable row level security;
revoke all on table public.suggestions from public, anon, authenticated;

create or replace function private.submit_suggestion(p_title text, p_description text) returns text
language plpgsql security definer set search_path = public as $$
declare uid uuid := private.real_user(); new_code text; uname text;
begin
  if uid is null then raise exception 'not_signed_in' using errcode = '42501'; end if;
  if exists (select 1 from public.suggestions where user_id = uid and created_at > now() - interval '60 seconds') then
    raise exception 'too_fast' using errcode = '54000';
  end if;
  if (select count(*) from public.suggestions where user_id = uid and created_at > now() - interval '1 day') >= 5 then
    raise exception 'daily_limit' using errcode = '54000';
  end if;
  select username::text into uname from public.profiles where id = uid;
  new_code := 'IDEA-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
  insert into public.suggestions (code, user_id, username, title, description) values (new_code, uid, uname, trim(p_title), trim(p_description));
  return new_code;
end $$;

create or replace function private.my_suggestions() returns table (code text, title text, status text, created_at timestamptz)
language sql stable security definer set search_path = '' as $$
  select s.code, s.title, s.status, s.created_at from public.suggestions s where s.user_id = auth.uid() order by s.created_at desc limit 50;
$$;

create or replace function private.admin_suggestions(p_status text) returns setof public.suggestions
language plpgsql stable security definer set search_path = public as $$
begin
  if not private.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  return query select * from public.suggestions s where p_status is null or s.status = p_status order by s.created_at desc limit 300;
end $$;

create or replace function private.admin_update_suggestion(p_code text, p_status text, p_reply text) returns timestamptz
language plpgsql security definer set search_path = public as $$
declare old record; r record;
begin
  if not private.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  select status, reply into old from public.suggestions where code = p_code;
  update public.suggestions set status = coalesce(p_status, status), reply = coalesce(left(p_reply, 2000), reply), updated_at = now()
  where code = p_code returning id, status, reply, updated_at into r;
  if r.updated_at is null then raise exception 'not_found' using errcode = 'P0002'; end if;
  if r.status = 'descartada' then
    update public.suggestions set notice_pending = false where id = r.id;
  elsif (r.reply <> '' and r.reply is distinct from old.reply) or (r.status is distinct from old.status and r.status = 'aceptada') then
    update public.suggestions set notice_pending = true where id = r.id;
  end if;
  return r.updated_at;
end $$;

create or replace function private.claim_suggestion_notices() returns table (code text, title text, status text, reply text)
language sql security definer set search_path = '' as $$
  update public.suggestions s set notice_pending = false
  where s.user_id = private.real_user() and s.notice_pending
  returning s.code, s.title, s.status, s.reply;
$$;

create or replace function public.submit_suggestion(p_title text, p_description text) returns text
language sql security invoker set search_path = '' as $$ select private.submit_suggestion(p_title, p_description); $$;
create or replace function public.my_suggestions() returns table (code text, title text, status text, created_at timestamptz)
language sql stable security invoker set search_path = '' as $$ select * from private.my_suggestions(); $$;
create or replace function public.admin_suggestions(p_status text default null) returns setof public.suggestions
language sql stable security invoker set search_path = '' as $$ select * from private.admin_suggestions(p_status); $$;
create or replace function public.admin_update_suggestion(p_code text, p_status text default null, p_reply text default null) returns timestamptz
language sql security invoker set search_path = '' as $$ select private.admin_update_suggestion(p_code, p_status, p_reply); $$;
create or replace function public.claim_suggestion_notices() returns table (code text, title text, status text, reply text)
language sql security invoker set search_path = '' as $$ select * from private.claim_suggestion_notices(); $$;

revoke execute on function private.submit_suggestion(text, text), private.my_suggestions(), private.admin_suggestions(text),
  private.admin_update_suggestion(text, text, text), private.claim_suggestion_notices() from public, anon, authenticated;
grant execute on function private.submit_suggestion(text, text), private.my_suggestions(), private.admin_suggestions(text),
  private.admin_update_suggestion(text, text, text), private.claim_suggestion_notices() to authenticated;
revoke execute on function public.submit_suggestion(text, text), public.my_suggestions(), public.admin_suggestions(text),
  public.admin_update_suggestion(text, text, text), public.claim_suggestion_notices() from public, anon;
grant execute on function public.submit_suggestion(text, text), public.my_suggestions(), public.admin_suggestions(text),
  public.admin_update_suggestion(text, text, text), public.claim_suggestion_notices() to authenticated;
