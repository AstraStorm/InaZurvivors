/**
 * 3.0 (author): LA PIEDRA ALIUS. 29 transformations of footballers (and one coach) unlocked for good at the Altar de la
 * Piedra Alius with Piedras Alius. Each one is a unit of its own (own id, own head portrait, own passive) that inherits
 * everything else from the original: stats, element, techniques and their levels, position, rarity, body and overworld
 * sprite. The roster entries are cloned from the original when the game loads (addAliusRoster), so nothing is copied into
 * the data and a fix to the original reaches its Alius too. The registry is src/data/alius.json (also read by
 * tools/alius_assets.py); the balance numbers are ALIUS_CONFIG and ALIUS_PASSIVES, all in one place.
 */
import REG from './alius.json';
import { locale, tr } from '../i18n/i18n';
import type { Manifest, RosterEntry } from './manifest';

export interface AliusDef {
  key: string; file: string; title: string; passive: AliusPassiveId; baseName: string;
  /** roster id of the Alius footballer (never the original's) and of the original; absent for the coach */
  id?: number; base?: number;
  /** the coach id of an Alius coach (Lina): she has no roster entry */
  coach?: string;
}
export const ALIUS: AliusDef[] = REG.list as AliusDef[];
export const ALIUS_PLAYERS = ALIUS.filter((a) => a.id !== undefined);
export const ALIUS_BY_KEY = new Map(ALIUS.map((a) => [a.key, a]));
export const ALIUS_BY_ID = new Map(ALIUS_PLAYERS.map((a) => [a.id!, a]));
/** the Alius version of an original footballer */
export const ALIUS_OF_BASE = new Map(ALIUS_PLAYERS.map((a) => [a.base!, a]));
export const LINA_COACH = 'lina-alius';
/** exclusive tag of the Alius entries: out of every machine, shop, trade and prize (banners.ts, dailyShop.ts, gts.ts...) */
export const ALIUS_EXCLUSIVE = 'piedra-alius';
/** the team the Alius entries list (their own group in the collection; no team reward counts them) */
export const ALIUS_TEAM = 'Piedra_Alius';

export const isAliusId = (id: number) => ALIUS_BY_ID.has(id);
/** 3.0 (author: «la fecha es para el 25 de noviembre»): the Altar and the Alius are a secret until then, 12:00 Spain */
export const ALIUS_OPEN_AT = '2026-11-25T12:00:00+01:00';
export const aliusOpen = (now: number | Date) => +now >= Date.parse(ALIUS_OPEN_AT);
export const aliusLeftMs = (now: number | Date) => Math.max(0, Date.parse(ALIUS_OPEN_AT) - +now);
/** category of an Alius: 3 (3ª, at the transformation), 2 or 1 (1ª, the top one) */
export type AliusTier = 1 | 2 | 3;
export const TIER_LABEL: Record<AliusTier, string> = { 3: tr('3ª CATEGORÍA'), 2: tr('2ª CATEGORÍA'), 1: tr('1ª CATEGORÍA') };
export const TIER_SHORT: Record<AliusTier, string> = { 3: 'III', 2: 'II', 1: 'I' };
/** the original of an Alius id; any other id is its own original */
export const baseIdOf = (id: number) => ALIUS_BY_ID.get(id)?.base ?? id;

/**
 * Balance and rules, configurable here (author: «configurable, no hardcodeado»). The server keeps its own copy of the cost
 * and the earning ceiling in supabase/migrations/20261117000000_alius_stones.sql: change both together.
 */
export const ALIUS_CONFIG = {
  /** Piedras Alius per transformation */
  unlockCost: 10,
  /** Alius equipped at once, counting the squad of seven (pitch and bench) and the Auras; the coach does not count */
  maxEquipped: 3,
  /** share of a passive's benefit by where the Alius is: on the pitch, as an Aura, on the bench */
  slotScale: { field: 1, aura: 0.4, bench: 0.25 },
  /** InaZurvivors has no bench passives (the squad's other candidates don't play until they are recruited): off */
  benchPassives: false,
  /** Resonancia Alius: exactly three Alius footballers equipped and one on the pitch: their attacks deal this much more */
  resonanceDamage: 0.03,
  /** most damage taken the Alius reductions can remove together (Darren, Helio, Viisi): they never add up to immunity */
  maxTakenReduction: 0.35,
  /** total slow of Alius effects on a normal rival, and on a boss or rival captain (the control-immune ones) */
  maxSlow: 0.6,
  maxBossSlow: 0.15,
  /**
   * Categories (author): the transformation gives 3ª categoría, then 2ª and 1ª (the «++»), paid with duplicates of the
   * original like his ascension (HÉROE cost, then HÉROE + a hero star); each step adds `tierStats` to every stat.
   */
  tierStats: 10,
  tierCost: { comun: [20, 30], raro: [16, 24], epico: [12, 18], legendario: [4, 8], mitico: [2, 5], leyenda: [1, 3], alius: [1, 3] } as Record<string, [number, number]>,
  /** Piedras Alius for a won arena by rank (an existing reward: the victory), at most `dailyCap` a day */
  stones: { perWin: { C: 0, B: 1, A: 1, S: 2, X: 2, Z: 3 } as Record<string, number>, dailyCap: 3 },
};

