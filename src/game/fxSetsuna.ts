/**
 * Impulso efímero (Setsuna Boost; author, from its scene in Chrono Stone, oBD_qLCeOBE «Impulso de un segundo»). Three mini
 * clones of the shooter pass the ball to him in a straight line, the ball lit up as a cyan-white star; the star bursts in white with a cross-shaped flare, and the shot leaves as a huge cone of white
 * and cyan light with jagged edges, the star at its tip. Visual only: damage and reach stay those of a shot in ArenaScene.
 */
import Phaser from 'phaser';
import { play, ride, sparks } from './fxMovie';

type S = Phaser.Scene;
type Img = Phaser.GameObjects.Image;
type G = Phaser.GameObjects.Graphics;
const AIR = 8900;
const CYAN = 0x6ae8ff, CYAN2 = 0xcff8ff, BLUE = 0x2a8aff;

export const isSetsuna = (name: string) => /^impulso ef[ií]mero$|setsuna ?boost/i.test(name.trim());

/** a spiky star (the lit ball): `n` points, inner radius `ri`, outer `ro` */
function spiky(g: G, x: number, y: number, ro: number, ri: number, n: number, rot: number, color: number, alpha: number) {
  const pts: Phaser.Math.Vector2[] = [];
  for (let i = 0; i < n * 2; i++) { const a = rot + i * Math.PI / n, r = i % 2 ? ri : ro * (0.85 + 0.15 * Math.sin(i * 2.7)); pts.push(new Phaser.Math.Vector2(x + Math.cos(a) * r, y + Math.sin(a) * r)); }
  g.fillStyle(color, alpha).fillPoints(pts, true);
}
/** the cross-shaped flare: two long thin spikes, horizontal and vertical */
function cross(g: G, x: number, y: number, l: number, w: number, alpha: number) {
  for (const [dx, dy] of [[1, 0], [0, 1]] as const) {
    const nx = -dy, ny = dx;
    g.fillStyle(0xffffff, alpha).fillTriangle(x - dx * l, y - dy * l, x + nx * w, y + ny * w, x - nx * w, y - ny * w)
      .fillTriangle(x + dx * l, y + dy * l, x + nx * w, y + ny * w, x - nx * w, y - ny * w);
  }
}

/** what the clones copy: the shooter's sprite as it stands (body and head, frame and mirroring) */
export interface SetsunaShooter { body: Phaser.GameObjects.Sprite; head: Phaser.GameObjects.Sprite; container: Phaser.GameObjects.Container }

/** (author: «que no se ponga en negro la pantalla, que salgan 3 mini clones que se pasan la pelota en línea recta y
 *  dispara») three small cyan afterimages of the shooter stand in a straight line behind him, on the way to the rival; the
 *  ball runs from the last one to the next in quick passes, lighting up as a star, and reaches the shooter, who kicks */
export function setsunaCharge(scene: S, x: number, y: number, lv: number, ms: number, tx = x + 100, ty = y, shooter?: SetsunaShooter) {
  const k = 1 + lv * 0.04, ang = Math.atan2(ty - y, tx - x), gap = 30 * k;
  const spots = [3, 2, 1].map((n) => ({ x: x - Math.cos(ang) * gap * n, y: y - Math.sin(ang) * gap * n }));
  const clones = spots.map((p, i) => {
    const parts: Phaser.GameObjects.GameObject[] = [];
    if (shooter) for (const s of [shooter.body, shooter.head]) {
      if (!s.visible) continue;
      parts.push(scene.add.sprite(0, 0, s.texture.key, s.frame.name).setOrigin(s.originX, s.originY).setFlipX(s.flipX).setTint(i % 2 ? 0x8fe8ff : 0xbff4ff));
    } else parts.push(scene.add.ellipse(0, -12, 10, 24, CYAN2, 1));
    const c = scene.add.container(p.x, p.y, parts).setDepth(p.y).setAlpha(0).setScale(0.8);
    scene.tweens.add({ targets: c, alpha: 0.92, delay: i * 70, duration: 120 });
    try { c.postFX?.addGlow(CYAN, 2, 0, false, 0.1, 8); } catch { /* canvas renderer: no glow */ }
    return c;
  });
  // the ball: a cyan star passed along the line, clone to clone, then to the shooter
  const path = [...spots, { x, y }];
  const hop = ms / path.length;
  play(scene, 0, 0, AIR + 1, ms + 60, (g, u, t) => {
    const f = Math.min(path.length - 1.001, u * (path.length - 1)), i = Math.floor(f), q = f - i;
    const a = path[i], b = path[i + 1], bx = a.x + (b.x - a.x) * q, by = a.y + (b.y - a.y) * q - 6 - Math.sin(q * Math.PI) * 6;
    const r = (3.5 + u * 4) * k;
    g.lineStyle(3 * k, CYAN, 0.6).lineBetween(path[0].x, path[0].y - 6, bx, by); // its trail along the line
    g.fillStyle(CYAN, 0.35).fillCircle(bx, by, r * 1.05);
    spiky(g, bx, by, r * 1.1, r * 0.5, 9, t * 6, CYAN2, 0.95);
    g.fillStyle(0xffffff, 1).fillCircle(bx, by, r * 0.5);
    if (u > 0.82) cross(g, x, y - 6, r * 4 * (u - 0.82) / 0.18, 1.5 * k, (u - 0.82) / 0.18); // the flare at the shooter's foot
  }, true);
  // each clone flashes when it touches the ball, then fades
  clones.forEach((c, i) => scene.time.delayedCall(hop * (i + 0.5), () => {
    const fl = scene.add.star(c.x, c.y - 12, 4, 2, 10, 0xffffff).setDepth(AIR + 2).setBlendMode(Phaser.BlendModes.ADD);
    scene.tweens.add({ targets: fl, scale: 2.2, alpha: 0, angle: 45, duration: 220, onComplete: () => fl.destroy() });
    scene.tweens.add({ targets: c, alpha: 0, scaleX: 0.5, scaleY: 0.9, duration: 320, delay: 220, onComplete: () => c.destroy(true) });
  }));
}

