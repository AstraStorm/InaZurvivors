/** 2.1 (author, with a reference picture): the Rank Z emblem — a slanted red Z with a white and black rim,
 * and a slash across its diagonal (author: no orb or star in the middle). Inline SVG so it stays sharp at any size. */
let uid = 0;

const Z_PATH = 'M9 9 L93 4 L89 25 L45 71 L91 68 L85 96 L6 96 L10 75 L55 29 L13 31 Z';

export function zEmblem(cls = ''): string {
  const id = `rz${++uid}`;
  return `<svg class="z-emblem${cls ? ` ${cls}` : ''}" viewBox="-4 -4 108 108" aria-label="Z" role="img">
    <defs>
      <linearGradient id="${id}r" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff5470"/><stop offset=".55" stop-color="#f0213f"/><stop offset="1" stop-color="#b8102b"/></linearGradient>
    </defs>
    <path d="${Z_PATH}" fill="#000" stroke="#000" stroke-width="15" stroke-linejoin="miter"/>
    <path d="${Z_PATH}" fill="#fff" stroke="#fff" stroke-width="8" stroke-linejoin="miter"/>
    <path d="${Z_PATH}" fill="url(#${id}r)"/>
    <path d="M15 13 L84 9 L80 15 L17 18 Z" fill="#fff" opacity=".22"/>
    <path d="M2 33 L52 44 L101 69 L48 58 Z" fill="#000"/><path d="M7 35 L52 46 L95 67 L48 56 Z" fill="#fff"/>
  </svg>`;
}

/** the letter inside a .rank-btn badge: the emblem for Z, the plain letter for the rest */
export function rankMark(rank: string): string {
  return rank === 'Z' ? `<b class="rz-b">${zEmblem()}</b>` : `<b>${rank}</b>`;
}