export type AliusPassiveId =
  | 'muro-carmesi' | 'ojo-huracan' | 'voluntad-eclipse' | 'rugido-abisal' | 'colmillo-dragon' | 'juicio-divino' | 'fractura-obsidiana'
  | 'mano-demoniaca' | 'aliento-boreal' | 'angel-caido' | 'explosion-destructora' | 'eclipse-protector' | 'mil-ilusiones'
  | 'constelacion-negra' | 'corona-rota' | 'mascara-fantasma' | 'directora-eclipse' | 'devorador-almas' | 'eclipse-dorado'
  | 'escarcha-eterna' | 'rosa-negra' | 'supernova-negra' | 'cenizas-rey' | 'jaque-mate' | 'gravedad-oscura' | 'silencio-eterno'
  | 'ojo-omnisciente' | 'espejo-humeante' | 'fortaleza-negra';

/**
 * A passive: what triggers it, its numbers and the ones that shrink as an Aura or on the bench (`scaled`: the benefit —
 * percentages, damage, slows, healing, shields; for discrete effects the duration or the pull). Cooldowns never shrink.
 * Times in seconds.
 */
export interface AliusPassiveDef {
  id: AliusPassiveId; name: string;
  trigger: 'periodico' | 'ataque' | 'impacto' | 'eliminacion' | 'vida' | 'dano-recibido' | 'entrenador';
  params: Record<string, number>;
  scaled: string[];
  text: (p: Record<string, number>) => string;
}

const pc = (v: number) => `${Math.round(v * 1000) / 10}`.replace('.', locale().startsWith('en') ? '.' : ',') + '%';
const s = (v: number) => `${Math.round(v * 10) / 10}`.replace('.', ',');

