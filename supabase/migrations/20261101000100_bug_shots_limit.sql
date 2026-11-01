-- The upload limit counted storage.objects from inside a policy on storage.objects, which Postgres rejects as a recursive
-- policy (Storage answered 503 on every upload). The count now lives in a private function that doesn't go through RLS.
create or replace function private.shots_today() returns bigint language sql stable security definer set search_path = '' as $$
  select count(*) from storage.objects o
  where o.bucket_id = 'bug-screenshots' and o.owner_id = (select auth.uid())::text and o.created_at > now() - interval '1 day';
$$;
revoke execute on function private.shots_today() from public, anon, authenticated;
grant execute on function private.shots_today() to authenticated;

drop policy if exists bug_shots_insert_own on storage.objects;
create policy bug_shots_insert_own on storage.objects for insert to authenticated
  with check (
    bucket_id = 'bug-screenshots'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and not coalesce(((select auth.jwt()) ->> 'is_anonymous')::boolean, false)
    and (select private.shots_today()) < 10 -- at most 10 uploads per account per day
  );
