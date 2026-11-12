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
/** the BlueLock logo, relative like every generated asset (works under the GitHub Pages path too). The published build
 *  renames every resource (a/<hash>), so the app hands over the manifest's paths with setPennantLogos (2.2: before, the
 *  logo 404'd on the web) */
let BL_LOGO = 'generated/collab/bluelock.webp';
/** 2.2: the two sides' logos (tools/sector_logos.py, from the author's files) */
const SIDE_LOGO = { sector: 'generated/sector/sector_quinto.png', resistencia: 'generated/sector/resistencia.png' };
export function setPennantLogos(p: { bluelock?: string; sector?: string; resistencia?: string }) {
  if (p.bluelock) BL_LOGO = p.bluelock;
  if (p.sector) SIDE_LOGO.sector = p.sector;
  if (p.resistencia) SIDE_LOGO.resistencia = p.resistencia;
}
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
    // (author) InaZurvivors x BlueLock: the facility's blue grid and a light beam across
    case 'rejilla': return `<pattern id="${id}h" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M10,0 H0 V10" stroke="${a}" stroke-width=".7" fill="none" opacity=".35"/></pattern><rect x="0" y="0" width="${W}" height="${H}" fill="url(#${id}h)"/><path d="M-10,96 L110,18 L110,40 L-10,118 Z" fill="${a}" opacity=".12"/>`;
    // 2.1 (author): «Soy todopoderoso», golden hurricanes with blue electricity
    case 'huracan': return [[30, 34, 1], [72, 80, 0.8], [26, 94, 0.6]].map(([x, y, k]) => hurricane(x, y, 26 * k, a, 0.42)).join('')
      + [[14, 20, 46, 60], [70, 18, 88, 50], [60, 70, 84, 100]].map(([x1, y1, x2, y2]) => bolt(x1, y1, x2, y2, 1.4)).join('');
  }
}

/** 2.1: a golden whirlwind (spiral strands round a centre) and a blue electric zigzag between two points */
function hurricane(x: number, y: number, r: number, a: string, op: number): string {
  return [0, 120, 240].map((rot) => `<path d="M0,0 C${r * 0.5},${-r * 0.2} ${r * 0.7},${r * 0.5} ${r * 0.15},${r * 0.75} C${-r * 0.5},${r * 0.9} ${-r * 1.05},${r * 0.2} ${-r * 0.8},${-r * 0.55}" transform="translate(${x} ${y}) rotate(${rot})" stroke="${a}" stroke-width="${Math.max(1.2, r / 9).toFixed(1)}" fill="none" stroke-linecap="round" opacity="${op}"/>`).join('')
    + `<circle cx="${x}" cy="${y}" r="${(r * 0.18).toFixed(1)}" fill="#fff6c8" opacity="${op}"/>`;
}
function bolt(x1: number, y1: number, x2: number, y2: number, w: number, c = '#5fd8ff'): string {
  const n = 5, nx = -(y2 - y1), ny = x2 - x1, l = Math.hypot(nx, ny) || 1, amp = Math.hypot(x2 - x1, y2 - y1) * 0.09;
  const pts = Array.from({ length: n + 1 }, (_, k) => { const t = k / n, j = k % n ? (k % 2 ? 1 : -1) * amp : 0;
    return `${(x1 + (x2 - x1) * t + (nx / l) * j).toFixed(1)},${(y1 + (y2 - y1) * t + (ny / l) * j).toFixed(1)}`; }).join(' ');
  return `<polyline points="${pts}" fill="none" stroke="${c}" stroke-width="${w * 2.6}" opacity=".3" stroke-linejoin="round"/><polyline points="${pts}" fill="none" stroke="#e8fbff" stroke-width="${w}" stroke-linejoin="round" opacity=".95"/>`;
}

