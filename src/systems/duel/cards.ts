/**
 * Modo Duelo (author: «un modo como el nanatsu, pero que se vea en partida como el hearthstone»): the closed list of 50
 * footballers, each with 2 technique cards and 1 ulti, as the rules engine reads them (rules.ts). The design lives in the
 * author's doc «InaZurvivors — Modo Duelo: reglamento»; every technique here is one the footballer has in the game
 * (tests/duel.test.ts checks it against the manifest).
 */
import type { Rarity } from '../../data/manifest';

export type CardKind = 'ataque' | 'area' | 'debilitar' | 'mejora' | 'recuperacion' | 'postura' | 'especial';
export type StatusId = 'quemadura' | 'congelado' | 'electrizado' | 'aturdido' | 'provocar';
export type Cond = 'targetHasStatus' | 'targetFrozen' | 'targetElectrified' | 'targetGK' | 'targetLowestHp' | 'lastEnemy'
  | 'targetTaunt' | 'selfHpBelow50' | 'selfHpAbove70' | 'firstCard' | 'lastAction' | 'fwCardsInHand2';
export type Per = 'ownCardsInHand' | 'groupCardsInHand' | 'r3InHand' | 'alliesAlive' | 'ownCardsUsedThisTurn';

/** one effect; `min` = the lowest rank it works at (default 1) */
export type Fx = { min?: 1 | 2 | 3 } & (
  | { do: 'status'; s: StatusId; turns?: number; sure?: boolean }
  | { do: 'gale' } // the target's side gets 1 card less next turn
  | { do: 'pierce'; pct: number } | { do: 'ignoreStance' } | { do: 'ignoreTaunt' } | { do: 'ignoreDef' }
  | { do: 'bonusIf'; cond: Cond; pct: number } | { do: 'bonusPer'; per: Per; pct: number }
  | { do: 'critBonus'; pct: number } | { do: 'critSure' } | { do: 'hits'; n: number; each: number } | { do: 'randomHits'; n: number }
  | { do: 'repeatOnCrit' } | { do: 'selfDamage'; pct: number } | { do: 'actionOnKo' } | { do: 'alwaysAdvantage' }
  | { do: 'rankDown'; who: 'target' | 'eachEnemy' | 'allOfTarget'; n?: number } | { do: 'seal'; n: number } | { do: 'destroy'; minRank: number }
  | { do: 'stealGauge'; n: number; each?: boolean } | { do: 'decoys'; n: number } | { do: 'faceDown' } | { do: 'enemyActions'; n: number }
  | { do: 'shield'; who: 'all' | 'ally' | 'self'; pct: [number, number, number] } | { do: 'heal'; who: 'all' | 'ally' | 'self'; pct: [number, number, number] }
  | { do: 'block'; who: 'ally' | 'team'; n: [number, number, number]; reflect?: number; rankDownAttacker?: boolean; gaugeSelf?: number }
  | { do: 'dodge'; n: [number, number, number]; stealGauge?: number; gaugeSelf?: number }
  | { do: 'counter'; mult: number; guardsTaunt?: boolean } | { do: 'reflect'; pct: number; burn?: boolean } | { do: 'endure' }
  | { do: 'reduce'; scope: 'area' | 'all'; pct: number } | { do: 'mine'; mult: number } | { do: 'statusGuard' } | { do: 'immune' }
  | { do: 'cleanse' } | { do: 'dispel' } | { do: 'taunt'; turns: [number, number, number]; defPct?: number }
  | { do: 'buff'; who: 'team' | 'self'; stat: 'atk'; pct: [number, number, number]; turns?: number }
  | { do: 'debuff'; stat: 'atk' | 'def' | 'atkdef'; pct: number; turns?: number; area?: boolean }
  | { do: 'vulnerable'; pct: number } | { do: 'noHeal' } | { do: 'blind'; pct: number }
  | { do: 'rankUp'; which: 'other' | 'random' | 'right' | 'allOwn' | 'allMine'; n?: number; players?: number[] }
  | { do: 'createCard'; rank: number } | { do: 'freeMoves'; n: number } | { do: 'freeSwap' } | { do: 'extraAction'; n: number }
  | { do: 'chooseNext'; n: number } | { do: 'gaugeSelf'; n: number } | { do: 'gaugeAllies'; n: number } | { do: 'gaugeTo'; pid: number; n: number }
  | { do: 'peekSeal' } | { do: 'mergeBoost' } | { do: 'cardsSealedUse' } | { do: 'selfStun' }
);

export interface CardSpec { tech: string; kind: CardKind; fx: Fx[]; mult?: [number, number, number] }
export interface UltiSpec { tech: string; area?: boolean; mult: number; fx: Fx[] }
export type DuelGroup = 'Inazuma Japan' | 'Royal Academy' | 'Alius y Zeus' | 'Selecciones' | 'Raimon GO' | 'Protocolo Omega'
  | 'Héroes de la historia' | 'Zero y Zan' | 'Ares y Orion';
export interface DuelPlayer { id: number; group: DuelGroup; cards: [CardSpec, CardSpec]; ulti: UltiSpec; mixiMax?: boolean; family?: number }

