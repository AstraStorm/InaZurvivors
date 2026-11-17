/**
 * (author) InaZurvivors x BlueLock: the second collab banner. It opens the day after the Banner de agradecimiento closes,
 * for seven days, and is paid with the same Fichas de evento (a run on Rango S or X gives them while it is open). Before it
 * opens the main menu teases it: «Próximamente», the days left and the two footballers as silhouettes, never the name.
 */
import type { SaveData } from './save';

const DAY = 86_400_000;

export const BLUELOCK_EVENT = {
  id: 'bluelock',
  name: 'InaZurvivors x BlueLock',
  /** the day after the Banner de agradecimiento ends (Madrid); author: at 12:00 with the 2.2 and the Temporada 1 (was 15:00);
   *  the server's clock decides */
  start: '2026-11-12T12:00:00+01:00',
  days: 7,
  cost: 15,
  multiCost: 150,
  /** the two collab footballers (data/special_players.json, exclusive «bluelock») */
  players: [900200, 900201],
};

export const bluelockStart = () => Date.parse(BLUELOCK_EVENT.start);
export const bluelockEnd = () => bluelockStart() + BLUELOCK_EVENT.days * DAY;
export const bluelockActive = (now: number | Date) => +now >= bluelockStart() && +now < bluelockEnd();
/** the teaser runs from the moment the thanks banner is over (or earlier, while it is still on) until the opening */
export const bluelockUpcoming = (now: number | Date) => +now < bluelockStart();
export const bluelockLeftMs = (now: number | Date) => Math.max(0, bluelockEnd() - +now);
/** whole days until it opens (1 on its eve, 0 once open) */
export const bluelockDaysToStart = (now: number | Date) => Math.max(0, Math.ceil((bluelockStart() - +now) / DAY));

/** (author) the celebration: its banner for 3 wins while it is open, its frame for owning both footballers (pennants.ts) */
export const BLUELOCK_WINS_FOR_BANNER = 3;
/** counts a won run toward the banner, only while the collab is open */
export function recordBluelockWin(s: SaveData, now: number | Date) {
  if (bluelockActive(now)) s.blWins = (s.blWins ?? 0) + 1;
}
export const bluelockPairOwned = (s: SaveData) => BLUELOCK_EVENT.players.every((id) => !!s.owned[String(id)]);

/**
 * 2.9 (author): InaZurvivors x Desafío Champions Sendokai, the third collab banner, paid with the Fichas de evento too. Until
 * it opens it is hidden like BlueLock was: «Próximamente» and the five as silhouettes, no name, no logo, no coach.
 */
export const SENDOKAI_EVENT = {
  id: 'sendokai',
  name: 'InaZurvivors x Desafío Sendokai',
  /** (author) it opens the moment InaZurvivors x BlueLock closes (19 November, 12:00 Madrid) */
  start: '2026-11-19T12:00:00+01:00',
  days: 7,
  cost: 15,
  multiCost: 150,
  /** Cloe, Fenzy, Zak, Kiet and Lon (data/special_players.json, exclusive «sendokai»; tools/sendokai_players.py) */
  players: [900600, 900601, 900602, 900603, 900604],
  /** (author) the main one: Zak, in the middle and bigger on the banner */
  star: 900602,
  /** (author: «que cada uno tenga un aura como Zak, de sus colores»): each one's glow on the banner */
  aura: { 900600: '#4ab4ff', 900601: '#ff6ad2', 900602: '#ffb02e', 900603: '#5ee84a', 900604: '#a98cff' } as Record<number, string>,
};
/** the five as the banner shows them: Zak in the middle */
export const sendokaiLineup = () => [900600, 900601, SENDOKAI_EVENT.star, 900603, 900604];
export const sendokaiStart = () => Date.parse(SENDOKAI_EVENT.start);
export const sendokaiEnd = () => sendokaiStart() + SENDOKAI_EVENT.days * DAY;
export const sendokaiActive = (now: number | Date) => +now >= sendokaiStart() && +now < sendokaiEnd();
export const sendokaiUpcoming = (now: number | Date) => +now < sendokaiStart();
export const sendokaiLeftMs = (now: number | Date) => Math.max(0, sendokaiEnd() - +now);
export const sendokaiDaysToStart = (now: number | Date) => Math.max(0, Math.ceil((sendokaiStart() - +now) / DAY));
export const sendokaiOwned = (s: SaveData) => SENDOKAI_EVENT.players.filter((id) => !!s.owned[String(id)]).length;
/** the celebration, like BlueLock's: its banner for 3 wins while it is open, its frame for owning the five (pennants.ts) */
export const SENDOKAI_WINS_FOR_BANNER = 3;
export function recordSendokaiWin(s: SaveData, now: number | Date) {
  if (sendokaiActive(now)) s.sdWins = (s.sdWins ?? 0) + 1;
}