function emblem(e: PennantEmblem, a: string, C = 'translate(50 52)'): string {
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
    // (author) the BlueLock logo (generated/collab/bluelock.webp, 960×209, blue) on a light plate with a cyan edge
    // 2.1: Zanark's horns over a red-eyed mask (the Dominio de Zanark banners)
    case 'cuernos': return `<g transform="${C}"><path d="M-8,-6 C-14,-14 -22,-18 -30,-16 C-24,-12 -18,-6 -16,2 Z M8,-6 C14,-14 22,-18 30,-16 C24,-12 18,-6 16,2 Z" fill="#f4f0e0" stroke="#1a1a1a" stroke-width="1.6" stroke-linejoin="round"/><path d="M-6,-14 L0,-26 L6,-14 Z" fill="#0e3a40" stroke="#1a1a1a" stroke-width="1.6" stroke-linejoin="round"/><path d="M-17,-8 Q0,-16 17,-8 L15,12 Q0,24 -15,12 Z" fill="#0e3a40" stroke="#1a1a1a" stroke-width="2"/><path d="M-11,0 L-3,3 L-11,5 Z M11,0 L3,3 L11,5 Z" fill="${a}"/></g>`;
    // 2.1: «Soy todopoderoso»: the ball inside a golden storm sphere, blue lightning around
    case 'todopoderoso': return `<g transform="${C}"><circle r="28" fill="#ffe94a" opacity=".25"/><circle r="22" fill="#2a1400"/><circle r="20" fill="#c8500a"/><circle r="17.5" fill="#ff8a1a"/>${[[8, 0.2, 2.6], [12, 2.3, 3], [15, 4.1, 2.4], [6, 3.6, 2.2]].map(([rr, st, sw]) => `<path d="M${(Math.cos(st) * rr).toFixed(1)},${(Math.sin(st) * rr).toFixed(1)} A${rr},${rr} 0 0,1 ${(Math.cos(st + 1.8) * rr).toFixed(1)},${(Math.sin(st + 1.8) * rr).toFixed(1)}" stroke="#ffe94a" stroke-width="${sw}" fill="none" stroke-linecap="round"/>`).join('')}<circle cx="-5" cy="-6" r="6" fill="#fff6c8" opacity=".45"/><circle r="7.5" fill="#fff" stroke="#2a1400" stroke-width="1.6"/><path d="M0,-3 L2.9,-.9 L1.8,2.5 L-1.8,2.5 L-2.9,-.9 Z" fill="#2a1400"/>${bolt(-30, -6, 30, 8, 1.8)}${bolt(-16, 24, 6, 30, 1.3)}</g>`;
    // 2.3: content creators (INA303): a play button on a rounded screen, with a sparkle
    case 'creador': return `<g transform="${C}"><rect x="-26" y="-19" width="52" height="38" rx="11" fill="#ff2a5a" stroke="#2a0410" stroke-width="2.2"/><rect x="-21" y="-14" width="42" height="10" rx="5" fill="#fff" opacity=".18"/><path d="M-7,-10 L11,0 L-7,10 Z" fill="${a}" stroke="#2a0410" stroke-width="1.6" stroke-linejoin="round"/><path d="M22,-26 L24,-21 L29,-19 L24,-17 L22,-12 L20,-17 L15,-19 L20,-21 Z" fill="#ffe94a"/></g>`;
    // 2.2: the sides of the Sector Quinto, their logos as they are (the Sector's is a wide shield)
    case 'sector': return `<g transform="${C}"><image href="${SIDE_LOGO.sector}" x="-30" y="-18" width="60" height="36" preserveAspectRatio="xMidYMid meet"/></g>`;
    case 'resistencia': return `<g transform="${C}"><image href="${SIDE_LOGO.resistencia}" x="-22" y="-23" width="44" height="46" preserveAspectRatio="xMidYMid meet"/></g>`;
    case 'bluelock': return `<g transform="${C}"><rect x="-34" y="-11" width="68" height="22" rx="4" fill="#eef8ff" stroke="${a}" stroke-width="2.5"/><rect x="-31.5" y="-8.5" width="63" height="17" rx="2.5" fill="none" stroke="#1f5bff" stroke-width="1" opacity=".5"/><image href="${BL_LOGO}" x="-31" y="-7" width="62" height="13.5" preserveAspectRatio="xMidYMid meet"/></g>`;
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
    ${isClan(p) ? `<g clip-path="url(#${id}k)">${p.id === 'clan-cerezo' ? [[18, 30, 1.3], [80, 26, 1.1], [24, 72, 1], [76, 70, 1.2]].map(([x, y, k], i) => blossom(x, y, k, i * 50)).join('') : `<g transform="translate(50 50)">${laurel(0, 6, 34, 1, 0.8)}${laurel(0, 6, 34, -1, 0.8)}</g>`}</g>${clanEmblem(p, 50, 50, 0.75)}` : emblem(p.emblem, p.accent)}
    <path d="${CLOTH}" fill="none" stroke="${frame}" stroke-width="${p.rarity === 'comun' ? 4 : 5}" stroke-linejoin="round" class="pn-frame"/>
    <path d="M14,100 L50,86 L86,100" fill="none" stroke="#fff" stroke-width="1.5" opacity=".35"/>
  </svg>`;
}

// ------------------------------------------------------------------ 1.93: the clan banners (author: their own look)
/** a five-petal cherry blossom */
const blossom = (x: number, y: number, k: number, rot = 0) => `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${rot}) scale(${k})">${[0, 72, 144, 216, 288].map((a) => `<ellipse cx="0" cy="-4.2" rx="3" ry="4.4" transform="rotate(${a})" fill="#ffd0e4" stroke="#c43a7a" stroke-width=".7"/>`).join('')}<circle r="1.8" fill="#ffe24a"/></g>`;
/** a shield with a crown, the Estandarte's emblem */
const crestShield = (x: number, y: number, k: number, c2: string, a: string) => `<g transform="translate(${x} ${y}) scale(${k})"><path d="M-13,-12 L13,-12 L13,1 Q13,11 0,16 Q-13,11 -13,1 Z" fill="${c2}" stroke="${a}" stroke-width="2.4"/>
  <path d="M-7,-3 L-7,-9 L-3.5,-5 L0,-10 L3.5,-5 L7,-9 L7,-3 Z" fill="${a}"/><path d="M-8,2 H8 M0,-1 V12" stroke="${a}" stroke-width="1.6" opacity=".8"/></g>`;
