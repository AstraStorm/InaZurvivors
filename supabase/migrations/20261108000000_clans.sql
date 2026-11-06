-- 1.93 (author): clans. A player with a name founds a clan (15.000 coins, paid in the save) with a name, crest and kit,
-- others join it (20 at most). Juegos del Clan: every member plays up to 3 matches a day on the clan arena and the points
-- add up for the clan; at the end of each week (Monday 00:00, Madrid) the clans are ranked and their members claim prizes
-- (TOP 1, TOP 3, TOP 8, the rest). Roles: lider (everything), oficial (answers requests, expels plain members), miembro.
-- A clan is open (anyone joins) or by request (a leader or officer accepts). Weekly clan missions pay every member who played for the clan that week. Names go
-- through a banned-word list. Tables closed to the API; everything through the functions below.

-- ---------------------------------------------------------------- weeks and days on the Madrid clock
create or replace function private.clan_day() returns date language sql stable set search_path = '' as $$
  select (now() at time zone 'Europe/Madrid')::date;
$$;
create or replace function private.clan_week(p_at timestamptz default now()) returns date language sql stable set search_path = '' as $$
  select date_trunc('week', p_at at time zone 'Europe/Madrid')::date;
$$;

-- ---------------------------------------------------------------- names
-- whole: only as a whole word (short words that hide inside normal ones: «Círculo», «Disputa»); otherwise anywhere
create table if not exists private.clan_banned_words (word text primary key, whole boolean not null default false);
insert into private.clan_banned_words (word, whole) values
  ('mierda', false), ('joder', false), ('gilipollas', false), ('subnormal', false), ('retrasado', false), ('maricon', false), ('bollera', false),
  ('negrata', false), ('hitler', false), ('violacion', false), ('violador', false), ('pedofilo', false), ('pederasta', false), ('hijoputa', false),
  ('hijodeputa', false), ('porno', false), ('fuck', false), ('pussy', false), ('nigger', false), ('nigga', false), ('faggot', false), ('whore', false),
  ('inazurvivors', false), ('inazurivors', false), ('astrastorm', false), ('moderador', false),
  ('puta', true), ('puto', true), ('putas', true), ('putos', true), ('polla', true), ('pollas', true), ('folla', true), ('follar', true),
  ('culo', true), ('culos', true), ('perra', true), ('zorra', true), ('tetas', true), ('sexo', true), ('semen', true), ('vagina', true),
  ('cabron', true), ('cabrones', true), ('marica', true), ('mongolo', true), ('travelo', true), ('sudaca', true), ('panchito', true),
  ('nazi', true), ('nazis', true), ('heil', true), ('kkk', true), ('violar', true), ('hdp', true), ('ctm', true), ('shit', true), ('bitch', true),
  ('cunt', true), ('dick', true), ('slut', true), ('porn', true), ('penis', true), ('retard', true), ('admin', true), ('staff', true),
  ('oficial', true), ('levels', true)
on conflict do nothing;

-- letters only, lower case, no accents, the usual digit swaps undone (p0ll4 -> polla)
create or replace function private.clan_name_key(p text) returns text language sql immutable set search_path = '' as $$
  select regexp_replace(translate(lower(coalesce(p, '')), 'áéíóúüñàèìòù013457@$', 'aeiouunaeiouoieastas'), '[^a-z]', '', 'g');
$$;

create or replace function private.clan_name_ok(p text) returns text language plpgsql stable set search_path = '' as $$
declare clean text := regexp_replace(trim(coalesce(p, '')), '\s+', ' ', 'g'); k text;
begin
  if clean !~ '^[A-Za-z0-9ÁÉÍÓÚÜÑáéíóúüñ _.-]{3,20}$' or clean !~ '[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]' then
    raise exception 'invalid_clan_name' using errcode = '22023';
  end if;
  k := private.clan_name_key(clean);
  if exists (select 1 from private.clan_banned_words w where not w.whole and position(w.word in k) > 0)
     or exists (select 1 from private.clan_banned_words w, regexp_split_to_table(lower(clean), '[\s_.-]+') part
                where w.whole and private.clan_name_key(part) = w.word) then
    raise exception 'banned_clan_name' using errcode = '22023';
  end if;
  return clean;
end $$;

