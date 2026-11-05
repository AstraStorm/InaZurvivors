-- 1.81 (author): code INA483. 5 ×10 of the Banner de agradecimiento (750 fichas de evento), 5 normal ×10 (500 fichas),
-- 20.000 coins, one footballer Legendario or higher for sure (Legendario 80 / Mítico 17 / Leyenda 3, from rewards.rarity_pools,
-- event-only footballers left out) and its own banner and frame (rewards.pennants, answered as reward.pennants; the
-- client only lists them for whoever owns them). redeem_code learns rarity_pools/rarity_odds and pennants; codes
-- without them (ASTRA17, GRACIAS) answer exactly as before. Same function as 20261105000100_thanks_code.sql otherwise.

create or replace function private.redeem_code(p_code text, p_already_applied boolean) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare uid uuid := private.real_user(); c record; pool jsonb; pick integer; res jsonb; inserted integer;
  odds jsonb; total numeric; x numeric; r text;
begin
  select * into c from private.promo_codes where code = upper(trim(p_code)) and active;
  if not found then return jsonb_build_object('status', 'invalid'); end if;
  if p_already_applied then
    insert into private.promo_redemptions (user_id, code, result) values (uid, c.code, jsonb_build_object('guest', true))
    on conflict do nothing;
    get diagnostics inserted = row_count;
    return jsonb_build_object('status', case when inserted = 1 then 'linked' else 'used' end);
  end if;
  pool := c.rewards -> 'legendary_pool';
  odds := c.rewards -> 'rarity_odds';
  if odds is not null then
    -- rarity first by its weight (only rarities with footballers), then one of that rarity
    select sum((value)::numeric) into total from jsonb_each_text(odds) e
      where jsonb_array_length(coalesce(c.rewards -> 'rarity_pools' -> e.key, '[]')) > 0;
    x := random() * coalesce(total, 0);
    for r in select e.key from jsonb_each_text(odds) e
      where jsonb_array_length(coalesce(c.rewards -> 'rarity_pools' -> e.key, '[]')) > 0 order by (e.value)::numeric desc loop
      pool := c.rewards -> 'rarity_pools' -> r;
      x := x - (odds ->> r)::numeric;
      exit when x < 0;
    end loop;
  end if;
  pick := case when jsonb_array_length(coalesce(pool, '[]')) > 0 then (pool ->> floor(random() * jsonb_array_length(pool))::integer)::integer end;
  res := jsonb_build_object('tokens', coalesce((c.rewards ->> 'tokens')::integer, 0), 'coins', coalesce((c.rewards ->> 'coins')::integer, 0), 'player', pick,
    'eventTokens', coalesce((c.rewards ->> 'event_tokens')::integer, 0));
  if c.rewards ? 'pennants' then res := res || jsonb_build_object('pennants', c.rewards -> 'pennants'); end if;
  insert into private.promo_redemptions (user_id, code, result) values (uid, c.code, res) on conflict do nothing;
  get diagnostics inserted = row_count;
  if inserted = 0 then return jsonb_build_object('status', 'used'); end if;
  return jsonb_build_object('status', 'ok', 'reward', res);
end $$;

revoke execute on function private.redeem_code(text, boolean) from public, anon, authenticated;
grant execute on function private.redeem_code(text, boolean) to authenticated;

insert into private.promo_codes (code, rewards) values ('INA483', jsonb_build_object(
  'tokens', 500, 'coins', 20000, 'event_tokens', 750,
  'rarity_odds', jsonb_build_object('legendario', 80, 'mitico', 17, 'leyenda', 3),
  'rarity_pools', '{"legendario":[1541,1567,1532,29,10,1542,1513,1384,2,3,1589,1,1548,1024,1370,1371,1405,1382,101855,101791,101838,101871,101775,100248,100405,100468,100562,101722,101308,102015,101719,100293,100844,100538,100544,100580,100728,101504,102117,102185,101558,100494,100510,100907,102205,102307,100487,100540,100717,100382,101488,101572,101505,100438,100739,100577,101710,100797,100519,100905,102130,100979,101437],"mitico":[157,1406,101894,102014,102025,100475,100944,100303,100427,100426,100242,100635,101416,101527,101345,100602,100609,100615,100638,102346,101004,100516,101626,100805,101520,100398,102454,100335,101652,100524,100604,100568,100238,100723,100597,100288,100600,100725,100332,100598,100603,100982,101321,102050,100989,100952,100759],"leyenda":[100773,100234]}'::jsonb,
  'pennants', jsonb_build_array('inazuma', 'marco-inazuma')))
on conflict (code) do nothing;
