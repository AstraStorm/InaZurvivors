-- (author) the Sector Quinto opens with the 2.2 on Thursday 12 November at 12:00 (was 13 November); the weeks still end on Thursdays at 12:00
create or replace function private.sector_start() returns timestamptz language sql immutable as $$ select '2026-11-12 12:00+01'::timestamptz $$;