-- ---------------------------------------------------------------- tables
create table if not exists public.clans (
  id bigint generated always as identity primary key,
  name extensions.citext not null unique,
  crest text not null default '' check (char_length(crest) <= 64),
  kit text not null default '' check (char_length(kit) <= 64),
  leader uuid not null references public.profiles (id),
  mode text not null default 'solicitud' check (mode in ('abierto', 'solicitud')),
  members int not null default 1,
  created_at timestamptz not null default now()
);
create table if not exists public.clan_members (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  clan_id bigint not null references public.clans (id) on delete cascade,
  role text not null default 'miembro' check (role in ('lider', 'oficial', 'miembro')),
  joined_at timestamptz not null default now()
);
create index if not exists clan_members_clan on public.clan_members (clan_id);
create table if not exists public.clan_requests (
  user_id uuid not null references public.profiles (id) on delete cascade,
  clan_id bigint not null references public.clans (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, clan_id)
);
create index if not exists clan_requests_clan on public.clan_requests (clan_id);
create table if not exists public.clan_runs (
  id bigint generated always as identity primary key,
  clan_id bigint not null,
  user_id uuid not null references public.profiles (id) on delete cascade,
  run_id text not null check (char_length(run_id) between 1 and 64),
  day date not null,
  week date not null,
  points int not null check (points >= 0),
  kills int not null default 0,
  victory boolean not null default false,
  created_at timestamptz not null default now(),
  unique (user_id, run_id)
);
create index if not exists clan_runs_week on public.clan_runs (week, clan_id);
create index if not exists clan_runs_user_day on public.clan_runs (user_id, day);
-- the closed weeks: position and prize tier of every clan that scored
create table if not exists public.clan_week_results (
  week date not null,
  clan_id bigint not null,
  name text not null,
  points bigint not null,
  pos int not null,
  tier text not null check (tier in ('top1', 'top3', 'top8', 'resto')),
  primary key (week, clan_id)
);
-- what each player has taken: weekly prizes ('premio', ref = week) and missions ('mision', ref = week:id). The coins and
-- fichas are counted by the save's economy cap.
create table if not exists public.clan_rewards (
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in ('premio', 'mision')),
  ref text not null,
  coins int not null default 0,
  tokens int not null default 0,
  claimed_at timestamptz not null default now(),
  primary key (user_id, kind, ref)
);
alter table public.clans enable row level security;
alter table public.clan_members enable row level security;
alter table public.clan_requests enable row level security;
alter table public.clan_runs enable row level security;
alter table public.clan_week_results enable row level security;
alter table public.clan_rewards enable row level security;
revoke all on table public.clans, public.clan_members, public.clan_requests, public.clan_runs, public.clan_week_results, public.clan_rewards from public, anon, authenticated;

-- ---------------------------------------------------------------- rules shared with src/systems/clans.ts
create or replace function private.clan_prize(p_tier text) returns table (coins int, tokens int) language sql immutable set search_path = '' as $$
  select v.c, v.k from (values ('top1', 100000, 500), ('top3', 50000, 300), ('top8', 25000, 300), ('resto', 10000, 100)) v (t, c, k) where v.t = p_tier
  union all select 0, 0 where p_tier not in ('top1', 'top3', 'top8', 'resto');
$$;
-- weekly missions: id, what is counted, goal, coins, fichas
create or replace function private.clan_missions_def() returns table (id text, kind text, goal bigint, coins int, tokens int) language sql immutable set search_path = '' as $$
  select * from (values
    ('partidas', 'runs', 30::bigint, 5000, 30),
    ('victorias', 'wins', 15::bigint, 10000, 30),
    ('rivales', 'kills', 15000::bigint, 10000, 50),
    ('puntos', 'points', 250000::bigint, 15000, 50),
    ('todos', 'everyone', 1::bigint, 10000, 50)
  ) v (id, kind, goal, coins, tokens);
$$;

create or replace function private.clan_points(p_kills int, p_time int, p_damage bigint, p_rank text, p_victory boolean) returns int
language sql immutable set search_path = '' as $$
  select floor((least(greatest(p_kills, 0), 4000) * 3 + least(greatest(p_time, 0), 900) * 2 + floor(sqrt(least(greatest(p_damage, 0), 20000000)))
    + case when p_victory then 300 else 0 end)
    * case p_rank when 'X' then 2.2 when 'S' then 1.8 when 'A' then 1.5 when 'B' then 1.25 else 1 end)::int;
$$;

-- closes a finished week once: every clan that scored, ranked by points (ties: the one that got there first)
create or replace function private.close_clan_week(p_week date) returns void language plpgsql security definer set search_path = public as $$
begin
  if p_week >= private.clan_week() then return; end if;
  if exists (select 1 from public.clan_week_results where week = p_week) then return; end if;
  perform pg_advisory_xact_lock(hashtext('close_clan_week'), (p_week - date '2026-01-01'));
  if exists (select 1 from public.clan_week_results where week = p_week) then return; end if;
  insert into public.clan_week_results (week, clan_id, name, points, pos, tier)
  select p_week, s.clan_id, coalesce(c.name::text, 'Clan disuelto'), s.pts, s.pos,
    case when s.pos = 1 then 'top1' when s.pos <= 3 then 'top3' when s.pos <= 8 then 'top8' else 'resto' end
  from (select r.clan_id, sum(r.points)::bigint as pts, row_number() over (order by sum(r.points) desc, max(r.created_at)) as pos
        from public.clan_runs r where r.week = p_week group by r.clan_id having sum(r.points) > 0) s
  left join public.clans c on c.id = s.clan_id
  on conflict do nothing;
