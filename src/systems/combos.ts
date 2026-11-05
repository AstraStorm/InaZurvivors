/**
 * Combined supertechniques. Only combinations whose participants were checked against a documented source are listed;
 * the unlock conditions (technique levels) are InaZurvivors design, not canon. Fix 1.51 (author): two participants need
 * levels 3 and 5, three participants 3, 3 and 5. Names and power come from the IE2 Spanish
 * ROM table (data/extracted/ie2_gamedata.json): Fuego cruzado 298/311, Tornado dragón 204, Ruptura relámpago 207.
 *
 * Activation: a SPECIAL slot, separate from each player's technique slots. Once learned (a level-up card that appears
 * when the conditions are met) it fires on its own cooldown while every participant is on the pitch, and never
 * replaces anyone's own techniques. It can be upgraded with later cards up to COMBO_MAX_LEVEL.
 */
import type { RosterEntry, Technique } from '../data/manifest';
import type { TeamMemberState } from './cards';

export const COMBO_MAX_LEVEL = 5;

export interface ComboDef {
  id: string;
  name: string;
  /** original and English names, for reference */
  jp: string;
  en: string;
  element: string;
  power: number;
  /** each participant by roster name, with the technique and run level they need */
  needs: { player: string; tech?: string; level: number }[];
  cooldownMs: number;
  /** what the special slot does when it fires (each one has its own animation in the scene) */
  effect: 'tiro-doble' | 'tiro-dragon' | 'tiro-rayo' | 'fenix' | 'tierra' | 'caos' | 'ventisca' | 'tierra-inf' | 'aurora' | 'bigbang' | 'fuego-total' | 'zero' | 'superrayo' | 'gungnir' | 'frente'
    // 1.83 (fxCombo183.ts)
    | 'triangulo' | 'triangulo2' | 'dragon2' | 'tornado-dd' | 'tornado-tc' | 'perseo' | 'ventisca3'
    // 1.88
    | 'cosmico' | 'granexpl' | 'pinguinos-ls' | 'campo'
    | 'tormenta-tigre' | 'bestia-trueno' | 'huracan' | 'reaccion' | 'unoparatodos' | 'prime' | 'tripegaso' | 'fenix2' | 'granlobo';
  /** Fix 1.12: when several are learnable at once, the higher one is offered first */
  priority: number;
  source: string;
  /** 1.76: combos of one group are alternatives: a run offers one of them at random and learns only one */
  group?: string;
}

