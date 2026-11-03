-- 1.7 outage fix: put_save raised version_conflict / progress_reset with SQLSTATE 40001 (serialization_failure).
-- PostgREST retries 40001 on its own, so a save with a stale version looped inside the API forever, each one holding a
-- pool connection: with a handful of such clients the pool was full and the ranking timed out (504) for everyone.
-- Same body as 20261102000200_save_economy_guard.sql; only the error code changes to P0001 (plain raise_exception,
-- HTTP 400, never retried). The game reads the message text (version_conflict, progress_reset), not the code.
create or replace function private.put_save(p_data jsonb, p_expected integer)
 returns integer
 language plpgsql
 security definer
 set search_path to 'public', 'extensions'
 set lock_timeout to '3s'
as $function$
declare uid uuid := private.real_user(); v integer; cur_epoch integer; old_data jsonb; old_at timestamptz;
begin
  if octet_length(p_data::text) > 2000000 then raise exception 'save_too_large' using errcode = '54000'; end if;
  if exists (select 1 from public.saves s where s.user_id = uid and s.updated_at > now() - interval '2 seconds') then
    raise exception 'too_fast' using errcode = '54000';
  end if;
  select s.data, s.updated_at, private.save_epoch(s.data) into old_data, old_at, cur_epoch from public.saves s where s.user_id = uid;
  if cur_epoch is not null and private.save_epoch(p_data) < cur_epoch then
    raise exception 'progress_reset' using errcode = 'P0001';
  end if;
  p_data := private.economy_cap(p_data, old_data, old_at, uid);
  insert into public.saves (user_id, data, version) values (uid, p_data, 1)
  on conflict (user_id) do update set data = excluded.data, version = public.saves.version + 1, updated_at = now()
    where public.saves.version = p_expected
  returning version into v;
  if v is null then raise exception 'version_conflict' using errcode = 'P0001'; end if;
  return v;
end $function$;
