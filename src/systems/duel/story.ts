/**
 * Modo Duelo: el modo historia (author: «empieza a hacer como un poco de modo historia, rollo la temporada 1 2 y 3, con
 * los jugadores que tienes intenta apañártelas»). The three seasons of the original series told with the mode's 50
 * footballers: Fútbol Frontier (Royal Academy twice, Zeus), the Alius Academy (Diamond Dust, the Nueva Royal of Caleb —
 * he first appears there, author—, Chaos, Génesis)
 * and the Fútbol Frontier Internacional (Fire Dragon, Liocott's stars, Little Gigant). Where the 50 have no one for a
 * team the story takes liberties (Aiden with Diamond Dust, Liocott's stars together). You play with the story's own
 * team (it grows as the story recruits), so anyone can play it; rivals are scaled and the finals are bosses with more
 * actions and cards per turn (rules.ts `boss`). Balanced by tools/duel_story_sim.ts. Pure data, no DOM.
 */
import type { CoachId } from './cards';
import type { CpuLevel } from './cpu';
import { teamOf, type TeamCfg } from './rules';

/** who speaks: a footballer (pid) or a coach (id) */
export interface StoryLine { who: number | CoachId; text: string }
export interface StoryChapter {
  id: string; title: string; rival: string;
  /** your team: three starters and the bench, and the coach */
  you: number[]; youCoach: CoachId;
  /** who joins the team in this chapter (highlighted before the match) */
  joins?: number[];
  foe: number[]; foeCoach: CoachId | null; level: CpuLevel;
  /** the rival's HP / ATK / DEF multiplier */
  k: number;
  /** a boss: actions and cards more each turn */
  boss?: { actions: number; cards: number; shieldCap?: number };
  intro: StoryLine[]; outro: StoryLine[];
}
export interface StorySeason { n: 1 | 2 | 3; title: string; sub: string; c1: string; c2: string; chapters: StoryChapter[] }

