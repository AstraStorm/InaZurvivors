/**
 * 2.4: the arenas' names and blurbs come from public/generated/manifest.json in Spanish; main.ts swaps them for the
 * player's language when the manifest loads (by map id, so nothing that compares ids changes). English names follow
 * the dub (Raimon Junior High, Royal Academy…), French ones the French dub (Collège Raimon, Académie Alius…).
 */
import { getLang } from './i18n';
import type { MapInfo } from '../data/manifest';

type MapText = Record<string, [name: string, blurb: string]>;

const EN: MapText = {
  raimon: ['Raimon Junior High', 'Where it all begins. Your school pitch against the teams of the regional tournament.'],
  ribera: ['Riverbank', 'The park by the river where Raimon trains. Neighbourhood rivals to warm up.'],
  royal: ['Royal Academy', 'The Royal Academy fortress. Narrow corridors and rivals who never miss.'],
  nara: ['Deer Park', 'Nara: Gemini Storm lands next to the great deer statue.'],
  zeus: ['Zeus Stadium', 'A golden stadium for the gods of Zeus Junior High.'],
  alpino: ['Alpine Park', 'Hokkaido: Alpine Junior High among pines and snow.'],
  nevada: ['Great Snowy Plain', 'Deep Hokkaido: Diamond Dust in the snow. Slippery and unforgiving.'],
  claustro: ['Cloister Divinity', 'Kyoto: the temple of Cloister Divinity and its stairs.'],
  naniwa: ['Naniwaland', 'The Osaka amusement park. The Triple C girls play at home.'],
  yokato: ['Yokato Junior High', 'Fukuoka: Epsilon and Prominence meet in the Yokato yard.'],
  marytimes: ['Mary Times Island', 'Okinawa: terraces, little houses and a beach. Go down to the sand.'],
  fuji: ['Sea of Trees', 'The hidden clearing in the Fuji forest, at the gates of Alius Academy. The end of the path.'],
  ehime: ['Ehime Port', 'Ehime: the port where the Royal Academy Redux submarine docks. Caleb Stonewall waits for you among the containers.'],
  alius: ['Alius Academy', 'The Alius Academy pitch, under the light of the stone. Genesis plays at home.'],
  ruinas: ['Ruined School', 'Umbrella, laid waste. Among the rubble, the Dark Emperors: the last challenge.'],
  barrio: ['Shopping Street Park', 'The little playground pitch by Inazuma\'s shopping street, where the Inazuma Kids FC train. Open streets on every side: they surround you from any corner.'],
  plazanieve: ['Alpine Snowy Square', 'The round square in front of Alpine Junior High, in Hokkaido. Frozen hedges, a pond in the middle and knee-deep snow.'],
  torre: ['Iron Tower at Sunset', 'The hill of the Inazuma tower, where Mark trained as a child. As the sun sets, the Raimon captain waits for you at the top: the last challenge.'],
  clan: ['Cherry Blossom Hill', 'The cherry blossom park where the clans compete. Only for the Clan Games.'],
};

