-- 2.11 (author): the Temporada 1 opens at 12:00 Madrid instead of 15:00, with the scheduled deploy (seasonPass.ts SEASONS
-- has the same date); it still ends on 12 December at 15:00. The BlueLock collab keeps its 15:00.
update private.seasons set starts_at = '2026-11-12 12:00+01' where id = 'T1';
