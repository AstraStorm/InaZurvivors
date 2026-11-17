/**
 * v1.65: drawing of the profile banners, original SVG in the Inazuma style. A hanging pennant on a golden rod, cut in a
 * swallowtail, cloth gradient + pattern + emblem, framed in its rarity colour; Épico and above shine, Legendario and
 * Mítico pulse, the Leyenda frame runs through the rainbow.
 */
import { PENNANT_BY_ID, type PennantDef, type PennantEmblem, type PennantPattern } from '../data/pennants';
import type { Rarity } from '../data/manifest';
import { PN_RASTER } from './pennantRaster';

/** same colours as the rest of the UI (app.ts) */
const RARITY_COLOR: Record<Rarity, string> = { comun: '#9fb0c8', raro: '#4fb3ff', epico: '#b36bff', legendario: '#ffb020', mitico: '#ff4f8b', leyenda: '#fff6c8', alius: '#9a4dff' };

let uid = 0;
/** the BlueLock logo, relative like every generated asset (works under the GitHub Pages path too). The published build
 *  renames every resource (a/<hash>), so the app hands over the manifest's paths with setPennantLogos (2.2: before, the
 *  logo 404'd on the web) */
let BL_LOGO = 'generated/collab/bluelock.webp';
/** 2.9: Desafío Sendokai's logo, the same way */
let SD_LOGO = 'generated/collab/sendokai.webp';
/** (author: «en la etiqueta que solo salga DESAFÍO»): the word alone, for the thin plates of its banner and frame */
let SD_PLATE = 'generated/collab/sendokai_desafio.webp';
/** 2.2: the two sides' logos (tools/sector_logos.py, from the author's files) */
const SIDE_LOGO = { sector: 'generated/sector/sector_quinto.png', resistencia: 'generated/sector/resistencia.png' };
export function setPennantLogos(p: { bluelock?: string; sendokai?: string; sendokaiPlate?: string; sector?: string; resistencia?: string }) {
  if (p.sendokaiPlate) SD_PLATE = p.sendokaiPlate;
  if (p.bluelock) BL_LOGO = p.bluelock;
  if (p.sendokai) SD_LOGO = p.sendokai;
  if (p.sector) SIDE_LOGO.sector = p.sector;
  if (p.resistencia) SIDE_LOGO.resistencia = p.resistencia;
}
const W = 100, H = 132;

// ------------------------------------------------------------------ 16.7: the author's ChatGPT art (tools/gpt_pennants.py)
// Every banner has a drawn pennant, emblem, ribbon and (mythic ones) an animated emblem strip; every frame a drawn ring.
// Anything without art keeps the SVG drawing below. Logos (BlueLock, Sector Quinto, Resistencia) go on the art's blank
// plates, so no logo is ever invented.
const PN_DIR = 'art/pn/';
const hasArt = (id: string) => !!PN_RASTER.banners[id];
/** 16.7: a frame drawn by the author (round, also around the square profile icons, which are then cut round) */
export const hasFrameArt = (id: string | null | undefined) => !!(id && PN_RASTER.frames[id]);
/** the logo for a plate across the drawing (its own short version when the logo has one) */
const plateLogo = (p: PennantDef) => (p.emblem === 'sendokai' ? SD_PLATE : LOGO_OF[p.emblem]?.());
const LOGO_OF: Partial<Record<PennantEmblem, () => string>> = { bluelock: () => BL_LOGO, sendokai: () => SD_LOGO, sector: () => SIDE_LOGO.sector, resistencia: () => SIDE_LOGO.resistencia };
/** the emblem as art: the animated strip when there is one (steps through its frames), the still image otherwise */
function emblemArt(p: PennantDef, cls = ''): string {
  const n = PN_RASTER.banners[p.id]?.anim;
  const logo = LOGO_OF[p.emblem]?.();
  const plate = logo ? `<img class="pna-logo" src="${logo}" alt="">` : '';
  return n
    ? `<span class="pna-emb pna-anim ${cls}" style="--n:${n};background-image:url(${PN_DIR}${p.id}-a.webp)">${plate}</span>`
    : `<span class="pna-emb ${cls}"><img src="${PN_DIR}${p.id}-e.webp" alt="">${plate}</span>`;
}
/** 16.6: a picture that covers a w × h box, centred on its point (fx, fy) as far as its edges allow */
function photoFill(ph: NonNullable<PennantDef['photo']>, x0: number, y0: number, w: number, h: number): string {
  const ih = Math.max(h, w / ph.ratio), iw = ih * ph.ratio;
  const x = Math.min(x0, Math.max(x0 + w - iw, x0 + w / 2 - ph.x * iw)), y = Math.min(y0, Math.max(y0 + h - ih, y0 + h / 2 - ph.y * ih));
  return `<image href="${ph.src}" x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${iw.toFixed(1)}" height="${ih.toFixed(1)}" preserveAspectRatio="none"/>`;
}
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
    // 16.3: a print on old paper: red sun, Fuji, a great wave rising from the left and seigaiha at the bottom
    case 'ukiyo': return `<rect x="0" y="0" width="${W}" height="60" fill="#8a8274" opacity=".18"/>${cartouche(13, 15, 0.8)}${boat(70, 98, 0.45, -8)}`
      + smallWave(0, 92, 0.55, a) + smallWave(100, 100, 0.5, a, true) + Array.from({ length: 12 }, (_, k) => `<circle cx="${62 + ((k * 23) % 28)}" cy="${18 + ((k * 31) % 46)}" r="${k % 3 ? 0.6 : 1}" fill="#fff" opacity=".85"/>`).join('');
    // 16.3: the crimson moon over a dark red night, thin clouds and a few stars
    case 'luna': return Array.from({ length: 14 }, (_, k) => `<circle cx="${10 + ((k * 37) % 80)}" cy="${14 + ((k * 53) % 90)}" r="${k % 3 ? 0.6 : 1.1}" fill="#ffd8d8" opacity="${k % 2 ? 0.45 : 0.8}"/>`).join('')
      + `<circle cx="50" cy="52" r="40" fill="${a}" opacity=".12"/><ellipse cx="50" cy="118" rx="60" ry="22" fill="${a}" opacity=".3"/>` + redCloud(6, 26, 1.2, '#5a0a18', 0.7) + redCloud(62, 88, 1.1, '#5a0a18', 0.6);
    // 16.3: the cloth is a ball: black pentagons, white panels and their seams
    case 'pelota': return [[20, 22, 0], [80, 22, 36], [50, 2, 18], [8, 62, 20], [92, 62, -10], [26, 104, 30], [74, 104, 0]].map(([x, y, r]) => ballPanel(x, y, 9, r, '#4a5260', 0.9)).join('')
      + '<path d="M8,40 Q50,34 92,40 M8,86 Q50,92 92,86" stroke="#4a5260" stroke-width="1" fill="none" opacity=".5" stroke-dasharray="2 2"/>';
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

