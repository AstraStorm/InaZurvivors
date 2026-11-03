/**
 * v1.65: drawing of the profile banners, original SVG in the Inazuma style. A hanging pennant on a golden rod, cut in a
 * swallowtail, cloth gradient + pattern + emblem, framed in its rarity colour; Épico and above shine, Legendario and
 * Mítico pulse, the Leyenda frame runs through the rainbow.
 */
import { PENNANT_BY_ID, type PennantDef, type PennantEmblem, type PennantPattern } from '../data/pennants';
import type { Rarity } from '../data/manifest';

/** same colours as the rest of the UI (app.ts) */
const RARITY_COLOR: Record<Rarity, string> = { comun: '#9fb0c8', raro: '#4fb3ff', epico: '#b36bff', legendario: '#ffb020', mitico: '#ff4f8b', leyenda: '#fff6c8' };

let uid = 0;
const W = 100, H = 132;
const CLOTH = 'M8,10 H92 V112 L50,96 L8,112 Z';

function pattern(p: PennantPattern, a: string, id: string): string {
  switch (p) {
    case 'franjas': return [20, 44, 68].map((x) => `<rect x="${x}" y="10" width="12" height="104" fill="${a}" opacity=".22"/>`).join('');
    case 'diagonal': return `<pattern id="${id}d" width="16" height="16" patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><rect width="6" height="16" fill="${a}" opacity=".16"/></pattern><rect x="0" y="0" width="${W}" height="${H}" fill="url(#${id}d)"/>`;
    case 'llamas': return `<path d="M8,112 L8,78 Q16,90 20,72 Q26,88 32,66 Q38,86 44,62 Q50,84 56,62 Q62,86 68,66 Q74,88 80,72 Q84,90 92,78 L92,112 L50,96 Z" fill="${a}" opacity=".35"/>`;
    case 'estrellas': return Array.from({ length: 18 }, (_, k) => `<circle cx="${12 + ((k * 37) % 78)}" cy="${16 + ((k * 53) % 84)}" r="${k % 3 ? 0.9 : 1.6}" fill="#fff" opacity="${k % 2 ? 0.5 : 0.85}"/>`).join('');
    case 'arcoiris': return ['#ff4a4a', '#ffb020', '#ffe24a', '#5ee05a', '#4fb3ff', '#b36bff'].map((c, k) => `<path d="M8,${84 + k * 5} Q50,${60 + k * 5} 92,${84 + k * 5}" stroke="${c}" stroke-width="4" fill="none" opacity=".55"/>`).join('');
    case 'cuadros': return `<pattern id="${id}c" width="14" height="14" patternUnits="userSpaceOnUse"><rect width="7" height="7" fill="${a}" opacity=".14"/><rect x="7" y="7" width="7" height="7" fill="${a}" opacity=".14"/></pattern><rect x="0" y="0" width="${W}" height="${H}" fill="url(#${id}c)"/>`;
    case 'tiza': return `<path d="M16,22 Q30,18 42,24 M60,90 Q72,86 84,92 M18,80 Q24,84 30,80" stroke="${a}" stroke-width="1.5" fill="none" opacity=".35" stroke-dasharray="3 2"/>`;
    case 'olas': return [30, 50, 70, 90].map((y) => `<path d="M8,${y} Q20,${y - 6} 30,${y} T52,${y} T74,${y} T96,${y}" stroke="${a}" stroke-width="2" fill="none" opacity=".3"/>`).join('');
    case 'rayos': return Array.from({ length: 12 }, (_, k) => { const ang = (k / 12) * Math.PI * 2; return `<path d="M50,52 L${50 + Math.cos(ang - 0.12) * 70},${52 + Math.sin(ang - 0.12) * 70} L${50 + Math.cos(ang + 0.12) * 70},${52 + Math.sin(ang + 0.12) * 70} Z" fill="${a}" opacity=".13"/>`; }).join('');
    case 'copos': return Array.from({ length: 12 }, (_, k) => { const x = 14 + ((k * 31) % 74), y = 18 + ((k * 47) % 82); return `<g stroke="${a}" stroke-width="1" opacity=".55"><path d="M${x - 3},${y} H${x + 3} M${x},${y - 3} V${y + 3} M${x - 2},${y - 2} L${x + 2},${y + 2} M${x - 2},${y + 2} L${x + 2},${y - 2}"/></g>`; }).join('');
    case 'espiral': return `<path d="M50,52 m0,-6 a6,6 0 1,1 -6,6 a12,12 0 1,1 12,12 a20,20 0 1,1 -20,-20 a30,30 0 1,1 30,30" stroke="${a}" stroke-width="2.5" fill="none" opacity=".3"/>`;
    case 'nebulosa': return `<radialGradient id="${id}n" cx=".5" cy=".42" r=".6"><stop offset="0" stop-color="#b04aff" stop-opacity=".55"/><stop offset=".55" stop-color="#4a1a8a" stop-opacity=".25"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient><rect x="0" y="0" width="${W}" height="${H}" fill="url(#${id}n)"/>${Array.from({ length: 14 }, (_, k) => `<circle cx="${12 + ((k * 41) % 78)}" cy="${16 + ((k * 29) % 84)}" r=".9" fill="#fff" opacity=".7"/>`).join('')}`;
  }
}

