-- 2.3 (author: «que estos marcos los obtengan los del otro código, INA483»): INA483 also gives the content creators'
-- banner and frame (creador, marco-creador). Whoever redeemed it earlier gets them in the client on load
-- (promo.ts creatorGiftINA483, from save.redeemedCodes).
update private.promo_codes set rewards = jsonb_set(rewards, '{pennants}', '["inazuma", "marco-inazuma", "creador", "marco-creador"]'::jsonb)
where code = 'INA483';