/**
 * Passives (author: «añádeles pasivas a cada una de las cartas, basándote en las que hay en Grand Cross y
 * balanceándolas»; then «cúrratelas, que sean un poco más complejas algunas y que no se repitan a no ser que sea la
 * misma forma de personaje»): each footballer has his own, made of one or two parts, always on while he plays, of the
 * kinds Grand Cross heroes have: stats, something every turn, a trigger (a K.O., a fall below half PV, a rival's ulti),
 * a team aura, a last stand. None needs particular team mates (author: «que no se tenga que depender de jugadores»).
 * Only the forms of one character (Arion, Victor, Zanark) share theirs. rules.ts applies them; tools/duel_balance.ts
 * then evened the footballers out with them on.
 */
export type Passive =
  | { do: 'atk' | 'def' | 'hp' | 'crit' | 'critDmg' | 'resist'; pct: number } // his own stats (crit / resist: points)
  | { do: 'gaugeStart' | 'turnGauge' | 'koGauge' | 'enemyUltiGauge'; n: number } // Garra: at the start / every turn / per K.O. / when a rival uses his ulti
  | { do: 'turnHeal' | 'turnShield' | 'benchHeal'; pct: number } // every turn of his side (benchHeal: while on the bench)
  | { do: 'takeLess' | 'areaLess' | 'teamDef' | 'guardian' | 'teamAtk'; pct: number } // damage taken; his mates' ATK
  | { do: 'lowHpAtk' | 'vsStatus' | 'elemPlus' | 'ultiPlus' | 'firstCard' | 'vsGK' | 'shieldBreaker'; pct: number } // damage dealt in some case
  | { do: 'execute'; pct: number; below: number } // more damage to a rival under `below` % of his PV
  | { do: 'lifesteal' | 'thorns' | 'koHealTeam'; pct: number } // a share back to him / to the attacker; his team healed when he knocks one out
  | { do: 'stackAtk'; pct: number; max: number } // every card he uses: ATK up for the match, up to `max` times
  | { do: 'allyKoRage'; pct: number; n: number } // a team mate falls: ATK up for the match and orbs
  | { do: 'secondWind'; heal: number; shield: number } // the first time he falls under half his PV
  | { do: 'ultiStatus'; s: StatusId } // his ulti also leaves this status on what it hits
  | { do: 'statusImmune'; s: StatusId } | { do: 'cleanseTurn' } | { do: 'doubleStatus' } // a status he never takes / shaken off every turn / his last a turn more
  | { do: 'critSteal'; n: number } | { do: 'everyThird' } // his criticals steal orbs / every third card of his is a sure critical
  | { do: 'lastStand' } | { do: 'rankStart' }; // once a match a blow leaves him at 1 PV / every turn one of his cards climbs a rank