// ------------------------------------------------------------------ 16.3 (author): ukiyo-e, crimson moon and football
/** a little Mount Fuji with its snow cap */
const fuji = (x: number, y: number, k: number, a: string) => `<g transform="translate(${x} ${y}) scale(${k})"><path d="M-22,0 L-6,-17 Q0,-20 6,-17 L22,0 Z" fill="${a}" opacity=".8"/><path d="M-6,-17 Q0,-20 6,-17 L9,-13 L5,-14 L2,-11 L-1,-14 L-4,-12 L-9,-13 Z" fill="#fff"/></g>`;
/** the crimson moon: glow, red disc with darker seas and a lit rim */
function crimsonMoon(x: number, y: number, r: number, a: string): string {
  return `<g transform="translate(${x} ${y})"><circle r="${r * 1.9}" fill="${a}" opacity=".12"/><circle r="${r * 1.35}" fill="${a}" opacity=".18"/>
    <circle r="${r}" fill="${a}"/><circle r="${r}" fill="#000" opacity=".22" transform="translate(${r * 0.18} ${r * 0.12})"/>
    <circle cx="${-r * 0.3}" cy="${-r * 0.25}" r="${r * 0.22}" fill="#6a0010" opacity=".45"/><circle cx="${r * 0.28}" cy="${r * 0.2}" r="${r * 0.3}" fill="#6a0010" opacity=".4"/><circle cx="${r * 0.05}" cy="${r * 0.55}" r="${r * 0.12}" fill="#6a0010" opacity=".45"/>
    <path d="M${-r * 0.85},${-r * 0.5} A${r},${r} 0 0,1 ${r * 0.2},${-r * 0.98}" stroke="#ffc0c0" stroke-width="${(r / 9).toFixed(1)}" fill="none" opacity=".55" stroke-linecap="round"/></g>`;
}
/** a long thin cloud that drifts across the moon */
const redCloud = (x: number, y: number, k: number, c = '#2a0008', op = 0.9) => `<path d="M${x},${y} q${6 * k},${-7 * k} ${14 * k},${-2 * k} q${6 * k},${-8 * k} ${16 * k},${-1 * k} q${9 * k},${-5 * k} ${14 * k},${3 * k} q${5 * k},${1 * k} ${6 * k},${4 * k} Z" fill="${c}" opacity="${op}"/>`;
/** a black football pentagon, point up, radius r */
const pentagon = (x: number, y: number, r: number, rot = 0, c = '#111') => `<path d="${Array.from({ length: 5 }, (_, k) => { const g = -Math.PI / 2 + (k / 5) * Math.PI * 2; return `${k ? 'L' : 'M'}${(Math.cos(g) * r).toFixed(1)},${(Math.sin(g) * r).toFixed(1)}`; }).join('')}Z" fill="${c}" transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${rot})"/>`;
/** the panels of a ball: a pentagon with the five seams that leave it */
const ballPanel = (x: number, y: number, r: number, rot: number, seam: string, op = 1) => `<g opacity="${op}">${pentagon(x, y, r, rot)}${Array.from({ length: 5 }, (_, k) => { const g = -Math.PI / 2 + (k / 5) * Math.PI * 2 + (rot * Math.PI) / 180; return `<path d="M${(x + Math.cos(g) * r).toFixed(1)},${(y + Math.sin(g) * r).toFixed(1)} L${(x + Math.cos(g) * r * 2.1).toFixed(1)},${(y + Math.sin(g) * r * 2.1).toFixed(1)}" stroke="${seam}" stroke-width="${(r / 4.5).toFixed(2)}"/>`; }).join('')}</g>`;

/**
 * 16.4 (author, with Hokusai's «La gran ola» as reference): the great wave in a 0-100 × 0-80 box, facing right. A
 * prussian-blue hook with lighter bands, a foam rim, rings of foam claws round the hollow of the curl and spray falling.
 */