export const COMBOS: ComboDef[] = [
  {
    id: 'fuego-cruzado', name: 'Fuego cruzado', jp: 'クロスファイア', en: 'Crossfire', element: 'Fuego', power: 120,
    needs: [{ player: 'Axel Blaze', tech: 'Tornado de fuego', level: 3 }, { player: 'Shawn Froste', tech: 'Ventisca eterna', level: 5 }],
    cooldownMs: 6500, effect: 'tiro-doble', priority: 8,
    source: 'Wiki de Inazuma Eleven (fandom), «Crossfire»: Gouenji (Axel) y Fubuki (Shawn) la crean y la usan en el anime. Condición de niveles: diseño de InaZurvivors.',
  },
  {
    id: 'tornado-dragon', name: 'Tornado dragón', jp: 'ドラゴントルネード', en: 'Dragon Tornado', element: 'Fuego', power: 79,
    needs: [{ player: 'Kevin Dragonfly', tech: 'Remate dragón', level: 3 }, { player: 'Axel Blaze', tech: 'Tornado de fuego', level: 5 }],
    cooldownMs: 5000, effect: 'dragon2', priority: 5, // 1.83 (author): redrawn from its scene (fxCombo183.ts)
    source: 'Wiki de Inazuma Eleven (fandom), «Dragon Tornado»: Someoka (Kevin) pasa con Dragon Crash al Fire Tornado de Gouenji (Axel). Escena: youtube qMR6_ZrmqAg. Condición de niveles: diseño de InaZurvivors.',
  },
  {
    id: 'ruptura-relampago', name: 'Ruptura relámpago', jp: 'イナズマブレイク', en: 'Inazuma Break', element: 'Aire', power: 99,
    needs: [{ player: 'Jude Sharp', level: 3 }, { player: 'Mark Evans', level: 3 }, { player: 'Axel Blaze', level: 5 }],
    cooldownMs: 7000, effect: 'tiro-rayo', priority: 7,
    source: 'Wiki de Inazuma Eleven (fandom), «Inazuma Break»: Kidou (Jude), Endou (Mark) y Gouenji (Axel) la usan contra Senbayama (episodio 018). Condición de niveles: diseño de InaZurvivors.',
  },
  // Fix 1.12
  {
    id: 'el-fenix', name: 'El Fénix', jp: 'ザ・フェニックス', en: 'The Phoenix', element: 'Fuego', power: 125,
    needs: [{ player: 'Erik Eagle', level: 3 }, { player: 'Bobby Shearer', level: 3 }, { player: 'Mark Evans', level: 5 }],
    cooldownMs: 7500, effect: 'fenix2', priority: 8, group: 'fenix-pegaso', // 1.88: redrawn; an alternative of Tripegaso
    source: 'MyAnimeList, Ichinose Kazuya (Erik Eagle): «The Phoenix», con Endou (Mark) y Domon (Bobby). Condición de niveles: diseño de InaZurvivors.',
  },
  {
    id: 'la-tierra', name: 'La Tierra', jp: 'ジ・アース', en: 'The Earth', element: 'Montaña', power: 160,
    needs: [{ player: 'Mark Evans', level: 3 }, { player: 'Axel Blaze', level: 3 }, { player: 'Shawn Froste', level: 5 }],
    cooldownMs: 11000, effect: 'tierra', priority: 10,
    source: 'Wiki de Inazuma Eleven (fandom), «The Earth»: tiro combinado de Gouenji (Axel) que en IE2 hacen Endou (Mark), Gouenji y Fubuki (Shawn) (o Gran). Técnica de máxima categoría: condición de niveles alta, diseño de InaZurvivors.',
  },
  {
    id: 'remate-caotico', name: 'Remate caótico', jp: 'カオスブレイク', en: 'Chaos Break', element: 'Fuego', power: 140,
    needs: [{ player: 'Byron Love', tech: 'Disparo sagrado', level: 3 }, { player: 'Claude Beacons', level: 3 }, { player: 'Bryce Whitingale', level: 5 }], // Fix 1.53 (author): Byron with Disparo sagrado, not his strongest
    cooldownMs: 8500, effect: 'caos', priority: 9,
    source: 'Wiki de Inazuma Eleven (fandom), «Chaos Break»: Afuro (Byron), Nagumo (Claude) y Suzuno (Bryce) en Fire Dragon. Condición de niveles: diseño de InaZurvivors.',
  },
  {
    id: 'ventisca-de-fuego', name: 'Ventisca de fuego', jp: 'ファイアブリザード', en: 'Fire Blizzard', element: 'Fuego', power: 105,
    // Fix 1.51: each one needs his own signature shot (Claude no longer had «Ventisca de fuego», so it could never fire)
    needs: [{ player: 'Claude Beacons', tech: 'Llamarada atómica', level: 3 }, { player: 'Bryce Whitingale', tech: 'Balón Iceberg', level: 5 }],
    cooldownMs: 6000, effect: 'ventisca', priority: 6,
    source: 'ROM IE2 en español (tabla de técnicas): «Ventisca de fuego» en el repertorio de Torch (Claude) y Gazelle (Bryce). Condición de niveles: diseño de InaZurvivors.',
  },
  // Fix 1.51 (author's request)
  {
    id: 'big-bang', name: 'Big Bang', jp: 'ビッグバン', en: 'Big Bang', element: 'Fuego', power: 120,
    needs: [{ player: 'Xavier Foster', level: 3 }, { player: 'Jude Sharp', level: 3 }, { player: 'Shawn Froste', level: 5 }],
    cooldownMs: 10000, effect: 'bigbang', priority: 9,
    source: 'ROM IE3 (tabla de técnicas): «Big Bang» (ビッグバン), tiro de Fuego, poder 120, nombre español verificado. Tiro combinado de Hiroto (Xavier), Kidou (Jude) y Fubuki (Shawn), indicado por el autor con su escena. Condición de niveles: regla del Fix 1.51.',
  },
  // (author) collab: Eren, Mikasa and Armin (data/special_players.json)
  {
    id: 'big-bang-snk', name: 'Big Bang', jp: 'ビッグバン', en: 'Big Bang', element: 'Fuego', power: 120,
    needs: [{ player: 'Mikasa Ackerman', level: 3 }, { player: 'Armin Arlert', level: 3 }, { player: 'Eren Jaeger', level: 5 }],
    cooldownMs: 10000, effect: 'bigbang', priority: 9,
    source: 'ROM IE3 (tabla de técnicas): «Big Bang» (ビッグバン), como la de Xavier, Jude y Shawn. Colaboración (data/special_players.json): Mikasa, Armin y Eren, indicados por el autor. Condición de niveles: regla del Fix 1.51.',
  },
  // (author) collab: Meliodas, Escanor and Ban (data/special_players.json)
  {
    id: 'la-tierra-7ds', name: 'La Tierra', jp: 'ジ・アース', en: 'The Earth', element: 'Montaña', power: 160,
    needs: [{ player: 'Escanor', level: 3 }, { player: 'Ban', level: 3 }, { player: 'Meliodas', level: 5 }],
    cooldownMs: 11000, effect: 'tierra', priority: 10,
    source: 'Wiki de Inazuma Eleven (fandom), «The Earth», como la de Mark, Axel y Shawn. Colaboración (data/special_players.json): Escanor, Ban y Meliodas, indicados por el autor. Condición de niveles: regla del Fix 1.51.',
  },
  // v1.5 (author's request)
  {
    id: 'la-aurora', name: 'La Aurora', jp: 'ザ・バース', en: 'The Birth', element: 'Neutro', power: 110,
    needs: [{ player: 'Xavier Foster', level: 3 }, { player: 'Shawn Froste', level: 5 }],
    cooldownMs: 7000, effect: 'aurora', priority: 8,
    source: 'ROM IE3 (tabla de técnicas): «The Birth» (ザ・バース), tiro, poder 110, sin elemento propio; nombre español «La Aurora» en inazumo.es. Tiro combinado de Hiroto (Xavier) y Fubuki (Shawn), añadido a petición del autor. Condición de niveles: diseño de InaZurvivors.',
  },
  // 1.76 (author): La Aurora can also be done by Byron and Tezcat
  {
    id: 'la-aurora-byron', name: 'La Aurora', jp: 'ザ・バース', en: 'The Birth', element: 'Neutro', power: 110,
    needs: [{ player: 'Byron Love', level: 3 }, { player: 'Tezcat', level: 5 }],
    cooldownMs: 7000, effect: 'aurora', priority: 8,
    source: 'ROM IE3 (tabla de técnicas): «The Birth» (ザ・バース), como la de Xavier y Shawn; con Byron y Tezcat, indicados por el autor. Condición de niveles: regla del Fix 1.51.',
  },
  // 1.76 (author): Bailong and Tezcat, from the GO movie scene the author linked (youtube IVyOcM1cvWI)
  {
    id: 'zero-magnum', name: 'Zero Magnum', jp: 'ゼロマグナム', en: 'Zero Magnum', element: 'Neutro', power: 140,
    needs: [{ player: 'Bai Long', level: 3 }, { player: 'Tezcat', level: 5 }],
    cooldownMs: 9000, effect: 'zero', priority: 9,
    source: 'Wiki de Inazuma Eleven (fandom), «Zero Magnum», y la película de Inazuma Eleven GO (escena enlazada por el autor): Hakuryuu (Bailong) y Shuu (Tezcat). Nombre en data/extracted/es_tech_names.json; elemento Neutro: categoría «Void hissatsu» de la wiki. Potencia y condición de niveles (regla del Fix 1.51): diseño de InaZurvivors.',
  },
  // 1.76 (author): Súper relámpago is Mark and Axel's shot
  {
    id: 'super-relampago', name: 'Súper relámpago', jp: 'イナズマ1号', en: 'Inazuma 1', element: 'Aire', power: 95,
    needs: [{ player: 'Mark Evans', level: 3 }, { player: 'Axel Blaze', level: 5 }],
    cooldownMs: 6000, effect: 'superrayo', priority: 6,
    source: 'Wiki de Inazuma Eleven (fandom), «Inazuma 1»; escena enlazada por el autor (youtube ZnmZGFITVtw): Endou (Mark) y Gouenji (Axel) chutan juntos. Potencia: la del Súper relámpago del plantel (79) subida como combinada; condición de niveles: regla del Fix 1.51.',
  },
  // 1.76 (author): Shawn and Aiden, two alternatives (group): a run offers one of them and keeps it when it levels up
  {
    id: 'lanza-nordica', name: 'Lanza Nórdica Congelada', jp: '氷結のグングニル', en: 'Northern Impact', element: 'Aire', power: 135,
    needs: [{ player: 'Shawn Froste', level: 3 }, { player: 'Aiden Froste', level: 5 }],
    cooldownMs: 8000, effect: 'gungnir', priority: 9, group: 'hermanos-froste',
    source: 'Wiki de Inazuma Eleven (fandom), «Hyouketsu no Gungnir» (Orion no Kokuin); escena enlazada por el autor (youtube -9yTX2fAMqg) y su descripción: Shawn aúlla y se congela, copo de nieve de hielo, Aiden lo chuta con piruetas. Potencia y niveles: diseño de InaZurvivors.',
  },
  {
    id: 'frente-frio', name: 'Frente Frío', jp: 'コールドフロント', en: 'Cold Front', element: 'Aire', power: 125,
    needs: [{ player: 'Shawn Froste', level: 3 }, { player: 'Aiden Froste', level: 5 }],
    cooldownMs: 7000, effect: 'frente', priority: 9, group: 'hermanos-froste',
    source: 'Wiki de Inazuma Eleven (fandom) y códice oficial de Victory Road (zukan.inazuma.jp), «Cold Front»: tiro combinado de clase ventisca con brillo plateado; escena enlazada por el autor (youtube Q8a41dHqJWA, Ares). Potencia y niveles: diseño de InaZurvivors.',
  },
  // (author) Fuego total: the hooded Axel (data/special_players.json) also does it alone, as his own technique
  {
    id: 'fuego-total', name: 'Fuego total', jp: 'グランドファイア', en: 'Grand Fire', element: 'Fuego', power: 105,
    needs: [{ player: 'Xavier Foster', level: 3 }, { player: 'Austin Hobbes', level: 3 }, { player: 'Axel Blaze', level: 5 }],
    cooldownMs: 9000, effect: 'fuego-total', priority: 9,
    source: 'ROM IE3 (tabla de técnicas): «Grand Fire» (グランドファイア), tiro de Fuego, poder 105; nombre español «Fuego total» (wiki en español). Tiro combinado de Hiroto (Xavier), Toramaru (Austin) y Gouenji (Axel), indicado por el autor con su escena. Condición de niveles: regla del Fix 1.51.',
  },
  {
    id: 'la-tierra-inf', name: 'La Tierra ∞', jp: 'ジ・アース∞', en: 'The Earth ∞', element: 'Montaña', power: 165,
    needs: [{ player: 'Arion Sherwind', level: 3 }, { player: 'Riccardo Di Rigo', level: 3 }, { player: 'Victor Blade', level: 5 }],
    cooldownMs: 11000, effect: 'tierra-inf', priority: 10,
    source: 'Wiki de Inazuma Eleven (fandom), «The Earth ∞»: Matsukaze Tenma (Arion), Shindou Takuto (Riccardo) y Tsurugi Kyousuke (Victor) en GO Galaxy, episodio 43. Condición de niveles: diseño de InaZurvivors.',
  },
  // ---- 1.83 (author): six more, drawn from their scenes (fxCombo183.ts); levels by the rule of Fix 1.51
  {
    id: 'triangulo-letal', name: 'Triángulo letal', jp: 'デスゾーン', en: 'Death Zone', element: 'Bosque', power: 96,
    needs: [{ player: 'David Samford', level: 3 }, { player: 'Derek Swing', level: 3 }, { player: 'Daniel Hatch', level: 5 }],
    cooldownMs: 7500, effect: 'triangulo', priority: 7,
    source: 'Wiki de Inazuma Eleven (fandom), «Death Zone»: tiro de Bosque de tres del Royal Academy, poder 96 en IE; escena: youtube IXpyALqFnUI. Jugadores indicados por el autor. Condición de niveles: regla del Fix 1.51.',
  },
  {
    id: 'triangulo-letal-2', name: 'Triángulo letal 2', jp: 'デスゾーン２', en: 'Death Zone 2', element: 'Bosque', power: 108,
    needs: [{ player: 'Mark Evans', level: 3 }, { player: 'Bobby Shearer', level: 3 }, { player: 'Jude Sharp', level: 5 }],
    cooldownMs: 8000, effect: 'triangulo2', priority: 8,
    source: 'Wiki de Inazuma Eleven (fandom), «Death Zone 2»: Kidou (Jude), Endou (Mark) y Domon la crean (episodios 56-58); escena: youtube 0Nlev9ss7pQ. Jugadores indicados por el autor (Bobby). Condición de niveles: regla del Fix 1.51.',
  },
  {
    id: 'tornado-dd', name: 'Tornado dirección doble', jp: 'ファイアトルネードＤＤ', en: 'Fire Tornado DD', element: 'Fuego', power: 110,
    needs: [{ player: 'Arion Sherwind', level: 3 }, { player: 'Victor Blade', level: 5 }],
    cooldownMs: 6500, effect: 'tornado-dd', priority: 7,
    source: 'Wiki de Inazuma Eleven (fandom), «Fire Tornado DD»: Tenma (Arion) y Tsurugi (Victor) en GO; escena: youtube l3JRQQ2Yxns. Condición de niveles: regla del Fix 1.51.',
  },
  {
    id: 'tornado-tc', name: 'Tornado dirección triple', jp: 'ファイアトルネードＴＣ', en: 'Fire Tornado TC', element: 'Fuego', power: 130,
    needs: [{ player: 'Arion Sherwind', level: 3 }, { player: 'Victor Blade', level: 3 }, { player: 'Goldie Lemmon', level: 5 }],
    cooldownMs: 8500, effect: 'tornado-tc', priority: 9,
    source: 'Wiki de Inazuma Eleven (fandom), «Fire Tornado TC»: Kinako (Goldie), Tsurugi (Victor) y Tenma (Arion); escena: youtube 4qac5NNVANc. Condición de niveles: regla del Fix 1.51.',
  },
  {
    id: 'orbe-perseo', name: 'Orbe de Perseo', jp: 'ペルセウスオーブ', en: 'Perseus Orb', element: 'Bosque', power: 120,
    needs: [{ player: 'Clario Orvan', level: 3 }, { player: 'Haizaki Ryouhei', level: 3 }, { player: 'Erik Eagle', level: 5 }],
    cooldownMs: 8000, effect: 'perseo', priority: 8,
    source: 'Wiki de Inazuma Eleven (fandom), «Perseus Orb»: tiro de Bosque de tres en Orion no Kokuin (episodio 49); escena: youtube KwXz5Q_oC7I. Potencia 120 indicada por el autor. Condición de niveles: regla del Fix 1.51.',
  },
  {
    id: 'ventisca-triple', name: 'Ventisca triple', jp: 'トリプルブリザード', en: 'Triple Blizzard', element: 'Aire', power: 100,
    needs: [{ player: 'Shiratoya Nae', level: 3 }, { player: 'Aiden Froste', level: 3 }, { player: 'Shawn Froste', level: 5 }],
    cooldownMs: 7000, effect: 'ventisca3', priority: 8,
    source: 'Wiki de Inazuma Eleven (fandom), «Triple Blizzard»: Nae con Atsuya (Aiden) y Shirou (Shawn) Fubuki en Ares (episodio 17); escena: youtube _pngCtDhHFY. Tiro de Aire de potencia 100 indicado por el autor. Condición de niveles: regla del Fix 1.51.',
  },
  // ---- 1.88 (author): four more, drawn from their scenes (fxCombo183.ts); levels by the rule of Fix 1.51
  {
    id: 'combo-cosmico', name: 'Combo cósmico', jp: 'コズミックブラスター', en: 'Cosmic Blaster', element: 'Bosque', power: 120,
    needs: [{ player: 'Xavier Foster', level: 3 }, { player: 'Kira Hiroto', level: 5 }],
    cooldownMs: 7500, effect: 'cosmico', priority: 8,
    source: 'Wiki de Inazuma Eleven (fandom); Orion no Kokuin, «Cosmic Blaster»; escena: youtube ecXGPbrqhPg. Jugadores, elemento y potencia indicados por el autor. Condición de niveles: regla del Fix 1.51.',
  },
  {
    id: 'gran-explosion', name: 'Gran explosión', jp: 'グレートブラスター', en: 'Great Blaster', element: 'Neutro', power: 100,
    needs: [{ player: 'Bai Long', level: 3 }, { player: 'Victor Blade', level: 5 }],
    cooldownMs: 7000, effect: 'granexpl', priority: 7,
    source: 'Wiki de Inazuma Eleven (fandom); GO Chrono Stone, «Great Blaster»; escena: youtube rDErxErUHVg. Jugadores, elemento y potencia indicados por el autor. Condición de niveles: regla del Fix 1.51.',
  },
  {
    id: 'pinguinos-luz-sombra', name: 'Pingüinos de luz y sombra', jp: 'ペンギン・ザ・ゴッド&デビル', en: 'Penguin the God & Devil', element: 'Bosque', power: 110,
    needs: [{ player: 'Haizaki Ryouhei', level: 3 }, { player: 'Kira Hiroto', level: 5 }],
    cooldownMs: 7500, effect: 'pinguinos-ls', priority: 8,
    source: 'Wiki de Inazuma Eleven (fandom); Orion no Kokuin, «Penguin the God & Devil»; escena: youtube ir9_ksGPszw (desde 0:10). Jugadores, elemento y potencia indicados por el autor. Condición de niveles: regla del Fix 1.51.',
  },
  {
    id: 'campo-fuerza', name: 'Campo de fuerza', jp: 'キラーフィールズ', en: 'Killer Fields', element: 'Bosque', power: 90,
    needs: [{ player: 'Jude Sharp', level: 3 }, { player: 'Caleb Stonewall', level: 5 }],
    cooldownMs: 6500, effect: 'campo', priority: 6,
    source: 'Wiki de Inazuma Eleven (fandom); GO Strikers 2013, «Killer Fields»; escena: youtube Px3uzqGt2pM (desde 0:12). Jugadores, elemento y potencia indicados por el autor. Condición de niveles: regla del Fix 1.51.',
  },
  // ---- 1.88 (author): more, drawn from their scenes watched frame by frame (fxCombo183.ts); levels by the rule of Fix 1.51
  { id: 'tormenta-tigre', name: 'Tormenta del tigre', jp: 'タイガーストーム', en: 'Tiger Storm', element: 'Fuego', power: 100,
    needs: [{ player: 'Axel Blaze', level: 3 }, { player: 'Austin Hobbes', level: 5 }], cooldownMs: 7000, effect: 'tormenta-tigre', priority: 7,
    source: 'Wiki de Inazuma Eleven (fandom), «Tiger Storm»: Bakunetsu Storm de Gouenji (Axel) y Tiger Drive de Toramaru (Austin); escena youtube cAJYemRVVLs. Poder de la ROM (100).' },
  { id: 'bestia-trueno', name: 'Bestia del trueno', jp: 'サンダービースト', en: 'Thunder Beast', element: 'Aire', power: 110,
    needs: [{ player: 'Thor Stoutberg', level: 3 }, { player: 'Shawn Froste', level: 5 }], cooldownMs: 7000, effect: 'bestia-trueno', priority: 7,
    source: 'Wiki de Inazuma Eleven (fandom), «Thunder Beast» (IE3, episodio 81); escena youtube Xs9O-eehI-E. Jugadores indicados por el autor.' },
  { id: 'el-huracan', name: 'El huracán', jp: 'ザ・ハリケーン', en: 'The Hurricane', element: 'Aire', power: 100,
    needs: [{ player: 'Nathan Swift', level: 3 }, { player: 'Shawn Froste', level: 5 }], cooldownMs: 6500, effect: 'huracan', priority: 6,
    source: 'Wiki de Inazuma Eleven (fandom), «The Hurricane»: Kazemaru (Nathan) y Fubuki (Shawn); escena youtube af5TD_ISrSg.' },
  { id: 'tiro-reaccion', name: 'Tiro a reacción', jp: 'ジェットストリーム', en: 'Jet Stream', element: 'Montaña', power: 120,
    needs: [{ player: 'Mark Evans', level: 3 }, { player: 'Axel Blaze', level: 3 }, { player: 'Austin Hobbes', level: 5 }], cooldownMs: 8000, effect: 'reaccion', priority: 8,
    source: 'Wiki de Inazuma Eleven (fandom), «Jet Stream»: Endou (Mark), Gouenji (Axel) y Toramaru (Austin); escena youtube F45DrrGBqac.' },
  { id: 'uno-para-todos', name: 'Uno para todos', jp: 'ソード・オブ・ダルタニャン', en: 'Sword of d\'Artagnan', element: 'Montaña', power: 105,
    needs: [{ player: 'Li Hao', level: 3 }, { player: 'Malik Kuabel', level: 3 }, { player: 'Lus Kasim', level: 5 }], cooldownMs: 7500, effect: 'unoparatodos', priority: 7,
    source: 'Wiki de Inazuma Eleven (fandom), Orion no Kokuin, «Sword of d\'Artagnan» (los mosqueteros: uno para todos); escena youtube _cjicnkWEhw (desde 0:05). Li Hao, Malik y Lus en la escena (Jimmy Wongfu, Martmeli y Oleg según el autor). Elemento y potencia indicados por el autor.' },
  { id: 'cometa-legendario', name: 'Cometa legendario', jp: 'プライムレジェンド', en: 'Prime Legend', element: 'Aire', power: 115,
    needs: [{ player: 'Jude Sharp', level: 3 }, { player: 'Axel Blaze', level: 5 }], cooldownMs: 7500, effect: 'prime', priority: 8,
    source: 'Wiki de Inazuma Eleven (fandom), «Prime Legend»: Kidou (Jude) y Gouenji (Axel); escena youtube yYKkXmp5AzI.' },
  { id: 'tripegaso', name: 'Tripegaso', jp: 'トライペガサス', en: 'Tri-Pegasus', element: 'Montaña', power: 110,
    needs: [{ player: 'Erik Eagle', level: 3 }, { player: 'Bobby Shearer', level: 3 }, { player: 'Mark Evans', level: 5 }], cooldownMs: 7500, effect: 'tripegaso', priority: 8, group: 'fenix-pegaso',
    source: 'Wiki de Inazuma Eleven (fandom), «Tri-Pegasus»: Ichinose (Erik), Domon (Bobby) y Endou (Mark), episodio 21; escena youtube wKoZ4gJcs9w. Alternativa de El Fénix (autor).' },
  { id: 'gran-lobo', name: 'Gran lobo', jp: 'グランフェンリル', en: 'Gran Fenrir', element: 'Bosque', power: 115,
    needs: [{ player: 'Dylan Keats', level: 3 }, { player: 'Erik Eagle', level: 3 }, { player: 'Mark Krueger', level: 5 }], cooldownMs: 8000, effect: 'granlobo', priority: 8,
    source: 'Wiki de Inazuma Eleven (fandom), «Gran Fenrir»: Ichinose (Erik), Mark Kruger y Dylan; escena youtube DWnf-a6fAlM.' },
];
/**
 * Fix 1.51 (author): other versions of a footballer can stand in for him in every combined technique — his alias in
 * another arc, his alternate-universe self and his Miximax fusions. Roster names; checked against the roster in
 * tests/aura_roster.test.ts.
 */