export const DUEL_PASSIVE: Record<number, Passive[]> = {
  1: [{ do: 'lastStand' }, { do: 'teamDef', pct: 5 }], // Mark: the captain never gives up, and covers them all
  10: [{ do: 'firstCard', pct: 25 }, { do: 'ultiStatus', s: 'quemadura' }], // Axel: opens the scoring; Tormenta de fuego burns
  29: [{ do: 'rankStart' }, { do: 'shieldBreaker', pct: 20 }], // Jude: the playmaker reads the defence
  1513: [{ do: 'ultiStatus', s: 'congelado' }, { do: 'vsStatus', pct: 20 }], // Shawn: Ventisca eterna freezes, then he breaks them
  2: [{ do: 'everyThird' }], // Nathan: speed finds the gap every third card
  3: [{ do: 'takeLess', pct: 10 }, { do: 'areaLess', pct: 25 }], // Jack: the wall
  1567: [{ do: 'thorns', pct: 15 }], // Hurley: the wave comes back
  1541: [{ do: 'koGauge', n: 2 }, { do: 'critSteal', n: 1 }], // Caleb: ruthless
  1532: [{ do: 'teamDef', pct: 8 }, { do: 'statusImmune', s: 'aturdido' }], // King (Redux): the forbidden wall does not flinch
  1542: [{ do: 'lowHpAtk', pct: 35 }], // Samford (Redux): forbidden techniques, at any price
  20: [{ do: 'turnShield', pct: 7 }], // King: Escudo de fuerza
  30: [{ do: 'atk', pct: 6 }, { do: 'execute', pct: 20, below: 50 }], // Samford: the Emperor Penguin finishes them
  157: [{ do: 'gaugeStart', n: 2 }, { do: 'secondWind', heal: 15, shield: 0 }], // Byron: the Néctar de los Dioses
  101722: [{ do: 'ultiPlus', pct: 25 }, { do: 'enemyUltiGauge', n: 1 }], // Xavier: Descenso estelar; he answers every ulti
  1370: [{ do: 'elemPlus', pct: 20 }, { do: 'statusImmune', s: 'congelado' }], // Gazelle: ice does not stop him
  1371: [{ do: 'critDmg', pct: 25 }, { do: 'statusImmune', s: 'quemadura' }], // Torch: fire does not burn him
  1548: [{ do: 'hp', pct: 15 }, { do: 'benchHeal', pct: 8 }], // Darren
  1024: [{ do: 'secondWind', heal: 20, shield: 10 }], // Erik: back from the injury
  101719: [{ do: 'execute', pct: 30, below: 35 }], // Austin: the tiger finishes them
  101894: [{ do: 'def', pct: 15 }, { do: 'cleanseTurn' }], // Helio
  100773: [{ do: 'guardian', pct: 15 }, { do: 'hp', pct: 8 }], // David: the legend in goal covers the weakest
  101855: [{ do: 'teamAtk', pct: 6 }], // Bianchi: Himno de Atenea
  101838: [{ do: 'crit', pct: 12 }, { do: 'critDmg', pct: 15 }], // Krueger
  101791: [{ do: 'ultiPlus', pct: 30 }], // Partinus: Excalibur
  101775: [{ do: 'vsGK', pct: 30 }, { do: 'elemPlus', pct: 10 }], // Choi: the dragon goes for the goal
  101871: [{ do: 'lifesteal', pct: 15 }], // Robingo: samba
  100538: [{ do: 'stackAtk', pct: 4, max: 5 }], // Arion: the wind builds up
  101520: [{ do: 'stackAtk', pct: 6, max: 5 }], // Arion Miximax: the same wind, stronger
  100562: [{ do: 'critSteal', n: 1 }, { do: 'koGauge', n: 1 }], // Victor
  101004: [{ do: 'critSteal', n: 1 }, { do: 'koGauge', n: 2 }], // Victor Miximax: the same, stronger
  100728: [{ do: 'turnShield', pct: 4 }, { do: 'resist', pct: 20 }], // JP
  100580: [{ do: 'firstCard', pct: 30 }], // Falco
  100427: [{ do: 'doubleStatus' }, { do: 'gaugeStart', n: 1 }], // Fei: his tricks last longer
  100944: [{ do: 'critDmg', pct: 30 }], // Bailong
  100303: [{ do: 'vsStatus', pct: 30 }], // Tezcat
  100242: [{ do: 'lowHpAtk', pct: 25 }, { do: 'allyKoRage', pct: 15, n: 1 }], // Zanark: rage
  100952: [{ do: 'lowHpAtk', pct: 25 }, { do: 'allyKoRage', pct: 20, n: 1 }], // Zanark Miximax: the same rage, stronger
  102307: [{ do: 'atk', pct: 12 }], // Beta
  101572: [{ do: 'resist', pct: 40 }], // Alpha: no emotions
  100487: [{ do: 'shieldBreaker', pct: 40 }], // Gamma
  100739: [{ do: 'elemPlus', pct: 30 }], // Sol: the sun
  101308: [{ do: 'gaugeStart', n: 2 }], // Ichihoshi
  100405: [{ do: 'turnHeal', pct: 4 }], // Gabi: Trance melódico
  102185: [{ do: 'areaLess', pct: 30 }, { do: 'def', pct: 8 }], // Sam
  101505: [{ do: 'teamAtk', pct: 5 }, { do: 'takeLess', pct: 5 }], // Arthur: the king leads from the front
  100382: [{ do: 'allyKoRage', pct: 15, n: 2 }], // Nobunaga
  101488: [{ do: 'turnGauge', n: 1 }], // Zhuge: the strategist charges every turn
  100797: [{ do: 'ultiStatus', s: 'aturdido' }], // Aiden: Furia de oso
  101504: [{ do: 'koHealTeam', pct: 10 }], // Asuto
  100979: [{ do: 'lifesteal', pct: 10 }, { do: 'critDmg', pct: 15 }], // Haizaki
  100905: [{ do: 'enemyUltiGauge', n: 2 }], // Nosaka: reads the rival
  100907: [{ do: 'crit', pct: 15 }], // Kira
};
/** a footballer's passive parts (empty: none) */
export const passivesOf = (pid: number): Passive[] => DUEL_PASSIVE[pid] ?? [];
/** the part of this kind of his passive, if he has one */
export type PassivePart<K extends Passive['do']> = Passive extends infer P ? P extends { do: infer D } ? K extends D ? Omit<P, 'do'> & { do: K } : never : never : never;
export const passive = <K extends Passive['do']>(pid: number, k: K): PassivePart<K> | undefined =>
  passivesOf(pid).find((p) => p.do === k) as PassivePart<K> | undefined;

const c = (tech: string, kind: CardKind, ...fx: Fx[]): CardSpec => ({ tech, kind, fx });
const u = (tech: string, mult: number, ...fx: Fx[]): UltiSpec => ({ tech, mult, fx });
const ua = (tech: string, mult: number, ...fx: Fx[]): UltiSpec => ({ tech, mult, area: true, fx });
const P = (id: number, group: DuelGroup, a: CardSpec, b: CardSpec, ulti: UltiSpec, extra: Partial<DuelPlayer> = {}): DuelPlayer => ({ id, group, cards: [a, b], ulti, ...extra });

