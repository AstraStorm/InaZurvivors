-- «Reportar un bug»: reports from signed-in players, a private screenshot bucket and an admin panel.
-- Same model as the rest: the API roles never touch the table; every read and write goes through functions that check
-- the caller. Admins are listed by account id in private.admins (never by username, which anybody can see).

create table if not exists private.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  note text not null default '',
  created_at timestamptz not null default now()
);
alter table private.admins enable row level security;
revoke all on table private.admins from public, anon, authenticated;

create or replace function private.is_admin() returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from private.admins a where a.user_id = auth.uid())
    and not coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false);
$$;

create table if not exists public.bug_reports (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  user_id uuid not null references auth.users (id) on delete cascade,
  client_id uuid not null,
  username text,
  category text not null check (category in ('gameplay', 'interfaz', 'graficos', 'gacha', 'guardado', 'online', 'rendimiento', 'otro')),
  severity text not null check (severity in ('baja', 'media', 'alta', 'critica')),
  title text not null check (char_length(title) between 4 and 120),
  description text not null check (char_length(description) between 10 and 4000),
  steps text not null default '' check (char_length(steps) <= 4000),
  game_version text not null default '' check (char_length(game_version) <= 32),
  build text not null default '' check (char_length(build) <= 32),
  browser text not null default '' check (char_length(browser) <= 120),
  os text not null default '' check (char_length(os) <= 80),
  screen text not null default '' check (char_length(screen) <= 40),
  map text not null default '' check (char_length(map) <= 40),
  difficulty text not null default '' check (char_length(difficulty) <= 4),
  run_time_sec integer check (run_time_sec between 0 and 86400),
  screenshot_path text check (char_length(screenshot_path) <= 200),
  status text not null default 'nuevo' check (status in ('nuevo', 'revisando', 'corregido', 'descartado')),
  admin_notes text not null default '' check (char_length(admin_notes) <= 4000),
  notified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, client_id) -- the same form sent twice is one report
);
create index if not exists bug_reports_user_created on public.bug_reports (user_id, created_at desc);
create index if not exists bug_reports_created on public.bug_reports (created_at desc);
alter table public.bug_reports enable row level security;
drop policy if exists bug_reports_own_or_admin on public.bug_reports;
create policy bug_reports_own_or_admin on public.bug_reports for select to authenticated
  using (user_id = (select auth.uid()) or (select private.is_admin()));
revoke all on table public.bug_reports from anon, authenticated;

