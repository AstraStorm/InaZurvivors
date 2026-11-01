/**
 * Who fights how. Each boss has three phases by remaining health, each adding attacks; rivals of the Desafío have two.
 * The attacks are mechanics of InaZurivors; the names shown when they are announced come from each character's story
 * or from their own techniques. Every attack is telegraphed by the scene and can be dodged.
 */
export type AttackId = 'carga' | 'radial' | 'abanico' | 'espiral' | 'lluvia' | 'onda' | 'invocacion' | 'majin';

export interface BossKit {
  title: string;
  /** attacks available in phase 1, 2 and 3 */
  phases: [AttackId[], AttackId[], AttackId[]];
  names: Partial<Record<AttackId, string>>;
  /** accent of its telegraphs */
  color: number;
  /** seconds between attacks per phase */
  tempo: [number, number, number];
}

const KITS: Record<string, BossKit> = {
  'David Samford': { title: 'Emperador del Royal', color: 0x4fa8ff, tempo: [4, 3.2, 2.5],
    phases: [['abanico', 'carga'], ['abanico', 'carga', 'invocacion'], ['abanico', 'invocacion', 'majin', 'espiral']],
    names: { abanico: 'Pingüino Emperador', invocacion: 'Pingüinos del Royal', carga: 'Sprint imperial', majin: 'Golpe del emperador', espiral: 'Remolino de pingüinos' } },
  Xene: { title: 'Capitán de Génesis', color: 0xc76bff, tempo: [3.8, 3, 2.3],
    phases: [['lluvia', 'radial'], ['lluvia', 'onda', 'espiral'], ['lluvia', 'onda', 'majin', 'invocacion']],
    names: { lluvia: 'Meteoros alienígenas', radial: 'Disparo galáctico', onda: 'Onda gravitatoria', espiral: 'Espiral cósmica', majin: 'Poder de Génesis', invocacion: 'Soldados de Aliea' } },
  'Byron Love': { title: 'El Dios de Zeus', color: 0xffe08a, tempo: [3.6, 2.9, 2.2],
    phases: [['espiral', 'onda'], ['espiral', 'onda', 'carga', 'lluvia'], ['onda', 'majin', 'invocacion', 'abanico']],
    names: { espiral: 'Heaven\'s Time', onda: 'Luz divina', carga: 'Vuelo celestial', lluvia: 'Juicio de los dioses', majin: 'Ira divina', invocacion: 'Discípulos de Zeus', abanico: 'Alas de ángel' } },
};

const BY_ELEMENT: Record<string, Pick<BossKit, 'phases' | 'color'>> = {
  Fuego: { color: 0xff6a2a, phases: [['abanico'], ['abanico', 'onda'], ['abanico', 'onda', 'lluvia']] },
  Aire: { color: 0x7fe0ff, phases: [['espiral'], ['espiral', 'carga'], ['espiral', 'carga', 'abanico']] },
  Bosque: { color: 0x6fe06a, phases: [['radial'], ['radial', 'invocacion'], ['radial', 'invocacion', 'espiral']] },
  'Montaña': { color: 0xe0a860, phases: [['onda'], ['onda', 'carga'], ['onda', 'carga', 'majin']] },
};

export const bossKit = (name: string, element?: string | null): BossKit => KITS[name] ?? {
  title: 'Jefe', tempo: [4.2, 3.4, 2.8], names: {},
  ...(BY_ELEMENT[element ?? ''] ?? { color: 0xff5050, phases: [['radial'], ['radial', 'carga'], ['radial', 'carga', 'lluvia']] }),
};

/** Phase (0-2) from remaining health: above 2/3, above 1/3, below. */
export const bossPhase = (hp: number, maxHp: number) => (hp > maxHp * 2 / 3 ? 0 : hp > maxHp / 3 ? 1 : 2);

/** Rival of the Desafío: its position decides how it fights, and its own techniques name the attacks. */
const RIVAL_BY_POS: Record<string, AttackId[][]> = {
  FW: [['abanico', 'carga'], ['abanico', 'carga', 'espiral']],
  MF: [['espiral', 'abanico'], ['espiral', 'lluvia', 'invocacion']],
  DF: [['onda', 'carga'], ['onda', 'carga', 'invocacion']],
  GK: [['onda', 'radial'], ['onda', 'majin', 'radial']],
};

export function rivalKit(position: string | undefined, techniques: string[], color: number): BossKit {
  const [a, b] = RIVAL_BY_POS[position ?? ''] ?? RIVAL_BY_POS.FW;
  const pool = [...new Set([...a, ...b])];
  const names: BossKit['names'] = {};
  pool.forEach((id, i) => { if (techniques.length) names[id] = techniques[i % techniques.length]; });
  return { title: 'Rival', phases: [a, b, b], names, color, tempo: [3.6, 2.7, 2.7] };
}