/** laurel: leaves along an arc on one side (dir 1 right, -1 left) */
const laurel = (cx: number, cy: number, r: number, dir: 1 | -1, k = 1) => Array.from({ length: 7 }, (_, i) => {
  const t = 0.45 + i * 0.32, x = cx + dir * Math.sin(t) * r, y = cy + Math.cos(t) * r * 0.55; // from the bottom up the side
  return `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="${3 * k}" ry="${7 * k}" transform="rotate(${(dir * (t * 57 - 20)).toFixed(0)} ${x.toFixed(1)} ${y.toFixed(1)})" fill="#4fd07a" stroke="#0a3a1c" stroke-width="1"/>`;
}).join('');
const isClan = (p: PennantDef) => p.source === 'clan' && !p.kind;
/** the wide ribbon of a clan banner: cherry branches and petals, or laurel round a shield */
function clanRibbonDeco(p: PennantDef): string {
  if (p.id === 'clan-cerezo') {
    const branch = (x0: number, dir: 1 | -1) => { const d = `M${x0},${dir > 0 ? 20 : 104} C${x0 + dir * 120},${dir > 0 ? 40 : 84} ${x0 + dir * 200},${dir > 0 ? 10 : 110} ${x0 + dir * 330},${dir > 0 ? 46 : 70}`;
      const flowers = [0.15, 0.35, 0.55, 0.75, 0.95].map((t, i) => blossom(x0 + dir * 330 * t, (dir > 0 ? 24 : 100) + Math.sin(t * 6) * 14 * dir, i % 2 ? 1.6 : 2.3, i * 40)).join('');
      return `<path d="${d}" stroke="#5a2a1a" stroke-width="6" fill="none" stroke-linecap="round"/><path d="${d}" stroke="#8a4a2a" stroke-width="2" fill="none" opacity=".7"/>${flowers}`; };
    const petals = Array.from({ length: 22 }, (_, k) => { const x = 40 + rnd(k * 7 + 3, RW - 80), y = 8 + rnd(k * 13 + 5, RH - 16);
      return `<ellipse class="fr-petal" style="animation-delay:${(k % 6) * 0.45}s" cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" rx="3.2" ry="5" transform="rotate(${k * 37} ${x.toFixed(0)} ${y.toFixed(0)})" fill="#ffb8d8" opacity=".8"/>`; }).join('');
    return `${branch(0, 1)}${branch(RW, -1)}${petals}`;
  }
  return `<g transform="translate(${EX} ${EY})">${laurel(0, 10, 110, 1, 2.2)}${laurel(0, 10, 110, -1, 2.2)}</g>`
    + [140, 1060].map((x, i) => `<g transform="translate(${x} 96) rotate(${i ? 18 : -18})"><rect x="-2" y="-80" width="4" height="84" fill="#d8c08a"/><path d="M2,-80 L60,-68 L2,-52 Z" fill="${i ? p.accent : p.c1}" stroke="#0a1022" stroke-width="2"/></g>`).join('');
}
/** its big emblem: a blossom or the crowned shield */
const clanEmblem = (p: PennantDef, x: number, y: number, k: number) => p.id === 'clan-cerezo' ? blossom(x, y, k * 3.2) : crestShield(x, y, k * 1.9, p.c2, p.accent);

// ------------------------------------------------------------------ the wide ribbon (author: "que ocupen todo en horizontal")
/*
 * The banner as a horizontal ribbon, Clash Royale style but drawn in the Inazuma style: the art is a 1200×120 scene
 * (pattern across the cloth, glow and the big emblem a bit right of centre, faint echoes of it, gold trims) cropped to
 * the box it fills; the swallowtail cut and the rarity frame are CSS (clip-path), so they keep their size on any width.
 */
const RW = 1200, RH = 120, EX = 700, EY = 60;
const rnd = (k: number, m: number) => (((k * 7919) % 1000) / 1000) * m;