end $$;

-- ---------------------------------------------------------------- membership
create or replace function private.clan_create(p_name text, p_crest text, p_kit text) returns bigint
language plpgsql security definer set search_path = public as $$
declare uid uuid := private.real_user(); clean text; new_id bigint;
begin
  if not exists (select 1 from public.profiles where id = uid) then raise exception 'no_username' using errcode = '42501'; end if;
  if exists (select 1 from public.clan_members where user_id = uid) then raise exception 'already_in_clan' using errcode = '23505'; end if;
  clean := private.clan_name_ok(p_name);
  if exists (select 1 from public.clans where name = clean::extensions.citext) then raise exception 'clan_name_taken' using errcode = '23505'; end if;
  insert into public.clans (name, crest, kit, leader) values (clean, left(coalesce(p_crest, ''), 64), left(coalesce(p_kit, ''), 64), uid) returning id into new_id;
  insert into public.clan_members (user_id, clan_id, role) values (uid, new_id, 'lider');
  delete from public.clan_requests where user_id = uid;
  return new_id;
exception when unique_violation then
  if exists (select 1 from public.clan_members where user_id = uid) then raise exception 'already_in_clan' using errcode = '23505'; end if;
  raise exception 'clan_name_taken' using errcode = '23505';
end $$;

create or replace function private.clan_update(p_name text, p_crest text, p_kit text, p_mode text) returns boolean
language plpgsql security definer set search_path = public as $$
declare uid uuid := private.real_user(); cid bigint; clean text;
begin
  select clan_id into cid from public.clan_members where user_id = uid and role = 'lider';
  if cid is null then raise exception 'not_leader' using errcode = '42501'; end if;
  if p_name is not null then
    clean := private.clan_name_ok(p_name);
    if exists (select 1 from public.clans where name = clean::extensions.citext and id <> cid) then raise exception 'clan_name_taken' using errcode = '23505'; end if;
  end if;
  if p_mode is not null and p_mode not in ('abierto', 'solicitud') then raise exception 'invalid_mode' using errcode = '22023'; end if;
  update public.clans set name = coalesce(clean, name), crest = coalesce(left(p_crest, 64), crest), kit = coalesce(left(p_kit, 64), kit),
    mode = coalesce(p_mode, mode) where id = cid;
  return true;
end $$;

-- puts a player in a clan (checked: has a name, in no clan, room left); his other requests go away
create or replace function private.clan_add(p_user uuid, p_clan bigint) returns void language plpgsql security definer set search_path = public as $$
declare n int;
begin
  if exists (select 1 from public.clan_members where user_id = p_user) then raise exception 'already_in_clan' using errcode = '23505'; end if;
  select members into n from public.clans where id = p_clan for update;
  if n is null then raise exception 'clan_not_found' using errcode = 'P0002'; end if;
  if n >= 20 then raise exception 'clan_full' using errcode = '54000'; end if;
  insert into public.clan_members (user_id, clan_id) values (p_user, p_clan);
  update public.clans set members = members + 1 where id = p_clan;
  delete from public.clan_requests where user_id = p_user;
end $$;

-- an open clan takes the player at once; one by request keeps it until a leader or officer answers (3 requests at most)
create or replace function private.clan_request(p_clan bigint) returns text
language plpgsql security definer set search_path = public as $$
declare uid uuid := private.real_user(); m text;
begin
  if not exists (select 1 from public.profiles where id = uid) then raise exception 'no_username' using errcode = '42501'; end if;
  if exists (select 1 from public.clan_members where user_id = uid) then raise exception 'already_in_clan' using errcode = '23505'; end if;
  select mode into m from public.clans where id = p_clan;
  if m is null then raise exception 'clan_not_found' using errcode = 'P0002'; end if;
  if m = 'abierto' then perform private.clan_add(uid, p_clan); return 'joined'; end if;
  if exists (select 1 from public.clan_requests where user_id = uid and clan_id = p_clan) then return 'requested'; end if;
  if (select count(*) from public.clan_requests where user_id = uid) >= 3 then raise exception 'too_many_requests' using errcode = '54000'; end if;
  insert into public.clan_requests (user_id, clan_id) values (uid, p_clan);
  return 'requested';
end $$;

create or replace function private.clan_cancel_request(p_clan bigint) returns boolean language sql security definer set search_path = '' as $$
  with d as (delete from public.clan_requests r where r.user_id = private.real_user() and r.clan_id = p_clan returning 1) select exists (select 1 from d);
