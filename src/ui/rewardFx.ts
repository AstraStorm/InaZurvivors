/** Reward feedback in the HTML layer: coins flying to their counter, counters rolling up, confetti. */

const reduced = () => document.body.classList.contains('reduced-motion');

/** Icons fly from a point to the counter in the top bar, which pulses as they land. */
export function flyTo(from: Element | { x: number; y: number }, targetSel: '.coins' | '.tokens', count = 10) {
  const target = document.querySelector(targetSel);
  if (!target || reduced()) return;
  const a = from instanceof Element ? from.getBoundingClientRect() : { left: from.x, top: from.y, width: 0, height: 0 };
  const b = target.getBoundingClientRect();
  const x0 = a.left + a.width / 2, y0 = a.top + a.height / 2, x1 = b.left + b.width / 2, y1 = b.top + b.height / 2;
  for (let i = 0; i < count; i++) {
    const c = document.createElement('i');
    c.className = `fly ${targetSel === '.coins' ? 'coin' : 'token'}`;
    c.style.left = `${x0}px`;
    c.style.top = `${y0}px`;
    document.body.appendChild(c);
    const spread = 70;
    const mx = (Math.random() - 0.5) * spread, my = (Math.random() - 0.5) * spread - 30;
    const anim = c.animate([
      { transform: 'translate(0,0) scale(.5)', opacity: 1 },
      { transform: `translate(${mx}px,${my}px) scale(1.2)`, opacity: 1, offset: 0.35 },
      { transform: `translate(${x1 - x0}px,${y1 - y0}px) scale(.6)`, opacity: 0.9 },
    ], { duration: 620 + i * 26, easing: 'cubic-bezier(.5,0,.8,.4)' });
    anim.onfinish = () => {
      c.remove();
      target.classList.remove('bump');
      void (target as HTMLElement).offsetWidth;
      target.classList.add('bump');
    };
  }
}

export function countUp(el: HTMLElement, from: number, to: number, ms = 700, prefix = '') {
  if (reduced()) { el.textContent = `${prefix}${to}`; return; }
  const t0 = performance.now();
  const step = (t: number) => {
    const k = Math.min(1, (t - t0) / ms);
    el.textContent = `${prefix}${Math.round(from + (to - from) * (1 - (1 - k) ** 3))}`;
    if (k < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

export function confetti(n = 70) {
  if (reduced()) return;
  const colors = ['#ffe24a', '#ff6a2a', '#4fb3ff', '#5ee05a', '#ff4f8b'];
  for (let i = 0; i < n; i++) {
    const c = document.createElement('i');
    c.className = 'confetti';
    c.style.left = `${Math.random() * 100}vw`;
    c.style.background = colors[i % colors.length];
    document.body.appendChild(c);
    c.animate([{ transform: 'translateY(-20px) rotate(0)' }, { transform: `translateY(105vh) rotate(${400 + Math.random() * 500}deg)` }],
      { duration: 1400 + Math.random() * 1400, delay: Math.random() * 500, easing: 'ease-in' }).onfinish = () => c.remove();
  }
}