export const DUEL_PLAYERS: DuelPlayer[] = [
  P(1, 'Inazuma Japan', c('Mano mágica', 'postura', { do: 'block', who: 'ally', n: [1, 1, 1] }, { do: 'block', who: 'ally', n: [1, 1, 1], reflect: 50, min: 3 }),
    c('Superpuño invencible', 'debilitar', { do: 'rankDown', who: 'target' }), u('Mano celestial', 0, { do: 'shield', who: 'all', pct: [30, 30, 30] }, { do: 'taunt', turns: [2, 2, 2] })),
  P(10, 'Inazuma Japan', c('Tornado de fuego', 'ataque', { do: 'bonusPer', per: 'ownCardsInHand', pct: 15 }),
    c('Trampolín relámpago', 'ataque', { do: 'status', s: 'electrizado', min: 2 }), ua('Tormenta de fuego', 3, { do: 'status', s: 'quemadura' })),
  P(29, 'Royal Academy', c('Espejismo de balón', 'especial', { do: 'rankUp', which: 'other' }),
    c('Corte giratorio', 'debilitar', { do: 'debuff', stat: 'def', pct: 20 }), u('Empuje trillizo', 5, { do: 'gaugeAllies', n: 1 })),
  P(1513, 'Inazuma Japan', c('Regate aurora', 'postura', { do: 'dodge', n: [1, 1, 2] }),
    c('Chut congelante', 'ataque', { do: 'status', s: 'congelado', min: 3 }), u('Ventisca eterna', 5, { do: 'status', s: 'congelado' }) /* ×2 on a frozen rival: the general «rompe el hielo» */),
  // Nathan (balance 2026-11-19: 38 % even at the stats cap; his kit did no damage): the tackle now hits and steals
  P(2, 'Inazuma Japan', c('Entrada huracán', 'ataque', { do: 'stealGauge', n: 1 }, { do: 'stealGauge', n: 1, min: 3 }),
    c('Defensa múltiple', 'postura', { do: 'reduce', scope: 'all', pct: 30 }), u('Pájaro de fuego', 5, { do: 'ignoreStance' }, { do: 'gaugeAllies', n: 1 })),
  P(3, 'Inazuma Japan', c('El muro', 'postura', { do: 'taunt', turns: [1, 2, 3], defPct: 30 }),
    c('Regate topo', 'debilitar', { do: 'status', s: 'aturdido', min: 2 }), ua('Presa', 2, { do: 'debuff', stat: 'atk', pct: 40 })),
  P(1567, 'Inazuma Japan', c('Remate tsunami', 'area', { do: 'rankDown', who: 'eachEnemy', min: 3 }),
    c('Bloqueo ballena', 'postura', { do: 'counter', mult: 1.5, guardsTaunt: true }), ua('Gran tifón', 3, { do: 'gale' })),
  P(1541, 'Royal Academy', c('Engaño yoyó', 'debilitar', { do: 'seal', n: 1 }, { do: 'seal', n: 1, min: 3 }),
    c('Barrido defensivo', 'area', { do: 'bonusIf', cond: 'targetHasStatus', pct: 50 }), u('Coz 2', 5, { do: 'status', s: 'aturdido' })),
  P(1532, 'Royal Academy', c('Escudo de fuerza total', 'recuperacion', { do: 'shield', who: 'all', pct: [15, 25, 40] }),
    c('Destrozataladros', 'postura', { do: 'block', who: 'team', n: [1, 1, 1], rankDownAttacker: true }), u('Colmillo de pantera', 4, { do: 'taunt', turns: [2, 2, 2] })),
  P(1542, 'Royal Academy', c('Pingüino emp. n.º 2', 'ataque', { do: 'bonusPer', per: 'groupCardsInHand', pct: 20 }),
    c('Avance flamígero', 'ataque', { do: 'ignoreStance' }), u('Pingüino emp. n.º 1', 6, { do: 'selfDamage', pct: 10 })),
  // 3.0 (author): King and Samford of the first Royal Academy (the cards above are their Royal Redux selves, with the
  // forbidden techniques); their kits are made of their own moves in the ROM, and each is one footballer with his Redux
  P(20, 'Royal Academy', c('Escudo de fuerza', 'postura', { do: 'block', who: 'team', n: [1, 1, 1] }, { do: 'block', who: 'team', n: [1, 1, 1], min: 3 }),
    c('Lance crítico', 'mejora', { do: 'buff', who: 'team', stat: 'atk', pct: [12, 18, 28] }),
    u('Escudo de fuerza total', 0, { do: 'shield', who: 'all', pct: [30, 30, 30] }, { do: 'taunt', turns: [2, 2, 2] }), { family: 1532 }),
  P(30, 'Royal Academy', c('Coz', 'debilitar', { do: 'debuff', stat: 'def', pct: 20 }),
    c('Fuerza ofensiva', 'mejora', { do: 'buff', who: 'team', stat: 'atk', pct: [15, 22, 35] }),
    u('Pingüino emp. n.º 2', 6, { do: 'bonusPer', per: 'groupCardsInHand', pct: 20 }), { family: 1542 }),
  P(157, 'Alius y Zeus', c('Hora celestial', 'especial', { do: 'seal', n: 1 }, { do: 'seal', n: 1, min: 2 }, { do: 'enemyActions', n: 1, min: 3 }),
    c('Sabiduría divina', 'ataque', { do: 'gaugeSelf', n: 1 }), u('Disparo sagrado', 5, { do: 'ignoreDef' })),
  P(101722, 'Alius y Zeus', c('Lluvia de meteoros', 'area', { do: 'randomHits', n: 3 }),
    c('Cañón de meteoritos', 'ataque', { do: 'pierce', pct: 30, min: 2 }), u('Descenso estelar', 5, { do: 'rankUp', which: 'allOwn' })),
  P(1370, 'Alius y Zeus', c('Bomba géiser', 'area', { do: 'gale', min: 2 }),
    c('Hora celestial', 'especial', { do: 'rankDown', who: 'eachEnemy' }), u('Balón Iceberg', 5, { do: 'status', s: 'congelado', sure: true })),
  P(1371, 'Alius y Zeus', c('Pantalla ígnea', 'postura', { do: 'reflect', pct: 30, burn: true }),
    c('Remolino ígneo', 'area', { do: 'bonusIf', cond: 'targetFrozen', pct: 60 }, { do: 'status', s: 'quemadura' }), u('Llamarada atómica', 5, { do: 'status', s: 'quemadura', turns: 3 })),
  P(1548, 'Inazuma Japan', c('Mano mágica', 'postura', { do: 'block', who: 'ally', n: [1, 1, 1] }),
    c('Paipay gigante', 'debilitar', { do: 'gale' }), u('Manos infinitas', 0, { do: 'shield', who: 'all', pct: [35, 35, 35] }, { do: 'immune' })),
  P(1024, 'Selecciones', c('Espejismo de balón', 'especial', { do: 'freeMoves', n: 2 }),
    c('Baile de llamas', 'debilitar', { do: 'status', s: 'quemadura', min: 2 }), u('Fénix', 4, { do: 'heal', who: 'self', pct: [20, 20, 20] })),
  P(101719, 'Inazuma Japan', c('Remate del tigre', 'ataque', { do: 'bonusIf', cond: 'fwCardsInHand2', pct: 25 }),
    c('Cortafuegos', 'postura', { do: 'statusGuard' }), u('Colmillo retorcido', 5, { do: 'rankDown', who: 'allOfTarget' })),
  P(101894, 'Selecciones', c('Mano espiritual', 'recuperacion', { do: 'heal', who: 'ally', pct: [15, 25, 40] }),
    c('Ataque cortante', 'debilitar', { do: 'debuff', stat: 'atk', pct: 25 }), u('Mano celestial X', 0, { do: 'shield', who: 'all', pct: [40, 40, 40] }, { do: 'taunt', turns: [2, 2, 2] })),
  P(100773, 'Selecciones', c('Bimano celestial', 'postura', { do: 'block', who: 'team', n: [2, 2, 2] }),
    c('Bloque de hielo', 'ataque', { do: 'status', s: 'congelado', min: 2 }), u('Mano celestial X', 0, { do: 'shield', who: 'all', pct: [50, 50, 50] }, { do: 'gaugeAllies', n: 2 })),
  P(101855, 'Selecciones', c('Himno de Atenea', 'mejora', { do: 'buff', who: 'team', stat: 'atk', pct: [20, 30, 45] }),
    c('Espada de Odín', 'ataque', { do: 'pierce', pct: 30 }), u('Disparo doble', 0, { do: 'hits', n: 2, each: 3 })),
  P(101838, 'Selecciones', c('Ultra lunar', 'especial', { do: 'createCard', rank: 2 }),
    c('Leopardo de la ventisca', 'ataque', { do: 'status', s: 'congelado', min: 3 }), u('Remate Pegaso', 5, { do: 'extraAction', n: 1 })),
  P(101791, 'Selecciones', c('Ataque de paladín', 'ataque', { do: 'bonusIf', cond: 'targetGK', pct: 30 }),
    c('Viento celestial', 'area', { do: 'gale', min: 2 }), u('Excalibur', 5, { do: 'ignoreTaunt' }, { do: 'bonusIf', cond: 'selfHpAbove70', pct: 50 })),
  P(101775, 'Selecciones', c('Rizo de dragón', 'ataque', { do: 'pierce', pct: 25, min: 2 }),
    c('Tiro Torre de Osaka', 'ataque', { do: 'bonusIf', cond: 'lastAction', pct: 30 }), ua('Dragón terrestre', 3, { do: 'status', s: 'aturdido' })),
  P(101871, 'Selecciones', c('Golpe de samba', 'ataque', { do: 'rankUp', which: 'right' }),
    c('Regate supersónico', 'postura', { do: 'dodge', n: [1, 1, 1] }), u('Súper elástica', 4, { do: 'gaugeAllies', n: 1 })),
  P(100538, 'Raimon GO', c('Brisa deslizante', 'especial', { do: 'freeMoves', n: 1 }, { do: 'mergeBoost' }),
    c('Túnel tornado', 'postura', { do: 'dodge', n: [1, 1, 1], stealGauge: 1 }), ua('Tormenta, tornado, huracán', 3, { do: 'rankUp', which: 'allMine' }), { family: 100538 }),
  P(100562, 'Raimon GO', c('Avance chispeante', 'ataque', { do: 'status', s: 'electrizado', min: 2 }),
    c('Aguijón letal', 'ataque', { do: 'critSure', min: 3 }), u('Tiro sobrenatural', 5, { do: 'bonusPer', per: 'ownCardsUsedThisTurn', pct: 30 }), { family: 100562 }),
  P(100728, 'Raimon GO', c('Mano celestial V', 'postura', { do: 'block', who: 'ally', n: [1, 1, 2] }),
    c('Manos infinitas', 'recuperacion', { do: 'shield', who: 'all', pct: [12, 20, 32] }), u('Cohete al espacio', 4, { do: 'taunt', turns: [1, 1, 1] })),
  P(100580, 'Raimon GO', c('Taconazo parkour', 'ataque', { do: 'ignoreTaunt' }),
    c('Patín aéreo', 'postura', { do: 'dodge', n: [1, 1, 1] }), u('Remate celestial', 5, { do: 'bonusIf', cond: 'lastEnemy', pct: 100 })),
  P(100427, 'Raimon GO', c('Pasos aéreos', 'postura', { do: 'dodge', n: [1, 1, 1], gaugeSelf: 1 }),
    c('Proyectil de ozono', 'area', { do: 'debuff', stat: 'def', pct: 15, area: true }), u('Despliegue de señuelos', 0, { do: 'decoys', n: 2 }, { do: 'seal', n: 2 })),
  P(100944, 'Zero y Zan', c('Ciclón blanco', 'area', { do: 'gale', min: 2 }),
    c('Regate supersónico', 'postura', { do: 'dodge', n: [1, 1, 1] }), u('Rizo de dragón', 5, { do: 'gaugeTo', pid: 100303, n: 2 })),
  P(100303, 'Zero y Zan', c('Ceniza negra', 'debilitar', { do: 'noHeal' }),
    c('Salto dimensional', 'especial', { do: 'freeSwap' }), ua('El ojo del huracán', 3, { do: 'stealGauge', n: 1, each: true })),
  P(100242, 'Zero y Zan', c('Caída planetaria', 'area', { do: 'status', s: 'aturdido', min: 3 }),
    c('Salto explosivo', 'ataque', { do: 'bonusIf', cond: 'selfHpBelow50', pct: 40 }), u('Golpe cataclismo', 6, { do: 'selfStun' }), { family: 100242 }),
  P(102307, 'Protocolo Omega', c('Barrena voladora', 'ataque', { do: 'pierce', pct: 25, min: 2 }),
    c('Disparo doble', 'ataque', { do: 'hits', n: 2, each: 0.6 }), u('Ataque Omega', 5, { do: 'rankUp', which: 'allOwn', players: [101572, 100487] })),
  P(101572, 'Protocolo Omega', c('Tiro rotativo', 'ataque', { do: 'repeatOnCrit' }),
    c('Mina terrestre', 'postura', { do: 'mine', mult: 1.5 }), u('Gol gaussiano', 5, { do: 'pierce', pct: 40 })),
  P(100487, 'Protocolo Omega', c('Círculo de hielo', 'debilitar', { do: 'status', s: 'congelado', min: 3 }),
    c('Formateo de disco', 'especial', { do: 'dispel' }, { do: 'rankDown', who: 'target' }), ua('Giro atómico', 3)),
  P(100739, 'Raimon GO', c('Luz cegadora', 'debilitar', { do: 'blind', pct: 50 }),
    c('Avance chispeante', 'ataque', { do: 'status', s: 'electrizado', min: 2 }), ua('Tormenta solar', 3, { do: 'status', s: 'quemadura' })),
  P(101308, 'Ares y Orion', c('Polvo de estrellas azul', 'especial', { do: 'rankUp', which: 'random', n: 2 }),
    c('Cruz del sur', 'postura', { do: 'reduce', scope: 'all', pct: 20 }), ua('Tormenta estelar', 3, { do: 'bonusPer', per: 'r3InHand', pct: 20 })),
  P(100405, 'Raimon GO', c('Niebla mística', 'debilitar', { do: 'faceDown' }),
    c('Trance melódico', 'recuperacion', { do: 'heal', who: 'all', pct: [10, 16, 25] }), u('Cruz del sur', 0, { do: 'shield', who: 'all', pct: [30, 30, 30] }, { do: 'cleanse' })),
  P(102185, 'Raimon GO', c('Manos liberadas', 'postura', { do: 'block', who: 'team', n: [1, 1, 1], gaugeSelf: 1 }),
    c('Barrera de Gaia', 'recuperacion', { do: 'shield', who: 'ally', pct: [25, 40, 60] }), u('Mano celestial X', 0, { do: 'shield', who: 'all', pct: [40, 40, 40] }, { do: 'reflect', pct: 30 })),
  P(101505, 'Héroes de la historia', c('Himno de Atenea', 'mejora', { do: 'buff', who: 'team', stat: 'atk', pct: [20, 30, 45] }),
    c('Espada de Odín', 'ataque', { do: 'pierce', pct: 30 }), u('Espada real', 5, { do: 'bonusIf', cond: 'targetTaunt', pct: 100 })),
  P(100382, 'Héroes de la historia', c('Furia de los elementos', 'ataque', { do: 'alwaysAdvantage' }),
    c('Dragón ascendente', 'mejora', { do: 'buff', who: 'self', stat: 'atk', pct: [25, 40, 60] }), u('Impulso efímero', 4, { do: 'bonusIf', cond: 'firstCard', pct: 50 })),
  P(101488, 'Héroes de la historia', c('Rapto divino', 'especial', { do: 'peekSeal' }),
    c('Hora celestial', 'debilitar', { do: 'debuff', stat: 'atkdef', pct: 20 }), ua('Tormenta eléctrica', 3, { do: 'bonusIf', cond: 'targetElectrified', pct: 100 }, { do: 'status', s: 'electrizado' })),
  P(101520, 'Raimon GO', c('Espada real', 'ataque', { do: 'pierce', pct: 50 }),
    c('Túnel tornado', 'postura', { do: 'dodge', n: [1, 1, 1], stealGauge: 1 }), ua('Tormenta, tornado, huracán', 4, { do: 'rankUp', which: 'allMine' }), { mixiMax: true, family: 100538 }),
  P(101004, 'Raimon GO', c('Katana crisantemo', 'ataque', { do: 'critBonus', pct: 30 }),
    c('Chut ancestral', 'ataque', { do: 'ignoreStance', min: 2 }), u('Tiro sobrenatural', 6, { do: 'gaugeSelf', n: 0 }), { mixiMax: true, family: 100562 }),
  P(100952, 'Zero y Zan', c('Estrella de roca', 'area', { do: 'status', s: 'aturdido', min: 2 }),
    c('Corte diabólico', 'debilitar', { do: 'vulnerable', pct: 20 }), ua('Golpe cataclismo', 4), { mixiMax: true, family: 100242 }),
  P(100797, 'Raimon GO', c('Círculo de hielo', 'debilitar', { do: 'status', s: 'congelado', min: 3 }),
    c('Abrazo del oso', 'postura', { do: 'endure' }), u('Furia de oso', 5, { do: 'status', s: 'aturdido' })),
  P(101504, 'Ares y Orion', c('Entrada relámpago', 'ataque', { do: 'status', s: 'electrizado', min: 2 }),
    c('Luz cegadora', 'debilitar', { do: 'blind', pct: 50 }), u('Amanecer detonante', 5, { do: 'bonusPer', per: 'alliesAlive', pct: 15 })),
  P(100979, 'Ares y Orion', c('Pingüino aéreo', 'ataque', { do: 'ignoreTaunt', min: 2 }),
    c('Tiburón de las profundidades', 'ataque', { do: 'bonusIf', cond: 'targetLowestHp', pct: 50 }, { do: 'actionOnKo' }), u('Pingüino perfecto', 5, { do: 'ignoreStance' })),
  P(100905, 'Ares y Orion', c('Proyectil de ozono', 'debilitar', { do: 'debuff', stat: 'def', pct: 20 }),
    c('Golpe de la luna creciente', 'ataque', { do: 'rankDown', who: 'target', min: 2 }), u('Lanza real', 5, { do: 'chooseNext', n: 2 })),
  P(100907, 'Ares y Orion', c('Zigzag veloz', 'ataque', { do: 'hits', n: 2, each: 0.6 }),
    c('Ataque meteorito', 'area', { do: 'bonusIf', cond: 'firstCard', pct: 0 }), u('El detonador', 5, { do: 'destroy', minRank: 2 })),
];
export const DUEL_BY_ID = new Map(DUEL_PLAYERS.map((p) => [p.id, p]));
/** a footballer and his Mixi Max form are the same player: a team takes only one of them (author) */
export const familyOf = (id: number) => DUEL_BY_ID.get(id)?.family ?? id;
export function sameFamily(pids: number[]) { const f = pids.map(familyOf); return new Set(f).size !== f.length; }

