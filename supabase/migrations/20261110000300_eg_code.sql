-- 2.0 (author): code EGU3RR3R0 (typed EGu3rr3r0; codes are upper-cased) gives 3 Fichas EG, once per account.
-- redeem_code learns rewards.eg_tokens (answered as reward.egTokens); codes without it answer exactly as before.
-- Same function as 20261106000200_ina483.sql otherwise.

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
  insert into private.promo_redemptions (user_id, code, result) values (uid, c.code, res) on conflict do nothing;
  get diagnostics inserted = row_count;
  if inserted = 0 then return jsonb_build_object('status', 'used'); end if;
  return jsonb_build_object('status', 'ok', 'reward', res);
end $$;

revoke execute on function private.redeem_code(text, boolean) from public, anon, authenticated;
grant execute on function private.redeem_code(text, boolean) to authenticated;

insert into private.promo_codes (code, rewards) values ('EGU3RR3R0', jsonb_build_object('eg_tokens', 3))
on conflict (code) do update set rewards = excluded.rewards, active = true;
