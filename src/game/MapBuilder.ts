/**
 * Builds an arena from its blueprint (layout of the original top-down map, see tools/blueprint.ts):
 * ground tilemap from original textures, pitches, building facades, trees, decoration, terrain edges,
 * plus the collision grid and a BFS flow field so enemies walk around obstacles.
 */
import Phaser from 'phaser';
import type { Blueprint, MapInfo } from '../data/manifest';

const SUB = 32; // tile size in world px

/** Tiles per terrain in the runtime tileset: 4 base quadrants + 4 side overlays + 4 corner overlays. */
const TILES_PER_CLASS = 12;

/** Pixel-stepped rectangles of an overlay inside a 32px tile. 0-3: side N/E/S/W; 4-7: corner NE/SE/SW/NW. */
function overlayMask(o: number): [number, number, number, number][] {
  const out: [number, number, number, number][] = [];
  const step = 4;
  if (o < 4) {
    const wave = [8, 12, 10, 6, 9, 13, 11, 7];
    for (let i = 0; i < 8; i++) {
      const d = wave[(i + o * 3) % 8], a = i * step;
      out.push(o === 0 ? [a, 0, step, d] : o === 1 ? [SUB - d, a, d, step] : o === 2 ? [a, SUB - d, step, d] : [0, a, d, step]);
    }
    return out;
  }
  // corner: everything outside a circle centred on the opposite corner, which rounds the corner off
  const c = o - 4;
  const r = 30;
  const right = c === 0 || c === 1, bottom = c === 1 || c === 2;
  for (let i = 0; i < 8; i++) {
    const a = i * step; // distance from the side this corner touches
    const u = SUB - a - step / 2;
    const reach = u < r ? Math.floor(Math.sqrt(r * r - u * u) / step) * step : 0;
    const d = SUB - reach;
    if (d <= 0) continue;
    out.push([right ? SUB - a - step : a, bottom ? SUB - d : 0, step, d]);
  }
  return out;
}

export class Arena {
  readonly bp: Blueprint;
  readonly widthPx: number;
  private bounds: { x0: number; y0: number; x1: number; y1: number } | null = null;
  readonly heightPx: number;
  private walk: Uint8Array;
  private dist: Int16Array;
  private props: Phaser.GameObjects.Image[] = [];

  constructor(private scene: Phaser.Scene, private map: MapInfo, private quality: 'alta' | 'media' | 'baja' = 'alta') {
    this.bp = map.blueprint!;
    this.widthPx = this.bp.w * SUB;
    this.heightPx = this.bp.h * SUB;
    this.walk = new Uint8Array(this.bp.w * this.bp.h);
    this.dist = new Int16Array(this.bp.w * this.bp.h).fill(-1);
    for (let y = 0; y < this.bp.h; y++) for (let x = 0; x < this.bp.w; x++) {
      this.walk[y * this.bp.w + x] = this.cls(x, y).walk ? 1 : 0;
    }
  }

  cls(x: number, y: number) { return this.bp.classes[parseInt(this.bp.rows[y][x], 36)]; }
  private texKey(name: string) { return this.map.textures[name]?.key; }

