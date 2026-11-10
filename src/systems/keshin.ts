/**
 * 2.0 (author): Espíritus Guerreros (Keshin). Some footballers can call their warrior spirit: it is unlocked and levelled
 * per footballer with Fichas EG, and while he is on the pitch it gives:
 *   - a passive to the whole team: the spirit's own talent in Inazuma Eleven GO (guiasnintendo «Espíritus guerreros»,
 *     inazuma.fandom «Espíritu Guerrero»), adapted to a survivors game;
 *   - a percentage more of the stat of its technique's position (a shot spirit raises Tiro, a keeper spirit Defensa);
 *   - its supertechnique as one more repertoire entry (power grows with the level).
 * Levels I (no symbol), II, III, IV, V and Ω; reaching level L costs L-1 Fichas EG, unlocking costs KESHIN_UNLOCK_COST.
 * Everything is in save.keshin (player id -> level); never in the manifest.
 */
import type { RosterEntry, Technique, TechType } from '../data/manifest';
import type { SaveData } from './save';
import type { StatKey } from './training';
import type { TalentFx } from './talents';

export type KeshinId = 'apolo' | 'atenea' | 'azote_negro' | 'chione' | 'demogorgo' | 'eris' | 'evera' | 'glenr' | 'grandius' | 'guiverno_blanco' | 'huargo' | 'jmet' | 'lancelot' | 'magister' | 'musashi' | 'papelin' | 'pegaso' | 'surtur' | 'zodiaco';

/** how many boys and girls are on the pitch, their Auras included (author) — «Grito de guerra», «Gatas salvajes» */
export interface TeamGenders { male: number; female: number }

export interface KeshinDef {
  id: KeshinId;
  /** name of the spirit and its title in the games (Spanish) */
  name: string;
  title: string;
  element: 'Fuego' | 'Aire' | 'Montaña' | 'Bosque';
  /** type of its supertechnique, which decides the stat it raises */
  type: TechType;
  /** the footballers that call it (roster id + name, checked by the tests) */
  holders: { id: number; name: string }[];
  /** its supertechnique at level I (power grows with the level, techPower) */
  tech: Technique;
  /** the spirit's talent in GO and what it does here (k = KESHIN_SCALE of the level) */
  passive: { name: string; game: string; text: (k: number) => string; apply: (f: TalentFx, k: number, team: TeamGenders) => void };
  /** colour of its aura in the menus */
  color: string;
}

export const KESHIN_MAX = 6;
export const KESHIN_LABEL = ['', 'I', 'II', 'III', 'IV', 'V', 'Ω'] as const;
export const KESHIN_UNLOCK_COST = 3;
/** Fichas EG to reach a level (2 costs 1, 3 costs 2… Ω costs 5) */
export const keshinStepCost = (to: number) => (to <= 1 ? KESHIN_UNLOCK_COST : to - 1);
/** extra share of the position stat at each level (they stack: each level adds to the one before) */
export const KESHIN_STAT_PCT = [0, 0.05, 0.08, 0.11, 0.14, 0.17, 0.25];
/** strength of the passive at each level */
export const KESHIN_SCALE = [0, 1, 1.5, 2, 2.5, 3, 4];
/** 2.0 launch gift: enough Fichas EG to unlock one spirit and take it to level II and III */
/** (author: «nada que te regalen fichas») the 2.0 intro gives none; Fichas EG only come from rank X wins (economy.egRewards) */
export const KESHIN_GIFT = 0;

/** the stat a technique of this type uses (playerStats.ts statDamage) */
export const STAT_OF_TYPE: Partial<Record<TechType, StatKey>> = { tiro: 'kick', regate: 'control', defensa: 'guard', parada: 'guard' };

const pct = (v: number) => `${Math.round(v * 100)}%`;
const addElem = (f: TalentFx, e: string, v: number) => { f.element[e] = (f.element[e] ?? 0) + v; };
const addType = (f: TalentFx, t: TechType, v: number) => { f.type[t] = (f.type[t] ?? 0) + v; };
// (author) keeper spirits' saves have power 125 like every other spirit technique: they had 52-55, the GO «Poder» stat of
// the spirit (50-60) taken by mistake for the technique's power
const tech = (id: number, name: string, element: string, type: TechType, power: number, description: string): Technique =>
  ({ id, name, description, type, element, power, cost: 60, unlockLevel: 1, growth: null });