$$;

create or replace function private.my_clan_requests() returns table (id bigint, name text, crest text, created_at timestamptz)
language sql stable security definer set search_path = '' as $$
  select c.id, c.name::text, c.crest, r.created_at from public.clan_requests r join public.clans c on c.id = r.clan_id where r.user_id = auth.uid() order by r.created_at;
$$;

-- the clan's role of the caller, if he can manage (lider or oficial)
create or replace function private.clan_manager() returns table (clan_id bigint, role text) language sql stable security definer set search_path = '' as $$
  select m.clan_id, m.role from public.clan_members m where m.user_id = private.real_user() and m.role in ('lider', 'oficial');
$$;

create or replace function private.clan_requests() returns table (username text, avatar text, created_at timestamptz)
language plpgsql stable security definer set search_path = public as $$
declare cid bigint;
begin
  select x.clan_id into cid from private.clan_manager() x;
  if cid is null then raise exception 'not_leader' using errcode = '42501'; end if;
  return query select p.username::text, p.avatar, r.created_at from public.clan_requests r join public.profiles p on p.id = r.user_id
    where r.clan_id = cid order by r.created_at;
end $$;

create or replace function private.clan_answer(p_username text, p_accept boolean) returns boolean
language plpgsql security definer set search_path = public as $$
declare cid bigint; target uuid;
begin
  select x.clan_id into cid from private.clan_manager() x;
  if cid is null then raise exception 'not_leader' using errcode = '42501'; end if;
  select r.user_id into target from public.clan_requests r join public.profiles p on p.id = r.user_id
    where r.clan_id = cid and p.username = p_username::extensions.citext;
  if target is null then return false; end if;
  if not p_accept then delete from public.clan_requests where user_id = target and clan_id = cid; return true; end if;
  if exists (select 1 from public.clan_members where user_id = target) then
    delete from public.clan_requests where user_id = target;
    raise exception 'already_in_clan' using errcode = '23505';
  end if;
  perform private.clan_add(target, cid);
  return true;
end $$;

-- leaving: the leader hands the clan to an officer (or else the longest-standing member); the last one out dissolves it
create or replace function private.clan_drop(p_user uuid) returns void language plpgsql security definer set search_path = public as $$
declare cid bigint; was text; heir uuid;
begin
  delete from public.clan_members where user_id = p_user returning clan_id, role into cid, was;
  if cid is null then return; end if;
  update public.clans set members = greatest(0, members - 1) where id = cid;
  if was = 'lider' then
    select user_id into heir from public.clan_members where clan_id = cid order by role = 'oficial' desc, joined_at limit 1;
    if heir is null then delete from public.clans where id = cid; return; end if;
    update public.clan_members set role = 'lider' where user_id = heir;
    update public.clans set leader = heir where id = cid;
  end if;
end $$;

create or replace function private.clan_leave() returns boolean language plpgsql security definer set search_path = public as $$
declare uid uuid := private.real_user();
begin
  if not exists (select 1 from public.clan_members where user_id = uid) then return false; end if;
  perform private.clan_drop(uid);
  return true;
end $$;

-- the leader expels anyone; an officer only plain members
create or replace function private.clan_kick(p_username text) returns boolean language plpgsql security definer set search_path = public as $$
declare me record; target uuid; trole text;
begin
  select * into me from private.clan_manager();
  if me.clan_id is null then raise exception 'not_leader' using errcode = '42501'; end if;
  select m.user_id, m.role into target, trole from public.clan_members m join public.profiles p on p.id = m.user_id
    where m.clan_id = me.clan_id and p.username = p_username::extensions.citext and m.user_id <> auth.uid();
  if target is null then return false; end if;
  if me.role = 'oficial' and trole <> 'miembro' then raise exception 'not_leader' using errcode = '42501'; end if;
  perform private.clan_drop(target);
  return true;
end $$;

-- the leader names officers (or takes it back) and can hand the leadership over (he becomes an officer)
create or replace function private.clan_set_role(p_username text, p_role text) returns boolean language plpgsql security definer set search_path = public as $$
declare uid uuid := private.real_user(); cid bigint; target uuid;
begin
  select clan_id into cid from public.clan_members where user_id = uid and role = 'lider';
  if cid is null then raise exception 'not_leader' using errcode = '42501'; end if;
  if p_role not in ('lider', 'oficial', 'miembro') then raise exception 'invalid_role' using errcode = '22023'; end if;
  select m.user_id into target from public.clan_members m join public.profiles p on p.id = m.user_id
    where m.clan_id = cid and p.username = p_username::extensions.citext and m.user_id <> uid;
  if target is null then return false; end if;
  if p_role = 'lider' then
    update public.clan_members set role = 'oficial' where user_id = uid;
    update public.clans set leader = target where id = cid;
  end if;
  update public.clan_members set role = p_role where user_id = target;
  return true;