  // ------------------------------------------------------------- visuals
  build() {
    const { bp, scene } = this;
    if (this.map.baked) {
      const { baked, id } = this.map;
      for (const t of baked.tiles) scene.add.image(t.x, t.y, `bk:${id}:${t.src}`).setOrigin(0).setDepth(-10000);
      // buildings can't be walked behind and would hide the squad, so only trees and small objects overlap players
      for (const p of baked.props) {
        if (p.h >= 520 || p.w >= 700) continue;
        this.props.push(scene.add.image(p.x + p.w / 2, p.y + p.h, `bk:${id}:${p.src}`).setOrigin(0.5, 1).setDepth(p.base));
      }
      return;
    }
    // runtime tileset: 4 sub-tiles (quadrants of the original 64px texture) per class for seamless tiling
    const tsKey = `tiles:${this.map.id}`;
    if (!scene.textures.exists(tsKey)) {
      const canvas = scene.textures.createCanvas(tsKey, SUB * TILES_PER_CLASS * bp.classes.length, SUB)!;
      const ctx = canvas.getContext();
      ctx.imageSmoothingEnabled = false;
      bp.classes.forEach((c, i) => {
        const key = this.texKey(c.tex);
        if (!key) return;
        const img = scene.textures.get(key).getSourceImage() as HTMLImageElement;
        for (let q = 0; q < 4; q++) {
          // crop: one clean 32x32 window of the texture (skips painted lines/edges); otherwise its four quadrants
          const sx = c.crop ? c.crop[0] : ((q % 2) * SUB) % img.width;
          const sy = c.crop ? c.crop[1] : (Math.floor(q / 2) * SUB) % img.height;
          ctx.drawImage(img, sx, sy, Math.min(SUB, img.width), Math.min(SUB, img.height), (i * TILES_PER_CLASS + q) * SUB, 0, SUB, SUB);
        }
        // eight organic overlays of this terrain: it reaches into a neighbouring cell from a side or a corner
        for (let o = 0; o < 8; o++) {
          const dx = (i * TILES_PER_CLASS + 4 + o) * SUB;
          ctx.save();
          ctx.beginPath();
          overlayMask(o).forEach(([x, y, w, h]) => ctx.rect(dx + x, y, w, h));
          ctx.clip();
          ctx.drawImage(img, c.crop ? c.crop[0] : 0, c.crop ? c.crop[1] : 0, Math.min(SUB, img.width), Math.min(SUB, img.height), dx, 0, SUB, SUB);
          ctx.restore();
        }
      });
      canvas.refresh();
    }
    const layer = (data: number[][], depth: number) => {
      const tm = scene.make.tilemap({ data, tileWidth: SUB, tileHeight: SUB });
      tm.createLayer(0, tm.addTilesetImage(tsKey, tsKey, SUB, SUB, 0, 0)!, 0, 0)!.setDepth(depth);
    };
    layer(bp.rows.map((row, y) => [...row].map((ch, x) => parseInt(ch, 36) * TILES_PER_CLASS + (x % 2) + (y % 2) * 2)), -10000);
    this.transitionLayers().forEach((d, i) => layer(d, -9999 + i));

    if (this.quality !== 'baja') this.drawGroundVariation();
    if (this.quality === 'alta') this.scatterDetail();
    this.drawEdges();
    this.drawPitches();
    this.drawBuildings();
    this.drawTreesAndDecor();
  }

  private isSoft(c: { id: string; kind: string }) { return c.kind !== 'building' && c.id !== 'border'; }
  private inPitch(x: number, y: number) { return this.bp.pitches.some(([px, py, pw, ph]) => x >= px && y >= py && x < px + pw && y < py + ph); }

  /** Overlay tile layers that round the stair-steps between terrains. Corners win over the two sides they replace. */
  private transitionLayers() {
    const { bp } = this;
    const idx = (x: number, y: number) => (x >= 0 && y >= 0 && x < bp.w && y < bp.h ? parseInt(bp.rows[y][x], 36) : -1);
    const empty = () => Array.from({ length: bp.h }, () => Array<number>(bp.w).fill(-1));
    const layers = [empty(), empty(), empty()];
    const sides: [number, number][] = [[0, -1], [1, 0], [0, 1], [-1, 0]]; // N E S W
    const soft = (x: number, y: number) => { const v = idx(x, y); return v >= 0 && this.isSoft(bp.classes[v]) && !this.inPitch(x, y); };
    const others = (x: number, y: number) => sides.map(([dx, dy]) => {
      const v = idx(x + dx, y + dy);
      return soft(x, y) && soft(x + dx, y + dy) && v !== idx(x, y) ? v : -1;
    });
    // first pass: rounded corners, and which sides of each cell they use up
    const rounded = new Map<number, boolean[]>();
    const corners = new Map<number, number[]>();
    for (let y = 0; y < bp.h; y++) for (let x = 0; x < bp.w; x++) {
      const n = others(x, y);
      const used = [false, false, false, false];
      const list: number[] = [];
      for (let c = 0; c < 4; c++) { // corner c sits between side c and side c+1
        const d = (c + 1) % 4;
        if (n[c] >= 0 && n[c] < idx(x, y) && n[c] === n[d] && !used[c] && !used[d]) { // convex corners only
          list.push(n[c] * TILES_PER_CLASS + 8 + c);
          used[c] = used[d] = true;
        }
      }
      if (list.length) { rounded.set(y * bp.w + x, used); corners.set(y * bp.w + x, list); }
    }
    // second pass: wavy sides, except from a cell whose facing side was rounded off (they would redraw the corner it just cut)
    for (let y = 0; y < bp.h; y++) for (let x = 0; x < bp.w; x++) {
      const self = idx(x, y);
      const n = others(x, y);
      const used = rounded.get(y * bp.w + x);
      const placed = [...(corners.get(y * bp.w + x) ?? [])];
      for (let c = 0; c < 4; c++) {
        if (n[c] <= self || used?.[c]) continue;
        const [dx, dy] = sides[c];
        if (rounded.get((y + dy) * bp.w + x + dx)?.[(c + 2) % 4]) continue;
        placed.push(n[c] * TILES_PER_CLASS + 4 + c);
      }
      placed.slice(0, layers.length).forEach((t, i) => { layers[i][y][x] = t; });
    }
    return layers;
  }

