/**
 * Modo Duelo: what a card does, in words, from its effects in cards.ts (the tooltip of the match screen). Effects that
 * need more stars than the card has are listed too, marked with the stars they need.
 */
import { tr } from '../i18n/i18n';
import { tTech } from '../i18n/data';
import { passiveOf, type Cond, type Fx, type Passive, type Per } from '../systems/duel/cards';
import { specOf, unit, type Card, type DuelState, type Unit } from '../systems/duel/rules';

const COND = (): Record<Cond, string> => ({
  targetHasStatus: tr('el rival tiene un estado'), targetFrozen: tr('el rival está congelado'), targetElectrified: tr('el rival está electrizado'),
  targetGK: tr('el rival es portero'), targetLowestHp: tr('el rival es el que menos PV tiene'), lastEnemy: tr('es el último rival en pie'),
  targetTaunt: tr('el rival está provocando'), selfHpBelow50: tr('le queda menos de la mitad de PV'), selfHpAbove70: tr('tiene más del 70 % de PV'),
  firstCard: tr('es la primera carta del turno'), lastAction: tr('es tu última acción'), fwCardsInHand2: tr('tienes 2 cartas de delanteros o más'),
});
const PER = (): Record<Per, string> => ({
  ownCardsInHand: tr('cada carta suya en la mano'), groupCardsInHand: tr('cada carta de su grupo en la mano'), r3InHand: tr('cada carta ★★★ en la mano'),
  alliesAlive: tr('cada aliado en pie'), ownCardsUsedThisTurn: tr('cada carta suya usada este turno'),
});
const STATUS = (): Record<string, string> => ({ quemadura: tr('Quemadura'), congelado: tr('Congelado'), electrizado: tr('Electrizado'), aturdido: tr('Aturdido'), provocar: tr('Provocar') });
const WHO = (w: string) => (w === 'all' || w === 'team' ? tr('a todo el equipo') : w === 'self' ? tr('a sí mismo') : tr('a un aliado'));
const DEFAULT_TURNS: Record<string, number> = { quemadura: 3, congelado: 1, electrizado: 2, aturdido: 1, provocar: 2 };