end $$;

-- ---------------------------------------------------------------- reading
create or replace function private.clan_search(p_query text) returns table (id bigint, name text, crest text, kit text, members int, week_points bigint, mode text)
language sql stable security definer set search_path = '' as $$
  select c.id, c.name::text, c.crest, c.kit, c.members,
    coalesce((select sum(r.points) from public.clan_runs r where r.clan_id = c.id and r.week = private.clan_week()), 0)::bigint as wp, c.mode
  from public.clans c
  where coalesce(trim(p_query), '') = '' or c.name::text ilike '%' || replace(replace(trim(p_query), '%', ''), '_', '\_') || '%'
  order by wp desc, c.members desc, c.id limit 30;
$$;

create or replace function private.clan_ranking() returns table (pos bigint, id bigint, name text, crest text, kit text, members int, points bigint)
language sql stable security definer set search_path = '' as $$
  select row_number() over (order by s.pts desc, s.last), c.id, c.name::text, c.crest, c.kit, c.members, s.pts
  from (select r.clan_id, sum(r.points)::bigint as pts, max(r.created_at) as last from public.clan_runs r where r.week = private.clan_week() group by r.clan_id) s
  join public.clans c on c.id = s.clan_id
  order by s.pts desc, s.last limit 50;
$$;

create or replace function private.clan_last_week() returns table (pos int, name text, points bigint, tier text) language plpgsql security definer set search_path = public as $$
begin
  perform private.close_clan_week(private.clan_week() - 7);
  return query select r.pos, r.name, r.points, r.tier from public.clan_week_results r where r.week = private.clan_week() - 7 order by r.pos limit 8;
end $$;

-- the player's clan: the clan, its members (today's matches and this week's points), its position this week, its missions
create or replace function private.my_clan() returns jsonb language plpgsql stable security definer set search_path = public as $$
declare uid uuid := auth.uid(); cid bigint; w date := private.clan_week(); d date := private.clan_day(); out jsonb;
begin
  select clan_id into cid from public.clan_members where user_id = uid;
  if cid is null then return null; end if;
  select jsonb_build_object(
    'id', c.id, 'name', c.name::text, 'crest', c.crest, 'kit', c.kit, 'members', c.members, 'created_at', c.created_at,
    'me', (select role from public.clan_members where user_id = uid), 'mode', c.mode,
    'requests', case when (select role from public.clan_members where user_id = uid) in ('lider', 'oficial')
      then (select count(*) from public.clan_requests q where q.clan_id = c.id) else 0 end,
    'runsToday', (select count(*) from public.clan_runs r where r.user_id = uid and r.day = d),
    'weekPoints', coalesce((select sum(points) from public.clan_runs r where r.clan_id = c.id and r.week = w), 0),
    'pos', (select x.pos from (select r.clan_id, row_number() over (order by sum(r.points) desc, max(r.created_at)) as pos
                                from public.clan_runs r where r.week = w group by r.clan_id) x where x.clan_id = c.id),
    'clans', (select count(distinct r.clan_id) from public.clan_runs r where r.week = w),
    'roster', (select coalesce(jsonb_agg(jsonb_build_object('username', p.username::text, 'avatar', p.avatar, 'role', m.role,
                  'today', (select count(*) from public.clan_runs r where r.user_id = m.user_id and r.day = d),
                  'week', coalesce((select sum(points) from public.clan_runs r where r.user_id = m.user_id and r.clan_id = c.id and r.week = w), 0))
                order by m.role = 'lider' desc, m.role = 'oficial' desc, m.joined_at), '[]'::jsonb)
               from public.clan_members m join public.profiles p on p.id = m.user_id where m.clan_id = c.id),
    'missions', (select jsonb_agg(jsonb_build_object('id', md.id, 'goal', md.goal, 'coins', md.coins, 'tokens', md.tokens,
                  'progress', case md.kind
                    when 'runs' then (select count(*) from public.clan_runs r where r.clan_id = c.id and r.week = w)
                    when 'wins' then (select count(*) from public.clan_runs r where r.clan_id = c.id and r.week = w and r.victory)
                    when 'kills' then (select coalesce(sum(kills), 0) from public.clan_runs r where r.clan_id = c.id and r.week = w)
                    when 'points' then (select coalesce(sum(points), 0) from public.clan_runs r where r.clan_id = c.id and r.week = w)
                    else (case when c.members >= 3 and not exists (select 1 from public.clan_members m2 where m2.clan_id = c.id
                            and not exists (select 1 from public.clan_runs r where r.user_id = m2.user_id and r.clan_id = c.id and r.week = w)) then 1 else 0 end) end,
                  'claimed', exists (select 1 from public.clan_rewards cr where cr.user_id = uid and cr.kind = 'mision' and cr.ref = w::text || ':' || md.id)))
               from private.clan_missions_def() md))
  into out from public.clans c where c.id = cid;
  return out;