  /** Two large soft blotch layers at unrelated scales, so the 64px texture stops reading as a grid. */
  private drawGroundVariation() {
    const { scene } = this;
    const key = 'fx:blotch';
    if (!scene.textures.exists(key)) {
      const size = 256;
      const canvas = scene.textures.createCanvas(key, size, size)!;
      const ctx = canvas.getContext();
      let seed = 7;
      const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
      for (let i = 0; i < 46; i++) {
        const x = rnd() * size, y = rnd() * size, r = 18 + rnd() * 46, dark = i % 2 === 0;
        for (const ox of [-size, 0, size]) for (const oy of [-size, 0, size]) { // wrapped, so the layer tiles seamlessly
          const g = ctx.createRadialGradient(x + ox, y + oy, 0, x + ox, y + oy, r);
          g.addColorStop(0, dark ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.4)');
          g.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = g;
          ctx.fillRect(x + ox - r, y + oy - r, r * 2, r * 2);
        }
      }
      canvas.refresh();
    }
    const w = this.widthPx, h = this.heightPx;
    scene.add.tileSprite(0, 0, w, h, key).setOrigin(0).setDepth(-9996).setAlpha(0.2).setTileScale(1.7);
    scene.add.tileSprite(0, 0, w, h, key).setOrigin(0).setDepth(-9995).setAlpha(0.14).setTileScale(3.1).setTilePosition(91, 57);
  }

  /** Small tufts and pebbles over walkable ground, as one blitter so they cost a single draw call. */
  private scatterDetail() {
    const { bp, scene } = this;
    if (!scene.textures.exists('fx:detail')) {
      const g = scene.make.graphics({ x: 0, y: 0 }, false);
      g.fillStyle(0xffffff).fillRect(1, 0, 1, 3).fillRect(3, 1, 1, 2).fillRect(0, 2, 1, 1).fillRect(4, 2, 1, 1); // tuft
      g.fillRect(6, 1, 3, 2).fillRect(7, 0, 1, 1); // pebble
      g.generateTexture('fx:detail', 10, 4);
      g.destroy();
      const t = scene.textures.get('fx:detail');
      t.add('tuft', 0, 0, 0, 5, 3);
      t.add('pebble', 0, 6, 0, 3, 3);
    }
    const rng = new Phaser.Math.RandomDataGenerator([`${this.map.id}:detail`]);
    const blit = scene.add.blitter(0, 0, 'fx:detail').setDepth(-9975);
    for (let y = 0; y < bp.h; y++) for (let x = 0; x < bp.w; x++) {
      const c = this.cls(x, y);
      if (!c.walk || !this.isSoft(c) || this.inPitch(x, y) || rng.frac() > 0.55) continue;
      const tuft = c.id === 'grass' || c.kind === 'tree';
      const bob = blit.create(x * SUB + rng.between(0, 28), y * SUB + rng.between(0, 28), tuft ? 'tuft' : 'pebble');
      bob.setAlpha(0.28);
      bob.tint = tuft ? 0x14380f : 0x4a3418;
    }
  }