/** «Llamas danzantes», «Bosque frondoso»…: better supertechniques of an element for the whole team */
const elemPassive = (name: string, game: string, e: string) => ({ name, game, text: (k: number) => `+${pct(0.06 * k)} daño de las técnicas de ${e} de todo el equipo`, apply: (f: TalentFx, k: number) => addElem(f, e, 0.06 * k) });

export const KESHINS: KeshinDef[] = [
  { id: 'apolo', name: 'Apolo', title: 'Apolo, dios del sol', element: 'Fuego', type: 'tiro', color: '#ffb02e',
    holders: [{ id: 100739, name: 'Sol Daystar' }, { id: 900007, name: 'Escanor' }],
    tech: tech(990002, 'Llamarada solar', 'Fuego', 'tiro', 125, 'Apolo alza el sol sobre el campo y lo lanza con el balón: una llamarada que lo arrasa todo.'),
    passive: elemPassive('Llamas danzantes', 'Mejora el efecto de las supertécnicas de fuego de todos los jugadores.', 'Fuego') },
  // 2.1 (author): Dueña del aire, Atenea (inazuma.fandom: air, shot, «Golpe de Atenea» — «Orden de tiro EG02» in the
  // game —, talent «Goleador sobrenatural»), Beta's. The talent's effect text is ours (no source had it): stronger shots
  { id: 'atenea', name: 'Atenea', title: 'Dueña del aire, Atenea', element: 'Aire', type: 'tiro', color: '#d86aff',
    holders: [{ id: 102307, name: 'Beta' }],
    tech: tech(990018, 'Golpe de Atenea', 'Aire', 'tiro', 130, 'Atenea baja girando con sus alas de plumas negras; las serpientes de sus brazos abren la boca y lanzan un orbe rosa y otro cian al balón, que se vuelve una esfera blanca envuelta en un remolino violeta y sale como un rayo que atraviesa la fila de rivales.'),
    passive: { name: 'Goleador sobrenatural', game: 'Sus tiros tienen una fuerza sobrenatural.',
      text: (k) => `+${pct(0.05 * k)} daño de los tiros y +${pct(0.01 * k)} de probabilidad de crítico para todo el equipo`, apply: (f, k) => { addType(f, 'tiro', 0.05 * k); f.crit += 0.01 * k; } } },
  { id: 'azote_negro', name: 'Azote Negro', title: 'Señor oscuro, Azote negro', element: 'Bosque', type: 'tiro', color: '#c13cff',
    holders: [{ id: 100303, name: 'Tezcat' }, { id: 900006, name: 'Meliodas' }],
    // (author) the first one, already with its own animation (fxKeshin.ts blackAxeStrike, ArenaScene)
    tech: tech(990001, 'Hacha del Azote Negro', 'Bosque', 'tiro', 150, 'Dark Exodus baja de la tormenta con su hacha y parte el campo con un rayo magenta.'),
    passive: { name: 'Impulso de tiro', game: 'Mejora el tiro de todos los jugadores del equipo en 10 puntos.',
      text: (k) => `+${pct(0.06 * k)} daño de los tiros de todo el equipo`, apply: (f, k) => addType(f, 'tiro', 0.06 * k) } },
  { id: 'chione', name: 'Chione', title: 'Chione, reina de la nieve', element: 'Aire', type: 'tiro', color: '#9be7ff',
    holders: [{ id: 1513, name: 'Shawn Froste' }, { id: 900301, name: 'Shawn Froste Sin Bufanda' }, { id: 100938, name: 'Njord Snio' }], // 2.02: the Leyenda Shawn too
    tech: tech(990003, 'Lanza de carámbanos', 'Aire', 'tiro', 125, 'Chione envuelve al jugador en una ventisca y el balón sale en una lanza de hielo; donde cae brotan carámbanos que congelan a todos.'),
    // «Pies de plomo»: grip so nobody slips on ice; here the team keeps its footing: faster and harder to push around
    passive: { name: 'Pies de plomo', game: 'Mejora el agarre de todos los jugadores para no resbalar en campos helados.',
      text: (k) => `+${pct(0.02 * k)} velocidad y +${pct(0.01 * k)} de reducción de daño para todo el equipo`, apply: (f, k) => { f.speed += 0.02 * k; f.shield += 0.01 * k; } } },
  // 2.1 (author): Duque destructor, Demogorgo (inazuma.fandom: forest, catch, «Despeje demoníaco»; «puede parar prácticamente
  // cualquier tiro»), Darren's. Its Chrono Stones talent is «Impulso de técnica»: like Grandius's «Impulso de aguante» it
  // raises a stat of the whole team — Técnica, the stat of dribbles and blocks (the effect text is ours: no source had it)
  { id: 'demogorgo', name: 'Demogorgo', title: 'Duque destructor, Demogorgo', element: 'Bosque', type: 'parada', color: '#a05aff',
    holders: [{ id: 1548, name: 'Darren LaChance' }],
    tech: tech(990017, 'Despeje demoníaco', 'Bosque', 'parada', 125, 'Demogorgo surge de un estallido verde, barre el aire con un tajo violeta y descarga su enorme puño negro: los tiros rivales salen despedidos como cometas violetas y los rivales del golpe vuelan entre rayos amarillos. Cura al equipo.'),
    passive: { name: 'Impulso de técnica', game: 'Mejora la técnica de todos los jugadores del equipo.',
      text: (k) => `+${pct(0.05 * k)} daño de los regates y las defensas de todo el equipo`, apply: (f, k) => { addType(f, 'regate', 0.05 * k); addType(f, 'defensa', 0.05 * k); } } },
  { id: 'grandius', name: 'Grandius', title: 'Mágico gigante, Grandius', element: 'Montaña', type: 'parada', color: '#ffd84a',
    holders: [{ id: 1, name: 'Mark Evans' }, { id: 100234, name: 'Mark Evans Adulto' }, { id: 900002, name: 'Eren Jaeger' }], // author: adult Mark (Endou Mamoru) too
    tech: tech(990004, 'Mano grandiosa', 'Montaña', 'parada', 125, 'Grandius ruge (el rugido aparta a los rivales) y lanza su mano gigante sobre el grupo más grande: los aplasta y los deja aturdidos, y una onda dorada barre el campo tragándose los tiros rivales. Cura al equipo.'),
    // «Impulso de aguante»: Aguante is the recharge of the techniques here
    passive: { name: 'Impulso de aguante', game: 'Mejora el aguante de todos los jugadores del equipo en 10 puntos.',
      text: (k) => `-${pct(0.025 * k)} recarga de las técnicas de todo el equipo`, apply: (f, k) => { f.cooldown += 0.025 * k; } } },
  { id: 'guiverno_blanco', name: 'Guiverno Blanco', title: 'Dragón Heráldico, Guiverno blanco', element: 'Aire', type: 'tiro', color: '#e9f4ff',
    holders: [{ id: 100944, name: 'Bai Long' }],
    tech: tech(990005, 'Aliento blanco', 'Aire', 'tiro', 130, 'El dragón blanco carga el balón entre sus fauces y lo suelta en un aliento de luz dorada que arrasa todo lo que encuentra.'),
    passive: { name: 'Impulso defensivo', game: 'Mejora la defensa de todos los jugadores del equipo en 10 puntos.',
      text: (k) => `+${pct(0.06 * k)} daño de las defensas y +${pct(0.01 * k)} de reducción de daño para todo el equipo`, apply: (f, k) => { addType(f, 'defensa', 0.06 * k); f.shield += 0.01 * k; } } },
  { id: 'magister', name: 'Magister', title: 'Director Magister', element: 'Bosque', type: 'tiro', color: '#7dff9a',
    holders: [{ id: 100544, name: 'Riccardo Di Rigo' }],
    tech: tech(990006, 'Movimientos armónicos', 'Bosque', 'tiro', 120, 'Magister dirige: el balón se vuelve una esfera de luz azul que sale en espiral, y donde cae cada nota se convierte en un disparo contra los rivales.'),
    passive: elemPassive('Bosque frondoso', 'Mejora el efecto de las supertécnicas de bosque de todos los jugadores.', 'Bosque') },
  // author: Bruja de la discordia, Eris (inazuma.fandom: air, block, «Espinas insidiosas», talent «Gatas salvajes»), Flora's
  { id: 'eris', name: 'Eris', title: 'Bruja de la discordia, Eris', element: 'Aire', type: 'defensa', color: '#4ae8ff',
    holders: [{ id: 100582, name: 'Flora' }, { id: 100335, name: 'Flora MM' }],
    tech: tech(990013, 'Espinas insidiosas', 'Aire', 'defensa', 120, 'Eris hunde su pelo en el suelo: cuatro lazos de espinas negras brotan entre llamas azules alrededor de los rivales, los rodean y los dejan atrapados.'),
    // «Gatas salvajes»: the girls of the team win more duels; here every girl on the pitch makes the team hit harder
    passive: { name: 'Gatas salvajes', game: 'Aumenta las posibilidades de victoria de las chicas del equipo en los duelos.',
      text: (k) => `+${pct(0.05 * k)} daño de todas las técnicas de todo el equipo por cada chica en el campo (las Auras chica también cuentan)`, apply: (f, k, team) => { f.team += 0.05 * k * team.female; } } },
  // 2.1 (author): Gran señor de los demonios, Evera (inazuma.fandom: mountain, shot, «Asalto mortal», talent «Cordillera
  // infranqueable»), every Simeon Ayp. The scene (oxMqBje4mZg 0:09): Evera charges his red fist with blue lightning and
  // punches the ball while Simeon kicks it with both legs
  { id: 'evera', name: 'Evera', title: 'Gran señor de los demonios, Evera', element: 'Montaña', type: 'tiro', color: '#b9a4ff',
    holders: [{ id: 100426, name: 'Simeon Ayp' }, { id: 102454, name: 'Simeon MM' }],
    tech: tech(990016, 'Asalto mortal', 'Montaña', 'tiro', 140, 'Evera carga su puño rojo con rayos azules y golpea el balón a la vez que el tirador: sale una esfera de rayos que revienta sobre el grupo más grande de rivales, los manda a volar y los deja aturdidos, y los rayos saltan a los que tiene alrededor.'),
    passive: elemPassive('Cordillera infranqueable', 'Mejora el efecto de las supertécnicas de montaña de todos los jugadores.', 'Montaña') },
  // author: Can infernal, Huargo (inazuma.fandom: fire, dribble, «Garras llameantes», talent «Impulso de regate X»), Vulpeen's
  { id: 'huargo', name: 'Huargo', title: 'Can infernal, Huargo', element: 'Fuego', type: 'regate', color: '#ff5a2a',
    holders: [{ id: 100678, name: 'Wolfram Vulpeen' }, { id: 100398, name: 'Vulpeen MM' }],
    tech: tech(990011, 'Garras llameantes', 'Fuego', 'regate', 125, 'Huargo sale de una espiral de fuego con las fauces abiertas y rastrilla el suelo: tres zarpazos de fuego corren hacia el rival y dejan una fila de llamas que sigue quemando.'),
    passive: { name: 'Impulso de regate X', game: 'Mejora mucho el regate de todos los jugadores del equipo.',
      text: (k) => `+${pct(0.08 * k)} daño de los regates de todo el equipo`, apply: (f, k) => addType(f, 'regate', 0.08 * k) } },
  // author: Portador del sol nocturno, Glenr (inazuma.fandom: mountain, dribble, «Rayo demoníaco», talent «Impulso de rapidez»), Drakul's
  { id: 'glenr', name: 'Glenr', title: 'Portador del sol nocturno, Glenr', element: 'Montaña', type: 'regate', color: '#7ad8ff',
    holders: [{ id: 101437, name: 'Desmodus Drakul' }, { id: 101652, name: 'Drakul MM' }],
    tech: tech(990012, 'Rayo demoníaco', 'Montaña', 'regate', 125, 'Glenr despliega sus alas, la noche cae sobre el campo y lanza desde la palma una esfera de rayos cian que estalla sobre el rival y salta a los que tiene alrededor.'),
    passive: { name: 'Impulso de rapidez', game: 'Mejora la rapidez de todos los jugadores del equipo en 10 puntos.',
      text: (k) => `+${pct(0.03 * k)} velocidad para todo el equipo`, apply: (f, k) => { f.speed += 0.03 * k; } } },
  // author: Adalid leonino, Jmet (inazuma.fandom: mountain, dribble, «Zarpazo real», talent «Grito de guerra»), Jaden's
  { id: 'jmet', name: 'Jmet', title: 'Adalid leonino, Jmet', element: 'Montaña', type: 'regate', color: '#e8c050',
    holders: [{ id: 900100, name: 'Jaden Evans' }],
    tech: tech(990010, 'Zarpazo real', 'Montaña', 'regate', 125, 'Jmet surge de una tormenta de arena, ruge y barre el campo con su garra de acero dorado: tres zarpazos de fuego que mandan a volar a todos los rivales que tiene delante.'),
    // «Grito de guerra»: stronger the more boys there are on the team (author: genders from the ROM's catalog)
    passive: { name: 'Grito de guerra', game: 'Su invocador es más fuerte cuantos más compañeros masculinos tenga.',
      text: (k) => `+${pct(0.03 * k)} daño de todas las técnicas de todo el equipo por cada chico en el campo (las Auras chico también cuentan)`, apply: (f, k, team) => { f.team += 0.03 * k * team.male; } } },
  // 2.0 (author): Caballero Lancelot (guiasnintendo: fire, «Estocada de Lancelot», talent «Llamas danzantes»)
  { id: 'lancelot', name: 'Lancelot', title: 'Caballero Lancelot', element: 'Fuego', type: 'tiro', color: '#c8ccd6',
    holders: [{ id: 100562, name: 'Victor Blade' }, { id: 900001, name: 'Levi Ackerman' }],
    tech: tech(990009, 'Estocada de Lancelot', 'Fuego', 'tiro', 125, 'El caballero Lancelot alza su espada y la hunde con el balón: una estocada de fuego que atraviesa la defensa.'),
    passive: elemPassive('Llamas danzantes', 'Mejora el efecto de las supertécnicas de fuego de todos los jugadores.', 'Fuego') },
  { id: 'musashi', name: 'Musashi', title: 'Bravo samurái Musashi', element: 'Montaña', type: 'tiro', color: '#ffcf6b',
    holders: [{ id: 102276, name: 'Ryoma Nishiki' }, { id: 100797, name: 'Aiden Froste' }], // author: Aiden too; Jaden now calls Jmet
    tech: tech(990007, 'Estocada samurái', 'Montaña', 'tiro', 125, 'Musashi surge del humo, desenvaina sus dos katanas y corta el campo con una X roja: todo rival que corta cae (a los jefes les quita un buen trozo de vida).'),
    passive: elemPassive('Cordillera infranqueable', 'Mejora el efecto de las supertécnicas de montaña de todos los jugadores.', 'Montaña') },
  // 2.1 (author): Rey de los empollones, Papelín (inazuma.fandom: forest, catch, «Descarga de colores»; only Mecha-Mark
  // calls it). The games: «protege a aquellos cuyo objetivo en la vida es aprender» — here the whole team learns faster
  { id: 'papelin', name: 'Papelín', title: 'Rey de los empollones, Papelín', element: 'Bosque', type: 'parada', color: '#ff4a3a',
    holders: [{ id: 101678, name: 'Mecha-Mark' }],
    tech: tech(990014, 'Descarga de colores', 'Bosque', 'parada', 125, 'Papelín alza su revólver de lápices de colores: unas miras cian fijan los tiros rivales y a los rivales más cercanos, y una ráfaga de disparos de colores los barre; la explosión de colores se traga los tiros alrededor del portero. Cura al equipo.'),
    passive: { name: 'Afán de saber', game: 'Protege a aquellos cuyo objetivo en la vida es aprender.',
      text: (k) => `+${pct(0.05 * k)} experiencia para todo el equipo`, apply: (f, k) => { f.xp += 0.05 * k; } } },
  { id: 'pegaso', name: 'Pegaso', title: 'Pegaso alado', element: 'Aire', type: 'regate', color: '#8fd3ff',
    holders: [{ id: 100538, name: 'Arion Sherwind' }],
    tech: tech(990008, 'Rayo celeste', 'Aire', 'regate', 120, 'Pegaso sube a las nubes de tormenta y descarga un rayo celeste sobre el rival mientras el balón le pasa por al lado.'),
    passive: elemPassive('Brisa vigorosa', 'Mejora el efecto de las supertécnicas de aire de todos los jugadores.', 'Aire') },
  // Cronus Fourseasons also calls Surtur in the games; he is not in the roster yet (add him here when he is)
  { id: 'surtur', name: 'Surtur', title: 'Gigante de fuego, Surtur', element: 'Fuego', type: 'tiro', color: '#ff5a2a',
    holders: [{ id: 10, name: 'Axel Blaze' }, { id: 1085, name: 'Axel Blaze Encapuchado' }],
    // the same technique Axel already knows: the spirit makes his own one stronger (techFor)
    tech: tech(262, 'Tormenta de fuego', 'Fuego', 'tiro', 125, '¡Desata una tempestad flamígera! Surtur la convierte en un infierno: abre los brazos en un anillo de fuego, la bola de fuego estalla en tornados de llamas alrededor del rival y el suelo sigue ardiendo.'),
    passive: elemPassive('Llamas danzantes', 'Mejora el efecto de las supertécnicas de fuego de todos los jugadores.', 'Fuego') },
  // 2.1 (author): Príncipe del plano astral, Zodíaco (inazuma.fandom: mountain, shot, «Prisión escarlata»), Zanark's.
  // The games: «una oscura energía dirige sus disparos» — here the team's shots curse the rivals they hit
  { id: 'zodiaco', name: 'Zodíaco', title: 'Príncipe del plano astral, Zodíaco', element: 'Montaña', type: 'tiro', color: '#ff1a3a',
    holders: [{ id: 100242, name: 'Zanark Avalonic' }, { id: 100952, name: 'Zanark + Cao Cao' }], // author: every Zanark, Mixi Max too
    tech: tech(990015, 'Prisión escarlata', 'Montaña', 'tiro', 130, 'Zodíaco alza su garra y el balón queda encerrado en un cristal rojo que sale disparado: donde cae, cada rival de alrededor queda preso en su propio cristal escarlata (los jefes solo se frenan) y todos estallan a la vez.'),
    passive: { name: 'Energía oscura', game: 'Una oscura energía dirige sus disparos.',
      text: (k) => `+${pct(0.04 * k)} daño de los tiros y ${pct(0.03 * k)} de probabilidad de maldecir al rival para todo el equipo`, apply: (f, k) => { addType(f, 'tiro', 0.04 * k); f.curse += 0.03 * k; } } },
];