const FR: MapText = {
  raimon: ['Collège Raimon', 'Là où tout commence. Le terrain de ton collège contre les équipes du tournoi régional.'],
  ribera: ['Bord de la rivière', 'Le parc au bord de la rivière où s\'entraîne Raimon. Des adversaires du quartier pour s\'échauffer.'],
  royal: ['Royal Academy', 'La forteresse de la Royal Academy. Des couloirs étroits et des adversaires qui ne ratent jamais.'],
  nara: ['Parc aux cerfs', 'Nara : Gemini Storm atterrit à côté de la grande statue du cerf.'],
  zeus: ['Stade Zeus', 'Un stade doré pour les dieux du Collège Zeus.'],
  alpino: ['Parc d\'Alpine', 'Hokkaido : le collège Alpine entre les pins et la neige.'],
  nevada: ['Grande Plaine enneigée', 'Au fin fond d\'Hokkaido : Diamond Dust dans la neige. Ça glisse et ça ne pardonne pas.'],
  claustro: ['Cloister Divinity', 'Kyoto : le temple de Cloister Divinity et ses escaliers.'],
  naniwa: ['Naniwaland', 'Le parc d\'attractions d\'Osaka. Les filles du Triple C jouent à domicile.'],
  yokato: ['Collège Yokato', 'Fukuoka : Epsilon et Prominence se retrouvent dans la cour du Yokato.'],
  marytimes: ['Île de Mary Times', 'Okinawa : des terrasses, des petites maisons et une plage. Descends jusqu\'au sable.'],
  fuji: ['Mer d\'arbres', 'La clairière cachée de la forêt du Fuji, aux portes de l\'Académie Alius. La fin du chemin.'],
  ehime: ['Port d\'Ehime', 'Ehime : le port où accoste le sous-marin de la Royal Academy Redux. Caleb Stonewall t\'attend entre les conteneurs.'],
  alius: ['Académie Alius', 'Le terrain de l\'Académie Alius, sous la lumière de la pierre. Genesis joue à domicile.'],
  ruinas: ['Collège en ruines', 'Umbrella, dévasté. Parmi les décombres, les Empereurs Noirs : le dernier défi.'],
  barrio: ['Parc de la rue commerçante', 'Le petit terrain aux balançoires près de la rue commerçante d\'Inazuma, où s\'entraînent les Inazuma Kids FC. Des rues ouvertes de tous les côtés : ils t\'encerclent depuis n\'importe quel coin.'],
  plazanieve: ['Place enneigée d\'Alpine', 'La place ronde devant le collège Alpine, à Hokkaido. Des haies gelées, un bassin au centre et de la neige jusqu\'aux genoux.'],
  torre: ['Tour de fer au coucher du soleil', 'La colline de la tour d\'Inazuma, où Mark s\'entraînait enfant. Au coucher du soleil, le capitaine de Raimon t\'attend en haut : le dernier défi.'],
  clan: ['Colline des Cerisiers', 'Le parc aux cerisiers où s\'affrontent les clans. Uniquement pour les Jeux du Clan.'],
};

const IT: MapText = {
  raimon: ['Scuola Raimon', 'Dove tutto ha inizio. Il campo della tua scuola contro le squadre del torneo regionale.'],
  ribera: ['Riva del fiume', 'Il parco lungo il fiume dove si allena la Raimon. Avversari di quartiere per scaldarsi.'],
  royal: ['Royal Academy', 'La fortezza della Royal Academy. Corridoi stretti e avversari che non sbagliano.'],
  nara: ['Parco dei Cervi', 'Nara: la Gemini Storm atterra accanto alla grande statua del cervo.'],
  zeus: ['Stadio Zeus', 'Uno stadio dorato per gli dèi della Scuola Zeus.'],
  alpino: ['Parco dell\'Alpine', 'Hokkaido: la scuola Alpine tra pini e neve.'],
  nevada: ['Grande Pianura Innevata', 'Hokkaido profondo: la Diamond Dust nella neve. Si scivola e non perdona.'],
  claustro: ['Cloister Divinity', 'Kyoto: il tempio del Cloister Divinity e le sue scale.'],
  naniwa: ['Naniwaland', 'Il parco divertimenti di Osaka. Le ragazze del Triple C giocano in casa.'],
  yokato: ['Scuola Yokato', 'Fukuoka: Epsilon e Prominence si ritrovano nel cortile della Yokato.'],
  marytimes: ['Isola di Mary Times', 'Okinawa: terrazze, casette e spiaggia. Scendi fino alla sabbia.'],
  fuji: ['Mare di Alberi', 'La radura nascosta nel bosco del Fuji, alle porte dell\'Accademia Alius. La fine del cammino.'],
  ehime: ['Porto di Ehime', 'Ehime: il porto dove attracca il sottomarino della Royal Academy Redux. Caleb Stonewall ti aspetta tra i container.'],
  alius: ['Accademia Alius', 'Il campo dell\'Accademia Alius, sotto la luce della pietra. La Genesis gioca in casa.'],
  ruinas: ['Scuola in rovina', 'L\'Umbrella, rasa al suolo. Tra le macerie, gli Imperatori Oscuri: l\'ultima sfida.'],
  barrio: ['Parco della via dei negozi', 'Il campetto con le altalene accanto alla via dei negozi di Inazuma, dove si allenano gli Inazuma Kids FC. Strade aperte da ogni lato: ti circondano da ogni angolo.'],
  plazanieve: ['Piazza innevata dell\'Alpine', 'La piazza rotonda davanti alla scuola Alpine, a Hokkaido. Siepi ghiacciate, uno stagno al centro e neve fino alle ginocchia.'],
  torre: ['Torre di ferro al tramonto', 'La collina della torre di Inazuma, dove Mark si allenava da piccolo. Al tramonto, il capitano della Raimon ti aspetta in cima: l\'ultima sfida.'],
  clan: ['Collina dei Ciliegi', 'Il parco dei ciliegi dove si sfidano i clan. Solo per i Giochi del Clan.'],
};