/** Kira Hiroto's Ataque meteorito: +30 % with Haizaki on the pitch (the one pairing the generic conditions don't cover) */
export const ALLY_ON_FIELD_BONUS: Record<string, { ally: number; pct: number }> = { '100907:1': { ally: 100979, pct: 30 } };

/** the game's combined techniques among the 50 (combos.ts): their cards side by side fuse into the combo */
export const DUEL_COMBOS: { name: string; players: number[] }[] = [
  { name: 'Campo de fuerza', players: [29, 1541] }, { name: 'Cometa legendario', players: [29, 10] },
  { name: 'Combo cósmico', players: [101722, 100907] }, { name: 'El huracán', players: [2, 1513] },
  { name: 'Frente frío', players: [1513, 100797] }, { name: 'Fuego cruzado', players: [10, 1513] },
  { name: 'Gran explosión', players: [100944, 100562] }, { name: 'La Aurora', players: [157, 100303] },
  { name: 'La Aurora', players: [101722, 1513] }, { name: 'Pingüinos de luz y sombra', players: [100979, 100907] },
  { name: 'Súper relámpago', players: [1, 10] }, { name: 'Tormenta del tigre', players: [10, 101719] },
  { name: 'Tornado dirección doble', players: [100538, 100562] }, { name: 'Ventisca de fuego', players: [1371, 1370] },
  { name: 'Zero Magnum', players: [100944, 100303] },
  { name: 'La Tierra', players: [1, 10, 1513] }, { name: 'Big Bang', players: [101722, 29, 1513] },
  { name: 'Fuego total', players: [101722, 101719, 10] }, { name: 'Remate caótico', players: [157, 1371, 1370] },
  { name: 'Ruptura relámpago', players: [29, 1, 10] }, { name: 'Tiro a reacción', players: [1, 10, 101719] },
  { name: 'Último recurso', players: [100905, 100979, 101504] },
];