function fxText(f: Fx, rank: number): string {
  const r = (v: [number, number, number]) => v[rank - 1];
  switch (f.do) {
    case 'status': return tr('Aplica {s} durante {n} turnos.', { s: STATUS()[f.s] ?? f.s, n: f.turns ?? DEFAULT_TURNS[f.s] ?? 1 }) + (f.sure ? ` ${tr('Siempre entra.')}` : '');
    case 'gale': return tr('Vendaval: su equipo recibe 1 carta menos.');
    case 'pierce': return tr('Atraviesa un {p} % de la DEF.', { p: f.pct });
    case 'ignoreStance': return tr('Ignora las posturas.');
    case 'ignoreTaunt': return tr('Ignora Provocar.');
    case 'ignoreDef': return tr('Ignora la DEF.');
    case 'bonusIf': return tr('+{p} % de daño si {c}.', { p: f.pct, c: COND()[f.cond] });
    case 'bonusPer': return tr('+{p} % de daño por {c}.', { p: f.pct, c: PER()[f.per] });
    case 'critBonus': return tr('+{p} % de probabilidad de crítico.', { p: f.pct });
    case 'critSure': return tr('Siempre es crítico.');
    case 'hits': return tr('{n} golpes de ×{m}.', { n: f.n, m: f.each });
    case 'randomHits': return tr('{n} golpes a rivales al azar.', { n: f.n });
    case 'repeatOnCrit': return tr('Si es crítico, golpea otra vez.');
    case 'selfDamage': return tr('Le cuesta un {p} % de sus PV.', { p: f.pct });
    case 'actionOnKo': return tr('Si lesiona, recuperas 1 acción.');
    case 'alwaysAdvantage': return tr('Siempre tiene ventaja de elemento.');
    case 'rankDown': return f.who === 'target' ? tr('Baja {n} ★ a una carta del rival.', { n: f.n ?? 1 }) : f.who === 'eachEnemy' ? tr('Baja 1 ★ a una carta de cada rival.') : tr('Baja 1 ★ a todas las cartas del rival.');
    case 'seal': return tr('Sella {n} cartas del rival.', { n: f.n });
    case 'destroy': return tr('Destruye una carta rival de {r}★ o más.', { r: f.minRank });
    case 'stealGauge': return tr('Roba {n} de Garra.', { n: f.n });
    case 'decoys': return tr('Mete {n} cartas señuelo en la mano rival.', { n: f.n });
    case 'faceDown': return tr('El rival ve sus cartas boca abajo.');
    case 'enemyActions': return tr('El rival tiene {n} acción menos.', { n: f.n });
    case 'shield': return tr('Escudo del {p} % de PV {w}.', { p: r(f.pct), w: WHO(f.who) });
    case 'heal': return tr('Cura un {p} % de PV {w}.', { p: r(f.pct), w: WHO(f.who) });
    case 'block': return tr('Bloquea los próximos {n} ataques ({w}).', { n: r(f.n), w: WHO(f.who) }) + (f.reflect ? ` ${tr('Devuelve un {p} %.', { p: f.reflect })}` : '');
    case 'dodge': return tr('Esquiva los próximos {n} ataques.', { n: r(f.n) });
    case 'counter': return tr('Contraataca con ×{m} cuando le golpean.', { m: f.mult });
    case 'reflect': return tr('Devuelve un {p} % del daño recibido.', { p: f.pct });
    case 'endure': return tr('Aguanta con 1 PV un golpe que lo lesionaría.');
    case 'reduce': return f.scope === 'area' ? tr('El equipo recibe un {p} % menos de daño de área.', { p: f.pct }) : tr('El equipo recibe un {p} % menos de daño.', { p: f.pct });
    case 'mine': return tr('Trampa: el próximo rival que ataque recibe ×{m}.', { m: f.mult });
    case 'statusGuard': return tr('Protege al equipo del próximo estado.');
    case 'immune': return tr('El equipo es inmune a los estados un turno.');
    case 'cleanse': return tr('Quita los estados del equipo.');
    case 'dispel': return tr('Anula al rival sus mejoras, posturas y escudo.');
    case 'taunt': return tr('Provoca durante {n} turnos.', { n: r(f.turns) }) + (f.defPct ? ` ${tr('+{p} % de DEF.', { p: f.defPct })}` : '');
    case 'buff': return f.who === 'team' ? tr('Sube el ATQ del equipo un {p} %.', { p: r(f.pct) }) : tr('Sube su ATQ un {p} %.', { p: r(f.pct) });
    case 'debuff': {
      const st = f.stat === 'atk' ? tr('el ATQ') : f.stat === 'def' ? tr('la DEF') : tr('el ATQ y la DEF');
      return f.area ? tr('Baja {s} de todos los rivales un {p} %.', { s: st, p: f.pct }) : tr('Baja {s} del rival un {p} %.', { s: st, p: f.pct });
    }
    case 'vulnerable': return tr('El rival recibe un {p} % más de daño.', { p: f.pct });
    case 'noHeal': return tr('El rival no puede curarse.');
    case 'blind': return tr('Ciega: un {p} % de fallar.', { p: f.pct });
    case 'rankUp': return tr('Sube 1 ★ a otras cartas tuyas.');
    case 'createCard': return tr('Crea una carta de {r}★.', { r: f.rank });
    case 'freeMoves': return tr('{n} movimientos gratis.', { n: f.n });
    case 'freeSwap': return tr('Un cambio de banquillo gratis.');
    case 'extraAction': return tr('+{n} acción.', { n: f.n });
    case 'chooseNext': return tr('Eliges tus próximas {n} cartas.', { n: f.n });
    case 'gaugeSelf': return tr('+{n} de Garra.', { n: f.n });
    case 'gaugeAllies': return tr('+{n} de Garra a los aliados.', { n: f.n });
    case 'gaugeTo': return tr('+{n} de Garra a un compañero.', { n: f.n });
    case 'peekSeal': return tr('Mira la mano rival y sella una carta.');
    case 'mergeBoost': return tr('Tu próxima fusión sube 1 ★ más.');
    case 'cardsSealedUse': return tr('Puede usar cartas selladas.');
    case 'selfStun': return tr('Después queda aturdido.');
    default: return '';
  }
}

