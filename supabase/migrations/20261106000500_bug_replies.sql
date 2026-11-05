-- 1.88 (author): the bug panel can answer the reporter. A reply (bug_reports.reply, separate from the private
-- admin_notes) or a status change to «corregido» or «descartado» leaves a notice for the reporter (notice_pending); their
-- game takes it with claim_bug_notices when the menu opens and shows it. my_bug_reports also returns the reply.
-- admin_update_bug gets a 4th argument (p_reply); the 3-argument version is dropped so the API call is unambiguous.

alter table public.bug_reports add column if not exists reply text not null default '' check (char_length(reply) <= 2000);
alter table public.bug_reports add column if not exists notice_pending boolean not null default false;

drop function if exists public.admin_update_bug(text, text, text);
drop function if exists private.admin_update_bug(text, text, text);

create or replace function private.admin_update_bug(p_code text, p_status text, p_notes text, p_reply text) returns timestamptz
language plpgsql security definer set search_path = public as $$
declare t timestamptz; r record; old record;
begin
  if not private.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  select status, reply into old from public.bug_reports where code = p_code;
  update public.bug_reports set status = coalesce(p_status, status), admin_notes = coalesce(p_notes, admin_notes),
    reply = coalesce(left(p_reply, 2000), reply), updated_at = now()
  where code = p_code returning updated_at, id, user_id, code, title, status, reply into r;
  if r.updated_at is null then raise exception 'not_found' using errcode = 'P0002'; end if;
  t := r.updated_at;
  -- the reporter is told when there is a new reply, or when the report is fixed or discarded
  if (r.reply <> '' and r.reply is distinct from old.reply)
     or (r.status is distinct from old.status and r.status in ('corregido', 'descartado')) then
    update public.bug_reports set notice_pending = true where id = r.id;
  end if;
  -- 1.85: the bug bounty (100 fichas once per report, never for admins)
  if r.status = 'corregido' and not exists (select 1 from private.admins a where a.user_id = r.user_id) then
    insert into private.bug_rewards (report_id, user_id, code, title, tokens) values (r.id, r.user_id, r.code, r.title, 100)
    on conflict (report_id) do nothing;
  end if;
  return t;
end $$;
create or replace function public.admin_update_bug(p_code text, p_status text default null, p_notes text default null, p_reply text default null) returns timestamptz
language sql security invoker set search_path = '' as $$ select private.admin_update_bug(p_code, p_status, p_notes, p_reply); $$;
revoke execute on function private.admin_update_bug(text, text, text, text) from public, anon, authenticated;
grant execute on function private.admin_update_bug(text, text, text, text) to authenticated;
revoke execute on function public.admin_update_bug(text, text, text, text) from public, anon;
grant execute on function public.admin_update_bug(text, text, text, text) to authenticated;

-- the reporter's notices, taken once
create or replace function private.claim_bug_notices() returns table (code text, title text, status text, reply text)
language sql security definer set search_path = '' as $$
  update public.bug_reports b set notice_pending = false
  where b.user_id = private.real_user() and b.notice_pending
  returning b.code, b.title, b.status, b.reply;
$$;
revoke execute on function private.claim_bug_notices() from public, anon, authenticated;
grant execute on function private.claim_bug_notices() to authenticated;
create or replace function public.claim_bug_notices() returns table (code text, title text, status text, reply text)
language sql security invoker set search_path = '' as $$ select * from private.claim_bug_notices(); $$;
revoke execute on function public.claim_bug_notices() from public, anon;
grant execute on function public.claim_bug_notices() to authenticated;

-- my_bug_reports with the reply (its row type changes, so it is dropped first)
drop function if exists public.my_bug_reports();
drop function if exists private.my_bug_reports();
create function private.my_bug_reports() returns table (code text, category text, severity text, title text, status text, created_at timestamptz, has_screenshot boolean, reply text)
language sql stable security definer set search_path = '' as $$
  select b.code, b.category, b.severity, b.title, b.status, b.created_at, b.screenshot_path is not null, b.reply
  from public.bug_reports b where b.user_id = auth.uid() order by b.created_at desc limit 50;
$$;
revoke execute on function private.my_bug_reports() from public, anon, authenticated;
grant execute on function private.my_bug_reports() to authenticated;
create function public.my_bug_reports() returns table (code text, category text, severity text, title text, status text, created_at timestamptz, has_screenshot boolean, reply text)
language sql stable security invoker set search_path = '' as $$ select * from private.my_bug_reports(); $$;
revoke execute on function public.my_bug_reports() from public, anon;
grant execute on function public.my_bug_reports() to authenticated;