/** the 5 coaches and their match passive (rules.ts applies them); `group` = whose players make it worth 50 % more */
export const DUEL_COACHES = [
  { id: 'hillman', groups: ['Inazuma Japan', 'Raimon GO'] as DuelGroup[] },
  { id: 'ray-dark', groups: ['Royal Academy'] as DuelGroup[] },
  { id: 'travis', groups: ['Inazuma Japan'] as DuelGroup[] },
  { id: 'david-evans', groups: ['Selecciones'] as DuelGroup[] },
  { id: 'mister-d', groups: ['Selecciones'] as DuelGroup[] },
] as const;
export type CoachId = (typeof DUEL_COACHES)[number]['id'];

/** stats as the doc's formulas give them (rarity, position, the technique powers that set the duplicates apart) */
export interface DuelStats { hp: number; atk: number; def: number; crit: number; critDmg: number; pierce: number; res: number }
const RAR_MULT: Partial<Record<Rarity, number>> = { legendario: 1.26, mitico: 1.36, leyenda: 1.48 };
const ROLE: Record<string, [number, number, number]> = { GK: [0.8, 1.25, 1.15], DF: [0.9, 1.15, 1.05], MF: [1, 1, 1], FW: [1.15, 0.9, 0.95] };
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
/** balance: PV, ATQ and DEF of each footballer are multiplied by this. First by hand (author: «equilibra los mixi max y
 *  los de tier C»), then (2026-11-19) by tools/duel_balance.ts, 6 rounds of 4200 CPU «difícil» matches towards a 50 %
 *  win share for everyone: the spread went from 36-71 % to 45-57 % (Nathan's kit was changed instead, see above);
 *  2026-11-20 again with the passives on and King / Samford Royal in (6 rounds of 4200): 43-57 %; and again with
 *  the passives remade (each his own, none tied to team mates) */