export const COUNTERPARTS: Record<string, string[]> = {
  'Shawn Froste': ['Shawn + Axel'],
  'Xavier Foster': ['Xene', 'Jordan + Xavier'], // 1.88 (author): Kira Hiroto is another character
  // special footballer (data/special_players.json): Axel in his Okinawa hoodie
  'Axel Blaze': ['Axel Blaze Encapuchado'],
  'Mark Evans': ['Endou Mamoru'], // 1.88 (bug report): the same character as Mark (identity.ALIASES), so he plays Mark's part too
  // 1.76: their Miximax fusions also count for Zero Magnum and La Aurora
  'Bai Long': ['Bailong + Zhuge', 'Bailong + Victor', 'Tezcat + Bailong'],
  'Tezcat': ['Arion + Tezcat', 'Tezcat + Bailong'],
};
/** True when a roster name can play the part of a participant (himself or one of his counterparts). */
export const playsAs = (name: string | undefined, player: string) => !!name && (name === player || !!COUNTERPARTS[player]?.includes(name));

/** Highest priority first: the order in which learnable combinations are offered. */
export const COMBOS_BY_PRIORITY = [...COMBOS].sort((a, b) => b.priority - a.priority);

export interface OnPitch { entry: RosterEntry; state: TeamMemberState }

