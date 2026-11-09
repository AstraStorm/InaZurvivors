/**
 * v1.5: special compatibility between two footballers for the Aura system (systems/auras.ts). A bond raises the Aura's
 * stat bonus from 15% to 20%. Only relationships that the series or the games establish are listed: shared combined
 * techniques (the same participants as systems/combos.ts), family, childhood friendships and named rivalries. Being in the
 * same team is NOT enough on its own.
 *
 * Bonds are symmetric (A as Aura of B or B as Aura of A). Ids are the roster ids of the manifest; the names are there to
 * read the table and are checked against the roster in tests/auras.test.ts, so a renamed or moved id fails loudly.
 *
 * To add one: a new line with both ids and names, the kind, the reason in Spanish and where it comes from.
 */
export type BondKind = 'tecnica' | 'amistad' | 'familia' | 'rivalidad' | 'companeros' | 'legado';

export interface AuraBond {
  a: number; aName: string;
  b: number; bName: string;
  kind: BondKind;
  /** shown in Mi Equipo when the two are linked */
  reason: string;
  /** combined techniques (combos.ts ids) the pair takes part in, if any */
  combos?: string[];
  source: string;
}

export const BOND_KIND_LABEL: Record<BondKind, string> = {
  tecnica: 'Técnica conjunta', amistad: 'Amistad', familia: 'Familia', rivalidad: 'Rivalidad', companeros: 'Compañeros históricos', legado: 'Legado',
};

/** Compatible pairs give this share of the Aura's stats instead of AURA_PCT (auras.ts). */
export const BOND_PCT = 0.2;