function widePattern(p: PennantPattern, a: string, id: string): string {
  switch (p) {
    case 'franjas': return Array.from({ length: 14 }, (_, k) => `<path d="M${k * 96 - 40},${RH} L${k * 96 + 10},0 h34 L${k * 96 - 6},${RH} Z" fill="${a}" opacity=".16"/>`).join('');
    case 'diagonal': return `<pattern id="${id}d" width="26" height="26" patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><rect width="9" height="26" fill="${a}" opacity=".14"/></pattern><rect width="${RW}" height="${RH}" fill="url(#${id}d)"/>`
      + `<path d="M0,96 L380,70 L360,84 L760,58 L740,74 L1200,44" stroke="${a}" stroke-width="3" fill="none" opacity=".45"/>`;
    case 'llamas': {
      const flame = (base: number, lift: number) => { let d = `M0,${RH} L0,${base}`; for (let x = 0; x < RW; x += 40) d += ` Q${x + 10},${base - lift - rnd(x + 3, 26)} ${x + 20},${base - 6} Q${x + 30},${base - lift - 14 - rnd(x + 9, 30)} ${x + 40},${base}`; return `${d} L${RW},${RH} Z`; };
      return `<path d="${flame(84, 20)}" fill="${a}" opacity=".32"/><path d="${flame(100, 8)}" fill="#fff" opacity=".14"/>`;
    }
    case 'estrellas': return Array.from({ length: 70 }, (_, k) => `<circle cx="${rnd(k + 1, RW)}" cy="${6 + rnd(k * 3 + 2, RH - 12)}" r="${k % 5 ? 1.1 : 2.2}" fill="#fff" opacity="${k % 2 ? 0.45 : 0.9}"/>`).join('')
      + [180, 420, 980, 1120].map((x, k) => `<path d="M${x},${30 + k * 14} l3,8 8,3 -8,3 -3,8 -3,-8 -8,-3 8,-3 Z" fill="${a}" opacity=".7"/>`).join('');
    case 'arcoiris': return ['#ff4a4a', '#ffb020', '#ffe24a', '#5ee05a', '#4fb3ff', '#b36bff'].map((c, k) => `<path d="M-20,${100 + k * 7} Q${EX},${-30 + k * 7} ${RW + 20},${100 + k * 7}" stroke="${c}" stroke-width="6" fill="none" opacity=".5"/>`).join('');
    case 'cuadros': return `<pattern id="${id}c" width="24" height="24" patternUnits="userSpaceOnUse"><rect width="12" height="12" fill="${a}" opacity=".13"/><rect x="12" y="12" width="12" height="12" fill="${a}" opacity=".13"/></pattern><rect width="${RW}" height="${RH}" fill="url(#${id}c)"/>`
      + `<path d="M0,104 C200,80 300,112 520,96 S900,70 1200,92" stroke="#c8a070" stroke-width="3" fill="none" opacity=".5"/>`;
    case 'tiza': return `<g stroke="${a}" stroke-width="2.2" fill="none" opacity=".4" stroke-linecap="round">${[60, 250, 430, 960, 1110].map((x, k) => k % 2
      ? `<circle cx="${x}" cy="${36 + k * 10}" r="9"/>` : `<path d="M${x - 8},${30 + k * 8} l16,16 M${x + 8},${30 + k * 8} l-16,16"/>`).join('')}<path d="M90,90 Q240,40 400,82 M400,82 l-14,-2 M400,82 l-6,-12" stroke-dasharray="6 5"/><path d="M880,30 Q1000,90 1140,60"/></g>`;
    case 'olas': return [24, 48, 72, 96].map((y, k) => { let d = `M-20,${y}`; for (let x = -20; x < RW; x += 60) d += ' q15,-10 30,0 t30,0'; return `<path d="${d}" stroke="${k % 2 ? '#fff' : a}" stroke-width="${k % 2 ? 1.5 : 2.5}" fill="none" opacity=".3"/>`; }).join('')
      + '<circle cx="1080" cy="34" r="22" fill="#ffd27a" opacity=".55"/>';
    case 'rayos': return Array.from({ length: 28 }, (_, k) => { const g = (k / 28) * Math.PI * 2, L = 900; return `<path d="M${EX},${EY} L${EX + Math.cos(g - 0.05) * L},${EY + Math.sin(g - 0.05) * L} L${EX + Math.cos(g + 0.05) * L},${EY + Math.sin(g + 0.05) * L} Z" fill="${a}" opacity=".12"/>`; }).join('');
    case 'copos': return Array.from({ length: 34 }, (_, k) => { const x = rnd(k * 5 + 1, RW), y = 10 + rnd(k * 11 + 4, RH - 20), r = k % 4 ? 4 : 8; return `<path d="M${x - r},${y} H${x + r} M${x},${y - r} V${y + r} M${x - r * 0.7},${y - r * 0.7} L${x + r * 0.7},${y + r * 0.7} M${x - r * 0.7},${y + r * 0.7} L${x + r * 0.7},${y - r * 0.7}" stroke="${a}" stroke-width="1.4" opacity=".55"/>`; }).join('');
    case 'espiral': return ([[EX, EY, 1], [220, 60, 0.6], [1060, 50, 0.5]] as const).map(([x, y, k]) => `<path d="M${x},${y} m0,-8 a8,8 0 1,1 -8,8 a20,20 0 1,1 20,20 a36,36 0 1,1 -36,-36 a58,58 0 1,1 58,58 a86,86 0 1,1 -86,-86" stroke="${a}" stroke-width="3" fill="none" opacity="${0.32 * k}"/>`).join('');
    case 'rejilla': return `<pattern id="${id}h" width="24" height="24" patternUnits="userSpaceOnUse"><path d="M24,0 H0 V24" stroke="${a}" stroke-width="1" fill="none" opacity=".28"/></pattern><rect width="${RW}" height="${RH}" fill="url(#${id}h)"/>`
      + [[120, 90], [880, 70]].map(([x, w]) => `<path d="M${x},${RH} L${x + 60},0 h${w} L${x + 60 + w - 60},${RH} Z" fill="${a}" opacity=".13"/>`).join('')
      + `<path d="M0,${EY} H${RW}" stroke="${a}" stroke-width="1.5" opacity=".35" stroke-dasharray="2 10"/>`;
    case 'nebulosa': return `<radialGradient id="${id}n" cx=".58" cy=".5" r=".5"><stop offset="0" stop-color="#b04aff" stop-opacity=".6"/><stop offset=".5" stop-color="#4a1a8a" stop-opacity=".25"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient><rect width="${RW}" height="${RH}" fill="url(#${id}n)"/>`
      + '<ellipse cx="250" cy="70" rx="180" ry="40" fill="#ff3a6a" opacity=".12"/><ellipse cx="1050" cy="40" rx="140" ry="34" fill="#3a6aff" opacity=".14"/>'
      + Array.from({ length: 50 }, (_, k) => `<circle cx="${rnd(k * 3 + 7, RW)}" cy="${rnd(k * 13 + 1, RH)}" r="${k % 6 ? 0.9 : 1.8}" fill="#fff" opacity=".75"/>`).join('');
    case 'huracan': return [[150, 60, 70], [420, 40, 46], [1000, 64, 66], [1150, 30, 40], [EX, EY, 110]].map(([x, y, r]) => hurricane(x, y, r, a, 0.35)).join('')
      + [[60, 10, 230, 110], [300, 0, 380, 120], [820, 4, 930, 112], [1080, 0, 1190, 100], [520, 110, 610, 10]].map(([x1, y1, x2, y2]) => bolt(x1, y1, x2, y2, 2.2)).join('');
  }
}