export const STORY: StorySeason[] = [
  {
    n: 1, title: 'Fútbol Frontier', sub: 'El Raimon renace', c1: '#ff8a1a', c2: '#8a2a00',
    chapters: [
      {
        id: '1-1', title: 'El desafío de la Royal', rival: 'Royal Academy', you: [1, 10, 2, 3], youCoach: 'hillman',
        foe: [29, 1542, 1532], foeCoach: 'ray-dark', level: 'facil', k: 1.1,
        intro: [
          { who: 'hillman', text: 'La Royal Academy ha retado al Raimon. Si perdemos, cierran el club de fútbol.' },
          { who: 1, text: '¡Pues no vamos a perder! ¡Somos un equipo!' },
          { who: 29, text: '¿Un equipo? Cuatro chavales y un balón viejo. Esto acabará rápido.' },
          { who: 10, text: '...Juego con vosotros. Solo esta vez.' },
        ],
        outro: [
          { who: 29, text: 'Interesante... Mark Evans, recordaré tu nombre.' },
          { who: 1, text: '¡El club de fútbol sigue vivo! ¡Rumbo al Fútbol Frontier!' },
        ],
      },
      {
        id: '1-2', title: 'Final regional: la Royal Academy', rival: 'Royal Academy', you: [1, 10, 2, 3], youCoach: 'hillman',
        foe: [29, 1542, 1532], foeCoach: 'ray-dark', level: 'normal', k: 1.3,
        intro: [
          { who: 'ray-dark', text: 'Esta vez no habrá sorpresas. La Royal Academy no pierde nunca.' },
          { who: 29, text: 'Mark... Sé lo que ha hecho Ray Dark. Hoy jugaremos limpio. Y aun así te ganaré.' },
          { who: 1, text: '¡Así me gusta! ¡Que gane el mejor fútbol!' },
        ],
        outro: [
          { who: 29, text: 'Habéis ganado de verdad. Ya no quiero jugar para Ray Dark.' },
          { who: 1, text: '¡Campeones regionales! ¡Nos vemos en el Fútbol Frontier, Jude!' },
        ],
      },
      {
        id: '1-3', title: 'Final: el dios del Zeus', rival: 'Zeus', you: [1, 10, 29, 3], youCoach: 'hillman', joins: [29],
        foe: [157], foeCoach: 'ray-dark', level: 'dificil', k: 3.2, boss: { actions: 1, cards: 3 },
        intro: [
          { who: 29, text: 'El Zeus ha destrozado a la Royal. Déjame jugar con vosotros, Mark.' },
          { who: 157, text: 'Soy Byron Love. Los mortales no deberían pisar el campo de un dios.' },
          { who: 'ray-dark', text: 'El Néctar de los Dioses lo ha hecho invencible. Esta final es mía.' },
          { who: 'hillman', text: 'Es un solo jugador, pero juega como un equipo entero. ¡No le dejéis respirar!' },
          { who: 1, text: '¡Nadie es invencible! ¡Raimon, a por la copa!' },
        ],
        outro: [
          { who: 157, text: '¿Un dios... vencido por humanos? Ahora lo entiendo: el fútbol se juega juntos.' },
          { who: 1, text: '¡CAMPEONES DEL FÚTBOL FRONTIER!' },
        ],
      },
    ],
  },
  {
    n: 2, title: 'La Academia Alius', sub: 'Invasores del espacio', c1: '#b44aff', c2: '#2a0a5a',
    chapters: [
      {
        id: '2-1', title: 'Diamond Dust', rival: 'Diamond Dust', you: [1, 1513, 29, 2], youCoach: 'hillman', joins: [1513],
        foe: [1370, 100797], foeCoach: null, level: 'normal', k: 1.45, boss: { actions: 1, cards: 1 },
        intro: [
          { who: 1, text: 'Axel se ha ido... pero tenemos a un nuevo delantero: ¡Shawn Froste!' },
          { who: 1370, text: 'Somos Diamond Dust, de la Academia Alius. Vuestro planeta se congelará.' },
          { who: 100797, text: 'Shawn... ¿de verdad crees que puedes ganar sin mí?' },
          { who: 1513, text: 'Aiden... No. Esta vez juego con mis compañeros.' },
        ],
        outro: [
          { who: 1513, text: 'Gracias, Aiden. Ya no tengo que elegir entre atacar y defender.' },
          { who: 1370, text: 'El hielo se ha roto... Esto no ha terminado, terrícolas.' },
        ],
      },
      {
        id: '2-2', title: 'La Nueva Royal', rival: 'Nueva Royal', you: [1, 1513, 29, 2], youCoach: 'hillman',
        foe: [1541, 1542, 1532], foeCoach: 'ray-dark', level: 'normal', k: 0.91,
        intro: [
          { who: 'ray-dark', text: 'Jude... Te presento a mi Nueva Royal. Caleb, enséñale lo que es el fútbol de verdad.' },
          { who: 1541, text: 'Tranquilo, capitán. Prometo no romperte... mucho.' },
          { who: 1542, text: 'Ya no somos los de antes, Jude. Ray Dark nos ha dado las técnicas prohibidas.' },
          { who: 29, text: 'Esas técnicas os destrozarán. ¡Mark, tenemos que pararlos!' },
        ],
        outro: [
          { who: 1542, text: 'Jude... perdona. El poder nos cegó.' },
          { who: 29, text: 'Volved cuando estéis listos. El fútbol os está esperando.' },
          { who: 1541, text: 'Tch... No está mal, Raimon. Ya nos veremos.' },
        ],
      },
      {
        id: '2-3', title: 'Chaos', rival: 'Chaos', you: [1, 1513, 1548, 29], youCoach: 'hillman', joins: [1548],
        foe: [1371, 1370], foeCoach: null, level: 'normal', k: 1.36, boss: { actions: 1, cards: 2 },
        intro: [
          { who: 1371, text: 'Prominence y Diamond Dust, juntos. Somos Chaos.' },
          { who: 1370, text: 'Fuego y hielo. No aguantaréis nuestra Ventisca de fuego.' },
          { who: 1548, text: '¡Yo cubro la portería, Mark! ¡Tú sube al ataque!' },
          { who: 1, text: '¡Gracias, Darren! ¡Raimon, a por ellos!' },
        ],
        outro: [
          { who: 1371, text: 'Tch... Xavier no nos lo perdonará.' },
          { who: 1, text: 'Xavier... ¿Quién es ese Xavier?' },
        ],
      },
      {
        id: '2-4', title: 'Génesis', rival: 'Génesis', you: [1, 10, 1513, 29], youCoach: 'hillman', joins: [10],
        foe: [101722, 1371, 1370], foeCoach: null, level: 'dificil', k: 1.32, boss: { actions: 0, cards: 2 },
        intro: [
          { who: 10, text: 'Siento haber tardado. He vuelto para quedarme.' },
          { who: 101722, text: 'Soy Xavier Foster, capitán de Génesis. Somos lo más alto de la Academia Alius.' },
          { who: 101722, text: 'La Piedra Alius nos ha hecho imparables. ¿Qué podéis hacer contra eso?' },
          { who: 1, text: '¡Axel, Shawn, conmigo! ¡Es la hora de La Tierra!' },
        ],
        outro: [
          { who: 101722, text: 'La Tierra... Así que eso se siente al jugar de verdad en equipo.' },
          { who: 1, text: '¡Se acabó la invasión! Buen fútbol, Xavier. ¡Volveremos a jugar!' },
        ],
      },
    ],
  },
  {
    n: 3, title: 'Fútbol Frontier Internacional', sub: 'Inazuma Japan', c1: '#2a8cff', c2: '#0a1f6a',
    chapters: [
      {
        id: '3-1', title: 'Asia: Fire Dragon', rival: 'Fire Dragon', you: [1, 10, 1513, 1567], youCoach: 'travis', joins: [1567],
        foe: [101775, 157, 1371, 1370], foeCoach: null, level: 'normal', k: 0.99,
        intro: [
          { who: 'travis', text: 'Soy vuestro seleccionador. Para ir al mundial, hay que ganar a Corea: el Fire Dragon.' },
          { who: 101775, text: 'Byron, Claude, Bryce... ¡El Fire Dragon tiene a los mejores de vuestro país!' },
          { who: 157, text: 'Mark, esta vez jugaré como un humano. Y aun así os ganaré.' },
          { who: 1567, text: '¡Uooh, qué olas! ¡Vamos a surfear este partido!' },
        ],
        outro: [
          { who: 157, text: 'Lo veis... El fútbol sí que une a la gente.' },
          { who: 1, text: '¡Inazuma Japan va al mundial! ¡Rumbo a Liocott!' },
        ],
      },
      {
        id: '3-2', title: 'Las estrellas de Liocott', rival: 'Estrellas de Liocott', you: [1, 10, 101719, 1567], youCoach: 'travis', joins: [101719],
        foe: [1024, 101838, 101855, 101791], foeCoach: 'mister-d', level: 'dificil', k: 0.96,
        intro: [
          { who: 1024, text: '¡Mark! Cuánto tiempo. Unicorn, Orpheus y Knights of Queen, juntos en un partido de exhibición.' },
          { who: 101855, text: 'La Orpheus siempre juega con elegancia. Hoy no será distinto.' },
          { who: 101791, text: 'Un caballero no pierde dos veces.' },
          { who: 101719, text: '¡Axel, a por ellos! ¡Tormenta del tigre!' },
        ],
        outro: [
          { who: 1024, text: 'Increíble, Mark. ¡Nos vemos en la final!' },
          { who: 101838, text: 'Ese portero... no se rinde nunca.' },
        ],
      },
      {
        id: '3-3', title: 'Final: Little Gigant', rival: 'Little Gigant', you: [1, 10, 101719, 1513], youCoach: 'travis',
        // two goalkeepers: their shields stop at 15 % of their PV, or the final never ends (it is still the longest: ~16 turns)
        foe: [101894, 100773], foeCoach: 'david-evans', level: 'dificil', k: 1.6, boss: { actions: 3, cards: 3, shieldCap: 0.15 },
        intro: [
          { who: 100773, text: 'Mark... Cómo has crecido. Ahora entreno a Little Gigant.' },
          { who: 1, text: '¡Abuelo! ¿De verdad vas a jugar contra mí?' },
          { who: 101894, text: 'El abuelo me lo enseñó todo. Soy el mejor portero del mundo.' },
          { who: 100773, text: 'Hoy bajo al campo una última vez. Enséñame tu fútbol, Mark.' },
          { who: 'travis', text: '¡La final del mundial! ¡Inazuma Japan, dadlo todo!' },
        ],
        outro: [
          { who: 100773, text: 'Eso es, Mark... Ese es el fútbol que yo soñaba.' },
          { who: 1, text: '¡CAMPEONES DEL MUNDO! ¡INAZUMA JAPAN!' },
        ],
      },
    ],
  },
];

export const STORY_CHAPTERS = STORY.flatMap((s) => s.chapters);
export const storyChapter = (id: string) => STORY_CHAPTERS.find((c) => c.id === id);
/** a chapter is open when the one before it is cleared (the first always) */
export function storyOpen(cleared: readonly string[], id: string): boolean {
  const i = STORY_CHAPTERS.findIndex((c) => c.id === id);
  return i === 0 || (i > 0 && cleared.includes(STORY_CHAPTERS[i - 1].id));
}

/** the two teams of a chapter for the engine: yours as it is, the rival's scaled and, for a boss, with its extras */
export function storyTeams(byId: Parameters<typeof teamOf>[0], ch: StoryChapter): [TeamCfg, TeamCfg] {
  const mine = teamOf(byId, ch.you, ch.youCoach);
  const foe = teamOf(byId, ch.foe, ch.foeCoach);
  for (const u of foe.units) u.stats = { ...u.stats, hp: Math.round(u.stats.hp * ch.k), atk: Math.round(u.stats.atk * Math.sqrt(ch.k)), def: Math.round(u.stats.def * Math.sqrt(ch.k)) };
  if (ch.boss) foe.boss = ch.boss;
  return [mine, foe];
}
