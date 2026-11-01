-- «Reiniciar progreso»: the account, its Google identity and its global name stay; the game progress starts again.
-- Every reset first copies the old save and ranking marks to private.progress_backups (not reachable from the API), so
-- the author can restore them by hand. The save JSON carries `progressEpoch`: a reset raises it, and put_save refuses
-- any copy from an older epoch, so an old browser can never write the pre-reset progress back over the new one.

create table if not exists private.progress_backups (
  id bigint generated always as identity primary key,
  user_id uuid not null,
  username text not null,
  save_data jsonb,
  save_version integer,
  scores jsonb not null default '[]',
  reason text not null,
  created_at timestamptz not null default now()
);
create index if not exists progress_backups_user on private.progress_backups (user_id, created_at desc);
alter table private.progress_backups enable row level security; -- no policies: only the owner (postgres) reads it
revoke all on table private.progress_backups from public, anon, authenticated;

-- the epoch of a save JSON (0 before any reset)
create or replace function private.save_epoch(p jsonb) returns integer language sql immutable set search_path = '' as $$
  select case when jsonb_typeof(p -> 'progressEpoch') = 'number' then (p ->> 'progressEpoch')::integer else 0 end;
$$;

-- put_save, same as before plus the epoch rule (raised as 'progress_reset' so the game reloads the new progress)
create or replace function private.put_save(p_data jsonb, p_expected integer) returns integer
language plpgsql security definer set search_path = public, extensions as $$
declare uid uuid := private.real_user(); v integer; cur_epoch integer;
begin
  if octet_length(p_data::text) > 2000000 then raise exception 'save_too_large' using errcode = '54000'; end if;
  if exists (select 1 from public.saves s where s.user_id = uid and s.updated_at > now() - interval '2 seconds') then
    raise exception 'too_fast' using errcode = '54000';
  end if;
  select private.save_epoch(s.data) into cur_epoch from public.saves s where s.user_id = uid;
  if cur_epoch is not null and private.save_epoch(p_data) < cur_epoch then
    raise exception 'progress_reset' using errcode = '40001';
  end if;
  insert into public.saves (user_id, data, version) values (uid, p_data, 1)
  on conflict (user_id) do update set data = excluded.data, version = public.saves.version + 1, updated_at = now()
    where public.saves.version = p_expected
  returning version into v;
  if v is null then raise exception 'version_conflict' using errcode = '40001'; end if;
  return v;
end $$;

-- Starts the caller's progress again: backup, new save (epoch + 1, version + 1), the caller's ranking marks removed.
-- p_data is the fresh save the game built; the account, profile and username are not touched.
create or replace function private.reset_my_progress(p_data jsonb) returns table (version integer, epoch integer)
language plpgsql security definer set search_path = public, extensions as $$
declare uid uuid := private.real_user(); name text; old public.saves; new_epoch integer; new_version integer;
begin
  select p.username::text into name from public.profiles p where p.id = uid;
  if name is null then raise exception 'no_username' using errcode = '42501'; end if;
  if octet_length(p_data::text) > 2000000 then raise exception 'save_too_large' using errcode = '54000'; end if;
  if exists (select 1 from private.progress_backups b where b.user_id = uid and b.reason = 'reset' and b.created_at > now() - interval '30 seconds') then
    raise exception 'too_fast' using errcode = '54000';
  end if;
  select * into old from public.saves s where s.user_id = uid for update;
  insert into private.progress_backups (user_id, username, save_data, save_version, scores, reason)
  values (uid, name, old.data, old.version,
          coalesce((select jsonb_agg(to_jsonb(sc) - 'user_id') from public.scores sc where sc.user_id = uid), '[]'), 'reset');
  new_epoch := coalesce(private.save_epoch(old.data), 0) + 1;
  insert into public.saves as s (user_id, data, version) values (uid, jsonb_set(p_data, '{progressEpoch}', to_jsonb(new_epoch)), 1)
  on conflict (user_id) do update set data = excluded.data, version = s.version + 1, updated_at = now()
  returning s.version into new_version;
  delete from public.scores where user_id = uid;
  delete from public.submitted_runs where user_id = uid;
  return query select new_version, new_epoch;
end $$;

create or replace function public.reset_my_progress(p_data jsonb) returns table (version integer, epoch integer)
language sql security invoker set search_path = '' as $$
  select * from private.reset_my_progress(p_data);
$$;

revoke execute on function private.save_epoch(jsonb), private.reset_my_progress(jsonb), public.reset_my_progress(jsonb) from public, anon, authenticated;
grant execute on function private.reset_my_progress(jsonb), public.reset_my_progress(jsonb) to authenticated;