  private drawEdges() {
    const g = this.scene.add.graphics().setDepth(-9990);
    const { bp } = this;
    // only hard boundaries keep a contact shadow; soft terrain now blends through the transition layers
    const hard = (x: number, y: number) => !this.isSoft(this.cls(x, y));
    for (let y = 0; y < bp.h; y++) for (let x = 0; x < bp.w; x++) {
      const a = bp.rows[y][x];
      if (x + 1 < bp.w && bp.rows[y][x + 1] !== a && (hard(x, y) || hard(x + 1, y))) {
        g.fillStyle(0x000000, 0.18).fillRect((x + 1) * SUB - 1, y * SUB, 2, SUB);
      }
      if (y + 1 < bp.h && bp.rows[y + 1][x] !== a && (hard(x, y) || hard(x, y + 1))) {
        g.fillStyle(0x000000, 0.22).fillRect(x * SUB, (y + 1) * SUB - 1, SUB, 3);
      }
    }
  }

  /** Pitch markings drawn at 1:1 pixel scale over the original pitch ground texture (no up-scaled bitmap). */
  private drawPitches() {
    const g = this.scene.add.graphics().setDepth(-9980);
    for (const [px, py, pw, ph] of this.bp.pitches) {
      const inset = 10;
      const x0 = px * SUB + inset, y0 = py * SUB + inset, w = pw * SUB - inset * 2, h = ph * SUB - inset * 2;
      const vertical = h >= w; // goals on the short sides
      const L = vertical ? h : w, W = vertical ? w : h;
      const P = (a: number, b: number) => (vertical ? [x0 + b, y0 + a] : [x0 + a, y0 + b]) as [number, number];
      const rect = (a: number, b: number, la: number, lb: number) => {
        const [x, y] = P(a, b);
        if (vertical) g.strokeRect(x, y, lb, la); else g.strokeRect(x, y, la, lb);
      };
      // faint mowing stripes
      for (let k = 0; k < 10; k++) if (k % 2 === 0) {
        g.fillStyle(0xffffff, 0.05);
        const [sx, sy] = P((L / 10) * k, 0);
        if (vertical) g.fillRect(sx, sy, W, L / 10); else g.fillRect(sx, sy, L / 10, W);
      }
      g.lineStyle(3, 0xffffff, 0.92);
      rect(0, 0, L, W);
      const [hx1, hy1] = P(L / 2, 0), [hx2, hy2] = P(L / 2, W);
      g.lineBetween(hx1, hy1, hx2, hy2);
      const [cx, cy] = P(L / 2, W / 2);
      g.strokeCircle(cx, cy, Math.min(W, L) * 0.13);
      g.fillStyle(0xffffff, 0.95).fillCircle(cx, cy, 3);
      for (const end of [0, 1]) {
        const pa = W * 0.56, pd = L * 0.16, ga = W * 0.26, gd = L * 0.06;
        rect(end ? L - pd : 0, (W - pa) / 2, pd, pa);
        rect(end ? L - gd : 0, (W - ga) / 2, gd, ga);
        const [sx, sy] = P(end ? L - L * 0.11 : L * 0.11, W / 2);
        g.fillCircle(sx, sy, 2.5);
        // goal frame just outside the line
        g.fillStyle(0xffffff, 0.85);
        const [gx, gy] = P(end ? L : -6, (W - W * 0.14) / 2);
        if (vertical) g.fillRect(gx, gy, W * 0.14, 6); else g.fillRect(gx, gy, 6, W * 0.14);
        g.fillStyle(0xffffff, 0.95);
      }
    }
  }

