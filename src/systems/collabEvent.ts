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