function emblem(e: PennantEmblem, a: string): string {
  const C = 'translate(50 52)';
  switch (e) {
    case 'balon': return `<g transform="${C}"><circle r="19" fill="#fff" stroke="#0a1a3a" stroke-width="2"/><path d="M0,-7 L6.7,-2.2 L4.1,5.7 L-4.1,5.7 L-6.7,-2.2 Z" fill="#0a1a3a"/><path d="M0,-7 V-19 M6.7,-2.2 L17,-6 M4.1,5.7 L11,15 M-4.1,5.7 L-11,15 M-6.7,-2.2 L-17,-6" stroke="#0a1a3a" stroke-width="1.6"/></g>`;
    case 'rayo': return `<g transform="${C}"><path d="M6,-24 L-12,4 L-1,4 L-7,26 L13,-4 L2,-4 Z" fill="${a}" stroke="#2a1a00" stroke-width="2" stroke-linejoin="round"/></g>`;
    case 'llama': return `<g transform="${C}"><path d="M0,24 C-16,22 -20,6 -12,-6 C-10,2 -6,4 -4,2 C-8,-10 -2,-18 4,-26 C4,-16 16,-10 16,4 C16,16 10,24 0,24 Z" fill="${a}"/><path d="M0,22 C-8,20 -10,10 -4,2 C-2,8 2,8 4,4 C8,10 8,20 0,22 Z" fill="#fff" opacity=".85"/></g>`;
    case 'caravana': return `<g transform="${C}"><rect x="-24" y="-12" width="48" height="22" rx="5" fill="${a}" stroke="#2a1a00" stroke-width="2"/><rect x="-19" y="-8" width="9" height="7" rx="1" fill="#1a2f66"/><rect x="-7" y="-8" width="9" height="7" rx="1" fill="#1a2f66"/><rect x="5" y="-8" width="9" height="7" rx="1" fill="#1a2f66"/><rect x="16" y="-8" width="5" height="12" rx="1" fill="#1a2f66"/><path d="M-24,3 H24" stroke="#2a62d8" stroke-width="3"/><circle cx="-13" cy="12" r="5" fill="#222" stroke="#ddd" stroke-width="1.5"/><circle cx="13" cy="12" r="5" fill="#222" stroke="#ddd" stroke-width="1.5"/><path d="M-4,-21 L2,-21 L-1,-15 L3,-15 L-5,-6 L-2,-13 L-6,-13 Z" fill="#ffe94a"/></g>`;
    case 'corona': return `<g transform="${C}"><path d="M-22,12 L-24,-12 L-12,0 L0,-20 L12,0 L24,-12 L22,12 Z" fill="${a}" stroke="#7a4a00" stroke-width="2" stroke-linejoin="round"/><rect x="-22" y="12" width="44" height="7" rx="2" fill="#ffd23f" stroke="#7a4a00" stroke-width="1.5"/><circle cx="0" cy="3" r="3.5" fill="#ff3a6a"/><circle cx="-12" cy="6" r="2.6" fill="#4fb3ff"/><circle cx="12" cy="6" r="2.6" fill="#5ee05a"/></g>`;
    case 'neumatico': return `<g transform="${C}"><circle r="17" fill="none" stroke="#111" stroke-width="10"/>${Array.from({ length: 12 }, (_, k) => { const g = (k / 12) * Math.PI * 2; return `<rect x="-2" y="-23" width="4" height="5" fill="${a}" transform="rotate(${(g * 180) / Math.PI})"/>`; }).join('')}<circle r="10" fill="none" stroke="${a}" stroke-width="1.5"/><path d="M14,14 Q30,30 34,46" stroke="#c8a070" stroke-width="2" fill="none"/></g>`;
    case 'pizarra': return `<g transform="${C}" stroke="${a}" stroke-width="2.4" fill="none" stroke-linecap="round"><path d="M-18,-14 L-10,-6 M-10,-14 L-18,-6"/><circle cx="12" cy="-10" r="5"/><path d="M-14,12 Q0,-4 14,8"/><path d="M14,8 L8,8 M14,8 L12,2"/><circle cx="-6" cy="16" r="4"/></g>`;
    case 'olas': return `<g transform="${C}" fill="none" stroke-linecap="round"><path d="M-22,-4 Q-12,-16 0,-4 T22,-4" stroke="${a}" stroke-width="4"/><path d="M-22,8 Q-12,-4 0,8 T22,8" stroke="#fff" stroke-width="3"/><path d="M-22,20 Q-12,8 0,20 T22,20" stroke="${a}" stroke-width="3" opacity=".7"/><circle cx="12" cy="-18" r="5" fill="#ffd27a" stroke="none"/></g>`;
    case 'viento': return `<g transform="${C}" fill="none" stroke-linecap="round"><path d="M-20,-14 Q4,-26 16,-12 Q22,-4 10,0 Q-6,4 -2,12 Q2,22 20,18" stroke="${a}" stroke-width="5"/><path d="M-24,-2 Q-12,-8 -6,-2" stroke="#fff" stroke-width="2.5"/><path d="M4,24 Q14,28 22,24" stroke="#fff" stroke-width="2.5"/></g>`;
    case 'copo': return `<g transform="${C}" stroke="${a}" stroke-width="3" stroke-linecap="round">${[0, 60, 120].map((r) => `<g transform="rotate(${r})"><path d="M0,-22 V22 M0,-14 L-6,-20 M0,-14 L6,-20 M0,14 L-6,20 M0,14 L6,20"/></g>`).join('')}<circle r="4" fill="#fff" stroke="none"/></g>`;
    case 'espiral': return `<g transform="${C}"><path d="M0,0 m0,-4 a4,4 0 1,1 -4,4 a9,9 0 1,1 9,9 a15,15 0 1,1 -15,-15 a22,22 0 1,1 22,22" stroke="${a}" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M0,0 m0,-4 a4,4 0 1,1 -4,4 a9,9 0 1,1 9,9" stroke="#fff" stroke-width="2" fill="none"/></g>`;
    case 'mano': return `<g transform="${C}"><circle r="24" fill="#fff" opacity=".2"/><path d="M-12,22 L-14,-2 Q-14,-6 -10,-6 L-10,-18 Q-10,-22 -6,-22 Q-3,-22 -3,-18 L-3,-22 Q-3,-26 1,-26 Q4,-26 4,-22 L4,-20 Q4,-24 8,-24 Q11,-24 11,-20 L11,-14 Q11,-18 14,-18 Q17,-18 17,-14 L16,8 Q16,20 6,22 Z" fill="${a}" stroke="#8a5a00" stroke-width="2" stroke-linejoin="round"/><path d="M-14,-2 Q-22,-4 -20,6 L-12,12" fill="${a}" stroke="#8a5a00" stroke-width="2"/></g>`;
    case 'reloj': return `<g transform="${C}"><circle r="21" fill="#fff" stroke="${a}" stroke-width="4"/><circle r="17" fill="none" stroke="#2e1470" stroke-width="1" stroke-dasharray="1.5 6.4"/><path d="M0,0 V-13 M0,0 L9,5" stroke="#2e1470" stroke-width="3" stroke-linecap="round"/><circle r="2.5" fill="#2e1470"/><path d="M-6,-26 H6 M0,-26 V-22" stroke="${a}" stroke-width="3"/></g>`;
    case 'planeta': return `<g transform="${C}"><ellipse rx="34" ry="8" fill="#dff6ff" opacity=".2"/><circle r="19" fill="#1e62e0" stroke="#dff6ff" stroke-width="2"/><path d="M-12,-8 Q-4,-14 2,-8 Q6,-2 -2,0 Q-10,2 -12,-8 Z M4,6 Q12,2 14,10 Q8,16 2,12 Z" fill="${a}"/><circle cx="-7" cy="-9" r="5" fill="#fff" opacity=".35"/><ellipse rx="32" ry="7" fill="none" stroke="#ff4a4a" stroke-width="2"/></g>`;
    case 'ojo': return `<g transform="${C}"><circle r="22" fill="#07020f" stroke="#8a3aff" stroke-width="2.5"/><path d="M-28,0 Q0,-20 28,0 Q0,20 -28,0 Z" fill="none" stroke="#8a3aff" stroke-width="1.5" opacity=".6"/><ellipse rx="9" ry="14" fill="${a}" class="pn-eye"/><ellipse rx="5" ry="10" fill="#ffb04a"/><ellipse rx="1.6" ry="8" fill="#fff"/></g>`;
  }
}