/**
 * 1.81 (author: the hooded Axel could raise none of his techniques for the combinations): a counterpart who doesn't own
 * the named technique at all (Axel Blaze Encapuchado has no Tornado de fuego) uses his best active one instead.
 */
const ownsTech = (m: OnPitch, tech: string) => m.entry.techniques.some((t) => t?.name.toLowerCase() === tech.toLowerCase());
const neededTech = (m: OnPitch, tech: string | undefined, player: string) =>
  (tech && (ownsTech(m, tech) || !standsIn(m, player)) ? tech : undefined);
/** someone other than the named footballer covers the part: a counterpart, himself or carried as Aura */
const standsIn = (m: OnPitch, player: string) => m.entry.name !== player && m.entry.aura?.name !== player;

/** 1.83: the active technique that counts for a part with no named technique: the highest level, the first slot on a tie */
function bestActiveName(m: OnPitch): string | undefined {
  let best: { name: string; lv: number } | undefined;
  for (const idx of m.state.slots) {
    if (idx === null || idx === undefined) continue;
    const t: Technique | undefined = m.entry.techniques[idx];
    if (!t) continue;
    const lv = m.state.levels[idx] ?? 1;
    if (!best || lv > best.lv) best = { name: t.name, lv };
  }
  return best?.name;
}