end $$;

-- ---------------------------------------------------------------- Juegos del Clan
create or replace function private.clan_submit_run(p_run_id text, p_kills int, p_time_sec int, p_damage bigint, p_rank text, p_victory boolean) returns jsonb
language plpgsql security definer set search_path = public as $$
declare uid uuid := private.real_user(); cid bigint; d date := private.clan_day(); n int; pts int;
begin
  select clan_id into cid from public.clan_members where user_id = uid;
  if cid is null then raise exception 'not_in_clan' using errcode = '42501'; end if;
  if p_rank not in ('C', 'B', 'A', 'S', 'X') then raise exception 'invalid_rank' using errcode = '22023'; end if;
  perform pg_advisory_xact_lock(hashtext('clan_run'), hashtext(uid::text));
  if exists (select 1 from public.clan_runs where user_id = uid and run_id = p_run_id) then raise exception 'duplicate' using errcode = '23505'; end if;
  select count(*) into n from public.clan_runs where user_id = uid and day = d;
  if n >= 3 then raise exception 'clan_daily_limit' using errcode = '54000'; end if;
  pts := private.clan_points(p_kills, p_time_sec, p_damage, p_rank, p_victory);
  insert into public.clan_runs (clan_id, user_id, run_id, day, week, points, kills, victory)
    values (cid, uid, p_run_id, d, private.clan_week(), pts, least(greatest(p_kills, 0), 4000), coalesce(p_victory, false));
  return jsonb_build_object('points', pts, 'left', 2 - n,
    'weekPoints', (select coalesce(sum(points), 0) from public.clan_runs where clan_id = cid and week = private.clan_week()));
end $$;

-- ---------------------------------------------------------------- rewards
-- weekly prizes of the last 4 closed weeks not taken yet, for the clan the player played for that week (the one he
-- gave the most points to); only players who played at least once for it get anything
create or replace function private.clan_claim_prizes() returns table (week date, clan text, pos int, tier text, coins int, tokens int)
language plpgsql security definer set search_path = public as $$
declare uid uuid := private.real_user(); w date; k int; cid bigint; res record; pz record;
begin
  for k in 1..4 loop
    w := private.clan_week() - 7 * k;
    perform private.close_clan_week(w);
    if exists (select 1 from public.clan_rewards cr where cr.user_id = uid and cr.kind = 'premio' and cr.ref = w::text) then continue; end if;
    select r.clan_id into cid from public.clan_runs r where r.user_id = uid and r.week = w group by r.clan_id order by sum(r.points) desc limit 1;
    if cid is null then continue; end if;
    select * into res from public.clan_week_results x where x.week = w and x.clan_id = cid;
    if res is null then continue; end if;
    select * into pz from private.clan_prize(res.tier);
    insert into public.clan_rewards (user_id, kind, ref, coins, tokens) values (uid, 'premio', w::text, pz.coins, pz.tokens) on conflict do nothing;
    if found then
      week := w; clan := res.name; pos := res.pos; tier := res.tier; coins := pz.coins; tokens := pz.tokens;
      return next;
    end if;
  end loop;
end $$;

create or replace function private.clan_claim_mission(p_id text) returns jsonb language plpgsql security definer set search_path = public as $$
declare uid uuid := private.real_user(); w date := private.clan_week(); info jsonb; m jsonb;
begin
  if not exists (select 1 from public.clan_runs r join public.clan_members cm on cm.user_id = r.user_id and cm.clan_id = r.clan_id
                 where r.user_id = uid and r.week = w) then
    raise exception 'play_first' using errcode = '42501';
  end if;
  select private.my_clan() into info;
  select x into m from jsonb_array_elements(info -> 'missions') x where x ->> 'id' = p_id;
  if m is null then raise exception 'mission_not_found' using errcode = 'P0002'; end if;
  if (m ->> 'progress')::bigint < (m ->> 'goal')::bigint then raise exception 'mission_not_done' using errcode = '54000'; end if;
  insert into public.clan_rewards (user_id, kind, ref, coins, tokens) values (uid, 'mision', w::text || ':' || p_id, (m ->> 'coins')::int, (m ->> 'tokens')::int)
  on conflict do nothing;
  if not found then raise exception 'already_claimed' using errcode = '23505'; end if;
  return jsonb_build_object('coins', (m ->> 'coins')::int, 'tokens', (m ->> 'tokens')::int);
end $$;

