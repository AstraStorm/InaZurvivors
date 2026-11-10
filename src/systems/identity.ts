/**
 * 1.8 (author): the same character can't be twice on the team, nor as an Aura: no two Axels, no two Marks. A character is
 * one person whatever version he comes in:
 *   - his other versions: «X Oscuro», «X Encapuchado», and aliases of another arc (Xavier = Xene). 1.88 (author): Kira
 *     Hiroto is his own character, not Xavier;
 *   - his Miximax fusions: «Arion + Tezcat» is Arion AND Tezcat, so it can't go with either of them.
 * Fusions name their parts by nickname: FUSION_PART turns each one into the footballer it is.
 */
import type { RosterEntry } from '../data/manifest';

/** suffixes of another version of the same footballer */
const VERSION_SUFFIX = / (Oscuro|Encapuchado)$/;
/** other names of the same person (arc names, Japanese names) */
const ALIASES: Record<string, string> = { 'Xene': 'Xavier Foster', 'Endou Mamoru': 'Mark Evans', 'Mark Evans Adulto': 'Mark Evans',
  // author: a footballer and his «MM» Mixi Max form are the same person (Wolfram can't be Vulpeen MM's Aura, and so on)
  'Vulpeen MM': 'Wolfram Vulpeen', 'Drakul MM': 'Desmodus Drakul', 'Flora MM': 'Flora', 'Simeon MM': 'Simeon Ayp',
  // 2.02 (author): Shawn before the fusion with Aiden (defender) and Shawn without his scarf are Shawn
  'Shawn Froste Defensa': 'Shawn Froste', 'Shawn Froste Sin Bufanda': 'Shawn Froste' };
/** the parts of a Miximax fusion, by the nickname the fusion uses */
const FUSION_PART: Record<string, string> = {
  Aitor: 'Aitor Cazador', Arion: 'Arion Sherwind', Axel: 'Axel Blaze', Bailong: 'Bai Long', Caleb: 'Caleb Stonewall', Canon: 'Canon Evans',
  Dragon: 'Drack Gorn', Fei: 'Fey Rune', Gabi: 'Gabriel Garcia', Goldie: 'Goldie Lemmon', Hawkins: 'Archer Hawkins', JP: 'Jean-Pierre Lapin',
  Jordan: 'Jordan Greenway', Jude: 'Jude Sharp', Kevin: 'Kevin Dragonfly', Mark: 'Mark Evans', Nelly: 'Nelly Raimon', Nobunaga: 'Nobunaga Oda',
  Okita: 'Soji Okita', Riccardo: 'Riccardo Di Rigo', Roma: 'Ryoma Nishiki', Sakamoto: 'Ryoma Sakamoto', Samford: 'David Samford',
  Shawn: 'Shawn Froste', Silvia: 'Silvia Woods', Sol: 'Sol Daystar', Victor: 'Victor Blade', Vladimir: 'Vladimir Blade', Wanli: 'Wanli Changcheng',
  Xavier: 'Xavier Foster', Zanark: 'Zanark Avalonic', Zhuge: 'Zhuge Liang',
};

const canon = (name: string) => { const base = name.trim().replace(VERSION_SUFFIX, ''); return ALIASES[base] ?? base; };
/** The characters a footballer is: one, or two for a Miximax fusion. */
export function charactersOf(p: Pick<RosterEntry, 'name'>): string[] {
  if (p.name.includes(' + ')) return [...new Set(p.name.split(' + ').map((x) => canon(FUSION_PART[x.trim()] ?? x.trim())))];
  return [canon(p.name)];
}
export const sameCharacter = (a: Pick<RosterEntry, 'name'>, b: Pick<RosterEntry, 'name'>) => {
  const ka = charactersOf(a);
  return charactersOf(b).some((k) => ka.includes(k));
};
/** The first of `others` that is the same character as `p` (the clash to tell the player), or null. */
export const clashWith = <T extends Pick<RosterEntry, 'name'>>(p: Pick<RosterEntry, 'name'>, others: T[]) => others.find((o) => sameCharacter(p, o)) ?? null;