/** Run level of a named technique in a player's active slots (0 if not active); without a name, their best active one. */
function activeLevel(m: OnPitch, wanted: string | undefined, player: string) {
  const tech = neededTech(m, wanted, player);
  let best = 0;
  for (const idx of m.state.slots) {
    if (idx === null || idx === undefined) continue;
    const t: Technique | undefined = m.entry.techniques[idx];
    if (!t || (tech && t.name.toLowerCase() !== tech.toLowerCase())) continue;
    best = Math.max(best, m.state.levels[idx] ?? 1);
  }
  return best;
}

/**
 * v1.5: who covers each participant: the footballer himself on the pitch, or — when he isn't — a teammate carrying him as
 * Aura (auras.ts). Through an Aura the requirement is checked on the carrier: the needed technique must be active on him
 * (inherited from the Aura) at the needed level; without a named technique, the carrier's best active level counts.
 * A carrier can stand for himself and for his Aura in the same combination; nothing else is shared.
 */
export function comboCast<T extends OnPitch>(c: ComboDef, team: T[]): { member: T; viaAura: boolean; player: string }[] {
  const out: { member: T; viaAura: boolean; player: string }[] = [];
  for (const n of c.needs) {
    const self = team.find((x) => playsAs(x.entry.name, n.player) && activeLevel(x, n.tech, n.player) >= n.level);
    const carrier = self ? undefined : team.find((x) => playsAs(x.entry.aura?.name, n.player) && activeLevel(x, n.tech, n.player) >= n.level);
    const m = self ?? carrier;
    if (!m) return [];
    out.push({ member: m, viaAura: !self, player: n.player });
  }
  return out;
}