-- ---------------------------------------------------------------- screenshots: private bucket, one folder per account
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('bug-screenshots', 'bug-screenshots', false, 2097152, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists bug_shots_insert_own on storage.objects;
create policy bug_shots_insert_own on storage.objects for insert to authenticated
  with check (
    bucket_id = 'bug-screenshots'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and not coalesce(((select auth.jwt()) ->> 'is_anonymous')::boolean, false)
    -- at most 10 uploads per account per day
    and (select count(*) from storage.objects o where o.bucket_id = 'bug-screenshots' and o.owner_id = (select auth.uid())::text
         and o.created_at > now() - interval '1 day') < 10
  );
drop policy if exists bug_shots_read_own_or_admin on storage.objects;
create policy bug_shots_read_own_or_admin on storage.objects for select to authenticated
  using (bucket_id = 'bug-screenshots' and ((storage.foldername(name))[1] = (select auth.uid())::text or (select private.is_admin())));
drop policy if exists bug_shots_delete_own_or_admin on storage.objects;
create policy bug_shots_delete_own_or_admin on storage.objects for delete to authenticated
  using (bucket_id = 'bug-screenshots' and ((storage.foldername(name))[1] = (select auth.uid())::text or (select private.is_admin())));

-- ---------------------------------------------------------------- player functions
-- Sends a report; the same client_id twice returns the first code (no duplicates). Limits: one every 60 s, 10 a day.
create or replace function private.submit_bug_report(p_client_id uuid, p_category text, p_severity text, p_title text, p_description text,
  p_steps text, p_meta jsonb, p_screenshot text) returns text
language plpgsql security definer set search_path = public, extensions as $$
declare uid uuid := private.real_user(); existing text; new_code text; uname text;
begin
  select code into existing from public.bug_reports where user_id = uid and client_id = p_client_id;
  if existing is not null then return existing; end if;
  if exists (select 1 from public.bug_reports where user_id = uid and created_at > now() - interval '60 seconds') then
    raise exception 'too_fast' using errcode = '54000';
  end if;
  if (select count(*) from public.bug_reports where user_id = uid and created_at > now() - interval '1 day') >= 10 then
    raise exception 'daily_limit' using errcode = '54000';
  end if;
  if p_screenshot is not null and (
       p_screenshot !~ ('^' || uid::text || '/[A-Za-z0-9-]{8,64}\.(png|jpg|webp)$')
       or not exists (select 1 from storage.objects o where o.bucket_id = 'bug-screenshots' and o.name = p_screenshot)) then
    raise exception 'invalid_screenshot' using errcode = '22023';
  end if;
  select username::text into uname from public.profiles where id = uid;
  new_code := 'BUG-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
  insert into public.bug_reports (code, user_id, client_id, username, category, severity, title, description, steps,
    game_version, build, browser, os, screen, map, difficulty, run_time_sec, screenshot_path)
  values (new_code, uid, p_client_id, uname, p_category, p_severity, trim(p_title), trim(p_description), trim(coalesce(p_steps, '')),
    left(coalesce(p_meta ->> 'version', ''), 32), left(coalesce(p_meta ->> 'build', ''), 32), left(coalesce(p_meta ->> 'browser', ''), 120),
    left(coalesce(p_meta ->> 'os', ''), 80), left(coalesce(p_meta ->> 'screen', ''), 40), left(coalesce(p_meta ->> 'map', ''), 40),
    left(coalesce(p_meta ->> 'difficulty', ''), 4),
    case when jsonb_typeof(p_meta -> 'runTimeSec') = 'number' then least(greatest((p_meta ->> 'runTimeSec')::numeric, 0), 86400)::integer end,
    p_screenshot);
  return new_code;
end $$;

-- the caller's own reports (no private notes)
create or replace function private.my_bug_reports() returns table (code text, category text, severity text, title text, status text, created_at timestamptz, has_screenshot boolean)
language sql stable security definer set search_path = public as $$
  select b.code, b.category, b.severity, b.title, b.status, b.created_at, b.screenshot_path is not null
  from public.bug_reports b where b.user_id = auth.uid() order by b.created_at desc limit 50;
$$;

-- deletes the caller's reports; returns the screenshot paths so the game removes the files through the Storage API
create or replace function private.delete_my_bug_reports() returns setof text
language plpgsql security definer set search_path = public as $$
declare uid uuid := private.real_user();
begin
  return query delete from public.bug_reports b where b.user_id = uid returning b.screenshot_path;
end $$;

-- the Edge Function claims a report once to send its notice (an owner can't trigger it twice)
create or replace function private.claim_bug_notification(p_code text) returns table (code text, category text, severity text, title text, description text, username text, game_version text, created_at timestamptz)
language sql security definer set search_path = public as $$
  update public.bug_reports b set notified_at = now()
  where b.code = p_code and b.user_id = auth.uid() and b.notified_at is null
  returning b.code, b.category, b.severity, b.title, b.description, b.username, b.game_version, b.created_at;
$$;

create or replace function private.am_i_admin() returns boolean language sql stable security definer set search_path = '' as $$
  select private.is_admin();
$$;

-- ---------------------------------------------------------------- admin functions (refuse anyone not in private.admins)
create or replace function private.admin_bug_reports(p_category text, p_severity text, p_status text, p_from timestamptz, p_to timestamptz, p_order text, p_limit integer)
returns setof public.bug_reports language plpgsql stable security definer set search_path = public as $$
begin
  if not private.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  return query select * from public.bug_reports b
    where (p_category is null or b.category = p_category) and (p_severity is null or b.severity = p_severity)
      and (p_status is null or b.status = p_status) and (p_from is null or b.created_at >= p_from) and (p_to is null or b.created_at < p_to)
    order by case when p_order = 'prioridad' then array_position(array['critica', 'alta', 'media', 'baja'], b.severity) end nulls last,
             b.created_at desc
    limit least(greatest(coalesce(p_limit, 100), 1), 500);
end $$;

create or replace function private.admin_update_bug(p_code text, p_status text, p_notes text) returns timestamptz
language plpgsql security definer set search_path = public as $$
declare t timestamptz;
begin
  if not private.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  update public.bug_reports set status = coalesce(p_status, status), admin_notes = coalesce(p_notes, admin_notes), updated_at = now()
  where code = p_code returning updated_at into t;
  if t is null then raise exception 'not_found' using errcode = 'P0002'; end if;
  return t;
end $$;

-- ---------------------------------------------------------------- public API: invoker wrappers
create or replace function public.submit_bug_report(p_client_id uuid, p_category text, p_severity text, p_title text, p_description text,
  p_steps text default '', p_meta jsonb default '{}', p_screenshot text default null) returns text
language sql security invoker set search_path = '' as $$
  select private.submit_bug_report(p_client_id, p_category, p_severity, p_title, p_description, p_steps, p_meta, p_screenshot);
$$;
create or replace function public.my_bug_reports() returns table (code text, category text, severity text, title text, status text, created_at timestamptz, has_screenshot boolean)
language sql stable security invoker set search_path = '' as $$ select * from private.my_bug_reports(); $$;
create or replace function public.delete_my_bug_reports() returns setof text language sql security invoker set search_path = '' as $$ select * from private.delete_my_bug_reports(); $$;
create or replace function public.claim_bug_notification(p_code text) returns table (code text, category text, severity text, title text, description text, username text, game_version text, created_at timestamptz)
language sql security invoker set search_path = '' as $$ select * from private.claim_bug_notification(p_code); $$;
create or replace function public.am_i_admin() returns boolean language sql stable security invoker set search_path = '' as $$ select private.am_i_admin(); $$;
create or replace function public.admin_bug_reports(p_category text default null, p_severity text default null, p_status text default null,
  p_from timestamptz default null, p_to timestamptz default null, p_order text default 'fecha', p_limit integer default 100)
returns setof public.bug_reports language sql stable security invoker set search_path = '' as $$
  select * from private.admin_bug_reports(p_category, p_severity, p_status, p_from, p_to, p_order, p_limit);
$$;
create or replace function public.admin_update_bug(p_code text, p_status text default null, p_notes text default null) returns timestamptz
language sql security invoker set search_path = '' as $$ select private.admin_update_bug(p_code, p_status, p_notes); $$;

revoke execute on function private.is_admin(), private.submit_bug_report(uuid, text, text, text, text, text, jsonb, text), private.my_bug_reports(),
  private.delete_my_bug_reports(), private.claim_bug_notification(text), private.am_i_admin(),
  private.admin_bug_reports(text, text, text, timestamptz, timestamptz, text, integer), private.admin_update_bug(text, text, text),
  public.submit_bug_report(uuid, text, text, text, text, text, jsonb, text), public.my_bug_reports(), public.delete_my_bug_reports(),
  public.claim_bug_notification(text), public.am_i_admin(), public.admin_bug_reports(text, text, text, timestamptz, timestamptz, text, integer),
  public.admin_update_bug(text, text, text) from public, anon, authenticated;
-- is_admin() is used inside policies, so the signed-in role may run it (it only ever answers about the caller)
grant execute on function private.is_admin(), private.submit_bug_report(uuid, text, text, text, text, text, jsonb, text), private.my_bug_reports(),
  private.delete_my_bug_reports(), private.claim_bug_notification(text), private.am_i_admin(),
  private.admin_bug_reports(text, text, text, timestamptz, timestamptz, text, integer), private.admin_update_bug(text, text, text),
  public.submit_bug_report(uuid, text, text, text, text, text, jsonb, text), public.my_bug_reports(), public.delete_my_bug_reports(),
  public.claim_bug_notification(text), public.am_i_admin(), public.admin_bug_reports(text, text, text, timestamptz, timestamptz, text, integer),
  public.admin_update_bug(text, text, text) to authenticated;