  /** Facades as continuous strips along the south edge of each building block, with a soft ground shadow. */
  private drawBuildings() {
    const { bp } = this;
    const shadow = this.scene.add.graphics().setDepth(-9960);
    for (let y = 0; y < bp.h; y++) {
      let x = 0;
      while (x < bp.w) {
        const c = this.cls(x, y);
        const south = (xx: number) => (y + 1 < bp.h ? this.cls(xx, y + 1) : null);
        const isEdge = (xx: number) => this.cls(xx, y).id === c.id && c.kind === 'building' && !!c.facade && south(xx)?.id !== c.id;
        if (!isEdge(x)) { x++; continue; }
        const x0 = x;
        while (x < bp.w && isEdge(x)) x++;
        const key = this.texKey(c.facade!);
        const t = this.map.textures[c.facade!];
        if (!key || !t) continue;
        const h = Math.min(64, t.h);
        const ts = this.scene.add.tileSprite(x0 * SUB, (y + 1) * SUB, (x - x0) * SUB, h, key).setOrigin(0, 1);
        ts.tilePositionY = Math.max(0, t.h - h);
        ts.setDepth((y + 1) * SUB - 40);
        shadow.fillStyle(0x000000, 0.22).fillRect(x0 * SUB, (y + 1) * SUB, (x - x0) * SUB, 6);
      }
    }
  }

  private drawTreesAndDecor() {
    const { bp, scene } = this;
    const rng = new Phaser.Math.RandomDataGenerator([this.map.id]);
    const placed: { x: number; y: number }[] = [];
    const cells: [number, number][] = [];
    for (let y = 0; y < bp.h; y++) for (let x = 0; x < bp.w; x++) cells.push([x, y]);
    // random order + minimum spacing => natural groves instead of a repeating grid
    for (let i = cells.length - 1; i > 0; i--) { const j = rng.between(0, i); [cells[i], cells[j]] = [cells[j], cells[i]]; }
    for (const [x, y] of cells) {
      const c = this.cls(x, y);
      if (c.kind === 'tree' && c.props?.length) {
        const px = x * SUB + SUB / 2 + rng.between(-6, 6), py = (y + 1) * SUB;
        if (placed.some((p) => Math.abs(p.x - px) < 34 && Math.abs(p.y - py) < 26)) continue;
        const name = c.props[rng.between(0, c.props.length - 1)];
        const key = this.texKey(name);
        if (!key) continue;
        placed.push({ x: px, y: py });
        const img = scene.add.image(px, py, key).setOrigin(0.5, 1);
        img.setDepth(img.y);
        this.props.push(img);
      } else if (c.walk && (c.id === 'grass' || c.id === 'edge') && bp.decor.length && rng.frac() < 0.03) {
        const key = this.texKey(bp.decor[rng.between(0, bp.decor.length - 1)]);
        if (key) {
          const t = scene.textures.get(key).getSourceImage() as HTMLImageElement;
          if (t.width <= 32) scene.add.image(x * SUB + rng.between(4, 28), y * SUB + rng.between(4, 28), key).setDepth(-9970);
        }
      }
    }
  }

  /** Props that would hide a character standing just above them become translucent. */
  fadePropsNear(points: { x: number; y: number }[]) {
    for (const p of this.props) {
      const hide = points.some((q) => Math.abs(q.x - p.x) < p.displayWidth / 2 && q.y < p.y && q.y > p.y - p.displayHeight + 8);
      p.setAlpha(hide ? 0.45 : 1);
    }
  }