/** (author) every spirit's colour goes by its affinity: the menus, the frames, the ult banner and its ring all use it */
export const KESHIN_ELEMENT_COLOR: Record<KeshinDef['element'], string> = { Fuego: '#ff5a1f', Aire: '#5ad8ff', 'Montaña': '#e0a83a', Bosque: '#4ee05a' };
for (const k of KESHINS) k.color = KESHIN_ELEMENT_COLOR[k.element];
/** the CSS class of a spirit's affinity (frames: styleEgFrames.css) */
export const keshinElClass = (k: Pick<KeshinDef, 'element'>) => `el-${k.element === 'Montaña' ? 'montana' : k.element.toLowerCase()}`;
export const KESHIN_BY_ID = new Map(KESHINS.map((k) => [k.id, k]));
const BY_HOLDER = new Map(KESHINS.flatMap((k) => k.holders.map((h) => [h.id, k] as const)));

/** the warrior spirit this footballer can call (null: none) */
export const keshinOf = (id: number) => BY_HOLDER.get(id) ?? null;
/** level of his spirit (0 = not unlocked) */
export const keshinLevel = (save: SaveData, id: number) => (keshinOf(id) ? Math.max(0, Math.min(KESHIN_MAX, Math.floor(save.keshin?.[String(id)] ?? 0))) : 0);
export const egTokens = (save: SaveData) => save.egTokens ?? 0;
/** Fichas EG for the next level (null at Ω) */
export const nextCost = (save: SaveData, id: number) => { const lv = keshinLevel(save, id); return lv >= KESHIN_MAX ? null : keshinStepCost(lv + 1); };