/**
 * A banner as a wide ribbon that fills its (relatively positioned) parent. Unknown id → empty string. `withEmblem`
 * false leaves the big emblem out, for a box whose content would cover it (it goes in its own slot: pennantEmblem).
 */
export function pennantRibbon(def: PennantDef | string | null | undefined, withEmblem = true): string {
  const p = typeof def === 'string' ? PENNANT_BY_ID.get(def) : def;
  if (!p) return '';
  const id = `pr${++uid}`;
  const shine = ['epico', 'legendario', 'mitico', 'leyenda'].includes(p.rarity);
  const echo = (x: number, k: number) => emblem(p.emblem, p.accent, `translate(${x} ${EY}) scale(${k})`);
  return `<span class="pn-ribbon pnr-${p.rarity}" style="--rc:${RARITY_COLOR[p.rarity]}" aria-hidden="true"><span class="pnr-in">
    <svg class="pnr-art" viewBox="0 0 ${RW} ${RH}" preserveAspectRatio="xMidYMid slice">
      <defs><linearGradient id="${id}g" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${p.c2}"/><stop offset=".58" stop-color="${p.c1}"/><stop offset="1" stop-color="${p.c2}"/></linearGradient>
        <linearGradient id="${id}v" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".18"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".35"/></linearGradient>
        <radialGradient id="${id}o" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="${p.accent}" stop-opacity=".6"/><stop offset="1" stop-color="${p.accent}" stop-opacity="0"/></radialGradient>
        ${shine ? `<linearGradient id="${id}s" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".45"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>` : ''}</defs>
      <rect width="${RW}" height="${RH}" fill="url(#${id}g)"/>
      ${widePattern(p.pattern, p.accent, id)}${isClan(p) ? clanRibbonDeco(p) : ''}
      ${isClan(p) ? '' : `<g opacity=".2">${echo(300, 1.1)}${echo(1040, 1.1)}</g>`}
      ${withEmblem ? `<ellipse cx="${EX}" cy="${EY}" rx="120" ry="70" fill="url(#${id}o)"/>
      <g class="pnr-emb">${isClan(p) ? clanEmblem(p, EX, EY, 1) : emblem(p.emblem, p.accent, `translate(${EX} ${EY}) scale(${p.emblem === 'bluelock' ? 2.9 : 1.75})`)}</g>` : ''}
      <rect width="${RW}" height="${RH}" fill="url(#${id}v)"/>
      <path d="M0,7 H${RW} M0,${RH - 7} H${RW}" stroke="${p.accent}" stroke-width="2" opacity=".55"/>
      ${shine ? `<rect class="pnr-shine" x="-200" y="0" width="140" height="${RH}" fill="url(#${id}s)" transform="skewX(-20)"/>` : ''}
    </svg></span></span>`;
}

/** The emblem of a banner on its own, with its glow (the slot of the profile card). */
export function pennantEmblem(def: PennantDef | string | null | undefined, size = 120): string {
  const p = typeof def === 'string' ? PENNANT_BY_ID.get(def) : def;
  if (!p) return '';
  const id = `pe${++uid}`;
  return `<svg class="pn-emblem" viewBox="0 0 100 100" width="${size}" height="${size}" aria-hidden="true">
    <defs><radialGradient id="${id}o" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="${p.accent}" stop-opacity=".65"/><stop offset="1" stop-color="${p.accent}" stop-opacity="0"/></radialGradient></defs>
    <circle cx="50" cy="50" r="50" fill="url(#${id}o)"/>${isClan(p) ? clanEmblem(p, 50, 50, 1) : emblem(p.emblem, p.accent, 'translate(50 50) scale(1.5)')}</svg>`;
}

// ------------------------------------------------------------------ avatar frames (author: "marcos súper guays")
/*
 * A frame drawn over the avatar: the avatar fills the middle 100×100 of a 140×140 box (so the overlay sits at
 * inset -20% around it). Ring in the cloth colours, the pattern as ornaments all around, the emblem as a crest on top,
 * wings from Legendario up, a gem below from Épico up. `square` follows the rounded square of the profile icons.
 */
const FC = 70;
/** a point on the frame line at angle `a` (circle, or the rounded square pushed out from it), radius `r` */
function onFrame(a: number, r: number, square: boolean): [number, number] {
  const c = Math.cos(a), s = Math.sin(a);
  if (!square) return [FC + c * r, FC + s * r];
  const k = r / Math.max(Math.abs(c), Math.abs(s), 0.75);
  return [FC + c * k * 0.97, FC + s * k * 0.97];
}
const deg = (a: number) => (a * 180) / Math.PI;

