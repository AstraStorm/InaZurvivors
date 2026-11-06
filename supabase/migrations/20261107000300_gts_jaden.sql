-- pre-2.0 (author): Jaden Evans (900100, Leyenda, reward of Road to Fútbol Frontier) can't be left at the GTS either.
insert into private.gts_banned (player_id) values (900100) on conflict do nothing;