-- ---------------------------------------------------------------- admin
create or replace function private.admin_clan(p_name text, p_new_name text, p_dissolve boolean) returns boolean
language plpgsql security definer set search_path = public as $$
declare cid bigint;
begin
  if not private.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  select id into cid from public.clans where name = p_name::extensions.citext;
  if cid is null then return false; end if;
  if p_dissolve then delete from public.clans where id = cid; return true; end if;
  update public.clans set name = private.clan_name_ok(p_new_name) where id = cid;
  return true;
end $$;

-- ---------------------------------------------------------------- the save's economy cap counts clan rewards too
create or replace function private.economy_cap(p_new jsonb, p_old jsonb, p_since timestamptz, p_uid uuid) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  hours numeric := greatest(0, extract(epoch from (now() - coalesce(p_since, now()))) / 3600);
  promo_t numeric := 0; promo_c numeric := 0; bug_t numeric := 0; clan_t numeric := 0; clan_c numeric := 0;
  old_t numeric; old_c numeric; new_t numeric; new_c numeric; max_t numeric; max_c numeric;
  out jsonb := p_new;
begin
  if to_regclass('private.promo_redemptions') is not null then
    execute 'select coalesce(sum((r.result ->> ''tokens'')::numeric), 0), coalesce(sum((r.result ->> ''coins'')::numeric), 0)
      from private.promo_redemptions r where r.user_id = $1 and r.created_at > coalesce($2, ''-infinity''::timestamptz)'
      into promo_t, promo_c using p_uid, p_since;
  end if;
  select coalesce(sum(b.tokens), 0) into bug_t from private.bug_rewards b
    where b.user_id = p_uid and b.claimed_at is not null and b.claimed_at > coalesce(p_since, '-infinity'::timestamptz);
  select coalesce(sum(c.tokens), 0), coalesce(sum(c.coins), 0) into clan_t, clan_c from public.clan_rewards c
    where c.user_id = p_uid and c.claimed_at > coalesce(p_since, '-infinity'::timestamptz);
  promo_t := promo_t + bug_t + clan_t;
  promo_c := promo_c + clan_c;
  new_t := case when jsonb_typeof(p_new -> 'tokens') = 'number' then (p_new ->> 'tokens')::numeric else 0 end;
  new_c := case when jsonb_typeof(p_new -> 'coins') = 'number' then (p_new ->> 'coins')::numeric else 0 end;
  if p_old is null then
    max_t := 5000 + promo_t; max_c := 120000 + promo_c;
  else
    old_t := case when jsonb_typeof(p_old -> 'tokens') = 'number' then greatest(0, (p_old ->> 'tokens')::numeric) else 0 end;
    old_c := case when jsonb_typeof(p_old -> 'coins') = 'number' then greatest(0, (p_old ->> 'coins')::numeric) else 0 end;
    max_t := old_t + 2000 + 1000 * hours + promo_t;
    max_c := old_c + 16000 + 16000 * hours + promo_c;
  end if;
  if new_t > max_t then out := jsonb_set(out, '{tokens}', to_jsonb(floor(max_t)::bigint)); end if;
  if new_c > max_c then out := jsonb_set(out, '{coins}', to_jsonb(floor(max_c)::bigint)); end if;
  return out;
end $$;
revoke all on function private.economy_cap(jsonb, jsonb, timestamptz, uuid) from public, anon, authenticated;

