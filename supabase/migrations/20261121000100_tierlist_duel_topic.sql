-- Modo Duelo (author: «las tierlists eran para que las hagan ellos»): the community tier lists get the duel's topic, with
-- only the mode's footballers (the client offers just them; the ids are checked as for every topic by valid_tiers).
alter table public.tierlists drop constraint if exists tierlists_topic_check;
alter table public.tierlists add constraint tierlists_topic_check
  check (topic in ('general', 'delanteros', 'medios', 'defensas', 'porteros', 'favoritos', 'duelo'));