/** True when every participant is on the pitch (or carried as Aura) with the required technique active at the required level. */
export const comboReady = (c: ComboDef, team: OnPitch[]) => comboCast(c, team).length > 0;

/**
 * Members taking part, in the order of the definition (only when all are present). Presence only, no level check: once
 * learned, a combination keeps firing while its participants (or their carriers) are on the pitch.
 */
export function comboMembers<T extends OnPitch>(c: ComboDef, team: T[]): T[] {
  const out = c.needs.map((n) => team.find((x) => playsAs(x.entry.name, n.player)) ?? team.find((x) => playsAs(x.entry.aura?.name, n.player)));
  if (!out.every(Boolean)) return [];
  return [...new Set(out as T[])];
}

/** Damage per hit of the combined shot: stronger than either solo shot, +20% per combo level. */
export const comboDamage = (c: ComboDef, level: number, mult = 1) => Math.round(c.power * 0.75 * (1 + 0.2 * (level - 1)) * mult);

/** v1.7: one participant of a combination still to learn, with the level he has now and the one he needs. */
export interface ComboPart { player: string; tech?: string; need: number; have: number; /** 1.81: who covers him lacks the named technique, so any of his counts */ anyTech?: boolean;
  /** 1.83: when any technique counts, the one that does now (his highest), so the HUD can point at it */ bestTech?: string; /** roster id of who covers him (himself or his Aura carrier); null when nobody on the pitch does */ memberId: number | null; viaAura: boolean }