export type KeshinBuy = 'ok' | 'none' | 'notOwned' | 'max' | 'poor';
export function canLevel(save: SaveData, id: number): KeshinBuy {
  if (!keshinOf(id)) return 'none';
  if (!save.owned[String(id)]) return 'notOwned';
  const c = nextCost(save, id);
  if (c === null) return 'max';
  return egTokens(save) < c ? 'poor' : 'ok';
}
/** Unlocks (level I) or raises the spirit one level, paying its Fichas EG; returns the new level or the reason it can't. */
export function levelKeshin(save: SaveData, id: number): number | KeshinBuy {
  const why = canLevel(save, id);
  if (why !== 'ok') return why;
  const lv = keshinLevel(save, id) + 1;
  save.egTokens = egTokens(save) - keshinStepCost(lv);
  (save.keshin ??= {})[String(id)] = lv;
  return lv;
}

/** the supertechnique at a level: +6% power per level over level I */
export const techPower = (k: KeshinDef, level: number) => Math.round(k.tech.power * (1 + 0.06 * Math.max(0, level - 1)));
export const techFor = (k: KeshinDef, level: number): Technique => ({ ...k.tech, power: techPower(k, level) });

/** the stat bonus: +pct of the stat its technique uses, e.g. { key: 'kick', pct: 0.11 } */
export const statBonus = (k: KeshinDef, level: number) => ({ key: STAT_OF_TYPE[k.type] ?? 'kick', pct: KESHIN_STAT_PCT[Math.max(0, Math.min(KESHIN_MAX, level))] });
/** stats with the spirit's bonus (no cap: a spirit goes over 99, like an Aura) */
export function withKeshinStats<T extends Record<string, number>>(stats: T, k: KeshinDef | null, level: number): T {
  if (!k || level <= 0) return stats;
  const b = statBonus(k, level);
  return { ...stats, [b.key]: Math.round((stats[b.key] ?? 0) * (1 + b.pct)) };
}