function greatWave(x: number, y: number, k: number, a: string, flip = false): string {
  const claw = (cx: number, cy: number, ang: number, s: number) => `<path d="M0,0 C-1.6,-3.2 1,-5.8 3.8,-4.6 C2,-4.1 1.3,-2.7 2.3,-1.4 C1,-1.2 .4,-.6 0,0 Z" fill="#fff" stroke="${a}" stroke-width=".45" transform="translate(${cx.toFixed(1)} ${cy.toFixed(1)}) rotate(${ang.toFixed(0)}) scale(${s})"/>`;
  const ring = (cx: number, cy: number, r: number, from: number, to: number, n: number, s: number) => Array.from({ length: n }, (_, i) => {
    const d = from + ((to - from) * i) / (n - 1), g = (d * Math.PI) / 180; return claw(cx + Math.cos(g) * r, cy + Math.sin(g) * r, d + 100, s); }).join('');
  const spray = Array.from({ length: 22 }, (_, i) => `<circle cx="${(74 + rnd(i * 7 + 3, 32)).toFixed(1)}" cy="${(14 + rnd(i * 11 + 5, 44)).toFixed(1)}" r="${i % 4 ? 0.7 : 1.2}" fill="#fff"/>`).join('');
  return `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${flip ? -k : k} ${k})">
    <path d="M0,80 C4,50 14,22 38,8 C52,0 70,2 80,12 C88,20 86,32 78,36 C72,39 66,34 68,28 C70,22 64,18 58,20 C44,26 36,44 38,80 Z" fill="${a}" stroke="#0b1a33" stroke-width="1.2" stroke-linejoin="round"/>
    <path d="M7,80 C10,54 20,30 40,16 M15,80 C17,58 25,40 41,27 M24,80 C25,64 30,50 41,39 M31,80 C31,68 34,58 40,51" stroke="#5b8bbd" stroke-width="2.4" fill="none" stroke-linecap="round"/>
    <path d="M11,80 C13,58 22,36 40,21 M20,80 C21,62 28,46 41,34" stroke="#a9c8e4" stroke-width=".9" fill="none"/>
    <path d="M20,30 C32,12 50,3 68,4 C77,5 84,10 87,17" stroke="#fff" stroke-width="2.8" fill="none" stroke-linecap="round"/>
    ${ring(70, 24, 14, -160, 105, 13, 1.35)}${ring(70, 25, 8.5, -140, 80, 8, 0.95)}${ring(48, 16, 9, -170, -40, 5, 0.9)}${spray}</g>`;
}
/** a little wave of the foreground: a low swell whose foam fingers curl to the right */
const smallWave = (x: number, y: number, k: number, a: string, flip = false) => `<g transform="translate(${x} ${y}) scale(${flip ? -k : k} ${k})"><path d="M0,30 C10,14 26,4 42,6 C52,8 56,16 50,20 C46,22 42,18 44,14 C30,14 20,22 16,30 Z" fill="${a}" stroke="#0b1a33" stroke-width="1"/><path d="M6,30 C14,18 26,10 40,10" stroke="#5b8bbd" stroke-width="2" fill="none"/><path d="M18,14 C28,7 40,5 50,10" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round"/>${[[44, 10, 40], [49, 13, 90], [51, 18, 140]].map(([cx, cy, r]) => `<path d="M0,0 q-1,-3 2,-4 q-1,2 0,3 z" fill="#fff" transform="translate(${cx} ${cy}) rotate(${r})"/>`).join('')}</g>`;
/** a long Edo boat with its rowers bent over the oars */
const boat = (x: number, y: number, k: number, rot = 0) => `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${k})"><path d="M-30,0 Q0,7 30,-3 L28,1 Q0,10 -30,3 Z" fill="#d9bc7e" stroke="#5a4320" stroke-width=".8"/>${Array.from({ length: 7 }, (_, i) => `<circle cx="${-20 + i * 7}" cy="${-1.6 + i * 0.1}" r="1.5" fill="#1b2f55"/>`).join('')}</g>`;
/** the cartouche with the title, top left of the prints (marks, not real text) */
const cartouche = (x: number, y: number, k: number) => `<g transform="translate(${x} ${y}) scale(${k})"><rect x="0" y="0" width="9" height="22" fill="#efe6cf" stroke="#3a3020" stroke-width=".8"/>${[3, 6.5, 10, 13.5, 17].map((yy) => `<path d="M3,${yy} h3" stroke="#3a3020" stroke-width="1.1"/>`).join('')}</g>`;

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
    // 16.3: the red sun of the prints with the great wave crashing in front of it
    case 'ukiyo': return `<g transform="${C}">${fuji(16, 26, 0.55, '#6d87a3')}${greatWave(-40, -34, 0.78, a)}</g>`;
    // 16.3: the crimson moon, a cloud across it and a ball flying past in silhouette
    case 'luna': return `<g transform="${C}">${crimsonMoon(0, -2, 22, a)}${redCloud(-30, 16, 1.6)}
      <path d="M26,-20 Q10,-2 -10,12" stroke="#ffd0d0" stroke-width="5" fill="none" stroke-linecap="round" opacity=".18"/><path d="M24,-18 Q10,-2 -8,10" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".5" stroke-dasharray="3 3"/>
      <circle cx="-14" cy="14" r="8.5" fill="#12020a" stroke="${a}" stroke-width="1.6"/><path d="M-14,9.2 L-9.4,12.5 L-11.2,17.9 L-16.8,17.9 L-18.6,12.5 Z" fill="${a}" opacity=".75"/></g>`;
    // 16.3: a match ball up close: shading, panels and stitching
    case 'pelota': { const k = `pb${++uid}`; return `<g transform="${C}"><defs><clipPath id="${k}"><circle r="20"/></clipPath><radialGradient id="${k}g" cx=".35" cy=".3" r=".75"><stop offset="0" stop-color="#fff"/><stop offset=".7" stop-color="#e4e8ef"/><stop offset="1" stop-color="#9aa4b4"/></radialGradient></defs>
      <ellipse cy="24" rx="16" ry="3.5" fill="#000" opacity=".3"/><circle r="20" fill="url(#${k}g)"/><g clip-path="url(#${k})">${ballPanel(0, 0, 7, 0, '#5a6270')}${[0, 72, 144, 216, 288].map((r) => { const g = ((r - 90) * Math.PI) / 180; return pentagon(Math.cos(g) * 19, Math.sin(g) * 19, 7, r + 36); }).join('')}</g>
      <circle r="20" fill="none" stroke="#1a1f2a" stroke-width="2"/><path d="M-12,-12 A16,16 0 0,1 2,-17" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".9"/></g>`; }
    // 2.3: content creators (INA303): a play button on a rounded screen, with a sparkle
    case 'creador': return `<g transform="${C}"><rect x="-26" y="-19" width="52" height="38" rx="11" fill="#ff2a5a" stroke="#2a0410" stroke-width="2.2"/><rect x="-21" y="-14" width="42" height="10" rx="5" fill="#fff" opacity=".18"/><path d="M-7,-10 L11,0 L-7,10 Z" fill="${a}" stroke="#2a0410" stroke-width="1.6" stroke-linejoin="round"/><path d="M22,-26 L24,-21 L29,-19 L24,-17 L22,-12 L20,-17 L15,-19 L20,-21 Z" fill="#ffe94a"/></g>`;
    // 2.2: the sides of the Sector Quinto, their logos as they are (the Sector's is a wide shield)
    case 'sector': return `<g transform="${C}"><image href="${SIDE_LOGO.sector}" x="-30" y="-18" width="60" height="36" preserveAspectRatio="xMidYMid meet"/></g>`;
    case 'sendokai': return `<g transform="${C}"><image href="${SD_LOGO}" x="-30" y="-19" width="60" height="38" preserveAspectRatio="xMidYMid meet"/></g>`;
    case 'resistencia': return `<g transform="${C}"><image href="${SIDE_LOGO.resistencia}" x="-22" y="-23" width="44" height="46" preserveAspectRatio="xMidYMid meet"/></g>`;
    case 'bluelock': return `<g transform="${C}"><rect x="-34" y="-11" width="68" height="22" rx="4" fill="#eef8ff" stroke="${a}" stroke-width="2.5"/><rect x="-31.5" y="-8.5" width="63" height="17" rx="2.5" fill="none" stroke="#1f5bff" stroke-width="1" opacity=".5"/><image href="${BL_LOGO}" x="-31" y="-7" width="62" height="13.5" preserveAspectRatio="xMidYMid meet"/></g>`;
  }
}

