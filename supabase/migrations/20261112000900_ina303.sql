-- 2.3 (author): code INA303 for content creators. Their own banner and frame (creador, marco-creador), 1.500 fichas de
-- evento (the collab banners), 3.000 fichas, 300.000 coins, 9 Fichas EG, the Llave dorada of the season pass
-- (rewards.gold_key, answered as reward.goldKey; the client opens the premium row of the season open now) and one copy
-- of each footballer of the Banner de agradecimiento (rewards.players, answered as reward.players: Axel Blaze
-- Encapuchado, Mikasa, Eren, Armin, Escanor, Meliodas, Ban). Tokens and coins go into promo_redemptions.result as
-- always, so economy_cap lets them through. Same function as 20261110000300_eg_code.sql otherwise.

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
  if c.rewards ? 'eg_tokens' then res := res || jsonb_build_object('egTokens', (c.rewards ->> 'eg_tokens')::integer); end if;
  if c.rewards ? 'pennants' then res := res || jsonb_build_object('pennants', c.rewards -> 'pennants'); end if;
  if c.rewards ? 'players' then res := res || jsonb_build_object('players', c.rewards -> 'players'); end if;
  if coalesce((c.rewards ->> 'gold_key')::boolean, false) then res := res || jsonb_build_object('goldKey', true); end if;
  insert into private.promo_redemptions (user_id, code, result) values (uid, c.code, res) on conflict do nothing;
  get diagnostics inserted = row_count;
  if inserted = 0 then return jsonb_build_object('status', 'used'); end if;
  return jsonb_build_object('status', 'ok', 'reward', res);
end $$;

revoke execute on function private.redeem_code(text, boolean) from public, anon, authenticated;
grant execute on function private.redeem_code(text, boolean) to authenticated;

insert into private.promo_codes (code, rewards) values ('INA303', jsonb_build_object(
  'tokens', 3000, 'coins', 300000, 'event_tokens', 1500, 'eg_tokens', 9, 'gold_key', true,
  'players', jsonb_build_array(1085, 900003, 900002, 900004, 900007, 900006, 900008),
  'pennants', jsonb_build_array('creador', 'marco-creador')))
on conflict (code) do update set rewards = excluded.rewards, active = true;
