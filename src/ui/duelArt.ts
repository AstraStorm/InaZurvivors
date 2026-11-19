/** Modo Duelo: where the author's art lives (public/art/duel, cut by tools/duel_assets.py) */
export const ART = 'art/duel/';
/** bumped when tools/duel_assets.py rewrites the art: same file names, so browsers would keep the old pictures */
export const ART_V = '8';
export const artUrl = (file: string) => `${ART}${file}.webp?v=${ART_V}`;
