-- Fix 1.32: a request can no longer wedge the database. On 2026-11-02 at 23:31 a cloud save got stuck in an open
-- (aborted) transaction while holding its row lock; every later request waited for that lock with no limit, the
-- connection pool filled up and everything else (rankings included) timed out with 504 «PGRST003».
--   * lock_timeout: a request waits at most 3 s for a lock, then fails (the game retries the save later).
--   * statement_timeout: no API call runs longer than 8 s.
--   * idle_in_transaction_session_timeout: a transaction left open and idle is closed after 10 s, releasing its locks.
-- PostgREST applies the settings of the role it switches to (anon / authenticated) on every request.

alter role authenticated set lock_timeout = '3s';
alter role authenticated set statement_timeout = '8s';
alter role authenticated set idle_in_transaction_session_timeout = '10s';
alter role anon set lock_timeout = '3s';
alter role anon set statement_timeout = '8s';
alter role anon set idle_in_transaction_session_timeout = '10s';

-- the save itself: never queue behind another save of the same player; a second one at the same time just fails
alter function private.put_save(jsonb, integer) set lock_timeout = '3s';
alter function private.submit_score(uuid, text, text, integer, bigint, integer) set lock_timeout = '3s';

notify pgrst, 'reload config';
