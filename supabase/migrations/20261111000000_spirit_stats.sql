-- 2.02 Métricas (author: «qué espíritus son los que más se usan y los que más vidas quitan»). At the end of every run with an
-- active warrior spirit the game sends which one, how many ultimates were cast and the damage the team dealt in the 3 s
-- after each one. Stored added up per Madrid day and spirit: no account is kept with the numbers (only a per-account
-- daily counter against spam). Only admins read it.

create table if not exists private.spirit_daily (
  day date not null,
  spirit text not null,
  runs integer not null default 0,
  casts integer not null default 0,
  damage bigint not null default 0,
  primary key (day, spirit)
);
create table if not exists private.spirit_senders (
  user_id uuid not null references auth.users (id) on delete cascade,
  day date not null,
  n integer not null default 0,
  primary key (user_id, day)
);

create or replace function private.record_spirit_run(p_spirit text, p_casts integer, p_damage bigint) returns void
language plpgsql volatile security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
  d date := (now() at time zone 'Europe/Madrid')::date;
  k integer;
begin
  if uid is null or coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) then raise exception 'not_signed_in' using errcode = 'P0001'; end if;
  if p_spirit is null or p_spirit !~ '^[a-z_]{2,24}$' then raise exception 'bad_spirit' using errcode = 'P0001'; end if;
  insert into private.spirit_senders (user_id, day, n) values (uid, d, 1)
  on conflict (user_id, day) do update set n = private.spirit_senders.n + 1 returning n into k;
  if k > 60 then return; end if; -- more runs than anyone plays in a day: ignored
  insert into private.spirit_daily (day, spirit, runs, casts, damage)
  values (d, p_spirit, 1, least(greatest(coalesce(p_casts, 0), 0), 400), least(greatest(coalesce(p_damage, 0), 0), 2000000000))
  on conflict (day, spirit) do update set runs = private.spirit_daily.runs + 1, casts = private.spirit_daily.casts + excluded.casts,
    damage = private.spirit_daily.damage + excluded.damage;
  delete from private.spirit_senders where day < d - 2;
end $$;

create or replace function private.admin_spirit_stats(p_days integer default 30) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare d integer := least(greatest(coalesce(p_days, 30), 1), 365);
begin
  if not private.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  return coalesce((select jsonb_agg(jsonb_build_object('spirit', spirit, 'runs', runs, 'casts', casts, 'damage', damage) order by runs desc) from (
    select spirit, sum(runs)::bigint runs, sum(casts)::bigint casts, sum(damage)::bigint damage from private.spirit_daily
    where day > (now() at time zone 'Europe/Madrid')::date - d group by spirit) x), '[]'::jsonb);
end $$;

create or replace function public.record_spirit_run(p_spirit text, p_casts integer, p_damage bigint) returns void
language sql volatile security invoker set search_path = '' as $$ select private.record_spirit_run(p_spirit, p_casts, p_damage); $$;
create or replace function public.admin_spirit_stats(p_days integer default 30) returns jsonb
language sql stable security invoker set search_path = '' as $$ select private.admin_spirit_stats(p_days); $$;

revoke all on table private.spirit_daily, private.spirit_senders from public, anon, authenticated;
revoke execute on function private.record_spirit_run(text, integer, bigint), public.record_spirit_run(text, integer, bigint),
  private.admin_spirit_stats(integer), public.admin_spirit_stats(integer) from public, anon, authenticated;
grant execute on function private.record_spirit_run(text, integer, bigint), public.record_spirit_run(text, integer, bigint),
  private.admin_spirit_stats(integer), public.admin_spirit_stats(integer) to authenticated;
alter function private.record_spirit_run(text, integer, bigint) set statement_timeout = '5s';
alter function private.admin_spirit_stats(integer) set statement_timeout = '8s';

notify pgrst, 'reload schema';
