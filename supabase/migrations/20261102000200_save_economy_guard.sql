-- Fix 1.23: the cloud save no longer takes any amount of fichas or coins. The game runs in the browser, so a save can be
-- edited before it is sent (console, storage, a forged backup); the server now limits how much each currency can GROW
-- between two writes to what can be earned in the real time that has passed (generous: several hours of play), plus
-- what promo codes gave on the server in that time. Spending is never limited. The extra is cut, not refused, so an
-- honest player never loses a write; a cheated amount just never reaches the account or another device.

create or replace function private.economy_cap(p_new jsonb, p_old jsonb, p_since timestamptz, p_uid uuid) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  hours numeric := greatest(0, extract(epoch from (now() - coalesce(p_since, now()))) / 3600);
  promo_t numeric := 0; promo_c numeric := 0;
  old_t numeric; old_c numeric; new_t numeric; new_c numeric; max_t numeric; max_c numeric;
  out jsonb := p_new;
begin
  -- promo codes redeemed on the server since the last write (only where the promo codes migration is applied)
  if to_regclass('private.promo_redemptions') is not null then
    execute 'select coalesce(sum((r.result ->> ''tokens'')::numeric), 0), coalesce(sum((r.result ->> ''coins'')::numeric), 0)
      from private.promo_redemptions r where r.user_id = $1 and r.created_at > coalesce($2, ''-infinity''::timestamptz)'
      into promo_t, promo_c using p_uid, p_since;
  end if;
  new_t := case when jsonb_typeof(p_new -> 'tokens') = 'number' then (p_new ->> 'tokens')::numeric else 0 end;
  new_c := case when jsonb_typeof(p_new -> 'coins') = 'number' then (p_new ->> 'coins')::numeric else 0 end;
  if p_old is null then
    -- first copy of an account (a guest's progress being linked): generous fixed ceilings
    max_t := 5000 + promo_t; max_c := 60000 + promo_c;
  else
    old_t := case when jsonb_typeof(p_old -> 'tokens') = 'number' then greatest(0, (p_old ->> 'tokens')::numeric) else 0 end;
    old_c := case when jsonb_typeof(p_old -> 'coins') = 'number' then greatest(0, (p_old ->> 'coins')::numeric) else 0 end;
    -- a base (one weekly pass day, rewards claimed together) plus what hours of play can give
    max_t := old_t + 2000 + 1000 * hours + promo_t;
    max_c := old_c + 8000 + 8000 * hours + promo_c;
  end if;
  if new_t > max_t then out := jsonb_set(out, '{tokens}', to_jsonb(floor(max_t)::bigint)); end if;
  if new_c > max_c then out := jsonb_set(out, '{coins}', to_jsonb(floor(max_c)::bigint)); end if;
  return out;
end $$;
revoke all on function private.economy_cap(jsonb, jsonb, timestamptz, uuid) from public, anon, authenticated;

-- put_save as before (size, rate, epoch, version lock) with the economy cap applied to what is stored
create or replace function private.put_save(p_data jsonb, p_expected integer) returns integer
language plpgsql security definer set search_path = public, extensions as $$
declare uid uuid := private.real_user(); v integer; cur_epoch integer; old_data jsonb; old_at timestamptz;
begin
  if octet_length(p_data::text) > 2000000 then raise exception 'save_too_large' using errcode = '54000'; end if;
  if exists (select 1 from public.saves s where s.user_id = uid and s.updated_at > now() - interval '2 seconds') then
    raise exception 'too_fast' using errcode = '54000';
  end if;
  select s.data, s.updated_at, private.save_epoch(s.data) into old_data, old_at, cur_epoch from public.saves s where s.user_id = uid;
  if cur_epoch is not null and private.save_epoch(p_data) < cur_epoch then
    raise exception 'progress_reset' using errcode = '40001';
  end if;
  p_data := private.economy_cap(p_data, old_data, old_at, uid);
  insert into public.saves (user_id, data, version) values (uid, p_data, 1)
  on conflict (user_id) do update set data = excluded.data, version = public.saves.version + 1, updated_at = now()
    where public.saves.version = p_expected
  returning version into v;
  if v is null then raise exception 'version_conflict' using errcode = '40001'; end if;
  return v;
end $$;

-- the welcome code stays one ×10 pull at the new price (10 per pull, 100 the ×10)
do $$ begin
  if to_regclass('private.promo_codes') is not null then
    update private.promo_codes set rewards = jsonb_set(rewards, '{tokens}', '100') where code = 'ASTRA17';
  end if;
end $$;
