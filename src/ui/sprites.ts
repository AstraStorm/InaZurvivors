/**
 * Animated character previews for the HTML UI: Raimon body + original head composed on a <canvas>,
 * using the same rig (cells, anchors, durations, mirroring) as the combat sprites. Never stretches mugshots.
 */
import type { Manifest, RosterEntry, SheetInfo } from '../data/manifest';
import { frameAt } from '../game/rig';
import { recolor, skinDiffers, type Skin } from '../game/skin';

const images = new Map<string, HTMLImageElement>();
function img(src: string) {
  let i = images.get(src);
  if (!i) {
    i = new Image();
    i.src = src;
    images.set(src, i);
  }
  return i;
}

let manifest: Manifest | null = null;
let byId = new Map<number, RosterEntry>();
let running = false;
let previewKit: NonNullable<Manifest['kits']>[string] | null = null;

/** Kit shown on previews, so menus match the squad in play. */
export function setPreviewKit(k: typeof previewKit) { previewKit = k; }

export function initPreviews(m: Manifest) {
  manifest = m;
  byId = new Map(m.roster.map((p) => [p.id, p]));
  if (m.bodies.field) img(m.bodies.field.texture);
  if (m.bodies.gk) img(m.bodies.gk.texture);
}

/** HTML for an animated preview canvas; call mountPreviews() after inserting it. anim 4 = idle facing down. */
export function charCanvas(id: number, scale = 3, anim = 12, cls = '', kit?: string) {
  return `<canvas class="char ${cls}"${kit === undefined ? '' : ` data-kit="${kit}"`} data-char="${id}" data-scale="${scale}" data-anim="${anim}" width="${40 * scale}" height="${44 * scale}"></canvas>`;
}

function drawCell(ctx: CanvasRenderingContext2D, sheet: SheetInfo, cell: number, ox: number, oy: number, flip: boolean, scale: number, source?: CanvasImageSource) {
  const im = source ?? img(sheet.texture);
  const sx = (cell % sheet.columns) * sheet.frameW, sy = Math.floor(cell / sheet.columns) * sheet.frameH;
  ctx.save();
  ctx.translate(ox * scale, oy * scale);
  if (flip) ctx.scale(-1, 1);
  ctx.drawImage(im, sx, sy, sheet.frameW, sheet.frameH, -sheet.originX * scale, -sheet.originY * scale, sheet.frameW * scale, sheet.frameH * scale);
  ctx.restore();
  return true;
}

function render(c: HTMLCanvasElement, t: number) {
  const p = byId.get(Number(c.dataset.char));
  if (!p || !manifest) return;
  const rig = manifest.bodies[p.body] ?? manifest.bodies.field;
  if (!rig) return;
  const kit = c.dataset.kit !== undefined ? manifest.kits?.[c.dataset.kit] ?? null : previewKit;
  const keeper = p.body === 'gk' && !!kit?.gk;
  const texture = kit ? (keeper ? kit.gk! : kit.field) : rig.texture;
  const fromSkin = (kit ? (keeper ? kit.gkSkin : kit.fieldSkin) : rig.skin) as Skin | null | undefined;
  const body = { ...rig, texture };
  const scale = Number(c.dataset.scale) || 3;
  const anim = body.rig.animations.find((a) => a.index === Number(c.dataset.anim)) ?? body.rig.animations[0];
  const { frame } = frameAt(anim.frames, t + (Number(c.dataset.char) % 7) * 90);
  const ctx = c.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  // body and head are drawn together or not at all: never a lone head while a texture loads or on an empty cell
  const bi = img(body.texture), hi = img(p.head.texture);
  if (frame.b === null || frame.h === null || !bi.naturalWidth || !hi.naturalWidth) return;
  ctx.clearRect(0, 0, c.width, c.height);
  const source = skinDiffers(fromSkin, p.skin) ? recolor(texture, bi, fromSkin!, p.skin!) : undefined;
  drawCell(ctx, body, frame.b, 20, 41, anim.mirror, scale, source);
  drawCell(ctx, p.head, frame.h, 20, 41, anim.mirror !== frame.hf, scale);
}

function loop(t: number) {
  const list = document.querySelectorAll<HTMLCanvasElement>('canvas.char');
  list.forEach((c) => render(c, t));
  if (list.length) requestAnimationFrame(loop);
  else running = false;
}

export function mountPreviews() {
  document.querySelectorAll<HTMLCanvasElement>('canvas.char').forEach((c) => {
    const p = byId.get(Number(c.dataset.char));
    if (p) img(p.head.texture);
    render(c, performance.now()); // paint now: a new canvas must never be shown empty for a frame
  });
  if (!running) {
    running = true;
    requestAnimationFrame(loop);
  }
}