/** 2.9: the logo over a pennant's measured plate. The drawing is fitted (contain) in the W × H box: with a lower aspect
 *  than the box it fills the width and leaves a band above and below, which the plate's position takes into account */
function plateStyle(pp: { x: number; y: number; w: number; h: number }, ar: number) {
  const box = H / W, k = Math.min(1, box / ar), top = (box - ar * k) / 2, left = (1 - k) / 2;
  const pct = (v: number) => `${(v * 100).toFixed(2)}%`;
  return `left:${pct(left + (pp.x + pp.w / 2) * k)};top:${pct((top + (pp.y + pp.h / 2) * ar * k) / box)};width:${pct(pp.w * k * 0.9)};height:${pct(pp.h * ar * k / box * 1.25)}`;
}
/** A banner as SVG; `size` is its width in px (height follows). Unknown id → empty string. */
export function pennantSvg(def: PennantDef | string | undefined, size = 48): string {
  const p = typeof def === 'string' ? PENNANT_BY_ID.get(def) : def;
  if (!p) return '';
  if (hasArt(p.id)) { // 16.7: the drawn pennant, swaying from its rod; Épico and up with a shine across the cloth
    const logo = plateLogo(p), pp = PN_RASTER.banners[p.id]?.plate; // 2.9: a plate measured on the drawing
    return `<span class="pennant pn-art pn-${p.rarity}" role="img" aria-label="${p.name}" style="width:${size}px;height:${Math.round(size * H / W)}px;--rc:${RARITY_COLOR[p.rarity]}"><img src="${PN_DIR}${p.id}.webp" alt="">${logo ? `<img class="pna-logo${pp ? ' on-plate' : ''}" src="${logo}" alt=""${pp ? ` style="${plateStyle(pp, PN_RASTER.banners[p.id].ar)}"` : ''}>` : ''}<i class="pna-shine"></i></span>`;
  }
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
    <g clip-path="url(#${id}k)">${p.photo ? photoFill(p.photo, 8, 10, 84, 102) : pattern(p.pattern, p.accent, id)}${shine ? `<rect class="pn-shine" x="-60" y="0" width="40" height="${H}" fill="url(#${id}s)" transform="skewX(-20)"/>` : ''}</g>
    ${isClan(p) ? `<g clip-path="url(#${id}k)">${p.id === 'clan-cerezo' ? [[18, 30, 1.3], [80, 26, 1.1], [24, 72, 1], [76, 70, 1.2]].map(([x, y, k], i) => blossom(x, y, k, i * 50)).join('') : `<g transform="translate(50 50)">${laurel(0, 6, 34, 1, 0.8)}${laurel(0, 6, 34, -1, 0.8)}</g>`}</g>${clanEmblem(p, 50, 50, 0.75)}` : p.photo ? '' : emblem(p.emblem, p.accent)}
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
    case 'ukiyo': return `<rect width="${RW}" height="60" fill="#8a8274" opacity=".2"/>${cartouche(40, 14, 2.4)}${boat(860, 96, 1.6, -6)}${boat(500, 104, 1.5, 8)}`
      + greatWave(110, 18, 1.15, a, false) + greatWave(1180, 30, 0.95, a, true)
      + [[0, 92, 1.2], [260, 96, 1.1], [560, 92, 1.3], [980, 96, 1.1]].map(([x, y, k], i) => smallWave(x, y, k, a, i % 2 === 1)).join('')
      + Array.from({ length: 30 }, (_, k) => `<circle cx="${780 + rnd(k * 9 + 2, 300)}" cy="${12 + rnd(k * 5 + 1, 70)}" r="${k % 3 ? 1.3 : 2.2}" fill="#fff" opacity=".8"/>`).join('');
    case 'luna': return Array.from({ length: 50 }, (_, k) => `<circle cx="${rnd(k + 3, RW)}" cy="${6 + rnd(k * 7 + 2, RH - 12)}" r="${k % 5 ? 0.9 : 1.8}" fill="#ffd8d8" opacity="${k % 2 ? 0.4 : 0.8}"/>`).join('')
      + `<ellipse cx="${EX}" cy="${RH + 30}" rx="700" ry="70" fill="${a}" opacity=".28"/>` + redCloud(60, 96, 5, '#5a0a18', 0.6) + redCloud(330, 34, 4, '#5a0a18', 0.5) + redCloud(980, 40, 4.4, '#5a0a18', 0.55) + redCloud(1080, 104, 3.4, '#2a0008', 0.8);
    case 'pelota': return Array.from({ length: 13 }, (_, k) => ballPanel(40 + k * 96, k % 2 ? 26 : 92, 16, k * 23, '#4a5260', 0.85)).join('')
      + '<path d="M0,60 H1200" stroke="#4a5260" stroke-width="1.5" opacity=".35" stroke-dasharray="4 4"/>';
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
  if (hasArt(p.id)) // 16.7: the drawn ribbon, its emblem floating where the SVG one stood (EX), and the shine
    return `<span class="pn-ribbon pnr-${p.rarity} pnr-art-on" style="--rc:${RARITY_COLOR[p.rarity]};--ac:${p.accent}" aria-hidden="true"><span class="pnr-in">
      <img class="pnr-art pnr-img" src="${PN_DIR}${p.id}-c.webp" alt="">${withEmblem ? `<span class="pnr-emb-art" style="left:${(EX / RW * 100).toFixed(1)}%">${emblemArt(p)}</span>` : ''}
      ${shine ? '<i class="pnr-shine-art"></i>' : ''}</span></span>`;
  return `<span class="pn-ribbon pnr-${p.rarity}" style="--rc:${RARITY_COLOR[p.rarity]}" aria-hidden="true"><span class="pnr-in">
    <svg class="pnr-art" viewBox="0 0 ${RW} ${RH}" preserveAspectRatio="xMidYMid slice">
      <defs><linearGradient id="${id}g" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${p.c2}"/><stop offset=".58" stop-color="${p.c1}"/><stop offset="1" stop-color="${p.c2}"/></linearGradient>
        <linearGradient id="${id}v" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".18"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".35"/></linearGradient>
        <radialGradient id="${id}o" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="${p.accent}" stop-opacity=".6"/><stop offset="1" stop-color="${p.accent}" stop-opacity="0"/></radialGradient>
        ${shine ? `<linearGradient id="${id}s" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".45"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>` : ''}</defs>
      <rect width="${RW}" height="${RH}" fill="url(#${id}g)"/>
      ${p.photo ? `${widePattern(p.pattern, p.accent, id)}<g transform="translate(${EX - 92} 6)"><rect x="-5" y="-3" width="194" height="114" fill="#efe3c6" stroke="#3a3020" stroke-width="2"/>${photoFill({ ...p.photo, x: 0.5, y: 0.5 }, 0, 2, 184, 104)}<rect x="0" y="2" width="184" height="104" fill="none" stroke="#3a3020" stroke-width="1"/></g>` : `${widePattern(p.pattern, p.accent, id)}${isClan(p) ? clanRibbonDeco(p) : ''}
      ${isClan(p) ? '' : `<g opacity=".2">${echo(300, 1.1)}${echo(1040, 1.1)}</g>`}`}
      ${withEmblem && !p.photo ? `<ellipse cx="${EX}" cy="${EY}" rx="120" ry="70" fill="url(#${id}o)"/>
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
  if (hasArt(p.id)) return `<span class="pn-emblem pn-emblem-art" style="width:${size}px;height:${size}px;--ac:${p.accent}" aria-hidden="true">${emblemArt(p)}</span>`;
  const id = `pe${++uid}`;
  return `<svg class="pn-emblem" viewBox="0 0 100 100" width="${size}" height="${size}" aria-hidden="true">
    <defs><radialGradient id="${id}o" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="${p.accent}" stop-opacity=".65"/><stop offset="1" stop-color="${p.accent}" stop-opacity="0"/></radialGradient></defs>
    <circle cx="50" cy="50" r="50" fill="url(#${id}o)"/>${p.photo ? `<clipPath id="${id}c"><circle cx="50" cy="50" r="44"/></clipPath><g clip-path="url(#${id}c)">${photoFill({ ...p.photo, x: 0.36, y: 0.3 }, -40, 6, 180, 88)}</g><circle cx="50" cy="50" r="44" fill="none" stroke="#efe3c6" stroke-width="3"/>`
      : isClan(p) ? clanEmblem(p, 50, 50, 1) : emblem(p.emblem, p.accent, 'translate(50 50) scale(1.5)')}</svg>`;
}