export interface ComboGoal { combo: ComboDef; parts: ComboPart[]; /** every participant on the pitch (or carried as Aura) */ complete: boolean; /** every level reached: the card shows up at the next level-up */ ready: boolean }

/**
 * v1.7: combinations not learned yet that the team on the pitch takes part in (at least one participant), with what each
 * participant still needs. Same rules as comboCast: the footballer himself first, then a teammate carrying him as Aura.
 */
export function comboGoals(team: OnPitch[], learned: Iterable<string> = []): ComboGoal[] {
  const got = new Set(learned);
  const out: ComboGoal[] = [];
  for (const c of COMBOS_BY_PRIORITY) {
    if (got.has(c.id)) continue;
    const parts = c.needs.map((n): ComboPart => {
      const self = team.find((x) => playsAs(x.entry.name, n.player));
      const m = self ?? team.find((x) => playsAs(x.entry.aura?.name, n.player));
      return { player: n.player, tech: n.tech, need: n.level, have: m ? activeLevel(m, n.tech, n.player) : 0, memberId: m?.entry.id ?? null, viaAura: !self && !!m,
        anyTech: !!m && !!n.tech && !neededTech(m, n.tech, n.player),
        bestTech: m && (!n.tech || !neededTech(m, n.tech, n.player)) ? bestActiveName(m) : undefined };
    });
    if (!parts.some((p) => p.memberId !== null)) continue;
    const complete = parts.every((p) => p.memberId !== null);
    out.push({ combo: c, parts, complete, ready: complete && parts.every((p) => p.have >= p.need) });
  }
  return out;
}