  // ------------------------------------------------------------- collision & navigation
  cellOf(x: number, y: number) { return [Math.floor(x / SUB), Math.floor(y / SUB)] as const; }
  walkableCell(cx: number, cy: number) {
    return cx >= 0 && cy >= 0 && cx < this.bp.w && cy < this.bp.h && this.walk[cy * this.bp.w + cx] === 1;
  }
  walkableAt(x: number, y: number, r = 5) {
    for (const [ox, oy] of [[-r, 0], [r, 0], [0, -r], [0, 1]]) {
      const [cx, cy] = this.cellOf(x + ox, y + oy);
      if (!this.walkableCell(cx, cy)) return false;
    }
    return true;
  }
  /** Moves a point by (dx, dy) sliding along walls. */
  move(pos: { x: number; y: number }, dx: number, dy: number, r = 5) {
    if (this.walkableAt(pos.x + dx, pos.y, r)) pos.x += dx;
    if (this.walkableAt(pos.x, pos.y + dy, r)) pos.y += dy;
  }
  /** Keeps a point inside the walkable extent of the arena (followers ignore solid props but never leave the map). */
  clampToBounds(x: number, y: number) {
    if (!this.bounds) {
      let x0 = Infinity, y0 = Infinity, x1 = -1, y1 = -1;
      for (let cy = 0; cy < this.bp.h; cy++) for (let cx = 0; cx < this.bp.w; cx++) {
        if (!this.walkableCell(cx, cy)) continue;
        x0 = Math.min(x0, cx); y0 = Math.min(y0, cy); x1 = Math.max(x1, cx); y1 = Math.max(y1, cy);
      }
      this.bounds = { x0: x0 * SUB + 6, y0: y0 * SUB + 6, x1: (x1 + 1) * SUB - 6, y1: (y1 + 1) * SUB - 6 };
    }
    const b = this.bounds;
    return { x: Math.max(b.x0, Math.min(b.x1, x)), y: Math.max(b.y0, Math.min(b.y1, y)) };
  }

  spawnPoint() { return { x: (this.bp.spawn[0] + 0.5) * SUB, y: (this.bp.spawn[1] + 0.5) * SUB }; }

  /** BFS distances from the target cell over walkable cells. */
  updateFlow(tx: number, ty: number) {
    const { w, h } = this.bp;
    const [sx, sy] = this.cellOf(tx, ty);
    this.dist.fill(-1);
    if (!this.walkableCell(sx, sy)) return;
    const q = new Int32Array(w * h);
    let head = 0, tail = 0;
    q[tail++] = sy * w + sx;
    this.dist[sy * w + sx] = 0;
    while (head < tail) {
      const i = q[head++];
      const x = i % w, y = (i / w) | 0;
      const d = this.dist[i] + 1;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
        const j = ny * w + nx;
        if (this.walk[j] && this.dist[j] < 0) { this.dist[j] = d; q[tail++] = j; }
      }
    }
  }

  /** Direction to follow the flow field from a world position (falls back to the direct vector). */
  flowDir(x: number, y: number, tx: number, ty: number): [number, number] {
    const { w } = this.bp;
    const [cx, cy] = this.cellOf(x, y);
    const here = this.walkableCell(cx, cy) ? this.dist[cy * w + cx] : -1;
    if (here <= 1) return norm(tx - x, ty - y);
    let best: [number, number] | null = null, bd = here;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]]) {
      const nx = cx + dx, ny = cy + dy;
      if (!this.walkableCell(nx, ny)) continue;
      if (dx && dy && (!this.walkableCell(cx + dx, cy) || !this.walkableCell(cx, cy + dy))) continue;
      const d = this.dist[ny * w + nx];
      if (d >= 0 && d < bd) { bd = d; best = [dx, dy]; }
    }
    if (!best) return norm(tx - x, ty - y);
    const gx = (cx + best[0] + 0.5) * SUB, gy = (cy + best[1] + 0.5) * SUB;
    return norm(gx - x, gy - y);
  }

  /** Random walkable cell at a distance ring from a point (for spawns). */
  randomCellAround(x: number, y: number, minPx: number, maxPx: number, rng: Phaser.Math.RandomDataGenerator) {
    for (let i = 0; i < 40; i++) {
      const a = rng.realInRange(0, Math.PI * 2), r = rng.realInRange(minPx, maxPx);
      const px = x + Math.cos(a) * r, py = y + Math.sin(a) * r;
      const [cx, cy] = this.cellOf(px, py);
      if (this.walkableCell(cx, cy) && this.dist[cy * this.bp.w + cx] >= 0) return { x: (cx + 0.5) * SUB, y: (cy + 0.5) * SUB };
    }
    return null;
  }
}

function norm(x: number, y: number): [number, number] {
  const l = Math.hypot(x, y) || 1;
  return [x / l, y / l];
}