export const ALIUS_PASSIVES: Record<AliusPassiveId, AliusPassiveDef> = {
  'muro-carmesi': { id: 'muro-carmesi', name: tr('MURO CARMESÍ'), trigger: 'dano-recibido', params: { loss: 0.2, shield: 0.08, cd: 35 }, scaled: ['shield'],
    text: (p) => tr('Cuando el equipo pierde un {a} de su vida máxima desde la última vez, genera una barrera que absorbe daño igual al {b} de la vida máxima. Recarga {c} s; nunca dos barreras a la vez.', { a: pc(p.loss), b: pc(p.shield), c: s(p.cd) }) },
  'ojo-huracan': { id: 'ojo-huracan', name: tr('OJO DEL HURACÁN'), trigger: 'periodico', params: { every: 18, radius: 95, push: 240, slow: 0.2, dur: 2 }, scaled: ['push', 'slow'],
    text: (p) => tr('Cada {a} s, una ráfaga circular empuja un poco a los rivales cercanos y los ralentiza un {b} durante {c} s. No desplaza a los jefes.', { a: s(p.every), b: pc(p.slow), c: s(p.dur) }) },
  'voluntad-eclipse': { id: 'voluntad-eclipse', name: tr('VOLUNTAD DEL ECLIPSE'), trigger: 'vida', params: { below: 0.35, damage: 0.18, dur: 8, cd: 45 }, scaled: ['damage'],
    text: (p) => tr('Cuando la vida del equipo baja del {a}, gana un {b} de daño durante {c} s. Recarga {d} s; no se repite mientras siga por debajo.', { a: pc(p.below), b: pc(p.damage), c: s(p.dur), d: s(p.cd) }) },
  'rugido-abisal': { id: 'rugido-abisal', name: tr('RUGIDO ABISAL'), trigger: 'periodico', params: { every: 25, radius: 110, damage: 0.6, slow: 0.4, dur: 2 }, scaled: ['damage', 'slow'],
    text: (p) => tr('Cada {a} s, una onda circular hace el {b} de su ataque y ralentiza durante {c} s a los rivales que alcanza.', { a: s(p.every), b: pc(p.damage), c: s(p.dur) }) },
  'colmillo-dragon': { id: 'colmillo-dragon', name: tr('COLMILLO DEL DRAGÓN NEGRO'), trigger: 'ataque', params: { nth: 5, damage: 0.5, length: 260, width: 16 }, scaled: ['damage'],
    text: (p) => tr('Cada {a}.º ataque lanza una onda en línea recta que hace el {b} del daño del ataque a los rivales que atraviesa.', { a: p.nth, b: pc(p.damage) }) },
  'juicio-divino': { id: 'juicio-divino', name: tr('JUICIO DIVINO'), trigger: 'periodico', params: { every: 30, dur: 6, damage: 0.12, range: 280 }, scaled: ['damage'],
    text: (p) => tr('Cada {a} s marca al rival con más vida a su alcance: durante {b} s recibe un {c} más de daño de él (también los jefes).', { a: s(p.every), b: s(p.dur), c: pc(p.damage) }) },
  'fractura-obsidiana': { id: 'fractura-obsidiana', name: tr('FRACTURA DE OBSIDIANA'), trigger: 'impacto', params: { marks: 4, damage: 0.8, cd: 8 }, scaled: ['damage'],
    text: (p) => tr('Sus impactos dejan marcas en el rival; con {a} se rompen y hacen un {b} de su ataque básico. Una vez cada {c} s por rival.', { a: p.marks, b: pc(p.damage), c: s(p.cd) }) },
  'mano-demoniaca': { id: 'mano-demoniaca', name: tr('MANO DEMONÍACA'), trigger: 'vida', params: { below: 0.5, reduce: 0.2, dur: 5, cd: 40 }, scaled: ['reduce'],
    text: (p) => tr('Cuando la vida del equipo baja del {a}, una protección reduce un {b} el daño recibido durante {c} s. Recarga {d} s; no se acumula consigo misma.', { a: pc(p.below), b: pc(p.reduce), c: s(p.dur), d: s(p.cd) }) },
  'aliento-boreal': { id: 'aliento-boreal', name: tr('ALIENTO BOREAL'), trigger: 'impacto', params: { nth: 4, slow: 0.3, dur: 3, bossSlow: 0.1, bossDur: 2 }, scaled: ['slow', 'bossSlow'],
    text: (p) => tr('Cada {a}.º impacto congela a medias: ralentiza un {b} durante {c} s (a los jefes, un {d} durante {e} s).', { a: p.nth, b: pc(p.slow), c: s(p.dur), d: pc(p.bossSlow), e: s(p.bossDur) }) },
  'angel-caido': { id: 'angel-caido', name: tr('ÁNGEL CAÍDO'), trigger: 'eliminacion', params: { heal: 0.01, cd: 5 }, scaled: ['heal'],
    text: (p) => tr('Al eliminar a un rival con un ataque propio, el equipo recupera un {a} de su vida máxima. Una vez cada {b} s.', { a: pc(p.heal), b: s(p.cd) }) },
  'explosion-destructora': { id: 'explosion-destructora', name: tr('EXPLOSIÓN DESTRUCTORA'), trigger: 'eliminacion', params: { chance: 0.25, damage: 0.55, radius: 50 }, scaled: ['damage'],
    text: (p) => tr('Los rivales que elimina tienen un {a} de probabilidad de explotar: un {b} de su ataque básico en un área pequeña. Las explosiones no encadenan otras.', { a: pc(p.chance), b: pc(p.damage) }) },
  'eclipse-protector': { id: 'eclipse-protector', name: tr('ECLIPSE PROTECTOR'), trigger: 'periodico', params: { every: 35, dur: 6, reduce: 0.12 }, scaled: ['reduce'],
    text: (p) => tr('Cada {a} s, una protección de {b} s reduce un {c} el daño que recibe la vida del equipo.', { a: s(p.every), b: s(p.dur), c: pc(p.reduce) }) },
  'mil-ilusiones': { id: 'mil-ilusiones', name: tr('MIL ILUSIONES'), trigger: 'periodico', params: { every: 28, dur: 4, radius: 130 }, scaled: ['dur'],
    text: (p) => tr('Cada {a} s crea una copia ilusoria que atrae a los rivales cercanos durante {b} s como máximo. No hace daño; los jefes no se dejan engañar.', { a: s(p.every), b: s(p.dur) }) },
  'constelacion-negra': { id: 'constelacion-negra', name: tr('CONSTELACIÓN NEGRA'), trigger: 'ataque', params: { nth: 3, count: 2, damage: 0.25, range: 230 }, scaled: ['damage'],
    text: (p) => tr('Cada {a}.º ataque suelta {b} proyectiles estelares que hacen un {c} de su ataque básico al rival más cercano.', { a: p.nth, b: p.count, c: pc(p.damage) }) },
  'corona-rota': { id: 'corona-rota', name: tr('CORONA ROTA'), trigger: 'impacto', params: { above: 0.75, damage: 0.15 }, scaled: ['damage'],
    text: (p) => tr('Hace un {a} más de daño a los rivales con más del {b} de vida.', { a: pc(p.damage), b: pc(p.above) }) },
  'mascara-fantasma': { id: 'mascara-fantasma', name: tr('MÁSCARA FANTASMA'), trigger: 'periodico', params: { every: 25, dur: 2, bossSlow: 0.1 }, scaled: ['dur', 'bossSlow'],
    text: (p) => tr('Cada {a} s, su siguiente impacto confunde {b} s a un rival normal (camina sin rumbo). A los jefes, en su lugar, los ralentiza un {c}.', { a: s(p.every), b: s(p.dur), c: pc(p.bossSlow) }) },
  'directora-eclipse': { id: 'directora-eclipse', name: tr('DIRECTORA DEL ECLIPSE'), trigger: 'entrenador', params: { speed: 0.05 }, scaled: [],
    text: (p) => tr('Desde el banquillo de entrenador: los futbolistas Alius en el campo atacan un {a} más rápido. No cuenta para la Resonancia Alius.', { a: pc(p.speed) }) },
  'devorador-almas': { id: 'devorador-almas', name: tr('DEVORADOR DE ALMAS'), trigger: 'eliminacion', params: { kills: 5, damage: 0.1, dur: 6 }, scaled: ['damage'],
    text: (p) => tr('Cada {a} eliminaciones suyas gana un {b} de daño durante {c} s. No se acumula ni se renueva mientras dura; no se guarda entre partidas.', { a: p.kills, b: pc(p.damage), c: s(p.dur) }) },
  'eclipse-dorado': { id: 'eclipse-dorado', name: tr('ECLIPSE DORADO'), trigger: 'periodico', params: { every: 30, dur: 6, chance: 0.15, damage: 0.4 }, scaled: ['damage'],
    text: (p) => tr('Cada {a} s entra en Eclipse {b} s: sus impactos tienen un {c} de probabilidad de dar un segundo golpe del {d} (que no da otro).', { a: s(p.every), b: s(p.dur), c: pc(p.chance), d: pc(p.damage) }) },
  'escarcha-eterna': { id: 'escarcha-eterna', name: tr('ESCARCHA ETERNA'), trigger: 'impacto', params: { stacks: 3, slow: 0.35, dur: 3, bossSlow: 0.1 }, scaled: ['slow', 'bossSlow'],
    text: (p) => tr('Sus impactos acumulan Escarcha; con {a}, el rival se ralentiza un {b} durante {c} s y la cuenta empieza de nuevo (a los jefes, un {d}).', { a: p.stacks, b: pc(p.slow), c: s(p.dur), d: pc(p.bossSlow) }) },
  'rosa-negra': { id: 'rosa-negra', name: tr('ROSA NEGRA'), trigger: 'periodico', params: { every: 20, dur: 5, damage: 0.15, range: 240 }, scaled: ['damage'],
    text: (p) => tr('Cada {a} s marca al rival normal más cercano: durante {b} s le hace un {c} más de daño. La marca se va con el rival.', { a: s(p.every), b: s(p.dur), c: pc(p.damage) }) },
  'supernova-negra': { id: 'supernova-negra', name: tr('SUPERNOVA NEGRA'), trigger: 'periodico', params: { every: 35, damage: 0.75, radius: 70 }, scaled: ['damage'],
    text: (p) => tr('Cada {a} s, su siguiente impacto estalla alrededor del rival: un {b} de su ataque básico en área, sin explosiones secundarias.', { a: s(p.every), b: pc(p.damage) }) },
  'cenizas-rey': { id: 'cenizas-rey', name: tr('CENIZAS DEL REY'), trigger: 'impacto', params: { slow: 0.08, stacks: 2, dur: 3 }, scaled: ['slow'],
    text: (p) => tr('Sus impactos dejan Cenizas: un {a} menos de velocidad durante {b} s, hasta {c} veces ({d}). Los jefes, con su límite de control.', { a: pc(p.slow), b: s(p.dur), c: p.stacks, d: pc(p.slow * p.stacks) }) },
  'jaque-mate': { id: 'jaque-mate', name: tr('JAQUE MATE'), trigger: 'impacto', params: { nth: 6, damage: 1, cd: 10 }, scaled: ['damage'],
    text: (p) => tr('Cada {a}.º impacto seguido contra el mismo rival da Jaque Mate: un golpe extra del {b} de su ataque básico. La cuenta vuelve a cero si cambia de rival. Recarga {c} s.', { a: p.nth, b: pc(p.damage), c: s(p.cd) }) },
  'gravedad-oscura': { id: 'gravedad-oscura', name: tr('GRAVEDAD OSCURA'), trigger: 'periodico', params: { every: 30, dur: 3, radius: 110, pull: 70 }, scaled: ['pull'],
    text: (p) => tr('Cada {a} s crea un campo gravitatorio de {b} s que atrae suavemente hacia su centro a los rivales normales cercanos. No hace daño ni mueve a los jefes.', { a: s(p.every), b: s(p.dur) }) },
  'silencio-eterno': { id: 'silencio-eterno', name: tr('SILENCIO ETERNO'), trigger: 'impacto', params: { slow: 0.05, stacks: 3, expire: 4 }, scaled: ['slow'],
    text: (p) => tr('Sus impactos seguidos contra un rival le quitan un {a} de velocidad cada uno, hasta {b} ({c}). Se pierde tras {d} s sin un impacto suyo.', { a: pc(p.slow), b: p.stacks, c: pc(p.slow * p.stacks), d: s(p.expire) }) },
  'ojo-omnisciente': { id: 'ojo-omnisciente', name: tr('OJO OMNISCIENTE'), trigger: 'periodico', params: { every: 25, dur: 6, damage: 0.12, range: 320 }, scaled: ['damage'],
    text: (p) => tr('Cada {a} s marca al rival élite o especial más cercano (si no hay, a uno normal): durante {b} s sus técnicas le hacen un {c} más.', { a: s(p.every), b: s(p.dur), c: pc(p.damage) }) },
  'espejo-humeante': { id: 'espejo-humeante', name: tr('ESPEJO HUMEANTE'), trigger: 'dano-recibido', params: { every: 30, damage: 0.7, range: 240 }, scaled: ['damage'],
    text: (p) => tr('Cada {a} s gana una carga de Espejo: el siguiente golpe que recibe el equipo la gasta y devuelve un proyectil a un rival cercano con el {b} de su ataque básico. Una carga, sin rebotes.', { a: s(p.every), b: pc(p.damage) }) },
  'fortaleza-negra': { id: 'fortaleza-negra', name: tr('FORTALEZA NEGRA'), trigger: 'periodico', params: { every: 30, dur: 5, reduce: 0.1, bonus: 0.3 }, scaled: ['reduce', 'bonus'],
    text: (p) => tr('Cada {a} s, un estado defensivo de {b} s reduce un {c} el daño recibido; si el equipo recibe un golpe mientras dura, su siguiente ataque hace un {d} más (solo uno guardado).', { a: s(p.every), b: s(p.dur), c: pc(p.reduce), d: pc(p.bonus) }) },
};

