-- 1.75 (author): Banner de agradecimiento. redeem_code also hands out Fichas de evento (rewards.event_tokens, answered as
-- reward.eventTokens, which only pay the Banner de agradecimiento), and the code GRACIAS: a free ×10 of that banner
-- (150 fichas de evento) and 10.000 coins. Same function as 20261102000000_promo_codes.sql otherwise.

create or replace function private.redeem_code(p_code text, p_already_applied boolean) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare uid uuid := private.real_user(); c record; pool jsonb; pick integer; res jsonb; inserted integer;
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
  pick := case when jsonb_array_length(coalesce(pool, '[]')) > 0 then (pool ->> floor(random() * jsonb_array_length(pool))::integer)::integer end;
  res := jsonb_build_object('tokens', coalesce((c.rewards ->> 'tokens')::integer, 0), 'coins', coalesce((c.rewards ->> 'coins')::integer, 0), 'player', pick,
    'eventTokens', coalesce((c.rewards ->> 'event_tokens')::integer, 0));
  insert into private.promo_redemptions (user_id, code, result) values (uid, c.code, res) on conflict do nothing;
  get diagnostics inserted = row_count;
  if inserted = 0 then return jsonb_build_object('status', 'used'); end if;
  return jsonb_build_object('status', 'ok', 'reward', res);
end $$;

revoke execute on function private.redeem_code(text, boolean) from public, anon, authenticated;
grant execute on function private.redeem_code(text, boolean) to authenticated;

insert into private.promo_codes (code, rewards) values ('GRACIAS', jsonb_build_object('tokens', 0, 'coins', 10000, 'event_tokens', 150))
on conflict (code) do nothing;
