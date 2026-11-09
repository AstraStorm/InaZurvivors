-- 2.1 (author: «añade 3 mapas nuevos»): three arenas after the ruins, steps 16-18 of the path. The ranking's arena
-- multiplier learns them (+5% per step: ×1.75, ×1.8, ×1.85); same table as MAP_TIER in src/systems/leaderboard.ts.
create or replace function private.map_mult(p_map text) returns numeric
language sql immutable set search_path = '' as $$
  select 1 + (coalesce(case p_map
    when 'raimon' then 1 when 'ribera' then 2 when 'royal' then 3 when 'nara' then 4 when 'zeus' then 5
    when 'alpino' then 6 when 'nevada' then 7 when 'claustro' then 8 when 'naniwa' then 9 when 'yokato' then 10
    when 'marytimes' then 11 when 'fuji' then 12 when 'ehime' then 13 when 'alius' then 14 when 'ruinas' then 15
    when 'barrio' then 16 when 'plazanieve' then 17 when 'torre' then 18 end, 1) - 1) * 0.05;
$$;