/** a passive's numbers at a share of its benefit (`k` = 1 on the pitch, 0.4 as an Aura...): only its `scaled` ones change */
export function scaledParams(def: AliusPassiveDef, k: number): Record<string, number> {
  const out = { ...def.params };
  for (const key of def.scaled) out[key] = def.params[key] * k;
  return out;
}
export const passiveTextAt = (def: AliusPassiveDef, k = 1) => def.text(scaledParams(def, k));

/** skin ramp of the ROM's portrait torsos, darkest first (tools/alius_assets.py RAMP): what a kit torso recolours */
export const TORSO_SKIN_RAMP: [number, number, number][] = [[99, 74, 49], [156, 99, 57], [214, 132, 74], [239, 173, 99]];
/**
 * Phase 4.1: the torso's skin moved to an Alius's ramp, in place on RGBA pixels of a w×h torso. Only the ramp's pixels joined
 * (4 ways) to the neck's base colour change: a kit colour that matches by chance but doesn't touch the skin stays.
 */
export function recolourTorsoSkin(px: Uint8ClampedArray, w: number, h: number, ramp: [number, number, number][]) {
  const key = (i: number) => (px[i] << 16) | (px[i + 1] << 8) | px[i + 2];
  const tone = new Map(TORSO_SKIN_RAMP.map((c, k) => [(c[0] << 16) | (c[1] << 8) | c[2], k]));
  const base = (TORSO_SKIN_RAMP[2][0] << 16) | (TORSO_SKIN_RAMP[2][1] << 8) | TORSO_SKIN_RAMP[2][2];
  const seen = new Uint8Array(w * h), todo: number[] = [];
  for (let p = 0; p < w * h; p++) if (px[p * 4 + 3] && key(p * 4) === base) { seen[p] = 1; todo.push(p); }
  while (todo.length) {
    const p = todo.pop()!, x = p % w, y = (p - x) / w;
    const t = tone.get(key(p * 4))!;
    px[p * 4] = ramp[t][0]; px[p * 4 + 1] = ramp[t][1]; px[p * 4 + 2] = ramp[t][2];
    for (const q of [x + 1 < w ? p + 1 : -1, x > 0 ? p - 1 : -1, y + 1 < h ? p + w : -1, y > 0 ? p - w : -1]) {
      if (q < 0 || seen[q] || !px[q * 4 + 3] || !tone.has(key(q * 4))) continue;
      seen[q] = 1; todo.push(q);
    }
  }
}

