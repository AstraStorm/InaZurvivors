-- 3.0 Piedra Alius: the cloud save never takes Piedras Alius or transformations the player could not have earned.
-- Like coins and fichas (20261102000200_save_economy_guard.sql), the client computes everything and the server only cuts
-- what a forged save adds: the stones can grow at most by what victories can give in the time passed (the game gives at
-- most 3 a day; the ceiling here is far looser so an honest player is never cut), and every NEW transformation must be paid
-- with ALIUS_COST stones out of that budget. Extra stones are cut and unpaid transformations dropped (the last ones added);
-- the write itself is never refused. Keep ALIUS_COST equal to src/data/alius.ts ALIUS_CONFIG.unlockCost.
--
-- The previous economy_cap is kept as economy_cap_base and wrapped: a later migration that redefines economy_cap must call
-- private.alius_cap at its end too.

alter function private.economy_cap(jsonb, jsonb, timestamptz, uuid) rename to economy_cap_base;
revoke all on function private.economy_cap_base(jsonb, jsonb, timestamptz, uuid) from public, anon, authenticated;

create or replace function private.alius_cap(p_new jsonb, p_old jsonb, p_since timestamptz) returns jsonb
language plpgsql immutable set search_path = '' as $$
declare
  alius_cost constant integer := 10;
  hours numeric := greatest(0, extract(epoch from (now() - coalesce(p_since, now()))) / 3600);
  new_s numeric; old_s numeric; budget numeric; paid integer := 0;
  old_keys text[] := '{}'; keep jsonb := '[]'::jsonb; k text;
  out jsonb := p_new;
begin
  if jsonb_typeof(p_new -> 'alius') <> 'object' then return out; end if;
  new_s := case when jsonb_typeof(p_new -> 'alius' -> 'stones') = 'number' then greatest(0, (p_new -> 'alius' ->> 'stones')::numeric) else 0 end;
  old_s := case when jsonb_typeof(p_old -> 'alius' -> 'stones') = 'number' then greatest(0, (p_old -> 'alius' ->> 'stones')::numeric) else 0 end;
  if jsonb_typeof(p_old -> 'alius' -> 'unlocked') = 'array' then
    select coalesce(array_agg(x), '{}') into old_keys from jsonb_array_elements_text(p_old -> 'alius' -> 'unlocked') x;
  end if;
  -- what this write may hold: the old stones plus what the time passed can give (first copy of an account: a fixed amount)
  budget := case when p_old is null then 60 else old_s + 6 + hours * 2 end;
  if new_s > budget then new_s := floor(budget); end if;
  budget := budget - new_s; -- stones that may have been spent on new transformations
  if jsonb_typeof(p_new -> 'alius' -> 'unlocked') = 'array' then
    for k in select x from jsonb_array_elements_text(p_new -> 'alius' -> 'unlocked') x loop
      if k = any(old_keys) then keep := keep || to_jsonb(k);
      elsif budget >= alius_cost then keep := keep || to_jsonb(k); budget := budget - alius_cost; paid := paid + 1;
      end if; -- an unpaid new transformation is dropped
    end loop;
    out := jsonb_set(out, '{alius,unlocked}', keep);
  end if;
  out := jsonb_set(out, '{alius,stones}', to_jsonb(floor(new_s)::bigint));
  return out;
end $$;
revoke all on function private.alius_cap(jsonb, jsonb, timestamptz) from public, anon, authenticated;

create or replace function private.economy_cap(p_new jsonb, p_old jsonb, p_since timestamptz, p_uid uuid) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
begin
  return private.alius_cap(private.economy_cap_base(p_new, p_old, p_since, p_uid), p_old, p_since);
end $$;
revoke all on function private.economy_cap(jsonb, jsonb, timestamptz, uuid) from public, anon, authenticated;