export function setsunaShot(scene: S, ball: Img, lv: number) {
  const k = 1 + lv * 0.04;
  const x0 = ball.x, y0 = ball.y;
  // the burst at the kick: white star and the cross flare
  play(scene, x0, y0, AIR + 2, 260, (g, u, t) => {
    const a = 1 - u;
    spiky(g, 0, 0, (18 + u * 30) * k, (9 + u * 14) * k, 11, t * 3, 0xffffff, 0.9 * a);
    cross(g, 0, 0, (40 + u * 40) * k, 2.4 * k, a);
  }, true);
  ride(scene, ball, (g, bx, by, ang, t) => {
    // the cone of light: widest behind the ball, narrowing back to the kick, jagged white edges round a cyan core
    const len = Math.max(30, Math.hypot(bx - x0, by - y0)), w = (12 + lv * 0.6) * k, nx = -Math.sin(ang), ny = Math.cos(ang);
    const tail = (f: number) => [x0 + nx * w * 0.15 * f, y0 + ny * w * 0.15 * f] as const;
    for (const [ww, col, al] of [[1.9, BLUE, 0.3], [1.35, CYAN, 0.55], [0.75, CYAN2, 0.85], [0.3, 0xffffff, 1]] as const) {
      const pts: Phaser.Math.Vector2[] = [];
      for (let i = 0; i <= 8; i++) { const u = i / 8, j = i % 2 ? 0.7 : 1, sx = x0 + (bx - x0) * u, sy = y0 + (by - y0) * u, r = w * ww * u * j * (1 + 0.15 * Math.sin(t * 40 + i)); pts.push(new Phaser.Math.Vector2(sx + nx * r, sy + ny * r)); }
      for (let i = 8; i >= 0; i--) { const u = i / 8, j = i % 2 ? 0.7 : 1, sx = x0 + (bx - x0) * u, sy = y0 + (by - y0) * u, r = w * ww * u * j * (1 + 0.15 * Math.cos(t * 40 + i)); pts.push(new Phaser.Math.Vector2(sx - nx * r, sy - ny * r)); }
      pts.push(new Phaser.Math.Vector2(...tail(1)));
      g.fillStyle(col, al).fillPoints(pts, true);
    }
    void len;
    // the star at its tip
    g.fillStyle(CYAN, 0.5).fillCircle(bx, by, w * 1.1);
    spiky(g, bx, by, w * 1.3, w * 0.6, 9, t * 6, 0xffffff, 1);
    cross(g, bx, by, w * 2.2, 1.4 * k, 0.8);
  }, (x, y) => {
    play(scene, x, y, AIR + 2, 380, (g, u, t) => {
      const a = 1 - u;
      g.fillStyle(CYAN, 0.5 * a).fillCircle(0, 0, (14 + u * 50) * k);
      spiky(g, 0, 0, (20 + u * 36) * k, (10 + u * 18) * k, 12, t * 4, 0xffffff, 0.9 * a);
      cross(g, 0, 0, (30 + u * 70) * k, 2.2 * k, a);
    }, true);
    sparks(scene, x, y, 12, 48, [0xffffff, CYAN, CYAN2]);
  });
}
