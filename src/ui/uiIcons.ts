/**
 * v1.4: the menu icons, drawn as small vector shapes (24×24) in the colour of the text around them, so they stay sharp
 * at any size and take the colour of each section. Original shapes made for InaZurvivors.
 */
const PATHS = {
  play: '<path d="M8 4.5v15l12-7.5z"/>',
  team: '<circle cx="9" cy="7.5" r="3.4"/><path d="M2.5 20c.4-4.3 3.1-6.6 6.5-6.6s6.1 2.3 6.5 6.6z"/><circle cx="17.2" cy="7" r="2.7"/><path d="M15.7 13.1c3.6-.5 5.5 1.8 5.9 5.9h-4.3c-.2-2.4-.6-4.3-1.6-5.9z"/>',
  cards: '<rect x="2.6" y="6.4" width="10.5" height="14.6" rx="1.6" transform="rotate(-10 7.8 13.7)" opacity=".55"/><rect x="9.6" y="3" width="11.4" height="15.6" rx="1.6"/><path d="m15.3 7 1.2 2.5 2.7.4-2 1.9.5 2.7-2.4-1.3-2.4 1.3.5-2.7-2-1.9 2.7-.4z" fill="#0007"/>',
  capsule: '<path d="M12 2.8a9.2 9.2 0 0 0-9.2 9.2h18.4A9.2 9.2 0 0 0 12 2.8z"/><path d="M2.8 13.4a9.2 9.2 0 0 0 18.4 0z" opacity=".55"/><circle cx="12" cy="12.7" r="3" fill="#0009"/><circle cx="12" cy="12.7" r="1.6"/>',
  missions: '<path d="M9 2h6v3.2H9z"/><path fill-rule="evenodd" d="M6 4h2v2.6h8V4h2a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1zm2.4 9.6-1.4 1.4 3 3 7-7-1.4-1.4-5.6 5.6z"/>',
  shop: '<path d="M4.5 8.5h15l-1.2 12.5H5.7z"/><path d="M8.5 8.5V6.6a3.5 3.5 0 0 1 7 0v1.9" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="9" cy="11.5" r="1" fill="#0008"/><circle cx="15" cy="11.5" r="1" fill="#0008"/>',
  gift: '<path d="M3 8.5h18v4.2H3zM4.6 12.7h14.8V21H4.6z"/><path d="M11 8.5h2V21h-2z" fill="#0008"/><path d="M12 8.4C10.8 5.2 7 3.6 6.2 5.6 5.4 7.6 9 8.4 12 8.4c3 0 6.6-.8 5.8-2.8-.8-2-4.6-.4-5.8 2.8z" fill="none" stroke="currentColor" stroke-width="1.8"/>',
  ticket: '<path d="M2.5 6h19v4a2 2 0 0 0 0 4v4h-19v-4a2 2 0 0 0 0-4z"/><path d="m12 8.2 1.2 2.4 2.6.4-1.9 1.8.5 2.6-2.4-1.2-2.4 1.2.5-2.6-1.9-1.8 2.6-.4z" fill="#0009"/>',
  perks: '<path d="M12 2.5 3.5 11h5.2v3.2h6.6V11h5.2z"/><path d="M8.7 15.8h6.6v2.2H8.7zM8.7 19.4h6.6v1.8H8.7z" opacity=".75"/>',
  bolt: '<path d="M13.6 1.8 4 14h6.4l-1.1 8.2L19 10h-6.3z"/>',
  shirt: '<path d="M8.2 2.8 2.6 6l2.2 5.2 3-1.2V21h8.4V10l3 1.2L21.4 6l-5.6-3.2c-.6 1.6-2 2.6-3.8 2.6s-3.2-1-3.8-2.6z"/><path d="M11 9h2v2.6h-2z" fill="#0008"/>',
  boot: '<path d="M4 3.5h6.4v8l8.6 2.8c1.6.5 2.2 1.7 2.2 3.1v1.8H3.2V3.5z"/><path d="M3.2 20.2h18v1.6h-18z" opacity=".6"/><path d="M11.4 13.6h1.6v2h-1.6zM14.2 14.4h1.6v2h-1.6z" fill="#0008"/>',
  crown: '<path d="m2.8 7.5 4.7 4.3L12 4.4l4.5 7.4 4.7-4.3-2 11.5H4.8z"/><path d="M4.8 20.2h14.4v2H4.8z"/><circle cx="12" cy="14.6" r="1.5" fill="#0008"/>',
  trophy: '<path d="M7 2.6h10v6.6a5 5 0 0 1-10 0z"/><path d="M7 4.6H3.2v2a4 4 0 0 0 4 4M17 4.6h3.8v2a4 4 0 0 1-4 4" fill="none" stroke="currentColor" stroke-width="1.9"/><path d="M11 14h2v4.2h-2zM7 18.6h10v3H7z"/>',
  news: '<path d="M3 4.5h14V19a2 2 0 0 0 2 2H5a2 2 0 0 1-2-2z"/><path d="M17.5 8.5h3.5V19a2 2 0 0 1-3.5 1.3z" opacity=".7"/><path d="M5.5 7.5h9v3.6h-9zM5.5 13h9v1.6h-9zM5.5 16.2h6.2v1.6H5.5z" fill="#0008"/>',
  cog: '<path fill-rule="evenodd" d="M10.3 2h3.4l.5 2.6 1.9.8 2.2-1.5 2.4 2.4-1.5 2.2.8 1.9 2.6.5v3.4l-2.6.5-.8 1.9 1.5 2.2-2.4 2.4-2.2-1.5-1.9.8-.5 2.6h-3.4l-.5-2.6-1.9-.8-2.2 1.5-2.4-2.4 1.5-2.2-.8-1.9L2 13.7v-3.4l2.6-.5.8-1.9-1.5-2.2 2.4-2.4 2.2 1.5 1.9-.8zM12 8.4a3.6 3.6 0 1 0 0 7.2 3.6 3.6 0 0 0 0-7.2z"/>',
  soundOn: '<path d="M3 9h4l5.2-4.2v14.4L7 15H3z"/><path d="M15.2 8.6a4.8 4.8 0 0 1 0 6.8M17.8 6a8.4 8.4 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  soundOff: '<path d="M3 9h4l5.2-4.2v14.4L7 15H3z"/><path d="m15.6 9.4 5.2 5.2m0-5.2-5.2 5.2" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>',
  bug: '<ellipse cx="12" cy="14.2" rx="5.2" ry="6.6"/><circle cx="12" cy="6.4" r="3.1"/><path d="M12 9.6v11" stroke="#0008" stroke-width="1.4"/><path d="m3 10 4 2M3 15h3.8M4 20.4l3.4-2.6M21 10l-4 2M21 15h-3.8M20 20.4l-3.4-2.6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
  help: '<circle cx="12" cy="12" r="10"/><path d="M9.2 9.3a2.9 2.9 0 1 1 4.2 2.6c-.9.5-1.4 1.1-1.4 2.1v.6" fill="none" stroke="#0009" stroke-width="2.2" stroke-linecap="round"/><circle cx="12" cy="17.6" r="1.3" fill="#0009"/>',
  pitch: '<rect x="2.5" y="4.5" width="19" height="15" rx="1.5"/><path d="M12 4.5v15M2.5 9.5h3v5h-3M21.5 9.5h-3v5h3" fill="none" stroke="#0008" stroke-width="1.4"/><circle cx="12" cy="12" r="2.6" fill="none" stroke="#0008" stroke-width="1.4"/>',
  target: '<circle cx="12" cy="12" r="9.5"/><circle cx="12" cy="12" r="6" fill="#0007"/><circle cx="12" cy="12" r="3"/>',
  clock: '<circle cx="12" cy="12" r="9.6"/><path d="M12 6.5V12l3.6 2.4" fill="none" stroke="#0009" stroke-width="2.2" stroke-linecap="round"/>',
  fire: '<path d="M12.2 2c.6 3.4 4 5.2 4.8 8.8.6 2.4-.2 4.4-1.3 5.6.2-2-.6-3.6-2-4.6.2 2.4-1 4-2.8 4.8.6-1.6.2-3-.8-4-1.6 1.4-2.6 3-2.2 5.2-2-1.4-3-3.6-2.4-6.4C4.4 7.6 9.6 6 12.2 2z"/><path d="M6.4 18.6c1.6 2.2 3.6 3.2 5.8 3.2 3.4 0 6-2.4 6.2-5.8" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
  // 1.8: GTS — the globe with two exchange arrows
  gts: '<circle cx="12" cy="12" r="9.4" opacity=".55"/><path d="M2.8 12h18.4M12 2.6c2.6 2.6 3.8 5.8 3.8 9.4s-1.2 6.8-3.8 9.4c-2.6-2.6-3.8-5.8-3.8-9.4S9.4 5.2 12 2.6z" fill="none" stroke="#0008" stroke-width="1.3"/><path d="M6 8.6h9.4l-2.2-2.2M18 15.4H8.6l2.2 2.2" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>',
  lock: '<path d="M7 10V7.5a5 5 0 0 1 10 0V10" fill="none" stroke="currentColor" stroke-width="2.4"/><rect x="4.5" y="10" width="15" height="11.5" rx="2"/><circle cx="12" cy="15.2" r="1.7" fill="#0009"/>', // 2.6: Victory Road, not yet
} as const;

export type UiIconName = keyof typeof PATHS;

/** An inline icon; it takes the text colour (currentColor) and the size of the box around it. */
export const uiIcon = (name: UiIconName, cls = '') => `<svg class="uic${cls ? ` ${cls}` : ''}" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">${PATHS[name]}</svg>`;
