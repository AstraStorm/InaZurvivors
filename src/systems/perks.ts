/** Permanent upgrades ("Mejoras") bought with coins in the main menu. Every line is capped; values are provisional balance. */
import type { SaveData } from './save';

/** 2.0: an ultimate every 30 s, down to 15 s with all five levels of «Espíritu despierto» */
export const ULT_BASE_SEC = 30;

export type PerkCategory = 'Supervivencia' | 'Combate' | 'Progresión' | 'Economía' | 'Equipo';
export interface PerkDef { id: string; category: PerkCategory; label: string; description: string; max: number; baseCost: number; step: number; requires?: string }

export const PERK_CATEGORIES: PerkCategory[] = ['Supervivencia', 'Combate', 'Progresión', 'Economía', 'Equipo'];

const P = (id: string, category: PerkCategory, label: string, description: string, max: number, baseCost: number, step: number): PerkDef =>
  ({ id, category, label, description, max, baseCost, step });

export const PERKS: PerkDef[] = [
  P('vida', 'Supervivencia', 'Resistencia', '+4% vida del capitán por nivel', 10, 120, 80),
  P('armadura', 'Supervivencia', 'Defensa férrea', '-2% daño recibido por nivel', 8, 180, 110),
  P('regen', 'Supervivencia', 'Recuperación', '+0,06% de vida por segundo por nivel', 5, 220, 140),
  P('escudos', 'Supervivencia', 'Escudos duraderos', '+10% duración de objetos temporales', 5, 150, 90),
  P('aliento', 'Supervivencia', 'Segundo aliento', 'Una vez por partida, al caer el capitán se levanta con un 30% de vida', 1, 3500, 0),
  P('dano', 'Combate', 'Potencia', '+3% daño de las supertécnicas por nivel', 10, 150, 100),
  P('area', 'Combate', 'Amplitud', '+4% área de técnicas por nivel', 8, 170, 100),
  P('alcance', 'Combate', 'Alcance', '+5% alcance de detección de tiros por nivel', 6, 140, 90),
  P('cadencia', 'Combate', 'Cadencia', '-2% recarga de técnicas por nivel', 8, 200, 130),
  P('critico', 'Combate', 'Golpe crítico', '+2% probabilidad de crítico (daño ×1,8)', 5, 220, 150),
  P('elemental', 'Combate', 'Afinidad elemental', '+4% probabilidad de efecto elemental (ralentiza y +20% daño)', 5, 200, 140),
  P('ranura3', 'Combate', 'Tercera ranura de técnica', 'Cada futbolista puede aprender 3 técnicas por partida', 1, 6000, 0),
  { ...P('ranura4', 'Combate', 'Cuarta ranura de técnica', 'Cada futbolista puede aprender sus 4 técnicas', 1, 20000, 0), requires: 'ranura3' },
  P('experiencia', 'Progresión', 'Estudio', '+4% experiencia por nivel', 8, 160, 110),
  P('iman', 'Progresión', 'Recogida', '+15% radio de recogida de experiencia', 5, 100, 70),
  P('suerte', 'Progresión', 'Suerte', '+5% objetos raros por nivel', 6, 170, 110),
  P('cambios', 'Progresión', 'Cambios de cartas', '+1 reroll por partida', 3, 300, 250),
  P('opciones', 'Progresión', 'Más opciones', '+1 carta al subir de nivel', 2, 1500, 2500), // 2.0 (author): up to 5 cards
  P('eventos', 'Progresión', 'Cazador de eventos', '+15% recompensa de altares y eventos', 4, 180, 120),
  P('monedas', 'Economía', 'Patrocinio', '+6% monedas al terminar', 5, 200, 150),
  P('final', 'Economía', 'Prima de victoria', '+10% de las primas de jefe y victoria por nivel', 5, 180, 120),
  P('objetivos', 'Economía', 'Contrato de objetivos', '+10% recompensa de misiones por nivel', 5, 200, 130),
  P('gts', 'Economía', 'Ventanilla GTS', '+1 hueco para dejar futbolistas en la GTS (máx. 5)', 4, 1500, 1500),
  P('fichas', 'Economía', 'Ojeador', '+1 ficha al terminar una partida de 3 minutos o más', 3, 450, 450),
  P('formaciones', 'Equipo', 'Pizarra táctica', '+1% daño por nivel en cualquier formación', 6, 170, 110),
  P('seguimiento', 'Equipo', 'Velocidad', '+2% velocidad del equipo por nivel', 6, 150, 100),
  P('combinadas', 'Equipo', 'Química de equipo', '+8% daño de las técnicas combinadas', 5, 250, 160),
  P('sinergia', 'Equipo', 'Sinergia elemental', '+1,5% daño por cada compañero del mismo elemento que el capitán', 5, 220, 140),
  // Fix 1.11
  // Fix 1.31: flat damage negation, outside the runs
  P('blindaje', 'Supervivencia', 'Blindaje', '-0,5 daño en cada golpe que recibe el capitán por nivel (como mucho la mitad del golpe)', 4, 250, 160),
  P('jefes', 'Supervivencia', 'Resistencia a jefes', '-3% daño de los ataques de jefes y minijefes por nivel (máx. -15%)', 5, 260, 160),
  P('botiquin', 'Supervivencia', 'Botiquín', '+12% curación de bolas de arroz y chocolate por nivel (máx. +48%)', 4, 200, 130),
  P('inicio', 'Progresión', 'Ventaja inicial', 'Empiezas la partida con un 20% de la experiencia del primer nivel por nivel (máx. 80%)', 4, 240, 160),
  P('raros', 'Progresión', 'Ojo para lo raro', '+4% probabilidad de objetos especiales (Revivir, Barrera, cofres...) por nivel (máx. +16%)', 4, 260, 170),
  // IDEA-C16CF5D6 (Lancelot): upgrades for the power-ups found in a run
  P('imanbotin', 'Progresión', 'Imán de botín', 'El Imán también atrae las bolsas de monedas, las fichas y los cofres del campo', 1, 2500, 0),
  P('potenciador', 'Combate', 'Potenciador de daño', 'El objeto «Daño» da un +5% más por nivel (de +50% a +75%)', 5, 220, 150),
  P('turbo', 'Combate', 'Recarga turbo', 'El objeto «Recarga» recarga un 4% más por nivel (de -40% a -60%)', 5, 220, 150),
  // 2.0 (author: «en mejoras globales el tiempo de recarga de ulti, cada 30 al principio y mejorable hasta cada 15»)
  P('ulti', 'Combate', 'Espíritu despierto', '-3 s de recarga de la definitiva de tu Espíritu Guerrero por nivel (de 30 s a 15 s)', 5, 400, 260),
  P('tactica', 'Equipo', 'Pizarra avanzada', 'Potencia la formación activa por nivel: ofensiva +1% daño, equilibrada +2% combinadas, defensiva -1% daño recibido (máx. 5)', 5, 280, 180),
];
/** Fix 1.11: every upgrade costs half as much again, so coins keep their value over many runs */
export const PERK_PRICE = 1.5;