/** manifest `alius` (tools/alius_assets.py): each Alius's head file, bodyshot with no kit, and torso skin ramp */
export type AliusArt = Record<string, { head: string; bust?: string; skin: [number, number, number][] | null; face?: number[] | null; review?: string; offset?: [number, number] }>;

/**
 * Adds the Alius footballers to the roster: each one a copy of his original (after rosterFixes, so the same corrections)
 * with his own id, name and exclusive tag; his techniques are copies (the run never shares objects with the original).
 * Returns the problems (missing original, wrong name, missing art): that Alius is left out instead of half made.
 */
export function addAliusRoster(m: Manifest): string[] {
  const problems: string[] = [];
  const art = (m as Manifest & { alius?: AliusArt }).alius ?? {};
  const byId = new Map(m.roster.map((p) => [p.id, p]));
  for (const a of ALIUS_PLAYERS) {
    const b = byId.get(a.base!);
    if (!b || b.name.trim() !== a.baseName.trim()) { problems.push(`${a.key}: el original ${a.base} no es ${a.baseName}`); continue; }
    if (!art[a.key]?.head) { problems.push(`${a.key}: falta su retrato (tools/alius_assets.py)`); continue; }
    if (byId.has(a.id!)) continue;
    const entry: RosterEntry = {
      // their own team only: an Alius never counts towards his original's team rewards, collection goals or kit elements;
      // on the pitch he keeps his original's club chemistry (baseTeams, kitBonus.ts / synergy.ts)
      ...b, id: a.id!, name: `${b.name.trim()} Alius`, nickname: b.nickname, exclusive: ALIUS_EXCLUSIVE, teams: [ALIUS_TEAM], baseTeams: [...b.teams],
      // author: all of them are rarity Alius; their stats are still built at the original's rarity (training.ts)
      rarity: 'alius', baseRarity: b.rarity,
      techniques: b.techniques.map((t) => ({ ...t })), heroTech: b.heroTech ? { ...b.heroTech } : undefined,
      stats: b.stats ? { ...b.stats } : null, statFloor: b.statFloor ? { ...b.statFloor } : undefined,
      starter: false, startUnlocked: false,
    };
    m.roster.push(entry);
  }
  // the coach: her portrait among the machine coaches' (coachesScreen and the profile read manifest.coaches)
  const lina = ALIUS_BY_KEY.get('lina')!;
  if (art.lina?.head && m.coaches && !m.coaches.some((c) => c.id === LINA_COACH)) m.coaches.push({ id: LINA_COACH, name: 'Lina Schiller Alius', texture: art.lina.head, source: lina.file });
  else if (!art.lina?.head) problems.push('lina: falta su retrato (tools/alius_assets.py)');
  return problems;
}
