-- 1.85 (author): bug bounty. When the admin marks a report «corregido» (admin_update_bug), its reporter earns 100 fichas,
-- once per report (marking it again, or going back and forth, never pays twice; admins' own reports pay nothing). The
-- reward waits in private.bug_rewards until the reporter's game claims it (claim_bug_rewards), which adds the fichas and
-- shows a notice. economy_cap counts the rewards claimed since the last write, like promo codes, so a save never cuts them.

create table if not exists private.bug_rewards (
  report_id uuid primary key references public.bug_reports (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  code text not null,
  title text not null,
  tokens integer not null default 100 check (tokens between 0 and 1000),
  created_at timestamptz not null default now(),
  claimed_at timestamptz
);
create index if not exists bug_rewards_user_pending on private.bug_rewards (user_id) where claimed_at is null;
revoke all on private.bug_rewards from public, anon, authenticated;

-- admin_update_bug as before (20261101000000_bug_reports.sql), plus the reward when the status becomes «corregido»
create or replace function private.admin_update_bug(p_code text, p_status text, p_notes text) returns timestamptz
language plpgsql security definer set search_path = public as $$
declare t timestamptz; r record;
begin
  if not private.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  update public.bug_reports set status = coalesce(p_status, status), admin_notes = coalesce(p_notes, admin_notes), updated_at = now()
  where code = p_code returning updated_at, id, user_id, code, title, status into r;
  if r.updated_at is null then raise exception 'not_found' using errcode = 'P0002'; end if;
  t := r.updated_at;
  if r.status = 'corregido' and not exists (select 1 from private.admins a where a.user_id = r.user_id) then
    insert into private.bug_rewards (report_id, user_id, code, title, tokens) values (r.id, r.user_id, r.code, r.title, 100)
    on conflict (report_id) do nothing;
  end if;
  return t;
end $$;

-- the reporter's game takes its pending rewards (once: they are marked as claimed in the same statement)
create or replace function private.claim_bug_rewards() returns table (code text, title text, tokens integer)
language sql security definer set search_path = '' as $$
  update private.bug_rewards b set claimed_at = now()
  where b.user_id = private.real_user() and b.claimed_at is null
  returning b.code, b.title, b.tokens;
$$;
revoke execute on function private.claim_bug_rewards() from public, anon, authenticated;
grant execute on function private.claim_bug_rewards() to authenticated;
create or replace function public.claim_bug_rewards() returns table (code text, title text, tokens integer)
language sql security invoker set search_path = '' as $$ select * from private.claim_bug_rewards(); $$;
revoke execute on function public.claim_bug_rewards() from public, anon;
grant execute on function public.claim_bug_rewards() to authenticated;

-- economy_cap as in 20261102000200_save_economy_guard.sql, plus the bug rewards claimed since the last write
create or replace function private.economy_cap(p_new jsonb, p_old jsonb, p_since timestamptz, p_uid uuid) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  hours numeric := greatest(0, extract(epoch from (now() - coalesce(p_since, now()))) / 3600);
  promo_t numeric := 0; promo_c numeric := 0; bug_t numeric := 0;
  old_t numeric; old_c numeric; new_t numeric; new_c numeric; max_t numeric; max_c numeric;
  out jsonb := p_new;
begin
  if to_regclass('private.promo_redemptions') is not null then
    execute 'select coalesce(sum((r.result ->> ''tokens'')::numeric), 0), coalesce(sum((r.result ->> ''coins'')::numeric), 0)
      from private.promo_redemptions r where r.user_id = $1 and r.created_at > coalesce($2, ''-infinity''::timestamptz)'
      into promo_t, promo_c using p_uid, p_since;
  end if;
  select coalesce(sum(b.tokens), 0) into bug_t from private.bug_rewards b
    where b.user_id = p_uid and b.claimed_at is not null and b.claimed_at > coalesce(p_since, '-infinity'::timestamptz);
  promo_t := promo_t + bug_t;
  new_t := case when jsonb_typeof(p_new -> 'tokens') = 'number' then (p_new ->> 'tokens')::numeric else 0 end;
  new_c := case when jsonb_typeof(p_new -> 'coins') = 'number' then (p_new ->> 'coins')::numeric else 0 end;
  if p_old is null then
    max_t := 5000 + promo_t; max_c := 60000 + promo_c;
  else
    old_t := case when jsonb_typeof(p_old -> 'tokens') = 'number' then greatest(0, (p_old ->> 'tokens')::numeric) else 0 end;
    old_c := case when jsonb_typeof(p_old -> 'coins') = 'number' then greatest(0, (p_old ->> 'coins')::numeric) else 0 end;
    max_t := old_t + 2000 + 1000 * hours + promo_t;
    max_c := old_c + 8000 + 8000 * hours + promo_c;
  end if;
  if new_t > max_t then out := jsonb_set(out, '{tokens}', to_jsonb(floor(max_t)::bigint)); end if;
  if new_c > max_c then out := jsonb_set(out, '{coins}', to_jsonb(floor(max_c)::bigint)); end if;
  return out;
end $$;
revoke all on function private.economy_cap(jsonb, jsonb, timestamptz, uuid) from public, anon, authenticated;