export const DUEL_TUNE: Record<number, number> = {1: 1.288, 2: 1.218, 3: 1.732, 10: 0.824, 20: 1.579, 29: 1.348, 30: 1.357, 157: 0.892, 1024: 1.636, 1370: 0.949, 1371: 0.703, 1513: 1.231, 1532: 0.908, 1541: 0.866, 1542: 0.878, 1548: 1.788, 1567: 1.031, 100242: 0.614, 100303: 1.207, 100382: 0.902, 100405: 1.785, 100427: 1.028, 100487: 1.365, 100538: 1.365, 100562: 0.777, 100580: 1.026, 100728: 1.097, 100739: 0.872, 100773: 0.753, 100797: 1.468, 100905: 1.011, 100907: 0.793, 100944: 0.91, 100952: 0.633, 100979: 0.777, 101004: 0.602, 101308: 1.338, 101488: 1.125, 101504: 0.95, 101505: 0.952, 101520: 0.728, 101572: 1.063, 101719: 1.028, 101722: 0.8, 101775: 0.851, 101791: 0.862, 101838: 1.145, 101855: 1.061, 101871: 0.995, 101894: 1.088, 102185: 1.291, 102307: 0.907};
export function duelStats(p: { id?: number; rarity: Rarity; position: string; stats: Record<string, number>; techniques: { type: string; power?: number }[] }): DuelStats {
  const s = p.stats, k = (p.id !== undefined ? DUEL_TUNE[p.id] : undefined) ?? 1, m = (RAR_MULT[p.rarity] ?? 1.26) * k, [a, d, h] = ROLE[p.position] ?? ROLE.MF;
  const best = (...ty: string[]) => Math.max(...p.techniques.filter((t) => ty.includes(t.type)).map((t) => t.power ?? 0), 0) || 60;
  // a passive of stats is part of them (the tooltips show it too)
  const pp = (k: 'atk' | 'def' | 'hp' | 'crit' | 'critDmg' | 'resist') => (p.id !== undefined ? passivesOf(p.id).reduce((x, q) => x + (q.do === k ? q.pct : 0), 0) : 0);
  return {
    hp: Math.round(Math.round((s.stamina + s.guts) * 12 * m * h) * (0.9 + 0.1 * best('regate', 'defensa', 'parada') / 100) * (1 + pp('hp') / 100)),
    atk: Math.round(Math.round((s.kick + 0.4 * s.body) * 3 * m * a) * (0.85 + 0.15 * best('tiro') / 100) * (1 + pp('atk') / 100)),
    def: Math.round(Math.round((s.guard + 0.5 * s.body) * 2 * m * d) * (0.85 + 0.15 * best('defensa', 'parada') / 100) * (1 + pp('def') / 100)),
    crit: Math.round(clamp(5 + (s.control - 40) * 0.3 + (best('regate') - 80) / 8, 5, 30)) + pp('crit'),
    critDmg: Math.round(clamp(150 + (s.guts - 40) * 1.2, 150, 200)) + pp('critDmg'),
    pierce: Math.round(clamp((s.speed - 40) * 0.25, 0, 20)),
    res: Math.round(clamp(((s.guts + s.guard) / 2 - 40) * 0.3, 0, 25)) + pp('resist'),
  };
}