/** A banner as SVG; `size` is its width in px (height follows). Unknown id → empty string. */
export function pennantSvg(def: PennantDef | string | undefined, size = 48): string {
  const p = typeof def === 'string' ? PENNANT_BY_ID.get(def) : def;
  if (!p) return '';
  const id = `pn${++uid}`;
  const frame = p.rarity === 'leyenda' ? `url(#${id}r)` : RARITY_COLOR[p.rarity];
  const shine = ['epico', 'legendario', 'mitico', 'leyenda'].includes(p.rarity);
  return `<svg class="pennant pn-${p.rarity}" viewBox="0 0 ${W} ${H}" width="${size}" height="${Math.round(size * H / W)}" role="img" aria-label="${p.name}">
    <defs><linearGradient id="${id}g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${p.c1}"/><stop offset="1" stop-color="${p.c2}"/></linearGradient>
      <clipPath id="${id}k"><path d="${CLOTH}"/></clipPath>
      ${p.rarity === 'leyenda' ? `<linearGradient id="${id}r" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff4a4a"/><stop offset=".25" stop-color="#ffe24a"/><stop offset=".5" stop-color="#5ee05a"/><stop offset=".75" stop-color="#4fb3ff"/><stop offset="1" stop-color="#b36bff"/></linearGradient>` : ''}
      ${shine ? `<linearGradient id="${id}s" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".55"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>` : ''}</defs>
    <rect x="2" y="4" width="96" height="8" rx="4" fill="#ffd23f" stroke="#7a4a00" stroke-width="2"/><circle cx="4" cy="8" r="5" fill="#ffe08a" stroke="#7a4a00" stroke-width="1.5"/><circle cx="96" cy="8" r="5" fill="#ffe08a" stroke="#7a4a00" stroke-width="1.5"/>
    <path d="${CLOTH}" fill="url(#${id}g)"/>
    <g clip-path="url(#${id}k)">${pattern(p.pattern, p.accent, id)}${shine ? `<rect class="pn-shine" x="-60" y="0" width="40" height="${H}" fill="url(#${id}s)" transform="skewX(-20)"/>` : ''}</g>
    ${emblem(p.emblem, p.accent)}
    <path d="${CLOTH}" fill="none" stroke="${frame}" stroke-width="${p.rarity === 'comun' ? 4 : 5}" stroke-linejoin="round" class="pn-frame"/>
    <path d="M14,100 L50,86 L86,100" fill="none" stroke="#fff" stroke-width="1.5" opacity=".35"/>
  </svg>`;
}