const DE: MapText = {
  raimon: ['Raimon-Schule', 'Wo alles beginnt. Der Platz deiner Schule gegen die Teams des Regionalturniers.'],
  ribera: ['Flussufer', 'Der Park am Fluss, wo Raimon trainiert. Gegner aus dem Viertel zum Aufwärmen.'],
  royal: ['Royal Academy', 'Die Festung der Royal Academy. Enge Gänge und Gegner, die keine Fehler machen.'],
  nara: ['Hirschpark', 'Nara: Gemini Storm landet neben der großen Hirschstatue.'],
  zeus: ['Zeus-Stadion', 'Ein goldenes Stadion für die Götter der Zeus-Schule.'],
  alpino: ['Alpine-Park', 'Hokkaido: die Alpine-Schule zwischen Kiefern und Schnee.'],
  nevada: ['Große Schneeebene', 'Tiefstes Hokkaido: Diamond Dust im Schnee. Man rutscht, und sie verzeiht nichts.'],
  claustro: ['Cloister Divinity', 'Kyoto: der Tempel von Cloister Divinity und seine Treppen.'],
  naniwa: ['Naniwaland', 'Der Freizeitpark von Osaka. Die Mädchen von Triple C spielen zu Hause.'],
  yokato: ['Yokato-Schule', 'Fukuoka: Epsilon und Prominence treffen sich auf dem Schulhof von Yokato.'],
  marytimes: ['Mary-Times-Insel', 'Okinawa: Terrassen, Häuschen und Strand. Geh bis zum Sand hinunter.'],
  fuji: ['Baummeer', 'Die versteckte Lichtung im Wald am Fuji, vor den Toren der Alius-Akademie. Das Ende des Wegs.'],
  ehime: ['Hafen von Ehime', 'Ehime: der Hafen, in dem das U-Boot der Royal Academy Redux anlegt. Caleb Stonewall wartet zwischen den Containern auf dich.'],
  alius: ['Alius-Akademie', 'Der Platz der Alius-Akademie, im Licht des Steins. Genesis spielt zu Hause.'],
  ruinas: ['Schulruine', 'Umbrella, dem Erdboden gleichgemacht. In den Trümmern die Dunklen Kaiser: die letzte Herausforderung.'],
  barrio: ['Park an der Einkaufsstraße', 'Der kleine Platz mit Schaukeln neben der Einkaufsstraße von Inazuma, wo die Inazuma Kids FC trainieren. Offene Straßen auf allen Seiten: Sie umzingeln dich aus jeder Ecke.'],
  plazanieve: ['Verschneiter Platz von Alpine', 'Der runde Platz vor der Alpine-Schule in Hokkaido. Vereiste Hecken, ein Teich in der Mitte und Schnee bis zu den Knien.'],
  torre: ['Eisenturm bei Sonnenuntergang', 'Der Hügel des Inazuma-Turms, wo Mark als Kind trainierte. Bei Sonnenuntergang wartet der Kapitän von Raimon oben auf dich: die letzte Herausforderung.'],
  clan: ['Kirschblütenhügel', 'Der Kirschblütenpark, in dem die Clans gegeneinander antreten. Nur für die Clan-Spiele.'],
};

const TEXTS: Partial<Record<string, MapText>> = { en: EN, fr: FR, it: IT, de: DE };

/** the arenas in the current language (ids untouched); a map without an entry keeps its Spanish text */
export function localizeMaps(maps: MapInfo[]) {
  const t = TEXTS[getLang()];
  if (!t) return;
  for (const m of maps) {
    const x = t[m.id];
    if (x) [m.name, m.blurb] = x;
  }
}
