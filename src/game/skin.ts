/** Swaps the three skin colours of a body sheet for a player's own, leaving the kit untouched. Results are cached. */
export type Skin = [number, number, number][];

const cache = new Map<string, HTMLCanvasElement>();

const sameSkin = (a?: Skin | null, b?: Skin | null) => !a || !b || JSON.stringify(a) === JSON.stringify(b);

export function recolor(key: string, image: CanvasImageSource & { width: number; height: number }, from: Skin, to: Skin) {
  const id = `${key}|${to.join()}`;
  let c = cache.get(id);
  if (!c) {
    c = document.createElement('canvas');
    c.width = image.width;
    c.height = image.height;
    const ctx = c.getContext('2d', { willReadFrequently: true })!;
    ctx.drawImage(image, 0, 0);
    const px = ctx.getImageData(0, 0, c.width, c.height);
    const d = px.data;
    for (let i = 0; i < d.length; i += 4) {
      if (!d[i + 3]) continue;
      for (let k = 0; k < 3; k++) {
        if (d[i] === from[k][0] && d[i + 1] === from[k][1] && d[i + 2] === from[k][2]) {
          [d[i], d[i + 1], d[i + 2]] = to[k];
          break;
        }
      }
    }
    ctx.putImageData(px, 0, 0);
    cache.set(id, c);
  }
  return c;
}

/** Phaser texture key of a body sheet in this player's skin; the base key when the colours already match. */
export function skinnedTexture(scene: Phaser.Scene, base: string, frame: { frameW: number; frameH: number }, from?: Skin | null, to?: Skin | null) {
  if (sameSkin(from, to)) return base;
  const key = `${base}|${to!.join()}`;
  if (!scene.textures.exists(key)) {
    const src = scene.textures.get(base).getSourceImage() as HTMLImageElement;
    scene.textures.addSpriteSheet(key, recolor(base, src, from!, to!) as unknown as HTMLImageElement, { frameWidth: frame.frameW, frameHeight: frame.frameH });
  }
  return key;
}

export const skinDiffers = (from?: Skin | null, to?: Skin | null) => !sameSkin(from, to);
