-- Fix 1.12: promotional codes. The API roles never touch the tables; redeem_code() checks the caller, records the
-- redemption atomically (one row per account and code, primary key) and decides the reward on the server, so a code
-- can't be redeemed twice from two devices or by replaying the request. New codes are rows of private.promo_codes.

create table if not exists private.promo_codes (
  code text primary key check (code = upper(code) and char_length(code) between 3 and 32),
  rewards jsonb not null, -- {"tokens": n, "coins": n, "legendary_pool": [ids]}
  active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table private.promo_codes enable row level security;
revoke all on table private.promo_codes from public, anon, authenticated;

create table if not exists private.promo_redemptions (
  user_id uuid not null references auth.users (id) on delete cascade,
  code text not null references private.promo_codes (code),
  result jsonb not null,
  created_at timestamptz not null default now(),
  primary key (user_id, code)
);
alter table private.promo_redemptions enable row level security;
revoke all on table private.promo_redemptions from public, anon, authenticated;

-- ASTRA17: welcome gift. 72 fichas (a ×10 pull), 500 coins and one random Legendario of the 1.12 roster
insert into private.promo_codes (code, rewards) values ('ASTRA17', jsonb_build_object('tokens', 72, 'coins', 500,
  'legendary_pool', jsonb_build_array(1,2,3,10,29,1024,1370,1371,1382,1384,1405,1513,1532,1541,1542,1548,1567,1589,100248,100293,100382,100405,100438,100468,100475,100487,100494,100510,100519,100538,100540,100544,100562,100577,100580,100717,100728,100739,100797,100844,100905,100907,100979,101308,101488,101504,101505,101558,101572,101710,101719,101722,101775,101791,101838,101855,101871,102015,102117,102130,102185,102205,102307)))
on conflict (code) do nothing;

-- p_already_applied: a guest who redeemed on this device and now signs in; the account is marked as redeemed and gets
-- nothing more (the reward is already in the save). Answers: status ok | used | linked, and the reward when ok.
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
  res := jsonb_build_object('tokens', coalesce((c.rewards ->> 'tokens')::integer, 0), 'coins', coalesce((c.rewards ->> 'coins')::integer, 0), 'player', pick);
  insert into private.promo_redemptions (user_id, code, result) values (uid, c.code, res) on conflict do nothing;
  get diagnostics inserted = row_count;
  if inserted = 0 then return jsonb_build_object('status', 'used'); end if;
  return jsonb_build_object('status', 'ok', 'reward', res);
end $$;

create or replace function public.redeem_code(p_code text, p_already_applied boolean default false) returns jsonb
language sql security invoker set search_path = '' as $$ select private.redeem_code(p_code, p_already_applied); $$;

revoke execute on function private.redeem_code(text, boolean), public.redeem_code(text, boolean) from public, anon, authenticated;
grant execute on function private.redeem_code(text, boolean), public.redeem_code(text, boolean) to authenticated;