-- ---------------------------------------------------------------- API wrappers
create or replace function public.clan_create(p_name text, p_crest text default '', p_kit text default '') returns bigint
language sql security invoker set search_path = '' as $$ select private.clan_create(p_name, p_crest, p_kit); $$;
create or replace function public.clan_update(p_name text default null, p_crest text default null, p_kit text default null, p_mode text default null) returns boolean
language sql security invoker set search_path = '' as $$ select private.clan_update(p_name, p_crest, p_kit, p_mode); $$;
create or replace function public.clan_request(p_clan bigint) returns text language sql security invoker set search_path = '' as $$ select private.clan_request(p_clan); $$;
create or replace function public.clan_cancel_request(p_clan bigint) returns boolean language sql security invoker set search_path = '' as $$ select private.clan_cancel_request(p_clan); $$;
create or replace function public.my_clan_requests() returns table (id bigint, name text, crest text, created_at timestamptz)
language sql stable security invoker set search_path = '' as $$ select * from private.my_clan_requests(); $$;
create or replace function public.clan_requests() returns table (username text, avatar text, created_at timestamptz)
language sql stable security invoker set search_path = '' as $$ select * from private.clan_requests(); $$;
create or replace function public.clan_answer(p_username text, p_accept boolean) returns boolean language sql security invoker set search_path = '' as $$ select private.clan_answer(p_username, p_accept); $$;
create or replace function public.clan_set_role(p_username text, p_role text) returns boolean language sql security invoker set search_path = '' as $$ select private.clan_set_role(p_username, p_role); $$;
create or replace function public.clan_leave() returns boolean language sql security invoker set search_path = '' as $$ select private.clan_leave(); $$;
create or replace function public.clan_kick(p_username text) returns boolean language sql security invoker set search_path = '' as $$ select private.clan_kick(p_username); $$;
create or replace function public.clan_search(p_query text default '') returns table (id bigint, name text, crest text, kit text, members int, week_points bigint, mode text)
language sql stable security invoker set search_path = '' as $$ select * from private.clan_search(p_query); $$;
create or replace function public.clan_ranking() returns table (pos bigint, id bigint, name text, crest text, kit text, members int, points bigint)
language sql stable security invoker set search_path = '' as $$ select * from private.clan_ranking(); $$;
create or replace function public.clan_last_week() returns table (pos int, name text, points bigint, tier text)
language sql security invoker set search_path = '' as $$ select * from private.clan_last_week(); $$;
create or replace function public.my_clan() returns jsonb language sql stable security invoker set search_path = '' as $$ select private.my_clan(); $$;
create or replace function public.clan_submit_run(p_run_id text, p_kills int, p_time_sec int, p_damage bigint, p_rank text, p_victory boolean) returns jsonb
language sql security invoker set search_path = '' as $$ select private.clan_submit_run(p_run_id, p_kills, p_time_sec, p_damage, p_rank, p_victory); $$;
create or replace function public.clan_claim_prizes() returns table (week date, clan text, pos int, tier text, coins int, tokens int)
language sql security invoker set search_path = '' as $$ select * from private.clan_claim_prizes(); $$;
create or replace function public.clan_claim_mission(p_id text) returns jsonb language sql security invoker set search_path = '' as $$ select private.clan_claim_mission(p_id); $$;
create or replace function public.admin_clan(p_name text, p_new_name text default null, p_dissolve boolean default false) returns boolean
language sql security invoker set search_path = '' as $$ select private.admin_clan(p_name, p_new_name, p_dissolve); $$;

revoke execute on function private.clan_day(), private.clan_week(timestamptz), private.clan_name_key(text), private.clan_name_ok(text),
  private.clan_prize(text), private.clan_missions_def(), private.clan_points(int, int, bigint, text, boolean), private.close_clan_week(date),
  private.clan_create(text, text, text), private.clan_update(text, text, text, text), private.clan_request(bigint), private.clan_cancel_request(bigint), private.my_clan_requests(), private.clan_requests(), private.clan_answer(text, boolean), private.clan_set_role(text, text), private.clan_drop(uuid), private.clan_add(uuid, bigint), private.clan_manager(), private.clan_leave(),
  private.clan_kick(text), private.clan_search(text), private.clan_ranking(), private.clan_last_week(), private.my_clan(),
  private.clan_submit_run(text, int, int, bigint, text, boolean), private.clan_claim_prizes(), private.clan_claim_mission(text),
  private.admin_clan(text, text, boolean) from public, anon, authenticated;
grant execute on function private.clan_search(text), private.clan_ranking(), private.clan_last_week() to anon, authenticated;
grant execute on function private.clan_create(text, text, text), private.clan_update(text, text, text, text), private.clan_request(bigint), private.clan_cancel_request(bigint), private.my_clan_requests(), private.clan_requests(), private.clan_answer(text, boolean), private.clan_set_role(text, text), private.clan_leave(),
  private.clan_kick(text), private.my_clan(), private.clan_submit_run(text, int, int, bigint, text, boolean), private.clan_claim_prizes(),
  private.clan_claim_mission(text), private.admin_clan(text, text, boolean) to authenticated;
revoke execute on function public.clan_create(text, text, text), public.clan_update(text, text, text, text), public.clan_request(bigint), public.clan_cancel_request(bigint), public.my_clan_requests(), public.clan_requests(), public.clan_answer(text, boolean), public.clan_set_role(text, text), public.clan_leave(),
  public.clan_kick(text), public.clan_search(text), public.clan_ranking(), public.clan_last_week(), public.my_clan(),
  public.clan_submit_run(text, int, int, bigint, text, boolean), public.clan_claim_prizes(), public.clan_claim_mission(text),
  public.admin_clan(text, text, boolean) from public, anon;
grant execute on function public.clan_search(text), public.clan_ranking(), public.clan_last_week() to anon, authenticated;
grant execute on function public.clan_create(text, text, text), public.clan_update(text, text, text, text), public.clan_request(bigint), public.clan_cancel_request(bigint), public.my_clan_requests(), public.clan_requests(), public.clan_answer(text, boolean), public.clan_set_role(text, text), public.clan_leave(),
  public.clan_kick(text), public.my_clan(), public.clan_submit_run(text, int, int, bigint, text, boolean), public.clan_claim_prizes(),
  public.clan_claim_mission(text), public.admin_clan(text, text, boolean) to authenticated;
