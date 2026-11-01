/** Team display names and saga grouping for the encyclopedia. The saga table is a design choice, not ROM data. */

export const SAGAS = ['Fútbol Frontier', 'Invasión Alius', 'Viaje por Japón', 'Mundial FFI', 'GO', 'Chrono Stones', 'Galaxy', 'Ares', 'Orion', 'Selecciones y leyendas', 'Otros equipos'] as const;
export type Saga = (typeof SAGAS)[number];

const RULES: [RegExp, Saga][] = [
  [/alius|épsilon|géminis|génesis|caos|prominence|polvo|divinidades/i, 'Invasión Alius'],
  [/selecci|all_stars|ases_|ultra|veteranos|inazuma_b|adultos/i, 'Selecciones y leyendas'],
  [/alpino|claustro|fauxshore|mary|triple_c|servicio|secreto|redux|rdx|emperadores|robots|árboles/i, 'Viaje por Japón'],
  [/raimon|royal|wild|brain|otaku|shuriken|farm|kirkwood|zeus|fase_|occult|umbrella|sallys/i, 'Fútbol Frontier'],
];

let exported: Record<string, string> = {};
export const setTeamSagas = (m: Record<string, string> = {}) => { exported = m; };
export const sagaOf = (team: string): Saga => (exported[team] as Saga) ?? RULES.find(([rx]) => rx.test(team))?.[1] ?? 'Otros equipos';
let labels: Record<string, string> = {};
export const setTeamLabels = (m: Record<string, string> = {}) => { labels = m; };
export const rawTeamLabel = (team: string) => team.replace(/_/g, ' ').replace(/\s+\./g, '.').trim();
export const teamLabel = (team: string) => labels[team] ?? rawTeamLabel(team);
/** Both the display name and the ROM name, so a crest exported under either one is found. */
export const teamNames = (team: string) => [...new Set([teamLabel(team), rawTeamLabel(team)])];