function ornaments(p: PennantPattern, a: string, c1: string, sq: boolean, id: string): string {
  const around = (n: number, f: (x: number, y: number, ang: number, k: number) => string, r = 58, off = 0) =>
    Array.from({ length: n }, (_, k) => { const ang = off + (k / n) * Math.PI * 2; const [x, y] = onFrame(ang, r, sq); return f(x, y, ang, k); }).join('');
  switch (p) {
    case 'franjas': return around(12, (x, y, g, k) => `<rect x="${x - 3}" y="${y - 5}" width="6" height="10" rx="1.5" fill="${k % 2 ? '#fff' : a}" stroke="#0a1a3a" stroke-width="1" transform="rotate(${deg(g) + 90} ${x} ${y})"/>`, 53);
    case 'diagonal': return around(6, (x, y, g) => `<path d="M2,-8 L-4,1 L0,1 L-2,8 L5,-2 L1,-2 Z" fill="${a}" stroke="#2a1a00" stroke-width="1" transform="translate(${x} ${y}) rotate(${deg(g) + 90}) scale(1.3)"/>`, 62, 0.5);
    case 'llamas': return around(14, (x, y, g, k) => `<path d="M0,0 C-5,-4 -4,-10 0,-${14 + (k % 3) * 3} C4,-10 5,-4 0,0 Z" fill="${k % 2 ? a : c1}" opacity=".95" transform="translate(${x} ${y}) rotate(${deg(g) + 90})"/>`, 57)
      + around(14, (x, y, g) => `<path d="M0,0 C-2,-2 -2,-5 0,-7 C2,-5 2,-2 0,0 Z" fill="#fff" opacity=".8" transform="translate(${x} ${y}) rotate(${deg(g) + 90})"/>`, 57);
    case 'estrellas': return around(8, (x, y) => `<path d="M${x},${y - 6} l1.8,4.2 4.2,1.8 -4.2,1.8 -1.8,4.2 -1.8,-4.2 -4.2,-1.8 4.2,-1.8 Z" fill="${a}" stroke="#0008" stroke-width=".6"/>`, 62, 0.39)
      + around(16, (x, y) => `<circle cx="${x}" cy="${y}" r="1.1" fill="#fff" opacity=".85"/>`, 66, 0.2);
    case 'arcoiris': return ['#ff4a4a', '#ffb020', '#ffe24a', '#5ee05a', '#4fb3ff', '#b36bff'].map((c, k) => { const [x, y] = onFrame(Math.PI * 0.15 + (k / 6) * Math.PI * 2, 53, sq); return `<circle cx="${x}" cy="${y}" r="4.2" fill="${c}" stroke="#fff" stroke-width="1.2"/>`; }).join('');
    case 'cuadros': return around(16, (x, y, g, k) => `<rect x="${x - 3.5}" y="${y - 3.5}" width="7" height="7" fill="${k % 2 ? a : '#111'}" transform="rotate(${deg(g)} ${x} ${y})"/>`, 53);
    case 'tiza': return `<g fill="none" stroke="${a}" stroke-width="1.6" stroke-linecap="round" opacity=".9">${around(6, (x, y, _g, k) => k % 2 ? `<circle cx="${x}" cy="${y}" r="3.5"/>` : `<path d="M${x - 3},${y - 3} l6,6 M${x + 3},${y - 3} l-6,6"/>`, 63, 0.5)}</g>`;
    case 'olas': { let d = ''; for (let k = 0; k <= 72; k++) { const g = (k / 72) * Math.PI * 2; const [x, y] = onFrame(g, 59 + Math.sin(g * 12) * 2.6, sq); d += `${k ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)} `; } return `<path d="${d}Z" fill="none" stroke="${a}" stroke-width="2.4" opacity=".9"/><path d="${d}Z" fill="none" stroke="#fff" stroke-width=".8" opacity=".7"/>`; }
    case 'rayos': return around(16, (x, y, g) => `<path d="M-3,0 L0,-${12} L3,0 Z" fill="${a}" opacity=".9" transform="translate(${x} ${y}) rotate(${deg(g) + 90})"/>`, 58);
    case 'copos': return around(10, (x, y, g, k) => `<path d="M-3,0 L0,-${k % 2 ? 9 : 14} L3,0 Z" fill="#fff" stroke="${a}" stroke-width=".8" opacity=".95" transform="translate(${x} ${y}) rotate(${deg(g) + 90})"/>`, 58)
      + around(5, (x, y) => `<path d="M${x - 3},${y} H${x + 3} M${x},${y - 3} V${y + 3}" stroke="#fff" stroke-width="1"/>`, 66, 0.3);
    case 'espiral': return `<g fill="none" stroke="${a}" stroke-width="3" stroke-linecap="round">${around(3, (x, y, g) => `<path d="M0,0 a6,6 0 1,1 6,6 a10,10 0 0,1 -14,-6" transform="translate(${x} ${y}) rotate(${deg(g)})"/>`, 60, 0.6)}</g>`;
    // (author) BlueLock: chain links around the ring
    case 'rejilla': return around(14, (x, y, g, k) => `<rect x="-6" y="-3" width="12" height="6" rx="3" fill="none" stroke="${k % 2 ? a : '#dff6ff'}" stroke-width="2" transform="translate(${x} ${y}) rotate(${deg(g) + 90 + (k % 2 ? 0 : 0)})"/>`, 58)
      + around(14, (x, y) => `<circle cx="${x}" cy="${y}" r="1" fill="#fff" opacity=".8"/>`, 66, Math.PI / 14);
    case 'nebulosa': return `<radialGradient id="${id}a" cx=".5" cy=".5" r=".5"><stop offset=".62" stop-color="#b04aff" stop-opacity="0"/><stop offset=".78" stop-color="#b04aff" stop-opacity=".55"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient><circle cx="${FC}" cy="${FC}" r="70" fill="url(#${id}a)"/>`
      + around(9, (x, y, _g, k) => `<circle cx="${x}" cy="${y}" r="${k % 3 ? 1.4 : 2.4}" fill="${k % 2 ? a : '#fff'}"/>`, 64, 0.2);
    // 2.1 (author's sketch): the ring wrapped in yellow hurricane curls, close together and overlapping, blue sparks in
    // between; each curl a little loop that turns back on itself, at slightly different radii, sizes and turns
    case 'huracan': {
      const curl = (k: number, g: number) => { const [x, y] = onFrame(g, 56 + (((k * 37) % 7) - 3) * 0.9, sq), sc = 0.85 + (k % 3) * 0.22;
        return `<path d="M-8,4 C-9,-7 7,-9 7,-1 C7,6 -3,7 -3,1 C-3,-3 2,-4 3,-1" transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${((deg(g) + 90 + k * 47) % 360).toFixed(0)}) scale(${sc.toFixed(2)})" fill="none" stroke="${k % 4 === 1 ? '#fff6c8' : a}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`; };
      const curls = Array.from({ length: 22 }, (_, k) => curl(k, (k / 22) * Math.PI * 2 + 0.07)).join('');
      const sparks = Array.from({ length: 11 }, (_, k) => { const g = (k / 11) * Math.PI * 2 + 0.2, [x1, y1] = onFrame(g, 49, sq), [x2, y2] = onFrame(g + 0.18, 64, sq); return bolt(x1, y1, x2, y2, 1.1); }).join('');
      return `<g class="fr-storm">${curls}</g>${sparks}`;
    }
  }
}

