-- Fix 1.11: server clock for the daily shop and the weekly pass. Read-only, no table access; callable by anon so guests
-- with a connection also rotate on the server's day. The browser can't read the Date header (CORS), hence the RPC.
create or replace function public.server_now()
returns timestamptz
language sql
stable
set search_path = ''
as $$ select now() $$;

revoke all on function public.server_now() from public;
grant execute on function public.server_now() to anon, authenticated;