export const AURA_BONDS: AuraBond[] = [
  // 1.76 (author): combined techniques added on request
  { a: 100944, aName: 'Bai Long', b: 100303, bName: 'Tezcat', kind: 'tecnica', reason: 'Rivales y amigos en la película de GO: juntos lanzan Zero Magnum.', combos: ['zero-magnum'],
    source: 'Wiki de Inazuma Eleven (fandom), «Zero Magnum»; película Inazuma Eleven GO.' },
  { a: 157, aName: 'Byron Love', b: 100303, bName: 'Tezcat', kind: 'tecnica', reason: 'Juntos lanzan La Aurora (indicado por el autor).', combos: ['la-aurora-byron'],
    source: 'ROM IE3 (tabla de técnicas), «The Birth»; pareja indicada por el autor.' },
  // Raimon / Inazuma Japón (IE1-IE3)
  { a: 10, aName: 'Axel Blaze', b: 1513, bName: 'Shawn Froste', kind: 'tecnica', reason: 'Fuego y hielo: crean juntos Fuego cruzado y forman parte de La Tierra.', combos: ['fuego-cruzado', 'la-tierra'],
    source: 'Wiki de Inazuma Eleven (fandom), «Crossfire» y «The Earth»; anime Inazuma Eleven.' },
  { a: 10, aName: 'Axel Blaze', b: 1, bName: 'Mark Evans', kind: 'companeros', reason: 'El delantero estrella y el capitán de Raimon: Súper relámpago, Ruptura relámpago y La Tierra.', combos: ['super-relampago', 'ruptura-relampago', 'la-tierra', 'tiro-reaccion'],
    source: 'Wiki de Inazuma Eleven (fandom), «Inazuma Break» y «The Earth».' },
  { a: 10, aName: 'Axel Blaze', b: 11, bName: 'Kevin Dragonfly', kind: 'tecnica', reason: 'Kevin pasa su Remate dragón al Tornado de fuego de Axel: Tornado dragón.', combos: ['tornado-dragon'],
    source: 'Wiki de Inazuma Eleven (fandom), «Dragon Tornado».' },
  { a: 10, aName: 'Axel Blaze', b: 29, bName: 'Jude Sharp', kind: 'tecnica', reason: 'Juntos con Mark lanzan Ruptura relámpago.', combos: ['ruptura-relampago', 'cometa-legendario'],
    source: 'Wiki de Inazuma Eleven (fandom), «Inazuma Break» (episodio 018).' },
  { a: 1, aName: 'Mark Evans', b: 29, bName: 'Jude Sharp', kind: 'tecnica', reason: 'El capitán y el estratega de Raimon: Ruptura relámpago.', combos: ['ruptura-relampago', 'triangulo-letal-2'],
    source: 'Wiki de Inazuma Eleven (fandom), «Inazuma Break».' },
  { a: 1, aName: 'Mark Evans', b: 1513, bName: 'Shawn Froste', kind: 'tecnica', reason: 'Participantes de La Tierra en Inazuma Eleven 2.', combos: ['la-tierra'],
    source: 'Wiki de Inazuma Eleven (fandom), «The Earth».' },
  { a: 1, aName: 'Mark Evans', b: 2, bName: 'Nathan Swift', kind: 'amistad', reason: 'Amigos de la infancia: Nathan fue de los primeros en unirse al club de Mark.',
    source: 'Wiki de Inazuma Eleven (fandom), «Ichirouta Kazemaru».' },
  { a: 1, aName: 'Mark Evans', b: 1024, bName: 'Erik Eagle', kind: 'tecnica', reason: 'Erik, Bobby y Mark lanzan El Fénix.', combos: ['el-fenix', 'tripegaso'],
    source: 'MyAnimeList, Ichinose Kazuya: «The Phoenix», con Endou y Domon.' },
  { a: 1, aName: 'Mark Evans', b: 1025, bName: 'Bobby Shearer', kind: 'tecnica', reason: 'Compañeros en Raimon y en El Fénix.', combos: ['el-fenix', 'triangulo-letal-2', 'tripegaso'],
    source: 'MyAnimeList, Ichinose Kazuya: «The Phoenix».' },
  { a: 1024, aName: 'Erik Eagle', b: 1025, bName: 'Bobby Shearer', kind: 'amistad', reason: 'Amigos de la infancia en Estados Unidos; juntos en El Fénix.', combos: ['el-fenix', 'tripegaso'],
    source: 'Wiki de Inazuma Eleven (fandom), «Kazuya Ichinose» y «Asuka Domon».' },
  { a: 1, aName: 'Mark Evans', b: 100773, bName: 'David Evans', kind: 'familia', reason: 'Nieto y abuelo: el cuaderno de David es la base del fútbol de Mark.',
    source: 'Wiki de Inazuma Eleven (fandom), «Daisuke Endou».' },
  // author: Impulso del equipo definitivo — the three Mixi Max forms of Chrono Storm
  { a: 101004, aName: 'Victor + Okita', b: 101520, bName: 'Arion + Arthur', kind: 'tecnica', reason: 'Chrono Storm: con Fei lanzan el Impulso del equipo definitivo.', combos: ['equipo-definitivo'],
    source: 'Wiki de Inazuma Eleven (fandom), «Impulso del equipo definitivo».' },
  { a: 102346, aName: 'Fei + Big', b: 101520, bName: 'Arion + Arthur', kind: 'tecnica', reason: 'Chrono Storm: con Victor lanzan el Impulso del equipo definitivo.', combos: ['equipo-definitivo'],
    source: 'Wiki de Inazuma Eleven (fandom), «Impulso del equipo definitivo».' },
  { a: 101004, aName: 'Victor + Okita', b: 102346, bName: 'Fei + Big', kind: 'tecnica', reason: 'Chrono Storm: con Arion lanzan el Impulso del equipo definitivo.', combos: ['equipo-definitivo'],
    source: 'Wiki de Inazuma Eleven (fandom), «Impulso del equipo definitivo».' },
  // author: Escena nocturna — Desmodus and Wolfram, the vampire and the wolf
  { a: 101437, aName: 'Desmodus Drakul', b: 100678, bName: 'Wolfram Vulpeen', kind: 'tecnica', reason: 'El vampiro y el lobo: juntos lanzan Escena nocturna bajo la luna roja.', combos: ['escena-nocturna'],
    source: 'Wiki de Inazuma Eleven (fandom), «Escena nocturna».' },
  { a: 101437, aName: 'Desmodus Drakul', b: 100398, bName: 'Vulpeen MM', kind: 'tecnica', reason: 'El vampiro y el lobo: juntos lanzan Escena nocturna bajo la luna roja.', combos: ['escena-nocturna'],
    source: 'Wiki de Inazuma Eleven (fandom), «Escena nocturna»; cualquier Desmodus con cualquier Wolfram (autor).' },
  { a: 101652, aName: 'Drakul MM', b: 100678, bName: 'Wolfram Vulpeen', kind: 'tecnica', reason: 'El vampiro y el lobo: juntos lanzan Escena nocturna bajo la luna roja.', combos: ['escena-nocturna'],
    source: 'Wiki de Inazuma Eleven (fandom), «Escena nocturna»; cualquier Desmodus con cualquier Wolfram (autor).' },
  { a: 101652, aName: 'Drakul MM', b: 100398, bName: 'Vulpeen MM', kind: 'tecnica', reason: 'El vampiro y el lobo: juntos lanzan Escena nocturna bajo la luna roja.', combos: ['escena-nocturna'],
    source: 'Wiki de Inazuma Eleven (fandom), «Escena nocturna»; cualquier Desmodus con cualquier Wolfram (autor).' },
  // author: Último recurso and Último recurso Σ — Asuto, Nosaka, Haizaki and (for Σ) Hikaru Ichihoshi
  { a: 101504, aName: 'Inamori Asuto', b: 100905, bName: 'Nosaka Yuuma', kind: 'tecnica', reason: 'Inazuma Japón: con Haizaki lanzan el Último recurso.', combos: ['ultimo-recurso', 'ultimo-recurso-sigma'],
    source: 'Wiki de Inazuma Eleven (fandom), «Último recurso» y «Último recurso: Sigma».' },
  { a: 101504, aName: 'Inamori Asuto', b: 100979, bName: 'Haizaki Ryouhei', kind: 'tecnica', reason: 'Inazuma Japón: con Nosaka lanzan el Último recurso.', combos: ['ultimo-recurso', 'ultimo-recurso-sigma'],
    source: 'Wiki de Inazuma Eleven (fandom), «Último recurso» y «Último recurso: Sigma».' },
  { a: 100905, aName: 'Nosaka Yuuma', b: 100979, bName: 'Haizaki Ryouhei', kind: 'tecnica', reason: 'Inazuma Japón: con Asuto lanzan el Último recurso.', combos: ['ultimo-recurso', 'ultimo-recurso-sigma'],
    source: 'Wiki de Inazuma Eleven (fandom), «Último recurso» y «Último recurso: Sigma».' },
  { a: 101308, aName: 'Ichihoshi Hikaru', b: 101504, bName: 'Inamori Asuto', kind: 'tecnica', reason: 'Inazuma Japón: los cuatro lanzan el Último recurso Σ.', combos: ['ultimo-recurso-sigma'],
    source: 'Wiki de Inazuma Eleven (fandom), «Último recurso: Sigma»; Hikaru indicado por el autor.' },
  { a: 101308, aName: 'Ichihoshi Hikaru', b: 100905, bName: 'Nosaka Yuuma', kind: 'tecnica', reason: 'Inazuma Japón: los cuatro lanzan el Último recurso Σ.', combos: ['ultimo-recurso-sigma'],
    source: 'Wiki de Inazuma Eleven (fandom), «Último recurso: Sigma»; Hikaru indicado por el autor.' },
  { a: 101308, aName: 'Ichihoshi Hikaru', b: 100979, bName: 'Haizaki Ryouhei', kind: 'tecnica', reason: 'Inazuma Japón: los cuatro lanzan el Último recurso Σ.', combos: ['ultimo-recurso-sigma'],
    source: 'Wiki de Inazuma Eleven (fandom), «Último recurso: Sigma»; Hikaru indicado por el autor.' },
  // author: InaZurvivors x BlueLock — Nagi and Isagi, 20% and Cometa legendario together
  { a: 900200, aName: 'Seishiro Nagi', b: 900201, bName: 'Yoichi Isagi', kind: 'tecnica', reason: 'El genio y el que lo ve todo: compañeros y rivales en Blue Lock, juntos lanzan Cometa legendario.', combos: ['cometa-legendario-bl'],
    source: 'Colaboración InaZurvivors x BlueLock (pedido del autor).' },
  // author: David Evans, the Leyenda nobody played, bonds with every Mark, Hector Helio and Astero Black (the elder Ray Dark)
  { a: 100234, aName: 'Endou Mamoru', b: 100773, bName: 'David Evans', kind: 'familia', reason: 'Nieto y abuelo: Mark adulto sigue entrenando con el cuaderno de David.',
    source: 'Wiki de Inazuma Eleven (fandom), «Daisuke Endou»; vínculo pedido por el autor.' },
  { a: 100332, aName: 'Mark + Arion', b: 100773, bName: 'David Evans', kind: 'familia', reason: 'Mark, aunque sea en Miximax con Arion, sigue siendo su nieto.',
    source: 'Wiki de Inazuma Eleven (fandom), «Daisuke Endou»; vínculo pedido por el autor.' },
  { a: 101894, aName: 'Hector Helio', b: 100773, bName: 'David Evans', kind: 'legado', reason: 'Los dos paran con la Mano celestial X, la técnica que nació en el cuaderno de David.',
    source: 'Movesets de Hector Helio y David Evans (Mano celestial X); vínculo pedido por el autor.' },
  { a: 101558, aName: 'Ray Dark', b: 100773, bName: 'David Evans', kind: 'rivalidad', reason: 'Astero Black, el Ray Dark mayor: el eterno rival de David desde los tiempos del Inazuma Eleven original.',
    source: 'Wiki de Inazuma Eleven (fandom), «Daisuke Endou» y «Reiji Kageyama»; vínculo pedido por el autor.' },
  { a: 1, aName: 'Mark Evans', b: 1616, bName: 'Canon Evans', kind: 'familia', reason: 'Canon es el bisnieto de Mark, llegado del futuro.',
    source: 'Wiki de Inazuma Eleven (fandom), «Kanon Endou».' },
  { a: 1513, aName: 'Shawn Froste', b: 100797, bName: 'Aiden Froste', kind: 'familia', reason: 'Hermanos: Aiden vive en el juego de Shawn. Juntos lanzan Lanza Nórdica Congelada o Frente Frío.', combos: ['lanza-nordica', 'frente-frio', 'ventisca-triple'],
    source: 'Wiki de Inazuma Eleven (fandom), «Atsuya Fubuki».' },
  { a: 29, aName: 'Jude Sharp', b: 1620, bName: 'Celia Hills', kind: 'familia', reason: 'Hermanos separados de pequeños.',
    source: 'Wiki de Inazuma Eleven (fandom), «Haruna Otonashi».' },
  { a: 29, aName: 'Jude Sharp', b: 1542, bName: 'David Samford', kind: 'amistad', reason: 'Compañeros y amigos de la Royal Academy.', combos: ['pinguino-emperador-3'],
    source: 'Wiki de Inazuma Eleven (fandom), «Jirou Sakuma».' },
  { a: 29, aName: 'Jude Sharp', b: 1541, bName: 'Caleb Stonewall', kind: 'rivalidad', reason: 'Rivales desde Shin Teikoku que acaban jugando juntos en Inazuma Japón.', combos: ['campo-fuerza', 'pinguino-emperador-3'],
    source: 'Wiki de Inazuma Eleven (fandom), «Akio Fudou».' },
  { a: 101722, aName: 'Xavier Foster', b: 1513, bName: 'Shawn Froste', kind: 'tecnica', reason: 'De rivales en Alius a compañeros en Inazuma Japón: juntos lanzan La Aurora y, con Jude, Big Bang.', combos: ['la-aurora', 'big-bang'],
    source: 'ROM IE3: «The Birth» (ザ・バース), «La Aurora» en inazumo.es; pareja indicada por el autor.' },
  { a: 101722, aName: 'Xavier Foster', b: 29, bName: 'Jude Sharp', kind: 'tecnica', reason: 'Compañeros en Inazuma Japón: con Shawn lanzan Big Bang.', combos: ['big-bang'],
    source: 'ROM IE3: «Big Bang» (ビッグバン); participantes indicados por el autor.' },
  { a: 29, aName: 'Jude Sharp', b: 1513, bName: 'Shawn Froste', kind: 'tecnica', reason: 'Compañeros en Raimon e Inazuma Japón: con Xavier lanzan Big Bang.', combos: ['big-bang'],
    source: 'ROM IE3: «Big Bang» (ビッグバン); participantes indicados por el autor.' },
  // Alius / Fire Dragon
  { a: 1371, aName: 'Claude Beacons', b: 1370, bName: 'Bryce Whitingale', kind: 'tecnica', reason: 'Los capitanes rivales de Prominence y Diamond Dust: Ventisca de fuego.', combos: ['ventisca-de-fuego', 'remate-caotico'],
    source: 'ROM IE2 en español: «Ventisca de fuego» en el repertorio de ambos; wiki, «Chaos Break».' },
  { a: 157, aName: 'Byron Love', b: 1371, bName: 'Claude Beacons', kind: 'tecnica', reason: 'Remate caótico con Bryce en Fire Dragon.', combos: ['remate-caotico'],
    source: 'Wiki de Inazuma Eleven (fandom), «Chaos Break».' },
  { a: 157, aName: 'Byron Love', b: 1370, bName: 'Bryce Whitingale', kind: 'tecnica', reason: 'Remate caótico con Claude en Fire Dragon.', combos: ['remate-caotico'],
    source: 'Wiki de Inazuma Eleven (fandom), «Chaos Break».' },
  // GO / Chrono Stone / Galaxy
  { a: 100538, aName: 'Arion Sherwind', b: 100544, bName: 'Riccardo Di Rigo', kind: 'tecnica', reason: 'Capitán y cerebro de Raimon GO: La Tierra ∞.', combos: ['la-tierra-inf', 'triple-amenaza'],
    source: 'Wiki de Inazuma Eleven (fandom), «The Earth ∞» (GO Galaxy, episodio 43).' },
  { a: 100538, aName: 'Arion Sherwind', b: 100562, bName: 'Victor Blade', kind: 'tecnica', reason: 'De rivales a compañeros: La Tierra ∞.', combos: ['la-tierra-inf', 'tornado-dd', 'tornado-tc', 'triple-amenaza'],
    source: 'Wiki de Inazuma Eleven (fandom), «The Earth ∞».' },
  { a: 100544, aName: 'Riccardo Di Rigo', b: 100562, bName: 'Victor Blade', kind: 'tecnica', reason: 'Participantes de La Tierra ∞ y Lluvia de azufre.', combos: ['la-tierra-inf', 'lluvia-azufre', 'triple-amenaza'],
    source: 'Wiki de Inazuma Eleven (fandom), «The Earth ∞».' },
  { a: 100562, aName: 'Victor Blade', b: 100828, bName: 'Vladimir Blade', kind: 'familia', reason: 'Hermanos: Victor juega por su hermano Vladimir.',
    source: 'Wiki de Inazuma Eleven (fandom), «Yuuichi Tsurugi».' },
  { a: 100538, aName: 'Arion Sherwind', b: 100427, bName: 'Fey Rune', kind: 'amistad', reason: 'Amigos inseparables durante el viaje en el tiempo de Chrono Stone.',
    source: 'Wiki de Inazuma Eleven (fandom), «Fei Rune».' },
  // (author) Fuego total (Grand Fire): Xavier, Austin and Axel
  { a: 10, aName: 'Axel Blaze', b: 101722, bName: 'Xavier Foster', kind: 'tecnica', reason: 'Fuego y estrellas en Inazuma Japón: con Austin lanzan Fuego total.', combos: ['fuego-total'],
    source: 'Wiki de Inazuma Eleven (fandom), «Grand Fire»; tabla de técnicas de la ROM IE3.' },
  { a: 10, aName: 'Axel Blaze', b: 101719, bName: 'Austin Hobbes', kind: 'tecnica', reason: 'Austin admira a Axel y comparten la delantera: con Xavier lanzan Fuego total.', combos: ['fuego-total', 'tormenta-tigre', 'tiro-reaccion'],
    source: 'Wiki de Inazuma Eleven (fandom), «Grand Fire»; tabla de técnicas de la ROM IE3.' },
  { a: 101722, aName: 'Xavier Foster', b: 101719, bName: 'Austin Hobbes', kind: 'tecnica', reason: 'Delanteros de Inazuma Japón: con Axel lanzan Fuego total.', combos: ['fuego-total'],
    source: 'Wiki de Inazuma Eleven (fandom), «Grand Fire»; tabla de técnicas de la ROM IE3.' },
  // (author) collab players: Shingeki no Kyojin and Nanatsu no Taizai
  { a: 900001, aName: 'Levi Ackerman', b: 900005, bName: 'Erwin Smith', kind: 'companeros', reason: 'El soldado más fuerte de la humanidad y su comandante en el Cuerpo de Exploración.',
    source: 'Colaboración (data/special_players.json): compatibilidad indicada por el autor.' },
  { a: 900002, aName: 'Eren Jaeger', b: 900003, bName: 'Mikasa Ackerman', kind: 'tecnica', reason: 'Crecieron juntos en Shiganshina: con Armin lanzan Big Bang.', combos: ['big-bang-snk'],
    source: 'Colaboración (data/special_players.json): compatibilidad indicada por el autor.' },
  { a: 900002, aName: 'Eren Jaeger', b: 900004, bName: 'Armin Arlert', kind: 'tecnica', reason: 'Amigos de la infancia: con Mikasa lanzan Big Bang.', combos: ['big-bang-snk'],
    source: 'Colaboración (data/special_players.json): compatibilidad indicada por el autor.' },
  { a: 900003, aName: 'Mikasa Ackerman', b: 900004, bName: 'Armin Arlert', kind: 'tecnica', reason: 'Amigos de la infancia: con Eren lanzan Big Bang.', combos: ['big-bang-snk'],
    source: 'Colaboración (data/special_players.json): compatibilidad indicada por el autor.' },
  { a: 900005, aName: 'Erwin Smith', b: 900004, bName: 'Armin Arlert', kind: 'companeros', reason: 'El comandante y el estratega del Cuerpo de Exploración.',
    source: 'Colaboración (data/special_players.json): compatibilidad indicada por el autor.' },
  { a: 900006, aName: 'Meliodas', b: 900008, bName: 'Ban', kind: 'tecnica', reason: 'Pecados capitales y mejores amigos: con Escanor lanzan La Tierra.', combos: ['la-tierra-7ds'],
    source: 'Colaboración (data/special_players.json): compatibilidad indicada por el autor.' },
  { a: 900006, aName: 'Meliodas', b: 900007, bName: 'Escanor', kind: 'tecnica', reason: 'El capitán de los Siete Pecados Capitales y su león: con Ban lanzan La Tierra.', combos: ['la-tierra-7ds'],
    source: 'Colaboración (data/special_players.json): compatibilidad indicada por el autor.' },
  { a: 900007, aName: 'Escanor', b: 900008, bName: 'Ban', kind: 'tecnica', reason: 'Compañeros de los Siete Pecados Capitales: con Meliodas lanzan La Tierra.', combos: ['la-tierra-7ds'],
    source: 'Colaboración (data/special_players.json): compatibilidad indicada por el autor.' },
  // 1.83 (author): the new combined techniques
  { a: 1542, aName: 'David Samford', b: 27, bName: 'Derek Swing', kind: 'tecnica', reason: 'Con Daniel lanzan Triángulo letal.', combos: ['triangulo-letal'],
    source: 'Wiki de Inazuma Eleven (fandom), «Death Zone»; trío indicado por el autor.' },
  { a: 1542, aName: 'David Samford', b: 28, bName: 'Daniel Hatch', kind: 'tecnica', reason: 'Con Derek lanzan Triángulo letal.', combos: ['triangulo-letal'],
    source: 'Wiki de Inazuma Eleven (fandom), «Death Zone»; trío indicado por el autor.' },
  { a: 27, aName: 'Derek Swing', b: 28, bName: 'Daniel Hatch', kind: 'tecnica', reason: 'Con David lanzan Triángulo letal.', combos: ['triangulo-letal'],
    source: 'Wiki de Inazuma Eleven (fandom), «Death Zone»; trío indicado por el autor.' },
  { a: 1025, aName: 'Bobby Shearer', b: 29, bName: 'Jude Sharp', kind: 'tecnica', reason: 'Con Mark lanzan Triángulo letal 2.', combos: ['triangulo-letal-2'],
    source: 'Wiki de Inazuma Eleven (fandom), «Death Zone 2»; trío indicado por el autor.' },
  { a: 100538, aName: 'Arion Sherwind', b: 100577, bName: 'Goldie Lemmon', kind: 'tecnica', reason: 'Con Victor lanzan Tornado dirección triple.', combos: ['tornado-tc'],
    source: 'Wiki de Inazuma Eleven (fandom), «Fire Tornado TC».' },
  { a: 100562, aName: 'Victor Blade', b: 100577, bName: 'Goldie Lemmon', kind: 'tecnica', reason: 'Con Arion lanzan Tornado dirección triple.', combos: ['tornado-tc'],
    source: 'Wiki de Inazuma Eleven (fandom), «Fire Tornado TC».' },
  { a: 100248, aName: 'Clario Orvan', b: 100979, bName: 'Haizaki Ryouhei', kind: 'tecnica', reason: 'Con Erik lanzan Orbe de Perseo.', combos: ['orbe-perseo'],
    source: 'Wiki de Inazuma Eleven (fandom), «Perseus Orb»; trío indicado por el autor.' },
  { a: 100248, aName: 'Clario Orvan', b: 1024, bName: 'Erik Eagle', kind: 'tecnica', reason: 'Con Haizaki lanzan Orbe de Perseo.', combos: ['orbe-perseo'],
    source: 'Wiki de Inazuma Eleven (fandom), «Perseus Orb»; trío indicado por el autor.' },
  { a: 100979, aName: 'Haizaki Ryouhei', b: 1024, bName: 'Erik Eagle', kind: 'tecnica', reason: 'Con Clario lanzan Orbe de Perseo.', combos: ['orbe-perseo'],
    source: 'Wiki de Inazuma Eleven (fandom), «Perseus Orb»; trío indicado por el autor.' },
  { a: 100417, aName: 'Shiratoya Nae', b: 100797, bName: 'Aiden Froste', kind: 'tecnica', reason: 'Con Shawn lanzan Ventisca triple.', combos: ['ventisca-triple'],
    source: 'Wiki de Inazuma Eleven (fandom), «Triple Blizzard».' },
  { a: 100417, aName: 'Shiratoya Nae', b: 1513, bName: 'Shawn Froste', kind: 'tecnica', reason: 'Con Aiden lanzan Ventisca triple.', combos: ['ventisca-triple'],
    source: 'Wiki de Inazuma Eleven (fandom), «Triple Blizzard».' },
  // 1.88 (author)
  { a: 101722, aName: 'Xavier Foster', b: 100907, bName: 'Kira Hiroto', kind: 'tecnica', reason: 'Juntos lanzan Combo cósmico.', combos: ['combo-cosmico'],
    source: 'Orion no Kokuin, «Cosmic Blaster»; pareja indicada por el autor.' },
  { a: 100944, aName: 'Bai Long', b: 100562, bName: 'Victor Blade', kind: 'tecnica', reason: 'Juntos lanzan Gran explosión.', combos: ['gran-explosion'],
    source: 'GO Chrono Stone, «Great Blaster»; pareja indicada por el autor.' },
  { a: 100979, aName: 'Haizaki Ryouhei', b: 100907, bName: 'Kira Hiroto', kind: 'tecnica', reason: 'La luz y la sombra: Pingüinos de luz y sombra.', combos: ['pinguinos-luz-sombra'],
    source: 'Orion no Kokuin, «Penguin the God & Devil»; pareja indicada por el autor.' },
  // 1.88 (author): more combined techniques
  { a: 1618, aName: 'Thor Stoutberg', b: 1513, bName: 'Shawn Froste', kind: 'tecnica', reason: 'Juntos lanzan Bestia del trueno.', combos: ['bestia-trueno'],
    source: 'Técnica combinada indicada por el autor (1.88).' },
  { a: 2, aName: 'Nathan Swift', b: 1513, bName: 'Shawn Froste', kind: 'tecnica', reason: 'Juntos lanzan El huracán.', combos: ['el-huracan'],
    source: 'Técnica combinada indicada por el autor (1.88).' },
  { a: 1, aName: 'Mark Evans', b: 101719, bName: 'Austin Hobbes', kind: 'tecnica', reason: 'Con Axel lanzan Tiro a reacción.', combos: ['tiro-reaccion'],
    source: 'Técnica combinada indicada por el autor (1.88).' },
  { a: 102117, aName: 'Li Hao', b: 101670, bName: 'Malik Kuabel', kind: 'tecnica', reason: 'Con Lus lanzan Uno para todos.', combos: ['uno-para-todos'],
    source: 'Técnica combinada indicada por el autor (1.88).' },
  { a: 102117, aName: 'Li Hao', b: 100772, bName: 'Lus Kasim', kind: 'tecnica', reason: 'Con Malik lanzan Uno para todos.', combos: ['uno-para-todos'],
    source: 'Técnica combinada indicada por el autor (1.88).' },
  { a: 101670, aName: 'Malik Kuabel', b: 100772, bName: 'Lus Kasim', kind: 'tecnica', reason: 'Con Li lanzan Uno para todos.', combos: ['uno-para-todos'],
    source: 'Técnica combinada indicada por el autor (1.88).' },
  { a: 101839, aName: 'Dylan Keats', b: 1024, bName: 'Erik Eagle', kind: 'tecnica', reason: 'Con Mark lanzan Gran lobo.', combos: ['gran-lobo'],
    source: 'Técnica combinada indicada por el autor (1.88).' },
  { a: 101839, aName: 'Dylan Keats', b: 101838, bName: 'Mark Krueger', kind: 'tecnica', reason: 'Con Erik lanzan Gran lobo.', combos: ['gran-lobo'],
    source: 'Técnica combinada indicada por el autor (1.88).' },
  { a: 1024, aName: 'Erik Eagle', b: 101838, bName: 'Mark Krueger', kind: 'tecnica', reason: 'Con Dylan lanzan Gran lobo.', combos: ['gran-lobo'],
    source: 'Técnica combinada indicada por el autor (1.88).' },
  // 2.0 (author): the new combined techniques' pairs
  { a: 102014, aName: 'Sael', b: 102025, bName: 'Destra', kind: 'tecnica', reason: 'Juntos lanzan Lluvia oscura.', combos: ['lluvia-oscura'],
    source: 'Técnica combinada indicada por el autor (2.0).' },
  { a: 100510, aName: 'Gandares Baran', b: 102205, bName: 'Ryugel Baran', kind: 'familia', reason: 'Hermanos: juntos lanzan Grito del Edén.', combos: ['grito-eden'],
    source: 'Técnica combinada indicada por el autor (2.0).' },
  { a: 1541, aName: 'Caleb Stonewall', b: 1542, bName: 'David Samford', kind: 'tecnica', reason: 'Con Jude lanzan Pingüino emperador n.º 3.', combos: ['pinguino-emperador-3'],
    source: 'Técnica combinada indicada por el autor (2.0).' },
];