/** What a footballer brings to a run with his spirit (attached to the run copy of his RosterEntry). */
export interface KeshinRun { id: KeshinId; level: number }

/** (author: «las ultis con la R») the spirit's technique is an ultimate the player fires himself: it is never in the
 *  repertoire (no slot, no level-up card), only this link, and ArenaScene casts it from KESHIN_ULT */
export function keshinForRun(entry: RosterEntry, level: number): RosterEntry {
  const k = keshinOf(entry.id);
  if (!k || level <= 0) return entry;
  return { ...entry, keshin: { id: k.id, level } };
}

/** the ultimate of a run link: its technique at that level */
export function ultTech(link: KeshinRun): Technique | null {
  const k = KESHIN_BY_ID.get(link.id);
  return k ? techFor(k, link.level) : null;
}
/** share of the cooldown (perks.ultCooldownSec: 30 s, 15 s fully upgraded) before the first ultimate of a run */
export const ULT_FIRST_SHARE = 0.5;
/** the technique level the ultimate's numbers use (techStats), from the spirit's level */
export const ultTechLevel = (level: number) => Math.min(10, Math.round(Math.max(1, level) * 1.7));

/** The passive of a spirit on the pitch (ArenaScene.talents). */
export function applyKeshin(f: TalentFx, link: KeshinRun | undefined, team: TeamGenders = { male: 0, female: 0 }) {
  const k = link && KESHIN_BY_ID.get(link.id);
  if (k) k.passive.apply(f, KESHIN_SCALE[Math.max(1, Math.min(KESHIN_MAX, link.level))], team);
}
export const passiveText = (k: KeshinDef, level: number) => k.passive.text(KESHIN_SCALE[Math.max(1, Math.min(KESHIN_MAX, level))]);

/** The one-time 2.0 intro (save.egGift20); true the first time. */
export function giveKeshinGift(save: SaveData): boolean {
  if (save.egGift20) return false;
  save.egGift20 = true; // now only marks that the 2.0 intro was shown
  save.egTokens = egTokens(save) + KESHIN_GIFT;
  return true;
}