/**
 * 1.81 (author: first the wings covered the face and the text beside the frame, then they were too small to see):
 * a winged frame is drawn on a wider canvas (viewBox -30..170, WING_PAD units each side) and its host reserves that
 * room (.fr-host.wide, app.ts), so the wings open wide from the sides of the ring without covering anything. Each wing
 * is a fan of feathers rooted behind the ring (which hides the roots), from slightly below the side to up and out.
 */
export const WING_PAD = 30;
function wings(a: string, c1: string, c2: string, square: boolean): string {
  const rx = square ? 18 : 23, ry = square ? 54 : 53; // the root, behind the left side of the ring
  const feathers = [[172, 40], [190, 46], [208, 50], [226, 47], [244, 38]] as const; // [angle° (180 = left, 270 = up), length]
  const one = (flip: boolean) => `<g transform="${flip ? 'translate(140 0) scale(-1 1) ' : ''}translate(${rx} ${ry})">
    ${feathers.map(([ang, l], k) => `<g transform="rotate(${ang})"><path d="M0,0 C${l * 0.25},-8 ${l * 0.7},-7 ${l},0 C${l * 0.7},4.5 ${l * 0.25},5.5 0,0 Z" fill="${k % 2 ? c1 : a}" stroke="#0a1022" stroke-width="1.4" stroke-linejoin="round"/><path d="M3,-1 L${l - 4},-.5" stroke="${k % 2 ? a : c2}" stroke-width="1.1" opacity=".7"/></g>`).join('')}</g>`;
  return one(false) + one(true);
}

/** An avatar frame as SVG; it fills its box (put it at inset -20% around the avatar). Unknown id → empty string. */
/**
 * 1.93 (author: the clan frames, unlike the others): the Marco del Clan wears a laurel wreath round the bottom, two
 * crossed pennants and a shield on top; the Marco del Cerezo, cherry blossoms on the ring and petals falling.
 */
