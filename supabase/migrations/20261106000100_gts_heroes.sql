-- 1.8 (author): a footballer the player ascended to HÉROE can leave spare copies in the GTS (the copy travels clean,
-- the HÉROE stays). Only Leyenda and limited-event footballers stay banned (private.gts_banned). No footballer is a
-- HÉROE by nature today; if one is added, put its id in private.gts_banned.

create or replace function private.gts_deposit(p_give integer, p_want integer) returns bigint
language plpgsql security definer set search_path = '' as $$
declare uid uuid := private.real_user(); sv jsonb; slots integer; open_n integer; new_id bigint;
begin
  if p_give is null or p_want is null or p_give = p_want or p_give <= 0 or p_want <= 0 then raise exception 'gts_invalid' using errcode = 'P0001'; end if;
  perform pg_advisory_xact_lock(hashtext('gts:' || uid::text));
  select data into sv from public.saves where user_id = uid;
  if sv is null then raise exception 'gts_no_save' using errcode = 'P0001'; end if;
  if exists (select 1 from private.gts_banned where player_id in (p_give, p_want)) then raise exception 'gts_banned' using errcode = 'P0001'; end if;
  slots := least(5, 1 + greatest(0, coalesce((sv->'upgrades'->>'gts')::integer, 0)));
  select count(*) into open_n from private.gts_deposits where user_id = uid and status = 'open';
  if open_n >= slots then raise exception 'gts_slots' using errcode = 'P0001'; end if;
  if exists (select 1 from private.gts_deposits where user_id = uid and status = 'open' and give_id = p_give and want_id = p_want)
     or exists (select 1 from private.gts_done where user_id = uid and give_id = p_give and want_id = p_want) then
    raise exception 'gts_repeated' using errcode = 'P0001'; end if;
  if private.gts_spare(uid, p_give) < 1 then raise exception 'gts_no_spare' using errcode = 'P0001'; end if;
  insert into private.gts_deposits (user_id, give_id, want_id) values (uid, p_give, p_want) returning id into new_id;
  return new_id;
end $$;

create or replace function private.gts_take(p_id bigint) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare uid uuid := private.real_user(); d record;
begin
  perform pg_advisory_xact_lock(hashtext('gts:' || uid::text));
  select * into d from private.gts_deposits where id = p_id for update;
  if not found or d.status <> 'open' then raise exception 'gts_gone' using errcode = 'P0001'; end if;
  if d.user_id = uid then raise exception 'gts_own' using errcode = 'P0001'; end if;
  if exists (select 1 from private.gts_done where user_id = uid and give_id = d.want_id and want_id = d.give_id) then
    raise exception 'gts_repeated' using errcode = 'P0001'; end if;
  if private.gts_spare(uid, d.want_id) < 1 then raise exception 'gts_no_spare' using errcode = 'P0001'; end if;
  update private.gts_deposits set status = 'traded', taker_id = uid, closed_at = now() where id = p_id;
  insert into private.gts_done (user_id, give_id, want_id) values (d.user_id, d.give_id, d.want_id), (uid, d.want_id, d.give_id) on conflict do nothing;
  return jsonb_build_object('id', d.id, 'give', d.want_id, 'get', d.give_id);
end $$;
