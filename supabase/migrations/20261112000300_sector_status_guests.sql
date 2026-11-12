-- 2.2: sector_status for everyone. private.real_user() raises for callers without an account, so guests (and the
-- signed-out menu) got an error instead of the sides, their sizes and the week's standing. Now they get the public view
-- (no side, no own points); everything else is as in sector_quinto.
create or replace function private.sector_status() returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare uid uuid; w integer := private.sector_week(now()); n_s integer; n_r integer; m integer; mine text;
  a_s numeric := 0; a_r numeric := 0; c_s integer := 0; c_r integer := 0; my_pts bigint := 0;
begin
  begin uid := private.real_user(); exception when others then uid := null; end;
  perform private.sector_close_due();
  select count(*) filter (where side = 'sector'), count(*) filter (where side = 'resistencia') into n_s, n_r from private.sector_members;
  m := private.sector_margin(n_s + n_r);
  if uid is not null then select side into mine from private.sector_members where user_id = uid; end if;
  if w is not null then
    select coalesce(avg(p.points) filter (where s.side = 'sector'), 0), coalesce(avg(p.points) filter (where s.side = 'resistencia'), 0),
           count(*) filter (where s.side = 'sector'), count(*) filter (where s.side = 'resistencia')
      into a_s, a_r, c_s, c_r
      from private.sector_points p join private.sector_members s on s.user_id = p.user_id where p.week = w and p.points > 0;
    if uid is not null then select coalesce(points, 0) into my_pts from private.sector_points where user_id = uid and week = w; end if;
  end if;
  return jsonb_build_object(
    'start', private.sector_start(), 'end', private.sector_end(), 'week', w, 'weekEnd', case when w is null then null else private.sector_week_end(w) end,
    'side', mine, 'members', jsonb_build_object('sector', n_s, 'resistencia', n_r),
    'canJoin', jsonb_build_object('sector', n_s - n_r < m, 'resistencia', n_r - n_s < m),
    'avg', jsonb_build_object('sector', round(a_s), 'resistencia', round(a_r)),
    'active', jsonb_build_object('sector', c_s, 'resistencia', c_r),
    'myPoints', coalesce(my_pts, 0),
    'results', coalesce((select jsonb_agg(jsonb_build_object('week', r.week, 'winner', r.winner, 'sector', r.avg_sector, 'resistencia', r.avg_resistencia) order by r.week)
      from private.sector_results r), '[]'::jsonb));
end $$;
alter function private.sector_status() set statement_timeout = '5s';

notify pgrst, 'reload schema';