export const perkLevel = (s: SaveData, id: string) => s.upgrades[id] ?? 0;
export const perkCost = (p: PerkDef, level: number) => Math.round((p.baseCost + p.step * level) * PERK_PRICE / 10) * 10;

export function buyPerk(s: SaveData, id: string): boolean {
  const p = PERKS.find((x) => x.id === id);
  if (!p) return false;
  const lv = perkLevel(s, id);
  const cost = perkCost(p, lv);
  if (lv >= p.max || s.coins < cost || (p.requires && !perkLevel(s, p.requires))) return false;
  s.coins -= cost;
  s.upgrades[id] = lv + 1;
  return true;
}

/** Levels bought in a category unlock a bonus for that whole category. */
export const MILESTONES = [10, 25];
export const CATEGORY_BONUS: Record<PerkCategory, string> = {
  Supervivencia: '+3% vida del capitán', Combate: '+3% daño', 'Progresión': '+3% experiencia', 'Economía': '+5% monedas', Equipo: '+2% velocidad',
};

export const categoryLevels = (s: SaveData, c: PerkCategory) => PERKS.filter((p) => p.category === c).reduce((a, p) => a + perkLevel(s, p.id), 0);
export const milestonesReached = (s: SaveData, c: PerkCategory) => MILESTONES.filter((m) => categoryLevels(s, c) >= m).length;

export function spentOn(s: SaveData) {
  let total = 0;
  for (const p of PERKS) for (let l = 0; l < perkLevel(s, p.id); l++) total += perkCost(p, l);
  return total;
}

/** Full free respec: all coins back, every level cleared. */
export function refundPerks(s: SaveData) {
  const coins = spentOn(s);
  s.coins += coins;
  s.upgrades = {};
  return coins;
}