/**
 * 16.7 (author: «añade animaciones a marcos si puedes»): a drawn frame. The image is scaled so its hole is the avatar's
 * circle (100 of the 140 box, centred). On top, by rarity: a light that runs round the ring (Raro up), twinkles that
 * blink on it (Épico up), a comet in orbit and a breathing glow (Legendario up), a colour shimmer (Mítico, Leyenda).
 */
function frameArt(p: PennantDef, a: (typeof PN_RASTER.frames)[string]): string {
  const id = `fa${++uid}`;
  // the hole a bit wider than the avatar (100): the ring sits around the face instead of over its edge (author: «tapan mucho»)
  // FRAME_DROP: the drawing sits a little low on the avatar, the face then reads higher in the ring (author: «bájalos un poquito»)
  // the frames with a logo plate on their lower edge sit lower still, so the plate stays under the chin
  const iw = FRAME_HOLE / a.d, ih = iw * a.ar, x = FC - a.cx * iw, y = FC - a.cy * ih + FRAME_DROP + (p.emblem === 'sendokai' ? -5 /* (author: «sube más el marco») */ : a.plate ? 7 : 0);
  const r = PENNANT_RANK[p.rarity];
  const logo = plateLogo(p);
  // the logo goes on the frame's blank plate, measured by tools/gpt_pennants.py (a little inside its edges)
  const pl = a.plate;
  // 2.9: a tall logo (Desafío Sendokai's) on a thin plate would be tiny at 60%: it may stand out over the plate's edges
  const lh = p.emblem === 'sendokai' ? 1.25 : 0.6;
  const plate = logo && pl ? `<image class="fa-logo" href="${logo}" x="${(x + (pl.x + pl.w * (p.emblem === 'sendokai' ? 0.1 : 0.2)) * iw).toFixed(1)}" y="${(y + (pl.y + pl.h * (1 - lh) / 2) * ih).toFixed(1)}" width="${(pl.w * (p.emblem === 'sendokai' ? 0.8 : 0.6) * iw).toFixed(1)}" height="${(pl.h * lh * ih).toFixed(1)}" preserveAspectRatio="xMidYMid meet"/>` : '';
  const tw = r >= 2 ? [30, 140, 230, 320].map((deg, k) => {
    const t = deg * Math.PI / 180, R = 64;
    return `<g class="fa-tw" style="--k:${k}" transform="translate(${(FC + R * Math.cos(t)).toFixed(1)} ${(FC + R * Math.sin(t)).toFixed(1)})"><path d="M0,-6 L1.4,-1.4 L6,0 L1.4,1.4 L0,6 L-1.4,1.4 L-6,0 L-1.4,-1.4 Z" fill="#fff"/></g>`;
  }).join('') : '';
  // (author: «no veo incorporadas alas») the winged frames whose drawing has none get the beating SVG wings behind the
  // ring, scaled to its size so they spring from behind it
  // the author's drawn wings (a01): the left one with its shoulder (lower right corner) behind the ring's left side, the
  // right one its mirror; both beat from the shoulder. Without a drawing, the SVG wings
  const WW = 60, wh = a.wing ? WW * a.wing : 0, sx = FC - 62, sy = FC + 8 + FRAME_DROP;
  const wingImg = (flip: boolean) => `<g class="fa-wing${flip ? ' r' : ''}" style="transform-origin:${flip ? 140 - sx : sx}px ${sy}px"><g${flip ? ' transform="translate(140 0) scale(-1 1)"' : ''}><image href="${PN_DIR}${p.id}-w.webp" x="${(sx - WW * 0.9).toFixed(1)}" y="${(sy - wh * 0.9).toFixed(1)}" width="${WW}" height="${wh.toFixed(1)}" preserveAspectRatio="none"/></g></g>`;
  const wingsSvg = !p.wings ? '' : a.wing ? wingImg(false) + wingImg(true)
    : !ART_WINGED.has(p.id) ? `<g transform="translate(${FC} ${FC}) scale(1.12) translate(${-FC} ${-FC})">${wings(p.accent, p.c1, p.c2, false)}</g>` : '';
  return `<svg class="frame fr-${p.rarity} frp-${p.pattern} fr-art" viewBox="${p.wings ? `${-WING_PAD} 0 ${140 + WING_PAD * 2} 140` : '0 0 140 140'}" aria-hidden="true" style="--ac:${p.accent}">${wingsSvg}
    <defs><linearGradient id="${id}s" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".95"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>
    <image class="fa-img" href="${PN_DIR}${p.id}.webp" x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${iw.toFixed(1)}" height="${ih.toFixed(1)}" preserveAspectRatio="none"/>${plate}
    ${r >= 1 ? `<g class="fr-spin"><circle cx="${FC}" cy="${FC}" r="60" fill="none" stroke="url(#${id}s)" stroke-width="3.2" stroke-dasharray="34 400" stroke-linecap="round"/></g>` : ''}
    ${tw}
    ${r >= 3 ? `<g class="fx-orbit fx-comet"><g transform="translate(${FC} ${FC - 68})"><path d="M2,0 L-22,-4 L-22,4 Z" fill="${p.accent}" opacity=".55"/><circle r="5" fill="${p.accent}" opacity=".5"/><circle r="2.6" fill="#fff"/></g></g>` : ''}
  </svg>`;
}
const FRAME_HOLE = 112, FRAME_DROP = 5;
/** the frames whose drawing already has wings (or the ukiyo-e waves that play them) */
const ART_WINGED = new Set(['marco-bluelock', 'marco-sector-quinto', 'marco-t1-campeon', 'marco-t1-podio', 'marco-creador', 'marco-ukiyo']);
const PENNANT_RANK: Record<Rarity, number> = { comun: 0, raro: 1, epico: 2, legendario: 3, mitico: 4, leyenda: 5, alius: 6 };

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
  // 16.4: each ornament in its own group (--i staggers its animation, styleFrameFx.css)
  const around = (n: number, f: (x: number, y: number, ang: number, k: number) => string, r = 58, off = 0) =>
    Array.from({ length: n }, (_, k) => { const ang = off + (k / n) * Math.PI * 2; const [x, y] = onFrame(ang, r, sq); return `<g class="fxi" style="--i:${k}">${f(x, y, ang, k)}</g>`; }).join('');
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
    // 16.3: wave crests running round the ring, foam between them
    case 'ukiyo': return around(8, (x, y, g) => `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${(deg(g) + 90).toFixed(0)})">${greatWave(-9, -10, 0.2, a)}</g>`, 56)
      + around(20, (x, y, _g, k) => `<circle cx="${x}" cy="${y}" r="${k % 2 ? 1 : 1.6}" fill="#fff" opacity=".95"/>`, 65, 0.15);
    // 16.3: a red glow behind the ring, crescents and drifting clouds
    case 'luna': return `<radialGradient id="${id}m" cx=".5" cy=".5" r=".5"><stop offset=".64" stop-color="${a}" stop-opacity="0"/><stop offset=".8" stop-color="${a}" stop-opacity=".45"/><stop offset="1" stop-color="${a}" stop-opacity="0"/></radialGradient><circle cx="${FC}" cy="${FC}" r="70" fill="url(#${id}m)"/>`
      + around(6, (x, y, g) => `<path d="M0,-8.5 A8.5,8.5 0 1,0 0,8.5 A6,6 0 1,1 0,-8.5 Z" fill="#ff5a5a" stroke="#ffd0d0" stroke-width="1" transform="translate(${x} ${y}) rotate(${deg(g)})"/>`, 62, 0.3)
      + around(4, (x, y) => redCloud(x - 12, y, 0.75, '#2a0008', 0.85), 55, 0.9);
    // 16.3: the ring is a ball's seam line: black pentagons with their stitches
    case 'pelota': return around(10, (x, y, g) => pentagon(x, y, 6, deg(g) + 90), 53.5)
      + around(10, (x, y, g) => `<path d="M-4,0 H4" stroke="#fff" stroke-width="1.2" stroke-dasharray="1.5 1.2" transform="translate(${x} ${y}) rotate(${deg(g) + 90})"/>`, 53.5, Math.PI / 10);
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
function wings(a: string, c1: string, c2: string, square: boolean, ukiyo = false): string {
  const rx = square ? 18 : 23, ry = square ? 54 : 53; // the root, behind the left side of the ring
  // 16.4: they beat slowly from their roots; the ukiyo-e frame has two great waves breaking outwards instead of feathers
  const wrap = (flip: boolean, inner: string) => `<g class="fx-wing${flip ? ' r' : ''}" style="transform-origin:${flip ? 140 - rx : rx}px ${ry}px">${inner}</g>`;
  if (ukiyo) return wrap(false, greatWave(36, 18, 0.62, a, true)) + wrap(true, greatWave(104, 18, 0.62, a));
  const feathers = [[172, 40], [190, 46], [208, 50], [226, 47], [244, 38]] as const; // [angle° (180 = left, 270 = up), length]
  const one = (flip: boolean) => `<g transform="${flip ? 'translate(140 0) scale(-1 1) ' : ''}translate(${rx} ${ry})">
    ${feathers.map(([ang, l], k) => `<g transform="rotate(${ang})"><path d="M0,0 C${l * 0.25},-8 ${l * 0.7},-7 ${l},0 C${l * 0.7},4.5 ${l * 0.25},5.5 0,0 Z" fill="${k % 2 ? c1 : a}" stroke="#0a1022" stroke-width="1.4" stroke-linejoin="round"/><path d="M3,-1 L${l - 4},-.5" stroke="${k % 2 ? a : c2}" stroke-width="1.1" opacity=".7"/></g>`).join('')}</g>`;
  return wrap(false, one(false)) + wrap(true, one(true));
}