/**
 * v1.7: combinations a level-up card brings closer: raising technique `techName` of `memberId` to `toLevel` (1 = learning
 * it). Only for complete goals (everyone on the pitch) and parts still short of their level.
 */
export function comboHints(goals: ComboGoal[], memberId: number, techName: string, toLevel: number) {
  const out: { name: string; need: number; reaches: boolean }[] = [];
  for (const g of goals) {
    if (!g.complete || g.ready) continue;
    for (const p of g.parts) {
      if (p.memberId !== memberId || p.have >= p.need || toLevel <= p.have) continue;
      const counts = p.tech && !p.anyTech ? p.tech : p.bestTech; // 1.83: only the technique that counts, not all of his
      if (counts && counts.toLowerCase() !== techName.toLowerCase()) continue;
      out.push({ name: g.combo.name, need: p.need, reaches: toLevel >= p.need });
      break;
    }
  }
  return out;
}

/**
 * Fix 1.32: combined techniques of a squad (Mi Equipo), before the run: `ready` when every participant is among the
 * candidates, otherwise the names still missing. Only combos with at least one participant in the squad.
 */
export function squadCombos(squad: Pick<RosterEntry, 'name' | 'id'>[], auraNames: string[] = []) {
  // v1.5: an Aura counts as present (its carrier brings it)
  const names = new Set([...squad.map((p) => p.name), ...auraNames]);
  return COMBOS_BY_PRIORITY.map((c) => {
    const has = (player: string) => [...names].some((nm) => playsAs(nm, player));
    const present = c.needs.filter((n) => has(n.player)).map((n) => n.player);
    const missing = c.needs.filter((n) => !has(n.player)).map((n) => n.player);
    return { combo: c, present, missing, ready: !missing.length, viaAura: present.filter((n) => auraNames.some((a) => playsAs(a, n)) && !squad.some((p) => playsAs(p.name, n))) };
  }).filter((x) => x.present.length > 0);
}