function clanDeco(p: PennantDef): string {
  const at = (deg: number, r: number) => [FC + Math.cos((deg * Math.PI) / 180) * r, FC + Math.sin((deg * Math.PI) / 180) * r];
  if (p.id === 'marco-cerezo') {
    const flower = (x: number, y: number, k: number, rot: number) => `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${rot}) scale(${k})">${[0, 72, 144, 216, 288].map((a) => `<ellipse cx="0" cy="-4.2" rx="3" ry="4.4" transform="rotate(${a})" fill="#ffd0e4" stroke="#c43a7a" stroke-width=".7"/>`).join('')}<circle r="1.8" fill="#ffe24a"/></g>`;
    const flowers = [200, 235, 270 + 35, 340, 20, 60, 110, 150].map((d, i) => { const [x, y] = at(d, 53.5); return flower(x, y, i % 2 ? 0.95 : 1.25, d); }).join('');
    const petals = [[22, 30], [118, 24], [12, 96], [128, 104], [40, 132], [100, 134]].map(([x, y], i) => `<ellipse class="fr-petal" style="animation-delay:${i * 0.5}s" cx="${x}" cy="${y}" rx="2.2" ry="3.4" transform="rotate(${i * 40} ${x} ${y})" fill="#ffb8d8" opacity=".85"/>`).join('');
    return `<g class="fr-clan">${petals}${flowers}</g>`;
  }
  // laurel: leaves along the bottom half on both sides, tied with a ribbon at the bottom
  const leaves = [];
  for (let d = 100; d <= 200; d += 14) {
    for (const side of [1, -1]) {
      const deg = side === 1 ? 180 - d : d;
      const [x, y] = at(deg + 90 - 90, 60);
      leaves.push(`<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="3" ry="6.5" transform="rotate(${(deg + (side === 1 ? 20 : -20)).toFixed(0)} ${x.toFixed(1)} ${y.toFixed(1)})" fill="#4fd07a" stroke="#0a3a1c" stroke-width="1"/>`);
    }
  }
  const flag = (x: number, rot: number, c: string) => `<g transform="translate(${x} 26) rotate(${rot})"><rect x="-.9" y="-16" width="1.8" height="26" fill="#d8c08a"/><path d="M1,-16 L15,-12 L1,-7 Z" fill="${c}" stroke="#0a1022" stroke-width=".8"/></g>`;
  return `<g class="fr-clan">${leaves.join('')}<path d="M${FC - 8},${FC + 58} q8,6 16,0 l-3,7 -5,-3 -5,3 Z" fill="${p.accent}" stroke="#0a1022" stroke-width="1"/>
    ${flag(FC - 24, -28, p.c1)}${flag(FC + 24, 28, p.accent)}</g>`;
}

export function frameSvg(def: PennantDef | string | null | undefined, square = false): string {
  const p = typeof def === 'string' ? PENNANT_BY_ID.get(def) : def;
  if (!p) return '';
  const id = `fr${++uid}`;
  const top = ['epico', 'legendario', 'mitico', 'leyenda'].includes(p.rarity);
  const ring = p.pattern === 'arcoiris' || p.rarity === 'leyenda' ? `url(#${id}r)` : `url(#${id}g)`;
  const line = (r: number, w: number, color: string, extra = '') => square
    ? `<rect x="${FC - r}" y="${FC - r}" width="${r * 2}" height="${r * 2}" rx="${r * 0.3}" fill="none" stroke="${color}" stroke-width="${w}" ${extra}/>`
    : `<circle cx="${FC}" cy="${FC}" r="${r}" fill="none" stroke="${color}" stroke-width="${w}" ${extra}/>`;
  return `<svg class="frame fr-${p.rarity}" viewBox="${p.wings ? `${-WING_PAD} 0 ${140 + WING_PAD * 2} 140` : '0 0 140 140'}" aria-hidden="true">
    <defs><linearGradient id="${id}g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${p.c1}"/><stop offset=".5" stop-color="${p.accent}"/><stop offset="1" stop-color="${p.c2}"/></linearGradient>
      <linearGradient id="${id}r" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff4a4a"/><stop offset=".25" stop-color="#ffe24a"/><stop offset=".5" stop-color="#5ee05a"/><stop offset=".75" stop-color="#4fb3ff"/><stop offset="1" stop-color="#b36bff"/></linearGradient>
      <linearGradient id="${id}s" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".9"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>
    ${p.wings ? wings(p.accent, p.c1, p.c2, square) : ''}
    ${line(53.5, 9, '#0a1022')}
    ${line(53.5, 7, ring)}
    ${line(49.5, 1.4, p.accent, 'opacity=".9"')}${line(57.5, 1.2, '#000', 'opacity=".5"')}
    ${top ? `<g class="fr-spin">${line(53.5, 3, `url(#${id}s)`, `stroke-dasharray="40 400" stroke-linecap="round"`)}</g>` : ''}
    ${ornaments(p.pattern, p.accent, p.c1, square, id)}${p.source === 'clan' ? clanDeco(p) : ''}
    <g transform="translate(${FC} 13)">${p.source === 'clan' && p.id === 'marco-clan'
      ? `<path d="M-13,-12 L13,-12 L13,1 Q13,11 0,16 Q-13,11 -13,1 Z" fill="${p.c2}" stroke="${p.accent}" stroke-width="2.4"/>` // 1.93: a shield for the clan
      : p.emblem === 'bluelock' ? '' // (author) BlueLock: its logo plate, wide enough to read
      : `<circle r="12.5" fill="${p.c2}" stroke="${p.rarity === 'leyenda' ? `url(#${id}r)` : p.accent}" stroke-width="2.4"/>`}${emblem(p.emblem, p.accent, p.emblem === 'bluelock' ? 'translate(0 2) scale(.7)' : 'scale(.36)')}</g>
    ${top ? `<g transform="translate(${FC} 127)">${p.pattern === 'huracan' // 2.1 (author's sketch): a round gem under the storm
      ? `<ellipse rx="8" ry="6.5" fill="${p.accent}" stroke="#2a1400" stroke-width="1.8"/><ellipse cx="-2" cy="-2" rx="3" ry="2.2" fill="#fff" opacity=".8"/>`
      : `<path d="M0,-7 L7,0 L0,7 L-7,0 Z" fill="${p.accent}" stroke="${p.c2}" stroke-width="1.6"/><path d="M0,-4 L3,0 L0,4 L-3,0 Z" fill="#fff" opacity=".8"/>`}</g>` : ''}
  </svg>`;
}