export interface CardInfo { tech: string; kind: string; mult: number | null; base: string; lines: { text: string; min: number; on: boolean }[] }
export function cardInfo(s: DuelState, c: Card, names: (pid: number) => string): CardInfo {
  const u = unit(s, c.owner), sp = specOf(c, u);
  const rank = c.idx === 'u' || c.idx === 'c' ? 3 : c.rank;
  const mult = sp.mult[Math.min(sp.mult.length - 1, rank - 1)] || null;
  let base = '';
  if (sp.kind === 'combo') base = tr('Técnica combinada: daño ×{m} con el ATQ medio de {who}.', { m: mult ?? 0, who: c.combo!.members.map((m) => names(unit(s, m).pid)).join(' + ') });
  else if (mult && (sp.kind === 'ataque' || sp.kind === 'debilitar' || (sp.kind === 'ulti' && !sp.area))) base = tr('Daño ×{m} a un rival.', { m: mult });
  else if (mult && (sp.kind === 'area' || sp.kind === 'ulti')) base = tr('Daño ×{m} a todos los rivales.', { m: mult });
  const lines = sp.fx.map((f) => ({ text: fxText(f, rank), min: f.min ?? 1, on: (f.min ?? 1) <= rank })).filter((l) => l.text);
  return { tech: tTech(sp.tech), kind: sp.kind, mult, base, lines };
}

/** a footballer's technique out of a match (the team editor's tooltip): `idx` 0/1 its cards, 'u' its ulti; the
 *  multiplier of each rank and every effect with the rank it needs */
export function techInfo(pid: number, idx: 0 | 1 | 'u'): CardInfo & { mults: number[]; area: boolean } {
  const sp = specOf({ id: 0, owner: 0, idx, rank: 3 } as Card, { pid } as Unit);
  const rank = 3;
  const lines = sp.fx.map((f) => ({ text: fxText(f, rank), min: idx === 'u' ? 1 : f.min ?? 1, on: true })).filter((l) => l.text);
  return { tech: tTech(sp.tech), kind: sp.kind, mult: sp.mult[0] || null, mults: sp.mult.filter(Boolean), base: '', lines, area: sp.area };
}

/** a footballer's passive, in words (empty: none) */
export function passiveText(pid: number): string {
  const p: Passive | undefined = passiveOf(pid);
  if (!p) return '';
  switch (p.do) {
    case 'atk': return tr('ATQ +{n} %.', { n: p.pct });
    case 'def': return tr('DEF +{n} %.', { n: p.pct });
    case 'hp': return tr('PV +{n} %.', { n: p.pct });
    case 'crit': return tr('Probabilidad de crítico +{n} %.', { n: p.pct });
    case 'critDmg': return tr('Daño crítico +{n} %.', { n: p.pct });
    case 'resist': return tr('Resistencia a estados +{n} %.', { n: p.pct });
    case 'gaugeStart': return tr('Empieza el partido con {n} orbes de Garra.', { n: p.n });
    case 'turnGauge': return tr('Al empezar cada turno tuyo, gana {n} orbe de Garra.', { n: p.n });
    case 'koGauge': return tr('Cuando deja K.O. a un rival, gana {n} orbes de Garra.', { n: p.n });
    case 'turnHeal': return tr('Al empezar cada turno tuyo, recupera un {n} % de sus PV.', { n: p.pct });
    case 'turnShield': return tr('Al empezar cada turno tuyo, gana un escudo del {n} % de sus PV.', { n: p.pct });
    case 'takeLess': return tr('Recibe un {n} % menos de daño.', { n: p.pct });
    case 'teamDef': return tr('Mientras está en el campo, sus compañeros reciben un {n} % menos de daño.', { n: p.pct });
    case 'teamAtk': return tr('Mientras está en el campo, sus compañeros tienen ATQ +{n} %.', { n: p.pct });
    case 'lowHpAtk': return tr('Con menos de la mitad de PV, hace un {n} % más de daño.', { n: p.pct });
    case 'vsStatus': return tr('Hace un {n} % más de daño a rivales con un estado alterado.', { n: p.pct });
    case 'elemPlus': return tr('Con ventaja de elemento, hace un {n} % más de daño.', { n: p.pct });
    case 'ultiPlus': return tr('Su ulti hace un {n} % más de daño.', { n: p.pct });
    case 'firstCard': return tr('La primera carta de cada turno hace un {n} % más de daño.', { n: p.pct });
    case 'lifesteal': return tr('Recupera el {n} % del daño que hace.', { n: p.pct });
    case 'thorns': return tr('Devuelve al atacante el {n} % del daño que recibe.', { n: p.pct });
    case 'lastStand': return tr('Una vez por partido, aguanta con 1 PV un golpe que lo dejaría K.O.');
    case 'rankStart': return tr('Al empezar cada turno tuyo, sube de rango una de sus cartas.');
  }
}
