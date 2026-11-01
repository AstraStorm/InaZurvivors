/**
 * Element emblems drawn for InaZurvivors (inline SVG, crisp at any size): flame for Fuego, whirlwind for Aire,
 * leaf for Bosque, peaks for Montaña, in the colours the IE games use for each element.
 */
const SHAPES: Record<string, { bg: string; rim: string; path: string }> = {
  Fuego: { bg: '#e8401c', rim: '#7a1600', path: '<path d="M12 3c1 4 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-5 1-9z" fill="#ffe24a"/><path d="M12 11c1 2 2.5 2.5 2.5 4.5a2.5 2.5 0 0 1-5 0c0-1.5 1.5-2.5 2.5-4.5z" fill="#fff6d0"/>' },
  Aire: { bg: '#1fa8e8', rim: '#06456e', path: '<path d="M4 9h10a2.5 2.5 0 1 0-2.5-2.5" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"/><path d="M4 13h13a3 3 0 1 1-3 3" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"/><path d="M6 17h5" stroke="#d8f4ff" stroke-width="2" stroke-linecap="round"/>' },
  Bosque: { bg: '#3fb83a', rim: '#14520f', path: '<path d="M12 4c5 2 7 6 6 11-1 3-4 5-6 5s-5-2-6-5c-1-5 1-9 6-11z" fill="#c8ff8a"/><path d="M12 6v14M12 11l3-2M12 15l-3-2" stroke="#1f6e1a" stroke-width="1.5" fill="none" stroke-linecap="round"/>' },
  'Montaña': { bg: '#c98a2a', rim: '#5a3504', path: '<path d="M3 19l6-10 3 4 3-6 6 12z" fill="#7a4a12"/><path d="M9 9l1.6 2.6L9 13l-1.4-1.6zM15 7l1.8 3.4-1.8 1.4-1.6-1.6z" fill="#fff"/>' },
};

export const ELEMENT_NAMES = Object.keys(SHAPES);

/** Round emblem of an element; a neutral grey disc when the technique or player has none. */
export function elementIcon(element: string | null | undefined, size = 16) {
  const s = SHAPES[String(element)] ?? { bg: '#8a9bbd', rim: '#3a4660', path: '<circle cx="12" cy="12" r="3" fill="#fff"/>' };
  return `<svg class="el-ic" width="${size}" height="${size}" viewBox="0 0 24 24" role="img" aria-label="${element ?? 'Sin elemento'}"><circle cx="12" cy="12" r="11" fill="${s.bg}" stroke="${s.rim}" stroke-width="2"/>${s.path}</svg>`;
}
