/**
 * (author) Banner de agradecimiento: the limited-time machine that thanks everyone who has played. It holds every special
 * footballer (data/special_players.json: the collab players and the hooded Axel) and a short filler of Comunes, Raros and
 * Épicos. It is paid only with Fichas de evento, which a run on Rango S or X gives on top of its normal fichas (the same
 * amount) while the event is open.
 */
import type { Rank, SaveData } from './save';
import { bluelockActive } from './collabEvent';
import { tr } from '../i18n/i18n';

export const THANKS_EVENT = {
  id: 'agradecimiento',
  name: tr('Banner de agradecimiento'),
  /** Madrid time; seven days from here (the server's clock decides) */
  start: '2026-11-04T15:00:00+01:00',
  days: 7,
  cost: 15,
  multiCost: 150,
};

/** ranks whose runs give Fichas de evento */
export const THANKS_RANKS: Rank[] = ['S', 'X', 'Z'];

const DAY = 86_400_000;
export const thanksStart = () => Date.parse(THANKS_EVENT.start);
export const thanksEnd = () => thanksStart() + THANKS_EVENT.days * DAY;
export const thanksActive = (now: number | Date) => +now >= thanksStart() && +now < thanksEnd();
export const thanksLeftMs = (now: number | Date) => Math.max(0, thanksEnd() - +now);

/** Fichas de evento of a finished run: as many as its normal fichas, on Rango S or X while the event is open. */
export function thanksTokens(rank: Rank | undefined, tokenTotal: number, now: number | Date): number {
  // (author) InaZurvivors x BlueLock is paid with the same Fichas de evento, so they keep coming while it is open
  return (thanksActive(now) || bluelockActive(now)) && rank && THANKS_RANKS.includes(rank) ? Math.max(0, Math.floor(tokenTotal)) : 0;
}

export function addThanksTokens(s: SaveData, n: number) {
  if (n > 0) s.eventTokens = (s.eventTokens ?? 0) + n;
}
