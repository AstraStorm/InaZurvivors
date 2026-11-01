/** Analog input shared by touch stick and gamepad; the scene reads it alongside the keyboard. */
export const touchStick = { x: 0, y: 0 };

const DEAD = 0.22;

export const firstPad = () => (navigator.getGamepads?.() ?? []).find((p): p is Gamepad => !!p && p.connected);

/**
 * A stick only counts after it has been seen centred once: a controller lying on the desk with its stick pushed (or a
 * worn, drifting one) must not walk the captain or scroll menus on its own from the moment the page opens.
 */
let stickArmed = false;
let armedFor = '';
export function padStick(p: Gamepad): [number, number] {
  const key = `${p.index}:${p.id}`;
  if (key !== armedFor) { armedFor = key; stickArmed = false; }
  const ax = p.axes[0] ?? 0, ay = p.axes[1] ?? 0;
  if (Math.hypot(ax, ay) < DEAD) stickArmed = true;
  return stickArmed ? [ax, ay] : [0, 0];
}

export function analogMove(): [number, number] {
  let x = touchStick.x, y = touchStick.y;
  const p = firstPad();
  if (p) {
    const [ax, ay] = padStick(p);
    if (Math.hypot(ax, ay) > DEAD) { x = ax; y = ay; }
    if (p.buttons[12]?.pressed) y = -1;
    if (p.buttons[13]?.pressed) y = 1;
    if (p.buttons[14]?.pressed) x = -1;
    if (p.buttons[15]?.pressed) x = 1;
  }
  return [x, y];
}