/** Current value of a perk, from the amount in its description ("+6% ..."). */
export function perkValue(p: PerkDef, level: number) {
  const m = /([+-]?)([\d,]+)(%?)/.exec(p.description);
  if (!m) return String(level);
  const v = parseFloat(m[2].replace(',', '.')) * level;
  return `${m[1]}${String(Math.round(v * 10) / 10).replace('.', ',')}${m[3]}`;
}

export interface PerkEffects {
  hpMult: number; damageMult: number; magnetMult: number; extraRerolls: number; coinMult: number;
  cooldownMult: number; areaMult: number; rangeMult: number; speedMult: number; xpMult: number; luck: number;
  damageTakenMult: number; buffMult: number; extraChoices: number; regen: number;
  rewardMult: number; missionMult: number; synergy: number;
  /** extra damage reduction, only while a goalkeeper is on the team (gloves) */
  gloveReduction: number;
  /** Fix 1.31: flat damage taken off every hit on the captain (Blindaje) */
  flatArmor: number;
  /** technique slots per player in a run (2 to 4) */
  techSlots: number;
  critChance: number; elementalChance: number; comboMult: number; eventMult: number; extraTokens: number; secondWind: boolean;
  /** Fix 1.11: boss/miniboss attacks taken, share of the first level's experience at the start, healing of food items,
   * «Pizarra avanzada» level, extra chance of special items */
  bossTakenMult: number; startXpFrac: number; healMult: number; tactic: number; specialLuck: number;
  /** IDEA-C16CF5D6: the Imán pulls loot too; extra of the «Daño» and «Recarga» power-ups (0.5 / 0.4 base) */
  lootMagnet: boolean; damageBuff: number; cooldownBuff: number;
  /** 2.0: seconds between two ultimates of the active warrior spirit (30, down to 15 with «Espíritu despierto») */
  ultCooldownSec: number;
}

export function perkEffects(s: SaveData): PerkEffects {
  const l = (id: string) => perkLevel(s, id);
  const ms = (c: PerkCategory) => milestonesReached(s, c);
  return {
    hpMult: (1 + 0.04 * l('vida')) * (1 + 0.03 * ms('Supervivencia')),
    damageMult: (1 + 0.03 * l('dano')) * (1 + 0.01 * l('formaciones')) * (1 + 0.03 * ms('Combate')),
    magnetMult: 1 + 0.15 * l('iman'),
    extraRerolls: l('cambios'),
    coinMult: (1 + 0.06 * l('monedas')) * (1 + 0.05 * ms('Economía')),
    cooldownMult: 1 - 0.02 * l('cadencia'),
    areaMult: 1 + 0.04 * l('area'),
    rangeMult: 1 + 0.05 * l('alcance'),
    speedMult: (1 + 0.02 * l('seguimiento')) * (1 + 0.02 * ms('Equipo')),
    xpMult: (1 + 0.04 * l('experiencia')) * (1 + 0.03 * ms('Progresión')),
    luck: 0.05 * l('suerte'),
    damageTakenMult: 1 - 0.02 * l('armadura'),
    flatArmor: 0.5 * l('blindaje'),
    buffMult: 1 + 0.1 * l('escudos'),
    extraChoices: l('opciones'),
    regen: 0.0006 * l('regen'),
    rewardMult: 1 + 0.1 * l('final'),
    missionMult: 1 + 0.1 * l('objetivos'),
    synergy: 0.015 * l('sinergia'),
    gloveReduction: 0,
    techSlots: 2 + l('ranura3') + l('ranura4'),
    critChance: 0.02 * l('critico'),
    elementalChance: 0.04 * l('elemental'),
    comboMult: 1 + 0.08 * l('combinadas'),
    eventMult: 1 + 0.15 * l('eventos'),
    extraTokens: l('fichas'),
    secondWind: l('aliento') > 0,
    bossTakenMult: 1 - 0.03 * l('jefes'),
    startXpFrac: 0.2 * l('inicio'),
    healMult: 1 + 0.12 * l('botiquin'),
    tactic: l('tactica'),
    specialLuck: 0.04 * l('raros'),
    lootMagnet: l('imanbotin') > 0,
    damageBuff: 0.5 + 0.05 * l('potenciador'),
    cooldownBuff: 0.4 + 0.04 * l('turbo'),
    ultCooldownSec: ULT_BASE_SEC - 3 * l('ulti'),
  };
}