/** 16.4: the extra moving parts of some frames: a ball running round the ring, embers rising, spray falling */
function frameExtras(p: PennantDef): string {
  switch (p.pattern) {
    case 'pelota': return `<g class="fx-orbit"><g transform="translate(${FC} ${FC - 62})"><circle r="5" fill="#fff" stroke="#111" stroke-width="1.2"/><path d="M0,-2.2 L2.1,-.7 L1.3,1.8 L-1.3,1.8 L-2.1,-.7 Z" fill="#111"/></g></g>`;
    case 'luna': case 'llamas': return Array.from({ length: 8 }, (_, k) => `<circle class="fx-ember" style="--i:${k}" cx="${30 + k * 11}" cy="${112 + (k % 3) * 6}" r="${k % 3 ? 1.3 : 2}" fill="${p.pattern === 'luna' ? '#ff5a5a' : p.accent}"/>`).join('');
    case 'ukiyo': return Array.from({ length: 10 }, (_, k) => `<circle class="fx-drop" style="--i:${k}" cx="${20 + k * 10.5}" cy="${14 + (k % 4) * 4}" r="${k % 3 ? 1.1 : 1.7}" fill="#fff"/>`).join('');
    case 'estrellas': case 'nebulosa': return [[24, 22], [118, 30], [16, 110], [124, 112]].map(([x, y], k) => `<path class="fx-star" style="--i:${k}" d="M${x},${y - 6} l1.6,4.4 4.4,1.6 -4.4,1.6 -1.6,4.4 -1.6,-4.4 -4.4,-1.6 4.4,-1.6 Z" fill="#fff"/>`).join('');
    default: return '';
  }
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
  const art = !square ? PN_RASTER.frames[p.id] : undefined;
  if (art) return frameArt(p, art);
  const id = `fr${++uid}`;
  const top = ['epico', 'legendario', 'mitico', 'leyenda'].includes(p.rarity);
  const ring = p.pattern === 'arcoiris' || p.rarity === 'leyenda' ? `url(#${id}r)` : `url(#${id}g)`;
  const line = (r: number, w: number, color: string, extra = '') => square
    ? `<rect x="${FC - r}" y="${FC - r}" width="${r * 2}" height="${r * 2}" rx="${r * 0.3}" fill="none" stroke="${color}" stroke-width="${w}" ${extra}/>`
    : `<circle cx="${FC}" cy="${FC}" r="${r}" fill="none" stroke="${color}" stroke-width="${w}" ${extra}/>`;
  return `<svg class="frame fr-${p.rarity} frp-${p.pattern}${square ? ' fr-sq' : ''}" viewBox="${p.wings ? `${-WING_PAD} 0 ${140 + WING_PAD * 2} 140` : '0 0 140 140'}" aria-hidden="true">
    <defs><linearGradient id="${id}g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${p.c1}"/><stop offset=".5" stop-color="${p.accent}"/><stop offset="1" stop-color="${p.c2}"/></linearGradient>
      <linearGradient id="${id}r" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff4a4a"/><stop offset=".25" stop-color="#ffe24a"/><stop offset=".5" stop-color="#5ee05a"/><stop offset=".75" stop-color="#4fb3ff"/><stop offset="1" stop-color="#b36bff"/></linearGradient>
      <linearGradient id="${id}s" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".9"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>
    ${p.wings ? wings(p.accent, p.c1, p.c2, square, p.pattern === 'ukiyo') : ''}
    ${line(53.5, 9, '#0a1022')}
    ${line(53.5, 7, ring)}
    ${line(49.5, 1.4, p.accent, 'opacity=".9"')}${line(57.5, 1.2, '#000', 'opacity=".5"')}
    ${top ? `<g class="fr-spin">${line(53.5, 3, `url(#${id}s)`, `stroke-dasharray="40 400" stroke-linecap="round"`)}</g>` : ''}
    <g class="fxo">${ornaments(p.pattern, p.accent, p.c1, square, id)}</g>${frameExtras(p)}
    <g class="fx-orbit fx-comet"><g transform="translate(${FC} ${FC - 60})"><path d="M2,0 L-24,-4.5 L-24,4.5 Z" fill="${p.accent}" opacity=".5"/><path d="M2,0 L-14,-2 L-14,2 Z" fill="#fff" opacity=".7"/><circle r="6" fill="${p.accent}" opacity=".45"/><circle r="3.4" fill="#fff"/></g></g>${p.source === 'clan' ? clanDeco(p) : ''}
    <g class="fx-crest"><g transform="translate(${FC} 13)">${p.source === 'clan' && p.id === 'marco-clan'
      ? `<path d="M-13,-12 L13,-12 L13,1 Q13,11 0,16 Q-13,11 -13,1 Z" fill="${p.c2}" stroke="${p.accent}" stroke-width="2.4"/>` // 1.93: a shield for the clan
      : p.emblem === 'bluelock' ? '' // (author) BlueLock: its logo plate, wide enough to read
      : `<circle r="12.5" fill="${p.c2}" stroke="${p.rarity === 'leyenda' ? `url(#${id}r)` : p.accent}" stroke-width="2.4"/>`}${emblem(p.emblem, p.accent, p.emblem === 'bluelock' ? 'translate(0 2) scale(.7)' : 'scale(.36)')}</g></g>
    ${top ? `<g class="fx-gem"><g transform="translate(${FC} 127)">${p.pattern === 'huracan' // 2.1 (author's sketch): a round gem under the storm
      ? `<ellipse rx="8" ry="6.5" fill="${p.accent}" stroke="#2a1400" stroke-width="1.8"/><ellipse cx="-2" cy="-2" rx="3" ry="2.2" fill="#fff" opacity=".8"/>`
      : `<path d="M0,-7 L7,0 L0,7 L-7,0 Z" fill="${p.accent}" stroke="${p.c2}" stroke-width="1.6"/><path d="M0,-4 L3,0 L0,4 L-3,0 Z" fill="#fff" opacity=".8"/>`}</g></g>` : ''}
  </svg>`;
}
